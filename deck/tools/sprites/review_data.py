"""Writes review/data.json for the sprite review page: every redraw (main, frames, extra views),
its words, and each round's judge scores. Usage: python3 review_data.py <round> [<round> ...]"""
import sys, os, json, pickle, base64, io
J = '/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad/judge/'
CATS = ['legibility', 'silhouette', 'creativity', 'efficiency', 'detail', 'look', 'animation', 'reference']
JUDGES = {'A': 'Opus', 'B': 'Sonnet', 'C': 'Haiku'}

def url(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

def main(rounds):
    last = rounds[-1]
    es = pickle.load(open(J + 'r%d.pkl' % last, 'rb'))
    scores = {}
    for r in rounds:
        for k in JUDGES:
            f = J + 'judge%s_r%d.json' % (k, r)
            if os.path.exists(f):
                for sid, v in json.load(open(f)).items():
                    v['total'] = sum(int(v.get(c, 0)) for c in CATS)
                    scores.setdefault(sid, {}).setdefault(str(r), {})[k] = v
    out = []
    for eid, cat, name, does, works, im in es:
        out.append(dict(id=eid, cat=cat, name=name, does=does, works=works, main=url(im['main']),
                        frames=[url(x) for x in im['frames']], alts=[url(x) for x in im['alt']],
                        rounds=scores.get(eid, {})))
    os.makedirs('review', exist_ok=True)
    json.dump(dict(cats=CATS, judges=JUDGES, pass_mark=72, round=last, sprites=out), open('review/data.json', 'w'))
    print('review/data.json', os.path.getsize('review/data.json'))

if __name__ == '__main__':
    main([int(x) for x in sys.argv[1:]] or [1])
