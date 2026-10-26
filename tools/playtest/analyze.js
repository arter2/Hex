// usage: node tools/playtest/analyze.js <dir with full_*.jsonl>
const fs = require('fs');
const R = [];
const DIR = process.argv[2] || __dirname;
for (const f of fs.readdirSync(DIR).filter(f => /^full_\d+\.jsonl$/.test(f)))
  for (const l of fs
    .readFileSync(DIR + '/' + f, 'utf8')
    .trim()
    .split('\n'))
    if (l) R.push(JSON.parse(l));
const bots = ['robot', 'human_good', 'human_casual'],
  depths = [...new Set(R.map(r => r.depth))].sort((a, b) => a - b),
  decks = [...new Set(R.map(r => r.deck))];
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0),
  pct = x => Math.round(100 * x);
const share = rs => {
  let w = 0,
    c = 0,
    a = 0,
    o = 0;
  for (const r of rs) {
    const D = r.dmg;
    w += Math.max(0, D.wand || 0);
    c += Math.max(0, D.card || 0);
    a += Math.max(0, D.ally || 0);
    o += Math.max(0, (D.raw || 0) + (D.nullcard || 0));
  }
  const t = w + c + a + o || 1;
  return [pct(w / t), pct(c / t), pct(a / t), pct(o / t)];
};
console.log(
  'fights',
  R.length,
  'errors',
  R.filter(r => r.errors.length || r.pageErrors.length || r.res === 'error' || r.res === 'evalerror').length,
  'results',
  JSON.stringify(R.reduce((m, r) => ((m[r.res] = (m[r.res] || 0) + 1), m), {}))
);
console.log('\n## Win % / average fight length (s), all 6 decks, by depth');
console.log('| Bot | ' + depths.map(d => 'd' + d).join(' | ') + ' | All |');
console.log('|---|' + depths.map(() => '---').join('|') + '|---|');
for (const b of bots) {
  const row = depths.map(d => {
    const rs = R.filter(r => r.bot === b && r.depth === d);
    return rs.length
      ? pct(rs.filter(r => r.res === 'win').length / rs.length) + '/' + Math.round(avg(rs.map(r => r.time)))
      : '-';
  });
  const all = R.filter(r => r.bot === b);
  console.log(
    '| ' +
      b +
      ' | ' +
      row.join(' | ') +
      ' | ' +
      pct(all.filter(r => r.res === 'win').length / all.length) +
      '% |'
  );
}
console.log(
  '\n## Damage shares (wand / cast cards / creatures / other), taps and casts per minute, HP lost per fight'
);
console.log(
  '| Bot | Wand | Cards | Creatures | Other | Wand shots/min | Casts/min | HP lost | Threats missed |'
);
console.log('|---|---|---|---|---|---|---|---|---|');
for (const b of bots) {
  const rs = R.filter(r => r.bot === b),
    s = share(rs),
    mins = avg(rs.map(r => r.time)) / 60;
  console.log(
    '| ' +
      b +
      ' | ' +
      s.join('% | ') +
      '% | ' +
      avg(rs.filter(r => r.time > 0).map(r => r.wandShots / (r.time / 60))).toFixed(0) +
      ' | ' +
      avg(rs.filter(r => r.time > 0).map(r => r.casts / (r.time / 60))).toFixed(1) +
      ' | ' +
      avg(rs.map(r => r.dmgTaken)).toFixed(0) +
      ' | ' +
      (b === 'robot'
        ? '0'
        : pct(avg(rs.map(r => (r.threatsSeen ? r.missedThreats / r.threatsSeen : 0)))) + '%') +
      ' |'
  );
}
console.log('\n## Damage shares by depth band (wand/cards/creatures)');
for (const b of bots)
  console.log(
    b,
    [
      [1, 5],
      [8, 14],
      [16, 20],
      [30, 60]
    ]
      .map(
        ([a, z]) =>
          'd' +
          a +
          '-' +
          z +
          ': ' +
          share(R.filter(r => r.bot === b && r.depth >= a && r.depth <= z))
            .slice(0, 3)
            .join('/')
      )
      .join('   ')
  );
console.log('\n## Win % by deck');
console.log('| Bot | ' + decks.join(' | ') + ' |');
console.log('|---|' + decks.map(() => '---').join('|') + '|');
for (const b of bots)
  console.log(
    '| ' +
      b +
      ' | ' +
      decks
        .map(k => {
          const rs = R.filter(r => r.bot === b && r.deck === k);
          return pct(rs.filter(r => r.res === 'win').length / rs.length) + '%';
        })
        .join(' | ') +
      ' |'
  );
console.log('\n## What hurts the humans most (share of HP lost)');
for (const b of bots.slice(1)) {
  const m = {};
  let t = 0;
  for (const r of R.filter(r => r.bot === b))
    for (const [k, v] of Object.entries(r.hurtBy || {})) {
      const kk = k.split(':')[1] || k;
      m[kk] = (m[kk] || 0) + v;
      t += v;
    }
  console.log(
    b,
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => k + ' ' + pct(v / t) + '%')
      .join(', ')
  );
}
console.log('\n## Losses: what killed them (by enemy)');
for (const b of bots) {
  const m = {};
  for (const r of R.filter(r => r.bot === b && r.res === 'lose')) {
    const top = Object.entries(r.hurtBy || {}).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const k = top[0].split(':')[0];
      m[k] = (m[k] || 0) + 1;
    }
  }
  console.log(
    b,
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => k + ' ' + v)
      .join(', ')
  );
}
console.log('\n## Timeouts / stuck by depth');
for (const b of bots)
  console.log(
    b,
    JSON.stringify(
      R.filter(r => r.bot === b && r.res !== 'win' && r.res !== 'lose').map(
        r => r.deck + '@' + r.depth + ':' + r.res
      )
    )
  );
