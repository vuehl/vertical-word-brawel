import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewZixing({page,tap,resize,dir,sleep,menusOnly=false,perfOnly=false}) {
  const reports=[];
  async function snapshot(name){
    await sleep(350);
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
      const pauseLayout=pause&&{tags:pause.querySelectorAll('.zx-build-tag').length,buildHeading:pause.textContent.includes('本局构筑'),actions:[...pause.querySelectorAll('.zx-pause-actions button')].map(el=>{const b=inspected.layout.box(el);return {x:b.x,w:b.w,h:b.h};})};
      const unresolvedColors=[...inspected.doc.querySelectorAll('.zx *')].flatMap(el=>[...el.childNodes]).filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>({text:n.textContent,color:inspected.layout.box(n)?.s.color})).filter(t=>t.color&&/^(inherit|initial|unset|currentcolor)$/i.test(t.color));
      const settingsColors=[...inspected.doc.querySelectorAll('.zx-settings .zx-tab:not(.on),.zx-settings .zx-subtab:not(.on),.zx-settings .zx-option:not(.on),.zx-settings .zx-plain,.zx-settings .zx-footer button')].map(el=>({text:el.textContent,color:inspected.layout.box(el)?.s.color})).filter(t=>t.color);
      const prices=[...inspected.doc.querySelectorAll('.zx-buy')].map(el=>{
        const b=inspected.layout.box(el);if(!b)return null;
        const labels=[...el.children].map(label=>inspected.layout.box(label.firstChild));
        if(labels.some(t=>!t))return null;
        const top=Math.min(...labels.map(t=>t.y)),bottom=Math.max(...labels.map(t=>t.y+t.h));
        return {text:el.textContent,verticalOffset:(top+bottom)/2-(b.y+b.h/2),horizontalOffsets:labels.map(t=>(t.x+t.w/2)-(b.x+b.w/2)),topInset:top-b.y,bottomInset:b.y+b.h-bottom,color:b.s.color};
      }).filter(Boolean);
      return {page:app.screen?.dataset.page,dark:inspected.doc.documentElement.classList.contains('zx-dark'),viewport:[inspected.env.innerWidth,inspected.env.innerHeight],centered,leftAligned,upgradeLayout,pauseLayout,unresolvedColors,settingsColors,prices,boxes:all.map(e=>{
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
    reports.push(name);
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
    async function controls(){return page.evaluate(()=>{
      const box=sel=>{const b=inspected.layout.box(inspected.doc.querySelector(sel));return b&&{x:b.x,y:b.y,w:b.w,h:b.h,cx:b.x+b.w/2,cy:b.y+b.h/2};};
      return {width:inspected.env.innerWidth,height:inspected.env.innerHeight,stick:box('.tc-stick'),knob:box('.tc-stick>i'),ult:box('.tc-ultb'),extras:['.tc-jump','.tc-dash','.tc-lock','.tc-aim'].map(box).filter(Boolean)};
    });}
    function centeredStick(c){
      assert.ok(c.stick&&Math.abs(c.stick.cx-c.width/2)<1.1&&c.stick.y>c.height/2&&c.stick.y+c.stick.h<c.height,'Released joystick must remain visible at the bottom center: '+JSON.stringify(c));
      assert.ok(c.knob&&Math.hypot(c.knob.cx-c.stick.cx,c.knob.cy-c.stick.cy)<1.1,'Released knob must return to its base');
    }
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);
      for(const scale of [.7,1,1.3]){
        await page.evaluate(scale=>{app.meta.profile.settings.touchScale=scale;app.applySettings();},scale);await sleep(400);
        const c=await controls();
        fs.writeFileSync(path.join(dir,`controls-${width}-${scale}.json`),JSON.stringify(c,null,2));
        assert.equal(c.extras.length,0,'Extra combat keys must be hidden by default');
        assert.ok(c.stick&&c.ult&&Math.abs(c.stick.cx-c.width/2)<1.1,'Joystick must stay in the horizontal center');
        assert.ok(Math.hypot(c.knob.cx-c.stick.cx,c.knob.cy-c.stick.cy)<1.1,'Released knob must sit at the center');
        assert.ok(c.stick.y>c.height*.5&&c.stick.y+c.stick.h<c.height,'Joystick must fit above the safe bottom edge');
        assert.ok(c.stick.x+c.stick.w<=c.ult.x||c.ult.x+c.ult.w<=c.stick.x||c.stick.y+c.stick.h<=c.ult.y||c.ult.y+c.ult.h<=c.stick.y,'Joystick and ultimate must not overlap: '+JSON.stringify(c));
      }
      await page.evaluate(()=>{app.meta.profile.settings.touchScale=1;app.applySettings();});await snapshot('controls-'+width);
    }
    await resize(390,844);await sleep(400);
    const start=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),b=inspected.doc.querySelector('.tc-stick').getBoundingClientRect(),x=b.x+b.width/2-s.x,y=b.y+b.height/2-s.y;
      window.tap(x,y,'down');window.tap(x+80,y,'move');return {x,y,px:app.run.player.pos.x,pz:app.run.player.pos.z};
    });
    await page.waitForFunction(({px,pz})=>Math.hypot(app.run.player.pos.x-px,app.run.player.pos.z-pz)>.2,{timeout:10000},start);
    await snapshot('07-joystick-drag');
    const dragging=await controls();
    assert.ok(Math.abs(dragging.stick.cx-dragging.width/2)<1.1,'Dragging must not move the joystick base');
    assert.ok(Math.hypot(dragging.knob.cx-dragging.stick.cx,dragging.knob.cy-dragging.stick.cy)<=(dragging.stick.w-dragging.knob.w)/2+1.1,'Knob must be clamped inside the base');
    const multi=await page.evaluate(({x,y})=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),rx=inspected.env.innerWidth*.85-s.x,ry=inspected.env.innerHeight*.4-s.y;
      window.tap(rx,ry,'down',2);window.tap(rx+18,ry,'move',2);window.tap(rx+18,ry,'up',2);
      const speed=Math.hypot(app.run.input.stickX,app.run.input.stickY);window.tap(x+80,y,'up');return speed;
    },start);assert.ok(multi>.1,'Moving the camera must not release the movement stick');
    assert.equal(await page.evaluate(()=>app.run.input.stickX),0,'Releasing the thumb stops movement');
    await sleep(400);const released=await controls();centeredStick(released);
    const cast=await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect(),b=inspected.doc.querySelector('.tc-stick').getBoundingClientRect(),u=inspected.doc.querySelector('.tc-ultb').getBoundingClientRect();
      const x=b.x+b.width/2-s.x,y=b.y+b.height/2-s.y,ux=u.x+u.width/2-s.x,uy=u.y+u.height/2-s.y;
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
    await sleep(400);centeredStick(await controls());
    await page.evaluate(()=>{
      const s=inspected.doc.getElementById('game').getBoundingClientRect();
      window.tap(40-s.x,180-s.y,'down');window.tap(50-s.x,180-s.y,'move');window.tap(50-s.x,180-s.y,'up');
    });await sleep(400);const elsewhere=await controls();assert.ok(Math.hypot(elsewhere.stick.cx-released.stick.cx,elsewhere.stick.cy-released.stick.cy)<1.1,'Touching the map must not relocate the joystick');
    await tap('.zx-hud-pause');await snapshot('12-pause');
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
    centeredStick(await controls());
    for(const enabled of [true,false]){
      await tap('.zx-hud-pause');await tap('.zx-modal .zx-button','设置');await tap('.zx-tabs.main button','操作');
      await tap('[aria-label="扩展操作按钮"]');await tap('.zx-footer button','返回');await tap('.zx-modal .zx-button','返回');
      const c=await controls();centeredStick(c);assert.equal(c.extras.length,enabled?4:0,'Optional controls must follow the saved switch');
      await snapshot(enabled?'07-optional-controls':'07-final-controls');
    }
    await page.evaluate(()=>{app.run.pendingLevels=1;app.run.doLevelUp();});
    await page.waitForFunction(()=>inspected.doc.querySelector('[data-offer]'),{timeout:30000});await snapshot('08-level-up');
    assert.equal(await page.evaluate(()=>!!inspected.doc.querySelector('.run-hint')),false,'Tutorial hints must not cover upgrade choices');
    for(const [w,h] of [[320,568],[430,932]]){await resize(w,h);await snapshot('08-level-up-'+w);}
    await resize(390,844);await sleep(400);
    const choices=await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-offer]')].map(el=>el.textContent));
    await tap('.zx-upgrade-stats');await snapshot('08-upgrade-attributes');await tap('.zx-footer button','返回');
    assert.deepEqual(await page.evaluate(()=>[...inspected.doc.querySelectorAll('[data-offer]')].map(el=>el.textContent)),choices,'Viewing attributes must preserve all upgrade choices');
    const rerolls=await page.evaluate(()=>app.run.rerolls);await tap('.zx-reroll');
    assert.equal(await page.evaluate(()=>app.run.rerolls),rerolls-1,'Reroll must consume exactly one existing charge');await snapshot('08-rerolled');
    await tap('[data-offer="0"]');
    await page.waitForFunction(()=>app.run.state==='play');
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
  fs.writeFileSync(path.join(dir,'zixing-validation.json'),JSON.stringify({reports,perf,checks:[...(!process.argv.includes('--battle-only')?['menu navigation','three characters','centered card text at three phone widths','drawn lock icons','difficulty locks','research purchase and persistence','insufficient funds','settings tabs at three phone widths','native slider persistence']:[]),...(menusOnly?[]:['battle','fixed centered joystick at three widths and three scales','joystick release and cancellation','multitouch movement and camera','ultimate cast during movement','optional control visibility','pause/resume','current attributes','level-up','evolution','slots','quit confirmation','real settlement'])]},null,2));
  console.log('Zixing regression passed:',reports.length,'screenshots');
}
