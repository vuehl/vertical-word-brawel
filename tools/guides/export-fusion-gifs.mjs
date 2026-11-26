import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import {fixtureSubpackage} from '../build/fixture-play-chunks.mjs';
import {loadSkillCatalog} from './skill-catalog.mjs';

// Record the current native bundle using the same WeChat fixture as runtime QA.
// Controlled enemies and one real cast per clip; no gameplay/save files change.
const root=path.resolve(import.meta.dirname,'../..'),game=path.join(root,'minigame');
function bundleHash(){
  const hash=createHash('sha256');
  for(const file of fs.readdirSync(game,{recursive:true}).filter(file=>/\.(js|br)$/.test(file)).sort()){
    hash.update(file.replaceAll('\\','/'));hash.update(fs.readFileSync(path.join(game,file)));
  }
  return hash.digest('hex');
}
const stampede=process.argv.includes('--fire-stampede');
const frameCount=stampede?160:90,fps=stampede?20:15,outputHeight=stampede?892:844;
const title=stampede?'烈焰狂奔三形态GIF':'炎风融合技能GIF';
const out=process.env.SKILL_GIF_OUT||path.join(root,'资料',title);
const qa=process.env.POKEBONK_QA||path.join(root,'验收',title);
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(qa,{recursive:true});
const {ctx}=await loadSkillCatalog();
const skills=(stampede?[['炎',4,'flame-charge'],['焱',5,'flame-charge'],['燚',6,'flame-charge']]:
  [['炎',4,'fu-4'],['炎',4,'fu-t-fire'],['风',16,'fu-16'],['风',16,'fu-wind-spin']])
  .map(([family,species,key])=>({family,species,key,id:stampede?488:ctx.fS(key),name:stampede?ctx.formMove(488,species).name:ctx.dS(key).name}))
  .filter(skill=>!process.env.SKILL_GIF_SPECIES||skill.species===Number(process.env.SKILL_GIF_SPECIES))
  .filter(skill=>!process.env.FUSION_GIF_KEY||skill.key===process.env.FUSION_GIF_KEY);
const fixture=(await build({bundle:true,entryPoints:[path.join(root,'tools/build/wx-fixture.mjs')],write:false,format:'iife'})).outputFiles[0].text;
const config=JSON.parse(fs.readFileSync(path.join(game,'game.json'),'utf8'));
const modules=[],packageData={main:[]},packageEntries={};
for(const pkg of config.subpackages){packageData[pkg.name]=[];packageEntries[pkg.name]=pkg.root.endsWith('.js')?pkg.root:pkg.root+'/game.js';}
for(const entry of fs.readdirSync(game,{recursive:true})){
  const file=entry.split(path.sep).join('/'),pkg=config.subpackages.find(({root})=>file===root||file.startsWith(root+'/'));
  if(!pkg&&file.endsWith('.js'))modules.push(file);
  if(/\.(br|bin)$/.test(file))packageData[pkg?.name||'main'].push(file);
}
const urls=new Set(Object.values(packageData).flat().map(file=>'/'+file));
const boot='const defs={},cache={};\n'+modules.map(p=>'defs['+JSON.stringify(p)+']=function(require,module,exports){\n'+fs.readFileSync(path.join(game,p),'utf8')+'\n};').join('\n')+
  '\nfunction load(p){if(!defs[p])throw Error(p);if(cache[p])return cache[p].exports;const m=cache[p]={exports:{}};defs[p](q=>load(p.slice(0,p.lastIndexOf("/")+1)+q.slice(2)+".js"),m,m.exports);return m.exports;}window.loadFixtureData("main").then(()=>load("game.js"));';
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html;charset=utf-8');return res.end('<meta charset="utf-8"><style>*{margin:0}canvas{display:block;width:100vw;height:100vh}#clip-title{position:fixed;top:10px;left:12px;right:12px;padding:9px 12px;background:#fff9ecf5;color:#273735;border:1px solid #bdb5a5;border-radius:8px;font:700 20px/1.35 "Microsoft YaHei",sans-serif;pointer-events:none}#clip-title small{display:block;font-size:11px;font-weight:400;margin-top:3px}</style><body><script src="/fixture.js"></script><script src="/boot.js"></script>');}
  if(req.url==='/fixture.js'||req.url==='/boot.js'){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(req.url==='/boot.js'?boot:'window.packageData='+JSON.stringify(packageData)+';window.packageEntries='+JSON.stringify(packageEntries)+';'+fixture);}
  if(Object.values(packageEntries).includes(req.url.slice(1))){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(fixtureSubpackage(game,req.url.slice(1)));}
  if(urls.has(req.url))return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  if(/^\/play\/opening\/p\d{2}\.webp$/.test(req.url)){
    res.setHeader('content-type','image/webp');
    return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  }
  res.statusCode=404;res.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const report={environment:'Current compiled WeChat bundle in desktop Chrome/SwiftShader; real casts, controlled enemies, level-one skill; not a phone recording.',
  width:390,height:outputHeight,fps,files:[],bundleSHA256:bundleHash()};
