# Hexmancers: where we are

Date: 2026-10-21 · Latest build: **v99** (`hexmancers-itch-v99.zip`) · Branch `claude/hopeful-hypatia-stzuj0`, merged to `main`

This is a snapshot of the game: what is in it, what changed recently, what we plan next, and what
is still open. The design reasoning behind each feature is in [fun-roadmap.md](fun-roadmap.md).

---

## 1. The game today

Hexmancers is a browser card roguelike for itch.io, built for phones first. It is plain
JavaScript with three.js (r128) and has no build step.

### The loop

1. **Camp:** build decks, buy and open packs, take contracts, check the bestiary, gear up.
2. **Dungeon:** explore a 3D floor with secrets, traps, special rooms and puzzles, then find the
   stairs down.
3. **Battle:** a real-time fight on a hex board. You queue 3 cards and cast them, shoot your wand,
   dodge telegraphs and counter attacks.
4. Bring what you found back to camp. Cards stay in your collection between runs.

### What is built

| Area | What's in it |
|---|---|
| **World** | 6 areas of 4 floors each (Glowworm Hollows, Frozen Deeps, Storm Vault, Ember Rifts, Gilded Ruins, The Abyss). Each area ends in a boss floor and has its own battle rule (v59). |
| **Character** | 8 races, man or woman, stat dials (STR, DEX, CON, INT and more), levels, and gear (head, body, arms, weapon, off hand, rings). |
| **Cards** | A collection of 1,949 cards in 8 colours (**frozen at 2,000**: 51 slots left, after that a new card must replace one), 5 deck slots and a deck builder. Combos are copies, Flush, Straight, Rune Run, Rune Set and secret recipes. Instants, aces and the wild rune ✱. |
| **Battle** | Real-time hex board in 3D (sprites, lights, spell effects, camera moves). Telegraphs, attack bars, counters, perfect dodges, a combo gauge, elemental weaknesses, minibosses, rare foes and 18 bosses. |
| **Reading enemies (v70)** | Each enemy's tile has an attack bar that fills counter-clockwise and flashes twice before it casts. Each kind of move has its own tell. Countering during the flash and perfect dodges are rewarded. The Bestiary records creatures as you fight them. |
| **Collecting (v58)** | Contracts on the bounty board, area affinities with elemental enemy variants, shards and crafting (breaking cards is manual), and colour mastery with set rewards. |
| **Dungeon flow (v66)** | Floors twice the size, and a path map at the stairs (Worn Stair / quiet / peril / treasure). The *stirring dark* sends spawns that grow harder over time up to a cap per floor. Teleport traps and trapdoors. Deep falls of 2 or 3 floors, with a Wayshard to fetch from above and a Lost Satchel. |
| **Special rooms (v67, v68)** | 15 rare rooms every 2 to 3 floors: nest, teleport hub, pit, treasury, mirror, gambler, forge, trade table, camp, chapel, flooded hall, dark room, bridge, library, crystal geode. |
| **Puzzles (v69)** | 14 puzzle kinds, a puzzle room on 60% of floors. Plus your three: the switch circuit vault, the ghost's table (20 elemental artifacts), and the cursed idol with its cleansing altar. |
| **Shop and packs** | Madame Oriel's shop: packs by colour or booster, selling cards, pack opening. |
| **Saving** | Save points, plus a full-floor save in the run (v2 format). |
| **Settings** | Phone and tablet layouts, text size, orientation, full screen, sound, cast-card style, 4 touch movement modes, dungeon tips, and rebindable keyboard controls. |
| **Debug menu** | Lighting, PBR, normal maps, baked AO and SSAO, haze, a full battle camera (angle, field of view, zoom, move and rotate on X/Y/Z), depth of field, wall see-through, frame rate, auto quality, pause. |

### Recent changes (v71 to v84)

