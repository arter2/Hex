# How battles work in Hexmancers

A guide for someone who has never played the game. It explains what a fight is, how a fight plays out, every system
that feeds into it, and what the screen has to show the player. It describes the game as of build v134.

---

## 1. The idea in one paragraph

Hexmancers is a card game played in **real time**. You are a mage standing on a board of hexagons, facing a group of
monsters across the middle. You never wait for your turn: you **move** to dodge their attacks and **shoot your wand**
the whole time. Every 10 seconds the **Spell timer** fills; you open the **Spell screen** (the fight pauses), choose
**up to 3 cards** from your hand to queue, and then **cast** them one by one in the fight. Cards are your big moves:
blasts, summoned creatures, walls, traps, heals, buffs. The fight ends when every enemy (in every wave) is down, or
when your HP reaches 0.

---

## 2. The board

- **12 × 7 hexes**, split down the middle.
  - **Your side:** the 6 columns nearest you.
  - **The enemy side:** the 6 columns across from you.
- **Rows ("lanes"):** many attacks travel straight down a row. Your wand shoots down the row you stand in, and so do
  many enemy shots. Choosing which row to stand in is most of the moment-to-moment play.
- **Your side:**
  - You can walk anywhere on your half, but not onto the enemy side.
  - Your creatures, walls and traps stand on your half.
- **The enemy side:** enemies move around their half and attack across.
- **Things on the board:** rocks (block shots), coloured ground (burning, frozen and so on), crystals and other
  objects from the area's rule (section 9), walls, traps, and claimed tiles (section 6).
- **The camera** looks down your row at the enemy, slightly from above. On a phone the board fills most of the
  screen.

---

## 3. One fight, step by step

1. **The fight starts.**
   - In the dungeon, how you met the group decides the opening (section 10).
   - The area's battle rule is announced (section 9).
   - The Spell screen opens straight away, so you can queue your first cards.
2. **You queue up to 3 cards** from a hand of 6 and press **Fight!**. The fight runs.
3. **You fight in real time:**
   - **Move** to stay out of attacks and to line up shots.
   - **Fire** your wand down your row (tap), or hold to charge a stronger shot.
   - **Cast** the queued cards, left to right, whenever you choose.
4. **Enemies attack on a timer** you can read (section 8). Each shows its next move as an icon, and a bar around its
   tile fills before it attacks.
5. **The Spell timer refills** (10 seconds). When it is full, the Spell button lights up. Open it to draw back up to 6
   cards and queue again. Cards you queued but did not cast go back into your hand.
6. **Waves:** some fights have 2 or 3 waves. When one wave falls, the next one walks in.
7. **The end:**
   - **Win:** gold, XP, maybe cards or gear.
   - **Lose (HP 0):** you lose gold and go back.
   - **Run** (from the Spell screen; not from bosses): you escape by dropping gold or a card.

---

## 4. You: HP, moving, the wand

### HP
- You start at 120 HP. Gear and your character's stats add to it.
- In the dungeon, the HP you leave a fight with is the HP you carry on with.

### Moving
- **On a phone:**
  - Tap a tile on your side to walk there.
  - Or touch, then hold or slide: a joystick appears where your thumb lands, and you steer.
- **On a keyboard:** the arrow keys or WASD.
- **Walking feels smooth:**
  - Your mage glides between tiles.
  - The tile you stand on for hits is always the nearest one.
  - When you let go, a soft magnet settles you onto a tile.
- **A quick flick** of the joystick throws you one tile that way: a dodge.
- **A Perfect Dodge:** step out of an attack in the last 0.4 s before it lands. You get a white flash, a short
  slow-down, and 15% of the Spell timer as a reward.

### The wand (Fire)
- **Tap Fire:** a quick shot down your row (3 damage with the basic wand, a short cooldown).
- **Hold Fire:** charge a stronger shot (7), then let go to fire it.
- **Your weapon changes it.** A staff fires slower shots that pierce. A bow's arrows pierce, and its charged shot
  is a volley down 3 rows.
