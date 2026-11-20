import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {reviewUltimateUpgrade} from './ultimate-upgrade-regression.mjs';

async function reviewRetiredOffers(page){
  const count=await page.evaluate(async()=>{
    const retired=[36,44,172,179,242,245,514,583,50104];
    const settings=app.meta.profile.settings,skip=settings.skipEmptyLevelUp;
    let scenario=0,pages=0;
    try{
      settings.skipEmptyLevelUp=false;
      for(const forms of [[4,5,6],[16,17,18,58,59,59]]){
        await app.startRun({species:forms[0],biome:'forest',tier:0,boosts:[],mode:'standard'});
        const r=app.run,p=r.player;
        r.nextEvo=null;p.level=100;p.vitaminSlots=0;
        r.ui.experienceReady=()=>true;
        let card,choose;
        r.ui.showLevelUp=(_run,items,pick)=>{[card]=items;choose=pick;};
        for(const form of forms){
          p.setSpecies(form);
          // Keep a free slot so the same draw covers both new and equipped moves.
          const starter=p.moves[0],id=retired[scenario++];
          p.moves[1]={...starter,def:{...starter.def,id}};
          r.banished.clear();r.rerolls=1;r.pendingLevels=1;r.state='play';card=null;
          r.doLevelUp();
          const seen=new Set();
          while(card){
            const offered=card.kind==='upMove'?p.moves[card.slot].def.id:card.id;
            if(!Number.isInteger(offered)||retired.includes(offered))throw Error('Invalid skill offer '+offered+' for form '+form);
            pages++;
            const previous=card;card=null;
            if(r.rerolls){choose(null,'reroll');continue;}
            if(seen.has(offered))throw Error('Banished skill offered twice');
            seen.add(offered);
            choose(previous,'banish');
          }
          if(!seen.has(starter.def.id)||seen.size<2)throw Error('Expected both equipped and new skills for form '+form);
          p.moves[1]=null;
        }
      }
    }finally{settings.skipEmptyLevelUp=skip;}
    return pages;
  });
  console.log('Retired move IDs absent from all playable forms across',count,'upgrade draws.');
}

async function reviewRandomOffers(page){
  const moves=JSON.parse(fs.readFileSync(new URL('../source/public/data/moves.json',import.meta.url)));
  const ids=Object.fromEntries(moves.filter(m=>['fire-spin','fire-blast'].includes(m.key)).map(m=>[m.key,m.id]));
  const result=await page.evaluate(ids=>{
    const r=app.run, p=r.player, originalRandom=Math.random;
    const show=r.ui.showLevelUp, ready=r.ui.experienceReady;
    let offers, pick, seed=613;
    try{
      const recharge=[];
      for(const [initial,roll] of [[0,.499],[0,.50],[1,.10],[2,.05]]){
        r.rerolls=initial;Math.random=()=>roll;p.gainLevel();recharge.push(r.rerolls);
      }
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      r.ui.experienceReady=()=>true;
      r.ui.showLevelUp=(_run,items,choose)=>{offers=items;pick=choose;};
      p.addMove(ids['fire-spin']); // The third slot is already available at game time zero.
      p.level=3;r.stageTime=0;r.state='play';r.pendingLevels=1;r.rerolls=800;r.doLevelUp();
      let allVitamins=0, lockedOffers=0, unlockedOffers=0;
      const positions=new Set();
      for(let draw=0;draw<800;draw++){
        p.level=draw<400?3:4;
        pick(null,'reroll');
        const index=offers.findIndex(o=>!o.vit);
        if(index===-1)allVitamins++;else positions.add(index);
        if(offers.length!==3 || offers.filter(o=>!o.vit).length>1 || new Set(offers.map(o=>o.key)).size!==3)
          throw Error('Invalid mixed offer: '+JSON.stringify(offers));
        if(offers.some(o=>o.id===ids['fire-blast'])){
          if(p.level===3)lockedOffers++;else unlockedOffers++;
        }
      }
      const exhausted=offers;pick(null,'reroll');
      return {recharge,allVitamins,lockedOffers,unlockedOffers,positions:[...positions].sort(),
        zero:r.rerolls,blocked:exhausted===offers};
    }finally{Math.random=originalRandom;r.ui.showLevelUp=show;r.ui.experienceReady=ready;}
  },ids);
  assert.deepEqual(result.recharge,[1,0,1,2]);
  assert.deepEqual(result.positions,[0,1,2]);
  assert.ok(result.allVitamins>0 && result.unlockedOffers>0 && result.blocked);
  assert.equal(result.lockedOffers,0);assert.equal(result.zero,0);
  console.log('Mixed draft and empty-reroll checks:',result);
}

