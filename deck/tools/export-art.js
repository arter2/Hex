// Writes each card's 16 x 16 pixel art to deck/art/<card id>.csv (16 rows of 16 hex colors),
// plus deck/art/index.csv listing every card and its file. Run: node deck/tools/export-art.js
const fs=require('fs'), path=require('path');
const D=require('../cards.js'); Object.assign(global,D);
const A=require('../art.js');
const dir=path.join(__dirname,'..','art'); fs.mkdirSync(dir,{recursive:true});
const index=['id,name,color,type,rarity,motif,file'];
const q=s=>/[",]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
for(const c of D.CARD_LIST){ const file=c.id+'.csv'; fs.writeFileSync(path.join(dir,file),A.artCSV(c));
  index.push([c.id,q(c.name),c.color,c.type,c.rarity,A.motifKey(c),file].join(',')); }
fs.writeFileSync(path.join(dir,'index.csv'),index.join('\n')+'\n');
console.log('wrote',D.CARD_LIST.length,'art files to',dir);
