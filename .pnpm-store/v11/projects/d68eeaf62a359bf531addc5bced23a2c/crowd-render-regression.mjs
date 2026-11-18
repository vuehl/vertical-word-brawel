import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewCrowdRender(page,dir){
  const report=await page.evaluate(async()=>{
    const r=app.run,e=r.enemies,p=r.player,s=r.sprites,renderer=app.r.renderer;
    app.meta.profile.settings.quality='high';app.applySettings();
    r.director.update=()=>{};r.capture.state='done';
    const fields=['aPos','aSize','aUV','aFx','aTint','aLook'];
    const stats=()=>{
      const sources=[...s.batches.values()].filter(b=>b.zxGroup),groups=[...s.glyphGroups.values()];
      return {sources:sources.length,sourceCapacity:sources.reduce((n,b)=>n+b.cap,0),
        sourceBytes:sources.reduce((n,b)=>n+b.mesh.instanceMatrix.array.byteLength+fields.reduce((m,f)=>m+b[f].array.byteLength,0),0),
        sharedBytes:groups.reduce((n,b)=>n+b.mesh.instanceMatrix.array.byteLength+fields.reduce((m,f)=>m+b[f].array.byteLength,0),0),
        groups:groups.length,submitted:groups.reduce((n,g)=>n+g.count,0),sceneSources:sources.filter(b=>b.mesh.parent).length,
        pages:new Set(sources.map(b=>b.material.uniforms.zxGlyph.value)).size,
        largestSource:Math.max(...sources.map(b=>b.cap))};
    };
    const samples=[],ids=[48,128,43,133,19,132,10,127,41,46,102,69],random=Math.random;
    let seed=20261110;
    try{
      Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
      for(const count of [420,1000,100]){
        e.clear();
        for(let i=0;i<count;i++){const a=i*2.39996,d=3+(i%70)/10;e.spawn(ids[i%ids.length],p.pos.x+Math.cos(a)*d,p.pos.z+Math.sin(a)*d,1000,1,0);}
        r.renderWorld(0);await s.prepareGlyphTextures(renderer);r.renderWorld(0);app.r.render(0);
        const before=stats(),versions=[...s.glyphGroups.values()].map(g=>g.material.uniforms.zxGlyph.value.version);
        for(let i=0;i<30;i++)r.renderWorld(0);
        samples.push({count,before,after:stats(),stableTextures:versions.every((v,i)=>v===[...s.glyphGroups.values()][i].material.uniforms.zxGlyph.value.version)});
      }
    }finally{Math.random=random;}
    // Pool reuse after expiry, crowd trimming, clear and critical replacement.
    const text=r.vfx.text,view=text.view,limit=text.limit;text.view=null;text.limit=160;text.clear();
    for(let i=0;i<160;i++)text.spawn(0,2,0,String(i),0xffffff);
    const objects=new Set(text.items);text.update(1);
    for(let i=0;i<160;i++)text.spawn(0,2,0,String(i),0xffffff);
    const reused=text.items.every(item=>objects.has(item));
    text.trimTo(48);const trimmed=text.items.length,free=text.free.length;text.clear();
    text.limit=1;text.spawn(0,2,0,'12',0xff0000);const first=text.items[0];text.spawn(0,2,0,'99!',0x00ff00,.75);
    const replacement=first===text.items[0],glyphs=[...text.items[0].glyphs];text.clear();text.view=view;text.limit=limit;
    r.renderWorld(0);app.r.render(0);r.ui.hud(r);inspected.env.drawUI(renderer);
    return {environment:'Compiled release / Chrome SwiftShader; buffer counts, not phone FPS or total memory.',samples,
      text:{reused,trimmed,free,replacement,glyphs},resolution:app.r.dynRes,dynamic:app.r.quality.dyn};
  });
  for(const s of report.samples){assert.equal(s.before.largestSource,1);assert.equal(s.before.sceneSources,0);assert.ok(s.before.submitted>0);assert.deepEqual(s.after,s.before);assert.ok(s.stableTextures);}
  assert.ok(report.samples[0].before.sourceBytes<50000);
  assert.ok(report.text.reused&&report.text.replacement);assert.equal(report.text.trimmed,48);assert.ok(report.text.free>=112);assert.deepEqual(report.text.glyphs,[9,9,10]);
  assert.equal(report.resolution,1);assert.equal(report.dynamic,false);
  report.zones=[];
  for(let stage=2;stage<=4;stage++){
    const zone=await page.evaluate(async()=>{
      const r=app.run;await r.changeZone();r.updateCamera(1);r.renderWorld(0);app.r.render(0);
      return {stage:r.stage,state:r.state,ready:r.sprites.get(r.player.speciesId).ready,
        groups:r.sprites.glyphGroups.size,visible:[...r.sprites.glyphGroups.values()].some(g=>g.mesh.visible),enemies:r.enemies.count};
    });
    report.zones.push(zone);assert.equal(zone.stage,stage);assert.equal(zone.state,'play');assert.ok(zone.ready&&zone.visible);assert.equal(zone.enemies,0);
  }
  fs.writeFileSync(path.join(dir,'crowd-render.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(dir,'shared-glyphs.png')});
  console.log('Shared glyph buffers and damage pool:',JSON.stringify(report));
}
