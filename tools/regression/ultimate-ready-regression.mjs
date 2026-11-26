import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function reviewUltimateReady(page,dir,{expectMissing=false}={}){
  await page.evaluate(()=>{
    app.halted=true;
    const gl=app.r.renderer.getContext(),textures=new Map();
    const original={image:gl.texImage2D,subImage:gl.texSubImage2D,draw:gl.drawArrays};
    let frames=[];
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
      const light=textures.get(gl.getParameter(gl.TEXTURE_BINDING_2D));
      if(light)frames.push({...light,viewport:Array.from(gl.getParameter(gl.VIEWPORT))});
      return original.draw.apply(this,args);
    };
    window.readyGlowProbe={
      draw(stage){
        const run=app.run;
        run.ui.hideModal();run.enemies.clear();run.state=stage==='paused'?'paused':'play';
        run.player.dead=stage==='dead';run.ult.active=stage==='active'?1:0;run.ult.castBanner=null;
        run.ult.charge=stage==='charging'?.95:1;
        run.ult.readyBlinkAt=stage==='charging'?null:run.time-1.4;
        run.ult.readyFlashAt=stage==='charging'?null:run.time-(stage==='flash'?.12:1.25);
        run.ui.ultHud(run);run.renderWorld(0);app.r.render(0);
        frames=[];inspected.env.drawUI(app.r.renderer);
        const seal=run.ui.touch.ult.querySelector('.zx-ult-progress');
        return {layers:frames,face:!!seal.readyFace,button:seal.getBoundingClientRect()};
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
        const run=app.run;run.player.dead=false;run.ult.active=0;run.ult.charge=0;
        run.ult.readyBlinkAt=run.ult.readyFlashAt=null;run.state='play';run.ui.ultHud(run);
        delete window.readyGlowProbe;
      }
    };
  });
  const report={};
  try{
    for(const species of [4,16]){
      await page.evaluate(async species=>{
        if(app.run.player.speciesId!==species)await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'single-stage'});
        app.halted=true;app.run.time=10;app.run.godMode=true;
      },species);
      const states=report[species]={};
      for(const stage of ['charging','flash','breath','active','paused','dead']){
        states[stage]=await page.evaluate(stage=>window.readyGlowProbe.draw(stage),stage);
        const expected=!expectMissing&&['flash','breath'].includes(stage)?2:0;
        assert.equal(states[stage].layers.length,expected,`${species} ${stage}: hero and button light layers`);
        if(expected){
          assert.equal(states[stage].face,true,'The flash uses the character cutout inside the seal');
          const [hero,button]=states[stage].layers;
          assert.notDeepEqual(hero.viewport,button.viewport,'Character and button glow occupy distinct positions');
          assert.ok(button.viewport[2]>states[stage].button.width,'The light extends outside the button');
          assert.ok(hero.light>0&&button.light>0,'Additive light survives pixels with zero coverage alpha');
          await page.screenshot({path:path.join(dir,`${species}-${stage}.png`)});
        }
      }
      if(species===4&&!expectMissing){
        states.boss=await page.evaluate(()=>window.readyGlowProbe.boss());
        assert.equal(states.boss.layers,2,'Both glows stay visible alongside boss health');
        assert.ok(states.boss.width>0&&states.boss.height>0,'Boss health is visible');
        assert.equal(states.boss.mismatchedPixels,0,'Glow textures do not overwrite boss health');
      }
    }
    if(!expectMissing){
      const fire=report[4].breath.layers,wind=report[16].breath.layers;
      for(let i=0;i<2;i++){
        assert.ok(fire[i].rgb[0]>fire[i].rgb[2],'Fire glow retains its warm palette');
        assert.ok(wind[i].rgb[1]>wind[i].rgb[0],'Wind glow retains its cool palette');
      }
    }
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'ready-glow.json'),JSON.stringify(report,null,2));
    console.log(expectMissing?'Reproduced missing hero and ultimate light layers.':'Ultimate and hero glow: flash, breath, colors, outer bounds and cleanup passed.');
  }finally{
    await page.evaluate(()=>window.readyGlowProbe?.restore());
  }
}
