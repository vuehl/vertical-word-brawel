import {paperIcon,dialogHeadingPrint} from './first-batch-art.js';

export function paperFloatingTitle(el,label){
  const width=Math.min(284,Math.max(174,Array.from(label).length*23+75));
  const title=el('header','paper-floating-title',[dialogHeadingPrint(width),el('h2','',label)]);
  title.style.width=width+'px';
  return title;
}

export function paperDialogTitle(node){
  if(node){node.classList.add('paper-dialog-title');node.dataset.paperSurface='dialog-title';}
  return node;
}

// Keep dismissal anchored to the viewport even when the dialog body scrolls.
export function dockDialogClose(overlay,button,label='关闭弹窗'){
  const panel=overlay.firstElementChild;
  if(panel?.getAttribute('role')==='dialog'){
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',panel.getAttribute('aria-label')||panel.querySelector('h1,h2')?.textContent||label);
    panel.removeAttribute('role');panel.removeAttribute('aria-modal');
  }
  overlay.classList.add('paper-dismiss-overlay');
  const previous=button.parentElement;
  const dock=previous?.classList.contains('zx-review-footer')&&previous.children.length===1?previous:document.createElement('div');
  dock.classList.add('paper-dismiss-dock');
  button.classList.remove('paper-back','primary','paper-action');
  button.classList.add('paper-dismiss-button');button.dataset.paperSurface='flat';
  button.setAttribute('aria-label',label);
  button.replaceChildren(paperIcon('dismiss'));if(dock!==previous)dock.append(button);overlay.append(dock);
}

export function mountMenuDialog(parent,overlay,screen){
  parent.append(overlay);
  const footer=screen?.querySelector('.paper-screen-footer,.zx-home-foot,.zx-pause-footer .paper-back');
  if(!footer)return;
  footer.classList.add('paper-covered-actions');
  footer._coveringDialog=overlay;
  const observer=new MutationObserver(()=>{
    if(overlay.isConnected)return;
    observer.disconnect();
    if(footer._coveringDialog===overlay){
      footer.classList.remove('paper-covered-actions');delete footer._coveringDialog;
    }
  });
  observer.observe(parent,{childList:true});
}

// Paper prompts share their heading, paired actions and focus handling.
export function paperDecisionActions(el,cancel,confirm){
  return el('div','paper-decision-actions',[cancel,confirm]);
}

export function paperDecisionPanel(el,title,hint,body,cancel,confirm){
  return el('section','paper-prompt',[
    el('h2','',title),hint,...body,paperDecisionActions(el,cancel,confirm)
  ],{role:'dialog','aria-modal':true,'aria-label':title,'data-paper-surface':'album-page',tabindex:'-1'});
}

export function openPaperPrompt({el,button,parent,screen,trigger,title,hint,body=[],confirm,onCancel,closeAction,cancelLabel}){
  const cancel=button(cancelLabel,onCancel,'',{'data-action':closeAction});
  const panel=paperDecisionPanel(el,title,hint,body,cancel,confirm);
  const overlay=el('div','zx zx-modal-wrap zx-dialog paper-prompt-overlay',panel);
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();onCancel();}
    if(event.key!=='Tab')return;
    const keys=[...overlay.querySelectorAll('button')].filter(n=>!n.disabled);
    const index=keys.indexOf(document.activeElement);
    event.preventDefault();
    if(index<0){keys[event.shiftKey?keys.length-1:0].focus();return;}
    keys[(index+(event.shiftKey?-1:1)+keys.length)%keys.length].focus();
  });
  mountMenuDialog(parent,overlay,screen);panel.focus();
  return {overlay,panel,close(){
    overlay.remove();if(trigger?.isConnected)trigger.focus();
  }};
}

