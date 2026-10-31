// node tools/playtest/duel-runner.js [results-directory]
// Two pages in one browser context play a local duel against each other (startDuel in battle.js, DuelSession in
// netduel.js). They talk through a bridge transport: each page's send() calls a binding exposed with
// page.exposeFunction, and Node delivers the text to the other page with page.evaluate. Node can delay, hold or
// drop either direction, so latency, in-flight hits and a stuck opponent can be staged.
'use strict';
const fs = require('fs'),
  path = require('path'),
  R = require('./runner-common.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- the bridge ----
const NAMES = ['A', 'B'];
const pages = {};
const link = { A: { mode: 'pass', delay: 0 }, B: { mode: 'pass', delay: 0 } }; // per sending side
const chain = { A: Promise.resolve(), B: Promise.resolve() };
const held = { A: [], B: [] };
let gen = 0;
const other = n => (n === 'A' ? 'B' : 'A');
function push(from, g, text) {
  const to = other(from);
  chain[from] = chain[from].then(() =>
    pages[to].evaluate(([g, t]) => window.__bridgeRecv && window.__bridgeRecv(g, t), [g, text]).catch(e => {
      if (process.env.DUEL_DEBUG) console.log('  (bridge ' + from + '>' + to + ': ' + e.message.split('\n')[0] + ')');
    })
  );
}
function deliver(from, g, text) {
  if (g !== gen) return; // a message from an earlier duel
  const L = link[from];
  if (L.mode === 'drop') return;
  if (L.mode === 'hold') return void held[from].push([g, text]);
  if (L.delay > 0) setTimeout(() => push(from, g, text), L.delay);
  else push(from, g, text);
}
function setLink(from, mode, delay) {
  link[from] = { mode, delay: delay || 0 };
  if (mode === 'pass') for (const [g, t] of held[from].splice(0)) push(from, g, t);
  if (mode === 'drop') held[from].length = 0;
}

// installed in each page: the bridge transport, a duel starter, spies and a frame logger
function pageKit() {
  window.__mkBridge = g => {
    const q = [];
    let h = null;
    const T = {
      closed: false,
      onclose: null,
      send(text, ch) {
        if (!T.closed) window.__bridgeSend(g, text, ch);
      },
      close() {
        if (T.closed) return;
        T.closed = true;
        window.__bridgeSend(g, '__close', 'safe');
      }
    };
    Object.defineProperty(T, 'onmessage', {
      get: () => h,
      set: f => {
        h = f;
        while (h && q.length) h(q.shift());
      }
    });
    window.__bridgeRecv = (gg, t) => {
      if (gg !== g || T.closed) return;
      if (t === '__close') {
        T.closed = true;
        if (T.onclose) T.onclose();
        return;
      }
      if (h) h(t);
      else q.push(t);
    };
    window.__T = T;
    return T;
  };
  window.__go = (host, name) => {
    View.gl = false; // two pages drawing the 3D arena in software GL crawl at a frame a second; the duel is the same in 2D
    const list = activeDeck().list;
    const s = new DuelSession(window.__T, { name, deck: list, host });
    const D = (window.__D = { s, ends: [], phases: [] });
    s.on('start', () => {
      prev = performance.now();
      show('scrBattle');
      startDuel(list, s, {
        onCustom: renderCustom,
        onFight: () => {
          $('#custom').classList.remove('on');
          hud(true);
        },
        onEnd: (r, why) => D.ends.push([r, why])
      });
      hud(true);
    });
  };
  // what the page shows each frame (phase changes with their wall time; samples while recording)
  window.__log = { phases: [], rec: null, floaters: [] };
  const f0 = window.floater;
  window.floater = function (text, t, color, big) {
    window.__log.floaters.push([Date.now(), String(text)]);
    return f0.apply(this, arguments);
  };
  const h0 = window.hitEnemy;
  window.__hits = [];
  window.hitEnemy = function (e) {
    const r = h0.apply(this, arguments);
    if (e && e.remote) window.__hits.push([Date.now(), r]);
    return r;
  };
  let last = null;
  const loop = () => {
    requestAnimationFrame(loop);
    const b = typeof B !== 'undefined' ? B : null;
    const ph = b ? b.phase : null;
    if (ph !== last) {
      last = ph;
      window.__log.phases.push([Date.now(), ph]);
    }
    const L = window.__log.rec;
    if (L && b) {
      if (L.who === 'me') L.s.push([Date.now(), b.player.fx ?? b.player.rx, b.player.fz ?? b.player.rz]);
      else {
        const e = duelAvatar();
        if (e) L.s.push([Date.now(), e.rx, e.rz]);
      }
    }
    if (window.__hold) window.__hold();
  };
  requestAnimationFrame(loop);
}

const ev = (n, fn, arg) => pages[n].evaluate(fn, arg);
async function until(n, fn, arg, ms) {
  // (a null arg made waitForFunction never resolve here, so none is passed)
  await pages[n].waitForFunction(fn, arg === null ? undefined : arg, { timeout: ms, polling: 10 });
}
async function within(n, fn, arg, ms) {
  try {
    await until(n, fn, arg, ms);
    return true;
  } catch (e) {
    if (process.env.DUEL_DEBUG) console.log('  (wait failed: ' + e.message.split('\n')[0] + ')');
    return false;
  }
}
const both = (fn, arg) => Promise.all(NAMES.map(n => ev(n, fn, arg)));

const S = { fighting: () => B && B.pvp && B.pvp.session.state === 'fighting' && B.pvp.session.spell.open };
async function newDuel() {
  gen++;
  setLink('A', 'pass');
  setLink('B', 'pass');
  await both(g => {
    XLIT.mpSpell = 10;
    window.__mkBridge(g);
  }, gen);
  await ev('A', () => __go(true, 'Ann'));
  await ev('B', () => __go(false, 'Bo'));
  for (const n of NAMES)
    if (!(await within(n, S.fighting, null, 5000)))
      throw Error(
        'no duel on ' + n + ': ' + JSON.stringify(await both(() => __D.ends)) +
          JSON.stringify(await both(() => ({ s: window.__D && __D.s.state, pvp: !!(typeof B !== 'undefined' && B && B.pvp), open: window.__D && __D.s.spell.open, phase: typeof B !== 'undefined' && B && B.phase })))
      );
  // the opening card screen is shared too: both press Fight!
  await both(() => duelFight());
  for (const n of NAMES) await until(n, () => B.phase === 'fight', null, 3000);
  await both(() => {
    B.player.hp = B.player.maxHp = 500;
  });
  await sleep(250);
}
// walk my mage to (c, r) and wait until it stands there, still
async function walkTo(n, c, r) {
  await ev(n, ([c, r]) => moveTo(tileCR(c, r)), [c, r]);
  await until(
    n,
    ([c, r]) => {
      const p = B.player;
      return p.tile.col === c && p.tile.r === r && !p.path.length && !p.fmov;
    },
    [c, r],
    4000
  );
}
const closeScreen = async () => {
  await both(() => duelFight());
  for (const n of NAMES) await until(n, () => B.phase === 'fight', null, 3000);
};
const hp = n => ev(n, () => B.player.hp);

// the mirror of a position on the other board (rows keep their offset), as duelMirror computes it in battle.js
function mirror(wx, wz) {
  const SQ3 = Math.sqrt(3),
    rr = wz / 1.5 + 4,
    m = ((rr % 2) + 2) % 2,
    tri = m <= 1 ? m : 2 - m;
  return [-wx + SQ3 * (tri - 0.5), wz];
}
function at(track, t) {
  // A's position at time t, linearly between its samples
  for (let i = 1; i < track.length; i++)
    if (track[i][0] >= t) {
      const [t0, x0, z0] = track[i - 1],
        [t1, x1, z1] = track[i],
        k = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      return [x0 + (x1 - x0) * k, z0 + (z1 - z0) * k];
    }
  return null;
}

const checks = [];
function check(name, fn) {
  checks.push([name, fn]);
}

check('avatar mirrors position', async () => {
  await walkTo('A', 2, 4);
  const t0 = Date.now();
  const ok = await within('B', () => duelAvatar().tile.col === 11 && duelAvatar().tile.r === 4, null, 300);
  return { ok, detail: { ms: Date.now() - t0, at: await ev('B', () => [duelAvatar().tile.col, duelAvatar().tile.r]) } };
});

check('avatar tracks a walk', async () => {
  await walkTo('A', 0, 4);
  await sleep(300);
  await ev('A', () => (__log.rec = { who: 'me', s: [] }));
  await ev('B', () => (__log.rec = { who: 'avatar', s: [] }));
  const start = Date.now();
  await ev('A', () => moveTo(tileCR(6, 4)));
  await until('A', () => B.player.tile.col === 6 && !B.player.path.length && !B.player.fmov, null, 4000);
  // then a joystick held up and to the left for a second, and let go
  await ev('A', () => {
    const t0 = performance.now();
    window.__hold = () => {
      const p = B.player;
      if (performance.now() - t0 > 1000) {
        window.__hold = null;
        freeEnd();
        return;
      }
      freeTarget(p.fx - 0.7 * 3, p.fz - 0.7 * 3, false, 1, true);
      if (p.free) p.free.tps = MV('mvStickSpeed');
    };
  });
  await sleep(1600);
  const a = await ev('A', () => {
    const s = __log.rec.s;
    __log.rec = null;
    return s;
  });
  const b = await ev('B', () => {
    const s = __log.rec.s;
    __log.rec = null;
    return s;
  });
  const mineMirror = await ev('B', () => duelMirror(-4.75 * Math.sqrt(3), 0));
  const mirrored = a.map(([t, x, z]) => [t, ...mirror(x, z)]);
  let worst = 0,
    worstAt = null,
    n = 0;
  for (const [t, x, z] of b) {
    if (t - start < 200) continue;
    const q = at(mirrored, t - 33);
    if (!q) continue;
    n++;
    const d = Math.hypot(x - q[0], z - q[1]);
    if (d > worst) {
      worst = d;
      worstAt = t - start;
    }
  }
  const sameMirror = Math.abs(mineMirror[0] - mirror(-4.75 * Math.sqrt(3), 0)[0]) < 1e-9;
  let moved = 0;
  for (let i = 1; i < a.length; i++) moved += Math.hypot(a[i][1] - a[i - 1][1], a[i][2] - a[i - 1][2]);
  return {
    ok: worst <= 0.3 && n > 60 && sameMirror && moved > 8,
    detail: { worst: +worst.toFixed(3), worstAtMs: worstAt, samples: n, moved: +moved.toFixed(2), sameMirror }
  };
});

check('defender wins a dodge', async () => {
  await walkTo('A', 1, 4);
  await walkTo('B', 1, 4);
  await sleep(300);
  // A keeps seeing B in row 4 (B's messages are held) while B steps up into row 3
  setLink('B', 'hold');
  await walkTo('B', 1, 3);
  await sleep(120);
  const h0 = await hp('B');
  await ev('B', () => (__log.floaters.length = 0));
  await ev('A', () => {
    B.player.wandCd = 0;
    fireWand(false);
  });
  const dodged = await within('B', () => __log.floaters.some(f => f[1] === 'dodge'), null, 2000);
  const h1 = await hp('B');
  const sent = await ev('A', () => __hits.length);
  setLink('B', 'pass');
  // the same shot with B standing still in row 4 the whole time
  await walkTo('B', 1, 4);
  await sleep(400);
  const h2 = await hp('B');
  await ev('A', () => {
    B.player.wandCd = 0;
    fireWand(false);
  });
  const dropped = await within('B', h => B.player.hp < h, h2, 2000);
  return { ok: dodged && h1 === h0 && sent > 0 && dropped, detail: { dodged, h0, h1, h2, h3: await hp('B'), sent } };
});

check('damage over time still lands', async () => {
  const h0 = await hp('B');
  await ev('B', () => moveTo(tileCR(5, 1)));
  await sleep(60);
  const moving = await ev('B', () => !!B.player.fmov || B.player.path.length > 0);
  await ev('A', () => hitEnemy(duelAvatar(), 5, null, { raw: true }));
  const ok = await within('B', h => B.player.hp === h - 5, h0, 500);
  return { ok: ok && moving, detail: { h0, h1: await hp('B'), moving } };
});

check('wand hit damages opponent', async () => {
  await walkTo('A', 1, 4);
  await walkTo('B', 2, 4);
  await sleep(300);
  await ev('A', () => (__hits.length = 0));
  const h0 = await hp('B');
  await ev('A', () => {
    B.player.wandCd = 0;
    fireWand(false);
  });
  await until('A', () => __hits.length > 0, null, 2000);
  const dmg = await ev('A', () => __hits[0][1]);
  const landed = await within('B', h => B.player.hp < h, h0, 500);
  const h1 = await hp('B');
  const synced = await within('A', h => duelAvatar().hp === h, h1, 500);
  return { ok: landed && h0 - h1 === dmg && synced, detail: { dmg, h0, h1, avatarHp: await ev('A', () => duelAvatar().hp) } };
});

check('incoming shot is visible', async () => {
  await walkTo('A', 1, 4);
  await walkTo('B', 2, 4);
  await sleep(300);
  const h0 = await hp('B');
  // A's hits are held back, so only the shot message reaches B until the hit is let go
  await ev('A', () => {
    const s = B.pvp.session, send = s.sendHit;
    window.__heldHit = [];
    s.sendHit = (...a) => void window.__heldHit.push(a);
    window.__realSendHit = send.bind(s);
  });
  await ev('B', () => {
    window.__seen = null;
    const poll = () => {
      if (!window.__seen) {
        const f = B.fx.find(f => f.kind === 'shot');
        if (f) window.__seen = { at: Date.now(), r: f.r, hp: B.player.hp };
      }
      if (!window.__stopSeen) requestAnimationFrame(poll);
    };
    window.__stopSeen = false;
    poll();
  });
  const t0 = Date.now();
  await ev('A', () => {
    B.player.wandCd = 0;
    fireWand(false);
  });
  const seen = await within('B', () => !!window.__seen, null, 200);
  const info = await ev('B', () => window.__seen);
  // the cosmetic shot runs out its path and goes; B takes no damage from it
  const gone = await within('B', () => !B.fx.some(f => f.kind === 'shot'), null, 2000);
  await sleep(150);
  const hShotEnd = await hp('B');
  await within('A', () => __heldHit.length > 0, null, 2000);
  const held = await ev('A', () => __heldHit.length);
  const noShotsOnB = await ev('B', () => B.shots.length === 0 && !B.shots.some(s => s.cosmetic));
  await ev('A', () => {
    B.pvp.session.sendHit = window.__realSendHit;
    for (const a of window.__heldHit) window.__realSendHit(...a);
  });
  const dropped = await within('B', h => B.player.hp < h, h0, 500);
  await ev('B', () => (window.__stopSeen = true));
  return {
    ok: seen && info.r === 4 && info.hp === h0 && gone && hShotEnd === h0 && held > 0 && noShotsOnB && dropped,
    detail: { seen, ms: info && info.at - t0, info, gone, h0, hShotEnd, held, noShotsOnB, dropped }
  };
});

check('wand misses other row', async () => {
  await walkTo('B', 1, 2);
  await sleep(300);
  const h0 = await hp('B');
  await ev('A', () => {
    B.player.wandCd = 0;
    fireWand(false);
  });
  await sleep(1000);
  const h1 = await hp('B');
  return { ok: h1 === h0, detail: { h0, h1 } };
});

check('card screen opens on both', async () => {
  await both(() => {
    B.gauge = 0;
  });
  await ev('B', () => {
    B.gauge = 10;
  });
  await sleep(60);
  await pages.B.click('#btnSpell');
  const t0 = Date.now();
  let ok = true;
  for (const n of NAMES) ok = (await within(n, () => B.phase === 'custom' && B.gauge === 0, null, 300)) && ok;
  const ms = Date.now() - t0;
  const g = await both(() => [B.phase, B.gauge]);
  await closeScreen();
  return { ok, detail: { ms, g } };
});

check("spell button lights for the opponent's full gauge", async () => {
  await both(() => {
    B.gauge = 0;
  });
  await ev('A', () => {
    B.gauge = 10;
  });
  const lit = await within(
    'B',
    () => {
      B.gauge = 0;
      const b = document.getElementById('btnSpell');
      return !b.disabled && b.classList.contains('ready');
    },
    null,
    400
  );
  await pages.B.click('#btnSpell');
  let opened = true;
  for (const n of NAMES) opened = (await within(n, () => B.phase === 'custom', null, 300)) && opened;
  await closeScreen();
  return { ok: lit && opened, detail: { lit, opened } };
});

check('fight resumes when both press Fight!', async () => {
  await ev('B', () => {
    B.gauge = 10;
  });
  await ev('B', () => tryCustom());
  for (const n of NAMES) await until(n, () => B.phase === 'custom', null, 300);
  await sleep(100);
  await pages.A.click('#btnFight');
  const waiting = await within('A', () => /Waiting for opponent/.test(document.getElementById('btnFight').textContent), null, 300);
  await sleep(300);
  const still = await both(() => B.phase);
  await pages.B.click('#btnFight');
  const t0 = Date.now();
  let resumed = true;
  for (const n of NAMES) resumed = (await within(n, () => B.phase === 'fight', null, 300)) && resumed;
  return {
    ok: waiting && still.every(p => p === 'custom') && resumed,
    detail: { waiting, still, resumed, ms: Date.now() - t0 }
  };
});

check('queued hits during the card screen', async () => {
  await walkTo('A', 1, 4);
  await walkTo('B', 1, 4);
  await sleep(400);
  const h0 = await hp('B');
  setLink('A', 'pass', 100);
  await ev('A', () => hitEnemy(duelAvatar(), 7, null));
  await ev('B', () => {
    B.gauge = 10;
    tryCustom();
  });
  await sleep(500);
  const paused = await both(() => B.phase);
  const h1 = await hp('B');
  setLink('A', 'pass', 0);
  await closeScreen();
  const ok2 = await within('B', h => B.player.hp === h - 7, h0, 300);
  return { ok: paused.every(p => p === 'custom') && h1 === h0 && ok2, detail: { paused, h0, h1, h2: await hp('B') } };
});

async function screenLength(sec) {
  await both(() => (__log.phases.length = 0));
  // opened: the session's own clock at the open (the frame log below sees a change up to a frame late)
  const opened = await ev('A', s => {
    if (s) XLIT.mpSpell = s;
    B.gauge = 10;
    tryCustom();
    return B.pvp.session.spell.openedAt;
  }, sec);
  for (const n of NAMES) await until(n, () => B.phase === 'fight' && __log.phases.length >= 2, null, (sec || 10) * 1000 + 4000);
  const L = await both(() => __log.phases.slice());
  const back = L.map(l => (l.find(p => p[1] === 'fight')[0] - opened) / 1000);
  await ev('A', () => (XLIT.mpSpell = 10));
  return back;
}
check('card screen length follows the setting', async () => {
  const four = await screenLength(4);
  const ten = await screenLength(0);
  const ok = four.every(s => s >= 4 && s <= 4.5) && ten.every(s => s >= 10 && s <= 10.5);
  return { ok, detail: { four, ten } };
});

// every kind of card in the starter deck, cast the real way (castCard from the queue): the ones that reach an
// enemy reach the avatar through hitEnemy, and B's HP takes it
check('starter deck cards reach the avatar', async () => {
  await walkTo('A', 1, 4);
  await walkTo('B', 1, 4);
  // the whole deck at once does close to 500: B gets the most HP a sync carries (1000), so B is not killed here
  await ev('B', () => (B.player.hp = B.player.maxHp = 1000));
  await sleep(300);
  const h0 = await hp('B');
  await ev('A', () => (__hits.length = 0));
  const kinds = await ev('A', () => [...new Set(activeDeck().list)]);
  for (let i = 0; i < kinds.length; i++) {
    await ev('A', ([id, i]) => {
      B.piles.queue.unshift({ card: CARDS[id], uid: 90000 + i });
      B.player.castCd = 0;
      castCard();
    }, [kinds[i], i]);
    await sleep(120);
  }
  await sleep(2000);
  const sent = await ev('A', () => __hits.length);
  const h1 = await hp('B');
  // the sentries and the hero leave, and B heals, so the checks after this one start clean
  await ev('A', () => {
    for (const a of B.allies.slice()) removeBlock(a);
  });
  await sleep(300);
  await ev('B', () => (B.player.hp = B.player.maxHp));
  return { ok: sent >= 5 && h1 < h0, detail: { kinds: kinds.length, sent, h0, h1 } };
});

// my own ground effects under the avatar (stains, a shadow pool, ice) must leave it no mark or status: statuses are
// not mirrored in v1, and a curse that never ran down made every later hit 30% harder
check('avatar keeps no local ground statuses', async () => {
  await ev('A', () => {
    const t = duelAvatar().tile;
    t.gEl = 'light';
    t.gT = 8;
    t.voidT = 6;
    t.iceT = 6;
  });
  await sleep(300);
  await ev('A', () => {
    const t = duelAvatar().tile;
    t.gEl = 'shadow';
    t.gT = 8;
  });
  await sleep(3000);
  const r = await ev('A', () => {
    const e = duelAvatar(),
      st = ['curseT', 'markT', 'slowT', 'stunT', 'freezeT'].map(k => [k, +(e[k] || 0).toFixed(2)]);
    return { st, mark: e.mark || null, hp: e.hp, barrier: e.barrier, dmg: hitEnemy(e, 10, null) };
  });
  return { ok: r.st.every(([, v]) => v === 0) && !r.mark && r.dmg === 10, detail: r };
});

let saveBefore = null;
const snapshot = () => ev('A', () => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
check('death ends both', async () => {
  saveBefore = saveBefore || (await snapshot());
  await ev('B', () => {
    B.player.hp = 1;
  });
  await ev('A', () => hitEnemy(duelAvatar(), 5, null, { raw: true }));
  let ended = true;
  for (const n of NAMES) ended = (await within(n, () => __D.ends.length > 0, null, 2000)) && ended;
  await sleep(1500);
  const ends = await both(() => __D.ends);
  const after = await snapshot();
  const ok = ended && ends[0].length === 1 && ends[0][0][0] === 'win' && ends[1].length === 1 && ends[1][0][0] === 'lose' && after === saveBefore;
  return { ok, detail: { ends, saveUnchanged: after === saveBefore } };
});

check('a stuck opponent cannot hold the screen', async () => {
  await newDuel();
  await ev('B', () => {
    XLIT.mpSpell = 4;
    B.gauge = 10;
    tryCustom();
  });
  await until('A', () => B.phase === 'custom', null, 500);
  const t0 = Date.now();
  setLink('B', 'drop');
  const ok = await within('A', () => B.phase === 'fight' || __D.ends.length > 0, null, 6300);
  const res = await ev('A', () => ({ phase: B.phase, ends: __D.ends }));
  await ev('B', () => (XLIT.mpSpell = 10));
  return { ok, detail: { ms: Date.now() - t0, res } };
});

check('opponent leaves', async () => {
  await newDuel();
  await ev('B', () => __D.s.leave());
  const ok = await within('A', () => __D.ends.length > 0, null, 1000);
  await sleep(500);
  const r = await ev('A', () => ({ ends: __D.ends, phase: B.phase, state: B.pvp.session.state, timers: B.timers.length }));
  const rb = await ev('B', () => ({ phase: B.phase, state: B.pvp.session.state }));
  return {
    ok: ok && r.ends.length === 1 && r.ends[0][0] === 'win' && r.ends[0][1] === 'left' && r.phase === 'win' && r.state === 'over' && rb.state === 'over',
    detail: { r, rb }
  };
});

// ---- real WebRTC between the two pages (no bridge): RtcTransport from nettransport.js, pairing by code ----
async function rtcConnect() {
  await both(() => {
    if (window.__rtc) window.__rtc.close();
    window.__rtc = null;
  });
  const { offerCode } = await ev('A', async () => {
    const h = await RtcTransport.host();
    window.__rtcHost = h;
    window.__rtc = h.transport;
    return { offerCode: h.offerCode };
  });
  const { answerCode } = await ev('B', async c => {
    const j = await RtcTransport.join(c);
    window.__rtc = j.transport;
    return { answerCode: j.answerCode };
  }, offerCode);
  await ev('A', c => window.__rtcHost.accept(c), answerCode);
  await both(() => {
    window.__rtcGot = [];
    window.__rtc.onmessage = t => window.__rtcGot.push([performance.now(), t]);
    return window.__rtc.opened(10000);
  });
  return { offerCode, answerCode };
}
check('webrtc: connect by code and hello', async () => {
  const t0 = Date.now();
  const { offerCode, answerCode } = await rtcConnect().catch(e => ({ err: e.message }));
  if (!offerCode) return { ok: false, detail: answerCode || 'connect failed' };
  await ev('A', () => __rtc.send(JSON.stringify({ t: 'hello', v: 1, name: 'Ann', deck: [] }), 'safe'));
  const ok = await within('B', () => __rtcGot.some(g => JSON.parse(g[1]).t === 'hello'), null, 2000);
  return { ok, detail: { ms: Date.now() - t0, offerLen: offerCode.length, answerLen: answerCode.length } };
});

check('webrtc: channels are separate', async () => {
  await ev('B', () => (__rtcGot.length = 0));
  await ev('A', () => {
    // 200 position messages on the fast channel and 20 hits on the safe one, interleaved
    for (let i = 0; i < 200; i++) {
      __rtc.send(JSON.stringify({ t: 'pos', ts: i, fx: i, fz: 0, vx: 0, vz: 0 }), 'fast');
      if (i % 10 === 0) __rtc.send(JSON.stringify({ t: 'hit', ts: i, dmg: i / 10, color: 'red', tile: { c: 0, r: 0 } }), 'safe');
    }
  });
  await within('B', () => __rtcGot.filter(g => JSON.parse(g[1]).t === 'hit').length >= 20, null, 3000);
  await sleep(300);
  const got = (await ev('B', () => __rtcGot.map(g => g[1]))).map(JSON.parse);
  const hits = got.filter(m => m.t === 'hit').map(m => m.dmg);
  const pos = got.filter(m => m.t === 'pos');
  const inOrder = hits.length === 20 && hits.every((d, i) => d === i);
  const valid = pos.every(m => Number.isInteger(m.ts) && m.ts >= 0 && m.ts < 200 && m.fx === m.ts);
  return { ok: inOrder && valid && pos.length > 0, detail: { hits: hits.length, inOrder, posArrived: pos.length, valid } };
});

check('webrtc: latency budget', async () => {
  // B echoes each ping as a pong on the same channel; A times 200 round trips at 20 ms spacing
  await ev('B', () => {
    __rtc.onmessage = t => {
      const m = JSON.parse(t);
      if (m.t === 'ping') __rtc.send(JSON.stringify({ t: 'pong', n: m.n }), 'fast');
    };
  });
  const rtts = await ev('A', async () => {
    const sent = [], got = new Array(200).fill(null);
    __rtc.onmessage = t => {
      const m = JSON.parse(t);
      if (m.t === 'pong') got[m.n] = performance.now() - sent[m.n];
    };
    for (let i = 0; i < 200; i++) {
      sent[i] = performance.now();
      __rtc.send(JSON.stringify({ t: 'ping', n: i }), 'fast');
      await new Promise(r => setTimeout(r, 20));
    }
    await new Promise(r => setTimeout(r, 300));
    return got;
  });
  const done = rtts.filter(x => x !== null).sort((a, b) => a - b);
  const q = f => done[Math.min(done.length - 1, Math.floor(done.length * f))];
  const detail = { replies: done.length, medianMs: +q(0.5).toFixed(2), p95Ms: +q(0.95).toFixed(2), maxMs: +done[done.length - 1].toFixed(2) };
  console.log('  latency (fast channel, 200 pings @20ms):', JSON.stringify(detail));
  return { ok: done.length >= 190 && detail.medianMs < 15 && detail.p95Ms < 40, detail };
});

check('webrtc: session clock.rtt after the lobby handshake', async () => {
  await rtcConnect();
  await both(() => {
    window.__rtc.onmessage = null;
  });
  for (const [n, host, name] of [['A', true, 'Ann'], ['B', false, 'Bo']])
    await ev(n, ([host, name]) => {
      window.__rs = new DuelSession(window.__rtc, { name, deck: activeDeck().list, host });
    }, [host, name]);
  const ok = await within('A', () => __rs.state !== 'connecting' && __rs._samples.length > 0, null, 5000);
  const rtt = await both(() => [__rs.state, __rs.clock.rtt]);
  await both(() => {
    __rs.leave();
    __rtc.close();
  });
  return { ok: ok && rtt.every(r => r[1] < 40), detail: { rtt } };
});


// ---- the Duel menu: real clicks on the real buttons (debug menu, pairing screen, pause menu, result card) ----
// (a click at the middle of the element, after checking that it is the element that would get it; Wi-Fi codes
// travel between the two pages through Node, as people would carry them between phones)
const MP_KEYS = ['mpSpell', 'mpDefend', 'mpBackdate', 'mpSend', 'mpSmooth'];
const MP_DEFAULTS = [10, 50, 250, 16, 33];
async function uiTap(n, sel) {
  const page = pages[n];
  const el = page.locator(sel).filter({ visible: true }).first();
  await el.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
    throw Error('nothing visible to tap on ' + n + ': ' + sel);
  });
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const hit = await el.evaluate((el, { x, y }) => {
    const t = document.elementFromPoint(x, y);
    return t === el || el.contains(t);
  }, { x, y });
  if (!hit) throw Error('tap intercepted on ' + n + ': ' + sel);
  await page.mouse.click(x, y);
}
const uiFill = (n, sel, text) => pages[n].fill(sel, text);
// back to a known place: any duel gone, the menu showing, no overlay open
async function uiReset(n) {
  await ev(n, () => {
    View.gl = false;
    if (window.__D) window.__D.s.leave();
    if (window.__T && !window.__T.closed) window.__T.close();
    if (typeof duelLeave === 'function') duelLeave(true);
    B = null;
    paused = false;
    window.__hold = null;
    for (const id of ['custom', 'pause', 'reveal', 'debug']) document.getElementById(id).classList.remove('on');
    openMenu();
  });
}
async function uiDebug(n) {
  await ev(n, () => document.activeElement && document.activeElement.blur());
  if (!(await ev(n, () => document.getElementById('debug').classList.contains('on')))) await pages[n].keyboard.press('`');
  await until(n, () => document.getElementById('debug').classList.contains('on'), null, 2000);
  await uiTap(n, '.dbgTabs button[data-pane="General"]');
}
async function reloadPage(n) {
  await pages[n].reload();
  await pages[n].waitForFunction(() => typeof openCamp === 'function' && typeof save !== 'undefined');
  await ev(n, () => {
    save = newSave(STARTERS[0]);
    save.char = lockChar(newChar('human', 0));
  });
  await ev(n, pageKit);
}
// both players tap through to the lobby; returns when each has typed in its code
async function uiPair(opts = {}) {
  const names = { A: 'Ann', B: 'Bo' };
  for (const n of NAMES) await uiReset(n);
  gen++;
  await uiDebug('A');
  await uiTap('A', '#dbgDuel');
  await until('A', () => document.getElementById('scrDuel').classList.contains('on') && !document.getElementById('debug').classList.contains('on'), null, 2000);
  await uiFill('A', '#duName', names.A);
  await uiTap('A', '#duHost');
  await uiTap('A', '#duWifi');
  await until('A', () => document.getElementById('duOffer').value.startsWith('HEX1.'), null, 15000);
  const offer = await ev('A', () => document.getElementById('duOffer').value);
  await uiDebug('B');
  await uiTap('B', '#dbgDuel');
  await uiFill('B', '#duName', names.B);
  await uiTap('B', '#duJoin');
  await uiTap('B', '#duWifi');
  await uiFill('B', '#duOfferIn', offer);
  await uiTap('B', '#duMakeAnswer');
  await until('B', () => document.getElementById('duAnswer').value.startsWith('HEX1.'), null, 15000);
  const answer = await ev('B', () => document.getElementById('duAnswer').value);
  if (opts.stopBeforeAccept) return { offer, answer };
  await uiFill('A', '#duAnswerIn', answer);
  await uiTap('A', '#duAccept');
  return { offer, answer };
}
const lobbyText = n => ev(n, () => document.getElementById('duLobbyTxt').textContent);
const inDuel = () => B && B.pvp && B.pvp.session.state === 'fighting' && B.pvp.session.spell.open;
const savedData = n =>
  ev(n, () => {
    const o = {};
    for (const k of Object.keys(localStorage)) if (!/^hexmancers-(xl-|mpname|dbg)/.test(k)) o[k] = localStorage.getItem(k);
    return JSON.stringify(o);
  });
