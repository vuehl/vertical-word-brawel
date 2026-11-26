import {paintPhotoWaves,paintSettingsSymbol,paperPalette} from './paper-shapes.js';
import {appearanceGlyphCanvas,drawAppearanceGlyph} from './collection-art.js';
import {qualityPaper,upgradeStocks} from './choice-presentation.js';
const {paper,ink}=paperPalette;

function canvas(width,height,className,pixelRatio=2){
  const node=document.createElement('canvas');
  node.className=className;
  node.width=width*pixelRatio;
  node.height=height*pixelRatio;
  node.dataset.static='true';
  node.setAttribute('aria-hidden','true');
  const ctx=node.getContext('2d');
  ctx.scale(pixelRatio,pixelRatio);
  return {node,ctx};
}

function polygon(ctx,points,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}

const waves={
  fire:['#C4DCF0','#F0DBD6','#DC9790'],
  grass:['#C6DED4','#DBEBD8','#67A094'],
  water:['#BADDEC','#DCEDF6','#5D99C8'],
  flying:['#BDDDEB','#DFF1F5','#639FB6'],
  normal:['#DCCDF1','#F0E5F9','#A281D5'],
  locked:['#DFE2ED','#EDEEF4','#C2C4D5'],
  unknown:['#E2E7F4','#F1F2F9','#BFC8DC'],
  common:['#D1D7EA','#EDF0F8','#919EB9'],
  uncommon:['#A8D1B0','#E8F1E0','#45835D'],
  rare:['#81BCE0','#D4E6F4','#3E75C5'],
  epic:['#CAB6E5','#F4EFFB','#936FBC'],
  legendary:['#D5A658','#F2E9C9','#C57742'],
};
const rotations=[-2.2,1.4,-.8,1.9,.9,-1.8,1.5,-1.1,.6,-1.3,.2,1.3];
export const photoTilt=index=>rotations[index%rotations.length];

function wavePrint(ctx,x,y,w,h,tone,photoIndex){
  const [top,bottom,accent]=waves[tone]||waves.normal;
  ctx.save();
  ctx.translate(x,y);
  ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,top);sky.addColorStop(1,bottom);
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  if(photoIndex===undefined)paintPhotoWaves(ctx,w,h,accent,top);
  else{
    // Only the lower quarter of a library print carries the breaking wave.
    // The open sky keeps the type badge and the character distinct.
    ctx.translate(photoIndex%2?w:0,0);ctx.scale((photoIndex%2?-1:1)*w/100,h/100);
    ctx.fillStyle=bottom;ctx.beginPath();ctx.moveTo(0,74);
    ctx.bezierCurveTo(15,62,29,76,41,84);ctx.bezierCurveTo(57,93,68,78,77,76);
    ctx.bezierCurveTo(88,69,96,67,100,68);ctx.lineTo(100,100);ctx.lineTo(0,100);ctx.fill();
    ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(-2,97);
    ctx.bezierCurveTo(7,88,3,73,18,73);ctx.bezierCurveTo(30,73,32,86,24,87);
    ctx.bezierCurveTo(19,88,18,82,22,81);ctx.bezierCurveTo(13,80,14,94,24,96);
    ctx.bezierCurveTo(46,102,47,90,60,91);ctx.bezierCurveTo(76,93,77,80,94,81);
    ctx.lineTo(102,83);ctx.lineTo(102,102);ctx.lineTo(-2,102);ctx.fill();
    ctx.fillStyle=paper;ctx.beginPath();ctx.moveTo(64,93);ctx.bezierCurveTo(79,88,82,76,94,77);
    ctx.bezierCurveTo(102,77,103,83,99,84);ctx.bezierCurveTo(91,78,81,94,64,93);ctx.fill();
  }
  ctx.restore();
}

