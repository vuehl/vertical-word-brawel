// These three catalog entries have no source image. Reuse the existing feather
// and healing icons instead of requesting files that cannot be loaded.
const aliases=Object.freeze({
  'items/fairy-feather.png':'items/rainbow-wing.png',
  'items/paralyze-heal.png':'items/full-heal.png',
  'items/antidote.png':'items/full-heal.png',
});
export const resolveItemIcon=path=>aliases[path]||path;
