// Checks of the painted dungeon art in the running game (the mold layer, foliage and mushroom cards):
//   node tools/playtest/art-check.js [check ...]      (no names: every check)
// Each check prints PASS <name> or FAIL <name>: <why>; the script exits non-zero on any FAIL.
// docs/superpowers/plans/2026-11-14-mold-and-foliage-cards.md names the checks and what they hold.
const Runner = require('./runner-common.js');

// in the page: build a floor the way a new game does, with every cell seen, and wait for its art
const BUILD = async ([depth, seed, wait]) => {
  try { localStorage.setItem('hexmancers-xtips', '0'); localStorage.setItem('hexmancers-cine', '0'); } catch (e) {}
  envArtWantDepth(depth);
  const t0 = performance.now();
  while (wait && performance.now() - t0 < 15000 && !(envArtAreaFloors(areaOf(depth)) && envArtFx('leaf-clumps'))) await new Promise(r => setTimeout(r, 100));
  if (typeof stopExplore === 'function' && EX) stopExplore();
  save = newSave(STARTERS[0]); save.char = lockChar(newChar('human', 0)); save.worldSeed = seed; save.deepest = depth;
  XRUN = null; pickDepth = depth; clearFloors(); openCamp(); enterExplore(depth);
  for (let i = 0; i < EX.seen.length; i++) EX.seen[i] = 1; xUpdateVis();
  return true;
};

const CHECKS = {
  // Task 1: the sheets the build makes
  async atlasSheets(pg) {
    return pg.evaluate(() => {
      const M = ENVART_MAP, S = M.sheets;
      if (!S.mold) return 'no mold sheet';
      const mt = Object.entries(S.mold.tiles);
      if (mt.length !== 20) return 'mold tiles: ' + mt.length;
      if (mt.some(([, t]) => t[2] !== 256)) return 'a mold tile is not 256 wide';
      const fx = S.effects.tiles, want = ['vine-broad', 'vine-fine', 'vine-weathered', 'grass-dungeon', 'mushrooms-glow'];
      for (const k of want) if (!fx[k]) return 'effects lacks ' + k;
      const mush = Object.keys(fx).filter(k => k.startsWith('cave20-mushroom-'));
      if (mush.length !== 12) return 'mushroom tiles: ' + mush.length;
      const E = S['effects-e'];
      if (!E) return 'no effects-e sheet';
      if (E.size.join() !== S.effects.size.join()) return 'effects-e size ' + E.size + ' vs ' + S.effects.size;
      for (const k in fx) if (!E.tiles[k] || E.tiles[k].join() !== fx[k].join()) return 'effects-e tile differs: ' + k;
      const L = M.mush && M.mush['cave20-mushroom-lantern-bells'];
      if (!L) return 'no mush metadata';
      if (Math.abs(L.pivot[0] - .5760) > 1e-3 || Math.abs(L.pivot[1] - .8820) > 1e-3) return 'lantern pivot ' + L.pivot;
      if (String(L.glow).toUpperCase() !== '#8FE4DA' || Math.abs(L.k - .35) > 1e-6) return 'lantern glow ' + L.glow + ' ' + L.k;
      if (!M.mold || M.mold['olive-powder'] !== 'olive-powder') return 'no mold id map';
      return true;
    });
  },

  // Task 2: the mold map. Depth 1 (any world seed: the floor is the depth's) rolls a library, overgrown, fungus and
  // flooded room.
  async moldPickStable(pg, T) {
    const snap = () => pg.evaluate(() => {
      if (typeof xMoldPick !== 'function') return { err: 'no xMoldPick' };
      if (!EX.moldData) return { err: 'no EX.moldData' };
      return { picks: JSON.stringify(EX.rooms.map(r => xMoldPick(r.id, xMoldSeed(), XMOLD.area.hollows.length))), sum: Array.from(EX.moldData).reduce((a, v, i) => (a + v * (i % 7 + 1)) % 1000000007, 0) };
    });
    // the same floor's scene built again (as when the art arrives, or you come back to it): a newly made floor places
    // its chests and traps afresh, and the pools keep clear of them, so only a rebuild is the same floor
    await T.build(1, 11); const a = await snap(); if (a.err) return a.err;
    await pg.evaluate(() => { xBuildScene(); xUpdateVis(); }); const b = await snap(); if (b.err) return b.err;
    if (a.picks !== b.picks) return 'room picks differ between builds';
    if (a.sum !== b.sum) return 'mold map differs between builds';
    return true;
  },
  async moldLibraryClean(pg, T) {
    await T.build(1, 1);
    return pg.evaluate(() => {
      if (!EX.moldData) return 'no EX.moldData';
      const lib = EX.rooms.filter(r => r.theme === 'library'); if (!lib.length) return 'no library on this floor';
      const R = XAO_R, W = XN * R; let n = 0;
      for (let ty = 0; ty < W; ty++) for (let tx = 0; tx < W; tx++) { const c = xi(Math.floor(tx / R), Math.floor(ty / R)), r = EX.room[c];
        if (r < 0 || EX.rooms[r].theme !== 'library') continue;
        // (texels on the room's own edge blend with the cell beside it; only the room's inside must be clean)
        if ([c - 1, c + 1, c - XN, c + XN].some(q => EX.room[q] !== r && EX.t[q] === T_FLOOR)) continue;
        const o = (ty * W + tx) * 4; if (EX.moldData[o] || EX.moldData[o + 1] || EX.moldData[o + 2]) n++; }
      return n ? n + ' library texels carry mold' : true;
    });
  },
  async moldDampAtWalls(pg, T) {
    await T.build(1, 11);
    return pg.evaluate(() => {
      if (!EX.moldData) return 'no EX.moldData';
      const R = XAO_R, W = XN * R, wall = c => EX.wIdx.has(c), near = [], far = [], wet = xMoldWaterField();
      for (let c = 0; c < XN * XN; c++) { if (EX.t[c] !== T_FLOOR || EX.room[c] < 0) continue;
        const x = xcx(c), y = xcy(c); let d = 9;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (wall(xi(x + dx, y + dy))) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
        const a = EX.moldData[((y * R + R / 2) * W + x * R + R / 2) * 4 + 3];
        if (d === 1) near.push(a); else if (d >= 3 && !wet[c]) far.push(a); }
      const avg = L => L.reduce((s, v) => s + v, 0) / Math.max(1, L.length), an = avg(near), af = avg(far);
      if (!near.length || !far.length) return 'no cells to compare';
      return an > 2 * af + 1 ? true : 'damp by walls ' + an.toFixed(1) + ' vs open floor ' + af.toFixed(1);
    });
  },
};

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CHECKS);
  const host = await Runner.serve();
  const { browser } = await Runner.launch();
  let bad = 0;
  for (const name of names) {
    const fn = CHECKS[name];
    if (!fn) { console.log('FAIL ' + name + ': no such check'); bad++; continue; }
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
    let r;
    try {
      await pg.goto(host.url);
      await pg.waitForFunction(() => typeof enterExplore === 'function' && typeof openCamp === 'function');
      r = await fn(pg, { build: (d, s, wait = true) => pg.evaluate(BUILD, [d, s, wait]), errs });
    } catch (e) { r = String(e.message || e).slice(0, 300); }
    if (r === true && errs.length) r = 'page errors: ' + errs.slice(0, 2).join(' | ');
    console.log(r === true ? 'PASS ' + name : 'FAIL ' + name + ': ' + r);
    if (r !== true) bad++;
    await pg.close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