- **Wand shots are steady chip damage,** the thing you do between cards. Boons can make the wand much stronger for a
  few seconds (×1.8, ×2.5).

---

## 5. Cards, the deck and the Spell screen

### The deck
- **Size:** 45 to 60 cards, at most 4 copies of a card (1 of a legendary), and one hero.
- **Drawing:**
  - Each time the Spell screen opens you draw up to **6 cards** in hand.
  - An empty queue slot draws 1 extra card next time.
- **When the deck runs low,** your used cards are shuffled back in under it. Spent Charge cards stay out.
- **If you have no cards at all,** you fight with the wand only.

### The Spell timer and the Spell screen
- **The Spell timer** fills over **10 seconds** of fighting. Some gear, heroes, cards and Perfect Dodges fill it
  faster.
- **When it is full, the Spell button lights up.** Tapping it opens the **Spell screen**, and the fight **pauses**.
- **On the Spell screen:**
  - **Queue up to 3 cards** into the slots, by tapping or dragging. A **Rune Surge** (4 or more cards of one rune in
    hand) opens a 4th slot.
  - **See the combo** your queue makes (section 7).
  - **Use instants and deck tools** straight from your hand (draw more cards, search the deck, keep cards).
  - **Fight!** goes back to the fight; **Run** escapes.
- **Timing:** a "turn" is one trip to the Spell screen. Things cards leave behind (walls, creatures, shields) last a
  set time of fighting, about 10 seconds per "turn" written on the card. Their clock stops while the Spell screen is
  open.

### Casting
- **Cast** fires the first card in the queue, then the next, left to right. Each cast has a short cooldown (about
  0.45 s, quicker with Haste).
- **Lobs** land where you aim: tap the enemy side to aim. If you have not aimed, they land on the nearest enemy.
- **Instants** can be tapped straight from the row above your queue during the fight, with no Spell screen needed.
- **Charge cards** have a number of uses (for example 3/20). Each cast uses one up; a card that runs out
  **burns up** after the fight. The card shows its uses left (white, then yellow, then red) and warns you at its
  last charge. You can recharge cards at the camp shop.

### Card types (about 2,000 cards in all)

| Type | What it does | Example |
|---|---|---|
| **Strike** | Damage now, in a shape: down your row, a spear, a wedge, every enemy, the weakest, missiles… | Ember Dart: 25 to the enemy with the least HP |
| **Lob** | Lands on the tile you aim, over blockers, after a short fuse | Fire Pot: 20 in a cross |
| **Summon** | A creature that stands on your side and fights for a while | Red Dragon Whelp: burns its whole row |
| **Machine / Sentry** | A turret that fires on its own for a while | Brazier: zigzag shots, every 3rd one doubled |
| **Ward** | Walls in front of you that block shots | Ember Wall: 2 walls of 28 HP |
| **Boon** | A buff for you: wand power, heals, haste… | Kindle: wand ×1.8 for 5 s |
| **Trap** | Set on a tile; goes off when an enemy steps on it | Landmine |
| **Environment** | Changes the ground: lava, ice, poison | Lava Field |
| **Claim** | Takes the enemy's front tiles for 20–30 s: you can walk there | Rising Tide |
| **Hero** | Calls a hero for 30 s who fights and powers you up (one at a time) | Pyra: fireballs, and your hits +30% |
| **Charge** | A card with a few uses | Powder Horn: 2 uses |
| **Instant / Utility / Tinker** | Tap to use now: heals, draw cards, power a card up for the fight | Whetstone: +30% to one card |
| **Ace / Ace-up** | An Ace loads into your Sidearm for you to fire when you choose; Ace-ups make it stronger | Phoenix Arrow: 75 down your row |
| **Equip** | Gives your strongest creature a weapon | Dwarven War Axe: +40% |

### What is on a card
- **Colour:**
  - one of the six elements: fire, frost, storm, verdant, light, shadow;
  - or **gray** (soldiers, stances, veterans);
  - or **brown** (tools, instants, tinkering).
