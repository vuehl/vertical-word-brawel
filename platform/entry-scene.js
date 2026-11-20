import {entryLayout,entryControls} from '../source/src/entry-layout.js';
import {gameViewport} from './viewport.mjs';
import {deskFrame,deskPixelsPerUnit as ppu,deskTilt,entryHeroScale,entryFootOffset} from '../source/src/desk-framing.js';
import pixels from '../source/art/entry/pixels.json';

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

const topStops=[[0,'rgba(201,217,245,.98)'],[15,'rgba(189,212,251,.83)'],[30,'rgba(182,208,253,.64)'],
  [60,'rgba(169,199,250,.34)'],[85,'rgba(169,199,250,.19)'],[110,'rgba(169,199,250,.07)'],[165,'rgba(169,199,250,0)']];
const bottomStops=[[580,0],[610,.045],[630,.12],[650,.22],[680,.42],[700,.56],[720,.71],[740,.86],[760,.95],[790,1],[826,1]];

function paintOverlay(c,w,h,v,mode,tier,value,art){
  const {scale,x,y}=entryLayout(v),rx=w/v.width,ry=h/v.height;
  c.setTransform(rx,0,0,ry,0,0);c.clearRect(0,0,v.width,v.height);
  if(mode==='departure')return;
  const gradient=c.createLinearGradient(0,0,0,v.height);
  for(const [at,color] of topStops)gradient.addColorStop(at/826,color);
  for(const [at,alpha] of bottomStops)gradient.addColorStop(at/826,'rgba(248,244,233,'+alpha+')');
  c.fillStyle=gradient;c.fillRect(0,0,v.width,v.height);
  // The reference supplies the cell locations and coverage. Keep them
  // square and anchored to the nearest screen edge on other aspect ratios.
  const pxScale=v.width/382;
  c.fillStyle='#fff';
  for(const [a,b,width,height,alpha] of pixels){
    const py=b<413?b*pxScale:v.height-(826-b)*pxScale;
    c.globalAlpha=alpha/255;c.fillRect(a*pxScale,py,width*pxScale,height*pxScale);
  }
  c.globalAlpha=1;c.setTransform(scale*rx,0,0,scale*ry,x*rx,y*ry);
  if(mode==='home')c.drawImage(art.home,28,619);
  else if(mode==='map'){
    c.drawImage(art.stages,6,404);c.drawImage(art.ribbon,0,66);
    const [left,,width]=entryControls.tiers[tier];
    c.fillStyle='#344c9b';c.beginPath();c.moveTo(left,646);c.lineTo(left+5,651);
    c.lineTo(left+width-5,651);c.lineTo(left+width,646);c.lineTo(left+width,650);
    c.lineTo(left+width-5,654);c.lineTo(left+5,654);c.lineTo(left,650);c.fill();
  }else{
    c.fillStyle='#205780';c.fillRect(34,722,314,23);
    c.fillStyle='white';c.fillRect(36,724,310,19);
    c.fillStyle='#3586b9';c.fillRect(36,724,310*value/100,19);
    c.fillStyle='#205780';c.font='bold 24px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(value+'%',191,761);
  }
}

module.exports=async function createEntryScene(gl){
  const data=require('./entry-data'),{spawn,idle}=data;
  const files=[...data.layers.map(([name])=>name),'idle.png','home.png','stages.png','ribbon.png'];
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
  let images=null,art=null,reading=null,loadError=false;
  function prepare(){
    if(reading)return reading;
    let next=0,failure=null;
    const loaded=[];
    async function worker(){
      while(!failure&&next<files.length){
        const i=next++;
        try{loaded[i]=await loadImage(files[i]);}catch(error){failure=error;}
      }
    }
    reading=Promise.all([worker(),worker()]).then(()=>{
      reading=null;if(failure)throw failure;
      images=loaded;
      const [actor,home,stages,ribbon]=loaded.slice(data.layers.length);
      art={actor,home,stages,ribbon};
    });
    return reading;
  }
  await prepare();
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
  function page(mode,v,tier=0,value=0,over=false){
    if(disposed)return;
    if(!images){
      if(!reading&&!loadError)prepare().catch(error=>{
        loadError=true;wx.showModal({title:'启动场景读取失败',content:error.message,showCancel:false,
          confirmText:'重试',success:()=>{loadError=false;}});
      });
      return;
    }
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,key=[w,h,v.width,v.height,v.x,v.y,v.w,v.h].join('/');
    if(!w||!h)return;
    if(!textures.length){textures=[gl.createTexture(),gl.createTexture(),gl.createTexture()];upload(1,art.actor);}
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
    const overlayState=mode+'/'+tier+'/'+value;
    if(overlayKey!==overlayState){
      paintOverlay(ui.getContext('2d'),w,h,v,mode,tier,value,art);
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
    if(mode==='boot')gl.uniform1i(uniforms.percent,value);
    gl.uniform1i(uniforms.overScene,over?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);gl.useProgram(null);return true;
  }
  function suspend(){
    for(const tex of textures)gl.deleteTexture(tex);
    textures=[];surfaceKey=overlayKey='';scene.width=scene.height=ui.width=ui.height=1;
  }
  function releaseArt(){images=art=null;}
  const bootView=viewInfo();
  function draw(value,over){bootValue=value;page('boot',bootView,0,value,over);}
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
  async function heroArt(){if(!art)await prepare();return {image:art.actor,idle};}
  return {draw,page,handoff,suspend,releaseArt,heroArt,dispose(){handoff();suspend();releaseArt();disposed=true;gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
};
