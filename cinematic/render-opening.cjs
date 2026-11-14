const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {renameSync,statSync}=require('node:fs');
const {join}=require('node:path');

const assets='cinematic/assets/';
const target=assets+'final/';
const base=process.env.ECHOES_URL || 'http://127.0.0.1:8766/';
const assembleOnly=process.argv.includes('--assemble');
const requested=process.argv.slice(2).filter(argument=>argument!=='--assemble');
const archive=process.env.ECHOES_ARCHIVE_MEDIA;
const rate=24;
const ffmpeg=process.env.FFMPEG_PATH || 'ffmpeg';

const excerpts={
  'opening-film':[
    ['flightArchive',0,5.5,'echoes-artemis2.mp4',15,'crop=1728:972:96:0,'],
    ['signal',0,8,'echoes-cockpit.mp4',1,'hflip,eq=saturation=.65,'],
    ['signal',8,99,'echoes-orion.mp4',12],
    ['trainingMoon',0,7,'echoes-training.mp4',191],
    ['trainingMoon',7,16.9,'echoes-apollo12.m4v',0],
    ['trainingMars',6.4,99,'echoes-mars-storm.mp4',0],
    ['launch',0,4.5,'echoes-helmet.mp4',12,'hflip,eq=saturation=.65,'],
    ['launch',4.5,99,'echoes-artemis2.mp4',19.5,'crop=1728:972:96:0,'],
    ['split',0,5.5,'echoes-orion.mp4',43],
    ['landing',0,3,'echoes-orion.mp4',83]
  ],
  'transfer-film':[['moonReport',0,6.4,'echoes-helmet.mp4',4,'hflip,eq=saturation=.62,']],
  'record-apollo':[['apollo',0,9.65,'echoes-apollo12.m4v',0]],
  'record-alsep':[['lunarRepair',0,6,'echoes-apollo17.webm',4]],
  'return-film':[
    ['news',7,15.8,'echoes-cockpit.mp4',8.7,'hflip,eq=saturation=.65,'],
    ['imagine',0,5.65,'echoes-voyager-2.mp4',5],
    ['imagine',5.65,99,'echoes-voyager-5.mp4',1],
    ['record',0,9.8,'echoes-voyager-3.mp4',0],
    ['reunion',2,7.5,'echoes-cockpit.mp4',0,'hflip,eq=saturation=.6,']
  ]
};

function cueTime(clips,cue) {
  const index=clips.findIndex(clip=>(clip.id||clip.voice)===cue);
  if(index<0)throw Error('Unknown edit cue: '+cue);
  return clips.slice(0,index).reduce((sum,clip)=>sum+clip.duration,0);
}

async function transcode(args) {
  const child=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});
  const [code]=await once(child,'close');
  if(code!==0)throw Error('FFmpeg exited with status '+code);
}

async function assemble(name,clips) {
  const source=target+name+'.mp4';
  const archiveClips=excerpts[name];
  if(archive&&archiveClips){
    const input=['-i',source], filters=[], segments=[];
    let frame=0, archiveInput=0;
    function segment(input,start,end,preprocess='') {
      const label='segment'+segments.length;
      filters.push('['+input+':v]'+preprocess+'fps='+rate+',scale=1280:720,setsar=1,format=yuv420p,trim=start_frame='+start+
        (end===undefined?'':':end_frame='+end)+',setpts=PTS-STARTPTS['+label+']');
      segments.push('['+label+']');
    }
    for(const [cue,start,end,filename,sourceStart,preprocess] of archiveClips){
      const cut=cueTime(clips,cue);
      const length=clips.find(clip=>(clip.id||clip.voice)===cue).duration;
      const startFrame=Math.round((cut+start)*rate);
      const endFrame=Math.round((cut+Math.min(end,length))*rate);
      if(startFrame>=endFrame)continue;
      if(frame<startFrame)segment(0,frame,startFrame);
      input.push('-ss',String(sourceStart),'-i',join(archive,filename));
      segment(++archiveInput,0,endFrame-startFrame,preprocess);
      frame=endFrame;
    }
    segment(0,frame);
    filters.push(segments.join('')+'concat=n='+segments.length+':v=1:a=0[video]');
    const temporary=target+name+'.partial.mp4';
    await transcode([...input,'-filter_complex',filters.join(';'),'-map','[video]','-map','0:a','-c:a','copy',
      '-c:v','libx264','-preset','veryfast','-crf','21','-movflags','+faststart',temporary]);
    renameSync(temporary,source);
    console.log(name+' · archival motion added');
  }
  if(name==='return-film'){
    await transcode(['-ss',String(cueTime(clips,'reunion')+2.2),'-i',source,
      '-vf','trim=duration=3,split[f][r];[f]setpts=PTS-STARTPTS[a];[r]reverse,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0',
      '-an','-c:v','libx264','-preset','veryfast','-crf','23','-movflags','+faststart',target+'interview-loop.mp4']);
  }
}

