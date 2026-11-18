import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createMutationTargets} from '../platform/mutation-targets.mjs';

export async function reviewBattleLoad(page,dir){
  const report={environment:'Compiled WeChat developer build / Chrome SwiftShader. Work counts and CPU samples, not phone FPS.',samples:[]};
  report.monitor=await page.evaluate(async()=>{
    app.halted=true;inspected.env.__zixingDeveloper.close();
    const node=inspected.doc.querySelector('#zx-dev-monitor'),root=node.parentElement,env=inspected.env,r=app.r;
    const draw=()=>{r.render(0);env.drawUI(r.renderer);};
    const read=()=>{const gl=r.renderer.getContext(),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
    node.hidden=true;env.invalidateUI();await new Promise(r=>setTimeout(r,100));draw();
    const before=auditUIUploads;
    for(let i=0;i<4;i++){
      node.hidden=i===2;node.textContent='帧率 '+(30+i)+'\n普通怪 1000\n弹道 40 · 范围效果 8\n飘字 32 · 粒子 240';
      await new Promise(r=>setTimeout(r,100));draw();
    }
    const fullUploads=auditUIUploads-before,local=read(),bounds=inspected.layout.box(node);
    root.removeAttribute('data-ui-layer');env.invalidateUI();draw();const full=read();
    let changed=0;for(let i=0;i<full.length;i+=4){let d=0;for(let c=0;c<3;c++)d+=Math.abs(full[i+c]-local[i+c]);if(d>30)changed++;}
    root.dataset.uiLayer='diagnostics';env.invalidateUI();draw();
    return {fullUploads,changedFraction:changed/(full.length/4),visible:!node.hidden&&bounds.w>0&&bounds.h>0};
  });
  assert.equal(report.monitor.fullUploads,0);assert.ok(report.monitor.visible&&report.monitor.changedFraction<.005);
  for(const [seconds,count,quality] of [[180,420,'high'],[600,1000,'high'],[600,600,'low']]){
    const sample=await page.evaluate(async({seconds,count,quality,targets})=>{
      const run=app.run,api=inspected.env.__zixingDeveloper,renderer=app.r.renderer;
      api.close();app.halted=true;
      Object.assign(api.options,{lockCount:true,invincible:true,monitor:false});
      app.meta.profile.settings.quality=quality;app.applySettings();
      api.apply({time:seconds,count,mode:'timed',boss:'none'});run.nextEvo=null;
      // Timed presets enable statistics: include their uploads too, because
      // the same overlay is used while the phone is being stress-tested.
      for(let i=0;i<run.enemies.n;i++)if(run.enemies.alive[i])run.enemies.hp[i]=run.enemies.maxHp[i]=1e10;
      for(let i=0;i<60;i++)run.update(1/60);
      await run.sprites.prepareGlyphTextures(renderer);
      run.ui.hud(run);await new Promise(r=>setTimeout(r,0));inspected.env.drawUI(renderer);
      const root=inspected.doc.documentElement,target=new Function('return ('+targets+')')()(root),reasons={};
      const observer=new inspected.env.MutationObserver(records=>{
        for(const record of records){
          const node=target(record),el=node.nodeType===1?node:node.parentElement;
          if(el?.closest?.('[data-ui-hidden="true"]'))continue;
          if(record.type==='attributes'&&record.target.getAttribute(record.attributeName)===record.oldValue)continue;
          if(inspected.hudLayers.some(tile=>tile.owns(el)))continue;
          if(record.type==='attributes'&&((inspected.minimap.owns(el)&&record.attributeName==='data-frame')||
            (el?.dataset?.uiLayer==='portrait'&&['data-frame','data-progress','data-word','aria-valuenow'].includes(record.attributeName))||
            (inspected.health.owns(el)&&['style','data-frame','data-progress','aria-valuenow','aria-valuemax','aria-label'].includes(record.attributeName))||
            (inspected.controls.owns(el)&&['style','class'].includes(record.attributeName))))continue;
          const key=[record.type,record.attributeName,el?.tagName,el?.id,el?.className].join('|');reasons[key]=(reasons[key]||0)+1;
        }
      });
      observer.observe(root,{subtree:true,childList:true,attributes:true,attributeOldValue:true,characterData:true});
      const stats={},restore=[];
      for(const [object,key] of [[run.enemies,'update'],[run,'renderWorld'],[run.projectiles,'update'],[run.ui,'hud'],[run.vfx,'update']]){
        const name=object===run?'renderWorld':object===run.enemies?'enemies':object===run.projectiles?'projectiles':object===run.ui?'hud':'effects';
        const original=object[key],s=stats[name]={calls:0,ms:0};
        object[key]=function(...args){const at=performance.now();try{return original.apply(this,args);}finally{s.calls++;s.ms+=performance.now()-at;}};
        restore.push(()=>object[key]=original);
      }
      const frames=[],gpu=[],beforeUploads=auditUIUploads,beforeBytes=auditUploadBytes;
      let peakArea=0,peakParticles=0,damage=run.stats.damage;
      const info=renderer.info,autoReset=info.autoReset;info.autoReset=false;
      try{
        for(let frame=0;frame<180;frame++){
          const at=performance.now();run.update(1/60);frames.push(performance.now()-at);
          let area=0;for(const pool of [run.vfx.add,run.vfx.norm,run.vfx.ground,run.vfx.groundN]){
            for(let i=0;i<pool.n;i++)area+=Math.max(pool.s0[i],pool.s1[i])**2;
          }
          peakArea=Math.max(peakArea,area);peakParticles=Math.max(peakParticles,run.vfx.add.n+run.vfx.norm.n);
          if(frame%15===0){
            await new Promise(r=>setTimeout(r,0));info.reset();app.r.render(1/60);inspected.env.drawUI(renderer);
            gpu.push({calls:info.render.calls,triangles:info.render.triangles});
          }
        }
        frames.sort((a,b)=>a-b);
        return {seconds,count,quality,ordinary:api.snapshot().ordinary,state:run.state,damage:run.stats.damage-damage,stats,
          meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:frames[Math.floor(frames.length*.95)],
          fullUploads:auditUIUploads-beforeUploads,uploadBytes:auditUploadBytes-beforeBytes,
          mutations:reasons,gpu,peakArea,peakParticles,world:[app.r.composer.inputBuffer.width,app.r.composer.inputBuffer.height]};
      }finally{observer.disconnect();restore.forEach(f=>f());info.autoReset=autoReset;}
    },{seconds,count,quality,targets:createMutationTargets.toString()});
    report.samples.push(sample);
    fs.writeFileSync(path.join(dir,'battle-load.json'),JSON.stringify(report,null,2));
    assert.equal(sample.state,'play');assert.equal(sample.ordinary,count);assert.ok(sample.damage>0);
    console.log(JSON.stringify(sample));
    await page.screenshot({path:path.join(dir,`battle-${seconds}-${count}-${quality}.png`)});
  }
}
