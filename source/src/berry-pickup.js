import {g as Box3,F as Frustum,G as Matrix4,ht as Vector3} from '../assets/three-DmSYIDKK.js';

const marginPx=5, kickPx=11, kickSeconds=.13, returnSeconds=.30;
const chunks=new WeakMap();
const vertex=new Vector3(),a=new Vector3(),b=new Vector3(),c=new Vector3();
const query=new Matrix4(),localQuery=new Matrix4(),frustum=new Frustum();

// Group nearby faces once per shared geometry. This also covers the original
// solid candy mesh in later zones, with its current camera angle.
function faceChunks(geometry){
  if(chunks.has(geometry))return chunks.get(geometry);
  const positions=geometry.attributes.position,indices=geometry.index;
  const count=indices?.count??positions.count,blocks=[];
  for(let start=0;start<count;start+=192){
    const end=Math.min(start+192,count),box=new Box3();
    for(let i=start;i<end;i++)box.expandByPoint(vertex.fromBufferAttribute(positions,indices?indices.getX(i):i));
    blocks.push({start,end,box});
  }
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  chunks.set(geometry,blocks);return blocks;
}

function edgeDistanceSq(p,q){
  const dx=q.x-p.x,dy=q.y-p.y,len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,-(p.x*dx+p.y*dy)/len)):0;
  return (p.x+t*dx)**2+(p.y+t*dy)**2;
}

function touchesTriangle(a,b,c){
  const ab=a.x*b.y-a.y*b.x,bc=b.x*c.y-b.y*c.x,ca=c.x*a.y-c.y*a.x;
  if(ab+bc+ca!==0&&((ab>=0&&bc>=0&&ca>=0)||(ab<=0&&bc<=0&&ca<=0)))return true;
  return edgeDistanceSq(a,b)<=1||edgeDistanceSq(b,c)<=1||edgeDistanceSq(c,a)<=1;
}

export function createBerryPickup(model,graphics){
  const meshes=[];
  model.updateWorldMatrix(true,true);
  const bounds=new Box3();
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.userData.pickupGeometry??mesh.geometry;
    meshes.push({mesh,geometry,blocks:faceChunks(geometry)});
    bounds.union(geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });
  const home=model.position.clone(),scale=model.scale.clone(),parent=model.parent;
  // Animate around the painted candy, including its off-centre transparent padding.
  const center=bounds.getCenter(new Vector3());
  parent.worldToLocal(center);
  const offset=center.clone().sub(home),kicked=new Vector3(),target=new Vector3(),pos=new Vector3();
  let elapsed=0;
  function inReach(player){
    const {canvas,camera}=graphics;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return false;
    camera.updateMatrixWorld();
    pos.copy(player.pos).project(camera);
    if(Math.abs(pos.x)>1||Math.abs(pos.y)>1||Math.abs(pos.z)>1)return false;
    // In this projection a circle of radius one is exactly five display pixels.
    const diameter=2*(marginPx+1e-7); // Keep the exact boundary inclusive after projection.
    const sx=w/diameter,sy=h/diameter;
    query.set(sx,0,0,-pos.x*sx,0,sy,0,-pos.y*sy,0,0,1,0,0,0,0,1)
      .multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
    for(const {mesh,geometry:geo,blocks} of meshes){
      mesh.updateWorldMatrix(true,false);
      localQuery.multiplyMatrices(query,mesh.matrixWorld);
      frustum.setFromProjectionMatrix(localQuery);
      if(!frustum.intersectsBox(geo.boundingBox))continue;
      const positions=geo.attributes.position,index=geo.index;
      for(const {start,end,box} of blocks){
        if(!frustum.intersectsBox(box))continue;
        for(let i=start;i<end;i+=3){
          a.fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(localQuery);
          b.fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(localQuery);
          c.fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(localQuery);
          if(touchesTriangle(a,b,c))return true;
        }
      }
    }
    return false;
  }
  function bodyPosition(player){
    return target.setFromMatrixColumn(graphics.camera.matrixWorld,1)
      .multiplyScalar(player.radius*1.8).add(player.pos);
  }
  function begin(player){
    elapsed=0;
    const {camera,canvas}=graphics;
    const world=parent.localToWorld(pos.copy(center));
    const depth=a.copy(world).applyMatrix4(camera.matrixWorldInverse).z;
    const m=camera.projectionMatrix.elements;
    const step=kickPx*2*(m[11]*depth+m[15])/(m[5]*canvas.clientHeight);
    a.subVectors(world,bodyPosition(player));
    b.setFromMatrixColumn(camera.matrixWorld,2);a.addScaledVector(b,-a.dot(b));
    if(a.lengthSq()<1e-8)a.setFromMatrixColumn(camera.matrixWorld,0);
    parent.worldToLocal(kicked.copy(world).addScaledVector(a.normalize(),step));
  }
  function advance(dt,player){
    elapsed+=dt;
    const u=Math.min(1,Math.max(0,(elapsed-kickSeconds)/returnSeconds));
    const pull=u*u,shrink=1-pull;
    if(elapsed<kickSeconds)pos.lerpVectors(center,kicked,1-(1-elapsed/kickSeconds)**2);
    else pos.lerpVectors(kicked,parent.worldToLocal(bodyPosition(player)),pull);
    model.scale.copy(scale).multiplyScalar(shrink);
    model.position.copy(pos).addScaledVector(offset,-shrink);
    if(u<1)return false;
    model.visible=false;return true;
  }
  function reset(){model.position.copy(home);model.scale.copy(scale);model.visible=true;}
  return {inReach,begin,advance,reset};
}
