// node tools/playtest/difficulty.js <results-directory> [runsPerColour=1] [maxDepth=30] [styles=random,average,good,combo]
// The difficulty curve: each bot profile plays whole runs from depth 1 down to maxDepth (a loss is retried; three
// losses in a row at one depth end the run), and the report shows, depth band by depth band, how often fights are
// won, how much of the mage's HP they cost and how long they take - and where each profile's runs stop.
// Writes jobs.json, runs.jsonl, report.md and summary.json into the directory.
'use strict';
const fs = require('fs'),
  path = require('path'),
  { spawnSync } = require('child_process'),
  U = require('./support.js');

const BAND = 3; // depths per row of the report
const STYLES = ['random', 'average', 'good', 'fast', 'combo', 'shopaholic'];

function bands(maxDepth) {
  const out = [];
  for (let d = 1; d <= maxDepth; d += BAND) out.push([d, Math.min(maxDepth, d + BAND - 1)]);
  return out;
}

// Turn run records into the curve (pure: selftest.js checks it)
function curve(records, maxDepth) {
  const label = r => r.label || r.metadata?.config?.label || r.style || 'unknown';
  const clean = records.filter(U.usable);
  const styles = [...new Set(clean.map(label))].sort((a, b) => STYLES.indexOf(a) - STYLES.indexOf(b));
  const out = {
    maxDepth,
    runs: records.length,
    clean: clean.length,
    styles: {},
    unfinished: [],
    quickLosses: []
  };
  // fights that never ended inside the bots' time limit (a stalemate, or a fight the bot can't finish), from every
  // record, clean or not: they are what made a run unclean
  for (const r of records)
    for (const x of r.fights || []) {
      if (['timeout', 'stuck', 'error', 'evalerror'].includes(x.res))
        out.unfinished.push({
          profile: label(r),
          lean: r.lean,
          depth: x.depth,
          res: x.res,
          seconds: x.time,
          hpLost: x.hpLost
        });
      // lost in under 20 seconds: a near one-shot
      if (x.res !== 'win' && x.time != null && x.time < 20 && !['timeout', 'stuck'].includes(x.res))
        out.quickLosses.push({
          profile: label(r),
          lean: r.lean,
          depth: x.depth,
          seconds: x.time,
          hpLost: x.hpLost,
          maxHp: x.maxHp
        });
    }
  for (const st of styles) {
    const runs = clean.filter(r => label(r) === st),
      fights = runs.flatMap(r => r.fights || []);
    const rows = bands(maxDepth).map(([a, b]) => {
      const f = fights.filter(x => x.depth >= a && x.depth <= b),
        won = f.filter(x => x.res === 'win').length,
        hpPct = f.filter(x => x.maxHp > 0).map(x => (100 * (x.hpLost || 0)) / x.maxHp);
      return {
        depths: [a, b],
        fights: f.length,
        winPct: f.length ? (100 * won) / f.length : null,
        hpLostPct: hpPct.length ? hpPct.reduce((s, x) => s + x, 0) / hpPct.length : null,
        seconds: f.length ? f.reduce((s, x) => s + (x.time || 0), 0) / f.length : null,
        // runs whose last fight was in this band and that did not reach the bottom: where they stopped
        stopped: runs.filter(r => {
          const last = (r.fights || []).at(-1);
          return last && last.depth >= a && last.depth <= b && last.res !== 'win';
        }).length
      };
    });
    const reached = runs.map(r => r.reached || 0).sort((x, y) => x - y);
    const bite = rows.find(r => r.fights >= 3 && r.winPct != null && r.winPct < 80);
    out.styles[st] = {
      runs: runs.length,
      medianReached: reached.length ? reached[Math.floor(reached.length / 2)] : null,
      cleared: runs.filter(r => (r.reached || 0) > maxDepth).length,
      bitesAt: bite ? bite.depths : null,
      rows
    };
  }
  return out;
}

