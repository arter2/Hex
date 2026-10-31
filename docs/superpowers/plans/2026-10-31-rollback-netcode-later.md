# Rollback Netcode for Duels Implementation Plan (for later)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duel's attacker-authoritative avatar model with deterministic rollback netcode, so both devices simulate the same duel from the same inputs and disagreements (dodge versus hit) are settled the same way on both.

**Architecture:** Both clients run one shared deterministic simulation of two mages. Only inputs travel over the network. Each client predicts the opponent's input (repeat the last one), and when the real input arrives and differs, it restores the snapshot from that tick and re-simulates up to the present. Rendering is separated from the simulation so a re-simulation draws nothing twice.

**Tech Stack:** The existing plain-script game, the transport and handshake from the duel plan, Node and Playwright tests. No new libraries.

**Spec:** `docs/superpowers/plans/2026-10-31-local-pvp-duel.md` (its "Design decisions" section still applies except where this plan changes it, listed below).

## Status and entry criteria

Do not start this plan until all of these are true:

1. The duel plan (`2026-10-31-local-pvp-duel.md`) is fully implemented and merged, and its tests are in CI. This plan reuses its `netplay.js`, `nettransport.js`, `DuelSession` handshake and menu flow, and keeps the avatar model as the fallback.
2. People have played the avatar duel on real devices and found the leftover ghost hits or desyncs worth fixing. On a local network the avatar model with the defender-wins rule should already feel close, so rollback is mainly worth it for internet play (50 to 150 ms delays), where those tricks stop being enough.
3. Task 1 below (the spike) passes its go/no-go gate. If it fails, stop and keep the avatar model.

**Size, honestly:** `battle.js` and its helpers have about 70 `Math.random()` calls in simulation code, 57 `later()` closures, 133 `B.player` references, 87 `side===` checks and 181 `floater()` calls, all written for one mage against AI. Making that deterministic, snapshot-able and two-sided is a rewrite of the battle core, not an add-on. Tasks 2 to 8 are each large, and Tasks 5 to 7 should be re-planned in detail after the spike, because what the spike finds will change them.

## Design decisions (changes from the duel plan)

- **One shared sim, two mages.** `B.players=[p0,p1]` in absolute board coordinates: `p0` owns columns 0 to 6, `p1` owns columns 7 to 13. Each client renders from its own mage's point of view (camera, mirrored x), as the duel plan does.
- **Acting-player frame.** Existing card, strike and creature code reads `B.player`, `P_TILES`, `E_TILES`, `tile.side` and `alive()` from one mage's point of view. Rather than edit hundreds of sites, `withActor(a, fn)` temporarily points those at actor `a`: `B.player` is `a`, `P_TILES`/`E_TILES` are swapped, tile `side` labels are flipped for `p1`, and `alive()` returns the other mage as an enemy proxy (`kind:'enemy'`, `remote:true`, hp read from the real mage). A hit on a proxy goes through `hitPlayer` for the real mage inside `withActor(thatMage, ...)`.
- **Spell screen no longer pauses the shared sim.** A sim that both clients share cannot pause for one player. In a rollback duel the Spell screen is a timed overlay (8 s) over a running fight, and its draws, queueing and casts are inputs. Confirm this rule with the user before Task 8.
- **Fixed timestep:** `SIM_DT = 1/60` s. Real frame time only decides how many ticks run.
- **Rollback window:** at most 8 ticks (133 ms). Input delay: 2 ticks (33 ms), raised automatically from the measured round trip. If a remote input is later than the window, both sims stall ("Waiting for opponent") instead of drifting.
- **Desync detection:** a checksum of simulation state every 30 ticks, exchanged between clients. A mismatch ends the duel with a clear message and writes a state dump for a bug report. It never continues silently.
- **Cross-engine floating point:** `+ - * / Math.sqrt` are exact everywhere, but `Math.sin`, `cos`, `exp`, `pow`, `atan2` and `hypot` may differ in the last bit between V8 (Chrome) and JavaScriptCore (Safari). A phone and a laptop on different engines would drift. The simulation must not use them (a table-driven or fixed-point replacement is allowed), and a lint test enforces it.
- **Out of scope:** spectating, replays shared between players, more than two players, matchmaking over the internet (the transport for that is a separate plan).

