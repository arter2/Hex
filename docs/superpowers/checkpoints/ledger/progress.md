# SDD ledger — plan: docs/superpowers/plans/2026-10-31-local-pvp-duel.md
Spec: none separate; the plan's "Design decisions" section is the binding authority (rulings provisional).
Branch: ccr-7972c906-bqlgjj (push only at the end / on request; Stop hook asks for commit+push).
Models: implementers sonnet (prose tasks), Task 3 opus; reviewers sonnet (opus for Task 3); final review fable.

## Pre-flight scan
| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1–T2 | codec shapes, channelOf, loopbackPair vs DuelSession | ok (spell, spelldone, sync.gauge present in T1 shapes) |
| T1 self | Step 3 says `pos.c` int 0-13, `pos.r` 0-8, but pos shape is `{fx,fz,vx,vz,ts}` (no c/r) | CONFLICT -> Ruling 1 |
| T2–T3 | `hitLands(history,tile,localTs,defendMs)` vs T3 text `hitLands(history,tile,localTs)` | CONFLICT -> Ruling 2 |
| T2–T3 | `sendSync(hp,maxHp,barrier,gauge)` vs T3 text sends hp,maxHp,barrier only | CONFLICT -> Ruling 3 |
| T3–T6 | T3 reads `XLIT.mpSpell/mpDefend/mpBackdate/mpSend/mpSmooth`; keys are added to XLIT_DEF only in T6 | CONFLICT -> Ruling 4 |
| T3 files | Spell/Fight! buttons live in ui.js, look.js holds XLIT_DEF; T3 file list names only battle.js, enemies.js, duel-runner.js | CONFLICT -> Ruling 5 |
| T3–T4 | bridge transport (T3 tests) and RtcTransport share Transport contract; both edit duel-runner.js | ok |
| T3–T7 | fireWand/shot message on fast channel, cosmetic fx | ok |
| T4–T5 | both edit nettransport.js (RtcTransport then WsTransport), send(text,channel) | ok |
| T3–T6 | T6 tests use bridge from T3, startDuel hooks, session settings | ok |
| T6–T8 | docs/CI/version after all | ok |
| Each task self-consistency | T1 (see above), T2 ok, T3 (see rulings), T4 ok, T5 ok, T6 ok (dbg rows), T7 ok, T8 ok | |

