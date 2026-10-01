# Hexmancers deck prototype

Open `deck/index.html` in a browser (no build step). Progress is saved in the browser (localStorage).

**The loop:** pick a starter deck → fight at camp → each win gives one reward (a card, gold or a piece of gear; bosses give more) → equip a weapon and an armor → open packs in the shop →
build decks from your collection → fight deeper for rarer drops. 1,000 cards to collect, plus 6 heroes:
the rarest cards, mostly dropped by bosses. A hero fights beside you for 3 turns and empowers you while it stands (one per deck).

| File | What it holds |
| --- | --- |
| `cards.js` | 51 hand-authored signature cards (Arcane set aside for Light) + a seeded template generator for the rest of the 1,000 (125 per family: type split, 50/38/25/12 rarity, ranks 1–12 spread evenly so Straights take the right cards), the 6 heroes, 4 potion cards (gray), color ring, starter decks |
| `engine.js` | Runes (queued cards share a rune A–F or a name; ✱ is wild), combos (Double/Triple, Flush = one color and one type, Straight / Grand Straight, recipes), Rune Surge 4th slot. Deck rules and piles: 45–60 cards, 4 copies (1 per legendary or hero, 1 hero per deck), draw 7 at each Custom, queue 3, no reshuffle, charge uses, draw/recall/copy |
| `collection.js` | Save, rewards (one card, gold or gear per normal win; bosses give gold, 2+ cards, gear and sometimes a hero), packs, auto-fill |
| `gear.js` | Your wizard's gear: 12 wands and staffs (Broken, Basic, Thin Wand of Ice, Electricity, Darkness, Light...), 5 armors, 4 legendaries, 4 cursed pieces that hide their name until worn and stick until purified or paid for with 3 cards of their rune; merging copies (+1 to +3), scrolls of enchanting and purifying, loot rolls. Shown on the Character screen |
| `battle.js` | Real-time battle on an 8 x 12 hex board inside a cave that changes every 3 depths (Glowworm Hollows, Frozen Deeps, Gilded Ruins, The Abyss), seen through a perspective camera behind you and up, looking straight at the enemy side, with the next card's reach drawn on the floor (tiles, shot paths, lob arcs) and run at 80% speed so enemies are easy to follow; every card type: Strike, Lob, Ward, Sentry, Boon, Charge, Utility, Trap, Environment, Summon, Machine, Hero, Legendary piece |
| `enemies.js` | Monsters with signature attacks, humanoids that cast real cards, encounters in up to 3 waves, terrain (rocks, lava, ice) |
| `art.js` | 64 x 64 pixel art for every card (all different): the subject comes from the card's name, staged by its type, set in one of three scenes for its color, changed by the words in its name (molten veins, ice, thorns, flowers, smoke, feathers, arcs, gears...), shaded as a solid with material textures, with keyword badges and a rarity frame; also the 32 x 32 sprites for every unit on the board. `node deck/tools/export-art.js` writes `art/<card id>.csv` (64 rows of 64 hex colors) and `art/index.csv` |
| `ui.js` | Start, camp, deck builder (5 saved decks), collection, shop, Custom screen, HUD, controls |

Tests: `node deck/engine.test.js`

Controls: tap a tile on your side to move, tap a tile on the enemy side to aim lobs (nearest enemy if you don't), hold Wand to charge, Cast plays the next queued card, Custom opens when the gauge is full.
Keyboard: arrows/WASD move, Space wand, Enter cast, Q cycle lob aim, C custom, 1–7 pick cards on the Custom screen.
In grids, long-press (or right-click) a card for its detail.

Card ids come from a seeded generator. Changing a template in `cards.js` can change ids, so bump `SAVE_KEY` in `collection.js` when you do.

See `CHECKPOINTS.md` for known-good points to go back to.
