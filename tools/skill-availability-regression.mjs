import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewSkillAvailability(page, dir) {
  await page.setViewport({width:390, height:844, deviceScaleFactor:1});
  const report = {environment:'Compiled WeChat bundle in Chrome SwiftShader; not a phone FPS measurement.', forms:[]};
  report.retired = await page.evaluate(() => {
    const p=app.run.player, results=[];
    for (const species of [4,5,6,16,17,18,58,59]) {
      vfxSetup(); p.setSpecies(species);
      for (const id of [10,163,225,257,337,394,424,50024,50079,50093,50105]) {
        results.push({species,id,accepted:p.addMove(id)});
      }
      if (species < 7) results.push({species,id:403,accepted:p.addMove(403)});
    }
    return results;
  });
  assert.ok(report.retired.every(r => !r.accepted), 'Retired skills and fire Air Slash must reject old IDs');
  await page.evaluate(async () => {
    if (!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'})) throw Error('Cannot start wind');
    app.halted=true;
    const terrain=app.run.terrain;
    // Keep the actual scene and collisions; find a clear outbound/return path.
    for (let z=-20;z<=28;z+=4) for (let x=-28;x<=28;x+=4) {
      if (Array.from({length:40},(_,i)=>z-i*.4).every(zz =>
        terrain.inBounds(x,zz,2)&&terrain.isFlatOpen(x,zz)&&!terrain.hitProp(x,terrain.surface(x,zz)+.6,zz,2))) {
        window.airSlashLane={x,z}; return;
      }
    }
    throw Error('No clear lane for Air Slash');
  });
  for (const species of [16,17,18,58,59]) {
    const result=await page.evaluate(async species => {
      vfxSetup();
      const r=app.run,p=r.player,e=r.enemies,{x,z}=airSlashLane;
      p.setSpecies(species);p.pos.set(x,r.terrain.surface(x,z),z);p.facing.set(0,-1);r.camTarget.copy(p.pos);
      p.stats.critChance=p.stats.megaCrit=0;
      for (let i=0;i<e.n;i++) {
        e.x[i]=i<2?x:x+15+i;e.z[i]=z-(i===0?3.5:6.5);
        e.y[i]=r.terrain.surface(e.x[i],e.z[i]);e.kx[i]=e.kz[i]=0;
      }
      e.update();r.lockTarget=0;
      if (!p.addMove(403)) throw Error('Air Slash missing for '+species);
      const m=p.moves[0];m.timer=0;
      await Promise.all([r.vfx.crafted.prepareMoveTexture('air-slash'),
        ...[...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready)]);
      return {species,name:m.def.name,type:m.def.type,arch:m.def.arch,cd:m.def.cd};
    },species);
    const frames=[];
    for (let batch=0;batch<18;batch++) {
      frames.push(...await page.evaluate(() => {
        const samples=[];
        for (let frame=0;frame<6;frame++) {
          const r=app.run,dt=1/60;
          r.realTime+=dt;r.simulate(dt);r.updateCamera(dt);r.renderWorld(dt);r.vfx.update(dt);
          const pool=r.projectiles,art=r.vfx.crafted.fireFamily;
          r.player.moves[0].timer=999;
          const i=pool.alive.findIndex(Boolean);
          samples.push({outgoing:i>=0&&pool.vz[i]<-1,returning:i>=0&&pool.vz[i]>1,
            blade:art.events.some(e=>e.clip==='windCut'),hit:art.events.some(e=>e.clip==='windHit'),
            wake:art.events.some(e=>e.clip==='windCut'&&!e.key)});
        }
        vfxDraw(false);
        return samples;
      }));
      if (species===16 && [2,8,11].includes(batch)) {
        await page.evaluate(()=>vfxDraw());
        if(batch===2)result.visibleBlade=await page.evaluate(()=>{
          const art=app.run.vfx.crafted.fireFamily;
          return art.loaded&&art.mesh.visible&&art.mesh.count>0;
        });
        await page.screenshot({path:path.join(dir,'air-slash-'+batch+'.png')});
      }
    }
    Object.assign(result,await page.evaluate(() => {
      const r=app.run,art=r.vfx.crafted.fireFamily;
      return {damage:r.player.moves[0].damageDone,hp:[...r.enemies.hp.slice(0,2)],
        projectiles:r.projectiles.used,remainingWind:art.events.filter(e=>['windCut','windHit'].includes(e.clip)).length,
        texture:{loaded:art.loaded,width:art.texture.image.width,height:art.texture.image.height,prepared:art.texture.userData.prepared},
        gl:app.r.renderer.getContext().getError()};
    }));
    for (const state of ['outgoing','returning','blade','hit','wake']) {
      result[state]=frames.some(frame=>frame[state]);
      assert.ok(result[state], species+' '+state);
    }
    assert.equal(result.name,'空气斩');assert.equal(result.type,'flying');assert.equal(result.arch,'boomerang');
    assert.ok(result.damage>0);assert.ok(result.hp.every(hp=>hp<1e7),'Pierce both enemies');
    if(species===16)assert.equal(result.visibleBlade,true);
    assert.equal(result.projectiles,0);assert.equal(result.remainingWind,0);assert.equal(result.gl,0);
    report.forms.push(result);
  }
  fs.writeFileSync(path.join(dir,'skill-availability.json'),JSON.stringify(report,null,2));
  console.log('Air Slash passed for all five wind forms:',JSON.stringify(report.forms));
}
