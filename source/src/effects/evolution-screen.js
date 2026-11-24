import {K as Mesh,st as Scene,et as PlaneGeometry,ct as ShaderMaterial,dt as Texture,ht as Vector3} from '../vendor/three-DmSYIDKK.js';
import atlas from '../../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};
import {evolutionTile} from './evolution-timing.js';

// One reusable GPU overlay, after the world and native HUD. No animated DOM
// canvas uploads, GIF decoding or allocations during the evolution itself.
export class EvolutionScreen {
  constructor(run){
    this.run=run;this.center=new Vector3();this.scene=new Scene();
    // Atlas RGB and fitted exposure are both display-space values. Composite
    // them in that space, as in the supplied GIF, without a second gamma lift.
    this.texture=new Texture();
    this.texture.generateMipmaps=false;this.texture.minFilter=this.texture.magFilter=1006;
    this.uniforms={map:{value:this.texture},frame:{value:0},strength:{value:0},
      focus:{value:{x:.5,y:.5}},span:{value:{x:1,y:1}},exposure:{value:[1,0,0,0]}};
    this.mesh=new Mesh(new PlaneGeometry(2,2),new ShaderMaterial({
      uniforms:this.uniforms,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`
        uniform sampler2D map;
        uniform float frame,strength;
        uniform vec2 focus,span;
        uniform vec4 exposure;
        varying vec2 coord;
        void main(){
          vec2 source=(coord-focus)*span+vec2(${atlas.focus.join(',')});
          vec2 grid=vec2(${atlas.columns}.,${atlas.rows}.);
          vec2 tile=vec2(mod(frame,grid.x),grid.y-1.-floor(frame/grid.x));
          vec2 size=vec2(${atlas.tileWidth}.,${atlas.tileHeight}.);
          vec2 uv=(tile+(clamp(source,0.,1.)*(size-1.)+.5)/size)/grid;
          vec4 ink=texture2D(map,uv);
          if(any(lessThan(source,vec2(0.)))||any(greaterThan(source,vec2(1.))))ink.a=0.;
          float shade=1.-exposure.x;
          vec3 tint=exposure.yzw/max(shade,.0001);
          float alpha=ink.a+shade*(1.-ink.a);
          vec3 rgb=(ink.rgb*ink.a+tint*shade*(1.-ink.a))/max(alpha,.0001);
          gl_FragColor=vec4(rgb,alpha*strength);
        }`,
    }));
    this.mesh.frustumCulled=false;this.mesh.name='evolution-fullscreen';this.mesh.visible=false;
    this.scene.add(this.mesh);run.r.evolutionScreen=this;
  }
  prepare(){
    if(this.disposed)return Promise.resolve(false);
    return this.loading??=new Promise(resolve=>{
      const image=new Image();
      const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;if(!ok)this.loading=null;resolve(ok);};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=async()=>{
        if(this.disposed){finish(false);return;}
        try{
          this.texture.image=image;this.texture.needsUpdate=true;
          const {renderer,camera}=this.run.r;
          renderer.initTexture(this.texture);
          const target=renderer.getRenderTarget();let linked;
          try{renderer.setRenderTarget(null);linked=renderer.compileAsync(this.mesh,camera,this.scene);}
          finally{renderer.setRenderTarget(target);}
          await linked;
          this.loaded=!this.disposed;finish(this.loaded);
        }catch{finish(false);}
      };
      image.onerror=()=>finish(false);image.src='assets/vfx/evolution-screen.webp';
    });
  }
  update(event,sourceFrame,opacity){
    this.event=event;
    const frame=evolutionTile(sourceFrame);this.sourceFrame=sourceFrame;
    this.mesh.visible=!!event&&this.loaded&&frame>=0&&opacity>0;
    if(!this.mesh.visible)return;
    this.uniforms.frame.value=Math.max(0,frame);
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
    this.uniforms.span.value.x=Math.min(1,aspect/sourceAspect);
    this.uniforms.span.value.y=Math.min(1,sourceAspect/aspect);
    const target=renderer.getRenderTarget(),auto=renderer.autoClear;
    try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.render(this.scene,camera);}
    finally{renderer.autoClear=auto;renderer.setRenderTarget(target);}
  }
  clear(){this.event=null;this.mesh.visible=false;}
  dispose(){
    this.disposed=true;this.clear();
    if(this.run.r.evolutionScreen===this)this.run.r.evolutionScreen=null;
    this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.texture.dispose();
  }
}
