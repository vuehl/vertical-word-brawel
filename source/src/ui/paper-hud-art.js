import {appearanceGlyphCanvas} from './collection-art.js';
import {facilityNames} from '../data/active-content.js';
import {glyphCanvas} from '../actors/paper-glyph-art.js';

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
function drawBossDistances(ctx,labels,fontSize,obstacles=[],player={x:60,y:58}){
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
        if(Math.abs(y-player.y)<fontSize/2+5&&Math.abs(x-player.x)<half+5)continue;
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
  ctx.lineJoin='round';ctx.lineWidth=1.2;ctx.strokeStyle='#fff9e9';ctx.stroke();
  ctx.fillStyle='#f3b540';ctx.fill();ctx.restore();
}

// Only neighbouring places of the same type share an icon. Keep every real
// location as a dot, and anchor each group at its nearest member, not a new point.
export function layoutBuildingIcons(markers,size,player={x:60,y:58},labelSize=0,square=false){
  const box=group=>{
    const w=Math.max(size,group.labelWidth||0),h=size+(labelSize?labelSize+1.5:0);
    const limit=(square?47:Math.sqrt(47**2-(w/2)**2))-h/2;
    let y=Math.max(58-limit,Math.min(58+limit,group.y));
    const fitX=()=>{
      const half=(square?47:Math.sqrt(Math.max(0,47**2-(Math.abs(y-58)+h/2)**2)))-w/2;
      return Math.max(60-half,Math.min(60+half,group.x));
    };
    let x=fitX();
    if(Math.abs(x-player.x)<w/2+6&&Math.abs(y-player.y)<h/2+7){
      y=Math.max(58-limit,Math.min(58+limit,player.y+(y<player.y?-1:1)*(h/2+8)));x=fitX();
    }
    return {...group,box:{x:x-w/2,y:y-h/2,w,h}};
  };
  const groups=markers.map(marker=>box({...marker,count:1})).sort((a,b)=>
    Math.hypot(a.x-60,a.y-58)-Math.hypot(b.x-60,b.y-58)||a.x-b.x||a.y-b.y);
  for(let changed=true;changed;){
    changed=false;
    outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const a=groups[i],b=groups[j],u=a.box,v=b.box;
      if(a.kind!==b.kind||u.x>v.x+v.w+2||v.x>u.x+u.w+2||u.y>v.y+v.h+2||v.y>u.y+u.h+2)continue;
      a.count+=b.count;groups.splice(j,1);changed=true;break outer;
    }
  }
  if(labelSize){
    const parts=b=>[{x:b.x+(b.w-size)/2,y:b.y,w:size,h:size},
      {x:b.x,y:b.y+size+1.5,w:b.w,h:labelSize}];
    const overlaps=(a,b)=>a.x<b.x+b.w+.7&&a.x+a.w+.7>b.x&&a.y<b.y+b.h+.7&&a.y+a.h+.7>b.y;
    const candidates=new Map();
    for(const group of groups){
      const {w,h}=group.box;
      const choices=[];
      // Keep different building names apart as well as their icons. The dot
      // and leader line retain the true location when a label needs to move.
      for(let y=12;y+h<=104;y+=2)for(let x=14;x+w<=106;x+=2){
        if(!square&&[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].some(([a,b])=>Math.hypot(a-60,b-58)>47))continue;
        if(square&&x<20&&y<19)continue; // Leave the north arrow clear.
        if(x<player.x+7&&x+w>player.x-7&&y<player.y+8&&y+h>player.y-8)continue;
        const score=(x+w/2-group.x)**2+(y+size/2-group.y)**2;
        choices.push({box:{x,y,w,h},parts:parts({x,y,w,h}),score});
      }
      candidates.set(group,choices.sort((a,b)=>a.score-b.score));
    }
    let order=[...groups].sort((a,b)=>b.box.w-a.box.w||a.y-b.y),best=null;
    // Give a crowded type first choice on a bounded retry instead of leaving
    // its name hidden underneath an earlier icon.
    for(let attempt=0;attempt<4;attempt++){
      const placed=[],boxes=new Map(),blocked=[];
      for(const group of order){
        const fit=candidates.get(group).find(choice=>!placed.some(b=>choice.parts.some(a=>overlaps(a,b))));
        if(!fit)blocked.push(group);
        const next=fit?.box??group.box;boxes.set(group,next);placed.push(...parts(next));
      }
      if(!best||blocked.length<best.blocked)best={boxes,blocked:blocked.length};
      if(!blocked.length)break;
      order=[...blocked,...order.filter(group=>!blocked.includes(group))];
    }
    for(const [group,box] of best.boxes){group.box=box;group.hitBoxes=parts(box);}
  }
  return groups;
}
function drawBuildingIcons(ctx,markers,size,iconFor,player,labelSize=0,square=false){
  if(labelSize){
    ctx.font='bold '+labelSize+'px "Ziling Swei", sans-serif';
    markers=markers.map(marker=>({...marker,labelWidth:ctx.measureText(facilityNames[marker.kind]).width+2}));
  }
  const groups=layoutBuildingIcons(markers,size,player,labelSize,square);
  for(const marker of markers){
    ctx.beginPath();ctx.arc(marker.x,marker.y,1,0,Math.PI*2);ctx.fillStyle='#517589';ctx.fill();
  }
  for(const group of groups){
    const {y,w:boxWidth}=group.box,x=group.box.x+(boxWidth-size)/2,icon=iconFor?.(group.kind);
    if(labelSize&&Math.hypot(x+size/2-group.x,y+size/2-group.y)>size*.6){
      ctx.beginPath();ctx.moveTo(group.x,group.y);ctx.lineTo(x+size/2,y+size/2);
      ctx.strokeStyle='#8fa9b2';ctx.lineWidth=.5;ctx.stroke();
    }
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
    if(group.count>1){
      const r=size*.26,cx=x+size-r,cy=y+size-r;
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#365868';ctx.fill();
      ctx.lineWidth=.45;ctx.strokeStyle='#fffdf5';ctx.stroke();
      ctx.font='bold '+r*1.6+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#fff';ctx.fillText(String(group.count),cx,cy,2*r-.5);
    }
    if(labelSize){
      const name=facilityNames[group.kind],cx=group.box.x+boxWidth/2,cy=y+size+1.5+labelSize/2;
      ctx.font='bold '+labelSize+'px "Ziling Swei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.lineJoin='round';ctx.lineWidth=1.6;ctx.strokeStyle='#fffdf7';ctx.strokeText(name,cx,cy);
      ctx.fillStyle='#385365';ctx.fillText(name,cx,cy);
    }
  }
  return groups;
}

