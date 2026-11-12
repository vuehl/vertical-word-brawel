// Read-only comparison against the currently published first-party game bundle.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parse} from '../source/tools/vendor/acorn.mjs';
const root=path.resolve(import.meta.dirname,'..'),origin='https://pokebonk.com/';
const read=async url=>{const res=await fetch(url);if(!res.ok)throw Error(url+': '+res.status);return res.text();};
const cached=process.argv.indexOf('--cached');
let url,published,configUrl,publishedConfig;
if(cached>=0){
  url='https://pokebonk.com/assets/menus-DqU5mYee-mw88813m.js';published=fs.readFileSync(process.argv[cached+1],'utf8');
  configUrl='https://pokebonk.com/assets/defineProperty-Cvp-y8z_-mw88813m.js';publishedConfig=fs.readFileSync(path.join(path.dirname(process.argv[cached+1]),'config.js'),'utf8');
}
else{
  const html=await read(origin),entry=new URL(html.match(/type="module" crossorigin src="([^"]+)"/)[1],origin).href;
  const boot=await read(entry),menu=boot.match(/menus-[\w-]+\.js/)[0];url=new URL('assets/'+menu,origin).href;published=await read(url);
  configUrl=new URL('assets/'+(boot.match(/defineProperty-[\w-]+\.js/)??published.match(/defineProperty-[\w-]+\.js/))[0],origin).href;
  publishedConfig=await read(configUrl);
}
const local=fs.readFileSync(path.join(root,'source/src/game.js'),'utf8');
function visit(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(child=>visit(child,fn));else if(value&&typeof value==='object')visit(value,fn);}}
const name=node=>node?.name??node?.value;
function find(source,first){
  let result;visit(parse(source,{ecmaVersion:'latest',sourceType:'module'}),node=>{
    if(node.type!=='ObjectExpression')return;
    const names=node.properties.find(p=>name(p.key)==='names')?.value;
    const firstName=names?.elements?.[0]?.arguments?.[0]?.quasis?.[0]?.value?.cooked;
    if(firstName===first)result=node;
  });if(!result)throw Error('Missing '+first);return result;
}
// Ignore compiler renaming; retain every operator, literal, argument and branch.
function structure(node){
  if(Array.isArray(node))return node.map(structure);
  if(!node||typeof node!=='object')return node;
  return Object.fromEntries(Object.entries(node).filter(([k])=>!['start','end','raw'].includes(k)&&!(node.type==='Identifier'&&k==='name')).map(([k,v])=>[k,structure(v)]));
}
const summaries=[];
for(const [id,first] of [[4,'Llamarada Ascendente'],[16,'Remolino'],[58,'Carga Leal'],[132,'Copia Total']]){
  const compatible=local.replaceAll('if (t.state !== `play` && t.state !== `dead`) return;','if (!t.worldGoes) return;');
  const a=find(compatible,first),b=find(published,first),field=(n,key)=>n.properties.find(p=>name(p.key)===key)?.value;
  const sameCast=JSON.stringify(structure(field(a,'cast')))===JSON.stringify(structure(field(b,'cast')));
  const sameDurations=JSON.stringify(structure(field(a,'dur')))===JSON.stringify(structure(field(b,'dur')));
  summaries.push({id,first,sameCast,sameDurations});
}
const rosterFields=source=>{
  const fields={};visit(parse(source,{ecmaVersion:'latest',sourceType:'module'}),node=>{
    if(node.type!=='ObjectExpression')return;
    const id=node.properties.find(p=>name(p.key)==='id')?.value?.value;
    const kit=node.properties.find(p=>name(p.key)==='kit')?.value,passive=node.properties.find(p=>name(p.key)==='passive')?.value;
    if([4,16,58,132].includes(id)&&kit&&passive)fields[id]={kit:structure(kit),passive:structure(passive)};
  });return fields;
};
const sourceRoster=rosterFields(fs.readFileSync(path.join(root,'source/src/config.js'),'utf8')),publishedRoster=rosterFields(publishedConfig);
const kits=[4,16,58,132].map(id=>({id,sameKitAndPassive:!!sourceRoster[id]&&JSON.stringify(sourceRoster[id])===JSON.stringify(publishedRoster[id])}));
const report={checkedAt:new Date().toISOString(),site:origin,bundle:url,sha256:createHash('sha256').update(published).digest('hex'),comparison:'AST structure, all operators/literals/branches; compiler identifier names excluded. Single-player world-progress guard normalized: official worldGoes also permits cooperative modal/paused states; this edition is single-player.',summaries,kits};
report.configBundle=configUrl;report.configSha256=createHash('sha256').update(publishedConfig).digest('hex');
const out=path.join(root,'验收/新初始角色-20261109');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'官网技能核对.json'),JSON.stringify(report,null,2));
console.log(report);
if(summaries.some(s=>!s.sameCast||!s.sameDurations)||kits.some(s=>!s.sameKitAndPassive))process.exitCode=1;
