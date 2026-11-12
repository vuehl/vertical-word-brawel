// Layout changes, pixel-only animation and unchanged frames have different costs.
export function createUIFrameCache(interval=80) {
  let layoutDirty=true,paintDirty=true,urgent=true,last=-Infinity,state,boxes=[],animated=false;
  return {
    invalidate(layout=true,immediate=false){layoutDirty ||= layout;paintDirty=true;urgent ||= immediate;},
    draw(now,nextState,layout,paint){
      if(state!==nextState){state=nextState;layoutDirty=paintDirty=urgent=true;}
      if(!urgent&&now-last<interval)return false;
      if(!paintDirty&&!animated)return false;
      if(layoutDirty){
        boxes=layout.refresh(nextState);
        animated=boxes.some(b=>b.tag==='canvas'&&b.el?.dataset?.static!=='true'&&b.opacity>0&&b.w>0&&b.h>0&&
          b.x+b.w>b.clip.x&&b.y+b.h>b.clip.y&&b.x<b.clip.r&&b.y<b.clip.b);
        layoutDirty=false;
      }
      paint(boxes);
      paintDirty=urgent=false;last=now;
      return true;
    }
  };
}
