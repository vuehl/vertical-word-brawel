import {openPaperPrompt} from './paper-system.js';

// Resolve only after confirmation so cancelling never sends a room request.
export function askCoopCode({el,button,parent,screen,trigger,previous='',error=''}) {
  return new Promise(resolve=>{
    let code=previous,closed=false,revision=0;
    const hint=el('p','paper-prompt-hint coop-code-hint',[],{role:'status','aria-live':'polite'});
    const cells=Array.from({length:6},()=>el('b','coop-code-digit',[],{'aria-hidden':true}));
    const display=el('div','coop-code-display',[
      el('div','coop-code-group',cells.slice(0,3)),el('div','coop-code-group',cells.slice(3))
    ],{role:'group'});
    const confirm=button('确认加入',()=>{if(code.length===6)finish(code);},'primary',{'data-action':'coop-join-submit'});
    const key=(label,action)=>el('button','coop-pad-key',label,{type:'button','data-key':label,onclick:action});
    function refresh(message=''){
      revision++;
      cells.forEach((cell,index)=>{
        cell.textContent=code[index]||'';
        cell.classList.toggle('current',index===code.length);
      });
      display.setAttribute('aria-label','房间号 '+(code.split('').join(' ')||'尚未输入'));
      confirm.disabled=code.length!==6;
      confirm.dataset.paperSurface=confirm.disabled?'button-muted':'button';
      hint.textContent=message||'输入好友的六位房间号';
      hint.classList.toggle('error',!!message);
    }
    function digit(value){if(code.length<6){code+=value;refresh();}}
    function erase(){code=code.slice(0,-1);refresh();}
    function paste(value){
      const digits=String(value??'').replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/\s/g,'');
      if(!/^\d{6}$/.test(digits)){refresh('请粘贴六位数字房间号');return;}
      code=digits;refresh();
    }
    async function readClipboard(){
      const version=revision;
      try{
        const value=window.readRoomCode?await window.readRoomCode():await navigator.clipboard.readText();
        if(!closed&&revision===version)paste(value);
      }catch{if(!closed&&revision===version)refresh('无法读取剪贴板，请点数字输入');}
    }
    const pad=el('div','coop-code-pad',[],{'aria-label':'数字键盘'});
    for(const labels of [['1','2','3'],['4','5','6'],['7','8','9'],['粘贴','0','删除']]){
      pad.append(el('div','coop-pad-row',labels.map(label=>key(label,label==='粘贴'?readClipboard:label==='删除'?erase:()=>digit(label)))));
    }
    const {overlay,panel,close}=openPaperPrompt({el,button,parent,screen,trigger,title:'加入房间',hint,
      body:[display,pad],confirm,onCancel:()=>finish(null),closeAction:'coop-join-close',cancelLabel:'取消'});
    function finish(value){
      if(closed)return;
      closed=true;close();
      resolve(value);
    }
    overlay.addEventListener('paste',event=>{
      const value=event.clipboardData?.getData('text');
      if(value){event.preventDefault();paste(value);}
    });
    overlay.addEventListener('keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(/^\d$/.test(event.key))digit(event.key);
      else if(event.key==='Backspace'||event.key==='Delete')erase();
      else if(event.key==='Enter'&&document.activeElement===panel){if(code.length===6)finish(code);}
      else return;
      event.preventDefault();
    });
    refresh(error);
  });
}
