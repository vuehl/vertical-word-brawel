const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function paperBox(x,z,width,depth,height,angle){
  return {x,z,h:height,r:Math.hypot(width,depth)/2,halfX:width/2,halfZ:depth/2,cos:Math.cos(angle),sin:Math.sin(angle),paperBox:true};
}
export function hitsPaperBox(box,x,z,radius){
  const dx=x-box.x,dz=z-box.z,lx=box.cos*dx-box.sin*dz,lz=box.sin*dx+box.cos*dz;
  const ax=lx-clamp(lx,-box.halfX,box.halfX),az=lz-clamp(lz,-box.halfZ,box.halfZ);
  return ax*ax+az*az<radius*radius || Math.abs(lx)<box.halfX&&Math.abs(lz)<box.halfZ;
}
export function resolvePaperBox(box,point,radius){
  const dx=point.x-box.x,dz=point.z-box.z;
  let x=box.cos*dx-box.sin*dz,z=box.sin*dx+box.cos*dz;
  const cx=clamp(x,-box.halfX,box.halfX),cz=clamp(z,-box.halfZ,box.halfZ),ax=x-cx,az=z-cz,d2=ax*ax+az*az;
  if(d2>=radius*radius)return point;
  if(d2>1e-12){const scale=(radius+.0001)/Math.sqrt(d2);x=cx+ax*scale;z=cz+az*scale;}
  else if(box.halfX-Math.abs(x)<box.halfZ-Math.abs(z))x=(x<0?-1:1)*(box.halfX+radius+.0001);
  else z=(z<0?-1:1)*(box.halfZ+radius+.0001);
  point.x=box.x+box.cos*x+box.sin*z;point.z=box.z-box.sin*x+box.cos*z;
  return point;
}
