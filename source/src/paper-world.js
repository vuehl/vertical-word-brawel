// A miniature stationery world. Geometry, textures and shadows are authored
// locally, with one instanced batch per shared geometry/material on mobile.
import {I as Group,H as InstancedMesh,_ as BoxGeometry,E as CylinderGeometry,T as ConeGeometry,et as PlaneGeometry,J as ToonMaterial,q as BasicMaterial,b as CanvasTexture,ot as SRGB,ht as Vector3} from '../assets/three-DmSYIDKK.js';
import {runLoadingSteps} from './loading-work.js';
import {preparePaperBatch} from './paper-visibility.js';
import {paperBox} from './paper-collision.js';

export const paperStages=['胶佬工作台','手帐漫游','文具高塔','字灵书庭'];
export const PAPER_CAMERA={yaw:0,pitch:Math.PI*.30,distance:42,fov:37};
const TAU=Math.PI*2;

// Owned by one run, shared between its areas and released on leaving the run.
// Do not dispose these GPU resources with the outgoing area's instances.
export function createPaperAssets(){
  return {boxes:new BoxGeometry(1,1,1),planes:new PlaneGeometry(1,1),
    cylinders:new CylinderGeometry(1,1,1,32),cones:new ConeGeometry(1,1,24),mats:new Map(),textures:new Map()};
}
export function disposePaperAssets(assets){
  if(!assets||assets.disposed)return;assets.disposed=true;
  for(const key of ['boxes','planes','cylinders','cones'])assets[key].dispose();
  for(const mat of assets.mats.values())mat.dispose();
  for(const texture of assets.textures.values())texture.dispose();
  assets.mats.clear();assets.textures.clear();
}
export function disposePaperWorld(terrain){
  terrain.group.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});
  terrain.group.parent?.remove(terrain.group);terrain.group.clear();
  if(terrain.ownsPaperAssets)disposePaperAssets(terrain.paperAssets);
  terrain.mats=[];terrain.textures=[];
}

