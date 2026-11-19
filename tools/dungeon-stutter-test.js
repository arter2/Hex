// node tools/dungeon-stutter-test.js [depth ...] — no stutter while you play
// A frame that hitches on a phone almost always does one of a few things: it links a shader program (a material seen
// for the first time), uploads a texture, rebuilds the floor, runs a long stretch of script or makes a pile of garbage
// for the collector. The test browser draws in software, so its frame times say nothing about a phone; what it can
// count exactly is those causes. Each area: walk the hero, really walking (the game's own path and movement on a fixed
// 60 fps clock), from room to room across the whole floor, then take the stairs, and count every cause. Harsh limits:
//   - walking: no program linked, no texture uploaded, no floor rebuilt, once the first room has been drawn
//   - script per frame (the game's own code, the drawing left out): the slowest frame and the 99th percentile
//   - garbage: KB a frame over the walk
//   - the stairs: the new floor's programs and uploads all happen in the dark, none after the fade back in begins
const Lab = require('./playtest/dungeon-lab.js');
const DEPTHS = process.argv.slice(2).map(Number).filter(Boolean);
const AREAS = DEPTHS.length ? DEPTHS : [1, 5, 9, 13, 17, 21];   // one floor of each area
const LIMIT = { scriptMax: 20, scriptP99: 8, kbPerFrame: 40, rooms: 4 };   // ms on this machine (a phone is a few times slower); KB a frame
(async () => {
  const check = Lab.checker('dungeon-stutter-test');
  for (const depth of AREAS) {
    const lab = await Lab.open({});
    const info = await lab.enter(depth, 2);
    const r = await lab.page.evaluate(lim => {
      const out = { area: EX.area.id, rooms: 0, jumps: 0, frames: 0 };
      DPROF.toRoom(); EX.groups = []; for (const t of EX.traps || []) t.armed = false;   // nothing to fight or trip over
      DPROF.settle(30);   // the first room drawn: its programs and textures are in
      // count the causes of a hitch
      const gl = X3.renderer.getContext(), C = { link: 0, up: 0, upKB: 0, build: 0 };
      const wrap = (o, k, f) => { const real = o[k].bind(o); o[k] = function () { f(arguments); return real.apply(null, arguments); }; return () => (o[k] = real); };
      const undo = [wrap(gl, 'linkProgram', () => C.link++), wrap(gl, 'texImage2D', a => { C.up++; const w = a.length >= 9 ? a[3] * a[4] : (a[5] && a[5].width * a[5].height) || 0; C.upKB += w * 4 / 1024; }), wrap(gl, 'texSubImage2D', () => C.up++)];
      const realBuild = window.xBuildScene; window.xBuildScene = function () { C.build++; return realBuild.apply(this, arguments); };
      // the game's own script a frame: the frame's time less the drawing's
      const realRender = window.xRender; let rt = 0; window.xRender = function () { const t = performance.now(); const v = realRender.apply(this, arguments); rt += performance.now() - t; return v; };
      const script = [];
      const frame = () => { rt = 0; const t = performance.now(); DPROF.settle(1); script.push(performance.now() - t - rt); out.frames++; };
      // room to room: the game's path to each room's middle, walked; a room it knows no way to yet is stood in
      const rooms = EX.rooms.filter(r => !r.nook);
      for (const r of rooms) {
        let goal = -1;
        for (let y = r.y; y < r.y + r.h && goal < 0; y++) for (let x = r.x; x < r.x + r.w; x++) { const c = xi(x, y); if (EX.t[c] === T_FLOOR && !EX.propAt.has(c) && c !== EX.down && c !== EX.up) { goal = c; break; } }
        if (goal < 0) continue;
        const path = goal === EX.pc ? [] : xPathToCell(goal);
        if (path && path.length) { EX.path = path; EX.goal = { cell: goal, x: xw(goal), z: xz(goal) }; for (let k = 0; k < 900 && EX.path.length; k++) frame(); }
        else { DPROF.stand(goal); out.jumps++; frame(); }
        out.rooms++;
      }
      for (let k = 0; k < 30; k++) frame();
      out.walk = Object.assign({}, C);
      window.xBuildScene = realBuild; window.xRender = realRender; for (const u of undo) u();
      const s = script.slice().sort((a, b) => a - b); out.scriptMax = +s[s.length - 1].toFixed(2); out.scriptP99 = +s[Math.floor(s.length * .99)].toFixed(2); out.scriptMed = +s[s.length >> 1].toFixed(2);
      return out;
    }, LIMIT);
    // garbage over a walk of the same floor's first room, sampled by the heap profiler
    const g = await lab.allocations(() => { DPROF.toRoom(); for (let k = 0; k < 300; k++) DPROF.settle(1); });
    const kbf = +(g.kb / 300).toFixed(1);
    // the stairs: everything the new floor needs happens while the screen is dark
    const st = await lab.page.evaluate(() => {
      DPROF.toRoom(); EX.groups = []; EX.routeOk = {}; DPROF.settle(5);
      let Q = []; window.requestAnimationFrame = f => { Q.push(f); return Q.length; }; const step = () => { const q = Q; Q = []; for (const f of q) f(performance.now()); };
      const real = setTimeout; let cb; window.setTimeout = (f, ms) => { if (ms >= 400 && ms <= 600 && !cb) { cb = f; return 0; } return real(f, ms); };
      const veil = document.getElementById('fadeVeil'); veil.style.opacity = '0';
      const gl = X3.renderer.getContext(); let link = 0, up = 0; const rl = gl.linkProgram.bind(gl), rt2 = gl.texImage2D.bind(gl);
      gl.linkProgram = p => { link++; return rl(p); }; gl.texImage2D = function () { up++; return rt2.apply(null, arguments); };
      const out = {};
      try { xStairsDown(); window.setTimeout = real; for (let k = 0; k < 4; k++) step(); if (cb) cb();
        out.dark = { link, up }; link = 0; up = 0; let started = false;
        for (let k = 0; k < 90; k++) { step(); DPROF.settle(1); if (!started && +veil.style.opacity < 1) { started = true; link = 0; up = 0; } }
        out.afterFade = { link, up, started }; }
      finally { window.setTimeout = real; gl.linkProgram = rl; gl.texImage2D = rt2; window.requestAnimationFrame = () => 0; }
      return out; });
    await lab.close();
    const tag = 'depth ' + depth + ' (' + r.area + ')';
    console.log(tag + ': ' + r.rooms + ' rooms walked (' + r.jumps + ' stood in), ' + r.frames + ' frames; script median ' + r.scriptMed + ' ms, p99 ' + r.scriptP99 + ', max ' + r.scriptMax + '; ' + kbf + ' KB a frame; stairs ' + JSON.stringify(st));
    check(r.rooms >= Math.min(LIMIT.rooms, r.rooms + r.jumps) && r.frames > 200, tag + ': walked the floor', r.rooms + ' rooms ' + r.frames + ' frames');
    check(r.walk.link === 0, tag + ': walking links no shader program', r.walk.link);
    check(r.walk.up === 0, tag + ': walking uploads no texture', r.walk.up + ' uploads, ' + Math.round(r.walk.upKB) + ' KB');
    check(r.walk.build === 0, tag + ': walking never rebuilds the floor', r.walk.build);
    check(r.scriptP99 <= LIMIT.scriptP99, tag + ': 99% of frames run their script in ' + LIMIT.scriptP99 + ' ms', r.scriptP99);
    check(r.scriptMax <= LIMIT.scriptMax, tag + ': no frame runs its script over ' + LIMIT.scriptMax + ' ms', r.scriptMax);
    check(kbf <= LIMIT.kbPerFrame, tag + ': under ' + LIMIT.kbPerFrame + ' KB of garbage a frame', kbf + ' KB; top: ' + JSON.stringify(g.top.slice(0, 4)));
    check(st.afterFade && st.afterFade.started, tag + ': the stairs fade back in', JSON.stringify(st));
    check(st.afterFade && st.afterFade.link === 0 && st.afterFade.up === 0, tag + ': nothing is linked or uploaded once the new floor shows', JSON.stringify(st.afterFade));
    check(!lab.errors.length, tag + ': no page errors', lab.errors.slice(0, 3).join(' | '));
  }
  check.done();
})().catch(e => { console.error(e); process.exit(1); });
