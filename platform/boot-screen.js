'use strict';

// Native stationery and the original hero images are bundled in the main pack.
module.exports = async function presentBootFrame(gl) {
  let program=gl.createProgram(),texture=gl.createTexture(),vao=gl.createVertexArray();
  let canvas=wx.createCanvas(),last='',textureWidth=0,textureHeight=0;
  const heroes={};
  for(const [word,src] of Object.entries(require('./boot-hero-art'))){
    const image=wx.createImage();
    image.onload=()=>{if(canvas){heroes[word]=image;last='';}};
    image.src=src;
  }
  function attach(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  function dispose(){
    if(program)gl.deleteProgram(program);if(texture)gl.deleteTexture(texture);if(vao)gl.deleteVertexArray(vao);
    program=texture=vao=null;
    if(canvas){canvas.width=canvas.height=1;canvas=null;}
  }
  function paint(value,w,h){
    canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d'),s=w/390,H=h/s;
    c.scale(s,s);
    const ink='#343044',muted='#637e7e',paper='#fffdf5',hero=H*.43,track=H*.79;
    function rect(x,y,w,h,fill,stroke){
      c.fillStyle=fill;c.fillRect(x,y,w,h);
      if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h);}
    }
    function line(x,y,x2,y2,color,width=1){
      c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
    }
    function text(label,x,y,size,color=ink,bold=false){
      c.font=(bold?'bold ':'')+size+'px sans-serif';c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(label,x,y);
    }
    function sheet(x,y,w,h,angle,fill){
      c.save();c.translate(x,y);c.rotate(angle);
      rect(-w/2+4,-h/2+6,w,h,'#cfdbd4');rect(-w/2,-h/2,w,h,fill,'#a8bcb4');
    }
    rect(0,0,390,H,'#f8f5ea');
    // Cutting mat and notebook echo the game's home illustration.
    rect(0,H*.24,390,H*.39,'#bdd9d9');
    for(let x=10;x<390;x+=22)line(x,H*.24,x,H*.63,'#d4e7e2');
    for(let y=H*.24;y<H*.63;y+=22)line(0,y,390,y,'#d4e7e2');
    sheet(182,hero+8,274,205,-.085,'#f4f3df');
    for(let y=-85;y<95;y+=16)for(let x=-120;x<130;x+=16){c.fillStyle='#c4cebb';c.beginPath();c.arc(x,y,.8,0,7);c.fill();}c.restore();
    sheet(228,hero+40,230,148,.13,paper);
    for(let y=-50;y<70;y+=18)line(-114,y,114,y,'#ccdfe0');line(-81,-74,-81,74,'#e4bdb4');c.restore();
    c.save();c.translate(126,hero-96);c.rotate(-.15);rect(-38,-10,76,20,'#ddcf9e');
    for(let x=-33;x<38;x+=10)line(x,-9,x+7,9,'#eee2bd',3);c.restore();
    // Pencil and ruler frame the paper world.
    c.save();c.translate(338,hero-15);c.rotate(.28);
    rect(-6,-95,13,164,'#d0a25c');rect(-3,-95,5,164,'#f5d884');rect(-6,-105,13,15,'#c99498');
    c.fillStyle='#e5cfaa';c.beginPath();c.moveTo(-6,69);c.lineTo(7,69);c.lineTo(.5,90);c.closePath();c.fill();
    c.fillStyle=ink;c.beginPath();c.moveTo(-1.5,83);c.lineTo(2.5,83);c.lineTo(.5,90);c.closePath();c.fill();c.restore();
    c.save();c.translate(78,hero+108);c.rotate(-.12);rect(-35,0,252,25,'#ecd396','#bb9c5c');
    for(let x=-28;x<214;x+=9)line(x,1,x,(x+28)%27===0?13:8,'#a88c57');c.restore();
    for(const [word,x,y] of [['风',107,hero+5],['炎',192,hero-9],['摹',277,hero+23]]){
      if(heroes[word])c.drawImage(heroes[word],x-36,y-36,72,72);
    }
    const titleY=Math.max(100,hero-169);
    text('字  行',195,titleY+3,54,ink,true);
    c.font='bold 54px sans-serif';c.lineJoin='round';c.lineWidth=3;c.strokeStyle=ink;c.strokeText('字  行',195,titleY);
    text('字  行',195,titleY,54,'#f2d280',true);text('桌上有天地 · 落字即成灵',195,titleY+50,13,muted);
    text(value>=95?'正在翻开第一页':value>=85?'正在整理纸上世界':'正在唤醒字灵',195,track-32,16,ink,true);
    rect(61,track,268,8,'#dce5da');if(value>0)rect(61,track,268*value/100,8,'#829f94');
    text(value+'%',195,track+31,18,ink,true);text('一笔一画，启程纸上冒险',195,H-47,12,muted);
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
    function draw(value,overlay=false){
      if(!program)return;
      value=Math.max(0,Math.min(100,Math.floor(value)));
      const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,key=w+'x'+h+'@'+value;
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.colorMask(true,true,true,true);
      gl.viewport(0,0,w,h);gl.useProgram(program);gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      // Repeated first-frame checks reuse the same texture without repainting.
      if(key!==last){
        paint(value,w,h);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
        if(textureWidth!==w||textureHeight!==h){
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);textureWidth=w;textureHeight=h;
        }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
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
