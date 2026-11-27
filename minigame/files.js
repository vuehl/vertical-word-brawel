// The boot canvas must be the first canvas created by the mini game.
const fs = () => wx.getFileSystemManager();
const info = require('./assets');
const {restoreModel} = require('./resource-codec');
const {restoreSprite,encodeImageData,resourceEntries,decodeBrotli,decodeText} = require('./resource-runtime');
const hydratedSprites = new Set();
const installs = new Map();
const packStates = new Map();
const listeners = new Map();
const modelJobs = new Map();
const modelSources = new Map();
const mountedPackages = GameGlobal.pokebonkResourcePackages || (GameGlobal.pokebonkResourcePackages = {});
const diagnostics = {packs:{},modelsRestored:0};
const base = wx.env.USER_DATA_PATH + '/pokebonk-assets';
const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));
let cleanupJob;
function exists(path) { try { fs().accessSync(path); return true; } catch (error) { return false; } }
function report(name,phase,completed=0,total=0) {
  const state={name,phase,completed,total};packStates.set(name,state);
  for(const listener of listeners.get(name)||[])listener(state);
}
function fileCall(method,options) {
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error instanceof Error?error:Error(error.errMsg||String(error))):resolve(result);};
    const action=method==='writeFile'?'保存':method==='readCompressedFile'?'解压':'读取';
    const timer=setTimeout(()=>finish(Error('资源'+action+'超时，请重试')),30000);
    try {fs()[method](Object.assign({},options,{success:result=>finish(null,result),fail:finish}));}catch(error){finish(error);}
  });
}
function readPaths(filePath) {
  // Code-package paths can use a leading slash. Never rewrite wxfile:// or
  // user-data paths; those refer to a different native filesystem.
  return /^packs\//.test(filePath)?[filePath,'/'+filePath]:[filePath];
}
async function readFile(filePath,encoding) {
  const manager=fs(),failures=[];
  for(const path of readPaths(filePath)){
    if(typeof manager.readFile==='function'){
      try {
        const result=await fileCall('readFile',Object.assign({filePath:path},encoding?{encoding}:{}));
        return result&&result.data!==undefined?result.data:result;
      } catch(error){failures.push('readFile '+path+': '+(error.errMsg||error.message||error));}
    }
    // An exposed async API can still fail for a mounted package on a device.
    // Its presence does not mean that the synchronous bridge will fail too.
    if(typeof manager.readFileSync==='function'){
      await yieldTask();
      try {return manager.readFileSync(path,encoding);}
      catch(error){failures.push('readFileSync '+path+': '+(error.errMsg||error.message||error));}
    }
  }
  const error=Error('无法读取资源文件 '+filePath+'（'+failures.join('；')+'）');
  error.resourceRead=true;
  throw error;
}
async function writeFile(filePath,data,encoding) {
  if(typeof fs().writeFile==='function')await fileCall('writeFile',Object.assign({filePath,data},encoding?{encoding}:{}));
  else fs().writeFileSync(filePath,data,encoding);
}
function binaryBytes(value) {
  // Native bridges may return a result object or a view into a larger buffer.
  if(value&&value.data!==undefined)value=value.data;
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  if(Object.prototype.toString.call(value)==='[object ArrayBuffer]')return new Uint8Array(value);
  throw Error('资源接口未返回二进制数据');
}
async function readBrotli(archive,expected) {
  const manager=fs(),attempts=[];let raw;
  function accept(value,method){
    raw=binaryBytes(value);attempts.push(method+'='+raw.byteLength);
    return raw.byteLength===expected;
  }
  for(const filePath of readPaths(archive)){
    if(typeof manager.readCompressedFile==='function'){
      try {if(accept(await fileCall('readCompressedFile',{filePath,compressionAlgorithm:'br'}),'async'))return raw;}
      catch(error){console.warn('[字由搏击] 异步解压失败',filePath,error);}
    }
    if(typeof manager.readCompressedFileSync==='function'){
      await yieldTask();
      try {if(accept(manager.readCompressedFileSync({filePath,compressionAlgorithm:'br'}),'sync'))return raw;}
      catch(error){console.warn('[字由搏击] 原生解压失败，使用备用解码器',filePath,error);}
    }
  }
  const bytes=binaryBytes(await readFile(archive));
  // A package reader can expose the already-expanded .br contents. Do not
  // decode that payload twice; the resource manifest is still checked below.
  if(accept(bytes,'read'))return raw;
  await yieldTask();
  try {
    if(accept(decodeBrotli(bytes,expected),'js'))return raw;
  } catch(error){
    console.warn('[字由搏击] 备用解码失败',archive,error);
    attempts.push('js:error');
  }
  throw Error('解压后长度不符 '+archive+'（预期 '+expected+'；'+attempts.join(', ')+'）');
}
function archiveFor(name) {
  const root=info.packRoots&&info.packRoots[name];
  // A stable path can still point at a mounted package from an older preview.
  // The archive location must carry the revision required by this main bundle.
  if(root!=='packs/'+name+'-'+info.packs[name])throw Error('资源分包版本路径无效 '+name);
  // Keep compressed bytes in an ordinary binary package file. Decompression
  // is explicit (compressionAlgorithm: br), independent of suffix handling.
  return root+'/assets.bin';
}
function packageAvailable(name) {
  return name === 'play' ? !!(GameGlobal.pokebonkPlayEntry && GameGlobal.pokebonkPlayEntry.api)
    : mountedPackages[name]===info.packs[name] && readPaths(archiveFor(name)).some(exists);
}
function downloadPackage(name, progress, acceptMounted=true) {
  return new Promise((resolve,reject) => {
    let timer, lastBytes = 0, lastPercent = 0, done = false;
    function finish(error) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (error) reject(new Error(name + ' 分包：' + (error.errMsg || error.message || error)));
      else {
        if(name!=='play')mountedPackages[name]=info.packs[name];
        resolve();
      }
    }
    let lastProgress = Date.now();
    function checkDownload() {
      if (acceptMounted && packageAvailable(name)) return finish();
      const remaining = 10000 - (Date.now() - lastProgress);
      if (remaining <= 0) return finish('下载长时间没有进展，请检查网络后重试');
      timer = setTimeout(checkDownload, Math.min(1500, remaining));
    }
    timer = setTimeout(checkDownload, 1500);
    try {
      const task = wx.loadSubpackage({name, success: () => finish(), fail: finish});
      if (task && task.onProgressUpdate) task.onProgressUpdate(event => {
        const bytes = Number.isFinite(event.totalBytesWritten) ? event.totalBytesWritten : 0;
        const bytePercent = event.totalBytesExpectedToWrite > 0 ? 100 * bytes / event.totalBytesExpectedToWrite : 0;
        const percent = Math.min(100,Math.max(bytePercent,Number.isFinite(event.progress) ? event.progress : 0));
        if (done || (bytes <= lastBytes && percent <= lastPercent)) return;
        lastBytes = Math.max(lastBytes, bytes);
        lastPercent = Math.max(lastPercent, percent);
        lastProgress = Date.now();
        if (progress) progress(lastPercent);
      });
    } catch (error) { finish(error); }
  });
}
async function loadPackage(name, progress, force=false) {
  // accessSync can see package metadata before its data is mounted. Require
  // a successful load or this revision's entry, and bypass both on recovery.
  if (name!=='play') archiveFor(name);
  const available=()=>!force&&packageAvailable(name);
  if (available()) return;
  try {
    await downloadPackage(name, progress, !force);
  } catch (error) {
    if (available()) return;
    console.warn('[宝可梦] 重试下载分包', name, error);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (available()) return;
    try { await downloadPackage(name, progress, !force); }
    catch (retryError) { if (!available()) throw retryError; }
  }
}
async function readPackage(name,archive,stats,progress) {
  for(let attempt=0;attempt<3;attempt++){
    try {return await readBrotli(archive,info.rawSizes[name]);}
    catch(error){
      if(!error.resourceRead)throw error;
      stats.readFailures=(stats.readFailures||0)+1;
      stats.lastReadError=error.message;
      if(attempt===2)throw error;
      console.warn('[字由搏击] 资源包暂不可读，自动恢复',name,archive,error.message);
      // Re-mount once even if accessSync still reports this file as present.
      // Further bounded reads allow a late native mount to become readable.
      if(attempt===0)await loadPackage(name,progress,true);
      await new Promise(resolve=>setTimeout(resolve,200*(attempt+1)));
    }
  }
}
async function unpack(name, revision, progress) {
  const dir = base + '/' + name + '-' + revision;
  const began=Date.now(),stats=diagnostics.packs[name]={cached:false,writes:0,rawBytes:info.rawSizes[name]};
  if (exists(dir + '/.ready')) {stats.cached=true;stats.totalMs=Date.now()-began;report(name,'ready',1,1);return;}
  report(name,'download',0,100);
  await loadPackage(name,p=>{if(progress)progress(p);report(name,'download',p,100);});
  stats.loadMs=Date.now()-began;
  // A retry overwrites every file of this same immutable revision. Only the
  // final ready marker makes the installation visible to other callers.
  if (!exists(dir)) fs().mkdirSync(dir, true);
  const archive = archiveFor(name);
  report(name,'unpack');await yieldTask();
  stats.archive=archive;
  const unpackAt=Date.now(),raw=await readPackage(name,archive,stats,progress);
  stats.unpackMs=Date.now()-unpackAt;
  // Advancing the iterator decodes each filtered file. Give the splash
  // time to present frames even before the first native write begins.
  const entries=[];
  let decodeSlice=Date.now();
  for(const entry of resourceEntries(raw)){
    entries.push(entry);
    if(Date.now()-decodeSlice>=6){await yieldTask();decodeSlice=Date.now();}
  }
  const writeAt=Date.now();
  report(name,'write',0,entries.length);
  let sliceStart = Date.now(),reported=0;
  const batchSize=typeof fs().writeFile==='function'?4:1;
  for(let i=0;i<entries.length;i+=batchSize){
    // A retry can replace the directory. Drain every native write in this
    // batch before propagating failure so an old callback cannot race it.
    let failure;
    await Promise.all(entries.slice(i,i+batchSize).map(async ([file,part])=>{
      try {
        await writeFile(dir+'/'+file,part.buffer.slice(part.byteOffset,part.byteOffset+part.byteLength));
        stats.writes++;
      } catch(error){failure=error;}
    }));
    if(failure)throw failure;
    if (stats.writes-reported>=8 || Date.now() - sliceStart >= 6) {
      report(name,'write',stats.writes,entries.length);await yieldTask();
      sliceStart = Date.now();reported=stats.writes;
    }
  }
  stats.writeMs=Date.now()-writeAt;
  fs().writeFileSync(dir + '/.ready',revision,'utf8');
  stats.totalMs=Date.now()-began;report(name,'ready',1,1);
}
async function ensureModel(name,file,path) {
  if(!file.endsWith('.glb')||exists(path))return;
  if(!modelJobs.has(path)){
    const dir=base+'/'+name+'-'+info.packs[name];
    const job=(async()=>{
      if(!modelSources.has(dir))modelSources.set(dir,Promise.all([
        readFile(dir+'/model-parts.bin'),readFile(dir+'/model-map.json')
      ]).then(([pool,json])=>({pool:new Uint8Array(pool),recipes:JSON.parse(decodeText(new Uint8Array(json)))})));
      try {
        const {pool,recipes}=await modelSources.get(dir);await yieldTask();
        const bytes=restoreModel(pool,recipes[file]);
        await writeFile(path+'.next',bytes);
        fs().renameSync(path+'.next',path);diagnostics.modelsRestored++;
      } finally {modelSources.delete(dir);}
    })().then(value=>{modelJobs.delete(path);return value;},error=>{modelJobs.delete(path);throw error;});
    modelJobs.set(path,job);
  }
  return modelJobs.get(path);
}
function resourceFor(raw) {
  const key = decodeURIComponent(raw.split(/[?#]/)[0].replace(/^[a-z]+:\/\/[^/]+\/?/, '')
    .replace(/^(\.\/|\/)+/,'').replace(/^(assets\/)+assets\//,'assets/').replace(/^(data\/)+data\//,'data/'));
  return info.files[key];
}
const iconPages=new Map();
function loadIcon(url) {
  const raw=String(url);
  if(raw.startsWith('data:')||raw.startsWith(wx.env.USER_DATA_PATH+'/'))return null;
  const ref=resourceFor(raw);
  if(!ref || !ref.includes('#'))return null;
  const [page,tile]=ref.split('#'),[pack,file]=page.split('/');
  const [x,y,width,height]=info.iconFrames[file][tile];
  let job=iconPages.get(page);
  if(!job){
    job=ensurePack(pack).then(()=>new Promise((resolve,reject)=>{
      const image=wx.createImage();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(Error('无法读取图集 '+file));
      image.src=base+'/'+pack+'-'+info.packs[pack]+'/'+file;
    }));
    job.catch(()=>{if(iconPages.get(page)===job)iconPages.delete(page);});
  }
  iconPages.delete(page);iconPages.set(page,job);
  if(iconPages.size>3)iconPages.delete(iconPages.keys().next().value);
  return job.then(image=>{
    let crop;
    return {image,x,y,width,height,surface(){
      if(!crop){
        crop=wx.createOffscreenCanvas?wx.createOffscreenCanvas({type:'2d',width,height}):wx.createCanvas();
        crop.width=width;crop.height=height;
        crop.getContext('2d').drawImage(image,x,y,width,height,0,0,width,height);
      }
      return crop;
    }};
  });
}
function pathFor(url) {
  const raw = String(url);
  if (raw.startsWith(wx.env.USER_DATA_PATH + '/') || raw.startsWith('data:')) return raw;
  const file = resourceFor(raw);
  if (!file) return null;
  const [name, hash] = file.split('/');
  if(hash.includes('#'))return base+'/'+name+'-'+info.packs[name]+'/'+hash.replace('#','-')+'.png';
  const dir=base + '/' + name + '-' + info.packs[name],path=dir+'/'+hash;
  const recipe=info.sprites[hash];
  if(recipe&&!hydratedSprites.has(path)){
    if(!exists(path)){
      const png=restoreSprite(new Uint8Array(fs().readFileSync(dir+'/'+recipe)));
      fs().writeFileSync(path+'.next',png.buffer);
      fs().renameSync(path+'.next',path);
    }
    hydratedSprites.add(path);
  }
  return path;
}
function ensurePack(name, progress) {
  if (!installs.has(name)) {
    const install=()=>unpack(name,info.packs[name],progress);
    installs.set(name, install().catch(async error=>{
      if (/ENOSPC|quota|storage.*limit|exceed.*(?:storage|size)|no space|空间不足/i.test(error.errMsg||error.message)
        && await cleanObsoletePacks()) return install();
      throw error;
    }).catch(error => {
      installs.delete(name);
      report(name,'error');
      throw error;
    }));
  }
  return installs.get(name);
}
async function resolvePath(url) {
  const raw = String(url);
  if (!raw.startsWith(wx.env.USER_DATA_PATH + '/') && !raw.startsWith('data:')) {
    const file = resourceFor(raw);
    if (!file) return null;
    const [name,hash]=file.split('/');
    if(hash.includes('#')){
      const target=pathFor(raw);
      // Raw file callers (e.g. fetch) get a standalone PNG. Normal image
      // elements draw the region directly and never write individual files.
      if(!exists(target)){
        const icon=await loadIcon(raw);
        if(exists(target))return target;
        const pixels=icon.surface().getContext('2d').getImageData(0,0,icon.width,icon.height);
        fs().writeFileSync(target+'.next',encodeImageData(pixels).buffer);
        fs().renameSync(target+'.next',target);
      }
      return target;
    }
    await ensurePack(name);
    await ensureModel(name,hash,pathFor(raw));
  }
  return pathFor(raw);
}
async function removeObsoletePacks() {
  await yieldTask();
  let removed=0;
  // Only known, content-addressed resource folders inside this game's cache.
  // Removed music packages are obsolete too; player saves live elsewhere.
  for (const entry of fs().readdirSync(base)) {
    const match=/^(art|world|text|wind|dragon_summon|capture_bag|sound|music_(?:boss|ingame[1-4]))-([a-f0-9]{16})$/.exec(entry);
    if(match&&info.packs[match[1]]!==match[2]){
      const dir=base+'/'+entry;
      try {
        // Pack directories contain flat files. Yield between small batches
        // instead of depending on a native recursive-delete callback.
        const files=fs().readdirSync(dir);
        for(let i=0;i<files.length;i++){
          fs().unlinkSync(dir+'/'+files[i]);
          if((i+1)%4===0)await yieldTask();
        }
        fs().rmdirSync(dir,false);
        removed++;
      }catch(error){console.info('[字由搏击] 保留未清理的旧缓存',entry,error.message||error.errMsg);}
      await yieldTask();
    }
  }
  return removed;
}
function cleanObsoletePacks() {
  if(!cleanupJob)cleanupJob=removeObsoletePacks();
  return cleanupJob;
}
async function init(progress, onState) {
  if (!exists(base)) fs().mkdirSync(base, true);
  await preparePacks(['text'],onState,progress);
}
async function preparePacks(names,onProgress,downloadProgress) {
  if(onProgress)for(const name of names){
    if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(onProgress);
    if(packStates.has(name))onProgress(packStates.get(name));
  }
  try {return await Promise.all(names.map(name=>ensurePack(name,downloadProgress)));}
  finally {if(onProgress)for(const name of names)listeners.get(name).delete(onProgress);}
}
function prepareForest(onProgress,{wind=false}={}) {
  // Install a wind character's textures before native image loading starts;
  // slow first downloads must not consume the image decoder's timeout.
  return preparePacks(wind?['world','art','wind']:['world','art'],onProgress);
}
async function preloadForest() {
  // Keep idle downloads serial. Entering a game can join the current install
  // and start the other pack immediately through prepareForest.
  await yieldTask();
  await ensurePack('world');
  await ensurePack('art');
}
async function preloadDeferred() {
  // The default fire entry does not need these atlases. After boot, fill the
  // same cache that a later wind selection or on-demand image request joins.
  await yieldTask();
  await ensurePack('wind');
}
async function readCompressedAsset(url,expected){
  const path=await resolvePath(url);
  if(!path)throw Error('找不到压缩资源 '+url);
  const raw=await readBrotli(path,expected);
  return raw instanceof Uint8Array?raw:new Uint8Array(raw);
}
module.exports = {init,pathFor,resolvePath,readCompressedAsset,loadIcon,loadPackage,prepareForest,preloadForest,preloadDeferred,cleanObsoletePacks,diagnostics};
