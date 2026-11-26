import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import atlas from '../../resources/public/assets/vfx/air-slash-reference.json' with {type:'json'};
import {windFrameAt} from '../../source/src/effects/wind-frame-time.js';
import {castWindAirSlash} from '../../source/src/combat/wind-air-slash.js';

test('Air Slash retains the supplied recording, every exposure, and its exact ending',async()=>{
  const source=new URL('../../resources/art/air-slash-reference/空气斩.gif',import.meta.url);
  assert.equal(createHash('sha256').update(fs.readFileSync(source)).digest('hex'),atlas.sha256);
  const metadata=await sharp(fileURLToPath(source),{animated:true}).metadata();
  assert.equal(metadata.pages,50);assert.deepEqual(atlas.sourceSize,[390,844]);
  assert.deepEqual(atlas.pages,Array.from({length:21},(_,i)=>7+i));
  assert.equal(atlas.sourceStartMs,140);
  assert.deepEqual(atlas.times,Array.from({length:22},(_,i)=>i*20));
  for(let i=0;i<21;i++)assert.equal(windFrameAt(atlas,i*.02),i);
  assert.equal(windFrameAt(atlas,.42),-1);
  const {data,info}=await sharp(fileURLToPath(new URL('../../resources/public/assets/vfx/air-slash-reference.png',import.meta.url)))
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,atlas.tile*atlas.columns);assert.equal(info.height,atlas.tile*atlas.rows);
  assert.ok(info.width<=2048&&info.height<=2048);
  const coverage=Array.from({length:atlas.count},()=>0);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    coverage[Math.floor(y/atlas.tile)*atlas.columns+Math.floor(x/atlas.tile)]+=data[(y*info.width+x)*4+3];
  }
  assert.equal(coverage[0],0,'Original pre-release exposure stays empty');
  assert.ok(coverage.slice(1).every(value=>value>500000),'The blade keeps its broad wake until the last exposure');
});

test('Air Slash deals the same swept single hits with visuals hidden and across frame rates',()=>{
  for(const hz of [15,30,60,120])for(const visible of [true,false]){
    const points=[[0,-3],[-2.8,-7],[2.8,-14],[7,-7],[0,4],[0,-23]];
    const hits=[],enemies={x:points.map(p=>p[0]),z:points.map(p=>p[1]),gen:points.map(()=>1),radius:points.map(()=>.55),within:()=>points.map((_,i)=>i)};
    let advance,finish,wave,duration;
    const run={player:{pos:{x:0,y:0,z:0},renderScale:1},enemies,skinLook:'original',camYaw:0,
      aimDir:()=>({x:0,z:-1}),terrain:{surface:()=>0},
      vfx:{crafted:{allowed:()=>visible,windMoveArt:()=>({play:value=>{wave=value;}})}},
      animate(seconds,callback,done){duration=seconds;advance=callback;finish=done;},
      combat:{hit:id=>hits.push(id)}};
    castWindAirSlash(run,6,.42,10,{});
    run.player.pos.x=20;
    for(let step=1;step<=Math.ceil(duration*hz);step++)advance(Math.min(1,step/hz/duration));
    finish();
    assert.deepEqual(hits,[0,1,2]);
    if(visible){assert.equal(wave.done,true);assert.equal(wave.x,0);assert.ok(Math.abs(wave.z+17.8)<1e-8);}
    else assert.equal(wave,undefined);
  }
});