- **Rune:** a letter **A to F**. The wild rune **✱** counts as any rune. Runes drive the combos.
- **Rank** (its strength step) and **rarity** (common, uncommon, rare, legendary).
- **Keywords:** burn, freeze, stun, slow, poison, curse, drain, mend, confuse, push, pull, valor.
- **Cast speed:** quick (your next card comes sooner), steady, or charged (it winds up first).

---

## 6. Things that stay on the board
- **Creatures** (summons, machines, sentries) fight on their own for a set time and can be killed. Gray creatures take
  a **stance**: front, rear or escort.
- **Walls** block shots until they break or time out.
- **Traps** wait for an enemy to step on them.
- **Claimed land:** the enemy's front tiles become yours for a while. You can walk there, and enemies on them are
  pushed back.
- **The Sidearm** holds one loaded **Ace**, ready to fire when you choose.

---

## 7. Combos (what you queue together)

The Spell screen reads your queue and shows its combo before you press Fight!:

| Combo | How to make it | What it does |
|---|---|---|
| **Double / Triple** | 2 or 3 copies of the same card | One cast at ×1.5 / ×2 power |
| **Flush** | 3+ different cards, same colour, same rune | Merged into **one** big attack: all their power +25%, every effect |
| **Straight** | 3 ranks in a row, same rune (4 = Grand Straight) | Cast as one chain with a finisher |
| **Rune Set** | Every queued card has the same rune | Wand ×2.5 for 5 s (8 s with 4 cards) |
| **Rune Run** | Runes going up the alphabet left to right (A-B-C) | Haste + Courage (cards and wand +30%) for 8 s (12 s with 4) |
| **Recipe** | An exact set of secret cards | They fuse into a named, special card |
| **Brood** | 2+ Brood creatures | Stronger together; 4 become the Elder Grovebeast |

**The hit chain:**
- Card hits that land within 1.5 s of each other build a chain, with a counter in the middle of the screen from 3
  hits.
- A chain of 5 or more bursts when it ends.
- A chain of 8 or more also powers you up for 3 s.
- Wand shots don't count.

---

## 8. Enemies and how to read them

### The attack bar
- The outline of the tile under each enemy **fills counter-clockwise** as its next attack comes.
- When it is full it **flashes twice**, then the attack goes.

### The intent icon
- Over each enemy is an icon for its **next move**:
  - ➶ shot, ➤ rush, ◎ snipe, ❄ ice slam, 💣 bomb;
  - ✚ heal, 🛡 guard, ☠ summon, ⚠ quake;
  - ♨ fire lane, ▦ stone wall, ⛓ drag;
  - and more.
- Each enemy repeats a short, learnable **rhythm** of moves. For example, a Thunder Ram goes shot, shot, rush.

### Tells
- Each kind of attack marks the board its own way:
  - a rush sweeps chevrons down the row;
  - a snipe draws a laser;
  - a quake cracks the ground.
- The warning comes about 1 to 1.6 seconds before the hit (the bots measure this: no hit gives under 0.4 s).

### Counter Hit
- A card that lands **while the bar flashes** (or while the enemy winds up or casts) is a Counter Hit:
  **double damage, a stun, and its attack is cancelled.**

### Elements
- Each element **beats** one other: fire → verdant → storm → frost → shadow → light → fire.
- **Against enemies:**
  - A hit of the right colour does more.
  - Each enemy has a weakness and a resistance. They show as **"?"** until you have beaten 3 of that kind (1 of a
    boss); the Bestiary records them.
- **Against you:** your deck's element is the colour that makes up at least 40% of it. Enemies of the colour that
  beats yours hit you **30% harder**, and ones yours beats hit you **20% softer**.
- **Reactions:**
  - A coloured hit leaves its element on the enemy for 6 s, and stains the ground under it.
  - Hitting it with a partner colour sets the pair off:

