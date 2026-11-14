'use strict';
const $=id=>document.getElementById(id);
const screen=$('screen'), canvas=$('world'), film=$('film'), interviewVideo=$('interview-video');
const voice = new Audio(), score = new Audio();
score.loop=true;score.volume=.21;
let muted=false, captions=true, paused=false, resumeFocus, activeVoice='', started=false;
let mode='menu', field, index=0, sequence=null, sequenceNext, shotIndex=0, shotTime=0, totalTime=0;
let renderer, orbit, lunar, martian, arrival;
const camera=new T.PerspectiveCamera(52,1,.08,480);
let clock=0, previous=performance.now();
const player={x:0,z:8,yaw:0,facing:0,move:0};
let near=false, warning=0, dragging=null, filmPlaying=false, routeStep=0;
const held=new Set(), touches=new Map();
const capture=new URLSearchParams(location.search).has('render');
let filmGeneration=0;
let failedMedia='';
let dialogueCues=[];
let visibleCue=-1;

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let autoNavigate=false;
const escapeStage = () => !paused && !$('archive').open;

function cueScore(track){
  const url='cinematic/assets/'+track+'.wav';
  if(score.getAttribute('src')!==url)score.src=url;
  if(!capture&&!paused&&!filmPlaying)score.play().catch(()=>{});
}

