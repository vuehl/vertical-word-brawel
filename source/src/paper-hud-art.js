import {glyphCanvas} from './paper-glyph-art.js';

// Draw the complete silhouette in one surface: native Canvas does not reproduce
// the browser's skewed corners, layered shadows and outside box shadows.
export function drawProfileCard(canvas,word,tone) {
  const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,264,112);
  const shape=(dy)=>{
    ctx.beginPath();ctx.moveTo(45,15+dy);ctx.lineTo(251,15+dy);
    ctx.quadraticCurveTo(262,15+dy,259,28+dy);ctx.lineTo(252,67+dy);
    ctx.quadraticCurveTo(250,77+dy,238,77+dy);ctx.lineTo(45,77+dy);ctx.closePath();
  };
  shape(6);ctx.fillStyle='#276ac3';ctx.fill();
  const paper=ctx.createLinearGradient(46,15,245,80);paper.addColorStop(0,'#ffffff');paper.addColorStop(1,'#f5f7fd');
  shape(0);ctx.fillStyle=paper;ctx.fill();ctx.strokeStyle='#dfe7f1';ctx.lineWidth=.7;ctx.stroke();
  const circle=(r,fill)=>{ctx.beginPath();ctx.arc(48,49,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();};
  circle(47,'#ffffff');circle(42,'#59adfa');circle(37.5,'#ffffff');
  const blue=ctx.createLinearGradient(22,20,72,82);blue.addColorStop(0,'#e2f9ff');blue.addColorStop(1,'#a9e4f4');circle(34.5,blue);
  ctx.drawImage(glyphCanvas(word,tone),15,16,66,66);
  canvas.dataset.word=word;
}

export function drawExperienceRing(canvas,progress) {
  const ctx=canvas.getContext('2d'),value=Math.max(0,Math.min(1,progress||0));
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,100,104);
  ctx.lineWidth=3.5;ctx.lineCap='round';ctx.strokeStyle='#cde4fa';
  ctx.beginPath();ctx.arc(48,49,44,-Math.PI/2,Math.PI*1.5);ctx.stroke();
  if(value>0){
    const blue=ctx.createLinearGradient(4,8,90,90);blue.addColorStop(0,'#77d4ff');blue.addColorStop(1,'#277bf3');
    ctx.strokeStyle=blue;ctx.beginPath();ctx.arc(48,49,44,-Math.PI/2,-Math.PI/2+Math.PI*2*value);ctx.stroke();
  }
  canvas.dataset.progress=String(value);
  canvas.setAttribute('aria-label','升级经验 '+Math.round(value*100)+'%');
}
