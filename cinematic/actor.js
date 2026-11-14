'use strict';

let astronautAsset;
let roverAsset;
let lunarModuleAsset;

function loadDracoModel(filename){
  const decoder=new dracoSupport.DRACOLoader().setDecoderPath(finalAssets).setDecoderConfig({type:'js'});
  return new gltfSupport.GLTFLoader().setDRACOLoader(decoder).loadAsync(finalAssets+filename)
    .finally(()=>decoder.dispose()).catch(()=>null);
}

function mountDescentStage(actor) {
  if(typeof gltfSupport==='undefined'||location.protocol==='file:')return;
  lunarModuleAsset??=loadDracoModel('lunar-module.glb');
  lunarModuleAsset.then(asset=>{
    if(!asset)return;
    asset.scene.updateMatrixWorld(true);
    const model=new T.Group();
    asset.scene.traverse(part=>{
      if(!part.isMesh||new T.Box3().setFromObject(part).max.y>2.5)return;
      const detail=part.clone(false);
      detail.applyMatrix4(part.matrixWorld.clone().multiply(part.matrix.clone().invert()));
      detail.castShadow=detail.receiveShadow=true;
      model.add(detail);
    });
    if(!model.children.length)return;
    const bounds=new T.Box3().setFromObject(model);
    const center=bounds.getCenter(V());
    model.scale.setScalar(.65);
    model.position.set(-.65*center.x,-.65*bounds.min.y,-.65*center.z);
    for(const part of actor.children)part.visible=false;
    actor.add(model);
  });
}

function mountRover(actor) {
  if(typeof gltfSupport==='undefined'||location.protocol==='file:')return;
  roverAsset??=new gltfSupport.GLTFLoader().loadAsync(finalAssets+'mars-rover.glb').catch(()=>null);
  roverAsset.then(asset=>{
    if(!asset)return;
    const model=asset.scene.clone(true);
    const bounds=new T.Box3().setFromObject(model);
    const size=bounds.getSize(V()),center=bounds.getCenter(V());
    const scale=2.6/Math.max(size.x,size.z);
    model.scale.setScalar(scale);
    model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
    model.traverse(part=>{
      if(part.isMesh)part.castShadow=part.receiveShadow=true;
    });
    for(const part of actor.children)part.visible=false;
    actor.add(model);
  });
}

function upgradeAstronaut(actor) {
  if (!window.location.protocol.startsWith('http') || typeof gltfSupport === 'undefined') return;
  astronautAsset??=loadDracoModel('astronaut.glb');
  astronautAsset.then(asset => {
    if (!asset) return;
    const original = [...actor.children];
    const visual = new T.Group();
    const source = asset.scene;
    source.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(source);
    const scale = 2.05 / (bounds.max.y-bounds.min.y);
    const center = bounds.getCenter(new T.Vector3());
    const animations = [];
    source.traverse(part => {
      if (!part.isMesh) return;
      const geometry = part.geometry.clone();
      geometry.applyMatrix4(part.matrixWorld);
      geometry.translate(-center.x,-bounds.min.y,-center.z);
      geometry.scale(scale,scale,scale);
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      animations.push({position,normal,rest:position.array.slice(),restNormals:normal.array.slice()});
      const rendered = new T.Mesh(geometry,part.material);
      rendered.castShadow = true;
      visual.add(rendered);
    });
    visual.rotation.y = Math.PI;
    actor.add(visual);
    for (const part of original) part.visible = false;
    let lastTime = -1;
    actor.userData.walk = (time, speed) => {
      if (time-lastTime >= 0 && time-lastTime < 1/24) return;
      lastTime = time;
      const stride = Math.sin(time*8)*speed;
      for (const {position,normal,rest,restNormals} of animations) {
        for (let i = 0; i < position.count; i++) {
          const x = rest[i*3], y = rest[i*3+1], z = rest[i*3+2];
          const arm = smooth((Math.abs(x)-.24)/.2) * smooth((y-.95)/.24);
          const side = Math.sign(x);
          const pivot = .29*side;
          const rotation = -side*arm*1.03;
          const cos=Math.cos(rotation),sin=Math.sin(rotation);
          const dx = x-pivot, dy = y-1.52;
          const ax = pivot + dx*cos-dy*sin;
          const ay = 1.52 + dx*sin+dy*cos;
          const swing = side*stride*clamp((1.1-y)*.35,0,.32);
          position.setXYZ(i,ax,ay + .03*Math.abs(stride),z+swing-arm*side*stride*.13);
          const nx=restNormals[i*3],ny=restNormals[i*3+1],nz=restNormals[i*3+2];
          normal.setXYZ(i,nx*cos-ny*sin,nx*sin+ny*cos,nz);
        }
        position.needsUpdate = true;
        normal.needsUpdate = true;
      }
    };
    actor.userData.walk(0,0);
  });
}
