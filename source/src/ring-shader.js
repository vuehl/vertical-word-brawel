// p is the same pixel-quantized coordinate used by the original shader.
// Bounds include the ripple at .72R, flame tips and the three-thickness wake.
// Reject fully transparent pixels before atan/sin/style evaluation.
export const ringEmptyPixels = `
          float innerBound = max(0.0, R * 0.72 - T * 4.0);
          float outerBound = R * 1.09 + T * 4.0;
          float radiusSquared = dot(p, p);
          if (radiusSquared < innerBound * innerBound || radiusSquared > outerBound * outerBound) discard;
`;

// A conservative annular strip avoids rasterizing the empty centre at all.
// The .2 margin covers the fragment shader's .26-wide pixel quantization.
// Outer vertices circumscribe the circle; inner vertices inscribe the hole.
export function ringStripGeometry(PlaneGeometry){
  const geometry=new PlaneGeometry(1,1,32,1),position=geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const angle=(position.getX(i)+.5)*Math.PI*2;
    position.setXYZ(i,Math.cos(angle),0,Math.sin(angle));
  }
  return geometry;
}
export const ringStripPosition = `
          float innerRadius = max(0.0, iA.w * 0.72 - iC.x * 4.0 - 0.2);
          float outerRadius = (iA.w * 1.09 + iC.x * 4.0 + 0.2) * 1.004839;
          vP = position.xz * mix(innerRadius, outerRadius, uv.y);
`;
// Retain the original square bounds, including flame tips near its edges.
export const ringSquareClip = `
          float extent = R + T * 4.0;
          if (abs(vP.x) > extent || abs(vP.y) > extent) discard;
`;
