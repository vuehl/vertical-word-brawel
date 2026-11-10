import 'core-js/modules/es.array.at.js';
import 'core-js/modules/es.array.flat.js';
import 'core-js/modules/es.array.flat-map.js';
import 'core-js/modules/es.object.from-entries.js';
import 'core-js/modules/es.object.has-own.js';
import 'core-js/modules/es.promise.finally.js';
import 'core-js/modules/es.string.at-alternative.js';
import 'core-js/modules/es.string.match-all.js';
import 'core-js/modules/es.string.replace-all.js';
import * as D from 'linkedom/worker';
import {strFromU8,strToU8} from 'fflate';
import {LocalURL,Params} from './url.mjs';
import {createFetch,Headers,Request,Response,Blob} from './http.mjs';
import {createLayout} from './layout.mjs';
import {mediaMatches} from './styles.mjs';
import {readUIAssets} from './reference.mjs';
import {paint,compositor} from './paint.mjs';
import {installSurfaces} from './surfaces.mjs';
import {CanvasPath} from './path.mjs';
import {cloneData} from './clone.mjs';
import {initCrypto,random} from './crypto.mjs';
import {dispatchApi} from 'pokebonk:api';
import {rangeValueAt,repairVolumeSettings} from './range.mjs';
import {createUIFrameCache} from './ui-cache.mjs';
import {createControlLayer,createCanvasLayer,createHUDLayer} from './control-layer.mjs';
import {createModalTransition} from './modal-transition.mjs';
import {gameViewport} from './viewport.mjs';
import {createMutationTargets} from './mutation-targets.mjs';
import {uiScale} from './ui-resolution.mjs';
import {readRuntimeInfo} from './device.mjs';

