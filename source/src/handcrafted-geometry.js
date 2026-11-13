import {y as BufferGeometry,v as BufferAttribute,ht as Vector3} from '../assets/three-DmSYIDKK.js';
const TAU=Math.PI*2;
function geometry(p,n,uv,indices){
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));
  if(n?.length)g.setAttribute('normal',new BufferAttribute(new Float32Array(n),3));
  if(uv?.length)g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));
  g.setIndex(indices);if(!n?.length)g.computeVertexNormals();return g;
}
// All six faces share the same analytic rounded surface, including top edges.
// A single geometry is instanced at many scales; there are no overlapping boxes.
export function beveledBoxGeometry(radius=.07,artworkFace){
  const p=[],n=[],uv=[],indices=[],inner=.5-radius;
  // Concentrate vertices in the bevel itself. A uniform grid puts almost all
  // of its vertices on the flat face and leaves a single angular edge strip.
  const c=[-.5,-inner-radius*.8660254,-inner-radius*.5,-inner,0,inner,inner+radius*.5,inner+radius*.8660254,.5],segments=c.length-1;
  const faces=[[[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
  for(const [normal,u,v] of faces){
    const start=p.length/3;
    for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
      const a=c[i],b=c[j],xyz=normal.map((x,k)=>x*.5+u[k]*a+v[k]*b);
      const center=xyz.map(x=>Math.max(-inner,Math.min(inner,x))),d=xyz.map((x,k)=>x-center[k]),len=Math.hypot(...d)||1;
      p.push(...center.map((x,k)=>x+d[k]/len*radius));n.push(...d.map(x=>x/len));
      // Undecorated faces sample the blank margin of the same printed sheet.
      if(artworkFace&&(artworkFace==='top'?normal[1]:normal[2])!==1)uv.push(.01,.01);
      else uv.push(a+.5,b+.5);
      if(i<segments&&j<segments){const k=start+j*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
    }
  }
  return geometry(p,n,uv,indices);
}
export function latheGeometry(profile,segments=40){
  const p=[],n=[],uv=[],indices=[];
  for(let j=0;j<profile.length;j++){
    const [radius,y]=profile[j],prev=profile[Math.max(0,j-1)],next=profile[Math.min(profile.length-1,j+1)];
    const dy=next[1]-prev[1],dr=next[0]-prev[0],len=Math.hypot(dy,dr)||1;
    for(let i=0;i<=segments;i++){
      const a=i/segments*TAU;p.push(Math.cos(a)*radius,y,Math.sin(a)*radius);n.push(Math.cos(a)*dy/len,-dr/len,Math.sin(a)*dy/len);uv.push(i/segments,j/(profile.length-1));
      if(j<profile.length-1&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
    }
  }
  return geometry(p,n,uv,indices);
}
export function tubeGeometry(points,radius=.1,sides=10){
  const p=[],n=[],uv=[],indices=[];
  for(let i=0;i<points.length;i++){
    const a=new Vector3(...points[i]),t=new Vector3(...points[Math.min(i+1,points.length-1)]).sub(new Vector3(...points[Math.max(0,i-1)])).normalize();
    const right=new Vector3().crossVectors(t,Math.abs(t.y)>.95?new Vector3(1,0,0):new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(right,t).normalize();
    for(let j=0;j<=sides;j++){
      const b=j/sides*TAU,normal=right.clone().multiplyScalar(Math.cos(b)).addScaledVector(up,Math.sin(b));
      p.push(a.x+normal.x*radius,a.y+normal.y*radius,a.z+normal.z*radius);n.push(normal.x,normal.y,normal.z);uv.push(j/sides,i/(points.length-1));
      if(i<points.length-1&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  return geometry(p,n,uv,indices);
}
export function helixTrackGeometry(radius=4.6,top=23,bottom=2.5,turns=2.6,segments=160,width=1.7){
  const p=[],uv=[],indices=[];
  // Closed rectangular cross-section gives the wooden ramp real thickness.
  for(let i=0;i<=segments;i++){
    const t=i/segments,a=t*TAU*turns,y=top+(bottom-top)*t;
    for(const [offset,dy] of [[-width/2,.12],[width/2,.12],[width/2,-.18],[-width/2,-.18]]){
      p.push(Math.cos(a)*(radius+offset),y+dy,Math.sin(a)*(radius+offset));uv.push(offset/width+.5,t*12);
    }
    if(i<segments)for(let j=0;j<4;j++){const k=i*4+j,next=i*4+(j+1)%4;indices.push(k,k+4,next,next,k+4,next+4);}
  }
  return geometry(p,null,uv,indices);
}
export function curtainGeometry(){
  const p=[],uv=[],indices=[],nx=48,ny=16;
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
    const u=x/nx,v=y/ny;p.push(u-.5,v-.5,Math.cos(u*TAU*5)*.1+(1-v)*.025*Math.sin(u*TAU));uv.push(u,v);
    if(x<nx&&y<ny){const k=y*(nx+1)+x;indices.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}
  }
  return geometry(p,null,uv,indices);
}
