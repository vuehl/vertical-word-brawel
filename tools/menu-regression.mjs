import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewMenus({page,tap,resize,shown,dir,sleep,probe=false}){
  const reports=[];
  // Static menu checks do not need continuously rendered software 3D frames.
  // Keep native layout/hit testing live; render the real composited frame for
  // each screenshot. Gameplay smoke tests continue to use the normal loop.
  await page.evaluate(()=>{
    app.halted=true;
    window.menuLayoutTimer=setInterval(()=>inspected.layout.refresh(),100);
  });
  async function snapshot(name,selectors){
    name=name.replace('-before',probe?'-probe':'');
    await sleep(450);
    await page.evaluate(()=>{app.r.render(0);inspected.env.drawUI(app.r.renderer);});
    await page.screenshot({path:path.join(dir,name+'.png')});
    const boxes=await page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>[selector,
      [...inspected.doc.querySelectorAll(selector)].slice(0,12).map(el=>{
        const b=inspected.layout.box(el);
        return b&&{text:el.textContent.slice(0,80),x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip,style:b.s,
          children:[...el.children].map(c=>{const b=inspected.layout.box(c);return b&&{tag:c.localName,class:c.className,text:c.textContent.slice(0,50),x:b.x,y:b.y,w:b.w,h:b.h};})};
      })])),selectors);
    fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(boxes,null,2));
    reports.push(name);
  }
  await resize(390,844);
  await page.evaluate(()=>{app.meta.profile.settings.tours='lab';});
  await tap('.lite-actions button','研究所');
  await snapshot('07-lab-before',['.screen.lab','.scr-head','.lab-wrap','.lab-group','.grp-head','.lab-grid','.lab-card','.lab-bd','.lab-buy']);
  await tap('.lab-mode[data-mode="items"]');
  await snapshot('08-items-before',['.it-tools','.it-filters','.it-slots','.lab-wrap','.it-sec','.ic-grid','.ic','.ic-desc','.ic-foot']);
  await tap('.screen.lab .back-btn');
  await tap('.lite-actions button','设置');
  await snapshot('09-settings-before',['.screen.st','.st-wrap','.st-tabs','.st-tab','.st-pane','.st-head','.st-body','.st-row','.st-range','.st-val']);
  if(probe){console.log('Menu screenshots and layout details:',reports);return;}

  async function geometry(kind){
    const issues=await page.evaluate(kind=>{
      const errors=[],box=el=>el&&inspected.layout.box(el),all=s=>[...inspected.doc.querySelectorAll(s)];
      function inside(child,parent,label){
        const a=box(child),b=box(parent);if(!a)return;
        if(a.w<1||a.h<1||a.x<b.x-1||a.x+a.w>b.x+b.w+1||a.y<b.y-1||a.y+a.h>b.y+b.h+1)
          errors.push(label+' outside parent: '+JSON.stringify([a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h]));
      }
      function after(a,b,label){
        a=box(a);b=box(b);if(a&&b&&a.y+a.h>b.y+1)errors.push(label+' overlaps by '+(a.y+a.h-b.y));
      }
      function sequence(parent,selector){
        const kids=[...parent.querySelectorAll(selector)].filter(box);
        kids.forEach(el=>inside(el,parent,selector));
        for(let i=1;i<kids.length;i++)after(kids[i-1],kids[i],selector);
      }
      for(const selector of ['.scr-head','.lab-hub','.it-tools','.st-tabs','.st-pane'])for(const el of all(selector)){
        const b=box(el);if(!b)continue;
        if(b.x<-1||b.x+b.w>inspected.env.innerWidth+1)errors.push(selector+' exceeds phone width');
      }
      if(kind==='lab'){
        for(const el of all('.lab-card')){
          sequence(el,':scope > .lab-main, :scope > .lab-buy');
          const body=el.querySelector('.lab-bd');
          sequence(body,':scope > h3, :scope > p, :scope > .pips');
          if(box(el).h>240)errors.push('Excessive empty space in upgrade card');
        }
        for(const el of all('.lab-group'))after(el.querySelector('.grp-head'),el.querySelector('.lab-grid'),'Group heading');
      }else if(kind==='items'){
        for(const el of all('.ic'))sequence(el,':scope > .ic-top, :scope > .ic-desc, :scope > .ic-foot');
      }else{
        const tabs=inspected.doc.querySelector('.st-tabs');
        for(const el of all('.st-tab')){
          inside(el,tabs,'Settings tab');inside(el.querySelector('.st-tx'),el,'Settings tab label');
        }
        for(const el of all('.st-row')){
          for(const child of el.children)inside(child,el,'Settings row control');
          if(el.classList.contains('range')||el.classList.contains('segrow'))sequence(el,':scope > *');
          for(const pill of el.querySelectorAll('.seg .pill'))inside(pill,pill.parentNode,'Settings option');
        }
      }
      return errors;
    },kind);
    assert.deepEqual(issues,[],kind+' geometry');
  }
  async function scroll(selector){
    const delta=await page.evaluate(selector=>{
      const el=inspected.doc.querySelector(selector),b=el.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=b.x+b.width*.65-screen.x,y=b.y+b.height*.8-screen.y,before=el.scrollTop;
      window.tap(x,y,'down');window.tap(x,y-100,'move');window.tap(x,y-100,'up');
      return el.scrollTop-before;
    },selector);
    assert.ok(delta>30,selector+' responds to swiping');
  }
  await geometry('settings');
  // Reproduce the values reported in the screenshot, then verify persisted repair.
  const recovered=await page.evaluate(async()=>{
    app.meta.profile.settings.master=81;app.meta.profile.settings.music=65;app.applySettings();await app.meta.saveNow();
    const store=JSON.parse(wx.getFileSystemManager().readFileSync(wx.env.USER_DATA_PATH+'/pokebonk-save.json','utf8'));
    const s=store.accounts[app.meta.account.id].profile.settings;return [s.master,s.music];
  });
  assert.deepEqual(recovered,[.81,.65]);
  await tap('.screen.st .back-btn');await tap('.lite-actions button','设置');
  const values=await page.evaluate(()=>[...inspected.doc.querySelectorAll('.st-row.range .st-val')].map(el=>el.textContent));
  assert.deepEqual(values.slice(0,2),['81%','65%']);
  for(const fraction of [0,.65,1]){
    const result=await page.evaluate(fraction=>{
      const input=inspected.doc.querySelector('.st-range'),r=input.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
      window.tap(r.x+r.width*Math.max(.001,Math.min(.999,fraction))-screen.x,r.y+r.height/2-screen.y);
      return {value:app.meta.profile.settings.master,label:input.parentNode.querySelector('.st-val').textContent};
    },fraction);
    assert.deepEqual(result,{value:fraction,label:Math.round(fraction*100)+'%'});
  }
  await page.evaluate(()=>app.meta.saveNow());
  await scroll('.st-body');
  await tap('.screen.st .back-btn');

  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);
    await tap('.lite-actions button','研究所');await geometry('lab');await scroll('.lab-wrap');
    await page.evaluate(()=>{inspected.doc.querySelector('.lab-wrap').scrollTop=0;});
    await snapshot('lab-'+width,['.lab-card','.lab-bd']);
    await tap('.lab-mode[data-mode="items"]');await geometry('items');await scroll('.lab-wrap');
    await tap('.it-filters .it-f','在你的精灵球中');await geometry('items');
    await tap('.it-filters .it-f','未解锁');await geometry('items');
    await snapshot('items-'+width,['.ic','.ic-desc','.ic-foot']);
    await tap('.screen.lab .back-btn');await tap('.lite-actions button','设置');
    const tabs=await page.evaluate(()=>[...inspected.doc.querySelectorAll('.st-tab')].map(el=>el.querySelector('b').textContent));
    for(const label of tabs){
      await tap('.st-tab',label);await geometry('settings');
      await snapshot('settings-'+width+'-'+label,['.st-row']);
    }
    await tap('.st-tab','声音');await geometry('settings');
    await snapshot('settings-'+width,['.st-head','.st-row']);
    await tap('.screen.st .back-btn');
  }
  // Buying an upgrade rebuilds these cards and must preserve the same layout.
  await resize(390,844);
  await page.evaluate(async()=>{
    // Isolated fixture only: settle two controlled results through the real
    // local API, so the purchase is checked against authoritative currency.
    const cfg={species:4,biome:'forest',tier:0,boosts:[],mode:'standard'};
    for(let i=0;i<2;i++){
      const ticket=await app.backend.startRun(app.meta.account,cfg);
      const result=await app.backend.finishRun(app.meta.account,ticket,{...cfg,stage:4,victory:true,time:600,level:10,kills:10});
      app.meta.adopt(result.profile);
    }
  });
  await tap('.lite-actions button','研究所');
  const upgrade=await page.evaluate(()=>{const c=inspected.doc.querySelector('.lab-card');return {id:c.dataset.u,before:app.meta.profile.lab[c.dataset.u]||0};});
  await tap('.lab-card:first-child .lab-buy');await geometry('lab');
  await page.waitForFunction(()=>app.meta.queued===0);
  assert.equal(await page.evaluate(id=>app.meta.profile.lab[id],upgrade.id),upgrade.before+1);
  await snapshot('07-lab',['.lab-card']);
  await tap('.lab-mode[data-mode="items"]');await geometry('items');await snapshot('08-items',['.ic']);
  await tap('.screen.lab .back-btn');await tap('.lite-actions button','设置');await tap('.st-tab','声音');
  await snapshot('09-settings',['.st-row']);
  const report={passed:true,viewports:[[320,568],[390,844],[430,932]],checks:['card content separation','long descriptions','all settings tabs','scrolling','0..100% volume touch','legacy volume repair and persistence','upgrade purchase reflow'],screenshots:reports};
  fs.writeFileSync(path.join(dir,'menu-regression.json'),JSON.stringify(report,null,2));
  console.log('Menu layout, touch, range values and persistence verified');
}
