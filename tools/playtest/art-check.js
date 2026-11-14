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

// in the page: draw a frame, and say whether any program drawn with the mold layer was compiled (and none failed)
// (with probe: a floor tile and an instanced wall block carrying the mold tag are drawn too, for the checks that run
// before the dungeon's own materials carry it)
const MOLD_PROGRAMS = (probe) => {
  if (probe) { const mk = (k, inst) => { const m = xPhong({ color: 0x888888, vertexColors: false }); m.userData.xmold = k; xLit(m);
      const g = new THREE.BoxGeometry(2, 2, 2), o = inst ? new THREE.InstancedMesh(g, m, 1) : new THREE.Mesh(g, m);
      if (inst) o.setMatrixAt(0, new THREE.Matrix4().makeTranslation(EX.px, 1, EX.pz)); else o.position.set(EX.px, .01, EX.pz); X3.scene.add(o); };
    mk(1, false); mk(2, true); }
  X3.renderer.render(X3.scene, X3.cam); return (X3.renderer.info.programs || []).filter(p => /xmold/.test(p.cacheKey)).length; };

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

  // Task 3: the shader layer
  async moldShaderCompiles(pg, T) {
    await T.build(1, 11);
    await pg.waitForTimeout(1500);
    const n = await pg.evaluate(MOLD_PROGRAMS, true);
    if (!n) return 'no program compiled with the mold layer';
    if (T.errs.some(e => /shader|program/i.test(e))) return 'shader error: ' + T.errs.find(e => /shader|program/i.test(e));
    return true;
  },
  async moldMissingSheet(pg, T) {
    await T.build(1, 11);
    await pg.waitForTimeout(1500);
    const n = await pg.evaluate(MOLD_PROGRAMS, true);
    return n ? n + ' mold programs with no mold sheet' : true;
  },
  async moldBoundaryBlend(pg, T) {
    await T.build(1, 11);
    return pg.evaluate(() => {
      const R = XAO_R, W = XN * R, n = xMoldSlots(EX.area).length, seed = xMoldSeed();
      for (const [door] of EX.doors) { const x = xcx(door), y = xcy(door);
        for (const [dx, dy] of [[1, 0], [0, 1]]) { const a = xi(x - dx, y - dy), b = xi(x + dx, y + dy), ra = EX.room[a], rb = EX.room[b];
          // (a doorway joins a room to a corridor or to another room; a corridor grows the area's first colour)
          if (EX.t[a] !== T_FLOOR || EX.t[b] !== T_FLOOR || ra === rb) continue;
          const slot = r => r < 0 ? 0 : xMoldPick(r, seed, n).a, pa = slot(ra), pb = slot(rb);
          if (pa === pb || xMoldLevel(EX.rooms[ra]) === 0 || xMoldLevel(EX.rooms[rb]) === 0) continue;
          // along the line from the middle of one room's cell, through the door, to the other's
          let mixed = 0;
          for (let s = 0; s <= 2 * R; s++) { const tx = (x - dx) * R + R / 2 + dx * s, ty = (y - dy) * R + R / 2 + dy * s, o = (ty * W + tx) * 4;
            const ch = [0, 1, 2].filter(k => EX.moldData[o + k] > 0);
            if (ch.length > 2) return 'three colours at once by door ' + door;
            if (EX.moldData[o + pa] > 0 && EX.moldData[o + pb] > 0) mixed++; }
          return mixed >= 6 ? true : 'the colours change over ' + mixed + ' texels at door ' + door; } }
      return 'no door between two rooms of different colours';
    });
  },

  // Task 4: the dungeon's own floors and walls carry it; the green blotches go where mold replaces them
  async moldOnFloorsWalls(pg, T) {
    await T.build(1, 11);
    await pg.waitForTimeout(1500);
    const on = await pg.evaluate(() => { const K = []; X3.renderer.render(X3.scene, X3.cam);
      for (const p of X3.renderer.info.programs || []) { const m = /xmold(\d)/.exec(p.cacheKey); if (m) K.push(+m[1]); }
      let patch = 0; X3.group.traverse(o => { if (o.userData && o.userData.natPatch) patch++; });
      return { floor: K.includes(1), wall: K.includes(2), patch }; });
    if (!on.floor) return 'no floor drawn with mold'; if (!on.wall) return 'no wall drawn with mold';
    if (on.patch) return 'the Hollows still draw their green blotches with mold on';
    const off = await pg.evaluate(() => { XLIT.mold = false; xBuildScene(); xUpdateVis(); let patch = 0; X3.group.traverse(o => { if (o.userData && o.userData.natPatch) patch++; }); XLIT.mold = true; return patch; });
    return off ? true : 'no green blotches with mold off';
  },

  // Task 5: the battle floor and walls carry a light layer, with no damp
  async moldArena(pg, T) {
    await T.build(1, 11);
    return pg.evaluate(async () => {
      arenaBuild(1, 5); const A = AR; if (!A || !A.grp) return 'no arena';
      const tags = new Set(); A.grp.traverse(o => { const M = o.material; for (const m of Array.isArray(M) ? M : M ? [M] : []) if (m.userData && m.userData.xmold) tags.add(m.userData.xmold); });
      if (!tags.has(1)) return 'the battle floor carries no mold'; if (!tags.has(2) && !A.open) return 'the battle walls carry no mold';
      if (!A.moldData) return 'no arena mold map';
      for (let i = 3; i < A.moldData.length; i += 4) if (A.moldData[i]) return 'damp on the battle floor';
      if (!A.moldData[0]) return 'no mold weight on the battle floor';
      return true;
    });
  },

  // Task 6: the creepers, tufts and reeds as painted cards
  async foliageCards(pg, T) {
    const kinds = () => pg.evaluate(() => { const K = {}; for (const im of EX.natM || []) { const k = im.userData.kind; K[k] = (K[k] || 0) + im.count; } return K; });
    await T.build(1, 11); const h = await kinds();
    for (const k of ['vineB', 'vineF', 'grass']) if (!h[k]) return 'Hollows lacks ' + k + ' (' + JSON.stringify(h) + ')';
    if (h.vine || h.tuft) return 'Hollows still draws old strips or cones';
    const reeds = await pg.evaluate(() => { if (!EX.rooms.some(r => r.theme === 'flooded')) return 'no flooded room'; const img = envArtFx('grass-dungeon'); let n = 0;
      X3.group.traverse(o => { if (o.material && o.material.map && o.material.map.image === img) n++; }); return n; });
    if (typeof reeds === 'string') return reeds; if (!reeds) return 'no grass cards among the clutter (reeds)';
    // a wall keeps its vine across rebuilds (how many pieces a wall has can change: a low near wall, which depends on the
    // view, has no creepers or stalactites)
    const byWall = () => pg.evaluate(() => { const W = {}; for (const [c, L] of EX.nat) for (const [, , kind] of L) if (/^vine[BFW]$/.test(kind)) W[c] = kind; return W; });
    const w1 = await byWall(); await pg.evaluate(() => { xBuildScene(); xUpdateVis(); }); const w2 = await byWall();
    for (const c in w1) if (w2[c] && w2[c] !== w1[c]) return 'wall ' + c + ' changed its vine on rebuild';
    await T.build(18, 4260); const r = await kinds();
    for (const k of ['vineW', 'grass', 'vine']) if (!r[k]) return 'Ruins lacks ' + k + ' (' + JSON.stringify(r) + ')';
    return true;
  },
  async foliageFallback(pg, T) {
    await T.build(18, 4260, false);
    const r = await pg.evaluate(() => { const K = {}; for (const im of EX.natM || []) K[im.userData.kind] = 1; return K; });
    return r.vine && r.tuft && !r.vineW && !r.grass ? true : 'with no effects sheet: ' + JSON.stringify(r);
  },

  // Task 7: the mushrooms
  async mushPlacement(pg, T) {
    const snap = () => pg.evaluate(() => { const out = [];
      for (const [c, L] of EX.nat) for (const [, , kind, p] of L) if (/^mush:/.test(kind)) out.push([kind, +p.x.toFixed(3), +p.z.toFixed(3)]);
      return out.sort().map(String); });
    await T.build(1, 11); const a = await snap();
    if (a.length < 4) return 'only ' + a.length + ' mushroom clusters in the Hollows';
    const bad = await pg.evaluate(() => { const allow = new Set(XMUSH.area.hollows);
      for (const [c, L] of EX.nat) for (const [, , kind, p] of L) { if (!/^mush:/.test(kind)) continue; const name = kind.slice(5), cell = xcellOpen(p.x, p.z), r = cell >= 0 ? EX.room[cell] : -1;
        if (!allow.has(name) && !(r >= 0 && EX.rooms[r].theme === 'fungus')) return 'a ' + name + ' outside a Fungus room';
        // by a wall's foot (where the rocks lie) or a log
        let d = 9; const cx = Math.floor(p.x / XCS), cz = Math.floor(p.z / XCS);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = xi(cx + dx, cz + dy); if (!EX.wIdx.has(q)) continue;
          const x0 = (cx + dx) * XCS, z0 = (cz + dy) * XCS; d = Math.min(d, Math.hypot(Math.max(x0 - p.x, 0, p.x - x0 - XCS), Math.max(z0 - p.z, 0, p.z - z0 - XCS))); }
        if (d > .9) return 'a ' + name + ' ' + d.toFixed(2) + ' from any wall'; }
      return ''; });
    if (bad) return bad;
    await pg.evaluate(() => { xBuildScene(); xUpdateVis(); }); const b = await snap();
    if (a.join('|') !== b.join('|')) return 'mushrooms moved on rebuild';
    await T.build(14, 11);
    const rif = await pg.evaluate(() => { for (const [, L] of EX.nat) for (const [, , kind] of L) if (/^bracket:/.test(kind)) return kind; return ''; });
    return rif ? 'the Rifts grow ' + rif : true;
  },
  async mushGlow(pg, T) {
    await T.build(1, 11);
    return pg.evaluate(() => { const M = {}; for (const im of EX.natM) M[im.userData.kind] = im.material;
      const want = new THREE.Color('#8FE4DA').multiplyScalar(.35);
      const lb = M['mush:lantern-bells'] || Object.entries(M).find(([k]) => /^mush:/.test(k) && ENVART_MAP.mush['cave20-mushroom-' + k.slice(5)] && ENVART_MAP.mush['cave20-mushroom-' + k.slice(5)].glow);
      const m = Array.isArray(lb) ? lb[1] : lb, kind = Array.isArray(lb) ? lb[0] : 'mush:lantern-bells';
      if (!m) return 'no glowing mushroom on this floor';
      if (!m.emissiveMap) return kind + ' has no glow map';
      if (kind === 'mush:lantern-bells' && Math.abs(m.emissive.r - want.r) + Math.abs(m.emissive.g - want.g) + Math.abs(m.emissive.b - want.b) > .01) return 'lantern glow colour ' + m.emissive.getHexString();
      for (const [k, mm] of Object.entries(M)) if (/^mush:/.test(k)) { const meta = ENVART_MAP.mush[k === 'mush:glow' ? 'mushrooms-glow' : 'cave20-mushroom-' + k.slice(5)]; if (meta && !meta.glow && mm.emissiveMap) return k + ' glows but should not'; }
      return true; });
  },
  async mushFallback(pg, T) {
    await T.build(1, 11, false);
    const r = await pg.evaluate(() => { for (const im of EX.natM || []) if (/^(mush|bracket):/.test(im.userData.kind)) return im.userData.kind; return ''; });
    return r ? 'with no effects sheet: ' + r : true;
  },

  // Task 8: fallen logs with brackets, and brackets on wood
  async logsAndWood(pg, T) {
    for (const d of [1, 2, 3, 4]) {
      await T.build(d, 11);
      const r = await pg.evaluate(() => { const logs = []; for (const mk of EX.marks || []) if (mk.kind === 'clutter') for (const it of mk.items) if (it.k === 'log') logs.push(it);
        const imgs = ['cave20-mushroom-shelf-fans', 'cave20-mushroom-oyster-rosette'].map(n => envArtFx(n)); let br = 0;
        X3.group.traverse(o => { if (o.material && o.material.map && imgs.includes(o.material.map.image)) br++; });
        return { logs: logs.length, br }; });
      if (r.logs && r.br) return true;
    }
    return 'no floor at depths 1-4 has a log with bracket mushrooms';
  },
};
// checks that need the page set up before it loads
const ROUTES = { mushFallback: pg => pg.route('**/atlas/effects.webp', r => r.fulfill({ status: 404, body: '' })),
  foliageFallback: pg => pg.route('**/atlas/effects.webp', r => r.fulfill({ status: 404, body: '' })),
  moldMissingSheet: pg => pg.route('**/atlas/mold.webp', r => r.fulfill({ status: 404, body: '' })) };

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
      if (ROUTES[name]) await ROUTES[name](pg);
      await pg.goto(host.url);
      await pg.waitForFunction(() => typeof enterExplore === 'function' && typeof openCamp === 'function');
      r = await fn(pg, { build: (d, s, wait = true) => pg.evaluate(BUILD, [d, s, wait]), errs });
    } catch (e) { r = String(e.message || e).slice(0, 300); }
    const real = errs.filter(e => !(ROUTES[name] && /Failed to load resource/.test(e)));   // (a check's own blocked file)
    if (r === true && real.length) r = 'page errors: ' + real.slice(0, 2).join(' | ');
    console.log(r === true ? 'PASS ' + name : 'FAIL ' + name + ': ' + r);
    if (r !== true) bad++;
    await pg.close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
