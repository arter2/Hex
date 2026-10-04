# Hexmancers boss prompts

## What went wrong last time

The first Golem sheet broke the layout in five ways:
- **Wrong figure counts.** The rows held 7, 6, 5 and 7 figures instead of 6 each.
- **Frames spilled into neighbors.** The beam, the thrown rock and the smash dust ran into the
  next figures.
- **Uneven placement.** Figures were placed by eye, so no row lines up with a grid.
- **Shadows.** It drew ground shadows.
- **Poses out of order.** The poses didn't follow the cell list.

Image models can't reliably count past about 6 or keep a long cell list in order. These prompts
work around that:
- **Six frames per sheet.** Each boss is split into **three sheets of 6 frames**
  (3 columns × 2 rows).
- **Drawn grid lines.** The grid is drawn as **magenta lines** so the model can see every
  cell. I remove the lines when I cut the sheet.
- **One sentence per cell.** Each cell is described in its own sentence, in reading order.
- **Effects stay small.** Effects must fit inside their own cell.

## How to use

1. Start a **new chat**. Send **Prompt 0** and wait for "Ready".
2. Send **one sheet prompt per message** (for example *Golem 1*, then *Golem 2*, then
   *Golem 3*).
3. **Check before you save.** Make sure there are exactly 6 figures, one in each box, with
   nothing crossing a magenta line and no text. If any of that is wrong, reply:
   **"Redo this sheet. Exactly 6 figures, one per cell, nothing crossing the magenta lines."**
4. Save each sheet as a PNG at full size and upload all three together.

---

## Prompt 0: rules (send first, once)

> I'm making boss sprite sheets for **Hexmancers**, a pixel-art fantasy card battler. I'll send
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
> - Never add extra poses and never leave a cell empty unless the sheet says so.
> - **Count them before you finish.**
>
> **3. Nothing crosses a magenta line.**
> - The figure **and all its effects** (beams, rocks, sparks, dust, flames) stay inside their
>   own cell, at least 16 px away from every line.
> - If an effect would be too long, make it shorter.
> - Beams and thrown objects end before the cell edge.
>
> **4. Same size, same spot.**
> - In every cell the boss is drawn at **the same scale**, and is **about 400 px tall** when
>   standing.
> - Its feet stand on the same ground line, **40 px above the bottom line of the cell**.
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

## The three sheets every boss gets

| Sheet | Cells 1–3 (top) | Cells 4–6 (bottom) |
|---|---|---|
| **1: idle and hurt** | idle A, idle B, idle C | idle D, hurt, phase-change roar |
| **2: attacks** | attack A wind-up, attack A hit, attack B wind-up | attack B throw/hit, shot, special |
| **3: enraged and death** | enraged idle A, enraged idle B, special (second frame) | death 1, death 2, death 3 |

---

## 1. Radiant Golem (light)

**Design (repeat in every Golem sheet):** a towering golem of white marble and gold plates,
broad and heavy, with short thick legs and huge fists. It has a glowing diamond-shaped prism
core in its chest that is **pure white** in every cell, and light shines from the seams between
its plates.

**Golem 1**
> **Sheet: Radiant Golem 1.** Follow the rules. [Design above.]
> - Cell 1: standing idle, fists low.
> - Cell 2: idle, chest raised 4 px, fists slightly open.
> - Cell 3: idle, same as cell 1 but the seams glow brighter.
> - Cell 4: idle, chest lowered, fists closed.
> - Cell 5: hurt, recoiling backward with chips of marble flying off, still inside the cell.
> - Cell 6: phase-change roar, arms spread wide, the core flaring and seams blazing.

**Golem 2**
> **Sheet: Radiant Golem 2.** Follow the rules. [Design above.]
> - Cell 1: both fists raised high overhead, ready to slam.
> - Cell 2: both fists slammed into the ground, short cracks of light around its fists, all
>   inside the cell.
> - Cell 3: tearing a marble boulder off its shoulder, the boulder held above its head.
> - Cell 4: throwing the boulder forward, the boulder just leaving its hand and still inside the
>   cell.
> - Cell 5: firing a short beam of light from the core; the beam is at most 150 px long.
> - Cell 6: the core opening like a flower of gold plates, glowing.

**Golem 3**
> **Sheet: Radiant Golem 3.** Follow the rules. [Design above.] Cells 1–2 show the enraged
> golem: wider cracks, seams blazing gold and white, a brighter core and solid flame shapes
> along its shoulders.
> - Cell 1: enraged idle, standing.
> - Cell 2: enraged idle, chest raised 4 px.
> - Cell 3: the core flower fully open and blazing (normal colors).
> - Cell 4: staggering, plates falling off.
> - Cell 5: collapsing onto its knees into a heap of plates.
> - Cell 6: a pile of marble and gold rubble with a faint core glow.

---

## 2. Glacier Queen (frost)

