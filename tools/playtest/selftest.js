// No browser or npm install required: node tools/playtest/selftest.js
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  assert = require('assert/strict'),
  { createRequire } = require('module');
const U = require('./support.js');
let passed = 0,
  failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('ok  ' + name);
  } catch (e) {
    failed++;
    console.error('FAIL ' + name + '\n' + e.stack);
  }
}
function script(name, args, files = {}) {
  const filename = path.join(__dirname, name),
    lines = [],
    writes = {};
  const realRequire = createRequire(filename),
    fakeFS = {
      readFileSync(f) {
        if (f in files) return files[f];
        return fs.readFileSync(f, 'utf8');
      },
      writeFileSync(f, s) {
        writes[f] = s;
      }
    };
  const context = {
    require: n => (n === 'fs' ? fakeFS : realRequire(n)),
    process: { argv: ['node', filename, ...args], env: {}, exitCode: 0 },
    console: { log: (...a) => lines.push(a.join(' ')), error: (...a) => lines.push(a.join(' ')) },
    __dirname
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return { text: lines.join('\n'), writes, code: context.process.exitCode };
}
function botContext() {
  const ctx = {
    console,
    Math: Object.create(Math),
    XR: () => 0.99,
    TILES: [],
    B: null,
    document: { getElementById: () => ({ classList: { remove() {} } }) },
    slotsOf: () => 3,
    detectCombos: () => [],
    isInstant: () => false,
    gaugeFull: () => false,
    wandOnly: () => true,
    alive: () => [],
    PACE: 0.7
  };
  ctx.window = ctx;
  ctx.fight = () => {
    ctx.randomObserved = ctx.Math.random();
    const hooks = {};
    for (const k of ['onEnd', 'onCustom', 'onFight', 'onCast', 'onHurt', 'onTurn', 'onWave', 'onSoul'])
      hooks[k] = () => {};
    ctx.originalHooks = { ...hooks };
    ctx.lastFight = ctx.B = {
      phase: 'custom',
      time: 0,
      player: { hp: 100, maxHp: 100, tile: { col: 0, r: 0 }, path: [], wandCd: 1, castCd: 1 },
      piles: { queue: [], hand: [], draw: [] },
      teles: [],
      shots: [],
      enemies: [],
      allies: [],
      timers: [],
      waves: [[]],
      wave: 0,
      hooks
    };
  };
  ctx.closeCustomScreen = () => (ctx.B.phase = 'fight');
  ctx.update = dt => {
    ctx.B.time += dt;
    if (ctx.B.time >= 0.1 - 1e-8) ctx.B.phase = 'win';
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'support.js'), 'utf8'), ctx);
  let source = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
  const pos = source.lastIndexOf('})();');
  source =
    source.slice(0, pos) +
    `PT.__test={noticeOf,known,eKey,observeThreats,warnHit,setup(h){HU={cfg:h,rng:()=>.5};SEEN=new Map();ATTACKS=U.perception();WARN_AT=new WeakMap();elapsed=0;},time(t){elapsed=t;}};` +
    source.slice(pos);
  vm.runInContext(source, ctx);
  return ctx;
}
(async () => {
  await test('RNG streams replay, isolate policy from world and preserve seed zero', () => {
    const a = U.rng(0),
      b = U.rng(0),
      c = U.rng(1);
    assert.deepEqual(Array.from({ length: 20 }, a), Array.from({ length: 20 }, b));
    assert.notEqual(U.rng(0)(), c());
    assert.notEqual(U.seedFor('world', 'fire', 1), U.seedFor('policy', 'fire', 1));
  });
  await test('job generators do not reuse scenario seeds at 11 runs per colour', () => {
    for (const name of ['mkcrawl.js', 'mkruns.js']) {
      const args =
        name === 'mkcrawl.js' ? ['out', '11', '1', '24', 'average'] : ['out', '11', '10', '24', 'average'];
      const jobs = JSON.parse(script(name, args).writes.out);
      assert.equal(jobs.length, 66);
      assert.equal(new Set(jobs.map(j => j.seed)).size, 66);
      assert.equal(new Set(jobs.map(j => j.jobId)).size, 66);
      U.assertJobs(jobs);
    }
  });
  await test('matched profiles share world scenarios but not policy seeds', () => {
    const a = U.scenario('good', 'fire', 0),
      b = U.scenario('fast', 'fire', 0);
    assert.equal(a.seed, b.seed);
    assert.notEqual(a.policySeed, b.policySeed);
    assert.notEqual(a.jobId, b.jobId);
  });
  await test('invalid profiles and duplicate job IDs are rejected', () => {
    assert.throws(() => script('mkcrawl.js', ['out', '1', '1', '24', 'missing']));
    assert.throws(
      () =>
        U.assertJobs([
          { seed: 1, jobId: 'x' },
          { seed: 2, jobId: 'x' }
        ]),
      /Duplicate/
    );
  });
  await test('perception resets for idle, restart and new cast identity', () => {
    const p = U.perception(),
      e = {};
    const a = p.sync(e, 'w', true, 0.7);
    assert.equal(p.sync(e, 'w', true, 0.5), a);
    p.sync(e, 'w', false, 0);
    assert.notEqual(p.sync(e, 'w', true, 0.7), a);
    const b = p.sync(e, 'w', true, 0.6);
    assert.notEqual(p.sync(e, 'w', true, 0.7), b);
    const cast = {};
    const c = p.sync(e, 'c', true, 0.8, cast);
    assert.equal(p.sync(e, 'c', true, 0.6, cast), c);
    assert.notEqual(p.sync(e, 'c', true, 0.6, {}), c);
  });
  await test('a 0.5-second human reaction is not shortened by PACE', () => {
    const c = botContext(),
      t = c.PT.__test;
    t.setup({ react: 0.5, reactSd: 0, reactMin: 0.3, notice: 1 });
    const key = {};
    assert.equal(t.noticeOf(key).d, 0.5);
    t.time(0.49);
    assert.equal(t.known(key), false);
    t.time(0.5);
    assert.equal(t.known(key), true);
  });
  await test('repeated attacks receive fresh perception in the real observer', () => {
    const c = botContext(),
      t = c.PT.__test,
      e = { windT: 0.7, casting: null };
    c.B = { teles: [], enemies: [e] };
    t.setup({ react: 0.5, reactSd: 0, reactMin: 0.3, notice: 1 });
    t.observeThreats();
    const first = t.eKey(e, 'w');
    e.windT = 0;
    t.observeThreats();
    e.windT = 0.7;
    t.observeThreats();
    assert.notEqual(first, t.eKey(e, 'w'));
  });
  await test('warning uses observed seconds and unknown threats stay unknown', () => {
    const c = botContext(),
      t = c.PT.__test,
      tile = {},
      tl = { t: 0, dur: 0.35, tiles: [tile] };
    c.B = { time: 99, teles: [tl], enemies: [], shots: [] };
    t.setup({});
    t.observeThreats();
    t.time(0.5);
    tl.t = 0.35;
    const s = { tileT: 0 },
      p = { tile };
    t.warnHit(s, c.B, p, 5);
    assert.equal(s.warn.unfair, 0);
    assert.equal(s.warn.tight, 1);
    c.B.teles = [{ t: 1, dur: 1, tiles: [tile] }];
    t.warnHit(s, c.B, p, 5);
    assert.equal(s.warn.unknown, 1);
  });
  await test('fight integration replays game RNG, restores RNG and all hooks', () => {
    const c = botContext(),
      prev = c.Math.random,
      xr = c.XR;
    const config = { seed: 7, bot: { move: false, instants: false, combos: false } };
    const a = c.PT.runFight(config),
      first = c.randomObserved;
    assert.equal(a.res, 'win');
    assert.equal(a.ticks, 3);
    assert.equal(a.time, 0.1);
    assert.equal(c.Math.random, prev);
    assert.equal(c.XR, xr);
    for (const k in c.originalHooks) assert.equal(c.lastFight.hooks[k], c.originalHooks[k]);
    c.PT.runFight(config);
    assert.equal(c.randomObserved, first);
    c.PT.runFight({ ...config, seed: 8 });
    assert.notEqual(c.randomObserved, first);
    c.fight = () => {
      throw Error('boot failure');
    };
    assert.throws(() => c.PT.runFight(config), /boot failure/);
    assert.equal(c.Math.random, prev);
    assert.equal(c.XR, xr);
  });
  await test('net frustration includes rewards and expires its rolling window', () => {
    assert.equal(
      U.netFrustration(
        [
          { t: 100, fun: 1000 },
          { t: 100, frus: 31 }
        ],
        100
      ),
      0
    );
    assert.equal(
      U.netFrustration(
        [
          { t: 1, fun: 1000 },
          { t: 601, frus: 31 }
        ],
        601
      ),
      31
    );
  });
  await test('actual crawl event accounting offsets frustration with rewards', () => {
    const source = fs.readFileSync(path.join(__dirname, 'crawl.js'), 'utf8'),
      start = source.indexOf('function ev('),
      end = source.indexOf('/* ---------------- watching');
    const c = {
      EX: null,
      R: { T: 100, fun: 0, frus: 0, mood: 0, moodMin: 0, events: [], win10: [], quits: [] },
      P: { patience: 30, hate: {} }
    };
    vm.createContext(c);
    vm.runInContext(
      source.slice(start, end) + "ev('reward',{fun:1000});ev('hurt',{frus:31});moodTick(.05)",
      c
    );
    assert.equal(c.R.quits.length, 0);
    c.R.T = 701;
    vm.runInContext("ev('hurt',{frus:31});moodTick(.05)", c);
    assert.equal(c.R.quits.length, 1);
  });
  await test('fight timeout remains bounded while battle clock is slowed', () => {
    const c = botContext();
    c.update = dt => (c.B.time += dt * 0.08);
    const r = c.PT.runFight({ seed: 0, maxT: 0.1, bot: { move: false, instants: false, combos: false } });
    assert.equal(r.res, 'timeout');
    assert.equal(r.ticks, 3);
    assert.equal(r.time, 0.1);
    assert(r.battleTime < r.time);
  });
  await test('recovery is explicit and strict mode refuses state repair', () => {
    let source = fs.readFileSync(path.join(__dirname, 'crawl.js'), 'utf8');
    source = source.slice(source.indexOf('function recover('), source.indexOf('/* ---------------- fun'));
    let called = 0;
    const c = { R: { mode: 'strict', T: 1, recoveries: [], errors: [] }, repair: () => called++ };
    vm.createContext(c);
    vm.runInContext(source + "recover('timeout','fixture',repair)", c);
    assert.equal(called, 0);
    assert.equal(c.R.errors.length, 1);
    assert.equal(c.R.recoveries[0].applied, false);
    c.R.mode = 'exploratory';
    vm.runInContext("recover('timeout','fixture',repair)", c);
    assert.equal(called, 1);
    assert.equal(c.R.recoveries[1].applied, true);
  });
  await test('reports retain failed and malformed jobs and set failure exit status', () => {
    const good = {
      label: 'average',
      lean: 'fire',
      hours: 1,
      fights: [],
      puzzles: [],
      errors: [],
      pageErrors: [],
      maxDepth: 1,
      deaths: [],
      fun: 0,
      frus: 0,
      quits: [],
      time: {},
      events: [],
      dlgs: {},
      dlgN: 0,
      level: 1,
      startDeck: { avgVal: 1 },
      endDeck: { avgVal: 1 },
      spent: 0,
      gold: 0,
      packs: 0,
      camps: []
    };
    for (const name of ['analyze-crawl.js', 'analyze-skill.js']) {
      const r = script(name, ['fixture'], {
        fixture: JSON.stringify(good) + '\n' + JSON.stringify({ error: 'crashed' }) + '\n{broken'
      });
      assert.equal(r.code, 1);
      assert.match(r.text, /3 requested records: 1 clean, 0 recovery-assisted, 2 failed/);
      assert.match(r.text, /crashed/);
    }
  });
  await test('recovery-assisted results are separate from clean balance data', () => {
    const r = { status: 'recovered', recoveries: [{ kind: 'repair' }] };
    assert.equal(U.usable(r), false);
    assert.deepEqual(U.coverage([r, { error: 'fail' }, {}]), {
      requested: 3,
      clean: 1,
      recovered: 1,
      failed: 1,
      skipped: 0,
      errors: 1
    });
  });
  await test('malformed error arrays are reported instead of crashing analysis', () => {
    assert.deepEqual(U.issues({ errors: 5 }), ['invalid errors field']);
    assert.equal(U.coverage([{ errors: 5 }]).failed, 1);
  });
  await test('runner startup failure writes every requested job and the manifest', async () => {
    const rows = [],
      writes = {},
      jobs = [U.scenario('good', 'fire', 0), U.scenario('good', 'frost', 0)];
    let fail;
    const fakeFS = {
      readFileSync: () => JSON.stringify(jobs),
      existsSync: () => false,
      mkdirSync() {},
      appendFileSync(f, s) {
        rows.push(JSON.parse(s));
      },
      writeFileSync(f, s) {
        writes[f] = JSON.parse(s);
      }
    };
    const filename = path.join(__dirname, 'runner-common.js'),
      realRequire = createRequire(filename),
      c = {
        __dirname,
        module: { exports: {} },
        process: { env: {}, exitCode: 0 },
        console,
        setTimeout,
        clearTimeout,
        require: n =>
          n === 'fs'
            ? fakeFS
            : n === 'http'
              ? {
                  createServer: () => ({
                    once(e, fn) {
                      fail = fn;
                    },
                    listen() {
                      fail(Error('fixture server failure'));
                    }
                  })
                }
              : realRequire(n)
      };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), c);
    const result = await c.module.exports.batch('crawl', ['jobs', 'results']);
    assert.equal(rows.length, 2);
    assert(rows.every(r => r.status === 'failed' && r.error.includes('fixture server failure')));
    assert.equal(result.complete, true);
    assert.equal(writes['results.manifest.json'].requested, 2);
    assert.equal(c.process.exitCode, 1);
  });
  await test('performance rates use elapsed milliseconds, independent of FPS', () => {
    assert.equal(U.perMinute(60, 60000), 60);
    assert.equal(U.perMinute(60, 30000), 120);
    assert.equal(U.perMinute(1, 0), null);
  });
  await test('external job watchdog rejects and invokes context cleanup', async () => {
    const R = require('./runner-common.js');
    let closed = false;
    await assert.rejects(
      R.deadline(
        () => new Promise(() => {}),
        5,
        () => {
          closed = true;
        }
      ),
      /timeout/
    );
    assert.equal(closed, true);
  });
  await test('hit audit catches overlay interception, clipping and disabled controls', async () => {
    let covered = false;
    const rect = { x: 10, y: 10, right: 110, bottom: 60, width: 100, height: 50 },
      el = {
        id: 'target',
        disabled: false,
        textContent: 'Test',
        tagName: 'BUTTON',
        getClientRects: () => [rect],
        getBoundingClientRect: () => rect,
        getAttribute: () => null,
        contains: () => false
      };
    const c = {
      innerWidth: 200,
      innerHeight: 100,
      getComputedStyle: () => ({ visibility: 'visible' }),
      document: {
        querySelector: () => ({ querySelectorAll: () => [el] }),
        elementFromPoint: () => (covered ? { id: 'overlay' } : el)
      }
    };
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'hit-audit.js'), 'utf8'), c);
    assert.equal((await c.PTHitAudit()).failures, 0);
    covered = true;
    assert.equal((await c.PTHitAudit()).failures, 1);
    covered = false;
    rect.x = -60;
    assert.equal((await c.PTHitAudit()).failures, 1);
    el.disabled = true;
    const result = await c.PTHitAudit();
    assert.equal(result.checked, 0);
    assert.equal(result.results[0].skipped, 'disabled');
  });
  await test('hit audit skips hidden and see-through controls, and only warns for an edge under a fixed bar', async () => {
    const rect = { x: 10, y: 10, right: 110, bottom: 60, width: 100, height: 50 };
    let style = { visibility: 'visible', pointerEvents: 'auto', position: 'static' },
      shown = true,
      cover = null;
    const body = {},
      footer = { id: 'footer', parentElement: body, _pos: 'fixed' },
      el = {
        id: 'target',
        disabled: false,
        textContent: 'Test',
        tagName: 'BUTTON',
        getClientRects: () => [rect],
        getBoundingClientRect: () => rect,
        getAttribute: () => null,
        contains: () => false,
        checkVisibility: () => shown
      };
    const c = {
      innerWidth: 200,
      innerHeight: 100,
      getComputedStyle: n => (n === el ? style : { position: n._pos || 'static' }),
      document: {
        body,
        querySelector: () => ({ querySelectorAll: () => [el] }),
        // the centre (60,35) always hits; the bottom edge hits whatever `cover` is
        elementFromPoint: (x, y) => (cover && y > 40 ? cover : el)
      }
    };
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'hit-audit.js'), 'utf8'), c);
    shown = false; // inside a closed <details>
    assert.equal((await c.PTHitAudit()).checked, 0);
    shown = true;
    style = { ...style, pointerEvents: 'none' }; // a decorative card preview
    let r = await c.PTHitAudit();
    assert.equal(r.checked, 0);
    assert.match(r.results[0].skipped, /not tappable/);
    style = { ...style, pointerEvents: 'auto' };
    cover = footer; // a fixed footer over the lower edge: scroll it clear
    r = await c.PTHitAudit();
    assert.equal(r.failures, 0);
    assert.equal(r.warnings, 1);
    cover = { id: 'overlay', parentElement: body }; // an ordinary element over the edge: a real failure
    assert.equal((await c.PTHitAudit()).failures, 1);
  });
  await test('UI navigation refuses an intercepted tap and dispatches real coordinates', async () => {
    const { tap } = require('./ui-runner.js');
    let hit = false,
      coords = null;
    const loc = {
      filter() {
        return this;
      },
      first() {
        return this;
      },
      async scrollIntoViewIfNeeded() {},
      async boundingBox() {
        return { x: 10, y: 10, width: 100, height: 50 };
      },
      async evaluate() {
        return hit;
      }
    };
    const page = {
      locator: () => loc,
      touchscreen: {
        async tap(x, y) {
          coords = [x, y];
        }
      }
    };
    await assert.rejects(tap(page, 'button'), /intercepted/);
    assert.equal(coords, null);
    hit = true;
    await tap(page, 'button');
    assert.deepEqual(coords, [60, 35]);
  });
  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})();
