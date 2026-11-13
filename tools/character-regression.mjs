import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {enemyWords,eliteWords,minibossWords} from '../source/src/character-rules.js';

export async function reviewCharacters(page,dir) {
  const report={heroes:[],branches:[],spawns:[],buffs:[]};
  await page.evaluate(()=>{app.toMenu();app.zixing.choose();inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'choose-new-heroes.png')});
  const draw=async()=>{
    await page.evaluate(()=>{inspected.doc.querySelectorAll('.zx-intro,.evo-reveal,.ultcut').forEach(n=>n.remove());const r=app.run;r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);inspected.env.invalidateUI();app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  };
  for(const [species,branch,finalWord] of [[4,5,'燚'],[16,17,'疯'],[16,58,'飙'],[132,0,'摹']]) {
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
        assert.ok(choices.includes('讽')&&choices.includes('飒'));
        await draw();await page.screenshot({path:path.join(dir,'wind-branches.png')});
        await page.evaluate(branch=>{const r=app.run;const buttons=[...r.ui.modalEl.querySelectorAll('button')];buttons.find(n=>n.textContent.includes(branch===17?'讽':'飒')).click();},branch);
      }else await page.evaluate(()=>{const r=app.run;r.player.level=r.nextEvo.level;r.tryEvolve();});
      const first=await page.evaluate(()=>{
        const r=app.run;const preview=r.ui.modalEl.textContent;
        [...r.ui.modalEl.querySelectorAll('button')].find(n=>n.textContent.includes('确认进阶')).click();
        for(let i=0;i<140;i++)r.update(1/30);
        return {preview,species:r.player.speciesId,word:r.sprites.get(r.player.speciesId).zxGlyph,next:r.nextEvo,ultimate:r.ult.name};
      });
      assert.equal(first.species,branch);report.branches.push(first);
      assert.equal(first.ultimate,({5:'火圈绕身',17:'环形扩散',58:'卷着打转'})[branch]);
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
          const during=p.stats[key],duration=[...p.buffs.values()].find(b=>b.label==='移速 ×10')?.max;
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
      const words=new Set();
      for(let i=0;i<400;i++){
        const index=en.spawn(19,30,30,1,1,i%2);
        if(index<0)throw Error('Spawn rejected during glyph sampling');
        words.add(en.glyphWords[index]);en.kill(index);
      }
      await new Promise(resolve=>setTimeout(resolve,500));
      return {samples,pool:[...words],playerWord:r.sprites.get(p.speciesId).zxGlyph};
    });
    assert.deepEqual(new Set(spawns.pool),new Set([...enemyWords,...eliteWords]));assert.equal(spawns.playerWord,finalWord);
    for(const {word,batchWord,flags} of spawns.samples){
      assert.equal(word,batchWord);
      assert.ok((flags===128?['飙']:flags===0?enemyWords:flags===1?eliteWords:minibossWords).includes(word));
    }
    report.spawns.push(spawns);await draw();
    assert.equal(await page.evaluate(()=>inspected.doc.querySelector('.zx-hud-name').textContent),finalWord);
    await page.screenshot({path:path.join(dir,`battle-${species}-${branch}.png`)});
  }
  report.boss=await page.evaluate(async()=>{
    const r=app.run,en=r.enemies,p=r.player.pos;
    en.clear();r.stageTime=30;
    const altar=r.interactables.list.find(item=>item.kind==='boss');
    r.interactables.interact(altar);
    const index=r.boss.bossIndex,word=en.glyphWords[index];
    r.interactables.interact(altar);
    const intro=r.ui.hudEl.querySelector('.bossintro h1')?.textContent;
    r.ui.hud(r);
    const second=en.spawn(en.species[index],p.x+1,p.z,1,1,4);
    en.x[index]=p.x-1;en.z[index]=p.z;
    const batch=r.sprites.get(en.species[index],false,word);
    await batch.material.uniforms.zxGlyph.value.userData.ready;
    const frames=batch.zxStrokeFrames;
    const sample=()=>{
      r.sprites.begin(r.r.camera);en.render();r.sprites.end();
      const group=batch.zxGroup,result=[];
      for(let i=0;i<group.count;i++){
        const uv=group.aUV.array.subarray(i*4,i*4+4);
        result.push(frames.findIndex(rect=>rect.every((v,k)=>v===uv[k]))+1);
      }
      return result;
    };
    en.hp[index]=en.maxHp[index]/2;
    en.hp[second]=1;en.maxHp[second]=4800;
    const injured=sample();
    en.hp[index]=en.maxHp[index];en.hp[second]=0;
    return {name:r.boss.name,word,hudName:r.ui.els.bossName.textContent,portrait:r.ui.els.bossPt.querySelector('canvas')?.dataset.glyph,
      intro,species:en.species[index],used:altar.used,injured,healed:sample()};
  });
  assert.deepEqual(report.boss,{name:'龘',word:'龘',hudName:'龘',portrait:'龘',intro:'龘',species:151,used:true,injured:[24,1],healed:[48]});
  fs.writeFileSync(path.join(dir,'characters.json'),JSON.stringify(report,null,2));
  console.log('Hero branches, tiered spawns, summon-point boss and independent health frames passed.');
}
