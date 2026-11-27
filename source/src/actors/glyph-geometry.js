import earcut from '../vendor/earcut.js';
import {y as BufferGeometry,v as BufferAttribute} from '../vendor/three-DmSYIDKK.js';

// All models use the same foot registration as the original 96-pixel HP tiles.
export function glyphSpace([left,top,width,height]){
  const unit=(80/96)/Math.max(width,height);
  return {unit,point:(x,y)=>[(x-left-width/2)*unit,.5-(y-top-height/2)*unit]};
}

export function buildGlyphGeometry(model){
  const space=glyphSpace(model.frame);
  const vertices=[],normals=[],binding=[],indices=[];
  function vertex(x,y,z,nx,ny,nz,stroke,shell){
    const index=vertices.length/3;
    vertices.push(x,y,z);normals.push(nx,ny,nz);binding.push(stroke,shell);
    return index;
  }
  for(const [stroke,polygons] of model.strokes.entries()){
    const zFront=.059+stroke*.00012,zBack=-.068+stroke*.00012;
    for(const polygon of polygons){
      const pts=[],offsets=[],holes=[];
      for(const [r,coords] of polygon.entries()){
        const loop=[];
        for(let i=0;i<coords.length;i+=2)loop.push(space.point(coords[i],coords[i+1]));
        const area=loop.reduce((a,[x,y],i)=>{const next=loop[(i+1)%loop.length];return a+x*next[1]-y*next[0];},0);
        if((area>0)!==(r===0))loop.reverse();
        offsets.push(pts.length);
        if(r)holes.push(pts.length);
        pts.push(...loop);
      }
      offsets.push(pts.length);
      const tris=earcut(pts.flat(),holes);
      // Shared perimeter normals keep the inverted hull continuous at corners
      // and around counters (the enclosed spaces in a character).
      const edgeNormals=[];
      for(let r=0;r<polygon.length;r++){
        const start=offsets[r],end=offsets[r+1];
        for(let i=start;i<end;i++){
          const [x,y]=pts[i],[px,py]=pts[i===start?end-1:i-1],[nx,ny]=pts[i+1===end?start:i+1];
          const a=Math.hypot(x-px,y-py)||1,b=Math.hypot(nx-x,ny-y)||1;
          const ax=(y-py)/a,ay=(px-x)/a,bx=(ny-y)/b,by=(x-nx)/b;
          const miter=Math.max(.65,1+ax*bx+ay*by);
          edgeNormals.push([(ax+bx)/miter,(ay+by)/miter]);
        }
      }
      for(const shell of [0,1]){
        const rings=[];
        const levels=shell?[[.016,zBack-.014],[.016,zFront+.012]]:
          [[-.004,zBack],[0,zBack+.006],[0,zFront-.009],[-.007,zFront]];
        for(let k=0;k<levels.length;k++){
          const [expand,z]=levels[k];
          rings.push(pts.map(([x,y],i)=>{
            const [nx,ny]=edgeNormals[i];
            return vertex(x+nx*expand,y+ny*expand,z,nx,ny,k===levels.length-1?.78:0,stroke,shell);
          }));
        }
        const front=rings.at(-1),back=rings[0];
        const caps=(ring,nz)=>ring.map(i=>vertex(vertices[i*3],vertices[i*3+1],vertices[i*3+2],0,0,nz,stroke,shell));
        const frontCap=caps(front,1),backCap=caps(back,-1);
        function triangle(a,b,c){if(shell)indices.push(c,b,a);else indices.push(a,b,c);}
        for(let i=0;i<tris.length;i+=3){
          const a=tris[i],b=tris[i+1],c=tris[i+2];
          triangle(frontCap[a],frontCap[b],frontCap[c]);triangle(backCap[c],backCap[b],backCap[a]);
        }
        for(let k=1;k<rings.length;k++)for(let r=0;r<polygon.length;r++){
          const start=offsets[r],end=offsets[r+1],lo=rings[k-1],hi=rings[k];
          for(let i=start;i<end;i++){
            const j=i+1===end?start:i+1;
            triangle(lo[i],lo[j],hi[j]);triangle(lo[i],hi[j],hi[i]);
          }
        }
      }
    }
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));
  geometry.setAttribute('normal',new BufferAttribute(new Float32Array(normals),3));
  // Each rigid brushstroke has a single bone influence with weight one.
  geometry.setAttribute('strokeBind',new BufferAttribute(new Float32Array(binding),2));
  geometry.setIndex(indices);
  return geometry;
}
