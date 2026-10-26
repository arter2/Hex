// node tools/playtest/save-torture.js [out.json] — what happens to your save when things go wrong (dev tool)
// Real page, real timers, real reloads. Each scenario reports what was kept, what was lost, and any page errors:
//   reload mid-dungeon · reload mid-fight · a corrupted save · two tabs on one save · storage full · an old, sparse save
const Runner = require('./runner-common.js');
let host, browser;
const fs = require('fs'),
  path = require('path');
const KEY = 'hexmancers-deck-v4';
(async () => {
  host = await Runner.serve();
  const { browser: br } = await Runner.launch();
  browser = br;
  const ctx = await br.newContext({ viewport: { width: 400, height: 800 } });
  const out = [];
  const errs = [];
  const open = async () => {
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(host.url);
    await pg.waitForFunction(() => typeof enterExplore === 'function' && typeof openCamp === 'function');
    return pg;
  };
  const sum = pg =>
    pg.evaluate(() =>
      save
        ? {
            gold: save.gold,
            level: save.level,
            xp: save.xp || 0,
            cards: Object.values(save.owned || {}).reduce((a, b) => a + b, 0),
            deepest: save.deepest,
            screen: [...document.querySelectorAll('.screen.on,.overlay.on')].map(e => e.id).join(',')
          }
        : {
            none: true,
            screen: [...document.querySelectorAll('.screen.on,.overlay.on')].map(e => e.id).join(',')
          }
    );
  const stored = pg =>
    pg.evaluate(k => {
      try {
        const s = JSON.parse(localStorage.getItem(k));
        return s
          ? {
              gold: s.gold,
              level: s.level,
              xp: s.xp || 0,
              cards: Object.values(s.owned || {}).reduce((a, b) => a + b, 0),
              deepest: s.deepest
            }
          : null;
      } catch (e) {
        return { unreadable: true };
      }
    }, KEY);
  const fresh = async pg => {
    await pg.evaluate(() => {
      localStorage.clear();
      save = newSave(STARTERS[0]);
      save.char = lockChar(newChar('human', 0));
      save.gold = 500;
      persist();
      openCamp();
    });
  };
  const run = async (name, fn) => {
    const e0 = errs.length;
    let r;
    try {
      r = await fn();
    } catch (e) {
      r = { ok: false, note: 'script error: ' + e.message };
    }
    r.name = name;
    r.pageErrors = errs.slice(e0, e0 + 3);
    if (r.pageErrors.length) r.ok = false;
    out.push(r);
    console.log(
      (r.ok ? 'ok  ' : 'FAIL') +
        ' ' +
        name +
        ' — ' +
        r.note +
        (r.pageErrors.length ? ' · errors: ' + r.pageErrors.join(' | ') : '')
    );
  };
  const pg = await open();

  await run('reload mid-dungeon', async () => {
    await fresh(pg);
    const got = await pg.evaluate(() => {
      enterExplore(2);
      EX.groups = [];
      let n = 0;
      for (const ch of EX.chests.slice(0, 3)) {
        if (ch.trap) ch.trap = null;
        xOpenChest(ch);
        n++;
      }
      return n;
    });
    await pg.waitForTimeout(500);
    const mem = await sum(pg);
    await pg.reload();
    await pg.waitForTimeout(1200);
    const back = await sum(pg);
    const lost = { gold: mem.gold - back.gold, cards: mem.cards - back.cards, xp: mem.xp - back.xp };
    return {
      ok: !back.none && lost.gold <= 0 && lost.cards <= 0 && lost.xp <= 0,
      note:
        'opened ' +
        got +
        ' chests; a refresh lost ' +
        lost.gold +
        ' gold, ' +
        lost.cards +
        ' cards, ' +
        lost.xp +
        ' xp; back on ' +
        back.screen,
      mem,
      back
    };
  });

  await run('reload mid-fight', async () => {
    await fresh(pg);
    const before = await sum(pg);
    await pg.evaluate(() => {
      fight(3);
      closeCustomScreen();
    });
    await pg.waitForTimeout(3000);
    await pg.reload();
    await pg.waitForTimeout(1200);
    const back = await sum(pg);
    return {
      ok: !back.none && back.gold === before.gold && back.cards === before.cards,
      note:
        'gold ' +
        before.gold +
        '→' +
        back.gold +
        ', cards ' +
        before.cards +
        '→' +
        back.cards +
        '; back on ' +
        back.screen
    };
  });

  await run('corrupted save', async () => {
    await fresh(pg);
    const raw = await pg.evaluate(k => localStorage.getItem(k), KEY);
    await pg.evaluate(([k, r]) => localStorage.setItem(k, r.slice(0, Math.floor(r.length / 2))), [KEY, raw]);
    await pg.reload();
    await pg.waitForTimeout(1500);
    const s = await sum(pg);
    const half = raw.slice(0, Math.floor(raw.length / 2)),
      kept = await pg.evaluate(
        ([k, h]) =>
          localStorage.getItem(k) === h ||
          Object.keys(localStorage).some(x => x.startsWith(k + '-damaged-') && localStorage.getItem(x) === h),
        [KEY, half]
      );
    const told = await pg.evaluate(() =>
      /save|corrupt|damaged|could not/i.test(($('#tip') || {}).textContent || '')
    );
    return {
      ok: kept && told,
      note:
        (s.none ? 'no save loaded' : 'a save loaded') +
        ', opened ' +
        s.screen +
        '; the damaged save ' +
        (kept ? 'is kept in storage' : 'was overwritten') +
        '; the player ' +
        (told ? 'was told' : 'was not told')
    };
  });

  await run('two tabs on one save', async () => {
    await fresh(pg);
    const pg2 = await open();
    await pg2.evaluate(() => openCamp());
    await pg.evaluate(() => {
      save.gold += 1000;
      persist();
    });
    const a = await stored(pg);
    await pg2.evaluate(() => {
      persist();
    });
    const b = await stored(pg);
    await pg2.close();
    return {
      ok: b.gold === a.gold,
      note:
        'tab A earned 1000 gold (stored ' +
        a.gold +
        '); the older tab B saved afterwards: stored gold now ' +
        b.gold +
        (b.gold < a.gold ? " (tab A's gold is lost)" : '')
    };
  });

  await run('storage full', async () => {
    await fresh(pg);
    const before = await stored(pg);
    const r = await pg.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      };
      let crashed = null;
      try {
        save.gold += 250;
        persist();
      } catch (e) {
        crashed = e.message;
      }
      const told = /save|storage|space/i.test(($('#tip') || {}).textContent || '');
      Storage.prototype.setItem = set;
      return { crashed, told };
    });
    const after = await stored(pg);
    return {
      ok: !r.crashed && r.told,
      note:
        (r.crashed ? 'the game threw: ' + r.crashed : 'the game kept running') +
        '; stored gold ' +
        before.gold +
        '→' +
        after.gold +
        ' (the 250 was not saved); the player ' +
        (r.told ? 'was told' : 'was not told')
    };
  });

  await run('old, sparse save', async () => {
    await pg.evaluate(k => {
      localStorage.clear();
      const owned = {};
      for (const id of Object.keys(CARDS)
        .filter(i => CARDS[i].rarity === 'common')
        .slice(0, 24))
        owned[id] = 2;
      localStorage.setItem(
        k,
        JSON.stringify({
          v: 1,
          gold: 50,
          depth: 1,
          deepest: 3,
          owned,
          seen: {},
          decks: [
            {
              name: 'old',
              list: Object.keys(owned)
                .flatMap(i => [i, i])
                .slice(0, 40)
            }
          ],
          active: 0,
          wins: 3
        })
      );
    }, KEY);
    await pg.reload();
    await pg.waitForTimeout(1200);
    const s = await sum(pg);
    const r = await pg.evaluate(() => {
      const steps = [];
      try {
        openCamp();
        steps.push('camp');
        if (!save.char) {
          steps.push('no character: asks for one');
          return steps;
        }
        enterExplore(1);
        steps.push(EX ? 'dungeon' : 'no dungeon (' + ($('#tip').textContent || '') + ')');
        stopExplore();
      } catch (e) {
        steps.push('threw: ' + e.message);
      }
      return steps;
    });
    return {
      ok: !s.none && !r.some(x => /threw/.test(x)),
      note: (s.none ? 'did not load' : 'loaded') + '; ' + r.join(' → ')
    };
  });

  const file = process.argv[2];
  if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1));
  if (out.some(r => !r.ok)) process.exitCode = 1;
  console.log(out.filter(r => r.ok).length + '/' + out.length + ' fine');
})()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (browser) await browser.close();
    } finally {
      if (host) await host.close();
    }
  });
