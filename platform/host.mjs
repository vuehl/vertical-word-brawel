import {cloudSocket} from './cloud-coop.mjs';
import {createCaptureOverlay} from './capture-bag.mjs';
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
import {dispatchApi} from './game-api.mjs';
import {rangeValueAt,repairVolumeSettings} from './range.mjs';
import {createUIFrameCache} from './ui-cache.mjs';
import {createControlLayer,createCanvasLayer,createHUDLayer} from './control-layer.mjs';
import {createReadyBlink} from './ultimate-ready-blink.mjs';
import {castHidesUI,castHudLeadMs,createUltimateCast} from './ultimate-cast.mjs';
import {createComboNameplate} from './ultimate-nameplate.mjs';
import {createModalTransition} from './modal-transition.mjs';
import {gameViewport} from './viewport.mjs';
import {createMutationTargets} from './mutation-targets.mjs';
import {uiScale} from './ui-resolution.mjs';
import {readRuntimeInfo,readDevicePerformance} from './device.mjs';

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
  host.bootStage?.('正在加载字体与界面',74);
  const {document:doc}=D.parseHTML('<!doctype html><html><head></head><body><canvas id="game"></canvas><div id="ui"></div></body></html>');
  const win=new D.EventTarget(),system=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
  const view=viewport(system);
  const uiFrames=createUIFrameCache();
  const {Image,makeCanvas,screen}=installSurfaces(D,doc,host,view,element=>{
    if(modalTransition.owns(element)){modalTransition.invalidate();return;}
    const tile=usingBattleHUD()&&fixedLayerFor(element);
    if(tile)tile.invalidate();else uiFrames.invalidate();
  });
  const controls=createControlLayer(makeCanvas);
  const readyBlink=createReadyBlink(makeCanvas);
  let ultimateCast,comboNameplate;
  const minimap=createCanvasLayer(makeCanvas,'minimap');
  const device=readRuntimeInfo(wx,typeof GameGlobal==='object'?GameGlobal:{});
  readDevicePerformance(wx,device).then(()=>win.dispatchEvent(new D.Event('deviceperformancechange')));
  const health=createCanvasLayer(makeCanvas,'health',{slot:2,movable:true,uploadPixels:device.platform==='ios'});
  const speech=createCanvasLayer(makeCanvas,'weather-speech',{slot:13,movable:true,uploadPixels:device.platform==='ios'});
  const peerTiles=['peer-health-0','peer-health-1','peer-tag-0','peer-tag-1'].map((id,i)=>
    createCanvasLayer(makeCanvas,id,{slot:14+i,movable:true,uploadPixels:device.platform==='ios'}));
  const movableLayer=element=>health.owns(element)?health:speech.owns(element)?speech:
    element?.dataset?.uiLayer?.startsWith('peer-')?peerTiles.find(t=>t.owns(element)):null;
  const portrait=createCanvasLayer(makeCanvas,'portrait',{slot:5,foreground:'portrait-level'});
  const soloLayers=['counters','ultimate','skills','items','markers','notices','diagnostics'].map((id,index)=>createHUDLayer(makeCanvas,id,index+6));
  const skillLayer=soloLayers[2];
  soloLayers.push(createHUDLayer(makeCanvas,'boss-health',27));
  soloLayers.push(createHUDLayer(makeCanvas,'streak',22));
  soloLayers.push(createHUDLayer(makeCanvas,'toasts',19));
  soloLayers.push(createHUDLayer(makeCanvas,'stage-intro',20));
  const castNameplate=createHUDLayer(makeCanvas,'ultimate-cutin',21);
  soloLayers.push(castNameplate);
  soloLayers.push(createHUDLayer(makeCanvas,'evolution-result',23));
  soloLayers.push(createHUDLayer(makeCanvas,'evolution-stamp',24));
  const normalSoloLayers=soloLayers.filter(tile=>tile!==castNameplate);
  const teamLayer=createHUDLayer(makeCanvas,'coop-team',18);
  const coopLayers=[teamLayer,...soloLayers];
  const activeHudLayers=()=>win.__pb?.run?.coop?coopLayers:soloLayers;
  const fixedLayers=new Map(coopLayers.map(layer=>[layer.id,layer]));
  const soloTiles=new Map([...soloLayers,minimap,health,speech,portrait].map(layer=>[layer.id,layer]));
  soloTiles.set('portrait-level',portrait);soloTiles.set('stick',controls);
  const coopTiles=new Map(soloTiles);
  for(const layer of [teamLayer,...peerTiles])coopTiles.set(layer.id,layer);
  const allTiles=[controls,minimap,health,speech,portrait,...coopLayers,...peerTiles];
  const emptyBoxes=[];
  const layerId=el=>el?.closest?.('[data-ui-layer]')?.getAttribute('data-ui-layer');
  function fixedLayerFor(element){
    const tile=fixedLayers.get(layerId(element));
    return tile===teamLayer&&!win.__pb?.run?.coop?null:tile;
  }
  const modalTransition=createModalTransition(makeCanvas);
  const usingBattleHUD=()=>win.__pb?.run?.state==='play'||(win.__pb?.run?.state==='modal'&&!!modalTransition.element);
  let scale=uiScale(view);const uiCanvas=makeCanvas();uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
  const fonts={};
  for(const weight of ['regular','bold'])fonts[weight]=wx.loadFont(host.files.pathFor('fonts/'+weight+'.ttf'))||'sans-serif';
  host.fonts=fonts;
  function prepareCastArt(){
    const castFont=wx.loadFont(host.files.pathFor('fonts/cast-title.ttf'))||fonts.bold;
    comboNameplate=createComboNameplate(makeCanvas,castFont,()=>wx.createImage(),host.files.pathFor('fonts/cast-title-glyphs.webp'));
    ultimateCast=createUltimateCast(()=>wx.createImage(),makeCanvas,
      host.files.pathFor,path=>wx.getFileSystemManager().readFileSync(path));
  }
  const uiAssets=await readUIAssets(host.files);
  uiAssets.compileStyleSelector=D.compileStyleSelector;
  let layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);
  let draw=null,active=null,captured=new Map(),pointers=new Map();
  let lastJourneyCamera=null;
  const upgradeCue=run=>run?.state==='play'&&!run.coop&&run.pendingLevels>0&&run.evoHold<=0&&!run.upgradeTiming.waiting(run.ult)&&run.ui.experienceReady?.()===false;
  const frozenUpgradeKey=()=>{
    const app=win.__pb,run=app?.run;
    return !app?.screen&&(upgradeCue(run)||(!run?.coop&&run?.state==='modal'&&run.ui.modalEl?.querySelector('.zx-upgrade')))?run:null;
  };
  const mutationTarget=createMutationTargets(doc.documentElement);
  function mutations(records){
    for(const record of records){
      if(record.target===screen)continue;
      const target=mutationTarget(record);
      const element=target.nodeType===1?target:target.parentElement;
      if(modalTransition.owns(element)){
        modalTransition.invalidate();continue;
      }
      if(record.type==='childList'){
        const nodes=[...record.addedNodes,...record.removedNodes];
        if(nodes.length&&nodes.every(node=>modalTransition.owns(node.nodeType===1?node:node.parentElement)))continue;
      }
      if(element?.closest?.('[data-ui-hidden="true"]'))continue;
      if(record.type==='attributes'&&record.target.getAttribute(record.attributeName)===record.oldValue)continue;
      if(record.type==='attributes'&&minimap.owns(element)&&record.attributeName==='data-frame'){
        minimap.invalidate();continue;
      }
      if(usingBattleHUD()&&record.type==='attributes'&&element?.dataset?.uiLayer==='portrait'&&['data-frame','data-progress','data-word','aria-valuenow'].includes(record.attributeName)){
        if(record.attributeName==='data-frame')portrait.invalidate();continue;
      }
      if(usingBattleHUD()&&record.type!=='attributes'&&element?.closest?.('[data-ui-layer="portrait-level"]')){
        portrait.invalidateForeground();continue;
      }
      const movable=record.type==='attributes'&&movableLayer(element);
      if(movable&&['style','data-frame','data-progress','aria-valuenow','aria-valuemax','aria-label'].includes(record.attributeName)){
        if(record.attributeName==='data-frame')movable.invalidate();
        continue;
      }
      if(record.type==='attributes'&&controls.owns(element)&&['style','class'].includes(record.attributeName)){
        controls.invalidate();continue;
      }
      if(usingBattleHUD()){
        if(record.type==='attributes'&&element?.classList?.contains('zx-skill-cooldown')&&['data-frame','data-progress'].includes(record.attributeName)){
          if(record.attributeName==='data-frame')skillLayer.invalidatePixels();
          continue;
        }
        // A change to the streak root's position or width needs a fresh screen-space tile.
        if((record.type==='childList'&&element?.dataset?.uiLayer==='skills')||
           (element?.dataset?.uiLayer==='streak'&&['hidden','data-placement'].includes(record.attributeName))){
          uiFrames.invalidate(true,true);continue;
        }
        const tile=fixedLayerFor(element);
        if(tile){
          if(tile.id==='streak'&&record.attributeName==='data-frame')tile.invalidatePixels();
          else tile.invalidate();
          continue;
        }
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
  property('scrollTop',function(){return this._scroll||0;},function(n){
    // Before the first layout, keep the requested offset so that layout can clamp it.
    const next=Math.min(this._scrollMax??Infinity,Math.max(0,Number(n)||0));if(next===(this._scroll||0))return;
    this._scroll=next;if(modalTransition.owns(this))modalTransition.invalidate();else uiFrames.invalidate(true,true);
  });
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
  const loc=new LocalURL('https://pokebonk.local/?touch=1');
  loc.reload=()=>wx.restartMiniProgram?.({});loc.replace=loc.reload;
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
    if(hide){draw?.releaseFrozen();for(const [id,p] of pointers)p.target.dispatchEvent(new InputEvent('pointercancel',{pointerId:id,pointerType:'touch'}));pointers.clear();captured.clear();}uiFrames.invalidate(true,true);
  }
  wx.onHide(()=>show(true));wx.onShow(()=>show(false));
  wx.onAudioInterruptionBegin?.(()=>win.dispatchEvent(new D.Event('audiointerruptionbegin')));
  wx.onAudioInterruptionEnd?.(()=>win.dispatchEvent(new D.Event('audiointerruptionend')));
  let lastGC=-Infinity;
  wx.onMemoryWarning?.(()=>{
    draw?.releaseUnused();
    win.dispatchEvent(new D.Event('memorywarning'));
    const now=Date.now();
    if(device.platform==='ios'&&now-lastGC>=5000){
      lastGC=now;
      try{wx.triggerGC?.();}catch{}
    }
  });
  function keyboard(el){
    if(!wx.showKeyboard)return;
    wx.showKeyboard({defaultValue:el.value||'',maxLength:Number(el.maxLength)>0?Number(el.maxLength):140,multiple:el.localName==='textarea',confirmType:'done'});
    active=el;
  }
  wx.onKeyboardInput?.(r=>{if(active){active.value=r.value;active.dispatchEvent(new InputEvent('input'));uiFrames.invalidate(true,true);}});
  wx.onKeyboardConfirm?.(r=>{if(active){active.value=r.value;active.dispatchEvent(new InputEvent('change'));active.blur();}wx.hideKeyboard?.({});});
  function setRange(el,x){const b=rect(el);if(b.width<=0)return;el.value=String(rangeValueAt(el,(x-b.x)/b.width));el.dispatchEvent(new InputEvent('input'));}
  function cancelPointer(id,p,nativeTouchTime){
    const target=captured.get(id)||p.target;
    const options={pointerId:id,pointerType:'touch',buttons:0,clientX:p.lastX,clientY:p.lastY,nativeTouchTime};
    target.dispatchEvent(new InputEvent('pointercancel',{...options,bubbles:true}));
    win.dispatchEvent(new InputEvent('pointercancel',options));
    pointers.delete(id);captured.delete(id);
  }
  function touches(kind,event){
    if(host.bootDiagnostics?.completed===false)return;
    const run=win.__pb?.run;
    const hiddenHud=!win.__pb?.screen&&castHidesUI(run,perf.now());
    // A press begun in combat must not select a card while it is appearing.
    if(modalTransition.active||(hiddenHud&&run.state!=='play')){
      for(const [id,p] of pointers)cancelPointer(id,p,event.timeStamp);
      return;
    }
    // Menus still react immediately. In battle, DOM mutations invalidate the
    // controls that actually changed; an empty-space swipe needs no UI upload.
    if(kind!=='move'&&win.__pb?.run?.state!=='play'&&!modalTransition.element)uiFrames.invalidate(false,true);
    const local=t=>{
      const x=(t.clientX??t.pageX??t.x)-view.x,y=(t.clientY??t.pageY??t.y)-view.y;
      return {...t,identifier:t.identifier,clientX:x,clientY:y,pageX:x,pageY:y};
    };
    const all=Array.from(event.touches||[],local);
    let changed=Array.from(event.changedTouches||[],local);
    // A later snapshot can be the only evidence of a missed native touchend.
    // Reconcile before new presses so their controls can claim the released ID.
    if(event.touches!=null && (changed.length||kind==='move'||kind==='down')){
      for(const [id,p] of pointers){
        const listed=changed.some(t=>(t.identifier??0)===id);
        if((kind==='down'&&listed) || (!listed&&!all.some(t=>(t.identifier??0)===id))){
          cancelPointer(id,p,event.timeStamp);
        }
      }
    }
    if(!changed.length){
      if(kind==='up'||kind==='cancel'){
        // A single entry-button press can finish at its last known position.
        // Ambiguous releases and combat contacts still receive cancellation.
        const live=new Set(all.map(t=>t.identifier??0));
        const single=pointers.size===1?pointers.values().next().value:null;
        changed=Array.from(pointers,([identifier,p])=>({identifier,clientX:p.lastX,clientY:p.lastY}))
          .filter(t=>!live.has(t.identifier));
        if(!single?.entryButton||event.touches==null||live.size)kind='cancel';
      }else changed=kind==='down'?all.filter(t=>!pointers.has(t.identifier??0)):all;
    }
    const touchType='touch'+({down:'start',move:'move',up:'end',cancel:'cancel'}[kind]);
    for(const t of changed){
      const id=t.identifier??0,x=t.clientX,y=t.clientY;
      let p=pointers.get(id);
      if(kind==='down'){
        if(x<0||y<0||x>=view.w||y>=view.h)continue;
        const entry=env.__zixingApp?.screen;
        let target=layout.hit(x,y);
        if(hiddenHud){
          // Track button contacts through release without giving them the stick.
          target=target.closest?.('.tc-btn')?doc.body:run.ui.touch.el;
        }
        const entryButton=entry?.dataset.page==='home'&&entry.contains(target)&&target.closest?.('button');
        p={target,entryButton,x,y,lastX:x,lastY:y,scrolled:false};pointers.set(id,p);
      }
      if(!p)continue;
      if(p.entryButton&&Math.hypot(x-p.x,y-p.y)>=15)p.scrolled=true;
      const target=captured.get(id)||p.target,options={pointerId:id,pointerType:'touch',clientX:x,clientY:y,pageX:x,pageY:y,button:0,buttons:kind==='up'?0:1,isPrimary:pointers.keys().next().value===id,bubbles:true};
      // 保留微信采样时刻。派发时生成的 DOM 时间戳会把积压的多次转向挤到同一帧。
      options.nativeTouchTime = event.timeStamp;
      if(kind==='move'&&target!==win.__pb?.run?.ui?.touch?.el&&p.target.type!=='range'&&Math.abs(y-p.y)>5){
        let remaining=p.lastY-y;
        for(let sc=p.target;sc&&remaining;sc=sc.parentElement){
          const style=layout.box(sc)?.s;
          if(sc._scrollMax>0&&/auto|scroll/.test([style?.overflow,style?.['overflow-y']].join(' '))){
            const before=sc.scrollTop;
            sc.scrollTop+=remaining;
            remaining-=sc.scrollTop-before;
            p.scrolled=true;
          }
        }
      }
      p.lastX=x;p.lastY=y;
      target.dispatchEvent(new InputEvent('pointer'+kind,options));
      win.dispatchEvent(new InputEvent('pointer'+kind,{...options,bubbles:false}));
      const contact={touches:all,changedTouches:[t],nativeTouchTime:event.timeStamp};
      target.dispatchEvent(new InputEvent(touchType,{...contact,bubbles:true}));
      // The virtual document has no parent window. Notify it before the next
      // pointerdown, including when both thumbs land in the same native event.
      win.dispatchEvent(new InputEvent(touchType,{...contact,bubbles:false}));
      const input=p.target.closest?.('input,textarea');
      if(input?.type==='range'&&(kind==='down'||kind==='move'))setRange(input,x);
      if(kind==='up'||kind==='cancel'){
        const releasedOnButton=!p.entryButton||layout.hit(x,y)?.closest?.('button')===p.entryButton;
        if(kind==='up'&&releasedOnButton&&!p.scrolled&&Math.hypot(x-p.x,y-p.y)<15&&!p.target.closest?.('[disabled]')){
          if(input){if(input.type==='checkbox'){input.checked=!input.checked;input.dispatchEvent(new InputEvent('change'));}
            else if(input.type==='range')input.dispatchEvent(new InputEvent('change'));else if(!['button','submit'].includes(input.type))keyboard(input);}
          env.onUiControlClick?.(p.target);
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
    nativeUI:true,nativeDevice:device,bootStage:host.bootStage,backgroundMusicEnabled:false,nativeGraphics:{pixelBudget:900000,maxPixelRatio:1.5},
    setNativeFrameRate:typeof wx.setPreferredFramesPerSecond==='function'?fps=>wx.setPreferredFramesPerSecond(fps):undefined,
    navigator:{userAgent:'MicroMessenger MiniGame',language:'zh-CN',languages:['zh-CN'],maxTouchPoints:5,onLine:true},
    AudioContext:wx.createWebAudioContext?class {constructor(){return wx.createWebAudioContext();}}:undefined,
    crypto:{getRandomValues(a){new Uint8Array(a.buffer,a.byteOffset,a.byteLength).set(random(a.byteLength));return a;}},
    structuredClone:cloneData,
    getComputedStyle:computed,matchMedia,setTimeout:(...args)=>setTimeout(...args),clearTimeout:id=>clearTimeout(id),
    setInterval:(...args)=>setInterval(...args),clearInterval:id=>clearInterval(id),performance:perf,requestAnimationFrame:raf,
    cancelAnimationFrame:typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout,
    addEventListener:win.addEventListener.bind(win),removeEventListener:win.removeEventListener.bind(win),dispatchEvent:win.dispatchEvent.bind(win),
    alert:msg=>wx.showModal({title:'字由搏击',content:String(msg),showCancel:false}),open:()=>null,
    prepareForest:host.files.prepareForest,readCompressedAsset:host.files.readCompressedAsset,repairVolumeSettings,
    entryViewport:()=>view,
    entryHint:title=>wx.showToast?.({title,icon:'none'}),
    createCoopSocket:events=>cloudSocket(wx,events),
    roomInvites:host.roomInvites,
    askRoomCode:()=>new Promise((resolve,reject)=>wx.showModal({title:'加入房间',editable:true,placeholderText:'请输入六位房间号',
      success:result=>resolve(result.confirm ? (result.content||'').trim() : null),fail:reject})),
    copyRoomCode:code=>new Promise((resolve,reject)=>wx.setClipboardData({data:code,success:resolve,fail:reject})),
    readRoomCode:()=>new Promise((resolve,reject)=>wx.getClipboardData({success:r=>resolve(r.data),fail:reject})),
    setUIPerformance(){
      // Settings also change inherited CSS variables (e.g. button size).
      // Refresh their hit boxes even when the pixel ratio stays the same.
      uiFrames.invalidate(true,true);modalTransition.invalidate();
      const next=uiScale(view);
      if(Math.abs(next-scale)<.001)return;
      scale=env.uiPixelRatio=next;
      uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
      layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);uiFrames.invalidate(true,true);
    },
    invalidateUI:()=>uiFrames.invalidate(false,true),
    castHidesUI:run=>castHidesUI(run,perf.now()),
    castHudLeadMs,
    animateModal(wrap){modalTransition.begin(wrap,env.__pb?.run);},
    closeAnimatedModal(wrap,done,keepBackdrop){modalTransition.close(wrap,done,keepBackdrop,perf.now());},
    modalAnimating:()=>modalTransition.active,
    hasFrozenUpgrade:run=>!env.__pb?.screen&&upgradeCue(run)&&draw?.hasFrozen(run),
    drawFrozenModal(renderer){
      return env.__pb?.run?.state==='modal'&&env.drawFrozenUpgrade(renderer);
    },
    drawFrozenUpgrade(renderer){
      const key=frozenUpgradeKey();
      if(!key||!draw?.hasFrozen(key))return false;
      env.drawUI(renderer,false,key);return true;
    },
    drawUI(renderer,opaque=false,frozenFrame=null){
      // The renderer floors fractional DPR sizes. Match the device-sized UI
      // buffer while inspecting original pixels to avoid a final resample.
      if(view.originalPixels&&(host.canvas.width!==uiCanvas.width||host.canvas.height!==uiCanvas.height)){
        host.canvas.width=uiCanvas.width;host.canvas.height=uiCanvas.height;
        uiFrames.invalidate(false,true);
      }
      const now=perf.now();
      modalTransition.advance(now);
      mutations(observer.takeRecords());
      const run=env.__pb?.run,state=run?.state;
      if(run&&!ultimateCast)prepareCastArt();
      const captureTrack=drawCapture(renderer,env.__zixingApp?.run);
      const overlay=modalTransition.element;
      layout.setOverlay(overlay);
      const playing=usingBattleHUD()&&!opaque;
      const page=env.__zixingApp?.screen,camera=opaque&&page?._journeyCamera;
      if(!!camera!==!!lastJourneyCamera)uiFrames.invalidate(false,true);
      const changed=uiFrames.draw(now,captureTrack?'capture-bag':opaque?'opaque':playing?'play':state,layout,boxes=>{
        if(captureTrack){
          paint(layout,boxes.filter(box=>captureTrack.contains(box.el)),view,scale);
          return;
        }
        // Classify once in paint order. A full HUD refresh used to walk the
        // ancestors of every box separately for every tile, then again for the base.
        const groups=new Map(),base=[],tiles=run?.coop?coopTiles:soloTiles;
        if(playing)for(const tile of activeHudLayers())tile.refreshIfDirty(layout);
        for(const box of boxes){
          if(camera&&box.el.dataset?.journeyBackdrop==='true')continue;
          const element=box.el.nodeType===1?box.el:box.el.parentElement;
          const tile=playing?tiles.get(layerId(element)):null;
          if(tile){
            let parts=groups.get(tile);
            if(!parts)groups.set(tile,parts=[]);
            parts.push(box);
          }else if(playing||!controls.owns(element))base.push(box);
        }
        for(const tile of allTiles)tile.capture(groups.get(tile)||emptyBoxes,layout);
        paint(layout,base,view,scale);
      });
      if(!draw)draw=compositor(renderer.getContext(),uiCanvas);
      if(captureTrack){draw(renderer,changed,false,[],null,run);return;}
      if(camera){
        const tile=(canvas,x,y,w,h,slot,dirty)=>({canvas:canvas._surface,x:(view.x+x)*scale,y:(view.y+y)*scale,
          width:w*scale,height:h*scale,slot,changed:dirty});
        const layers=[tile(camera.desk,camera.x,camera.y,camera.width,camera.height,25,camera.desk!==lastJourneyCamera?.desk)];
        if(camera.actor)layers.push(tile(camera.actor,camera.cx-camera.size/2,camera.cy-camera.size/2,
          camera.size,camera.size,26,camera.actor!==lastJourneyCamera?.actor));
        draw(renderer,changed,true,layers,null,null,page._journeyFade?.controls??1);
        lastJourneyCamera=camera;
        return;
      }
      const finishedJourney=!!lastJourneyCamera;
      lastJourneyCamera=null;
      if(opaque&&!changed)return;
      const cast=!opaque&&run&&ultimateCast(run,view,scale,now);
      const title=cast&&comboNameplate(run,cast.band,scale,now);
      if(!opaque&&castHidesUI(run,now)){
        draw(renderer,changed,false,[],frozenFrame||frozenUpgradeKey(),run,0);
        run.dragonHd?.drawFlash(renderer);
        run.vfx?.upgrade?.screen?.draw(renderer);
        draw.topLayers(renderer,[cast?.flame,title,cast?.blade]);
        return;
      }
      modalTransition.prepare(layout,view,scale);
      const cue=modalTransition.cue(!opaque&&upgradeCue(run)?run:null,view,scale,now);
      const layers=[playing&&run.coop?teamLayer.draw(layout,view,scale,true):null,controls.draw(layout,view,scale,playing),minimap.draw(layout,view,scale,playing),health.draw(layout,view,scale,playing),speech.draw(layout,view,scale,playing),...(playing&&run.coop?peerTiles.map(tile=>tile.draw(layout,view,scale,true)):[]),portrait.draw(layout,view,scale,playing),...normalSoloLayers.map(tile=>tile.draw(layout,view,scale,playing)),cue,...modalTransition.layers(scale)];
      if(playing&&state==='play')layers.push(...readyBlink(run,view,scale));
      draw(renderer,changed,opaque,layers,opaque?null:frozenFrame||frozenUpgradeKey(),opaque?null:run);
      run?.dragonHd?.drawFlash(renderer);
      run?.vfx?.upgrade?.screen?.draw(renderer);
      const plate=castNameplate.draw(layout,view,scale,playing);
      if(plate||cast)draw.topLayers(renderer,[plate,cast?.flame,title,cast?.blade]);
      if(finishedJourney)draw.releaseUnused();
      if(overlay)modalTransition.presented(perf.now());
    },
    readChineseText(){return JSON.parse(fs.readFileSync(host.files.pathFor('text/ui.json'),'utf8'));},
  });
  env.window=env.self=env.globalThis=env;
  const drawCapture=createCaptureOverlay(env,host.files);
  wx.onWindowResize?.(()=>{
    const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
    Object.assign(view,viewport(info));
    env.innerWidth=env.screen.width=view.w;env.innerHeight=env.screen.height=view.h;
    env.devicePixelRatio=view.dpr;
    scale=env.uiPixelRatio=uiScale(view);uiCanvas.width=Math.round(view.width*scale);uiCanvas.height=Math.round(view.height*scale);
    layout=createLayout(doc,view,uiCanvas,fonts,uiAssets);uiFrames.invalidate(true,true);modalTransition.invalidate();
    for(const query of queries.values()){
      const matches=mediaMatches(query.media,view);
      if(matches!==query.matches){query.matches=matches;query.dispatchEvent(new InputEvent('change',{matches,media:query.media}));}
    }
    env.dispatchEvent(new D.Event('resize'));
  });
  if(host.inspect)host.inspect({env,doc,get layout(){return layout;},touches,uiCanvas,controls,minimap,health,portrait,get hudLayers(){return activeHudLayers();},modalTransition});
  return env;
}
