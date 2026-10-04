# Hexmancers boss prompts

There's one prompt per boss. Send **Prompt 0** once at the start of the conversation, then send
one boss prompt per message. Each boss gets its own sheet. If a sheet breaks a rule (labels,
uneven cells, a figure crossing a cell edge, a soft background), reply:
"Redo this sheet. Follow the sheet rules exactly."

Why the rules are what they are:
- **Size.** The game draws a boss about 1.5× the size of a hero. A hero figure on your hero
  sheets is about 90 px tall, so a boss figure needs to be about 200 px tall. That gives it at
  least the same pixel detail when it's scaled up.
- **Cells.** I cut every frame by its cell. Equal cells with a shared ground line keep the boss
  from jumping between frames.
- **Facing.** The battle camera sits behind the player and looks at the enemy side, so bosses
  face the viewer. The game flips them left or right toward the player.
- **Background.** The flat green keys out cleanly, the same as on your hero sheets.

---

## Prompt 0: sheet rules (send first)

> I'm making boss sprite sheets for **Hexmancers**, a fantasy card battler on a hex grid. Every
> sheet follows these rules exactly. If a rule conflicts with making it look nice, follow the rule.
>
> **Style.** Match the hero sheets I've been making: high-detail 16-bit pixel art in the style
> of late-1990s arcade games, with bold readable silhouettes, a 1-pixel dark outline (a dark
> version of the local color, not pure black), light from the upper left and 3–5 step color
> ramps. Crisp square pixels: no blur, no soft glow, no gradients, no anti-aliasing into the
> background. Glows and magic are drawn as solid pixel shapes.
>
> **Canvas.** 1536 × 1024 pixels. Flat solid chroma green **#00FF00** everywhere, including
> between figures. No text, labels, titles, numbers, borders, panels or frames of any kind.
>
> **Grid.** An invisible grid of **6 columns × 4 rows**. Every cell is **256 × 256** px. One
> frame per cell. Every frame stands on the same ground line, **8 px above the bottom of its
> cell**. Nothing touches or crosses a cell edge: leave at least 6 px of green on every side.
>
> **Size.** In the idle frames the boss's body is **200–220 px tall** (flying or floating bosses:
> the body spans that much). It's the same size in every cell, so only the pose changes. Spell
> effects stay inside the cell.
>
> **View.** Front three-quarter view: the boss faces the viewer, turned slightly to **the
> viewer's right**. It's the same view in every cell. No back views or side views.
>
> **Consistency.** The same design, proportions, colors and props in every cell. No ground
> shadows. No other characters in the cells unless the prompt asks for them.
>
> **Reading order.** Cells are numbered left to right, top to bottom: row 1 is cells 1–6,
> row 2 is cells 7–12, row 3 is cells 13–18, row 4 is cells 19–24.
>
> Reply "Ready" and wait for the first boss.

---

## Shared layout (every boss uses it)

| Row | Cells | What |
|---|---|---|
| 1 | 1–4 | **Idle** loop, 4 frames: a clear breathing motion (rise 2–3 px, cape or flames shift) |
| 1 | 5–6 | **Hurt**: recoil, then recover |
| 2 | 7–9 | **Attack A**: wind-up, release, recover |
| 2 | 10–12 | **Attack B**: wind-up, release, recover |
| 3 | 13–15 | **Special**: the boss's signature move (named per boss) |
| 3 | 16–18 | **Shot**: a plain ranged attack (raise, fire, recover); the projectile leaves the cell edge on the right |
| 4 | 19 | **Phase change**: a roar or flare as it powers up |
| 4 | 20–21 | **Enraged idle**, 2 frames: the phase-3 look, brighter, cracked and angrier |
| 4 | 22–24 | **Death**: stagger, collapse, last frame mostly gone |

The game has 3 phases. At ⅔ and ⅓ health the boss powers up (cell 19), and in phase 3 it uses
the enraged look (cells 20–21).

---

## 1. Radiant Golem (light): Glowworm Hollows

> **Sheet: Radiant Golem.** Follow the sheet rules and the shared layout.
>
> **Design.** A towering golem of white marble and gold plates, broad and heavy, with a
> glowing prism core in its chest and light shining from the seams between its plates. Short
> thick legs, huge fists. The prism core is **pure white** in every cell (the game tints it to
> show the color it's weak to).
>
> - **Attack A (Quake):** raises both fists overhead, slams the ground, cracks of light run out
>   from its fists along the ground.
> - **Attack B (Boulders):** tears a marble chunk from its shoulder and hurls it overhand.
> - **Special (Prism turn), cells 13–15:** the core opens like a flower, flares, and closes;
>   its seams blaze.
> - **Shot:** a beam of light from the core.
> - **Enraged:** the plates crack wider, the seams blaze gold and white, and the core is
>   brighter.
> - **Death:** the plates fall away, the core flickers out, and the body crumbles into a heap
>   of marble.

## 2. Glacier Queen (frost): Frozen Deeps

> **Sheet: Glacier Queen.** Follow the sheet rules and the shared layout.
>
> **Design.** A regal ice sorceress queen, tall and slender, with a tall crystal crown, a gown
> of layered ice shards, a cape of frost mist drawn as solid pixel shapes, and an ice scepter
> in her right hand. Pale blue skin, white hair and a proud, cold face. Her gown spreads wide
> at the hem.
>
> - **Attack A (Ice Slam):** raises the scepter high, then drives it down; ice spikes burst up
>   at its tip.
> - **Attack B (Ice Wall):** sweeps her left hand across, and a low wall of ice blocks rises
>   in front of her.
> - **Special (Frozen Glare), cells 13–15:** her eyes and crown blaze white, and a ring of
>   frost spreads from her feet.
> - **Shot:** an ice shard shot from the scepter.
> - **Enraged (Blizzard):** her crown is taller and jagged, snow swirls round her as solid
>   flakes, and her gown is cracked with blue light.
> - **Death:** she shatters from the crown down, ending in a pile of ice shards and the fallen
>   crown.

## 3. Thunder Roc (storm): Storm Vault

> **Sheet: Thunder Roc.** Follow the sheet rules and the shared layout. The Roc is drawn
> **in flight in every cell, wings spread**. Its body and wings span about 220 px wide and
> 200 px tall, and its talons are at the ground line.
>
> **Design.** A giant eagle-like bird with storm-blue feathers, white-tipped wing edges,
> lightning crackling along the wing edges, a golden beak and talons, and yellow eyes.
>
> - **Attack A (Lightning Rods):** throws its head back and screeches, then three small bolts
>   leave its wing tips.
> - **Attack B (Dive):** wings fold, it plunges with its talons forward, and recovers.
> - **Special (Takes to the sky), cells 13–15:** a huge wingbeat lifts it, then it rises until
>   only its talons and tail show at the top of the cell, then it's gone (an empty cell is
>   fine for cell 15).
> - **Shot:** a lightning bolt from the beak.
> - **Enraged (Storm chains):** lightning wraps its whole body and its eyes blaze white.
> - **Death:** it falls from the sky, wings crumpled, and lands in a heap of feathers.