async function reviewMoveCapacity(page){
  const result=await page.evaluate(async()=>{
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    const r=app.run,p=r.player,ui=r.ui;
    const {showLevelUp,showFusion,experienceReady}=ui,random=Math.random;
    let offers,choose,seed=84;
    const open=()=>{
      r.pendingLevels=2;r.state='play';r.doLevelUp();
    };
    const newOffer=()=>{
      for(let draw=0;draw<200;draw++){
        const offer=offers.find(o=>o.kind==='newMove');
        if(offer)return offer;
        choose(null,'reroll');
      }
      throw Error('No new skill offered with a free slot');
    };
    const checkFull=()=>{
      let upgrades=0;
      for(let draw=0;draw<100;draw++){
        for(const offer of offers){
          if(offer.vit)continue;
          const move=p.moves[offer.slot];
          if(offer.kind!=='upMove'||offer.slot>=p.moveSlots||!move||offer.key!=='m'+move.def.id||move.level>=p.capOf(move))
            throw Error('Unexpected skill offered at capacity: '+JSON.stringify(offer));
          upgrades++;
        }
        choose(null,'reroll');
      }
      if(!upgrades)throw Error('No equipped skill upgrades offered');
    };
    try{
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      ui.experienceReady=()=>true;
      ui.showLevelUp=(_run,items,pick)=>{offers=items;choose=pick;};
      p.addMove(83); // Fire Spin alongside the starter move.
      p.level=40;r.nextEvo=null;r.rerolls=1000;
      open();
      const stale=newOffer(),learned=r.stats.movesLearned,rerolls=r.rerolls;
      // Fill the final slot between drawing this card and accepting it.
      const other=[52,53,83,126].find(id=>id!==stale.id&&!p.hasMove(id));
      if(p.moves.filter(Boolean).length!==2||!p.addMove(other))throw Error('Expected one free slot');
      choose(stale);
      const rejected=r.pendingLevels===2&&r.stats.movesLearned===learned&&r.rerolls===rerolls&&!p.hasMove(stale.id);
      checkFull();

      p.moves[0].level=3;
      p.moves[1].level=4;
      const machine={kind:'bill',x:0,y:0,z:0};
      ui.showFusion=(_run,recipes,pick)=>{
        const pair=recipes.find(recipe=>recipe.a===0&&recipe.b===1);
        if(pair.ready||!pair.need.some(text=>text.includes('3/4')))throw Error('Expected one more level for fusion');
        pick(null);
      };
      r.pendingLevels=0;r.state='play';
      r.interactables.interact(machine);
      if(machine.used)throw Error('Viewing a locked fusion consumed the machine');
      p.moves[0].level=4;
      ui.showFusion=(_run,recipes,pick)=>pick(recipes.findIndex(recipe=>recipe.a===0&&recipe.b===1&&recipe.ready));
      r.interactables.interact(machine);
      r.stepAnims(3,true);
      const fused=p.moves.find(move=>move?.def.fusion);
      if(!fused||p.moves.filter(Boolean).length!==2)throw Error('Fusion did not free a slot');
      open();
      const replacement=newOffer();
      if(fused.parents.includes(replacement.id))throw Error('Offered a consumed fusion ingredient');
      choose(replacement);
      checkFull(); // The queued level immediately sees the replacement in slot three.

      p.moveSlots=4;choose(null,'reroll');
      const fourth=newOffer();
      choose(fourth);
      open();checkFull();
      // Draw and apply real upgrade cards past the fusion threshold.
      const trainToCap=(move,cap)=>{
        if(p.capOf(move)!==cap)throw Error('Unexpected cap for '+move.def.name);
        for(let level=move.level;level<cap;level++){
          open();
          const match=offer=>offer.kind==='upMove'&&p.moves[offer.slot]===move;
          for(let draw=0;draw<150&&!offers.some(match);draw++)choose(null,'reroll');
          const card=offers.find(match);
          if(!card)throw Error('Missing upgrade at level '+level+' for '+move.def.name);
          choose(card);
          if(move.level!==level+1)throw Error('Upgrade did not increase the move level');
        }
      };
      const ordinary=p.moves[2];
      ordinary.level=4;
      trainToCap(ordinary,8);
      trainToCap(fused,5);
      open();checkFull();
      p.addItem('tm-case');
      trainToCap(ordinary,10);
      trainToCap(fused,6);
      return {rejected,learned:r.stats.movesLearned-learned,slots:p.moves.filter(Boolean).length};
    }finally{Object.assign(ui,{showLevelUp,showFusion,experienceReady});Math.random=random;}
  });
  assert.deepEqual(result,{rejected:true,learned:2,slots:4});
  console.log('Skill capacity, stale choice and fusion checks passed');
}

