// Dumps every card (fields, ability text, 64x64 art as CSV) to JSON for the card review page.
// Run: node deck/tools/cards/dump.js > out.json
const path=require('path');
const D=require('../../cards.js'); Object.assign(global,D);
const A=require('../../art.js');
const skip=new Set(['id','name','color','type','rarity','rank','code','sig']);
const out=D.CARD_LIST.map(c=>({id:c.id,name:c.name,color:c.color,type:c.type,rank:c.rank,rarity:c.rarity,rune:c.code||'',
  text:typeof D.cardText==='function'?D.cardText(c):'', stats:Object.fromEntries(Object.entries(c).filter(([k,v])=>!skip.has(k)&&(typeof v==='number'||typeof v==='string'||typeof v==='boolean'))),
  art:A.artCSV(c)}));
process.stdout.write(JSON.stringify({colors:Object.fromEntries(Object.entries(D.COLORS).map(([k,v])=>[k,{name:v.name,c:v.c,icon:v.icon}])), cards:out}));
