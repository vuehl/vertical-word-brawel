import {K as Mesh,st as Scene,et as PlaneGeometry,ct as ShaderMaterial,ht as Vector3} from '../../vendor/three-DmSYIDKK.js';
import {Arc} from './arc.js';
import {ReferenceCard,SUMMON_TIMING as T} from './card.js';
import {DragonSummonResources} from './resources.js';
import {dragonChantSeconds} from '../dragon-chant.js';
import {glyphCatalog} from '../../actors/glyph-catalog.js';
import {remainingStrokes} from '../../data/character-rules.js';

const gather=1.55;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};

export function warmDragonSummon(run){
  const assets=run.dragonHdAssets??=new DragonSummonResources();
  if(!assets.ready&&!assets.attempted){assets.attempted=true;assets.prepare();}
  return assets;
}

// Upgrade only the currently selected glyph tile. The other actors sharing
// its instanced material retain their atlas UVs and original shader.
function useOriginalGlyph(run,id,assets){
  const word=run.enemies.glyphWords[id];
  if(word!==assets.meta.boss.glyph)return;
  const batch=run.sprites.get(run.enemies.species[id],false,word);
  const mat=(batch.zxGroup||batch).material, tile=batch.zxGlyphRect;
  const prefix='uniform sampler2D zxGlyph;';
  if(!tile||!mat.fragmentShader.includes(prefix)||!mat.uniforms.zxGlyph)return;
  const tex=assets.textures.get(assets.meta.boss.file);
  tex.colorSpace=mat.uniforms.zxGlyph.value.colorSpace;tex.needsUpdate=true;
  const previous=mat.fragmentShader;
  mat.uniforms.hdDragonGlyph={value:tex};
  mat.uniforms.hdDragonRect={value:new Float32Array(tile)};
  mat.fragmentShader=previous.replace(/texture2D\(\s*zxGlyph\s*,/g,'sampleDragonGlyph(').replace(prefix,
    prefix+`uniform sampler2D hdDragonGlyph;uniform vec4 hdDragonRect;
    vec4 sampleDragonGlyph(vec2 uv){
      vec2 p=(uv-hdDragonRect.xy)/(hdDragonRect.zw-hdDragonRect.xy);
      if(all(greaterThanEqual(p,vec2(0.)))&&all(lessThanEqual(p,vec2(1.))))return texture2D(hdDragonGlyph,p);
      return texture2D(zxGlyph,uv);
    }`);
  mat.needsUpdate=true;
  return ()=>{
    mat.fragmentShader=previous;delete mat.uniforms.hdDragonGlyph;delete mat.uniforms.hdDragonRect;mat.needsUpdate=true;
  };
}

class DragonSummon {
  constructor(run,id,assets){
    this.run=run;this.id=id;this.assets=assets;this.time=0;this.center=new Vector3();this.victims=[];
    this.arc=new Arc(run.r.scene,assets,run.r.composer.inputBuffer);
    this.orb=new ReferenceCard(run.r.scene,assets,assets.meta.orb,0);
    this.after=new ReferenceCard(run.r.scene,assets,assets.meta.burst,1);
    run.restoreDragonGlyph?.();run.restoreDragonGlyph=useOriginalGlyph(run,id,assets);
    this.white=new Mesh(new PlaneGeometry(1,1),new ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{alpha:{value:0}},vertexShader:'void main(){gl_Position=vec4(position.xy*2.,0.,1.);}',
      fragmentShader:'uniform float alpha;void main(){gl_FragColor=vec4(vec3(1.),alpha);}'}));
    this.white.frustumCulled=false;this.white.renderOrder=1000;this.white.name='dragon-summon-white-flash';this.white.visible=false;
    this.flashScene=new Scene();this.flashScene.add(this.white);run.r.dragonFlash=this;this.update(0);
  }
  beginGather(){
    const r=this.run,en=r.enemies;
    r.projectiles.clearHostile();r.director.finalSwarm=false;r.events.end(true);r.events.meowth=-1;
    if(r.capture.index>=0){r.capture.state='done';r.capture.index=-1;r.capture.dropBeam();}
    r.lockTarget=-1;
    for(let id=0;id<en.n;id++){
      if(!en.alive[id]||id===this.id||(en.flags[id]&32768))continue;
      const total=glyphCatalog.enemies[en.glyphWords[id]]?.strokes||1;
      const count=Math.max(1,remainingStrokes(total,en.hp[id],en.maxHp[id]));
      this.victims.push({id,total,count,removed:0,start:.035+(this.victims.length*.137)%.19});
    }
  }
  drain(seconds){
    const en=this.run.enemies;
    for(const v of this.victims){
      if(!en.alive[v.id]||seconds<v.start)continue;
      const removed=Math.min(v.count,1+Math.floor((seconds-v.start)*Math.max(1,v.count-1)/.56));
      if(removed<=v.removed)continue;
      v.removed=removed;
      if(removed===v.count)en.kill(v.id);
      else en.hp[v.id]=en.maxHp[v.id]*(v.count-removed-.01)/v.total;
    }
  }
  update(t){
    this.time=t;
    const r=this.run,en=r.enemies,id=this.id;
    this.center.set(en.x[id],en.y[id]+en.hgt[id]*.55,en.z[id]);
    const elapsed=t-dragonChantSeconds;
    this.arc.draw(this.center,elapsed/gather,r.vfx.opacity);
    if(elapsed>=0)this.drain(elapsed);
    let orb;
    if(t<.50)orb=Math.min(6,Math.floor(t/.50*7));
    else if(t<T.implode)orb=7+Math.floor((t-.50)*25)%11;
    else if(t<T.burst)orb=17+Math.floor(clamp((t-T.implode)/(T.burst-T.implode))*2);
    else orb=19+Math.floor(clamp((t-T.burst)/(T.after-T.burst))*5);
    const size=14+8*smooth(t/3.1);
    this.orb.draw(this.center,Math.min(24,orb),size,size,t<T.after?1:0);
    const after=Math.min(36,9+Math.floor(clamp((t-T.after)/(T.total-T.after))*28));
    this.after.draw(this.center,after,22,22*540/960,t>=T.after?1:0);
    let white=0;
    if(t>=T.whiteIn&&t<T.whiteFull)white=smooth((t-T.whiteIn)/(T.whiteFull-T.whiteIn));
    else if(t>=T.whiteFull&&t<T.whiteOut)white=1;
    else if(t>=T.whiteOut&&t<T.after)white=1-smooth((t-T.whiteOut)/(T.after-T.whiteOut));
    this.white.material.uniforms.alpha.value=white;this.white.visible=white>0;
    if(t>=T.reveal&&!this.roared){this.roared=true;r.cry(en.species[id]);r.shake(.35);}
  }
  drawFlash(renderer){
    if(!this.white.visible)return;
    const target=renderer.getRenderTarget(), auto=renderer.autoClear;
    try{
      renderer.setRenderTarget(null);renderer.autoClear=false;
      renderer.render(this.flashScene,this.run.r.camera);
    }finally{renderer.autoClear=auto;renderer.setRenderTarget(target);}
  }
  hides(id){return id===this.id && this.time<T.reveal;}
  dispose(){
    if(this.run.r.dragonFlash===this)this.run.r.dragonFlash=null;
    this.arc.dispose();this.orb.dispose();this.after.dispose();this.white.removeFromParent();this.white.geometry.dispose();this.white.material.dispose();
    this.assets.release(true);
  }
}

// Called from the real finalBossSpecies branch only. If locally installed
// resources are unavailable the existing encounter remains playable.
export function beginDragonSummon(run,id,onReady){
  const assets=warmDragonSummon(run);
  const token=run.dragonHdPending={id};
  const finish=ready=>{
    if(run.disposed||run.dragonHdPending!==token)return;
    run.dragonHdPending=null;
    if(!run.boss.live(id)){run.state='play';run.cine.want=0;run.ui.endCinematic();return;}
    const fx=ready?new DragonSummon(run,id,assets):null;
    run.dragonHd=fx;
    onReady(fx);
  };
  if(assets.ready){finish(true);return;}
  assets.prepare().then(finish);
}

export function clearDragonSummon(run){
  run.dragonHdPending=null;
  run.dragonHd?.dispose();run.dragonHd=null;
  run.restoreDragonGlyph?.();run.restoreDragonGlyph=null;
  run.dragonHdAssets?.dispose();run.dragonHdAssets=null;
}



