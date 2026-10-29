// Technical review sheet: compare the intended wide crop and a small thumbnail before registration.
'use strict';
const fs=require('fs'),path=require('path');
let canvas;try{canvas=require('./card-art/node_modules/@napi-rs/canvas');}catch{canvas=require('@napi-rs/canvas');}
const {createCanvas,loadImage}=canvas,root=path.resolve(__dirname,'..');
async function main(){
 const batch=Number(process.argv[2]||2),output=path.resolve(process.argv[3]||`/tmp/hexmancers-batch-${batch}.jpg`);
 const dir=path.join(root,'docs/art-production');
 const all=fs.readdirSync(dir).filter(f=>f.endsWith('-generated.json')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f))).map(a=>({...a,colour:f.replace('-generated.json','')})));
 const rows=all.filter(a=>(a.batch||1)===batch&&a.status==='generated');
 if(!rows.length)throw Error('No generated images for batch '+batch);
 const focus=JSON.parse(fs.readFileSync(path.join(root,'game/cards/art-focus.json')));
 const [, ,w,h]=JSON.parse(fs.readFileSync(path.join(root,'game/cards/contract.json'))).bounds.art;
 const sheet=createCanvas(1120,Math.ceil(rows.length/4)*272),ctx=sheet.getContext('2d');
 ctx.fillStyle='#10151c';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='12px sans-serif';
 for(const [index,a]of rows.entries()){
  const canonical=path.join(root,'game/cards/art/masters',a.cardId+'.png');
  const source=a.editableSourcePath?path.resolve(root,a.editableSourcePath):(fs.existsSync(canonical)?canonical:(a.generatedPath||a.generatedLocalPath));
  const im=await loadImage(source&&fs.existsSync(source)?source:path.join(root,'game/cards/art/masters',a.cardId+'.png'));
  const master=im.width===512&&im.height===512?im:createCanvas(512,512),side=Math.min(im.width,im.height);
  if(master!==im){const m=master.getContext('2d');m.imageSmoothingQuality='high';m.drawImage(im,(im.width-side)/2,(im.height-side)/2,side,side,0,0,512,512);}
  const focal=focus[a.cardId]||(Array.isArray(a.focalPoint)?a.focalPoint:[.5,.5]);
  const height=512*h/w,y=Math.max(0,Math.min(512-height,focal[1]*512-height/2));
  const left=index%4*280,top=Math.floor(index/4)*272;
  ctx.imageSmoothingQuality='high';ctx.drawImage(master,0,y,512,height,left+8,top+8,264,264*h/w);
  ctx.fillStyle='#eee';ctx.fillText(a.name,left+8,top+202,264);
  ctx.drawImage(master,0,y,512,height,left+8,top+211,78,78*h/w);
  ctx.fillStyle='#b4bbc5';ctx.fillText(a.colour,left+100,top+232);
 }
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,sheet.toBuffer('image/jpeg',90));
 console.log(JSON.stringify({batch,images:rows.length,output}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
