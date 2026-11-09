import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewUpgrade({page,resize,dir}){
  const baseline=process.argv.includes('--baseline'),samples=[];
  await page.evaluate(async()=>{
    const account=await app.backend.guest();await app.meta.load(account);
    Object.assign(app.meta.profile.settings,{quality:'low',fpsLimit:30,batterySaver:false});app.applySettings();
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;app.run.godMode=true;app.run.update(1/60);
    app.run.ui.experienceReady=()=>true;
  });
  try{
    for(const width of (baseline?[390]:[320,390,430])){
      await resize(width,width===320?568:width===430?932:844);
      const build=await page.evaluate(()=>{
        const r=app.run;r.ui.hideModal();r.state='play';r.pendingLevels=1;r.rerolls=2;
        r.ui.hud(r);r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        const began=performance.now();r.doLevelUp();const buildMs=performance.now()-began;r.ui.hud(r);
        const clock=performance.now(),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
        const refresh=inspected.layout.refresh;
        window.upgradeAudit={clock,descriptor,refresh,uploads:0,panelUploads:0,layouts:0,time:r.time};
        Object.defineProperty(performance,'now',{configurable:true,value:()=>upgradeAudit.clock});
        inspected.layout.refresh=function(...args){
          upgradeAudit.layouts++;const result=refresh.apply(this,args);
          if(upgradeAudit.layouts===1)upgradeAudit.clock+=300; // Simulate a slow first layout.
          return result;
        };
        return {buildMs,clock};
      });
      const frames=[];
      try{
        for(const offset of [0,40,80,140,200,240]){
          const frame=await page.evaluate(({offset,clock})=>{
            const a=upgradeAudit,r=app.run;a.clock=clock+offset;
            r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
            const gl=app.r.renderer.getContext(),rgba=new Uint8Array(4);
            gl.readPixels(2,2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
            if(offset===80){
              const b=inspected.layout.box(inspected.doc.querySelector('[data-offer]'));
              const screen=inspected.doc.getElementById('game').getBoundingClientRect();
              window.tap(b.x+b.w/2-screen.left,b.y+b.h/2-screen.top);
            }
            return {offset,transition:inspected.modalTransition?.snapshot||null,layouts:a.layouts,uploads:a.uploads,
              panelUploads:a.panelUploads,pixel:[...rgba],pending:r.pendingLevels,state:r.state,time:r.time};
          },{offset,clock:frames[0]?.transition?.started??build.clock});
          frames.push(frame);
          if([0,80,240].includes(offset))await page.screenshot({path:path.join(dir,'upgrade-'+width+'-'+offset+'.png')});
          if(baseline)break;
        }
        if(!baseline){
          assert.equal(frames[0].transition.progress,0);
          assert.ok(frames[0].transition.started>=build.clock+300,'Slow preparation must not consume the intro animation');
          assert.ok(frames[2].transition.active&&frames[2].transition.progress>0&&frames[2].transition.progress<1);
          assert.equal(frames.at(-1).transition.active,false);
          assert.ok(frames[0].uploads>0&&frames[0].panelUploads===2,'Both cached layers must actually upload');
          assert.ok(frames.every(f=>f.state==='modal'&&f.pending===1),'Appearing cards must not consume a tap from combat');
          assert.ok(frames.every(f=>f.time===frames[0].time),'Dialog transition cannot advance combat');
          // No full-screen layout or pixel upload between prepared and settled frames.
          for(const f of frames.slice(2,4)){
            assert.equal(f.layouts,frames[1].layouts);assert.equal(f.uploads,frames[1].uploads);
            assert.equal(f.panelUploads,frames[1].panelUploads);
          }
          const brightness=f=>f.pixel.slice(0,3).reduce((a,b)=>a+b,0);
          assert.ok(brightness(frames[0])>brightness(frames[2])+10&&brightness(frames[2])>brightness(frames.at(-1))+2,
            'GPU output must actually fade the backdrop: '+JSON.stringify(frames.map(f=>f.pixel)));
          const actions=await page.evaluate(()=>{
            const r=app.run,a=upgradeAudit,click=selector=>{
              inspected.doc.querySelector(selector).scrollIntoView();a.clock+=800;
              app.r.render(0);inspected.env.drawUI(app.r.renderer);
              const b=inspected.layout.box(inspected.doc.querySelector(selector)),s=inspected.doc.getElementById('game').getBoundingClientRect();
              window.tap(b.x+b.w/2-s.left,b.y+b.h/2-s.top);
            };
            click('.zx-reroll');const rerolls=r.rerolls;
            a.clock+=20;app.r.render(0);inspected.env.drawUI(app.r.renderer);
            const rerollTransition=inspected.modalTransition.snapshot.active;
            a.clock+=240;app.r.render(0);inspected.env.drawUI(app.r.renderer);
            click('[data-offer]');
            return {rerolls,rerollTransition,pending:r.pendingLevels,state:r.state};
          });
          assert.deepEqual(actions,{rerolls:1,rerollTransition:true,pending:0,state:'play'});
        }
        samples.push({width,buildMs:build.buildMs,frames});
      }finally{
        await page.evaluate(()=>{
          const a=upgradeAudit;if(a.descriptor)Object.defineProperty(performance,'now',a.descriptor);else delete performance.now;
          inspected.layout.refresh=a.refresh;
          delete window.upgradeAudit;app.run.ui.hideModal();app.run.state='play';
        });
      }
    }
  }finally{await page.evaluate(()=>{app.halted=false;app.toMenu();});}
  fs.writeFileSync(path.join(dir,baseline?'upgrade-before.json':'upgrade-after.json'),JSON.stringify({
    environment:'Compiled WeChat bundle / Chrome SwiftShader; controlled animation clock, not phone timings',samples},null,2));
  console.log('Upgrade verification passed:',samples.map(s=>({width:s.width,buildMs:s.buildMs,frames:s.frames.length})));
}
