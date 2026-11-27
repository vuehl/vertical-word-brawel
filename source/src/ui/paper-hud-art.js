import {appearanceGlyphCanvas} from './collection-art.js';
import {facilityNames} from '../data/active-content.js';
import {glyphCanvas} from '../actors/paper-glyph-art.js';
import {drawReadyDiamonds} from '../effects/ultimate-ready-diamonds.js';


export const bossDistanceText=distance=>Number(distance.toFixed(2))+' 厘米';

// Two screen slots, with a small dead band at the player's centre line.
// Distance and bearing may change every frame without moving the card.
export function sideGuidePosition(dx,width,height,previous=0,control=null){
  const side=previous&&Math.abs(dx)<.65?previous:dx<0?-1:1;
  // The first frame after a pause can still have zero-sized cached controls.
  // Use the fixed 70px button / 47% bottom inset until its layout is available.
  const bounds=control?.width>0?control:{top:height*.53-35,bottom:height*.53+35};
  // Reserve the action ticket below the ultimate even when it is hidden.
  // These slots depend on viewport/control layout, never combat notices.
  const above=bounds.top-56,below=bounds.bottom+14+62+40;
  const y=above>=210?Math.min(height*.5,above):Math.min(height-50,below);
  return {side,x:side<0?44:width-44,y:Math.round(y)};
}

