import {et as PlaneGeometry, H as InstancedMesh, B as InstanceAttribute, j as DynamicDraw,
  ct as ShaderMaterial, dt as Texture, ot as SRGB} from '../vendor/three-DmSYIDKK.js';
import vortexAtlas from '../../../resources/public/assets/vfx/wind-vortex.json' with {type:'json'};
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
