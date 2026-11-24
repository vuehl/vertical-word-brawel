import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewExperiencePerformance(page,dir){
  const report=await page.evaluate(async()=>{
    const run=app.run,r=app.r,p=run.player;
    app.meta.profile.settings.quality='low';app.applySettings();r.setDynRes(1);
    run.ui.hudEl.querySelectorAll('.banner,.run-hint,.zx-intro').forEach(el=>el.remove());
    inspected.doc.querySelectorAll('.zx-intro').forEach(el=>el.remove());
    const now=inspected.env.performance.now,realNow=performance.now.bind(performance),originalRefresh=inspected.layout.refresh;
    const saved={xp:p.xp,level:p.level,xpNext:p.xpNext},originalTime=now.call(inspected.env.performance);
    let layouts=0,layoutMs=0,clock=Math.max(originalTime+10000,(window.experienceAuditClock||0)+1000);
    inspected.env.performance.now=()=>clock;
    inspected.layout.refresh=function(...args){const started=realNow();try{return originalRefresh.apply(this,args);}finally{layouts++;layoutMs+=realNow()-started;}};
    const frame=()=>{run.ui.hud(run);r.render(0);inspected.env.drawUI(r.renderer);};
    try{
      p.xp=0;p.xpNext=1000;
      // Width changes rebuild inventory icons. Let those static image loads
      // settle before counting only the subsequent experience updates.
      for(let warm=0;warm<3;warm++){frame();await new Promise(resolve=>setTimeout(resolve,30));clock+=120;}
      frame();
      layouts=0;layoutMs=0;
      const before={uploads:auditUIUploads,bytes:auditUploadBytes,portrait:auditPortraitBytes},started=realNow(),samples=[];
      for(let i=1;i<=30;i++){
        p.xp=i*25;clock+=100;
        const at=realNow();frame();samples.push(realNow()-at);
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      const portrait=inspected.doc.querySelector('.zx-profile-art'),box=inspected.layout.box(portrait);
      const pixels=()=>{
        const gl=r.renderer.getContext(),out=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
        gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;
      };
      const result={ticks:30,layouts,layoutMs,elapsedMs:realNow()-started,
        fullUploads:auditUIUploads-before.uploads,uploadedBytes:auditUploadBytes-before.bytes,portraitBytes:auditPortraitBytes-before.portrait,
        progress:Number(portrait.dataset.progress),mainSize:[inspected.uiCanvas.width,inspected.uiCanvas.height],
        portraitSize:inspected.portrait?.canvas?[inspected.portrait.canvas.width,inspected.portrait.canvas.height]:null,
        maxFrameMs:Math.max(...samples),meanFrameMs:samples.reduce((a,b)=>a+b,0)/samples.length,
        bounds:{x:box.x,y:box.y,w:box.w,h:box.h}};
      if(inspected.portrait){
        const optimized=pixels(),draw=inspected.portrait.draw;
        // Compare the independent texture against the same canvas painted in
        // its original stacking position on the main HUD, in the same frame.
        const level=inspected.doc.querySelector('.zx-hud-level');
        inspected.portrait.draw=()=>null;delete portrait.dataset.uiLayer;delete level.dataset.uiLayer;
        inspected.env.invalidateUI();await new Promise(resolve=>setTimeout(resolve,0));clock+=120;frame();
        const reference=pixels();let changed=0,totalDelta=0;
        for(let i=0;i<optimized.length;i+=4){const d=Math.abs(optimized[i]-reference[i])+Math.abs(optimized[i+1]-reference[i+1])+Math.abs(optimized[i+2]-reference[i+2]);if(d>18)changed++;totalDelta+=d;}
        result.visual={pixels:optimized.length/4,changed,meanChannelDelta:totalDelta/(optimized.length/4*3)};
        inspected.portrait.draw=draw;portrait.dataset.uiLayer='portrait';level.dataset.uiLayer='portrait-level';clock+=120;inspected.env.invalidateUI();frame();
      }
      return result;
    }finally{window.experienceAuditClock=clock;Object.assign(p,saved);inspected.env.performance.now=now;inspected.layout.refresh=originalRefresh;}
  });
  fs.writeFileSync(path.join(dir,'experience-performance.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(dir,'experience-75-percent.png')});
  assert.equal(report.progress,.75);
  if(report.portraitSize){
    assert.equal(report.layouts,0,'XP-only changes must never re-layout the full HUD');
    assert.equal(report.fullUploads,0,'XP-only changes must never upload the full HUD');
    assert.ok(report.portraitBytes>0&&report.portraitBytes<2000000&&report.uploadedBytes<4000000,JSON.stringify(report));
    assert.ok(report.visual.changed/report.visual.pixels<.003&&report.visual.meanChannelDelta<.25,JSON.stringify(report.visual));
  }
  console.log(JSON.stringify(report));return report;
}
