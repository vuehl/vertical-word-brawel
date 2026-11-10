import {glyphCanvas,glyphWordForSpecies} from './paper-glyph-art.js';

export function drawBattleHealth(canvas,fraction,current,bonus=0) {
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/88,0,0,canvas.height/20,0,0);ctx.clearRect(0,0,88,20);
  const pill=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  pill(1,3,86,16,8,'#38576c99');pill(1,1,86,16,8,'#fffef8');pill(3,3,82,12,6,'#3e5759');
  const fill=ctx.createLinearGradient(0,3,0,15);
  fill.addColorStop(0,fraction<.3?'#ffb071':'#a3f59b');fill.addColorStop(1,fraction<.3?'#ef5e4e':'#29cd56');
  ctx.save();ctx.beginPath();ctx.roundRect(3,3,82,12,6);ctx.clip();
  ctx.fillStyle=fill;ctx.fillRect(3,3,82*fraction,12);ctx.restore();
  const label=String(current)+(bonus?' +'+bonus:'');
  ctx.font='700 '+(label.length>9?9:11)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineWidth=2;ctx.strokeStyle='#fffef8d9';ctx.strokeText(label,44,9.5);ctx.fillStyle='#263f36';ctx.fillText(label,44,9.5);
}

export function drawBattlePortrait(canvas,word,tone,experience=0) {
  const ctx=canvas.getContext('2d'),palette={fire:['#fff2dc','#ffd2a3','#ef9a52'],water:['#eefbff','#c4e9fc','#54aff0'],wood:['#f1fae8','#cfe7ba','#79b78a']}[tone]||['#f4f1ff','#ddd5f1','#9a89c2'];
  const disc=(x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
  ctx.setTransform(canvas.width/80,0,0,canvas.height/84,0,0);ctx.clearRect(0,0,80,84);
  disc(40,43,38,'#91a6b8');disc(40,39,38,'#fffdf7');disc(40,39,36.5,'#dce9f6');disc(40,39,31.5,palette[2]);disc(40,39,30,'#fff');
  const paper=ctx.createLinearGradient(12,8,64,70);paper.addColorStop(0,palette[0]);paper.addColorStop(1,palette[1]);disc(40,39,28.5,paper);
  const progress=Math.max(0,Math.min(1,experience));
  if(progress>0){
    const blue=ctx.createLinearGradient(12,6,68,72);blue.addColorStop(0,'#66dcff');blue.addColorStop(1,'#377ff0');
    // Start at six o'clock, then fill through the left, top and right sides.
    const start=Math.PI/2;
    ctx.strokeStyle=blue;ctx.lineWidth=4.5;ctx.lineCap='butt';ctx.beginPath();ctx.arc(40,39,34,start,start+Math.PI*2*progress);ctx.stroke();
  }
  ctx.drawImage(glyphCanvas(word,tone),12,11,56,56);canvas.dataset.word=word;
}

// One north-up projection for both map sizes. The small HUD refreshes at most
// every 120 ms; the enlarged view is drawn once while the battle is paused.
export function drawBattleMinimap(canvas,run) {
  const ctx=canvas.getContext('2d'),p=run.player.pos,scale=.9;
  const point=(x,z)=>[60+(x-p.x)*scale,58+(z-p.z)*scale];
  const visible=(x,y)=>(x-60)**2+(y-58)**2<=49**2;
  const dot=(x,y,r,color,outline='#fffdf2')=>{
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.lineWidth=1.1;ctx.strokeStyle=outline;ctx.stroke();}
  };
  ctx.setTransform(canvas.width/120,0,0,canvas.height/120,0,0);ctx.clearRect(0,0,120,120);
  dot(60,62,56,'#527ab2',null);dot(60,58,56,'#fffdf7',null);dot(60,58,52,'#c3daeb',null);dot(60,58,49,'#eff5f4',null);
  ctx.save();ctx.beginPath();ctx.arc(60,58,49,0,Math.PI*2);ctx.clip();
  if(!run.events?.blind){
    ctx.strokeStyle='#cedee0';ctx.lineWidth=.6;ctx.beginPath();
    const grid=12*scale,ox=60-p.x*scale,oy=58-p.z*scale;
    for(let v=((ox%grid)+grid)%grid;v<120;v+=grid){ctx.moveTo(v,0);ctx.lineTo(v,120);}
    for(let v=((oy%grid)+grid)%grid;v<120;v+=grid){ctx.moveTo(0,v);ctx.lineTo(120,v);}
    ctx.stroke();
    const half=run.terrain.world/2,[bx,by]=point(-half,-half);
    ctx.strokeStyle='#859c7c';ctx.lineWidth=1.5;ctx.strokeRect(bx,by,half*2*scale,half*2*scale);
    for(const prop of run.terrain.zxProps||[]){
      const [x,y]=point(prop.x,prop.z),w=Math.max(2,prop.w*scale),h=Math.max(2,prop.d*scale);
      if(x+w/2<11||y+h/2<9||x-w/2>109||y-h/2>107)continue;
      ctx.fillStyle=prop.kind==='books'?'#a7b59a':prop.kind==='pencil'||prop.kind==='ruler'?'#cab781':'#9bb7aa';
      ctx.fillRect(x-w/2,y-h/2,w,h);
    }
    for(const cover of run.sanctuary?.covers||[]){
      if(!cover.alive)continue;const [x,y]=point(cover.x,cover.z);
      if(visible(x,y))dot(x,y,Math.max(2,cover.r*scale),'#889e78',null);
    }
    for(const marker of run.interactables.markers()){
      const [x,y]=point(marker.x,marker.z);if(!visible(x,y))continue;
      const portal=marker.kind==='portal'||marker.kind==='sanct_portal';
      dot(x,y,portal?4.4:3.7,portal?'#a480c8':'#dfb950');
      ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-1.8,y);ctx.lineTo(x+1.8,y);ctx.moveTo(x,y-1.8);ctx.lineTo(x,y+1.8);ctx.stroke();
    }
    const enemies=run.enemies;
    // One fill for each dot class, rather than a Canvas draw call per monster.
    // Draw bosses last so ordinary dots cannot cover their actual character.
    const boss=i=>!!(enemies.flags[i]&(4|4096|8192))||(run.boss.alive&&run.boss.bossIndex===i);
    for(let kind=0;kind<3;kind++){
      if(kind<2){ctx.beginPath();ctx.fillStyle=kind?'#f2bd29':'#d76677';}
      for(let i=0;i<enemies.n;i++){
        if(!enemies.alive[i]||enemies.dying[i]>0||(enemies.flags[i]&32768))continue;
        const type=boss(i)?2:(enemies.flags[i]&3)?1:0;if(type!==kind)continue;
        const x=60+(enemies.x[i]-p.x)*scale,y=58+(enemies.z[i]-p.z)*scale;
        if(!visible(x,y))continue;
        if(kind===2){
          dot(x,y,6.3,'#fff4dd','#d65b46');
          ctx.drawImage(glyphCanvas(glyphWordForSpecies(enemies.species[i])),x-6,y-6,12,12);
        }else{
          const radius=kind?3:1.7;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);
        }
      }
      if(kind<2)ctx.fill();
    }
    for(const ally of run.allies.list){const [x,y]=point(ally.x,ally.z);if(visible(x,y))dot(x,y,2.8,'#559e78');}
  }
  dot(60,58,8.3,'#688dc633',null);dot(60,58,5.7,'#647fbb');
  ctx.beginPath();ctx.moveTo(60,53.5);ctx.lineTo(63,60.7);ctx.lineTo(60,59);ctx.lineTo(57,60.7);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
  ctx.restore();
  // A quiet compass notch lives on the rim, outside the clipped map contents.
  ctx.beginPath();ctx.moveTo(60,3);ctx.lineTo(62.5,8);ctx.lineTo(57.5,8);ctx.closePath();ctx.fillStyle='#527ab2';ctx.fill();
}
