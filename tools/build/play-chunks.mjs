import path from 'node:path';
import esbuild from 'esbuild';
import {parse} from '../../source/tools/vendor/acorn.mjs';

// Modules execute in the browser environment created by the WeChat host.
const bindings=('globalThis window self document navigator location history localStorage sessionStorage innerWidth innerHeight devicePixelRatio screen '+
  'getComputedStyle matchMedia performance addEventListener removeEventListener dispatchEvent requestAnimationFrame cancelAnimationFrame '+
  'Image HTMLImageElement HTMLCanvasElement HTMLElement HTMLInputElement HTMLButtonElement HTMLTextAreaElement HTMLSelectElement HTMLAnchorElement HTMLVideoElement Node Element '+
  'Event CustomEvent EventTarget PointerEvent MouseEvent KeyboardEvent ProgressEvent MutationObserver DOMParser OffscreenCanvas ImageBitmap createImageBitmap '+
  'fetch Headers Request Response Blob URL URLSearchParams TextEncoder TextDecoder AbortController AbortSignal AudioContext structuredClone crypto Path2D alert').split(/\s+/);

export async function buildPlay(common,src,hostCode){
  const resolveDir=path.join(src,'src');
  const entries={
    gameplay:'import "../../platform/turnstile-stub.js"; import {setChineseText} from "./data/chinese-text.js";'+
      'export async function start(){setChineseText(window.readChineseText());return require("./game.js").launch();}',
    // These build-only entries give esbuild boundaries for shared modules. Their
    // lazy references preserve initialization order and are never shipped.
    combat:'export function include(){require("./combat/boss-encounters.js");require("./combat/move-effects.js");}',
    presentation:'export function include(){require("./data/config.js");require("./ui/zixing-ui.js");require("./world/paper-world.js");'+
      'require("./effects/stylized-skill-vfx.js");require("./ui/customize.js");require("./world/room-monsters.js");'+
      'require("./actors/actor-metrics.js");require("./actors/hero-poses.js");require("./effects/facility-clock.js");}',
    three:'export function include(){require("./vendor/three-DmSYIDKK.js");}'
  };
  const prefix='play-entry:';
  const entryPlugin={name:'play-entries',setup(build){
    build.onResolve({filter:/^play-entry:/},args=>({path:args.path.slice(prefix.length),namespace:'play-entry'}));
    build.onLoad({filter:/.*/,namespace:'play-entry'},args=>({contents:entries[args.path],resolveDir}));
  }};
  const result=await esbuild.build({...common,format:'esm',splitting:true,write:false,metafile:true,
    plugins:[entryPlugin,...common.plugins],outdir:'play',entryPoints:Object.fromEntries(Object.keys(entries).map(key=>[key,prefix+key])),
    define:{'globalThis.__ZILING_COMPILED_STYLES__':'true',innerWidth:'window.innerWidth',innerHeight:'window.innerHeight',devicePixelRatio:'window.devicePixelRatio'}});

  const outputs=result.metafile.outputs,content=new Map(result.outputFiles.map(file=>[path.resolve(file.path),file.text]));
  const files=new Map(),names=new Map();
  function emit(key){
    if(names.has(key))return names.get(key);
    const meta=outputs[key];
    const sources=Object.keys(meta.inputs);
    const groups=[
      [/\/three-[^/]+\.js$/,'three'],[/\/boss-encounters\.js$/,'combat'],
      [/\/config\.js$/,'game-data'],[/\/zixing-ui\.js$/,'presentation']
    ];
    const group=groups.find(([pattern])=>sources.some(source=>pattern.test(source)));
    const name=meta.entryPoint==='play-entry:gameplay'?'gameplay.js':group?group[1]+'.js':path.basename(key);
    if([...names.values()].includes(name))throw Error('Duplicate play module name: '+name);
    names.set(key,name);
    let code=content.get(path.resolve(key));
    const imports=parse(code,{ecmaVersion:'latest',sourceType:'module'}).body.filter(node=>node.source);
    const dependencies=new Set();
    for(const {source} of imports.reverse()){
      const target=path.posix.join(path.posix.dirname(key),source.value);
      const local='./'+emit(target);
      code=code.slice(0,source.start)+JSON.stringify(local)+code.slice(source.end);
      dependencies.add(local);
    }
    const cjs=esbuild.transformSync(code,{format:'cjs',minify:true,charset:common.charset,target:common.target,legalComments:common.legalComments}).code;
    // Native require loads a factory. Cache its exports per run so all chunks
    // see the same Three.js classes, translations and mutable game state.
    const resolve=[...dependencies].map(local=>'case '+JSON.stringify(local)+':return require('+JSON.stringify(local)+')(runtime);').join('\n');
    files.set(name,'module.exports=function(runtime){\nconst id='+JSON.stringify(name)+';\n'+
      'if(runtime.modules[id])return runtime.modules[id].exports;\nconst item=runtime.modules[id]={exports:{}};\n'+
      'const {'+bindings.join(',')+'}=runtime.environment;\n'+
      '(function(module,exports,require){\n'+cjs+'\n})(item,item.exports,function(specifier){switch(specifier){'+resolve+
      '}throw Error("Unknown play module: "+specifier);});\nreturn item.exports;\n};\n');
    return name;
  }
  emit(Object.keys(outputs).find(key=>outputs[key].entryPoint==='play-entry:gameplay'));
  files.set('host.js','const root=typeof globalThis==="object"?globalThis:GameGlobal;\nmodule.exports=function(host){\nconst globalThis=root;\n'+
    'const module={exports:{}};\n'+hostCode+'\nreturn module.exports.setup(host);\n};\n');
  return {files,metafile:result.metafile,shippedOutputs:[...names.keys()]};
}
