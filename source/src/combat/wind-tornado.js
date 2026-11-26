export const windTornadoSpeed = 1.6;

export function windTornadoRate(species) {
  return [16,17,18,58,59].includes(species) ? windTornadoSpeed : 1;
}

// Share the path with the fusion's feather emitter so both arrive together.
export function windTornadoPosition(x,z,dx,dz,range,age,duration,arenaR,orbit=false) {
  const progress=Math.min(1,Math.max(0,age/duration));
  if(orbit){
    const angle=Math.atan2(dz,dx)+Math.PI*2*progress*(1+.6*(1-progress));
    const radius=1+range*progress;
    x+=Math.cos(angle)*radius;z+=Math.sin(angle)*radius;
  }else{
    const forward=range*(1-(1-progress)**2)*.95+1,sideways=Math.sin(age*5)*1.2;
    x+=dx*forward-dz*sideways;z+=dz*forward+dx*sideways;
  }
  const boundary=arenaR-1.5,distance=Math.hypot(x,z);
  if(distance>boundary){x*=boundary/distance;z*=boundary/distance;}
  return {x,z,progress};
}

// Sweep the travelled segment, including enemy radii, instead of testing only
// the new position. Fast projectiles and low frame rates must still connect.
export function sweptWindTargets(enemies,fromX,fromZ,x,z,radius,out=[]) {
  const dx=x-fromX,dz=z-fromZ,length2=dx*dx+dz*dz;
  enemies.within((fromX+x)/2,(fromZ+z)/2,radius+Math.sqrt(length2)/2,out);
  let count=0;
  for(const id of out){
    const fraction=length2?Math.max(0,Math.min(1,((enemies.x[id]-fromX)*dx+(enemies.z[id]-fromZ)*dz)/length2)):0;
    const reach=radius+enemies.radius[id];
    if((enemies.x[id]-fromX-dx*fraction)**2+(enemies.z[id]-fromZ-dz*fraction)**2<=reach*reach)out[count++]=id;
  }
  out.length=count;return out;
}
