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

// ---- DuelSession (Task 2) ----
const D = require('../../game/netduel.js');
const { DuelSession, PosHistory, hitLands, NET_DEFAULTS } = D;
const DECK = n => Array.from({ length: n === undefined ? 50 : n }, (_, i) => 'card' + i);

// Fake world: one clock T, a queue that carries loopback deliveries, manual ticking.
function world() {
  const w = { T: 1000000, q: [] };
  w.setTimeout = (fn, ms) => { w.q.push([w.T + ms, fn]); };
  w.flush = () => {
    for (;;) {
      const i = w.q.findIndex(e => e[0] <= w.T);
      if (i < 0) return;
      const [, fn] = w.q.splice(i, 1)[0]; fn();
    }
  };
  return w;
}
function advance(w, ms, ss) {
  for (let i = 0; i < ms; i++) { w.T++; w.flush(); for (const s of ss) s.tick(); w.flush(); }
}
const EVENTS = ['lobby', 'start', 'fight', 'hit', 'pos', 'step', 'sync', 'shot', 'end', 'refused', 'spellopen', 'spellresume'];
function track(S) {
  S.events = [];
  S.log = n => S.events.filter(e => e[0] === n).map(e => e[1]);
  for (const n of EVENTS) S.on(n, p => S.events.push([n, p]));
  return S;
}
function spy(t) {
  const sent = []; const orig = t.send;
  t.send = (text, ch) => { sent.push(decode(text)); return orig(text, ch); };
  return sent;
}
function pair(o = {}) {
  const w = world();
  const [ta, tb] = loopbackPair({ delayMs: o.delayMs || 0, setTimeout: w.setTimeout });
  const sentA = spy(ta), sentB = spy(tb);
  const A = track(new DuelSession(ta, { name: 'A', deck: DECK(), host: true, now: () => w.T, settings: o.sa, seed: () => 777 }));
  const B = track(new DuelSession(tb, { name: 'B', deck: DECK(), host: false, now: () => w.T + (o.off || 0), settings: o.sb }));
  w.flush();
  return { w, A, B, ta, tb, sentA, sentB };
}
function fight(p) {
  advance(p.w, 30, [p.A, p.B]);
  p.A.ready(); p.B.ready();
  advance(p.w, 30, []);
  assert.equal(p.A.state, 'fighting'); assert.equal(p.B.state, 'fighting');
}
// A session talking to a raw scripted peer.
function raw(o = {}) {
  const w = world();
  const [ta, tb] = loopbackPair({ setTimeout: w.setTimeout });
  const got = []; tb.onmessage = s => got.push(decode(s));
  const S = track(new DuelSession(ta, { name: 'S', deck: DECK(), host: !!o.host, now: () => w.T, settings: o.settings, seed: () => 5 }));
  const say = m => { tb.send(encode(m), 'safe'); w.flush(); };
  return { w, S, got, say, tb, ta };
}
const hello = (o = {}) => ({ t: 'hello', v: 1, name: 'R', deck: DECK(), ...o });
function rawFight() {
  const r = raw({ host: false });
  r.say(hello()); r.say({ t: 'start', seed: 1 }); r.S.ready(); r.say({ t: 'ready' });
  assert.equal(r.S.state, 'fighting');
  return r;
}

