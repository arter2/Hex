# Hexmancers: project handoff

Read this first when picking the project up in a new chat. It covers what the game is, how the
code and art fit together, and where the work stands now.

## Repo and working rules

| | |
|---|---|
| Repository | `arter2/hex` (local clone `/home/user/Hex`) |
| Branch | `ccr-4c59caee-nfo4lq` (all work is committed and pushed here; no pull request) |
| Run the game | open `deck/index.html` in a browser; there is no build step, and saves live in localStorage |
| Tests | `node deck/engine.test.js` (every line should say `ok`) |
| Bots | `node deck/tools/playtest/run.js <label> <battles> <depths>` |
| itch.io build | `python3 deck/tools/build-itch.py` → `dist/hexmancers-itch.zip` |
| Checkpoints | `deck/CHECKPOINTS.md` (known-good commits to go back to) |
| File map | `deck/README.md` (one line per source file) |

How the owner likes to work:
- **Keep replies short.** Spend fewer words and save tokens.
- **Commit and push** after each finished piece, and **post the zip** when asked.
- **Never ask for or accept passwords or credentials** in chat.

## The game

Hexmancers is a real-time card battler on an 8 × 12 hex board. You pick a starter deck, fight,
and earn cards, gold and gear. You open packs in the shop, build decks, and go deeper.
- **Cards.** There are 1,000 cards plus 6 rare heroes, which fight beside you. Cards cast from
  a 3-slot queue with rune combos.
- **World.** Six areas of 4 floors each, defined in `world.js`. The 4th floor of each area is
  its boss:

  | Area | Boss |
  |---|---|
  | Glowworm Hollows | Radiant Golem |
  | Frozen Deeps | Glacier Queen |
  | Storm Vault | Thunder Roc |
  | Ember Rifts | Magma Wyrm |
  | Gilded Ruins | Elder Treant |
  | The Abyss | Hollow King |

- **Dungeon.** Floors between battles are explored (`dungeon.js`, `explore.js`). They hold
  NPCs, merchants, keys and locks, puzzles, traps and secrets. There are 11 minibosses
  (`minibosses.js`).
- **Battle view.** The camera sits behind the player and looks at the enemy side, so the player
  is seen from the **back** and enemies from the **front**. Every unit sprite faces right and is
  flipped toward its target.

## How sprites get into the game

All sprites live as base64 PNGs in `deck/sprites.js` and are read by `art.js` (`lookSprite`,
`rigSprite`) and `battle.js`.
- **Frames.** Square, any size. Feet sit at 31/32 of the height and the sprite faces right.
- **`PLAYER_LOOKS`.** Each entry has:
  - `front`: used in camp and on the character screen.
  - `back`: used in battle.
  - `anim`: a strip of 4 back-view poses: idle, walk, cast and attack.
  - `tips`: where the staff glow sits in each pose.
  - Optional `frontBare`, `backBare` and `animBare`: the hatless set, used by the Hat toggle.
- **`UNIT_SPRITES`.** Enemies, bosses, helpers, allied heroes and minibosses.
- **`GEAR_SPRITES`.** 21 weapon icons.

### Player looks: done, using the painted sheets

- **Sheets.** AI-made hero sheets on green screen sit in `deck/art/heroes/`. The originals go in
  `src/`, which git ignores. Each sheet is keyed to a transparent PNG by
  `python3 deck/tools/key_heroes.py`.
- **Frame picks.** `deck/tools/heroes/spec.py` lists which figure on which sheet is each look's
  front and its 4 back poses, as points on the sheet.
- **Building.** `python3 deck/tools/heroes/make.py` cuts those figures (with `cut.py`) and
  rewrites `PLAYER_LOOKS`.
  - All looks are sized to one body height that ignores the staff: `FILL` is .78 for the front
    and .70 for the back.
  - Per-look scale comes from `SCALE`: dwarves 0.8, orcs 1.05.
- **Index.** `deck/art/heroes/README.md` says which sheet is which look.
- **Classes.** There are 8 races × man and woman = 16 looks: Human, Elf, Dwarf, Warlock/Witch,
  Necromancer, Shaman, Ranger and Orc.
  - Undead was folded into Necromancer. Old saves are mapped by `LOOK_ALIAS` in `art.js`.
- **Hats.** Hoods are not hats. Only the wizard, the witch and the ranger woman have hat and
  no-hat sets. The dwarves are hatless only.
