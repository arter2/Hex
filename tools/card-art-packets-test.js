// Exercise the CLI code against isolated production fixtures; no images or network required.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const vm=require('vm');
const colours=['brown','fire','frost','gray','light','shadow','storm','verdant'];
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hex-art-dispatch-'));
const dir=path.join(temp,'docs/art-production'),cli=path.join(temp,'tools/card-art-packets.js');
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.dirname(cli),{recursive:true});
fs.copyFileSync(path.join(__dirname,'card-art-packets.js'),cli);
// Group by colour deliberately: selection must not depend on a wave-major file order.
const packets=colours.flatMap(colour=>Array.from({length:5},(_,n)=>({packet:colour+'-'+String(n+1).padStart(2,'0'),colour,cards:Array.from({length:5},(_,i)=>({id:colour+'_'+n+'_'+i,name:colour+' card '+n+'/'+i}))})));
const stateFile=path.join(dir,'batch-01-worker-state.json');
function fixture(savedPackets=[],extras=[],reviewed=savedPackets){
 const records=[...packets.filter(p=>savedPackets.includes(p.packet)).flatMap(p=>p.cards),...extras].map(c=>({cardId:c.id,status:'generated'}));
 fs.writeFileSync(path.join(dir,'batch-01-packets.json'),JSON.stringify({batch:1,packets}));
 fs.writeFileSync(path.join(dir,'test-generated.json'),JSON.stringify(records));
 fs.writeFileSync(stateFile,JSON.stringify({batch:1,workers:Object.fromEntries(colours.slice(0,6).map((c,i)=>['worker'+i,{packet:c+'-01',state:'idle'}])),completedPackets:reviewed,reviewedSources:{}}));
}
function run(...args){
 let stdout='';
 try{
  vm.runInNewContext(fs.readFileSync(cli,'utf8'),{require,__dirname:path.dirname(cli),process:{argv:[process.execPath,cli,'1',...args]},console:{log:s=>{stdout+=s+'\n';}}},{filename:cli});
  return {status:0,stdout,stderr:''};
 }catch(error){return {status:1,stdout,stderr:error.message};}
}
function dispatch(worker){const r=run('assign-next',worker);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
let checks=0;
try{
 const firstSix=colours.slice(0,6).map(c=>c+'-01');
 fixture(firstSix);
 assert.equal(dispatch('worker0').assigned.packet,'storm-01');
 assert.equal(dispatch('worker1').assigned.packet,'verdant-01');
 assert.equal(dispatch('worker2').assigned.packet,'brown-02');
 checks++;

 // A running artist cannot claim a second job, nor can another writer claim its colour.
 const before=fs.readFileSync(stateFile,'utf8');
 const busyWorker=run('assign-next','worker0');
 assert.notEqual(busyWorker.status,0);assert.match(busyWorker.stderr,/already has a running packet/);
 const busyColour=run('assign','worker3','storm-02');
 assert.notEqual(busyColour.status,0);assert.match(busyColour.stderr,/Colour is owned/);
 assert.equal(fs.readFileSync(stateFile,'utf8'),before);
 checks++;

 // Resuming a partial packet offers only its missing cards, avoiding duplicate renders.
 const light=packets.find(p=>p.packet==='light-01');
 fixture(packets.filter(p=>p.colour!=='light').map(p=>p.packet),light.cards.slice(0,2));
 const partial=dispatch('worker0').assigned;
 assert.equal(partial.packet,'light-01');assert.equal(partial.cards.length,5);
 assert.deepEqual(partial.pendingCards,light.cards.slice(2));
 checks++;

 // Fully saved work still needs review; lack of new jobs must not imply acceptance.
 fixture(packets.map(p=>p.packet),[],[]);
 const awaiting=fs.readFileSync(stateFile,'utf8'),allSaved=dispatch('worker0');
 assert.equal(allSaved.assigned,null);assert.equal(allSaved.generated,200);assert.equal(allSaved.reviewedPackets,0);
 assert.equal(fs.readFileSync(stateFile,'utf8'),awaiting);
 checks++;

 fixture(packets.map(p=>p.packet));
 const complete=fs.readFileSync(stateFile,'utf8');
 assert.equal(dispatch('worker0').assigned,null);
 assert.equal(fs.readFileSync(stateFile,'utf8'),complete);
 checks++;
 fixture();
 const pausedState=JSON.parse(fs.readFileSync(stateFile,'utf8'));
 pausedState.generationPause={errorCode:'usage_limit_reached',resetAtUTC:'2026-10-30T21:33:05Z'};
 fs.writeFileSync(stateFile,JSON.stringify(pausedState));
 const paused=fs.readFileSync(stateFile,'utf8'),blocked=run('assign-next','worker0');
 assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/Image generation paused/);
 assert.equal(fs.readFileSync(stateFile,'utf8'),paused);
 const status=JSON.parse(run('status').stdout);
 assert.deepEqual(status.suggestions,{});assert.equal(status.generationPause.errorCode,'usage_limit_reached');
 checks++;
 console.log(JSON.stringify({checks,balancedColours:'pass',exclusiveWriters:'pass',resumeWithoutDuplicates:'pass',reviewRequired:'pass',completedQueue:'pass',usagePause:'pass'}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
