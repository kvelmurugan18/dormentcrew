const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {renameSync,statSync}=require('node:fs');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');

async function render(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,
    args:['--enable-unsafe-swiftshader']});
  let encoder;
  try{
    const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
    page.on('pageerror',console.error);
    await page.goto(pathToFileURL(resolve('index.html')).href+'?render');
    await page.waitForFunction(()=>typeof window.renderOpening==='function');
    const clips=await page.evaluate(()=>openingClips);
    const fps=24, length=clips.reduce((sum,c)=>sum+c.duration,0);
    const args=['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0',
      '-stream_loop','-1','-i','cinematic/assets/score.wav'];
    let offset=0;
    const filters=['[1:a]volume=0.23[score]'];
    for(const [i,clip] of clips.entries()){
      args.push('-i','cinematic/assets/'+clip.voice+'.wav');
      filters.push('['+(i+2)+':a]adelay='+Math.round(offset*1000)+':all=1[v'+i+']');
      offset+=clip.duration;
    }
    filters.push('[score]'+clips.map((_,i)=>'[v'+i+']').join('')+'amix=inputs='+(clips.length+1)+':normalize=0,alimiter=limit=.94[a]');
    const output='cinematic/assets/opening.partial.webm';
    encoder=spawn(process.env.FFMPEG_PATH||'ffmpeg',[...args,'-filter_complex',filters.join(';'),
      '-map','0:v','-map','[a]','-t',String(length),'-c:v','libvpx','-pix_fmt','yuv420p',
      '-deadline','good','-cpu-used','6','-b:v','2200k','-threads','4',
      '-c:a','libopus','-b:a','112k',output],{stdio:['pipe','inherit','inherit'],windowsHide:true});
    const completion=once(encoder,'close');
    void completion.catch(()=>{});
    encoder.stdin.on('error',e=>console.error('Encoder input:',e.message));
    const count=Math.ceil(length*fps);
    for(let start=0;start<count;start+=8){
      const frames=await page.evaluate(({start,end,fps})=>{
        const frames=[];
        for(let n=start;n<end;n++){
          renderOpening(n/fps);
          frames.push(document.getElementById('world').toDataURL('image/jpeg',.9).split(',')[1]);
        }
        return frames;
      },{start,end:Math.min(count,start+8),fps});
      for(const frame of frames){
        if(!encoder.stdin.write(Buffer.from(frame,'base64')))await once(encoder.stdin,'drain');
      }
      if(start%(fps*6)===0)console.log('Rendered '+(start/fps).toFixed(0)+' / '+length.toFixed(0)+' seconds');
    }
    encoder.stdin.end();
    const [status]=await completion;
    if(status!==0||statSync(output).size<100000)throw Error('Opening video encoding failed');
    renameSync(output,'cinematic/assets/opening.webm');
    console.log('Saved opening.webm with '+count+' rendered frames and mixed dialogue.');
  }finally{
    if(encoder&&encoder.exitCode===null)encoder.kill();
    await browser.close();
  }
}
render().catch(e=>{console.error(e);process.exitCode=1;});
