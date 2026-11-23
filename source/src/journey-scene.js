import {drawAppearanceGlyph} from './collection-art.js';

// Each shot looks at the same point on the desk (the player's feet).
const selectionShot={scale:1.96,origin:244,height:.195,actor:.40};
const shots={
  home:{scale:1.25,origin:195,height:.48,actor:.40},
  choose:selectionShot,
  map:selectionShot,
  entry:{scale:1.54,origin:222,height:.29,actor:.31},
  play:{scale:1,origin:195,height:.545,actor:.168},
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
  function prepare(){
    if(!deskReady)deskReady=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{desk=image;paint();resolve();};
      image.onerror=()=>{deskReady=null;resolve();};
      image.src='assets/ui-paper/journey-desk.png';
    });
    return deskReady;
  }
  function paint(){
    if(!node.isConnected)return;
    const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
    const d=Math.min(2,window.devicePixelRatio||1),margin=window.nativeUI?96:0;
    const pw=Math.round((w+2*margin)*d),ph=Math.round((h+2*margin)*d);
    if(node.width!==pw||node.height!==ph){node.width=pw;node.height=ph;}
    if(node.dataset.sceneMargin!==String(margin))node.dataset.sceneMargin=String(margin);
    const ctx=node.getContext('2d');
    ctx.setTransform(d,0,0,d,margin*d,margin*d);
    ctx.fillStyle='#E5E6D8';ctx.fillRect(-margin,-margin,w+2*margin,h+2*margin);
    const scale=Math.max(w/390,(h+margin)/844)*pose.scale,cx=w*.5,cy=h*pose.height;
    if(desk?.width&&desk.complete!==false)ctx.drawImage(desk,cx-scale*pose.origin,cy-scale*461,390*scale,844*scale);
    if(word){
      const size=Math.min(w*pose.actor,h*.21);
      ctx.save();ctx.translate(cx,cy+size*.36);ctx.scale(1,.24);
      ctx.beginPath();ctx.arc(0,0,size*.265,0,Math.PI*2);ctx.fillStyle='rgba(45,49,66,.21)';ctx.fill();ctx.restore();
      ctx.drawImage(actor,cx-size/2,cy-size/2,size,size);
    }
    window.invalidateUI?.();
  }
  function moveTo(name,instant=false){
    if(!instant&&shots[target]===shots[name]){target=name;return;}
    const ticket=++motion,from=pose,to=shots[name];target=name;
    if(instant){pose=to;paint();return;}
    animate(520,t=>{pose=between(from,to,ease(t));paint();},()=>ticket===motion&&node.isConnected);
  }
  function fade(page,from,to,ms){
    const ticket=++presentation,controls=Array.from(page.children).filter(el=>el!==node);
    return animate(ms,t=>{
      const value=from+(to-from)*ease(t);
      if(window.nativeUI)page._journeyFade=value===1?null:{scene:1,controls:value};
      else for(const el of controls)el.style.opacity=t===1&&to===1?'':String(value);
      window.invalidateUI?.();
    },()=>ticket===presentation&&node.parentNode===page&&page.isConnected);
  }
  async function travel(name,open){
    const page=node.parentNode;
    if(!page?.isConnected)return open();
    if(leaving)return;
    leaving=true;page.style.pointerEvents='none';
    const previous=page.dataset.page;
    try{
      moveTo(name);
      if(await fade(page,1,0,130))return await open();
    }finally{
      leaving=false;
      if(page.isConnected&&page.dataset.page===previous){
        page.style.pointerEvents='';moveTo(previous);fade(page,0,1,140);
      }
    }
  }
  function mount(page,c,look){
    const sameScene=node.parentNode===page,changed=page.dataset.page!==node.dataset.shot;
    page._journeyFade=null;
    page.classList.add('journey-prep');page.dataset.paperSurface='flat';
    if(!sameScene)page.insertBefore(node,page.firstChild);
    prepare();
    const key=(c?.word||'')+'/'+(look||'');
    if(identity!==key){word=c?.word||'';if(word)drawAppearanceGlyph(actor,word,c.tone,look,true);identity=key;}
    node.dataset.word=word;node.dataset.look=look||'normal';node.dataset.shot=page.dataset.page;
    moveTo(page.dataset.page,!sameScene);
    paint();
    if(sameScene&&changed&&page.dataset.page!=='entry')fade(page,0,1,235);
  }
  window.addEventListener('resize',paint);
  async function reveal(app,page){
    if(app.screen!==page)return;
    ++motion;++presentation;
    page.querySelector('.zx-body').style.display='none';
    const siblings=Array.from(app.ui.children).filter(el=>el!==page&&el.style.display!=='none');
    const previous=siblings.map(el=>el.style.visibility);
    const camera=app.r.camera,aspect=camera.aspect,view=camera.view?{...camera.view}:null;
    const from=pose,p=app.run.player.pos,point=app.run.ui.project(app.run,p.x,p.y+1,p.z);
    const endX=point.vis?point.x/window.innerWidth:.5,endY=point.vis?point.y/window.innerHeight:.545;
    const end={...shots.play,height:endY};
    siblings.forEach(el=>{el.style.visibility='hidden';});
    try{
      await animate(730,t=>{
        const s=ease(t),scale=1+(from.scale-1)*(1-s);
        pose=between(from,end,s);paint();
        // Both cameras keep the same subject on screen throughout the handoff.
        camera.setViewOffset(aspect,1,aspect*(endX-(.5+(endX-.5)*s)/scale),endY-pose.height/scale,aspect/scale,1/scale);
        const alpha=1-ease(Math.max(0,Math.min(1,(t-.32)/.50)));
        if(window.nativeUI)page._journeyFade={scene:alpha,controls:0};
        else page.style.opacity=String(alpha);
        app.r.needsDraw=true;app.r.render(0);
        window.invalidateUI?.();window.drawUI?.(app.r.renderer);
      },()=>app.screen===page);
    }finally{
      if(view?.enabled)camera.setViewOffset(view.fullWidth,view.fullHeight,view.offsetX,view.offsetY,view.width,view.height);
      else camera.clearViewOffset();
      camera.aspect=aspect;camera.updateProjectionMatrix();
      siblings.forEach((el,i)=>{el.style.visibility=previous[i]||'';});
    }
  }
  return {prepare,mount,travel,reveal};
}