**Design:** a regal, tall, slender ice sorceress queen with a tall crystal crown, a gown of
layered ice shards spreading wide at the hem, a cape of frost mist drawn as solid shapes, and an
ice scepter in her right hand. Pale blue skin, white hair and a proud, cold face.

**Queen 1**
> **Sheet: Glacier Queen 1.** Follow the rules. [Design.]
> - Cell 1: standing idle, scepter upright.
> - Cell 2: idle, the cape drifting left.
> - Cell 3: idle, the cape drifting right.
> - Cell 4: idle, the scepter tilted slightly forward.
> - Cell 5: hurt, recoiling, shards chipping off her gown.
> - Cell 6: phase-change, arms raised and the crown blazing white.

**Queen 2**
> **Sheet: Glacier Queen 2.** Follow the rules. [Design.]
> - Cell 1: the scepter raised high in both hands.
> - Cell 2: the scepter driven down, with short ice spikes bursting up at its tip.
> - Cell 3: her left hand drawn back across her body.
> - Cell 4: her left hand swept out, a low wall of three ice blocks rising in front of her.
> - Cell 5: shooting a short ice shard from the scepter, the shard still inside the cell.
> - Cell 6: frozen glare, her eyes and crown glowing white and a ring of frost at her feet.

**Queen 3**
> **Sheet: Glacier Queen 3.** Follow the rules. [Design.] Cells 1–2 show the enraged queen
> (blizzard): a taller jagged crown, solid snowflakes around her and her gown cracked with blue
> light.
> - Cell 1: enraged idle.
> - Cell 2: enraged idle, the snowflakes shifted.
> - Cell 3: frozen glare, stronger (normal colors).
> - Cell 4: cracking from the crown down.
> - Cell 5: half shattered, falling.
> - Cell 6: a pile of ice shards with the fallen crown on top.

---

## 3. Thunder Roc (storm)

**Design:** a giant eagle-like bird with storm-blue feathers, white-tipped wings with lightning
crackling along the edges, a golden beak and talons, and yellow eyes. It is **in flight in every
cell**: wings spread, body about 380 px across, talons near the ground line.

**Roc 1**
> **Sheet: Thunder Roc 1.** Follow the rules. [Design.]
> - Cell 1: wings up, hovering.
> - Cell 2: wings level.
> - Cell 3: wings down.
> - Cell 4: wings level, head turned.
> - Cell 5: hurt, recoiling, feathers flying.
> - Cell 6: phase-change screech, head back and lightning all over its body.

**Roc 2**
> **Sheet: Thunder Roc 2.** Follow the rules. [Design.]
> - Cell 1: head thrown back, screeching.
> - Cell 2: three small lightning bolts leaving its wing tips, all inside the cell.
> - Cell 3: wings folding, starting a dive.
> - Cell 4: diving, talons forward.
> - Cell 5: a short lightning bolt from its beak.
> - Cell 6: a huge wingbeat, rising.

**Roc 3**
> **Sheet: Thunder Roc 3.** Follow the rules. [Design.] Cells 1–2 show the enraged Roc:
> lightning wrapped round its whole body and eyes blazing white.
> - Cell 1: enraged, wings up.
> - Cell 2: enraged, wings down.
> - Cell 3: rising high, only its talons and tail low in the cell, its body near the top line
>   but not crossing it.
> - Cell 4: falling, wings crumpled.
> - Cell 5: hitting the ground.
> - Cell 6: a heap of feathers on the ground.

---

## 4. Magma Wyrm (fire)

**Design:** a serpent-dragon of black cooling rock with glowing orange lava cracks, a horned
head, molten drool, and no wings or legs. Its coils rest on the ground line, and its neck rears
up so the head is near the top of the figure's 400 px height.

**Wyrm 1**
> **Sheet: Magma Wyrm 1.** Follow the rules. [Design.]
> - Cell 1: reared up, idle.
> - Cell 2: idle, the head swayed left.
> - Cell 3: idle, the head swayed right.
> - Cell 4: idle, jaws open with drool.
> - Cell 5: hurt, recoiling, chips of rock flying.
> - Cell 6: phase-change roar, its cracks blazing.

**Wyrm 2**
> **Sheet: Magma Wyrm 2.** Follow the rules. [Design.]
> - Cell 1: the head raised high, ready to strike.
> - Cell 2: the head slammed into the ground, with short lava cracks.
> - Cell 3: reared back, a magma ball glowing in its jaws.
> - Cell 4: spitting the magma ball, the ball still inside the cell.
> - Cell 5: a short gout of flame from its jaws, at most 150 px long.
> - Cell 6: sinking into a molten pool, half under.

**Wyrm 3**
> **Sheet: Magma Wyrm 3.** Follow the rules. [Design.] Cells 1–2 show the enraged Wyrm
> (molten core): mostly melted, glowing bright orange and yellow from inside.
> - Cell 1: enraged idle.
> - Cell 2: enraged idle, the head shifted.
> - Cell 3: bursting up out of a molten pool, with lava drops round it inside the cell.
> - Cell 4: the lava dimming, slumping.
> - Cell 5: collapsed in coils.
> - Cell 6: a cooled heap of dark rock.

