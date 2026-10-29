'use strict';
/* Shared by the touch QA bots (touch-dungeon-runner.js): a player's two thumbs on a touch screen, how a person times
   them, and the watchers that note stutters and graphical faults while they play.

   Fingers: real multi-touch through Chromium's own input events (CDP Input.dispatchTouchEvent). Each finger is its
   own touch point, so one thumb can hold a stick while the other taps Fire or Strike, as on a phone. A tap lands a
   few pixels off where the player aimed (a thumb is not a cursor) and is held as long as a real tap.
   Profiles: a new, an average and a good player. The battle half (react, notice, fireRate...) is bot.js's human
   model (the same numbers as mkruns.js); the rest is how they read, aim and hesitate on the dungeon floor.
   Watchers: frame times and long tasks with what was happening at the time, lost WebGL contexts, text that reads
   NaN or undefined, clipped text, broken images, and screenshots checked for black, blank or flashing frames. */
const zlib = require('zlib');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BATTLE = {
  new: {
    stick: true,
    human: { reactMin: 0.4, tapMin: 0.3, blindTap: 0.25, chargeP: 0.05, release: 0.35, releaseSd: 0.18, react: 0.8, reactSd: 0.2,
      notice: 0.75, fireRate: 1.4, focusPause: 0.45, evalGap: [0.45, 0.8], misTap: 0.1, comboSkill: 0.15, instantP: 0.35,
      castDelay: [0.8, 2.5], gaugeDelay: [1, 3.5], stickNoise: 16, flickP: 0.1 }
  },
  average: {
    stick: true,
    human: { reactMin: 0.35, tapMin: 0.25, blindTap: 0.1, chargeP: 0.08, release: 0.35, releaseSd: 0.14, react: 0.65, reactSd: 0.15,
      notice: 0.86, fireRate: 1.7, focusPause: 0.3, evalGap: [0.3, 0.5], misTap: 0.06, comboSkill: 0.45, instantP: 0.6,
      castDelay: [0.4, 1.5], gaugeDelay: [0.6, 2.2], stickNoise: 12, flickP: 0.35 }
  },
  good: {
    stick: true,
    human: { reactMin: 0.3, tapMin: 0.25, blindTap: 0.1, chargeP: 0.08, release: 0.35, releaseSd: 0.1, react: 0.5, reactSd: 0.12,
      notice: 0.92, fireRate: 2.2, focusPause: 0.2, evalGap: [0.2, 0.4], misTap: 0.04, comboSkill: 0.75, instantP: 0.85,
      castDelay: [0.3, 1], gaugeDelay: [0.4, 1.4], stickNoise: 7, flickP: 0.6 }
  }
};
// on the dungeon floor: aim (px of thumb scatter), how fast they read (characters a second), how long they look
// around before a move, how bold they are (attack a sleeping enemy, open a chest, how low HP gets before they back off)
const FLOOR = {
  new: { aim: 9, misTap: 0.08, readCps: 14, look: [500, 1600], hold: [70, 160], explore: [0.75, 0.95], boldHp: 0.6, fleeHp: 0.45, searchP: 0.05, strikePots: 0.6, readCards: 0.4 },
  average: { aim: 6, misTap: 0.04, readCps: 22, look: [250, 900], hold: [55, 130], explore: [0.55, 0.85], boldHp: 0.5, fleeHp: 0.35, searchP: 0.12, strikePots: 0.85, readCards: 0.2 },
  good: { aim: 4, misTap: 0.02, readCps: 32, look: [120, 500], hold: [45, 110], explore: [0.4, 0.75], boldHp: 0.4, fleeHp: 0.3, searchP: 0.2, strikePots: 0.95, readCards: 0.1 }
};
function profile(skill, seed) {
  const s = BATTLE[skill] ? skill : 'average';
  return { skill: s, battle: BATTLE[s], floor: FLOOR[s], rand: rng(seed) };
}

/* Two thumbs (or more): finger ids are touch points. Every dispatch lists the points it is about: a start carries
   every finger still down plus the new one, a move every finger down, an end only the fingers lifted. */
