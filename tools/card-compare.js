// node tools/card-compare.js OUT.png [width] — the card-frame parity fixture (docs/card-frame-spec): the three reference
// cards (Ember Dart, Undertow Charm, Monkey's Fruit Stash) drawn by the game's own cardEl, full size, with count
// badges, at the reference mockup's positions (1536x1024, cards 475 px wide), so the shot overlays the reference.
// Fonts are awaited first. Extra card ids after the width draw a second row instead (catalogue checks).
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{ const out=process.argv[2]||'cards.png', W=+(process.argv[3]||475), extra=process.argv.slice(4);
  const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await br.newPage({viewport:{width:1536,height:1024}});
  await pg.goto('file://'+path.resolve(__dirname,'../game/index.html')); await pg.waitForTimeout(900);
  await pg.evaluate(async ({W,extra})=>{ await document.fonts.ready;
    const byName=n=>Object.values(CARDS).find(c=>c.name===n);
    const box=document.createElement('div'); box.id='cmp'; box.style.cssText='position:fixed;inset:0;z-index:99999;background:#0b0e12;overflow:hidden';
    document.body.appendChild(box);
    const list=extra.length?extra.map(id=>[CARDS[id]||byName(id),'1/1']):[[byName('Ember Dart'),'3/3'],[byName('Undertow Charm'),'1/1'],[byName("Monkey's Fruit Stash"),'1/1']];
    const xs=[31,532,1031];
    list.forEach(([c,n],i)=>{ if(!c) return; const el=cardEl(c,`<span class="badge">${n}</span>`,false,'expanded');
      el.style.position='absolute'; el.style.width=W+'px';
      if(extra.length){ const per=Math.floor(1536/(W+12)); el.style.left=(8+(i%per)*(W+12))+'px'; el.style.top=(8+Math.floor(i/per)*(W*434/240+12))+'px'; }
      else { el.style.left=xs[i]+'px'; el.style.top='65px'; }
      box.appendChild(el); });
    if(typeof kitFit==='function') kitFit(box);
    await document.fonts.ready; await new Promise(r=>setTimeout(r,400)); },{W,extra});
  await pg.screenshot({path:out}); await br.close(); })();
