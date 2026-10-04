# Gloopling: sprite prompts

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

## Gloopling (verdant)

**Design (repeat in every Gloopling sheet):** a small green slime the size of a head, one big eye, a droplet curl on top. Leaf-green, translucent, with a few bubbles inside.

**Notes:** Draw it about 180 px tall: it is the baby of the Gloop.

**Gloopling 1**
> **Sheet: Gloopling 1.** Follow the rules. The figure is **about 180 px tall**. [Design above.]
> - Cell 1: idle.
> - Cell 2: idle, a visible change (breathing, a flicker or a wobble).
> - Cell 3: moving, squashed flat, ready to hop.
> - Cell 4: moving, stretched tall in mid-hop, its bottom 15 px above the ground line.
> - Cell 5: hurt, recoiling backward, still full size.
> - Cell 6: death, melting into a small flat puddle with the eye closed.

**Gloopling 2**
> **Sheet: Gloopling 2.** Follow the rules. The figure is **about 180 px tall**. [Design above.]
> - Cell 1: squashing down, a tiny green glob forming in its mouth.
> - Cell 2: spitting a small green glob forward to the right, the glob still inside the cell.
> - Cell 3: eye squinting, body wobbling back to shape.
> - Cell 4: leaning back, eye wide.
> - Cell 5: leaning forward, a second glob just leaving its mouth.
> - Cell 6: bouncing happily, eye closed in a smile.
