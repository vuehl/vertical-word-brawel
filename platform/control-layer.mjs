import {paint} from './paint.mjs';

// A fixed HUD group owns its layout and pixels. Text, skill levels and button
// state changes rebuild only this subtree and upload only this small texture.
export function createHUDLayer(makeCanvas,id,slot){
  let canvas,context,root,parts=[],dirty=true,layoutDirty=false;
  const element=b=>b.el.nodeType===1?b.el:b.el.parentElement;
  const owns=el=>!!el?.closest?.('[data-ui-layer="'+id+'"]');
  return {
    owns,
    invalidate(){dirty=layoutDirty=true;},
    capture(boxes){root=boxes.find(b=>b.el.dataset?.uiLayer===id);parts=boxes.filter(b=>owns(element(b)));dirty=true;layoutDirty=false;},
    draw(layout,view,scale,enabled){
      if(!enabled||!root||!root.el.isConnected||root.opacity<=0)return null;
      if(layoutDirty){parts=layout.refreshSubtree(root.el,parts);root=parts[0];layoutDirty=false;}
      const pad=4,left=Math.min(...parts.map(b=>b.x)),top=Math.min(...parts.map(b=>b.y));
      const right=Math.max(...parts.map(b=>b.x+b.w)),bottom=Math.max(...parts.map(b=>b.y+b.h));
      const x=Math.floor((left+view.x-pad)*scale),y=Math.floor((top+view.y-pad)*scale);
      const width=Math.ceil((right-left+pad*2)*scale),height=Math.ceil((bottom-top+pad*2)*scale);
      if(!canvas){canvas=makeCanvas();context=canvas.getContext('2d');}
      const changed=dirty||canvas.width!==width||canvas.height!==height;
      if(changed){
        if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
        paint({...layout,context},parts,{width:width/scale,height:height/scale,x:view.x-x/scale,y:view.y-y/scale},scale);dirty=false;
      }
      return {canvas,x,y,width,height,changed,slot};
    },
    get canvas(){return canvas;},
  };
}

// A frequently changing canvas (the minimap) gets a small independent texture.
export function createCanvasLayer(makeCanvas,id,{slot=1,movable=false,foreground=null}={}){
  let canvas,context,box,parts=[],bounds,originX=0,originY=0,dirty=true;
  const owns=el=>el?.dataset?.uiLayer===id||!!(foreground&&el?.closest?.('[data-ui-layer="'+foreground+'"]'));
  return {
    owns,
    invalidate(){dirty=true;},
    capture(boxes){
      box=boxes.find(b=>b.el.dataset?.uiLayer===id&&b.opacity>0&&b.w>0);
      // A label overlapping the animated canvas must stay in front of it.
      // Cache both in this small tile, preserving their original paint order.
      const front=foreground?boxes.filter(b=>b.el.dataset?.uiLayer!==id&&owns(b.el.nodeType===1?b.el:b.el.parentElement)):[];
      parts=[];bounds=null;
      if(box){
        parts=[box,...front];
        const left=Math.min(...parts.map(b=>b.x)),top=Math.min(...parts.map(b=>b.y));
        bounds={x:left-box.x,y:top-box.y,w:Math.max(...parts.map(b=>b.x+b.w))-left,h:Math.max(...parts.map(b=>b.y+b.h))-top};
      }
      if(box&&movable){const [x,y]=translation(box.el);originX=box.x-x;originY=box.y-y;}
      dirty=true;
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!box||!box.el.isConnected||box.el.hidden)return null;
      if(movable){const [x,y]=translation(box.el);box.x=originX+x;box.y=originY+y;}
      const pad=4,x=Math.floor((box.x+bounds.x+view.x-pad)*scale),y=Math.floor((box.y+bounds.y+view.y-pad)*scale);
      const width=Math.ceil((bounds.w+pad*2)*scale),height=Math.ceil((bounds.h+pad*2)*scale);
      if(!canvas){canvas=makeCanvas();context=canvas.getContext('2d');}
      const changed=dirty||canvas.width!==width||canvas.height!==height;
      if(changed){
        if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
        paint({...layout,context},parts,{width:width/scale,height:height/scale,x:view.x-x/scale,y:view.y-y/scale},scale);dirty=false;
      }
      return {canvas,x,y,width,height,changed,slot};
    },
    get canvas(){return canvas;},
  };
}

const translation=el=>{
  const values=/translate\(\s*([-\d.e+]+)px\s*,\s*([-\d.e+]+)px\s*\)/i.exec(el?.style.transform||'');
  return values?[Number(values[1]),Number(values[2])]:[0,0];
};
// The floating joystick has its own small texture. Its transforms never require a
// screen-wide layout, canvas repaint or texture upload.
export function createControlLayer(makeCanvas){
  let canvas,context,base,knob,originX=0,originY=0,lastKey='',dirty=true;
  const layer={
    owns(el){return !!el?.closest?.('[data-ui-layer="stick"]');},
    invalidate(){dirty=true;},
    capture(boxes){
      base=boxes.find(b=>b.el.dataset?.uiLayer==='stick'&&b.w>0);
      knob=base&&boxes.find(b=>b.el===base.el.firstElementChild);
      if(knob){const [x,y]=translation(knob.el);originX=knob.x-x-base.x;originY=knob.y-y-base.y;}
      dirty=true;
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!base||!knob||!base.el.isConnected||!base.el.classList.contains('on'))return null;
      base.x=(parseFloat(base.el.style.left)||0)-base.w/2;
      base.y=(parseFloat(base.el.style.top)||0)-base.h/2;
      const pad=4,x=Math.floor((base.x+view.x-pad)*scale),y=Math.floor((base.y+view.y-pad)*scale);
      const width=Math.ceil((base.w+pad*2)*scale),height=Math.ceil((base.h+pad*2)*scale);
      const [dx,dy]=translation(knob.el),active=base.el.classList.contains('on');
      const key=[x,y,width,height,dx,dy,active,base.opacity].join('/');
      const changed=dirty||key!==lastKey;
      if(!canvas){canvas=makeCanvas();context=canvas.getContext('2d');}
      if(changed){
        if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
        const root={...base,opacity:1};
        // Keep cached geometry aligned with the current touch origin. The
        // control is visual only; the gesture surface owns pointer events.
        knob.x=base.x+originX+dx;knob.y=base.y+originY+dy;
        paint({...layout,context},[root,{...knob,opacity:1}],{width:width/scale,height:height/scale,x:view.x-x/scale,y:view.y-y/scale},scale);
        dirty=false;lastKey=key;
      }
      return {canvas,x,y,width,height,changed};
    },
    get canvas(){return canvas;},
  };
  return layer;
}
