'use strict';
// Real Chromium touch input and real frame timing across dungeon/battle round trips.
// State fixtures freeze enemies and finish encounters; movement always uses CDP touch.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const R = require('./runner-common.js');
async function run() {
  const out = process.argv[2] || '/tmp/hex-touch-transitions';
  fs.mkdirSync(out, {recursive:true});
  const host = await R.serve(); let browser;
  try {
    ({browser} = await R.launch());
    const {page, context, errors} = await R.openPage(browser, host.url,
      {viewport:{width:412,height:915}, hasTouch:true, isMobile:true});
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => {
      save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0));
      XLIT.pbr=false; XLIT.ssao=false; XLIT.dof=false; XLIT.ao=false; XLIT.nmap=false;
      enterExplore(1); xPause(true);
      window.touchSamples=[];
      const originalUpdate=update;
      update=function(dt) {
        originalUpdate(dt);
        const p=B&&B.player;
        if(p&&window.touchMeasure) window.touchSamples.push({wall:performance.now(),dt,
          time:B.time, speed:Math.max(Math.hypot(p.vx||0,p.vz||0),p.lastSpd||0)/Math.sqrt(3),
          dist:p.walkDist||0, free:!!p.free, battle:B.no});
      };
    });
    const results=[];
    for(let cycle=0;cycle<4;cycle++) {
      const mode=['stick','follow','tap','stick'][cycle];
      await page.evaluate(() => { const g=EX.groups.find(g=>!g.boss)||EX.groups[0];
        if(!g) throw Error('No remaining dungeon encounter'); g.ids=['gloop']; g.rule=null; xEngage(g,null); });
      await page.waitForSelector('#scrBattle.on');
      await page.evaluate(mode => {
        XLIT.mvStick=mode==='stick';
        closeCustomScreen(); paused=false;
        for(const e of B.enemies) {e.atkT=e.moveT=1e9;}
        for(const t of TILES) { t.ground=null; t.holeT=0; }
        B.player.hp=B.player.maxHp=100000;
      },mode);
      await page.waitForTimeout(300);
      const start=await page.evaluate(mode => {
        const p=B.player, [x,y]=proj(p.tile.wx,0,p.tile.wz),r=View.canvas.getBoundingClientRect();
        const t=neighbors(p.tile).find(t=>t.side==='p'&&!t.occ), [tx,ty]=proj(t.wx,0,t.wz);
        window.touchSamples=[]; window.touchMeasure=true;
        return mode==='tap'?{x:r.x+tx*r.width/View.w,y:r.y+ty*r.height/View.h}
          :{x:r.x+x*r.width/View.w,y:r.y+y*r.height/View.h};
      },mode);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
      if(mode==='tap') await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      else await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+65,y:start.y,id:1}]});
      await page.waitForTimeout(380);
      if(mode!=='tap') await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const result=await page.evaluate(() => {
        window.touchMeasure=false;
        const samples=window.touchSamples, first=samples[0],last=samples.at(-1);
        return {battle:B.no,samples:samples.length,top:MV('mvStickSpeed'),
          maxSpeed:Math.max(...samples.map(s=>s.speed)),
          timeRatio:first&&last?(last.time-first.time)/((last.wall-first.wall)/1000):null,
          residualDrag:!!dragging, samplesRaw:samples};
      });
      result.mode=mode; results.push(result);
      fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({source:process.env.SOURCE_SHA,results,errors},null,2));
      console.log(JSON.stringify({...result,samplesRaw:undefined}));
      await page.screenshot({path:path.join(out,`battle-${cycle+1}.png`)});
      await page.evaluate(() => { B.phase='win'; victory(); });
      await page.getByRole('button',{name:'Keep exploring',exact:true}).click();
      await page.waitForSelector('#scrExplore.on');
      await page.evaluate(() => xPause(true));
    }
    assert.equal(errors.length,0,errors.join('\n'));
    for(const r of results) {
      assert.ok(r.samples>=3,'Too few frames to measure');
      assert.ok(r.maxSpeed>1,'Touch did not move player');
      assert.ok(r.maxSpeed<=r.top*1.25,'Movement exceeds configured speed');
      assert.ok(r.timeRatio>.65&&r.timeRatio<1.3,'Simulation clock differs from real time');
      assert.equal(r.residualDrag,false,'Touch remains held after release');
    }
  } finally { if(browser) await browser.close(); await host.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