export function photoPaper(index,tone,selected,angle=photoTilt(index),caption=true){
  const {node,ctx}=canvas(68,76,'zc-photo-paper');
  if(!caption){
    const notch=index%3;
    polygon(ctx,[[1,1],[67,1],[66,69],[60,70],[54,69+notch],[46,72],[37,70],[28,72-notch],[20,70],[11,73],[1,72]],selected?paperPalette.yellow:
      tone==='locked'||tone==='unknown'?'#57535E':'#FFFAEF');
    return node;
  }
  ctx.translate(34,38);
  ctx.rotate(angle*Math.PI/180);
  ctx.fillStyle='#4D597338';ctx.fillRect(-30,-33,61,68);
  ctx.fillStyle=selected?'#437ED0':'#C1C6D5';ctx.fillRect(-31.5,-35,62,69);
  const rim=selected?1.5:.7;
  ctx.fillStyle=paper;ctx.fillRect(-31.5+rim,-35+rim,62-rim*2,69-rim*2);
  // The compact grid uses the same layered waves as the appearance swatches.
  wavePrint(ctx,-28,-31.5,55,caption?48:61,tone,caption?index:undefined);
  return node;
}

export function upgradePrint(tone){
  const {node,ctx}=canvas(84,84,'zx-upgrade-print');
  const [face,,ink]=upgradeStocks[tone]||upgradeStocks.special;
  // A die-cut seal printed on the detachable stub.
  const seal=[];
  for(let i=0;i<64;i++){
    const theta=i*Math.PI/32,r=i%4===0?36:i%4===2?38:37.8;
    seal.push([42+r*Math.cos(theta),42+r*Math.sin(theta)]);
  }
  polygon(ctx,seal,face);
  ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.globalAlpha=.53;
  ctx.beginPath();ctx.arc(42,42,31,0,2*Math.PI);ctx.stroke();
  return node;
}

// A specimen mount and a tear-off blessing ticket share the upgrade rarity inks.
export function rewardPaper(kind,quality){
  const [edge,top,bottom,accent,ink]=qualityPaper[quality]||qualityPaper.special;
  const item=kind==='item',w=336,h=item?290:84;
  const {node,ctx}=canvas(w,h,'zx-reward-print');
  if(item){
    const paper=[[0,10],[10,0],[w-16,0],[w,15],[w,h-10],[w-10,h],[11,h],[0,h-10]];
    polygon(ctx,paper,edge);
    polygon(ctx,[[3,11],[12,3],[w-17,3],[w-3,17],[w-3,h-12],[w-12,h-5],[12,h-5],[3,h-12]],top);
    // The tinted cover opens onto the lighter description leaf.
    polygon(ctx,[[3,11],[12,3],[w-17,3],[w-3,17],[w-3,124],[w-64,135],[48,130],[3,118]],bottom);
    polygon(ctx,[[3,11],[12,3],[81,3],[27,48],[3,51]],accent);
    polygon(ctx,[[3,80],[22,72],[50,97],[98,125],[48,128],[3,116]],accent);
    polygon(ctx,[[w-82,132],[w-35,101],[w-3,95],[w-3,124]],accent);
    for(const [x,y,r] of [[87,45,6],[245,77,7],[262,44,3]]){
      polygon(ctx,[[x,y-r],[x+r*.3,y-r*.25],[x+r,y],[x+r*.3,y+r*.25],[x,y+r],[x-r*.3,y+r*.25],[x-r,y],[x-r*.3,y-r*.25]],accent);
    }
    polygon(ctx,[[w-17,3],[w-3,17],[w-18,15]],edge);
    polygon(ctx,[[14,h-6],[w-17,h-6],[w-20,h-3],[18,h-3]],accent);
  }else{
    const stub=247;
    const ticket=(dy,color)=>polygon(ctx,[[0,8+dy],[7,dy],[stub-4,dy],[stub,5+dy],[stub+4,dy],[w-7,dy],[w,7+dy],[w,70+dy],[w-7,77+dy],[stub+4,77+dy],[stub,72+dy],[stub-4,77+dy],[7,77+dy],[0,70+dy]],color);
    ticket(5,edge);ticket(1,top);
    polygon(ctx,[[0,9],[7,1],[59,1],[50,78],[7,78],[0,71]],bottom);
    polygon(ctx,[[0,9],[7,1],[12,1],[7,77],[0,71]],accent);
    polygon(ctx,[[stub+4,1],[w-7,1],[w,8],[w,71],[w-7,78],[stub+4,78],[stub,73],[stub,6]],bottom);
    ctx.fillStyle=accent;for(let y=10;y<70;y+=8)ctx.fillRect(stub,y,1.5,4);
    polygon(ctx,[[17,78],[48,78],[47,81],[15,81]],ink);
  }
  return node;
}

