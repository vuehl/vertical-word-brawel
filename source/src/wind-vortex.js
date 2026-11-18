import {et as PlaneGeometry, H as InstancedMesh, B as InstanceAttribute, j as DynamicDraw,
  ct as ShaderMaterial, dt as Texture, ot as SRGB} from '../assets/three-DmSYIDKK.js';

// Eight registered poses from 一阵刮来, anchored at the tip of the funnel.
export class WindVortex {
  constructor(scene, capacity) {
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
      image.src = 'assets/vfx/wind-vortex.png';
    });
    const plane = new PlaneGeometry(1,1);
    this.origin = new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    this.pose = new InstanceAttribute(new Float32Array(capacity*2),2).setUsage(DynamicDraw);
    plane.setAttribute('originSize',this.origin);
    plane.setAttribute('frameAlpha',this.pose);
    const material = new ShaderMaterial({
      uniforms:{map:{value:this.texture}}, transparent:true, depthWrite:false, toneMapped:false,
      vertexShader:`
        attribute vec4 originSize;
        attribute vec2 frameAlpha;
        varying vec2 vUv;
        varying float alpha;
        void main(){
          vec4 p=viewMatrix*vec4(originSize.xyz,1.);
          p.xy+=(uv-vec2(.5,.09))*originSize.w;
          gl_Position=projectionMatrix*p;
          vec2 tile=vec2(mod(frameAlpha.x,4.),1.-floor(frameAlpha.x/4.));
          vUv=(tile+(uv*223.+.5)/224.)/vec2(4.,2.);
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
    this.mesh.name = 'wind-ultimate-vortex';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    this.clear();
    scene.add(this.mesh);
  }
  draw(emitters,opacity) {
    this.mesh.count = this.loaded ? emitters.length : 0;
    this.mesh.visible = this.mesh.count > 0;
    if (!this.mesh.visible) return;
    emitters.forEach((e,i) => {
      const fade = Math.max(0,Math.min(1,e.progress/.06,(1-e.progress)/.15));
      this.origin.setXYZW(i,e.x,e.y,e.z,e.height*1.35);
      this.pose.setXY(i,Math.floor(e.age*25)%8,opacity*fade);
    });
    this.origin.needsUpdate = this.pose.needsUpdate = true;
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
