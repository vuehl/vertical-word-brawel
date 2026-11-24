from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np, json, sys
from scipy.ndimage import binary_fill_holes
root=Path(sys.argv[1]);out=Path('resources/public/assets/env/desk2d');out.mkdir(exist_ok=True,parents=True)
with Image.open(root/'desk.png') as ref: W,H=ref.size
manifest=Path('resources/public/config/desk2d-layout.json')
shelf=json.loads(Path('resources/public/config/desk2d-shelf.json').read_text())
above_desk={'shelf',*shelf['hanging']}
desk_only='--desk-only' in sys.argv[2:]
previous=json.loads(manifest.read_text()) if desk_only else None
if previous and (W,H)!=(previous['width'],previous['height']):
 raise ValueError('Map registration changed. Regenerate all layers.')
layers=[];rows=[];S=12
order=['desk','shelf','wires','wacom','ID-card','tea-bag','keyboard','bags','bell','box','cup','hushoushuang','mouse','pen','medicine','teethpicks','toy0','toy1','toy2','toy3','xiangdai','zhi','notebook','bottle']
# Preserve source coordinates including the footprints and painted shadows.
for name in order:
 if desk_only and name!='desk':
  layers.append(next(layer for layer in previous['layers'] if layer['name']==name))
  continue
 im=Image.open(root/(name+'.png')).convert('RGBA');assert im.size==(W,H)
 x0,y0,x1,y1=im.getbbox();parts=[]
 for y in range(y0,y1,1440):
  for x in range(x0,x1,1440):
   tile=im.crop((x,y,min(x+1440,x1),min(y+1440,y1)));bounds=tile.getbbox()
   if not bounds:continue
   tile=tile.crop(bounds);file=f'{name}-{len(parts)}.webp';tile.save(out/file,'WEBP',quality=96,method=5,alpha_quality=100);parts.append([file,x+bounds[0],y+bounds[1],*tile.size]);
 layers.append(dict(name=name,parts=parts))
 if name in ('desk','wires') or name in above_desk:continue
 mask=np.asarray(im.getchannel('A'))[S//2::S,S//2::S]>210
 if name in ('cup','teethpicks'):mask=binary_fill_holes(mask)
 active={}
 for j,row in enumerate(mask):
  ends=np.flatnonzero(np.diff(np.r_[False,row,False]));runs=set(zip(ends[::2].tolist(),ends[1::2].tolist()));
  for k in list(active):
   if k not in runs:rows.append([name,k[0]*S,active.pop(k)*S,k[1]*S,j*S]);
  for k in runs:active.setdefault(k,j)
 for k,start in active.items():rows.append([name,k[0]*S,start*S,k[1]*S,H]);
if desk_only: rows=[rect for rect in previous['rects'] if rect[0] not in above_desk]
manifest.write_text(json.dumps(dict(width=W,height=H,layers=layers,rects=rows),separators=(',',':')))

# Red stores sorting depth, green stores artwork coverage. Rear braces stay
# behind the actors. Use the original painted alpha for legs and decorations.
left,top,right,bottom=shelf['maskBounds']
size=(right-left,bottom-top)
rgba=Image.open(root/'shelf.png').convert('RGBA').crop((left,top,right,bottom))
pixels=np.asarray(rgba)
xx=np.arange(left,right)
yy=np.arange(top,bottom)[:,None]
# The underside of the front fascia is the straight edge above the legs.
board=yy<=(xx-897)*.1388+1
cover=np.where(board,pixels[:,:,3],0).astype('uint8')
feet=shelf['feet']
depth_at=[(f['bounds'][1]+f['bounds'][3])/2 for f in feet]
foot_x=[(f['bounds'][0]+f['bounds'][2])/2 for f in feet]
board_depth=depth_at[0]+(xx-foot_x[0])*(depth_at[-1]-depth_at[0])/(foot_x[-1]-foot_x[0])
depth=np.broadcast_to(board_depth,size[::-1]).copy()
for post,foot_depth in zip(feet,depth_at):
 region=Image.new('L',size)
 ImageDraw.Draw(region).polygon([(x-left,y-top) for x,y in post['shaft']],fill=255)
 selected=np.asarray(region)>0
 cover[selected]=pixels[:,:,3][selected]
 depth[selected]=foot_depth
for name,post in shelf['hanging'].items():
 with Image.open(root/(name+'.png')) as decoration:
  alpha=np.asarray(decoration.getchannel('A').crop((left,top,right,bottom)))
 cover=np.maximum(cover,alpha)
 if post is not None: depth[alpha>0]=depth_at[post]
packing=np.zeros((*cover.shape,3),dtype='uint8')
packing[:,:,0]=np.clip(np.rint(depth*255/shelf['maskDepthRange']),0,255).astype('uint8')
packing[:,:,1]=cover
Image.fromarray(packing).resize((2048,440),Image.Resampling.BOX).save(out/'shelf-depth.png',optimize=True)
print(len(layers),'layers,',len(rows),'collision rectangles,',sum(p.stat().st_size for p in out.glob('*.webp')),'image bytes')
