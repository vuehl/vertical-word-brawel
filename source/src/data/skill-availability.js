// Keep retired IDs reserved so old saves cannot turn them into another skill.
export const retiredMoveIds = new Set([
  36, 44, 172, 179, 242, 245, 514, 583, 50104,
  10, 163, 225, 257, 337, 394, 424,
]);
// Permanent IDs: old saves must never resolve a removed fusion as a new skill.
export const activeFusionIds = new Set([50001, 50006, 50080, 50106]);
export const retiredFusionId = id => id >= 50000 && id <= 50106 && !activeFusionIds.has(id);

const fireForms = new Set([4, 5, 6]);
const windForms = new Set([16, 17, 18, 58, 59]);
const windMoves = new Set([98, 33, 17, 332, 239, 49001]);
const windFusions = new Set([50006, 50106]);

export function moveOfferLevel(species, level) {
  return fireForms.has(Number(species)) || windForms.has(Number(species)) ? 1 : Math.max(1, level);
}

export function moveAvailableForSpecies(id, species) {
  if (retiredMoveIds.has(id) || retiredFusionId(id)) return false;
  if (species == null) return true;
  if (windForms.has(Number(species))) return windMoves.has(id) || windFusions.has(id);
  if (id === 49001 || windFusions.has(id)) return false;
  return !(id === 403 && fireForms.has(Number(species))) && !(id === 488 && !fireForms.has(Number(species)));
}

export function configureSkillLearnsets(learnsets) {
  for (const [species, moves] of Object.entries(learnsets)) {
    learnsets[species] = moves.filter(([id]) => moveAvailableForSpecies(id, species));
  }
  // Descendants also inherit these offers through the base learnset.
  learnsets[16] = [...windMoves].map(id => [id, 1]);
  // Expose the authored stampede using the ordinary Flame Charge ID.
  learnsets[4] = [...(learnsets[4] ?? []).filter(([id]) => id !== 488), [488, 1]];
}
