import {createOpeningFrames} from './journey-opening-frames.mjs';
// The supplied film is silent, 169 frames at 24 fps. Pull playback keeps it
// paused while the app is hidden and avoids retaining a sequence of RGBA frames.
export const openingFilm={frames:169,fps:24,fadeMs:800};

export function createJourneyOpening(wx,{now=()=>performance.now(),onDispose=()=>{},paused=false,pathFor=url=>url,
  createSource=()=>createOpeningFrames(wx,{pathFor})}={}) {
  let decoder=null,frame=null,count=0,clock=null,credit=1000/openingFilm.fps;
  let stalled=0,ended=false,done=false,disposed=false,revealing=false,fade=0,failure=null;
  let finish,uncover,firstFrame;
  const ready=new Promise(resolve=>{firstFrame=resolve;});
  const finished=new Promise(resolve=>{finish=resolve;});
  const revealed=new Promise(resolve=>{uncover=resolve;});
  const stopDecoder=()=>{
    const old=decoder;decoder=null;
    try{Promise.resolve(old?.remove()).catch(()=>{});}catch{}
  };
  const complete=()=>{if(done)return;done=true;stopDecoder();firstFrame(failure?{error:failure}:undefined);finish(failure?{error:failure}:undefined);};
  const fail=error=>{
    failure=error instanceof Error?error:Error(error?.errMsg||String(error));
    console.warn('[字由搏击] 开场动画播放失败',failure.message);
    complete();
  };
  const api={
    ready,
    finished,
    get active(){return !disposed;},
    get revealing(){return revealing;},
    get frameCount(){return count;},
    reveal(){
      if(disposed||!frame){api.dispose();return revealed;}
      revealing=true;clock=null;return revealed;
    },
    pause(){clock=null;},
    resume(){paused=false;clock=null;credit=0;},
    dispose(){
      if(disposed)return;
      disposed=true;complete();
      // Shrink the native backing store, even if a completed promise still
      // retains the film API. Keep the final frame intact until the fade ends.
      if(frame?.getContext)frame.width=frame.height=1;
      frame=null;uncover();onDispose();
    },
    layer(width,height){
      if(disposed)return null;
      const at=now(),dt=clock===null?0:Math.min(100,Math.max(0,at-clock));clock=at;
      let changed=false;
      if(!done&&(!paused||!frame)){
        stalled+=dt;credit+=dt;
        if(decoder&&credit>=1000/openingFilm.fps){
          try{
            const next=decoder.getFrameData();
            if(next?.canvas||next?.data){
              if(!next.canvas&&next.data.byteLength!==next.width*next.height*4)throw Error('视频帧格式异常');
              frame=next.canvas||{width:next.width,height:next.height,pixels:new Uint8Array(next.data)};
              changed=true;count++;stalled=0;credit=Math.max(0,credit-1000/openingFilm.fps);
              firstFrame();
              // The last frame remains on the GPU until the world is ready.
              if(count>=openingFilm.frames)complete();
            }else if(ended&&frame)complete();
          }catch(error){fail(error);}
        }
        if(stalled>8000)fail(Error('开场动画读取超时，请重试'));
      }
      if(!frame)return null;
      if(revealing){
        fade+=dt;
        if(fade>=openingFilm.fadeMs){api.dispose();return null;}
      }
      const t=fade/openingFilm.fadeMs,opacity=1-t*t*(3-2*t);
      const ratio=Math.max(width/frame.width,height/frame.height);
      return {canvas:frame,pixels:frame.pixels,changed,slot:30,opacity,
        x:(width-frame.width*ratio)/2,y:(height-frame.height*ratio)/2,
        width:frame.width*ratio,height:frame.height*ratio};
    },
  };
  try{
    decoder=createSource();
    decoder.on('ended',()=>{ended=true;});
    Promise.resolve(decoder.start()).catch(fail);
  }catch(error){fail(error);}
  return api;
}
