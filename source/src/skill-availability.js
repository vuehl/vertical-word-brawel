// Keep retired IDs reserved so old saves cannot turn them into another skill.
export const retiredMoveIds = new Set([
  36, 44, 172, 179, 242, 245, 514, 583, 50104,
  10, 163, 225, 257, 337, 394, 424,
]);
export const retiredFusionKeys = new Set(['fu-58', 'fu-t-normal', 'fu-t-dragon', 'fu-missingno']);

const fireForms = new Set([4, 5, 6]);
export function moveAvailableForSpecies(id, species) {
  return !retiredMoveIds.has(id) && !(id === 403 && fireForms.has(Number(species)));
}

export function configureSkillLearnsets(learnsets) {
  for (const [species, moves] of Object.entries(learnsets)) {
    learnsets[species] = moves.filter(([id]) => moveAvailableForSpecies(id, species));
  }
  // Both wind branches inherit the base form's level-one Air Slash offer.
  const wind = learnsets[16] ?? [];
  learnsets[16] = [...wind.filter(([id]) => id !== 403), [403, 1]];
}
