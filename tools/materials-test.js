// node tools/materials-test.js — the painted prop materials and the Materials lab (matlab.js)
// Every prop the lab can show, in an area with the plain rock and in the Rifts (their basalt), under every lighting
// set-up: each builds, takes its painted materials (save the few left plain on purpose), draws without a shader or page
// error. Then the tuning: a slider moves the picture (and every material it should), Reset puts it back, an object's own
// tuning changes that object and no other made of the same material, Save keeps it, Export gives JSON that loads back
// to the same values, and the game's own menu opens the lab.
const Runner = require('./playtest/runner-common.js');
const PLAIN = ['Room furniture / candles', 'Room furniture / mushrooms', 'Themed rooms and ruins / reeds'];   // wax and plant cards: no material fits
(async () => {
  const host = await Runner.serve(), { browser } = await Runner.launch({});
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage(), errs = [];
  page.on('pageerror', e => errs.push('page: ' + e.message));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/GL Driver|GPU stall/.test(t)) errs.push(t.slice(0, 300)); });
  page.on('dialog', d => d.accept());
  const fails = []; const check = (ok, what, detail) => { console.log((ok ? '  ok    ' : '  FAIL  ') + what + (ok || detail === undefined ? '' : '  [' + detail + ']')); if (!ok) fails.push(what); };
  await page.goto(host.url); await page.waitForFunction(() => typeof matlabStart === 'function' && typeof openMenu === 'function');
  // the menu's Lab dialog opens the lab
  const menu = await page.evaluate(async () => { save = newSave(STARTERS[0]); save.char = lockChar(newChar('human', 0)); save.temp = true; openMenu();
    await new Promise(r => setTimeout(r, 300)); document.querySelector('#scrMenu .hm-cat[data-cat="lab"]').click(); await new Promise(r => setTimeout(r, 300));
    const b = document.querySelector('#hmDlgB [data-go="lpMats"]'); if (!b) return 'no Materials lab in the Lab dialog'; b.click(); await new Promise(r => setTimeout(r, 500));
    return document.getElementById('matLab') && document.getElementById('matLab').classList.contains('on') ? 'ok' : 'the lab did not open'; });
  check(menu === 'ok', 'the menu\'s Lab dialog opens the Materials lab', menu);
  await page.evaluate(() => { try { localStorage.removeItem(XPROP_TUNE_STORE); } catch (e) {} xPropTuneLoad(); ML.spin = false; ML.side = false; });
  await page.waitForFunction(() => !!envArtProps(), null, { timeout: 120000 });
  // every prop, every light, two areas
  for (const areaId of ['hollows', 'rifts']) {
    const r = await page.evaluate(async aid => {
      ML.area = ML_AREAS().findIndex(a => a.id === aid); mlArea(); while (!envArtProps()) await new Promise(r => setTimeout(r, 200)); mlArea();
      const list = mlAssets(), bad = [], plain = [], wrongRock = [];
      for (let i = 0; i < list.length; i++) { ML.asset = i; mlShow(); for (let L = 0; L < ML_LIGHTS.length; L++) { ML.light = L; mlLight(); mlFrame(performance.now()); }
        const name = list[i].group + ' / ' + list[i].name, mats = mlMatsOf(MLS.spin);
        if (/could not be built/.test(document.getElementById('mlAssetName').textContent)) bad.push(name);
        else if (list[i].group !== 'Material swatches' && !mats.length) plain.push(name);
        if (aid === 'rifts' && /boulder|bigrock|rubble|arena rock|cave pillar/.test(list[i].name) && mats.includes('rough-rock')) wrongRock.push(name); }
      return { n: list.length, bad, plain, wrongRock }; }, areaId);
    check(r.n >= 100, areaId + ': the lab lists every prop', r.n);
    check(!r.bad.length, areaId + ': every prop builds', r.bad.join(', '));
    check(r.plain.every(n => PLAIN.includes(n)), areaId + ': every prop takes its painted materials (but wax and plant cards)', r.plain.join(', '));
    check(!r.wrongRock.length, areaId + ': rock is the area\'s own (basalt in the Rifts)', r.wrongRock.join(', '));
  }
  // the tuning, on the barrel (planks, rough wood and iron) in the studio light
  const t = await page.evaluate(async () => {
    const out = {}, list = mlAssets(), barrel = list.findIndex(a => a.group === 'Room furniture' && a.name === 'barrel'), crate = list.findIndex(a => a.group === 'Room furniture' && a.name === 'crate');
    ML.area = 0; ML.light = ML_LIGHTS.findIndex(l => l.id === 'studio'); mlArea(); ML.asset = barrel; mlShow(); ML.yaw = .3; ML.pitch = .62; ML.dist = 6; ML.ty = .5;
    const shot = () => { mlFrame(performance.now()); mlFrame(performance.now()); const gl = MLS.r.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, p = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p); return p; };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return n; };
    out.mats = mlMatsOf(MLS.spin);
    const base = shot();
    // every slider of the barrel's staves moves the picture
    ML.mat = 'rough-wood'; ML.scope = 'all'; mlScope(); const tw = XPROP_TUNE['rough-wood'], moved = {};
    const tries = { hue: 120, sat: 0, con: 3, bri: .4, detail: 0, rough: 0, metal: 1, normal: 4, bump: 4, height: 3, ao: 3, scale: 3.7, rot: 90, offu: .5, offv: .5, dstr: 1 };
    for (const k in tries) { const was = tw[k]; tw[k] = tries[k]; if (k === 'dstr') { tw.dnoise = 3; tw.dscale = 2; } xPropTuneApply(); moved[k] = diff(base, shot()); tw[k] = was; if (k === 'dstr') { tw.dnoise = 0; tw.dscale = 8; } xPropTuneApply(); }
    out.moved = moved; out.backToBase = diff(base, shot());
    // an object's own tuning: the barrel's iron alone
    ML.mat = 'iron'; mlScope(); document.getElementById('mlScO').click(); out.target = mlTarget();
    XPROP_OVR[out.target] = { bri: .05 }; xPropTuneApply(); out.barrelMoved = diff(base, shot());
    // a crate's iron (its band is planks; its fittings, if any, iron) and the iron swatch are untouched
    const swatch = list.findIndex(a => a.group === 'Material swatches' && a.name === 'iron');
    ML.asset = swatch; mlShow(); ML.scope = 'all'; const swA = shot(); XPROP_OVR[out.target] = {}; xPropTuneApply(); out.swatchMovedByObject = diff(swA, shot()); XPROP_OVR[out.target] = { bri: .05 }; xPropTuneApply();
    // save, then load from the store again: the same values
    document.getElementById('mlSave').click(); const saved = JSON.parse(localStorage.getItem(XPROP_TUNE_STORE) || '{}'); out.saved = saved;
    xPropTuneLoad(); out.reloaded = (XPROP_OVR[out.target] || {}).bri;
    // export, wipe, apply the exported JSON: the same values again
    XPROP_TUNE['rough-wood'].bri = .8; xPropTuneApply(); const j = xPropTuneJSON();   // (XPROP_TUNE is made afresh by a load: not the tw from before) localStorage.removeItem(XPROP_TUNE_STORE); xPropTuneLoad(); out.wiped = [XPROP_TUNE['rough-wood'].bri, (XPROP_OVR[out.target] || {}).bri];
    document.getElementById('mlJson').value = j; document.getElementById('mlApply').click(); out.applied = [XPROP_TUNE['rough-wood'].bri, (XPROP_OVR[out.target] || {}).bri];
    try { localStorage.removeItem(XPROP_TUNE_STORE); } catch (e) {} xPropTuneLoad();
    // the 3-point set-up and a matte environment draw
    ML.light = ML_LIGHTS.findIndex(l => l.id === 'tp'); ML_TP.hdri = ML_HDRI_PAINT.length; mlLight(); for (let k = 0; k < 40 && !ML_HCACHE.has('m|' + ML_MATTES()[0].join('|')); k++) { await new Promise(r => setTimeout(r, 250)); mlLight(); }
    out.matte = ML_HCACHE.has('m|' + ML_MATTES()[0].join('|')); mlFrame(performance.now());
    return out; });
  check(['planks', 'rough-wood', 'iron'].every(k => t.mats.includes(k)), 'the barrel is planks, rough wood and iron', t.mats.join(','));
  const still = Object.entries(t.moved).filter(([k, n]) => n < 200).map(([k, n]) => k + ' ' + n);
  check(!still.length, 'every slider visibly changes the material (over 200 pixels)', still.join(', '));
  check(t.backToBase === 0, 'and putting the sliders back gives the same picture', t.backToBase + ' pixels');
  check(t.target === 'room:barrel/iron', 'This object only tunes the barrel\'s iron', t.target);
  check(t.barrelMoved > 50, 'which changes the barrel', t.barrelMoved);
  check(t.swatchMovedByObject === 0, 'and not other iron (the swatch)', t.swatchMovedByObject + ' pixels');
  check(t.saved && t.saved['room:barrel/iron'] && t.saved['room:barrel/iron'].bri === .05, 'Save keeps the object\'s tuning', JSON.stringify(t.saved));
  check(t.reloaded === .05, 'and it loads back', t.reloaded);
  check(t.wiped[0] === 1 && t.wiped[1] === undefined, 'wiping the store forgets it', JSON.stringify(t.wiped));
  check(t.applied[0] === .8 && t.applied[1] === .05, 'the exported JSON loads back to the same values', JSON.stringify(t.applied));
  check(t.matte, 'a matte painting lights the 3-point fill', t.matte);
  const uniq = [...new Set(errs)]; check(!uniq.length, 'no shader or page errors', uniq.slice(0, 5).join(' | '));
  console.log(fails.length ? 'materials-test: ' + fails.length + ' FAILED' : 'materials-test: all passed'); process.exitCode = fails.length ? 1 : 0;
  await browser.close(); await host.close();
})().catch(e => { console.error(e); process.exit(1); });
