# Hexmancers: making it more fun

Date: 2026-10-15 · Status: Part 1 is ideas; Part 2 is built (v58)

The game already has a deep loop: dungeon crawling (secrets, mimics, puzzles, escorts, branches),
a real-time card battle (combos, curses, telegraphs), a deck builder, gear, missions, a shop and
packs. It doesn't need many more systems. It needs the ones it has to land harder and to give
players reasons to come back.

Part 1 lists five ways to make play more fun. Part 2 designs how cards carry between runs so
players have reasons to build new decks.

---

## Part 1: Five ways to make it more fun

### 1. Big moments that feel big (battle juice)

The 3D arena can now do lights, camera punches and swings. Use them harder.

- **Hit-stop:** a 60 to 90 ms freeze on crits, kills and finished combos, with a white flash on
  the target and a spell light at the hit.
- **Combo counter:** a counter that grows on screen as a combo chains. At the payoff it bursts,
  with a sound and a short camera punch.
- **Boss phases as events:** at 66% and 33% health the boss roars. The arena lighting shifts to a
  new colour, the camera swings, and a new attack pattern begins.
- **Kill finish:** the last enemy's death plays in slow motion for 0.4 s before the victory
  screen.

Cost: small. Players feel it in every fight.

### 2. Every run its own story (run-shaping choices)

Right now a run mostly differs by which cards you happen to draw.

- **Boon altar on each floor:** choose 1 of 3 relics or boons with a clear rule. Examples:
  - "The first card you play in each fight is free."
  - "Your curses also strike the enemy beside the target."
  - "Every third Search finds a card."
- **Risk doors:** an elite room or a cursed chest. You win a better pack or relic, or you take a
  curse for the rest of the run.
- Relics already exist in `dungeon.js`, so this builds on what is there.

Cost: medium. This is the biggest boost to replay value.

### 3. Read and outplay the enemy (intent and counters)

The fun in a real-time card fight is seeing a threat coming and answering it.

- Give every enemy one readable tell: a pose, a glow, a sound and a tile telegraph.
- A **perfect answer** (dodging off a telegraphed tile at the last moment, or stunning a
  wind-up) draws a card or gives a burst of mana, with a "Perfect!" pop.
- The enemy weaknesses that already exist (`weak:` in `enemies.js`) show as a small icon over
  each enemy once you have beaten that kind before.

Cost: medium. This turns fights from trading hits into a skill game.

### 4. Goals beyond a single run

Each of these leans on the shop and packs that are already built (Part 2 covers this in depth):

- the collection book with completion rewards
- a daily seeded dungeon with a score
- unlockable card backs (Arcane Weave and Starfield are already drawn)

### 5. Each area plays differently

Each of the six areas gets one signature rule, in both the dungeon and the battle:

| Area | Rule |
|---|---|
| Glowworm Hollows | Glowing crystals on some tiles; standing on one charges your next card. |
| Frozen Deeps | Ice tiles: a unit that is pushed slides until it hits something. |
| Storm Vault | Every 8 s lightning strikes a marked tile, hurting whoever is on it. |
| Ember Rifts | Lava creeps one tile each round from the edges. |
| Gilded Ruins | Gold tiles: a kill on one drops extra gold. |
| The Abyss | Void tiles flicker in and out; a unit on one when it vanishes falls. |

Cost: medium to large. It makes each area memorable, not just a new colour.

**Recommended order:** 1, then 2, then Part 2, then 3, then 5.

---

## Part 2: Collecting cards between runs

### What exists today

- Cards you find **are already kept between runs**: `save.owned` is your collection, and you can
  keep 5 deck slots.
- If you fall in the dungeon, what the run found stays on your body (`xDropBody`). You can go back
  down and take it back.
- The collection screen has a "book" view of every card, including cards you have seen but don't
  own (`save.seen`).
- Enemies have weak colours.

So collecting already works. What is missing is a **reason to build a second, third or fourth
deck**: nothing asks you to change decks, and nothing rewards you for trying.

### The design: four pieces that feed each other

```
 play a run with a deck ──► earn cards, shards, colour mastery
          ▲                              │
          │                              ▼
 contracts & areas ask for       craft the missing pieces,
 a different deck  ◄──────────── complete sets, unlock rewards
```

#### A. Contracts at camp (the reason to switch)

A **Bounty board** at camp shows 3 contracts at a time. Decided: a contract **stays until you
finish it**; claiming it puts a new one in its place. Contracts lean to colours you don't already
play. Each contract asks for a style of deck and pays in things you can't get
elsewhere.

Example contracts:

- "Reach depth 6 with a deck that's at least 70% Frost." Reward: a Frost family pack and 40
  shards.
- "Win 5 fights with no strike cards in your deck." Reward: a rare summon of your choice.
- "Beat the Ember Rifts boss with a two-colour deck that has no Fire." Reward: a legendary
  shard bundle.
