import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {brotliDecompressSync} from 'node:zlib';
import {unpackStream} from './build/resource-stream.mjs';

const root=path.resolve(import.meta.dirname,'..'),game=path.join(root,'minigame');
const index=createRequire(import.meta.url)(path.join(game,'assets.js'));
const {subpackages}=JSON.parse(fs.readFileSync(path.join(game,'game.json')));
const labels={main:'主包 · 启动与资源加载',play:'play · 玩法、界面与引擎',art:'art · 字灵、道具与特效',
  world:'world · 场景、模型与界面',text:'text · 字体、文字、数据与启动美术',wind:'wind · 按需风系特效',dragon_summon:'dragon_summon · 召唤动画'};
const category=file=>{
  const name=subpackages.find(p=>file===p.root||file.startsWith(p.root.replace(/\/$/,'')+'/'))?.name||'main';
  return labels[name]||name;
};
const totals={},physical=[];
for(const entry of fs.readdirSync(game,{recursive:true})){
  const stat=fs.statSync(path.join(game,entry));if(!stat.isFile())continue;
  const file=entry.split(path.sep).join('/'),group=category(file);
  totals[group]=(totals[group]||0)+stat.size;physical.push({file,bytes:stat.size,group});
}
const resources=[];
for(const pack of Object.keys(index.packs)){
  const reverse=new Map();
  for(const [key,ref] of Object.entries(index.files))if(ref.startsWith(pack+'/')){
    const name=ref.slice(pack.length+1).split('#')[0];if(!reverse.has(name))reverse.set(name,[]);reverse.get(name).push(key);
  }
  unpackStream(brotliDecompressSync(fs.readFileSync(path.join(game,index.packRoots[pack],'assets.bin'))),(file,data)=>{
    const models=file==='model-map.json'||file==='model-parts.bin';
    const keys=models?[...reverse].filter(([name])=>name.endsWith('.glb')).flatMap(([,keys])=>keys):reverse.get(file)||[];
    resources.push({pack,file,keys,unpackedBytes:data.length});
  });
}
const total=physical.reduce((sum,f)=>sum+f.bytes,0);
const groups=new Map();
for(const {pack,keys,unpackedBytes} of resources){
  const [key='']=keys;
  const group=key.startsWith('assets/')?key.split('/')[1]:
    key.startsWith('fonts/')?'fonts':key.startsWith('engine/')?'engine':
    key.startsWith('data/')?'data':key.startsWith('text/')?'text':'other';
  const id=pack+'/'+group;
  if(!groups.has(id))groups.set(id,{pack,group,keys:new Set(),entries:0,unpackedBytes:0});
  const row=groups.get(id);
  keys.forEach(key=>row.keys.add(key));row.entries++;row.unpackedBytes+=unpackedBytes;
}
const report={totalBytes:total,totalMiB:total/1048576,policyVersion:index.policyVersion,
  logicalResources:Object.keys(index.files).length,archiveEntries:resources.length,
  iconAtlases:Object.keys(index.iconFrames||{}).length,iconKeys:Object.values(index.files).filter(ref=>ref.includes('#')).length,
  // Category sizes are actual on-disk archive/code bytes. Inside an archive,
  // shared compression means raw file sizes are not additive packed sizes.
  categories:Object.entries(totals).map(([name,bytes])=>({name,bytes,MiB:bytes/1048576,percent:bytes/total*100})),
  assetGroups:[...groups.values()].map(({keys,...group})=>({...group,logicalResources:keys.size})).sort((a,b)=>b.unpackedBytes-a.unpackedBytes),
  resources:resources.sort((a,b)=>b.unpackedBytes-a.unpackedBytes),physical};
const dir=process.env.POKEBONK_QA||path.join(root,'验收');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'包体组成.json'),JSON.stringify(report,null,2)+'\n');
console.table(report.categories.map(c=>({组成:c.name,MiB:c.MiB.toFixed(2),占比:c.percent.toFixed(1)+'%',字节:c.bytes})));
console.log('Total:',report.totalMiB.toFixed(2),'MiB; report:',path.join(dir,'包体组成.json'));
