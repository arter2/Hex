// node tools/dungeon-fixes-test.js — v123 dungeon fixes: traps and things that appear under you never pin you, chasers close in, a short deck still fights in the dungeon
// v123 fixes: (1) a known trap under the edge of you no longer pins you; (2) a dungeon fight with a deck short from burned cards still starts;
// (3) camp Explore with a bad deck says why; (4) a chaser in your cell closes in; (6, v125) walking past a teleport pad never takes it
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); await pg.goto('file://'+require('path').resolve(__dirname,'../game/index.html')+''); await pg.waitForTimeout(800);
 const r=await pg.evaluate(()=>{ let VT=0; window.setTimeout=()=>0; window.requestAnimationFrame=()=>0; performance.now=()=>VT*1000; const out={};
   save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); save.deepest=3; enterExplore(3); EX.groups=[]; for(const t of EX.traps) t.armed=false;
   // (1) a corridor-ish spot: a floor cell with floor on both sides east-west
   let a=-1; for(let c=0;c<XN*XN;c++){ if(xPassable(c)&&xPassable(c+1)&&xPassable(c+2)&&!xSolid(c)&&!xSolid(c+1)&&!xSolid(c+2)&&!EX.doors.has(c)&&!EX.doors.has(c+1)&&!EX.doors.has(c+2)&&c!==EX.up&&c!==EX.down&&c+1!==EX.up&&c+2!==EX.up&&c+1!==EX.down&&c+2!==EX.down){ a=c; break; } }
   EX.traps.push({cell:a+1,kind:'spike',armed:true,known:true}); EX.pc=a+2; EX.px=xw(a+2)-XCS*.45; EX.pz=xz(a+2); EX.path=[]; EX.goal=null; EX.needInput=false;
   const right=keysFor('right')[0]; XKEY[right]=true; const x0=EX.px; for(let i=0;i<30;i++){ VT+=1/30; xMove(1/30); } XKEY[right]=false; out.trapFree=EX.px>x0+.5;
   // and it still stops you walking onto one
   EX.pc=a; EX.px=xw(a); EX.pz=xz(a); const x1=EX.px; XKEY[right]=true; for(let i=0;i<30;i++){ VT+=1/30; xMove(1/30); } XKEY[right]=false; out.trapStillBlocks=EX.pc===a;
   // (5) a solid thing (a puzzle's pedestal) appears under the edge of you: you can still step away, but not into it
   EX.traps=EX.traps.filter(t=>t.cell!==a+1); const ped=xProp('pedestal',a+1,{}); EX.pc=a+2; EX.px=xw(a+2)-XCS*.45; EX.pz=xz(a+2); EX.path=[]; EX.goal=null;
   const x2=EX.px; XKEY[right]=true; for(let i=0;i<30;i++){ VT+=1/30; xMove(1/30); } XKEY[right]=false; out.propFree=EX.px>x2+.5;
   EX.pc=a; EX.px=xw(a); EX.pz=xz(a); XKEY[right]=true; for(let i=0;i<30;i++){ VT+=1/30; xMove(1/30); } XKEY[right]=false; out.propStillBlocks=EX.pc===a;
   // (6, v125) a teleport pad you walk past (not to) never carries you off: the path and the corner-cutting go round it
   EX.props=EX.props.filter(p=>p!==ped); EX.propAt.delete(a+1); EX.taken.delete(a+1);
   const open9=c=>[-1,0,1].every(dy=>[-1,0,1].every(dx=>{ const n=xi(xcx(c)+dx,xcy(c)+dy); return xPassable(n)&&!xSolid(n)&&!EX.doors.has(n)&&n!==EX.up&&n!==EX.down&&!EX.propAt.has(n); }));
   let m=-1; for(let c=0;c<XN*XN;c++) if(open9(c)&&open9(c-1)&&open9(c+1)){ m=c; break; }
   const pad=xProp('tpad',m,{solid:false,to:EX.up,col:0}); EX.pc=m-1; EX.px=xw(m-1); EX.pz=xz(m-1); EX.path=xPathToCell(m+1); EX.goal={cell:m+1,x:xw(m+1),z:xz(m+1)}; out.padPathAround=!!EX.path&&!EX.path.includes(m);
   let warped=false; for(let i=0;i<150&&EX.goal;i++){ VT+=1/30; xMove(1/30); if(EX.pc===EX.up) warped=true; } out.padNotTaken=!warped&&EX.pc===m+1;
   EX.props=EX.props.filter(p=>p!==pad); EX.propAt.delete(m); EX.taken.delete(m); EX.pc=a+2; EX.px=xw(a+2); EX.pz=xz(a+2);
   // (4) chaser in your cell
   const g=xGroup([Object.keys(ENEMY_DEFS).find(k=>ENEMY_DEFS[k].vermin===undefined&&!ENEMY_DEFS[k].boss)],EX.pc,'chase'); g.x=EX.px+XCS*.6; g.z=EX.pz; g.cell=EX.pc; g.path=[]; g.repath=9; g.sprite=null; EX.groups=[g]; let engaged=false; const eng=xEngage; xEngage=function(){ engaged=true; }; for(let i=0;i<60&&!engaged;i++){ VT+=1/30; xEnemies(1/30); } xEngage=eng; out.chaserCloses=engaged;
   // (2) deck short from burned cards: a dungeon fight still starts
   stopExplore(); const d=activeDeck(); while(d.list.length>40) d.list.pop(); B=null; fight(3,null,{hp:100,explore:true}); out.shortDeckFights=!!B&&$('#scrBattle').classList.contains('on'); out.shortDeckN=d.list.length; B=null;
   // (3) Explore from camp with that deck: a tip, no dungeon
   EX=null; openCamp(); enterExplore(3); out.exploreRefusedWithTip=!EX&&/Too few cards/.test($('#tip').textContent);
   return out; });
 console.log(JSON.stringify(r)); console.log('errors',errs.slice(0,3)); await br.close(); })();
