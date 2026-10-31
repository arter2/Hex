// Relay tests. Run: cd tools/netplay && npm install && node relay-test.js
'use strict';
const assert = require('assert');
const { startRelay } = require('./relay.js');

const open = (port, room) =>
  new Promise((res, rej) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/relay?room=${room}`);
    ws.inbox = [];
    ws.closeEvt = null;
    ws.onmessage = e => ws.inbox.push(e.data);
    ws.onclose = e => (ws.closeEvt = e);
    ws.onopen = () => res(ws);
    ws.onerror = () => rej(new Error('connect failed'));
  });
// like open() but never rejects: resolves with the socket once it opened or closed
const tryOpen = (port, room) =>
  new Promise(res => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/relay?room=${room}`);
    ws.closeEvt = null;
    ws.onclose = e => {
      ws.closeEvt = e;
      res(ws);
    };
    ws.onerror = () => {};
  });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms = 1000) => {
  const t = Date.now();
  while (!f() && Date.now() - t < ms) await sleep(5);
  return f();
};
const get = (port, path) =>
  new Promise((res, rej) => {
    require('http')
      .get({ host: '127.0.0.1', port, path }, r => {
        let b = '';
        r.on('data', d => (b += d));
        r.on('end', () => res({ status: r.statusCode, body: b }));
      })
      .on('error', rej);
  });

(async () => {
  const relay = await startRelay({ port: 0, dir: require('path').join(__dirname, '..', '..', 'game') });
  const port = relay.port;
  const tests = {
    async 'forwards both ways'() {
      const a = await open(port, 'ABCD'), b = await open(port, 'abcd');
      for (let i = 0; i < 20; i++) {
        a.send('a' + i);
        b.send('b' + i);
      }
      assert(await until(() => a.inbox.length === 20 && b.inbox.length === 20));
      assert.deepStrictEqual(b.inbox, Array.from({ length: 20 }, (_, i) => 'a' + i));
      assert.deepStrictEqual(a.inbox, Array.from({ length: 20 }, (_, i) => 'b' + i));
      a.close();
      b.close();
      await sleep(50);
    },
    async 'rooms are isolated'() {
      const a = await open(port, 'ABCD'), b = await open(port, 'ABCD');
      const x = await open(port, 'WXYZ'), y = await open(port, 'WXYZ');
      a.send('hi');
      await sleep(100);
      assert.deepStrictEqual(b.inbox, ['hi']);
      assert.deepStrictEqual(x.inbox, []);
      assert.deepStrictEqual(y.inbox, []);
      for (const s of [a, b, x, y]) s.close();
      await sleep(50);
    },
    async 'third client refused'() {
      const a = await open(port, 'ABCD'), b = await open(port, 'ABCD');
      const c = await tryOpen(port, 'ABCD');
      assert.strictEqual(c.closeEvt.code, 4001);
      a.send('one');
      b.send('two');
      assert(await until(() => a.inbox.length === 1 && b.inbox.length === 1));
      assert.deepStrictEqual([a.inbox[0], b.inbox[0]], ['two', 'one']);
      a.close();
      b.close();
      await sleep(50);
    },
    async 'bad room is refused'() {
      for (const room of ['', 'ABC', 'ABCDE', 'AB1D']) {
        const c = await tryOpen(port, room);
        assert.strictEqual(c.closeEvt.code, 4000, room);
      }
    },
    async 'close propagates'() {
      const a = await open(port, 'ABCD'), b = await open(port, 'ABCD');
      a.close();
      assert(await until(() => b.closeEvt, 500));
      // the room is free again afterwards
      const c = await open(port, 'ABCD'), d = await open(port, 'ABCD');
      c.send('x');
      assert(await until(() => d.inbox.length === 1));
      c.close();
      d.close();
      await sleep(50);
    },
    async 'serves the game'() {
      const r = await get(port, '/index.html');
      assert.strictEqual(r.status, 200);
      assert(r.body.includes('Hexmancers'));
      assert.strictEqual((await get(port, '/')).status, 200);
      assert.strictEqual((await get(port, '/../package.json')).status, 404);
      assert.strictEqual((await get(port, '/%2e%2e/package.json')).status, 404);
      assert.strictEqual((await get(port, '/%2e%2e%2fpackage.json')).status, 404);
      assert.strictEqual((await get(port, '/nope.html')).status, 404);
    }
  };
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try {
      await fn();
      console.log('ok  ' + name);
    } catch (e) {
      failed++;
      console.log('FAIL ' + name + '\n' + (e.stack || e));
    }
  }
  // browser WsTransport against the real relay (two pages); skipped when Playwright is not installed
  let pw = null;
  try {
    pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  } catch (e) {
    try {
      pw = require('/opt/node22/lib/node_modules/playwright');
    } catch (_) {}
  }
  if (!pw) console.log('skip browser WsTransport (Playwright not found)');
  else {
    let browser;
    try {
      const opts = { headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
      if (process.env.BROWSER_PATH) opts.executablePath = process.env.BROWSER_PATH;
      browser = await pw.chromium.launch(opts);
      const pages = [];
      for (let i = 0; i < 2; i++) {
        const p = await browser.newPage();
        await p.goto(`http://127.0.0.1:${port}/index.html`);
        pages.push(p);
      }
      const [pa, pb] = pages;
      const tb = pb.evaluate(async () => {
        const t = await WsTransport.connect('ABCD');
        window.__got = [];
        window.__closes = 0;
        t.onclose = () => window.__closes++;
        t.onmessage = m => window.__got.push(m);
        window.__t = t;
      });
      await pa.evaluate(async () => {
        const t = await WsTransport.connect('abcd');
        window.__t = t;
        await new Promise(r => setTimeout(r, 200));
        t.send('hello', 'fast');
      });
      await tb;
      await pb.waitForFunction(() => window.__got.length >= 1, null, { timeout: 3000 });
      assert.deepStrictEqual(await pb.evaluate(() => window.__got), ['hello']);
      await pa.evaluate(() => window.__t.close());
      await pb.waitForFunction(() => window.__closes === 1, null, { timeout: 3000 });
      // a bad room opens, then the relay closes it with 4000: the transport reports a close
      const closed = await pa.evaluate(
        () =>
          new Promise(async r => {
            const t = await WsTransport.connect('AB1');
            t.onclose = () => r(true);
            setTimeout(() => r(false), 2000);
          })
      );
      assert(closed, 'bad room should close the transport');
      console.log('ok  browser WsTransport (hello, close once, bad room closes)');
    } catch (e) {
      failed++;
      console.log('FAIL browser WsTransport\n' + (e.stack || e));
    } finally {
      if (browser) await browser.close();
    }
  }
  await relay.close();
  process.exit(failed ? 1 : 0);
})();