export function headerCutout(family){
  const node=document.createElement('img');
  node.className='zc-header-cutout';
  node.src='assets/ui-paper/header-'+family+'.webp';
  node.dataset.paperBleed='top';
  node.setAttribute('aria-hidden','true');
  node.alt='';
  return node;
}

// The flyleaf, portrait, and typeset labels are separate layers, so translated
// stage names and live run values stay crisp over the printed paper.
export function pauseCoverPrint(){
  const {node,ctx}=canvas(362,137,'zx-pause-cover-print');
  const cover=ctx.createLinearGradient(0,10,348,112);
  cover.addColorStop(0,'#303A60');cover.addColorStop(.62,'#354D79');cover.addColorStop(1,'#527CA7');
  ctx.translate(0,-23);
  polygon(ctx,[[3,35],[13,23],[348,23],[361,35],[361,150],[352,159],[12,159],[3,150]],'#697F9E');
  polygon(ctx,[[4,34],[14,23],[347,23],[359,34],[359,141],[4,141]],cover);

  // Folded ridgelines and a paper glider occupy the unprinted side of the cover.
  polygon(ctx,[[224,108],[259,84],[283,88],[315,67],[359,83],[359,119]],'#526E98');
  polygon(ctx,[[253,109],[291,93],[309,96],[347,71],[359,76],[359,118]],'#7493B6');
  polygon(ctx,[[297,108],[325,97],[340,100],[359,90],[359,118]],'#9CB8CF');
  ctx.save();ctx.strokeStyle='#9EBCD6';ctx.lineWidth=1.4;ctx.setLineDash([3,4]);
  ctx.beginPath();ctx.moveTo(214,96);ctx.bezierCurveTo(225,78,247,100,251,85);
  ctx.bezierCurveTo(254,74,238,74,241,82);ctx.bezierCurveTo(247,95,269,71,280,64);ctx.stroke();ctx.restore();
  polygon(ctx,[[267,57],[336,32],[312,78],[292,65],[284,73],[283,63]],'#2B405F');
  polygon(ctx,[[265,54],[335,30],[293,61]],'#E8EFF7');
  polygon(ctx,[[283,60],[335,30],[291,65],[283,72]],'#7D9DBE');
  polygon(ctx,[[291,63],[335,30],[311,75]],'#BECEE4');
  polygon(ctx,[[311,75],[319,60],[303,70]],'#CF7B87');

  // The light score strip forms the turned edge of the cover.
  polygon(ctx,[[6,110],[73,110],[85,105],[359,105],[359,149],[351,156],[8,156]],'#DCE7F1');
  polygon(ctx,[[6,110],[73,110],[85,105],[110,105],[98,111],[6,114]],'#B1C4DA');
  polygon(ctx,[[334,153],[355,153],[349,158],[330,158]],'#829FC0');
  return node;
}

// Scalable paper title for floating dialogs. The center grows with the label;
// the clipped ends, backing tab, and paperclip keep their original dimensions.
export function dialogHeadingPrint(width){
  const {node,ctx}=canvas(width,46,'paper-floating-title-print');
  const right=width-18;
  ctx.translate(2,5);
  polygon(ctx,[[1,11],[right-7,9],[right-10,22],[right-4,31],[12,38],[1,30]],'#2D4262');
  polygon(ctx,[[right-27,12],[width-4,9],[width-14,21],[width-5,31],[right-25,35]],'#AB6071');
  polygon(ctx,[[right-27,11],[width-3,8],[width-15,20],[width-6,28],[right-25,31]],'#D58C97');
  polygon(ctx,[[3,23],[18,23],[17,38],[3,32]],'#8098B4');
  polygon(ctx,[[2,6],[17,2],[right-4,2],[right+2,8],[right-4,19],[right,27],[15,34],[2,30]],'#9FB3C9');
  polygon(ctx,[[1,5],[17,1],[right-4,1],[right+2,6],[right-6,16],[right-1,24],[15,30],[1,27]],'#F0F1F7');
  polygon(ctx,[[3,6],[18,2],[15,29],[3,26]],'#D3DFED');
  ctx.save();ctx.translate(20,0);ctx.rotate(-.18);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(1,2);ctx.lineTo(1,17);ctx.quadraticCurveTo(1,23,6,23);
  ctx.quadraticCurveTo(11,23,11,17);ctx.lineTo(11,3);ctx.quadraticCurveTo(11,-1,7,-1);
  ctx.quadraticCurveTo(4,-1,4,3);ctx.lineTo(4,16);
  ctx.strokeStyle='#394E70';ctx.lineWidth=3.2;ctx.stroke();
  ctx.strokeStyle='#91B2D2';ctx.lineWidth=1.45;ctx.stroke();ctx.restore();

  return node;
}

