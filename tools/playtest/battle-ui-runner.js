// BROWSER=chromium node tools/playtest/battle-ui-runner.js [results-directory]
// The battle screen and the hand screen, driven by real coordinate taps on phone and tablet sizes, portrait and
// landscape, plus a left-handed phone. Game state is only set up (a fight, cards dealt, the Spell gauge filled);
// every action the player takes is a tap at screen coordinates, and each step asserts what the player would see.
//
// Steps, per screen size:
//   hand screen  - tap three cards into the queue, then Fight!
//   battle HUD   - no control covers another (queue tiles, Fire, Cast, Spell, instants, pause)
//                - tap the 3rd queue card: it becomes NEXT
//                - tap Cast: the NEXT card is cast
//                - hold Fire (Chromium only: a held touch needs CDP): it charges, and lets go
//                - tap Whetstone, then a queue card: the hint shows, then the card is enchanted (blue, ✚)
//                - the Spell button turns gold when full; tap it: the hand screen opens
//   hand screen  - Keep: tap the tool into a slot, double-tap it, tap a card to keep, Done
//                - Search: tap the tool into a slot, double-tap it, 3 cards turn up, tap one: it joins the hand
//                - Fight! returns to the battle
'use strict';
const fs = require('fs'),
  path = require('path'),
  R = require('./runner-common.js'),
  { tap } = require('./ui-runner.js');

const MATRIX = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-portrait-lefty', width: 390, height: 844, lefty: true },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Every battle control's centre must land on the control itself; queue tiles and instants are checked at their
// corners too (Fire and Cast are quarter circles, so only their centres and lower halves are drawn).
async function hudAudit(page) {
  return page.evaluate(() => {
    const out = [];
    const check = (el, name, all) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ix = Math.min(8, r.width / 5),
        iy = Math.min(8, r.height / 5);
      const pts = all
        ? [
            [r.x + r.width / 2, r.y + r.height / 2],
            [r.x + ix, r.y + iy],
            [r.right - ix, r.y + iy],
            [r.x + ix, r.bottom - iy],
            [r.right - ix, r.bottom - iy]
          ]
        : [
            [r.x + r.width / 2, r.y + r.height / 2],
            [r.x + r.width / 2, r.bottom - iy]
          ];
      for (const [x, y] of pts) {
        const t = document.elementFromPoint(x, y);
        const outside = x < 0 || y < 0 || x >= innerWidth || y >= innerHeight;
        if (outside || !(t === el || el.contains(t)))
          out.push({
            control: name,
            x: Math.round(x),
            y: Math.round(y),
            cover: outside ? 'off screen' : t ? t.id || t.className || t.tagName : null
          });
      }
    };
    check(document.getElementById('btnWand'), 'Fire', false);
    check(document.getElementById('btnCast'), 'Cast', false);
    check(document.getElementById('btnSpell'), 'Spell', true);
    check(document.getElementById('btnMenu'), 'Pause', true);
    document.querySelectorAll('#queueRow .qslot').forEach((q, i) => check(q, 'queue ' + (i + 1), true));
    document.querySelectorAll('#instRow .inst').forEach((q, i) => check(q, 'instant ' + (i + 1), true));
    return out;
  });
}

