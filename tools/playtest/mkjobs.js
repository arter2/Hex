// node mkjobs3.js <out.json> <bot> <fightsPerCell> <depths> <starters>
const fs = require('fs');
const H = o => ({ human: Object.assign({ reactMin: 0.3, tapMin: 0.25, blindTap: 0.1, chargeP: 0.08 }, o) });
const BOTS = {
  robot: { react: 0.3 },
  human_good: H({
    react: 0.5,
    reactSd: 0.12,
    notice: 0.92,
    fireRate: 2.2,
    focusPause: 0.2,
    evalGap: [0.2, 0.4],
    misTap: 0.04,
    comboSkill: 0.7,
    instantP: 0.8,
    castDelay: [0.3, 1],
    gaugeDelay: [0.4, 1.5]
  }),
  human_casual: H({
    react: 0.7,
    reactSd: 0.18,
    reactMin: 0.4,
    notice: 0.82,
    fireRate: 1.4,
    tapMin: 0.3,
    blindTap: 0.15,
    chargeP: 0.1,
    focusPause: 0.35,
    evalGap: [0.35, 0.6],
    misTap: 0.08,
    comboSkill: 0.35,
    instantP: 0.5,
    castDelay: [0.5, 2],
    gaugeDelay: [0.8, 3]
  })
};
const [, , name, bot, n, depths, starters] = process.argv;
const jobs = [];
let seed = 1;
for (const s of starters.split(',').map(Number))
  for (const d of depths.split(',').map(Number))
    for (let i = 0; i < +n; i++)
      jobs.push({
        starter: s,
        deck: ['burn_storm', 'frost_light', 'verd_shadow', 'fire_shadow', 'frost_storm', 'verd_light'][s],
        depth: d,
        botName: bot,
        bot: BOTS[bot],
        maxT: [8, 12, 16, 20].includes(d) ? 900 : 420,
        seed: seed++ * 7919 + d
      });
fs.writeFileSync(name, JSON.stringify(jobs));
console.log(name, jobs.length);
