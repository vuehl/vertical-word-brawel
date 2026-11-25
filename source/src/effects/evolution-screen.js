import {VFX_SCALE} from './visual-scale.js';
import {K as Mesh,st as Scene,et as PlaneGeometry,ct as ShaderMaterial,ht as Vector3,DeviceFxThree as T} from '../vendor/three-DmSYIDKK.js';
import atlas from '../../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};
import {evolutionTile} from './evolution-timing.js';
import {exteriorBrush,goldPalette} from './evolution-brush.js';

// Present the pigment and its tapered rays directly on the final framebuffer.
export class EvolutionScreen {
  constructor(run){
    this.run=run;this.center=new Vector3();this.scene=new Scene();
    // The silhouette, filament and wash are independent luminance fields.
    this.texture=new T.DataTexture(null,...atlas.textureSize,T.RedFormat);
    this.texture.generateMipmaps=false;this.texture.minFilter=this.texture.magFilter=1006;
    this.uniforms={map:{value:this.texture},frame:{value:0},seconds:{value:0},strength:{value:0},
      focus:{value:{x:.5,y:.5}},span:{value:{x:1,y:1}},exposure:{value:[1,0,0,0]}};
    const plane=new PlaneGeometry(2,2);
    const pass={
      uniforms:this.uniforms,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}',
    };
    this.dimmer=new Mesh(plane,new ShaderMaterial({...pass,fragmentShader:`
      uniform vec4 exposure;uniform float strength;
      void main(){float shade=1.-exposure.x;gl_FragColor=vec4(exposure.yzw/max(shade,.0001),shade*strength);}
    `}));
    this.dimmer.frustumCulled=false;
    this.mesh=new Mesh(plane,new ShaderMaterial({...pass,
      fragmentShader:`
        uniform sampler2D map;
        uniform float frame,strength;
        uniform vec2 focus,span;
        varying vec2 coord;
        ${goldPalette}
        vec2 atlasUV(vec2 pixel, vec2 origin, vec2 size) {
          vec2 q=clamp(pixel/vec2(${atlas.crop[2]}.,${atlas.crop[3]}.),0.,1.);
          vec2 uv=(origin+q*(size-1.)+.5)/vec2(${atlas.textureSize.map(v=>v+'.').join(',')});
          return vec2(uv.x,1.-uv.y);
        }
        float distanceOf(vec2 uv){return (texture2D(map,uv).r*255.-160.)/13.;}
        void main(){
          vec2 source=(coord-focus)*span+vec2(${atlas.focus.join(',')});
          vec2 pixel=vec2(source.x,1.-source.y)*vec2(${atlas.width}.,${atlas.height}.);
          vec2 p=pixel-vec2(${atlas.crop[0]}.,${atlas.crop[1]}.);
          vec2 size=vec2(${atlas.tileWidth}.,${atlas.tileHeight}.);
          vec2 tile=vec2(mod(frame,${atlas.columns}.),floor(frame/${atlas.columns}.))*size;
          vec2 nibSize=vec2(${atlas.nibTile.map(v=>v+'.').join(',')});
          vec2 nibTile=vec2(mod(frame,${atlas.nibColumns}.),floor(frame/${atlas.nibColumns}.))*nibSize
                      +vec2(0.,${atlas.nibY}.);
          vec2 washSize=vec2(${atlas.washTile.map(v=>v+'.').join(',')});
          vec2 washTile=vec2(mod(frame,${atlas.washColumns}.),floor(frame/${atlas.washColumns}.))*washSize
                       +vec2(0.,${atlas.washY}.);
          float d=distanceOf(atlasUV(p,tile,size));
          float nib=distanceOf(atlasUV(p,nibTile,nibSize));
          vec2 border=min(p,vec2(${atlas.crop[2]}.,${atlas.crop[3]}.)-p);
          float seam=min(border.x,border.y);
          float aa=clamp(.65*fwidth(d),.16,.88);
          float mark=smoothstep(-aa,aa,d)*smoothstep(-.5,9.,seam);
          float hit=step(124.,frame);
          float value=texture2D(map,atlasUV(p,washTile,washSize)).r;
          float wash=value*value*exp(-length(min(border,0.))/19.);
          float glow=clamp(wash*mix(.64,1.40,hit),0.,.99);
          vec3 rim,ink,gold,glint;goldPalette(frame,rim,ink,gold,glint);
          float facet=clamp(.46+.0026*(p.x-p.y),0.,1.);
          vec3 pigment=mix(mix(rim,ink,.55),mix(ink,gold,.48*facet),smoothstep(-.22,1.,d));
          pigment=mix(pigment,gold,.70*smoothstep(-2.,-.45,nib));
          float penAA=clamp(.65*fwidth(nib),.24,.86);
          pigment=mix(pigment,glint,smoothstep(-.45-penAA,-.45+penAA,nib));
          vec2 radial=pixel-vec2(195.,368.);
          if(frame>=124.&&frame<=139.){
            float radius=50.+820.*(frame-123.)/15.;
            float ring=1.-smoothstep(.48,1.48,abs(length(radial)-radius));
            float outer=smoothstep(0.,26.,length(min(border,0.)));
            if(radius<520.&&ring*outer>mark){mark=ring*outer*.53;pigment=gold;}
          }
          // The nucleus briefly saturates on the original pulses and burst.
          float white=smoothstep(mix(.48,.24,hit),mix(.91,.79,hit),wash);
          vec3 glowColor=mix(mix(ink,gold,.65),mix(glint,vec3(1.,1.,.975),hit),white);
          float alpha=mark+glow*(1.-mark);
          if(alpha<.002)discard;
          vec3 rgb=(pigment*mark+glowColor*glow*(1.-mark))/alpha;
          gl_FragColor=vec4(rgb,alpha*strength);
        }`,
    }));
    this.mesh.frustumCulled=false;this.mesh.name='evolution-fullscreen';this.mesh.visible=false;
    this.mesh.renderOrder=1;this.streaks=exteriorBrush(atlas,this.uniforms);
    this.scene.add(this.dimmer,this.mesh,this.streaks);run.r.evolutionScreen=this;
  }
  prepare(){
    if(this.disposed)return Promise.resolve(false);
    return this.loading??=new Promise(resolve=>{
      let done=false;
      const finish=ok=>{if(done)return;done=true;clearTimeout(timer);if(!ok)this.loading=null;resolve(ok);};
      const timer=setTimeout(()=>finish(false),12000);
      const {width,height}=this.texture.image;
      window.readCompressedAsset('assets/vfx/evolution-screen.r8.br',width*height).then(async pixels=>{
        if(done||this.disposed){finish(false);return;}
        this.texture.image.data=pixels;this.texture.needsUpdate=true;
        const {renderer,camera}=this.run.r;
        renderer.initTexture(this.texture);
        const target=renderer.getRenderTarget();let linked;
        try{renderer.setRenderTarget(null);linked=renderer.compileAsync(this.scene,camera);}
        finally{renderer.setRenderTarget(target);}
        await linked;
        if(!done){this.loaded=!this.disposed;finish(this.loaded);}
      }).catch(()=>finish(false));
    });
  }
  update(event,sourceFrame,opacity){
    this.event=event;
    const frame=evolutionTile(sourceFrame);this.sourceFrame=sourceFrame;
    this.mesh.visible=!!event&&this.loaded&&frame>=0&&opacity>0;
    if(!this.mesh.visible)return;
    this.uniforms.frame.value=Math.max(0,frame);
    this.uniforms.seconds.value=atlas.times[sourceFrame];
    this.uniforms.exposure.value=atlas.exposures[Math.max(0,frame)];
    // Match existing flash reduction and effect opacity settings.
    const calm=this.run.vfx.calm;
    this.uniforms.strength.value=opacity*(calm?(sourceFrame>=122&&sourceFrame<=132?.18:.55):1);
  }
  draw(renderer){
    if(this.disposed||this.run.hideOwnFx||!this.mesh.visible)return;
    const {actor,height}=this.event,camera=this.run.r.camera;
    this.center.copy(actor.pos);this.center.y+=.08;
    this.center.applyMatrix4(camera.matrixWorldInverse);
    this.center.y+=this.run.vfx.upgrade.camera.focusHeight??height*.48;
    this.center.applyMatrix4(camera.projectionMatrix);
    this.uniforms.focus.value.x=this.center.x*.5+.5;this.uniforms.focus.value.y=this.center.y*.5+.5;
    // Uniform cover scaling preserves circular bursts on tall and short phones.
    const aspect=camera.aspect,sourceAspect=atlas.width/atlas.height;
    this.uniforms.span.value.x=Math.min(1,aspect/sourceAspect)/VFX_SCALE;
    this.uniforms.span.value.y=Math.min(1,sourceAspect/aspect)/VFX_SCALE;
    const target=renderer.getRenderTarget(),auto=renderer.autoClear;
    try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.render(this.scene,camera);}
    finally{renderer.autoClear=auto;renderer.setRenderTarget(target);}
  }
  clear(){this.event=null;this.mesh.visible=false;}
  dispose(){
    this.disposed=true;this.clear();
    if(this.run.r.evolutionScreen===this)this.run.r.evolutionScreen=null;
    this.dimmer.removeFromParent();this.dimmer.material.dispose();
    this.streaks.removeFromParent();this.streaks.geometry.dispose();this.streaks.material.dispose();this.streaks.dispose();
    this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.texture.dispose();
    this.texture.image.data=null;
  }
}
