import {facilityNames} from './active-content.js';
import {glyphCanvas} from './paper-glyph-art.js';

export const bossDistanceText=distance=>Number(distance.toFixed(2))+' 厘米';
const friendColors=['#246baa','#15826b','#7850a1'];
export const friendColor=slot=>friendColors[slot]||friendColors[0];

// Draw the bearing in the same canvas as the paper dial. The native HUD
// compositor does not rotate CSS border triangles around a transform origin.
export function drawCompassDial(canvas,angle){
  const step=Math.round(angle*90/Math.PI);
  if(canvas.dataset.frame===String(step))return;
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/64,0,0,canvas.height/64,0,0);
  ctx.clearRect(0,0,64,64);
  const disc=(y,r,color)=>{
    ctx.beginPath();ctx.arc(32,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  };
  disc(34,20,'#6b5948');disc(32,20,'#575b61');disc(32,18.6,'#fff8e8');
  ctx.save();ctx.translate(32,32);ctx.rotate(step*Math.PI/90);
  ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(16,6);ctx.lineTo(18,0);ctx.lineTo(16,-6);ctx.closePath();
  ctx.fillStyle='#e9ae5e';ctx.fill();ctx.strokeStyle='#64513e';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.stroke();
  ctx.restore();
  ctx.strokeStyle='#dac499';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(32,32,15.8,0,Math.PI*2);ctx.stroke();
  canvas.dataset.frame=String(step);
}

// Place labels in the map frame after projecting the icons, so zooming or
// pinning an icon to the rim never changes the distance shown.
function drawBossDistances(ctx,labels,fontSize,obstacles=[]){
  ctx.font='bold '+fontSize+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineJoin='round';ctx.lineWidth=2.5;ctx.strokeStyle='#fffdf5';ctx.fillStyle='#873d32';
  const placed=[];
  for(const label of labels){
    const half=ctx.measureText(label.text).width/2;
    let x,y,best=null;
    const step=fontSize+2,side=label.y>58?-1:1;
    for(let row=0;row<9;row++){
      const offset=(1+Math.floor(row/2))*step*(row%2?-side:side);
      y=Math.max(25,Math.min(91,label.y+offset));
      const chord=Math.sqrt(47**2-(Math.abs(y-58)+fontSize/2)**2);
      const range=Math.max(0,chord-half);
      for(const candidate of [Math.max(60-range,Math.min(60+range,label.x)),60-range,60+range]){
        x=candidate;
        if(Math.abs(y-58)<fontSize/2+5&&Math.abs(x-60)<half+5)continue;
        if(labels.some(icon=>Math.abs(y-icon.y)<fontSize/2+4&&Math.abs(x-icon.x)<half+4))continue;
        if(obstacles.some(b=>x+half+1>b.x&&x-half-1<b.x+b.w&&y+fontSize/2+1>b.y&&y-fontSize/2-1<b.y+b.h))continue;
        if(placed.some(p=>Math.abs(y-p.y)<step&&Math.abs(x-p.x)<half+p.half+1))continue;
        const score=(x-label.x)**2+(y-label.y)**2;
        if(!best||score<best.score)best={x,y,score};
      }
    }
    if(best){x=best.x;y=best.y;}
    ctx.strokeText(label.text,x,y);ctx.fillText(label.text,x,y);placed.push({x,y,half});
  }
}

export function drawBattleCooldown(canvas,progress,{ultimate=false,ready=false,active=false}={}) {
  const ctx=canvas.getContext('2d'),size=ultimate?84:42,c=size/2,r=c-(ultimate?3:2);
  ctx.setTransform(canvas.width/size,0,0,canvas.height/size,0,0);ctx.clearRect(0,0,size,size);
  const fraction=Math.max(0,Math.min(1,progress));
  // Regular skills use only an inset cooldown veil. The slot owns the single
  // static rim, so ready/active skills never acquire another colored ring.
  if(!ultimate){
    if(!ready&&!active&&fraction<1){
      const start=-Math.PI/2;
      ctx.beginPath();
      if(fraction>0)ctx.moveTo(c,c);
      ctx.arc(c,c,r-1,start+2*Math.PI*fraction,start+2*Math.PI);ctx.closePath();ctx.fillStyle='#302e3e80';ctx.fill();
    }
    return;
  }
  const start=Math.PI/2;
  ctx.lineWidth=4.5;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.strokeStyle='#d3d8e3';ctx.stroke();
  if(fraction>0){
    const gradient=ctx.createLinearGradient(0,0,size,size);gradient.addColorStop(0,ready?'#fff3af':'#79e6ff');gradient.addColorStop(1,ready?'#b59aff':'#4587f3');
    ctx.beginPath();ctx.arc(c,c,r,start,start+2*Math.PI*fraction);ctx.strokeStyle=active?'#ffd98a':gradient;ctx.stroke();
  }
}

