// Shared flat cut-paper motif for menu headers, photos and upgrade cards.
// Coordinates are independent of viewport and contain no baked text or texture.
// Sampled from the right-hand library reference. CSS and the native painter
// share these inks; the palette applies to system paper, not to game sprites.
export const paperPalette=Object.freeze({
  darkStock:'#27232F', warmWhite:'#FFF8E9', yellow:'#EEC659',
  navy:'#292943', ink:'#292742', paper:'#F3F1FA',
  titleStart:'#D1646D', titleEnd:'#DA7A81', tabStart:'#DC7472', tabEnd:'#D87070',
  blueStart:'#376FC8', blueEnd:'#326AC5',
});
export const paperPaletteStyle='.zx,html.zixing{'+Object.entries(paperPalette)
  .map(([name,value])=>'--paper-'+name+':'+value).join(';')+'}';

export function paintSettingsSymbol(ctx,x,y,size,color='#2B2A49'){
  ctx.save();ctx.translate(x,y);ctx.scale(size/32,size/32);
  ctx.beginPath();
  for(let i=0;i<48;i++){
    const a=-Math.PI/2+i*Math.PI/24,r=[12,12,15,15,12,12][i%6];
    const px=16+Math.cos(a)*r,py=16+Math.sin(a)*r;
    if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.moveTo(21.2,16);ctx.arc(16,16,5.2,0,Math.PI*2,true);
  ctx.fillStyle=color;ctx.fill('evenodd');ctx.restore();
}

export function paintPaperWaves(ctx,w,h,palette=['#3E6CB7','#6896D7','#C5DBF1','#8EC2E3','#D3E9F4']){
  const poly=(p,color)=>{ctx.beginPath();ctx.moveTo(...p[0]);for(const a of p.slice(1))ctx.lineTo(...a);ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  ctx.save();ctx.scale(w/220,h/100);
  poly([[0,100],[67,77],[103,63],[127,51],[149,32],[174,20],[220,5],[220,100]],palette[0]);
  poly([[55,94],[108,73],[136,30],[150,46],[167,17],[220,0],[220,36],[181,39],[157,69]],palette[1]);
  poly([[117,68],[140,20],[158,17],[146,50],[172,26],[220,0],[220,15],[178,38],[157,65]],palette[2]);
  ctx.fillStyle=palette[3];ctx.beginPath();ctx.moveTo(48,99);ctx.bezierCurveTo(95,65,125,63,153,76);ctx.bezierCurveTo(119,70,105,91,87,100);ctx.fill();
  ctx.fillStyle=palette[4];ctx.beginPath();ctx.moveTo(144,93);ctx.bezierCurveTo(165,50,203,43,215,57);ctx.bezierCurveTo(228,72,215,77,208,68);ctx.bezierCurveTo(217,58,177,60,144,93);ctx.fill();
  ctx.restore();
}

export function paintPhotoWaves(ctx,w,h,accent,light){
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
  const cloud=(x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
  // Overlapping round cutouts stay below the glyph, like the approved cards.
  for(const [x,y,r] of [[.04,.87,.25],[.37,.91,.22],[.75,.98,.32],[1.04,.8,.22]])cloud(w*x,h*y,w*r,'#F4F3F8');
  for(const [x,y,r] of [[.02,.91,.22],[.38,.97,.25],[.78,1.03,.34],[1.02,.84,.19]])cloud(w*x,h*y,w*r,light);
  for(const [x,y,r] of [[-.03,1.04,.26],[.4,1.1,.28],[.86,1.15,.34]])cloud(w*x,h*y,w*r,accent);
  ctx.strokeStyle='#F4F3F8';ctx.lineWidth=Math.max(.8,w*.018);ctx.lineCap='round';
  ctx.beginPath();ctx.arc(w*.11,h*.88,w*.095,Math.PI*.2,Math.PI*1.9);ctx.stroke();
  ctx.restore();
}
