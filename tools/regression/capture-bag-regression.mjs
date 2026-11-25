import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewCaptureBag(page,dir){
  await page.waitForFunction(()=>window.nativeImageLoads.filter(image=>
    image.path.includes('/capture_bag-') && image.width>0).length>=4);
  await page.evaluate(()=>{
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
    run.combat.killEnemy(index,{});
    run.updateCamera(1);
    inspected.env.drawUI(app.r.renderer);
  });
  for(const breakAt of [1,2,3,0]){
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
    for(const frame of [0,29,30,35,36,51,52,67,68,75,76,95,96]){
      const state=await page.evaluate(async({frame,breakAt})=>{
        const run=app.run,ball=run.capture.ball;
        ball.update((frame+.001)/24-ball.t);
        if(!ball.active)return {active:false,state:run.state,capture:run.capture.state,outcomes:bagOutcomes};
        if(!breakAt && [52,76].includes(frame)){
          const film='assets/vfx/capture-bag/';
          const files=GameGlobal.pokebonk.files;
          const frames=JSON.parse(wx.getFileSystemManager().readFileSync(files.pathFor(film+'frames.bin'),'utf8'));
          const page=files.pathFor(film+'p'+String(frames[frame][0]).padStart(2,'0')+'.webp');
          const render=()=>{
            run.updateCamera(0);run.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
          };
          render();
          for(let i=0;i<100 && !nativeImageLoads.some(image=>image.path===page && image.width);i++){
            await new Promise(resolve=>setTimeout(resolve,20));
          }
          if(!nativeImageLoads.some(image=>image.path===page && image.width))throw Error('Missing atlas '+page);
          inspected.env.invalidateUI();render();
        }
        const track=run.ui.capEl.querySelector('.zx-catch-track');
        return {active:true,pips:track.querySelectorAll('.zx-catch-pips .on').length,
          caption:track.querySelector('small').textContent,hidden:run.enemies.scale[ball.index]<.01};
      },{frame,breakAt});
      if(frame===96){
        assert.equal(state.active,false);
        assert.equal(state.state,'play');
        if(breakAt)assert.deepEqual(state.outcomes,['escaped']);
        else assert.equal(state.capture,'done');
        continue;
      }
      assert.equal(state.active,true);
      assert.equal(state.hidden,frame>=30);
      assert.equal(state.pips,Math.min(breakAt||3,[36,52,68].filter(step=>step<=frame).length));
      if(frame>=76)assert.equal(state.caption,breakAt?'抓字失败':'抓字成功');
      else assert.match(state.caption,/抓字中/);
      if(!breakAt && [52,76].includes(frame))await page.screenshot({path:path.join(dir,'福袋捕捉-'+frame+'.png')});
    }
  }
  console.log('Verified three escape stages, successful capture, flash result and settlement at four seconds.');
}
