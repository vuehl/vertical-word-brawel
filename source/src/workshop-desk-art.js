// Quiet, hand-drawn illustrations for the scattered desktop papers and walls.
// The central paper field and the wall's window bay remain deliberately clear.
const TAU=Math.PI*2;
function line(c,points,color,width=2){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function plane(c,x,y,size,color,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
  c.strokeStyle=color;c.lineWidth=1.7;c.beginPath();c.moveTo(-37,15);c.lineTo(39,-22);
  c.lineTo(15,31);c.lineTo(1,8);c.closePath();c.stroke();
  line(c,[[39,-22],[1,8],[-7,29],[-9,11]],color,1.3);c.restore();
}
function cloud(c,x,y,size,color){
  c.save();c.translate(x,y);c.scale(size,size);c.strokeStyle=color;c.lineWidth=1.8;
  c.beginPath();c.moveTo(-35,10);c.bezierCurveTo(-52,8,-47,-13,-31,-12);
  c.bezierCurveTo(-31,-37,0,-39,9,-20);c.bezierCurveTo(24,-34,42,-16,37,-5);
  c.bezierCurveTo(61,1,48,23,31,18);c.bezierCurveTo(7,23,-11,14,-35,10);c.stroke();c.restore();
}
function star(c,x,y,r,color){
  c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.43:r;
    const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}
  c.closePath();c.stroke();
}
function planet(c,x,y,r,color,accent){
  c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  c.beginPath();c.ellipse(x,y+1,r*1.65,r*.32,-.3,0,TAU);c.stroke();
  c.strokeStyle=accent;c.lineWidth=2.4;c.beginPath();c.arc(x-r*.12,y-r*.06,r*.6,3.6,4.6);c.stroke();
}
function hills(c,x,y,size,color,accent){
  c.save();c.translate(x,y);c.scale(size,size);
  line(c,[[-57,30],[-25,-13],[-2,15],[20,-24],[58,30]],color,2);
  line(c,[[-34,0],[-25,-13],[-14,0],[-24,-3],[-30,3]],accent,1.5);
  line(c,[[8,-7],[20,-24],[32,-6],[20,-11],[15,-4]],accent,1.5);
  c.beginPath();c.strokeStyle=color;c.moveTo(-67,34);c.quadraticCurveTo(-1,41,70,32);c.stroke();c.restore();
}
function handwritten(c,x,y,width,color){
  // Short, irregular pencil dashes imply a child's note without tiny fake text.
  const rows=[[.72,.13,.08],[.48,.2,.12],[.62,.1],[.33,.16,.24]];
  rows.forEach((parts,row)=>{let cursor=x;parts.forEach((part,i)=>{
    const length=part*width;line(c,[[cursor,y+row*15],[cursor+length*.45,y+row*15-1.8],[cursor+length,y+row*15+(i%2?.8:0)]],color,1.4);cursor+=length+7;
  });});
}

