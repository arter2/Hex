# Hero sprite sheets

Painted hero sheets, keyed from green screen to transparent PNG by `deck/tools/key_heroes.py`
(the green originals go in `src/`, which git ignores). One file per look; keys match
`PLAYER_LOOKS` in `deck/sprites.js`.

| File | Look | Race / class | Notes |
|---|---|---|---|
| `human_m.png` | wizard | Human man | Labeled sheet, 8 directions, hat and no-hat statics |
| `human_m_apprentice.png` | (spare) | Human man | Young red-haired apprentice, no hat |
| `human_f.png` | human_f | Human woman | Labeled sheet, 8 directions, hood and no-hood statics |
| `elf_m.png` | elf_m | Elf man | |
| `elf_f.png` | elf_f | Elf woman | Has one hooded static |
| `undead_m.png` | undead_m | Undead man | Skeleton |
| `undead_f.png` | undead_f | Undead woman | |
| `witch_f.png` | witch | Witch | Labeled sheet, 8 directions, hat and no-hat statics |
| `necro_m.png` | necro | Necromancer man | |
| `necro_f.png` | necro_f | Necromancer woman | |
| `shaman_m.png` | shaman_m | Shaman man | |
| `shaman_f.png` | shaman_f | Shaman woman | |
| `ranger_m.png` | ranger_m | Ranger man | |
| `ranger_f.png` | ranger_f | Ranger woman | Labeled "Hunter Wizard", 8 directions |
| `orc_m.png` | orc_m | Orc man | Big, bearded |
| `orc_m_lean.png` | (spare) | Orc man | Lean variant |
| `orc_f.png` | orc_f | Orc woman | |
| `orc_f_alt.png` | (spare) | Orc woman | Variant |
| `goblin_m.png` | (no slot) | Goblin man | Not a race in the docs |
| `goblin_f.png` | (no slot) | Goblin woman | Not a race in the docs |

## Sheet layout

- **Labeled sheets** (human_m, human_f, witch_f, ranger_f): concept, an 8-direction turnaround,
  and rows of idle, run, jump, staff strike, spell cast, hit and death across 8 directions.
- **Unlabeled sheets** (the rest): concept top left, then side (3/4 right) rows of idle, walk
  and run, a 2 x 4 block of back views, staff strike, spell cast, hit, and death. Element
  palette swaps, effects, staff tops and heads sit along the bottom.

## Still missing

- **Dwarf**, man and woman: no sheets.
- **Warlock** (witch_m): no sheet.
- **Hatless sets** (`frontBare`, `backBare`, `animBare`): only static no-hat poses on the
  human_m, human_f and witch_f sheets; no hatless animation for any look.
- **Back-view action** (cast, walk, hurt from behind): the unlabeled sheets show the back only
  standing; the 4 labeled sheets cover it.
