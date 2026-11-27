import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies,isOriginalHeroGlyph,loadGlyphImage} from './paper-glyph-art.js';
import {createGlyphBatches} from './glyph-batches.js';
import {createGlyphModel,glyphPoseAttribute} from './glyph-model.js';
import {glyphCatalog} from './glyph-catalog.js';
import {createHeroPoseTexture,loadedHeroRig,loadedCaptureStrokeSheet,prepareHeroStrokes} from './hero-poses.js';
import {captureStrokeCanvases} from './capture-strokes.js';
import {heroActionCatalog} from './hero-action-catalog.js';
import {heroActionFrame} from './hero-actions.js';
import {applyShelfMaterial} from '../world/desk-shelf.js';
import {actorMetrics} from './actor-metrics.js';
import {bossGlyphArt} from './boss-glyph-art.js';
const paintJobs=[];
// Slightly lighter versions of the supplied hero colors, in texture linear space.
const allyColors={
  fire:[255,112,76],wind:[153,202,255],ink:[188,127,230],
};
for(const key of Object.keys(allyColors))allyColors[key]=new Float32Array(allyColors[key].map(c=>((c/255+.055)/1.055)**2.4));
let paintTimer=null;
function paintLater(paint){
  return new Promise((resolve,reject)=>{
    paintJobs.push({paint,resolve,reject});
    if(paintTimer===null)paintTimer=setTimeout(flushPaints,0);
  });
}
function flushPaints(){
  paintTimer=null;const began=performance.now();let count=0;
  while(paintJobs.length&&count<2&&performance.now()-began<6){
    const job=paintJobs.shift();try{job.paint();job.resolve();}catch(error){job.reject(error);}count++;
  }
  if(paintJobs.length)paintTimer=setTimeout(flushPaints,0);
}
// Metrics, capture layers and skill trails still use the original art registration.
export function installGlyphs(run,{Texture,colorSpace,species}) {
  if(run.sprites.zxGlyphs)return;
  run.sprites.zxGlyphs=true;
  const textures=new Map(),pages=[],get=run.sprites.get.bind(run.sprites),clear=run.sprites.clear.bind(run.sprites);
  const batches=createGlyphBatches(run.sprites),begin=run.sprites.begin.bind(run.sprites),end=run.sprites.end.bind(run.sprites);
  const models=new Map();
  run.sprites.begin=(...args)=>{begin(...args);batches.begin();};
  run.sprites.end=()=>{end();batches.flush();};
  const shadow=run.sprites.shadows.mesh.material;
  const shelfUniforms=run.sprites.shelfUniforms={uShelfActive:{value:false},uShelfDepth:{value:null}};
  run.sprites.setShelfDepth=texture=>{
    shelfUniforms.uShelfActive.value=!!texture;
    shelfUniforms.uShelfDepth.value=texture??null;
  };
  shadow.transparent=true;shadow.blending=1;shadow.depthWrite=false;
  // Linear-space ink must stay darker than the illustrated desk's dark mat.
  shadow.fragmentShader='varying vec2 vUv; void main(){float d=length((vUv-.5)*2.); float a=(1.-smoothstep(.25,1.,d))*.34;gl_FragColor=vec4(.007,.010,.012,a);}';shadow.needsUpdate=true;
  applyShelfMaterial(shadow,shelfUniforms,'p','iS.xyz',false);
  run.sprites.clipFootRing=ring=>{
    applyShelfMaterial(ring.material,shelfUniforms,'(modelMatrix*vec4(position,1.)).xyz','modelMatrix[3].xyz',false);
    return ring;
  };
  let disposed=false;
  const allyColor={value:allyColors.fire};
  const animations=new Map();
  function prepareHeroAnimation(id){
    if(disposed||!heroActionCatalog[id])return;
    let entry=animations.get(id);
    if(!entry){
      const texture=new Texture();
      texture.colorSpace=colorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter;
      entry={texture,animation:true,retryAfter:0};animations.set(id,entry);
    }
    if(entry.texture.image||Date.now()<entry.retryAfter)return;
    entry.loading??=loadGlyphImage('hero-actions/'+id+'.png').then(image=>{
      if(disposed)return;
      entry.texture.image=image;
      entry.texture.needsUpdate=true;
    },()=>{entry.retryAfter=Date.now()+15000;}).finally(()=>{entry.loading=null;});
    return entry.loading;
  }
  const monsterTexture=new Texture();
  monsterTexture.colorSpace=colorSpace;
  const bossTexture=new Texture();
  bossTexture.colorSpace=colorSpace;
  let bossReady;
  function prepareBossTexture(){
    return bossReady??=loadGlyphImage(bossGlyphArt.file).then(image=>{
      if(disposed)return;
      bossTexture.image=image;bossTexture.needsUpdate=true;
    }).catch(error=>{bossReady=null;throw error;});
  }
  const monsterReady=loadGlyphImage('monster-strokes.png').then(image=>{
    if(disposed)return;
    monsterTexture.image=image;
    monsterTexture.needsUpdate=true;
  });
  monsterTexture.userData.ready=monsterReady;
  const captureStrokes=new Map();
  run.sprites.getCaptureStrokes=(species,word)=>{
    const key=species+":"+word;
    if(captureStrokes.has(key))return captureStrokes.get(key);
    const hero=loadedCaptureStrokeSheet(species,word);
    let strokes;
    if(hero && hero.rig.word===word){
      const rects=hero.rig.groups.flatMap(group=>group.strokes.map(s=>[s.sx,s.sy,s.w,s.h,s.x-hero.rig.frame.left-hero.rig.frame.width/2,s.y-hero.rig.frame.top-hero.rig.frame.height/2]));
      strokes=captureStrokeCanvases(hero.image,rects,false,(80/96)/Math.max(hero.rig.frame.width,hero.rig.frame.height));
    }else{
      const entry=textures.get(word),image=entry?.texture.image;
      if(!entry?.frames || !image)return null;
      const rects=entry.frames.map(([u,v,ur,vt])=>[Math.round(u*image.width),Math.round((1-vt)*image.height),
        Math.round((ur-u)*image.width),Math.round((vt-v)*image.height)]);
      strokes=captureStrokeCanvases(image,rects,true);
    }
    if(strokes.length)captureStrokes.set(key,strokes);
    return strokes;
  };
  const {columns,rows,size}=glyphCatalog.monsterAtlas;
  for(const {word,firstTile,strokes} of Object.values(glyphCatalog.enemies)){
    const frames=[];
    for(let i=0;i<strokes;i++){
      const tile=firstTile+i,x=tile%columns,y=Math.floor(tile/columns);
      frames.push(new Float32Array([x/columns,1-(y+1)/rows,(x+1)/columns,1-y/rows]));
    }
    textures.set(word,{texture:monsterTexture,frames,rect:frames[strokes-1],ready:monsterReady});
  }
  const bossFrames=Array.from({length:glyphCatalog.enemies[bossGlyphArt.word].strokes},(_,i)=>{
    const {columns,rows}=bossGlyphArt,x=i%columns,y=Math.floor(i/columns);
    return new Float32Array([x/columns,1-(y+1)/rows,(x+1)/columns,1-y/rows]);
  });
  const bossEntry={texture:bossTexture,frames:bossFrames,rect:bossFrames.at(-1),
    get ready(){return bossTexture.userData.ready=prepareBossTexture();}};
  textures.set(bossGlyphArt.word,bossEntry);
  function texture(word) {
    if(textures.has(word))return textures.get(word);
    // 25 padded cutouts per 1024px page: all visible species on a page share
    // one material/draw. Pages are populated only when a new glyph is loaded.
    let page=pages.at(-1);
    if(!page||page.count===25){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
      const t=new Texture(canvas);t.colorSpace=colorSpace;t.generateMipmaps=true;
      page={texture:t,context:canvas.getContext('2d'),count:0,jobs:[]};pages.push(page);
    }
    const index=page.count++,x=index%5*200+4,y=Math.floor(index/5)*200+4,t=page.texture;
    const entry={texture:t,rect:new Float32Array([x/1024,1-(y+192)/1024,(x+192)/1024,1-y/1024])};
    entry.ready=glyphAtlasReady().catch(()=>null).then(()=>paintLater(()=>{
      if(disposed)return;page.context.drawImage(glyphCanvas(word,undefined,{battle:true}),x,y);t.needsUpdate=true;
    }));
    page.jobs.push(entry.ready);t.userData.ready=Promise.all(page.jobs);textures.set(word,entry);return entry;
  }
  function skin(batch,override,heroEntry,ally=false){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const word=override||glyphWordForSpecies(batch.sid);
    const m=batch.material;batch.zxGlyph=word;
    const entry=heroEntry||texture(word),t=entry.texture;batch.zxGlyphRect=entry.rect;
    batch.zxStrokeFrames=entry.frames;
    m.uniforms.map.value.dispose();m.uniforms.map.value=t;
    m.uniforms.zxGlyph={value:t};m.uniforms.uLean.value=entry.animation?1:.65;
    m.uniforms.uTexel.value.set(1/(entry.frames?columns*size:1024),1/(entry.frames?rows*size:1024));
    batch.ready=!!heroEntry || (!!entry.frames && !!entry.texture.image);
    if(!heroEntry)entry.ready.then(()=>{if(!disposed)batch.ready=true;},error=>{if(!disposed)batch.loadError=error;});
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    batch.zxOriginalGlyph=isOriginalHeroGlyph(word);
    batch.zxBossGlyph=word===bossGlyphArt.word;
    batch.zxAlly=ally;
    if(!heroEntry?.ghost){
      if(!models.has(word))models.set(word,createGlyphModel(word));
      const model=batch.zxModel=models.get(word);
      batch.aPose=glyphPoseAttribute();
      if(entry.frames)batch.strokeCounts=new Map(entry.frames.map((rect,i)=>[rect,i+1]));
      const look=ally?'ally':batch.zxOriginalGlyph&&batch.id!==batch.sid?'classic':'normal';
      batches.add(batch,word+'-'+look,heroEntry?2:8,()=>model.material(batch,shelfUniforms,ally?allyColor:null));
      return batch;
    }
    {
      // Sample the casting form's own complete glyph; each trail style supplies
      // its tint below and shares the same opacity controls.
      m.fragmentShader='uniform sampler2D zxGlyph; varying vec2 vUv; varying vec4 vFx; void main(){vec4 c=texture2D(zxGlyph,vUv);c.a*=clamp(vFx.y,0.,1.);if(c.a<.01)discard;c.rgb=mix(c.rgb,vec3(1.,.28,.04),.35);gl_FragColor=c;}';
      if(heroEntry.ghost==='wind')m.fragmentShader=m.fragmentShader.replace('vec3(1.,.28,.04),.35','vec3(.65,.92,1.),.85');
      // 补1 uses a single coral-orange silhouette, without the actor's dark ink.
      else m.fragmentShader=m.fragmentShader
        .replace('c.a*=clamp','c.a*=smoothstep(.035,.10,max(c.r,max(c.g,c.b)));c.a*=clamp')
        .replace('mix(c.rgb,vec3(1.,.28,.04),.35)','vec3(1.,.13,.06)');
      m.transparent=true;m.depthWrite=false;
    }
    applyShelfMaterial(m,shelfUniforms);
    m.needsUpdate=true;batches.add(batch,t.uuid+'-ghost-'+heroEntry.ghost,96);return batch;
  }
  run.sprites.getAllyGlyph=(id,playerSpecies)=>{
    const word=glyphWordForSpecies(playerSpecies);
    allyColor.value=allyColors['风讽疯'.includes(word)?'wind':'炎焱燚飒飙'.includes(word)?'fire':'ink'];
    return skin(get(id,false,'ally'),undefined,undefined,true);
  };
  run.sprites.prepareHeroForm=async (id,renderer)=>{
    await Promise.all([prepareHeroStrokes(id),prepareHeroAnimation(id)]);
    const texture=animations.get(id)?.texture;
    if(!disposed && texture?.image)renderer?.initTexture(texture);
  };
  run.sprites.heroFrame=(actor,id,action,nowMs,poseIndex)=>{
    if(action&&heroActionCatalog[id]&&!animations.get(id)?.texture.image)prepareHeroAnimation(id);
    return heroActionFrame(actor,id,action,nowMs,poseIndex);
  };
  run.sprites.getAnimatedHeroGlyph=(id,frame)=>{
    const batch=skin(get(id,false,'hero-animation'),glyphWordForSpecies(frame.species),animations.get(frame.species));
    batch.modelFrame=frame;
    return batch;
  };
  run.sprites.getHeroGhostGlyph=(id,style='fire')=>{
    const entry=animations.get(id);
    if(!entry?.texture.image)return null;
    const frame=heroActionFrame({},id,'walk',0);
    const batch=skin(get(id,false,'hero-ghost-'+style),glyphWordForSpecies(id),{...entry,ghost:style,rect:frame.rect});
    batch.zxGhostScale=frame.renderScale;
    return batch;
  };
  let captureEntry;
  run.sprites.getCaptureHeroGlyph=(id,word,removed)=>{
    const rig=loadedCaptureStrokeSheet(id,word)?.rig;
    if(!rig)return null;
    captureEntry??=createHeroPoseTexture(Texture,colorSpace);
    captureEntry.draw(rig,undefined,removed);
    const batch=skin(get(id,false,'capture-strokes'),word,captureEntry);
    batch.modelVisible=batch.zxModel.strokeCount-removed;
    return batch;
  };
  let playerEntry;
  run.sprites.getPlayerGlyph=(id,speciesId,pose,frame)=>{
    if(frame)return run.sprites.getAnimatedHeroGlyph(id,frame);
    const rig=loadedHeroRig(speciesId);
    if(!rig)return run.sprites.get(id);
    playerEntry??=createHeroPoseTexture(Texture,colorSpace);
    playerEntry.draw(rig,pose?.word===rig.word?pose:null);
    const batch=skin(get(id,false,'player-strokes'),rig.word,playerEntry);
    batch.modelPose=pose;
    return batch;
  };
  run.sprites.prepareGlyphTextures=async (renderer,playerSpecies,peers=[])=>{
    const heroes=new Set([playerSpecies,...peers]);
    await Promise.all([monsterReady,prepareHeroStrokes(playerSpecies),...[...heroes].map(prepareHeroAnimation)]);
    if(!disposed)renderer.initTexture(monsterTexture);
    for(const id of heroes){
      const texture=animations.get(id)?.texture;
      if(!disposed&&texture?.image)renderer.initTexture(texture);
    }
    for(const page of pages){await Promise.all(page.jobs);if(!disposed)renderer.initTexture(page.texture);}
  };
  const unusedWarmGlyphs=new Set();
  run.sprites.warmEnemyGlyph=(id,word)=>{
    if(disposed||!actorMetrics[id]||!monsterTexture.image||textures.get(word)?.texture!==monsterTexture)return true;
    if(run.sprites.batches.has(id+':'+word))return true;
    if(unusedWarmGlyphs.size>=6){
      // The normal sprite-cache trim can evict an unclaimed batch under pressure.
      for(const batch of unusedWarmGlyphs){
        if(run.sprites.batches.get(batch.zxBatchKey)!==batch)unusedWarmGlyphs.delete(batch);
      }
      if(unusedWarmGlyphs.size>=6)return false;
    }
    const batch=skin(get(id,true,word),word);
    batch.warmOnly=true;
    unusedWarmGlyphs.add(batch);
    return true;
  };
  run.sprites.discardUnusedWarmGlyphs=()=>{
    for(const batch of unusedWarmGlyphs){
      const key=batch.zxBatchKey;
      if(run.sprites.batches.get(key)===batch){run.sprites.batches.delete(key);batch.dispose();}
    }
    unusedWarmGlyphs.clear();
  };
  run.sprites.get=(...args)=>{
    const batch=get(...args);
    if(batch.warmOnly){batch.warmOnly=false;unusedWarmGlyphs.delete(batch);}
    return skin(batch,args[2]);
  };
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{
    disposed=true;unusedWarmGlyphs.clear();clear();batches.clear();
    playerEntry?.texture.dispose();playerEntry=null;captureEntry?.texture.dispose();captureEntry=null;captureStrokes.clear();monsterTexture.dispose();bossTexture.dispose();
    for(const {texture} of animations.values())texture.dispose();
    animations.clear();
    for(const model of models.values())model.dispose();
    models.clear();
    for(const page of pages)page.texture.dispose();
    pages.length=0;textures.clear();
  };
}

// Legacy choice/evolution dialogs also use cutouts, with no animation timer.
export function glyphPreview(id,scale=3,className='pix',word=glyphWordForSpecies(id)){
  const canvas=document.createElement('canvas');canvas.className=className+' zx-glyph-icon';
  canvas.dataset.static='true';canvas.dataset.species=String(id);canvas.dataset.glyph=word;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',word+'字灵');
  canvas.width=canvas.height=Math.max(48,Math.round(64*scale));
  canvas.getContext('2d').drawImage(glyphCanvas(word),0,0,canvas.width,canvas.height);
  canvas.dataset.frame='1';return canvas;
}
