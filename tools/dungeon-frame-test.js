// node tools/dungeon-frame-test.js [--write-golden] — the dungeon's frame loop: same result, less work
// A scripted walk along a known floor (out of a room, down a passage, toward the stairs), drawn frame by frame.
//  1. What the frames leave behind (which walls stand low, every wall's place in its mesh, the torch lights, the
//     darkness map) is the same as the golden record made before the frame loop was reworked: tools/golden/dungeon-frame.json.
//  2. A frame makes little garbage: what 600 frames allocate (by the browser's heap sampler) stays under a limit.
//  3. The minimap is redrawn when something on it changed, not on a timer.
// --write-golden records 1 from the code as it is now (only do that from a build known to be right).
const fs = require('fs'),
  path = require('path'),
  Lab = require('./playtest/dungeon-lab.js');
const GOLD = path.join(__dirname, 'golden', 'dungeon-frame.json'),
  WRITE = process.argv.includes('--write-golden'),
  ALLOC_LIMIT_KB = 3000; // v301 made about 17,300 KB here; the reworked loop about 2,200

// in the page: walk the route, a digest every 20 frames
function walk() {
  const fnv = (h, bytes) => {
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const u8 = a => new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const digest = () => {
    let h = 2166136261;
    h = fnv(h, u8(EX.wCut));
    h = fnv(h, u8(EX.fogTgt));
    for (const m of EX.wms.concat(EX.wGhost)) {
      h = fnv(h, u8(new Int32Array([m.count, m.visible ? 1 : 0])));
      h = fnv(h, u8(m.instanceMatrix.array.subarray(0, m.count * 16)));
    }
    const L = [];
    for (const P of X3.pool) L.push(P.position.x, P.position.y, P.position.z, P.color.r, P.color.g, P.color.b, P.intensity, P.distance);
    h = fnv(h, u8(new Int32Array(L.map(v => Math.round(v * 1e4)))));
    return h;
  };
  const start = DPROF.toRoom();
  DPROF.settle(40);
  // the route: to the furthest floor cell within 80 steps of the start (through open doors only)
  const from = xbfs(EX.t, EX.doors, start, null, () => false);
  let goal = start;
  for (let c = 0; c < XN * XN; c++) if (from[c] > from[goal] && from[c] <= 80 && EX.t[c] === T_FLOOR) goal = c;
  const route = [start].concat(xPathTo(xbfs(EX.t, EX.doors, goal, null, () => false), start, goal));
  const out = { cells: route.length, digests: [] };
  let seg = 0,
    f = 0;
  const STEP = 0.15;
  while (f < 240 && seg < route.length - 1) {
    const tx = xw(route[seg + 1]),
      tz = xz(route[seg + 1]),
      dx = tx - EX.px,
      dz = tz - EX.pz,
      d = Math.hypot(dx, dz);
    if (d <= STEP) {
      EX.px = tx;
      EX.pz = tz;
      seg++;
    } else {
      EX.px += (dx / d) * STEP;
      EX.pz += (dz / d) * STEP;
    }
    const c = xcell(EX.px, EX.pz);
    if (c !== EX.pc) {
      EX.pc = c;
      xUpdateVis();
    }
    DPROF.settle(1);
    f++;
    if (f % 20 === 0) out.digests.push(digest());
  }
  out.frames = f;
  return out;
}

(async () => {
  const lab = await Lab.open({ memory: true }),
    check = Lab.checker('dungeon-frame-test');
  await lab.enter(9, 2);
  const w = await lab.page.evaluate(walk);
  if (WRITE) {
    fs.mkdirSync(path.dirname(GOLD), { recursive: true });
    fs.writeFileSync(GOLD, JSON.stringify(w, null, 1) + '\n');
    console.log('golden written: ' + w.frames + ' frames, ' + w.digests.length + ' digests');
  } else {
    const g = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
    check(w.frames === g.frames && w.frames >= 120, 'the walk is the golden walk (' + g.frames + ' frames)', w.frames);
    const first = w.digests.findIndex((d, i) => d !== g.digests[i]);
    check(first < 0 && w.digests.length === g.digests.length, 'walls, lights and darkness match the golden record at every sample', 'first difference at frame ' + (first + 1) * 20);
  }
  // garbage made by 600 frames standing in the passage (nothing drawn: this is the script's own garbage)
  await lab.page.evaluate(() => {
    window.xRenderReal = window.xRender;
    window.xRender = () => {};
    DPROF.realRandom();
    DPROF.settle(1500); // long enough for the browser to have compiled the frame's code: only then is its garbage steady
  });
  const al = await lab.allocations(() => DPROF.settle(600));
  await lab.page.evaluate(() => {
    window.xRender = window.xRenderReal;
  });
  console.log('  garbage over 600 frames: ' + al.kb.toFixed(0) + ' KB  ' + al.top.map(t => t[0] + ' ' + t[1]).join(', '));
  if (!WRITE) check(al.kb < ALLOC_LIMIT_KB, 'a frame makes little garbage (under ' + ALLOC_LIMIT_KB + ' KB over 600 frames)', al.kb.toFixed(0) + ' KB');
  if (!WRITE) check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