// Square detail view crops the old dial's margins; picking uses the same viewBox.
export const atlasView={left:9.5,top:7.5,size:101};
function atlasEdge(ctx){
  ctx.beginPath();
  ctx.moveTo(11,10.8);ctx.lineTo(41,9.2);ctx.quadraticCurveTo(43,9.1,45,9.2);
  ctx.lineTo(73,10.7);ctx.quadraticCurveTo(75,10.8,77,10.7);
  ctx.lineTo(109,9.1);ctx.lineTo(109,105.2);
  ctx.lineTo(77,106.8);ctx.quadraticCurveTo(75,106.9,73,106.8);
  ctx.lineTo(45,105.3);ctx.quadraticCurveTo(43,105.2,41,105.3);
  ctx.lineTo(11,106.9);ctx.closePath();
}
function finishAtlasPaper(ctx){
  for(const x of [43,75]){
    const crease=ctx.createLinearGradient(x-2,0,x+2.8,0);
    crease.addColorStop(0,'rgba(255,255,255,0)');
    crease.addColorStop(.48,'rgba(255,255,255,.18)');
    crease.addColorStop(.52,'rgba(68,92,113,.08)');
    crease.addColorStop(1,'rgba(68,92,113,0)');
    ctx.fillStyle=crease;ctx.fillRect(x-2,9,4.8,98);
  }
  // Taper only the paper and map ink. All location symbols are painted next.
  const rim=ctx.createLinearGradient(0,9,0,107);
  for(const [stop,alpha] of [[0,.02],[.015,.30],[.035,.77],[.055,1],[.945,1],[.965,.77],[.985,.30],[1,.02]]){
    rim.addColorStop(stop,'rgba(255,255,255,'+alpha+')');
  }
  ctx.globalCompositeOperation='destination-in';
  ctx.fillStyle=rim;ctx.fillRect(0,0,120,120);
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
  if(square){
    const unit=canvas.width/atlasView.size;
    ctx.setTransform(unit,0,0,unit,-unit*atlasView.left,-unit*atlasView.top);
    atlasEdge(ctx);ctx.fillStyle='#E4EAEC';ctx.fill();
  }else{
  if(shadow)dot(60,62,56,hanging?'#445D84':'#527ab2',null);
  dot(60,58,56,hanging?'#7594BC':'#fffdf7',null);dot(60,58,52,hanging?'#F3F1FA':'#c3daeb',null);dot(60,58,49,'#eff5f4',null);
  if(hanging){
    ctx.fillStyle='#536E94';ctx.fillRect(52,0,16,12);
    ctx.fillStyle='#86A4CA';ctx.fillRect(53,0,13,9);
    dot(60,5,2.4,'#E8EEFA',null);
  }
  }
  ctx.save();ctx.beginPath();if(square)atlasEdge(ctx);else ctx.arc(60,58,49,0,Math.PI*2);ctx.clip();
  // Scale map contents around the player within the fixed circular frame.
  ctx.translate(60,58);ctx.scale(1/viewRatio,1/viewRatio);ctx.translate(-60,-58);
  const left=60-radius,right=60+radius,top=58-radius,bottom=58+radius;
  if(atlas?.art){
    const [x,y]=point(-atlas.x,-atlas.z),w=2*atlas.x*scale,h=2*atlas.z*scale;
    ctx.drawImage(atlas.art,x,y,w,h);
  }
  if(square&&atlas){
    // The map and its ruled margin use one world-space grid.
    const step=Math.max(atlas.x,atlas.z)*scale/4;
    ctx.strokeStyle='rgba(84,105,127,.10)';ctx.lineWidth=.16*viewRatio;ctx.beginPath();
    const [originX,originY]=point(0,0);
    for(let col=originX+Math.ceil((left-originX)/step)*step;col<=right;col+=step){
      ctx.moveTo(col,top);ctx.lineTo(col,bottom);
    }
    for(let row=originY+Math.ceil((top-originY)/step)*step;row<=bottom;row+=step){
      ctx.moveTo(left,row);ctx.lineTo(right,row);
    }
    ctx.stroke();
    ctx.save();ctx.translate(60,58);ctx.scale(viewRatio,viewRatio);ctx.translate(-60,-58);
    finishAtlasPaper(ctx);ctx.restore();
  }else if(!atlas?.art){
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
    groups=drawBuildingIcons(ctx,buildings,size,iconFor,playerOnDial,labelSize,square);ctx.restore();
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
  dot(60,58,8.3,'#688dc633',null);dot(60,58,5.7,'#647fbb');
  if(guidance&&guidance.distance>.5)drawFacilityGuide(ctx,guidance);
  else{
    ctx.beginPath();ctx.moveTo(60,53.5);ctx.lineTo(63,60.7);ctx.lineTo(60,59);ctx.lineTo(57,60.7);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  if(distances.length)drawBossDistances(ctx,distances,shadow?8:4.5,groups.map(group=>group.box),playerOnDial);
  if(square){
    ctx.fillStyle='#526D8D';ctx.beginPath();ctx.moveTo(14.5,13.4);ctx.lineTo(16,17.5);ctx.lineTo(14.5,16.7);ctx.lineTo(13,17.5);ctx.closePath();ctx.fill();
    ctx.font='bold 2.8px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('N',16.7,15.8);
    return {count:buildings.length,groups,guidance};
  }
  // A quiet compass notch lives on the rim, outside the clipped map contents.
  ctx.beginPath();ctx.moveTo(60,3);ctx.lineTo(62.5,8);ctx.lineTo(57.5,8);ctx.closePath();ctx.fillStyle='#527ab2';ctx.fill();
  return {count:buildings.filter(marker=>!facilityKind||marker.kind===facilityKind).length,groups,guidance};
}
// Geometry is in logical pixels. One silhouette sits under both rows and the portrait.
export function drawBattleStatus(canvas,{word,tone,look,level,progress,gold,kills},coin){
  const g=canvas.getContext('2d'),w=canvas.width/2,h=52;
  g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,w,h);
  const shape=(pts,fill)=>{
    g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);
    g.closePath();g.fillStyle=fill;g.fill();
  };
  const face=(x,y,size,fill)=>{
    const k=4;shape([[x+k,y],[x+size,y],[x+size,y+size-k],[x+size-k,y+size],[x,y+size],[x,y+k]],fill);
  };
  const text=(s,x,y,size,color,align='left')=>{
    g.font='bold '+size+'px sans-serif';g.textBaseline='middle';g.textAlign=align;
    g.fillStyle=color;g.fillText(s,x,y);
  };
  const shade=g.createLinearGradient(0,0,w,52);
  shade.addColorStop(0,'rgba(17,23,32,.83)');shade.addColorStop(1,'rgba(19,25,34,.67)');
  shape([[24,1],[w,1],[w-9,50],[24,50]],shade);
  g.fillStyle='rgba(216,231,240,.26)';g.fillRect(54,25,w-65,1);
  const ink='#F3F1FA',left=56,percent=Math.floor(progress*100+.00001)+'%';
  text('Lv.'+level,left,13,15,ink);
  const trackX=left+Math.ceil(g.measureText('Lv.'+level).width)+7,trackEnd=w-42;
  if(trackEnd>trackX){
    g.fillStyle='rgba(221,234,243,.27)';g.fillRect(trackX,12,trackEnd-trackX,4);
    g.fillStyle='#AED1E7';g.fillRect(trackX,12,(trackEnd-trackX)*progress,4);
  }
  text(percent,w-9,13,12,'#E0EBF3','right');
  g.font='bold 13px sans-serif';
  const firstEnd=left+19+g.measureText(gold).width+7;
  const lastStart=w-14-23-g.measureText(kills).width;
  const split=Math.min(lastStart,Math.max(firstEnd,Math.round(left+(w-left-12)/2)));
  g.drawImage(coin,left-1,29,17,17);text(gold,left+19,38,13,ink);
  g.fillStyle='rgba(216,231,240,.22)';g.fillRect(split-3,31,1,13);
  for(const angle of [-.76,.76]){
    g.save();g.translate(split+11,37);g.rotate(angle);
    shape([[-1.65,2],[-1.65,-5],[0,-8.5],[1.65,-5],[1.65,2]],'#DBE6F1');
    g.fillStyle='#9EADC1';g.fillRect(.3,-5,1.1,7);
    g.fillStyle='#DEB189';g.fillRect(-3.4,1.7,6.8,1.8);g.fillRect(-.9,3,1.8,4);g.restore();
  }
  text(kills,split+23,38,13,ink);
  face(.5,2,49,'#42556B');face(.5,.5,48.5,'#A0B7CD');face(1.7,1.7,46,'#F3F1FA');face(4,4,41.5,'#D8E6F1');
  shape([[4,36],[17,32],[29,35],[45.5,29],[45.5,40.5],[40.5,45.5],[4,45.5]],'#C1D4E4');
  shape([[4,43],[23,39],[45.5,34],[45.5,40.5],[40.5,45.5],[4,45.5]],'#98B5CC');
  shape([[.5,5],[5,.5],[14,.5],[8,6]],'#C47E8A');
  g.drawImage(appearanceGlyphCanvas(word,tone,look),3.5,2.5,42,44);
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
    g.font=font;g.lineWidth=2;g.strokeStyle='rgba(243,241,250,.84)';g.strokeText(text,x+1,y);
    g.fillStyle='#29394B';g.fillText(text,x+1,y);
  }
}

