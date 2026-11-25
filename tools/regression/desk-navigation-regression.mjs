import assert from 'node:assert/strict';

export async function verifyDeskNavigation(page){
  const result=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player,was=r.state;r.state='paused';
    const {width,height}=window.deskArtSize;
    const xy=(x,y)=>[(x/width*2-1)*t.deskBounds.x,(y/height*2-1)*t.deskBounds.z];
    const routes=[];
    const paths=[[2070,2110,1480,2110],[800,3230,800,2350],[640,1060,1270,1060]];
    for(const [ax,az,bx,bz] of paths)for(const fps of [30,60])for(const reverse of [false,true]){
      const a=reverse?xy(bx,bz):xy(ax,az),b=reverse?xy(ax,az):xy(bx,bz);
      let [x,z]=a,vx=0,vz=0,until=0,active=false;const dir={},out={};
      if(t.hitProp(x,0,z,.7)||t.hitProp(...[b[0],0,b[1],.7]))throw Error('Blocked navigation fixture');
      for(let frame=0;frame<fps*25;frame++){
        t.steerDeskEnemy.advance();
        const d=Math.hypot(b[0]-x,b[1]-z);if(d<.3)break;
        if(frame>=until){active=t.steerDeskEnemy(x,z,...b,.7,dir);until=frame+Math.ceil(fps*.24);}
        const dx=active?dir.x:(b[0]-x)/d,dz=active?dir.z:(b[1]-z)/d;
        vx+=(dx*6-vx)*Math.min(1,10/fps);vz+=(dz*6-vz)*Math.min(1,10/fps);
        t.resolve(x+vx/fps,z+vz/fps,.7,0,out);x=out.x;z=out.z;
        if(t.hitProp(x,0,z,.699))throw Error('Enemy entered a solid prop');
      }
      routes.push({ax,az,fps,reverse,error:Math.hypot(b[0]-x,b[1]-z)});
    }
    const saved=p.pos.clone(),start=xy(1600,700),end=xy(1600,1270);
    p.pos.set(start[0],0,start[1]);p.vel.set(0,0,0);p.kx=p.kz=p.crowdX=p.crowdZ=0;
    p.grounded=true;
    for(let i=0;i<600;i++){
      const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z,d=Math.hypot(dx,dz);if(d<.25)break;
      r.input.stickX=dx/d;r.input.stickY=-dz/d;r.realDt=1/60;p.update(1/60);r.input.endFrame();
    }
    const cardError=Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z);
    const tissue=xy(800,2800);
    const shoes=p.items.get('air-balloon');p.items.delete('air-balloon');
    for(const [kind,start,end,point] of [
      ['zhi',xy(800,3230),xy(800,2350),tissue],
      ['cup',xy(640,1060),xy(1270,1060),xy(1000,1060)]
    ]){
      p.pos.set(start[0],0,start[1]);p.vel.set(0,0,0);
      for(let frame=0;frame<900;frame++){
        const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z,d=Math.hypot(dx,dz);if(d<.25)break;
        r.input.stickX=dx/d;r.input.stickY=-dz/d;r.realDt=1/60;p.update(1/60);r.input.endFrame();
      }
      if(Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z)>.3)throw Error('Player cannot cross '+kind);
      const oldTime=r.time,facing=p.facing.clone();
      p.facing.set(0,1);p.pos.set(end[0],0,end[1]+2.6);
      const ally=r.allies.make(19,start[0],0,start[1]);ally.timer=1e6;
      for(let i=0;i<1500;i++){
        r.time+=1/60;t.steerDeskEnemy.advance();r.allies.updateAlly(ally,2,1/60);
        if(t.hitProp(ally.x,0,ally.z,.449))throw Error('Ally entered '+kind);
        if(Math.hypot(ally.x-end[0],ally.z-end[1])<.41)break;
      }
      r.time=oldTime;p.facing.copy(facing);
      if(Math.hypot(ally.x-end[0],ally.z-end[1])>.41)throw Error('Ally failed to route around '+kind+' '+JSON.stringify([ally.x,ally.z,end]));
      if(t.placeSpawn(...point,.7)||!t.blocksFacility(...point,1)||r.interactables.fitsOnDesk(...point,1))
        throw Error('Actor/facility clearance mismatch '+kind);
    }
    const portal=r.interactables.spawnPortal(...tissue,false,true);
    if(t.blocksFacility(portal.x,portal.z,t.deviceFootprint('portal')))throw Error('Forced portal overlaps tissue');
    r.interactables.remove(portal);
    const enemies=r.enemies;
    for(const flags of [0,1,2,512]){
      const id=enemies.spawn(19,...tissue,1,1,flags);
      if(id<0||!t.placeSpawn(enemies.x[id],enemies.z[id],enemies.radius[id]))throw Error('Invalid monster spawn '+flags);
      enemies.kill(id);
    }
    if(shoes)p.items.set('air-balloon',shoes);
    p.pos.copy(saved);p.vel.set(0,0,0);r.input.releaseAll();r.state=was;
    return {routes,cardError,cardColliders:t.colliders.filter(c=>c.kind==='ID-card').length};
  });
  assert.equal(result.cardColliders,0);
  assert.ok(result.cardError<.3,JSON.stringify(result));
  for(const route of result.routes)assert.ok(route.error<.3,JSON.stringify(result));
  console.log('Desk prop navigation and ID-card crossing passed',result);
}
