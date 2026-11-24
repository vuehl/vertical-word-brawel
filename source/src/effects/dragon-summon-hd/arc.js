import {K as Mesh,st as Scene,w as Color,et as PlaneGeometry,ct as ShaderMaterial,ht as Vector3} from '../../vendor/three-DmSYIDKK.js';

const projection=`
  vec4 projected=projectionMatrix*viewMatrix*vec4(center,1.);
  vec2 focus=projected.xy/projected.w*.5+.5;
  float aspect=projectionMatrix[1][1]/projectionMatrix[0][0];
  vec2 span=vec2(aspect*frameSize.y/frameSize.x,1.);
  vec2 low=span*focus/(anchor-.006),high=span*(1.-focus)/(1.-.006-anchor);
  float zoom=max(max(low.x,low.y),max(high.x,high.y));
`;
const vertexHeader='uniform vec3 center;uniform vec2 anchor,frameSize;varying vec2 sourceUV;';
const planeVertex=vertexHeader+`void main(){`+projection+`
  gl_Position=vec4(position.xy*2.,0.,1.);
  sourceUV=anchor+(uv-focus)*span/zoom;
}`;
const meshVertex=vertexHeader+'attribute vec2 edgeOffset;attribute float inkCoverage;varying float fillCoverage;uniform vec2 renderSize;'+`void main(){`+projection+`
  sourceUV=vec2(position.x/(frameSize.x-1.),1.-position.y/(frameSize.y-1.));
  vec2 screen=focus+(sourceUV-anchor)*zoom/span;
  fillCoverage=inkCoverage;gl_Position=vec4(screen*2.-1.+2.*vec2(edgeOffset.x,-edgeOffset.y)/renderSize,0.,1.);
}`;
const paint=`
 uniform sampler2D mask;uniform vec3 distanceChannel;uniform vec2 frameSize,maskSize,grid;uniform float tile,opacity;
 varying vec2 sourceUV;
 float whiteLight(){
   vec2 frame=vec2(mod(tile,grid.x),floor(tile/grid.x));
   vec2 pixel=.5+clamp(vec2(sourceUV.x,1.-sourceUV.y),0.,1.)*(frameSize-1.);
   vec2 inset=.5/maskSize;
   vec2 atlas=(frame+clamp(pixel/frameSize,inset,1.-inset))/grid;
   float distance=(dot(texture2D(mask,vec2(atlas.x,1.-atlas.y)).rgb,distanceChannel)-.5)*48.;
   // The reference's 9.4 px at 1560x3376 equals 2.35 logical pixels at 390-wide.
   // Source texels per viewport height keep the glow's apparent size at any DPR.
   float sigma=max(.08,9.4/3376.*(frameSize.y-1.)*abs(dFdy(sourceUV.y))*viewportHeight);
   return exp(-.5*pow(min(0.,distance)/sigma,2.));
 }`;
