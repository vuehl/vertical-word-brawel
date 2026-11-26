export function classDamageMultiplier(stats, damageClass) {
  return stats.damage * (damageClass === 'physical' ? stats.physical : stats.special);
}

export const ultimateResearchBonus = level => .04 * level;

export function ultimateChargeRate(ability, items, researchLevel) {
  return (ability === 'lunar-blessing' ? 1.3 : 1) *
    (items?.has('soul-dew') ? 1.4 : 1) * (items?.has('poke-flute') ? 1.25 : 1) *
    (1 + ultimateResearchBonus(researchLevel));
}
