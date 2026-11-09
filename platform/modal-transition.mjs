import {paint} from './paint.mjs';

// Rasterize the dialog once. Fade and move those pixels on the GPU, without
// changing DOM styles, repeating text layout or uploading a full screen/frame.
export function createModalTransition(makeCanvas,duration=200){
  let target=null,started=null,panel,shade,content,backdrop,dirty=false,progress=0;
  return {
    begin(wrap){target=wrap;started=null;content=backdrop=null;progress=0;},
    get active(){return !!target?.isConnected;},
    get canvases(){return [panel,shade].filter(Boolean);},
    get snapshot(){return {active:!!target?.isConnected,progress,started,duration};},
    advance(now){
      if(!target)return false;
      if(!target.isConnected||(started!==null&&now-started>=duration)){
        target=null;content=backdrop=null;progress=1;return true;
      }
      progress=started===null?0:Math.max(0,Math.min(1,(now-started)/duration));
      return false;
    },
    capture(layout,boxes,view,scale){
      if(!target?.isConnected)return boxes;
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
      if(!target?.isConnected||!content)return [];
      // Layout/rasterization on a slow phone must not consume the animation
      // before any transition pixels have reached the screen.
      if(started===null)started=now;
      const ease=1-(1-progress)**3,zoom=.97+.03*ease,upload=dirty;dirty=false;
      return [{...backdrop,changed:upload,opacity:ease},{...content,changed:upload,opacity:ease,
        x:content.x+content.width*(1-zoom)/2,y:content.y+content.height*(1-zoom)/2+12*scale*(1-ease),
        width:content.width*zoom,height:content.height*zoom}];
    }
  };
}
