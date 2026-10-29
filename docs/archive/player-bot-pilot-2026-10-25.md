# Player-bot pilot results

Build: 2c11de62b9bc8821f65651b391a7b4aa7342a6dd. Scripted profiles running the actual game in headless Chromium. This is a small descriptive pilot, not a human skill study or mobile/Safari input test.

## Battle runs: execution health

24 records: 24 clean, 0 recovery-assisted, 0 failed, 0 skipped.

## Dungeon careers: execution health

9 records: 9 clean, 0 recovery-assisted, 0 failed, 0 skipped.

## Battle results — clean runs only

| Profile | Clean / records | Fights | Won | HP lost / fight | Seconds / fight | Next target depth (avg) |
|---|---|---|---|---|---|---|
| random | 6 / 6 | 37 | 97.3% | 52.7 | 78.7 | 7.0 |
| average | 6 / 6 | 36 | 100.0% | 22.0 | 59.5 | 7.0 |
| good | 6 / 6 | 36 | 100.0% | 13.2 | 49.9 | 7.0 |
| combo | 6 / 6 | 36 | 100.0% | 18.6 | 49.4 | 7.0 |

## Dungeon results — clean careers only

| Profile | Clean / records | Virtual hours | Deepest (avg) | Deaths | Fights | Won | Walk stalls | Modelled threshold crossings |
|---|---|---|---|---|---|---|---|---|
| average | 3 / 3 | 0.75 | 4.0 | 0 | 33 | 100.0% | 0 | 0 |
| good | 3 / 3 | 0.76 | 3.0 | 0 | 34 | 100.0% | 0 | 0 |
| combo | 3 / 3 | 0.75 | 3.7 | 0 | 35 | 100.0% | 0 | 0 |

## Failures and interventions

None recorded.

## What this pilot suggests

- **Early combat is forgiving.** The random profile won 36 of 37 fights; the other profiles won 36 of 36 each. These depth-1–6 results cannot establish that the whole game is too easy.
- **Profiles differ more in efficiency than wins here.** Good averaged 13.2 HP lost versus random's 52.7 (about 75% less), and 49.9 seconds versus 78.7 (about 37% faster). Deck building, stats and progression also differ, so this is not an isolated human-skill effect.
- **Combo was not uniformly better.** It finished slightly faster than good but lost more HP on average. Six battle runs per profile are too few to establish a stable ranking.
- **Dungeon depth is not a skill ranking.** Average reached a higher mean depth than good in the allotted time; the profiles have different exploration and puzzle priorities. Good aims for more floor coverage. Longer, replicated careers are needed to distinguish those effects.
- **No health or control-state failures were recorded in this sample.** All 33 requested runs were clean. The nine careers recorded 102 fights, no deaths and no walk stalls. This does not certify touch hit regions or menu usability.
- The battle table's **next target depth 7** means the runs cleared their depth-6 budget; they did not fight at depth 7.

## Evidence

- [Completed CI run, logs and job summary](https://github.com/arter2/Hex/actions/runs/40225654411).
- [Raw jobs, JSONL results, manifests and generated report](https://github.com/arter2/Hex/actions/runs/40225654411/artifacts/12611332161), retained for seven days by CI.
- Tested commit: [2c11de6](https://github.com/arter2/Hex/commit/2c11de62b9bc8821f65651b391a7b4aa7342a6dd), containing the improved bots and unchanged game code from main at 35009bc.
- Execution completed on 2026-10-25 in approximately three minutes, including browser installation and setup.

## Limits

- One replicate per colour/profile; careers have a 15-virtual-minute target (an active fight may finish after it). Results describe this sample only.
- Battle profiles differ in fighting, deck strategy and progression; their differences are not a controlled measurement of human skill.
- Input uses game actions, not rendered touch hit regions. This run does not certify walking controls, menu overlap or physical Safari.
- Failed careers are diagnostics, not evidence of their profile being weaker. Missing records mean the pilot did not complete.
