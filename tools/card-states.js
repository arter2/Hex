// node tools/card-states.js OUT.png — v179: one card in every state (normal, chosen, locked, enchanted, buffed, both,
// hero, holo legendary, wild rune, two-line name), then one card of each of the eight colours, all full size.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await br.newPage({viewport:{width:1700,height:1180}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../game/index.html')); await pg.waitForTimeout(900);
  await pg.evaluate(async()=>{ await document.fonts.ready; save=newSave(STARTERS[0]);
    const box=document.createElement('div'); box.style.cssText='position:fixed;inset:0;z-index:99999;background:#0b0e12;display:grid;grid-template-columns:repeat(10,160px);gap:8px;padding:8px;align-content:start'; document.body.appendChild(box);
    const L=CARD_LIST, by=f=>L.find(f), add=(c,cls,opt,lock,label)=>{ const el=cardEl(c,'<span class="badge">'+(label||'1/1')+'</span>',lock,'expanded',opt||{}); if(cls) el.classList.add(...cls.split(' ')); box.appendChild(el); };
    const base=by(c=>c.name==='Ember Dart');
    add(base); add(base,'chosen'); add(base,'',{},true); add(base,'ench'); add(base,'buff'); add(base,'ench buff');
    add(by(c=>c.rarity==='hero')||base); add(by(c=>c.rarity==='legendary')||base,'',{holo:true}); add(by(c=>c.code===WILD&&c.rarity!=='hero')||base,'',{},false,'×12');
    add(by(c=>c.name.startsWith('Crown of the Sea'))||base);
    for(const col of ['fire','frost','storm','verdant','light','shadow','gray','brown']) add(by(c=>c.color===col&&c.type!=='strike')||by(c=>c.color===col));
    for(const ty of ['ward','summon']) add(by(c=>c.type===ty&&c.color==='light')||base);
    await new Promise(r=>setTimeout(r,500)); });
  await pg.screenshot({path:process.argv[2]||'states.png'}); console.log(errs.join('\n')||'no page errors'); await br.close(); })();
