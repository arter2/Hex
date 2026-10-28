// Asset integrity and actual card markup checks. No browser layout claims.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'..');
let canvas;try{canvas=require('./card-art/node_modules/@napi-rs/canvas');}catch{canvas=require('@napi-rs/canvas');}
const read=f=>fs.readFileSync(path.join(ROOT,'game',f),'utf8');
class Element {
 constructor(){this.style={setProperty(){}};this.dataset={};this.classList={add(){},toggle(){}};this.innerHTML='';}
 querySelector(){return null;} querySelectorAll(){return [];}
 insertAdjacentHTML(_,html){this.innerHTML+=html;}
}
const ctx=vm.createContext({console,document:{createElement:()=>new Element(),querySelectorAll:()=>[]},addEventListener(){},requestAnimationFrame:()=>1});
for(const f of ['cardsets.js','creatures.js','strikes.js','kinds.js','cards.js','cards/icons.js','cards/illustrations.js','cards/art-variants.js','art.js'])vm.runInContext(read(f),ctx,{filename:f});
vm.runInContext("const save={seen:{},owned:{}};const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));",ctx);
const ui=read('ui.js');vm.runInContext(ui.slice(ui.indexOf('const CARD_PAL='),ui.indexOf('function showDetail(')),ctx);
async function main(){
 const variants=vm.runInContext('HEX_CARD_ART_VARIANTS',ctx),cards=vm.runInContext('CARDS',ctx);
 const report=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/art-production/export-report.json')));
 let decoded=0,rendered=0;
 for(const a of report.assets){
  const master=await canvas.loadImage(path.join(ROOT,'game',a.master));assert.equal(master.width,512);assert.equal(master.height,512);decoded++;
  for(const o of a.outputs){const im=await canvas.loadImage(path.join(ROOT,'game',o.url));assert.equal(im.width,o.width);assert.equal(im.height,o.height);decoded++;}
 }
 for(const [id,v]of Object.entries(variants)){
  assert(cards[id],'Unrecognized card '+id);assert.equal(ctx.cardIllustration(cards[id]),v.large);assert.equal(ctx.artURL(cards[id]),v.large);
  ctx.testCard=cards[id];
  for(const mode of ['compact','expanded']){
   const el=vm.runInContext(`cardEl(testCard,'',false,'${mode}')`,ctx);assert(el.innerHTML.includes('class="k-art illustrated"'));assert(el.innerHTML.includes('srcset="'+v.outputs.map(o=>o.url+' '+o.width+'w').join(', ')+'"'));assert(el.innerHTML.includes('data-art-master="'+v.master+'"'));rendered++;
  }
  const locked=vm.runInContext("cardEl(testCard,'',true,'expanded')",ctx);assert(!locked.innerHTML.includes('srcset='));assert(!locked.innerHTML.includes(v.master));assert(locked.innerHTML.includes('k-hidden'));
 }
 const fallback=Object.values(cards).find(c=>!variants[c.id]);assert.equal(ctx.cardIllustration(fallback),null);assert.equal(ctx.cardArtVariants(fallback),null);assert.equal(ctx.cardArt(fallback).length,64);
 const all=vm.runInContext('CARD_LIST',ctx);ctx.testCards=Object.keys(variants);ctx.testSizes=[96,120,240,396];
 // Review page loads the real catalogue and card renderer; it can also be opened from the test ZIP.
 const helper=ui.slice(ui.indexOf('const CARD_PAL='),ui.indexOf('function showDetail('));
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hexmancers artwork review</title><link rel="stylesheet" href="card.css"><link rel="stylesheet" href="cards/card-geo.css"><style>body{margin:24px;background:#10151c;color:#eee;font:16px system-ui}h1{font-size:24px}h2{font-size:18px}.row{display:flex;gap:22px;align-items:start;overflow:auto;padding:12px 0}section{border-bottom:1px solid #36404b;padding:12px 0}.specimen{flex-shrink:0}p{margin:8px 0}</style><h1>Artwork review</h1><p>66 cards at 96, 120, 240 and 396 pixels. Scroll each row to compare sizes.</p><main id="review"></main>'+['cardsets.js','creatures.js','strikes.js','kinds.js','cards.js','cards/card-geo.js','cards/icons.js','cards/illustrations.js','cards/art-variants.js','art.js'].map(f=>'<script src="'+f+'"></script>').join('')+'<script>const save={seen:{},owned:{}};const esc=s=>String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;"}[c]));'+helper+'\nfor(const id of Object.keys(HEX_CARD_ART_VARIANTS)){const s=document.createElement("section"),h=document.createElement("h2"),r=document.createElement("div");h.textContent=CARDS[id].name;r.className="row";s.append(h,r);for(const w of [96,120,240,396]){const wrap=document.createElement("div");wrap.className="specimen";wrap.style.width=w+"px";const c=cardEl(CARDS[id],"<span class=badge>3/3</span>",false,w<=120?"compact":"expanded");c.style.width=w+"px";wrap.append(c);r.append(wrap);}document.querySelector("#review").append(s);}</script>';
 fs.writeFileSync(path.join(ROOT,'game/art-review.html'),html);
 console.log(JSON.stringify({catalogue:all.length,registered:Object.keys(variants).length,imagesDecoded:decoded,cardMarkupChecked:rendered,locked:'pass',fallback:'pass',browserLayout:'not tested: sandbox prevents browser launch'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
