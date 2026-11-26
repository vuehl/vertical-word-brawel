import {paintPaperWaves as blueWaves,paintPhotoWaves,paperPalette} from '../source/src/ui/paper-shapes.js';
import {qualityPaper,upgradeStocks,choiceGlows} from '../source/src/ui/choice-presentation.js';
const white=paperPalette.paper;

function gradient(ctx,w,h,top,bottom){
  const color=ctx.createLinearGradient(0,0,w,h);
  color.addColorStop(0,top);
  color.addColorStop(1,bottom);
  return color;
}

function cut(ctx,x,y,w,h,c,fill){
  const r=x+w,b=y+h,k=Math.min(c,h/2,w/2);
  ctx.beginPath();
  ctx.moveTo(x+k,y);ctx.lineTo(r-k,y);ctx.lineTo(r,y+k);ctx.lineTo(r,b-k);
  ctx.lineTo(r-k,b);ctx.lineTo(x+k,b);ctx.lineTo(x,b-k);ctx.lineTo(x,y+k);
  ctx.closePath();
  ctx.fillStyle=fill;
  ctx.fill();
}

function folded(ctx,w,h,{edge,top,bottom,corner=8,rim=2}){
  cut(ctx,0,2,w,h-2,corner,'#1C223E90');
  cut(ctx,0,0,w,h-2,corner,edge);
  cut(ctx,rim,rim,w-2*rim,h-4-rim,corner-rim,
    gradient(ctx,w,h,top,bottom));
}

function poly(ctx,p,color){ctx.beginPath();ctx.moveTo(...p[0]);for(const a of p.slice(1))ctx.lineTo(...a);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function choiceGlow(ctx,w,h,quality,unavailable=false){
  const [rim,glow]=unavailable?['#AFA9B5','#77717E']:choiceGlows[quality]||choiceGlows.special;
  ctx.save();
  // Layered strokes keep the soft edge consistent at every Canvas pixel ratio.
  ctx.strokeStyle='#160F2040';ctx.lineWidth=6;ctx.strokeRect(0,3,w,h);
  for(const [width,alpha] of [[18,'06'],[14,'0A'],[10,'12'],[6,'26'],[3,'70']]){
    ctx.strokeStyle=glow+alpha;ctx.lineWidth=width;ctx.strokeRect(0,0,w,h);
  }
  ctx.strokeStyle=rim;ctx.lineWidth=1.25;ctx.strokeRect(-.6,-.6,w+1.2,h+1.2);
  ctx.restore();
}
function mountedPaper(ctx,w,h,footer=false){
  const c=footer?13:11;
  cut(ctx,0,2,w,h-2,c,'#5D77AF');
  cut(ctx,0,0,w,h-3,c,gradient(ctx,w,h,'#B9D0ED','#6C9BDA'));
  cut(ctx,footer?5:2,footer?5:7,w-(footer?10:4),h-(footer?13:16),c-3,gradient(ctx,w,h,'#F4F3F8','#F0F0F7'));
  poly(ctx,[[0,h-c-3],[c+6,h-9],[c+13,h-3],[c,h-3]],'#9EBCE7');
  poly(ctx,[[w-c-11,h-3],[w-c-4,h-9],[w,h-c-3],[w-c,h-3]],'#5283D0');
}
function postcard(ctx,w,h,captionSpace=14){
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-.055);ctx.translate(-w/2,-h/2);
  cut(ctx,1,3,w-2,h-3,1,'#98B1D8');cut(ctx,0,0,w-2,h-4,1,white);
  const imageHeight=Math.max(1,h-captionSpace);
  ctx.fillStyle=gradient(ctx,w,h,'#E6EEF9','#C9E3F2');ctx.fillRect(4,4,w-10,imageHeight);
  ctx.save();ctx.translate(4,4);paintPhotoWaves(ctx,w-10,imageHeight,'#4185CA','#A8CCE9');ctx.restore();ctx.restore();
}



