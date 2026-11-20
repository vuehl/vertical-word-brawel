export function pickupRadius(value){return Math.max(6,Number.isFinite(value)?value:6);}
export function inPickupRange(dx,dy,dz,radius){return dx*dx+dz*dz<=radius*radius&&Math.abs(dy)<=Math.max(4,radius);}
export function pickupSpeed(attractTime,moveSpeed){return 13+13*(1-Math.exp(-Math.max(0,attractTime)*4))+Math.max(0,Math.min(35,Number(moveSpeed)||0));}
export function pickupArrived(distance,speed,dt){return distance<=Math.max(.85,speed*Math.max(0,dt));}
