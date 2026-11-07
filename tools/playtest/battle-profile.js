// node tools/playtest/battle-profile.js [seconds=20] [out.json] — battle frame cost under real play (dev tool)
// Starts real fights in the browser and plays them from inside the page (queues the hand, casts, fires the wand,
// keeps the player alive, restarts a fight that ends), then samples only frames drawn while a fight is running:
// frame interval, the JS time of the flat 2D overlay and of the 3D arena (render() calls arenaDraw() last, so the
// overlay is render() minus arenaDraw()), WebGL draw calls and triangles, scene size and lights.
// Each scenario runs twice: with auto quality on (what a player gets: it steps the pixel ratio and spell lights
// down on a slow frame) and pinned to its top step (pixel ratio 2, 4 spell lights), so the heaviest look is seen.
// The test browser draws with a software GPU, so frame times are slow: compare runs, not the number. Draw calls,
// triangles, lights and programs do not depend on the GPU.
'use strict';
const fs = require('fs');
const Runner = require('./runner-common.js');
const SECONDS = +(process.argv[2] || 20),
  OUT = process.argv[3];
const WARM_MS = 4000;
const SCENARIOS = [
  { name: 'phone-dpr2-depth1', w: 390, h: 844, dpr: 2, depth: 1 },
  { name: 'phone-dpr2-depth10', w: 390, h: 844, dpr: 2, depth: 10 },
  { name: 'tablet-landscape-dpr1-depth1', w: 1180, h: 820, dpr: 1, depth: 1 }
];

