import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {reviewItems} from './item-regression.mjs';
import {reviewExperience} from './experience-regression.mjs';

export async function reviewZixing({page,tap,resize,dir,sleep,menusOnly=false,perfOnly=false}) {
  const reports=[];
  // Software-rendered runs intentionally draw at 4 FPS. The animation starts
  // after its first rasterized frame, so 350 ms from DOM insertion need not
  // mean its final HUD pixels are ready. Transition frames have their own test.
  const settleModal=()=>page.waitForFunction(()=>!inspected.modalTransition?.active,{timeout:10000,polling:50});
  async function snapshot(name){
    await sleep(350);
    await settleModal();
    await page.waitForFunction(()=>[...inspected.doc.querySelectorAll('img')].every(img=>{
      const b=inspected.layout.box(img);
      if(!b||!img.src||!b.opacity||b.w<.1||b.h<.1||b.x+b.w<b.clip.x||b.y+b.h<b.clip.y||b.x>b.clip.r||b.y>b.clip.b)return true;
      return img.complete&&img.naturalWidth>0&&img.naturalHeight>0;
    }),{timeout:10000,polling:100});
    await page.screenshot({path:path.join(dir,name+'.png')});
    const data=await page.evaluate(()=>{
      const all=[...inspected.doc.querySelectorAll('.zx button,.zx input,.zx-header,.zx-footer')];
      const centered=[...inspected.doc.querySelectorAll('.zx-card>strong,.zx-lock .zx-col>b,.zx-lock .zx-col>small,.zx-difficulty .zx-col>h3,.zx-card>.zx-row>.zx-col>b,.zx-card>.zx-row>.zx-col>small,.zx-modal>h2,.zx-buy>b,.zx-slot>b')].map(el=>{
        const b=inspected.layout.box(el),t=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()),tb=t&&inspected.layout.box(t);
        return b&&tb&&{text:el.textContent,offset:(tb.x+tb.w/2)-(b.x+b.w/2)};
      }).filter(Boolean);
      const leftAligned=[...inspected.doc.querySelectorAll('.zx-offer .zx-col>b,.zx-offer .zx-col>small')].map(el=>{
        const b=inspected.layout.box(el),t=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()),tb=t&&inspected.layout.box(t);
        return b&&tb&&{text:el.textContent,offset:tb.x-b.x};
      }).filter(Boolean);
      const box=sel=>inspected.layout.box(inspected.doc.querySelector(sel));
      const upgrade=inspected.doc.querySelector('.zx-upgrade'),pause=inspected.doc.querySelector('.zx-pause');
      const upgradeLayout=upgrade&&{extraHints:[...upgrade.children].filter(e=>e.localName==='small').length,linkRight:box('.zx-upgrade-stats').x+box('.zx-upgrade-stats').w,cardRight:box('.zx-offer').x+box('.zx-offer').w};
      const pauseLayout=pause&&{page:{x:box('.zx-pause').x,y:box('.zx-pause').y,w:box('.zx-pause').w,h:box('.zx-pause').h},tags:pause.querySelectorAll('.zx-build-tag').length,buildHeading:pause.textContent.includes('本局构筑'),actions:[...pause.querySelectorAll('.zx-pause-actions button')].map(el=>{const b=inspected.layout.box(el);return {x:b.x,w:b.w,h:b.h};})};
      const home=inspected.doc.querySelector('.zx-home-top'),homeLayout=home&&{gear:box('.zx-gear'),header:box('.zx-home-top'),scroll:box('.zx-home-scroll')};
      const unresolvedColors=[...inspected.doc.querySelectorAll('.zx *')].flatMap(el=>[...el.childNodes]).filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>({text:n.textContent,color:inspected.layout.box(n)?.s.color})).filter(t=>t.color&&/^(inherit|initial|unset|currentcolor)$/i.test(t.color));
      const settingsColors=[...inspected.doc.querySelectorAll('.zx-settings .zx-tab:not(.on),.zx-settings .zx-subtab:not(.on),.zx-settings .zx-option:not(.on),.zx-settings .zx-plain,.zx-settings .zx-footer button')].map(el=>({text:el.textContent,color:inspected.layout.box(el)?.s.color})).filter(t=>t.color);
      const prices=[...inspected.doc.querySelectorAll('.zx-buy')].map(el=>{
        const b=inspected.layout.box(el);if(!b)return null;
        const labels=[...el.children].map(label=>inspected.layout.box(label.firstChild));
        if(labels.some(t=>!t))return null;
        const top=Math.min(...labels.map(t=>t.y)),bottom=Math.max(...labels.map(t=>t.y+t.h));
        return {text:el.textContent,verticalOffset:(top+bottom)/2-(b.y+b.h/2),horizontalOffsets:labels.map(t=>(t.x+t.w/2)-(b.x+b.w/2)),topInset:top-b.y,bottomInset:b.y+b.h-bottom,color:b.s.color};
      }).filter(Boolean);
      return {page:app.screen?.dataset.page,dark:inspected.doc.documentElement.classList.contains('zx-dark'),viewport:[inspected.env.innerWidth,inspected.env.innerHeight],centered,leftAligned,upgradeLayout,pauseLayout,homeLayout:homeLayout&&Object.fromEntries(Object.entries(homeLayout).map(([key,b])=>[key,{x:b.x,y:b.y,w:b.w,h:b.h}])),unresolvedColors,settingsColors,prices,boxes:all.map(e=>{
        const b=inspected.layout.box(e);return b&&{text:e.textContent.slice(0,60),class:e.className,x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip};
      }).filter(Boolean)};
    });
    fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(data,null,2));
    for(const b of data.boxes)assert.ok(b.w>0&&b.x>=-1&&b.x+b.w<=data.viewport[0]+1,name+' outside width: '+JSON.stringify(b));
    for(const b of data.centered)assert.ok(Math.abs(b.offset)<=1.1,name+' text not centered: '+JSON.stringify(b));
    for(const b of data.leftAligned)assert.ok(Math.abs(b.offset)<=1.1,name+' offer text not left aligned: '+JSON.stringify(b));
    assert.deepEqual(data.unresolvedColors,[],name+' must resolve text colors before Canvas painting');
    if(!data.dark)for(const b of data.settingsColors)assert.equal(b.color,'#29263c',name+' needs dark text on pale controls: '+b.text);
    for(const b of data.prices){
      assert.ok(Math.abs(b.verticalOffset)<=1.1&&b.horizontalOffsets.every(v=>Math.abs(v)<=1.1),name+' price label group is not centered: '+JSON.stringify(b));
      assert.ok(b.topInset>=4&&b.bottomInset>=4,name+' price labels overflow the circle: '+JSON.stringify(b));
      assert.equal(b.color,'#29263c',name+' prices need dark text on pastel buttons');
    }
    if(data.upgradeLayout){assert.equal(data.upgradeLayout.extraHints,0,'Upgrade dialog must omit the three extra hints');assert.ok(Math.abs(data.upgradeLayout.linkRight-data.upgradeLayout.cardRight)<=1.1,'Upgrade attributes link must align with the right card edge');}
    if(data.pauseLayout){assert.ok(data.pauseLayout.tags>0&&!data.pauseLayout.buildHeading,'Pause build should use compact tags');assert.equal(data.pauseLayout.actions.length,2);assert.ok(Math.abs(data.pauseLayout.actions[0].w-data.pauseLayout.actions[1].w)<=1.1,'Pause actions must have equal widths');}
    if(data.pauseLayout)assert.deepEqual(data.pauseLayout.page,{x:0,y:0,w:data.viewport[0],h:data.viewport[1]},'Pause must cover the full usable viewport');
    if(data.homeLayout){const {gear,header,scroll}=data.homeLayout;assert.ok(gear.y>=header.y+8&&gear.y+gear.h+8<=scroll.y&&gear.x+gear.w<=data.viewport[0]-16,'Settings must remain clear of the illustration and screen edge');}
    reports.push(name);
  }
  async function checkUpgradeModal(name){
    await settleModal();
    const data=await page.evaluate(()=>{
      const doc=inspected.doc,wrap=doc.querySelector('.zx-modal-wrap'),dialog=wrap.querySelector('.zx-upgrade');
      const screen=doc.getElementById('game').getBoundingClientRect(),bounds=dialog.getBoundingClientRect();
      const canvas=inspected.uiCanvas,ctx=canvas.getContext('2d'),scale=canvas.width/screen.width;
      const rgba=(x,y)=>Array.from(ctx.getImageData(Math.floor(x*scale),Math.floor(y*scale),1,1).data);
      const points=[[1,1],[screen.width-2,1],[1,screen.height-2],[screen.width-2,screen.height-2],
        [1-screen.x,1-screen.y],[1-screen.x,inspected.env.innerHeight-2-screen.y]];
      const pixels=points.map(([x,y])=>rgba(x,y));
      const cards=[...dialog.querySelectorAll('[data-offer]')].map(el=>{
        const s=inspected.layout.box(el).s;
        return {selected:el.matches('.featured,.on,.selected,.pad-focus,[aria-selected="true"],[aria-checked="true"]'),background:s.background,border:s.border,borderColor:s['border-color']};
      });
      const state=()=>({state:app.run.state,time:app.run.time,gold:app.run.gold,rerolls:app.run.rerolls,pending:app.run.pendingLevels,
        moves:app.run.player.moves.filter(Boolean).map(m=>[m.def.id,m.level]),vitamins:[...app.run.player.vitamins].map(([id,v])=>[id,v.level]),items:[...app.run.player.items]});
      const before=state();let leakedClicks=0;
      const controls=[...doc.querySelectorAll('.zx-hud button,.zx-minimap,.tc button')],onClick=()=>leakedClicks++;
      controls.forEach(el=>el.addEventListener('click',onClick));
      // Tap the gutters, modal margins and exposed HUD controls. None may
      // dismiss the dialog, grant a reward or reach the game underneath.
      const targets=[...points,[screen.width/2,1],[screen.width/2,screen.height-2]];
      for(const el of controls){const b=el.getBoundingClientRect();targets.push([b.x+b.width/2-screen.x,b.y+b.height/2-screen.y]);}
      let blocked=0;
      for(const [x,y] of targets){
        const localX=x+screen.x,localY=y+screen.y;
        if(localX>=bounds.left&&localX<=bounds.right&&localY>=bounds.top&&localY<=bounds.bottom)continue;
        window.tap(x,y);blocked++;
      }
      window.tap(2-screen.x,20-screen.y,'down');window.tap(2-screen.x,100-screen.y,'move');window.tap(2-screen.x,100-screen.y,'up');
      controls.forEach(el=>el.removeEventListener('click',onClick));
      return {pixels,cards,blocked,leakedClicks,before,after:state(),sameModal:wrap===app.run.ui.modalEl,
        stick:Math.hypot(app.run.input.stickX,app.run.input.stickY)};
    });
    for(const pixel of data.pixels){assert.equal(pixel[3],128,name+' backdrop must cover every screen edge exactly once');assert.deepEqual(pixel,data.pixels[0],name+' safe-area seams must have the same tint');}
    assert.ok(data.cards.length>=3&&data.cards.every(card=>!card.selected),name+' choices must start unselected');
    for(const card of data.cards)assert.deepEqual(card,data.cards[0],name+' choices must have equal visual emphasis');
    assert.ok(data.blocked>=8&&data.sameModal,name+' outside taps must keep the dialog open');
    assert.equal(data.leakedClicks,0,name+' outside taps must not reach HUD or battle controls');
    assert.equal(data.stick,0,name+' backdrop drags must not move the player');
    assert.deepEqual(data.after,data.before,name+' outside taps must not change the run or grant upgrades');
    fs.writeFileSync(path.join(dir,name+'-modal.json'),JSON.stringify(data,null,2));
  }
  await snapshot('01-home-390');
  const perf=await page.evaluate(async()=>{
    let renders=0,layouts=0,uploads=0;
    const render=app.r.render,layout=inspected.layout,refresh=layout.refresh;
    app.r.render=function(...args){renders++;return render.apply(this,args);};
    layout.refresh=function(...args){layouts++;return refresh.apply(this,args);};
    const gl=app.r.renderer.getContext(),upload=gl.texSubImage2D;
    gl.texSubImage2D=function(...args){uploads++;return upload.apply(this,args);};
    await new Promise(r=>setTimeout(r,1500));
    app.r.render=render;layout.refresh=refresh;gl.texSubImage2D=upload;
    return {sampleMs:1500,sceneRenders:renders,layouts,textureUploads:uploads};
  });
  assert.equal(perf.sceneRenders,0,'Opaque menus must not render a hidden 3D scene');
  assert.equal(perf.layouts,0,'An unchanged menu must not relayout');
  assert.equal(perf.textureUploads,0,'Static artwork must not trigger texture uploads');
  console.log('Zixing idle work',JSON.stringify(perf));
  fs.writeFileSync(path.join(dir,'zixing-performance.json'),JSON.stringify(perf,null,2));
  if(perfOnly)return;
  if(!process.argv.includes('--battle-only')){
  await tap('[data-action="journey"]');
  await snapshot('02-fire-390');
  for(const id of [7,1,4]){await tap('[data-species="'+id+'"]');await snapshot('choose-'+id+'-390');}
  await tap('.zx-link','查看属性');await snapshot('29-preview-390');await tap('.zx-footer button','返回');
  await tap('.zx-footer button','选择关卡');await snapshot('05-maps-390');
  const locks=await page.evaluate(()=>[...inspected.doc.querySelectorAll('.zx-lock [data-icon="lock"]')].map(c=>{
    const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    return {static:c.dataset.static,drawn:pixels.some((v,i)=>i%4===3&&v>0)};
  }));assert.equal(locks.length,3);assert.ok(locks.every(i=>i.drawn&&i.static==='true'),'Locked maps need drawn lock icons');
  await tap('.zx-footer button','选择难度');await snapshot('06-difficulty-390');
  assert.equal(await page.evaluate(()=>inspected.doc.querySelectorAll('[data-tier]:disabled').length),2);
  await page.evaluate(()=>app.zixing.home());await sleep(350);
  await tap('[data-action="lab"]');
  await snapshot('30-lab-empty-390');await tap('[data-research="dmg"]');await snapshot('35-research-insufficient');
  await tap('.zx-dialog .zx-button','返回');
  // Earn test currency through the real settlement API. Preference saves must
  // never be able to overwrite balances or research levels.
  await page.evaluate(async()=>{
    const base={species:4,biome:'forest',tier:0,mode:'standard',boosts:[]};
    for(let i=0;i<15&&app.meta.profile.stardust<100;i++){
      const ticket=await app.backend.startRun(app.meta.account,base);
      const result=await app.backend.finishRun(app.meta.account,ticket,{...base,stage:3,kills:1000,time:1200,level:20,victory:false,progress:{}});
      app.meta.adopt(result.profile);
    }
    app.zixing.lab();
  });await sleep(350);
  const before=await page.evaluate(()=>({dust:app.meta.profile.stardust,level:app.meta.lab('dmg')}));
  await tap('[data-research="dmg"]');await snapshot('33-research-confirm');
  await tap('[data-action="confirm-research"]');
  const after=await page.evaluate(()=>({dust:app.meta.profile.stardust,level:app.meta.lab('dmg')}));
  assert.equal(after.level,before.level+1);assert.ok(after.dust<before.dust);
  await snapshot('34-research-saved');
  await tap('.zx-wallet button','如何获得');await snapshot('36-stardust');await tap('.zx-footer button','返回');
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);
    await page.evaluate(()=>app.zixing.home());await sleep(300);await snapshot('home-'+width);
    await tap('[data-action="journey"]');await snapshot('choose-'+width);
    await tap('.zx-footer button','选择关卡');await snapshot('maps-'+width);
    await tap('.zx-footer button','返回');await tap('.zx-footer button','返回');await tap('[data-action="lab"]');
    if(width===320){
      const scroll=await page.evaluate(()=>{
        const e=inspected.doc.querySelector('.zx-body'),b=e.getBoundingClientRect(),s=inspected.doc.getElementById('game').getBoundingClientRect();
        const x=b.x+b.width*.5-s.x,y=b.y+b.height*.75-s.y;
        window.tap(x,y,'down');window.tap(x,y-80,'move');window.tap(x,y-80,'up');return e.scrollTop;
      });assert.ok(scroll>20,'Research content must respond to a native swipe');
    }
    for(const tab of ['战斗','生存','成长']){await tap('.zx-tabs button',tab);await snapshot('lab-'+tab+'-'+width);}
    await tap('.zx-footer button','返回');await tap('[aria-label="设置"]');
    for(const tab of ['声音','画面','操作','界面']){
      await tap('.zx-tabs.main button',tab);
      const sub=await page.evaluate(()=>[...inspected.doc.querySelectorAll('.zx-subtab')].map(e=>e.textContent));
      if(sub.length)for(const name of sub){await tap('.zx-subtab',name);await snapshot('settings-'+tab+'-'+name+'-'+width);}
      else await snapshot('settings-'+tab+'-'+width);
    }
    await tap('.zx-tabs.main button','声音');
    const value=await page.evaluate(()=>{
      const input=inspected.doc.querySelector('[aria-label="总音量"]'),b=input.getBoundingClientRect(),s=inspected.doc.getElementById('game').getBoundingClientRect();
      window.tap(b.x+b.width*.65-s.x,b.y+b.height/2-s.y);return app.meta.profile.settings.master;
    });
    assert.equal(value,.65,'Native volume slider must use fractional values');
    await tap('.zx-footer button','返回');
    const saved=await page.evaluate(()=>JSON.parse(wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile.settings.master);
    assert.equal(saved,.65,'Settings saved to the actual local file');
  }
  await resize(390,844);
  await tap('.zx-home-foot button','玩法说明');await snapshot('25-help');await tap('.zx-footer button','返回');
  }
  if(!menusOnly){
    assert.ok(await page.evaluate(()=>app.nextDraw-performance.now()<1000),'Repeated menu changes must not postpone the next game frame');
    await tap('[data-action="journey"]');await tap('.zx-footer button','选择关卡');await tap('.zx-footer button','选择难度');await tap('[data-action="enter"]');
    await page.waitForFunction(()=>app.run?.player,{timeout:90000});
    await page.waitForFunction(()=>app.run.time>2&&!inspected.doc.querySelector('.run-loading,.stageintro'),{timeout:90000});
    await page.evaluate(()=>{app.run.godMode=true;app.run.queueLevelUp=()=>{};app.run.pendingLevels=0;});
    await snapshot('07-battle');
    const hudBindings=await page.evaluate(()=>{
      const r=app.run,p=r.player,oldHp=p.hp,oldXp=p.xp,oldLevel=p.level,oldSkill=p.moves[0].level,oldSlots=p.moveSlots;
      const refresh=()=>{r.state='play';r.ui.hud(r);r.state='paused';r.ui.hud(r);};
      const samples=[];
      for(const value of [0,.25,.75,1]){
        p.hp=p.maxHp*value;refresh();
        const track=inspected.doc.querySelector('.zx-player-health');
        samples.push({progress:Number(track.dataset.progress),value:Number(track.getAttribute('aria-valuenow')),expected:Math.ceil(p.hp)});
      }
      const experience=[];
      for(const value of [0,.25,.75,.99]){
        p.xp=p.xpNext*value;refresh();
        const portrait=inspected.doc.querySelector('.zx-profile-art'),pixels=portrait.getContext('2d').getImageData(0,0,160,168).data;
        let blue=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>pixels[i]*1.25&&pixels[i+1]>pixels[i]+30&&pixels[i+3]>200)blue++;
        experience.push({progress:Number(portrait.dataset.progress),blue});
      }
      p.hp=oldHp;p.xp=0;refresh();
      const resetExperience=Number(inspected.doc.querySelector('.zx-profile-art').dataset.progress);
      const level=inspected.doc.querySelector('.zx-hud-level').textContent,topBars=inspected.doc.querySelectorAll('.zx-hud-hp,.zx-hud-track,.zx-hud-xp-track').length;
      p.addItem('leftovers');p.addItem('leftovers');p.addItem('lucky-egg');p.addVitamin('protein',.12);p.moves[0].level=oldSkill+1;p.moveSlots=4;refresh();
      const items=[...inspected.doc.querySelectorAll('[data-item]')].map(n=>[n.dataset.item,Number(n.dataset.count)]),skill=Number(inspected.doc.querySelector('[data-skill-slot="0"]').dataset.level),unlocked=!inspected.doc.querySelector('[data-skill-slot="3"]').classList.contains('locked');
      p.level=oldLevel;p.xp=oldXp;p.moveSlots=oldSlots;refresh();r.state='play';
      const minimap=inspected.doc.querySelector('.zx-minimap'),mapPixels=minimap.getContext('2d').getImageData(0,0,240,240).data;
      return {samples,experience,resetExperience,weatherTags:inspected.doc.querySelectorAll('.zx-hud-weather').length,level,expectedLevel:'LV.'+oldLevel,topBars,items,skill,expectedSkill:oldSkill+1,unlocked,mapDrawn:mapPixels.some((v,i)=>i%4===3&&v>0),score:inspected.doc.querySelector('.zx-hud-score').textContent,expectedScore:'积分 '+Math.round(r.stats.kills).toLocaleString('en-US')};
    });
    assert.deepEqual(hudBindings.samples.map(s=>s.progress),[0,.25,.75,1]);assert.ok(hudBindings.samples.every(s=>s.value===s.expected),'Foot health must follow damage and healing');
    assert.deepEqual(hudBindings.experience.map(s=>s.progress),[0,.25,.75,.99]);assert.equal(hudBindings.resetExperience,0);assert.equal(hudBindings.weatherTags,0);
    assert.ok(hudBindings.experience.every((sample,i,all)=>!i||sample.blue>all[i-1].blue),'The blue portrait arc must visibly fill as experience increases');
    assert.equal(hudBindings.level,hudBindings.expectedLevel);assert.equal(hudBindings.topBars,0);assert.equal(hudBindings.skill,hudBindings.expectedSkill);assert.ok(hudBindings.unlocked&&hudBindings.mapDrawn);assert.equal(hudBindings.score,hudBindings.expectedScore);assert.ok(hudBindings.items.some(([id,n])=>id==='leftovers'&&n===2));
    fs.writeFileSync(path.join(dir,'hud-bindings.json'),JSON.stringify(hudBindings,null,2));await snapshot('07-hud-skills-items');
    await page.evaluate(()=>{const r=app.run;window.previewXp=r.player.xp;r.player.xp=r.player.xpNext*.65;r.state='paused';r.ui.hud(r);});
    await snapshot('07-experience-ring-65');
    await page.evaluate(()=>{app.run.player.xp=window.previewXp;app.run.state='play';app.run.ui.hud(app.run);});
    await reviewExperience(page,dir);
    await reviewItems({page,tap,resize,dir,sleep,snapshot});
    async function controls(){return page.evaluate(()=>{
      const box=sel=>{const b=inspected.layout.box(inspected.doc.querySelector(sel));return b&&{x:b.x,y:b.y,w:b.w,h:b.h,cx:b.x+b.w/2,cy:b.y+b.h/2};};
      const labels=['.zx-hud-level','.zx-hud-clock','.zx-hud-gold'].map(selector=>{
        const el=inspected.doc.querySelector(selector),b=inspected.layout.box(selector==='.zx-hud-level'?el:el.firstChild),label=inspected.layout.box(el);
        return {selector,text:el.textContent,width:b.w,height:b.h,font:b.s.font,nowrap:b.s['white-space']==='nowrap',labelHeight:label.h};
      });
      const p=app.run.player,foot=app.run.ui.project(app.run,p.pos.x,p.pos.y-.15,p.pos.z);
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const header={offsetX:-screen.x,offsetY:-screen.y,safeTop:wx.getWindowInfo().safeArea.top,menu:wx.getMenuButtonBoundingClientRect(),badge:box('.zx-hud-level'),portrait:box('.zx-profile-art')};
      return {width:inspected.env.innerWidth,height:inspected.env.innerHeight,header,stick:box('.tc-stick'),knob:box('.tc-stick>i'),ult:box('.tc-ultb'),profile:box('.zx-hud-profile'),minimap:box('.zx-minimap'),location:box('.zx-hud-location'),counters:box('.zx-hud-counters'),meta:box('.zx-hud-meta'),pause:box('.zx-hud-pause'),name:box('.zx-hud-name-row'),supplies:box('.zx-inventory-items'),health:box('.zx-player-health'),foot,labels,skills:[0,1,2,3].map(i=>box('[data-skill-slot="'+i+'"]')),extras:['.tc-jump','.tc-dash','.tc-lock','.tc-aim'].map(box).filter(Boolean)};
    });}
    function swipeControls(c){
      assert.ok(c.stick&&c.knob&&c.stick.w>=100&&Math.abs(c.stick.w-c.stick.h)<=1,'The fixed circular joystick must remain visible and easy to reach');
      assert.ok(c.stick.x>=64&&c.stick.x+c.stick.w+12<=c.ult.x,'Joystick must sit beside the ultimate and clear the skill column');
      assert.ok(c.stick.cy-c.ult.cy>=48&&c.stick.cy-c.ult.cy<=90,'Ultimate must sit above the joystick for easy tapping');
      assert.ok(c.stick.y>=0&&c.stick.y+c.stick.h<c.height,'Joystick must fit above the safe bottom edge');
      assert.ok(c.ult&&c.ult.x>=0&&c.ult.y>=0&&c.ult.x+c.ult.w<=c.width+1&&c.ult.y+c.ult.h<c.height,'Ultimate must fit above the safe bottom edge');
      assert.ok(c.profile.x+c.profile.w+8<=c.minimap.x&&Math.abs(c.profile.y-c.minimap.y)<=4,'Status card and circular minimap must sit side by side without overlapping');
      assert.ok(c.location.x+c.location.w<=c.width-8&&c.counters.y>=c.profile.y+c.profile.h+8&&c.counters.x+c.counters.w<=c.minimap.x,'Time and coins belong below the profile');
      assert.ok(c.location.y<0&&Math.abs(c.location.cy+c.header.offsetY-(c.header.menu.top+c.header.menu.bottom)/2)<1,'Stage strip must align with the capsule center');
      assert.ok(c.location.x+c.location.w+c.header.offsetX+44<=c.header.menu.left,'Stage strip must leave room for the capsule and game icon');
      assert.ok(c.profile.y>=c.location.y+c.location.h+10&&c.profile.y<=c.location.y+c.location.h+26,'The portrait must sit close below the stage strip');
      assert.ok(c.header.badge.y>c.header.portrait.y+c.header.portrait.h*75.25/84+1,'The level badge must leave the entire experience ring visible');
      assert.ok(c.supplies.y>=c.name.y+c.name.h+4&&c.supplies.x+c.supplies.w<c.profile.x+c.profile.w,'Items must fit below the character name');
      assert.ok(c.meta.y>=c.skills.at(-1).y+c.skills.at(-1).h&&c.pause.y>=c.minimap.y+c.minimap.h+8,'Score belongs along the bottom and pause below the minimap');
      assert.ok(Math.abs(c.health.cx-c.foot.x)<=2&&c.health.y>=c.foot.y+6&&c.health.y<=c.foot.y+14,'Health must follow the projected feet, including movement and resizing');
      for(let i=0;i<c.skills.length;i++){const s=c.skills[i];assert.equal(s.w,s.h);assert.ok(s.x+s.w<=c.stick.x);if(i)assert.ok(s.y>c.skills[i-1].y+c.skills[i-1].h);}
      assert.ok(c.labels[0].nowrap&&c.labels[0].width>=40,'The level badge must remain legible on one line');
      const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      assert.ok(!overlaps(c.pause,c.ult)&&!overlaps(c.pause,c.stick),'Pause must stay clear of the ultimate and joystick on short screens');
      for(const extra of c.extras){assert.ok(!overlaps(extra,c.stick)&&!overlaps(extra,c.ult)&&!overlaps(extra,c.pause),'Optional controls must stay clear of the main controls');}
    }
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);
      for(const scale of [.7,1,1.3]){
        await page.evaluate(scale=>{app.meta.profile.settings.touchScale=scale;app.applySettings();},scale);await sleep(400);
        const c=await controls();
        fs.writeFileSync(path.join(dir,`controls-${width}-${scale}.json`),JSON.stringify(c,null,2));
        assert.equal(c.extras.length,0,'Extra combat keys must be hidden by default');
        swipeControls(c);
        const joystick=await page.evaluate(()=>{
          const s=inspected.doc.getElementById('game').getBoundingClientRect(),j=inspected.doc.querySelector('.tc-stick'),b=j.getBoundingClientRect(),input=app.run.input;
          const x=b.x+b.width/2-s.x,y=b.y+b.height/2-s.y,speed=()=>Math.hypot(input.stickX,input.stickY),samples=[];
          for(const [dx,dy] of [[45,0],[-45,0],[0,-45],[0,45],[32,-32],[-32,32]]){
            window.tap(x,y,'down');const center=speed();window.tap(x+1,y+1,'move');const jitter=speed();
            window.tap(x+dx,y+dy,'move');const direction=[input.stickX,input.stickY];
            window.tap(x+dx*.75,y+dy*.75,'move');const returned=[input.stickX,input.stickY];
            inspected.layout.refresh();
            const k=j.firstChild.getBoundingClientRect(),offset=Math.hypot(k.x+k.width/2-b.x-b.width/2,k.y+k.height/2-b.y-b.height/2),limit=(b.width-k.width)/2;
            window.tap(x,y,'move');const recentered=speed();window.tap(x,y,'up');
            inspected.layout.refresh();
            const idle=j.firstChild.getBoundingClientRect();
            samples.push({dx,dy,center,jitter,direction,returned,offset,limit,recentered,released:speed(),idleOffset:Math.hypot(idle.x+idle.width/2-b.x-b.width/2,idle.y+idle.height/2-b.y-b.height/2)});
          }
          window.tap(x,y,'down');window.tap(x+1000,y-1000,'move');const far=speed();window.tap(x+1000,y-1000,'cancel');
          return {samples,far,cancelled:speed()};
        });
        fs.writeFileSync(path.join(dir,`joystick-${width}-${scale}.json`),JSON.stringify(joystick,null,2));
        for(const j of joystick.samples){
          assert.equal(j.center,0);assert.equal(j.jitter,0);assert.equal(j.recentered,0);assert.equal(j.released,0);
          const length=Math.hypot(j.dx,j.dy);assert.ok(Math.abs(j.direction[0]-j.dx/length)<.01&&Math.abs(j.direction[1]+j.dy/length)<.01,'Joystick direction must follow the fixed center');
          assert.deepEqual(j.returned,j.direction,'Returning partway to center must keep the same heading');
          assert.ok(j.offset>5&&j.offset<=j.limit+1&&j.idleOffset<2,'Knob must move inside the outer circle and recenter on release: '+JSON.stringify(j));
        }
        assert.ok(Math.abs(joystick.far-1)<.01);assert.equal(joystick.cancelled,0);
      }
      await page.evaluate(()=>{app.meta.profile.settings.touchScale=1;app.applySettings();});await snapshot('controls-'+width);
    }
    await resize(390,844);await sleep(400);
    const directions=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),input=app.run.input,results=[];
      for(const [fx,fy] of [[.18,.4],[.5,.55],[.82,.4],[.5,.92]]){
        const x=inspected.env.innerWidth*fx-s.x,y=inspected.env.innerHeight*fy-s.y;
        for(const [dx,dy] of [[40,0],[-40,0],[0,-40],[0,40],[28,-28],[-28,28]]){
          window.tap(x,y,'down');
          const tapped=Math.hypot(input.stickX,input.stickY);
          window.tap(x+1,y+1,'move');const jitter=Math.hypot(input.stickX,input.stickY);
          window.tap(x+dx,y+dy,'move');const direction=[input.stickX,input.stickY];
          window.tap(x+dx,y+dy,'up');
          results.push({dx,dy,tapped,jitter,direction,released:Math.hypot(input.stickX,input.stickY)});
        }
      }
      const x=inspected.env.innerWidth*.5-s.x,y=inspected.env.innerHeight*.92-s.y;
      window.tap(x,y,'down');window.tap(x+60,y,'move');window.tap(x+50,y,'move');
      const reversed=input.stickX;window.tap(x+50,y-10,'move');const turned=input.stickY;
      window.tap(x+50,y-10,'cancel');
      return {results,reversed,turned};
    });
    for(const d of directions.results){assert.equal(d.tapped,0);assert.equal(d.jitter,0);assert.equal(d.released,0);const length=Math.hypot(d.dx,d.dy);assert.ok(Math.abs(d.direction[0]-d.dx/length)<.01&&Math.abs(d.direction[1]+d.dy/length)<.01,'Screen-wide swipe direction: '+JSON.stringify(d));}
    assert.ok(directions.reversed<-.99&&directions.turned>.99,'Changing swipe direction must not depend on the original touch position');
    const start=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),j=inspected.doc.querySelector('.tc-stick').getBoundingClientRect(),x=j.x+j.width/2-s.x,y=j.y+j.height/2-s.y;
      window.tap(x,y,'down');window.tap(x+80,y,'move');return {x,y,px:app.run.player.pos.x,pz:app.run.player.pos.z};
    });
    await page.waitForFunction(({px,pz})=>Math.hypot(app.run.player.pos.x-px,app.run.player.pos.z-pz)>.2,{timeout:10000},start);
    await snapshot('07-joystick-movement');swipeControls(await controls());
    const multi=await page.evaluate(({x,y})=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),rx=inspected.env.innerWidth*.85-s.x,ry=inspected.env.innerHeight*.4-s.y;
      window.tap(rx,ry,'down',2);window.tap(rx+18,ry,'move',2);window.tap(rx+18,ry,'up',2);
      const direction=[app.run.input.stickX,app.run.input.stickY],camera=[app.run.camYaw,app.run.camPitch,app.run.camDist];window.tap(x+80,y,'up');return {direction,camera};
    },start);assert.ok(multi.direction[0]>.99&&Math.abs(multi.direction[1])<.01,'A second finger must not change the movement direction');
    assert.deepEqual(multi.camera,[0,Math.PI*.3,42],'Swipes must leave the camera fixed');
    assert.equal(await page.evaluate(()=>app.run.input.stickX),0,'Releasing the thumb stops movement');
    await sleep(400);swipeControls(await controls());
    const cast=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),u=inspected.doc.querySelector('.tc-ultb').getBoundingClientRect();
      const j=inspected.doc.querySelector('.tc-stick').getBoundingClientRect();
      const x=j.x+j.width/2-s.x,y=j.y+j.height/2-s.y,ux=u.x+u.width/2-s.x,uy=u.y+u.height/2-s.y;
      const settings=app.meta.profile.settings,previous={autoUlt:settings.autoUlt,ultQuiet:settings.ultQuiet};
      settings.autoUlt=false;settings.ultQuiet=true;app.run.ult.charge=1;
      const uses=app.run.ult.uses;
      window.tap(x,y,'down');window.tap(x+40,y,'move');window.tap(ux,uy,'down',2);window.tap(ux,uy,'up',2);
      return {x,y,uses,previous};
    });
    await page.waitForFunction(uses=>app.run.ult.uses===uses+1,{timeout:15000},cast.uses);
    const cancelled=await page.evaluate(({x,y,previous})=>{
      const moving=Math.hypot(app.run.input.stickX,app.run.input.stickY);
      window.tap(x+40,y,'cancel');Object.assign(app.meta.profile.settings,previous);
      return {moving,speed:Math.hypot(app.run.input.stickX,app.run.input.stickY)};
    },cast);
    assert.ok(cancelled.moving>.1,'Using the ultimate must preserve the movement pointer');
    assert.equal(cancelled.speed,0,'Touch cancellation must stop movement');
    await sleep(400);swipeControls(await controls());
    const interrupted=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),j=inspected.doc.querySelector('.tc-stick').getBoundingClientRect(),x=j.x+j.width/2-s.x,y=j.y+j.height/2-s.y;
      const input=app.run.input,speed=()=>Math.hypot(input.stickX,input.stickY);
      window.tap(x,y,'down');window.tap(x+30,y,'move');
      inspected.env.dispatchEvent(new inspected.env.Event('pagehide'));const hidden=speed();
      window.tap(x+40,y,'move');const stale=speed();window.tap(x+40,y,'up');
      window.tap(x,y,'down');window.tap(x+30,y,'move');
      inspected.env.dispatchEvent(new inspected.env.Event('resize'));const resized=speed();window.tap(x+30,y,'up');
      const ult=inspected.doc.querySelector('.tc-ultb').getBoundingClientRect();
      window.tap(ult.x+ult.width/2-s.x,ult.y+ult.height/2-s.y,'down');
      window.tap(x,y,'move');const buttonDrag=speed();window.tap(x,y,'up');
      return {hidden,stale,resized,buttonDrag};
    });assert.deepEqual(interrupted,{hidden:0,stale:0,resized:0,buttonDrag:0});
    await tap('.zx-minimap');await snapshot('07-full-map');
    assert.equal(await page.evaluate(()=>app.run.state==='paused'&&app.run.ui.mapOpen()),true,'Minimap must open the existing full map');
    await tap('.bigmap .back-btn');assert.equal(await page.evaluate(()=>app.run.state),'play');
    const held=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),j=inspected.doc.querySelector('.tc-stick').getBoundingClientRect(),x=j.x+j.width/2-s.x,y=j.y+j.height/2-s.y;
      window.tap(x,y,'down',9);window.tap(x+35,y,'move',9);return {x,y};
    });
    await tap('.zx-hud-pause');await snapshot('12-pause');
    assert.equal(await page.evaluate(()=>Math.hypot(app.run.input.stickX,app.run.input.stickY)),0,'Pausing while dragging must stop movement');
    await page.evaluate(({x,y})=>window.tap(x+35,y,'cancel',9),held);
    for(const [w,h] of [[320,568],[430,932]]){await resize(w,h);await snapshot('12-pause-'+w);}
    await resize(390,844);await sleep(400);
    const beforeTime=await page.evaluate(()=>app.run.time);await sleep(1000);
    assert.equal(await page.evaluate(()=>app.run.time),beforeTime,'Pause must stop the simulation');
    await tap('.zx-modal .zx-link','查看属性');await snapshot('26-current-stats');
    await tap('.zx-stat-grid .zx-card','全局伤害');await snapshot('28-damage-sources');await tap('.zx-footer button','返回');
    await tap('.zx-tabs button','成长');await snapshot('27-growth-stats');await tap('.zx-footer button','返回');
    await tap('.zx-modal .zx-button','结束本局');await snapshot('24-quit-confirm');await tap('.zx-modal .zx-button','返回');
    await tap('.zx-modal .zx-button','返回');
    assert.equal(await page.evaluate(()=>app.run.state),'play');
    swipeControls(await controls());
    await tap('.zx-hud-pause');await tap('.zx-modal .zx-button','设置');await tap('.zx-tabs.main button','操作');
    assert.doesNotMatch(await page.evaluate(()=>app.screen.textContent),/扩展操作按钮|手动跳跃/);
    await tap('.zx-tabs.main button','画面');
    assert.doesNotMatch(await page.evaluate(()=>app.screen.textContent),/显示的敌人|很近|近处/);
    await tap('.zx-footer button','返回');await tap('.zx-modal .zx-button','返回');
    const c=await controls();swipeControls(c);assert.equal(c.extras.length,0);
    assert.equal(await page.evaluate(()=>inspected.doc.querySelectorAll('.tc-jump,.tc-dash,.tc-lock,.tc-aim').length),0,'Removed controls must not be created');
    await snapshot('07-final-controls');
    await page.evaluate(()=>{
      window.qaOfferSelections=[];const render=app.run.ui.showLevelUp.bind(app.run.ui);
      app.run.ui.showLevelUp=(run,offers,choose)=>render(run,offers,(offer,action)=>{qaOfferSelections.push({index:offers.indexOf(offer),action:action||'choose'});return choose(offer,action);});
      app.run.pendingLevels=1;app.run.doLevelUp();
    });
    await page.waitForFunction(()=>inspected.doc.querySelector('[data-offer]'),{timeout:30000});await snapshot('08-level-up');await checkUpgradeModal('08-level-up');
    assert.equal(await page.evaluate(()=>!!inspected.doc.querySelector('.run-hint')),false,'Tutorial hints must not cover upgrade choices');
    for(const [w,h] of [[320,568],[430,932]]){await resize(w,h);await snapshot('08-level-up-'+w);await checkUpgradeModal('08-level-up-'+w);}
    await resize(390,844);await sleep(400);
    const choices=await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-offer]')].map(el=>el.textContent));
    await tap('.zx-upgrade-stats');await snapshot('08-upgrade-attributes');await tap('.zx-footer button','返回');
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-offer]')].map(el=>el.textContent)),choices,'Viewing attributes must preserve all upgrade choices');
    await checkUpgradeModal('08-upgrade-return');
    assert.deepEqual(await page.evaluate(()=>qaOfferSelections),[],'Opening the dialog and returning from attributes must not choose an upgrade');
    const rerolls=await page.evaluate(()=>app.run.rerolls);await tap('.zx-reroll');
    assert.equal(await page.evaluate(()=>app.run.rerolls),rerolls-1,'Reroll must consume exactly one existing charge');await snapshot('08-rerolled');await checkUpgradeModal('08-rerolled');
    await tap('[data-offer="1"]');
    await page.waitForFunction(()=>app.run.state==='play');
    assert.deepEqual(await page.evaluate(()=>qaOfferSelections),[{index:-1,action:'reroll'},{index:1,action:'choose'}],'Only the player-selected second offer may be applied');
    const evolution=await page.evaluate(()=>{const target=app.run.nextEvo.to;app.run.startEvolution();return target;});
    await snapshot('09-evolution');await tap('.zx-modal button','确认进阶');
    await page.waitForFunction(id=>app.run.player.speciesId===id&&app.run.state==='play',{timeout:60000},evolution);
    const spins=await page.evaluate(()=>{app.run.gold=300;const p=app.run.player.pos;app.run.openSlots({x:p.x,y:p.y,z:p.z});return app.run.slotSpins;});
    await snapshot('10-slots');await tap('.zx-modal button','投入');await snapshot('11-slots-result');
    assert.equal(await page.evaluate(()=>app.run.slotSpins),spins+1);
    await resize(320,568);
    await page.evaluate(async()=>{await app.run.finish(false);});await page.waitForFunction(()=>app.screen?.dataset.page==='summary');await snapshot('23-result');
    await tap('.zx-footer button','返回');
    assert.equal(await page.evaluate(()=>app.run),null);
    await resize(390,844);
    if(process.argv.includes('--forest-regression')){
      const report=[];
      for(const species of [1,4,7]){
        await page.evaluate(async species=>{
          if(!await app.startRun({species,biome:'forest',tier:0,boosts:[],mode:'standard'}))throw Error('Cannot start '+species);
          app.run.godMode=true;app.run.queueLevelUp=()=>{};
        },species);
        await page.waitForFunction(species=>app.run.player.speciesId===species&&app.run.time>1&&app.run.state==='play',{timeout:90000},species);
        const stages=[];
        for(let stage=1;stage<=4;stage++){
          if(stage>1)await page.evaluate(async()=>{app.run.ui.hideModal();app.run.state='play';await app.run.changeZone();});
          await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
          await snapshot('forest-'+species+'-stage-'+stage);
          stages.push(stage);
        }
        const settlement=await page.evaluate(async()=>{
          const before=app.meta.profile.counters.runs||0;
          await app.run.finish(true);await app.meta.resync();
          const save=JSON.parse(wx.getFileSystemManager().readFileSync(wx.env.USER_DATA_PATH+'/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile;
          return {before,after:save.counters.runs,tier:save.biomes.forest,dust:save.stardust};
        });
        assert.equal(settlement.after,settlement.before+1);assert.ok(settlement.tier>=1);
        await snapshot('22-victory-'+species);await tap('.zx-footer button','返回');report.push({species,stages,settlement});
      }
      fs.writeFileSync(path.join(dir,'forest-regression.json'),JSON.stringify({mode:'controlled stage traversal and victory, not natural playthrough',report},null,2));
    }
  }
  fs.writeFileSync(path.join(dir,'zixing-validation.json'),JSON.stringify({reports,perf,checks:[...(!process.argv.includes('--battle-only')?['menu navigation','three characters','centered card text at three phone widths','drawn lock icons','difficulty locks','research purchase and persistence','insufficient funds','settings tabs at three phone widths','native slider persistence']:[]),...(menusOnly?[]:['battle','reference HUD and fixed joystick at three widths and three button scales','joystick direction, deadzone, knob limits and recentering','screen-wide swipes, reversal, jitter, release and cancellation','multitouch movement with fixed camera','ultimate cast during joystick movement','removed enemy visibility setting and extended controls','pause/resume','current attributes','level-up','evolution','slots','quit confirmation','real settlement'])]},null,2));
  console.log('Zixing regression passed:',reports.length,'screenshots');
}
