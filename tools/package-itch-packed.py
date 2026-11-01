"""The release itch.io zip: python tools/package-itch-packed.py [out-folder or .zip]

The release build. game/ stays the dev build (run it as it is, edit it as it is); this script copies what
package-itch.py would ship into memory, rewrites the copy, and zips it. Nothing under game/ is changed.

  1. Card art: shipped as package-itch.py ships it, the per-colour atlas sheets (tools/card-art-build.js), so
     there is nothing more to do for it here. (One WebP per card was this step before the sheets; packing the art
     into a script was tried and dropped: it doubled the start-up download and the JS memory.)
  3. sprites.js: its PNG data URIs become lossless WebP (exact: every pixel, alpha included, is kept).
  4. ui/*.svg: the pixel-run SVGs (tools/ui-svg.py) become palette PNGs of the same pixels, checked pixel by
     pixel against the SVG's runs, then inlined.
  5. The card kit parts (cards/frames, textures, foils, effects, glows, badges, icons, symbols), the fonts and
     the menu picture are inlined too. What the stylesheets name becomes a data: URI held in a custom property on
     :root (inlined straight into @font-face, where var() does not work); what ui.js builds at run time
     (status and role icons, the kit's frame/texture/foil, the element icon) comes from pack.js through
     hexAsset(path), which hands out a blob: URL per file. ui.js's four call sites are patched in the copy; if one
     no longer matches, the build stops and says which, so a change to ui.js cannot silently ship broken art.
Also left out: cards/*.json, cards/README.md and ui/sizes.json, which the game never loads.

Then it checks the zip: CRC, index.html at the root, no more than itch's 1,000 files, every atlas sheet
art-variants.js names present, and no shipped file still naming a file this build removed. Prints counts and sizes as JSON.
docs/packing.md has the when and why."""
import argparse
import base64
import importlib.util
import io
import json
import re
import urllib.parse
import zipfile
from pathlib import Path

from PIL import Image

ITCH_MAX_FILES = 1000
NEVER_LOADED = {"ui/sizes.json"}  # beyond what package-itch.py already leaves out
_spec = importlib.util.spec_from_file_location("package_itch", Path(__file__).resolve().parent / "package-itch.py")
package_itch = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(package_itch)
# folders whose every file this build inlines or packs (or drops, when nothing names it)
INLINED_DIRS = ("ui/", "cards/frames/", "cards/textures/", "cards/foils/", "cards/effects/", "cards/glows/",
                "cards/badges/", "cards/icons/", "cards/symbols/", "fonts/", "cards/fonts/", "art/ui/")
KEEP = re.compile(r"\.(txt)$")  # font licences stay as files
# what ui.js builds at run time: these families go into pack.js
PACKED_FAMILIES = (r"ui/[^/]+\.svg", r"cards/icons/element-[^/]+\.svg", r"cards/(textures|frames|foils|effects)/.+\.svg")
# ui.js call sites that build an asset path, and what they become in the copy (old, new, how many)
UI_PATCHES = [
    ("""src="ui/'+statusArt(t)+'.svg\"""", """src="'+hexAsset('ui/'+statusArt(t)+'.svg')+'\"""", 1),
    ("""src="ui/${cardArt(c)}.svg\"""", """src="${hexAsset('ui/'+cardArt(c)+'.svg')}\"""", 2),
    ("""kitURL=p=>'url(cards/'+p+')'""", """kitURL=p=>'url('+hexAsset('cards/'+p)+')'""", 1),
    ("""src="cards/icons/element-${kc}${kc==='white'?'-ink':''}.svg\"""",
     """src="${hexAsset('cards/icons/element-'+kc+(kc==='white'?'-ink':'')+'.svg')}\"""", 1),
]
# after patching, no shipped script may still build a path into the inlined folders
FORBIDDEN_IN_JS = ('"ui/', "'ui/", "`ui/", "url(cards/", "cards/icons/", "cards/frames/", "cards/textures/",
                   "cards/foils/", "cards/effects/")
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf"}
UI_RUN = re.compile(r"M(\d+) (\d+)h(\d+)v1h-\3z")
UI_PATH = re.compile(r'<path fill="#([0-9a-f]{6})" d="([^"]*)"/>')
UI_HEAD = re.compile(r'^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 (\d+) (\d+)" width="\1" height="\2" '
                     r'shape-rendering="crispEdges">(.*)</svg>\s*$', re.S)


