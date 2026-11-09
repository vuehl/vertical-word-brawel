// Keep shared material batches, but submit only instances in the camera view.
// Authored matrices stay immutable so moving never loses distant scenery.
export function preparePaperBatch(mesh,shadow=false){
  mesh.geometry.computeBoundingSphere();
  const sphere=mesh.geometry.boundingSphere,total=mesh.count;
  const matrices=mesh.instanceMatrix.array.slice(),bounds=new Float32Array(total*4);
  for(let i=0;i<total;i++){
    const o=i*16,b=i*4,x=sphere.center.x,y=sphere.center.y,z=sphere.center.z;
    bounds[b]=matrices[o]*x+matrices[o+4]*y+matrices[o+8]*z+matrices[o+12];
    bounds[b+1]=matrices[o+1]*x+matrices[o+5]*y+matrices[o+9]*z+matrices[o+13];
    bounds[b+2]=matrices[o+2]*x+matrices[o+6]*y+matrices[o+10]*z+matrices[o+14];
    bounds[b+3]=sphere.radius*Math.max(Math.hypot(matrices[o],matrices[o+1],matrices[o+2]),Math.hypot(matrices[o+4],matrices[o+5],matrices[o+6]),Math.hypot(matrices[o+8],matrices[o+9],matrices[o+10]));
  }
  mesh.userData.paperInstances={total,matrices,bounds,selected:new Int32Array(total).fill(-1),shadow};
  mesh.instanceMatrix.setUsage(35048);
}
export function updatePaperVisibility(terrain,frustum,shadows=true){
  if(!terrain?.zxPaper)return;
  for(const mesh of terrain.group.children){
    const data=mesh.userData.paperInstances;if(!data)continue;
    const {total,matrices,bounds,selected}=data;
    if(data.shadow&&!shadows){mesh.visible=false;continue;}
    let count=0,changed=false;
    instance:for(let i=0;i<total;i++){
      const b=i*4,radius=bounds[b+3]+2;
      for(const p of frustum.planes)if(p.normal.x*bounds[b]+p.normal.y*bounds[b+1]+p.normal.z*bounds[b+2]+p.constant < -radius)continue instance;
      if(selected[count]!==i){
        selected[count]=i;changed=true;
        for(let k=0;k<16;k++)mesh.instanceMatrix.array[count*16+k]=matrices[i*16+k];
      }
      count++;
    }
    mesh.count=count;mesh.visible=count>0;
    if(changed&&count){mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,count*16);mesh.instanceMatrix.needsUpdate=true;}
  }
}
