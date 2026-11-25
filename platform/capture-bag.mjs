function makeOverlay(renderer,filmPlacement) {
  const gl=renderer.getContext();
  function shader(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program=gl.createProgram();
  const vert=shader(gl.VERTEX_SHADER,`#version 300 es
  uniform vec4 uvRect; out vec2 coord;
  void main() {
    vec2 p=vec2(float(gl_VertexID==1)*2.,float(gl_VertexID==2)*2.);
    coord=uvRect.xy+vec2(p.x,1.-p.y)*uvRect.zw;
    gl_Position=vec4(p*2.-1.,0.,1.);
  }`);
  const frag=shader(gl.FRAGMENT_SHADER,`#version 300 es
  precision highp float; in vec2 coord; uniform sampler2D atlas; out vec4 color;
  void main(){color=texture(atlas,coord);}`);
  gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
  gl.deleteShader(vert);gl.deleteShader(frag);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const vao=gl.createVertexArray(),tex=gl.createTexture(),uv=gl.getUniformLocation(program,'uvRect');
  let page=null;
  return {
    draw(frame,img,anchor,zoom){
      const [,x,y,w,h]=frame;
      const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
      const rect=filmPlacement(frame,W,H,anchor,zoom);
      try{
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);gl.disable(gl.STENCIL_TEST);gl.depthMask(false);gl.colorMask(true,true,true,true);
        gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(program);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
        if(img!==page){
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);page=img;
        }
        gl.viewport(rect.left,H-rect.top-rect.height,rect.width,rect.height);
        gl.uniform4f(uv,x/img.width,y/img.height,w/img.width,h/img.height);
        gl.drawArrays(gl.TRIANGLES,0,3);
        return rect;
      }finally{
        gl.bindVertexArray(null);gl.depthMask(true);gl.viewport(0,0,W,H);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);renderer.resetState();
      }
    },
    dispose(){gl.deleteVertexArray(vao);gl.deleteTexture(tex);gl.deleteProgram(program);}
  };
}

const mediaRoot = 'assets/vfx/capture-bag/';

