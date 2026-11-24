import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export async function reviewAltarRing({page,tap,dir,sleep}){
 await tap('[data-action="journey"]');await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
 await page.waitForFunction(()=>app.run?.time>1&&app.run.state==='play',{timeout:90000});
 const result=await page.evaluate(()=>{
  const r=app.run;r.godMode=true;r.state='paused';r.enemies.clear();r.vfx.clear();
  const altar=r.interactables.list.find(a=>a.kind==='altar'&&(a.data?.tier??0)===0);if(!altar)throw Error('Blue altar missing');
  r.player.pos.set(altar.x-2,altar.y,altar.z+2);r.camTarget.copy(r.player.pos);r.updateCamera?.(1);
  const c=r.r.camera,d=42,p=Math.PI*.30;c.position.set(altar.x,altar.y+Math.sin(p)*d,altar.z+Math.cos(p)*d);c.lookAt(altar.x,altar.y,altar.z);
  const calls=[],pool=r.vfx.ground,spawn=pool.spawn;pool.spawn=function(o){calls.push({...o});return spawn.call(this,o);};
  r.altarRing(altar.x,altar.y,altar.z,altar.r,.14);pool.spawn=spawn;
  pool.update(.025);r.renderWorld(0);r.r.render(0);
  return {radius:altar.r,calls,shader:pool.mesh.material.fragmentShader,glError:r.r.renderer.getContext().getError()};
 });
 assert.equal(result.calls[0].size,result.radius*2);assert.equal(result.calls[0].endSize,result.radius*2);assert.equal(result.calls[0].color,5959935);assert.equal(result.calls[0].shape,3);assert.equal(result.calls[0].glow,-1);assert.equal(result.calls[1].size,result.radius*2*.14);assert.equal(result.glError,0);assert.match(result.shader,/24.0\/64.0/);
 await sleep(100);await page.screenshot({path:path.join(dir,'blue-altar-glow.png')});delete result.shader;fs.writeFileSync(path.join(dir,'altar-ring-report.json'),JSON.stringify(result,null,2));console.log('Altar ring geometry, color, charge fill and WebGL passed',result);
}
