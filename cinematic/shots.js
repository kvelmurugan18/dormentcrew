'use strict';
const clip=(shot,voice,label,duration)=>({shot,voice,label,duration:duration??((voiceTimes[voice]??0)+.48)});
const introClips=[
  clip('signal','signal','MISSION CONTROL · EARTH'),
  clip('launch','launch','WAYFARER · ASCENT'),
  clip('split','split','ORBITAL SEPARATION'),
  clip('landing','landing','LUNAR DESCENT · DAYS LATER')
];
const callClips=[
  clip('callAria','callAria','ARIA · LUNAR UPLINK'),
  clip('callEcho','callEcho','ECHO-7 · MARS · MONTHS LATER'),
  clip('callBack','callBack','ARIA · DELAYED REPLY'),
  clip('cameraLink',null,'ECHO-7 · OPTICAL HANDOFF',1.65)
];
const returnClips=[
  clip('depart','depart','EARTHBOUND · TRANSFER'),
  clip('voyager','voyager','ARCHIVE · VOYAGER FLYBYS'),
  clip('record','record','ARCHIVE · THE GOLDEN RECORD'),
  clip('stars','stars','ARCHIVE · INTERSTELLAR SPACE'),
  clip('earth','earth','EARTH · ARRIVAL'),
  clip('reunion','reunion','EARTH · RECOVERY SITE')
];
function look(camera,at,from,fov=48){
  camera.position.copy(from);
  camera.fov=fov;camera.updateProjectionMatrix();
  camera.lookAt(at);
}
function burn(s,t,enabled=true){
  s.userData.plume.visible=enabled;
  if(enabled)s.userData.plume.scale.set(.86+.13*Math.sin(t*32),.92+.18*Math.sin(t*20),.86+.13*Math.sin(t*32));
}
function spaceShot(orbit,camera,shot,t){
  const {scene,earth,moon,mars,giants,rocket,one,two,probe,disc,sky,objects}=orbit;
  for(const object of objects)object.visible=false;
  for(const p of [earth,moon,mars,...giants])p.children[0].rotation.y=-1+t*.36;
  if(shot==='signal'||shot==='menu'){
    earth.visible=one.visible=true;
    earth.position.set(-18,-15,-35);
    one.position.set(-.4,.45,0);one.rotation.set(.5,-.45,1.07+t*.28);
    burn(one,t,false);
    look(camera,V(-.8,0,0),V(6-4*t,2.1,7.5+t*2),45);
  }else if(shot==='launch'){
    earth.visible=rocket.visible=true;
    earth.position.set(3,-15,-31);
    rocket.position.set(-1,-1+t*3.6,0);
    rocket.rotation.set(-.12,.48,t*-.68-.09);
    burn(rocket,t*10);
    look(camera,V(-.4,t*2.7,0),V(7-t*3,1.6+t*4,16-t*2),48);
  }else if(shot==='split'){
    earth.visible=moon.visible=mars.visible=one.visible=two.visible=true;
    earth.position.set(-4,-19,-58);moon.position.set(-21,6,-61);mars.position.set(35,5,-93);
    one.position.set(-.42-4.6*smooth(t),.15+1.4*t,0);
    two.position.set(.51+4.4*smooth(t),-.18-.77*t,.35);
    one.rotation.set(.3,.32,.77);two.rotation.set(.18,-.55,-1.08);
    burn(one,t*10,t>.28);burn(two,t*10,t>.32);
    look(camera,V(0,.55,-1),V(4-t*3,2+t,10+t*5),44);
  }else if(shot==='depart'||shot==='earth'){
    earth.visible=one.visible=two.visible=true;
    earth.position.set(shot==='earth'?1:-10,shot==='earth'?-9:-14,shot==='earth'?-24:-50);
    one.position.set(-1.65,.1+t*.51,-t*3);
    two.position.set(1.65,-.72+t*.4,-1.6-t*2.4);
    one.rotation.set(1.2,.2,.18);two.rotation.set(1.34,-.15,-.19);
    burn(one,t*10,t<.53);burn(two,t*10,t<.53);
    look(camera,V(0,.3,-2-t*2),V(5-t*2,2.4,8-t*2),49);
  }else if(shot==='voyager'||shot==='stars'){
    probe.visible=true;
    probe.position.set(-.7-.42*t,.32,0);probe.rotation.set(.6,.8+t*.65,-.73);
    if(shot==='voyager'){
      const i=Math.min(3,Math.floor(t*4));
      const p=giants[i];p.visible=true;p.position.set(6-3*(t*4%1),-2,-25);
    }else{
      sky.visible=Boolean(sky.material.map);sky.rotation.set(.1,1.8+t*.3,-.34);
    }
    look(camera,V(.1,.28,-.2),V(4-t*3,2.6,6+t*2),44);
  }else if(shot==='record'){
    disc.visible=true;disc.position.set(0,0,0);disc.rotation.set(.15,t*TAU*.5,.21+t*.39);
    look(camera,V(0,0,0),V(2.4-t*2.3,4.8,4+t*.6),40);
  }
  return scene;
}
function arrivalWorld(){
  const scene=new T.Scene();scene.background=new T.Color(0x9c6e66);scene.fog=new T.Fog(0xb6896e,18,100);
  lighting(scene,0xa4bccb,0x453140,0xffce93,3,true);
  const ground=mesh(scene,new T.PlaneGeometry(240,240),mat(0x3f474e),0,-.06,0);
  ground.rotation.x=-Math.PI/2;
  tube(scene,4.1,4.1,.07,mat(0x565c61),-4,0,-4,60);
  tube(scene,4.1,4.1,.07,mat(0x565c61),7,0,-7,60);
  for(let i=0;i<26;i++){
    const x=(i%13-6)*6.7,z=i<13?-25:-32;
    const h=1.4+(i*7%6)*.45;
    box(scene,5.7,h,5.1,mat(0x555462),x,h/2,z);
    for(let j=-1;j<2;j++)box(scene,.61,.23,.022,amber,x+j*1.2,h*.53,z+2.57);
  }
  const lander=ship(scene,'lander');lander.position.set(-4,.1,-4);
  const capsule=ship(scene);capsule.position.set(7,1,-7);
  const aria=astronaut(scene),echo=rover(scene,true);
  return {scene,aria,echo};
}
function arrivalShot(world,camera,t,clock){
  const {scene,aria,echo}=world;
  aria.position.set(mix(-3,-.8,smooth(t)),0,-1.4);
  aria.rotation.y=-1.3;
  aria.userData.walk(clock,t<.7?.65:0);
  echo.position.set(mix(4.6,1.2,smooth(t)),0,-1.8);
  echo.rotation.y=1.26;
  for(const w of echo.userData.wheels)w.rotation.x=-t*12;
  look(camera,V(0,.95,-1.6),V(7-t*5.6,2.8+t*.2,8.4-t*2.3),44);
  return scene;
}

