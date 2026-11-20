import layout from './desk2d-layout.json';
import shelf from './desk2d-shelf.json';
import deviceSizes from './desk2d-devices.json';
import {altarLayers,altarPalette} from './desk-altar-art.js';
import {berryLayers,applyBerryLayers} from './desk-berry-art.js';
import {billLayers} from './bill-layers.js';
import {installBillGaze} from './bill-gaze.js';
import {w as Color,y as BufferGeometry,v as Attribute,I as Group,et as PlaneGeometry,K as Mesh,q as BasicMaterial,dt as Texture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import {paperBox,hitsPaperBox} from './paper-collision.js';

import {deskPitch as pitch,deskTilt as tilt,deskPixelsPerUnit as pixelsPerUnit,deskFrame} from './desk-framing.js';
const xAt=px=>(px-layout.width/2)/pixelsPerUnit;
const zAt=py=>(py-layout.height/2)/(pixelsPerUnit*tilt);
const halfWidth=xAt(layout.width),halfDepth=zAt(layout.height);
export const isDeskStage=t=>t.biome.zxStage===1&&!t.arena;
export function initDesk(t){
  t.desk2d=true;t.zxPaper=true;t.zxStage=1;t.group.name='desk-map-2d';
  t.hasWater=t.frozen=t.isLava=false;t.waterLevel=-99;t.minH=t.maxH=0;
  t.heights.fill(0);t.pathMask.fill(0);t.landmarks=[];t.zxProps=[];
  t.deskBounds={x:halfWidth,z:halfDepth};t.play=halfWidth;t.workshopGroundY=()=>0;
  const {spawn,facilitySites=[]}=t.mapRules;
  t.spawn.set(xAt(spawn.x),0,zAt(spawn.z));
  const surfaces=new Map(facilitySites.map(s=>[s.surface,[]]));
  t.facilitySites=facilitySites.map(s=>({surface:s.surface,x:xAt(s.x),z:zAt(s.z)}));
  t.inBounds=(x,z,n=0)=>Math.abs(x)<halfWidth-n&&Math.abs(z)<halfDepth-n;
  t.isFlatOpen=(x,z)=>t.inBounds(x,z,1)&&!t.hitProp(x,.3,z,1);
  t.deskOwned=[];t.deskTextures=new Map();
  for(const [kind,l,top,r,b] of layout.rects){
    const box=paperBox(xAt((l+r)/2),zAt((top+b)/2),(r-l)/pixelsPerUnit,(b-top)/(pixelsPerUnit*tilt),1000,0);
    box.kind=kind;
    if(surfaces.has(kind))surfaces.get(kind).push(box);
    else t.addCollider(box);
  }
  // These two low surfaces can be walked on. Keep the rest of the artwork,
  // including things lying on top of them, in the ordinary collision grid.
  t.fitsFacilitySurface=(x,z,radius,surface)=>{
    for(const [name,boxes] of surfaces){
      if(name!==surface && boxes.some(box=>hitsPaperBox(box,x,z,radius)))return false;
    }
    if(!surface)return true;
    // Check the full circular footprint against every horizontal silhouette
    // strip it crosses, including concave edges and gaps between parts.
    const boxes=surfaces.get(surface);
    if(!boxes)return false;
    const top=z-radius,bottom=z+radius;
    const cuts=[top,bottom];
    for(const b of boxes)for(const edge of [b.z-b.halfZ,b.z+b.halfZ]){
      if(edge>top&&edge<bottom)cuts.push(edge);
    }
    cuts.sort((a,b)=>a-b);
    for(let i=1;i<cuts.length;i++){
      const lo=cuts[i-1],hi=cuts[i];
      if(hi-lo<1e-8)continue;
      const mid=(hi+lo)/2, dz=Math.max(lo-z,z-hi,0);
      const dx=Math.sqrt(Math.max(0,radius*radius-dz*dz));
      if(!boxes.some(b=>Math.abs(mid-b.z)<=b.halfZ && Math.abs(x-b.x)+dx<=b.halfX+1e-8))return false;
    }
    return true;
  };
  // Exclude the space beyond the back edge of the tabletop.
  t.shelfBarriers=[];
  for(const {bounds:[l,back,r,front]} of shelf.feet){
    const foot=paperBox(xAt((l+r)/2),zAt((back+front)/2),(r-l)/pixelsPerUnit,(front-back)/(pixelsPerUnit*tilt),1000,0);
    foot.kind='shelf-foot';t.shelfBarriers.push(foot);t.addCollider(foot);
  }
  const rim=shelf.rim;
  for(let i=1;i<rim.length;i++){
    const [ax,ay]=rim[i-1],[bx,by]=rim[i],x=xAt(ax),z=zAt(ay);
    const angle=Math.atan2(zAt(by)-z,xAt(bx)-x),ux=Math.cos(angle),uz=Math.sin(angle);
    // Cover the outside half-plane up to the map bounds. A single straight
    // face lets circular bodies slide smoothly along the illustrated edge.
    const along=halfWidth*Math.abs(ux)+halfDepth*Math.abs(uz)+8;
    const normal=halfWidth*Math.abs(uz)+halfDepth*Math.abs(ux)+8;
    const edge=-uz*x+ux*z,mid=(edge-normal)/2;
    const wall=paperBox(-uz*mid,ux*mid,2*along,edge+normal,1000,-angle);
    wall.kind='desk-rim';t.shelfBarriers.push(wall);t.addCollider(wall);
  }
  const geometry=new PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);t.deskOwned.push(geometry);
  t.deskReady=(async()=>{
    const jobs=layout.layers.flatMap(({name,parts},layer)=>parts.map(part=>({name,layer,part})));
    async function load(){
      while(jobs.length&&!t.disposed){
        const {name,layer,part:[file,x,y,w,h]}=jobs.shift();
        const texture=await deskTexture(t,file);
        if(t.disposed)return;
        const material=new BasicMaterial({map:texture,transparent:layer!==0,depthWrite:false,fog:false,toneMapped:false});
        t.deskOwned.push(material);
        const sheet=new Mesh(geometry,material);sheet.name='desk2d/'+name;
        sheet.scale.set(w/pixelsPerUnit,1,h/(pixelsPerUnit*tilt));
        sheet.position.set(xAt(x+w/2),-.05,zAt(y+h/2));
        sheet.renderOrder=-100+layer;t.group.add(sheet);
      }
    }
    await Promise.all([...Array.from({length:4},load),deskTexture(t,'shelf-depth.png').then(map=>{
      if(t.disposed)return;
      map.colorSpace='';map.generateMipmaps=false;map.minFilter=map.magFilter;t.shelfDepth=map;
    })]);
  })();
}
export function deskTexture(t,file){
  if(!t.deskTextures.has(file))t.deskTextures.set(file,new Promise((resolve,reject)=>{
    const ready=image=>{
      const map=new Texture(image);map.colorSpace=SRGB;map.needsUpdate=true;
      if(t.disposed)map.dispose();else t.deskOwned.push(map);resolve(map);
    };
    const image=new Image();
    image.addEventListener('load',()=>ready(image));
    image.addEventListener('error',()=>reject(Error('无法读取桌面图片 '+file)));
    image.src='/assets/env/desk2d/'+file;
  }));
  return t.deskTextures.get(file);
}
export function deskCamera(run,dt,progress=1,bend=0){
  const c=run.r.camera,t=run.terrain,p=run.player.pos;
  run.camTarget.lerp(p,1-Math.exp(-12*Math.max(0,dt)));
  const {x,z,w,h,distance}=deskFrame(c.aspect,halfWidth,halfDepth,run.camTarget.x,run.camTarget.z,progress,bend);
  c.position.set(x,distance*tilt,z+distance*Math.cos(pitch));c.lookAt(x,0,z);
  c.projectionMatrix.makeOrthographic(-w,w,h,-h,c.near,c.far,c.coordinateSystem);
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  t.deskCamera=c;run.camYaw=0;run.camPitch=pitch;run.camDist=distance;run.camLift=0;
}
function deskGeometry(t,key,strips,resolution=128){
  t.deskDeviceGeometries??=new Map();
  if(!t.deskDeviceGeometries.has(key)){
    const points=[],uv=[];
    for(const [left,y,right] of strips){
      for(const [x,row] of [[left,y],[left,y+1],[right,y],[right,y],[left,y+1],[right,y+1]]){
        points.push(x/resolution-.5,.5-row/resolution,0);uv.push(x/resolution,1-row/resolution);
      }
    }
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new Attribute(new Float32Array(points),3));
    geometry.setAttribute('uv',new Attribute(new Float32Array(uv),2));
    t.deskDeviceGeometries.set(key,geometry);t.deskOwned.push(geometry);
  }
  return t.deskDeviceGeometries.get(key);
}
function deskSprite(t,key,strips,size,texture,layer=0){
  const geometry=deskGeometry(t,key,strips);
  const material=new BasicMaterial({map:texture,transparent:true,alphaTest:.08,toneMapped:false,fog:false});
  t.deskOwned.push(material);
  const sprite=new Mesh(geometry,material);
  sprite.name=key;sprite.scale.setScalar(size);
  sprite.rotation.x=-pitch;
  sprite.position.set(0,size*.3*Math.cos(pitch)+layer*.002*tilt,-size*.3*tilt+layer*.002*Math.cos(pitch));
  sprite.renderOrder=layer*.001;
  return sprite;
}
export async function deskDevice(t,kind,tier=0){
  const {size,height,footprintRadius,strips,fx,layers}=deviceSizes[kind];
  const root=new Group();root.name='desk2d/device-'+kind;root.userData.displayHeight=height;
  root.userData.footprintRadius=footprintRadius;
  root.userData.deviceScreenFx=fx;
  if(kind==='bill'){
    const entries=await Promise.all(Object.entries(billLayers).map(async ([name,file])=>[name,await deskTexture(t,file)]));
    if(t.disposed)return null;
    const textures=Object.fromEntries(entries),frame=deviceSizes.bill.frame;
    const sprite=deskSprite(t,kind,strips,size,textures.base);
    sprite.scale.x*=frame.width/frame.height;
    root.userData.updateGaze=installBillGaze(sprite,textures,frame);
    root.add(sprite);return root;
  }
  if(kind==='berry'){
    const textures={};
    await Promise.all(Object.entries(berryLayers).map(async ([name,file])=>{
      textures[name]=await deskTexture(t,file);
    }));
    if(t.disposed)return null;
    const sprite=deskSprite(t,kind,strips,size,textures.base);
    const pickup=deviceSizes.berry.pickup;
    sprite.userData.pickupGeometry=deskGeometry(t,'berry-pickup',pickup.strips,pickup.resolution);
    root.userData.setVisualState=applyBerryLayers(sprite.material,textures,t.shared.uTime);
    root.add(sprite);return root;
  }
  if(kind!=='altar'){
    const map=await deskTexture(t,'device-'+kind+'.png');
    if(t.disposed)return null;
    root.add(deskSprite(t,kind,strips,size,map));
    return root;
  }
  const textures=await Promise.all(Object.values(altarLayers).map(file=>deskTexture(t,file)));
  if(t.disposed)return null;
  const sprites={};
  for(const [i,name] of Object.keys(altarLayers).entries()){
    const layer=name==='base'?0:name==='tint'?2:1;
    const mesh=deskSprite(t,altarLayers[name],layers[name],size,textures[i],layer);
    sprites[name]=mesh;root.add(mesh);
  }
  const palette=altarPalette[tier];
  const tint=sprites.tint.material, applyInk={value:false};
  tint.depthWrite=false;
  tint.alphaTest=.001;
  tint.onBeforeCompile=shader=>{
    shader.uniforms.applyInk=applyInk;
    shader.uniforms.inkDark={value:new Color(palette.dark)};
    shader.uniforms.inkLight={value:new Color(palette.light)};
    shader.fragmentShader='uniform bool applyInk; uniform vec3 inkDark, inkLight;\n'+shader.fragmentShader.replace(
      '#include <map_fragment>',
      'vec4 gray=texture2D(map,vMapUv); float shade=clamp((gray.r-.533)/(.730-.533),0.,1.); diffuseColor*=vec4(applyInk ? mix(inkDark,inkLight,shade) : gray.rgb,gray.a);'
    );
  };
  const breathPeriod=1.5;
  const breathOpacity=root.userData.breathOpacity={value:0};
  let breathTime=0;
  root.userData.setVisualState=(state,dt=0)=>{
    const active=state==='charging';
    sprites.idle.visible=!active;sprites.active.visible=active;
    applyInk.value=active;
    breathTime=active ? (breathTime+dt)%breathPeriod : 0;
    breathOpacity.value=active ? (1-Math.cos(2*Math.PI*breathTime/breathPeriod))*.5 : 0;
    tint.opacity=active ? breathOpacity.value : 1;
    sprites.tint.visible=state!=='used' && tint.opacity>0;
  };
  root.userData.setVisualState('idle');
  return root;
}
