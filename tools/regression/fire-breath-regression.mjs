import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import referenceAtlas from '../../resources/public/assets/vfx/fire-breath-reference.json' with {type:'json'};
import baselines from './fire-vfx-baselines.json' with {type:'json'};

async function compareGlyphLayers(page, file) {
  await page.evaluate(()=>{
    const r=app.run,sprites=r.sprites,getPlayerGlyph=sprites.getPlayerGlyph;
    const fire=r.vfx.crafted.fireJet.reference.mesh;
    let hero;
    sprites.getPlayerGlyph=(...args)=>{
      const glyph=getPlayerGlyph.apply(sprites,args);
      hero=glyph.zxGroup?.mesh??glyph.mesh;
      return glyph;
    };
    try{vfxDraw(false);}finally{sprites.getPlayerGlyph=getPlayerGlyph;}
    window.fireLayerFixture={hero,fire};
  });
  const live=await page.screenshot({path:file});
  await page.evaluate(()=>{fireLayerFixture.fire.visible=false;app.r.render(0);});
  const glyph=await page.screenshot();
  await page.evaluate(()=>{fireLayerFixture.hero.visible=false;app.r.render(0);});
  const backdrop=await page.screenshot();
  await page.evaluate(()=>{
    fireLayerFixture.hero.visible=true;
    fireLayerFixture.fire.visible=true;
    delete window.fireLayerFixture;
    app.r.render(0);
  });
  const [{info,data:withFire},{data:withoutFire},{data:withoutHero}]=await Promise.all(
    [live,glyph,backdrop].map(input=>sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true}))
  );
  const {width,height}=info;
  const delta=(a,b,i)=>Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));
  const glyphMask=new Uint8Array(width*height);
  for(let i=0;i<glyphMask.length;i++)glyphMask[i]=delta(withoutFire,withoutHero,i*3)>30?1:0;
  const interiorOffsets=Array.from({length:25},(_,i)=>(Math.floor(i/5)-2)*width+i%5-2);
  let strokePixels=0,changed=0;
  for(let i=width*2+2;i<glyphMask.length-width*2-2;i++){
    // Exclude antialiased edges, where the background intentionally shows through.
    if(!glyphMask[i]||!interiorOffsets.every(offset=>glyphMask[i+offset]))continue;
    strokePixels++;
    if(delta(withFire,withoutFire,i*3)>2)changed++;
  }
  return {strokePixels,changed};
}

async function recordReferenceCast(page, dir) {
  await page.evaluate(()=>{vfxAdvance(2,.01,false);app.run.player.moves[0].timer=999;});
  const delays=referenceAtlas.frameEndMs.map((end,i)=>end-(referenceAtlas.frameEndMs[i-1]??0));
  const shots=[];
  for(let i=0;i<=delays.length;i++){
    const frame=await page.evaluate(steps=>{
      if(steps)vfxAdvance(steps,.01,false);
      const r=app.run,art=r.vfx.crafted.fireJet.reference,target=r.lockTarget;
      // Show the battle HUD without the fixture's manually locked target.
      r.lockTarget=-1;
      try{vfxDraw();}finally{r.lockTarget=target;}
      return art.mesh.count===0?-1:art.attributes[1].array[1];
    },i===0?0:delays[i-1]/10);
    assert.equal(frame,i===delays.length?-1:i,'The battle capture must show every reference frame in order');
    shots.push(await page.screenshot());
  }
  const frames=await Promise.all(shots.map(input=>sharp(input).ensureAlpha().raw().toBuffer()));
  const file=path.join(dir,'fire-breath-in-game.gif');
  await sharp(Buffer.concat(frames),{raw:{width:390,height:844*frames.length,channels:4,pageHeight:844}})
    .gif({delay:[...delays,300],loop:0,keepDuplicateFrames:true}).toFile(file);
  assert.deepEqual((await sharp(file,{animated:true}).metadata()).delay,[...delays,300]);
}

