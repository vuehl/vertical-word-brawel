import {polygon,paintWordmark} from '../source/src/ui/menu-scene.js';
import {gameViewport} from './viewport.mjs';
import {deskFrame,deskPixelsPerUnit as ppu,deskTilt,entryHeroScale,entryFootOffset} from '../source/src/world/desk-framing.js';

function decodeImage(src,name){
  return new Promise((resolve,reject)=>{
    const image=wx.createImage();
    const finish=error=>{
      clearTimeout(timer);image.onload=image.onerror=null;
      if(error)reject(Error(name+' '+(error.errMsg||error.message||'图片解码失败')));else resolve(image);
    };
    const timer=setTimeout(()=>finish(Error('图片解码超时')),8000);
    image.onload=()=>finish();image.onerror=error=>finish(error||Error('图片解码失败'));
    try{image.src=src;}catch(error){finish(error);}
  });
}

// Keep the live desk visible behind the title and the download slip.
function paintOverlay(ctx,w,h,v,value){
  const rx=w/v.width,ry=h/v.height,s=Math.min(v.w/390,v.h/550);
  const left=v.x+(v.w-390*s)/2,track=v.y+v.h*.79;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
  ctx.setTransform(.47*s*rx,0,0,.47*s*ry,(v.x+v.w/2)*rx,(v.y+v.h*.12)*ry);
  paintWordmark(ctx,0,0);
  ctx.setTransform(s*rx,0,0,s*ry,left*rx,track*ry);
  // The paper slip holds both the phase and the real download percentage.
  polygon(ctx,[[34,-39],[345,-39],[355,-29],[355,16],[347,24],[41,24],[34,18]],'#607EA9');
  polygon(ctx,[[34,-43],[345,-43],[353,-35],[353,12],[346,19],[39,19],[32,12],[32,-41]],'#EEF0F7');
  polygon(ctx,[[48,-48],[65,-48],[65,-31],[56,-35],[48,-31]],'#C77683');
  ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#293651';ctx.font='bold 15px sans-serif';
  ctx.fillText(value===100?'准备就绪':value>=95?'正在打开首页':value>=85?'正在整理资源':'正在准备游戏资源',61,-18);
  ctx.textAlign='right';ctx.font='bold 19px sans-serif';ctx.fillStyle='#385A8A';ctx.fillText(value+'%',329,-18);
  ctx.fillStyle='#D1DBEA';ctx.fillRect(61,0,268,7);
  if(value){ctx.fillStyle='#5076AE';ctx.fillRect(61,0,268*value/100,7);}
}

