import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewFusionCleanup(page, dir) {
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const report={environment:'Compiled WeChat bundle in Chrome/SwiftShader; not phone FPS.',rejected:0,casts:[],ultimates:[]};
  report.rejected=await page.evaluate(()=>{
    const p=app.run.player;let rejected=0;
    for(const species of [4,5,6,16,17,18,58,59]){
      vfxSetup();p.setSpecies(species);
      for(let id=50000;id<=50106;id++)if(![50001,50006,50080,50106].includes(id)){
        if(p.addMove(id))throw Error('Retired ID restored: '+id);rejected++;
      }
    }
    const t=app.run.terrain;
    for(let z=-24;z<=24;z+=3)for(let x=-24;x<=24;x+=3){
      if(Array.from({length:28},(_,i)=>z-i*.4).every(zz=>t.inBounds(x,zz,2)&&t.isFlatOpen(x,zz)&&!t.hitProp(x,t.surface(x,zz)+.5,zz,2))){window.cleanupLane={x,z};return rejected;}
    }
    throw Error('No clear recording lane');
  });
  assert.equal(report.rejected,103*8);
  await page.evaluate(()=>{
    window.cleanupSetup=async species=>{
      vfxSetup();const r=app.run,p=r.player,e=r.enemies,{x,z}=cleanupLane;
      p.setSpecies(species);p.buffs.clear();p.level=1;p.evoStage=species===5?1:species===6?2:0;p.growth=0;p.recompute();p.stats.critChance=p.stats.megaCrit=0;p.kx=p.kz=0;
      p.pos.set(x,r.terrain.surface(x,z),z);p.facing.set(0,-1);r.camTarget.copy(p.pos);r.ghosts.length=0;
      for(let i=0;i<e.n;i++){e.x[i]=x+(i%2?.4:-.4);e.z[i]=z-3-i*2;e.y[i]=r.terrain.surface(e.x[i],e.z[i]);e.kx[i]=e.kz[i]=0;}
      e.update();r.lockTarget=0;
      await r.sprites.prepareHeroForm(species);
      await Promise.all([r.vfx.crafted.fireFamily.ready,r.vfx.crafted.fireJet.ready,r.vfx.crafted.fireSpin.ready,r.vfx.crafted.fireball.ready,
        ...[...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready)]);
      for(let i=0;i<e.n;i++){const b=r.sprites.get(e.species[i],false,e.glyphWords[i]);e.radius[i]=Math.max(.45,Math.min(4,b.bodyWidth(e.scale[i])*.42));e.hgt[i]=Math.max(.8,b.bodyHeight(e.scale[i]));e.sized[i]=1;}
      e.update();
    };
  });
  for(const [species,id] of [[4,50001],[4,50080],[16,50006],[16,50106],[4,488],[5,488],[6,488],[4,126],[4,53],[4,83],[4,517],[16,49001]]){
    for(const level of id>=50000?[1,5]:[1]){
      const sample=await page.evaluate(async({species,id,level})=>{
        await cleanupSetup(species);const r=app.run,p=r.player;
        if(!p.addMove(id))throw Error('Missing skill '+id);
        const m=p.moves[0];m.level=level;m.timer=0;
        await r.vfx.crafted.prepareMoveTexture(m.def.effectKey??m.def.key);
        return {species,id,level,key:m.def.key,name:m.def.name,maxJet:0,maxSpin:0,maxFamily:0,maxWind:0};
      },{species,id,level});
      for(let batch=0;batch<12;batch++){
        const state=await page.evaluate(()=>{
          const r=app.run,v=r.vfx.crafted,m=r.player.moves[0];let jet=0,spin=0,family=0,wind=0;
          for(let i=0;i<30;i++){
            const dt=1/60;r.realTime+=dt;r.simulate(dt);r.updateCamera(dt);r.renderWorld(dt);r.vfx.update(dt);m.timer=999;
            jet=Math.max(jet,v.fireJet.mesh.count);spin=Math.max(spin,v.fireSpin.mesh.count);family=Math.max(family,v.fireFamily.mesh.count+v.fireFamily.topMesh.count);wind=Math.max(wind,v.windSkills?.mesh.count||0);
          }
          vfxDraw();return {jet,spin,family,wind,damage:m.damageDone||0,gl:app.r.renderer.getContext().getError()};
        });
        assert.equal(state.gl,0);sample.maxJet=Math.max(sample.maxJet,state.jet);sample.maxSpin=Math.max(sample.maxSpin,state.spin);sample.maxFamily=Math.max(sample.maxFamily,state.family);sample.maxWind=Math.max(sample.maxWind,state.wind);sample.damage=state.damage;
        if(batch===1)await page.screenshot({path:path.join(dir,`${species}-${id}-${level}.png`)});
      }
      assert.ok(sample.damage>0,`${id} damages enemies`);
      if(id===50001){assert.equal(sample.maxJet,0,'No feeding flame jet');assert.ok(sample.maxSpin>0&&sample.maxFamily>0,'Vortex and burst remain');}
      if(id===53)assert.ok(sample.maxJet>0,'Standalone Flamethrower remains');
      if(id===126)assert.ok(sample.maxFamily>0,'Fire Blast survives completion-atlas removal');
      if([50006,50106].includes(id))assert.ok(sample.maxWind>0);
      report.casts.push(sample);console.log('Verified',sample.key,species,level,sample.damage);
    }
  }
  for(const species of [4,5,6]){
    const result=await page.evaluate(async species=>{
      await cleanupSetup(species);const r=app.run,f=r.vfx.crafted.fireFamily;r.ult.charge=1;
      if(r.ult.fire()===false)throw Error('Ultimate failed '+species);
      vfxAdvance(15,1/60);
      return {species,cloud:f.events.some(e=>e.mushroomPart),gl:app.r.renderer.getContext().getError()};
    },species);
    assert.equal(result.gl,0);assert.ok(result.cloud,'Keep fire ultimate cloud');report.ultimates.push(result);
  }
  report.cleanup=await page.evaluate(()=>{
    const r=app.run,f=r.vfx.crafted.fireFamily;
    const retiredAbsent=!('completionMesh'in f)&&!('completionTexture'in f)&&!('wildfire'in f);
    r.vfx.clear();r.projectiles.clear();r.zones.clear();r.timers.length=r.anims.length=0;
    return {retiredAbsent,empty:f.events.length===0&&f.mesh.count===0&&f.topMesh.count===0,gl:app.r.renderer.getContext().getError()};
  });
  assert.deepEqual(report.cleanup,{retiredAbsent:true,empty:true,gl:0});
  fs.writeFileSync(path.join(dir,'fusion-cleanup-runtime.json'),JSON.stringify(report,null,2));
  return report;
}
