import {glyphCatalog} from './glyph-catalog.js';
import {heroWords,enemyWords,finalBossSpecies,finalBossWord} from './character-rules.js';
import heroRigs from './hero-rigs.json' with {type:'json'};

const colors={fire:['#ff963e','#ed3438'],water:['#b9f2e7','#50bebd'],wood:['#c5e797','#72b778'],earth:['#e9b480','#b57649'],metal:['#ffe99a','#d5ac57'],ink:['#a5aac7','#6b719c'],dark:['#53695e','#1c302e']};
let atlas,ready;
const cache=new Map();
// The atlas fits each authored cutout into the middle 80/96 of its tile.
// Hero portraits already include 14 source-image pixels of dark ink.
function bakedInkFraction(word){
  const rig=Object.values(heroRigs).find(rig=>rig.word===word);
  return rig?14*(80/96)/Math.max(rig.frame.width,rig.frame.height):0;
}
export function drawBattleOutline(ctx,mask,bakedFraction=0){
  const size=mask.width,radius=size*(14/192-bakedFraction);
  for(let i=0;i<32;i++){
    const angle=i*Math.PI/16;
    ctx.drawImage(mask,Math.round(radius*Math.cos(angle)),Math.round(radius*Math.sin(angle)));
  }
  ctx.globalCompositeOperation='source-in';
  ctx.fillStyle='#27232f';ctx.fillRect(0,0,size,size);
  ctx.globalCompositeOperation='source-over';
}
export function isOriginalHeroGlyph(word){return Object.values(heroWords).includes(word);}
export function loadGlyphImage(filename){
  return new Promise((resolve,reject)=>{
    const image=new Image();let done=false;
    const finish=error=>{
      if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;
      if(error)reject(error);else resolve(image);
    };
    // Some native image failures never call onerror. Let startup report the
    // error and clear the pending request so a retry can load the atlas.
    const timer=setTimeout(()=>finish(Error('字形图集读取超时')),12000);
    image.onload=()=>finish();image.onerror=()=>finish(Error('字形图集加载失败'));
    image.src='assets/glyphs/'+filename;
  });
}
export function glyphAtlasReady(){
  ready??=loadGlyphImage('atlas.png').then(image=>(atlas=image),error=>{ready=null;throw error;});
  return ready;
}
export function glyphWordForSpecies(id){
  if(Number(id)===finalBossSpecies)return finalBossWord;
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
export function drawMenuGlyph(canvas,word,tone,large){
  const preview=large&&atlas?.complete&&glyphCatalog.words[word]?.preview;
  if(preview){
    const {left,top,size}=preview;
    canvas.width=canvas.height=size;
    canvas.getContext('2d').drawImage(atlas,left,top,size,size,0,0,size,size);
  }else{
    const image=glyphCanvas(word,tone);
    canvas.width=canvas.height=image.width;
    canvas.getContext('2d').drawImage(image,0,0);
  }
}
export function glyphCanvas(word,tone=glyphTone(word),{battle=false}={}){
  const key=word+'-'+tone+(battle?'-battle':'');if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
  const ctx=canvas.getContext('2d'),mask=document.createElement('canvas');mask.width=mask.height=192;
  const m=mask.getContext('2d'),record=glyphCatalog.words[word];
  if(record&&atlas?.complete){const {size,columns}=glyphCatalog;m.drawImage(atlas,record.index%columns*size,Math.floor(record.index/columns)*size,size,size,0,0,192,192);}
  else {m.font='bold 144px "Ziling Swei", sans-serif';m.textAlign='center';m.textBaseline='middle';m.fillText(word,96,100);}
  if(battle)drawBattleOutline(ctx,mask,record&&atlas?.complete?bakedInkFraction(word):0);
  // Draw the supplied hero colors over the battle border.
  if(isOriginalHeroGlyph(word)||glyphCatalog.enemies[word]){
    ctx.drawImage(mask,0,0);
    if(record&&atlas?.complete)cache.set(key,canvas);
    return canvas;
  }
  // Colored paper cutout: ink silhouette, warm extrusion and a light inner edge.
  m.globalCompositeOperation='source-in';m.fillStyle='#27232f';m.fillRect(0,0,192,192);
  if(!battle)for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.drawImage(mask,Math.cos(a)*5,Math.sin(a)*5+2);}
  m.fillStyle='#fff4d7';m.fillRect(0,0,192,192);ctx.drawImage(mask,0,-1.4);
  const ramp=colors[tone]||colors.ink,g=m.createLinearGradient(0,24,0,178);g.addColorStop(0,ramp[0]);g.addColorStop(1,ramp[1]);
  m.fillStyle=g;m.fillRect(0,0,192,192);ctx.drawImage(mask,0,1.2);
  if(record&&atlas?.complete)cache.set(key,canvas);
  return canvas;
}