def staged_files(game):
    """What package-itch.py ships, as {path: bytes}."""
    return {f.relative_to(game).as_posix(): f.read_bytes()
            for f in sorted(game.rglob("*")) if f.is_file() and package_itch.ships(f.relative_to(game))}


def b64(data):
    return base64.b64encode(data).decode("ascii")


def webp_sprites(files, stats):
    """Step 3: sprites.js PNG data URIs to lossless WebP."""
    src = files["sprites.js"].decode()
    before = after = 0

    def swap(m):
        nonlocal before, after
        png = base64.b64decode(m.group(1))
        im = Image.open(io.BytesIO(png))
        im = im.convert("RGBA")
        out = io.BytesIO()
        im.save(out, "WEBP", lossless=True, exact=True, method=6)
        back = Image.open(io.BytesIO(out.getvalue())).convert("RGBA")
        if back.tobytes() != im.tobytes():
            raise SystemExit("sprites.js: a lossless WebP did not round-trip")
        best = ("webp", out.getvalue()) if len(out.getvalue()) < len(png) else ("png", png)
        before += len(png)
        after += len(best[1])
        return f"data:image/{best[0]};base64,{b64(best[1])}"

    files["sprites.js"] = re.sub(r"data:image/png;base64,([A-Za-z0-9+/=]+)", swap, src).encode()
    stats["sprites"] = {"mbBefore": round(before / 1048576, 2), "mbAfter": round(after / 1048576, 2)}


def ui_png(svg_text, name):
    """Step 4: a tools/ui-svg.py pixel-run SVG as a palette PNG of the same pixels."""
    m = UI_HEAD.match(svg_text)
    if not m:
        raise SystemExit(f"{name}: not the pixel-run SVG tools/ui-svg.py writes")
    w, h, body = int(m.group(1)), int(m.group(2)), m.group(3)
    paths = UI_PATH.findall(body)
    if "".join(f'<path fill="#{c}" d="{d}"/>' for c, d in paths) != body:
        raise SystemExit(f"{name}: has something besides <path fill d> runs")
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for color, d in paths:
        if UI_RUN.sub("", d):
            raise SystemExit(f"{name}: a path is not 1-pixel runs")
        rgb = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
        for x, y, n in UI_RUN.findall(d):
            for i in range(int(n)):
                px[int(x) + i, int(y)] = rgb + (255,)
    colors = sorted({c for c, _ in paths})
    out = io.BytesIO()
    if len(colors) < 256:
        pal = Image.new("P", (w, h), 0)
        index = {tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)): k + 1 for k, c in enumerate(colors)}
        raw = im.tobytes()
        pal.putdata([index[tuple(raw[i:i + 3])] if raw[i + 3] else 0 for i in range(0, len(raw), 4)])
        pal.putpalette([0, 0, 0] + [v for c in colors for v in (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))])
        pal.save(out, "PNG", transparency=0, optimize=True)
    else:
        im.save(out, "PNG", optimize=True)
    if Image.open(io.BytesIO(out.getvalue())).convert("RGBA").tobytes() != im.tobytes():
        raise SystemExit(f"{name}: the PNG does not match the SVG's pixels")
    return out.getvalue()


def asset_bytes(files, path, ui_cache):
    """The bytes and MIME type an inlined path ships as (UI SVGs as their PNG)."""
    if path.startswith("ui/") and path.endswith(".svg"):
        if path not in ui_cache:
            ui_cache[path] = ui_png(files[path].decode(), path)
        return ui_cache[path], "image/png"
    return files[path], MIME[Path(path).suffix.lower()]


