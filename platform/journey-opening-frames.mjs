// Decode the supplied film as ordinary image pages, without VideoDecoder.
// Reuse two native images. Dropping JS references alone lets all 29 decoded
// pages accumulate on iOS until its native image storage is garbage-collected.
export function createOpeningFrames(wx,{pathFor=url=>url}={}){
  const width=390,height=844,frames=169,perPage=6,columns=3;
  let canvas=wx.createCanvas();canvas.width=width;canvas.height=height;
  let ctx=canvas.getContext('2d');const pages=new Map();
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
      const cell=index%perPage;
      ctx.drawImage(entry.image,cell%columns*width,Math.floor(cell/columns)*height,width,height,0,0,width,height);
      index++;
      if(index%perPage===0){
        clearTimeout(entry.timer);entry.image.onload=entry.image.onerror=null;
        pages.delete(page);load(page+2,entry.image);
      }
      if(index===frames)ended();
      return {width,height,canvas};
    },
    remove(){
      if(removed)return;
      removed=true;
      for(const entry of pages.values())release(entry);
      pages.clear();ended=()=>{};ctx=null;canvas=null;
      // The output canvas is the held last frame, released by the film owner.
    },
  };
}
