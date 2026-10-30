# Batch 02: next 32 named illustrations

Read ART-DIRECTION.md and batch-02-assignments.json in this folder. Each colour owns exactly four assigned cards. The parent integrates and exports; colour workers only generate images and append records to their own `<colour>-generated.json`. Preserve previous records. Do not edit shared registries, focal-point files, the queue or other colours' manifests.

Read the exact assigned mechanics from `/tmp/hex-art-card-mechanics.json` (filter by ID; do not dump the full catalogue). View two supplied references, e.g. `game/cards/art/o-yoroi-lacquer-plate-red-ropes-256.png` and `game/cards/art/elven-mirror-shield-512.png`, to ground the painterly direction. Do not turn cards into unrelated generic symbols.

Use image generation for every new illustration. Generate each card separately, sequentially, with a distinct scene faithful to its name and mechanics. No spritesheets, grids, frames, labels or UI. Painterly medieval fantasy, expressive materials, strong lighting, readable subject, no Disney/anime/photorealism/pixel art. Ask for a square image intended for a 512-square master. Keep ALL identity-critical faces/hands/named objects within x24..488,y105..407 in 512 coordinates; a horizontal arrangement and generous quiet top/bottom scenery help. The visible card crop is 206:141. Complete objects such as bottles must fit cork-to-base in that safe band.

For brand-new images omit both image-selection arguments. The image tool automatically saves its original PNG in `/workspace/generated_images`. Use the exact path returned by THAT call's output hint. Never choose the newest shared-directory file or guess its name: other workers generate concurrently. Never echo or manually save base64. Forward completed image results using generatedImage when required by the tool.

Inspect each result and verify both the subject/card identity and safe placement. A crop repair, if needed, must use image generation with your own inspected original as the reference. Do not artistically edit images using Python/Canvas. Parent's deterministic exporter handles technical 512 normalization and render sizes.

Append a record immediately after each successful illustration so progress survives interruptions: `cardId`, exact `name`, `prompt`, `generatedPath`, `focalPoint:[0.5,0.5]`, `status:"generated"`, `batch:2`, and `reviewNote` describing actual visual identity/crop review. Write JSON atomically. Do not claim the whole card/catalogue complete; export and final crop review happen afterward. If a tool fails, report the card as pending rather than silently substituting art from another card.

Return the four exact IDs and generated paths. No git commits, pushes, browser launches, network permission requests, or subagents. Parent owns integration. Continue through all four cards without asking for confirmation.