## Global Constraints

- Plain scripts, no build step, no new libraries. New simulation modules end with `if(typeof module!=='undefined') module.exports={...}`.
- `Math.random`, `Date.now`, `performance.now`, `Math.sin|cos|tan|exp|pow|atan2|hypot|log|cbrt` are banned in simulation files (listed in `tools/playtest/determinism-lint.js`). Cosmetic code may use them through `fxRnd` and the render-only files.
- Iteration order must be deterministic: no `for...in` over objects whose keys are inserted at runtime in different orders on the two clients, no `Set` or `Map` iteration whose insertion order depends on timing. Prefer arrays.
- The single-player game must be unchanged in behaviour. Every existing test (`selftest.js`, `battle-clock-test.js`, `ui-runner.js`, `battle-ui-runner.js`, the difficulty curve) must still pass after every task.
- Perf budget: re-simulating 8 ticks plus a frame render under 8 ms on a mid-range phone (Playwright CPU throttle 4x on a laptop is the proxy). Snapshot plus checksum per tick under 0.5 ms.
- Version bump in `game/index.html` on the last task only.

## Review Focus

1. **Silent desync between a phone and a laptop** (different JS engines, a stray `Math.exp`, an unseeded random, a `Map` order): the checksum exchange must catch it within 30 ticks and stop the duel with a message, and the lint test must fail the build on a banned call. (Tasks 2, 9)
2. **Deep rollback on a slow phone** (a bad Wi-Fi spike causes an 8-tick re-simulation inside one frame): the frame must not stall for more than the budget; past the window both sides stall and show "Waiting for opponent" instead of rolling back further. (Task 9)
3. **Packet loss, duplication and reordering of inputs:** inputs carry the tick and are idempotent. A lost input is re-sent until acknowledged. The final state matches on both sides. (Task 9)
4. **One device backgrounded or locked mid-duel** (browser throttles `requestAnimationFrame`): the other side stalls waiting, and after 5 s of silence the duel ends as a forfeit. When the device returns before that, play resumes in sync. (Tasks 9, 10)
5. **Cosmetics doubled or missing after a rollback** (a floater, sound or screen shake replayed during re-simulation, or lost when a prediction was wrong): re-simulation produces no cosmetics, and an event the final timeline contains appears exactly once. (Task 6)

---

## File structure

- Create `game/simrng.js`: seeded `SimRng` with saved and restored state.
- Create `game/simstate.js`: `snapshot()`, `restore(snap)`, `checksum()`, the registry of named timer operations.
- Create `game/rollback.js`: `RollbackSession` (input exchange, prediction, rollback, stalls, checksum exchange). No DOM.
- Create `game/duelsim.js`: `withActor`, the two-mage setup, enemy proxies, input application.
- Modify `game/battle.js`, `enemies.js`, `fights.js`, `strikes.js`, `kinds.js`, `creatures.js`, `bosses.js`, `minibosses.js`, `arearules.js`, `tactics.js`, `bounty.js`, `engine.js`: determinism, closure-free state, actor-aware reads.
- Modify `game/ui.js`: fixed-timestep loop and input routing.
- Create tests: `tools/playtest/rollback-spike.js`, `determinism-lint.js`, `determinism-runner.js`, `snapshot-test.js`, `rollback-test.js`, `rollback-duel-runner.js`.

---

### Task 1: Spike and go/no-go gate

**Files:**
- Create: `tools/playtest/rollback-spike.js` (Playwright, drives the real game in Chromium)
- Create: `docs/rollback-spike.md` (the written result)

**Interfaces:**
- Produces: a report with three measured numbers and a decision. No game code changes are kept.

- [ ] **Step 1: Write the spike.** On a throwaway branch, in a loaded battle, (a) deep-copy `B` with a hand-written walker that records every function, `Set`, `Map`, DOM node and tile reference it meets, and prints the totals by field path; (b) replace `Math.random` with a seeded generator and `performance.now` use in the loop with a fixed `dt` of 1/60, run 600 ticks twice from the same seed with the same scripted moves and casts, and report the first tick where a hash of `{hp, tile, queue, enemies}` differs; (c) time the copy.

