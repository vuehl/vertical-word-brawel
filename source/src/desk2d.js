import layout from './desk2d-layout.json';
import deviceSizes from './desk2d-devices.json';
import {y as BufferGeometry,v as Attribute,I as Group,et as PlaneGeometry,K as Mesh,q as BasicMaterial,dt as Texture,ot as SRGB} from '../assets/three-DmSYIDKK.js';
import {paperBox} from './paper-collision.js';

const pitch=Math.PI*.30, tilt=Math.sin(pitch);
const heightAt42=84*Math.tan(37*Math.PI/360);
// Registered reference crop: 1 source pixel covers 1.81 screenshot pixels.
const pixelsPerUnit=(2347/1.81)/heightAt42;
const xAt=px=>(px-layout.width/2)/pixelsPerUnit;
const zAt=py=>(py-layout.height/2)/(pixelsPerUnit*tilt);
const halfWidth=xAt(layout.width),halfDepth=zAt(layout.height);
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export const isDeskStage=t=>t.biome.zxStage===1&&!t.arena;
export function initDesk(t){
  t.desk2d=true;t.zxPaper=true;t.zxStage=1;t.group.name='desk-map-2d';
  t.hasWater=t.frozen=t.isLava=false;t.waterLevel=-99;t.minH=t.maxH=0;
  t.heights.fill(0);t.pathMask.fill(0);t.landmarks=[];t.zxProps=[];
  t.deskBounds={x:halfWidth,z:halfDepth};t.play=halfWidth;t.workshopGroundY=()=>0;
  t.spawn.set(xAt(1603),0,zAt(2218));
  t.inBounds=(x,z,n=0)=>Math.abs(x)<halfWidth-n&&Math.abs(z)<halfDepth-n;
  t.isFlatOpen=(x,z)=>t.inBounds(x,z,1)&&!t.hitProp(x,.3,z,1);
  t.deskOwned=[];t.deskTextures=new Map();
  for(const [kind,l,top,r,b] of layout.rects){
    const box=paperBox(xAt((l+r)/2),zAt((top+b)/2),(r-l)/pixelsPerUnit,(b-top)/(pixelsPerUnit*tilt),1000,0);
    box.kind=kind;t.addCollider(box);
  }
  // Exclude the space beyond the back edge of the tabletop.
  const rim=[[0,1140],[1160,570],[1480,383],[5142,1310]];
  for(let i=1;i<rim.length;i++){
    const [ax,ay]=rim[i-1],[bx,by]=rim[i];
    for(let x=ax;x<bx;x+=24){
      const right=Math.min(bx,x+24),y=ay+(by-ay)*((right+x)/2-ax)/(bx-ax);
      t.addCollider(paperBox(xAt((right+x)/2),zAt(y/2),(right-x)/pixelsPerUnit,y/(pixelsPerUnit*tilt),1000,0));
    }
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
    await Promise.all(Array.from({length:4},load));
  })();
}
export function deskTexture(t,file){
  if(!t.deskTextures.has(file))t.deskTextures.set(file,new Promise((resolve,reject)=>{
    const image=new Image();
    image.addEventListener('load',()=>{
      const map=new Texture(image);map.colorSpace=SRGB;map.needsUpdate=true;
      if(t.disposed)map.dispose();else t.deskOwned.push(map);resolve(map);
    });
    image.addEventListener('error',()=>reject(Error('无法读取桌面图片 '+file)));
    image.src='/assets/env/desk2d/'+file;
  }));
  return t.deskTextures.get(file);
}
export function deskCamera(run,dt){
  const c=run.r.camera,t=run.terrain,p=run.player.pos;
  const h=Math.min(heightAt42*Math.max(1,.46/c.aspect),halfDepth*2*tilt,halfWidth*2/c.aspect)/2;
  const w=h*c.aspect;
  run.camTarget.lerp(p,1-Math.exp(-12*Math.max(0,dt)));
  const x=clamp(run.camTarget.x+w*.148,-halfWidth+w,halfWidth-w);
  const z=clamp(run.camTarget.z+h*.05/tilt,-halfDepth+h/tilt,halfDepth-h/tilt);
  c.position.set(x,42*tilt,z+42*Math.cos(pitch));c.lookAt(x,0,z);
  c.projectionMatrix.makeOrthographic(-w,w,h,-h,c.near,c.far,c.coordinateSystem);
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  t.deskCamera=c;run.camYaw=0;run.camPitch=pitch;run.camDist=42;run.camLift=0;
}
export async function deskDevice(t,kind){
  const {size,height,strips,fx}=deviceSizes[kind];
  const texture=await deskTexture(t,'device-'+kind+'.png');
  if(t.disposed)return null;
  t.deskDeviceGeometries??=new Map();
  if(!t.deskDeviceGeometries.has(kind)){
    const points=[],uv=[];
    for(const [left,y,right] of strips){
      for(const [x,row] of [[left,y],[left,y+1],[right,y],[right,y],[left,y+1],[right,y+1]]){
        points.push(x/128-.5,.5-row/128,0);uv.push(x/128,1-row/128);
      }
    }
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new Attribute(new Float32Array(points),3));
    geometry.setAttribute('uv',new Attribute(new Float32Array(uv),2));
    t.deskDeviceGeometries.set(kind,geometry);t.deskOwned.push(geometry);
  }
  const material=new BasicMaterial({map:texture,transparent:true,alphaTest:.08,toneMapped:false,fog:false});
  t.deskOwned.push(material);
  const sprite=new Mesh(t.deskDeviceGeometries.get(kind),material);
  sprite.name='desk2d/device-'+kind;sprite.scale.setScalar(size);
  sprite.rotation.x=-pitch;
  sprite.position.set(0,size*.3*Math.cos(pitch),-size*.3*tilt);
  const root=new Group();root.name=sprite.name;root.userData.displayHeight=height;
  root.userData.deviceScreenFx=fx;root.add(sprite);return root;
}
