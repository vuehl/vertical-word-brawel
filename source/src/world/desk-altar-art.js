export const altarLayers = {
  base: 'device-altar/device-altar_0.png',
  idle: 'device-altar/device-altar_default.png',
  active: 'device-altar/device-altar_active.png',
  tint: 'device-altar/color_alter.png',
};

// Dark/light samples from the artist's tinted grayscale layer, in sRGB.
const cyan = {dark:0x5de4da, light:0x88f4e6, ring:0xc9fff4};
const pink = {dark:0xf07d9b, light:0xff9ebb, ring:0xffedf4};
const gold = {dark:0xe1e074, light:0xf2ed98, ring:0xfff7d2};
export const altarPalette = [cyan,pink,pink,gold];
