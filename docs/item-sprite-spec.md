# Hexmancers — item sprite sheet spec

Every item below still uses a small placeholder icon drawn by code. The 21 weapons already have finished sprites; match their look. **76 sprites in total.**

## Style (match the existing weapon sprites)

- **Look:** hand-painted pixel art. A dark 1px outline, soft shading lit from the top left, bright saturated highlights on gems and magic parts.
- **Background:** fully transparent (PNG alpha). No backdrop, no shadow plate, no frame.
- **Angle:** three-quarter view, slightly from above. Long items (staffs, keys, scrolls) run diagonally from the bottom left to the top right, like the weapons.
- **Readability:** the game shows icons at 32–48px on screen, so the silhouette must read at that size. One clear object per cell, no tiny text.
- **Color:** each item has an accent color (the table gives it). Use it for the magic or enchanted part (gem, trim, glow), not the whole object.
- **Legendaries:** they should look clearly rarer: more gold, a glow and a richer silhouette.

## Sheet layout

| Property | Value |
|---|---|
| Format | Lossless PNG, transparent background |
| Cell size | 160 × 160 px |
| Safe area | Keep the art inside the middle 144 × 144 px (an 8px empty margin on every side) |
| Grid | 8 columns × 10 rows, no gaps, no grid lines, no labels |
| Sheet size | 1280 × 1600 px |
| Order | Left to right, top to bottom, exactly in the cell numbers below. Leave unused cells transparent. |
| Pixels | Hard edges; no blur or smooth scaling |

Cell *n* (counting from 0) starts at x = (n mod 8) × 160, y = floor(n / 8) × 160.

Separate files are fine too: name each `<id>.png` (the id column), 160 × 160 px, with the same margin and transparency. Center the art in the cell; the game shows the whole cell, so off-center art will look off-center.

## The items

**Accent** is the color that marks the item's element or family in the game. **What it is** is what the item does in the game; **Draw** is what to draw.


### Body armor

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 0 | `cloth_shirt` | **Cloth Shirt** | Body armor (light). +10 max HP. | Neutral grey #b4b8c8 | A plain undyed linen tunic, short sleeves, a drawstring neck. The humblest starting clothes: patched, a little frayed at the hem. |
| 1 | `padded_robe` | **Padded Robe** | Body armor (light). +20 max HP. | Neutral grey #b4b8c8 | A thick quilted grey robe with visible stitched padding in rows, a rope belt. Practical, warm, unmagical. |
| 2 | `apprentice_robes` | **Apprentice Robes** | Body armor (light). charges 15% faster, +5 max HP. | Light #fff0b3 | A student wizard's robe in pale cream with gold trim at the cuffs and hem, a simple sash. Clean and new. |
| 3 | `ember_robes` | **Robes of Embers** | Body armor (light). charges 15% faster, +10 max HP, fire cards +10%. | Fire #ff6a3d | A flowing red-orange robe whose hem is stitched with flame shapes; the trim glows like coals. Fire wizard's gear. |
| 4 | `frost_robes` | **Robes of Frost** | Body armor (light). charges 15% faster, +10 max HP, frost cards +10%. | Frost #6fd6ff | An ice-blue robe with white fur at the collar and snowflake embroidery; frost crystals catch on the hem. |
| 5 | `warded_cloak` | **Warded Cloak** | Body armor (light). 30 shield each fight. | Light #fff0b3 | A hooded traveling cloak in soft gold-white, its edge stitched with protective runes that glow faintly. Reads as 'shield'. |
| 6 | `leather_armor` | **Leather Armor** | Body armor (medium). +25 max HP, take 10% less damage. | Verdant #6fdc7a | A brown leather cuirass with green-dyed straps and buckles, shoulder pads. Ranger/woodsman feel. |
| 7 | `thief_outfit` | **Black Thief Outfit** | Body armor (medium). +10 max HP, dodge 15% of hits, move 20% faster. | Shadow #e0588f | A close-fitting black outfit with a dark hood-scarf, many small pouches and belts, magenta lining. Stealthy and quick. |
| 8 | `runed_vest` | **Runed Vestments** | Body armor (medium). +30 max HP, 20 shield each fight. | Neutral brown #c08a55 | A sturdy brown leather vest covered in carved, softly glowing rune plates. Halfway between armor and spell-gear. |
| 9 | `iron_mail` | **Iron Mail** | Body armor (heavy). +30 max HP, take 15% less damage, cast 10% slower, move 15% slower. | Neutral brown #c08a55 | A chainmail shirt of dull iron rings with a leather collar. Heavy and plain. |
| 10 | `plate_armor` | **Plate Armor** | Body armor (heavy). +50 max HP, take 25% less damage, cast 15% slower, move 30% slower. | Neutral brown #c08a55 | A full steel breastplate with pauldrons and rivets, polished highlights. The heaviest armor: bulky silhouette. |
| 11 | `samurai_suit` | **Samurai Suit** | Body armor (heavy). +40 max HP, take 20% less damage, strikes back for 10, cast 10% slower, move 15% slower. | Fire #ff6a3d | Japanese-style lamellar armor: red-lacquered plates laced with cord, broad shoulder guards. Fire-red with black lacing. |
| 12 | `dragonscale` | **Dragonscale Coat** | Body armor (medium). +50 max HP, take 15% less damage. | Verdant #6fdc7a | A long coat made of overlapping green dragon scales with an iridescent sheen, a tooth or claw clasp. Rare-looking. |

