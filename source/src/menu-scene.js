const paper='#F4F3F8',ink='#2B2A49';
export function polygon(c,p,fill){c.beginPath();c.moveTo(...p[0]);for(const a of p.slice(1))c.lineTo(...a);c.closePath();c.fillStyle=fill;c.fill();}
export function gradient(c,x,y,xx,yy,a,b){const g=c.createLinearGradient(x,y,xx,yy);g.addColorStop(0,a);g.addColorStop(1,b);return g;}

export function paintWordmark(c,x,y){
c.save();c.translate(x,y);c.rotate(-.035);c.font='bold 191px "Ziling Swei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
    c.strokeStyle='#5B98D6';c.lineWidth=26;c.strokeText('字行',0,0);c.strokeStyle=ink;c.lineWidth=12;c.strokeText('字行',0,0);c.fillStyle=paper;c.fillText('字行',0,0);c.restore();
}

// Menu illustration only. Battle glyph atlases, world textures and skill art
// remain unchanged. These are flat colour cutouts, with no material texture.
export function paintMenuScene(c,width,height,hero,wordImage){
  const w=780,h=hero?1040:340;
  c.save();c.scale(width/w,height/h);
  c.fillStyle=hero?gradient(c,0,0,0,h,'#292943','#21253F'):'#D7E8ED';c.fillRect(0,0,w,h);
  if(hero){
    c.save();c.translate(0,192);
    polygon(c,[[0,350],[90,328],[200,449],[357,473],[0,526]],'#528BD4');
    polygon(c,[[0,377],[161,463],[0,451]],'#3B6CB6');
    polygon(c,[[780,215],[708,268],[656,350],[602,454],[780,443]],gradient(c,610,400,780,250,'#3D6BBD','#78B1DD'));
    c.fillStyle='#5089D3';c.beginPath();c.moveTo(278,470);c.bezierCurveTo(434,325,558,423,780,354);c.lineTo(780,555);c.lineTo(200,555);c.fill();
    c.fillStyle=gradient(c,440,346,610,445,'#C3E3F0','#72A8DC');c.beginPath();c.moveTo(347,471);c.bezierCurveTo(467,365,535,369,617,418);c.bezierCurveTo(520,395,480,451,446,483);c.fill();
    c.fillStyle='#C3E3F0';c.beginPath();c.moveTo(597,439);c.bezierCurveTo(621,344,714,312,750,329);c.bezierCurveTo(789,350,760,383,740,371);c.bezierCurveTo(766,337,671,358,597,439);c.fill();
    c.restore();
    paintWordmark(c,390,305);
  }
  const y=hero?650:0;
  c.save();c.translate(0,y);
  if(hero){c.translate(-78,0);c.scale(1.2,1.2);}
  polygon(c,[[0,42],[780,-12],[780,310],[0,310]],'#C3E0E7');
  polygon(c,[[0,42],[440,11],[620,108],[230,310],[0,211]],'#D9EBEF');
  polygon(c,[[205,275],[484,86],[810,193],[684,340],[372,340]],paper);
  c.save();c.beginPath();c.moveTo(205,275);c.lineTo(484,86);c.lineTo(810,193);c.lineTo(684,340);c.lineTo(372,340);c.closePath();c.clip();
  c.strokeStyle='#D3DEEB';c.lineWidth=1.2;for(let yy=113;yy<370;yy+=25){c.beginPath();c.moveTo(150,yy);c.lineTo(810,yy+70);c.stroke();}c.restore();
  // The desk props are silhouettes of stationery, not bevelled 3D objects.
  c.save();c.translate(666,8);c.transform(1,.15,-.3,.85,0,0);
  polygon(c,[[0,0],[145,0],[156,157],[0,157]],'#98B3C5');c.fillStyle=paper;c.fillRect(0,0,145,148);
  c.fillStyle='#ADBDCC';c.fillRect(12,12,120,22);
  for(let r=0;r<4;r++)for(let k=0;k<4;k++){c.fillStyle=r===0&&k===0?'#DF9180':'#93A7B7';c.fillRect(12+k*31,44+r*24,24,17);}c.restore();
  c.save();c.translate(-22,0);c.rotate(.23);c.fillStyle='#96A1C9';c.fillRect(0,4,175,106);c.fillStyle=paper;c.fillRect(0,0,175,100);c.fillStyle='#C5E1E9';c.fillRect(13,12,144,8);c.fillStyle='#D3D1EB';c.fillRect(0,42,175,58);c.save();c.translate(85,70);c.scale(1,.53);c.fillStyle='#F4F3F8';c.beginPath();c.arc(0,0,30,0,Math.PI*2);c.fill();c.fillStyle='#93ABD6';c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.fill();c.restore();c.restore();
  if(hero){
    for(const [word,x,yy,size] of [['风',286,143,143],['炎',494,138,185]]){
      const image=wordImage(word);
      if(image)c.drawImage(image,x-size/2,yy-size/2,size,size);
    }
  }
  if(!hero){
    c.save();c.translate(18,166);c.rotate(.19);c.fillStyle='#578298';c.fillRect(0,4,345,32);
    c.fillStyle='#97C1CF';c.fillRect(0,0,345,30);
    c.fillStyle='#496981';for(let i=0;i<33;i++)c.fillRect(i*10+8,0,2,i%5===0?12:6);c.restore();
    c.save();c.translate(494,104);c.rotate(-.45);
    c.fillStyle='#688BB3';c.fillRect(0,0,122,9);c.fillStyle='#CFDDE7';c.fillRect(105,0,17,9);
    polygon(c,[[0,0],[0,9],[-15,5]],'#7487A0');c.restore();
  }
  polygon(c,[[0,235],[144,295],[780,266],[780,340],[0,340]],'#3D6FBD');
  polygon(c,[[0,235],[137,295],[70,284],[0,256]],'#7AB7DE');
  c.restore();c.restore();
}

