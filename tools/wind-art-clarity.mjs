import sharp from 'sharp';

// Source-derived wind artwork. Work in straight RGBA, but weight interpolation
// by coverage so transparent paper cannot darken a thin feather or wind stroke.
const clamp=(value,lo=0,hi=255)=>Math.max(lo,Math.min(hi,value));
export function sampleWindInk(x,y,read){
  const left=Math.floor(x),top=Math.floor(y),fx=x-left,fy=y-top;
  const cubic=t=>{t=Math.abs(t);return t<=1?1.5*t*t*t-2.5*t*t+1:t<2?-.5*t*t*t+2.5*t*t-4*t+2:0;};
  const rgb=[0,0,0],low=[255,255,255],high=[0,0,0];let alpha=0,maxAlpha=0;
  for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++){
    const weight=cubic(dx-fx)*cubic(dy-fy);
    if(!weight)continue;
    const ink=read(left+dx,top+dy);
    if(!ink?.[3])continue;
    const a=weight*ink[3];alpha+=a;maxAlpha=Math.max(maxAlpha,ink[3]);
    for(let c=0;c<3;c++){rgb[c]+=ink[c]*a;low[c]=Math.min(low[c],ink[c]);high[c]=Math.max(high[c],ink[c]);}
  }
  return alpha>0?rgb.map((value,c)=>Math.round(clamp(value/alpha,low[c],high[c]))).concat(Math.round(clamp(alpha,0,maxAlpha))):undefined;
}

export function unmixWindInk(rgb,background,coverage){
  // Keep the extracted coverage as a conservative prior. The lower bound
  // guarantees a valid foreground colour instead of clipping recovered RGB.
  let minimum=0;
  for(let c=0;c<3;c++){
    const delta=rgb[c]-background[c];
    minimum=Math.max(minimum,delta>=0?delta/Math.max(1,255-background[c]):-delta/Math.max(1,background[c]));
  }
  const alpha=clamp(Math.max(minimum,coverage/255),0,1);
  if(alpha<=0)return [0,0,0,0];
  return rgb.map((value,c)=>Math.round(clamp(background[c]+(value-background[c])/alpha))).concat(Math.round(alpha*255));
}

export function clarifyWindFrame(input,width,height,{detail=.55,edge=.2,radius=1}={}){
  const output=Buffer.from(input),stride=width*4;
  const luma=k=>input[k]*.2126+input[k+1]*.7152+input[k+2]*.0722;
  for(let y=radius;y<height-radius;y++)for(let x=radius;x<width-radius;x++){
    const k=y*stride+x*4,a=input[k+3];
    if(!a)continue;
    let weightedLight=0,weightSum=0,meanAlpha=0,lowAlpha=255,highAlpha=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const j=k+dy*radius*stride+dx*radius*4,coverage=input[j+3],weight=(dx?1:2)*(dy?1:2);
      weightedLight+=luma(j)*coverage*weight;weightSum+=coverage*weight;
      meanAlpha+=coverage*weight;lowAlpha=Math.min(lowAlpha,coverage);highAlpha=Math.max(highAlpha,coverage);
    }
    // Limit local contrast. There is no global saturation/brightness boost and
    // no invented high-frequency detail in the source's soft trails or fades.
    const contrast=a>=32?clamp((luma(k)-weightedLight/weightSum)*detail,-14,14):0;
    for(let c=0;c<3;c++)output[k+c]=Math.round(clamp(input[k+c]+contrast));
    const change=clamp((a-meanAlpha/16)*edge,-a*.16,a*.16);
    output[k+3]=Math.round(clamp(a+change,lowAlpha,highAlpha));
  }
  for(let k=0;k<output.length;k+=4){
    const a=output[k+3];
    // The shader already discards coverage below .01. Suppress unstable colour
    // bits with at most 1/255 error after alpha compositing. All 8 alpha bits
    // remain intact; RGB uses millions of possible colours, not a shared palette.
    if(a<3){output.fill(0,k,k+4);continue;}
    const step=a<=32?8:a<=64?4:2;
    for(let c=0;c<3;c++)output[k+c]=clamp(Math.round(output[k+c]/step)*step);
  }
  return output;
}

export const windClarity={version:1,encoding:'RGBA8, lossless PNG/WebP',sampling:'premultiplied cubic',
  processing:'bounded local contrast; colour precision error at most 1/255 after compositing; original frame timing and geometry'};

export async function writeWindAtlas(layers,tile,columns,rows,file){
  const width=columns*tile,height=rows*tile,rgba=Buffer.alloc(width*height*4);
  // Copy exact RGBA cells without another compositing/quantization pass.
  for(const layer of layers){
    const data=layer.raw?layer.input:await sharp(layer.input).ensureAlpha().raw().toBuffer();
    for(let y=0;y<tile;y++)data.copy(rgba,((layer.top+y)*width+layer.left)*4,y*tile*4,(y+1)*tile*4);
  }
  await sharp(rgba,{raw:{width,height,channels:4}}).png({compressionLevel:9}).toFile(file);
}
