// Loose floor marbles are simulated with gameplay time, independently of render
// calls. Track marbles remain decorative. All kills use the normal reward path.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function nearestOnSegment(x,z,ax,az,bx,bz){
  const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);
  return {x:ax+dx*t,z:az+dz*t};
}
export function updateLooseMarbles(run,dt){
  const terrain=run.terrain,marbles=terrain?.workshopLooseMarbles,player=run.player;
  if(!marbles||!player||run.state!=='play'||player.dead||!(dt>0))return;
  const p=player.pos,previous=terrain.workshopMarblePlayer||p;
  // Ignore teleports/area transitions, but keep a swept contact test for dashes.
  const continuous=Math.hypot(p.x-previous.x,p.z-previous.z)<12;
  const px=continuous?previous.x:p.x,pz=continuous?previous.z:p.z;
  terrain.workshopMarblePlayer={x:p.x,z:p.z};
  const ground=(x,z)=>Math.max(terrain.surface(x,z),terrain.workshopGroundY?.(x,z)??0);
  const blocked=(x,z,r)=>Math.abs(x)>terrain.play-r||Math.abs(z)>terrain.play-r||
    Math.hypot(x,z)>terrain.arenaR-r||terrain.hitProp(x,ground(x,z)+r,z,r)||terrain.inSolid(x,z);
  for(const marble of marbles){
    const nearest=nearestOnSegment(marble.x,marble.z,px,pz,p.x,p.z);
    let dx=marble.x-nearest.x,dz=marble.z-nearest.z,distance=Math.hypot(dx,dz);
    const contact=marble.r+(player.radius||.55),moving=Math.hypot(p.x-px,p.z-pz);
    if(distance<contact && p.y<ground(marble.x,marble.z)+marble.r*2+.5){
      if(distance<.001){dx=p.x-px||player.vel?.x||1;dz=p.z-pz||player.vel?.z||0;distance=Math.hypot(dx,dz);}
      const nx=dx/distance,nz=dz/distance;
      // An initial touch is enough to kick; sustained running can push again.
      if(!marble.touching||moving>.001){
        const speed=clamp(Math.max(Math.hypot(player.vel?.x||0,player.vel?.z||0),moving/dt)*1.45,14,27);
        marble.vx=nx*speed;marble.vz=nz*speed;marble.armed=true;
      }
      marble.touching=true;
    }else marble.touching=false;
    let speed=Math.hypot(marble.vx,marble.vz);
    if(speed<.15){marble.vx=marble.vz=0;marble.armed=false;continue;}
    const steps=Math.max(1,Math.ceil(dt*speed/(marble.r*.45))),step=dt/steps;
    for(let j=0;j<steps;j++){
      const oldX=marble.x,oldZ=marble.z,nextX=oldX+marble.vx*step,nextZ=oldZ+marble.vz*step;
      if(blocked(nextX,oldZ,marble.r))marble.vx*=-.65;else marble.x=nextX;
      if(blocked(marble.x,nextZ,marble.r))marble.vz*=-.65;else marble.z=nextZ;
      marble.rollX+=(marble.z-oldZ)/marble.r;marble.rollZ-=(marble.x-oldX)/marble.r;
      if(marble.armed&&Math.hypot(marble.vx,marble.vz)>.8){
        const enemies=run.enemies;
        for(let i=0;i<enemies.n;i++){
          if(!enemies.alive[i]||enemies.dying[i]>0||(enemies.flags[i]&(32768|65536)))continue;
          const point=nearestOnSegment(enemies.x[i],enemies.z[i],oldX,oldZ,marble.x,marble.z);
          if(Math.hypot(point.x-enemies.x[i],point.z-enemies.z[i])>marble.r+enemies.radius[i]||
            enemies.y[i]>ground(marble.x,marble.z)+marble.r*2+.5)continue;
          run.combat.killEnemy(i,{type:'normal'});
        }
      }
      const friction=Math.exp(-1.1*step);marble.vx*=friction;marble.vz*=friction;
    }
  }
}
