import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewUIPerformance({page,tap,dir,baseline=false}) {
  await page.setViewport({width:390,height:844,deviceScaleFactor:2});
  await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  await page.evaluate(()=>{
    const stats=window.uiPerf={layouts:0,layoutMs:0,measurements:0,uploads:0,allocations:0,wipes:0,maxScreens:1};
    const layout=inspected.layout,refresh=layout.refresh,ctx=layout.context,measure=ctx.measureText;
    layout.refresh=function(...args){const start=performance.now();try{return refresh(...args);}finally{stats.layouts++;stats.layoutMs+=performance.now()-start;}};
    ctx.measureText=function(...args){stats.measurements++;return measure.apply(this,args);};
    new inspected.env.MutationObserver(records=>{
      stats.maxScreens=Math.max(stats.maxScreens,inspected.doc.querySelectorAll('#ui > .screen').length);
      for(const record of records)for(const node of record.addedNodes||[])
        if(node.nodeType===1&&(node.classList.contains('wipe')||node.querySelector('.wipe')))stats.wipes++;
    }).observe(inspected.doc.body,{childList:true,subtree:true});
  });
  const profiles=[];
  async function sample(screen){
    await page.waitForFunction(sel=>inspected.doc.querySelector(sel),{timeout:30000},'.'+screen);
    await new Promise(resolve=>setTimeout(resolve,1200));
    const result=await page.evaluate(async()=>{
      const before={...uiPerf},gap=(window.productionFrameGap||app.frameGap.bind(app))(),worldPixels=app.r.composer.inputBuffer.width*app.r.composer.inputBuffer.height;
      app.halted=true;
      try{
        // Real native UI path, isolated from software-rendered 3D timing.
        for(let i=0;i<12;i++){
          await new Promise(resolve=>setTimeout(resolve,90));
          inspected.env.drawUI(app.r.renderer);
        }
        return Object.fromEntries(['layouts','layoutMs','measurements','uploads','allocations'].map(k=>[k,uiPerf[k]-before[k]]).concat([
          ['menuFrameGap',gap],['worldPixels',worldPixels],['uiPixels',inspected.uiCanvas.width*inspected.uiCanvas.height]
        ]));
      }finally{app.halted=false;}
    });
    profiles.push({screen,...result});
    await page.screenshot({path:path.join(dir,'perf-'+screen+'.png')});
    console.log('UI work',screen,JSON.stringify(result));
  }
  await sample('auth');
  await tap('.auth-body button');
  await sample('sp');
  const started=Date.now();
  await tap('.sp-go');
  await page.waitForFunction(()=>inspected.doc.querySelector('.lite-home'),{timeout:30000});
  const selectionMs=Date.now()-started;
  await sample('lite-home');
  const transitions=await page.evaluate(()=>({wipes:uiPerf.wipes,maxScreens:uiPerf.maxScreens}));
  const report={mode:'Chrome native-API fixture; UI work counts, not iPhone FPS',baseline,profiles,selectionMs,transitions};
  fs.writeFileSync(path.join(dir,'ui-performance.json'),JSON.stringify(report,null,2)+'\n');
  if(!baseline){
    assert.equal(transitions.wipes,0,'Native screen changes must not create the unsupported wipe');
    assert.equal(transitions.maxScreens,1,'Only one menu may be mounted during a native transition');
    for(const p of profiles){
      assert.ok(p.layouts<=2,`${p.screen} relaid out unchanged UI ${p.layouts} times`);
      assert.equal(p.allocations,0,'Stable UI texture dimensions must reuse GPU storage');
      assert.ok(p.menuFrameGap>=1000/30,'Native menu background must be capped at 30 FPS');
      if(p.screen!=='sp')assert.ok(p.uploads<=2,`${p.screen} reuploaded unchanged UI ${p.uploads} times`);
    }
  }
}
