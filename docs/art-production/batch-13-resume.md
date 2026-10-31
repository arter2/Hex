# Batch 13 resume history and integration instructions

Production resumed after the reported reset, confirmed by a successful `brown_instant_80` render. Current counts are in `batch-13-progress.json`; the 14-source checkpoint described below is historical. Follow the live parent-owned ledger and skip already saved IDs.

**14 of 200 sources saved and parent crop/thumbnail-reviewed. 186 remain ungenerated.** This is a partial checkpoint, not a finished 200-image delivery. No batch-13 delivery folder or ZIP has been prepared. The runtime remains the completed 1434-card batch-12 baseline.

## Image-service pause

The service returned HTTP 429 `usage_limit_reached`. It reported Unix reset timestamps 1793483510–1793483511: **2026-10-31 21:51:50–51 UTC**. No quota retries or alternate generators were used. Successful in-flight results were saved with exact card IDs, complete prompts, raw paths, source dimensions and editable source paths. Parent review adjusted the Force Bubble, Kelpie and Nixie crop positions; all 14 reviewed source hashes are pinned in `batch-13-worker-state.json`.

Do not start new image calls before the reported reset. After checking the current server time is past that reset, remove `generationPause` from the parent-owned ledger and set the existing six reserved worker states back to `running`. Resume the SAME packet IDs from `batch-13-packets.json`, skipping already saved card IDs. Read `batch-13-brief.md` first. Do not regenerate the 14 saved cards merely because they are not exported yet. Continue parent review and dispatch until the exact 200 assignments are complete.

## Batch allocation and preservation

This batch finishes the remaining 11 Brown cards and generates 27 in each other colour. Exactly 200 unique IDs are reserved in `batch-13-assignments.json`; 45 packets contain up to five cards, with smaller final packets. The baseline commit is `84293195279d8c2d94214ce59b01f5e7f381498e`. Preserve all 1384 earlier generated records, 5800 earlier runtime image files, and 66 supplied originals.

## Integration for Claude

The partial sources are canonical `game/cards/art/masters/<card-id>.png`, mapped by the batch-13 records in `docs/art-production/*-generated.json`. Exact saved cards, SHA-256 values, focal points and review status are listed in `batch-13-progress.json` and its Markdown companion. Do not replace the batch-12 registry with a partial batch-13 registry or describe this checkpoint as 200 new images.

After ALL 200 assigned sources are complete and parent-approved, build through batch 13, run the image/markup checks and queue refresh, then prepare a fresh incremental handoff with `node tools/card-art-handoff.js /workspace/card-art-batch-13 200 --batch=13`. Update the integration README for 1634 combined active cards and this unequal colour allocation. Audit the new folder with `tools/card-art-audit.js`: exactly 200 PNG masters and 600 WebP crops, all unique/disjoint from the earlier 1434 cards. The baseline metadata manifest is `delivery-1434-card-images.json`. The intended finished folder is `card-art-deliveries/batch-13-200/` on `art/1634-card-handoff`; it does not exist at this partial checkpoint. Keep earlier delivery folders untouched. Verify the final remote commit before reporting completion.
