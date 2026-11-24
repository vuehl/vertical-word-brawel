import {disclosureArrow} from './first-batch-art.js';
import {dockDialogClose,mountMenuDialog} from './paper-system.js';

function showReadingDialog(el,model,trigger,closeLabel,main,kind='',footer=null){
  if(document.querySelector('.zc-move-overlay'))return;
  const overlay=el('div','zx-modal-wrap zc-move-overlay');
  const dialog=el('div','zc-move-dialog '+kind,[],{role:'dialog','aria-modal':true,'aria-label':model.name,'data-paper-surface':'move-paper'});
  function close(){
    window.removeEventListener('keydown',onKey,true);
    overlay.remove();
    trigger?.focus?.({preventScroll:true});
  }
  function onKey(event){
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
    if(event.key==='Tab'){
      const buttons=Array.from(overlay.querySelectorAll('button'));
      const index=buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
    }
  }
  const dismiss=el('button','',[],{type:'button','data-action':'move-close',onclick:close});
  const header=el('div','zc-dialog-header',[
    el('div','zc-move-stamp dialog-stamp',model.icon,{'data-paper-surface':'move-stamp'}),
    el('div','zc-dialog-name',[el('b','',model.name),el('small','',model.meta)])]);
  dialog.append(header,main);
  if(footer)dialog.append(footer);
  overlay.append(dialog);
  dockDialogClose(overlay,dismiss,closeLabel);
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  mountMenuDialog(document.body,overlay,trigger?.closest('.screen'));
  window.addEventListener('keydown',onKey,true);
  dismiss.focus();
  return next=>{
    header.querySelector('.zc-move-stamp').replaceChildren(next.icon);
    header.querySelector('b').textContent=next.name;
    header.querySelector('small').textContent=next.meta;
    overlay.setAttribute('aria-label',next.name);
  };
}

export function openMoveDialog(el,move,trigger){
  const main=el('div','zc-dialog-scroll',[
    el('div','zc-dialog-description',[el('b','',move.desc),move.level?el('small','',move.level):null]),
    el('div','zc-featured',move.featured.map(([label,value,hint])=>el('div','zc-feature',[
      el('small','',label),el('b','',value)],{title:hint??''}))),
  ]);
  function pairs(entries,kind){
    const container=el('div',kind);
    for(let i=0;i<entries.length;i+=2){
      container.append(el('div','zc-pair-row',entries.slice(i,i+2).map(([label,value,hint])=>
        el('div','zc-pair',[el('span','',label),el('b','',value)],{title:hint??''}))));
    }
    return container;
  }
  if(move.others.length)main.append(pairs(move.others,'zc-detail-values'));
  if(move.note)main.append(el('p','zc-detail-note',move.note));
  function disclosure(key,label,summary,make){
    const marker=el('span','zc-disclosure-mark',disclosureArrow(false),{'aria-hidden':true});
    let content=null;
    const toggle=el('button','zc-disclosure',[
      el('b','',label),el('small','',summary),marker],
      {type:'button','data-action':'move-'+key,'aria-expanded':'false','aria-controls':'move-'+key+'-content'});
    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')!=='true';
      toggle.setAttribute('aria-expanded',String(open));
      marker.replaceChildren(disclosureArrow(open));
      if(!open){content.remove();return;}
      if(!content){content=make();content.id='move-'+key+'-content';}
      group.append(content);
    });
    const group=el('div','zc-disclosure-group',toggle);
    main.append(group);
  }
  if(move.growth){
    const {values,format,ranges}=move.growth;
    disclosure('growth','成长与强化','Lv.1–'+values.length,()=>{
      const maximum=Math.max(1,...values);
      return el('div','zc-growth',[
        el('div','zc-growth-caption',[el('span','','每次命中伤害'),el('b','',format(values[0])+' → '+format(values.at(-1)))]),
        el('div','zc-growth-bars',values.map((value,index)=>el('div','zc-growth-level',[
          el('i','',[],{style:'height:'+Math.max(3,Math.round(value/maximum*40))+'px'}),
          el('small','',String(index+1))],{title:'Lv.'+(index+1)+' · '+format(value)}))),
        el('b','zc-range-title','随机强化范围'),pairs(ranges,'zc-growth-ranges')]);
    });
  }
  disclosure('related','相关道具与维生素','',()=>{
    const related=move.related();
    if(!related)return el('div','zc-related','暂无相关道具与维生素');
    related.classList.add('zc-related');
    related.querySelector('small')?.remove();
    return related;
  });
  showReadingDialog(el,move,trigger,'关闭招式说明',main);
}

export function openUltimateDialog(el,info,trigger,typeName,glyph){
  const main=el('div','zc-dialog-scroll zc-ultimate-scroll');
  const forms=info.forms;
  const dock=forms.length>1?el('div','zc-ult-forms',[],{role:'group','aria-label':'选择大招形态'}):null;
  if(dock){
    for(const form of forms){
      const tab=el('button','zc-form-tab',[glyph(form.id),el('small','',form.level?'Lv.'+form.level:'初始')],
        {type:'button','data-form':form.id,'aria-label':form.word+' · '+form.name});
      tab.addEventListener('click',()=>{
        if(tab.getAttribute('aria-pressed')!=='true')updateHeader(show(form));
      });
      dock.append(tab);
    }
  }
  function show(form){
    const data=info.details(form.id);
    const chart=el('section','zc-ult-section',[el('b','zc-ult-section-title','属性相性')]);
    for(const {label,entries} of data.matchups){
      const chips=entries.map(([type,multiplier])=>el('span','zc-match-chip',[
        info.typeIcon(type,15),el('span','',typeName(type)),multiplier==null?null:el('small','','×'+multiplier.toFixed(2)),
      ]));
      chart.append(el('div','zc-match-row',[el('b','',label),
        el('div','zc-match-chips',chips.length?chips:[el('span','zc-none','无')])]));
    }
    main.replaceChildren(
      el('p','zc-ult-effect',form.desc),
      el('section','zc-ult-section zc-ult-rules',[
        el('div','zc-form-heading',[el('b','zc-ult-section-title','释放方式'),el('small','','施放 '+form.duration+' 秒')]),
        el('p','','战斗中随时间、击败敌人或受击蓄能。蓄满后，点击局内「大招」释放。'),
        el('small','',form.parent?'进阶条件 · '+form.parent+' → '+form.word+' · Lv.'+form.level:'初始形态 · '+form.word),
      ]),
      chart
    );
    main.scrollTop=0;
    if(dock)for(const tab of dock.children){
      const active=tab.dataset.form===String(form.id);
      tab.classList.toggle('on',active);
      tab.setAttribute('aria-pressed',String(active));
    }
    return {name:form.name,meta:form.word+'的大招 · '+typeName(form.type)+' · '+form.category,icon:info.typeIcon(form.type,32)};
  }
  const updateHeader=showReadingDialog(el,show(forms[0]),trigger,'关闭大招详情',main,
    'zc-ultimate-dialog'+(dock?' with-forms':''),dock);
}
