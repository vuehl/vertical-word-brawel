// Artwork and progression from the supplied 2026-11 character sheets.
export const heroWords = Object.freeze({4:'炎',5:'焱',6:'燚',16:'风',17:'讽',18:'疯',58:'飒',59:'飙',132:'摹'});
export const enemyWords = Object.freeze(['苞','冰','虫','弹','罐','烬','驹','锯','菌','鲤','寐','恼','逆','瓶','拳','蛇','贪','藤','岩']);
export const heroFamily = id => [4,5,6].includes(Number(id)) ? 4 : [16,17,18,58,59].includes(Number(id)) ? 16 : Number(id) === 132 ? 132 : null;
export const windBuffSeconds = 6;
export function enemyWord(id, flags = 0, random = Math.random) {
  if (flags & (4 | 4096 | 8192)) return '敌';
  if (flags & (128 | 65536)) return heroWords[id] || '敌';
  return enemyWords[Math.min(enemyWords.length - 1, Math.floor(random() * enemyWords.length))];
}
export function configureCharacterData(actors) {
  for (const actor of actors) {
    if (![58,59].includes(actor.id)) continue;
    actor.family = 16;
    actor.evoFrom = actor.id === 58 ? 16 : 58;
    actor.evoStage = actor.id === 58 ? 1 : 2;
    actor.evoLevel = actor.id === 58 ? 18 : 36;
  }
}
export function applyWindBuffs(stats, buffs) {
  if (buffs.has('zx-wind-attack')) stats.attackSpeed *= 10;
  if (buffs.has('zx-wind-speed')) stats.moveSpeed *= 10;
}

export function createCharacterUltimates(original, ringAttack) {
  const fire = {...original[4], names:['一点火苗','火圈绕身','满屏是火']};
  const wind = {...original[16], names:['一阵刮来','卷着打转','刮倒一片'],
    descs:[original[16].descs[0], '风环向四周扩散，击退并伤害周围敌人。', `攻击速度变为当前的 10 倍，持续 ${windBuffSeconds} 秒。`],
    dur:[2,2.2,1.2],
    cast(context) {
      const stage = Math.min(2, context.form);
      if (stage === 2) context.run.player.addBuff('zx-wind-attack', windBuffSeconds, '刮倒一片 · 攻速×10');
      else if (stage === 1) ringAttack(context);
      else original[16].cast({...context,tier:0});
    }};
  const speed = {...original[58], names:['一阵刮来','冲！','没影了'],
    descs:[wind.descs[0],original[58].descs[0],`移动速度变为当前的 10 倍，持续 ${windBuffSeconds} 秒。`],
    dur:[2,original[58].dur[0],1.2],
    cast(context) {
      if (context.form >= 2) context.run.player.addBuff('zx-wind-speed', windBuffSeconds, '没影了 · 移速×10');
      else original[58].cast({...context,tier:0,form:0});
    }};
  const copy = {...original[132],names:['照着变'],descs:['随机复制炎或风的一种形态的大招，以自身属性施放。'],
    cast(context) {
      const choices = [[fire,0],[fire,1],[fire,2],[wind,0],[wind,1],[wind,2],[speed,1],[speed,2]];
      const [def,form] = choices[Math.floor(Math.random()*choices.length)];
      context.run.ui.popup(context.x,context.y+3,context.z,'照着变 · '+def.names[form],'#c8a0e8',1);
      def.cast({...context,form,tier:form,type:def.type,cls:def.cls});
    }};
  return {4:fire,16:wind,58:speed,132:copy};
}
