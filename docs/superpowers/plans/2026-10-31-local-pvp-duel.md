# Local PvP Duel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two players on the same local network duel each other, mage against mage, in the existing real-time hex battle, with no internet server.

**Architecture:** Each device runs its own normal battle (`B`) in which the "enemy" is a single remote avatar that mirrors the opponent's mage. Hits are attacker-authoritative: when my card or wand hits the avatar, my client sends `{dmg, color}` and the opponent's client applies it with the existing `hitPlayer`. This avoids lockstep, which is not possible here because `battle.js` calls `Math.random()` throughout and the sim is floating-point real time. Transport sits behind a small interface with two adapters: WebRTC data channel (primary, browser-only, manual code pairing) and a LAN WebSocket relay script (fallback).

**Tech Stack:** Plain `<script>` globals (no build step), WebRTC `RTCDataChannel`, Node 22 + `ws` for the relay, Node `assert` tests under `tools/playtest/`, Playwright (already used) for two-page browser tests.

**Spec:** None written. The design is the conversation: PvP duel, WebRTC first with a LAN relay second. The "Design decisions" section below is the spec for this plan.

## Design decisions (assumptions the implementer must not re-open)

- **Mode:** one mage per side. Board is the normal 9 x 14 board. Each player stands on their own half, sees themselves near the camera, and sees the opponent on the enemy half.
- **Lane mapping:** my tile `(col, r)` is shown to the opponent on `tileCR(BOARD_COLS-1-col, r)`. The row is kept, so a shot down my row meets an opponent standing in that same row.
- **Loadout:** each player uses their own saved deck (it must pass `validateDeck`) but no gear, base 120 HP. So the gap between players is the deck only.
- **Rewards:** a duel gives and costs nothing and never touches saves. It uses its own `hooks.onEnd`, not `victory()` or `defeat()`.
- **Damage:** the sender's hit path computes damage (element, counter hit, crit, hero and so on). The receiver applies its own mitigation through `hitPlayer` (dodge, barrier, guard). No 45% one-shot cap applies, because the source kind is `'pvp'`, not `'enemy'`.
- **Not mirrored in v1:** status effects (freeze, stun and so on), ground effects and summoned creatures on the receiver's side. Damage-over-time hits are mirrored, because each tick is a `hitEnemy` call that gets sent.
- **Spell screen:** it pauses only the local player. Inbound hits are queued while `B.phase==='custom'` and applied when the fight resumes. In a duel the Spell screen auto-closes after 8 s.
- **Result:** a client that reaches 0 HP sends `end`. First `end` received wins. Both sides receiving each other's `end` is a draw.
- **Out of scope:** QR codes, internet play, matchmaking, spectators, more than two players, rematch history.

## Global Constraints

- No build step and no new browser libraries: new game code is plain script files loaded from `game/index.html`, in the same style as the existing files.
- New logic files must be loadable in Node the way `engine.js` is: end with `if(typeof module!=='undefined') module.exports={...}`.
- Must work in Safari on iPhone and iPad and in Chromium. The relay needs a page served over `http` by the relay itself.
- Protocol version constant `NET_V = 1`. A mismatch is refused at handshake.
- Bump the build number in `game/index.html` (`<title>Hexmancers v179</title>` and `<meta name="application-version" content="179">`) to 180 in the last task only.
- New tests run in the existing "Bot self-checks" step of `.github/workflows/quick-test.yml`, and the browser tests run in the existing job after the battle taps.

## Review Focus

Failure modes the design implies that no one asked for. Each has a test in the task named.

