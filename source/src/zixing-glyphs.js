import {glyphAtlasReady,glyphCanvas,glyphWordForSpecies} from './paper-glyph-art.js';
// Reuse actor batches and collision data with the supplied paper cutouts.
export function installGlyphs(run,{Texture,colorSpace,species}) {
  const textures=new Map(),get=run.sprites.get.bind(run.sprites),clear=run.sprites.clear.bind(run.sprites);
  const shadow=run.sprites.shadows.mesh.material;
  shadow.transparent=true;shadow.blending=1;shadow.depthWrite=false;
  shadow.fragmentShader='varying vec2 vUv; void main(){float d=length((vUv-.5)*2.); float a=smoothstep(1.,.25,d)*.34;gl_FragColor=vec4(.07,.10,.12,a);}';shadow.needsUpdate=true;
  let disposed=false;
  function texture(word) {
    if(textures.has(word))return textures.get(word);
    const t=new Texture(glyphCanvas(word));t.colorSpace=colorSpace;t.generateMipmaps=true;t.needsUpdate=true;textures.set(word,t);
    glyphAtlasReady().then(()=>{if(disposed)return;t.image=glyphCanvas(word);t.needsUpdate=true;}).catch(()=>{});return t;
  }
  function skin(batch){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const word=glyphWordForSpecies(batch.sid);
    const m=batch.material;batch.zxGlyph=word;
    const push=batch.push.bind(batch);
    batch.push=(...args)=>{
      const index=batch.count;push(...args);
      if(batch.count===index)return;
      // Atlas frames include transparent padding below the feet. A glyph uses
      // the visible body's height and sits directly at the original footpoint.
      // Original species have very different silhouettes. Normalize ordinary
      // letters; keep the existing elite/boss scale multiplier readable.
      const size=Math.max(1.9,Math.min(2.55,batch.bodyHeight(1)*1.3))*(args[6]??1);
      batch.aPos.array[index*3+1]=args[1]+.08;
      batch.aSize.array[index*2]=size;
      batch.aSize.array[index*2+1]=size;
    };
    m.uniforms.zxGlyph={value:texture(word)};m.uniforms.uLean.value=.65;
    m.vertexShader=m.vertexShader.replace('vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y));','vUv = uv;').replace('vRect = vec4(min(iUV.x,iUV.z), min(iUV.y,iUV.w), max(iUV.x,iUV.z), max(iUV.y,iUV.w));','vRect = vec4(0.,0.,1.,1.);');
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    m.needsUpdate=true;return batch;
  }
  run.sprites.get=(...args)=>skin(get(...args));
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{disposed=true;clear();for(const t of textures.values())t.dispose();textures.clear();};
}
