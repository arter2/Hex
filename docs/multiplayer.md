# Multiplayer: the local duel

Two players on the same local network fight each other, mage against mage, in the normal real-time hex battle. No
internet server is involved. This page describes build v181. It covers how to start a duel, how it plays, the timing
settings in the debug menu and how to run the tests.

Code: `game/netplay.js` (message format and checks), `game/netduel.js` (the duel session), `game/nettransport.js`
(WebRTC pairing codes and the relay connection), `game/battle.js` (`startDuel` and the `duel...` functions),
`game/ui.js` (the pairing screen and the result card, under "local duel"), `game/look.js` (the timing sliders) and
`tools/netplay/relay.js` (the LAN relay).

---

## 1. Starting a duel

Multiplayer is in the debug menu, not on the main menu: open **Debug › General › Multiplayer** and press
**Start a duel**.

The button is greyed out, with the reason under it, when:

- no game is started or loaded,
- you have no deck, or your saved deck does not pass the normal deck check (fix it at camp),
- you are in a fight or a dungeon run,
- a duel is already set up.

On the Duel screen, type a name (it is remembered on this device) and pick **Host** or **Join**. One player hosts and
the other joins. Then pick how to connect: **Wi-Fi code** or **Room**.

### 1a. Wi-Fi code (WebRTC, no setup)

The two devices connect directly over a WebRTC data channel. There is no signalling server, so the two players copy
two codes between the devices by hand (any chat app will do):

1. The **host** taps Wi-Fi code. A code that starts with `HEX1.` appears. They send it to the other player
   (the **Copy** button copies it).
2. The **joiner** taps Join, then Wi-Fi code, pastes the host's code and taps **Make my code**. A second `HEX1.`
   code appears. They send it back to the host.
3. The host pastes that code and taps **Connect**.

Both screens then show the lobby ("Opponent: name") and the fight starts a moment later.

Codes are checked: a code that is mistyped, cut short, or of the wrong kind (an answer pasted where an offer goes,
or the other way round) gives a readable "Bad code (...)" message and you can try again. Spaces, line breaks and
the case of the `HEX1.` prefix do not matter. Every single-character typo is caught by a checksum.

If nothing connects in time, the screen says "Could not connect. Check you are on the same Wi-Fi and try again."
The host waits up to 20 seconds for the connection after pressing Connect. The joiner waits up to 60 seconds,
because the host has to carry the code across first.

### 1b. Room (the LAN relay)

When WebRTC cannot connect (see Known limits), run the relay on a computer on the same network:

```
cd tools/netplay && npm install && node relay.js
```

It prints `Open http://<LAN address>:8080 on both devices`. Options: `--port <n>` (default 8080) and `--dir <folder>`
(default the repository's `game/` folder).

The relay does two things:

- It serves the game over plain `http`, so both devices open the game from that address.
- It pairs two WebSockets that ask for the same four-letter room at `/relay?room=ABCD` and passes text messages
  between them. A third connection to a full room is refused, and a bad room name is refused. A message longer than
  8 KB closes the connection. When one side leaves, the other is disconnected.

On both devices, open the address the relay printed, start a game, then go to Debug › Multiplayer › Start a duel:

1. The **host** taps Room. A random four-letter room name is shown. They tell the other player the name and tap
   **Connect**.
2. The **joiner** taps Join, then Room, types the four letters and taps **Connect**.

The **Room** button only appears when the page is served over `http` and is not on itch.io. itch.io pages are `https`
and cannot reach a relay on your network.

### 1c. What happens at the handshake

Each side sends `hello` with the protocol version (`NET_V = 1`), its name and its deck. A duel is refused, with the
reason shown on the Duel screen, when:

- the versions differ ("Duel refused: version mismatch."), for example when one device has a cached older build
  with a different protocol,
- the other deck has fewer than 45 or more than 60 cards ("Duel refused: invalid deck size (a duel deck has 45 to 60
  cards).").

---

## 2. How a duel plays

- **One mage each.** Each player uses their own saved deck, no gear, 120 HP. The board is the normal battle board.
  You stand on your half near the camera; the other player's mage is a remote avatar on the enemy half.
- **Rows line up.** Your tile `(col, row)` is shown to the opponent at `(last col - col, row)`, so a shot down your
  row meets an opponent standing in that same row.
- **The attacker works out damage.** When your card or wand hits the avatar, your game works out the damage (colour,
  counter hit, crit and so on), shows the number, and sends `hit {dmg, color, tile}` to the other device. The other
  device applies it with its own defences (dodge, barrier, guard). The "no one-shot" cap that limits a monster's hit
  to 45% of your HP does not apply to a duel hit.
- **Burn and poison are mirrored.** A card that burns or poisons leaves that on the avatar in the attacker's game,
  which ticks it at the usual rates (burn 5 a second, poison its amount for each tile the avatar steps onto) and
  sends each tick as a hit with no tile, so it always lands. **Other statuses (curse, slow, stun, freeze), ground
  effects and summoned creatures are not mirrored** to the other device in this version, and a land Claim leaves
  the avatar where it is (its tile is not taken).
- **Their shots are drawn on your side** as they come down your row, but only as a picture. Damage arrives only
  as a `hit` message.
- **The opponent's HP bar** comes from their `sync` messages (HP, max HP, barrier, Spell gauge; at most five a
  second).
