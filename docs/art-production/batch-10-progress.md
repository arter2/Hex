# Batch 10 production checkpoint

**Paused by the image service usage limit, not a completed 200-card delivery.**

40 new editable 512×512 sources are saved: 39 have passed parent crop/thumbnail review and one needs repainting. Another 160 sources have not been generated. The service reports a reset at **30 October 2026, 21:33:05 UTC** (`usage_limit_reached`, HTTP429). All artist runs have stopped; no quota retries or alternative generators were used.

Gnomish Bomb Lobber (`brown_machine_29`) needs a compact repaint: the machine extends beyond its source/crop. Its current source is preserved as an unapproved attempt. The other39 accepted source hashes are pinned in `batch-10-worker-state.json`. Seven complete packets and four cards from the pending Brown packet are reviewed.

The current runtime has834 illustrations. New sources will be registered after batch10 finishes and passes export/integrity checks. No complete batch10 ZIP or200-card handoff folder has been created. All3400 earlier runtime images,784 earlier generated-art records and66 supplied originals are preserved.

## Resume after the reported reset

1. Read `batch-10-progress.json`, `batch-10-brief.md`, `PACKET-WORKFLOW.md` and the exact assignments. Respect the service limit; if it still reports a usage limit, stop again.
2. Finish the pending Brown crop repair and missing packet IDs; preserve the39 accepted masters. Worker-state `running` entries reserve unfinished packets; they do not indicate live artist processes. Remove `generationPause` only when resuming after the reset.
3. Use the shared five-card dispatcher across all colours, up to six lighter artists and four explicitly mapped concurrent renders per artist. Do not duplicate already saved IDs or let two artists write one colour.
4. Once all200 pass parent review, export through batch10, run image/markup and preservation checks, and prepare `card-art-deliveries/batch-10-200/` with200 named masters,600 display crops and the updated Claude integration README. Audit the actual folder before committing/pushing.

## Saved source files

| Card | ID | Review | Source |
| --- | --- | --- | --- |
| Flash Bang Powder | `brown_instant_25` | Accepted | [512×512 PNG](../../game/cards/art/masters/brown_instant_25.png) |
| Shock Glove | `brown_instant_26` | Accepted | [512×512 PNG](../../game/cards/art/masters/brown_instant_26.png) |
| Goblin Rocket Rack | `brown_machine_28` | Accepted | [512×512 PNG](../../game/cards/art/masters/brown_machine_28.png) |
| Gnomish Bomb Lobber | `brown_machine_29` | Repaint required | [512×512 PNG](../../game/cards/art/masters/brown_machine_29.png) |
| Alchemist's Acid Mortar | `brown_machine_30` | Accepted | [512×512 PNG](../../game/cards/art/masters/brown_machine_30.png) |
| Hearty Feast | `fire_boon_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/fire_boon_08.png) |
| Paper Lantern Bomb | `fire_lob_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/fire_lob_10.png) |
| Goblin Flamethrower Post | `fire_sentry_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/fire_sentry_10.png) |
| Kitsune Foxfire | `fire_strike_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/fire_strike_08.png) |
| Dragon Scale Shield | `fire_ward_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/fire_ward_09.png) |
| Selkie Skin | `frost_boon_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_boon_09.png) |
| Grapeshot Bag | `frost_charge_07` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_charge_07.png) |
| Iceberg Field | `frost_environment_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_environment_08.png) |
| Coconut Lob | `frost_lob_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_lob_09.png) |
| Eye of the Frost Giant | `frost_piece_05` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_piece_05.png) |
| Whale Bone Arch | `frost_sentry_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_sentry_10.png) |
| Hurricane's Eye | `frost_strike_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_strike_08.png) |
| Ice Spike Pit | `frost_trap_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_trap_08.png) |
| Return to the Sea | `frost_utility_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_utility_08.png) |
| Sea Urchin Bed | `frost_ward_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/frost_ward_08.png) |
| Messenger Pigeon | `gray_summon_68` | Accepted | [512×512 PNG](../../game/cards/art/masters/gray_summon_68.png) |
| Night Owl Scout | `gray_summon_69` | Accepted | [512×512 PNG](../../game/cards/art/masters/gray_summon_69.png) |
| Horned Owl | `gray_summon_70` | Accepted | [512×512 PNG](../../game/cards/art/masters/gray_summon_70.png) |
| Quill Porcupine | `gray_summon_71` | Accepted | [512×512 PNG](../../game/cards/art/masters/gray_summon_71.png) |
| Spiny Hedgehog | `gray_summon_72` | Accepted | [512×512 PNG](../../game/cards/art/masters/gray_summon_72.png) |
| Witching Hour | `shadow_boon_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/shadow_boon_08.png) |
| Coffin Drop | `shadow_lob_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/shadow_lob_10.png) |
| Spider Nest | `shadow_sentry_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/shadow_sentry_10.png) |
| Crow Swarm | `shadow_strike_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/shadow_strike_08.png) |
| Demon Hide | `shadow_ward_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/shadow_ward_09.png) |
| Camel's Endurance | `storm_boon_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/storm_boon_08.png) |
| Golden Hail | `storm_lob_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/storm_lob_09.png) |
| Sandstone Idol | `storm_sentry_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/storm_sentry_10.png) |
| Tesla Arc | `storm_strike_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/storm_strike_08.png) |
| Djinn's Veil | `storm_ward_10` | Accepted | [512×512 PNG](../../game/cards/art/masters/storm_ward_10.png) |
| Mistletoe Sprig | `verdant_boon_07` | Accepted | [512×512 PNG](../../game/cards/art/masters/verdant_boon_07.png) |
| Sticky Sap Glob | `verdant_lob_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/verdant_lob_09.png) |
| Mandrake Patch | `verdant_sentry_08` | Accepted | [512×512 PNG](../../game/cards/art/masters/verdant_sentry_08.png) |
| Tiger's Rake | `verdant_strike_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/verdant_strike_09.png) |
| Oak Heartwood Shield | `verdant_ward_09` | Accepted | [512×512 PNG](../../game/cards/art/masters/verdant_ward_09.png) |
