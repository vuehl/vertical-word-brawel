import assert from 'node:assert/strict';
import path from 'node:path';
import {heldItems} from '../source/src/catalogs.js';

export async function reviewBattlePlan({page,tap,dir}){
  const action=key=>tap('[data-action="'+key+'"]');
  const tab=key=>tap('[data-plan-tab="'+key+'"]');
  await action('journey');
  await tap('[data-species="16"]');
  await action('collection-plan');
  const selected={};
  for(const group of ['moves','vitamins','fusions','items']){
    await tab(group);
    const key=await page.evaluate(group=>group==='moves'?'m403':app.screen.querySelector('[data-plan-key]').dataset.planKey,group);
    await tap('[data-plan-key="'+key+'"]');
    assert.equal(await page.evaluate(()=>app.screen.querySelector('.zc-plan-marked').textContent),'已标记 1 项');
    selected[group]=[key];
    await page.screenshot({path:path.join(dir,'plan-'+group+'.png')});
  }
  await action('collection-next');
  const saved=await page.evaluate(()=>JSON.parse(wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8')).accounts[app.meta.account.id].profile.collection.plans);
  assert.deepEqual(saved[16],selected);
  await tap('[data-species="4"]');await action('collection-plan');
  assert.equal(await page.evaluate(()=>app.screen.querySelectorAll('.zc-plan-row.marked').length),0);
  await action('collection-back');
  await tap('[data-species="16"]');await action('collection-plan');
  await tap('[data-plan-key="m403"]');await action('collection-back');
  assert.deepEqual(await page.evaluate(()=>app.meta.profile.collection.plans[16]),selected,'Back discards edits');
  await action('collection-next');await action('enter');
  await page.waitForFunction(()=>app.run?.state==='play'&&app.run.time>1,{timeout:90000});
  const result=await page.evaluate(()=>{
    const run=app.run,player=run.player,plan=run.meta.profile.collection.plans[16];
    const badges=()=>[...run.ui.modalEl.querySelectorAll('.zc-plan-badge')].map(n=>n.textContent);
    const result={};
    let choose,offers;
    const renderLevel=run.ui.showLevelUp;
    run.ui.showLevelUp=(r,items,pick)=>{choose=pick;offers=items;return renderLevel(r,items,pick);};
    app.halted=true;run.pendingLevels=1;run.ui.experienceReady=()=>true;run.doLevelUp();
    run.rerolls=20;
    const marked=new Set();
    for(let draw=0;draw<16;draw++){
      const matches=offers.filter(o=>plan.moves.includes(o.key)||plan.vitamins.includes(o.key));
      if(badges().length!==matches.length)throw Error('Incorrect upgrade plan badges');
      for(const offer of matches)marked.add(offer.key);
      choose(null,'reroll');
    }
    result.marked=marked.size;
    run.banished.add(plan.moves[0]);run.banished.add(plan.vitamins[0]);
    choose(null,'reroll');result.banished=badges();
    run.ui.showLevelUp=renderLevel;
    run.ui.hideModal();run.state='play';run.pendingLevels=0;
    run.gold=10000;run.openShop();
    const first=run.shop.stock.map(lot=>lot.key);
    if(badges().length!==first.filter(key=>plan.items.includes(key)).length)throw Error('Incorrect shop badges');
    result.refresh=run.rerollShop()&&run.shop.stock.every(lot=>!first.includes(lot.key));
    const seen=new Set([...first,...run.shop.stock.map(lot=>lot.key)]);
    const renderChoice=run.ui.showItemChoice,renderItem=run.ui.showItem;
    const checkItemBadges=keys=>{
      if(badges().length!==keys.filter(key=>plan.items.includes(key)).length)throw Error('Incorrect loot badges');
      for(const key of keys)seen.add(key);
    };
    run.ui.showItemChoice=(r,keys,pick)=>{renderChoice(r,keys,pick);checkItemBadges(keys);};
    run.ui.showItem=(r,key,pick)=>{renderItem(r,key,pick);checkItemBadges([key]);};
    for(let i=0;i<16;i++){
      run.ui.hideModal();run.state='play';run.rollChestItem(false,0,i%2?1:3);
    }
    result.items=[...seen].sort();
    run.ui.showItemChoice=renderChoice;run.ui.showItem=renderItem;
    run.ui.hideModal();run.state='play';
    player.addMove(17);player.addMove(542);
    for(const move of player.moves)if(move)move.level=4;
    run.interactables.interact({kind:'bill'});
    result.fusion=badges();return result;
  });
  const mark='★ 计划中';
  assert.deepEqual(result,{marked:2,banished:[],refresh:true,items:heldItems.map(item=>item.key).sort(),fusion:[mark]});
}
