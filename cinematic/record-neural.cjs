const {readFileSync,writeFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');

async function record() {
  const {KokoroTTS}=require(process.env.KOKORO_MODULE || 'kokoro-js');
  const sources=['cinematic/archive-data.js','cinematic/story.js'];
  const dialogue=runInNewContext(sources.map(path=>readFileSync(path,'utf8')).join('\n')+'\nlines');
  const tts=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu'});
  const roles={
    'MISSION CONTROL':'af_heart',
    'E.D.I.T.H.':'af_sky',
    'YUVA':'af_nicole',
    'NEWS REPORTER':'af_heart'
  };
  const selected=process.argv.slice(2);
  for(const [id,[role,line]] of Object.entries(dialogue)){
    if(selected.length&&!selected.includes(id))continue;
    const text=line.replaceAll('ALSEP','Al-sep').replaceAll('2026','twenty twenty-six')
      .replaceAll('E.D.I.T.H.','Edith');
    const speed=role==='E.D.I.T.H.'?1.04:role==='YUVA'?1.02:.85;
    const sound=await tts.generate(text,{voice:roles[role],speed});
    const {audio,sampling_rate:rate}=sound;
    if(audio.length<2048)throw Error('Missing audio for '+id);
    const wav=Buffer.alloc(44+audio.length*2);
    wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
    wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
    wav.writeUInt32LE(rate,24);wav.writeUInt32LE(2*rate,28);
    wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(audio.length*2,40);
    audio.forEach((sample,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+i*2));
    writeFileSync('cinematic/assets/'+id+'.wav',wav);
    console.log(id+' · '+roles[role]);
  }
}

record().catch(error=>{console.error(error);process.exitCode=1;});
