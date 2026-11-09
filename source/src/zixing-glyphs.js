import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies} from './paper-glyph-art.js';
import {createGlyphBatches} from './glyph-batches.js';
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
  const batches=createGlyphBatches(run.sprites),end=run.sprites.end.bind(run.sprites);
  run.sprites.end=()=>{end();batches.flush();};
  const shadow=run.sprites.shadows.mesh.material;
  shadow.transparent=true;shadow.blending=1;shadow.depthWrite=false;
  shadow.fragmentShader='varying vec2 vUv; void main(){float d=length((vUv-.5)*2.); float a=smoothstep(1.,.25,d)*.34;gl_FragColor=vec4(.07,.10,.12,a);}';shadow.needsUpdate=true;
  let disposed=false;
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
      if(disposed)return;page.context.drawImage(glyphCanvas(word),x,y);t.needsUpdate=true;
    }));
    page.jobs.push(entry.ready);t.userData.ready=Promise.all(page.jobs);textures.set(word,entry);return entry;
  }
  function skin(batch){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const word=glyphWordForSpecies(batch.sid);
    const m=batch.material;batch.zxGlyph=word;
    const entry=texture(word),t=entry.texture;batch.zxGlyphRect=entry.rect;
    m.uniforms.map.value.dispose();m.uniforms.map.value=t;
    m.uniforms.zxGlyph={value:t};m.uniforms.uLean.value=.65;
    m.uniforms.uTexel.value.set(1/1024,1/1024);
    batch.ready=false;
    entry.ready.then(()=>{if(!disposed)batch.ready=true;},error=>{if(!disposed)batch.loadError=error;});
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    m.needsUpdate=true;batches.add(batch,t.uuid);return batch;
  }
  run.sprites.get=(...args)=>skin(get(...args));
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{disposed=true;clear();batches.clear();for(const page of pages)page.texture.dispose();pages.length=0;textures.clear();};
}

// Legacy choice/evolution dialogs also use cutouts, with no animation timer.
export function glyphPreview(id,scale=3,className='pix'){
  const canvas=document.createElement('canvas');canvas.className=className+' zx-glyph-icon';
  canvas.dataset.static='true';canvas.dataset.species=String(id);canvas.dataset.glyph=glyphWordForSpecies(id);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',glyphWordForSpecies(id)+'字灵');
  canvas.width=canvas.height=Math.max(48,Math.round(64*scale));
  const draw=()=>{const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(glyphCanvas(glyphWordForSpecies(id)),0,0,canvas.width,canvas.height);canvas.dataset.frame=String((Number(canvas.dataset.frame)||0)+1);};
  draw();glyphAtlasReady().then(draw).catch(()=>{});return canvas;
}