// Capture/rare/treasure targets need their own symbol, including beyond the
// minimap radius. Keep flags in sync with the runtime enemy flag enum.
export function specialMapMarker(flags,dx,dz,isBoss=false,edgeRadius=40){
  const kind=flags&(128|2048)?'rare':flags&16384?'treasure':isBoss||flags&(4|4096|8192)?'boss':flags&3?'elite':null;
  if(!kind)return null;
  const distance=Math.hypot(dx,dz),edge=distance>edgeRadius,k=edge?edgeRadius/distance:1;
  return {kind,x:60+dx*k,y:58+dz*k,edge,angle:Math.atan2(dz,dx)};
}

export function drawBattleHealth(canvas,fraction,current,bonus=0) {
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/88,0,0,canvas.height/20,0,0);ctx.clearRect(0,0,88,20);
  const capsule=(x,y,w,h,r)=>{
    ctx.beginPath();
    ctx.arc(x+w-r,y+h/2,r,-Math.PI/2,Math.PI/2);
    ctx.arc(x+r,y+h/2,r,Math.PI/2,Math.PI*1.5);
    ctx.closePath();
  };
  const pill=(x,y,w,h,r,color)=>{ctx.fillStyle=color;capsule(x,y,w,h,r);ctx.fill();};
  pill(1,3,86,16,8,'#38576c99');pill(1,1,86,16,8,'#fffef8');pill(3,3,82,12,6,'#3e5759');
  const fill=ctx.createLinearGradient(0,3,0,15);
  fill.addColorStop(0,fraction<.3?'#ffb071':'#a3f59b');fill.addColorStop(1,fraction<.3?'#ef5e4e':'#29cd56');
  ctx.save();capsule(3,3,82,12,6);ctx.clip();
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

export function buildingMapName(marker){
  if(marker.data?.comet)return '';
  if(marker.kind==='chest'&&marker.data?.gift)return facilityNames.freechest;
  return facilityNames[marker.kind]||'';
}
export const buildingMapKinds=['chest','freechest','berry','altar','bill','magnet','ditto','nest','portal'];
export const buildingMapKind=marker=>marker.kind==='chest'&&marker.data?.gift?'freechest':marker.kind==='sanct_portal'?'portal':marker.kind;

export function nearestMapFacility(markers,position,kind){
  if(!kind)return null;
  let target=null,best=Infinity;
  for(const marker of markers){
    if(buildingMapKind(marker)!==kind||marker.data?.comet||(marker.used&&kind!=='portal'))continue;
    const dx=marker.x-position.x,dz=marker.z-position.z,distance=dx*dx+dz*dz;
    if(!Number.isFinite(distance)||distance>=best)continue;
    best=distance;target={kind,x:marker.x,z:marker.z,distance:Math.sqrt(distance),angle:Math.atan2(dz,dx)};
  }
  return target;
}

function drawFacilityGuide(ctx,target){
  // The map is north-up: +X is right and +Z is down. Keep the arrow in the
  // player's existing reserved space, so it cannot cover a facility name.
  ctx.save();ctx.translate(60,58);ctx.rotate(target.angle);
  ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-4);ctx.lineTo(-1.5,0);ctx.lineTo(-4,4);ctx.closePath();
  ctx.lineJoin='round';ctx.lineWidth=1.2;ctx.strokeStyle='#fff9e9';ctx.stroke();
  ctx.fillStyle='#f3b540';ctx.fill();ctx.restore();
}

