import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewWindAnimation(page,dir){
  const root=path.resolve(import.meta.dirname,'..');
  const fixtures={};
  for(const [state,key] of [['idle','idle'],['walk','walk'],['death','faint']]){
    const data=JSON.parse(fs.readFileSync(path.join(root,'source/src/wind-'+state+'-anim.json'),'utf8'));
    let png=fs.readFileSync(path.join(root,'source/public/assets/glyphs',data.atlas.image));
    if(data.atlas.mode==='L'){
      // Independent reference decoder: libvips joins the source gray channel
      // to a constant RGB image; the game performs its own Canvas conversion.
      const {w:width,h:height,color:[r,g,b]}=data.atlas;
      const mask=await sharp(png).extractChannel(0).raw().toBuffer();
      png=await sharp({create:{width,height,channels:3,background:{r,g,b}}})
        .joinChannel(mask,{raw:{width,height,channels:1}}).png().toBuffer();
    }
    fixtures[state]={data,key,png:'data:image/png;base64,'+png.toString('base64')};
  }
  const rig=JSON.parse(fs.readFileSync(path.join(root,'source/src/hero-rigs.json'),'utf8'))['16'];
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async({fixtures,rig})=>{
    app.toMenu();
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Cannot start wind');
    app.halted=true;
    const r=app.run,p=r.player;
    r.state='play';r.enemies.clear();r.director.update=()=>{};r.capture.update=()=>{};
    r.ui.hideModal();p.moves=Array(4).fill(null);
    Object.assign(p,{speedNow:0,grounded:true,gliding:false,swimNow:false,slideT:0,hurtT:0,attackT:0,ultPoseT:0,heroPose:null,firePose:null,windIdle:undefined});
    inspected.doc.querySelectorAll('.zx-intro,.evo-reveal,.ultcut,.banner,.run-hint').forEach(n=>n.remove());
    const get=r.sprites.getPlayerGlyph;
    r.sprites.getPlayerGlyph=(...args)=>{
      const batch=get(...args);window.windObserved={frame:args[3],texture:batch.material.uniforms.zxGlyph.value,batch};return batch;
    };
    window.windDraw=()=>{r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    window.windFixtures=fixtures;
    for(const fixture of Object.values(fixtures)){
      const image=new Image();image.src=fixture.png;await image.decode();fixture.image=image;
      if(fixture.data.atlas.mode==='L'){
        // The decoded runtime mask is a canvas. Match the source surface type
        // so Canvas uses the same resampling filter as the independent reference.
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
        canvas.getContext('2d').drawImage(image,0,0);fixture.image=canvas;
      }
    }
    const strokes=rig.groups.flatMap(g=>g.strokes),rs=(80/96)/Math.max(rig.frame.width,rig.frame.height);
    const left=Math.min(...strokes.map(s=>s.x)),right=Math.max(...strokes.map(s=>s.x+s.w));
    const bottom=Math.max(...strokes.map(s=>s.y+s.h));
    const centerOffset=((left+right)/2-rig.frame.left-rig.frame.width/2)*rs;
    const footGap=.5-(bottom-rig.frame.top-rig.frame.height/2)*rs;
    // Reference pixels use the source PNG and the JSON's direct setTransform
    // equation, independently of the packed image and runtime transform calls.
    window.windVerify=state=>{
      const {frame,texture}=windObserved,fixture=windFixtures[state],data=fixture.data;
      if(!frame)throw Error('Missing '+state+' frame');
      const frames=data.anims[fixture.key].frames;
      const index=frames.findIndex(f=>JSON.stringify(f.m)===JSON.stringify(frame.m)&&JSON.stringify(f.t)===JSON.stringify(frame.t));
      if(index<0)throw Error('Unexpected affine frame');
      const authored=frames[index],tile=data.tiles[authored.tile],first=frames[0],firstTile=data.tiles[first.tile];
      const width=firstTile.w,center=first.t[0]+width/2,bottom=first.t[1]+firstTile.h;
      const canvasHeight=data.canvas.h+(state==='walk'?64:0);
      const renderScale=(right-left)*rs/(width/canvasHeight),size=256,s=size/canvasHeight;
      const mask=document.createElement('canvas');mask.width=mask.height=size;const ctx=mask.getContext('2d');
      const [a,b,c,d]=authored.m,[tx,ty]=authored.t;
      ctx.setTransform(a*s,b*s,c*s,d*s,size*(.5+centerOffset/renderScale)+(tx-center)*s,size*(1-footGap/renderScale)+(ty-bottom)*s);
      ctx.drawImage(fixture.image,tile.x,tile.y,tile.w,tile.h,0,0,tile.w,tile.h);
      const expected=document.createElement('canvas');expected.width=expected.height=size;const ink=expected.getContext('2d');
      const radius=size*14/192/renderScale;
      for(let i=0;i<32;i++)ink.drawImage(mask,Math.round(radius*Math.cos(i*Math.PI/16)),Math.round(radius*Math.sin(i*Math.PI/16)));
      ink.globalCompositeOperation='source-in';ink.fillStyle='#27232f';ink.fillRect(0,0,size,size);
      ink.globalCompositeOperation='source-over';ink.drawImage(mask,0,0);
      const actual=texture.image.getContext('2d').getImageData(0,0,size,size).data,reference=ink.getImageData(0,0,size,size).data;
      let maxError=0,premultipliedError=0,alphaError=0,visible=0,edge=0;
      for(let i=0;i<actual.length;i+=4){
        if(actual[i+3]||reference[i+3]){
          for(let k=0;k<4;k++)maxError=Math.max(maxError,Math.abs(actual[i+k]-reference[i+k]));
          alphaError=Math.max(alphaError,Math.abs(actual[i+3]-reference[i+3]));
          for(let k=0;k<3;k++)premultipliedError=Math.max(premultipliedError,Math.abs(actual[i+k]*actual[i+3]/255-reference[i+k]*reference[i+3]/255));
          if(actual[i+3]){visible++;const x=i/4%size,y=Math.floor(i/4/size);if(x===0||x===255||y===0||y===255)edge++;}
        }
      }
      return {index,image:frame.layout.image,renderScale:frame.layout.renderScale,maxError,premultipliedError,alphaError,visible,edge};
    };
    windDraw();
  },{fixtures,rig});

  const report={environment:'Compiled WeChat package in Chrome / real Canvas and WebGL',idle:[],walk:[],death:[]};
  const sample=async(state,seconds)=>page.evaluate(({state,seconds})=>{
    app.run.time+=seconds;app.run.realTime+=seconds;windDraw();return windVerify(state);
  },{state,seconds});
  const screenshots={idle:[],walk:[],death:[]};
  for(const state of (process.argv.includes('--walk-only')?['walk']:['idle','walk','death'])){
    if(state==='walk')await page.evaluate(()=>{app.run.player.speedNow=2;windDraw();});
    if(state==='death'){
      const dead=await page.evaluate(()=>{
        const r=app.run,p=r.player;
        Object.assign(p,{hp:1,iframes:0,invisT:0,revives:0});p.items.clear();r.godMode=false;r.frozen=0;
        p.hurt(1e9,'normal',-1,NaN,NaN,true,0,-1,{evade:0});windDraw();
        return {dead:p.dead,state:r.state,hasPlayback:typeof p.windFaint==='function',idleCleared:p.windIdle===undefined,walkCleared:p.windWalk===undefined};
      });
      assert.deepEqual(dead,{dead:true,state:'dead',hasPlayback:true,idleCleared:true,walkCleared:true});report.trigger=dead;
    }
    const count=fixtures[state].data.anims[fixtures[state].key].frames.length;
    const visited=new Set();let last=-1,loops=0;
    const steps=Math.ceil((state==='death'?1:2)*count*fixtures[state].data.anims[fixtures[state].key].frameMs*60/1000)+8;
    for(let i=0;i<steps;i++){
      const item=await sample(state,i===0?0:1/60);
      assert.equal(item.image,'wind-'+state+'-atlas.png');
      // Canvas and PNG decoders may round RGB differently at near-zero alpha.
      // Compare coverage and premultiplied color, which determine the visible result.
      assert.ok(item.alphaError<=2&&item.premultipliedError<=2,'Affine pixel mismatch: '+JSON.stringify(item));
      assert.ok(item.visible>3000,'Frame must contain visible art');assert.equal(item.edge,0,'Artwork/outline must not clip: '+JSON.stringify(item));
      if(last>=0&&item.index<last)loops++;
      if(!visited.has(item.index)){
        visited.add(item.index);report[state].push(item);
        screenshots[state].push(await page.screenshot());
      }
      last=item.index;
    }
    assert.equal(visited.size,count,'Every authored frame must render');
    if(state!=='death')assert.ok(loops>=2,state+' must repeat');
    else {assert.equal(loops,0,'Death must not repeat');assert.equal(last,count-1,'Death must hold the final frame');}
    const buffers=screenshots[state],raw=[];
    for(const buffer of buffers)raw.push(await sharp(buffer).ensureAlpha().raw().toBuffer());
    const {width,height}=await sharp(buffers[0]).metadata();
    await sharp(Buffer.concat(raw),{raw:{width,height:height*raw.length,channels:4,pageHeight:height}})
      .gif({delay:Array(raw.length).fill(42),loop:state==='death'?1:0}).toFile(path.join(dir,'wind-'+state+'.gif'));
    fs.writeFileSync(path.join(dir,'wind-'+state+'.png'),buffers[state==='death'?buffers.length-1:0]);
    if(state==='walk'){
      report.movement=await page.evaluate(()=>{
        const r=app.run,p=r.player,start=p.pos.clone();
        r.input.stickX=1;r.input.stickY=0;
        for(let i=0;i<30;i++)r.update(1/60);
        windDraw();
        const moving={distance:p.pos.distanceTo(start),speed:p.speedNow,image:windObserved.frame?.layout.image};
        r.input.stickX=r.input.stickY=0;
        for(let i=0;i<90;i++)r.update(1/60);
        windDraw();
        return {moving,stopped:{speed:p.speedNow,image:windObserved.frame?.layout.image}};
      });
      assert.ok(report.movement.moving.distance>.1,'Movement input must move the character');
      assert.equal(report.movement.moving.image,'wind-walk-atlas.png');
      assert.ok(report.movement.stopped.speed<=.6);
      assert.equal(report.movement.stopped.image,'wind-idle-atlas.png');
    }
  }
  fs.writeFileSync(path.join(dir,'wind-animation.json'),JSON.stringify(report,null,2));
  console.log('Wind animation verified:',JSON.stringify({frames:{idle:report.idle.length,walk:report.walk.length,death:report.death.length},movement:report.movement,lethalHit:report.trigger}));
}
