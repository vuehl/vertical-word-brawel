/** Three.js WebGL2 adapter. Input colours are scene-linear; the composite precedes UI.
 * Add each loaded device root (or its clone); pass elapsed seconds to render or composite.
 * The colour and depth arguments of composite must describe the same camera and viewport.
 */
export function createDeviceScreenFx(T, renderer) {
  const uniforms = values => Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));
  const v2 = () => new T.Vector2(), v4 = () => new T.Vector4();
  const proxyScene = new T.Scene(), screenScene = new T.Scene(), starScene = new T.Scene();
  const screenCam = new T.Camera(), entries = new Map();
  const world = new T.Vector3(), vp = new T.Matrix4(), mvp = new T.Matrix4(), clip = v4();
  const size = v2(), union = v4(), savedColour = new T.Color(), savedVP = v4(), savedSC = v4();
  const shader = (vs,fs,values,props={}) => new T.ShaderMaterial({
    uniforms:uniforms(values),vertexShader:vs,fragmentShader:fs,depthTest:false,depthWrite:false,
    toneMapped:false, ...props
  });
  const target = (w,h,depth=false) => new T.WebGLRenderTarget(w,h,{
    type:T.HalfFloatType,format:T.RGBAFormat,minFilter:T.NearestFilter,magFilter:T.NearestFilter,
    depthBuffer:depth,stencilBuffer:false,generateMipmaps:false,samples:0
  });
  const mask=target(1,1,true);
  let beauty=null;
  mask.texture.name='DeviceScreenFx visible devices';
  const quad = new T.BufferGeometry();
  quad.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const fullVS='varying vec2 uvScreen;void main(){uvScreen=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}';
  const maskVS='varying float viewDepth;void main(){vec4 p=modelViewMatrix*vec4(position,1.);viewDepth=-p.z;gl_Position=projectionMatrix*p;}';
  const maskFS=`
    uniform sampler2D worldDepth;
    uniform vec2 resolution;
    uniform vec4 box;
    uniform float deviceId;
    varying float viewDepth;
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      if(gl_FragCoord.z>texture2D(worldDepth,uv).r+.000002)discard;
      vec2 extent=max(box.zw-box.xy,1./resolution);
      vec2 p=(uv-box.xy)/extent;
      gl_FragColor=vec4(deviceId,.55*p.x+.45*(1.-p.y),viewDepth,1.);
    }`;
  const depthFunction=`
    float linearDepth(float d){
      return orthographicView>.5?mix(planes.x,planes.y,d):
        planes.x*planes.y/(planes.y-(planes.y-planes.x)*d);
    }`;
  const pass = shader(fullVS,`
    uniform sampler2D beautyTex, maskTex, worldDepth;
    uniform vec2 resolution,planes;
    uniform vec4 visibleBox;
    uniform float radius, clockSec, orthographicView;
    uniform vec3 cream,bloomColour,ink;
    varying vec2 uvScreen;
    ${depthFunction}
    float CDF(float x){
      float z=abs(x),v=1./(1.+.2316419*z);
      float c=1.-.39894228*exp(-.5*z*z)*v*(.31938153+v*(-.35656378+v*(1.78147794+v*(-1.82125598+v*1.33027443))));
      return x<0.?1.-c:c;
    }
    float blurBand(float d,float s){
      return CDF((d+.036)/s)-CDF((d-.036)/s)+CDF((d+.088)/s)-CDF((d+.070)/s);
    }
    void main(){
      vec2 uv=uvScreen,texel=1./resolution;
      vec4 src=texture2D(beautyTex,uv),m=texture2D(maskTex,uv);
      vec3 col=src.rgb;
      if(m.r>.5){
        if(clockSec>=.22&&clockSec<=1.52){
          vec2 inset=texel*1.5;
          bool inner=texture2D(maskTex,uv+vec2(inset.x,0.)).r==m.r
                  &&texture2D(maskTex,uv-vec2(inset.x,0.)).r==m.r
                  &&texture2D(maskTex,uv+vec2(0.,inset.y)).r==m.r
                  &&texture2D(maskTex,uv-vec2(0.,inset.y)).r==m.r;
          vec3 distanceToInk=abs(col-ink);
          if(inner&&max(max(distanceToInk.r,distanceToInk.g),distanceToInk.b)>.021){
            float u=clamp((clockSec-.22)/1.30,0.,1.);
            float d=m.g-(-.14+1.28*mix(u,smoothstep(0.,1.,u),.76));
            if(abs(d)<=.036||abs(d+.079)<=.009)col=cream;
            else if(d>-.24&&d<.20){
              float g=.48*blurBand(d,.0095)+.45*blurBand(d,.025)+.19*blurBand(d,.045);
              col+=clamp(g,0.,1.)*max(bloomColour-col,vec3(0.));
            }
          }
        }
      }else if(all(greaterThanEqual(uv,visibleBox.xy-(radius+1.)*texel))
            &&all(lessThanEqual(uv,visibleBox.zw+(radius+1.)*texel))){
        float sceneZ=linearDepth(texture2D(worldDepth,uv).r);
        float coverage=0.;
        for(int i=0;i<16;i++){
          float a=float(i)*.392699082;vec2 stepDir=vec2(cos(a),sin(a))*texel*radius;
          vec4 outer=texture2D(maskTex,uv+stepDir),mid=texture2D(maskTex,uv+stepDir*.5);
          coverage=max(coverage,max(step(.5,outer.r)*step(outer.b,sceneZ+.35),step(.5,mid.r)*step(mid.b,sceneZ+.35)));
        }
        col=mix(col,ink,coverage);src.a=max(src.a,coverage);
      }
      gl_FragColor=vec4(col,src.a);
      #include <colorspace_fragment>
    }`,{beautyTex:null,worldDepth:null,maskTex:mask.texture,resolution:v2(),planes:v2(),
      visibleBox:v4(),radius:1,clockSec:0,orthographicView:0,cream:new T.Color(0xefead0),
      bloomColour:new T.Color(0xfdf4d3),ink:new T.Color(0x27232f)});
  const plane=new T.Mesh(quad,pass);plane.frustumCulled=false;screenScene.add(plane);

  const starGeometry=new T.BufferGeometry();let starCapacity=0;
  const starMat=shader(`
    attribute vec4 starData;attribute vec2 anchorUv;varying vec2 vAnchor;
    varying vec2 local;
    varying float deviceId,anchorZ;
    void main(){gl_Position=vec4(position.xy,0.,1.);local=starData.xy;deviceId=starData.z;anchorZ=starData.w;vAnchor=anchorUv;}`,`
    uniform sampler2D maskTex,worldDepth;uniform vec2 resolution,planes;
    uniform float orthographicView;uniform vec3 gold,ivory;
    varying vec2 local;varying float deviceId,anchorZ;varying vec2 vAnchor;
    ${depthFunction}
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      if(texture2D(maskTex,vAnchor).r!=deviceId && linearDepth(texture2D(worldDepth,vAnchor).r)+.12<anchorZ)discard;
      if(texture2D(maskTex,uv).r!=deviceId && linearDepth(texture2D(worldDepth,uv).r)+.12<anchorZ)discard;
      vec2 p=abs(local);
      float d=1.-max(p.x,p.y)-5.667*min(p.x,p.y);
      float aa=max(fwidth(d),.001),a=smoothstep(-.5*aa,.5*aa,d);
      if(a<=.001)discard;
      gl_FragColor=vec4(mix(gold,ivory,smoothstep(.5*aa,1.7*aa,d)),a);
      #include <colorspace_fragment>
    }`,{maskTex:mask.texture,worldDepth:null,resolution:v2(),planes:v2(),orthographicView:0,
        gold:new T.Color(0xd9bc8f),ivory:new T.Color(0xf9f0d1)},{transparent:true});
  const stars=new T.Mesh(starGeometry,starMat);stars.frustumCulled=false;starScene.add(stars);
  const corners=[-1,-1,1,-1,1,1,-1,-1,1,1,-1,1];
  const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
  const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const beat=(t,start,attack,decay)=>t<=start||t>=start+attack+decay?0:
       t<start+attack?smooth((t-start)/attack):1-smooth((t-start-attack)/decay);
  const inScene=(o,s)=>{while(o&&o!==s){if(!o.visible)return false;o=o.parent;}return o===s&&s.visible;};
  function add(root){
    if(entries.has(root))return root;
    const cfg=root.userData.deviceScreenFx;
    if(cfg?.version!==1||!Array.isArray(cfg.supportXYZ)||cfg.supportXYZ.length<12)throw Error('Missing deviceScreenFx v1 on the loaded scene root');
    const mat=shader(maskVS,maskFS,{worldDepth:null,resolution:v2(),box:v4(),deviceId:1},
                  {depthTest:true,depthWrite:true,side:T.DoubleSide});
    const meshes=[];
    root.traverse(src=>{if(src.isMesh){
      const proxy=new T.Mesh(src.geometry,mat);proxy.matrixAutoUpdate=false;proxy.frustumCulled=false;
      proxy.layers.enableAll();proxyScene.add(proxy);meshes.push([src,proxy]);
    }});
    entries.set(root,{cfg,mat,meshes,projected:new Float64Array(cfg.supportXYZ.length)});
    return root;
  }
  function remove(root){const e=entries.get(root);if(!e)return;
    for(const [,p] of e.meshes)proxyScene.remove(p);e.mat.dispose();entries.delete(root);}
  function allocateStars(n){
    if(n<=starCapacity)return;
    starCapacity=Math.max(n,starCapacity*2,24);
    starGeometry.dispose();
    starGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(starCapacity*3),3).setUsage(T.DynamicDrawUsage));
    starGeometry.setAttribute('anchorUv',new T.BufferAttribute(new Float32Array(starCapacity*2),2).setUsage(T.DynamicDrawUsage));
    starGeometry.setAttribute('starData',new T.BufferAttribute(new Float32Array(starCapacity*4),4).setUsage(T.DynamicDrawUsage));
  }
  function update(scene,camera,time,depth,w,h){
    scene.updateMatrixWorld(true);camera.updateWorldMatrix(true,false);
    vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);union.set(1,1,0,0);
    const phase=((time%3)+3)%3,b1=beat(phase,1.51,.14,.28),b2=beat(phase,1.98,.14,.36);
    const pu=pass.uniforms,su=starMat.uniforms;pu.clockSec.value=phase;
    let count=0,active=0,refDepth=Infinity;
    allocateStars(entries.size*12);
    const positions=starGeometry.getAttribute('position'),data=starGeometry.getAttribute('starData'),anchors=starGeometry.getAttribute('anchorUv');
    const putStar=(cx,cy,ryPx,rot,id,z,ax,ay)=>{
      if(ryPx<.35)return;const co=Math.cos(rot),si=Math.sin(rot);
      for(let i=0;i<12;i+=2){
        const u=corners[i],v=corners[i+1],x=u*ryPx*.77,y=v*ryPx;
        positions.setXYZ(count,(cx+(x*co-y*si)/w)*2-1,(cy+(x*si+y*co)/h)*2-1,0);
        data.setXYZW(count,u,v,id,z);anchors.setXY(count,ax,ay);count++;
      }
    };
    for(const [root,e] of entries){
      for(const [,p] of e.meshes)p.visible=false;
      if(!inScene(root,scene)||!e.meshes.some(([src])=>inScene(src,scene)&&camera.layers.test(src.layers)))continue;
      mvp.multiplyMatrices(vp,root.matrixWorld);
      const pts=e.cfg.supportXYZ,p=e.projected;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,n=0;
      for(let i=0;i<pts.length;i+=3){
        clip.set(pts[i],pts[i+1],pts[i+2],1).applyMatrix4(mvp);
        if(clip.w<=0||clip.z < -clip.w)continue;
        const x=clip.x/clip.w*.5+.5,y=clip.y/clip.w*.5+.5;
        p[n++]=x;p[n++]=y;p[n++]=i;
        x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
      }
      if(!n||x0>1.25||y0>1.25||x1<-.25||y1<-.25||x1-x0<1e-6||y1-y0<1e-6)continue;
      if(active>=2047)throw Error('Device mask exhausted its exact half-float IDs');
      const id=++active,mu=e.mat.uniforms;mu.deviceId.value=id;mu.worldDepth.value=depth;
      mu.resolution.value.set(w,h);mu.box.value.set(x0,y0,x1,y1);
      for(const [src,p] of e.meshes){
        p.visible=inScene(src,scene)&&camera.layers.test(src.layers);
        if(p.visible){p.matrix.copy(src.matrixWorld);p.matrixWorldNeedsUpdate=true;}
      }
      union.x=Math.min(union.x,x0);union.y=Math.min(union.y,y0);
      union.z=Math.max(union.z,x1);union.w=Math.max(union.w,y1);
      world.fromArray(e.cfg.centerXYZ).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      refDepth=Math.min(refDepth,Math.max(camera.near,-world.z));
      if(!(b1||b2))continue;
      let score=-Infinity,ix=0;
      for(let i=0;i<n;i+=3){
        const u=(p[i]-x0)/(x1-x0),v=(y1-p[i+1])/(y1-y0);
        const s=u-1.18*v+(u>.54&&v<.46?3:0);
        if(s>score){score=s;ix=i;}
      }
      world.fromArray(pts,p[ix+2]).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      const z=-world.z,dx=x1-x0,dy=y1-y0;
      putStar(p[ix]+.003*dx,p[ix+1]+.02*dy,dy*h*.123*(b1+.48*b2),.065,id,z,p[ix],p[ix+1]);
      putStar(p[ix]+.150*dx,p[ix+1]-.043*dy,dy*h*.067*b2,-.12,id,z,p[ix],p[ix+1]);
    }
    starGeometry.setDrawRange(0,count);
    if(count){positions.needsUpdate=data.needsUpdate=anchors.needsUpdate=true;}
    for(const u of [pu,su]){
      u.worldDepth.value=depth;u.resolution.value.set(w,h);u.planes.value.set(camera.near,camera.far);
      u.orthographicView.value=camera.projectionMatrix.elements[15]===1?1:0;
    }
    pu.visibleBox.value.copy(union);
    return {active,count,refDepth};
  }
  function composite(scene,camera,time,source,destination=null,options={}){
    if(!source?.texture||!source.depthTexture||source===destination)throw Error('Pass distinct colour/depth input and output targets');
    const w=source.width,h=source.height;
    const prev=renderer.getRenderTarget(),auto=renderer.autoClear,scissor=renderer.getScissorTest();
    renderer.getScissor(savedSC);renderer.getViewport(savedVP);renderer.getClearColor(savedColour);
    const alpha=renderer.getClearAlpha();mask.setSize(w,h);
    try{
      const {active,count,refDepth}=update(scene,camera,time,source.depthTexture,w,h);
      let z=refDepth;
      if(options.focusWorld){world.copy(options.focusWorld).applyMatrix4(camera.matrixWorldInverse);z=Math.max(camera.near,-world.z);}
      const magnification=camera.projectionMatrix.elements[5]*h*.5/(camera.isOrthographicCamera?1:z);
      const original=options.originalOutlineRadiusPx??clamp(.13*magnification,1,12);
      pass.uniforms.radius.value=.5*original;pass.uniforms.beautyTex.value=source.texture;
      renderer.autoClear=false;renderer.setScissorTest(false);
      renderer.setRenderTarget(mask);renderer.setClearColor(0,0);renderer.clear(true,true,false);
      if(active)renderer.render(proxyScene,camera);
      renderer.setRenderTarget(destination);renderer.render(screenScene,screenCam);
      if(count)renderer.render(starScene,screenCam);
    }finally{
      renderer.setClearColor(savedColour,alpha);renderer.autoClear=auto;renderer.setRenderTarget(prev);
      renderer.setViewport(savedVP);renderer.setScissor(savedSC);renderer.setScissorTest(scissor);
    }
  }
  function render(scene,camera,time,destination=null,options={}){
    renderer.getDrawingBufferSize(size);
    const w=destination?.width??size.x,h=destination?.height??size.y;
    if(!beauty){beauty=target(w,h,true);beauty.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);}
    beauty.setSize(w,h);const prev=renderer.getRenderTarget(),auto=renderer.autoClear;
    try{renderer.autoClear=true;renderer.setRenderTarget(beauty);renderer.render(scene,camera);}
    finally{renderer.setRenderTarget(prev);renderer.autoClear=auto;}
    composite(scene,camera,time,beauty,destination,options);
  }
  function dispose(){
    for(const root of [...entries.keys()])remove(root);mask.dispose();
    if(beauty){beauty.depthTexture?.dispose();beauty.dispose();}
    pass.dispose();starMat.dispose();quad.dispose();starGeometry.dispose();
  }
  return {add,remove,render,composite,dispose};
}