- [ ] **Step 2: Run it on three fights** (depth 1, depth 15, a boss) and write `docs/rollback-spike.md` with: the list of non-copyable fields by count, the first diverging tick and the code that caused it for each fight, and the copy time.

Run: `node tools/playtest/rollback-spike.js out/spike`
Expected: a report is written. The run itself does not need to pass.

- [ ] **Step 3: Decide.** The gate passes only if (a) every non-copyable field has a mechanical fix (a named timer operation, an id instead of a reference) and none needs a redesign, (b) the copy takes under 0.5 ms at depth 15, and (c) the divergences found trace to seeded randomness and `dt` only. If it does not pass, write "no-go" and the reason at the top of `docs/rollback-spike.md`, stop, and keep the avatar model.

- [ ] **Step 4: Commit** the report only, not the spike's game changes.

```bash
git add tools/playtest/rollback-spike.js docs/rollback-spike.md
git commit -m "docs: rollback feasibility spike and go/no-go result"
```

---

### Task 2: Seeded simulation randomness and the determinism lint

**Files:**
- Create: `game/simrng.js`, `tools/playtest/determinism-lint.js`
- Modify: `game/battle.js` (the `rnd` and `pick` helpers at line 8 and every `Math.random` in simulation code), `enemies.js`, `fights.js`, `bosses.js`, `minibosses.js`, `arearules.js`, `tactics.js`, `creatures.js`, `kinds.js`, `bounty.js`, `engine.js`

**Interfaces:**
- Produces:
  - `class SimRng` with `constructor(seed: number)`, `next() -> number in [0,1)`, `getState() -> number`, `setState(s: number) -> void`
  - Globals in `battle.js`: `simRnd(a,b)`, `simPick(arr)`, `simChance(p) -> boolean`, all on `B.rng`; and `fxRnd(a,b)`, `fxPick(arr)` on `Math.random` for cosmetics only. Outside a battle (`B` null), the sim helpers fall back to a module-level `SimRng`.
  - `startBattle(..., opts)` accepts `opts.seed`; default is a fresh random seed that is stored in `B.seed`.

- [ ] **Step 1: Write the failing tests.** `determinism-lint.js` scans the simulation file list (the Modify list above, minus cosmetic functions marked `// fx:` on the same line) and fails on any banned call from Global Constraints, printing `file:line`. A second test (Node, `simrng-test` section in the same file) checks `SimRng`: the same seed gives the same first 1000 values, `setState(getState())` resumes the sequence exactly, and 100 000 draws are within 1% of uniform.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/determinism-lint.js`
Expected: FAIL, listing every `Math.random` and banned call (about 70 `Math.random` sites and the trig and hypot sites).

- [ ] **Step 3: Implement `SimRng`** (mulberry32, the same algorithm as `tools/playtest/support.js`) and convert call sites. Classify each site: gameplay outcomes (damage rolls, crits, spawn positions, AI choices, draws, shuffles) use `simRnd`, `simPick`, `simChance`. Particles, camera shake, flicker and spray velocities use `fxRnd` and get the `// fx:` marker. `engine.js` already takes an `rng` argument for shuffles: pass `B.rng` of the owning mage. Replace banned maths in the simulation with `Math.sqrt`-based or table-driven versions (a 256-entry sine table for angles, `Math.sqrt(dx*dx+dz*dz)` for `hypot`).

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/determinism-lint.js && node tools/playtest/selftest.js && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: PASS, and the existing tests unchanged.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/determinism-lint.js
git commit -m "feat: seeded simulation randomness, determinism lint"
```

---

### Task 3: Fixed-timestep simulation

**Files:**
- Modify: `game/battle.js` (`update` at line 970), `game/ui.js` (the frame loop that `battle-clock-test.js` slices out)
- Modify: `tools/playtest/battle-clock-test.js`

**Interfaces:**
- Produces: `const SIM_DT=1/60`; `simTick()` (one fixed step of `update(SIM_DT)`); `B.tick` (integer, ticks run so far). The frame loop keeps an accumulator, calls `simTick()` while it holds at least `SIM_DT` (maximum 5 ticks per frame, as the current 50 ms cap), and passes the leftover fraction to rendering for smoothing.

- [ ] **Step 1: Write the failing test.** Extend `battle-clock-test.js`: at 10, 20, 30 and 60 fps, one second of frames runs exactly 60 ticks (±1), movement distance per tick is identical across frame rates, hit-stop and slow-motion lengths are the same number of ticks at every frame rate, and a 5 s stall runs at most 5 ticks.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/battle-clock-test.js`
Expected: FAIL on the tick-count checks.

