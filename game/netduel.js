// Netduel: duel session state machine over a netplay transport. Pure logic: no DOM, no timers.
// Time is driven by the injected now() and by the caller invoking tick() every frame.
// In Node netplay.js is required; in the browser its names are globals (netplay.js loads first).
const _np=(typeof require==='function'&&typeof module!=='undefined')?require('./netplay.js'):{NET_V,encode,decode,channelOf};

const NET_COLS=14;   // duel board width; hit tiles are mirrored c' = NET_COLS-1-c (BOARD_COLS is a mutable game global, so not reused)
const NET_DEFAULTS={mpSpell:10,mpDefend:50,mpBackdate:250,mpSend:16,mpSmooth:33};
const NET_DECK_MIN=45, NET_DECK_MAX=60;
const NET_SILENCE_MS=5000, NET_PING_MS=1000, NET_BURST_N=8, NET_BURST_GAP=20, NET_SYNC_MS=200;
const NET_DEATH_GRACE_MS=300, NET_DEATH_MARGIN_MS=50, NET_SPELL_GRACE_MS=2000, NET_HISTORY_MS=1000;

// Where the local mage stood over time; entries are sorted by ts.
class PosHistory{
  constructor(){ this.e=[]; }
  record(ts,c,r){
    const e=this.e;
    e.push({ts,c,r});
    if(e.length>1&&e[e.length-2].ts>ts) e.sort((a,b)=>a.ts-b.ts);
    const cut=e[e.length-1].ts-NET_HISTORY_MS;
    // keep one entry at or before the cutoff: it says where the mage stood when the window opens
    let k=-1; for(let i=0;i<e.length&&e[i].ts<=cut;i++) k=i;
    if(k>0) e.splice(0,k);
  }
  stoodOn(c,r,from,to){
    const e=this.e;
    let i=-1; for(let j=0;j<e.length&&e[j].ts<=from;j++) i=j;
    if(i<0) return false;
    for(let j=i;j<e.length&&e[j].ts<=to;j++) if(e[j].c!==c||e[j].r!==r) return false;
    return true;
  }
}
function hitLands(history,tile,localTs,defendMs){
  if(!tile) return true;
  return history.stoodOn(tile.c,tile.r,localTs-defendMs,localTs);
}

class DuelSession{
  constructor(transport,opts){
    opts=opts||{};
    this.transport=transport;
    this.name=opts.name||'';
    this.deck=opts.deck||[];
    this.look=opts.look||'';
    this.host=!!opts.host;
    this.now=opts.now||(()=>Date.now());
    this._seed=opts.seed||(()=>Math.floor(Math.random()*4294967296));
    this._settings=opts.settings||(()=>NET_DEFAULTS);
    this.state='connecting';
    this.opp=null;
    this._h={};
    this._left=false;
    this._gotHello=false;
    this._readySent=false; this._readyGot=false;
    this._pingN=0; this._lastPingAt=-Infinity; this._burstLeft=0; this._burstNext=0;
    this._lastPos=null; this._lastPosAt=-Infinity; this._lastSyncAt=-Infinity;
    this._samples=[];
    this.clock={offset:0,rtt:0,toLocal:ts=>ts-this.clock.offset};
    this.spell={open:false,mineDone:false,theirsDone:false,sec:0,openedAt:0};
    this.died=false; this.theyDied=false; this._myDeathAt=0; this._theirDeathAt=0;
    this._lastRx=this.now();
    transport.onmessage=text=>{ const m=_np.decode(text); if(m) this._handle(m); };
    transport.onclose=()=>this._onClose();
    const hi={t:'hello',v:_np.NET_V,name:this.name,deck:this.deck}; if(this.look) hi.look=this.look;
    this._send(hi,false);
  }

  on(name,fn){ (this._h[name]||(this._h[name]=[])).push(fn); return this; }
  _emit(name,p){ for(const fn of (this._h[name]||[]).slice()) fn(p); }

  // A timing/config value, read live from settings() each time; invalid or missing falls back to the default.
  setting(k){
    let s; try{ s=this._settings(); }catch(e){ s=null; }
    const v=s&&s[k];
    return (typeof v==='number'&&Number.isFinite(v))?v:NET_DEFAULTS[k];
  }
  _live(){ return this.state==='starting'||this.state==='fighting'; }

  _send(msg,stamp){
    if(this._left||this.state==='over'&&msg.t!=='bye') return;
    if(stamp!==false) msg.ts=this.now();
    this.transport.send(_np.encode(msg),_np.channelOf(msg.t));
  }

