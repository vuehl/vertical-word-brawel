import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Compare the actual GPU output with the same visible world split back into
// geometry/color batches. This catches missing colors, wrong color space and
// reordered culling data without depending on a random combat screenshot.
export async function reviewPaperBatching(page,dir){
  const report=await page.evaluate(()=>{
    const run=app.run,r=app.r,renderer=r.renderer,scene=r.scene,terrain=run.terrain;
    const cameraPosition=run.player.pos.clone(),cameraTarget=run.camTarget.clone();
    const visibility=scene.children.map(child=>[child,child.visible]);
    const autoClear=renderer.autoClear,autoReset=renderer.info.autoReset;
    const samples=[];
    try{
      renderer.autoClear=true;renderer.info.autoReset=false;
      for(const [child] of visibility)if(child!==terrain.group&&!child.isLight)child.visible=false;
      for(const [x,z] of [[0,0],[52,-45],[-46,40],[0,0]]){
        run.player.pos.set(x,0,z);run.camTarget.copy(run.player.pos);run.updateCamera(1);
        run.renderWorld(0);scene.updateMatrixWorld(true);
        // renderWorld can reveal player/particle meshes again.
        for(const [child] of visibility)if(child!==terrain.group&&!child.isLight)child.visible=false;
        const reference=new terrain.group.constructor(),temporary=[];
        let instances=0,coloredInstances=0;
        for(const mesh of terrain.group.children){
          if(!mesh.visible||!mesh.count)continue;
          instances+=mesh.count;
          const groups=new Map();
          for(let i=0;i<mesh.count;i++){
            const rgb=mesh.instanceColor?.array.slice(i*3,i*3+3),key=rgb?Array.from(rgb).join(','):'texture';
            if(rgb)coloredInstances++;
            if(!groups.has(key))groups.set(key,{rgb,ids:[]});groups.get(key).ids.push(i);
          }
          for(const {rgb,ids} of groups.values()){
            const mat=rgb?mesh.material.clone():mesh.material;
            if(rgb){mat.color.setRGB(...rgb);temporary.push(mat);}
            const copy=new mesh.constructor(mesh.geometry,mat,ids.length),matrix=mesh.matrix.clone();
            ids.forEach((index,i)=>{matrix.fromArray(mesh.instanceMatrix.array,index*16);copy.setMatrixAt(i,matrix);});
            // Transparent texture batches sort using their authored bounds,
            // including off-screen instances. Preserve that reference point.
            copy.boundingSphere=mesh.boundingSphere?.clone()||null;
            copy.renderOrder=mesh.renderOrder;copy.frustumCulled=false;reference.add(copy);
          }
        }
        const draw=()=>{
          renderer.setRenderTarget(null);renderer.info.reset();renderer.render(scene,r.camera);
          const gl=renderer.getContext(),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
          gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          return {pixels,image:renderer.domElement.toDataURL(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
        };
        let merged,split;
        try{
          terrain.group.visible=true;merged=draw();
          terrain.group.visible=false;scene.add(reference);split=draw();
        }finally{
          scene.remove(reference);for(const mesh of reference.children)mesh.dispose();
          for(const mat of temporary)mat.dispose();terrain.group.visible=true;
        }
        let different=0,maxDelta=0,totalDelta=0;
        for(let i=0;i<merged.pixels.length;i++){
          const delta=Math.abs(merged.pixels[i]-split.pixels[i]);
          maxDelta=Math.max(maxDelta,delta);totalDelta+=delta;if(delta>1)different++;
        }
        samples.push({x,z,instances,coloredInstances,mergedCalls:merged.calls,splitCalls:split.calls,
          mergedTriangles:merged.triangles,splitTriangles:split.triangles,maxDelta,
          differentChannels:different,meanDelta:totalDelta/merged.pixels.length,mergedImage:merged.image,splitImage:split.image});
      }
      return {samples,batches:terrain.group.children.length,materials:terrain.mats.length};
    }finally{
      for(const [child,visible] of visibility)child.visible=visible;
      renderer.autoClear=autoClear;renderer.info.autoReset=autoReset;
      run.player.pos.copy(cameraPosition);run.camTarget.copy(cameraTarget);run.updateCamera(1);run.renderWorld(0);r.render(0);
      inspected.env.invalidateUI();inspected.env.drawUI(renderer);
    }
  });
  for(const [i,sample] of report.samples.entries()){
    for(const type of ['merged','split']){
      const key=type+'Image';fs.writeFileSync(path.join(dir,'batching-'+i+'-'+type+'.png'),Buffer.from(sample[key].split(',')[1],'base64'));delete sample[key];
    }
  }
  fs.writeFileSync(path.join(dir,'paper-batching.json'),JSON.stringify(report,null,2));
  for(const sample of report.samples){
    assert.ok(sample.coloredInstances>0,'The comparison must include colored stationery');
    assert.ok(sample.mergedCalls<sample.splitCalls,'Instance colors must reduce draws');
    assert.equal(sample.mergedTriangles,sample.splitTriangles,'All visible stationery must remain');
    assert.ok(sample.meanDelta<.1&&sample.differentChannels<100,'Batching changed the image: '+JSON.stringify(sample));
  }
  assert.equal(report.samples[0].instances,report.samples.at(-1).instances,'Returning to the same camera must restore its instances');
  return report;
}
