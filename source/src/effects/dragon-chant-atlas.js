// Both colourways share sprite geometry and a 9-bit colour index. The WebP
// carries an opaque byte grid so native canvas decoding preserves each index.
const width = 520, height = 466, colourCount = 512, exceptionCount = 91;
const headerRows = 3, visiblePixels = 88612;
const asset = '/assets/vfx/dragon-chant.webp';

// Source x/y, authored x/y on the 488 × 1055 PSD, width and height.
export const sprites = [
  [1,1,0,300,437,316],
  [204,319,0,454,106,103], [100,319,95,459,102,104],
  [1,319,187,467,97,105], [204,424,275,505,104,41],
  [312,388,97,470,9,48], [312,319,97,470,102,67],
  [416,319,187,478,95,59], [374,388,270,506,12,32],
  [416,380,280,387,97,55], [323,388,29,555,49,38],
  [1,426,111,573,97,31], [100,425,314,545,83,35],
];

function readAtlas(image) {
  const bytes = width * height + visiblePixels + Math.ceil(visiblePixels / 8);
  if (image.naturalWidth !== width || image.naturalHeight !== headerRows + Math.ceil(bytes / width)) {
    throw Error('万字归一图集尺寸不匹配');
  }
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const {data} = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = canvas.height = 1;
  const headerByte = i => data[Math.floor(i / 3) * 4 + i % 3];
  const palette = Uint8Array.from({length: colourCount * 6}, (_, i) => headerByte(i));
  const count = width * height;
  const greyStart = 4 * headerRows * width;
  const grey = i => data[greyStart + i * 4];
  const alpha = new Uint8Array(count), indices = new Uint16Array(count);
  const overrides = [];
  for (let n = 0; n < exceptionCount; n++) {
    const pos = palette.length + 4 * n;
    const at = headerByte(pos) + 256 * headerByte(pos + 1) + 65536 * headerByte(pos + 2);
    overrides.push([at, headerByte(pos + 3)]);
    indices[at] = 1; // Include pixels visible only in the red artwork.
  }
  let seen = 0;
  for (let i = 0; i < count; i++) {
    alpha[i] = grey(i);
    if (alpha[i] || indices[i]) {
      const high = grey(count + visiblePixels + (seen >> 3)) >> (seen & 7) & 1;
      indices[i] = grey(count + seen++) + high * 256;
    }
  }
  if (seen !== visiblePixels) throw Error('万字归一图集格式不匹配');
  return {palette, indices, alpha, overrides};
}

let loading, packed, cachedAtlas, cachedMode;
export function prepareDragonChant() {
  if (!loading) loading = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try { packed = readAtlas(image); resolve(); }
      catch (error) { reject(error); }
    };
    image.onerror = () => reject(Error('万字归一图集读取失败'));
    image.src = asset;
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

export function dragonChantAtlas(mode) {
  if (!packed) throw Error('请在开启关卡前等待 prepareDragonChant()');
  if (cachedMode === mode) return cachedAtlas;
  const atlas = cachedAtlas || document.createElement('canvas');
  atlas.width = width; atlas.height = height;
  const ctx = atlas.getContext('2d');
  const frame = ctx.createImageData ? ctx.createImageData(width, height) : ctx.getImageData(0,0,width,height);
  const {palette, alpha, indices, overrides} = packed;
  const red = mode === 'auto';
  const offset = red ? colourCount * 3 : 0;
  for (let i = 0; i < indices.length; i++) {
    const src = offset + 3 * indices[i], dest = 4 * i;
    frame.data[dest] = palette[src];
    frame.data[dest + 1] = palette[src + 1];
    frame.data[dest + 2] = palette[src + 2];
    frame.data[dest + 3] = alpha[i];
  }
  if (red) for (const [at, coverage] of overrides) frame.data[4 * at + 3] = coverage;
  ctx.putImageData(frame, 0, 0);
  cachedMode = mode;
  cachedAtlas = atlas;
  return atlas;
}