export function pausePagePrint(){
  const {node,ctx}=canvas(362,404,'zx-pause-page-print');
  polygon(ctx,[[4,0],[359,0],[361,390],[350,403],[10,403],[0,395]],'#425D83');
  polygon(ctx,[[5,0],[357,0],[358,389],[349,399],[10,399],[3,394]],'#A3B6CC');
  polygon(ctx,[[5,0],[357,0],[357,385],[345,396],[9,396],[5,392]],'#F2F2F8');
  polygon(ctx,[[5,0],[11,0],[11,396],[7,394],[5,391]],'#D8E2EE');
  polygon(ctx,[[345,396],[347,387],[357,385]],'#C6D5E5');
  return node;
}

export function battleDialogHeading(title,subtitle=''){
  const header=document.createElement('header');
  header.className='zx-paper-upgrade-head'+(subtitle?'':' single-line');

  const length=Array.from(title.textContent.trim()).length;
  const available=Math.max(120,(globalThis.window?.innerWidth||390)-64);
  const span=Math.min(available,Math.max(202,length*(length>9?20:28)+80));
  header.append(upgradeRibbons(span),title);
  if(subtitle){
    const label=document.createElement('small');label.textContent=subtitle;header.append(label);
  }
  if(title.textContent.trim().length>9)header.classList.add('long-title');
  return header;
}
export function battleDialogFrame(content,title,subtitle=''){
  const shell=document.createElement('div');shell.className='zx-combat-shell';
  shell.append(battleDialogHeading(title,subtitle),content);
  return shell;
}
export function upgradeRibbons(width=202){
  const {node,ctx}=canvas(width,42,'zx-upgrade-ribbons');
  node.style.width=width+'px';
  polygon(ctx,[[8,9],[width-10,4],[width-17,16],[width-9,17],[width-22,33],[5,37],[13,25],[6,24]],'#EEC659');
  polygon(ctx,[[6,5],[width-5,2],[width-15,14],[width-8,14],[width-20,29],[2,32],[10,19],[3,20]],'#322C37');
  polygon(ctx,[[13,9],[27,8],[22,12],[11,13]],'#EEC659');
  return node;
}

const evolutionPalette={yellow:'#EEC659',darkStock:'#27232F',card:'#FBF5E8',ink:'#27232F',muted:'#62584E'};
function drawEvolutionStamp(ctx,progress){
  ctx.clearRect(0,0,100,100);
  const fall=Math.min(1,progress/.72);
  const press=Math.sin(Math.PI*Math.max(0,(progress-.72)/.28));
  const size=.80+.06*(1-fall);
  ctx.save();ctx.translate(50,51-3*(1-fall));ctx.rotate(-.12-.06*(1-fall));
  ctx.scale(size*(1+.04*press),size*(1-.08*press));ctx.globalAlpha*=.6+.4*fall;
  polygon(ctx,[[-49,-48],[-43,-52],[44,-51],[49,-46],[48,43],[43,49],[-46,48]],evolutionPalette.yellow);
  ctx.lineJoin='round';ctx.lineWidth=3;
  polygon(ctx,[[-42,-43],[39,-44],[42,-40],[41,39],[-40,41],[-43,38]],null,evolutionPalette.darkStock);
  ctx.lineWidth=.85;ctx.strokeRect(-39,-40,77,77);
  ctx.fillStyle=evolutionPalette.darkStock;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 32px "Ziling Swei",sans-serif';ctx.fillText('进阶',0,-18);ctx.fillText('完成',0,16);
  ctx.restore();
}

