# Enemy sprite prompts

One self-contained file per enemy. Each file has Prompt 0 (the rules) and two sheet prompts in
the same 6-cell format as `../bosses/`: 1536 × 1024, 3 × 2 cells of 512 px, magenta grid lines
on #00FF00, feet 40 px above the cell bottom.

- **Sheet 1:** idle A, idle B, move A, move B, hurt, death.
- **Sheet 2:** attacks and a special (monsters), or shot, card cast, power pose and block
  (humanoids).

| File | Enemy | Element | Height |
|---|---|---|---|
| `gloop.md` | Gloop | verdant | 300 |
| `gloopling.md` | Gloopling | verdant | 180 |
| `wisp.md` | Cinder Wisp | fire | 280 (floats) |
| `mite.md` | Frost Mite | frost | 220 |
| `beetle.md` | Volt Beetle | storm | 260 |
| `ram.md` | Thunder Ram | storm | 320 |
| `shade.md` | Shade | shadow | 320 (floats) |
| `sprite.md` | Halo Sprite | light | 220 (flies) |
| `cultist.md` | Ember Cultist | fire | 360 |
| `witch.md` | Frost Witch | frost | 360 |
| `caller.md` | Storm Caller | storm | 360 |
| `warden.md` | Grove Warden | verdant | 360 |
| `paladin.md` | Dawn Paladin | light | 360 |
| `knight.md` | Hex Knight | shadow | 360 |

The file names match the ids in `ENEMY_DEFS` (`enemies.js`) and `UNIT_SPRITES`.
