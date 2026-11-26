import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import esbuild from 'esbuild';
import {buildPlay} from './build/play-chunks.mjs';
import {bindPortalZoneClock} from '../source/tools/portal-zone-clock.mjs';
import {parse} from '../source/tools/vendor/acorn.mjs';
import {addBootAssets,bootAssets,writeBootPoster} from './build/boot-assets.mjs';
import {lowerUnicodeRegexes} from './build/device-syntax.mjs';
import {assetPolicyVersion,itemIconSelectionChanged} from './build/asset-policy.mjs';
import {gameProject} from './build/project-target.mjs';
import {buildOpeningAtlas} from './art/build-journey-opening.mjs';
import {stageResourcePackages,finalizeResourcePackages} from './build/resource-package-roots.mjs';

const root=path.resolve(import.meta.dirname,'..'), src=path.join(root,'source'), platform=path.join(root,'platform');
const development=process.argv.includes('--dev');
const projectRoot=gameProject(root,development);
const developer=development?await import('./developer/build-support.mjs'):null;
const out=path.join(projectRoot,'minigame'),engine=path.join(out,'engine');
fs.mkdirSync(engine,{recursive:true});
// Generate pages before either the full or incremental startup archive reads them.
await buildOpeningAtlas(root);
const resourcePackagesReady=stageResourcePackages(out);
const manifest=path.join(out,'assets.js');
const installedAssets=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8').replace(/^module.exports\s*=\s*/,'').replace(/;\s*$/,'')):null;
if(installedAssets?.policyVersion!==assetPolicyVersion||itemIconSelectionChanged(installedAssets.files)||
  (developer&&installedAssets?.developerAssetKey!==developer.assetKey())||!resourcePackagesReady||process.argv.includes('--assets'))
  execFileSync(process.execPath,[path.join(import.meta.dirname,'build/assets.mjs'),...(development?['--dev']:[])],{stdio:'inherit',windowsHide:true});