function markdown(c, meta) {
  const f = (x, d = 0) => (x == null ? '—' : (+x).toFixed(d)),
    out = [];
  out.push('# Difficulty curve', '');
  out.push(
    `Build ${meta.source || 'unknown'}, ${meta.date}. ${c.clean} of ${c.runs} runs clean. Bots play whole runs from ` +
      `depth 1 to ${c.maxDepth}; a lost fight is retried, and three losses in a row at one depth end the run. ` +
      'Bots are not people: read this as where the game gets harder, not as how hard it feels. Damage taken can ' +
      'pass 100% of max HP because healing during a fight lets you take more.',
    ''
  );
  if (c.unfinished.length) {
    out.push('## Fights that never ended', '');
    out.push(
      "The fight was still going when the bot's time limit ran out. A run with one is left out of the tables.",
      ''
    );
    out.push('| Profile | Deck | Depth | Seconds | Damage taken |', '|---|---|---|---|---|');
    for (const u of c.unfinished)
      out.push(`| ${u.profile} | ${u.lean || '—'} | ${u.depth} | ${f(u.seconds)} | ${f(u.hpLost)} |`);
    out.push('');
  }
  if (c.quickLosses.length) {
    out.push('## Fights lost in under 20 seconds', '');
    out.push('| Profile | Deck | Depth | Seconds | Damage taken / max HP |', '|---|---|---|---|---|');
    for (const u of c.quickLosses)
      out.push(
        `| ${u.profile} | ${u.lean || '—'} | ${u.depth} | ${f(u.seconds)} | ${f(u.hpLost)} / ${f(u.maxHp)} |`
      );
    out.push('');
  }
  out.push('## Where it starts to bite', '');
  out.push(
    '| Profile | Runs | Median depth reached | Cleared all | First band under 80% wins |',
    '|---|---|---|---|---|'
  );
  for (const [st, s] of Object.entries(c.styles))
    out.push(
      `| ${st} | ${s.runs} | ${f(s.medianReached)} | ${s.cleared} | ${s.bitesAt ? s.bitesAt.join('–') : 'none'} |`
    );
  out.push('');
  for (const [st, s] of Object.entries(c.styles)) {
    out.push(`## ${st}`, '');
    out.push(
      '| Depths | Fights | Won | Damage taken (% of max HP) | Seconds / fight | Runs stopped here |',
      '|---|---|---|---|---|---|'
    );
    for (const r of s.rows)
      if (r.fights || r.stopped)
        out.push(
          `| ${r.depths.join('–')} | ${r.fights} | ${f(r.winPct)}% | ${f(r.hpLostPct)}% | ${f(r.seconds)} | ${r.stopped} |`
        );
    out.push('');
  }
  return out.join('\n');
}

function run(dir, n = 1, maxDepth = 30, styles = 'random,average,good,combo') {
  fs.mkdirSync(dir, { recursive: true });
  const jobs = path.join(dir, 'jobs.json'),
    jsonl = path.join(dir, 'runs.jsonl'),
    node = (script, args) =>
      spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
        stdio: 'inherit',
        env: process.env
      });
  // enough fights for a run to reach the bottom with a few retries on the way
  node('mkruns.js', [jobs, String(n), String(maxDepth * 2 + 10), String(maxDepth), styles]);
  if (fs.existsSync(jsonl)) fs.unlinkSync(jsonl);
  const r = node('run-runner.js', [jobs, jsonl]);
  const records = fs.existsSync(jsonl) ? U.readRecords([jsonl], fs) : [];
  const c = curve(records, maxDepth);
  const meta = { source: process.env.SOURCE_SHA || null, date: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify({ ...meta, ...c }, null, 2));
  fs.writeFileSync(path.join(dir, 'report.md'), markdown(c, meta) + '\n');
  console.log(markdown(c, meta));
  if (r.status !== 0 || c.clean < c.runs) process.exitCode = 1;
  return c;
}

module.exports = { curve, markdown, bands };
if (require.main === module) {
  const [, , dir = 'playtest-difficulty', n = '1', maxDepth = '30', styles] = process.argv;
  run(dir, +n, +maxDepth, styles);
}
