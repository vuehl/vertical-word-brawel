import {captureSoulTiming,removedCaptureStrokes} from '../source/src/actors/capture-soul-timing.js';
import {escapeMotion} from './capture-escape-motion.mjs';
import {createSmoothSoulDrain} from './capture-soul-drain.mjs';

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
  const vao=gl.createVertexArray(),uv=gl.getUniformLocation(program,'uvRect');
  let page=null,tex=null;
  function releasePage(){
    if(tex)gl.deleteTexture(tex);
    tex=page=null;
  }
  return {
    draw(frame,img,anchor,zoom,dynamic=false){
      const [,x,y,w,h]=frame;
      const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
      const rect=filmPlacement(frame,W,H,anchor,zoom);
      try{
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);gl.disable(gl.STENCIL_TEST);gl.depthMask(false);gl.colorMask(true,true,true,true);
        gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        tex??=gl.createTexture();
        gl.useProgram(program);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
        if(dynamic || img!==page){
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
    releasePage,
    dispose(){releasePage();gl.deleteVertexArray(vao);gl.deleteProgram(program);}
  };
}

const mediaRoot = 'assets/vfx/capture-bag/';

async function createFilm(files){
  const manifest = await files.resolvePath(mediaRoot + 'frames.bin');
  const fs=wx.getFileSystemManager();
  const frames=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const fps = 24;
  const designWidth = 540;
  // Distance behind the target and beyond its right edge in the unzoomed film.
  const bagSetback = 35 / designWidth;
  const bagSideOffset = 41 / designWidth;
  // Keep the approved close-up framing independent of the bag's landing point.
  const closeRightExtent = 113.1 / designWidth;
  const closeTopExtent = 176 / designWidth;
  const pushStart = 27 / fps;
  const pushDuration = 0.52;
  const closestZoom = Math.max(...frames.map(frame => frame[7]));
  function pushProgress(time){
    const u=Math.max(0,Math.min(1,(time-pushStart)/pushDuration));
    return u*u*(3-2*u);
  }
  // Placement uses the original 540-wide portrait crop, including its transparent margins.
  const entrySpan = frames[0][8] - (frames[0][5] + frames[0][3]);
  function filmPlacement(frame,width,height,anchor,zoom){
    const footX=(1+anchor.x)*width/2,footY=(1-anchor.y)*height/2;
    const scale=width/designWidth*zoom/frame[7];
    return {
      left:Math.round(footX+(frame[5]-frame[8])*scale),
      top:Math.round(footY+(frame[6]-frame[9])*scale),
      width:Math.max(1,Math.round(frame[3]*scale)),
      height:Math.max(1,Math.round(frame[4]*scale))
    };
  }
  // Zero-based exposures: the escape holds the open bag through frame 95.
  const escapeLastFrame = 95;
  const escapeEndFrame = 110;

  function loader() {
    const pages = new Map();
    let pending = 0;
    function fetch(id) {
      if (pages.has(id)) return pages.get(id);
      // A slow native decoder can outlive a skipped frame or a finished throw.
      if (pending >= 2) return;
      const record = {image:null, promise:null};
      pages.set(id,record);
      pending++;
      record.promise = new Promise((resolve,reject) => {
        const image = wx.createImage();
        function finish(ok){
          clearTimeout(timer);
          image.onload=image.onerror=null;
          if(ok){record.image=image;resolve();}
          else reject(Error('福袋帧图读取失败 '+id));
        }
        const timer=setTimeout(()=>finish(false),12000);
        image.onload=()=>finish(true);
        image.onerror=()=>finish(false);
        try{image.src=files.pathFor(mediaRoot+'p'+String(id).padStart(2,'0')+'.webp');}
        catch{finish(false);}
      }).catch(error=>{
        if(pages.get(id)===record)pages.delete(id);
        throw error;
      }).finally(()=>{pending--;});
      return record;
    }
    function prepare(id,lastPage) {
      for (const key of pages.keys()) if(key!==0 && key!==id && key!==id+1) pages.delete(key);
      for (let n=id;n<=Math.min(lastPage,id+1);n++) {
        if(!pages.has(n))fetch(n)?.promise.catch(()=>{});
      }
      return pages.get(id)?.image;
    }
    function idle(){for(const key of pages.keys())if(key!==0)pages.delete(key);}
    return {fetch,prepare,idle};
  }

  const media=loader();
  await media.fetch(0).promise;
  return function attach(run,env){
    const b=run.capture.ball,oldStart=b.start,oldUpdate=b.update,oldCamera=run.updateCamera,oldRender=run.player.render;
    const camera=run.r.camera,base=camera.projectionMatrix.clone();
    const ground=run.player.pos.clone(),clicked=ground.clone(),projected=ground.clone();
    const basePosition=camera.position.clone(),panOffset=ground.clone(),centerGround=ground.clone(),ray=ground.clone();
    const bagAnchor={x:0,y:0};
    let soulDrain,effectOverlay,foreground;
    function disposeForeground(){
      if(!foreground)return;
      foreground.mesh.dispose();foreground.mesh.geometry.dispose();foreground.mesh.material.dispose();foreground=null;
    }
    function drawEscapeForeground(renderer){
      const snapshot=b.escapeForeground;
      if(!snapshot||!b.breakAt||b.t*24<96||b.t*24>=110)return;
      const batch=snapshot.batch,source=batch.material;
      if(!foreground||foreground.source!==source){
        disposeForeground();
        const geometry=batch.mesh.geometry.clone(),material=source.clone();
        material.uniforms={...source.uniforms};material.depthTest=false;material.depthWrite=false;
        // The world pass writes an ink mask into alpha. This pass composites
        // straight onto the screen, so the glyph needs normal alpha blending.
        material.blending=1; // THREE.NormalBlending
        const attrs=[['aPos','iPos'],['aSize','iSize'],['aUV','iUV'],['aFx','iFx'],['aTint','iTint'],['aLook','iLook']];
        for(const [key,name] of attrs){const original=batch[key];geometry.setAttribute(name,new original.constructor(new Float32Array(original.itemSize),original.itemSize));}
        const mesh=new batch.mesh.constructor(geometry,material,1);mesh.count=1;mesh.frustumCulled=false;
        const scene=new run.sprites.scene.constructor();scene.add(mesh);
        foreground={source,mesh,scene,attrs};
      }
      for(const [key,name] of foreground.attrs){const a=foreground.mesh.geometry.getAttribute(name);a.array.set(snapshot.attributes[key]);a.needsUpdate=true;}
      const autoClear=renderer.autoClear;
      try{renderer.autoClear=false;renderer.render(foreground.scene,camera);}
      finally{renderer.autoClear=autoClear;renderer.resetState();}
    }
    const quadOrigin=ground.clone(),quadRight=ground.clone(),quadUp=ground.clone(),quadPoint=ground.clone();
    function captureProjection(aspect){
      const quad=b.captureQuad;
      if(!quad)return [];
      const sizeX=quad.size[0]*(1+quad.squash*.35),sizeY=quad.size[1]*(1-quad.squash*.3);
      quadOrigin.set(...quad.pos);
      quadPoint.setFromMatrixColumn(camera.matrixWorld,2).multiplyScalar(.25+quad.size[1]*.05);
      quadOrigin.add(quadPoint);
      quadRight.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(sizeX);
      const lean=quad.lean;
      quadUp.setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(lean);quadUp.y+=1-lean;
      quadUp.normalize().multiplyScalar(sizeY);
      stream.from.copy(quadOrigin).addScaledVector(quadUp,.5).project(camera);
      quadPoint.copy(quadOrigin).addScaledVector(quadUp,.5).add(quadRight).project(camera);
      stream.glyphWidth=Math.abs(quadPoint.x-stream.from.x)*designWidth/(2*filmZoom);
      return (b.spiritStrokes||[]).map(stroke=>{
        quadPoint.copy(quadOrigin).addScaledVector(quadRight,stroke.captureOffsetX||0).addScaledVector(quadUp,.5-(stroke.captureOffsetY||0)).project(camera);
        return {x:(quadPoint.x-stream.from.x)*designWidth/(2*filmZoom),y:-(quadPoint.y-stream.from.y)*designWidth/(2*aspect*filmZoom)};
      });
    }
    const pose={position:ground.clone(),scale:1,stretch:0};
    const stream={from:ground.clone(),toX:0,toY:0,phase:0,glyphWidth:0};
    // The open seam sits about 47 design pixels above the bag's ground anchor.
    function updateSpirit(){
      const frame=b.t*fps, escaping=b.breakAt && frame>=96;
      b.spiritPose=null;stream.phase=0;
      if(frame<=76 || (escaping && frame>=110))return;
      const aspect=run.r.renderer.domElement.width/run.r.renderer.domElement.height;
      const phase=Math.min(1,(frame-76)/18);
      const jump=escaping?Math.min(1,(frame-96)/14):0;
      const pop=escaping?escapeMotion(jump):null;
      const glyph=run.sprites.get(run.enemies.species[b.index],false,run.enemies.glyphWords[b.index]);
      const halfHeight=Math.max(1.9,Math.min(2.55,glyph.bodyHeight(1)*1.3))*b.scale0/2;
      stream.from.setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(.65);
      stream.from.y+=.35;
      stream.from.normalize().multiplyScalar(halfHeight).add(ground);
      stream.from.y+=.08+.035*Math.sin(b.t*3.2);
      // Project the full glyph quad width before moving or shrinking any stroke.
      projected.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(halfHeight*2).add(stream.from).project(camera);
      stream.from.project(camera);
      stream.glyphWidth=Math.abs(projected.x-stream.from.x)*designWidth/(2*filmZoom);
      stream.toX=shotX+2*(bagOffsetX+3/designWidth*filmZoom);
      stream.toY=shotY+2*aspect*filmZoom*(bagSetback+47/designWidth);
      stream.phase=escaping?0:phase;
      pose.position.copy(ground);
      if(escaping){
        // Animate the visible centre from the intake, not the character's feet.
        quadPoint.copy(stream.from).unproject(camera).sub(ground);
        pose.position.copy(stream.from);
        pose.position.x=stream.toX+(stream.from.x-stream.toX)*pop.advance;
        pose.position.y=stream.toY+(stream.from.y-stream.toY)*pop.advance+2*aspect*filmZoom*pop.lift/designWidth;
        pose.position.unproject(camera).addScaledVector(quadPoint,-pop.scale);
        // The billboard's centre also moves with its launch/landing stretch.
        projected.setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(.65);projected.y+=.35;
        projected.normalize().multiplyScalar(halfHeight*pop.scale*.20*pop.stretch);
        pose.position.sub(projected);
        pose.position.y-=(.08+.035*Math.sin(b.t*3.2))*(1-pop.scale);
      }
      const count=b.spiritStrokeCount||4,time=phase*captureSoulTiming.duration;
      pose.removed=escaping?0:removedCaptureStrokes(time,count);
      pose.fade=0;
      pose.scale=escaping?pop.scale:pose.removed>=count?0:1;
      pose.stretch=escaping?pop.stretch:0;
      b.spiritPose=pose;
    }
    let startDistance=0,closeDistance=0,bagOffsetX=0,closeX=0,closeY=0,shotX=0,shotY=0;
    const now=()=>env.performance.now();
    let active=false,frameIndex=0,heldFrame=null,heldImage=null,returnTime=null,filmZoom=1,modified=false,overlay;
    function restoreCamera(){
      if(!modified)return;
      camera.position.copy(basePosition);camera.updateMatrixWorld(true);
      camera.projectionMatrix.copy(base);camera.projectionMatrixInverse.copy(base).invert();modified=false;
    }
    const progressFrames=[36,52,68];
    let lastFrame=frames.length-1;
    let track=null,pips=[],shownResult=false;
    function showPips(step){
      for(let i=0;i<pips.length;i++){
        const icon=pips[i].firstElementChild;
        if(icon)icon.style.opacity=i<step?'1':'.42';
      }
    }
    b.start=function(index,...args){
      const enemy=run.enemies;
      b.spiritStrokes=null;b.spiritStrokeCount=0;b.captureQuad=null;b.escapeForeground=null;
      ground.set(enemy.x[index],enemy.y[index],enemy.z[index]);
      camera.updateMatrixWorld(true);
      clicked.copy(ground).project(camera);
      // Measure the target at the instant of the throw, in fractions of screen width.
      const radius=enemy.radius[index];
      projected.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(radius).add(ground).project(camera);
      const startHalfWidth=Math.max(.045,Math.abs(projected.x-clicked.x)/2);
      // A horizontal pan puts the spirit at the same camera depth as a centre throw.
      // This also preserves its apparent size on maps with a perspective camera.
      centerGround.set(0,0,-.5).unproject(camera);
      ray.set(0,0,.5).unproject(camera).sub(centerGround);
      panOffset.set(0,0,0);
      let centerHalfWidth=startHalfWidth;
      if(Math.abs(ray.y)>1e-6){
        centerGround.addScaledVector(ray,(ground.y-centerGround.y)/ray.y);
        panOffset.copy(ground).sub(centerGround);
        projected.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(radius).add(centerGround).project(camera);
        centerHalfWidth=Math.max(.045,Math.abs(projected.x)/2);
      }
      startDistance=startHalfWidth+bagSideOffset;
      closeDistance=(centerHalfWidth+bagSideOffset)*closestZoom;
      bagOffsetX=startDistance;
      // Fit only the destination. Clamping each axis during the push causes a dogleg.
      const left=-1+2*(.025+centerHalfWidth*closestZoom);
      const right=1-2*(.025+(centerHalfWidth+closeRightExtent)*closestZoom);
      closeX=Math.max(left,Math.min(right,0));
      const canvas=run.r.renderer.domElement;
      const top=.95-2*(canvas.width/canvas.height)*closestZoom*closeTopExtent;
      closeY=Math.max(-.54,Math.min(top,0));
      shotX=clicked.x;
      shotY=clicked.y;
      const result=oldStart.call(this,index,...args);
      if(this.active){
        this.captureFilmActive=true;
        this.spiritPose=null;stream.phase=0;
        track=run.ui.capEl?.querySelector('.zx-catch-track') || run.ui.capEl?.querySelector('.cap-plate');
        pips=track?track.querySelectorAll('.zx-catch-pips i, .cap-pips i'):[];
        showPips(0);
        if(track){
          run.ui.capEl.style.justifyContent='flex-end';
          track.style.marginBottom='12%';
          track.style.width='252px';
        }
        lastFrame=this.breakAt ? Math.min(escapeLastFrame,frames.length-1) : frames.length-1;
        shownResult=false;
        active=true;frameIndex=0;returnTime=null;filmZoom=1;
      }
      return result;
    };
    run.updateCamera=function(dt){
      restoreCamera();oldCamera.call(this,dt);
      if(!active && returnTime===null)return;
      let zoom=1,weight=1;
      const push=pushProgress(b.t);
      if(active){
        filmZoom=1+(closestZoom-1)*push;
        zoom=filmZoom;
      }
      else{
        const u=Math.min(1,(now()-returnTime)/260);
        if(u>=1){returnTime=null;return;}
        weight=(1-u)*(1-u);zoom=1+(filmZoom-1)*weight;
      }
      basePosition.copy(camera.position);
      camera.position.addScaledVector(panOffset,push*weight);
      camera.updateMatrixWorld(true);projected.copy(ground).project(camera);
      base.copy(camera.projectionMatrix);
      shotX=clicked.x+(closeX-clicked.x)*push;
      shotY=clicked.y+(closeY-clicked.y)*push;
      bagOffsetX=startDistance+(closeDistance-startDistance)*push;
      const dx=(shotX-projected.x)*weight+(1-zoom)*projected.x;
      const dy=(shotY-projected.y)*weight+(1-zoom)*projected.y;
      const e=camera.projectionMatrix.elements;
      for(let i=0;i<16;i+=4){e[i]=zoom*e[i]+dx*e[i+3];e[i+1]=zoom*e[i+1]+dy*e[i+3];}
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();modified=true;
      if(active)updateSpirit();
    };
    run.player.render=function(...args){
      if(!active)return oldRender.apply(this,args);
      if(run.playerFootRing)run.playerFootRing.visible=false;
    };
    b.update=function(dt){
      if(!active || !this.active)return oldUpdate.call(this,dt);
      this.t+=dt;
      frameIndex=Math.min(lastFrame,Math.floor(this.t*fps));
      if(this.ball)this.ball.visible=false;
      const maxSteps=this.breakAt || progressFrames.length;
      while(this.shakes<maxSteps && frameIndex>=progressFrames[this.shakes]){
        run.audio.ballShake();
        run.ui.captureShake(++this.shakes);
        showPips(this.shakes);
      }
      if(!shownResult && this.t*fps>=96){
        shownResult=true;
        if(this.breakAt)run.audio.ballOpen();
        else run.audio.ballClick();
        run.ui.captureResult(this.breakAt===0);
      }
      if(this.t<((this.breakAt?escapeEndFrame:lastFrame)+1)/fps)return;
      active=false;returnTime=now();
      this.spiritPose=null;stream.phase=0;
      this.ended=this.t;
      run.enemies.scale[this.index]=this.scale0;
      releasePages();
      this.finish();
    };
    function releasePages(){
      b.captureFilmActive=false;
      heldFrame=heldImage=null;
      overlay?.releasePage();
      effectOverlay?.releasePage();
      disposeForeground();
      soulDrain=null;
      b.spiritStrokes=b.captureQuad=b.escapeForeground=null;
      b.spiritStrokeCount=0;
      media.idle();
    }
    function draw(renderer) {
      if (!active || !b.active) return false;
      const frame=frames[frameIndex],page=media.prepare(frame[0],frames[lastFrame][0]);
      if (page) {
        heldFrame=frame;
        heldImage=page;
      }
      if (heldImage) {
        if (!overlay) overlay=makeOverlay(renderer,filmPlacement);
        const gl=renderer.getContext(),aspect=gl.drawingBufferWidth/gl.drawingBufferHeight;
        const entry=Math.min(1,b.t/(12/fps));
        const approach=1-entry*entry*(3-2*entry);
        bagAnchor.x=shotX+2*bagOffsetX;
        // Keep the incoming roll above the glyph as it crosses from offscreen.
        bagAnchor.y=shotY+2*aspect*filmZoom*(bagSetback+.23*approach);
        const outsideAtStart=clicked.x+2*startDistance+1-2*entrySpan/designWidth;
        bagAnchor.x-=Math.max(0,outsideAtStart+.01)*approach;
        overlay.draw(heldFrame,heldImage,bagAnchor,filmZoom);
        drawEscapeForeground(renderer);
        if(stream.phase>0 && stream.phase<1){
          if(!effectOverlay)effectOverlay=makeOverlay(renderer,filmPlacement);
          const origins=captureProjection(aspect);
          const anchor={x:(stream.from.x+stream.toX)/2,y:(stream.from.y+stream.toY)/2};
          const dx=(stream.toX-stream.from.x)*designWidth/(2*filmZoom);
          const dy=-(stream.toY-stream.from.y)*designWidth/(2*aspect*filmZoom);
          soulDrain??=createSmoothSoulDrain();
          const {canvas,extent}=soulDrain.draw(stream.phase,dx,dy,b.spiritStrokes,stream.glyphWidth,origins);
          effectOverlay.draw([0,0,0,canvas.width,canvas.height,-canvas.width/2,-canvas.height/2,
            canvas.width/extent,0,0],canvas,anchor,filmZoom,true);
        }
      }
      return true;
    }
    function detach(){
      restoreCamera();
      b.spiritPose=null;
      b.start=oldStart;
      b.update=oldUpdate;
      run.updateCamera=oldCamera;
      run.player.render=oldRender;
      releasePages();
      overlay?.dispose();
      effectOverlay?.dispose();
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
