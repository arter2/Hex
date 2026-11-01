"""Package the game for an itch.io upload: python tools/package-itch.py [out-folder or .zip]

The zip is named hexmancers-itch-v<N>.zip, N being the game's version (index.html's application-version), and
written to the folder given (the current folder by default) unless a .zip path is given.

Ships game/ with index.html at the zip's root, minus what a player never loads:
  - cards/art/masters/          the 512x512 square sources the crops are cut from
  - cards/art/*.png             the older loose illustrations; every card that used one now has new art
                                (art-variants.js, which the game prefers), so nothing loads them
  - cards/art/display/           the separate crops: the game draws painted art from the atlas sheets in
                                cards/art/atlas (tools/card-art-build.js), so only the sheets ship
  - art-review.html             the art team's size-review page (package-art-test.py ships it for them)
  - the card build's inputs     cards/contract.json, palettes.json and art-focus.json, the icon and symbol SVGs that
                                tools/card-build.py compiles into cards/icons.js (the element icons do ship: they
                                load as pictures), cards/README.md, and allocate.js (a part-choosing tool the game
                                never loads)
Then checks the zip: index.html at the root, no more than itch's 1,000 files, every sheet the game names present, and
every entry readable (CRC). Prints the file count and size as JSON."""
import argparse
import json
import re
import zipfile
from pathlib import Path

ITCH_MAX_FILES = 1000
SKIP_NAMES = {".DS_Store", "Thumbs.db", ".gitkeep"}
BUILD_ONLY = {"allocate.js", "cards/README.md", "cards/contract.json", "cards/palettes.json", "cards/art-focus.json"}


def ships(rel):
    """Whether game/<rel> goes in the zip (tools/package-itch-packed.py ships the same files)."""
    parts = rel.parts
    if rel.name in SKIP_NAMES or "__pycache__" in parts:
        return False
    if rel.as_posix() == "art-review.html":
        return False
    if parts[:3] == ("cards", "art", "masters"):
        return False
    if parts[:2] == ("cards", "art") and len(parts) == 3 and rel.suffix.lower() == ".png":
        return False
    if parts[:3] == ("cards", "art", "display"):
        return False
    if rel.as_posix() in BUILD_ONLY:
        return False
    if parts[:2] == ("cards", "symbols") or (parts[:2] == ("cards", "icons") and not rel.name.startswith("element-")):
        return False
    return True


def version_of(game):
    found = re.search(r'<meta name="application-version" content="(\d+)"', (game / "index.html").read_text())
    if not found:
        raise SystemExit("index.html has no application-version")
    return found.group(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("output", type=Path, nargs="?", default=Path("."))
    args = parser.parse_args()
    game = Path(__file__).resolve().parent.parent / "game"
    version = version_of(game)
    if args.output.suffix.lower() != ".zip":
        args.output = args.output / f"hexmancers-itch-v{version}.zip"
    variants = (game / "cards/art-variants.js").read_text()
    named = set(re.findall(r"cards/art/atlas/[^\"'\s]+", variants))

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
    if not named:
        problems.append("art-variants.js names no atlas sheets: run node tools/card-art-build.js")
    if missing:
        problems.append(f"{len(missing)} atlas sheets named in art-variants.js are missing, e.g. {missing[0]}")
    if len(names) > ITCH_MAX_FILES:
        problems.append(f"{len(names)} files: itch.io takes at most {ITCH_MAX_FILES} in an HTML game's zip")
    print(json.dumps({"output": str(args.output), "version": version, "files": len(names), "mb": round(args.output.stat().st_size / 1048576, 1),
                      "unzippedMb": round(sum(f.stat().st_size for f in files) / 1048576, 1), "crc": "pass", "problems": problems}))
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