- [ ] **Step 3: Implement.** `update` stops reading real `dt`; hit-stop (`dt*=.08`) and slow-mo (`dt*=.25`) become per-tick scale factors applied to `SIM_DT`, which is deterministic. Remove any other source of wall-clock time from the simulation.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/battle-clock-test.js && node tools/playtest/selftest.js && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/battle-clock-test.js
git commit -m "feat: fixed-timestep battle simulation"
```

---

### Task 4: Player actions as data

**Files:**
- Modify: `game/battle.js` (input functions at lines 1107-1150 and 1294-1443: `setAim`, `cycleAim`, `moveTo`, `stepDir`, `freeTarget`, `freeEnd`, `flickThrow`, `wandDown`, `wandUp`, `castCard`, `useInstant`, `useDeckTool`, `soulSummon`, `openCustomScreen`, `closeCustomScreen`), `game/ui.js` and `game/keys.js` (every caller)
- Create: `tools/playtest/determinism-runner.js`

**Interfaces:**
- Produces:
  - `type Input = {k:'move',to:{c,r}} | {k:'stepDir',d:[number,number]} | {k:'free',x,z,key,mag} | {k:'freeEnd'} | {k:'flick',dx,dz,str} | {k:'wandDown'} | {k:'wandUp'} | {k:'aim',tile:{c,r}|null} | {k:'cast'} | {k:'queue',uid,slot} | {k:'unqueue',uid} | {k:'instant',uid,choice?} | {k:'tool',uid,choice?} | {k:'soul'} | {k:'fight'} | {k:'run'}`
  - `applyInput(actor, input: Input) -> void`: the only way player actions reach the simulation. The existing helpers stay as internal functions it calls; UI code, touch handlers and keys call `sendInput(input)` instead, which (single-player) applies it at the next tick and logs `{tick, input}` to `B.inputLog`.
  - `B.inputLog: {tick:number, input:Input}[]`

- [ ] **Step 1: Write the failing test** `determinism-runner.js` (Playwright): start a depth-3 battle with `opts.seed=1234`, drive it by a scripted `Input` list (moves, wand holds, a queue and cast), record `checksum` every tick, reload the page, replay the logged inputs from the log, and assert the two checksum lists are identical for 1800 ticks. Run for three seeds and one boss fight.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/determinism-runner.js out/determinism`
Expected: FAIL (`sendInput is not defined`).

