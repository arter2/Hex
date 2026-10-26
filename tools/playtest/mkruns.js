const U = require('./support.js');
// node tools/playtest/mkruns.js <out.json> <runsPerColour> <maxFights> <maxDepth> [styles]
const fs = require('fs');
const [, , name, n, maxFights, maxDepth, styles0] = process.argv;
const H = o => ({
  stick: true,
  human: Object.assign(
    { reactMin: 0.3, tapMin: 0.25, blindTap: 0.1, chargeP: 0.08, release: 0.35, releaseSd: 0.1 },
    o
  )
});
const BOT = {
  average: H({
    react: 0.65,
    reactSd: 0.15,
    reactMin: 0.35,
    notice: 0.86,
    fireRate: 1.7,
    focusPause: 0.3,
    evalGap: [0.3, 0.5],
    misTap: 0.06,
    comboSkill: 0.45,
    instantP: 0.6,
    castDelay: [0.4, 1.5],
    gaugeDelay: [0.6, 2.2],
    stickNoise: 12,
    releaseSd: 0.14,
    flickP: 0.35
  }),
  good: H({
    react: 0.5,
    reactSd: 0.12,
    notice: 0.92,
    fireRate: 2.2,
    focusPause: 0.2,
    evalGap: [0.2, 0.4],
    misTap: 0.04,
    comboSkill: 0.75,
    instantP: 0.85,
    castDelay: [0.3, 1],
    gaugeDelay: [0.4, 1.4],
    stickNoise: 7,
    flickP: 0.6
  }),
  fast: Object.assign(
    H({
      react: 0.5,
      reactSd: 0.12,
      notice: 0.9,
      fireRate: 2.8,
      focusPause: 0.12,
      evalGap: [0.2, 0.35],
      misTap: 0.05,
      comboSkill: 0.5,
      instantP: 0.7,
      castDelay: [0.15, 0.5],
      gaugeDelay: [0.2, 0.8],
      stickNoise: 9,
      flickP: 0.75
    }),
    { fear: 0.55 }
  ),
  combo: H({
    react: 0.55,
    reactSd: 0.13,
    notice: 0.9,
    fireRate: 2.0,
    focusPause: 0.2,
    evalGap: [0.2, 0.4],
    misTap: 0.05,
    comboSkill: 1,
    instantP: 0.85,
    castDelay: [0.3, 1],
    gaugeDelay: [0.4, 1.4],
    stickNoise: 8,
    flickP: 0.5
  })
};
// the random player: no dodging, no combos, casts and taps as cards come, a careless thumb (the mastery gap's floor)
BOT.random = Object.assign(
  H({
    react: 0.9,
    reactSd: 0.2,
    notice: 0.5,
    fireRate: 1.5,
    focusPause: 0.3,
    evalGap: [0.4, 0.9],
    misTap: 0.15,
    comboSkill: 0,
    instantP: 0.3,
    castDelay: [0.2, 1],
    gaugeDelay: [0.5, 2],
    stickNoise: 20,
    flickP: 0
  }),
  { random: true, dodge: false, combos: false, smartCast: false, aim: false }
);
BOT.shopaholic = BOT.good;
const LEANS = ['fire', 'frost', 'storm', 'verdant', 'light', 'shadow'];
const jobs = [];
let seed = 11;
for (const st of (styles0 || 'average,good,fast,combo,shopaholic').split(','))
  for (const lean of LEANS)
    for (let i = 0; i < +n; i++)
      jobs.push({
        ...U.scenario(st, lean, i),
        replicate: i,
        style: st === 'shopaholic' ? 'good' : st === 'random' ? 'average' : st,
        label: st,
        shopaholic: st === 'shopaholic',
        lean,
        bot: BOT[st],
        maxFights: +maxFights,
        maxDepth: +maxDepth
      });
if (!Number.isInteger(+n) || +n < 1 || !(+maxFights > 0) || !(+maxDepth >= 1))
  throw Error('Expected positive run count, fights and maxDepth');
for (const j of jobs) if (!j.bot) throw Error('Unknown style');
U.assertJobs(jobs);
fs.writeFileSync(name, JSON.stringify(jobs));
console.log(name, jobs.length);