- "Win a fight using 3 combos." Reward: Arcane Weave card back.

Rules:

- A won fight counts when the deck you fight with meets the contract. Each contract shows
  whether your current deck counts.
- "Build a deck for this" drafts a deck into an empty deck slot (never over one of yours) and
  opens it in the builder.
- Kinds: a colour share, a colour share at a depth, no cards of a type, many cards of a type, a
  boss with a two-colour deck missing a colour, a one-colour deck, 3 combos in a fight, and WEAK
  hits on enemies of a colour.
- Rewards: shards, gold and a pack (of the contract's colour when it has one).

#### B. Area affinities and elemental enemies (the reason to keep several decks)

Decided: every enemy comes in elemental versions, and you can be weak to them too.

- **Elemental versions:** any enemy can take any of the six elements (a Rime Rat, a Gloom
  Bandit, an Ember Gloop). It is named for its element and tinted in its colour.
- **Areas lean to their element:** in an area, 55% of enemies take its element, 20% take a
  random one, and the rest keep their own. The Frozen Deeps are full of frost foes.
- **Enemies:** an enemy is weak to the colour that beats it (175% damage, as before) and
  **resists its own colour** (cards of that colour do 60%). Bosses keep their own rules.
- **You:** your deck's element is the colour that makes up at least 40% of it (a mixed deck has
  none). An enemy whose colour beats yours hits you 30% harder; one yours beats hits 20% softer.
- **Shown:** the camp shows the area's element, what it is weak to, and how your deck fares
  there. The first floor of each area says it in the dungeon log. Enemy labels read
  "weak: ⚡ resists: ❄".
- Decks can already be swapped between floors from the bag in the dungeon.

#### C. Shards and the Binder (targeted progress)

Random drops alone make it hard to finish a build. Shards fix that.

- Decided: breaking is **manual only**. Break a spare copy (one no deck needs) from the card
  detail; it asks you to tap again first. Cards in a deck can't be broken.

  | Rarity | Shards when broken | Shards to craft |
  |---|---|---|
  | Common | 5 | 20 |
  | Uncommon | 15 | 60 |
  | Rare | 40 | 160 |
  | Legendary | 150 | 600 |

- In the collection, any card you have **seen** (`save.seen`) can be crafted for shards. You
  can't craft cards you have never met, so exploring still matters.
- You can craft up to the copies a deck can use. Heroes and mastery cards can't be broken or
  crafted.

#### D. Colour mastery and set rewards (the long goal)

- **Colour mastery** (camp › Mastery): every fight you win gives each colour mastery in
  proportion to its share of your deck (at least 10%). 10 levels per colour, fast early and slow
  later.

  | Level | Reward |
  |---|---|
  | 1 | 20 shards |
  | 2 | a pack of that colour |
  | 3 | mastery card I (a stronger rare) |
  | 4 | 40 shards |
  | 5 | a pack and 100 gold |
  | 6 | mastery card II (a stronger legendary) |
  | 7 | 60 shards |
  | 8 | a pack |
  | 9 | mastery card III (a legendary of another type) |
  | 10 | gold frames on that colour's cards |

  Mastery cards are renamed, 20% stronger versions of the colour's best cards ("Winterheart's
  Great White Shark"). They never drop anywhere else. Packs wait on the Mastery screen.
- **Card sets:** each colour's cards are split by type into sets of up to 8 (218 sets, such as
  "Frost Summons II"). Owning every card of a set lets you claim 30 + 5 per card shards and 60
  gold. Finishing 5 sets unlocks the Arcane weave card back, and 15 unlocks Starfield.

### What a player experiences

1. They play their favourite Fire deck and reach the Frozen Deeps, where Fire is resisted. It
   gets hard.
2. The Bounty board offers a Frost-heavy contract with a Frost pack as the prize.
3. They build a Frost deck. They are 3 cards short, so they break spare Fire cards into shards
   and craft the missing pieces.
4. The run pays Frost mastery, which unlocks a Frost-only mastery card. That card is the start of
   their next deck.

### Build order (all four built in v58)

1. **Shards and crafting** (small): it uses `save.owned` and `save.seen`, adds a shard total
   to the save and a craft button on the card detail.
2. **Bounty board** (medium): camp button, contract table, checks at the start and end of a run.
3. **Area affinities** (small to medium): damage modifier in the battle engine, affinity line on
   the stairs, deck swap at camp and sanctuaries.
4. **Colour mastery and set rewards** (medium): mastery track per colour, set groups in the
   collection book, reward pop-ups.

### Decisions (15 Oct)

- Breaking cards into shards is manual only.
- Contracts stay until you finish them.
- Every enemy has elemental versions, and your deck's element can be weak to them.
