# Faster production for the next art batch

Use a shared queue of five-card jobs across all eight colours. Keep up to six lighter artist agents active. Each agent completes only its currently assigned packet, reports it and stops; the parent reviews it and dispatches another packet. Do not give an artist an entire 25-card colour assignment or carry the batch-08/09 whole-colour instructions into a future brief.

The parent claims each job before sending it to an idle artist:

```sh
node tools/card-art-packets.js <batch> assign-next <worker>
```

The returned `assigned` object contains the worker, packet, colour and exact five card IDs/names. Its `pendingCards` list excludes already saved IDs; generate only those on a resumed job, preserving existing sources and records. The dispatcher selects the available colour with the least saved work, preventing the last two colours from starting late. It reserves one writer per colour. `assigned: null` means no generation job is currently available; review any saved packets still awaiting acceptance. Do not start a second writer for the same colour.

After inspecting the packet's actual card crops and thumbnails, the parent pins its source hashes and releases the colour:

```sh
node tools/card-art-packets.js <batch> complete <worker>
node tools/card-art-packets.js <batch> assign-next <worker>
```

Dispatch immediately after acceptance; do not wait for every artist's current job to finish. Artists must await every outstanding generation and save every record before returning a packet. Reuse the artist's established style references and context; read the new packet's exact mechanics. Only edit the assigned colour manifest during that job.

An artist may generate up to four different assigned cards concurrently using awaited `Promise.allSettled`, with an explicit ID-to-result mapping and exact returned paths/fingerprints. Review and save each separately and atomically. Use the available image-service capacity; this scheduling change does not guarantee a particular render time. Stop on a usage-limit error, without quota retries or tool/model switching.

Reduce repaints through composition: request one prominent named subject in a horizontal arrangement on the square canvas, with quiet space above and below. Use a focal-point adjustment when it preserves the primary face, relevant hand and named object. Repaint when the source cannot fit those details into the card crop. Incidental scenery, trails and secondary figures may extend beyond the frame; do not repaint just to retain every background detail.

Keep editable sources exactly 512×512. Keep parent crop/thumbnail review, exact names and IDs, source-hash preservation, final image/markup checks, and the physical 200-source/600-crop delivery audit. Checkpoint and push saved work during production. Export and package once after the complete batch passes review.
