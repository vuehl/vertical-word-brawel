import {photoPaper,photoTilt,stagePortrait,albumPhotoMount,albumPreviewCorners} from './first-batch-art.js';
import {collectionRoster,collectionCharacter,collectionState,appearanceName,appearanceOwned,canDeploy,pageOf,collectionPageSize,challengePresentation} from './collection-rules.js';
import {starterSpecies} from '../data/starter-characters.js';
import {drawAppearanceGlyph} from './collection-art.js';
import {profilePrint} from './collection-profile.js';
import {glyphText} from '../data/zixing-identity.js';
import {openMoveDialog,openUltimateDialog} from './collection-move-dialog.js';
import {openCollectionPlan} from './collection-plan.js';
import {albumTab as paperTab,freePaperActions} from './paper-system.js';

// Selection is local to this flow. Browsing, previews and newly captured entries
// never replace it. Only the explicit footer confirmation starts the next step.
export function createCollectionUI(app,api,kit){
  const {el,button,icon,screen,home,confirm,scene}=kit;
  const p=()=>app.meta.profile;
  let selected=null,filter='all',scrollTop=0,scroller=null,view='library',viewId=null,look=null,detailTab=0;
  let profileFace='stats';
  const char=id=>collectionCharacter(id,api);
  const note=t=>el('small','zc-note',t);
  const row=(...nodes)=>el('div','zc-row',nodes);
  const choice=(label,fn,cls='',attrs={})=>button(label,fn,'zc-btn '+cls,attrs);
  const bodyCard=(...children)=>el('div','zc-panel',children);
  const owned=id=>canDeploy(p(),id);
  const progress=id=>app.meta.challengeProgress(id);
  const state=id=>collectionState(p(),id,progress(id));
  const first=()=>!(p().counters?.runs>0 || (p().played??[]).length || (p().league??[]).some(id=>!starterSpecies.includes(id)));
  const glyph=(id,appearance=null,large=false,angle=0)=>{
    const c=char(id),cv=el('canvas','zc-cutout',[],{width:240,height:240,'data-static':true,'aria-label':c.word+' · '+appearanceName(appearance)});
    drawAppearanceGlyph(cv,c.word,c.tone,appearance,large);
    if(angle){cv.dataset.paperTilt=angle;cv.style.transform='rotate('+angle+'deg)';}
    cv.dataset.glyphReady='true';return cv;
  };
  const portrait=(id,appearance=null)=>stagePortrait(char(id),appearance);
  const activeLook=id=>app.meta.skinFor(id);
  function read(id){if(!owned(id)||starterSpecies.includes(id))return;p().collection??={};p().collection.read??=[];if(!p().collection.read.includes(id)){p().collection.read.push(id);app.meta.save();}}
  function mount(name,title,subtitle,body,actions){
    const node=screen(name,title,subtitle,body,[el('div','zc-actions',actions)]);
    node.classList.add('zx-collection');
    node.classList.toggle('zc-short',window.innerHeight<650);
    return node;
  }
  function footer(next,label='选择关卡  →',disabled=false,back=home){
    return [choice('返回',back,'zc-back',{'data-action':'collection-back'}),choice(label,next,'zc-primary',{'data-action':'collection-next',disabled})];
  }
  function resetList(){scroller=null;scrollTop=0;}
  function rememberList(){
    if(!scroller)return;
    scrollTop=scroller.scrollTop;
    scroller=null;
  }
  function open(reset=true){
    if(reset||!owned(selected)){
      const available=collectionRoster.filter(c=>owned(c.id)&&(!first()||starterSpecies.includes(c.id)));
      const last=Number(p().collection?.lastSelected??p().lastSpecies);
      selected=(available.find(c=>c.id===last)??available[0])?.id??null;
      resetList();filter='all';profileFace='stats';
    }
    view='library';render();
  }
  const albumArt=(asset,cls='zc-control-face')=>el('img',cls,[],{
    src:'assets/ui-paper/album-'+asset+'.webp',alt:'','aria-hidden':true,
  });
  function albumTab(label,active,onClick,attrs){
    return paperTab(el,button,label,active,onClick,attrs);
  }
  function profileSlip(){
    const actor=collectionRoster.find(entry=>entry.id===selected);
    const section=el('section','journey-info',[],{'aria-label':'字灵资料'});
    const turn=el('button','journey-face-toggle',[],{type:'button','data-action':'flip-profile','data-paper-surface':'flat'});
    function showFace(){
      const art=profilePrint(selected,actor,api,profileFace);
      const other=profileFace==='stats'?'进阶路线':'基础属性';
      turn.setAttribute('aria-label','切换至'+other);
      section.dataset.face=profileFace;
      // Keep focus, the live scene and the roster scroll position on a flip.
      if(section.firstElementChild)section.firstElementChild.replaceWith(art);
      else section.append(art,turn);
    }
    turn.addEventListener('click',()=>{
      profileFace=profileFace==='stats'?'route':'stats';showFace();
    });
    showFace();
    return section;
  }
  function characterCommands(){
    const action=(label,key,fn,disabled=false)=>choice([albumArt(key),el('span','zc-control-label',label)],fn,'zc-dossier-action',{
      'data-action':'collection-'+key,'data-paper-surface':'flat',disabled:selected===null||disabled,'aria-label':label,
    });
    return el('div','zc-dossier-controls journey-commands',[
      action('招式','moves',()=>moves(selected)),
      action('计划','plan',()=>plan(selected)),
      action(['shiny','classic'].some(look=>appearanceOwned(p(),selected,look))?'换色':'外观','looks',()=>appearances(selected)),
    ],{'aria-label':'所选字灵的功能'});
  }

  function selectFromAlbum(id){
    if(!owned(id)){unlock(id);return;}
    selected=id;
    p().collection??={};
    if(p().collection.lastSelected!==id){p().collection.lastSelected=id;app.meta.save();}
    read(id);render();
  }
  function card(id,intro,index=0,active=selected,onPick=selectFromAlbum){
    const c=char(id),s=state(id),unknown=s==='unknown',isSelected=id===active,isNew=owned(id)&&!starterSpecies.includes(id)&&!(p().collection?.read??[]).includes(id);
    const tag=owned(id)?api.typeName(api.speciesType(id)):s==='ready'?'待抓字':unknown?'未知':'未解锁';
    return choice([
      photoPaper(index,unknown?'unknown':owned(id)?api.speciesType(id):'locked',isSelected,photoTilt(index),intro),
      isSelected?el('span','zc-card-check',icon('saved',12,'#F3F1FA')):null,
      el('span','zc-tag',!intro&&!owned(id)?[icon('lock',11,'#211F54'),el('span','',tag)]:tag),unknown?el('span','zc-mystery','?'):glyph(id,c.previewOnly?null:activeLook(id),false,photoTilt(index)*2),
      intro?el('b','zc-card-name',c.word):null,isNew?el('span','zc-new','新收录'):p().collection?.track===id?el('span','zc-new','已追踪'):null,
    ],()=>onPick(id),'zc-character '+(intro?'intro ':'')+(isSelected?'selected ':'')+(!owned(id)?'locked':''),{
      'data-paper-surface':'flat','data-species':id,'data-state':s,'aria-pressed':isSelected,'aria-label':(unknown?'尚未发现的字灵':c.word)+' · '+tag,
    });
  }
  function rosterPicker(active,category,onFilter,onPick){
    const count=collectionRoster.filter(c=>owned(c.id)).length,total=collectionRoster.length;
    const filtered=collectionRoster.filter(c=>category==='all'||owned(c.id)===(category==='owned'));
    const tabs=[['all','全部'],['owned','可出战 '+count],['locked','待解锁 '+(total-count)]];
    const cards=Array.from({length:Math.ceil(filtered.length/4)},(_,rowIndex)=>
      el('div','zc-grid-row',Array.from({length:4},(_,column)=>{
        const index=rowIndex*4+column,entry=filtered[index];
        return entry?card(entry.id,false,index,active,onPick):el('div','zc-card-spacer');
      })));
    const empty=()=>el('div','zc-empty',[el('b','','当前分类没有字灵'),choice('查看全部',()=>onFilter('all'),'zc-text')]);
    return el('div','zc-library-paper',[
      el('div','zc-filters zc-album-tabs',tabs.map(([id,label])=>
        albumTab(label,category===id,()=>onFilter(id),{'data-filter':id}))),
      el('div','zc-list-sheet',el('div','zc-library-scroll',cards.length?cards:empty(),{'aria-label':'字灵列表'})),
    ]);
  }
  function render(){
    view='library';const intro=first();
    rememberList();
    const album=rosterPicker(selected,filter,id=>{filter=id;resetList();render();},selectFromAlbum);
    album.append(characterCommands());
    const content=[el('div','journey-air',[],{'aria-hidden':'true'}),profileSlip(),album];
    const disabled=selected===null||!owned(selected);
    const actions=[
      choice('返回',()=>scene.travel('home',home),'zc-back',{'data-action':'collection-back'}),
      choice('选择关卡',()=>confirm(selected),'zc-primary',{'data-action':'collection-next',disabled}),
    ];
    const node=mount('choose','选择字灵','',content,actions);
    freePaperActions(node);
    scene.mount(node,selected==null?null:char(selected),selected==null?null:activeLook(selected));
    {
      node.classList.add('zc-library');
      const count=collectionRoster.filter(c=>owned(c.id)).length;
      node.querySelector('.zx-header').append(el('div','zc-catalog-total',
        [icon('book',16,'#DEE8F4'),el('span','','收录'),el('b','',count+' / '+collectionRoster.length)],
        {'aria-label':'字灵收录 '+count+' / '+collectionRoster.length}));
      scroller=node.querySelector('.zc-library-scroll');
      if(scrollTop)scroller.scrollTop=scrollTop;
    }
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    node.dataset.collectionFirst=String(intro);
  }
  function plan(id){
    rememberList();view='plan';
    openCollectionPlan({el,button,mount,footer,portrait:portrait(id,activeLook(id)),name:char(id).word,
      catalog:api.planCatalog(id),saved:p().collection?.plans?.[id],back:render,
      async save(plan){
        p().collection??={};
        const plans=p().collection.plans??={};
        const old=plans[id];plans[id]=plan;
        try{await app.meta.saveNow(true);}
        catch(error){if(old)plans[id]=old;else delete plans[id];throw error;}
      }});
  }
  function moves(id){
    rememberList();
    view='moves';viewId=id;
    const character=char(id);
    function catalog({hasAny,count,results,select}){
      let group='kit';
      const head=el('div','zc-move-head',[portrait(id,activeLook(id)),el('div','zc-move-heading',[
        el('b','',character.word+'的招式'),count])]);
      const groups=[['kit','专属'],[hasAny?'any':'line',hasAny?'通用':'进阶'],['fusion','融合']];
      const nav=el('div','zc-filters zc-album-tabs');
      function drawTabs(){
        nav.replaceChildren(...groups.map(([key,label])=>albumTab(label,key===group,()=>{
          group=key;drawTabs();select(key);results.scrollTop=0;
        },{'data-move-group':key})));
      }
      drawTabs();
      return [head,nav,el('div','zc-move-paper',results)];
    }
    const ultimateInfo=api.collectionUltimate(id),base=ultimateInfo.forms[0];
    const viewFace=el('span','zc-ult-view-face','查看',{'data-paper-surface':'button'});
    const viewUltimate=button(viewFace,()=>{
      openUltimateDialog(el,ultimateInfo,viewUltimate,api.typeName,formId=>glyph(formId,activeLook(id)));
    },'zx-plain zc-ult-view',{'data-paper-surface':'flat','data-action':'view-ultimate','aria-haspopup':'dialog','aria-label':'查看'+base.name+'详情'});
    const ultimate=el('section','zc-kit-ultimate',[
      el('div','zc-ult-heading',[el('div','zc-ult-titles',[el('b','',base.name),el('small','','角色大招 · '+api.typeName(base.type)+' · '+base.category)]),viewUltimate]),
      el('p','',base.desc),
    ]);
    const book=api.collectionMoveBook(id,catalog,(model,trigger)=>openMoveDialog(el,model,trigger),ultimate);
    const node=screen('collection-moves','招式','',[book],[choice('返回',render,'zc-back',{'data-action':'moves-back'})]);
    node.classList.add('zx-collection','zc-move-page');
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    freePaperActions(node);
  }
  function detail(id,tab=0){
    rememberList();
    view='detail';viewId=id;detailTab=tab;read(id);const c=char(id);
    const descendants=api.evolutionIds(id),routes=descendants.map(next=>[id,next,...api.evolutionIds(next)]);
    const content=[el('div','zc-detail-hero paper-info-hero',[portrait(id,activeLook(id)),el('div','zc-copy',[el('h2','',c.word),note(api.typeName(api.speciesType(id))+' · '+appearanceName(activeLook(id)))])]),
      el('div','zc-filters',[...['起手招式','进阶路线','角色属性'].map((label,index)=>choice(label,()=>detail(id,index),'zc-filter'+(tab===index?' active':''),{'data-detail-tab':index}))])];
    if(tab===0){content.push(bodyCard(row(icon('fire',24),el('div','zc-copy',[el('b','',c.move+' · 自动攻击'),note(glyphText(api.moveDescription(id)))])),row(icon('spark',24),el('div','zc-copy',[el('b','',c.ult+' · 大招'),note(glyphText(api.ultDescription(id)))]))));
    }else if(tab===1){content.push(bodyCard(el('b','','进阶路线'),routes.length?el('div','zc-evolutions',routes.map(route=>row(...route.flatMap((n,i)=>[...(i?[el('span','','→')]:[]),el('div','zc-evolution',[glyph(n),el('b','',char(n).word)])])))):note('单字定形 · 无进阶')));
    }else{const stats=api.baseStats(id,app.meta.labStats());content.push(bodyCard(...[['最大生命',stats.maxHp],['伤害倍率',stats.damage],['攻击速度',stats.attackSpeed],['移动速度',stats.moveSpeed],['护甲',stats.armor],['暴击率',Math.round((stats.critChance??0)*100)+'%']].map(([name,value])=>el('div','zc-stat',[note(name),el('b','',typeof value==='number'?String(Math.round(value*100)/100):value??'—')]))),note('包含当前研究所加成'));
    }
    mount('collection-detail',c.word+' · 字灵详情','查看不会改变当前选择',content,footer(()=>appearances(id,()=>detail(id,tab)),'查看外观',false,render));
  }
  let appearanceBack=render;
  function appearances(id,back=render,preview=activeLook(id)){
    rememberList();
    const options=[null,'shiny','classic'],equipped=activeLook(id);
    view='looks';viewId=id;look=options.includes(preview)?preview:null;appearanceBack=back;
    const c=char(id),name=appearanceName(look),has=appearanceOwned(p(),id,look),base=owned(id);
    const current=has&&look===equipped,status=current?'使用中':has?'已获得':'未获得';
    const total=options.filter(value=>appearanceOwned(p(),id,value)).length;
    const hero=el('div','zc-look-hero',[
      el('div','zc-photo-mount',[albumPhotoMount(),stagePortrait(c,look,true)]),
      el('div','zc-look-caption',[el('span','',c.word+'的外观'),el('b','',name),el('small','zc-look-status',status)]),
    ]);
    const tiles=options.map(value=>{
      const available=appearanceOwned(p(),id,value),used=available&&equipped===value,selected=look===value;
      const marker=used?el('span','zc-look-used','使用中'):available?null:el('span','zc-look-lock',icon('lock',13,'#465D78'));
      return el('button','zc-look-tile',[selected?albumPreviewCorners():null,portrait(id,value),
        el('b','zc-look-name',appearanceName(value)),marker],{type:'button','data-paper-surface':'flat','data-look':value??'normal',
        'aria-pressed':selected,'aria-label':appearanceName(value)+' · '+(used?'使用中':available?'已获得':'未获得'),
        onclick:()=>{if(!selected)appearances(id,back,value);}});
    });
    const hint=has?'所选配色会用于接下来的对局。':
      look?'抓获'+name+'的'+c.word+'，即可解锁此外观。':'抓获普通或异色的'+c.word+'，即可解锁普通外观。';
    const sheet=el('div','zc-look-sheet',el('div','zc-look-scroll',[hero,
      el('div','zc-look-index',[el('b','','外观选择'),el('span','','已获得  '+total+' / '+options.length)]),
      el('div','zc-look-tiles',tiles),
      el('div','zc-look-note',[el('div','zc-look-note-title',[has?null:icon('lock',16,'#465D78'),el('b','',has?'外观效果':'获取方式')]),el('p','',hint)]),
    ]),{'data-paper-surface':'album-page'});
    const actions=footer(async()=>{
      if(!base){unlock(id,()=>appearances(id,back,look));return;}
      if(!appearanceOwned(p(),id,look))return;
      app.meta.setSkin(id,look);
      try{await app.meta.saveNow(true);}catch(error){app.meta.setSkin(id,equipped);throw error;}
      back();
    },!base?'查看解锁方式':current?'使用中':has?'使用'+name:'尚未解锁',base&&(!has||current),back);
    if(actions[1].disabled)actions[1].dataset.paperSurface='button-muted';
    const node=mount('collection-looks','字灵外观','',[sheet],actions);
    node.querySelector('.zx-body').dataset.paperSurface='flat';
    freePaperActions(node);
  }
  let unlockBack=render;
  function challengeRow(part){
    const {headline,caption,tally,complete}=challengePresentation(part);
    const value=Math.min(part.value,part.goal);
    return el('div','zc-challenge-row',[
      el('b','zc-challenge-task',headline),
      el('div','zc-challenge-numbers',[el('span','',complete?'已达成':caption),el('b','',tally)]),
      el('div','zc-challenge-meter',el('i','',[],{style:'width:'+value/part.goal*100+'%'}),{
        role:'progressbar','aria-label':headline,'aria-valuemin':0,'aria-valuemax':part.goal,'aria-valuenow':value,'aria-valuetext':tally,
      }),
    ],{'data-complete':complete});
  }
  function unlock(id,back=render){
    rememberList();
    view='unlock';viewId=id;unlockBack=back;
    const c=char(id);
    if(c.previewOnly){
      const hero=el('div','zc-unlock-identity',[portrait(id),el('div','zc-unlock-name',[
        el('h2','',c.word),el('span','',api.typeName(c.type)+'属性')])]);
      const sheet=el('div','zc-unlock-record',[el('h3','zc-challenge-task','未解锁'),
        el('p','zc-discovery-copy','这个字灵尚未开放出战。')],{'data-paper-surface':'unlock-record'});
      const node=mount('collection-unlock','解锁字灵','',[hero,sheet],[choice('返回',back,'zc-back',{'data-action':'collection-back'})]);
      node.dataset.unlockState='locked';
      node.querySelector('.zx-body').dataset.paperSurface='flat';
      return;
    }
    const pr=progress(id),s=state(id);
    const unknown=s==='unknown',ready=s==='ready',available=s==='owned',tracked=p().collection?.track===id;
    const finished=pr.parts.filter(part=>part.value>=part.goal).length;
    const hero=el('div','zc-unlock-identity',[
      unknown?el('span','paper-stage-photo zc-unknown-print',[el('img','',[],{src:'assets/ui-paper/stage-portrait.webp',alt:''}),el('b','','?')],{'aria-hidden':true,'data-paper-surface':'flat'}):portrait(id),
      el('div','zc-unlock-name',[el('h2','',unknown?'未知字灵':c.word),
        unknown?null:el('span','',api.typeName(api.speciesType(id))+'属性'),
        tracked&&!unknown?el('b','zc-tracking-mark','已追踪'):null]),
    ]);
    const sectionTitle=(title,meta)=>el('div','zc-challenge-heading',[el('b','',title),meta?el('small','',meta):null]);
    const pathNote=(label,description)=>el('div','zc-capture-next',[el('b','',label),el('p','',description)]);
    const alt=el('div','zc-capture-alt',[icon('spark',23,'#90657B'),el('div','zc-copy',[
      el('b','','异色抓获'),el('p','','抓获异色「'+c.word+'」也可直接解锁出战。')])]);
    let body;
    if(unknown){
      body=[sectionTitle('发现线索'),el('h3','zc-challenge-task','在旅程中发现字灵'),
        el('p','zc-discovery-copy','遇见字灵或推进它的挑战后，这里会显示解锁条件。')];
    }else if(available){
      body=[sectionTitle('收录状态'),el('h3','zc-challenge-task','已解锁出战'),el('p','zc-discovery-copy','可在「选择字灵」中选用。')];
    }else{
      const normal=ready
        ?[pathNote('去抓获「'+c.word+'」','挑战已完成。在旅程中遇到可抓获的「'+c.word+'」时，先削弱它，再靠近抓获。成功后即可出战。')]
        :pr.parts.map(challengeRow);
      body=[sectionTitle(ready?'当前目标':'解锁挑战',!ready&&pr.parts.length>1?finished+' / '+pr.parts.length+' 项完成':''),
        ...normal];
      if(!ready){
        const blocked=pr.parts.some(part=>part.value<part.goal&&/desert|coast|glacier|volcano|swamp|ruins|tundra/.test(part.counter));
        if(blocked)body.push(el('p','zc-unlock-unavailable','部分挑战依赖尚未开放的关卡。'));
        body.push(pathNote(pr.parts.length>1?'全部达成后 · 普通抓获':'达成后 · 普通抓获','遇到可抓获的「'+c.word+'」时，先削弱它，再靠近抓获。成功后即可出战。'));
      }
      body.push(alt);
    }
    const sheet=el('div','zc-unlock-record',body,{'data-paper-surface':'unlock-record','data-many':pr.parts.length>1});
    const actions=unknown?[choice('返回',back,'zc-back',{'data-action':'collection-back'})]:available?
      footer(()=>appearances(id,()=>unlock(id,back)),'查看外观',false,back):footer(()=>{
      p().collection??={};p().collection.track=tracked?null:id;app.meta.save();unlock(id,back);
    },tracked?'取消追踪':'追踪字灵',false,back);
    const node=mount('collection-unlock','解锁字灵','',[hero,sheet],actions);
    node.dataset.unlockState=s;
    if(!unknown&&!available){
      const previous=p().collection?.track;
      const hint=tracked?'已在字灵列表标记，可随时取消追踪。':previous!=null?'将替换当前追踪的「'+char(previous).word+'」。':'追踪后，会在字灵列表中标记这个字。';
      node.querySelector('.zx-footer').prepend(el('small','zc-track-hint',hint));
    }
    node.querySelector('.zx-body').dataset.paperSurface='flat';
  }
  let rewardEntries=[],rewardBack=home,rewardPage=0;
  function rewards(entries,back=home,index=0){
    rememberList();
    view='rewards';rewardEntries=entries;rewardBack=back;rewardPage=index;
    const pager=pageOf(entries,index,window.innerHeight<650?2:4);
    const content=[el('div','zc-register-title',[el('b','','收录记录'),note('共 '+entries.length+' 项')]),...pager.items.map(entry=>{
      const c=char(entry.id);return el('div','zc-reward',[portrait(entry.id,entry.look),el('div','zc-copy',[el('b','',c.word+' · '+(entry.kind==='base'?'新字灵':appearanceName(entry.look))),note(entry.kind==='base'?'已加入可出战库':'字灵与外观均已解锁')])]);
    })];
    if(pager.pages>1)content.push(el('div','zc-pager',[choice('‹',()=>rewards(entries,back,pager.page-1),'',{'aria-label':'上一页',disabled:pager.page===0}),note((pager.page+1)+' / '+pager.pages+' 页'),choice('›',()=>rewards(entries,back,pager.page+1),'',{'aria-label':'下一页',disabled:pager.page===pager.pages-1})]));
    const node=mount('collection-rewards','本局新收录','',[el('div','zc-register',content,{'data-paper-surface':'album-page'})],footer(()=>open(),'选择字灵',false,back));
    node.querySelector('.zx-body').dataset.paperSurface='flat';
  }
  let size=0;
  const onResize=()=>{const next=collectionPageSize(window.innerHeight);if(next===size)return;size=next;if(app.screen?.classList.contains('zx-collection')){
    if(view==='library')render();else if(view==='detail')detail(viewId,detailTab);else if(view==='looks')appearances(viewId,appearanceBack,look);else if(view==='unlock')unlock(viewId,unlockBack);else if(view==='rewards')rewards(rewardEntries,rewardBack,rewardPage);
  }};
  window.addEventListener('resize',()=>window.setTimeout(onResize,80));
  return {open,rosterPicker,detail,appearances,unlock,rewards,get selection(){return selected;}};
}

