// node tools/dungeon-gfx-test.js — the Graphics setting: High is the full look, Low is the light one, Auto picks
// High: the three full-screen passes (soft shading, blur, vignette), four torch lights, the bevelled wall blocks.
// Low: no full-screen pass (the vignette is drawn by the page instead), two torch lights, sharpness 1, plain wall
// blocks, half the dust and weather. Switching on a floor keeps the run. Auto times the first floor once.
const Lab = require('./playtest/dungeon-lab.js');
const TRI_RATIO = 0.5,
  BASE = require('../docs/test-results/dungeon-profile-v301.json'); // what v301 drew on the same floors
const one = async (gfx, fn, arg, storage) => {
  const lab = await Lab.open({ gfx, storage, dpr: 2, width: 195, height: 422 }); // a sharp phone screen, small enough to draw quickly
  try {
    await lab.enter(9, 2);
    const r = await lab.page.evaluate(fn, arg);
    return { r, errors: lab.errors.slice(), lab };
  } catch (e) {
    await lab.close();
    throw e;
  }
};
// in the page: what the floor costs and how it is set up
function facts() {
  DPROF.toRoom();
  DPROF.settle(20);
  const s = DPROF.stats();
  return Object.assign(s, {
    mode: typeof gfxMode === 'function' ? gfxMode() : null,
    low: typeof gfxLow === 'function' ? gfxLow() : null,
    x3low: X3.low,
    pr: X3.renderer.getPixelRatio(),
    dpr: window.devicePixelRatio,
    vig: document.getElementById('scrExplore').classList.contains('gfx-vig'),
    vigCss: getComputedStyle(document.getElementById('xVig')).backgroundImage.split('radial-gradient').length - 1,
    dust: X3.dust.geometry.attributes.position.count,
    weather: EX.weather ? EX.weather.geometry.attributes.position.count : 0,
    motes: EX.motes ? EX.motes.geometry.attributes.position.count : 0,
    pool: X3.pool.length,
    culled: EX.wms.every(m => m.frustumCulled) && (EX.natM || []).every(m => m.frustumCulled) && !!EX.corMesh.meshes && EX.corMesh.meshes.every(m => m.frustumCulled),
    cullSame: (() => {
      // drawing only the chunks of wall and growth that are on screen changes no pixel
      const T = DPROF.T,
        gl = X3.renderer.getContext(),
        all = EX.wms.concat(EX.natM || [], ...['trimMesh', 'corMesh', 'skirtMesh', 'pillBase', 'pillShaft', 'pillCap'].map(k => (EX[k] && EX[k].meshes) || []));
      const grab = on => {
        for (const m of all) m.frustumCulled = on;
        xDraw(T, 1e-9);
        xDraw(T, 1e-9);
        const px = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px;
      };
      X3.dust.visible = false;
      X3.group.traverse(o => {
        if (o.isPoints) o.visible = false;
      });
      XLIT.flick = 0;
      let worst = 0;
      const spots = [EX.pc, EX.up, EX.down];
      for (const c of spots) {
        DPROF.stand(c);
        for (const m of all) m.frustumCulled = true;
        DPROF.settle(25);
        const a = grab(true),
          b = grab(false);
        let n = 0;
        for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 2 || Math.abs(a[i + 1] - b[i + 1]) > 2 || Math.abs(a[i + 2] - b[i + 2]) > 2) n++;
        worst = Math.max(worst, n);
      }
      for (const m of all) m.frustumCulled = true;
      return worst;
    })()
  });
}
// in the page: triangles drawn standing in a lit room
function tris() {
  DPROF.toRoom();
  DPROF.settle(20);
  return DPROF.stats().tris;
}
// in the page: switch the setting on a live floor and back; the run must be untouched
function live() {
  DPROF.toRoom();
  DPROF.settle(20);
  const doors = () => [...EX.doors.values()].map(d => d.state).join(',');
  const shown = () => {
    let n = 0;
    for (const m of EX.wms) n += m.count;
    return n;
  };
  let seen = 0;
  for (let i = 0; i < EX.seen.length; i++) seen += EX.seen[i];
  const snap = () => JSON.stringify([EX.px, EX.pz, EX.pc, EX.hp, doors(), EX.groups.length, EX.chests.length, EX.depth]);
  const before = snap(),
    walls = shown(),
    trisHigh = DPROF.stats().tris,
    ex = EX;
  const out = { has: typeof xGfxRebuild === 'function' };
  if (!out.has) return out;
  let rebuilds = 0;
  const real = window.xBuildScene;
  window.xBuildScene = function () {
    rebuilds++;
    return real.apply(this, arguments);
  };
  gfxSet('low');
  DPROF.settle(20);
  let seen2 = 0;
  for (let i = 0; i < EX.seen.length; i++) seen2 += EX.seen[i];
  out.low = X3.low === true && EX === ex;
  out.kept = snap() === before && seen2 === seen;
  out.walls = shown() === walls;
  out.rebuilt = rebuilds;
  out.trisLow = DPROF.stats().tris;
  out.passesLow = DPROF.stats().postPasses;
  gfxSet('low'); // the same setting again builds nothing
  out.again = rebuilds;
  gfxSet('high');
  DPROF.settle(20);
  out.high = X3.low === false && snap() === before && shown() === walls;
  out.trisBack = DPROF.stats().tris;
  out.trisHigh = trisHigh;
  out.passesBack = DPROF.stats().postPasses;
  window.xBuildScene = real;
  return out;
}
(async () => {
  const check = Lab.checker('dungeon-gfx-test');
  // ---- High
  const H = await one('high', facts);
  check(H.r.mode === 'high' && H.r.low === false && H.r.x3low === false, 'High: the setting is read', JSON.stringify([H.r.mode, H.r.low, H.r.x3low]));
  check(H.r.postPasses === 3, 'High: three full-screen passes, as before', H.r.postPasses);
  check(H.r.pointLights === 5 && H.r.pool === 4, 'High: your lamp and four torch lights, as before', H.r.pointLights);
  check(H.r.pr === Math.min(H.r.dpr, 2), 'High: sharpness as before', H.r.pr);
  check(H.r.vig === false, 'High: the vignette is drawn in the frame, not by the page');
  // the battle keeps its full-screen passes whatever the dungeon is set to
  const battle = async lab =>
    lab.page.evaluate(() => {
      try {
        stopExplore();
        fight(9, null, { hp: 100, explore: true });
        if (typeof AR === 'undefined' || !AR || !AR.renderer) return 'no battle renderer';
        const r = AR.renderer,
          real = r.render;
        let n = 0;
        r.render = function () {
          n++;
          return real.apply(r, arguments);
        };
        xRender(AR);
        r.render = real;
        return n;
      } catch (e) {
        return 'error: ' + e.message;
      }
    });
  await H.lab.close();
  check(!H.errors.length, 'High: no page errors', H.errors.join(' | '));
  // ---- Low
  const L = await one('low', facts);
  check(L.r.mode === 'low' && L.r.low === true && L.r.x3low === true, 'Low: the setting is read', JSON.stringify([L.r.mode, L.r.low, L.r.x3low]));
  check(L.r.postPasses === 0, 'Low: no full-screen pass', L.r.postPasses);
  check(L.r.pointLights === 3 && L.r.pool === 2, 'Low: your lamp and two torch lights', L.r.pointLights);
  check(L.r.pr <= 1, 'Low: sharpness 1 at most', L.r.pr);
  check(L.r.vig === true && L.r.vigCss >= 2, 'Low: the page draws the vignette', L.r.vig + ' ' + L.r.vigCss);
  const nb = await battle(L.lab);
  check(typeof nb === 'number' && nb > 1, 'Low: a battle still draws its own full-screen passes', nb);
  await L.lab.close();
  check(!L.errors.length, 'Low: no page errors', L.errors.join(' | '));
  // ---- both: what is off screen is not drawn, and that changes nothing you see
  check(H.r.culled, 'walls and growth are drawn only where they are on screen');
  check(H.r.cullSame === 0, 'and the picture is the same as drawing them all', H.r.cullSame + ' pixels differ');
  // ---- Low is lighter to draw: fewer triangles, half the particles
  check(L.r.dust * 2 === H.r.dust && L.r.motes * 2 === H.r.motes && Math.abs(L.r.weather * 2 - H.r.weather) <= 1, 'Low: half the dust, motes and weather', JSON.stringify([L.r.dust, H.r.dust, L.r.motes, H.r.motes, L.r.weather, H.r.weather]));
  for (const depth of [1, 9, 17]) {
    const t = {};
    for (const g of ['high', 'low']) {
      const lab = await Lab.open({ gfx: g });
      await lab.enter(depth, 2);
      t[g] = await lab.page.evaluate(tris);
      check(!lab.errors.length, 'depth ' + depth + ' ' + g + ': no page errors', lab.errors.join(' | '));
      await lab.close();
    }
    const was = BASE.floors.find(f => f.depth === depth && f.layout === 2).tris;
    check(t.high <= 0.6 * was, 'depth ' + depth + ': High draws at most 60% of the triangles v301 drew (only what is on screen)', t.high + ' vs ' + was);
    check(t.low <= TRI_RATIO * was && t.low < t.high, 'depth ' + depth + ': Low draws under half of v301\'s triangles, and fewer than High', t.low + ' vs ' + was + ' (High ' + t.high + ')');
  }
  // ---- switching on a live floor keeps the run
  {
    const S = await one('high', live);
    check(S.r.has, 'a floor can be built again for a new setting');
    if (S.r.has) {
      check(S.r.low && S.r.rebuilt === 1, 'High to Low on a floor: built again once, the same floor', JSON.stringify([S.r.low, S.r.rebuilt]));
      check(S.r.kept, 'where you stand, your HP, doors, enemies and what you have seen are untouched');
      check(S.r.walls, 'every wall you had found is still shown');
      check(S.r.passesLow === 0 && S.r.trisLow < S.r.trisHigh, 'and it is drawn as Low', JSON.stringify([S.r.passesLow, S.r.trisLow, S.r.trisHigh]));
      check(S.r.again === 1, 'choosing the same setting again builds nothing');
      check(S.r.high && S.r.passesBack === 3 && Math.abs(S.r.trisBack - S.r.trisHigh) < 0.03 * S.r.trisHigh, 'back to High: the full look again (triangles within 3%: the furniture is laid out afresh)', JSON.stringify([S.r.high, S.r.passesBack, S.r.trisBack, S.r.trisHigh]));
    }
    await S.lab.close();
    check(!S.errors.length, 'switching: no page errors', S.errors.join(' | '));
  }
  // ---- the classic layout builds and draws on both settings
  for (const g of ['high', 'low']) {
    const lab = await Lab.open({ gfx: g });
    await lab.enter(1, 1);
    const ok = await lab.page.evaluate(() => {
      DPROF.toRoom();
      DPROF.settle(10);
      return EX.layout === 1 && DPROF.stats().calls > 20;
    });
    check(ok && !lab.errors.length, 'the classic layout draws on ' + g, lab.errors.join(' | '));
    await lab.close();
  }
  // ---- junk in storage is Auto, and Auto starts as High
  const J = await one(null, facts, null, { 'hexmancers-gfx': '{bad' });
  check(J.r.mode === 'auto' && J.r.low === false && J.r.postPasses === 3, 'a junk stored setting is Auto, which starts on High', JSON.stringify([J.r.mode, J.r.low, J.r.postPasses]));
  await J.lab.close();
  check(!J.errors.length, 'Auto: no page errors', J.errors.join(' | '));
  check.done([]);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
