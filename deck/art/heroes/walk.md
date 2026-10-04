# Player walk cycles: sprite prompts

The dungeon map shows your character walking in any direction. Today it only has standing
frames, plus one back walk pose for 6 of the 16 looks. These sheets add a 4-frame walk for
each direction the map needs:

- **Front:** walking down the screen, toward the viewer.
- **Back:** walking up the screen, away from the viewer.
- **Side:** walking to the right. The game mirrors it for walking left.

Each look gets **2 sheets** in the same 6-cell format as the boss and enemy prompts.

## How to use

1. Start a **new chat** for each look.
2. **Attach that look's reference sheet** from `deck/art/heroes/`, listed in the table below.
   Send **Prompt 0** with it and wait for "Ready".
3. Send **sheet 1**, then **sheet 2**, each in its own message.
4. **Check before you save.** Make sure there are exactly 6 figures, one in each box, with
   nothing crossing a magenta line and no text. Check that the character matches the reference:
   the same outfit, colors, hair and staff. If anything is wrong, reply:
   **"Redo this sheet. Exactly 6 figures, one per cell, nothing crossing the magenta lines,
   same character as the reference."**
5. Save both sheets as PNGs at full size and upload them together. Name them
   `<look>_walk1.png` and `<look>_walk2.png`, for example `wizard_walk1.png`.

**Hat sets.** Only the wizard, the witch and the ranger woman wear hats. For those three, make
the walk sheets with the hat first. Then repeat both sheets in the same chat with the message:
**"Same two sheets again, but the character has no hat (same hair, same everything else)."**
Name those sheets `<look>_bare_walk1.png` and `<look>_bare_walk2.png`.

---

## Prompt 0: rules (send first, once, with the reference sheet attached)

