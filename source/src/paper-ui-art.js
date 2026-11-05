import {glyphAtlasReady,glyphCanvas} from './paper-glyph-art.js';

export function drawPaperIllustration(canvas,hero=false,variant=0){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  function draw(){
    c.clearRect(0,0,w,h);c.save();c.scale(w/780,h/(hero?600:300));
    c.fillStyle='#a4d0d8';c.fillRect(0,0,780,600);
    c.save();c.translate(160,hero?230:-120);c.transform(1,.25,-.6,.6,0,0);
    c.fillStyle='#69aac5';c.fillRect(-700,-600,2100,1800);
    c.strokeStyle='#ddf5ed66';c.lineWidth=1.5;
    for(let i=-700;i<1400;i+=28){c.beginPath();c.moveTo(i,-600);c.lineTo(i,1200);c.moveTo(-700,i);c.lineTo(1400,i);c.stroke();}
    function paper(x,y,pw,ph,kind){
      c.fillStyle='#2d485333';c.fillRect(x+8,y+9,pw,ph);c.fillStyle=kind===0?'#d9e8cf':'#fff9e9';c.fillRect(x,y,pw,ph);
      c.strokeStyle='#788a7c';c.lineWidth=1;c.strokeRect(x,y,pw,ph);
      if(kind===0){c.fillStyle='#4f6559a0';for(let yy=y+12;yy<y+ph;yy+=18)for(let xx=x+12;xx<x+pw;xx+=18){c.beginPath();c.arc(xx,yy,1.1,0,7);c.fill();}}
      else {c.strokeStyle='#96b6ba';for(let yy=y+20;yy<y+ph;yy+=25){c.beginPath();c.moveTo(x,yy);c.lineTo(x+pw,yy);c.stroke();}c.strokeStyle='#ddaaa1';c.beginPath();c.moveTo(x+38,y);c.lineTo(x+38,y+ph);c.stroke();}
    }
    paper(-150,-180,670,650,0);paper(380,190,390,520,1);
    // A small 3D-looking calculator, including its bevel and readable keycaps.
    c.save();c.translate(420,-160);c.rotate(-.12);
    c.fillStyle='#33475044';c.fillRect(20,25,170,255);c.fillStyle='#758a87';c.fillRect(0,10,170,255);c.fillStyle='#e1e4d6';c.fillRect(0,0,170,255);
    c.fillStyle='#b9c5ae';c.fillRect(12,14,146,58);c.font='36px monospace';c.textAlign='right';c.fillStyle='#435e52';c.fillText('0',148,61);
    c.font='14px sans-serif';c.textAlign='center';for(let r=0;r<5;r++)for(let k=0;k<4;k++){c.fillStyle='#4d6661';c.fillRect(12+k*38,90+r*31,29,26);c.fillStyle=k===0&&r===0?'#ef9a63':'#9aa79c';c.fillRect(12+k*38,86+r*31,29,26);c.fillStyle='#fffbe5';c.fillText(r===0?['AC','M','%','÷'][k]:String((r*4+k)%10),26+k*38,105+r*31);}c.restore();
    c.save();c.translate(-165,105);c.rotate(.1);c.fillStyle='#a67f9e';c.fillRect(0,12,250,146);c.fillStyle='#bbdfcf';c.fillRect(0,0,250,146);c.fillStyle='#fff4d8';c.fillRect(12,12,226,48);c.fillStyle='#d6a2be';c.fillRect(12,52,226,15);c.fillStyle='#566d85';c.font='14px sans-serif';c.textAlign='left';c.fillText('SMALL WONDERS',24,39);
    for(const x of [69,180]){c.fillStyle='#7b8aa1';c.beginPath();c.arc(x,102,26,0,7);c.fill();c.fillStyle='#ecedc9';c.beginPath();c.arc(x,102,17,0,7);c.fill();}c.restore();
    c.save();c.translate(120,550);c.rotate(-.16);c.fillStyle='#b58e58';c.fillRect(0,7,450,30);c.fillStyle='#edcc7e';c.fillRect(0,0,450,30);c.strokeStyle='#827149';for(let x=8;x<450;x+=10){c.beginPath();c.moveTo(x,0);c.lineTo(x,x%50===8?16:9);c.stroke();}c.restore();
    c.restore();
    if(hero){
      const shade=c.createLinearGradient(0,0,0,310);shade.addColorStop(0,'#f8f5eaff');shade.addColorStop(.7,'#f8f5eaf0');shade.addColorStop(1,'#f8f5ea00');c.fillStyle=shade;c.fillRect(0,0,780,310);
      c.save();c.translate(390,126);c.rotate(-.055);c.font='bold 145px "Ziling Swei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=10;c.strokeStyle='#343044';c.strokeText('字 行',0,8);c.strokeText('字 行',0,0);const gold=c.createLinearGradient(0,-80,0,80);gold.addColorStop(0,'#ffed9d');gold.addColorStop(1,'#e8bc60');c.fillStyle=gold;c.fillText('字 行',0,0);c.restore();
      c.font='bold 23px "Ziling Swei",sans-serif';c.textAlign='center';c.fillStyle='#526f72';c.fillText('桌 上 有 天 地 · 落 字 即 成 灵',390,245);
      for(const [word,x,y,size,angle] of [['水',195,430,130,-.15],['火',390,425,175,.04],['木',575,454,130,.12]]){
        c.fillStyle='#354d5040';c.beginPath();c.ellipse(x+10,y+67,size*.34,size*.12,-.2,0,7);c.fill();c.save();c.translate(x,y);c.rotate(angle);c.drawImage(glyphCanvas(word),-size/2,-size/2,size,size);c.restore();
      }
      const fade=c.createLinearGradient(0,540,0,600);fade.addColorStop(0,'#f8f5ea00');fade.addColorStop(1,'#f8f5ea');c.fillStyle=fade;c.fillRect(0,540,780,60);
    }else if(variant){c.fillStyle=['#e9d8ad30','#cae7dd30','#d1c4de30'][variant%3];c.fillRect(0,0,780,300);}
    c.restore();canvas.dataset.artReady='true';
  }
  draw();canvas.dataset.static='true';glyphAtlasReady().then(draw).catch(()=>{});return canvas;
}
