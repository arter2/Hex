# Batch 06: continue to 234 unique card illustrations

Use `batch-06-assignments.json` for your exact colour assignments: four cards per colour, all batch 6. Skip IDs already saved; preserve all 19 earlier records. Read ART-DIRECTION.md and actual mechanics in `/tmp/hex-art-card-mechanics.json`, filtered by exact ID. View two supplied painterly references and a previous accepted master before painting.

Generate separately with image generation. Explicitly request a 1:1 SQUARE canvas, intended for an editable 512-square master. All identity-critical faces/hands and entire named objects must fit x24..488,y105..407 on the normalized 512 square; quiet scenery fills the top and bottom. A horizontal arrangement helps the 206:141 card crop. Strong readable primary subject; painterly medieval fantasy materials and attractive light; no Disney/anime/photorealism/pixel art. Do not replace a named artifact with an unrelated spell scene. Inspect actual returned dimensions and the final square-normalized wide crop, not only the raw image. Use image generation for repairs.

After locating the raw output, run `node tools/card-art-source.js <raw-path> <card-id>` to prepare the actual editable **512x512 source PNG**. Record its `editableSourcePath` and `sourceNative` fields. Inspect that 512-square source and its wide crop before accepting it. If repainting, preserve your previous source in your own scratch directory before rerunning the source tool. Do not overwrite an earlier card.

Append each completed record immediately and atomically to your own `<colour>-generated.json`: `cardId`, exact `name`, `prompt`, `generatedPath`, `focalPoint:[0.5,0.5]`, `status:"generated"`, `batch:6`, and an honest `reviewNote`. Keep JSON valid with an actual newline, not a literal backslash-n. Never modify another colour or the shared registry, queue, focus file, README or exporter. No build, ZIP, commits, pushes, browser launches, network approval requests, or subagents. Parent handles review/integration; the user will request a ZIP when ready.

The image tool auto-saves originals. Use the exact returned PNG path. Never pick a file just because it is newest. If the result omits a path, keep the full result in the same functions call or store it. Extract the base64 part of its `image_url`, without printing it, and compute fingerprints:

```js
let a=2166136261,b=2654435769;
for(let i=0;i<s.length;i++){
  a=Math.imul(a^s.charCodeAt(i),16777619)>>>0;
  b=Math.imul(b^s.charCodeAt(i),2246822519)>>>0;
}
const bytes=s.length*3/4-(s.endsWith('==')?2:s.endsWith('=')?1:0);
```

Then run `python tools/card-art-locate.py <bytes> <a> <b>` from the repo. It matches the full-content fingerprints to an automatically saved PNG and returns exactly one path. No base64 is printed or manually written. If there is no unique match, report it; do not fabricate a path or overwrite another card. Visually reviewed orphan images may also be recovered by explicit card identity, with a review note, rather than blindly guessing by timestamp.

Continue all four assigned cards (minus already generated entries). Send progress after every two or three records. Return exact IDs/paths when the colour is complete.
