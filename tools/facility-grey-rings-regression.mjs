import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewFacilityGreyRings(page,dir){
  const results=[];
  for(const stage of [1,2]){
    if(stage===2)await page.evaluate(async()=>{await app.run.changeZone();app.halted=true;});
    for(const kind of ['bill','altar','berry']){
      const result=await page.evaluate(async kind=>{
        const r=app.run,f=r.interactables;r.state='play';r.enemies.clear();r.vfx.clear();
        const pos=r.player.pos.clone();
        const a=f.add(kind,pos.x,pos.z,{data:{tier:0}});await a.modelReady;
        f.nearest=null;f.dwellTime=0;r.renderWorld(0);f.render(0);
        const halo=a.halo;
        if(!halo?.visible||halo.parent!==a.group||halo.scale.x!==a.ringRadius)throw Error('Missing grey ring: '+kind);
        const c=r.r.camera;c.position.set(a.x,a.y+16,a.z+22);c.lookAt(a.x,a.y+1,a.z);c.updateMatrixWorld();
        f.render(0);
        let centreError=0;
        if(a.model.userData.ringAnchor){
          const centre=a.model.localToWorld(halo.position.clone().copy(a.model.userData.ringAnchor)).project(c);
          const ringCentre=a.group.localToWorld(halo.position.clone()).project(c);
          centreError=Math.hypot(centre.x-ringCentre.x,centre.y-ringCentre.y);
          if(centreError>1e-6)throw Error('Off-centre facility ring: '+kind+' '+centreError);
        }
        const renderer=r.r.renderer,gl=renderer.getContext();
        const priorError=gl.getError();
        const pixels=()=>{r.r.render(0);renderer.setRenderTarget(null);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
        const visible=pixels();halo.visible=false;const absent=pixels();halo.visible=true;
        let changed=0;
        for(let i=0;i<visible.length;i+=4)if(Math.abs(visible[i]-absent[i])+Math.abs(visible[i+1]-absent[i+1])+Math.abs(visible[i+2]-absent[i+2])>30)changed++;
        r.r.render(0);const frame=gl.canvas.toDataURL('image/png').split(',')[1];
        if(kind==='altar'){
          a.charging=true;a.charge=.5;f.render(0);
          if(halo.visible||!a.chargeRing.visible)throw Error('Overlapping altar rings');
          a.charging=false;f.render(0);
          if(!halo.visible||a.chargeRing.visible)throw Error('Grey altar ring did not return');
        }
        a.used=true;f.render(0);const hidden=!halo.visible;
        a.used=false;f.render(0);const restored=halo.visible;
        const error=gl.getError();f.remove(a);
        return {kind,changed,hidden,restored,centreError,priorError,error,frame};
      },kind);
      const {frame,...stats}=result;
      console.log('Grey ring sample',stage,stats);
      assert.ok(stats.changed>30,JSON.stringify(stats));assert.ok(stats.hidden&&stats.restored);assert.equal(stats.error,0);
      fs.writeFileSync(path.join(dir,`grey-ring-${stage}-${kind}.png`),Buffer.from(frame,'base64'));
      results.push({stage,...stats});
    }
  }
  fs.writeFileSync(path.join(dir,'grey-rings.json'),JSON.stringify(results,null,2));
  console.log('Grey facility rings verified on both stages',results);
}
