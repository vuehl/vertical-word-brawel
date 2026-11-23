import {formCopy, moveCopy, specialNames} from '../source/src/form-copy.js';
import {glyphWordForSpecies} from '../source/src/paper-glyph-art.js';
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
    const selected=words.map((_,i)=>enemyWord(19,flags,()=>(i+.5)/words.length));
    assert.deepEqual(selected.sort(),words);
  }
  assert.equal(enemyWord(finalBossSpecies,4,()=>{throw Error('Final boss rolled');}),'龘');
  for(const id of Object.keys(glyphCatalog.heroes)){
    for(const [flags,tier] of [[0,1],[128,1],[1,2],[2,3],[4,3],[4096,3],[8192,3],[65536,1]]){
      const word=enemyWord(id,flags);
      assert.equal(glyphCatalog.enemies[word]?.tier,tier);
      assert.notEqual(word,'龘');
    }
  }
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

// Historical copy still supplies the basic attack label for Ember.
const retiredNames=new Set(['抓','劈开','龙息','热风','龙爪','闪焰冲锋','火焰牙']);
test('supplied form and skill names resolve for current moves and historical labels',()=>{
  const rows=Object.entries(formCopy);
  const moves=JSON.parse(fs.readFileSync(new URL('../source/public/data/moves.json',import.meta.url)));
  const names=new Set(moves.map(move=>move.name));
  const translated=new Set(Object.values(JSON.parse(fs.readFileSync(new URL('../source/public/text/ui.json',import.meta.url)))));
  for(const name of retiredNames)assert.ok(!names.has(name),name);
  let count=0;
  assert.equal(rows.length,36);
  assert.equal(new Set(rows.map(([,form])=>form.word)).size,36);
  for(const [id,form] of rows){
    assert.equal(glyphWordForSpecies(id),form.word);
    if(glyphCatalog.enemies[form.word]){
      for(const flags of [0,1,2,4,128,4096,65536])assert.equal(enemyWord(id,flags),form.word);
    }
    for(const [original,label] of Object.entries(form.moves)){
      assert.ok(names.has(original)||retiredNames.has(original),original);
      assert.equal(moveCopy(id,original),label);
      count++;
    }
    for(const kind of ['ultimate','fusion','passive']){
      if(!form[kind])continue;
      const [original,label]=form[kind];
      assert.ok(translated.has(original),original);
      assert.equal(specialNames[kind].get(original),label);
      count++;
    }
  }
  assert.equal(count,410);
  assert.equal(moveCopy(18,'空气斩','air-slash'),'空气斩');
  assert.equal(moveCopy(4,'火花','ember'),'火点拍');
  assert.equal(moveCopy(16,'电光一闪','quick-attack'),'连扇');
  assert.equal(moveCopy(132,'变身','transform'),'照影打');
  assert.equal(moveCopy(132,'烟幕'),'越学越像');
  assert.equal(moveCopy(6,'烟幕'),'烧成灰烬');
  assert.equal(moveCopy(19,'烟幕'),'烟幕');
  assert.equal(specialNames.ultimate.get('暴鲤龙之怒'),'巨浪压顶');
  assert.equal(specialNames.fusion.get('暴鲤龙之怒'),'河底翻上');
});

test('only the opening combat move uses the basic attack label of its form',()=>{
  const moves=JSON.parse(fs.readFileSync(new URL('../source/public/data/moves.json',import.meta.url)));
  for(const [species,form] of Object.entries(formCopy)){
    if(!form.starterAttack)continue;
    const [openingKey,tableName]=form.starterAttack;
    const basicLabel=form.moves[tableName];
    const basicMoves=moves.filter(move=>moveCopy(species,move.name,move.key)===basicLabel);
    assert.deepEqual(basicMoves.map(move=>move.key),[openingKey],form.word+' · '+basicLabel);
    const independentMove=moves.find(move=>move.name===tableName);
    if(independentMove)assert.equal(moveCopy(species,tableName,independentMove.key),tableName);
    else assert.ok(retiredNames.has(tableName));
  }
});
