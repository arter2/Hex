"""Builds review/data.json for the card review page from dump.js output: card fields, ability
text and each card's 64x64 art as a small PNG. Run: node dump.js > cards.json && python3 build_review.py cards.json"""
import sys, json, base64, io
from PIL import Image
d = json.load(open(sys.argv[1]))
def png(csv):
    rows = [r.split(',') for r in csv.strip().split('\n')]
    im = Image.new('RGB', (len(rows[0]), len(rows)))
    im.putdata([tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for r in rows for h in r])
    im = im.quantize(64, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
for c in d['cards']: c['art'] = png(c['art'])
json.dump(d, open('review/data.json', 'w'), separators=(',', ':'))
import os; print('review/data.json', os.path.getsize('review/data.json'))
