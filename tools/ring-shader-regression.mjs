import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ringEmptyPixels} from '../source/src/ring-shader.js';

export async function reviewRingShader(page,dir){
  const report=await page.evaluate(snippet=>{
    const run=app.run,r=app.r,renderer=r.renderer,rings=run.vfx.rings,material=rings.mesh.material;
    const optimized=material.fragmentShader;
    if(!optimized.includes(snippet))throw Error('Compiled ring optimization missing');
    const reference=optimized.replace(snippet,''),camera=r.camera.clone(),saved=[];
    r.scene.traverse(o=>{if(o.isMesh){saved.push([o,o.visible]);o.visible=false;}});
    renderer.setPixelRatio(1);renderer.setSize(256,256,false);renderer.setRenderTarget(null);
    camera.aspect=1;camera.up.set(0,0,-1);camera.near=.01;camera.far=5000;
    const pixels=()=>{const gl=renderer.getContext(),data=new Uint8Array(256*256*4);gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
    const cases=[];
    try{
      for(const [radius,thickness] of [[.1,.5],[2,.4],[12,.3],[30,.05]])for(let style=0;style<7;style++){
        const p=run.player.pos;camera.position.set(p.x,Math.max(1,(radius+4*thickness)*3),p.z);camera.lookAt(p.x,0,p.z);camera.updateProjectionMatrix();
        rings.clear();rings.spawn(p.x,.1,p.z,radius,radius,0xff8844,1,style,thickness,1,true);rings.update(0);
        material.fragmentShader=reference;material.needsUpdate=true;renderer.render(r.scene,camera);const before=pixels();
        material.fragmentShader=optimized;material.needsUpdate=true;renderer.render(r.scene,camera);const after=pixels();
        let changed=0;for(let i=0;i<after.length;i++)if(before[i]!==after[i])changed++;
        cases.push({radius,thickness,style,changed});
      }
      return {cases,changed:cases.reduce((n,c)=>n+c.changed,0)};
    }finally{material.fragmentShader=optimized;material.needsUpdate=true;rings.clear();for(const [o,v] of saved)o.visible=v;}
  },ringEmptyPixels);
  fs.writeFileSync(path.join(dir,'ring-shader.json'),JSON.stringify(report,null,2));
  assert.equal(report.changed,0,'Ring/telegraph GPU output must match the original shader');
  console.log('Ring shader: all '+report.cases.length+' GPU pixel comparisons identical.');
}
