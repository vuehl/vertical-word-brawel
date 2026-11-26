import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {heroActionCatalog} from '../../source/src/actors/hero-action-catalog.js';
import {starterForSpecies,starterWords,windRoutes} from '../../source/src/data/starter-characters.js';

export async function reviewWindAnimation(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const report={entryImages:{},forms:[]};
  await page.evaluate(()=>{
    const files=GameGlobal.pokebonk.files,resolve=files.resolvePath;
    window.heroImageRequests=[];
    files.resolvePath=url=>{
      if(/assets\/glyphs\//.test(String(url)))heroImageRequests.push(String(url));
      return resolve(url);
    };
    window.drawHeroReview=()=>{
      const r=app.run;
      r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);app.r.render(0);
      inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    };
  });
  for(const [id,{clips}] of Object.entries(heroActionCatalog)){
    const species=Number(id),starter=starterForSpecies(species).id;
    const branch=windRoutes.find(route=>route.middle===species||route.final===species)?.middle;
    const requests=await page.evaluate(async({species,starter,branch})=>{
      app.toMenu();heroImageRequests.length=0;
      if(await app.startRun({species:132,biome:'forest',tier:0,boosts:[],mode:'standard'}))
        throw Error('Hidden starter opened a run');
      if(!await app.startRun({species:starter,biome:'forest',tier:0,boosts:[],mode:'standard'}))
        throw Error('Cannot start '+starter+': '+app.lastStartError);
      app.halted=true;
      const r=app.run,p=r.player;
      const entry=heroImageRequests.filter(url=>url.includes('/hero-actions/'));
      r.state='play';r.enemies.clear();r.director.update=()=>{};r.capture.update=()=>{};
      r.ui.hideModal();p.moves=Array(4).fill(null);
      while(p.speciesId!==species){
        p.level=r.nextEvo.level;
        if(!r.tryEvolve())throw Error('Cannot evolve from '+p.speciesId);
        if(r.nextEvo.to===-1)r.ui.modalEl.querySelector('[data-branch-id="'+branch+'"]').click();
        const target=r.nextEvo.to;
        if(starter===16)r.ui.modalEl.querySelector('[data-action="confirm-wind-evolution"]').click();
        for(let i=0;i<210&&r.state==='evolving';i++)r.update(1/30);
        if(p.speciesId!==target||r.state!=='play')throw Error('Evolution did not finish: '+target);
        if(!heroImageRequests.includes('assets/glyphs/hero-actions/'+target+'.png'))throw Error('Missing evolution atlas request: '+target);
        await r.sprites.prepareHeroForm(target);
      }
      inspected.doc.querySelectorAll('.zx-intro,.evo-reveal,.ultcut,.banner,.run-hint').forEach(n=>n.remove());
      Object.assign(p,{speedNow:0,grounded:true,gliding:false,swimNow:false,slideT:0,hurtT:0,
        attackT:0,ultPoseT:0,heroPose:null,firePose:null,heroPlayback:undefined});
      const get=r.sprites.getPlayerGlyph;
      r.sprites.getPlayerGlyph=(...args)=>{
        const batch=get(...args);
        window.heroObserved={frame:args[3],texture:batch.material.uniforms.zxGlyph.value,batch};
        return batch;
      };
      drawHeroReview();
      return entry;
    },{species,starter,branch});
    assert.deepEqual(requests,['assets/glyphs/hero-actions/'+starter+'.png']);
    report.entryImages[starter]=requests;
    const movement=await page.evaluate(()=>{
      const r=app.run,p=r.player,origin=p.pos.clone();
      r.input.stickX=1;
      for(let i=0;i<30;i++)r.update(1/60);
      drawHeroReview();
      const moving={distance:p.pos.distanceTo(origin),action:heroObserved.frame?.action};
      r.input.stickX=0;
      for(let i=0;i<90;i++)r.update(1/60);
      drawHeroReview();
      return {moving,stopped:heroObserved.frame?.action};
    });
    assert.ok(movement.moving.distance>.1);
    assert.equal(movement.moving.action,'walk');
    assert.equal(movement.stopped,'idle');
    report.movement??={};
    report.movement[species]=movement;
    const states={};
    for(const [action,{count,fps,loop}] of Object.entries(clips)){
      const result=await page.evaluate(({action,count,fps,loop})=>{
        const r=app.run,p=r.player;
        p.speedNow=action==='walk'?2:0;
        p.heroPlayback=undefined;
        if(action==='faint'){
          Object.assign(p,{hp:1,iframes:0,invisT:0,revives:0});
          p.items.clear();r.godMode=false;r.frozen=0;
          p.hurt(1e9,'normal',-1,NaN,NaN,true,0,-1,{evade:0});
        }
        drawHeroReview();
        const texture=heroObserved.texture,version=texture.version,seen=[];
        const frames=Math.ceil(count*60/fps)*(loop?2:1)+12;
        let uvMatches=true,textureStable=true;
        for(let i=0;i<frames;i++){
          // Exercise the real rendering branch while stepping its gameplay clock.
          r.sprites.begin(r.r.camera);p.render();r.sprites.end();
          const {frame,batch}=heroObserved;
          if(!frame||frame.action!==action||frame.species!==p.speciesId)throw Error('Wrong action: '+action);
          if(seen.at(-1)!==frame.index)seen.push(frame.index);
          uvMatches&&=frame.rect.every((value,index)=>batch.zxGroup.aUV.array[index]===value);
          textureStable&&=heroObserved.texture===texture&&texture.version===version;
          if(action!=='faint')r.time+=1/60;
          r.realTime+=1/60;
        }
        drawHeroReview();
        return {seen,uvMatches,textureStable,dead:p.dead,state:r.state};
      },{action,count,fps,loop});
      const expected=Array.from({length:count},(_,index)=>index);
      assert.deepEqual(result.seen.slice(0,count),expected,id+' '+action);
      assert.ok(result.uvMatches&&result.textureStable,id+' '+action+' must use the atlas without uploading new frame pixels');
      if(loop)assert.deepEqual(result.seen.slice(count,count*2),expected);
      else {assert.equal(result.seen.length,count);assert.equal(result.dead,true);assert.equal(result.state,'dead');}
      states[action]=result;
      await page.screenshot({path:path.join(dir,'角色-'+starterWords[id]+'-'+action+'.png')});
    }
    const unexpected=await page.evaluate(()=>heroImageRequests.filter(url=>/132|copy-strokes|wind-(?:idle|walk|death)-atlas|faint_01/.test(url)));
    assert.deepEqual(unexpected,[]);
    assert.deepEqual(await page.evaluate(()=>[...missingAssets]),[]);
    report.forms.push({species,word:starterWords[id],states});
  }
  fs.writeFileSync(path.join(dir,'hero-actions.json'),JSON.stringify(report,null,2));
  console.log('Verified idle, walk and faint frames in the WeChat runtime:',report.forms.map(form=>form.word).join('、'));
}
