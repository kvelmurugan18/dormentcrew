'use strict';

function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function drawHero(canvas) {
  const c = canvas.getContext('2d');
  if (!c) return;
  const w = canvas.width, h = canvas.height, rnd = random(509);
  c.fillStyle = '#0c1722'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 650; i++) {
    c.fillStyle = 'rgba(212,234,237,' + (rnd() * .57) + ')';
    c.fillRect(rnd() * w, rnd() * h, rnd() * 2 + .4, rnd() * 2 + .4);
  }
  const x = w * .79, y = h * .46, r = h * .44;
  const halo = c.createRadialGradient(x, y, r * .93, x, y, r * 1.22);
  halo.addColorStop(0, '#a7d9df55'); halo.addColorStop(1, '#a7d9df00');
  c.fillStyle = halo; c.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
  const light = c.createLinearGradient(x - r, y + r, x + r, y - r);
  light.addColorStop(0, '#080e16'); light.addColorStop(.38, '#263238');
  light.addColorStop(.75, '#89918b'); light.addColorStop(1, '#f4e4c4');
  c.fillStyle = light; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  for (let i = 0; i < 2100; i++) {
    const u = rnd() * 2 - 1, v = rnd() * 2 - 1;
    if (u * u + v * v > 1) continue;
    const size = (rnd() ** 4 * 34 + 1) * (1 - .5 * Math.abs(u));
    c.beginPath(); c.ellipse(x + u * r, y + v * r, size, size * .65, -.65, 0, 7);
    c.fillStyle = i % 2 ? '#131f2836' : '#e5dbc01c'; c.fill();
    if (size > 13) { c.strokeStyle = '#ecdfc432'; c.stroke(); }
  }
  c.restore();
  c.setLineDash([3, 8]); c.strokeStyle = '#a5e5da64';
  c.beginPath(); c.ellipse(x - 50, y + 30, r * 1.55, r * .63, -.54, 0, 7); c.stroke();
  c.setLineDash([]); c.fillStyle = '#c1ffee'; c.beginPath(); c.arc(x + r * .93, y - r * .35, 4, 0, 7); c.fill();
}

const sites = [
  {id:'surveyor', x:-6, z:12, view:[-6,8], color:'#d9d2ba'},
  {id:'apollo', x:5, z:16, view:[5,12], color:'#d4a96a'},
  {id:'alsep', x:-1, z:22, view:[-1,18], color:'#96c7cc'}
];
const isProtected = (x, z) => sites.some(s => Math.hypot(s.x - x, s.z - z) < 2.35);