let uiSaved = null;

check('multiplayer section is in the debug menu', async () => {
  await uiReset('A');
  await ev('A', ([keys]) => {
    for (const k of keys) {
      localStorage.removeItem('hexmancers-xl-' + k);
      XLIT[k] = XLIT_DEF[k];
    }
  }, [MP_KEYS]);
  await uiDebug('A');
  const r = await ev('A', ([keys]) => {
    const q = id => document.getElementById(id);
    const vis = el => !!el && el.offsetParent !== null;
    const ids = ['dbgMpSpell', 'dbgMpDefend', 'dbgMpBackdate', 'dbgMpSend', 'dbgMpSmooth'];
    return {
      heading: [...document.querySelectorAll('#debug h3')].some(h => h.textContent.trim() === 'Multiplayer' && vis(h)),
      btn: vis(q('dbgDuel')),
      enabled: q('dbgDuel') && !q('dbgDuel').disabled,
      vals: ids.map(id => q(id) && +q(id).value),
      readouts: ids.map(id => q(id + 'V') && q(id + 'V').textContent),
      reset: !!q('dbgMpReset'),
      mmDuel: !!q('mmDuel'),
      order: ['dbgDuel', ...ids, 'dbgMpReset'].map(id => q(id) && [...document.querySelectorAll('#debug *')].indexOf(q(id)))
    };
  }, [MP_KEYS]);
  const sorted = r.order.every((x, i) => x > 0 && (i === 0 || x > r.order[i - 1]));
  const ok = r.heading && r.btn && r.enabled && JSON.stringify(r.vals) === JSON.stringify(MP_DEFAULTS) && r.readouts.every(t => t) && r.reset && !r.mmDuel && sorted;
  return { ok, detail: r };
});

