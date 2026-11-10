import {glyphCatalog} from './glyph-catalog.js';
import {heroWords,enemyWords} from './character-rules.js';

const colors={fire:['#ff963e','#ed3438'],water:['#b9f2e7','#50bebd'],wood:['#c5e797','#72b778'],earth:['#e9b480','#b57649'],metal:['#ffe99a','#d5ac57'],ink:['#a5aac7','#6b719c'],dark:['#53695e','#1c302e']};
let atlas,ready;
const cache=new Map();
export function isOriginalHeroGlyph(word){return Object.values(heroWords).includes(word);}
export function glyphAtlasReady(){
  if(!ready)ready=new Promise((resolve,reject)=>{
    const image=new Image();let done=false;
    const finish=error=>{
      if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;
      if(error){ready=null;reject(error);}else{atlas=image;resolve(image);}
    };
    // Some native image failures never call onerror. Fall back to the bundled
    // font instead of keeping all actors behind an unresolved image Promise.
    const timer=setTimeout(()=>finish(Error('字形图集读取超时')),12000);
    image.onload=()=>finish();image.onerror=()=>finish(Error('字形图集加载失败'));
    image.src='assets/glyphs/atlas.png';
  });
  return ready;
}
export function glyphWordForSpecies(id){
  return heroWords[id]||enemyWords[(Math.abs(Number(id))||0)%enemyWords.length];
}
export function glyphTone(word){
  if('风讽疯飒飙'.includes(word))return 'water';
  if('火炎焱燚烬灼炬烛焚燃灯烁熙'.includes(word))return 'fire';
  if('水淼雨川河海泉'.includes(word))return 'water';
  if('木林森禾竹春柳松槐'.includes(word))return 'wood';
  if('土圭垚士石岩磊山工'.includes(word))return 'earth';
  if('金鑫光星晶镜'.includes(word))return 'metal';
  return 'ink';
}
export function glyphCanvas(word,tone=glyphTone(word)){
  const key=word+'-'+tone;if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
  const ctx=canvas.getContext('2d'),mask=document.createElement('canvas');mask.width=mask.height=192;
  const m=mask.getContext('2d'),record=glyphCatalog.words[word];
  if(record&&atlas?.complete){const {size,columns}=glyphCatalog;m.drawImage(atlas,record.index%columns*size,Math.floor(record.index/columns)*size,size,size,0,0,192,192);}
  else {m.font='bold 144px "Ziling Swei", sans-serif';m.textAlign='center';m.textBaseline='middle';m.fillText(word,96,100);}
  // Hero PNGs already define their appearance. Preserve their RGB and alpha;
  // the paper treatment below is only for enemies and interface symbols.
  if(isOriginalHeroGlyph(word)){
    ctx.drawImage(mask,0,0);
    if(record&&atlas?.complete)cache.set(key,canvas);
    return canvas;
  }
  // Colored paper cutout: ink silhouette, warm extrusion and a light inner edge.
  m.globalCompositeOperation='source-in';m.fillStyle='#27232f';m.fillRect(0,0,192,192);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.drawImage(mask,Math.cos(a)*5,Math.sin(a)*5+2);}
  m.fillStyle='#fff4d7';m.fillRect(0,0,192,192);ctx.drawImage(mask,0,-1.4);
  const ramp=colors[tone]||colors.ink,g=m.createLinearGradient(0,24,0,178);g.addColorStop(0,ramp[0]);g.addColorStop(1,ramp[1]);
  m.fillStyle=g;m.fillRect(0,0,192,192);ctx.drawImage(mask,0,1.2);
  if(record&&atlas?.complete)cache.set(key,canvas);
  return canvas;
}
