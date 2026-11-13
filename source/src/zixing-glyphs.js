import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies,isOriginalHeroGlyph,loadGlyphImage} from './paper-glyph-art.js';
import {createGlyphBatches} from './glyph-batches.js';
import {glyphCatalog} from './glyph-catalog.js';
import {createHeroPoseTexture,loadedHeroRig,prepareHeroStrokes} from './hero-poses.js';
const paintJobs=[];
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
  function skin(batch,override,playerEntry){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const word=override||glyphWordForSpecies(batch.sid);
    const m=batch.material;batch.zxGlyph=word;
    const entry=playerEntry||texture(word),t=entry.texture;batch.zxGlyphRect=entry.rect;
    batch.zxStrokeFrames=entry.frames;
    m.uniforms.map.value.dispose();m.uniforms.map.value=t;
    m.uniforms.zxGlyph={value:t};m.uniforms.uLean.value=.65;
    m.uniforms.uTexel.value.set(1/(entry.frames?columns*size:1024),1/(entry.frames?rows*size:1024));
    batch.ready=!!playerEntry;
    if(!playerEntry)entry.ready.then(()=>{if(!disposed)batch.ready=true;},error=>{if(!disposed)batch.loadError=error;});
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    batch.zxOriginalGlyph=isOriginalHeroGlyph(word);
    if(batch.zxOriginalGlyph){
      // No palette/skin, outline, light ramp or fog recoloring on supplied art.
      // Retain the brief hit flash as combat feedback.
      m.fragmentShader='uniform sampler2D zxGlyph; varying vec2 vUv; varying vec4 vFx; void main(){vec4 c=texture2D(zxGlyph,vUv);if(c.a<.01)discard;c.rgb=mix(c.rgb,vec3(1.),clamp(vFx.x,0.,1.));gl_FragColor=c;}';
      m.transparent=true;m.depthWrite=false;
    }
    m.needsUpdate=true;batches.add(batch,t.uuid+(batch.zxOriginalGlyph?'-original':''),playerEntry?1:1024);return batch;
  }
  let playerEntry;
  run.sprites.getPlayerGlyph=(id,speciesId,pose)=>{
    const rig=loadedHeroRig(speciesId);
    if(!rig)return run.sprites.get(id);
    playerEntry??=createHeroPoseTexture(Texture,colorSpace);
    playerEntry.draw(rig,pose?.word===rig.word?pose:null);
    return skin(get(id,false,'player-strokes'),rig.word,playerEntry);
  };
  run.sprites.prepareGlyphTextures=async (renderer,playerSpecies)=>{
    await Promise.all([monsterReady,prepareHeroStrokes(playerSpecies)]);
    if(!disposed)renderer.initTexture(monsterTexture);
    for(const page of pages){await Promise.all(page.jobs);if(!disposed)renderer.initTexture(page.texture);}
  };
  run.sprites.get=(...args)=>skin(get(...args),args[2]);
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{disposed=true;clear();batches.clear();playerEntry?.texture.dispose();playerEntry=null;monsterTexture.dispose();for(const page of pages)page.texture.dispose();pages.length=0;textures.clear();};
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
