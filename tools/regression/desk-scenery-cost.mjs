import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewDeskSceneryCost(page,dir){
  const report=await page.evaluate(async()=>{
    const r=app.run,t=r.terrain,host=r.r,renderer=host.renderer,cam=host.camera;
    const gl=renderer.getContext(),pixel=new Uint8Array(4);
    const sync=()=>gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    const quantile=(items,q)=>items.slice().sort((a,b)=>a-b)[Math.floor((items.length-1)*q)];
    const sheets=t.group.children.filter(m=>m.isMesh&&m.name.startsWith('desk2d/'));
    const maps=new Set(sheets.map(m=>m.material.map));
    const decodedMiB=[...maps].reduce((n,tex)=>n+4*tex.image.width*tex.image.height,0)/1048576;
    const info=renderer.info;info.autoReset=false;
    const result={model:window.fixtureDeviceInfo?.model,platform:window.fixturePlatform,fpsCap:app.fpsCap(),
      sheets:sheets.length,decodedMiB,views:{},combat:[]};
    const pos=r.player.pos,{width,height}=window.deskArtSize;
    const shelfX=2210,shelfY=550;
    for(const [name,x,y] of [['spawn',1820,1320],['centre',2571,1902],['north',shelfX,shelfY],['cat',4910,900],['south',2571,3740]]){
      pos.set((x/width*2-1)*t.deskBounds.x,0,(y/height*2-1)*t.deskBounds.z);
      r.updateCamera(0);cam.updateMatrixWorld();t.group.updateMatrixWorld(true);
      const times=[];
      for(let i=0;i<50;i++){
        info.reset();const start=performance.now();
        renderer.render(t.group,cam);sync();
        if(i>=10)times.push(performance.now()-start);
      }
      result.views[name]={calls:info.render.calls,p50:quantile(times,.5),p95:quantile(times,.95)};
    }
    // Stand on reachable ground behind the keyboard, near the upper map
    // boundary where both the outer art and the shelf shadow are visible.
    const point={};
    if(!t.placeSpawn((2*shelfX/width-1)*t.deskBounds.x,(2*shelfY/height-1)*t.deskBounds.z,1,point))
      throw Error('Cannot reach the north edge of the desk');
    pos.set(point.x,0,point.z);r.updateCamera(0);r.player.iframes=1e6;r.nextEvo=null;
    result.combatOrigin=point;
    const dialogs=[];
    // Advance ordinary combat continuously at 30 Hz. Sample completed frames
    // once per half-second; never equate SwiftShader wall time with phone FPS.
    for(let bucket=0;bucket<5;bucket++){
      const update=[],draw=[],calls=[];
      const until=(bucket+1)*30;
      for(let frame=0;r.stageTime<until;frame++){
        if(frame>1100)throw Error('Encounter stalled: '+r.state+' '+r.ui.modalEl?.textContent);
        if(r.state==='modal'){
          const modal=r.ui.modalEl;
          const button=modal.querySelector('[data-offer], [data-item-action="take"], .paper-dismiss-button')??
            [...modal.querySelectorAll('button')].find(b=>/确认进阶|拾取|领取|关闭/.test(b.textContent));
          if(!button)throw Error('Unrecognised modal: '+modal.textContent);
          dialogs.push({at:r.stageTime,choice:button.textContent.slice(0,40)});
          button.click();
          await new Promise(resolve=>setTimeout(resolve,16));
          r.update(1/30);inspected.env.drawUI(renderer);continue;
        }
        const start=performance.now();r.update(1/30);update.push(performance.now()-start);
        if(frame%15===0){
          info.reset();const then=performance.now();host.render(1/30);inspected.env.drawUI(renderer);sync();
          draw.push(performance.now()-then);calls.push(info.render.calls);
        }
        if(frame%150===0)await new Promise(resolve=>setTimeout(resolve,0));
      }
      result.combat.push({seconds:r.stageTime,enemies:r.enemies.count,state:r.state,textures:info.memory.textures,
        geometry:info.memory.geometries,updateP95:quantile(update,.95),renderP50:quantile(draw,.5),renderP95:quantile(draw,.95),
        callsP50:quantile(calls,.5)});
    }
    result.dialogs=dialogs;info.autoReset=true;return result;
  });
  console.log('Desk performance',JSON.stringify(report));
  fs.writeFileSync(path.join(dir,'desk-scenery.json'),JSON.stringify(report,null,2));
  assert.ok(report.combat.at(-1).seconds>=149,'Encounter must progress through 150 simulated seconds');
  if(!process.argv.includes('--baseline')){
    assert.ok(report.decodedMiB<110,'Map colour textures exceed the desk budget');
    assert.ok(Object.values(report.views).every(v=>v.calls<=12),'Too many scenery draws in a phone viewport');
  }
}
