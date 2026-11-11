// WebRTC data-channel transport and copy-paste pairing codes for the local PvP duel.
// No signalling server: the host's offer and the joiner's answer travel as short codes people copy between devices.
// Pure helpers (packSignal, unpackSignal) also load in Node for tests; RtcTransport is browser only.
'use strict';
const SIGNAL_PREFIX = 'HEX1.', SIGNAL_PREFIX2 = 'HEX2.';

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

// CRC-16/CCITT: catches every single mistyped character (a burst of up to 11 bits)
function crc16(u8) {
  let c = 0xffff;
  for (const b of u8) {
    c ^= b << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c;
}
const OLD = () => new Error('Bad code (this browser is too old for pairing codes)');

// ---- HEX2: the short code. Only what a data-channel connection needs is kept (type, ICE username and password, the
// sha-256 fingerprint, each UDP host address and port); the other phone writes a plain SDP back around it.
// Layout: [type 0|1][ufrag len][ufrag][pwd len][pwd][32 fingerprint bytes] then per address [kind 4|6|109][4|16 bytes][port 2], then crc16.
// Public STUN servers: each phone learns the address the internet sees it at (a srflx candidate), so two phones whose
// local addresses are hidden behind random .local names (mDNS, which many Wi-Fi networks do not pass between devices)
// can still find each other through their router. No game data goes through them; they only answer "this is you".
const RTC_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
function compactSdp(desc) {
  const sdp = desc.sdp, line = re => (sdp.match(re) || [])[1];
  const ufrag = line(/^a=ice-ufrag:(\S+)/m), pwd = line(/^a=ice-pwd:(\S+)/m), fp = line(/^a=fingerprint:sha-256 (\S+)/im);
  const mid = line(/^a=mid:(\S+)/m), sctp = line(/^a=sctp-port:(\d+)/m);
  if (!ufrag || !pwd || !fp || mid !== '0' || (sctp && sctp !== '5000') || ufrag.length > 255 || pwd.length > 255) return null;
  if (/^m=(?!application)/m.test(sdp)) return null;
  const fpb = fp.split(':').map(h => parseInt(h, 16));
  if (fpb.length !== 32 || fpb.some(isNaN)) return null;
  const out = [desc.type === 'answer' ? 1 : 0, ufrag.length, ...new TextEncoder().encode(ufrag), pwd.length, ...new TextEncoder().encode(pwd), ...fpb];
  const seen = new Set();
  // host addresses, then the public one a STUN server saw (srflx, IPv4 only: kind 44)
  for (const m of sdp.matchAll(/^a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ (host|srflx)/gim)) {
    const addr = m[1], port = +m[2], srflx = m[3].toLowerCase() === 'srflx';
    if (srflx && !/^\d+\.\d+\.\d+\.\d+$/.test(addr)) continue;
    if (seen.has(addr + ':' + port) || seen.size >= 8) continue;
    let kind, bytes;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(addr)) { kind = srflx ? 44 : 4; bytes = addr.split('.').map(Number); }
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.local$/i.test(addr)) { kind = 109; bytes = addr.slice(0, 36).replace(/-/g, '').match(/../g).map(h => parseInt(h, 16)); }
    else if (addr.includes(':')) {
      const [a, b] = addr.split('::'), hs = x => (x ? x.split(':') : []), l = hs(a), r = hs(b);
      if (b === undefined && l.length !== 8) continue;
      const g = [...l, ...Array(8 - l.length - r.length).fill('0'), ...r].map(h => parseInt(h, 16));
      if (g.length !== 8 || g.some(v => isNaN(v) || v > 0xffff)) continue;
      kind = 6; bytes = g.flatMap(v => [v >> 8, v & 255]);
    } else continue;
    seen.add(addr + ':' + port);
    out.push(kind, ...bytes, port >> 8, port & 255);
  }
  if (!seen.size) return null;
  return new Uint8Array(out);
}
function expandSdp(u8) {
  let i = 0;
  const need = n => { if (i + n > u8.length) throw new Error('short'); const v = u8.subarray(i, i + n); i += n; return v; };
  const type = need(1)[0] === 1 ? 'answer' : 'offer', dec = new TextDecoder();
  const ufrag = dec.decode(need(need(1)[0])), pwd = dec.decode(need(need(1)[0]));
  if (!/^[A-Za-z0-9+/]+$/.test(ufrag + pwd)) throw new Error('ice');
  const fp = Array.from(need(32), b => b.toString(16).toUpperCase().padStart(2, '0')).join(':');
  const cands = [];
  while (i < u8.length) {
    const kind = need(1)[0];
    let addr;
    if (kind === 4 || kind === 44) addr = Array.from(need(4)).join('.');
    else if (kind === 6) { const b = need(16), g = []; for (let k = 0; k < 16; k += 2) g.push(((b[k] << 8) | b[k + 1]).toString(16)); addr = g.join(':'); }
    else if (kind === 109) { const h = Array.from(need(16), b => b.toString(16).padStart(2, '0')).join(''); addr = h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20) + '.local'; }
    else throw new Error('kind');
    const p = need(2), port = (p[0] << 8) | p[1];
    cands.push('a=candidate:' + (cands.length + 1) + ' 1 udp ' + ((kind === 44 ? 1686052607 : 2122260223) - cands.length) + ' ' + addr + ' ' + port + (kind === 44 ? ' typ srflx raddr 0.0.0.0 rport 0' : ' typ host'));
  }
  if (!cands.length) throw new Error('no address');
  const sdp = ['v=0', 'o=- ' + Math.floor(Math.random() * 1e15) + ' 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0', ...cands, 'a=ice-ufrag:' + ufrag, 'a=ice-pwd:' + pwd,
    'a=fingerprint:sha-256 ' + fp, 'a=setup:' + (type === 'offer' ? 'actpass' : 'active'), 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''].join('\r\n');
  return { type, sdp };
}

