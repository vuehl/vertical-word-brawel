import {createHash} from 'node:crypto';
import path from 'node:path';
import {brotliCompressSync,constants} from 'node:zlib';
import {encodeResource} from './resource-filters.mjs';

const json = value => Buffer.from(JSON.stringify(value));

// Group like files so Brotli can share repeated bytes across asset boundaries.
export function packStream(entries,pack,filters={}) {
  const names=Object.keys(entries).sort((a,b)=>path.extname(a).localeCompare(path.extname(b))||a.localeCompare(b));
  const files=[],payloads=[];
  for(const name of names){
    let bytes=entries[name], filter=filters[name];
    if(pack==='text'&&name.endsWith('.wav')&&isMonoPcm16(bytes))filter=['pcm16'];
    if(filter)bytes=encodeResource(bytes,filter);
    files.push(filter?[name,bytes.length,filter]:[name,bytes.length]);
    payloads.push(bytes);
  }
  const manifest=json(files);
  const header=Buffer.alloc(4);
  header.writeUInt32LE(manifest.length);
  const raw=Buffer.concat([header,manifest,...payloads]);
  const bytes=brotliCompressSync(raw,{params:{
    [constants.BROTLI_PARAM_QUALITY]:pack==='art'?10:11,
    [constants.BROTLI_PARAM_LGWIN]:pack==='art'?20:pack==='world'?23:22,
    [constants.BROTLI_PARAM_SIZE_HINT]:raw.length
  }});
  return {bytes,rawSize:raw.length};
}

// Only the canonical 44-byte mono PCM header has this exact sample layout.
// Extended WAV headers and other audio formats travel as ordinary files.
function isMonoPcm16(bytes) {
  const b=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.length);
  return b.length>=44&&b.length%2===0&&b.toString('ascii',0,4)==='RIFF'&&
    b.toString('ascii',8,16)==='WAVEfmt '&&b.readUInt32LE(16)===16&&b.readUInt16LE(20)===1&&
    b.readUInt16LE(22)===1&&b.readUInt16LE(32)===2&&b.readUInt16LE(34)===16&&
    b.toString('ascii',36,40)==='data'&&b.readUInt32LE(40)===b.length-44;
}

// Store each GLB buffer view once, including the embedded textures shared
// between models. The recipe retains headers, padding and byte order.
export function packModels(entries) {
  const chunks=[],known=new Map(),recipes={};
  const indexRanges=new Map();
  let length=0;
  for(const [file,raw] of Object.entries(entries)){
    if(!file.endsWith('.glb'))continue;
    const bytes=Buffer.from(raw);
    if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid GLB '+file);
    const end=20+bytes.readUInt32LE(12),bin=end+8;
    const gltf=JSON.parse(bytes.toString('utf8',20,end));
    const indexViews=new Map();
    for(const mesh of gltf.meshes||[])for(const primitive of mesh.primitives){
      const accessor=gltf.accessors?.[primitive.indices];
      if(accessor?.componentType!==5123||accessor.type!=='SCALAR'||accessor.byteOffset||accessor.sparse)continue;
      const view=gltf.bufferViews[accessor.bufferView];
      if(view&&!view.byteStride&&view.byteLength===2*accessor.count){
        indexViews.set(bin+(view.byteOffset||0),accessor.count);
      }
    }
    const cuts=new Set([0,bin,bytes.length]);
    for(const view of gltf.bufferViews||[]){
      const offset=bin+(view.byteOffset||0);cuts.add(offset);cuts.add(offset+view.byteLength);
    }
    const seq=[],bounds=[...cuts].sort((a,b)=>a-b);
    for(let i=1;i<bounds.length;i++){
      const part=bytes.subarray(bounds[i-1],bounds[i]);
      const key=createHash('sha256').update(part).digest('hex');
      if(!known.has(key)){
        known.set(key,[length,part.length]);chunks.push(part);length+=part.length;
      }
      const range=known.get(key);
      seq.push(range);
      const count=indexViews.get(bounds[i-1]);
      if(count&&2*count===part.length)indexRanges.set(range[0],count);
    }
    recipes[file]=seq;delete entries[file];
  }
  entries['model-parts.bin']=Buffer.concat(chunks);
  entries['model-map.json']=json(recipes);
  return [...indexRanges].sort(([a],[b])=>a-b);
}

export function packLocales(entries, index) {
  const keys=[],ids=new Map(),files={};
  for(const [logical,target] of Object.entries(index)){
    if(!logical.startsWith('locale/'))continue;
    const file=target.split('/')[1],words=JSON.parse(Buffer.from(entries[file]));
    const order=[],values=[];
    for(const [key,value] of Object.entries(words)){
      if(!ids.has(key)){ids.set(key,keys.length);keys.push(key);}
      order.push(ids.get(key));values.push(value);
    }
    files[file]=[order,values];delete entries[file];
  }
  entries['language-tables.json']=json([keys,files]);
}
