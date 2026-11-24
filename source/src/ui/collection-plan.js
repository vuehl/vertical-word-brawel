import {albumTab,setAlbumTabActive} from './paper-system.js';

const sections=[
  ['moves','招式','备选招式','标记想在本局习得或升级的招式。'],
  ['vitamins','维生素','维生素','标记想在升级时优先选择的增益。'],
  ['fusions','融合','融合路线','标记想在订书机合成的招式。'],
  ['items','道具','携带道具','标记想从商店购买或从扭蛋拾取的道具。'],
];

export function openCollectionPlan({el,button,mount,footer,portrait,name,catalog,saved,save,back}){
  const draft={},counts={},tabs={};
  const nav=el('div','zc-filters zc-album-tabs');
  const tally=el('div','zc-plan-tally');
  const title=el('b'),desc=el('small'),marked=el('small','zc-plan-marked');
  const list=el('div','zc-plan-list');
  let current,saving=false;
  const updateCounts=()=>{
    for(const [key,label] of sections)counts[key].textContent=label+'  '+draft[key].size;
    marked.textContent='已标记 '+draft[current].size+' 项';
  };
  function show(section){
    const [group,,heading,hint]=section;
    current=group;title.textContent=heading;desc.textContent=hint;
    for(const [key] of sections)setAlbumTabActive(tabs[key],key===group);
    const entries=catalog[group].map(entry=>{
      const star=el('span','zc-plan-star',[],{'aria-hidden':true});
      const row=button([
        el('img','zc-plan-icon',[],{src:entry.icon,alt:''}),
        el('div','zc-plan-copy',[el('b','',entry.name),el('small','',entry.detail),
          entry.pairs?el('span','zc-plan-pair',entry.pairs.map(pair=>pair.join('  ＋  ')).join(' 或 ')):null,
          entry.requirement?el('small','',entry.requirement):null]),
        star,
      ],()=>{
        if(saving)return;
        if(draft[group].has(entry.key))draft[group].delete(entry.key);else draft[group].add(entry.key);
        paint();updateCounts();
      },'zx-plain zc-plan-row',{'data-plan-key':entry.key,'aria-label':entry.name});
      function paint(){
        const on=draft[group].has(entry.key);
        row.classList.toggle('marked',on);row.setAttribute('aria-pressed',String(on));star.textContent=on?'★':'☆';
      }
      paint();return row;
    });
    list.replaceChildren(...(entries.length?entries:[el('p','zc-plan-empty','暂无可标记的'+section[1])]));
    list.scrollTop=0;updateCounts();
  }
  for(const section of sections){
    const [key,label]=section;
    const previous=Array.isArray(saved?.[key])?saved[key]:[];
    draft[key]=new Set(catalog[key].filter(entry=>previous.includes(entry.key)).map(entry=>entry.key));
    counts[key]=el('b');tally.append(counts[key]);
    tabs[key]=albumTab(el,button,label,false,()=>show(section),{'data-plan-tab':key});
    nav.append(tabs[key]);
  }
  show(sections[0]);
  const summary=el('section','zc-plan-summary',[
    el('div','zc-plan-identity',[portrait,el('div','zc-plan-copy',[el('b','',name+'的计划'),el('small','','出战时提示已标记的选择')]),el('small','','编辑中')]),
    tally,
  ],{'data-paper-surface':'destination-cover'});
  const sheet=el('div','zc-plan-sheet',[
    el('div','zc-plan-heading',[title,marked]),desc,list,
    el('div','zc-plan-tip','★  候选中出现星标项目时，显示「计划中」。'),
  ],{'data-paper-surface':'plan-sheet'});
  const page=mount('collection-plan','配置计划','',[summary,nav,sheet],footer(async()=>{
    if(saving)return;
    saving=true;page.style.pointerEvents='none';
    try{
      const plan={};
      for(const [key] of sections)plan[key]=Array.from(draft[key]);
      await save(plan);back();
    }finally{saving=false;page.style.pointerEvents='';}
  },'保存计划',false,()=>{if(!saving)back();}));
  page.querySelector('.zx-body').dataset.paperSurface='flat';
}
