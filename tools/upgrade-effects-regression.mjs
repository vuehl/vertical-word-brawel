import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewUpgradeEffects(page,dir){
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const report={environment:'Compiled WeChat bundle / Chrome SwiftShader',forms:[],evolutions:[]};
  await page.evaluate(()=>{
    const r=app.run;r.director.update=()=>{};r.capture.update=()=>{};r.enemies.clear();r.godMode=true;
    r.ui.experienceReady=()=>true;r.hints.show=()=>{};r.player.moves.forEach(m=>{if(m)m.timer=999;});
    const t=r.terrain;
    for(let z=-15;z<=15;z+=3)for(let x=-15;x<=15;x+=3){
      if(t.inBounds(x,z,4)&&t.isFlatOpen(x,z)&&!t.hitProp(x,t.surface(x,z)+.5,z,3)){
        r.player.pos.set(x,t.surface(x,z),z);r.camTarget.copy(r.player.pos);return;
      }
    }
    throw Error('No clear upgrade location');
  });
  const draw=async name=>{
    await page.evaluate(()=>{
      const r=app.run;
      inspected.doc.querySelectorAll('.zx-intro,.banner,.run-hint,.evo-reveal').forEach(n=>n.remove());
      r.updateCamera(1/60);r.renderWorld(0);r.ui.hud(r);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    });
    await page.screenshot({path:path.join(dir,name+'.png')});
  };
  for(const species of [4,5,6,16,17,18,58,59]){
    const result=await page.evaluate(async species=>{
      const r=app.run,p=r.player;r.ui.hideModal();r.ui.endCinematic();r.state='play';r.anims.length=0;
      r.vfx.clear();r.nextEvo=null;r.pendingLevels=1;r.evoHold=0;r.ult.castPending=false;p.setSpecies(species);p.renderScale=1;p.flash=0;p.iframes=0;
      await r.sprites.prepareHeroForm(species);
      p.moves.forEach(m=>{if(m)m.timer=999;});
      const show=r.ui.showLevelUp;let offered,choose;
      r.ui.showLevelUp=(run,offers,callback)=>{offered=offers;choose=callback;};
      try{r.doLevelUp();if(!choose)throw Error('Upgrade choices not shown');choose(offered[0]);}finally{r.ui.showLevelUp=show;}
      const fx=r.vfx.upgrade;
      if(fx.events.length!==0||fx.mesh.visible||fx.rearMesh.visible)throw Error('Ordinary upgrade must not create an orbit effect');
      for(let i=0;i<20;i++)r.update(1/60);
      return {species,word:r.sprites.get(species).zxGlyph,state:r.state,pending:r.pendingLevels,count:fx.mesh.count,
        events:fx.events.length,visible:fx.mesh.visible||fx.rearMesh.visible,programs:app.r.renderer.info.programs.length};
    },species);
    assert.equal(result.state,'play');assert.equal(result.pending,0);assert.equal(result.count,0);assert.equal(result.events,0);assert.equal(result.visible,false);
    await draw('upgrade-'+species);
    report.forms.push(result);console.log('Upgrade without orbit',result.word);
  }
  for(const [from,to] of [[4,5],[5,6],[16,17],[17,18],[16,58],[58,59]]){
    const start=await page.evaluate(async({from,to})=>{
      const r=app.run,p=r.player;r.state='play';r.pendingLevels=0;r.anims.length=0;r.vfx.clear();p.setSpecies(from);p.renderScale=1;p.iframes=0;p.flash=0;
      await r.sprites.prepareHeroForm(from);await r.sprites.prepareHeroForm(to);
      p.moves.forEach(m=>{if(m)m.timer=999;});
      r.nextEvo={to,level:p.level};const before=r.stats.evolutions;
      r.startEvolution();
      [...r.ui.modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('确认进阶')).click();
      for(let i=0;i<54;i++)r.update(1/30);
      return {from,to,before,state:r.state,species:p.speciesId,count:r.vfx.upgrade.mesh.count,age:r.vfx.upgrade.events[0]?.age};
    },{from,to});
    assert.equal(start.state,'evolving');assert.equal(start.species,from);assert.equal(start.count,1);
    await draw(`evolution-${from}-${to}-orbit`);
    await page.evaluate(()=>{for(let i=0;i<51;i++)app.run.update(1/30);});
    await draw(`evolution-${from}-${to}-contract`);
    await page.evaluate(()=>{for(let i=0;i<4;i++)app.run.update(1/30);});
    await draw(`evolution-${from}-${to}-reveal`);
    const end=await page.evaluate(()=>{
      const r=app.run;for(let i=0;i<33;i++)r.update(1/30);
      return {species:r.player.speciesId,state:r.state,evolutions:r.stats.evolutions,scale:r.player.renderScale,
        expired:r.vfx.upgrade.events.length===0,gl:app.r.renderer.getContext().getError()};
    });
    assert.equal(end.species,to);assert.equal(end.state,'play');assert.equal(end.evolutions,start.before+1);assert.equal(end.scale,1);assert.ok(end.expired);assert.equal(end.gl,0);
    report.evolutions.push({...start,end});console.log('Shared evolution',from,to);
  }
  report.settings=await page.evaluate(()=>{
    const r=app.run,fx=r.vfx.upgrade;
    fx.play(r.player,true);fx.play(r.player,true);const coalesced=fx.events.length===1;
    r.hideOwnFx=true;fx.update(.1);fx.play(r.player,true);const hidden=fx.events.length===0&&!fx.mesh.visible;
    r.hideOwnFx=false;r.vfx.calm=true;r.vfx.ownFade=.4;r.vfx.fade=.5;fx.play(r.player,true);fx.update(.2);
    const calm=fx.mesh.material.uniforms.calm.value,opacity=fx.timing.getW(0);
    r.vfx.clear();const cleared=fx.events.length===0&&!fx.mesh.visible;
    r.vfx.calm=false;r.vfx.ownFade=1;r.vfx.fade=1;
    // Ordinary upgrades must stay free of orbits in coop and chained choices.
    const coop=r.coop,show=r.ui.showLevelUp;r.coop={};r.nextEvo=null;r.state='play';r.pendingLevels=1;r.ui.showLevelUp=()=>{};
    try{r.doLevelUp();}finally{r.coop=coop;r.ui.showLevelUp=show;r.pendingLevels=0;r.state='play';}
    const cooperative=fx.events.length===0&&!fx.mesh.visible&&!fx.rearMesh.visible;r.vfx.clear();
    r.pendingLevels=3;let choices=0,earlyEffects=0;
    r.ui.showLevelUp=(run,offers,choose)=>{choices++;earlyEffects+=fx.events.length;choose(offers[0]);};
    try{r.doLevelUp();}finally{r.ui.showLevelUp=show;}
    const chained=choices===3&&earlyEffects===0&&fx.events.length===0&&r.pendingLevels===0;r.vfx.clear();
    return {coalesced,hidden,calm,opacity,cleared,cooperative,chained};
  });
  assert.ok(report.settings.coalesced&&report.settings.hidden&&report.settings.cleared&&report.settings.cooperative&&report.settings.chained);
  assert.equal(report.settings.calm,1);assert.ok(Math.abs(report.settings.opacity-.14)<1e-6);
  report.dispose=await page.evaluate(()=>{
    const r=app.run,fx=r.vfx.upgrade;fx.play();app.toMenu();
    return {disposed:fx.disposed,detached:!fx.mesh.parent&&!fx.rearMesh.parent,empty:fx.events.length===0};
  });
  assert.ok(report.dispose.disposed&&report.dispose.detached&&report.dispose.empty);
  fs.writeFileSync(path.join(dir,'upgrade-effects.json'),JSON.stringify(report,null,2));
}
