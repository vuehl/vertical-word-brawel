import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {literalText} from '../build/font-text.mjs';
import {optimizeLosslessImage} from '../build/image-optimizer.mjs';
import {frameColourError,acceptableCaptureError} from '../build/capture-compression.mjs';

test('font collection preserves escaped strings and template labels without comment-only glyphs',()=>{
  const labels = literalText('// 注释魑魅不应打包\nconst x="\\u708e"; const y=`获得${x}，继续`; const z={胜利:"风"};');
  for(const char of '炎获得，继续胜利风') assert.ok(labels.includes(char),char);
  for(const char of '魑魅') assert.ok(!labels.includes(char),char);
});

test('capture compression rejects a damaged frame and any alpha change',()=>{
  const original=Buffer.from([100,150,200,255,100,150,200,255]);
  const copy=Buffer.from(original),rects=[[0,0,1,1],[1,0,1,1]];
  assert.ok(acceptableCaptureError(frameColourError(original,copy,2,rects)));
  copy[4]+=4;
  assert.ok(!acceptableCaptureError(frameColourError(original,copy,2,rects)));
  copy.set(original);copy[7]--;
  assert.ok(!acceptableCaptureError(frameColourError(original,copy,2,rects)));
});

test('image optimisation preserves dimensions, alpha and visible RGB, including faint strokes',async()=>{
  const width=64,height=64,pixels=Buffer.alloc(width*height*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=39;pixels[i+1]=87;pixels[i+2]=211;pixels[i+3]=(i/4)%256;}
  const source=await sharp(pixels,{raw:{width,height,channels:4}}).png().toBuffer();
  const result=await optimizeLosslessImage(source);
  assert.ok(result.bytes.length<=source.length);
  const {data,info}=await sharp(result.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,width);assert.equal(info.height,height);
  for(let i=0;i<data.length;i+=4){
    assert.equal(data[i+3],pixels[i+3]);
    if(pixels[i+3])assert.deepEqual(data.subarray(i,i+3),pixels.subarray(i,i+3));
  }
});
