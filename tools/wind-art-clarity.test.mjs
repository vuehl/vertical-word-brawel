import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleWindInk,unmixWindInk,clarifyWindFrame} from './wind-art-clarity.mjs';

test('rotating a pale stroke does not interpolate transparent black into its colour',()=>{
  const ink=sampleWindInk(.5,0,x=>x<=0?[220,240,255,255]:[0,0,0,0]);
  assert.deepEqual(ink,[220,240,255,128]);
  assert.equal(sampleWindInk(3,3,()=>undefined),undefined);
});

test('extracted transparency recomposes to the observed GIF colour on its original paper',()=>{
  for(const rgb of [[210,230,250],[95,187,160],[245,211,135],[158,164,178]]){
    const paper=[181,161,125],ink=unmixWindInk(rgb,paper,210),a=ink[3]/255;
    for(let c=0;c<3;c++)assert.ok(Math.abs(ink[c]*a+paper[c]*(1-a)-rgb[c])<1.5);
  }
});

test('clarity preserves empty frames, constant coverage and the visible footprint',()=>{
  assert.deepEqual(clarifyWindFrame(Buffer.alloc(8*8*4),8,8),Buffer.alloc(8*8*4));
  const source=Buffer.alloc(12*12*4);
  for(let y=3;y<=8;y++)for(let x=3;x<=8;x++)source.set([100,180,230,160],(y*12+x)*4);
  const output=clarifyWindFrame(source,12,12);
  assert.deepEqual([...output.subarray((5*12+5)*4,(5*12+5)*4+4)],[100,180,230,160]);
  for(let k=3;k<source.length;k+=4)if(!source[k])assert.equal(output[k],0);
  assert.equal(output[(5*12+2)*4+3],0);
});

test('colour precision reduction stays within one display level after compositing',()=>{
  for(const alpha of [3,8,32,64,128,200,255])for(let value=0;value<256;value++){
    const raw=Buffer.alloc(3*3*4);
    for(let k=0;k<raw.length;k+=4)raw.set([value,255-value,value,alpha],k);
    const out=clarifyWindFrame(raw,3,3,{detail:0,edge:0});
    assert.equal(out[19],alpha);
    for(let c=0;c<3;c++)assert.ok(Math.abs(raw[16+c]-out[16+c])*alpha/255<=1.000001);
  }
});