export function drawAltarProgress(canvas,percent){
  const ctx=canvas.getContext('2d'),size=48,center=size/2,radius=20;
  const color='#FFB84D';
  ctx.setTransform(canvas.width/size,0,0,canvas.height/size,0,0);
  ctx.clearRect(0,0,size,size);
  ctx.beginPath();ctx.arc(center,center,radius,0,Math.PI*2);
  ctx.fillStyle='#211d2680';ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#ffffff40';ctx.stroke();
  if(percent>0){
    ctx.beginPath();ctx.arc(center,center,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*percent/100);
    ctx.lineCap='round';ctx.strokeStyle=color;ctx.stroke();
  }
  ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineWidth=2;ctx.lineJoin='round';ctx.strokeStyle='#211d26';ctx.strokeText(percent+'%',center,center+.5);
  ctx.fillStyle='#ffffff';ctx.fillText(percent+'%',center,center+.5);
}
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
function drawBossDistances(ctx,labels,fontSize){
  ctx.font='bold '+fontSize+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineJoin='round';ctx.lineWidth=2.5;ctx.strokeStyle='#fffdf5';ctx.fillStyle='#873d32';
  for(const label of labels){
    // Reserve the same width even when the distance gains or loses a digit.
    const half=fontSize*4.5,y=Math.min(91,label.y+fontSize+2);
    const range=Math.max(0,Math.sqrt(Math.max(0,47**2-(Math.abs(y-58)+fontSize/2)**2))-half);
    const x=Math.max(60-range,Math.min(60+range,label.x));
    ctx.strokeText(label.text,x,y,half*2);ctx.fillText(label.text,x,y,half*2);
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
  const start=Math.PI/2,ring=r-3;
  const strokeRing=(radius,width,color,from=0,to=Math.PI*2)=>{
    ctx.lineWidth=width;ctx.strokeStyle=color;
    ctx.beginPath();ctx.arc(c,c,radius,from,to);ctx.stroke();
  };
  strokeRing(r,3,active?'#893F56':ready?'#934B60':'#455D85');
  strokeRing(ring,4,'#C3D0E2');
  if(fraction>0){
    ctx.lineCap='round';
    strokeRing(ring,4,active?'#BF647B':ready?'#CE7987':'#7097C5',start,start+2*Math.PI*fraction);
  }
  // The folded ribbon sits inside the track so it never hides the charge arc.
  ctx.beginPath();ctx.moveTo(c-4,8);ctx.lineTo(c+4,8);ctx.lineTo(c+4,15);
  ctx.lineTo(c,12);ctx.lineTo(c-4,15);ctx.closePath();
  ctx.fillStyle=ready||active?'#AA536B':'#8A9CB8';ctx.fill();
}

// Capture/rare/treasure targets need their own symbol, including beyond the
// minimap radius. Keep flags in sync with the runtime enemy flag enum.
export function specialMapMarker(flags,dx,dz,isBoss=false,edgeRadius=40){
  const kind=flags&(128|2048)?'rare':flags&16384?'treasure':isBoss||flags&(4|4096|8192)?'boss':flags&3?'elite':null;
  if(!kind)return null;
  const distance=Math.hypot(dx,dz),edge=distance>edgeRadius,k=edge?edgeRadius/distance:1;
  return {kind,x:60+dx*k,y:58+dz*k,edge,angle:Math.atan2(dz,dx)};
}

export function drawBattleHealth(canvas,fraction,current,maximum,bonus) {
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/88,0,0,canvas.height/20,0,0);ctx.clearRect(0,0,88,20);
  const capsule=(x,y,w,h,r)=>{
    ctx.beginPath();
    ctx.arc(x+w-r,y+h/2,r,-Math.PI/2,Math.PI/2);
    ctx.arc(x+r,y+h/2,r,Math.PI/2,Math.PI*1.5);
    ctx.closePath();
  };
  const pill=(x,y,w,h,r,color)=>{ctx.fillStyle=color;capsule(x,y,w,h,r);ctx.fill();};
  const cut=(y,color)=>{
    ctx.beginPath();ctx.moveTo(7,y);ctx.lineTo(81,y);ctx.lineTo(88,y+7);
    ctx.lineTo(81,y+15);ctx.lineTo(7,y+15);ctx.lineTo(0,y+7);ctx.closePath();
    ctx.fillStyle=color;ctx.fill();
  };
  cut(4,'#526785');cut(1,'#F3F1FA');pill(3,3,82,12,6,'#3e5759');
  const fill=ctx.createLinearGradient(0,3,0,15);
  fill.addColorStop(0,fraction<.3?'#F1A2A0':'#83CC68');
  fill.addColorStop(1,fraction<.3?'#C96B76':'#4B9F52');
  ctx.save();capsule(3,3,82,12,6);ctx.clip();
  const shieldWidth=bonus>0?Math.max(1,82*bonus/(maximum+bonus)):0;
  const healthWidth=(82-shieldWidth)*fraction;
  ctx.fillStyle=fill;ctx.fillRect(3,3,healthWidth,12);
  if(shieldWidth>0){
    const shield=ctx.createLinearGradient(0,3,0,15);
    shield.addColorStop(0,'#FAFCFD');
    shield.addColorStop(1,'#B7C1C9');
    ctx.fillStyle=shield;
    ctx.fillRect(3+healthWidth,3,shieldWidth,12);
  }
  ctx.restore();
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
export const mapWorldScale=.9;
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
  ctx.lineJoin='round';ctx.lineWidth=1;ctx.strokeStyle='#FBE8AC';ctx.stroke();
  ctx.fillStyle='#3B3034';ctx.fill();ctx.restore();
}

