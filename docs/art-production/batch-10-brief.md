# Batch 10: five-card jobs for the next 200 illustrations

The parent assigns exactly one five-card packet from `batch-10-packets.json`. Generate ONLY the missing IDs in that packet, then report and stop. Do not continue to another packet or reserve a whole colour. The parent reviews your five sources, releases your colour, and sends another explicit task from the shared queue. Only one active writer owns a colour. Read `PACKET-WORKFLOW.md`, `ART-DIRECTION.md`, and exact mechanics from `card-mechanics.json`. On your first job, view two supplied references directly under `game/cards/art/` plus an accepted master; reuse those style references on later jobs. Batch10 adds200 to834 for1034 active cards. Preserve all prior records and source bytes.


Generate separately with image generation. Explicitly request a 1:1 SQUARE canvas, intended for an editable 512-square master. All identity-critical faces/hands and entire named objects must fit x24..488,y105..407 on the normalized 512 square; quiet scenery fills the top and bottom. A horizontal arrangement helps the 206:141 card crop. Strong readable primary subject; painterly medieval fantasy materials and attractive light; no Disney/anime/photorealism/pixel art. Do not replace a named artifact with an unrelated spell scene. Inspect actual returned dimensions and the final square-normalized wide crop, not only the raw image. Use image generation for repairs.

After locating the raw output, run `node tools/card-art-source.js <raw-path> <card-id>` to prepare the actual editable **512x512 source PNG**. Record its `editableSourcePath` and `sourceNative` fields. Inspect that 512-square source and its wide crop before accepting it. If repainting, preserve your previous source in your own scratch directory before rerunning the source tool. Do not overwrite an earlier card.

Append each completed record immediately and atomically to your own `<colour>-generated.json`: `cardId`, exact `name`, `prompt`, `generatedPath`, `focalPoint:[0.5,0.5]`, `status:"generated"`, `batch:10`, and an honest `reviewNote`. Keep JSON valid with an actual newline, not a literal backslash-n. Never modify another colour or the shared registry, queue, focus file, README or exporter. No build, ZIP, commits, pushes, browser launches, network approval requests, or subagents. Parent handles review/integration; the user will request a ZIP when ready.

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

Complete only the current five-card packet, skipping already saved exact IDs. Save each record immediately and atomically. Await all generation promises, report the packet and stop. The parent owns the ledger, review, export, Git commits and push. Read actual mechanics for your exact assigned IDs.

Critical crop review: do not accept a clipped face, spearhead, bottle stopper, tower tip or base. A focal-point adjustment may solve a crop; inspect the actual result. Otherwise repaint the composition with image generation, retaining the old source. Render crop reviews directly from the existing 512 source, without re-encoding or resizing it.

Prioritize one strong named subject and one clear action; you do not need to illustrate every numerical mechanic. Crop checks protect the primary face, relevant hand and named portable object. Incidental spell trails, halos, scenery and background figures may naturally extend beyond the frame. Do not add props or require a complete secondary magic ring when that weakens the named subject or causes needless repaints.

If image generation returns a usage limit, stop immediately and report the exact error. Do not retry the quota or switch tools/models. Check that your manifest parses after every atomic append: use a real newline, never a literal backslash-n suffix. Preserve all existing source bytes and records from batches 1–9.

Generate up to FOUR different assigned cards concurrently using awaited `Promise.allSettled`, with explicit ID-to-result mapping. Preserve exact returned paths/fingerprints, inspect and save each separately. Never guess a shared output path. Stop on a usage-limit error; no quota retries or tool/model switching.

Copy the exact `name` string from the assignment JSON into the record rather than retyping it. ASCII and curly apostrophes differ; parent validation requires an exact catalogue-name match.

Production is paused by `usage_limit_reached` (HTTP429). The service reports reset 2026-10-30 21:33:05 UTC. Read batch-10-progress.md/json before resuming. All artists stopped; 40 sources are saved, 39 accepted and one awaiting a compact repaint. Do not issue new image generations before the reported reset or retry the quota through another tool/model/account. After the reset, remove generationPause from the parent worker state only when resuming the queued jobs.