  clampTs(ts){
    const n=this.now();
    return Math.min(n,Math.max(this.clock.toLocal(ts),n-this.setting('mpBackdate')));
  }

  // ---- inbound ----
  _handle(m){
    if(this._left||this.state==='over') return;
    this._lastRx=this.now();
    switch(m.t){
      case 'hello': return this._onHello(m);
      case 'start':
        if(!this.host&&this.state==='lobby'){ this.state='starting'; this._emit('start',{seed:m.seed}); }
        return;
      case 'ready': this._readyGot=true; return this._maybeFight();
      case 'ping': return this._send({t:'pong',n:m.n,pts:m.ts});
      case 'pong': return this._onPong(m);
      case 'bye': return this._onPeerGone();
    }
    if(!this._live()) return;
    switch(m.t){
      case 'pos': case 'step': case 'sync': case 'shot': {
        const {t,...rest}=m; this._emit(t,{...rest,localTs:this.clampTs(m.ts)}); return;
      }
      case 'hit': {
        const p={dmg:m.dmg,color:m.color,localTs:this.clampTs(m.ts)};
        if(m.tile) p.tile={c:NET_COLS-1-m.tile.c,r:m.tile.r};
        this._emit('hit',p); return;
      }
      case 'spell': return this._openSpell(m.sec,false);
      case 'spelldone':
        if(this.spell.open){ this.spell.theirsDone=true; this._checkSpell(); }
        return;
      case 'end':
        if(m.loser==='me'&&!this.theyDied){ this.theyDied=true; this._theirDeathAt=this.clampTs(m.ts); this._noteDeath(); }
        return;
    }
  }

  _onHello(m){
    if(this._gotHello||this.state!=='connecting') return;
    this._gotHello=true;
    let why=null;
    if(m.v!==_np.NET_V) why='version mismatch';
    else if(m.deck.length<NET_DECK_MIN||m.deck.length>NET_DECK_MAX) why='invalid deck size';
    if(why){
      this._send({t:'bye'},false);
      this.state='over';
      this._emit('refused',{reason:why});
      return;
    }
    this.opp={name:m.name,look:m.look||''};
    this.state='lobby';
    this._lastRx=this.now();
    this._emit('lobby',{name:m.name,look:m.look||''});
    this._ping(); this._burstLeft=NET_BURST_N-1; this._burstNext=this.now()+NET_BURST_GAP;
    if(this.host&&this.state==='lobby'){
      const seed=this._seed();
      this._send({t:'start',seed},false);
      this.state='starting';
      this._emit('start',{seed});
    }
  }

  _onPeerGone(){
    if(this._live()){
      if(this.died||this.theyDied) this._resolveDeath();
      else this._finish('win','left');
    }else if(this.state==='connecting'||this.state==='lobby'){
      this.state='over';
      this._emit('refused',{reason:'peer left'});
    }
  }
  _onClose(){
    if(this._left||this.state==='over') return;
    this._onPeerGone();
  }

  // ---- clock sync ----
  _ping(){ this._lastPingAt=this.now(); this._send({t:'ping',n:++this._pingN}); }
  _onPong(m){
    const now=this.now(), rtt=now-m.pts;
    if(!(rtt>=0)) return;
    this._samples.push({rtt,offset:m.ts-(m.pts+rtt/2)});
    if(this._samples.length>NET_BURST_N) this._samples.shift();
    let best=this._samples[0];
    for(const s of this._samples) if(s.rtt<best.rtt) best=s;
    this.clock.offset=best.offset; this.clock.rtt=best.rtt;
  }

  // ---- outbound game messages ----
  sendPos(fx,fz,vx,vz){
    if(!this._live()) return;
    const n=this.now(), l=this._lastPos;
    if(n-this._lastPosAt<this.setting('mpSend')) return;
    if(l&&l[0]===fx&&l[1]===fz&&l[2]===vx&&l[3]===vz) return;
    this._lastPos=[fx,fz,vx,vz]; this._lastPosAt=n;
    this._send({t:'pos',fx,fz,vx,vz});
  }
  sendStep(from,to,dur){ if(this._live()) this._send({t:'step',from,to,dur}); }
  sendSync(hp,maxHp,barrier,gauge){
    if(!this._live()) return;
    const n=this.now();
    if(n-this._lastSyncAt<NET_SYNC_MS) return;
    this._lastSyncAt=n;
    this._send({t:'sync',hp,maxHp,barrier,gauge});
  }
  sendHit(dmg,color,tile){
    if(!this._live()) return;
    const m={t:'hit',dmg,color};
    if(tile) m.tile={c:tile.c,r:tile.r};
    this._send(m);
  }
  sendShot(r,color,big){ if(this._live()) this._send({t:'shot',r,color,big}); }