- **Known gap.** The 10 looks from the unlabelled sheets have only standing back views, so they
  don't change pose for cast or attack in battle. Those looks are both elves, both shamans, both
  orcs, the ranger man, both necromancers and the warlock. Labelled 8-direction sheets with a
  back (N) row would fix it.
- **Spare sheets, not used:** the human apprentice, a lean orc man, a second orc woman, the
  goblin man and woman, the warlock woman, a second hatless wizard and a stubble dwarf.

### Everything else: still the old art

- **Old art.** Enemies, bosses, helpers, heroes, minibosses and weapons still use the art from
  the 3D sprite lab (`deck/tools/sprite3d/`, built by `make_sprites.py`).
- **Voxel experiments** were abandoned.

## Where we are now: boss art

- **Prompts.** There is one prompt file per boss in `deck/art/bosses/`: `golem.md`, `glacier.md`,
  `roc.md`, `wyrm.md`, `treant.md`, `hollow.md`, and `helpers.md` (Root Node, Sapling, Hollow
  Shade).
- **Each file is self-contained:** how to use it, Prompt 0 (the rules), then three sheet prompts.
- **Format.** Each sheet is 1536 × 1024: 3 × 2 cells of 512 px with **magenta grid lines** on a
  **#00FF00** background.
  - The boss is about 400 px tall, standing 40 px above the bottom of the cell, at the same
    scale in every cell.
  - It's drawn in front three-quarter view, turned slightly right.
- **The three sheets per boss:**
  1. Idle ×4, hurt, phase-change roar.
  2. Attack A wind-up and hit, attack B wind-up and throw, shot, special.
  3. Enraged idle ×2, special (second frame), death ×3.
- **First attempt.** The first one-sheet Golem attempt broke the layout: wrong counts per row,
  effects crossing cells, shadows. A copy is kept in `deck/art/bosses/src/golem_try1.png`, and
  its idle frames are usable. The prompts were rewritten into the 6-cell format because of it.

**Golem, first batch in (fixed-palette sprites).** Five 12-frame sheets came in (idle, walk
forward, walk backward, walk slight left, walk slight right), in a 4 × 3 grid with a title band and
numbered cells, not the 3 × 2 format above. `deck/tools/bosses/pal_sprites.py` cuts them at the
known grid, keys the green (and the drawn ground shadow), drops the numbers and loose pebbles, and
writes `deck/sprites_pal.js`; add a boss there by listing its sheets in `BOSSES`. Still missing for
the golem: hurt, attacks, special, phase roar, enraged and death.

**Boss mechanics the art supports** (`bosses.js`):
- **Three phases.** Each boss has 3 phases: it evolves at ⅔ and ⅓ HP, and phase 3 is enraged.
- **Golem:** its weak color is shown by tinting a white core.
- **Wyrm and Roc:** they leave the board, so they need burrow and fly-off frames.
- **Treant:** stays rooted, and Root Nodes heal it.
- **Hollow King:** blinks, steals cards and splits into shades.

## Next steps

1. **Collect the boss sheets.** The owner makes the sheets in ChatGPT and uploads them three
   at a time.
2. **Build a boss pipeline** the same way as for heroes:
   - Key the green and magenta out.
   - Cut each frame from its known 512 px cell, so no point-picking is needed.
   - Write a `UNIT_SPRITES` frame for each boss. The idle frame comes first; animation strips
     need a small reader change in `art.js` (`rigSprite`) and `battle.js` to pick frames by
     state (attack, hurt, phase, death).
   - Size bosses to their old fill, so they stay about 1.5× a hero.
3. **Write prompts for the rest**, in the same format. Monsters and humanoid enemies are done
   (`deck/art/enemies/`, one file each, two sheets per enemy). Still to do: allied heroes,
   minibosses and weapon icons. `deck/art/SPRITE_PROMPTS.md` has the old one-sheet
   versions with each character's description.
4. **Walk cycles:** `deck/art/heroes/walk.md` has prompts for front, side and back 4-frame walks
   for all 16 looks (38 sheets). Once uploaded, they need a cutter and a direction-aware
   `walk` view in `art.js` and `explore.js` (steps at the end of that file).
5. **After any art change:** run the tests, take a browser screenshot of the character screen
   and a battle (Playwright at `/opt/node22/lib/node_modules/playwright`, Chromium at
   `/opt/pw-browsers/chromium`), rebuild the zip, then commit and push.