export function drawUiPaper(ctx,box){
  const {x,y,w,h,el}=box;
  const has=name=>el.classList?.contains(name);
  let key=el.dataset?.paperSurface;
  // The native renderer consumes the same semantic roles on every page.
  // Explicit battle/library surfaces take precedence over generic controls.
  if(!key){
    if(has('zc-search-button'))key='flat';
    else if(has('screen')&&has('zx'))key='menu-background';
    else if(has('paper-portrait')&&!el.parentElement?.classList.contains('zx-home-types')&&!el.parentElement?.parentElement?.classList.contains('zx-home-types'))key='postcard';
    else if(has('zc-appearance-hero')||has('zc-unlock-hero'))key='flat';
    else if(has('paper-info-hero')||has('zx-wallet'))key='info-slip';
    else if(has('zx-map-card'))key='map-print';
    else if(has('zx-lock'))key='stage-row';
    else if(has('zx-map-badge'))key='station-label';
    else if(el.parentElement?.classList.contains('paper-joint'))key='paper-binding';
    else if(has('zx-home-dock'))key='home-dock';
    else if(box.tag==='h2'&&el.parentElement?.classList.contains('zx-home-copy'))key='heading-strip';
    else if(has('zx-card')&&el.parentElement?.parentElement?.classList.contains('zx-lab'))key='flat';
    else if(has('zx-mini-slot'))key='supply';
    else if(has('zx-tab')||has('zx-subtab')||has('zc-filter'))key='filter';
    else if(has('zx-quality-card'))key='upgrade-card';
    else if((has('paper-action')||has('zx-button')||has('zx-review-button'))&&!has('zc-character')&&!has('zc-look')&&!has('zc-text')&&!has('zx-plain')&&!has('zx-review-companion-select')&&!has('zx-difficulty'))key='button';
    else if(has('zx-header')&&!el.parentElement?.classList.contains('zc-library'))key='header';
    else if(has('zx-modal')&&!has('zx-first-batch-upgrade'))key='sheet';
    else if(has('zx-body')&&!el.parentElement?.classList.contains('zc-library'))key='sheet';
    else if(has('zx-footer')&&!has('paper-single-back')&&!el.parentElement?.classList.contains('zc-library'))key='footer';
    else if(['zx-card','zc-panel','zx-difficulty','zx-choice','zc-look','zx-review-companion','zx-review-reward','zx-review-empty','zx-home-dock'].some(has))key='card';
  }
  // HUD cell faces use the same CSS paint on web and native, including empty and overflow slots.
  if(!key||key==='hud-cell')return false;
  const [edge,top,bottom,accent,badge]=qualityPaper[el.dataset.quality]||qualityPaper.special;
  ctx.save();
  ctx.translate(x,y);
  if(has('zx-glowing-choice'))choiceGlow(ctx,w,h,el.dataset.quality,
    el.disabled||el.dataset.unavailable==='true'||el.getAttribute('aria-disabled')==='true'||has('unavailable'));
  switch(key){
    case 'journal-cover':
      ctx.fillStyle='#38343D';ctx.fillRect(0,0,w,h);
      poly(ctx,[[w*.73,0],[w,0],[w,h*.18],[w*.81,h*.13]],'#423D46');
      break;
    case 'journal-button':
      poly(ctx,[[3,0],[w,0],[w-3,h],[0,h]],el.disabled?'#B6B0AB':paperPalette.yellow);break;
    case 'atlas-sheet':
      poly(ctx,[[0,0],[w-3,0],[w,h],[3,h]],'#E9E2D1');break;
    case 'atlas-heading':
      ctx.fillStyle='#A89D88';for(let i=5;i<w-5;i+=5)ctx.fillRect(i,h-1,3,1);break;
    case 'atlas-zone':
      poly(ctx,[[3,0],[w,0],[w-3,h],[0,h]],'#302A31');break;
    case 'album-filter':
      if(el.getAttribute('aria-pressed')==='true'){
        poly(ctx,[[4,0],[w,0],[w-10,h],[0,h]],paperPalette.yellow);
      }
      break;
    case 'bound-index': {
      const edge=w-2;
      ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(edge,0);
      ctx.lineTo(edge,h);ctx.lineTo(0,h);ctx.closePath();
      ctx.fillStyle=(has('route-binding')||has('selection-binding'))?'#FBF5E8':'#F1EBDF';ctx.fill();
      ctx.strokeStyle='#79746F';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(8,6);ctx.lineTo(19,4);ctx.moveTo(w-36,4);ctx.lineTo(w-24,5);ctx.stroke();
      break;
    }
    case 'profile-switch':{
      const on=el.getAttribute('aria-pressed')==='true';
      ctx.fillStyle=on?paperPalette.yellow:'#57535E';ctx.fillRect(1,1,w-2,h-2);
      if(on){ctx.strokeStyle=paperPalette.darkStock;ctx.strokeRect(4,4,w-8,h-8);}
      break;
    }
    case 'flat':break;
    case 'destination-ribbon':
      poly(ctx,[[0,0],[w,0],[w-8,h],[0,h]],paperPalette.darkStock);break;
    case 'difficulty-segment': {
      const on=el.getAttribute('aria-pressed')==='true';
      if(on)cut(ctx,1,2,w-2,h-4,2,'#EFC554');
      else{ctx.fillStyle='#C4B9AB';ctx.fillRect(0,h*.30,1,h*.40);}
      break;
    }
    case 'destination-cover':
      cut(ctx,0,0,w,h,5,'#EEE8DC');break;
    case 'route-station':
    case 'route-mode': {
      const station=key==='route-station',selected=el.getAttribute('aria-pressed')==='true',k=station?4:5;
      const edge=selected?(station?'#6090C5':'#6790BD'):(station?'#93A6BF':'#C0CDDF');
      const color=station?(selected?'#DCE7F5':'#F3F1FA'):(selected?'#E1EBF6':'#E9EDF5');
      cut(ctx,0,2,w,h-2,k,edge);cut(ctx,0,0,w,h-3,k,color);
      if(selected&&!station){ctx.fillStyle='#3D6CA8';ctx.fillRect(1,7,3,h-18);}
      break;
    }
    case 'unlock-record': {
      cut(ctx,1,4,w-1,h-4,8,'#7189A9');
      cut(ctx,0,0,w,h-4,8,'#F3F1FA');
      // The short folded index is printed into the paper, above the challenge.
      poly(ctx,[[0,16],[92,16],[85,30],[92,44],[0,44]],'#D6E2F1');
      poly(ctx,[[0,44],[8,44],[8,48]],'#94AAC5');
      for(let i=0;i<3;i++){
        const x=w-47+i*9;
        poly(ctx,[[x,15],[x+5,15],[x+1,21],[x-4,21]],i===1?'#B67B85':'#A7BBD1');
      }
      break;
    }
    case 'station-index-row':
      ctx.fillStyle='#E7E1D7';ctx.fillRect(0,1,w,h-3);
      break;
    case 'journey-stations':
      ctx.fillStyle='#847B76';for(let x=83;x<w-4;x+=4)ctx.fillRect(x,10,1.5,1.5);
      break;
    case 'trade-action': {
      const primary=has('primary')||has('armed');
      const fill=el.disabled?'#C9C2C6':primary?'#F1C654':'#2B262E';
      const inset=has('zx-shop-action')||has('zx-fuse-action')?6:2;
      poly(ctx,[[5,inset],[w,inset],[w-5,h-inset],[0,h-inset]],fill);break;
    }
    case 'short-ink':
      poly(ctx,[[0,0],[w,0],[w,h-10],[w-10,h],[0,h]],'#2B262E');break;
    case 'shop-ledger':
      ctx.fillStyle='#2B262E';ctx.fillRect(0,0,w,h);break;
    case 'shop-index-tab':
      if(el.getAttribute('aria-pressed')==='true')poly(ctx,[[5,3],[w-2,3],[w-6,h-3],[1,h-3]],'#F1C654');
      break;
    case 'record-paper': {
      const selected=has('selected'),unavailable=el.disabled||el.dataset.unavailable==='true';
      ctx.fillStyle='#2B262E';ctx.fillRect(0,0,w,h);
      ctx.fillStyle=unavailable?'#D3CED0':selected?'#F6D57B':'#EEE8DA';
      ctx.fillRect(2,2,w-4,h-4);break;
    }
    case 'arrival-heading':
      poly(ctx,[[0,10],[w,3],[w-8,h-10],[0,h-4]],'#322B34');break;
    case 'arrival-letter':
      poly(ctx,[[2,42],[w*.45,8],[w-6,40],[w-4,h-7],[8,h-2]],'#C9B58B');
      poly(ctx,[[14,9],[w-20,4],[w-14,h-36],[20,h-27]],'#F6ECD2');
      poly(ctx,[[2,42],[w*.49,65],[w-6,40],[w-4,h-7],[8,h-2]],'#DFCC9F');
      poly(ctx,[[2,42],[w*.49,62],[w-6,40],[w*.50,71]],'#F7E8C1');break;
    case 'arrival-flag':
      poly(ctx,[[0,1],[w,1],[w-5,h-1],[0,h-1]],'#EFC554');break;
    case 'companion-slip':
      ctx.fillStyle='#2B262E';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#EEE8DA';ctx.fillRect(2,2,w-4,h-4);
      poly(ctx,[[2,2],[84,2],[72,h-2],[2,h-2]],'#DCCDAF');break;
    case 'shop-offer': {
      const [stock,print]=upgradeStocks[el.dataset.quality]||upgradeStocks.common;
      ctx.fillStyle='#2B262E';ctx.fillRect(0,0,w,h);ctx.fillStyle=stock;ctx.fillRect(2,2,w-4,h-4);
      ctx.fillStyle=print;ctx.fillRect(2,2,Math.round(w*.23),h-4);break;
    }
    case 'item-offer':
      cut(ctx,0,3,w,h-3,4,'#483F48');cut(ctx,0,0,w,h-4,4,top);
      poly(ctx,[[0,5],[5,0],[70,0],[60,h-4],[5,h-4],[0,h-9]],bottom);
      poly(ctx,[[0,5],[5,0],[10,0],[7,h-4],[5,h-4],[0,h-9]],accent);break;
    case 'scene-bulletin': {
      poly(ctx,[[4,1],[w-1,0],[w-8,h-3],[0,h]],'#302A33');
      poly(ctx,[[4,1],[9,1],[5,h],[0,h]],'#EFC554');break;
    }
    case 'ultimate-call': {
      const shape=[[0,6],[8,0],[w-12,0],[w,h*.5],[w-16,h-5],[7,h-3],[0,h-11]];
      ctx.save();ctx.translate(0,3);poly(ctx,shape,'#7894BE');ctx.restore();poly(ctx,shape,'#344967');
      poly(ctx,[[0,6],[8,0],[49,0],[43,h-3],[7,h-3],[0,h-11]],'#D5E2F0');
      poly(ctx,[[w-43,0],[w-25,0],[w-30,5],[w-49,5]],'#CB8595');
      poly(ctx,[[w-10,8],[w-1,h*.5],[w-15,h-6],[w-23,h-6],[w-9,h*.5],[w-15,11]],'#526D90');
      const x=w-24,y=h*.5;poly(ctx,[[x-5,y],[x-1,y-1],[x,y-6],[x+2,y-1],[x+6,y],[x+1,y+2],[x,y+6],[x-1,y+2]],'#BBD0E8');break;
    }
    case 'fusion-slip':
      ctx.fillStyle='#2B262E';ctx.fillRect(0,0,w,h);ctx.fillStyle=has('unavailable')?'#DAD6D8':'#FAE8AD';ctx.fillRect(2,2,w-4,h-4);break;
    case 'fusion-plus':
      poly(ctx,[[5,1],[8,1],[7,4],[11,4],[10,7],[7,7],[6,11],[3,11],[4,7],[1,7],[2,4],[5,4]],'#63564C');break;
    case 'fusion-rail': {
      ctx.fillStyle=has('unavailable')?'#B8B3BA':'#EAC255';ctx.fillRect(0,0,w,h);
      poly(ctx,[[0,h*.68],[w,h*.32],[w,h*.48],[0,h*.84]],has('unavailable')?'#C5C0C6':'#F3D177');break;
    }
    case 'scene-action':
      ctx.translate(w/2,h/2);ctx.rotate(-Math.PI/60);ctx.translate(-w/2,-h/2);
      // Support the fingerprint cut-outs on a dark ink backing, even over bright terrain.
      poly(ctx,[[4,5],[w-7,3],[w-1,7],[w-3,h-3],[5,h-1],[1,h-6]],'#29242D');
      poly(ctx,[[5,5],[w-6,4],[w-5,h-8],[4,h-7]],'#635137');
      break;
    case 'album-page':
    case 'move-paper':
      cut(ctx,0,2,w,h-2,7,'#819CBB');
      cut(ctx,0,0,w,h-3,7,'#F3F1FA');
      break;
    case 'plan-sheet': {
      // Keep the notebook margin on a sheet with a continuous straight edge.
      ctx.fillStyle='#938B80';ctx.fillRect(0,3,w,h-3);
      ctx.fillStyle='#F1EBDF';ctx.fillRect(0,0,w,h-3);
      ctx.fillStyle='#D8B651';ctx.fillRect(11,10,1,h-23);
      ctx.fillStyle='#A7B9D1';
      for(let y=29;y<h-12;y+=76){ctx.beginPath();ctx.arc(6,y,1.7,0,Math.PI*2);ctx.fill();}
      break;
    }
    case 'lab-balance':
      ctx.fillStyle='#302B33';ctx.fillRect(0,0,w,h);
      poly(ctx,[[0,0],[72,0],[60,h],[0,h]],'#443C41');
      break;
    case 'lab-price': {
      const poor=el.dataset.poor==='true',height=Math.min(h-3,34),top=Math.floor((h-height)/2);
      poly(ctx,[[4,top],[w,top],[w-4,top+height],[0,top+height]],poor?'#D8D0C5':paperPalette.yellow);
      break;
    }
    case 'move-stamp': {
      ctx.fillStyle='#DED5C6';ctx.fillRect(0,0,w,h);
      break;
    }
    case 'heading-strip':
      poly(ctx,[[-12,h-7],[w+12,h-7],[w+3,h+3],[-20,h+3]],'#CDDBF3');break;
    case 'dialog-title': {
      const length=Math.min(w-8,Math.max(76,el.textContent.length*19+19)),left=(w-length)/2;
      poly(ctx,[[left,h*.64],[left+length,h*.64],[left+length-9,h*.92],[left-6,h*.92]],'#DBE5F4');
      break;}
    case 'menu-background':
      ctx.fillStyle=has('paper-menu-page')?paperPalette.navy:gradient(ctx,w,h,'#312F52','#20223A');ctx.fillRect(0,0,w,h);
      if(has('paper-menu-page'))break;
      poly(ctx,[[w*.4,h],[w,h-34],[w,h]],'#416DB1');
      poly(ctx,[[w*.72,h],[w,h-34],[w,h-15]],'#6894D9');
      break;
    case 'postcard':postcard(ctx,w,h);break;
    case 'info-slip': {
      const wallet=has('zx-wallet'),photo=el.firstElementChild?.classList?.contains('paper-portrait');
      const inset=photo?Math.min(15,h*.13):2,left=photo?9:0;
      cut(ctx,left+3,inset+5,w-left-3,h-inset*2,9,'#4975BF');
      cut(ctx,left,inset,w-left-4,h-inset*2,6,wallet?'#658ACB':'#BECDE9');
      cut(ctx,left+1,inset+1,w-left-7,h-inset*2-4,5,gradient(ctx,w,h,wallet?'#5A85C4':white,wallet?'#354F91':'#EBEEF8'));
      break;}
    case 'map-print':
      cut(ctx,2,4,w-2,h-4,15,'#8E98BA');
      cut(ctx,0,0,w-2,h-4,14,gradient(ctx,w,h,'#8FB5E3','#336BCC'));
      cut(ctx,5,4,w-12,h-15,10,gradient(ctx,w,h,white,'#EFEEF7'));
      break;
    case 'stage-row':
      cut(ctx,1,2,w-1,h-2,8,'#B4B7CA');
      cut(ctx,0,0,w-1,h-3,8,gradient(ctx,w,h,white,'#EFEFF6'));
      break;
    case 'station-label':
      poly(ctx,[[6,4],[w,4],[w-6,h],[0,h]],'#587DAF');
      poly(ctx,[[6,1],[w-1,1],[w-7,h-4],[0,h-3]],gradient(ctx,w,h,'#EAF0FA','#C4D5EE'));
      break;
    case 'stage-slip': {
      const l=w*.15,r=w-2;
      poly(ctx,[[l,15],[r-9,13],[r,21],[r-10,h-10],[r-21,h-3],[l+3,h-4]],'#4D75AF');
      poly(ctx,[[l,12],[r-11,10],[r-2,18],[r-12,h-12],[r-23,h-5],[l+1,h-6]],gradient(ctx,w,h,'#A9C7E9','#467DC3'));
      poly(ctx,[[l,12],[r-16,11],[r-9,17],[r-19,h-22],[r-27,h-15],[l,h-12]],gradient(ctx,w,h,white,'#ECEBF5'));
      break;}
    case 'difficulty-option': {
      const chosen=has('on'),locked=el.disabled;
      const outline=chosen?'#467EC5':locked?'#AFB2C9':'#CACADA';
      cut(ctx,.5,2,w-1,h-2,10,chosen?'#3F65A2':'#ABAEC5');
      cut(ctx,0,0,w-1,h-2,10,outline);
      const inset=chosen?2:1;
      cut(ctx,inset,inset,w-1-inset*2,h-(chosen?6:4),10-inset,
        gradient(ctx,w,h,chosen?'#DCECF7':locked?'#EEEDF6':white,chosen?'#C4DCF0':locked?'#E2E3F1':'#EEEDF6'));
      break;}
    case 'paper-binding': {
      const red=ctx.createLinearGradient(0,0,0,h);
      red.addColorStop(0,'#A95B68');red.addColorStop(.12,'#DE8990');red.addColorStop(.67,'#D37980');red.addColorStop(1,'#AB5664');
      cut(ctx,0,1,w,h-1,1.5,'#874757');
      cut(ctx,.5,0,w-1,h-2,1.4,red);
      break;}
    case 'role-label':
      poly(ctx,[[8,0],[w-2,0],[w-8,h],[2,h]],'#D3DDF4');
      break;
    case 'home-dock':
      folded(ctx,w,h,{edge:'#71A1DB',top:white,bottom:'#EDEDF8',corner:17,rim:7});
      poly(ctx,[[0,17],[7,20],[7,h-21],[17,h-7],[20,h],[0,h-17]],'#C9DEF1');
      for(const left of [w*.1,w*.88]){ctx.fillStyle='#8F3F52';ctx.fillRect(left,-13,12,30);ctx.fillStyle=gradient(ctx,12,30,'#E08589','#C95665');ctx.fillRect(left,-15,12,29);ctx.fillStyle='#EFBFC2';ctx.fillRect(left+1,-15,10,2);}
      break;
    case 'button-muted':
    case 'button': {
      if(['journey','collection-next','enter'].includes(el.dataset.action)&&!el.disabled){
        const face=[[w*.095,h*.17],[w-8,0],[w-25,h*.85],[2,h-4]];
        ctx.save();ctx.translate(0,4);poly(ctx,face,paperPalette.darkStock);ctx.restore();poly(ctx,face,paperPalette.yellow);
        break;
      }
      const primary=has('primary')||has('zc-primary')||has('purple')||has('zx-buy');
      const coral=has('danger');
      const colors=key==='button-muted'?['#C5D3E6','#C5D3E6','#8399B9']:coral?['#E08188','#C95968','#A14559']:primary?[paperPalette.blueStart,paperPalette.blueEnd,'#435BAC']:[white,'#EFEFF9','#4F89D3'];
      // One thin perimeter and one shallow folded lower edge. The front face
      // remains square; no bevelled side panels or bright cyan substitute.
      cut(ctx,0,3,w,h-3,5,colors[2]);
      cut(ctx,0,0,w,h-3,5,primary||coral?'#D7E5F5':'#5989D6');
      const face=ctx.createLinearGradient(0,0,0,h);face.addColorStop(0,colors[0]);face.addColorStop(1,colors[1]);
      cut(ctx,.8,.8,w-1.6,h-5,4.4,face);
      ctx.fillStyle=primary||coral?'#B0CCEB':'#D9E3F6';ctx.fillRect(6,h-5,w-12,1);
      poly(ctx,[[.8,h-8],[5,h-4],[w-5,h-4],[w-.8,h-8],[w-5,h-2],[5,h-2]],primary||coral?colors[2]:'#90BAE3');
      break;
    }
    case 'header':{
      ctx.save();ctx.translate(w*.37,-12);blueWaves(ctx,w*.66,h+12);ctx.restore();
      const len=el.querySelector('h1')?.textContent.length||4,flag=Math.min(w-34,Math.max(148,len*25+36));
      poly(ctx,[[-10,14],[flag,14],[flag-14,33],[flag,51],[-10,51]],'#924353');
      poly(ctx,[[-10,10],[flag,10],[flag-14,29],[flag,47],[-10,47]],gradient(ctx,w,h,'#DE7B83','#C95967'));
      break;}
    case 'sheet': {
      const inset=has('paper-mounted-body')?Math.max(0,(parseFloat(box.s.vars['--mount-inset'])||0)-(el._scroll||0)):0;
      ctx.translate(0,inset);mountedPaper(ctx,w,h-inset);
      break;}
    case 'footer':
      mountedPaper(ctx,w,h,true);
      break;
    case 'card':
      cut(ctx,0,2,w,h-2,5,has('on')||has('selected')?'#397ACE':'#B2BDD8');
      cut(ctx,1,1,w-2,h-5,4,gradient(ctx,w,h,white,'#EBEDF9'));
      break;
    case 'look-photo':
      postcard(ctx,w,h-1,37);
      if(has('selected')){ctx.fillStyle='#417CCF';ctx.fillRect(5,h-4,w-11,2);}
      break;
    case 'library':
      mountedPaper(ctx,w,h);
      break;
    case 'selection':
      mountedPaper(ctx,w,h,true);
      break;
    case 'progress':
      cut(ctx,3,3,w-3,h-3,7,'#5C86CC');
      cut(ctx,1,0,w-5,h-5,4,'#BCCAE7');
      cut(ctx,2,1,w-7,h-7,3,gradient(ctx,w,h,white,'#ECEEF7'));
      break;
    case 'filter': {
      // Compact bookmarks have the same folded face and full-size touch area.
      const inset=has('zc-filter')&&el.parentElement?.parentElement?.classList.contains('zc-library-paper')?5:0;
      const active=has('active')||has('on'),corner=1;
      cut(ctx,0,4+inset,w,h-6-2*inset,corner,active?'#A75768':'#A6B9DD');
      cut(ctx,0,1+inset,w,h-6-2*inset,corner,gradient(ctx,w,h,active?paperPalette.tabStart:'#E0E7F5',active?paperPalette.tabEnd:'#CFD9EF'));
      break;}
    case 'upgrade-reroll':
      poly(ctx,[[5,1],[w,1],[w-5,h-1],[0,h-1]],el.disabled?'#524D54':paperPalette.darkStock);
      break;
    case 'level-offer': {
      const [face]=upgradeStocks[el.dataset.quality]||upgradeStocks.special;
      ctx.fillStyle='#29262C';ctx.fillRect(0,0,w,h);ctx.fillStyle=face;ctx.fillRect(2,2,w-4,h-4);break;
    }
    case 'level-art': {
      const [face,band]=upgradeStocks[el.dataset.quality]||upgradeStocks.special;
      ctx.fillStyle=band;ctx.fillRect(0,0,w,h);
      ctx.globalAlpha*=.36;poly(ctx,[[w*.65,0],[w,0],[w*.37,h],[0,h]],face);break;
    }
    case 'altar-value':
      poly(ctx,[[9,0],[w,0],[w,h],[0,h]],'#2B262E');break;
    case 'level-title':
      poly(ctx,[[0,0],[w,0],[w-14,h],[0,h]],'#2B262E');break;
     case 'upgrade-card': {
      cut(ctx,0,3,w,h-3,4,'#322C36');cut(ctx,0,0,w,h-4,4,'#F3EEE4');
      poly(ctx,[[0,4],[4,0],[9,0],[7,h-4],[0,h-4]],accent);
      poly(ctx,[[w-15,0],[w-4,0],[w,4],[w,14]],bottom);
      ctx.fillStyle=edge;ctx.fillRect(9,h-5,w-16,1);break;
    }
    case 'rarity': {
      const rarity=el.dataset.quality;
      const ribbon=rarity==='legendary'?'#B25C3E':rarity==='common'?'#6C778D':badge;
      const fold=rarity==='legendary'?'#8E4535':rarity==='common'?'#525B6F':edge;
      ctx.beginPath();
      ctx.moveTo(0,7);ctx.lineTo(6,2);ctx.lineTo(w-1,0);
      ctx.lineTo(w-1,h-6);ctx.lineTo(w-6,h-1);ctx.lineTo(2,h-1);
      ctx.closePath();ctx.fillStyle=gradient(ctx,w,h,ribbon,fold);ctx.fill();
      ctx.beginPath();ctx.moveTo(w-6,h-1);ctx.lineTo(w-6,h-6);ctx.lineTo(w-1,h-6);
      ctx.closePath();ctx.fillStyle='#27264836';ctx.fill();
      break;
    }
    case 'location': {
      const joint=w-70;
      cut(ctx,0,2,w,h-2,6,'#334363');
      poly(ctx,[[0,5],[6,0],[joint+6,0],[joint-1,h-4],[5,h-4],[0,h-8]],gradient(ctx,w,h,'#AA606F','#915063'));
      poly(ctx,[[joint+7,0],[w-5,0],[w,5],[w,h-8],[w-5,h-4],[joint,h-4]],'#E6EAF3');
      break;
    }
    case 'boss-strip':
      cut(ctx,0,2,w,h-2,7,'#354157');
      cut(ctx,0,0,w,h-3,4,'rgba(40,35,45,.94)');
      poly(ctx,[[0,7],[7,0],[15,0],[6,9],[6,h-12],[0,h-6]],box.s.vars?.['--boss-accent']||'#C28190');
      break;
    case 'boss-seal':
      cut(ctx,0,1,w,h-1,6,box.s.vars?.['--boss-seal-edge']||'#9C6177');
      cut(ctx,1,0,w-2,h-3,5,box.s.vars?.['--boss-accent']||'#DEC3CF');
      cut(ctx,3,2,w-6,h-7,4,box.s.vars?.['--boss-seal-face']||'#F0DEE6');
      break;
    case 'guide-seal': {
      const r=Math.min(w,h)/2;
      ctx.fillStyle='#302A32';ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#F3E8CD';ctx.beginPath();ctx.arc(w/2,h/2,Math.max(0,r-2),0,Math.PI*2);ctx.fill();break;
    }
    case 'guide-distance':
      poly(ctx,[[3,0],[w,0],[w-3,h],[0,h]],'#302A32');break;
    case 'arcade': {
      cut(ctx,2,5,w-2,h-5,12,'#384967');
      cut(ctx,0,0,w-3,h-5,12,gradient(ctx,w,h,'#BFD0E4','#8FAAC8'));
      cut(ctx,4,3,w-11,48,8,'#4A6689');
      cut(ctx,6,4,w-15,42,7,gradient(ctx,w,48,'#55769E','#425A80'));
      for(const x of [11,w-17]){
        ctx.fillStyle='#CAD9E8';ctx.fillRect(x,23,4,4);
        ctx.fillStyle='#8198B7';ctx.fillRect(x,24,3,1);
      }
      cut(ctx,9,h-66,w-21,57,6,'#7892AE');
      break;
    }
    case 'portrait-strap':
      ctx.fillStyle='#485C81';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#96ACCD';ctx.fillRect(1,0,w-3,h);
      break;
    case 'profile':
      cut(ctx,0,4,w,h-4,8,'#536887');
      cut(ctx,0,1,w-2,h-4,7,'#B5C9DF');
      cut(ctx,1,0,w-4,h-5,6,gradient(ctx,w,h,'#F3F1FA','#E7ECF5'));
      poly(ctx,[[w-17,0],[w-9,0],[w-4,5],[w-4,13]],'#CDD9E8');
      break;
    case 'level':
      cut(ctx,0,2,w,h-2,5,'#354561');
      cut(ctx,0,0,w,h-3,5,gradient(ctx,w,h,'#627FA8','#506B98'));
      break;
    case 'hud-tag': {
      const pause=el.classList.contains('zx-hud-pause');
      if(pause){
        cut(ctx,4,4,w-8,h-7,9,'#435579');
        cut(ctx,4,2,w-8,h-8,9,'#A2B6D5');
        cut(ctx,5,2,w-10,h-11,8,gradient(ctx,w,h,'#F3F1FA','#DEE7F2'));
      }else{
        const face=Math.min(27,h-4),y=(h-face)/2;
        cut(ctx,7,y+2,w-7,face,5,'#516383');
        cut(ctx,7,y,w-8,face,5,gradient(ctx,w,h,'#F3F1FA','#E8ECF6'));
        poly(ctx,[[w-10,y+face],[w-1,y+face-9],[w-1,y+face-5],[w-6,y+face]],'#BECCE0');
      }
      break;
    }
    case 'supply':
      cut(ctx,0,2,w-1,h-2,4,'#BDCDDE');
      cut(ctx,0,1,w-1,h-3,4,'#E2EAF2');
      break;
    case 'skill':
      folded(ctx,w,h,{edge:'#5A73A3',top:white,bottom:'#EBEEF6',corner:10,rim:2});
      break;
    default:
      ctx.restore();
      return false;
  }
  ctx.restore();
  return true;
}
