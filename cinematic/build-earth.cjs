const fs=require('node:fs');
const json=JSON.parse(fs.readFileSync('cinematic/assets/earth-land.geojson','utf8'));
const paths=json.features.flatMap(({geometry:g})=>g.type==='MultiPolygon'?g.coordinates:[g.coordinates]).map(poly=>poly.map(ring=>ring.map(([x,y])=>[Math.round((x+180)*1024/360),Math.round((90-y)*512/180)])));
fs.writeFileSync('cinematic/earth.js','const earthLand='+JSON.stringify(paths)+';\n');
