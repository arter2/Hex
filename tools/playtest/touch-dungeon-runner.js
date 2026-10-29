'use strict';
/* node tools/playtest/touch-dungeon-runner.js <results-directory> [options]
     --depths 1,4,6       the depths to start a session at (one session each)            default 1,4,6,12,17,22
     --floors 2           floors to play down from each start (takes the stairs)          default 1
     --minutes 8          time allowed per floor                                          default 8
     --device phone       phone | phone-landscape | tablet | tablet-landscape | small     default phone
     --move float         touch movement style (Settings › Touch movement): tapstick, goal, float, fixed, follow,
                          or mix (a different one each floor)                             default mix
     --skill average      the player: new | average | good                                default average
     --seed 1             the player's dice and the save's world seed (same seed + depth = same floors)  default 1
   (the old form <dir> [depths] [minutesPerFloor] [device] still works)

   A QA player on dungeon floors who only touches the screen. The save is prepared (a starter deck and a character
   levelled for the depth); after that every action is a touch at screen coordinates, sent through Chromium's own
   multi-touch input: two thumbs, so one can walk or steer while the other taps Strike, Fire or Cast.

   It plays as a person would and only knows what a person could. On the floor: the map it has explored, enemies,
   pots, chests and traps it can see right now, its HP, the log and what the buttons say; it never reads the floor
   plan, hidden traps, secret doors or an enemy out of sight. It walks with the chosen touch style (taps, a floating
   or fixed stick, or a finger to follow), breaks pots and strikes enemies first while walking (a second finger on
   Strike), ambushes sleeping ones when healthy, backs off when hurt, opens chests, sometimes searches a dead end,
   reads dialogs at reading speed and goes down once it has seen enough of the floor. In a fight: bot.js's human
   model (PT.brain) reads the board (telegraphs, shots, wind-ups) with a person's reaction time and sometimes misses
   one; the runner turns its choice into a thumb on the board's stick, and Fire, Cast and Spell under the other thumb,
   at a person's pace. A new player reacts slower, misses more and aims worse than a good one.

   It notes: page errors; taps the game ignored; Strike pressed while walking that did not swing; walks that went
   nowhere; softlocks and overlays it could not leave; stutters (frames well over the page's own usual frame) and
   long tasks, with what the game was doing; lost WebGL contexts; black, blank or frozen frames; text reading NaN or
   undefined, clipped text, broken images, controls off screen or under something else; and per floor and per fight:
   time, HP lost, hits taken, deaths and what killed it, how fights opened (ambush, first strike, surprised).
   Results: <dir>/results.json and screenshots. Frame times on a software-rendered headless browser are slower than
   a phone; stutters are counted against the page's own median frame, so a slow machine is not a stutter by itself. */
const fs = require('fs'),
  path = require('path'),
  R = require('./runner-common.js'),
  H = require('./touch-human.js');
const { sleep } = H;
const DEVICES = {
  phone: { width: 390, height: 844 },
  small: { width: 360, height: 640 },
  'phone-landscape': { width: 844, height: 390 },
  tablet: { width: 820, height: 1180 },
  'tablet-landscape': { width: 1180, height: 820 }
};
const MOVES = ['tapstick', 'goal', 'float', 'fixed', 'follow'];

function args(argv) {
  const o = { out: argv[0] || 'playtest-touch-dungeon', depths: '1,4,6,12,17,22', floors: 1, minutes: 8, device: 'phone', move: 'mix', skill: 'average', seed: 1 };
  const rest = argv.slice(1);
  if (rest[0] && !rest[0].startsWith('--')) {
    // the old positional form
    [o.depths = o.depths, o.minutes = o.minutes, o.device = o.device] = rest;
  } else
    for (let i = 0; i < rest.length; i += 2) {
      const k = rest[i].replace(/^--/, '');
      if (!(k in o)) throw Error('unknown option --' + k);
      o[k] = rest[i + 1];
    }
  o.depths = String(o.depths).split(',').map(Number);
  o.floors = Number(o.floors);
  o.minutes = Number(o.minutes);
  o.seed = Number(o.seed);
  if (!DEVICES[o.device]) throw Error('device: ' + Object.keys(DEVICES).join(', '));
  if (o.move !== 'mix' && !MOVES.includes(o.move)) throw Error('move: mix or ' + MOVES.join(', '));
  return o;
}

/* ---------- in the page: what the player can see ---------- */
const SCREEN = () => {
  const on = el => !!el && el.classList.contains('on');
  const overlays = [...document.querySelectorAll('.overlay.on')].map(e => e.id).filter(id => id && id !== 'debug');
  const peek = document.getElementById('peek');
  if (peek && peek.classList.contains('on')) overlays.push('peek');
  const screen = ['scrMenu', 'scrCamp', 'scrExplore', 'scrBattle', 'scrStart'].find(id => on(document.getElementById(id))) || (document.querySelector('.screen.on') || {}).id || null;
  const tip = document.getElementById('xTipCard'),
    tipOpen = !!tip && getComputedStyle(tip).display !== 'none' && tip.getBoundingClientRect().height > 0 && getComputedStyle(tip).visibility !== 'hidden' && getComputedStyle(tip).opacity !== '0';
  const ex = typeof EX !== 'undefined' && EX ? EX : null,
    b = typeof B !== 'undefined' && B ? B : null;
  return {
    screen,
    overlays,
    tipOpen,
    tipText: tipOpen ? document.getElementById('xTipText').textContent.trim() : null,
    bang: (document.getElementById('xBang') || {}).textContent || '',
    depth: ex ? ex.depth : null,
    pc: ex ? ex.pc : null,
    hp: ex ? ex.hp : null,
    maxHp: ex && typeof xmaxHp === 'function' ? xmaxHp() : null,
    busy: ex ? !!ex.busy : null,
    battleHp: b && b.player ? b.player.hp : null,
    battlePhase: b ? b.phase : null,
    enemies: b && b.enemies ? b.enemies.filter(e => e.hp > 0).length : null,
    log: [...document.querySelectorAll('#xLog > *')].slice(-3).map(e => e.textContent.trim())
  };
};

/* The floor as the player knows it: the map explored so far, what is in sight now, and where things are on screen.
   Nothing here comes from the floor plan: enemies only while in view, traps only once spotted, cells only once seen. */