export function evolutionResult(from,to,look){
  const {node:face,ctx}=canvas(320,66,'');
  const edge=[[1,2],[289,2],[301,9],[301,45],[286,60],[0,60]];
  ctx.save();ctx.translate(1,4);polygon(ctx,edge,evolutionPalette.darkStock);ctx.restore();
  polygon(ctx,edge,evolutionPalette.card);polygon(ctx,[[0,2],[15,2],[9,60],[0,60]],evolutionPalette.yellow);
  polygon(ctx,[[307,49],[320,48],[299,65]],evolutionPalette.yellow);
  ctx.drawImage(appearanceGlyphCanvas(to.word,to.tone,look),12,6,48,48);
  ctx.textBaseline='middle';ctx.fillStyle=evolutionPalette.ink;ctx.font='bold 21px "Ziling Swei",sans-serif';
  const route=from.word+' → '+to.word;
  ctx.fillText(route,65,21);
  const {node,ctx:print}=canvas(320,66,'zx-evolution-result');
  const {node:stamp,ctx:seal}=canvas(100,100,'zx-evolution-stamp',3);
  stamp.dataset.uiLayer='evolution-stamp';
  node.dataset.uiLayer='evolution-result';
  node.removeAttribute('aria-hidden');node.setAttribute('role','status');
  function setHealth(before,after){
    const detail='最大生命 '+before+' → ';
    ctx.font='16px "Ziling Swei",sans-serif';const detailWidth=ctx.measureText(detail).width;
    ctx.font='bold 20px "Ziling Swei",sans-serif';const valueWidth=ctx.measureText(String(after)).width;
    ctx.save();ctx.translate(65,0);ctx.scale(Math.min(1,218/(detailWidth+valueWidth)),1);
    ctx.font='16px "Ziling Swei",sans-serif';ctx.fillStyle=evolutionPalette.muted;ctx.fillText(detail,0,46);
    ctx.font='bold 20px "Ziling Swei",sans-serif';ctx.fillStyle=evolutionPalette.ink;ctx.fillText(String(after),detailWidth,45);ctx.restore();
    node.setAttribute('aria-label','进阶完成，'+route+'，最大生命 '+before+' → '+after);
  }
  function paint(progress){
    print.clearRect(0,0,320,66);
    const enter=Math.min(1,.65+progress*2.6);
    print.save();print.translate(-6*(1-enter),0);print.globalAlpha=enter;
    print.drawImage(face,0,0,320,66);
    print.restore();
    drawEvolutionStamp(seal,progress);
    stamp.dataset.frame=String(progress);
    node.dataset.frame=String(progress);
  }
  return {node,stamp,paint,setHealth};
}

export function arrivalPennant(){
  const {node,ctx}=canvas(248,52,'zx-arrival-face');
  polygon(ctx,[[4,7],[245,3],[236,15],[242,14],[229,44],[4,50],[9,41],[1,42]],'#29252E');
  polygon(ctx,[[2,9],[46,6],[39,43],[0,47]],'#F3CA58');
  polygon(ctx,[[9,26],[36,13],[28,35],[21,29],[16,35],[17,28]],'#302B34');
  polygon(ctx,[[10,26],[36,13],[20,26]],'#FFF4D6');
  polygon(ctx,[[51,45],[226,39],[223,43],[51,48]],'#EFC554');
  return node;
}

