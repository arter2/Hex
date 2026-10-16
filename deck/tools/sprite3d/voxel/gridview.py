from PIL import Image, ImageDraw
import sys
n=sys.argv[1]; S=14
im=Image.open(n+'_native.png'); W,H=im.size
bg=Image.new('RGBA',(W*S+30,H*S+30),(255,255,255,255))
big=im.resize((W*S,H*S),Image.NEAREST); bg.alpha_composite(big,(30,30)); d=ImageDraw.Draw(bg)
for x in range(W+1): d.line([(30+x*S,30),(30+x*S,30+H*S)],fill=(200,0,200,255) if x%5==0 else (220,220,220,90))
for y in range(H+1): d.line([(30,30+y*S),(30+W*S,30+y*S)],fill=(200,0,200,255) if y%5==0 else (220,220,220,90))
for x in range(0,W,5): d.text((30+x*S+2,2),str(x),fill=(0,0,0,255))
for y in range(0,H,5): d.text((2,30+y*S+2),str(y),fill=(0,0,0,255))
bg.save(n+'_grid.png')
