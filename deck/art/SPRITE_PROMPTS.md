# Hexmancers sprite prompts (fresh start)

Paste **Prompt 0** into ChatGPT once at the start of the conversation, then send the sheet
prompts one at a time. One sheet per message keeps each figure large and consistent. If a sheet
comes back with text inside the cells, blur, or figures of different sizes, reply: "Redo this
sheet. Follow the sheet rules exactly."

---

## Prompt 0: style bible (send first)

> I'm making sprite sheets for **Hexmancers**, a fantasy card battler played on a hex grid. You'll
> make several sheets. Every sheet follows these rules exactly; if a rule conflicts with making it
> look nice, follow the rule.
>
> **Look.** True pixel art in the style of mid-1990s high-end arcade games (Capcom CPS-2 and SNK
> Neo Geo fighters), slightly chibi proportions (head about 1/4.5 of body height). Bold shapes,
> big readable silhouettes, clean color clusters. Not painterly, not an upscaled illustration,
> not 3D-rendered.
>
> **Pixels.** Every pixel is a crisp square of one solid color. No blur, no soft glow, no
> gradients, no anti-aliasing against the background, no dithering noise, no single stray
> pixels. Every figure uses the same pixel size.
>
> **Outline and light.** A closed 1-pixel dark outline around every figure (dark versions of the
> local color, not pure black). One light source from the upper left: lit edges upper left,
> shadow lower right. Each material gets a 3–5 step color ramp. A figure uses at most 32 colors.
>
> **Background and grid.** Flat solid magenta background **#FF00FF** everywhere, including
> between figures. No frames, borders, panels, labels, numbers, titles or text of any kind.
> Figures sit in an invisible grid of equal square cells, one figure per cell, all standing on
> the same baseline near the bottom of the cell. The tallest figure in a sheet nearly fills its
> cell; nothing touches or crosses a cell edge. No shadows on the ground.
>
> **Bodies.** Arms, hands, legs and feet are attached and clearly jointed (shoulder, elbow,
> wrist, hip, knee). Limbs are separate from the robe or body so they can be animated. Faces
> read clearly: eyes, brow, mouth, plus a nose for humanoids.
>
> **Consistency.** The same character keeps the same proportions, colors, outfit, hair, hat and
> props in every cell of its row. Only the pose changes.
>
> **Element colors** (every enemy, boss and hero belongs to one):
> - **Fire:** red, orange, ember yellow, soot black.
> - **Frost:** ice blue, white, pale cyan, steel grey.
> - **Storm:** electric yellow, deep blue, violet sparks.
> - **Verdant:** leaf green, moss, bark brown.
> - **Light:** white, gold, warm cream.
> - **Shadow:** purple, near black, sickly violet glow.
>
> Reply "Ready" and wait for the first sheet.

---

## Player sheets: one per race (9 sheets)

The player is a battle-mage seen **from behind** in battle (three-quarter back view, facing up
and slightly right). The camp screen shows the **front** view. Each race needs a man and a woman,
each with a hat and without one.

### Template: replace the bracketed parts

> **Sheet: [RACE] player.** A grid of 4 rows × 8 columns of equal square cells.
>
> **Rows (same character design throughout each row):**
> 1. [RACE] man **with** hat
> 2. the same man **without** the hat (same hair, same everything else)
> 3. [RACE] woman **with** hat
> 4. the same woman **without** the hat
>
> **Columns:**
> 1. back view, idle
> 2. back view, idle (breathing: shoulders 1 pixel lower)
> 3. back view, walk (left foot forward)
> 4. back view, walk (right foot forward)
> 5. back view, cast: staff raised high in the right hand, focus glowing
> 6. back view, hurt: recoiling, still full size
> 7. front view, idle (facing the viewer, slightly to the right)
> 8. front view, cast
>
> **Character:** [DESCRIPTION]
>
> The staff is always in the right hand and is the same staff in every cell. Keep the figure the
> same height in every column except the hurt pose. Follow the style bible exactly.

### Race descriptions: paste one into [DESCRIPTION]

1. **Human.** A road-worn hedge wizard. Deep blue robe with a white hood and collar, brown belt
   with a brass buckle, brown boots. Tall blue pointed hat with a drooping tip and an orange band.
   Man: short chestnut hair, short beard. Woman: long copper hair in a loose braid. Wooden staff
   topped with a blue crystal that glows.
2. **Elf.** Tall and slender (a head taller than the human), long pointed ears. Forest green
   robe with gold leaf trim, white sash. Wide-brimmed green hat with a feather. Long straight
   pale-blond hair. White birch staff with a cyan leaf-shaped crystal.