- [ ] **Step 3: Implement** `Input`, `applyInput`, `sendInput`, route all UI and key callers through it, and add a debug `checksum()` (a hash of HP, tiles, positions, piles, RNG state; the full version comes in Task 5).

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/determinism-runner.js out/determinism && node tools/playtest/ui-runner.js out/ui && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: PASS. If the replay diverges, the first differing tick and its field are printed; fix the nondeterminism it names (Tasks 2 and 3 should have removed the common ones), and add each cause to the lint test.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/determinism-runner.js
git commit -m "feat: player actions as logged inputs, replay determinism test"
```

---

### Task 5: Closure-free state, snapshot, restore, checksum

**Files:**
- Create: `game/simstate.js`, `tools/playtest/snapshot-test.js`
- Modify: `game/battle.js` (`later` at line 142 and its 25 calls), `creatures.js` (13), `strikes.js` (6), `minibosses.js` (3), `enemies.js` (3), `rooms.js` (2), `tactics.js`, `reading.js`, `fights.js`, `arearules.js` (1 each), `strikes.js` and `kinds.js` (stored `onHit`/`after` closures), and any `Set`/`Map` kept on `B`, tiles or units (`B.justDrawn`, `B.keepSet`, `s.hit`)

**Interfaces:**
- Produces:
  - `laterOp(sec: number, op: string, args: object) -> void`: a timer stored as data `{t, op, args}`, run through `TIMER_OPS[op](args)`. `later(sec, fn)` remains for cosmetic-only callbacks and is banned for simulation changes by the lint test.
  - `snapshot() -> Snapshot`: a plain-data copy of all simulation state (`B` minus cosmetic fields, tile fields, piles, RNG state). Units are referenced by `id` (integer, assigned at creation), tiles by `{c,r}`.
  - `restore(snap: Snapshot) -> void`: rebuilds `B` and re-links `tile.occ`, `unit.tile`, shots' owners, ally and enemy lists.
  - `checksum() -> number` (32-bit, stable across engines: integers and fixed-precision rounding of positions to 1/1024 only).

- [ ] **Step 1: Write the failing test** `snapshot-test.js` (Playwright): for 20 seeded battles (every area rule, three bosses, a creature-heavy deck, a trap and strike deck), run N=300 ticks with scripted inputs, `snapshot()` at tick 100, run to 300 recording `checksum()` each tick, `restore()` the snapshot, run to 300 again, and assert identical checksum lists. Also assert `snapshot()` contains no functions, `Set`, `Map` or DOM nodes (a recursive walk), and that taking one at depth 15 takes under 0.5 ms (median of 100).

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/snapshot-test.js out/snapshot`
Expected: FAIL (`snapshot is not defined`).

- [ ] **Step 3: Implement.** Convert every simulation `later(sec, fn)` to `laterOp(sec,'name',args)` with an op in `TIMER_OPS` (a registry in `simstate.js`), one by one; the Task 1 report lists the closures stored in shots, telegraphs and strikes, and each gets a named op or a data field. Replace `Set`s on state with sorted arrays. Give every unit an integer `id` at creation from a counter on `B`.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/snapshot-test.js out/snapshot && node tools/playtest/determinism-runner.js out/determinism && node tools/playtest/selftest.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/snapshot-test.js
git commit -m "feat: closure-free sim state with snapshot, restore and checksum"
```

---

### Task 6: Cosmetics out of the simulation

**Files:**
- Modify: `game/battle.js` (`floater`, `flash`, `shake`, `spray`, `ring`, `burst`, `palImpact`, and `B.fx`, `B.floaters`, `B.parts` updates in `update`), `game/arena.js`, `game/reading.js`
- Modify: `tools/playtest/snapshot-test.js` (add checks)

**Interfaces:**
- Produces: `B.resim: boolean`. While true, every cosmetic function returns immediately and sounds are not played. Cosmetic state (`fx`, `floaters`, `parts`, tile `flash`) is not part of a snapshot or a checksum. `B.events: {tick, kind, ...}[]` records the cosmetic events the final timeline produced, so a rolled-back tick's events are replaced, not duplicated.

- [ ] **Step 1: Write the failing test.** Run 120 ticks live, `snapshot()` at tick 60, set `B.resim=true`, `restore` and re-simulate ticks 60 to 120, then assert the lengths of `B.fx`, `B.floaters` and `B.parts` did not change while `B.resim` was true. A second test casts a card at tick 70 (so ticks 60 to 120 change), rolls back and resimulates, and asserts the floater for the original damage appears once.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/snapshot-test.js out/snapshot`
Expected: FAIL on the cosmetic checks.

