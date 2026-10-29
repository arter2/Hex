"""Locate an automatically saved image by full base64 fingerprints, never by newest filename."""
import argparse
import base64
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("byte_count", type=int)
parser.add_argument("first", type=int)
parser.add_argument("second", type=int)
args = parser.parse_args()
matches = []
for file in Path("/workspace/generated_images").glob("*.png"):
    if file.stat().st_size != args.byte_count:
        continue
    encoded = base64.b64encode(file.read_bytes())
    first, second = 2166136261, 2654435769
    for char in encoded:
        first = ((first ^ char) * 16777619) & 0xffffffff
        second = ((second ^ char) * 2246822519) & 0xffffffff
    if (first, second) == (args.first, args.second):
        matches.append(str(file))
print(json.dumps({"matches": matches}))
if len(matches) != 1:
    raise SystemExit(1)
