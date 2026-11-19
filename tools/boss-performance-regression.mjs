import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Fixed simulation steps and real WebGL draws through the compiled WeChat
// adapter. Desktop submission timings are comparative; they are not phone FPS.
export async function reviewBossPerformance(page, dir, baseline = false, programsOnly = false) {
  const setup = await page.evaluate(async () => {
    const run = app.run, host = app.r, enemies = run.enemies;
    app.halted = true;
    run.godMode = true;
    run.queueLevelUp = run.director.update = run.director.startFinalSwarm = () => {};
    run.events.update = run.minibosses.update = run.capture.update = () => {};
    run.capture.state = 'done'; run.capture.index = -1;
    run.time = run.stageTime = 300; run.nextCp = 1e9;
    run.player.hp = run.player.maxHp = 1e9;
    const vortex = run.interactables.list.find(f => f.kind === 'boss');
    if (!vortex) throw Error('Missing guardian summon device');
    await vortex.modelReady;
    run.player.pos.set(vortex.x, vortex.y, vortex.z + 5);
    run.camTarget.copy(run.player.pos); run.updateCamera(1);
    enemies.clear();
    for (let i = 0; i < 200; i++) {
      const angle = i * 2.39996, radius = 4 + (i % 55) * .2;
      const id = enemies.spawn([16,19,21][i % 3], vortex.x + Math.cos(angle)*radius,
        vortex.z + Math.sin(angle)*radius, 1e7, 1, 131072);
      if (id < 0) throw Error('Cannot seed 200 enemies');
      enemies.flags[id] &= ~131072;
    }
    await run.sprites.prepareGlyphTextures(host.renderer);
    run.update(0); host.render(0); inspected.env.drawUI(host.renderer);
    let screen;
    vortex.model.traverse(mesh => {
      if (mesh.userData.portalPart === 'screen' && mesh.userData.portalPhase === 1) screen = mesh;
    });
    if (!screen || !vortex.dock) throw Error('Missing active portal screen');
    window.bossPerf = {run, host, vortex, screen};
    return {enemies:enemies.count, platform:inspected.env.nativeDevice.platform,
      quality:app.meta.profile.settings.quality, world:[host.composer.inputBuffer.width,host.composer.inputBuffer.height]};
  });
  assert.equal(setup.enemies, 200);
  const report = {environment:'Compiled WeChat game / Chrome SwiftShader. Fixed 30 Hz simulation; CPU submission timings and workload counts, NOT Android phone FPS.', baseline, setup, samples:[]};
  await page.evaluate(() => {
    const probe = bossPerf, {host, screen} = probe, gl = host.renderer.getContext();
    const saved = [], counters = probe.counters = {readbacks:0,paintPaths:0,textureUploads:0,screenUploads:0,screenUploadBytes:0,programs:0};
    probe.programSources=[];
    const wrap = (object, key, fn) => {
      const original = object[key]; saved.push(() => object[key] = original);
      object[key] = function(...args) { fn.call(this,args); return original.apply(this,args); };
    };
    wrap(CanvasRenderingContext2D.prototype, 'getImageData', function(args) {
      if (this.canvas.width === 704 && this.canvas.height === 318) counters.readbacks++;
    });
    wrap(CanvasRenderingContext2D.prototype, 'beginPath', function() {
      if (this.canvas.width === 704 && this.canvas.height === 318) counters.paintPaths++;
    });
    let activeUnit=gl.getParameter(gl.ACTIVE_TEXTURE);
    const bindings=new Map([[activeUnit,gl.getParameter(gl.TEXTURE_BINDING_2D)]]);
    wrap(gl, 'activeTexture', args => {activeUnit=args[0];});
    wrap(gl, 'bindTexture', args => {if (args[0] === gl.TEXTURE_2D) bindings.set(activeUnit,args[1]);});
    for (const name of ['texImage2D','texSubImage2D']) wrap(gl, name, args => {
      counters.textureUploads++;
      const texture = screen.material.map;
      const native = texture && host.renderer.properties.get(texture).__webglTexture;
      const source=args.at(-1), explicitSize=args.length>=9;
      const width=explicitSize ? (name==='texImage2D' ? args[3] : args[4]) : source?.width;
      const height=explicitSize ? (name==='texImage2D' ? args[4] : args[5]) : source?.height;
      if ((native && bindings.get(activeUnit) === native) || (width === 704 && height === 318)) {
        counters.screenUploads++;
        counters.screenUploadBytes += (Number(width)||texture.image.width)*(Number(height)||texture.image.height)*4;
      }
    });
    wrap(gl, 'createProgram', () => counters.programs++);
    wrap(gl, 'linkProgram', args => {
      probe.programSources.push(gl.getAttachedShaders(args[0]).map(shader => ({
        type:gl.getShaderParameter(shader,gl.SHADER_TYPE),source:gl.getShaderSource(shader),
      })));
    });
    probe.restore = () => {for (const restore of saved.reverse()) restore();};
    probe.draw = dt => {
      const {run, host} = probe, info = host.renderer.info;
      const before = {...counters}, previousReset = info.autoReset;
      info.autoReset = false; info.reset();
      const start = performance.now();
      run.update(dt); const updated = performance.now();
      host.render(dt); const rendered = performance.now();
      inspected.env.drawUI(host.renderer); const end = performance.now();
      const sample = {updateMs:updated-start,renderMs:rendered-updated,uiMs:end-rendered,totalMs:end-start,
        calls:info.render.calls,triangles:info.render.triangles,
        enemies:run.enemies.count,state:run.state,dock:probe.vortex.dock.state,
        screenVersion:probe.screen.material.map.version,
        ...Object.fromEntries(Object.keys(counters).map(key => [key,counters[key]-before[key]]))};
      info.autoReset = previousReset;
      const error = gl.getError(); if(error) throw Error('Boss frame WebGL error '+error);
      return sample;
    };
  });
  async function sample(name, count) {
    const frames = await page.evaluate(async ({name,count}) => {
      const frames=[];
      for(let frame=0;frame<count;frame++) {
        frames.push(bossPerf.draw(1/30));
        if(frame % 8 === 0) await new Promise(resolve => setTimeout(resolve,0));
      }
      return frames;
    },{name,count});
    const summary = {name,frames:frames.length,seconds:frames.length/30,
      initialEnemies:frames[0].enemies,finalEnemies:frames.at(-1).enemies,
      finalState:frames.at(-1).state,dock:frames.at(-1).dock};
    for(const key of ['updateMs','renderMs','uiMs','totalMs','calls','triangles']) {
      const values=frames.map(frame=>frame[key]).sort((a,b)=>a-b);
      summary[key]={mean:values.reduce((a,b)=>a+b,0)/values.length,p95:values[Math.floor(values.length*.95)],max:values.at(-1)};
    }
    for(const key of ['readbacks','paintPaths','textureUploads','screenUploads','screenUploadBytes','programs']) summary[key]=frames.reduce((n,frame)=>n+frame[key],0);
    report.samples.push(summary);
    console.log('Boss workload',JSON.stringify(summary));
    fs.writeFileSync(path.join(dir,'boss-performance.json'),JSON.stringify(report,null,2));
    await page.screenshot({path:path.join(dir,'boss-'+name+'.png')});
    return summary;
  }
  try {
    await sample('before-summon',programsOnly?1:18);
    report.summon = await page.evaluate(() => {
      const {run,vortex}=bossPerf, start=performance.now();
      run.interactables.summonGuardian(vortex,vortex);
      return {ms:performance.now()-start,state:run.state,enemies:run.enemies.count,
        name:run.boss.name,chant:!!run.ui.dragonChant,index:run.boss.bossIndex};
    });
    assert.equal(report.summon.name,'龘');assert.equal(report.summon.state,'cinematic');
    assert.equal(report.summon.enemies,201);assert.ok(report.summon.chant);
    await sample('chant',programsOnly?66:48);
    if(programsOnly){
      if(!baseline)assert.equal(report.samples.reduce((n,sample)=>n+sample.programs,0),0,'Boss summon shaders must be prepared during loading');
      return report;
    }
    await sample('sacrifice-reveal',84);
    const battle = await sample('battle',90);
    assert.equal(battle.finalState,'play');assert.equal(battle.finalEnemies,1);assert.equal(battle.dock,'open');
    const settled = await sample('battle-steady',60);
    report.health = await page.evaluate(() => {
      const {run,host}=bossPerf, enemies=run.enemies, id=run.boss.bossIndex;
      const source=run.sprites.get(enemies.species[id],false,enemies.glyphWords[id]);
      if(!source.zxStrokeFrames || source.zxStrokeFrames.length !== 48) throw Error('Expected 48 dragon strokes');
      const originalHp=enemies.hp[id], samples=[];
      // Keep the boss in the camera for all three health samples.
      enemies.x[id]=run.player.pos.x+2;enemies.z[id]=run.player.pos.z-3;
      for(const fraction of [1,.5,.01]) {
        enemies.hp[id]=enemies.maxHp[id]*fraction;
        run.sprites.begin(host.camera);enemies.render();run.sprites.end();
        const group=source.zxGroup || source, remaining=Math.ceil(fraction*48);
        samples.push({fraction,remaining,count:group.count,uv:Array.from(group.aUV.array.slice(0,4)),expected:Array.from(source.zxStrokeFrames[remaining-1])});
      }
      enemies.hp[id]=originalHp;
      return samples;
    });
    for(const health of report.health) {assert.equal(health.count,1);assert.deepEqual(health.uv,health.expected);}
    if(!baseline) {
      assert.equal(report.samples.reduce((n,sample)=>n+sample.programs,0),0,'Boss summon shaders must be prepared during loading');
      assert.equal(settled.readbacks,0,'An open guardian screen must not read Canvas pixels every frame');
      assert.equal(settled.paintPaths,0,'An open guardian screen must use the prepared animation');
      assert.equal(settled.screenUploads,0,'An open guardian screen must not upload animation pixels every frame');
      assert.equal(settled.programs,0,'Steady boss combat must not compile shaders');
    }
  } finally {
    report.programSources=await page.evaluate(() => bossPerf.programSources);
    await page.evaluate(() => bossPerf.restore());
    fs.writeFileSync(path.join(dir,'boss-performance.json'),JSON.stringify(report,null,2));
  }
  return report;
}
