import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom/worker';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import path from 'node:path';

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