export function drawDeskPaper(c,w,h,variant='sketch'){
  c.save();c.scale(w/800,h/1000);c.lineCap='round';c.lineJoin='round';
  const blue='#798e99',pencil='#92938b',faint='#c4bfb0',ochre='#c6ab78',coral='#bc8774';
  c.fillStyle=variant==='blueprint'?'#e3ece7':'#f1ead8';c.fillRect(0,0,800,1000);
  // A faint edge stain gives the paper a physical boundary without a tiled grid.
  c.strokeStyle=variant==='blueprint'?'#c4d2ce':'#dfd4bd';c.lineWidth=1.2;c.strokeRect(13,15,774,968);
  if(variant==='notes'){
    line(c,[[65,94],[197,90]],ochre,8);
    handwritten(c,68,126,190,pencil);
    line(c,[[64,199],[218,196]],faint,1.2);
    c.strokeStyle=blue;c.lineWidth=2;c.beginPath();c.arc(653,817,40,.18,TAU-.12);c.stroke();
    c.beginPath();c.moveTo(623,819);c.quadraticCurveTo(651,789,680,820);c.quadraticCurveTo(651,848,623,819);c.stroke();
    line(c,[[653,778],[653,856]],blue,1.5);
    line(c,[[611,887],[685,891],[701,883]],pencil,1.5);
    star(c,710,773,12,coral);
    handwritten(c,93,874,130,faint);
  }else if(variant==='blueprint'){
    line(c,[[63,83],[197,83]],blue,4);
    handwritten(c,65,111,147,pencil);
    // A small toy-track study sits at one corner, not across the fighting area.
    c.strokeStyle=blue;c.lineWidth=2.6;c.beginPath();c.moveTo(548,856);
    c.bezierCurveTo(535,776,629,739,677,788);c.bezierCurveTo(722,835,659,897,602,861);
    c.bezierCurveTo(570,841,586,800,616,799);c.stroke();
    line(c,[[534,894],[705,894]],pencil,1.2);line(c,[[534,881],[534,903]],pencil,1.2);line(c,[[705,881],[705,903]],pencil,1.2);
    line(c,[[541,890],[534,894],[541,898]],pencil,1.2);line(c,[[698,890],[705,894],[698,898]],pencil,1.2);
    line(c,[[660,741],[699,718],[722,723]],ochre,2);
    star(c,674,681,13,ochre);
  }else{
    plane(c,136,152,1.4,blue,-.2);cloud(c,664,117,.8,faint);
    c.strokeStyle=faint;c.lineWidth=2;c.setLineDash([9,10]);c.beginPath();
    c.moveTo(60,283);c.bezierCurveTo(146,268,183,225,144,209);c.bezierCurveTo(91,183,75,231,121,228);c.stroke();c.setLineDash([]);
    hills(c,632,849,1.3,blue,ochre);
    c.strokeStyle=ochre;c.lineWidth=2;c.beginPath();c.arc(698,774,18,0,TAU);c.stroke();
    handwritten(c,77,888,133,faint);star(c,716,903,13,coral);
  }
  c.restore();
}

export function drawDeskWall(c,w,h,variant=0){
  c.save();c.scale(w/1200,h/500);c.lineCap='round';c.lineJoin='round';
  c.fillStyle='#2d4b68';c.fillRect(0,0,1200,500);
  const ink='#6e838d',faint='#526f80',warm='#9b947f',green='#718d87';
  // Three quiet arrangements share a clear centre for the real window.
  if((variant%3+3)%3===0){
    plane(c,228,139,1.65,ink,-.14);cloud(c,104,87,.85,faint);cloud(c,1003,134,1.35,ink);
    c.strokeStyle=faint;c.lineWidth=2.2;c.setLineDash([9,13]);c.beginPath();
    c.moveTo(54,273);c.bezierCurveTo(123,244,181,243,157,215);c.bezierCurveTo(133,190,97,215,122,231);c.stroke();c.setLineDash([]);
    plane(c,913,278,.95,green,.17);star(c,1090,224,12,warm);star(c,338,83,9,faint);
    line(c,[[858,64],[875,60],[888,65]],faint,2);
  }else if((variant%3+3)%3===1){
    planet(c,207,155,41,ink,warm);planet(c,982,236,24,green,faint);
    c.strokeStyle=faint;c.lineWidth=1.8;c.beginPath();c.ellipse(205,154,116,78,-.35,3.55,6.9);c.stroke();
    star(c,99,262,14,warm);star(c,344,89,10,faint);star(c,1067,105,15,ink);
    line(c,[[865,85],[892,110],[926,91],[947,116]],faint,1.7);
    for(const [x,y] of [[865,85],[892,110],[926,91],[947,116]]){c.fillStyle=ink;c.beginPath();c.arc(x,y,2.5,0,TAU);c.fill();}
  }else{
    hills(c,212,227,1.8,ink,green);cloud(c,111,102,.85,faint);
    c.strokeStyle=warm;c.lineWidth=2;c.beginPath();c.arc(312,139,19,0,TAU);c.stroke();
    // One little house and an off-centre tree complete the opposite vignette.
    line(c,[[909,251],[909,200],[954,169],[998,200],[998,251]],ink,2.3);
    line(c,[[901,204],[954,163],[1007,204]],green,2.1);
    line(c,[[943,250],[943,219],[962,219],[962,250]],faint,1.8);
    c.strokeStyle=faint;c.strokeRect(974,211,13,14);
    line(c,[[883,263],[1026,260]],faint,2);
    line(c,[[1053,256],[1053,213]],ink,1.8);
    line(c,[[1033,218],[1053,174],[1076,216],[1033,218]],green,2);
    star(c,867,111,11,warm);
  }
  c.restore();
}
