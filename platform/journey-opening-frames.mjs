// Decode the supplied film as ordinary image pages, without VideoDecoder.
// Reuse two native images. Dropping JS references alone lets all 29 decoded
// pages accumulate on iOS until its native image storage is garbage-collected.
export function createOpeningFrames(wx,{pathFor=url=>url}={}){
  const width=390,height=844,frames=169,perPage=6,columns=3;
  const pages=new Map();
  let index=0,removed=false,error=null,ended=()=>{};
  function release(entry){
    clearTimeout(entry.timer);entry.image.onload=entry.image.onerror=null;
    try{entry.image.src='';}catch{}
  }
  function load(page,recycled){
    if(removed||page>=Math.ceil(frames/perPage)||pages.has(page)){
      if(recycled)release({image:recycled});return;
    }
    const key='assets/opening/p'+String(page).padStart(2,'0')+'.webp';
    let path;
    try{path=pathFor(key);if(!path)throw Error('找不到开场动画图片 '+key);}
    catch(error){if(recycled)release({image:recycled});throw error;}
    const image=recycled||wx.createImage(),entry={image,ready:false,timer:null};pages.set(page,entry);
    const fail=event=>{
      clearTimeout(entry.timer);
      if(!removed&&pages.get(page)===entry){
        console.warn('[字由搏击] 开场动画图片读取失败',key,path,event?.errMsg||event?.message||'image load failed');
        error=Error('开场动画图片读取失败，请重试');
      }
    };
    image.onload=()=>{clearTimeout(entry.timer);if(!removed&&pages.get(page)===entry)entry.ready=true;};
    image.onerror=fail;entry.timer=setTimeout(fail,12000);
    // Preview uploads omit loose WebP files. Resolve the copy installed from
    // the versioned text archive, just like the other startup artwork.
    image.src=path;
  }
  return {
    on(name,fn){if(name==='ended')ended=fn;},
    start(){load(0);load(1);},
    getFrameData(){
      if(removed||index>=frames)return null;
      if(error)throw error;
      const page=Math.floor(index/perPage),entry=pages.get(page);load(page);
      if(!entry?.ready)return null;
      // A native draw/upload can still refer to the image returned last time.
      // Recycle it only once the next page can replace it. While decoding is
      // delayed, the held frame must keep its original source and dimensions.
      if(index>0&&index%perPage===0){
        const previous=index/perPage-1,old=pages.get(previous);
        if(old){
          clearTimeout(old.timer);old.image.onload=old.image.onerror=null;
          pages.delete(previous);load(previous+2,old.image);
        }
      }
      const cell=index%perPage;
      index++;
      if(index===frames)ended();
      // Sample the decoded page directly in WebGL. Repainting/uploading an
      // intermediate native 2D canvas for each frame can expose an empty or
      // stale backing buffer on Android. Only the crop changes within a page.
      return {width,height,image:entry.image,page,
        sourceRect:{x:cell%columns*width,y:Math.floor(cell/columns)*height,width,height}};
    },
    remove(){
      if(removed)return;
      removed=true;
      for(const entry of pages.values())release(entry);
      pages.clear();ended=()=>{};
    },
  };
}
