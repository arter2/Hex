'use strict';
// node tools/playtest/touch-dungeon-runner.js <results-directory> [depths=1,4,6,12,17,22] [minutesPerFloor=8] [device=phone]
// A QA pass through dungeon floors with real touch input only. The save is prepared (a starter deck and a
// character levelled for the floor's depth); after that every action is a touch at screen coordinates sent through
// Chromium's own input events: the main menu's Explore button, taps on the floor to walk (the game's default
// "tap to walk" mode), dialog and reward buttons, the stairs' path map, and in a fight the hand screen, Fire (held)
// and Cast. The bot reads game state only to decide where to tap and to check what happened.
// Per floor it reports: page errors, taps the game ignored, walks that made no progress, softlocks, overlays it
// could not close, dungeon HUD controls covered or under 44 px, frame times, fights, and screenshots.
const fs = require('fs'),
  path = require('path'),
  R = require('./runner-common.js');
const DEVICES = {
  phone: { width: 390, height: 844 },
  'phone-landscape': { width: 844, height: 390 },
  tablet: { width: 820, height: 1180 }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function touch(cdp, x, y, holdMs = 0) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  if (holdMs) await sleep(holdMs);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function tapEl(page, cdp, selector, holdMs = 0) {
  const el = page.locator(selector).first();
  const box = await el.boundingBox().catch(() => null);
  if (!box || !box.width) return false;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const hit = await page.evaluate(
    ([x, y, sel]) => {
      const t = document.elementFromPoint(x, y),
        el = document.querySelector(sel);
      return { ok: !!(t && el && (t === el || el.contains(t))), under: t ? t.id || String(t.className) || t.tagName : null };
    },
    [x, y, selector]
  );
  await touch(cdp, x, y, holdMs);
  return hit;
}

// what the player sees right now
const SCREEN = () => {
  const vis = id => {
    const e = document.getElementById(id);
    return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
  };
  const on = id => {
    const e = document.getElementById(id);
    return !!e && e.classList.contains('on');
  };
  const overlays = ['xDialog', 'reveal', 'pause', 'detail', 'pick', 'settings', 'custom', 'peek'].filter(vis);
  const screen = ['scrMenu', 'scrCamp', 'scrExplore', 'scrBattle', 'scrStart'].find(on) || null;
  return {
    screen,
    overlays,
    depth: typeof EX !== 'undefined' && EX ? EX.depth : null,
    pc: typeof EX !== 'undefined' && EX ? EX.pc : null,
    hp: typeof EX !== 'undefined' && EX ? EX.hp : null,
    busy: typeof EX !== 'undefined' && EX ? !!EX.busy : null,
    battleHp: typeof B !== 'undefined' && B && B.player ? B.player.hp : null,
    battlePhase: typeof B !== 'undefined' && B ? B.phase : null,
    enemies: typeof B !== 'undefined' && B && B.enemies ? B.enemies.filter(e => e.hp > 0).length : null
  };
};

// where to tap next on the floor: the stairs once seen, else the nearest edge of what you have explored
const PLAN = blacklist => {
  if (!EX || !EX.active) return null;
  const black = new Set(blacklist),
    N = XN * XN;
  const r = appBox(document.getElementById('xView'));
  const avoid = ['xTop', 'xBottom', 'xMini', 'xStatus']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(e => e.getBoundingClientRect())
    .filter(b => b.width && b.height);
  const screenOf = c => {
    const v = new THREE.Vector3(xw(c), 0, xz(c)).project(X3.cam);
    if (v.z > 1) return null;
    const x = r.left + ((v.x + 1) / 2) * r.width,
      y = r.top + ((1 - v.y) / 2) * r.height;
    if (x < 24 || y < 24 || x > innerWidth - 24 || y > innerHeight - 24) return null;
    if (avoid.some(b => x > b.left - 6 && x < b.right + 6 && y > b.top - 6 && y < b.bottom + 6)) return null;
    return { x, y };
  };
  let target = -1,
    why = '';
  if (EX.seen[EX.down] && !black.has(EX.down)) {
    target = EX.down;
    why = 'stairs';
  } else {
    const seen = new Array(N).fill(-1),
      q = [EX.pc];
    seen[EX.pc] = 0;
    while (q.length) {
      const c = q.shift(),
        x = xcx(c),
        y = xcy(c);
      const ns = [xi(x + 1, y), xi(x - 1, y), xi(x, y + 1), xi(x, y - 1)].filter(
        n => n >= 0 && n < N && Math.abs(xcx(n) - x) + Math.abs(xcy(n) - y) === 1
      );
      if (c !== EX.pc && !black.has(c) && ns.some(n => !EX.seen[n] && xPassable(n))) {
        target = c;
        why = 'explore';
        break;
      }
      for (const n of ns) if (seen[n] < 0 && EX.seen[n] && xPassable(n)) (seen[n] = seen[c] + 1), q.push(n);
    }
  }
  if (target < 0) return { target: -1, why: 'nothing left to explore' };
  const route = xPathToCell(target);
  if (!route || !route.length) return { target, why, route: 0, tap: null };
  // tap the farthest step of the route that is on screen and clear of the HUD
  let tap = null,
    via = -1,
    toward = false;
  for (let k = Math.min(route.length - 1, 14); k >= Math.min(2, route.length - 1); k--) {
    const s = screenOf(route[k]);
    if (s) {
      tap = s;
      via = route[k];
      break;
    }
  }
  if (!tap) {
    // nothing on the route is clear on screen: tap 90 px from you in the direction of the next step
    const me = new THREE.Vector3(EX.px, 0, EX.pz).project(X3.cam),
      nx = new THREE.Vector3(xw(route[0]), 0, xz(route[0])).project(X3.cam);
    const mx = r.left + ((me.x + 1) / 2) * r.width,
      my = r.top + ((1 - me.y) / 2) * r.height;
    const dx = (nx.x - me.x) * r.width,
      dy = -(nx.y - me.y) * r.height,
      L = Math.hypot(dx, dy) || 1;
    const x = mx + (dx / L) * 90,
      y = my + (dy / L) * 90;
    if (x > 24 && y > 24 && x < innerWidth - 24 && y < innerHeight - 24) (tap = { x, y }), (toward = true);
  }
  return { target, why, route: route.length, tap, via, toward };
};

const HUD_AUDIT = () => {
  const out = { covered: [], small: [] };
  for (const id of ['xMenu', 'xSearch', 'xDisarm', 'xBag', 'xCamp', 'xMini', 'xMapBtn']) {
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
      return {
        sel: `[data-qa="${id}-${i}"]`,
        text: (b.innerText || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        label: b.getAttribute('aria-label') || b.title || ''
      };
    });
};
const pick = (buttons, prefer) => {
  for (const re of prefer) {
    const b = buttons.find(b => re.test(b.text));
    if (b) return b;
  }
  return buttons[0] || null;
};

async function playFloor(browser, host, depth, minutes, device, out) {
  const dims = DEVICES[device] || DEVICES.phone;
  const { page, context, errors } = await R.openPage(browser, host.url, { viewport: dims, hasTouch: true, isMobile: true });
  const cdp = await context.newCDPSession(page);
  const tag = `d${depth}-${device}`;
  const issues = [],
    log = [],
    shots = [];
  const issue = (kind, detail) => issues.push({ kind, t: Math.round((Date.now() - t0) / 1000), ...detail });
  const shot = async name => {
    const f = `${tag}-${String(shots.length).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(out, f) }).catch(() => {});
    shots.push(f);
    return f;
  };
  const t0 = Date.now();
  const stats = { taps: 0, tapsIgnored: 0, walks: 0, stuck: 0, fights: 0, deaths: 0, fightSeconds: [], dialogs: [], tips: [] };
  // fixture: a fresh save with a starter deck and a character levelled roughly for this depth
  const level = await page.evaluate(depth => {
    save = newSave(STARTERS[0]);
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
    const level = save.level;
    // "Walk to touch" (a Settings choice): the default "tap to walk" times the tap between handler calls, and on this
    // software-rendered page a touch's down and up arrive ~0.9 s apart, so every tap would read as a hold
    try {
      localStorage.setItem('hexmancers-xmove', 'goal');
    } catch (e) {}
    persist();
    // frame times, sampled from the page's own animation frames
    window.__ft = [];
    let last = performance.now();
    const loop = now => {
      window.__ft.push(now - last);
      if (window.__ft.length > 5000) window.__ft.shift();
      last = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    openMenu();
    return level;
  }, depth);
  // the real way in: the main menu's Explore button (Start at depth = deepest)
  const enter = await tapEl(page, cdp, '#mmExplore');
  if (!enter || !enter.ok) issue('tap-covered', { control: 'mmExplore', under: enter && enter.under });
  await page.waitForFunction(() => document.getElementById('scrExplore').classList.contains('on'), null, { timeout: 30000 }).catch(() =>
    issue('softlock', { what: 'Explore did not open from the main menu' })
  );
  await sleep(1500);
  await shot('arrive');
  const hud = await page.evaluate(HUD_AUDIT);
  for (const c of hud.covered) issue('hud-covered', c);
  for (const s of hud.small) issue('hud-small-target', s);

  const blacklist = [],
    noTap = new Map();
  let attempts = 1;
  let lastPc = -1,
    sameCount = 0,
    seenDialogs = new Map(),
    endReason = 'time',
    reachedDepth = depth,
    shotFight = false,
    shotDialog = 0,
    lastState = null;
  const deadline = t0 + minutes * 60000;
  while (Date.now() < deadline) {
    const s = await page.evaluate(SCREEN).catch(e => ({ error: String(e) }));
    lastState = s;
    if (s.error) {
      issue('page-crash', { error: s.error });
      endReason = 'crash';
      break;
    }
    if (s.depth && s.depth > depth) {
      reachedDepth = s.depth;
      endReason = 'took the stairs down';
      await sleep(1500);
      await shot('next-floor');
      break;
    }
    if (s.screen === 'scrCamp' || s.screen === 'scrMenu') {
      stats.deaths++;
      await shot('ended');
      if (attempts >= 3 || Date.now() > deadline - 60000) {
        endReason = 'died ' + stats.deaths + ' time(s)';
        break;
      }
      attempts++;
      // back in: heal up and start this depth again from the main menu
      await page.evaluate(() => {
        if (typeof stopExplore === 'function') stopExplore();
        openMenu();
      });
      await sleep(800);
      const again = await tapEl(page, cdp, '#mmExplore');
      stats.taps++;
      if (!again || !again.ok) issue('tap-covered', { control: 'mmExplore (retry)', under: again && again.under });
      await page.waitForFunction(() => document.getElementById('scrExplore').classList.contains('on'), null, { timeout: 30000 }).catch(() =>
        issue('softlock', { what: 'Explore did not reopen after a death' })
      );
      blacklist.length = 0;
      noTap.clear();
      lastPc = -1;
      await sleep(1200);
      continue;
    }
    // overlays first: dialogs, rewards, the hand screen
    const ov = s.overlays.find(o => o !== 'peek') || (s.overlays.includes('peek') ? 'peek' : null);
    if (ov) {
      if (ov === 'custom') {
        // the hand screen before a fight: tap three cards into the queue, then Fight!
        const cards = await page.evaluate(() =>
          [...document.querySelectorAll('#custHand .card')].slice(0, 3).map((c, i) => {
            c.dataset.qa = 'hand-' + i;
            return `[data-qa="hand-${i}"]`;
          })
        );
        for (const c of cards) {
          await tapEl(page, cdp, c);
          stats.taps++;
          await sleep(350);
        }
        if (!shotFight) await shot('hand-screen');
        const f = await tapEl(page, cdp, '#btnFight');
        stats.taps++;
        if (f && !f.ok) issue('tap-covered', { control: 'Fight!', under: f.under });
        await sleep(800);
        const still = await page.evaluate(() => document.getElementById('custom').classList.contains('on'));
        if (still) {
          issue('tap-ignored', { control: 'Fight! (hand screen stayed open)' });
          await page.evaluate(() => closeCustomScreen && closeCustomScreen());
        }
        continue;
      }
      if (ov === 'peek') {
        await touch(cdp, 20, dims.height / 2);
        await sleep(300);
        continue;
      }
      const info = await page.evaluate(id => {
        const box = document.getElementById(id);
        const title = (box.querySelector('h2') || {}).textContent || '';
        return { title: title.trim(), text: (box.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 240) };
      }, ov);
      const buttons = await page.evaluate(BUTTONS, ov);
      const key = ov + ':' + info.title;
      const n = (seenDialogs.get(key) || 0) + 1;
      seenDialogs.set(key, n);
      if (n === 1) {
        for (const u of buttons.filter(b => !b.text && !b.label)) issue('unlabelled-button', { overlay: ov, title: info.title, sel: u.sel });
        stats.dialogs.push({ overlay: ov, title: info.title, text: info.text, buttons: buttons.map(b => b.text) });
        if (shotDialog < 6) {
          shotDialog++;
          await shot('dialog-' + (info.title || ov).replace(/[^a-z0-9]+/gi, '-').slice(0, 24));
        }
      }
      const prefer =
        n > 3
          ? [/leave|close|done|not now|back|cancel|resume|✕/i]
          : [/^(take|open|loot|claim|accept|continue|ok|descend|go down|choose|fight|keep|resume)/i, /worn|quiet|treasure|stair/i, /leave|close|done|not now|back|cancel|✕/i];
      const b = pick(buttons, prefer);
      if (!b) {
        issue('overlay-no-button', { overlay: ov, title: info.title });
        await shot('stuck-overlay');
        await touch(cdp, 12, 12);
        await sleep(600);
        if (n > 5) {
          endReason = 'overlay could not be closed';
          break;
        }
        continue;
      }
      const hit = await tapEl(page, cdp, b.sel);
      stats.taps++;
      if (hit && !hit.ok) issue('tap-covered', { overlay: ov, button: b.text, under: hit.under });
      await sleep(700);
      if (n > 8) {
        issue('overlay-loop', { overlay: ov, title: info.title, button: b.text });
        await shot('overlay-loop');
        endReason = 'overlay kept coming back';
        break;
      }
      continue;
    }
    if (s.screen === 'scrBattle') {
      // a fight: hold Fire to charge a shot, tap Cast, and step on your own side now and then
      const fightStart = Date.now();
      stats.fights++;
      if (!shotFight) {
        await sleep(800);
        await shot('battle');
        shotFight = true;
      }
      let k = 0,
        res = 'unfinished';
      while (Date.now() - fightStart < 150000 && Date.now() < deadline) {
        const b = await page.evaluate(SCREEN).catch(() => null);
        if (!b) break;
        if (b.screen !== 'scrBattle') {
          res = 'left battle';
          break;
        }
        if (b.overlays.length) {
          // the hand screen again (Spell), a reward or the result: handled by the outer loop
          res = 'overlay';
          break;
        }
        const step = k++ % 4;
        if (step === 0 || step === 2) {
          const h = await tapEl(page, cdp, '#btnWand', 650);
          if (h && !h.ok) issue('tap-covered', { control: 'Fire', under: h.under });
        } else if (step === 1) {
          const h = await tapEl(page, cdp, '#btnCast');
          if (h && !h.ok) issue('tap-covered', { control: 'Cast', under: h.under });
        } else {
          // a step on your own side of the board (the lower part of the board canvas)
          const box = await page.locator('#board').boundingBox();
          if (box) await touch(cdp, box.x + box.width * (0.25 + Math.random() * 0.5), box.y + box.height * (0.72 + Math.random() * 0.15));
        }
        stats.taps++;
        await sleep(350);
      }
      const after = await page.evaluate(SCREEN).catch(() => null);
      const secs = Math.round((Date.now() - fightStart) / 1000);
      stats.fightSeconds.push(secs);
      if (res === 'unfinished') {
        issue('fight-too-long', { seconds: secs, enemiesLeft: after && after.enemies, hp: after && after.battleHp });
        await shot('long-fight');
      }
      continue;
    }
    if (s.screen !== 'scrExplore') {
      await sleep(500);
      continue;
    }
    const tipOpen = await page.evaluate(() => {
      const t = document.getElementById('xTipCard');
      return !!t && getComputedStyle(t).display !== 'none' && t.getBoundingClientRect().height > 0 && getComputedStyle(t).visibility !== 'hidden' && getComputedStyle(t).opacity !== '0';
    });
    if (tipOpen) {
      const tipText = await page.evaluate(() => document.getElementById('xTipText').textContent.trim());
      if (!stats.tips.includes(tipText)) stats.tips.push(tipText);
      const h = await tapEl(page, cdp, '#xTipOk');
      stats.taps++;
      if (h && !h.ok) issue('tap-covered', { control: 'tip: Got it', under: h.under });
      await sleep(500);
      continue;
    }
    if (s.busy) {
      await sleep(400);
      continue;
    }
    // walk: tap a point on the floor along the way to the next goal
    const plan = await page.evaluate(PLAN, blacklist);
    if (!plan) {
      await sleep(400);
      continue;
    }
    if (plan.target < 0) {
      issue('no-route', { what: 'explored everything reachable but the stairs down are not known' });
      await shot('no-route');
      endReason = 'nothing left to explore';
      break;
    }
    if (!plan.tap) {
      const tries = (noTap.get(plan.target) || 0) + 1;
      noTap.set(plan.target, tries);
      await sleep(500);
      if (tries < 3) continue;
      issue('no-tap-point', { target: plan.target, why: plan.why, route: plan.route });
      blacklist.push(plan.target);
      if (blacklist.length > 30) {
        endReason = 'no reachable goals';
        break;
      }
      continue;
    }
    await touch(cdp, plan.tap.x, plan.tap.y);
    stats.taps++;
    stats.walks++;
    await sleep(150);
    const took = await page.evaluate(() => !!(EX && (EX.goal || (EX.path && EX.path.length))));
    if (!took) {
      const st = await page.evaluate(SCREEN);
      if (st.screen === 'scrExplore' && !st.overlays.length && !st.busy) {
        stats.tapsIgnored++;
        if (stats.tapsIgnored <= 3) issue('tap-ignored', { x: Math.round(plan.tap.x), y: Math.round(plan.tap.y), goal: plan.why });
      }
    }
    await sleep(1600);
    const now = await page.evaluate(() => (EX ? EX.pc : -1));
    if (now === lastPc) {
      sameCount++;
      if (sameCount === 3) {
        stats.stuck++;
        issue('stuck', { cell: now, goal: plan.why, target: plan.target });
        if (stats.stuck <= 3) await shot('stuck');
        blacklist.push(plan.target);
        sameCount = 0;
      }
    } else sameCount = 0;
    lastPc = now;
  }
  const end = await page
    .evaluate(() => {
      const ft = (window.__ft || []).slice(30).sort((a, b) => a - b);
      const q = p => (ft.length ? Math.round(ft[Math.floor(ft.length * p)]) : null);
      let seen = 0,
        open = 0;
      if (typeof EX !== 'undefined' && EX && EX.seen) for (let i = 0; i < EX.seen.length; i++) if (EX.t[i] !== T_ROCK) (open++, EX.seen[i] && seen++);
      return { frameMs: { p50: q(0.5), p95: q(0.95), p99: q(0.99) }, explored: open ? Math.round((seen * 100) / open) : null, hp: EX ? EX.hp : null };
    })
    .catch(() => ({}));
  if (endReason === 'time') {
    issue('floor-not-finished', { minutes, state: lastState });
    await shot('time-up');
  }
  for (const e of errors) issue('page-error', { error: String(e).slice(0, 300) });
  await context.close();
  return {
    depth,
    device,
    level,
    reachedDepth,
    endReason,
    seconds: Math.round((Date.now() - t0) / 1000),
    explored: end.explored,
    frameMs: end.frameMs,
    hpLeft: end.hp,
    stats,
    issues,
    shots
  };
}

async function run() {
  const out = process.argv[2] || 'playtest-touch-dungeon';
  const depths = (process.argv[3] || '1,4,6,12,17,22').split(',').map(Number);
  const minutes = Number(process.argv[4] || 8);
  const device = process.argv[5] || 'phone';
  fs.mkdirSync(out, { recursive: true });
  const host = await R.serve();
  let browser;
  const results = [];
  try {
    ({ browser } = await R.launch());
    for (const d of depths) {
      const r = await playFloor(browser, host, d, minutes, device, out).catch(e => ({ depth: d, device, crash: String(e && e.stack) }));
      results.push(r);
      fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
      console.log(JSON.stringify({ depth: d, end: r.endReason || r.crash, issues: (r.issues || []).length }));
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
module.exports = { run };
