# rebuild the review page's sheets and inline manifest from lab/out
import json,shutil,re,os
D=os.path.dirname(os.path.abspath(__file__)); G=os.path.join(D,'..','gallery')
old=json.load(open(os.path.join(G,'manifest.json'))); order=[m['id'] for m in old]
man=[]
for id in order:
  m=json.load(open(os.path.join(D,'out',id+'.json'))); man.append(m); shutil.copy(os.path.join(D,'out',id+'.png'),os.path.join(G,'sheets',id+'.png'))
json.dump(man,open(os.path.join(G,'manifest.json'),'w'))
p=os.path.join(G,'sprite-review.html'); s=open(p).read()
s=re.sub(r'const MAN=\[.*?\];\n','const MAN='+json.dumps(man,separators=(',',':')).replace('</','<\\/')+';\n',s,count=1,flags=re.S)
open(p,'w').write(s); print(len(man),'entries')
