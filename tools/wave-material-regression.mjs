import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Invoke after reviewStylizedVFX has initialized vfxSetup/vfxAdvance/vfxDraw.
// Screens and animation use actual water/fire moves and the combat renderer.
export async function reviewWaveMaterial(page,dir,moves){
  const id=moves.find(m=>m.key==='hydro-pump').id,fireId=moves.find(m=>m.key==='fire-blast').id;
  const report={environment:'Actual compiled WeChat game in Chrome SwiftShader; controlled combat inputs, not phone FPS.',samples:[],fire:[],screens:[]};
  await page.setViewport({width:480,height:820,deviceScaleFactor:1});
  const originalLights=await page.evaluate(()=>app.run.roomLightsOn);
  await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  const setup=async(quality,night)=>page.evaluate(({id,quality,night})=>{
    app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();const r=app.run;
    r.roomLightsOn=!night;r.pushLook();r.player.addMove(id);r.player.moves[0].timer=0;r.player.moves[0].mods.dur=3;
    vfxAdvance(35);const rings=r.vfx.rings;
    return {quality,night,damage:r.player.moves[0].damageDone,rings:rings.n,
      ripples:[...rings.style.slice(0,rings.n)].filter(s=>s===2||s===3).length,
      time:rings.mesh.material.uniforms.uWaveTime.value,camera:r.camDist};
  },{id,quality,night});
  for(const [quality,night] of [['low',false],['medium',false],['high',false],['high',true]]){
    const sample=await setup(quality,night);
    assert.ok(sample.damage>0&&sample.ripples>0,'The real water move must damage targets and emit material ripples');
    assert.equal(sample.camera,42);assert.ok(Number.isFinite(sample.time));report.samples.push(sample);
    const name='water-wave-'+quality+(night?'-night':'-day')+'.png';await page.screenshot({path:path.join(dir,name)});report.screens.push(name);
  }
  await setup('high',false);
  const frames=[];
  for(let i=0;i<16;i++){await page.evaluate(()=>vfxAdvance(1,1/20));frames.push(await page.screenshot());}
  const buffers=await Promise.all(frames.map(frame=>sharp(frame).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(buffers),{raw:{width:480,height:820*buffers.length,channels:4,pageHeight:820}})
    .gif({delay:Array(buffers.length).fill(50),loop:0}).toFile(path.join(dir,'water-wave-material-in-game.gif'));
  const fireSetup=async night=>page.evaluate(({id,night})=>{
    app.meta.profile.settings.quality='high';app.applySettings();vfxSetup();const r=app.run;
    r.roomLightsOn=!night;r.pushLook();r.lockTarget=1;r.player.addMove(id);r.player.moves[0].timer=0;
    let detected=false;
    for(let frame=0;frame<90;frame++){
      vfxAdvance(1);const rings=r.vfx.rings;
      if([...rings.style.slice(0,rings.n)].includes(6)){detected=true;break;}
    }
    if(detected)vfxAdvance(3);
    const p=r.vfx.rings;
    return {key:'fire-blast',night,damage:r.player.moves[0].damageDone,detected,
      fireRings:[...p.style.slice(0,p.n)].filter(s=>s===6).length,
      radii:[...p.r1.slice(0,p.n)].filter((_,i)=>p.style[i]===6)};
  },{id:fireId,night});
  for(const night of [false,true]){
    const sample=await fireSetup(night);
    assert.ok(sample.detected&&sample.fireRings>0&&sample.damage>0,'Actual fire-blast explosion must emit a style 6 material wave');report.fire.push(sample);
    const name='fire-blast-wave-'+(night?'night':'day')+'.png';await page.screenshot({path:path.join(dir,name)});report.screens.push(name);
  }
  await fireSetup(true);
  const fireFrames=[];
  for(let i=0;i<10;i++){await page.evaluate(()=>vfxAdvance(1,1/30));fireFrames.push(await page.screenshot());}
  const fireBuffers=await Promise.all(fireFrames.map(frame=>sharp(frame).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(fireBuffers),{raw:{width:480,height:820*fireBuffers.length,channels:4,pageHeight:820}})
    .gif({delay:Array(fireBuffers.length).fill(35),loop:0}).toFile(path.join(dir,'fire-blast-wave-material-in-game.gif'));
  report.telegraph=await page.evaluate(()=>{
    vfxSetup();const r=app.run,p=r.vfx.rings;
    r.vfx.telegraph(0,.24,-3,4,0xff3d4f,.8);p.update(.1);
    const before={count:p.n,style:p.style[0],hold:p.hold[0],radius0:p.r0[0],radius1:p.r1[0],alpha:p.alpha[0],life:p.life[0],time:p.mesh.material.uniforms.uWaveTime.value};
    p.update(0);const paused=p.life[0]===before.life&&p.mesh.material.uniforms.uWaveTime.value===before.time;
    p.update(.71);return {before,paused,expired:p.n===0};
  });
  const {before,paused,expired}=report.telegraph;
  assert.equal(before.count,1);assert.equal(before.style,1);assert.equal(before.hold,1);
  assert.equal(before.radius0,4);assert.equal(before.radius1,4);assert.ok(Math.abs(before.alpha-.85)<1e-5&&Math.abs(before.life-.7)<1e-5);
  assert.ok(paused&&expired,'Held danger rings retain their lifetime, range and pause semantics');
  await page.evaluate(on=>{app.run.roomLightsOn=on;app.run.pushLook();},originalLights);
  fs.writeFileSync(path.join(dir,'wave-material-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Wave materials verified: actual water/fire-blast damage, three quality levels, day/night, paused material clock and unchanged danger ring range/lifetime.');
  return report;
}
