import {paintPaperWaves as blueWaves,paintPhotoWaves,paperPalette} from '../source/src/ui/paper-shapes.js';
import {qualityPaper} from '../source/src/ui/choice-presentation.js';
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
  switch(key){
    case 'flat':break;
    case 'destination-ribbon':
      poly(ctx,[[0,3],[w-1,3],[w-8,h/2+1],[w-2,h],[0,h]],'#6A5368');
      poly(ctx,[[0,0],[w,0],[w-8,h/2],[w-2,h-3],[0,h-3]],'#A05C6D');break;
    case 'destination-cover':
      cut(ctx,4,5,w-4,h-5,9,'#6787A9');cut(ctx,0,0,w-3,h-6,7,'#EDF0F7');
      poly(ctx,[[w-43,h-6],[w-21,h-6],[w-9,h-17],[w-25,h-17]],'#B0C5DA');
      break;
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
      ctx.fillStyle='#CFD9E5';ctx.fillRect(9,h-1,w-18,1);
      break;
    case 'journey-stations':
      cut(ctx,0,2,w,h-2,5,'#A4B6CA');
      cut(ctx,0,0,w,h-3,5,'#EEF1F6');
      poly(ctx,[[0,5],[5,0],[89,0],[81,20],[0,20]],'#D4DFEC');
      ctx.fillStyle='#859EBB';ctx.fillRect(8,6,3,9);
      break;
    case 'shop-ledger': {
      // Cloth spine, paper fore-edge and the dark balance stub of a pocket ledger.
      cut(ctx,0,3,w,h-3,5,'#536681');
      cut(ctx,0,0,w,h-4,5,'#384D68');
      poly(ctx,[[13,2],[w-82,2],[w-91,h-7],[13,h-7]],'#DAE3EC');
      ctx.fillStyle='#99AEC3';ctx.fillRect(11,3,2,h-10);
      for(const y of [12,h-16]){
        cut(ctx,4,y,12,3,1,'#B3C2CF');
      }
      break;
    }
    case 'shop-index-tab': {
      const selected=el.getAttribute('aria-pressed')==='true';
      if(selected){
        poly(ctx,[[0,5],[5,0],[w-4,0],[w,4],[w,h-2],[0,h-2]],'#A46978');
        poly(ctx,[[0,5],[5,0],[w-4,0],[w,4],[w,h-6],[0,h-6]],'#F0DFE1');
        poly(ctx,[[w-13,0],[w-4,0],[w,4],[w,9]],'#D0A0AA');
      }else{
        ctx.fillStyle='#ACBBCB';ctx.fillRect(w-1,8,1,h-17);
      }
      break;
    }
    case 'arrival-heading': {
      const wash=ctx.createLinearGradient(0,0,w,0);
      wash.addColorStop(0,'rgba(51,76,101,0)');
      wash.addColorStop(.26,'rgba(51,76,101,.93)');
      wash.addColorStop(.7,'rgba(51,76,101,.84)');
      wash.addColorStop(1,'rgba(51,76,101,0)');
      poly(ctx,[[0,19],[w,8],[w-9,h-20],[0,h-9]],wash);
      break;
    }
    case 'arrival-letter': {
      // A glyph print tucked into an open envelope. Its silhouette has no button rim.
      poly(ctx,[[2,46],[45,12],[91,43],[96,99],[10,107]],'#829BB6');
      poly(ctx,[[4,46],[45,16],[89,44],[87,91],[12,100]],'#CBD9E8');
      poly(ctx,[[17,10],[78,3],[86,81],[25,90]],'#97ADC8');
      poly(ctx,[[15,7],[76,0],[84,78],[23,86]],'#F3F1FA');
      poly(ctx,[[20,12],[72,6],[79,67],[27,73]],'#D4E6EF');
      poly(ctx,[[3,46],[47,69],[92,42],[96,99],[10,106]],'#9FBAD4');
      poly(ctx,[[10,106],[38,71],[49,74],[67,62],[96,99]],'#BFD2E4');
      poly(ctx,[[3,46],[47,65],[92,42],[50,75],[43,75]],'#DDE7F0');
      poly(ctx,[[40,65],[51,64],[53,76],[44,78]],'#B76678');
      break;
    }
    case 'arrival-flag':
      poly(ctx,[[0,1],[w,1],[w-5,h/2],[w,h-1],[0,h-1]],'#DCC1C7');break;
    case 'companion-slip': {
      cut(ctx,0,3,w,h-3,8,'#8A9EB9');
      cut(ctx,0,0,w,h-4,8,'#EBEEF6');
      poly(ctx,[[0,8],[8,0],[86,0],[76,h-4],[8,h-4],[0,h-12]],'#B3C8DF');
      poly(ctx,[[w-38,0],[w-26,0],[w-33,7],[w-45,7]],'#869FBB');
      break;}
    case 'shop-offer':
      cut(ctx,0,3,w,h-3,6,edge);cut(ctx,0,0,w,h-4,6,top);
      poly(ctx,[[0,6],[5,1],[5,h-5],[0,h-10]],accent);break;
    case 'item-offer':
      cut(ctx,0,3,w,h-3,5,edge);cut(ctx,0,0,w,h-4,5,top);
      poly(ctx,[[0,5],[5,0],[70,0],[60,h-4],[5,h-4],[0,h-9]],bottom);
      poly(ctx,[[0,5],[5,0],[10,0],[7,h-4],[5,h-4],[0,h-9]],accent);break;
    case 'scene-bulletin':
      cut(ctx,0,3,w,h-3,6,'#8298B5');cut(ctx,0,0,w,h-3,6,'#E9EEF7');
      poly(ctx,[[0,6],[6,0],[13,0],[8,h-3],[5,h-3],[0,h-8]],'#7193BC');break;
    case 'capture-track':
      cut(ctx,0,2,w,h-2,6,'#5C769B');cut(ctx,0,0,w,h-3,6,'#E5EBF4');
      poly(ctx,[[0,6],[6,0],[52,0],[43,h-3],[5,h-3],[0,h-10]],'#C5D8EA');break;
    case 'ultimate-call': {
      const shape=[[0,6],[8,0],[w-12,0],[w,h*.5],[w-16,h-5],[7,h-3],[0,h-11]];
      ctx.save();ctx.translate(0,3);poly(ctx,shape,'#7894BE');ctx.restore();poly(ctx,shape,'#344967');
      poly(ctx,[[0,6],[8,0],[49,0],[43,h-3],[7,h-3],[0,h-11]],'#D5E2F0');
      poly(ctx,[[w-43,0],[w-25,0],[w-30,5],[w-49,5]],'#CB8595');
      poly(ctx,[[w-10,8],[w-1,h*.5],[w-15,h-6],[w-23,h-6],[w-9,h*.5],[w-15,11]],'#526D90');
      const x=w-24,y=h*.5;poly(ctx,[[x-5,y],[x-1,y-1],[x,y-6],[x+2,y-1],[x+6,y],[x+1,y+2],[x,y+6],[x-1,y+2]],'#BBD0E8');break;
    }
    case 'fusion-slip': {
      const active=has('selected'),spine=active?'#537CB6':'#91A8C4';
      cut(ctx,0,3,w,h-3,8,'#596C89');cut(ctx,0,0,w,h-4,8,'#EAEFF6');
      poly(ctx,[[0,8],[8,0],[12,0],[12,h-5],[7,h-5],[0,h-12]],spine);
      for(const y of [22,32]){
        ctx.fillStyle='#53667D';ctx.fillRect(4,y+1,14,3);
        ctx.fillStyle='#BCCDDD';ctx.fillRect(4,y,14,2);
      }
      poly(ctx,[[w-15,h-4],[w-2,h-17],[w-2,h-11],[w-9,h-4]],'#B0C2D7');break;
    }
    case 'fusion-mark':
      cut(ctx,1,4,w-2,h-4,5,'#8298B6');cut(ctx,0,0,w-2,h-4,5,'#D0DFEE');
      poly(ctx,[[0,h-12],[w*.47,h-16],[w-8,h-6],[w-12,h-4],[5,h-4]],'#ABC3DE');break;
    case 'scene-action':
      cut(ctx,0,2,w,h-2,6,'#546D91');cut(ctx,0,0,w,h-3,6,'#A8BBD1');cut(ctx,1,1,w-2,h-5,5,'#ECEDF6');
      poly(ctx,[[3,9],[10,2],[19,2],[12,9]],has('zx-act-poor')?'#C98692':'#A5BDD9');
      break;
    case 'album-page':
    case 'move-paper':
      cut(ctx,0,2,w,h-2,7,'#819CBB');
      cut(ctx,0,0,w,h-3,7,'#F3F1FA');
      break;
    case 'plan-sheet': {
      // Ruled notebook margin and the torn bottom edge of the reference sheet.
      ctx.fillStyle='#92A9C4';ctx.fillRect(0,3,w,h-3);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,h-6);
      for(let x=w;x>0;x-=10){
        ctx.lineTo(Math.max(0,x-5),h-2);ctx.lineTo(Math.max(0,x-10),h-6);
      }
      ctx.closePath();ctx.fillStyle=white;ctx.fill();
      ctx.fillStyle='#DDC4CD';ctx.fillRect(11,10,1,h-23);
      ctx.fillStyle='#A7B9D1';
      for(let y=29;y<h-12;y+=76){ctx.beginPath();ctx.arc(6,y,1.7,0,Math.PI*2);ctx.fill();}
      break;
    }
    case 'lab-balance':
      cut(ctx,0,3,w,h-3,6,'#2F415D');cut(ctx,0,0,w,h-3,6,'#49678C');
      poly(ctx,[[0,6],[6,0],[75,0],[59,h-3],[6,h-3],[0,h-9]],'#3C567B');
      break;
    case 'lab-price': {
      const poor=el.dataset.poor==='true',height=Math.min(h-3,34),top=Math.floor((h-height)/2);
      cut(ctx,0,top+2,w,height,4,poor?'#B3BFD0':'#334F73');
      cut(ctx,0,top,w,height,4,poor?'#E1E6EF':'#426DA3');
      break;
    }
    case 'move-stamp': {
      ctx.fillStyle='#D5E3EF';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#F3F1FA';
      const hole=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
      for(let y=4;y<h;y+=8){hole(0,y,1.6);hole(w,y,1.6);}
      for(let x=4;x<w;x+=7){hole(x,0,1.2);hole(x,h,1.2);}
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
    case 'upgrade-card':
      cut(ctx,0,3,w,h-2,0,'#181E3290');
      cut(ctx,0,0,w,h-3,0,gradient(ctx,w,h,accent,edge));
      cut(ctx,4,4,w-8,h-10,0,gradient(ctx,w,h,top,bottom));
      poly(ctx,[[4,h-8],[w-4,h-8],[w-7,h-5],[4,h-5]],accent);
      break;
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
      cut(ctx,0,0,w,h-3,7,gradient(ctx,w,h,'#465674','#35435E'));
      poly(ctx,[[0,7],[7,0],[15,0],[6,9],[6,h-12],[0,h-6]],box.s.vars?.['--boss-accent']||'#C28190');
      break;
    case 'boss-seal':
      cut(ctx,0,1,w,h-1,6,box.s.vars?.['--boss-seal-edge']||'#9C6177');
      cut(ctx,1,0,w-2,h-3,5,box.s.vars?.['--boss-accent']||'#DEC3CF');
      cut(ctx,3,2,w-6,h-7,4,box.s.vars?.['--boss-seal-face']||'#F0DEE6');
      break;
    case 'guide-seal': {
      const accent=box.s.vars?.['--rc']||'#7EA3CF';
      cut(ctx,0,1,w,h-1,8,'#475C7D');
      cut(ctx,1,0,w-2,h-3,7,'#A9BDD7');
      cut(ctx,3,2,w-6,h-7,5,'#EEF0F7');
      cut(ctx,w/2-4,h-6,8,3,1,accent);
      break;
    }
    case 'guide-distance':
      cut(ctx,0,1,w,h-1,4,'#A3B6CD');
      cut(ctx,0,0,w,h-2,4,'#E8EDF6');
      break;
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