try{
  const page=await browser.newPage(),errors=[];
  page.setDefaultTimeout(120000);
  page.on('pageerror',error=>{errors.push(String(error));console.error(String(error));});
  page.on('console',message=>{if(message.type()==='error'&&/WebGLProgram|Shader Error|VALIDATE_STATUS/.test(message.text()))errors.push(message.text());});
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{window.fixturePlatform='devtools';window.phoneLayout=true;window.fixtureSkipOpening=true;});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>window.releaseTextDownload&&window.releaseOptionalDownloads);
  await page.evaluate(()=>{releaseTextDownload();releaseOptionalDownloads();});
  await page.waitForFunction(()=>window.app?.zixing&&app.screen?.querySelector('button'));
  console.log('Game loaded; preparing real skill casts.');
  await page.evaluate(async()=>{
    const account=await app.backend.guest();await app.meta.load(account);
    Object.assign(app.meta.profile.settings,{quality:'high',ultQuiet:true,damageNumbers:false});app.applySettings();
    app.frameGap=()=>250;
    const start=app.backend.startRun.bind(app.backend);app.backend.startRun=async(...args)=>({...await start(...args),seed:53090});
    let seed=53090;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    await inspected.env.prepareForest();
    if(!await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Unable to start recording run');
    app.halted=true;
    const t=app.run.terrain;
    for(let z=-24;z<=24;z+=3)for(let x=-24;x<=24;x+=3){
      if(Array.from({length:28},(_,i)=>z-i*.4).every(zz=>t.inBounds(x,zz,2)&&t.isFlatOpen(x,zz)&&!t.hitProp(x,t.surface(x,zz)+.5,zz,2))){window.fusionLane={x,z};return;}
    }
    throw Error('No clear lane for recording');
  });
  await page.evaluate(stampede=>{
    const title=document.createElement('div');title.id='clip-title';if(stampede)title.style.display='none';document.body.append(title);
    window.fusionSetup=skill=>{
      const r=app.run,p=r.player;app.halted=true;r.state='play';r.ui.hideModal();r.godMode=true;r.pendingLevels=0;
      r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};r.queueLevelUp=()=>{};
      r.enemies.clear();r.ult.clear();r.projectiles.clear();r.zones.clear();r.vfx.clear();r.timers.length=0;r.anims.length=0;r.ghosts.length=0;
      r.aimMode='auto';r.time=r.realTime=0;r.weather=r.baseWeather='clear';r.weatherT=0;r.hitstopT=0;
      p.moves=Array(4).fill(null);p.buffs.clear();p.level=1;p.evoStage=0;p.growth=0;p.recompute();p.stats.critChance=p.stats.megaCrit=0;p.kx=p.kz=0;
      const {x,z}=fusionLane;p.pos.set(x,r.terrain.surface(x,z),z);p.vel.set(0,0,0);p.facing.set(0,-1);r.camTarget.copy(p.pos);
      r.enemies.update=()=>{const e=r.enemies;e.grid.build(e.n,e.x,e.z,e.alive,e.radius,e.dying);};
      for(const [i,id] of [74,4,1,46].entries()){
        // Spread the stampede targets like the supplied recording so its long
        // traversals can be judged instead of four tightly packed short zigzags.
        const offset=stampede?[[2.4,-8.2],[-8,-8.2],[10,-8.2],[-10,7]][i]:[(i%2?1:-1)*.5,-3-i*2];
        const ex=x+offset[0],ez=z+offset[1],n=r.enemies.spawn(id,ex,ez,1,1,0);
        r.enemies.hp[n]=r.enemies.maxHp[n]=1e7;r.enemies.y[n]=r.terrain.surface(ex,ez);r.enemies.kx[n]=r.enemies.kz[n]=0;
      }
      r.enemies.update();
      // The vortex uses normal auto-aim so the target reticle never covers its artwork.
      r.lockTarget=skill.key==='fu-4'||skill.key==='fire-spin'?-1:0;
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
    };
    window.fusionDraw=()=>{const r=app.run;app.r.renderer.resetState();r.updateCamera(1/30);r.renderWorld(0);r.vfx.update(0);app.r.render(0);r.ui.hud(r);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);};
    window.fusionAdvance=()=>{const r=app.run;for(let i=0;i<(stampede?3:4);i++){const dt=1/60;r.realTime+=dt;r.simulate(dt);r.updateCamera(dt);r.renderWorld(dt);r.vfx.update(dt);}fusionDraw();};
  },stampede);
  for(const skill of skills){
    const def=await page.evaluate(async skill=>{
      fusionSetup(skill);const r=app.run,p=r.player;p.setSpecies(skill.species);
      p.evoStage=skill.species===5?1:skill.species===6?2:0;p.recompute();
      await r.sprites.prepareHeroForm(skill.species);
      if(!p.addMove(skill.id))throw Error('Missing fusion '+skill.key);
      const m=p.moves[0];m.level=1;m.timer=999;
      await r.vfx.crafted.prepareMoveTexture(m.def.key);
      await Promise.all([r.vfx.crafted.fireFamily.ready,r.vfx.crafted.fireJet.ready,r.vfx.crafted.fireSpin.ready,r.vfx.crafted.fireball.ready,
        ...[...r.sprites.batches.values()].map(b=>b.material?.uniforms?.map?.value?.userData?.ready)]);
      for(let i=0;i<r.enemies.n;i++){const e=r.enemies,b=r.sprites.get(e.species[i],false,e.glyphWords[i]);e.radius[i]=Math.max(.45,Math.min(4,b.bodyWidth(e.scale[i])*.42));e.hgt[i]=Math.max(.8,b.bodyHeight(e.scale[i]));e.sized[i]=1;}
      r.enemies.update();
      document.querySelector('#clip-title').replaceChildren(document.createTextNode(skill.family+' · '+skill.name));
      const subtitle=document.createElement('small');subtitle.textContent=skill.id===488?'局内实际释放 · '+skill.family+'字形残影 · 1级技能':'当前游戏效果 · 1级融合技能 · 单次释放';document.querySelector('#clip-title').append(subtitle);
      for(let i=0;i<25;i++)r.updateCamera(1/30);
      fusionDraw();return {name:m.def.name,key:m.def.key};
    },skill);
    assert.equal(def.key,skill.key);assert.equal(def.name,skill.name);
    const frames=[],samples=[];
    for(let frame=0;frame<frameCount;frame++){
      const state=await page.evaluate(frame=>{
        const m=app.run.player.moves[0];if(frame===5)m.timer=0;
        fusionAdvance();if(frame>=5)m.timer=999;
        const r=app.run,v=r.vfx.crafted,ghosts=r.ghosts.filter(g=>g.fireGlyph);
        const glyph=m.def.id===488?r.sprites.getHeroGhostGlyph(r.player.speciesId):null;
        return {frame,damage:m.damageDone||0,gl:app.r.renderer.getContext().getError(),
          ghosts:ghosts.length,ghostSpecies:[...new Set(ghosts.map(g=>g.species))],glyph:glyph?.zxGlyph,
          glyphCount:glyph?.zxGroup.mesh.count||0,
          smallFlames:v.stampede?.particles.length||0,
          stampedeFrames:v.stampede?Array.from({length:v.stampede.mesh.count},(_,i)=>v.stampede.pose.getX(i)):[],
          stampedeSpecies:[...new Set([...(v.stampede?.particles||[]).map(p=>p.species),...r.zones.list.filter(z=>z.stampedeFire).map(z=>z.stampedeSpecies)])],
          genericFireFields:v.entries.filter(effect=>effect.mode===7&&effect.type==='fire').length,
          jet:v.fireJet.mesh.count,
          visible:v.fireFamily.mesh.count+v.fireFamily.topMesh.count+v.fireSpin.mesh.count+v.fireJet.mesh.count+(v.windSkills?.mesh.count||0)+v.mesh.count+(glyph?.zxGroup.mesh.count||0)};
      },frame);
      assert.equal(state.gl,0);samples.push(state);
      let png=await page.screenshot();
      if(stampede){
        const heading=Buffer.from(`<svg width="390" height="48"><rect width="390" height="48" fill="#20343a"/><text x="195" y="30" text-anchor="middle" font-family="Microsoft YaHei" font-size="18" fill="#fff">${skill.family} · 烈焰狂奔 · 局内实际释放</text></svg>`);
        png=await sharp({create:{width:390,height:outputHeight,channels:4,background:'#20343a'}}).composite([{input:heading,top:0,left:0},{input:png,top:48,left:0}]).png().toBuffer();
      }
      frames.push(await sharp(png).ensureAlpha().raw().toBuffer());
      if([6,9,12,18,24,45,65].includes(frame))fs.writeFileSync(path.join(qa,skill.species+'-'+skill.key+'-'+frame+'.png'),png);
      if(frame%40===39)console.log(skill.family+' '+skill.name+': '+(frame+1)+'/'+frameCount+' frames');
    }
    assert.ok(samples.at(-1).damage>0,skill.name+' must actually hit');
    assert.ok(samples.some(s=>s.visible>0),skill.name+' must be visible');
    if(stampede){
      assert.ok(samples.some(s=>s.glyphCount>0),'Letter afterimages must render');
      assert.ok(samples.every(s=>s.glyph===skill.family),'Afterimage must match the current fire form');
      assert.ok(samples.every(s=>s.ghostSpecies.every(id=>id===skill.species)),'No other form in the trail');
      assert.equal(samples.at(-1).ghosts,0,'Afterimages expire');
      assert.ok(samples.some(s=>s.smallFlames>0),'Reference flame particles must render');
      const atlas=JSON.parse(fs.readFileSync(path.join(root,'resources/public/assets/vfx/fire-stampede.json'),'utf8'));
      const clip=atlas.forms[skill.species];
      assert.equal(clip.word,skill.family);
      assert.equal(clip.source,'烈焰狂奔_'+skill.family+'.gif');
      const supplied=path.join(root,'resources/art/fire-stampede',clip.source);
      assert.equal(createHash('sha256').update(fs.readFileSync(supplied)).digest('hex'),clip.sha256);
      assert.ok(samples.every(s=>s.stampedeSpecies.every(id=>id===skill.species)),'Particles and ground flames keep their casting form');
      const poses=new Set(samples.flatMap(s=>s.stampedeFrames));
      assert.ok(poses.size>=10,'Ground flames must animate');
      assert.ok([...poses].every(p=>p>=clip.first&&p<=clip.particle),'No other form atlas frames');
      assert.equal(samples.at(-1).stampedeFrames.length,0,'Reference flames expire');
      assert.ok(samples.every(s=>s.genericFireFields===0),'Stampede must not use the generic large fire volumes');
    }
    if(skill.key==='fu-4')assert.ok(samples.every(s=>s.jet===0),'Vortex recording must not contain the removed flame jet');
    const file=skill.family+'_'+skill.name+'.gif';
    // GIF delays are centiseconds: 70/60/70 ms preserves a 15 fps mean.
    const delays=frames.map((_,i)=>stampede?50:i%3===1?60:70);
    await sharp(Buffer.concat(frames),{raw:{width:390,height:outputHeight*frames.length,channels:4,pageHeight:outputHeight}})
      .gif({delay:delays,loop:0,effort:4,dither:.5}).toFile(path.join(out,file));
    const meta=await sharp(path.join(out,file),{animated:true}).metadata();assert.equal(meta.pages,frameCount);
    assert.equal(meta.delay.reduce((n,v)=>n+v,0),frameCount/fps*1000);
    report.files.push({...skill,file,frames:meta.pages,durationMs:frameCount/fps*1000,bytes:fs.statSync(path.join(out,file)).size,damage:samples.at(-1).damage,bundleSHA256:report.bundleSHA256});
    if(stampede){
      const lifecycle=await page.evaluate(async species=>{
        const r=app.run,p=r.player,m=p.moves[0];m.timer=0;fusionAdvance();m.timer=999;
        const batch=r.sprites.getHeroGhostGlyph(species),ghost=r.ghosts.find(g=>g.fireGlyph);
        const fullAlpha=batch.zxGroup.aFx.getY(0),life=ghost.t;
        const art=r.vfx.crafted.stampede,flameAlpha=art.pose.getY(0),poses=Array.from(art.pose.array),particles=art.particles.length;
        fusionDraw();const paused=ghost.t===life&&particles===art.particles.length&&poses.every((v,i)=>v===art.pose.array[i]);
        const opacity=r.vfx.opacity,ownOpacity=r.vfx.ownOpacity;
        r.vfx.opacity=opacity*.5;r.vfx.ownOpacity=ownOpacity*.4;fusionDraw();
        const fadedAlpha=batch.zxGroup.aFx.getY(0),fadedFlameAlpha=art.pose.getY(0);
        r.vfx.opacity=opacity;r.vfx.ownOpacity=ownOpacity;
        p.setSpecies(species===6?4:species+1);await r.sprites.prepareHeroForm(p.speciesId);
        for(let i=0;i<3;i++)fusionAdvance();
        const frozenForm=r.ghosts.filter(g=>g.fireGlyph).every(g=>g.species===species)&&art.particles.every(p=>p.species===species)&&r.zones.list.filter(z=>z.stampedeFire).every(z=>z.stampedeSpecies===species);
        const correctScale=ghost.scale===1&&batch.zxGhostScale>1;
        r.hideOwnFx=true;fusionDraw();for(let i=0;i<5;i++)fusionAdvance();
        const hidden=r.ghosts.every(g=>!g.fireGlyph)&&batch.zxGroup.mesh.count===0&&art.mesh.count===0&&art.particles.length===0;
        r.hideOwnFx=false;
        r.zones.clear();r.vfx.clear();r.ghosts.length=0;fusionDraw();
        const cleared=art.mesh.count===0&&art.particles.length===0&&r.ghosts.length===0;
        return {paused,fullAlpha,fadedAlpha,flameAlpha,fadedFlameAlpha,frozenForm,correctScale,hidden,cleared,renderOrder:batch.zxGroup.mesh.renderOrder,gl:app.r.renderer.getContext().getError()};
      },skill.species);
      assert.ok(lifecycle.paused&&lifecycle.frozenForm&&lifecycle.correctScale&&lifecycle.hidden&&lifecycle.cleared);
      assert.ok(lifecycle.fullAlpha>0&&Math.abs(lifecycle.fadedAlpha/lifecycle.fullAlpha-.2)<.001);
      assert.ok(lifecycle.flameAlpha>0&&Math.abs(lifecycle.fadedFlameAlpha/lifecycle.flameAlpha-.2)<.001);
      assert.equal(lifecycle.renderOrder,1);assert.equal(lifecycle.gl,0);
      report.files.at(-1).lifecycle=lifecycle;
    }
    fs.writeFileSync(path.join(qa,skill.species+'-'+skill.key+'-frames.json'),JSON.stringify(samples,null,2));
    const recordFile=path.join(out,'导出记录.json');
    const previous=process.env.FUSION_GIF_KEY&&fs.existsSync(recordFile)?JSON.parse(fs.readFileSync(recordFile,'utf8')).files:[];
    fs.writeFileSync(recordFile,JSON.stringify({...report,files:[...previous.filter(f=>!report.files.some(current=>current.key===f.key)),...report.files]},null,2));
    console.log('Exported '+file);
  }
  assert.deepEqual(errors,[]);
  assert.equal(bundleHash(),report.bundleSHA256,'The recorded package must not change during capture');
  fs.writeFileSync(path.join(out,'说明.txt'),(stampede?'烈焰狂奔属于炎系普通技能，炎、焱、燚分别使用自己的字形残影。':'当前炎、风可合成的四项融合技能。')+`\r\n每个 GIF：390×${outputHeight}，${fps}帧/秒，${frameCount/fps}秒，无限循环。\r\n来自当前微信构建包的桌面模拟环境，实际调用技能，固定靶怪，1级技能，单次释放；不是手机录屏。\r\n`);
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
