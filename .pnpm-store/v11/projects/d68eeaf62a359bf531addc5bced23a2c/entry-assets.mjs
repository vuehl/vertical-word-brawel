import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {mapRulesFor} from '../source/src/map-rules.js';
import {heroActionCatalog} from '../source/src/hero-action-catalog.js';
import {animatedPixelHeight,glyphBillboardSize} from '../source/src/hero-actions.js';
import {actorMetrics} from '../source/src/actor-metrics.js';
import {makeEntryIdle} from './hero-actions.mjs';

// Bake the static first frame from the same ordered tiles used by the battle.
// Keep the spawn area at source resolution and cover unusual window shapes
// with a small overview. The hero and UI still animate independently.
export async function writeEntryAssets(root,out){
  const source=path.join(root,'source');
  const {spawn}=mapRulesFor({id:'forest',zxStage:1});
  const layout=JSON.parse(await fs.readFile(path.join(source,'src/desk2d-layout.json')));
  const {width,height}=layout,parts=layout.layers.flatMap(layer=>layer.parts);
  const tiles=parts.map(([file,left,top])=>({input:path.join(source,'public/assets/env/desk2d',file),left,top}));
  const {data,info}=await sharp({create:{width,height,channels:4,background:'#000'}})
    .composite(tiles).raw().toBuffer({resolveWithObject:true});
  const map=()=>sharp(data,{raw:info}).removeAlpha();
  const left=Math.max(0,spawn.x-800),top=Math.max(0,spawn.z-740);
  const crop={left,top,width:Math.min(width,spawn.x+1000)-left,height:Math.min(height,spawn.z+760)-top};
  const layers=[['overview.jpg',0,0,width,height],['spawn.jpg',left,top,crop.width,crop.height]];
  const images={};
  function add(name,bytes){images[name]=bytes.toString('base64');}
  add('overview.jpg',await map().resize({width:1280,withoutEnlargement:true}).jpeg({quality:92}).toBuffer());
  add('spawn.jpg',await map().extract(crop).jpeg({quality:97,chromaSubsampling:'4:4:4'}).toBuffer());
  const {image,idle}=await makeEntryIdle(source);
  add('idle.png',image);
  const {foot,top:head}=actorMetrics[4];
  idle.worldSize=glyphBillboardSize((foot-head)*animatedPixelHeight)*heroActionCatalog[4].scale;
  for(const name of ['home.png','stages.png','ribbon.png'])add(name,await fs.readFile(path.join(source,'art/entry',name)));
  await fs.writeFile(path.join(out,'entry-data.js'),'module.exports='+JSON.stringify({spawn,layers,mapSize:[width,height],idle,images})+';\n');
  // Remove only loose copies produced by the previous entry packer.
  const oldDir=path.join(out,'entry');
  const obsolete=new Set([...parts.map(([name])=>name),'idle.png','home.png','stages.png','ribbon.png']);
  for(const name of await fs.readdir(oldDir).catch(e=>{if(e.code==='ENOENT')return [];throw e;})){
    if(obsolete.has(name))await fs.unlink(path.join(oldDir,name));
  }
}
