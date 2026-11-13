import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {enemyWord,remainingStrokes,finalBossSpecies} from '../source/src/character-rules.js';
import {glyphCatalog} from '../source/src/glyph-catalog.js';

const art=path.resolve(import.meta.dirname,'../source/art/monsters');
const pools=['一阶','二阶','三阶'].map(folder=>fs.readdirSync(path.join(art,folder))
  .filter(f=>f.endsWith('.png')).map(f=>path.basename(f,'.png')).sort());

test('spawn classes select only their folder, including modified elites and timed minibosses',()=>{
  for(const [flags,words] of [[0,pools[0]],[512,pools[0]],[1,pools[1]],[1025,pools[1]],
    ...[2,4096,8192,4097].map(flag=>[flag,pools[2].filter(word=>word!=='龘')])]){
    const selected=words.map((_,i)=>enemyWord(59,flags,()=>(i+.5)/words.length));
    assert.deepEqual(selected.sort(),words);
  }
  assert.equal(enemyWord(finalBossSpecies,4,()=>{throw Error('Final boss rolled');}),'龘');
  assert.equal(enemyWord(16,128),'风');
});

test('each word has one health interval per numbered source stroke',()=>{
  let nextTile=0;
  for(const {word,tier,firstTile,strokes} of Object.values(glyphCatalog.enemies)){
    const dir=path.join(art,['一阶','二阶','三阶'][tier-1],word);
    assert.equal(firstTile,nextTile);
    assert.equal(fs.readdirSync(dir).length,strokes);
    for(let i=1;i<=strokes;i++){
      assert.ok(fs.existsSync(path.join(dir,word+'-'+i+'.png')));
      assert.equal(remainingStrokes(strokes,i*100,strokes*100),i);
      assert.equal(remainingStrokes(strokes,(i-1)*100+.01,strokes*100),i);
    }
    assert.equal(remainingStrokes(strokes,0,strokes*100),0);
    nextTile+=strokes;
  }
  assert.equal(glyphCatalog.enemies['龘'].strokes,48);
  assert.equal(nextTile,358);
});

test('last visible stroke matches the last supplied layer at its original position for every monster',async()=>{
  const {size,columns}=glyphCatalog.monsterAtlas;
  const atlas=path.resolve(art,'../../public/assets/glyphs/monster-strokes.png');
  for(const {word,tier,firstTile,strokes} of Object.values(glyphCatalog.enemies)){
    const dir=path.join(art,['一阶','二阶','三阶'][tier-1]);
    const {data,info}=await sharp(path.join(dir,word+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let left=info.width,top=info.height,right=0,bottom=0;
    for(let i=0;i<data.length/4;i++)if(data[i*4+3]){
      const x=i%info.width,y=Math.floor(i/info.width);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    const expected=await sharp(path.join(dir,word,word+'-'+strokes+'.png'))
      .extract({left,top,width:right-left+1,height:bottom-top+1})
      .resize(80,80,{fit:'contain',background:'#00000000'}).extend({left:8,right:8,top:8,bottom:8,background:'#00000000'})
      .ensureAlpha().raw().toBuffer();
    const tile=await sharp(atlas).extract({left:firstTile%columns*size,top:Math.floor(firstTile/columns)*size,width:size,height:size}).raw().toBuffer();
    let opaque=0;
    for(let i=0;i<expected.length;i+=4){
      if(expected[i+3]===255){
        opaque++;
        assert.ok(expected.subarray(i,i+4).every((channel,j)=>Math.abs(tile[i+j]-channel)<=2),word);
      }else if(!expected[i+3]&&tile[i+3]>127){
        assert.ok([39,35,47].every((channel,j)=>Math.abs(tile[i+j]-channel)<=2),word);
      }
    }
    assert.ok(opaque>0,word);
  }
});
