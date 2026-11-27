// Local-only test adapter. Uses Chrome's real WebGL2, Canvas 2D, image decoder and touch events.
import {strFromU8,strToU8} from 'fflate';
import {toByteArray} from 'base64-js';
import {width,height} from '../../resources/public/config/desk2d-layout.json';
window.deskArtSize={width,height};
const storage=new Map(),dirs=new Set(['/userdata']),data=new Map(),archives=new Map(),events={};
if(window.fixtureStaleResourcePack){
  // A previous preview remains mounted when a new main package starts.
  // The historical hash is the package identified by the iOS error report.
  window.staleResourcePaths=['packs/text/assets.br','packs/text-0a52aa1af1cc953e/assets.br'];
  for(const file of window.staleResourcePaths)archives.set(file,Uint8Array.of(6,0,0,0));
  window.resourcePackageReads=[];
}
// Simulate optional downloads stalling until the guest screen is usable.
const optionalDownloadGate = new Promise(resolve => { window.releaseOptionalDownloads=resolve; });
const textDownloadGate = new Promise(resolve => { window.releaseTextDownload=resolve; });
const entries=new Map();
window.runFixtureEntry=name=>{
  if(!entries.has(name))entries.set(name,new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.onload=resolve;script.onerror=()=>reject(Error('Could not run subpackage '+name));
    script.src='/'+window.packageEntries[name];
    document.head.appendChild(script);
  }));
  return entries.get(name);
};
window.loadFixtureData=async name=>{
  for(const file of window.packageData[name]){
    const response=await fetch('/'+file);
    if(!response.ok)throw Error('Missing packaged file '+file);
    archives.set(file,new Uint8Array(await response.arrayBuffer()));
  }
};
function bytes(path){
  if(window.resourcePackageReads&&path.startsWith('packs/'))window.resourcePackageReads.push(path);
  if(window.fixtureResourceReadRecovery&&/^\/?packs\//.test(path)){
    const reads=window.fixtureResourceReads;
    if(path.endsWith('.br'))throw Error('readFileSync:fail file info not exit');
    if(path.includes('/text-')&&(window.requestedPackages||[]).filter(name=>name==='text').length<2){
      reads.unmounted++;throw Error('readFileSync:fail file info not exit');
    }
    if(!path.startsWith('/')){reads.unrooted++;throw Error('readFileSync:fail file info not exit');}
    reads.recovered++;path=path.slice(1);
  }
  const v=data.get(path)||archives.get(path);if(!v)throw Error('Missing file '+path);return v;
}
const fs={
  accessSync(path){
    // A package index may exist before loadSubpackage mounts the data.
    if(window.fixtureResourceReadRecovery&&/^\/?packs\/text-/.test(path))return;
    if(!dirs.has(path)&&!data.has(path)&&!archives.has(path))throw Error('ENOENT '+path);
  },
  mkdirSync(path){dirs.add(path);},rmdirSync(path){for(const f of [...data.keys()])if(f.startsWith(path+'/'))data.delete(f);dirs.delete(path);},
  readdirSync(path){return [...new Set([...dirs,...data.keys()].filter(k=>k.startsWith(path+'/')).map(k=>k.slice(path.length+1).split('/')[0]))];},
  readFileSync(path,encoding){const b=bytes(path);return encoding?strFromU8(b):b.slice().buffer;},
  writeFileSync(path,b,encoding){data.set(path,encoding==='base64'?toByteArray(b):typeof b==='string'?strToU8(b):new Uint8Array(b));},
  copyFileSync(from,to){data.set(to,bytes(from));},renameSync(from,to){data.set(to,bytes(from));data.delete(from);},unlinkSync(path){data.delete(path);},
  readFile({filePath,success,fail}){queueMicrotask(()=>{
    if(window.fixtureResourceReadRecovery&&/^\/?packs\//.test(filePath)){
      window.fixtureResourceReads.asyncFailures++;
      return fail({errMsg:'readFile:fail file info not exit'});
    }
    try{success({data:fs.readFileSync(filePath)});}catch(e){fail(e);}
  });},
  writeFile({filePath,data,success,fail}){queueMicrotask(()=>{try{fs.writeFileSync(filePath,data);success({});}catch(e){fail(e);}});}
};
let first=true,screen=null;
// WeChat exposes canvas as a fixed own data property on native rendering contexts.
function nativeCanvas(){
  const el=document.createElement('canvas'),getContext=el.getContext.bind(el);
  el.getContext=(...args)=>{
    const ctx=getContext(...args);
    if(ctx&&!Object.prototype.hasOwnProperty.call(ctx,'canvas')){
      Object.defineProperty(ctx,'canvas',{value:el,writable:false,configurable:false});
      const method=args[0]==='2d'?'fillRect':'getParameter';
      if(typeof ctx[method]==='function')Object.defineProperty(ctx,method,{value:ctx[method],writable:false,configurable:false});
    }
    return ctx;
  };
  return el;
}
function canvas(){const el=nativeCanvas();if(first){first=false;screen=el;document.body.appendChild(el);}return el;}
const imageSrc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
globalThis.GameGlobal={};
Object.defineProperty(GameGlobal,'pokebonk',{get(){return window.__host;},set(host){
  window.__host=host;host.inspect=s=>{
    window.inspected=s;
    // Menu/workload fixtures begin after the opening; opening-flow tests use
    // the real boot path, including when they seed an experienced profile.
    if(window.fixtureSkipOpening)s.env.playJourneyOpening=()=>null;
    else{
      const play=s.env.playJourneyOpening;
      s.env.playJourneyOpening=(...args)=>{
        const film=play(...args);
        (window.openingDecoders??=[]).push({get frames(){return film.frameCount;},get removed(){return !film.active;}});
        return film;
      };
    }
    if(window.failOpeningResources){
      const prepare=s.env.prepareForest;
      s.env.prepareForest=(...args)=>{s.env.prepareForest=prepare;throw Error('测试首次资源加载失败');};
    }
    if(window.holdHomeStatus){
      const gate=new Promise(resolve=>{window.releaseHomeStatus=resolve;}),fetch=s.env.fetch;
      s.env.fetch=(url,...args)=>{
        if(!String(url).endsWith('/api/status'))return fetch(url,...args);
        window.homeStatusRequested=true;
        return gate.then(()=>fetch(url,...args));
      };
    }
    if(window.failFirstFrame)s.env.drawUI=()=>{throw Error('test: first game frame failed');};
  };host.onApp=app=>{
    window.app=app;
    if(window.fixtureSkipOpening){
      const boot=app.boot.bind(app);
      app.boot=async()=>{await boot();inspected.env.onBootReady=undefined;app.zixing.home();};
    }
    if(window.fixtureReturning){
      const load=app.backend.loadProfile.bind(app.backend);
      app.backend.loadProfile=async(...args)=>({...await load(...args),firstJourneyPlayed:true});
    }
  };
  const resolve=host.files.pathFor;window.missingAssets=new Set();
  host.files.pathFor=url=>{const p=resolve(url);if(!p)window.missingAssets.add(String(url));return p;};
  const resolveAsync=host.files.resolvePath;
  host.files.resolvePath=async url=>{const p=await resolveAsync(url);if(!p)window.missingAssets.add(String(url));return p;};
}});
let fixtureSave;
const fixtureReceipts=new Set();
const fixtureCloud={init(){},async callContainer(options){
  if(window.fixtureProgress)return window.fixtureProgress(options);
  if(options.path!=='/v1/progress')throw Error('Unknown fixture cloud route');
  const {data,method}=options;
  if(method==='POST' && !fixtureSave)fixtureSave={revision:1,owner:'fixture',progress:structuredClone(data.progress)};
  if(method==='PUT' && !fixtureReceipts.has(data.mutation)){
    if(data.revision!==fixtureSave.revision)return {statusCode:409};
    fixtureSave={...fixtureSave,revision:fixtureSave.revision+1,progress:structuredClone(data.progress)};
    fixtureReceipts.add(data.mutation);
  }
  return {statusCode:fixtureSave?200:404,data:structuredClone(fixtureSave)};
}};
globalThis.wx={
    cloud:fixtureCloud,
  getLaunchOptionsSync:()=>window.fixtureLaunchOptions || {query:{}},
  shareAppMessage:options=>{window.sharedCard=options;},
  setClipboardData:({data,success})=>{window.fixtureClipboard=data;success({});},
  getClipboardData:({success})=>success({data:window.fixtureClipboard||''}),
  onShareAppMessage:listener=>{window.fixtureMenuCard=listener;},
  showShareMenu:({menus})=>{window.fixtureShareMenus=menus;},
  env:{USER_DATA_PATH:'/userdata'},getFileSystemManager:()=>fs,
  getDeviceInfo:()=>({platform:window.fixturePlatform||'devtools',...window.fixtureDeviceInfo}),
  // Existing render workload tests intentionally use a high-end device.
  // Device-policy cases can inject a different tier or an unavailable API.
  getDeviceBenchmarkInfo:({success,fail})=>window.fixtureBenchmark===null?fail({}):success(window.fixtureBenchmark??{modelLevel:1,benchmarkLevel:40}),
  getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight,pixelRatio:devicePixelRatio,
    safeArea:!window.phoneLayout?undefined:innerHeight>=innerWidth
      ?{left:0,top:36,right:innerWidth,bottom:innerHeight-34}
      :{left:28,top:6,right:innerWidth-16,bottom:innerHeight-8}}),
  getMenuButtonBoundingClientRect:()=>!window.phoneLayout?undefined:
    {left:innerWidth-106,right:innerWidth-16,top:innerHeight>=innerWidth?28:4,bottom:innerHeight>=innerWidth?60:32},
  onWindowResize:fn=>window.addEventListener('resize',fn),
  getRandomValues({length,success}){success({randomValues:crypto.getRandomValues(new Uint8Array(length)).buffer});},
  createCanvas:canvas,createOffscreenCanvas:nativeCanvas,
  createVideoDecoder(){throw Error('Opening must work without the native video decoder');},
  createImage(){
    const img=new Image(),states=window.nativeImageStates??=[];
    // Metadata only: the audit must not retain native Image objects itself.
    const state={id:states.length,path:'',width:0,height:0};states.push(state);
    let record=null;
    img.addEventListener('load',()=>{
      if(record){state.width=record.width=img.naturalWidth;state.height=record.height=img.naturalHeight;}
    });
    Object.defineProperty(img,'src',{get(){return imageSrc.get.call(img);},set(path){
    state.path=path.startsWith('data:image/')?path.slice(0,path.indexOf(',')):path;
    state.width=state.height=0;record=null;
    if(!path){imageSrc.set.call(img,'');return;}
    // Match the QR preview: loose WebP files are absent from its package.
    // Only installed user-data files and inline images may use WebP here.
    if(/\.webp$/.test(path)&&!data.has(path)){
      queueMicrotask(()=>img.dispatchEvent(new Event('error')));return;
    }
    const openingPath=window.__host?.files.pathFor('assets/opening/p00.webp');
    if(window.failOpeningPageOnce&&path===openingPath){
      window.failOpeningPageOnce=false;queueMicrotask(()=>img.dispatchEvent(new Event('error')));return;
    }
    record={id:state.id,path:state.path,width:0,height:0};
    (window.nativeImageLoads??=[]).push(record);
    if(window.failEntryInline&&!window.__host&&path.startsWith('data:image/')){
      queueMicrotask(()=>img.dispatchEvent(new Event('error')));return;
    }
    if(data.has(path)){const url=URL.createObjectURL(new Blob([bytes(path)]));img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});imageSrc.set.call(img,url);}
    else imageSrc.set.call(img,path);
  }});return img;},
  loadFont(path){const family=path.includes('bold')?'Bold'+path.slice(-10):'Face'+path.slice(-14,-4);
    const face=new FontFace(family,bytes(path));document.fonts.add(face);face.load().catch(console.error);return family;},
  createWebAudioContext:()=>new AudioContext(),getStorageSync:k=>localStorage.getItem(k)||'',setStorageSync:(k,v)=>localStorage.setItem(k,v),removeStorageSync:k=>localStorage.removeItem(k),
  showLoading(o){window.loadingTitle=o.title;},hideLoading(){window.loadingTitle=null;},showModal(o){window.problem=o.content;console.error('WX MODAL',o.content);},
  loadSubpackage(o){
    (window.requestedPackages??=[]).push(o.name);
    let notify;
    (async()=>{try{
      if(o.name==='text'){
        window.textRequested=true;
        window.reportTextProgress=p=>notify?.({progress:p,totalBytesWritten:p*1024});
        await textDownloadGate;
        window.reportTextProgress(10);
        if(window.dropTextOnce){window.dropTextOnce=false;throw Error('test: dropped download');}
      }
      if(o.name!=='play'&&o.name!=='text')await optionalDownloadGate;
      await window.loadFixtureData(o.name);
      // Reproduce a device reporting package success before evaluating its entry.
      if(o.name!=='text'||!window.fixtureMissingTextCallback)o.success();
      if(o.name==='play')window.playDownloaded=true;
      setTimeout(()=>window.runFixtureEntry(o.name).catch(e=>{window.problem=e.message;console.error(e);}),100);
    }catch(e){o.fail(e);}})();
    return {onProgressUpdate(fn){notify=fn;}};
  }
};
const showCallbacks=[];
wx.setPreferredFramesPerSecond=fps=>{(window.fixtureFrameRates??=[]).push(fps);};
wx.onMemoryWarning=listener=>{window.fixtureMemoryWarning=listener;};
wx.triggerGC=()=>{window.fixtureGCs=(window.fixtureGCs||0)+1;};
wx.onShow=fn=>showCallbacks.push(fn);
wx.onAudioInterruptionBegin=fn=>{window.fixtureAudioInterruptionBegin=fn;};
wx.onAudioInterruptionEnd=fn=>{window.fixtureAudioInterruptionEnd=fn;};
window.fixtureShow=options=>showCallbacks.forEach(fn=>fn(options));
for(const [key,event] of Object.entries({TouchStart:'touchstart',TouchEnd:'touchend',TouchMove:'touchmove',TouchCancel:'touchcancel',Hide:'pagehide'})){
  wx['on'+key]=fn=>{events[key]=fn;if(event.startsWith('touch'))document.addEventListener(event,fn,{passive:false});};
}
window.fixtureHide=()=>events.Hide?.();
const fingers=new Map();
window.tap=(x,y,kind='tap',id=1)=>{const t={identifier:id,clientX:x,clientY:y,pageX:x,pageY:y};
  const send=k=>{
    if(k==='TouchEnd'||k==='TouchCancel')fingers.delete(id);else fingers.set(id,t);
    events[k]?.({touches:[...fingers.values()],changedTouches:[t]});
  };
  if(kind==='tap'||kind==='down')send('TouchStart');if(kind==='move')send('TouchMove');
  if(kind==='tap'||kind==='up')send('TouchEnd');if(kind==='cancel')send('TouchCancel');};
