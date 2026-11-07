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
        // The slot strip opens the three save slots (since v296 Continue itself goes exploring); Back returns to the
        // main menu, which is the camp
        await tap(page, '#mmSlots');
        await visible('#scrSaves.on');
        await audit('save-slots', '#scrSaves');
        await tap(page, '#svBack');
        await visible('#scrMenu.on');
        await audit('camp', '#scrMenu');
        // each camp destination is in one of the menu's categories (Cards, Market, Character)
        const screens = [
          ['deck', 'cards', 'goBuilder', '#scrDeck.on,#scrBuilder.on', '#dkBack,#scrBuilder .back'],
          ['collection', 'cards', 'goCollection', '#scrCollection.on', '#scrCollection .back'],
          ['shop', 'market', 'goShop', '#scrShop.on', '#scrShop .back'],
          ['character', 'character', 'goChar', '#bagUI.on', '#bgClose']
        ];
        for (const [name, cat, go, active, back] of screens) {
          await tap(page, '#scrMenu .hm-cat[data-cat="' + cat + '"]');
          await visible('#hmDlg.on');
          await tap(page, '#hmDlgB [data-go="' + go + '"]');
          await visible(active);
          await audit(name, active);
          await tap(page, back);
          await visible('#scrMenu.on');
        }
        await tap(page, '#mmSettings');
        await visible('#settings.on');
        await audit('settings', '#settings');
        await tap(page, '#setBack');
        await visible('#scrMenu.on');
        // Duel a friend (the kit's header, frame, tiles and tabs)
        await tap(page, '#mmDuel');
        await visible('#scrDuel.on');
        await audit('duel', '#scrDuel');
        await tap(page, '#duBack');
        await visible('#scrMenu.on');
        // Continue goes straight to exploring (v296); the starter deck is valid, so it does not stop at the camp
        await tap(page, '#mmContinue');
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
        // the dungeon's dialog (a trader with tabs and rows), in the kit's frame
        await page.evaluate(() => {
          xDlg({
            title: 'Gruk the Trader',
            sub: 'Goblin merchant',
            text: 'Fresh from the deeps.',
            tabs: [['buy', 'Buy'], ['sell', 'Sell']],
            tab: 'buy',
            buttons: [['Leave', null]],
            body(box) {
              xRow(box, '', 'Ember Dart', 'Common Fire Strike', '120 gold', () => {});
              xRow(box, '', 'Cinder Lance', 'Common Fire Strike', '95 gold', () => {});
            }
          });
        });
        await visible('#xDialog.on');
        await audit('dungeon-dialog', '#xDialog');
        await tap(page, '#xDialog .winx');
        await page.waitForSelector('#xDialog.on', { state: 'hidden' });
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
