import {y as BufferGeometry,v as BufferAttribute} from '../vendor/three-DmSYIDKK.js';

// Curved fire surfaces use a UV grid. The optional flat quad carries the
// ground half of mixed explosion sprites in the same instanced draw.
export function fireSurfaceGeometry(segments, withFloor=false, backSegments=0) {
  const positions=[],uvs=[],indices=[];
  function grid(n,z) {
    const base=positions.length/3;
    for(let row=0;row<=n;row++)for(let col=0;col<=n;col++){
      const u=col/n,v=row/n;
      positions.push(u,v,z);uvs.push(u,v);
    }
    for(let row=n-1;row>=0;row--)for(let col=0;col<n;col++){
      const i=base+row*(n+1)+col;
      indices.push(i,i+1,i+n+2,i,i+n+2,i+n+1);
    }
  }
  // Draw the rear wall before the near wall for transparent vortex textures.
  if(backSegments)grid(backSegments,2);
  if(withFloor)grid(1,1);
  grid(segments,0);
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2));
  geometry.setIndex(indices);
  return geometry;
}

// Atlas measurements are in square tile UVs. Remove the painted tilt before
// rotating in the world's horizontal plane; the scene camera then projects it.
export const fireFootprints = {
  ring:      {depthRatio:.52, shear:0,   pivotY:.44},
  sweepRing: {depthRatio:.72, shear:.17, pivotY:.51},
  seal:      {depthRatio:1,   shear:0,   pivotY:.50},
  crack:     {depthRatio:.63, shear:.07, pivotY:.51},
};

export const fireFootprintGLSL = `
vec3 fireFootprint(vec2 local, float angle, float depthRatio, float shear) {
  vec2 disk = vec2(local.x, (local.y - shear * local.x) / depthRatio);
  float c = cos(angle), s = sin(angle);
  disk = vec2(c * disk.x - s * disk.y, s * disk.x + c * disk.y);
  vec2 right = normalize(vec2(viewMatrix[0][0], viewMatrix[2][0]));
  vec2 ground = right * disk.x + vec2(right.y, -right.x) * disk.y;
  return vec3(ground.x, 0., ground.y);
}`;
