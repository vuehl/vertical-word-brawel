import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies,isOriginalHeroGlyph,loadGlyphImage} from './paper-glyph-art.js';
import {createGlyphBatches} from './glyph-batches.js';
import {glyphCatalog} from './glyph-catalog.js';
import {createHeroPoseTexture,loadedHeroRig,prepareHeroStrokes} from './hero-poses.js';
import {heroActionCatalog} from './hero-action-catalog.js';
import {heroActionFrame} from './hero-actions.js';
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
// Reuse actor batches and collision data with the supplied paper cutouts.
export function installGlyphs(run,{Texture,colorSpace,species}) {
  if(run.sprites.zxGlyphs)return;
  run.sprites.zxGlyphs=true;
  const textures=new Map(),pages=[],get=run.sprites.get.bind(run.sprites),clear=run.sprites.clear.bind(run.sprites);
  const batches=createGlyphBatches(run.sprites),begin=run.sprites.begin.bind(run.sprites),end=run.sprites.end.bind(run.sprites);
  run.sprites.begin=(...args)=>{begin(...args);batches.begin();};
  run.sprites.end=()=>{end();batches.flush();};
  const shadow=run.sprites.shadows.mesh.material;
  shadow.transparent=true;shadow.blending=1;shadow.depthWrite=false;
  shadow.fragmentShader='varying vec2 vUv; void main(){float d=length((vUv-.5)*2.); float a=smoothstep(1.,.25,d)*.34;gl_FragColor=vec4(.07,.10,.12,a);}';shadow.needsUpdate=true;
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
  const monsterReady=loadGlyphImage('monster-strokes.png').then(image=>{
    if(disposed)return;
    monsterTexture.image=image;
    monsterTexture.needsUpdate=true;
  });
  monsterTexture.userData.ready=monsterReady;
  const {columns,rows,size}=glyphCatalog.monsterAtlas;
  for(const {word,firstTile,strokes} of Object.values(glyphCatalog.enemies)){
    const frames=[];
    for(let i=0;i<strokes;i++){
      const tile=firstTile+i,x=tile%columns,y=Math.floor(tile/columns);
      frames.push(new Float32Array([x/columns,1-(y+1)/rows,(x+1)/columns,1-y/rows]));
    }
    textures.set(word,{texture:monsterTexture,frames,rect:frames[strokes-1],ready:monsterReady});
  }
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
    batch.ready=!!heroEntry || (!!entry.frames && !!monsterTexture.image);
    if(!heroEntry)entry.ready.then(()=>{if(!disposed)batch.ready=true;},error=>{if(!disposed)batch.loadError=error;});
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    batch.zxOriginalGlyph=isOriginalHeroGlyph(word);
    batch.zxAlly=ally;
    if(heroEntry?.ghost){
      // Preserve the reference's translucent orange silhouette, including its
      // tinted outline. Only the sampled character texture changes by form.
      m.fragmentShader='uniform sampler2D zxGlyph; varying vec2 vUv; varying vec4 vFx; void main(){vec4 c=texture2D(zxGlyph,vUv);c.a*=clamp(vFx.y,0.,1.);if(c.a<.01)discard;c.rgb=mix(c.rgb,vec3(1.,.28,.04),.35);gl_FragColor=c;}';
      if(heroEntry.ghost==='wind')m.fragmentShader=m.fragmentShader.replace('vec3(1.,.28,.04),.35','vec3(.65,.92,1.),.85');
      m.transparent=true;m.depthWrite=false;
    }else if(ally){
      // Keep the authored ink border and hit flash; allies share the hero's
      // palette without recoloring enemies that use the same atlas/word.
      m.uniforms.zxAllyColor=allyColor;
      m.fragmentShader='uniform sampler2D zxGlyph; uniform vec3 zxAllyColor; varying vec2 vUv; varying vec4 vFx; void main(){vec4 c=texture2D(zxGlyph,vUv);if(c.a<.01)discard;float fill=smoothstep(.035,.08,max(c.r,max(c.g,c.b)));c.rgb=mix(c.rgb,zxAllyColor,fill);c.rgb=mix(c.rgb,vec3(1.),clamp(vFx.x,0.,1.));gl_FragColor=c;}';
      m.transparent=true;m.depthWrite=false;
    }else if(batch.zxOriginalGlyph){
      // No palette/skin, outline, light ramp or fog recoloring on supplied art.
      // Retain the brief hit flash as combat feedback.
      m.fragmentShader='uniform sampler2D zxGlyph; varying vec2 vUv; varying vec4 vFx; void main(){vec4 c=texture2D(zxGlyph,vUv);if(c.a<.01)discard;c.rgb=mix(c.rgb,vec3(1.),clamp(vFx.x,0.,1.));gl_FragColor=c;}';
      m.transparent=true;m.depthWrite=false;
    }
    m.needsUpdate=true;batches.add(batch,t.uuid+(heroEntry?.ghost?'-ghost-'+heroEntry.ghost:ally?'-ally':batch.zxOriginalGlyph?'-original':''),heroEntry?.ghost?96:heroEntry?1:ally?8:1024);return batch;
  }
  run.sprites.getAllyGlyph=(id,playerSpecies)=>{
    const word=glyphWordForSpecies(playerSpecies);
    allyColor.value=allyColors['风讽疯'.includes(word)?'wind':'炎焱燚飒飙'.includes(word)?'fire':'ink'];
    return skin(get(id,false,'ally'),undefined,undefined,true);
  };
  run.sprites.prepareHeroForm=id=>Promise.all([prepareHeroStrokes(id),prepareHeroAnimation(id)]);
  run.sprites.heroFrame=(actor,id,action,nowMs)=>{
    if(action&&heroActionCatalog[id]&&!animations.get(id)?.texture.image){
      prepareHeroAnimation(id);
      return heroActionFrame(actor,id,undefined,nowMs);
    }
    return heroActionFrame(actor,id,action,nowMs);
  };
  run.sprites.getAnimatedHeroGlyph=(id,frame)=>
    skin(get(id,false,'hero-animation'),glyphWordForSpecies(frame.species),animations.get(frame.species));
  run.sprites.getHeroGhostGlyph=(id,style='fire')=>{
    const entry=animations.get(id);
    if(!entry?.texture.image)return null;
    const frame=heroActionFrame({},id,'walk',0);
    const batch=skin(get(id,false,'hero-ghost-'+style),glyphWordForSpecies(id),{...entry,ghost:style,rect:frame.rect});
    batch.zxGhostScale=frame.renderScale;
    return batch;
  };
  let playerEntry;
  run.sprites.getPlayerGlyph=(id,speciesId,pose,frame)=>{
    if(frame)return run.sprites.getAnimatedHeroGlyph(id,frame);
    const rig=loadedHeroRig(speciesId);
    if(!rig)return run.sprites.get(id);
    playerEntry??=createHeroPoseTexture(Texture,colorSpace);
    playerEntry.draw(rig,pose?.word===rig.word?pose:null);
    return skin(get(id,false,'player-strokes'),rig.word,playerEntry);
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
  run.sprites.get=(...args)=>skin(get(...args),args[2]);
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{
    disposed=true;clear();batches.clear();
    playerEntry?.texture.dispose();playerEntry=null;monsterTexture.dispose();
    for(const {texture} of animations.values())texture.dispose();
    animations.clear();
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