export function settlementTicket(){
  const {node,ctx}=canvas(338,150,'zx-receipt-paper');
  const outline=(y,fill)=>polygon(ctx,[[6,1+y],[66,1+y],[70,5+y],[74,1+y],[330,1+y],[337,8+y],[337,138+y],[330,144+y],[74,144+y],[70,140+y],[66,144+y],[6,144+y],[0,138+y],[0,8+y]],fill);
  outline(4,'#728AA8');outline(0,'#F0F0F7');
  polygon(ctx,[[6,1],[65,1],[70,6],[70,139],[65,144],[6,144],[0,138],[0,8]],'#D9E4F2');
  ctx.fillStyle='#A3B5CA';for(let y=11;y<136;y+=9)ctx.fillRect(69,y,1.2,4);
  polygon(ctx,[[19,45],[47,40],[54,86],[25,90]],'#829EBF');
  polygon(ctx,[[15,42],[42,39],[50,45],[55,81],[21,87]],'#FBF8FC');
  polygon(ctx,[[42,39],[42,47],[50,45]],'#BCD1E3');
  ctx.strokeStyle='#8CA5BE';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,54);ctx.lineTo(40,51);ctx.moveTo(23,60);ctx.lineTo(37,58);ctx.stroke();
  polygon(ctx,[[30,70],[52,67],[57,71],[58,79],[54,83],[32,86],[28,82],[27,74]],'#AB6070');
  polygon(ctx,[[35,76],[39,78],[48,71],[50,73],[40,82],[33,78]],'#F4EEF4');
  return node;
}

export function disclosureArrow(open){
  const {node,ctx}=canvas(16,12,'zc-disclosure-arrow');
  ctx.strokeStyle='#547090';ctx.lineWidth=1.65;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(2,open?8:4);ctx.lineTo(8,open?3:9);ctx.lineTo(14,open?8:4);ctx.stroke();
  return node;
}

export function paperIcon(name){
  if(name==='hud-pause'){
    const {node,ctx}=canvas(32,29,'zx-pause-print');
    ctx.translate(16,14.5);ctx.rotate(-2*Math.PI/180);ctx.translate(-15,-13.5);
    polygon(ctx,[[2.7,0],[30,0],[27.6,27],[0,27]],'rgba(48,41,52,.86)');
    ctx.fillStyle='#FFF5E4';ctx.fillRect(9,8,4,11);ctx.fillRect(17,8,4,11);
    return node;
  }
  if(name==='dismiss'){
    const {node,ctx}=canvas(72,53,'paper-dismiss-art');
    polygon(ctx,[[7,3],[71,3],[64,49],[0,49]],paperPalette.darkStock);
    ctx.strokeStyle=paperPalette.warmWhite;ctx.lineWidth=5;ctx.lineCap='butt';
    ctx.beginPath();ctx.moveTo(27,17);ctx.lineTo(45,35);ctx.moveTo(45,17);ctx.lineTo(27,35);ctx.stroke();
    return node;
  }
  if(name==='back'){
    const {node,ctx}=canvas(72,53,'zx-paper-icon paper-back-art');
    polygon(ctx,[[7,3],[71,3],[64,49],[0,49]],paperPalette.darkStock);
    polygon(ctx,[[23,26],[46,14],[41,26],[45,36]],paperPalette.warmWhite);
    return node;
  }
  if(name==='settings'){
    const {node,ctx}=canvas(44,44,'zx-paper-icon');
    ctx.fillStyle=paperPalette.darkStock;ctx.beginPath();ctx.arc(22,22,21,0,2*Math.PI);ctx.fill();
    paintSettingsSymbol(ctx,10,10,24,paperPalette.warmWhite);
    return node;
  }
  const {node,ctx}=canvas(32,28,'zx-paper-icon');
  if(name!=='reroll'){
    // Shoulders taper to two side points. The bottom of the folded paper
    // shows through as a narrow blue edge beneath the single light face.
    const contour=[[.9,12.8],[8.3,2.2],[15.8,.9],[24.2,2.1],[31,12.8],[24.7,24.2],[16.1,26],[7.5,24.2]];
    ctx.save();ctx.translate(0,1.1);polygon(ctx,contour,'#647BA5');ctx.restore();
    const face=ctx.createLinearGradient(5,3,24,27);
    face.addColorStop(0,'#F5F3FA');face.addColorStop(1,'#EBEDF6');
    ctx.lineWidth=.85;polygon(ctx,contour,face,'#8398C3');
  }
  ctx.strokeStyle=ink;
  ctx.fillStyle=ink;
  ctx.lineWidth=1.65;
  ctx.lineJoin='round';
  ctx.lineCap='round';
  if(name==='close'){
    ctx.beginPath();ctx.moveTo(12,9);ctx.lineTo(20,17);ctx.moveTo(20,9);ctx.lineTo(12,17);ctx.stroke();
  }else if(name==='copy'){
    polygon(ctx,[[9,6],[18,6],[20,8],[20,16],[9,16]],'#CDDCED',ink);
    polygon(ctx,[[12,9],[21,9],[23,11],[23,19],[12,19]],paper,ink);
  }else if(name==='search'||name==='details'){
    const details=name==='details',x=details?18:14,y=details?14:11;
    if(details){
      polygon(ctx,[[8,5],[18,5],[20,7],[20,17],[8,17]],'#E2EAF6',ink);
      ctx.fillStyle=ink;ctx.fillRect(10,8,6,1.2);
    }
    ctx.beginPath();
    ctx.arc(x,y,4.1,0,Math.PI*2);
    if(details){ctx.fillStyle=paper;ctx.fill();}
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+3,y+3);
    ctx.lineTo(x+7,y+7);
    ctx.stroke();
  }else if(name==='appearance'){
    polygon(ctx,[[12,5],[14,5],[16,8],[18,5],[20,5],[24,9],[21,12],[20,11],[20,19],[12,19],[12,11],[11,12],[8,9]],'#C7D4EC',ink);
  }else if(name==='reroll'){
    ctx.strokeStyle='#3770C1';ctx.lineWidth=2.8;
    ctx.beginPath();
    ctx.arc(16,12,5.5,Math.PI*1.08,Math.PI*1.92);
    ctx.moveTo(21.3,14);
    ctx.arc(16,12,5.5,.37,Math.PI*.89);
    ctx.stroke();
    polygon(ctx,[[18,9],[23,9],[22,4]],'#3770C1');
    polygon(ctx,[[14,15],[9,15],[10,20]],'#3770C1');
  }
  return node;
}

