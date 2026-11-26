import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifyResearchStats({page,tap,dir}){
  const card=async()=>{
    const print=await page.waitForFunction(()=>app.screen?.querySelector('.journey-info[data-face="stats"] .journey-profile-print')?.getAttribute('aria-label'));
    const label=await print.jsonValue();
    const [title,...fields]=label.split('，');
    assert.equal(title,'开局属性');
    assert.equal(fields.length,6);
    return Object.fromEntries(fields.map(field=>{
      assert.match(field,/^\S+ \d+(?:\.\d+)?%?$/);
      return field.split(' ');
    }));
  };
  await page.evaluate(async()=>{
    // Seed only the isolated fixture's wallet, then use the normal purchase flow.
    const query=await wx.cloud.callContainer({path:'/v1/progress',method:'GET'});
    const {progress,revision}=query.data;
    progress.stardust=progress.totalStardust=3000;
    const saved=await wx.cloud.callContainer({path:'/v1/progress',method:'PUT',data:{revision,progress,mutation:'research-stats-wallet'}});
    if(saved.statusCode!==200)throw Error('Fixture wallet was not saved');
  });
  await tap('[data-action="journey"]');
  await tap('[data-action="profile-stats"]');
  const before=await card();
  await tap('[data-action="collection-back"]');
  await tap('[data-action="lab"]');
  await tap('[data-research="dmg"]');
  await tap('[data-action="confirm-research"]');
  await page.waitForFunction(()=>app.meta.lab('dmg')===1);
  await tap('.zx-footer .paper-back');
  await tap('[data-action="journey"]');
  await tap('[data-action="profile-stats"]');
  const after=await card();
  for(const name of ['物理伤害倍率','特殊伤害倍率']){
    assert.ok(parseFloat(after[name])>parseFloat(before[name]),name);
  }
  assert.equal(after['最大生命'],before['最大生命']);
  // A save received while the card is visible must repaint only the stat slip.
  await page.evaluate(async()=>{
    for(const id of ['hp','armor','spd','atkspd','area','crit','regen','magnet','xp','gold','luck','ult']){
      app.meta.adopt(await app.backend.buyLab(app.meta.account,id,1));
    }
  });
  const fire=await card();
  assert.ok(Number(fire['最大生命'])>Number(after['最大生命']));
  await page.waitForFunction(()=>!app.screen._journeyCamera&&inspected.layout.box(app.screen.querySelector('.journey-profile-print'))?.opacity===1);
  await page.evaluate(()=>inspected.env.drawUI(app.r.renderer));
  await page.screenshot({path:path.join(dir,'research-stats-fire.png')});
  await tap('[data-species="16"]');
  const wind=await card();
  assert.notDeepEqual(wind,fire);
  await tap('[data-action="profile-route"]');
  await tap('[data-action="profile-stats"]');
  assert.deepEqual(await card(),wind);
  await tap('[data-action="stat-details"]');
  const details=await page.evaluate(()=>Object.fromEntries([...app.screen.querySelectorAll('.zc-stat')]
    .map(row=>[row.firstElementChild.textContent,row.lastElementChild.textContent])));
  await tap('[data-action="collection-back"]');
  await tap('[data-action="collection-next"]');
  await tap('[data-action="enter"]');
  await page.waitForFunction(()=>app.run?.state==='play',{timeout:90000});
  const opening=await page.evaluate(()=>{
    const p=app.run.player,s=p.stats,percent=n=>Number((n*100).toFixed(1))+'%';
    if(p.speciesId!==16)throw Error('Unexpected starting species');
    return {'最大生命':String(p.maxHp),'物理伤害倍率':percent(s.damage*s.physical),'护甲':String(Number(s.armor.toFixed(1))),
      '特殊伤害倍率':percent(s.damage*s.special),'攻击速度':percent(s.attackSpeed),'移动速度':percent(s.moveSpeed),
      '全局伤害倍率':percent(s.damage),'暴击率':percent(s.critChance),'大招充能速度':percent(app.run.ult.rate()),
      '攻击范围':percent(s.area),'生命回复':Number(s.regen.toFixed(2))+' / 秒','拾取范围':Number(s.pickupRange.toFixed(1))+' 厘米',
      '经验获取':percent(s.xpGain),'金币获取':percent(s.gold),'幸运':String(s.luck)};
  });
  for(const [name,value] of Object.entries(opening))assert.equal(details[name],value,name);
  for(const [name,value] of Object.entries(wind))assert.equal(value,opening[name],name);
  console.log(before,after,wind);
}