const SEE = () => {
  if (typeof EX === 'undefined' || !EX || !EX.active || !X3 || !X3.cam) return null;
  const view = appBox(document.getElementById('xView'));
  const avoid = ['xTop', 'xBottom', 'xMini', 'xStatus', 'xTipCard']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(e => e.getBoundingClientRect())
    .filter(b => b.width && b.height);
  const scr = (wx, wz, strict) => {
    const v = new THREE.Vector3(wx, 0, wz).project(X3.cam);
    if (v.z > 1) return null;
    const x = view.left + ((v.x + 1) / 2) * view.width,
      y = view.top + ((1 - v.y) / 2) * view.height;
    if (strict) {
      if (x < 24 || y < 24 || x > innerWidth - 24 || y > innerHeight - 24) return null;
      if (avoid.some(b => x > b.left - 6 && x < b.right + 6 && y > b.top - 6 && y < b.bottom + 6)) return null;
    }
    return { x: Math.round(x), y: Math.round(y) };
  };
  const cellD = c => Math.hypot(xw(c) - EX.px, xz(c) - EX.pz) / XCS;
  const enemies = EX.groups
    .filter(g => g.sprite && g.sprite.visible && EX.vis[g.cell] && !g.dormant)
    .map(g => ({ cell: g.cell, d: +(Math.hypot(g.x - EX.px, g.z - EX.pz) / XCS).toFixed(2), asleep: g.state === 'sleep', coming: g.state === 'chase', boss: !!g.boss, name: (ENEMY_DEFS[g.ids[0]] || {}).name, at: scr(g.x, g.z, true) }))
    .sort((a, b) => a.d - b.d);
  const pots = EX.props.filter(p => p.kind === 'pot' && !p.gone && EX.seen[p.cell]).map(p => ({ cell: p.cell, d: +cellD(p.cell).toFixed(2), at: scr(xw(p.cell), xz(p.cell), true) })).sort((a, b) => a.d - b.d).slice(0, 6);
  const chests = EX.chests.filter(c => !c.open && EX.seen[c.cell]).map(c => ({ cell: c.cell, d: +cellD(c.cell).toFixed(2), trap: !!(c.trap && c.trapKnown), at: scr(xw(c.cell), xz(c.cell), true) })).sort((a, b) => a.d - b.d).slice(0, 4);
  const traps = EX.traps.filter(t => t.armed && t.known).map(t => t.cell);
  let seen = 0, open = 0;
  for (let i = 0; i < EX.seen.length; i++) if (EX.t[i] !== T_ROCK) (open++, EX.seen[i] && seen++);
  // a dead end: one open way out of where you stand
  const x = xcx(EX.pc), y = xcy(EX.pc), ways = [xi(x + 1, y), xi(x - 1, y), xi(x, y + 1), xi(x, y - 1)].filter(n => n >= 0 && xPassable(n)).length;
  const btn = id => {
    const e = document.getElementById(id);
    if (!e || e.disabled || !e.offsetParent) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const tip = document.getElementById('xTipCard');
  return {
    pc: EX.pc,
    blocked: !!document.querySelector('.overlay.on') || (!!tip && getComputedStyle(tip).display !== 'none' && tip.getBoundingClientRect().height > 0 && getComputedStyle(tip).opacity !== '0' && getComputedStyle(tip).visibility !== 'hidden'),
    me: scr(EX.px, EX.pz, false),
    hp: EX.hp,
    maxHp: xmaxHp(),
    busy: !!EX.busy,
    walking: !!(EX.goal != null || (EX.path && EX.path.length) || EX.walk),
    action: EX.action || null,
    strikeCd: EX.strikeCd || 0,
    swing: EX.swingT || 0,
    enemies,
    pots,
    chests,
    traps,
    stairs: EX.seen[EX.down] ? EX.down : -1,
    stairsD: EX.seen[EX.down] ? +cellD(EX.down).toFixed(1) : null,
    explored: open ? seen / open : 0,
    deadEnd: ways <= 1,
    strike: btn('xStrike'),
    search: btn('xSearch'),
    disarm: btn('xDisarm'),
    home: typeof xStickHome === 'function' ? xStickHome() : null,
    stickR: typeof XSTICK_R !== 'undefined' ? XSTICK_R : 56,
    view: { x: view.left, y: view.top, w: view.width, h: view.height },
    bottomTop: (() => {
      const b = document.getElementById('xBottom');
      const r = b && b.getBoundingClientRect();
      return r && r.height ? r.top : innerHeight;
    })()
  };
};

// the route the game's own tap would take to a cell, and points on screen along it
const ROUTE = target => {
  if (!EX || !EX.active) return null;
  const view = appBox(document.getElementById('xView'));
  const avoid = ['xTop', 'xBottom', 'xMini', 'xStatus', 'xTipCard']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(e => e.getBoundingClientRect())
    .filter(b => b.width && b.height);
  const scr = c => {
    const v = new THREE.Vector3(xw(c), 0, xz(c)).project(X3.cam);
    if (v.z > 1) return null;
    const x = view.left + ((v.x + 1) / 2) * view.width,
      y = view.top + ((1 - v.y) / 2) * view.height;
    if (x < 24 || y < 24 || x > innerWidth - 24 || y > innerHeight - 24) return null;
    if (avoid.some(b => x > b.left - 6 && x < b.right + 6 && y > b.top - 6 && y < b.bottom + 6)) return null;
    return { x: Math.round(x), y: Math.round(y) };
  };
  const route = target === EX.pc ? [] : xPathToCell(target);
  if (!route || (!route.length && target !== EX.pc)) return { len: 0 };
  const raw = c => {
    const v = new THREE.Vector3(xw(c), 0, xz(c)).project(X3.cam);
    return v.z > 1 ? null : { x: Math.round(view.left + ((v.x + 1) / 2) * view.width), y: Math.round(view.top + ((1 - v.y) / 2) * view.height) };
  };
  const pts = route.slice(0, 16).map(c => ({ c, at: scr(c), raw: raw(c) }));
  const me = new THREE.Vector3(EX.px, 0, EX.pz).project(X3.cam);
  return { len: route.length, pts, me: { x: view.left + ((me.x + 1) / 2) * view.width, y: view.top + ((1 - me.y) / 2) * view.height }, end: route[route.length - 1] };
};

// where a person exploring would head next: the stairs once seen and the floor seen enough, else an edge of the
// explored map (the minimap shows these), nearest first with a little whim among the nearest few
const FRONTIER = (black, pickR) => {
  if (!EX || !EX.active) return [];
  const N = XN * XN,
    bl = new Set(black),
    seen = new Array(N).fill(-1),
    q = [EX.pc],
    out = [];
  seen[EX.pc] = 0;
  while (q.length && out.length < 4) {
    const c = q.shift(),
      x = xcx(c),
      y = xcy(c);
    const ns = [xi(x + 1, y), xi(x - 1, y), xi(x, y + 1), xi(x, y - 1)].filter(n => n >= 0 && n < N && Math.abs(xcx(n) - x) + Math.abs(xcy(n) - y) === 1);
    if (c !== EX.pc && !bl.has(c) && ns.some(n => !EX.seen[n] && xPassable(n))) out.push({ c, d: seen[c] });
    for (const n of ns) if (seen[n] < 0 && EX.seen[n] && xPassable(n)) (seen[n] = seen[c] + 1), q.push(n);
  }
  return out;
};

/* ---------- in the page: the battle board ---------- */
const BATTLE_SEE = bot => {
  if (typeof B === 'undefined' || !B || !B.player) return null;
  const b = B,
    p = b.player,
    board = document.getElementById('board').getBoundingClientRect();
  const at = t => {
    const [x, y] = proj(t.wx, 0, t.wz);
    return { x: Math.round(x), y: Math.round(y) };
  };
  const rect = id => {
    const e = document.getElementById(id);
    if (!e || !e.offsetParent) return null;
    const r = e.getBoundingClientRect();
    return r.width ? { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height * 0.62), w: r.width, h: r.height, disabled: !!e.disabled } : null;
  };
  let move = null,
    danger = false,
    row = false,
    lob = null;
  if (b.phase === 'fight' && window.PT && PT.brain) {
    PT.brain.look();
    const w = PT.brain.where(bot);
    if (w.tile) move = { col: w.tile.col, r: w.tile.r, here: w.tile === p.tile, gain: Math.round(w.score - (w.here == null ? w.score : w.here)), at: at(w.tile) };
    danger = PT.brain.danger(p.tile, 0.8);
    row = PT.brain.rowTarget(p.tile);
    if (typeof nextIsLob === 'function' && nextIsLob()) {
      const t = PT.brain.lobTarget();
      if (t) lob = at(t);
    }
  }
  const q = b.piles.queue[0];
  let useful = false;
  if (q && typeof castPreview === 'function')
    try {
      const pv = castPreview();
      useful = !!(pv && (pv.hit.length || pv.self || pv.place.length));
    } catch (e) {}
  const fx = p.fx ?? p.tile.wx,
    fz = p.fz ?? p.tile.wz,
    [mx, my] = proj(fx, 0, fz);
  // a resting place for the stick thumb: on the board, below your mage, on your side or off the tiles
  let anchor = null;
  const hb = document.getElementById('hudBottom'),
    floor = hb && hb.getBoundingClientRect().height ? hb.getBoundingClientRect().top : board.bottom;
  for (const [fx2, fy2] of [[0.5, 0.82], [0.4, 0.8], [0.6, 0.8], [0.5, 0.72], [0.3, 0.75], [0.7, 0.75], [0.5, 0.62]]) {
    const x = board.left + board.width * fx2,
      y = Math.min(board.top + board.height * fy2, floor - 30);
    const el = document.elementFromPoint(x, y),
      t = pickTile(x, y);
    if (el && el.id === 'board' && (!t || t.side === 'p')) {
      anchor = { x: Math.round(x), y: Math.round(y) };
      break;
    }
  }
  const inst = [...document.querySelectorAll('#instRow .inst')].filter(e => e.offsetParent).map(e => {
    const r = e.getBoundingClientRect();
    return { name: (e.querySelector('.inm') || e).textContent.trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  const scr = document.querySelector('.screen.on');
  return {
    screen: scr ? scr.id : null,
    overlays: [...document.querySelectorAll('.overlay.on')].map(e => e.id).filter(id => id && id !== 'debug'),
    qHead: q ? q.uid : null,
    castCd: p.castCd,
    lastPress: window.__qa ? __qa.lastPress : null,
    recent: window.__qa ? __qa.ptr.slice(-4) : null,
    phase: b.phase,
    hp: p.hp,
    maxHp: p.maxHp,
    me: { x: Math.round(mx), y: Math.round(my) },
    move,
    danger,
    row,
    lob,
    wandCd: p.wandCd,
    charging: !!p.charging,
    chargeReady: !!p.charging && p.chargeT >= chargeNeed(p),
    cast: !!(q && p.castCd <= 0 && !(q.frozenT > 0)),
    castUseful: useful,
    gauge: typeof gaugeFull === 'function' && gaugeFull() && !wandOnly(b.piles),
    enemies: b.enemies.filter(e => e.hp > 0).map(e => (e.def && e.def.name) || e.id),
    fire: rect('btnWand'),
    castBtn: rect('btnCast'),
    spell: rect('btnSpell'),
    inst,
    anchor,
    stickR: typeof MV === 'function' ? MV('mvStickR') : 48,
    t: b.time
  };
};

// the hand screen: each card on screen with its uid, and the brain's picks
const HAND = () => {
  if (!B || !B.piles) return null;
  const P = B.piles,
    picks = window.PT && PT.brain ? PT.brain.queuePick() : [];
  const cards = [...document.querySelectorAll('#custHand .card[data-i]')].map(el => {
    const h = P.hand[+el.dataset.i],
      r = el.getBoundingClientRect();
    return { i: +el.dataset.i, uid: h && h.uid, name: h && h.card.name, queued: !!(h && P.queue.includes(h)), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height * 0.45), w: Math.round(r.width), h: Math.round(r.height), onScreen: r.bottom > 0 && r.top < innerHeight };
  });
  const fightBtn = document.getElementById('btnFight').getBoundingClientRect();
  return { cards, picks, queued: P.queue.length, slots: slotsOf(P), fight: { x: Math.round(fightBtn.x + fightBtn.width / 2), y: Math.round(fightBtn.y + fightBtn.height / 2), w: fightBtn.width } };
};

// buttons the player could press in an overlay, with their text
const BUTTONS = id => {
  const box = document.getElementById(id);
  if (!box) return [];
  return [...box.querySelectorAll('button, .btn, [role=button]')]
    .filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !b.disabled && getComputedStyle(b).visibility !== 'hidden';
    })
    .map((b, i) => {
      b.dataset.qa = id + '-' + i;
      const r = b.getBoundingClientRect();
      return { sel: `[data-qa="${id}-${i}"]`, text: (b.innerText || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), label: b.getAttribute('aria-label') || b.title || '', x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    });
};
const HUD_AUDIT = () => {
  const out = { covered: [], small: [] };
  for (const id of ['xMenu', 'xStrike', 'xSearch', 'xDisarm', 'xBag', 'xCamp', 'xMini', 'xMapBtn']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') continue;
    if (r.width < 44 || r.height < 44) out.small.push({ control: id, w: Math.round(r.width), h: Math.round(r.height) });
    const x = r.x + r.width / 2,
      y = r.y + r.height / 2,
      t = document.elementFromPoint(x, y);
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) out.covered.push({ control: id, cover: 'off screen' });
    else if (!(t === el || el.contains(t))) out.covered.push({ control: id, cover: t ? t.id || String(t.className) : null });
  }
  return out;
};
const pickBtn = (buttons, prefer) => {
  for (const re of prefer) {
    const b = buttons.find(b => re.test(b.text) || re.test(b.label));
    if (b) return b;
  }
  return buttons[0] || null;
};