test('duel handshake', () => {
  const { A, B } = pair();
  assert.equal(A.state, 'starting'); assert.equal(B.state, 'starting');
  assert.equal(A.log('start')[0].seed, 777); assert.equal(B.log('start')[0].seed, 777);
  assert.equal(A.log('lobby')[0].name, 'B'); assert.equal(B.log('lobby')[0].name, 'A');
  assert.equal(A.log('start').length, 1); assert.equal(B.log('start').length, 1);
});
test('duel ready -> fighting', () => { fight(pair()); });
test('version mismatch', () => {
  const r = raw({ host: true });
  r.say(hello({ v: 0 }));
  assert.match(r.S.log('refused')[0].reason, /version/);
  assert.notEqual(r.S.state, 'starting');
  assert.ok(r.got.some(m => m && m.t === 'bye'));
});
test('invalid deck refused', () => {
  for (const n of [0, 44, 61]) {
    const r = raw({ host: true });
    r.say(hello({ deck: DECK(n) }));
    assert.match(r.S.log('refused')[0].reason, /deck/, 'n=' + n);
    assert.notEqual(r.S.state, 'starting');
  }
  for (const n of [45, 60]) {
    const r = raw({ host: true }); r.say(hello({ deck: DECK(n) }));
    assert.equal(r.S.log('refused').length, 0); assert.equal(r.S.state, 'starting');
  }
});
test('hit relay', () => {
  const p = pair(); fight(p);
  p.A.sendHit(12, 'red'); p.w.flush();
  const h = p.B.log('hit')[0];
  assert.equal(h.dmg, 12); assert.equal(h.color, 'red'); assert.equal(h.tile, undefined);
  for (let i = 0; i < 50; i++) p.A.sendHit(1 + i, 'red');
  p.w.flush();
  assert.equal(p.B.log('hit').length, 51);
});
test('throttle', () => {
  const p = pair(); fight(p);
  const n = () => p.B.log('pos').length;
  for (let i = 0; i < 10; i++) { p.A.sendPos(i, 0, 1, 0); p.w.T++; }
  p.w.flush(); assert.equal(n(), 1);
  p.w.T += 16 - 10;                       // first delivered call was 10 ms ago
  for (let i = 0; i < 3; i++) { p.A.sendPos(100 + i, 0, 1, 0); p.w.T += 16; }
  p.w.flush(); assert.equal(n(), 4);
  p.w.T += 100; p.A.sendPos(102, 0, 1, 0); p.w.flush();
  assert.equal(n(), 4, 'identical values dropped');
  p.A.sendPos(102, 0, 1, 0.5); p.w.flush(); assert.equal(n(), 5);
});
test('step shot sync relay and sync throttle', () => {
  const p = pair(); fight(p);
  p.A.sendStep({ c: 1, r: 1 }, { c: 2, r: 1 }, 0.4); p.A.sendShot(3, 'red', true);
  p.A.sendSync(5, 10, 0, 2); p.w.T += 50; p.A.sendSync(4, 10, 0, 2); p.w.flush();
  assert.equal(p.B.log('step')[0].dur, 0.4); assert.equal(p.B.log('shot')[0].big, true);
  assert.equal(p.B.log('sync').length, 1); assert.equal(p.B.log('sync')[0].hp, 5);
  assert.ok(typeof p.B.log('step')[0].localTs === 'number');
  p.w.T += 200; p.A.sendSync(3, 10, 0, 2); p.w.flush(); assert.equal(p.B.log('sync').length, 2);
});
test('clock offset', () => {
  const p = pair({ off: 5000, delayMs: 10 });
  advance(p.w, 200, [p.A, p.B]);
  assert.ok(Math.abs(p.A.clock.offset - 5000) <= 1, 'A offset ' + p.A.clock.offset);
  assert.ok(Math.abs(p.B.clock.offset + 5000) <= 1, 'B offset ' + p.B.clock.offset);
  assert.equal(p.A.clock.rtt, 20);
  assert.ok(Math.abs(p.A.clock.toLocal(p.w.T + 5000) - p.w.T) <= 1);
  // one 200 ms-late pong (asymmetric) among the samples must not move the offset
  const pts = p.w.T - 220;
  p.ta.onmessage(J({ t: 'pong', ts: pts + 5010, n: 99, pts }));
  assert.ok(Math.abs(p.A.clock.offset - 5000) <= 1, 'after late pong ' + p.A.clock.offset);
  assert.equal(p.A.clock.rtt, 20);
});
test('spell opens on both', () => {
  const p = pair(); fight(p);
  p.A.openSpell(); p.w.flush();
  assert.equal(p.A.log('spellopen').length, 1); assert.equal(p.B.log('spellopen').length, 1);
  assert.deepEqual(p.A.log('spellopen')[0], { sec: 10, byMe: true });
  assert.deepEqual(p.B.log('spellopen')[0], { sec: 10, byMe: false });
  assert.ok(p.A.spell.open && p.B.spell.open);
  const sent = p.sentA.length + p.sentB.length;
  p.A.openSpell(); p.ta.onmessage(J({ t: 'spell', ts: p.w.T, sec: 10 })); p.w.flush();
  assert.equal(p.sentA.length + p.sentB.length, sent);
  assert.equal(p.A.log('spellopen').length, 1); assert.equal(p.B.log('spellopen').length, 1);
  const q = pair(); fight(q);
  q.A.openSpell(); q.B.openSpell(); q.w.flush();
  assert.equal(q.A.log('spellopen').length, 1); assert.equal(q.B.log('spellopen').length, 1);
  assert.ok(q.A.spell.open && q.B.spell.open);
});
test('spell resumes only when both are done', () => {
  const p = pair(); fight(p);
  p.A.openSpell(); p.w.flush();
  p.A.spellDone(); p.w.flush();
  assert.equal(p.A.log('spellresume').length, 0); assert.equal(p.B.log('spellresume').length, 0);
  assert.ok(p.A.spell.mineDone && p.B.spell.theirsDone);
  p.B.spellDone(); p.w.flush();
  advance(p.w, 50, [p.A, p.B]);
  assert.equal(p.A.log('spellresume').length, 1); assert.equal(p.B.log('spellresume').length, 1);
  assert.equal(p.A.spell.open, false);
});
test('spell times out', () => {
  const p = pair(); fight(p);
  p.A.openSpell(); p.w.flush();
  advance(p.w, 9990, [p.A, p.B]);
  assert.equal(p.A.log('spellresume').length + p.B.log('spellresume').length, 0);
  advance(p.w, 10, [p.A, p.B]);
  assert.equal(p.A.log('spellresume').length, 1); assert.equal(p.B.log('spellresume').length, 1);
  advance(p.w, 3000, [p.A, p.B]);
  assert.equal(p.A.log('spellresume').length, 1); assert.equal(p.B.log('spellresume').length, 1);
  // only A done: B's late spelldone is waited for until sec*1000 + 2000
  const q = pair(); fight(q);
  q.A.openSpell(); q.w.flush(); q.A.spellDone();
  advance(q.w, 11999, [q.A]);
  assert.equal(q.A.log('spellresume').length, 0);
  advance(q.w, 1, [q.A]);
  assert.equal(q.A.log('spellresume').length, 1);
  q.B.tick(); q.w.flush();
  assert.equal(q.B.log('spellresume').length, 1);
});
test('spell length follows settings', () => {
  const cfg = { mpSpell: 4 };
  const p = pair({ sa: () => cfg }); fight(p);
  p.A.openSpell(); p.w.flush();
  assert.equal(p.B.log('spellopen')[0].sec, 4);
  p.A.spellDone(); p.B.spellDone(); p.w.flush();
  assert.equal(p.A.spell.open, false); assert.equal(p.B.spell.open, false);
  cfg.mpSpell = 15;
  p.A.openSpell(); p.w.flush();
  assert.equal(p.B.log('spellopen')[1].sec, 15);
  p.A.spellDone(); p.B.spellDone(); p.w.flush();
  p.B._handle({ t: 'spell', ts: p.w.T, sec: 0 });
  assert.equal(p.B.log('spellopen')[2].sec, 1);
  p.B.spellDone(); p.B._handle({ t: 'spelldone', ts: p.w.T });
  assert.equal(p.B.spell.open, false);
  p.B._handle({ t: 'spell', ts: p.w.T, sec: 999 });
  assert.equal(p.B.log('spellopen')[3].sec, 60);
});
test('spell ends on leave', () => {
  const p = pair(); fight(p);
  p.A.openSpell(); p.w.flush();
  p.B.leave(); p.w.flush();
  assert.deepEqual(p.A.log('end'), [{ result: 'win', reason: 'left' }]);
  assert.equal(p.A.log('spellresume').length, 0);
  advance(p.w, 15000, [p.A]);
  assert.equal(p.A.log('spellresume').length, 0);
});
test('settings are live', () => {
  const cfg = { mpSend: 16, mpBackdate: 250, mpDefend: 50 };
  const p = pair({ sa: () => cfg }); fight(p);
  const n = () => p.B.log('pos').length;
  p.A.sendPos(1, 0, 0, 0); p.w.T += 20; p.A.sendPos(2, 0, 0, 0); p.w.flush(); assert.equal(n(), 2);
  cfg.mpSend = 100;
  p.w.T += 20; p.A.sendPos(3, 0, 0, 0); p.w.flush(); assert.equal(n(), 2);
  p.w.T += 80; p.A.sendPos(3, 0, 0, 1); p.w.flush(); assert.equal(n(), 3);
  assert.equal(p.A.clampTs(p.w.T - 1000), p.w.T - 250);
  cfg.mpBackdate = 1500;
  assert.equal(p.A.clampTs(p.w.T - 1000), p.w.T - 1000);
  const h = new PosHistory(); h.record(0, 11, 4); h.record(980, 11, 3);
  assert.equal(hitLands(h, { c: 11, r: 3 }, 1000, p.A.setting('mpDefend')), false);
  cfg.mpDefend = 10;
  assert.equal(hitLands(h, { c: 11, r: 3 }, 1000, p.A.setting('mpDefend')), true);
  assert.equal(raw({ settings: () => ({}) }).S.setting('mpSend'), NET_DEFAULTS.mpSend);
  assert.deepEqual(NET_DEFAULTS, { mpSpell: 10, mpDefend: 50, mpBackdate: 250, mpSend: 16, mpSmooth: 33 });
});
test('ts clamping', () => {
  const p = pair(); fight(p);
  p.ta.send(J({ t: 'hit', ts: p.w.T - 2000, dmg: 3, color: 'red' }), 'safe');
  p.ta.send(J({ t: 'hit', ts: p.w.T + 5000, dmg: 3, color: 'red' }), 'safe');
  p.w.flush();
  const [a, b] = p.B.log('hit');
  assert.equal(a.localTs, p.w.T - 250); assert.equal(b.localTs, p.w.T);
});
test('tile mapping', () => {
  const p = pair(); fight(p);
  p.ta.send(J({ t: 'hit', ts: p.w.T, dmg: 3, color: 'red', tile: { c: 2, r: 4 } }), 'safe');
  p.ta.send(J({ t: 'hit', ts: p.w.T, dmg: 3, color: 'red', tile: { c: 0, r: 8 } }), 'safe');
  p.w.flush();
  assert.deepEqual(p.B.log('hit').map(h => h.tile), [{ c: 11, r: 4 }, { c: 13, r: 8 }]);
});
test('defender wins', () => {
  const h = new PosHistory(); h.record(0, 11, 4);
  assert.equal(hitLands(h, { c: 11, r: 4 }, 1000, 50), true);
  h.record(980, 11, 3);
  assert.equal(hitLands(h, { c: 11, r: 4 }, 1000, 50), false);
  assert.equal(hitLands(h, { c: 11, r: 3 }, 1000, 50), false);
  const g = new PosHistory(); g.record(0, 11, 4); g.record(1001, 11, 3);
  assert.equal(hitLands(g, { c: 11, r: 4 }, 1000, 50), true);
  assert.equal(hitLands(h, undefined, 1000, 50), true);
  assert.equal(hitLands(new PosHistory(), undefined, 1000, 50), true);
  const old = new PosHistory(); old.record(5000, 11, 4); old.record(6500, 11, 4);
  assert.equal(hitLands(old, { c: 11, r: 4 }, 100, 50), false);
  assert.equal(hitLands(new PosHistory(), { c: 1, r: 1 }, 100, 50), false);
});
test('forfeit on bye', () => {
  const p = pair(); fight(p);
  p.B.leave(); p.w.flush();
  advance(p.w, 500, [p.A]);
  assert.deepEqual(p.A.log('end'), [{ result: 'win', reason: 'left' }]);
  assert.equal(p.A.state, 'over');
});
test('forfeit on transport close', () => {
  const p = pair(); fight(p);
  p.tb.close(); p.w.flush();
  assert.deepEqual(p.A.log('end'), [{ result: 'win', reason: 'left' }]);
});
test('silence timeout', () => {
  const r = rawFight();
  advance(r.w, 4999, [r.S]);
  assert.equal(r.S.log('end').length, 0);
  advance(r.w, 1, [r.S]);
  assert.deepEqual(r.S.log('end'), [{ result: 'win', reason: 'timeout' }]);
  const q = rawFight();
  advance(q.w, 4900, [q.S]);
  q.say({ t: 'ping', ts: q.w.T, n: 1 });
  advance(q.w, 4999, [q.S]);
  assert.equal(q.S.log('end').length, 0);
  advance(q.w, 1, [q.S]);
  assert.deepEqual(q.S.log('end'), [{ result: 'win', reason: 'timeout' }]);
  assert.ok(q.got.some(m => m && m.t === 'pong'), 'pings are answered');
});
test('heartbeat ping each second', () => {
  const r = rawFight();
  advance(r.w, 300, [r.S]);
  const n0 = r.got.filter(m => m && m.t === 'ping').length;
  advance(r.w, 3000, [r.S]);
  const n = r.got.filter(m => m && m.t === 'ping').length - n0;
  assert.ok(n >= 2 && n <= 4, 'pings ' + n);
});
test('draw', () => {
  const p = pair(); fight(p);
  p.A.iDied(); p.B.iDied(); p.w.flush();
  for (const S of [p.A, p.B]) assert.deepEqual(S.log('end'), [{ result: 'draw', reason: 'hp' }]);
  advance(p.w, 500, [p.A, p.B]);
  for (const S of [p.A, p.B]) assert.equal(S.log('end').length, 1);
});
test('single death', () => {
  const p = pair(); fight(p);
  p.A.iDied(); p.w.flush();
  advance(p.w, 299, [p.A, p.B]);
  assert.equal(p.A.log('end').length + p.B.log('end').length, 0, 'grace window');
  advance(p.w, 10, [p.A, p.B]);
  assert.deepEqual(p.A.log('end'), [{ result: 'lose', reason: 'hp' }]);
  assert.deepEqual(p.B.log('end'), [{ result: 'win', reason: 'hp' }]);
  advance(p.w, 1000, [p.A, p.B]);
  assert.equal(p.A.log('end').length, 1); assert.equal(p.B.log('end').length, 1);
});
test('hostile peer messages are ignored', () => {
  const p = pair(); fight(p);
  for (const s of ['junk', '{"t":"hit"}', J({ t: 'hello', v: 1, name: 'x', deck: [] })]) p.ta.send(s, 'safe');
  p.w.flush();
  assert.equal(p.B.state, 'fighting'); assert.equal(p.B.log('hit').length, 0);
});

