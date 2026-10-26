// node tools/playtest/crawl-runner.js <jobs.json> <out.jsonl>
require('./runner-common.js').batch('crawl').catch(e=>{console.error(e);process.exitCode=1;});