export function albumPhotoMount(){
  const {node,ctx}=canvas(200,235,'zc-photo-mount-art');
  polygon(ctx,[[2,0],[194,0],[200,9],[200,235],[6,235],[0,227]],'#DDD4C4');
  ctx.fillStyle='#AFA499';ctx.fillRect(5,225,183,1);
  polygon(ctx,[[0,25],[25,0],[12,0],[0,12]],'#B39D75');
  polygon(ctx,[[175,235],[200,210],[200,223],[188,235]],'#B39D75');
  return node;
}

export function albumPreviewCorners(){
  const {node,ctx}=canvas(103,112,'zc-preview-corners');
  ctx.strokeStyle='#97651D';ctx.lineWidth=2;
  for(const [x,y,dx,dy] of [[1,1,1,1],[102,1,-1,1],[1,111,1,-1],[102,111,-1,-1]]){
    ctx.beginPath();ctx.moveTo(x+dx*13,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*13);ctx.stroke();
  }
  return node;
}

export function stagePortrait(character,appearance=null,large=false){
  const portrait=document.createElement('span');
  portrait.className='paper-stage-photo paper-portrait';portrait.dataset.paperSurface='flat';
  const print=document.createElement('img');print.src='assets/ui-paper/stage-portrait.webp';print.alt='';
  const scale=large?2:1;
  const {node,ctx}=canvas(94*scale,106*scale,'paper-photo-glyph');
  ctx.scale(scale,scale);
  ctx.translate(47,51);ctx.rotate(-.145);
  const glyph=large?drawAppearanceGlyph(document.createElement('canvas'),character.word,character.tone,appearance,true)
    :appearanceGlyphCanvas(character.word,character.tone,appearance);
  ctx.drawImage(glyph,-34,-34,68,68);
  portrait.append(print,node);portrait.setAttribute('aria-label',character.word);
  return portrait;
}

