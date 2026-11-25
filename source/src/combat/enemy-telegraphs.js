import {VFX_SCALE} from '../effects/visual-scale.js';
import {et as PlaneGeometry, ct as ShaderMaterial, K as Mesh, w as Color} from '../vendor/three-DmSYIDKK.js';

export const ENEMY_DANGER_COLOR = 0xff3028;

// Persistent gameplay markers: independent of particle density, bloom and VFX opacity.
const fragmentShader = `
  uniform vec3 tint;
  uniform float progress, opacity, lane;
  uniform vec2 extent;
  varying vec2 vUv;
  void main(){
    vec2 p=(vUv-.5)*2.;
    float edge, inside, filled, front;
    float ready=smoothstep(.80,1.,progress);
    if(lane>.5){
      vec2 world=p*extent;
      edge=min(extent.x-abs(world.x),extent.y-abs(world.y));
      inside=smoothstep(0.,.06,edge);
      float travel=vUv.x;
      filled=(1.-smoothstep(progress-.004,progress+.004,travel))*step(.001,progress);
      front=(1.-smoothstep(.05,.13,abs((travel-progress)*extent.x*2.)))*step(.001,progress);
    }else{
      float radius=length(p);
      edge=(1.-radius)*extent.x;
      inside=smoothstep(0.,.06,edge);
      filled=(1.-smoothstep(progress-.008,progress+.008,radius))*step(.001,progress);
      front=(1.-smoothstep(.045,.12,abs(radius-progress)*extent.x))*step(.001,progress);
    }
    edge /= ${VFX_SCALE};
    float rim=(1.-smoothstep(.06,.16,edge))*inside;
    float halo=(1.-smoothstep(.14,.34,edge))*inside;
    float alpha=(.075+.22*filled+.32*front+.58*rim+.08*halo)*inside*opacity;
    if(alpha<.005)discard;
    vec3 color=mix(tint,vec3(1.,.18,.12),.25*front+.38*rim+.12*ready);
    gl_FragColor=vec4(color,min(.92,alpha));
  }`;

export class EnemyTelegraphs {
  constructor(scene, clock, height) {
    this.scene=scene; this.clock=clock; this.height=height;
    this.active=[]; this.free=[this.createMesh()];
  }
  createMesh() {
    // Conform the marker to walkable notebooks/low props as well as the desktop.
    const geometry=new PlaneGeometry(2,2,24,12).rotateX(-Math.PI/2);
    const material=new ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{tint:{value:new Color(ENEMY_DANGER_COLOR)},progress:{value:0},opacity:{value:1},
        lane:{value:0},extent:{value:{x:1,y:1}}},fragmentShader,
      vertexShader:`varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`});
    const mesh=new Mesh(geometry,material); mesh.name='enemy-telegraph'; mesh.renderOrder=.7;
    mesh.visible=false;
    this.scene.add(mesh);
    return mesh;
  }
  marker(x,z,halfLength,halfWidth,angle,seconds,lane) {
    const mesh=this.free.pop()??this.createMesh();
    const position=mesh.geometry.attributes.position, uv=mesh.geometry.attributes.uv;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    for(let i=0;i<position.count;i++){
      const dx=(uv.getX(i)*2-1)*halfLength,dz=(1-uv.getY(i)*2)*halfWidth;
      const wx=x+dx*cos-dz*sin,wz=z+dx*sin+dz*cos;
      position.setXYZ(i,wx,this.height(wx,wz)+.16,wz);
    }
    position.needsUpdate=true; mesh.geometry.computeBoundingSphere();
    const u=mesh.material.uniforms;
    u.progress.value=0; u.opacity.value=1; u.lane.value=lane;
    u.extent.value.x=halfLength; u.extent.value.y=halfWidth;
    mesh.visible=true;
    this.active.push({mesh,start:this.clock(),duration:Math.max(.001,seconds)});
    return mesh;
  }
  circle(x,y,z,radius,color,seconds) {
    return this.marker(x,z,radius,radius,0,seconds,0);
  }
  line(x,z,endX,endZ,halfWidth,color,seconds) {
    const length=Math.hypot(endX-x,endZ-z);
    if(length<.001)return;
    return this.marker((x+endX)/2,(z+endZ)/2,length/2,halfWidth,
      Math.atan2(endZ-z,endX-x),seconds,1);
  }
  update() {
    const now=this.clock();
    for(let i=this.active.length-1;i>=0;i--){
      const mark=this.active[i],elapsed=Math.max(0,now-mark.start),u=mark.mesh.material.uniforms;
      // Show the complete solid boundary on the impact frame, then fade it away.
      if(elapsed>mark.duration+.18){
        mark.mesh.visible=false; this.free.push(mark.mesh); this.active.splice(i,1); continue;
      }
      u.progress.value=elapsed+1e-9>=mark.duration?1:elapsed/mark.duration;
      u.opacity.value=elapsed<=mark.duration?1:Math.max(0,1-(elapsed-mark.duration)/.18);
    }
  }
  clear() {
    for(const {mesh} of this.active){mesh.visible=false;this.free.push(mesh);}
    this.active.length=0;
  }
  dispose() {
    this.clear();
    for(const mesh of this.free){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}
    this.free.length=0;
  }
}
