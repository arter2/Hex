// node tools/playtest/load-profile.js [seconds=15] [out.json] — what a fresh page load downloads (dev tool)
// Opens the game as a returning player (a starter save in storage), waits for the idle-time art preload to finish
// (it runs at low priority, three requests at a time, after the title is up) and counts every response by kind,
// plus how many card-art thumbnail sheets the starter deck actually needs. Run it before and after a loading change.
'use strict';
const fs = require('fs');
const Runner = require('./runner-common.js');
const SECONDS = +(process.argv[2] || 15),
  OUT = process.argv[3];

(async () => {
  const host = await Runner.serve();
  const { browser } = await Runner.launch();

  // 1. make a starter save in one browser context, then read its storage back
  const c1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p1 = await c1.newPage();
  await p1.goto(host.url);
  await p1.waitForFunction(() => typeof newSave === 'function' && typeof persist === 'function');
  const { entries, deck } = await p1.evaluate(() => {
    localStorage.clear();
    save = newSave(STARTERS[0]);
    save.char = lockChar(newChar('human', 0));
    save.deepest = 1;
    persist();
    const entries = {};
    for (let i = 0; i < localStorage.length; i++) entries[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
    const sheets = new Set();
    const full = new Set();
    for (const id of activeDeck().list) {
      const v = typeof HEX_CARD_ART_VARIANTS !== 'undefined' && HEX_CARD_ART_VARIANTS[id];
      if (v && v.atlas) {
        if (v.atlas.thumb) sheets.add(v.atlas.thumb.url);
        if (v.atlas.full) full.add(v.atlas.full.url);
      }
    }
    const allThumb = new Set(Object.values(HEX_CARD_ART_VARIANTS).map(v => v.atlas && v.atlas.thumb && v.atlas.thumb.url).filter(Boolean));
    return { entries, deck: { cards: activeDeck().list.length, thumbSheetsUsed: sheets.size, fullSheetsUsed: full.size, thumbSheetsTotal: allThumb.size } };
  });
  await c1.close();

  // 2. a fresh context (empty cache) that starts with that save
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await c2.addInitScript(e => {
    for (const k of Object.keys(e)) localStorage.setItem(k, e[k]);
  }, entries);
  const p2 = await c2.newPage();
  const seen = new Map();
  p2.on('response', async r => {
    try {
      seen.set(r.url(), (await r.body()).length);
    } catch (e) {}
  });
  const t0 = Date.now();
  await p2.goto(host.url, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  await p2.waitForTimeout(SECONDS * 1000);

  const kind = u => {
    if (/\/atlas\/.*-thumb\./.test(u)) return 'atlasThumb';
    if (/\/atlas\/.*-full\./.test(u)) return 'atlasFull';
    if (/\.(avif|webp|png|jpe?g|svg)(\?|$)/.test(u)) return 'otherImages';
    if (/\.js(\?|$)/.test(u)) return 'js';
    if (/\.(css|woff2?|ttf)(\?|$)/.test(u)) return 'cssFonts';
    return 'other';
  };
  const by = {};
  let total = 0;
  for (const [u, b] of seen) {
    const k = kind(u);
    by[k] = by[k] || { files: 0, bytes: 0 };
    by[k].files++;
    by[k].bytes += b;
    total += b;
  }
  const mb = b => +(b / 1048576).toFixed(2);
  const res = {
    loadEventMs: loadMs,
    waitedSeconds: SECONDS,
    requests: seen.size,
    totalMB: mb(total),
    byKindMB: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { files: v.files, MB: mb(v.bytes) }])),
    starterDeck: deck
  };
  console.log(JSON.stringify(res, null, 1));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await browser.close();
  await host.close();
})().catch(e => {
  console.error('ERR', e.stack || e.message);
  process.exit(1);
});
