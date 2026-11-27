import test from 'node:test';
import assert from 'node:assert/strict';
import {glyphCatalog} from '../../source/src/actors/glyph-catalog.js';
import {buildGlyphGeometry} from '../../source/src/actors/glyph-geometry.js';
import {createGlyphSkeleton,glyphModels} from '../../source/src/actors/glyph-skeleton.js';
import {heroActionCatalog} from '../../source/src/actors/hero-action-catalog.js';
import {heroActionFrame} from '../../source/src/actors/hero-actions.js';
import rigs from '../../resources/public/config/hero-rigs.json' with {type:'json'};

function matrices(rig,row){
  const stride=rig.skeleton.bones.length*16;
  return rig.palette.image.data.subarray(row*stride,(row+1)*stride);
}

test('every authored glyph and independently removable stroke has solid faces, depth and an outline hull',()=>{
  assert.deepEqual(Object.keys(glyphModels).sort(),Object.keys(glyphCatalog.words).sort());
  for(const [word,model] of Object.entries(glyphModels)){
    const count=glyphCatalog.enemies[word]?.strokes??Object.values(rigs).find(r=>r.word===word).groups.flatMap(g=>g.strokes).length;
    const geometry=buildGlyphGeometry(model),rig=createGlyphSkeleton(word);
    const {position,strokeBind}=geometry.attributes;
    const parts=Array.from({length:count},()=>new Set());
    for(let i=0;i<position.count;i++){
      const z=position.getZ(i),shell=strokeBind.getY(i);
      parts[strokeBind.getX(i)].add((z>0?'front':'back')+shell);
    }
    assert.ok(parts.every(p=>p.size===4),word);
    assert.equal(rig.skeleton.bones.length,count,word);
    assert.ok(rig.skeleton.bones.every(bone=>bone.isBone&&bone.parent.isBone),word);
    const bind=matrices(rig,0);
    for(let i=0;i<bind.length;i++)assert.ok(Math.abs(bind[i]-(i%16%5===0?1:0))<1e-5,word);
    assert.notDeepEqual(matrices(rig,rig.poseRow('attack',.5,true)),bind,word);
    assert.notDeepEqual(matrices(rig,rig.poseRow('walk',.25,false)),bind,word);
    geometry.dispose();rig.dispose();
  }
});

test('every original hero frame selects its own nonsingular bone palette row',()=>{
  for(const [id,catalog] of Object.entries(heroActionCatalog)){
    const word=rigs[id].word,rig=createGlyphSkeleton(word),rows=new Set();
    for(const [action,clip] of Object.entries(catalog.clips)){
      for(let i=0;i<clip.count;i++){
        const frame=heroActionFrame({},Number(id),action,0,i);
        const row=rig.poseRow(action==='faint'?'hurt':action,1,true,frame);
        assert.ok(!rows.has(row),word);rows.add(row);
        const values=matrices(rig,row);
        for(let j=0;j<values.length;j+=16)
          assert.ok(values[j]*values[j+5]-values[j+1]*values[j+4]>.001,word+' '+action+' '+i);
      }
    }
    rig.dispose();
  }
});

test('skill keyframes move only the named radical and its children',()=>{
  const hero=rigs[4],group=hero.groups[0],rig=createGlyphSkeleton(hero.word);
  const row=rig.poseRow('attack',.5,true,null,{word:hero.word,groups:{[group.name]:{x:12,y:-7}}});
  const values=matrices(rig,row);
  for(const [index,bone] of rig.skeleton.bones.entries()){
    const moved=Math.abs(values[index*16+12])+Math.abs(values[index*16+13])>1e-5;
    assert.equal(moved,bone.parent.name===group.name);
  }
  rig.dispose();
});
