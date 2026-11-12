import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom/worker';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import path from 'node:path';
import {gameViewport} from '../platform/viewport.mjs';

// Exercise the same Yoga layout used in the minigame, with deterministic
// glyph widths. Bundling uses the build tools' installed runtime dependencies.
const bundle=buildSync({entryPoints:[path.resolve(import.meta.dirname,'../platform/layout.mjs')],
  bundle:true,platform:'node',format:'cjs',write:false,nodePaths:[path.join(import.meta.dirname,'node_modules')]}).outputFiles[0].text;
const module={exports:{}};
runInNewContext(bundle,{module,exports:module.exports,require:createRequire(import.meta.url),TextDecoder,TextEncoder,Buffer,console});
const {createLayout}=module.exports;

function fixture(width){
  const {document}=parseHTML(`<html class="zixing"><body><div id="card" style="display:flex;flex-direction:column;text-align:center;padding:12px">
    <strong id="title">岩石沙漠</strong><small id="caption">暂未开放</small>
    <p id="description">这段说明需要在小屏幕换行后仍然保持居中显示，不能退回左侧。不同宽度的手机都应该显示完整的说明内容，第二行也应该围绕同一个中心对齐。</p>
    <div style="display:flex;align-items:center"><i style="width:44px;height:44px;flex:none"></i>
      <div style="display:flex;flex-direction:column;flex:1"><b id="row-title">伤害</b><small id="row-caption">当前 → 下一级</small></div>
    </div>
    <span id="right" style="text-align:right">00:02</span>
    <span id="explicit" style="display:flex;justify-content:flex-start">操作</span>
  </div></body></html>`);
  const ctx={measureText:text=>({width:[...text].length*10})};
  const layout=createLayout(document,{w:width,h:746},{getContext:()=>ctx},{regular:'test',bold:'test'},
    {rules:[],layout:{views:[{w:width,h:746,screens:{}}],styles:[]}});
  layout.refresh();
  const boxes=id=>{const el=document.getElementById(id);return [layout.box(el),layout.box(el.firstChild)];};
  return {boxes};
}

test('native card labels inherit centering across inline tags, nested rows and wrapped text',()=>{
  for(const width of [320,390,430]){
    const {boxes}=fixture(width);
    for(const id of ['title','caption','description','row-title','row-caption']){
      const [label,text]=boxes(id);
      assert.ok(Math.abs(text.x+text.w/2-label.x-label.w/2)<=1,`${width}: ${id} is not centered`);
    }
    const [,description]=boxes('description');
    assert.ok(description.h>24,'Fixture must cover wrapped text');
  }
});

test('native text alignment preserves right-aligned counters and explicit flex controls',()=>{
  const {boxes}=fixture(390);
  const [counter,text]=boxes('right');
  assert.ok(Math.abs(text.x+text.w-counter.x-counter.w)<=1);
  const [control,label]=boxes('explicit');
  assert.ok(Math.abs(control.x-label.x)<=1,'Explicit flex justification must take precedence');
});

test('registered top HUD region can paint above the common safe area without moving other controls',()=>{
  const {document}=parseHTML('<html class="zixing"><body><div data-ui-region="hud-top" style="position:absolute;left:12px;top:8px;height:26px;display:flex">关卡 · 1/3区</div><button style="position:absolute;top:60px;height:40px">暂停</button></body></html>');
  const region={x:12,y:-26,w:160,h:26},ctx={measureText:text=>({width:[...text].length*10})};
  const layout=createLayout(document,{w:320,h:470,regions:{'hud-top':region}},{getContext:()=>ctx},{regular:'test',bold:'test'},
    {rules:[],layout:{views:[{w:320,h:470,screens:{}}],styles:[]}});
  layout.refresh();const strip=layout.box(document.querySelector('div')),label=layout.box(document.querySelector('div').firstChild),button=layout.box(document.querySelector('button'));
  assert.equal(strip.x,region.x);assert.equal(strip.y,region.y);assert.ok(strip.w<=region.w);
  assert.deepEqual({...strip.clip},{x:12,y:-26,r:172,b:0});assert.equal(label.clip.y,-26);
  assert.equal(button.y,60);assert.equal(button.clip.y,0);
});

test('stage label shares the capsule center even when the general safe area starts lower',()=>{
  for(const width of [320,390,430])for(const [safeTop,menuTop,screenTop] of [[36,28,0],[44,8,0],[59,50,24]]){
    const menu={left:width-106,right:width-16,top:menuTop+screenTop,bottom:menuTop+screenTop+32};
    const view=gameViewport({windowWidth:width,windowHeight:844,screenTop,safeArea:{left:0,top:safeTop+screenTop,right:width,bottom:810+screenTop}},menu);
    const strip=view.regions['hud-top'],stack=view.regions['hud-stack'];
    assert.equal(strip.y+view.y+strip.h/2,menuTop+16);
    assert.ok(strip.x+strip.w+view.x+44<=menu.left);
    assert.ok(stack.y>=8&&stack.y-(strip.y+strip.h)>=15);
    assert.ok(stack.y-(strip.y+strip.h)<=25,'Profile stays close to the capsule row');
  }
  const view=gameViewport({windowWidth:390,windowHeight:844});
  assert.equal(view.regions['hud-top'].y,8);assert.equal(view.regions['hud-stack'].y,49);
});
