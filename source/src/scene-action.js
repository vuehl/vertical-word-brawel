// Compact copy for the same interaction that the run will execute on KeyE.
export function sceneAction(run,target,prompt){
  const raw=prompt.replace(/^\[E\]\s*/,'').trim();
  if(!raw)return null;
  const action=(title,detail='',unavailable=false)=>({title,detail,unavailable});
  if(/^(投掷精灵球|捕获头目)/.test(raw))return action('捕捉字灵',raw.match(/\d+\s*秒/)?.[0]||'');
  if(/^友友球/.test(raw))return action('招募伙伴',raw.match(/\d+\s*秒/)?.[0]||'');
  if(/^按住以复活/.test(raw))return action('救援队友','按住');
  if(!target)return action(raw);
  const {kind,used}=target,data=target.data??{};
  if(kind==='tower'){
    const clear=run.tower?.state==='clear';
    switch(data.sub){
      case 'stairs':return action('前往上层',clear?'':'先清除敌人',!clear);
      case 'altar':return action('献上供品',used?'已供奉':clear?'':'通关后开放',used||!clear);
      case 'trick':return action('触碰墓碑',used?'已使用':'',used);
      case 'portal':return action('穿过塔门');
      case 'leave':return action('离开试炼塔','结束本局');
    }
  }
  switch(kind){
    case 'chest':case 'slots':{
      if(kind==='chest'&&data.gift)return action('开启扭蛋','免费');
      const price=kind==='chest'?run.interactables.chestCost():Number((raw.match(/([\d,.]+)\s*(?:₽|金币)/)?.[1]||'').replace(/,/g,''));
      const poor=price>0&&run.gold<price;
      return action(poor?'金币不足':kind==='chest'?'开启扭蛋':'玩老虎机',price?price+' 金币':'',poor);
    }
    case 'freechest':return action('开启扭蛋','免费');
    case 'cursedchest':return action('开启咒箱','附带诅咒');
    case 'bill':return action('融合招式',used?'冷却中':data.ready?'可融合':'需满级招式',used);
    case 'meowth':return action('打开商店');
    case 'hypno':return action('遗忘技能');
    case 'ditto':return action('复制道具',used?'冷却中':'',used);
    case 'fossil':return action('复活化石',used?'已使用':'消耗生命上限',used);
    case 'rhydon':return action('强化首领',used||run.bossSpawned?'已结束':run.roars?run.roars+' / 3':'',used||run.bossSpawned);
    case 'nest':return action('拾取字灵蛋',used?'空巢':run.egg?'已携带':'',used||!!run.egg);
    case 'magnet':return action('吸取经验',used?'已耗尽':'',used);
    case 'berry':return action('拾取QQ糖',used?'已拾取':'',used);
    case 'shroom':return action('弹跳');
    case 'altar':return action('停留充能',used?'已耗尽':data.sealed?'尚未开启':'',used||!!data.sealed);
    case 'challenge':return action(used?'挑战进度':'开启挑战',used?(data.left?'剩 '+data.left+' 个':'已完成'):'',used);
    case 'boss':return action('召唤首领',run.bossSpawned?'已召唤':'',run.bossSpawned);
    case 'shrine':return action('触碰圣地',run.bossSpawned?'已唤醒':'',run.bossSpawned);
    case 'portal':return action(run.endless?'前往新区':data.sanct?(run.stage>=4?'离开圣地':'进入圣地'):'进入传送门');
    default:return action(raw);
  }
}