function initRenderer(){
  try{
    renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:capture});
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    resize();
    orbit=orbitalWorld();
    return true;
  }catch(error){
    console.error('Unable to initialize the 3D scene.',error);
    return false;
  }
}
function resize(){
  if(!renderer)return;
  const w=screen.clientWidth,h=screen.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,1920/w));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
}
function zone(kind){
  if(kind==='moon')return lunar??=surface('moon');
  return martian??=surface('mars');
}
function setAudio(){
  voice.muted=score.muted=film.muted=muted;
  $('audio').setAttribute('aria-pressed',String(muted));
  $('audio').textContent=muted?'Muted':'Sound on';
}
function caption(id){
  activeVoice=id||'';
  const line=lines[activeVoice];
  $('subtitles').hidden=!captions||!line;
  dialogueCues=[];
  visibleCue=-1;
  if(!line)return;
  $('speaker').textContent=line[0];
  const parts=line[1].split(/(?<=[.!?])\s+(?=[A-Z])/);
  const words=part=>part.trim().split(/\s+/).length;
  const totalWords=parts.reduce((count,part)=>count+words(part),0);
  const duration=voiceTimes[activeVoice]||3;
  let end=0;
  dialogueCues=parts.map(part=>{
    end+=words(part)/totalWords*duration;
    return {text:part,end};
  });
  updateCaption(0);
}
function updateCaption(second){
  if(!dialogueCues.length)return;
  const cue=dialogueCues.findIndex(segment=>second<segment.end);
  if(cue===visibleCue)return;
  visibleCue=cue;
  $('subtitles').hidden=!captions||cue<0;
  if(cue>=0)$('speech').textContent=dialogueCues[cue].text;
}
function talk(id){
  voice.pause();caption(id);
  if(!id||capture||filmPlaying)return;
  voice.src='cinematic/assets/'+id+'.wav?v=2026';
  voice.play().catch(()=>{});
}
function changeMode(next){
  if(next!=='quiz'&&next!=='end'){
    interviewVideo.pause();
    interviewVideo.hidden=true;
  }
  mode=next;
  screen.dataset.mode=next;
  $('ambient-particles').hidden=next!=='menu'&&next!=='end';
  $('interview').hidden=next!=='quiz';
  $('menu-sources').hidden=next!=='menu';
  $('news').hidden=true;
  $('chapter-card').hidden=true;
  $('film-error').hidden=true;
  $('scene-credit').hidden=true;
  displayPlate('',false);
  autoNavigate=false;
  screen.classList.toggle('playing',next==='field');
  screen.classList.toggle('mars',next==='field'&&field?.kind==='mars');
  $('menu').hidden=next!=='menu';
  $('cinema').hidden=next!=='movie';
  $('hud').hidden=next!=='field';
  $('visor').hidden=next!=='field'||field.kind!=='mars';
  $('end').hidden=next!=='end';
  $('sky-credit').hidden=true;
  $('pause').hidden=!started||next==='end';
  if(next==='field')cueScore('score-'+field.kind);
  if(!reduce){
    $('cut').classList.remove('flash');void $('cut').offsetWidth;$('cut').classList.add('flash');
  }
}
function displayPlate(art,generated) {
  const image=$('plate');
  image.hidden=!art;
  image.style.transform='';
  image.style.backgroundImage=art ? 'url("'+finalAssets+art+'")' : '';
  $('art-credit').hidden=!generated;
}
function enterShot(clip){
  $('scene-name').textContent=clip.label;
  $('feed').textContent=clip.label;
  displayPlate('',false);
  $('news').hidden=!clip.news;
  if(clip.chapter){
    $('chapter-number').textContent=clip.chapter[0];
    $('chapter-title').textContent=clip.chapter[1];
  }
  const credit=$('scene-credit');
  credit.hidden=!clip.credit;
  if(clip.credit){
    credit.textContent=clip.credit.credit;
    credit.href=clip.credit.source;
  }
  $('sky-credit').hidden=filmPlaying||clip.shot!=='stars';
  talk(clip.voice);
}
function showSequence(clips,onDone,media=''){
  sequence=clips;
  sequenceNext=onDone;
  shotIndex=0;
  shotTime=0;
  totalTime=0;
  const generation=++filmGeneration;
  filmPlaying=Boolean(media)&&!capture;
  $('time').style.width='0%';
  changeMode('movie');
  enterShot(clips[0]);
  if(filmPlaying){
    failedMedia=media;
    score.pause();
    film.src=finalAssets+media+'.mp4?v=mars-day';
    film.hidden=false;
    film.play().catch(()=>{
      if(generation===filmGeneration) recoverFilm();
    });
  }
  if(!capture)$('skip').focus({preventScroll:true});
}
function recoverFilm(){
  if(!sequence||!filmPlaying)return;
  filmPlaying=false;
  film.hidden=true;
  if(!renderer){
    $('film-error').hidden=false;
    caption('');
    return;
  }
  if(!paused){
    cueScore(soundtrackFor(failedMedia));
    enterShot(sequence[shotIndex]);
  }
}
film.addEventListener('error',recoverFilm);
function nextSequence(){
  if(!sequence)return;
  const done=sequenceNext;
  ++filmGeneration;
  sequence=null;
  film.pause();
  filmPlaying=false;
  film.hidden=true;
  film.removeAttribute('src');
  film.load();
  talk('');
  done();
}
function showIntro(){
  showSequence(introClips,()=>enterField('moon'),'opening-film');
}
function updateSequence(dt){
  if(!sequence||!$('film-error').hidden)return;
  const length=sequence.reduce((sum,clip)=>sum+clip.duration,0);
  if(filmPlaying){
    if(film.ended){nextSequence();return;}
    totalTime=film.currentTime;
  }else totalTime+=dt;
  if(totalTime>=length){nextSequence();return;}
  let offset=totalTime,index=0;
  while(offset>=sequence[index].duration){offset-=sequence[index++].duration;}
  if(index!==shotIndex){shotIndex=index;enterShot(sequence[index]);}
  shotTime=offset;
  $('chapter-card').hidden=!sequence[index].chapter||shotTime>=2.8;
  updateCaption(shotTime);
  $('time').style.width=(totalTime/length*100)+'%';
}
function enterField(kind,savedIndex=0){
  field=zone(kind);
  index=clamp(savedIndex,0,field.stops.length-1);
  const origin=index ? field.stops[index-1].point : [0,8];
  Object.assign(player,{x:origin[0],z:origin[1],yaw:0,facing:0,move:0});
  saveCheckpoint(kind,index);
  for(const markers of field.beacons)for(const beacon of markers)beacon.visible=false;
  changeMode('field');objective();talk(kind==='moon'?'moonStart':'marsStart');
  canvas.focus({preventScroll:true});
}
function objective(){
  const stop=field.stops[index], isMars=field.kind==='mars';
  near=false;warning=0;routeStep=0;
  $('feed').textContent=isMars?'E.D.I.T.H. · PERSEVERANCE VALLEY':'YUVA · OCEAN OF STORMS';
  $('actor').textContent=(isMars?'E.D.I.T.H. CAMERA':'YUVA · EVA')+' / '+(index+1)+' OF '+field.stops.length;
  $('target').textContent=stop.label;
  $('steps').innerHTML=field.stops.map((_,i)=>'<i class="'+(i===index?'active':i<index?'done':'')+'"></i>').join('');
  field.beacons.forEach((markers,i)=>markers.forEach(beacon=>{beacon.visible=i===index;}));
  $('hint').textContent='';$('interact').hidden=true;
  $('interact').textContent='Inspect · F';
  $('guide').textContent='Navigate';
}
function withinProtection(x,z){
  return field.stops.some(({radius,object:[a,b]})=>radius&&Math.hypot(x-a,z-b)<radius+.34);
}
function updatePlayer(dt){
  const stop=field.stops[index];
  const down=k=>held.has(k)||[...touches.values()].includes(k);
  const turn=Number(down('turnLeft'))-Number(down('turnRight'));
  player.yaw+=turn*dt*1.78;
  let x=Number(down('right'))-Number(down('left'));
  let y=Number(down('forward'))-Number(down('back'));
  const isMars=field.kind==='mars';
  const manual=Math.hypot(x,y)>0||turn!==0;
  if(manual&&autoNavigate){
    autoNavigate=false;
    $('guide').textContent='Navigate';
  }
  if(autoNavigate){
    const destination=(stop.via||[])[routeStep]||stop.point;
    const dx=destination[0]-player.x,dz=destination[1]-player.z;
    if(Math.hypot(dx,dz)<2){
      autoNavigate=false;
      $('guide').textContent='Navigate';
    }else{
      const target=Math.atan2(-dx,-dz);
      const rotation=Math.atan2(Math.sin(target-player.yaw),Math.cos(target-player.yaw));
      player.yaw+=rotation*Math.min(1,dt*6);
      y=Math.abs(rotation)<.5 ? 1 : 0;
    }
  }
  const active=Math.hypot(x,y)>0, pace=isMars?6.7:4.9;
  if(active){
    const length=Math.hypot(x,y);x/=length;y/=length;
    const dx=x*Math.cos(player.yaw)-y*Math.sin(player.yaw);
    const dz=-x*Math.sin(player.yaw)-y*Math.cos(player.yaw);
    const nx=clamp(player.x+dx*dt*pace,-30,30), nz=clamp(player.z+dz*dt*pace,-68,22);
    if(withinProtection(nx,nz)){
      autoNavigate=false;
      $('guide').textContent='Navigate';
      warning=.85;
    }
    else{player.x=nx;player.z=nz;}
    const angle=Math.atan2(-dx,-dz);
    player.facing+=Math.atan2(Math.sin(angle-player.facing),Math.cos(angle-player.facing))*Math.min(dt*10,1);
  }
  player.move=mix(player.move,active?1:0,Math.min(1,dt*11));
  warning=Math.max(0,warning-dt);
  const via=stop.via||[];
  let point=via[routeStep]||stop.point;
  let range=Math.hypot(player.x-point[0],player.z-point[1]);
  if(routeStep<via.length&&range<3){
    point=via[++routeStep]||stop.point;
    range=Math.hypot(player.x-point[0],player.z-point[1]);
  }
  const wasNear=near;near=routeStep===via.length&&range<2.45;
  if(near!==wasNear)$('interact').hidden=!near;
  const hint=warning>0?'Protected ground. Follow the route markers.':near?'Waypoint reached':'';
  if($('hint').textContent!==hint)$('hint').textContent=hint;
  drawPlayerCamera(isMars,dt);
  placeMarker(point,range);
}
function drawPlayerCamera(isMars,dt){
  const {actor,kind}=field;
  const y=heightAt(player.x,player.z,kind);
  actor.position.set(player.x,y,player.z);
  actor.visible=!isMars;actor.rotation.y=player.facing;
  if(!isMars)actor.userData.walk(clock,player.move);
  const f=V(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const r=V(-f.z,0,f.x);
  const anchor=actor.position.clone();
  if(isMars){
    const eye=anchor.clone().add(V(0,1.6+(reduce?0:Math.sin(clock*10)*player.move*.024),0)).addScaledVector(f,.35);
    look(camera,eye.clone().addScaledVector(f,16).add(V(0,-1.8,0)),eye,60);
  }else{
    const eye=anchor.clone().addScaledVector(f,-6).addScaledVector(r,1.35).add(V(0,3.05,0));
    const point=anchor.clone().addScaledVector(f,5.2).add(V(0,1.03,0));
    look(camera,point,eye,56);
  }
}
function placeMarker([x,z],range){
  const point=V(x,heightAt(x,z,field.kind)+1.26,z);
  camera.updateMatrixWorld();
  const local=point.clone().applyMatrix4(camera.matrixWorldInverse);
  point.project(camera);
  const visible=local.z<0&&Math.abs(point.x)<.93&&Math.abs(point.y)<.79;
  $('marker').hidden=!visible;
  $('heading-arrow').hidden=visible||near;
  if(visible){
    $('marker').style.left=((point.x*.5+.5)*100)+'%';
    $('marker').style.top=((-point.y*.5+.5)*100)+'%';
    $('marker').lastElementChild.textContent=Math.ceil(range)+' m';
  }else{
    const direction=Math.atan2(local.x,-local.z);
    $('heading-arrow').style.transform='translateX(-50%) rotate('+direction+'rad)';
  }
}
const deepArchive = ['dawn','near','pioneer10','pioneer11','kepler'];

function startReturn(){
  saveCheckpoint('return');
  showArchive(deepArchive,()=>showSequence(returnClips,startInterview,'return-film'));
}

function interact(){
  if(mode!=='field'||!escapeStage()||!near)return;
  const {id}=field.stops[index];
  const clips=recordShots[id];
  const advance=()=>{
    if(++index < field.stops.length){
      saveCheckpoint(field.kind,index);
      changeMode('field');
      objective();
      canvas.focus({preventScroll:true});
      return;
    }
    if(field.kind==='moon'){
      showSequence(callClips,()=>enterField('mars'),'transfer-film');
    }else{
      startReturn();
    }
  };
  const title=field.kind==='moon' ? 'Lunar field inspection' : 'Mars field inspection';
  const open=voice=>showArchive(inspectionRecords[id],advance,{title,voice,replay});
  const replay=()=>showSequence(clips,()=>{
    changeMode('field');
    open('');
  },'record-'+id);
  open(clips[0].voice);
}

function finish(){
  talk('');
  clearCheckpoint();
  changeMode('end');
  $('feed').textContent='EARTH · 2026 · INTERVIEW COMPLETE';
  $('scoreline').textContent=scoreCount+' / '+questions.length+' correct on the first answer';
  $('again').focus({preventScroll:true});
}

let surveyorEcho, ascentEcho, seismogram;
function lunarLanding(t){
  const world=zone('moon');
  const {landing,actor}=world;
  const ground=heightAt(5,14,'moon');
  landing.position.y=ground+(1-smooth(Math.min(t*1.34,1)))*8.5;
  burn(landing,t*10,t<.73);
  actor.visible=t>.79;
  if(actor.visible){
    actor.position.set(3.1-(t-.79)*4,ground,12.6);
    actor.rotation.y=.75;actor.userData.walk(clock,.5);
  }
  for(const markers of world.beacons)for(const beacon of markers)beacon.visible=false;
  look(camera,V(4.7,ground+.9+(1-t)*4.8,13),V(-3+t*3,ground+2.6+t*1.2,27-t*4),45);
  return world.scene;
}
function playInspection(t){
  const {kind,scene,stops,models,actor}=field;
  const stop=stops[index], model=models[index];
  const [x,z]=stop.object;
  const ground=heightAt(x,z,kind), center=V(x,ground+.91,z);
  const isMars=kind==='mars';
  actor.visible=true;
  actor.rotation.y=Math.atan2(player.x-x,player.z-z);
  if(stop.id==='surveyor'){
    surveyorEcho??=surveyorModel(scene);
    const first=t<.38?(1-smooth(t/.38))*4.6:0;
    const bounce=t>=.38&&t<.64?Math.sin((t-.38)/.26*Math.PI)*.92:
      t>=.64&&t<.81?Math.sin((t-.64)/.17*Math.PI)*.42:0;
    surveyorEcho.visible=t<.84;
    surveyorEcho.position.set(x,ground+first+bounce,z);
    surveyorEcho.rotation.y=model.rotation.y;
    model.visible=!surveyorEcho.visible;
    center.y+=Math.max(first*.95,.18);
  }
  if(stop.id==='apollo'){
    ascentEcho??=ascentStage(scene);
    ascentEcho.visible=t<.92;
    ascentEcho.position.set(x,ground+1.65+5.5*smooth(t),z);
    ascentEcho.rotation.y=model.rotation.y;
    center.y+=Math.min(2.9,2.8*t);
  }
  if(stop.id==='alsep'){
    if(!seismogram){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.BufferAttribute(new Float32Array(100*3),3));
      seismogram=new T.Line(g,new T.LineBasicMaterial({color:0x75f7dd,transparent:true,opacity:.88}));
      seismogram.frustumCulled=false;scene.add(seismogram);
    }
    seismogram.visible=true;
    const points=seismogram.geometry.attributes.position;
    for(let i=0;i<100;i++){
      const u=i/99,peak=Math.exp(-((u-.55)**2)*19)*Math.sin(i*.67-clock*7)*.43;
      points.setXYZ(i,x-2.6+5.2*u,ground+2.22+peak,z-.2);
    }
    points.needsUpdate=true;center.y+=.45;
  }
  const distance=stop.id==='ridge'?13:stop.id==='opportunity'?7.8:stop.id==='surveyor'?7.6:5.6;
  const a=mix(.76,.08,t);
  look(camera,center,V(x+Math.sin(a)*distance,ground+2.5+(stop.id==='ridge'?2.8:0),z+Math.cos(a)*distance),45);
  return scene;
}
function callShot(shot,t){
  const link=shot==='cameraLink';
  const isEcho=shot==='callEdith'||link;
  const world=zone(isEcho?'mars':'moon'),{actor,kind,scene}=world;
  const x=isEcho?-1.5:-7,z=isEcho?4:-38,y=heightAt(x,z,kind);
  actor.visible=true;actor.position.set(x,y,z);
  actor.rotation.y=Math.PI-.3;
  if(isEcho)actor.userData.head.rotation.y=.2*Math.sin(t*7);
  else actor.userData.walk(clock,0);
  const target=V(x,y+(isEcho?1.28:1.62),z);
  if(link){
    const closing=smooth(t);
    target.y=y+1.65;
    look(camera,target,V(x+mix(1.6,.15,closing),y+1.72,z+mix(3.5,.67,closing)),mix(43,36,closing));
  }else look(camera,target,V(x+mix(2.8,1.6,t),y+1.72,z+mix(4.8,3.5,t)),43);
  return scene;
}
function drawShot(shot,t){
  if(shot==='landing')return lunarLanding(t);
  if(shot==='inspect')return playInspection(t);
  if(['callYuva','callEdith','cameraLink'].includes(shot))return callShot(shot,t);
  if(shot==='reunion')return arrivalShot(arrival??=arrivalWorld(),camera,t,clock);
  return spaceShot(orbit,camera,shot,t);
}
function draw(dt){
  if(!renderer||filmPlaying||!interviewVideo.hidden||!$('plate').hidden)return;
  let scene;
  if(mode==='field'){
    if(surveyorEcho)surveyorEcho.visible=false;
    if(ascentEcho)ascentEcho.visible=false;
    if(seismogram)seismogram.visible=false;
    if(field.kind==='moon'){
      field.models[0].visible=true;
      field.landing.position.y=heightAt(5,14,'moon');
      burn(field.landing,0,false);
    }
    field.actor.visible=field.kind==='moon';
    if(escapeStage())updatePlayer(dt);
    scene=field.scene;
  }else if(mode==='movie'&&sequence){
    const shot=sequence[shotIndex];
    scene=directedShot(shot,clamp(shotTime/shot.duration,0,1),clock);
  }else if(mode==='quiz'){
    scene=interviewShot(.85,reduce?0:clock);
  }else if(mode==='end'){
    scene=arrivalShot(arrival??=arrivalWorld(),camera,1,clock);
  }else{
    scene=spaceShot(orbit,camera,'menu',reduce?.6:(Math.sin(clock*.14)+1)*.5);
  }
  renderer.render(scene,camera);
}
function frame(now){
  const elapsed=(now-previous)/1000;
  const dt=Math.min(elapsed,.05);
  previous=now;
  if(escapeStage()){
    clock+=dt;
    if(mode==='movie')updateSequence(elapsed);
    if((mode==='field'||mode==='quiz')&&activeVoice){
      if(voice.ended)caption('');
      else updateCaption(voice.currentTime);
    }
  }
  draw(paused?0:dt);
  requestAnimationFrame(frame);
}
function togglePause(){
  if(!started||mode==='end'||$('archive').open)return;
  paused=!paused;
  held.clear();touches.clear();
  $('paused').hidden=!paused;
  if(paused){
    resumeFocus=document.activeElement;
    voice.pause();score.pause();film.pause();interviewVideo.pause();$('resume').focus();
  }else{
    if(filmPlaying)film.play().catch(recoverFilm);
    else{
      score.play().catch(()=>{});
      if(activeVoice&&!voice.ended)voice.play().catch(()=>{});
      if(!interviewVideo.hidden)interviewVideo.play().catch(()=>{});
    }
    (resumeFocus||canvas).focus({preventScroll:true});
  }
}
const controls={
  KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',
  KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyQ:'turnLeft',KeyE:'turnRight'
};
function start(resume=false){
  started=true;paused=false;
  if(!renderer){offerLowGraphics(resume);return;}
  if(resume && checkpoint){
    visited=new Set(checkpoint.visited);
    if(checkpoint.chapter==='return'){startReturn();return;}
    if(checkpoint.chapter==='interview'){startInterview();return;}
    enterField(checkpoint.chapter,checkpoint.index);
    return;
  }
  visited=new Set();
  clearCheckpoint();
  showIntro();
}
function reset(){
  started=false;sequence=null;talk('');score.pause();
  changeMode('menu');
  displayPlate('apollo11-cover.jpg',false);
  $('art-credit').textContent='NASA · Apollo 11 · 1969';
  $('art-credit').hidden=false;
  $('feed').textContent='';
  $('start').focus();
}

