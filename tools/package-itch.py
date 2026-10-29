"""Package the game for an itch.io upload: python tools/package-itch.py out/hexmancers-itch.zip

Ships game/ with index.html at the zip's root, minus what a player never loads:
  - cards/art/masters/          the 512x512 square sources the crops are cut from
  - cards/art/*.png             the older loose illustrations; every card that used one now has new art
                                (art-variants.js, which the game prefers), so nothing loads them
  - cards/art/display/ files    that art-variants.js does not name (crops for cards not in the game)
  - art-review.html             the art team's size-review page (package-art-test.py ships it for them)
Then checks the zip: index.html at the root, no more than itch's 1,000 files, every crop the game names present, and
every entry readable (CRC). Prints the file count and size as JSON."""
import argparse
import json
import re
import zipfile
from pathlib import Path

ITCH_MAX_FILES = 1000
SKIP_NAMES = {".DS_Store", "Thumbs.db", ".gitkeep"}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    game = Path(__file__).resolve().parent.parent / "game"
    variants = (game / "cards/art-variants.js").read_text()
    named = set(re.findall(r"cards/art/display/[^\"'\s]+", variants))

    def ships(rel):
        parts = rel.parts
        if rel.name in SKIP_NAMES or "__pycache__" in parts:
            return False
        if rel.as_posix() == "art-review.html":
            return False
        if parts[:3] == ("cards", "art", "masters"):
            return False
        if parts[:2] == ("cards", "art") and len(parts) == 3 and rel.suffix.lower() == ".png":
            return False
        if parts[:3] == ("cards", "art", "display") and rel.as_posix() not in named:
            return False
        return True

    files = sorted(f for f in game.rglob("*") if f.is_file() and ships(f.relative_to(game)))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file in files:
            archive.write(file, file.relative_to(game).as_posix())

    with zipfile.ZipFile(args.output) as archive:
        failure = archive.testzip()
        if failure:
            raise SystemExit(f"ZIP CRC failed: {failure}")
        names = set(archive.namelist())
    problems = []
    if "index.html" not in names:
        problems.append("index.html is not at the zip's root")
    missing = sorted(n for n in named if n not in names)
    if missing:
        problems.append(f"{len(missing)} crops named in art-variants.js are missing, e.g. {missing[0]}")
    if len(names) > ITCH_MAX_FILES:
        problems.append(f"{len(names)} files: itch.io takes at most {ITCH_MAX_FILES} in an HTML game's zip")
    print(json.dumps({"output": str(args.output), "files": len(names), "mb": round(args.output.stat().st_size / 1048576, 1),
                      "unzippedMb": round(sum(f.stat().st_size for f in files) / 1048576, 1), "crc": "pass", "problems": problems}))
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
