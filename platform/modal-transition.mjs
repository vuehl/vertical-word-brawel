import {paint} from './paint.mjs';

// Keep the dialog in its own texture even after the intro settles. Opening,
// closing and chained choices only change GPU opacity/position, never layout.
export function createModalTransition(makeCanvas,duration=240,exitDuration=140){
  let target=null,started=null,panel,shade,content,backdrop,dirty=false,progress=0;
  let phase='idle',complete=null,keepShade=false,shadeStart=0,nextShade=false;
  let cueOwner=null,cueStarted=0,cueOpacity=0,cueShade;
  const connected=()=>!!target?.isConnected;
  return {
    begin(wrap,owner){
      target=wrap;started=null;content=backdrop=null;progress=0;phase='enter';complete=null;
      shadeStart=nextShade?1:owner&&owner===cueOwner?cueOpacity:0;
      cueOwner=null;nextShade=false;keepShade=false;
    },
    // The XP ring and this one-pixel backdrop start together. Keep the last
    // presented opacity when the card texture becomes available.
    cue(owner,view,scale,now){
      if(!owner||connected()){cueOwner=null;return null;}
      if(owner!==cueOwner){cueOwner=owner;cueStarted=now;}
      const fresh=!cueShade;
      if(fresh){
        cueShade=makeCanvas();cueShade.width=cueShade.height=1;
        const ctx=cueShade.getContext('2d');ctx.fillStyle='#28233980';ctx.fillRect(0,0,1,1);
      }
      cueOpacity=.12+.48*Math.min(1,Math.max(0,now-cueStarted)/120);
      return {canvas:cueShade,x:0,y:0,width:view.width*scale,height:view.height*scale,slot:3,opacity:cueOpacity,changed:fresh||now===cueStarted};
    },
    close(wrap,done,retainBackdrop=false){
      if(target!==wrap||!connected()||!content){done();return;}
      if(phase==='exit')return;
      phase='exit';started=null;progress=0;complete=done;keepShade=retainBackdrop;
    },
    get active(){return connected()&&phase!=='settled';},
    get canvases(){return [panel,shade].filter(Boolean);},
    get snapshot(){return {active:connected()&&phase!=='settled',phase,progress,started,duration:phase==='exit'?exitDuration:duration};},
    advance(now){
      if(!target)return false;
      if(!connected()){
        target=null;content=backdrop=null;complete=null;phase='idle';nextShade=false;return true;
      }
      if(phase==='settled')return false;
      progress=started===null?0:Math.max(0,Math.min(1,(now-started)/(phase==='exit'?exitDuration:duration)));
      if(progress<1)return false;
      if(phase==='enter'){phase='settled';return false;}
      const done=complete;nextShade=keepShade;
      target=null;content=backdrop=null;complete=null;phase='idle';
      done?.();
      // A queued choice may already have called begin(). Preserve its shade
      // only in that case, never into an unrelated future dialog.
      nextShade=false;
      return true;
    },
    capture(layout,boxes,view,scale){
      if(!connected())return boxes;
      const root=boxes.find(b=>b.el===target),body=boxes.find(b=>b.el===target.firstElementChild);
      if(!root||!body)return boxes;
      const owned=b=>b.el===target||target.contains(b.el);
      const pad=4,x=Math.floor((body.x+view.x-pad)*scale),y=Math.floor((body.y+view.y-pad)*scale);
      const width=Math.ceil((body.w+pad*2)*scale),height=Math.ceil((body.h+pad*2)*scale);
      if(!panel)panel=makeCanvas();
      if(panel.width!==width)panel.width=width;if(panel.height!==height)panel.height=height;
      paint({...layout,context:panel.getContext('2d')},boxes.filter(b=>b.el!==target&&owned(b)),
        {width:width/scale,height:height/scale,x:view.x-x/scale,y:view.y-y/scale},scale);
      if(!shade){shade=makeCanvas();shade.width=shade.height=1;}
      const ctx=shade.getContext('2d');ctx.clearRect(0,0,1,1);
      ctx.fillStyle=root.s['background-color']||root.s.background||'rgba(25,22,38,.55)';ctx.globalAlpha=root.opacity;ctx.fillRect(0,0,1,1);
      content={canvas:panel,x,y,width,height,slot:4};
      backdrop={canvas:shade,x:0,y:0,width:view.width*scale,height:view.height*scale,slot:3};
      dirty=true;
      return boxes.filter(b=>!owned(b));
    },
    layers(scale,now){
      if(!connected()||!content)return [];
      // Preparation on a slow device must not consume the visible animation.
      if(started===null)started=now;
      const ease=1-(1-progress)**3,closing=phase==='exit',alpha=closing?1-ease:ease;
      const zoom=closing?1-.015*ease:.985+.015*ease,upload=dirty;dirty=false;
      const shadeOpacity=closing?(keepShade?1:alpha):shadeStart+(1-shadeStart)*alpha;
      return [{...backdrop,changed:upload,opacity:shadeOpacity},{...content,changed:upload,opacity:alpha,
        x:content.x+content.width*(1-zoom)/2,y:content.y+content.height*(1-zoom)/2+8*scale*(1-alpha),
        width:content.width*zoom,height:content.height*zoom}];
    }
  };
}