async function encode(page,name,clips) {
  await page.evaluate(name=>readyToRender(name),name);
  await page.waitForLoadState('networkidle');
  const soundtrack=await page.evaluate(name=>window.filmSoundtrack(name),name);
  const length=clips.reduce((sum,clip)=>sum+clip.duration,0);
  const args=['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(rate),'-vcodec','mjpeg','-i','pipe:0',
    '-stream_loop','-1','-i',assets+soundtrack+'.wav'];
  const filters=['[1:a]volume=0.16[score]'];
  const audioInputs=['[score]'];
  let offset=0;
  for(const clip of clips) {
    if(clip.voice){
      args.push('-i',assets+clip.voice+'.wav');
      const label='v'+audioInputs.length;
      filters.push('['+(audioInputs.length+1)+':a]adelay='+Math.round(offset*1000)+':all=1['+label+']');
      audioInputs.push('['+label+']');
    }
    offset+=clip.duration;
  }
  filters.push(audioInputs.join('')+'amix=inputs='+audioInputs.length+':normalize=0,alimiter=limit=.9[a]');
  const temporary=target+name+'.partial.mp4';
  const encoder=spawn(ffmpeg,[...args,'-filter_complex',filters.join(';'),
    '-map','0:v','-map','[a]','-t',String(length),'-c:v','libx264','-pix_fmt','yuv420p',
    '-preset','veryfast','-crf','22','-threads','4','-c:a','aac','-b:a','112k','-movflags','+faststart',temporary],
    {stdio:['pipe','inherit','inherit'],windowsHide:true});
  const completion=once(encoder,'close');
  completion.catch(()=>{});
  const failed=new Promise((_,reject)=>{
    encoder.on('error',reject);
    encoder.stdin.on('error',reject);
  });
  failed.catch(()=>{});
  const count=Math.ceil(length*rate);
  try {
    for(let start=0;start<count;start+=8){
      const frames=await page.evaluate(({name,start,end,rate})=>{
        const frames=[];
        for(let frame=start;frame<end;frame++)frames.push(renderScene(name,frame/rate));
        return frames;
      },{name,start,end:Math.min(start+8,count),rate});
      for(const frame of frames){
        if(!encoder.stdin.write(Buffer.from(frame,'base64')))await Promise.race([once(encoder.stdin,'drain'),failed]);
      }
    }
    encoder.stdin.end();
    const [result]=await completion;
    if(result!==0||statSync(temporary).size<50000)throw Error('Film encoding failed: '+name);
    renameSync(temporary,target+name+'.mp4');
    console.log(name+' · '+length.toFixed(1)+' s · '+count+' rendered frames');
  } finally {
    if(encoder.exitCode===null)encoder.kill();
  }
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,
    args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    page.on('pageerror',e=>console.error(e.message));
    await page.goto(base+'?render');
    await page.waitForFunction(()=>typeof window.renderScene==='function');
    const plan=await page.evaluate(()=>window.filmPlan);
    const names=requested.length?requested:Object.keys(plan);
    for(const name of names) {
      if(!plan[name])throw Error('Unknown sequence: '+name);
      if(!assembleOnly)await encode(page,name,plan[name]);
      await assemble(name,plan[name]);
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
