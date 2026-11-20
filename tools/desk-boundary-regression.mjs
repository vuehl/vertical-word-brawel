import assert from 'node:assert/strict';

export async function reviewDeskBoundary(page){
  const result=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,b=t.workshopBoundary,p=r.player,c=app.r.camera;
    const saved=p.pos.clone(),groups=b.groups,props=t.zxProps.filter(p=>p.kind.startsWith('boundary-'));
    const intersects=(g,from,to)=>{
      const cos=Math.cos(g.angle),sin=Math.sin(g.angle),local=v=>[cos*(v.x-g.x)-sin*(v.z-g.z),v.y,sin*(v.x-g.x)+cos*(v.z-g.z)];
      const a=local(from),z=local(to),low=[-g.width/2,0,-g.depth/2],high=[g.width/2,g.height,g.depth/2];
      let enter=0,leave=1;
      for(let k=0;k<3;k++){
        const d=z[k]-a[k];
        if(Math.abs(d)<1e-8){if(a[k]<low[k]||a[k]>high[k])return false;continue;}
        const x=(low[k]-a[k])/d,y=(high[k]-a[k])/d;enter=Math.max(enter,Math.min(x,y));leave=Math.min(leave,Math.max(x,y));
        if(enter>leave)return false;
      }
      return leave>0&&enter<1;
    };
    let covered=0,perimeterSamples=0;
    for(let side=0;side<4;side++)for(let along=-b.inner;along<=b.inner;along+=.5){
      const a=side*Math.PI/2,x=Math.cos(a)*along-Math.sin(a)*(b.inner+1),z=-Math.sin(a)*along-Math.cos(a)*(b.inner+1);
      perimeterSamples++;if(t.hitProp(x,.2,z,.2))covered++;
    }
    const colliderMatches=props.every(p=>t.colliders.some(c=>c.paperBox&&Math.abs(c.x-p.x)<1e-5&&Math.abs(c.z-p.z)<1e-5&&c.standY==null&&c.h>=p.h));
    const outside=groups.every(g=>{
      const radial=g.side%2?Math.abs(g.x):Math.abs(g.z);
      return radial-g.depth/2>=b.inner-.001&&radial+g.depth/2<=t.world/2+10;
    });
    const views=[],walks=[];
    for(const [name,x,z] of [['north',0,-b.inner+1],['south',0,b.inner-1],['west',-b.inner+1,0],['east',b.inner-1,0],
      ['southwest',-b.inner+1,b.inner-1],['southeast',b.inner-1,b.inner-1]]){
      deskPlace(x,z);deskFrame();
      const target=p.pos.clone();target.y+=.8;
      const info=app.r.renderer.info,auto=info.autoReset;info.autoReset=false;info.reset();app.r.render(0);
      views.push({name,player:p.pos.toArray(),camera:c.position.toArray(),blocked:groups.some(g=>intersects(g,c.position,target)),calls:info.render.calls,triangles:info.render.triangles});
      info.autoReset=auto;
    }
    // Walk outward into each edge using the real player collision/clamp path.
    for(const [dx,dz] of [[0,-1],[0,1],[-1,0],[1,0]]){
      const start=Math.min(b.inner-6,t.arenaR-6);deskPlace(dx*start,dz*start);
      const from=p.pos.x*dx+p.pos.z*dz;r.input.stickX=dx;r.input.stickY=-dz;
      for(let i=0;i<240;i++){r.realDt=1/60;p.update(1/60);r.input.endFrame();}
      r.input.stickX=r.input.stickY=0;
      walks.push({dx,dz,progress:p.pos.x*dx+p.pos.z*dz-from,inside:t.inBounds(p.pos.x,p.pos.z),hit:t.hitProp(p.pos.x,p.pos.y+.05,p.pos.z,p.radius-.04),position:p.pos.toArray()});
    }
    let maxCameraStep=0,previous=null;
    for(let z=b.inner-45;z<b.inner-1;z+=.25){
      p.pos.set(0,0,z);r.camTarget.copy(p.pos);r.updateCamera(1/60);
      if(previous)maxCameraStep=Math.max(maxCameraStep,c.position.distanceTo(previous));previous=c.position.clone();
    }
    deskPlace(saved.x,saved.z);deskFrame();
    return {stage:r.stage,sides:new Set(groups.map(g=>g.side)).size,kinds:[...new Set(groups.map(g=>g.kind))].sort(),groups:groups.length,
      minHeight:Math.min(...groups.map(g=>g.height)),covered,perimeterSamples,colliderMatches,outside,views,walks,maxCameraStep};
  });
  assert.equal(result.sides,4);
  assert.deepEqual(result.kinds,['alarm-clock','bookcase','dinosaur','pencil-case']);
  assert.ok(result.minHeight>20&&result.outside,'Tall props sit at the edge, outside the playable space');
  assert.equal(result.covered,result.perimeterSamples,'No gaps in any of the four physical boundaries');
  assert.ok(result.colliderMatches,'Boundary props cannot be climbed like low stationery');
  assert.ok(result.views.every(v=>!v.blocked),'No boundary prop occludes the player from the gameplay camera');
  assert.ok(result.views.every(v=>v.calls<300&&v.triangles<1000000),'Bounded rendering workload at every edge and corner');
  assert.ok(result.walks.every(w=>w.progress>2&&w.inside&&!w.hit),'The player reaches each edge and stops without clipping or leaving the desk');
  assert.ok(result.maxCameraStep<=.251,'Approaching the southern boundary does not snap the camera');
  return result;
}
