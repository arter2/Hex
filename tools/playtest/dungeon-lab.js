// Shared set-up for the dungeon's look and speed tests (dungeon-profile.js, ../dungeon-*-test.js).
// It opens the real game in the headless test browser, stops the game's own frame loop and gives the page a small
// helper, DPROF, that builds a known floor and draws it frame by frame on a fixed clock, so two runs of the same
// build see the same floor, the same dice and the same frames.
const Runner = require('./runner-common.js');

// what the page gets (runs in the browser)
function install() {
  window.requestAnimationFrame = () => 0; // the tests draw the frames themselves
  window.DPROF = {
    T: 0,
    // a fresh game on one floor: the same floor every time for a depth and layout
    enter(depth, layout) {
      const keep = {};
      for (const k of ['hexmancers-gfx', 'hexmancers-gfx-auto']) {
        try {
          const v = localStorage.getItem(k);
          if (v != null) keep[k] = v;
        } catch (e) {}
      }
      localStorage.clear();
      for (const k in keep) localStorage.setItem(k, keep[k]);
      Math.random = caveRng(1000 + depth);
      save = newSave(STARTERS[0]);
      save.char = lockChar(newChar('human', 0));
      save.layout = layout || 2;
      save.worldSeed = 4242;
      save.deepest = 30;
      persist();
      enterExplore(depth);
      DPROF.T = 0;
      return { area: EX.area.id, layout: EX.layout };
    },
    // stand in the middle of the first lit ordinary room (a floor cell), with nothing else going on
    toRoom() {
      const r = EX.rooms.find(r => r.lit && !r.closet && !r.nook) || EX.rooms[1] || EX.rooms[0];
      let best = -1,
        bd = 1e9;
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          const c = xi(x, y);
          if (EX.room[c] !== r.id || EX.t[c] !== T_FLOOR || EX.propAt.has(c) || c === EX.up || c === EX.down) continue;
          const d = Math.hypot(x - (r.x + r.w / 2), y - (r.y + r.h / 2));
          if (d < bd) {
            bd = d;
            best = c;
          }
        }
      DPROF.stand(best);
      return best;
    },
    stand(c) {
      EX.pc = c;
      EX.px = xw(c);
      EX.pz = xz(c);
      EX.vx = EX.vz = 0;
      EX.path = [];
      EX.goal = null;
      EX.camX = null;
      xUpdateVis();
    },
    // draw this many frames at 60 a second
    settle(frames) {
      for (let k = 0; k < (frames || 1); k++) {
        DPROF.T += 1 / 60;
        xDraw(DPROF.T, 1 / 60);
      }
    },
    // what one frame costs to draw
    stats() {
      const r = X3.renderer,
        real = r.render;
      let n = 0;
      r.render = function () {
        n++;
        return real.apply(r, arguments);
      };
      DPROF.settle(1);
      r.render = real;
      let lights = 0;
      X3.scene.traverse(o => {
        if (o.isPointLight) lights++;
      });
      const i = r.info;
      return {
        calls: i.render.calls,
        tris: i.render.triangles,
        programs: (i.programs || []).length,
        textures: i.memory.textures,
        geometries: i.memory.geometries,
        pointLights: lights,
        postPasses: n - 1
      };
    },
    median(a) {
      a = a.slice().sort((x, y) => x - y);
      return a[a.length >> 1];
    },
    // script time of a frame (nothing drawn, mean of 240) and the whole frame (median of 12), in ms
    times() {
      const real = window.xRender,
        s = [],
        f = [];
      window.xRender = () => {};
      // (the browser's clock is coarse, so script time is the mean over 240 frames, not a median of single frames)
      const t0 = performance.now();
      DPROF.settle(240);
      s.push((performance.now() - t0) / 240);
      window.xRender = real;
      // (reading a pixel back makes the browser finish drawing the frame; gl.finish alone returns at once here)
      const gl = X3.renderer.getContext(),
        px = new Uint8Array(4);
      for (let k = 0; k < 12; k++) {
        const t = performance.now();
        DPROF.settle(1);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        f.push(performance.now() - t);
      }
      return { scriptMs: +DPROF.median(s).toFixed(3), frameMs: +DPROF.median(f).toFixed(2) };
    }
  };
}

// open the game. opt: {gfx:'auto'|'high'|'low', storage:{key:value}, memory:true, width, height}
async function open(opt = {}) {
  const host = await Runner.serve();
  const { browser } = await Runner.launch({ preciseMemory: !!opt.memory });
  const context = await browser.newContext({
    viewport: { width: opt.width || 390, height: opt.height || 844 },
    deviceScaleFactor: 1
  });
  const storage = Object.assign({}, opt.storage);
  if (opt.gfx) storage['hexmancers-gfx'] = opt.gfx;
  if (Object.keys(storage).length)
    await context.addInitScript(s => {
      try {
        if (!sessionStorage.getItem('lab-seeded')) {
          for (const k in s) localStorage.setItem(k, s[k]);
          sessionStorage.setItem('lab-seeded', '1');
        }
      } catch (e) {}
    }, storage);
  const page = await context.newPage(),
    errors = [];
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(e.message));
  const lab = {
    page,
    errors,
    // a clean page each time, so nothing of an earlier floor is left in memory
    async fresh() {
      await page.goto(host.url);
      await page.waitForFunction(
        () => typeof openCamp === 'function' && typeof enterExplore === 'function' && typeof newSave === 'function'
      );
      await page.evaluate(install);
    },
    async enter(depth, layout) {
      await lab.fresh();
      return page.evaluate(([d, l]) => DPROF.enter(d, l), [depth, layout || 2]);
    },
    async throttle(rate) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    },
    async close() {
      await browser.close();
      await host.close();
    }
  };
  return lab;
}

// a small assertion helper: collects failures, prints each check, sets the exit code
function checker(name) {
  const fails = [];
  const check = (ok, what, detail) => {
    console.log((ok ? '  ok    ' : '  FAIL  ') + what + (detail !== undefined && !ok ? '  [' + detail + ']' : ''));
    if (!ok) fails.push(what);
  };
  check.done = errors => {
    if (errors && errors.length) {
      console.log('  FAIL  page errors: ' + errors.slice(0, 5).join(' | '));
      fails.push('page errors');
    }
    console.log(fails.length ? name + ': ' + fails.length + ' FAILED' : name + ': all passed');
    process.exitCode = fails.length ? 1 : 0;
    return !fails.length;
  };
  return check;
}

module.exports = { open, checker };
