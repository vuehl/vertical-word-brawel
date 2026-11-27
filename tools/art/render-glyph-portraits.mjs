// Bake inventory icons from the battle meshes. The Canvas UI can then share
// portraits without allocating a second WebGL context or rendering per card.
import path from 'node:path';
import sharp from 'sharp';
import {buildGlyphGeometry} from '../../source/src/actors/glyph-geometry.js';
import {createGlyphSkeleton,glyphModels} from '../../source/src/actors/glyph-skeleton.js';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';
import {heroActionCatalog} from '../../source/src/actors/hero-action-catalog.js';
import {starterSpecies} from '../../source/src/data/starter-characters.js';

const out=path.resolve(import.meta.dirname,'../../resources/public/assets/ui-paper');
const tile=160,side=tile*2;
function render(geometry,model,matrices,scale=1){
  const {position,normal,strokeBind}=geometry.attributes;
  const x=new Float32Array(position.count),y=x.slice(),z=x.slice(),shade=x.slice();
  const cs=Math.cos(-.31),sn=Math.sin(-.31),ct=Math.cos(.34),st=Math.sin(.34);
  for(let i=0;i<position.count;i++){
    const j=strokeBind.getX(i)*16,px=position.getX(i),py=position.getY(i),pz=position.getZ(i);
    const xx=matrices[j]*px+matrices[j+4]*py+matrices[j+12];
    const yy=matrices[j+1]*px+matrices[j+5]*py+matrices[j+13];
    const zz=pz+matrices[j+14],depth=zz*cs-xx*sn;
    x[i]=side*(.5+(xx*cs+zz*sn)/scale);
    y[i]=side*(1-(yy*ct-depth*st)/scale);
    z[i]=yy*st+depth*ct;
    const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
    shade[i]=Math.sqrt(.55+.5*Math.max(0,(-.4*nx+.45*ny+.8*nz)/Math.hypot(nx,ny,nz)));
  }
  const rgba=Buffer.alloc(side*side*4),depth=new Float32Array(side*side).fill(-Infinity);
  const indices=geometry.index.array;
  for(let k=0;k<indices.length;k+=3){
    const a=indices[k],b=indices[k+1],c=indices[k+2];
    const abx=x[b]-x[a],aby=y[b]-y[a],acx=x[c]-x[a],acy=y[c]-y[a],area=abx*acy-aby*acx;
    if(area>=-1e-5)continue;
    const left=Math.max(0,Math.floor(Math.min(x[a],x[b],x[c]))),right=Math.min(side-1,Math.ceil(Math.max(x[a],x[b],x[c])));
    const top=Math.max(0,Math.floor(Math.min(y[a],y[b],y[c]))),bottom=Math.min(side-1,Math.ceil(Math.max(y[a],y[b],y[c])));
    const ink=strokeBind.getY(a);
    for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
      const dx=col+.5-x[a],dy=row+.5-y[a],u=(dx*acy-dy*acx)/area,v=(abx*dy-aby*dx)/area;
      if(u<0||v<0||u+v>1)continue;
      const w=1-u-v,pixel=row*side+col,d=w*z[a]+u*z[b]+v*z[c];
      if(d<=depth[pixel])continue;
      depth[pixel]=d;
      const light=w*shade[a]+u*shade[b]+v*shade[c];
      for(let i=0;i<3;i++)rgba[pixel*4+i]=ink?(model===glyphModels['龘']?0:[45,37,49][i]):Math.min(255,Math.round(model.color[i]*light));
      rgba[pixel*4+3]=255;
    }
  }
  return sharp(rgba,{raw:{width:side,height:side,channels:4}}).resize(tile,tile).png().toBuffer();
}
function sheet(columns,rows,layers,name){
  return sharp({create:{width:tile*columns,height:tile*rows,channels:4,background:'#0000'}})
    .composite(layers).webp({lossless:true}).toFile(path.join(out,name));
}
const icons=[];
for(const [word,model] of Object.entries(glyphModels)){
  const geometry=buildGlyphGeometry(model),rig=createGlyphSkeleton(word);
  const {data}=rig.palette.image,stride=rig.skeleton.bones.length*16,index=glyphCatalog.words[word].index;
  icons.push({input:await render(geometry,model,data),left:index%8*tile,top:Math.floor(index/8)*tile});
  const id=starterSpecies.find(id=>glyphCatalog.heroes[id].word===word);
  if(id){
    const {columns,clips,scale}=heroActionCatalog[id],layers=[];
    for(let i=0;i<clips.idle.count;i++){
      const row=rig.poseRow('idle',0,false,{action:'idle',index:i});
      layers.push({input:await render(geometry,model,data.subarray(row*stride),scale),
        left:i%columns*tile,top:Math.floor(i/columns)*tile});
    }
    await sheet(columns,Math.ceil(layers.length/columns),layers,'model-idle-'+id+'.webp');
  }
  geometry.dispose();rig.dispose();
}
await sheet(8,Math.ceil(icons.length/8),icons,'model-glyphs.webp');
