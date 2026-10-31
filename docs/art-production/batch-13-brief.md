# Batch 13: shared packets for the next 200 illustrations

The parent assigns exactly one five-card packet from `batch-13-packets.json`. Generate ONLY the missing IDs in that packet, then report and stop. Do not continue to another packet or reserve a whole colour. The parent reviews your five sources, releases your colour, and sends another explicit task from the shared queue. Only one active writer owns a colour. Read `PACKET-WORKFLOW.md`, `ART-DIRECTION.md`, and exact mechanics from `card-mechanics.json`. On your first job, view two supplied references directly under `game/cards/art/` plus an accepted master; reuse those style references on later jobs. Batch 13 adds 200 to the 1434-card baseline for 1634 active cards. Preserve all prior records and source bytes.


Generate separately with image generation. Explicitly request a 1:1 SQUARE canvas, intended for an editable 512-square master. All identity-critical faces/hands and entire named objects must fit x24..488,y105..407 on the normalized 512 square; quiet scenery fills the top and bottom. A horizontal arrangement helps the 206:141 card crop. Strong readable primary subject; painterly medieval fantasy materials and attractive light; no Disney/anime/photorealism/pixel art. Do not replace a named artifact with an unrelated spell scene. Inspect actual returned dimensions and the final square-normalized wide crop, not only the raw image. Use image generation for repairs.

After locating the raw output, run `node tools/card-art-source.js <raw-path> <card-id>` to prepare the actual editable **512x512 source PNG**. Record its `editableSourcePath` and `sourceNative` fields. Inspect that 512-square source and its wide crop before accepting it. If repainting, preserve your previous source in your own scratch directory before rerunning the source tool. Do not overwrite an earlier card.

Append each completed record immediately and atomically to your own `<colour>-generated.json`: `cardId`, exact `name`, `prompt`, `generatedPath`, `focalPoint:[0.5,0.5]`, `status:"generated"`, `batch:13`, and an honest `reviewNote`. Keep JSON valid with an actual newline, not a literal backslash-n. Never modify another colour or the shared registry, queue, focus file, README or exporter. No build, ZIP, commits, pushes, browser launches, network approval requests, or subagents. Parent handles review/integration; the user will request a ZIP when ready.

The image tool auto-saves originals. Use the exact returned PNG path. Never pick a file just because it is newest. If the result omits a path, keep the full result in the same functions call or store it. Extract the base64 part of its `image_url`, without printing it, and compute fingerprints:

```js
let a=2166136261,b=2654435769;
for(let i=0;i<s.length;i++){
  a=Math.imul(a^s.charCodeAt(i),16777619)>>>0;
  b=Math.imul(b^s.charCodeAt(i),2246822519)>>>0;
}
const bytes=s.length*3/4-(s.endsWith('==')?2:s.endsWith('=')?1:0);
```

Then run `python tools/card-art-locate.py <bytes> <a> <b>` from the repo. It matches the full-content fingerprints to an automatically saved PNG and returns exactly one path. No base64 is printed or manually written. If there is no unique match, report it; do not fabricate a path or overwrite another card. Do not recover by generic visual subject: batch 10 caught a wrong duplicate mapping that way. Keep the exact image result/path/fingerprint. If the result cannot be mapped uniquely, report it instead of guessing.

Complete only the current five-card packet, skipping already saved exact IDs. Save each record immediately and atomically. Await all generation promises, report the packet and stop. The parent owns the ledger, review, export, Git commits and push. Read actual mechanics for your exact assigned IDs.

Critical crop review: do not accept a clipped face, spearhead, bottle stopper, tower tip or base. A focal-point adjustment may solve a crop; inspect the actual result. Otherwise repaint the composition with image generation, retaining the old source. Render crop reviews directly from the existing 512 source, without re-encoding or resizing it.

Prioritize one strong named subject and one clear action; you do not need to illustrate every numerical mechanic. Crop checks protect the primary face, relevant hand and named portable object. Incidental spell trails, halos, scenery and background figures may naturally extend beyond the frame. Do not add props or require a complete secondary magic ring when that weakens the named subject or causes needless repaints.

