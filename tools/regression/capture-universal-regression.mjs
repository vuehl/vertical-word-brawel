import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';
const rigs=JSON.parse(fs.readFileSync(new URL('../../resources/public/config/hero-rigs.json',import.meta.url),'utf8'));
export async function reviewCaptureUniversal(page,dir){
  const assets=JSON.parse(fs.readFileSync(new URL('../../minigame/assets.js',import.meta.url),'utf8').replace(/^module.exports\s*=\s*/,'').replace(/;\s*$/,''));
  const available=Object.entries(rigs).filter(([,r])=>assets.files['assets/glyphs/'+r.sheet+'-strokes.png']);
  const missing=Object.entries(rigs).filter(([,r])=>!assets.files['assets/glyphs/'+r.sheet+'-strokes.png']).map(([id,r])=>({id:+id,word:r.word,reason:'stroke atlas not shipped'}));
  fs.writeFileSync(path.join(dir,'unavailable-configured-glyphs.json'),JSON.stringify(missing,null,2));
  const targets=[...available.map(([id,r])=>({id:+id,word:r.word,count:r.groups.reduce((n,g)=>n+g.strokes.length,0),hero:true})),
    ...Object.values(glyphCatalog.enemies).map(r=>({id:4,word:r.word,count:r.strokes,hero:false}))];
  const results=[];
  for(const target of targets){
    const art=await page.evaluate(async target=>{
      const r=app.run;r.sprites.get(target.id,false,target.word);
      let strokes;
      for(let i=0;i<150;i++){
        strokes=r.sprites.getCaptureStrokes(target.id,target.word);
        if(strokes?.length)break;
        await new Promise(resolve=>setTimeout(resolve,20));
      }
      return {count:strokes?.length||0,valid:strokes?.every(s=>Number.isFinite(s.captureOffsetX)&&Number.isFinite(s.captureOffsetY)&&s.captureSizeRatio>0)};
    },target);
    if(target.hero)assert.equal(art.count,target.count,'Authored stroke count for '+target.word);
    else assert.ok(art.count>0&&art.count<=target.count,'Visible atlas increments for '+target.word);
    assert.ok(art.valid,target.word+' crop offsets');target.visibleCount=art.count;
    for(const success of [false,true]){
      const result=await page.evaluate(async({target,success})=>{
        const r=app.run,c=r.capture,b=c.ball,en=r.enemies;
        en.clear();r.captureEncounter=null;c.index=-1;c.state='idle';
        Object.defineProperty(r,'captureTarget',{configurable:true,value:target.id});
        c.spawnShiny();const i=c.index;if(i<0)throw Error('Missing target '+target.word);
        en.glyphWords[i]=target.word;en.x[i]=r.player.pos.x+2;en.z[i]=r.player.pos.z;
        en.hp[i]=en.maxHp[i];c.state='weakened';
        r.sprites.get(target.id,false,target.word);r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        let outcome; b.start(i,success,()=>{outcome='caught';en.kill(i)},()=>{outcome='escape'});
        const samples=[];
        for(const frame of [0,70,76,77,80,83,86,90,94,95,96,99,103,110]){
          b.update((frame+.001)/24-b.t);r.updateCamera(0);r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
          samples.push({frame,count:b.spiritStrokes?.length||0,removed:b.spiritPose?.removed||0,scale:b.spiritPose?.scale??1,front:!!b.escapeForeground});
        }
        b.update(111/24-b.t+.01);await new Promise(resolve=>setTimeout(resolve,280));r.updateCamera(0);
        return {outcome,samples};
      },{target,success});
      assert.equal(result.outcome,success?'caught':'escape',target.word);
      for(const sample of result.samples){
        if(sample.frame>=77)assert.equal(sample.count,target.visibleCount,target.word+' count at '+sample.frame);
        if(sample.frame>=90&&sample.frame<=95){assert.equal(sample.removed,target.visibleCount);assert.equal(sample.scale,0);}
        if(!success&&sample.frame>=96&&sample.frame<110)assert.ok(sample.front,target.word+' foreground escape');
      }
      results.push({word:target.word,success,strokes:art.count,outcome:result.outcome});
    }
    console.log('Capture verified:',target.word,art.count,'strokes, success + escape');
  }
  fs.writeFileSync(path.join(dir,'capture-universal.json'),JSON.stringify(results,null,2));
  console.log('Verified',targets.length,'configured glyphs;',results.length,'capture branches.');
}