def data_uri(data, mime):
    if mime == "image/svg+xml":
        return "data:image/svg+xml," + urllib.parse.quote(data.decode(), safe=" /:=;,'-_.!~*()@")
    return f"data:{mime};base64,{b64(data)}"


def inline_css(files, ui_cache, stats):
    """Step 5 (and 4's stylesheet half): every url() a stylesheet names, inlined."""
    used = set()
    for css in [p for p in files if p.endswith(".css")]:
        text = files[css].decode()
        base = Path(css).parent
        props = {}

        def resolve(raw):
            ref = raw.strip().strip("'\"")
            if ref.startswith(("data:", "blob:", "http:", "https:", "#")) or ref.startswith("var("):
                return None
            p = (base / ref).as_posix()
            p = "/".join(q for q in p.split("/") if q not in ("", "."))
            return p if p in files and Path(p).suffix.lower() in MIME else None

        out, pos = [], 0
        # @font-face first: var() is not allowed there, so these are inlined straight in
        for m in re.finditer(r"@font-face\s*\{[^}]*\}|url\(\s*([^)]*?)\s*\)", text):
            if m.group(0).startswith("@font-face"):
                block = m.group(0)

                def font(mm):
                    p = resolve(mm.group(1))
                    if not p:
                        return mm.group(0)
                    used.add(p)
                    return 'url("' + data_uri(*asset_bytes(files, p, ui_cache)) + '")'
                out.append(text[pos:m.start()] + re.sub(r"url\(\s*([^)]*?)\s*\)", font, block))
            else:
                p = resolve(m.group(1))
                if not p:
                    out.append(text[pos:m.end()])
                    pos = m.end()
                    continue
                used.add(p)
                if p not in props:
                    props[p] = f"--pk-{re.sub(r'[^a-z0-9]+', '-', Path(css).stem.lower())}-{len(props)}"
                out.append(text[pos:m.start()] + f"var({props[p]})")
            pos = m.end()
        out.append(text[pos:])
        text = "".join(out)
        if props:
            root = ":root{" + "".join(f'{name}:url("{data_uri(*asset_bytes(files, p, ui_cache))}");'
                                      for p, name in props.items()) + "}\n"
            # after any @charset/@import, which must come first
            head = re.match(r"(\s*(@charset[^;]*;|@import[^;]*;|/\*.*?\*/)\s*)*", text, re.S).end()
            text = text[:head] + root + text[head:]
        files[css] = text.encode()
        stats.setdefault("css", {})[css] = len(props)
    return used


