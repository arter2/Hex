// node tools/playtest/run-runner.js <jobs.json> <out.jsonl>
require('./runner-common.js')
  .batch('run')
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