## 4. Magma Wyrm (fire): Ember Rifts

> **Sheet: Magma Wyrm.** Follow the sheet rules and the shared layout. The Wyrm rears up
> from coils on the ground: the coils sit on the ground line, and the raised neck and head
> reach about 210 px up.
>
> **Design.** A coiled serpent-dragon of black cooling rock with glowing orange lava cracks,
> a horned head and molten drool. No wings or legs.
>
> - **Attack A (Crack):** slams its head into the ground, and lava cracks spread from the
>   impact.
> - **Attack B (Fire Bomb):** rears back, then spits a ball of magma in an arc.
> - **Special (Burrow and erupt), cells 13–15:** sinks into a molten pool, is gone with only
>   the pool bubbling, then bursts up with lava flying.
> - **Shot:** a short gout of flame from its jaws.
> - **Enraged (Molten core):** most of the rock has melted away, so it glows bright orange
>   and yellow from inside.
> - **Death:** the lava dims to dark rock, and it slumps and crumbles into a cooling heap.

## 5. Elder Treant (verdant): Gilded Ruins

> **Sheet: Elder Treant.** Follow the sheet rules and the shared layout. The Treant **never
> walks**: its roots stay planted in every cell, and only the trunk, branches and face move.
>
> **Design.** An ancient oak giant with a bark face, a moss beard, branch arms, root feet,
> glowing green eyes, and small birds' nests in its leafy crown.
>
> - **Attack A (Vines):** plunges one branch arm into the ground, and vines erupt from the
>   ground in front of it.
> - **Attack B (Seed shot):** swings a branch overhand and flings a glowing seed.
> - **Special (The grove wakes), cells 13–15:** raises both branch arms, its crown blooms,
>   and green light pours from its eyes and mouth.
> - **Shot:** a thorn volley from its open hand.
> - **Enraged:** autumn colors, glowing sap running from its cracks, and its eyes blazing.
> - **Death:** it splits down the middle, leaves fall, and it ends as a dead stump.
>
> **Helpers on the same sheet are not needed.** Make Root Node and Sapling on the helpers
> sheet below.

## 6. Hollow King (shadow): The Abyss

> **Sheet: Hollow King.** Follow the sheet rules and the shared layout. The King **floats**:
> the hem of the robe hovers about 10 px above the ground line in every cell.
>
> **Design.** A crowned, empty suit of royal robes with no body inside, only a black void with
> two violet eyes. A tattered purple cape, gloves with nothing in them, and a broken iron crown
> floating above the hood.
>
> - **Attack A (Blink):** folds into its cape, then becomes a column of violet smoke, then
>   reappears.
> - **Attack B (Steal):** reaches forward with a long shadowy hand that grabs at the air.
> - **Special (Splits into shades), cells 13–15:** the robe tears, two small shadow copies
>   peel off its sides, and it stands with them.
> - **Shot:** a violet orb from its open glove.
> - **Enraged:** the void spills out as smoke, its eyes blaze, and the crown is cracked in two.
> - **Death:** the robe collapses empty to the floor and the crown falls onto it.

---

## 7. Boss helpers (one sheet)

> **Sheet: boss helpers.** Follow the sheet rules, but this sheet uses a grid of **6 columns
> × 3 rows** of 256 px cells on a **1536 × 768** canvas. Each row is one helper. Columns: 1–2
> idle, 3–4 attack (wind-up, release), 5 hurt, 6 death. Helpers stand on the same ground line
> as the bosses, at the heights given.
>
> 1. **Root Node** (verdant, ~110 px tall): a knot of thick roots shaped like a small shrine,
>    with a glowing green seed in the middle. It never moves; the idle frames pulse the seed.
>    For its attack, a beam of green light rises from the seed (it heals the Treant).
> 2. **Sapling** (verdant, ~100 px tall): a knee-high walking tree-child with twig arms, a
>    leafy crown and big curious eyes. It throws a pebble for its attack.
> 3. **Hollow Shade** (shadow, ~120 px tall): a small hooded void-wraith with one violet eye
>    and a sliver of the Hollow King's crown. For its attack it blinks (fades to smoke, then
>    reappears).

---

### After each sheet

Save it as a PNG at full size (1536 × 1024, helpers 1536 × 768) and upload it here.
