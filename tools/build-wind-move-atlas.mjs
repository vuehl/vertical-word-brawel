import path from 'node:path';
import sharp from 'sharp';

// Registered crops from the three 390 x 892 combat recordings.
const directory = process.argv[2];
if (!directory) throw Error('Pass the directory containing the three wind move GIFs');
const tile = 192, columns = 8, rows = 5, layers = [];
async function recording(name) {
  const file = path.join(directory, name + '.gif');
  const read = page => sharp(file, {page}).removeAlpha().raw().toBuffer();
  const background = await read(4);
  return async (page, left, top, select, angle=0) => {
    const frame = await read(page);
    const pixels = Buffer.alloc(tile * tile * 4);
    for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) {
      const sx = left+96+Math.round((x-96)*Math.cos(angle)-(y-96)*Math.sin(angle));
      const sy = top+96+Math.round((x-96)*Math.sin(angle)+(y-96)*Math.cos(angle));
      if (sx < 0 || sx >= 390 || sy < 0 || sy >= 892) continue;
      const j = (390 * sy + sx) * 3;
      const r = frame[j], g = frame[j+1], b = frame[j+2];
      const diff = Math.abs(r-background[j])+Math.abs(g-background[j+1])+Math.abs(b-background[j+2]);
      if (diff < 9) continue;
      const rgba = select(sx,sy,r,g,b,diff,background.subarray(j,j+3));
      if (rgba) pixels.set(rgba, (y * tile + x) * 4);
    }
    const index = layers.length;
    layers.push({input:pixels, raw:{width:tile,height:tile,channels:4},
      left:index%columns*tile, top:Math.floor(index/columns)*tile});
  };
}
const twister = await recording('龙卷风');
for (let page = 7; page <= 18; page++) {
  const cx = Math.round(201+(page-7)*3.45), foot = Math.round(505-(page-7)*7.6);
  await twister(page,cx-96,foot-176,(x,y,r,g,b,diff) => {
    const height = foot-y;
    if (height < 0 || height > 174 || (y<260 && x<210) || Math.abs(x-cx) > Math.min(88,32+height*.49)) return;
    const chroma = Math.max(r,g,b)-Math.min(r,g,b);
    if (chroma > 31 || Math.min(r,g,b)<55) return;
    return [r,g,b,Math.min(255,(32-chroma)*24,diff*8)];
  });
}
const ace = await recording('燕返');
const cyan = (r,g,b,diff) => {
  const tint = Math.min(g-r,b-r);
  if (tint < 8 && Math.min(r,g,b)<229) return;
  return [r,g,b,Math.min(255,diff*5)];
};
// Register one blade from each pose against its tangent. Each live homing
// projectile supplies its own position and facing, including extra shots.
const blades=[
  [153,461,-10,48],[152,451,-8,57],[151,439,-4,66],[152,425,8,66],
  [156,411,19,64],[162,398,30,59],[170,386,40,53],[180,376,45,45],
  [192,367,50,38],[204,359,56,32],
];
for (const [index,[cx,cy,dx,dy]] of blades.entries()) {
  const page=10+index;
  await ace(page,cx-96,cy-96,(x,y,r,g,b,diff) => {
    if (Math.hypot(x-cx,y-cy)>49 || Math.hypot(x-194,y-522)<49 || x<141 || y>503) return;
    return cyan(r,g,b,diff);
  },Math.atan2(dx,dy));
}
for (const page of [20,21,22,24,26,28,31,34]) {
  await ace(page,248-96,373-96,(x,y,r,g,b,diff) => {
    if (Math.hypot((x-248)/1.45,y-373)>34) return;
    return cyan(r,g,b,diff);
  });
}
const dash = await recording('电光一闪');
// The third ghost is isolated on bare paper after the speed lines fade.
await dash(10,267-96,306-96,(x,y,r,g,b,diff,bg) => {
  if (x<242 || x>293 || y<281 || y>329) return;
  const a = Math.max(0,(b-bg[2])/(244-bg[2]));
  if (a<.035) return;
  return [Math.max(0,Math.min(255,bg[0]+(r-bg[0])/a)),Math.max(0,Math.min(255,bg[1]+(g-bg[1])/a)),244,Math.min(255,a*1000)];
});
for (const page of [6,8,10,12]) {
  await ace(page,194-96,522-96,(x,y,r,g,b,diff) => {
    const radius = Math.hypot(x-194,(y-522)*1.12);
    if (radius<32 || radius>52 || y>552) return;
    return cyan(r,g,b,diff);
  });
}
for (const page of [6,7,8,9]) {
  await dash(page,204-96,511-96,(x,y,r,g,b,diff) => {
    const radius = Math.hypot(x-204,(y-511)*1.1);
    if (radius<55 || radius>68 || y>533 || r-g<9 || g-b<8) return;
    return [255,225,168,Math.min(230,diff*2)];
  });
}
await sharp({create:{width:tile*columns,height:tile*rows,channels:4,background:'#00000000'}})
  .composite(layers).png({palette:true,colours:256,dither:0}).toFile(
    path.resolve(import.meta.dirname,'../source/public/assets/vfx/wind-moves.png'));
