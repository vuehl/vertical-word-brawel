import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function readAssetIndex(out){
  return JSON.parse(fs.readFileSync(path.join(out,'assets.js'),'utf8')
    .replace(/^module\.exports\s*=\s*/,'').replace(/;\s*$/,''));
}

export function resourcePackageRoot(info,name){
  const revision=info.packs?.[name];
  if(!/^[a-z0-9_]+$/.test(name)||!/^[a-f0-9]{16}$/.test(revision))throw Error('Invalid resource package '+name);
  const expected='packs/'+name+'-'+revision;
  if(info.packRoots&&info.packRoots[name]!==expected)throw Error('Invalid resource package root '+name);
  return info.packRoots?expected:'packs/'+name;
}

const hash=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
function packageDirectory(out,relative){
  const base=path.resolve(out,'packs'),target=path.resolve(out,relative);
  if(!target.startsWith(base+path.sep)||path.dirname(target)!==base)throw Error('Unsafe generated package path '+relative);
  return target;
}
function archiveMatches(directory,revision){
  const file=path.join(directory,'assets.bin');
  return fs.existsSync(file)&&hash(fs.readFileSync(file))===revision;
}
function copyPackageFiles(source,target){
  // Resource packages are flat. Copy explicitly instead of the native
  // recursive copier, which can terminate Node on this Windows project path.
  fs.mkdirSync(target,{recursive:true});
  for(const entry of fs.readdirSync(source,{withFileTypes:true})){
    if(!entry.isFile())throw Error('Unexpected resource package entry '+entry.name);
    const from=path.join(source,entry.name),to=path.join(target,entry.name);
    if(!fs.existsSync(to)||!fs.readFileSync(from).equals(fs.readFileSync(to)))fs.copyFileSync(from,to);
  }
}

// Build tools continue using canonical working directories. Only the final
// upload layout is versioned, so a phone cannot mount last preview's archive
// at the same filesystem path as this preview's main-package index.
export function stageResourcePackages(out){
  if(!fs.existsSync(path.join(out,'assets.js')))return false;
  const info=readAssetIndex(out);let complete=true;
  for(const [name,revision] of Object.entries(info.packs||{})){
    const packaged=packageDirectory(out,resourcePackageRoot(info,name));
    const working=packageDirectory(out,'packs/'+name);
    // DevTools can compile at any point during a build. Keep the currently
    // declared directory mounted, including when this build is interrupted.
    if(!fs.existsSync(working)&&fs.existsSync(packaged))copyPackageFiles(packaged,working);
    // Migrate the transport filename without recompressing or invalidating
    // the phone's already installed, content-addressed resource cache.
    const legacy=path.join(working,'assets.br'),binary=path.join(working,'assets.bin');
    if(!fs.existsSync(binary)&&fs.existsSync(legacy)&&hash(fs.readFileSync(legacy))===revision)
      fs.renameSync(legacy,binary);
    // A canonical directory left by an interrupted full build takes priority.
    // If it differs from the last index, request a full rebuild rather than
    // overwriting it with an older published package.
    if(!archiveMatches(working,revision))complete=false;
  }
  return complete&&Object.keys(info.packs||{}).length>0;
}

function writeText(file,text){
  if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===text)return;
  fs.writeFileSync(file+'.next',text);fs.renameSync(file+'.next',file);
}

export function finalizeResourcePackages(out,config){
  const info=readAssetIndex(out),roots={},names=new Set(Object.keys(info.packs));
  // Validate every source before changing any published paths.
  const packages=Object.entries(info.packs).map(([name,revision])=>{
    resourcePackageRoot({...info,packRoots:undefined},name);
    if(!config.subpackages?.some(pkg=>pkg.name===name))throw Error('Missing resource subpackage '+name);
    const root=roots[name]='packs/'+name+'-'+revision;
    const target=packageDirectory(out,root),working=packageDirectory(out,'packs/'+name);
    const source=fs.existsSync(working)?working:target;
    if(!archiveMatches(source,revision))throw Error('Resource package differs from index: '+name+'; rebuild assets before preview');
    return {name,revision,source,target};
  });
  for(const {name,revision,source,target} of packages){
    if(source!==target){
      if(fs.existsSync(target)){
        // An unchanged revision is already published. Refresh changed files
        // without deleting its directory or retriggering unchanged archives.
        copyPackageFiles(source,target);
      }else fs.renameSync(source,target);
    }
    writeText(path.join(target,'game.js'),'// Resource '+name+' revision '+revision+'.\n'+
      '(GameGlobal.pokebonkResourcePackages || (GameGlobal.pokebonkResourcePackages = {}))['+
      JSON.stringify(name)+'] = '+JSON.stringify(revision)+';\n');
    fs.rmSync(path.join(target,'assets.br'),{force:true});
  }
  // Switch declarations only after all new roots exist; retire the previous
  // roots afterwards so the live game.json never points at a missing folder.
  info.packRoots=roots;
  writeText(path.join(out,'assets.js'),'module.exports = '+JSON.stringify(info)+';\n');
  writeText(path.join(out,'game.json'),JSON.stringify({...config,subpackages:config.subpackages.map(pkg=>
    roots[pkg.name]?{...pkg,root:roots[pkg.name]}:pkg)},null,2)+'\n');
  // Only this build's known generated package names are eligible for cleanup.
  const packDirectory=path.resolve(out,'packs');
  for(const entry of fs.readdirSync(packDirectory,{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const match=/^([a-z0-9_]+)(?:-([a-f0-9]{16}))?$/.exec(entry.name);
    if(!match||!names.has(match[1])||roots[match[1]]==='packs/'+entry.name)continue;
    fs.rmSync(packageDirectory(out,'packs/'+entry.name),{recursive:true,force:true});
  }
  return info;
}
