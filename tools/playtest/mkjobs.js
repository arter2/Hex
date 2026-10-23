// node mkjobs3.js <out.json> <bot> <fightsPerCell> <depths> <starters>
const fs=require('fs');
const H=(o)=>({human:Object.assign({reactMin:.3,tapMin:.25,blindTap:.1,chargeP:.08},o)});
const BOTS={robot:{react:.3},
  human_good:H({react:.5,reactSd:.12,notice:.92,fireRate:2.2,focusPause:.2,evalGap:[.2,.4],misTap:.04,comboSkill:.7,instantP:.8,castDelay:[.3,1],gaugeDelay:[.4,1.5]}),
  human_casual:H({react:.7,reactSd:.18,reactMin:.4,notice:.82,fireRate:1.4,tapMin:.3,blindTap:.15,chargeP:.1,focusPause:.35,evalGap:[.35,.6],misTap:.08,comboSkill:.35,instantP:.5,castDelay:[.5,2],gaugeDelay:[.8,3]})};
const [,,name,bot,n,depths,starters]=process.argv; const jobs=[]; let seed=1;
for(const s of starters.split(',').map(Number)) for(const d of depths.split(',').map(Number)) for(let i=0;i<+n;i++)
  jobs.push({starter:s, deck:['burn_storm','frost_light','verd_shadow','fire_shadow','frost_storm','verd_light'][s], depth:d, botName:bot, bot:BOTS[bot], maxT:[8,12,16,20].includes(d)?900:420, seed:seed++*7919+d});
fs.writeFileSync(name,JSON.stringify(jobs)); console.log(name,jobs.length);
