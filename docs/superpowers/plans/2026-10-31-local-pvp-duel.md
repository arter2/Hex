# Local PvP Duel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two players on the same local network duel each other, mage against mage, in the existing real-time hex battle, with no internet server.

**Architecture:** Each device runs its own normal battle (`B`) in which the "enemy" is a single remote avatar that mirrors the opponent's mage. Hits are attacker-authoritative: when my card or wand hits the avatar, my client sends `{dmg, color}` and the opponent's client applies it with the existing `hitPlayer`. This avoids lockstep, which is not possible here because `battle.js` calls `Math.random()` throughout and the sim is floating-point real time. Transport sits behind a small interface with two adapters: WebRTC data channel (primary, browser-only, manual code pairing) and a LAN WebSocket relay script (fallback). To keep the mirror tight, movement goes on an unordered no-retry channel, every message carries a timestamp that a clock-offset estimate maps to the receiver's clock, and the receiver replays the opponent's tile steps instead of guessing positions. Close calls go to the defender: a hit carries the tile it landed on and its timestamp, and the receiver ignores it if its mage was off that tile within a short window around that moment. Full rollback netcode is deliberately not part of this plan (see `2026-10-31-rollback-netcode-later.md`).

**Tech Stack:** Plain `<script>` globals (no build step), WebRTC `RTCDataChannel`, Node 22 + `ws` for the relay, Node `assert` tests under `tools/playtest/`, Playwright (already used) for two-page browser tests.

**Spec:** None written. The design is the conversation: PvP duel, WebRTC first with a LAN relay second. The "Design decisions" section below is the spec for this plan.

## Design decisions (assumptions the implementer must not re-open)

- **Mode:** one mage per side. Board is the normal 9 x 14 board. Each player stands on their own half, sees themselves near the camera, and sees the opponent on the enemy half.
- **Lane mapping:** my tile `(col, r)` is shown to the opponent on `tileCR(BOARD_COLS-1-col, r)`. The row is kept, so a shot down my row meets an opponent standing in that same row.
- **Loadout:** each player uses their own saved deck (it must pass `validateDeck`) but no gear, base 120 HP. So the gap between players is the deck only.
- **Rewards:** a duel gives and costs nothing and never touches saves. It uses its own `hooks.onEnd`, not `victory()` or `defeat()`.
- **Damage:** the sender's hit path computes damage (element, counter hit, crit, hero and so on). The receiver applies its own mitigation through `hitPlayer` (dodge, barrier, guard). No 45% one-shot cap applies, because the source kind is `'pvp'`, not `'enemy'`.
- **Not mirrored in v1:** status effects (freeze, stun and so on), ground effects and summoned creatures on the receiver's side. Damage-over-time hits are mirrored, because each tick is a `hitEnemy` call that gets sent.
- **Synced card screen:** the Spell (card) screen is shared. When either player taps Spell, it opens on both devices and the fight is paused on both (`B.phase==='custom'`). The Spell button lights for a player when their own gauge or the opponent's reported gauge is full. Opening consumes both gauges (both reset to 0). The screen lasts `mpSpell` seconds (default **10**, set in the debug menu), counted from when it opened on each device. The fight resumes on both devices when both players have pressed Fight! (or their countdown has ended). A player whose `spelldone` never arrives is waited for at most `mpSpell + 2` seconds. The opener's `mpSpell` value is sent in the `spell` message, so one setting decides each screen. Two simultaneous opens merge into one. Hits that were already in flight when the pause began are queued and applied on resume.
- **Multiplayer lives in the debug menu** (Debug › Multiplayer), not on the main menu: a "Start a duel" button that opens the pairing screen, and sliders for every timing in this plan. They are saved in this browser like the other debug settings (`XLIT` keys). In a duel the debug "Pause the game" checkbox is disabled, so it cannot stall the opponent.
- **Result:** a client that reaches 0 HP sends `end`. First `end` received wins. Both sides receiving each other's `end` is a draw.
- **Two channels:** "fast" (unordered, no retransmit) carries `pos`, `step`, `shot`, `ping`, `pong`, because a lost position is replaced by the next one. "safe" (ordered, reliable) carries `hello`, `ready`, `start`, `hit`, `sync`, `end`, `bye`. The WebSocket relay has one TCP stream, so both map to it.
- **Movement mirroring:** tile walks are sent as `step{from,to,dur,ts}` and replayed exactly by the avatar. Joystick (free) movement has no tile steps, so it is sent as `pos{fx,fz,vx,vz,ts}` samples at up to once per frame, only when changed, and the avatar interpolates with a buffer of at most 2 frames (33 ms).
- **Clock:** messages carry `ts`, the sender's `now()` in ms. Each side estimates `offset` (remote clock minus local clock) from ping/pong exchanges, keeping the sample with the lowest round trip out of the last 8. `toLocal(ts) = ts - offset`.
- **Defender wins close calls:** a `hit` carries `tile{c,r}` (the avatar's tile when it landed, in the attacker's own coordinates) and `ts`. The receiver maps `tile` to its own coordinates (`c' = BOARD_COLS-1-c`) and the timestamp to local time, then applies the hit only if its mage stood on that tile for the whole window `[ts-defendMs, ts]`. Otherwise it shows `dodge` and drops the hit. A `hit` with no `tile` (damage over time, ground effects) always applies. A `ts` older than `backdateMs` before arrival is clamped to `backdateMs`, so a laggy or cheating sender cannot reach back in time.
- **Tunable timings** (`NET_DEFAULTS` in `netduel.js`, mirrored as `XLIT` keys so the debug menu can change them live): `mpSpell: 10` s (card screen length), `mpDefend: 50` ms (defender window), `mpBackdate: 250` ms (back-date clamp), `mpSend: 16` ms (smallest gap between `pos` messages), `mpSmooth: 33` ms (avatar smoothing buffer). Wherever this plan says 50 ms, 250 ms, 16 ms, 33 ms or 8 s, it means the default of these settings.
- **Known cost of that rule:** the attacker's floater is predictive, so after a dropped hit it shows damage that did not happen. The opponent's HP bar (from `sync`) stays correct.
- **Out of scope:** QR codes, internet play, matchmaking, spectators, more than two players, rematch history.

