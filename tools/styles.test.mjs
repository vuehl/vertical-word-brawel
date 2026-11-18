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

test('clearing inline drag coordinates restores the fixed joystick position',()=>{
  const {document}=parseHTML('<div class="stick"></div>'),el=document.querySelector('div');
  const rules=[['.stick',[['left','50%'],['top','auto'],['bottom','28px']],'.stick','',10,0]];
  const engine=styleEngine({w:390,h:746},rules);
  el.style.left='80px';el.style.top='120px';el.style.bottom='auto';
  assert.equal(engine.style(el).left,'80px');
  el.style.left=el.style.top=el.style.bottom='';
  const reset=engine.style(el);
  assert.equal(reset.left,'50%');assert.equal(reset.top,'auto');assert.equal(reset.bottom,'28px');
});

test('native controls resolve inherited text colors before painting, including theme changes',()=>{
  const {document}=parseHTML('<div style="--ink:#29263c;color:var(--ink);font-size:14px"><button style="color:inherit;font-size:inherit"><span style="color:inherit">返回</span></button><button style="color:#fff">选中</button></div>');
  const parent=document.querySelector('div'),button=parent.firstElementChild,label=button.firstElementChild,selected=parent.lastElementChild;
  const engine=styleEngine({w:390,h:746},[]);
  function check(color){
    const p=engine.style(parent),b=engine.style(button,p),t=engine.style(label,b);
    assert.equal(b.color,color,'Canvas needs a concrete button color, not the CSS inherit keyword');
    assert.equal(t.color,color,'Nested labels must use the same resolved color');
    assert.equal(b.font,14,'Explicit font inheritance must retain the parent size');
    assert.equal(engine.style(selected,p).color,'#fff','Explicit selected-button colors remain intact');
  }
  check('#29263c');
  parent.style.color='#eee9f8';check('#eee9f8');
});
