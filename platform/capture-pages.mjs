// Hold at most the displayed page, the requested page and one lookahead page.
// Recycle native images as well as JS records: iOS can defer native GC long
// enough for a sequence of discarded atlas images to exhaust process memory.
export function createCapturePages(wx,pathFor){
  const pages=new Map(),free=[];
  let pending=0;
  function fetch(id){
    if(pages.has(id))return pages.get(id);
    if(pending>=2||pages.size>=3)return;
    const image=free.pop()||wx.createImage();
    const record={image,ready:false,promise:null,cancel:null};
    pages.set(id,record);pending++;
    record.promise=new Promise((resolve,reject)=>{
      let settled=false,timer;
      function finish(ok,error){
        if(settled)return;settled=true;
        clearTimeout(timer);image.onload=image.onerror=null;pending--;
        record.ready=ok;record.cancel=null;
        if(error)reject(error);else resolve(ok);
      }
      record.cancel=()=>finish(false);
      const fail=()=>finish(false,Error('福袋帧图读取失败 '+id));
      image.onload=()=>finish(true);image.onerror=fail;
      timer=setTimeout(fail,12000);
      try{const path=pathFor(id);if(!path)fail();else image.src=path;}catch{fail();}
    }).catch(error=>{
      if(pages.get(id)===record)retire(id,record);
      throw error;
    });
    return record;
  }
  function retire(id,record){
    pages.delete(id);record.cancel?.();
    const image=record.image;record.image=null;
    image.onload=image.onerror=null;
    try{image.src='';}catch{}
    free.push(image);
  }
  function prepare(id,lastPage,heldPage){
    // Preserve the last displayed image if decoding the next one is slow.
    const keepHeld=!pages.get(id)?.ready;
    for(const [key,record] of pages)
      if(key!==id&&key!==id+1&&!(keepHeld&&key===heldPage))retire(key,record);
    for(let next=id;next<=Math.min(lastPage,id+1);next++)fetch(next)?.promise.catch(()=>{});
    const record=pages.get(id);
    return record?.ready?record.image:null;
  }
  function idle(){
    for(const [key,record] of pages)retire(key,record);
    free.length=0;
  }
  return {fetch,prepare,idle};
}