module.exports=async function createEntryScene(gl){
  const data=require('./entry-data'),{spawn,idle}=data;
  const files=[...data.layers.map(([name])=>name),'idle.png'];
  let useLocalFiles=false;
  const materialized=new Set();
  async function loadImage(name){
    const encoded=data.images[name];
    if(!encoded)throw Error('启动图未编入主包 '+name);
    if(!useLocalFiles){
      const mime=name.endsWith('.jpg')?'image/jpeg':'image/png';
      try{return await decodeImage('data:'+mime+';base64,'+encoded,name);}
      catch{useLocalFiles=true;}
    }
    // Some native decoders require a real local filename. These bytes always
    // come from the required code module, even if preview strips loose art.
    const file=wx.env.USER_DATA_PATH+'/zixing-entry-'+name;
    try{
      if(!materialized.has(name)){
        wx.getFileSystemManager().writeFileSync(file,encoded,'base64');
        materialized.add(name);
      }
      return await decodeImage(file,name);
    }catch(error){
      materialized.delete(name);
      throw Error('无法读取启动图 '+name+'（'+(error.errMsg||error.message||'本地文件读取失败')+'）');
    }
  }
  const images=[];
  let next=0;
  async function loadLayers(){
    while(next<files.length){
      const index=next++;
      images[index]=await loadImage(files[index]);
    }
  }
  await Promise.all([loadLayers(),loadLayers()]);
  let actor=images.pop(),actorLoading=null;
  const scene=wx.createCanvas(),ui=wx.createCanvas();
  const program=gl.createProgram(),vao=gl.createVertexArray();
  function shader(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);gl.attachShader(program,s);gl.deleteShader(s);
  }
  shader(gl.VERTEX_SHADER,`#version 300 es
    out vec2 uv;
    void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=vec2(p.x,1.-p.y);gl_Position=vec4(2.*p-1.,0.,1.);}`);
  shader(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;
    uniform sampler2D desk,actorArt,overlay; uniform vec4 actorRect,frameRect;
    uniform int percent; uniform bool overScene;
    in vec2 uv;out vec4 color;
    void main(){
      if(percent<0)discard;
      if(overScene){color=texture(overlay,uv);return;}
      vec3 rgb=texture(desk,uv).rgb;
      vec2 p=(uv-actorRect.xy)/actorRect.zw;
      if(all(greaterThanEqual(p,vec2(0)))&&all(lessThanEqual(p,vec2(1)))){
        vec4 a=texture(actorArt,frameRect.xy+p*frameRect.zw);rgb=mix(rgb,a.rgb,a.a);
      }
      vec4 f=texture(overlay,uv);color=vec4(mix(rgb,f.rgb,f.a),1.);
    }`);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const uniforms={};
  for(const name of ['desk','actorArt','overlay','actorRect','frameRect','percent','overScene'])uniforms[name]=gl.getUniformLocation(program,name);
  let textures=[],surfaceKey='',overlayKey='',actorRect=[],bootValue=0,lastBootFrame=-1,auto=true,visible=true,disposed=false;
  const epoch=Date.now(),viewInfo=()=>gameViewport(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync(),wx.getMenuButtonBoundingClientRect?.());
  function upload(slot,image){
    gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,textures[slot]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  }
  function draw(value,over=false){
    if(disposed)return;
    bootValue=value;
    const v=viewInfo();
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,key=[w,h,v.width,v.height,v.x,v.y,v.w,v.h].join('/');
    if(!w||!h)return;
    if(!textures.length){textures=[gl.createTexture(),gl.createTexture(),gl.createTexture()];upload(1,actor);}
    if(key!==surfaceKey){
      scene.width=ui.width=w;scene.height=ui.height=h;
      const c=scene.getContext('2d');
      // Project the actual map tiles at the same spawn and zoom as the live scene.
      const [mw,mh]=data.mapSize;
      const frame=deskFrame(w/h,mw/(2*ppu),mh/(2*ppu*deskTilt),(spawn.x-mw/2)/ppu,(spawn.z-mh/2)/(ppu*deskTilt),0);
      const scale=h/(2*frame.h),zoom=scale/ppu;
      const ox=w/2-(mw/2+frame.x*ppu)*zoom,oy=h/2-(mh/2+frame.z*ppu*deskTilt)*zoom;
      c.setTransform(zoom,0,0,zoom,ox,oy);
      data.layers.forEach(([,x,y,width,height],i)=>c.drawImage(images[i],x,y,width,height));
      const footX=ox+spawn.x*zoom,footY=oy+spawn.z*zoom;
      c.setTransform(scale,0,0,scale,footX,footY);c.save();c.scale(.525*entryHeroScale,.275*deskTilt*entryHeroScale);c.fillStyle='rgba(72,62,100,.72)';
      c.beginPath();c.arc(0,0,1,0,2*Math.PI);c.fill();c.restore();
      const size=idle.worldSize*entryHeroScale*scale;
      actorRect=[(footX-size*.5)/w,(footY+scale*(entryFootOffset-.08*Math.sqrt(1-deskTilt*deskTilt))-size)/h,size/w,size/h];
      upload(0,scene);surfaceKey=key;overlayKey='';
    }
    const overlayState=String(value);
    if(overlayKey!==overlayState){
      paintOverlay(ui.getContext('2d'),w,h,v,value);
      upload(2,ui);overlayKey=overlayState;
    }
    const frame=idle.first+Math.floor((Date.now()-epoch)*idle.fps/1000)%idle.count;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.STENCIL_TEST);gl.disable(gl.BLEND);gl.colorMask(true,true,true,true);
    if(over){gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}
    gl.useProgram(program);gl.bindVertexArray(vao);
    ['desk','actorArt','overlay'].forEach((name,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.uniform1i(uniforms[name],i);});
    gl.uniform4fv(uniforms.actorRect,actorRect);
    gl.uniform4f(uniforms.frameRect,(frame%idle.columns)/idle.columns,Math.floor(frame/idle.columns)/idle.rows,1/idle.columns,1/idle.rows);
    gl.uniform1i(uniforms.percent,value);
    gl.uniform1i(uniforms.overScene,over?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);gl.useProgram(null);return true;
  }
  function suspend(){
    for(const tex of textures)gl.deleteTexture(tex);
    textures=[];images.length=0;surfaceKey=overlayKey='';scene.width=scene.height=ui.width=ui.height=1;
  }
  function releaseArt(){actor=null;}
  function tick(){
    if(!auto||disposed)return;
    const frame=Math.floor((Date.now()-epoch)*idle.fps/1000);
    if(visible&&frame!==lastBootFrame){draw(bootValue);lastBootFrame=frame;}
    requestAnimationFrame(tick);
  }
  const hide=()=>{visible=false;},show=()=>{visible=true;};
  wx.onHide?.(hide);wx.onShow?.(show);
  function handoff(){if(!auto)return;auto=false;wx.offHide?.(hide);wx.offShow?.(show);}
  draw(0);
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(tick);
  async function heroArt(){
    if(!actor){
      if(!actorLoading)actorLoading=loadImage('idle.png');
      try{actor=await actorLoading;}finally{actorLoading=null;}
    }
    return {image:actor,idle};
  }
  return {draw,handoff,suspend,releaseArt,heroArt,dispose(){handoff();suspend();releaseArt();disposed=true;gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
};
