// The capsule's own rectangle is already a valid system-overlay row. The
// general safe-area top must not push the stage label down out of that row.
export function gameViewport(info,menu){
  const width=info.windowWidth,height=info.windowHeight,screenTop=info.screenTop||0;
  let left=0,top=0,right=width,bottom=height;
  const safe=info.safeArea;
  if(safe){
    const x=Math.max(0,safe.left),y=Math.max(0,safe.top-screenTop);
    const r=Math.min(width,safe.right),b=Math.min(height,safe.bottom-screenTop);
    if(r-x>width/2&&b-y>height/2){left=x;top=y;right=r;bottom=b;}
  }
  const pad=width<=350?10:12;
  let hudTop={x:pad,y:top+8,w:right-left-pad*2,h:26};
  if(menu&&menu.right>menu.left&&menu.right<=width+1&&menu.bottom>menu.top&&menu.bottom-screenTop<height/2){
    top=Math.max(top,menu.bottom-screenTop+4);
    const available=menu.left-left-pad-44;
    hudTop=available>=120
      ?{x:pad,y:Math.max(0,menu.top-screenTop+(menu.bottom-menu.top-26)/2),w:available,h:26}
      :{x:pad,y:top+8,w:right-left-pad*2,h:26};
  }
  hudTop.y-=top;
  const stack={x:pad,y:Math.max(8,hudTop.y+hudTop.h+15),w:right-left-pad*2,h:156};
  return {w:right-left,h:bottom-top,x:left,y:top,width,height,dpr:info.pixelRatio||1,regions:{'hud-top':hudTop,'hud-stack':stack}};
}
