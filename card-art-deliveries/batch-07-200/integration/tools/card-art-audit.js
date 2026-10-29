// Audit the files actually delivered, independently of production progress counts.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
let canvas;try{canvas=require('./card-art/node_modules/@napi-rs/canvas');}catch{canvas=require('@napi-rs/canvas');}
const directory=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Usage: node tools/card-art-audit.js <handoff-directory> [previous-card-images.json]');
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'card-images.json')));
const baseline=process.argv[3]||(manifest.batch===7?path.join(directory,'baseline-234-card-images.json'):null);
const previous=baseline?JSON.parse(fs.readFileSync(baseline)):null;
if(previous&&!Array.isArray(previous.cards))throw Error('Previous manifest must be the earlier delivery card-images.json, with a cards array');
async function main(){
 assert.equal(manifest.cards.length,manifest.uniqueCards);
 const ids=new Set(),hashes=new Set(),files=new Set(),destinations=new Set(),colours={};
 const oldIds=new Set(previous?.cards.map(c=>c.cardId)),oldHashes=new Set(previous?.cards.map(c=>c.master.sha256));
 let masters=0,crops=0;
 for(const c of manifest.cards){
  assert(!ids.has(c.cardId),'Duplicate card ID '+c.cardId);ids.add(c.cardId);
  assert(!hashes.has(c.master.sha256),'Duplicate master content '+c.cardId);hashes.add(c.master.sha256);
  assert(!oldIds.has(c.cardId),'Previously delivered card '+c.cardId);
  assert(!oldHashes.has(c.master.sha256),'Previously delivered artwork '+c.cardId);
  assert.equal(c.source.file,c.master.file);assert.equal(c.source.repositoryPath,c.master.repositoryPath);
  assert.equal(c.master.width,512);assert.equal(c.master.height,512);
  assert.equal(c.rendered.length,3);
  assert.deepEqual(c.rendered.map(o=>[o.width,o.height]).sort((a,b)=>a[0]-b[0]),[[128,88],[256,175],[512,350]]);
  colours[c.colour]=(colours[c.colour]||0)+1;
  for(const f of [c.master,...c.rendered]){
   const target=path.resolve(directory,f.file);
   assert(target.startsWith(directory+path.sep),'Unsafe path');
   assert(f.repositoryPath.startsWith('game/cards/art/'),'Unsafe repository destination');
   assert(!files.has(f.file),'Repeated image filename');files.add(f.file);
   assert(!destinations.has(f.repositoryPath),'Repeated repository destination');destinations.add(f.repositoryPath);
   const data=fs.readFileSync(target);
   assert.equal(data.length,f.bytes,'Wrong byte count '+f.file);
   assert.equal(crypto.createHash('sha256').update(data).digest('hex'),f.sha256,'Checksum mismatch '+f.file);
   let im;try{im=await canvas.loadImage(target);}catch(e){throw Error('Image decode failed for '+f.file+': '+e.message);}
   assert.equal(im.width,f.width,f.file);assert.equal(im.height,f.height,f.file);
   if(f===c.master){assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');masters++;}else crops++;
  }
 }
 function scan(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(path.join(folder,e.name)):[path.relative(directory,path.join(folder,e.name)).split(path.sep).join('/')]);}
 const actual=scan(directory).filter(f=>/\.(png|webp|jpg|jpeg)$/i.test(f));
 assert.equal(actual.length,files.size,'Unlisted or missing images in package');
 for(const f of actual)assert(files.has(f),'Unlisted image '+f);
 if(manifest.batch===7){assert.equal(masters,200);assert.equal(manifest.totalRegistered,434);assert.equal(Object.keys(colours).length,8);for(const n of Object.values(colours))assert.equal(n,25);}
 console.log(JSON.stringify({uniqueCards:ids.size,masters,crops,imagesDecoded:masters+crops,byColour:colours,checksums:'pass',dimensions:'pass',previousDeliveryDisjoint:previous?'pass':'not requested'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
