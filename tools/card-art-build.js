// Technical export pipeline: preserve originals; normalize editable masters and render-sized crops.
// npm install --prefix tools/card-art --no-package-lock
// node tools/card-art-build.js
// Also packs the crops into per-colour atlas sheets (game/cards/art/atlas): a full-card sheet from the 512 crop and
// a thumbnail sheet from the 256 crop, at most ATLAS_MAX cards each, so the game loads a few sheets instead of
// hundreds of files. Each cell is drawn straight from the master like its crop, so the art is encoded only once.
// Sheets are WebP 85 (chosen against 96 by eye on the compression proof; about 40% smaller). The loose crops stay 96/93.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const ATLAS_MAX=30, ATLAS_COLS=6, ATLAS_PAD=4, ATLAS_SIZES={full:[512,85],thumb:[256,85]};
let canvas;
try { canvas=require(process.env.CARD_ART_CANVAS_MODULE||'./card-art/node_modules/@napi-rs/canvas'); }
catch (error) {
 try { canvas=require('@napi-rs/canvas'); }
 catch (_) { throw Error('Install export dependencies: npm install --prefix tools/card-art --no-package-lock', {cause:error}); }
}
const {createCanvas,loadImage}=canvas;
async function main(){
 const batchArg=process.argv.slice(2).find(arg=>arg.startsWith('--through-batch='));
 const throughBatch=batchArg?Number(batchArg.split('=')[1]):Infinity;
 if(batchArg&&(!Number.isInteger(throughBatch)||throughBatch<1))throw Error('--through-batch must be a positive integer');
 const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'game/cards/contract.json')));
 const [, ,aw,ah]=contract.bounds.art,ratio=aw/ah;
 const mapping=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/named-card-art-mapping.json')));
 const existing=mapping.files.map(f=>{const key=path.basename(f.file,'.png'),editable=path.join(ROOT,'game/cards/art/masters',key+'.png'),fromMaster=fs.existsSync(editable);return {key,source:fromMaster?editable:path.join(ROOT,'game/cards/art',f.file),fromMaster,cardId:f.status==='selected'?f.cardId:null,status:f.status,focalPoint:[.5,.5]};});
 const production=path.join(ROOT,'docs/art-production');
 const reportFile=path.join(production,'export-report.json');
 const previous=new Map((fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile)).assets:[]).map(a=>[a.key,a]));
 // each generated card's colour is the colour file that lists it (brown-generated.json and so on)
 const generated=fs.readdirSync(production).filter(f=>f.endsWith('-generated.json')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(production,f))).map(g=>Object.assign(g,{colour:f.replace('-generated.json','')}))).filter(g=>g.status==='generated'&&(g.batch||1)<=throughBatch);
 const jobs=[...existing,...generated.map(g=>{const canonical=path.join(ROOT,'game/cards/art/masters',g.cardId+'.png'),editable=g.editableSourcePath?path.resolve(ROOT,g.editableSourcePath):(fs.existsSync(canonical)?canonical:null),original=g.generatedPath||g.generatedLocalPath,fromOriginal=!editable&&original&&fs.existsSync(original);return {key:g.cardId,colour:g.colour,source:editable||(fromOriginal?original:canonical),fromMaster:!fromOriginal,nativeOverride:g.sourceNative,cardId:g.cardId,status:'generated',focalPoint:Array.isArray(g.focalPoint)?g.focalPoint:[.5,.5]};})];
 const focusFile=path.join(ROOT,'game/cards/art-focus.json'),focus=fs.existsSync(focusFile)?JSON.parse(fs.readFileSync(focusFile)):{};
 const masterDir=path.join(ROOT,'game/cards/art/masters'),displayDir=path.join(ROOT,'game/cards/art/display');
 fs.mkdirSync(masterDir,{recursive:true});fs.mkdirSync(displayDir,{recursive:true});
 const report=[],variants={},cells=[];
 for(const j of jobs){
  if(!j.source||!fs.existsSync(j.source))throw Error('Missing source for '+j.key);
  const focal=focus[j.cardId]||j.focalPoint;
  const im=await loadImage(j.source);
  if(j.fromMaster&&(im.width!==512||im.height!==512))throw Error('Editable source must be 512x512: '+j.key);
  const side=Math.min(im.width,im.height);
  const master=j.fromMaster?im:createCanvas(512,512);
  if(!j.fromMaster){const m=master.getContext('2d');m.imageSmoothingEnabled=true;m.imageSmoothingQuality='high';m.drawImage(im,(im.width-side)/2,(im.height-side)/2,side,side,0,0,512,512);}
  const ch=512/ratio,y=Math.max(0,Math.min(512-ch,focal[1]*512-ch/2));
  const result={sourceWidth:im.width,sourceHeight:im.height,upscaled:side<512,crop:[0,y,512,ch]};
  const masterPath=path.join(masterDir,j.key+'.png');
  if(!j.fromMaster)fs.writeFileSync(masterPath,master.toBuffer('image/png'));
  else if(path.resolve(j.source)!==masterPath)fs.copyFileSync(j.source,masterPath);
  const sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(masterPath)).digest('hex');
  const origin=j.fromMaster&&previous.get(j.key);
  const cached=origin&&origin.sourceSha256===sourceSha256&&JSON.stringify(origin.crop)===JSON.stringify(result.crop)&&JSON.stringify(origin.focalPoint)===JSON.stringify(focal)&&origin.outputs?.length===3&&origin.outputs.every((o,i)=>o.width===[128,256,512][i]&&o.height===Math.round(o.width/ratio)&&fs.existsSync(path.join(ROOT,'game',o.url)));
  const outputs=cached?origin.outputs:[128,256,512].map(width=>{
   const height=Math.round(width/ratio),c=createCanvas(width,height),x=c.getContext('2d');
   x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
   x.drawImage(master,0,y,512,ch,0,0,width,height);
   const name=j.key+'-'+width+'.webp';
   fs.writeFileSync(path.join(displayDir,name),c.toBuffer('image/webp',width===512?96:93));
   return {width,height,url:'cards/art/display/'+name};
  });
  const entry={master:'cards/art/masters/'+j.key+'.png',large:outputs[2].url,thumbnail:outputs[0].url,outputs,focalPoint:focal,sourceNative:origin?origin.sourceNative:(j.nativeOverride||[result.sourceWidth,result.sourceHeight]),legacyUpscaled:origin?origin.legacyUpscaled:(j.nativeOverride?Math.min(...j.nativeOverride)<512:result.upscaled)};
  if(j.cardId){if(variants[j.cardId])throw Error('Duplicate generated/registered card '+j.cardId);variants[j.cardId]=entry;cells.push({id:j.cardId,colour:j.colour||j.cardId.split('_')[0],master,y,ch});}
  report.push({key:j.key,cardId:j.cardId,status:j.status,...entry,sourceSha256,crop:result.crop});
 }
 // the atlas sheets: per colour, in card id order, ATLAS_COLS wide and at most ATLAS_MAX cards a sheet. Each cell has an
 // ATLAS_PAD border copied from its own edge pixels, so a sheet scaled down never bleeds a neighbour into a card.
 // A card's entry gives the CSS background-size and -position (percent of the art slot) that show its cell.
 const atlasDir=path.join(ROOT,'game/cards/art/atlas'); fs.rmSync(atlasDir,{recursive:true,force:true}); fs.mkdirSync(atlasDir,{recursive:true});
 const byColour={}; for(const c of cells) (byColour[c.colour]=byColour[c.colour]||[]).push(c);
 const sheets=[], pct=v=>+(v*100).toFixed(4);
 for(const colour of Object.keys(byColour).sort()){
  const list=byColour[colour].sort((a,b)=>a.id<b.id?-1:1);
  for(let n=0;n*ATLAS_MAX<list.length;n++){
   const part=list.slice(n*ATLAS_MAX,(n+1)*ATLAS_MAX), cols=Math.min(ATLAS_COLS,part.length), rows=Math.ceil(part.length/cols), name=colour+'-'+(n+1);
   for(const [kind,[w,quality]] of Object.entries(ATLAS_SIZES)){
    const h=Math.round(w/ratio),g=ATLAS_PAD,pw=w+2*g,ph=h+2*g,W=cols*pw,H=rows*ph,c=createCanvas(W,H),x=c.getContext('2d');
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    part.forEach((p,i)=>{
     const x0=(i%cols)*pw+g,y0=Math.floor(i/cols)*ph+g;
     x.drawImage(p.master,0,p.y,512,p.ch,x0,y0,w,h);
     x.drawImage(c,x0,y0,1,h,x0-g,y0,g,h); x.drawImage(c,x0+w-1,y0,1,h,x0+w,y0,g,h);   // left and right edges, stretched out
     x.drawImage(c,x0-g,y0,pw,1,x0-g,y0-g,pw,g); x.drawImage(c,x0-g,y0+h-1,pw,1,x0-g,y0+h,pw,g);   // then top and bottom, corners too
     const url='cards/art/atlas/'+name+'-'+kind+'.webp';
     (variants[p.id].atlas=variants[p.id].atlas||{})[kind]={url,size:[pct(W/w),pct(H/h)],pos:[W>w?pct(x0/(W-w)):0,H>h?pct(y0/(H-h)):0]};
    });
    fs.writeFileSync(path.join(atlasDir,name+'-'+kind+'.webp'),c.toBuffer('image/webp',quality));
    sheets.push({name:name+'-'+kind,width:W,height:H});
   }
  }
 }
 fs.writeFileSync(path.join(ROOT,'game/cards/art-variants.js'),'// Generated by tools/card-art-build.js. Full editable masters and responsive crops.\nconst HEX_CARD_ART_VARIANTS=Object.freeze('+JSON.stringify(variants,null,2)+');\n');
 fs.writeFileSync(path.join(ROOT,'docs/art-production/export-report.json'),JSON.stringify({master:[512,512],artWindow:[aw,ah],safeCrop:[0,(512-512/ratio)/2,512,512/ratio],innerActionSafe:[24,105,464,302],assets:report},null,2)+'\n');
 console.log(JSON.stringify({sources:jobs.length,registered:Object.keys(variants).length,masters:'512x512',outputs:[128,256,512],legacyUpscaled:report.filter(r=>r.legacyUpscaled).length,atlasSheets:sheets.length,biggestSheet:sheets.reduce((m,s)=>s.width*s.height>m.width*m.height?s:m,{width:0,height:0})}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