1. **Opponent disconnects or goes silent mid-duel** (Wi-Fi drop, tab closed, phone locked): the other player must see "Opponent left", win by forfeit and get back to the menu. No frozen fight. (Task 2, Task 3)
2. **Malformed or hostile messages** (NaN or Infinity damage, damage of 1e9, wrong types, unknown `t`, oversized frames, JSON that throws): dropped without an exception and without changing HP. (Task 1)
3. **Both mages reach 0 HP in the same moment:** both clients must show a draw, not "you won" on one side and "you lost" on the other. (Task 2)
4. **Hits arrive while the receiver is on the Spell screen:** they are applied after resume, none lost, none applied during the pause. (Task 3)
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
  - Message shapes, all with `t`: `hello{t,v,name,deck}`, `ready{t}`, `start{t,seed}`, `pos{t,c,r,fx,fz}`, `sync{t,hp,maxHp,barrier}`, `hit{t,dmg,color}`, `shot{t,r,color,big}`, `end{t,loser}`, `ping{t,n}`, `bye{t}`
  - Transport contract (duck-typed): `{send(text), onmessage: (text)=>void, onclose: ()=>void, close()}`
  - `loopbackPair() -> [TransportA, TransportB]`. Messages sent on one arrive asynchronously on the other, and `close()` on one fires `onclose` on both.

- [ ] **Step 1: Write the failing tests** in `tools/playtest/netplay-test.js` (plain Node, `node:assert/strict`, loading `../../game/netplay.js`):
  - `round trip`: `decode(encode(m))` deep-equals `m` for one valid message of every `t`.
  - `rejects hostile input`: `decode` returns `null` for `'not json'`, `'null'`, `'[]'`, `'{"t":"nope"}'`, `'{"t":"hit","dmg":NaN}'` (written as the string `{"t":"hit","dmg":null}`), `{"t":"hit","dmg":1e9,"color":"red"}`, `{"t":"hit","dmg":-5,"color":"red"}`, `{"t":"pos","c":"x","r":1}`, and any string longer than 4096 characters.
  - `hit damage bounds`: `dmg` 1 to 500 accepted, 0 and 501 rejected, non-integers rejected.
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
  - `constructor(transport, {name: string, deck: string[], host: boolean, now: ()=>number, seed?: ()=>number})`
  - `state`: one of `'connecting'|'lobby'|'starting'|'fighting'|'over'`
  - Handshake: both sides send `hello`. The host, once it has the guest's `hello`, sends `start{seed}` and both go to `'starting'`.
  - Events through `session.on(name, fn)`: `'lobby'` (opponent `{name}`), `'start'` (`{seed}`), `'hit'` (`{dmg,color}`), `'pos'`, `'sync'`, `'shot'`, `'end'` (`{result: 'win'|'lose'|'draw', reason: 'hp'|'left'|'timeout'}`), `'refused'` (`{reason: string}`)
  - Methods: `sendPos(c,r,fx,fz)` (drops calls closer than 60 ms to the last), `sendSync(hp,maxHp,barrier)` (200 ms), `sendHit(dmg,color)` (never throttled), `sendShot(r,color,big)`, `iDied()` (sends `end{loser:'me'}`), `tick()` (call every frame; sends `ping` every 1 s, and ends with `reason:'timeout'` if nothing arrived for 5 s), `leave()` (sends `bye`, closes).
  - `{t:'bye'}` or transport `onclose` while `state==='fighting'` or `'starting'` ends the duel as `win` with `reason:'left'`.

- [ ] **Step 1: Write the failing tests** (a fake clock `now`, two sessions over `loopbackPair()`, drive with `await tick()`):
  - `handshake`: host and guest both reach `'starting'`, both fire `'start'` with the same `seed`, and each saw the other's `name`.
  - `version mismatch`: a guest that sends `hello{v:0}` makes the host fire `'refused'` with a reason that contains `'version'`, and state stays out of `'starting'`.
  - `invalid deck refused`: a `hello` whose `deck` has fewer than 45 entries or more than 60 gets `'refused'` with reason containing `'deck'`.
  - `hit relay`: `A.sendHit(12,'red')` fires `'hit'` on B with `{dmg:12,color:'red'}`, and 50 hits in the same tick all arrive.
  - `throttle`: ten `sendPos` calls within 50 ms of fake time deliver one `pos`; calls 60 ms apart all deliver.
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
  - `hitEnemy(e,...)`: when `e.remote`, after `dmg` is computed (after the barrier branch), send `session.sendHit(dmg, card&&card.color||'white')`, show the floater, and return `dmg` without touching `e.hp`.
  - `updateEnemy(e,dt)`: returns immediately when `e.remote` (no AI, no attacks).