export function choiceMark(state){
  const {node,ctx}=canvas(34,34,'zx-icon paper-choice-mark');
  node.dataset.icon=state;
  ctx.lineJoin='round';ctx.lineCap='round';
  if(state==='lock'){
    ctx.strokeStyle='#677090';ctx.lineWidth=2.9;
    ctx.beginPath();ctx.moveTo(10.5,15);ctx.lineTo(10.5,11);ctx.arc(17,11,6.5,Math.PI,2*Math.PI);
    ctx.lineTo(23.5,15);ctx.stroke();
    ctx.beginPath();ctx.roundRect(6.5,14,21,15.5,2.4);ctx.fillStyle='#F1F1F8';ctx.fill();ctx.stroke();
    ctx.fillStyle='#677090';ctx.beginPath();ctx.arc(17,20.3,2.2,0,2*Math.PI);ctx.fill();ctx.fillRect(16,20.5,2,4);
  }else if(state==='check'){
    ctx.fillStyle='#AE5D69';ctx.beginPath();ctx.arc(17,17.3,15.6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=paperPalette.tabStart;ctx.beginPath();ctx.arc(17,16.2,15.5,0,Math.PI*2);ctx.fill();
    polygon(ctx,[[7.8,16.2],[11.4,12.7],[15.1,16.8],[22.8,8.9],[26.2,12.5],[15,24.4]],'#F8F5F8');
  }else{
    ctx.beginPath();ctx.arc(17,17,12.1,0,Math.PI*2);ctx.fillStyle=paper;ctx.fill();
    ctx.lineWidth=2.2;ctx.strokeStyle='#647092';ctx.stroke();
  }
  return node;
}

export function titleRibbon(){
  const {node,ctx}=canvas(210,40,'zc-title-ribbon');
  polygon(ctx,[[0,5],[208,2],[196,32],[0,39]],paperPalette.yellow);
  polygon(ctx,[[0,2],[209,0],[200,12],[205,11],[195,32],[0,37]],paperPalette.darkStock);
  return node;
}
export function hudPaperIcon(name,size=22){
  const {node,ctx}=canvas(24,24,'zx-hud-paper-icon');
  node.style.width=size+'px';node.style.height=size+'px';
  const circle=(x,y,r,color)=>{
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  };
  if(name==='clock'){
    circle(12,13,9,'#605195');circle(12,12,7.3,'#CDC4EA');circle(12,12,5.4,'#F4F3F8');
    ctx.fillStyle='#7466A3';ctx.fillRect(10,1,4,3);
    ctx.strokeStyle='#2B2A49';ctx.lineWidth=1.8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(12,8);ctx.lineTo(12,12);ctx.lineTo(15,14);ctx.stroke();
  }else if(name==='coin'){
    circle(12,13,10,'#976A35');circle(12,11,10,'#D1A348');circle(12,11,7.8,'#E0CC84');
    polygon(ctx,[[12,4],[17,11],[12,18],[7,11]],'#A37639');
    polygon(ctx,[[12,6],[15,11],[12,16],[9,11]],'#DDC479');
  }else if(name==='score'){
    polygon(ctx,[[4,1],[11,4],[13,4],[20,1],[17,11],[7,11]],'#C7656D');
    polygon(ctx,[[12,6],[16,10],[22,11],[19,16],[18,22],[12,20],[6,22],[5,16],[2,11],[8,10]],'#A0683E');
    polygon(ctx,[[12,6],[16,10],[20,12],[17,16],[17,20],[12,18],[7,20],[7,16],[4,12],[8,10]],'#D1A348');
    polygon(ctx,[[12,10],[13.7,13.3],[17,14],[13.7,15.1],[12,18],[10.3,15.1],[7,14],[10.3,13.3]],'#F4F3F8');
  }else if(name==='tie'){
    ctx.strokeStyle='#D3747D';ctx.lineCap='round';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(7,21);ctx.lineTo(13,10);
    ctx.bezierCurveTo(7,5,8,1,12,3);ctx.bezierCurveTo(17,6,13,13,12,14);
    ctx.bezierCurveTo(13,8,22,4,22,8);ctx.bezierCurveTo(21,12,16,13,12,14);ctx.stroke();
    circle(10,16,2.7,'#AB5263');
  }else if(name==='pin'){
    polygon(ctx,[[4,9],[7,3],[12,1],[17,3],[20,9],[17,15],[12,22],[7,15]],paper);
    circle(12,9,3.3,'#BC5B68');
  }else if(name==='pause'){
    ctx.fillStyle=ink;
    ctx.fillRect(6,5,4.5,15);ctx.fillRect(14,5,4.5,15);
  }
  return node;
}