class Fingers {
  constructor(cdp, rand) {
    this.cdp = cdp;
    this.rand = rand || Math.random;
    this.down_ = new Map();
    this.sent = 0;
  }
  gauss() {
    let u = 0, v = 0;
    while (!u) u = this.rand();
    while (!v) v = this.rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  pts() {
    return [...this.down_.entries()].map(([id, p]) => ({ x: p.x, y: p.y, id, radiusX: 6, radiusY: 6, force: 1 }));
  }
  isDown(id) {
    return this.down_.has(id);
  }
  at(id) {
    return this.down_.get(id) || null;
  }
  async down(id, x, y) {
    if (this.down_.has(id)) return this.move(id, x, y);
    this.down_.set(id, { x, y });
    this.sent++;
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: this.pts() });
  }
  async move(id, x, y) {
    if (!this.down_.has(id)) return this.down(id, x, y);
    this.down_.set(id, { x, y });
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: this.pts() });
  }
  async up(id) {
    const p = this.down_.get(id);
    if (!p) return;
    this.down_.delete(id);
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: p.x, y: p.y, id }] });
  }
  async upAll() {
    for (const id of [...this.down_.keys()]) await this.up(id);
  }
  // a slide from where the finger is to (x, y), in steps, as a thumb moves
  async slide(id, x, y, ms = 120, steps = 5) {
    const p = this.down_.get(id);
    if (!p) return this.down(id, x, y);
    for (let i = 1; i <= steps; i++) {
      await this.move(id, p.x + ((x - p.x) * i) / steps, p.y + ((y - p.y) * i) / steps);
      if (ms) await sleep(ms / steps);
    }
  }
  // a tap: lands near the aim (sd px), held a human moment; returns where it landed
  async tap(id, x, y, sd = 5, hold = [55, 130]) {
    const lx = x + this.gauss() * sd,
      ly = y + this.gauss() * sd;
    await this.down(id, lx, ly);
    await sleep(hold[0] + (hold[1] - hold[0]) * this.rand());
    await this.up(id);
    return { x: lx, y: ly };
  }
}

/* ---------- screenshots: a small PNG reader and what a frame looks like ---------- */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw Error('not a PNG');
  let o = 8, w = 0, h = 0, depth = 0, type = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o),
      kind = buf.toString('ascii', o + 4, o + 8),
      data = buf.subarray(o + 8, o + 8 + len);
    if (kind === 'IHDR') (w = data.readUInt32BE(0)), (h = data.readUInt32BE(4)), (depth = data[8]), (type = data[9]);
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    o += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6)) throw Error('PNG kind ' + depth + '/' + type);
  const bpp = type === 6 ? 4 : 3,
    raw = zlib.inflateSync(Buffer.concat(idat)),
    stride = w * bpp,
    px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)],
      src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0,
        b = y ? px[(y - 1) * stride + x] : 0,
        c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
// luminance, how much is near black, the most common colour's share, and colour variety, in a box of the image
function frameStats(img, box) {
  const { w, h, bpp, px } = img,
    x0 = Math.max(0, Math.floor(box ? box.x : 0)),
    y0 = Math.max(0, Math.floor(box ? box.y : 0)),
    x1 = Math.min(w, Math.ceil(box ? box.x + box.w : w)),
    y1 = Math.min(h, Math.ceil(box ? box.y + box.h : h));
  let n = 0, sum = 0, dark = 0;
  const bins = new Map();
  for (let y = y0; y < y1; y += 2)
    for (let x = x0; x < x1; x += 2) {
      const i = (y * w + x) * bpp,
        r = px[i], g = px[i + 1], b = px[i + 2],
        l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      n++;
      sum += l;
      if (l < 10) dark++;
      const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      bins.set(k, (bins.get(k) || 0) + 1);
    }
  if (!n) return null;
  let top = 0;
  for (const v of bins.values()) top = Math.max(top, v);
  return { lum: +(sum / n).toFixed(1), dark: +(dark / n).toFixed(3), top: +(top / n).toFixed(3), colours: bins.size };
}
async function grabFrame(cdp, box, scale = 0.5) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale } });
  const buf = Buffer.from(r.data, 'base64');
  return { buf, img: decodePng(buf) };
}