function startMoon(canvas, status, inspect, announce) {
  const c = canvas.getContext('2d');
  if (!c) return null;
  const player = {x:0, z:2, angle:0};
  const rnd = random(33);
  const stars = Array.from({length:100}, () => [rnd() * 900, rnd() * 210, rnd()]);
  const rocks = Array.from({length:350}, () => [rnd() * 68 - 34, rnd() * 72 - 5, rnd() * .35]);
  let message = '', pointer = null;
  function nearest() {
    return sites.find(s => Math.hypot(player.x - s.view[0], player.z - s.view[1]) < 2.65);
  }
  function draw() {
    const w = canvas.width, h = canvas.height;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#030810'); sky.addColorStop(.43, '#111f2c'); sky.addColorStop(.44, '#5b6468'); sky.addColorStop(1, '#272c31');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    for (const [x,y,s] of stars) { c.fillStyle = '#e1f2ff'; c.globalAlpha = s; c.fillRect(x,y,1.6,1.6); }
    c.globalAlpha = 1;
    const sin = Math.sin(player.angle), cos = Math.cos(player.angle);
    function project(x, z, y = 0) {
      const dx = x - player.x, dz = z - player.z;
      const forward = dz * cos + dx * sin + 5;
      if (forward < .65) return null;
      const scale = 420 / forward;
      return [w / 2 + (dx * cos - dz * sin) * scale, h * .44 + (2.7 - y) * scale, scale];
    }
    function line(a, b, color, width = 1) {
      if (!a || !b) return;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = color; c.lineWidth = width; c.stroke();
    }
    for (let z = -4; z < 59; z += 3) {
      for (let x = -33; x < 33; x += 3) {
        const p = project(x,z);
        line(p, project(x+3,z), '#b4cad41c');
        line(p, project(x,z+3), '#b4cad41c');
      }
    }
    for (const [x,z,size] of rocks) {
      const p = project(x,z);
      if (!p) continue;
      c.fillStyle = '#151b2475'; c.beginPath(); c.ellipse(p[0],p[1],Math.max(1,size*p[2]),Math.max(.5,size*p[2]*.22),0,0,7); c.fill();
    }
    for (const s of [...sites].sort((a,b) => Math.hypot(b.x-player.x,b.z-player.z)-Math.hypot(a.x-player.x,a.z-player.z))) {
      for (let i = 0; i < 26; i++) {
        const a = i * 2 * Math.PI / 26, b = (i + 1) * 2 * Math.PI / 26;
        line(project(s.x + 2.35 * Math.cos(a), s.z + 2.35 * Math.sin(a)),project(s.x + 2.35 * Math.cos(b), s.z + 2.35 * Math.sin(b)),i%2 ? '#ffc29b' : '#ffc29b66',2);
      }
      const p = project(s.x,s.z,s.id === 'alsep' ? .55 : 1.25);
      if (!p) continue;
      const [x,y,k] = p;
      c.fillStyle = s.color; c.fillRect(x - k*.48,y-k*.15,k*.96,k*.57);
      c.fillStyle = '#444e53'; c.fillRect(x,y-k*.15,k*.48,k*.57);
      for (const dir of [-1,1]) line([x+dir*k*.35,y+k*.3],[x+dir*k*.78,y+k*.98],s.color,Math.max(2,k*.07));
      line([x,y],[x+k*.31,y-k*.58],s.color,2);
      c.font = 'bold 15px Consolas'; c.textAlign = 'center';
      const label = s.id === 'alsep' ? 'ALSEP' : equipment[s.id].name;
      const width = c.measureText(label).width + 20;
      c.fillStyle = '#09131c'; c.fillRect(x-width/2,y-k*.8-23,width,26);
      c.fillStyle = '#a6efdf'; c.fillText(label,x,y-k*.8-5);
      const v = project(...s.view);
      if (v) { c.fillStyle = '#a6efdf'; c.beginPath(); c.arc(v[0],v[1],5,0,7); c.fill(); }
    }
    const x = w/2, y = h*.82;
    c.fillStyle = '#10182077'; c.beginPath(); c.ellipse(x+18,y+44,42,9,0,0,7); c.fill();
    c.fillStyle = '#e2ded1'; c.fillRect(x-20,y-14,40,42); c.fillRect(x-15,y+24,12,19); c.fillRect(x+3,y+24,12,19);
    c.fillStyle = '#9da9a9'; c.fillRect(x-12,y-8,24,29);
    c.fillStyle = '#e5e9e2'; c.beginPath(); c.arc(x,y-23,16,0,7); c.fill();
    c.fillStyle = '#465e65'; c.fillRect(x-8,y-27,16,8);
    c.textAlign = 'left'; c.fillStyle = '#a6efdf'; c.font = 'bold 15px Consolas'; c.fillText('ARIA / VIEWPOINT ACCESS',16,26);
    const near = nearest();
    status.textContent = message || (near ? 'In range: ' + equipment[near.id].name + '. Press E or Inspect.' : 'Follow the cyan markers. Amber rings mark protected ground.');
  }
  function move(key) {
    const vectors = {w:[0,1],s:[0,-1],a:[-1,0],d:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
    const vector = vectors[key];
    if (!vector) return;
    const [u,v] = vector, sin = Math.sin(player.angle), cos = Math.cos(player.angle);
    const x = Math.max(-15,Math.min(15,player.x + (u*cos+v*sin)*.66));
    const z = Math.max(0,Math.min(29,player.z + (v*cos-u*sin)*.66));
    message = isProtected(x,z) ? 'Protected site. Walk around the amber boundary.' : '';
    if (!message) Object.assign(player,{x,z});
    draw();
  }
  function scan() {
    const near = nearest();
    message = near ? equipment[near.id].name + ' detected. Ready to inspect.' : 'Three survey markers ahead. Approach a cyan waypoint.';
    draw(); announce(message);
  }
  function open() {
    const near = nearest();
    if (near) inspect(near.id);
    else scan();
  }
  canvas.addEventListener('keydown', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','e','q'].includes(key)) return;
    event.preventDefault();
    if (key === 'e') open();
    else if (key === 'q') scan();
    else move(key);
  });
  canvas.addEventListener('pointerdown', event => {
    pointer = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer === null) return;
    player.angle += (pointer - event.clientX) * .007;
    pointer = event.clientX; message = ''; draw();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type, () => { pointer = null; });
  draw();
  return {move, open, scan, get position(){return player;}, restore(position){Object.assign(player,position);draw();}};
}

