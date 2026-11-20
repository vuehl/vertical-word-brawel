import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createUIFrameCache} from '../platform/ui-cache.mjs';

function fixture(animated=false,staticArt=false){
  const counts={layouts:0,paints:0},cache=createUIFrameCache();
  const layout={refresh:()=>{counts.layouts++;return animated?[{tag:'canvas',el:{dataset:{static:String(staticArt)}},opacity:1,x:0,y:0,w:10,h:10,clip:{x:0,y:0,r:100,b:100}}]:[];}};
  return {cache,counts,draw:(now,state)=>cache.draw(now,state,layout,()=>counts.paints++)};
}
test('an unchanged menu reuses its layout and uploaded pixels',()=>{
  const f=fixture();for(let t=0;t<1000;t+=16)f.draw(t);
  assert.deepEqual(f.counts,{layouts:1,paints:1});
});
test('animated portraits repaint without rebuilding menu layout',()=>{
  const f=fixture(true);for(let t=0;t<=960;t+=16)f.draw(t);
  assert.deepEqual(f.counts,{layouts:1,paints:13});
});

test('static canvas artwork stays cached until explicitly invalidated',()=>{
  const f=fixture(true,true);for(let t=0;t<1000;t+=16)f.draw(t);
  assert.deepEqual(f.counts,{layouts:1,paints:1});
  f.cache.invalidate(false,true);f.draw(1000);
  assert.deepEqual(f.counts,{layouts:1,paints:2});
});
test('HUD mutations coalesce, while input and screen changes flush immediately',()=>{
  const f=fixture();f.draw(0,'play');
  for(let t=16;t<80;t+=16){f.cache.invalidate();f.draw(t,'play');}
  assert.equal(f.counts.layouts,1);
  f.draw(80,'play');assert.equal(f.counts.layouts,2);
  f.cache.invalidate(true,true);f.draw(81,'play');assert.equal(f.counts.layouts,3);
  f.draw(82,'paused');assert.equal(f.counts.layouts,4);
  f.cache.invalidate(false,true);f.draw(83,'paused');assert.deepEqual(f.counts,{layouts:4,paints:5});
});
