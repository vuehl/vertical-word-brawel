import {dt as Texture, y as BufferGeometry, v as BufferAttribute} from '../../vendor/three-DmSYIDKK.js';
import {unpackMeshBytes} from './mesh-bytes.js';

const directory='assets/vfx/dragon-summon-hd/';
async function read(file, type) {
  const response=await fetch(directory+file);
  if (!response.ok) throw Error('无法读取召唤特效 '+file);
  return response[type]();
}
function loadTexture(file) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    const finish=error=>{
      clearTimeout(timer);image.onload=image.onerror=null;
      if(error){reject(error);return;}
      const texture=new Texture(image);
      texture.generateMipmaps=false;texture.minFilter=texture.magFilter;
      texture.needsUpdate=true;resolve(texture);
    };
    const timer=setTimeout(()=>finish(Error('召唤贴图超时 '+file)),20000);
    image.onload=()=>finish();image.onerror=()=>finish(Error('召唤贴图加载失败 '+file));image.src=directory+file;
  });
}
function buildGeometry(bytes,layer){
  const xy=new Float32Array(bytes,layer.positionByteOffset,layer.vertexCount*2);
  const triangles=new Uint16Array(bytes,layer.indexByteOffset,layer.indexCount);
  const boundary=new Map(), n=layer.vertexCount;
  function edge(a,b){
    const key=Math.min(a,b)*n+Math.max(a,b);
    if(boundary.has(key))boundary.delete(key);else boundary.set(key,[a,b]);
  }
  for(let i=0;i<triangles.length;i+=3){
    let a=triangles[i],b=triangles[i+1],c=triangles[i+2];
    if((xy[b*2]-xy[a*2])*(xy[c*2+1]-xy[a*2+1]) < (xy[b*2+1]-xy[a*2+1])*(xy[c*2]-xy[a*2]))[b,c]=[c,b];
    edge(a,b);edge(b,c);edge(c,a);
  }
  const normals=new Map();
  for(const [a,b] of boundary.values()){
    const dx=xy[b*2]-xy[a*2],dy=xy[b*2+1]-xy[a*2+1],length=Math.hypot(dx,dy);
    if(!length)continue;
    for(const id of [a,b]){
      const normal=normals.get(id)||[0,0];
      normal[0]+=dy/length;normal[1]-=dx/length;normals.set(id,normal);
    }
  }
  const vertices=n+normals.size,positions=new Float32Array(vertices*2),offset=new Float32Array(vertices*2),
        coverage=new Float32Array(vertices),indices=Array.from(triangles),outer=new Map();
  positions.set(xy);coverage.fill(1,0,n);let next=n;
  for(const [id,[x,y]] of normals){
    const divisor=Math.max(.001,Math.hypot(x,y)),nx=x/divisor,ny=y/divisor;
    positions[next*2]=xy[id*2];positions[next*2+1]=xy[id*2+1];
    offset[id*2]=-.45*nx;offset[id*2+1]=-.45*ny;
    offset[next*2]=.55*nx;offset[next*2+1]=.55*ny;
    outer.set(id,next++);
  }
  for(const [a,b] of boundary.values()){
    if(outer.has(a)&&outer.has(b))indices.push(a,b,outer.get(b),a,outer.get(b),outer.get(a));
  }
  const geometry=new BufferGeometry();
  const xyz=new Float32Array(vertices*3);
  for(let i=0;i<vertices;i++){xyz[i*3]=positions[i*2];xyz[i*3+1]=positions[i*2+1];}
  geometry.setAttribute('position',new BufferAttribute(xyz,3));
  geometry.setAttribute('edgeOffset',new BufferAttribute(offset,2));
  geometry.setAttribute('inkCoverage',new BufferAttribute(coverage,1));
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices),1));
  return geometry;
}

export class DragonSummonResources {
  textures=new Map();
  geometry=[];
  ready=false;
  disposed=false;

  constructor(renderer,prepareEffects){
    this.renderer=renderer;
    this.prepareEffects=prepareEffects;
  }
  prepare(){
    if(this.ready)return Promise.resolve(true);
    if(!this.loading)this.loading=this.load().catch(error=>{
      if(!this.disposed)console.warn('万字归一高清资源不可用，使用原演出。',error);
      this.release();return false;
    }).finally(()=>{this.loading=null;});
    return this.loading;
  }
  async load(){
    const m=await read('manifest.json','json');if(this.disposed)return false;
    this.meta=m;
    const packed=await read(m.arc.mesh,'arrayBuffer');
    if(this.disposed)return false;
    const bytes=unpackMeshBytes(new Uint8Array(packed)).buffer;
    let slice=performance.now();
    for(const frame of m.arc.frames){
      this.geometry.push(frame.layers.map(layer=>buildGeometry(bytes,layer)));
      if(performance.now()-slice>=3){
        await new Promise(resolve=>setTimeout(resolve,16));
        if(this.disposed)return false;
        slice=performance.now();
      }
    }
    const files=[...new Set([...m.arc.pages,...m.orb.pages,...m.burst.pages,m.orb.background.file,m.boss.file])];
    // Take ownership only after all in-flight workers finish. On failure, every
    // successfully decoded sibling still goes through the same disposal path.
    let cursor=0,failure;
    const worker=async()=>{
      while(cursor<files.length&&!failure&&!this.disposed){
        const file=files[cursor++];if(this.textures.has(file))continue;
        try{
          const t=await loadTexture(file);
          if(this.disposed)t.dispose();else this.textures.set(file,t);
        }catch(error){failure=error;}
      }
    };
    await Promise.all([worker(),worker()]);
    if(failure)throw failure;
    if(this.disposed)return false;
    // Upload one atlas at a time during the minute before the summon.
    for(const [file,texture] of this.textures){
      if(file===m.boss.file)texture.colorSpace='srgb';
      this.renderer.initTexture(texture);
      await new Promise(resolve=>setTimeout(resolve,16));
      if(this.disposed)return false;
    }
    await this.prepareEffects(this);
    if(this.disposed)return false;
    this.ready=true;return true;
  }
  page(meta,frame){
    const cell=meta.frames[frame];return {texture:this.textures.get(meta.pages[cell.page]),tile:cell.tile};
  }
  release(keepBoss=false){
    for(const [file,t] of this.textures){
      if(keepBoss&&file===this.meta?.boss.file)continue;
      t.dispose();this.textures.delete(file);
    }
    for(const frame of this.geometry)for(const g of frame)g.dispose();
    this.geometry=[];this.ready=false;
  }
  dispose(){this.disposed=true;this.release();}
}


