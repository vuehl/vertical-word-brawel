// A visual skin for the existing sprite batches. Collision sizes, species,
// animation timing, attacks and progression continue to use the original data.
const elements={fire:['火','#c14442'],water:['水','#39859f'],grass:['木','#558b48'],steel:['金','#b49b4b'],ground:['土','#998260'],rock:['土','#998260'],ice:['水','#39859f'],bug:['木','#558b48'],normal:['金','#b49b4b']};
export function installGlyphs(run,{Texture,colorSpace,species}) {
  const textures=new Map(),get=run.sprites.get.bind(run.sprites),clear=run.sprites.clear.bind(run.sprites);
  function texture(word,color) {
    if(textures.has(word))return textures.get(word);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fffbea';ctx.strokeStyle=color;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(64,64,57,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font='bold 91px "Ziling Swei", sans-serif';ctx.fillText(word,64,67);
    const t=new Texture(canvas);t.colorSpace=colorSpace;t.generateMipmaps=false;textures.set(word,t);return t;
  }
  function skin(batch){
    if(batch.zxGlyph)return batch;
    const data=species(batch.sid);if(!data)return batch;
    const [word,color]=elements[data.types[0]]||['金','#b49b4b'];
    const m=batch.material;batch.zxGlyph=word;
    const push=batch.push.bind(batch);
    batch.push=(...args)=>{
      const index=batch.count;push(...args);
      if(batch.count===index)return;
      // Atlas frames include transparent padding below the feet. A glyph uses
      // the visible body's height and sits directly at the original footpoint.
      const size=batch.bodyHeight(args[6]??1);
      batch.aPos.array[index*3+1]=args[1]+.04;
      batch.aSize.array[index*2]=size;
      batch.aSize.array[index*2+1]=size;
    };
    m.uniforms.zxGlyph={value:texture(word,color)};
    m.vertexShader=m.vertexShader.replace('vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y));','vUv = uv;').replace('vRect = vec4(min(iUV.x,iUV.z), min(iUV.y,iUV.w), max(iUV.x,iUV.z), max(iUV.y,iUV.w));','vRect = vec4(0.,0.,1.,1.);');
    m.fragmentShader=m.fragmentShader.replace('uniform sampler2D map;','uniform sampler2D map; uniform sampler2D zxGlyph;').replaceAll('texture2D(map,','texture2D(zxGlyph,');
    m.needsUpdate=true;return batch;
  }
  run.sprites.get=(...args)=>skin(get(...args));
  for(const batch of run.sprites.batches.values())skin(batch);
  run.sprites.clear=()=>{clear();for(const t of textures.values())t.dispose();textures.clear();};
}
