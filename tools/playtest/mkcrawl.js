const U=require('./support.js');
// node tools/playtest/mkcrawl.js <out.json> <runsPerColour> <hours> <maxDepth> [styles] [colours]
// Whole careers in the real dungeon (crawl.js): the battle bots of mkruns.js plus how each style
// explores, solves puzzles, reads, spends and how much it puts up with.
const fs=require('fs'); const [,,name,n,hours,maxDepth,styles0,leans0]=process.argv;
const {FIGHT,MAP}=require('./mkcrawl-profiles.js');
const LEANS=['fire','frost','storm','verdant','light','shadow'];
const jobs=[]; for(const st of (styles0||'average,good,fast,combo,shopaholic').split(',')) for(const lean of (leans0?leans0.split(','):LEANS)) for(let i=0;i<+n;i++)
  jobs.push({...U.scenario(st,lean,i),replicate:i,label:st, lean, bot:FIGHT[st], p:MAP[st], hours:+hours, maxDepth:+maxDepth});
if(!Number.isInteger(+n)||+n<1||!(+hours>0)||!(+maxDepth>=1))throw Error('Expected positive run count, hours and maxDepth');
for(const j of jobs)if(!j.bot||!j.p||!LEANS.includes(j.lean))throw Error('Unknown style or colour');
U.assertJobs(jobs);fs.writeFileSync(name,JSON.stringify(jobs)); console.log(name,jobs.length);

