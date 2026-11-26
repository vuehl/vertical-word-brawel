import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {optimizeLosslessImage} from '../build/image-optimizer.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const art = path.join(root, 'resources/art');
const write = process.argv.includes('--write');
const files = fs.readdirSync(art, {recursive:true}).map(file => path.join(art, file));
const report = {write, converted:[], retained:[], savedBytes:0};
for (const file of files.filter(file => file.endsWith('.png'))) {
  // Only exact original files inside the explicitly requested art directory.
  assert.ok(path.resolve(file).startsWith(art + path.sep));
  const original = fs.readFileSync(file);
  const result = await optimizeLosslessImage(original);
  if (result.extension !== '.webp') {report.retained.push(path.relative(root,file));continue;}
  const [before,after] = await Promise.all([original,result.bytes].map(bytes =>
    sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  assert.deepEqual(after.info, before.info, file);
  // WebP may discard RGB under fully transparent pixels. All alpha and every
  // visible channel, including the antialiased stroke edges, must be exact.
  for(let i=0;i<before.data.length;i+=4) {
    assert.equal(after.data[i+3],before.data[i+3],file+' alpha');
    if(!before.data[i+3]){before.data.fill(0,i,i+3);after.data.fill(0,i,i+3);}
  }
  assert.ok(after.data.equals(before.data), 'Visible RGBA must be identical: ' + file);
  const target = file.replace(/\.png$/, '.webp');
  if (write) {
    if (fs.existsSync(target)) assert.ok(fs.readFileSync(target).equals(result.bytes), 'Conflicting original: ' + target);
    else {fs.writeFileSync(target + '.tmp', result.bytes);fs.renameSync(target + '.tmp', target);}
    // Retire PNG only after a verified replacement has been written.
    fs.unlinkSync(file);
    const metadata = file.replace(/\.png$/, '.json');
    if (fs.existsSync(metadata)) {
      const code = fs.readFileSync(metadata,'utf8'), data = JSON.parse(code);
      if (data.image === path.basename(file)) fs.writeFileSync(metadata,
        code.replace(JSON.stringify(data.image), JSON.stringify(path.basename(target))));
    }
  }
  report.savedBytes += original.length-result.bytes.length;
  report.converted.push({file:path.relative(root,file),webp:path.relative(root,target),before:original.length,after:result.bytes.length});
  if (report.converted.length%50===0) console.log('Verified lossless originals:',report.converted.length);
}
const qa = path.join(root,'验收/资源压缩');fs.mkdirSync(qa,{recursive:true});
fs.writeFileSync(path.join(qa,'originals.json'),JSON.stringify(report,null,2)+'\n');
console.log({converted:report.converted.length,retained:report.retained.length,savedBytes:report.savedBytes,write});