### Head

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 13 | `leather_cap` | **Leather Cap** | Head. +10 max HP. | Verdant #6fdc7a | A simple brown leather skullcap with stitched seams and a small ear flap. Green-tinted leather. |
| 14 | `wizard_hat` | **Pointed Hat** | Head. charges 10% faster, +5 max HP. | Light #fff0b3 | The classic tall pointed wizard hat with a wide brim, cream/gold with a star or band. Slightly crooked tip. |
| 15 | `iron_helm` | **Iron Helm** | Head. +15 max HP, take 5% less damage, move 5% slower. | Neutral brown #c08a55 | A rounded iron helmet with a nose guard and riveted band. Plain soldier's helm. |
| 16 | `kabuto` | **Kabuto** | Head. +20 max HP, take 8% less damage. | Fire #ff6a3d | A samurai helmet: flared neck guard of red-lacquered plates and a golden crest (horns/crescent) on the front. |
| 17 | `black_hood` | **Black Hood** | Head. +10 max HP, dodge 5% of hits. | Shadow #e0588f | A deep black cloth hood with a face scarf, shadowed opening, magenta inner lining showing at the edge. |

### Off-hand

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 18 | `buckler` | **Buckler** | Off-hand. blocks the first hit every 10 seconds. | Neutral grey #b4b8c8 | A small round hand shield: wood face, iron rim and a central boss. Grey/steel tones. |
| 19 | `tower_shield` | **Tower Shield** | Off-hand. take 10% less damage, blocks the first hit every 10 seconds, move 10% slower. | Neutral brown #c08a55 | A tall rectangular kite/tower shield of iron-banded wood, brown with a simple emblem. Big and heavy. |

### Arms

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 20 | `leather_bracers` | **Leather Bracers** | Arms. fires 11% faster. | Verdant #6fdc7a | A pair of laced leather arm guards, green-dyed with buckles. Show both bracers side by side. |
| 21 | `runed_bracers` | **Runed Bracers** | Arms. charged +2, charges 10% faster. | Light #fff0b3 | A pair of pale bracers inlaid with glowing gold-white runes. Spell-caster gear. |
| 22 | `shadow_wraps` | **Shadow Wraps** | Arms. fires 11% faster, dodge 5% of hits. | Shadow #e0588f | Black cloth hand-and-forearm wraps, loosely trailing ends, magenta glints. Assassin/monk feel. |
| 23 | `lacquered_bracers` | **Lacquered Bracers** | Arms. charged +3, take 3% less damage. | Fire #ff6a3d | A pair of red-lacquered armored bracers with gold edging (matches the Samurai Suit and Kabuto). |