/* ---------- in the page: frames, long tasks, marks, and the DOM's own faults ---------- */
// injected once per page: everything is kept on window.__qa and read back by the runner
const MONITOR = () => {
  if (window.__qa) return;
  const Q = (window.__qa = { t0: performance.now(), dts: [], hitches: [], long: [], marks: [], glLost: [], frames: 0, gaps: [] });
  const ctx = () => {
    const scr = document.querySelector('.screen.on'),
      ov = [...document.querySelectorAll('.overlay.on')].map(e => e.id).join('+');
    let s = (scr ? scr.id : '?') + (ov ? '/' + ov : '');
    if (typeof B !== 'undefined' && B && scr && scr.id === 'scrBattle') s += ':' + B.phase;
    return s;
  };
  Q.ctx = ctx;
  let last = performance.now(),
    hidden = false;
  document.addEventListener('visibilitychange', () => (hidden = document.hidden));
  const loop = now => {
    const dt = now - last;
    last = now;
    if (!hidden) {
      Q.frames++;
      Q.dts.push(dt);
      if (Q.dts.length > 20000) Q.dts.splice(0, 5000);
      const recent = Q.dts.slice(-121, -1).slice().sort((a, b) => a - b),
        med = recent.length > 20 ? recent[recent.length >> 1] : 33;
      // a hitch: a frame well over this page's own usual frame (the machine's pace, not a fixed 60 fps)
      if (dt > Math.max(60, med * 2.5) && Q.frames > 30)
        Q.hitches.push({ t: Math.round(now - Q.t0), dt: Math.round(dt), med: Math.round(med), ctx: ctx(), mark: Q.lastMark && now - Q.lastMark.at < dt + 1500 ? Q.lastMark.name : null });
      if (Q.hitches.length > 3000) Q.hitches.splice(0, 1000);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        Q.long.push({ t: Math.round(e.startTime - Q.t0), d: Math.round(e.duration), ctx: ctx(), mark: Q.lastMark && e.startTime - Q.lastMark.at < 1500 ? Q.lastMark.name : null });
        if (Q.long.length > 3000) Q.long.splice(0, 1000);
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch (e) {}
  // how long the page saw each press (pointerdown to pointerup, in the page's own event times): a slow page can
  // stretch a quick tap into a hold, which is the machine, not the game
  const downs = new Map();
  Q.ptr = [];
  const trail = (e, kind) => {
    Q.ptr.push({ k: kind, id: e.pointerId, at: String(e.target.id || e.target.className || e.target.tagName).slice(0, 20), x: Math.round(e.clientX), y: Math.round(e.clientY), t: Math.round(e.timeStamp - Q.t0) });
    if (Q.ptr.length > 40) Q.ptr.splice(0, 20);
  };
  document.addEventListener('pointerdown', e => (downs.set(e.pointerId, { t: e.timeStamp, target: e.target.id || e.target.className }), trail(e, 'down')), true);
  document.addEventListener('pointercancel', e => trail(e, 'cancel'), true);
  document.addEventListener('pointerup', e => {
    trail(e, 'up');
    const d = downs.get(e.pointerId);
    if (d) Q.lastPress = { ms: Math.round(e.timeStamp - d.t), target: String(d.target).slice(0, 30) };
    downs.delete(e.pointerId);
  }, true);
  const lost = e => Q.glLost.push({ t: Math.round(performance.now() - Q.t0), id: e.target.id, ctx: ctx() });
  for (const c of document.querySelectorAll('canvas')) c.addEventListener('webglcontextlost', lost);
  // what the game is doing, so a hitch can be put down to it: floors built, fights begun, the hand screen
  const mark = name => {
    const at = performance.now();
    Q.lastMark = { name, at };
    Q.marks.push({ t: Math.round(at - Q.t0), name });
    if (Q.marks.length > 2000) Q.marks.splice(0, 500);
  };
  Q.mark = mark;
  for (const fn of ['enterExplore', 'fight', 'openCustomScreen', 'closeCustomScreen', 'xEngage', 'xEndFight', 'openCamp', 'xStairsDown', 'xSpring', 'xBreakPot', 'xSearchAt', 'xStrike', 'openMenu', 'maybeLevelUp']) {
    const f = window[fn];
    if (typeof f !== 'function' || f.__qa) continue;
    const w = function () {
      mark(fn);
      if (fn === 'xStrike') window.__strikes = (window.__strikes || 0) + 1;
      return f.apply(this, arguments);
    };
    w.__qa = true;
    try {
      window[fn] = w;
    } catch (e) {}
  }
};

// faults a player would see on screen right now: words that read NaN/undefined, clipped text, broken images,
// controls off screen or under something else, unreadably small text, a canvas drawn below the screen's resolution
const DOM_AUDIT = () => {
  const out = { badText: [], clipped: [], brokenImg: [], offscreen: [], covered: [], tiny: [], lowRes: [] };
  const vis = el => {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05;
  };
  const name = el => (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase());
  const path = el => {
    const p = [];
    for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) p.unshift(name(e));
    return p.join(' > ');
  };
  // the layer on top: an open overlay covers the screen under it on purpose, so only it is checked then
  const ovs = [...document.querySelectorAll('.overlay.on')].filter(vis);
  const roots = ovs.length ? ovs.slice(-1) : [...document.querySelectorAll('.screen.on, #xBottom, #xTop, #hudTop, #hudBottom')].filter(vis);
  const seen = new Set();
  for (const root of roots)
    for (const el of root.querySelectorAll('*')) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!vis(el)) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (own && /(^|\W)(NaN|undefined|null|Infinity)(\W|$)|\[object /.test(own) && out.badText.length < 12) out.badText.push({ at: path(el), text: own.slice(0, 80) });
      const cs = getComputedStyle(el);
      if (own && (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis' || cs.overflow === 'clip') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && out.clipped.length < 12)
        out.clipped.push({ at: path(el), text: own.slice(0, 60), need: el.scrollWidth, have: el.clientWidth });
      if (own && own.length > 2 && parseFloat(cs.fontSize) < 9 && !el.closest('.card') && out.tiny.length < 8) out.tiny.push({ at: path(el), text: own.slice(0, 40), px: parseFloat(cs.fontSize) });
      if (el.tagName === 'IMG' && el.complete && !el.naturalWidth && out.brokenImg.length < 8) out.brokenImg.push({ at: path(el), src: (el.getAttribute('src') || '').slice(0, 80) });
      if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && !el.disabled) {
        const r = el.getBoundingClientRect(),
          x = r.x + r.width / 2,
          y = r.y + r.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) {
          if (out.offscreen.length < 8 && !el.closest('.scroll, .grid, [style*="overflow"]')) out.offscreen.push({ at: path(el), x: Math.round(x), y: Math.round(y) });
        } else {
          const t = document.elementFromPoint(x, y);
          if (t && !(t === el || el.contains(t) || t.contains(el)) && out.covered.length < 8) out.covered.push({ at: path(el), text: (el.innerText || '').trim().slice(0, 30), under: path(t) });
        }
      }
    }
  for (const c of document.querySelectorAll('canvas')) {
    if (!vis(c)) continue;
    const r = c.getBoundingClientRect(),
      want = r.width * Math.min(2, devicePixelRatio || 1);
    if (c.width < want * 0.7 && r.width > 60) out.lowRes.push({ at: path(c), canvas: c.width + 'x' + c.height, shown: Math.round(r.width) + 'x' + Math.round(r.height) });
  }
  return out;
};

module.exports = { sleep, rng, profile, BATTLE, FLOOR, Fingers, decodePng, frameStats, grabFrame, MONITOR, DOM_AUDIT };
