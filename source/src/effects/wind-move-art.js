import {waveHalfWidth, waveDepth, waveNose} from './air-slash-shape.js';
import {createWindTexture} from './wind-vortex.js';
import {et as PlaneGeometry,H as InstancedMesh,B as InstanceAttribute,ct as ShaderMaterial,j as DynamicDraw} from '../vendor/three-DmSYIDKK.js';
import {starterForSpecies} from '../data/starter-characters.js';
import {installWindSkillArt,quickHaloSeconds} from './wind-skill-art.js';
import {installWindReplacements} from './wind-replacements.js';
import slashAtlas from '../../../resources/public/assets/vfx/air-slash-reference.json' with {type:'json'};
import {windFrameAt} from './wind-frame-time.js';

const moveKeys=new Set(['quick-attack','air-slash','wing-attack','tackle']);
const slashSeconds=slashAtlas.times.at(-1)/1000;
export function windMoveEffect(key,species) {
  if(starterForSpecies(species).id!==16)return;
  if(key==='wind-ring-wave')return 'wind-gust';
  if(key==='aerial-ace')return 'wind-feather-dance';
  if(moveKeys.has(key))return 'wind-'+key;
}

function dash(run,x,y,z,dx,dz,length) {
  if(!run.vfx.crafted.allowed())return;
  run.vfx.crafted.windSkillArt().play('quickHalo',x,y+.75,z,4.9);
  const p=run.player,ghostCount=p.speciesId===16?3:5;
  for(let step=1;step<=ghostCount;step++){
    const t=step/ghostCount,xx=x+dx*length*t,zz=z+dz*length*t;
    run.ghosts.push({dashGlyph:true,species:p.speciesId,scale:p.renderScale,x:xx,y:run.terrain.surface(xx,zz),z:zz,
      dir:run.sprites.dirRow(dx,dz),start:run.time,life:quickHaloSeconds});
  }
  const endY=run.terrain.surface(x+dx*length,z+dz*length);
  for(const side of [-.075,.075]){
    run.vfx.beams.spawn(x-dz*side,y+.75,z+dx*side,
      x+dx*length-dz*side,endY+.75,z+dz*length+dx*side,.065,0xffedc7,.15,.68);
  }
}

export class WindMoveArt {
  constructor(owner) {
    this.owner=owner;
    this.waves=[];
    const capacity=12;
    const geometry=new PlaneGeometry(1,1);
    this.texture=createWindTexture(this,'assets/vfx/air-slash-reference.png');
    this.origin=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    this.pose=new InstanceAttribute(new Float32Array(capacity*4),4).setUsage(DynamicDraw);
    this.frames=new InstanceAttribute(new Float32Array(capacity*2),2).setUsage(DynamicDraw);
    geometry.setAttribute('slashOrigin',this.origin);
    geometry.setAttribute('slashMotion',this.pose);
    geometry.setAttribute('slashFrame',this.frames);
    const material=new ShaderMaterial({
      uniforms:{map:{value:this.texture}},
      transparent:true,depthWrite:false,side:2,toneMapped:false,
      vertexShader:`
        attribute vec4 slashOrigin;
        attribute vec4 slashMotion;
        attribute vec2 slashFrame;
        varying vec2 waveUv;
        varying float look;
        varying float opacity;
        void main(){
          vec2 forward=slashMotion.yz;
          vec2 across=vec2(-forward.y,forward.x);
          vec3 world=slashOrigin.xyz;
          world.xz+=slashOrigin.w*(forward*(uv.x-${waveNose})*${waveDepth}
                    +across*(2.*uv.y-1.)*${waveHalfWidth});
          gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
          vec2 grid=vec2(${slashAtlas.columns}.,${slashAtlas.rows}.);
          vec2 cell=vec2(mod(slashFrame.x,grid.x),grid.y-1.-floor(slashFrame.x/grid.x));
          waveUv=(cell+(uv*${slashAtlas.tile-1}.+.5)/${slashAtlas.tile}.)/grid;
          look=slashFrame.y;
          opacity=slashMotion.w;
        }`,
      fragmentShader:`
        uniform sampler2D map;
        varying vec2 waveUv;
        varying float look;
        varying float opacity;
        void main(){
          vec4 brush=texture2D(map,waveUv);
          float alpha=brush.a*opacity;
          if(alpha<.012)discard;
          vec3 color=look>1.5?brush.gbr:look>.5?brush.brg:brush.rgb;
          gl_FragColor=vec4(color,alpha);
          #include <colorspace_fragment>
        }`
    });
    this.mesh=new InstancedMesh(geometry,material,capacity);
    this.mesh.name='wind-air-slash';
    this.mesh.frustumCulled=false;
    this.mesh.renderOrder=7;
    this.reset();
    owner.mesh.parent.add(this.mesh);
  }
  play(wave) {
    if(this.waves.length>=this.pose.count)this.waves.shift();
    this.waves.push(wave);
  }
  render() {
    const {vfx}=this.owner;
    let count=0;
    for(let i=this.waves.length-1;i>=0;i--){
      const wave=this.waves[i];
      if(wave.done){this.waves.splice(i,1);continue;}
      if(!this.owner.allowed()||!this.loaded)continue;
      const frame=windFrameAt(slashAtlas,wave.front*slashSeconds);
      if(frame<0)continue;
      this.origin.setXYZW(count,wave.x,wave.y,wave.z,wave.radius);
      this.pose.setXYZW(count,wave.front,wave.dx,wave.dz,vfx.opacity*vfx.ownOpacity*(vfx.calm?.8:1));
      this.frames.setXY(count,frame,wave.look==='classic'?1:wave.look==='shiny'?2:0);
      count++;
    }
    this.mesh.count=count;
    this.mesh.visible=count>0;
    if(count)for(const attribute of [this.origin,this.pose,this.frames]){
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*attribute.itemSize);attribute.needsUpdate=true;
    }
  }
  reset(){this.waves.length=0;this.mesh.count=0;this.mesh.visible=false;}
  dispose(){this.disposed=true;this.texture.dispose();this.reset();this.mesh.parent?.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();}
}
export function installWindMoveArt(registry) {
  registry['wind-quick-attack']={...registry['quick-attack'],sourceKey:'quick-attack',
    replacesDash:true,dash};
  registry['wind-air-slash']={sourceKey:'air-slash'};
  installWindSkillArt(registry);
  installWindReplacements(registry);
}
