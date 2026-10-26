// node tools/playtest/pilot-report.js <results-directory> <markdown-output>
'use strict';
const fs = require('fs'),
  path = require('path'),
  U = require('./support.js');
function report(dir) {
  const read = name => (fs.existsSync(path.join(dir, name)) ? U.readRecords([path.join(dir, name)], fs) : []);
  const battle = read('battle.jsonl'),
    crawl = read('crawl.jsonl'),
    out = [],
    p = s => out.push(s),
    avg = (a, f) => (a.length ? (a.reduce((s, x) => s + f(x), 0) / a.length).toFixed(1) : '—'),
    pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) + '%' : '—');
  const table = (h, rows) => {
    p('| ' + h.join(' | ') + ' |');
    p('|' + h.map(() => '---').join('|') + '|');
    for (const r of rows) p('| ' + r.join(' | ') + ' |');
    p('');
  };
  p('# Player-bot pilot results');
  p('');
  p(
    'Build: ' +
      (process.env.SOURCE_SHA || 'see raw metadata') +
      '. Scripted profiles running the actual game in headless Chromium. This is a small descriptive pilot, not a human skill study or mobile/Safari input test.'
  );
  p('');
  for (const [name, rows] of [
    ['Battle runs', battle],
    ['Dungeon careers', crawl]
  ]) {
    const h = U.coverage(rows);
    p(`## ${name}: execution health`);
    p('');
    p(
      `${h.requested} records: ${h.clean} clean, ${h.recovered} recovery-assisted, ${h.failed} failed, ${h.skipped} skipped.`
    );
    p('');
  }
  const label = r => r.label || r.metadata?.config?.label || r.style || 'unknown',
    styles = ['random', 'average', 'good', 'combo'];
  p('## Battle results — clean runs only');
  p('');
  table(
    [
      'Profile',
      'Clean / records',
      'Fights',
      'Won',
      'HP lost / fight',
      'Seconds / fight',
      'Reached depth (avg)'
    ],
    styles.map(st => {
      const all = battle.filter(r => label(r) === st),
        clean = all.filter(U.usable),
        f = clean.flatMap(r => r.fights || []);
      return [
        st,
        clean.length + ' / ' + all.length,
        f.length,
        pct(f.filter(x => x.res === 'win').length, f.length),
        avg(f, x => x.hpLost || 0),
        avg(f, x => x.time || 0),
        avg(clean, x => x.reached || 0)
      ];
    })
  );
  p('## Dungeon results — clean careers only');
  p('');
  table(
    [
      'Profile',
      'Clean / records',
      'Virtual hours',
      'Deepest (avg)',
      'Deaths',
      'Fights',
      'Won',
      'Walk stalls',
      'Modelled threshold crossings'
    ],
    styles
      .filter(s => s !== 'random')
      .map(st => {
        const all = crawl.filter(r => label(r) === st),
          clean = all.filter(U.usable),
          f = clean.flatMap(r => r.fights || []);
        return [
          st,
          clean.length + ' / ' + all.length,
          clean.reduce((s, r) => s + (r.hours || 0), 0).toFixed(2),
          avg(clean, r => r.maxDepth || 0),
          clean.reduce((s, r) => s + (r.deaths || []).length, 0),
          f.length,
          pct(f.filter(x => x.res === 'win').length, f.length),
          clean.reduce((s, r) => s + (r.stuck || 0), 0),
          clean.reduce((s, r) => s + (r.quits || []).length, 0)
        ];
      })
  );
  p('## Failures and interventions');
  p('');
  const failures = [...battle, ...crawl].filter(r => !U.usable(r));
  if (!failures.length) p('None recorded.');
  for (const r of failures)
    p(
      '- ' +
        JSON.stringify({
          job: r.jobId,
          profile: label(r),
          seed: r.seed,
          status: r.status,
          issues: U.issues(r),
          recoveries: r.recoveries || [],
          partialDepth: r.maxDepth ?? r.reached
        })
    );
  p('');
  p('## Limits');
  p('');
  p(
    '- One replicate per colour/profile; career length is capped at 15 virtual minutes. Results describe this sample only.'
  );
  p(
    '- Battle profiles differ in fighting, deck strategy and progression; their differences are not a controlled measurement of human skill.'
  );
  p(
    '- Input uses game actions, not rendered touch hit regions. This run does not certify walking controls, menu overlap or physical Safari.'
  );
  p(
    '- Failed careers are diagnostics, not evidence of their profile being weaker. Missing records mean the pilot did not complete.'
  );
  return { markdown: out.join('\n') + '\n', failed: !battle.length || !crawl.length || failures.length > 0 };
}
module.exports = { report };
if (require.main === module) {
  const r = report(process.argv[2] || 'playtest-pilot');
  fs.writeFileSync(process.argv[3] || 'playtest-pilot/report.md', r.markdown);
  console.log(r.markdown);
  if (r.failed) process.exitCode = 1;
}
