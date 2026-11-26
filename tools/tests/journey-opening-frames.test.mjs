import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpeningFrames} from '../../platform/journey-opening-frames.mjs';

function fixture(auto=true){
  const draws=[],images=[],canvas={getContext:()=>({drawImage:(...args)=>draws.push(args)})};
  const source=createOpeningFrames({createCanvas:()=>canvas,createImage:()=>{
    const image={set src(url){this.url=url;if(auto)this.onload();}};images.push(image);return image;
  }});
  return {source,draws,images,canvas};
}

test('all 169 original frames use the correct cell, in order, without a video API',()=>{
  const f=fixture();let ended=0;f.source.on('ended',()=>ended++);f.source.start();
  assert.equal(f.images.length,2,'Only the first two pages are prefetched');
  for(let index=0;index<169;index++){
    const frame=f.source.getFrameData(),cell=index%6;
    assert.equal(frame.canvas,f.canvas);
    assert.deepEqual(f.draws.at(-1).slice(1),[cell%3*390,Math.floor(cell/3)*844,390,844,0,0,390,844]);
    assert.equal(f.draws.at(-1)[0].url,'play/opening/p'+String(Math.floor(index/6)).padStart(2,'0')+'.webp');
    assert.ok(f.images.filter(image=>image.onload).length<=2,'Consumed pages release their callbacks/references');
  }
  assert.equal(ended,1);assert.equal(f.images.length,29);assert.equal(f.source.getFrameData(),null);
  f.source.remove();assert.ok(f.images.every(image=>!image.onload&&!image.onerror));
});

test('a slow image holds the current frame, and failed image loading requests a retry',()=>{
  const f=fixture(false);f.source.start();
  assert.equal(f.source.getFrameData(),null);
  f.images[0].onload();
  for(let i=0;i<6;i++)assert.ok(f.source.getFrameData());
  assert.equal(f.source.getFrameData(),null);
  f.images[1].onerror();assert.throws(()=>f.source.getFrameData(),/读取失败/);
  f.source.remove();assert.equal(f.source.getFrameData(),null);
});
