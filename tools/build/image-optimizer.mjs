import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const cache = path.resolve(import.meta.dirname, '../../.cache/lossless-images-v1');

// Encoding effort is paid at build time. Never resize glyphs, quantise their
// alpha or transcode data textures through a lossy colour codec.
export async function optimizeLosslessImage(input, extension = '.png') {
  const original = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
  const key = createHash('sha256').update(original).digest('hex');
  const file = path.join(cache, key + '.webp');
  let webp;
  if (fs.existsSync(file)) webp = fs.readFileSync(file);
  else {
    webp = await sharp(original).webp({lossless:true, quality:100, effort:6}).toBuffer();
    fs.mkdirSync(cache, {recursive:true});
    const pending = file + '.' + process.pid + '.tmp';
    fs.writeFileSync(pending, webp);
    fs.renameSync(pending, file);
  }
  return webp.length < original.length
    ? {bytes:webp, extension:'.webp'} : {bytes:original, extension};
}