- [ ] **Step 1: Write the failing test** in `tools/playtest/duel-runner.js` (Playwright, Chromium, two pages in one context, same launch pattern as `tools/playtest/battle-ui-runner.js`). Each page gets a bridge transport (`window.__bridgeSend` exposed with `page.exposeFunction`, delivering to the other page through `page.evaluate`) and calls `startDuel` with a valid starter deck. Assertions, each its own named check:
  - `avatar mirrors position`: page A moves its mage to `(col 2, row 4)`; within 300 ms page B's avatar is on the tile with `col===11 && r===4`.
  - `wand hit damages opponent`: A stands in row 4, B's mage in row 4; A fires the wand; B's `B.player.hp` drops by A's computed wand damage (±0 once B has no barrier or dodge) within 500 ms, and A's avatar `hp` follows B's `sync` within 500 ms.
  - `wand misses other row`: B in row 2, A fires in row 4: B's HP is unchanged after 1 s.
  - `death ends both`: set B's `hp` to 1 and hit it; both pages' `onEnd` fire once, A with `win` and B with `lose`, and neither page's save data (`localStorage`) changed (compare before and after).
  - `queued hits during Spell screen`: B opens the Spell screen (`B.phase==='custom'`), A lands a hit; B's HP is unchanged while paused and drops after B closes it.
  - `Spell screen auto-closes after 8 s`: with fake timing, B left on the Spell screen returns to `phase==='fight'` and the queued hit is applied.
  - `opponent leaves`: page B calls `session.leave()`; page A's `onEnd` fires `win` with reason `left` and no timers keep running (`B.phase` is `'win'`).

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: FAIL (`startDuel is not defined`).

