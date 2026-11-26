import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyOpening,openingFilm} from '../../platform/journey-opening.mjs';

function fixture({stall=false,reject=false}={}){
  let now=0,removed=0,read=0;
  const film=createJourneyOpening(null,{createSource:()=>({
    on(){},start:()=>reject?Promise.reject(Error('broken movie')):Promise.resolve(),
    remove(){removed++;return Promise.resolve();},
    getFrameData(){read++;return stall?null:{width:1,height:1,data:new Uint8Array([80,60,40,255]).buffer};},
  }),now:()=>now});
  return {film,step(ms=1000/24){now+=ms;return film.layer(390,844);},
    get removed(){return removed;},get read(){return read;}};
}

test('movie holds its last frame until reveal, then dissolves and frees the decoder',async()=>{
  const f=fixture();
  for(let i=0;i<openingFilm.frames+2;i++)f.step();
  await f.film.finished;
  assert.equal(f.film.frameCount,169);assert.equal(f.removed,1);
  assert.equal(f.step(5000).opacity,1);
  const revealed=f.film.reveal();
  assert.equal(f.step().opacity,1);
  for(let i=0;i<4;i++)f.step(100);
  assert.equal(f.step(0).opacity,.5);
  for(let i=0;i<4;i++)f.step(100);
  await revealed;
  assert.equal(f.film.active,false);assert.equal(f.removed,1);
});

test('background time neither consumes frames nor skips the dissolve',async()=>{
  const f=fixture();f.step();const before=f.film.frameCount;
  f.film.pause();f.step(60000);
  assert.equal(f.film.frameCount,before);
  f.film.dispose();await f.film.finished;
});

test('stalled or failed decoding cannot trap entry behind a movie',async()=>{
  const stalled=fixture({stall:true});
  for(let i=0;i<83;i++)stalled.step(100);
  assert.match((await stalled.film.finished).error.message,/超时/);await stalled.film.reveal();
  assert.match((await stalled.film.ready).error.message,/超时/);
  assert.equal(stalled.film.active,false);assert.equal(stalled.removed,1);
  const failed=fixture({reject:true});assert.match((await failed.film.finished).error.message,/broken movie/);await failed.film.reveal();
  assert.match((await failed.film.ready).error.message,/broken movie/);
  assert.equal(failed.film.active,false);assert.equal(failed.removed,1);
});

test('aborted entry resolves pending work and cleans up exactly once',async()=>{
  const f=fixture();f.step();f.film.dispose();f.film.dispose();
  await f.film.finished;await f.film.reveal();
  assert.equal(f.removed,1);assert.equal(f.step(),null);
});

test('startup can prepare the first frame without playing behind the progress bar',()=>{
  let time=0;
  const film=createJourneyOpening(null,{createSource:()=>({on(){},start(){},remove(){},
    getFrameData:()=>({width:1,height:1,data:new Uint8Array(4).buffer})}),paused:true,now:()=>time});
  film.layer(390,844);
  for(let i=0;i<20;i++){time+=100;film.layer(390,844);}
  assert.equal(film.frameCount,1);
  film.resume();film.layer(390,844);time+=50;film.layer(390,844);
  assert.equal(film.frameCount,2);film.dispose();
});

test('boot waits for a decoded frame, and a cancelled preload releases the wait',async()=>{
  let loaded=false,time=0,ready=false;
  const film=createJourneyOpening(null,{paused:true,now:()=>time,createSource:()=>({
    on(){},start(){},remove(){},
    getFrameData:()=>loaded?{width:1,height:1,data:new Uint8Array(4).buffer}:null,
  })});
  film.ready.then(()=>{ready=true;});
  film.layer(390,844);await Promise.resolve();assert.equal(ready,false);
  loaded=true;time+=50;film.layer(390,844);await film.ready;
  assert.equal(ready,true);assert.equal(film.frameCount,1);
  time+=2000;film.layer(390,844);assert.equal(film.frameCount,1);
  film.dispose();
  const cancelled=fixture({stall:true});cancelled.film.dispose();await cancelled.film.ready;
  assert.equal(cancelled.film.active,false);
});
