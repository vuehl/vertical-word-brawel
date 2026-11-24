import sharp from 'sharp';

// Select the smaller lossless WebP only when the decoded channels also match
// the existing encoding, including RGB under fully transparent atlas pixels.
export async function encodeLosslessAtlas(pixels,raw) {
  const image=sharp(pixels,{raw});
  const standard=await image.clone().webp({lossless:true,effort:6}).toBuffer();
  const compact=await image.webp({lossless:true,effort:6,quality:100}).toBuffer();
  if(compact.length>=standard.length)return standard;
  const decoded=await Promise.all([standard,compact].map(bytes=>sharp(bytes).ensureAlpha().raw().toBuffer()));
  return decoded[0].equals(decoded[1])?compact:standard;
}
