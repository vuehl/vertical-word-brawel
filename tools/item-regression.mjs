import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewItems({page,tap,resize,dir,sleep,snapshot}) {
  const original=await page.evaluate(()=>{
    const r=app.run,p=r.player.pos,s=app.meta.profile.settings;
    const before={x:p.x,y:p.y,z:p.z,touchScale:s.touchScale,extra:s.zxExtraControls};
    const chest=r.interactables.list.find(e=>e.kind==='chest'&&!e.used&&!e.data?.gift);
    if(!chest)throw Error('No paid chest available for interaction test');
    window.qaChest=chest;r.gold=1000;p.set(chest.x,chest.y,chest.z);r.player.vel.set(0,0,0);
    return before;
  });
  await page.waitForFunction(()=>inspected.doc.querySelector('.zx-act-title')?.textContent==='开启宝箱');
  const layouts=[];
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await resize(width,height);
    for(const scale of [.7,1,1.3]){
      await page.evaluate(scale=>{const s=app.meta.profile.settings;s.touchScale=scale;s.zxExtraControls=true;app.applySettings();},scale);
      await sleep(250);
      const layout=await page.evaluate(()=>{
        const box=sel=>{const b=inspected.layout.box(inspected.doc.querySelector(sel));return b&&{x:b.x,y:b.y,w:b.w,h:b.h};};
        return {width:inspected.env.innerWidth,height:inspected.env.innerHeight,act:box('.tc-act'),ult:box('.tc-ultb'),stick:box('.tc-stick'),extras:['.tc-jump','.tc-dash','.tc-lock','.tc-aim'].map(box),label:inspected.doc.querySelector('.tc-act').textContent};
      });
      const {act,ult,stick}=layout,overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      assert.ok(act&&act.w>=44&&act.h>=44&&act.y>=ult.y+ult.h+4,'Interaction must be below the ultimate with a usable touch area');
      assert.ok(act.x>=0&&act.x+act.w<=width&&act.y+act.h<=layout.height,'Interaction must fit on screen');
      assert.ok(!overlap(act,stick)&&layout.extras.every(e=>!overlap(e,act)&&act.y+act.h+6<=e.y),'Interaction must leave space above optional buttons: '+JSON.stringify({scale,...layout}));
      assert.match(layout.label,/开启宝箱.*金币/);layouts.push({scale,...layout});
    }
    await page.evaluate(()=>{app.meta.profile.settings.touchScale=1;app.meta.profile.settings.zxExtraControls=false;app.applySettings();});
    await snapshot('14-interaction-'+width);
  }
  fs.writeFileSync(path.join(dir,'item-interaction-layouts.json'),JSON.stringify(layouts,null,2));
  await resize(390,844);
  await page.evaluate(()=>{app.run.gold=0;});
  await page.waitForFunction(()=>inspected.doc.querySelector('.zx-act-title')?.textContent==='金币不足');
  await tap('.tc-act');
  assert.equal(await page.evaluate(()=>app.run.state),'play','An unaffordable chest must stay closed');
  assert.equal(await page.evaluate(()=>qaChest.used),false);
  await snapshot('14-interaction-insufficient');
  await page.evaluate(()=>{app.run.gold=1000;qaChest.data={...qaChest.data,gift:true};});
  await page.waitForFunction(()=>inspected.doc.querySelector('.zx-act-detail')?.textContent==='免费');
  await page.evaluate(()=>{qaChest.used=true;});
  await page.waitForFunction(()=>!app.run.ui.touch.actText);
  await page.evaluate(()=>{qaChest.used=false;delete qaChest.data.gift;});
  await page.waitForFunction(()=>inspected.doc.querySelector('.zx-act-detail')?.textContent.includes('金币'));
  await tap('.tc-act');
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
  fs.writeFileSync(path.join(dir,'item-rewards.json'),JSON.stringify({choice,single,sale,result},null,2));
  await page.evaluate(before=>{
    const s=app.meta.profile.settings;s.touchScale=before.touchScale;s.zxExtraControls=before.extra;app.applySettings();
    app.run.player.pos.set(before.x,before.y,before.z);app.run.player.vel.set(0,0,0);
    delete window.qaChest;delete window.qaRewardButton;
  },original);
}