- **No Run, no saves.** A duel cannot be run from. The pause menu shows **Leave the duel** instead, and saving and
  loading are off. In a duel the debug "Pause the game" switch is off and greyed out, because it would stall the
  other player.
- **A duel gives and costs nothing** and never changes your save.

### How a duel ends

- A player whose HP reaches 0 sends `end`. The other player wins.
- If both reach 0 within 300 ms of each other, both devices show **Draw**. Each device compares the same two
  moments: its own death and the other's, taken from the timestamp on the other's `end` message (turned into local
  time by the clock sync), so both come to the same result. The first to die waits 300 ms plus one round trip
  (and 50 ms to spare) before showing a loss, so a death inside the window still has time to arrive.
- **Opponent left:** the other player left (Back, or Leave the duel from the pause menu). You win by forfeit.
- **Connection lost:** nothing has come from the other device for 5 seconds, or the connection closed without a
  goodbye. You win by forfeit.

The result card says the duel gave nothing and cost nothing, and **Back to menu** returns to the main menu. The
session keeps its heartbeat going from a timer twice a second, so a hidden tab or a locked phone does not by itself
stop the messages, as long as the browser keeps running timers.

---

## 3. The shared Spell (card) screen

The Spell screen is shared: it opens, pauses the fight and closes on both devices together.

- **Opening.** The Spell button lights when your own gauge is full or the opponent's reported gauge is full. When
  either player taps it, the screen opens on both devices and the fight pauses on both. Opening uses up both gauges
  (both go back to 0). If both players tap Spell at the same moment, the two opens merge into one screen. The card
  screen at the start of the fight is shared in the same way.
- **Length.** The screen lasts `mpSpell` seconds (default **10**). The opener's `mpSpell` is sent in the `spell`
  message, so the opener's setting decides the length of that screen on both devices. Each device counts from when
  the screen opened on it. The Fight! button shows the seconds left.
- **Closing.** Press **Fight!** when you are done. The button then reads "Waiting for opponent…". The screen closes
  on both devices, and the fight resumes, when **both players have pressed Fight! or the `mpSpell` countdown has
  run out** (when your countdown ends, it presses Fight! for you). If the other player's Fight! never arrives,
  your device waits at most `mpSpell + 2` seconds, then resumes on its own.
- **Hits in flight.** A hit that arrives while the screen is open is checked as it arrives (see the next section),
  kept, and applied when the fight resumes. None are lost and none land during the pause.

---

## 4. Defender wins close calls

Network messages take time, so the attacker sometimes sees a hit on a tile that the defender had already left.
The defender's view wins:

