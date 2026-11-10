// node tools/dungeon-frame-test.js [--write-golden] — the dungeon's frame loop: same result, less work
// A scripted walk along a known floor (out of a room, down a passage, toward the stairs), drawn frame by frame.
//  1. What the frames leave behind (which walls stand low, every wall's place in its mesh, the torch lights, the
//     darkness map) is the same as the golden record made before the frame loop was reworked: tools/golden/dungeon-frame.json.
//  2. A frame makes little garbage: what 600 frames allocate (by the browser's heap sampler) stays under a limit.
//  3. The minimap looks the same, and its ground is redrawn when something on it changed (and once a second), not
//     ten times a second.
// --write-golden records 1 from the code as it is now (only do that from a build known to be right).
const fs = require('fs'),
  path = require('path'),
  Lab = require('./playtest/dungeon-lab.js');
const GOLD = path.join(__dirname, 'golden', 'dungeon-frame.json'),
  WRITE = process.argv.includes('--write-golden'),
  ALLOC_LIMIT_KB = 3000; // v301 made about 17,300 KB here; the reworked loop about 1,900

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
  // the minimap as it stands after the walk (its stairs marker frozen at one moment of its pulse)
  const now = performance.now;
  performance.now = () => 12345;
  xMini();
  const cv = document.getElementById('xMini'),
    px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  out.mini = fnv(fnv(2166136261, u8(new Int32Array([cv.width, cv.height]))), px);
  performance.now = now;
  return out;
}
// in the page: how often the map's ground is redrawn (xMiniBase counts it)
function miniCounts() {
  if (typeof xMiniBase === 'undefined') return null;
  const out = {};
  DPROF.settle(12);
  let a = xMiniBase;
  DPROF.settle(120);
  out.still = xMiniBase - a; // standing still for two seconds
  a = xMiniBase;
  const from = xbfs(EX.t, EX.doors, EX.pc, null, () => false);
  let goal = EX.pc;
  for (let c = 0; c < XN * XN; c++) if (from[c] === 3 && EX.t[c] === T_FLOOR) goal = c;
  const route = xPathTo(xbfs(EX.t, EX.doors, goal, null, () => false), EX.pc, goal);
  for (const c of route) {
    DPROF.stand(c);
    DPROF.settle(6);
  }
  out.walk = xMiniBase - a; // across three cells
  out.walkCells = route.length;
  a = xMiniBase;
  let door = null;
  for (const [i, d] of EX.doors) if (EX.seen[i] && d.state === 'closed') door = d;
  if (!door) for (const [i, d] of EX.doors) if (d.state === 'closed') { door = d; EX.seen[i] = 1; break; }
  door.state = 'open';
  DPROF.settle(6);
  out.door = xMiniBase - a; // a door opened while you stand still
  a = xMiniBase;
  EX.chests[0].open = true;
  EX.seen[EX.chests[0].cell] = 1;
  DPROF.settle(6);
  out.chest = xMiniBase - a;
  a = xMiniBase;
  xMapOpen();
  out.open = xMiniBase - a; // the big map is drawn at once
  xMapClose();
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
    check(w.mini === g.mini, 'the minimap after the walk is the golden minimap', w.mini + ' vs ' + g.mini);
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
  if (!WRITE) {
    const m = await lab.page.evaluate(miniCounts);
    check(!!m, 'the minimap counts its redraws');
    if (m) {
      check(m.still <= 2, 'standing still, the map is redrawn about once a second, not ten times', m.still + ' redraws in 2 s');
      check(m.walk >= Math.min(3, m.walkCells), 'walking redraws it at every new cell', m.walk + ' over ' + m.walkCells + ' cells');
      check(m.door >= 1, 'a door opening redraws it within a tenth of a second', m.door);
      check(m.chest >= 1, 'a chest opened redraws it', m.chest);
      check(m.open >= 1, 'opening the big map draws it at once', m.open);
    }
  }
  if (!WRITE) check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