async function createFilm(files){
  const manifest = await files.resolvePath(mediaRoot + 'frames.bin');
  const fs=wx.getFileSystemManager();
  const frames=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const fps = 24;
  const designWidth = 540;
  const landingFrame = 30;
  const pushStart = 27 / fps;
  const pushDuration = 0.52;
  const closestZoom = Math.max(...frames.map(frame => frame[7]));
  function captureZoom(time){
    const u=Math.max(0,Math.min(1,(time-pushStart)/pushDuration));
    return 1+(closestZoom-1)*u*u*(3-2*u);
  }
  // The original shot starts with its leading edge outside the portrait crop.
  const entrySpan = frames[0][8] - (frames[0][5] + frames[0][3]);
  function filmPlacement(frame,width,height,anchor,zoom){
    const footX=(1+anchor.x)*width/2,footY=(1-anchor.y)*height/2;
    // A single scale for the whole take keeps the first exposure outside even
    // when the chosen spirit is close to the far edge of a wide device.
    // Cancel the zoom baked into this exposure and apply the current camera zoom.
    const scale=Math.max(width/designWidth,(footX+1)/entrySpan)*zoom/frame[7];
    return {
      left:Math.round(footX+(frame[5]-frame[8])*scale),
      top:Math.round(footY+(frame[6]-frame[9])*scale),
      width:Math.max(1,Math.round(frame[3]*scale)),
      height:Math.max(1,Math.round(frame[4]*scale))
    };
  }
  const duration = frames.length / fps;

  function loader() {
    const pages = new Map();
    function fetch(id) {
      if (pages.has(id)) return pages.get(id);
      const record = {image:null, promise:null};
      pages.set(id,record);
      record.promise = new Promise((resolve,reject) => {
        const image = wx.createImage();
        image.onload = () => {record.image=image;resolve(image);};
        image.onerror = () => {if(pages.get(id)===record)pages.delete(id);reject(Error('福袋帧图读取失败 '+id));};
        image.src=files.pathFor(mediaRoot+'p'+String(id).padStart(2,'0')+'.webp');
      });
      return record;
    }
    function prepare(id) {
      for (let n=id;n<=Math.min(frames[frames.length-1][0],id+3);n++) fetch(n).promise.catch(()=>{});
      for (const key of pages.keys()) if(key>1&&(key<id-1||key>id+3)) pages.delete(key);
      return pages.get(id)?.image;
    }
    return {fetch,prepare};
  }

  const media=loader();
  await Promise.all([0,1,2,3].map(n=>media.fetch(n).promise));
  return function attach(run,env){
    const b=run.capture.ball,oldStart=b.start,oldUpdate=b.update,oldCamera=run.updateCamera,oldRender=run.player.render;
    const camera=run.r.camera,base=camera.projectionMatrix.clone();
    const ground=run.player.pos.clone(),clicked=ground.clone(),projected=ground.clone();
    const now=()=>env.performance.now();
    let active=false,frameIndex=0,heldFrame=null,heldImage=null,returnTime=null,filmZoom=1,modified=false,overlay;
    function restoreCamera(){
      if(modified){camera.projectionMatrix.copy(base);camera.projectionMatrixInverse.copy(base).invert();modified=false;}
    }
    const progressFrames=[36,52,68];
    let track=null,pips=[],shownResult=false;
    function showPips(step){
      for(let i=0;i<pips.length;i++){
        const icon=pips[i].firstElementChild;
        if(icon)icon.style.opacity=i<step?'1':'.42';
      }
    }
    b.start=function(index,...args){
      const enemy=run.enemies;
      ground.set(enemy.x[index],enemy.y[index],enemy.z[index]);
      camera.updateMatrixWorld(true);
      clicked.copy(ground).project(camera);
      const result=oldStart.call(this,index,...args);
      if(this.active){
        track=run.ui.capEl?.querySelector('.zx-catch-track') || run.ui.capEl?.querySelector('.cap-plate');
        pips=track?track.querySelectorAll('.zx-catch-pips i, .cap-pips i'):[];
        showPips(0);
        if(track){
          run.ui.capEl.style.justifyContent='flex-end';
          track.style.marginBottom='12%';
          track.style.width='252px';
        }
        shownResult=false;
        active=true;frameIndex=0;returnTime=null;filmZoom=1;
      }
      return result;
    };
    run.updateCamera=function(dt){
      restoreCamera();oldCamera.call(this,dt);
      let zoom=1,weight=1;
      if(active){
        filmZoom=captureZoom(b.t);
        zoom=filmZoom;
      }
      else if(returnTime!==null){
        const u=Math.min(1,(now()-returnTime)/260);
        if(u>=1){returnTime=null;return;}
        weight=(1-u)*(1-u);zoom=1+(filmZoom-1)*weight;
      }else return;
      camera.updateMatrixWorld(true);projected.copy(ground).project(camera);
      base.copy(camera.projectionMatrix);
      const dx=(clicked.x-projected.x)*weight+(1-zoom)*projected.x;
      const dy=(clicked.y-projected.y)*weight+(1-zoom)*projected.y;
      const e=camera.projectionMatrix.elements;
      for(let i=0;i<16;i+=4){e[i]=zoom*e[i]+dx*e[i+3];e[i+1]=zoom*e[i+1]+dy*e[i+3];}
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();modified=true;
    };
    run.player.render=function(...args){
      if(!active)return oldRender.apply(this,args);
      if(run.playerFootRing)run.playerFootRing.visible=false;
    };
    b.update=function(dt){
      if(!active || !this.active)return oldUpdate.call(this,dt);
      this.t+=dt;
      frameIndex=Math.min(frames.length-1,Math.floor(this.t*fps));
      if(this.ball)this.ball.visible=false;
      run.enemies.scale[this.index]=frameIndex<landingFrame ? this.scale0 : .001;
      const maxSteps=this.breakAt || progressFrames.length;
      while(this.shakes<maxSteps && frameIndex>=progressFrames[this.shakes]){
        run.audio.ballShake();
        run.ui.captureShake(++this.shakes);
        showPips(this.shakes);
      }
      if(!shownResult && frameIndex>=76){
        shownResult=true;
        if(this.breakAt)run.audio.ballOpen();
        else run.audio.ballClick();
        run.ui.captureResult(this.breakAt===0);
      }
      if(this.t<duration)return;
      active=false;returnTime=now();
      this.ended=this.t;
      run.enemies.scale[this.index]=this.scale0;
      heldFrame=heldImage=null;
      this.finish();
      media.prepare(0);
    };
    function draw(renderer) {
      if (!active || !b.active) return false;
      const frame=frames[frameIndex],page=media.prepare(frame[0]);
      if (page) {
        heldFrame=frame;
        heldImage=page;
      }
      if (heldImage) {
        if (!overlay) overlay=makeOverlay(renderer,filmPlacement);
        overlay.draw(heldFrame,heldImage,clicked,filmZoom);
      }
      return true;
    }
    function detach(){
      restoreCamera();
      b.start=oldStart;
      b.update=oldUpdate;
      run.updateCamera=oldCamera;
      run.player.render=oldRender;
      if(overlay)overlay.dispose();
    }
    return {ball:b,draw,detach,get track(){return track;}};
  };
}

export function createCaptureOverlay(env, files) {
  let attach, bound, preparing=false, retryAt=0;
  function prepare() {
    if (attach || preparing || Date.now()<retryAt) return;
    preparing=true;
    createFilm(files).then(film=>{
      attach=film;
      preparing=false;
    },error=>{
      preparing=false;
      retryAt=Date.now()+30000;
      console.warn('[福袋捕捉] 素材暂不可用，沿用原捕捉演出',error);
    });
  }
  prepare();
  return function drawCapture(renderer, run) {
    const ball=run?.capture?.ball;
    if (bound && (bound.ball!==ball || ball.disposed)) {
      bound.detach();
      bound=null;
    }
    if (ball && !attach) prepare();
    if (attach && ball && !bound && !ball.active && !ball.disposed) bound=attach(run,env);
    return bound?.draw(renderer) ? bound.track : null;
  };
}
