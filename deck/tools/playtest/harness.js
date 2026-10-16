// Headless playtest: loads the game into one VM context (no DOM) and plays battles with bots.
const vm=require('vm'), fs=require('fs');
const DIR=require('path').join(__dirname,'..','..')+'/';
function makeGame(seed){
  const ctx={console, Math:Object.create(Math)};
  let s=seed||1; ctx.Math.random=()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  vm.createContext(ctx);
  for(const f of ['cards.js','engine.js','world.js','collection.js','gear.js','battle.js','enemies.js','bosses.js','minibosses.js']) vm.runInContext(fs.readFileSync(DIR+f,'utf8'),ctx,{filename:f});
  vm.runInContext(fs.readFileSync(__dirname+'/bot.js','utf8'),ctx,{filename:'bot.js'});
  return Object.assign(vm.runInContext('({STARTERS,starterList,playBattle,gearState,gearMods,GEAR,CARDS,MINIBOSS_IDS,miniWave})',ctx),{ctx});
}
module.exports={makeGame};
