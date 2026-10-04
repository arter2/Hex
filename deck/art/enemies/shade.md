# Shade: sprite prompts

## How to use

1. Start a **new chat**. Send **Prompt 0** and wait for "Ready".
2. Send **one sheet prompt per message** (sheet 1, then sheet 2).
3. **Check before you save.** Make sure there are exactly 6 figures, one in each box, with
   nothing crossing a magenta line and no text. If any of that is wrong, reply:
   **"Redo this sheet. Exactly 6 figures, one per cell, nothing crossing the magenta lines."**
4. Save each sheet as a PNG at full size and upload both together.

---

## Prompt 0: rules (send first, once)

> I'm making enemy sprite sheets for **Hexmancers**, a pixel-art fantasy card battler. I'll send
> one sheet at a time. Every sheet follows these rules exactly. If a rule conflicts with making
> it look nice, follow the rule.
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
> - The figure **and all its effects** (bolts, sparks, splashes, smoke, flames) stay inside
>   their own cell, at least 16 px away from every line.
> - If an effect would be too long, make it shorter.
> - Shots and thrown objects end before the cell edge.
>
> **4. Same size, same spot.**
> - In every cell the figure is drawn at **the same scale**, at **the height the sheet gives**.
> - Its feet stand on the same ground line, **40 px above the bottom line of the cell**
>   (floating figures hover at the height the sheet gives).
> - It is centred left to right.
> - Do not zoom in or out between cells. A crouch is shorter because of the pose, not because
>   of the scale.
>
> **5. View.**
> - Front three-quarter view, facing the viewer, turned slightly to the viewer's right.
> - The same view in all 6 cells.
>
> **6. Clean background.**
> - No ground shadows, no floor, no text, no labels, no numbers, no titles, and no other
>   characters.
>
> **7. Style.**
> - Crisp pixel art in a late-1990s arcade style.
> - A 1-pixel dark outline (a dark version of the local color, not pure black).
> - Light from the upper left, with 3–5 step color ramps.
> - Square pixels, no blur, no soft glow, no gradients.
> - Magic and glows are drawn as solid pixel shapes.
>
> **8. Consistency.** The same character design, colors and proportions in every cell. Only the
> pose changes.
>
> Cells are read left to right, top row then bottom row: **cell 1, 2, 3** on top and
> **cell 4, 5, 6** below.
>
> Reply "Ready" and wait.

---

## The two sheets every enemy gets

| Sheet | Cells 1–3 (top) | Cells 4–6 (bottom) |
|---|---|---|
| **1: idle, move and hurt** | idle A, idle B, move A | move B, hurt, death |
| **2: attacks** | wind-ups, releases and a special, listed per sheet below | (as listed) |

---

## Shade (shadow)

**Design (repeat in every Shade sheet):** a hunched ghost of smoke and purple shadow with long clawed arms, a ragged hood and two violet eyes. Below the waist it fades into solid wisp shapes. Purple, near black and a sickly violet glow.

**Notes:** It floats: the bottom of its wisps hovers 20 px above the ground line in every cell.

**Shade 1**
> **Sheet: Shade 1.** Follow the rules. The figure is **about 320 px tall** and hovers 20 px above the ground line. [Design above.]
> - Cell 1: idle.
> - Cell 2: idle, a visible change (breathing, a flicker or a wobble).
> - Cell 3: moving, drifting forward, wisps streaming back.
> - Cell 4: moving, drifting, claws trailing.
> - Cell 5: hurt, recoiling backward, still full size.
> - Cell 6: death, unravelling into wisps, only the hood and eyes left.

**Shade 2**
> **Sheet: Shade 2.** Follow the rules. The figure is **about 320 px tall** and hovers 20 px above the ground line. [Design above.]
> - Cell 1: folding in on itself, half dissolved into smoke shapes (blink out).
> - Cell 2: reappearing out of smoke, claws already raised (blink in).
> - Cell 3: slashing forward with both claws, three short violet claw streaks in front of it, inside the cell.
> - Cell 4: arms spread wide, hood thrown back, eyes blazing.
> - Cell 5: a lunging grab, one clawed arm stretched far forward, still inside the cell.
> - Cell 6: laughing, shoulders shaking, violet sparks around its hood.
