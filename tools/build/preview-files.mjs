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
  if(!info.packs||!Object.keys(info.packs).length||!info.rawSizes)
    throw Error('资源清单不完整，请重新构建后预览');
  for(const [name,revision] of Object.entries(info.packs)){
    const expected=info.rawSizes[name];
    if(!/^[a-z0-9_]+$/.test(name)||!/^[a-f0-9]{16}$/.test(revision)||!Number.isSafeInteger(expected)||expected<=0)
      throw Error('资源清单无效：'+name);
    const file='packs/'+name+'/assets.br';
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
