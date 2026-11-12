// Conservative bounds include the inner pigment film, flame tips and the echo.
// Reject fully transparent pixels before atan/sin/style evaluation.
export const ringEmptyPixels = `
          float innerBound = max(0.0, radius * 0.72 - width * 4.0);
          float outerBound = radius * 1.09 + width * 4.0;
          float radiusSquared = dot(vP, vP);
          if (radiusSquared < innerBound * innerBound || radiusSquared > outerBound * outerBound) discard;
`;

// A conservative annular strip avoids rasterizing the empty centre at all.
// Leave a margin for the softened edge.
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
          // A very thin pigment crest is sensitive to subpixel interpolation.
          // Use the original two triangles for it; collapse the remaining strip.
          if (iA.w > 200.0 * iC.x && (iC.y == 2.0 || iC.y == 3.0 || iC.y == 6.0)) {
            vP = vec2(uv.x == 0.0 ? -0.5 : 0.5, 0.5 - uv.y) * ((iA.w + iC.x * 4.0) * 2.0);
          }
`;
// Retain the original square bounds, including flame tips near its edges.
export const ringSquareClip = `
          float extent = radius + width * 4.0;
          if (abs(vP.x) > extent || abs(vP.y) > extent) discard;
`;
