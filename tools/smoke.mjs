import {FOREST_ROUTE} from '../source/src/data/lite-rules.js';
import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {build} from 'esbuild';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import {reviewMenus} from './regression/menu-regression.mjs';
import {reviewUIPerformance} from './regression/ui-perf.mjs';
import {reviewZixing} from './regression/zixing-regression.mjs';
import {reviewPaper} from './regression/paper-regression.mjs';
import {reviewLoading,reviewNetworkActions} from './regression/loading-regression.mjs';
import {reviewScenes} from './regression/scene-regression.mjs';
import {reviewStarters} from './regression/starter-regression.mjs';
import {reviewUpgrade} from './regression/upgrade-regression.mjs';
import {reviewBattleFeedback} from './regression/battle-feedback-regression.mjs';
import {fixtureSubpackage} from './build/fixture-play-chunks.mjs';
import {reviewAltarRing} from './regression/altar-ring-regression.mjs';
import {reviewRunSettlement,reviewStartupLatency} from './regression/startup-regression.mjs';
import {prepareReturningPlayer,verifyEntry} from './regression/entry-regression.mjs';
import {gameProject} from './build/project-target.mjs';
const root=path.resolve(import.meta.dirname,'..'),game=path.resolve(process.env.POKEBONK_GAME||path.join(gameProject(root,process.argv.includes('--dev')),'minigame'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir=process.env.POKEBONK_QA||path.join(os.tmpdir(),'pokebonk-native-check');fs.mkdirSync(dir,{recursive:true});
const fixture=(await build({bundle:true,entryPoints:[path.join(import.meta.dirname,'build/wx-fixture.mjs')],write:false,format:'iife'})).outputFiles[0].text;
// On the phone the main CommonJS loader cannot see modules inside a subpackage.
const config=JSON.parse(fs.readFileSync(path.join(game,'game.json'),'utf8'));
assert.equal(config.deviceOrientation,'landscape');
const subpackages=config.subpackages || [];
const modules=[], packageData={main:[]};
const packageEntries={};
for(const pkg of subpackages)packageData[pkg.name]=[];
for(const pkg of subpackages)packageEntries[pkg.name]=pkg.root.endsWith('.js')?pkg.root:pkg.root.replace(/\/$/,'')+'/game.js';
for(const entry of fs.readdirSync(game,{recursive:true})){
  const file=entry.split(path.sep).join('/');
  const pkg=subpackages.find(({root})=>file===root||file.startsWith(root.replace(/\/$/,'')+'/'));
  if(!pkg && file.endsWith('.js'))modules.push(file);
  if(/\.(br|bin)$/.test(file))packageData[pkg?.name||'main'].push(file);
}
const dataUrls=new Set(Object.values(packageData).flat().map(file=>'/'+file));
function script(){return 'const defs={}, cache={};\n'+modules.map(p=>'defs['+JSON.stringify(p)+']=function(require,module,exports){\n'+fs.readFileSync(path.join(game,p),'utf8')+'\n};').join('\n')+
 '\nfunction load(p){if(!defs[p])throw Error("module "+p+" is not defined");if(cache[p])return cache[p].exports;const m=cache[p]={exports:{}};const req=q=>load(p.slice(0,p.lastIndexOf("/")+1)+q.slice(2)+".js");defs[p](req,m,m.exports);return m.exports;}'+
 '\nwindow.loadFixtureData("main").then(async()=>{if(window.eagerEntry)await window.runFixtureEntry("play");load("game.js");}).catch(e=>{window.problem=e.message;console.error(e);});';}
const srv=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html; charset=utf-8');return res.end('<meta charset=utf-8><style>*{margin:0}canvas{display:block;width:100vw;height:100vh}</style><body><script src="/fixture.js"></script><script src="/boot.js"></script>');}
  if(req.url==='/fixture.js'||req.url==='/boot.js'){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(req.url==='/fixture.js'?'window.packageData='+JSON.stringify(packageData)+';window.packageEntries='+JSON.stringify(packageEntries)+';\n'+fixture:script());}
  if(Object.values(packageEntries).includes(req.url.slice(1))){res.setHeader('content-type','application/javascript;charset=utf-8');return res.end(fixtureSubpackage(game,req.url.slice(1)));}
  if(dataUrls.has(req.url))return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  if(/^\/play\/opening\/p\d{2}\.webp$/.test(req.url)){
    res.setHeader('content-type','image/webp');
    return fs.createReadStream(path.join(game,req.url.slice(1))).pipe(res);
  }
  if(req.url==='/favicon.ico'){res.statusCode=204;return res.end();}
  res.statusCode=404;res.end();
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const b=await puppeteer.launch({executablePath:chrome,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
if(process.argv.includes('--coop')){
  try {
    const {reviewCoop}=await import('./regression/coop-regression.mjs');
    await reviewCoop(b,srv.address().port);
  } finally { await b.close();srv.close(); }
  process.exit(0);
}
const page=await b.newPage(),errors=[];
let homePainted=false;
page.on('console',m=>{if(m.type()==='info'&&m.text().startsWith('[宝可梦启动] 游戏首页已绘制'))homePainted=true;});
page.on('console',async m=>{if(m.type()==='error'||m.type()==='warn'){const msg=m.text();if(!msg.includes('favicon')&&!msg.includes('ReadPixels')){
  console.log(m.type(),msg.slice(0,600));if(m.type()==='error')for(const arg of m.args())try{const stack=await arg.evaluate(a=>a?.stack);if(stack)console.log(stack.slice(0,1400));}catch{}
  if(m.type()==='error'&&!msg.includes('404 (Not Found)'))errors.push(msg);}}});
page.on('pageerror',e=>{console.error(e.stack);errors.push(e.message);});
await page.setViewport(process.argv.some(arg=>['--cold-start','--opening-flow'].includes(arg))?{width:844,height:390,deviceScaleFactor:1}:
  process.argv.includes('--entry-flow')?{width:382,height:826,deviceScaleFactor:1}:{width:390,height:844,deviceScaleFactor:1});
// The phone runtime may omit internationalization and browser/Node Base64 globals.
await page.evaluateOnNewDocument(()=>{
  for(const name of ['Intl','atob','btoa','Buffer'])delete window[name];
  // Observe the submitted WebGL uniforms without adding a diagnostics API to the game.
  const gl=WebGL2RenderingContext.prototype,lookup=gl.getUniformLocation,set=gl.uniform1i;
  for(const method of ['texImage2D','texSubImage2D']){
    const original=gl[method];
    gl[method]=function(...args){
      if(window.uiPerf&&args[args.length-1]===window.inspected?.uiCanvas){
        uiPerf.uploads++;if(method==='texImage2D')uiPerf.allocations++;
      }
      if(window.upgradeAudit){
        const canvas=args[args.length-1];
        if(canvas===window.inspected?.uiCanvas)upgradeAudit.uploads++;
        if(window.inspected?.modalTransition?.canvases.includes(canvas)&&++upgradeAudit.panelUploads===1)
          upgradeAudit.clock+=upgradeAudit.firstUploadMs||0;
      }
      return original.apply(this,args);
    };
  }
  const locations=new WeakMap(),bootLocations=new WeakSet();
  window.bootPercentages=[];window.bootLabels=[];
  const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(label,...args){
    if(/^\d+(\.\d+)?%$/.test(label))window.bootLabels.push(label);
    return fillText.call(this,label,...args);
  };
  window.holdHomeStatus=true;
  gl.getUniformLocation=function(program,name){
    const loc=lookup.call(this,program,name);
    if(name==='percent' && loc)locations.set(program,loc);
    if(name==='overScene' && locations.has(program))bootLocations.add(locations.get(program));
    return loc;
  };
  gl.uniform1i=function(loc,value){
    if(loc && bootLocations.has(loc)){
      window.bootPercentages.push(value);
      if(value===100 && !window.checkedFullBar){
        window.checkedFullBar=true;
        requestAnimationFrame(()=>{window.fullBarBeforeHome=!GameGlobal.pokebonk.bootDiagnostics.completed;});
      }
    }
    return set.call(this,loc,value);
  };
});
const failFrame=process.argv.includes('--fail-first-frame');
const menusOnly=process.argv.includes('--menus-only');
const uiPerfOnly=process.argv.includes('--ui-perf');
const phoneLayout=process.argv.includes('--phone-layout')||menusOnly||process.argv.includes('--coop-style-only');
if(phoneLayout)await page.evaluateOnNewDocument(()=>{window.phoneLayout=true;});
if(process.argv.includes('--loading-perf')&&!process.argv.includes('--baseline'))await page.evaluateOnNewDocument(()=>{localStorage.setItem('pokebonk.web.pokebonk.lang','fr');});
if(process.argv.includes('--eager-entry'))await page.evaluateOnNewDocument(()=>{window.eagerEntry=true;});
if(process.argv.includes('--entry-file-fallback'))await page.evaluateOnNewDocument(()=>{window.failEntryInline=true;});
if(failFrame)await page.evaluateOnNewDocument(()=>{window.failFirstFrame=true;});
if(process.argv.includes('--retry-text'))await page.evaluateOnNewDocument(()=>{window.dropTextOnce=true;});
if(process.argv.includes('--stale-resource-pack'))await page.evaluateOnNewDocument(()=>{window.fixtureStaleResourcePack=true;});
if(process.argv.includes('--missing-text-callback'))await page.evaluateOnNewDocument(()=>{window.fixtureMissingTextCallback=true;});
if(process.argv.includes('--legacy-runtime'))await page.evaluateOnNewDocument(()=>{
  // Some phone 2D contexts only implement the older path primitives.
  for(const method of ['ellipse','roundRect','setLineDash'])delete CanvasRenderingContext2D.prototype[method];
  delete window.BigInt;
  delete DataView.prototype.setBigUint64;
  delete Array.prototype.flat;
  delete Array.prototype.flatMap;
  delete String.prototype.matchAll;
  delete String.prototype.replaceAll;
  delete Object.fromEntries;
  delete Object.hasOwn;
  delete Promise.prototype.finally;
  delete Array.prototype.at;
  delete String.prototype.at;
  window.TextDecoder=window.TextEncoder=undefined;
});
const coldStart=process.argv.includes('--cold-start');
if(!process.argv.includes('--opening-flow')&&!coldStart)await page.evaluateOnNewDocument(()=>{window.fixtureReturning=true;window.fixtureStartAtHome=true;});
if(coldStart){
  const packageBytes=Object.fromEntries(subpackages.map(pkg=>[pkg.name,fs.readdirSync(path.join(game,pkg.root),{recursive:true})
    .map(file=>fs.statSync(path.join(game,pkg.root,file))).reduce((sum,stat)=>sum+(stat.isFile()?stat.size:0),0)]));
  await page.evaluateOnNewDocument(packageBytes=>{
    window.holdHomeStatus=false;window.fixturePlatform='android';window.coldPackageBytes=packageBytes;
    // Controlled per-package transport: 200 ms latency plus 2 MiB/s.
    // This is a repeatable comparison, not a prediction of real phone networks.
    window.fixtureDownloadDelays=Object.fromEntries(Object.entries(packageBytes).map(([name,bytes])=>[name,200+bytes/(2*1048576)*1000]));
    addEventListener('DOMContentLoaded',()=>{releaseTextDownload();releaseOptionalDownloads();});
  },packageBytes);
}
if(process.argv.includes('--opening-retry'))await page.evaluateOnNewDocument(()=>{window.failOpeningResources=true;});
if(process.argv.includes('--opening-flow'))await page.evaluateOnNewDocument(()=>{window.fixturePlatform='android';});
if(process.argv.includes('--resource-read-recovery'))await page.evaluateOnNewDocument(()=>{
  window.fixtureResourceReadRecovery=true;
  window.fixtureResourceReads={asyncFailures:0,unmounted:0,unrooted:0,recovered:0};
});
await page.goto('http://127.0.0.1:'+srv.address().port);
console.log('CDP',b.wsEndpoint(),dir);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function verifyProgressImage(percent, filename){
  const image=await page.screenshot(filename?{path:path.join(dir,filename)}:{});
  const after=await page.evaluate(()=>parseFloat(bootLabels[bootLabels.length-1]));
  const {data,info:{width,height,channels}}=await sharp(image).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const sx=Math.min(width/390,height/550),origin=width>height?width*.745-195*sx:(width-390*sx)/2;
  const left=Math.round(origin+31*sx),right=Math.round(origin+357*sx);
  const y=Math.floor(width>height?height*.66+3*sx:height*.93-5*sx);
  let filled=0;
  for(let x=left;x<right;x++){
    const at=(y*width+x)*channels;
    // Include the warm highlight sweeping across the live yellow fill.
    if(data[at]>=247&&data[at+1]>=189&&data[at+1]<=241&&data[at+2]>=37&&data[at+2]<=168)filled++;
  }
  // The bar can advance while the screenshot is captured; its caption is an
  // integer but the fill moves in tenths of a percent.
  const minimum=326*sx*Math.min(percent,after)/100-2;
  const maximum=326*sx*Math.min(100,Math.max(percent,after)+1)/100+2;
  assert.ok(filled>=minimum&&filled<=maximum,'Paper slip progress bar between '+percent+'% and '+after+'%');
  if(percent>=85){
    // The approved logo has a warm face and white keyline across the dark diagonal.
    let highlights=0;
    for(let y=Math.floor(height*.37);y<height*.58;y++)for(let x=Math.floor(width*.1);x<width*.9;x++){
      const i=(y*width+x)*channels;
      if(data[i]>235&&data[i+1]>235&&data[i+2]>235)highlights++;
    }
    assert.ok(highlights>150*sx*sx,'The title wordmark is visible');
  }
  assert.ok(await page.evaluate(p=>window.bootLabels.includes(p+'%'),percent),'Readable percentage was painted');
  const {channels:rgb}=await sharp(image).removeAlpha().stats();
  assert.ok(rgb.some(channel=>channel.max-channel.min>100),'Stationery illustration is visible');
}
async function verifyStartup(){
  await page.waitForFunction(()=>window.textRequested&&window.playDownloaded||window.problem,{timeout:20000});
  if(await page.evaluate(()=>window.problem))throw Error(await page.evaluate(()=>window.problem));
  if(process.argv.includes('--stale-resource-pack')){
    assert.deepEqual(await page.evaluate(()=>({
      mounted:staleResourcePaths.map(path=>{wx.getFileSystemManager().accessSync(path);return true;}),
      downloads:requestedPackages.filter(name=>name==='text').length,
      reads:resourcePackageReads,
    })),{mounted:[true,true],downloads:1,reads:[]},'Stale mounted resources must not skip the current package download');
  }
  const baseline=process.argv.includes('--baseline');
  await page.waitForFunction(floor=>bootPercentages[bootPercentages.length-1]>=floor,{},baseline?35:30);
  const playReady=await page.evaluate(()=>bootPercentages[bootPercentages.length-1]);
  assert.ok(baseline ? playReady===35||playReady===50 : playReady>=30&&playReady<100);
  if(!baseline){
    const labels=await page.evaluate(()=>bootLabels.map(parseFloat));
    assert.ok(labels.every((v,i)=>!i||v>=labels[i-1]&&v-labels[i-1]<=3.01),'The displayed bar advances smoothly without moving backwards');
  }
  const halfText=baseline?(playReady===35?42:67):35;
  await verifyProgressImage(await page.evaluate(()=>parseFloat(bootLabels[bootLabels.length-1])));
  await page.evaluate(()=>window.reportTextProgress(50));
  await page.waitForFunction(p=>bootPercentages[bootPercentages.length-1]>=p,{},halfText);
  if(!baseline){
    const waiting=await page.evaluate(()=>({value:parseFloat(bootLabels[bootLabels.length-1]),at:bootLabels.length}));
    await page.waitForFunction(value=>parseFloat(bootLabels[bootLabels.length-1])>value,{timeout:4000},waiting.value);
    const values=await page.evaluate(at=>bootLabels.slice(at-1).map(parseFloat),waiting.at);
    assert.ok(values.every((value,i)=>value<100&&(!i||value>=values[i-1])),
      'A held download keeps advancing without regressions or premature completion');
  }
  await verifyProgressImage(await page.evaluate(()=>parseFloat(bootLabels[bootLabels.length-1])),'00-loading.png');
  const checkGlyphGate=process.argv.includes('--loading-perf')&&!process.argv.includes('--baseline');
  if(checkGlyphGate)await page.evaluate(()=>{
    const files=GameGlobal.pokebonk.files,resolve=files.resolvePath.bind(files);
    files.resolvePath=async function(url){
      if(url==='assets/glyphs/atlas.png'){
        await new Promise(done=>{window.releaseGlyphAtlas=done;});
        files.resolvePath=resolve;
      }
      return resolve(url);
    };
  });
  const retryInstall=process.argv.includes('--boot-only')&&!baseline&&!failFrame;
  if(retryInstall)await page.evaluate(()=>{
    const files=GameGlobal.pokebonk.files,resolve=files.resolvePath.bind(files);
    files.resolvePath=async function(url){
      if(url==='assets/ui-paper/journey-desk.webp'){
        await new Promise(done=>{window.releaseHomeDesk=done;});
      }
      return resolve(url);
    };
    const manager=wx.getFileSystemManager(),write=manager.writeFile,modal=wx.showModal;
    manager.writeFile=function(options){
      if(!options.filePath.includes('/text-'))return write.call(this,options);
      manager.writeFile=write;
      options.fail({errMsg:'测试文字资源写入中断'});
    };
    wx.showModal=function(options){
      wx.showModal=modal;
      if(!options.content.includes('测试文字资源写入中断'))return modal(options);
      window.retryBootInstall=options;
    };
  });
  await page.evaluate(baseline=>{window.releaseTextDownload();if(baseline)window.releaseOptionalDownloads();},baseline);
  if(retryInstall){
    await page.waitForFunction(()=>window.retryBootInstall||window.problem);
    assert.deepEqual(await page.evaluate(()=>[retryBootInstall.confirmText,bootPercentages.includes(100)]),['重试',false]);
    await page.evaluate(()=>{window.beforeRetryLabel=bootLabels.length;retryBootInstall.success({confirm:true});});
  }
  if(checkGlyphGate){
    await page.waitForFunction(()=>typeof releaseGlyphAtlas==='function');
    await page.evaluate(()=>releaseHomeStatus());
    await page.waitForFunction(()=>bootPercentages[bootPercentages.length-1]>=52);
    await verifyProgressImage(await page.evaluate(()=>parseFloat(bootLabels[bootLabels.length-1])));
    assert.equal(await page.evaluate(()=>!!app.screen?.querySelector('button')||bootPercentages.includes(100)),false);
    await page.evaluate(()=>releaseGlyphAtlas());
  }
  if(failFrame){
    await page.waitForFunction(()=>window.problem,{timeout:20000});
    const message=await page.evaluate(()=>window.problem);
    if(!message.includes('test: first game frame failed'))throw Error(message);
    assert.ok(!(await page.evaluate(()=>bootPercentages.includes(100))),'Failed home frame reached 100%');
    console.log('First game frame error reached the native startup dialog');
    return;
  }
  if(!checkGlyphGate){
    await page.waitForFunction(floor=>window.homeStatusRequested && window.bootPercentages.at(-1)>=floor ||window.problem,{timeout:60000},baseline?97:56);
    if(await page.evaluate(()=>window.problem))throw Error(await page.evaluate(()=>window.problem));
    await verifyProgressImage(await page.evaluate(()=>parseFloat(bootLabels.at(-1))),'00-background.png');
    if(process.argv.includes('--opening-flow')&&!process.argv.includes('--opening-retry')){
      await page.evaluate(()=>{
        const call=wx.cloud.callContainer;
        const gate=new Promise(resolve=>{window.releaseOpeningProfile=resolve;});
        wx.cloud.callContainer=async options=>{
          window.openingProfileRequested=true;
          await gate;
          return call(options);
        };
      });
    }
    await page.evaluate(()=>window.releaseHomeStatus());
  }
  if(process.argv.includes('--stale-resource-pack')){
    const audit=await page.evaluate(()=>({
      current:packageData.text.find(file=>file.endsWith('/assets.bin')),
      old:staleResourcePaths,
      reads:resourcePackageReads,
      downloads:requestedPackages.filter(name=>name==='text').length,
    }));
    assert.match(audit.current,/^packs\/text-[a-f0-9]{16}\/assets\.bin$/);
    assert.ok(audit.reads.includes(audit.current),'Startup must decode the current content-addressed archive');
    assert.ok(audit.old.every(file=>!audit.reads.includes(file)),'Startup must never read an old mounted archive');
    assert.equal(audit.downloads,1,'A current mounted package can complete even without its callback');
    console.log('Stale mounted resource packages ignored; current archive loaded:',audit.current);
  }
  if(process.argv.includes('--opening-flow')){
    await (await import('./regression/opening-regression.mjs')).verifyOpening({page,dir});
    return;
  }
  await page.waitForFunction(()=>window.app?.screen?.querySelector('button')||window.problem,{timeout:90000});
  if(await page.evaluate(()=>window.problem))throw Error(await page.evaluate(()=>window.problem));
  if(retryInstall)assert.equal(await page.evaluate(()=>requestedPackages.filter(name=>name==='play').length),1);
  await page.waitForFunction(()=>!window.loadingTitle&&window.app?.screen?.querySelector('.auth-body button,[data-action="journey"]'),{timeout:15000});
  if(!baseline){
    await page.waitForFunction(()=>GameGlobal.pokebonk.bootDiagnostics.completed&&requestedPackages.includes('world'));
    if(process.argv.includes('--resource-read-recovery')){
      const recovery=await page.evaluate(()=>({
        ...fixtureResourceReads,textDownloads:requestedPackages.filter(name=>name==='text').length,
        completed:GameGlobal.pokebonk.bootDiagnostics.completed,
      }));
      assert.ok(recovery.asyncFailures>0&&recovery.unmounted>0&&recovery.unrooted>0&&recovery.recovered>0);
      assert.equal(recovery.textDownloads,2,'Missing bytes require exactly one automatic remount');
      assert.equal(recovery.completed,true);
      fs.writeFileSync(path.join(dir,'resource-read-recovery.json'),JSON.stringify(recovery,null,2)+'\n');
      console.log('Device file read errors recovered:',JSON.stringify(recovery));
    }
    assert.ok(await page.evaluate(()=>window.fullBarBeforeHome && bootLabels.includes('100%')),
      'The completed bar must survive a display frame before the home handoff');
    // Cloud login is nonblocking. Screenshot capture may already finish boot
    // before releaseHomeStatus; anchor this check to the controlled retry.
    if(retryInstall)assert.ok(await page.evaluate(()=>bootLabels.slice(beforeRetryLabel).some(label=>{
      const value=parseFloat(label);return value>parseFloat(bootLabels[beforeRetryLabel-1]) && value<100;
    })),'The remaining progress must animate before reaching 100%');
    assert.ok(await page.evaluate(()=>app.screen.dataset.page==='home'&&bootPercentages.includes(100)&&requestedPackages.includes('art')),
      'Home must remain usable while the early scene downloads are held');
    assert.ok(await page.evaluate(()=>!requestedPackages.includes('capture_bag')),'Capture effects are only needed in a run');
    if(retryInstall)await page.evaluate(()=>window.releaseHomeDesk());
    await page.evaluate(()=>window.releaseOptionalDownloads());
  }
  if(process.argv.includes('--software-render')){
    await page.evaluate(()=>{window.productionFrameGap=app.frameGap.bind(app);app.frameGap=()=>250;app.r.setDynRes(.6);});
    console.log('Software rendering check: reduced 3D frame rate and adaptive scene resolution; native UI resolution unchanged');
  }
  const canvasChecks=await page.evaluate(()=>{
    const screen=inspected.doc.getElementById('game'),gl=screen.getContext('webgl2');
    const canvas=inspected.doc.createElement('canvas'),ctx=canvas.getContext('2d');
    ctx.fillStyle='#123456';ctx.fillRect(0,0,2,2);
    const target=inspected.doc.createElement('canvas'),copy=target.getContext('2d');
    copy.drawImage(canvas,0,0);
    const raw=screen._surface.getContext('webgl2'),property=Object.getOwnPropertyDescriptor(raw,'canvas');
    return [property.configurable,property.writable,raw.canvas===screen._surface,gl.canvas===screen,
      ctx.canvas===canvas,Reflect.set(gl,'canvas',canvas),gl.getParameter===gl.getParameter,
      Boolean(gl.getParameter(gl.VERSION)),Array.from(copy.getImageData(0,0,1,1).data)];
  });
  assert.deepEqual(canvasChecks,[false,false,true,true,true,false,true,true,[18,52,86,255]]);
  // Exercise both consumers: named HTML entities and imported CSS data URLs.
  const decoded=await page.evaluate(()=>{
    const el=inspected.doc.createElement('div'),style=inspected.doc.createElement('style');
    el.innerHTML='&amp;&Afr;&NotEqualTilde;';
    style.textContent='@import url("data:text/css;base64,LnByb2JlIHsgY29sb3I6IHJlZDsgfQ");';
    return [el.textContent,style.sheet.cssRules[0].styleSheet.cssRules[0]?.style.getPropertyValue('color')];
  });
  if(decoded[0]!=='&𝔄≂̸'||decoded[1]!=='red')throw Error('Base64 decode regression: '+JSON.stringify(decoded));
  const dimensions=await page.evaluate(()=>{
    const style=inspected.doc.createElement('style');
    style.textContent='.probe{width:99.9999995px;left:-0.0000004px;top:-1.2345675px;opacity:0.12345678}';
    const values=style.sheet.cssRules[0].style;
    return ['width','left','top','opacity'].map(key=>values.getPropertyValue(key)).join(' ');
  });
  if(dimensions!=='100px 0px -1.234568px 0.123457')throw Error('CSS number formatting regression: '+dimensions);
  async function shown(selector,expected=1){
    try{await page.waitForFunction((selector,expected)=>{
      const elements=[...inspected.doc.querySelectorAll(selector)];
      return elements.length===expected&&elements.every(el=>{
        const b=inspected.layout.box(el);
        return b&&b.opacity>0&&b.w>1&&b.h>1&&b.x>=b.clip.x-1&&b.y>=b.clip.y-1&&
          b.x+b.w<=b.clip.r+1&&b.y+b.h<=b.clip.b+1;
      });
    },{timeout:10000,polling:100},selector,expected);}
    catch(error){
      const boxes=await page.evaluate(sel=>[...inspected.doc.querySelectorAll(sel)].map(el=>{
        const b=inspected.layout.box(el);
        return b&&[b.x,b.y,b.w,b.h,b.clip];
      }),selector);
      await page.screenshot({path:path.join(dir,'layout-failure.png')});
      throw Error('Not fully visible: '+selector+' ('+expected+' expected) '+JSON.stringify(boxes),{cause:error});
    }
  }
  async function resize(width,height){
    await page.setViewport({width,height,deviceScaleFactor:2});
    // Explicitly deliver the fixture resize after CDP has applied the viewport;
    // background software-rendered tabs can defer the browser's resize event.
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    try{await page.waitForFunction((w,h)=>inspected.env.innerWidth===(window.phoneLayout&&w>h?w-44:w)&&
      inspected.env.innerHeight===(window.phoneLayout?(w<=h?h-98:h-44):h)&&inspected.env.matchMedia('(orientation: portrait)').matches===(w<=h),
      {timeout:10000,polling:100},width,height);}
    catch(error){console.error('Resize state',await page.evaluate(()=>({outer:[innerWidth,innerHeight],native:[inspected.env.innerWidth,inspected.env.innerHeight],portrait:inspected.env.matchMedia('(orientation: portrait)').matches,hidden:inspected.doc.hidden})));throw error;}
  }
  async function tap(selector,match){
    const target=await page.waitForFunction((selector,match)=>{
      if(inspected.doc.querySelector('.wipe'))return false;
      // Isolated combat tests halt the main loop. Late viewport events and
      // modal changes still need a UI frame to rebuild the touch hit map.
      if(app.halted)inspected.env.drawUI(app.r.renderer);
      for(const el of inspected.doc.querySelectorAll(selector)){
        if(match&&!el.textContent.includes(match)||el.offsetWidth<=2)continue;
        const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
        if(el.contains(inspected.layout.hit(x,y))){
          const screen=inspected.doc.getElementById('game').getBoundingClientRect();
          window.tap(x-screen.left,y-screen.top);return {x,y,label:el.textContent.slice(0,50)};
        }
        el.scrollIntoView();
      }
      return false;
    },{timeout:45000},selector,match);
    console.log('touch',await target.jsonValue());await target.dispose();await sleep(450);
  }
  if(await page.evaluate(()=>!!app.zixing)){
    if(!['--entry-flow','--startup-latency','--boot-only','--run-settlement'].some(flag=>process.argv.includes(flag)))
      await prepareReturningPlayer(page);
    if(process.argv.includes('--startup-latency'))await reviewStartupLatency({page,dir,baseline:process.argv.includes('--baseline')});
    else if(process.argv.includes('--run-settlement'))await reviewRunSettlement({page,dir});
    else if(process.argv.includes('--entry-flow'))await verifyEntry({page,tap,dir});
    else if(process.argv.includes('--research-stats'))await (await import('./regression/research-stats.mjs')).verifyResearchStats({page,tap,dir});
    else if(process.argv.includes('--battle-plan'))await (await import('./regression/battle-plan-regression.mjs')).reviewBattlePlan({page,tap,dir});
    else if(process.argv.includes('--boot-only'))console.log('Boot artwork and first-frame handoff passed');
    else if(process.argv.includes('--loading-art'))await (await import('./regression/loading-art-regression.mjs')).reviewLoadingArtwork({page,resize,dir});
    else if(process.argv.includes('--icon-atlas'))await (await import('./regression/icon-atlas-regression.mjs')).checkIcons(page);
    else if(process.argv.includes('--network-loading'))await reviewNetworkActions({page,tap,resize,dir});
    else if(process.argv.includes('--coop-style-only'))await (await import('./regression/coop-style-regression.mjs')).reviewCoopStyle({page,tap,resize,dir,sleep});
    else if(process.argv.includes('--loading-perf'))await reviewLoading({page,tap,resize,dir,sleep});
    else if(process.argv.includes('--upgrade-perf'))await reviewUpgrade({page,resize,dir});
    else if(process.argv.includes('--starter-regression'))await reviewStarters({page,tap,resize,dir,sleep});
    else if(process.argv.includes('--scene-regression'))await reviewScenes({page,tap,resize,dir,sleep});
    else if(process.argv.includes('--dice-art'))await (await import('./regression/device-effects-regression.mjs')).verifyDice(page,dir);
    else if(process.argv.includes('--desk-visibility'))await (await import('./regression/desk-prop-visibility-regression.mjs')).verifyDeskVisibility(page,dir);
    else if(process.argv.includes('--device-effects')){
      const {reviewDeviceEffects}=await import('./regression/device-effects-regression.mjs');
      await reviewDeviceEffects(page,dir);
    }
    else if(process.argv.includes('--paper-art'))await reviewPaper({page,tap,resize,dir,sleep});
    else if(process.argv.includes('--altar-ring'))await reviewAltarRing({page,tap,dir,sleep});
    else if(process.argv.includes('--battle-feedback'))await reviewBattleFeedback({page,tap,resize,dir,sleep});
    else await reviewZixing({page,tap,resize,dir,sleep,menusOnly,perfOnly:uiPerfOnly});
    const missing=await page.evaluate(()=>[...missingAssets]);
    assert.deepEqual(missing,[],'All requested local assets must be present');
    assert.ok(homePainted,'Startup must complete its first home-frame handoff');
    const values=await page.evaluate(()=>bootPercentages);
    assert.equal(values[0],0);assert.equal(values.at(-1),100);
    for(let i=1;i<values.length;i++)assert.ok(values[i]>=values[i-1],'Progress moved backwards');
    if(errors.length)throw Error(errors[0]);
    return;
  }
  if(uiPerfOnly){
    await reviewUIPerformance({page,tap,dir,baseline:process.argv.includes('--baseline')});
    if(errors.length)throw Error(errors[0]);
    return;
  }
  await sleep(500);await page.screenshot({path:path.join(dir,'01-start.png')});
  if(phoneLayout){
    await shown('.auth-card');await shown('.auth-body button');await shown('.auth-note');
    assert.ok(await page.evaluate(()=>{
      const card=inspected.layout.box(inspected.doc.querySelector('.auth-card'));
      return card.w>=inspected.env.innerWidth*.8&&
        [...inspected.doc.querySelectorAll('.rotate-hint')].every(el=>!inspected.layout.box(el));
    }),'Portrait login must fill the phone width without a landscape prompt');
  }
  await tap('.auth-body button');
  if(phoneLayout){
    await resize(375,720);
    await shown('.sp-card',3);await shown('.sp-pas span',3);await shown('.sp-move',3);await shown('.sp-go');
    await page.waitForFunction(()=>{const canvases=[...inspected.doc.querySelectorAll('.sp-show canvas')];return canvases.length===3&&canvases.every(canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0));},{timeout:45000});
    await page.screenshot({path:path.join(dir,'01-partners.png')});
    // Choose a different card on a short phone, then switch back for the run.
    await resize(320,568);
    await tap('.sp-card:nth-child(3)');
    assert.ok(await page.evaluate(()=>inspected.doc.querySelector('.sp-card:nth-child(3)').classList.contains('on')));
    await tap('.sp-card:nth-child(2)');
    await shown('.sp-go');
  }
  await tap('.sp-go');
  await page.waitForFunction(()=>inspected.doc.querySelector('.lite-home'),{timeout:16000});
  await sleep(1000);await page.screenshot({path:path.join(dir,'02-home.png')});
  if(phoneLayout){
    for(const [w,h] of [[320,568],[430,932],[768,1024],[812,360],[390,844]]){
      await resize(w,h);
      await shown('.lite-mon',3);await shown('.lite-actions button',3);await shown('.lite-save');
    }
  }
  if(menusOnly){
    await reviewMenus({page,tap,resize,shown,dir,sleep,probe:process.argv.includes('--menus-probe')});
    if(errors.length)throw Error(errors[0]);
    return;
  }
  await tap('.lite-home .lite-mon:nth-child(2)');
  const buttons=await page.evaluate(()=>[...inspected.doc.querySelectorAll('#ui button')].map(e=>[e.className,e.textContent.slice(0,20)]));console.log('roster',buttons.slice(-15));
  if(phoneLayout){
    await shown('.ls-grid .ls-name',3);await shown('.ls-cta .ls-go');
    await page.screenshot({path:path.join(dir,'02-roster.png')});
    const scroll=await page.evaluate(()=>{
      const profile=inspected.doc.querySelector('.ls-profile'),r=profile.getBoundingClientRect();
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=r.left+r.width*.5-screen.left,y=r.top+r.height*.75-screen.top;
      const before=profile.scrollTop;
      window.tap(x,y,'down');window.tap(x,y-64,'move');window.tap(x,y-64,'up');
      return profile.scrollTop-before;
    });
    assert.ok(scroll>20,'Partner details respond to a swipe');
    await shown('.ls-cta .ls-go');
  }
  await tap('.ls-go');
  if(phoneLayout){
    await shown('.lite-bosses>div',4);await shown('.lite-actions button',3);await shown('.lite-map .btn.big');
    await page.screenshot({path:path.join(dir,'02-map.png')});
  }
  await tap('.lite-map button','进入森林');
  await page.waitForFunction(()=>window.app?.run?.player&&app.run.sprites,{timeout:60000});
  // Ambient XP must not enqueue a second choice while the explicitly triggered
  // upgrade below is being tested. Production progression remains untouched.
  await page.evaluate(()=>{app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;});
  await page.waitForFunction(()=>app.run.time>3&&app.run.player.speciesId===4,{timeout:90000});
  await page.screenshot({path:path.join(dir,'03-forest.png')});
  if(phoneLayout){
    await shown('.tc-pause');await shown('.tc-jump');await shown('.tl-name');await shown('.ht-biome');
    const hud=await page.evaluate(()=>['.hud-top','.ht-c','.timer'].map(sel=>{
      const b=inspected.layout.box(inspected.doc.querySelector(sel));
      return {sel,x:b.x,y:b.y,w:b.w,h:b.h,naturalH:b.naturalH,metric:b.metric,style:b.el.getAttribute('style')};
    }));
    assert.ok(hud[0].h<70&&hud[2].h<48,'Top HUD intrudes into the playfield: '+JSON.stringify(hud));
    const controlsClear=await page.evaluate(()=>{
      const controls=['.tc-pause','.tc-aim','.tc-ultb','.tc-jump','.tc-dash','.tc-lock','.minimap'].map(sel=>inspected.doc.querySelector(sel).getBoundingClientRect());
      return controls.every((a,i)=>controls.slice(i+1).every(b=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top));
    });
    assert.ok(controlsClear,'Portrait combat buttons overlap');
    assert.equal(await page.evaluate(()=>app.hud.els.biome.textContent),'青翠森林');
    const render=await page.evaluate(()=>({world:app.r.composer.inputBuffer.width,screen:app.r.canvas.width,
      ui:inspected.uiCanvas.width,width:app.r.canvas.clientWidth,dynamic:app.r.dynRes}));
    assert.ok(render.screen>=render.ui-1&&render.world>=render.width*1.45*render.dynamic-2,
      'World sampling must respect the native 1.5x budget while keeping UI resolution: '+JSON.stringify(render));
    console.log('Portrait render buffers',render);
    const start=await page.evaluate(()=>{
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=inspected.env.innerWidth*.2-screen.left,y=inspected.env.innerHeight*.65-screen.top;
      window.tap(x,y,'down');window.tap(x+38,y,'move');
      return {x,y,px:app.run.player.pos.x,pz:app.run.player.pos.z};
    });
    await page.waitForFunction(({px,pz})=>Math.hypot(app.run.player.pos.x-px,app.run.player.pos.z-pz)>.2,{timeout:7000},start);
    const stickOffset=await page.evaluate(({x,y})=>{
      const b=inspected.doc.querySelector('.tc-stick').getBoundingClientRect();
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      return Math.hypot(b.x+b.width/2-x-screen.x,b.y+b.height/2-y-screen.y);
    },start);
    assert.ok(stickOffset<5,'The moving stick is drawn away from the thumb: '+stickOffset);
    const multi=await page.evaluate(({x,y})=>{
      const sx=inspected.env.innerWidth*.72;
      window.tap(sx,y,'down',2);window.tap(sx+18,y,'move',2);window.tap(sx+18,y,'up',2);
      return Math.hypot(app.run.input.stickX,app.run.input.stickY);
    },start);
    assert.ok(multi>.1,'A right-thumb camera drag released the left movement stick');
    await page.evaluate(({x,y})=>window.tap(x+38,y,'up'),start);
    const simultaneous=await page.evaluate(({x,y})=>{
      const left={identifier:3,clientX:x,clientY:y},right={identifier:4,clientX:x+190,clientY:y};
      inspected.touches('down',{touches:[left,right],changedTouches:[left,right]});
      const moved={...left,clientX:x+30};
      inspected.touches('move',{touches:[moved,right],changedTouches:[moved]});
      const speed=Math.hypot(app.run.input.stickX,app.run.input.stickY);
      inspected.touches('cancel',{touches:[],changedTouches:[moved,right]});
      return [speed,app.run.input.stickX,app.run.input.stickY];
    },start);
    assert.ok(simultaneous[0]>.1&&simultaneous[1]===0&&simultaneous[2]===0,'Simultaneous touches and cancellation');
    await tap('.tc-pause');
    await page.waitForFunction(()=>app.run.state==='paused');
    await page.screenshot({path:path.join(dir,'04-pause.png')});
    await tap('.modal button','继续');
    await page.waitForFunction(()=>app.run.state==='play');
    // Trigger a real upgrade choice without waiting for a random combat drop.
    await page.evaluate(()=>{app.run.pendingLevels=1;app.run.doLevelUp();});
    await shown('.modal .card h3',3);
    await shown('.modal .actions button',3);
    assert.equal(await page.evaluate(()=>Boolean(inspected.doc.querySelector('body > .run-hint'))),false,'Tutorial covers upgrade choices');
    await page.screenshot({path:path.join(dir,'05-upgrade.png')});
    await tap('.modal .card');await page.waitForFunction(()=>app.run.state==='play');
  }
  console.log('forest',await page.evaluate(()=>({stage:app.run.stage,state:app.run.state,hero:app.run.player.speciesId,boxes:inspected.doc.body.textContent.slice(-350),time:app.run.time})));
  if(phoneLayout){
    const runs=await page.evaluate(()=>app.meta.profile.counters.runs||0);
    await resize(320,568);
    await tap('.tc-pause');
    await tap('.pz .sm-foot .btn.red');
    await tap('.pz .sm-foot .btn.armed');
    await shown('.sm-modal .sm-foot button',2);
    const scrolled=await page.evaluate(()=>{
      const list=inspected.doc.querySelector('.sm-modal .sm-body'),b=list.getBoundingClientRect(),
        screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=b.left+b.width/2-screen.left,y=b.top+b.height*.8-screen.top;
      window.tap(x,y,'down');window.tap(x,y-56,'move');window.tap(x,y-56,'up');
      return list.scrollTop;
    });
    assert.ok(scrolled>20,'Short-phone results must scroll independently of the menu buttons');
    await page.screenshot({path:path.join(dir,'06-result.png')});
    await tap('.sm-modal .sm-foot button:first-child');
    await page.waitForFunction(()=>inspected.doc.querySelector('.lite-home')&&!app.run);
    assert.equal(await page.evaluate(()=>app.meta.profile.counters.runs),runs+1);
    console.log('Short-phone settlement returned to the home screen with the run saved');
  }
  if(process.argv.includes('--forest-regression')){
    const report=[];
    for(const species of [4,16]){
      await page.evaluate(async species=>{
        if(app.run&&app.run.state!=='over')await app.run.finish(false,true);
        app.toMenu();
        if(!await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Cannot start '+species);
        app.run.ui.hideModal();app.run.state='play';
        window.testHeal=setInterval(()=>{if(app.run?.player)app.run.player.hp=app.run.player.maxHp;},100);
      },species);
      await page.waitForFunction(species=>app.run.player.speciesId===species&&app.run.time>1,{timeout:60000},species);
      const stages=[];
      for(const stage of FOREST_ROUTE){
        if(stage>1)await page.evaluate(async()=>{app.run.ui.hideModal();app.run.state='play';await app.run.changeZone();});
        await page.waitForFunction(stage=>app.run.stage===stage,{timeout:60000},stage);
        await sleep(1500);
        stages.push(await page.evaluate(()=>({stage:app.run.stage,state:app.run.state,hero:app.run.player.speciesId})));
        await page.screenshot({path:path.join(dir,`forest-${species}-stage-${stage}.png`)});
      }
      const settlement=await page.evaluate(async()=>{
        const before=app.meta.profile.counters.runs||0;
        await app.run.finish(true);clearInterval(window.testHeal);
        await app.meta.resync();
        const saved=JSON.parse(wx.getFileSystemManager().readFileSync(wx.env.USER_DATA_PATH+'/pokebonk-save.json','utf8'));
        const account=saved.accounts[app.meta.account.id];
        return {before,after:app.meta.profile.counters.runs,stored:account.profile.counters.runs,tier:account.profile.biomes.forest,dust:account.profile.stardust};
      });
      assert.equal(settlement.after,settlement.before+1);assert.equal(settlement.stored,settlement.after);assert.ok(settlement.tier>=1);
      report.push({species,stages,settlement});
    }
    fs.writeFileSync(path.join(dir,'forest-regression.json'),JSON.stringify({mode:'controlled stage traversal and victory, not natural playthrough',report},null,2));
    console.log('Three original partners, all forest stages and native file settlement verified');
  }
  const missing=await page.evaluate(()=>[...missingAssets]);if(missing.length)throw Error('Missing local assets: '+missing.join(', '));
  if(errors.length)throw Error(errors[0]);
  if(!homePainted)throw Error('Game entered the forest without completing the startup handoff');
  const values=await page.evaluate(()=>bootPercentages);
  assert.equal(values[0],0);
  for(let i=1;i<values.length;i++)assert.ok(values[i]>=values[i-1],'Progress moved backwards');
  assert.equal(values[values.length-1],100);
  console.log('Boot percentages through the first home frame:',[...new Set(values)].join(', '));
}
try{
  if(coldStart){
    await page.waitForFunction(()=>GameGlobal.pokebonk?.bootDiagnostics.completed&&app.run?.state==='play'&&!app.starting||window.problem,{timeout:90000});
    if(await page.evaluate(()=>window.problem))throw Error(await page.evaluate(()=>window.problem));
    const result=await page.evaluate(()=>({boot:GameGlobal.pokebonk.bootDiagnostics,
      packs:GameGlobal.pokebonk.files.diagnostics.packs,timings:packageTimings,
      packageBytes:coldPackageBytes,mode:app.run.mode,species:app.run.player.speciesId,
      filmPages:openingRequests.length}));
    assert.equal(result.mode,'single-stage');assert.equal(result.species,4);assert.equal(result.filmPages,0);
    for(const name of ['text','world','art'])assert.equal(result.packs[name].cached,false,'Must use a fresh resource cache');
    if(!process.argv.includes('--baseline')){
      const timings=Object.fromEntries(result.timings.map(event=>[event.name,event]));
      assert.ok(timings.world.requestedAt<timings.text.downloadedAt&&timings.art.requestedAt<timings.text.downloadedAt,
        'Scene downloads must overlap the initial text package');
      assert.ok(!result.boot.packs?.wind,'Wind must not be a default fire-entry dependency');
    }
    await page.waitForFunction(()=>app.run?.state==='play'&&!app.screen&&!app.entryOpening,{timeout:90000});
    assert.deepEqual(await page.evaluate(()=>[...missingAssets]),[]);
    if(!process.argv.includes('--baseline')){
      const wind=await page.evaluate(async()=>{
        await app.startRun({species:16,biome:'forest',tier:0,boosts:[],mode:'standard'});
        return {species:app.run.player.speciesId,state:app.run.state,
          prepared:app.run.vfx.crafted.windSkillArt().texture.userData.prepared,
          downloads:requestedPackages.filter(name=>name==='wind').length};
      });
      assert.deepEqual(wind,{species:16,state:'play',prepared:true,downloads:1},
        'Wind entry must reuse the deferred install and prepare its real skill texture');
      result.windEntry=wind;
    }
    if(errors.length)throw Error(errors[0]);
    const filename=process.argv.includes('--baseline')?'cold-start-before.json':'cold-start-after.json';
    fs.writeFileSync(path.join(dir,filename),JSON.stringify(result,null,2)+'\n');
    console.log('Cold startup:',JSON.stringify(result));
  }else if(process.argv.includes('--joystick-only')){
    const {verifyJoystick}=await import('./regression/joystick-regression.mjs');
    await verifyJoystick(page,dir);
    if(errors.length)throw Error(errors[0]);
  }else if(process.argv.includes('--desk2d')){
    const {verifyDesk}=await import('./regression/desk2d-regression.mjs');
    await verifyDesk(page,dir);
  }else await verifyStartup();
}
catch(error){console.error('Stopped on',await page.evaluate(()=>({screen:window.app?.screen?.className,state:window.app?.run?.state,
    text:window.inspected?.doc.body.textContent.slice(-400),errors:window.problem,
    boxes:[...(window.inspected?.doc.querySelectorAll('.lite-map button')||[])].map(el=>{const r=el.getBoundingClientRect();return [el.textContent,r.x,r.y,r.width,r.height,inspected.layout.hit(r.x+r.width/2,r.y+r.height/2)?.className];}),
    missing:[...(window.missingAssets||[])]})));throw error;
 }finally{await b.close();srv.close();}
