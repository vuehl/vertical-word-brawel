import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {heroActionCatalog} from '../source/src/hero-action-catalog.js';
import {heroActionFrame,playerHeroAction} from '../source/src/hero-actions.js';
import {loadedHeroRig,prepareHeroStrokes} from '../source/src/hero-poses.js';
import {starterWords} from '../source/src/starter-characters.js';

const enabled=[4,5,6,16,17,18,58,59];
const sourceMotion=id=>{
  const name=starterWords[id]+'_待机行走死亡_优化';
  return JSON.parse(fs.readFileSync(new URL('../source/art/hero-actions/'+id+'/'+name+'.json',import.meta.url)));
};

test('all playable authored frames are packed and the hidden clips stay in source',async()=>{
  assert.deepEqual(Object.keys(heroActionCatalog).map(Number),enabled);
  assert.deepEqual(Object.keys(sourceMotion(132).animations),['idle','walk','faint']);
  assert.equal(loadedHeroRig(132),undefined);
  assert.equal(prepareHeroStrokes(132),undefined);
  for(const id of enabled){
    const {columns,rows,clips}=heroActionCatalog[id],source=sourceMotion(id);
    const png=new URL('../source/public/assets/glyphs/hero-actions/'+id+'.png',import.meta.url);
    const {data,info:{width,height}}=await sharp(fs.readFileSync(png)).extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
    const size=width/columns;
    assert.equal(size,height/rows);
    for(const [action,{first,count,fps,loop}] of Object.entries(clips)){
      assert.equal(count,source.animations[action].frames.length,id+' '+action);
      assert.equal(fps,source.animations[action].fps);
      assert.equal(loop,source.animations[action].loop);
      for(let tile=first;tile<first+count;tile++){
        const left=tile%columns*size,top=Math.floor(tile/columns)*size;
        let visible=0;
        for(let y=0;y<size;y++)for(let x=0;x<size;x++){
          if(!data[(top+y)*width+left+x])continue;
          assert.ok(x>0&&x<size-1&&y>0&&y<size-1,'Clipped frame '+id+' '+tile);
          visible++;
        }
        assert.ok(visible>500,'Empty frame '+id+' '+tile);
      }
    }
  }
});

test('at normal and battery saver cadence each clip shows every frame in order',()=>{
  for(const id of enabled)for(const [action,{count,fps,loop}] of Object.entries(heroActionCatalog[id].clips)){
    for(const renderRate of [30,60]){
      const actor={},seen=[];
      for(let draw=0;draw<=Math.ceil(count/fps*renderRate*2);draw++){
        const {index}=heroActionFrame(actor,id,action,draw*1000/renderRate);
        if(index!==seen.at(-1))seen.push(index);
      }
      const expected=Array.from({length:count},(_,index)=>index);
      assert.deepEqual(seen.slice(0,count),expected,id+' '+action);
      if(loop)assert.deepEqual(seen.slice(count,count*2),expected);
      else assert.equal(seen.length,count);
    }
  }
});

test('species, motion, damage and death switch clips, and missed frames do not skip poses',()=>{
  const p={speciesId:4,grounded:true,speedNow:0};
  const render=now=>heroActionFrame(p,p.speciesId,playerHeroAction(p),now);
  const first=render(0);
  assert.equal(first.action,'idle');
  assert.equal(render(41.7).index,1);
  assert.equal(render(41.7).index,1);
  Object.assign(p,{attackT:.3,ultPoseT:.6});
  assert.equal(render(83.4).index,2,'Auto-attacks and ultimates preserve the idle clock');
  p.speedNow=2;
  assert.equal(render(100).action,'walk');
  assert.equal(render(150).index,1);
  p.hurtT=.25;
  assert.equal(render(200),undefined);
  p.hurtT=0;
  assert.equal(render(300).index,0);
  for(const species of [5,6]){
    p.speciesId=species;
    const frame=render(400);
    assert.equal(frame.species,species);
    assert.equal(frame.action,'walk');
    assert.equal(frame.index,0);
  }
  Object.assign(p,{dead:true,hurtT:1,heroPose:{word:'燚'}});
  assert.equal(render(500).action,'faint');
  assert.equal(render(500).index,0);
  assert.equal(render(5000).index,1);
  p.speciesId=132;
  assert.equal(render(6000),undefined);
});
