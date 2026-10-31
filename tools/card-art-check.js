// Asset integrity and actual card markup checks. No browser layout claims.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
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
 let decoded=0,rendered=0;const sheets={};
 for(const a of report.assets){
  if(a.sourceSha256)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'game',a.master))).digest('hex'),a.sourceSha256,'Square source changed; rebuild display crops for '+a.key);
  const master=await canvas.loadImage(path.join(ROOT,'game',a.master));assert.equal(master.width,512);assert.equal(master.height,512);decoded++;
  for(const o of a.outputs){const im=await canvas.loadImage(path.join(ROOT,'game',o.url));assert.equal(im.width,o.width);assert.equal(im.height,o.height);decoded++;}
 }
 for(const [id,v]of Object.entries(variants)){
  assert(cards[id],'Unrecognized card '+id);assert.equal(ctx.cardIllustration(cards[id]),v.large);assert.equal(ctx.artURL(cards[id]),v.large);
  ctx.testCard=cards[id];
  // the card draws its cell of an atlas sheet: the full-card sheet when expanded, the thumbnail sheet when compact
  for(const [mode,kind] of [['compact','thumb'],['expanded','full']]){
   const a=v.atlas&&v.atlas[kind];assert(a,'No '+kind+' atlas cell for '+id);
   const el=vm.runInContext(`cardEl(testCard,'',false,'${mode}')`,ctx);assert(el.innerHTML.includes('class="k-art illustrated atlas"'),id);assert(el.innerHTML.includes('url('+a.url+')'),id);rendered++;
   (sheets[a.url]=sheets[a.url]||[]).push({id,kind,a});
  }
  const locked=vm.runInContext("cardEl(testCard,'',true,'expanded')",ctx);assert(!locked.innerHTML.includes('cards/art/atlas/'));assert(!locked.innerHTML.includes(v.master));assert(locked.innerHTML.includes('k-hidden'));
 }
 // every sheet decodes, and each card's cell (from its background size and position) lies inside it on whole pixels
 for(const [url,list] of Object.entries(sheets)){
  const im=await canvas.loadImage(path.join(ROOT,'game',url));decoded++;
  for(const {id,kind,a} of list){
   const w=im.width/(a.size[0]/100),h=im.height/(a.size[1]/100),x=a.pos[0]/100*(im.width-w),y=a.pos[1]/100*(im.height-h);
   assert.equal(Math.round(w),kind==='full'?512:256,id);assert(x>=0&&y>=0&&x+w<=im.width+.5&&y+h<=im.height+.5,'Cell outside its sheet: '+id);
   assert(Math.abs(x-Math.round(x))<.05&&Math.abs(y-Math.round(y))<.05,'Cell off the pixel grid: '+id);
  }
 }
 const fallback=Object.values(cards).find(c=>!variants[c.id]);assert.equal(ctx.cardIllustration(fallback),null);assert.equal(ctx.cardArtVariants(fallback),null);assert.equal(ctx.cardArt(fallback).length,64);
 const all=vm.runInContext('CARD_LIST',ctx);ctx.testCards=Object.keys(variants);ctx.testSizes=[96,120,240,396];
 // Review page loads the real catalogue and card renderer; it can also be opened from the test ZIP.
 const helper=ui.slice(ui.indexOf('const CARD_PAL='),ui.indexOf('function showDetail('));
 const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hexmancers artwork review</title>
<link rel="stylesheet" href="card.css"><link rel="stylesheet" href="cards/card-geo.css">
<style>body{margin:24px;background:#10151c;color:#eee;font:16px system-ui}h1{font-size:24px}h2{font-size:18px}.row{display:flex;gap:22px;align-items:start;overflow:auto;padding:12px 0}section{border-bottom:1px solid #36404b;padding:12px 0}.specimen{flex-shrink:0}p{margin:8px 0}nav{display:flex;gap:12px;align-items:center;flex-wrap:wrap}nav button,select{font:inherit;padding:8px}</style>
<h1>Artwork review</h1><p>${Object.keys(variants).length} cards at 96, 120, 240 and 396 pixels. Choose a colour; scroll each row to compare sizes.</p>
<nav><label>Colour <select id="review-colour"></select></label><button id="review-prev">Previous</button><button id="review-next">Next</button><span id="review-count"></span></nav><main id="review"></main>
${['cardsets.js','creatures.js','strikes.js','kinds.js','cards.js','cards/card-geo.js','cards/icons.js','cards/illustrations.js','cards/art-variants.js','art.js'].map(f=>'<script src="'+f+'"></script>').join('')}
<script>
const save={seen:{},owned:{}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':'&quot;');
${helper}
let reviewPage=0;
const reviewSelect=document.querySelector('#review-colour');
for(const colour of Object.keys(COLORS)){const option=document.createElement('option');option.value=colour;option.textContent=COLORS[colour].name;reviewSelect.append(option);}
reviewSelect.value='fire';
function renderReview(){
 const host=document.querySelector('#review');host.replaceChildren();
 const ids=Object.keys(HEX_CARD_ART_VARIANTS).filter(id=>CARDS[id].color===reviewSelect.value);
 const begin=reviewPage*20;
 for(const id of ids.slice(begin,begin+20)){
  const section=document.createElement('section'),heading=document.createElement('h2'),row=document.createElement('div');heading.textContent=CARDS[id].name;row.className='row';section.append(heading,row);
  for(const width of [96,120,240,396]){
   const wrap=document.createElement('div');wrap.className='specimen';wrap.style.width=width+'px';
   const card=cardEl(CARDS[id],'<span class="badge">3/3</span>',false,width<=120?'compact':'expanded');card.style.width=width+'px';card.querySelectorAll('img').forEach(image=>image.loading='lazy');wrap.append(card);row.append(wrap);
  }
  host.append(section);
 }
 document.querySelector('#review-prev').disabled=reviewPage===0;
 document.querySelector('#review-next').disabled=begin+20>=ids.length;
 document.querySelector('#review-count').textContent=ids.length?(begin+1)+'–'+Math.min(begin+20,ids.length)+' of '+ids.length:'No artwork in this colour';
}
reviewSelect.onchange=()=>{reviewPage=0;renderReview();};
document.querySelector('#review-prev').onclick=()=>{if(reviewPage>0){reviewPage--;renderReview();}};
document.querySelector('#review-next').onclick=()=>{reviewPage++;renderReview();};
renderReview();
</script>`;
 fs.writeFileSync(path.join(ROOT,'game/art-review.html'),html);
 console.log(JSON.stringify({catalogue:all.length,registered:Object.keys(variants).length,imagesDecoded:decoded,atlasSheets:Object.keys(sheets).length,cardMarkupChecked:rendered,locked:'pass',fallback:'pass',browserLayout:'not tested: sandbox prevents browser launch'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
