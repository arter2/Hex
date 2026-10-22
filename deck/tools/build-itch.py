"""Packs the game for itch.io as an HTML5 upload: a zip with index.html at its root and the
stylesheet, scripts and the files the stylesheet points at (the bundled fonts) beside it, so
the game runs with no outside downloads (no tools, tests or art exports).
Run: python3 deck/tools/build-itch.py  ->  dist/hexmancers-itch.zip"""
import os, re, zipfile

DECK = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.normpath(os.path.join(DECK, '..', 'dist'))

def main():
    html = open(os.path.join(DECK, 'index.html')).read()
    css = re.findall(r'href="([\w.-]+\.css)"', html)
    files = ['index.html'] + css + re.findall(r'src="([\w.-]+\.js)"', html)
    # fonts and anything else a stylesheet loads by url(...), plus their license
    for c in css:
        for u in re.findall(r'url\(["\']?([\w./-]+)["\']?\)', open(os.path.join(DECK, c)).read()):
            if not u.startswith('data:') and u not in files: files.append(u)
    if os.path.exists(os.path.join(DECK, 'fonts', 'OFL.txt')): files.append('fonts/OFL.txt')
    missing = [f for f in files if not os.path.exists(os.path.join(DECK, f))]
    if missing: raise SystemExit('missing files: ' + ', '.join(missing))
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'hexmancers-itch.zip')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(DECK, f), f)
    print('wrote', path, os.path.getsize(path) // 1024, 'KB:', ', '.join(files))

if __name__ == '__main__':
    main()
