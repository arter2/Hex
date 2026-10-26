// BROWSER=webkit node tools/playtest/ui-runner.js [results-directory]
// Coordinate taps and native DOM hit testing; no gameplay bot is injected.
'use strict';
const fs = require('fs'),
  path = require('path'),
  R = require('./runner-common.js');
const MATRIX = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 }
];
async function tap(page, selector) {
  const el = page.locator(selector).filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw Error('No visible target: ' + selector);
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const hit = await el.evaluate(
    (el, { x, y }) => {
      const t = document.elementFromPoint(x, y);
      return t === el || el.contains(t);
    },
    { x, y }
  );
  if (!hit) throw Error('Tap intercepted: ' + selector);
  await page.touchscreen.tap(x, y);
}
async function run(out = process.argv[2] || 'playtest-ui-results') {
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  let host, browser, engine;
  try {
    host = await R.serve();
    ({ browser, engine } = await R.launch());
    for (const device of MATRIX) {
      let session;
      const visits = [];
      let testError = null;
      try {
        session = await R.openPage(browser, host.url, {
          viewport: { width: device.width, height: device.height },
          hasTouch: true,
          isMobile: true,
          deviceScaleFactor: 1
        });
        const page = session.page;
        await page.addScriptTag({ path: path.join(__dirname, 'hit-audit.js') });
        // Fixture setup only. Everything after this point navigates using real coordinate taps.
        await page.evaluate(() => {
          save = newSave(STARTERS[0]);
          save.char = lockChar(newChar('human', 0));
          persist();
          openMenu();
        });
        const audit = async (name, scope) => {
          const r = await page.evaluate(scope => PTHitAudit({ scope, scroll: true }), scope);
          if (!r.checked) throw Error('No enabled controls audited: ' + name);
          visits.push({ name, ...r });
          await page.screenshot({ path: path.join(out, device.name + '-' + name + '.png') });
        };
        const visible = selector => page.waitForSelector(selector, { state: 'visible' });
        await audit('main-menu', '#scrMenu');
        await tap(page, '#mmContinue');
        await visible('#scrCamp.on');
        await audit('camp', '#scrCamp');
        const screens = [
          ['deck', '#goBuilder', '#scrDeck.on,#scrBuilder.on', '#dkBack,#scrBuilder .back'],
          ['collection', '#goCollection', '#scrCollection.on', '#scrCollection .back'],
          ['shop', '#goShop', '#scrShop.on', '#scrShop .back'],
          ['character', '#goChar', '#bagUI.on', '#bgClose'],
          ['settings', '#goSettings', '#settings.on', '#setBack']
        ];
        for (const [name, entry, active, back] of screens) {
          await tap(page, entry);
          await visible(active);
          await audit(name, active);
          await tap(page, back);
          await visible('#scrCamp.on');
        }
        await tap(page, '#btnDescend');
        await visible('#scrExplore.on');
        await audit('dungeon-hud', '#scrExplore');
        await tap(page, '#xMenu');
        await visible('#pause.on');
        await audit('pause', '#pause');
        await tap(page, '#mSettings');
        await visible('#settings.on');
        await audit('pause-settings', '#settings');
        await tap(page, '#setBack');
        await visible('#pause.on');
        await tap(page, '#mResume');
        await page.waitForSelector('#pause.on', { state: 'hidden' });
        await tap(page, '#xBag');
        await visible('#bagUI.on');
        await audit('dungeon-bag', '#bagUI');
        await tap(page, '#bgClose');
        await page.waitForSelector('#bagUI.on', { state: 'hidden' });
      } catch (e) {
        testError = e.message;
        if (session)
          await session.page
            .screenshot({ path: path.join(out, device.name + '-failure.png') })
            .catch(() => {});
      } finally {
        if (session) await session.context.close();
      }
      const failed = testError || visits.some(v => v.failures) || session?.errors.length;
      results.push({
        device,
        engine,
        browserVersion: browser.version(),
        status: failed ? 'failed' : 'completed',
        error: testError,
        pageErrors: session?.errors || [],
        visits
      });
      if (failed) process.exitCode = 1;
      fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
          {
            engine,
            notice:
              'WebKit is not physical iOS/iPadOS Safari. Walking, battle controls and gesture sequences require separate scenarios.',
            results
          },
          null,
          2
        )
      );
    }
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      if (host) await host.close();
    }
  }
  return results;
}
module.exports = { run, tap, MATRIX };
if (require.main === module)
  run().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
