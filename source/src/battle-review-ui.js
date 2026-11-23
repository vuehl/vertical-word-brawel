import {glyphPreview} from './zixing-glyphs.js';
import {summonerBarColors} from './battle-review-style.js';
import {planIncludes,runPlan} from './battle-plan.js';
import {battleDialogFrame,hudPaperIcon} from './first-batch-art.js';
import {albumTab,setAlbumTabActive,dockDialogClose,paperDecisionActions,standardButton} from './paper-system.js';
const el=(tag,cls='',children=[],attrs={})=>{
  const n=document.createElement(tag);n.className=cls;
  for(const [k,v] of Object.entries(attrs)){
    if(k.startsWith('on'))n.addEventListener(k.slice(2),v);
    else if(k==='disabled')n.disabled=!!v;
    else n.setAttribute(k,String(v));
  }
  for(const c of [children].flat())if(c!=null)n.append(c);
  return n;
};
const button=(text,fn,cls='',attrs={})=>{
  const node=el('button','zx-review-button '+cls,text,{type:'button',onclick:fn,...attrs});
  if(text==='返回'){node.dataset.dialogDismiss='true';return node;}
  return standardButton(node,text);
};
const check=on=>el('span','zx-review-check'+(on?' on':''),on?'✓':'',{'aria-hidden':'true'});
const note=s=>el('p','zx-review-note',s);
export function shopAmount(value,{credit=false,caption=''}={}){
  return el('span','zx-shop-amount',[
    credit?el('span','zx-shop-plus','+'):null,hudPaperIcon('coin',20),
    el('b','zx-shop-value',value),caption?el('span','zx-shop-caption',caption):null,
  ]);
}
export function qualityBadge(quality){
  return el('span','zx-quality-badge '+quality.key,quality.label,{'data-paper-surface':'rarity','data-quality':quality.key});
}
export const planBadge=()=>el('small','zc-plan-badge','★ 计划中');
export function itemOffer(node,{key,name,picture,quality,effects,held,planned}){
  node.className='zx-item-card zx-quality-card zx-item-option';
  node.dataset.paperSurface='item-offer';node.dataset.quality=quality.key;node.dataset.rarity=quality.label;node.dataset.itemChoice=key;
  picture.classList.add('zx-item-image');
  const badge=qualityBadge(quality);
  const art=el('div','zx-pick-art',picture);
  const copy=el('div','zx-pick-copy',[
    el('div','zx-pick-name',[el('b','',name),badge]),
    planned?planBadge():null,
    ...effects.map(line=>el('p','zx-pick-effect',line.replace(/₽/g,'金币'))),
    held?el('small','zx-pick-held',held):null,
  ]);
  node.replaceChildren(art,copy);
  return node;
}

export function shopOffer({key,name,picture,quality,planned,effects,owned,status,action}){
  const heading=el('div','zx-shop-head',[
    el('div','zx-shop-labels',[el('b','zx-shop-name',name),planned?planBadge():null]),
    qualityBadge(quality),
  ]);
  return el('article','zx-shop-offer',[
    el('div','zx-shop-product',[
      el('div','zx-shop-picture',picture),
      el('div','zx-shop-description',[heading,...effects.map(line=>el('p','zx-shop-effect',line.replace(/₽/g,'金币')))]),
    ]),
    el('div','zx-shop-deal',[el('div','zx-shop-inventory',[el('small','zx-shop-owned',owned),status]),action]),
  ],{'data-paper-surface':'shop-offer','data-quality':quality.key,'data-rarity':quality.label,'data-item-choice':key});
}