export function albumTab(el,button,label,active,onClick,attrs={}){
  const art=el('img','zc-control-face',[],{alt:'','aria-hidden':true});
  const tab=button([art,el('span','zc-control-label',label)],onClick,'zc-btn zc-filter',
    {'data-paper-surface':attrs['data-move-group']||attrs['data-plan-tab']||attrs['data-stat-tab']!==undefined?'profile-switch':'flat',...attrs});
  setAlbumTabActive(tab,active);
  return tab;
}
export function setAlbumTabActive(tab,active){
  const face=tab.querySelector('.zc-control-face');
  if(face.hasAttribute('src')&&tab.getAttribute('aria-pressed')===String(active))return;
  tab.classList.toggle('active',active);
  tab.setAttribute('aria-pressed',String(active));
  face.setAttribute('src','assets/ui-paper/album-tab'+(active?'-on':'')+'.webp');
}

// Shared semantics, independent of page state. Only exact navigation labels
// become icon-only controls; destructive/cancel actions retain their wording.
export function standardButton(node,label){
  if(node.classList.contains('zx-home-entry'))return node;
  if(!/\b(zc-character|zc-filter|zc-look|zc-text|zx-offer|zx-buy|zx-gear|zx-plain|zx-upgrade-stats|zx-review-companion-select|zx-mini-slot|zx-difficulty)\b/.test(node.className))node.classList.add('paper-action');
  if(typeof label==='string'&&!node.classList.contains('primary')&&['返回','返回首页','返回选择'].includes(label)){
    node.classList.add('paper-back');
    node.dataset.paperSurface='flat';
    node.setAttribute('aria-label',label);
    node.replaceChildren(paperIcon('back'));
  }else if(typeof label==='string'&&/[→➜]\s*$/.test(label)){
    node.textContent=label.replace(/\s*[→➜]\s*$/,'');
  }
  return node;
}

// Fixed-height paper actions keep the amount and its closing bracket together.
export function fitPaperActionLabels(footer){
  const ctx=document.createElement('canvas').getContext('2d');
  const actions=Array.from(footer.querySelectorAll('button'),node=>({node,label:node.textContent.trim(),width:0}));
  function fit(){
    for(const action of actions){
      const {node,label}=action;
      // The native overlay is measured on its first paint. Use its safe width
      // immediately, then refine from the mounted control when available.
      const initial=(Math.min(window.innerWidth-40,360)-28-10*(actions.length-1))/actions.length;
      const width=Math.max(30,Math.floor(node.getBoundingClientRect().width||initial)-18);
      if(width===action.width)continue;
      action.width=width;
      const measure=(value,size)=>{ctx.font='bold '+size+'px "Ziling Swei", sans-serif';return ctx.measureText(value).width;};
      let size=18;
      while(size>13&&measure(label,size)>width)size--;
      let lines=[label];
      if(measure(label,size)>width){
        const parts=label.match(/^(.+?)\s*([（(].+[）)])$/);
        if(parts)lines=[parts[1].trim(),parts[2]];
        else{
          const chars=Array.from(label);
          const mid=Math.ceil(chars.length/2);
          lines=[chars.slice(0,mid).join(''),chars.slice(mid).join('')];
        }
      }
      node.setAttribute('aria-label',label);
      node.replaceChildren(...lines.map(line=>{
        const span=document.createElement('span');span.className='zx-action-line';span.textContent=line;
        span.style.fontSize=size+'px';span.style.lineHeight=(size+2)+'px';return span;
      }));
    }
  }
  fit();requestAnimationFrame(()=>{if(footer.isConnected)fit();});
}

export function standardFooter(footer){
  const children=Array.from(footer.children);
  const buttons=children.filter(n=>n.tagName?.toLowerCase()==='button');
  if(footer.querySelectorAll('button').length===1&&buttons.length===1&&buttons[0].classList.contains('paper-back'))footer.classList.add('paper-single-back');
  if(buttons.length===2&&children.length===2&&buttons.some(n=>n.classList.contains('paper-back'))){
    footer.classList.add('paper-footer-row');
    const back=buttons.find(n=>n.classList.contains('paper-back'));
    footer.replaceChildren(back,...buttons.filter(n=>n!==back));
  }
  return footer;
}

export function freePaperActions(node){
  node.querySelector('.paper-joint')?.remove();
  const dock=node.querySelector('.zx-footer');
  dock.classList.remove('paper-bound-footer');
  dock.classList.add('paper-free-actions');
  dock.dataset.paperSurface='flat';
}
