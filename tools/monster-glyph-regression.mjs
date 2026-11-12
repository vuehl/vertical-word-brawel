import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {monsterGlyphs,monsterWordForSpecies} from '../source/src/monster-glyphs.js';

export async function reviewMonsterGlyphs(page,dir){
  const ids=[1,46,114,10,23,74,4,77,56,123,34,19,16,96,100,109,54,87,129];
  assert.deepEqual(new Set(ids.map(monsterWordForSpecies)),new Set(Object.keys(monsterGlyphs)));
  const report=await page.evaluate(async ids=>{
    const run=app.run,sprites=run.sprites,p=run.player;
    app.halted=true;run.godMode=true;run.enemies.clear();run.director.update=()=>{};
    const batches=ids.map(id=>sprites.getMonster(id));
    await Promise.all(batches.map(b=>b.material.uniforms.map.value.userData.ready));
    const samples=batches.map(b=>{
      const canvas=b.material.uniforms.map.value.image,rect=b.zxGlyphRect;
      const x=Math.round(rect[0]*1024),y=Math.round((1-rect[3])*1024);
      const data=canvas.getContext('2d').getImageData(x,y,192,192).data;
      let opaque=0,colored=0,dark=0;
      for(let i=0;i<data.length;i+=4)if(data[i+3]>200){
        opaque++;if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>25&&Math.max(data[i],data[i+1],data[i+2])>100)colored++;
        if(Math.max(data[i],data[i+1],data[i+2])<80)dark++;
      }
      return {id:b.sid,word:b.zxGlyph,ready:b.ready,opaque,colored,dark,cornerAlpha:data[3]};
    });
    const hero=sprites.get(p.speciesId),sameSpeciesMonster=sprites.getMonster(p.speciesId);
    const heroWord=hero.zxGlyph;
    await hero.material.uniforms.map.value.userData.ready;
    // Use the actual enemy renderer, including the protected capture actor path.
    const index=run.enemies.spawn(p.speciesId,p.pos.x+3,p.pos.z,1,1,0);
    const capture=run.enemies.spawn(p.speciesId,p.pos.x-3,p.pos.z,1,1,128);
    run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);app.r.render(0);
    const routing={hero:hero.zxGlyph,monster:sameSpeciesMonster.zxGlyph,separate:hero!==sameSpeciesMonster,
      heroDraws:hero.count,monsterDraws:sameSpeciesMonster.count,ordinary:run.enemies.species[index],capture:run.enemies.flags[capture]&128};
    run.enemies.clear();
    // Deterministic battle composition, using real actors and existing combat data.
    for(let i=0;i<ids.length;i++){
      const angle=i*2.39996,distance=4+(i%4)*2;
      const x=p.pos.x+Math.cos(angle)*distance,z=p.pos.z+Math.sin(angle)*distance;
      const index=run.enemies.spawn(ids[i],x,z,1,1,0);
      run.enemies.y[index]=run.terrain.surface(x,z);
    }
    run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);run.ui.hud(run);
    app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return {samples,routing,heroWord,enemyCount:run.enemies.count,environment:'Compiled WeChat game in Chrome SwiftShader; staged battle scene.'};
  },ids);
  assert.equal(report.samples.length,19);
  for(const s of report.samples){
    assert.equal(s.word,monsterWordForSpecies(s.id));assert.ok(s.ready);
    assert.ok(s.opaque>2500,s.word+' must have visible artwork');
    assert.ok(s.colored/s.opaque>.65,s.word+' must be mostly colored');
    assert.equal(s.cornerAlpha,0,s.word+' must keep its transparent background');
  }
  assert.equal(report.routing.hero,'炎');assert.equal(report.routing.monster,'烬');
  assert.ok(report.routing.separate&&report.routing.heroDraws>=2&&report.routing.monsterDraws>=1);
  assert.equal(report.routing.capture,128);assert.equal(report.enemyCount,19);
  await page.screenshot({path:path.join(dir,'colored-monsters-battle.png')});
  // Verify texture/batch reuse across repeated spawn-and-clear cycles.
  report.reuse=await page.evaluate(()=>{
    const run=app.run,s=run.sprites,hero=s.get(4),monster=s.getMonster(4),count=s.batches.size;
    for(let loop=0;loop<10;loop++){
      run.enemies.clear();for(let i=0;i<50;i++)run.enemies.spawn(4,run.player.pos.x+3,run.player.pos.z,1,1,0);
    }
    const result={before:count,after:s.batches.size,heroSame:hero===s.get(4),monsterSame:monster===s.getMonster(4)};
    run.enemies.clear();return result;
  });
  assert.equal(report.reuse.before,report.reuse.after);assert.ok(report.reuse.heroSame&&report.reuse.monsterSame);
  fs.writeFileSync(path.join(dir,'monster-glyphs.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Verified 19 colored transparent monster glyphs, player/capture isolation and batch reuse.');
  return report;
}
