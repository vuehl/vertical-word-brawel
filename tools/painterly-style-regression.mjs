import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewPainterlyStyle(page,dir,moves){
  const report={environment:'Compiled WeChat game / Chrome SwiftShader; staged inputs and camera positions, not phone FPS.',screens:[],moves:[],budgets:[]};
  await page.setViewport({width:900,height:760,deviceScaleFactor:1});
  await page.evaluate(async()=>{window.dispatchEvent(new Event('resize'));await Promise.all(app.run.terrain.paperAssets.photoJobs);});
  const shot=async name=>{
    await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push(name);
    const {data,info}=await sharp(path.join(dir,name+'.png')).resize(180,152).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let black=0,white=0;for(let i=0;i<data.length;i+=3){if(data[i]+data[i+1]+data[i+2]===0)black++;if(data[i]>250&&data[i+1]>250&&data[i+2]>250)white++;}
    assert.ok(black/(info.width*info.height)<.02,'No invalid material/shadow regions: '+name);
    assert.ok(white/(info.width*info.height)<.05,'Preserve painted surface detail: '+name);
  };
  for(const [name,x,z] of [['scene-desk',0,0],['scene-storybooks',-16,6],['scene-marble-run',12,-7],['scene-toys',16,25]]){
    await page.evaluate(([x,z])=>{vfxSetup();app.run.enemies.clear();app.run.player.pos.set(x,0,z);app.run.camTarget.copy(app.run.player.pos);vfxDraw(false);},[x,z]);
    await shot(name);
  }
  report.materials=await page.evaluate(()=>{
    const a=app.run.terrain.paperAssets;
    return {plastic:a.mats.get('workshop-plastic').roughness,wood:a.mats.get('maple-joinery').roughness,paper:a.mats.get('paper-edges').roughness,
      finish:[...a.mats.values()].filter(m=>m.isMeshStandardMaterial).every(m=>m.userData.inkPaint),
      normals:[...a.bevels.getAttribute('normal').array].every(Number.isFinite),photos:a.photos.size,lights:app.run.terrain.workshopPointLights.length};
  });
  assert.equal(report.materials.plastic,1);assert.equal(report.materials.wood,1);assert.equal(report.materials.paper,1);
  assert.ok(report.materials.finish&&report.materials.normals);assert.equal(report.materials.photos,4);assert.equal(report.materials.lights,4);
  await page.evaluate(()=>{app.run.roomLightsOn=false;app.run.pushLook();vfxDraw(false);});await shot('scene-night');
  await page.evaluate(()=>{app.run.roomLightsOn=true;app.run.pushLook();});
  for(const key of ['flamethrower','hydro-pump','razor-leaf','thunderbolt']){
    const id=moves.find(m=>m.key===key).id;
    const sample=await page.evaluate(({id,key})=>{
      vfxSetup();const r=app.run;r.player.addMove(id);r.player.moves[0].timer=0;r.player.moves[0].mods.dur=3;
      vfxAdvance(key==='hydro-pump'?35:25);
      return {key,damage:r.player.moves[0].damageDone,splats:[...r.vfx.groundN.shape.slice(0,r.vfx.groundN.n)].filter(s=>s===141||s===142).length,
        droplets:[...r.vfx.norm.shape.slice(0,r.vfx.norm.n)].filter(s=>s===143).length};
    },{id,key});
    assert.ok(sample.damage>0,'Actual move must damage a target: '+key);assert.ok(sample.splats>0,'Actual hit emits pigment: '+key);report.moves.push(sample);await shot('paint-'+key);
  }
  // Record the new continuous jet in the actual game, aiming horizontally so
  // its travelling lobes and thin trailing sparks can be compared to the GIF.
  await page.evaluate(()=>{
    vfxSetup();const r=app.run,e=r.enemies;
    for(let i=0;i<e.n;i++){e.x[i]=i<3?5:9;e.z[i]=(i-1)*1.6;}e.update();r.lockTarget=1;
  });
  const id=moves.find(m=>m.key==='flamethrower').id;
  await page.evaluate(id=>{app.run.player.addMove(id);app.run.player.moves[0].timer=0;app.run.player.moves[0].mods.dur=3;vfxAdvance(5);},id);
  const frames=[];
  for(let i=0;i<20;i++){await page.evaluate(()=>vfxAdvance(1,1/20));frames.push(await page.screenshot());}
  const buffers=await Promise.all(frames.map(f=>sharp(f).resize(720,608).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:720,height:608*buffers.length,channels:4,pageHeight:608}}).gif({delay:Array(buffers.length).fill(50),loop:0}).toFile(path.join(dir,'travelling-fire-and-paint.gif'));
  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();const r=app.run,v=r.vfx.crafted;
      for(let frame=0;frame<50;frame++){for(let i=0;i<90;i++)v.paintSplash(i%2?'fire':'water',i%8-4,.26,-Math.floor(i/8)*.2,1.2,true);r.vfx.update(1/60);}
      const max={quality,stamps:r.vfx.groundN.n,particles:r.vfx.norm.n,particleLimit:r.performance.normalParticles};
      r.vfx.clear();v.paintSplash('water',0,.26,-3,1,true);const life=r.vfx.groundN.life[0];r.vfx.update(0);max.paused=r.vfx.groundN.life[0]===life;
      for(let i=0;i<150;i++)r.vfx.update(1/60);max.expired=r.vfx.groundN.n===0&&r.vfx.norm.n===0;
      r.hideOwnFx=true;v.paintSplash('fire',0,.26,-3,1);max.hidden=r.vfx.groundN.n===0;r.hideOwnFx=false;return max;
    },quality);
    assert.ok(sample.stamps<=({low:48,medium:96,high:160})[quality]);assert.ok(sample.particles<=sample.particleLimit);assert.ok(sample.paused&&sample.expired&&sample.hidden);report.budgets.push(sample);
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));vfxSetup();vfxDraw(false);});await shot('phone-scene');
  fs.writeFileSync(path.join(dir,'painterly-style-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Painterly style verified: scene finishes, day/night, real fire/water/leaf/lightning hits, bounded paint stamps, pause, expiry and phone layout.');
  return report;
}
