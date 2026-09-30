# Hexmancers deck prototype

Open `deck/index.html` in a browser (no build step). Progress is saved in the browser (localStorage).

**The loop:** pick a starter deck → fight at camp → monsters drop cards and gold → open packs in the shop →
build decks from your collection → fight deeper for rarer drops. 800 cards to collect.

| File | What it holds |
| --- | --- |
| `cards.js` | 51 hand-authored signature cards + a seeded template generator for the rest of the 800 (type split and 40/30/20/10 rarity per family from the design doc), color ring, starter decks |
| `engine.js` | Deck rules and piles: 45–60 cards, 4 copies (1 per legendary), draw 7 at each Custom, queue 3, no reshuffle, charge uses, draw/recall/copy |
| `collection.js` | Save, card drops by depth, packs, auto-fill |
| `battle.js` | Real-time battle on the 37-tile hex board (isometric view); every card type: Strike, Lob, Ward, Sentry, Boon, Charge, Utility, Summon, Machine, Legendary piece |
| `ui.js` | Start, camp, deck builder (5 saved decks), collection, shop, Custom screen, HUD, controls |

Tests: `node deck/engine.test.js`

Controls: tap a tile on your side to move, tap a tile on the enemy side to aim lobs (nearest enemy if you don't), hold Wand to charge, Cast plays the next queued card, Custom opens when the gauge is full.
Keyboard: arrows/WASD move, Space wand, Enter cast, Q cycle lob aim, C custom, 1–7 pick cards on the Custom screen.
In grids, long-press (or right-click) a card for its detail.

Card ids come from a seeded generator. Changing a template in `cards.js` can change ids, so bump `SAVE_KEY` in `collection.js` when you do.
