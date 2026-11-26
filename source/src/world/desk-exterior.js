import surround from '../../../resources/public/config/desk-exterior.json' with {type:'json'};
import {y as BufferGeometry,v as Attribute} from '../vendor/three-DmSYIDKK.js';

export const deskExteriorParts=surround.parts;

// Continue the outermost painted row/column past the canvas for unusually
// wide or tall views. The extra quads share texels with the edge of the art.
function axis(start,end,outerStart,outerEnd,pixels){
  const lo=surround.gutter/pixels,hi=1-lo;
  const stops=[[start,lo],[end,hi]];
  const span=outerEnd-outerStart;
  if(start===outerStart)stops.unshift([start-span,lo]);
  if(end===outerEnd)stops.push([end+span,hi]);
  return stops;
}

export function deskExteriorGeometry(part,image,xAt,zAt){
  const [,left,top,right,bottom]=part;
  const [l,t,r,b]=surround.bounds;
  const xs=axis(left,right,l,r,image.width),ys=axis(top,bottom,t,b,image.height);
  const positions=[],uv=[],indices=[];
  for(const [y,v] of ys)for(const [x,u] of xs){
    positions.push(xAt(x),-.05,zAt(y));
    uv.push(u,1-v);
  }
  for(let row=1;row<ys.length;row++)for(let col=1;col<xs.length;col++){
    const br=row*xs.length+col,tl=br-xs.length-1;
    indices.push(tl,br-1,tl+1,tl+1,br-1,br);
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Attribute(new Float32Array(positions),3));
  geometry.setAttribute('uv',new Attribute(new Float32Array(uv),2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  return geometry;
}