async function reviewVitaminArt(page,dir){
  await page.evaluate(async()=>{
    await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;
  });
  for(const kind of ['newVit','upVit']){
    await page.evaluate(kind=>{
      const r=app.run;
      const offers=['escape-rope','enigma-berry'].map(vit=>({kind,vit,rarity:0}));
      if(kind==='upVit')for(const {vit} of offers)r.player.addVitamin(vit,1);
      r.state='modal';r.ui.showLevelUp(r,[...offers,{kind:'newMove',id:297}],()=>{});
      r.ui.hud(r);r.renderWorld(0);app.r.render(0);
    },kind);
    const cards=await page.evaluate(()=>[...app.run.ui.modalEl.querySelectorAll('[data-offer]')].map(card=>({
      title:card.querySelector('b').textContent,
      image:card.querySelector('img')?.getAttribute('src')?.split('?')[0].split('/').pop()??null,
      glyph:card.querySelector('.zx-glyph')?.getAttribute('aria-label')??null,
    })));
    assert.deepEqual(cards,[
      {title:'拾取增益',image:'escape-rope.png',glyph:null},
      {title:'溢出治疗',image:'enigma-berry.png',glyph:null},
      {title:'羽毛舞',image:null,glyph:'风'},
    ]);
    await page.waitForFunction(()=>{
      inspected.env.drawUI(app.r.renderer);
      return !inspected.modalTransition.active&&[...app.run.ui.modalEl.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth>0);
    });
    if(kind==='newVit')await page.screenshot({path:path.join(dir,'wind-vitamin-offers.png')});
    await page.evaluate(()=>app.run.ui.hideModal());
  }
}

