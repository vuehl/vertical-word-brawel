import test from 'node:test';
import assert from 'node:assert/strict';
import {createCapturePages} from '../../platform/capture-pages.mjs';

function fixture(auto=true){
  const images=[];
  const pages=createCapturePages({createImage(){
    const image={set src(url){this.url=url;if(url&&auto)this.onload?.();}};
    images.push(image);return image;
  }},id=>'p'+id+'.webp');
  return {pages,images};
}

test('long captures reuse at most three native images and clear every page after playback',async()=>{
  const f=fixture();await f.pages.fetch(0).promise;
  for(let id=0;id<60;id++){
    assert.equal(f.pages.prepare(id,59,id-1).url,'p'+id+'.webp');
    assert.ok(f.images.length<=3);
  }
  f.pages.idle();f.pages.idle();
  assert.ok(f.images.every(image=>image.url===''&&!image.onload&&!image.onerror));
  assert.equal(f.pages.prepare(0,59).url,'p0.webp','A later throw reloads released artwork');
  f.pages.idle();
});

test('slow decoding preserves the displayed image and bounds pending decoders across skipped pages',async()=>{
  const f=fixture(false),first=f.pages.fetch(0);f.images[0].onload();await first.promise;
  assert.equal(f.pages.prepare(0,60),f.images[0]);
  assert.equal(f.pages.prepare(10,60,0),null);
  assert.equal(f.images[0].url,'p0.webp');
  assert.equal(f.images.length,3);
  const stale=f.images.filter(image=>image.onload).map(image=>image.onload);
  assert.equal(f.pages.prepare(20,60,0),null);
  for(const callback of stale)callback();
  assert.equal(f.pages.prepare(20,60,0),null,'Stale callbacks cannot mark a recycled page ready');
  const current=f.images.find(image=>image.url==='p20.webp');current.onload();
  assert.equal(f.pages.prepare(20,60,0),current);
  assert.notEqual(f.images[0].url,'p0.webp');
  f.pages.idle();
});

test('cancelling in-flight images settles requests and ignores late native callbacks',async()=>{
  const f=fixture(false),record=f.pages.fetch(0),late=f.images[0].onload;
  f.pages.idle();assert.equal(await record.promise,false);late();
  assert.equal(record.image,null);assert.equal(record.ready,false);
  assert.equal(f.images[0].url,'');
  const next=f.pages.fetch(0);f.images.at(-1).onload();assert.equal(await next.promise,true);
  f.pages.idle();
});

test('failed native decoding releases its image and allows retry',async()=>{
  const f=fixture(false),record=f.pages.fetch(0);f.images[0].onerror();
  await assert.rejects(record.promise,/福袋帧图/);
  assert.equal(f.images[0].url,'');assert.equal(record.image,null);
  const next=f.pages.fetch(0);f.images[0].onload();await next.promise;
  assert.equal(f.images.length,1);f.pages.idle();
});
