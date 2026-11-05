import {glyphCanvas} from './paper-glyph-art.js';

export function drawBattlePortrait(canvas,word,tone) {
  const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,60,60);
  ctx.beginPath();ctx.arc(30,30,28,0,Math.PI*2);ctx.fillStyle='#eef0e8';ctx.fill();
  ctx.strokeStyle='#929c89';ctx.lineWidth=1;ctx.stroke();
  ctx.drawImage(glyphCanvas(word,tone),4,4,52,52);canvas.dataset.word=word;
}

// A north-up view of the actual nearby props, enemies and interactions. Keep
// the surface small; the HUD refreshes it at most once every 120 milliseconds.
export function drawBattleMinimap(canvas,run) {
  const ctx=canvas.getContext('2d'),p=run.player.pos,scale=.9,edge=114;
  const point=(x,z)=>[60+(x-p.x)*scale,60+(z-p.z)*scale];
  const visible=(x,y)=>x>=6&&x<=edge&&y>=6&&y<=edge;
  const dot=(x,y,r,color,outline='#fffdf2')=>{
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.lineWidth=1.1;ctx.strokeStyle=outline;ctx.stroke();}
  };
  ctx.setTransform(canvas.width/120,0,0,canvas.height/120,0,0);ctx.clearRect(0,0,120,120);
  ctx.beginPath();ctx.roundRect(1.5,1.5,117,117,13);ctx.fillStyle='#e8efcf';ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle='#fffdf3';ctx.stroke();
  ctx.beginPath();ctx.roundRect(6,6,108,108,8);ctx.strokeStyle='#bdcba3';ctx.lineWidth=1;ctx.stroke();
  ctx.save();ctx.clip();
  if(!run.events?.blind){
    ctx.strokeStyle='#cad5b6';ctx.lineWidth=.6;ctx.beginPath();
    const grid=12*scale,ox=60-p.x*scale,oy=60-p.z*scale;
    for(let v=((ox%grid)+grid)%grid;v<120;v+=grid){ctx.moveTo(v,6);ctx.lineTo(v,edge);}
    for(let v=((oy%grid)+grid)%grid;v<120;v+=grid){ctx.moveTo(6,v);ctx.lineTo(edge,v);}
    ctx.stroke();
    const half=run.terrain.world/2,[bx,by]=point(-half,-half);
    ctx.strokeStyle='#859c7c';ctx.lineWidth=1.5;ctx.strokeRect(bx,by,half*2*scale,half*2*scale);
    for(const prop of run.terrain.zxProps||[]){
      const [x,y]=point(prop.x,prop.z),w=Math.max(2,prop.w*scale),h=Math.max(2,prop.d*scale);
      if(x+w/2<6||y+h/2<6||x-w/2>edge||y-h/2>edge)continue;
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
    for(let i=0;i<enemies.n;i++){
      if(!enemies.alive[i]||enemies.dying[i]>0)continue;
      const [x,y]=point(enemies.x[i],enemies.z[i]);if(!visible(x,y))continue;
      if(run.boss.alive&&run.boss.bossIndex===i)dot(x,y,4.2,'#d85c66');
      else {ctx.fillStyle='#d76677';ctx.fillRect(x-1.4,y-1.4,2.8,2.8);}
    }
    for(const ally of run.allies.list){const [x,y]=point(ally.x,ally.z);if(visible(x,y))dot(x,y,2.8,'#559e78');}
  }
  dot(60,60,6.2,'#9b7bd0');
  ctx.beginPath();ctx.moveTo(60,55.5);ctx.lineTo(63,62.7);ctx.lineTo(60,61);ctx.lineTo(57,62.7);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
  ctx.restore();
}
