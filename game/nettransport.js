// WebRTC data-channel transport and copy-paste pairing codes for the local PvP duel.
// No signalling server: the host's offer and the joiner's answer travel as short codes people copy between devices.
// Pure helpers (packSignal, unpackSignal) also load in Node for tests; RtcTransport is browser only.
'use strict';
const SIGNAL_PREFIX = 'HEX1.';

async function pipeBytes(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
function bytesToB64url(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x2000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x2000));
  // base64url, except that its '-' is written '.', because '-' is the group separator
  return btoa(s).replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(t) {
  if (!/^[A-Za-z0-9_.]*$/.test(t) || t.length % 4 === 1) throw new Error('base64');
  const s = atob(t.replace(/\./g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4));
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

// {type, sdp} -> "HEX1.xxxx-xxxx-..."
async function packSignal(desc) {
  const json = JSON.stringify({ type: desc.type, sdp: desc.sdp });
  const z = await pipeBytes(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return SIGNAL_PREFIX + bytesToB64url(z).match(/.{1,4}/g).join('-');
}

// the inverse; tolerates whitespace, prefix case and stray separators. Throws Error('Bad code ...') and nothing else.
async function unpackSignal(code) {
  const bad = why => new Error('Bad code (' + why + ')');
  if (typeof code !== 'string') throw bad('empty');
  const c = code.replace(/\s+/g, '');
  if (c.slice(0, SIGNAL_PREFIX.length).toUpperCase() !== SIGNAL_PREFIX) throw bad('it should start with HEX1.');
  const body = c.slice(SIGNAL_PREFIX.length).replace(/-/g, '');
  if (!body) throw bad('nothing after HEX1.');
  let z;
  try {
    z = b64urlToBytes(body);
  } catch (e) {
    throw bad('characters are wrong');
  }
  let d;
  try {
    d = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await pipeBytes(z, new DecompressionStream('deflate-raw'))));
  } catch (e) {
    throw bad('it is damaged or incomplete');
  }
  if (!d || (d.type !== 'offer' && d.type !== 'answer') || typeof d.sdp !== 'string' || !d.sdp.startsWith('v=0'))
    throw bad('not a connection code');
  return { type: d.type, sdp: d.sdp };
}

// Transport contract: {send(text, channel), onmessage, onclose, close()}
class RtcTransport {
  constructor(pc) {
    this.pc = pc;
    this.onmessage = null;
    this.onclose = null;
    this.closed = false;
    this._q = [];
    this._dropTimer = 0;
    this.safe = pc.createDataChannel('safe', { negotiated: true, id: 1 });
    this.fast = pc.createDataChannel('fast', { negotiated: true, id: 0, ordered: false, maxRetransmits: 0 });
    for (const ch of [this.safe, this.fast]) {
      ch.onmessage = e => {
        if (this.closed || typeof e.data !== 'string') return;
        if (this.onmessage) this.onmessage(e.data);
        else this._q.push(e.data);
      };
      ch.onclose = () => this._fire();
    }
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      clearTimeout(this._dropTimer);
      if (s === 'failed') this._fire();
      else if (s === 'disconnected') this._dropTimer = setTimeout(() => pc.connectionState === 'disconnected' && this._fire(), 3000);
    };
  }
  get onmessage() {
    return this._h;
  }
  set onmessage(f) {
    this._h = f;
    while (f && this._q && this._q.length) f(this._q.shift());
  }
  send(text, channel) {
    if (this.closed) return;
    const ch = channel === 'fast' ? this.fast : this.safe;
    if (ch.readyState !== 'open') return;
    try {
      ch.send(text);
    } catch (e) {}
  }
  _fire() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this._dropTimer);
    try {
      this.pc.close();
    } catch (e) {}
    if (this.onclose) this.onclose();
  }
  close() {
    this._fire();
  }
  opened(ms) {
    return new Promise((res, rej) => {
      const both = () => this.safe.readyState === 'open' && this.fast.readyState === 'open';
      if (both()) return res();
      const t = setTimeout(() => rej(new Error('connection timed out')), ms || 10000);
      const chk = () => {
        if (both()) {
          clearTimeout(t);
          res();
        }
      };
      this.safe.addEventListener('open', chk);
      this.fast.addEventListener('open', chk);
    });
  }

  // Resolves when ICE gathering is complete. Some browsers and sandboxes never report 'complete' on a LAN-only
  // connection, so it also resolves 1.2 s after the last candidate (once there is one) and 5 s after the start.
  static _gathered(pc) {
    return new Promise(res => {
      let idle = 0;
      const finish = () => {
        clearTimeout(idle);
        clearTimeout(cap);
        pc.removeEventListener('icegatheringstatechange', done);
        pc.removeEventListener('icecandidate', cand);
        res();
      };
      const done = () => pc.iceGatheringState === 'complete' && finish();
      const cand = e => {
        clearTimeout(idle);
        if (!e.candidate) finish();
        else idle = setTimeout(finish, 1200);
      };
      const cap = setTimeout(finish, 5000);
      if (pc.iceGatheringState === 'complete') return finish();
      pc.addEventListener('icegatheringstatechange', done);
      pc.addEventListener('icecandidate', cand);
    });
  }
  static async host() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const transport = new RtcTransport(pc);
    await pc.setLocalDescription(await pc.createOffer());
    await RtcTransport._gathered(pc);
    const offerCode = await packSignal(pc.localDescription);
    return {
      transport,
      offerCode,
      async accept(answerCode) {
        const d = await unpackSignal(answerCode);
        if (d.type !== 'answer') throw new Error('Bad code (that is an offer, not an answer)');
        try {
          await pc.setRemoteDescription(d);
        } catch (e) {
          throw new Error('Bad code (' + e.message + ')');
        }
      }
    };
  }
  static async join(offerCode) {
    const d = await unpackSignal(offerCode);
    if (d.type !== 'offer') throw new Error('Bad code (that is an answer, not an offer)');
    const pc = new RTCPeerConnection({ iceServers: [] });
    const transport = new RtcTransport(pc);
    try {
      await pc.setRemoteDescription(d);
      await pc.setLocalDescription(await pc.createAnswer());
    } catch (e) {
      pc.close();
      throw new Error('Bad code (' + e.message + ')');
    }
    await RtcTransport._gathered(pc);
    return { transport, answerCode: await packSignal(pc.localDescription) };
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { packSignal, unpackSignal };
