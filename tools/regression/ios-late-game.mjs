import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export const iphoneCases={
  se:{model:'iPhone SE (2nd generation)',viewport:{width:375,height:667,deviceScaleFactor:2},lock30:true,warning:'before'},
  13:{model:'iPhone 13',viewport:{width:390,height:844,deviceScaleFactor:3},lock30:true,warning:'pending'},
  14:{model:'iPhone 14',viewport:{width:390,height:844,deviceScaleFactor:3},lock30:true,warning:'ready'},
  max:{model:'iPhone 15 Pro Max',viewport:{width:430,height:932,deviceScaleFactor:3},lock30:false,warning:'active'},
};

export async function reviewIOSLateGame(page,dir,device){
  const result=await page.evaluate(async warning=>{
    const run=app.run,renderer=app.r.renderer,env=inspected.env,gl=renderer.getContext();
    const terrain=run.terrain;
    const maps=terrain.deskOwned.filter(value=>value.isTexture);
    const deskBytes=maps.reduce((sum,map)=>sum+map.image.width*map.image.height*4,0);
    const evo=run.vfx.upgrade.screen.texture;
    const evoPixels=evo.image.width*evo.image.height;
    const evoSourceBytes=evo.image.data.byteLength;
    const warn=()=>fixtureMemoryWarning({level:10});
    if(warning==='before')warn();
    run.director.update=()=>{};
    run.nextCp=Infinity;run.queueLevelUp=()=>{};
    run.capture.update=()=>{};run.enemies.clear();
    run.stageTime=run.time=300;
    const door=run.interactables.list.find(o=>o.kind==='boss');
    for(let i=0;i<200;i++){
      const a=i*2.39996,r=6+i%40*.2;
      const id=run.enemies.spawn(16,door.x+Math.cos(a)*r,door.z+Math.sin(a)*r,1e7,1,131072);
      if(id<0)throw Error('Could not seed late wave');
      run.enemies.flags[id]&=~131072;
    }
    const crowd=run.enemies.count;
    let soakSeconds=0;
    if(warning==='pending'){
      // Keep the stationary test player alive while exercising real enemy AI and attacks.
      run.player.iframes=1e5;
      run.player.hp=run.player.maxHp=1e9;
      run.stageTime=run.time=0;
      for(let frame=0;frame<6000;frame++){
        run.update(1/30);
        if(frame%150===0){
          app.r.render(1/30);env.drawUI(renderer);
          await new Promise(resolve=>setTimeout(resolve,0));
        }
      }
      soakSeconds=run.stageTime;
      if(run.state!=='play'||soakSeconds<195)throw Error('Late-wave simulation stalled at '+soakSeconds+' ('+run.state+')');
      run.stageTime=run.time=300;
    }
    run.update(1/30);
    if(warning!=='pending')await run.dragonHdAssets?.loading;
    const assets=run.dragonHdAssets,ready=!!assets?.ready;
    const load=assets?.loading;
    if(warning==='ready')warn();
    run.interactables.summonGuardian(door,door);
    const waiting=!!run.dragonHdPending;
    if(warning==='pending')warn();
    await load;
    const fx=run.dragonHd;
    if(!fx)throw Error('HD summon missing after warmup');
    const filmPages=[...assets.textures.values()];
    const phases=new Set();
    let matchingPixels=null;
    function readScene(){
      app.r.render(0);
      const {drawingBufferWidth:w,drawingBufferHeight:h}=gl;
      const pixels=new Uint8Array(w*h*4);
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      return pixels;
    }
    for(let i=0;i<240;i++){
      run.update(1/30);
      if(warning==='active'&&matchingPixels===null&&fx.arc.layers[1].visible){
        const before=readScene();
        warn();
        const after=readScene();
        if(!before.some((value,i)=>i%4===0&&value!==before[0]))throw Error('Empty summon frame');
        if(!after.every((value,i)=>value===before[i]))throw Error('Memory warning changed the rendered HD frame');
        matchingPixels=after.length/4;
      }
      let first=false;
      if(run.dragonHd===fx){
        for(const [name,visible] of [['orb',fx.orb.mesh.visible],['arc',fx.arc.layers[1].visible],
          ['flash',fx.white.visible],['burst',fx.after.mesh.visible],['reveal',!fx.hides(fx.id)]]){
          if(visible&&!phases.has(name)){phases.add(name);first=true;}
        }
      }
      if(first||i%10===0){app.r.render(1/30);env.drawUI(renderer);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    const battle={state:run.state,boss:run.boss.name,alive:run.boss.live(run.boss.bossIndex),enemies:run.enemies.count};
    const retainedAfterIntro=[...assets.textures.keys()];
    const onlyBossArt=retainedAfterIntro.length===1&&retainedAfterIntro[0]===assets.meta.boss.file&&assets.geometry.length===0;
    const pagesAfterIntro=filmPages.filter(page=>page.image).length;
    const createTerrain=run.createStageTerrain;
    let releasedBeforeTerrain=false;
    run.createStageTerrain=function(...args){
      releasedBeforeTerrain=assets.disposed&&!run.dragonHdAssets&&filmPages.every(page=>!page.image);
      return createTerrain.apply(this,args);
    };
    try{await run.changeZone();}
    finally{delete run.createStageTerrain;}
    app.r.render(0);env.drawUI(renderer);
    return {model:env.nativeDevice.model,platform:env.nativeDevice.platform,crowd,soakSeconds,ready,waiting,phases:[...phases],matchingPixels,onlyBossArt,battle,
      stage:run.stage,state:run.state,deskBytes,retainedDeskImages:maps.filter(m=>m.image).length,pagesAfterIntro,releasedBeforeTerrain,
      evoPixels,evoSourceBytes,evoFormat:evo.format,unloaded:!run.dragonHdAssets,glError:gl.getError()};
  },device.warning);
  assert.equal(result.model,device.model);
  assert.equal(result.platform,'ios');assert.equal(result.crowd,200);
  assert.equal(result.ready,device.warning!=='pending');
  assert.equal(result.waiting,device.warning==='pending');
  assert.deepEqual(result.phases,['orb','arc','flash','burst','reveal']);assert.equal(result.onlyBossArt,true);
  if(device.warning==='active')assert.ok(result.matchingPixels>0);
  assert.deepEqual(result.battle,{state:'play',boss:'龘',alive:true,enemies:1});
  assert.equal(result.stage,2);assert.equal(result.state,'play');
  assert.equal(result.pagesAfterIntro,1);assert.equal(result.releasedBeforeTerrain,true);
  assert.ok(result.deskBytes>0&&result.evoPixels>0);
  assert.equal(result.evoFormat,1028); // Three.js RedFormat
  assert.equal(result.evoSourceBytes,result.evoPixels);
  assert.equal(result.retainedDeskImages,0);assert.equal(result.unloaded,true);assert.equal(result.glError,0);
  const report={environment:'Desktop Chrome SwiftShader with WeChat iOS API fixtures',...device,...result};
  fs.writeFileSync(path.join(dir,'ios-late-game.json'),JSON.stringify(report,null,2));
  console.log(report);
}