### Rings

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 24 | `ring_embers` | **Ring of Embers** | Ring slot. shots burn 1s. | Fire #ff6a3d | A gold ring set with a glowing orange-red stone, tiny flame flicker above it. |
| 25 | `ring_frost` | **Ring of Frost** | Ring slot. charged shots freeze 0.4s. | Frost #6fd6ff | A silver ring set with a pale blue ice crystal, frost rime on the band. |
| 26 | `ring_vigor` | **Ring of Vigor** | Ring slot. +20 max HP. | Light #fff0b3 | A gold ring with a warm pale-yellow heart-shaped or round stone. Reads as 'health'. |
| 27 | `ring_regen` | **Ring of Regeneration** | Ring slot. heal 1 HP a second. | Verdant #6fdc7a | A ring of twisted living vine/wood with a green leaf or seed gem. Reads as 'healing over time'. |
| 28 | `ring_runes` | **Ring of Runes** | Ring slot. 10% chance of a 4th slot. | Shadow #e0588f | A dark ring engraved with glowing magenta runes around the band, a small black stone. |
| 29 | `ring_gold` | **Ring of Fortune** | Ring slot. +25% gold. | Neutral grey #b4b8c8 | A chunky gold signet ring with a coin or four-leaf emblem. Reads as 'more gold'. |

### Legendaries

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 30 | `dawn_aegis` | **Aegis of Dawn** | Off-hand. +40 max HP, 40 shield each fight, blocks the first hit every 10 seconds. | Light #fff0b3 | LEGENDARY. A radiant golden-white shield shaped like a rising sun: rays fanning from a glowing center, white enamel and gold. Should glow. |
| 31 | `night_shroud` | **Shroud of the Long Night** | Body armor (medium). +40 max HP, take 25% less damage, dodge 10% of hits. | Shadow #e0588f | LEGENDARY. A flowing black cloak dotted with tiny stars, a crescent-moon clasp, magenta-violet lining. Darkness made cloth. |
| 32 | `ring_dragon` | **Ring of the Dragon King** | Ring slot. shots burn 2s, +30 max HP, heal 1 HP a second. | Fire #ff6a3d | LEGENDARY. A heavy gold ring shaped like a dragon coiling around the finger, a blazing red-orange gem in its jaws. |

### Three-element trinkets

