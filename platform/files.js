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
const diagnostics = {packs:{},modelsRestored:0};
const base = wx.env.USER_DATA_PATH + '/pokebonk-assets';
const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));
function exists(path) { try { fs().accessSync(path); return true; } catch (error) { return false; } }
function report(name,phase,completed=0,total=0) {
  const state={name,phase,completed,total};packStates.set(name,state);
  for(const listener of listeners.get(name)||[])listener(state);
}
function fileCall(method,options) {
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error instanceof Error?error:Error(error.errMsg||String(error))):resolve(result);};
    const action=method==='rmdir'?'清理':method==='writeFile'?'保存':method==='readCompressedFile'?'解压':'读取';
    const timer=setTimeout(()=>finish(Error('资源'+action+'超时，请重试')),30000);
    try {fs()[method](Object.assign({},options,{success:result=>finish(null,result),fail:finish}));}catch(error){finish(error);}
  });
}
async function readFile(filePath,encoding) {
  if(typeof fs().readFile==='function')return (await fileCall('readFile',Object.assign({filePath},encoding?{encoding}:{}))).data;
  return fs().readFileSync(filePath,encoding);
}
async function writeFile(filePath,data,encoding) {
  if(typeof fs().writeFile==='function')await fileCall('writeFile',Object.assign({filePath,data},encoding?{encoding}:{}));
  else fs().writeFileSync(filePath,data,encoding);
}
async function removePackDirectory(dirPath) {
  if(typeof fs().rmdir==='function')await fileCall('rmdir',{dirPath,recursive:true});
  else {await yieldTask();fs().rmdirSync(dirPath,true);}
}
async function readArchive(name,archive) {
  const manager=fs(),expected=info.rawSizes[name];let raw;
  if(typeof manager.readCompressedFile==='function'){
    try {raw=(await fileCall('readCompressedFile',{filePath:archive,compressionAlgorithm:'br'})).data;}
    catch(error){console.warn('[字行] 异步解压失败',name,error);}
  }
  if((!raw||raw.byteLength!==expected)&&typeof manager.readCompressedFileSync==='function'){
    await yieldTask();
    try {raw=manager.readCompressedFileSync({filePath:archive,compressionAlgorithm:'br'});}
    catch(error){console.warn('[字行] 原生解压失败，使用备用解码器',name,error);}
  }
  if(!raw||raw.byteLength!==expected){
    const bytes=new Uint8Array(await readFile(archive));await yieldTask();
    raw=decodeBrotli(bytes,expected);
  }
  if(!raw||raw.byteLength!==expected)throw Error('资源包长度不符 '+name);
  return raw;
}
function downloadPackage(name, progress) {
  return new Promise((resolve,reject) => {
    let timer, lastBytes = 0, lastPercent = 0, done = false;
    function finish(error) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (error) reject(new Error(name + ' 分包：' + (error.errMsg || error.message || error)));
      else resolve();
    }
    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => finish('下载长时间没有进展，请检查网络并重新进入'), 45000);
    }
    resetTimer();
    try {
      const task = wx.loadSubpackage({name, success: () => finish(), fail: finish});
      if (task && task.onProgressUpdate) task.onProgressUpdate(event => {
        const bytes = Number.isFinite(event.totalBytesWritten) ? event.totalBytesWritten : 0;
        const percent = Number.isFinite(event.progress) ? event.progress : 0;
        if (done || (bytes <= lastBytes && percent <= lastPercent)) return;
        lastBytes = Math.max(lastBytes, bytes);
        lastPercent = Math.max(lastPercent, percent);
        resetTimer();
        if (progress) progress(lastPercent);
      });
    } catch (error) { finish(error); }
  });
}
async function loadPackage(name, progress) {
  try {
    await downloadPackage(name, progress);
  } catch (error) {
    console.warn('[宝可梦] 重试下载分包', name, error);
    await new Promise(resolve => setTimeout(resolve, 500));
    await downloadPackage(name, progress);
  }
}
async function unpack(name, revision, progress) {
  const dir = base + '/' + name + '-' + revision;
  const began=Date.now(),stats=diagnostics.packs[name]={cached:false,writes:0,rawBytes:info.rawSizes[name]};
  if (exists(dir + '/.ready')) {stats.cached=true;report(name,'ready',1,1);return;}
  report(name,'download',0,100);
  await loadPackage(name,p=>{if(progress)progress(p);report(name,'download',p,100);});
  // Only an interrupted install can leave an unmarked hash directory.
  if (exists(dir)) await removePackDirectory(dir);
  fs().mkdirSync(dir, true);
  const archive = 'packs/' + name + '/assets.br';
  report(name,'unpack');await yieldTask();
  const unpackAt=Date.now(),raw=await readArchive(name,archive);
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
    installs.set(name, unpack(name,info.packs[name],progress).catch(error => {
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
async function init(progress) {
  if (!exists(base)) fs().mkdirSync(base, true);
  // Only known, content-addressed resource folders inside this game's cache.
  // Removed music packages are obsolete too; player saves live elsewhere.
  for (const entry of fs().readdirSync(base)) {
    const match=/^(art|world|text|dragon_summon|capture_bag|sound|music_(?:boss|ingame[1-4]))-([a-f0-9]{16})$/.exec(entry);
    if(match&&info.packs[match[1]]!==match[2])await removePackDirectory(base+'/'+entry);
  }
  await ensurePack('text', progress);
}
async function prepareForest(onProgress) {
  const names=['world','art'];
  if(onProgress)for(const name of names){
    if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(onProgress);
    if(packStates.has(name))onProgress(packStates.get(name));
  }
  try {return await Promise.all(names.map(name=>ensurePack(name)));}
  finally {if(onProgress)for(const name of names)listeners.get(name).delete(onProgress);}
}
module.exports = {init,pathFor,resolvePath,loadIcon,loadPackage,prepareForest,diagnostics};