// Cache the desaturated cutout by its source, so an evolved form or skin has its own seal.
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
export function drawUltimateSeal(canvas,word,tone,look,progress,state,frame,arcFrame,palette){
  const ctx=canvas.getContext('2d'),ready=state==='ready',active=state==='active';
  const wave=(1-Math.cos(frame*Math.PI/9))/2,turn=Math.PI*2,start=-Math.PI/2;
  ctx.setTransform(canvas.width/84,0,0,canvas.height/84,0,0);ctx.clearRect(0,0,84,84);
  const disk=(radius,color)=>{ctx.beginPath();ctx.arc(42,42,radius,0,turn);ctx.fillStyle=color;ctx.fill();};
  const arc=(radius,width,color,from,to)=>{
    ctx.beginPath();ctx.arc(42,42,radius,from,to);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  };
  ctx.lineCap='round';
  disk(40,ready?'#293859':active?'#4C536F':'#606E86');
  disk(37.6,ready?palette.rim:'#D4DAE5');
  disk(34.7,ready?'#314971':active?'#D7DEEB':'#E1E4EB');
  if(ready){
    // A moving glint and breathing cutout are confined to the button's hit area.
    const a=start+turn*arcFrame/18;
    arc(37.7,8.2,palette.outerGlow,a,a+.55);
    arc(37.7,6.2,palette.innerGlow,a,a+.55);
    arc(37.7,3.4,palette.glint,a,a+.55);
    arc(37.7,1.5,palette.core,a,a+.55);
    arc(40.8,1.4,'rgba('+palette.rimChannels+','+(.28+.6*wave)+')',0,turn);
  }else if(progress>0){
    arc(37.1,3.4,active?'#B28394':'#668FC3',start,start+turn*progress);
  }
  const image=appearanceGlyphCanvas(word,tone,look),size=ready?53+2.6*wave:51;
  canvas.readyFace=image;
  canvas.readyFaceSize=size;
  if(ready){
    for(const [x,y,r] of [[16,32,2.7],[67,46,2.2]]){
      const reach=r*(.72+.42*wave);
      ctx.beginPath();ctx.moveTo(x,y-reach*1.6);ctx.lineTo(x+reach*.54,y);
      ctx.lineTo(x,y+reach*1.6);ctx.lineTo(x-reach*.54,y);ctx.closePath();ctx.fillStyle=palette.spark;ctx.fill();
    }
  }
  ctx.drawImage(state==='charging'?mutedSeal(image):image,42-size/2,34.5-size/2,size,size);
  ctx.fillStyle=ready?palette.label:active?'#58667B':'#52647C';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 12px "Ziling Swei", sans-serif';
  ctx.fillText(ready?'释放':active?'释放中':Math.floor(progress*100)+'%',42,62);
}