- [ ] **Step 3: Implement** the `B.resim` guard in the cosmetic helpers and the `B.events` log, with the renderer playing events for ticks it has not yet shown.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/snapshot-test.js out/snapshot && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/snapshot-test.js
git commit -m "feat: cosmetics suppressed during re-simulation"
```

---

### Task 7: Two-mage simulation and the acting-player frame

**Files:**
- Create: `game/duelsim.js`, `tools/playtest/duelsim-test.js`
- Modify: the files listed in Task 5 that read `B.player`, `P_TILES`, `E_TILES`, `tile.side`, `alive()` in a way the frame does not cover (the spike report lists them)

**Interfaces:**
- Consumes: `applyInput` (Task 4), `snapshot`/`restore` (Task 5).
- Produces:
  - `startDuelSim(decks: [string[], string[]], seed: number) -> B` with `B.players=[p0,p1]`, each with its own piles, `B.rng` stream (seeded from `seed` and the player index), wand and gauge. No gear, 120 HP, as the duel plan.
  - `withActor(a: Player, fn: () => T) -> T` as described in Design decisions.
  - `simTickDuel(inputs: [Input[], Input[]])`: applies each player's inputs for this tick, then runs `simTick()` once with each mage's update inside `withActor`, in fixed order p0 then p1.
  - `opponentProxy(a: Player) -> EnemyLike`.

- [ ] **Step 1: Write the failing tests** (`duelsim-test.js`, Playwright):
  - `mirror symmetry`: the same decks and seed, p0 and p1 given mirrored scripted inputs: after 600 ticks `p0.hp===p1.hp`, and mirrored tile positions match, for the three starter decks.
  - `every card type works for p1`: for each card in the starter decks and one card of every `type` in `cards.js`, p1 casts it at p0 and the effect equals the mirror of p0 casting it at p1 (damage, placed tile mirrored, status applied).
  - `hit routing`: a wand shot from p1 down row 4 damages p0 only if p0 is in row 4, and a lob aimed at an enemy-side tile lands on p0's half.
  - `determinism`: two runs with the same inputs have equal `checksum()` at every tick.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/duelsim-test.js out/duelsim`
Expected: FAIL (`startDuelSim is not defined`).

- [ ] **Step 3: Implement** per Design decisions. Where code cannot be run through the frame (it caches `P_TILES` or `B.player` in module scope), fix that site to read through the frame and add it to the spike report's list.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/duelsim-test.js out/duelsim && node tools/playtest/determinism-runner.js out/determinism && node tools/playtest/difficulty.js out/difficulty 1 5`
Expected: PASS, and the single-player difficulty numbers within noise of the previous run.

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/duelsim-test.js
git commit -m "feat: deterministic two-mage duel sim with acting-player frame"
```

---

### Task 8: The Spell screen inside a shared sim

**Files:**
- Modify: `game/battle.js` (`openCustomScreen`/`closeCustomScreen` at lines 174-190, `update`'s `custom` phase handling), `game/ui.js` (Spell screen)
- Modify: `tools/playtest/duelsim-test.js`

**Interfaces:**
- Produces: `p.spell={open:boolean, left:number}` per mage in a duel sim (ticks). Opening is the input `{k:'open'}`, which draws up to a hand and starts an 8 s countdown; `{k:'fight'}` or the countdown ending closes it and the sim keeps running throughout. Queueing, instants and tools are inputs from Task 4. `B.phase` for a duel stays `'fight'`.

- [ ] **Step 1: Confirm the rule with the user** (Design decisions: no pause in the shared sim). Write the answer at the top of this task.

- [ ] **Step 2: Write the failing test**: p0 opens the Spell screen at tick 10 and queues two cards; p1 attacks p0 during the 8 s; p0's HP drops (the sim did not pause); the countdown ends at tick 10+480 and the screen closes with the queue intact; the checksum is identical across two runs.

- [ ] **Step 3: Run to verify failure**

Run: `node tools/playtest/duelsim-test.js out/duelsim`
Expected: FAIL.

- [ ] **Step 4: Implement** the per-mage `spell` state and make single-player keep its pausing behaviour unchanged (`B.phase==='custom'`).

- [ ] **Step 5: Run to verify pass, then commit**

Run: `node tools/playtest/duelsim-test.js out/duelsim && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: PASS.

```bash
git add game tools/playtest/duelsim-test.js
git commit -m "feat: Spell screen as a timed overlay in the shared duel sim"
```

---

### Task 9: RollbackSession

**Files:**
- Create: `game/rollback.js`, `tools/playtest/rollback-test.js`