  ready(){
    if(this._readySent||this.state!=='starting') return;
    this._readySent=true; this._send({t:'ready'},false); this._maybeFight();
  }
  _maybeFight(){
    if(this.state==='starting'&&this._readySent&&this._readyGot){ this.state='fighting'; this._emit('fight',{}); }
  }

  // ---- synced spell screen ----
  _spellSec(){ const s=this.setting('mpSpell'); return Math.min(60,Math.max(1,s)); }
  openSpell(){ if(this._live()) this._openSpell(this._spellSec(),true); }
  _openSpell(sec,byMe){
    if(this.spell.open) return;
    sec=Math.min(60,Math.max(1,sec));
    Object.assign(this.spell,{open:true,mineDone:false,theirsDone:false,sec,openedAt:this.now()});
    if(byMe) this._send({t:'spell',sec});
    this._emit('spellopen',{sec,byMe});
  }
  spellDone(){
    if(!this.spell.open||this.spell.mineDone) return;
    this.spell.mineDone=true;
    this._send({t:'spelldone'});
    this._checkSpell();
  }
  _checkSpell(){
    const sp=this.spell;
    if(!sp.open) return;
    if((sp.mineDone&&sp.theirsDone)||this.now()-sp.openedAt>=sp.sec*1000+NET_SPELL_GRACE_MS){
      sp.open=false;
      this._emit('spellresume',{});
    }
  }

  // ---- death and end ----
  iDied(){
    if(!this._live()||this.died) return;
    this.died=true;
    this._myDeathAt=this.now();
    this._send({t:'end',loser:'me'});
    this._noteDeath();
  }
  // Both death times are on this side's clock (the peer's via clampTs of its end.ts), so both
  // sides compare the same two instants and agree: within the grace is a draw, else first to die loses.
  _noteDeath(){
    if(this.died&&this.theyDied) this._resolveDeath();
  }
  _resolveDeath(){
    if(this.died&&this.theyDied){
      const d=this._myDeathAt-this._theirDeathAt;
      if(Math.abs(d)<NET_DEATH_GRACE_MS) this._finish('draw','hp');
      else this._finish(d<0?'lose':'win','hp');
    }
    else if(this.died) this._finish('lose','hp');
    else this._finish('win','hp');
  }
  // How long a lone death waits before resolving. The first to die waits out the grace plus a round
  // trip, so a peer death inside the grace has time to arrive; the survivor needs only the grace.
  _deathWaitDone(n){
    if(this.died) return n-this._myDeathAt>=NET_DEATH_GRACE_MS+this.clock.rtt+NET_DEATH_MARGIN_MS;
    return n-this._theirDeathAt>=NET_DEATH_GRACE_MS;
  }
  _finish(result,reason){
    if(this.state==='over') return;
    this.state='over';
    this.spell.open=false;
    this._emit('end',{result,reason});
  }

  leave(){
    if(this._left) return;
    if(this.state!=='over') this._send({t:'bye'},false);
    this._left=true;
    this.state='over';
    this.spell.open=false;
    this.transport.close();
  }

  // Call every frame.
  tick(){
    if(this._left||this.state==='over') return;
    const n=this.now();
    if(this.state==='connecting') return;
    while(this._burstLeft>0&&n>=this._burstNext){ this._ping(); this._burstLeft--; this._burstNext+=NET_BURST_GAP; }
    if(n-this._lastPingAt>=NET_PING_MS) this._ping();
    if(n-this._lastRx>=NET_SILENCE_MS){
      if(this._live()) this._finish('win','timeout');
      else{ this.state='over'; this._emit('refused',{reason:'timeout'}); }
      return;
    }
    if(this._live()&&(this.died||this.theyDied)&&!(this.died&&this.theyDied)&&this._deathWaitDone(n)){ this._resolveDeath(); return; }
    if(this.spell.open){
      this._checkSpell();
      if(this.spell.open&&!this.spell.mineDone&&n-this.spell.openedAt>=this.spell.sec*1000) this.spellDone();
    }
  }
}

if(typeof module!=='undefined') module.exports={DuelSession,PosHistory,hitLands,NET_DEFAULTS,NET_COLS};
