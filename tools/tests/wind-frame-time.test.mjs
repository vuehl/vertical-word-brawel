import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {windFrameAt} from '../../source/src/effects/wind-frame-time.js';

test('unequal GIF exposures use their own boundaries, including final disappearance',()=>{
  const clip={times:[0,70,130,200,220]};
  for(const [seconds,expected] of [[0,0],[.069,0],[.07,1],[.129,1],[.13,2],[.2,3],[.219,3],[.22,-1],[1,-1]])
    assert.equal(windFrameAt(clip,seconds),expected);
  assert.equal(windFrameAt(clip,.22,true),0);
  assert.equal(windFrameAt(clip,.29,true),1);
});
test('delayed first exposure remains invisible and frame selection is independent of draw rate',()=>{
  const clip={times:[50,80,100,170,230]};
  assert.equal(windFrameAt(clip,0),-1);
  for(const hz of [30,60,120]){
    let elapsed=0;for(let i=0;i<hz/10;i++)elapsed+=1/hz;
    assert.equal(windFrameAt(clip,elapsed),2);
  }
});
test('authored wind atlases fit texture limits and keep every exposure of the repaired sequences',()=>{
  const read=name=>JSON.parse(fs.readFileSync(new URL('../../resources/public/assets/vfx/'+name+'.json',import.meta.url)));
  const skill=read('wind-skills'),moves=read('wind-moves'),vortex=read('wind-vortex'),replacements=read('wind-replacements');
  for(const atlas of [skill,moves,vortex,replacements]){
    assert.ok(atlas.columns*atlas.tile<=4096&&atlas.rows*atlas.tile<=4096);
  }
  for(const clip of [skill.clips.wingLaunch,skill.clips.wingHit,skill.clips.quickHalo,skill.clips.tackleRush,skill.clips.attackLoops,moves.twister,vortex,...Object.values(replacements.clips)]){
    assert.equal(clip.times.length,clip.count+1);
    assert.equal(clip.pages.length,clip.count);
    assert.match(clip.sha256,/^[a-f0-9]{64}$/);
    clip.pages.forEach((page,i)=>{
      if(i)assert.equal(page,clip.pages[i-1]+1);
      assert.ok(clip.times[i+1]>clip.times[i]);
      assert.equal(windFrameAt(clip,(clip.times[i]+.1)/1000),i);
    });
  }
  assert.ok(new Set(vortex.times.slice(1).map((time,i)=>time-vortex.times[i])).size>1);
  assert.equal(skill.clips.wingHit.times.at(-1),1050);
});