export class Arc {
  constructor(scene,assets,targetTemplate){
    this.scene=scene;this.assets=assets;this.targetTemplate=targetTemplate;const arc=assets.meta.arc;
    this.plane=new PlaneGeometry(1,1);
    this.uniforms={center:{value:new Vector3()},anchor:{value:{x:arc.pivot[0],y:1-arc.pivot[1]}},
      frameSize:{value:{x:arc.width,y:arc.height}},maskSize:{value:{x:arc.maskWidth||arc.width,y:arc.maskHeight||arc.height}},grid:{value:{x:arc.columns,y:arc.rows}},
      distanceChannel:{value:new Vector3(0,0,1)},mask:{value:null},tile:{value:0},opacity:{value:1},viewportHeight:{value:1},renderSize:{value:{x:1,y:1}}};
    this.layers=[];
    const fragments=[
      'float a=.24*whiteLight()*opacity;if(a<.0006)discard;gl_FragColor=vec4(vec3(a),a);',
      'float a=.12*whiteLight();vec3 dark=vec3(.63759687,.02415763,.14126329);gl_FragColor=vec4(mix(dark,vec3(1.),a)*(opacity*fillCoverage),opacity*fillCoverage);',
      'vec3 pink=vec3(.88792312,.05951124,.24228112);gl_FragColor=vec4(pink*(opacity*fillCoverage),opacity*fillCoverage);'
    ];
    for(let i=0;i<3;i++){
      const material=new ShaderMaterial({side:2,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,toneMapped:false,
        uniforms:this.uniforms,vertexShader:i?meshVertex:planeVertex,
        fragmentShader:(i?'varying float fillCoverage;':'')+'uniform float viewportHeight;'+paint+'void main(){'+fragments[i]+'}'});
      const geometry=i?assets.geometry[0][i-1]:this.plane;
      const mesh=new Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=21+i;mesh.visible=false;
      mesh.name=['dragon-summon-white-glow','dragon-summon-dark-arc','dragon-summon-bright-arc'][i];
      mesh.onBeforeRender=renderer=>{const target=renderer.getRenderTarget(),gl=renderer.getContext();this.uniforms.renderSize.value.x=target?.width||gl.drawingBufferWidth;this.uniforms.renderSize.value.y=this.uniforms.viewportHeight.value=target?.height||gl.drawingBufferHeight;};
      scene.add(mesh);this.layers.push(mesh);
    }
  }
  isolate(){
    // At fractional effect opacity, mix the entire group once. Two overlapping
    // paints at half opacity would otherwise show through one another.
    if(this.composite)return;
    this.offscreen=new Scene();
    for(const layer of this.layers)this.offscreen.add(layer);
    const target=this.target=this.targetTemplate.clone();
    target.depthBuffer=false;target.stencilBuffer=false;target.depthTexture=null;target.samples=0;
    target.texture.type=1009;target.texture.generateMipmaps=false;
    const uniforms={image:{value:target.texture},fade:{value:1}};
    const material=new ShaderMaterial({transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms,
      vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy*2.,0.,1.);}',
      fragmentShader:'uniform sampler2D image;uniform float fade;varying vec2 coord;void main(){gl_FragColor=texture2D(image,coord)*fade;}'});
    const mesh=this.composite=new Mesh(this.plane,material);this.scene.add(mesh);
    mesh.name='dragon-summon-opacity';mesh.frustumCulled=false;mesh.renderOrder=23;mesh.visible=false;
    const clearColor=new Color();
    mesh.onBeforeRender=(renderer,scene,camera)=>{
      const previous=renderer.getRenderTarget(),gl=renderer.getContext();
      const w=previous?.width||gl.drawingBufferWidth,h=previous?.height||gl.drawingBufferHeight;
      if(target.width!==w||target.height!==h)target.setSize(w,h);
      renderer.getClearColor(clearColor);const alpha=renderer.getClearAlpha(),auto=renderer.autoClear;
      try{
        renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.autoClear=false;
        renderer.clear(true,false,false);renderer.render(this.offscreen,camera);
      }finally{
        renderer.setRenderTarget(previous);renderer.setClearColor(clearColor,alpha);renderer.autoClear=auto;
      }
    };
  }
  draw(center,progress,opacity){
    const active=progress>=0&&progress<1;
    if(active&&opacity<.9999)this.isolate();
    if(this.composite){this.composite.visible=active;this.composite.material.uniforms.fade.value=opacity;opacity=1;}
    for(const layer of this.layers)layer.visible=active;
    if(!active)return;
    const meta=this.assets.meta.arc,i=Math.min(meta.frames.length-1,Math.floor(progress*meta.frames.length));
    const page=this.assets.page(meta,i),u=this.uniforms;
    const channel=meta.frames[i].channel??2;u.distanceChannel.value.set(channel===0?1:0,channel===1?1:0,channel===2?1:0);u.center.value.copy(center);u.mask.value=page.texture;u.tile.value=page.tile;u.opacity.value=opacity;
    this.layers[1].geometry=this.assets.geometry[i][0];this.layers[2].geometry=this.assets.geometry[i][1];
  }
  dispose(){this.composite?.removeFromParent();this.composite?.material.dispose();this.target?.dispose();for(const layer of this.layers){layer.removeFromParent();layer.material.dispose();}this.plane.dispose();}
}