> I'm making walk-cycle sprite sheets for **Hexmancers**, a pixel-art fantasy card battler.
> The attached sheet shows the character. Draw **exactly this character**: the same outfit,
> colors, hair, face, proportions and staff. I'll send one sheet at a time. Every sheet follows
> these rules exactly. If a rule conflicts with making it look nice, follow the rule.
>
> **1. Canvas and grid.**
> - The image is **1536 × 1024** pixels.
> - Draw a grid of **3 columns × 2 rows = 6 cells** with straight **4-pixel solid magenta
>   (#FF00FF) lines**: one around the outside edge, two vertical lines at x = 512 and x = 1024,
>   and one horizontal line at y = 512.
> - Every cell is the same 512 × 512 square.
> - Inside every cell, the background is flat solid chroma green **#00FF00**.
>
> **2. Exactly one figure per cell, exactly 6 figures per sheet.**
> - Never add extra poses and never leave a cell empty.
> - **Count them before you finish.**
>
> **3. Nothing crosses a magenta line.**
> - The figure, its staff and any glow stay inside their own cell, at least 16 px away from
>   every line.
>
> **4. Same size, same spot.**
> - In every cell the character is drawn at **the same scale**, and is **about 380 px tall**
>   from feet to the top of the head (not counting the staff or a tall hat).
> - The feet stand on the same ground line, **40 px above the bottom line of the cell**.
>   The foot that is lifted mid-step may rise a little above it.
> - The body is centred left to right in the cell, so the frames line up when played in turn.
> - Do not zoom in or out between cells.
>
> **5. Walking.**
> - A 4-frame walk cycle, in this order: **contact** (left foot forward, both feet down),
>   **passing** (right leg swinging through, body 4–6 px higher), **contact** (right foot
>   forward, both feet down), **passing** (left leg swinging through, body 4–6 px higher).
> - The arms swing opposite to the legs. The staff stays in the **right hand** in every frame
>   and swings gently with that arm. The robe or cloak sways with the step.
> - A calm walking pace, not a run.
>
> **6. Clean background.**
> - No ground shadows, no floor, no text, no labels, no numbers, no arrows, no titles, and no
>   other characters.
>
> **7. Style.**
> - Crisp pixel art matching the reference sheet.
> - A 1-pixel dark outline (a dark version of the local color, not pure black).
> - Light from the upper left, with 3–5 step color ramps.
> - Square pixels, no blur, no soft glow, no gradients.
> - The staff's glow is drawn as solid pixel shapes.
>
> Cells are read left to right, top row then bottom row: **cell 1, 2, 3** on top and
> **cell 4, 5, 6** below.
>
> Reply "Ready" and wait.

---

## The two sheets

| Sheet | Cells 1–3 (top) | Cells 4–6 (bottom) |
|---|---|---|
| **1: front and side** | front walk 1, 2, 3 | front walk 4, side walk 1, side walk 2 |
| **2: side and back** | side walk 3, side walk 4, back walk 1 | back walk 2, 3, 4 |

**Sheet 1**
> **Sheet: walk 1.** Follow the rules. Same character as the reference.
> - Cells 1–4: the **front** walk, frames 1 to 4. The character faces the viewer, turned
>   slightly to the viewer's right, and walks toward the viewer.
> - Cells 5–6: the **side** walk, frames 1 and 2. A true side view facing right, walking to
>   the right.

**Sheet 2**
> **Sheet: walk 2.** Follow the rules. Same character as the reference, same scale as sheet 1.
> - Cells 1–2: the **side** walk, frames 3 and 4. A true side view facing right, walking to
>   the right.
> - Cells 3–6: the **back** walk, frames 1 to 4. The character is seen from behind, turned
>   slightly to the viewer's right, and walks away from the viewer. Show the back of the head
>   (or hat or hood) and the back of the robe. The face is not visible.

---

## The looks

Attach the reference file in each look's chat. The look ids match `PLAYER_LOOKS` in
`deck/sprites.js`.

| Look id | Character | Reference sheet | Hat set too? |
|---|---|---|---|
| `wizard` | Human man | `human_m.png` (hatless: `human_m_bare.png`) | yes |
| `human_f` | Human woman | `human_f.png` | no (hood) |
| `elf_m` | Elf man | `elf_m.png` | no |
| `elf_f` | Elf woman | `elf_f.png` | no |
| `dwarf_m` | Dwarf man | `dwarf_m_bare.png` | no (hatless only) |
| `dwarf_f` | Dwarf woman | `dwarf_f_bare.png` | no (hatless only) |
| `witch` | Witch | `witch_f.png` (hatless: `witch_f_bare.png`) | yes |
| `witch_m` | Warlock | `warlock.png` | no |
| `necro` | Necromancer man | `necro_m.png` | no |
| `necro_f` | Necromancer woman | `necro_f.png` | no |
| `shaman_m` | Shaman man | `shaman_m.png` | no |
| `shaman_f` | Shaman woman | `shaman_f.png` | no |
| `ranger_m` | Ranger man | `ranger_m.png` | no (hood) |
| `ranger_f` | Ranger woman | `ranger_f.png` (hatless: `ranger_f_bare.png`) | yes |
| `orc_m` | Orc man | `orc_m.png` | no |
| `orc_f` | Orc woman | `orc_f.png` | no |

That is 16 looks × 2 sheets, plus 3 hatless sets × 2 sheets: **38 sheets** in all.

**Size notes.** Draw every look at the same 380 px. The game already scales dwarves down (0.8)
and orcs up (1.05), so don't make them smaller or bigger on the sheet.

**Priority.** The 10 looks below have no back walk pose at all yet, so they gain the most:
both elves, both shamans, both orcs, the ranger man, both necromancers and the warlock.

---

## After the sheets come in (for the code side)

- Key the green and magenta out and cut each frame from its known 512 px cell (no
  point-picking), sized with the same `FILL` and `SCALE` rules as `deck/tools/heroes/make.py`.
- Add `walkFront`, `walkSide` and `walkBack` strips (4 frames each, plus `...Bare` for the
  hat looks) to each `PLAYER_LOOKS` entry.
- In `lookSprite` (`art.js`), add a `walk` view that picks the strip by direction. In the
  dungeon (`explore.js`), choose front, back or side from the movement direction, mirror the
  side strip when walking left, and step through the 4 frames while walking. Standing still
  keeps the current standing frames.
