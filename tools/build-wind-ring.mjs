import path from 'node:path';
import sharp from 'sharp';

// Recover the moving bands from the floor of the recording. A radial scan
// avoids baking the hero, HUD, furniture or damage numbers into the spell.
const input=process.argv[2];
if(!input)throw Error('Pass the ring GIF path');
const {data,info}=await sharp(input,{animated:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
const width=info.width,stride=width*info.pageHeight*3;
const bins=360,frames=155;
const lookup=Buffer.alloc(bins*frames*4);
const probes=Array.from({length:bins},(_,radius)=>{
  const points=[];
  for(let j=0;j<180;j++){
    const angle=j*Math.PI/90,z=radius*Math.sin(angle),perspective=1/(1-z*.00048);
    const x=Math.round(195+radius*Math.cos(angle)*perspective),y=Math.round(541+z*.80*perspective);
    if(x<2||x>=width-2||y<264||y>784)continue;
    if((x>168&&x<222&&y>483&&y<535)||(x>148&&x<242&&y>552&&y<574)||(x>283&&y>560&&y<664)||(x<66&&y>665))continue;
    const i=(y*width+x)*3,bg=i+4*stride;
    if(data[bg]<130||data[bg]-data[bg+2]<28||data[bg]-data[bg+1]>55)continue;
    points.push(i);
  }
  return points;
});
for(let frame=0;frame<frames;frame++){
  for(let radius=0;radius<bins-1;radius++){
    const samples=[];
    for(const i of probes[radius]){
      const f=i+(frame+5)*stride,b=i+4*stride;
      const r=data[f],g=data[f+1],blue=data[f+2];
      if(r<67||g<82||r-g>55)continue;
      const strength=(blue-r)-(data[b+2]-data[b]);
      samples.push({strength,r,g,blue,b});
    }
    if(samples.length<3)continue;
    samples.sort((a,b)=>a.strength-b.strength);
    const {strength,r,g,blue,b}=samples[samples.length>>1];
    if(strength<4)continue;
    const a=Math.min(1,Math.max(strength/145,(blue-data[b+2])/(255-data[b+2]),.01));
    const k=(frame*bins+radius)*4;
    for(const [c,v] of [r,g,blue].entries())lookup[k+c]=Math.max(0,Math.min(255,data[b+c]+(v-data[b+c])/a));
    lookup[k+3]=255*a;
  }
}
// Keep the narrow bright contours in the source. The old five-tap Gaussian
// softened every band into a broad glow; use light premultiplied denoising,
// then restore the radial edges and suppress the low-opacity haze.
const smooth=Buffer.alloc(lookup.length),weights=[1,6,1];
for(let frame=0;frame<frames;frame++)for(let radius=0;radius<bins-2;radius++){
  let alpha=0;
  const rgb=[0,0,0],target=(frame*bins+radius)*4;
  for(let j=0;j<weights.length;j++){
    const k=(frame*bins+Math.max(0,radius+j-1))*4,a=weights[j]*lookup[k+3];
    alpha+=a;
    for(let c=0;c<3;c++)rgb[c]+=a*lookup[k+c];
  }
  if(alpha>0)for(let c=0;c<3;c++)smooth[target+c]=Math.round(rgb[c]/alpha);
  const base=alpha/8;
  let broad=0;
  for(let j=-4;j<=4;j++)broad+=lookup[(frame*bins+Math.max(0,Math.min(bins-1,radius+j)))*4+3];
  const crisp=255*Math.pow(base/255,1.18)+1.15*(base-broad/9);
  smooth[target+3]=Math.round(Math.max(0,Math.min(255,crisp)));
}
await sharp(smooth,{raw:{width:bins,height:frames,channels:4}}).png().toFile(
  path.resolve(import.meta.dirname,'../source/public/assets/vfx/wind-ring.png'));
