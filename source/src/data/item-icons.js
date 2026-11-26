// These healing items share the same artwork.
const aliases=Object.freeze({
  'items/paralyze-heal.png':'items/full-heal.png',
  'items/antidote.png':'items/full-heal.png',
});
export const resolveItemIcon=path=>aliases[path]||path;

// Particle atlas cells also load icons for pickups outside the inventory.
export const battleParticleImages = [
  [56, 'items/oran-berry'],
  [57, 'items/magnet'],
  [58, 'items/repel'],
  [59, 'items/rare-candy'],
  [60, 'items/nugget'],
  [61, 'items/big-nugget'],
  [62, 'icons/100'],
  [133, 'items/tm-fighting'],
  [134, 'items/tm-psychic'],
  [135, 'items/tm-steel'],
  [136, 'items/tm-electric'],
  [137, 'items/tm-normal'],
];
