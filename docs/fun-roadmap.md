# Hexmancers: making it more fun

Date: 2026-10-15 · Status: ideas, not yet built

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

A **Bounty board** at camp shows 3 contracts at a time. One new contract appears each day and
whenever you finish one. Each contract asks for a style of deck and pays in things you can't get
elsewhere.

Example contracts:

- "Reach depth 6 with a deck that's at least 70% Frost." Reward: a Frost family pack and 40
  shards.
- "Win 5 fights with no strike cards in your deck." Reward: a rare summon of your choice.
- "Beat the Ember Rifts boss with a two-colour deck that has no Fire." Reward: a legendary
  shard bundle.
- "Win a fight using 3 combos." Reward: Arcane Weave card back.

Rules:

- Contracts check the deck you start the run with, so players must build for them.
- They are shown with a "Build a deck for this" button that opens the builder with an
  auto-filled draft.

#### B. Area affinities (the reason to keep several decks)

Each area has a colour it is **weak to** and a colour it **resists**. This builds on the
existing `weak:` data:

- Cards of the weak colour deal +25% damage there.
- Cards of the resisted colour deal −25%.
- The stairs and the floor-select screen show the area's affinity and let you **swap decks
  between floors** (at camp or at a sanctuary).

Result: a player who wants to push deep needs a deck for the Frozen Deeps and a different one for
the Ember Rifts. The 5 deck slots finally matter.

#### C. Shards and the Binder (targeted progress)

Random drops alone make it hard to finish a build. Shards fix that.

- A copy beyond the deck limit (4, or 1 for legendaries) turns into **Hex Shards**
  automatically. You can also break any spare card into shards.

  | Rarity | Shards when broken | Shards to craft |
  |---|---|---|
  | Common | 5 | 20 |
  | Uncommon | 15 | 60 |
  | Rare | 40 | 160 |
  | Legendary | 150 | 600 |

- In the collection, any card you have **seen** (`save.seen`) can be crafted for shards. You
  can't craft cards you have never met, so exploring still matters.
- Heroes can't be crafted.

#### D. Colour mastery and set rewards (the long goal)

- **Colour mastery:** every fight you win gives mastery to each colour in proportion to how many
  of its cards are in your deck. Each colour has 10 levels. Early levels come fast and later ones
  slow down, so spreading out across colours pays off. Each level gives something:
  - shards and family packs of that colour
  - at levels 3, 6 and 9, a **mastery card** of that colour that can only be earned this way
  - at level 10, a gold card frame for that colour's cards
- **Set rewards in the collection book:** each colour's card set is split into small groups
  (for example "Fire: the Forge", 8 cards). Owning every card in a group gives a reward:
  a relic, a card back, a hero soul, or gold.

### What a player experiences

1. They play their favourite Fire deck and reach the Frozen Deeps, where Fire is resisted. It
   gets hard.
2. The Bounty board offers a Frost-heavy contract with a Frost pack as the prize.
3. They build a Frost deck. They are 3 cards short, so they break spare Fire cards into shards
   and craft the missing pieces.
4. The run pays Frost mastery, which unlocks a Frost-only mastery card. That card is the start of
   their next deck.

### Build order

1. **Shards and crafting** (small): it uses `save.owned` and `save.seen`, adds a shard total
   to the save and a craft button on the card detail.
2. **Bounty board** (medium): camp button, contract table, checks at the start and end of a run.
3. **Area affinities** (small to medium): damage modifier in the battle engine, affinity line on
   the stairs, deck swap at camp and sanctuaries.
4. **Colour mastery and set rewards** (medium): mastery track per colour, set groups in the
   collection book, reward pop-ups.

### Open questions

- Should breaking cards into shards be manual only, or automatic for copies over the limit?
- Should contracts expire daily, or stay until done?
- Should area affinities also affect the enemies' cards against you?