If image generation returns a usage limit, stop immediately and report the exact error. Do not retry the quota or switch tools/models. Check that your manifest parses after every atomic append: use a real newline, never a literal backslash-n suffix. Preserve all existing source bytes and records from batches 1–12.

Generate up to FOUR different assigned cards concurrently using awaited `Promise.allSettled`, with explicit ID-to-result mapping. Preserve exact returned paths/fingerprints, inspect and save each separately. Never guess a shared output path. Stop on a usage-limit error; no quota retries or tool/model switching.

Copy the exact `name` string from the assignment JSON into the record rather than retyping it. ASCII and curly apostrophes differ; parent validation requires an exact catalogue-name match.


Composition and durability lessons from batch 10:
- Compose the main subject in the middle 60% of the square, with quiet scenery above and below. For an artifact with an operator, put the compact object BESIDE the face at the same height. A tall object hanging below a face cannot fit the wide crop. Horizontal quivers, low cauldrons, smaller jars, and compact machines work better.
- Protect the primary face/eyes, relevant hands and entire named portable artifact. A hero/creature portrait may naturally crop incidental legs, wing tips, a weapon extremity or background scenery if identity/action remain clear. Do not repaint for a decorative halo or secondary magic ring.
- Save EACH exact raw mapping and prepared source record immediately and atomically, before starting another repair or waiting for the whole packet. A remaining repair must never delay saving the other four. Keep honest review notes; parent approval is separate.
- Request 1:1 square illustration only. Do not add a card frame, text, runes or UI. Final editable PNG must be exactly512x512, with nice lighting and painterly medieval/high-fantasy style matched to the supplied references.

`output_hint` is OPTIONAL. Immediately retain the complete successful result (for example with `store`) before inspecting fields. Missing `output_hint` means use the retained `image_url` fingerprint procedure, never throw away that image. When reporting failures, emit `String(error)`, `error.message`, and available code/status/reset fields; `JSON.stringify(Error)` can misleadingly produce `{}`. Report an actual quota response separately from your own JavaScript/result-handling failures.


Batch 13 persistence rules:
1. Immediately store the COMPLETE successful image result keyed by exact card ID before reading optional fields. If output_hint is absent, retain image_url and compute the exact fingerprints. Never throw away a successful result because an optional hint is missing.
2. Prepare the actual512×512 source FIRST. Then construct one complete record with batch13, exact name/ID, prompt, raw path, editableSourcePath, sourceNative, focalPoint, status and honest notes. Do not publish a partial record and patch fields afterward.
3. Serialize the whole valid array to a temporary file and atomically replace the manifest. Prefer Python json.dump followed by f.write(chr(10)) so command escaping cannot introduce a literal backslash-n suffix. Parse after every save. One writer owns the colour; serialize that writer's appends.
4. Store each card's mapping and source record as soon as it is ready. Do not delay all other cards for a remaining render or repair.
5. If the workspace transport disconnects, retain all successful result payloads and exact paths, pause new image calls, and report the actual error. Parent will reconnect the environment. Missing auto-save files can be materialized from retained exact image bytes with verified fingerprints; that is recovery of an existing result, not a new render. Do not guess files by recency.
6. Standalone artifacts are welcome. Do not add an operator merely for face/hand rules. If an operator is present, put the compact artifact beside the face at the same height. Main faces/eyes/hands and named artifact features must fit the true206:141 crop; incidental hair, limbs, weapon extremities, scenery and magic trails may extend. Keep the style grounded and painterly, with strong lighting and clear silhouettes, not toy/cartoon/anime.

Batch 13 contains 11 remaining Brown cards and 27 cards in each other colour: exactly 200. Its 45 packets have up to five cards each; final packets can contain one or two. Generate exactly the assigned packet length. All 5800 earlier runtime image paths and 1384 earlier generated records must remain unchanged. For repairs, COPY the previous canonical to scratch; never move/delete it while a render is pending. Prepare a replacement separately and atomically replace only when ready. Always include the original exact prompt in the complete record.
