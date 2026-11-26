const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function paperBox(x,z,width,depth,height,angle,standY){
  return {x,z,h:height,r:Math.hypot(width,depth)/2,halfX:width/2,halfZ:depth/2,cos:Math.cos(angle),sin:Math.sin(angle),paperBox:true,standY};
}

// The original impulse clears low objects. Taller objects need enough rise to
// cross the lip, including the half-step lost to semi-implicit gravity.
export function obstacleJumpSpeed(rise, base, gravity, dt){
  return Math.max(base, Math.sqrt(2*gravity*(rise+.65)) + gravity*dt/2);
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

// Follow the requested displacement up to the silhouette. A rounded corner
// can shorten either component, but cannot add sideways travel to a straight push.
export function moveDeskPlayer(terrain,x,z,endX,endZ,radius,feet,out){
  const steps=Math.max(1,Math.ceil(Math.hypot(endX-x,endZ-z)/radius));
  const dx=(endX-x)/steps,dz=(endZ-z)/steps;
  for(let i=0;i<steps;i++){
    const nextX=x+dx,nextZ=z+dz;
    terrain.resolve(nextX,nextZ,radius,feet,out,true);
    if(out.x!==nextX||out.z!==nextZ){
      // Allow the usual separation if a spawn or teleport already overlapped a prop.
      if(!terrain.hitProp(x,feet,z,radius,true)){
        // A collision may shorten the requested step, never steer it sideways
        // or backwards. Clamping only its length still allows both changes.
        out.x=clamp(out.x,Math.min(x,nextX),Math.max(x,nextX));
        out.z=clamp(out.z,Math.min(z,nextZ),Math.max(z,nextZ));
      }
      if(terrain.hitProp(out.x,feet,out.z,radius,true)){
        if(dx&&!terrain.hitProp(nextX,feet,z,radius,true)){out.x=nextX;out.z=z;}
        else if(dz&&!terrain.hitProp(x,feet,nextZ,radius,true)){out.x=x;out.z=nextZ;}
        else {out.x=x;out.z=z;break;}
      }
    }
    x=out.x;z=out.z;
  }
  return out;
}

// Use steps smaller than the body radius so a dash cannot skip a thin prop.
// A pursuing enemy keeps its chosen direction along the wall until it clears it.
export function moveEnemyPastProps(terrain, x, z, endX, endZ, radius, feet, steerDistance, side, out, jump=false){
  const dx = endX - x, dz = endZ - z;
  const distance = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(distance / radius));
  const stepX = dx / steps, stepZ = dz / steps;
  out.jumpTop = -Infinity;
  for(let i = 0; i < steps; i++){
    const nextX = x + stepX, nextZ = z + stepZ;
    terrain.resolve(nextX, nextZ, radius, feet, out);
    const nx = out.x - nextX, nz = out.z - nextZ;
    if(nx === 0 && nz === 0){
      side = 0;
    } else {
      const normalLength = Math.hypot(nx, nz);
      if(jump && stepX * nx + stepZ * nz < 0){
        const top = terrain.propTop(nextX,nextZ,radius);
        if(top > feet+.0001){
          out.jumpTop = top;
          side = 0;
          break;
        }
      }
      if(steerDistance > 0 && stepX * nx + stepZ * nz < 0){
        const tx = -nz / normalLength, tz = nx / normalLength;
        side ||= stepX * tx + stepZ * tz < 0 ? -1 : 1;
        const along = Math.min(steerDistance, distance) / steps;
        terrain.resolve(x + side * tx * along, z + side * tz * along, radius, feet, out);
      }
      // At a junction one collider can push the body back into another.
      if(terrain.hitProp(out.x, feet, out.z, radius)){
        out.x = x;
        out.z = z;
        break;
      }
    }
    x = out.x;
    z = out.z;
  }
  out.side = side;
  return out;
}
