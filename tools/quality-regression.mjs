import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewQuality(page,dir){
  const report={environment:'Compiled WeChat package / Chrome SwiftShader; pixel workload, not phone FPS.',screens:[]};
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    const samples=[];
    for(const quality of ['high','medium','low','saver','restored','dynamic','balanced-dynamic']){
      const sample=await page.evaluate(async quality=>{
        const run=app.run,r=app.r,s=app.meta.profile.settings;
        s.quality=quality==='balanced-dynamic'?'medium':['saver','restored','dynamic'].includes(quality)?'high':quality;
        s.batterySaver=quality==='saver';app.applySettings();r.setDynRes(quality.endsWith('dynamic')?.6:1);
        run.state='play';run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);r.render(0);
        run.ui.hud(run);inspected.env.invalidateUI();inspected.env.drawUI(r.renderer);
        const world=[r.composer.inputBuffer.width,r.composer.inputBuffer.height];
        const display=[r.renderer.domElement.width,r.renderer.domElement.height];
        const layers=inspected.hudLayers.map(l=>l.canvas?[l.canvas.width,l.canvas.height]:null);
        run.state='paused';app.zixing.settings(()=>{});
        const click=(selector,label)=>[...inspected.doc.querySelectorAll(selector)].find(e=>e.textContent===label).click();
        click('.zx-tabs.main button','画面');click('.zx-subtab','性能视野');
        await new Promise(resolve=>setTimeout(resolve,30));
        inspected.env.invalidateUI();inspected.env.drawUI(r.renderer,true);
        // Same heading pixels, including glyph antialiasing, in every preset.
        const heading=inspected.doc.querySelector('.zx-header h1'),box=inspected.layout.box(heading),scale=inspected.env.uiPixelRatio;
        const screen=inspected.doc.getElementById('game').getBoundingClientRect();
        const canvas=inspected.uiCanvas,pixels=canvas.getContext('2d').getImageData(Math.round((box.x-screen.x)*scale),Math.round((box.y-screen.y)*scale),Math.round(box.w*scale),Math.round(box.h*scale)).data;
        let hash=2166136261;for(const byte of pixels)hash=Math.imul(hash^byte,16777619)>>>0;
        return {quality,world,display,layers,ui:[canvas.width,canvas.height],headingHash:hash,
          text:inspected.doc.querySelector('.zx-body').textContent,fpsCap:app.fpsCap()};
      },quality);
      samples.push(sample);
      if(['high','low','saver'].includes(quality))await page.screenshot({path:path.join(dir,'settings-'+width+'-'+quality+'.png')});
    }
    const [high,medium,low,saver,restored,dynamic,balancedDynamic]=samples,pixels=s=>s.world[0]*s.world[1];
    for(const sample of samples){
      assert.deepEqual(sample.ui,high.ui);assert.deepEqual(sample.display,high.display);
      assert.deepEqual(sample.layers,high.layers);assert.equal(sample.headingHash,high.headingHash,'Heading pixels stay identical');
      assert.ok(sample.text.includes('各档界面文字均保持精致档清晰度'));
    }
    assert.ok(pixels(low)<pixels(medium)&&pixels(medium)<pixels(high));
    assert.deepEqual(saver.world,low.world);assert.deepEqual(restored.world,high.world);
    assert.deepEqual(dynamic.world,high.world);assert.ok(pixels(balancedDynamic)<pixels(medium));assert.equal(saver.fpsCap,30);
    // The added explanation scrolls on small phones while Back stays usable.
    const scroll=await page.evaluate(()=>{
      const body=inspected.doc.querySelector('.zx-body');body.scrollTop=10000;
      inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer,true);
      const note=[...body.querySelectorAll('small')].find(e=>e.textContent.startsWith('省电模式以'));
      const b=inspected.layout.box(note),back=inspected.layout.box(inspected.doc.querySelector('.zx-footer button'));
      return {noteVisible:b.y>=b.clip.y-1&&b.y+b.h<=b.clip.b+1,backVisible:back.y>=back.clip.y&&back.y+back.h<=back.clip.b+1};
    });
    assert.ok(scroll.noteVisible&&scroll.backVisible,JSON.stringify(scroll));
    await page.screenshot({path:path.join(dir,'explanation-'+width+'.png')});
    report.screens.push({width,height,samples,scroll,worldReduction:{medium:1-pixels(medium)/pixels(high),low:1-pixels(low)/pixels(high)}});
  }
  fs.writeFileSync(path.join(dir,'quality-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.screens.map(({width,worldReduction,samples})=>({width,worldReduction,samples:samples.map(({quality,world,ui,headingHash})=>({quality,world,ui,headingHash}))})),null,2));
}