export function shopShelves(panel,previousView){
  const modal=panel.closest('.zx-modal-wrap'),body=panel.querySelector('.zx-review-content');
  const stock=body.querySelector('.cards'),sell=body.querySelector('.zx-sale-list'),refresh=panel.querySelector('.shop-reroll');
  const shopNote=Array.from(body.children).find(n=>n.classList.contains('help'));
  if(shopNote)shopNote.textContent='频繁购物且未开扭蛋，下次商店的价格会上涨。';
  const buy=el('div','zx-shop-stock',[refresh,stock,shopNote]);
  const empty=el('p','zx-shop-empty','暂无可出售的道具');
  const resale=el('div','zx-shop-resale',[el('p','zx-shop-sell-hint','每次按单个道具出售'),sell||empty]);
  const tabs=el('nav','zx-shop-index',[],{'aria-label':'商店交易'});
  const open=view=>{
    modal.dataset.shopView=view;
    for(const tab of tabs.children)tab.setAttribute('aria-pressed',String(tab.dataset.shopTab===view));
    sell?.querySelectorAll('.armed').forEach(node=>node.dispatchEvent(new Event('disarm')));
    body.replaceChildren(view==='sell'?resale:buy);body.scrollTop=0;
  };
  for(const [key,name] of [['buy','购买'],['sell','出售']]){
    tabs.append(el('button','zx-shop-index-tab',name,{
      type:'button','data-shop-tab':key,'data-paper-surface':'shop-index-tab',onclick:()=>open(key),
    }));
  }
  const header=modal.querySelector('.zx-paper-upgrade-head');
  const wallet=header.querySelector('small');
  if(wallet){
    const amount=wallet.textContent;
    wallet.replaceChildren(shopAmount(amount));wallet.className='zx-shop-balance';
    wallet.setAttribute('aria-label','余额 '+amount);
  }
  const ledger=el('div','zx-shop-ledger',[tabs,wallet],{'data-paper-surface':'shop-ledger'});
  header.classList.add('single-line');
  panel.classList.add('zx-shop-shelves');panel.insertBefore(ledger,body);
  const team=panel.querySelector('.pk-btn'),leave=panel.querySelector('.shop-exit');
  team.replaceChildren('查看队伍');team.dataset.action='inspect-team';team.classList.add('secondary');
  panel.querySelector('.zx-review-footer').replaceChildren(team,leave);
  open(previousView==='sell'?'sell':'buy');
}
export function fullParty({hud,party,incoming,choose,role}){
  const pick=index=>{if(!wrap.isConnected)return;choose(index);};
  const portrait=member=>el('div','zx-party-photo',glyphPreview(member.species,1));
  const rows=party.flatMap((member,index)=>{
    if(member.shiny)return [];
    const stats=el('div','zx-party-tallies',[
      el('span','','羁绊 '+member.bond),el('span','','击败 '+member.kills),el('span','','伤害 '+Math.round(member.damage)),
    ]);
    const row=el('button','zx-party-pick',[portrait(member),el('div','zx-party-copy',[
      el('b','',member.name),el('small','',role(member.types[0])),stats,
    ]),el('span','zx-party-send','送别')],{type:'button','data-party-slot':index,'data-paper-surface':'companion-slip',
      'aria-label':'送别'+member.name+'并招募'+incoming.name,onclick:()=>pick(index)});
    return [row];
  });
  const candidate=el('header','zx-party-incoming',[
    el('div','zx-party-intro-art',glyphPreview(incoming.species,1),{'data-paper-surface':'arrival-letter'}),
    el('div','zx-party-intro-copy',[
      el('small','zx-party-intro-flag','待加入',{'data-paper-surface':'arrival-flag'}),
      el('b','zx-party-intro-name',incoming.name),el('span','',role(incoming.types[0])),
    ]),
  ],{'data-paper-surface':'arrival-heading'});
  const instruction=el('div','zx-party-instruction',[
    el('span','','选择要送别的伙伴'),el('i','',[],{'aria-hidden':true}),
  ]);
  const panel=el('section','zx zx-modal zx-party-roster',[
    candidate,instruction,el('div','zx-review-content',rows),button('放弃招募',()=>pick(-1),'secondary',{'data-party-slot':'-1'}),
  ],{role:'dialog','aria-label':'同行位已满','data-paper-surface':'flat'});
  const wrap=hud.modal(battleDialogFrame(panel,el('h2','','同行位已满')));
  wrap.className='zx zx-modal-wrap zx-loot-scrim';return wrap;
}
export function showTeamItem(trigger,record){
  const owner=trigger.closest('.zx-team-overlay');
  if(!owner||owner.classList.contains('zx-under-team'))return;
  const overlay=el('div');
  const close=()=>{removeEventListener('keydown',key,true);overlay.remove();owner.classList.remove('zx-under-team');trigger.focus?.();};
  const key=event=>{if(event.key==='Escape'||event.code==='Tab'){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)close();}};
  const scroll=el('div','mv-scroll',record);
  teamDetail(overlay,trigger.getAttribute('aria-label'),scroll,close,'道具详情').classList.add('zx-team-item-paper');
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  owner.classList.add('zx-under-team');document.body.append(overlay);addEventListener('keydown',key,true);
  overlay.querySelector('button').focus?.();
}
export function teamDetail(overlay,title,record,close,heading='招式详情'){
  const panel=el('section','zx zx-modal zx-team-dossier',record,{role:'dialog','aria-label':title,'data-paper-surface':'album-page'});
  overlay.className='zx zx-modal-wrap zx-team-overlay mv-ov';
  overlay.replaceChildren(battleDialogFrame(panel,el('h2','',heading)));
  dockDialogClose(overlay,button('返回',close),'关闭'+heading);
  return panel;
}
export function teamOverview(run,body,types,close){
  const tabs=['招式','道具','属性'],sections=Array.from(body.children);
  const tabRow=el('nav','zx-team-tabs zx-lab-tabs zc-album-tabs',[],{'aria-label':'队伍资料'});
  const scroll=el('div','zx-team-scroll');
  const choose=index=>{
    Array.from(tabRow.children).forEach((tab,i)=>setAlbumTabActive(tab,i===index));
    scroll.replaceChildren(sections[index]);scroll.scrollTop=0;
  };
  tabs.forEach((name,i)=>tabRow.append(albumTab(el,button,name,i===0,()=>choose(i),{'data-team-tab':String(i)})));
  for(const cell of body.querySelectorAll('.pk-item')){
    const name=cell.getAttribute('aria-label');if(name)cell.append(el('span','zx-team-item-name',name));
  }
  const portrait=glyphPreview(run.player.speciesId,1);
  const identity=el('header','zx-team-identity',[portrait,el('div','zx-team-idcopy',[
    el('b','',portrait.dataset.glyph+' · Lv.'+run.player.level),el('div','zx-team-types',types),
  ])]);
  const panel=el('section','zx zx-modal zx-team-reading',[identity,tabRow,scroll],{role:'dialog','aria-label':'我的队伍','data-paper-surface':'album-page'});
  const overlay=el('div','zx zx-modal-wrap zx-team-overlay pk-ov',battleDialogFrame(panel,el('h2','','我的队伍')),{role:'dialog','aria-modal':'true','aria-label':'我的队伍'});
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  dockDialogClose(overlay,button('返回',close),'关闭我的队伍');choose(0);return overlay;
}
export function styleReviewDialog(pane,...classes){
  const content=el('section','zx zx-modal zx-review-dialog '+classes.join(' '),Array.from(pane.childNodes),{role:'dialog','aria-modal':'true'});
  // Keep legacy scene actions outside their scrolling body; preserve all original handlers.
  if(classes.some(c=>['zx-review-shop','zx-review-forget'].includes(c))){
    const body=el('div','zx-review-content'),footer=el('div','zx-review-footer zx-review-legacy-footer');
    for(const child of Array.from(content.children)){
      if(child.tagName==='H1'||child.classList.contains('shop-reroll'))continue;
      if(child.classList.contains('shop-exit')||child.classList.contains('actions')||child.classList.contains('pk-btn'))footer.append(child);
      else body.append(child);
    }
    content.append(body,footer);
  }
  if(classes.includes('zx-review-forget')){
    const body=content.querySelector('.zx-review-content'),rows=Array.from(body.querySelectorAll('.item-row'));
    const remaining=body.querySelector('.zx-review-empty');
    for(const row of rows){
      const art=row.firstElementChild,copy=row.querySelector('.grow'),action=row.querySelector('button');
      const original=action.textContent.trim(),amount=original.match(/\+([\d,.\s]+)\s*(?:₽|金币)/);
      action.className='zx-review-button secondary';action.textContent='遗忘';action.dataset.action='forget-entry';
      action.setAttribute('aria-label',copy.querySelector('h4').textContent+' · '+original.replace(/₽/g,'金币'));
      standardButton(action,'遗忘');row.className='zx-forget-row';row.dataset.paperSurface='move-paper';
      copy.className='zx-forget-copy';
      copy.lastElementChild.textContent=copy.lastElementChild.textContent.replace(/₽/g,'金币');
      row.replaceChildren(el('div','zx-forget-art',art),copy,el('div','zx-forget-action',[
        action,amount?shopAmount(amount[1].trim(),{credit:true}):null,
      ]));
    }
    body.replaceChildren(...rows,...(remaining?[note(remaining.textContent)]:[]));
    content.dataset.paperSurface='flat';
  }
  pane.className='zx zx-modal-wrap zx-review-overlay '+classes.join(' ');
  const title=content.querySelector('h1'),heading=title?.closest('.zx-review-heading');
  let subtitle=heading?.querySelector('.zx-review-note')?.textContent;
  if(classes.includes('zx-fusion-list')||classes.includes('zx-fusion-preview')||classes.includes('zx-review-copy'))content.dataset.paperSurface='flat';
  if(classes.includes('zx-review-shop')){
    content.dataset.paperSurface='flat';
    const [name,balance]=title.textContent.split(' · ');
    if(balance){title.textContent=name;subtitle=balance;}
  }
  pane.replaceChildren(title?battleDialogFrame(content,title,subtitle):content);
  heading?.remove();
  for(const action of content.querySelectorAll('.btn,.shop-exit,.pk-btn')){
    const label=action.textContent.trim();
    if(label==='返回')action.dataset.dialogDismiss='true';
    else standardButton(action,label);
  }
  const close=content.querySelector('[data-dialog-dismiss="true"]');
  if(close){
    const footer=close.closest('.zx-review-footer');
    dockDialogClose(pane,close);
    if(footer&&!footer.querySelector('button'))footer.remove();
  }
  return content;
}
const heading=(title,sub)=>el('div','zx-review-heading',[el('h1','',title),sub?note(sub):null]);
export function selectionSession(commit){
  let selected=null,submitted=false;
  return {get selected(){return selected;},get submitted(){return submitted;},select(value){if(!submitted)selected=value;},submit(allowed=true){if(submitted||selected===null||!allowed)return false;submitted=true;commit(selected);return true;},cancel(){if(submitted)return;submitted=true;commit(null);}};
}
export function showReviewFusion({hud,run,offers,done,requiredLevel,typeIcon,details,warning,tags}){
  const session=selectionSession(done);
  const ready=o=>!!o?.ready;
  const resultMark=recipe=>el('div','zx-fusion-mark',[
    typeIcon(recipe.type,27),recipe.type2&&recipe.type2!==recipe.type?typeIcon(recipe.type2,20):null,
  ],{'aria-hidden':'true','data-paper-surface':'fusion-mark'});
  const stamp=o=>el('span','zx-fusion-state'+(ready(o)?' ready':''),ready(o)?'可融合':'未满足');
  const identity=o=>el('div','zx-fusion-identity',[resultMark(o.r),
    el('div','zx-fusion-name',[planIncludes(runPlan(run),'fusions','m'+o.r.id)?planBadge():el('small','','融合结果'),el('h2','',o.r.name)]),stamp(o)]);
  const ingredients=o=>el('div','zx-fusion-pair',o.names.flatMap((name,i)=>{
    const move=run.player.moves[i?o.b:o.a]||run.player.moves.find(m=>m && m.def.id===o.ingredients[i]);
    const part=el('div','zx-fusion-part',[
      typeIcon(o.types[i],22),el('div','zx-fusion-material',[el('b','',name),
        el('small',move?.level>=requiredLevel?'ready':'',move?'Lv.'+move.level+' / '+requiredLevel:'未学习')]),
    ]);
    return i?[el('span','zx-fusion-plus','＋'),part]:[part];
  }));
  const slip=(children,classes='',attrs={})=>el('article','zx-fusion-slip '+classes,children,{'data-paper-surface':'fusion-slip',...attrs});
  const metrics=recipe=>{
    const nums=details(recipe);
    if(!nums?.classList?.contains('mp-nums'))return nums;
    const cells=Array.from(nums.children),rows=[];
    for(let i=0;i<cells.length;i+=2){
      const pair=cells.slice(i,i+2).map(cell=>{
        const label=cell.firstElementChild;
        const value=Array.from(cell.childNodes).filter(n=>n!==label).map(n=>n.textContent).join('');
        return el('div','zx-fusion-stat',[label,el('b','',value)]);
      });
      if(pair.length===1)pair.push(el('div','zx-fusion-stat spacer',[],{'aria-hidden':'true'}));
      rows.push(el('div','zx-fusion-stat-row',pair));
    }
    return el('div','zx-fusion-stats',rows);
  };
  const condition=o=>o.need?.join(' · ')||`两项招式均须达到 Lv.${requiredLevel}。`;
  let listScroll=0;
  const preview=index=>{
    const o=offers[index],a=run.player.moves[o.a]?.def,b=run.player.moves[o.b]?.def;
    const confirm=button('确认融合',()=>{session.select(index);session.submit(ready(o));},'primary',{'data-action':'confirm-fusion',disabled:!ready(o)});
    const record=slip([identity(o),ingredients(o),
      el('div','zx-fusion-effect',[tags(o.r),el('p','zx-review-description',o.r.desc),warning(o.r,a,b)]),
      el('div','zx-fusion-figures',[el('h3','','关键数值'),metrics(o.r)]),
      el('p','zx-fusion-footnote',ready(o)?'占用靠前的招式槽，释放另一个槽位。':condition(o)),
    ],'zx-fusion-record');
    const pane=hud.modal(heading('融合预览'),el('div','zx-review-content',[record]),
      paperDecisionActions(el,button('取消',list,'secondary',{'data-action':'fusion-back'}),confirm));
    styleReviewDialog(pane,'zx-fusion-preview');
  };
  const list=()=>{
    const content=el('div','zx-review-content zx-review-fusion-list');
    for(const [index,o] of offers.entries()){
      const selected=session.selected===index;
      const select=()=>{
        if(!ready(o))return;
        listScroll=content.scrollTop;session.select(index);list();
      };
      const surface=el('div','zx-review-recipe-select',[identity(o),ingredients(o)],
        {role:'radio',tabindex:ready(o)?0:-1,'aria-label':o.r.name,'aria-checked':selected,'aria-disabled':!ready(o),
          onclick:select,onkeydown:event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}}});
      const open=button('查看',()=>{listScroll=content.scrollTop;if(ready(o))session.select(index);preview(index);},
        'secondary',{'data-action':'view-fusion','aria-label':'查看'+o.r.name});
      content.append(slip([surface,el('div','zx-fusion-rowfoot',[
        el('small','',selected?'已选配方':'融合后占 1 个槽位'),open,
      ])],'zx-review-recipe'+(selected?' selected':''),{'data-offer':index}));
    }
    if(!offers.length){
      content.append(slip([el('b','','暂无融合配方'),note('学习两项可组合的招式后，再来使用订书机。')],'zx-fusion-empty'));
    }
    const pane=hud.modal(heading('招式融合',`两项 Lv.${requiredLevel} 招式合为一招`),content,
      ...(offers.length?[el('p','zx-fusion-limit','每台订书机仅可融合一次')]:[]),
      el('div','zx-review-footer',[button('返回',()=>session.cancel(),'secondary',{'data-action':'close-fusion'})]));
    styleReviewDialog(pane,'zx-fusion-list');content.scrollTop=listScroll;
  };
  list();return session;
}
function searchIcon(){
  const n=el('canvas','zx-review-search',[],{width:40,height:40,'aria-hidden':true});n.width=n.height=40;n.dataset.static='true';
  const c=n.getContext('2d');c.strokeStyle='#526d60';c.lineWidth=3;c.beginPath();c.arc(16,16,11,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(24,24);c.lineTo(36,36);c.stroke();return n;
}
export function showReviewCompanion({hud,current,incoming,dust,done,portrait,typeBadge,role}){
  const session=selectionSession(done),records=[current,incoming];
  const detail=index=>{
    const r=records[index];
    const pane=hud.modal(heading('字灵详情',r.name),el('div','zx-review-content',[
      el('div','zx-review-companion-art',portrait(r.species)),el('div','zx-review-type-row',r.types.map(typeBadge)),
      el('section','zx-review-section',[el('h2','','同行效果'),note(role(r.types[0]))]),
      el('div','zx-review-stats',[el('span','','羁绊 '+(r.bond||0)),el('span','','击败 '+(r.kills||0)),el('span','','累计伤害 '+Math.round(r.damage||0))]),
    ]),el('div','zx-review-footer',button('返回',render,'secondary',{'data-action':'companion-back'})));
    styleReviewDialog(pane);
  };
  const render=()=>{
    const cards=records.map((r,index)=>{
      const selected=session.selected===!!index;
      return el('div','zx-review-companion'+(selected?' selected':''),[
        button([el('div','zx-review-choice-head',[check(selected),el('span','zx-review-tag',index?'新捕获':'当前同行')]),el('div','zx-review-companion-art',portrait(r.species)),el('h2','',r.name),el('div','zx-review-type-row',r.types.map(typeBadge)),note(index?'刚刚捕获':'羁绊 '+(r.bond||0)),note(role(r.types[0]))],()=>{session.select(!!index);render();},'zx-review-companion-select',{role:'radio','aria-checked':selected,'data-companion':index}),
        button([searchIcon(),'查看'],()=>detail(index),'secondary',{'data-action':'view-companion','aria-label':'查看'+r.name}),
      ]);
    });
    const selected=session.selected===null?null:records[Number(session.selected)];
    const pane=hud.modal(heading('选择同行字灵','本局仅保留一位稀有同行'),el('div','zx-review-content',[
      el('div','zx-review-companions',cards),el('div','zx-review-reward',note('图鉴登记与 '+dust+' 星星沙子已获得，不受同行选择影响。')),
    ]),el('div','zx-review-footer',button(selected?'确认同行 · '+selected.name:'请选择同行字灵',()=>session.submit(),'primary',{'data-action':'confirm-companion',disabled:!selected})));
    styleReviewDialog(pane,'zx-companion-dialog');
  };
  render();return session;
}
// Queue uses real elapsed time, but holds feedback during boss cut-ins/modals.
export class ReviewFeedbackQueue{
  constructor(){this.pending=[];this.active=null;this.last=0;}
  push(value){this.pending.push({...value,remaining:2400});if(this.pending.length>8)this.pending.shift();}
  tick(now,blocked){
    const dt=this.last?Math.min(100,Math.max(0,now-this.last)):0;this.last=now;
    if(blocked)return null;
    if(this.active){this.active.remaining-=dt;if(this.active.remaining<=0)this.active=null;}
    if(!this.active)this.active=this.pending.shift()||null;
    return this.active;
  }
  clear(){this.pending.length=0;this.active=null;}
}
const goldArrival={
  paper:'#f8f0d6',panel:'#332838',dots:'#685144',edge:'#be4c37',ink:'#943e2f',
  ray:'#d4a451',light:'#ffdf8a',ring:'#f8d17e',glow:'#ffe28f',glyph:'#b64327',
  outline:'#ffe9a1',title:'#fff1ba',shadow:'#9a392c',subtitle:'#e9c77d',
};
const blueArrival={
  paper:'#e2f2fc',panel:'#202f47',dots:'#3d5672',edge:summonerBarColors.fill,ink:'#385f8b',
  ray:summonerBarColors.fill,light:summonerBarColors.accent,ring:'#bde8ff',glow:summonerBarColors.accent,glyph:summonerBarColors.fill,
  outline:'#ddf4ff',title:summonerBarColors.accent,shadow:'#244d79',subtitle:'#bcddf4',
};
export function drawBossArrival(canvas,{title,word,type,legend=false,kind},progress=0.5){
  const colors=kind==='summoner'?blueArrival:goldArrival;
  const c=canvas.getContext('2d'),w=780,h=372;if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
  const enter=Math.min(1,progress/.16),leave=progress>.83?(1-progress)/.17:1;
  c.clearRect(0,0,w,h);c.globalAlpha=Math.max(0,Math.min(1,leave));c.translate(-(1-enter)*w,0);
  const poly=(pts,fill)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();};
  poly([[0,59],[780,0],[780,308],[0,365]],colors.paper);
  for(let j=0;j<14;j++){const y=28+j*23;c.strokeStyle=j%3?colors.ink:colors.ray;c.lineWidth=j%4===0?5:2;c.beginPath();c.moveTo(j%2?0:640,y);c.lineTo(j%2?155:780,y-27);c.stroke();}
  poly([[0,114],[780,20],[780,283],[0,343]],colors.panel);poly([[0,102],[780,8],[780,21],[0,117]],colors.edge);
  c.save();c.beginPath();c.moveTo(0,117);c.lineTo(780,21);c.lineTo(780,283);c.lineTo(0,343);c.closePath();c.clip();
  c.fillStyle=colors.dots;for(let x=0;x<w;x+=9)for(let y=0;y<h;y+=9)c.fillRect(x,y,1.5,1.5);c.restore();
  c.save();c.translate(621,143);c.rotate(-.08);const glow=c.createRadialGradient(0,0,12,0,0,145);glow.addColorStop(0,colors.glow+'cc');glow.addColorStop(1,colors.glow+'00');c.fillStyle=glow;c.fillRect(-145,-145,290,290);
  for(let j=0;j<12;j++){c.rotate(Math.PI/6);poly([[0,-127],[11,-74],[-11,-74]],j%2?colors.ray:colors.light);}
  c.beginPath();c.arc(0,0,124,0,Math.PI*2);c.strokeStyle=colors.ring;c.lineWidth=3;c.stroke();
  c.font='bold '+(word.length>1?106:174)+'px "Ziling Swei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.strokeStyle=colors.outline;c.lineWidth=10;c.strokeText(word,0,4);c.fillStyle=legend?'#a32c22':colors.glyph;c.fillText(word,0,4);c.restore();
  c.save();c.translate(35,175);c.rotate(-.105);c.font='bold 72px "Ziling Swei",sans-serif';c.lineJoin='round';c.strokeStyle=colors.shadow;c.lineWidth=8;c.strokeText(title,0,0);c.fillStyle=colors.title;c.fillText(title,0,-4);
  c.font='bold 27px "Ziling Swei",sans-serif';c.fillStyle=colors.subtitle;c.fillText(word+'  /  '+type,14,58);c.restore();
  for(let j=0;j<10;j++){c.save();c.translate((j*109+41)%780,(j*43+24)%350);c.rotate(.5);c.fillStyle=j%2?colors.light:colors.edge;c.fillRect(0,0,5,14);c.restore();}
}
// Only the status paper changes brightness; its lettering and icon stay steady.
const weatherColors={
  eclipse:{ink:'#E7D7FF',low:[53,40,72],high:[108,73,134]},
  storm:{ink:'#FFDE89',low:[65,53,36],high:[118,91,35]},
  blizzard:{ink:'#F1FAFF',low:[49,65,81],high:[93,116,133]},
  fog:{ink:'#D7E8E9',low:[44,59,68],high:[76,101,111]},
  spout:{ink:'#CDEAFF',low:[41,57,79],high:[62,97,130]},
};
function drawEventMark(canvas,kind){
  const c=canvas.getContext('2d');
  c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,16,16);c.lineWidth=1.5;c.lineCap='round';c.lineJoin='round';
  c.strokeStyle=c.fillStyle=weatherColors[kind]?.ink||'#E5BE78';
  c.beginPath();
  if(kind==='eclipse'){
    c.arc(8,8,4.2,0,Math.PI*2);c.stroke();
    for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(8+Math.cos(a)*6,8+Math.sin(a)*6);c.lineTo(8+Math.cos(a)*7,8+Math.sin(a)*7);c.stroke();}
  }else if(kind==='storm'){
    c.moveTo(9,1);c.lineTo(3,9);c.lineTo(7,9);c.lineTo(6,15);c.lineTo(13,6);c.lineTo(9,6);c.closePath();c.fill();
  }else if(kind==='blizzard'){
    for(let i=0;i<6;i++){
      c.save();c.translate(8,8);c.rotate(i*Math.PI/3);
      c.beginPath();c.moveTo(0,0);c.lineTo(0,-6.5);c.moveTo(-2,-4);c.lineTo(0,-3);c.lineTo(2,-4);c.stroke();c.restore();
    }
  }else if(kind==='spout'){
    c.moveTo(1,4);c.lineTo(14,4);c.moveTo(3,8);c.lineTo(11,8);c.moveTo(5,12);c.lineTo(9,12);c.stroke();
  }else if(kind==='fog'){
    for(const [x,y,end] of [[4,4,13],[1,8,12],[5,12,15]]){c.moveTo(x,y);c.lineTo(end,y);}c.stroke();
  }else{
    c.arc(8,8,5.8,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(8,4);c.lineTo(10.5,8);c.lineTo(8,12);c.lineTo(5.5,8);c.closePath();c.fill();
  }
  canvas.dataset.frame=kind;
}
export function installReviewBattle(hud,run,stack,{wordFor,typeName,typeOf}){
  const queue=new ReviewFeedbackQueue();let timer=0,arrival=null,started=0,session=0,lastSuccess=-1,captureWord='',flag=null,shown=null;
  const feed=el('div','zx-combat-feed'),teamRow=el('div','zx-combat-team'),feedback=el('div','zx-combat-feedback');
  hud.els.boss.classList.add('zx-review-boss');hud.els.boss.dataset.uiLayer='boss';
  hud.els.boss.dataset.paperSurface='boss-strip';hud.els.bossPt.dataset.paperSurface='boss-seal';
  for(const mini of hud.minis){
    mini.el.classList.add('zx-review-boss');
    mini.el.dataset.paperSurface='boss-strip';
    mini.pt.dataset.paperSurface='boss-seal';
  }
  const directions=new Map();
  for(const marker of [hud.arrow,...hud.pins]){
    marker.classList.add('zx-guide-pin');
    const tip=marker.children[0],canvas=el('canvas','zx-guide-needle',[],{width:128,height:128,'aria-hidden':'true','data-static':'true'});
    tip.append(canvas);marker.children[2].dataset.paperSurface='guide-distance';
    directions.set(marker,{tip,canvas,key:''});
  }
  const lane=el('div','zx-battle-lane');
  const event=hud.els.event,mark=el('canvas','zx-event-mark',[],{'aria-hidden':'true','data-static':'true'});
  mark.width=mark.height=32;
  event.className='zx-world-status';
  event.setAttribute('role','timer');event.dataset.uiLayer='weather';event.append(mark);
  lane.append(event,feed);stack.append(lane);
  feed.append(hud.els.boss,hud.minisEl,teamRow,feedback);
  let paintedTone='';
  function syncEvent(){
    const active=event.style.display!=='none';
    if(active!==lane.classList.contains('with-event'))lane.classList.toggle('with-event',active);
    if(!active)return;
    const kind=event.dataset.kind,colors=weatherColors[kind];
    if(mark.dataset.frame!==kind){
      drawEventMark(mark,kind);
      event.style.width=(65+Math.max(2,event.children[0].textContent.length)*14)+'px';
    }
    const calm=run.meta.profile.settings.reduceFlashes;
    const step=colors&&!calm?Math.round(6-6*Math.cos(performance.now()*2*Math.PI/2600)):5;
    const tone=kind+'/'+step;
    if(tone!==paintedTone){
      event.style.backgroundColor=colors?'rgba('+colors.low.map((v,i)=>Math.round(v+(colors.high[i]-v)*step/12)).join(',')+',.94)':'rgba(25,30,39,.72)';
      paintedTone=tone;
    }
  }
  function placeTeam(coopHud){
    const group=coopHud?.teamLayer??coopHud?.team;
    if(!group||group.parentElement===teamRow)return;
    if(coopHud.teamLayer)group.style.cssText='position:relative;width:100%;overflow:visible;pointer-events:none';
    teamRow.append(group);
  }
  const flash=()=>{window.invalidateUI?.();};
  const tick=()=>{
    timer=0;if(!hud.root.isConnected){queue.clear();return;}
    const now=performance.now();
    if(arrival){
      const p=Math.min(1,(now-started)/1400);
      if(p>=1||!arrival.el.isConnected){arrival.el.remove();arrival=null;}
      else drawBossArrival(arrival.canvas,arrival.data,p);
      flash();
    }
    const item=queue.tick(now,!!arrival||!!hud.modalEl?.isConnected||run.state==='modal'||run.state==='cinematic');
    if(item!==shown){
      flag?.remove();flag=null;shown=item;
      if(item){
        flag=el('canvas','zx-review-capture-flag',[],{width:280,height:72,role:'status','aria-live':'polite','aria-label':item.word+' · '+(item.ok?'抓字成功':'抓字失败')});flag.width=280;flag.height=72;flag.dataset.static='true';flag.dataset.result=item.ok?'success':'failed';
        const c=flag.getContext('2d');c.beginPath();c.moveTo(0,0);c.lineTo(280,0);c.lineTo(280,72);c.lineTo(0,72);c.lineTo(18,36);c.closePath();c.fillStyle=item.ok?'#E2ECFC':'#F5E4EB';c.fill();c.fillStyle=item.ok?'#2879F0':'#EB4D62';c.fillRect(274,0,6,72);
        c.font='bold 32px "Ziling Swei",sans-serif';c.fillStyle=item.ok?'#244F9B':'#932F46';c.textBaseline='middle';c.textAlign='center';c.fillText(item.word,47,36);c.font='bold 27px "Ziling Swei",sans-serif';c.fillText(item.ok?'抓字成功':'抓字失败',174,36);
        feedback.append(flag);
      }
      flash();
    }
    if(arrival||queue.active||queue.pending.length)timer=setTimeout(tick,33);
  };
  const wake=()=>{if(!timer)timer=setTimeout(tick,0);};
  let bulletin=null,bulletinTimer=0;
  const clearBulletin=()=>{clearTimeout(bulletinTimer);bulletin?.remove();bulletin=null;};
  hud.banner=(title,subtitle,color,subject)=>{
    const rare=subject?.shiny||subject?.classic;
    if(!hud.bigBanners&&!rare){hud.toast(subtitle?title+' · '+subtitle:title,null);return;}
    clearBulletin();
    const portrait=subject?glyphPreview(subject.species,.75,'pix',subject.glyph||wordFor(subject.species)):null;
    const type=subject?.classic?'经典异色':subject?.shiny?'异色':'';
    bulletin=el('div','zx-scene-bulletin',[portrait,el('div','zx-bulletin-copy',[
      el('div','zx-bulletin-title',[el('b','',title),type?el('small','',type):null]),
      subtitle?el('span','',subtitle):null,
    ])],{role:'status','aria-live':'polite','data-paper-surface':'scene-bulletin'});
    feed.append(bulletin);bulletinTimer=setTimeout(clearBulletin,rare?5200:3200);
  };
  let tracking=null,announcement=null;
  const clearTrack=()=>{tracking?.remove();tracking=null;};
  const oldStart=hud.captureStart.bind(hud);
  hud.captureStart=(species,shiny,master,friend=false,word)=>{
    clearBulletin();clearTrack();captureWord=word||wordFor(species);session++;oldStart(species,shiny,master,friend,word);
    const film=hud.capEl;
    const plate=film?.querySelector('.cap-plate');
    if(!plate)return;
    const portrait=plate.querySelector('.cap-pt').firstElementChild,balls=plate.querySelector('.cap-pips');
    balls.className='zx-catch-pips';
    const caption=[friend?'招募伙伴':'抓字中',shiny?'异色':'',master&&!friend?'大师球':''].filter(Boolean).join(' · ');
    tracking=el('div','zx-catch-track',[el('span','zx-call-portrait',portrait),el('div','zx-call-copy',[
      el('small','',caption),el('b','',captureWord),
    ]),balls],{role:'status','aria-label':caption+' · '+captureWord,'data-paper-surface':'capture-track'});
    film.classList.add('zx','zx-capture-focus');film.dataset.uiRegion='capture-stage';
    plate.replaceWith(tracking);hud.root.append(film);
  };
  const oldShake=hud.captureShake.bind(hud),oldEnd=hud.captureEnd.bind(hud);
  hud.captureShake=step=>{
    if(!tracking){oldShake(step);return;}
    const balls=tracking.querySelectorAll('.zx-catch-pips i');
    balls.forEach((ball,i)=>ball.classList.toggle('on',i<step));
    tracking.setAttribute('aria-label',tracking.textContent+' · '+step+'/'+balls.length);
  };
  hud.captureEnd=()=>{clearTrack();oldEnd();};
  let announceTimer=0;
  const clearAnnouncement=()=>{clearTimeout(announceTimer);announcement?.remove();announcement=null;};
  hud.ultCutIn=(species,name)=>{
    clearAnnouncement();
    announcement=el('div','zx-ultimate-call',[
      el('span','zx-call-portrait',glyphPreview(species,1)),
      el('div','zx-call-copy',[el('small','','大招'),el('b','',name)]),
    ],{role:'status','aria-label':'大招 · '+name,'data-paper-surface':'ultimate-call','data-ui-layer':'ultimate-cutin'});
    announcement.style.width=Math.min(288,Math.max(198,Array.from(name).length*18+77))+'px';
    feed.append(announcement);
    announceTimer=setTimeout(clearAnnouncement,1300);
  };
  hud.captureResult=ok=>{
    if(ok)lastSuccess=session;
    if(tracking){
      const result=ok?'抓字成功':'抓字失败';
      tracking.querySelector('.zx-call-copy small').textContent=result;
      tracking.setAttribute('aria-label',captureWord+' · '+result);
      return;
    }
    queue.push({word:captureWord||wordFor(run.capture?.species),ok});wake();
  };
  hud.caught=(species)=>{
    if(lastSuccess===session){lastSuccess=-1;return;}
    queue.push({word:wordFor(species),ok:true});wake();
  };
  hud.bossIntro=(species,legend,duration,word,role,kind)=>{
    arrival?.el.remove();hud.hudEl.querySelectorAll('.bossintro').forEach(n=>n.remove());
    const title=role+'来袭',glyph=word||wordFor(species);
    const canvas=el('canvas','zx-review-boss-art',[],{'aria-hidden':true});
    const panel=el('div','zx-review-arrival',canvas,{role:'status','aria-label':title+' · '+glyph});
    panel.dataset.uiLayer='boss-arrival';hud.root.append(panel);started=performance.now();arrival={el:panel,canvas,data:{title,word:glyph,type:typeName(typeOf(species)),legend,kind}};wake();
    // Presentation never resumes combat; the existing run.introBoss lifecycle owns it.
  };
  const clear=hud.clear?.bind(hud);
  if(clear)hud.clear=(...args)=>{clearTrack();clearAnnouncement();clearBulletin();clearTimeout(timer);queue.clear();arrival?.el.remove();flag?.remove();clear(...args);};
  // Compass tips extend above their zero-size screen anchor. Keep them below
  // visible status slips even when an offscreen target points toward the header.
  function placeMarkers(){
    const markers=[hud.arrow,hud.markTag,...hud.pins].filter(n=>n.style.display!=='none');
    if(!markers.length)return;
    const origin=markers[0].parentElement.getBoundingClientRect();
    const floor=lane.getBoundingClientRect().bottom-origin.top;
    const ultimate=hud.touch.ult.getBoundingClientRect();
    const controlBottom=hud.touch.act.style.display==='none'?ultimate.bottom:hud.touch.act.getBoundingClientRect().bottom;
    for(const marker of markers){
      const direction=directions.get(marker);
      if(direction){
        const badge=marker.children[1].firstElementChild;
        if(badge&&badge.dataset.paperSurface!=='guide-seal')badge.dataset.paperSurface='guide-seal';
        if(direction.tip.style.display!=='none'){
          const angle=parseFloat((direction.tip.style.transform||'').replace('rotate(',''))||0;
          const step=Math.round(angle*180/Math.PI/3),key=step+'';
          if(direction.key!==key){
            const c=direction.canvas.getContext('2d');c.setTransform(2,0,0,2,64,64);c.clearRect(-32,-32,64,64);
            c.rotate(step*3*Math.PI/180);c.beginPath();c.moveTo(0,-30);c.lineTo(7,-18);c.lineTo(0,-21);c.lineTo(-7,-18);c.closePath();
            c.fillStyle='#567BB4';c.fill();c.lineJoin='round';c.lineWidth=1.5;c.strokeStyle='#F3F1FA';c.stroke();
            direction.key=key;direction.canvas.dataset.frame=key;
          }
        }
      }
      const y=parseFloat(marker.style.top),clearance=marker===hud.markTag?30:36;
      if(!Number.isFinite(y))continue;
      const x=parseFloat(marker.style.left)+origin.left;
      let top=Math.max(y,floor+clearance);
      if(direction&&ultimate.width>0&&x>=ultimate.left-28&&x<=ultimate.right+28
        &&top+origin.top+38>=ultimate.top&&top+origin.top-30<=controlBottom){
        top=Math.max(floor+clearance,ultimate.top-origin.top-42);
      }
      if(top!==y)marker.style.top=Math.ceil(top)+'px';
    }
  }
  return {queue,lane,syncEvent,placeTeam,placeMarkers};
}
