'use strict';
function canvasTexture(width,height,paint){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  paint(canvas.getContext('2d'),width,height);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  return texture;
}
const textures={};
const satelliteEarth=new T.TextureLoader().load('cinematic/assets/final/blue-marble.jpg');
satelliteEarth.colorSpace=T.SRGBColorSpace;
satelliteEarth.anisotropy=4;
function globeTexture(kind){
  if(textures[kind])return textures[kind];
  const palette={moon:['#90979a','#565b61','#d9d2ba'],mars:['#a65330','#56312c','#dc9164'],jupiter:['#c69a7e','#9a6658','#edd4b0'],saturn:['#d4b486','#957862','#f9dcaa'],uranus:['#8fc3c4','#7aabbc','#b0d6d4'],neptune:['#5276be','#354b9a','#80aff2']};
  return textures[kind]=canvasTexture(1024,512,(c,w,h)=>{
    const rnd=rng(516+kind.length);
    if(kind==='earth'){
      const sea=c.createLinearGradient(0,0,0,h);sea.addColorStop(0,'#98c2d8');sea.addColorStop(.16,'#244b77');
      sea.addColorStop(.56,'#1f5f8e');sea.addColorStop(.89,'#1a3862');sea.addColorStop(1,'#a3becd');
      c.fillStyle=sea;c.fillRect(0,0,w,h);
      c.beginPath();
      for(const poly of earthLand)for(const ring of poly){
        ring.forEach(([x,y],i)=>i===0?c.moveTo(x,y):c.lineTo(x,y));c.closePath();
      }
      const land=c.createLinearGradient(0,0,0,h);
      for(const [p,v] of [[0,'#dce9ed'],[.23,'#63856b'],[.41,'#bc9e68'],[.56,'#527150'],[.72,'#7c8055'],[1,'#e4edef']])land.addColorStop(p,v);
      c.fillStyle=land;c.fill('evenodd');c.strokeStyle='#648698';c.lineWidth=.55;c.stroke();
      for(let i=0;i<325;i++){
        const x=rnd()*w,y=rnd()*h,r=3+rnd()*29;
        const cloud=c.createRadialGradient(x,y,0,x,y,r);
        cloud.addColorStop(0,'#fff6d82d');cloud.addColorStop(1,'#fff6d800');
        c.save();c.translate(0,y);c.scale(1,.45);c.translate(0,-y);
        c.fillStyle=cloud;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
      }
    }else{
      const [base,shade,light]=palette[kind];c.fillStyle=base;c.fillRect(0,0,w,h);
      const gas=['jupiter','saturn','uranus','neptune'].includes(kind);
      for(let i=0;i<(gas?125:1700);i++){
        const x=rnd()*w,y=rnd()*h,r=1+rnd()**3*(gas?20:62);
        c.globalAlpha=(gas?.38:.28)*rnd();
        c.fillStyle=i%2?shade:light;
        c.beginPath();c.ellipse(x,y,gas?80+rnd()*560:r*1.36,r,gas?0:.3,0,TAU);c.fill();
        if(!gas&&r>9){c.strokeStyle=light;c.lineWidth=1.25;c.stroke();}
      }
      if(kind==='jupiter'){c.globalAlpha=.68;c.fillStyle='#c36140';c.beginPath();c.ellipse(580,332,51,17,.07,0,TAU);c.fill();}
      c.globalAlpha=1;
    }
    const img=c.getImageData(0,0,w,h);
    for(let i=0;i<img.data.length;i+=4){
      const grain=(rnd()-.5)*13;
      for(let k=0;k<3;k++)img.data[i+k]+=grain;
    }
    c.putImageData(img,0,0);
  });
}
function planet(p,kind,r,x,y,z,atmosphere=false){
  const g=group(p,x,y,z);
  const globe=ball(g,r,new T.MeshStandardMaterial({map:kind==='earth'?satelliteEarth:globeTexture(kind),roughness:.95}));
  globe.rotation.y=-1;
  if(atmosphere){
    mesh(g,new T.SphereGeometry(r*1.038,48,36),new T.ShaderMaterial({
      transparent:true,side:T.BackSide,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{tint:{value:new T.Color(kind==='earth'?0x3a86db:0xcc6537)}},
      vertexShader:`varying vec3 n; varying vec3 p; void main(){ vec4 v=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); p=normalize(-v.xyz); gl_Position=projectionMatrix*v; }`,
      fragmentShader:`varying vec3 n; varying vec3 p; uniform vec3 tint; void main(){ float r=pow(max(0.,1.-abs(dot(normalize(n),normalize(p)))),2.5); gl_FragColor=vec4(tint,r*.68); }`
    }));
  }
  if(kind==='saturn'){
    for(let i=0;i<10;i++){
      const a=r*(1.34+i*.072);
      const ring=mesh(g,new T.RingGeometry(a,a+r*.058,96),new T.MeshBasicMaterial({color:i%3===0?0xe3cfa9:0x9a806a,side:T.DoubleSide,transparent:true,opacity:.49}));
      ring.rotation.x=Math.PI*.39;
    }
  }
  return g;
}
function starfield(s,seed,span=230){
  const random=rng(seed),coords=[],colors=[];
  for(let i=0;i<3300;i++){
    const a=random()*TAU,y=random()*2-1,r=span+random()*45,h=Math.sqrt(1-y*y);
    coords.push(Math.cos(a)*r*h,y*r,Math.sin(a)*r*h);
    const b=.18+random()**2*.66;colors.push(b*.8,b*.94,b);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(coords,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  s.add(new T.Points(geometry,new T.PointsMaterial({size:.58,vertexColors:true,sizeAttenuation:true,depthWrite:false})));
}
function lighting(scene,hemi=0xa6bce7,ground=0x6a543d,sun=0xffe8c3,power=2.55,shadows=false){
  scene.add(new T.HemisphereLight(hemi,ground,.85));
  const key=new T.DirectionalLight(sun,power);
  key.position.set(-34,38,18);
  if(shadows){
    key.castShadow=true;key.shadow.mapSize.set(1024,1024);
    Object.assign(key.shadow.camera,{left:-43,right:43,top:47,bottom:-47,near:.1,far:130});
    key.shadow.bias=-.00038;key.shadow.normalBias=.075;
    key.target.position.set(0,0,-25);scene.add(key.target);
  }
  scene.add(key);return key;
}
const moonStops=[
  {id:'surveyor',label:'Surveyor 3',point:[-10,-8],object:[-14,-14],radius:3.4},
  {id:'apollo',label:'Apollo 12',point:[6,-23],object:[9,-29],radius:4},
  {id:'alsep',label:'Apollo 12 ALSEP',point:[-7,-38],object:[-11,-43],radius:3.4}
];
const marsStops=[
  {id:'ridge',label:'Perseverance Valley overlook',point:[-10,-9],object:[-13,-16],radius:0},
  {id:'opportunity',label:'Opportunity',point:[-9,-33],object:[-2,-37],radius:5},
  {id:'last',label:'Last signal overlook',point:[-9,-45],object:[-2,-37],radius:0}
];
function heightAt(x,z,kind){
  const isMars=kind==='mars';
  if(!isMars){
    const u=clamp(x+120,0,239.999),v=clamp(z+148,0,239.999);
    const col=Math.floor(u),row=Math.floor(v),i=row*241+col;
    const top=mix(lunarElevation[i],lunarElevation[i+1],u-col);
    const bottom=mix(lunarElevation[i+241],lunarElevation[i+242],u-col);
    return mix(top,bottom,v-row)*.01;
  }
  return Math.sin(x*.17+z*.063)*.4+Math.sin(z*.16-x*.04)*.46+
    Math.sin(x*.42+z*.29)*.12+Math.exp(-((x+14)**2/100+(z+14)**2/155))*1.48;
}
function terrain(scene,kind){
  const mars=kind==='mars',rnd=rng(mars?844:45);
  const geometry=new T.PlaneGeometry(238,238,mars?146:238,mars?146:238);
  geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-28);
  const position=geometry.attributes.position, colors=[];
  const color=new T.Color();
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i),y=heightAt(x,z,kind);
    position.setY(i,y);
    color.set(mars?0xd78c61:0xc0beb9).multiplyScalar(.89+rnd()*.16+.055*Math.sin(x*.19+z*.23));
    colors.push(color.r,color.g,color.b);
  }
  geometry.computeVertexNormals();
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const loader=new T.TextureLoader();
  const grit=loader.load(finalAssets+'gravel.jpg');
  const normal=loader.load(finalAssets+'gravel-normal.jpg');
  grit.colorSpace=T.SRGBColorSpace;
  for(const texture of [grit,normal]){
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(47,47);
    texture.anisotropy=4;
  }
  const normalStrength=mars?.65:.42;
  const soil=new T.MeshStandardMaterial({vertexColors:true,map:grit,normalMap:normal,normalScale:new T.Vector2(normalStrength,normalStrength),roughness:.99});
  if(!mars){
    soil.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
        `#include <map_fragment>
        float lunarLuminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=vec3(pow(lunarLuminance,.78)*1.20);`);
    };
  }
  const floor=mesh(scene,geometry,soil);
  floor.castShadow=false;
  const rockGeo=new T.IcosahedronGeometry(1,3);
  const vertices=rockGeo.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
    const shape=1+.12*Math.sin(x*8.7+y*11.2)*Math.cos(z*6.7)+.11*Math.cos(x*3.3+z*5.1);
    vertices.setXYZ(i,x*shape,y*shape,z*shape);
  }
  rockGeo.computeVertexNormals();
  const stones=new T.InstancedMesh(rockGeo,mat(mars?0x794132:0x515258),490);
  const dummy=new T.Object3D();
  for(let i=0;i<490;i++){
    const x=(rnd()-.5)*110,z=rnd()*105-79,s=.045+rnd()**3*(mars?.84:.47);
    dummy.position.set(x,heightAt(x,z,kind)+.10*s,z);
    dummy.scale.set(s*(.8+rnd()),s*.58,s);dummy.rotation.set(rnd(),rnd()*TAU,rnd());
    dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  }
  stones.receiveShadow=true;scene.add(stones);
  for(let i=0;i<(mars?41:0);i++){
    const a=TAU*i/41,r=80+rnd()*27;
    const hill=mesh(scene,new T.IcosahedronGeometry(1,1),mat(mars?0x844932:0x454954),Math.cos(a)*r,-1,-25+Math.sin(a)*r);
    hill.scale.set(9+rnd()*16,1.5+rnd()*(mars?11:6),7+rnd()*13);
    hill.rotation.y=rnd()*TAU;hill.castShadow=false;
  }
}
function routeBeacon(scene,x,z,kind,large=false){
  const beacon=group(scene,x,heightAt(x,z,kind),z);
  tube(beacon,.25,.31,.11,dark,0,.055,0,10);
  tube(beacon,.052,.072,large?.9:.42,steel,0,large?.5:.29,0,8);
  ball(beacon,large?.108:.065,cyan,0,large?1:.52,0);
  if(large){
    const ring=mesh(beacon,new T.RingGeometry(.84,.9,40),new T.MeshBasicMaterial({color:0x75f5de,transparent:true,opacity:.7,side:T.DoubleSide}),0,.095,0);
    ring.rotation.x=-Math.PI/2;
  }
  return beacon;
}
let expeditionSky;
function useNightSky(scene){
  expeditionSky??=new T.TextureLoader().load(finalAssets+'milky-way-4k.webp');
  expeditionSky.mapping=T.EquirectangularReflectionMapping;
  expeditionSky.colorSpace=T.SRGBColorSpace;
  scene.background=expeditionSky;
  scene.backgroundIntensity=.52;
}
let marsDaylight;
function useMarsDaylight(scene){
  marsDaylight??=canvasTexture(256,128,(context,width,height)=>{
    const sky=context.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'#956e62');
    sky.addColorStop(.32,'#c79a84');
    sky.addColorStop(.48,'#e5bc9b');
    sky.addColorStop(.55,'#e5bc9b');
    sky.addColorStop(1,'#985e45');
    context.fillStyle=sky;
    context.fillRect(0,0,width,height);
  });
  marsDaylight.mapping=T.EquirectangularReflectionMapping;
  scene.background=marsDaylight;
  scene.fog=new T.FogExp2(0xe5bc9b,.009);
}
function surface(kind){
  const scene=new T.Scene(),mars=kind==='mars';
  if(mars)useMarsDaylight(scene);
  else useNightSky(scene);
  const sun=lighting(scene,mars?0xf0ccab:0xa4bcf0,mars?0x9f6346:0x686166,mars?0xffdeb9:0xfff4e1,mars?2.4:2.2,true);
  sun.position.set(-55,mars?60:26,-3);
  terrain(scene,kind);
  if(!mars){
    const earth=planet(scene,'earth',2.55,-42,35,-123,false);
    const material=earth.children[0].material;
    material.fog=false;material.emissive.set(0xb4d0ff);
    material.emissiveMap=material.map;material.emissiveIntensity=.48;
  }
  const stops=mars?marsStops:moonStops;
  const models=mars?[null,rover(scene,false),null]:[surveyorModel(scene),apolloModel(scene),alsepModel(scene)];
  if(mars)mountRover(models[1]);
  else mountDescentStage(models[1]);
  const beacons=[];
  let last=[0,8];
  stops.forEach((stop,i)=>{
    const [x,z]=stop.object;
    if(models[i]){
      models[i].position.set(x,heightAt(x,z,kind),z);
      models[i].rotation.y=Math.PI*.85;
    }
    if(stop.radius){
      for(let j=0;j<10;j++){
        const a=j*TAU/10,px=x+Math.sin(a)*stop.radius,pz=z+Math.cos(a)*stop.radius;
        const y=heightAt(px,pz,kind);
        tube(scene,.024,.031,.24,mat(0xcfb104,0,.18),px,y+.12,pz,6);
      }
    }
    const markers=[];
    const segments=[...(stop.via||[]),stop.point];
    for(const [tx,tz] of segments){
      const count=Math.max(1,Math.ceil(Math.hypot(tx-last[0],tz-last[1])/4));
      for(let j=1;j<count;j++)markers.push(routeBeacon(scene,mix(last[0],tx,j/count),mix(last[1],tz,j/count),kind));
      markers.push(routeBeacon(scene,tx,tz,kind,true));
      last=[tx,tz];
    }
    beacons.push(markers);
  });
  const landing=mars?null:ship(scene,'lander');
  if(landing)landing.position.set(5,heightAt(5,14,kind),14);
  const actor=mars?rover(scene,true):astronaut(scene);
  if(!mars) upgradeAstronaut(actor);
  return {scene,kind,stops,models,beacons,actor,landing};
}
function orbitalWorld(){
  const scene=new T.Scene();scene.background=new T.Color(0x030711);
  starfield(scene,183);lighting(scene,0x8fa9dd,0x405375,0xffe1b5,3.1);
  const earth=planet(scene,'earth',15,-18,-12,-49,true);
  const moon=planet(scene,'moon',6,18,1,-54);
  const mars=planet(scene,'mars',13,17,-11,-47,true);
  const giants=['jupiter','saturn','uranus','neptune'].map((kind,i)=>planet(scene,kind,7+i,10,-1,-32));
  const rocket=ship(scene,'rocket'),one=ship(scene),two=ship(scene),probe=voyagerModel(scene);
  const plasma=plasmaTrail(one);
  const disc=group(scene);
  tube(disc,1.57,1.57,.075,foil,0,0,0,96);
  for(let i=1;i<37;i++){
    const r=.34+i*.031;
    const ring=mesh(disc,new T.RingGeometry(r,r+.005,72),new T.MeshBasicMaterial({color:i%3?0x7a4820:0xffdc8d,side:T.DoubleSide}),0,.041,0);
    ring.rotation.x=-Math.PI/2;
  }
  tube(disc,.23,.23,.084,mat(0xd88c2d,0,.46),0,0,0,32);
  const skyMaterial=new T.MeshBasicMaterial({color:0xabb8c7,side:T.BackSide,toneMapped:false,depthWrite:false});
  const sky=mesh(scene,new T.SphereGeometry(205,40,24),skyMaterial);
  sky.castShadow=sky.receiveShadow=false;sky.renderOrder=-1;
  const skyImage=new Image();
  skyImage.onload=()=>{
    skyMaterial.map=new T.Texture(skyImage);
    skyMaterial.map.colorSpace=T.SRGBColorSpace;
    skyMaterial.map.needsUpdate=skyMaterial.needsUpdate=true;
  };
  skyImage.src=archivalSky;
  const objects=[earth,moon,mars,...giants,rocket,one,two,probe,disc,sky];
  return {scene,earth,moon,mars,giants,rocket,one,two,probe,disc,sky,objects,plasma};
}

