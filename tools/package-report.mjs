import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {brotliDecompressSync} from 'node:zlib';
import {unpackStream} from './resource-stream.mjs';

const root=path.resolve(import.meta.dirname,'..'),game=path.join(root,'minigame');
const index=createRequire(import.meta.url)(path.join(game,'assets.js'));
const category=file=>file==='play.js'?'玩法与引擎代码':
  /^packs\/(sound|music_[^/]+)\//.test(file)?'背景音乐':
  file.startsWith('packs/text/')?'字体、文字、数据与许可':
  file.startsWith('packs/world/')?'场景与界面资源':
  file.startsWith('packs/art/')?'字灵与道具图片':'启动及资源加载代码';
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
    const name=ref.slice(pack.length+1);if(!reverse.has(name))reverse.set(name,[]);reverse.get(name).push(key);
  }
  unpackStream(brotliDecompressSync(fs.readFileSync(path.join(game,'packs',pack,'assets.br'))),(file,data)=>{
    resources.push({pack,file,keys:reverse.get(file)||[],unpackedBytes:data.length});
  });
}
const total=physical.reduce((sum,f)=>sum+f.bytes,0);
const report={totalBytes:total,totalMiB:total/1048576,policyVersion:index.policyVersion,
  // Category sizes are actual on-disk archive/code bytes. Inside an archive,
  // shared compression means raw file sizes are not additive packed sizes.
  categories:Object.entries(totals).map(([name,bytes])=>({name,bytes,MiB:bytes/1048576,percent:bytes/total*100})),
  resources:resources.sort((a,b)=>b.unpackedBytes-a.unpackedBytes),physical};
const dir=process.env.POKEBONK_QA||path.join(root,'验收');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'包体组成.json'),JSON.stringify(report,null,2)+'\n');
console.table(report.categories.map(c=>({组成:c.name,MiB:c.MiB.toFixed(2),占比:c.percent.toFixed(1)+'%',字节:c.bytes})));
console.log('Total:',report.totalMiB.toFixed(2),'MiB; report:',path.join(dir,'包体组成.json'));