// ---- pairing codes (nettransport.js) ----
const { packSignal, unpackSignal } = require('../../game/nettransport.js');
const FIXTURE_SDP = ['v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0', 'a=ice-ufrag:abcd', 'a=ice-pwd:' + 'x7Qp'.repeat(6),
  'a=fingerprint:sha-256 ' + Array.from({ length: 32 }, (_, i) => ((i * 37 + 11) & 255).toString(16).padStart(2, '0').toUpperCase()).join(':'),
  'a=setup:actpass', 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144',
  ...Array.from({ length: 12 }, (_, i) => `a=candidate:${1000 + i * 31} 1 udp ${2113937151 - i * 13} 192.168.${i * 7 + 3}.${10 + i * 5} ${50000 + i * 977} typ host generation 0 ufrag q${i}Zk network-id ${i + 1} network-cost ${999 - i}`),
  ''].join('\r\n');
const badCode = async c => { try { await unpackSignal(c); return null; } catch (e) { return e; } };
test('code round trip', async () => {
  assert.ok(FIXTURE_SDP.length > 1000);
  const d = { type: 'offer', sdp: FIXTURE_SDP };
  const code = await packSignal(d);
  assert.ok(code.startsWith('HEX1.'));
  assert.ok(/^HEX1\.[A-Za-z0-9_.]{1,4}(-[A-Za-z0-9_.]{1,4})*$/.test(code), code);
  assert.deepEqual(await unpackSignal(code), d);
  assert.deepEqual(await unpackSignal(await packSignal({ type: 'answer', sdp: FIXTURE_SDP })), { type: 'answer', sdp: FIXTURE_SDP });
});
test('forgiving input', async () => {
  const d = { type: 'offer', sdp: FIXTURE_SDP };
  const code = await packSignal(d);
  const mid = code.length >> 1;
  const variants = [
    code.replace(/-/g, ' '), code.slice(0, mid) + '\n' + code.slice(mid), '  ' + code + '\r\n', code + '-', code.toLowerCase().replace('hex1.', 'HEX1.'),
    'hex1.' + code.slice(5), 'Hex1.' + code.slice(5), code.replace(/-/g, '-\n')
  ];
  for (const v of variants) {
    const r = await badCode(v);
    if (r) { assert.ok(r instanceof Error && r.message.startsWith('Bad code'), String(r)); continue; }
    assert.deepEqual(await unpackSignal(v), d);
  }
  // the clearly valid ones really do parse
  for (const v of [code.replace(/-/g, ' '), code + '-', '  ' + code + '\r\n', 'hex1.' + code.slice(5), code.slice(0, mid) + '\n' + code.slice(mid)])
    assert.deepEqual(await unpackSignal(v), d);
});
test('garbage', async () => {
  const code = await packSignal({ type: 'offer', sdp: FIXTURE_SDP });
  const toxic = ['', 'hello', 'HEX1.', 'HEX1.@@@', 'HEX2.' + code.slice(5), 'HEX1.AAAA', 'HEX1.A',
    await packSignal({ type: 'offer', sdp: 'm=application 9' }), null, undefined, 42];
  for (const c of toxic) {
    const e = await badCode(c);
    assert.ok(e instanceof Error && e.message.startsWith('Bad code'), J(c) + ' -> ' + e);
  }
});
test('every single-character typo is caught', async () => {
  const code = await packSignal({ type: 'offer', sdp: FIXTURE_SDP });
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.';
  let n = 0;
  for (let i = 5; i < code.length; i++) {
    if (code[i] === '-') continue;
    for (const ch of [alpha[(alpha.indexOf(code[i]) + 1) % 64], alpha[(alpha.indexOf(code[i]) + 37) % 64]]) {
      const e = await badCode(code.slice(0, i) + ch + code.slice(i + 1));
      assert.ok(e instanceof Error && e.message.startsWith('Bad code'), 'position ' + i + ' ' + ch + ' -> ' + e);
      n++;
    }
  }
  assert.ok(n > 1000, 'substitutions: ' + n);
});
test('old browser without CompressionStream', async () => {
  const code = await packSignal({ type: 'offer', sdp: FIXTURE_SDP });
  const CS = globalThis.CompressionStream, DS = globalThis.DecompressionStream;
  try {
    delete globalThis.CompressionStream;
    delete globalThis.DecompressionStream;
    let e = null;
    try { await packSignal({ type: 'offer', sdp: FIXTURE_SDP }); } catch (x) { e = x; }
    assert.equal(e && e.message, 'Bad code (this browser is too old for pairing codes)');
    e = await badCode(code);
    assert.equal(e && e.message, 'Bad code (this browser is too old for pairing codes)');
  } finally {
    globalThis.CompressionStream = CS;
    globalThis.DecompressionStream = DS;
  }
  assert.equal((await unpackSignal(code)).type, 'offer');
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
