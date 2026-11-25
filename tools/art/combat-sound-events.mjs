import {EVOLUTION_REVEAL} from '../../source/src/effects/evolution-timing.js';

// These arguments drive the same audio methods used by a run.
export const combatSoundEvents = [];
function add(key, use, method, ...args) {
  combatSoundEvents.push({key, use, method, args});
}
for (const [move, label, impact] of [
  ['ember','火点拍'], ['fire-blast','大字爆炎',true], ['fire-spin','火焰漩涡',true],
  ['inferno','炼狱',true], ['flamethrower','喷射火焰'], ['stampede','烈焰狂奔'],
  ['quick-attack','电光一闪'], ['tackle','撞击'], ['wing-attack','翅膀攻击'],
  ['aerial-ace','燕返'], ['air-slash','空气斩'],
]) {
  add(move + ':cast', label + '发动', 'move', move, 'cast');
  if (impact) add(move + ':impact', label + '爆开', 'move', move, 'impact');
}
for (const [tier, strength, label] of [['weak',.5,'弱'], ['normal',1,'普通'], ['strong',2,'强']]) {
  add('hit:' + tier, label + '命中', 'hit', strength, false);
  add('crit:' + tier, label + '命中的暴击', 'hit', strength, true);
}
add('mega', '超级暴击额外提示', 'hit', 1, false, true);
for (const [strength, label] of [[.35,'小型'], [.65,'中型'], [1,'大型']]) {
  add('boom:' + strength, label + '通用爆炸', 'boom', strength);
}
for (const [key, use] of [
  ['pop','击倒敌人'], ['coin','拾取金币或局内交易成功'], ['heal','获得治疗反馈'],
  ['power','获得强化或触发增益'], ['whoosh','冲刺或风环掠过'], ['hurt','玩家受伤'],
  ['dodge','成功闪避'], ['jump','起跳'], ['land','落地'], ['chest','开启宝箱'],
  ['levelUp','升级'], ['streakMilestone','达成连击里程碑'], ['evolveDone','进化形态揭晓'],
]) add(key, use, key);
add('charge','祭坛充能，音调跟随进度变化','charge', .5);
add('jump-high','二段跳','jump',1.3);
add('evolve','进化揭晓前的渐强音','evolve',EVOLUTION_REVEAL);
for (const [base, label] of [[4,'低'],[12,'中'],[20,'高']]) {
  add('streak:' + base, '连续击倒的' + label + '音区，音调跟随连击数变化', 'streak', base);
}
for (let step = 1; step <= 15; step++) {
  add('xp:' + step, '连续拾取经验的第 ' + step + (step === 15 ? ' 次及以后' : ' 次'), 'xp', step);
}