def write_pack(files, ui_cache, stats):
    """Step 5 (and 4's run-time half): pack.js, and ui.js's call sites pointed at it."""
    family = re.compile("^(" + "|".join(PACKED_FAMILIES) + ")$")
    entries = {}
    for p in sorted(files):
        if family.match(p):
            data, mime = asset_bytes(files, p, ui_cache)
            entries[p] = [mime, b64(data)]
    body = ",\n".join(f"{json.dumps(p)}:{json.dumps(v, separators=(',', ':'))}" for p, v in entries.items())
    files["pack.js"] = (
        "// Packed by tools/package-itch-packed.py: the art ui.js names at run time (status and role icons, the card kit's\n"
        "// frames, textures, foils and effects, the element icons), one blob: URL per file the first time it is asked for.\n"
        "const HEX_PACK={\n" + body + "\n};\n"
        "const HEX_PACK_URL={};\n"
        "function hexAsset(p){ if(HEX_PACK_URL[p]) return HEX_PACK_URL[p]; const e=HEX_PACK[p];\n"
        "  if(!e){ console.warn('pack.js: no '+p); return p; }\n"
        "  const b=atob(e[1]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);\n"
        "  return HEX_PACK_URL[p]=URL.createObjectURL(new Blob([u],{type:e[0]})); }\n").encode()
    ui = files["ui.js"].decode()
    for old, new, count in UI_PATCHES:
        if ui.count(old) != count:
            raise SystemExit(f"ui.js: expected {count} of {old!r}, found {ui.count(old)}. "
                             "Update UI_PATCHES in tools/package-itch-packed.py to match ui.js.")
        ui = ui.replace(old, new)
    files["ui.js"] = ui.encode()
    html = files["index.html"].decode()
    first = re.search(r'<script src="[^"]+"></script>', html)
    files["index.html"] = (html[:first.start()] + '<script src="pack.js"></script>\n' + html[first.start():]).encode()
    stats["pack"] = {"files": len(entries)}
    return set(entries)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("output", type=Path, nargs="?", default=Path("."))
    args = parser.parse_args()
    game = Path(__file__).resolve().parent.parent / "game"
    version = package_itch.version_of(game)
    if args.output.suffix.lower() != ".zip":
        args.output = args.output / f"hexmancers-itch-v{version}.zip"
    files = staged_files(game)
    before = {"files": len(files), "mb": round(sum(map(len, files.values())) / 1048576, 1)}
    before_names = set(files)
    stats, ui_cache = {}, {}

    for p in NEVER_LOADED:
        files.pop(p, None)
    sheets = set(re.findall(r"cards/art/atlas/[^\"'\s]+", files["cards/art-variants.js"].decode()))
    webp_sprites(files, stats)
    used = inline_css(files, ui_cache, stats) | write_pack(files, ui_cache, stats)
    removed = {p for p in files if p.startswith(INLINED_DIRS) and not KEEP.search(p)}
    unnamed = sorted(removed - used)
    for p in removed:
        del files[p]

    problems, warnings = [], []
    texts = {p: files[p].decode() for p in files if p.endswith((".js", ".css", ".html")) and p != "pack.js"}
    for p, text in texts.items():
        if p.endswith(".css"):
            text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
            text = re.sub(r'url\("data:[^"]*"\)', "", text)  # inlined already (and the fragments inside them)
            for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)", text):
                if ref.startswith(("data:", "blob:", "http", "#", "%23")):
                    continue
                if (Path(p).parent / ref).as_posix().lstrip("./") in before_names:
                    problems.append(f"{p} still names {ref}")
                else:  # not in the dev build either: a broken reference the game already has
                    warnings.append(f"{p} names {ref}, which is not in game/ (missing in the dev build too)")
        if p.endswith(".js"):
            text = re.sub(r"hexAsset\('[^']*'", "", text)  # the patched call sites
        for gone in removed:
            if gone in text:
                problems.append(f"{p} names {gone}, which this build removed")
        if p.endswith(".js") and p != "three.min.js":
            for s in FORBIDDEN_IN_JS:
                if s in text:
                    problems.append(f"{p} builds a path with {s!r}: add it to UI_PATCHES")
    if not sheets:
        problems.append("art-variants.js names no atlas sheets: run node tools/card-art-build.js")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for p in sorted(files):
            archive.writestr(zipfile.ZipInfo(p, date_time=(2026, 1, 1, 0, 0, 0)), files[p],
                             compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(args.output) as archive:
        failure = archive.testzip()
        if failure:
            raise SystemExit(f"ZIP CRC failed: {failure}")
        names = set(archive.namelist())
    if "index.html" not in names:
        problems.append("index.html is not at the zip's root")
    missing = sorted(u for u in sheets if u not in names)
    if missing:
        problems.append(f"{len(missing)} atlas sheets named in art-variants.js are missing, e.g. {missing[0]}")
    if len(names) > ITCH_MAX_FILES:
        problems.append(f"{len(names)} files: itch.io takes at most {ITCH_MAX_FILES} in an HTML game's zip")
    print(json.dumps({"output": str(args.output), "version": version, "before": before, "files": len(names),
                      "mb": round(args.output.stat().st_size / 1048576, 1),
                      "unzippedMb": round(sum(map(len, files.values())) / 1048576, 1), **stats,
                      "droppedUnnamed": len(unnamed), "crc": "pass", "warnings": sorted(set(warnings)),
                      "problems": problems}, indent=1))
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
