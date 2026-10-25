# Playtest tools: what each bot measures and how to run it

Implementation update: [bot improvements and runner/UI commands](bot-improvements.md). Run
`node tools/playtest/selftest.js` for browser-free regressions. Historical results before the
clock, seed and model changes are not directly comparable with new runs.

All tools live in `tools/playtest/` and drive the real game in headless Chromium. Results are compared build to
build. The bots are not people: their fun and frustration weights are guesses until a few human playtests set them.

## The tools

| Tool | What it is | Run it |
|---|---|---|
| `crawl.js` + `crawl-runner.js` | Whole careers in the dungeon (walk, explore, puzzles, fights, shops, camp) on a virtual clock, five player styles | `node mkcrawl.js jobs.json …` then `node crawl-runner.js jobs.json out.jsonl`, report: `node analyze-crawl.js out.jsonl…` |
| `bot.js` + `run-runner.js` | Battle-mode runs: fight after fight, deck building and packs between | `node mkruns.js jobs.json <perColour> <fights> <depth> random,average,good,fast,combo` then `node run-runner.js jobs.json out.jsonl`, report: `node analyze-skill.js out.jsonl…` |
| `save-torture.js` | What happens to a save when things go wrong | `node save-torture.js [out.json]` |
| `soak.js` | A long session in real time, drawn every frame: memory, GPU objects, frame times | `node soak.js [minutes] [out.json]` |
| `puzzle-lab.js` | Each puzzle kind on its own, many times | see the file |
| `ui-runner.js` | Real coordinate taps and hit-region checks for phone/tablet menus | `BROWSER=webkit node tools/playtest/ui-runner.js out-ui` (WebKit, not physical Safari) |

## What each measures

### Bugs and health (`crawl.js`, every career)
- **Rules that must always hold**, checked every tick on the map and after every fight:
  - HP a number between 0 and max (above max for over a second counts);
  - your position a number and on floor, not rock;
  - enemy positions numbers;
  - gold a whole number of at least 0;
  - level and XP in range;
  - every owned card real, with a whole count above 0;
  - no deck holds more copies than you own;
  - Charge uses valid;
  - once a floor, both stairs reachable (through every door).

  Each broken rule is logged once per kind and floor, with the seed to replay it.
- **The save's round trip:** every minute the save is written, read back and compared.
- **What a refresh would lose:** every minute the save in storage is compared with the game in memory (gold, cards, levels).
- **NaN watch:** any value that is not a number reaching your HP (damage, healing, the HP you leave a fight with) is caught where it enters, with the call that sent it.
- **Softlocks:** a walk that times out, a floor that takes too long, dead time with nothing new seen ("stuck", "floor:long", "dead time").

### Saves (`save-torture.js`)
Six scenarios on a real page with real reloads:
- a reload mid-dungeon;
- a reload mid-fight;
- a corrupted save;
- two tabs on one save;
- storage full;
- an old, sparse save.

### Fairness (`bot.js`, every fight)
- For every hit that cost HP: how long its threat was on screen first.
  - A ground telegraph counts its whole time.
  - A shot counts its flight plus its owner's wind-up.
- **Unfair:** under 0.4 s (0.28 s to react, 0.12 s to step) while you stood on that tile all along.
- **Tight:** 0.4–0.7 s.
- Reported by depth, by kind of hit, and by the enemy behind it.

### Skill and strategy (`analyze-skill.js`)
- **Mastery gap:** win rate and HP lost per fight, by depth.
  - The random player builds the same decks as the average one, but wanders, never dodges, casts cards as they come and taps carelessly.
  - A small gap means skill in a fight hardly matters. A random player who never wins means new players are punished hard.
- **One best way?**
  - Win rate by colour.
  - Each card's lift: in fights of the same colour and depth band, the win rate and HP lost with the card in the deck against without it.
  - A card needs +8 points with z > 3.5 to be called a possible must-have, because hundreds of cards are tested at once.

### Fun, annoyance and pacing (`analyze-crawl.js`)
- Fun and frustration events per hour, by cause, with examples.
- **"Would put the game down" moments:** a rolling 10-minute window where frustration outweighs fun beyond the player's patience.
- Danger by depth against its targets, deaths, time split, puzzles, traps, gold.

### Where sessions stop (`analyze-crawl.js`)
- Each career is cut into phone-sized sessions (median 12 minutes), and a session also ends at every "would quit" moment.
- At each stop:
  - **Hook:** the next big reward (a level, a new depth, a boss, a quest, a puzzle, a legendary or hero card, a blessing, a broken seal) came within 2 minutes.
  - **Natural break:** the stop came within 30 s after a big reward.
  - **Ended on a high:** the last 5 minutes beat that player's usual 5 minutes.
- Also reports the time between big rewards (median, 1 in 10, longest).

### Performance over a long session (`soak.js`)
- Every phase samples:
  - the JS heap (after a garbage collection);
  - geometries, textures and shader programs of the dungeon and battle renderers;
  - DOM size;
  - frame times (median, 95th, 99th percentile);
  - frames over 50 ms;
  - long tasks.
- **Trend:** the first third of the session against the last third. Growth means a leak.
- This machine draws with a software GPU, so absolute frame times are slow: watch the trend and compare builds.