const read=(f)=>fs.readFileSync(path.join(src,f),'utf8').replace(/\r\n/g,'\n');
const replace=(s,from,to)=>{
  if(!s.includes(from)||s.indexOf(from)!==s.lastIndexOf(from))throw Error('Source anchor changed: '+from.slice(0,80));
  return s.replace(from,to);
};
const sources={
  name:'pokebonk-platform',setup(build){
    build.onLoad({filter:/[\\/]PortalDock\.mjs$/},args=>({
      contents:bindPortalZoneClock(fs.readFileSync(args.path,'utf8')),loader:'js',
    }));
    build.onResolve({filter:/^node:crypto$/},()=>({path:path.join(platform,'crypto.mjs')}));
    build.onResolve({filter:/^pokebonk:clone$/},()=>({path:path.join(platform,'clone.mjs')}));
    build.onResolve({filter:/^pokebonk:base64$/},()=>({path:path.join(platform,'base64.mjs')}));
    build.onResolve({filter:/^pokebonk:css-number$/},()=>({path:path.join(platform,'css-number.mjs')}));
    build.onLoad({filter:/core-js[\\/]internals[\\/]global-this\.js$/},()=>({
      contents:'module.exports = typeof globalThis === "object" ? globalThis : GameGlobal;'
    }));
    build.onLoad({filter:/@noble[\\/]hashes[\\/]esm[\\/]_md\.js$/},args=>{
      // SHA-256's 64-bit bit count is two 32-bit words, even on engines without BigInt.
      const contents=replace(fs.readFileSync(args.path,'utf8'),
        'setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);',
        'view.setUint32(blockLen - (isLE ? 4 : 8), Math.floor(this.length / 0x20000000), isLE);\n'+
        '        view.setUint32(blockLen - (isLE ? 8 : 4), this.length * 8, isLE);');
      return {contents,resolveDir:path.dirname(args.path)};
    });
    build.onLoad({filter:/local[\\/]progression\.mjs$/},()=>({resolveDir:path.join(src,'local'),contents:
      read('local/progression.mjs').replace("import fs from 'node:fs';",'import {cloneData as structuredClone} from "pokebonk:clone";')
        .replace(/^const pokemon = new Map\(.+;$/m,'const pokemon=new Map('+JSON.stringify(JSON.parse(read('../resources/public/data/pokemon.json')).map(p=>[p.id,{family:p.family}]))+');')
    }));
    build.onLoad({filter:/linkedom[\\/]worker\.js$/},args=>{
      let code=fs.readFileSync(args.path,'utf8').replace(/\r\n/g,'\n');
      code=replace(code,'const formatter = new Intl.NumberFormat("en-US", {\n\tuseGrouping: false,\n\tminimumFractionDigits: 0,\n\tmaximumFractionDigits: 6\n});',
        'import {formatFiniteCssNumber} from "pokebonk:css-number";');
      code=replace(code,'formatter.format(val)','formatFiniteCssNumber(val)');
      code=replace(code,'/^(.+?)\\s+of\\s+(.+)$/is','/^([\\s\\S]+?)\\s+of\\s+([\\s\\S]+)$/i');
      code=replace(code,'/[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]/g, "�"',
        '/[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDFFF]/g, s=>s.length===2?s:"�"');
      // Both the HTML entity table and CSS data URLs use this bundled decoder.
      // Fold out linkedom's Node-only fallbacks when building the WeChat bundle.
      code='import {decodeBase64String as atob} from "pokebonk:base64";\n'+code.replaceAll('typeof atob === "function"','true');
      // The native layout engine applies the same HTML stylesheet to every album card.
      // Reuse selector programs, but never cache their results across DOM changes.
      code+='\nexport const compileStyleSelector=selector=>compile(selector,{adapter,strict:true,xmlMode:false,cacheResults:false});';
      return {contents:code,resolveDir:path.dirname(args.path)};
    });
    build.onLoad({filter:/[\\/]source[\\/]src[\\/].*\.js$/},args=>{
      let code=fs.readFileSync(args.path,'utf8');
      if(developer && args.path===path.join(src,'src','game.js')) {
        code=developer.instrumentGame(code.replace(/\r\n/g,'\n'));
      }
      if(code.includes('\\p{'))code=lowerUnicodeRegexes(code);
      return {contents:code,resolveDir:path.dirname(args.path)};
    });
  }
};
// The preview service parses the submitted JavaScript before issuing a QR code.
const previewESVersion=2017;
const common={bundle:true,platform:'browser',format:'cjs',minify:true,target:'es'+previewESVersion,charset:'utf8',legalComments:'eof',metafile:process.argv.includes('--analyze'),
  nodePaths:[path.join(import.meta.dirname,'node_modules')],plugins:[...(developer?[developer.isolatedStoragePlugin(platform)]:[]),sources],logLevel:'warning'};
const hostBundle=await esbuild.build({...common,define:{document:'undefined',__LOCAL_PROGRESS_ONLY__:String(development)},entryPoints:[path.join(platform,'host.mjs')],write:false});
await esbuild.build({...common,entryPoints:[path.join(import.meta.dirname,'build/resource-runtime.mjs')],outfile:path.join(out,'resource-runtime.js')});
fs.rmSync(path.join(out,'sprite-png.js'),{force:true});
const result=await buildPlay(common,src,hostBundle.outputFiles[0].text);
result.files.set('game.js',fs.readFileSync(path.join(platform,'play-entry.js'),'utf8'));
function checkScriptSize(file,bytes){
  if(bytes>1.8*1048576)throw Error(file+' exceeds the 1.8 MiB per-script budget: '+bytes+' bytes.');
}
for(const [name,code] of result.files)checkScriptSize('play/'+name,Buffer.byteLength(code));
const playDir=path.join(out,'play');
fs.mkdirSync(playDir,{recursive:true});
// Remove the loose copies produced by earlier builds.
for(const asset of ['ultimate-cast.webp','ultimate-cast-ink.bin','nameplate-blade.webp'])
  fs.rmSync(path.join(playDir,asset),{force:true});
function writeScript(destination,code){
  if(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')===code)return;
  const pending=destination+'.'+process.pid+'.tmp';
  try{
    fs.writeFileSync(pending,code);
    fs.renameSync(pending,destination);
  }finally{fs.rmSync(pending,{force:true});}
}
for(const [name,code] of result.files)writeScript(path.join(playDir,name),code);
// The source movie stays in resources; the image pages ship in the text archive.
fs.rmSync(path.join(playDir,'journey-opening.mp4'),{force:true});
const openingDir=path.resolve(playDir,'opening');
if(!openingDir.startsWith(path.resolve(out)+path.sep))throw Error('Invalid generated opening directory');
if(fs.existsSync(openingDir)){
  for(const name of fs.readdirSync(openingDir))if(/^p\d+\.webp$/.test(name))fs.unlinkSync(path.join(openingDir,name));
  if(!fs.readdirSync(openingDir).length)fs.rmdirSync(openingDir);
}
for(const name of fs.readdirSync(playDir)){
  if(name.endsWith('.js')&&!result.files.has(name))fs.unlinkSync(path.join(playDir,name));
}
fs.rmSync(path.join(out,'play.js'),{force:true});
for(const file of ['host.js','original.js'])fs.rmSync(path.join(out,file),{force:true});
fs.copyFileSync(path.join(platform,'files.js'),path.join(out,'files.js'));
fs.rmSync(path.join(out,'entry-data.js'),{force:true});
const bootScript=await esbuild.build({entryPoints:[path.join(platform,'boot-screen.js')],bundle:true,format:'cjs',target:'es2017',
  external:['./boot-poster'],write:false});
writeScript(path.join(out,'boot-screen.js'),bootScript.outputFiles[0].text);
writeBootPoster(root,out);
fs.rmSync(path.join(out,'boot-hero-art.js'),{force:true});
fs.copyFileSync(path.join(platform,'resource-codec.js'),path.join(out,'resource-codec.js'));
addBootAssets(out,bootAssets(root));
fs.copyFileSync(path.join(root,'game.js'),path.join(out,'game.js'));
// finalizeResourcePackages publishes game.json once the versioned roots exist.
// Never expose the source config's temporary canonical paths to DevTools.
if(developer)developer.writeProject(root,projectRoot);
const runtimePackages=new Set(['linkedom','typeflex','fflate','@noble/hashes','brotli','core-js','base64-js']);
const notices=['pixelfx Soul drain\n'+fs.readFileSync(path.join(platform,'pixelfx-soul-drain-LICENSE.txt'),'utf8')];
for(const name of runtimePackages){
  const dir=path.join(import.meta.dirname,'node_modules',name);
  const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
  const license=fs.readdirSync(dir).find(file=>/^licen[sc]e(?:$|[.])/i.test(file));
  if(license)notices.push(name+' '+pkg.version+'\n'+fs.readFileSync(path.join(dir,license),'utf8'));
  else if(name==='brotli')notices.push(name+' '+pkg.version+'\n'+fs.readFileSync(path.join(import.meta.dirname,'build/brotli-NOTICE.txt'),'utf8'));
  for(const dep of Object.keys(pkg.dependencies||{}))if(fs.existsSync(path.join(import.meta.dirname,'node_modules',dep,'package.json')))runtimePackages.add(dep);
}
fs.writeFileSync(path.join(out,'packs','text','licenses.txt'),notices.join('\n\n'));
finalizeResourcePackages(out,JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8')));
// Remove outputs from builds that shipped the engine as a separate code package.
for(const file of ['game.js','host.js','original.js','licenses.txt','layout.bin','styles.bin'])fs.rmSync(path.join(engine,file),{force:true});
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?files(path.join(dir,f.name)):[path.join(dir,f.name)]);}
const built=files(out),size=list=>list.reduce((n,f)=>n+fs.statSync(f).size,0);
if(!development){
  if(Object.keys(result.metafile.inputs).some(file=>/tools[\\/]developer[\\/]/.test(file)))
    throw Error('Developer module included in release dependency graph.');
  const release=[...result.files.values()].join('\n');
  for(const marker of ['__zixingDeveloper','zx-dev-panel','pokebonk-dev-save','mountLiteQA','隔离 QA'])
    if(release.includes(marker))throw Error('Developer code leaked into release: '+marker);
}
for(const file of built.filter(f=>f.endsWith('.js'))){
  const bytes=fs.statSync(file).size;
  checkScriptSize(path.relative(out,file),bytes);
  try{parse(fs.readFileSync(file,'utf8'),{ecmaVersion:previewESVersion});}
  catch(error){throw new Error(path.relative(out,file)+': '+error.message);}
}
const {subpackages}=JSON.parse(fs.readFileSync(path.join(out,'game.json'),'utf8'));
const subRoots=subpackages.map(pkg=>path.resolve(out,pkg.root));
const total=size(built),main=size(built.filter(file=>!subRoots.some(root=>file===root||file.startsWith(root+path.sep))));
console.log('Native project:',(total/1048576).toFixed(2),'MiB, main:',(main/1048576).toFixed(2),'MiB.');
const playFiles=[...result.files.keys()].map(name=>({name,bytes:fs.statSync(path.join(playDir,name)).size}))
  .sort((a,b)=>b.bytes-a.bytes);
console.log('Largest play script:',playFiles[0].name,playFiles[0].bytes,'bytes (limit 1.8 MiB).');
// WeChat allows 30 MiB across all packages and 4 MiB for the main package.
// Reserve space for metadata added by DevTools.
for(const [label,bytes,budget] of [
  ['total package',total,30*1048576-128*1024],
  ['main package',main,4*1048576-64*1024],
]){
  if(bytes>budget)throw Error(`WeChat ${label} exceeds the build budget: ${bytes} bytes (limit ${budget} bytes).`);
}
if(process.argv.includes('--analyze')){
  const attributed=new Map();
  for(const key of result.shippedOutputs)for(const [file,{bytesInOutput}] of Object.entries(result.metafile.outputs[key].inputs)){
    attributed.set(file,(attributed.get(file)||0)+bytesInOutput);
  }
  const inputs=[...attributed].map(([file,bytes])=>({file,bytes}));
  const engineInputs=inputs.filter(({file})=>/\/three-[^/]+\.js$/.test(file));
  const coreInputs=inputs.filter(input=>!engineInputs.includes(input));
  const sum=list=>list.reduce((n,input)=>n+input.bytes,0);
  const codeFiles=built.filter(file=>!file.includes(path.sep+'packs'+path.sep));
  const codeBytes=size(codeFiles),hostBytes=hostBundle.outputFiles[0].contents.length;
  const groups=[
    {name:'玩法、界面与内置效果代码',bytes:sum(coreInputs)},
    {name:'Three.js 3D 引擎',bytes:sum(engineInputs)},
    {name:'微信界面、布局、存档与兼容层',bytes:hostBytes},
    {name:'启动、资源加载与打包封装',bytes:codeBytes-sum(inputs)-hostBytes},
  ];
  const report={basis:'Minified esbuild output attribution plus actual startup files; on-disk bytes, NOT runtime RAM.',totalBytes:codeBytes,
    groups:groups.map(group=>({...group,MiB:group.bytes/1048576})),
    playFiles,gameplayInputs:coreInputs.sort((a,b)=>b.bytes-a.bytes),engineInputs,
    platformInputs:Object.entries(Object.values(hostBundle.metafile.outputs)[0].inputs).map(([file,{bytesInOutput}])=>({file,bytes:bytesInOutput})).sort((a,b)=>b.bytes-a.bytes)};
  const reportDir=process.env.POKEBONK_QA||path.join(root,'验收');fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'代码组成.json'),JSON.stringify(report,null,2)+'\n');
  console.table(report.groups.map(({name,bytes,MiB})=>({组成:name,字节:bytes,MiB:MiB.toFixed(2)})));
}