**Interfaces:**
- Consumes: the Transport contract and `DuelSession` handshake (duel plan, Tasks 1 and 2), `snapshot`/`restore`/`checksum` (Task 5), `simTickDuel` (Task 7).
- Produces: `class RollbackSession`
  - `constructor(sim: {snapshot, restore, checksum, step(inputs)}, transport, {me: 0|1, inputDelay: number, maxRollback: number, now: ()=>number})`
  - `localInput(input: Input|null) -> void`: queue this tick's local input, scheduled at `tick + inputDelay`
  - `advance() -> {ran: number, rolledBack: number, stalled: boolean}`: run the next tick(s) as far as the rules allow; called once per frame
  - `onMessage(text: string) -> void`. Message types added to the codec: `inp{t,tick,input,ack}` (all unconfirmed local inputs each time, so a lost message is repaired by the next), `sum{t,tick,sum}`
  - Events: `'desync'` (`{tick, mine, theirs}`), `'stall'`, `'resume'`, `'timeout'`
  - `stats: {rollbacks, maxDepth, stalls}`
  - Rules: predict the remote input as the last confirmed one; on a confirmed remote input that differs from the prediction at tick `k`, `restore` the snapshot at `k`, re-run to the present with `B.resim=true`, then run the last tick with it false. Keep a snapshot every tick for the last `maxRollback` ticks. If the present would be more than `maxRollback` ahead of the last confirmed remote tick, do not advance (stall). `sum` is sent every 30 confirmed ticks and compared when the matching one arrives.

- [ ] **Step 1: Write the failing tests** (Node with a small deterministic toy sim implementing `{snapshot,restore,checksum,step}`, two sessions over `loopbackPair`, and a seeded network model with delay, jitter, loss, duplication and reordering):
  - `converges`: a scripted 1000-tick two-player toy duel gives identical `checksum()` on both sides at the end and at every confirmed 30th tick, at 0, 50 and 150 ms round trip, and with 5% loss and 2% duplication and reordering.
  - `prediction hit`: when the remote player repeats its input, `stats.rollbacks===0`.
  - `prediction miss`: one changed input produces exactly one rollback of the right depth, and the end state equals a run with zero delay.
  - `stall`: delaying inputs by more than `maxRollback` ticks produces `'stall'` and no further advance; the delayed input then produces `'resume'`.
  - `desync`: flipping one bit in one side's sim state makes both sides fire `'desync'` within 30 ticks.
  - `timeout`: 5 s of silence fires `'timeout'` once.
  - `idempotent inputs`: delivering the same `inp` message 50 times changes nothing.
  - `late join of the clock`: input delay is raised when the measured round trip exceeds `inputDelay * 16 ms`.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/rollback-test.js`
Expected: FAIL (`RollbackSession is not defined`).

- [ ] **Step 3: Implement** `RollbackSession` per the rules. Keep it free of any game globals; it only touches the injected `sim`.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/rollback-test.js`
Expected: PASS, with the stats for each network profile printed.

- [ ] **Step 5: Commit**

```bash
git add game/rollback.js tools/playtest/rollback-test.js
git commit -m "feat: RollbackSession with prediction, rollback, stall and desync detection"
```

---

### Task 10: Duel integration, fallback and performance

**Files:**
- Modify: `game/ui.js` (the duel flow from the duel plan, Task 6), `game/index.html` (script tags), `game/battle.js`
- Create: `tools/playtest/rollback-duel-runner.js`