check('sliders are saved and live', async () => {
  await ev('A', () => {
    const el = document.getElementById('dbgMpSpell');
    el.value = 4;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const live = await ev('A', () => [XLIT.mpSpell, localStorage.getItem('hexmancers-xl-mpSpell'), document.getElementById('dbgMpSpellV').textContent]);
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'game', 'index.html'), 'utf8'); // (the page rewrites step to 'any' for fine dragging)
  const ranges = ['dbgMpSpell', 'dbgMpDefend', 'dbgMpBackdate', 'dbgMpSend', 'dbgMpSmooth'].map(id => {
    const m = html.match(new RegExp('id="' + id + '" type="range" min="(\\d+)" max="(\\d+)" step="(\\d+)"'));
    return m ? [+m[1], +m[2], +m[3]] : null;
  });
  await reloadPage('A');
  const kept = await ev('A', () => XLIT.mpSpell);
  await uiDebug('A');
  const shown = await ev('A', () => +document.getElementById('dbgMpSpell').value);
  await ev('A', () => {
    for (const id of ['dbgMpDefend', 'dbgMpSmooth']) {
      const el = document.getElementById(id);
      el.value = 100;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await uiTap('A', '#dbgMpReset');
  const after = await ev('A', ([keys]) => ({ x: keys.map(k => XLIT[k]), ls: keys.map(k => localStorage.getItem('hexmancers-xl-' + k)), shown: ['dbgMpSpell', 'dbgMpDefend', 'dbgMpBackdate', 'dbgMpSend', 'dbgMpSmooth'].map(id => +document.getElementById(id).value) }), [MP_KEYS]);
  const wantRanges = [[3, 30, 1], [0, 200, 5], [50, 1000, 10], [0, 100, 1], [0, 100, 1]];
  const ok =
    live[0] === 4 && live[1] === '4' && live[2] === '4' && kept === 4 && shown === 4 &&
    JSON.stringify(ranges) === JSON.stringify(wantRanges) &&
    JSON.stringify(after.x) === JSON.stringify(MP_DEFAULTS) && JSON.stringify(after.shown) === JSON.stringify(MP_DEFAULTS) &&
    after.ls.every(v => v === null || v === String(MP_DEFAULTS[after.ls.indexOf(v)]));
  return { ok, detail: { live, ranges, kept, shown, after } };
});

check('duel button disabled without a valid deck', async () => {
  await uiReset('A');
  const orig = await ev('A', () => {
    window.__deck = activeDeck().list.slice();
    activeDeck().list = window.__deck.slice(0, 10);
  });
  await uiDebug('A');
  const bad = await ev('A', () => ({ disabled: document.getElementById('dbgDuel').disabled, hint: document.getElementById('dbgDuelHint').textContent, shown: document.getElementById('dbgDuelHint').offsetParent !== null }));
  await ev('A', () => document.getElementById('dbgDuel').click());
  const stayed = await ev('A', () => !document.getElementById('scrDuel').classList.contains('on'));
  await uiReset('A');
  await ev('A', () => (activeDeck().list = window.__deck));
  await uiDebug('A');
  const good = await ev('A', () => ({ disabled: document.getElementById('dbgDuel').disabled, hint: document.getElementById('dbgDuelHint').textContent }));
  return { ok: bad.disabled && bad.shown && bad.hint.length > 5 && stayed && !good.disabled && good.hint === '', detail: { bad, stayed, good } };
});

check('room is offered only over http and not on itch.io', async () => {
  const r = await ev('A', () => [duelRoomOk('http:', '192.168.1.5'), duelRoomOk('http:', 'localhost'), duelRoomOk('https:', 'example.com'), duelRoomOk('https:', 'bryan.itch.io'), duelRoomOk('http:', 'x.itch.zone'), duelRoomOk('http:', 'html-classic.itch.zone'), duelRoomOk('http:', 'itch.io')]);
  return { ok: JSON.stringify(r) === JSON.stringify([true, true, false, false, false, false, false]), detail: r };
});

check('bad code shows an error', async () => {
  await uiReset('A');
  await uiDebug('A');
  await uiTap('A', '#dbgDuel');
  await uiTap('A', '#duJoin');
  await uiTap('A', '#duWifi');
  await uiFill('A', '#duOfferIn', 'HEX1.nonsense');
  await uiTap('A', '#duMakeAnswer');
  const ok1 = await within('A', () => /Bad code/.test(document.getElementById('duMsg').textContent), null, 4000);
  const r = await ev('A', () => ({ msg: document.getElementById('duMsg').textContent, step: DU.step, joinShown: !document.getElementById('duJoinCode').hidden, on: document.getElementById('scrDuel').classList.contains('on') }));
  // a way back: Back goes a step back, and from the first step to the menu, closing everything
  await uiTap('A', '#duBack');
  const s1 = await ev('A', () => DU.step);
  await uiTap('A', '#duBack');
  const s2 = await ev('A', () => DU.step);
  await uiTap('A', '#duBack');
  const menu = await ev('A', () => document.getElementById('scrMenu').classList.contains('on'));
  return { ok: ok1 && r.joinShown && r.on && r.step === 'joincode' && s1 === 'how' && s2 === 'role' && menu, detail: { r, s1, s2, menu } };
});

check('connect times out with a readable message and a way back', async () => {
  await uiPair({ stopBeforeAccept: true }).then(async ({ answer }) => {
    await ev('B', () => document.getElementById('duBack').click()); // the guest goes away: its end of the link closes
    await ev('A', () => (DU.timeout = 1500));
    await uiFill('A', '#duAnswerIn', answer);
    await uiTap('A', '#duAccept');
  });
  const ok1 = await within('A', () => /Could not connect\. Check you are on the same Wi-Fi and try again\./.test(document.getElementById('duMsg').textContent), null, 8000);
  const r = await ev('A', () => ({ msg: document.getElementById('duMsg').textContent, step: DU.step, session: !!DU.session, tr: !!DU.tr }));
  await uiTap('A', '#duBack');
  const back = await ev('A', () => DU.step);
  await ev('A', () => (DU.timeout = 20000));
  return { ok: ok1 && !r.session && !r.tr && r.step === 'how' && back === 'role', detail: { r, back } };
});

check('refused handshake shows its reason inline', async () => {
  await uiReset('A');
  await uiReset('B');
  await ev('B', () => {
    window.__deck = activeDeck().list.slice();
    activeDeck().list = window.__deck.slice(0, 40); // too short for the host to accept
  });
  // (the debug button would be disabled for B: it opens the screen itself)
  await ev('B', () => openDuel());
  await uiDebug('A');
  await uiTap('A', '#dbgDuel');
  await uiTap('A', '#duHost');
  await uiTap('A', '#duWifi');
  await until('A', () => document.getElementById('duOffer').value.startsWith('HEX1.'), null, 15000);
  const offer = await ev('A', () => document.getElementById('duOffer').value);
  await uiTap('B', '#duJoin');
  await uiTap('B', '#duWifi');
  await uiFill('B', '#duOfferIn', offer);
  await uiTap('B', '#duMakeAnswer');
  await until('B', () => document.getElementById('duAnswer').value.startsWith('HEX1.'), null, 15000);
  await uiFill('A', '#duAnswerIn', await ev('B', () => document.getElementById('duAnswer').value));
  await uiTap('A', '#duAccept');
  const ok1 = await within('A', () => /invalid deck size/.test(document.getElementById('duMsg').textContent), null, 8000);
  const r = await ev('A', () => ({ msg: document.getElementById('duMsg').textContent, on: document.getElementById('scrDuel').classList.contains('on'), session: !!DU.session }));
  await ev('B', () => (activeDeck().list = window.__deck));
  return { ok: ok1 && r.on && !r.session, detail: r };
});

check('host and guest reach lobby', async () => {
  uiSaved = await savedData('A');
  await uiPair();
  const ok1 = await within('A', () => /Bo/.test(document.getElementById('duLobbyTxt').textContent), null, 15000);
  const ok2 = await within('B', () => /Ann/.test(document.getElementById('duLobbyTxt').textContent), null, 15000);
  const t = [await lobbyText('A'), await lobbyText('B')];
  let fight = true;
  for (const n of NAMES) fight = fight && (await within(n, inDuel, null, 8000));
  const dbg = ok1 && ok2 && fight ? null : await both(() => ({ step: DU.step, msg: document.getElementById('duMsg').textContent, session: DU.session && DU.session.state, to: DU.timeout, gen: DU.gen, tr: !!DU.tr, wait: document.getElementById('duWaitTxt').textContent }));
  return { ok: ok1 && ok2 && fight, detail: { t, fight, dbg } };
});

check('pause is disabled in a duel', async () => {
  const run = await both(() => ({ dis: document.getElementById('dbgPause').disabled, note: document.getElementById('dbgPauseNote').hidden, timer: !!DU.timer, custom: document.getElementById('custom').classList.contains('on') }));
  const ok = run.every(r => r.dis && !r.note && r.timer && r.custom);
  return { ok, detail: run };
});

check('a result closes the card screen, and leaving tears the duel down', async () => {
  // B leaves from the card screen (the same function the pause menu's Leave runs); A is shown the result with its card screen open
  await ev('B', () => duelLeave());
  const okA = await within('A', () => document.getElementById('reveal').classList.contains('on'), null, 4000);
  const a = await ev('A', () => ({ title: document.getElementById('rvTitle').textContent, custom: document.getElementById('custom').classList.contains('on'), dis: document.getElementById('dbgPause').disabled, timer: DU.timer, tr: !!DU.tr, session: !!DU.session }));
  const b = await ev('B', () => ({ b: B, menu: document.getElementById('scrMenu').classList.contains('on'), custom: document.getElementById('custom').classList.contains('on'), dis: document.getElementById('dbgPause').disabled, timer: DU.timer, tr: !!DU.tr, session: !!DU.session, closed: window.__lastClosed }));
  const ok = okA && a.title === 'Opponent left' && !a.custom && !a.dis && !a.timer && b.b === null && b.menu && !b.custom && !b.dis && !b.timer && !b.tr && !b.session;
  return { ok, detail: { a, b } };
});

check('result card and back', async () => {
  const before = await ev('A', () => document.getElementById('rvBtns').textContent);
  await uiTap('A', '#rvBtns .btn');
  const r = await ev('A', () => ({ menu: document.getElementById('scrMenu').classList.contains('on'), b: B === null, reveal: document.getElementById('reveal').classList.contains('on') }));
  const same = (await savedData('A')) === uiSaved;
  return { ok: before === 'Back to menu' && r.menu && r.b && !r.reveal && same, detail: { before, r, same } };
});

check('pause menu leaves a duel and the other side is told', async () => {
  await uiPair();
  for (const n of NAMES) await until(n, inDuel, null, 15000);
  await both(() => duelFight());
  for (const n of NAMES) await until(n, () => B.phase === 'fight', null, 4000);
  await uiTap('A', '#btnMenu');
  const m = await ev('A', () => ({ leave: !document.getElementById('mLeave').hidden, run: !document.getElementById('mRun').hidden, text: document.getElementById('mLeave').textContent }));
  await uiTap('A', '#mLeave');
  await uiTap('A', '#mLeave');
  const a = await ev('A', () => ({ menu: document.getElementById('scrMenu').classList.contains('on'), b: B === null, pause: document.getElementById('pause').classList.contains('on'), timer: DU.timer, session: !!DU.session, dis: document.getElementById('dbgPause').disabled }));
  const okB = await within('B', () => document.getElementById('reveal').classList.contains('on') && document.getElementById('rvTitle').textContent === 'Opponent left', null, 4000);
  await uiTap('B', '#rvBtns .btn');
  const bMenu = await ev('B', () => document.getElementById('scrMenu').classList.contains('on') && B === null);
  const ok = m.leave && !m.run && a.menu && a.b && !a.pause && !a.timer && !a.session && !a.dis && okB && bMenu;
  return { ok, detail: { m, a, okB, bMenu } };
});

check('a paused tab does not forfeit, and a death ends the duel', async () => {
  await uiPair();
  for (const n of NAMES) await until(n, inDuel, null, 15000);
  await both(() => duelFight());
  for (const n of NAMES) await until(n, () => B.phase === 'fight', null, 4000);
  await ev('A', () => openPause());
  await sleep(6500); // longer than the 5 s of silence that forfeits; only the 500 ms timer is ticking A
  const still = await ev('B', () => ({ state: B.pvp.session.state, reveal: document.getElementById('reveal').classList.contains('on') }));
  await ev('A', () => closePause());
  await ev('A', () => {
    B.player.hp = 1;
  });
  await ev('B', () => hitEnemy(duelAvatar(), 5, null, { raw: true })); // B lands the blow that A falls to
  const okA = await within('A', () => document.getElementById('reveal').classList.contains('on'), null, 4000);
  const okB = await within('B', () => document.getElementById('reveal').classList.contains('on'), null, 4000);
  const t = await both(() => document.getElementById('rvTitle').textContent);
  for (const n of NAMES) await uiTap(n, '#rvBtns .btn');
  const menus = await both(() => document.getElementById('scrMenu').classList.contains('on') && B === null && !DU.timer && !DU.session);
  return { ok: still.state === 'fighting' && !still.reveal && okA && okB && t[0] === 'You lost' && t[1] === 'You won' && menus.every(Boolean), detail: { still, t, menus } };
});

check('no Run in a duel: hidden on the card screen, and the entry points do nothing', async () => {
  await uiPair();
  for (const n of NAMES) await until(n, inDuel, null, 15000);
  const before = await savedData('A');
  const vis = await ev('A', () => {
    hud(true);
    const b = document.getElementById('btnRun');
    return { custom: document.getElementById('custom').classList.contains('on'), hidden: b.hidden || b.disabled || b.offsetParent === null };
  });
  const r = await ev('A', () => {
    window.__camp = 0;
    const o = window.openCamp;
    window.openCamp = function () { window.__camp++; return o.apply(this, arguments); };
    const gold = save.gold;
    try { document.getElementById('btnRun').click(); } catch (e) {}
    try { doRun('gold'); doRun('card'); } catch (e) {}
    window.openCamp = o;
    return { camp: window.__camp, gold: save.gold === gold, b: !!B, pvp: !!(B && B.pvp), session: !!DU.session, timer: !!DU.timer, state: DU.session && DU.session.state };
  });
  const after = await savedData('A');
  const ok = vis.custom && vis.hidden && r.camp === 0 && r.gold && r.b && r.pvp && r.session && r.timer && before === after;
  await both(() => duelLeave(true));
  return { ok, detail: { vis, r, same: before === after } };
});

check('single-player Run still works outside a duel', async () => {
  const r = await ev('A', () => {
    B = null;
    openMenu();
    return { pvpBlocked: (() => { fight(1); const x = runBlocked(); const gold = save.gold; const hidden = document.getElementById('btnRun').hidden; return { x, hidden }; })() };
  });
  await ev('A', () => { openCustomScreen(); hud(true); });
  const r2 = await ev('A', () => ({ blocked: runBlocked(), hidden: document.getElementById('btnRun').hidden }));
  await ev('A', () => { openRun(); });
  const sheet = await ev('A', () => document.getElementById('runSheet').classList.contains('on'));
  await ev('A', () => { document.getElementById('runSheet').classList.remove('on'); B = null; paused = false; openMenu(); });
  return { ok: r2.blocked === '' && !r2.hidden && sheet, detail: { r, r2, sheet } };
});

check('room: the relay pairs two pages by a room name (host first, then guest)', async () => {
  const relay = await require('../netplay/relay.js').startRelay({ port: 0, dir: path.join(__dirname, '..', '..', 'game') });
  try {
    const url = 'http://127.0.0.1:' + relay.port + '/index.html';
    for (const n of NAMES) {
      await pages[n].goto(url);
      await pages[n].waitForFunction(() => typeof openCamp === 'function' && typeof save !== 'undefined');
      await ev(n, () => {
        save = newSave(STARTERS[0]);
        save.char = lockChar(newChar('human', 0));
        View.gl = false;
      });
    }
    await uiDebug('A');
    await uiTap('A', '#dbgDuel');
    await uiFill('A', '#duName', 'Ann');
    await uiTap('A', '#duHost');
    await uiTap('A', '#duRoom');
    const room = await ev('A', () => document.getElementById('duRoomName').value);
    await uiTap('A', '#duRoomGo');
    await until('A', () => DU.step === 'wait' && !!DU.tr, null, 5000);
    await uiDebug('B');
    await uiTap('B', '#dbgDuel');
    await uiFill('B', '#duName', 'Bo');
    await uiTap('B', '#duJoin');
    await uiTap('B', '#duRoom');
    await uiFill('B', '#duRoomName', room.toLowerCase());
    await uiTap('B', '#duRoomGo');
    const ok1 = await within('A', () => /Bo/.test(document.getElementById('duLobbyTxt').textContent), null, 8000);
    const ok2 = await within('B', () => /Ann/.test(document.getElementById('duLobbyTxt').textContent), null, 8000);
    let fight = true;
    for (const n of NAMES) fight = fight && (await within(n, inDuel, null, 8000));
    await both(() => duelLeave(true));
    return { ok: /^[A-Z]{4}$/.test(room) && ok1 && ok2 && fight, detail: { room, ok1, ok2, fight } };
  } finally {
    await relay.close();
  }
});

async function run(out = process.argv[2] || 'playtest-duel-results') {
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  let host, browser;
  const errors = [];
  try {
    host = await R.serve();
    ({ browser } = await R.launch());
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    for (const n of NAMES) {
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
      page.on('console', m => {
        if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(n + ' console: ' + m.text());
      });
      await page.exposeFunction('__bridgeSend', (g, text) => deliver(n, g, text));
      pages[n] = page;
    }
    for (const n of NAMES) {
      await pages[n].goto(host.url);
      await pages[n].waitForFunction(() => typeof openCamp === 'function' && typeof save !== 'undefined');
    }
    await both(() => {
      save = newSave(STARTERS[0]);
      save.char = lockChar(newChar('human', 0));
    });
    await both(pageKit);
    let setup = null;
    try {
      if ((await ev('A', () => typeof startDuel)) !== 'function') throw Error('startDuel is not defined');
      await newDuel();
    } catch (e) {
      setup = e.message;
    }
    for (const [name, fn] of checks) {
      if (process.env.DUEL_ONLY && !new RegExp(process.env.DUEL_ONLY).test(name)) continue; // while working: DUEL_ONLY='lobby|pause'
      let r;
      if (setup) r = { ok: false, detail: setup };
      else
        try {
          r = await fn();
        } catch (e) {
          r = { ok: false, detail: e.message.split('\n')[0] };
        }
      results.push({ name, ok: !!r.ok, detail: r.detail });
      console.log((r.ok ? 'ok   ' : 'FAIL ') + name, r.ok ? '' : JSON.stringify(r.detail));
      if (!r.ok) process.exitCode = 1;
    }
    if (errors.length) {
      console.log('FAIL page errors', errors.slice(0, 5));
      process.exitCode = 1;
    }
    const passed = results.filter(r => r.ok).length;
    console.log(passed + '/' + results.length + ' passed');
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, errors }, null, 2));
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      if (host) await host.close();
    }
  }
  return results;
}

module.exports = { run };
if (require.main === module)
  run().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
