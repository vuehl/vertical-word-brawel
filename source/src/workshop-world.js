import {I as Group,H as InstancedMesh,_ as BoxGeometry,E as CylinderGeometry,T as ConeGeometry,ut as SphereGeometry,et as PlaneGeometry,y as BufferGeometry,v as BufferAttribute,b as CanvasTexture,ot as SRGB,w as Color,ht as Vector3,k as DirectionalLight,WorkshopStandardMaterial as StandardMaterial,WorkshopPointLight as PointLight} from '../assets/three-DmSYIDKK.js';
import {preparePaperBatch} from './paper-visibility.js';
import {paperBox} from './paper-collision.js';
import {beveledBoxGeometry,latheGeometry,tubeGeometry,helixTrackGeometry,curtainGeometry} from './handcrafted-geometry.js';
import {workshopPhoto,workshopSurface,stabiliseWorkshopBump,workshopInk,workshopFloorTexture} from './workshop-materials.js';
import {workshopLampHalo} from './workshop-paint-art.js';
import {proximityBulb,updateToyProximity} from './workshop-proximity.js';
import {WORKSHOP_SHADOW} from './workshop-shadows.js';
import {arrangeWorkshopBoundary} from './workshop-boundary.js';
import {drawDeskPaper,drawDeskWall} from './workshop-desk-art.js';
import {buildAlarmClock,ALARM_CLOCK_BOUNDS} from './workshop-alarm-clock.js';
import {createForegroundLights,updateForegroundLights} from './workshop-foreground-lights.js';