function seedAmbientParticles(){
  const random=rng(2240);
  const particles=document.createDocumentFragment();
  for(let i=0;i<32;i++){
    const particle=document.createElement('i');
    particle.style.setProperty('--x',random()*100+'%');
    particle.style.setProperty('--y',(10+random()*100)+'%');
    particle.style.setProperty('--size',(1+random()*2.3)+'px');
    particle.style.setProperty('--light',.38+random()*.54);
    particle.style.setProperty('--time',(12+random()*13)+'s');
    particle.style.setProperty('--delay',(-random()*26)+'s');
    particles.append(particle);
  }
  $('ambient-particles').append(particles);
}
function offerLowGraphics(resume) {
  if(resume&&checkpoint?.chapter==='interview'){startInterview();return;}
  if(resume&&checkpoint?.chapter==='return'){startReturn();return;}
  saveCheckpoint('moon');
  showSequence(introClips,()=>showArchive(records.map(record=>record.id),()=>{
    showSequence(returnClips,startInterview,'return-film');
  }),'opening-film');
}

canvas.tabIndex=0;
$('start').addEventListener('click',()=>start());
$('continue').addEventListener('click',()=>start(true));
$('guide').addEventListener('click',()=>{
  autoNavigate=!autoNavigate;
  $('guide').textContent=autoNavigate?'Stop navigation':'Navigate';
  canvas.focus({preventScroll:true});
});
$('again').addEventListener('click',reset);
$('skip').addEventListener('click',nextSequence);
$('retry-film').addEventListener('click',()=>showSequence(sequence,sequenceNext,failedMedia));
$('resume').addEventListener('click',togglePause);
$('pause').addEventListener('click',togglePause);
$('interact').addEventListener('click',interact);
$('audio').addEventListener('click',()=>{muted=!muted;setAudio();});
$('captions').addEventListener('click',()=>{
  captions=!captions;
  $('captions').setAttribute('aria-pressed',String(captions));
  $('subtitles').hidden=!captions||visibleCue<0;
});
addEventListener('keydown',event=>{
  if(event.code==='Escape'&&started&&!event.repeat&&!$('archive').open){
    event.preventDefault();togglePause();return;
  }
  if(mode!=='field'||!escapeStage())return;
  if(controls[event.code]){event.preventDefault();held.add(controls[event.code]);}
  if(event.code==='KeyF'&&!event.repeat){event.preventDefault();interact();}
});
addEventListener('keyup',event=>{if(controls[event.code])held.delete(controls[event.code]);});
addEventListener('blur',()=>{held.clear();touches.clear();});
for(const control of document.querySelectorAll('[data-move]')){
  control.addEventListener('pointerdown',event=>{
    if(mode!=='field'||!escapeStage())return;
    event.preventDefault();control.setPointerCapture(event.pointerId);
    touches.set(event.pointerId,control.dataset.move);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    control.addEventListener(type,event=>touches.delete(event.pointerId));
  }
}
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='field'||!escapeStage())return;
  canvas.setPointerCapture(event.pointerId);dragging=event.clientX;
});
canvas.addEventListener('pointermove',event=>{
  if(dragging===null||mode!=='field'||paused)return;
  autoNavigate=false;
  $('guide').textContent='Navigate';
  player.yaw+=(dragging-event.clientX)*.0065;
  dragging=event.clientX;
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{dragging=null;});
addEventListener('resize',resize);
const canRender = initRenderer();
if(capture && canRender){
  window.filmSoundtrack=soundtrackFor;
  window.filmPlan={'opening-film':introClips,'transfer-film':callClips,'return-film':returnClips};
  for(const [id,shots] of Object.entries(recordShots))window.filmPlan['record-'+id]=shots;
  window.readyToRender=async name=>{
    for(const shot of window.filmPlan[name])directedShot(shot,.05,0);
    if(astronautAsset)await astronautAsset;
    if(roverAsset)await roverAsset;
    if(lunarModuleAsset)await lunarModuleAsset;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  };
  window.renderScene=(name,second)=>{
    clock=second;
    const clips=window.filmPlan[name];
    let t=second,i=0;
    while(i<clips.length-1&&t>=clips[i].duration)t-=clips[i++].duration;
    const shot=clips[i];
    const world=directedShot(shot,clamp(t/shot.duration,0,1),second);
    renderer.render(world,camera);
    return canvas.toDataURL('image/jpeg',.89).split(',')[1];
  };
}else{
  seedAmbientParticles();
  reset();
  $('continue').hidden=!checkpoint;
  requestAnimationFrame(frame);
}
bindPanels();
