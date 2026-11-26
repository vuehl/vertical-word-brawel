import assert from 'node:assert/strict';

export async function reviewCaptureRewards(page){
  const drops=await page.evaluate(()=>{
    const run=app.run,{enemies,pickups,player}=run;
    const {x,z}=player.pos;
    const results=[];
    for(const flags of [0,1,2,4]){
      enemies.clear();pickups.clear();run.goldFrac=.99;
      const chests=()=>run.interactables.list.filter(facility=>facility.kind.endsWith('chest')).length;
      const before=chests();
      const index=enemies.spawn(flags===4?149:19,x+3,z,1,1,flags);
      if(index<0)throw Error('Could not spawn a combat enemy');
      run.combat.killEnemy(index,{});
      const kinds=[...new Set(Array.from(pickups.kind.slice(0,pickups.n)).filter((_,i)=>pickups.alive[i]))].sort();
      results.push({kinds,newChests:chests()-before});
    }
    return results;
  });
  assert.deepEqual(drops,Array.from({length:4},()=>({kinds:[0,1],newChests:0})));

  const captured=await page.evaluate(async()=>{
    const run=app.run,{capture,enemies,player}=run;
    enemies.clear();
    const {x,z}=player.pos;
    if(enemies.spawn(132,x+3,z,1,1,128|2048)>=0 || enemies.spawn(16,x+3,z,1,1,128)>=0)
      throw Error('An excluded character or normal appearance could be captured');
    for(let attempt=0;attempt<10&&capture.index<0;attempt++){
      capture.shinyStage=run.stage;capture.shinyAt=run.stageTime;capture.update(0);
    }
    const {index,species}=capture;
    if(index<0)throw Error('Could not spawn the alternate capture');
    enemies.x[index]=player.pos.x+2;enemies.z[index]=player.pos.z;
    run.combat.killEnemy(index,{});
    if(capture.state!=='weakened')throw Error('Capture did not weaken');
    capture.sure=true;capture.throwBall();
    for(let frame=0;frame<400&&capture.ball.active;frame++)capture.ball.update(1/60);
    if(capture.state!=='done')throw Error('Capture did not complete');
    await run.finish(false,true);
    await app.meta.resync(true);
    app.toMenu();app.zixing.choose();
    return {species,roster:app.meta.profile.league,shiny:app.meta.profile.shinies.includes(species),
      copyCard:!!app.screen.querySelector('[data-species="132"]')};
  });
  assert.deepEqual(captured,{species:16,roster:[4,16],shiny:true,copyCard:false});

  await page.evaluate(()=>app.screen.querySelector('[data-species="16"]').click());
  assert.equal(await page.evaluate(()=>app.screen.querySelector('[data-action="collection-looks"]').getAttribute('aria-label')),'外观');
  await page.evaluate(()=>app.screen.querySelector('[data-action="collection-looks"]').click());
  await page.evaluate(()=>app.screen.querySelector('[data-look="shiny"]').click());
  await page.evaluate(()=>app.screen.querySelector('[data-action="collection-next"]').click());
  await page.waitForFunction(()=>app.screen.dataset.page==='choose'&&app.meta.skinFor(16)==='shiny');
  await page.evaluate(()=>app.screen.querySelector('[data-action="collection-next"]').click());
  await page.waitForFunction(()=>app.screen.dataset.page==='map');
  await page.evaluate(()=>app.screen.querySelector('[data-action="enter"]').click());
  await page.waitForFunction(()=>app.run?.state==='play'&&app.run.startSpecies===16,{timeout:60000});

  const appearance=await page.evaluate(async()=>{
    const run=app.run,renderer=app.r.renderer;
    await app.meta.resync(true);
    run.renderWorld(0);app.r.render(0);inspected.env.drawUI(renderer);
    const batch=[...run.sprites.batches.values()].find(batch=>batch.zxGlyph==='风'&&batch.count);
    const classic=run.sprites.get(batch.id+20000);
    for(let attempt=0;attempt<10&&run.capture.index<0;attempt++)run.capture.spawnClassic(4);
    return {saved:app.meta.skinFor(16),look:run.skinLook,shiny:run.shinySkin,
      shinyShader:batch.material.fragmentShader.includes('c.rgb=c.gbr'),
      classicShader:classic.material.fragmentShader.includes('c.rgb=c.brg'),
      fireClassic:run.capture.species===4&&run.capture.classic,
      active:app.meta.profile.lastSpecies};
  });
  assert.deepEqual(appearance,{saved:'shiny',look:'shiny',shiny:true,shinyShader:true,classicShader:true,fireClassic:true,active:16});
  console.log('Verified kill drops, capture settlement, and alternate color on the next run.');
}
