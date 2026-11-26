import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function reviewUltimateReady(page,dir,{expectMissing=false}={}){
  await page.evaluate(()=>{
    app.halted=true;
    const gl=app.r.renderer.getContext(),textures=new Map();
    const original={image:gl.texImage2D,subImage:gl.texSubImage2D,draw:gl.drawArrays};
    let frames=[],irisDraws=[];
    const irisUniforms=new WeakMap();
    function uploaded(args){
      const pixels=args.at(-1);
      if(!(pixels instanceof Uint8Array))return;
      let light=0;const rgb=[0,0,0];
      for(let i=0;i<pixels.length;i+=4){
        if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>pixels[i+3]+4){
          light++;
          for(let c=0;c<3;c++)rgb[c]+=pixels[i+c];
        }
      }
      const texture=gl.getParameter(gl.TEXTURE_BINDING_2D);
      if(light)textures.set(texture,{light,rgb});else textures.delete(texture);
    }
    gl.texImage2D=function(...args){uploaded(args);return original.image.apply(this,args);};
    gl.texSubImage2D=function(...args){uploaded(args);return original.subImage.apply(this,args);};
    gl.drawArrays=function(...args){
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      if(!irisUniforms.has(program))irisUniforms.set(program,gl.getUniformLocation(program,'irisActive'));
      const flag=irisUniforms.get(program);
      if(flag&&gl.getUniform(program,flag)){
        const read=name=>Array.from(gl.getUniform(program,gl.getUniformLocation(program,name)));
        const bounds=read('irisBounds'),viewport=Array.from(gl.getParameter(gl.VIEWPORT));
        const u=Math.abs(bounds[0])>Math.abs(bounds[0]+bounds[2]) ? .04 : .96;
        const v=Math.abs(bounds[1])>Math.abs(bounds[1]+bounds[3]) ? .04 : .96;
        const sample=()=>{
          const rgba=new Uint8Array(4);
          gl.readPixels(viewport[0]+Math.floor(u*viewport[2]),viewport[1]+Math.floor((1-v)*viewport[3]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
          return Array.from(rgba).slice(0,3);
        };
        const before=sample(),result=original.draw.apply(this,args);
        irisDraws.push({motion:read('irisMotion'),tone:read('irisTone'),viewport,before,after:sample()});
        return result;
      }else{
        const light=textures.get(gl.getParameter(gl.TEXTURE_BINDING_2D));
        if(light)frames.push({...light,viewport:Array.from(gl.getParameter(gl.VIEWPORT))});
      }
      return original.draw.apply(this,args);
    };
    window.readyGlowProbe={
      draw(stage,since=stage==='flash'?.12:1.65){
        const run=app.run;
        run.ui.hideModal();run.enemies.clear();run.state=stage==='paused'?'paused':'play';
        run.player.dead=stage==='dead';run.ult.active=stage==='active'?1:0;run.ult.castBanner=null;
        run.ult.charge=stage==='charging'?.95:1;
        run.ult.readyBlinkAt=stage==='charging'?null:run.time-1.4;
        run.ult.readyFlashAt=stage==='charging'?null:run.time-since;
        run.ui.ultHud(run);run.renderWorld(0);app.r.render(0);
        frames=[];irisDraws=[];inspected.env.drawUI(app.r.renderer);
        const seal=run.ui.touch.ult.querySelector('.zx-ult-progress');
        return {layers:frames,iris:irisDraws,face:!!seal.readyFace,button:seal.getBoundingClientRect()};
      },
      diamonds(){
        const run=app.run,seal=run.ui.touch.ult.querySelector('.zx-ult-progress');
        const ctx=seal.getContext('2d'),w=seal.width,h=seal.height;
        const read=t=>{
          run.ult.readyFlashAt=run.time-t;run.ui.ultHud(run);
          return ctx.getImageData(0,0,w,h).data;
        };
        // The existing attribute icon stays fixed beneath the clipped diamond loop.
        const a=read(0),b=read(.525),c=read(2.525),end=read(0);
        if(a.some((v,i)=>v!==end[i]))throw Error('The base attribute icon changed');
        let changed=0,outside=0,label=0,loopError=0;
        const leaks=[];
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          const i=(y*w+x)*4,px=(x+.5)*84/w,py=(y+.5)*84/h;
          for(let channel=0;channel<4;channel++){
            if(b[i+channel]!==c[i+channel])loopError++;
            if(a[i+channel]===b[i+channel])continue;
            changed++;
            if(Math.hypot(px-42,py-42)>35.5){
              outside++;
              if(leaks.length<6)leaks.push([px,py,channel,a[i+channel],b[i+channel]]);
            }
            if(px>23&&px<61&&py>59&&py<72)label++;
          }
        }
        const filled=read(.99),idx=(Math.floor(h*42/84)*w+Math.floor(w*13/84))*4;
        return {changed,outside,label,loopError,leaks,ink:Array.from(filled.slice(idx,idx+3))};
      },
      release(){
        this.draw('breath');
        const run=app.run;
        run.ult.fire();
        run.ult.castBanner=null;
        run.ui.ultHud(run);run.renderWorld(0);app.r.render(0);
        frames=[];irisDraws=[];inspected.env.drawUI(app.r.renderer);
        return {layers:frames.length,iris:irisDraws.length,charge:run.ult.charge,
          blink:run.ult.readyBlinkAt,flash:run.ult.readyFlashAt,
          ready:run.ui.touch.ult.classList.contains('ready'),disabled:run.ui.touch.ult.getAttribute('aria-disabled')};
      },
      async boss(){
        this.draw('breath');
        const run=app.run,introBoss=run.introBoss;
        run.introBoss=()=>{};
        try{run.boss.spawn(149,-8,0,false,{hp:1e6});}finally{run.introBoss=introBoss;}
        await run.sprites.prepareGlyphTextures(app.r.renderer);
        run.ui.hud(run);inspected.env.invalidateUI();
        const layer=inspected.hudLayers.find(tile=>tile.id==='boss-health'),draw=layer.draw;
        let tile;
        layer.draw=function(...args){return tile=draw.apply(this,args);};
        const present=()=>{
          run.renderWorld(0);app.r.render(0);frames=[];inspected.env.drawUI(app.r.renderer);
          const pixels=new Uint8Array(tile.width*tile.height*4);
          gl.readPixels(tile.x,gl.drawingBufferHeight-tile.y-tile.height,tile.width,tile.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          return pixels;
        };
        try{
          run.ult.readyBlinkAt=null;
          const baseline=present();
          run.ult.readyBlinkAt=run.time-1.4;
          present();const glowing=present();
          return {slot:tile.slot,layers:frames.length,width:tile.width,height:tile.height,
            mismatchedPixels:glowing.reduce((count,value,i)=>count+(value!==baseline[i]?1:0),0)};
        }finally{layer.draw=draw;run.enemies.clear();run.boss.alive=false;run.ui.hud(run);}
      },
      restore(){
        gl.texImage2D=original.image;gl.texSubImage2D=original.subImage;gl.drawArrays=original.draw;
        const run=app.run;
        if(run){
          run.player.dead=false;run.ult.active=0;run.ult.charge=0;
          run.ult.readyBlinkAt=run.ult.readyFlashAt=null;run.state='play';run.ui.ultHud(run);
        }
        delete window.readyGlowProbe;
      }
    };
  });
  const report={};
  try{
    for(const species of [4,16]){
      await page.evaluate(async species=>{
        if(app.run.player.speciesId!==species){
          if(!await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'}))
            throw app.lastStartError??Error('Ultimate review could not start species '+species);
        }
        app.halted=true;app.run.time=10;app.run.godMode=true;
      },species);
      const states=report[species]={};
      for(const stage of ['charging','flash','breath','active','paused','dead']){
        states[stage]=await page.evaluate(stage=>window.readyGlowProbe.draw(stage),stage);
        const expected=!expectMissing&&['flash','breath'].includes(stage)?2:0;
        assert.equal(states[stage].layers.length,expected,`${species} ${stage}: hero and button light layers`);
        assert.equal(states[stage].iris.length,expected?1:0,`${species} ${stage}: ready iris lifetime`);
        if(expected){
          assert.equal(states[stage].face,true,'The flash uses the current attribute artwork');
          const [hero,button]=states[stage].layers;
          assert.notDeepEqual(hero.viewport,button.viewport,'Character and button glow occupy distinct positions');
          assert.ok(button.viewport[2]>states[stage].button.width,'The light extends outside the button');
          assert.ok(hero.light>0&&button.light>0,'Additive light survives pixels with zero coverage alpha');
          await page.screenshot({path:path.join(dir,`${species}-${stage}.png`)});
        }
      }
      if(!expectMissing){
        states.focus=await page.evaluate(()=>window.readyGlowProbe.draw('flash',.32));
        await page.screenshot({path:path.join(dir,`${species}-focus.png`)});
        states.hold=await page.evaluate(()=>window.readyGlowProbe.draw('breath',3.05));
        const start=states.flash.iris[0],middle=states.focus.iris[0],held=states.breath.iris[0],later=states.hold.iris[0];
        assert.ok(start.motion[0]>middle.motion[0]&&middle.motion[0]>held.motion[0]*2,'The iris contracts from beyond the screen');
        assert.ok(Math.abs(held.motion[0]-39.4)<.01,'Iris lands on the seal edge');
        assert.deepEqual(middle.after,middle.before,'The approaching iris leaves the field outside its local glow untouched');
        assert.deepEqual(later.after,later.before,'The settled orbit leaves background pixels outside the ring untouched');
        assert.ok(later.viewport[2]<middle.viewport[2]/2,'The orbit uses only a small tile after landing');
        assert.equal(later.motion[0],held.motion[0],'The iris never reopens while the skill is ready');
        assert.notEqual(later.motion[1],held.motion[1],'The rim stars keep orbiting');
        states.diamonds=await page.evaluate(()=>window.readyGlowProbe.diamonds());
        const d=states.diamonds;
        assert.ok(d.changed>100,'The sampled diamond wave changes the seal surface');
        assert.deepEqual([d.outside,d.label,d.loopError],[0,0,0],'Circular clipping, release label and two-second loop '+JSON.stringify(d.leaks));
      }
      if(species===4&&!expectMissing){
        states.boss=await page.evaluate(()=>window.readyGlowProbe.boss());
        assert.equal(states.boss.layers,2,'Both glows stay visible alongside boss health');
        assert.ok(states.boss.width>0&&states.boss.height>0,'Boss health is visible');
        assert.equal(states.boss.mismatchedPixels,0,'Glow textures do not overwrite boss health');
      }
      if(!expectMissing){
        states.released=await page.evaluate(()=>window.readyGlowProbe.release());
        assert.deepEqual(states.released,{layers:0,iris:0,charge:0,blink:null,flash:null,ready:false,disabled:'true'},
          'Releasing the ultimate clears the full-charge animation and button state');
      }
    }
    if(!expectMissing){
      const fire=report[4].breath.layers,wind=report[16].breath.layers;
      assert.ok(report[4].diamonds.ink[0]>report[4].diamonds.ink[2]+30,'Fire fills the face with its element color');
      assert.ok(report[16].diamonds.ink[1]>report[16].diamonds.ink[0]+12,'Wind fills the face with its element color');
      for(let i=0;i<2;i++){
        assert.ok(fire[i].rgb[0]>fire[i].rgb[2],'Fire glow retains its warm palette');
        assert.ok(wind[i].rgb[1]>wind[i].rgb[0],'Wind glow retains its cool palette');
      }
    }
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'ready-glow.json'),JSON.stringify(report,null,2));
    console.log(expectMissing?'Reproduced missing hero and ultimate light layers.':'Fire and wind passed: iris focus and orbit, restored brightness, clipped diamond loop, readable label and cleanup.');
  }finally{
    await page.evaluate(()=>window.readyGlowProbe?.restore());
  }
}
