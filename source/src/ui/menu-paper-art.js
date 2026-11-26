import {paintSettingsSymbol,paperPalette} from './paper-shapes.js';

import {paintWordmark,polygon,gradient} from './menu-scene.js';

const paper='#F4F3F8',ink='#2B2A49';
// Independent lettering can sit on the same desk as the live character cutout.
export function homeWordmark(){
  const cv=document.createElement('canvas');
  cv.width=452;cv.height=240;cv.className='zx-home-wordmark';cv.dataset.static='true';
  cv.setAttribute('aria-hidden','true');paintWordmark(cv.getContext('2d'),226,119);
  return cv;
}

// This is a schematic of the selected itinerary, drawn over the existing stage print.
export function itineraryStamp(regions,single){
  const cv=document.createElement('canvas');
  cv.width=640;cv.height=184;cv.className='journey-itinerary-stamp';
  cv.dataset.static='true';cv.setAttribute('aria-hidden','true');
  const c=cv.getContext('2d');c.scale(2,2);
  const count=single?1:Math.max(1,regions);
  const path=t=>[36+t*(single?122:230),71-34*t-12*Math.sin(t*Math.PI*2)];
  const trace=()=>{c.beginPath();for(let i=0;i<=50;i++){const [x,y]=path(i/50);if(i)c.lineTo(x,y);else c.moveTo(x,y);}};
  c.lineCap='round';trace();c.strokeStyle='rgba(243,241,250,.9)';c.lineWidth=5;c.stroke();
  trace();c.strokeStyle='#547394';c.lineWidth=2;c.setLineDash([4,4]);c.stroke();c.setLineDash([]);
  for(let i=0;i<count;i++){
    const [x,y]=path(i/count);c.beginPath();c.arc(x,y,6,0,Math.PI*2);
    c.fillStyle='#4B6D90';c.fill();c.strokeStyle='#F3F1FA';c.lineWidth=2;c.stroke();
    c.beginPath();c.arc(x,y,1.5,0,Math.PI*2);c.fillStyle='#F3F1FA';c.fill();
  }
  const [x,y]=path(1);
  c.beginPath();c.moveTo(x,y);c.lineTo(x,y-19);c.strokeStyle='#445872';c.lineWidth=2;c.stroke();
  polygon(c,[[x+1,y-20],[x+18,y-20],[x+13,y-15],[x+17,y-11],[x+1,y-11]],'#B75E72');
  return cv;
}


export function menuSymbol(name,size=32,onDark=false){
  const cv=document.createElement('canvas');cv.width=cv.height=size*2;cv.className='paper-menu-symbol';cv.style.width=cv.style.height=size+'px';cv.dataset.static='true';
  cv.setAttribute('aria-hidden','true');const c=cv.getContext('2d');c.scale(size/32*2,size/32*2);c.fillStyle=onDark?paperPalette.warmWhite:ink;c.strokeStyle=c.fillStyle;c.lineWidth=2;c.lineJoin='round';
  const circle=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  if(name==='settings'){
    paintSettingsSymbol(c,0,0,32);
  }else if(name==='duo'){
    const portrait=(x,y,color)=>{
      c.fillStyle=color;
      circle(x,y,4.4);c.stroke();
      c.beginPath();
      c.moveTo(x-7.5,y+16);
      c.quadraticCurveTo(x-7.5,y+6,x,y+6);
      c.quadraticCurveTo(x+7.5,y+6,x+7.5,y+16);
      c.closePath();c.fill();c.stroke();
    };
    c.lineWidth=1.8;
    portrait(22,7,onDark?'#B8AC98':'#A8CBE8');
    portrait(10,11,onDark?paperPalette.warmWhite:'#5C91CC');
  }else if(name==='lab'){
    c.beginPath();c.moveTo(11,3);c.lineTo(21,3);c.moveTo(13,3);c.lineTo(13,12);c.lineTo(5,26);c.quadraticCurveTo(4,29,8,29);c.lineTo(25,29);c.quadraticCurveTo(28,29,26,26);c.lineTo(19,12);c.lineTo(19,3);c.stroke();
    c.beginPath();c.moveTo(9,24.5);c.lineTo(12,19);c.quadraticCurveTo(14,17,16,19);c.quadraticCurveTo(18,21,20,18.5);c.lineTo(23.5,25);c.lineTo(9,25);c.closePath();c.fillStyle=onDark?paperPalette.warmWhite:gradient(c,9,19,23,25,'#337ACC','#6BB3DA');c.fill();
  }else if(name==='star'||name==='stardust'){
    const wallet=name==='stardust';
    const p=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:14;return[16+Math.cos(a)*r,16+Math.sin(a)*r];});
    polygon(c,p,wallet?paperPalette.yellow:'#A77B24');
    if(wallet){c.lineWidth=1.45;c.strokeStyle=paperPalette.warmWhite;}
    c.stroke();
    polygon(c,wallet?[[16,3.2],[16,16],[4.8,19.2],[9.9,12.2]]:[[16,2],[16,16],[3,20],[9,12]],wallet?'#FFEAB1':'#FBE29A');
  }else if(name==='move'){
    c.beginPath();c.ellipse(16,25,12,5,0,0,Math.PI*2);c.fillStyle='#B2C6E4';c.fill();c.stroke();c.beginPath();c.moveTo(16,24);c.lineTo(16,13);c.stroke();c.fillStyle='#C8D3ED';circle(16,10,7);c.stroke();
  }else if(name==='collect'){
    for(const [x,y] of [[11,22],[11,17],[11,12],[23,23]]){c.beginPath();c.ellipse(x,y,8,4,0,0,Math.PI*2);c.fillStyle='#BBCCE8';c.fill();c.stroke();}
  }else if(name==='burst'){
    polygon(c,[[16,1],[20,10],[30,7],[25,17],[31,24],[21,23],[17,31],[12,24],[2,27],[8,17],[2,8],[12,10]],'#C7D2EA');c.stroke();
  }else if(name==='disconnected'){
    polygon(c,[[2,7],[11,4],[21,7],[30,4],[30,25],[21,28],[11,25],[2,28]],'#C9DAEC');c.stroke();
    polygon(c,[[11,4],[21,7],[21,28],[11,25]],'#9EB6D6');
    c.strokeStyle='#485C83';c.lineWidth=1.5;c.beginPath();c.moveTo(5,19);c.lineTo(11,16);c.lineTo(16,18);c.stroke();
    c.fillStyle='#CD727C';circle(23,11,7);c.fillStyle=paper;c.fillRect(22.2,6.8,1.7,5);circle(23,14.5,1);
  }else if(name==='word'){
    c.font='bold 26px "Ziling Swei",sans-serif';c.textAlign='center';c.fillText('字',16,26);
  }
  return cv;
}

// The two home destinations are mounted paper signs with an ink hairline.
// Stretch only the paper face. The icon, divider and live label keep their own dimensions.
export function homeEntryFace(){
  const cv=document.createElement('canvas');cv.width=324;cv.height=108;
  cv.className='paper-entry-face';cv.dataset.static='true';cv.setAttribute('aria-hidden','true');
  const c=cv.getContext('2d');c.scale(2,2);
  polygon(c,[[7,3],[161,0],[155,51],[0,53]],paperPalette.darkStock);
  return cv;
}
