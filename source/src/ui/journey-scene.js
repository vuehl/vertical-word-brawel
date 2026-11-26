import {heroActionFrame} from '../actors/hero-actions.js';
import {heroActionCatalog} from '../actors/hero-action-catalog.js';
import {drawAppearanceGlyph,tintGlyph} from './collection-art.js';
import {paintLoadingBackdrop} from './menu-scene.js';

// Each shot looks at the same point on the desk (the player's feet).
const selectionShot={scale:2.10,origin:174,height:.216,actor:.345};
const shots={
  home:{scale:2.26,origin:172,height:.477,actor:.365},
  choose:selectionShot,
  map:selectionShot,
};
function between(a,b,t){
  const mix=k=>a[k]+(b[k]-a[k])*t;
  return {scale:mix('scale'),origin:mix('origin'),height:mix('height'),actor:mix('actor')};
}
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const ease=t=>t*t*(3-2*t);
function animate(ms,draw,valid){
  const start=performance.now();
  return new Promise(resolve=>{
    let finished=false;
    function finish(ok){finished=true;clearTimeout(fallback);resolve(ok);}
    function frame(force=false){
      if(finished)return;
      if(!valid())return finish(false);
      const t=force||reduced()||document.hidden?1:Math.min(1,(performance.now()-start)/ms);
      draw(t);
      if(t===1)return finish(true);
      window.requestAnimationFrame(()=>frame());
    }
    const fallback=setTimeout(()=>frame(true),ms+100);
    frame();
  });
}

