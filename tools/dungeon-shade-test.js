// node tools/dungeon-shade-test.js — the shadow shape: a character covered by scenery shows as a dark shape
// Checks: every character sprite carries a shade (a child sprite drawn only where something nearer covers it); in the
// open it draws nothing; behind a wall-sized block it darkens the covered part; an enemy's shade follows the enemy
// (hidden with it, gone when it is removed); the classic layout builds it too.
const Lab = require('./playtest/dungeon-lab.js');
(async () => {
  const lab = await Lab.open({}),
    check = Lab.checker('dungeon-shade-test');
  await lab.enter(9, 2);
  const r = await lab.page.evaluate(() => {
    const out = {};
    DPROF.toRoom();
    X3.dust.visible = false;
    if (EX.motes) EX.motes.visible = false;
    XLIT.flick = 0;
    X3.group.traverse(o => {
      if (o.isPoints) o.visible = false;
    });
    DPROF.settle(40);
    const T = DPROF.T,
      gl = X3.renderer.getContext();
    // the frame as drawn with the shadow on or off: the same instant, nothing moving
    const grab = on => {
      XLIT.dShade = on;
      if (typeof xShadeLook === 'function') xShadeLook();
      xDraw(T, 1e-9);
      xDraw(T, 1e-9);
      const w = gl.drawingBufferWidth,
        h = gl.drawingBufferHeight,
        px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return px;
    };
    // pixels that differ, and how bright those pixels are in each frame
    const diff = (a, b) => {
      let n = 0,
        la = 0,
        lb = 0;
      for (let i = 0; i < a.length; i += 4)
        if (Math.abs(a[i] - b[i]) > 8 || Math.abs(a[i + 1] - b[i + 1]) > 8 || Math.abs(a[i + 2] - b[i + 2]) > 8) {
          n++;
          la += a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
          lb += b[i] * 0.3 + b[i + 1] * 0.59 + b[i + 2] * 0.11;
        }
      return { n, on: n ? la / n : 0, off: n ? lb / n : 0 };
    };
    // a block the size of a piece of wall, standing between a spot and the camera
    const block = (x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5, 0.3), new THREE.MeshBasicMaterial({ color: 0x909090 }));
      const c = X3.cam.position,
        d = new THREE.Vector3(c.x - x, c.y - 1.4, c.z - z).normalize();
      m.position.set(x + d.x * 3.5, 1.4 + d.y * 3.5, z + d.z * 3.5);
      m.lookAt(c);
      X3.group.add(m);
      return m;
    };
    const sh = EX.me.userData.shade;
    out.has = !!(sh && sh.isSprite && sh.parent === EX.me);
    if (!out.has) return out;
    out.depth = sh.material.depthFunc === THREE.GreaterDepth && sh.material.depthWrite === false;
    out.map = !!EX.me.material.map && sh.material.map === EX.me.material.map;
    out.order = sh.renderOrder < EX.me.renderOrder;
    out.open = diff(grab(true), grab(false)).n;
    const b1 = block(EX.px, EX.pz);
    out.covered = diff(grab(true), grab(false));
    X3.group.remove(b1);
    // an enemy two cells away, asleep (it stands still), behind its own block
    const id = Object.keys(ENEMY_DEFS).find(k => !ENEMY_DEFS[k].boss && ENEMY_DEFS[k].vermin === undefined);
    let cell = -1;
    for (const c of [EX.pc + 2, EX.pc - 2, EX.pc + 2 * XN, EX.pc - 2 * XN]) if (EX.t[c] === T_FLOOR && EX.vis[c]) { cell = c; break; }
    const g = xGroup([id], cell, 'sleep');
    if (!EX.groups.includes(g)) EX.groups.push(g);
    if (!g.sprite) xGroupSprites(g, X3.group);
    g.x = xw(cell);
    g.z = xz(cell);
    out.enemyHas = !!(g.sprite.userData.shade && g.sprite.userData.shade.parent === g.sprite);
    const b2 = block(g.x, g.z);
    out.enemyCovered = diff(grab(true), grab(false)).n;
    g.dormant = true; // not shown at all
    out.enemyHidden = diff(grab(true), grab(false)).n;
    const sid = g.sprite.userData.shade.id;
    xDropGroup(g);
    EX.groups = EX.groups.filter(q => q !== g);
    out.enemyGone = X3.scene.getObjectById(sid) === undefined;
    X3.group.remove(b2);
    // the settings: off hides it, strength is its opacity
    XLIT.dShade = false;
    xShadeLook();
    out.offHidden = sh.visible === false;
    XLIT.dShade = true;
    XLIT.dShadeA = 0.3;
    xShadeLook();
    out.strength = sh.visible === true && Math.abs(sh.material.opacity - 0.3) < 1e-6;
    out.defaults = XLIT_DEF.dShade === true && XLIT_DEF.dShadeA === 0.55 && XLIT_DEF.dShadeTint === 0.35;
    out.rows = ['dbg_dShade', 'dbg_dShadeA', 'dbg_dShadeTint'].every(i => !!document.getElementById(i));
    return out;
  });
  check(r.has, 'your sprite carries a shade, a child sprite');
  if (r.has) {
    check(r.depth, 'the shade draws only where something nearer was drawn, and writes no depth');
    check(r.map, "the shade shows the sprite's own picture");
    check(r.order, 'the shade is drawn before the characters');
    check(r.open === 0, 'in the open the shade draws nothing', r.open + ' pixels differ');
    check(r.covered.n > 150, 'behind a block the covered part shows', r.covered.n + ' pixels differ');
    check(r.covered.on < r.covered.off - 20, 'and it shows as a dark shape', 'on ' + r.covered.on.toFixed(0) + ' off ' + r.covered.off.toFixed(0));
    check(r.enemyHas, 'an enemy carries a shade');
    check(r.enemyCovered > 100, 'a covered enemy in sight shows its shade', r.enemyCovered + ' pixels differ');
    check(r.enemyHidden === 0, 'an enemy that is not shown has no shade', r.enemyHidden + ' pixels differ');
    check(r.enemyGone, 'a removed enemy takes its shade with it');
    check(r.offHidden, 'Shadow shape off hides it');
    check(r.strength, 'Shadow strength is its opacity');
    check(r.defaults, 'defaults: on, strength 0.55, tint 0.35');
    check(r.rows, 'the debug menu has the three rows');
  }
  // the classic layout gets it too
  await lab.enter(1, 1);
  const c = await lab.page.evaluate(() => {
    DPROF.toRoom();
    DPROF.settle(3);
    const sh = EX.me.userData.shade;
    return !!(sh && sh.parent === EX.me && sh.material.map === EX.me.material.map) && EX.layout === 1;
  });
  check(c, 'the classic layout builds the shade too');
  check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