---

## 5. Elder Treant (verdant)

**Design:** an ancient oak giant with a bark face, a moss beard, branch arms, root feet,
glowing green eyes, and small birds' nests in its leafy crown. **Its roots never move**: they
are planted in the same place in every cell.

**Treant 1**
> **Sheet: Elder Treant 1.** Follow the rules. [Design.]
> - Cell 1: idle.
> - Cell 2: idle, the crown swaying left.
> - Cell 3: idle, the crown swaying right.
> - Cell 4: idle, the arms lowered.
> - Cell 5: hurt, bark chips flying.
> - Cell 6: phase-change, both arms raised, the eyes blazing.

**Treant 2**
> **Sheet: Elder Treant 2.** Follow the rules. [Design.]
> - Cell 1: one branch arm raised.
> - Cell 2: the arm plunged into the ground, with short vines bursting up in front.
> - Cell 3: a branch swung back, holding a glowing seed.
> - Cell 4: flinging the seed, the seed still inside the cell.
> - Cell 5: a short volley of thorns from its open hand.
> - Cell 6: its crown blooming, with green light from its eyes and mouth.

**Treant 3**
> **Sheet: Elder Treant 3.** Follow the rules. [Design.] Cells 1–2 show the enraged Treant:
> autumn colors, glowing sap in the cracks and blazing eyes.
> - Cell 1: enraged idle.
> - Cell 2: enraged idle, the crown shifted.
> - Cell 3: the crown in full bloom (normal colors).
> - Cell 4: splitting down the middle.
> - Cell 5: falling apart, leaves dropping.
> - Cell 6: a dead stump.

---

## 6. Hollow King (shadow)

**Design:** a crowned, empty suit of royal robes with no body inside, only a black void with
two violet eyes. It has a tattered purple cape, empty gloves, and a broken iron crown floating
above the hood. **It floats**: the hem hovers 20 px above the ground line in every cell.

**King 1**
> **Sheet: Hollow King 1.** Follow the rules. [Design.]
> - Cell 1: floating idle.
> - Cell 2: idle, 6 px higher.
> - Cell 3: idle, the cape flowing left.
> - Cell 4: idle, the cape flowing right.
> - Cell 5: hurt, recoiling, the robe torn.
> - Cell 6: phase-change, arms spread and the eyes blazing.

**King 2**
> **Sheet: Hollow King 2.** Follow the rules. [Design.]
> - Cell 1: folding into its cape.
> - Cell 2: a column of violet smoke where it was.
> - Cell 3: reaching forward with a long shadow hand.
> - Cell 4: the shadow hand closing on the air.
> - Cell 5: firing a violet orb from its glove, the orb still inside the cell.
> - Cell 6: the robe tearing, two small shadow copies peeling off its sides.

**King 3**
> **Sheet: Hollow King 3.** Follow the rules. [Design.] Cells 1–2 show the enraged King: the
> void spilling out as smoke, the eyes blazing and the crown cracked in two.
> - Cell 1: enraged idle.
> - Cell 2: enraged idle, 6 px higher.
> - Cell 3: standing with the two shadow copies beside it.
> - Cell 4: the robe sagging.
> - Cell 5: the robe collapsing.
> - Cell 6: an empty robe on the floor with the crown fallen on it.

---

## 7. Boss helpers (one sheet each)

These are smaller figures. Use the same rules, but draw each helper **about 220 px tall**, still
standing 40 px above the bottom line.

**Root Node**
> **Sheet: Root Node.** Follow the rules, but the figure is about 220 px tall. A knot of thick
> roots shaped like a small shrine, with a glowing green seed in the middle. It never moves.
> - Cells 1–3: idle, the seed dim, medium and bright.
> - Cell 4: a beam of green light rising from the seed, inside the cell.
> - Cell 5: hurt, splinters flying.
> - Cell 6: broken roots, the seed dark.

**Sapling**
> **Sheet: Sapling.** Follow the rules, but the figure is about 200 px tall. A knee-high
> walking tree-child with twig arms, a leafy crown and big curious eyes.
> - Cell 1: idle.
> - Cell 2: idle with the leaves swaying.
> - Cell 3: arm back with a pebble.
> - Cell 4: throwing the pebble.
> - Cell 5: hurt.
> - Cell 6: a fallen twig pile.

**Hollow Shade**
> **Sheet: Hollow Shade.** Follow the rules, but the figure is about 240 px tall and floats
> 20 px above the ground line. A small hooded void-wraith with one violet eye and a sliver of
> the Hollow King's crown.
> - Cell 1: idle.
> - Cell 2: idle, 6 px higher.
> - Cell 3: fading into smoke.
> - Cell 4: reappearing from smoke.
> - Cell 5: hurt.
> - Cell 6: an empty hood on the floor.
