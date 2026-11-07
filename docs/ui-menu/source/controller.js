/* Pure transition model. Production callers supply their own data and callbacks. */
(function(root){
function transition(state,action){
 const s=JSON.parse(JSON.stringify(state));let event=null;
 const run=s.slots.find(a=>a.id===s.selectedSlot&&!a.empty)||s.slots.find(a=>!a.empty);
 if(action==='saves')s.screen='saves';
 else if(action==='home')s.screen='home';
 else if(action==='depth-prev')s.depth=Math.max(1,s.depth-1);
 else if(action==='depth-next')s.depth=Math.min(run?.deepest||1,s.depth+1);
 else if(action.startsWith('slot-')){const id=Number(action.slice(5));if(s.slots.some(a=>a.id===id))s.selectedSlot=id;}
 else if(action.startsWith('load-')){const id=Number(action.slice(5));if(s.slots.some(a=>a.id===id&&!a.empty))event={type:'load-run',slotId:id};}
 else if(action==='newgame'){
  const slot=s.slots.find(a=>a.id===s.selectedSlot&&a.empty)||s.slots.find(a=>a.empty);
  if(slot){s.selectedSlot=slot.id;event={type:'new-game',slotId:slot.id};}
 }else if(action==='explore'||action==='battle'){if(run)event={type:'start-mode',slotId:run.id,mode:action,depth:s.depth};}
 else if(action==='details')event={type:'run-details',slotId:run?.id};
 else event={type:'navigate',destination:action};
 return {state:s,event};
}
const groups={cards:['Deck builder','My cards'],market:['Shop','Trading post'],journal:['Bounty board','Bestiary','Mastery'],character:['Character','Movement lab']};
const api={transition,groups};if(typeof module!=='undefined')module.exports=api;root.HexController=api;
})(typeof globalThis!=='undefined'?globalThis:this);
