// Netplay: message codec, validation and transport contract. Pure: no DOM or game deps.
// Transport (duck-typed): {send(text, channel:'fast'|'safe'), onmessage(text), onclose(), close()}
const NET_V=1;
const NET_MAX_LEN=4096;
const CHANNEL={pos:'fast',step:'fast',shot:'fast',ping:'fast',pong:'fast'};
function channelOf(t){ return Object.prototype.hasOwnProperty.call(CHANNEL,t)?CHANNEL[t]:'safe'; }

const _nFin=v=>typeof v==='number'&&Number.isFinite(v);
const _nInt=(lo,hi)=>v=>Number.isInteger(v)&&v>=lo&&v<=hi;
const _nRange=(lo,hi)=>v=>_nFin(v)&&v>=lo&&v<=hi;
const _nIsObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const _nTile=v=>_nIsObj(v)&&_nInt(0,13)(v.c)&&_nInt(0,8)(v.r);
const _nStr=v=>typeof v==='string'&&v.length>0&&v.length<=16;
const _nColor=v=>_nStr(v)&&(typeof COLORS==='undefined'||Object.prototype.hasOwnProperty.call(COLORS,v));
const _nName=v=>typeof v==='string'&&v.length<=32;
const _nDeck=v=>Array.isArray(v)&&v.length<=200&&v.every(x=>typeof x==='string'&&x.length<=64);
const _nOpt=p=>v=>v===undefined||p(v);

// SHAPES[t][field] = predicate; every listed field is checked (use _nOpt for optional ones).
const SHAPES={
  hello:{v:_nFin,name:_nName,deck:_nDeck},
  ready:{},
  start:{seed:_nFin},
  pos:{ts:_nFin,fx:_nFin,fz:_nFin,vx:_nFin,vz:_nFin},
  step:{ts:_nFin,from:_nTile,to:_nTile,dur:_nRange(0.05,2)},
  sync:{ts:_nFin,hp:_nFin,maxHp:_nFin,barrier:_nFin,gauge:_nRange(0,10)},
  spell:{ts:_nFin,sec:_nRange(1,60)},
  spelldone:{ts:_nFin},
  hit:{ts:_nFin,dmg:_nInt(1,500),color:_nColor,tile:_nOpt(_nTile)},
  shot:{ts:_nFin,r:_nFin,color:_nColor,big:v=>typeof v==='boolean'},
  end:{ts:_nFin,loser:_nStr},
  ping:{ts:_nFin,n:_nFin},
  pong:{ts:_nFin,n:_nFin,pts:_nFin},
  bye:{},
};

function encode(msg){ return JSON.stringify(msg); }

function decode(text){
  try{
    if(typeof text!=='string'||text.length>NET_MAX_LEN) return null;
    const m=JSON.parse(text);
    if(!_nIsObj(m)||typeof m.t!=='string') return null;
    if(!Object.prototype.hasOwnProperty.call(SHAPES,m.t)) return null;
    const shape=SHAPES[m.t];
    for(const k of Object.keys(shape)) if(!shape[k](m[k])) return null;
    return m;
  }catch(e){ return null; }
}

function loopbackPair(opts){
  opts=opts||{};
  const delay=opts.delayMs||0;
  const sched=opts.setTimeout||(delay>0?((fn,ms)=>setTimeout(fn,ms)):(fn=>Promise.resolve().then(fn)));
  let closed=false;
  const mk=()=>({send:null,onmessage:null,onclose:null,close:null});
  const A=mk(),B=mk();
  const wire=(from,to)=>{
    from.send=(text,channel)=>{
      if(closed) return;
      sched(()=>{ if(!closed&&typeof to.onmessage==='function') to.onmessage(text); },delay);
    };
    from.close=()=>{
      if(closed) return;
      closed=true;
      for(const t of [A,B]) if(typeof t.onclose==='function') t.onclose();
    };
  };
  wire(A,B); wire(B,A);
  return [A,B];
}

if(typeof module!=='undefined') module.exports={NET_V,CHANNEL,channelOf,encode,decode,loopbackPair,SHAPES};