// {type, sdp} -> "HEX2.xxxx-xxxx-..." (the short code), or "HEX1...." when the description is not one HEX2 can carry
async function packSignal(desc) {
  const c = compactSdp(desc);
  if (c) {
    const out = new Uint8Array(c.length + 2), crc = crc16(c);
    out.set(c); out[c.length] = crc >> 8; out[c.length + 1] = crc & 255;
    return SIGNAL_PREFIX2 + bytesToB64url(out).match(/.{1,4}/g).join('-');
  }
  if (typeof CompressionStream === 'undefined') throw OLD();
  const json = JSON.stringify({ type: desc.type, sdp: desc.sdp });
  const z = await pipeBytes(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  const out = new Uint8Array(z.length + 2);
  out.set(z);
  const crc = crc16(z);
  out[z.length] = crc >> 8;
  out[z.length + 1] = crc & 255;
  return SIGNAL_PREFIX + bytesToB64url(out).match(/.{1,4}/g).join('-');
}

// the inverse; tolerates whitespace, prefix case and stray separators. Throws Error('Bad code ...') and nothing else.
async function unpackSignal(code) {
  const bad = why => new Error('Bad code (' + why + ')');
  if (typeof DecompressionStream === 'undefined') throw OLD();
  if (typeof code !== 'string') throw bad('empty');
  const c = code.replace(/\s+/g, '');
  if (c.slice(0, SIGNAL_PREFIX2.length).toUpperCase() === SIGNAL_PREFIX2) {
    const body2 = c.slice(SIGNAL_PREFIX2.length).replace(/-/g, '');
    let z2;
    try { z2 = b64urlToBytes(body2); } catch (e) { throw bad('characters are wrong'); }
    if (z2.length < 40 || bytesToB64url(z2) !== body2) throw bad('check the characters');
    const zz2 = z2.subarray(0, z2.length - 2);
    if (crc16(zz2) !== ((z2[z2.length - 2] << 8) | z2[z2.length - 1])) throw bad('check the characters');
    try { return expandSdp(zz2); } catch (e) { throw bad('it is damaged or incomplete'); }
  }
  if (c.slice(0, SIGNAL_PREFIX.length).toUpperCase() !== SIGNAL_PREFIX) throw bad('it should start with HEX2.');
  const body = c.slice(SIGNAL_PREFIX.length).replace(/-/g, '');
  if (!body) throw bad('nothing after HEX1.');
  let z;
  try {
    z = b64urlToBytes(body);
  } catch (e) {
    throw bad('characters are wrong');
  }
  // the last two bytes are the checksum; re-encoding must give the same text, so spare padding bits are checked too
  if (z.length < 3 || bytesToB64url(z) !== body) throw bad('check the characters');
  const zz = z.subarray(0, z.length - 2);
  if (crc16(zz) !== ((z[z.length - 2] << 8) | z[z.length - 1])) throw bad('check the characters');
  let d;
  try {
    d = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await pipeBytes(zz, new DecompressionStream('deflate-raw'))));
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
    const pc = new RTCPeerConnection({ iceServers: RTC_ICE });
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
    const pc = new RTCPeerConnection({ iceServers: RTC_ICE });
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

// WebSocket transport through tools/netplay/relay.js (same-LAN play without pairing codes). Browser only.
// One ordered stream, so the channel argument of send() is ignored.
class WsTransport {
  constructor(ws) {
    this.ws = ws;
    this.onclose = null;
    this.closed = false;
    this._h = null;
    this._q = [];
    ws.onmessage = e => {
      if (this.closed || typeof e.data !== 'string') return;
      if (this._h) this._h(e.data);
      else this._q.push(e.data);
    };
    ws.onclose = ws.onerror = () => this._fire();
  }
  get onmessage() {
    return this._h;
  }
  set onmessage(f) {
    this._h = f;
    while (f && this._q.length) f(this._q.shift());
  }
  send(text) {
    if (this.closed || this.ws.readyState !== 1) return;
    try {
      this.ws.send(text);
    } catch (e) {}
  }
  _fire() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.ws.close();
    } catch (e) {}
    if (this.onclose) this.onclose();
  }
  close() {
    this._fire();
  }
  static connect(room) {
    return new Promise((res, rej) => {
      const fail = () => rej(new Error('Could not reach the room (is the relay running?)'));
      let ws;
      try {
        ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/relay?room=' + encodeURIComponent(room));
      } catch (e) {
        return fail();
      }
      ws.onopen = () => res(new WsTransport(ws));
      ws.onerror = ws.onclose = fail;
    });
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { packSignal, unpackSignal };