const TAU=Math.PI*2;
const sunDirection=new Vector3(-50,85,38).normalize(),sunRight=new Vector3(38,0,50).normalize();
const sunUp=new Vector3().crossVectors(sunDirection,sunRight),shadowCentre=new Vector3();
const palette=['#d26349','#2f9297','#e4b653','#8171ac','#c16a8b','#81a56f'];
function torusGeometry(radius=1,tube=.12,segments=48,sides=8){
  const g=new BufferGeometry(),p=[],n=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
    const a=i/segments*TAU,b=j/sides*TAU,cb=Math.cos(b),sb=Math.sin(b);
    p.push((radius+tube*cb)*Math.cos(a),tube*sb,(radius+tube*cb)*Math.sin(a));
    n.push(cb*Math.cos(a),sb,cb*Math.sin(a));uv.push(i/segments,j/sides);
    if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
  }
  g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('normal',new BufferAttribute(new Float32Array(n),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);return g;
}
function marblePath(points){
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(...points[i].map((v,k)=>v-points[i-1][k])));
  return {points,lengths,length:lengths[lengths.length-1]};
}
function marbleTrack(points,width=1.65){
  const g=new BufferGeometry(),positions=[],uv=[],indices=[],left=[],right=[];
  points.forEach((point,i)=>{
    const previous=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-previous[0],dz=next[2]-previous[2],length=Math.hypot(dx,dz)||1;
    const side=[-dz/length,0,dx/length];
    left.push(point.map((v,k)=>v+side[k]*width*.5+(k===1?.37:0)));right.push(point.map((v,k)=>v-side[k]*width*.5+(k===1?.37:0)));
    for(const [offset,height] of [[-width/2,.12],[width/2,.12],[width/2,-.18],[-width/2,-.18]]){
      positions.push(point[0]+side[0]*offset,point[1]+height,point[2]+side[2]*offset);uv.push(offset/width+.5,i/(points.length-1)*14);
    }
    if(i<points.length-1)for(let j=0;j<4;j++){const k=i*4+j,n=i*4+(j+1)%4;indices.push(k,n,k+4,n,n+4,k+4);}
  });
  g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);g.computeVertexNormals();
  return {track:g,left:tubeGeometry(left,.105,8),right:tubeGeometry(right,.105,8)};
}
function factoryPaths(){
  const switchback=[];
  for(let row=0;row<5;row++){
    const direction=row%2?-1:1,z=-4+row*2;
    for(let i=0;i<=16;i++){const t=i/16;switchback.push([direction*(-5.5+11*t),23-row*4.4-t*2.9,z]);}
    if(row<4)for(let i=1;i<=10;i++){const t=i/10;switchback.push([direction*(5.5+Math.sin(t*Math.PI)),23-row*4.4-2.9-t*1.5,z+1-Math.cos(t*Math.PI)]);}
  }
  const twin=[];
  for(let i=0;i<=100;i++){const t=i/100,a=Math.PI+t*TAU*1.2;twin.push([-6.2+Math.cos(a)*2.3,23-t*8,Math.sin(a)*2.3]);}
  const end=twin[twin.length-1];
  for(let i=1;i<=40;i++){const t=i/40;twin.push([end[0]+(3.9-end[0])*t,15-t*3,end[2]*(1-t)+Math.sin(t*Math.PI)*1.5]);}
  for(let i=1;i<=100;i++){const t=i/100,a=Math.PI+t*TAU*1.4;twin.push([6.2+Math.cos(a)*2.3,12-t*8.5,Math.sin(a)*2.3]);}
  const funnel=[];
  const bowlY=r=>{const steps=[[.75,5.1],[1.3,7.2],[2.5,10.7],[4,13.2],[6.4,15.1]];for(let i=1;i<steps.length;i++)if(r<=steps[i][0]){const a=steps[i-1],b=steps[i],t=(r-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return 15.1;};
  for(let i=0;i<=200;i++){const t=i/200,a=t*TAU*3.6,r=6.35-5.55*t;funnel.push([Math.cos(a)*r,bowlY(r),Math.sin(a)*r]);}
  return {switchback:marblePath(switchback),twin:marblePath(twin),funnel:marblePath(funnel)};
}
export function createWorkshopAssets(){
  const helixPoints=r=>Array.from({length:161},(_,i)=>{const t=i/160,a=t*TAU*2.6;return [Math.cos(a)*r,23-20.5*t+.45,Math.sin(a)*r];});
  const paths=factoryPaths(),switchback=marbleTrack(paths.switchback.points),twin=marbleTrack(paths.twin.points);
  return {boxes:new BoxGeometry(1,1,1),bevels:beveledBoxGeometry(),planes:new PlaneGeometry(1,1),cylinders:new CylinderGeometry(1,1,1,48),
    cones:new ConeGeometry(1,1,32),spheres:new SphereGeometry(1,32,20),rings:torusGeometry(1,.075,72,12),
    spool:latheGeometry([[0,-.5],[.82,-.5],[.98,-.44],[1,-.34],[.94,-.24],[.56,-.16],[.47,-.1],[.47,.1],[.56,.16],[.94,.24],[1,.34],[.98,.44],[.82,.5],[0,.5]]),
    helix:helixTrackGeometry(),railInner:tubeGeometry(helixPoints(3.85),.1),railOuter:tubeGeometry(helixPoints(5.35),.1),
    marblePaths:paths,switchbackTrack:switchback.track,switchbackLeft:switchback.left,switchbackRight:switchback.right,
    twinTrack:twin.track,twinLeft:twin.left,twinRight:twin.right,
    funnel:latheGeometry([[.7,3.8],[1.5,5.9],[2.7,9.7],[4.3,12.5],[6.8,14.5],[7.1,15.2],[6.9,15.55],[6.4,15.1],[4,13.2],[2.5,10.7],[1.3,7.2],[.75,5.1],[.7,3.8]],56),
    road:helixTrackGeometry(8,.12,.12,.55,96,3.8),
    roadInner:tubeGeometry(Array.from({length:97},(_,i)=>{const a=i/96*TAU*.55;return [Math.cos(a)*6.12,.4,Math.sin(a)*6.12];}),.13),
    roadOuter:tubeGeometry(Array.from({length:97},(_,i)=>{const a=i/96*TAU*.55;return [Math.cos(a)*9.88,.4,Math.sin(a)*9.88];}),.13),
    tape:latheGeometry([[.63,-.5],[.98,-.5],[1,-.44],[1,.44],[.98,.5],[.63,.5],[.63,-.5]]),
    shade:latheGeometry([[0,.6],[.15,.6],[.3,.5],[.55,.35],[.86,-.1],[1,-.45],[.94,-.5],[.85,-.45],[.47,.05],[.2,.16],[0,.17]]),
    curtain:curtainGeometry(),
    cup:latheGeometry([[0,-.5],[.92,-.5],[1,-.43],[1,.4],[.97,.5],[.87,.5],[.84,.43],[.84,-.34],[0,-.34]]),
    lampArm:tubeGeometry(Array.from({length:65},(_,i)=>{const t=i/64,u=1-t;return [-3*u*u*t+1.8*u*t*t+4*t*t*t,.6*u*u*u+24*u*u*t+45*u*t*t+14*t*t*t,0];}),.2,12),
    mats:new Map(),textures:new Map(),colors:new Map(),photos:new Map(),photoJobs:[],photoFailures:[]};
}
export function* workshopWorldSteps(terrain){
  const root=terrain.group,stage=terrain.biome.zxStage||1;
  terrain.zxPaper=true;terrain.zxStage=stage;root.name='stationery-wonderland';terrain.hasWater=false;terrain.isLava=false;terrain.frozen=false;
  terrain.minH=terrain.maxH=0;terrain.heights.fill(0);terrain.pathMask.fill(0);
  terrain.spawn.set(terrain.arena?.entry?.x||0,0,terrain.arena?.entry?.z||0);
  terrain.landmarks=[];terrain.zxProps=[];terrain.workshopLamps=[];terrain.workshopGlows=[];terrain.workshopMarbleRuns=[];terrain.workshopMarbleSites=[];
  terrain.workshopLooseMarbles=[];
  terrain.ownsPaperAssets=!terrain.paperAssets;const assets=terrain.paperAssets??=createWorkshopAssets();
  const {boxes,bevels,planes,cylinders,cones,spheres,rings,mats,textures,colors}=assets;
  const batches=new Map(),transform=new Group(),groundSurfaces=[];
  terrain.workshopGroundSurfaces=groundSurfaces;
  terrain.workshopLightStrands=[];terrain.workshopShadowStyle='distance-faded-soft-shadows';
  function groundY(x,z){
    let y=0;
    for(const p of groundSurfaces){const dx=x-p.x,dz=z-p.z;if(Math.abs(p.cos*dx-p.sin*dz)<p.w/2&&Math.abs(p.sin*dx+p.cos*dz)<p.d/2)y=Math.max(y,p.y);}
    return y;
  }
  function groundSurface(x,z,w,d,a,y,kind){groundSurfaces.push({x,z,w,d,a,y,kind,cos:Math.cos(a),sin:Math.sin(a)});terrain.maxH=Math.max(terrain.maxH,y);}
  terrain.workshopGroundY=groundY;
  function color(c){if(!colors.has(c))colors.set(c,new Color(c));return colors.get(c);}
  function mat(key,options){if(!mats.has(key))mats.set(key,stabiliseWorkshopBump(new StandardMaterial(options)));return mats.get(key);}
  const solid=mat('workshop-plastic',{color:0xffffff,roughness:.36,metalness:0});
  const metal=mat('workshop-metal',{color:0xb4c3c4,roughness:.28,metalness:.58});
  const rubber=mat('workshop-rubber',{color:0x13273c,roughness:.9});
  const woodMaterial=workshopSurface(assets,'maple-joinery',{photo:'maple',color:0xffedce,roughness:.49,bump:.018});
  woodMaterial.map.wrapS=woodMaterial.map.wrapT=1000;
  const brass=mat('aged-brass',{color:0xd8b66c,roughness:.32,metalness:.5});
  const cloth=c=>workshopSurface(assets,'bookcloth-'+c,{photo:'linen',color:c,roughness:.91,bump:.045});
  const paperMaterial=workshopSurface(assets,'paper-edges',{photo:'paper',color:0xf1f8ff});
  const redCover=workshopSurface(assets,'gilt-storybook',{photo:'storybook',roughness:.83,bump:.027});
  function texture(key,w,h,draw){
    if(textures.has(key))return textures.get(key);
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);
    const t=new CanvasTexture(canvas);t.colorSpace=SRGB;t.anisotropy=4;textures.set(key,t);return t;
  }
  const texMat=(key,t,roughness=.8)=>mat(key,{color:0xffffff,map:t,roughness,metalness:0});
  function mesh(g,geo,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(rx,ry,rz);transform.updateMatrix();g.updateWorldMatrix(true,false);
    const tint=typeof material==='string'?color(material):null,m=tint?solid:material,key=geo.uuid+'/'+m.uuid;
    let b=batches.get(key);if(!b)batches.set(key,b={geo,material:m,matrices:[],colors:[]});
    b.matrices.push(transform.matrix.clone().premultiply(g.matrixWorld));if(tint)b.colors.push(tint);
  }
  const box=(g,x,y,z,w,h,d,c)=>mesh(g,boxes,c,x,y,z,w,h,d);
  const ball=(g,x,y,z,rx,ry,rz,c)=>mesh(g,spheres,c,x,y,z,rx,ry,rz);
  const cyl=(g,x,y,z,r,h,c,rx=0,rz=0)=>mesh(g,cylinders,c,x,y,z,r,h,r,rx,0,rz);
  const ring=(g,x,y,z,r,c,rx=0,rz=0)=>mesh(g,rings,c,x,y,z,r,r,r,rx,0,rz);
  const plane=(g,x,y,z,w,d,m,angle=0)=>mesh(g,planes,m,x,y,z,w,d,1,-Math.PI/2,0,angle);
  function roundedBox(g,x,y,z,w,h,d,c,r=.22){
    mesh(g,bevels,c,x,y,z,w,h,d);
  }
  function group(x,z,angle=0){const g=new Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);return g;}
  function prop(kind,x,z,w,d,h,angle=0){
    const g=group(x,z,angle),baseY=groundY(x,z);g.position.y=baseY;terrain.zxProps.push({kind,x,z,w,d,h,angle,baseY});
    terrain.addCollider(paperBox(x,z,w,d,baseY+h+.2,angle));terrain.reserve(x,z,Math.hypot(w,d)/2+1);
    terrain.landmarks.push({kind:'meadow',x,z,r:Math.hypot(w,d)/2});return g;
  }
  function glow(c,reactive=false){const key=(reactive?'sensor-glow-':'glow-')+c,m=mat(key,{color:c,emissive:c,emissiveIntensity:reactive?3.4:.12});if(reactive&&!m.userData.proximity)proximityBulb(m,assets);if(!terrain.workshopGlows.includes(m))terrain.workshopGlows.push(m);return m;}
  function lamp(g,x,y,z,c='#ffdaac',radius=.3,power=42,reactive=false){
    ball(g,x,y,z,radius,radius*1.25,radius,glow(c,reactive));
    const world=new Vector3(x,y,z);g.localToWorld(world);terrain.workshopLamps.push({x:world.x,y:world.y,z:world.z,color:c,power,reactive,radius});
  }
  function cable(g,points,c='#263346',radius=.055){
    for(let i=1;i<points.length;i++){
      const a=new Vector3(...points[i-1]),b=new Vector3(...points[i]),mid=a.clone().add(b).multiplyScalar(.5),delta=b.sub(a);
      transform.position.copy(mid);transform.scale.set(radius,delta.length()+radius*2,radius);transform.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.normalize());transform.updateMatrix();g.updateWorldMatrix(true,false);
      const m=typeof c==='string'?solid:c,tint=typeof c==='string'?color(c):null,key=cylinders.uuid+'/'+m.uuid;
      let batch=batches.get(key);if(!batch)batches.set(key,batch={geo:cylinders,material:m,matrices:[],colors:[]});batch.matrices.push(transform.matrix.clone().premultiply(g.matrixWorld));if(tint)batch.colors.push(tint);
    }
  }
  function fairyString(g,x1,z1,x2,z2,y,count=14){
    const points=[];for(let i=0;i<=count;i++){const t=i/count,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t,yy=y-Math.sin(t*Math.PI)*1.4;points.push([x,yy,z]);
      if(i&&i<count){cyl(g,x,yy-.16,z,.075,.24,'#554a3e');lamp(g,x,yy-.38,z,['#73dbe7','#f4a5c0','#b6a7ee','#a4dfbf','#ffe0a0'][i%5],.16,42,true);}}
    cable(g,points);
    terrain.workshopLightStrands.push({attachment:'fixture',points:points.map(p=>{const v=new Vector3(...p);g.localToWorld(v);return v.toArray();}),segmentCount:count});
  }
  const wood=workshopFloorTexture(assets);wood.repeat.set(terrain.world/62,terrain.world/48);
  const floorMat=mat('maple-desktop',{map:wood,color:0xffffff,roughness:1});
  plane(root,0,0,0,terrain.world+20,terrain.world+20,floorMat);
  box(root,0,-1.4,0,terrain.world+20,2.5,terrain.world+20,woodMaterial);
  // The continuous desktop uses seamless painted grain. Raised seam strips
  // produced dark, jagged lines across the playfield and cast tiny shadows.
  const deskMat=workshopSurface(assets,'teal-desk-pad',{photo:'linen',color:0x779b96,roughness:.64,bump:.008});
  function island(x,z,w,d,a=0){
    const g=group(x,z,a);roundedBox(g,0,.035,0,w,.07,d,cloth('#567d79'));
    roundedBox(g,0,.067,0,w-.65,.025,d-.65,deskMat);
    // A broad stitched rim reads as a desk mat, without a busy cutting grid.
    const rim=texture('desk-pad-stitches',512,512,c=>{c.clearRect(0,0,512,512);c.strokeStyle='#c0d3b25c';c.lineWidth=2;c.setLineDash([6,8]);c.strokeRect(18,18,476,476);});
    plane(g,0,.088,0,w-.9,d-.9,mat('desk-pad-stitches',{map:rim,transparent:true,depthWrite:false}));
    groundSurface(x,z,w,d,a,.09,'cloth');return g;
  }
  function notebook(x,z,w=25,d=28,a=0,height=.3){
    const g=group(x,z,a),base=groundY(x,z);g.position.y=base;
    roundedBox(g,0,.045,0,w+.7,.09,d+.7,cloth('#6a8494'),.4);
    const drawPaper=(c,width=1024,height=1024)=>{
      c.save();c.scale(width/512,height/512);c.fillStyle='#dcefff';c.fillRect(0,0,512,512);
      const photo=assets.photos.get('paper')?.texture.image;if(photo?.width>32)c.drawImage(photo,0,0,512,512);
      c.strokeStyle='#7ea6c25c';c.lineWidth=.7;
      for(let y=35;y<512;y+=27){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
      c.strokeStyle='#82a9c9';c.lineWidth=2;c.beginPath();c.moveTo(54,0);c.lineTo(54,512);c.stroke();
      
      // Child-made corner stickers and crayon sketches leave the battle centre clear.
      c.save();c.translate(427,84);c.rotate(.12);c.fillStyle='#ef9e4c';c.fillRect(-42,-26,84,52);c.restore();
      for(let j=0;j<4;j++){c.strokeStyle=['#df795b','#dcb656','#68a9a0','#658caf'][j];c.lineWidth=5;c.beginPath();c.arc(100,470,47-j*7,Math.PI,TAU);c.stroke();}
      for(const [x,y] of [[440,400],[472,443],[424,470]]){c.fillStyle='#d8a24b';c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?5:12;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();}
      c.restore();
    };
    const pageTex=texture('warm-notebook-page',1024,1024,drawPaper);
    if(!pageTex.userData.paperPhoto){pageTex.userData.paperPhoto=true;assets.photoJobs.push(workshopPhoto(assets,'paper').ready.then(()=>{if(!assets.disposed){drawPaper(pageTex.image.getContext('2d'));pageTex.needsUpdate=true;}}));}
    roundedBox(g,0,(height+.08)/2,0,w,height-.08,d,paperMaterial);plane(g,0,height+.012,0,w-.25,d-.25,texMat('notebook-paper',pageTex,.94));
    groundSurface(x,z,w+.7,d+.7,a,base+height+.012,'notebook');
    for(let i=0;i<11;i++){ring(g,-w/2+.2,height+.04,-d/2+2+i*(d-4)/10,.48,brass,0,Math.PI/2);}
    // A narrow fabric bookmark lies over one corner, away from the open page.
    box(g,w*.32,height+.03,d*.43,.5,.035,3.6,cloth('#b88d64'));
  }
  function paperPile(x,z,w,d,a=0,height=.24,variant='sketch'){
    const page=texture('desk-paper-'+variant,768,1024,(c,w,h)=>drawDeskPaper(c,w,h,variant));
    for(let i=0;i<3;i++){
      const xx=x+(i-1)*.7,zz=z+(1-i)*.45,angle=a+[-.055,.035,0][i],g=group(xx,zz,angle),top=height*(i+1)/3;
      roundedBox(g,0,top-height/6,0,w,height/3,d,paperMaterial);
      plane(g,0,top+.012,0,w-.12,d-.12,texMat('desk-paper-'+variant,page));
      groundSurface(xx,zz,w,d,angle,top+.012,'loose-paper');
      if(i===2){
        plane(g,-w*.36,top+.025,-d*.44,3.1,1.25,cloth('#c8ad7b'),-.12);
        plane(g,w*.38,top+.025,d*.44,2.8,1.1,cloth('#c8ad7b'),.18);
      }
    }
  }
  function sketchbook(x,z,w,d,a=0,height=.4){
    const g=group(x,z,a),cover=cloth('#9a7759');
    roundedBox(g,0,.04,0,w+.55,.08,d+.55,cover);
    roundedBox(g,0,height/2,0,w,height-.12,d,paperMaterial);
    roundedBox(g,0,height-.035,0,w+.55,.07,d+.55,cover);
    const label=texture('sketchbook-cover',512,512,c=>{
      c.clearRect(0,0,512,512);c.strokeStyle='#eadbb7';c.lineWidth=3;c.strokeRect(80,132,352,240);
      c.beginPath();c.moveTo(160,307);c.lineTo(241,201);c.lineTo(292,268);c.lineTo(328,237);c.lineTo(372,307);c.stroke();
      c.beginPath();c.arc(335,194,18,0,TAU);c.stroke();
    });
    plane(g,0,height+.015,0,w*.75,d*.65,mat('sketchbook-cover',{map:label,transparent:true,depthWrite:false}));
    box(g,w*.32,height+.016,0,.55,.03,d+.6,cloth('#667b70'));
    groundSurface(x,z,w+.55,d+.55,a,height+.032,'sketchbook');
  }
  function pencil(x,z,a,c='#eeaf3b',s=1){
    const g=prop('colored-pencil',x,z,1.1*s,12*s,1.1*s,a);
    mesh(g,cylinders,c,0,.55,0,.48*s,9*s,.48*s,Math.PI/2);mesh(g,cones,'#e9bc7d',0,.55,-5.3*s,.48*s,1.6*s,.48*s,-Math.PI/2);
    mesh(g,cones,'#263544',0,.55,-6.15*s,.15*s,.4*s,.15*s,-Math.PI/2);roundedBox(g,0,.55,5*s,.9*s,.9*s,1.2*s,'#f58a97',.18);cyl(g,0,.55,4.25*s,.51*s,.5*s,metal,Math.PI/2);
  }
  function bookStack(x,z,s=1,a=0){
    const g=prop('giant-storybook-stack',x,z,17*s,23*s,13.2*s,a);
    for(let i=0;i<4;i++){
      const b=new Group();b.position.set([-.4,.55,-.2,.3][i]*s,i*3.12*s,[.2,-.45,.4,-.2][i]*s);b.rotation.y=[-.07,.075,-.1,.025][i];g.add(b);
      const c=['#2e737a','#ae5545','#caa153','#625778'][i],cover=cloth(c);
      roundedBox(b,0,.22*s,0,14.8*s,.44*s,20.2*s,cover);
      roundedBox(b,.2*s,1.65*s,.05*s,14.15*s,2.5*s,19.5*s,paperMaterial);
      // Page signatures live in the paper material. Thin stacked geometry
      // aliases against its own shadow at the phone camera distance.
      roundedBox(b,0,3.03*s,0,14.8*s,.43*s,20.2*s,cover);
      if(i===1||i===3)plane(b,0,3.252*s,0,14.2*s,19.6*s,redCover);
      roundedBox(b,-7.28*s,1.64*s,0,.68*s,3.15*s,20.2*s,cover);
      for(const zBand of [-8,-6.7,6.7,8]){
        roundedBox(b,-7.65*s,1.65*s,zBand*s,.12*s,2.6*s,.12*s,brass);
        box(b,0,3.26*s,zBand*s,13.7*s,.025*s,.04*s,brass);
      }
      // A cloth bookmark hangs loosely over the front page block.
      box(b,3.8*s,2.95*s,9.4*s,1.05*s,.08*s,4.5*s,cloth(i%2?'#7b9278':'#b06b56'));
    }
  }
  function eraser(x,z,a=0){const g=prop('eraser',x,z,2.4,3.6,.96,a);g.scale.setScalar(.6);roundedBox(g,0,.8,0,4,1.6,6,'#edb8a6',.6);roundedBox(g,0,.82,-.4,4.1,1.65,2.8,'#157e91',.3);}
  function yoYo(x,z,s=1,angle=-.38){
    const g=prop('yo-yo',x,z,6*s,6*s,3.9*s,angle);
    mesh(g,assets.spool,cloth('#b15d47'),0,1.95*s,0,3*s,3.9*s,3*s);
    cyl(g,0,3.9*s,0,2.15*s,.06*s,woodMaterial);ring(g,0,3.94*s,0,2.18*s,brass);
    cyl(g,0,3.96*s,0,.55*s,.1*s,brass);
    const points=Array.from({length:65},(_,i)=>{const t=i/64;return [(3+7*t)*s,.13,(Math.sin(t*TAU)*2.2+1.8+t*4)*s];});
    points.unshift([0,1.95*s,0]);cable(g,points,'#d5c4a0',.035*s);
  }
  function marbleFactory(x,z,s=1,a=.21+(stage-1)*.13){
    const g=prop('marble-factory',x,z,13*s,13*s,26*s,a);
    terrain.workshopMarbleRuns.push({kind:'helix',x,z,s,angle:a,radius:4.6,top:23,bottom:2.5,turns:2.6,baseY:g.position.y});
    terrain.workshopMarbleSites.push({kind:'marble-factory',x,z,w:13*s,d:13*s,h:26*s,angle:a});
    roundedBox(g,0,.52*s,0,13*s,1.04*s,13*s,woodMaterial);
    roundedBox(g,0,1.12*s,0,11.8*s,.2*s,11.8*s,cloth('#5d776e'));
    for(const xx of [-1,1])for(const zz of [-1,1]){
      roundedBox(g,xx*5.7*s,12*s,zz*5.7*s,.72*s,23*s,.72*s,woodMaterial);
      cyl(g,xx*5.7*s,1.5*s,zz*5.7*s,.53*s,.5*s,brass);
      ball(g,xx*5.7*s,24*s,zz*5.7*s,.53*s,.53*s,.53*s,woodMaterial);
    }
    mesh(g,assets.helix,woodMaterial,0,0,0,s,s,s);
    mesh(g,assets.railInner,brass,0,0,0,s,s,s);mesh(g,assets.railOuter,brass,0,0,0,s,s,s);
    cyl(g,0,12*s,0,.35*s,23*s,brass);
    for(let level=0;level<4;level++){
      const y=(3+level*6.3)*s;
      cyl(g,0,y,0,1.1*s,.35*s,woodMaterial);
      roundedBox(g,0,y,0,10.2*s,.26*s,.45*s,woodMaterial);
    }
    mesh(g,assets.spool,woodMaterial,0,1.8*s,0,2.4*s,1.6*s,2.4*s);
    for(let i=0;i<16;i++){const a=i/16*TAU;mesh(g,bevels,brass,Math.cos(a)*2.6*s,1.8*s,Math.sin(a)*2.6*s,.6*s,.6*s,.6*s,0,-a);}
    // A milky lamp and warm festoons accent the joinery, without neon rails.
    lamp(g,0,25*s,0,'#ffe2b0',.45*s);fairyString(g,-5.7*s,5.8*s,5.7*s,5.8*s,24*s,9);
  }
  const factorySize={switchback:[16,13,26],funnel:[16,16,19],twin:[24,12,26]};
  function marbleMachine(kind,x,z,s=1,a=0){
    const [w,d,h]=factorySize[kind],name='marble-'+kind,g=prop(name,x,z,w*s,d*s,h*s,a);
    terrain.workshopMarbleSites.push({kind:name,x,z,w:w*s,d:d*s,h:h*s,angle:a});
    terrain.workshopMarbleRuns.push({kind,x,z,s,angle:a,path:assets.marblePaths[kind],speed:kind==='switchback'?.065:.085,baseY:g.position.y});
    roundedBox(g,0,.52*s,0,w*s,1.04*s,d*s,woodMaterial);
    roundedBox(g,0,1.1*s,0,(w-1)*s,.16*s,(d-1)*s,cloth('#397d7b'));
    const teal=mat('marble-enamel',{color:0x3c9b94,roughness:.4,metalness:.04});
    if(kind==='switchback'){
      for(const xx of [-1,1])for(const zz of [-1,1]){
        roundedBox(g,xx*7.1*s,12.5*s,zz*5.3*s,.72*s,24*s,.72*s,woodMaterial);
        cyl(g,xx*7.1*s,1.45*s,zz*5.3*s,.5*s,.4*s,brass);
        ball(g,xx*7.1*s,24.8*s,zz*5.3*s,.47*s,.47*s,.47*s,teal);
      }
      for(const zz of [-5.3,5.3])roundedBox(g,0,24.2*s,zz*s,14.8*s,.7*s,.7*s,teal);
      mesh(g,assets.switchbackTrack,woodMaterial,0,0,0,s,s,s);mesh(g,assets.switchbackLeft,brass,0,0,0,s,s,s);mesh(g,assets.switchbackRight,brass,0,0,0,s,s,s);
      ring(g,-5.5*s,23.35*s,-4*s,.9*s,teal,0,Math.PI/2);
      mesh(g,assets.spool,teal,5.5*s,1.7*s,4*s,1.8*s,1.1*s,1.8*s);
      lamp(g,7.1*s,25.1*s,-5.3*s,'#ffe0a2',.3*s,44);
    }else if(kind==='funnel'){
      for(const xx of [-1,1])for(const zz of [-1,1]){
        roundedBox(g,xx*5.4*s,7.6*s,zz*5.4*s,.72*s,13*s,.72*s,woodMaterial);
        cyl(g,xx*5.4*s,1.45*s,zz*5.4*s,.52*s,.4*s,brass);
      }
      mesh(g,assets.funnel,teal,0,0,0,s,s,s);ring(g,0,15.4*s,0,6.94*s,brass);
      ring(g,0,14.2*s,0,6.8*s,woodMaterial);mesh(g,assets.spool,woodMaterial,0,2.1*s,0,2.4*s,1.8*s,2.4*s);
      mesh(g,assets.tape,brass,0,3.1*s,0,.8*s,3.7*s,.8*s);
      for(let j=0;j<8;j++){const angle=j/8*TAU;ball(g,Math.cos(angle)*7*s,15.5*s,Math.sin(angle)*7*s,.18*s,.18*s,.18*s,woodMaterial);}
      lamp(g,-5.4*s,16.5*s,-5.4*s,'#ffdeb0',.32*s,42);
    }else{
      for(const [center,top] of [[-6.2,24.2],[6.2,15.7]]){
        for(const xx of [-1,1])for(const zz of [-1,1]){
          roundedBox(g,(center+xx*3.2)*s,top*.5*s,zz*3.6*s,.65*s,top*s,.65*s,woodMaterial);
          cyl(g,(center+xx*3.2)*s,1.45*s,zz*3.6*s,.48*s,.4*s,brass);
        }
        for(const zz of [-3.6,3.6])roundedBox(g,center*s,top*s,zz*s,7.1*s,.65*s,.7*s,teal);
        ring(g,center*s,(top-.6)*s,0,3.2*s,brass);
      }
      mesh(g,assets.twinTrack,woodMaterial,0,0,0,s,s,s);mesh(g,assets.twinLeft,brass,0,0,0,s,s,s);mesh(g,assets.twinRight,brass,0,0,0,s,s,s);
      roundedBox(g,-1.5*s,7*s,.4*s,.8*s,12.6*s,.8*s,teal);
      mesh(g,assets.spool,teal,7.9*s,2*s,-1.3*s,1.8*s,1.2*s,1.8*s);
      lamp(g,-9.4*s,24.8*s,-3.6*s,'#ffe0ac',.3*s,46);lamp(g,9.4*s,16.4*s,-3.6*s,'#ffe0ac',.3*s,38);
    }
  }
  function overlapsProp(a,b,padding=0){
    const ac=Math.cos(a.angle||0),as=Math.sin(a.angle||0),bc=Math.cos(b.angle||0),bs=Math.sin(b.angle||0),axes=[[ac,-as],[as,ac],[bc,-bs],[bs,bc]],dx=b.x-a.x,dz=b.z-a.z;
    return axes.every(([x,z])=>Math.abs(dx*x+dz*z)<(a.w/2+padding)*Math.abs(x*ac-z*as)+(a.d/2+padding)*Math.abs(x*as+z*ac)+(b.w/2+padding)*Math.abs(x*bc-z*bs)+(b.d/2+padding)*Math.abs(x*bs+z*bc));
  }
  function placeMarble(kind,x,z,s=1,a=0,search=15){
    if(kind==='twin')s*=1.2;
    const dimensions=kind==='helix'?[13,13,26]:factorySize[kind],candidate={x,z,w:dimensions[0]*s,d:dimensions[1]*s,angle:a};
    const notebookField={x:-2,z:7,w:30,d:37,angle:.115};
    for(let radius=0;radius<=search;radius+=3)for(let i=0;i<(radius?24:1);i++){
      const angle=i/24*TAU;candidate.x=x+Math.cos(angle)*radius;candidate.z=z+Math.sin(angle)*radius;
      if(Math.abs(candidate.x)+candidate.w*.75>terrain.play-14||Math.abs(candidate.z)+candidate.d*.75>terrain.play-14||overlapsProp(candidate,notebookField,2)||terrain.zxProps.some(p=>overlapsProp(candidate,p,1.8)))continue;
      if(kind==='helix')marbleFactory(candidate.x,candidate.z,s,a);else marbleMachine(kind,candidate.x,candidate.z,s,a);
      return true;
    }
    return false;
  }
  function raceCar(g,x,z,s=1){
    const car=new Group();car.position.set(x,0,z);car.rotation.y=-.2;g.add(car);
    const enamel=mat('racer-enamel',{color:0xb64e39,roughness:.45,metalness:.07}),blue=mat('racer-blue',{color:0x315c70,roughness:.48,metalness:.06});
    roundedBox(car,0,.8*s,0,3.1*s,.7*s,5.3*s,enamel,.4);roundedBox(car,0,1.5*s,.2*s,2.1*s,.9*s,2.1*s,blue,.4);
    roundedBox(car,0,1.85*s,-.2*s,1.8*s,.35*s,1.3*s,mat('windscreen',{color:0x273b47,roughness:.2,metalness:.12}));
    roundedBox(car,0,1*s,-2.55*s,3.8*s,.25*s,.5*s,blue);roundedBox(car,0,1.5*s,2.4*s,3.7*s,.22*s,.65*s,blue);
    roundedBox(car,0,1.18*s,-1.6*s,.32*s,.04*s,1.4*s,'#e8d5ad');
    cyl(car,0,.64*s,0,.13*s,3.6*s,brass,0,Math.PI/2);
    for(const xx of [-1,1])for(const zz of [-1,1]){
      cyl(car,xx*1.65*s,.72*s,zz*1.65*s,.72*s,.55*s,rubber,0,Math.PI/2);cyl(car,xx*1.96*s,.72*s,zz*1.65*s,.42*s,.06*s,brass,0,Math.PI/2);
      ring(car,xx*2*s,.72*s,zz*1.65*s,.31*s,metal,0,Math.PI/2);
      for(let i=0;i<18;i++){const a=i/18*TAU;mesh(car,bevels,rubber,xx*1.65*s,(.72+Math.cos(a)*.71)*s,(zz*1.65+Math.sin(a)*.71)*s,.58*s,.05*s,.12*s,a);}
      cyl(car,xx*1.75*s,1.1*s,zz*2.45*s,.18*s,.18*s,brass);
    }
    for(const xx of [-1,1])lamp(car,xx*1.12*s,1.02*s,-2.65*s,'#ffe4b4',.14*s,3.5);
  }
  function racePark(x,z,s=1,angle=-.52){
    const g=group(x,z,angle);g.position.y=groundY(x,z)+.12;
    mesh(g,assets.road,mat('race-track',{color:0x476f91,roughness:.65}),0,0,0,s,s,s);
    mesh(g,assets.roadInner,cloth('#d4bc8d'),0,0,0,s,s,s);mesh(g,assets.roadOuter,cloth('#c0a371'),0,0,0,s,s,s);
    raceCar(g,-7*s,4*s,s);
    // Only the car is solid; the track itself remains part of the playfield.
    const carPoint=new Vector3(-7*s,0,4*s);g.localToWorld(carPoint);terrain.zxProps.push({kind:'mini-4wd',x:carPoint.x,z:carPoint.z,w:4.2*s,d:6.2*s,h:2.1*s,angle:angle-.2,baseY:g.position.y});terrain.addCollider(paperBox(carPoint.x,carPoint.z,4.2*s,6.2*s,g.position.y+2.2*s,angle-.2));terrain.reserve(carPoint.x,carPoint.z,4*s);
  }
  function pencilCup(x,z,s=1,angle=.16){
    const g=prop('pencil-cup',x,z,5.6*s,5.6*s,11.5*s,angle);
    mesh(g,assets.cup,cloth('#ae6551'),0,2.5*s,0,2.4*s,5*s,2.4*s);ring(g,0,5*s,0,2.3*s,brass);
    for(let i=0;i<22;i++){const a=i/22*TAU;ball(g,Math.cos(a)*2.42*s,.4*s,Math.sin(a)*2.42*s,.04*s,.05*s,.04*s,'#d9bd8f');}
    for(let i=0;i<6;i++){const a=i*2.4,xx=Math.cos(a)*1.3*s,zz=Math.sin(a)*1.3*s;cyl(g,xx,7*s,zz,.22*s,7*s,palette[i]);mesh(g,cones,'#edc88c',xx,10.9*s,zz,.23*s,.8*s,.23*s);}
  }
  function handheld(x,z,s=1,angle=-.12){
    const g=prop('brick-game',x,z,3.5*s,6.3*s,1.1*s,angle);
    roundedBox(g,0,.55*s,0,3.5*s,1.1*s,6.3*s,'#e7bb62',.4*s);
    const screen=texture('brick-game-lcd',256,384,c=>{
      c.fillStyle='#84985a';c.fillRect(0,0,256,384);c.strokeStyle='#4b633f';c.lineWidth=2;
      for(let y=15;y<370;y+=24)for(let x=15;x<240;x+=24)c.strokeRect(x,y,18,18);
      c.fillStyle='#304937';for(const [x,y] of [[3,12],[4,12],[5,12],[5,11],[7,12],[7,11],[7,10],[8,10],[2,10],[3,10],[3,9],[4,9]])c.fillRect(15+x*24,15+y*24,18,18);
      
    });
    roundedBox(g,0,1.13*s,-1.1*s,2.8*s,.18,3.1*s,'#285563',.2);
    plane(g,0,1.24*s,-1.1*s,2.35*s,2.55*s,texMat('brick-game-screen',screen,.55));
    roundedBox(g,-.75*s,1.2*s,1.65*s,.45*s,.3,1.5*s,'#284150',.1);roundedBox(g,-.75*s,1.2*s,1.65*s,1.5*s,.3,.45*s,'#284150',.1);
    for(const [xx,zz] of [[.7,1.3],[1.1,2.1]])cyl(g,xx*s,1.2*s,zz*s,.3*s,.25,'#d96067');
  }
  function tapeRoll(x,z,s=1,a=0){
    const g=prop('masking-tape',x,z,6*s,6*s,1.8*s,a);
    mesh(g,assets.tape,paperMaterial,0,.9*s,0,3*s,1.8*s,3*s);
    ring(g,0,1.8*s,0,2.92*s,cloth('#d6b67d'));ring(g,0,1.8*s,0,1.92*s,woodMaterial);
    roundedBox(g,3.2*s,.15,1.2*s,5*s,.12,2.1*s,cloth('#d9bb84'));
  }
  function deskLamp(x,z,s=1,a=0){
    const g=prop('desk-lamp',x,z,5*s,5*s,16*s,a),paint=mat('lamp-paint',{color:0x328b89,roughness:.31,metalness:.14});
    mesh(g,assets.spool,paint,0,.45*s,0,2.6*s,.9*s,2.6*s);
    mesh(g,assets.lampArm,paint,0,0,0,s,s,s);
    mesh(g,assets.shade,paint,4*s,14*s,0,3.2*s,3.2*s,3.2*s);
    lamp(g,4*s,13.3*s,0,'#ffe0a8',.4*s,115);
    cyl(g,.8*s,.6*s,1.7*s,.28*s,.16*s,brass);
  }
  function pencilTin(x,z,a=-.2){
    const g=prop('pencil-tin',x,z,18,17,10.3,a),enamel=cloth('#577d84'),inside=cloth('#c6c7ae');
    roundedBox(g,0,.45,1.5,17,.9,10.5,enamel);
    roundedBox(g,0,.96,1.5,15.9,.2,9.4,inside);
    for(const side of [-1,1])roundedBox(g,side*8.1,1.25,1.5,.65,1.5,10.5,enamel);
    for(const zz of [-3.4,6.4])roundedBox(g,0,1.25,zz,16.2,1.5,.65,enamel);
    const lid=new Group();lid.position.set(0,1.25,-3.5);lid.rotation.x=1.04;g.add(lid);
    roundedBox(lid,0,0,-4.9,17,.55,10,enamel);roundedBox(lid,0,.31,-4.9,15.6,.12,8.6,inside);
    roundedBox(lid,0,.39,-4.9,10,.03,4.5,cloth('#728c84'));
    for(let i=0;i<4;i++){
      const zz=-1.6+i*1.85,c=['#b26d52','#d0aa63','#517d87','#7b8e72'][i];
      mesh(g,cylinders,c,0,1.44,zz,.37,11.4,.37,0,0,Math.PI/2);
      mesh(g,cones,'#d8b98b',-6.25,1.44,zz,.37,1.1,.37,0,0,Math.PI/2);
      mesh(g,cones,'#3b4d53',-6.92,1.44,zz,.12,.27,.12,0,0,Math.PI/2);
    }
    roundedBox(g,6.8,1.52,4.1,1.35,.7,2.5,'#d8ad98');
    for(const xx of [-5.5,5.5])cyl(g,xx,1.24,-3.6,.3,1.4,metal,0,Math.PI/2);
  }
  function ruler(x,z,a=-.55){
    const g=prop('wooden-ruler',x,z,2.4,19,.3,a);
    roundedBox(g,0,.15,0,2.4,.3,19,woodMaterial);
    for(let i=0;i<37;i++)box(g,.85-(i%4===0?.62:.35),.31,-8.5+i*.47,i%4===0?1.25:.7,.018,.045,'#65766e');
    ring(g,0,.32,8.2,.26,'#65766e');
  }
  function threadSpool(x,z,a=.15){
    const g=prop('thread-spool',x,z,5,5,5.4,a);
    mesh(g,assets.spool,woodMaterial,0,2.7,0,2.4,5.4,2.4);
    const thread=texture('small-spool-thread',256,256,c=>{
      c.fillStyle='#a38691';c.fillRect(0,0,256,256);c.strokeStyle='#c8b0b2';c.lineWidth=1;
      for(let y=4;y<256;y+=9){c.beginPath();c.moveTo(0,y);c.lineTo(256,y-2);c.stroke();}
    });
    cyl(g,0,2.7,0,1.55,3.6,texMat('small-spool-thread',thread));
    cyl(g,0,5.43,0,.44,.05,'#576d70');
  }
  function binderClips(x,z,a=-.28){
    const g=prop('binder-clips',x,z,4.8,4.8,2.9,a);
    for(const [xx,zz,turn,c] of [[-1,-.6,.15,'#586f79'],[1.05,1.1,-.4,'#8b786c']]){
      const clip=new Group();clip.position.set(xx,0,zz);clip.rotation.y=turn;g.add(clip);
      roundedBox(clip,0,.65,0,2.1,1.2,1.35,c);
      box(clip,0,.15,.74,1.8,.18,.2,'#384c57');
      for(const side of [-1,1])cable(clip,[[-.65,.85,side*.62],[-.65,2.4,side*1.1],[-.43,2.7,side*1.13],[.43,2.7,side*1.13],[.65,2.4,side*1.1],[.65,.85,side*.62]],metal,.06);
    }
  }
  function looseMarbles(x,z,count=5){
    for(let i=0;i<count;i++){
      const xx=x+Math.sin(i*2.6)*3.7,zz=z+Math.cos(i*1.7)*2.5,r=.48+(i%3)*.09;
      if(terrain.hitProp(xx,r,zz,r+.2)||Math.abs(xx)>terrain.play-r||Math.abs(zz)>terrain.play-r)continue;
      terrain.workshopLooseMarbles.push({x:xx,z:zz,r,vx:0,vz:0,rollX:0,rollZ:0,armed:false,color:palette[i%6]});
    }
  }
  // Mixed small/medium stationery leaves an open playfield at the original camera.
  // Monumental silhouettes are reserved for the boundary.
  terrain.workshopLayout={style:'ink-painted-desk',anchors:[],giantScale:false,sceneText:false};
  // A few different activities share one continuous wooden desk. Surfaces are
  // authored as objects with pages, bindings and thickness, not terrain tiles.
  island(-18,-20,30,28,-.24);notebook(-2,7,28,35,.115,.3);yield;
  if(terrain.play>80){
    paperPile(-terrain.play*.59,-terrain.play*.37,29,38,-.27,.27,'sketch');yield;
    island(terrain.play*.49,-terrain.play*.61,39,28,.19);
    notebook(terrain.play*.50,-terrain.play*.59,24,30,.05,.27);yield;
    sketchbook(-terrain.play*.43,terrain.play*.59,27,35,.24,.4);
    paperPile(-terrain.play*.22,terrain.play*.70,16,22,-.36,.15,'notes');yield;
    paperPile(terrain.play*.66,terrain.play*.20,25,33,.29,.30,'blueprint');
    paperPile(terrain.play*.30,terrain.play*.62,19,26,-.12,.18,'notes');yield;
    notebook(-terrain.play*.20,-terrain.play*.78,21,29,-.14,.34);yield;
  }
  terrain.spawn.y=groundY(terrain.spawn.x,terrain.spawn.z);
  bookStack(-5.8,-13,.31,-.29);marbleFactory(7.8,-11.5,.30);yield;
  racePark(15,6,.52);pencilCup(-11,16,.44);yoYo(10,21,.50);yield;
  // Keep the handheld beside the pencil rather than intersecting its shaft.
  // The eraser and tape also leave clearance around the nearby racing car.
  pencil(-8,8,.65,'#e5ac46',.48);handheld(-5,-1,.45);eraser(5,2,-.32);tapeRoll(5,14,.42,.55);deskLamp(1,-26,.48,-.12);looseMarbles(3,12,4);yield;
  // Three compact machines flank the open notebook battle area.
  // Placement checks their full base footprints against the existing toys.
  placeMarble('switchback',-30,4,.38,-.13,24);yield;
  placeMarble('funnel',-7,33,.48,.12,24);yield;
  placeMarble('twin',30,-30,.4,-.08,24);yield;
  if(terrain.play>80){
    // A single clock replaces the north-west book stack and crowded crayon trays.
    const p=terrain.play,first=terrain.zxProps.length;
    const {width,depth,height}=ALARM_CLOCK_BOUNDS,clock=prop('boundary-alarm-clock',-p*.90,-p*.92,width,depth,height,.55);
    const clockShape=buildAlarmClock({mesh,ball,cyl,ring,roundedBox,cable,texture,texMat,mat,assets},clock);
    terrain.workshopLayout.alarmClock={x:clock.position.x,z:clock.position.z,angle:.55,...clockShape};
    pencilCup(-p*.59,-p*.84,.72,.25);
    pencil(-p*.62,-p*.70,1.18,'#4d8495',.68);tapeRoll(-p*.80,-p*.70,.65,-.22);
    eraser(-p*.53,-p*.73,.35);
    threadSpool(-p*.71,-p*.88);binderClips(-p*.82,-p*.77);
    handheld(-p*.70,-p*.61,.75,.26);
    terrain.workshopLayout.cornerCluster={x:-p*.81,z:-p*.84,r:28,props:terrain.zxProps.slice(first)};
    const lowerFirst=terrain.zxProps.length;
    pencilTin(-p*.72,p*.32,-.24);ruler(-p*.54,p*.32,-.66);
    yoYo(-p*.59,p*.13,.72,.22);eraser(-p*.79,p*.52,-.35);looseMarbles(-p*.69,p*.50,4);
    terrain.workshopLayout.lowerLeftCluster={x:-p*.69,z:p*.34,r:26,props:terrain.zxProps.slice(lowerFirst)};
    yield;
  }
  // A seeded, irregular scatter leaves broad paths between differently sized
  // clusters. Each cluster is offset and rotated; no repeated base tile exists.
  let seed=(terrain.seed^0x51f15e)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const limit=terrain.play-25,anchors=[];
  for(let attempt=0;attempt<240&&anchors.length<25&&limit>48;attempt++){
    const r=51+Math.sqrt(random())*(limit-51),a=random()*TAU,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const authored=[terrain.workshopLayout.cornerCluster,terrain.workshopLayout.lowerLeftCluster].filter(Boolean);
    if(Math.abs(x)>limit||Math.abs(z)>limit||authored.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+15)||anchors.some(p=>Math.hypot(x-p.x,z-p.z)<44)||terrain.workshopMarbleSites.some(p=>Math.hypot(x-p.x,z-p.z)<Math.hypot(p.w,p.d)/2+28))continue;
    anchors.push({x,z});const turn=(random()-.5)*1.25,size=.26+random()*.16,kind=anchors.length%6;
    terrain.workshopLayout.anchors.push({x,z,turn,size,kind});
    if(kind===0)bookStack(x,z,size,turn);
    if(kind===1){const variant=['helix','switchback','funnel','twin'][Math.floor(anchors.length/6)%4];placeMarble(variant,x,z,size*.92,turn,9);}
    if(kind===2){racePark(x,z,size,turn);handheld(x+12,z-11,size*.85,turn+.7);}
    if(kind===3){pencilCup(x,z,size*1.25,turn);tapeRoll(x-10,z+8,size*.8,turn);}
    if(kind===4){yoYo(x,z,size*1.3,turn);pencil(x+12,z-6,turn+1.2,'#4d8495',size*1.3);}
    if(kind===5){bookStack(x,z,size,turn);handheld(x+7,z+9,size*.9,turn+.4);}
    if(kind%2)looseMarbles(x-7,z+8,3);
    yield;
  }
  // Indoor boundary: tall painted walls, oak skirting, book shelves and festoons.
  // They sit beyond the gameplay limit, keeping the existing movement boundary.
  const edge=terrain.play+5;
  terrain.workshopBoundary={edge,height:65,sides:4,groups:[]};
  for(let side=0;side<4;side++){
    const g=group(0,0,side*Math.PI/2);
    // The near wall is a dollhouse cutaway: a camera behind the player must
    // never cross an opaque 65-unit wall at the southern gameplay boundary.
    const cutaway=side===2;
    box(g,0,cutaway?1.5:31,-edge,edge*2+12,cutaway?3:66,4,'#243e60');
    roundedBox(g,0,cutaway?1.4:4,-edge+2.2,edge*2,cutaway?2.8:8,1,woodMaterial);roundedBox(g,0,cutaway?3:8,-edge+3,edge*2,.7,1.2,woodMaterial);
    if(!cutaway){
      const variant=(stage+side)%3,wallpaper=texture('desk-wall-mural-'+variant,1536,512,(c,w,h)=>drawDeskWall(c,w,h,variant));
      mesh(g,planes,texMat('desk-wall-mural-'+variant,wallpaper,.95),0,34,-edge+2.05,edge*2,60,1);
    }
    const wall=g,arrangement=arrangeWorkshopBoundary(edge,stage,side,terrain.seed).map(cluster=>{
      if(terrain.play<=80)return cluster;
      const members=cluster.members.filter(p=>{
        const v=new Vector3(p.x,0,p.z);wall.localToWorld(v);
        const a=side*Math.PI/2+p.angle,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
        return !(v.x-(c*p.w+s*p.d)/2<-terrain.play*.6&&v.z-(s*p.w+c*p.d)/2<-terrain.play*.7);
      });
      if(!members.length)return null;
      const start=Math.min(...members.map(p=>p.x-p.extent/2)),end=Math.max(...members.map(p=>p.x+p.extent/2));
      return {...cluster,members,start,end,width:end-start,cluster:members.length>1};
    }).filter(Boolean);
    terrain.workshopBoundary.groups.push(...arrangement);
    for(const cluster of arrangement){
      for(let slot=0;slot<cluster.members.length;slot++){
      const placement=cluster.members[slot],variant=placement.variant,g=new Group();
      g.position.set(placement.x,0,placement.z);g.rotation.y=placement.angle;wall.add(g);
      const x=0,z=0,angle=side*Math.PI/2+placement.angle;
      if(variant){
        // Different giant toy silhouettes share the same shallow boundary strip.
        // South-facing props stay low so the camera can see the player.
        const h=cutaway?3.2:variant===1?30:variant===2?19:variant===3?23:4;
        let kind;
        if(variant===1&&!cutaway){
          kind='boundary-pencil-cup';
          mesh(g,assets.cup,cloth('#508f9b'),x,6,z,3.2,12,3.2);ring(g,x,12,z,3.1,brass);
          for(let i=0;i<5;i++){const xx=x-2+i,zz=z+(i%2-.5)*1.7,top=25+(i%3)*2;
            cyl(g,xx,(top+6)/2,zz,.38,top-6,palette[i]);mesh(g,cones,'#edc88c',xx,top+.9,zz,.4,1.8,.4);}
        }else if(variant===2&&!cutaway){
          kind='boundary-thread-spool';
          mesh(g,assets.spool,woodMaterial,x,h/2,z,3.3,h,3.3);
          cyl(g,x,h/2,z,2.1,12,cloth('#bd7794'));
          for(let i=0;i<12;i++)ring(g,x,4+i,z,2.12,cloth('#d698ad'));
        }else if(variant===3&&!cutaway){
          kind='boundary-toy-blocks';
          for(let row=0;row<3;row++){
            const xx=x+(row%2?2:-2),yy=3.7+row*7.3;
            roundedBox(g,xx,yy,z,7.5,7.4,6.4,cloth(palette[(row+side)%6]));
            roundedBox(g,xx,yy,z+3.25,5.5,5.5,.1,paperMaterial);
            for(let dot=0;dot<=row;dot++)ball(g,xx+(dot-row/2)*1.45,yy,z+3.36,.5,.5,.14,cloth(palette[(row+side)%6]));
          }
        }else if(variant===4){
          kind='boundary-crayon-box';
          roundedBox(g,x,1.2,z,18,2.4,6.4,cloth('#437a9a'));
          for(let i=0;i<6;i++){
            mesh(g,cylinders,palette[i],x-6.5+i*2.6,2.9,z,.72,4.7,.72,Math.PI/2);
            mesh(g,cones,palette[i],x-6.5+i*2.6,2.9,z+2.7,.72,.7,.72,Math.PI/2);
          }
        }else{
          kind='boundary-tape-rolls';
          for(let i=0;i<2;i++){
            mesh(g,assets.tape,cloth(palette[(side+i+slot)%6]),x-4+i*8,1.4,z,3,2.8,3);
            ring(g,x-4+i*8,2.83,z,2.95,paperMaterial);
          }
        }
        const point=new Vector3(x,0,z);g.localToWorld(point);
        const w=placement.w;
        terrain.zxProps.push({kind,x:point.x,z:point.z,w,d:7,h,angle,boundaryGroup:cluster.id});
        terrain.addCollider(paperBox(point.x,point.z,w,7,h+.2,angle));
      }else{
      for(let b=0;b<5;b++){
        const h=cutaway?2.8+(b%3)*.45:24+(b%3)*6.1,xx=x-7+b*3.1,cover=cloth(palette[(b+side)%6]);
        roundedBox(g,xx,h/2,z,2.6,h,6.4,cover);
        for(const yy of [.14,.23,.78,.87])roundedBox(g,xx,h*yy,z+3.25,2.45,.07,.09,brass);
        roundedBox(g,xx,h*.52,z+3.27,1.85,cutaway?.65:1.45,.08,paperMaterial);
        const point=new Vector3(x-7+b*3.1,0,z);g.localToWorld(point);
        terrain.zxProps.push({kind:'boundary-book',x:point.x,z:point.z,w:2.6,d:6.4,h,angle,boundaryGroup:cluster.id});terrain.addCollider(paperBox(point.x,point.z,2.6,6.4,h+.2,angle));
      }
      }
      }
      // Each light strand follows a whole group and leaves the broad gaps quiet.
      fairyString(wall,cluster.start,-edge+4,cluster.end,-edge+4,cutaway?8:15,Math.max(6,Math.round(cluster.width/2.4)));
    }
    // A large warm window set into each wall makes the enclosure read as a room.
    if(!cutaway){
      roundedBox(g,0,32,-edge+2.5,28,28,1,woodMaterial);box(g,0,32,-edge+3.1,25,25,.2,glow('#dbe2cd'));
      roundedBox(g,0,32,-edge+3.5,1,26,.6,woodMaterial);roundedBox(g,0,32,-edge+3.5,26,1,.6,woodMaterial);
      const drape=cloth('#804e6b');drape.side=2;
      mesh(g,assets.curtain,drape,-16,30,-edge+4.3,8,38,4);mesh(g,assets.curtain,drape,16,30,-edge+4.3,8,38,4);
    }
    yield;
  }
  root.clear();
  for(const {geo,material,matrices,colors:instanceColors} of batches.values()){
    const batch=new InstancedMesh(geo,material,matrices.length);matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.instanceMatrix.needsUpdate=true;
    instanceColors.forEach((c,i)=>batch.setColorAt(i,c));if(batch.instanceColor)batch.instanceColor.needsUpdate=true;
    batch.castShadow=geo!==planes&&!material.userData.proximity;
    batch.receiveShadow=material.isMeshStandardMaterial;
    batch.matrixAutoUpdate=false;batch.computeBoundingSphere();preparePaperBatch(batch);root.add(batch);
    if(geo!==planes&&geo!==boxes&&geo!==rings){
      const ink=new InstancedMesh(geo,workshopInk(assets),matrices.length);
      matrices.forEach((m,i)=>ink.setMatrixAt(i,m));ink.instanceMatrix.needsUpdate=true;
      ink.name='painted-prop-contour';ink.matrixAutoUpdate=false;ink.computeBoundingSphere();
      preparePaperBatch(ink);root.add(ink);
    }
    yield;
  }
  const haloMaterial=workshopLampHalo(assets),sensorLamps=terrain.workshopLamps.filter(l=>l.reactive),halos=new InstancedMesh(planes,haloMaterial,sensorLamps.length);
  sensorLamps.forEach((l,i)=>{transform.position.set(l.x,l.y,l.z);transform.rotation.set(0,0,0);transform.scale.setScalar(Math.max(.65,l.radius*9));transform.updateMatrix();halos.setMatrixAt(i,transform.matrix);halos.setColorAt(i,new Color(l.color));});
  halos.instanceMatrix.needsUpdate=true;halos.name='steady-lamp-halos';halos.renderOrder=3;halos.computeBoundingSphere();preparePaperBatch(halos);root.add(halos);
  // Four fixed accent lights keep the mobile shader bounded.
  terrain.workshopPointLights=Array.from({length:4},()=>{const light=new PointLight(0xffd5a0,0,58,2);light.castShadow=false;root.add(light);return light;});
  terrain.workshopFillLight=new DirectionalLight(0x8acfe8,.55);terrain.workshopFillLight.position.set(20,35,-40);root.add(terrain.workshopFillLight);
  const rolling=new InstancedMesh(spheres,mat('rolling-glass',{color:0x7db8ad,roughness:.16,metalness:.16}),terrain.workshopMarbleRuns.length*3);rolling.name='rolling-marbles';rolling.count=0;rolling.receiveShadow=true;rolling.frustumCulled=false;root.add(rolling);terrain.workshopRollingMarbles=rolling;terrain.workshopAnimationTime=0;terrain.workshopTransform=new Group();
  // Later clusters can occupy an earlier loose-marble candidate. Keep every
  // playable marble clear of the finished scene and the final-arena boundary.
  terrain.workshopLooseMarbles=terrain.workshopLooseMarbles.filter(m=>!terrain.hitProp(m.x,m.r,m.z,m.r+.1)&&Math.hypot(m.x,m.z)<terrain.arenaR-m.r);
  const looseCount=terrain.workshopLooseMarbles.length;
  const loose=new InstancedMesh(spheres,mat('sea-glass-marbles',{color:0x78b9b1,roughness:.19,metalness:.13,transparent:true,opacity:.76}),looseCount);
  const cores=new InstancedMesh(spheres,solid,looseCount);
  loose.name='pushable-floor-marbles';cores.name='floor-marble-cores';
  for(const mesh of [loose,cores]){mesh.frustumCulled=false;mesh.receiveShadow=true;root.add(mesh);}
  terrain.workshopLooseMarbles.forEach((marble,i)=>cores.setColorAt(i,color(marble.color)));
  terrain.workshopLooseMesh=loose;terrain.workshopLooseCores=cores;
  terrain.mats=[...mats.values()];terrain.textures=[...textures.values()];
  createForegroundLights(terrain);
  terrain.isFlatOpen=(x,z)=>{
    const y=groundY(x,z);
    return !terrain.hitProp(x,y+.3,z,.6)&&!terrain.inSolid(x,z)&&
      [[-1,0],[1,0],[0,-1],[0,1]].every(([dx,dz])=>Math.abs(groundY(x+dx,z+dz)-y)<.1);
  };
}

