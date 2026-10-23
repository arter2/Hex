// node tools/playtest/mkruns.js <out.json> <runsPerColour> <maxFights> <maxDepth> [styles]
const fs=require('fs'); const [,,name,n,maxFights,maxDepth,styles0]=process.argv;
const H=o=>({stick:true, human:Object.assign({reactMin:.3,tapMin:.25,blindTap:.1,chargeP:.08,release:.35,releaseSd:.1},o)});
const BOT={
  average:H({react:.65,reactSd:.15,reactMin:.35,notice:.86,fireRate:1.7,focusPause:.3,evalGap:[.3,.5],misTap:.06,comboSkill:.45,instantP:.6,castDelay:[.4,1.5],gaugeDelay:[.6,2.2],stickNoise:12,releaseSd:.14,flickP:.35}),
  good:H({react:.5,reactSd:.12,notice:.92,fireRate:2.2,focusPause:.2,evalGap:[.2,.4],misTap:.04,comboSkill:.75,instantP:.85,castDelay:[.3,1],gaugeDelay:[.4,1.4],stickNoise:7,flickP:.6}),
  fast:Object.assign(H({react:.5,reactSd:.12,notice:.9,fireRate:2.8,focusPause:.12,evalGap:[.2,.35],misTap:.05,comboSkill:.5,instantP:.7,castDelay:[.15,.5],gaugeDelay:[.2,.8],stickNoise:9,flickP:.75}),{fear:.55}),
  combo:H({react:.55,reactSd:.13,notice:.9,fireRate:2.0,focusPause:.2,evalGap:[.2,.4],misTap:.05,comboSkill:1,instantP:.85,castDelay:[.3,1],gaugeDelay:[.4,1.4],stickNoise:8,flickP:.5})};
const LEANS=['fire','frost','storm','verdant','light','shadow'];
const jobs=[]; let seed=11; for(const st of (styles0||'average,good,fast,combo').split(',')) for(const lean of LEANS) for(let i=0;i<+n;i++) jobs.push({style:st, lean, bot:BOT[st], seed:seed++*977, maxFights:+maxFights, maxDepth:+maxDepth});
fs.writeFileSync(name,JSON.stringify(jobs)); console.log(name,jobs.length);
