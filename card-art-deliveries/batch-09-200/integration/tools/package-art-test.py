"""Package the current game and artwork review page for local/itch.io testing."""
import argparse
import json
from pathlib import Path
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    game = root / "game"
    queue = json.loads((root / "docs/art-production/production-queue.json").read_text())
    if not (game / "art-review.html").exists():
        parser.error("Run node tools/card-art-check.js to create the review page first")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    readme = (
        "Hexmancers v179 painterly artwork test build\n"
        f"Active illustrated cards: {queue['active']}; remaining: {queue['total'] - queue['active']}.\n"
        "Open index.html for the game. Open art-review.html to compare card sizes.\n"
        "For local testing, serve this folder: python -m http.server 8000\n"
        "Visit http://localhost:8000 or http://localhost:8000/art-review.html\n"
        "Review-branch build: not merged. Final Safari/device layout testing remains pending.\n"
    )
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for file in sorted(game.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(game))
        archive.writestr("ART-TEST-README.txt", readme)
    with zipfile.ZipFile(args.output) as archive:
        failure = archive.testzip()
        if failure:
            raise RuntimeError(f"ZIP CRC failed: {failure}")
        names = archive.namelist()
        assert "index.html" in names and "art-review.html" in names
        result = {"output": str(args.output), "files": len(names), "bytes": args.output.stat().st_size, "crc": "pass"}
        if len(names) > 1000:
            result["itchNote"] = "More than 1,000 entries: consolidate assets before an itch.io upload."
        print(json.dumps(result))


if __name__ == "__main__":
    main()
