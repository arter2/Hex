// node tools/dungeon-auto-test.js — the Graphics setting's Auto, and its row in Settings
// Auto decides once from 90 frame times (after 30 warm-up frames): a median over 22 ms is Low. Fed made-up frame
// times, so the result does not depend on the machine. The Settings row cycles Auto, High, Low and stores it.
const Lab = require('./playtest/dungeon-lab.js');
(async () => {
  const lab = await Lab.open({}),
    check = Lab.checker('dungeon-auto-test');
  await lab.fresh();
  const r = await lab.page.evaluate(() => {
    const out = {};
    let applied = 0;
    const realApply = gfxApply;
    window.gfxApply = () => {
      applied++;
    };
    const reset = () => {
      localStorage.removeItem('hexmancers-gfx');
      localStorage.removeItem('hexmancers-gfx-auto');
      Object.assign(GFX, { auto: 'high', done: false, n: 0 });
      GFX.ms.length = 0;
      applied = 0;
    };
    const feed = (n, ms) => {
      for (let k = 0; k < n; k++) gfxSample(ms);
    };
    reset();
    feed(30, 200);
    feed(89, 30);
    out.notYet = GFX.done === false;
    feed(1, 30);
    out.slow = GFX.auto === 'low' && GFX.done && localStorage.getItem('hexmancers-gfx-auto') === 'low' && applied === 1 && gfxLow() === true;
    reset();
    feed(30, 200);
    feed(90, 16);
    out.fast = GFX.auto === 'high' && GFX.done && localStorage.getItem('hexmancers-gfx-auto') === 'high' && applied === 0 && gfxLow() === false;
    reset();
    feed(30, 16);
    feed(44, 40);
    feed(46, 16);
    out.median = GFX.auto === 'high' && GFX.done; // fewer than half the frames are slow
    reset();
    feed(30, 16);
    feed(500, 400);
    out.hitches = GFX.done === false; // frames over 250 ms are not counted
    reset();
    feed(30, 16);
    feed(90, 40);
    feed(200, 5);
    out.once = GFX.auto === 'low'; // decided once, not measured again
    reset();
    localStorage.setItem('hexmancers-gfx', 'high');
    feed(200, 60);
    out.manual = GFX.done === false && gfxLow() === false; // High chosen by hand: nothing is measured
    reset();
    window.gfxApply = realApply;
    // the Settings row
    const b = document.getElementById('setGfx'),
      seq = [b ? b.textContent : null];
    if (b)
      for (let k = 0; k < 3; k++) {
        b.click();
        seq.push(b.textContent + ':' + gfxMode() + ':' + (localStorage.getItem('hexmancers-gfx') || ''));
      }
    out.row = JSON.stringify(seq);
    return out;
  });
  check(r.notYet, 'no decision before 30 warm-up frames and 90 counted ones');
  check(r.slow, 'a median over 22 ms picks Low, keeps it for later sessions and applies it once');
  check(r.fast, 'a quick device stays on High');
  check(r.median, 'it is the median that counts: 44 slow frames of 90 stay High');
  check(r.hitches, 'frames over 250 ms are not counted');
  check(r.once, 'it is decided once');
  check(r.manual, 'High or Low chosen by hand is never overridden');
  check(r.row === JSON.stringify(['Auto', 'High:high:high', 'Low:low:low', 'Auto:auto:']), 'the Settings row cycles Auto, High, Low and stores the choice', r.row);
  // a stored result is used from the start of the next session
  const lab2 = await Lab.open({ storage: { 'hexmancers-gfx-auto': 'low' } });
  await lab2.fresh();
  check(await lab2.page.evaluate(() => GFX.done && gfxLow() === true), 'a stored Auto result is used from the first frame of the next session');
  await lab2.close();
  check.done(lab.errors);
  await lab.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