export function buildPaperWorld(terrain){for(const _ of paperWorldSteps(terrain)){} }
export function buildPaperWorldAsync(terrain,options){return runLoadingSteps(paperWorldSteps(terrain),options);}
function* paperWorldSteps(terrain){
  const root=terrain.group,stage=terrain.biome.zxStage||1;
  terrain.zxPaper=true;terrain.zxStage=stage;root.name='paper-workshop';
  terrain.hasWater=false;terrain.isLava=false;terrain.frozen=false;
  terrain.minH=terrain.maxH=0;terrain.heights.fill(0);terrain.pathMask.fill(0);
  terrain.spawn.set(terrain.arena?.entry?.x||0,0,terrain.arena?.entry?.z||0);
  terrain.landmarks=[];terrain.zxProps=[];
  terrain.ownsPaperAssets=!terrain.paperAssets;
  const assets=terrain.paperAssets??=createPaperAssets();
  const {boxes,planes,cylinders,cones,mats,textures}=assets;
  const batches=new Map(),transform=new Group();
  const material=(color,basic=false)=>{
    const key=color+basic;if(mats.has(key))return mats.get(key);
    const mat=basic?new BasicMaterial({color}):new ToonMaterial({color});mats.set(key,mat);terrain.mats.push(mat);return mat;
  };
  function texture(key,w,h,draw){
    if(textures.has(key))return textures.get(key);
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);
    const t=new CanvasTexture(canvas);t.colorSpace=SRGB;t.anisotropy=4;t.generateMipmaps=true;terrain.textures.push(t);textures.set(key,t);return t;
  }
  const textureMat=(key,t,transparent=false)=>{
    if(mats.has(key))return mats.get(key);
    const mat=new BasicMaterial({map:t,transparent,depthWrite:!transparent,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});terrain.mats.push(mat);mats.set(key,mat);return mat;
  };
  function mesh(parent,geometry,mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    // Accumulate instance matrices directly: avoid thousands of temporary
    // Mesh objects and a second scene traversal on every area change.
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(rx,ry,rz);transform.updateMatrix();
    parent.updateWorldMatrix(true,false);
    const key=geometry.uuid+'/'+mat.uuid;
    let batch=batches.get(key);if(!batch)batches.set(key,batch={geometry,material:mat,matrices:[]});
    batch.matrices.push(transform.matrix.clone().premultiply(parent.matrixWorld));
  }
  const box=(g,x,y,z,w,h,d,c)=>mesh(g,boxes,material(c),x,y,z,w,h,d);
  const cylinder=(g,x,y,z,r,h,c)=>mesh(g,cylinders,material(c),x,y,z,r,h,r);
  const plane=(g,x,y,z,w,d,mat,angle=0)=>mesh(g,planes,mat,x,y,z,w,d,1,-Math.PI/2,0,angle);
  const shadow=textureMat('soft-shadow',texture('shadow',128,128,c=>{
    const g=c.createRadialGradient(64,64,5,64,64,63);g.addColorStop(0,'#263e4685');g.addColorStop(.58,'#263e4666');g.addColorStop(.84,'#263e462c');g.addColorStop(1,'#263e4600');c.fillStyle=g;c.fillRect(0,0,128,128);
  }),true);
  const ink='#35414b',mint='#b6d6c3',cream='#faf4df',pink='#d4a1b4';
  function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function label(c,text,x,y,size,color='#455365',align='left'){c.font='bold '+size+'px "Ziling Swei",sans-serif';c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(text,x,y);}
  const gridTex=texture('cutting-mat-'+terrain.world,512,512,(c,w,h)=>{
    c.fillStyle='#66abc9';c.fillRect(0,0,w,h);
    for(let i=0;i<=512;i+=16){c.strokeStyle=i%64?'#a2d2dd55':'#c6ebecaa';c.lineWidth=i%64?.7:1.7;c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.moveTo(0,i);c.lineTo(w,i);c.stroke();}
    c.strokeStyle='#e5f5eb55';c.lineWidth=1;c.beginPath();c.moveTo(0,512);c.lineTo(512,0);c.moveTo(0,256);c.lineTo(256,0);c.stroke();
    label(c,'A3',34,42,18,'#e4f3df');label(c,'CUTTING MAT',34,65,8,'#e4f3df');
    for(let i=1;i<8;i++)label(c,String(i*10),i*64+3,503,8,'#d5edf0');
  });gridTex.wrapS=gridTex.wrapT=1000;gridTex.repeat.set(terrain.world/32,terrain.world/32);
  plane(root,0,-.065,0,terrain.world,terrain.world,textureMat('mat-'+terrain.world,gridTex));
  yield;
  const paperMat=(kind)=>{
    if(mats.has('paper-'+kind))return mats.get('paper-'+kind);
    const tex=texture('paper-'+kind,512,512,(c,w,h)=>{
      c.fillStyle=kind==='dots'?'#d7e6cc':kind==='blue'?'#e7f0ed':kind==='cream'?'#fff7df':'#faf8ee';c.fillRect(0,0,w,h);
      if(kind==='dots'||kind==='blue'){
        c.fillStyle=kind==='dots'?'#5d716477':'#647d8377';for(let y=7;y<h;y+=17)for(let x=7;x<w;x+=17){c.beginPath();c.arc(x,y,.85,0,TAU);c.fill();}
      }else if(kind==='lined'){
        c.strokeStyle='#92b4c09c';c.lineWidth=1.1;for(let y=24;y<h;y+=25){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
        c.strokeStyle='#d69b9799';c.beginPath();c.moveTo(55,0);c.lineTo(55,h);c.stroke();
      }else {label(c,'今日灵感',38,55,26,'#9a8664');c.strokeStyle='#c2ab7e';c.strokeRect(35,95,20,20);c.strokeRect(35,145,20,20);label(c,'写下一个小小世界',70,106,15,'#a58e68');}
      // Fine, stationary paper fibres without noisy moving shaders.
      c.fillStyle='#a4a38b10';for(let i=0;i<1800;i++)c.fillRect((i*137)%512,(i*193)%512,1,1);
    });return textureMat('paper-'+kind,tex);
  };
  function sheet(x,z,w,d,angle,kind='dots',level=.015){
    const g=new Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);
    plane(g,.20,level-.006,.28,w+.45,d+.45,shadow);
    box(g,0,level-.018,0,w,.045,d,kind==='dots'?'#9ea99b':'#c3bdb1');
    plane(g,0,level+.01,0,w,d,paperMat(kind));return g;
  }
  function prop(kind,x,z,angle,w,d,h){
    const g=new Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);
    plane(g,.45+h*.20,.18,.6+h*.28,w+1.6+h*.15,d+1.8+h*.3,shadow);
    terrain.zxProps.push({kind,x,z,w,d,h});
    // One oriented footprint replaces dozens of overlapping small circles.
    // Paper sheets remain walkable; movement and projectiles share this shape.
    terrain.addCollider(paperBox(x,z,w,d,h+.25,angle));
    terrain.reserve(x,z,Math.hypot(w,d)/2+1.5);
    terrain.landmarks.push({kind:'meadow',x,z,r:Math.hypot(w,d)/2});return g;
  }
  const calcFace=textureMat('calculator-face',texture('calculator-face',512,768,(c,w,h)=>{
    c.fillStyle='#dcded0';c.fillRect(0,0,w,h);rr(c,28,30,456,160,14,'#bdc9b2','#7d8d81');
    label(c,'ZILING / 01',50,56,18,'#53695a');label(c,'0',446,125,78,'#34463e','right');
    label(c,'DESKTOP CALCULATOR',38,217,14,'#69736e');
    const keys=['MC','MR','M−','M+','AC','7','8','9','÷','CE','4','5','6','×','%','1','2','3','−','√','0','.','=','+','ON'];
    for(let r=0;r<5;r++)for(let k=0;k<5;k++){
      const x=30+k*94,y=252+r*97;rr(c,x+3,y+5,78,78,8,'#454f4b');rr(c,x,y,78,76,8,k===4||r===0&&k===0?'#ea8d55':'#8c9892','#697871');
      c.fillStyle='#ffffff42';c.fillRect(x+8,y+6,62,3);label(c,keys[r*5+k],x+39,y+39,28,'#fff9e7','center');
    }
  }));
  function calculator(x,z,a=0,scale=1){
    const w=6*scale,d=9*scale,g=prop('calculator',x,z,a,w,d,1.25*scale);
    box(g,0,.42*scale,0,w,.8*scale,d,'#647876');box(g,0,.89*scale,-.05,w-.2,.35*scale,d-.15,'#b9c5b7');
    plane(g,0,1.08*scale,0,w-.32,d-.32,calcFace);
  }
  yield;
  const cassetteFace=textureMat('cassette-face',texture('cassette-face',768,456,(c,w,h)=>{
    c.fillStyle='#b8e3da';c.fillRect(0,0,w,h);rr(c,22,22,724,412,25,null,'#536b79');
    rr(c,44,45,680,100,8,'#fff8e5');label(c,'SIDE A',70,78,23,'#7a587d');label(c,'SMALL WONDERS',70,115,28,'#48566a');
    c.fillStyle='#dc9bcb';c.fillRect(44,138,680,26);c.fillStyle='#efcf7f';c.fillRect(44,165,680,18);
    rr(c,142,205,480,110,54,'#7a849e','#3e4c60');
    for(const x of [236,532]){c.fillStyle='#f7efd8';c.beginPath();c.arc(x,260,48,0,TAU);c.fill();c.fillStyle='#b6dace';c.beginPath();c.arc(x,260,32,0,TAU);c.fill();c.strokeStyle='#7d8391';c.lineWidth=7;for(let i=0;i<6;i++){const a=i*TAU/6;c.beginPath();c.moveTo(x+Math.cos(a)*23,260+Math.sin(a)*23);c.lineTo(x+Math.cos(a)*34,260+Math.sin(a)*34);c.stroke();}}
    rr(c,175,360,418,75,10,'#dfb6c6','#8f8094');for(const x of [60,708])for(const y of [35,414]){c.fillStyle='#627879';c.beginPath();c.arc(x,y,7,0,TAU);c.fill();}
  }));
  function cassette(x,z,a=0,s=1){const g=prop('cassette',x,z,a,8*s,4.8*s,.8*s);box(g,0,.33*s,0,8*s,.66*s,4.8*s,'#b890ac');box(g,0,.69*s,0,7.9*s,.16*s,4.7*s,'#c8e9dd');plane(g,0,.78*s,0,7.8*s,4.6*s,cassetteFace);}
  yield;
  const rulerFace=textureMat('ruler-face',texture('ruler-face',1024,128,(c,w,h)=>{
    c.fillStyle='#e8c77b';c.fillRect(0,0,w,h);c.strokeStyle='#766744';c.lineWidth=2;
    for(let i=0;i<100;i++){const x=12+i*10;c.beginPath();c.moveTo(x,0);c.lineTo(x,i%10===0?46:i%5===0?32:21);c.stroke();if(i%10===0)label(c,String(i/10),x+4,67,22,'#746444');}label(c,'ZILING',840,105,15,'#897241');
  }));
  function ruler(x,z,a){const g=prop('ruler',x,z,a,16,1.8,.22);box(g,0,.11,0,16,.22,1.8,'#b59c65');plane(g,0,.235,0,16,1.8,rulerFace);}
  function pencil(x,z,a,color='#e8b563',length=14){
    const g=prop('pencil',x,z,a,1.2,length,1.1);
    mesh(g,cylinders,material(color),0,.6,0,.55,length-2,.55,Math.PI/2);
    mesh(g,cylinders,material('#e8d8b2'),0,.6,-length/2+.9,.55,.6,.55,Math.PI/2);
    mesh(g,cones,material('#d4b780'),0,.6,-length/2+.1,.55,1.4,.55,-Math.PI/2);
    mesh(g,cones,material('#42454e'),0,.6,-length/2-.5,.19,.55,.19,-Math.PI/2);
    mesh(g,cylinders,material('#e3a6aa'),0,.6,length/2-.45,.56,.9,.56,Math.PI/2);
    mesh(g,cylinders,material('#bbbcb0'),0,.6,length/2-1.05,.58,.4,.58,Math.PI/2);
  }
  const cover=textureMat('book-cover',texture('book-cover',512,640,(c,w,h)=>{
    c.fillStyle='#a7cbbf';c.fillRect(0,0,w,h);c.strokeStyle='#ecf1d9';c.lineWidth=3;c.strokeRect(32,32,w-64,h-64);
    label(c,'字 灵 手 帐',w/2,220,42,'#3f5b60','center');label(c,'SMALL WONDERS',w/2,295,22,'#617b79','center');label(c,'VOL. 01  /  DESK ADVENTURES',w/2,545,13,'#617b79','center');c.beginPath();c.arc(w/2,385,38,0,TAU);c.stroke();
  }));
  function books(x,z,a=0,s=1){const g=prop('books',x,z,a,9*s,12*s,3.1*s);box(g,0,.2*s,0,9*s,.3*s,12*s,'#c190a7');box(g,0,.8*s,0,8.8*s,1.0*s,11.7*s,cream);box(g,0,1.38*s,0,9*s,.2*s,12*s,'#c190a7');box(g,.3,1.65*s,0,8.7*s,.22*s,11.4*s,'#819e9b');box(g,.3,2.25*s,0,8.5*s,1.0*s,11.2*s,cream);box(g,.3,2.85*s,0,8.7*s,.2*s,11.4*s,mint);plane(g,.3,2.96*s,0,8.7*s,11.4*s,cover);
    for(let i=0;i<7;i++)box(g,0,.4*s+i*.13*s,5.86*s,8.8*s,.025, .018,'#d3cdb7');
  }
  function notebook(x,z,a=0){const g=sheet(x,z,17,20,a,'lined',.12);box(g,0,.03,0,17.3,.12,20.3,'#8e9b95');for(let i=0;i<11;i++){
    mesh(g,cylinders,material('#6b797d'),-8.45,.24,-8.9+i*1.78,.11,1.0,.11,0,0,Math.PI/2);
    plane(g,-7.9,.145,-8.9+i*1.78,.35,.35,shadow);
  }}
  function tape(x,z,a=0,s=1){const g=prop('tape',x,z,a,5*s,5*s,1.3*s);cylinder(g,0,.6,0,2.5*s,1.2*s,'#dfc580');cylinder(g,0,1.21*s,0,1.45*s,.035,'#b7a785');cylinder(g,0,1.24*s,0,1.12*s,.04,'#668c9a');box(g,2.4,.1,0,3,.12,2.5,'#e6d397');}
  function cup(x,z,a=0){const g=prop('pen-cup',x,z,a,6,6,11);cylinder(g,0,2.5,0,2.8,5,'#8397b1');cylinder(g,0,.25,0,2.95,.5,'#6f7f99');cylinder(g,0,4.9,0,2.95,.5,'#a0b1bf');cylinder(g,0,5.17,0,2.55,.05,'#4a5465');
    for(let i=0;i<6;i++){const x=Math.cos(i*2.4)*1.5,z=Math.sin(i*2.4)*1.5;const col=['#e5b866','#a7c8af','#d8a6ba'][i%3];mesh(g,cylinders,material(col),x,6.8+i%3*.5,z,.28,7,.28,Math.sin(i)*.12,0,Math.cos(i)*.12);mesh(g,cones,material('#decc9e'),x,10.5+i%3*.5,z,.28,.9,.28);}
  }
  function clip(x,z,a=0){const g=new Group();g.position.set(x,.2,z);g.rotation.y=a;root.add(g);const c='#b5a56c';box(g,0,0,0,2,.12,.12,c);box(g,0,0,2.5,2,.12,.12,c);box(g,-1,0,1.25,.12,.12,2.5,c);box(g,1,0,1.1,.12,.12,2.2,c);box(g,.4,0,1.3,.12,.12,1.5,c);box(g,-.3,0,.65,1.4,.12,.12,c);}
  yield;
  // First frame composition: the player stands on the green dot paper, with
  // oversized props above/at the edges and a ruled notebook crossing the front.
  sheet(-3,-4,20,23,.40,'dots');yield;
  sheet(-10,-16,18,23,.40,'blue',.026);yield;
  notebook(9,13,-.32);yield;
  sheet(13,-4,10,12,-.2,'cream',.035);yield;
  calculator(4.8,-10.2,-.26);cassette(-8.4,-6,.25);cassette(9,4.8,-.3,.9);
  pencil(-10,9,-.5,'#dda6bc');ruler(4,25,.36);books(-16,-27,.14);cup(13,-23);tape(-12,22,.2);clip(-5,8,-.5);
  // Different landmarks in every chapter, while keeping the same palette.
  if(stage===2){notebook(-8,-13,.18);tape(14,-14,0,1.35);books(-16,12,-.25,1.1);}
  if(stage===3){books(9,-12,-.3,1.3);cup(-13,-19);ruler(-11,12,-.4);}
  if(stage===4){sheet(0,0,42,46,.18,'lined',.04);books(-19,-17,.15,1.35);books(21,-20,-.1,1.2);cup(1,-30);}
  yield;
  // Repeat authored little vignettes across the full navigable playfield.
  const lim=Math.min(terrain.play-14,115);
  for(let z=-lim;z<=lim;z+=34)for(let x=-lim;x<=lim;x+=34){
    if(Math.hypot(x,z)<43)continue;
    const seed=Math.abs(Math.round(x*173+z*319+stage*751)),a=(seed%9-4)*.11;
    sheet(x,z,28+seed%6,30,a,seed%3===0?'blue':seed%3===1?'dots':'lined',.014+(seed%4)*.008);
    const kind=seed%6;
    if(kind===0)calculator(x-7,z-8,a,.95);
    if(kind===1)cassette(x+6,z+6,a,1.1);
    if(kind===2)books(x+7,z-8,a);
    if(kind===3){pencil(x-9,z,a);tape(x+9,z+7);}
    if(kind===4)cup(x+8,z-8);
    if(kind===5){ruler(x,z-9,a);clip(x-5,z+4,a);}
    yield;
  }
  // Bake soft diagonal window light onto the desk, leaving combat colors intact.
  const light=textureMat('window-light',texture('window-light',256,256,c=>{
    const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,'#fffbd32b');g.addColorStop(.65,'#fffbd310');g.addColorStop(1,'#fffbd300');c.fillStyle=g;c.fillRect(0,0,256,256);
  }),true);plane(root,-8,.085,-5,65,90,light,-.32);
  root.clear();
  for(const {geometry,material,matrices} of batches.values()){
    const batch=new InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.instanceMatrix.needsUpdate=true;
    batch.matrixAutoUpdate=false;batch.computeBoundingSphere();preparePaperBatch(batch,material===shadow);root.add(batch);
    yield;
  }
  terrain.mats=[...mats.values()];terrain.textures=[...textures.values()];
  // Reject spawns inside large stationery; the same collision grid is used by
  // movement and projectiles, so visible objects cannot become invisible walls.
  terrain.isFlatOpen=(x,z)=>!terrain.hitProp(x,.3,z,.6)&&!terrain.inSolid(x,z);
}

