import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// One UV tile per remaining suffix of the numbered strokes. Every tile uses
// the same crop as the full word so the surviving strokes never shift or zoom.
export async function writeMonsterAtlas(artDir, output, enemies) {
  const size = 96, columns = 20, layers = [];
  for (const record of Object.values(enemies)) {
    const {word, tier} = record;
    const dir = path.join(artDir, ['一阶','二阶','三阶'][tier - 1]);
    const full = await sharp(path.join(dir, word + '.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const {width, height} = full.info;
    const files = fs.readdirSync(path.join(dir, word)).filter(f => f.endsWith('.png'));
    if (!files.length) throw Error('Missing strokes for ' + word);
    record.strokes = files.length;
    record.firstTile = layers.length;
    // Tile 0 in each sequence is the last surviving stroke; the last tile is the complete PNG.
    let left = width, top = height, right = -1, bottom = -1;
    for (let i = 0; i < width * height; i++) {
      if (!full.data[i*4+3]) continue;
      const x = i % width, y = Math.floor(i / width);
      left = Math.min(left,x); right = Math.max(right,x);
      top = Math.min(top,y); bottom = Math.max(bottom,y);
    }
    const crop = {left, top, width:right-left+1, height:bottom-top+1};
    const raw = {width, height, channels:4};
    let suffix = Buffer.alloc(full.data.length);
    for (let number = files.length; number >= 1; number--) {
      const stroke = await sharp(path.join(dir, word, word+'-'+number+'.png')).ensureAlpha().png().toBuffer({resolveWithObject:true});
      if (stroke.info.width !== width || stroke.info.height !== height) throw Error('Stroke canvas mismatch: '+word+'-'+number);
      suffix = await sharp(suffix,{raw}).composite([{input:stroke.data,blend:'dest-over'}]).raw().toBuffer();
      const fill = await sharp(number === 1 ? full.data : suffix,{raw}).extract(crop)
        .resize(80,80,{fit:'contain',background:'#00000000'})
        .extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).png().toBuffer();
      const alpha = await sharp(fill).extractChannel('alpha').raw().toBuffer();
      // Keep the battle ink border around only the strokes still on screen.
      const border = Buffer.alloc(size*size*4);
      for (let i=0; i<alpha.length; i++) {
        border[i*4]=39; border[i*4+1]=35; border[i*4+2]=47;
        if (!alpha[i]) continue;
        const x=i%size, y=Math.floor(i/size);
        for (let dy=-7;dy<=7;dy++) for (let dx=-7;dx<=7;dx++) {
          if (dx*dx+dy*dy>49) continue;
          const offset=((y+dy)*size+x+dx)*4+3;
          border[offset]=Math.max(border[offset],alpha[i]);
        }
      }
      const tile = await sharp(border,{raw:{width:size,height:size,channels:4}})
        .composite([{input:fill}]).png().toBuffer();
      const index=layers.length;
      layers.push({input:tile,left:(index%columns)*size,top:Math.floor(index/columns)*size});
    }
  }
  const rows=Math.ceil(layers.length/columns);
  await sharp({create:{width:columns*size,height:rows*size,channels:4,background:'#00000000'}})
    .composite(layers).png().toFile(output);
  return {size,columns,rows};
}
