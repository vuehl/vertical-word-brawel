// Extract existing authored strokes into runtime canvases for Soul drain.
export function captureStrokeCanvases(image,rects,cumulative=false,artScale=0){
  const strokes=[];
  let previous;
  for(const [frameIndex,rect] of rects.entries()){
    const [x,y,width,height,originX=-width/2,originY=-height/2]=rect;
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(image,x,y,width,height,0,0,width,height);
    const pixels=ctx.getImageData(0,0,width,height);
    const full=cumulative?new Uint8ClampedArray(pixels.data):null;
    let left=width,top=height,right=0,bottom=0;
    for(let row=0;row<height;row++)for(let col=0;col<width;col++){
      const i=(row*width+col)*4;
      if(cumulative && previous)pixels.data[i+3]=Math.max(0,pixels.data[i+3]-previous[i+3]);
      if(pixels.data[i+3]>12){left=Math.min(left,col);top=Math.min(top,row);right=Math.max(right,col+1);bottom=Math.max(bottom,row+1);}
    }
    previous=full;
    if(right<=left || bottom<=top)continue;
    ctx.putImageData(pixels,0,0);
    const crop=document.createElement('canvas');crop.width=right-left;crop.height=bottom-top;
    const ink=crop.getContext('2d');
    ink.drawImage(canvas,left,top,crop.width,crop.height,0,0,crop.width,crop.height);
    ink.globalCompositeOperation='source-in';ink.fillStyle='#fff3f4';ink.fillRect(0,0,crop.width,crop.height);
    crop.captureFrameIndex=frameIndex;
    crop.captureSizeRatio=Math.max(crop.width,crop.height)*(artScale||1/Math.max(width,height));
    const unit=artScale||1/Math.max(width,height);
    crop.captureOffsetX=(originX+left+crop.width/2)*unit;
    crop.captureOffsetY=(originY+top+crop.height/2)*unit;
    strokes.push(crop);
  }
  return strokes.reverse();
}
