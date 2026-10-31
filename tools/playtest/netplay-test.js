// No browser or npm install required: node tools/playtest/netplay-test.js
'use strict';
const assert = require('node:assert/strict');
const N = require('../../game/netplay.js');
const { encode, decode, channelOf, loopbackPair } = N;

const tests = [];
function test(name, fn) { tests.push([name, fn]); }
const J = o => JSON.stringify(o);
const tick = () => new Promise(r => setImmediate(r));

const SAMPLES = [
  { t: 'hello', v: 1, name: 'Ann', deck: ['a', 'b'] },
  { t: 'ready' },
  { t: 'start', seed: 12345 },
  { t: 'pos', ts: 5, fx: 1.5, fz: -2, vx: 0, vz: 1 },
  { t: 'step', ts: 5, from: { c: 0, r: 0 }, to: { c: 1, r: 0 }, dur: 0.5 },
  { t: 'sync', ts: 5, hp: 10, maxHp: 20, barrier: 0, gauge: 3 },
  { t: 'spell', ts: 5, sec: 10 },
  { t: 'spelldone', ts: 5 },
  { t: 'hit', ts: 5, dmg: 7, color: 'red', tile: { c: 2, r: 3 } },
  { t: 'shot', ts: 5, r: 4, color: 'red', big: false },
  { t: 'end', ts: 5, loser: 'a' },
  { t: 'ping', ts: 5, n: 1 },
  { t: 'pong', ts: 6, n: 1, pts: 5 },
  { t: 'bye' },
];
const hit = (o = {}) => J({ t: 'hit', ts: 1, dmg: 5, color: 'red', ...o });
const ok = s => assert.notEqual(decode(s), null, s);
const bad = s => assert.equal(decode(s), null, String(s).slice(0, 80));

test('round trip', () => {
  for (const m of SAMPLES) assert.deepEqual(decode(encode(m)), m);
});
test('rejects hostile input', () => {
  for (const s of ['not json', 'null', '[]', '{"t":"nope"}', '{"t":"hit","dmg":null}',
    '{"t":"hit","dmg":1e9,"color":"red"}', '{"t":"hit","dmg":-5,"color":"red"}',
    '{"t":"pos","c":"x","r":1}', 'x'.repeat(4097), J({ t: 'hello', v: 1, name: 'x'.repeat(5000), deck: [] }),
    undefined, 5, null]) bad(s);
});
test('hit damage bounds', () => {
  ok(hit({ dmg: 1 })); ok(hit({ dmg: 500 }));
  bad(hit({ dmg: 0 })); bad(hit({ dmg: 501 })); bad(hit({ dmg: 1.5 }));
});
test('hit tile bounds', () => {
  ok(hit({ tile: { c: 13, r: 8 } })); ok(hit());
  bad(hit({ tile: { c: 14, r: 0 } })); bad(hit({ tile: { c: -1, r: 0 } })); bad(hit({ tile: { c: 1.5, r: 0 } }));
  for (const m of SAMPLES.filter(m => ['hit', 'pos', 'step', 'shot'].includes(m.t))) {
    const { ts, ...rest } = m;
    bad(J(rest)); bad(J({ ...m, ts: 'x' })); bad(J({ ...m, ts: null }));
  }
});
test('step bounds', () => {
  const s = dur => J({ t: 'step', ts: 1, from: { c: 0, r: 0 }, to: { c: 1, r: 0 }, dur });
  ok(s(0.05)); ok(s(2)); bad(s(0)); bad(s(3));
  bad(J({ t: 'step', ts: 1, from: { c: 0, r: 0 }, to: { c: 14, r: 0 }, dur: 1 }));
});
test('spell shapes', () => {
  const sp = o => J({ t: 'spell', ts: 1, ...o });
  ok(sp({ sec: 10 })); ok(sp({ sec: 60 }));
  bad(sp({ sec: 0 })); bad(sp({ sec: 61 })); bad(sp({ sec: 'x' })); bad(J({ t: 'spell', ts: 1 }));
  bad(J({ t: 'spelldone' }));
  const sy = g => J({ t: 'sync', ts: 1, hp: 1, maxHp: 2, barrier: 0, gauge: g });
  ok(sy(0)); ok(sy(10)); bad(sy(-1)); bad(sy(11));
});
test('channels', () => {
  for (const t of ['pos', 'step', 'shot', 'ping', 'pong']) assert.equal(channelOf(t), 'fast');
  for (const t of ['hit', 'end', 'sync', 'hello', 'nope']) assert.equal(channelOf(t), 'safe');
});
test('loopback delay', () => {
  const q = [];
  let now = 0;
  const setTimeout_ = (fn, ms) => q.push([now + ms, fn]);
  const advance = ms => { now += ms; for (const e of q.filter(e => e[0] <= now)) { q.splice(q.indexOf(e), 1); e[1](); } };
  const [a, b] = loopbackPair({ delayMs: 10, setTimeout: setTimeout_ });
  const got = []; b.onmessage = s => got.push(s);
  a.send('hi', 'safe');
  advance(9); assert.equal(got.length, 0);
  advance(1); assert.deepEqual(got, ['hi']);
});
test('loopback', async () => {
  const [a, b] = loopbackPair();
  const got = []; b.onmessage = s => got.push(s);
  let ca = 0, cb = 0; a.onclose = () => ca++; b.onclose = () => cb++;
  for (let i = 0; i < 100; i++) a.send(String(i), i % 2 ? 'fast' : 'safe');
  assert.equal(got.length, 0);
  await tick();
  assert.deepEqual(got, Array.from({ length: 100 }, (_, i) => String(i)));
  a.close(); b.close(); await tick();
  assert.equal(ca, 1); assert.equal(cb, 1);
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('ok  ' + name); }
    catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
  }
  console.log(`${tests.length - failed}/${tests.length} passed`);
  if (failed) process.exit(1);
})();
