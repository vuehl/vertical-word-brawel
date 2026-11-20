import path from 'node:path';
import sharp from 'sharp';

// Input is the artist's full-screen GIF recording of 一阵刮来.
const input = process.argv[2];
if (!input) throw Error('Pass the path to the 一阵刮来 recording');
const read = page => sharp(input, {page}).removeAlpha().raw().toBuffer();
const background = await read(4);
const tile = 224, layers = [];
for (let page = 8; page <= 15; page++) {
  const rgb = await read(page);
  const pixels = Buffer.alloc(tile * tile * 4);
  // Track the travelling tip so the game can supply its own world trajectory.
  const left = Math.round(103 + (page - 11) * 3.55);
  const top = Math.round(272 - (page - 11) * 7.6);
  for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) {
    const src = ((top + y) * 390 + left + x) * 3;
    const [r, g, b] = rgb.subarray(src, src + 3);
    const difference = Math.abs(r-background[src])+Math.abs(g-background[src+1])+Math.abs(b-background[src+2]);
    const chroma = Math.min(g-r, b-r);
    if (difference < 40 || (chroma < 12 && !(r > 225 && g > 240 && b > 235))) continue;
    // The camera is fixed, but the hero and enemies also animate in the recording.
    if (y > 90 && Math.abs(x - tile / 2) > (tile-y)*.84 || y > 207) continue;
    pixels.set([r, g, b, Math.min(255, (difference-40)*4)], (y * tile + x) * 4);
  }
  const frame = page - 8;
  layers.push({input: pixels, raw: {width:tile,height:tile,channels:4}, left:frame%4*tile, top:Math.floor(frame/4)*tile});
}
const atlas = sharp({create:{width:tile*4,height:tile*2,channels:4,background:'#00000000'}});
await atlas.composite(layers).png({palette:true,colours:256}).toFile(
  path.resolve(import.meta.dirname,'../source/public/assets/vfx/wind-vortex.png'));
