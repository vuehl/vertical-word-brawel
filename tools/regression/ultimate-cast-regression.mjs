import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewUltimateCast(page,dir){
  await page.waitForFunction(()=>['ultimate-cast','nameplate-blade'].every(name=>
    window.nativeImageLoads.some(image=>image.path==='play/'+name+'.webp'&&image.width>0)));
  for(const [species,name,color] of [[4,'一点火苗',0xff641c],[16,'阵风',0x5dd7d6]]){
    const started=await page.evaluate(async species=>{
      if(app.run.player.speciesId!==species){
        await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'});
      }
      app.halted=true;
      const run=app.run,env=inspected.env;
      run.update(1/60);
      run.ult.add(1);
      run.ui.ultHud(run);
      env.drawUI(app.r.renderer);
      const screen=run.r.canvas.getBoundingClientRect(),button=run.ui.touch.ult.getBoundingClientRect();
      const before=run.ult.uses;
      window.tap(button.x+button.width/2-screen.x,button.y+button.height/2-screen.y);
      run.simulate(1/60);
      run.input.endFrame();
      return {uses:run.ult.uses-before,name:run.ult.castBanner?.name,color:run.ult.castBanner?.color};
    },species);
    assert.deepEqual(started,{uses:1,name,color});
    for(const [ms,hidden] of [[200,false],[700,true],[2010,false]]){
      const frame=await page.evaluate(ms=>{
        const run=app.run,env=inspected.env,renderer=app.r.renderer,gl=renderer.getContext();
        const cue=run.ult.castBanner;
        run.renderWorld(0);app.r.render(0);
        const draw=gl.drawArrays,observed=new Set();
        gl.drawArrays=function(...args){
          const program=gl.getParameter(gl.CURRENT_PROGRAM);
          const active=gl.getUniformLocation(program,'castActive');
          if(active&&gl.getUniform(program,active)){
            const uv=gl.getUniform(program,gl.getUniformLocation(program,'castUV'));
            observed.add(uv[3]<0?'blade':'flame');
          }
          return draw.apply(this,args);
        };
        try{
          cue.start=env.performance.now()-ms;
          const hidden=env.castHidesUI(run);
          env.drawUI(renderer);
          return {hidden,finished:run.ult.castBanner==null,layers:[...observed]};
        }finally{gl.drawArrays=draw;}
      },ms);
      assert.equal(frame.hidden,hidden);
      assert.equal(frame.finished,ms>=2000);
      if(ms===700){
        assert.deepEqual(frame.layers,['flame','blade']);
        await page.screenshot({path:path.join(dir,(species===4?'炎':'风')+'-释放.png')});
      }else if(ms>=2000)assert.deepEqual(frame.layers,[]);
    }
    console.log('Verified cast, layered rendering and HUD recovery:',name);
  }
}
