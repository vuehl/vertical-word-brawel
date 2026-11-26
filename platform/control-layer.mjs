import {paint} from './paint.mjs';

// A fixed HUD group owns its layout and pixels. Text, skill levels and button
// state changes rebuild only this subtree and upload only this small texture.
export function createHUDLayer(makeCanvas,id,slot){
  let canvas,context,root,parts=[],bounds=null,dirty=true,layoutDirty=false;
  const owns=el=>!!el?.closest?.('[data-ui-layer="'+id+'"]');
  function refreshParts(layout){
    parts=layout.refreshSubtree(root.el,parts);
    root=parts[0];bounds=null;layoutDirty=false;
  }
  return {
    id,owns,
    invalidate(){dirty=layoutDirty=true;},
    invalidatePixels(){dirty=true;},
    refreshIfDirty(layout){
      // refreshSubtree replaces entries in the shared list. Remove expired
      // children before that list is partitioned for a pixel-only repaint.
      if(layoutDirty&&root&&root.el.isConnected&&layout.box(root.el)===root)refreshParts(layout);
    },
    capture(boxes){
      root=boxes.find(b=>b.el.dataset?.uiLayer===id);
      parts=boxes;bounds=null;layoutDirty=false;dirty=true;
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!root||!root.el.isConnected||root.opacity<=0)return null;
      if(layoutDirty)refreshParts(layout);
      // Zero-sized overlay anchors must not enlarge their children's texture.
      // Layout/mutations invalidate bounds. Stable frames reuse the same
      // rectangle without allocating five arrays for each HUD tile.
      if(!bounds){
        let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
        for(const b of parts)if(b.opacity>0&&b.w>0&&b.h>0){
          left=Math.min(left,b.x);top=Math.min(top,b.y);
          right=Math.max(right,b.x+b.w);bottom=Math.max(bottom,b.y+b.h);
        }
        if(left===Infinity)return null;
        bounds={left,top,right,bottom};
      }
      const pad=4,{left,top,right,bottom}=bounds;
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
export function createCanvasLayer(makeCanvas,id,{slot=1,movable=false,foreground=null,uploadPixels=false}={}){
  let canvas,context,box,parts=[],bounds,originX=0,originY=0,dirty=true,foregroundDirty=false;
  const owns=el=>el?.dataset?.uiLayer===id||!!(foreground&&el?.closest?.('[data-ui-layer="'+foreground+'"]'));
  return {
    id,owns,
    invalidate(){dirty=true;},
    invalidateForeground(){foregroundDirty=dirty=true;},
    capture(boxes){
      const previous=box;
      box=boxes.find(b=>b.el.dataset?.uiLayer===id&&b.opacity>0&&b.w>0);
      if(movable){
        // A paint-only refresh may reuse a layout box after the player moved.
        if(box&&box!==previous){
          const [x,y]=offset(box.s.transform);
          originX=box.x-x;originY=box.y-y;
          // Layout can move the same canvas. Its pixels change on data-frame.
          if(box.el!==previous?.el)dirty=true;
        }
        return;
      }
      // A label overlapping the animated canvas must stay in front of it.
      // Cache both in this small tile, preserving their original paint order.
      const front=foreground?boxes.filter(b=>b.el.dataset?.uiLayer!==id&&owns(b.el.nodeType===1?b.el:b.el.parentElement)):[];
      parts=[];bounds=null;foregroundDirty=false;
      if(box){
        parts=[box,...front];
        const left=Math.min(...parts.map(b=>b.x)),top=Math.min(...parts.map(b=>b.y));
        bounds={x:left-box.x,y:top-box.y,w:Math.max(...parts.map(b=>b.x+b.w))-left,h:Math.max(...parts.map(b=>b.y+b.h))-top};
      }
      dirty=true;
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!box||!box.el.isConnected||box.el.hidden)return null;
      if(foregroundDirty&&parts[1]){
        // The level badge has fixed bounds. Recenter its glyphs even at 9 → 10.
        parts=[box,...layout.refreshSubtree(parts[1].el,parts.slice(1))];foregroundDirty=false;
      }
      if(movable){
        const [dx,dy]=translation(box.el);box.x=originX+dx;box.y=originY+dy;
        // Upload the HP canvas itself. Painting through the screen clip would
        // cache an empty bar if HP changed while the player was off camera.
        const changed=dirty||canvas!==box.el._surface;
        canvas=box.el._surface;dirty=false;
        return {canvas,x:Math.round((box.x+view.x)*scale),y:Math.round((box.y+view.y)*scale),
          width:Math.round(box.w*scale),height:Math.round(box.h*scale),opacity:box.opacity,uploadPixels,changed,slot};
      }
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

const offset=transform=>{
  const values=/translate\(\s*([-\d.e+]+)px\s*,\s*([-\d.e+]+)px\s*\)/i.exec(transform||'');
  return values?[Number(values[1]),Number(values[2])]:[0,0];
};
const translation=el=>offset(el?.style.transform);
// Keep the base and thumb in separate textures. An ordinary drag only moves
// their viewports. At the safe-area edge, cache the visible part of each tile.
function stickPart(makeCanvas,slot){
  const tile={slot,canvas:null};
  let context,lastScale,lastWidth,lastHeight;
  const clip={};
  return {
    tile,
    draw(layout,box,view,scale,dirty){
      const pad=4,width=Math.ceil((box.w+pad*2)*scale),height=Math.ceil((box.h+pad*2)*scale);
      const left=box.x-pad,top=box.y-pad;
      const x=Math.max(0,box.clip.x-left),y=Math.max(0,box.clip.y-top);
      const r=Math.min(width/scale,box.clip.r-left),b=Math.min(height/scale,box.clip.b-top);
      tile.changed=dirty||scale!==lastScale||box.w!==lastWidth||box.h!==lastHeight||
        x!==clip.x||y!==clip.y||r!==clip.r||b!==clip.b;
      if(tile.changed){
        if(!tile.canvas){tile.canvas=makeCanvas();context=tile.canvas.getContext('2d');}
        if(tile.canvas.width!==width)tile.canvas.width=width;
        if(tile.canvas.height!==height)tile.canvas.height=height;
        Object.assign(clip,{x,y,r,b});
        paint({...layout,context},[{...box,x:pad,y:pad,clip,opacity:1}],
          {width:width/scale,height:height/scale,x:0,y:0},scale);
        lastScale=scale;lastWidth=box.w;lastHeight=box.h;
      }
      tile.x=(left+view.x)*scale;tile.y=(top+view.y)*scale;
      tile.width=width;tile.height=height;
    },
  };
}

export function createControlLayer(makeCanvas){
  const basePart=stickPart(makeCanvas,0),knobPart=stickPart(makeCanvas,31);
  const layers=[basePart.tile,knobPart.tile],hidden=[];
  let base,knob,dirty=true;
  return {
    owns(el){return !!el?.closest?.('[data-ui-layer="stick"]');},
    capture(boxes){
      const next=boxes.find(b=>b.el.dataset?.uiLayer==='stick'&&b.w>0);
      dirty ||= next!==base;
      base=next;
      knob=base&&boxes.find(b=>b.el===base.el.firstElementChild);
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!knob||!base.el.isConnected||!base.el.classList.contains('on'))return hidden;
      base.x=(parseFloat(base.el.style.left)||0)-base.w/2;
      base.y=(parseFloat(base.el.style.top)||0)-base.h/2;
      const [dx,dy]=translation(knob.el);
      knob.x=base.x+(base.w-knob.w)/2+dx;
      knob.y=base.y+(base.h-knob.h)/2+dy;
      basePart.draw(layout,base,view,scale,dirty);
      knobPart.draw(layout,knob,view,scale,dirty);
      dirty=false;
      return layers;
    },
    get canvas(){return basePart.tile.canvas;},
    get knobCanvas(){return knobPart.tile.canvas;},
  };
}
