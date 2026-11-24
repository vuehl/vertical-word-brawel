// Brotli compresses the high bytes of neighboring coordinates and indices
// better in separate planes. The source mesh remains directly readable.
const header = [68, 83, 77, 49]; // DSM1

export function packMeshBytes(bytes) {
  if (bytes.length % 4) throw Error('Expected a four-byte-aligned dragon mesh');
  const result = new Uint8Array(header.length + bytes.length);
  result.set(header);
  const words = bytes.length / 4;
  for (let lane = 0; lane < 4; lane++) {
    const offset = header.length + lane * words;
    for (let i = 0; i < words; i++) result[offset + i] = bytes[4 * i + lane];
  }
  return result;
}

export function unpackMeshBytes(bytes) {
  if (!header.every((v,i) => bytes[i] === v)) return bytes;
  const result = new Uint8Array(bytes.length - header.length);
  const words = result.length / 4;
  for (let lane = 0; lane < 4; lane++) {
    const offset = header.length + lane * words;
    for (let i = 0; i < words; i++) result[4 * i + lane] = bytes[offset + i];
  }
  return result;
}
