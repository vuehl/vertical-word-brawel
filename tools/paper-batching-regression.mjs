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
        const reference=new terrain.group.constructor(),originals=[];
        let instances=0,coloredInstances=0;
        for(const mesh of terrain.group.children){
          if(!mesh.visible||!mesh.count)continue;
          instances+=mesh.count;
          if(!mesh.instanceColor)continue;
          coloredInstances+=mesh.count;
          originals.push(mesh);
          // Shader halos read instanceColor directly; keep the authored shader,
          // light rig and shadow receivers in both versions of the scene.
          const matrix=mesh.matrix.clone(),color=r.sun.color.clone();
          let first=0;
          while(first<mesh.count){
            mesh.getColorAt(first,color);
            const arr=mesh.instanceColor.array;
            let end=first+1;
            while(end<mesh.count&&arr[end*3]===color.r&&arr[end*3+1]===color.g&&arr[end*3+2]===color.b)end++;
            const copy=new mesh.constructor(mesh.geometry,mesh.material,end-first);
            for(let i=first;i<end;i++){
              mesh.getMatrixAt(i,matrix);copy.setMatrixAt(i-first,matrix);copy.setColorAt(i-first,color);
            }
            copy.matrix.copy(mesh.matrix);copy.matrixAutoUpdate=false;
            copy.castShadow=mesh.castShadow;copy.receiveShadow=mesh.receiveShadow;
            copy.boundingSphere=mesh.boundingSphere?.clone()||null;
            copy.renderOrder=mesh.renderOrder;copy.frustumCulled=mesh.frustumCulled;
            reference.add(copy);first=end;
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
          // Resolve a pending shadow-map update before counting either color pass.
          terrain.group.visible=true;renderer.render(scene,r.camera);merged=draw();
          for(const mesh of originals)mesh.visible=false;terrain.group.add(reference);split=draw();
        }finally{
          terrain.group.remove(reference);for(const mesh of reference.children)mesh.dispose();
          for(const mesh of originals)mesh.visible=true;
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
    assert.ok(sample.mergedCalls<=sample.splitCalls,'Batching cannot add draws');
    assert.equal(sample.mergedTriangles,sample.splitTriangles,'All visible stationery must remain');
    assert.ok(sample.meanDelta<.1&&sample.differentChannels<100,'Batching changed the image: '+JSON.stringify(sample));
  }
  assert.ok(report.samples.some(s=>s.coloredInstances>1&&s.mergedCalls<s.splitCalls),'The comparison must demonstrate a draw saving for colored instances');
  assert.equal(report.samples[0].instances,report.samples.at(-1).instances,'Returning to the same camera must restore its instances');
  return report;
}
