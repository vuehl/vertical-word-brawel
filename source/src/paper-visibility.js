// Keep shared material batches, but submit only instances in the camera view.
// Authored matrices stay immutable so moving never loses distant scenery.
export function preparePaperBatch(mesh,shadow=false,tightBounds=false){
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
  const sphere=mesh.geometry.boundingSphere,total=mesh.count;
  const matrices=mesh.instanceMatrix.array.slice(),bounds=new Float32Array(total*4);
  const halfExtents=tightBounds?new Float32Array(total*3):null;
  if(tightBounds&&!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  const box=mesh.geometry.boundingBox;
  for(let i=0;i<total;i++){
    const o=i*16,b=i*4,x=sphere.center.x,y=sphere.center.y,z=sphere.center.z;
    bounds[b]=matrices[o]*x+matrices[o+4]*y+matrices[o+8]*z+matrices[o+12];
    bounds[b+1]=matrices[o+1]*x+matrices[o+5]*y+matrices[o+9]*z+matrices[o+13];
    bounds[b+2]=matrices[o+2]*x+matrices[o+6]*y+matrices[o+10]*z+matrices[o+14];
    bounds[b+3]=sphere.radius*Math.max(Math.hypot(matrices[o],matrices[o+1],matrices[o+2]),Math.hypot(matrices[o+4],matrices[o+5],matrices[o+6]),Math.hypot(matrices[o+8],matrices[o+9],matrices[o+10]));
    if(halfExtents){
      // Three's bounding sphere and box share their centre. A long, thin
      // piece of stationery can have a sphere much larger than its silhouette.
      for(let axis=0;axis<3;axis++){
        halfExtents[i*3+axis]=.5*(Math.abs(matrices[o+axis])*(box.max.x-box.min.x)
          +Math.abs(matrices[o+4+axis])*(box.max.y-box.min.y)+Math.abs(matrices[o+8+axis])*(box.max.z-box.min.z));
      }
    }
  }
  const colors=mesh.instanceColor?.array.slice();
  mesh.userData.paperInstances={total,matrices,colors,bounds,halfExtents,selected:new Int32Array(total).fill(-1),shadow};
  mesh.instanceMatrix.setUsage(35048);
  if(colors)mesh.instanceColor.setUsage(35048);
}
export function updatePaperVisibility(terrain,frustum,shadows=true){
  if(!terrain?.zxPaper||terrain.group.visible===false)return;
  const meshes=terrain.group.children,planes=frustum.planes;
  let view=terrain.zxVisibilityView;
  if(!view||view.planes.length!==planes.length*4)view=terrain.zxVisibilityView={planes:new Float64Array(planes.length*4)};
  let same=view.meshes===meshes&&view.count===meshes.length&&view.shadows===shadows;
  // Both rejection tests below keep a two-unit guard band. In the bounded
  // desktop scene, a small camera translation stays inside that band.
  // Compare against the last full selection so successive steps accumulate.
  const tolerance=terrain.workshopBoundary?1:0;
  for(let i=0;same&&i<planes.length;i++){
    const p=planes[i],n=p.normal,j=i*4;
    if(Math.abs(view.planes[j]-n.x)>1e-12||Math.abs(view.planes[j+1]-n.y)>1e-12||
      Math.abs(view.planes[j+2]-n.z)>1e-12||Math.abs(view.planes[j+3]-p.constant)>tolerance)same=false;
  }
  if(same)return false;
  for(let i=0;i<planes.length;i++){
    const p=planes[i],n=p.normal,j=i*4;
    view.planes[j]=n.x;view.planes[j+1]=n.y;view.planes[j+2]=n.z;view.planes[j+3]=p.constant;
  }
  view.meshes=meshes;view.count=meshes.length;view.shadows=shadows;
  let castersChanged=false;
  for(const mesh of meshes){
    const data=mesh.userData.paperInstances;if(!data)continue;
    const {total,matrices,colors,bounds,halfExtents,selected}=data;
    if(data.shadow&&!shadows){mesh.visible=false;continue;}
    let count=0,changed=false;
    instance:for(let i=0;i<total;i++){
      // Retain offscreen casters whose sun projection can reach the view.
      // This also keeps the cached shadow map valid at the camera boundary.
      const b=i*4,radius=bounds[b+3]+2+(mesh.castShadow?Math.max(0,bounds[b+1]+bounds[b+3])*.75:0);
      for(const p of planes){
        const n=p.normal,distance=n.x*bounds[b]+n.y*bounds[b+1]+n.z*bounds[b+2]+p.constant;
        if(distance < -radius)continue instance;
        if(halfExtents&&distance < -(Math.abs(n.x)*halfExtents[i*3]+Math.abs(n.y)*halfExtents[i*3+1]+Math.abs(n.z)*halfExtents[i*3+2]+2))continue instance;
      }
      if(selected[count]!==i){
        selected[count]=i;changed=true;
        for(let k=0;k<16;k++)mesh.instanceMatrix.array[count*16+k]=matrices[i*16+k];
        if(colors)for(let k=0;k<3;k++)mesh.instanceColor.array[count*3+k]=colors[i*3+k];
      }
      count++;
    }
    if(mesh.castShadow&&(changed||count!==mesh.count||mesh.visible!==(count>0)))castersChanged=true;
    mesh.count=count;mesh.visible=count>0;
    if(changed&&count){
      mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,count*16);mesh.instanceMatrix.needsUpdate=true;
      if(colors){mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,count*3);mesh.instanceColor.needsUpdate=true;}
    }
  }
  if(castersChanged&&terrain.workshopShadowLight)terrain.workshopShadowLight.shadow.needsUpdate=true;
  return true;
}
