// The chant artwork is authored on a 488-unit-wide canvas.
export const chantScale=(width,height)=>Math.min(width/488,height/645);

export function flameOpeningBand({x,y,width,height}){
  const pivot=width*274/540,zoom=chantScale(width,height);
  return {x:x+pivot,y:y+height*448/960,zoom,rightSpan:(width-pivot)/zoom};
}

// Luminous blade envelope in its 736 x 414 GIF, scaled to the chant backplate.
export const bladeScaleX=437/598,bladeScaleY=316/215;
export function bladeTime(ms){
  return ms<400?ms*.6:240+(ms-400)*720/560;
}

const left=30;
export const titleWidth=206,titleFont=88,titleLine=96,titleCenter=94;
export function castTitleLayout(name){
  const chars=Array.from(name),rows=[];
  for(let i=0;i<chars.length;i+=2)rows.push(chars.slice(i,i+2).join(''));
  return {rows,height:Math.max(1,rows.length)*titleLine+32};
}
export function castTitleLeft(band){return band.x+left*band.zoom;}

// The rightmost source pixel becomes the leading (left) edge when the blade is mirrored.
const tips=[133,177,225,283,358,395,413,422,427];
const unit=value=>Math.max(0,Math.min(1,value));
export function bladeEntryOffset(band,ms){
  const t=unit((ms-180)/640);
  return Math.max(band.rightSpan,2*left+titleWidth)*(1-t*t*(3-2*t));
}
function sweptWidth(band,ms){
  const frame=Math.min(tips.length-1,Math.max(0,bladeTime(ms)/40));
  const i=Math.floor(frame),tip=tips[i]+((tips[i+1]??tips[i])-tips[i])*(frame-i);
  const bladeTip=bladeEntryOffset(band,ms)+(355-tip*736/480)*bladeScaleX;
  return left+titleWidth-bladeTip-3;
}
export function castTitlePose(band,ms,duration){
  const swept=sweptWidth(band,ms),settle=unit((ms-500)/200),out=unit((ms-duration+200)/200);
  const p=unit(swept/Math.max(1,sweptWidth(band,500)));
  const travel=52,overshoot=travel*.10;
  const offset=ms<500?travel-(travel+overshoot)*(1-(1-p)**2):
    -overshoot*(1-settle*settle*(3-2*settle))+titleWidth*out*out;
  const reveal=Math.min(titleWidth,Math.max(0,swept));
  return {offset,reveal,alpha:1-out};
}
