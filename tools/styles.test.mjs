import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom/worker';
import {styleEngine} from '../platform/styles.mjs';
import {inflateSync} from 'node:zlib';
import path from 'node:path';
import {bootAssets} from './boot-assets.mjs';

test('packaged portrait styles suppress a leftover desktop rotation overlay',()=>{
  const assets=bootAssets(path.resolve(import.meta.dirname,'..'));
  const rules=JSON.parse(inflateSync(assets['engine/styles.bin']));
  const {document}=parseHTML('<html class="touch"><body><div class="rotate-hint" style="display:grid">请旋转手机</div></body></html>');
  for(const [w,h] of [[320,470],[390,746],[430,834],[768,926],[768,316]]){
    const s=styleEngine({w,h},rules).style(document.querySelector('.rotate-hint'));
    assert.equal(s.display,'none',`Rotation overlay at ${w}x${h}`);
    assert.equal(s['pointer-events'],'none');
  }
});

test('portrait spacing shorthands reset earlier longhands',()=>{
  const {document}=parseHTML('<div class="card"></div>'),el=document.querySelector('div');
  const rules=[
    ['.card',[['padding-top','24px'],['padding-bottom','10px'],['margin-top','auto']],'.card','',10,0],
    ['.card',[['padding','0'],['margin','6px calc(2px + 1%)']],'.card','',10,1]
  ];
  const style=styleEngine({w:390,h:746},rules).style(el);
  assert.equal(style['padding-top'],'0');assert.equal(style['padding-bottom'],'0');
  assert.equal(style['margin-top'],'6px');assert.equal(style['margin-right'],'calc(2px + 1%)');
  assert.equal(style['margin-left'],'calc(2px + 1%)');
});
test('important longhands retain priority over a regular shorthand',()=>{
  const {document}=parseHTML('<div class="card"></div>');
  const rules=[
    ['.card',[['padding-left','8px!important']],'.card','',10,0],
    ['.card',[['padding','2px 4px']],'.card','',10,1]
  ];
  const style=styleEngine({w:320,h:470},rules).style(document.querySelector('div'));
  assert.equal(style['padding-left'],'8px');assert.equal(style['padding-right'],'4px');
});