// Icons always occupy their projected world coordinates. Crowding may hide a
// name, but must never move an icon or merge it with a different location.
export function layoutBuildingIcons(markers,size,player={x:60,y:58},labelSize=0,square=false,halfHeight=47){
  const groups=markers.map(marker=>{
    const w=Math.max(size,marker.labelWidth||0);
    const icon={x:marker.x-size/2,y:marker.y-size/2,w:size,h:size};
    const label={x:marker.x-w/2,y:marker.y+size/2+1.5,w,h:labelSize};
    return {...marker,count:1,box:{x:label.x,y:icon.y,w,h:size+(labelSize?labelSize+1.5:0)},hitBoxes:[icon],label};
  });
  const overlaps=(a,b)=>a.x<b.x+b.w+1&&a.x+a.w+1>b.x&&a.y<b.y+b.h+1&&a.y+a.h+1>b.y;
  const names=[];
  // World order is independent of the player's distance to the buildings.
  for(const group of [...groups].sort((a,b)=>a.y-b.y||a.x-b.x||a.kind.localeCompare(b.kind))){
    const b=group.label;
    group.showLabel=!!labelSize&&[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].every(([x,y])=>
      square?Math.abs(x-60)<=47&&Math.abs(y-58)<=halfHeight:Math.hypot(x-60,y-58)<=47)&&
      !groups.some(other=>other!==group&&overlaps(b,other.hitBoxes[0]))&&!names.some(other=>overlaps(b,other));
    if(group.showLabel){group.hitBoxes.push(b);names.push(b);}
  }
  return groups;
}
function drawBuildingIcons(ctx,markers,size,iconFor,player,labelSize=0,square=false,halfHeight=47){
  if(labelSize){
    ctx.font='bold '+labelSize+'px "Ziling Swei", sans-serif';
    markers=markers.map(marker=>({...marker,labelWidth:ctx.measureText(facilityNames[marker.kind]).width+2}));
  }
  const groups=layoutBuildingIcons(markers,size,player,labelSize,square,halfHeight);
  for(const group of groups){
    const {y,w:boxWidth}=group.box,x=group.box.x+(boxWidth-size)/2,icon=iconFor?.(group.kind);
    if(icon?.naturalWidth && icon.naturalHeight){
      const scale=size/Math.max(icon.naturalWidth,icon.naturalHeight);
      const w=icon.naturalWidth*scale,h=icon.naturalHeight*scale;
      ctx.drawImage(icon,x+(size-w)/2,y+(size-h)/2,w,h);
    }else{
      const cx=x+size/2,cy=y+size/2;
      ctx.beginPath();ctx.arc(cx,cy,size*.44,0,Math.PI*2);ctx.fillStyle='#426178';ctx.fill();
      ctx.font='bold '+size*.56+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#fff';ctx.fillText(facilityNames[group.kind][0],cx,cy);
    }
    if(group.showLabel){
      const name=facilityNames[group.kind],cx=group.box.x+boxWidth/2,cy=y+size+1.5+labelSize/2;
      ctx.font='bold '+labelSize+'px "Ziling Swei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.lineJoin='round';ctx.lineWidth=1.6;ctx.strokeStyle='#fffdf7';ctx.strokeText(name,cx,cy);
      if(square){
        ctx.fillStyle='#FFF5DF';ctx.fillRect(group.box.x,cy-labelSize*.6,boxWidth,labelSize*1.2);
      }
      ctx.fillStyle=square?'#393039':'#385365';ctx.fillText(name,cx,cy);
    }
  }
  return groups;
}

// Labels and symbols use the same north-up projection in both views.
const atlasSize=101;
function finishAtlasPaper(ctx){
  for(const x of [43,75]){
    const crease=ctx.createLinearGradient(x-2,0,x+2.8,0);
    crease.addColorStop(0,'rgba(103,87,55,0)');
    crease.addColorStop(.48,'rgba(103,87,55,.08)');
    crease.addColorStop(.52,'rgba(255,247,218,.12)');
    crease.addColorStop(1,'rgba(255,247,218,0)');
    ctx.fillStyle=crease;ctx.fillRect(x-2,7,4.8,102);
  }
}