Twenty artifacts from the ghost's table, all worn in the ring slot. Each mixes three of the six elements. The first word of the name is the kind of object to draw; the three element words are its colors: Ember = fire, Rime = frost, Storm = storm, Thorn = verdant, Dawn = light, Dusk = shadow.

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 33 | `artifact_fire_frost_storm` | **Crown of Ember, Rime and Storm** | Ring slot. +8 max HP, fire cards +12%, frost cards +12%, storm cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Frost #6fd6ff, Storm #ffe24d | Draw a small ornate crown set with three small gems or inlays, one per element: fire / frost / storm. The object type must be the readable shape; the three colors tell them apart. |
| 34 | `artifact_fire_frost_verdant` | **Circlet of Ember, Rime and Thorn** | Ring slot. +8 max HP, fire cards +12%, frost cards +12%, verdant cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Frost #6fd6ff, Verdant #6fdc7a | Draw a thin metal circlet/headband set with three small gems or inlays, one per element: fire / frost / verdant. The object type must be the readable shape; the three colors tell them apart. |
| 35 | `artifact_fire_frost_light` | **Sigil of Ember, Rime and Dawn** | Ring slot. +8 max HP, fire cards +12%, frost cards +12%, light cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Frost #6fd6ff, Light #fff0b3 | Draw a flat engraved medallion stamped with a sigil set with three small gems or inlays, one per element: fire / frost / light. The object type must be the readable shape; the three colors tell them apart. |
| 36 | `artifact_fire_frost_shadow` | **Lantern of Ember, Rime and Dusk** | Ring slot. +8 max HP, fire cards +12%, frost cards +12%, shadow cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Frost #6fd6ff, Shadow #e0588f | Draw a tiny hanging lantern set with three small gems or inlays, one per element: fire / frost / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 37 | `artifact_fire_storm_verdant` | **Talisman of Ember, Storm and Thorn** | Ring slot. +8 max HP, fire cards +12%, storm cards +12%, verdant cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Storm #ffe24d, Verdant #6fdc7a | Draw a carved stone talisman on a cord set with three small gems or inlays, one per element: fire / storm / verdant. The object type must be the readable shape; the three colors tell them apart. |
| 38 | `artifact_fire_storm_light` | **Locket of Ember, Storm and Dawn** | Ring slot. +8 max HP, fire cards +12%, storm cards +12%, light cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Storm #ffe24d, Light #fff0b3 | Draw a hinged oval locket on a chain set with three small gems or inlays, one per element: fire / storm / light. The object type must be the readable shape; the three colors tell them apart. |
| 39 | `artifact_fire_storm_shadow` | **Seal of Ember, Storm and Dusk** | Ring slot. +8 max HP, fire cards +12%, storm cards +12%, shadow cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Storm #ffe24d, Shadow #e0588f | Draw a wax-seal stamp / seal ring set with three small gems or inlays, one per element: fire / storm / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 40 | `artifact_fire_verdant_light` | **Band of Ember, Thorn and Dawn** | Ring slot. +8 max HP, fire cards +12%, verdant cards +12%, light cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Verdant #6fdc7a, Light #fff0b3 | Draw a plain wide metal band ring set with three small gems or inlays, one per element: fire / verdant / light. The object type must be the readable shape; the three colors tell them apart. |
| 41 | `artifact_fire_verdant_shadow` | **Idol of Ember, Thorn and Dusk** | Ring slot. +8 max HP, fire cards +12%, verdant cards +12%, shadow cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Verdant #6fdc7a, Shadow #e0588f | Draw a tiny carved idol figurine set with three small gems or inlays, one per element: fire / verdant / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 42 | `artifact_fire_light_shadow` | **Reliquary of Ember, Dawn and Dusk** | Ring slot. +8 max HP, fire cards +12%, light cards +12%, shadow cards +12%. Found at the ghost’s table. | Fire #ff6a3d, Light #fff0b3, Shadow #e0588f | Draw a small ornate box/vial holding a relic set with three small gems or inlays, one per element: fire / light / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 43 | `artifact_frost_storm_verdant` | **Torc of Rime, Storm and Thorn** | Ring slot. +8 max HP, frost cards +12%, storm cards +12%, verdant cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Storm #ffe24d, Verdant #6fdc7a | Draw an open-ended twisted neck ring (Celtic torc) set with three small gems or inlays, one per element: frost / storm / verdant. The object type must be the readable shape; the three colors tell them apart. |
| 44 | `artifact_frost_storm_light` | **Brooch of Rime, Storm and Dawn** | Ring slot. +8 max HP, frost cards +12%, storm cards +12%, light cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Storm #ffe24d, Light #fff0b3 | Draw a round cloak brooch with a pin set with three small gems or inlays, one per element: frost / storm / light. The object type must be the readable shape; the three colors tell them apart. |
| 45 | `artifact_frost_storm_shadow` | **Charm of Rime, Storm and Dusk** | Ring slot. +8 max HP, frost cards +12%, storm cards +12%, shadow cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Storm #ffe24d, Shadow #e0588f | Draw a dangling charm on a short chain set with three small gems or inlays, one per element: frost / storm / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 46 | `artifact_frost_verdant_light` | **Amulet of Rime, Thorn and Dawn** | Ring slot. +8 max HP, frost cards +12%, verdant cards +12%, light cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Verdant #6fdc7a, Light #fff0b3 | Draw a pendant amulet on a chain set with three small gems or inlays, one per element: frost / verdant / light. The object type must be the readable shape; the three colors tell them apart. |
| 47 | `artifact_frost_verdant_shadow` | **Diadem of Rime, Thorn and Dusk** | Ring slot. +8 max HP, frost cards +12%, verdant cards +12%, shadow cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Verdant #6fdc7a, Shadow #e0588f | Draw a jeweled diadem (front-piece crown) set with three small gems or inlays, one per element: frost / verdant / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 48 | `artifact_frost_light_shadow` | **Orb of Rime, Dawn and Dusk** | Ring slot. +8 max HP, frost cards +12%, light cards +12%, shadow cards +12%. Found at the ghost’s table. | Frost #6fd6ff, Light #fff0b3, Shadow #e0588f | Draw a small glass orb on a stand set with three small gems or inlays, one per element: frost / light / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 49 | `artifact_storm_verdant_light` | **Signet of Storm, Thorn and Dawn** | Ring slot. +8 max HP, storm cards +12%, verdant cards +12%, light cards +12%. Found at the ghost’s table. | Storm #ffe24d, Verdant #6fdc7a, Light #fff0b3 | Draw a signet ring with a flat engraved face set with three small gems or inlays, one per element: storm / verdant / light. The object type must be the readable shape; the three colors tell them apart. |
| 50 | `artifact_storm_verdant_shadow` | **Coronet of Storm, Thorn and Dusk** | Ring slot. +8 max HP, storm cards +12%, verdant cards +12%, shadow cards +12%. Found at the ghost’s table. | Storm #ffe24d, Verdant #6fdc7a, Shadow #e0588f | Draw a low small coronet set with three small gems or inlays, one per element: storm / verdant / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 51 | `artifact_storm_light_shadow` | **Phylactery of Storm, Dawn and Dusk** | Ring slot. +8 max HP, storm cards +12%, light cards +12%, shadow cards +12%. Found at the ghost’s table. | Storm #ffe24d, Light #fff0b3, Shadow #e0588f | Draw a stoppered crystal phylactery vial set with three small gems or inlays, one per element: storm / light / shadow. The object type must be the readable shape; the three colors tell them apart. |
| 52 | `artifact_verdant_light_shadow` | **Mirror of Thorn, Dawn and Dusk** | Ring slot. +8 max HP, verdant cards +12%, light cards +12%, shadow cards +12%. Found at the ghost’s table. | Verdant #6fdc7a, Light #fff0b3, Shadow #e0588f | Draw a small hand mirror set with three small gems or inlays, one per element: verdant / light / shadow. The object type must be the readable shape; the three colors tell them apart. |

