// The 232px reference faces right. Its image Y runs across the wave and
// image X runs in the travel direction. The origin is the leading rim.
export const waveHalfWidth = .72;
export const waveDepth = .62;
export const waveNose = 224 / 232;

const rim = [
  [9, 42], [13, 84], [24, 129], [46, 175], [70, 202], [94, 217],
  [118, 224], [140, 223], [162, 214], [183, 198], [201, 176],
  [215, 150], [222, 123],
].map(([row, col]) => ({
  side: (1 - 2 * row / 232) * waveHalfWidth,
  forward: (col / 232 - waveNose) * waveDepth,
}));

function nearSegment(x, y, a, b, radius) {
  const dx = b.side - a.side, dy = b.forward - a.forward;
  const t = Math.max(0, Math.min(1,
    ((x - a.side) * dx + (y - a.forward) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - a.side - t * dx, y - a.forward - t * dy) <= radius;
}

// In the moving wave's coordinates the enemy sweeps a straight segment.
// Test its whole path, including contact at a wingtip or between frames.
export function waveCrosses(side, from, to, radius) {
  for (let i = 1; i < rim.length; i++) {
    const a = rim[i - 1], b = rim[i];
    if (side > a.side + radius || side < b.side - radius) continue;
    if (side <= a.side && side >= b.side) {
      const edge = a.forward + (b.forward - a.forward) * (side - a.side) / (b.side - a.side);
      if (from <= edge && edge <= to) return true;
    }
    if (nearSegment(side, from, a, b, radius) || nearSegment(side, to, a, b, radius)) return true;
    if ((from <= a.forward && a.forward <= to && Math.abs(side - a.side) <= radius) ||
        (from <= b.forward && b.forward <= to && Math.abs(side - b.side) <= radius)) return true;
  }
  return false;
}
