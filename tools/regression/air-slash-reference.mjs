import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import atlas from '../../resources/public/assets/vfx/air-slash-reference.json' with {type:'json'};

export async function reviewAirSlashReference(page,dir){
  fs.mkdirSync(dir,{recursive:true});
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.r.sizeKey='';app.r.dynRes=1;app.r.resize();
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard',seed:20261126}))throw Error('Wind run failed');
    window.setupAirSlash=async(dx=0,dz=-1)=>{
      vfxSetup();const r=app.run,p=r.player,e=r.enemies;
      p.setSpecies(16);p.pos.set(0,r.terrain.surface(0,0),0);p.vel.set(0,0,0);r.camTarget.copy(p.pos);
      p.stats.critChance=p.stats.megaCrit=0;r.hitstopT=0;
      r.hints.on=false;r.hideOwnFx=false;r.input.stickX=r.input.stickY=0;
      // Live targets inside the lane, beside a wing, outside it, and behind.
      e.clear();
      const points=[[0,4],[2.8,9],[-2.8,14],[7,7],[0,-5],[0,24]];
      window.airSlashTargets=points.map(([side,forward])=>{
        const x=dx*forward-dz*side,z=dz*forward+dx*side,id=e.spawn(74,x,z,1,1,0);
        e.x[id]=x;e.z[id]=z;e.y[id]=p.pos.y;e.radius[id]=.55;e.hp[id]=e.maxHp[id]=1e7;return id;
      });
      e.update();r.lockTarget=airSlashTargets[0];
      p.addMove(403);p.moves[0].timer=999;
      await r.vfx.crafted.prepareMoveTexture('wind-air-slash');
      await r.sprites.prepareHeroForm(16);r.updateCamera(1);vfxDraw();
    };
  });
  const samples=[];
  for(const hz of [15,30,60,120])for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-Math.SQRT1_2,-Math.SQRT1_2]]){
    await page.evaluate(({dx,dz})=>setupAirSlash(dx,dz),{dx,dz});
    const sample=await page.evaluate(hz=>{
      const r=app.run,p=r.player,e=r.enemies,art=r.vfx.crafted.windMoves,m=p.moves[0];
      m.timer=0;r.castMove(0,m,0);m.timer=999;
      const hits=airSlashTargets.map(()=>0),frames=new Set();let peak=0;
      for(let i=0;i<hz;i++){
        const before=airSlashTargets.map(id=>e.hp[id]);
        vfxAdvance(1,1/hz,false);m.timer=999;
        airSlashTargets.forEach((id,j)=>{if(e.hp[id]<before[j])hits[j]++;});
        if(art.mesh.count)frames.add(art.frames.getX(0));peak=Math.max(peak,art.mesh.count);
      }
      return {hits,frames:[...frames],peak,remaining:art.mesh.count,waves:art.waves.length};
    },hz);
    assert.deepEqual(sample.hits,[1,1,1,0,0,0],JSON.stringify({hz,dx,dz,...sample}));assert.equal(sample.peak,1);
    assert.ok(sample.frames.length>=5);assert.equal(sample.remaining,0);assert.equal(sample.waves,0);
    samples.push({hz,dx,dz,...sample});
  }
  const settings=await page.evaluate(async()=>{
    const results=[];
    for(const mode of ['low','off','clear']){
      await setupAirSlash();const r=app.run,m=r.player.moves[0],art=r.vfx.crafted.windMoves;
      if(mode==='low'){app.meta.profile.settings.quality='low';app.applySettings();}
      if(mode==='off')r.hideOwnFx=true;
      m.timer=0;r.castMove(0,m,0);m.timer=999;vfxAdvance(5,1/60,false);
      if(mode==='clear'){r.vfx.clear();r.projectiles.render();}
      results.push({mode,count:art.mesh.count,damage:m.damageDone});
      r.hideOwnFx=false;app.meta.profile.settings.quality='high';app.applySettings();
    }
    return results;
  });
  for(const row of settings){assert.ok(row.damage>0);assert.equal(row.count,row.mode==='low'?1:0);}
  await page.evaluate(async()=>{
    if(!await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard',seed:20261126}))throw Error('Recording run failed');
    await setupAirSlash();
  });
  const raw=[],referenceFile=fileURLToPath(new URL('../../resources/art/air-slash-reference/空气斩.gif',import.meta.url));
  const frames=[];
  for(let i=0;i<50;i++){
    const state=await page.evaluate(({i,startMs})=>{
      const r=app.run,m=r.player.moves[0];
      if(i*20===startMs){m.timer=0;r.castMove(0,m,0);m.timer=999;}
      else if(i>0)vfxAdvance(1,.02,false);
      vfxDraw();const art=r.vfx.crafted.windMoves;
      return {timeMs:i*20,count:art.mesh.count,frame:art.mesh.count?art.frames.getX(0):null,damage:m.damageDone};
    },{i,startMs:atlas.sourceStartMs});
    const live=await page.screenshot();
    if([8,12,16,20,24,27].includes(i))fs.writeFileSync(path.join(dir,'实机-'+i+'.png'),live);
    const source=await sharp(referenceFile,{page:i}).removeAlpha().png().toBuffer();
    const resized=await sharp(live).resize(390,844).removeAlpha().png().toBuffer();
    const pair=await sharp({create:{width:782,height:844,channels:3,background:'#243041'}})
      .composite([{input:source,left:0,top:0},{input:resized,left:392,top:0}]).removeAlpha().raw().toBuffer();
    raw.push(pair);frames.push(state);
  }
  assert.deepEqual(frames.slice(7,28).map(frame=>frame.frame),Array.from({length:21},(_,i)=>i));
  assert.ok(frames.slice(28).every(frame=>frame.count===0));
  await sharp(Buffer.concat(raw),{raw:{width:782,height:844*raw.length,channels:3,pageHeight:844}})
    .gif({delay:20,loop:0,effort:3,dither:.2}).toFile(path.join(dir,'空气斩-原片与实机.gif'));
  const game=path.resolve(process.env.POKEBONK_GAME||path.join(import.meta.dirname,'../../minigame'));
  const assetIndex=JSON.parse(fs.readFileSync(path.join(game,'assets.js'),'utf8').replace(/^module\.exports\s*=\s*/,'').replace(/;\s*$/,''));
  const build=Object.fromEntries(['assets.js',assetIndex.packRoots.art+'/assets.br','play/presentation.js','play/combat.js'].map(file=>
    [file,createHash('sha256').update(fs.readFileSync(path.join(game,file))).digest('hex')]));
  fs.writeFileSync(path.join(dir,'实机验证.json'),JSON.stringify({environment:'Compiled WeChat package in Chrome SwiftShader, 390 × 844 at 2x; not phone FPS.',source:atlas.sha256,build,samples,settings,frames},null,2)+'\n');
  console.log('Air Slash verified:',samples.length,'direction/frame-rate cases; 50 reference exposures; settings and cleanup.');
}
