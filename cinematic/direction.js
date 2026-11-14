'use strict';

const documentaryScenes = new Map();

function viewPanel(parent, image, width, height, x, y, z) {
  const canvas = new T.MeshBasicMaterial({color:0x243963,side:T.DoubleSide});
  const board = box(parent,width+.13,height+.13,.15,steel,x,y,z);
  const screen = mesh(board,new T.PlaneGeometry(width,height),canvas,0,0,.085);
  screen.castShadow = false;
  if (image) {
    new T.TextureLoader().load(finalAssets+image,texture=>{
      texture.colorSpace=T.SRGBColorSpace;
      canvas.map=texture;
      canvas.color.setHex(0xffffff);
      canvas.needsUpdate=true;
    });
  }
  return board;
}

function setScene(name,build) {
  if(!documentaryScenes.has(name)) documentaryScenes.set(name,build());
  return documentaryScenes.get(name);
}

function briefingSet() {
  const scene = new T.Scene();
  scene.background=new T.Color(0x0a1219);
  scene.fog=new T.FogExp2(0x0a1219,.035);
  lighting(scene,0x9db9d5,0x31373c,0xe6dfd3,2.4,true);
  box(scene,24,.14,22,mat(0x212c32,0,.15),0,-.12,0);
  box(scene,24,9,.3,mat(0x263441),0,3.5,-5.2);
  for(const x of [-8,-5,-2,1,4,7]){
    box(scene,.1,7,.2,steel,x,3.5,-5.0);
    box(scene,.035,4.9,.095,cyan,x,3.7,-4.89);
  }
  viewPanel(scene,'moonmap.jpg',4.2,2.65,-2.43,2.9,-4.78);
  viewPanel(scene,'marsmap.jpg',4.2,2.65,2.43,2.9,-4.78);
  const desk=group(scene,0,0,-2);
  box(desk,5.5,.12,1.14,steel,0,.95,0);
  for(const x of [-2.5,2.5])box(desk,.1,.94,1.1,dark,x,.47,0);
  const yuva=astronaut(scene);
  yuva.position.set(-1.6,0,1.5);
  upgradeAstronaut(yuva);
  const edith=rover(scene,true);
  edith.position.set(2.1,0,.82);
  const trace=mesh(scene,new T.TorusGeometry(.64,.018,9,45),new T.MeshBasicMaterial({color:0x88e6db,transparent:true,opacity:.55}),0,.9,-1.7);
  trace.rotation.x=-Math.PI/2;
  return {scene,yuva,edith,trace};
}

function briefingShot(shot,t,time) {
  const {scene,yuva,edith,trace}=setScene('briefing',briefingSet);
  yuva.position.x=-1.7+smooth(t)*.48;
  yuva.rotation.y=mix(-.38,.21,t);
  yuva.userData.walk(time,t<.44?.33:0);
  edith.userData.head.rotation.y=Math.sin(time*1.2)*.24;
  trace.position.y=.96+Math.sin(time*2.3)*.19;
  if(shot==='trainingMoon'){
    look(camera,V(-2.45,2.9,-4.78),V(-3.08+t*.41,2.42+t*.3,-.45-t*.8),55);
  }else if(shot==='trainingMars'){
    look(camera,V(2.43,2.92,-4.78),V(3.6-t*.5,2.5+t*.23,.25-t*.97),50);
  }else{
    look(camera,V(-.23,1.98,-2.5),V(5.3-t*3.7,2.43,6.8-t*1.25),43);
  }
  return scene;
}

