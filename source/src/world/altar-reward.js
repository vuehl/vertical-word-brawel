
function rollAltarTier(rng, poolSize, luckMult) {
  // Draw one blessing from the area's original tier distribution.
  const slot = rng.int(0, poolSize - 1);
  if (slot === 0 && rng.chance(Math.min(.3, .2 * Math.sqrt(Math.max(1, luckMult))))) return 3;
  const rareSlots = poolSize >= 4 ? Math.max(1, Math.round(poolSize * .15)) : 0;
  if (slot < rareSlots) return 2;
  return slot < rareSlots + Math.round(poolSize * .3) ? 1 : 0;
}

export {
  rollAltarTier
};
