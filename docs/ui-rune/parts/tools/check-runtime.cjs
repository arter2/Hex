// Node stdlib checks for health clipping/clamping and nine-slice geometry.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const context={setTimeout,clearTimeout};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../ui.js'),'utf8')+'\nthis.api={HexHealth,drawNineSlice};',context);
const nodes=Object.fromEntries(['.hx-fill-clip','.hx-lag-clip','.hx-fill','.hx-health-value'].map(n=>[n,{style:{}}]));
const attrs={};const el={querySelector:n=>nodes[n],setAttribute:(k,v)=>attrs[k]=v};const health=new context.api.HexHealth(el);
for(const [value,max,width,color,text] of [[132,132,'100%','green','132/132'],[66,132,'50%','warning','66/132'],[33,132,'25%','danger','33/132'],[0,132,'0%','danger','0/132'],[-5,132,'0%','danger','0/132'],[200,132,'100%','green','132/132'],[20,0,'0%','danger','0/0'],[NaN,132,'0%','danger','0/132'],[5,Infinity,'0%','danger','0/0']]){
 health.set(value,max);assert.equal(nodes['.hx-fill-clip'].style.width,width);assert(nodes['.hx-fill'].src.endsWith(`fill-${color}.svg`));assert.equal(nodes['.hx-health-value'].textContent,text);
}
clearTimeout(health.timer);
const calls=[];context.api.drawNineSlice({drawImage:(...args)=>calls.push(args)},{naturalWidth:288,naturalHeight:192},0,0,144,64,[8,8,8,8],4);
assert.equal(calls.length,9);assert.equal(calls[0][3],32);assert.equal(calls[0][7],8);assert.equal(calls[8][5],136);assert.equal(calls[8][6],56);
assert.throws(()=>context.api.drawNineSlice({},{},0,0,10,10,[8,8,8,8],4));
console.log('Passed: 9 health cases, fixed corner widths and all 9 frame cells.');