- [ ] **Step 3: Implement `startDuel` and the avatar in `game/battle.js`** per the Interfaces block. Notes that the signatures do not settle:
  - The avatar needs a def that `makeEnemy` can build (name `'Rival'`, art reused from the player's own `look` where `sprites.js` allows, otherwise a stock sprite). Do not let `makeEncounter` run: pass `opts.waves` with the avatar's wave.
  - Inbound `hit` events push to `B.pvp.inbox`. In `update`, when `phase==='fight'`, drain the inbox through `hitPlayer(dmg,{kind:'pvp',color})`. While `phase==='custom'` leave it queued.
  - `update` sends `pos` from the player's `rx/rz` and tile each frame (the session throttles), sends `sync` of `p.hp,p.maxHp,p.barrier`, and calls `session.tick()`.
  - When `hitPlayer` sets `B.phase='lose'`, call `session.iDied()`. The `'end'` event drives `hooks.onEnd`. For a `win`, set `B.phase='win'`.
  - `B.pvp.spellLeft` counts down in real time while `phase==='custom'`, and at 0 calls the existing `closeCustomScreen()`.
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
  - `class RtcTransport` with `static async host() -> {transport, offerCode: string, accept(answerCode: string): Promise<void>}` and `static async join(offerCode) -> {transport, answerCode: string}`. Both use `new RTCPeerConnection({iceServers: []})` so only LAN host candidates are used. They wait for ICE gathering to finish before producing the code, and use one ordered reliable data channel `'hex'`. Implements the Transport contract. `onclose` fires on channel `close` and on connection state `failed` or `disconnected` longer than 3 s.

- [ ] **Step 1: Write the failing tests**
  - Node: `code round trip` (a fixture SDP of about 1.5 KB survives `unpackSignal(await packSignal(d))`), `forgiving input` (the same code with spaces, a newline in the middle, and lowercase prefix variants either parses or throws `Bad code`, never anything else), `garbage` (`''`, `'hello'`, `'HEX1.@@@'`, a valid code with one character changed each throw `Bad code ...`).
  - Browser (Playwright, two pages, no bridge): page A `RtcTransport.host()`, page B `join(offerCode)`, A `accept(answerCode)`; both open within 10 s and a `hello` from A arrives on B.

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
  - `class WsTransport` with `static connect(room: string) -> Promise<WsTransport>`. It uses `ws://${location.host}/relay?room=`, and fulfils the Transport contract.

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

### Task 6: Duel menu and pairing screen

**Files:**
- Modify: `game/index.html` (new `<section id="scrDuel" class="screen">`, script tags for `netplay.js`, `netduel.js`, `nettransport.js` after `battle.js` at line 594, a Duel button next to `#mmLab` at line 33)
- Modify: `game/ui.js` (handler beside `#mmBattle` at line 1481, `fight`-style wrapper at line 657)
- Modify: `game/style.css`
- Modify: `tools/playtest/duel-runner.js` (add UI flow checks)

**Interfaces:**
- Consumes: `RtcTransport`, `WsTransport` (Tasks 4, 5), `DuelSession` (Task 2), `startDuel` (Task 3), `validateDeck`.
- Produces: the Duel flow:
  - Main menu: a text button `#mmDuel` ("Duel a friend"), disabled with a hint when the saved deck fails `validateDeck`.
  - `#scrDuel` steps: choose **Host** or **Join**, then **Wi-Fi code** (WebRTC) or **Room** (relay, offered only when the page was served over `http:` and not from itch.io), then the code exchange (host shows a code with a Copy button, guest pastes it and gets an answer code, host pastes it back), then a lobby that shows the opponent's name and **Start** for the host, then the duel, then a result card (`You won`, `You lost`, `Draw`, `Opponent left`, `Connection lost`) with **Back to menu**.
  - Refusals (`'refused'`) and `Bad code` errors show inline text on the same step and leave the player on it.

- [ ] **Step 1: Write the failing checks** in `duel-runner.js`, using the bridge transport from Task 3 and driving real taps (`page.tap` on the real buttons, as `ui-runner.js` does):
  - `duel button disabled without a valid deck`.
  - `host and guest reach lobby`: host chooses Host, Wi-Fi code; guest chooses Join, pastes the code; both see each other's name.
  - `bad code shows an error`: pasting `HEX1.nonsense` shows text containing `Bad code` and the screen stays on the same step.
  - `result card and back`: when the duel ends, the result card shows, **Back to menu** returns to `#scrMenu`, and `localStorage` save data is unchanged.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duel-runner.js out/duel`
Expected: FAIL (`#mmDuel not found`).

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
- Produces: `fireWand` sends `shot{r,color,big}` when `B.pvp` is set. On receipt, spawn a cosmetic projectile in `B.fx` that travels along my row `r` from the enemy half toward me at the wand's shot speed and does no damage.

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

- [ ] **Step 2: Write `docs/multiplayer.md`**: how to start a duel over Wi-Fi code and over the relay (`node tools/netplay/relay.js`), the design decisions list above, the known limits (statuses not mirrored, same-LAN only, mDNS obfuscation can block WebRTC on some phones, so use the relay), and how to run the tests.

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
- **Known gap, deliberate:** the receiver does not see statuses or ground effects from the opponent's cards (see Design decisions). Cards whose whole point is a status (freeze, stun) will feel weaker in a duel until a later plan mirrors them.
- **Risk to check first in Task 3:** the hex rows are offset half a tile per row, so mirrored columns do not mirror x exactly (a half-tile visual offset on odd rows). Rows and lanes still line up, which is what hits depend on, but the avatar will look slightly off-centre on odd rows. If that looks wrong in play, fix it in the avatar's draw position only, not in the tile mapping.
