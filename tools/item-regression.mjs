import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewItems({page,tap,resize,dir,snapshot}) {
  const original=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos;
    const before={x:p.x,y:p.y,z:p.z,halted:app.halted,spent:r.goldSpent,bought:r.chestsBought};
    app.halted=true;
    window.qaPlace=target=>{
      p.set(target.x+1,target.y,target.z+1);r.player.vel.set(0,0,0);r.camTarget.copy(p);
    };
    window.qaItemFrames=(count,delta=1/30)=>{
      for(let i=0;i<count;i++){r.update(delta);r.input.endFrame();}
      r.updateCamera(1);r.renderWorld(0);app.r.render(0);r.ui.worldLabels(r);inspected.env.drawUI(app.r.renderer);
      return r.playerFootRing.material.uniforms.dwell.value;
    };
    window.qaChest=r.interactables.list.find(e=>e.kind==='chest'&&!e.used&&!e.data?.gift);
    r.gold=1000;qaPlace(qaChest);
    return before;
  });
  const mid=await page.evaluate(()=>{
    const r=app.run;r.input.touchKey('KeyE',true);qaItemFrames(1,1/60);r.input.touchKey('KeyE',false);
    return {progress:qaItemFrames(22),used:qaChest.used,spent:r.goldSpent,button:r.ui.touch.actText};
  });
  assert.ok(Math.abs(mid.progress-.5)<.015);assert.ok(!mid.used&&!mid.button);assert.equal(mid.spent,original.spent);
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);await page.evaluate(()=>qaItemFrames(0));
    await snapshot('14-interaction-'+width);
  }
  await resize(390,844);
  const visit=await page.evaluate(()=>{
    const r=app.run,objects=r.interactables.list;
    const costLabel=inspected.doc.querySelector('.wlabel.cost')?.textContent;
    qaPlace(objects.find(o=>o.kind==='freechest'&&!o.used));const switched=qaItemFrames(1);
    const altar=objects.find(o=>o.kind==='altar'&&!o.data.tier&&!o.used);
    qaPlace(altar);const left=qaItemFrames(91);
    return {costLabel,switched,left,charge:altar.charge,percent:inspected.doc.querySelector('.charge span')?.textContent};
  });
  assert.match(visit.costLabel,/金币/);assert.ok(visit.switched>0&&visit.switched<.025);
  assert.equal(visit.left,-1);assert.ok(visit.charge>0&&visit.charge<1);assert.match(visit.percent,/^\d+%$/);
  const poor=await page.evaluate(()=>{
    const r=app.run;r.gold=0;qaPlace(qaChest);qaItemFrames(48);
    return {state:r.state,used:qaChest.used,waiting:r.interactables.waitingForGold,text:inspected.doc.querySelector('.wlabel.nocost')?.textContent};
  });
  assert.equal(poor.state,'play');assert.ok(!poor.used&&poor.waiting);assert.match(poor.text,/金币 · 不足/);
  await snapshot('14-interaction-insufficient');
  const opened=await page.evaluate(halted=>{
    const r=app.run,cost=r.interactables.chestCost();r.gold=1000;
    const almost=qaItemFrames(44),early=qaChest.used;
    qaItemFrames(1);const used=qaChest.used;
    qaItemFrames(15);app.halted=halted;
    return {almost,early,used,spent:r.goldSpent,bought:r.chestsBought,cost};
  },original.halted);
  assert.ok(opened.almost>.97&&opened.almost<1&&!opened.early&&opened.used);
  assert.equal(opened.spent,original.spent+opened.cost);assert.equal(opened.bought,original.bought+1);
  fs.writeFileSync(path.join(dir,'item-dwell.json'),JSON.stringify({mid,visit,poor,opened},null,2));
  await page.waitForFunction(()=>inspected.doc.querySelector('[data-choice="showItemChoice"]'),{timeout:15000});
  async function checkDialog(name){
    await snapshot(name);
    const state=await page.evaluate(()=>{
      const d=inspected.doc.querySelector('.zx-item-dialog'),b=d.getBoundingClientRect(),body=d.querySelector('.zx-item-body').getBoundingClientRect();
      const footer=d.querySelector('.zx-item-actions').getBoundingClientRect();
      return {team:!!d.querySelector('.pk-btn,.pk-row')||d.textContent.includes('查看我的队伍'),images:d.querySelectorAll('.zx-item-image').length,x:b.x,y:b.y,w:b.width,h:b.height,bodyBottom:body.y+body.height,footerY:footer.y,footerBottom:footer.y+footer.height,width:inspected.env.innerWidth,height:inspected.env.innerHeight};
    });
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
  fs.writeFileSync(path.join(dir,'item-rewards.json'),JSON.stringify({choice,single,sale,result},null,2));
  await page.evaluate(before=>{
    app.run.player.pos.set(before.x,before.y,before.z);app.run.player.vel.set(0,0,0);
    delete window.qaChest;delete window.qaPlace;delete window.qaItemFrames;delete window.qaRewardButton;
  },original);
}
