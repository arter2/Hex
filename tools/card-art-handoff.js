// Prepare a named, verifiable handoff directory. This deliberately does not create a ZIP.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const dest=path.resolve(process.argv[2]||'/workspace/card-art-handoff');
if(dest===root||dest.startsWith(root+path.sep))throw Error('Prepare the transfer directory outside the repository');
const min=Number(process.argv[3]||200);
const batchArg=process.argv.slice(4).find(a=>a.startsWith('--batch='));
const batch=batchArg?Number(batchArg.slice('--batch='.length)):null;
if(batchArg&&(!Number.isInteger(batch)||batch<1))throw Error('--batch must be a positive integer');
const all=process.argv.slice(4).includes('--all');
if(Boolean(batchArg)===all)throw Error('Choose an explicit scope: --batch=<number> for new artwork, or --all for the combined collection');
const report=JSON.parse(fs.readFileSync(path.join(root,'docs/art-production/export-report.json')));
const colours=['brown','fire','frost','gray','light','shadow','storm','verdant'];
const catalogue=colours.flatMap(c=>JSON.parse(fs.readFileSync(path.join(root,'docs/art-production',c+'.json'))));
const known=new Map(catalogue.map(c=>[c.id,c]));
const production=path.join(root,'docs/art-production');
const planPath=batch?path.join(production,'batch-'+String(batch).padStart(2,'0')+'-assignments.json'):null;
const assignment=planPath&&fs.existsSync(planPath)?JSON.parse(fs.readFileSync(planPath)):null;
const plan=assignment&&Number.isInteger(assignment.startingActive)&&Number.isInteger(assignment.targetActive)?assignment:null;
const generated=new Map(fs.readdirSync(production).filter(f=>f.endsWith('-generated.json')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(production,f)))).filter(a=>a.status==='generated').map(a=>[a.cardId,a]));
const supplied=new Map(JSON.parse(fs.readFileSync(path.join(root,'docs/named-card-art-mapping.json'))).files.filter(a=>a.status==='selected').map(a=>[a.cardId,a.file]));
const registered=report.assets.filter(a=>a.cardId);
const active=registered.filter(a=>!batch||(generated.has(a.cardId)&&(generated.get(a.cardId).batch||1)===batch));
if(!Number.isInteger(min)||min<1||active.length<min)throw Error('Handoff needs at least '+min+' unique cards; exported '+active.length);
if(plan&&active.length!==plan.targetNewImages)throw Error('Batch needs exactly '+plan.targetNewImages+' new cards');
if(plan&&registered.length!==plan.targetActive)throw Error('Combined registry does not match batch target');
if(plan){
 const expected=new Set(Object.values(plan.assignments).flat().map(c=>c.id));
 if(expected.size!==active.length||active.some(a=>!expected.has(a.cardId)))throw Error('Exported batch IDs do not match the exact assignments');
}
if(new Set(active.map(a=>a.cardId)).size!==active.length)throw Error('Duplicate active card ID');
const slug=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const names=new Set();
function transfer(source,relative,repositoryPath,width,height){
 const file=path.join(root,source),bytes=fs.readFileSync(file),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 const target=path.resolve(dest,relative);
 if(!target.startsWith(dest+path.sep)||!repositoryPath.startsWith('game/cards/art/'))throw Error('Unsafe handoff path');
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
 return {file:relative,repositoryPath,width,height,sha256,bytes:bytes.length};
}
const cards=active.map(a=>{
 const c=known.get(a.cardId);if(!c)throw Error('Unknown card '+a.cardId);
 const name=slug(c.name)+'--'+c.id;if(names.has(name))throw Error('Repeated delivery name '+name);names.add(name);
 const g=generated.get(c.id),source=g?{kind:'generated',batch:g.batch||1,originalProductionPath:g.generatedPath||g.generatedLocalPath}:{kind:'supplied',originalProductionPath:'game/cards/art/'+supplied.get(c.id)};
 const master=transfer('game/'+a.master,'masters/'+c.color+'/'+name+'.png','game/'+a.master,512,512);
 Object.assign(source,{file:master.file,repositoryPath:master.repositoryPath,width:512,height:512});
 return {cardId:c.id,cardName:c.name,colour:c.color,type:c.type,source,sourceStatus:a.status,sourceNative:a.sourceNative,legacyUpscaled:a.legacyUpscaled,focalPoint:a.focalPoint,
  master,
  rendered:a.outputs.map(o=>transfer('game/'+o.url,'rendered/'+c.color+'/'+name+'-'+o.width+'.webp','game/'+o.url,o.width,o.height))};
});
if(new Set(cards.map(c=>c.master.sha256)).size!==cards.length)throw Error('Two card records share identical master image content; resolve before handoff');
const manifest={format:1,uniqueCards:cards.length,totalRegistered:registered.length,batch,sourceSize:[512,512],masterSize:[512,512],artWindow:report.artWindow,minimumRequested:min,cards};
if(plan){
 manifest.expectations={uniqueCards:plan.targetNewImages,totalRegistered:plan.targetActive,byColour:Object.fromEntries(Object.entries(plan.assignments).map(([colour,assigned])=>[colour,assigned.length]))};
 manifest.assignmentFile='integration/docs/art-production/batch-'+String(batch).padStart(2,'0')+'-assignments.json';
 manifest.baselineManifest='baseline-'+plan.startingActive+'-card-images.json';
 fs.copyFileSync(path.join(production,'delivery-'+plan.startingActive+'-card-images.json'),path.join(dest,manifest.baselineManifest));
}
fs.writeFileSync(path.join(dest,'card-images.json'),JSON.stringify(manifest,null,2)+'\n');
fs.copyFileSync(path.join(root,'docs/art-production/README_FOR_CLAUDE.md'),path.join(dest,'README_FOR_CLAUDE.md'));
const files=['game/cards/art-variants.js','game/cards/illustrations.js','game/art-review.html','docs/named-card-art-mapping.json','docs/named-card-art.md','tools/card-art-build.js','tools/card-art-source.js','tools/card-art-check.js','tools/card-art-audit.js','tools/card-art-queue.js','tools/card-art-contact-sheet.js','tools/card-art-packets.js','tools/card-art-handoff.js','tools/card-art-locate.py','tools/package-art-test.py','tools/card-art/package.json','tools/card-art/.gitignore'];
for(const file of files){const target=path.join(dest,'integration',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
fs.cpSync(path.join(root,'docs/art-production'),path.join(dest,'integration/docs/art-production'),{recursive:true});
console.log(JSON.stringify({directory:dest,uniqueCards:cards.length,images:cards.length*4,zipCreated:false}));
