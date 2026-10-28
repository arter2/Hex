// node tools/card-audit.js — v179 card-frame audit: every card in the catalogue drawn full size at 240 px wide (one canvas
// unit = one pixel) after the fonts load, and checked: name, type line, stat, footer values and count inside their slots
// (2 units clear), rules either fitting or scrolling, rune/rank/count ink centred within 1 unit, the 240/434 ratio at
// 120, 240 and 396 px. Prints a summary and the cards that fail.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await br.newPage({viewport:{width:1400,height:900}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../game/index.html')); await pg.waitForTimeout(900);
  const r=await pg.evaluate(async()=>{ await document.fonts.load('12px "Hex Card"'); await document.fonts.load('12px "Hex Card Caps"'); await document.fonts.ready;
    save=save||newSave(STARTERS[0]); const box=document.createElement('div'); box.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#000'; document.body.appendChild(box);
    const out={cards:0, twoLine:[], scroll:[], fails:[], typeMin:{}, rulesSize:{}, ratio:[], ink:[]};
    // ink centre of a glyph run, by drawing it on a canvas in the element's computed font
    const cv=document.createElement('canvas'); cv.width=400; cv.height=200; const x=cv.getContext('2d');
    const inkBox=(text,font)=>{ x.clearRect(0,0,400,200); x.font=font; x.fillStyle='#fff'; x.textBaseline='alphabetic'; x.fillText(text,100,120);
      const d=x.getImageData(0,0,400,200).data; let x0=1e9,x1=-1,y0=1e9,y1=-1; for(let i=0;i<d.length;i+=4) if(d[i+3]>128){ const p=i/4, X=p%400, Y=(p-X)/400; x0=Math.min(x0,X); x1=Math.max(x1,X); y0=Math.min(y0,Y); y1=Math.max(y1,Y); } return {x0,x1,y0,y1}; };
    for(const c of CARD_LIST){ out.cards++;
      const el=cardEl(c,'<span class="badge">'+(c.uses?'×12':'3/3')+'</span>',false,'expanded'); el.style.width='240px'; box.appendChild(el); kitFit(el);
      const R=e=>e.getBoundingClientRect(), cr=R(el), bad=[];
      const inSlot=(sel,inner)=>{ const s=el.querySelector(sel); if(!s) return; const a=R(s), t=inner?s.querySelector(inner)||s:s.firstElementChild||s;
        const range=document.createRange(); range.selectNodeContents(t); const b=range.getBoundingClientRect();
        if(b.width&&(b.left<a.left+1.5||b.right>a.right-1.5)) bad.push(sel+' x '+(b.left-a.left).toFixed(1)+'..'+(a.right-b.right).toFixed(1)); };
      inSlot('.k-name','span'); inSlot('.k-tline','span'); inSlot('.k-stat','span'); inSlot('.k-count','span');
      el.querySelectorAll('.k-foot>span').forEach((v,i)=>{ if(v.scrollWidth>v.clientWidth+1) bad.push('foot'+i+' value'); const f=v.parentElement; if(f.scrollWidth>f.clientWidth+1) bad.push('foot'+i+' wide'); });
      const nm=el.querySelector('.k-name'); if(nm.classList.contains('two')){ out.twoLine.push(c.name); const s=nm.firstElementChild; if(s.getBoundingClientRect().height>nm.getBoundingClientRect().height+.5) bad.push('name 2 lines too tall'); }
      const rb=el.querySelector('.k-rules'); const rs=getComputedStyle(rb).fontSize; out.rulesSize[rs]=(out.rulesSize[rs]||0)+1;
      if(rb.classList.contains('scroll')) out.scroll.push(c.name); else if(rb.scrollHeight>rb.clientHeight+1) bad.push('rules cut '+rb.scrollHeight+'/'+rb.clientHeight);
      const ts=getComputedStyle(el.querySelector('.k-tline')).fontSize; out.typeMin[ts]=(out.typeMin[ts]||0)+1;
      // rune / rank / count: the painted ink's middle against the plate's (or plaque opening's) inner middle
      for(const sel of ['.k-rune','.k-rank','.k-count']){ const s=el.querySelector(sel); if(!s) continue; const sp=s.firstElementChild, cs=getComputedStyle(sp), a=R(s);
        const bw=parseFloat(getComputedStyle(s).borderLeftWidth)||0, ib={l:a.left+bw,r:a.right-bw,t:a.top+bw,b:a.bottom-bw};
        const ink=inkBox(sp.textContent,cs.fontSize+' "'+cs.fontFamily.split(',')[0].replace(/"/g,'')+'"'), w=ink.x1-ink.x0+1, h=ink.y1-ink.y0+1;
        const sr=sp.getBoundingClientRect(), mw=x.measureText(sp.textContent);
        // where the run's ink sits on the page: the span's text starts at its left (centred box), baseline from the font box
        const base=sr.top+(sr.height-(mw.fontBoundingBoxAscent+mw.fontBoundingBoxDescent))/2+mw.fontBoundingBoxAscent;
        const inkL=sr.left+(sr.width-mw.width)/2+(ink.x0-100), inkT=base+(ink.y0-120);
        const dx=(inkL+w/2)-(ib.l+ib.r)/2, dy=(inkT+h/2)-(ib.t+ib.b)/2;
        if(Math.abs(dx)>1||Math.abs(dy)>1) out.ink.push(c.name+' '+sel+' '+sp.textContent+' dx '+dx.toFixed(2)+' dy '+dy.toFixed(2)); }
      if(bad.length) out.fails.push(c.name+': '+bad.join('; '));
      el.remove(); }
    for(const w of [120,240,396]){ const el=cardEl(CARD_LIST[0],'',false,'expanded'); el.style.width=w+'px'; box.appendChild(el); const b=el.getBoundingClientRect(); out.ratio.push(w+': '+(b.width/b.height/(240/434)-1).toFixed(5)); el.remove(); }
    return out; });
  console.log('cards',r.cards,'| two-line names',r.twoLine.length,r.twoLine.slice(0,8).join(', '));
  console.log('rules sizes',JSON.stringify(r.rulesSize),'| scrolling rules',r.scroll.length);
  console.log('type line sizes',JSON.stringify(r.typeMin)); console.log('ratio error',r.ratio.join(' | '));
  console.log('ink off-centre >1u:',r.ink.length); r.ink.slice(0,15).forEach(s=>console.log('  '+s));
  console.log('fails:',r.fails.length); r.fails.slice(0,30).forEach(s=>console.log('  '+s));
  if(errs.length) console.log('page errors:',errs.join('\n')); await br.close(); })();