export function applyPaperLight(run){
  const r=run.r;r.setSky(0xe8efdf,0xf8f5df,0xdce8e4,180,280,1,0xffedcf,0x9bbbc1);
  r.sky.visible=!run.terrain?.zxPaper;
  r.setSun([-65,110,-45],.83,0xffeac2,0,0);r.sun.intensity=1.65;r.hemi.intensity=2.05;
  r.shared.uLight.value.setRGB(1,1,1);r.shared.uWind.value=0;
  r.setAtmos(1,1,1,0,0,.06,1,1,1);r.grade.uniforms.get('uAmount').value=.25;
}

export function updatePaperCamera(run,dt){
  const p=run.player.pos,c=run.r.camera,k=1-Math.exp(-Math.max(0,dt)*12);
  if(!Number.isFinite(run.camTarget.x+run.camTarget.y+run.camTarget.z))run.camTarget.copy(p);
  run.camTarget.lerp(p,k);run.camYaw=PAPER_CAMERA.yaw;run.camPitch=PAPER_CAMERA.pitch;run.camDist=PAPER_CAMERA.distance;
  // Keep a constant angle and screen scale, with the player slightly below
  // centre. No pointer, pinch, mouse, cinematic orbit or speed-dependent zoom.
  const distance=PAPER_CAMERA.distance*Math.max(1,.46/Math.max(.25,c.aspect));
  const focus=new Vector3(run.camTarget.x,run.camTarget.y+.5,run.camTarget.z-2.5);
  c.position.set(focus.x,focus.y+Math.sin(PAPER_CAMERA.pitch)*distance,focus.z+Math.cos(PAPER_CAMERA.pitch)*distance);
  c.lookAt(focus);if(c.fov!==PAPER_CAMERA.fov){c.fov=PAPER_CAMERA.fov;c.updateProjectionMatrix();}
  run.trauma=0;run.camLift=0;
}