export function applyWorkshopLight(run){
  const r=run.r;
  r.setSky(0x172c50,0x263b5b,0x36596c,220,400,1,0xffd79d,0x334753);
  r.sky.visible=false;if(!r.scene.background?.isColor)r.scene.background=new Color();r.scene.background.set(0x30465d);
  r.setSun([-50,85,38],.8,0xffd49a,0,0);r.sun.color.set(0xffd49a);r.sun.intensity=3.3;
  r.hemi.color.set(0xb4c9ed);r.hemi.groundColor.set(0x485c8e);r.hemi.intensity=.48;
  r.shared.uLight.value.setRGB(1,1,1);r.shared.uWind.value=0;
  r.setAtmos(1,1,1,0,0,.02,1,1,1);r.grade.uniforms.get('uAmount').value=.08;
  r.renderer.toneMapping=0;r.renderer.toneMappingExposure=1;
  if(run.terrain)run.terrain.workshopLighting='daylight';
  for(const m of run.terrain?.workshopGlows||[])m.emissiveIntensity=m.userData.proximity?3.4:.12;
  if(run.terrain?.workshopFillLight){run.terrain.workshopFillLight.color.set(0x91ade0);run.terrain.workshopFillLight.intensity=.22;}
  updateWorkshopScene(run,0);
}
export function updateWorkshopScene(run,dt){
  const terrain=run.terrain;if(!terrain?.zxPaper)return;
  if(run.sprites)run.sprites.shadows.surface=terrain.workshopGroundY;
  const r=run.r,p=run.player?.pos||terrain.spawn;
  updateForegroundLights(run,dt);
  updateToyProximity(run,dt);
  const impulse=terrain.workshopImpulse||0;
  terrain.workshopImpulse=Math.max(0,impulse-Math.max(0,dt||0)*2.5);
  terrain.workshopAnimationTime+=Math.max(0,Math.min(.1,dt||0))*(1+impulse*.3);
  const rolling=terrain.workshopRollingMarbles,transform=terrain.workshopTransform;let marbleCount=0;
  transform.rotation.set(0,0,0);
  for(const track of terrain.workshopMarbleRuns){
    if(Math.abs(track.x-p.x)>46||Math.abs(track.z-p.z)>46)continue;
    for(let i=0;i<3;i++){
      const phase=(terrain.workshopAnimationTime*(track.speed||.095)+i/3)%1,bounce=Math.abs(Math.sin(terrain.workshopAnimationTime*23+i))*impulse*.1;
      if(track.path){
        const {points,lengths,length}=track.path,distance=phase*length;let low=0,high=lengths.length-1;
        while(high-low>1){const middle=(low+high)>>1;if(lengths[middle]<=distance)low=middle;else high=middle;}
        const blend=(distance-lengths[low])/Math.max(.0001,lengths[high]-lengths[low]),a=points[low],b=points[high];
        const x=(a[0]+(b[0]-a[0])*blend)*track.s,z=(a[2]+(b[2]-a[2])*blend)*track.s,c=Math.cos(track.angle),s=Math.sin(track.angle);
        transform.position.set(track.x+c*x+s*z,(track.baseY||0)+(a[1]+(b[1]-a[1])*blend+.47)*track.s+bounce,track.z-s*x+c*z);
      }else{
        const angle=phase*TAU*track.turns+track.angle,radius=track.radius*track.s;
        transform.position.set(track.x+Math.cos(angle)*radius,(track.baseY||0)+(track.top+(track.bottom-track.top)*phase+.47)*track.s+bounce,track.z+Math.sin(angle)*radius);
      }
      transform.scale.setScalar(.34*track.s);transform.updateMatrix();rolling.setMatrixAt(marbleCount++,transform.matrix);
    }
  }
  rolling.count=marbleCount;if(marbleCount)rolling.instanceMatrix.needsUpdate=true;
  for(let i=0;i<terrain.workshopLooseMarbles.length;i++){
    const marble=terrain.workshopLooseMarbles[i],y=Math.max(terrain.surface(marble.x,marble.z),terrain.workshopGroundY(marble.x,marble.z))+marble.r;
    transform.position.set(marble.x,y,marble.z);transform.rotation.set(marble.rollX,0,marble.rollZ);
    transform.scale.setScalar(marble.r);transform.updateMatrix();terrain.workshopLooseMesh.setMatrixAt(i,transform.matrix);
    transform.scale.set(.11,marble.r*.73,.12);transform.updateMatrix();terrain.workshopLooseCores.setMatrixAt(i,transform.matrix);
  }
  if(terrain.workshopLooseMarbles.length){terrain.workshopLooseMesh.instanceMatrix.needsUpdate=true;terrain.workshopLooseCores.instanceMatrix.needsUpdate=true;}
  const ink=terrain.paperAssets.mats.get('ink-contour');if(ink){ink.uniforms.uInkViewport.value.x=r.composer.inputBuffer.width;ink.uniforms.uInkViewport.value.y=r.composer.inputBuffer.height;}
  r.outlinePass.enabled=true;r.outline.uniforms.get('uColor').value.set(0x30394c);r.outline.uniforms.get('uStrength').value=.78;
  updateWorkshopShadows(run);
  // Fixed authored light positions. No nearest-lamp swaps, proximity pulses,
  // skill light takeover or animated bloom: movement cannot make the room flash.
  if(!terrain.workshopNearestLamps){
    const chosen=[];
    for(const l of terrain.workshopLamps){if(chosen.every(p=>Math.hypot(p.x-l.x,p.z-l.z)>10))chosen.push(l);if(chosen.length===4)break;}
    terrain.workshopNearestLamps=chosen;
  }
  terrain.workshopPointLights.forEach((light,i)=>{
    const lamp=terrain.workshopNearestLamps[i];
    if(lamp){light.position.set(lamp.x,lamp.y,lamp.z);light.color.set(lamp.color);light.intensity=(lamp.power||42)*.035;light.distance=42;}else light.intensity=0;
  });
  r.bloom.intensity=0;r.pickFinal();
}