3. **Dwarf.** Short and broad (two thirds of the human's height), heavy boots, thick hands.
   Charcoal coat over a rust-orange tunic, riveted leather bracers, belt of tools. Short
   brown-leather wide-brim hat. Man: big braided red beard. Woman: two thick red braids, freckles.
   Iron-shod staff topped with a burning ember.
4. **Undead.** A sorcerer who came back from the barrow. Pale grey-blue skin with visible
   cheekbones (no gore). Tattered grey-black robe with teal trim, bone clasps. Wide black hat
   with a frayed brim. Man: bald, glowing teal eyes. Woman: long white hair, glowing teal eyes.
   Bone staff with a teal soul-flame.
5. **Witch.** A dark witch of the violet coven. Deep purple dress-robe with black lace edges,
   a charm belt with small vials and runes. Tall crooked purple witch hat with a gold band.
   Woman: long wavy auburn hair. Man: shoulder-length black hair, thin moustache. Twisted dark
   wood staff with a magenta orb.
6. **Necromancer.** Grave-green and black hooded robe with a bone-white collar and ribs
   stitched on the back. "Hat" = deep pointed hood that shades the face; hatless = hood down.
   Man: shaved head with green tattoo lines. Woman: long black hair with one white streak.
   Glowing green eyes. Staff topped with a small horned skull holding a green flame.
7. **Shaman.** Antlered spirit-caller of the old forest. Brown hide tunic, fur mantle, bone
   beads, red face paint. "Hat" = antlered fur headdress; hatless = no headdress, feathers in the
   hair. Man: dark hair in a topknot. Woman: long braided black hair. Gnarled staff wrapped in
   vines with a green spirit-light.
8. **Ranger.** A ranger-mage of the border woods. Moss-green hooded cloak, leather jerkin, a
   quiver of arrows and a short bow strapped on the back. "Hat" = green hood up; hatless = hood
   down. Man: brown hair, short stubble. Woman: blond hair in a high ponytail. Ash staff with a
   pale green crystal.
9. **Orc.** Big and muscular (a bit taller and much broader than the human), green skin, small
   tusks. Red-and-brown war kilt, leather harness crossed over a bare back, bone fetishes. "Hat"
   = red bandana with a bone ornament; hatless = shaved sides with a black topknot (man) or long
   red braid (woman). Heavy totem staff with a white-blue lightning crystal.

---

## Sheet 10: monsters (front view, facing the viewer slightly to the left)

> **Sheet: monsters.** A grid of 8 rows × 4 columns of equal square cells. Each row is one
> monster. Columns: 1 idle, 2 idle (breathing or flicker: a visible change such as a flame
> shape shifting or a body squashing 1–2 pixels), 3 attack wind-up, 4 hurt. Each monster has a
> unique silhouette; no two share a body plan. The largest monsters nearly fill their cell.
>
> 1. **Gloop** (verdant): a big translucent green slime, wobbly dome shape with smaller blobs
>    and bubbles visible inside it, two dark eyes and a wide grin. Fills about 80% of the cell.
> 2. **Gloopling** (verdant): a small green slime the size of a head, one eye, a droplet on
>    top. Draw it at about 55% of the cell height.
> 3. **Cinder Wisp** (fire): a floating flame spirit with a small skull of coal at its heart,
>    two ember eyes, a flame tail instead of legs, sparks around it.
> 4. **Frost Mite** (frost): a dog-sized ice beetle-tick with six crystal legs, a domed shell of
>    blue ice with frost cracks, little pincers.
> 5. **Volt Beetle** (storm): a big armored stag beetle with a glossy dark-blue shell, yellow
>    lightning veins and crackling horn-mandibles.
> 6. **Thunder Ram** (storm): a stocky ram with huge curled horns sparking with electricity,
>    shaggy grey-blue wool, glowing yellow eyes, lowered head.
> 7. **Shade** (shadow): a hunched ghost of smoke and purple shadow with long clawed arms,
>    a ragged hood and two violet eyes, fading into wisps below the waist.
> 8. **Halo Sprite** (light): a small winged fairy-knight of light, white and gold, a glowing
>    halo ring above its head, four dragonfly wings, a tiny spear.

## Sheet 11: humanoid enemies (front view)

> **Sheet: humanoid enemies.** A grid of 6 rows × 4 columns of equal square cells. Each row is
> one character. Columns: 1 idle, 2 idle (breathing), 3 casting a card (one hand forward with a
> glowing card), 4 hurt. Each character fills about 85% of the cell height and has its own
> silhouette.
>
> 1. **Ember Cultist** (fire): a hooded cultist in red-orange robes with a soot-black mask, a
>    burning brazier-staff, a belt of scroll cases.
> 2. **Frost Witch** (frost): a witch in ice-blue robes with a white fur collar, a crown of icicles,
>    frost-white hair, a crystal wand.
> 3. **Storm Caller** (storm): a bearded sky-priest in deep-blue robes with yellow zigzag trim,
>    a copper lightning-rod staff, sparks around one raised hand.
> 4. **Grove Warden** (verdant): an elf archer in a leaf cloak with a living-wood longbow,
>    antler circlet, green war paint.
> 5. **Dawn Paladin** (light): a knight in white plate with gold trim, a sun emblem on the chest,
>    a tall kite shield and a sword, an open helm showing the face.
> 6. **Hex Knight** (shadow): a knight in jagged black armor with violet glowing seams, a horned
>    closed helm, a curved dark blade, a torn purple cape.

## Sheet 12: bosses, part 1 (front view)

> **Sheet: bosses 1.** A grid of 3 rows × 4 columns of equal square cells. Each row is one boss;
> each boss nearly fills its cell. Columns: 1 idle, 2 idle (breathing: a visible change), 3
> attack, 4 enraged (glowing, more aggressive pose).
>
> 1. **Glacier Queen** (frost): a regal ice sorceress queen with a tall crystal crown, a gown of
>    layered ice shards, a cape of frost mist made of solid shapes, an ice scepter. Proud, cold
>    face.
> 2. **Radiant Golem** (light): a towering golem of white marble and gold plates with a glowing
>    prism core in its chest and light shining from the seams.
> 3. **Hollow King** (shadow): a crowned empty suit of royal robes with no body inside, only a
>    void with two violet eyes. A tattered purple cape and a broken iron crown floating above.

## Sheet 13: bosses, part 2 (front view)

> **Sheet: bosses 2.** Same layout and columns as bosses 1.
>
> 1. **Elder Treant** (verdant): an ancient oak giant with a bark face, moss beard, branch arms
>    and root feet, glowing green eyes, small birds' nests in its crown.
> 2. **Magma Wyrm** (fire): a coiled serpent-dragon of black cooling rock with glowing lava
>    cracks, a horned head rearing up, molten drool.
> 3. **Thunder Roc** (storm): a giant eagle-like bird with storm-blue feathers, wings spread wide,
>    lightning crackling along the wing edges, a golden beak and talons.

## Sheet 14: boss helpers (front view)

> **Sheet: boss helpers.** A grid of 3 rows × 4 columns, columns as in bosses 1.
>
> 1. **Root Node** (verdant): a knot of thick roots shaped like a small shrine, with a glowing
>    green seed in the middle. It never moves, so the idle shows the seed pulsing. About 60% of
>    the cell height.
> 2. **Sapling** (verdant): a knee-high walking tree-child with twig arms, a leafy crown and big
>    curious eyes. About 55% of the cell height.
> 3. **Hollow Shade** (shadow): a small hooded void-wraith with one violet eye and a sliver of the
>    Hollow King's crown. About 65% of the cell height.

## Sheet 15: heroes (allies; they fight beside the player)

> **Sheet: heroes.** A grid of 6 rows × 4 columns of equal square cells. Columns: 1 back view
> idle, 2 back view casting, 3 front view idle, 4 front view casting. Each hero fills about 90% of
> the cell and is clearly more ornate than an ordinary enemy.
>
> 1. **Pyra, the Ember Queen** (fire): a fire queen in a crimson gown with a flame crown, wild
>    orange hair that ends in flames, a fireball in one hand.
> 2. **Ysolde of the Rime** (frost): an elf frost mage in silver-blue robes with a snowflake
>    tiara, long white hair, an ice staff.
> 3. **Captain Volta** (storm): a sky-pirate captain in a navy coat with brass buttons and a
>    tricorn hat, a lightning saber, a sparking pistol, an eyepatch.
> 4. **The Thornfather** (verdant): an old forest druid with huge antlers, a beard of moss and
>    thorns, a robe of bark and leaves, a crooked branch staff.
> 5. **Sir Aurelion** (light): a winged holy knight in gold-and-white armor, feathered wings,
>    a greatsword and a round sun shield.
> 6. **The Nightwidow** (shadow): a veiled spider-queen in black lace with four spider legs
>    rising from her back, a scythe, pale skin and violet eyes.

---

### After each sheet

Save it as a PNG at full size. When all the sheets are in, upload them here. The magenta
background lets me cut every figure cleanly. The equal cells let the frames line up for
animation, and the duplicate idle frame gives each sprite a real idle loop.
