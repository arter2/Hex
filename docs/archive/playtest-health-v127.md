# Playtest: bugs, saves, fairness, skill, sessions and memory (v127)

Date: 2026-10-24 · Build v127 · New measurements, built from the testing plan. How each one works and how to run it:
[../playtest-tools.md](../playtest-tools.md).
- Dungeon: 60 careers of 3 hours (180 hours, 10,096 hits taken in fights).
- Battle mode: 60 runs (1,500 fights), with a random player added as a baseline.
- Save scenarios: 6.
- A 20-minute real-time session, drawn every frame.

## Bugs the new checks found (all fixed in v127)

| Bug | Found by | What it did | Fix |
|---|---|---|---|
| **HP became NaN** (not a number) | NaN watch | An enemy casting one of the 13 sentry cards with no power made a turret that hit for NaN. One hit left your HP as NaN for the rest of the run: you could not die, and the HP bar broke. 4 of 60 careers. | Such turrets get a base power of 6. `hitPlayer` ignores damage that is not a number. |
| **A fight leaked GPU textures** | Long-session test | Every battle left about 17 textures in graphics memory (each material's own normal and roughness maps): 29 → 377 in 20 minutes. On a phone, a long session slows down and can crash. | They are freed with their material. |
| **A damaged save sent you to a new game** | Save scenarios | It opened character creation without a word, and the new character then overwrote the damaged save. | The damaged save is kept as a backup copy, and the game says so. |
| **Two tabs undid each other** | Save scenarios | An older tab saving later wiped what the newer tab had earned. | A tab whose save was changed elsewhere stops saving and asks you to reload. |
| **Storage full: saves failed silently** | Save scenarios | Your progress was not being saved, and nothing said so. | A warning. |
| **A curse left HP above your new max** | Rules check | | HP comes down to the new max. |
| **The starter wand was not marked as worn** in a new game until a reload | Save round trip | | Marked from the start. |

After the fixes, 180 hours broke no rule, and 8,915 save round trips came back identical.

## Results

### Saves
- **A refresh at a random moment** loses something 10% of the time, about 2 gold on average.
- The worst cases (185 gold, 105 cards) were halfway through buying and opening packs, where a refresh undoes the purchase as well.
- **Reloads mid-dungeon and mid-fight lose nothing.**

### Fair hits
- **0 unfair hits in 10,096 dungeon hits**, and under 1% in battle mode. Unfair means under 0.4 s of warning while you stood there all along.
- 3% are tight (0.4–0.7 s).
- Shots give 1.6 s of warning on average, ground telegraphs 1.0 s.
- The few unfair and tight hits mostly come from the Dawn Paladin, the Hex Knight and the Storm Caller.

### Does skill matter? (battle mode, fights won)

| Player | Depth 1–3 | 4–7 | 8–12 | 13–20 | 21+ | HP lost a fight |
|---|---:|---:|---:|---:|---:|---:|
| random | 100% | 90% | 80% | 71% | 55% | 148 |
| average | 100% | 94% | 89% | 93% | 86% | 105 |
| good | 100% | 100% | 98% | 95% | 92% | 67 |
| combo | 100% | 100% | 100% | 98% | 98% | 48 |

- **Skill matters more the deeper you go.**
- At depths 1–3 a player who never dodges still wins everything. That is kind to new players, but early fights don't teach dodging.
- From depth 8, good play is worth 20–40 win-rate points and half the HP lost.

### Is there one best way to play?
- **Colours:** within 4 win-rate points of each other (94–98%).
- **Cards:** none of 341 cards lifts the win rate by 8 points with confidence, so there is no must-have card.
- 11 cards are worth watching (could be chance), led by Ink Cloud, Briar Bomb and Reaper's Due.
- Before the NaN fix, 7 cards looked like must-haves. They were an artifact of that bug.

### Where sessions stop

| | average | good | fast | combo | shopaholic |
|---|---:|---:|---:|---:|---:|
| A big reward under 2 minutes away when the session stops (a hook) | 53% | 67% | 62% | 63% | 58% |
| Stopped right after a big reward (a natural break) | 13% | 20% | 21% | 21% | 23% |
| Median wait between big rewards | 1.6 min | 1.3 min | 1.1 min | 1.2 min | 1.0 min |
| 1 in 10 waits longer than | 5.5 min | 4.9 min | 4.4 min | 4.5 min | 4.6 min |
| Longest wait | 21 min | 15 min | 25 min | 24 min | 13 min |

- **The hook is strong:** big rewards come about every minute and a half.
- **There are dry spells:** 1 in 10 waits is over 4–5 minutes, and the longest are 13–25 minutes.
- **"Would quit" moments:** about half had a big reward under 2 minutes away, so the player would have quit just short of it.
- **Rare cards aren't rare:** 29 new rares an hour. A rare stops feeling special at that rate.

### Memory over a long session
- **The JS heap stays flat** (50–135 MB).
- **Dungeon graphics memory is flat** across floors and trips to camp.
- **Battle graphics memory now grows slowly and levels off.** The growth is cached animation frames. Over 12 fights at the same depth: 77, 79, 81, 86, 88, 87.
- **Two frames took over a second** in 20 minutes. This machine draws with a software GPU, so frame times need a check on a real phone.

### Danger by depth, re-measured
- Depths 1–20 are as in v125: 3.5% / 7.6% / 7.7% / 13.5% of HP a fight against targets of 5 / 10 / 10 / 17.
- **Depth 21+ swings between runs:** 29.6% in v125, 13.8% now, for a target of 25%. Only about a dozen careers get that deep, and any change alters every dice roll after it. More runs at depth 21+ are needed before retuning it.

## Worth doing next
1. **Rare cards:** about 29 new rares an hour. Fewer rares, or the "rare" label only on the best of them.
2. **Dry spells:** the 1-in-10 waits over 5 minutes. A small reward to bridge them (a cache, a quest step, a merchant).
3. **Early dodging:** at depths 1–3 nothing punishes standing still, so players learn to dodge late.
4. **Depth 21+ danger:** a study that starts careers deep, before retuning.
5. **Check on a real phone:** frame times and the occasional one-second hitch.
