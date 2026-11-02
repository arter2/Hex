// Refresh the shared production queue from exported assets, agent manifests and assigned batches.
'use strict';
const fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'../docs/art-production');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const colours=['brown','fire','frost','gray','light','shadow','storm','verdant'];
const catalogue=colours.flatMap(colour=>read(colour+'.json'));
const exported=new Map(read('export-report.json').assets.filter(a=>a.cardId).map(a=>[a.cardId,a]));
const generated=new Map(fs.readdirSync(dir).filter(f=>f.endsWith('-generated.json')).flatMap(read).filter(a=>a.status==='generated').map(a=>[a.cardId,a]));
const assigned=new Map();
for(const name of fs.readdirSync(dir).filter(f=>/^batch-\d+-assignments\.json$/.test(f))){
 const batch=read(name);
 for(const [colour,cards]of Object.entries(batch.assignments))for(const card of cards){
  if(assigned.has(card.id))throw Error('Repeated production assignment: '+card.id);
  assigned.set(card.id,{batch:batch.batch,colour});
 }
}
const known=new Set(catalogue.map(c=>c.id));
for(const id of [...generated.keys(),...assigned.keys(),...exported.keys()])if(!known.has(id))throw Error('Unknown production card: '+id);
const cards=catalogue.map(c=>{
 const assignment=assigned.get(c.id);
 if(assignment&&assignment.colour!==c.color)throw Error('Wrong colour assignment: '+c.id);
 return {...c,status:exported.has(c.id)?'reviewed-exported':generated.has(c.id)?'generated-awaiting-review':assignment?'assigned':'pending',source:exported.get(c.id)?.status||null,...(assignment?{batch:assignment.batch}:{})};
});
const count=status=>cards.filter(c=>c.status===status).length;
const active=count('reviewed-exported');
const result={catalogueVersion:179,total:cards.length,active,remaining:cards.length-active,pending:count('pending'),assigned:count('assigned'),awaitingReview:count('generated-awaiting-review'),countsByColour:Object.fromEntries(colours.map(colour=>[colour,cards.filter(c=>c.color===colour).length])),cards};
fs.writeFileSync(path.join(dir,'production-queue.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,cards:undefined}));