## Global Constraints

- No build step and no new browser libraries: new game code is plain script files loaded from `game/index.html`, in the same style as the existing files.
- New logic files must be loadable in Node the way `engine.js` is: end with `if(typeof module!=='undefined') module.exports={...}`.
- Must work in Safari on iPhone and iPad and in Chromium. The relay needs a page served over `http` by the relay itself.
- Protocol version constant `NET_V = 1`. A mismatch is refused at handshake.
- Latency budget on a local network over direct WebRTC: median round trip under 15 ms and 95th percentile under 40 ms on the fast channel (measured in Task 4). The avatar must never lag the opponent's real mage by more than 3 frames' worth of movement.
- Bump the build number in `game/index.html` (`<title>Hexmancers v179</title>` and `<meta name="application-version" content="179">`) to 180 in the last task only.
- New tests run in the existing "Bot self-checks" step of `.github/workflows/quick-test.yml`, and the browser tests run in the existing job after the battle taps.

## Review Focus

Failure modes the design implies that no one asked for. Each has a test in the task named.

1. **Opponent disconnects or goes silent mid-duel** (Wi-Fi drop, tab closed, phone locked): the other player must see "Opponent left", win by forfeit and get back to the menu. No frozen fight. (Task 2, Task 3)
2. **Malformed or hostile messages** (NaN or Infinity damage, damage of 1e9, wrong types, unknown `t`, oversized frames, JSON that throws, a `ts` far in the past or future, a `hit` tile off the board): dropped or clamped without an exception and without changing HP. (Tasks 1, 2)
3. **Both mages reach 0 HP in the same moment:** both clients must show a draw, not "you won" on one side and "you lost" on the other. (Task 2)
4. **The synced card screen gets stuck or splits:** one player disconnects, never presses Fight!, or both tap Spell at the same moment during the pause. Both devices must resume within `mpSpell + 2` s (or end as a forfeit on disconnect), opening twice must not double-draw cards, and hits already in flight when the pause began must be applied after resume, none lost, none applied during the pause. (Tasks 2, 3)
5. **Old build against new build** (one player has a cached older version, common on itch.io and phones): refused at handshake with a message naming the version problem, not a silent desync. A garbled or half-copied pairing code must give a readable error, not an exception. (Task 2, Task 5)

---

## File structure

- Create `game/netplay.js`: `NET_V`, message codec and validation, `Transport` contract, `loopbackPair()`. No game or DOM dependencies.
- Create `game/netduel.js`: `DuelSession` (handshake, state machine, outbound throttling, heartbeat, end rules). No DOM dependencies.
- Create `game/nettransport.js`: `RtcTransport`, pairing-code helpers (`packSignal`, `unpackSignal`), `WsTransport`. Browser only, except the pure code helpers, which are exported for Node.
- Modify `game/battle.js`: `startDuel`, the avatar, the `hitEnemy` intercept, the `updateEnemy` skip, queued inbound hits, duel end.
- Modify `game/enemies.js`: the avatar's enemy def and the `updateEnemy` skip (`updateEnemy` is at line 296).
- Modify `game/ui.js`, `game/index.html`, `game/style.css`: Duel entry on the main menu and the pairing screen.
- Create `tools/netplay/relay.js` and `tools/netplay/package.json`: LAN relay and static server.
- Create tests: `tools/playtest/netplay-test.js` (Node), `tools/playtest/duel-runner.js` (Playwright, two pages).
- Create `docs/multiplayer.md`; modify `.github/workflows/quick-test.yml`.

---

### Task 1: Message codec and transport contract

**Files:**
- Create: `game/netplay.js`
- Create: `tools/playtest/netplay-test.js`

