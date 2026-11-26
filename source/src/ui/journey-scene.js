import {heroActionFrame} from '../actors/hero-actions.js';
import {heroActionCatalog} from '../actors/hero-action-catalog.js';
import {drawAppearanceGlyph,tintGlyph} from './collection-art.js';
import {paintLoadingBackdrop} from './menu-scene.js';

// Each shot anchors the portrait ring to the same point on the desk.
const shots={home:0,choose:1,map:1};
const showsIdlePortrait=shot=>shot==='home'||shot==='choose';
const mix=(from,to,t)=>from+(to-from)*t;
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const ease=t=>t*t*(3-2*t);
const portraitTilt=.22;
const portraitLayerScale=1.6;

// Measure the tilted silhouette so asymmetric strokes and transparent atlas
// margins do not pull the standing figure to one side of its ground ring.
function portraitBounds(image,columns=1,count=1){
  const span=80,cell=116,sourceCell=image.width/columns,sample=document.createElement('canvas');
  sample.width=columns*cell;sample.height=Math.ceil(count/columns)*cell;
  const ctx=sample.getContext('2d');
  for(let tile=0;tile<count;tile++){
    const col=tile%columns,row=Math.floor(tile/columns);
    ctx.save();ctx.translate((col+.5)*cell,(row+.5)*cell);ctx.rotate(portraitTilt);
    ctx.drawImage(image,col*sourceCell,row*sourceCell,sourceCell,sourceCell,-span/2,-span/2,span,span);
    ctx.restore();
  }
  const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
  const poses=Array.from({length:count},(_,tile)=>{
    const left=tile%columns*cell,top=Math.floor(tile/columns)*cell;
    let bottom=-1,minX=cell,maxX=-1;
    for(let y=0;y<cell;y++){
      for(let x=0;x<cell;x++){
        if(pixels[((top+y)*sample.width+left+x)*4+3]<64)continue;
        bottom=y;
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      }
    }
    return bottom<0?{centerX:0,bottom:.5,width:0}:{
      centerX:((minX+maxX+1)/2-cell/2)/span,bottom:(bottom+1-cell/2)/span,width:(maxX-minX+1)/span,
    };
  });
  // One fit for the entire idle cycle preserves the size of the animated sprite.
  return {poses,width:Math.max(...poses.map(pose=>pose.width))};
}
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
  let moving=false,blending=false,actorLayer=null,actorBounds;
  let idle=null,idleSheet=null,webFrame=0;
  function prepareIdle(id,look){
    const catalog=heroActionCatalog[id];
    if(!catalog){idle=null;idleSheet=null;return;}
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
      state.bounds=portraitBounds(idleSheet,catalog.columns,catalog.clips.idle.count);
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
    const floorY=cy+size*.30;
    ctx.save();ctx.translate(cx,floorY);ctx.scale(1,.50);
    ctx.beginPath();ctx.arc(0,0,size*.36,0,Math.PI*2);ctx.lineWidth=size*.065;
    ctx.strokeStyle='rgba(216,246,228,.86)';ctx.stroke();ctx.restore();
    const bounds=frame?idle.bounds:actorBounds;
    const pose=bounds.poses[frame?.index??0];
    const naturalScale=frame?.renderScale??1;
    const span=size*Math.min(naturalScale,.60/(bounds.width||1));
    // The front rim stays visible below the feet. The whole figure is centered
    // horizontally, including poses whose lowest stroke is off to one side.
    ctx.save();ctx.translate(cx-span*pose.centerX,floorY+size*.05-span*pose.bottom);ctx.rotate(portraitTilt);
    if(frame){
      const cell=idleSheet.width/idle.columns,tile=frame.index;
      ctx.drawImage(idleSheet,tile%idle.columns*cell,Math.floor(tile/idle.columns)*cell,cell,cell,
        -span/2,-span/2,span,span);
    }else ctx.drawImage(actor,-span/2,-span/2,span,span);
    ctx.restore();
  }
  function idleLayer(now){
    const frame=heroActionFrame(idle.playback,idle.id,'idle',now);
    if(idle.frame!==frame.index){
      if(!idle.layer){
        idle.layer=document.createElement('canvas');
        idle.layer.width=idle.layer.height=Math.ceil(actor.width*portraitLayerScale);
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
    // Center the portrait in the space between the header and the album (.journey-air).
    const compact=h<=680;
    const airHeight=compact?Math.max(66,h*.19):Math.min(w*.45,h*.274);
    const cx=w*.5,cy=mix(h*.477,(compact?54:62)+airHeight/2,pose);
    const size=Math.min(w*.345,h*.21,airHeight/1.3);
    const scale=Math.max(w/390,(h+margin)/844)*mix(2.26,2.10,pose);
    const x=cx-scale*mix(172,174,pose),y=cy-scale*370;
    const page=node.parentNode;
    page._journeyIdle=null;
    const showIdle=word&&idleSheet&&showsIdlePortrait(node.dataset.shot)&&!reduced();
    if(window.nativeUI&&showIdle&&!moving&&!blending&&desk){
      page._journeyCamera=null;
      const camera={desk,x,y,width:390*scale,height:844*scale,cx,cy,size:size*portraitLayerScale};
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
      if(word&&!showIdle&&!actorLayer){
        actorLayer=document.createElement('canvas');
        actorLayer.width=actorLayer.height=Math.ceil(actor.width*portraitLayerScale);
        drawActor(actorLayer.getContext('2d'),actorLayer.width/2,actorLayer.height/2,actor.width);
      }
      // The native compositor can move these two textures without repainting the album.
      const portrait=showIdle?idleLayer(performance.now()):word&&actorLayer;
      page._journeyCamera={desk,x,y,width:390*scale,height:844*scale,actor:portrait,
        frame:showIdle?idle.frame:undefined,cx,cy,size:size*portraitLayerScale};
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
      const side=size*portraitLayerScale;
      ctx.drawImage(layer,cx-side/2,cy-side/2,side,side);
      if(!window.nativeUI&&!moving&&!webFrame)webFrame=window.requestAnimationFrame(()=>{webFrame=0;paint();});
    }else if(word)drawActor(ctx,cx,cy,size);
    window.invalidateUI?.();
  }
  function moveTo(name,instant=false){
    if(!instant&&shots[target]===shots[name]){target=name;return;}
    const ticket=++motion,from=pose,to=shots[name];target=name;
    if(instant){moving=false;pose=to;return;}
    return animate(520,t=>{moving=t<1;pose=mix(from,to,ease(t));paint();},()=>ticket===motion&&node.isConnected);
  }
  function fade(page,from,to,ms){
    const ticket=++presentation,controls=Array.from(page.children).filter(el=>el!==node);
    return animate(ms,t=>{
      const value=from+(to-from)*ease(t);
      if(window.nativeUI){
        page._journeyFade=value===1?null:{scene:1,controls:value};
        // Once the camera arrives, fade ticks keep the idle animation playing.
        if(blending!==(t<1)||(!moving&&page._journeyCamera?.frame!=null)){blending=t<1;paint();}
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
    if(identity!==key){
      word=c?.word||'';
      if(word){
        drawAppearanceGlyph(actor,word,c.tone,look,true);
        actorBounds=portraitBounds(actor);
      }
      actorLayer=null;identity=key;
    }
    node.dataset.word=word;node.dataset.look=look||'normal';node.dataset.shot=page.dataset.page;
    if(showsIdlePortrait(page.dataset.page)&&c&&!reduced())prepareIdle(c.id,look);
    if(page.dataset.page==='map'||page.dataset.page==='entry')preparePoster();
    if(page.dataset.page==='entry'){++motion;moving=false;}
    else moveTo(page.dataset.page,!sameScene);
    paint();
    if(sameScene&&changed&&page.dataset.page!=='entry')fade(page,0,1,235);
  }
  window.addEventListener('resize',paint);
  return {prepare,mount,travel};
}
