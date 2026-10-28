// node tools/card-screens.js OUTDIR [width] [height] — the cards on real screens (v179 card-frame check): the hand screen
// before a fight, the fight's hand bar, the collection, the deck builder, the shop, a card's detail and a pack reveal,
// on a phone-sized page by default (390x844). Writes OUTDIR/<screen>.png; prints page errors.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{ const out=process.argv[2]||'.', W=+(process.argv[3]||390), H=+(process.argv[4]||844);
  const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await br.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true,deviceScaleFactor:2}); const pg=await ctx.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../game/index.html')); await pg.evaluate(()=>localStorage.clear()); await pg.reload(); await pg.waitForTimeout(1200);
  await pg.evaluate(async()=>{ await document.fonts.ready; save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0));
    for(const c of CARD_LIST.slice(0,60)){ save.owned[c.id]=(save.owned[c.id]||0)+1+(c.rank%3); save.seen[c.id]=1; } persist&&persist(); });
  const shot=async(name,fn,wait=700)=>{ try{ await pg.evaluate(fn); await pg.waitForTimeout(wait); await pg.screenshot({path:path.join(out,name+'.png')}); }catch(e){ errs.push(name+': '+e.message); } };
  await shot('hand',()=>{ fight(2); });
  await shot('battle',()=>{ closeCustomScreen(); paused=true; },1200);
  await shot('collection',()=>{ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on')); renderCollection(); show('scrCollection'); });
  await shot('deck',()=>{ openDeckUI('camp'); });
  await shot('shop',()=>{ openShop(); });
  await shot('detail',()=>{ show('scrCollection'); showDetail(CARD_LIST.find(c=>c.name==='Ember Dart')); });
  await shot('reveal',()=>{ $('#detail').classList.remove('on'); reveal('Pack',"Your cards",CARD_LIST.slice(3,8).map(c=>({card:c,isNew:true})),[['OK',()=>{}]]); },1500);
  console.log(errs.length?errs.join('\n'):'no page errors'); await br.close(); })();