function terrainMap() {
  return '<svg class="map" viewBox="0 0 460 288" role="img" aria-label="Stylized lunar map. Three amber protected sites have cyan viewing points outside their perimeter.">' +
    '<defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#30454f"/></pattern></defs><rect width="460" height="288" fill="url(#grid)"/>' +
    '<path d="M230 255L122 208L325 163L215 100" fill="none" stroke="#a6efdf" stroke-dasharray="4 6"/>' +
    [[122,162,'Surveyor 3'],[325,117,'Apollo 12'],[215,54,'ALSEP']].map(([x,y,label]) =>
      '<circle cx="'+x+'" cy="'+y+'" r="37" fill="#ffc29b16" stroke="#ffc29b" stroke-dasharray="4 4"/><circle cx="'+x+'" cy="'+(y+46)+'" r="6" fill="#a6efdf"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" fill="#fff" font-size="13">'+label+'</text>'
    ).join('') + '</svg>';
}
function marsMap(route, storm) {
  const selected = routes[route];
  let svg = '<svg class="route-map" viewBox="0 0 396 335" role="img" aria-label="Synthetic Mars route map. Center amber cells protect the rover site. '+(selected ? selected.name+' highlighted.' : '')+'">';
  for (let y=0;y<5;y++) for (let x=0;x<6;x++) {
    const fill = protectedCell(x,y) ? '#774632' : storm && x === 5 && y > 1 ? '#654a35' : ['#36261e','#402d23','#4d3427'][(x*7+y*11)%3];
    svg += '<rect x="'+(18+x*60)+'" y="'+(18+y*60)+'" width="58" height="58" fill="'+fill+'"/>';
  }
  if (selected) svg += '<polyline points="'+selected.points.map(([x,y])=> (47+x*60)+','+(47+y*60)).join(' ')+'" fill="none" stroke="'+(route==='direct'?'#ffc29b':'#a6efdf')+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg+'<circle cx="47" cy="287" r="8" fill="#f7ede4"/><circle cx="347" cy="47" r="8" fill="#a6efdf"/><text x="197" y="235" text-anchor="middle" fill="#fff" font-size="14">HERITAGE ZONE</text><text x="47" y="327" text-anchor="middle" fill="#fff" font-size="13">START</text><text x="347" y="78" text-anchor="middle" fill="#fff" font-size="13">RELAY</text></svg>';
}
function diagram(id, echo=false) {
  const base = '<svg class="scene" viewBox="0 0 500 220" role="img" aria-label="Original illustrated equipment diagram"><defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#101d2a"/><stop offset="1" stop-color="#26343a"/></linearGradient></defs><rect width="500" height="220" fill="url(#shade)"/><path d="M0 183L105 175 161 183 222 172 318 178 386 172 500 181V220H0Z" fill="#475153"/>';
  if (id==='surveyor') return base+'<g '+(echo?'id="echo-lander"':'')+' stroke="#d9d2ba" stroke-width="4"><path d="M220 147L177 176M280 147L325 176M244 149L236 179"/><path d="M244 119L269 91M267 92L291 86M218 133L190 145L172 161"/><path d="M213 119H280L291 148H208Z" fill="#a7a291"/></g>'+
    (echo?'':'<path d="M274 92H360M177 158H108" stroke="#a6efdf" fill="none" stroke-dasharray="3 4"/><g fill="#a6efdf" font-size="14"><text x="368" y="97">CAMERA</text><text x="52" y="163">SCOOP</text></g>')+'</svg>';
  if (id==='apollo') return base+'<g stroke="#d9d2ba" stroke-width="3"><path d="M227 65H275L289 89 275 113H219L212 86Z" fill="#81969a"/><path d="M216 131H283L298 150H205Z" fill="#a98055"/><path d="M213 148L179 179M287 148L321 179"/></g><g fill="#eaf3f2" font-size="14"><text x="309" y="93">ASCENT</text><text x="310" y="146">DESCENT</text></g></svg>';
  if (id==='alsep') return base+'<path d="M220 171V133H279V171Z" fill="#cbb390"/><path d="M252 133V91L270 77" stroke="#e8dfc4" stroke-width="4" fill="none"/><path d="M220 166L182 174H160" stroke="#a6efdf" stroke-width="2" fill="none"/><rect x="144" y="163" width="21" height="13" fill="#9bb1ab"/></svg>';
  return base+'<g fill="#bc9d78" stroke="#ecd8bd" stroke-width="3"><path d="M169 139H326L300 159H191Z"/><path d="M241 137V95H271V104H245"/><circle cx="202" cy="165" r="12"/><circle cx="251" cy="165" r="12"/><circle cx="301" cy="165" r="12"/></g><path d="M356 167L391 139 440 161" fill="#b48163"/></svg>';
}
