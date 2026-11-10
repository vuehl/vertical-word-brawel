import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewCharacters(page,dir) {
  const report={heroes:[],branches:[],spawns:[],buffs:[]};
  await page.evaluate(()=>{app.toMenu();app.zixing.choose();inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'choose-new-heroes.png')});
  const draw=async()=>{
    await page.evaluate(()=>{inspected.doc.querySelectorAll('.zx-intro,.evo-reveal,.ultcut').forEach(n=>n.remove());const r=app.run;r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);inspected.env.invalidateUI();app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  };
  for(const [species,branch,finalWord] of [[4,5,'燚'],[16,17,'飒'],[16,18,'飙'],[132,0,'摹']]) {
    const start=await page.evaluate(async species=>{
      app.toMenu();
      if(!await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Cannot start '+species);
      app.halted=true;const r=app.run;r.godMode=true;r.queueLevelUp=()=>{};r.state='play';
      r.director.update=()=>{};r.capture.update=()=>{};r.enemies.clear();
      r.ui.hudEl.querySelectorAll('.banner,.run-hint,.zx-intro').forEach(n=>n.remove());
      return {species:r.player.speciesId,word:r.sprites.get(species).zxGlyph,ultimate:r.ult.name,next:r.nextEvo};
    },species);
    report.heroes.push(start);
    assert.equal(start.word,({4:'炎',16:'风',132:'摹'})[species]);
    assert.equal(start.ultimate,({4:'一点火苗',16:'一阵刮来',132:'照着变'})[species]);
    if(branch){
      if(species===16){
        const choices=await page.evaluate(()=>{const r=app.run;r.player.level=26;r.tryEvolve();return r.ui.modalEl.textContent;});
        assert.ok(choices.includes('讽')&&choices.includes('疯'));
        await draw();await page.screenshot({path:path.join(dir,'wind-branches.png')});
        await page.evaluate(branch=>{const r=app.run;const buttons=[...r.ui.modalEl.querySelectorAll('button')];buttons.find(n=>n.textContent.includes(branch===17?'讽':'疯')).click();},branch);
      }else await page.evaluate(()=>{const r=app.run;r.player.level=r.nextEvo.level;r.tryEvolve();});
      const first=await page.evaluate(()=>{
        const r=app.run;const preview=r.ui.modalEl.textContent;
        [...r.ui.modalEl.querySelectorAll('button')].find(n=>n.textContent.includes('确认进阶')).click();
        for(let i=0;i<140;i++)r.update(1/30);
        return {preview,species:r.player.speciesId,word:r.sprites.get(r.player.speciesId).zxGlyph,next:r.nextEvo,ultimate:r.ult.name};
      });
      assert.equal(first.species,branch);report.branches.push(first);
      assert.equal(first.ultimate,({5:'火圈绕身',17:'卷着打转',18:'刮倒一片'})[branch]);
      const second=await page.evaluate(()=>{
        const r=app.run;r.state='play';r.player.level=r.nextEvo.level;r.tryEvolve();
        [...r.ui.modalEl.querySelectorAll('button')].find(n=>n.textContent.includes('确认进阶')).click();
        for(let i=0;i<140;i++)r.update(1/30);
        return {species:r.player.speciesId,word:r.sprites.get(r.player.speciesId).zxGlyph,next:r.nextEvo,ultimate:r.ult.name};
      });
      assert.equal(second.word,finalWord);assert.equal(second.next,null);report.branches.push(second);
      if(second.species===59){
        const buff=await page.evaluate(()=>{
          const r=app.run,p=r.player,key='moveSpeed';
          p.buffs.clear();p.recompute();const before=p.stats[key];r.ult.charge=1;r.ult.fire();
          for(let i=0;i<30&&!p.buffs.size;i++)r.update(1/30);
          const during=p.stats[key],duration=[...p.buffs.values()].find(b=>b.label==='没影了')?.max;
          r.state='paused';for(let i=0;i<60;i++)r.update(1/30);const paused=p.stats[key];
          r.state='play';for(let i=0;i<240;i++)r.update(1/30);
          return {key,before,during,duration,paused,after:p.stats[key],buffs:[...p.buffs.keys()]};
        });
        assert.ok(Math.abs(buff.during/buff.before-10)<1e-6,JSON.stringify(buff));assert.equal(buff.paused,buff.during);assert.equal(buff.duration,5);
        assert.ok(Math.abs(buff.after/buff.before-1)<1e-6);report.buffs.push(buff);
      }
    }else{
      assert.equal(start.next,null);
      await page.evaluate(()=>{const r=app.run;r.ult.charge=1;r.ult.fire();for(let i=0;i<120;i++)r.update(1/30);});
    }
    const spawns=await page.evaluate(async()=>{
      const r=app.run,p=r.player,en=r.enemies;en.clear();const flags=[0,1,2,4,4096,8192,128];
      const samples=[];
      for(let i=0;i<flags.length;i++){
        const index=en.spawn(59,p.pos.x+(i%4-1.5)*3,p.pos.z-3-Math.floor(i/4)*4,100,1,flags[i]);
        const word=en.glyphWords[index],batch=r.sprites.get(59,false,word);
        samples.push({flags:flags[i],word,batchWord:batch.zxGlyph});
      }
      const words=new Set();for(let i=0;i<400;i++){const index=en.spawn(19,30,30,1,1,i%2);words.add(en.glyphWords[index]);en.kill(index);}
      await new Promise(resolve=>setTimeout(resolve,500));
      return {samples,pool:[...words],playerWord:r.sprites.get(p.speciesId).zxGlyph};
    });
    assert.equal(spawns.pool.length,19);assert.equal(spawns.playerWord,finalWord);
    for(const sample of spawns.samples){assert.equal(sample.word,sample.batchWord);if(sample.flags&(4|4096|8192))assert.equal(sample.word,'敌');}
    report.spawns.push(spawns);await draw();
    assert.equal(await page.evaluate(()=>inspected.doc.querySelector('.zx-hud-name').textContent),finalWord);
    await page.screenshot({path:path.join(dir,`battle-${species}-${branch}.png`)});
  }
  report.boss=await page.evaluate(async()=>{
    const r=app.run,p=r.player;r.enemies.clear();r.boss.spawn(59,p.pos.x+4,p.pos.z-6,false);
    for(let i=0;i<100;i++)r.update(1/30);
    await new Promise(resolve=>setTimeout(resolve,300));r.ui.hud(r);
    return {name:r.boss.name,word:r.enemies.glyphWords[r.boss.bossIndex],hudName:r.ui.els.bossName.textContent,portrait:r.ui.els.bossPt.querySelector('canvas')?.dataset.glyph};
  });
  assert.deepEqual(report.boss,{name:'敌',word:'敌',hudName:'敌',portrait:'敌'});
  fs.writeFileSync(path.join(dir,'characters.json'),JSON.stringify(report,null,2));
  console.log('New heroes, both evolution branches, timed buffs, copy ultimate and shared enemy pool passed.');
}
