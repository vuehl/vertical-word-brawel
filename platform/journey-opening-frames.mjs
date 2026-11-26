// Decode the supplied film as ordinary image pages, without VideoDecoder.
// Only the current and next six-frame pages are retained in native memory.
export function createOpeningFrames(wx){
  const width=390,height=844,frames=169,perPage=6,columns=3;
  const canvas=wx.createCanvas();canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),pages=new Map();
  let index=0,removed=false,error=null,ended=()=>{};
  function load(page){
    if(removed||page>=Math.ceil(frames/perPage)||pages.has(page))return;
    const image=wx.createImage(),entry={image,ready:false,timer:null};pages.set(page,entry);
    const fail=()=>{
      clearTimeout(entry.timer);
      if(!removed)error=Error('开场动画图片读取失败，请重试');
    };
    image.onload=()=>{clearTimeout(entry.timer);if(!removed)entry.ready=true;};
    image.onerror=fail;entry.timer=setTimeout(fail,12000);
    image.src='play/opening/p'+String(page).padStart(2,'0')+'.webp';
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
        entry.image.onload=entry.image.onerror=null;pages.delete(page);load(page+2);
      }
      if(index===frames)ended();
      return {width,height,canvas};
    },
    remove(){
      removed=true;
      for(const {image,timer} of pages.values()){clearTimeout(timer);image.onload=image.onerror=null;}
      pages.clear();
      // The output canvas is the held last frame, released by the film owner.
    },
  };
}
