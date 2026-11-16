// node tools/dungeon-stairs-test.js — going down the stairs without the stall
// Leaving a floor used to free every material at once, which deleted their shader programs; the next floor then
// built the same programs again (about a second on a phone, more on the GPU's first frame). The old floor is now freed
// after the new one has drawn, and only what the new floor does not use. This checks that a floor of the same area
// links almost no new shader programs, that nothing of the old floor is left in memory once the new one is up, and
// that the rest of the old floor is freed once the new one is up.
const Lab = require('./playtest/dungeon-lab.js');
(async () => {
  const lab = await Lab.open({}),
    check = Lab.checker('dungeon-stairs-test');
  await lab.enter(1, 2);
  const r = await lab.page.evaluate(() => {
    DPROF.toRoom();
    DPROF.settle(20);
    const gl = X3.renderer.getContext(), real = gl.linkProgram.bind(gl);
    let links = 0;
    gl.linkProgram = p => { links++; return real(p); };
    const st = setTimeout;
    // the stairs wait about half a second before the floor changes; run that at once
    const go = fn => { let cb; window.setTimeout = (f, ms) => { if (ms >= 400 && ms <= 600 && !cb) { cb = f; return 0; } return st(f, ms); }; fn(); window.setTimeout = st; if (cb) cb(); };
    const out = { area1: EX.area.id };
    // every geometry, material and texture of the floor being left, and which of them get disposed
    const disposed = new Set(), parts = grp => typeof xGroupParts === 'function' ? xGroupParts(grp, new Set()) : new Set();
    for (const C of [THREE.BufferGeometry, THREE.Material, THREE.Texture]) { const d = C.prototype.dispose; C.prototype.dispose = function () { disposed.add(this); return d.apply(this, arguments); }; }
    const leave = () => { const old = new Set(); X3.group.traverse(o => { if (o.geometry) old.add(o.geometry); for (const m of [].concat(o.material || [])) { old.add(m); if (m.map) old.add(m.map); } }); return old; };
    const check = old => { const keep = parts(X3.group); let left = 0; for (const x of old) if (!keep.has(x) && !disposed.has(x)) left++; return left; };
    EX.groups = EX.groups.filter(g => !g.boss); EX.routeOk = {};
    let old = leave(); links = 0; go(xStairsDown);
    out.heldUntilDrawn = !X3.oldGroup ? -1 : [...old].filter(x => disposed.has(x)).length;
    DPROF.settle(3);
    out.area2 = EX.area.id; out.links = links; out.left = check(old); out.oldFreed = !X3.oldGroup;
    // up to depth 1 (kept as it was) and down again
    EX.busy = false; EX.pc = EX.up; old = leave(); disposed.clear(); go(xStairsUp); DPROF.settle(3);
    out.depthUp = EX.depth; out.leftUp = check(old);
    return out;
  });
  check(r.area1 === r.area2, 'depths 1 and 2 are the same area', r.area1 + ' ' + r.area2);
  check(r.links <= 4, 'a floor of the same area links almost no new shader programs', r.links);
  check(r.heldUntilDrawn === 0, 'the old floor is kept until the new one has drawn');
  check(r.oldFreed && r.left === 0, 'then everything of it the new floor does not use is freed', r.left);
  check(r.depthUp === 1 && r.leftUp === 0, 'the same climbing back up to a kept floor', r.depthUp + ' ' + r.leftUp);
  check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