| Build | Change |
|---|---|
| v71 | New font, **Jersey 15**, so 3, 5 and 8 (and B and G) are easy to tell apart. One back button style on every full screen and one ✕ on every window, both drawn as pixel shapes. |
| v72 | Settings goes back with the ← button. The battle camera can move and rotate on X/Y/Z. Field of view works without an angle set. Depth of field added. |
| v73 | Floor effects (tile glow, telegraphs, decals) can no longer draw over a faded character. The default battle camera is now Angle 36, Lens 61, Zoom 1.1. |
| v74 | The depth-of-field blur fades in smoothly. New sliders: blur fade, near blur, far blur. Focus dials 25 tiles forward or back. |
| v75 | **Crash fix:** pushing into the wall beside the stairs could bounce you up and down floors until the screen went black. Stairs you arrive on now wait until you walk clear, and old floors are fully freed from graphics memory. |
| v76 | **Stirring dark rebalanced:** no waves until every enemy the floor started with is dead (bosses, minibosses and dormant guardians don't count). Then a wave every 90 to 120 s (180 s once the floor is at its worst), 1 to 3 enemies a wave, at most 2 stirred groups alive (3 from depth 16), hunting only from threat 4. Killing a stirred group holds the next wave back 45 s. |
| v77 | **Wall shapes.** Walls used to go only straight up your lane. Ten new ward cards build other shapes: **Rampart** (across the lanes in front of you), **Arc** (a half-ring around you, open behind), **Corridor** (up the lanes on both sides of you) and the rare **Cage** (aimed at an enemy: it can't move for 4 s and its shots hit the bars, while yours pass through). The older wall cards are unchanged. |
| v78 | **Creature rules and the Card lab** (step 1 of the [card rules plan](card-rules-plan.md)). A creature card can now be built from five parts: 24 behaviours (the old shooter, bomber, healer and guardian plus Pierce, Twin, Diagonals, Zigzag, Cone, Snipe, Chain, Beam, Burrow, Barrage, Blast, Cross, Pounce, Trample, a dodgeable Dash, Mends, Shields, Guards, Taunt, Summoner, Ward-maker and Empower), 5 HP tiers, 4 speeds, a colour keyword and one of 41 colour traits (`game/creatures.js`). No card in the collection uses them yet: that is step 2. The **Card lab** builds any mix and tries it in a test battle with no rewards; its front-page button shows only when *Show Card lab* is ticked in the debug menu (saved per browser). |
| v79 | **15 new strike shapes and 4 riders** (`game/strikes.js`): Twin, Fan, Spear, Boomerang, Machine gun, Wave, Burst, Chain, Ricochet, Snipe, Shockwave (4 tiles around you), Column, Delayed mark, Cluster bomb (ring, +, X, fan or scatter) and Proximity mine (set off by an enemy stepping on or next to it, or by your shot). Riders on any strike: Pierce, Crit, Recoil (+30% power, throws you back a tile) and Reaper (a kill fills the Spell gauge). Each has its cast preview. The Card lab gets a Strike tab. Step 1 of the card rules plan is done; no collection card uses the new parts until step 2. |
| v91 | **Fix: Fire and Cast buttons lost after leaving the browser mid-fight.** Coming back from the background now lays out the whole screen again (now, after 0.25s and after 1s, and on a page restored from the browser's cache), not just the board, and drops a held Fire charge. A safety check once a second during a fight lays the screen out again if the Cast button is ever off screen or squashed. |
| v92 | **Rune Surge counts the slots, not the hand.** 3 queued cards of one rune (✱ fits any) open a 4th slot, and only a card of that rune (or a ✱) fits it; 3 queued cards of a 4-card recipe open it for the recipe's last card. Gear's surge chance still opens it for any card. Cards that don't fit the open 4th slot are dimmed, the empty slot says what fits, and the banner and Combo rules say so. Combo rules now say Rune Set is wand ×1.8. |
| v93 | **Walk and strike at the same time on the keyboard.** Holding a move key now keeps walking tile after tile until you let go (before, a held key moved one tile, and the browser's key repeat stops as soon as Fire or Cast is pressed). The last direction pressed wins; leaving the window stops it. Touch was checked too: walking with one finger while tapping or holding Fire, or tapping Cast, with the other keeps the mage moving. |
| v94 | **Dungeon lighting and Search.** Floor stains, puddles and glowing pools now sit under the darkness, so they no longer show in places you haven't found. The chasm only shows faintly right behind walls you've seen, and never beside unfound ground (it used to outline rooms still in the dark). Only lit rooms have torches and glowing walls, and a lit room lights up in full the moment you step into its doorway; a room with no lights is found by walking it with your own light. A room with a burning brazier counts as lit. Search plays its wave the moment you press it and reports in 0.35s (was 1.1s before anything showed). |
| v95 | **Black can freeze, and the Rune Set is wand ×2.5 again.** 8 Black cards gain the freeze keyword so Black's Shatter creatures have frozen targets: Bone Splinter, Bone Darts, Crow Feathers, Bag of Teeth, Skull Bomb, Ossuary Urn, Reaper's Scythe and Rusted Mantrap. The Rune Set combo has its own buff (wand ×2.5, shown as ᚱ in the buff line), apart from Power boons, which stay ×1.8. |
| v96 | **Fix: reward pictures spilling out of their box.** On the Victory screen, a gear, gold or XP reward keeps a card's size: its picture now sits at the top at a fixed size (a long spear used to stick out of the top), and long text is cut to 4 lines. New gear reads "Unworn: may be enchanted or cursed". |
| v97 | **Fix: dungeon froze with Search stuck on "Working…".** The dungeon's frame loop now asks for its next frame first and runs each part (moving, monsters, props, doors, drawing) on its own guard, so an error in one frame can't stop the dungeon for good; a search or disarm also finishes after 5 seconds whatever happens. The cause of the reported error wasn't reproduced (a hidden door by the map's edge, searched from its doorway); errors now go to the browser console as "dungeon:". Also: past the edge of the map the darkness carries on, so a room by the edge no longer opens onto a bright chasm. |
| v98 | **Dungeon view: haze, remembered rooms, doors, and camera controls.** The dungeon no longer uses the battle's haze (it started 20 units from the camera, but the phone camera sits about 29 away, so even your own tile was hazed); its haze now starts 6 tiles past you. A lit room you have found stays at 70% brightness out of sight (other explored ground 35%, was 24%), and its torches and crystals keep burning. Doors on fading walls never drop below 75%, every doorway has a warm threshold glow, and doors are brighter on the minimap. New debug menu sections: Dungeon camera (angle, distance, lens, aim ahead, look-ahead) and Dungeon view (haze on/start/depth, remembered brightness, lights stay on, cut-down walls with stub height, door minimum, door glow). Camera defaults match the old view. |
| v99 | **Debug menu panes.** The debug menu's sections sit under a row of tabs, one pane at a time: Dungeon (camera, view, walls), Battle (camera, depth of field, arena walls), Lights, Surfaces (PBR, normal maps, AO) and General (pause, card lab, info). The last pane opened is remembered; dragging a slider still fades the menu to just that row. |
| v90 | **Run balance from the full-run playtest** ([playtest-v86-v89.md](playtest-v86-v89.md)). Fix: the Golem no longer crashes on a colourless wand before it picks a colour. One enemy hit takes at most 45% of your HP. From depth 12, enemies attack up to 35% faster. Packs cost 130 / 90 (were 90 / 60); battle gold and XP slow past depth 20; a normal fight gives a card 70% of the time (was 55%). HP-cost cards cost 5 + 0.6×rank (was 8 + rank). The Golem reflects 20% (was 35%). Charges +20% and rare/legendary strikes +20%. |
| v89 | **Balance pass from the six-tester playtest.** Wedge strikes reach a 4.5-tile cone (they missed from 2.6); a cone creature never takes the rear stance (Capybara now stands at the front). Water creatures re-dealt: 38% support, down from 66%. Charges +25% power, and Many-uses ones lose 15% per use instead of 30%. Pounce ×0.8 and every Gray creature hits 18% softer. Zombie infection lasts at least 6s and the first bite comes at once. Power boons (and the Rune Set combo) are wand ×1.8, down from ×2.5. The Golem reflects only what you cast or shoot; your creatures' hits are just resisted. Burning ground hits and sets alight the enemies on it when cast, and sets alight whatever steps on it; icy ground hits too; bramble damage counts as the card's. |
| v88 | **Shatter moves from Gray to Black and Water.** Gray can't freeze, so its 17 Shatter creatures now have Gray traits (Last stand, Loyal, Steadfast, Drilled, Veteran; Veteran Captain, Momotaro and Achilles also changed speed or stance to stay 2 parts apart). Shatter is now a Black trait as well as a Water one: 10 Black creatures (from Chilling and Overcharge) and 7 more Water creatures (from Soul Harvest) have it, 21 in all. The card dealer never gives Shatter to Gray. |
| v87 | **Pack and Drilled work for every colour.** Pack (+35% next to another creature) and Drilled (+12% for each other creature) only counted Water or Gray creatures, so the 18 Black, Green and Yellow creatures with them almost never got the bonus. Both now count creatures of the card's own colour (Water and Gray play the same as before). |
| v86 | **Every card dealt with the Bb colour weights.** All 1,576 set cards and the starter cards take new parts from the weights saved on the Colour Weights page (themes, effects, attacks, traps and card mix folded in); 22 cards changed kind toward each colour's card mix (only where the name fits); runes gather or spread with the Combos weight and are now written on each line. No two cards of one colour and kind are closer than 2 parts. |
| v85 | **Three new traps.** *Shock trap* (Yellow): the enemy that steps on it is held in place, and while it is held any other enemy that comes onto its field (Single: either side in its row, Plus: a + around it, Circle: all 6 tiles around it) is shocked and stunned (Tripwire Spark, Shocking Floor Tiles, Electrified Gold Idol). *Zombie trap* (Black): the enemy is infected for a few seconds and attacks the other enemies instead of you; alone, it just shambles; bosses shake it off in half the time (Open Grave, Rigged Coffin, Cursed Tomb). *Pendulum trap* (Brown, 4 new cards: Dwarven Pendulum Axe, Gnomish Clockwork Pendulum, Goblin Swinging Saw, Grand Pendulum Engine): a blade swings across the row or down the column after a short warning, hitting every enemy in its path; the others dodge about 1 in 3. Traps gain a *Spread* part; the new traps belong to their colour unless weighted in. Colour Weights page: an Effects tab (every status effect and attack style across kinds), a likeness check, and the new traps. |
| v84 | **The whole collection on the new rules, for good.** Lobs, wards, boons, charges, traps and ground cards now have parts too (fuse and aftermath; wall shapes, builds and effects such as burning, freezing, shocking, healing and draining; boon side effects by colour with Echo and Delayed timing; charge shots, uses and edges; triple traps; ground with a keyword). Strikes get a cast (Quick or Charged), and Gray creatures a stance (Front line, Rear guard or Escort). Every card's parts are written in the card files, and names are unchanged. `kinds.js` builds them, `allocate.js` is now a tool, and the on/off switch is gone. The 2-part rule now holds for all but 3 pairs of boons. The Card lab has Cast and Stance. [Stats](playtest-stats-allkinds-v84.md): 98% wins, no errors. Review sheet: `docs/card-list/new-rules-cards.csv`. |
| v83 | **The collection on the new card rules (step 2, first pass).** Every creature (723) and strike (231) now plays by the new rules: `allocate.js` gives each one parts from its name, old rule and colour (an archer snipes, a giant is Huge and Slow, a wall is a Ward-maker), and they are saved in `cardparts.js` (one editable line per card). The review sheet is `docs/card-list/new-rules-cards.csv`. Wards, boons and the other kinds are unchanged, and the cuts aren't made yet. `NEW_CARDS=false` in allocate.js brings the old rules back. [Stats](playtest-stats-newcards-v83.md): 98% wins, the same as the old cards. The 2-part rule can't hold for every strike or Gray creature with the current parts. |
| v82 | **A random 80-card start instead of starter decks.** A new character picks the colour their cards lean to (or 🎲 Surprise me) and gets 80 random cards: about 32 of that colour, 8 Gray, 8 Brown and the rest from 2–3 other colours; 64 commons, 12 uncommons and 4 rares, all rank 1–6. The lean colour's cards favour one home rune, so about 30% of hands can make a Flush and 10% a Straight. A 60-card first deck (with the colour's hero) is built from them, and the rest wait in the collection. The premade starter decks are kept for later (`USE_STARTERS` in ui.js, `STARTERS` in cards.js). [Stats](playtest-stats-deal-v82.md): 98% wins like the starters, but Gray summons deal half of all card damage. |
| v81 | **Deck tools go in a slot.** Search, Keep and Reshuffle cards are no longer tapped from the hand: put one in a slot on the hand screen, where it pulses with "Double-tap to use", and double-tap it there (one tap takes it back out). Using it shuts that slot for the rest of this hand; it opens again at the next hand. Reshuffle shuts it for 2 hands, and a card can say otherwise (`lock`). A tool left unused in a slot goes back to the hand when you press Fight!, and it is no part of a combo. Key U uses it. Also: [stats for Gray, Brown and Black decks and the search cards](playtest-stats-colors-v80.md). |
| v80 | **Flushes merge, and fixes and balance from the [v79 stats](playtest-stats-v79.md).** A Flush now merges its cards into one attack: all their power +25%, every effect they carried, in the shape of the first strike (Straights unchanged). When the deck runs out, used cards are shuffled back in. Enemy card hits grow less with depth; the Elder Treant's Root Nodes heal half as much. Diagonal shots bounce off the board's edges. Creature, trait and strike outliers retuned (Chain, Dash, Wave, Mark, Tidal, Overclock down; Diagonals, Zigzag, Burrow, Ricochet, Fan, Guardian, Loyal, bigger HP tiers up). 16 bugs fixed (Camouflage, Rises again, guards and shields, expiry effects, previews, mines, lab runes). The follow-up stat runs were cut short by a usage limit and still need doing. |

---

## 2. What we plan to do

These are agreed or proposed and waiting on a decision or a turn.

### Waiting on your decision

- **Hiding enemy patterns (reading enemies, option 3).** You didn't want the player to know which
  cards are coming. The proposal is:
  - hide the next-move icon over an enemy until you have learned that creature in the Bestiary;
  - clever enemies sometimes show a **fake intent**.
  - Other ways I offered were: showing only a danger level, or removing the icon entirely.
- **Battle and dungeon zoom.** The Zoom slider is shared, so the dungeon also starts at 1.1 now.
  This could be split into a separate battle zoom and dungeon zoom.

### Next features (from the roadmap)

| Feature | Notes |
|---|---|
| **Goals beyond a single run** (roadmap idea 4) | Collection book completion rewards, a daily seeded dungeon with a score, unlockable card backs (Arcane Weave and Starfield are already drawn). |
| **Battle sound effects** | The dungeon has sound effects; battles don't yet. |
| **Area rules in the dungeon** | Designed, on hold: [area-rules-dungeon.md](area-rules-dungeon.md). Rifts are fire vents, embers and a magma-belt puzzle; the Abyss is the forgetting dark and void watchers. |
| **Trading post** | The camp button exists but only says "coming soon": trading cards with other players. |
| **Polish and accessibility** (point 9) | Deferred until you call it. |

---

## 3. Outstanding

### To check

- **Black screen on the stairs:** the cause found is fixed in v75, but it couldn't be reproduced on
  the test machine. It needs checking on your phone.
- Values you set before on the debug sliders still override the new camera defaults. Use
  **Reset all** to pick up the new ones.

### Decided not to build

- Boon altars and risk doors (runs get their story from the dungeon instead).
- Colour locks.
- The Executioner (replaced by the stirring dark).
- Showing upcoming enemy moves on the Spell screen (it gave away too much).
- Pinch zoom.

---

## 4. How a round works

- Every change is committed, pushed to the branch and to `main`, and built into
  `hexmancers-itch-vN.zip`, which is sent with screenshots.
- Each feature has its own browser test (Playwright). The regression suites (battle 3D, reading,
  rooms, puzzles, dungeon, stairs, walking) run before each build.
- The roadmap doc and its artifact page are updated when a roadmap item lands.
