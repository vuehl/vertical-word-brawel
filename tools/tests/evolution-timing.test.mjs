import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import reference from '../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};
import {EVOLUTION_DURATION,EVOLUTION_REVEAL,evolutionFrame,evolutionTile,evolutionPose} from '../../source/src/effects/evolution-timing.js';

test('evolution follows every original GIF exposure, including its 20 ms charge frames',async()=>{
  const gif=await sharp(fileURLToPath(new URL('../../resources/art/upgrade/进化全屏.gif',import.meta.url)),{animated:true}).metadata();
  let seconds=0;
  for(let frame=0;frame<gif.pages;frame++){
    assert.ok(Math.abs(reference.times[frame]-seconds)<1e-8);
    assert.equal(evolutionFrame(seconds),frame);
    assert.equal(evolutionFrame(seconds+gif.delay[frame]/2000),frame);
    seconds+=gif.delay[frame]/1000;
  }
  assert.equal(EVOLUTION_DURATION,6.2);assert.equal(EVOLUTION_REVEAL,4.4);
  assert.ok(Math.abs(seconds-EVOLUTION_DURATION)<1e-8);
});

test('dark charge, bright reveal and authored landing remain separate phases',()=>{
  const dark=reference.exposures[evolutionTile(123)],burst=reference.exposures[evolutionTile(126)];
  assert.equal(reference.sourceFrames[evolutionTile(123)],123);
  assert.ok(dark[0]<.36&&dark[1]<.01,'The last charge frame darkens the entire view');
  assert.ok(burst[1]>.6&&burst[2]>.6,'The reveal washes the view with warm light');
  assert.equal(evolutionPose(0).flash,0);
  assert.equal(evolutionPose(4.24).flash,1);
  assert.equal(evolutionPose(4.8).flash,0);
  assert.ok(evolutionPose(4.8).lift>=45&&evolutionPose(4.8).lift<=52);
  assert.equal(evolutionTile(150),-1,'No frozen light frame after the source effect has faded');
});
