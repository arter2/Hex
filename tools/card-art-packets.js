// Parent-owned packet ledger; artists never modify shared assignments or this state.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=path.resolve(__dirname,'../docs/art-production');
const batch=Number(process.argv[2]),command=process.argv[3]||'status';
if(!Number.isInteger(batch)||batch<1)throw Error('Usage: node tools/card-art-packets.js <batch> [status|assign <worker> <packet>|complete <worker>]');
const prefix='batch-'+String(batch).padStart(2,'0');
const packets=JSON.parse(fs.readFileSync(path.join(dir,prefix+'-packets.json'))).packets;
const statePath=path.join(dir,prefix+'-worker-state.json');
const state=JSON.parse(fs.readFileSync(statePath));
const records=fs.readdirSync(dir).filter(f=>f.endsWith('-generated.json')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f)))).filter(a=>a.status==='generated');
const saved=new Set(records.map(a=>a.cardId)),byId=new Map(records.map(a=>[a.cardId,a]));
const known=new Map(packets.map(p=>[p.packet,p]));
const count=p=>p.cards.filter(c=>saved.has(c.id)).length;
const [worker,packetId]=process.argv.slice(4);
if(command==='complete'){
 const current=state.workers[worker],p=current&&known.get(current.packet);
 if(!p||current.state!=='running'||count(p)!==p.cards.length)throw Error('Worker packet is not fully saved: '+worker);
 state.reviewedSources=state.reviewedSources||{};
 for(const c of p.cards){
  const a=byId.get(c.id),relative='game/cards/art/masters/'+c.id+'.png';
  if(a.name!==c.name||a.batch!==batch||a.editableSourcePath!==relative||!Array.isArray(a.focalPoint)||a.focalPoint.length!==2)throw Error('Incorrect source metadata: '+c.id);
  const png=fs.readFileSync(path.resolve(dir,'../..',relative));
  if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)!==512||png.readUInt32BE(20)!==512)throw Error('Source is not a 512-square PNG: '+c.id);
  state.reviewedSources[c.id]={file:relative,sha256:crypto.createHash('sha256').update(png).digest('hex')};
 }
 if(!state.completedPackets.includes(p.packet))state.completedPackets.push(p.packet);
 current.state='idle';
}else if(command==='assign'){
 const p=known.get(packetId);
 if(!p||!worker||state.completedPackets.includes(packetId)||count(p)===p.cards.length)throw Error('Unknown or already completed packet');
 if(state.workers[worker]?.state==='running')throw Error('Worker already has a running packet');
 for(const [name,w]of Object.entries(state.workers))if(w.state==='running'&&known.get(w.packet).colour===p.colour)throw Error('Colour is owned by '+name);
 state.workers[worker]={packet:packetId,state:'running'};
}else if(command!=='status')throw Error('Unknown command '+command);
if(command!=='status'){const temp=statePath+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n');fs.renameSync(temp,statePath);}
const busyColours=new Set(Object.values(state.workers).filter(w=>w.state==='running').map(w=>known.get(w.packet).colour));
const suggestions={};
for(const [name,w]of Object.entries(state.workers))if(w.state==='idle'){
 const next=packets.find(p=>!state.completedPackets.includes(p.packet)&&count(p)<p.cards.length&&!busyColours.has(p.colour));
 if(next){suggestions[name]=next.packet;busyColours.add(next.colour);}
}
const byColour={};
for(const p of packets)byColour[p.colour]=(byColour[p.colour]||0)+count(p);
console.log(JSON.stringify({batch,generated:Object.values(byColour).reduce((a,b)=>a+b,0),target:packets.reduce((n,p)=>n+p.cards.length,0),reviewedPackets:state.completedPackets.length,byColour,workers:Object.fromEntries(Object.entries(state.workers).map(([name,w])=>[name,{...w,saved:count(known.get(w.packet))}])),suggestions}));