function updateWorkshopShadows(run){
  const r=run.r,terrain=run.terrain,sun=r.sun,shadow=sun.shadow;
  const quality=run.meta?.profile?.settings?.quality||'medium',size=quality==='low'?1024:quality==='medium'?1536:2048;
  r.renderer.shadowMap.enabled=true;r.renderer.shadowMap.type=0;
  sun.castShadow=true;shadow.autoUpdate=false;
  // Only static scenery casts into this map. Reuse it while the view is still;
  // player/enemy contact shadows and rolling marbles keep their own animation.
  const {span,near,far}=WORKSHOP_SHADOW,texel=span*2/size;
  const focus=run.camTarget||run.player?.pos||terrain.spawn;
  const centre=shadowCentre.set(focus.x,0,focus.z-2.5);
  // Snap in the light's horizontal AND vertical axes. Snapping world X/Z
  // leaves diagonal sub-texel motion and makes moving shadows shimmer.
  const x=centre.dot(sunRight),y=centre.dot(sunUp);
  centre.addScaledVector(sunRight,Math.round(x/texel)*texel-x);
  centre.addScaledVector(sunUp,Math.round(y/texel)*texel-y);
  const key=[size,centre.x,centre.y,centre.z].join('/');
  if(terrain.workshopShadowKey!==key){
    terrain.workshopShadowKey=key;
    if(shadow.mapSize.x!==size){shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(size,size);}
    Object.assign(shadow.camera,{left:-span,right:span,top:span,bottom:-span,near,far});shadow.camera.updateProjectionMatrix();
    shadow.bias=-.00008;shadow.normalBias=.035;shadow.radius=2;
    shadow.needsUpdate=true;
  }
  sun.target.position.copy(centre);sun.target.updateMatrixWorld();
  sun.position.copy(centre).addScaledVector(sunDirection,150);sun.updateMatrixWorld();
  terrain.workshopShadowLight=sun;terrain.workshopShadowRenderer=r.renderer;
}