// Both map sizes use a north-up projection. In co-op the open map follows peer snapshots.
export function drawBattleMinimap(canvas,run,{shadow=true,viewRatio=1,hanging=false,square=false,atlas=null,facilityKind=run.ui?.mapFacilityKind??null,iconFor=run.ui?.mapFacilityIcon,center=run.player.pos}={}) {
  const ctx=canvas.getContext('2d'),p=run.player.pos,scale=mapWorldScale;
  const distances=[],buildings=[];
  const markers=run.interactables.markers();
  // Search the whole current area, including targets beyond the visible map.
  const guidance=shadow?nearestMapFacility(markers,p,facilityKind):null;
  const radius=49*viewRatio,edgeRadius=radius-9;
  const point=(x,z)=>[60+(x-center.x)*scale,58+(z-center.z)*scale];
  const [px,py]=point(p.x,p.z);
  const playerOnDial={x:60+(px-60)/viewRatio,y:58+(py-58)/viewRatio};
  const visible=(x,y)=>square?Math.max(Math.abs(x-60),Math.abs(y-58))<=radius:(x-60)**2+(y-58)**2<=radius**2;
  const dot=(x,y,r,color,outline='#fffdf2')=>{
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.lineWidth=1.1;ctx.strokeStyle=outline;ctx.stroke();}
  };
  ctx.setTransform(canvas.width/120,0,0,canvas.height/120,0,0);ctx.clearRect(0,0,120,120);
  const mapHeight=atlasSize*canvas.height/canvas.width;
  if(square){
    const unit=canvas.width/atlasSize;
    ctx.setTransform(unit,0,0,unit,-unit*(60-atlasSize/2),-unit*(58-mapHeight/2));
  }else{
    if(hanging){
      ctx.translate(60,60);ctx.scale(1.14,1.14);ctx.translate(-60,-58);
      dot(60,58,51.5,'#322A36',null);
      for(const angle of [-2.4,.68]){
        ctx.beginPath();ctx.arc(60,58,50.4,angle,angle+.48);ctx.lineWidth=2.2;ctx.strokeStyle='#EEC659';ctx.stroke();
      }
      dot(60,58,49,'#E9E2D1',null);
    }else{
      if(shadow)dot(60,62,56,'#527ab2',null);
      dot(60,58,56,'#fffdf7',null);dot(60,58,52,'#c3daeb',null);dot(60,58,49,'#eff5f4',null);
    }
  }
  ctx.save();ctx.beginPath();if(square)ctx.rect(60-atlasSize/2,58-mapHeight/2,atlasSize,mapHeight);else ctx.arc(60,58,49,0,Math.PI*2);ctx.clip();
  // Scale map contents around the player within the fixed circular frame.
  ctx.translate(60,58);ctx.scale(1/viewRatio,1/viewRatio);ctx.translate(-60,-58);
  const left=60-radius,right=60+radius,top=58-radius,bottom=58+radius;
  if(atlas?.art){
    const [x,y]=point(-atlas.x,-atlas.z),w=2*atlas.x*scale,h=2*atlas.z*scale;
    ctx.drawImage(atlas.art,x,y,w,h);
    // The map and its ruled margin use one world-space grid.
    const step=Math.max(atlas.x,atlas.z)*scale/4;
    ctx.strokeStyle='rgba(115,101,77,.10)';ctx.lineWidth=.16*viewRatio;ctx.beginPath();
    const [ox,oy]=point(0,0);
    for(let col=ox+Math.ceil((left-ox)/step)*step;col<=right;col+=step){
      ctx.moveTo(col,top);ctx.lineTo(col,bottom);
    }
    for(let row=oy+Math.ceil((top-oy)/step)*step;row<=bottom;row+=step){
      ctx.moveTo(left,row);ctx.lineTo(right,row);
    }
    ctx.stroke();
    ctx.save();ctx.translate(60,58);ctx.scale(viewRatio,viewRatio);ctx.translate(-60,-58);
    if(square)finishAtlasPaper(ctx);ctx.restore();
  }else{
    const half=run.terrain.world/2,[bx,by]=point(-half,-half);
    ctx.strokeStyle='#c3cec6';ctx.lineWidth=1;ctx.strokeRect(bx,by,half*2*scale,half*2*scale);
    for(const prop of run.terrain.zxProps||[]){
      if(prop.w*prop.d<80)continue;
      const [x,y]=point(prop.x,prop.z),w=Math.max(2,prop.w*scale),h=Math.max(2,prop.d*scale);
      if(x+w/2<left||y+h/2<top||x-w/2>right||y-h/2>bottom)continue;
      ctx.fillStyle='#e4eae3';
      ctx.fillRect(x-w/2,y-h/2,w,h);
    }
  }
  for(const cover of run.sanctuary?.covers||[]){
    if(!cover.alive)continue;const [x,y]=point(cover.x,cover.z);
    if(visible(x,y))dot(x,y,Math.max(2,cover.r*scale),'#d6dfd2',null);
  }
  for(const marker of markers){
    const [x,y]=point(marker.x,marker.z);if(!visible(x,y))continue;
    const portal=marker.kind==='portal'||marker.kind==='sanct_portal';
    const kind=buildingMapKind(marker),name=portal?facilityNames.portal:buildingMapName(marker);
    if(facilityKind&&kind!==facilityKind&&(!shadow||(kind!=='boss'&&!portal)))continue;
    if(name){
      buildings.push({kind,x:60+(x-60)/viewRatio,y:58+(y-58)/viewRatio});
      continue;
    }
    dot(x,y,portal?4.4:3.7,portal?'#a480c8':'#dfb950');
    ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-1.8,y);ctx.lineTo(x+1.8,y);ctx.moveTo(x,y-1.8);ctx.lineTo(x,y+1.8);ctx.stroke();
  }
  // Fog obscures combatants while landmarks and facility guidance stay visible.
  if(!run.events?.blind&&(shadow||!facilityKind)){
    const enemies=run.enemies;
    // One fill for each dot class, rather than a Canvas draw call per monster.
    // Draw bosses last so ordinary dots cannot cover their actual character.
    const boss=i=>!!(enemies.flags[i]&(4|4096|8192))||(run.boss.alive&&run.boss.bossIndex===i);
    for(let kind=0;kind<3;kind++){
      if(kind<2){ctx.beginPath();ctx.fillStyle=kind?'#f2bd29':'#d76677';}
      for(let i=enemies.firstAlive??0;i<enemies.n;i++){
        if(!enemies.alive[i]||enemies.dying[i]>0||(enemies.flags[i]&32768))continue;
        const type=(enemies.flags[i]&(128|2048|16384))?3:boss(i)?2:(enemies.flags[i]&3)?1:0;if(type!==kind)continue;
        const x=60+(enemies.x[i]-center.x)*scale,y=58+(enemies.z[i]-center.z)*scale;
        if(!visible(x,y))continue;
        if(!square&&kind>0&&(x-60)**2+(y-58)**2>edgeRadius**2)continue;
        if(kind===2){
          dot(x,y,6.3,'#fff4dd','#d65b46');
          ctx.drawImage(glyphCanvas(enemies.glyphWords[i]),x-6,y-6,12,12);
        }else{
          const radius=kind?3:1.7;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);
        }
      }
      if(kind<2)ctx.fill();
    }
    for(let i=enemies.firstAlive??0;i<enemies.n;i++){
      if(!enemies.alive[i]||enemies.dying[i]>0||(enemies.flags[i]&32768))continue;
      const dx=(enemies.x[i]-center.x)*scale,dz=(enemies.z[i]-center.z)*scale;
      const markerEdge=square&&visible(60+dx,58+dz)?Infinity:edgeRadius;
      const marker=specialMapMarker(enemies.flags[i],dx,dz,boss(i),markerEdge);
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
  if(buildings.length){
    ctx.save();ctx.translate(60,58);ctx.scale(viewRatio,viewRatio);ctx.translate(-60,-58);
    const compact=canvas.width<480;
    const size=shadow?14:Math.min(16,Math.max(8,(compact?3840:4320)/canvas.width));
    const labelSize=shadow?9:(compact?2400:2640)/canvas.width;
    groups=drawBuildingIcons(ctx,buildings,size,iconFor,playerOnDial,labelSize,square,mapHeight/2-3.5);ctx.restore();
  }
  for(const peer of run.coop?.visiblePeers()||[]){
    const dx=(peer.x-center.x)*scale,dz=(peer.z-center.z)*scale;
    const k=square?1:Math.min(1,40*viewRatio/(Math.hypot(dx,dz)||1));
    const x=60+dx*k,y=58+dz*k;
    ctx.save();ctx.translate(x,y);ctx.scale(viewRatio,viewRatio);
    const color=friendColor(peer.slot);
    if(k<1){
      ctx.save();ctx.rotate(Math.atan2(dz,dx));ctx.beginPath();ctx.moveTo(8.5,0);ctx.lineTo(4,-4);ctx.lineTo(4,4);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();
    }
    dot(0,0,5.3,color);ctx.font='bold 8px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('友',0,0);ctx.restore();
  }
  ctx.save();ctx.translate(px,py);
  if(square)ctx.scale(.64*viewRatio,.64*viewRatio);
  ctx.translate(-60,-58);
  dot(60,58,8.3,'#fff5dfb0',null);dot(60,58,5.7,'#F4CA59','#373039');
  if(guidance&&guidance.distance>.5)drawFacilityGuide(ctx,guidance);
  else{
    ctx.beginPath();ctx.moveTo(60,53.5);ctx.lineTo(63,60.7);ctx.lineTo(60,59);ctx.lineTo(57,60.7);ctx.closePath();ctx.fillStyle='#332B32';ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  if(distances.length)drawBossDistances(ctx,distances,shadow?8:4.5);
  if(square){
    return {count:buildings.length,groups,guidance};
  }
  // The north marker sits in a recessed paper notch at the top of the rim.
  if(hanging){
    ctx.beginPath();ctx.moveTo(53.5,7);ctx.lineTo(66.5,7);ctx.lineTo(65,12.5);ctx.lineTo(55,12.5);ctx.closePath();ctx.fillStyle='#EFF5F4';ctx.fill();
    ctx.beginPath();ctx.moveTo(55,6.7);ctx.lineTo(64.5,6.7);ctx.lineTo(63.5,10.2);ctx.lineTo(56,9.5);ctx.closePath();ctx.fillStyle='#322A36';ctx.fill();
  }
  ctx.beginPath();ctx.moveTo(60,hanging?7.5:3);ctx.lineTo(hanging?61.5:62.5,hanging?10.5:8);ctx.lineTo(hanging?58.5:57.5,hanging?10.5:8);ctx.closePath();ctx.fillStyle=hanging?'#EEC659':'#527ab2';ctx.fill();
  return {count:buildings.filter(marker=>!facilityKind||marker.kind===facilityKind).length,groups,guidance};
}
// Draw at the displayed aspect ratio. The portrait overhangs the shared ticket.
export function drawBattleStatus(canvas,{word,tone,look,level,progress,gold,kills},coin){
  const g=canvas.getContext('2d'),w=canvas.width/2;
  const yellow='#EEC659',white='#FFF7E9',left=56,right=w-11;
  g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,w,canvas.height/2);
  const shape=(pts,fill)=>{
    g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);
    g.closePath();g.fillStyle=fill;g.fill();
  };
  shape([[7,4],[w-6,4],[w-1,6],[w-2.6,16],[w-4.8,17.8],[w-2.7,18.8],
    [w-5.2,35.3],[w-3.7,37.1],[w-6,49.5],[7,50]],'rgba(32,28,37,.86)');

  // Both sizes of type on the level label share one baseline. Reserve room for
  // a short experience rail even at high levels or when it reads 100%.
  const fraction=Math.max(0,Math.min(1,progress)),percent=Math.floor(fraction*100+.00001)+'%';
  g.textBaseline='alphabetic';g.textAlign='left';g.font='bold 11px Arial, sans-serif';
  const trackEnd=right-g.measureText(percent).width-5;
  g.font='italic bold 9px Arial, sans-serif';
  const numberX=left+4+g.measureText('Lv.').width+2;
  const levelFont='italic 900 19px Arial, sans-serif';
  g.font=levelFont;
  const numberWidth=Math.min(g.measureText(level).width,trackEnd-14-5-7-numberX);
  const labelEnd=numberX+numberWidth+7,trackStart=labelEnd+5;
  shape([[left,7],[labelEnd,7],[labelEnd-3.5,27],[left,27]],yellow);
  g.fillStyle='#241D25';g.font='italic bold 9px Arial, sans-serif';g.fillText('Lv.',left+4,22.8);
  g.font=levelFont;g.fillText(level,numberX,22.8,numberWidth);
  g.save();g.translate(trackStart,14.5);g.transform(1,0,-.176,1,0,0);
  g.fillStyle='#71666F';g.fillRect(0,0,trackEnd-trackStart,5);
  g.fillStyle=yellow;g.fillRect(0,0,(trackEnd-trackStart)*fraction,5);g.restore();
  g.fillStyle=white;g.font='bold 11px Arial, sans-serif';g.textAlign='right';g.fillText(percent,right,20.5);

  g.fillStyle='rgba(232,222,211,.30)';
  for(let x=left;x<right;x+=2)g.fillRect(x,30.5,1,.8);
  g.textAlign='left';g.font='bold 12px Arial, sans-serif';
  const goldWidth=g.measureText(gold).width,killsWidth=g.measureText(kills).width;
  const textSpace=right-left-49;
  const firstWidth=Math.max(Math.min(goldWidth,textSpace/2),Math.min(textSpace-killsWidth,Math.max(textSpace/2,goldWidth)));
  const goldX=left+19,divider=goldX+firstWidth+5,killsIconX=divider+7,killsX=killsIconX+18;
  g.fillStyle='rgba(209,194,183,.23)';g.fillRect(divider,33,1,14);
  if(coin)g.drawImage(coin,left,33,14,14);
  g.save();g.translate(killsIconX,33);g.scale(14/24,14/24);
  const steel='#E7E0D8';
  shape([[3,2],[7,3],[19,15],[16,18],[4,6]],steel);
  shape([[21,2],[20,7],[15,12],[12,9],[17,4]],steel);
  shape([[5,13],[11,19],[9,21],[7,19],[4,22],[2,20],[5,17],[3,15]],steel);
  shape([[18,13],[21,15],[19,17],[22,20],[20,22],[17,19],[15,21],[13,19]],steel);
  g.restore();
  g.fillStyle=white;g.fillText(gold,goldX,44.3,firstWidth);g.fillText(kills,killsX,44.3,right-killsX);

  g.save();g.translate(25.5,26);g.rotate(-4*Math.PI/180);g.translate(-23.5,-24);
  g.fillStyle='#42323B';g.fillRect(1,2,47,48);
  g.fillStyle='#F3E9D0';g.fillRect(0,0,47,48);
  shape([[0,44],[35,35],[47,38],[47,48],[0,48]],yellow);
  g.strokeStyle='rgba(98,85,75,.53)';g.lineWidth=1;g.setLineDash([3,2]);g.strokeRect(4.5,4.5,38,39);g.setLineDash([]);
  g.drawImage(appearanceGlyphCanvas(word,tone,look),4.5,5,38,38);
  g.fillStyle='#342C36';g.fillRect(39,0,8,8);shape([[39,0],[47,8],[39,8]],'#ACA490');
  g.restore();
  canvas.dataset.word=word;canvas.dataset.look=look||'normal';
}