| Pair | Reaction |
|---|---|
| fire + frost | **Shatter**: a big burst |
| frost + storm | **Conduct**: arcs to nearby enemies and stuns them |
| fire + verdant | **Wildfire**: burns it, its neighbours and the ground |
| light + shadow | **Eclipse**: pierces barriers and curses |
| storm + verdant | **Thornbind**: roots it, a long stun |
| frost + verdant | **Rimebind**: freezes it and everything next to it |

### Squads and roles
Enemies come in squads with roles:
- **Tank:** stands in front and guards.
- **Striker:** big telegraphed hits.
- **Controller:** pins you and reshapes the board.
- **Support:** heals and blesses.
- **Skirmisher:** fast, from odd angles.

They work together:
- **Crossfire:** when you are pinned, the strikers aim at you.
- **Flank:** two skirmishers attack from the rows above and below you.
- **Shield wall:** a tank steps in front of a hurt ally.

At half HP, each enemy has a **phase**:
- strikers enrage;
- tanks harden;
- supports call help;
- skirmishers slip back and heal;
- controllers reshape the board.

### Elites and bosses
- **Elites** (from depth 5) carry an affix: Shielded, Hasty, Vampiric, Splitting, Thorned or Volatile. They have a
  coloured ring and pay more.
- **Minibosses, rare foes and 18 bosses** have their own moves. A boss guards each area's last floor.

### Danger grows with depth
The bots tune fights so that an ordinary dungeon fight costs:
- about 5% of your HP early on;
- about 10% in the middle;
- 15–25% deep down.

---

## 9. Each area's battle rule

| Area | Rule |
|---|---|
| Glowworm Hollows | **Glow crystals** grow on your side: stand on one a moment and your next card hits 50% harder |
| Frozen Deeps | **Black ice** on the enemy side: a pushed or pulled enemy slides until it hits something |
| Storm Vault | **Storm strikes:** lightning marks a tile, then strikes whoever stands on it (lure enemies on) |
| Ember Rifts | **Rising lava** creeps in from the edges of both sides as the fight goes on |
| Gilded Ruins | **Gilded floor:** an enemy that falls on a gold tile drops extra gold |
| The Abyss | **Void tiles** flicker out; whoever stands on one when it vanishes falls and is hurt |

---

## 10. Fights in the dungeon

- **How it starts:**
  - **First Strike:** you hit the group on the map first. Every enemy takes 15% of its HP and is stunned for 2 s.
  - **Ambush:** they were asleep or unaware. They are slow to react.
  - **Surprised:** they caught you. They attack almost at once.
- **Your HP carries over** from the map and back to it.
- **Running away:** from the Spell screen, by dropping some gold or a spare card. Not from bosses.
- **Losing:**
  - You drop part of your gold where you fell.
  - A sanctuary's blessing can pull you back to the stairs instead, at half the gold lost.

**Battle mode** (from the menu) is fight after fight, with deck building and packs in between. Its waves use the same
squads and rules, with a gentler damage ramp.

---

## 11. What the UI must show

What a player needs to see or reach at each moment of a fight, and why. How it looks can change; these needs should
not.

### 11.1 Always visible during the fight

| Element | Why | Notes |
|---|---|---|
| **Your HP** (bar and numbers) | The most important number | Green, red when low (30% or less). Numbers like 188 / 205 |
| **Spell timer → Spell button** | Tells you when you can queue cards; the main action | A bar that fills over 10 s; when full it **must** be big, easy to hit, glowing and pulsing. Centred. |
| **Pause** | Stop the game, settings, quit | Clear icon, out of the way of the thumbs |
| **Depth and wave** | Where you are, how many waves are left | Short: D5 · W1/2 (the area name on a long press) |
| **Your status effects** | Shields, haste, courage, rooted, hexed… with time left | Icon + seconds. Must not move the board when they come and go |
| **Deck and hand counts** | How many cards are left | Near the queue: DECK 54 ◆ HAND 3 |
| **The queue** (3 slots, 4 with a Surge) | What Cast will do next | Each slot shows the card's name and type icon; the next card is highlighted |
| **The combo** | What your queue adds up to | A line under the queue: "Rune Run A-B-C" |
| **Fire** | The wand: tap, or hold to charge | Big, in reach of the thumb; shows charging |
| **Cast** | Casts the next queued card | Big, in reach of the thumb; shows the next card's name; dim when the queue is empty |
| **Instants row** (when you hold instants) | Tap-to-use cards mid-fight | Above the queue |

