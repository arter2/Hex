# Playtest: fights with patterns (v125)

Date: 2026-10-23 · Build v125 · 60 careers of 3 hours (180 hours), 9,660 dungeon fights, 525 puzzles, no errors.
The same bots, players and seeds as [playtest-crawl-v124.md](playtest-crawl-v124.md). The design is in
[../fight-patterns.md](../fight-patterns.md).

## v124 → v125

| | v124 | v125 |
|---|---|---|
| Dungeon fights with no danger (3 HP or less lost) | 78–91% | 53–70% |
| Dungeon fights won (average / good / fast / combo / shopaholic) | 100 / 100 / 99 / 100 / 100% | 96 / 99 / 93 / 97 / 100% |
| Average dungeon fight | 18–25 s | 26–36 s |
| Deaths an hour (average / good / fast / combo / shopaholic) | 0.1 / 0.0 / 0.5 / 0.1 / 0.0 | 1.8 / 0.4 / 4.1 / 1.6 / 0.1 |
| Deepest floor after 3 hours (average / good / fast / combo / shopaholic) | 25 / 21 / 34 / 26 / 21 | 20 / 20 / 24 / 21 / 19 |
| Fun ÷ frustration (same order) | 8.2 / 8.9 / 7.6 / 9.7 / 11.1 | 6.1 / 7.7 / 4.6 / 6.6 / 10.5 |
| "Would put the game down" moments an hour | 1.2 | 1.7 |
| Gold left at the end (average / good / fast / combo) | 29,000 / 37,000 / 39,000 / 41,000 | 15,000 / 36,000 / 20,000 / 28,000 |
| Battle mode, whole runs won (average / good / fast / combo) | 96 / 99.8 / 98 / 99.6% | 95 / 98.6 / 96 / 98.8% |

## Danger by depth (HP lost in an ordinary dungeon fight)

| Depths | Target | v125 | Fights over twice the target | Foes a fight | Elites a fight |
|---|---:|---:|---:|---:|---:|
| 1–3 | ~5% | 3.5% | 11% | 2.3 | 0 |
| 4–7 | ~10% | 7.9% | 16% | 2.4 | 0.1 |
| 8–12 | ~10% | 8.5% | 17% | 3.3 | 0.3 |
| 13–20 | ~17% | 15.0% | 18% | 3.9 | 0.6 |
| 21+ | ~25% | 29.6% | 20% | 5.1 | 1.1 |

The design asked for about 1 fight in 6 to go well over the target; it is 11–20%.

## What it shows

1. **Fights now matter, and the ramp works.** Danger follows the targets at every depth. Squads, rhythms and elites
   make deep fights longer and more varied, rather than just bigger hits.
2. **Death is now the top pain** (25% of all frustration). Most deaths are at depth 13 and deeper, and the reckless
   "fast" player dies about 4 times an hour. The careful players (good, shopaholic) almost never die. Deaths are blamed
   on the first foe of the squad, often the support (Priest, Halo Sprite), which keeps the others alive.
3. **Players go less deep in 3 hours** (about 20 instead of 21–34) and keep less gold, because a death costs gold and
   time. That eases the "gold piles up" problem from v124 a little.
4. **Battle mode** uses the same squads, rhythms, tactics and elites, with a gentler damage ramp (1% per depth),
   because its fights are whole encounters of several waves. It is slightly harder than v124. With the dungeon's
   full ramp it fell to 82–92% wins, which was too much.

## Fixed along the way

- **Teleport pads stole you on the way past.** A tap to walk could cut a corner over a pad and send you across the
  floor. Three careers sat on one floor for 2+ hours because of it, walking into the same pad again and again.
  Tap-to-walk and its corner-cutting now go round pads unless you tapped the pad itself.
  (`tools/dungeon-fixes-test.js` checks it.)
- The bots now use pads on purpose when a pad is the only way somewhere.

## Options if deaths feel too high

- A small heal after each won dungeon fight (for example 10% of max HP).
- Lower the depth 21+ multiplier a little (29.6% against a 25% target).
- Make the support's role clearer, since it is behind many deaths: a stronger heal tell, or a "kill me first" marker.
