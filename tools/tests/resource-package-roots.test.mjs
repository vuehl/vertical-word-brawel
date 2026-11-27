import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {packStream} from '../build/pack-resources.mjs';
import {addBootAssets} from '../build/boot-assets.mjs';
import {readAssetIndex,stageResourcePackages,finalizeResourcePackages} from '../build/resource-package-roots.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
function fixture(t){
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'ziling-package-roots-'));
  t.after(()=>{
    assert.ok(path.resolve(out).startsWith(path.resolve(os.tmpdir())+path.sep));
    fs.rmSync(out,{recursive:true,force:true});
  });
  const config={deviceOrientation:'portrait',subpackages:[{name:'play',root:'play'},{name:'text',root:'packs/text'},{name:'world',root:'packs/world'}]};
  fs.mkdirSync(path.join(out,'play'));
  fs.writeFileSync(path.join(out,'play','game.js'),'// Gameplay subpackage.\n');
  const info={packs:{},rawSizes:{},files:{}};
  const save=()=>fs.writeFileSync(path.join(out,'assets.js'),'module.exports = '+JSON.stringify(info)+';\n');
  function writePack(name,text){
    const data=Buffer.from(text),file=hash(data)+'.bin';
    const {bytes,rawSize}=packStream({[file]:data},name);
    const dir=path.join(out,'packs',name);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'assets.bin'),bytes);
    fs.writeFileSync(path.join(dir,'game.js'),'// Local resource subpackage.\n');
    info.packs[name]=hash(bytes);info.rawSizes[name]=rawSize;info.files['data/'+name+'.bin']=name+'/'+file;
    return bytes;
  }
  writePack('text','text before opening');writePack('world','world');save();
  return {out,config,info,writePack,save};
}

test('final upload roots include archive revisions, preserve package names, and remove canonical directories',t=>{
  const f=fixture(t),info=finalizeResourcePackages(f.out,f.config);
  const config=JSON.parse(fs.readFileSync(path.join(f.out,'game.json'),'utf8'));
  assert.deepEqual(config.subpackages.map(pkg=>pkg.name),['play','text','world']);
  assert.equal(config.subpackages[0].root,'play');
  for(const name of ['text','world']){
    assert.equal(info.packRoots[name],'packs/'+name+'-'+info.packs[name]);
    assert.equal(config.subpackages.find(pkg=>pkg.name===name).root,info.packRoots[name]);
    assert.equal(fs.existsSync(path.join(f.out,'packs',name)),false);
    assert.equal(hash(fs.readFileSync(path.join(f.out,info.packRoots[name],'assets.bin'))),info.packs[name]);
    const GameGlobal={};
    vm.runInNewContext(fs.readFileSync(path.join(f.out,info.packRoots[name],'game.js'),'utf8'),{GameGlobal});
    assert.equal(GameGlobal.pokebonkResourcePackages[name],info.packs[name]);
  }
});

test('legacy br transport migrates byte-for-byte without changing revisions or leaving duplicate archives',t=>{
  const f=fixture(t),published=finalizeResourcePackages(f.out,f.config);
  for(const name of ['text','world']){
    const dir=path.join(f.out,published.packRoots[name]);
    fs.renameSync(path.join(dir,'assets.bin'),path.join(dir,'assets.br'));
  }
  assert.equal(stageResourcePackages(f.out),true);
  // Existing preview files remain available until the new publication.
  for(const root of Object.values(published.packRoots))assert.ok(fs.existsSync(path.join(f.out,root,'assets.br')));
  const migrated=finalizeResourcePackages(f.out,f.config);
  assert.deepEqual(migrated.packs,published.packs);
  assert.deepEqual(migrated.packRoots,published.packRoots);
  for(const [name,root] of Object.entries(migrated.packRoots)){
    assert.equal(hash(fs.readFileSync(path.join(f.out,root,'assets.bin'))),published.packs[name]);
    assert.equal(fs.existsSync(path.join(f.out,root,'assets.br')),false);
  }
});