### Bag items

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 53 | `draught` | **Healing Draught** | Consumable. Restores 40% of your HP. | #ff5d6c | A round glass flask of red healing liquid with a cork stopper. The game's basic health potion. |
| 54 | `antidote` | **Antidote** | Consumable. Cures poison and curses. | #8fd14f | A slim glass vial of bright green liquid, maybe with a leaf tied to the neck. Cures poison and curses. |
| 55 | `smoke` | **Smoke Bomb** | Consumable. Every enemy you can see loses you and dozes off. | #9aa3b5 | A round dark-grey clay bomb with a short lit fuse sparking at the top. |
| 56 | `oil` | **Lantern Oil** | Consumable. See 2 tiles further on this floor. | #f2c94c | A small tin or clay oil flask with a spout, golden oil. Feeds your lantern so you see further. |
| 57 | `chart` | **Cartographer's Chart** | Consumable. Maps every room and corridor of this floor. | #d9dee2 | A rolled parchment map, partly unrolled to show room shapes and a route in ink. A cartographer's survey of one floor. |

### Keys

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 58 | `bronze_key` | **Bronze key** | Opens bronze locks; kept for one dive. | #c8843a | A simple bronze key, warm orange-brown. The common key for bronze locks. |
| 59 | `silver_key` | **Silver key** | Opens silver locks; kept for one dive. | #cfd8e6 | A slimmer silver key with a little scrollwork on the bow. |
| 60 | `gold_key` | **Gold key** | Opens gold locks; kept for one dive. | #f2c94c | An ornate gold key with a jeweled or filigree bow. Opens gold (treasure) locks. |
| 61 | `skeleton_key` | **Skeleton key** | Opens any non-boss locks (one use); kept for one dive. | #e8e0c8 | A bone-white key with a skull-shaped bow. Opens any lock except a boss door, once. |
| 62 | `boss_key` | **Boss key** | Opens the boss locks; kept for one dive. | #ff5d6c | A large, menacing red-and-black key with spikes or a horned bow. Opens the floor boss's door. |

