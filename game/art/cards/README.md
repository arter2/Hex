# Generated reference-card illustrations

Three illustration-only assets generated with OpenAI image generation on 2026-10-28 for Hexmancers:

| Card ID | Name | Image |
|---|---|---|
| ember_dart | Ember Dart | ember_dart.png |
| frost_aceup_02 | Undertow Charm | frost_aceup_02.png |
| verdant_charge_08 | Monkey's Fruit Stash | verdant_charge_08.png |

Art direction used each card's name and effects: a flaming dart in a volcanic cavern; a gold sapphire pendant containing a swirling undertow; a jungle fruit-juice bottle with a monkey charm. The prompts requested landscape pixel-art illustrations, without frames, text or interface elements.

`CARD_ILLUSTRATIONS` in `game/art.js` maps IDs to these local files. Other cards keep their previous procedural or painted-art path. `cardEl` marks registered illustrations with `.illustrated`; CSS uses contain fitting to preserve the complete subject in expanded and compact windows. Existing frames and game rules are unchanged by this art pass.

Keep files local for offline/itch.io use. Register another card by adding an image and its exact ID to the map. The PNGs are copied directly from the image generator; no post-generation image editing was applied.
