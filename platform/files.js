// The boot canvas must be the first canvas created by the mini game.
const fs = () => wx.getFileSystemManager();
const info = require('./assets');
const {restoreModel} = require('./resource-codec');
const {restoreSprite,resourceEntries,decodeBrotli,decodeText} = require('./resource-runtime');
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
    const action=method==='writeFile'?'保存':method==='readCompressedFile'?'解压':'读取';
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
  if (exists(dir)) fs().rmdirSync(dir, true);
  fs().mkdirSync(dir, true);
  const archive = 'packs/' + name + '/assets.br';
  report(name,'unpack');await yieldTask();
  const unpackAt=Date.now(),raw=await readArchive(name,archive);
  stats.unpackMs=Date.now()-unpackAt;
  const entries=[...resourceEntries(raw)],writeAt=Date.now();
  report(name,'write',0,entries.length);
  let sliceStart = Date.now(),written=0;
  for (const [file,part] of entries) {
    // Keep model recipes on disk. Restore only models actually requested by
    // gameplay, rather than copying all legacy GLBs before the first scene.
    await writeFile(dir+'/'+file,part.buffer.slice(part.byteOffset,part.byteOffset+part.byteLength));
    stats.writes++;
    if (++written>=8 || Date.now() - sliceStart >= 6) {
      report(name,'write',stats.writes,entries.length);await yieldTask();
      sliceStart = Date.now();written=0;
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
function pathFor(url) {
  const raw = String(url);
  if (raw.startsWith(wx.env.USER_DATA_PATH + '/') || raw.startsWith('data:')) return raw;
  const file = resourceFor(raw);
  if (!file) return null;
  const [name, hash] = file.split('/');
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
    await ensurePack(name);
    await ensureModel(name,hash,pathFor(raw));
  }
  return pathFor(raw);
}
async function init(progress) {
  if (!exists(base)) fs().mkdirSync(base, true);
  for (const [name,version] of Object.entries(info.packs)) {
    // Evict obsolete versions only inside this game's own cache.
    for (const entry of fs().readdirSync(base)) {
      if (new RegExp('^'+name+'-[a-f0-9]{16}$').test(entry) && entry !== name+'-'+version) {
        fs().rmdirSync(base+'/'+entry,true);
      }
    }
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
module.exports = {init,pathFor,resolvePath,loadPackage,prepareForest,diagnostics};