test('unchanged incremental and repeated finalization produce identical paths, manifest, config and archives',t=>{
  const f=fixture(t);finalizeResourcePackages(f.out,f.config);
  const snapshot=()=>Object.fromEntries(fs.readdirSync(f.out,{recursive:true}).filter(file=>fs.statSync(path.join(f.out,file)).isFile())
    .sort().map(file=>[file,hash(fs.readFileSync(path.join(f.out,file)))]));
  const before=snapshot();
  assert.equal(stageResourcePackages(f.out),true);
  for(const name of ['text','world'])assert.ok(fs.existsSync(path.join(f.out,'packs',name,'assets.bin')));
  finalizeResourcePackages(f.out,f.config);assert.deepEqual(snapshot(),before);
  finalizeResourcePackages(f.out,f.config);assert.deepEqual(snapshot(),before);
});

test('staging keeps every published root available even if the build stops before finalization',t=>{
  const f=fixture(t),published=finalizeResourcePackages(f.out,f.config);
  const config=fs.readFileSync(path.join(f.out,'game.json'),'utf8');
  assert.equal(stageResourcePackages(f.out),true);
  assert.equal(fs.readFileSync(path.join(f.out,'game.json'),'utf8'),config);
  for(const name of ['text','world']){
    assert.equal(hash(fs.readFileSync(path.join(f.out,published.packRoots[name],'assets.bin'))),published.packs[name]);
    assert.equal(hash(fs.readFileSync(path.join(f.out,'packs',name,'assets.bin'))),published.packs[name]);
  }
});

test('finalization keeps declared entries and archives present throughout unchanged and changed builds',t=>{
  const f=fixture(t);finalizeResourcePackages(f.out,f.config);
  const missing=[];
  // Model DevTools observing each directory mutation or config replacement.
  // Record failures instead of interrupting publication so cleanup still runs.
  for(const method of ['mkdirSync','copyFileSync','renameSync','rmSync']){
    const original=fs[method];
    t.mock.method(fs,method,(...args)=>{
      const result=original(...args);
      const config=JSON.parse(fs.readFileSync(path.join(f.out,'game.json'),'utf8'));
      for(const pkg of config.subpackages){
        for(const name of pkg.name==='play'?['game.js']:['game.js','assets.bin']){
          const file=path.join(pkg.root,name);
          if(!fs.existsSync(path.join(f.out,file)))missing.push(method+': '+file);
        }
      }
      return result;
    });
  }
  try{
    stageResourcePackages(f.out);finalizeResourcePackages(f.out,f.config);
    stageResourcePackages(f.out);
    addBootAssets(f.out,{'assets/opening/p00.webp':Buffer.from('new opening page')});
    finalizeResourcePackages(f.out,f.config);
    assert.deepEqual(missing,[],'The live game.json must always reference complete subpackages');
  }finally{t.mock.restoreAll();}
});

