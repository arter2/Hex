"""Build the itch.io zip from game/. Masters are never packaged.

A master is any PNG 515 px or wider (the full-size originals kept in art-masters/). They live
outside game/, and this script also skips any such PNG it finds under game/, so a master
cannot reach the zip even if one is copied in by mistake.

Usage: python3 tools/package-itch.py vN [out_dir]
"""
import os, sys, struct, zipfile

MASTER_MIN_PX = 515
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, "game")


def png_width(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">I", head[16:20])[0]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    version = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else ROOT
    out = os.path.join(out_dir, f"hexmancers-itch-{version}.zip")
    skipped, added = [], 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, _, files in os.walk(GAME):
            for name in sorted(files):
                full = os.path.join(dirpath, name)
                arc = os.path.relpath(full, GAME)
                if name.lower().endswith(".png") and (png_width(full) or 0) >= MASTER_MIN_PX:
                    skipped.append(arc)
                    continue
                z.write(full, arc)
                added += 1
    print(f"wrote {out}: {added} files, skipped {len(skipped)} masters")
    for s in skipped:
        print("  skipped master:", s)


if __name__ == "__main__":
    main()
