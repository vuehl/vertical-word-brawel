import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyCarriedMarble(page, dir) {
  const motion=await page.evaluate(()=>{
    const r=app.run;app.halted=true;r.godMode=true;
    const nest=r.interactables.list.find(f=>f.kind==='nest');
    r.player.pos.set(nest.x,nest.y,nest.z);r.interactables.update(1/30);
    if(!r.egg)throw Error('Marble was not picked up');
    const p=r.player, start=p.pos.clone(), samples=[];
    for(const fps of [30,60,120]) {
      p.pos.copy(start);p.motionView.reset(start.x,start.y,start.z);
      for(let frame=0;frame<fps*2;frame++) {
        const progress=Math.min(frame/fps,1);
        p.facing.set(Math.cos(frame),Math.sin(frame));
        p.pos.set(start.x+Math.floor(progress*30)*7/30,start.y,start.z);
        p.motionView.reset(p.pos.x-7/30,p.pos.y,p.pos.z);
        p.motionView.capture(p.pos);r.renderAlpha=progress===1?1:(frame*30/fps)%1;
        r.updateCamera(0);r.renderWorld(0);
        const shown=r.visiblePlayerPosition(),a=r.carriedMarble.A;
        samples.push({fps,offset:a[0]-shown.x,count:r.carriedMarble.mesh.count,size:a[3],rotation:r.carriedMarble.C[1]});
      }
    }
    r.renderAlpha=1;r.state='paused';r.renderWorld(0);
    const stopped={x:r.egg.x-p.pos.x,z:r.egg.z-p.pos.z,count:r.carriedMarble.mesh.count};
    p.pos.set(start.x+20,start.y+2,start.z-10);r.renderWorld(0);
    const teleported=Math.abs(r.egg.x-p.pos.x-3)<1e-9;
    p.pos.copy(start);r.state='play';p.motionView.reset(start.x,start.y,start.z);r.updateCamera(0);r.renderWorld(0);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return {samples,stopped,teleported,groundRemoved:!nest.group.parent};
  });
  assert.ok(motion.groundRemoved&&motion.teleported);
  assert.ok(Math.abs(motion.stopped.x-3)<1e-9&&Math.abs(motion.stopped.z+1.2)<1e-9&&motion.stopped.count===1);
  assert.ok(motion.samples.every(s=>Math.abs(s.offset-3)<.0001&&s.count===1&&s.rotation===0));
  assert.equal(new Set(motion.samples.map(s=>s.size)).size,1);
  await page.screenshot({path:path.join(dir,'marble-fixed-follow.png')});

  const blessing=await page.evaluate(()=>{
    const r=app.run;const altar=r.interactables.list.find(f=>f.kind==='altar');
    // Preserve the real facility callback and reward generation, selecting the
    // three reported stats deterministically only for the presentation check.
    const show=r.ui.showBlessing.bind(r.ui);
    const offers=[{label:'幸运 +18',rarity:1,mods:[{stat:'luck',add:18}]},
      {label:'暴击率 +7%',rarity:1,mods:[{stat:'critChance',add:.07}]},
      {label:'护甲 +10',rarity:1,mods:[{stat:'armor',add:10}]}];
    r.ui.showBlessing=(run,title,generated,choose,help,source)=>show(run,title,offers,choose,help,source);
    r.interactables.altarDone(altar,1);r.ui.showBlessing=show;
    const modal=r.ui.modalEl;
    const images=[...modal.querySelectorAll('.zx-blessing-seal img')].map(img=>img.getAttribute('src'));
    window.marbleBlessingBefore={mods:r.tempMods.length,items:[...r.player.items],luck:r.player.stats.luck};
    return {title:modal.querySelector('h2').textContent,images,text:modal.textContent};
  });
  assert.equal(blessing.title,'时尚小垃圾');
  for(const [i,file] of ['star-piece-v','dire-hit','iron'].entries())assert.ok(blessing.images[i].split('?')[0].endsWith('/items/'+file+'.png'),blessing.images[i]);
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await new Promise(resolve=>setTimeout(resolve,400));
  await page.evaluate(()=>{app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'blessing-current-art.png')});
  const reward=await page.evaluate(()=>{
    const r=app.run,before=window.marbleBlessingBefore;
    r.ui.modalEl.querySelector('[data-offer="0"]').click();
    return {mods:r.tempMods.slice(before.mods),sameItems:JSON.stringify([...r.player.items])===JSON.stringify(before.items),luck:r.player.stats.luck-before.luck,state:r.state};
  });
  assert.deepEqual(reward,{mods:[{stat:'luck',add:18}],sameItems:true,luck:18,state:'play'});
  const hatch=await page.evaluate(()=>{
    const r=app.run,before=r.stats.eggs;
    r.stats.kills=r.egg.from+r.egg.need;
    r.simulate(1/30);r.renderWorld(0);r.simulate(1/30);r.renderWorld(0);
    return {removed:!r.egg,count:r.carriedMarble.mesh.count,eggs:r.stats.eggs-before};
  });
  assert.deepEqual(hatch,{removed:true,count:0,eggs:1});
  assert.deepEqual(await page.evaluate(()=>[...missingAssets]),[]);
  await fs.writeFile(path.join(dir,'marble-blessing-report.json'),JSON.stringify({motion,blessing,reward,hatch},null,2));
  console.log('Carried marble render sync and unchanged blessing rewards passed. Screenshots:',dir);
}
