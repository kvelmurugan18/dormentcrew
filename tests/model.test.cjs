const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const model = vm.runInNewContext(readFileSync(join(__dirname,'../data.js'),'utf8') +
  '\n({routes, assessRoute, recommendRoute, relayReady, radioSource});');

test('both independent repairs are needed', () => {
  assert.ok(model.relayReady(true,true));
  assert.equal(model.relayReady(true,false), false);
  assert.equal(model.relayReady(false,true), false);
});
test('archived identifiers cannot be live senders', () => {
  for (const id of ['surveyor','apollo','alsep','opportunity','ALSEP']) assert.equal(model.radioSource(id), null);
  assert.equal(model.radioSource('AURORA-L02'), 'AURORA-L02');
});
test('heritage crossing is always blocked, even when it uses less energy', () => {
  for (const storm of [false,true]) {
    const result = model.assessRoute(model.routes.direct, 3, storm);
    assert.ok(result.blocked);
    assert.equal(result.valid, false);
  }
});
test('dust changes the deterministic route choice', () => {
  assert.equal(model.recommendRoute(1,false),'rim');
  assert.equal(model.recommendRoute(2,false),'shelf');
  assert.equal(model.recommendRoute(3,true),'rim');
  assert.equal(model.assessRoute(model.routes.shelf,3,true).valid,false);
});