## Rulings
Ruling: pos message has required finite fx,fz,vx,vz and ts only; integer c 0-13 / r 0-8 bounds apply to hit.tile and step.from/to — T1 step 3 text was stale from the first draft — costs a one-line fix if wrong
Ruling: hitLands called with 4th arg XLIT.mpDefend (via session settings) — signature in T2 is binding — none
Ruling: T3 sends sync with B.gauge as 4th field and stores received gauge in B.pvp.oppGauge — T2 signature binding — none
Ruling: T3 adds the five XLIT_DEF keys (mpSpell:10, mpDefend:50, mpBackdate:250, mpSend:16, mpSmooth:33) to look.js; T6 adds only the debug rows/sliders and binding-table entries — avoids T3 reading undefined keys — T6 slightly smaller
Ruling: T3 may also modify game/ui.js (Spell button, Fight! button, card-screen countdown/waiting text) and game/look.js — required by T3's own synced-card-screen interface — none
Task 1: complete (commits 6bba0f8..7f081ac, review clean)
Task 1: minor (deferred): loopback ignores channel arg (cannot simulate fast-channel loss)
Task 1: minor (deferred): hp/maxHp/barrier/seed only checked finite (receiver should clamp in T3); decode returns extra fields; _n*/SHAPES become globals
Task 1: minor (deferred): pos hostile test passes for missing fields only (weak but harmless)
Ruling: DuelSession gains ready() and a 'fight' event (each side sends ready; both -> state 'fighting'); T3 must call session.ready() once the battle is built — the plan never said how starting becomes fighting — costs a small T3 addition if wrong
Task 2: complete (commits 7f081ac..94dc40a, review clean)
Task 2: minor (deferred): draw grace asymmetric (A can resolve lose while B resolves draw near edge); spell sec clamp unreachable on wire (SHAPES reject); stale spell msg can reopen screen; refused peer sees 'peer left'; leave() fires no local 'end' and silence not enforced while connecting (T6 must add connect timeout + treat leave() as local exit); clock test lacks aging-out case
Ruling: hit.tile is sent in the attacker's own columns (DuelSession already mirrors c'=13-c on receive; plan T3 text said to mirror on send, which would double-mirror) — implementer's reading accepted — none
Ruling: colourless hits are sent with color 'gray' ('white' is not a COLORS key so the codec rejects it); avatar barrier is not copied from sync (would make defender's barrier unbreakable on attacker side); avatar smoothing is a true 2-frame buffer (mpSmooth ms behind, velocity extrapolation capped 100ms) because the plan's easing failed its own 0.3-unit tracking check — costs nothing if wrong
Task 3 hand-offs to Task 6: leaver's battle keeps running after leave(); an 'end' landing while card screen is up leaves #custom shown; document.hidden / pause menu stop session.tick so opponent wins by timeout (Review Focus 4); burn/status on avatar not applied (known v1 limit); p.step never set by current free movement so 'step' msgs implemented but unexercised; startDuel sets private session._settings (no setter)
Task 3: review 1: spec compliant; 1 Important (avatar timers never decay; groundTick can give permanent curseT x1.3), minors below
Task 3: minor (deferred): update() keeps running after duelTick fires 'end' (add `if(B!==b)return` — T6's onEnd must not null B synchronously until fixed); attacker-side heals (drain/mend/lifesteal) skipped by intercept; avatar can end on wrong tile after land claims/occupied tile (re-place from latest net sample each tick); 'end' draw sets phase 'lose'; late spell/spelldone could reopen/close next screen; startDuel writes private session._settings; stuck-opponent test passes via 5s silence forfeit not the mpSpell+2 resume path; timing thresholds flaky under load, View.gl=false in tests; starter-deck check weak (sent>=5 && h1<h0); ui-runner not run to completion
Task 3: fix round 1/5 dispatched (avatar timers)
Task 3: fix round 1/5 (1 addressed, 0 open — avatar timers/groundTick; commits 4b74100..41aead1)
Task 3: complete (commits 94dc40a..41aead1, review clean)
Ruling: Task 4 also adds the script tag for nettransport.js to game/index.html right after netduel.js (brief's file list omits it; Task 6 needs it loaded) — none
Ruling: pairing code writes base64url's '-' as '.' (group separator stays '-') because the two were ambiguous on round trip; ICE gathering wait ends on 'complete', 1.2s after the last candidate, or a 5s cap because headless Chromium never reports 'complete' — accepted — none
Task 4: review 1: 2 Important (no checksum -> 29% single-char typos decode silently, brief requires one-char change throws; no CompressionStream feature check -> old Safari reported as damaged code)
Task 4: minor (deferred): unused options.args in runner-common.js launch(); host()/join() leak pc on throw in _gathered/packSignal; no-candidates case silently produces code; trailing '.' fragile in chat; duel-runner RTC checks cascade from the first and evaluate has no timeout
Task 4: fix round 1/5 dispatched (checksum + feature check)
Task 4: fix round 1/5 (2 addressed, 0 open — checksum + feature check; commits 9698806..c1d1d11)
Task 4: complete (commits 41aead1..c1d1d11, review clean)
Task 5: review 1: 2 Important (rejected 4000/4001 sockets have no error listener -> oversized frame can crash relay; traversal test may pass vacuously)
Task 5: minor (deferred): bad/full room looks like successful connect (connect resolves then closes 4000/4001; onclose not replayed if assigned late); browser test fixed 200ms wait race + unhandled rejection; no Origin check (LAN tool); no tests for oversized/binary frames/CLI line; symlinks followed, dir without trailing slash 404, package.json lacks engines (needs Node 22)
Task 5: fix round 1/5 dispatched (error listener + traversal test)
Task 5: fix round 1/5 (2 addressed, 0 open — relay error listener + traversal test; commits 6f5a758..15c7f82)
Task 5: complete (commits c1d1d11..15c7f82, review clean)
Ruling: Task 6 absorbs the Task 3/2 hand-offs: (a) leaving a duel stops the local battle and returns to the menu; (b) when the duel ends, close the card screen (#custom) if open; (c) while a duel is running keep driving session.tick() from a 500ms interval (cleared on end) so a hidden tab/pause menu/locked phone does not forfeit by silence — browsers throttle background timers to ~1/s which still meets the 1s heartbeat; (d) add `if(B!==b)return;` after duelTick in update() so an onEnd that nulls B cannot throw; (e) connect/lobby timeout (20s) with readable message — these were not in the plan text but are required to meet Review Focus 1/4
Ruling: no host Start button — DuelSession (T2) makes the host send `start` automatically when the lobby opens, so a button would contradict T2; lobby shows opponent name and the duel starts ~1.2s later — plan's Start button dropped — if you want manual start, netduel.js needs a change
Ruling: human waits (guest showing answer code, Room host waiting for friend) get 60s, not the 20s timeout (20s covers code generation/connect/lobby); added a 'Your name' field (default Hexmancers) because saves have no player name; Room mode sends probes because relay forwards only to connected peers — accepted
Task 6: review 1: 1 Important (card-screen Run button live in a duel: costs gold/card, persists, B=null/openCamp without duelLeave, strands opponent + leaves session set)
Task 6: minor (deferred): #duAccept not disabled while accept runs (double tap); refused handshake leaves a dead 'wait' step; refused player sees 'other player left' (protocol limit); Room mode waits blind 60s if relay drops; no pagehide handler (peer shows Connection lost); tests don't cover Draw/Connection lost, save-unchanged only on Opponent-left path, muddled reset assertion; fixed timings (6.5s sleep) may flake; no focus move on step change, Copy buttons maybe <44px, duRun can start behind Settings overlay; sliders not held to steps (existing behaviour)
Task 6: fix round 1/5 dispatched (Run in duels)
Task 6: fix round 1/5 (1 addressed, 0 open — Run in duels; commits cb81520..37c9d8a)
Task 6: complete (commits 15c7f82..37c9d8a, review clean)

## Task 7 — complete
Commit f69f8d6 feat: cosmetic incoming shots in duels. Reviewed inline by the controller (58-line diff): clean.
Deferred minor: the cosmetic shot always flies at .045 s per column because the shot message carries no shotSpeed.
