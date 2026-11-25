import sheet from './cast-title-glyphs.json' with {type:'json'};
import {titleFont} from '../source/src/effects/ultimate-cast-layout.js';

// Cache the two handoff treatments once per row. The motion pass only blits them.
export function paintCastRow(makeCanvas,image,text,shade,base,tip){
  const indices=Array.from(text,letter=>sheet.glyphs.indexOf(letter));
  if(indices.includes(-1))return null;
  const {tile,scale,columns,glyphs}=sheet;
  const advance=titleFont*scale,w=tile+(indices.length-1)*advance,h=tile;
  const canvas=makeCanvas();canvas.width=w;canvas.height=h*2;
  const output=canvas.getContext('2d');
  const mask=makeCanvas();mask.width=w;mask.height=h;
  const ctx=mask.getContext('2d');
  function drawMask(offset){
    ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);
    indices.forEach((index,i)=>{
      const cell=index+offset;
      ctx.drawImage(image,cell%columns*tile,Math.floor(cell/columns)*tile,tile,tile,
        i*advance,0,tile,tile);
    });
  }
  function tint(fill){
    ctx.globalCompositeOperation='source-in';ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);
  }
  drawMask(glyphs.length);tint(shade);
  output.drawImage(mask,0,0);output.drawImage(mask,0,h);
  drawMask(0);output.drawImage(mask,0,h);
  const fill=ctx.createLinearGradient(0,h/2-36*scale,0,h/2+39*scale);
  fill.addColorStop(0,'white');fill.addColorStop(.66,tip);fill.addColorStop(1,base);
  tint(fill);output.drawImage(mask,0,0);
  return {canvas,w,h,width:w/scale,height:h/scale};
}
