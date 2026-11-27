import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';

// Stop before upload if a rebuild left the main index and a resource package
// at different revisions. Re-read the manifest; require() can cache old data.
export function verifyAssetPackages(project){
  const root=path.join(project,'minigame');
  const info=JSON.parse(fs.readFileSync(path.join(root,'assets.js'),'utf8')
    .replace(/^module\.exports\s*=\s*/,'').replace(/;\s*$/,''));
  const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
  if(!info.packs||!Object.keys(info.packs).length||!info.rawSizes||!info.packRoots)
    throw Error('资源清单不完整，请重新构建后预览');
  for(const [name,revision] of Object.entries(info.packs)){
    const expected=info.rawSizes[name];
    if(!/^[a-z0-9_]+$/.test(name)||!/^[a-f0-9]{16}$/.test(revision)||!Number.isSafeInteger(expected)||expected<=0)
      throw Error('资源清单无效：'+name);
    const packRoot='packs/'+name+'-'+revision;
    if(info.packRoots[name]!==packRoot)
      throw Error('资源包路径与版本不一致：'+name);
    const declarations=(config.subpackages||[]).filter(pack=>pack.name===name);
    if(declarations.length!==1||declarations[0].root!==packRoot)
      throw Error('资源分包声明与清单不一致：'+name);
    const entry=packRoot+'/game.js';
    if(!fs.existsSync(path.join(root,entry))||!fs.statSync(path.join(root,entry)).isFile())
      throw Error('资源分包入口缺失：'+entry+'，请重新构建后预览');
    if(fs.existsSync(path.join(root,'packs',name)))
      throw Error('仍存在旧的固定资源包路径：packs/'+name);
    const file=packRoot+'/assets.bin';
    const packed=fs.readFileSync(path.join(root,file));
    if(createHash('sha256').update(packed).digest('hex').slice(0,16)!==revision)
      throw Error('资源包版本与清单不一致：'+file+'，请重新构建后预览');
    let raw;
    try{raw=brotliDecompressSync(packed);}
    catch(error){throw Error('资源包无法解压：'+file+'，'+error.message);}
    if(raw.length!==expected)
      throw Error('资源包解压长度与清单不一致：'+file+'，预期 '+expected+'，实际 '+raw.length);
  }
}

// Local files alone do not prove that DevTools included them in the upload.
// Check its actual result before publishing a QR, including archive payloads.
export function verifyPreviewResult(project,preview){
  const size=preview?.size;
  if(!Number.isSafeInteger(size?.total)||size.total<=0||!Array.isArray(size.packages))
    throw Error('微信预览结果不完整：缺少有效包体大小或分包清单');
  for(const pack of size.packages){
    if(!pack||typeof pack.name!=='string'||!Number.isSafeInteger(pack.size)||pack.size<=0)
      throw Error('微信预览结果不完整：分包大小无效 '+(pack?.name||'未知分包'));
  }
  const root=path.join(project,'minigame');
  const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
  const packageName=root=>'/'+root.replace(/\/$/,'')+(root.endsWith('.js')?'':'/');
  const expected=['TOTAL','main',...(config.subpackages||[]).map(pack=>packageName(pack.root))].sort();
  const actual=size.packages.map(pack=>pack.name).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))
    throw Error('预览分包清单仍是旧版或不完整，请重新打开工程后重试');
  const sizes=new Map(size.packages.map(pack=>[pack.name,pack.size]));
  if(sizes.get('TOTAL')!==size.total)throw Error('微信预览结果不完整：总包大小不一致');
  const info=JSON.parse(fs.readFileSync(path.join(root,'assets.js'),'utf8')
    .replace(/^module\.exports\s*=\s*/,'').replace(/;\s*$/,''));
  for(const packRoot of Object.values(info.packRoots)){
    const file=packRoot+'/assets.bin',bytes=fs.statSync(path.join(root,file)).size;
    const uploaded=sizes.get(packageName(packRoot));
    // assets.bin is already Brotli-compressed and is shipped byte-for-byte.
    // A package smaller than its archive cannot contain that archive.
    if(uploaded===undefined||uploaded<bytes)
      throw Error('预览资源分包内容缺失：'+file+'（文件 '+bytes+' 字节，预览分包 '+(uploaded??0)+' 字节），请重新生成预览');
  }
}

// Track the actual build output, including every gameplay chunk and asset pack.
export function buildHashes(project){
  const root=path.join(project,'minigame');
  function visit(directory){
    return fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>{
      const name=path.posix.join(directory,entry.name);
      return entry.isDirectory()?visit(name):[name];
    });
  }
  return Object.fromEntries(visit('').sort().map(name=>
    [name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
}
