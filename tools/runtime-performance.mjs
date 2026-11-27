import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {reviewGlyphCrowd} from './regression/glyph-crowd-regression.mjs';
import {reviewCharacters} from './regression/character-regression.mjs';
import {reviewWorkshop} from './regression/workshop-regression.mjs';
import {reviewStylizedVFX} from './regression/stylized-vfx-regression.mjs';
import {reviewPaperBatching} from './regression/paper-batching-regression.mjs';
import {profileRuntime} from './build/runtime-profile.mjs';
import {reviewLateCrowd} from './regression/late-crowd-regression.mjs';
import {reviewRingShader} from './regression/ring-shader-regression.mjs';
import {reviewMapEffects} from './regression/map-effects-regression.mjs';
import {reviewQuality} from './regression/quality-regression.mjs';
import {reviewClarity} from './regression/clarity-regression.mjs';
import {reviewExperiencePerformance} from './regression/experience-performance.mjs';
import {reviewDeveloper,enterDeveloperFromHome} from './developer/regression.mjs';
import {auditGeometry} from './developer/geometry-audit.mjs';
import {reviewOptimizations} from './regression/optimization-regression.mjs';
import {reviewCrowdRender} from './regression/crowd-render-regression.mjs';
import {reviewBattleLoad} from './regression/battle-load-regression.mjs';
import {reviewBattleVisual} from './regression/battle-visual-regression.mjs';
import {reviewIOSBudget,installNativePerformanceFixture,reviewNativePerformance} from './regression/ios-budget-regression.mjs';
import {iphoneCases,reviewIOSLateGame} from './regression/ios-late-game.mjs';
import {reviewPhonePerformance} from './regression/phone-performance-regression.mjs';
import {fixtureSubpackage} from './build/fixture-play-chunks.mjs';
import {gameProject} from './build/project-target.mjs';
const root=path.resolve(import.meta.dirname,'..'),development=process.argv.includes('--dev');
const game=process.env.POKEBONK_GAME||path.join(gameProject(root,development),'minigame');
const fireReview=['--fire-family','--fire-family-media','--fire-fusions','--fire-completion','--fusion-cleanup'].some(arg=>process.argv.includes(arg));
const dir=process.env.POKEBONK_QA||path.join(root,process.argv.includes('--landscape')?'验收/横屏演示':process.argv.includes('--summon-mode')?'验收/召唤门蓝红双版':process.argv.includes('--skill-availability')?'验收/技能移除与空气斩':fireReview?'验收/炎技能回归':'验收/手机运行优化-20261109/性能');fs.mkdirSync(dir,{recursive:true});
const {build}=await import(pathToFileURL(path.join(root,'tools/node_modules/esbuild/lib/main.js')));
const {default:puppeteer}=await import(pathToFileURL(path.join(root,'tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')));
const fixture=(await build({bundle:true,entryPoints:[path.join(root,'tools/build/wx-fixture.mjs')],write:false,format:'iife'})).outputFiles[0].text;
const config=JSON.parse(fs.readFileSync(path.join(game,'game.json'),'utf8'));
assert.equal(config.iOSHighPerformance,true);assert.equal(config['iOSHighPerformance+'],true);
assert.equal(config.plugins?.MiniGameCommon,undefined,'Build must not declare the removed power-mode plugin');
const modules=[],packageData={main:[]},packageEntries={};
for(const pkg of config.subpackages){packageData[pkg.name]=[];packageEntries[pkg.name]=pkg.root.endsWith('.js')?pkg.root:pkg.root+'/game.js';}
for(const entry of fs.readdirSync(game,{recursive:true})){
  const file=entry.split(path.sep).join('/');
  const pkg=config.subpackages.find(({root})=>file===root||file.startsWith(root+'/'));
  if(!pkg&&file.endsWith('.js'))modules.push(file);
  if(/\.(br|bin)$/.test(file))packageData[pkg?.name||'main'].push(file);
}
const urls=new Set(Object.values(packageData).flat().map(file=>'/'+file));
const boot='const defs={},cache={};\n'+modules.map(p=>'defs['+JSON.stringify(p)+']=function(require,module,exports){\n'+fs.readFileSync(path.join(game,p),'utf8')+'\n};').join('\n')+
  '\nfunction load(p){if(!defs[p])throw Error(p);if(cache[p])return cache[p].exports;const m=cache[p]={exports:{}};defs[p](q=>load(p.slice(0,p.lastIndexOf("/")+1)+q.slice(2)+".js"),m,m.exports);return m.exports;}window.loadFixtureData("main").then(()=>load("game.js"));';
