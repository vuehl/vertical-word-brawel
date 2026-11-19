// Bake the authored 4.11-second loop once; battle frames only change UVs.
export const portalScreenAtlas = Object.freeze({frames:100,columns:10,rows:10,width:256,height:116,pad:1,seconds:4.11});

export function portalScreenFrame(seconds) {
  const a=portalScreenAtlas;
  return Math.floor(((seconds%a.seconds+a.seconds)%a.seconds)/a.seconds*a.frames)%a.frames;
}

export function createPortalScreenAnimation(T,renderer) {
  const a=portalScreenAtlas,texture=new T.Texture();
  texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;
  texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;
  const w=(a.width+2*a.pad)*a.columns,h=(a.height+2*a.pad)*a.rows;
  texture.repeat.set(a.width/w,a.height/h);
  let disposed=false,last=-1,cancelLoad;
  const image=new Image();
  const ready=new Promise((resolve,reject)=>{
    let settled=false;
    const timeout=setTimeout(()=>finish(Error('召唤装置动画读取超时')),12000);
    function finish(error){
      if(settled)return;settled=true;
      clearTimeout(timeout);image.onload=image.onerror=null;
      if(error){reject(error);return;}
      try{
        if(!disposed){texture.image=image;texture.needsUpdate=true;renderer.initTexture(texture);}
        resolve();
      }catch(error){reject(error);}
    }
    cancelLoad=()=>finish();
    image.onload=()=>finish();image.onerror=()=>finish(Error('召唤装置动画加载失败'));
    image.src='assets/vfx/portal-screen.png';
  });
  function frame(seconds){
    const index=portalScreenFrame(seconds);if(index===last)return;
    last=index;
    texture.offset.set((index%a.columns*(a.width+2*a.pad)+a.pad)/w,
      (Math.floor(index/a.columns)*(a.height+2*a.pad)+a.pad)/h);
    texture.updateMatrix();
  }
  frame(0);
  return {texture,ready,frame,dispose(){disposed=true;cancelLoad();texture.dispose();}};
}
