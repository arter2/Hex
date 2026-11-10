// node tools/playtest/dungeon-profile.js <out.json> [--gfx auto|high|low]
// What the dungeon costs to draw: one known floor per area on the spacious layout, plus one classic floor. For each,
// standing in the middle of a lit room: draw calls, triangles, shader programs, textures, geometries, point lights,
// full-screen passes after the scene, and the median script and whole-frame time of a frame (script time at 4x CPU
// slowdown). The test browser draws in software, so the times are for comparing builds, not for a phone's frame rate.
const fs = require('fs'),
  path = require('path'),
  Lab = require('./dungeon-lab.js');
const args = process.argv.slice(2),
  gi = args.indexOf('--gfx'),
  gfx = gi >= 0 ? args[gi + 1] : null,
  out = args.find((a, i) => !a.startsWith('--') && (gi < 0 || i !== gi + 1));
if (!out || (gfx && !['auto', 'high', 'low'].includes(gfx))) {
  console.error('usage: node dungeon-profile.js <out.json> [--gfx auto|high|low]');
  process.exit(2);
}
const FLOORS = [
  [1, 2],
  [5, 2],
  [9, 2],
  [13, 2],
  [17, 2],
  [21, 2],
  [1, 1]
];
(async () => {
  const lab = await Lab.open({ gfx });
  const floors = [];
  let build = null;
  for (const [depth, layout] of FLOORS) {
    const info = await lab.enter(depth, layout);
    build = await lab.page.evaluate(() => +document.querySelector('meta[name="application-version"]').content);
    const stats = await lab.page.evaluate(() => {
      DPROF.toRoom();
      DPROF.settle(40);
      return DPROF.stats();
    });
    await lab.throttle(4);
    const script = await lab.page.evaluate(() => DPROF.times().scriptMs);
    await lab.throttle(1);
    const frame = await lab.page.evaluate(() => DPROF.times().frameMs);
    const row = Object.assign({ depth, area: info.area, layout: info.layout }, stats, { scriptMs: script, frameMs: frame });
    floors.push(row);
    console.log(JSON.stringify(row));
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ build, gfx: gfx || 'default', floors }, null, 1) + '\n');
  if (lab.errors.length) {
    console.error('page errors: ' + lab.errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  }
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