- A `hit` carries the tile the avatar stood on when it was hit (in the attacker's own columns) and a timestamp.
- The receiver turns the tile into its own columns and the timestamp into its own clock, using a clock offset it
  estimates from ping and pong messages (the sample with the lowest round trip out of the last 8).
- The hit lands only if the receiver's mage stood on that tile for the **whole** window from `mpDefend` ms
  (default 50) before that moment up to that moment. Otherwise the receiver shows **dodge** and drops the hit.
- A timestamp is never moved more than `mpBackdate` ms (default 250) into the past, and never into the future, so a
  laggy or dishonest sender cannot reach back in time and claim a hit on where you stood a while ago.
- A hit with no tile (damage over time) always lands.

The cost of this rule: the attacker's damage number is shown at once, so after a dropped hit it shows damage that did
not happen. The opponent's HP bar, which comes from their `sync` messages, stays correct.

---

## 5. Debug › Multiplayer timing sliders

Every timing can be changed live during a duel. The values are saved in this browser like the other debug settings
(the `hexmancers-xl-mp...` keys in `localStorage`). **Reset multiplayer timings** puts all five back to normal. Each
device uses its own values, except the card screen length, which comes from whoever opened the screen.

| Key | Slider | Default | Slider range | What it does |
| --- | --- | --- | --- | --- |
| `mpSpell` | Card screen length | 10 s | 3 to 30 | How long the shared card screen lasts. The opener's value is used on both devices. A missing Fight! is waited for up to this plus 2 seconds. |
| `mpDefend` | Defender window | 50 ms | 0 to 200 | How long before a hit you must have stood on its tile for the hit to land. Larger means more close calls go to the defender. 0 means only the tile at the moment of the hit counts. |
| `mpBackdate` | Back-date limit | 250 ms | 50 to 1000 | The most that a late message is counted as having happened earlier. Applies to hits, positions, steps, syncs and shots. |
| `mpSend` | Position send gap | 16 ms | 0 to 100 | The shortest wait between two joystick position messages you send (they are only sent when something changed). 0 sends every frame. |
| `mpSmooth` | Avatar smoothing | 33 ms | 0 to 100 | The opponent's avatar is drawn this far behind their latest position, between the two positions around that moment, so it glides instead of jumping. 0 draws the latest position. |

Suggested values to try: `mpDefend` 30 to 100 ms; `mpBackdate` 150 to 400 ms; `mpSend` 0 to 33 ms (higher sends fewer
messages, at the cost of a less exact avatar); `mpSmooth` 16 to 50 ms (lower is closer to real time, higher looks
smoother on a jittery network).

Tile walks are not affected by `mpSend` or `mpSmooth`: each step is sent once (`step {from, to, dur}`) and replayed
exactly by the avatar.

---

## 6. Known limits

- **Same local network only.** WebRTC is set up with no STUN or TURN servers, so it only connects devices that can
  reach each other directly. The relay is also local.
- **WebRTC can fail on some phones.** Browsers that hide local addresses behind mDNS names can stop the two devices
  from finding each other. Use a Room through the relay instead.
- **Statuses other than burn and poison, ground effects and summoned creatures are not mirrored.** Cards whose
  whole point is a status (freeze, stun) feel weaker in a duel.
- **Two players only.** No internet play, matchmaking, spectators or rematches.

Full rollback netcode is deliberately left for later: see
[docs/superpowers/plans/2026-10-31-rollback-netcode-later.md](superpowers/plans/2026-10-31-rollback-netcode-later.md).

---

## 7. Tests

| Command | What it checks | Needs |
| --- | --- | --- |
| `node tools/playtest/netplay-test.js` | message checks (bad, hostile and oversized messages), the duel session state machine, the defender rule, pairing codes | Node only |
| `cd tools/netplay && npm ci && node relay-test.js` | the relay: pairing by room, full and bad rooms, path traversal, crashes from bad sockets, and the browser `WsTransport` (skipped when Playwright is not found; set `PLAYWRIGHT_MODULE` to point at it) | `ws` from `npm ci` |
| `node tools/playtest/duel-runner.js test-results/duel` | two browser pages duel each other through a bridge that can delay, hold or drop messages (latency, in-flight hits, a stuck opponent), WebRTC by code (with the latency budget), a relay room, the debug menu, the pairing screen and the result card | Playwright (`npm --prefix tools/playtest install`) and `tools/netplay` installed |

All three run in the Quick test workflow (`.github/workflows/quick-test.yml`).
