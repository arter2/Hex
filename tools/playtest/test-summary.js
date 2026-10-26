// node tools/playtest/test-summary.js <results-directory>
// One Markdown summary of a test session: the menu tap test (ui/), the battle and hand-screen tap test
// (battle-ui/), each for any browsers present (ui-webkit/, battle-ui-webkit/...), and the difficulty curve
// (difficulty/report.md) if it ran. Prints to stdout; CI appends it to the job summary and to docs/test-results/.
'use strict';
const fs = require('fs'),
  path = require('path');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

// a results.json from ui-runner.js or battle-ui-runner.js -> rows of [screen size, result, notes]
function rows(data, kind) {
  if (!data) return null;
  return data.results.map(r => {
    const notes = [];
    if (r.error) notes.push(r.error.split('\n')[0].slice(0, 160));
    for (const e of r.pageErrors || []) notes.push(e.slice(0, 120));
    if (kind === 'ui')
      for (const v of r.visits || [])
        if (v.failures)
          notes.push(`${v.name}: ${v.failures} control${v.failures > 1 ? 's' : ''} covered or clipped`);
    if (kind === 'battle') {
      for (const s of r.steps || []) if (s.skipped) notes.push('note: ' + s.name);
      const passed = (r.steps || []).filter(s => s.ok && !s.skipped).length;
      notes.unshift(`${passed} steps passed`);
    }
    return [r.device.name, r.status === 'completed' ? 'pass' : '**FAIL**', notes.join('; ') || '—'];
  });
}

function summary(dir) {
  const out = [],
    p = s => out.push(s);
  let failed = false;
  const sections = [];
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    const m = name.match(/^(ui|battle-ui)(?:-(\w+))?$/);
    if (!m) continue;
    const data = readJSON(path.join(dir, name, 'results.json'));
    sections.push({
      kind: m[1] === 'ui' ? 'ui' : 'battle',
      browser: m[2] || data?.engine || 'chromium',
      data
    });
  }
  for (const s of sections) {
    p(`### ${s.kind === 'ui' ? 'Menu taps' : 'Battle and hand-screen taps'} (${s.browser})`);
    p('');
    const r = rows(s.data, s.kind);
    if (!r) {
      p('Did not produce results (see the job log).');
      failed = true;
    } else {
      p('| Screen | Result | Notes |');
      p('|---|---|---|');
      for (const row of r) {
        p('| ' + row.join(' | ') + ' |');
        if (row[1] !== 'pass') failed = true;
      }
    }
    p('');
  }
  const diff = path.join(dir, 'difficulty', 'report.md');
  if (fs.existsSync(diff))
    p(
      fs
        .readFileSync(diff, 'utf8')
        .replace(/^# Difficulty curve/m, '### Difficulty curve')
        .replace(/^## /gm, '#### ')
    );
  return { markdown: out.join('\n'), failed };
}

module.exports = { summary, rows };
if (require.main === module) {
  const { markdown, failed } = summary(process.argv[2] || 'test-results');
  process.stdout.write(markdown + '\n');
  if (failed && process.env.SUMMARY_STRICT) process.exitCode = 1;
}
