// node tools/dungeon-floor-veil-test.js — changing floors happens in the dark
// Building a floor and drawing its first frame (its shaders compiled, its textures uploaded) holds the page a second
// or more. It used to freeze the old floor mid-step and then jump. The stairs now fade to black during their wait, the
// floor is built and drawn under it, and the fade back in starts only once the new floor has drawn a frame.
const Lab = require('./playtest/dungeon-lab.js');
(async () => {
  const lab = await Lab.open({}),
    check = Lab.checker('dungeon-floor-veil-test');
  await lab.enter(1, 2);
  const run = name => lab.page.evaluate(name => {
    DPROF.toRoom(); DPROF.settle(5);
    // frames stepped by hand (the lab turns them off), and the stairs' wait caught so it can be run when wanted
    let Q = []; window.requestAnimationFrame = f => { Q.push(f); return Q.length; };
    const frame = () => { const q = Q; Q = []; for (const f of q) f(performance.now()); };
    const st = setTimeout; let cb; window.setTimeout = (f, ms) => { if (ms >= 400 && ms <= 600 && !cb) { cb = f; return 0; } return st(f, ms); };
    const veil = document.getElementById('fadeVeil'), op = () => +veil.style.opacity;
    veilTo.n = (veilTo.n || 0) + 1; veil.style.opacity = '0';   // clear to start with (the lab never ran the opening fade)
    let draws = 0; const realDraw = window.xDraw; window.xDraw = function () { draws++; return realDraw.apply(this, arguments); };
    const out = {};
    try {
      if (name === 'down') { EX.groups = EX.groups.filter(g => !g.boss); EX.routeOk = {}; xStairsDown(); }
      else { EX.busy = false; EX.pc = EX.up; xStairsUp(); }
      window.setTimeout = st;
      for (let k = 0; k < 4; k++) frame();
      out.blackBefore = op(); out.caught = !!cb; const d0 = EX.depth;
      if (cb) cb();
      out.changed = EX.depth !== d0; out.blackAfterBuild = op(); draws = 0;
      // step frames until the fade back in begins; note how many new-floor frames were drawn by then
      out.drawsAtFadeIn = -1;
      for (let k = 0; k < 12; k++) { frame(); if (op() < 1) { out.drawsAtFadeIn = draws; break; } }
      out.final = op();
    } finally { window.setTimeout = st; window.xDraw = realDraw; window.requestAnimationFrame = () => 0; }
    return out;
  }, name);
  for (const name of ['down', 'up']) {
    const r = await run(name);
    check(r.caught && r.changed, name + ': the stairs change floors', JSON.stringify(r));
    check(r.blackBefore === 1, name + ': the screen is black before the floor is built', r.blackBefore);
    check(r.blackAfterBuild === 1, name + ': and still black once it is built', r.blackAfterBuild);
    check(r.drawsAtFadeIn >= 1, name + ': the fade back in starts only after the new floor has drawn', r.drawsAtFadeIn);
    check(r.final === 0, name + ': and the screen ends clear', r.final);
  }
  check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
