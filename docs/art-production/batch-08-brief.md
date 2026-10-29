# Batch 08: the next 200 named illustrations

The parent assigns one colour (25 exact cards) from `batch-08-assignments.json`. Generate only those exact cards, working through that colour's five packets in order. Report each five-card packet immediately for parent review, then continue the next packet of your assigned colour. Do not start another colour without parent assignment. The full batch has 200 cards: 25 per colour, target 634 total. Work through only your assigned colour's packets; only one writer owns a colour at a time. Preserve all existing manifest records. Read ART-DIRECTION.md and actual mechanics in `docs/art-production/card-mechanics.json`, filtered by exact ID. View two supplied references and a previous accepted source before painting.

Generate separately with image generation. Explicitly request a 1:1 SQUARE canvas, intended for an editable 512-square master. All identity-critical faces/hands and entire named objects must fit x24..488,y105..407 on the normalized 512 square; quiet scenery fills the top and bottom. A horizontal arrangement helps the 206:141 card crop. Strong readable primary subject; painterly medieval fantasy materials and attractive light; no Disney/anime/photorealism/pixel art. Do not replace a named artifact with an unrelated spell scene. Inspect actual returned dimensions and the final square-normalized wide crop, not only the raw image. Use image generation for repairs.

After locating the raw output, run `node tools/card-art-source.js <raw-path> <card-id>` to prepare the actual editable **512x512 source PNG**. Record its `editableSourcePath` and `sourceNative` fields. Inspect that 512-square source and its wide crop before accepting it. If repainting, preserve your previous source in your own scratch directory before rerunning the source tool. Do not overwrite an earlier card.

Append each completed record immediately and atomically to your own `<colour>-generated.json`: `cardId`, exact `name`, `prompt`, `generatedPath`, `focalPoint:[0.5,0.5]`, `status:"generated"`, `batch:8`, and an honest `reviewNote`. Keep JSON valid with an actual newline, not a literal backslash-n. Never modify another colour or the shared registry, queue, focus file, README or exporter. No build, ZIP, commits, pushes, browser launches, network approval requests, or subagents. Parent handles review/integration; the user will request a ZIP when ready.

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

Complete the 25 assigned cards of your colour (minus any already saved batch-8 entries), then stop. Send progress after every two or three saved records and after each five-card packet. Count exact IDs, not generation attempts. Parent owns the shared ledger and final export. Read actual mechanics from `docs/art-production/card-mechanics.json`, filtered to your exact assigned IDs.

Critical crop review: do not accept a clipped face, spearhead, bottle stopper, tower tip or base. A focal-point adjustment may solve a crop; inspect the actual result. Otherwise repaint the composition with image generation, retaining the old source. Render crop reviews directly from the existing 512 source, without re-encoding or resizing it.

Prioritize one strong named subject and one clear action; you do not need to illustrate every numerical mechanic. Crop checks protect the primary face, relevant hand and named portable object. Incidental spell trails, halos, scenery and background figures may naturally extend beyond the frame. Do not add props or require a complete secondary magic ring when that weakens the named subject or causes needless repaints.

If image generation returns a usage limit, stop immediately and report the exact error. Do not retry the quota or switch tools/models. Check that your manifest parses after every atomic append: use a real newline, never a literal backslash-n suffix. Preserve all existing source bytes and records from batches 1–7.
