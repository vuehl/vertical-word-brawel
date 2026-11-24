import assert from 'node:assert/strict';
import {illustratedFacilityFiles,facilityNames} from '../source/src/active-content.js';

export async function reviewFacilityGreyRings(page){
  for(const stage of [1,2]){
    const result=await page.evaluate(async({stage,art,kinds})=>{
      const r=app.run;
      if(stage!==r.stage){r.state='play';await r.changeZone();}
      app.halted=true;r.state='play';
      const f=r.interactables;
      // Exercise the depth-outline preset as well as the low-cost phone path.
      r.r.outlinePass.enabled=true;
      for(const kind of kinds){
        const a=f.list.find(x=>x.kind===kind&&!x.used)??f.add(kind,r.player.pos.x,r.player.pos.z);
        await a.modelReady;f.render(0);
        if(!f.hasVisual(a)||a.halo||a.chargeRing?.visible||a.group.getObjectByName('facility-dwell-ring'))
          throw Error('Idle ground effect: '+kind);
        if(art[kind]){
          const cache=r.terrain.desk2d?r.terrain:f.spriteArt;
          const texture=await cache.deskTextures.get('device-'+art[kind]+'.png');
          if(!texture||a.model.children[0].material.map!==texture)throw Error('Wrong art: '+kind);
        }
        if(kind==='altar'){
          a.charging=true;a.charge=.5;f.render(0);
          if(!a.chargeRing.visible)throw Error('Missing active altar ring');
          a.charging=false;f.render(0);
        }
      }
      r.r.render(0);
      if(r.r.composer.passes.some(p=>['Device screen effects','Visible devices'].includes(p.name)))throw Error('Common sweep still installed');
      return {stage,kinds:kinds.length,gl:r.r.renderer.getContext().getError()};
    },{stage,art:illustratedFacilityFiles,kinds:Object.keys(facilityNames)});
    assert.equal(result.gl,0);console.log('Idle facility art verified',result);
  }
}
