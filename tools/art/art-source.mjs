import fs from 'node:fs';
import path from 'node:path';

// Accept newly supplied PNGs as well as the verified lossless WebP originals.
export function artImage(file) {
  const webp = file.replace(/\.png$/i, '.webp');
  return fs.existsSync(webp) ? webp : file;
}

export function artImages(directory) {
  return [...new Set(fs.readdirSync(directory).filter(file => /\.(png|webp)$/i.test(file))
    .map(file => file.replace(/\.(png|webp)$/i, '')))].sort()
    .map(stem => path.basename(artImage(path.join(directory, stem + '.png'))));
}
