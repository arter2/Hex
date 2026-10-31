'use strict';
const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  crypto = require('crypto');
const U = require('./support.js'),
  ROOT = path.resolve(__dirname, '../..');
function playwright() {
  try {
    return require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  } catch (e) {
    if (process.env.PLAYWRIGHT_MODULE) throw e;
    try {
      return require('/opt/node22/lib/node_modules/playwright');
    } catch (_) {
      throw Error('Install playwright, or set PLAYWRIGHT_MODULE to its module path.');
    }
  }
}
async function launch(options = {}) {
  const engine = process.env.BROWSER || 'chromium',
    pw = playwright();
  if (!['chromium', 'webkit', 'firefox'].includes(engine))
    throw Error('BROWSER must be chromium, webkit or firefox');
  const opts = { headless: true };
  if (process.env.BROWSER_PATH) opts.executablePath = process.env.BROWSER_PATH;
  if (engine === 'chromium')
    opts.args = [
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      ...(options.args || []),
      ...(options.preciseMemory ? ['--enable-precise-memory-info', '--js-flags=--expose-gc'] : [])
    ];
  return { browser: await pw[engine].launch(opts), engine };
}
function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      } catch (e) {
        res.writeHead(400).end();
        return;
      }
      const file = path.resolve(ROOT, '.' + pathname);
      if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const mime = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.svg': 'image/svg+xml', // without it the browser refuses every SVG (the card kit, the HUD art)
        '.json': 'application/json',
        '.ttf': 'font/ttf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404).end();
          return;
        }
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        res.end(data);
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () =>
      resolve({
        url: 'http://127.0.0.1:' + server.address().port + '/game/index.html',
        close: () => new Promise(r => server.close(r))
      })
    );
  });
}
async function openPage(browser, url, options = {}) {
  const context = await browser.newContext({ viewport: { width: 400, height: 800 }, ...options });
  const page = await context.newPage(),
    errors = [];
  page.setDefaultTimeout(15000);
  page.on('crash', () => errors.push('page crash'));
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    // a failed load is reported below with its URL, which the console message leaves out
    if (m.type() === 'error' && !/^Failed to load resource/.test(m.text()))
      errors.push('console: ' + m.text());
  });
  page.on('response', r => {
    if (r.status() >= 400)
      errors.push('http ' + r.status() + ': ' + r.url().replace(/^https?:\/\/[^/]+/, ''));
  });
  page.on('requestfailed', r => errors.push('request failed: ' + r.url().replace(/^https?:\/\/[^/]+/, '')));
  try {
    await page.goto(url);
    await page.waitForFunction(
      () =>
        typeof openCamp === 'function' && typeof enterExplore === 'function' && typeof save !== 'undefined'
    );
    await page.evaluate(() => document.fonts.ready);
    return { page, context, errors };
  } catch (e) {
    await context.close();
    throw e;
  }
}
async function inject(page, crawl = false) {
  for (const file of ['support.js', process.env.BOTFILE || 'bot.js', ...(crawl ? ['crawl.js'] : [])])
    await page.addScriptTag({ path: path.join(__dirname, file) });
}
async function deadline(fn, ms, onTimeout) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(fn),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          Promise.resolve(onTimeout()).catch(() => {});
          reject(Error('Job wall-clock timeout after ' + ms + ' ms'));
        }, ms);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function stamp(result, job, engine, browserVersion) {
  const r = result && typeof result === 'object' ? result : { error: 'Missing result object' };
  return {
    ...r,
    jobId:
      job.jobId ||
      JSON.stringify([job.label || job.style || job.botName, job.lean || job.starter, job.seed, job.depth]),
    seed: job.seed,
    policySeed: job.policySeed,
    metadata: {
      schemaVersion: U.VERSION,
      sourceSha: process.env.SOURCE_SHA || null,
      engine,
      browserVersion,
      botVersion: U.VERSION,
      config: job,
      configHash: crypto.createHash('sha256').update(JSON.stringify(job)).digest('hex')
    }
  };
}
function finalize(r) {
  if (U.issues(r).length) r.status = 'failed';
  else if (r.recoveries?.length) r.status = 'recovered';
  else r.status = 'completed';
  return r;
}
async function batch(kind, args = process.argv.slice(2)) {
  const [jobsFile, outFile] = args;
  if (!jobsFile || !outFile) throw Error('Expected <jobs.json> <out.jsonl>');
  const jobs = U.assertJobs(JSON.parse(fs.readFileSync(jobsFile, 'utf8')));
  if (fs.existsSync(outFile) && fs.statSync(outFile).size && !process.env.APPEND_RESULTS)
    throw Error('Output exists; choose a new file or set APPEND_RESULTS=1');
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const started = Date.now(),
    limit = process.env.LIMIT_S ? Number(process.env.LIMIT_S) * 1000 : Infinity,
    manifest = { kind, requested: jobs.length, results: [], complete: false };
  let host, br, engine;
  const write = r => {
    fs.appendFileSync(outFile, JSON.stringify(r) + '\n');
    manifest.results.push({ jobId: r.jobId, status: r.status, seed: r.seed });
    fs.writeFileSync(outFile + '.manifest.json', JSON.stringify(manifest, null, 2));
    if (!U.usable(r)) process.exitCode = 1;
  };
  try {
    host = await serve();
    const launched = await launch();
    br = launched.browser;
    engine = launched.engine;
    for (const [i, j] of jobs.entries()) {
      if (Date.now() - started > limit) {
        for (const left of jobs.slice(i))
          write(
            stamp(
              { status: 'skipped', error: 'Batch time limit before job started' },
              left,
              engine,
              br.version()
            )
          );
        break;
      }
      let session, r;
      const t0 = Date.now();
      try {
        session = await openPage(br, host.url);
        await inject(session.page, kind === 'crawl');
        const execute = async () => {
          if (kind === 'fight') {
            const ids = [];
            for (const lab of j.lab || [])
              ids.push((await session.page.evaluate(s => PT.makeLab(s), lab)).id);
            const v = await session.page.evaluate(
              ([starter, ids]) => PT.setupDeck(starter, ids),
              [j.starter, ids]
            );
            if (!v.ok) throw Error('Invalid deck: ' + v.errors.join('; '));
          }
          return session.page.evaluate(
            ({ kind, j }) =>
              kind === 'crawl' ? PT.crawl.run(j) : kind === 'run' ? PT.runRun(j) : PT.runFight(j),
            { kind, j }
          );
        };
        r = await deadline(
          execute,
          Number(process.env.WALL_TIMEOUT_MS) || (j.realLimit || 900) * 1000 + 5000,
          () => session.context.close()
        );
      } catch (e) {
        r = { error: e.message };
      } finally {
        if (session) {
          r = { ...r, pageErrors: session.errors };
          await session.context.close();
        }
      }
      if (
        !r?.error &&
        !(kind === 'fight'
          ? typeof r?.res === 'string'
          : Array.isArray(r?.fights) &&
            (kind !== 'crawl' || (Number.isFinite(r.hours) && Array.isArray(r.events))))
      )
        r = { ...r, error: 'Missing or invalid ' + kind + ' result schema' };
      r = stamp({ ...r, realSecs: Math.round((Date.now() - t0) / 1000) }, j, engine, br.version());
      finalize(r);
      write(r);
      console.log(r.jobId, r.status);
    }
  } catch (e) {
    for (const j of jobs.slice(manifest.results.length))
      write(
        stamp(
          { status: 'failed', error: 'Runner: ' + e.message },
          j,
          engine || process.env.BROWSER || 'chromium',
          br?.version()
        )
      );
  } finally {
    manifest.complete = manifest.results.length === jobs.length;
    fs.writeFileSync(outFile + '.manifest.json', JSON.stringify(manifest, null, 2));
    try {
      if (br) await br.close();
    } finally {
      if (host) await host.close();
    }
  }
  return manifest;
}
module.exports = { playwright, launch, serve, openPage, inject, deadline, stamp, finalize, batch };
