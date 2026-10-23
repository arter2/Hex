# Battle movement: tuning for a tight, non-sticky joystick (v113)

Goal: a phone joystick that feels as tight as Super Mario Bros., on both hex and square boards, with no
stickiness. Hits still count on whole tiles.

## What other games do

- **Super Mario Bros. 1** (from the game's known physics values): Mario moves on the first frame. Letting go
  slows him about 1.4× faster than he speeds up, and pushing the other way (a skid) about 2.7× faster. Taken
  literally, the timings are too slow for a small dodge board: about 0.7 s to reach walking speed and a slide of
  about 1.5 tiles. The tightness comes from the proportions and the first-frame response, so those are what the
  Mario preset keeps, scaled down in time.
- **Phone games with a floating joystick** (Brawl Stars, Archero, Soul Knight): the stick appears where your
  thumb lands, with a small dead zone, a minimum speed just outside it so a light push still moves you, and full
  speed before the rim. Starts and stops are close to instant.
- **Grid battlers** (Mega Man Battle Network, One Step From Eden): every stop lands on a tile and a flick moves one
  tile. The magnet here does that without the grid's stickiness.

## The scorer (`tools/movement-score.js`)

It drives the Movement lab with scripted thumb input at 60 fps, on a real-sized board, both hex and square:

- **Start and stop:** time to 90% speed, stop time and slide after letting go in 4 directions.
- **Stickiness:** pull-back (the magnet dragging you back against the way you went), pauses while settling,
  speed ripple and stalls during a steady push in 16 directions, and stuck frames sliding along each wall both ways.
- **Response:** time to skid round on a hard reverse, time to turn 90°, and swiping through the middle of the
  stick.
- **Flicks:** where 80, 150 and 250 ms flicks end up.
- **Dodge:** time to get out of your row.
- **Stop accuracy:** a player who has learned the slide lets go up to 67 ms early or late; how often they still
  end on the tile they wanted.

A held-out pass (`--holdout`) changes the board sizes, turns every push 20° and uses different timing errors, so a
profile can't win by fitting the test.

## Bugs it found (fixed in v113)

1. **Letting go just past a tile's middle stopped you dead in one frame.** The magnet aimed back at the middle you
   had just passed, and the "never step past the point" clamp then teleported you there with zero speed.
   - Now, while sliding, the magnet only takes you forward. It picks the middle of the tile you'd stop in, or a
     neighbour's.
   - It lands you there by braking a little harder or softer, never by pulling.
   - The clamp only applies while you are heading toward the point.
2. **Sliding along a wall crept up to it and stopped.** Each step spent its whole length on a half-step closer to
   the wall. Now the rest of the step slides along the wall.
3. **Hex edges caught you in their zigzag.** This hit the frontier with the enemy's half, the back wall, and the
   top and bottom.
   - The fix: your mage can stand anywhere in the biggest box your own tiles fully cover. Its edges are straight,
     so you glide along them, and you never stand off the grid.
   - On the zigzag front and back edges, you can't step past the middle of the hexes that stick out.
   - Squares fill their box exactly, so nothing changes there.
4. **Reversing used the slow braking rate.** It now has its own **Skid** setting (`mvMSkid`), like Mario's skid.

## Grades (score out of 100, average of hex and square)

| Profile | Main | Held-out | Notes |
|---|---|---|---|
| Old code, old defaults | 69 | n/a | 332 stuck frames sliding along hex walls, 0.23 s reverse, 0.22 s turn, slides up to 1 tile |
| New code, old defaults | 75 | 75 | Same settings with the bugs fixed: no stuck walls, no dead stops |
| **★ Tight** (Claude) | **95** | **91** | 0.03 s start, 0.05 s reverse, 0.02 s turn, 0.07–0.32 tile slide, 90–95% stop accuracy |
| **★ Mario** (Claude) | **94** | **91** | 0.05 s start, 0.07 s skid, slides 0.1–0.6 tiles, a little weight |
| Agent B, "mobile crisp" (Sonnet) | 95 | 91 | Nearly the same as Tight; its stick curve (dead zone 0.15, slowest 0.3, full at 0.7) went into both presets |
| Agent C, "grid-precise" (Haiku) | 95 | 91 | Stronger magnet (range 0.7, speed 5); Mario uses its magnet |
| Agent A, "Mario-faithful" (Sonnet) | 93 | 86 | 0.07 s speed-up: a little loose on the held-out boards |

Above about 95 the scorer can't tell profiles apart. Telling them apart is up to your thumb.

## The presets

| Setting | ★ Tight | ★ Mario | Default |
|---|---|---|---|
| Top speed (tiles/s) | 5.5 | 5.5 | 5 |
| Speed-up (s) | 0.03 | 0.05 | 0.1 |
| Braking (s) | 0.08 | 0.10 | 0.22 |
| Skid (s) | 0.03 | 0.04 | 0.22 |
| Turn grip | 1 | 0.93 | 0.7 |
| Magnet range (tiles) | 0.6 | 0.7 | 0.46 |
| Magnet top speed | 5 | 5 | 2.3 |
| Dead zone | 0.15 | 0.15 | 0.18 |
| Slowest | 0.3 | 0.3 | 0.25 |
| Full speed at | 0.7 | 0.7 | 0.8 |

Everything else is the default.

## Flicks (v114)

A quick flick, measured with real touch timing, did almost nothing. A 70–100 ms push carried you 0.4–0.5 of a
tile, short of the next tile's magnet, so you stopped between tiles in the same lane, and the flick back landed you
on your old middle. With the old 0.22 s skid, rocking your thumb fast drifted you about a quarter tile one way per
swing, because each reverse came before the old speed had bled off.

- **Flick to dodge** (`mvFlick`, on): a push that leaves the stick's middle and is let go mid-swipe within
  **Flick time** (`mvFlickMs`, 180 ms) dodges a whole tile, to the middle of the next tile that way at full speed.
  A flick back returns you to your tile's middle. On hex, the tiles beside you sit half a tile up or down, so
  flicks in a row keep to the line the first set off from: left, right, left, right returns to the same tile every
  time.
- **Skid** now defaults to 0.08 s (it was 0.22 s, the same as braking), so rocking the stick turns you round
  instead of drifting.

## Flick to throw (v115)

The v114 flick still often didn't register on a phone. It only counted if your thumb left the stick's middle and let
go within 180 ms, still outside the middle, and a natural flick is often longer than that or springs back first.
It also only moved one tile, so it felt like no momentum was kept.

Now a flick is read from how fast your thumb is still moving as you let go (its last 90 ms), however long you held
before:

| Setting | Default | What it does |
|---|---|---|
| Flick to throw (`mvFlick`) | on | |
| Lightest flick (`mvFlickV0`) | 450 px/s | Slower lets go slide to a stop as usual |
| Hardest flick (`mvFlickV1`) | 1400 px/s | |
| Light flick tiles (`mvFlickMin`) | 2 | One tile glided, landing on the second |
| Hard flick tiles (`mvFlickMax`) | 3 | Two tiles glided, slowing and landing on the third; flicks between round between |
| Glide time (`mvFlickTime`) | 0.4 s | You're launched at the speed that covers the distance in this time, slowing evenly all the way, so you land on the tile's middle with no pull |

A flick back returns you (counting your own tile's middle first if it is still ahead of you), and on hex,
flicks in a row keep to the line the first started from.
