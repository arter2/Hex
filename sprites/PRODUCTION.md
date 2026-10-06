# Sprite production guide

## Start a sheet

1. Choose a class and variant under characters/. Keep an approved design reference in sources/ or record its stable URL and revision in the metadata.
2. Create an animation folder under that variant. Save a new revision of the PNG and matching JSON metadata; never overwrite an approved revision.
3. Import the PNG into the existing Sprite Workshop. Set frame size 128, start column 1, count 12. Use the direction row table below.
4. Review every direction at native resolution and in motion. Copy reviews/TEMPLATE.md to a uniquely named review file and record concrete corrections.
5. Submit the exact revision for approval. Copy approvals/TEMPLATE.md only when an actual approval decision is made. Record the approver, date, review path and SHA-256 of the PNG.
6. Integrate into gameplay separately after approval; adding these folders does not change the game renderer.

## Required output

| Property | Requirement |
| --- | --- |
| Format | Lossless PNG, 2048 × 2048 pixels |
| Frame | Exactly 128 × 128 pixels; 16 columns × 16 rows |
| Animation | Exactly 12 chronological frames per direction, columns 1–12 |
| Separation | One class, one variant, one animation per sheet |
| Background | Opaque, flat RGB (0,255,0), hex #00ff00, outside sprite and reserved label |
| View | Consistent isometric three-quarter top-down view |
| Pixels | Crisp hard edges; no antialiasing, blur, JPEG, or interpolated scaling |
| Identity | Same outfit, body proportions, headgear, weapon and palette in every frame |

Keep every gender, headgear, elemental palette and form on its own sheet.
Use a stable variant slug such as male-hat-normal or female-no-hat-shadow.
For additional distinctions, append an explicit slug (for example blue-crystal).
Keep chroma green out of character colors; record a suitable non-key green in the palette for nature assets.
Do not bake a detached projectile or spell effect into the character sheet: put it in vfx/ with its own metadata and origin/alignment notes.
Keep inventory icons in weapons/ as separately identified assets, not among the 12 animation frames.

## Canonical layout for new sheets

This is the repository default for new production sheets, not a claim about the layout of earlier images.
Directions describe screen-facing orientation, not world compass bearings.
Facing and movement are distinct: a backward walk can keep the character facing the camera.
Use an animation name such as walk-backward when motion differs from facing.

| Workshop row (1-based) | Direction | View |
| --- | --- | --- |
| 1 | Label only | Class, variant, animation, revision |
| 2 | s | Front, toward camera |
| 3 | sw | Front three-quarter, screen left |
| 4 | w | Screen left |
| 5 | nw | Rear three-quarter, screen left |
| 6 | n | Back, away from camera |
| 7 | ne | Rear three-quarter, screen right |
| 8 | e | Screen right |
| 9 | se | Front three-quarter, screen right |
| 10–16 | Unused | Solid green |

Rows 2–9 contain frames 01–12 in columns 1–12. Columns 13–16 remain green.
The label must stay entirely within row 1; no text or grid lines inside sprite cells.
All coordinates in metadata are zero-based pixels: frame origin x = frameIndex × 128,
y = (workshopRow − 1) × 128. The first south frame starts at (0,128).
Maintain a consistent ground-contact pivot and scale across frames and directions;
record the pivot rather than assuming the weapon tip or shadow defines it.
Never mirror asymmetric costumes or handed weapons without checking the result.
More directions can be added through a documented layout revision or additional explicitly named sheets;
do not silently reorder the eight canonical directions.

## Names and folders

Use lowercase ASCII kebab-case tokens, double underscores between filename fields,
and a three-digit revision:

`<class>__<variant>__<animation>__8dir__v001.png`

Matching metadata uses the same basename and .json extension.
Example:
`characters/elf-wizard/variants/male-no-hat-normal/animations/idle/elf-wizard__male-no-hat-normal__idle__8dir__v001.png`

Common animation slugs: idle, walk-forward, walk-backward, cast, attack, hurt, death.
These are starter names, not evidence that animations exist. Add new slugs as needed.
Use separate sheets for each animation, even when unused space remains.
Keep originals and design references in sources/; never classify them as approved just because they were imported.

## Review and approval

Technical checks are mandatory: dimensions, green background, 128-pixel grid,
12 usable frames for every required direction, no cropping, correct names and separation.
Then score each category 1–10: quality, uniqueness, reference consistency,
execution, ease of animation. Total must be strictly greater than 45/50.
A passing score makes a revision eligible for approval; it does not replace a real approval.
Do not invent scores, reviewer identities, or approvals. Missing reference means consistency is unverified.
Any technical failure blocks approval regardless of score.

Review states: draft → needs-changes or ready-for-approval → approved or rejected.
Every pixel change requires a new revision and review. Retain earlier review and approval history.
Workshop states are simpler: use Draft for draft/ready-for-approval, Needs changes for corrections
or rejection, and Approved only after the repository approval record exists.

## Preservation and current state

At setup, the repository contains hexmancers.html and sprites/README.md,
sprites/index.html and sprites/workshop.js. No image assets are committed.
The existing game and workshop are preserved. Browser imports and backups may contain
additional assets; this repository inspection cannot establish their content or approval status.
This scaffold adds no finished sprites and makes no existing artwork approval claims.