// Only neighbouring places of the same type share a label. Keep every real
// location as a dot, and anchor each group at its nearest member, not a new point.
export function layoutBuildingNames(labels,measure,fontSize){
  const box=group=>{
    const text=group.text+(group.count>1?' ×'+group.count:'');
    const w=Math.min(80,measure(text)+6),h=fontSize+4;
    const limit=Math.sqrt(47**2-(w/2)**2)-h/2;
    let y=Math.max(58-limit,Math.min(58+limit,group.y));
    const fitX=()=>{
      const half=Math.sqrt(Math.max(0,47**2-(Math.abs(y-58)+h/2)**2))-w/2;
      return Math.max(60-half,Math.min(60+half,group.x));
    };
    let x=fitX();
    if(Math.abs(x-60)<w/2+6&&Math.abs(y-58)<h/2+7){
      y=Math.max(58-limit,Math.min(58+limit,58+(y<58?-1:1)*(h/2+8)));x=fitX();
    }
    return {...group,label:text,box:{x:x-w/2,y:y-h/2,w,h}};
  };
  const groups=labels.map(label=>box({...label,count:1})).sort((a,b)=>
    Math.hypot(a.x-60,a.y-58)-Math.hypot(b.x-60,b.y-58)||a.x-b.x||a.y-b.y);
  for(let changed=true;changed;){
    changed=false;
    outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const a=groups[i],b=groups[j],u=a.box,v=b.box;
      if(a.kind!==b.kind||u.x>v.x+v.w+2||v.x>u.x+u.w+2||u.y>v.y+v.h+2||v.y>u.y+u.h+2)continue;
      groups[i]=box({...a,count:a.count+b.count});groups.splice(j,1);changed=true;break outer;
    }
  }
  return groups;
}
function mapLabelPill(ctx,x,y,w,h){
  const r=h/2;ctx.beginPath();ctx.arc(x+w-r,y+r,r,-Math.PI/2,Math.PI/2);
  ctx.arc(x+r,y+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();
}
function drawBuildingNames(ctx,labels,fontSize){
  ctx.font='700 '+fontSize+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const groups=layoutBuildingNames(labels,text=>ctx.measureText(text).width,fontSize);
  for(const label of labels){
    ctx.beginPath();ctx.arc(label.x,label.y,fontSize*.2,0,Math.PI*2);ctx.fillStyle='#4d7891';ctx.fill();
  }
  for(const group of groups){
    const {x,y,w,h}=group.box;
    mapLabelPill(ctx,x,y,w,h);ctx.fillStyle='#fffef9';ctx.fill();
    ctx.lineWidth=.65;ctx.strokeStyle=group.kind==='boss'?'#b19878':'#a6bdc8';ctx.stroke();
    ctx.fillStyle=group.kind==='boss'?'#85613a':'#315a70';ctx.fillText(group.label,x+w/2,y+h/2,w-6);
  }
  return groups;
}

// Both map sizes use a north-up projection. In co-op the open map follows peer snapshots.
export function drawBattleMinimap(canvas,run,{shadow=true,viewRatio=1,facilityKind=run.ui?.mapFacilityKind??null}={}) {
  const ctx=canvas.getContext('2d'),p=run.player.pos,scale=.9;
  const distances=[],buildingNames=[];
  const markers=run.events?.blind?[]:run.interactables.markers();
  // Search the whole current area, including targets beyond the visible map.
  const guidance=shadow?nearestMapFacility(markers,p,facilityKind):null;
  const radius=49*viewRatio,edgeRadius=radius-9;
  const point=(x,z)=>[60+(x-p.x)*scale,58+(z-p.z)*scale];
  const visible=(x,y)=>(x-60)**2+(y-58)**2<=radius**2;
  const dot=(x,y,r,color,outline='#fffdf2')=>{
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.lineWidth=1.1;ctx.strokeStyle=outline;ctx.stroke();}
  };
  ctx.setTransform(canvas.width/120,0,0,canvas.height/120,0,0);ctx.clearRect(0,0,120,120);
  if(shadow)dot(60,62,56,'#527ab2',null);
  dot(60,58,56,'#fffdf7',null);dot(60,58,52,'#c3daeb',null);dot(60,58,49,'#f4f6f2',null);
  ctx.save();ctx.beginPath();ctx.arc(60,58,49,0,Math.PI*2);ctx.clip();
  // Scale map contents around the player within the fixed circular frame.
  ctx.translate(60,58);ctx.scale(1/viewRatio,1/viewRatio);ctx.translate(-60,-58);
  if(!run.events?.blind){
    const left=60-radius,right=60+radius,top=58-radius,bottom=58+radius;
    const half=run.terrain.world/2,[bx,by]=point(-half,-half);
    ctx.strokeStyle='#c3cec6';ctx.lineWidth=1;ctx.strokeRect(bx,by,half*2*scale,half*2*scale);
    for(const prop of run.terrain.zxProps||[]){
      if(prop.w*prop.d<80)continue;
      const [x,y]=point(prop.x,prop.z),w=Math.max(2,prop.w*scale),h=Math.max(2,prop.d*scale);
      if(x+w/2<left||y+h/2<top||x-w/2>right||y-h/2>bottom)continue;
      ctx.fillStyle='#e4eae3';
      ctx.fillRect(x-w/2,y-h/2,w,h);
    }
    for(const cover of run.sanctuary?.covers||[]){
      if(!cover.alive)continue;const [x,y]=point(cover.x,cover.z);
      if(visible(x,y))dot(x,y,Math.max(2,cover.r*scale),'#d6dfd2',null);
    }
    for(const marker of markers){
      const [x,y]=point(marker.x,marker.z);if(!visible(x,y))continue;
      const portal=marker.kind==='portal'||marker.kind==='sanct_portal';
      const kind=buildingMapKind(marker),name=portal?facilityNames.portal:buildingMapName(marker);
      if(facilityKind&&kind!==facilityKind&&kind!=='boss'&&!portal)continue;
      if(name){
        buildingNames.push({text:name,kind,x:60+(x-60)/viewRatio,y:58+(y-58)/viewRatio});
        continue;
      }
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
        const type=(enemies.flags[i]&(128|2048|16384))?3:boss(i)?2:(enemies.flags[i]&3)?1:0;if(type!==kind)continue;
        const x=60+(enemies.x[i]-p.x)*scale,y=58+(enemies.z[i]-p.z)*scale;
        if(!visible(x,y))continue;
        if(kind>0&&(x-60)**2+(y-58)**2>edgeRadius**2)continue;
        if(kind===2){
          dot(x,y,6.3,'#fff4dd','#d65b46');
          ctx.drawImage(glyphCanvas(enemies.glyphWords[i]),x-6,y-6,12,12);
        }else{
          const radius=kind?3:1.7;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);
        }
      }
      if(kind<2)ctx.fill();
    }
    for(let i=0;i<enemies.n;i++){
      if(!enemies.alive[i]||enemies.dying[i]>0||(enemies.flags[i]&32768))continue;
      const marker=specialMapMarker(enemies.flags[i],(enemies.x[i]-p.x)*scale,(enemies.z[i]-p.z)*scale,boss(i),edgeRadius);
      // Alpha, Totem and Summoner are the three timed miniboss encounters.
      if(marker&&(boss(i)||(enemies.flags[i]&2))){
        const meters=Math.hypot(enemies.x[i]-p.x,enemies.z[i]-p.z);
        distances.push({x:60+(marker.x-60)/viewRatio,y:58+(marker.y-58)/viewRatio,text:bossDistanceText(meters)});
      }
      if(!marker||(!marker.edge&&marker.kind!=='rare'&&marker.kind!=='treasure'))continue;
      const {x,y,kind,edge,angle}=marker,color={rare:'#27b9cf',treasure:'#d7a32b',boss:'#d65b46',elite:'#e7b42d'}[kind];
      if(edge){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(2,-4);ctx.lineTo(2,4);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();}
      dot(x,y,5.3,'#fffdf7',color);
      ctx.beginPath();ctx.moveTo(x,y-3.7);ctx.lineTo(x+3,y);ctx.lineTo(x,y+3.7);ctx.lineTo(x-3,y);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    for(const ally of run.allies.list){const [x,y]=point(ally.x,ally.z);if(visible(x,y))dot(x,y,2.8,'#559e78');}
  }
  let groups=[];
  if(buildingNames.length){
    // Use fixed-size text at each projected location, inside the map rim.
    // Player and co-op markers are painted afterwards so they stay visible.
    ctx.save();ctx.translate(60,58);ctx.scale(viewRatio,viewRatio);ctx.translate(-60,-58);
    groups=drawBuildingNames(ctx,buildingNames,shadow?10:Math.max(5.2,2880/canvas.width));ctx.restore();
  }
  for(const peer of run.coop?.visiblePeers()||[]){
    const dx=(peer.x-p.x)*scale,dz=(peer.z-p.z)*scale;
    const k=Math.min(1,40*viewRatio/(Math.hypot(dx,dz)||1));
    const x=60+dx*k,y=58+dz*k;
    ctx.save();ctx.translate(x,y);ctx.scale(viewRatio,viewRatio);
    const color=friendColor(peer.slot);
    if(k<1){
      ctx.save();ctx.rotate(Math.atan2(dz,dx));ctx.beginPath();ctx.moveTo(8.5,0);ctx.lineTo(4,-4);ctx.lineTo(4,4);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();
    }
    dot(0,0,5.3,color);ctx.font='bold 8px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('友',0,0);ctx.restore();
  }
  dot(60,58,8.3,'#688dc633',null);dot(60,58,5.7,'#647fbb');
  if(guidance&&guidance.distance>.5)drawFacilityGuide(ctx,guidance);
  else{
    ctx.beginPath();ctx.moveTo(60,53.5);ctx.lineTo(63,60.7);ctx.lineTo(60,59);ctx.lineTo(57,60.7);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
  }
  ctx.restore();
  if(distances.length)drawBossDistances(ctx,distances,shadow?8:4.5,groups.map(group=>group.box));
  // A quiet compass notch lives on the rim, outside the clipped map contents.
  ctx.beginPath();ctx.moveTo(60,3);ctx.lineTo(62.5,8);ctx.lineTo(57.5,8);ctx.closePath();ctx.fillStyle='#527ab2';ctx.fill();
  if(shadow&&facilityKind){
    const title=facilityNames[facilityKind]||'';ctx.font='700 10px sans-serif';
    const w=ctx.measureText(title).width+12;
    mapLabelPill(ctx,60-w/2,104,w,14);ctx.fillStyle='#fffdf7';ctx.fill();
    ctx.fillStyle='#315a70';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(title,60,111);
  }
  return {count:buildingNames.filter(label=>!facilityKind||label.kind===facilityKind).length,groups,guidance};
}