test('new and changed roots reach the file index before their subpackage declarations',t=>{
  const f=fixture(t),missing=[];
  const indexed=new Set(fs.readdirSync(f.out,{recursive:true}).map(file=>path.join(f.out,file))
    .filter(file=>fs.statSync(file).isFile()));
  const forget=file=>{
    for(const known of indexed)if(known===file||known.startsWith(file+path.sep))indexed.delete(known);
  };
  // Model a watcher that receives file events but does not recursively scan
  // the contents of a directory moved into the project. Checking disk alone
  // would pass while DevTools still cannot resolve the declared package.
  for(const method of ['mkdirSync','copyFileSync','writeFileSync','renameSync','rmSync']){
    const original=fs[method];
    t.mock.method(fs,method,(...args)=>{
      const from=path.resolve(args[0]);
      const renamedFile=method==='renameSync'&&fs.statSync(from).isFile();
      const result=original(...args);
      if(method==='copyFileSync')indexed.add(path.resolve(args[1]));
      else if(method==='writeFileSync')indexed.add(from);
      else if(method==='rmSync')forget(from);
      else if(method==='renameSync'){
        forget(from);
        if(renamedFile)indexed.add(path.resolve(args[1]));
      }
      const configFile=path.join(f.out,'game.json');
      if(fs.existsSync(configFile))for(const pkg of JSON.parse(fs.readFileSync(configFile,'utf8')).subpackages){
        for(const name of pkg.name==='play'?['game.js']:['game.js','assets.bin']){
          const file=path.join(f.out,pkg.root,name);
          if(!indexed.has(file))missing.push(method+': '+path.relative(f.out,file));
        }
      }
      return result;
    });
  }
  try{
    const first=finalizeResourcePackages(f.out,f.config);
    assert.equal(stageResourcePackages(f.out),true);
    f.writePack('text','updated text archive');
    f.writePack('wind','new wind archive');f.save();
    f.config.subpackages.push({name:'wind',root:'packs/wind'});
    const updated=finalizeResourcePackages(f.out,f.config);
    assert.notEqual(updated.packRoots.text,first.packRoots.text);
    assert.ok(updated.packRoots.wind);
    assert.equal(stageResourcePackages(f.out),true);
    finalizeResourcePackages(f.out,f.config);
    assert.deepEqual(missing,[],'Declared entries and archives must be available to the file index throughout publication');
  }finally{t.mock.restoreAll();}
});

test('late boot asset injection determines the final text root and obsolete generated roots are removed',t=>{
  const f=fixture(t),before=finalizeResourcePackages(f.out,f.config),oldRoot=before.packRoots.text;
  assert.equal(stageResourcePackages(f.out),true);
  addBootAssets(f.out,{'assets/opening/p00.webp':Buffer.from('new opening page')});
  const afterBoot=readAssetIndex(f.out);assert.notEqual(afterBoot.packs.text,before.packs.text);
  assert.equal(stageResourcePackages(f.out),true,'A build interrupted after boot injection can resume');
  assert.equal(hash(fs.readFileSync(path.join(f.out,oldRoot,'assets.bin'))),before.packs.text);
  fs.mkdirSync(path.join(f.out,'packs/unrelated-notes'),{recursive:true});
  const final=finalizeResourcePackages(f.out,f.config);
  assert.equal(final.packRoots.text,'packs/text-'+afterBoot.packs.text);
  assert.equal(fs.existsSync(path.join(f.out,oldRoot)),false);
  assert.equal(fs.existsSync(path.join(f.out,'packs/text')),false);
  assert.equal(fs.existsSync(path.join(f.out,'packs/unrelated-notes')),true);
});

test('an interrupted newer canonical build is preserved and requests a full rebuild',t=>{
  const f=fixture(t),previous=finalizeResourcePackages(f.out,f.config);
  f.writePack('text','partially rebuilt newer text');
  // The main manifest still describes the previously published version.
  assert.equal(stageResourcePackages(f.out),false);
  assert.equal(hash(fs.readFileSync(path.join(f.out,'packs/text/assets.bin'))),f.info.packs.text);
  assert.ok(fs.existsSync(path.join(f.out,previous.packRoots.text,'assets.bin')));
  f.save();
  const final=finalizeResourcePackages(f.out,f.config);
  assert.equal(final.packs.text,f.info.packs.text);
  assert.equal(fs.existsSync(path.join(f.out,previous.packRoots.text)),false);
});

test('invalid roots and mismatched archives fail before destructive mutations',t=>{
  const f=fixture(t);
  f.info.packRoots={text:'../outside',world:'packs/world-'+f.info.packs.world};f.save();
  assert.throws(()=>stageResourcePackages(f.out),/Invalid resource package root text/);
  delete f.info.packRoots;f.save();
  fs.writeFileSync(path.join(f.out,'packs/world/assets.bin'),'wrong version');
  assert.throws(()=>finalizeResourcePackages(f.out,f.config),/Resource package differs from index: world/);
  assert.ok(fs.existsSync(path.join(f.out,'packs/text/assets.bin')));
  assert.equal(fs.existsSync(path.join(f.out,'packs/text-'+f.info.packs.text)),false);
});
