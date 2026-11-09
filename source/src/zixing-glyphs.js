import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies} from './paper-glyph-art.js';
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
  const textures=new Map(),get=run.sprites.get.bind(run.sprites),clear=run.sprites.clear.bind(run.sprites);
  const shadow=run.sprites.shadows.mesh.material;
  shadow.transparent=true;shadow.blending=1;shadow.depthWrite=false;
  shadow.fragmentShader='varying vec2 vUv; void main(){float d=length((vUv-.5)*2.); float a=smoothstep(1.,.25,d)*.34;gl_FragColor=vec4(.07,.10,.12,a);}';shadow.needsUpdate=true;
  let disposed=false;
  function texture(word) {
    if(textures.has(word))return textures.get(word);
    const t=new Texture();t.colorSpace=colorSpace;t.generateMipmaps=true;textures.set(word,t);
    // Generate and upload only the final cutout, once per word in this run.
    t.userData.ready=glyphAtlasReady().catch(()=>null).then(()=>paintLater(()=>{
      if(disposed)return;t.image=glyphCanvas(word);t.needsUpdate=true;
    }));return t;
  }
  function skin(batch){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const word=glyphWordForSpecies(batch.sid);
    const m=batch.material;batch.zxGlyph=word;
    const t=texture(word);
    m.uniforms.map.value.dispose();m.uniforms.map.value=t;
    m.uniforms.zxGlyph={value:t};m.uniforms.uLean.value=.65;
    m.uniforms.uTexel.value.set(1/192,1/192);
    batch.ready=!!t.image;
    t.userData.ready.then(()=>{if(!disposed)batch.ready=true;},error=>{if(!disposed)batch.loadError=error;});
    m.vertexShader=m.vertexShader.replace('vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y));','vUv = uv;').replace('vRect = vec4(min(iUV.x,iUV.z), min(iUV.y,iUV.w), max(iUV.x,iUV.z), max(iUV.y,iUV.w));','vRect = vec4(0.,0.,1.,1.);');
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    m.needsUpdate=true;return batch;
  }
  run.sprites.get=(...args)=>skin(get(...args));
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{disposed=true;clear();for(const t of textures.values())t.dispose();textures.clear();};
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
