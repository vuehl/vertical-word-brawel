import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from 'linkedom/worker';
import {installSurfaces} from '../platform/surfaces.mjs';
import {paint} from '../platform/paint.mjs';

function fixture(t,resolvePath){
  const previous=globalThis.wx,images=[],requests=[],draws=[];
  const context=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(obj,key)=>obj[key]??(()=>{})});
  globalThis.wx={createImage(){const image={width:40,height:32};images.push(image);return image;},
    createOffscreenCanvas:()=>({width:1,height:1,getContext:()=>context})};
  t.after(()=>{globalThis.wx=previous;});
  const {document:doc}=D.parseHTML('<html><body><canvas id="game"></canvas></body></html>');
  const view={x:0,y:0,w:100,h:100,width:100,height:100};
  const api=installSurfaces(D,doc,{canvas:{},files:{resolvePath:src=>{
    requests.push(src);return resolvePath?resolvePath(src):Promise.resolve('/local/'+src);
  }}},view);
  const draw=(img,options={})=>paint({context},[{el:img,tag:'img',x:0,y:0,w:32,h:32,
    opacity:1,s:{},clip:{x:0,y:0,r:100,b:100},...options}],view,1);
  return {doc,images,requests,draws,draw,...api};
}

test('unused, transparent and clipped UI images never request or decode files',async t=>{
  const f=fixture(t),img=f.doc.createElement('img');img.src='portrait.png';
  f.draw(img);assert.equal(f.images.length,0,'Detached cards must stay unloaded');
  f.doc.body.append(img);f.draw(img,{opacity:0});f.draw(img,{x:110});
  assert.deepEqual(f.requests,[]);assert.equal(f.images.length,0);
  f.draw(img);f.draw(img);
  assert.deepEqual(f.requests,['portrait.png']);assert.equal(f.images.length,1,'Repeated frames coalesce');
  await Promise.resolve();assert.equal(f.images[0].src,'/local/portrait.png');
  f.images[0].onload();f.draw(img);
  assert.ok(img.complete);assert.equal(img.naturalWidth,40);assert.equal(f.draws.length,1);
  assert.equal(f.draws[0][0],f.images[0],'Visible pictures use the decoded native image');
});

test('standalone Image loads eagerly for atlases and WebGL textures',async t=>{
  const f=fixture(t),img=new f.Image();let loaded=false;
  img.onload=()=>{loaded=true;};img.src='atlas.png';
  assert.deepEqual(f.requests,['atlas.png']);assert.equal(f.images.length,1);
  await Promise.resolve();f.images[0].onload();
  assert.ok(loaded&&img.complete);assert.equal(img.naturalHeight,32);
});

test('replaced image sources discard unused work and ignore stale async loads',async t=>{
  const pending=new Map(),f=fixture(t,src=>new Promise(resolve=>pending.set(src,resolve)));
  const img=f.doc.createElement('img');img.src='unused.png';img.src='first.png';f.doc.body.append(img);f.draw(img);
  const stale=f.images[0].onload;img.src='second.png';f.draw(img);
  assert.deepEqual(f.requests,['first.png','second.png']);
  pending.get('first.png')('/local/first.png');pending.get('second.png')('/local/second.png');await Promise.resolve();
  assert.equal(f.images[0].src,undefined);assert.equal(f.images[1].src,'/local/second.png');
  stale();assert.equal(img.complete,false);f.images[1].onload();assert.equal(img.complete,true);
  img.src='';f.draw(img);assert.equal(img._surface,null);assert.equal(f.images.length,2);
});

test('visible image errors can switch to a fallback without loading hidden replacements',async t=>{
  const f=fixture(t),img=f.doc.createElement('img');f.doc.body.append(img);
  img.onerror=()=>{img.src='fallback.png';};img.src='missing.png';f.draw(img);await Promise.resolve();
  f.images[0].onerror();assert.deepEqual(f.requests,['missing.png']);
  f.draw(img,{x:110});assert.equal(f.images.length,1);
  f.draw(img);await Promise.resolve();f.images[1].onload();
  assert.deepEqual(f.requests,['missing.png','fallback.png']);assert.ok(img.complete);
});