/* ---------- one session: a start depth, played down for a number of floors ---------- */
async function session(browser, host, o, depth, out) {
  const dims = DEVICES[o.device];
  const { page, context, errors } = await R.openPage(browser, host.url, { viewport: dims, hasTouch: true, isMobile: true });
  const warnings = [];
  page.on('console', m => {
    if (m.type() === 'warning' && warnings.length < 40) warnings.push(m.text().slice(0, 200));
  });
  const cdp = await context.newCDPSession(page);
  const P = H.profile(o.skill, o.seed * 7919 + depth);
  const rand = P.rand,
    F = P.floor,
    between = ([a, b]) => a + (b - a) * rand();
  const fingers = new H.Fingers(cdp, rand);
  const tag = `d${depth}-${o.device}-${o.skill}`;
  const t0 = Date.now();
  const issues = [],
    shots = [],
    floors = [],
    seenIssue = new Map();
  // the same fault seen again only counts, after the first few are kept in full
  const issue = (kind, detail, keep = 3) => {
    const key = kind + ':' + JSON.stringify(detail).slice(0, 120),
      had = seenIssue.get(key);
    if (had) {
      had.n++;
      if (had.n <= keep) issues.push({ kind, t: Math.round((Date.now() - t0) / 1000), floor: cur && cur.depth, ...detail });
      else had.first.repeats = had.n;
      return;
    }
    const first = { kind, t: Math.round((Date.now() - t0) / 1000), floor: cur && cur.depth, ...detail };
    seenIssue.set(key, { n: 1, first });
    issues.push(first);
  };
  const shot = async (name, full) => {
    const f = `${tag}-${String(shots.length).padStart(3, '0')}-${name.replace(/[^a-z0-9-]+/gi, '-').slice(0, 40)}.png`;
    await page.screenshot({ path: path.join(out, f), fullPage: !!full }).catch(() => {});
    shots.push(f);
    return f;
  };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const tapAt = async (x, y, id = 2, sd = F.aim) => {
    const misTap = rand() < F.misTap;
    const at = await fingers.tap(id, x + (misTap ? (rand() - 0.5) * 40 : 0), y + (misTap ? (rand() - 0.5) * 40 : 0), sd, F.hold);
    stats.taps++;
    return at;
  };
  // a tap on an element by selector, with a check of what lies under the finger
  const tapEl = async (sel, id = 2) => {
    const box = await page.locator(sel).first().boundingBox().catch(() => null);
    if (!box || !box.width) return null;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2,
      sd = Math.min(F.aim, box.width / 6, box.height / 6);
    const under = await ev(
      ([x, y, sel]) => {
        const t = document.elementFromPoint(x, y),
          el = document.querySelector(sel);
        return { ok: !!(t && el && (t === el || el.contains(t))), under: t ? t.id || String(t.className) || t.tagName : null };
      },
      [x, y, sel]
    );
    await fingers.tap(id, x, y, sd, F.hold);
    stats.taps++;
    if (!under.ok) issue('tap-covered', { control: sel, under: under.under });
    return under;
  };
  const read = async text => sleep(Math.min(6000, 500 + ((text || '').length / F.readCps) * 1000 * (0.6 + rand() * 0.6)));

  const stats = { taps: 0, tapsIgnored: 0, walks: 0, stickWalks: 0, strikes: 0, strikesWhileWalking: 0, strikeMissed: 0, potsBroken: 0, chestsOpened: 0, searches: 0, ambushes: 0, firstStrikes: 0, surprised: 0, fled: 0, fights: 0, deaths: 0, dialogs: [], tips: [], log: [] };
  const fights = [];
  let cur = null;

  // fixture: a fresh save with a starter deck and a character levelled roughly for this depth
  const level = await ev(
    ([depth, move, world]) => {
      save = newSave(STARTERS[0]);
      save.worldSeed = world;   // the same floors for the same --seed and depth, so a finding can be played again
      save.char = lockChar(newChar('human', 0));
      save.deepest = depth;
      const ch = ensureChar(save);
      let guard = 0;
      while (save.level < Math.round(xpLevelFor(depth)) && guard++ < 500) gainXp(save, 50);
      for (let i = 0; pointsLeft(ch) > 0 && i < 500; i++) {
        const k = STAT_KEYS[i % STAT_KEYS.length];
        ch.spent[k] = (ch.spent[k] || 0) + 1;
      }
      save.lvlNew = false;
      try {
        localStorage.setItem('hexmancers-xmove', move);
      } catch (e) {}
      persist();
      openMenu();
      return save.level;
    },
    [depth, o.move === 'mix' ? MOVES[depth % MOVES.length] : o.move, 1 + ((o.seed * 7919 + depth * 104729) % 0x7ffffffe)]
  );
  await page.addScriptTag({ path: path.join(__dirname, 'support.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'bot.js') });
  await ev(H.MONITOR);
  const memAt = async () =>
    ev(() => ({
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      geo: typeof X3 !== 'undefined' && X3 && X3.renderer ? X3.renderer.info.memory.geometries : null,
      tex: typeof X3 !== 'undefined' && X3 && X3.renderer ? X3.renderer.info.memory.textures : null,
      calls: typeof X3 !== 'undefined' && X3 && X3.renderer ? X3.renderer.info.render.calls : null
    })).catch(() => ({}));
  const mem = [{ at: 'start', ...(await memAt()) }];

  // the real way in: the main menu's Explore button (Start at depth = deepest)
  const enterFloor = async why => {
    await sleep(between([600, 1400]));
    const r = await tapEl('#mmExplore');
    if (!r) issue('control-missing', { control: 'mmExplore', when: why });
    const ok = await page
      .waitForFunction(() => document.getElementById('scrExplore').classList.contains('on'), null, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) issue('softlock', { what: 'Explore did not open from the main menu', when: why });
    return ok;
  };
  if (!(await enterFloor('start'))) {
    await shot('no-explore');
    await context.close();
    return { depth, device: o.device, skill: o.skill, crash: 'Explore did not open', issues, shots };
  }

  // graphical checks: the 3D view's pixels, now and then
  let lastFrame = null,
    nextLook = 0,
    nextAudit = 0;
  const domSeen = new Set();
  const lookAtScreen = async (s, force) => {
    if (!force && Date.now() < nextLook) return;
    nextLook = Date.now() + 9000 + rand() * 4000;
    const box = await ev(id => {
      const e = document.getElementById(id);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return r.width ? { x: r.x, y: r.y, w: r.width, h: r.height * 0.7 } : null;
    }, s.screen === 'scrBattle' ? 'board' : 'xView').catch(() => null);
    if (!box || s.overlays.length) return;
    let st;
    try {
      st = H.frameStats((await H.grabFrame(cdp, box, 0.25)).img);
    } catch (e) {
      return;
    }
    if (!st) return;
    const marks = await ev(() => (window.__qa && __qa.lastMark ? performance.now() - __qa.lastMark.at : 99999)).catch(() => 99999);
    const settled = marks > 2500;
    if (settled && st.dark > 0.97) {
      issue('black-frame', { screen: s.screen, ...st });
      await shot('black-frame');
    } else if (settled && st.top > 0.97 && st.colours < 5) {
      issue('blank-frame', { screen: s.screen, ...st });
      await shot('blank-frame');
    }
    if (lastFrame && lastFrame.screen === s.screen && settled && Math.abs(st.lum - lastFrame.lum) > 70) {
      issue('brightness-jump', { screen: s.screen, from: lastFrame.lum, to: st.lum });
      await shot('brightness-jump');
    }
    lastFrame = { screen: s.screen, lum: st.lum };
    if (cur) {
      cur.frameSamples = (cur.frameSamples || 0) + 1;
      cur.lum = cur.lum || [999, 0];
      cur.lum = [Math.min(cur.lum[0], st.lum), Math.max(cur.lum[1], st.lum)];
    }
  };
  const auditDom = async (s, force) => {
    if (!force && Date.now() < nextAudit) return;
    nextAudit = Date.now() + 12000;
    const a = await ev(H.DOM_AUDIT).catch(() => null);
    if (!a) return;
    const where = s.screen + (s.overlays.length ? '/' + s.overlays.join('+') : '');
    for (const [kind, list] of Object.entries(a))
      for (const x of list) {
        const key = kind + JSON.stringify(x);
        if (domSeen.has(key)) continue;
        domSeen.add(key);
        issue('ui-' + kind, { where, ...x }, 2);
        if (domSeen.size < 25 && ['badText', 'brokenImg', 'covered', 'offscreen'].includes(kind)) await shot('ui-' + kind);
      }
  };

  /* ---- the floor ---- */
  const exploreGoal = between(F.explore);
  const black = [];
  let lastPc = -1,
    stillTicks = 0,
    attempts = 1,
    endReason = 'time',
    floorT0 = Date.now(),
    lastLog = '',
    seenDialogs = new Map(),
    deadEnds = new Set();
  const newFloor = async d => {
    cur = { depth: d, move: await ev(() => xMoveMode()).catch(() => null), t0: Date.now(), hpIn: null, fights: 0, deaths: 0, seconds: 0, explored: 0, stairsSeenAt: null, potsBroken: 0, chests: 0, strikes: 0, strikeWhileWalkingOk: 0, strikeWhileWalkingMissed: 0, ambush: 0, firstStrike: 0, surprised: 0, fled: 0, traps: 0, searches: 0, stuck: 0, tapsIgnored: 0 };
    floors.push(cur);
    floorT0 = Date.now();
    black.length = 0;
    deadEnds.clear();
    lastPc = -1;
    const hud = await ev(HUD_AUDIT);
    for (const c of hud.covered) issue('hud-covered', c);
    for (const s of hud.small) issue('hud-small-target', s, 1);
  };
  await sleep(1200);
  await newFloor(depth);
  await shot('arrive');

  // Strike with the free thumb; true if the swing came. walking: another finger is on the map
  const strike = async (s, walking, why) => {
    if (!s.strike) return false;
    const before = await ev(() => (EX ? EX.strikeCd || 0 : 0));
    if (before > 0.05) return false;
    await ev(() => (window.__strikes = 0));
    await tapAt(s.strike.x, s.strike.y, 2, Math.min(F.aim, s.strike.w / 5));
    let after = null,
      ok = false;
    for (let k = 0; k < 6 && !ok; k++) {
      after = await ev(() => (EX ? { cd: EX.strikeCd || 0, swing: EX.swingT || 0, fight: !!EX.fighting, calls: window.__strikes, busy: !!EX.busy, action: EX.action || null, active: EX.active, paused: typeof xPaused !== 'undefined' && xPaused, hold: { on: XHOLD.on, id: XHOLD.id }, touches: window.__qa ? __qa.ptr.slice(-5) : null } : null));
      ok = !!after && (after.cd > 0 || after.swing > 0 || after.fight);
      if (after && after.calls > 0 && !ok) break;   // the touch reached Strike and the game said no
      if (!ok) await sleep(80);
    }
    stats.strikes++;
    cur.strikes++;
    if (!ok && after && after.calls > 0) {
      issue('strike-refused', { why, walking, state: after }, 2);
      return false;
    }
    if (walking) {
      stats.strikesWhileWalking++;
      if (ok) cur.strikeWhileWalkingOk++;
      else {
        cur.strikeWhileWalkingMissed++;
        issue('strike-while-walking-ignored', { why, move: cur.move, state: after });
        await shot('strike-ignored');
      }
    } else if (!ok) {
      stats.strikeMissed++;
      issue('strike-ignored', { why, state: after });
    }
    return ok;
  };
  // the next thing on the floor worth walking to, as this player sees it
  const choose = (s, fr) => {
    const bl = new Set(black);
    s = Object.assign({}, s, { pots: s.pots.filter(p => !bl.has(p.cell)), chests: s.chests.filter(c => !bl.has(c.cell)), enemies: s.enemies.filter(e => !(e.asleep && bl.has(e.cell))) });
    const hpK = s.hp / Math.max(1, s.maxHp);
    const awake = s.enemies.filter(e => !e.asleep);
    if (hpK < F.fleeHp && awake.some(e => e.d < 6 && e.coming)) return { why: 'flee', flee: awake[0] };
    const sleeper = s.enemies.find(e => e.asleep && e.d < 8);
    if (sleeper && hpK >= F.boldHp) return { why: 'ambush', target: sleeper.cell, enemy: sleeper };
    const coming = awake.find(e => e.coming && e.d < 3.5);
    if (coming) return { why: 'meet', enemy: coming };
    const pot = s.pots.find(p => p.d < 6);
    if (pot && rand() < F.strikePots) return { why: 'pot', target: pot.cell, pot };
    const chest = s.chests.find(c => c.d < 9);
    if (chest) return { why: chest.trap ? 'trapped-chest' : 'chest', target: chest.cell, chest };
    const timeUp = Date.now() - floorT0 > o.minutes * 60000 * 0.65;
    if (s.stairs >= 0 && (s.explored >= exploreGoal || timeUp || !fr.length)) return { why: 'stairs', target: s.stairs };
    if (s.deadEnd && !deadEnds.has(s.pc) && rand() < F.searchP) return { why: 'search' };
    if (fr.length) {
      const k = fr.length > 1 && rand() < 0.25 ? 1 : 0;
      return { why: 'explore', target: fr[k].c };
    }
    if (s.stairs >= 0) return { why: 'stairs', target: s.stairs };
    return { why: 'lost' };
  };
  // the screen point to aim a walk at: the farthest step of the route that is on screen, a few steps ahead
  const aimPoint = (rt, far = 12) => {
    if (!rt || !rt.pts) return null;
    for (let k = Math.min(rt.pts.length - 1, far); k >= 0; k--) if (rt.pts[k].at) return rt.pts[k].at;
    return null;
  };
  // walk toward a cell with the chosen touch style; returns when there, interrupted or out of time.
  // onTick(s, walkingFinger) may strike with the other thumb
  const walk = async (target, onTick, maxMs = 9000) => {
    const mode = cur.move;
    const t1 = Date.now();
    let rt = await ev(ROUTE, target);
    if (!rt || !rt.len) return 'no-route';
    // a person whose taps keep turning into holds (Tap + hold on a slow phone) stops tapping and steers instead
    const tapsFail = mode === 'tapstick' && cur.tapsIgnored >= 3;
    if (mode === 'goal' || (mode === 'tapstick' && !tapsFail && rand() < 0.5) || (mode === 'fixed' && rand() < 0.4)) {
      // a tap on the farthest clear point of the route, then watch (the other thumb is free)
      const pt = aimPoint(rt);
      if (!pt) return 'off-screen';
      await sleep(between([80, 220]));
      await tapAt(pt.x, pt.y, 1);
      stats.walks++;
      await sleep(160);
      let s = await ev(SEE);
      if (s && !s.walking && !s.busy && s.pc !== target) {
        // a tap that started no walk: in Tap + hold a slow page can read it as a hold, so count but do not fail
        stats.tapsIgnored++;
        cur.tapsIgnored++;
        if (cur.tapsIgnored <= 3) issue('walk-tap-ignored', { x: pt.x, y: pt.y, move: mode, pageSawPress: await ev(() => window.__qa && __qa.lastPress) });
      }
      while (Date.now() - t1 < maxMs) {
        s = await ev(SEE);
        if (!s || s.busy) return 'busy';
        if (s.blocked) return 'overlay';
        if (onTick && (await onTick(s, false))) return 'acted';
        if (!s.walking) return s.pc === target ? 'there' : 'stopped';
        await sleep(220);
      }
      return 'timeout';
    }
    // a held finger: the floating stick (tapstick and float put it where the thumb lands; fixed uses its home),
    // or follow, where the finger marks the place to go
    stats.stickWalks++;
    let s = await ev(SEE);
    if (!s || !s.me) return 'busy';
    const R0 = s.stickR;
    const anchor =
      mode === 'fixed' && s.home
        ? { x: s.home.x + fingers.gauss() * 4, y: s.home.y + fingers.gauss() * 4 }
        : { x: Math.min(s.view.x + s.view.w - 40, Math.max(s.view.x + 40, s.me.x + (rand() - 0.5) * 60)), y: Math.min(s.bottomTop - R0 - 20, s.me.y + 90 + rand() * 50) };
    const noise = () => (fingers.gauss() * (o.skill === 'good' ? 6 : o.skill === 'new' ? 16 : 10) * Math.PI) / 180;
    let ang = noise(),
      res = 'timeout',
      lastP = null,
      sameT = 0;
    if (mode === 'follow') {
      const pt = aimPoint(rt, 4);
      if (!pt) return 'off-screen';
      await fingers.down(1, pt.x, pt.y);
    } else {
      await fingers.down(1, anchor.x, anchor.y);
      await sleep(between([40, 90]));
    }
    try {
      while (Date.now() - t1 < maxMs) {
        s = await ev(SEE);
        if (!s || s.busy || !s.me) {
          res = 'busy';
          break;
        }
        if (s.blocked) {
          res = 'overlay';
          break;
        }
        if (s.pc === target || (rt.end === s.pc && rt.len)) {
          res = 'there';
          break;
        }
        rt = await ev(ROUTE, target);
        if (!rt || !rt.len) {
          res = 'there';
          break;
        }
        if (mode === 'follow') {
          const pt = aimPoint(rt, 4) || (rt.pts[Math.min(rt.pts.length - 1, 3)] || {}).raw;
          if (pt) await fingers.slide(1, pt.x + Math.cos(ang) * 6, pt.y + Math.sin(ang) * 6, 60, 2);
        } else {
          // push toward a step two or three ahead, from where the mage stands on screen
          const step = rt.pts[Math.min(rt.pts.length - 1, 2)],
            sx = step && step.raw;
          if (!sx) {
            res = 'off-screen';
            break;
          }
          const dx = sx.x - rt.me.x,
            dy = sx.y - rt.me.y,
            L = Math.hypot(dx, dy) || 1,
            c = Math.cos(ang),
            sn = Math.sin(ang),
            ux = (dx * c - dy * sn) / L,
            uy = (dx * sn + dy * c) / L,
            push = R0 * (0.7 + rand() * 0.25);
          await fingers.slide(1, anchor.x + ux * push, anchor.y + uy * push, 50, 2);
        }
        if (rand() < 0.15) ang = noise();
        if (onTick && (await onTick(s, true))) {
          res = 'acted';
          break;
        }
        // going nowhere: the stick pushes into a wall, or the walk ignores the finger
        if (lastP && Math.hypot(lastP.x - s.me.x, lastP.y - s.me.y) < 1.5) sameT++;
        else sameT = 0;
        lastP = s.me;
        if (sameT >= 8) {
          res = 'blocked';
          break;
        }
        await sleep(between([90, 160]));
      }
    } finally {
      await fingers.up(1);
    }
    return res;
  };
  // the free thumb while walking: break a pot in reach, strike a waking enemy as it closes, or a sleeper first
  const strikeOpportunity = async (s, walking) => {
    const near = s.enemies.find(e => e.d < 1.7);
    if (near) {
      await sleep(between([120, 300]) * (o.skill === 'new' ? 1.6 : 1));
      const s2 = (await ev(SEE)) || s;
      const still = s2.enemies.find(e => e.d < 1.8);
      if (still && (await strike(s2, walking, still.asleep ? 'sleeping enemy in reach' : 'enemy in reach'))) return true;
    }
    const pot = s.pots.find(p => p.d < 1.4);
    if (pot && rand() < F.strikePots) {
      const before = await ev(() => EX.props.filter(p => p.kind === 'pot' && !p.gone).length);
      if (await strike(s, walking, 'pot in reach')) {
        await sleep(200);
        const after = await ev(() => EX.props.filter(p => p.kind === 'pot' && !p.gone).length);
        if (after < before) (stats.potsBroken++, cur.potsBroken++);
        else issue('pot-not-broken', { d: pot.d });
      }
    }
    return false;
  };

  /* ---- the hand screen ---- */
  const handScreen = async () => {
    await sleep(between([700, 1800]) * (o.skill === 'new' ? 1.5 : 1));
    let h = await ev(HAND);
    if (!h) return;
    if (h.cards.some(c => !c.onScreen)) issue('hand-card-offscreen', { cards: h.cards.filter(c => !c.onScreen).map(c => c.name) }, 1);
    // now and then hold a card to read it big, then put it away
    if (rand() < F.readCards && h.cards.length) {
      const c = h.cards[Math.floor(rand() * h.cards.length)];
      await fingers.down(2, c.x, c.y);
      await sleep(between([650, 1100]));
      await fingers.up(2);
      await sleep(between([700, 1800]));
      const up = await ev(() => document.getElementById('peek').classList.contains('on'));
      if (!up) issue('hand-hold-no-peek', { card: c.name }, 1);
      else {
        const x = await page.locator('#peek .popx').boundingBox().catch(() => null);
        if (x) await tapAt(x.x + x.width / 2, x.y + x.height / 2, 2, 3);
        else issue('peek-no-close', {}, 1);
        await sleep(400);
      }
      h = await ev(HAND);
    }
    for (const uid of h.picks) {
      h = await ev(HAND);
      const c = h.cards.find(c => c.uid === uid);
      if (!c || c.queued) continue;
      const before = h.queued;
      await tapAt(c.x, c.y, 2, Math.min(F.aim, c.w / 6));
      await sleep(between([250, 600]));
      const after = await ev(() => B.piles.queue.length);
      if (after <= before) {
        const peek = await ev(() => document.getElementById('peek').classList.contains('on'));
        issue('hand-tap-not-queued', { card: c.name, readAsHold: peek }, 2);
        if (peek) {
          const x = await page.locator('#peek .popx').boundingBox().catch(() => null);
          if (x) await tapAt(x.x + x.width / 2, x.y + x.height / 2, 2, 3);
        }
      }
    }
    await sleep(between([300, 900]));
    const f = await tapEl('#btnFight');
    await sleep(800);
    const still = await ev(() => document.getElementById('custom').classList.contains('on'));
    if (still) {
      issue('tap-ignored', { control: 'Fight! (hand screen stayed open)' });
      await shot('fight-btn-ignored');
      const again = await tapEl('#btnFight');
      await sleep(800);
      if (await ev(() => document.getElementById('custom').classList.contains('on'))) await ev(() => closeCustomScreen());
    }
    return f;
  };

  /* ---- a fight, with two thumbs ----
     Three loops run at once, as a person's eyes and two thumbs do: the eyes read the board as fast as the page
     answers, one thumb steers the stick on the board, the other works Fire, Cast, Spell and the instants. */
  const battle = async opening => {
    stats.fights++;
    cur.fights++;
    const f = { depth: cur.depth, opening: opening || null, t0: Date.now(), hpIn: null, hpOut: null, hits: 0, dmg: 0, hitsSeenComing: 0, hitsUnseen: 0, taps: 0, charges: 0, casts: 0, castsIgnored: 0, spells: 0, lobAims: 0, instants: 0, stickMoves: 0, flicks: 0, dangerSeen: 0, dangerEscaped: 0, looks: 0, result: 'unfinished', enemies: null };
    fights.push(f);
    await ev(([h, seed]) => PT.brain.start(h, seed), [P.battle.human, o.seed * 31 + fights.length]);
    const hb = P.battle.human;
    let b = null,
      done = false,
      hold = false,
      stickOn = false,
      anchor = null,
      dangerAt = 0,
      lastHp = null,
      shotTaken = false;
    const fightEnd = Date.now() + 180000;
    const eyes = async () => {
      while (!done && Date.now() < fightEnd) {
        const v = await ev(BATTLE_SEE, P.battle).catch(() => null);
        if (!v) break;
        f.looks++;
        if (v.screen !== 'scrBattle') {
          if (f.result === 'unfinished') f.result = 'left battle';
          break;
        }
        if (v.overlays.includes('custom')) {
          // the hand screen: both thumbs off the board while you pick
          hold = true;
          b = null;
          await sleep(120);
          if (stickOn) (await fingers.up(1), (stickOn = false));
          await fingers.up(2);
          await handScreen();
          f.spells++;
          hold = false;
          continue;
        }
        if (v.overlays.length) {
          if (f.result === 'unfinished') f.result = v.overlays.join('+');
          break;
        }
        if (v.phase === 'win' || v.phase === 'lose') {
          f.result = v.phase;
          b = null;
          await sleep(500);
          continue;
        }
        if (v.phase !== 'fight') {
          b = null;
          await sleep(150);
          continue;
        }
        const now = Date.now();
        if (f.hpIn == null) ((f.hpIn = v.hp), (f.enemies = v.enemies));
        if (lastHp != null && v.hp < lastHp) {
          f.hits++;
          f.dmg += lastHp - v.hp;
          // a hit you had seen coming (the brain flagged danger on your tile in the last 2.5 s) or one you never saw
          if (now - dangerAt < 2500) f.hitsSeenComing++;
          else f.hitsUnseen++;
        }
        lastHp = v.hp;
        if (v.danger) {
          if (now - dangerAt > 2500) f.dangerSeen++;
          dangerAt = now;
        } else if (b && b.danger && lastHp === v.hp) f.dangerEscaped++;
        b = v;
        if (!shotTaken) {
          shotTaken = true;
          if (fights.length <= 2) shot('battle');
        }
        await sleep(20);
      }
      done = true;
    };
    /* thumb 1: the stick on the board */
    const stickThumb = async () => {
      let letGoAt = 0;
      while (!done) {
        const v = b;
        if (hold || !v) {
          await sleep(60);
          continue;
        }
        if (v.move && !v.move.here && (v.move.gain > 12 || v.danger)) {
          letGoAt = 0;
          if (!stickOn && v.anchor) {
            anchor = { x: v.anchor.x + (rand() - 0.5) * 10, y: v.anchor.y + (rand() - 0.5) * 10 };
            await fingers.down(1, anchor.x, anchor.y);
            stickOn = true;
            f.stickMoves++;
          }
          if (stickOn) {
            const dx = v.move.at.x - v.me.x,
              dy = v.move.at.y - v.me.y,
              L = Math.hypot(dx, dy);
            if (L >= 6) {
              const a = (fingers.gauss() * hb.stickNoise * Math.PI) / 180,
                c = Math.cos(a),
                sn = Math.sin(a),
                ux = (dx * c - dy * sn) / L,
                uy = (dx * sn + dy * c) / L,
                push = v.stickR * (v.danger ? 0.95 : 0.6 + rand() * 0.3);
              await fingers.move(1, anchor.x + ux * push, anchor.y + uy * push);
              // now and then a flick away from a hit about to land
              if (v.danger && rand() < hb.flickP * 0.2) {
                await fingers.move(1, anchor.x + ux * (push + 70), anchor.y + uy * (push + 70));
                await fingers.up(1);
                stickOn = false;
                f.flicks++;
              }
            }
          }
        } else if (stickOn) {
          // there: let go after a human moment (the slide and the magnet finish the step)
          if (!letGoAt) letGoAt = Date.now() + Math.max(60, hb.release * 1000 + fingers.gauss() * hb.releaseSd * 1000) / 2;
          if (Date.now() >= letGoAt) {
            await fingers.up(1);
            stickOn = false;
            letGoAt = 0;
          }
        }
        await sleep(between(hb.evalGap) * 120);
      }
    };
    /* thumb 2: Fire, Cast, Spell, instants */
    const actionThumb = async () => {
      let nextTap = 0,
        chargeUntil = 0,
        castAt = null,
        gaugeAt = null,
        castTap = null,
        chargeUpAt = 0,
        chargeT = 0;
      while (!done) {
        const v = b;
        if (v && !v.charging) chargeT = v.t;
        if (hold || !v) {
          await sleep(60);
          continue;
        }
        const now = Date.now();
        // a Cast tap the game did not take: the same card still first in the queue well after the tap
        if (castTap && now - castTap.t > 700) {
          if (v.qHead != null && v.qHead === castTap.q && v.castCd <= 0 && v.cast) {
            f.castsIgnored++;
            if (f.castsIgnored <= 2) issue('cast-ignored', { press: v.lastPress, recent: v.recent }, 2);
          } else f.casts++;
          castTap = null;
        }
        if (fingers.isDown(2)) {
          if (now >= chargeUntil || v.chargeReady) {
            await fingers.up(2);
            f.charges++;
            chargeUpAt = Date.now();
          }
        } else if (v.charging && chargeUpAt && now - chargeUpAt > 1500 && v.t > chargeT + 1) {
          // Fire still charging well after the finger left it: the release was lost
          issue('fire-stuck-charging', { since: now - chargeUpAt, recent: v.recent }, 2);
          chargeUpAt = 0;
        } else if (v.gauge && v.spell && !v.spell.disabled && (gaugeAt == null || now >= gaugeAt)) {
          if (gaugeAt == null) gaugeAt = now + between(hb.gaugeDelay) * 1000;
          else {
            gaugeAt = null;
            await tapAt(v.spell.x, v.spell.y, 2, Math.min(F.aim, v.spell.w / 6));
            await sleep(500);
            continue;
          }
        } else if (v.cast && !castTap && (v.castUseful || rand() < 0.03) && (castAt == null || now >= castAt)) {
          if (castAt == null) castAt = now + between(hb.castDelay) * 1000;
          else if (v.castBtn) {
            castAt = null;
            if (v.lob) {
              await tapAt(v.lob.x, v.lob.y, 2, F.aim);
              f.lobAims++;
              await sleep(between([80, 200]));
            }
            await tapAt(v.castBtn.x, v.castBtn.y, 2, Math.min(F.aim, v.castBtn.w / 6));
            castTap = { t: Date.now(), q: v.qHead };
          }
        } else if (v.hp < v.maxHp * 0.45 && v.inst.some(i => /heal|mend|potion|salve|cure/i.test(i.name)) && rand() < hb.instantP) {
          const i = v.inst.find(i => /heal|mend|potion|salve|cure/i.test(i.name));
          await tapAt(i.x, i.y, 2, 4);
          f.instants++;
          await sleep(400);
        } else if (v.fire && now >= nextTap && v.wandCd <= 0 && (v.row || rand() < hb.blindTap)) {
          if (rand() < hb.chargeP) {
            await fingers.down(2, v.fire.x + (rand() - 0.5) * 8, v.fire.y + (rand() - 0.5) * 8);
            chargeUntil = now + 900 + rand() * 500;
          } else {
            await tapAt(v.fire.x, v.fire.y, 2, Math.min(F.aim, v.fire.w / 6));
            f.taps++;
            chargeUpAt = Date.now();
          }
          nextTap = now + Math.max(hb.tapMin, -Math.log(1 - rand()) / hb.fireRate) * 1000;
        }
        await sleep(40);
      }
    };
    try {
      await Promise.all([eyes(), stickThumb(), actionThumb()]);
    } finally {
      done = true;
      await fingers.upAll();
    }
    f.seconds = Math.round((Date.now() - f.t0) / 1000);
    f.looksPerSecond = +(f.looks / Math.max(1, f.seconds)).toFixed(1);
    const end = await ev(() => (B && B.player ? { hp: B.player.hp, phase: B.phase } : null)).catch(() => null);
    f.hpOut = end ? end.hp : null;
    if (f.result === 'unfinished') {
      issue('fight-too-long', { seconds: f.seconds, enemies: f.enemies, hp: f.hpOut });
      await shot('long-fight');
    }
    if (end && end.phase === 'lose') f.result = 'lose';
    return f;
  };

  /* ---- overlays the floor throws up: read, then answer as a person would ---- */
  const overlay = async (s, ov) => {
    if (ov === 'peek') {
      const x = await page.locator('#peek .popx').boundingBox().catch(() => null);
      if (x) await tapAt(x.x + x.width / 2, x.y + x.height / 2, 2, 3);
      else await tapAt(20, DEVICES[o.device].height / 2, 2, 2);
      await sleep(300);
      return;
    }
    const info = await ev(id => {
      const box = document.getElementById(id);
      const title = (box.querySelector('h2') || {}).textContent || '';
      return { title: title.trim(), text: (box.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 400) };
    }, ov);
    const key = ov + ':' + info.title;
    const n = (seenDialogs.get(key) || 0) + 1;
    seenDialogs.set(key, n);
    if (n === 1) {
      stats.dialogs.push({ overlay: ov, title: info.title, text: info.text.slice(0, 240) });
      if (stats.dialogs.length <= 14) await shot('dialog-' + (info.title || ov));
      await auditDom(s, true);
    }
    await read(n === 1 ? info.text : info.title);
    if (ov === 'lvlUp') {
      // a level up: turn a few stats up a point each (tap a dial's ► end), then Done
      const dials = await ev(() => [...document.querySelectorAll('#lvStats .dial .dr')].map(e => {
        const r = e.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }));
      const pts0 = await ev(() => +document.getElementById('lvPts').textContent || 0);
      for (let k = 0; k < Math.min(pts0, 6) && dials.length; k++) {
        const d = dials[Math.floor(rand() * dials.length)];
        await tapAt(d.x, d.y, 2, 3);
        await sleep(between([250, 600]));
      }
      const pts1 = await ev(() => +document.getElementById('lvPts').textContent || 0);
      if (pts0 > 0 && pts1 >= pts0) issue('levelup-dial-tap-ignored', { pts: pts0 }, 1);
      await tapEl('#lvDone');
      await sleep(600);
      return;
    }
    if (ov === 'custom') return handScreen();
    const buttons = await ev(BUTTONS, ov);
    if (n === 1) for (const u of buttons.filter(b => !b.text && !b.label)) issue('unlabelled-button', { overlay: ov, title: info.title, sel: u.sel }, 1);
    for (const b of buttons) if (b.w < 40 || b.h < 40) issue('small-button', { overlay: ov, text: b.text, w: Math.round(b.w), h: Math.round(b.h) }, 1);
    const prefer =
      ov === 'pause'
        ? [/resume|continue|back/i]
        : ov === 'settings'
        ? [/back/i]
        : n > 3
        ? [/leave|close|done|not now|back|cancel|resume|later|✕/i]
        : [/^(take|open|loot|claim|accept|continue|ok|descend|go down|choose|fight|keep|resume|collect|got it)/i, /worn|quiet|treasure|stair/i, /leave|close|done|not now|back|cancel|later|✕/i];
    // now and then a person picks something else first, to see what it does
    let b = n === 1 && buttons.length > 2 && rand() < 0.15 ? buttons[Math.floor(rand() * buttons.length)] : pickBtn(buttons, prefer);
    if (!b) {
      issue('overlay-no-button', { overlay: ov, title: info.title });
      await shot('stuck-overlay');
      await tapAt(12, 12, 2, 1);
      await sleep(600);
      return n > 5 ? 'stuck' : null;
    }
    await tapEl(b.sel);
    await sleep(700);
    if (n > 8) {
      issue('overlay-loop', { overlay: ov, title: info.title, button: b.text });
      await shot('overlay-loop');
      return 'loop';
    }
  };

  /* ---- the loop ---- */
  const deadline = () => floorT0 + o.minutes * 60000;
  let floorsLeft = o.floors,
    lastOpening = null,
    lastGoal = null;
  while (true) {
    if (Date.now() > deadline()) {
      endReason = 'time';
      issue('floor-not-finished', { minutes: o.minutes, explored: cur.explored });
      await shot('time-up');
      break;
    }
    const s = await ev(SCREEN).catch(e => ({ error: String(e) }));
    if (s.error) {
      issue('page-crash', { error: s.error });
      endReason = 'crash';
      break;
    }
    await lookAtScreen(s);
    await auditDom(s);
    if (Date.now() - (mem.lastT || t0) > 60000) {
      mem.lastT = Date.now();
      mem.push({ at: Math.round((Date.now() - t0) / 1000) + 's', ...(await memAt()) });
    }
    if (s.log && s.log.length && s.log[s.log.length - 1] !== lastLog) {
      lastLog = s.log[s.log.length - 1];
      if (stats.log.length < 120) stats.log.push({ t: Math.round((Date.now() - t0) / 1000), d: s.depth, text: lastLog });
    }
    if (s.depth && cur && s.depth > cur.depth) {
      cur.seconds = Math.round((Date.now() - cur.t0) / 1000);
      floorsLeft--;
      await sleep(1500);
      await shot('next-floor');
      if (floorsLeft <= 0) {
        endReason = 'took the stairs down';
        break;
      }
      mem.push({ at: 'floor ' + s.depth, ...(await memAt()) });
      await newFloor(s.depth);
      if (o.move === 'mix') {
        // a different touch style on each floor, through Settings like a player would (set directly here: the
        // Settings row is tested by ui-runner)
        const m = MOVES[(MOVES.indexOf(cur.move) + 1) % MOVES.length];
        await ev(m => xSetMoveMode(m), m);
        cur.move = m;
      }
      continue;
    }
    if (s.screen === 'scrCamp' || s.screen === 'scrMenu') {
      const lastFight = fights[fights.length - 1],
        died = !!lastFight && lastFight.result === 'lose' && Date.now() - lastFight.t0 < lastFight.seconds * 1000 + 30000;
      if (died) {
        stats.deaths++;
        cur.deaths++;
        issue('death', { depth: cur.depth, killedBy: lastFight.enemies, hpIn: lastFight.hpIn, opening: lastFight.opening, seconds: lastFight.seconds });
        await shot('died');
      } else {
        // not a death: the floor was left another way (most often a step back onto the stairs up, which climbs at once)
        stats.leftFloor = (stats.leftFloor || 0) + 1;
        issue('left-floor-by-accident', { screen: s.screen, move: cur.move, goal: lastGoal, log: lastLog }, 5);
        await shot('left-floor');
      }
      if (attempts >= 3 || Date.now() > deadline() - 60000) {
        endReason = 'died ' + stats.deaths + ' time(s)';
        break;
      }
      attempts++;
      await ev(() => {
        if (typeof stopExplore === 'function') stopExplore();
        openMenu();
      });
      if (!(await enterFloor('after a death'))) {
        endReason = 'could not go back in';
        break;
      }
      black.length = 0;
      lastPc = -1;
      await sleep(1200);
      continue;
    }
    const ov = s.overlays.find(x => x !== 'peek') || (s.overlays.includes('peek') ? 'peek' : null);
    if (ov) {
      const r = await overlay(s, ov);
      if (r === 'stuck' || r === 'loop') {
        endReason = 'overlay could not be closed';
        break;
      }
      continue;
    }
    if (s.screen === 'scrBattle') {
      const raw = await ev(() => (window.__qa && __qa.openings && __qa.openings.length ? __qa.openings.pop() : null)).catch(() => null);
      const op = raw === 'strike' ? 'first strike' : raw === 'ambush' || raw === 'surprised' ? raw : /ambush/i.test(lastOpening || '') ? 'ambush' : /first/i.test(lastOpening || '') ? 'first strike' : /surpris/i.test(lastOpening || '') ? 'surprised' : null;
      if (op === 'ambush') (stats.ambushes++, cur.ambush++);
      if (op === 'first strike') (stats.firstStrikes++, cur.firstStrike++);
      if (op === 'surprised') (stats.surprised++, cur.surprised++);
      lastOpening = null;
      mem.push({ at: 'fight ' + fights.length, ...(await memAt()) });
      await battle(op);
      continue;
    }
    if (s.screen !== 'scrExplore') {
      await sleep(500);
      continue;
    }
    if (s.bang && s.bang.trim()) lastOpening = s.bang.trim();
    if (s.tipOpen) {
      if (!stats.tips.includes(s.tipText)) stats.tips.push(s.tipText);
      await read(s.tipText);
      await tapEl('#xTipOk');
      await sleep(400);
      continue;
    }
    if (s.busy) {
      await sleep(300);
      continue;
    }
    const see = await ev(SEE);
    if (!see) {
      await sleep(300);
      continue;
    }
    cur.explored = Math.round(see.explored * 100);
    if (see.stairs >= 0 && cur.stairsSeenAt == null) cur.stairsSeenAt = Math.round((Date.now() - cur.t0) / 1000);
    if (cur.hpIn == null) cur.hpIn = see.hp;
    // a person looks around before the next move
    await sleep(between(F.look) * (see.enemies.length ? 0.5 : 1));
    const fr = await ev(FRONTIER, [black]);
    const c = choose(see, fr);
    lastGoal = c.why;
    if (c.why === 'lost') {
      issue('no-route', { what: 'explored everything reachable but the stairs down are not known', explored: cur.explored });
      await shot('no-route');
      endReason = 'nothing left to explore';
      break;
    }
    let res = null;
    if (c.why === 'search') {
      deadEnds.add(see.pc);
      if (see.search) {
        await tapAt(see.search.x, see.search.y, 2, Math.min(F.aim, see.search.w / 6));
        stats.searches++;
        cur.searches++;
        await sleep(2500);
      }
      continue;
    }
    if (c.why === 'flee') {
      // back away: the explored cell farthest from the enemy within a short walk
      const away = await ev(e => {
        let best = -1, bd = -1;
        const ex = xcx(e.cell), ey = xcy(e.cell);
        for (let i = 0; i < EX.seen.length; i++) {
          if (!EX.seen[i] || !xPassable(i)) continue;
          const dm = Math.abs(xcx(i) - xcx(EX.pc)) + Math.abs(xcy(i) - xcy(EX.pc));
          if (dm > 8) continue;
          const de = Math.abs(xcx(i) - ex) + Math.abs(xcy(i) - ey);
          if (de > bd) (bd = de), (best = i);
        }
        return best;
      }, c.flee);
      stats.fled++;
      cur.fled++;
      if (away >= 0) res = await walk(away, strikeOpportunity, 5000);
    } else if (c.why === 'meet') {
      // stand and strike as it closes in
      const tEnd = Date.now() + 2500;
      while (Date.now() < tEnd) {
        const s2 = await ev(SEE);
        if (!s2 || s2.busy) break;
        if (await strikeOpportunity(s2, false)) break;
        await sleep(120);
      }
      res = 'met';
    } else if (c.target != null) {
      res = await walk(c.target, strikeOpportunity, c.why === 'stairs' ? 14000 : 9000);
      if (c.why === 'trapped-chest' && res === 'there') {
        const s2 = await ev(SEE);
        if (s2 && s2.disarm) await tapAt(s2.disarm.x, s2.disarm.y, 2, 4);
      }
      if ((c.why === 'chest' || c.why === 'trapped-chest') && res === 'there') {
        const open = await ev(cell => !!EX.chests.find(ch => ch.cell === cell && ch.open), c.target);
        if (open) (stats.chestsOpened++, cur.chests++);
      }
      if (c.why === 'ambush' || c.why === 'pot') {
        const s2 = await ev(SEE);
        if (s2 && !s2.busy) await strikeOpportunity(s2, false);
      }
      if (res === 'no-route' || res === 'off-screen' || res === 'blocked') {
        black.push(c.target);
        if (black.length > 40) {
          endReason = 'no reachable goals';
          break;
        }
      }
    }
    // stuck: the same cell, over and over
    const now = await ev(() => (EX ? EX.pc : -1));
    if (now === lastPc) {
      stillTicks++;
      if (stillTicks === 4) {
        cur.stuck++;
        issue('stuck', { cell: now, goal: c.why, target: c.target ?? null, move: cur.move, res, explored: cur.explored });
        if (cur.stuck <= 2) await shot('stuck');
        if (c.target != null) black.push(c.target);
        stillTicks = 0;
      }
    } else stillTicks = 0;
    lastPc = now;
  }
  if (cur) cur.seconds = cur.seconds || Math.round((Date.now() - cur.t0) / 1000);
  mem.push({ at: 'end', ...(await memAt()) });
  const qa = await ev(() => {
    const Q = window.__qa;
    if (!Q) return null;
    const d = Q.dts.slice(30).sort((a, b) => a - b),
      q = p => (d.length ? Math.round(d[Math.floor(d.length * p)]) : null);
    const byCtx = {};
    for (const h of Q.hitches) {
      const k = (h.mark ? h.mark + ' @ ' : '') + h.ctx;
      const e = byCtx[k] || (byCtx[k] = { n: 0, worst: 0 });
      e.n++;
      e.worst = Math.max(e.worst, h.dt);
    }
    const longBy = {};
    for (const l of Q.long) {
      const k = (l.mark ? l.mark + ' @ ' : '') + l.ctx;
      const e = longBy[k] || (longBy[k] = { n: 0, worst: 0, total: 0 });
      e.n++;
      e.total += l.d;
      e.worst = Math.max(e.worst, l.d);
    }
    return {
      seconds: Math.round((performance.now() - Q.t0) / 1000),
      frames: Q.frames,
      frameMs: { p50: q(0.5), p90: q(0.9), p99: q(0.99), max: q(1 - 1e-9) },
      hitches: Q.hitches.length,
      hitchesBy: Object.entries(byCtx).sort((a, b) => b[1].n - a[1].n).slice(0, 12),
      worstHitches: Q.hitches.slice().sort((a, b) => b.dt - a.dt).slice(0, 8),
      longTasks: Q.long.length,
      longBy: Object.entries(longBy).sort((a, b) => b[1].total - a[1].total).slice(0, 12),
      glLost: Q.glLost
    };
  }).catch(() => null);
  if (qa && qa.glLost.length) issue('webgl-context-lost', { events: qa.glLost });
  for (const e of errors) issue('page-error', { error: String(e).slice(0, 300) });
  await context.close();
  return {
    depth,
    device: o.device,
    skill: o.skill,
    seed: o.seed,
    level,
    endReason,
    seconds: Math.round((Date.now() - t0) / 1000),
    floors,
    fights,
    stats,
    perf: qa,
    memory: mem,
    warnings: [...new Set(warnings)].slice(0, 20),
    issues,
    shots
  };
}

async function run() {
  const o = args(process.argv.slice(2));
  fs.mkdirSync(o.out, { recursive: true });
  const host = await R.serve();
  let browser;
  const results = [];
  try {
    ({ browser } = await R.launch());
    for (const d of o.depths) {
      const r = await session(browser, host, o, d, o.out).catch(e => ({ depth: d, device: o.device, skill: o.skill, crash: String(e && e.stack) }));
      results.push(r);
      fs.writeFileSync(path.join(o.out, 'results.json'), JSON.stringify({ options: o, results }, null, 1));
      console.log(JSON.stringify({ depth: d, end: r.endReason || r.crash, floors: (r.floors || []).map(f => f.depth), fights: (r.fights || []).length, issues: (r.issues || []).length }));
    }
  } finally {
    if (browser) await browser.close();
    host.close();
  }
}
if (require.main === module)
  run().catch(e => {
    console.error(e);
    process.exit(1);
  });
module.exports = { run, args };