class InputEvent extends D.Event {
  constructor(type,options={}){super(type,{bubbles:options.bubbles!==false,cancelable:true});Object.assign(this,options);}
}
class AbortSignal extends D.EventTarget {static any(signals){return signals[0];}}
class AbortController {constructor(){this.signal=new AbortSignal();}abort(){this.signal.aborted=true;this.signal.dispatchEvent(new D.Event('abort'));}}
class TextDecoder {decode(input){return strFromU8(new Uint8Array(input?.buffer||input||0,input?.byteOffset||0,input?.byteLength));}}
class TextEncoder {encode(text){return strToU8(text);}}
function storage(prefix) {
  return {getItem(k){const v=wx.getStorageSync(prefix+k);return v===''||v===undefined?null:String(v);},
    setItem(k,v){wx.setStorageSync(prefix+k,String(v));},removeItem(k){wx.removeStorageSync(prefix+k);}};
}
// DOM layout, hit testing and client coordinates share the usable rectangle.
// The 3D canvas still covers the whole WeChat window behind the controls.
function viewport(info) {
  let menu;try{menu=wx.getMenuButtonBoundingClientRect?.();}catch{}
  return gameViewport(info,menu);
}
export async function setup(host) {
  await initCrypto();
  const {document:doc}=D.parseHTML('<!doctype html><html><head></head><body><canvas id="game"></canvas><div id="ui"></div></body></html>');
  const win=new D.EventTarget(),system=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
  const view=viewport(system);
  const uiFrames=createUIFrameCache();
  const {Image,makeCanvas,screen}=installSurfaces(D,doc,host,view,element=>{
    const tile=win.__pb?.run?.state==='play'&&hudLayers.find(layer=>layer.owns(element));
    if(tile)tile.invalidate();else uiFrames.invalidate();
  });
  const controls=createControlLayer(makeCanvas);
  const minimap=createCanvasLayer(makeCanvas,'minimap');
  const health=createCanvasLayer(makeCanvas,'health',{slot:2,movable:true});
  const portrait=createCanvasLayer(makeCanvas,'portrait',{slot:5,foreground:'portrait-level'});
  const hudLayers=['counters','score','ultimate','skills','items','markers','notices','diagnostics'].map((id,index)=>createHUDLayer(makeCanvas,id,index+6));
  const modalTransition=createModalTransition(makeCanvas);
  let scale=uiScale(view);const uiCanvas=makeCanvas();uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
  const fonts={};
  for(const weight of ['regular','bold'])fonts[weight]=wx.loadFont(host.files.pathFor('fonts/'+weight+'.ttf'))||'sans-serif';
  host.fonts=fonts;
  const uiAssets=readUIAssets(host.files);
  let layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);
  let draw=null,active=null,captured=new Map(),pointers=new Map();
  const frozenModalKey=()=>{
    const app=win.__pb,run=app?.run;
    return !app?.screen&&!run?.coop&&run?.state==='modal'&&run.ui.modalEl?.querySelector('.zx-upgrade')?run:null;
  };
  const mutationTarget=createMutationTargets(doc.documentElement);
  function mutations(records){
    for(const record of records){
      if(record.target===screen)continue;
      const target=mutationTarget(record);
      const element=target.nodeType===1?target:target.parentElement;
      if(element?.closest?.('[data-ui-hidden="true"]'))continue;
      if(record.type==='attributes'&&record.target.getAttribute(record.attributeName)===record.oldValue)continue;
      if(env.__pb?.run?.state==='play'){
        const tile=hudLayers.find(layer=>layer.owns(element));
        if(tile){tile.invalidate();continue;}
      }
      if(record.type==='attributes'&&minimap.owns(element)&&record.attributeName==='data-frame'){
        minimap.invalidate();continue;
      }
      if(env.__pb?.run?.state==='play'&&record.type==='attributes'&&element?.dataset?.uiLayer==='portrait'&&['data-frame','data-progress','data-word','aria-valuenow'].includes(record.attributeName)){
        if(record.attributeName==='data-frame')portrait.invalidate();
        continue;
      }
      if(record.type==='attributes'&&health.owns(element)&&['style','data-frame','data-progress','aria-valuenow','aria-valuemax','aria-label'].includes(record.attributeName)){
        if(record.attributeName==='data-frame')health.invalidate();
        continue;
      }
      if(record.type==='attributes'&&controls.owns(element)&&['style','class'].includes(record.attributeName)){
        controls.invalidate();continue;
      }
      // Text/HUD updates may happen every game tick; coalesce them. A newly
      // mounted menu must replace the previous pixels on the very next draw.
      const structural=record.type==='childList'&&[...record.addedNodes,...record.removedNodes].some(n=>n.nodeType===1);
      uiFrames.invalidate(true,structural);
    }
  }
  const observer=new doc.defaultView.MutationObserver(mutations);
  observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeOldValue:true,characterData:true});
  const property=(key,get,set)=>Object.defineProperty(D.Element.prototype,key,{configurable:true,get,set});
  function rect(el) {
    const box=el===screen?{x:-view.x,y:-view.y,w:view.width,h:view.height}:
      el===doc.documentElement||el===doc.body?{x:0,y:0,w:view.w,h:view.h}:layout.box(el)||{x:0,y:0,w:0,h:0};
    return {x:box.x,y:box.y,left:box.x,top:box.y,width:box.w,height:box.h,right:box.x+box.w,bottom:box.y+box.h};
  }
  for(const prefix of ['client','offset'])for(const [dim,key,measured] of [['Width','width','naturalW'],['Height','height','naturalH']])
    property(prefix+dim,function(){return layout.box(this)?.[measured]??rect(this)[key];});
  property('offsetLeft',function(){return rect(this).left;});property('offsetTop',function(){return rect(this).top;});
  property('scrollHeight',function(){return this.clientHeight+(this._scrollMax||0);});
  property('scrollWidth',function(){return this.clientWidth;});
  property('scrollTop',function(){return this._scroll||0;},function(n){this._scroll=Math.min(this._scrollMax||0,Math.max(0,n));uiFrames.invalidate(true,true);});
  D.Element.prototype.getBoundingClientRect=function(){return rect(this);};
  D.Element.prototype.getClientRects=function(){return this.offsetWidth?[rect(this)]:[];};
  D.Element.prototype.setPointerCapture=function(id){captured.set(id,this);};
  D.Element.prototype.hasPointerCapture=function(id){return captured.get(id)===this;};
  D.Element.prototype.releasePointerCapture=function(id){if(captured.get(id)===this)captured.delete(id);};
  D.Element.prototype.focus=function(){active=this;this.dispatchEvent(new D.Event('focus'));};
  D.Element.prototype.blur=function(){if(active===this)active=null;this.dispatchEvent(new D.Event('blur'));};
  D.Element.prototype.scrollIntoView=function(){
    let {top,bottom}=rect(this);
    for(let p=this.parentElement;p;p=p.parentElement)if(p._scrollMax){
      const bounds=rect(p),before=p.scrollTop;
      if(top<bounds.top)p.scrollTop+=top-bounds.top;
      else if(bottom>bounds.bottom)p.scrollTop+=bottom-bounds.bottom;
      const moved=p.scrollTop-before;top-=moved;bottom-=moved;
    }
  };
  D.Element.prototype.scrollTo=function(x,y){this.scrollTop=typeof x==='object'?x.top||0:y||0;};
  D.Element.prototype.animate=function(_frames,timing){let done,timer;const a={finished:new Promise(r=>{done=r;}),cancel(){clearTimeout(timer);done();}};
    timer=setTimeout(()=>{done();a.onfinish?.();},typeof timing==='number'?timing:(timing?.duration||0));return a;};
  D.Element.prototype.getAnimations=()=>[];
  doc.getAnimations=()=>[];
  doc.fonts={ready:Promise.resolve(),load:()=>Promise.resolve([])};doc.hasFocus=()=>!doc.hidden;
  doc.hidden=false;doc.visibilityState='visible';doc.elementFromPoint=(x,y)=>layout.hit(x,y);
  Object.defineProperty(doc,'activeElement',{get:()=>active||doc.body});
  doc.exitPointerLock=()=>{};
  const fs=wx.getFileSystemManager(),localStorage=storage('pokebonk.web.');
  // Migrate old language preferences before reading the Chinese-only package.
  const locale='zh';localStorage.setItem('pokebonk.lang',locale);
  const loc=new LocalURL('https://pokebonk.local/?touch=1');
  loc.reload=()=>wx.restartMiniProgram?.({});loc.replace=()=>{localStorage.setItem('pokebonk.lang','zh');loc.reload();};
  const history={state:null,pushState(state){this.state=state;},replaceState(state){this.state=state;},back(){win.dispatchEvent(new D.Event('popstate'));}};
  const queries=new Map();
  function matchMedia(q){
    if(!queries.has(q))queries.set(q,Object.assign(new D.EventTarget(),{media:q,matches:mediaMatches(q,view)}));
    return queries.get(q);
  }
  function computed(el){return new Proxy(el.style,{get(t,k){if(k==='getPropertyValue')return key=>layout.box(el)?.s[key]||t.getPropertyValue(key)||'';
    const key=String(k).replace(/[A-Z]/g,m=>'-'+m.toLowerCase());return layout.box(el)?.s[key]||t.getPropertyValue(key)||(k==='gridTemplateColumns'?'1fr':'');}});}
  function show(hide){
    doc.hidden=hide;doc.visibilityState=hide?'hidden':'visible';doc.dispatchEvent(new D.Event('visibilitychange'));win.dispatchEvent(new D.Event(hide?'pagehide':'pageshow'));
    if(hide){for(const [id,p] of pointers)p.target.dispatchEvent(new InputEvent('pointercancel',{pointerId:id,pointerType:'touch'}));pointers.clear();captured.clear();}uiFrames.invalidate(true,true);
  }
  wx.onHide(()=>show(true));wx.onShow(()=>show(false));
  function keyboard(el){
    if(!wx.showKeyboard)return;
    wx.showKeyboard({defaultValue:el.value||'',maxLength:Number(el.maxLength)>0?Number(el.maxLength):140,multiple:el.localName==='textarea',confirmType:'done'});
    active=el;
  }
  wx.onKeyboardInput?.(r=>{if(active){active.value=r.value;active.dispatchEvent(new InputEvent('input'));uiFrames.invalidate(true,true);}});
  wx.onKeyboardConfirm?.(r=>{if(active){active.value=r.value;active.dispatchEvent(new InputEvent('change'));active.blur();}wx.hideKeyboard?.({});});
  function setRange(el,x){const b=rect(el);if(b.width<=0)return;el.value=String(rangeValueAt(el,(x-b.x)/b.width));el.dispatchEvent(new InputEvent('input'));}
  function touches(kind,event){
    // A press begun in combat must not select a card while it is appearing.
    if(modalTransition.active){pointers.clear();captured.clear();return;}
    // Menus still react immediately. In battle, DOM mutations invalidate the
    // controls that actually changed; an empty-space swipe needs no UI upload.
    if(kind!=='move'&&win.__pb?.run?.state!=='play')uiFrames.invalidate(false,true);
    const local=t=>{
      const x=(t.clientX??t.pageX)-view.x,y=(t.clientY??t.pageY)-view.y;
      return {...t,identifier:t.identifier,clientX:x,clientY:y,pageX:x,pageY:y};
    };
    const all=Array.from(event.touches||[],local),changed=Array.from(event.changedTouches||event.touches||[],local);
    const touchType='touch'+({down:'start',move:'move',up:'end',cancel:'cancel'}[kind]);
    for(const t of changed){
      const id=t.identifier??0,x=t.clientX,y=t.clientY;
      let p=pointers.get(id);
      if(kind==='down'){
        if(x<0||y<0||x>=view.w||y>=view.h)continue;
        const target=layout.hit(x,y);p={target,x,y,lastY:y,scrolled:false};pointers.set(id,p);
      }
      if(!p)continue;
      const target=captured.get(id)||p.target,options={pointerId:id,pointerType:'touch',clientX:x,clientY:y,pageX:x,pageY:y,button:0,buttons:kind==='up'?0:1,isPrimary:pointers.keys().next().value===id,bubbles:true};
      if(kind==='move'&&p.target.type!=='range'){
        for(let sc=p.target;sc;sc=sc.parentElement){
          if(sc._scrollMax>0&&/auto|scroll/.test([layout.box(sc)?.s.overflow,layout.box(sc)?.s['overflow-y']].join(' '))&&Math.abs(y-p.y)>5){
            sc.scrollTop+=p.lastY-y;p.scrolled=true;break;
          }
        }
      }
      p.lastY=y;
      target.dispatchEvent(new InputEvent('pointer'+kind,options));
      win.dispatchEvent(new InputEvent('pointer'+kind,{...options,bubbles:false}));
      const contact={touches:all,changedTouches:[t]};
      target.dispatchEvent(new InputEvent(touchType,{...contact,bubbles:true}));
      // The virtual document has no parent window. Notify it before the next
      // pointerdown, including when both thumbs land in the same native event.
      win.dispatchEvent(new InputEvent(touchType,{...contact,bubbles:false}));
      const input=p.target.closest?.('input,textarea');
      if(input?.type==='range'&&(kind==='down'||kind==='move'))setRange(input,x);
      if(kind==='up'||kind==='cancel'){
        if(kind==='up'&&!p.scrolled&&Math.hypot(x-p.x,y-p.y)<15&&!p.target.closest?.('[disabled]')){
          if(input){if(input.type==='checkbox'){input.checked=!input.checked;input.dispatchEvent(new InputEvent('change'));}
            else if(input.type==='range')input.dispatchEvent(new InputEvent('change'));else if(!['button','submit'].includes(input.type))keyboard(input);}
          p.target.dispatchEvent(new InputEvent('click',options));
        }
        captured.delete(id);pointers.delete(id);
      }
    }
  }
  wx.onTouchStart(e=>touches('down',e));wx.onTouchMove(e=>touches('move',e));wx.onTouchEnd(e=>touches('up',e));wx.onTouchCancel(e=>touches('cancel',e));
  const fetch=createFetch(host.files,dispatchApi);
  const raf=typeof requestAnimationFrame==='function'?requestAnimationFrame.bind(globalThis):fn=>setTimeout(()=>fn(Date.now()),16);
  const perf=typeof performance!=='undefined'?performance:{now:Date.now};
  const env=Object.assign(win,{...D,document:doc,Image,HTMLVideoElement:D.HTMLVideoElement,location:loc,history,localStorage,sessionStorage:storage('pokebonk.session.'),
    Blob,URL:LocalURL,URLSearchParams:Params,fetch,Request,Headers,Response,AbortController,AbortSignal,TextDecoder,TextEncoder,createImageBitmap:undefined,ImageBitmap:undefined,OffscreenCanvas:undefined,
    ProgressEvent:InputEvent,MouseEvent:InputEvent,KeyboardEvent:InputEvent,PointerEvent:InputEvent,Path2D:CanvasPath,MutationObserver:doc.defaultView.MutationObserver,
    innerWidth:view.w,innerHeight:view.h,devicePixelRatio:view.dpr,uiPixelRatio:scale,screen:{width:view.w,height:view.h,orientation:{get type(){return view.h>=view.w?'portrait-primary':'landscape-primary';}}},
    nativeUI:true,nativeDevice:readRuntimeInfo(wx,typeof GameGlobal==='object'?GameGlobal:{}),backgroundMusicEnabled:false,prefersDark:system.theme==='dark',nativeGraphics:{pixelBudget:900000,maxPixelRatio:1.5},
    navigator:{userAgent:'MicroMessenger MiniGame',language:'zh-CN',languages:['zh-CN'],maxTouchPoints:5,getGamepads:()=>[],onLine:true},
    AudioContext:wx.createWebAudioContext?class {constructor(){return wx.createWebAudioContext();}}:undefined,
    crypto:{getRandomValues(a){new Uint8Array(a.buffer,a.byteOffset,a.byteLength).set(random(a.byteLength));return a;}},
    structuredClone:cloneData,
    getComputedStyle:computed,matchMedia,setTimeout:(...args)=>setTimeout(...args),clearTimeout:id=>clearTimeout(id),
    setInterval:(...args)=>setInterval(...args),clearInterval:id=>clearInterval(id),performance:perf,requestAnimationFrame:raf,
    cancelAnimationFrame:typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout,
    addEventListener:win.addEventListener.bind(win),removeEventListener:win.removeEventListener.bind(win),dispatchEvent:win.dispatchEvent.bind(win),
    alert:msg=>wx.showModal({title:'字行',content:String(msg),showCancel:false}),open:()=>null,
    prepareForest:host.files.prepareForest,repairVolumeSettings,
    setUIPerformance(){
      // Settings also change inherited CSS variables (e.g. button size).
      // Refresh their hit boxes even when the pixel ratio stays the same.
      uiFrames.invalidate(true,true);
      const next=uiScale(view);
      if(Math.abs(next-scale)<.001)return;
      scale=env.uiPixelRatio=next;
      uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
      layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);uiFrames.invalidate(true,true);
    },
    invalidateUI:()=>uiFrames.invalidate(false,true),
    animateModal(wrap){modalTransition.begin(wrap);uiFrames.invalidate(true,true);},
    closeAnimatedModal(wrap,done,keepBackdrop){modalTransition.close(wrap,done,keepBackdrop);},
    modalAnimating:()=>modalTransition.active,
    drawFrozenModal(renderer){
      const key=frozenModalKey();
      if(!key||!draw?.hasFrozen(key))return false;
      env.drawUI(renderer,false,key);return true;
    },
    drawUI(renderer,opaque=false,frozenFrame=null){
      const now=perf.now();
      if(modalTransition.advance(now))uiFrames.invalidate(false,true);
      mutations(observer.takeRecords());
      const state=env.__pb?.run?.state;
      const changed=uiFrames.draw(now,state,layout,boxes=>{
        controls.capture(boxes);minimap.capture(boxes);health.capture(boxes);portrait.capture(boxes);
        for(const tile of hudLayers)tile.capture(boxes);
        const visible=modalTransition.capture(layout,boxes,view,scale);
        paint(layout,visible.filter(b=>!controls.owns(b.el)&&!(state==='play'&&(minimap.owns(b.el)||health.owns(b.el)||portrait.owns(b.el.nodeType===1?b.el:b.el.parentElement)||hudLayers.some(tile=>tile.owns(b.el.nodeType===1?b.el:b.el.parentElement))))),view,scale);
      });
      if(opaque&&!changed)return;
      const layers=[controls.draw(layout,view,scale,state==='play'&&!opaque),minimap.draw(layout,view,scale,state==='play'&&!opaque),health.draw(layout,view,scale,state==='play'&&!opaque),portrait.draw(layout,view,scale,state==='play'&&!opaque),...hudLayers.map(tile=>tile.draw(layout,view,scale,state==='play'&&!opaque)),...modalTransition.layers(scale,perf.now())];
      if(!draw)draw=compositor(renderer.getContext(),uiCanvas);draw(renderer,changed,opaque,layers,opaque?null:frozenFrame||frozenModalKey());
    },
    locale,readLocale(){const p=host.files.pathFor('locale/zh.json');return p?JSON.parse(fs.readFileSync(p,'utf8')):{};},
  });
  env.window=env.self=env.globalThis=env;
  wx.onWindowResize?.(()=>{
    const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
    Object.assign(view,viewport(info));
    env.innerWidth=env.screen.width=view.w;env.innerHeight=env.screen.height=view.h;
    env.devicePixelRatio=view.dpr;
    scale=env.uiPixelRatio=uiScale(view);uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
    layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);uiFrames.invalidate(true,true);
    for(const query of queries.values()){
      const matches=mediaMatches(query.media,view);
      if(matches!==query.matches){query.matches=matches;query.dispatchEvent(new InputEvent('change',{matches,media:query.media}));}
    }
    env.dispatchEvent(new D.Event('resize'));
  });
  if(host.inspect)host.inspect({env,doc,get layout(){return layout;},touches,uiCanvas,controls,minimap,health,portrait,hudLayers,modalTransition});
  return env;
}
