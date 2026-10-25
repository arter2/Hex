// node tools/playtest/runner.js <jobs.json> <out.jsonl>
require('./runner-common.js').batch('fight').catch(e=>{console.error(e);process.exitCode=1;});
