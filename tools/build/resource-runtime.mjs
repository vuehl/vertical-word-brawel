export {resourceEntries} from './resource-stream.mjs';
export {restoreSprite,encodeImageData} from './sprite-png.mjs';
export {strFromU8 as decodeText} from 'fflate';

export function decodeBrotli(bytes, rawSize) {
  // Load the JS decoder only when the WeChat native decompressor is unavailable.
  return require('brotli/decompress')(bytes,rawSize);
}
