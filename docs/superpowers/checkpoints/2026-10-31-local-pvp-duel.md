# Checkpoint: local PvP duel (branch ccr-7972c906-bqlgjj)

Saved so a new session can pick up after a usage-limit cutoff. Updated at each step.

## Status
- Tasks 1-8 of docs/superpowers/plans/2026-10-31-local-pvp-duel.md are done and reviewed (commits 7f081ac..27219ad).
- The final whole-branch review (Opus, because Fable needs usage credits) returned **fix first** with three findings:
  1. Draw grace is asymmetric (netduel.js). One device can show Draw while the other shows "You lost".
  2. `clearForClaim` (battle.js) sets curseT on the remote avatar and moves it. That gives a permanent ×1.3 on later hits.
  3. Burn and poison are never mirrored to the opponent. The docs say they are.
  4. Minor: CI step "LAN relay checks" needs `if: always()`.
- All four are fixed (code in 6a0eb20, marker commit a414eca). The controller re-checked the diff and re-ran the suites: netplay 40/40, relay ok, selftest 23/23, battle-clock ok, duel-runner 38/39 or 39/39.
- Known flaky: duel-runner "avatar tracks a walk". It always passes alone (6/6). Under full-suite load it sometimes peaks at 0.35-0.44 against a 0.3 limit, around 0.9-1.35 s into the walk, with no sample gaps, so this is real smoothing error when frames are slow, not a measurement bug. It predates the fixes. Not fixed.
- v181 bumped and packaged: `python3 tools/package-itch.py out/hexmancers-v181-itch.zip` (967 files, checks pass).

## To resume
1. Fixes are done; skip to step 4 unless something new came up. (Old step:) `git log` — if the commit "fix: symmetric draw, avatar ignores land claims, mirrored burn/poison" exists, go to step 3.
2. Otherwise finish findings 1-4 above on top of the wip commit. Draw repro idea: a loopbackPair with delay L and a fake clock; L=5, x=295 should give both sides the same result.
3. Run the tests one at a time: `node tools/playtest/netplay-test.js`, `node tools/playtest/duel-runner.js <outdir>`, `(cd tools/netplay && npm ci && node relay-test.js)`, `node tools/playtest/selftest.js`, `node tools/playtest/battle-clock-test.js`.
4. Do a scoped re-review of the fix commit, then the finishing-a-development-branch step. No PR unless the user asks.

## Deferred minors (can wait)
- A stale spell/spelldone message can reopen or close the next screen (needs a delay of more than mpSpell+2 s).
- Attacker-side heals are skipped in duels.
- A draw sets phase to 'lose'.
- host() leaks a peer connection when CompressionStream is missing.
- A full or bad relay room reads as connected, then waits 60 s.
- The relay has no Origin check.
- No pagehide handler, so the other side sees "Connection lost" instead of "Opponent left".
- #duAccept can be double-tapped.
- The avatar uses the local player's look.
- A remote spell open doesn't clear #btnWand charging.
- The cosmetic shot ignores the sender's shot speed.
- Tests lack Draw and Connection-lost cases.

## Rulings made during the work
- Ruling: pos message has required finite fx,fz,vx,vz and ts only; integer c 0-13 / r 0-8 bounds apply to hit.tile and step.from/to — T1 step 3 text was stale from the first draft — costs a one-line fix if wrong
- Ruling: hitLands called with 4th arg XLIT.mpDefend (via session settings) — signature in T2 is binding — none
- Ruling: T3 sends sync with B.gauge as 4th field and stores received gauge in B.pvp.oppGauge — T2 signature binding — none
- Ruling: T3 adds the five XLIT_DEF keys (mpSpell:10, mpDefend:50, mpBackdate:250, mpSend:16, mpSmooth:33) to look.js; T6 adds only the debug rows/sliders and binding-table entries — avoids T3 reading undefined keys — T6 slightly smaller
- Ruling: T3 may also modify game/ui.js (Spell button, Fight! button, card-screen countdown/waiting text) and game/look.js — required by T3's own synced-card-screen interface — none
- Ruling: DuelSession gains ready() and a 'fight' event (each side sends ready; both -> state 'fighting'); T3 must call session.ready() once the battle is built — the plan never said how starting becomes fighting — costs a small T3 addition if wrong
- Ruling: hit.tile is sent in the attacker's own columns (DuelSession already mirrors c'=13-c on receive; plan T3 text said to mirror on send, which would double-mirror) — implementer's reading accepted — none
- Ruling: colourless hits are sent with color 'gray' ('white' is not a COLORS key so the codec rejects it); avatar barrier is not copied from sync (would make defender's barrier unbreakable on attacker side); avatar smoothing is a true 2-frame buffer (mpSmooth ms behind, velocity extrapolation capped 100ms) because the plan's easing failed its own 0.3-unit tracking check — costs nothing if wrong
- Ruling: Task 4 also adds the script tag for nettransport.js to game/index.html right after netduel.js (brief's file list omits it; Task 6 needs it loaded) — none
- Ruling: pairing code writes base64url's '-' as '.' (group separator stays '-') because the two were ambiguous on round trip; ICE gathering wait ends on 'complete', 1.2s after the last candidate, or a 5s cap because headless Chromium never reports 'complete' — accepted — none
- Ruling: Task 6 absorbs the Task 3/2 hand-offs: (a) leaving a duel stops the local battle and returns to the menu; (b) when the duel ends, close the card screen (#custom) if open; (c) while a duel is running keep driving session.tick() from a 500ms interval (cleared on end) so a hidden tab/pause menu/locked phone does not forfeit by silence — browsers throttle background timers to ~1/s which still meets the 1s heartbeat; (d) add `if(B!==b)return;` after duelTick in update() so an onEnd that nulls B cannot throw; (e) connect/lobby timeout (20s) with readable message — these were not in the plan text but are required to meet Review Focus 1/4
- Ruling: no host Start button — DuelSession (T2) makes the host send `start` automatically when the lobby opens, so a button would contradict T2; lobby shows opponent name and the duel starts ~1.2s later — plan's Start button dropped — if you want manual start, netduel.js needs a change
- Ruling: human waits (guest showing answer code, Room host waiting for friend) get 60s, not the 20s timeout (20s covers code generation/connect/lobby); added a 'Your name' field (default Hexmancers) because saves have no player name; Room mode sends probes because relay forwards only to connected peers — accepted
