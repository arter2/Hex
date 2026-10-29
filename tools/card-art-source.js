// Prepare the editable 512-square source from a raw generation, before crop review.
'use strict';
const fs=require('fs'),path=require('path');
let canvas;try{canvas=require('./card-art/node_modules/@napi-rs/canvas');}catch{canvas=require('@napi-rs/canvas');}
const root=path.resolve(__dirname,'..');
async function main(){
 const [raw,id]=process.argv.slice(2);
 if(!raw||!id||!/^[a-z0-9_]+$/.test(id))throw Error('Usage: node tools/card-art-source.js <raw-path> <card-id>');
 const colours=['brown','fire','frost','gray','light','shadow','storm','verdant'];
 const known=colours.flatMap(c=>JSON.parse(fs.readFileSync(path.join(root,'docs/art-production',c+'.json'))));
 if(!known.some(c=>c.id===id))throw Error('Unknown card '+id);
 const relative='game/cards/art/masters/'+id+'.png',target=path.join(root,relative);
 if(fs.existsSync(target))throw Error('Editable source already exists; preserve it before replacing: '+relative);
 const im=await canvas.loadImage(raw),side=Math.min(im.width,im.height);
 const source=canvas.createCanvas(512,512),ctx=source.getContext('2d');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(im,(im.width-side)/2,(im.height-side)/2,side,side,0,0,512,512);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source.toBuffer('image/png'));
 console.log(JSON.stringify({editableSourcePath:relative,sourceSize:[512,512],sourceNative:[im.width,im.height]}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