function cabinSet() {
  const scene=new T.Scene();
  scene.background=new T.Color(0x020610);
  starfield(scene,843);
  lighting(scene,0x7e9ab1,0x40352c,0xffdebc,2.4);
  const earth=planet(scene,'earth',10,7,-6,-30,true);
  box(scene,13,.17,12,mat(0x27363a,0,.45),0,-.12,0);
  box(scene,13,.22,11,steel,0,4.15,0);
  for(const x of [-5.6,5.6]){
    box(scene,.2,4.2,12,mat(0x22333d,0,.45),x,2,0);
    box(scene,.035,.04,10,cyan,x*.98,3.3,0);
  }
  for(const x of [-4.7,4.7])box(scene,2.1,4.15,.22,steel,x,2.06,-4);
  for(const y of [.53,3.52])box(scene,8,.9,.23,steel,0,y,-4);
  const board=viewPanel(scene,null,3.2,1.53,-1.72,2.19,-3.67);
  const yuva=astronaut(scene);yuva.position.set(-1.93,0,.71);upgradeAstronaut(yuva);
  const edith=rover(scene,true);edith.position.set(1.15,0,-.03);
  const light=new T.PointLight(0xb8e4ff,26,10);
  light.position.set(-1.7,2.2,-3.4);scene.add(light);
  return {scene,earth,board,yuva,edith,light};
}
function cabinShot(t,time) {
  const {scene,earth,board,yuva,edith,light}=setScene('cabin',cabinSet);
  earth.rotation.y=t*.55;
  board.children[0].material.color.setRGB(.035+Math.sin(time*7)*.012,.15,.23);
  light.intensity=26+Math.sin(time*6.4)*2;
  yuva.rotation.y=mix(-.18,.17,t);
  yuva.userData.walk(time,.07);
  edith.userData.head.rotation.y=Math.sin(time*.9)*.34;
  look(camera,V(-.75,1.75,-1.35),V(4.5-2.2*t,2.23,3.95-1.1*t),50);
  return scene;
}
function interviewSet() {
  const scene=new T.Scene();
  scene.background=new T.Color(0x101820);
  scene.fog=new T.Fog(0x101820,8,27);
  lighting(scene,0xb7cede,0x413931,0xffddba,2.9,true);
  box(scene,24,.1,16,mat(0x252a2c),0,-.08,-1);
  for(const x of [-6,-3,0,3,6]){
    box(scene,2.8,5,.18,mat(0x263542),x,2.58,-4.7);
    box(scene,.03,3.7,.04,cyan,x-1.35,2.58,-4.58);
  }
  const yuva=astronaut(scene);
  yuva.position.set(1.08,0,-.48);
  upgradeAstronaut(yuva);
  const window=viewPanel(scene,'blue-marble.jpg',5.4,2.65,-4.44,2.22,-4.42);
  window.children[0].material.color.set(0x5e86a4);
  const mic=group(scene,.62,0,.11);
  rod(mic,[0,0,0],[-.052,1.52,-.2],.018,steel);
  ball(mic,.057,dark,-.052,1.52,-.2);
  const rim=new T.PointLight(0x76bbf4,24,6);
  rim.position.set(2.7,2.25,-1.6);
  scene.add(rim);
  return {scene,yuva};
}
function interviewShot(t,time) {
  const {scene,yuva}=setScene('interview',interviewSet);
  yuva.rotation.y=Math.PI-.37+Math.sin(time*.71)*.075;
  yuva.userData.walk(time,.12);
  look(camera,V(.05,1.48,-.62),V(-.6+1.03*smooth(t),1.82,3.9-t*.45),46);
  return scene;
}
function repairSet(worldName) {
  const world=surface(worldName);
  const target=group(world.scene,2,heightAt(2,-3,worldName),-3);
  let moving;
  if(worldName==='moon'){
    box(target,1.46,.22,2.1,steel,0,.56,0);
    box(target,.46,.42,.39,foil,.25,.77,-.37);
    for(const x of [-.8,.8])for(const z of [-.82,.82]){
      const wheel=tube(target,.38,.38,.26,steel,x,.39,z,19);
      wheel.rotation.z=Math.PI/2;
      for(let i=0;i<15;i++){
        const a=i*TAU/15;
        const rib=box(target,.24,.032,.12,dark,x,.39+Math.cos(a)*.39,z+Math.sin(a)*.39);
        rib.rotation.x=a;
      }
    }
    const fender=group(target,.8,1.11,.92);
    box(fender,.42,.036,.54,ivory);
    box(fender,.05,.045,.55,steel);
    for(const x of [-.15,.15])box(fender,.05,.08,.04,dark,x,-.02,.14);
    moving=fender;
    world.actor.position.set(3.42,heightAt(3.42,-2.4,worldName),-2.4);
    world.actor.rotation.y=-1.42;
  }else{
    const roverModel=rover(target,false);
    mountRover(roverModel);
    roverModel.rotation.y=Math.PI;
    moving=ball(target,.045,amber,0,1.06,.94);
    world.actor.visible=false;
  }
  world.beacons.flat().forEach(b=>b.visible=false);
  return {world,target,moving};
}
function repairShot(kind,t,time) {
  const {world,target,moving}=setScene(kind+'Replay',()=>repairSet(kind));
  if(kind==='moon'){
    moving.rotation.x=(1-smooth(t))*1.1;
    moving.position.y=mix(1.37,.89,smooth(t));
    moving.position.z=mix(1.15,.85,smooth(t));
    world.actor.userData.walk(time, .27*Math.sin(t*Math.PI));
  }else{
    moving.material=t<.65?amber:cyan;
    moving.visible=t>.64 || Math.sin(time*5)>0;
  }
  const at=target.position.clone().add(V(.31,.91,.39));
  const from=target.position.clone().add(V(mix(5.2,2.65,t),mix(2.34,1.61,t),3.9));
  look(camera,at,from,42);
  return world.scene;
}
function marsLandingShot(t,time){
  const world=zone('mars');
  const lander=world.landing??=ship(world.scene,'lander');
  const ground=heightAt(5,14,'mars');
  lander.position.set(5,ground+9*(1-smooth(t*1.24)),14);
  burn(lander,time,t<.81);
  world.actor.visible=t>.81;
  world.actor.position.set(mix(4.1,3,t),ground,12.6);
  world.actor.rotation.y=.55;
  for(const wheel of world.actor.userData.wheels)wheel.rotation.x=time*2;
  for(const markers of world.beacons)for(const marker of markers)marker.visible=false;
  look(camera,V(4.7,ground+.9+(1-t)*5,13),V(12-t*3,ground+2.6+t*1.2,26-t*4),45);
  return world.scene;
}
function twinVoyagerShot(t){
  const space=spaceShot(orbit,camera,'stars',t);
  const second=orbit.twin??=voyagerModel(space);
  second.visible=true;
  second.position.set(3.9+t*2,1.5,-9-t*9);
  second.rotation.set(.7,3.2-t*.5,1);
  second.scale.setScalar(.7);
  orbit.probe.position.x=-1.65+t*1.4;
  orbit.probe.rotation.y=-.6+t;
  return space;
}
function animatedRecord(shot,t,time){
  const kind=shot.voice==='ridge'||shot.voice==='opportunity'||shot.voice==='last'?'mars':'moon';
  const world=field?.kind===kind ? field : zone(kind);
  const stopIndex=world.stops.findIndex(stop=>stop.id===shot.voice);
  if(stopIndex<0)return world.scene;
  const stop=world.stops[stopIndex];
  const [x,z]=stop.object;
  const y=heightAt(x,z,kind);
  const model=world.models[stopIndex];
  if(!field){
    world.actor.visible=false;
    world.beacons.flat().forEach(marker=>marker.visible=false);
  }
  const distance=shot.voice==='ridge'?12:7;
  look(camera,V(x,y+1.05,z),V(x+distance*Math.sin(.44-t*.6),y+2.4,z+distance),48);
  if(shot.voice==='surveyor'){
    const revisit=setScene('surveyReplay',()=>surveyorModel(world.scene));
    const flight=1-smooth(t/.37);
    const first=t>.37&&t<.58 ? Math.sin((t-.37)/.21*Math.PI)*.75 : 0;
    const second=t>.58&&t<.74 ? Math.sin((t-.58)/.16*Math.PI)*.33 : 0;
    revisit.visible=t<.81;
    revisit.position.set(x,y+3.4*flight+first+second,z);
    if(model)model.visible=t>=.81;
    look(camera,V(x,y+1.04+2*flight,z),V(x-4+t*2,y+2.3,z+7.8),46);
  }else if(shot.voice==='last'||shot.voice==='ridge'){
    const source=shot.voice==='last'?'last.jpg':'marsmap.jpg';
    const monitor=setScene(shot.voice+'Monitor',()=>viewPanel(world.scene,source,3.9,2.2,x+2,y+2.5,z+.4));
    monitor.visible=true;
    monitor.rotation.y=mix(.35,-.1,t);
    look(camera,V(x+1.02+t*.65,y+2.42,z),V(x+4.4-t*.9,y+2.75,z+6.6-t*1.7),48);
  }
  return world.scene;
}

function directedShot(shot,t,time) {
  if(orbit.twin)orbit.twin.visible=false;
  for(const name of ['lastMonitor','ridgeMonitor']){
    const monitor=documentaryScenes.get(name);
    if(monitor)monitor.visible=false;
  }
  if(['signal','trainingMoon','trainingMars'].includes(shot.voice))return briefingShot(shot.voice,t,time);
  if(shot.voice==='lunarRepair')return repairShot('moon',t,time);
  if(shot.voice==='spiritRepair')return repairShot('mars',t,time);
  if(shot.voice==='marsDescent')return marsLandingShot(t,time);
  if(shot.voice==='news')return cabinShot(t,time);
  if(shot.voice==='imagine')return twinVoyagerShot(t);
  if(shot.voice==='reunion')return interviewShot(t,time);
  if(shot.shot==='inspect')return animatedRecord(shot,t,time);
  return drawShot(shot.shot,t);
}
