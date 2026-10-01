"""Packs the game for itch.io as an HTML5 upload: a zip with index.html at its root and the
stylesheet and scripts beside it (no tools, tests or art exports).
Run: python3 deck/tools/build-itch.py  ->  dist/hexmancers-itch.zip"""
import os, re, zipfile

DECK = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.normpath(os.path.join(DECK, '..', 'dist'))

def main():
    html = open(os.path.join(DECK, 'index.html')).read()
    files = ['index.html'] + re.findall(r'href="([\w.-]+\.css)"', html) + re.findall(r'src="([\w.-]+\.js)"', html)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'hexmancers-itch.zip')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(DECK, f), f)
    print('wrote', path, os.path.getsize(path) // 1024, 'KB:', ', '.join(files))

if __name__ == '__main__':
    main()
