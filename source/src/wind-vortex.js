import {et as PlaneGeometry, H as InstancedMesh, B as InstanceAttribute, j as DynamicDraw,
  ct as ShaderMaterial, dt as Texture, ot as SRGB} from '../assets/three-DmSYIDKK.js';
import vortexAtlas from '../public/assets/vfx/wind-vortex.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

export class WindAtlasBatch {
  constructor(scene, capacity, file, columns, rows, tileSize, name) {
    this.texture = new Texture();
    this.texture.colorSpace = SRGB;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = this.texture.magFilter = 1006;
    this.texture.userData.load = () => new Promise(resolve => {
      const image = new Image();
      const finish = ok => { clearTimeout(timer); image.onload = image.onerror = null; resolve(ok); };
      const timer = setTimeout(() => finish(false), 12000);
      image.onload = () => {
        if (!this.disposed) {
          this.texture.image = image;
          this.texture.needsUpdate = true;
          this.loaded = true;
        }
        finish(!this.disposed);
      };
      image.onerror = () => finish(false);
      image.src = file;
    });
    const plane = new PlaneGeometry(1,1);
    this.origin = new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    this.pose = new InstanceAttribute(new Float32Array(capacity*3),3).setUsage(DynamicDraw);
    this.heading = new InstanceAttribute(new Float32Array(capacity*2),2).setUsage(DynamicDraw);
    plane.setAttribute('originSize',this.origin);
    plane.setAttribute('frameAlpha',this.pose);
    plane.setAttribute('heading',this.heading);
    const material = new ShaderMaterial({
      uniforms:{map:{value:this.texture}}, transparent:true, depthWrite:false, toneMapped:false,
      vertexShader:`
        attribute vec4 originSize;
        attribute vec3 frameAlpha;
        attribute vec2 heading;
        varying vec2 vUv;
        varying float alpha;
        void main(){
          vec4 p=viewMatrix*vec4(originSize.xyz,1.);
          vec2 offset=(uv-vec2(.5,frameAlpha.z))*originSize.w;
          if(dot(heading,heading)>.0001){
            vec2 forward=(viewMatrix*vec4(heading.x,0.,heading.y,0.)).xy;
            float angle=atan(forward.y,forward.x)-1.5707963;
            offset=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*offset;
          }
          p.xy+=offset;
          gl_Position=projectionMatrix*p;
          vec2 grid=vec2(${columns}.,${rows}.);
          vec2 tile=vec2(mod(frameAlpha.x,grid.x),grid.y-1.-floor(frameAlpha.x/grid.x));
          vUv=(tile+(uv*${tileSize-1}.+.5)/${tileSize}.)/grid;
          alpha=frameAlpha.y;
        }`,
      fragmentShader:`
        uniform sampler2D map;
        varying vec2 vUv;
        varying float alpha;
        void main(){
          vec4 ink=texture2D(map,vUv);
          if(ink.a*alpha<.01) discard;
          gl_FragColor=vec4(ink.rgb,ink.a*alpha);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new InstancedMesh(plane,material,capacity);
    this.mesh.name = name;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    this.clear();
    scene.add(this.mesh);
  }
  push(x,y,z,size,frame,alpha,pivot=.5,dx=0,dz=0) {
    const i=this.mesh.count;
    if(!this.loaded || i>=this.origin.count || alpha<=0) return;
    this.origin.setXYZW(i,x,y,z,size);
    this.pose.setXYZ(i,frame,alpha,pivot);
    this.heading.setXY(i,dx,dz);
    this.mesh.count++;
  }
  end() {
    this.mesh.visible=this.mesh.count>0;
    if(this.mesh.visible)this.origin.needsUpdate=this.pose.needsUpdate=this.heading.needsUpdate=true;
  }
  clear() { this.mesh.count = 0; this.mesh.visible = false; }
  dispose() {
    this.disposed = true;
    this.mesh.parent?.remove(this.mesh);
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh.dispose();
    this.texture.dispose();
  }
}

// Each scanline of the texture holds the radial profile of one GIF frame.
export class WindRing extends WindAtlasBatch {
  constructor(owner) {
    super(owner.mesh.parent,1,'assets/vfx/wind-ring.png',1,1,1,'wind-ground-ripples');
    this.owner=owner;
    this.mesh.renderOrder=-1;
    this.mesh.material.side=2;
    this.mesh.material.vertexShader=`
      attribute vec4 originSize;
      attribute vec3 frameAlpha;
      varying vec2 disc;
      varying float row,alpha;
      void main(){
        disc=2.*uv-1.;
        vec3 p=originSize.xyz+vec3(disc.x,0.,disc.y)*originSize.w;
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
        row=(154.5-frameAlpha.x)/155.;
        alpha=frameAlpha.y;
      }`;
    this.mesh.material.fragmentShader=`
      uniform sampler2D map;
      varying vec2 disc;
      varying float row,alpha;
      void main(){
        float r=length(disc);
        if(r>=1.)discard;
        float angle=atan(disc.y,disc.x);
        float ripple=.004*sin(angle*7.+row*19.)+.002*cos(angle*11.-row*33.);
        vec4 ink=texture2D(map,vec2(clamp(r+ripple,0.,1.),row));
        if(ink.a*alpha<.01)discard;
        gl_FragColor=vec4(ink.rgb,ink.a*alpha);
        #include <colorspace_fragment>
      }`;
  }
  start(radius) {
    this.radius=radius;
    if(this.startTime==null||this.owner.run.time-this.startTime>=7.75)this.startTime=this.owner.run.time;
  }
  draw() {
    this.clear();
    const {run,vfx}=this.owner,age=run.time-this.startTime;
    if(this.startTime!=null && age>=0 && age<7.75 && this.owner.allowed()){
      const {x,y,z}=run.player.pos;
      this.push(x,y+.13,z,this.radius,Math.floor(age*20),vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1));
    }else if(age>=7.75)this.startTime=null;
    this.end();
  }
  reset(){this.startTime=null;this.clear();}
}

// Preserve the source's nonuniform exposures from formation through fade-out.
export class WindVortex extends WindAtlasBatch {
  constructor(scene,capacity) {
    super(scene,capacity,'assets/vfx/wind-vortex.png',vortexAtlas.columns,vortexAtlas.rows,vortexAtlas.tile,'wind-ultimate-vortex');
  }
  draw(emitters,opacity) {
    this.clear();
    for(const e of emitters){
      const frame=windFrameAt(vortexAtlas,e.progress*vortexAtlas.times.at(-1)/1000);
      if(frame>=0)this.push(e.x,e.y,e.z,e.height*1.25,frame,opacity,.09);
    }
    this.end();
  }
}