export function journeyScene(){
  const node=document.createElement('canvas'),actor=document.createElement('canvas');
  node.className='journey-scene';node.dataset.static='true';node.setAttribute('aria-hidden','true');
  node.dataset.journeyBackdrop='true';
  let desk=null,deskReady=null,pose=shots.home,target='',identity='',word='',motion=0,presentation=0,leaving=false;
  let poster=null,posterLoad=null;
  let moving=false,blending=false,actorLayer=null;
  let idle=null,idleSheet=null,webFrame=0;
  function prepareIdle(id,look){
    const catalog=heroActionCatalog[id];
    if(!catalog)return;
    if(idle?.id===id&&idle.look===look)return;
    const state=idle={id,look,playback:{},frame:-1,columns:catalog.columns};
    idleSheet=null;
    const image=new Image();
    image.onload=()=>{
      if(idle!==state)return;
      if(look==='shiny'||look==='classic'){
        const tinted=document.createElement('canvas');
        tinted.width=image.width;tinted.height=image.height;
        tinted.getContext('2d').drawImage(image,0,0);
        idleSheet=tintGlyph(tinted,look);
      }else idleSheet=image;
      paint();
    };
    image.onerror=()=>{if(idle===state)idle=null;};
    image.src='assets/ui-paper/home-idle-'+id+'.webp';
  }
  function prepare(){
    if(!deskReady)deskReady=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{desk=image;paint();resolve();};
      image.onerror=()=>{deskReady=null;resolve();};
      image.src='assets/ui-paper/journey-desk.webp';
    });
    return deskReady;
  }
  function preparePoster(){
    if(poster||posterLoad)return;
    const image=new Image();posterLoad=image;
    image.onload=()=>{poster=image;posterLoad=null;paint();};
    image.onerror=()=>{posterLoad=null;};
    image.src='assets/ui-paper/loading-poster.webp';
  }
  function drawActor(ctx,cx,cy,size,frame){
    ctx.save();ctx.translate(cx,cy+size*.31);ctx.scale(1,.90);
    ctx.beginPath();ctx.arc(0,0,size*.36,0,Math.PI*2);ctx.lineWidth=size*.065;
    ctx.strokeStyle='rgba(216,246,228,.86)';ctx.stroke();ctx.restore();
    if(frame){
      const cell=idleSheet.width/idle.columns,tile=frame.index,span=size*frame.renderScale;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(.22);
      ctx.drawImage(idleSheet,tile%idle.columns*cell,Math.floor(tile/idle.columns)*cell,cell,cell,
        -span/2,size*.44-span,span,span);
      ctx.restore();
      return;
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(.22);
    ctx.drawImage(actor,-size/2,-size/2,size,size);ctx.restore();
  }
  function idleLayer(now){
    const frame=heroActionFrame(idle.playback,idle.id,'idle',now);
    if(idle.frame!==frame.index){
      if(!idle.layer){
        idle.layer=document.createElement('canvas');
        idle.layer.width=idle.layer.height=Math.ceil(actor.width*1.4);
      }
      const tile=idle.layer,ctx=tile.getContext('2d');
      ctx.clearRect(0,0,tile.width,tile.height);
      drawActor(ctx,tile.width/2,tile.height/2,actor.width,frame);
      idle.frame=frame.index;
    }
    return idle.layer;
  }
  function paint(){
    if(!node.isConnected)return;
    const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
    const d=Math.min(2,window.devicePixelRatio||1),margin=window.nativeUI?96:0;
    const scale=Math.max(w/390,(h+margin)/844)*pose.scale,cx=w*.5,cy=h*pose.height;
    const x=cx-scale*pose.origin,y=cy-scale*370,size=Math.min(w*pose.actor,h*.21);
    const page=node.parentNode;
    page._journeyIdle=null;
    const showIdle=idleSheet&&node.dataset.shot==='home'&&!moving&&!blending&&!reduced();
    if(window.nativeUI&&showIdle&&desk){
      page._journeyCamera=null;
      const camera={desk,x,y,width:390*scale,height:844*scale,cx,cy,size:size*1.4};
      let last;
      page._journeyIdle=now=>{
        const actor=idleLayer(now);
        if(!last||last.frame!==idle.frame)last={...camera,actor,frame:idle.frame};
        return last;
      };
      window.invalidateUI?.();
      return;
    }
    if(window.nativeUI&&(moving||blending)&&desk&&node.dataset.shot!=='entry'){
      if(word&&!actorLayer){
        actorLayer=document.createElement('canvas');
        actorLayer.width=actorLayer.height=Math.ceil(actor.width*1.4);
        drawActor(actorLayer.getContext('2d'),actorLayer.width/2,actorLayer.height/2,actor.width);
      }
      // The native compositor can move these two textures without repainting the album.
      page._journeyCamera={desk,x,y,width:390*scale,height:844*scale,actor:word&&actorLayer,cx,cy,size:size*1.4};
      return;
    }
    page._journeyCamera=null;
    const pw=Math.round((w+2*margin)*d),ph=Math.round((h+2*margin)*d);
    if(node.width!==pw||node.height!==ph){node.width=pw;node.height=ph;}
    if(node.dataset.sceneMargin!==String(margin))node.dataset.sceneMargin=String(margin);
    const ctx=node.getContext('2d');
    ctx.setTransform(d,0,0,d,margin*d,margin*d);
    if(node.dataset.shot==='entry'){
      ctx.fillStyle='#F9BF25';ctx.fillRect(-margin,-margin,w+2*margin,h+2*margin);
      ctx.fillStyle='#252229';ctx.fillRect(-margin,h*.65,w+2*margin,h*.35+margin);
      paintLoadingBackdrop(ctx,w,h,poster);
      window.invalidateUI?.();return;
    }
    ctx.fillStyle='#E5E6D8';ctx.fillRect(-margin,-margin,w+2*margin,h+2*margin);
    if(desk?.width&&desk.complete!==false)ctx.drawImage(desk,x,y,390*scale,844*scale);
    if(showIdle){
      const layer=idleLayer(performance.now());
      ctx.drawImage(layer,cx-size*.7,cy-size*.7,size*1.4,size*1.4);
      if(!window.nativeUI&&!webFrame)webFrame=window.requestAnimationFrame(()=>{webFrame=0;paint();});
    }else if(word)drawActor(ctx,cx,cy,size);
    window.invalidateUI?.();
  }
  function moveTo(name,instant=false){
    if(!instant&&shots[target]===shots[name]){target=name;return;}
    const ticket=++motion,from=pose,to=shots[name];target=name;
    if(instant){moving=false;pose=to;return;}
    return animate(520,t=>{moving=t<1;pose=between(from,to,ease(t));paint();},()=>ticket===motion&&node.isConnected);
  }
  function fade(page,from,to,ms){
    const ticket=++presentation,controls=Array.from(page.children).filter(el=>el!==node);
    return animate(ms,t=>{
      const value=from+(to-from)*ease(t);
      if(window.nativeUI){
        page._journeyFade=value===1?null:{scene:1,controls:value};
        if(blending!==(t<1)){blending=t<1;paint();}
      }else for(const el of controls)el.style.opacity=t===1&&to===1?'':String(value);
      if(!page._journeyCamera)window.invalidateUI?.();
    },()=>ticket===presentation&&node.parentNode===page&&page.isConnected);
  }
  async function travel(name,open){
    const page=node.parentNode;
    if(!page?.isConnected)return open();
    if(leaving)return;
    leaving=true;page.style.pointerEvents='none';
    const previous=page.dataset.page;
    try{
      const camera=name!=='entry'&&moveTo(name);
      const hidden=await fade(page,page._journeyFade?.controls??1,0,130);
      if(!hidden)return;
      // Building and laying out all the album cards mid-zoom can skip several frames.
      if(previous==='home'&&name==='choose'&&camera&&!await camera)return;
      if(node.parentNode===page&&page.isConnected&&page.dataset.page===previous)return open();
    }finally{
      leaving=false;
      if(page.isConnected&&page.dataset.page===previous){
        page.style.pointerEvents='';moveTo(previous);fade(page,0,1,140);
      }
    }
  }
  function mount(page,c,look){
    const sameScene=node.parentNode===page,changed=page.dataset.page!==node.dataset.shot;
    ++presentation;blending=false;
    page._journeyFade=null;
    page.classList.add('journey-prep');page.dataset.paperSurface='flat';
    if(!sameScene)page.insertBefore(node,page.firstChild);
    prepare();
    const key=(c?.word||'')+'/'+(look||'');
    if(identity!==key){word=c?.word||'';if(word)drawAppearanceGlyph(actor,word,c.tone,look,true);actorLayer=null;identity=key;}
    node.dataset.word=word;node.dataset.look=look||'normal';node.dataset.shot=page.dataset.page;
    if(page.dataset.page==='home'&&c&&!reduced())prepareIdle(c.id,look);
    if(page.dataset.page==='map'||page.dataset.page==='entry')preparePoster();
    if(page.dataset.page==='entry'){++motion;moving=false;}
    else moveTo(page.dataset.page,!sameScene);
    paint();
    if(sameScene&&changed&&page.dataset.page!=='entry')fade(page,0,1,235);
  }
  window.addEventListener('resize',paint);
  return {prepare,mount,travel};
}
