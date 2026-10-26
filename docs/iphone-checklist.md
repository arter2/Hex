# iPhone and iPad check

The tests on GitHub tap the game in Chromium and WebKit (the engine inside Safari) at phone and tablet sizes. They can't
hold a real phone. Run through this on an actual iPhone (and an iPad if you have one) after a big UI change. It takes
about ten minutes. Note anything that fails, with the screen it was on and the phone model.

Open the itch.io page in **Safari**, not an in-app browser, and play in both orientations.

## Before you start

- [ ] Clear old data once, so you see what a new player sees: Settings › Erase this save, or a private tab.
- [ ] Turn the sound on and the silent switch off.

## Screen edges

- [ ] **Notch / Dynamic Island:** nothing important sits under it in portrait, or beside it in landscape (HP, depth,
      pause, the Spell bar).
- [ ] **Home bar:** the bottom row (Fire, Spell, Cast, Deck · Hand) isn't under the home indicator, and swiping up near
      it doesn't trigger buttons by accident.
- [ ] **Safari toolbar:** in portrait, scroll or tap so the address bar shrinks and grows. The battle doesn't jump,
      and nothing is hidden behind the toolbar.
- [ ] **Rotate** during a battle, the dungeon and a menu: the layout redraws, nothing is cut off, and the fight keeps
      going (or pauses) without breaking.

## Thumbs

- [ ] **Fire:** hold it while walking with the other thumb. It charges (the arc fills from the bottom) and fires when
      you let go. Quick taps fire normal shots.
- [ ] **Cast:** tap it while still holding Fire. It casts.
- [ ] **Queue:** tap the 3rd card. It becomes NEXT. With Rune Rush (4 cards), all four fit between Fire and Cast.
- [ ] **Spell:** when it turns gold and pulses, one tap opens the hand screen.
- [ ] **Walking:** a quick tap on a tile walks there; touch and slide uses the stick. Neither fires by accident when
      your thumb starts on a button.
- [ ] **Instants:** with Whetstone or Tempering Oil in hand, its button is at the side. Tap it ("Tap a card to
      enchant" shows), then tap a queue card: it gets the blue glow and ✚. Check it in landscape too.
- [ ] **Left-handed:** Settings › Fire button: Right, and Instant buttons: Left. Everything swaps and still works.

## Hand screen

- [ ] Tap cards in and out of the queue. Drag one to a slot. Hold one to read it.
- [ ] A deck tool in a slot works with a **double-tap** at a normal pace (this is the one the test machine can't
      check at tablet size).
- [ ] **Keep:** cards you tap turn gold; Done draws the rest back up.
- [ ] **Search:** three cards appear above your hand; tapping one adds it.

## Menus and saving

- [ ] Camp, deck builder, shop, bag and settings: every button responds to the first tap, and lists scroll with a
      flick without tapping something underneath.
- [ ] Close Safari fully (swipe it away) mid-dungeon, reopen the page: Continue brings you back where the game says
      it will.
- [ ] Low Power Mode on: the game still runs at a playable speed.

## Report

For anything that fails: phone model, iOS version, portrait or landscape, which screen, what you did and what
happened. A screenshot or screen recording helps most.