export function drawStageCaption(canvas,stage,detail){
  const g=canvas.getContext('2d');
  g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,184,26);
  g.lineJoin='round';g.textBaseline='middle';g.textAlign='left';
  const titleFont='bold 13px sans-serif',detailFont='11px sans-serif';
  g.font=titleFont;const titleWidth=g.measureText(stage).width;
  g.font=detailFont;const inline=titleWidth+6+g.measureText(detail).width<=178;
  const lines=[[stage,0,inline?13:7,titleFont],[detail,inline?titleWidth+6:0,inline?13:20,detailFont]];
  for(const [text,x,y,font] of lines){
    g.font=font;g.lineWidth=2;g.strokeStyle='#322A36';g.strokeText(text,x+1,y);
    g.fillStyle='#FFF8E7';g.fillText(text,x+1,y);
  }
}

// Give the native ready glow a standalone image, not the shared icon atlas.
const sealFaces=new WeakMap();
function sealFace(source){
  if(sealFaces.has(source))return sealFaces.get(source);
  const tile=document.createElement('canvas');tile.width=source.width;tile.height=source.height;
  tile.getContext('2d').drawImage(source,0,0);
  sealFaces.set(source,tile);return tile;
}
// Reuse the desaturated attribute icon during the cast and while it charges.
const mutedSeals=new WeakMap();
function mutedSeal(source){
  if(mutedSeals.has(source))return mutedSeals.get(source);
  const tile=document.createElement('canvas');tile.width=source.width;tile.height=source.height;
  const ctx=tile.getContext('2d');ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,tile.width,tile.height),data=pixels.data;
  for(let i=0;i<data.length;i+=4){
    const value=Math.round(53+.59*(.299*data[i]+.587*data[i+1]+.114*data[i+2]));
    data[i]=value;data[i+1]=value;data[i+2]=value;
  }
  ctx.putImageData(pixels,0,0);mutedSeals.set(source,tile);return tile;
}
export function drawUltimateSeal(canvas,source,progress,state,palette,diamondFrame=0){
  const image=source?sealFace(source):null;
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/84,0,0,canvas.height/84,0,0);ctx.clearRect(0,0,84,84);
  canvas.readyFace=image;
  canvas.readyFaceSize=84;
  if(!image)return;
  ctx.drawImage(state==='ready'?image:mutedSeal(image),0,0,84,84);
  if(state==='ready'&&palette){
    drawReadyDiamonds(ctx,palette,diamondFrame);
    ctx.fillStyle=palette.label;ctx.fillRect(22,58,40,15);
    ctx.fillStyle='#27232F';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 12px "Ziling Swei", sans-serif';ctx.fillText('释放',42,66);
  }
  // Keep the original outer charge ring; the entire icon stays muted until ready.
  if(state!=='ready'&&progress>0){
    ctx.beginPath();ctx.arc(42,42,40.3,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);
    ctx.strokeStyle=state==='active'?'#EEC659':'#CFC4B4';ctx.lineWidth=3.4;ctx.lineCap='round';ctx.stroke();
  }
}

