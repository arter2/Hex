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
const LIMIT = { scriptMax: 20, scriptP99: 8, kbPerFrame: 5, rooms: 4 };   // ms on this machine (a phone is a few times slower); KB a frame (as the frame test: 3000 KB over 600)
(async () => {
  const check = Lab.checker('dungeon-stutter-test');
  for (const depth of AREAS) {
    const lab = await Lab.open({ width: 260, height: 560 });   // (a small window: the test browser draws in software)
    const info = await lab.enter(depth, 2);
    const r = await lab.page.evaluate(lim => {
      const out = { area: EX.area.id, rooms: 0, jumps: 0, frames: 0 };
      DPROF.toRoom(); EX.groups = []; for (const t of EX.traps || []) t.armed = false;   // nothing to fight or trip over
      DPROF.settle(30);   // the first room drawn: its programs and textures are in
      // count the causes of a hitch
      const gl = X3.renderer.getContext(), C = { link: 0, up: 0, upKB: 0, big: 0, build: 0, sizes: {} };
      const wrap = (o, k, f) => { const real = o[k].bind(o); o[k] = function () { f(arguments); return real.apply(null, arguments); }; return () => (o[k] = real); };
      const undo = [wrap(gl, 'linkProgram', () => C.link++), wrap(gl, 'texImage2D', a => { C.up++; const w = a.length >= 9 ? a[3] * a[4] : (a[5] && a[5].width * a[5].height) || 0; C.upKB += w * 4 / 1024; if (w >= 128 * 128) C.big++; C.sizes[w] = (C.sizes[w] || 0) + 1; }), wrap(gl, 'texSubImage2D', () => C.up++)];
      const realBuild = window.xBuildScene; window.xBuildScene = function () { C.build++; return realBuild.apply(this, arguments); };
      // the game's own script a frame: the frame's time less the drawing's
      const realRender = window.xRender; let rt = 0, fn = 0; window.xRender = function () { if (++fn % 6) return; const t = performance.now(); const v = realRender.apply(this, arguments); rt += performance.now() - t; return v; };   // (drawn every 6th frame: what a first draw links or uploads is still caught on the next one)
      const script = [];
      const frame = () => { rt = 0; const t = performance.now(); if (!EX.busy) xMove(1 / 60); DPROF.settle(1); script.push(performance.now() - t - rt); out.frames++; };   // (the game's loop moves you, then draws: xLoop)
      // room to room, really walked: a route of open cells (the game's own path finding only goes where you have been),
      // handed to the game as its path; the hero walks it with the game's own movement. Locked and secret doors are walls.
      const open = c => { if (c < 0 || c >= XN * XN || EX.t[c] === T_ROCK) return false; const d = EX.doors.get(c); if (d && (d.lock || d.state === 'secret')) return false; return !(typeof xSolid === 'function' && xSolid(c)); };
      const route = (from, to) => { const prev = new Int32Array(XN * XN).fill(-1), q = [from]; prev[from] = from;
        for (let h = 0; h < q.length && prev[to] < 0; h++) { const c = q[h]; for (const n of [c + 1, c - 1, c + XN, c - XN]) if (prev[n] < 0 && open(n)) { prev[n] = c; q.push(n); } }
        if (prev[to] < 0) return null; const p = []; for (let c = to; c !== from; c = prev[c]) p.unshift(c); return p; };
      const rooms = EX.rooms.filter(r => !r.nook).slice(0, 6);
      for (const r of rooms) {
        let goal = -1;
        for (let y = r.y; y < r.y + r.h && goal < 0; y++) for (let x = r.x; x < r.x + r.w; x++) { const c = xi(x, y); if (EX.t[c] === T_FLOOR && !EX.propAt.has(c) && c !== EX.down && c !== EX.up) { goal = c; break; } }
        if (goal < 0) continue;
        const path = goal === EX.pc ? [] : route(EX.pc, goal);
        if (path && path.length) { EX.path = path; EX.goal = { cell: goal, x: xw(goal), z: xz(goal) }; let last = EX.path.length, still = 0;
          for (let k = 0; k < 600 && EX.path.length; k++) { frame(); if (EX.path.length < last) { last = EX.path.length; still = 0; } else if (++still > 120) break; }
          if (Math.hypot(EX.px - xw(goal), EX.pz - xz(goal)) > XCS * 1.5) { DPROF.stand(goal); out.jumps++; frame(); } }   // (the hero stops a step short of a goal it cannot stand on: arrived)
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
    await lab.page.evaluate(() => { DPROF.toRoom(); window.xRenderReal = window.xRender; window.xRender = () => {}; DPROF.realRandom(); DPROF.settle(900); });
    const g = await lab.allocations(() => DPROF.settle(300));   // the game's own script (nothing drawn), as the frame test measures it
    await lab.page.evaluate(() => { window.xRender = window.xRenderReal; });
    const gr = await lab.allocations(() => DPROF.settle(120));   // and the drawing's (three.js), reported
    const kbf = +(g.kb / 300).toFixed(1), kbr = +((gr.kb / 120) - kbf).toFixed(1);
    // the stairs: everything the new floor needs happens while the screen is dark
    const st = await lab.page.evaluate(() => {
      DPROF.toRoom(); EX.groups = []; EX.routeOk = {}; DPROF.settle(5);
      let Q = []; window.requestAnimationFrame = f => { Q.push(f); return Q.length; }; const step = () => { const q = Q; Q = []; for (const f of q) f(performance.now()); };
      const real = setTimeout; let cb; window.setTimeout = (f, ms) => { if (ms >= 400 && ms <= 600 && !cb) { cb = f; return 0; } return real(f, ms); };
      const veil = document.getElementById('fadeVeil'); veil.style.opacity = '0';
      const gl = X3.renderer.getContext(); let link = 0, up = 0; const rl = gl.linkProgram.bind(gl), rt2 = gl.texImage2D.bind(gl);
      let big = 0, sizes = {}; gl.linkProgram = p => { link++; return rl(p); }; gl.texImage2D = function () { up++; const a = arguments, w = a.length >= 9 ? a[3] * a[4] : (a[5] && a[5].width * a[5].height) || 0; if (w >= 128 * 128) big++; sizes[w] = (sizes[w] || 0) + 1; return rt2.apply(null, arguments); };
      const out = {};
      try { xStairsDown(); window.setTimeout = real; for (let k = 0; k < 4; k++) step(); if (cb) cb();
        out.dark = { link, up, big }; link = 0; up = 0; big = 0; sizes = {}; let started = false;
        for (let k = 0; k < 90; k++) { step(); DPROF.settle(1); if (!started && +veil.style.opacity < 1) { started = true; link = 0; up = 0; big = 0; sizes = {}; } }
        out.afterFade = { link, up, big, sizes, started }; }
      finally { window.setTimeout = real; gl.linkProgram = rl; gl.texImage2D = rt2; window.requestAnimationFrame = () => 0; }
      return out; });
    await lab.close();
    const tag = 'depth ' + depth + ' (' + r.area + ')';
    console.log(tag + ': ' + r.rooms + ' rooms walked (' + r.jumps + ' stood in), ' + r.frames + ' frames; script median ' + r.scriptMed + ' ms, p99 ' + r.scriptP99 + ', max ' + r.scriptMax + '; ' + kbf + ' KB a frame of script garbage, ' + kbr + ' KB of drawing garbage (script most from ' + g.top.slice(0, 3).map(([f, k]) => f + ' ' + k).join(', ') + '); walking uploads by size ' + JSON.stringify(r.walk.sizes) + '; stairs ' + JSON.stringify(st));
    check(r.rooms >= LIMIT.rooms && r.jumps <= r.rooms / 3 && r.frames > 300, tag + ': walked the floor (most rooms on foot)', r.rooms + ' rooms, ' + r.jumps + ' stood in, ' + r.frames + ' frames');
    check(r.walk.link === 0, tag + ': walking links no shader program', r.walk.link);
    check(r.walk.big === 0, tag + ': walking uploads no texture of 128 x 128 or more', r.walk.big + ' big of ' + r.walk.up + ' uploads, ' + Math.round(r.walk.upKB) + ' KB');
    check(r.walk.upKB / Math.max(1, r.frames) * 60 < 512, tag + ': and under 512 KB a second of small ones (the darkness map fading as you see: 36 KB each)', Math.round(r.walk.upKB / Math.max(1, r.frames) * 60) + ' KB/s');
    check(r.walk.build === 0, tag + ': walking never rebuilds the floor', r.walk.build);
    check(r.scriptP99 <= LIMIT.scriptP99, tag + ': 99% of frames run their script in ' + LIMIT.scriptP99 + ' ms', r.scriptP99);
    check(r.scriptMax <= LIMIT.scriptMax, tag + ': no frame runs its script over ' + LIMIT.scriptMax + ' ms', r.scriptMax);
    check(kbf <= LIMIT.kbPerFrame, tag + ': under ' + LIMIT.kbPerFrame + ' KB of garbage a frame', kbf + ' KB; top: ' + JSON.stringify(g.top.slice(0, 4)));
    check(st.afterFade && st.afterFade.started, tag + ': the stairs fade back in', JSON.stringify(st));
    check(st.afterFade && st.afterFade.link === 0 && st.afterFade.big === 0, tag + ': once the new floor shows, no program is linked and no big texture uploaded', JSON.stringify(st.afterFade));
    check(!lab.errors.length, tag + ': no page errors', lab.errors.slice(0, 3).join(' | '));
  }
  check.done();
})().catch(e => { console.error(e); process.exit(1); });
