'use strict';
const T = THREE;
const TAU = 2 * Math.PI;
const V = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const clamp = T.MathUtils.clamp;
const mix = T.MathUtils.lerp;
const smooth = t => {t=clamp(t,0,1);return t*t*(3-2*t);};
function rng(seed){
  return () => {
    seed = (Math.imul(1664525,seed)+1013904223)>>>0;
    return seed / 4294967296;
  };
}
const materials = new Map();
function mat(color, glow=0, metal=0){
  const key = [color,glow,metal].join();
  if(!materials.has(key)) materials.set(key,new T.MeshStandardMaterial({
    color,metalness:metal,roughness:metal ? .42 : .88,
    emissive:glow ? color : 0,emissiveIntensity:glow
  }));
  return materials.get(key);
}
function mesh(parent,geometry,material,x=0,y=0,z=0){
  const m=new T.Mesh(geometry,material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  parent.add(m);return m;
}
const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new T.SphereGeometry(r,32,24),m,x,y,z);
const tube=(p,a,b,h,m,x=0,y=0,z=0,n=20)=>mesh(p,new T.CylinderGeometry(a,b,h,n),m,x,y,z);
function group(p,x=0,y=0,z=0){
  const g=new T.Group();g.position.set(x,y,z);if(p)p.add(g);return g;
}
function rod(p,a,b,r,m,n=10){
  const start=V(...a),end=V(...b),delta=end.clone().sub(start);
  const part=tube(p,r,r,delta.length(),m,0,0,0,n);
  part.position.copy(start.addScaledVector(delta,.5));
  part.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());
  return part;
}
const white=mat(0xcad3d3), ivory=mat(0xe6dfcc), dark=mat(0x242b30), steel=mat(0x718794,0,.55);
const foil=mat(0xd89c43,0,.55), cyan=mat(0x65f2df,1.3), amber=mat(0xffb16c,1.2), glass=mat(0x243f50,0,.65);
const navy=mat(0x162c52,0,.5), red=mat(0xda542e), rubber=mat(0x252323);
function astronaut(p){
  const a=group(p);
  const chest=box(a,.66,.75,.39,ivory,0,1.24,0);chest.rotation.x=-.06;
  box(a,.55,.63,.27,white,0,1.26,.29);
  box(a,.34,.31,.13,steel,0,1.35,-.22);
  box(a,.17,.065,.02,cyan,0,1.41,-.29);
  ball(a,.31,ivory,0,1.88,0);
  const visor=ball(a,.265,foil,0,1.88,-.119);visor.scale.set(1,.84,.75);
  const reflection=box(a,.16,.025,.018,mat(0xe8f9fb,.35),-.085,1.955,-.308);reflection.rotation.z=-.12;
  for(const x of [-.19,.19])box(a,.075,.31,.035,red,x,1.39,.44);
  const limbs=[];
  for(const side of [-1,1]){
    const arm=group(a,side*.405,1.49,0);
    tube(arm,.115,.105,.38,white,0,-.19,0);
    tube(arm,.11,.12,.31,ivory,0,-.47,-.025);
    ball(arm,.114,dark,0,-.64,-.03);
    const leg=group(a,side*.17,.91,.02);
    tube(leg,.142,.128,.46,ivory,0,-.23,0);
    tube(leg,.122,.142,.35,white,0,-.61,0);
    box(leg,.26,.17,.38,dark,0,-.8,-.083);
    limbs.push({arm,leg,side});
  }
  a.userData.walk=(time,speed)=>{
    for(const {arm,leg,side} of limbs){
      arm.rotation.x=side*Math.sin(time*10)*speed*.53;
      leg.rotation.x=-side*Math.sin(time*10)*speed*.67;
    }
    a.scale.y=1+Math.abs(Math.sin(time*10))*speed*.018;
  };
  return a;
}
function dish(p,r,x,y,z){
  const g=group(p,x,y,z);
  const bowl=mesh(g,new T.SphereGeometry(r,32,12,0,TAU,Math.PI*.66,Math.PI*.34),mat(0xc5d1d1,0,.48));
  bowl.scale.y=.52;
  rod(g,[0,-r*.45,0],[0,r*.43,0],r*.042,foil);
  ball(g,r*.088,dark,0,r*.46,0);
  for(const a of [0,TAU/3,2*TAU/3])rod(g,[Math.sin(a)*r*.84,-r*.24,Math.cos(a)*r*.84],[0,r*.38,0],r*.012,steel);
  return g;
}
function surveyorModel(p){
  const g=group(p);
  tube(g,.58,.69,.28,foil,0,1.13,0,3);
  for(let i=0;i<3;i++){
    const a=i*TAU/3,x=Math.cos(a),z=Math.sin(a);
    rod(g,[x*.42,1.27,z*.42],[x*1.29,.16,z*1.29],.042,steel);
    rod(g,[x*.22,.9,z*.22],[x*1.29,.16,z*1.29],.029,white);
    tube(g,.23,.28,.09,foil,x*1.29,.07,z*1.29,10);
  }
  const wing=box(g,.93,.07,.64,navy,.37,2,.15);wing.rotation.z=-.26;
  rod(g,[.25,1.22,0],[.39,1.99,.15],.04,steel);
  const cam=tube(g,.13,.13,.31,dark,-.32,1.55,-.12);cam.rotation.x=Math.PI/2;
  rod(g,[.28,1.03,-.25],[1.1,.57,-.7],.049,steel);
  box(g,.21,.15,.32,foil,1.12,.53,-.79);
  return g;
}
function apolloModel(p){
  const g=group(p);
  tube(g,1.02,1.04,.71,foil,0,1.2,0,8);
  box(g,1.51,.11,1.51,dark,0,1.6,0);
  for(let i=0;i<4;i++){
    const a=TAU*i/4+.4,x=Math.sin(a),z=Math.cos(a);
    rod(g,[x*.78,1.54,z*.78],[x*1.75,.12,z*1.75],.08,foil);
    rod(g,[x*.85,1.02,z*.85],[x*1.64,.27,z*1.64],.035,steel);
    tube(g,.24,.33,.12,foil,x*1.75,.08,z*1.75,16);
  }
  for(const x of [-.18,.18])rod(g,[x,1.46,-.9],[x,.15,-1.55],.022,steel);
  for(let i=0;i<7;i++){
    const y=.22+i*.177,z=-1.55+i*.087;
    rod(g,[-.18,y,z],[.18,y,z],.023,white);
  }
  return g;
}
function ascentStage(p){
  const g=group(p);
  tube(g,.52,.74,.58,white,0,.37,0,7);
  box(g,.98,.52,.86,white,0,.72,-.18);
  for(const x of [-.24,.24])box(g,.23,.18,.034,glass,x,.74,-.63);
  dish(g,.32,.43,1,.11).rotation.z=.4;
  return g;
}
function alsepModel(p){
  const g=group(p);
  box(g,.9,.4,.74,foil,0,.29,0);box(g,.85,.055,.7,white,0,.515,0);
  rod(g,[.13,.47,0],[.13,1.4,0],.036,steel);
  dish(g,.33,.13,1.41,0).rotation.z=-.4;
  tube(g,.29,.35,.23,foil,1.27,.14,-.84,12);
  rod(g,[.32,.02,-.24],[1.27,.02,-.84],.012,dark);
  return g;
}
function rover(p,modern){
  const g=group(p);
  const shell=modern?ivory:foil;
  box(g,1.22,.43,1.8,shell,0,.68,0);
  box(g,1.14,.13,1.65,modern?steel:navy,0,.96,0);
  box(g,.77,.1,.65,navy,0,1.08,.42);
  const wheels=[];
  for(const side of [-1,1])for(const z of [-.67,0,.67]){
    rod(g,[side*.43,.63,z],[side*.83,.31,z],.059,steel);
    const w=group(g,side*.78,.35,z);
    tube(w,.315,.315,.22,rubber,0,0,0,18).rotation.z=Math.PI/2;
    tube(w,.17,.17,.235,steel,0,0,0,10).rotation.z=Math.PI/2;
    for(let i=0;i<8;i++){
      const a=TAU*i/8,strip=box(w,.23,.04,.084,dark,0,Math.cos(a)*.31,Math.sin(a)*.31);
      strip.rotation.x=a;
    }
    wheels.push(w);
  }
  const mast=group(g,0,.93,-.43);
  tube(mast,.065,.078,.67,steel,0,.31,0);
  const head=group(mast,0,.72,0);
  box(head,.62,.27,.27,shell);
  for(const x of [-.16,.16]){
    const lens=tube(head,.09,.09,.08,modern?cyan:glass,x,0,-.17);
    lens.rotation.x=Math.PI/2;
  }
  const arm=group(g,.49,.67,-.73);
  rod(arm,[0,0,0],[.28,-.1,-.47],.05,steel);
  rod(arm,[.28,-.1,-.47],[.16,-.29,-.74],.042,steel);
  box(arm,.15,.14,.21,modern?cyan:foil,.16,-.29,-.74);
  g.userData={wheels,head,arm};
  return g;
}
function relayModel(p){
  const g=group(p);
  tube(g,.76,.85,.22,dark,0,.14,0,8);
  tube(g,.12,.2,1.66,white,0,.94,0,12);
  box(g,.79,.55,.62,steel,0,1.74,0);
  const signal=ball(g,.235,amber,0,1.78,-.36);
  box(g,.78,.06,.43,navy,-.62,1.16,.24).rotation.z=.19;
  box(g,.78,.06,.43,navy,.62,1.16,.24).rotation.z=-.19;
  g.userData.signal=signal;
  return g;
}
function ship(p,kind='capsule'){
  const g=group(p);
  if(kind==='rocket'){
    tube(g,.61,.64,8.4,ivory,0,0,0,32);
    tube(g,.47,.61,1.55,white,0,4.8,0,32);
    tube(g,0,.47,1.28,ivory,0,6.11,0,24);
    for(const y of [-3.5,1.96,3.18])tube(g,.645,.645,.42,dark,0,y,0);
    for(const side of [-1,1]){
      tube(g,.245,.27,4.75,white,side*.7,-1.52,0,20);
      tube(g,0,.25,.64,white,side*.7,1.11,0,20);
    }
  }else if(kind==='lander'){
    tube(g,.93,1.12,.64,foil,0,.72,0,8);
    tube(g,.55,.86,.84,ivory,0,1.44,0,8);
    box(g,.52,.26,.048,glass,0,1.61,-.66);
    for(let i=0;i<4;i++){
      const a=i*TAU/4+.7,x=Math.cos(a),z=Math.sin(a);
      rod(g,[x*.74,.77,z*.74],[x*1.54,.1,z*1.54],.063,steel);
      tube(g,.22,.29,.11,foil,x*1.54,.06,z*1.54,12);
    }
  }else{
    tube(g,.61,.72,1.45,white,0,0,0);
    tube(g,.28,.61,.64,ivory,0,.99,0);
    tube(g,.49,.68,.24,dark,0,-.79,0);
    box(g,.58,.21,.045,glass,0,.56,.62);
    for(const x of [-1,1]){
      rod(g,[x*.5,-.17,0],[x*1.35,-.17,0],.052,steel);
      box(g,1.36,.055,.83,navy,x*1.62,-.17,0);
      for(let i=0;i<4;i++)box(g,.014,.065,.83,steel,x*1.62+(i-1.5)*.32,-.17,0);
    }
  }
  const plume=mesh(g,new T.ConeGeometry(kind==='rocket'?.62:.37,kind==='rocket'?7:2,24,1,true),
    new T.MeshBasicMaterial({color:0xffa759,transparent:true,opacity:.7,side:T.DoubleSide,blending:T.AdditiveBlending}),0,kind==='rocket'?-7.62:-1.96,0);
  plume.rotation.z=Math.PI;plume.visible=false;
  const core=mesh(plume,new T.ConeGeometry(kind==='rocket'?.38:.2,kind==='rocket'?5.5:1.5,18),new T.MeshBasicMaterial({color:0xafefff,transparent:true,opacity:.75}));
  core.position.y=-.21;
  g.userData.plume=plume;
  return g;
}
function plasmaTrail(parent) {
  const geometry=new T.ConeGeometry(.94,6.1,64,22,true);
  geometry.translate(0,-2.16,0);
  const material=new T.ShaderMaterial({
    uniforms:{seconds:{value:0},strength:{value:0}},
    transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 tex;
      uniform float seconds;
      void main(){
        tex=uv;
        vec3 point=position;
        float jitter=sin(39.0*uv.x+12.0*uv.y-23.0*seconds)*.07*sin(3.14*uv.y);
        point.xz*=1.0+jitter;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.0);
      }`,
    fragmentShader:`varying vec2 tex;
      uniform float seconds;
      uniform float strength;
      void main(){
        float flicker=.5+.5*sin(tex.x*238.8+tex.y*20.0+seconds*35.0)*sin(tex.x*75.4-seconds*26.0);
        float pulse=smoothstep(.08,.3,tex.y)*(1.0-smoothstep(.7,1.0,tex.y));
        float heat=smoothstep(.39,.91,tex.y);
        vec3 rgb=mix(vec3(1.0,.12,.019),vec3(1.0,.64,.24),heat);
        gl_FragColor=vec4(rgb,(.19+.63*flicker)*pulse*strength);
      }`
  });
  const trail=mesh(parent,geometry,material);
  trail.castShadow=trail.receiveShadow=false;
  trail.visible=false;
  return trail;
}
function voyagerModel(p){
  const g=group(p);
  tube(g,.55,.68,.43,foil,0,0,0,10);
  dish(g,1.03,0,.53,0).rotation.z=-.28;
  rod(g,[0,0,0],[-2.28,-.26,.26],.028,steel);
  rod(g,[0,-.14,0],[2.1,-.79,-.56],.028,steel);
  rod(g,[0,-.14,0],[.4,-.39,2.22],.026,steel);
  tube(g,.12,.12,.76,dark,-1.7,-.2,.21).rotation.z=Math.PI/2;
  return g;
}