export async function reviewUpgrade({page,resize,dir}){
  const baseline=process.argv.includes('--baseline'),samples=[];let liveLoop=null;
  await page.evaluate(async()=>{
    const account=await app.backend.guest();await app.meta.load(account);
    Object.assign(app.meta.profile.settings,{quality:'low',fpsLimit:30});app.applySettings();
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;app.run.godMode=true;app.run.update(1/60);
  });
  if(!baseline){
    await reviewRandomOffers(page);
    await reviewRetiredOffers(page);
    await reviewMoveCapacity(page);
    await reviewVitaminArt(page,dir);
  }
  const ultimate=baseline?null:await reviewUltimateUpgrade(page,dir);
  // The animation/cache checks need a fresh dialog after the three ultimate
  // scenarios; the last hero can otherwise leave an already cached offer.
  await page.evaluate(async()=>{
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;app.run.godMode=true;app.run.update(1/60);
    app.run.ui.experienceReady=()=>true;
  });
  try{
    for(const width of (baseline?[390]:[320,390,430])){
      await resize(width,width===320?568:width===430?932:844);
      // Deliver Chrome's viewport resize before instrumenting the active layout.
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
      const build=await page.evaluate(({width,baseline})=>{
        const r=app.run;r.ui.hideModal();r.state='play';r.pendingLevels=1;r.rerolls=2;
        if(!baseline)r.player.setSpecies(width===320?4:width===390?5:6);
        r.ui.hud(r);r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        const began=performance.now();r.doLevelUp();const buildMs=performance.now()-began;r.ui.hud(r);
        const clock=performance.now(),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
        const refresh=inspected.layout.refreshOverlay;
        window.upgradeAudit={clock,descriptor,refresh,uploads:0,panelUploads:0,firstUploadMs:100,layouts:0,sceneRenders:0,time:r.time};
        window.drawUpgradeFrame=()=>{
          if(!inspected.env.drawFrozenModal?.(app.r.renderer)){
            upgradeAudit.sceneRenders++;r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
          }
        };
        Object.defineProperty(performance,'now',{configurable:true,value:()=>upgradeAudit.clock});
        inspected.layout.refreshOverlay=function(...args){
          upgradeAudit.layouts++;const result=refresh.apply(this,args);
          if(upgradeAudit.layouts===1)upgradeAudit.clock+=300; // Simulate a slow first layout.
          return result;
        };
        const cards=[...r.ui.modalEl.querySelectorAll('[data-offer]')];
        return {buildMs,clock,glyphs:cards.flatMap(card=>[...card.querySelectorAll('.zx-glyph')].map(node=>node.getAttribute('aria-label'))),
          vitamins:cards.filter(card=>card.querySelector('img')).length};
      },{width,baseline});
      if(!baseline){
        assert.ok(build.glyphs.length<=1);
        if(build.glyphs.length)assert.deepEqual(build.glyphs,[width===320?'炎':width===390?'焱':'燚']);
        assert.equal(build.vitamins,3-build.glyphs.length);
      }
      const frames=[];
      try{
        for(const offset of [0,40,80,140,200,240,400]){
          const frame=await page.evaluate(({offset,clock})=>{
            const a=upgradeAudit,r=app.run;a.clock=clock+offset;
            drawUpgradeFrame();
            const gl=app.r.renderer.getContext(),rgba=new Uint8Array(4);
            gl.readPixels(2,2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
            if(offset===80){
              const b=inspected.layout.box(inspected.doc.querySelector('[data-offer]'));
              const screen=inspected.doc.getElementById('game').getBoundingClientRect();
              window.tap(b.x+b.w/2-screen.left,b.y+b.h/2-screen.top);
            }
            return {offset,transition:inspected.modalTransition?.snapshot||null,layouts:a.layouts,uploads:a.uploads,
              panelUploads:a.panelUploads,sceneRenders:a.sceneRenders,pixel:[...rgba],pending:r.pendingLevels,state:r.state,time:r.time};
          },{offset,clock:frames[0]?.transition?.started??build.clock});
          frames.push(frame);
          if([0,80,240].includes(offset))await page.screenshot({path:path.join(dir,'upgrade-'+width+'-'+offset+'.png')});
          if(baseline)break;
        }
        if(!baseline){
          assert.equal(frames[0].transition.progress,0);
          assert.ok(frames[0].transition.started>=build.clock+400-.001,'Slow layout and texture upload must not consume the intro animation: '+JSON.stringify({width,build,first:frames[0]}));
          assert.ok(frames[2].transition.active&&frames[2].transition.progress>0&&frames[2].transition.progress<1);
          assert.equal(frames.at(-1).transition.active,false);
          assert.equal(frames[0].panelUploads,2,'Both cached modal layers must actually upload');
          assert.ok(frames.every(f=>f.state==='modal'&&f.pending===1),'Appearing cards must not consume a tap from combat');
          assert.ok(frames.every(f=>f.time===frames[0].time),'Dialog transition cannot advance combat');
          // No full-screen layout or pixel upload between prepared and settled frames.
          for(const f of frames.slice(2)){
            assert.equal(f.layouts,frames[1].layouts);assert.equal(f.uploads,frames[1].uploads);
            assert.equal(f.panelUploads,frames[1].panelUploads);
          }
          assert.equal(frames.at(-1).sceneRenders,1,'Paused battle is captured once, including after the intro settles');
          const brightness=f=>f.pixel.slice(0,3).reduce((a,b)=>a+b,0);
          assert.ok(brightness(frames[0])>brightness(frames[2])+10&&brightness(frames[2])>brightness(frames.at(-1))+2,
            'GPU output must actually fade the backdrop: '+JSON.stringify(frames.map(f=>f.pixel)));
          const actions=await page.evaluate(()=>{
            const r=app.run,a=upgradeAudit,click=selector=>{
              inspected.doc.querySelector(selector).scrollIntoView();a.clock+=800;
              drawUpgradeFrame();
              const b=inspected.layout.box(inspected.doc.querySelector(selector)),s=inspected.doc.getElementById('game').getBoundingClientRect();
              window.tap(b.x+b.w/2-s.left,b.y+b.h/2-s.top);
            };
            const effects=[],effect=r.vfx.upgrade.play;
            r.vfx.upgrade.play=function(...args){const result=effect.apply(this,args);effects.push(this.events.length);return result;};
            const finishExit=()=>{drawUpgradeFrame();a.clock+=150;drawUpgradeFrame();};
            click('.zx-reroll');const rerollsBeforeExit=r.rerolls;
            const rerollTransition=inspected.modalTransition.snapshot.phase==='exit';
            finishExit();const rerolls=r.rerolls;
            a.clock+=260;drawUpgradeFrame();
            r.pendingLevels=2;
            click('[data-offer]');
            const beforeExit={pending:r.pendingLevels,state:r.state};
            // Programmatic rapid clicks must not apply an offer twice either.
            inspected.doc.querySelector('[data-offer]').click();
            finishExit();const chained={pending:r.pendingLevels,state:r.state,phase:inspected.modalTransition.snapshot.phase};
            const sceneRenders=a.sceneRenders;
            a.clock+=260;drawUpgradeFrame();click('[data-offer]');finishExit();
            const restored=inspected.env.drawFrozenModal(app.r.renderer);
            r.vfx.upgrade.play=effect;
            return {rerollsBeforeExit,rerolls,rerollTransition,beforeExit,chained,sceneRenders,restored,effects,pending:r.pendingLevels,state:r.state};
          });
          assert.deepEqual(actions,{rerollsBeforeExit:2,rerolls:1,rerollTransition:true,beforeExit:{pending:2,state:'modal'},
            chained:{pending:1,state:'modal',phase:'enter'},sceneRenders:1,restored:false,effects:[],pending:0,state:'play'});
        }
        samples.push({width,buildMs:build.buildMs,frames});
      }finally{
        await page.evaluate(()=>{
          const a=upgradeAudit;if(a.descriptor)Object.defineProperty(performance,'now',a.descriptor);else delete performance.now;
          inspected.layout.refreshOverlay=a.refresh;
          delete window.upgradeAudit;app.run.ui.hideModal();app.run.state='play';
        });
      }
    }
    if(!baseline){
      liveLoop=await page.evaluate(async()=>{
        const r=app.run,renderer=app.r,originalGap=app.frameGap,originalRender=renderer.render,originalUpdate=r.update;
        Object.assign(app.meta.profile.settings,{fpsLimit:60});app.applySettings();
        r.pendingLevels=1;r.state='play';r.doLevelUp();r.ui.hud(r);
        renderer.render(0);inspected.env.drawUI(renderer.renderer);
        const time=r.time;let sceneRenders=0,updates=0,frames=0;
        const originalUI=inspected.env.drawUI;
        renderer.render=function(...args){sceneRenders++;return originalRender.apply(this,args);};
        r.update=function(...args){updates++;return originalUpdate.apply(this,args);};
        inspected.env.drawUI=function(...args){frames++;return originalUI.apply(this,args);};
        app.frameGap=window.productionFrameGap||originalGap;
        const openingGap=app.frameGap();app.halted=false;app.pacer.reset();app.last=performance.now();
        try{
          await new Promise(resolve=>setTimeout(resolve,650));
          app.halted=true;
          return {sceneRenders,updates,frames,openingGap,settledGap:app.frameGap(),state:r.state,unchangedTime:r.time===time};
        }finally{
          app.halted=true;app.frameGap=originalGap;renderer.render=originalRender;r.update=originalUpdate;inspected.env.drawUI=originalUI;
        }
      });
      assert.equal(liveLoop.sceneRenders,0);assert.equal(liveLoop.updates,0);assert.ok(liveLoop.frames>=6);
      assert.ok(liveLoop.unchangedTime);assert.equal(liveLoop.state,'modal');
      // The shared frame policy now preserves the selected 60 FPS in menus too.
      assert.equal(liveLoop.openingGap,1000/60);assert.equal(liveLoop.settledGap,1000/60);
    }
  }finally{await page.evaluate(()=>{app.halted=false;app.toMenu();});}
  fs.writeFileSync(path.join(dir,baseline?'upgrade-before.json':'upgrade-after.json'),JSON.stringify({
    environment:'Compiled WeChat bundle / Chrome SwiftShader; controlled animation clock, not phone timings',ultimate,liveLoop,samples},null,2));
  console.log('Upgrade verification passed:',samples.map(s=>({width:s.width,buildMs:s.buildMs,frames:s.frames.length})));
}
