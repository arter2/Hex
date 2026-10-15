# Hexmancers: making it more fun

Date: 2026-10-15 · Status: Part 1 ideas 1 and 5 are built (v59, v60) with rare foes; Part 2 is built (v58); Part 3 rounds 1 and 2 are built (v66, v67)

The game already has a deep loop: dungeon crawling (secrets, mimics, puzzles, escorts, branches),
a real-time card battle (combos, curses, telegraphs), a deck builder, gear, missions, a shop and
packs. It doesn't need many more systems. It needs the ones it has to land harder and to give
players reasons to come back.

Part 1 lists five ways to make play more fun. Part 2 designs how cards carry between runs so
players have reasons to build new decks.

---

## Part 1: Five ways to make it more fun

### 1. Big moments that feel big (built in v60)

- **Hit-stop:** a kill freezes the moment for 0.07 s with a white flash on the target (0.2 s for a
  boss), a WEAK hit for 0.045 s, a rune combo for 0.09 s. The tile flash also throws a spell light.
- **Hit chain:** card hits that land within 1.5 s of each other build a chain. From 3 hits a
  "×N chain" counter grows under the top bar. A chain of 5 or more bursts when it ends ("CHAIN ×N!"),
  with a freeze, a shake, a camera swing and Soul charge (4 per hit); 8 or more also powers you up
  for 3 s. Wand shots don't count.
- **Boss phases as events:** at 2/3 and 1/3 health the moment freezes for 0.3 s, the screen shakes,
  the camera swings and the arena's light turns toward the boss's colour (more at phase 3).
- **Finishing blow (boss fights only):** the last kill of a boss fight plays in slow motion
  (quarter speed for 0.55 s) with "FINISH!", a ring and a camera swing. Ordinary fights end as before.

### Rare foes (built in v60)

Past floor 4, about 3% of encounters (rising to 5% deep down, never on a boss floor) are a single
rare foe instead. In the dungeon its group carries a ★ and wanders. Rare foes are tougher than a
miniboss and short of a boss, shimmer gold, keep their own element, and each has a trait:

| Rare foe | Element | Trait |
|---|---|---|
| Gilded Scarab | Light | Runs off with its loot after 30 s of fighting |
| Prism Ram | Storm | Shields itself every 10 s |
| Void Lantern | Shadow | Vanishes and reappears when hit hard |
| Rimeborn Matron | Frost | Calls frost mites at half health |
| Cinder Champion | Fire | Enrages at 40% health (attacks 30% faster) |
| Old Mossback | Verdant | Regrows 1% of its health every second |

When one falls it drops a rare card, a second card that is legendary 40% of the time, boss-grade
gear, a sealed pack, triple gold and 40 + 4 per depth shards. One that gets away drops nothing.

### 2. Every run its own story (run-shaping choices)

Decided 15 Oct: boons and risk doors were set aside. Runs get their story from the dungeon itself
instead: see Part 3 (the path map, falls, the stirring dark, and new rooms and puzzles).
The original idea is kept below for reference.

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

### 5. Each area plays differently (built in v59, battle side)

Each area has one signature rule on its battle board (`game/arearules.js`). It is announced when a
fight starts and shown on the camp screen.

| Area | Rule |
|---|---|
| Glowworm Hollows | 2 glowing crystals grow on your side. Stand on one for 0.6 s and your next card hits 50% harder; a new crystal grows 7 s later. |
| Frozen Deeps | Extra ice on the enemy side. A pushed or pulled enemy slides until it hits something, and slams harder the further it slid. |
| Storm Vault | Every 5 to 7.5 s lightning marks a tile (often one someone stands on). 1.6 s later it strikes whoever is there, you or an enemy (enemies take 60% more and are stunned). |
| Ember Rifts | Every 7 to 9 s a tile near the edge of each side glows, then turns to lava; up to 5 per side. |
| Gilded Ruins | 4 gold tiles on the enemy side. An enemy that dies on one drops 10 + 3 per depth extra gold. |
| The Abyss | 3 void tiles on each side flicker: solid, a warning flash, then gone for 1.8 s. Whoever is on one falls (you lose 12% of your health; enemies lose 25%, bosses 6%) and climbs out on the nearest free tile. |

Still to do: a dungeon version of each rule.

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

---

## Part 3: The dungeon plan

Decided 15 Oct. Every run should feel different because of the dungeon you move through.
Four rounds, one update each.

### Round 1: floors and flow (built in v66)

- **Bigger floors.** A floor is 68 × 68 cells (it was 48 × 48), about twice the area, with about
  20 rooms instead of 10, and the stairs down are at least 34 steps from the stairs up. Groups,
  traps and chests scale with it.
  - Walls are drawn in chunks and only once seen, so a big floor draws fewer triangles at the start
    than the old small floor did. Old save points (from the smaller floors) no longer load.
