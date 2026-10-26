// node tools/playtest/record-results.js <results-directory> [docs/test-results]
// Saves a test session into the repo so builds can be compared over time: the full summary as
// docs/test-results/<date>.md, and one row in docs/test-results/README.md (newest first) with the commit,
// how the tap tests did and how deep each bot profile got.
'use strict';
const fs = require('fs'),
  path = require('path'),
  { summary } = require('./test-summary.js');

const HEADER = [
  '# Test results',
  '',
  'One row per nightly test session, newest first (written by `tools/playtest/record-results.js`). Tap tests: every',
  'screen size and browser that passed, out of all that ran. Depth: the median depth each bot profile reached on its',
  'run (out of 30), from `tools/playtest/difficulty.js`. Bots are not people: compare builds, not absolute numbers.',
  '',
  '| Date | Commit | Tap tests | Depth reached (random / average / good / combo) | Details |',
  '|---|---|---|---|---|'
];

function record(dir, docs, now = new Date()) {
  fs.mkdirSync(docs, { recursive: true });
  const date = now.toISOString().slice(0, 10),
    sha = (process.env.SOURCE_SHA || '').slice(0, 7) || '—';
  const { markdown, failed } = summary(dir);
  const file = date + '.md';
  fs.writeFileSync(
    path.join(docs, file),
    `# Test session ${date}\n\nCommit ${sha}.${failed ? ' **Something failed: see below.**' : ''}\n\n${markdown}\n`
  );
  // tap tests: count the screen sizes that passed across every results.json
  let pass = 0,
    all = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!/^(ui|battle-ui)(-\w+)?$/.test(name)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, name, 'results.json'), 'utf8'));
      for (const r of d.results) {
        all++;
        if (r.status === 'completed') pass++;
      }
    } catch (e) {}
  }
  let depth = '—';
  try {
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'difficulty', 'summary.json'), 'utf8'));
    depth = ['random', 'average', 'good', 'combo'].map(st => c.styles[st]?.medianReached ?? '—').join(' / ');
  } catch (e) {}
  const row = `| ${date} | ${sha} | ${all ? pass + ' / ' + all : '—'}${pass < all ? ' ⚠' : ''} | ${depth} | [${date}](${file}) |`;
  const readme = path.join(docs, 'README.md');
  const old = fs.existsSync(readme) ? fs.readFileSync(readme, 'utf8').split('\n') : [];
  const rowsOld = old.filter(l => /^\| \d{4}-\d{2}-\d{2} \|/.test(l) && !l.startsWith('| ' + date + ' |'));
  fs.writeFileSync(readme, [...HEADER, row, ...rowsOld].join('\n') + '\n');
  return { file, row, failed };
}

module.exports = { record };
if (require.main === module) {
  const r = record(process.argv[2] || 'test-results', process.argv[3] || 'docs/test-results');
  console.log(r.row);
}