// Called by runtime-performance.mjs --vfx --fire-breath. Exercise the real
// compiled move, damage fan and game renderer, with deterministic enemy inputs.
export async function reviewFireBreath(page,dir,moves){
  const id=moves.find(m=>m.key==='flamethrower').id,baseline=process.argv.includes('--capture-fire-baseline');
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.run.player.setSpecies(4);
    // Hold the caster still so random desktop colliders cannot move the damage fan.
    app.run.player.update=()=>{};
    await Promise.all([...app.run.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready));
    const jet=app.run.vfx.crafted.fireJet;if(jet.ready&&!await jet.ready)throw Error('Fire breath atlas failed to load');
    if(jet.reference&&!await jet.reference.ready)throw Error('Reference fire breath failed to load');
  });
  const setup=async(angle=-Math.PI/2,quality='high',frames=15,duration=3)=>page.evaluate(({id,angle,quality,frames,duration})=>{
    Math.random=()=>.5;app.meta.profile.settings.quality=quality;app.applySettings();vfxSetup();
    const r=app.run,e=r.enemies,dx=Math.cos(angle),dz=Math.sin(angle);
    r.weather=r.baseWeather='clear';r.weatherT=0;
    const jet=r.vfx.crafted.fireJet;jet.serial=jet.spawned=jet.expired=jet.clock=0;r.vfx.crafted.refreshes=0;window.firstFlamePacket=null;
    window.fireTrace=()=>{const r=app.run,j=r.vfx.crafted.fireJet,m=r.player.moves[0];return {active:m.active,timer:m.timer,damage:m.damageDone,spawned:j.spawned,expired:j.expired,
      packets:j.packets.map(p=>({id:p.id,age:p.age,life:p.life,seed:p.seed,dx:p.dx,dz:p.dz,x:p.x,y:p.y,z:p.z,length:p.length,radius:p.radius,stretch:p.stretch,lift:p.lift,own:p.own,sample:j.sample(p)}))};};
    const positions=[[-3,4],[0,5.5],[3,4],[0,-4]];
    positions.forEach(([side,forward],i)=>{e.x[i]=dx*forward-dz*side;e.z[i]=dz*forward+dx*side;});
    e.update();r.lockTarget=1;r.player.facing.set(dx,dz);
    r.player.addMove(id);r.player.moves[0].timer=0;r.player.moves[0].mods.dur=duration;
    vfxAdvance(frames);
    return {hits:[...e.hp.slice(0,4)].map(h=>h<1e7),damage:r.player.moves[0].damageDone,
      volumes:r.vfx.crafted.entries.map(e=>({mode:e.mode,type:e.type,length:e.length})),
      camera:r.camDist,particles:r.vfx.norm.n+r.vfx.add.n,limit:r.performance.particles+r.performance.normalParticles,
      trace:fireTrace(),fire:{count:r.vfx.crafted.fireJet.mesh.count+r.vfx.crafted.fireJet.legacy.mesh.count+(r.vfx.crafted.fireJet.reference?.mesh.count||0),limit:r.vfx.crafted.fireJet.limit,reference:r.vfx.crafted.fireJet.reference?.mesh.count||0,textured:!!r.vfx.crafted.fireJet.reference?.texture.isTexture}};
  },{id,angle,quality,frames,duration});
  const report={baseline,environment:'Actual compiled WeChat game in Chrome SwiftShader; controlled targets, original gameplay camera. Not phone FPS.',directions:[],qualities:[]};
  for(const quality of ['low','medium','high']){
    const sample=await setup(-Math.PI/2,quality);
    assert.deepEqual(sample.hits,[true,true,true,false],'Both sides and centre hit; target behind caster stays unharmed');
    assert.ok(sample.damage>0&&sample.volumes.some(e=>e.mode===8));
    assert.equal(sample.camera,42);assert.ok(sample.particles<=sample.limit);
    assert.ok(sample.fire.count>0&&sample.fire.count<=sample.fire.limit);if(!baseline){assert.equal(sample.fire.textured,true);assert.equal(sample.fire.reference,1);}
    report.qualities.push({quality,...sample});
    await page.screenshot({path:path.join(dir,'fire-'+quality+'.png')});
  }
  for(const [direction,angle] of [['up',-Math.PI/2],['right',0],['down',Math.PI/2],['left',Math.PI],['diagonal',-Math.PI/4]]){
    const sample=await setup(angle);assert.deepEqual(sample.hits,[true,true,true,false]);
    const file=path.join(dir,'fire-'+direction+'.png');
    const glyph=baseline?null:await compareGlyphLayers(page,file);
    if(baseline)await page.screenshot({path:file});
    if(glyph){
      assert.ok(glyph.strokePixels>100,direction+' must include the player glyph');
      assert.equal(glyph.changed,0,direction+' changed the colour of the player strokes');
    }
    report.directions.push({direction,...sample,glyph});
  }
  await setup(-Math.PI/2,'high',0,1);
  const active=await page.evaluate(()=>{vfxAdvance(1);const m=app.run.player.moves[0];m.timer=999;return m.active;});
  assert.ok(active>0&&active<5);
  report.lifecycle=[];report.packet=[];
  const filmFrames=Math.ceil((active+.95)*15);
  for(let i=0;i<filmFrames;i++){
    const sample=await page.evaluate(()=>{
      vfxAdvance(2);const v=app.run.vfx.crafted,jet=v.fireJet;
      const first=jet.packets.find(p=>p.id===window.firstFlamePacket)||jet.packets.reduce((a,b)=>!a||b.id<a.id?b:a,null);
      if(window.firstFlamePacket==null&&first)window.firstFlamePacket=first.id;
      const tracked=jet.packets.find(p=>p.id===window.firstFlamePacket);
      return {active:app.run.player.moves[0].active,count:jet.mesh.count+jet.legacy.mesh.count+(jet.reference?.mesh.count||0),spawned:jet.spawned,trace:fireTrace(),
        first:tracked?{age:tracked.age,life:tracked.life,...jet.sample(tracked)}:null};
    });
    sample.time=(i+1)*2/30;report.lifecycle.push(sample);if(sample.first)report.packet.push(sample.first);
    if([0,2,5,Math.floor(active*15),Math.floor((active+.35)*15),filmFrames-1].includes(i)){
      await page.screenshot({path:path.join(dir,'phase-'+String(i).padStart(2,'0')+'.png')});
    }
  }
  if(!baseline){
    await setup(-Math.PI/2,'high',0,1);
    await recordReferenceCast(page,dir);
  }
  const packet=report.packet,peak=Math.max(...packet.map(p=>p.radius));
  assert.ok(peak>packet[0].radius*1.8,'A born flame must visibly grow');
  assert.ok(packet.at(-1).radius<peak*.75&&packet.at(-1).alpha<.15,'A mature flame must shrink and dissolve');
  assert.ok(packet.at(-1).p>packet[0].p+.6,'The same flame must advance through its own life');
  assert.ok(report.lifecycle.some(p=>p.time>active+.2&&p.count>0),'Existing tongues must continue after emission stops');
  assert.equal(report.lifecycle.at(-1).count,0,'The final tail must extinguish completely');
  await setup();
  report.motion=await page.evaluate(()=>{
    const v=app.run.vfx.crafted,e=v.entries.find(e=>e.mode===8),age=e.age;
    const before=v.fireJet.packets.map(p=>p.age).join('/'),births=v.fireJet.spawned;
    v.update(0);const paused=e.age===age&&before===v.fireJet.packets.map(p=>p.age).join('/')&&births===v.fireJet.spawned;
    app.run.player.moves.fill(null);for(let i=0;i<30;i++)v.update(1/30);
    return {paused,expired:v.entries.length===0,count:v.mesh.count,keys:v.keys.size,fire:v.fireJet.mesh.count+v.fireJet.legacy.mesh.count+(v.fireJet.reference?.mesh.count||0)};
  });
  assert.deepEqual(report.motion,{paused:true,expired:true,count:0,keys:0,fire:0});
  await setup();report.hidden=await page.evaluate(()=>{app.run.hideOwnFx=true;app.run.vfx.crafted.update(0);const j=app.run.vfx.crafted.fireJet;const count=j.mesh.count+j.legacy.mesh.count+(j.reference?.mesh.count||0);app.run.hideOwnFx=false;app.run.vfx.clear();return count;});assert.equal(report.hidden,0);
  report.enemy=await page.evaluate(()=>{
    const r=app.run,v=r.vfx.crafted;v.cone('enemy-fire-check',0,1,-5,0,1,6,'fire',.7,false);v.update(1/30);
    r.hideOwnFx=true;v.update(0);const own=v.fireJet.packets.filter(p=>p.own).length,enemy=v.fireJet.packets.filter(p=>!p.own).length;
    r.hideOwnFx=false;r.vfx.clear();return {own,enemy,cleared:v.fireJet.mesh.count===0};
  });assert.equal(report.enemy.own,0);assert.ok(report.enemy.enemy>0&&report.enemy.cleared);
  report.layouts=[];
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    const sample=await setup();const error=await page.evaluate(()=>app.r.renderer.getContext().getError());
    assert.equal(error,0);assert.ok(sample.fire.count>0&&sample.fire.count<=sample.fire.limit);
    report.layouts.push({width,height,fire:sample.fire,glError:error});await page.screenshot({path:path.join(dir,'fire-phone-'+width+'.png')});
  }
  report.pressure=[];
  for(const quality of ['low','medium','high']){
    const sample=await page.evaluate(quality=>{
      app.meta.profile.settings.quality=quality;app.applySettings();const v=app.run.vfx.crafted;app.run.vfx.clear();
      for(let frame=0;frame<18;frame++){
        for(let i=0;i<36;i++)v.cone('pressure-'+i,(i%4)-2,1,-Math.floor(i/4)*.35,0,-1,7,'fire',.7);
        v.update(1/30);
      }
      const j=v.fireJet,result={quality,count:j.mesh.count,limit:j.limit,emitters:v.entries.length,finite:j.attributes.every(a=>Array.from(a.array.slice(0,j.mesh.count*4)).every(Number.isFinite))};
      app.run.vfx.clear();return result;
    },quality);
    assert.ok(sample.count>0&&sample.count<=sample.limit&&sample.finite);report.pressure.push(sample);
  }
  report.otherMoves=[];
  for(const key of ['ember','fire-spin','hydro-pump']){
    const move=moves.find(m=>m.key===key);assert.ok(move);
    const sample=await page.evaluate(async({id,key})=>{
      app.meta.profile.settings.quality='high';app.applySettings();vfxSetup();const r=app.run;r.player.addMove(id);r.player.moves[0].timer=0;
      await r.vfx.crafted.prepareMoveTexture?.(key);
      vfxAdvance(key==='hydro-pump'?28:19);return {key,particles:r.vfx.norm.n+r.vfx.add.n,volumes:r.vfx.crafted.mesh.count,authored:r.vfx.crafted.fireSpin.mesh.count+r.vfx.crafted.fireball.mesh.count,fire:r.vfx.crafted.fireJet.mesh.count+r.vfx.crafted.fireJet.legacy.mesh.count+(r.vfx.crafted.fireJet.reference?.mesh.count||0),legacyFire:r.vfx.crafted.fireJet.legacy?.mesh.count||0,projectiles:r.projectiles.used};
    },{id:move.id,key});
    assert.ok(sample.particles+sample.volumes+sample.authored+sample.fire+sample.legacyFire+sample.projectiles>0,key);
    report.otherMoves.push(sample);
  }
  report.ultimate=await page.evaluate(()=>{vfxSetup();const r=app.run;r.ult.charge=1;r.ult.fire();vfxAdvance(14);const v=r.vfx.crafted,mode=v.fireFamily?v.fireFamily.mesh.count>0:v.entries.some(e=>e.mode===3&&e.type==='fire');r.vfx.clear();return {mode,fireCleared:r.vfx.crafted.fireJet.mesh.count===0};});
  assert.ok(report.ultimate.mode&&report.ultimate.fireCleared);
  if(!baseline){
    report.reference=await page.evaluate(()=>{
      const r=app.run,v=r.vfx.crafted,j=v.fireJet,art=j.reference;
      const key={def:{key:'flamethrower'}};v.clear();
      for(let i=0;i<30;i++){
        v.cone(key,i/45,1,0,1,0,7,'fire',.7);v.update(1/30);
      }
      const follows=Math.abs(art.attributes[0].array[0]-29/45)<.0001;
      const before=JSON.stringify([...art.streams.values()]),pose=JSON.stringify(art.attributes.map(a=>[...a.array]));
      v.update(0);const paused=before===JSON.stringify([...art.streams.values()])&&pose===JSON.stringify(art.attributes.map(a=>[...a.array]));
      for(let i=0;i<6;i++)v.update(1/30);
      const tail=art.mesh.count===1&&art.attributes[1].array[1]>=16;
      for(let i=0;i<20;i++)v.update(1/30);
      const expired=art.mesh.count===0&&art.streams.size===0;
      v.cone(key,0,1,0,0,-1,7,'fire',.7);v.update(1/30);
      const restarted=art.attributes[1].array[1]===0;
      r.hideOwnFx=true;v.update(0);const hidden=art.mesh.count===0;
      v.cone('enemy-cone-flamethrower-check',0,1,0,0,-1,7,'fire',.7,false);v.update(1/30);
      const enemyVisible=art.mesh.count===1;
      r.hideOwnFx=false;v.clear();const cleared=art.mesh.count===0&&art.streams.size===0;
      return {follows,paused,tail,expired,restarted,hidden,enemyVisible,cleared};
    });
    for(const [key,value] of Object.entries(report.reference))assert.equal(value,true,key);
    const gif=fs.readFileSync(new URL('../../'+referenceAtlas.source,import.meta.url));
    assert.equal(createHash('sha256').update(gif).digest('hex'),referenceAtlas.sha256);
    const {delay}=await sharp(gif,{animated:true}).metadata();
    const frameEnds=referenceAtlas.pages.reduce((ends,index)=>[...ends,(ends.at(-1)??0)+delay[index]],[]);
    assert.deepEqual(referenceAtlas.frameEndMs,frameEnds);
    report.referenceTiming=await page.evaluate(frameEnds=>{
      const v=app.run.vfx.crafted,art=v.fireJet.reference;
      const emitter={key:{def:{key:'flamethrower'}},fireTouched:true,x:0,y:1,z:0,angle:0,artLength:7};
      const frame=()=>art.mesh.count===0?-1:art.attributes[1].array[1];
      v.clear();
      art.update(1/30,[emitter]);
      const boundaries=[frame()];let last=0;
      for(const end of frameEnds){
        art.update((end-last-1)/1000,[emitter]);boundaries.push(frame());
        art.update(.001,[emitter]);boundaries.push(frame());
        last=end;
      }
      art.update(.5,[emitter]);const holdsAtEnd=frame()===-1;
      art.update(.2,[]);art.update(.02,[emitter]);const newCast=frame()===0;
      v.clear();
      return {boundaries,holdsAtEnd,newCast};
    },frameEnds);
    const boundaries=[0,...frameEnds.flatMap((_,i)=>[i,i+1<frameEnds.length?i+1:-1])];
    assert.deepEqual(report.referenceTiming,{boundaries,holdsAtEnd:true,newCast:true});
    report.referencePressure=[];
    for(const quality of ['low','medium','high']){
      const sample=await page.evaluate(quality=>{
        app.meta.profile.settings.quality=quality;app.applySettings();const v=app.run.vfx.crafted,j=v.fireJet.reference;v.clear();
        const keys=Array.from({length:36},()=>({def:{key:'flamethrower'}}));
        for(let f=0;f<20;f++){for(const key of keys)v.cone(key,0,1,0,0,-1,7,'fire',.7);v.update(1/30);}
        const result={quality,count:j.mesh.count,limit:j.limit,finite:j.attributes.every(a=>[...a.array].every(Number.isFinite))};v.clear();return result;
      },quality);
      assert.ok(sample.count>0&&sample.count<=sample.limit&&sample.finite);report.referencePressure.push(sample);
    }
    await setup();
    report.paintedHits=await page.evaluate(()=>{
      const r=app.run,j=r.vfx.crafted.fireJet;
      r.combat.hit(1,20,{type:'fire',cls:'special',slot:0,silent:false,chance:0});
      j.updateHits(1/30);vfxDraw(false);
      const realHit=j.hitMesh.count>0,before=JSON.stringify(j.hits),beforeAttributes=JSON.stringify(j.hitAttributes.map(a=>Array.from(a.array)));
      r.vfx.crafted.update(0);
      const paused=before===JSON.stringify(j.hits)&&beforeAttributes===JSON.stringify(j.hitAttributes.map(a=>Array.from(a.array)));
      r.hideOwnFx=true;j.updateHits(0);const hidden=j.hitMesh.count===0;r.hideOwnFx=false;
      j.impact(1,1,-4,false);j.updateHits(0);r.hideOwnFx=true;j.updateHits(0);const enemyVisible=j.hitMesh.count>0;r.hideOwnFx=false;
      j.updateHits(1);const expired=j.hitMesh.count===0;
      return {realHit,paused,hidden,enemyVisible,expired};
    });
    assert.deepEqual(report.paintedHits,{realHit:false,paused:true,hidden:true,enemyVisible:true,expired:true});
    await setup();
    await page.evaluate(()=>{const r=app.run;r.combat.hit(1,20,{type:'fire',cls:'special',slot:0,silent:false,chance:0});r.vfx.crafted.fireJet.updateHits(.1);vfxDraw(false);});
    await page.screenshot({path:path.join(dir,'fire-painted-hit.png')});
    report.hitPressure=[];
    for(const quality of ['low','medium','high']){
      const sample=await page.evaluate(quality=>{
        app.meta.profile.settings.quality=quality;app.applySettings();const j=app.run.vfx.crafted.fireJet;j.clear();
        for(let i=0;i<100;i++)j.impact((i%10)*.7-3,1,-Math.floor(i/10)*.7);
        j.updateHits(1/30);const result={quality,count:j.hitMesh.count,limit:j.hitLimit};j.clear();
        result.cleared=j.hits.length===0&&j.hitTimes.size===0&&j.hitMesh.count===0&&j.mesh.count===0&&j.legacy.mesh.count===0;return result;
      },quality);
      assert.ok(sample.count>0&&sample.count<=sample.limit&&sample.cleared);report.hitPressure.push(sample);
    }
    const reference=path.join(dir,'调整前','fire-breath-report.json');
    const old=fs.existsSync(reference)?JSON.parse(fs.readFileSync(reference,'utf8')):null;
    for(const section of ['qualities','directions','lifecycle']){
      const trace=report[section].map(x=>x.trace);
      if(old)assert.deepEqual(trace,old[section].map(x=>x.trace),section);
      else assert.equal(createHash('sha256').update(JSON.stringify(trace)).digest('hex'),baselines.fireBreath[section],section);
    }
    report.behaviorComparison={exact:true,qualities:report.qualities.length,directions:report.directions.length,timedFrames:report.lifecycle.length};
    report.disposal=await page.evaluate(()=>{
      const j=app.run.vfx.crafted.fireJet,resources=[j.mesh.geometry,j.hitMesh.geometry,j.mesh.material,j.texture,j.legacy.mesh.geometry,j.legacy.mesh.material,j.reference.mesh.geometry,j.reference.mesh.material,j.reference.texture];let disposed=0;
      for(const r of resources)r.addEventListener('dispose',()=>disposed++);j.dispose();
      return {released:disposed,expected:resources.length,detached:!j.mesh.parent&&!j.hitMesh.parent&&!j.legacy.mesh.parent&&!j.reference.mesh.parent};
    });
    assert.ok(report.disposal.released===report.disposal.expected&&report.disposal.detached);
  }
  fs.writeFileSync(path.join(dir,'fire-breath-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Fire breath verified: real move, five directions, three quality levels, front/side damage, individual birth/growth/extinction, full cast movie, pause, own/enemy hiding, cleanup and shaders.');
  return report;
}