**Interfaces:**
- Consumes: `RollbackSession` (Task 9), `startDuelSim` (Task 7), the duel menu and `DuelSession` handshake.
- Produces: a setting `netModel: 'rollback' | 'avatar'` (default `'avatar'` until this task's checks pass for a week of use), chosen by the host in the lobby and sent in `start`; both clients must match or the duel starts in `'avatar'` mode. The frame loop calls `rollback.advance()` each frame and renders the sim from the local mage's point of view with the leftover tick fraction.

- [ ] **Step 1: Write the failing checks** (`rollback-duel-runner.js`, Playwright, two pages over the real WebRTC transport, then over the relay):
  - `plays to the end in sync`: two scripted bots duel for 90 s of game time, with a 40 ms artificial delay on the transport; both pages report the same winner and the same final `checksum()`, and no `'desync'`.
  - `perf budget`: with Chromium CPU throttle 4x, the 95th percentile of frame work (re-simulation plus render) over the duel is under 8 ms of added time per frame, and the worst frame under 33 ms.
  - `background pause`: one page is frozen for 2 s (CDP `Page.setWebLifecycleState` frozen, or `page.evaluate` busy-loop); the other shows "Waiting for opponent", and after unfreezing both continue with matching checksums. After 6 s frozen the other page ends the duel as a forfeit.
  - `fallback`: when the two clients' `netModel` differ, the duel starts in avatar mode and plays normally.
  - `desync is shown`: after injecting a one-bit state change on one page, both pages show the desync message within 30 ticks and return to the menu without errors.

- [ ] **Step 2: Run to verify failure**

Run: `node tools/playtest/rollback-duel-runner.js out/rollback-duel`
Expected: FAIL.

- [ ] **Step 3: Implement** the integration, the lobby setting and the fallback.

- [ ] **Step 4: Run to verify pass**

Run: `node tools/playtest/rollback-duel-runner.js out/rollback-duel && node tools/playtest/duel-runner.js out/duel`
Expected: PASS for both (the avatar duel tests still pass).

- [ ] **Step 5: Commit**

```bash
git add game tools/playtest/rollback-duel-runner.js
git commit -m "feat: rollback duel mode with avatar fallback"
```

---

### Task 11: Docs, CI and version

**Files:**
- Modify: `docs/multiplayer.md`, `.github/workflows/quick-test.yml`, `game/index.html`

- [ ] **Step 1: Add the new tests to CI.** Node tests (`determinism-lint.js`, `rollback-test.js`) go in "Bot self-checks"; browser tests (`determinism-runner.js`, `snapshot-test.js`, `duelsim-test.js`, `rollback-duel-runner.js`) go in a step after the duel tests. Add the determinism lint to the nightly run too.
- [ ] **Step 2: Document** in `docs/multiplayer.md`: both net models, when rollback is used, the determinism rules for anyone adding a card or enemy (use `simRnd`, no banned maths, no state in closures, register timer ops), and how to read a desync dump.
- [ ] **Step 3: Bump the version** in both places in `game/index.html`.
- [ ] **Step 4: Run everything**

Run: `node tools/playtest/selftest.js && node tools/playtest/battle-clock-test.js && node tools/playtest/netplay-test.js && node tools/playtest/determinism-lint.js && node tools/playtest/rollback-test.js && node tools/playtest/duel-runner.js out/duel && node tools/playtest/rollback-duel-runner.js out/rollback-duel && node tools/playtest/ui-runner.js out/ui && node tools/playtest/battle-ui-runner.js out/battle-ui`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/multiplayer.md .github/workflows/quick-test.yml game/index.html
git commit -m "docs+ci: rollback netcode guide, CI wiring, version bump"
```

---

## Self-review

- **Spec coverage:** shared deterministic sim (Tasks 2 to 5, 7), prediction and rollback (Task 9), cosmetics (Task 6), Spell-screen rule (Task 8), desync detection (Tasks 9, 10), fallback to the avatar model (Task 10). Every Review Focus line maps to a task with a named test.
- **Type consistency:** `Input` and `applyInput` come from Task 4 and are used unchanged in Tasks 7 to 9. `snapshot`, `restore`, `checksum` come from Task 5 and are used by name in Tasks 6, 9 and 10. `B.resim` is defined in Task 6 and set in Task 9. `startDuelSim` and `simTickDuel` are defined in Task 7 and used in Tasks 9 and 10.
- **Known weak spot:** Tasks 5 to 7 are sized from grep counts, not from reading each call site. The Task 1 spike exists to correct that, and those three tasks must be re-planned in detail from its report before anyone starts them.
- **Open decision:** the Spell-screen rule in Task 8 changes a rule players know from solo play. It needs the user's confirmation before that task starts.