// Both counters draw on a 2x canvas with one font and optical baseline.
function drawClockLabel(g,label,x,pulse=1,urgent=false){
  g.save();g.translate(x,15);g.scale(pulse,pulse);
  g.font='bold '+(label.length>5?16:20)+'px sans-serif';
  g.textBaseline='middle';g.textAlign='center';g.fillStyle=urgent?'#FF7872':'#FFF8E9';
  g.fillText(label,0,0);g.restore();
}
export function drawWeatherTime(canvas,label){
  const g=canvas.getContext('2d'),width=canvas.width/2;
  g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,width,29);
  drawClockLabel(g,label,width/2);
}
export function drawHudClock(canvas,label,urgent,phase){
  const g=canvas.getContext('2d');g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,92,29);
  g.fillStyle='rgba(32,28,37,.92)';g.beginPath();g.moveTo(3,0);g.lineTo(92,0);g.lineTo(89,29);g.lineTo(0,29);g.lineTo(0,3);g.closePath();g.fill();
  g.fillStyle='#EEC659';g.beginPath();g.moveTo(3,0);g.lineTo(27,0);g.lineTo(23,29);g.lineTo(0,29);g.lineTo(0,3);g.closePath();g.fill();
  g.strokeStyle='#302934';g.lineWidth=1.8;g.beginPath();g.arc(12,16,7,0,2*Math.PI);g.moveTo(12,16);g.lineTo(15,11);g.moveTo(12,9);g.lineTo(12,5);g.moveTo(9,5);g.lineTo(15,5);g.stroke();
  const pulse=1+.12*Math.max(0,1-Math.abs(phase-3)/3);
  drawClockLabel(g,label,57,pulse,urgent);
}
