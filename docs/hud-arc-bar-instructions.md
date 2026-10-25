# Task: the Fire and Cast arc bars

Instructions for another model or artist taking over the curved bars on the battle's Fire and Cast buttons.

## What is wanted

The Fire and Cast buttons are quarter-circle stone frames, in the bottom corners of the battle screen. Each needs a
bar that **follows the button's curved edge, from the bolt at the top to the bolt at the bottom**, just inside the
stone rim. The owner sketched it as a red line on a screenshot:

- **Fire:** the line runs inside the curved rim, from near the top-left bolt down to the bottom-right bolt.
- **Cast:** the same line, mirrored, from near the top-right bolt down to the bottom-left bolt.

The bar must look like the art's own bar, not a flat stripe or a gradient. The art's bar is segmented orange stone
with metal end caps: pieces `fire_arc_empty`, `fire_arc_60` and `fire_arc_full` in the export. It must be **warped
along a spline that follows the button's arc**: the bar bends with the curve, its segments stay evenly spaced, and
its end caps sit at the two ends.

| Button | What the bar does |
|---|---|
| **Fire** | Shows the wand's charge. Not held: the empty bar. Held: the lit bar fills from the bottom up. Full: the whole bar lit, pulsing. |
| **Cast** | Lit full length (blue) while a card is queued. Empty bar when the queue is empty. |

## Where things are

| What | Where |
|---|---|
| The art export (key green, 2× nearest-neighbour) | `hexmancers-ui-keygreen-fixed/`. Pieces in `individual/`, sheet 01 is Fire/Cast and the arcs, crops listed in `manifest.json`. |
| Cutting a piece out | `tools/ui-svg.py`. `cut()` removes the key green and its fringe and trims; `pixelate()` shrinks it; `svg()` writes a pixel-exact SVG. |
| How the game's art is made | `python3 tools/ui-svg.py <export> game/ui used --div 3 --method lanczos --colors 128`: a third of the size, Lanczos, 128 colours. **Every overlay must be made the same way and be the same pixel size as its frame**, so it lines up when both are drawn at 100% × 100% of the button. |
| The current warp (a starting point) | `tools/ui-warp-bar.py` writes `game/ui/fire_bar_{empty,lit}.svg` and `cast_bar_{empty,lit}.svg`. |
| The CSS | `game/style.css`, the block "the charge bars (v146)". `#btnWand::before` holds the frame plus the empty bar; `#btnWand::after` holds the lit bar with a conic mask driven by `--ch`. |
| The charge value | `game/ui.js`, in `hud()`. `--ch` goes from 0 to 1 on `#btnWand`. Classes: `chg` while held, `chfull` when the charged shot is ready. |
| Left-handed | `body.fireR` swaps the sides. The frame layers are mirrored with `transform:scaleX(-1)`, so the bars mirror with them. |

## How the current warp works (`tools/ui-warp-bar.py`)

1. **Source bar.** Cut `fire_arc_full` (or `fire_arc_empty`) at full resolution.
   - Fit a circle to it.
   - Its real centre line is **not** that circle: it drifts by about 25 px. Measure the bar's middle angle by angle, in 4° bins, and fit a cubic.
   - Measure its half-width away from the end caps (the caps are wider than the bar).
2. **Target path.** An arc concentric with the button's curved edge, sampled as a Catmull-Rom spline.
   - Values below are in frame pixels at a third of the size. The frames are 121 × 130 (Fire) and 125 × 131 (Cast).
   - Fire: centre (5, 125), radius 103, from 76° down to 4° (counterclockwise from +x).
   - Cast: centre (120, 126), radius 103, from 104° to 176°.
3. **Inverse warp.** For every pixel of the frame-sized canvas, at full resolution:
   - Find the nearest spline point: that gives the distance along the path `s` (0–1) and the signed distance across `n`. Positive means outward, away from the button's square corner.
   - Sample the source at angle `top + s·(bottom − top)` and radius `R + centreline(angle) + n / kn`, with bilinear sampling.
   - `kn` maps the bar's own width onto ±5 frame pixels. The caps keep their size against it.
4. **Finish.**
   - Shrink a third with Lanczos and quantize to 128 colours, as for every other piece.
   - Write a pixel-exact SVG.
   - Cast's lit bar is the orange bar recoloured to blue: warm, saturated, bright pixels are mapped onto a blue ramp by brightness.
5. **Fire's fill in CSS.**
   - A conic mask about the arc's centre (4.13% 96.15% of the frame) reveals the lit bar from the bottom (CSS angle 88°) up to the top (12°), as `--ch` goes 0 → 1.

## Known problems to fix

- **Path placement:** the arc is a guess fitted by eye. Check it against the frame at 6× zoom, and adjust the centre, radius and end angles until the bar sits evenly inside the rim along its whole length.
- **The frame's painted lane:** `fire_normal` has an orange lane already painted inside its rim. It doesn't follow a perfect circle, so the bar may not cover it everywhere. Two options:
  - widen the bar a little;
  - or base Fire on `fire_inactive`, whose lane is dim. Note it's one pixel wider than `fire_normal` at the reduced size, so scale or crop to match.
- **Cast's blue** is a recolour. A hand-drawn blue bar (or a better hue mapping that keeps the gold end caps gold) would look better.
- **End caps:** check they don't overlap the frame's own bolts badly. If they do, shorten the end angles by a degree or two.

## How to check

- Run the warp, then render the frame with each bar on top at 4–6× zoom (nearest neighbour) on a mid-blue background, and look at them.
- In the game, run `node <script>` with Playwright (see `tools/playtest/` for examples):
  - start a fight;
  - set `B.player.charging=true; B.player.chargeT=k*chargeNeed(B.player)` for k = 0, 0.3, 0.65 and 1.2;
  - call `hud()`;
  - screenshot `#btnWand` and `#btnCast` at `deviceScaleFactor:3`.
- Repeat with `localStorage['hexmancers-fireside']='right'` for the left-handed layout.
- **Don't** change the camera, the board's size or anything outside the two buttons.
- **Ship:**
  - commit on branch `claude/hopeful-hypatia-stzuj0`;
  - push to it and to `main`;
  - zip `game/` as `hexmancers-itch-vN.zip`;
  - add a row to `docs/status.md`.