### Materials

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 63 | `ore` | **Deep Iron** | Crafting/trade material. | #8f99a3 | A chunk of dark grey-blue metal ore with bright metallic veins. Smiths use it to upgrade gear. |
| 64 | `essence` | **Arcane Essence** | Crafting/trade material. | #b48cff | A glowing violet wisp or crystal of pure magic, maybe in a small bottle. A crafting material that sells well. |
| 65 | `shard` | **Relic Shard** | Crafting/trade material. | #7fd4ff | A jagged pale-cyan crystal fragment with ancient carved markings. Scholars and collectors trade blessings for these. |

### Blessing vials

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 66 | `vial_vigor` | **Vial of Vigor** | A blessing from hidden shrines, freed prisoners or the curio dealer. Permanent: +6 max HP. | #ff5d6c | A small ornate glass vial with a glowing red liquid and a wax seal. All four vials share the same bottle; only the liquid color and a small symbol change. |
| 67 | `vial_might` | **Vial of Might** | A blessing from hidden shrines, freed prisoners or the curio dealer. Permanent: +1 wand damage, +2 charged. | #ff9a3a | A small ornate glass vial with a glowing orange liquid and a wax seal. All four vials share the same bottle; only the liquid color and a small symbol change. |
| 68 | `vial_insight` | **Vial of Insight** | A blessing from hidden shrines, freed prisoners or the curio dealer. Permanent: see 1 tile further in the dungeon. | #8fe4ff | A small ornate glass vial with a glowing pale blue liquid and a wax seal. All four vials share the same bottle; only the liquid color and a small symbol change. |
| 69 | `vial_fortune` | **Vial of Fortune** | A blessing from hidden shrines, freed prisoners or the curio dealer. Permanent: +5% gold from fights. | #f2c94c | A small ornate glass vial with a glowing gold liquid and a wax seal. All four vials share the same bottle; only the liquid color and a small symbol change. |

### Quest items

These have no picture in the game yet, only a marker on the floor. A sprite lets them show in the quest list and when found.

| Cell | id | Item | What it is | Accent | Draw |
|---|---|---|---|---|---|
| 70 | `lucky_charm` | **Lucky charm** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | A small trinket: a rabbit's foot or clover on a string. |
| 71 | `grandfathers_ring` | **Grandfather's ring** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | An old worn gold ring, slightly dented. Must read differently from the equipment rings: plain, sentimental. |
| 72 | `map_case` | **Map case** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | A leather tube with a cap, for carrying rolled maps. |
| 73 | `prayer_beads` | **Prayer beads** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | A loop of wooden or stone beads with a tassel. |
| 74 | `silver_locket` | **Silver locket** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | A small oval silver locket on a fine chain, slightly open. |
| 75 | `journal` | **Journal** | A lost belonging a dungeon NPC asks you to find. Shown in the quest list. | any | A small worn leather notebook with a strap and dog-eared pages. |

## Already done (don't redraw)

These 21 weapons already have finished sprites, so use them as the style reference: Broken Wand, Basic Wand, Oak Wand, Quick Wand, Thin Wand of Ice, Wand of Electricity, Wand of Darkness, Wand of Light, Focus Rod, Storm Scepter, Frostfang Scepter, Archmage's Staff, Runecarved Staff, Oak Staff, Staff of the First Flame, Elven Bow, Ashwood Bow, Iron Crossbow, Thunderbolt Repeater, Hunter's Spear and Storm Trident.

## Delivery

Send the sheet (or the separate files). I'll slice it, add each sprite to the game the same way as the weapons, and send you pictures of them in the shop, bag and loot screens.
