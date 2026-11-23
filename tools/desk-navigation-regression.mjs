import assert from 'node:assert/strict';

export async function verifyDeskNavigation(page){
  const result=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player,was=r.state;r.state='paused';
    const xy=(x,y)=>[(x/5142*2-1)*t.deskBounds.x,(y/2892*2-1)*t.deskBounds.z];
    const routes=[];
    for(const fps of [30,60])for(const reverse of [false,true]){
      const a=xy(reverse?1480:2050,1880),b=xy(reverse?2050:1480,1880);
      let [x,z]=a,vx=0,vz=0,until=0,active=false;const dir={},out={};
      if(t.hitProp(x,0,z,.7)||t.hitProp(...[b[0],0,b[1],.7]))throw Error('Blocked navigation fixture');
      for(let frame=0;frame<fps*25;frame++){
        const d=Math.hypot(b[0]-x,b[1]-z);if(d<.3)break;
        if(frame>=until){active=t.steerDeskEnemy(x,z,...b,.7,dir);until=frame+Math.ceil(fps*.24);}
        const dx=active?dir.x:(b[0]-x)/d,dz=active?dir.z:(b[1]-z)/d;
        vx+=(dx*6-vx)*Math.min(1,10/fps);vz+=(dz*6-vz)*Math.min(1,10/fps);
        t.resolve(x+vx/fps,z+vz/fps,.7,0,out);x=out.x;z=out.z;
        if(t.hitProp(x,0,z,.699))throw Error('Enemy entered a solid prop');
      }
      routes.push({fps,reverse,error:Math.hypot(b[0]-x,b[1]-z)});
    }
    const saved=p.pos.clone(),start=xy(1600,700),end=xy(1600,1270);
    p.pos.set(start[0],0,start[1]);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
    p.grounded=true;
    for(let i=0;i<600;i++){
      const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z,d=Math.hypot(dx,dz);if(d<.25)break;
      r.input.stickX=dx/d;r.input.stickY=-dz/d;r.realDt=1/60;p.update(1/60);r.input.endFrame();
    }
    const cardError=Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z);
    const tissue=xy(800,2200),approach=xy(800,2600);
    p.pos.set(approach[0],0,approach[1]);p.vel.set(0,0,0);
    for(let i=0;i<180;i++){
      r.input.stickX=0;r.input.stickY=1;r.realDt=1/60;p.update(1/60);r.input.endFrame();
      if(t.hitProp(p.pos.x,0,p.pos.z,p.radius-.001))throw Error('Player entered the tissue pack');
    }
    if(p.pos.z>=approach[1]-.1||p.pos.z<tissue[1])throw Error('Expected movement up to the tissue pack');
    if(!t.hitProp(tissue[0],0,tissue[1],1)||r.interactables.fitsOnDesk(...tissue,3))throw Error('Facility can occupy tissue');
    const portal=r.interactables.spawnPortal(...tissue,false,true);
    if(t.hitProp(portal.x,0,portal.z,t.deviceFootprint('portal')))throw Error('Forced portal overlaps tissue');
    r.interactables.remove(portal);
    const enemies=r.enemies;
    for(const flags of [0,1,2,512]){
      const id=enemies.spawn(19,...tissue,1,1,flags);
      if(id<0||!t.placeSpawn(enemies.x[id],enemies.z[id],enemies.radius[id]))throw Error('Invalid monster spawn '+flags);
      enemies.kill(id);
    }
    p.pos.copy(saved);p.vel.set(0,0,0);r.input.releaseAll();r.state=was;
    return {routes,cardError,cardColliders:t.colliders.filter(c=>c.kind==='ID-card').length};
  });
  assert.equal(result.cardColliders,0);
  assert.ok(result.cardError<.3,JSON.stringify(result));
  for(const route of result.routes)assert.ok(route.error<.3,JSON.stringify(result));
  console.log('Desk prop navigation and ID-card crossing passed',result);
}
