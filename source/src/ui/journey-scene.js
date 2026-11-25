import {drawAppearanceGlyph} from './collection-art.js';
import {paintLoadingBackdrop} from './menu-scene.js';

// Each shot looks at the same point on the desk (the player's feet).
const selectionShot={scale:1.96,origin:244,height:.195,actor:.40};
const shots={
  home:{scale:1.25,origin:195,height:.48,actor:.40},
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
  let moving=false,blending=false,actorLayer=null;
  function prepare(){
    if(!deskReady)deskReady=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{desk=image;paint();resolve();};
      image.onerror=()=>{deskReady=null;resolve();};
      image.src='assets/ui-paper/journey-desk.webp';
    });
    return deskReady;
  }
  function drawActor(ctx,cx,cy,size){
    ctx.save();ctx.translate(cx,cy+size*.36);ctx.scale(1,.24);
    ctx.beginPath();ctx.arc(0,0,size*.265,0,Math.PI*2);ctx.fillStyle='rgba(45,49,66,.21)';ctx.fill();ctx.restore();
    ctx.drawImage(actor,cx-size/2,cy-size/2,size,size);
  }
  function paint(){
    if(!node.isConnected)return;
    const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
    const d=Math.min(2,window.devicePixelRatio||1),margin=96;
    const scale=Math.max(w/390,(h+margin)/844)*pose.scale,cx=w*.5,cy=h*pose.height;
    const x=cx-scale*pose.origin,y=cy-scale*461,size=Math.min(w*pose.actor,h*.21);
    const page=node.parentNode;
    if((moving||blending)&&desk&&node.dataset.shot!=='entry'){
      if(word&&!actorLayer){
        actorLayer=document.createElement('canvas');
        actorLayer.width=actorLayer.height=actor.width;
        drawActor(actorLayer.getContext('2d'),actor.width/2,actor.width/2,actor.width);
      }
      // The native compositor can move these two textures without repainting the album.
      page._journeyCamera={desk,x,y,width:390*scale,height:844*scale,actor:word&&actorLayer,cx,cy,size};
      return;
    }
    page._journeyCamera=null;
    const pw=Math.round((w+2*margin)*d),ph=Math.round((h+2*margin)*d);
    if(node.width!==pw||node.height!==ph){node.width=pw;node.height=ph;}
    if(node.dataset.sceneMargin!==String(margin))node.dataset.sceneMargin=String(margin);
    const ctx=node.getContext('2d');
    ctx.setTransform(d,0,0,d,margin*d,margin*d);
    if(node.dataset.shot==='entry'){
      const scale=Math.min(w/390,h/550);
      // Continue the poster into the native safe-area gutters.
      ctx.fillStyle='#292943';ctx.fillRect(-margin,-margin,w+2*margin,h+2*margin);
      ctx.fillStyle='#21253F';ctx.fillRect(-margin,h,w+2*margin,margin);
      ctx.save();ctx.scale(scale,scale);
      paintLoadingBackdrop(ctx,w/scale,h/scale,(c,_word,x,y,size)=>c.drawImage(actor,x,y,size,size),word);ctx.restore();
      window.invalidateUI?.();return;
    }
    ctx.fillStyle='#E5E6D8';ctx.fillRect(-margin,-margin,w+2*margin,h+2*margin);
    if(desk?.width&&desk.complete!==false)ctx.drawImage(desk,x,y,390*scale,844*scale);
    if(word)drawActor(ctx,cx,cy,size);
    window.invalidateUI?.();
  }
  function moveTo(name,instant=false){
    if(!instant&&shots[target]===shots[name]){target=name;return;}
    const ticket=++motion,from=pose,to=shots[name];target=name;
    if(instant){moving=false;pose=to;return;}
    return animate(520,t=>{moving=t<1;pose=between(from,to,ease(t));paint();},()=>ticket===motion&&node.isConnected);
  }
  function fade(page,from,to,ms){
    const ticket=++presentation;
    return animate(ms,t=>{
      const value=from+(to-from)*ease(t);
      page._journeyFade=value===1?null:{scene:1,controls:value};
      if(blending!==(t<1)){blending=t<1;paint();}
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
    if(page.dataset.page==='entry'){++motion;moving=false;}
    else moveTo(page.dataset.page,!sameScene);
    paint();
    if(sameScene&&changed&&page.dataset.page!=='entry')fade(page,0,1,235);
  }
  window.addEventListener('resize',paint);
  return {prepare,mount,travel};
}
