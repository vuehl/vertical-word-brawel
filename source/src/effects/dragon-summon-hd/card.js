import {et as PlaneGeometry,H as InstancedMesh,ct as ShaderMaterial}
  from '../../vendor/three-DmSYIDKK.js';

export const SUMMON_TIMING={total:4.07,implode:3.10,burst:3.27,whiteIn:3.29,whiteFull:3.32,whiteOut:3.38,after:3.41,reveal:3.68};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};

export class ReferenceCard {
  constructor(scene,assets,meta,kind){
    this.assets=assets;this.meta=meta;
    const geometry=new PlaneGeometry(1,1);
    const material=new ShaderMaterial({side:2,transparent:true,premultipliedAlpha:true,depthWrite:false,depthTest:false,lights:false,toneMapped:false,
      uniforms:{map:{value:null},bgMap:{value:assets.textures.get(assets.meta.orb.background.file)},grid:{value:{x:meta.columns,y:meta.rows}},frameSize:{value:{x:meta.width,y:meta.height}},
        currentFrame:{value:0},kind:{value:kind},screenAspect:{value:1},center:{value:{x:0,y:0,z:0}},size:{value:{x:1,y:1}},opacity:{value:0}},
      vertexShader:`uniform vec3 center;uniform vec2 size,frameSize;uniform float kind,screenAspect;varying vec2 coord;
        void main(){
          if(kind>.5){
            // A clip-space quad covers the actual viewport, including its top
            // and bottom. Cover-fit keeps the reference shapes undistorted.
            gl_Position=vec4(position.xy*2.,0.,1.);
            float sourceAspect=frameSize.x/frameSize.y;
            vec2 cover=screenAspect<sourceAspect?vec2(screenAspect/sourceAspect,1.):vec2(1.,sourceAspect/screenAspect);
            vec4 focus=projectionMatrix*viewMatrix*vec4(center,1.);
            vec2 focusUV=focus.xy/focus.w*.5+.5;
            coord=clamp(.5+(uv-focusUV)*cover/1.04,vec2(0.),vec2(1.));
            return;
          }
          vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
          vec3 up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
          vec2 anchor=kind<.5?vec2(.5,1.-.455):vec2(.5,.5);
          vec2 p=(uv-anchor)*size;
          gl_Position=projectionMatrix*viewMatrix*vec4(center+right*p.x+up*p.y,1.);coord=uv;
        }`,
      fragmentShader:`uniform sampler2D map,bgMap;uniform vec2 grid,frameSize;uniform float currentFrame,kind,opacity;varying vec2 coord;
        vec3 texel(sampler2D source,vec2 p,vec2 tile,vec2 sourceGrid){
          vec2 xy=(tile*frameSize+clamp(p,vec2(.5),frameSize-.5))/(frameSize*sourceGrid);
          return texture2D(source,vec2(xy.x,1.-xy.y)).rgb;
        }
        vec3 sampleFrame(sampler2D source,float frame,vec2 sourceGrid){
          vec2 tile=vec2(mod(frame,sourceGrid.x),floor(frame/sourceGrid.x));
          vec2 q=vec2(coord.x,1.-coord.y)*(frameSize-1.), p=floor(q)+.5,t=fract(q),t2=t*t;
          vec2 w0=t*(-.5+t*(1.-.5*t)),w1=1.+t2*(-2.5+1.5*t);
          vec2 w2=t*(.5+t*(2.-1.5*t)),w3=.5*t2*(t-1.);
          vec2 mid=w1+w2,qm=p+w2/mid;
          vec3 r0=w0.x*texel(source,p-1.,tile,sourceGrid)+mid.x*texel(source,vec2(qm.x,p.y-1.),tile,sourceGrid)+w3.x*texel(source,p+vec2(2.,-1.),tile,sourceGrid);
          vec3 r1=w0.x*texel(source,vec2(p.x-1.,qm.y),tile,sourceGrid)+mid.x*texel(source,qm,tile,sourceGrid)+w3.x*texel(source,vec2(p.x+2.,qm.y),tile,sourceGrid);
          vec3 r2=w0.x*texel(source,p+vec2(-1.,2.),tile,sourceGrid)+mid.x*texel(source,vec2(qm.x,p.y+2.),tile,sourceGrid)+w3.x*texel(source,p+2.,tile,sourceGrid);
          vec3 a=texel(source,p,tile,sourceGrid),b=texel(source,p+vec2(1.,0.),tile,sourceGrid),c=texel(source,p+vec2(0.,1.),tile,sourceGrid),dd=texel(source,p+1.,tile,sourceGrid);
          return clamp(w0.y*r0+mid.y*r1+w3.y*r2,min(min(a,b),min(c,dd)),max(max(a,b),max(c,dd)));
        }
        void main(){
          vec3 original=sampleFrame(map,currentFrame,grid),c=original;float alpha;
          if(kind<.5){
            // The checkerboard is static. Use the final empty upper half and
            // initial empty floor half; the effect geometry stays untouched.
            vec3 bg=sampleFrame(bgMap,coord.y>.45?1.:0.,vec2(2.,1.));
            float sourceY=1.-coord.y;
            float blueRatio=original.g/max(original.b,.0001);
            bool groundFootprint=coord.x>.30&&coord.x<.70&&sourceY>.545&&sourceY<.76;
            // Remove only the flat blue ground-ring ink. Bright cyan/white
            // energy ribbons remain even where they cross the same region.
            if(groundFootprint&&original.r<.30&&original.b<.96&&blueRatio<.67)discard;
            // Recover light above the recorded background, then normalize once.
            // The source background must never be carried into edge pixels.
            vec3 light=max(original-bg,vec3(0.))/max(vec3(1.)-bg,vec3(.05));
            float strength=max(light.r,max(light.g,light.b));
            float clean=smoothstep(.012,.045,strength);
            alpha=clamp(strength,0.,1.)*clean;
            c=clamp(light/max(strength,.001),0.,1.);
            // Blue/cyan -> crimson/magenta. White highlights stay near white.
            c=vec3(c.b,c.r*.90,c.g*.55+c.r*.35);
          }else{
            float light=max(original.r,max(original.g,original.b));
            alpha=smoothstep(.08,.24,light)*light;
            // Normalize against source luminance, not the feathered alpha;
            // otherwise unpremultiplication cancels the edge fade.
            c=original/max(light,.001);
            c=vec3(c.r,c.b*.90,c.g*.60+c.b*.35);
            // Exclude the reference's lower-right label from the effect card.
            if(coord.x>.85&&coord.y<.055)discard;
          }
          alpha*=opacity;if(alpha<.012)discard;
          gl_FragColor=vec4(c*alpha,alpha);
        }`});
    this.mesh=new InstancedMesh(geometry,material,1);this.mesh.frustumCulled=false;this.mesh.visible=false;this.mesh.count=1;this.mesh.renderOrder=24;scene.add(this.mesh);
    this.uniforms=material.uniforms;this.mesh.onBeforeRender=(renderer,scene,camera)=>{this.uniforms.screenAspect.value=camera.aspect;};
  }
  draw(center,frame,width,height,opacity){
    Object.assign(this.uniforms.center.value,center);if(opacity>0){const page=this.assets.page(this.meta,frame);this.uniforms.currentFrame.value=page.tile;this.uniforms.map.value=page.texture;}
    this.uniforms.size.value.x=width;this.uniforms.size.value.y=height;this.uniforms.opacity.value=opacity;
    this.mesh.visible=opacity>0;
  }
  dispose(){this.mesh.removeFromParent();this.mesh.dispose();this.mesh.geometry.dispose();this.mesh.material.dispose();}
}


