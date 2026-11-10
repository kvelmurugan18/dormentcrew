'use strict';
const $=id=>document.getElementById(id);
const screen=$('screen'), canvas=$('world'), film=$('film');
const voice = new Audio(), score = new Audio('cinematic/assets/score.wav');
score.loop=true;score.volume=.21;
let muted=false, captions=false, paused=false, resumeFocus, activeVoice='', started=false;
let mode='menu', field, index=0, sequence=null, sequenceNext, shotIndex=0, shotTime=0, totalTime=0;
let renderer, orbit, lunar, martian, arrival;
const camera=new T.PerspectiveCamera(52,1,.08,480);
let clock=0, previous=performance.now();
const player={x:0,z:8,yaw:0,facing:0,move:0};
let near=false, warning=0, dragging=null, filmPlaying=false, routeStep=0;
const held=new Set(), touches=new Map();
const capture=new URLSearchParams(location.search).has('render');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const filmDuration=introClips.reduce((a,c)=>a+c.duration,0);
const openingPath='cinematic/assets/opening.webm';

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
    $('unsupported').hidden=false;
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
  $('subtitles').hidden=!captions||!lines[activeVoice];
  if(lines[activeVoice]){
    [$('speaker').textContent,$('speech').textContent]=lines[activeVoice];
  }
}
function talk(id){
  voice.pause();caption(id);
  if(!id||capture||filmPlaying)return;
  voice.src='cinematic/assets/'+id+'.wav';
  voice.play().catch(()=>{});
}
function changeMode(next){
  mode=next;
  screen.classList.toggle('playing',next==='field');
  screen.classList.toggle('mars',next==='field'&&field?.kind==='mars');
  $('menu').hidden=next!=='menu';
  $('cinema').hidden=next!=='movie';
  $('hud').hidden=next!=='field';
  $('visor').hidden=next!=='field'||field.kind!=='mars';
  $('end').hidden=next!=='end';
  $('sky-credit').hidden=true;
  $('pause').hidden=!started||next==='end';
  if(!reduce){
    $('cut').classList.remove('flash');void $('cut').offsetWidth;$('cut').classList.add('flash');
  }
}
function enterShot(clip){
  $('scene-name').textContent=clip.label;
  $('feed').textContent=clip.label;
  $('sky-credit').hidden=clip.shot!=='stars';
  talk(clip.voice);
}
function showSequence(clips,onDone){
  sequence=clips;sequenceNext=onDone;shotIndex=0;shotTime=0;totalTime=0;
  $('time').style.width='0%';changeMode('movie');enterShot(clips[0]);
  if(!capture)$('skip').focus({preventScroll:true});
}
function nextSequence(){
  if(!sequence)return;
  const done=sequenceNext;
  sequence=null;film.pause();filmPlaying=false;film.hidden=true;
  talk('');done();
}
function showIntro(){
  if(!film.error&&!capture){
    film.currentTime=0;filmPlaying=true;film.hidden=false;
    score.pause();film.play().catch(()=>{
      if(!filmPlaying)return;
      filmPlaying=false;film.hidden=true;score.play().catch(()=>{});
      if(sequence)enterShot(sequence[shotIndex]);
    });
  }
  showSequence(introClips,()=>enterField('moon'));
}
function updateSequence(dt){
  if(!sequence)return;
  const length=sequence.reduce((sum,clip)=>sum+clip.duration,0);
  if(filmPlaying){
    if(film.ended){nextSequence();return;}
    totalTime=film.currentTime;
  }else totalTime+=dt;
  if(totalTime>=length){nextSequence();return;}
  let offset=totalTime, index=0;
  while(offset>=sequence[index].duration){offset-=sequence[index++].duration;}
  if(index!==shotIndex){shotIndex=index;enterShot(sequence[index]);}
  shotTime=offset;
  $('time').style.width=(totalTime/length*100)+'%';
}
function enterField(kind){
  field=zone(kind);index=0;
  Object.assign(player,{x:0,z:8,yaw:0,facing:0,move:0});
  field.models.at(-1).userData.signal.material=amber;
  for(const markers of field.beacons)for(const beacon of markers)beacon.visible=false;
  changeMode('field');objective();talk(kind==='moon'?'moonStart':'marsStart');
  if(!capture)score.play().catch(()=>{});
  canvas.focus({preventScroll:true});
}
function objective(){
  const stop=field.stops[index], isMars=field.kind==='mars';
  near=false;warning=0;routeStep=0;
  $('feed').textContent=isMars?'ECHO-7 · OPTICAL FEED':'ARIA MORGAN · LUNAR SURFACE';
  $('actor').textContent=(isMars?'ECHO-7 POV':'ARIA · EVA')+' / '+(index+1)+' OF '+field.stops.length;
  $('target').textContent=stop.label;
  $('steps').innerHTML=field.stops.map((_,i)=>'<i class="'+(i===index?'active':i<index?'done':'')+'"></i>').join('');
  field.beacons.forEach((markers,i)=>markers.forEach(beacon=>{beacon.visible=i===index;}));
  $('hint').textContent='';$('interact').hidden=true;
  $('interact').textContent=stop.id.endsWith('Relay')?'Activate relay · F':'Inspect · F';
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
  const active=Math.hypot(x,y)>0, pace=isMars?7.7:6.7;
  if(active){
    const length=Math.hypot(x,y);x/=length;y/=length;
    const dx=x*Math.cos(player.yaw)-y*Math.sin(player.yaw);
    const dz=-x*Math.sin(player.yaw)-y*Math.cos(player.yaw);
    const nx=clamp(player.x+dx*dt*pace,-30,30), nz=clamp(player.z+dz*dt*pace,-68,22);
    if(withinProtection(nx,nz))warning=.85;
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
  const hint=warning>0?'Protected ground. Follow the cyan beacons.':near?'Waypoint reached':'';
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
function interact(){
  if(mode!=='field'||paused||!near)return;
  held.clear();touches.clear();
  const stop=field.stops[index];
  showSequence([clip('inspect',stop.id,stop.label.toUpperCase())],()=>{
    field.models[index]?.userData.signal && (field.models[index].userData.signal.material=cyan);
    index++;
    if(index===field.stops.length){
      if(field.kind==='moon')showSequence(callClips,()=>enterField('mars'));
      else showSequence(returnClips,finish);
    }else{
      changeMode('field');objective();canvas.focus({preventScroll:true});
    }
  });
}
function finish(){
  changeMode('end');$('feed').textContent='MISSION COMPLETE · EARTH';
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
  if(stop.id.endsWith('Relay')){
    model.rotation.y=Math.PI*.85-mix(.9,0,smooth(t));
    const signal=model.userData.signal;
    signal.material=t>.7?cyan:amber;
    signal.scale.setScalar(1+Math.max(0,t-.68)*.6*Math.sin(clock*11));
    if(isMars){
      actor.position.set(mix(player.x,x-1.8,smooth(t)),ground,mix(player.z,z+2,smooth(t)));
      actor.userData.arm.rotation.x=-.45*Math.sin(t*Math.PI);
      actor.userData.head.rotation.y=-.16+Math.sin(t*7)*.3;
    }else{
      actor.position.set(mix(player.x,x-1,smooth(t)),ground,mix(player.z,z+1.25,smooth(t)));
      actor.userData.walk(clock,t<.5?.45:0);
    }
  }
  const distance=stop.id==='ridge'?13:stop.id==='opportunity'?7.8:stop.id==='surveyor'?7.6:5.6;
  const a=mix(.76,.08,t);
  look(camera,center,V(x+Math.sin(a)*distance,ground+2.5+(stop.id==='ridge'?2.8:0),z+Math.cos(a)*distance),45);
  return scene;
}
function callShot(shot,t){
  const link=shot==='cameraLink';
  const isEcho=shot==='callEcho'||link;
  const world=zone(isEcho?'mars':'moon'),{actor,kind,scene}=world;
  const x=isEcho?-1.5:6.6,z=isEcho?4:-53.5,y=heightAt(x,z,kind);
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
  if(['callAria','callEcho','callBack','cameraLink'].includes(shot))return callShot(shot,t);
  if(shot==='reunion')return arrivalShot(arrival??=arrivalWorld(),camera,t,clock);
  return spaceShot(orbit,camera,shot,t);
}
function draw(dt){
  if(filmPlaying)return;
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
    if(!paused)updatePlayer(dt);
    scene=field.scene;
  }else if(mode==='movie'&&sequence){
    const shot=sequence[shotIndex];
    scene=drawShot(shot.shot,clamp(shotTime/shot.duration,0,1));
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
  if(!paused){
    clock+=dt;
    if(mode==='movie')updateSequence(elapsed);
    if(mode==='field'&&activeVoice&&voice.ended)caption('');
  }
  draw(paused?0:dt);
  requestAnimationFrame(frame);
}
function togglePause(){
  if(!started||mode==='end')return;
  paused=!paused;
  held.clear();touches.clear();
  $('paused').hidden=!paused;
  if(paused){
    resumeFocus=document.activeElement;
    voice.pause();score.pause();film.pause();$('resume').focus();
  }else{
    if(filmPlaying)film.play().catch(()=>{});
    else{
      score.play().catch(()=>{});
      if(activeVoice&&!voice.ended)voice.play().catch(()=>{});
    }
    (resumeFocus||canvas).focus({preventScroll:true});
  }
}
const controls={
  KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',
  KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyQ:'turnLeft',KeyE:'turnRight'
};
function start(){
  if(!renderer)return;
  started=true;paused=false;
  score.play().catch(()=>{});
  showIntro();
}
function reset(){
  started=false;sequence=null;talk('');score.pause();lunar=martian=arrival=undefined;
  surveyorEcho=ascentEcho=seismogram=undefined;
  changeMode('menu');$('feed').textContent='AURORA MISSION FILM';$('start').focus();
}
canvas.tabIndex=0;
$('start').addEventListener('click',start);
$('again').addEventListener('click',reset);
$('skip').addEventListener('click',nextSequence);
$('resume').addEventListener('click',togglePause);
$('pause').addEventListener('click',togglePause);
$('interact').addEventListener('click',interact);
$('audio').addEventListener('click',()=>{muted=!muted;setAudio();});
$('captions').addEventListener('click',()=>{
  captions=!captions;$('captions').setAttribute('aria-pressed',String(captions));caption(activeVoice);
});
addEventListener('keydown',event=>{
  if(event.code==='Escape'&&started&&!event.repeat){
    event.preventDefault();togglePause();return;
  }
  if(mode!=='field'||paused)return;
  if(controls[event.code]){event.preventDefault();held.add(controls[event.code]);}
  if(event.code==='KeyF'&&!event.repeat){event.preventDefault();interact();}
});
addEventListener('keyup',event=>{if(controls[event.code])held.delete(controls[event.code]);});
addEventListener('blur',()=>{held.clear();touches.clear();});
for(const control of document.querySelectorAll('[data-move]')){
  control.addEventListener('pointerdown',event=>{
    if(mode!=='field'||paused)return;
    event.preventDefault();control.setPointerCapture(event.pointerId);
    touches.set(event.pointerId,control.dataset.move);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    control.addEventListener(type,event=>touches.delete(event.pointerId));
  }
}
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='field'||paused)return;
  canvas.setPointerCapture(event.pointerId);dragging=event.clientX;
});
canvas.addEventListener('pointermove',event=>{
  if(dragging===null||mode!=='field'||paused)return;
  player.yaw+=(dragging-event.clientX)*.0065;
  dragging=event.clientX;
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{dragging=null;});
addEventListener('resize',resize);
film.src=openingPath;
film.addEventListener('loadeddata',()=>{if(!renderer)$('watch').hidden=false;});
$('watch').addEventListener('click',()=>{
  $('unsupported').hidden=true;film.hidden=false;film.controls=true;film.play().catch(()=>{});
});
if(initRenderer()){
  if(capture){
    window.renderOpening=(second)=>{
      clock=second;
      let t=second, i=0;
      while(i<introClips.length-1&&t>=introClips[i].duration)t-=introClips[i++].duration;
      const c=introClips[i];
      renderer.render(drawShot(c.shot,clamp(t/c.duration,0,1)),camera);
    };
    window.openingClips=introClips;
  }else requestAnimationFrame(frame);
}

