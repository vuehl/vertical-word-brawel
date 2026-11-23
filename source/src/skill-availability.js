// Keep retired IDs reserved so old saves cannot turn them into another skill.
export const retiredMoveIds = new Set([
  36, 44, 172, 179, 242, 245, 514, 583, 50104,
  10, 163, 225, 257, 337, 394, 424,
]);
// Permanent IDs: old saves must never resolve a removed fusion as a new skill.
export const activeFusionIds = new Set([50001, 50006, 50080, 50088]);
export const retiredFusionId = id => id >= 50000 && id <= 50105 && !activeFusionIds.has(id);

const fireForms = new Set([4, 5, 6]);
const windForms = new Set([16, 17, 18, 58, 59]);
// Shared fire skills stay enabled for other families; wind cannot learn or
// restore Ember, Flamethrower or Scorching Sun from older loadouts.
const windExcludedMoves = new Set([52, 53, 488, 50080]);
export function moveAvailableForSpecies(id, species) {
  return !retiredMoveIds.has(id) && !retiredFusionId(id) && !(id === 403 && fireForms.has(Number(species))) &&
    !(id === 488 && species != null && !fireForms.has(Number(species))) &&
    !(windForms.has(Number(species)) && windExcludedMoves.has(id));
}

export function configureSkillLearnsets(learnsets) {
  for (const [species, moves] of Object.entries(learnsets)) {
    learnsets[species] = moves.filter(([id]) => moveAvailableForSpecies(id, species));
  }
  // Both wind branches inherit the base form's level-one Air Slash offer.
  const wind = learnsets[16] ?? [];
  learnsets[16] = [...wind.filter(([id]) => id !== 403), [403, 1]];
  // Expose the authored stampede using the ordinary Flame Charge ID.
  learnsets[4] = [...(learnsets[4] ?? []).filter(([id]) => id !== 488), [488, 1]];
}
