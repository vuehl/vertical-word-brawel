import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewCaptureBag(page,dir){
  // The workload harness halts the app after entering a fresh run. Allow the
  // overlay to detach the old run and bind/prewarm this one, as normal frames do.
  await page.waitForFunction(()=>{
    inspected.env.drawUI(app.r.renderer);
    return window.nativeImageStates.some(image=>image.path.includes('/capture_bag-')&&image.width>0);
  }).catch(async error=>{
    console.log('Capture preload state:',await page.evaluate(()=>({
      images:nativeImageStates.filter(image=>image.path.includes('/capture_bag-')),
      loads:nativeImageLoads.filter(image=>image.path.includes('/capture_bag-')),
      pack:GameGlobal.pokebonk.files.diagnostics.packs.capture_bag,
      active:app.run.capture.ball.active,disposed:app.run.capture.ball.disposed,
    })));
    throw error;
  });
  const preloaded=await page.evaluate(()=>nativeImageLoads.filter(image=>image.path.includes('/capture_bag-')).map(image=>image.path));
  assert.deepEqual([...new Set(preloaded)], [await page.evaluate(()=>GameGlobal.pokebonk.files.pathFor('assets/vfx/capture-bag/p00.webp'))]);
  const trails=await page.evaluate(async()=>{
    const run=app.run;
    run.enemies.clear();
    for(let attempt=0;attempt<10 && run.capture.index<0;attempt++){
      run.capture.shinyStage=run.stage;
      run.capture.shinyAt=run.stageTime;
      run.capture.update(0);
    }
    const index=run.capture.index;
    if(index<0)throw Error('Missing capture encounter');
    run.enemies.x[index]=run.player.pos.x+2;
    run.enemies.z[index]=run.player.pos.z;
    run.player.setSpecies(16);
    run.player.addMove(98);
    const slot=run.player.moves.findIndex(move=>move?.def.id===98),move=run.player.moves[slot];
    await run.sprites.prepareHeroForm(16);
    await run.vfx.crafted.prepareMoveTexture(move.def.effectKey);
    run.lockTarget=index;
    const cast=()=>{move.timer=0;run.castMove(slot,move,0);};
    const visible=()=>{
      run.renderWorld(0);
      return [run.sprites.getHeroGhostGlyph(16,'wind').zxGroup.mesh.count,run.vfx.crafted.windSkills.mesh.count];
    };
    cast();
    const during=visible();
    run.time+=.201;
    const after=visible();
    cast();
    const beforeCapture=visible();
    run.combat.killEnemy(index,{});
    run.updateCamera(1);
    inspected.env.drawUI(app.r.renderer);
    return {during,after,beforeCapture};
  });
  assert.deepEqual(trails,{during:[3,1],after:[0,0],beforeCapture:[3,1]});
  const closeShots=await page.evaluate(async()=>{
    const run=app.run,cam=run.r.camera,en=run.enemies,index=run.capture.index,ball=run.capture.ball;
    const original=run.player.pos.clone().set(en.x[index],en.y[index],en.z[index]),samples=[];
    const positions=[0,-.78,.78].flatMap(x=>[0,-.57,.64].map(y=>[x,y]));
    positions.push([-1,-1],[-1,1],[1,-1],[1,1]);
    // Include off-grid coordinates near the edges and between the preview positions.
    for(let i=1;i<=18;i++)positions.push([1.92*((i*.61803398875)%1)-.96,1.84*((i*.41421356237)%1)-.92]);
    for(const [x,y] of positions){
      const point=original.clone().set(x,y,-.5).unproject(cam);
      const ray=original.clone().set(x,y,.5).unproject(cam).sub(point);
      point.addScaledVector(ray,(original.y-point.y)/ray.y);
      en.x[index]=point.x;en.z[index]=point.z;
      ball.start(index,false,()=>{},()=>{});
      const path=[];
      for(const frame of [0,12,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,52]){
        ball.update(frame/24-ball.t);run.updateCamera(0);
        const foot=point.clone().project(cam);
        const edge=point.clone().setFromMatrixColumn(cam.matrixWorld,0).add(point).project(cam);
        path.push({frame,values:[foot.x,foot.y,edge.x-foot.x]});
      }
      samples.push({x,y,path});
      ball.update(111/24-ball.t+.01);
      await new Promise(resolve=>setTimeout(resolve,280));
      run.updateCamera(0);
    }
    en.x[index]=original.x;en.z[index]=original.z;
    return samples;
  });
  const close=closeShots[0].path.at(-1).values;
  for(const {x,y,path} of closeShots){
    const start=path[0].values;
    assert.ok(Math.hypot(start[0]-x,start[1]-y)<.0001,'The shot must start on the clicked spirit');
    for(const {frame,values} of path){
      const t=Math.max(0,Math.min(1,(frame-27)/(24*.52)));
      const progress=t*t*(3-2*t);
      assert.ok(values.every((v,i)=>Math.abs(v-(start[i]+(close[i]-start[i])*progress))<.0001),
        'Both pan axes and zoom must reach the centre composition together at frame '+frame+' from '+[x,y]);
    }
  }
  for(const breakAt of [1,2,3,0]){
    const imageLoadStart=await page.evaluate(()=>nativeImageLoads.length);
    await page.evaluate(breakAt=>{
      const run=app.run,ball=run.capture.ball;
      window.bagOutcomes=[];
      if(!breakAt){
        run.capture.sure=true;
        run.capture.throwBall();
      }else{
        ball.start(run.capture.index,false,()=>bagOutcomes.push('caught'),()=>bagOutcomes.push('escaped'));
        ball.breakAt=breakAt;
      }
    },breakAt);
    const endFrame=111;
    const pictures=breakAt===0 ? [70,73,76,80,85,90,94,110] : breakAt===1 ? [95,99,103,110] : [];
    for(const frame of [0,7,29,30,35,36,51,52,66,68,70,73,75,76,80,83,85,87,89,90,92,94,95,96,99,103,110,endFrame]){
      const state=await page.evaluate(async({frame,takePicture})=>{
        const run=app.run,ball=run.capture.ball;
        ball.update((frame+.001)/24-ball.t);
        if(!ball.active)return {active:false,state:run.state,capture:run.capture.state,outcomes:bagOutcomes,alive:run.enemies.alive[ball.index]};
        run.updateCamera(0);run.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        if(frame===0){
          if(run.sprites.getHeroGhostGlyph(16,'wind').zxGroup.mesh.count || run.vfx.crafted.windSkills.mesh.count)
            throw Error('Quick Attack is still visible in the capture close-up');
        }
        if(takePicture){
          const film='assets/vfx/capture-bag/';
          const files=GameGlobal.pokebonk.files;
          const frames=JSON.parse(wx.getFileSystemManager().readFileSync(files.pathFor(film+'frames.bin'),'utf8'));
          const page=files.pathFor(film+'p'+String(frames[Math.min(frame,ball.breakAt?95:110)][0]).padStart(2,'0')+'.webp');
          const render=()=>{
            run.updateCamera(0);run.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
          };
          render();
          for(let i=0;i<100 && !nativeImageStates.some(image=>image.path===page && image.width);i++){
            await new Promise(resolve=>setTimeout(resolve,20));
          }
          if(!nativeImageStates.some(image=>image.path===page && image.width))throw Error('Missing atlas '+page);
          inspected.env.invalidateUI();render();
        }
        const track=run.ui.capEl.querySelector('.zx-catch-track');
        return {active:true,pips:Number(track.dataset.step),
          caption:track.getAttribute('aria-label').split(' · ')[1],visualScale:ball.spiritPose?.scale??1,
          strokeCount:ball.spiritStrokes?.length||0,removed:ball.spiritPose?.removed||0,foreground:!!ball.escapeForeground,
          targetScale:run.enemies.scale[ball.index],initialScale:ball.scale0};
      },{frame,takePicture:pictures.includes(frame)});
      if(frame===endFrame){
        assert.equal(state.active,false);
        assert.equal(state.state,'play');
        if(breakAt)assert.deepEqual(state.outcomes,['escaped']);
        else {assert.equal(state.capture,'done');assert.equal(state.alive,0);}
        continue;
      }
      assert.equal(state.active,true);
      if(pictures.includes(frame) && frame>=80)assert.ok(state.strokeCount>0,'Soul heads must use authored character strokes');
      assert.equal(state.targetScale,state.initialScale,'Capture must not modify the simulation scale');
      if(breakAt&&frame>=96&&frame<110){
        assert.ok(state.visualScale>0&&state.visualScale<=1,'Pop scale at frame '+frame);
        assert.equal(state.foreground,true,'Escaping actor must have a foreground draw instance');
      }else if(frame<=76||(breakAt&&frame>=110))assert.equal(state.visualScale,1);
      else assert.equal(state.visualScale,state.removed>=state.strokeCount?0:1,'Remaining strokes stay fully visible at '+frame+' '+JSON.stringify(state));
      assert.equal(state.pips,Math.min(breakAt||3,[36,52,68].filter(step=>step<=frame).length));
      if(frame>=96)assert.equal(state.caption,breakAt?'抓字失败':'抓字成功');
      else assert.match(state.caption,/抓字中/);
      if(pictures.includes(frame))await page.screenshot({path:path.join(dir,'福袋捕捉-'+(breakAt?'挣脱':'成功')+'-'+frame+'.png')});
    }
    const retained=await page.evaluate(()=>nativeImageStates.filter(image=>image.path.includes('/capture_bag-')).length);
    assert.equal(retained,0,'Each completed capture clears all native atlas sources, including in-flight decodes');
    const allocated=await page.evaluate(start=>new Set(nativeImageLoads.slice(start)
      .filter(image=>image.path.includes('/capture_bag-')).map(image=>image.id)).size,imageLoadStart);
    assert.ok(allocated<=3,'Each capture reuses at most three native images');
  }
  console.log('Verified three escape stages, successful capture, escape through frame 95 and successful capture through frame 110, with escape return after the common sequence.');
}