const srv=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html;charset=utf-8');return res.end('<meta charset="utf-8"><style>*{margin:0}canvas{display:block;width:100vw;height:100vh}</style><body><script src="/fixture.js"></script><script src="/boot.js"></script>');}
  if(req.url==='/fixture.js'||req.url==='/boot.js'){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(req.url==='/boot.js'?boot:'window.packageData='+JSON.stringify(packageData)+';window.packageEntries='+JSON.stringify(packageEntries)+';'+fixture);}
  if(Object.values(packageEntries).includes(req.url.slice(1))){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(fixtureSubpackage(game,req.url.slice(1)));}
  if(urls.has(req.url))return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  if(/^\/play\/opening\/p\d{2}\.webp$/.test(req.url)){
    res.setHeader('content-type','image/webp');
    return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  }
  res.statusCode=404;res.end();
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(String(e));console.error('Runtime error:',String(e));});
  page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|Shader Error|VALIDATE_STATUS/.test(m.text())){errors.push(m.text());if(process.argv.includes('--debug-shaders'))console.error(m.text().slice(0,1800));}});
  const iphone=process.argv.includes('--ios-late-game')?iphoneCases[process.env.POKEBONK_IPHONE||'13']:null;
  if(process.argv.includes('--ios-late-game')&&!iphone)throw Error('Unknown iPhone fixture');
  const landscape=process.argv.includes('--landscape');
  const wide=landscape||process.argv.includes('--wide');
  await page.setViewport(iphone?.viewport||(wide?{width:844,height:390,deviceScaleFactor:1.5}:{width:390,height:844,deviceScaleFactor:3}));
  if(iphone)await page.evaluateOnNewDocument(model=>{
    window.fixtureDeviceInfo={model};window.fixtureBenchmark=null;
  },iphone.model);
  if(process.argv.includes('--native-performance'))await page.evaluateOnNewDocument(installNativePerformanceFixture);
  await page.evaluateOnNewDocument(platform=>{
    window.fixturePlatform=platform;
    window.phoneLayout=true;window.auditUIUploads=0;window.auditControlUploads=0;window.auditUploadBytes=0;window.auditHealthBytes=0;window.auditPortraitBytes=0;
    const proto=WebGL2RenderingContext.prototype;
    for(const name of ['texImage2D','texSubImage2D']){
      const original=proto[name];proto[name]=function(...args){
        const canvas=args.at(-1);
        if(platform==='ios'&&canvas&&canvas===window.inspected?.health?.canvas)throw Error('Health must use the iOS pixel-buffer upload');
        if(canvas===window.inspected?.uiCanvas){window.auditUIUploads++;window.auditUploadBytes+=canvas.width*canvas.height*4;}else if(canvas&&(canvas===window.inspected?.controls?.canvas||canvas===window.inspected?.controls?.knobCanvas)){window.auditControlUploads++;window.auditUploadBytes+=canvas.width*canvas.height*4;}else if(canvas&&(canvas===window.inspected?.minimap?.canvas||canvas===window.inspected?.health?.canvas||canvas===window.inspected?.portrait?.canvas||window.inspected?.hudLayers?.some(layer=>layer.canvas===canvas))){window.auditUploadBytes+=canvas.width*canvas.height*4;if(canvas===window.inspected?.health?.canvas)window.auditHealthBytes+=canvas.width*canvas.height*4;if(canvas===window.inspected?.portrait?.canvas)window.auditPortraitBytes+=canvas.width*canvas.height*4;}
        return original.apply(this,args);
      };
    }
  },process.argv.includes('--android-performance')?'android':iphone||process.argv.some(arg=>['--ios-budget','--memory-soak','--crowded-steering','--battle-visual','--native-performance'].includes(arg))?'ios':'devtools');
  await page.goto('http://127.0.0.1:'+srv.address().port);
  await page.waitForFunction(()=>window.releaseTextDownload&&window.releaseOptionalDownloads);
  await page.evaluate(()=>{releaseTextDownload();releaseOptionalDownloads();});
  await page.waitForFunction(()=>window.app?.zixing&&(app.screen?.querySelector('button')||
    (app.run?.state==='play'&&!app.starting&&!app.entryOpening)),{timeout:90000});
  if(landscape){
    const {reviewLandscape}=await import('./regression/landscape-regression.mjs');
    await reviewLandscape(page,dir);assert.deepEqual(errors,[]);
  }else{
  // A fresh profile can now boot straight into its first journey.
  await page.evaluate(()=>{if(app.run&&!app.screen)app.toMenu();});
  console.log('Home ready; creating an isolated run for workload counts.');
  if(development){
    await page.waitForFunction(()=>window.inspected?.env.__zixingDeveloper);
    assert.equal(await page.evaluate(()=>inspected.doc.querySelector('#zx-dev-version')?.textContent),'开发测试版 DEV 8');
    await page.screenshot({path:path.join(dir,'dev-home.png')});
  }
  const fiveMinute=process.argv.includes('--five-minute');
  const upgradeResume=process.argv.includes('--upgrade-resume');
  const evolutionResume=process.argv.includes('--evolution-resume');
  const deskReview=process.argv.some(arg=>['--map-play','--illustrated-desk','--weather-effects','--hud-reference','--difficulty','--enemy-shot'].includes(arg));
  const repeatableMap=!!iphone||deskReview||(!development&&(fiveMinute||upgradeResume||fireReview||['--crowded-steering','--profile','--battle-visual','--battle-pacing','--boss-performance','--summon-mode','--hand-drawn-fireball','--fire-breath','--startup-soak','--android-stability','--frame-stability'].some(arg=>process.argv.includes(arg))));
  const initial=await page.evaluate(async({development,repeatableMap,upgradeResume,evolutionResume})=>{
    const account=await app.backend.guest();await app.meta.load(account);
    app.applySettings();
    const initial={quality:app.meta.profile.settings.quality,locked:app.meta.profile.settings.lock30Fps,fpsCap:app.fpsCap(),frameGap:app.frameGap()};
    Object.assign(app.meta.profile.settings,{quality:upgradeResume||evolutionResume?'low':'high',fpsLimit:60});app.applySettings();
    // Prevent the software rasterizer from monopolizing startup. Manual sample frames follow.
    window.realFrameGap=app.frameGap.bind(app);
    app.frameGap=()=>250;
    if(repeatableMap){
      const start=app.backend.startRun.bind(app.backend);
      app.backend.startRun=async(...args)=>({...await start(...args),seed:53090});
      let seed=53090;
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    }
    if(development)return initial;
    await inspected.env.prepareForest();
    if(!await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw app.lastStartError??Error('Start failed');
    app.halted=true;app.run.godMode=true;app.run.queueLevelUp=()=>{};
    // startRun warms the transition frame before switching to play. Show the
    // gameplay HUD once before freezing frames for deterministic measurements.
    app.run.update(1/60);
    return initial;
  },{development,repeatableMap,upgradeResume,evolutionResume});
  assert.equal(initial.quality,'high');assert.equal(initial.locked,iphone?.lock30??false);assert.equal(initial.fpsCap,iphone?.lock30?30:60);
  if(development)await enterDeveloperFromHome(page,dir);
  if(development&&(fireReview||process.argv.some(arg=>['--illustrated-desk','--hand-drawn-fire-spin','--fire-breath'].includes(arg)))){
    // Art reviews must show the actual desktop, not the default developer
    // dialog or its scenery-hidden workload preset.
    await page.evaluate(()=>{const dev=inspected.env.__zixingDeveloper;dev.options.hideScenery=false;dev.close();app.run.renderWorld(0);});
  }
  await new Promise(resolve=>setTimeout(resolve,2000));
  if(process.argv.includes('--hud-reference')){
    const {reviewHudReference}=await import('./regression/hud-reference-regression.mjs');
    await reviewHudReference(page,dir);assert.deepEqual(errors,[]);
  }else if(iphone){
    await reviewIOSLateGame(page,dir,iphone);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--crowded-steering')){
    const {reviewCrowdedSteering}=await import('./regression/crowded-steering.mjs');
    await reviewCrowdedSteering(page,dir,process.argv.includes('--baseline'));assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--region-atlas')){
    const {reviewRegionAtlas}=await import('./regression/region-atlas-regression.mjs');
    await reviewRegionAtlas(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--battle-labels')){
    const {reviewBattleLabels}=await import('./regression/battle-labels-regression.mjs');
    await reviewBattleLabels(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--ultimate-ready')){
    const {reviewUltimateReady}=await import('./regression/ultimate-ready-regression.mjs');
    await reviewUltimateReady(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--ultimate-cast')){
    const {reviewUltimateCast}=await import('./regression/ultimate-cast-regression.mjs');
    await reviewUltimateCast(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--capture-universal')){
    const {reviewCaptureUniversal}=await import('./regression/capture-universal-regression.mjs');
    await reviewCaptureUniversal(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--capture-bag')){
    const {reviewCaptureBag}=await import('./regression/capture-bag-regression.mjs');
    await reviewCaptureBag(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--capture-rewards')){
    const {reviewCaptureRewards}=await import('./regression/capture-rewards-regression.mjs');
    await reviewCaptureRewards(page);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--late-combat-feedback')){
    const {reviewLateFeedback}=await import('./regression/late-combat-feedback.mjs');
    await reviewLateFeedback(page);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--enemy-shot')){
    const {reviewEnemyShot}=await import('./regression/enemy-shot-regression.mjs');
    await reviewEnemyShot(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--combat-audio')){
    const {reviewCombatAudio}=await import('./regression/combat-audio-regression.mjs');
    await reviewCombatAudio(page);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--idle-warmup')){
    const result=await page.evaluate(()=>{
      const run=app.run,sprites=run.sprites,gap=1000/30,clock=run.time,count=run.enemies.count;
      let now=performance.now();
      // Drive the frame-budget inputs deterministically on the shipped renderer.
      for(let i=0;i<360;i++)run.idleWarmup.afterFrame(run,gap,gap,gap-4,now+=gap);
      const pending=[...sprites.batches.values()].filter(batch=>batch.warmOnly);
      if(!pending.length)throw Error('No active enemy glyph batches prepared');
      const first=pending[0],unmoved=run.time===clock&&run.enemies.count===count;
      const p=run.player.pos;
      const slot=run.enemies.spawnProxy(first.id,p.x+2,p.y,p.z,0,1,first.zxGlyph);
      const reused=slot>=0&&sprites.batches.get(first.zxBatchKey)===first&&!first.warmOnly;
      sprites.discardUnusedWarmGlyphs();
      return {pending:pending.length,reused,unmoved,kept:sprites.batches.has(first.zxBatchKey),
        discarded:pending.slice(1).every(batch=>!sprites.batches.has(batch.zxBatchKey))};
    });
    console.log('Idle warmup:',result);
    assert.ok(result.pending<=6&&result.reused&&result.unmoved&&result.kept&&result.discarded);
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--gourd-offscreen')){
    const {reviewGourdOffscreen}=await import('./regression/gourd-offscreen-regression.mjs');
    await reviewGourdOffscreen(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--berry-pickup')){
    const {verifyBerryPickup}=await import('./regression/berry-pickup-regression.mjs');
    await verifyBerryPickup(page,dir);
    await page.evaluate(()=>app.run.changeZone());
    assert.equal(await page.evaluate(()=>app.run.stage),2);
    await verifyBerryPickup(page,dir);
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--facility-grey-rings')){
    const {reviewFacilityGreyRings}=await import('./regression/facility-grey-rings-regression.mjs');
    await reviewFacilityGreyRings(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--countdown-dock')){
    const {reviewCountdownDock}=await import('./regression/countdown-dock-regression.mjs');
    await reviewCountdownDock(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--evolution-resume')){
    const {reviewEvolutionResume}=await import('./regression/evolution-resume-regression.mjs');
    await reviewEvolutionResume(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--upgrade-effects')){
    const {reviewUpgradeEffects}=await import('./regression/upgrade-effects-regression.mjs');
    await reviewUpgradeEffects(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--summon-mode')){
    const {reviewSummonModes}=await import('./regression/summon-mode-regression.mjs');
    await reviewSummonModes(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--frame-stability')){
    const {reviewFrameStability}=await import('./regression/frame-stability-regression.mjs');
    await reviewFrameStability(page,dir,process.argv.includes('--baseline'));assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--portal-crossing')){
    const {reviewPortalCrossing}=await import('./regression/exit-guidance-regression.mjs');
    for(const stage of [2,4]){
      assert.deepEqual(await reviewPortalCrossing(page),{stage,cleared:false,hidden:true});
      console.log('Portal crossed without a blank frame, destination stage',stage);
    }
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--exit-guidance')){
    const {reviewExitGuidance}=await import('./regression/exit-guidance-regression.mjs');
    await reviewExitGuidance(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--android-stability')){
    const {reviewAndroidStability}=await import('./regression/android-stability-regression.mjs');
    await reviewAndroidStability(page,dir,process.argv.includes('--baseline'));assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--map-wind')||process.argv.includes('--polaroid')){
    const {reviewMapWind}=await import('./regression/map-wind-regression.mjs');
    await reviewMapWind(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--boss-telegraphs')){
    const {reviewBossTelegraphs}=await import('./regression/boss-telegraph-regression.mjs');
    await reviewBossTelegraphs(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--boss-performance')){
    const {reviewBossPerformance}=await import('./regression/boss-performance-regression.mjs');
    await reviewBossPerformance(page,dir,process.argv.includes('--baseline'),process.argv.includes('--boss-programs'));assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--difficulty')){
    const {reviewDifficulty}=await import('./regression/difficulty-regression.mjs');
    await reviewDifficulty(page);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--battle-pacing')){
    const {reviewBattlePacing}=await import('./regression/battle-pacing-regression.mjs');
    await reviewBattlePacing(page);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--android-performance')&&process.argv.includes('--startup-soak')){
    const {reviewAndroidStartup}=await import('./regression/android-startup-regression.mjs');
    await reviewAndroidStartup(page,dir,process.argv.includes('--baseline'));assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--android-performance')){
    const samples=await page.evaluate(()=>{
      const samples=[];
      for(const quality of ['low','medium','high']){
        app.meta.profile.settings.quality=quality;app.applySettings();
        app.run.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
        const {renderer,composer,sun}=app.r,gl=renderer.getContext();
        const shader=renderer.info.programs
          .flatMap(p=>gl.getAttachedShaders(p.program))
          .filter(s=>gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER)
          .map(s=>gl.getShaderSource(s)).find(src=>src.includes('coverage+=workshopShadowTap'));
        samples.push({quality,world:[composer.inputBuffer.width,composer.inputBuffer.height],
          ui:[inspected.uiCanvas.width,inspected.uiCanvas.height],shadow:sun.shadow.mapSize.x,
          filterTaps:shader?.match(/coverage\+=workshopShadowTap/g)?.length,
          platform:inspected.env.nativeDevice.platform,fps:app.fpsCap(),error:gl.getError()});
      }
      return samples;
    });
    const baseline=process.argv.includes('--baseline');
    const worldSizes=baseline?[[390,844],[585,1266],[780,1688]]:[[390,844],[487,1055],[585,1266]];
    const shadowSizes=baseline?[1024,1536,2048]:[1024,1024,1536];
    console.log('Android WebGL workload',samples);
    for(const [i,sample] of samples.entries()){
      assert.equal(sample.platform,'android');assert.equal(sample.error,0);
      assert.deepEqual(sample.world,worldSizes[i]);
      assert.deepEqual(sample.ui,[780,1688]);assert.equal(sample.fps,60);
      assert.equal(sample.shadow,shadowSizes[i]);assert.equal(sample.filterTaps,baseline?8:4);
    }
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--native-performance')){
    await reviewNativePerformance(page,dir);assert.deepEqual(errors,[]);
  }else if(upgradeResume){
    const {reviewUpgradeResume}=await import('./regression/upgrade-resume-regression.mjs');
    await reviewUpgradeResume(page,dir,process.argv.includes('--baseline'));assert.deepEqual(errors,[]);
  }else if(fiveMinute){
    const {reviewFiveMinute,playFiveMinutes}=await import('./regression/five-minute-regression.mjs');
    if(process.argv.includes('--soak'))await playFiveMinutes(page,dir);
    else await reviewFiveMinute(page,dir,process.argv.includes('--baseline'));
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--wind-animation')){
    const {reviewWindAnimation}=await import('./regression/wind-animation-regression.mjs');
    await reviewWindAnimation(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--spring-shoes')){
    const {reviewSpringShoes}=await import('./regression/spring-shoes-regression.mjs');
    await reviewSpringShoes(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--illustrated-desk')){
    const {reviewIllustratedDesk}=await import('./regression/illustrated-desk-regression.mjs');
    await reviewIllustratedDesk(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--desktop-layout')){
    const {reviewDesktopLayout}=await import('./regression/desktop-layout-regression.mjs');
    await reviewDesktopLayout(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--map-play')){
    const {reviewMapPlay}=await import('./regression/map-play-regression.mjs');
    await reviewMapPlay(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--weather-effects')){
    const {reviewWeatherEffects}=await import('./regression/weather-effects-regression.mjs');
    await reviewWeatherEffects(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--vfx')){
    await reviewStylizedVFX(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--workshop')){
    await reviewWorkshop(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--phone-performance')){
    await reviewPhonePerformance(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--memory-soak')){
    const {reviewMemorySoak}=await import('./regression/memory-soak-regression.mjs');
    await reviewMemorySoak(page,dir);
  }else if(process.argv.includes('--ios-budget')){
    await reviewIOSBudget(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--battle-visual')){
    await reviewBattleVisual(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--battle-load')){
    await reviewBattleLoad(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--crowd-render')){
    await reviewCrowdRender(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--characters')){
    await reviewCharacters(page,dir);assert.deepEqual(errors,[]);
  }else if((process.argv.includes('--map-effects')||process.argv.includes('--minimap'))){
    await reviewMapEffects(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--clarity')){
    await reviewClarity(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--quality')){
    await reviewQuality(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--optimize')){
    await reviewOptimizations(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--paper-batching')){
    await reviewPaperBatching(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--rings')){
    await reviewRingShader(page,dir);assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--crowd')){
    await reviewLateCrowd(page,dir);assert.deepEqual(errors,[]);
  }else if(development){
    await reviewDeveloper(page,dir);
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--geometry')){
    await auditGeometry(page,dir);
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--experience')){
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await page.setViewport({width,height,deviceScaleFactor:3});
      await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
      await new Promise(resolve=>setTimeout(resolve,180));
      const widthDir=path.join(dir,String(width));fs.mkdirSync(widthDir,{recursive:true});
      await reviewExperiencePerformance(page,widthDir);
    }
    assert.deepEqual(errors,[]);
  }else if(process.argv.includes('--profile')){
    await profileRuntime(page,dir);
    assert.deepEqual(errors,[]);
  }else{
  const report={environment:'Compiled WeChat game / Chrome SwiftShader. Workload counts, NOT phone FPS.',initial,samples:[],errors};
  for(const quality of ['low','medium','high']){
    report.samples.push(await page.evaluate(quality=>{
      const run=app.run,r=app.r;app.meta.profile.settings.quality=quality;app.applySettings();r.setDynRes(1);
      run.updateCamera(1);run.renderWorld(0);run.vfx.update(0);r.scene.updateMatrixWorld(true);
      let submitted=0;for(const mesh of run.terrain.group.children)if(mesh.isInstancedMesh)mesh.onBeforeRender=()=>submitted+=mesh.count;
      const info=r.renderer.info;info.autoReset=false;r.render(0);info.reset();submitted=0;r.render(0);
      inspected.env.invalidateUI();inspected.env.drawUI(r.renderer);
      return {quality,calls:info.render.calls,triangles:info.render.triangles,submitted,
        authored:run.terrain.group.children.reduce((n,m)=>n+(m.userData.paperInstances?.total||0),0),
        colliders:run.terrain.colliders.length,props:run.terrain.zxProps.length,interactions:run.interactables.list.length,
        bloom:r.bloom.intensity,outline:r.outlinePass.enabled,worldPixels:r.composer.inputBuffer.width*r.composer.inputBuffer.height,
        uiPixels:inspected.uiCanvas.width*inspected.uiCanvas.height,
        profile:{...run.performance},sky:r.sky.visible};
    },quality));
    await page.screenshot({path:path.join(dir,'battle-'+quality+'.png')});
  }
  report.paperBatching=await reviewPaperBatching(page,dir);
  report.stationaryCulling=await page.evaluate(()=>{
    const run=app.run,terrain=run.terrain,player=run.player.pos.clone(),target=run.camTarget.clone();
    const saved=[];let reads=0;
    for(const mesh of terrain.group.children){
      const data=mesh.userData.paperInstances;if(!data)continue;
      const bounds=data.bounds;saved.push([data,bounds]);
      data.bounds=new Proxy(bounds,{get(t,key){if(typeof key==='string'&&/^\d+$/.test(key))reads++;return Reflect.get(t,key,t);}});
    }
    try{
      delete terrain.zxVisibilityView;run.renderWorld(0);const initialReads=reads;
      const initialCounts=terrain.group.children.map(m=>m.visible?m.count:0);
      reads=0;for(let i=0;i<60;i++)run.renderWorld(0);const stationaryReads=reads;
      const cachedCounts=terrain.group.children.map(m=>m.visible?m.count:0);
      run.player.pos.x+=12;run.camTarget.copy(run.player.pos);run.updateCamera(1);reads=0;run.renderWorld(0);
      return {frames:60,initialReads,stationaryReads,movingReads:reads,initialCounts,cachedCounts};
    }finally{
      for(const [data,bounds] of saved)data.bounds=bounds;
      run.player.pos.copy(player);run.camTarget.copy(target);run.updateCamera(1);run.renderWorld(0);
    }
  });
  assert.ok(report.stationaryCulling.initialReads>0&&report.stationaryCulling.movingReads>0);
  assert.equal(report.stationaryCulling.stationaryReads,0,'Still cameras must not rescan scenery bounds');
  assert.deepEqual(report.stationaryCulling.cachedCounts,report.stationaryCulling.initialCounts);
  report.touch=await page.evaluate(async()=>{
    const run=app.run,r=app.r,input=run.input,stick=run.ui.touch.stick;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=inspected.env.innerWidth*.5-screen.x,y=inspected.env.innerHeight*.65-screen.y;
    // Warm first-interaction audio/settings before measuring the joystick.
    window.tap(x,y,'down',77);window.tap(x,y,'up',77);
    await new Promise(resolve=>setTimeout(resolve,120));
    inspected.env.invalidateUI();inspected.env.drawUI(r.renderer);
    let before=auditUIUploads;for(let i=0;i<10;i++)inspected.env.drawUI(r.renderer);
    const idleUploads=auditUIUploads-before;
    window.tap(x,y,'down',77);inspected.env.drawUI(r.renderer);
    before=auditUIUploads;const tiles=auditControlUploads,bytes=auditUploadBytes,directions=[];
    for(let i=0;i<10;i++){
      window.tap(x+12+i*2,y-8,'move',77);inspected.env.drawUI(r.renderer);
      run.ui.touch.driveStick(input,1/30,performance.now());
      directions.push([input.stickX,input.stickY]);
    }
    const result={moves:10,idleUploads,fullUploads:auditUIUploads-before,controlUploads:auditControlUploads-tiles,uploadedBytes:auditUploadBytes-bytes,directions,
      tileSize:[inspected.controls.canvas.width,inspected.controls.canvas.height],screenSize:[inspected.uiCanvas.width,inspected.uiCanvas.height]};
    window.tap(x+30,y-8,'up',77);inspected.env.drawUI(r.renderer);
    run.ui.touch.driveStick(input,1/30,performance.now());
    result.released=input.stickX===0&&input.stickY===0;
    result.hiddenOnRelease=!stick.classList.contains('on');
    // The floating stick is no longer drawn on release. Check its displayed
    // center on the next contact, including when the touch origin changes.
    window.tap(x+8,y+8,'down',78);inspected.env.drawUI(r.renderer);
    const b=inspected.layout.box(stick),k=inspected.layout.box(run.ui.touch.knob);
    result.centerError=Math.hypot(k.x+k.w/2-b.x-b.w/2,k.y+k.h/2-b.y-b.h/2);
    window.tap(x+8,y+8,'up',78);inspected.env.drawUI(r.renderer);
    return result;
  });
  // Manual drawUI calls above intentionally isolate texture work. Repaint the
  // world for the screenshot, just as the real game loop does every frame.
  await page.evaluate(()=>{app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'joystick-released.png')});
  report.health=await page.evaluate(async()=>{
    const run=app.run,r=app.r,p=run.player,health=inspected.doc.querySelector('.zx-player-health'),position=p.pos.clone(),hp=p.hp;
    run.ui.hud(run);inspected.env.drawUI(r.renderer);
    await new Promise(resolve=>setTimeout(resolve,150));inspected.env.drawUI(r.renderer);
    const uploads=auditUIUploads,bytes=auditHealthBytes,start=health.style.transform;
    for(let i=1;i<=10;i++){p.pos.x=position.x+i*.2;run.ui.hud(run);inspected.env.drawUI(r.renderer);}
    const motion={fullUploads:auditUIUploads-uploads,bytes:auditHealthBytes-bytes,moved:health.style.transform!==start};
    const before={uploads:auditUIUploads,bytes:auditHealthBytes};p.hp=p.maxHp*.5;run.ui.hud(run);inspected.env.drawUI(r.renderer);
    const damage={fullUploads:auditUIUploads-before.uploads,bytes:auditHealthBytes-before.bytes,progress:Number(health.dataset.progress)};
    p.pos.copy(position);p.hp=hp;run.ui.hud(run);inspected.env.drawUI(r.renderer);
    return {motion,damage,size:[inspected.health.canvas.width,inspected.health.canvas.height]};
  });
  report.visibility=await page.evaluate(()=>{
    const run=app.run,enemies=run.enemies,sprites=run.sprites,position=run.player.pos.clone();
    run.updateCamera(1);sprites.begin(app.r.camera);
    let visibleFar;
    for(let z=-32;z<-18;z++)if(sprites.visible(position.x,.5,position.z+z,0)){visibleFar={x:position.x,z:position.z+z};break;}
    if(!visibleFar)throw Error('Fixture needs an on-screen enemy beyond the old 18-unit cutoff');
    enemies.clear();
    enemies.spawn(16,position.x+3,position.z,1,1,0);
    enemies.spawn(16,visibleFar.x,visibleFar.z,1,1,0);
    enemies.spawn(16,position.x+180,position.z+180,1,1,0);
    enemies.spawn(16,position.x-180,position.z-180,1,1,4);
    let draws=0;const get=sprites.get;sprites.get=function(...args){draws++;return get.apply(this,args);};
    const counts=[];
    try{
      for(const saved of ['all','near','close']){
        run.meta.profile.settings.enemyView=saved;sprites.begin(app.r.camera);draws=0;enemies.render();counts.push({saved,draws});
      }
      run.player.pos.set(position.x+180,0,position.z+180);run.camTarget.copy(run.player.pos);run.updateCamera(1);
      sprites.begin(app.r.camera);draws=0;enemies.render();
      return {counts,revealedAfterMoving:draws,alive:enemies.count,visibleFarDistance:Math.hypot(visibleFar.x-position.x,visibleFar.z-position.z)};
    }finally{
      sprites.get=get;run.player.pos.copy(position);run.camTarget.copy(position);run.updateCamera(1);enemies.clear();delete run.meta.profile.settings.enemyView;
    }
  });
  report.gameplay=await page.evaluate(()=>{
    const run=app.run,p=run.pickups,terrain=run.terrain;
    app.meta.profile.settings.quality='low';app.applySettings();
    const totals=()=>{const out=[0,0];for(let i=0;i<p.n;i++)if(p.alive[i]&&p.kind[i]<2)out[p.kind[i]]+=p.value[i];return out;};
    p.clear();for(let i=0;i<180;i++){p.spawn('xp',80+(i%4)*.1,0,80,3);p.spawn('coin',90+(i%4)*.1,0,90,5);}
    for(let i=0;i<p.n;i++)p.age[i]=3;
    const before={count:p.count,totals:totals()};p.consolidate();const after={count:p.count,totals:totals()};
    const colliders=terrain.colliders.filter(c=>c.paperBox);
    const misses=colliders.filter(c=>!terrain.hitProp(c.x,.1,c.z,.3)).length;
    const first=colliders[0],resolved={x:0,z:0};terrain.resolve(first.x,first.z,.5,.3,resolved);
    const escaped=!terrain.hitProp(resolved.x,.3,resolved.z,.49);
    run.enemies.clear();run.director.update=()=>{};run.queueLevelUp=()=>{};run.pendingLevels=0;
    run.stageTime=300; // Standard zones reach the full population at five minutes.
    const far=[];
    for(let i=0;i<200;i++){
      const a=i*2.39996,d=i<120?8+(i%15):30+(i%30),x=run.player.pos.x+Math.cos(a)*d,z=run.player.pos.z+Math.sin(a)*d;
      const id=run.enemies.spawn(16,x,z,1,1,512);if(i>=120&&id>=0)far.push({id,x,z});
    }
    for(let i=0;i<40;i++)run.update(1/60);
    let finite=true;for(let i=0;i<run.enemies.n;i++)if(run.enemies.alive[i])finite&&=Number.isFinite(run.enemies.x[i]+run.enemies.y[i]+run.enemies.z[i]);
    const farMoved=far.filter(({id,x,z})=>run.enemies.alive[id]&&Math.hypot(run.enemies.x[id]-x,run.enemies.z[id]-z)>.05).length;
    return {loot:{before,after},colliders:colliders.length,misses,escaped,stress:{activeEnemies:run.enemies.count,finite,farMoved,state:run.state,particles:run.vfx.add.n,particleLimit:run.vfx.add.limit,texts:run.vfx.text.items.length,textLimit:run.vfx.text.limit}};
  });
  await page.evaluate(()=>{app.r.render(0);inspected.env.drawUI(app.r.renderer);});
  await page.screenshot({path:path.join(dir,'controlled-200-enemies.png')});
  if(process.argv.includes('--glyph-crowd'))report.glyphCrowd=await reviewGlyphCrowd(page,dir);
  report.hud=await page.evaluate(async()=>{
    const run=app.run,r=app.r,layout=inspected.layout,refresh=layout.refresh;
    let layouts=0,layoutMs=0;layout.refresh=function(...args){const start=performance.now();layouts++;const result=refresh.apply(this,args);layoutMs+=performance.now()-start;return result;};
    const before={uploads:auditUIUploads,bytes:auditUploadBytes},began=performance.now();
    try{
      for(let i=0;i<30;i++){run.update(.12);r.render(.12);inspected.env.drawUI(r.renderer);await new Promise(resolve=>setTimeout(resolve,120));}
      return {ticks:30,elapsedMs:performance.now()-began,layouts,layoutMs,uploads:auditUIUploads-before.uploads,bytes:auditUploadBytes-before.bytes,
        uiSize:[inspected.uiCanvas.width,inspected.uiCanvas.height],enemies:run.enemies.count};
    }finally{layout.refresh=refresh;}
  });
  report.minimap=await page.evaluate(async()=>{
    const r=app.r,run=app.run;
    inspected.env.invalidateUI();inspected.env.drawUI(r.renderer);
    await new Promise(resolve=>setTimeout(resolve,120));inspected.env.drawUI(r.renderer);
    const uploads=auditUIUploads,bytes=auditUploadBytes;
    run.ui.minimap.dataset.frame='isolated';await new Promise(resolve=>setTimeout(resolve,120));
    r.render(0);inspected.env.drawUI(r.renderer);
    return {fullUploads:auditUIUploads-uploads,bytes:auditUploadBytes-bytes,size:[inspected.minimap.canvas.width,inspected.minimap.canvas.height]};
  });
  if(process.argv.includes('--sustained')){
    console.log('Checking six simulated minutes of repeated combat (not phone thermal/FPS measurement).');
    report.sustained=await page.evaluate(async()=>{
      const run=app.run,r=app.r,samples=[],maxHp=run.player.maxHp;
      // Keep the isolated workload alive without bypassing hit/status logic.
      run.player.hp=run.player.maxHp=1e9;
      for(let cycle=0;cycle<12;cycle++){
        run.enemies.clear();
        for(let i=0;i<200;i++){const a=i*2.4,d=8+i%30;run.enemies.spawn(16,run.player.pos.x+Math.cos(a)*d,run.player.pos.z+Math.sin(a)*d,1,1,512);}
        for(let i=0;i<600;i++){
          run.update(.05);
          if(i%60===0){r.render(.05);inspected.env.drawUI(r.renderer);await new Promise(resolve=>setTimeout(resolve,0));}
        }
        r.render(0);
        samples.push({cycle,time:run.time,state:run.state,enemies:run.enemies.count,pickups:run.pickups.count,particles:run.vfx.add.n,
          geometries:r.renderer.info.memory.geometries,textures:r.renderer.info.memory.textures,batches:run.sprites.batches.size});
      }
      run.player.maxHp=maxHp;run.player.hp=maxHp;return samples;
    });
    fs.writeFileSync(path.join(dir,'sustained.json'),JSON.stringify(report.sustained,null,2));
    assert.ok(report.sustained.every(s=>s.state==='play'&&s.particles<=600),JSON.stringify(report.sustained));
    const stable=report.sustained.slice(3);
    assert.ok(stable.at(-1).time>300,'The simulation must keep advancing throughout the workload');
    assert.ok(stable.at(-1).textures<=stable[0].textures+2&&stable.at(-1).geometries<=stable[0].geometries+2,'Repeated combat must not accumulate GPU resources');
  }
  report.frameSampling=await page.evaluate(async()=>{
    // The fixture intentionally renders at 4 FPS. Actual-frame diagnostics must
    // not report the simulation clock's clamped minimum of 10 FPS.
    app.run.player.hp=app.run.player.maxHp;app.run.player.iframes=10;
    const start=performance.now();
    app.halted=false;
    try{
      while(performance.now()-start<15000){
        await new Promise(resolve=>setTimeout(resolve,120));
        if(app.perf.active&&app.perf.fps>0&&app.perf.started>=start+1000)break;
      }
      return {fps:app.perf.fps,state:app.run.state};
    }finally{app.halted=true;}
  });
  report.settings=await page.evaluate(async()=>{
    Object.assign(app.meta.profile.settings,{zxExtraControls:true,aimMode:'manual'});app.applySettings();
    const removedControls={count:inspected.doc.querySelectorAll('.tc-jump,.tc-dash,.tc-lock,.tc-aim').length,aimMode:app.run.aimMode};
    const run=app.run;run.state='paused';app.zixing.settings(()=>{});
    const click=(selector,label)=>{const el=[...inspected.doc.querySelectorAll(selector)].find(el=>el.textContent===label);if(!el)throw Error('Missing option '+label);el.click();};
    const applied=[];
    for(const label of ['流畅','均衡','精致']){
      click('.zx-option',label);
      applied.push({label,actual:run.performance.name,uiPixels:inspected.uiCanvas.width*inspected.uiCanvas.height,
        worldPixels:app.r.composer.inputBuffer.width*app.r.composer.inputBuffer.height,
        selected:inspected.doc.querySelector('.zx-options .zx-option.on').textContent});
    }
    app.meta.profile.settings.touchScale=.85;app.applySettings();await app.meta.saveNow();
    const saved=JSON.parse(wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile.settings;
    run.state='play';
    const toggle=()=>inspected.doc.querySelector('[aria-label="锁定 30 帧"]').click();toggle();
    const locked={quality:app.meta.profile.settings.quality,profile:run.performance.name,bloom:app.r.bloom.intensity,fpsCap:app.fpsCap(),frameGap:realFrameGap()};toggle();
    // Old web-only battery preferences must not override the native switch.
    inspected.env.localStorage.setItem('pb-battery','1');app.applySettings();
    const restoredFps={fpsCap:app.fpsCap(),frameGap:realFrameGap(),locked:app.meta.profile.settings.lock30Fps};
    inspected.env.localStorage.removeItem('pb-battery');
    app.meta.profile.settings.fpsLimit=30;app.applySettings();
    const legacyFps=app.fpsCap();
    const adaptive=(locked,measured,busy=false)=>{
      Object.assign(app.meta.profile.settings,{quality:'medium',frameRateMode:'manual',lock30Fps:locked});app.applySettings();app.r.setDynRes(1);
      app.dyn={t:0,frames:0,js:0,good:0,wait:8,lastUp:-1e9};delete inspected.env.__dynFps;
      for(let i=0;i<125;i++)app.adaptRes(busy?1000/measured*.9:2,1/measured,100000+i*1000/measured);
      return app.r.dynRes;
    };
    const dynamicResolution={atLocked30:adaptive(true,30),overloaded60:adaptive(false,30),busyNative:adaptive(false,11,true)};
    delete inspected.env.__dynFps;app.meta.profile.settings.quality='high';app.applySettings();app.r.setDynRes(1);
    run.state='paused';
    inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer,true);
    return {saved:{quality:saved.quality,touchScale:saved.touchScale},applied,removedControls,locked,restored:run.performance.name,restoredFps,legacyFps,dynamicResolution,options:[...inspected.doc.querySelectorAll('.zx-option')].map(el=>el.textContent)};
  });
  await page.screenshot({path:path.join(dir,'settings-quality.png')});
  if(report.glyphCrowd){
    report.glyphCrowd.disposal=await page.evaluate(()=>{
      const ring=app.run.playerFootRing;let geometry=false,material=false;
      ring.geometry.addEventListener('dispose',()=>geometry=true);ring.material.addEventListener('dispose',()=>material=true);
      app.run.dispose();return {removed:!ring.parent,geometry,material};
    });
    assert.deepEqual(report.glyphCrowd.disposal,{removed:true,geometry:true,material:true});
  }
  fs.writeFileSync(path.join(dir,'runtime-performance.json'),JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);
  assert.equal(report.touch.idleUploads,0);assert.equal(report.touch.fullUploads,0);
  assert.equal(report.touch.controlUploads,0);assert.ok(report.touch.uploadedBytes<10*5266560*.1);
  assert.ok(report.touch.released&&report.touch.hiddenOnRelease&&report.touch.centerError<1);
  assert.ok(report.touch.directions.every(([x,y])=>x>0&&y>0));
  assert.ok(report.visibility.visibleFarDistance>18);assert.deepEqual(report.visibility.counts.map(c=>c.draws),[2,2,2]);
  assert.equal(report.visibility.revealedAfterMoving,1);assert.equal(report.visibility.alive,4);
  const [low,medium,high]=report.samples;
  assert.ok(low.worldPixels<medium.worldPixels&&medium.worldPixels<high.worldPixels);
  assert.equal(low.uiPixels,high.uiPixels);assert.equal(medium.uiPixels,high.uiPixels);
  assert.equal(low.profile.outline,false);assert.equal(low.profile.bloom,false);assert.ok(high.profile.outline&&high.profile.bloom);
  for(const sample of report.samples){
    // The illustrated desk enforces its ink outline and disables bloom on every preset.
    assert.equal(sample.outline,true);assert.equal(sample.bloom,0);
    assert.ok(sample.submitted<sample.authored*.4);assert.equal(sample.sky,false);
    assert.equal(sample.interactions,26);assert.equal(sample.colliders,sample.props);
  }
  assert.deepEqual(report.gameplay.loot.before.totals,report.gameplay.loot.after.totals);assert.ok(report.gameplay.loot.after.count<report.gameplay.loot.before.count);
  assert.equal(report.gameplay.misses,0);assert.ok(report.gameplay.escaped&&report.gameplay.stress.finite);assert.equal(report.gameplay.stress.state,'play');
  assert.ok(report.gameplay.stress.activeEnemies>=190&&report.gameplay.stress.farMoved>0,'Throttled distant enemies must continue simulating');
  assert.ok(report.gameplay.stress.particles<=report.gameplay.stress.particleLimit&&report.gameplay.stress.texts<=report.gameplay.stress.textLimit);
  assert.deepEqual(report.settings.saved,{quality:'high',touchScale:.85});assert.equal(report.settings.locked.quality,'high');assert.equal(report.settings.locked.profile,'精致');assert.equal(report.settings.restored,'精致');
  assert.deepEqual(report.settings.removedControls,{count:0,aimMode:'auto'});
  for(const result of report.settings.applied){assert.equal(result.actual,result.label);assert.equal(result.selected,result.label);}
  const [smooth,balanced,fine]=report.settings.applied;
  assert.ok(smooth.worldPixels<balanced.worldPixels&&balanced.worldPixels<fine.worldPixels);
  assert.equal(smooth.uiPixels,fine.uiPixels);assert.equal(balanced.uiPixels,fine.uiPixels);
  assert.deepEqual(report.settings.options,['流畅','均衡','精致']);
  assert.equal(report.settings.locked.fpsCap,30);assert.ok(Math.abs(report.settings.locked.frameGap-1000/30)<.1);
  assert.equal(report.settings.restoredFps.fpsCap,60);assert.equal(report.settings.restoredFps.locked,false);assert.equal(report.settings.restoredFps.frameGap,1000/60);
  assert.equal(report.settings.legacyFps,60);
  assert.equal(report.settings.dynamicResolution.atLocked30,1);assert.equal(report.settings.dynamicResolution.overloaded60,1);
  assert.equal(report.settings.dynamicResolution.busyNative,1,'Low FPS must not override the selected resolution');
  assert.ok(report.hud.bytes<100000000,'Low quality must reduce full HUD and minimap upload bandwidth');
  assert.equal(report.minimap.fullUploads,0,'A minimap refresh must not upload the whole screen');
  assert.ok(report.minimap.bytes>0&&report.minimap.bytes<200000,'Minimap uses its own small texture');
  assert.ok(report.health.motion.moved);assert.equal(report.health.motion.fullUploads,0);assert.equal(report.health.motion.bytes,0,'Moving the foot health bar reuses its texture');
  assert.equal(report.health.damage.progress,.5);assert.equal(report.health.damage.fullUploads,0);assert.ok(report.health.damage.bytes>0&&report.health.damage.bytes<100000,'Health changes upload only the small health texture');
  assert.ok(report.frameSampling.fps>0&&report.frameSampling.fps<7,JSON.stringify(report.frameSampling));
  console.log(JSON.stringify({initial,samples:report.samples.map(({quality,calls,triangles,submitted,colliders,worldPixels})=>({quality,calls,triangles,submitted,colliders,worldPixels})),touch:report.touch,visibility:report.visibility,gameplay:report.gameplay,settings:report.settings},null,2));
  }
  }
}finally{await browser.close();await new Promise(r=>srv.close(r));}