### 11.2 On the board (in the scene)

| Element | Why |
|---|---|
| **Each enemy's attack bar** (tile outline filling, flashing twice) | When it will attack, and the Counter window |
| **Each enemy's intent icon** | What it will do next |
| **Each enemy's HP bar and name**, with weakness and resistance once known | Who to hit, with what colour |
| **Elite ring and affix; boss name** | Which enemy is dangerous |
| **Telegraphs** (marked tiles, chevrons, lasers, cracks) | Where an attack will land: the cue to move |
| **Elemental marks and stained ground** | Which reaction a hit will set off |
| **Your creatures, walls, traps, claimed tiles**, with their time or HP left | What is fighting for you, and for how long |
| **Lob aim reticle** | Where a lob will land |
| **The area's objects** (crystals, lightning marks, lava, gold tiles, void tiles) | The area's rule in play |
| **Floating numbers** (damage, heals, "COUNTER!", "Perfect!", "weak!") | Feedback that an action worked |
| **The hit chain counter** | The combo of card hits building up |
| **The cast ribbon** (the card you just cast) | Which card went off |
| **Banners** (First Strike, Ambush, Wave 2, the area rule) | Big moments |

### 11.3 The Spell screen

| Element | Why |
|---|---|
| **Your hand** (up to 6 cards), each with name, type, colour, rune, power and **Charge uses left** | What you can queue |
| **The 3 slots** (4 with a Surge), drag or tap to fill | Your plan for the next 10 seconds |
| **Combo preview** ("No combo yet" / "Flush: Fire +25%") | What the order and choice will do |
| **Deck and discard counts** | What is left |
| **Fight!** | Back to the fight |
| **Run** (hidden when you can't run) | Escape, with its cost |
| **Combo rules** link | Learning the combos |
| **Instants and deck tools** usable from the hand | Draw, search, keep, power up |

### 11.4 Rules for the layout
- **Phones first.** Fire, Cast and the queue sit at the bottom, under the thumbs. The Spell button, when ready, must
  be big and easy to hit.
- **Keep clear of the notch or Dynamic Island and the home bar** (safe areas). Nothing you tap goes under them.
- **The board must not jump.** Status effects, banners and buttons appearing must not change the board's size.
- **Telegraphs win.** Nothing on the HUD should cover where an enemy attack will land.
- **Read at a glance:** HP, the Spell timer and the next queued card are the three things a player checks every
  second.
- **Landscape and desktop:**
  - The hand panel moves to the side.
  - Bars stop growing past a sensible width.
- **Settings:**
  - the top bar's look (Panel or Clear);
  - how a cast card shows (big, side or ribbon);
  - text size, layout, orientation;
  - rebindable keys.

### 11.5 Keyboard
- Arrows or WASD: move.
- Space: fire (hold to charge).
- Enter or X: cast.
- Q or Tab: aim.
- C: the Spell screen.
- Esc: pause.
- On the Spell screen:
  - 1–9 pick a card.
  - Backspace removes one.
  - Enter or Space starts the fight.

---

## 12. After the fight
- **Win:**
  - gold (more from elites, outlaws and gold tiles), XP and levels;
  - sometimes cards and gear;
  - the Bestiary learns the enemies you beat.
- **Charge cards** that ran out burn up, and the victory screen lists cards low on charges.
- **Lose:**
  - **battle mode:** 20% of your gold, back to camp;
  - **the dungeon:** see section 10.
