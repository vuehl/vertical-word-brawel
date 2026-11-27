import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpeningFrames} from '../../platform/journey-opening-frames.mjs';

function fixture(auto=true){
  const images=[],resolved=[];
  const source=createOpeningFrames({createCanvas:()=>{throw Error('No intermediate canvas');},createImage:()=>{
    const image={width:1170,height:1688,set src(url){this.url=url;if(auto&&url)this.onload?.();}};images.push(image);return image;
  }},{pathFor:key=>{resolved.push(key);return '/userdata/pokebonk-assets/text-version/'+key.split('/').at(-1);}});
  return {source,images,resolved};
}

test('all 169 original frames use the correct cell, in order, without a video API',()=>{
  const f=fixture();let ended=0;f.source.on('ended',()=>ended++);f.source.start();
  assert.equal(f.images.length,2,'Only the first two pages are prefetched');
  for(let index=0;index<169;index++){
    const frame=f.source.getFrameData(),cell=index%6;
    assert.deepEqual(frame.sourceRect,{x:cell%3*390,y:Math.floor(cell/3)*844,width:390,height:844});
    assert.equal(frame.page,Math.floor(index/6));
    assert.equal(frame.image.url,'/userdata/pokebonk-assets/text-version/p'+String(Math.floor(index/6)).padStart(2,'0')+'.webp',
      'The native image must remain valid until the returned frame is presented, including each page boundary');
    assert.equal(f.images.length,2,'All 29 pages must reuse the same two native images without waiting for GC');
  }
  assert.equal(ended,1);assert.equal(f.source.getFrameData(),null);
  assert.deepEqual(f.resolved,Array.from({length:29},(_,page)=>'assets/opening/p'+String(page).padStart(2,'0')+'.webp'));
  f.source.remove();assert.ok(f.images.every(image=>!image.onload&&!image.onerror&&image.url===''));
});

test('a missing archive entry fails instead of requesting a loose package image',()=>{
  let imageCreated=false;
  const source=createOpeningFrames({createCanvas:()=>({getContext:()=>({})}),createImage:()=>{imageCreated=true;}},{pathFor:()=>null});
  assert.throws(()=>source.start(),/找不到开场动画图片 assets\/opening\/p00\.webp/);
  assert.equal(imageCreated,false);source.remove();
});

test('a slow image holds the current frame, and failed image loading requests a retry',()=>{
  const f=fixture(false);f.source.start();
  assert.equal(f.source.getFrameData(),null);
  f.images[0].onload();
  for(let i=0;i<6;i++)assert.ok(f.source.getFrameData());
  assert.equal(f.source.getFrameData(),null);
  assert.match(f.images[0].url,/p00\.webp$/,'A delayed next page must not invalidate the held native image');
  f.images[1].onerror();assert.throws(()=>f.source.getFrameData(),/读取失败/);
  f.source.remove();assert.equal(f.source.getFrameData(),null);
});

test('cancelling pending pages clears native sources and ignores late decoder callbacks',()=>{
  const f=fixture(false);f.source.start();
  const callbacks=f.images.flatMap(image=>[image.onload,image.onerror]);
  f.source.remove();f.source.remove();
  for(const callback of callbacks)callback();
  assert.ok(f.images.every(image=>image.url===''&&!image.onload&&!image.onerror));
  assert.equal(f.source.getFrameData(),null);
});

test('a missing later page also releases the recycled native image',()=>{
  const images=[];
  const source=createOpeningFrames({createCanvas:()=>({getContext:()=>({drawImage(){}})}),
    createImage(){const image={set src(url){this.url=url;if(url)this.onload?.();}};images.push(image);return image;}
  },{pathFor:key=>key.includes('p02')?null:key});
  source.start();for(let i=0;i<6;i++)source.getFrameData();
  assert.throws(()=>source.getFrameData(),/找不到开场/);source.remove();
  assert.ok(images.every(image=>image.url===''));
});

test('a page is recycled only after its last frame was handed to the renderer',()=>{
  const f=fixture();f.source.start();
  let last;
  for(let i=0;i<6;i++)last=f.source.getFrameData();
  assert.match(last.image.url,/p00\.webp$/);
  assert.equal(f.resolved.length,2);
  const next=f.source.getFrameData();
  assert.match(next.image.url,/p01\.webp$/);
  assert.match(last.image.url,/p02\.webp$/);
  f.source.remove();
});
