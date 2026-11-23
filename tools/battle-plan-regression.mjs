import assert from 'node:assert/strict';
import path from 'node:path';

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
    let choose;
    const renderLevel=run.ui.showLevelUp;
    run.ui.showLevelUp=(r,offers,pick)=>{choose=pick;return renderLevel(r,offers,pick);};
    app.halted=true;run.pendingLevels=1;run.ui.experienceReady=()=>true;run.doLevelUp();
    result.upgrades=badges();
    choose(null,'reroll');result.redraw=badges();
    run.banished.add(plan.moves[0]);run.banished.add(plan.vitamins[0]);
    choose(null,'reroll');result.banished=badges();
    run.ui.showLevelUp=renderLevel;
    run.ui.hideModal();run.state='play';run.pendingLevels=0;
    run.gold=10000;run.openShop();
    result.shop=run.shop.stock.some(lot=>lot.key===plan.items[0])&&badges().length>0;
    result.refresh=run.rerollShop()&&run.shop.stock.some(lot=>lot.key===plan.items[0]);
    run.ui.hideModal();run.state='play';run.rollChestItem(false,0,3);
    result.pick=badges();run.ui.hideModal();run.state='play';run.rollChestItem(false,0,1);
    result.loot=badges();run.ui.hideModal();run.state='play';
    player.addMove(17);player.addMove(542);
    for(const move of player.moves)if(move)move.level=4;
    run.interactables.interact({kind:'bill'});
    result.fusion=badges();return result;
  });
  const mark='★ 计划中';
  assert.deepEqual(result,{upgrades:[mark,mark],redraw:[mark,mark],banished:[],shop:true,refresh:true,pick:[mark],loot:[mark],fusion:[mark]});
}
