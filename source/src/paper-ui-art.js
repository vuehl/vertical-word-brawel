import {glyphCanvas} from './paper-glyph-art.js';

// A field notebook for the three starters. The lobby keeps this static canvas
// between requests and scales the whole spread to the space above its buttons.
export function drawCoopMap(canvas){
  const c=canvas.getContext('2d');
  c.save();c.scale(canvas.width/360,canvas.height/360);
  c.lineJoin='round';c.lineCap='round';
  function sheet(x,y,w,h,fill,edge){
    c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
    if(edge){c.strokeStyle=edge;c.lineWidth=1.3;c.stroke();}
  }
  function shape(points,fill,edge){
    c.beginPath();c.moveTo(...points[0]);
    for(const point of points.slice(1))c.lineTo(...point);
    c.closePath();c.fillStyle=fill;c.fill();
    if(edge){c.strokeStyle=edge;c.lineWidth=1.2;c.stroke();}
  }
  function hills(x,y,scale){
    c.save();c.translate(x,y);c.scale(scale,scale);
    shape([[-19,7],[-7,-10],[1,0],[8,-14],[25,7]],'#dbe5d3','#b1c4ac');
    shape([[2,-4],[8,-14],[14,-5],[10,-7],[8,-4],[6,-7]],'#faf7e8');
    c.restore();
  }
  c.save();c.translate(178,184);c.rotate(-.09);
  sheet(-132,-124,264,257,'#d8d9c6');
  sheet(-133,-129,265,257,'#adc4ae','#879d8b');
  shape([[74,119],[89,119],[89,144],[82,138],[74,144]],'#ca8372','#ad7467');
  c.restore();

  c.translate(180,178);c.rotate(.045);
  sheet(-136,-125,272,256,'#d7cfb7','#b6b5a0');
  sheet(-136,-129,272,256,'#fffbee','#aaa996');
  c.strokeStyle='#e6e9da';c.lineWidth=.7;c.beginPath();
  for(let x=-112;x<=120;x+=16){c.moveTo(x,-119);c.lineTo(x,116);}
  for(let y=-111;y<=116;y+=16){c.moveTo(-126,y);c.lineTo(126,y);}
  c.stroke();
  c.strokeStyle='#e7c6b9';c.beginPath();c.moveTo(-111,-127);c.lineTo(-111,125);c.stroke();
  for(const y of [-81,0,81]){
    c.beginPath();c.arc(-124,y,3.5,0,Math.PI*2);c.fillStyle='#b5b9a4';c.fill();
  }
  // Translucent washi tape, torn at both ends.
  c.save();c.translate(-37,-127);c.rotate(-.13);
  shape([[-33,-8],[33,-8],[30,-3],[33,1],[30,7],[-32,7],[-29,2],[-33,-2]],'#e9c975d9');
  c.restore();
  hills(-68,-86,.74);hills(59,70,.9);hills(-54,96,.53);

  c.strokeStyle='#86a495';c.lineWidth=2.6;c.setLineDash([3,5]);c.beginPath();
  c.moveTo(-99,81);c.bezierCurveTo(-58,96,-90,43,-55,48);
  c.bezierCurveTo(-8,53,50,70,36,18);c.bezierCurveTo(27,-13,-37,9,-31,-32);
  c.bezierCurveTo(-28,-65,33,-37,66,-69);c.stroke();c.setLineDash([]);
  c.fillStyle='#c99460';c.beginPath();c.arc(-99,81,4,0,Math.PI*2);c.fill();
  c.strokeStyle='#786e61';c.lineWidth=2.5;c.beginPath();c.moveTo(65,-69);c.lineTo(65,-103);c.stroke();
  shape([[66,-103],[92,-100],[85,-93],[92,-85],[66,-89]],'#d78069','#a36555');
  for(const [word,x,y,size] of [['风',-59,43,68],['炎',29,17,85],['摹',-26,-47,69]]){
    c.fillStyle='#85917d38';c.beginPath();c.ellipse(x,y+3,size*.31,5,0,0,Math.PI*2);c.fill();
    c.drawImage(glyphCanvas(word),x-size/2,y-size*.84,size,size);
  }
  // A yellow pencil rests across the lower corner of the map.
  c.save();c.translate(85,110);c.rotate(-.42);
  shape([[-45,0],[-31,-5],[43,-5],[43,5],[-31,5]],'#edce81','#907b59');
  shape([[-45,0],[-31,-5],[-31,5]],'#eed6b4');
  shape([[-45,0],[-39,-2],[-39,2]],'#525850');
  c.fillStyle='#c59c58';c.fillRect(-30,2,57,2);
  c.fillStyle='#9bb1a8';c.fillRect(28,-4.5,7,9);
  c.fillStyle='#d99483';c.fillRect(35,-4.5,7.5,9);c.restore();
  c.restore();canvas.dataset.static='true';return canvas;
}

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
      for(const [word,x,y,size] of [['风',195,430,130],['炎',390,425,175],['摹',575,454,130]]){
        c.drawImage(glyphCanvas(word),x-size/2,y-size/2,size,size);
      }
      const fade=c.createLinearGradient(0,540,0,600);fade.addColorStop(0,'#f8f5ea00');fade.addColorStop(1,'#f8f5ea');c.fillStyle=fade;c.fillRect(0,540,780,60);
    }else if(variant){c.fillStyle=['#e9d8ad30','#cae7dd30','#d1c4de30'][variant%3];c.fillRect(0,0,780,300);}
    c.restore();canvas.dataset.artReady='true';
  }
  draw();canvas.dataset.static='true';return canvas;
}