**Interfaces:**
- Produces:
  - `const NET_V=1`
  - `encode(msg: object) -> string`
  - `decode(text: string) -> object|null`. It returns `null` for anything invalid and never throws.
  - Message shapes, all with `t` (every message except `hello`, `ready`, `start`, `bye` also has `ts`, a finite number of ms): `hello{t,v,name,deck}`, `ready{t}`, `start{t,seed}`, `pos{t,ts,fx,fz,vx,vz}`, `step{t,ts,from:{c,r},to:{c,r},dur}`, `sync{t,ts,hp,maxHp,barrier,gauge}` (`gauge` a number 0 to 10), `spell{t,ts,sec}` (`sec` a number 1 to 60), `spelldone{t,ts}`, `hit{t,ts,dmg,color,tile?:{c,r}}`, `shot{t,ts,r,color,big}`, `end{t,ts,loser}`, `ping{t,ts,n}`, `pong{t,ts,n,pts}` (`pts` is the ping's `ts` echoed back), `bye{t}`
  - `CHANNEL: {pos:'fast', step:'fast', shot:'fast', ping:'fast', pong:'fast'}`; every other `t` is `'safe'`. `channelOf(t: string) -> 'fast'|'safe'`.
  - Transport contract (duck-typed): `{send(text, channel: 'fast'|'safe'), onmessage: (text)=>void, onclose: ()=>void, close()}`
  - `loopbackPair(opts?: {delayMs?: number, setTimeout?: (fn,ms)=>void}) -> [TransportA, TransportB]`. Messages sent on one arrive asynchronously on the other after `delayMs` (default 0) and, per channel, in order. `close()` on one fires `onclose` on both.

- [ ] **Step 1: Write the failing tests** in `tools/playtest/netplay-test.js` (plain Node, `node:assert/strict`, loading `../../game/netplay.js`):
  - `round trip`: `decode(encode(m))` deep-equals `m` for one valid message of every `t`.
  - `rejects hostile input`: `decode` returns `null` for `'not json'`, `'null'`, `'[]'`, `'{"t":"nope"}'`, `'{"t":"hit","dmg":NaN}'` (written as the string `{"t":"hit","dmg":null}`), `{"t":"hit","dmg":1e9,"color":"red"}`, `{"t":"hit","dmg":-5,"color":"red"}`, `{"t":"pos","c":"x","r":1}`, and any string longer than 4096 characters.
  - `hit damage bounds`: `dmg` 1 to 500 accepted, 0 and 501 rejected, non-integers rejected.
  - `hit tile bounds`: `tile` `{c:13,r:8}` accepted, `{c:14,r:0}`, `{c:-1,r:0}` and `{c:1.5,r:0}` rejected; a `hit` without `tile` accepted. A `hit`, `pos`, `step` or `shot` without `ts`, or with a non-finite `ts`, is rejected.
  - `step bounds`: `dur` from 0.05 to 2 accepted, 0 and 3 rejected.
  - `spell shapes`: `spell{sec:10}` and `{sec:60}` accepted, `{sec:0}`, `{sec:61}`, `{sec:'x'}` and a missing `sec` rejected; `spelldone` needs a finite `ts`; `sync` with `gauge` 0 and 10 accepted, -1 and 11 rejected.
  - `channels`: `channelOf('pos')`, `'step'`, `'shot'`, `'ping'`, `'pong'` are `'fast'`; `channelOf('hit')`, `'end'`, `'sync'`, `'hello'` are `'safe'`; `channelOf('nope')` is `'safe'`.
  - `loopback delay`: with `delayMs:10` and an injected `setTimeout`, a message is not delivered before 10 fake ms and is delivered at 10.
  - `loopback`: a message sent on A arrives on B after a tick, order is preserved over 100 messages, and `close()` fires both `onclose` callbacks exactly once.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/netplay-test.js`
Expected: FAIL (`Cannot find module` or `encode is not a function`).

- [ ] **Step 3: Implement `game/netplay.js`** with the interfaces above. Validation is a table `SHAPES = {t: {field: predicate}}`, and `decode` checks every field of the matching shape. `color` must be one of the keys of `COLORS` when that global exists, and any short string otherwise (Node has no `COLORS`). `pos.c` is an integer 0 to 13 and `pos.r` an integer 0 to 8. `fx` and `fz` are optional finite numbers.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/netplay-test.js`
Expected: PASS, every test prints `ok`.

- [ ] **Step 5: Commit**

```bash
git add game/netplay.js tools/playtest/netplay-test.js
git commit -m "feat: netplay message codec, validation and loopback transport"
```

---

### Task 2: Duel session state machine

**Files:**
- Create: `game/netduel.js`
- Modify: `tools/playtest/netplay-test.js` (add tests, same file)

**Interfaces:**
- Consumes: `encode`, `decode`, `NET_V`, a transport (Task 1).
- Produces: `class DuelSession`
  - `constructor(transport, {name: string, deck: string[], host: boolean, now: ()=>number, seed?: ()=>number, settings?: ()=>Partial<typeof NET_DEFAULTS>})`. `settings` defaults to `()=>NET_DEFAULTS`; missing keys fall back to `NET_DEFAULTS`.
  - `state`: one of `'connecting'|'lobby'|'starting'|'fighting'|'over'`
  - Handshake: both sides send `hello`. The host, once it has the guest's `hello`, sends `start{seed}` and both go to `'starting'`.
  - Events through `session.on(name, fn)`: `'lobby'` (opponent `{name}`), `'start'` (`{seed}`), `'hit'` (`{dmg,color,tile?,localTs}`, where `tile` is already mapped to local coordinates and `localTs` is the clamped local-clock time), `'pos'` and `'step'` (same fields as the message plus `localTs`), `'sync'`, `'shot'`, `'end'` (`{result: 'win'|'lose'|'draw', reason: 'hp'|'left'|'timeout'}`), `'refused'` (`{reason: string}`)
  - Methods: `sendPos(fx,fz,vx,vz)` (drops calls within `mpSend` ms of the last, and calls whose values equal the last sent), `sendStep(from,to,dur)`, `sendSync(hp,maxHp,barrier,gauge)` (200 ms), `sendHit(dmg,color,tile?)` (never throttled), `sendShot(r,color,big)`, `iDied()` (sends `end{loser:'me'}`), `tick()` (call every frame; sends `ping` every 1 s, and ends with `reason:'timeout'` if nothing arrived for 5 s), `leave()` (sends `bye`, closes). All `send*` stamp `ts=now()` and pick the channel with `channelOf`.
  - `clock.offset: number` and `clock.toLocal(ts) -> number`. On entering `'lobby'` the session sends 8 `ping`s 20 ms apart. Each `pong` gives one sample (`rtt = now - pts`, `offset = ts - (pts + rtt/2)`), and the session keeps the lowest-`rtt` sample of the last 8. The 1 s heartbeat pings keep the window fresh. `clock.rtt` is the `rtt` of the chosen sample.
  - `clampTs(ts) -> number`: `Math.min(now(), Math.max(toLocal(ts), now() - settings().mpBackdate))`, so a timestamp is never in the future and never older than `mpBackdate` ms (250 by default).
  - `class PosHistory` (exported, pure): `record(ts, c, r)` stores that the local mage stands on tile `(c,r)` from `ts` on (keeps the last 1 s), and `stoodOn(c, r, from, to) -> boolean` is true only if the mage was on `(c,r)` at every moment of `[from, to]`.
  - `hitLands(history: PosHistory, tile, localTs, defendMs: number) -> boolean`: `true` when `tile` is absent, otherwise `history.stoodOn(tile.c, tile.r, localTs - defendMs, localTs)`.
  - `NET_DEFAULTS = {mpSpell:10, mpDefend:50, mpBackdate:250, mpSend:16, mpSmooth:33}` and the `settings` option below: every timing in the session is read from `settings()` at the moment it is used, never cached, so a debug-menu change takes effect on the next use.
  - Synced card screen: `session.spell = {open:boolean, mineDone:boolean, theirsDone:boolean, sec:number, openedAt:number}`. `openSpell()` (no-op when already open) sets it open, sends `spell{sec: settings().mpSpell}` and fires `'spellopen'` with `{sec, byMe:true}`. A received `spell` opens it the same way (no-op when already open) and fires `'spellopen'` with `{sec, byMe:false}`, where `sec` is clamped to 1 to 60. `spellDone()` sets `mineDone` and sends `spelldone`; a received `spelldone` sets `theirsDone`. `tick()` marks `mineDone` itself (and sends `spelldone`) when `now() - openedAt >= sec*1000`. When `mineDone && theirsDone`, or when `now() - openedAt >= sec*1000 + 2000`, the screen closes and `'spellresume'` fires once. A peer `bye`, a transport close or a silence timeout while it is open ends the duel as in the forfeit rule and does not fire `'spellresume'`.
  - `{t:'bye'}` or transport `onclose` while `state==='fighting'` or `'starting'` ends the duel as `win` with `reason:'left'`.

- [ ] **Step 1: Write the failing tests** (a fake clock `now`, two sessions over `loopbackPair()`, drive with `await tick()`):
  - `handshake`: host and guest both reach `'starting'`, both fire `'start'` with the same `seed`, and each saw the other's `name`.
  - `version mismatch`: a guest that sends `hello{v:0}` makes the host fire `'refused'` with a reason that contains `'version'`, and state stays out of `'starting'`.
  - `invalid deck refused`: a `hello` whose `deck` has fewer than 45 entries or more than 60 gets `'refused'` with reason containing `'deck'`.
  - `hit relay`: `A.sendHit(12,'red')` fires `'hit'` on B with `{dmg:12,color:'red'}`, and 50 hits in the same tick all arrive.
  - `throttle`: ten `sendPos` calls with changing values within 10 ms of fake time deliver one `pos`; calls 16 ms apart all deliver; a repeat of identical values 100 ms later delivers nothing.
  - `clock offset`: with the two sessions' `now()` set 5000 ms apart and `loopbackPair({delayMs:10})`, after the lobby pings `|clock.offset - 5000| <= 1` and `clock.rtt` is 20; with a one-off 200 ms-late `pong` among the samples the offset is unchanged, because the lowest-`rtt` sample wins.
  - `spell opens on both`: `A.openSpell()` fires `'spellopen'` on both with the same `sec` (10 by default); a second `A.openSpell()` and a `spell` message arriving while open send and fire nothing more; both tapping at once leaves exactly one open screen on each side.
  - `spell resumes only when both are done`: after `A.spellDone()` neither side fires `'spellresume'`; after `B.spellDone()` both fire it exactly once.
  - `spell times out`: with neither side calling `spellDone()`, both fire `'spellresume'` once at `sec` seconds of fake time; with only A done, B's late `spelldone` is waited for until `sec*1000 + 2000` ms and then both resume.
  - `spell length follows settings`: with `settings: ()=>({mpSpell:4})` on the opener, the receiver's `'spellopen'` has `sec===4`; changing the opener's setting to 15 between two screens gives 15 on the next one; a received `sec` of 0 or 999 is clamped to 1 and 60.
  - `spell ends on leave`: B calls `leave()` while the screen is open; A ends `{result:'win',reason:'left'}` and never fires `'spellresume'`.
  - `settings are live`: with `settings: ()=>cfg` and `cfg.mpSend` changed from 16 to 100 between calls, the `sendPos` throttle changes on the next call; likewise `mpBackdate` for `clampTs` and `mpDefend` for `hitLands`.
  - `ts clamping`: a `hit` whose `ts` maps to 2 s in the past is delivered with `localTs === now()-250`; a `hit` whose `ts` maps to the future is delivered with `localTs === now()`.
  - `tile mapping`: a `hit` with `tile{c:2,r:4}` fires `'hit'` with `tile{c:11,r:4}`; `{c:0,r:8}` becomes `{c:13,r:8}`.
  - `defender wins`: with a `PosHistory` of the mage on `(11,4)` since t=0, `hitLands(h,{c:11,r:4},1000)` is true. The mage stepped to `(11,3)` at t=980, so a hit on `(11,4)` at 1000 is false (off the tile within 50 ms), and at 1000 on `(11,3)` it is also false, because the mage was only there for 20 ms of the window. A mage on `(11,4)` until 1000 and moved at 1001 gives true. A `hit` without `tile` is true whatever the history. A hit older than the 1 s history keeps resolving without throwing (treated as not standing, so false).
  - `forfeit on bye`: B calls `leave()` while fighting and A fires `'end'` with `{result:'win',reason:'left'}` exactly once.
  - `silence timeout`: after 5 s of fake time with no inbound message A ends `{result:'win',reason:'timeout'}`; a `ping` from B at 4.9 s resets the clock.
  - `draw`: both call `iDied()` before either has processed the other's `end`; both fire `'end'` with `result:'draw'`.
  - `single death`: only A calls `iDied()`; A ends `lose`, B ends `win`, both with `reason:'hp'`.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/netplay-test.js`
Expected: FAIL (`DuelSession is not defined`).

- [ ] **Step 3: Implement `DuelSession` in `game/netduel.js`.** The first valid `hello` from the peer decides acceptance: `v!==NET_V` or deck length outside 45 to 60 gives `'refused'`, and a refusal also sends `bye`. Track `died` (I sent `end`) and `theyDied`. The result is `draw` when both are true, resolved only when both flags are known or after a 300 ms grace on fake time, so the "same moment" case resolves to a draw instead of a race. `end` fires once (guard with `state==='over'`).

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/netplay-test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game/netduel.js tools/playtest/netplay-test.js
git commit -m "feat: DuelSession handshake, throttling, forfeit, timeout and draw rules"
```

---

### Task 3: Battle integration (the avatar duel)

**Files:**
- Modify: `game/battle.js` (`startBattle` at line 93, `hitEnemy` at line 196, `update` at line 970, `openCustomScreen`/`closeCustomScreen` at lines 174-190)
- Modify: `game/enemies.js` (`updateEnemy` at line 296, `makeEnemy` at line 96)
- Create: `tools/playtest/duel-runner.js`

**Interfaces:**
- Consumes: `DuelSession` events and methods (Task 2).
- Produces:
  - `startDuel(list: string[], session: DuelSession, hooks: {onEnd:(result:'win'|'lose'|'draw', reason:string)=>void}) -> B`. It calls `startBattle` with the enemy waves replaced by one avatar, no gear, and `hooks.onEnd` adapted. It sets `B.pvp={session, inbox:[], oppHp, oppMaxHp, spellLeft}`.
  - `duelAvatar(): enemy|null`: `B.enemies[0]` when `B.pvp` is set.
  - The avatar is a normal enemy object with `remote:true`, `kind:'enemy'`, standing on `tileCR(BOARD_COLS-1-c, r)` of the opponent's last `pos`. `e.hp` and `e.maxHp` always mirror the last `sync`.
  - `B.pvp.oppGauge` (the opponent's last reported gauge) and `B.pvp.spellLeft` (seconds left on the card screen, or `null`).
  - `hitEnemy(e,...)`: when `e.remote`, after `dmg` is computed (after the barrier branch), send `session.sendHit(dmg, card&&card.color||'white', opts.raw?undefined:{c:e.tile.col,r:e.tile.r})` with the tile expressed in the opponent's coordinates (`c' = BOARD_COLS-1-e.tile.col`), show the floater, and return `dmg` without touching `e.hp`. Raw hits (damage over time) carry no tile.
  - Receiving `'hit'`: drained through `hitLands(B.pvp.history, tile, localTs)`; when false, `floater('dodge', p.tile, '#9fdcff')` and the hit is dropped, otherwise `hitPlayer(dmg,{kind:'pvp',color})`. `B.pvp.history` is a `PosHistory`, recorded every `update` with `B.time`-independent wall time (`session`'s `now()`) and the mage's current tile, so it keeps running while queued on the Spell screen.
  - The avatar replays movement: on `'step'` it sets `e.step={from,to,t:max(0,now()-localTs)/1000,dur,half:false}` (tiles mapped with `tileCR(BOARD_COLS-1-c, r)`) and switches `e.tile`/occupancy at half-step exactly as the player's own step does (`update`, the `p.step` block). On `'pos'` it sets a target `(fx,fz)` with velocity and moves `rx/rz` toward `target + v*(now-localTs)/1000` with a smoothing buffer of 2 frames (33 ms). `fx`/`vx` are negated into the avatar's mirrored x direction.
  - `updateEnemy(e,dt)`: returns immediately when `e.remote` (no AI, no attacks).

- [ ] **Step 1: Write the failing test** in `tools/playtest/duel-runner.js` (Playwright, Chromium, two pages in one context, same launch pattern as `tools/playtest/battle-ui-runner.js`). Each page gets a bridge transport (`window.__bridgeSend` exposed with `page.exposeFunction`, delivering to the other page through `page.evaluate`) and calls `startDuel` with a valid starter deck. Assertions, each its own named check:
  - `avatar mirrors position`: page A moves its mage to `(col 2, row 4)`; within 300 ms page B's avatar is on the tile with `col===11 && r===4`.
  - `avatar tracks a walk`: A walks six tiles along row 4 and then holds a joystick direction for 1 s; B samples the avatar's `rx/rz` every frame and A's true `rx/rz` is sampled with its timestamp. For every sample, B's avatar is within 0.3 board units (the hex radius is 1) of where A's mage was 33 ms earlier, after the first 200 ms.
  - `defender wins a dodge`: A fires the wand down row 4 while B steps out of row 4 so that its `PosHistory` shows B off row 4 for the last 50 ms before the hit's `ts`; B's HP is unchanged and B shows a `dodge` floater. In the same setup with B standing still in row 4 for the whole window, B's HP drops.
  - `damage over time still lands`: a burn tick (a raw `hitEnemy` on the avatar) applies to B even while B moves.
  - `wand hit damages opponent`: A stands in row 4, B's mage in row 4; A fires the wand; B's `B.player.hp` drops by A's computed wand damage (±0 once B has no barrier or dodge) within 500 ms, and A's avatar `hp` follows B's `sync` within 500 ms.
  - `wand misses other row`: B in row 2, A fires in row 4: B's HP is unchanged after 1 s.
  - `death ends both`: set B's `hp` to 1 and hit it; both pages' `onEnd` fire once, A with `win` and B with `lose`, and neither page's save data (`localStorage`) changed (compare before and after).
  - `card screen opens on both`: B's gauge is set to 10 (full) and B taps Spell; within 300 ms both pages are in `B.phase==='custom'` and both gauges are 0.
  - `spell button lights for the opponent's full gauge`: only A's gauge is full; B's Spell button is lit within 400 ms (after A's `sync`), and tapping it opens the screen on both.
  - `fight resumes when both press Fight!`: A presses Fight!, A's screen shows "Waiting for opponent"; both stay in `custom`; after B presses Fight! both are in `B.phase==='fight'` within 300 ms.
  - `card screen length follows the setting`: `XLIT.mpSpell=4` on the opener, nobody presses Fight!; both pages return to `fight` between 4.0 s and 4.5 s after opening (and with the default, between 10.0 s and 10.5 s).
  - `queued hits during the card screen`: A's hit is in flight (delayed on the bridge by 100 ms) when B taps Spell; B's HP is unchanged while paused and drops after resume.
  - `a stuck opponent cannot hold the screen`: B stops answering after opening (its bridge drops everything); A returns to `fight` (or ends as a forfeit on silence) by `mpSpell + 2` s, never later.
  - `opponent leaves`: page B calls `session.leave()`; page A's `onEnd` fires `win` with reason `left` and no timers keep running (`B.phase` is `'win'`).

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: FAIL (`startDuel is not defined`).

- [ ] **Step 3: Implement `startDuel` and the avatar in `game/battle.js`** per the Interfaces block. Notes that the signatures do not settle:
  - The avatar needs a def that `makeEnemy` can build (name `'Rival'`, art reused from the player's own `look` where `sprites.js` allows, otherwise a stock sprite). Do not let `makeEncounter` run: pass `opts.waves` with the avatar's wave.
  - Inbound `hit` events push to `B.pvp.inbox`. In `update`, when `phase==='fight'`, drain the inbox through `hitPlayer(dmg,{kind:'pvp',color})`. While `phase==='custom'` leave it queued.
  - `update` sends `step` when `p.step` begins (tile walks), sends `pos` from the player's `rx/rz` and velocity during free (joystick) movement each frame (the session drops unchanged values), sends `sync` of `p.hp,p.maxHp,p.barrier`, records `PosHistory` and calls `session.tick()`. Send from real frame time, not from the `PACE`-scaled `dt`, since the player's own movement runs at full speed.
  - When `hitPlayer` sets `B.phase='lose'`, call `session.iDied()`. The `'end'` event drives `hooks.onEnd`. For a `win`, set `B.phase='win'`.
  - The synced card screen: in a duel, `gaugeFull()` (`battle.js` line 193) returns `B.gauge>=GAUGE_MAX || B.pvp.oppGauge>=GAUGE_MAX` (`oppGauge` comes from the opponent's `sync`). The Spell button calls `session.openSpell()` instead of `openCustomScreen()` directly. On `'spellopen'`, both clients call `openCustomScreen()` and set `B.gauge=0` (not when already `custom`). The card screen shows a countdown of the `sec` from the event, counted from when it opened locally. The Fight! button calls `session.spellDone()` and the screen shows "Waiting for opponent…" until `'spellresume'`, which calls `closeCustomScreen()`. `B.pvp.spellLeft` is the countdown shown. Cards queued but not cast go back to the hand exactly as in single-player.
  - Read every timing from `session`'s `settings()`, backed by the `XLIT` keys `mpSpell`, `mpDefend`, `mpBackdate`, `mpSend`, `mpSmooth`: `startDuel` passes `settings: ()=>({mpSpell:XLIT.mpSpell, mpDefend:XLIT.mpDefend, mpBackdate:XLIT.mpBackdate, mpSend:XLIT.mpSend, mpSmooth:XLIT.mpSmooth})`, and the avatar's smoothing uses `XLIT.mpSmooth`. In a duel, ignore `DBG.pause` in `update` (a local pause would stall the opponent).
  - Guard the fight-won safety check at `update`'s top section so the avatar's presence is the only enemy and the end comes from `'end'`, not from an empty enemy list.
  - Cards that target `alive()` enemies (lobs, strikes, heroes) then hit the avatar through `hitEnemy` with no further change. Run the check against `castCard` flows for the starter deck.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: PASS, all seven checks listed as passed.

- [ ] **Step 5: Run existing checks to confirm nothing regressed**

Run: `node tools/playtest/selftest.js && node tools/playtest/battle-clock-test.js && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: same pass counts as before the change.

- [ ] **Step 6: Commit**

```bash
git add game/battle.js game/enemies.js tools/playtest/duel-runner.js
git commit -m "feat: startDuel, remote avatar, attacker-authoritative hits"
```

---

### Task 4: Pairing code helpers and WebRTC transport

**Files:**
- Create: `game/nettransport.js`
- Modify: `tools/playtest/netplay-test.js` (add code-helper tests)
- Modify: `tools/playtest/duel-runner.js` (add one real-WebRTC check)

**Interfaces:**
- Consumes: the Transport contract (Task 1).
- Produces:
  - `packSignal(desc: {type:'offer'|'answer', sdp: string}) -> Promise<string>`: deflate (`CompressionStream`), base64url, prefixed `HEX1.`, then split into groups of 4 characters with `-` for reading aloud and re-typing.
  - `unpackSignal(code: string) -> Promise<{type,sdp}>`: tolerates spaces, newlines and a missing or extra trailing group separator. It throws an `Error` whose message starts with `'Bad code'` for a wrong prefix, bad base64, bad deflate, or an SDP that does not start with `v=0`.
  - `class RtcTransport` with `static async host() -> {transport, offerCode: string, accept(answerCode: string): Promise<void>}` and `static async join(offerCode) -> {transport, answerCode: string}`. Both use `new RTCPeerConnection({iceServers: []})` so only LAN host candidates are used. They wait for ICE gathering to finish before producing the code, and open two pre-negotiated data channels (`negotiated:true`, so neither side waits for a `datachannel` event): `'safe'` (`id:1`, ordered, reliable) and `'fast'` (`id:0`, `ordered:false, maxRetransmits:0`). `send(text, channel)` picks the channel. Implements the Transport contract. `onclose` fires on channel `close` and on connection state `failed` or `disconnected` longer than 3 s.

- [ ] **Step 1: Write the failing tests**
  - Node: `code round trip` (a fixture SDP of about 1.5 KB survives `unpackSignal(await packSignal(d))`), `forgiving input` (the same code with spaces, a newline in the middle, and lowercase prefix variants either parses or throws `Bad code`, never anything else), `garbage` (`''`, `'hello'`, `'HEX1.@@@'`, a valid code with one character changed each throw `Bad code ...`).
  - Browser (Playwright, two pages, no bridge): page A `RtcTransport.host()`, page B `join(offerCode)`, A `accept(answerCode)`; both open within 10 s and a `hello` from A arrives on B.
  - Browser, `channels are separate`: 200 `pos` messages sent on `'fast'` and 20 `hit` messages on `'safe'`; all 20 `hit`s arrive in order, and the `'fast'` messages that arrive are each valid (some may be lost or reordered, which is allowed).
  - Browser, `latency budget`: 200 ping/pong round trips on `'fast'` at 20 ms spacing; median RTT under 15 ms and 95th percentile under 40 ms, and the session's `clock.rtt` after the lobby handshake is under 40 ms. Print the numbers either way.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/netplay-test.js && node tools/playtest/duel-runner.js out/duel`
Expected: FAIL (`packSignal is not defined`).

- [ ] **Step 3: Implement** the helpers and `RtcTransport` per the Interfaces block. Export the pure helpers with the `module.exports` guard. Keep `RtcTransport` out of the export.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/netplay-test.js && node tools/playtest/duel-runner.js out/duel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game/nettransport.js tools/playtest/netplay-test.js tools/playtest/duel-runner.js
git commit -m "feat: WebRTC data-channel transport with copy-paste pairing codes"
```

---

### Task 5: LAN relay and WebSocket transport

**Files:**
- Create: `tools/netplay/relay.js`, `tools/netplay/package.json` (dependency `ws`)
- Modify: `game/nettransport.js` (add `WsTransport`)
- Create: `tools/netplay/relay-test.js`

**Interfaces:**
- Consumes: the Transport contract (Task 1).
- Produces:
  - `node tools/netplay/relay.js [--port 8080] [--dir game]`: serves the `game/` folder over HTTP and accepts WebSocket upgrades at `/relay?room=<4 letters>`. It pairs the first two sockets in a room, forwards each text frame to the other, closes both when either closes, and closes a third socket with code 4001. It prints `Open http://<LAN-IP>:<port> on both devices`.
  - Exports `startRelay({port, dir}) -> Promise<{port, close()}>` for tests.
  - `class WsTransport` with `static connect(room: string) -> Promise<WsTransport>`. It uses `ws://${location.host}/relay?room=`, and fulfils the Transport contract. It has one stream, so the `channel` argument is ignored. `relay.js` disables Nagle on each accepted socket (`setNoDelay(true)` on the upgrade socket) so small messages are not held back.

- [ ] **Step 1: Write the failing test** `tools/netplay/relay-test.js` (Node 22 global `WebSocket` as the client):
  - `forwards both ways`: two clients in room `ABCD` exchange 20 messages each, in order.
  - `rooms are isolated`: a client in `WXYZ` receives nothing from `ABCD`.
  - `third client refused`: a third socket in `ABCD` closes with code 4001 and the first two keep working.
  - `close propagates`: one side closes and the other gets `close` within 500 ms.
  - `serves the game`: `GET /index.html` returns 200 and contains `Hexmancers`, and `GET /../package.json` returns 404 (no path escape).

- [ ] **Step 2: Run to verify failure**

Run: `cd tools/netplay && npm install --silent && node relay-test.js`
Expected: FAIL (`Cannot find module './relay.js'`).

- [ ] **Step 3: Implement** `relay.js` with Node's `http` plus `ws`'s `WebSocketServer({noServer:true})`. The static server maps only files inside `--dir`, resolves the path and rejects anything outside it. Implement `WsTransport` in `nettransport.js`.

- [ ] **Step 4: Run to verify pass**

Run: `cd tools/netplay && node relay-test.js`
Expected: PASS, all five checks.

- [ ] **Step 5: Commit**

```bash
git add tools/netplay game/nettransport.js
git commit -m "feat: LAN relay script and WebSocket transport"
```

---

### Task 6: Debug-menu multiplayer section and pairing screen

**Files:**
- Modify: `game/index.html` (new `<section id="scrDuel" class="screen">`, script tags for `netplay.js`, `netduel.js`, `nettransport.js` after `battle.js` at line 594, a `<h3>Multiplayer</h3>` section in the `#debug` panel (`index.html` line 436 on), after the "Show Card lab" row at line 442)
- Modify: `game/ui.js` (the duel start flow, modelled on the `fight` wrapper at line 657)
- Modify: `game/look.js` (add the five `mp*` keys to `XLIT_DEF` at line 23, and their sliders to the binding table at line 285, using the same `[id, ()=>XLIT, key, 'hexmancers-xl-'+key, decimals, group]` form; give them a group that does not trigger a relight)
- Modify: `game/style.css`
- Modify: `tools/playtest/duel-runner.js` (add UI flow checks)

**Interfaces:**
- Consumes: `RtcTransport`, `WsTransport` (Tasks 4, 5), `DuelSession` (Task 2), `startDuel` (Task 3), `validateDeck`.
- Produces: the Duel flow:
  - Debug menu, new section **Multiplayer**, in this order: a row "Start a duel" with a button `#dbgDuel` (closes the debug overlay and opens `#scrDuel`; disabled with a hint when the saved deck fails `validateDeck`); then one slider row each, with the usual `<b>` value readout and a hint line: **Card screen length** `#dbgMpSpell` (`mpSpell`, 3 to 30 s, step 1, default 10), **Defender window** `#dbgMpDefend` (`mpDefend`, 0 to 200 ms, step 5, default 50), **Back-date limit** `#dbgMpBackdate` (`mpBackdate`, 50 to 1000 ms, step 10, default 250), **Position send gap** `#dbgMpSend` (`mpSend`, 0 to 100 ms, step 1, default 16), **Avatar smoothing** `#dbgMpSmooth` (`mpSmooth`, 0 to 100 ms, step 1, default 33); then a "Reset multiplayer timings" button `#dbgMpReset`. Values are saved like the other debug sliders, can be changed while a duel is running, and the debug "Pause the game" checkbox is disabled with a note while a duel is running.
  - There is no Duel button on the main menu.
  - `#scrDuel` steps: choose **Host** or **Join**, then **Wi-Fi code** (WebRTC) or **Room** (relay, offered only when the page was served over `http:` and not from itch.io), then the code exchange (host shows a code with a Copy button, guest pastes it and gets an answer code, host pastes it back), then a lobby that shows the opponent's name and **Start** for the host, then the duel, then a result card (`You won`, `You lost`, `Draw`, `Opponent left`, `Connection lost`) with **Back to menu**.
  - Refusals (`'refused'`) and `Bad code` errors show inline text on the same step and leave the player on it.

- [ ] **Step 1: Write the failing checks** in `duel-runner.js`, using the bridge transport from Task 3 and driving real taps (`page.tap` on the real buttons, as `ui-runner.js` does):
  - `multiplayer section is in the debug menu`: opening the debug overlay shows the Multiplayer heading, `#dbgDuel` and the five sliders with defaults 10, 50, 250, 16, 33; `#mmDuel` does not exist.
  - `sliders are saved and live`: moving `#dbgMpSpell` to 4 sets `XLIT.mpSpell===4` and `localStorage['hexmancers-xl-mpSpell']==='4'`, survives a reload, and `#dbgMpReset` restores all five defaults.
  - `pause is disabled in a duel`: while a duel is running `#dbgPause` is disabled; after the duel ends it is enabled again.
  - `duel button disabled without a valid deck`.
  - `host and guest reach lobby`: host chooses Host, Wi-Fi code; guest chooses Join, pastes the code; both see each other's name.
  - `bad code shows an error`: pasting `HEX1.nonsense` shows text containing `Bad code` and the screen stays on the same step.
  - `result card and back`: when the duel ends, the result card shows, **Back to menu** returns to `#scrMenu`, and `localStorage` save data is unchanged.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: FAIL (`#dbgDuel not found`).

- [ ] **Step 3: Implement** the screens, following the `#scrLab` section's markup style for the bar, back button and hint text, and the existing `.btn` and `.chip` classes. Sizes must work at phone portrait (the `ui-runner.js` sizes). Leaving `#scrDuel` at any step calls `session.leave()` or `transport.close()`.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/duel-runner.js out/duel && node tools/playtest/ui-runner.js out/ui`
Expected: PASS for both, and the menu tap test unaffected.

- [ ] **Step 5: Commit**

```bash
git add game/index.html game/ui.js game/style.css tools/playtest/duel-runner.js
git commit -m "feat: duel menu, pairing flow and result card"
```

---

### Task 7: Incoming shot telegraphs

Without this the defender sees damage but never sees a shot coming, which takes the dodging out of the game.

**Files:**
- Modify: `game/battle.js` (`fireWand` at line 944, the `shot` event handler from Task 3)
- Modify: `tools/playtest/duel-runner.js`

**Interfaces:**
- Consumes: `session.sendShot(r,color,big)` and the `'shot'` event (Task 2).
- Produces: `fireWand` sends `shot{r,color,big}` when `B.pvp` is set (on the fast channel through `channelOf`). On receipt, spawn a cosmetic projectile in `B.fx` that travels along my row `r` from the enemy half toward me at the wand's shot speed and does no damage. Start it `(now()-localTs)` seconds along its path so it is not late by the network delay.

- [ ] **Step 1: Write the failing check**: `incoming shot is visible`. A fires the wand; within 200 ms B's `B.fx` contains an entry of the new kind in row 4, and B's HP only changes when A's `hit` arrives, not when the cosmetic shot reaches B's tile.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: FAIL on `incoming shot is visible`.

- [ ] **Step 3: Implement** the send in `fireWand` and a cosmetic `fx` kind drawn by the existing `fx` renderer. Reuse the colour from `colorOf`.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game/battle.js tools/playtest/duel-runner.js
git commit -m "feat: cosmetic incoming shots in duels"
```

---

### Task 8: Docs, CI, packaging, version

**Files:**
- Create: `docs/multiplayer.md`
- Modify: `.github/workflows/quick-test.yml`, `tools/package-itch.py` (only if it lists files by name), `game/index.html` (version)

**Interfaces:**
- Consumes: everything above.
- Produces: a green CI run that includes the new tests.

- [ ] **Step 1: Wire the tests into CI.** In `quick-test.yml`, add `node tools/playtest/netplay-test.js` and `(cd tools/netplay && npm install --silent && node relay-test.js)` to "Bot self-checks", and add a step after "Battle and hand-screen taps" running `node tools/playtest/duel-runner.js test-results/duel`.

- [ ] **Step 2: Write `docs/multiplayer.md`**: how to open Debug › Multiplayer and start a duel over Wi-Fi code and over the relay (`node tools/netplay/relay.js`), the design decisions list above, the known limits (statuses not mirrored, same-LAN only, mDNS obfuscation can block WebRTC on some phones, so use the relay), what each timing slider does (card screen length, defender window, back-date limit, position send gap, avatar smoothing) with its default and a suggested range to try, how the synced card screen works, and how to run the tests.

- [ ] **Step 3: Check packaging.** Run `python3 tools/package-itch.py --help` (or read it) and confirm the three new `game/*.js` files end up in the zip. Add them if it uses an explicit list.

- [ ] **Step 4: Bump the version** from 179 to 180 in both places in `game/index.html`.

- [ ] **Step 5: Run everything**

Run: `node tools/playtest/selftest.js && node tools/playtest/battle-clock-test.js && node tools/playtest/netplay-test.js && node tools/playtest/duel-runner.js out/duel && node tools/playtest/ui-runner.js out/ui && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/multiplayer.md .github/workflows/quick-test.yml tools/package-itch.py game/index.html
git commit -m "docs+ci: multiplayer guide, CI wiring, build 180"
```

---

## Self-review

- **Spec coverage:** PvP duel (Tasks 3, 6), WebRTC first (Task 4), LAN relay second (Task 5), local and serverless (no hosted component anywhere), phone-friendly pairing (Task 4 codes, Task 6 UI). Review Focus items map to Tasks 1, 2, 3 and 4.
- **Type consistency:** `DuelSession` methods and events are defined in Task 2 and used by the same names in Tasks 3, 6 and 7. `startDuel` is defined in Task 3 and used in Task 6. `loopbackPair`, `RtcTransport.host/join` and `WsTransport.connect` keep their signatures across tasks.
- **Synced card screen and debug timings:** the shared card screen with its `mpSpell` length (default 10 s) is in Tasks 2 and 3, and the Debug › Multiplayer section with the five timing sliders is in Task 6. The 8-second auto-close from the first draft of this plan no longer exists.
- **Latency and fairness:** fast channel for movement (Task 4), timestamps and the clock offset (Task 2), exact step replay and the 2-frame smoothing buffer (Task 3), and the defender-wins rule with its 50 ms window and 250 ms back-date clamp (Tasks 2 and 3). The latency budget is measured in Task 4 and the avatar lag in Task 3.
- **Known gap, deliberate:** the receiver does not see statuses or ground effects from the opponent's cards (see Design decisions). Cards whose whole point is a status (freeze, stun) will feel weaker in a duel until a later plan mirrors them.
- **Risk to check first in Task 3:** the hex rows are offset half a tile per row, so mirrored columns do not mirror x exactly (a half-tile visual offset on odd rows). Rows and lanes still line up, which is what hits depend on, but the avatar will look slightly off-centre on odd rows. If that looks wrong in play, fix it in the avatar's draw position only, not in the tile mapping.
