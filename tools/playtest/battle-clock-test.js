// Exercise the real UI frame callback without a browser or GPU.
'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../game/ui.js'),'utf8');
const loop=source.slice(source.indexOf('let prev=performance.now();'),source.indexOf('/* ---------------- phone or tablet layout'));
function fixture(){
  let now=0, time=0, distance=0, draws=0, maxStep=0, next=null;
  const state={B:{phase:'fight'},paused:false,DBG:{pause:false},document:{hidden:false,addEventListener(){}},
    performance:{now:()=>now},View:{w:400,h:600},
    $:()=>({classList:{contains:()=>true}}),requestAnimationFrame:fn=>{next=fn;},
    checkControls(){},resizeView(){},heldWalk(){},stickWalk(){},hud(){},
    update(dt){time+=dt;distance+=9*dt;maxStep=Math.max(maxStep,dt);},
    render(){draws++;},console};
  vm.createContext(state);vm.runInContext(loop,state);
  return {state,step(ms){now+=ms;state.frame(now);},get:()=>({time,distance,draws,maxStep,next})};
}
// Alternate slow first fights and faster later ones on the same page.
const f=fixture();
for(let battle=0;battle<12;battle++){
  f.state.B={phase:'fight'};
  const before=f.get(),fps=[10,20,30,60][battle%4];
  for(let i=0;i<fps;i++)f.step(1000/fps);
  const after=f.get();
  assert.ok(Math.abs(after.time-before.time-1)<1e-8,`battle ${battle+1}: discarded elapsed time at ${fps} fps`);
  assert.ok(Math.abs(after.distance-before.distance-9)<1e-8,'movement changed with frame rate');
  assert.equal(after.draws-before.draws,fps,'must render once per frame');
  assert.ok(after.maxStep<=.05+1e-9,'physics step exceeded 50ms');
}
// No unbounded catch-up on a long stall; hiding/pausing must not advance the fight.
let before=f.get();f.step(5000);assert.ok(f.get().time-before.time<=.25+1e-9);
f.state.paused=true;before=f.get();f.step(1000);assert.equal(f.get().time,before.time);
f.state.paused=false;f.step(1000/60);assert.ok(f.get().time-before.time<.02);
f.state.document.hidden=true;before=f.get();f.step(1000);assert.equal(f.get().time,before.time);
f.state.document.hidden=false;f.step(1000/60);assert.ok(f.get().time-before.time<.02);
// A hook changing battle or pausing during a substep ends work on that frame.
for(const stop of [s=>{s.B={phase:'fight'};},s=>{s.paused=true;}]){
  const g=fixture();let calls=0;g.state.update=()=>{calls++;stop(g.state);};g.step(200);
  assert.equal(calls,1,'substeps continued after a transition');
}
console.log('Battle clock: 12 fights at 10/20/30/60 fps, bounded steps, pause, hidden tab and transitions passed.');
