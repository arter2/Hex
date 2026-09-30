# Hexmancers deck prototype (phase 2: card engine)

Open `deck/index.html` in a browser (no build step). Pick one of three 60-card starter decks and fight.

- `cards.js`: card data table (color, type, rank, rarity, power, keywords), color weakness ring, starter decks
- `engine.js`: deck rules and piles: 45–60 cards, 4 copies (1 for legendaries), draw 7 at each Custom, queue 3, no reshuffle
- `battle.js`: real-time battle on the 37-tile hex board with an isometric view; Strike, Lob, Ward, Sentry and Boon behaviors
- `ui.js`: deck select, deck list, Custom screen, HUD, touch and keyboard controls

Tests: `node deck/engine.test.js`

Controls: tap a tile to move, hold Wand to charge, Cast plays the next queued card, Custom opens when the gauge is full.
Keyboard: arrows/WASD move, Space wand, Enter cast, C custom, 1–7 pick cards on the Custom screen.
