import assert from 'node:assert/strict';
import path from 'node:path';
import {formCopy} from '../../source/src/data/form-copy.js';

export async function reviewUltimateCast(page,dir){
  await page.waitForFunction(()=>['ultimate-cast','nameplate-blade'].every(name=>
    window.nativeImageLoads.some(image=>image.path===window.__host.files.pathFor('assets/vfx/'+name+'.webp')&&image.width>0)));
  await page.waitForFunction(()=>window.nativeImageLoads.some(image=>
    image.path===window.__host.files.pathFor('fonts/cast-title-glyphs.webp')&&image.width>0));
  const routes=[[4],[4,5],[4,5,6],[16],[16,17],[16,17,18],[16,58],[16,58,59]];
  const cases=routes.map(route=>({route,growth:0}));
  cases.push({route:[4],growth:2});
  for(const {route,growth} of cases){
    const species=route.at(-1),name=formCopy[species].ultimate[1],color=route[0]===4?0xff641c:0xc1f0ef;
    const started=await page.evaluate(async ({route:[base,...evolutions],growth})=>{
      if(app.run.player.speciesId!==base||app.run.ult.uses){
        await app.startRun({species:base,biome:'forest',tier:0,boosts:[],mode:'standard'});
      }
      app.halted=true;
      const run=app.run,env=inspected.env;
      for(const form of evolutions)run.player.setSpecies(form);
      run.player.growth=growth;
      run.update(1/60);
      run.ult.add(1);
      run.ui.ultHud(run);
      env.drawUI(app.r.renderer);
      const screen=run.r.canvas.getBoundingClientRect(),button=run.ui.touch.ult.getBoundingClientRect();
      const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
      window.tap(x,y,'down',11);
      window.tap(x+60,y,'move',11);
      const before=run.ult.uses;
      const buttonX=button.x+button.width/2-screen.x,buttonY=button.y+button.height/2-screen.y;
      window.tap(buttonX,buttonY);
      const tick=()=>{run.update(1/60);run.input.endFrame();};
      tick();
      const cue=run.ult.castBanner,p=run.player;
      const step=(frames=1)=>{
        for(let i=1;i<frames;i++)tick();
        const {x,z}=p.pos;
        tick();
        return [p.pos.x-x,p.pos.z-z];
      };
      cue.start=env.performance.now()-700;
      const [held]=step();
      window.tap(x-60,y,'move',11);
      // Allow the normal joystick smoothing to reverse direction.
      const [turned]=step(8);
      window.tap(x-60,y,'up',11);
      const released=run.ui.touch.stickId===-1;
      window.tap(x,y,'down',12);
      window.tap(x,y+60,'move',12);
      const [,restarted]=step(8);
      window.tap(x,y+60,'up',12);
      // Repeat the skill press while the steering thumb is lifted. The button
      // thumb can remain on the screen when the steering thumb lands again.
      window.tap(buttonX,buttonY,'down',1);
      const buttonOnly=run.ui.touch.touches===1&&run.ui.touch.stickId===-1;
      window.tap(x,y,'down',12);
      window.tap(x,y-60,'move',12);
      const owner=run.ui.touch.stickId;
      const [,withButton]=step(8);
      window.tap(buttonX,buttonY,'up',1);
      return {uses:run.ult.uses-before,name:cue.name,color:cue.color,tier:cue.tier,
        held:held>0,turned:turned<0,released,restarted:restarted>0,buttonOnly,owner,withButton:withButton<0};
    },{route,growth});
    const tier=Math.min(2,route.length-1+growth);
    assert.deepEqual(started,{uses:1,name,color,tier,held:true,turned:true,released:true,restarted:true,
      buttonOnly:true,owner:12,withButton:true},'Cast and steer: '+species);
    const expectedLayers=[...(tier>=2?['flame']:[]),...(tier>=1?['blade']:[])];
    const titleX=[];
    for(const [ms,hidden] of [[200,false],[333,true],[500,true],[700,true],[1000,true],[2010,false]]){
      const frame=await page.evaluate(ms=>{
        const run=app.run,env=inspected.env,renderer=app.r.renderer,gl=renderer.getContext();
        const cue=run.ult.castBanner;
        run.renderWorld(0);app.r.render(0);
        const draw=gl.drawArrays,observed=new Set(),positions=[];
        const proto=CanvasRenderingContext2D.prototype,drawImage=proto.drawImage;
        // Each title row blits from a two-state strip (gradient and impact white).
        // Record its real drawing position, including the overshoot and return.
        proto.drawImage=function(image,...args){
          if(args.length===8&&image.height===args[3]*2&&image.width===args[2]&&args[4]<0&&args[5]<0){
            const matrix=this.getTransform();positions.push(matrix.e/Math.hypot(matrix.a,matrix.b));
          }
          return drawImage.call(this,image,...args);
        };
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
          return {hidden,finished:run.ult.castBanner==null,layers:[...observed],positions};
        }finally{gl.drawArrays=draw;proto.drawImage=drawImage;}
      },ms);
      if([333,500,700].includes(ms)){
        assert.equal(frame.positions.length,Math.ceil(Array.from(name).length/2),'Draw every title row from the supplied glyphs');
        titleX.push(frame.positions[0]);
      }
      assert.equal(frame.hidden,tier>=2&&hidden,'HUD visibility: '+species+' at '+ms);
      assert.equal(frame.finished,ms>=2000);
      assert.ok(frame.layers.every(layer=>expectedLayers.includes(layer)),'Unexpected layer: '+species+' at '+ms);
      if(ms===500||ms===700)assert.deepEqual(frame.layers,expectedLayers,'Cast layers: '+species+' at '+ms);
      if(ms===(tier>=2?333:500))await page.screenshot({path:path.join(dir,formCopy[species].word+(growth?'-成长':'')+'-释放.png')});
      if(ms===1000)assert.deepEqual(frame.layers,tier>=2?['flame']:[],'Blade sweep has ended: '+species);
      if(ms>=2000)assert.deepEqual(frame.layers,[]);
    }
    const recovered=await page.evaluate(()=>{
      const run=app.run,env=inspected.env,screen=run.r.canvas.getBoundingClientRect();
      const x=env.innerWidth*.5-screen.x,y=env.innerHeight*.64-screen.y;
      const advance=()=>{for(let i=0;i<8;i++){run.update(1/60);run.input.endFrame();}};
      const startX=run.player.pos.x;
      window.tap(x+60,y,'move',12);advance();
      const turned=run.player.pos.x>startX;
      window.tap(x+60,y,'up',12);
      const startZ=run.player.pos.z;
      window.tap(x,y,'down',1);window.tap(x,y+60,'move',1);advance();
      window.tap(x,y+60,'up',1);
      return {turned,restarted:run.player.pos.z>startZ};
    });
    assert.deepEqual(recovered,{turned:true,restarted:true},'Steer after HUD recovery: '+species);
    assert.ok(titleX[0]>titleX[2]&&titleX[1]<titleX[2],'Travel left, overshoot and rebound');
    assert.ok(Math.abs(titleX[2]-titleX[1]-5.2)<.8,'Rebound by 10% of the 52-unit travel');
    console.log('Verified cast, layered rendering and HUD recovery:',name);
  }
}
