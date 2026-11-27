'use strict';
const {paintLoadingBackdrop,paintLoadingSlip,loadingBackdropColor}=require('../source/src/ui/menu-scene.js');

// Decode the approved title poster directly from the main package.
module.exports = async function presentBootFrame(gl) {
  let program=gl.createProgram(),texture=gl.createTexture(),vao=gl.createVertexArray();
  let canvas=wx.createCanvas(),patch=wx.createCanvas(),last='',textureWidth=0,textureHeight=0;
  const {src}=require('./boot-poster'),image=wx.createImage();
  let ready=false;
  image.onload=()=>{if(canvas){ready=true;last='';}};
  function loadLocal(){
    image.onerror=null;
    if(!canvas)return;
    try{
      const file=wx.env.USER_DATA_PATH+'/zixing-boot-poster.webp';
      wx.getFileSystemManager().writeFileSync(file,src.slice(src.indexOf(',')+1),'base64');
      image.src=file;
    }catch(error){console.warn('[字由搏击] 加载页底图读取失败',error);}
  }
  image.onerror=loadLocal;
  try{image.src=src;}catch{loadLocal();}
  function attach(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  function dispose(){
    if(program)gl.deleteProgram(program);if(texture)gl.deleteTexture(texture);if(vao)gl.deleteVertexArray(vao);
    program=texture=vao=null;
    if(canvas){canvas.width=canvas.height=1;canvas=null;}
    if(patch){patch.width=patch.height=1;patch=null;}
  }
  function paint(value,w,h,full,animationMs){
    if(full){canvas.width=w;canvas.height=h;}
    const s=Math.min(w/390,h/550),W=w/s,H=h/s;
    const left=W>H?W*.745-195:(W-390)/2,track=W>H?H*.66:H*.93-8;
    const strip=h/(w/390)>=600;
    if(full){
      const ctx=canvas.getContext('2d');
      ctx.setTransform(s,0,0,s,0,0);
      paintLoadingBackdrop(ctx,W,H,ready?image:null);
    }
    let y=0,ctx=canvas.getContext('2d');
    if(strip){
      y=Math.floor((track-53)*s);
      const height=Math.ceil((track+32)*s)-y;
      if(patch.width!==w||patch.height!==height){patch.width=w;patch.height=height;}
      ctx=patch.getContext('2d');ctx.setTransform(1,0,0,1,0,0);
      ctx.fillStyle=loadingBackdropColor;ctx.fillRect(0,0,w,height);
    }
    ctx.setTransform(s,0,0,s,left*s,-y);ctx.save();ctx.translate(0,track);
    paintLoadingSlip(ctx,value,value===100?'准备就绪':value>=95?'正在进入桌上世界':value>=85?'正在整理资源':'正在准备游戏资源',animationMs);
    ctx.restore();
    return strip?y:null;
  }
  try {
    attach(gl.VERTEX_SHADER,`#version 300 es
      out vec2 uv;
      void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=vec2(p.x,1.-p.y);gl_Position=vec4(p*2.-1.,0.,1.);}`);
    attach(gl.FRAGMENT_SHADER,`#version 300 es
      precision highp float;
      uniform sampler2D artwork;uniform int percent;uniform bool overScene;
      in vec2 uv;out vec4 color;
      void main(){if(percent<0&&overScene)discard;color=texture(artwork,uv);}`);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'启动画面着色器未就绪');
    const percent=gl.getUniformLocation(program,'percent'),overScene=gl.getUniformLocation(program,'overScene');
    function draw(value,overlay=false,animationMs=0){
      if(!program)return;
      value=Math.max(0,Math.min(100,Math.floor(value*10)/10));
      // The small progress strip animates at 10 fps, even at 99% on a slow
      // connection. Completed frames reuse their texture until uncovering.
      animationMs=value<100?Math.floor(animationMs/100)*100:0;
      const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,key=w+'x'+h+'@'+value+':'+animationMs;
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.colorMask(true,true,true,true);
      gl.viewport(0,0,w,h);gl.useProgram(program);gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      // Repeated first-frame checks reuse the same texture without repainting.
      if(key!==last){
        // Late poster loads invalidate last too, so they always refresh the full
        // illustration. Ordinary progress updates repaint/upload only a strip.
        // Compact viewports can overlap the caption/art: use a full paint there.
        const full=!last||textureWidth!==w||textureHeight!==h||h/(w/390)<600;
        const stripY=paint(value,w,h,full,animationMs);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
        if(textureWidth!==w||textureHeight!==h){
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);textureWidth=w;textureHeight=h;
        }else if(full)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
        if(stripY!==null)gl.texSubImage2D(gl.TEXTURE_2D,0,0,stripY,gl.RGBA,gl.UNSIGNED_BYTE,patch);
        last=key;
      }
      gl.uniform1i(percent,value);gl.uniform1i(overScene,overlay?1:0);
      gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);gl.useProgram(null);gl.flush();
    }
    draw(0);
    await new Promise(resolve=>{
      if(typeof requestAnimationFrame!=='function'){setTimeout(resolve,0);return;}
      const timer=setTimeout(resolve,80);requestAnimationFrame(()=>{clearTimeout(timer);resolve();});
    });
    draw(0);await new Promise(resolve=>setTimeout(resolve,0));return {draw,dispose};
  }catch(error){dispose();throw error;}
};
