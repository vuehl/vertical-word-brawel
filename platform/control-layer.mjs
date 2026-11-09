import {paint} from './paint.mjs';

const translation=el=>{
  const values=/translate\(\s*([-\d.e+]+)px\s*,\s*([-\d.e+]+)px\s*\)/i.exec(el?.style.transform||'');
  return values?[Number(values[1]),Number(values[2])]:[0,0];
};
// The fixed joystick has its own small texture. Its transforms never require a
// screen-wide layout, canvas repaint or texture upload.
export function createControlLayer(makeCanvas){
  let canvas,context,base,knob,originX=0,originY=0,lastKey='',dirty=true;
  const layer={
    owns(el){return !!el?.closest?.('[data-ui-layer="stick"]');},
    invalidate(){dirty=true;},
    capture(boxes){
      base=boxes.find(b=>b.el.dataset?.uiLayer==='stick'&&b.opacity>0&&b.w>0);
      knob=base&&boxes.find(b=>b.el===base.el.firstElementChild);
      if(knob){const [x,y]=translation(knob.el);originX=knob.x-x;originY=knob.y-y;}
      dirty=true;
    },
    draw(layout,view,scale,enabled){
      if(!enabled||!base||!knob||!base.el.isConnected)return null;
      const pad=4,x=Math.floor((base.x+view.x-pad)*scale),y=Math.floor((base.y+view.y-pad)*scale);
      const width=Math.ceil((base.w+pad*2)*scale),height=Math.ceil((base.h+pad*2)*scale);
      const [dx,dy]=translation(knob.el),active=base.el.classList.contains('on');
      const key=[x,y,width,height,dx,dy,active,base.opacity].join('/');
      const changed=dirty||key!==lastKey;
      if(!canvas){canvas=makeCanvas();context=canvas.getContext('2d');}
      if(changed){
        if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
        const root={...base,s:{...base.s,background:active?'#dfd9eb8c':'#e4e2ed66','background-color':active?'#dfd9eb8c':'#e4e2ed66','border-color':active?'#fff':'#ffffffe6'}};
        // Update the cached hit-test rectangle too; width and the fixed base do
        // not change when the thumb moves, and the knob has pointer-events:none.
        knob.x=originX+dx;knob.y=originY+dy;
        paint({...layout,context},[root,knob],{width:width/scale,height:height/scale,x:view.x-x/scale,y:view.y-y/scale},scale);
        dirty=false;lastKey=key;
      }
      return {canvas,x,y,width,height,changed};
    },
    get canvas(){return canvas;},
  };
  return layer;
}
