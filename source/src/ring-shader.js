// p is the same pixel-quantized coordinate used by the original shader.
// Bounds include the ripple at .72R, flame tips and the three-thickness wake.
// Reject fully transparent pixels before atan/sin/style evaluation.
export const ringEmptyPixels = `
          float innerBound = max(0.0, R * 0.72 - T * 4.0);
          float outerBound = R * 1.09 + T * 4.0;
          float radiusSquared = dot(p, p);
          if (radiusSquared < innerBound * innerBound || radiusSquared > outerBound * outerBound) discard;
`;
