from pathlib import Path
from PIL import Image
import numpy as np, json, sys
from scipy.ndimage import binary_fill_holes
root=Path(sys.argv[1]);out=Path('source/public/assets/env/desk2d');out.mkdir(exist_ok=True,parents=True)
ref=Image.open(root/'desk_map.png').convert('RGB');W,H=ref.size
layers=[];rows=[];S=12
order=['desk','shelf','wires','wacom','ID-card','tea-bag','keyboard','bags','bell','box','cup','hushoushuang','mouse','pen','medicine','teethpicks','toy0','toy1','toy2','toy3','xiangdai','zhi','notebook','bottle']
# Preserve source coordinates including the footprints and painted shadows.
for name in order:
 im=Image.open(root/(name+'.png')).convert('RGBA');assert im.size==(W,H)
 x0,y0,x1,y1=im.getbbox();parts=[]
 for y in range(y0,y1,1440):
  for x in range(x0,x1,1440):
   tile=im.crop((x,y,min(x+1440,x1),min(y+1440,y1)));bounds=tile.getbbox()
   if not bounds:continue
   tile=tile.crop(bounds);file=f'{name}-{len(parts)}.webp';tile.save(out/file,'WEBP',quality=96,method=5,alpha_quality=100);parts.append([file,x+bounds[0],y+bounds[1],*tile.size]);
 layers.append(dict(name=name,parts=parts))
 if name in ('desk','wires'):continue
 mask=np.asarray(im.getchannel('A'))[S//2::S,S//2::S]>210
 if name in ('cup','teethpicks'):mask=binary_fill_holes(mask)
 active={}
 for j,row in enumerate(mask):
  ends=np.flatnonzero(np.diff(np.r_[False,row,False]));runs=set(zip(ends[::2].tolist(),ends[1::2].tolist()));
  for k in list(active):
   if k not in runs:rows.append([name,k[0]*S,active.pop(k)*S,k[1]*S,j*S]);
  for k in runs:active.setdefault(k,j)
 for k,start in active.items():rows.append([name,k[0]*S,start*S,k[1]*S,H]);
Path('source/src/desk2d-layout.json').write_text(json.dumps(dict(width=W,height=H,layers=layers,rects=rows),separators=(',',':')))
print(len(layers),'layers,',len(rows),'collision rectangles,',sum(p.stat().st_size for p in out.glob('*.webp')),'image bytes')
