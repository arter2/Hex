// node tools/dungeon-gfx-test.js — the Graphics setting: High is the full look, Low is the light one, Auto picks
// High: the three full-screen passes (soft shading, blur, vignette), four torch lights, the bevelled wall blocks.
// Low: no full-screen pass (the vignette is drawn by the page instead), two torch lights, sharpness 1, plain wall
// blocks, half the dust and weather. Switching on a floor keeps the run. Auto times the first floor once.
const Lab = require('./playtest/dungeon-lab.js');
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
    pool: X3.pool.length
  });
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