- **The path map.** At the stairs down you choose from 2 ways (floors 1–2) or 3 ways, each listing
  what its floor holds (merchant, sanctuary, puzzle, miniboss, vault, prisoner, stranger, cache,
  gauntlet, curse totem, locked rooms, shortcut gate):

  | Way | What it changes |
  |---|---|
  | The Worn Stair | The floor as it comes |
  | The Quiet Way | 60% of the foes, half the traps, 80% of the chests; no miniboss, gauntlet, totem or mimic |
  | The Perilous Way | 125% foes, all a tier tougher; a miniboss and a gauntlet; 130% chests |
  | The Gilded Way | A locked vault, a cache and more chests (160%), but 170% traps and a mimic |

  A floor you have been on is kept, so going back down needs no choice. The way to a boss floor is
  always the one way.
- **The stirring dark** (replaces the Executioner's bell). 75 s after you arrive, and every 40–55 s
  after, a new group comes out of the dark in a room out of sight and well away. Each wave raises
  the floor's threat by one, up to its cap (2 on early floors, up to 6 deep down; −1 on the Quiet
  Way, +1 on the Perilous Way). At the cap the waves keep coming but grow no worse, so you can stay
  and farm. Threat shows as ▲ N/cap on the dungeon screen; stirred foes carry a ▲N tag.
  - A tier makes each foe 18% tougher and 10% harder-hitting per tier, and pays 25% more XP and
    20% more gold per tier.
  - At most 3 stirred groups (plus one per two threat levels) roam at once.
- **Teleport runes** (from depth 2): a hidden trap that throws you to a random spot on the floor at
  least 12 cells away. It keeps glowing afterwards, so you can avoid it or use it again.
- **Deep falls.** Trapdoors (from depth 3) drop you 2 or 3 floors, never past a boss floor you
  have not beaten.
  - **Fallen Seal:** the stairs down where you land are sealed. The seal's **Wayshard** lies on the
    floor directly above, in a room a short walk (10 to 30 steps) from that floor's stairs down.
    Bring it back down and the seal breaks (with XP).
  - **Lost Satchel:** your satchel stays on the floor you fell from, holding gold (60 + 22 per
    depth), shards (8 + 2 per depth) and sometimes a sealed pack. Climbing back for it is optional.
  - The dungeon screen shows ⛓ Sealed, ◆ Wayshard and 🎒 D<depth> while they apply.

### Round 2: special rooms (built in v67)

From depth 2, every 2 to 3 floors (never a boss floor or a hidden branch) a floor holds a special
room, and 1 time in 4 two. The path map shows them before you choose a way (`game/rooms.js`).

| Room | What happens |
|---|---|
| 🥚 Monster nest | 3 egg sacs (3 hits each). While one stands, a group of 1–2 foes hatches every 20 s (at most 3 out at once): farm it, or smash every sac for XP and a rich chest. |
| 🌀 Teleporter hub | 3 pads, each with a pad back: two go to other rooms, the gold one into the floor's secret closet. Step off a pad before it works again. |
| 🕳 Pit room | A marked drop: jump and fall 2 floors (never past an unbeaten boss), with a rich chest (sometimes legendary) beside you at the bottom. The Fallen Seal rules apply. |
| 🏛 Collapsing treasury | A rich chest, 3 piles of gold and a piece of gear. Take anything and the ceiling falls for 14 s: stones hit you while inside, and at the end you are buried (25% of your health) and what is left is lost. |
| 🪞 Mirror room | Touch the glass and your reflection fights you: a miniboss with a deck of your deck's colour. Beat it for a rare card of your colour, gold and XP. |
| 🎲 Gambler's den | Dice for 3 stakes (higher roll doubles your bet, a tie returns it), or a blind card draw (4% legendary, 16% rare). 6 games per gambler. |
| ⚒ Forge | Temper one piece of gear you wear: +1 level, free, once. |
| ⚖ Shrine of trade | Give one spare card (one no deck needs) and get a random card one rarity higher, once. |
| 🔥 Wounded adventurer | Rest by their fire (heal 35%, once), buy 2 Healing Draughts, or hire them (gold, or a Healing Draught) to fight beside you in your next 3 fights, shooting a foe every 3.5 s. |
| 👻 Haunted chapel | A ghost asks you to bring back its bones, which lie in a far room of the floor. Return them for a rich reward and a tale. |

Safe rooms (the den, forge, shrine, camp and chapel) keep monsters out.

### Round 3: exploration rooms

Flooded room, dark room, collapsed bridge, overgrown library, crystal cave.

### Round 4: puzzles

Pressure path, braziers, echo bells, sliding ice, weight scales, shifting rooms, memory tiles,
guardian riddle, and three of yours:

- **Switch circuit:** 4 to 6 switches around the whole floor, pulled in the order a clue gives,
  open a sealed room. A wrong switch resets them with a clang that draws foes.
- **The ghost's table:** bring 3 element items found around the floor (in chests, behind secrets,
  carried by foes) back to a table and a rare ghost rises. The 3 elements returned decide which of
  20 rare artifacts it drops.
- **Cursed find:** picking up a cursed item by surprise fills one of your three card slots with a
  bad card in every fight on that floor and seals the stairs down, until you cleanse at an altar
  placed far away.

Rare rooms appear every 2 to 3 floors. Colour locks were dropped.