// A held touch: Playwright's touchscreen only taps, so Chromium's own input events are used.
async function hold(page, context, selector, ms) {
  const box = await page.locator(selector).boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const under = await page.evaluate(
    ([x, y]) => {
      const t = document.elementFromPoint(x, y);
      return t ? t.id || t.className : null;
    },
    [x, y]
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await sleep(ms);
  const during = await page.evaluate(() => ({
    charging: !!B.player.charging,
    lit: document.getElementById('btnWand').classList.contains('chg')
  }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(150);
  const after = await page.evaluate(() => !!B.player.charging);
  await cdp.detach();
  return { ...during, chargingAfter: after, under, x: Math.round(x), y: Math.round(y) };
}

// Two quick taps (a deck tool in a slot is used with a double-tap, inside 320 ms). On a big software-rendered page
// each Playwright tap waits for a frame, which can take longer than that, so Chromium gets both taps sent
// back to back as raw touch events.
async function doubleTap(page, context, engine, selector) {
  const box = await page.locator(selector).boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const t0 = Date.now();
  if (engine !== 'chromium') {
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    return Date.now() - t0;
  }
  const cdp = await context.newCDPSession(page);
  for (let k = 0; k < 2; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await cdp.detach();
  return Date.now() - t0;
}

// Double-tap a deck tool in its slot. If the page took longer than the game's 320 ms double-tap window just to
// receive the taps (software rendering of a big page), that is the test machine, not the game: say so, and use the
// tool directly so the rest of the flow is still tested.
async function useTool(page, context, engine, util, steps, readySelector) {
  const slot = await page.evaluate(util => B.piles.queue.findIndex(h => h.card.util === util), util);
  const ms = await doubleTap(page, context, engine, `#custQueue .card[data-i="${slot}"]`);
  try {
    await page.waitForSelector(readySelector, { state: 'visible', timeout: 2500 });
    steps.push({ name: util + ': a double-tap in its slot uses it', ok: true, detail: { ms } });
  } catch (e) {
    if (ms < 320) throw Error(util + ': a double-tap in its slot did nothing (taps took ' + ms + ' ms)');
    steps.push({
      name: util + ': a double-tap in its slot uses it',
      ok: true,
      skipped: true,
      detail:
        'not tested here: this machine took ' + ms + ' ms to deliver the two taps (the window is 320 ms)'
    });
    await page.evaluate(util => {
      const t = B.piles.hand.find(h => h.card.util === util) || B.piles.queue.find(h => h.card.util === util);
      if (!B.piles.queue.includes(t)) toggleQueue(B.piles, t.uid);
      fireTool(t);
    }, util);
    await page.waitForSelector(readySelector, { state: 'visible' });
  }
}

// A tap on a hand-screen card. The game treats a press held 450 ms as "read this card" and opens its detail; a
// software-rendered test page can take that long just to deliver one tap. If the detail opened, close it, note it,
// and tap again (up to twice more).
async function tapCard(page, selector, notes) {
  for (let k = 0; k < 3; k++) {
    await tap(page, selector);
    await sleep(150);
    if (!(await page.locator('#detail.on').isVisible())) return;
    notes.push('slow tap read as a hold on ' + selector);
    await page.evaluate(() => document.getElementById('detail').classList.remove('on'));
    await sleep(100);
  }
  throw Error('every tap on ' + selector + ' was read as a hold');
}

async function scenario(page, context, device, engine, shot, steps) {
  const step = (name, ok, detail) => {
    steps.push({ name, ok: !!ok, detail: detail ?? null });
    if (!ok) throw Error(name + (detail ? ': ' + JSON.stringify(detail) : ''));
  };
  const state = (fn, arg) => page.evaluate(fn, arg);
  const slow = [];

  // Fixture: a fresh character in a depth-3 fight with a big HP pool, so the test is about controls, not survival.
  await state(() => {
    save = newSave(STARTERS[0]);
    save.char = lockChar(newChar('human', 0));
    fight(3);
    B.player.hp = B.player.maxHp = 9999;
    renderCustom();
  });
  await page.waitForSelector('#custom.on', { state: 'visible' });
  await shot('hand-1');

  // hand screen: tap three ordinary cards into the queue
  const picks = await state(() =>
    B.piles.hand
      .map((h, i) => ({ i, ok: !isInstant(h.card) && !isDeckTool(h.card) }))
      .filter(x => x.ok)
      .slice(0, 3)
      .map(x => x.i)
  );
  for (let k = 0; k < picks.length; k++) {
    // indexes shift as cards leave the hand, so find the k-th ordinary card each time
    const i = await state(() =>
      B.piles.hand.findIndex(h => !isInstant(h.card) && !isDeckTool(h.card) && !B.piles.queue.includes(h))
    );
    if (i < 0)
      step(
        'hand screen: an ordinary card to queue',
        false,
        await state(() => ({
          phase: B.phase,
          hand: B.piles.hand.map(h => h.card.name),
          queue: B.piles.queue.map(h => h.card.name)
        }))
      );
    await tapCard(page, `#custHand .card[data-i="${i}"]`, slow);
    await sleep(120);
  }
  const queued = await state(() => B.piles.queue.length);
  step('hand screen: three taps queue three cards', queued === picks.length && queued >= 2, { queued });
  await tap(page, '#btnFight');
  await page.waitForSelector('#custom.on', { state: 'hidden' });
  await sleep(400);

  // a Whetstone in hand, so the instants column shows (and is part of the overlap check)
  await state(() => {
    const c = Object.values(CARDS).find(c => c.type === 'tinker');
    B.piles.hand.push({ uid: B.piles.uid++, card: c });
    hud(true);
  });
  await sleep(200);
  await shot('battle');

  const covered = await hudAudit(page);
  step('battle HUD: no control is covered or off screen', !covered.length, covered.slice(0, 6));

  const sides = await state(() => ({
    fire: document.getElementById('btnWand').getBoundingClientRect().x,
    cast: document.getElementById('btnCast').getBoundingClientRect().x,
    inst: document.getElementById('instRow').getBoundingClientRect().x,
    mid: innerWidth / 2
  }));
  if (device.lefty)
    step(
      'left-handed: Fire on the right, instants on the left',
      sides.fire > sides.cast && sides.inst < sides.mid,
      sides
    );
  else
    step('Fire on the left, instants on the right', sides.fire < sides.cast && sides.inst > sides.mid, sides);

  // queue: tap the last card, it becomes NEXT
  const before = await state(() => B.piles.queue.map(c => c.uid));
  const last = before.length - 1;
  await tap(page, `#queueRow .qslot:nth-child(${last + 1})`);
  await sleep(200);
  const after = await state(() => ({
    q: B.piles.queue.map(c => c.uid),
    nextTag: !!document.querySelector('#queueRow .qslot.next .nxt')
  }));
  step('tap a queue card: it becomes NEXT', after.q[0] === before[last] && after.nextTag, { before, after });

  // Cast: the NEXT card goes
  const next = after.q[0];
  await tap(page, '#btnCast');
  await sleep(500);
  const cast = await state(() => B.piles.queue.map(c => c.uid));
  step('tap Cast: the NEXT card is cast', !cast.includes(next), { queue: cast });

  // Fire: hold to charge
  if (engine === 'chromium') {
    const h = await hold(page, context, '#btnWand', 700);
    step('hold Fire: it charges and lights, and lets go', h.charging && h.lit && !h.chargingAfter, h);
  } else steps.push({ name: 'hold Fire', ok: true, detail: 'skipped: a held touch needs Chromium' });

  // Whetstone: tap it, the hint shows, tap a queue card, it is enchanted
  if (await state(() => B.piles.queue.length)) {
    await tap(page, '#instRow .inst');
    await sleep(200);
    const armed = await state(() => !!document.querySelector('#instRow .ench-hint'));
    step('tap Whetstone: "Tap a card to enchant" shows', armed);
    await shot('enchant-armed');
    await tap(page, '#queueRow .qslot.full');
    await sleep(250);
    const ench = await state(() => ({
      tile: !!document.querySelector('#queueRow .qslot.ench'),
      boosted: B.piles.queue.some(c => c.tinker > 0)
    }));
    step('tap a queue card: it is enchanted (blue, ✚)', ench.tile && ench.boosted, ench);
    await shot('enchanted');
  }

  // Spell: fill the gauge (fixture), it turns gold, a tap opens the hand screen
  await state(() => {
    B.gauge = GAUGE_MAX;
  });
  await page.waitForSelector('#btnSpell.ready', { state: 'visible' });
  await shot('spell-ready');
  await tap(page, '#btnSpell');
  await page.waitForSelector('#custom.on', { state: 'visible' });
  step('tap the gold Spell button: the hand screen opens', true);

  // hand screen: Keep and Search tools (dealt in as a fixture)
  await state(() => {
    const all = Object.values(CARDS);
    while (B.piles.queue.length) toggleQueue(B.piles, B.piles.queue[0].uid);
    // make room first: a hand over its limit puts the newest cards back in the deck
    const P = B.piles;
    while (P.hand.length > handMax(P) - 2)
      P.draw.push(
        P.hand.splice(
          P.hand.findIndex(h => !isDeckTool(h.card)),
          1
        )[0]
      );
    for (const c of [
      all.find(c => c.util === 'keep' && isDeckTool(c)),
      all.find(c => c.util === 'search' && isDeckTool(c))
    ])
      P.hand.push({ uid: P.uid++, card: c });
    renderCustom();
  });
  await sleep(200);
  const toolAt = util =>
    state(util => B.piles.hand.findIndex(h => isDeckTool(h.card) && h.card.util === util), util);

  // Search first: Keep sends every card it does not keep back to the deck, the Search tool included
  await tapCard(page, `#custHand .card[data-i="${await toolAt('search')}"]`, slow);
  await sleep(450);
  const searchSlot = await state(() => B.piles.queue.findIndex(h => h.card.util === 'search'));
  step('Search: a tap puts it in a slot', searchSlot >= 0, { searchSlot });
  await useTool(page, context, engine, 'search', steps, '#custDeck:not([hidden])');
  const offered = await state(() => document.querySelectorAll('#custDeck .card').length);
  step('Search: up to 3 cards turn up', offered >= 1 && offered <= 3, { offered });
  await shot('search');
  const handBefore = await state(() => B.piles.hand.map(h => h.uid));
  await tapCard(page, '#custDeck .card', slow);
  await sleep(250);
  const handAfter = await state(() => ({
    hand: B.piles.hand.map(h => h.uid),
    bar: !document.getElementById('custChoose').hidden
  }));
  const gained = handAfter.hand.filter(u => !handBefore.includes(u)).length;
  step('Search: the tapped card joins the hand', gained === 1 && !handAfter.bar, { gained });

  // Keep
  await tapCard(page, `#custHand .card[data-i="${await toolAt('keep')}"]`, slow);
  await sleep(450);
  const keepSlot = await state(() => B.piles.queue.findIndex(h => h.card.util === 'keep'));
  step('Keep: a tap puts it in a slot', keepSlot >= 0, { keepSlot });
  await useTool(page, context, engine, 'keep', steps, '#custChoose:not([hidden])');
  const keepFirst = await state(() => B.piles.hand.findIndex(h => !isDeckTool(h.card)));
  await tapCard(page, `#custHand .card[data-i="${keepFirst}"]`, slow);
  await sleep(150);
  const kept = await state(() => document.querySelectorAll('#custHand .keepsel').length);
  step('Keep: a tapped card is marked to keep', kept === 1, { kept });
  await shot('keep');
  await tap(page, '#chooseOk');
  await sleep(250);
  const keepDone = await state(() => ({
    bar: !document.getElementById('custChoose').hidden,
    used: !B.piles.queue.some(h => h.card.util === 'keep') && !B.piles.hand.some(h => h.card.util === 'keep')
  }));
  step('Keep: Done uses it and closes the bar', !keepDone.bar && keepDone.used, keepDone);

  await tap(page, '#btnFight');
  await page.waitForSelector('#custom.on', { state: 'hidden' });
  step('Fight! returns to the battle', await state(() => B.phase === 'fight'));
  if (slow.length) steps.push({ name: 'slow taps retried', ok: true, skipped: true, detail: slow });
  return steps;
}

async function run(out = process.argv[2] || 'playtest-battle-ui-results') {
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  let host, browser, engine;
  try {
    host = await R.serve();
    ({ browser, engine } = await R.launch());
    for (const device of MATRIX) {
      let session,
        steps = [],
        error = null;
      try {
        session = await R.openPage(browser, host.url, {
          viewport: { width: device.width, height: device.height },
          hasTouch: true,
          isMobile: true,
          deviceScaleFactor: 1
        });
        const page = session.page;
        await page.evaluate(lefty => {
          try {
            localStorage.setItem('hexmancers-fireside', lefty ? 'right' : 'left');
            localStorage.setItem('hexmancers-instside', lefty ? 'left' : 'right');
          } catch (e) {}
        }, !!device.lefty);
        await page.reload();
        await page.waitForFunction(() => typeof fight === 'function' && typeof save !== 'undefined');
        const shot = name => page.screenshot({ path: path.join(out, device.name + '-' + name + '.png') });
        await scenario(page, session.context, device, engine, shot, steps);
      } catch (e) {
        error = e.message;
        if (session)
          await session.page
            .screenshot({ path: path.join(out, device.name + '-failure.png') })
            .catch(() => {});
      } finally {
        if (session) await session.context.close();
      }
      const failed = !!error || !!session?.errors.length;
      results.push({
        device,
        engine,
        status: failed ? 'failed' : 'completed',
        error,
        pageErrors: session?.errors || [],
        steps
      });
      console.log(
        (failed ? 'FAIL ' : 'ok   ') + device.name,
        error || '',
        session?.errors.length ? session.errors.slice(0, 3) : ''
      );
      if (failed) process.exitCode = 1;
      fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify({ engine, browserVersion: browser.version(), results }, null, 2)
      );
    }
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      if (host) await host.close();
    }
  }
  return results;
}

module.exports = { run, MATRIX, hudAudit };
if (require.main === module)
  run().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
