import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const art = path.join(root, 'source/art/upgrade');
const output = path.join(root, 'source/public/assets/vfx/evolution-light.webp');
const tile = 160, columns = 8, rows = 9;

async function recording(name) {
  return sharp(path.join(art, name), {animated: true}).removeAlpha().raw()
    .toBuffer({resolveWithObject: true});
}

// Both recordings contain the same desk, animated glyph and base orbit. The
// new recording darkens the desk while its gold streaks increase blue light.
// Only the light added over that shared footage belongs in the runtime sprite.
const [base, effect] = await Promise.all([recording('jinhua.gif'), recording('进化光效.gif')]);
const width = 368, height = 276, pixels = width * height;
if ([base, effect].some(({info}) => info.width !== width || info.height !== height * 171 || info.channels !== 3))
  throw Error('Expected the matching 368 × 276 evolution recordings');

function lightMask(frame) {
  const offset = frame * pixels * 3;
  const rgba = Buffer.alloc(pixels * 4);
  for (let p = 0; p < pixels; p++) {
    const i = offset + p * 3, x = p % width, y = Math.floor(p / width);
    const background = base.data[i + 2], blue = effect.data[i + 2];
    let light = Math.max(0, Math.min(1, (blue - background - 6) / Math.max(46, 236 - background)));
    // Both recordings saturate at the reveal. Recover its white core directly
    // inside the burst, where differencing two near-white pixels loses it.
    if (frame >= 124 && frame <= 130) {
      const white = Math.max(0, Math.min(1, (blue - 170) / 80));
      const gold = Math.max(0, Math.min(1, (effect.data[i] - 222) / 28));
      light = Math.max(light, white * gold);
    }
    // The capture crops some long streaks. Feather their tips into the live scene.
    const edge = Math.min(1, x / 18, (width - 1 - x) / 18, y / 16, (height - 1 - y) / 16);
    rgba[p * 4] = 255;
    rgba[p * 4 + 1] = 215 + 39 * light;
    rgba[p * 4 + 2] = 144 + 105 * light;
    rgba[p * 4 + 3] = Math.round(255 * light * edge);
  }
  return rgba;
}

const cells = [];
for (let cell = 0; cell < columns * rows; cell++) {
  const input = await sharp(lightMask(cell * 2), {raw: {width, height, channels: 4}})
    .resize(tile, tile, {fit: 'contain', background: '#00000000'}).png().toBuffer();
  cells.push({input, left: cell % columns * tile, top: Math.floor(cell / columns) * tile});
}
await sharp({create: {width: columns * tile, height: rows * tile, channels: 4, background: '#00000000'}})
  .composite(cells).webp({quality: 83, alphaQuality: 91, effort: 6}).toFile(output);
