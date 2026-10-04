# Cinder Wisp: sprite prompts

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

## Cinder Wisp (fire)

**Design (repeat in every Cinder Wisp sheet):** a floating flame spirit with a small skull of black coal at its heart, two ember-yellow eyes, a flame tail instead of legs, and a few square sparks around it. Red, orange and ember yellow, with soot-black on the skull.

**Notes:** It floats: the bottom of its flame tail hovers 30 px above the ground line in every cell.

**Cinder Wisp 1**
> **Sheet: Cinder Wisp 1.** Follow the rules. The figure is **about 280 px tall** and hovers 30 px above the ground line. [Design above.]
> - Cell 1: idle.
> - Cell 2: idle, a visible change (breathing, a flicker or a wobble).
> - Cell 3: moving, drifting forward, the flame tail streaming back to the left.
> - Cell 4: moving, drifting, the flame tail curling the other way.
> - Cell 5: hurt, recoiling backward, still full size.
> - Cell 6: death, guttering out into a few embers and a falling coal skull.

**Cinder Wisp 2**
> **Sheet: Cinder Wisp 2.** Follow the rules. The figure is **about 280 px tall** and hovers 30 px above the ground line. [Design above.]
> - Cell 1: flames pulling inward, a small fireball forming in front of the skull.
> - Cell 2: firing the fireball forward to the right; it is just leaving and still inside the cell.
> - Cell 3: flames flaring outward after the shot.
> - Cell 4: rising 20 px higher, a big ball of fire held above its head (firebomb).
> - Cell 5: hurling the firebomb forward and down; the ball is still inside the cell.
> - Cell 6: flaring huge, the flames twice as tall, eyes blazing.
