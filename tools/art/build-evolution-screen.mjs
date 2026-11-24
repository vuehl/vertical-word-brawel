import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const art=path.join(root,'resources/art/upgrade');
const output=path.join(root,'resources/public/assets/vfx');
const width=390,height=844,header=48,tileWidth=170,tileHeight=368,columns=9,rows=9;
const read=async name=>sharp(path.join(art,name),{animated:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
const [full,base]=await Promise.all([read('进化全屏.gif'),read('jinhua.gif')]);
if(full.info.width!==390||full.info.height!==892*171||base.info.width!==368||base.info.height!==276*171)
  throw Error('Expected the matching 171-frame evolution recordings');


// The cropped recording aligns at (11,278) in the full recording. Outside
// that region the desk is stationary. Reconstruct the clean animated plate,
// removing the recorded glyph, UI, desk and title from the shipped effect.
function backdrop(frame,x,y,c){
  if(x>=11&&x<379&&y>=230&&y<506)return base.data[(frame*368*276+(y-230)*368+x-11)*3+c];
  return full.data[((y+header)*width+x)*3+c];
}

// Fit the diffuse exposure separately from the bright streaks. A trimmed
// fit rejects moving sparks and JPEG/GIF quantisation; this keeps the full
// screen darkening/warm flash uniform over any live map and HUD.
function exposure(frame){
  const offset=frame*width*892*3,samples=[];
  for(let y=8;y<height-8;y+=7)for(let x=8;x<width-8;x+=7){
    if(y>210&&y<530)continue;
    if(frame>=126&&x<110&&y<170)continue; // changed HUD portrait
    const b=[0,1,2].map(c=>backdrop(frame,x,y,c)/255);
    const f=[0,1,2].map(c=>full.data[offset+((y+header)*width+x)*3+c]/255);
    samples.push({b,f});
  }
  let selected=samples,scale=1,tint=[0,0,0];
  for(let pass=0;pass<6;pass++){
    const n=selected.length,mb=[0,0,0],mf=[0,0,0];
    for(const {b,f} of selected)for(let c=0;c<3;c++){mb[c]+=b[c]/n;mf[c]+=f[c]/n;}
    let covariance=0,variance=0;
    for(const {b,f} of selected)for(let c=0;c<3;c++){covariance+=(b[c]-mb[c])*(f[c]-mf[c]);variance+=(b[c]-mb[c])**2;}
    scale=Math.max(.05,Math.min(1,covariance/Math.max(variance,1e-6)));
    tint=mf.map((v,c)=>Math.max(0,Math.min(1-scale,v-scale*mb[c])));
    const scored=samples.map(s=>({...s,error:s.f.reduce((v,f,c)=>v+Math.abs(f-scale*s.b[c]-tint[c]),0)}));
    scored.sort((a,b)=>a.error-b.error);selected=scored.slice(0,Math.floor(scored.length*.65));
  }
  if(scale>.985&&Math.max(...tint)<.012){scale=1;tint=[0,0,0];}
  return {scale,tint};
}

const metadata=await sharp(path.join(art,'进化全屏.gif'),{animated:true}).metadata();
const times=[0];for(const delay of metadata.delay)times.push(times.at(-1)+delay/1000);
// Keep every frame through the darkest instant and the fast reveal, including
// the odd frames that were previously skipped by the half-rate atlas.
const sourceFrames=[...Array.from({length:62},(_,i)=>i*2),...Array.from({length:18},(_,i)=>123+i),142];
const flashes=[],liftPixels=[];
for(let frame=0;frame<171;frame++){
  const blues=[];let bottom=0;
  for(let y=20;y<210;y++)for(let x=100;x<270;x++){
    const i=(frame*368*276+y*368+x)*3,r=base.data[i],g=base.data[i+1],b=base.data[i+2];
    if(r>140&&r>g*1.3&&r>b*1.4){blues.push(b);bottom=Math.max(bottom,y);}
  }
  blues.sort((a,b)=>a-b);
  flashes.push(+Math.max(0,Math.min(1,((blues[Math.floor(blues.length*.5)]??255)-51)/204)).toFixed(4));
  liftPixels.push(frame<126?0:bottom?Math.max(0,162-bottom):Math.max(0,(frame-126)*7));
}
const inkHeights={};
for(const id of [4,5,6,16,17,18,58,59]){
  const data=await sharp(path.join(root,`resources/public/assets/glyphs/hero-actions/${id}.png`)).extract({left:0,top:0,width:160,height:160}).ensureAlpha().raw().toBuffer();
  let top=160,bottom=0;
  for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  inkHeights[id]=(bottom-top+1)/160;
}
const cells=[],exposures=[];
for(let cell=0;cell<columns*rows;cell++){
  const frame=sourceFrames[cell],{scale,tint}=exposure(frame),rgba=Buffer.alloc(width*height*4);
  exposures.push([scale,...tint].map(v=>+v.toFixed(5)));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,src=(frame*width*892+(y+header)*width+x)*3;
    const central=x>=11&&x<379&&y>=230&&y<506;
    // The animated clean plate removes the recorded glyph and scenery. Blue
    // separates the golden light from red ink and the warm desk beneath it.
    const localWeight=central&&frame<124?Math.min(1,(x-11)/20,(378-x)/20,(y-230)/20,(505-y)/20):0;
    const plate=backdrop(frame,x,y,2),corrected=plate*scale+tint[2]*255;
    const clean=corrected+(plate-corrected)*localWeight;
    let light=(full.data[src+2]-clean-10)/Math.max(46,246-clean);
    if(frame<124)light*=1.45;
    if(!central){
      // Remove small registration/quantisation outlines along the static HUD.
      let edgeNoise=0;
      for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]]){
        const nx=Math.max(0,Math.min(width-1,x+dx)),ny=Math.max(0,Math.min(height-1,y+dy));
        edgeNoise=Math.max(edgeNoise,Math.abs(backdrop(frame,nx,ny,2)-backdrop(frame,x,y,2)));
      }
      light*=Math.max(.05,1-edgeNoise/25);
    }
    if(frame<124||frame>130){
      const nearGlyph=Math.hypot((x-195)*1.3,y-360)<75;
      if(nearGlyph)light*=Math.max(0,Math.min(1,(full.data[src+2]-135)/90));
    }
    // Recover the saturated reveal core lost when both source plates are white.
    if(frame>=118&&frame<=130&&Math.hypot(x-195,y-368)<90)
      light=Math.max(light,(full.data[src+2]-185)/70);
    // Differencing two saturated cores loses their soft halo. Recover its
    // radial envelope without baking the original character into other forms.
    if(frame>=118&&frame<=128){
      const charge=frame<124?.75:1,spread=frame<124?23:35;
      light=Math.max(light,charge*Math.exp(-((x-195)**2+(y-368)**2)/(2*spread*spread)));
    }
    light=Math.max(0,Math.min(1,light));
    const edge=Math.min(1,x/8,(width-1-x)/8,y/12,(height-1-y)/12);
    rgba[p*4]=255;rgba[p*4+1]=218+37*light;rgba[p*4+2]=154+101*light;
    rgba[p*4+3]=Math.round(255*light*edge);
  }
  const input=await sharp(rgba,{raw:{width,height,channels:4}}).resize(tileWidth,tileHeight).png().toBuffer();
  cells.push({input,left:cell%columns*tileWidth,top:Math.floor(cell/columns)*tileHeight});
}
await sharp({create:{width:columns*tileWidth,height:rows*tileHeight,channels:4,background:'#00000000'}})
  .composite(cells).webp({quality:88,alphaQuality:90,effort:6}).toFile(path.join(output,'evolution-screen.webp'));
fs.writeFileSync(path.join(output,'evolution-screen.json'),JSON.stringify({columns,rows,tileWidth,tileHeight,width,height,focus:[.5,1-368/844],
  duration:times.at(-1),reveal:times[126],times,sourceFrames,flashes,liftPixels,
  camera:{inkPixels:80,feetY:402,inkHeights},exposures})+'\n');
console.log('Evolution screen:',fs.statSync(path.join(output,'evolution-screen.webp')).size,'bytes');
