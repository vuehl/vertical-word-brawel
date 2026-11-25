import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import reference from '../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};
import {EVOLUTION_DURATION,EVOLUTION_REVEAL,EVOLUTION_LANDING,evolutionFrameTimes,evolutionFrame,evolutionTile,evolutionPose} from '../../source/src/effects/evolution-timing.js';

test('the 4.20 s evolution preserves all 171 GIF exposures in proportion',async()=>{
  const gif=await sharp(fileURLToPath(new URL('../../resources/art/upgrade/进化全屏.gif',import.meta.url)),{animated:true}).metadata();
  const scale=4.2/6.2;
  assert.equal(gif.pages,171);
  let seconds=0;
  for(let frame=0;frame<gif.pages;frame++){
    assert.ok(Math.abs(reference.times[frame]-seconds)<1e-8);
    const begin=seconds*scale,mid=(seconds+gif.delay[frame]/2000)*scale;
    assert.ok(Math.abs(evolutionFrameTimes[frame]-begin)<1e-8);
    assert.equal(evolutionFrame(begin),frame);
    assert.equal(evolutionFrame(mid),frame);
    const pose=evolutionPose(mid),next=Math.min(frame+1,gif.pages-1);
    assert.deepEqual(pose.glyph,reference.poses[frame]);
    assert.equal(pose.flash,reference.flashes[frame]);
    assert.ok(Math.abs(pose.lift-(reference.liftPixels[frame]+reference.liftPixels[next])/2)<1e-7);
    seconds+=gif.delay[frame]/1000;
  }
  assert.equal(EVOLUTION_DURATION,4.2);assert.ok(Math.abs(EVOLUTION_REVEAL-4.4*scale)<1e-8);
  assert.ok(Math.abs(seconds-EVOLUTION_DURATION-2)<1e-8);
  assert.ok(Math.abs(EVOLUTION_LANDING-5.28*scale)<1e-8);
  assert.equal(evolutionFrame(EVOLUTION_REVEAL-1e-5),125);
  assert.equal(evolutionFrame(EVOLUTION_REVEAL),126);
});

test('dark charge, bright reveal and authored landing remain separate phases',()=>{
  const dark=reference.exposures[evolutionTile(123)],burst=reference.exposures[evolutionTile(126)];
  assert.equal(reference.sourceFrames[evolutionTile(123)],123);
  assert.ok(dark[0]<.36&&dark[1]<.01,'The last charge frame darkens the entire view');
  assert.ok(burst[1]>.6&&burst[2]>.6,'The reveal washes the view with warm light');
  assert.equal(evolutionPose(0).flash,0);
  assert.equal(evolutionPose(evolutionFrameTimes[120]).flash,1);
  const raised=evolutionPose(evolutionFrameTimes[136]);
  assert.equal(raised.flash,0);
  assert.ok(raised.lift>=45&&raised.lift<=52);
  assert.equal(evolutionTile(150),-1,'No frozen light frame after the source effect has faded');
});

test('the character contracts on the recorded beats and compresses on landing',()=>{
  const pose=frame=>evolutionPose(evolutionFrameTimes[frame]).glyph;
  assert.equal(reference.poses.length,reference.times.length-1);
  for(const frame of [18,21,24,27]){
    assert.ok(pose(frame)[2]+.06<pose(frame+2)[2]);
    assert.equal(evolutionTile(frame+1),frame+1);
  }
  assert.ok(pose(148)[2]<.85&&pose(148)[1]>1.08);
  assert.deepEqual(pose(170).slice(1),[1,1]);
});