(async () => {
  const host = await Runner.serve();
  const { browser } = await Runner.launch({ preciseMemory: true });
  const results = [];
  for (const s of SCENARIOS) {
    for (const autoQ of [true, false]) {
      const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr });
      const pg = await ctx.newPage();
      const errs = [];
      pg.on('pageerror', e => errs.push(e.message));
      await pg.goto(host.url);
      await pg.waitForFunction(() => typeof startBattle === 'function' && typeof newSave === 'function');
      await pg.evaluate(
        ({ depth, autoQ }) => {
          localStorage.clear();
          save = newSave(STARTERS[0]);
          save.char = lockChar(newChar('human', 0));
          save.deepest = Math.max(1, depth);
          save.gold = 5000;
          persist();
          XLIT.autoQ = autoQ;
          show('scrBattle');
          prev = performance.now();
          window.PF_DEPTH = depth;
          startBattle(activeDeck().list, depth, { onEnd: () => {} }, {});
          // The player: queue the hand on the custom screen, then Fight!; in a fight cast and fire; restart a finished fight.
          let tick = 0;
          window.PF_DRIVER = setInterval(() => {
            if (typeof B === 'undefined' || !B) return;
            tick++;
            if (B.phase === 'custom') {
              const pl = B.piles;
              if (!pl.hand.length) drawCards(pl, 5);
              while (pl.queue.length < slotsOf(pl) && pl.hand.length) pl.queue.push(pl.hand.shift());
              closeCustomScreen();
            } else if (B.phase === 'fight') {
              B.player.hp = B.player.maxHp;
              if (!B.piles.queue.length) {
                // queue spent: fill the Spell gauge and open the hand screen, as the Spell button does
                B.gauge = GAUGE_MAX;
                openCustomScreen();
              } else {
                castCard();
                if (tick % 3 === 0) fireWand(false);
              }
            } else if (B.phase === 'win' || B.phase === 'lose') {
              window.PF_RESTARTS = (window.PF_RESTARTS || 0) + 1;
              startBattle(activeDeck().list, window.PF_DEPTH, { onEnd: () => {} }, {});
            }
          }, 400);
        },
        { depth: s.depth, autoQ }
      );

      // instrument: only frames drawn while a fight is running count
      await pg.evaluate(() => {
        window.PF = { frames: [], renderMs: [], arenaMs: [], draw: [], tri: [], spellLit: [], last: performance.now(), arenaThis: 0 };
        const inFight = () => typeof B !== 'undefined' && B && B.phase === 'fight';
        const rd = window.render,
          ad = window.arenaDraw,
          pc = window.playCard;
        PF.casts = 0;
        window.playCard = function (...a) {
          if (inFight()) PF.casts++;
          return pc.apply(this, a);
        };
        window.arenaDraw = function (...a) {
          const t = performance.now();
          const r = ad.apply(this, a);
          PF.arenaThis = performance.now() - t;
          return r;
        };
        window.render = function (...a) {
          PF.arenaThis = 0;
          const t = performance.now();
          const r = rd.apply(this, a);
          if (inFight()) {
            const total = performance.now() - t;
            PF.renderMs.push(total - PF.arenaThis); // the flat overlay alone
            PF.arenaMs.push(PF.arenaThis);
          }
          return r;
        };
        const tick = t => {
          const dt = t - PF.last;
          PF.last = t;
          if (inFight()) {
            PF.frames.push(dt);
            const A = typeof AR !== 'undefined' ? AR : null;
            if (A && A.renderer) {
              PF.draw.push(A.renderer.info.render.calls);
              PF.tri.push(A.renderer.info.render.triangles);
              PF.spellLit.push((A.spell || []).filter(l => l.intensity > 0.001).length);
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await pg.waitForTimeout(WARM_MS);
      await pg.evaluate(() => {
        for (const k of ['frames', 'renderMs', 'arenaMs', 'draw', 'tri', 'spellLit']) PF[k] = [];
        PF.casts = 0;
      });
      await pg.waitForTimeout(SECONDS * 1000);

      const r = await pg.evaluate(() => {
        const q = arr => {
          const f = arr.slice().sort((a, b) => a - b);
          const p = x => (f.length ? +f[Math.min(f.length - 1, Math.floor(f.length * x))].toFixed(2) : null);
          return { n: f.length, p50: p(0.5), p95: p(0.95), p99: p(0.99), max: p(1) };
        };
        const A = typeof AR !== 'undefined' ? AR : null;
        const sc = { meshes: 0, instanced: 0, lights: 0, lightTypes: {}, mats: new Set() };
        if (A && A.scene)
          A.scene.traverse(o => {
            if (o.isMesh) {
              sc.meshes++;
              if (o.isInstancedMesh) sc.instanced++;
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m && sc.mats.add(m.uuid));
            }
            if (o.isLight) {
              sc.lights++;
              sc.lightTypes[o.type] = (sc.lightTypes[o.type] || 0) + 1;
            }
          });
        const info = A && A.renderer ? A.renderer.info : null;
        const secs = PF.frames.reduce((a, b) => a + b, 0) / 1000;
        const lit = PF.spellLit;
        return {
          fps: secs ? +(PF.frames.length / secs).toFixed(1) : null,
          frameMs: q(PF.frames),
          overlay2dMs: q(PF.renderMs),
          arena3dMs: q(PF.arenaMs),
          drawCalls: q(PF.draw),
          triangles: q(PF.tri),
          casts: PF.casts,
          restarts: window.PF_RESTARTS || 0,
          spellLightsLit: { framesWithAny: lit.filter(x => x > 0).length, max: lit.length ? Math.max(...lit) : 0 },
          scene: { meshes: sc.meshes, instanced: sc.instanced, lights: sc.lights, lightTypes: sc.lightTypes, materials: sc.mats.size },
          gl: info ? { programs: info.programs.length, geometries: info.memory.geometries, textures: info.memory.textures } : null,
          pixelRatio: A && A.renderer ? A.renderer.getPixelRatio() : null,
          canvas3d: A && A.renderer ? [A.renderer.domElement.width, A.renderer.domElement.height] : null,
          heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null
        };
      });
      results.push({ scenario: s.name, autoQuality: autoQ, ...r, pageErrors: errs.length, firstErrors: errs.slice(0, 3) });
      console.error('done', s.name, autoQ ? 'autoQ' : 'pinned');
      await ctx.close();
    }
  }
  await browser.close();
  await host.close();

  const pad = (v, n) => String(v ?? '-').padEnd(n);
  console.log(
    pad('scenario', 30) + pad('quality', 8) + pad('fps', 6) + pad('frame p50/p95', 15) + pad('2D', 6) + pad('3D', 6) +
      pad('draws', 7) + pad('tris', 7) + pad('casts', 6) + pad('lit', 5) + pad('pr', 5)
  );
  for (const r of results)
    console.log(
      pad(r.scenario, 30) + pad(r.autoQuality ? 'auto' : 'pinned', 8) + pad(r.fps, 6) +
        pad(`${r.frameMs.p50}/${r.frameMs.p95}`, 15) + pad(r.overlay2dMs.p50, 6) + pad(r.arena3dMs.p50, 6) +
        pad(r.drawCalls.p50, 7) + pad(r.triangles.p50, 7) + pad(r.casts, 6) + pad(r.spellLightsLit.max, 5) + pad(r.pixelRatio, 5)
    );
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
})().catch(e => {
  console.error('ERR', e.stack || e.message);
  process.exit(1);
});
