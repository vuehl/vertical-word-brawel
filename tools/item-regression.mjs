import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewItems({page,tap,resize,dir,snapshot}) {
  const original=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos;
    const before={x:p.x,y:p.y,z:p.z,halted:app.halted,spent:r.goldSpent,bought:r.chestsBought};
    app.halted=true;
    r.hints.el?.remove();
    Object.assign(r.hints,{on:true,el:null,site:null,busyUntil:0,scanT:0,queued:null});
    r.hints.seen.clear();
    window.qaPlace=target=>{
      p.set(target.x+1,target.y,target.z+1);r.player.vel.set(0,0,0);r.camTarget.copy(p);
    };
    window.qaItemFrames=(count,delta=1/30)=>{
      for(let i=0;i<count;i++){r.update(delta);r.input.endFrame();}
      r.updateCamera(1);r.renderWorld(0);app.r.render(0);r.ui.worldLabels(r);inspected.env.drawUI(app.r.renderer);
      return r.interactables.dwellRing.material.uniforms.dwell.value;
    };
    window.qaChest=r.interactables.list.find(e=>e.kind==='chest'&&!e.used&&!e.data?.gift);
    r.gold=1000;qaPlace(qaChest);
    return before;
  });
  const mid=await page.evaluate(()=>{
    const r=app.run;r.input.touchKey('KeyE',true);qaItemFrames(1,1/60);r.input.touchKey('KeyE',false);
    const progress=qaItemFrames(22),ring=r.interactables.dwellRing;
    return {progress,used:qaChest.used,spent:r.goldSpent,button:r.ui.touch.actText,
      atBase:ring.visible&&ring.position.x===qaChest.x&&ring.position.z===qaChest.z&&ring.position.y>qaChest.y,
      outsideModel:ring.scale.x>qaChest.model.userData.footprintRadius,
      atPlayer:r.playerFootRing.position.x===r.player.pos.x&&r.playerFootRing.position.z===r.player.pos.z};
  });
  assert.ok(Math.abs(mid.progress-.5)<.015);assert.ok(!mid.used&&!mid.button);assert.equal(mid.spent,original.spent);
  assert.ok(mid.atBase&&mid.outsideModel&&mid.atPlayer);
  const checkHint=async(kind,title)=>{
    await page.waitForFunction(k=>{
      const card=inspected.doc.querySelector('.zx-hint-slot .run-hint'),img=card?.querySelector('img');
      qaItemFrames(0);
      return card?.dataset.kind===k&&img?.complete&&img.naturalWidth>0&&
        [card,img,card.querySelector('.zx-hint-copy'),inspected.doc.querySelector('.zx-hud-pause'),
          inspected.doc.querySelector('.zx-hud-counters')].every(el=>inspected.layout.box(el)?.opacity>0);
    },{timeout:4500,polling:50},kind);
    const card=await page.evaluate(()=>{
      const doc=inspected.doc,node=doc.querySelector('.run-hint');
      const box=el=>inspected.layout.box(el);
      const rect=box(node),pic=box(node.querySelector('img')),pause=box(doc.querySelector('.zx-hud-pause'));
      const counters=box(doc.querySelector('.zx-hud-counters')),copy=box(node.querySelector('.zx-hint-copy'));
      return {title:node.querySelector('b').textContent,src:node.querySelector('img').getAttribute('src'),
        fits:rect.x>=0&&rect.x+rect.w<=inspected.env.innerWidth&&rect.y>=counters.y+counters.h&&
          (rect.x+rect.w<=pause.x||rect.y>=pause.y+pause.h)&&copy.x>=pic.x+pic.w&&copy.x+copy.w<=rect.x+rect.w+1};
    });
    assert.equal(card.title,title);assert.ok(card.src.includes('/ui/devices/'+kind+'.png'),card.src);
    assert.ok(card.fits,'The hint should clear the HUD controls and fit its model and text');
  };
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);await page.evaluate(()=>{
      // Each viewport gets a fresh visit so screenshot time cannot expire the real-time toast.
      const r=app.run,h=r.hints;h.seen.delete('b');h.busyUntil=0;h.scanT=0;
      h.tick(r,0);qaItemFrames(0);
    });
    await checkHint('chest','扭蛋');
    await snapshot('14-interaction-'+width);
  }
  await resize(390,844);
  const visit=await page.evaluate(()=>{
    const r=app.run,objects=r.interactables.list;
    const costLabel=inspected.doc.querySelector('.wlabel.cost')?.textContent;
    qaPlace(objects.find(o=>o.kind==='freechest'&&!o.used));r.hints.scanT=0;const switched=qaItemFrames(1);
    const freeHint=r.hints.el?.dataset.kind;
    const altar=objects.find(o=>o.kind==='altar'&&!o.data.tier&&!o.used);
    qaPlace(altar);
    r.player.pos.set(altar.x+.15,altar.y,altar.z+2.7);r.camTarget.copy(r.player.pos);
    qaItemFrames(91);
    return {costLabel,switched,freeHint,ringCharge:altar.chargeRing.material.uniforms.dwell.value,
      baseColor:altar.chargeRing.material.uniforms.baseColor.value.getHex(),charge:altar.charge,
      clear:!r.ui.worldLabelNodes.has(altar)&&!inspected.doc.querySelector('.charge')&&!r.interactables.dwellRing.visible};
  });
  assert.match(visit.costLabel,/金币/);assert.ok(visit.switched>0&&visit.switched<.025);
  assert.equal(visit.ringCharge,visit.charge);assert.ok(visit.charge>0&&visit.charge<1);
  assert.equal(visit.freeHint,'freechest');assert.equal(visit.baseColor,0x5af0ff);assert.ok(visit.clear);
  await checkHint('altar','守护者祭坛');
  await snapshot('14-guardian-altar');
  const later=await page.evaluate(()=>{
    qaItemFrames(88);
    const r=app.run,a=r.interactables.list.find(o=>o.kind==='altar'&&o.charge>0);
    return {charge:a.charge,arc:a.chargeRing.material.uniforms.dwell.value,clear:!r.ui.worldLabelNodes.has(a)};
  });
  assert.ok(later.charge>visit.charge+.25&&later.charge<1&&later.clear);assert.equal(later.arc,later.charge);
  await snapshot('14-guardian-altar-late');
  const almost=await page.evaluate(()=>{
    qaItemFrames(50);
    const a=app.run.interactables.list.find(o=>o.kind==='altar'&&o.charge>0);
    return a.chargeRing.material.uniforms.dwell.value;
  });
  assert.ok(almost>.94&&almost<1);
  await snapshot('14-guardian-altar-close');
  const retreat=await page.evaluate(()=>{
    const r=app.run,f=r.interactables,a=f.list.find(o=>o.kind==='altar'&&o.charge>0);
    r.player.pos.set(a.x,a.y,a.z+a.r+1);
    f.update(.6,0);const held=a.charge;
    f.update(.8,0);f.render();
    return {held,charge:a.charge,arc:a.chargeRing.material.uniforms.dwell.value,visible:a.chargeRing.visible};
  });
  assert.equal(retreat.held,almost);assert.equal(retreat.arc,retreat.charge);
  assert.ok(retreat.visible&&retreat.charge>0&&retreat.charge<retreat.held);
  const lifecycle=await page.evaluate(async()=>{
    const r=app.run,ui=r.ui,facilities=r.interactables,group=qaChest.group;
    const label=()=>ui.worldLabelNodes.get(qaChest);
    qaPlace(qaChest);qaItemFrames(1);
    const first=label(),models=[...group.children];
    group.remove(...models);qaItemFrames(1);
    const loading=!label()&&!first.isConnected&&facilities.nearest!==qaChest;
    r.player.pos.x+=30;group.add(...models);ui.worldLabels(r);
    const moved=!label();
    qaPlace(qaChest);qaItemFrames(0);
    const returned=!!label()?.isConnected;
    const project=ui.project,w=inspected.env.innerWidth,h=inspected.env.innerHeight;
    const clipped=[[4,h/2],[w-4,h/2],[w/2,2],[w/2,h+2]].every(([x,y])=>{
      ui.project=()=>({x,y,vis:true});ui.worldLabels(r);return !label();
    });
    ui.project=project;ui.worldLabels(r);
    const beforePause=label();r.pause();
    const paused=!beforePause.isConnected&&!ui.worldLabelNodes.size;
    r.resume();ui.worldLabels(r);
    const resumed=!!label()?.isConnected;
    const removed=facilities.add('chest',qaChest.x,qaChest.z);
    facilities.remove(removed);await removed.modelReady;
    const npc=facilities.list.find(o=>o.kind==='ditto');
    qaPlace(npc);qaItemFrames(1);
    const npcLabel=ui.worldLabelNodes.get(npc);
    npc.model.visible=false;qaItemFrames(1);
    const hiddenNPC=!!npcLabel&&!npcLabel.isConnected&&!ui.worldLabelNodes.has(npc)&&facilities.nearest!==npc;
    npc.model.visible=true;
    qaPlace(qaChest);qaItemFrames(0);
    return {loading,moved,returned,clipped,paused,resumed,lateModel:removed.group.children.length,hiddenNPC};
  });
  assert.deepEqual(lifecycle,{loading:true,moved:true,returned:true,clipped:true,paused:true,resumed:true,lateModel:0,hiddenNPC:true});
  const poor=await page.evaluate(()=>{
    const r=app.run,facilities=r.interactables,old=r.ui.worldLabelNodes.get(qaChest);
    r.gold=0;qaPlace(qaChest);
    const dwell=qaItemFrames(22);qaItemFrames(26);
    facilities.interact(qaChest);
    const toasts=r.ui.toastsEl.textContent;
    return {state:r.state,used:qaChest.used,waiting:facilities.waitingForGold,dwell,prompt:facilities.label(qaChest),
      hasPrice:r.ui.worldLabelNodes.has(qaChest)||old.isConnected,hasWarning:/不足|不够|没有足够/.test(toasts)};
  });
  assert.deepEqual(poor,{state:'play',used:false,waiting:true,dwell:-1,prompt:'',hasPrice:false,hasWarning:false});
  // The simulation is halted here. Present the throttled counter and its tile
  // as they would appear on the next live HUD frame before taking the photo.
  await page.waitForFunction(()=>{
    const r=app.run;r.ui.hud(r);r.renderWorld(0);app.r.render(0);inspected.env.drawUI(app.r.renderer);
    return inspected.doc.querySelector('.zx-hud-gold').textContent==='0';
  },{timeout:3000,polling:100});
  await snapshot('14-interaction-insufficient');
  const notices=await page.evaluate(async()=>{
    const r=app.run,ui=r.ui;
    // Deliver native image completions after failure, teardown or expiry.
    function holdIcon(message){
      const create=wx.createImage;
      let native;
      wx.createImage=()=>{native={width:24,height:24};return native;};
      try{ui.toast(message,'razor-claw');}finally{wx.createImage=create;}
      const notice=ui.toastsEl.lastElementChild;
      return {notice,native,icon:notice.querySelector('img')};
    }
    const failed=holdIcon('拾取');
    const pending=failed.icon.hidden&&failed.notice.textContent==='拾取';
    failed.native.onerror();
    const textOnly=!failed.notice.querySelector('img')&&failed.notice.textContent==='拾取';
    const loaded=holdIcon('已获得道具');loaded.native.onload();
    const ready=!loaded.icon.hidden&&!loaded.notice.querySelector('.zx-note-tab');
    const late=holdIcon('换场');
    const p=r.player.pos;ui.popup(p.x,p.y+2,p.z,'+1','#fff');const hadPopup=ui.popups.size>0;
    ui.clearWorldNotices();late.native.onload();
    const cleared=!ui.toastsEl.childElementCount&&!ui.popups.size&&!late.notice.isConnected&&late.icon.hidden;
    const env=inspected.env,image=inspected.doc.createElement('img'),src=loaded.icon.src;
    image.hidden=true;image.src=src;inspected.doc.body.append(image);
    const schedule=env.setTimeout,create=wx.createImage;
    let retry,request;
    try{
      env.setTimeout=(fn,delay,...args)=>{
        if(delay===1500){retry=fn;return 0;}
        return schedule(fn,delay,...args);
      };
      image.dispatchEvent(new env.Event('error',{bubbles:true}));
      wx.createImage=()=>{request={width:24,height:24};return request;};
      retry();
    }finally{env.setTimeout=schedule;wx.createImage=create;}
    const expired=holdIcon('延迟');
    // The old global retry button appeared after eight seconds.
    await new Promise(resolve=>setTimeout(resolve,8300));expired.native.onload();
    const quiet=!/图像尚?未加载/.test(inspected.doc.body.textContent);
    image.remove();request.onload();
    return {pending,textOnly,ready,hadPopup,cleared,quiet,oldImage:image.src===src,expired:!expired.notice.isConnected&&expired.icon.hidden};
  });
  assert.deepEqual(notices,{pending:true,textOnly:true,ready:true,hadPopup:true,cleared:true,quiet:true,oldImage:true,expired:true});
  const opened=await page.evaluate(halted=>{
    const r=app.run,cost=r.interactables.chestCost();r.gold=1000;
    const almost=qaItemFrames(44),early=qaChest.used;
    qaItemFrames(1);const used=qaChest.used;
    qaItemFrames(15);app.halted=halted;
    return {almost,early,used,spent:r.goldSpent,bought:r.chestsBought,cost};
  },original.halted);
  assert.ok(opened.almost>.97&&opened.almost<1&&!opened.early&&opened.used);
  assert.equal(opened.spent,original.spent+opened.cost);assert.equal(opened.bought,original.bought+1);
  fs.writeFileSync(path.join(dir,'item-dwell.json'),JSON.stringify({mid,visit,later,almost,retreat,lifecycle,poor,notices,opened},null,2));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-choice="showItemChoice"]'),{timeout:15000});
  async function checkDialog(name){
    await snapshot(name);
    const state=await page.evaluate(()=>{
      const d=inspected.doc.querySelector('.zx-item-dialog'),b=d.getBoundingClientRect(),body=d.querySelector('.zx-item-body').getBoundingClientRect();
      const footer=d.querySelector('.zx-item-actions').getBoundingClientRect();
      const badge=inspected.layout.box(d.querySelector('.zx-item-rarity').firstChild).s;
      return {single:d.dataset.choice==='showItem',effect:d.querySelector('.zx-item-effect')?.textContent,extra:!!d.querySelector('.zx-item-description,.zx-item-note'),
        badgeSize:badge.font,badgeWeight:Number(badge['font-weight']),team:!!d.querySelector('.pk-btn,.pk-row')||d.textContent.includes('查看我的队伍'),images:d.querySelectorAll('.zx-item-image').length,x:b.x,y:b.y,w:b.width,h:b.height,bodyBottom:body.y+body.height,footerY:footer.y,footerBottom:footer.y+footer.height,width:inspected.env.innerWidth,height:inspected.env.innerHeight};
    });
    assert.ok(state.badgeSize>=(state.single?15:13)&&state.badgeWeight>=700,'Rarity must use the larger, bold face');
    if(state.single){assert.ok(state.effect);assert.equal(state.extra,false,'Single rewards must omit lore and stacking notes');}
    assert.equal(state.team,false,'Item dialog must omit the team shortcut');
    assert.ok(state.images>0&&state.x>=0&&state.y>=0&&state.x+state.w<=state.width+1&&state.y+state.h<=state.height+1,'Item dialog must fit the usable viewport');
    assert.ok(state.bodyBottom<=state.footerY+1&&state.footerBottom<=state.y+state.h-8,'Reward actions must remain visible below the scrollable content');
  }
  for(const [width,height] of [[390,844],[320,568],[430,932]]){
    await resize(width,height);await checkDialog('15-item-choice-'+width);
    if(width===320){
      const scrolled=await page.evaluate(()=>{
        const body=inspected.doc.querySelector('.zx-item-body'),b=body.getBoundingClientRect(),s=inspected.doc.getElementById('game').getBoundingClientRect();
        const x=b.x+b.width/2-s.x,y=b.y+b.height*.8-s.y;
        window.tap(x,y,'down');window.tap(x,y-140,'move');window.tap(x,y-140,'up');return body.scrollTop;
      });
      assert.ok(scrolled>0,'Small screens must let players scroll to every item choice');
    }
  }
  await resize(390,844);
  const choice=await page.evaluate(()=>{
    const node=inspected.doc.querySelector('[data-item-choice]');window.qaRewardButton=node;
    const key=node.dataset.itemChoice;return {key,count:app.run.player.items.get(key)||0};
  });
  await tap('[data-item-choice]');
  await page.evaluate(()=>qaRewardButton.dispatchEvent(new inspected.env.Event('click')));
  assert.equal(await page.evaluate(key=>app.run.player.items.get(key),choice.key),choice.count+1,'Choosing an item must award it once');
  assert.equal(await page.evaluate(()=>app.run.state),'play');
  await page.evaluate(()=>app.run.rollChestItem(false,1));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-choice="showItem"]'));
  for(const [width,height] of [[390,844],[320,568],[430,932]]){await resize(width,height);await checkDialog('16-item-single-'+width);}
  await resize(390,844);
  const single=await page.evaluate(()=>{
    const key=inspected.doc.querySelector('[data-item-choice]').dataset.itemChoice;
    window.qaRewardButton=inspected.doc.querySelector('[data-item-action="take"]');return {key,count:app.run.player.items.get(key)||0};
  });
  await tap('[data-item-action="take"]');
  await page.evaluate(()=>qaRewardButton.dispatchEvent(new inspected.env.Event('click')));
  assert.equal(await page.evaluate(key=>app.run.player.items.get(key),single.key),single.count+1,'Pickup must award one item after the restyle');
  await page.evaluate(()=>app.run.rollChestItem(false,1));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-choice="showItem"]'));
  const sale=await page.evaluate(()=>{
    window.qaRewardButton=inspected.doc.querySelector('[data-item-action="sell"]');
    const key=inspected.doc.querySelector('[data-item-choice]').dataset.itemChoice;
    return {key,count:app.run.player.items.get(key)||0,gold:app.run.gold,sold:app.run.econ.sold,price:Number(qaRewardButton.textContent.match(/\+(\d+)/)[1])};
  });
  await tap('[data-item-action="sell"]');
  await page.evaluate(()=>qaRewardButton.dispatchEvent(new inspected.env.Event('click')));
  const result=await page.evaluate(key=>({count:app.run.player.items.get(key)||0,gold:app.run.gold,sold:app.run.econ.sold,state:app.run.state}),sale.key);
  assert.equal(result.count,sale.count);assert.equal(result.sold,sale.sold+1);assert.ok(result.gold>=sale.gold+sale.price);assert.equal(result.state,'play');
  assert.equal(await page.evaluate(()=>app.run.player.addItem('fairy-feather')),false,'Hidden items cannot be granted');
  await page.evaluate(()=>{
    const r=app.run;r.state='modal';r.ui.showItem(r,'razor-claw',()=>r.resume());
  });
  await checkDialog('17-item-razor-claw');
  const knife=await page.evaluate(()=>inspected.doc.querySelector('.zx-item-dialog').textContent);
  assert.match(knife,/少见/);assert.match(knife,/美工刀/);assert.match(knife,/暴击伤害\s*\+30%/);
  assert.doesNotMatch(knife,/爪子|可叠加/);
  await tap('[data-item-action="take"]');
  fs.writeFileSync(path.join(dir,'item-rewards.json'),JSON.stringify({choice,single,sale,result},null,2));
  await page.evaluate(before=>{
    app.run.player.pos.set(before.x,before.y,before.z);app.run.player.vel.set(0,0,0);
    delete window.qaChest;delete window.qaPlace;delete window.qaItemFrames;delete window.qaRewardButton;
  },original);
}
