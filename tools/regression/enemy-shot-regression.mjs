import assert from 'node:assert/strict';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewEnemyShot(page, dir) {
  const flight = await page.evaluate(() => {
    const r = app.run, p = r.player, e = r.enemies, shots = r.projectiles;
    const art = shots.enemyArt;
    shots.clear(); e.clear(); r.vfx.clear();
    p.setSpecies(16);
    const {x,y,z} = p.pos;
    // Pick a firing lane free of devices in this generated room.
    let lane;
    for (let i=0; i<32 && !lane; i++) {
      const angle = -.75*Math.PI + i*Math.PI/16;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      if (Array.from({length:13},(_,j)=>j).every(j=>r.terrain.inBounds(x+dx*j,z+dz*j,1)
          && !r.terrain.hitProp(x+dx*j,y+.8,z+dz*j,.45))) lane = {x:x+dx*12,z:z+dz*12};
    }
    if (!lane) throw Error('No clear test lane');
    const id = e.spawn(19,lane.x,lane.z,1,1,0);
    e.x[id] = lane.x; e.z[id] = lane.z; e.y[id] = r.terrain.surface(lane.x,lane.z);
    e.update(0); r.updateCamera(0);
    shots.enemyShot(id,x,y+.8,z);
    for(let i=0;i<15;i++) shots.update(1/30);
    r.hideOwnFx=true;
    app.r.renderer.resetState();r.renderWorld(0);app.r.render(0);
    r.ui.hud(r);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return {loaded:art.loaded,count:art.mesh.count,legacy:shots.pool.n+shots.glow.n,frame:art.pose.getX(0)};
  });
  assert.deepEqual(flight,{loaded:true,count:1,legacy:0,frame:12});
  await page.screenshot({path:path.join(dir,'怪物子弹-飞行.png')});
  const result = await page.evaluate(() => {
    const r=app.run, p=r.player, shots=r.projectiles, art=shots.enemyArt;
    const {x,y,z}=p.pos;
    for(let i=0; i<50 && shots.used; i++) shots.update(1/30);
    shots.render();
    const impact={remaining:shots.used,hits:art.hits.length,frame:art.pose.getX(0)};
    for(let i=0;i<10;i++) shots.update(1/30);
    const expired=art.hits.length===0;
    const base={x,y:y+1,z,dx:1,dz:0,speed:11,life:3,radius:.5,size:1,dmg:1,type:'normal'};
    const ids=[1|2048,1|1024|2,1].map((flags,i)=>shots.fire({...base,flags,shape:[4,6,34][i]}));
    shots.fire({...base,flags:0});
    shots.vx[ids[1]]=-4;shots.vy[ids[1]]=3;shots.vz[ids[1]]=2;
    // Pool slots are recycled. Check the actual submission order.
    const index=ids.filter(id=>id<ids[1]).length;
    shots.render();
    const count=art.mesh.count, direction=[art.heading.getX(index),art.heading.getY(index),art.heading.getZ(index)];
    r.hideOwnFx=false;shots.render();
    const friendly=shots.glow.n>0 && art.mesh.count===3;
    shots.clear();shots.render();
    return {impact,expired,count,direction,friendly,empty:art.mesh.count===0};
  });
  assert.deepEqual(result,{impact:{remaining:0,hits:1,frame:24},expired:true,count:3,
    direction:[-4,3,2],friendly:true,empty:true});
  if (process.argv.includes('--record')) await recordFlight(page,dir);
  console.log('Enemy shot flight, impact, alpha, boss, heading, friendly effects and cleanup passed.');
}

async function recordFlight(page,dir) {
  const clip=await page.evaluate(()=>{
    const r=app.run, p=r.player, e=r.enemies, id=e.firstAlive;
    r.godMode=false;p.iframes=0;p.flash=0;p.hurtT=0;p.squash=0;p.hp=p.maxHp;p.moves.fill(null);
    r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};
    e.update=()=>{};r.vfx.clear();
    const screen=(x,y,z)=>{
      const v=p.pos.clone().set(x,y,z).project(app.r.camera);
      return {x:(1+v.x)*innerWidth/2,y:(1-v.y)*innerHeight/2};
    };
    const from=screen(e.x[id],e.y[id]+e.hgt[id]*.6,e.z[id]);
    const to=screen(p.pos.x,p.pos.y+.8,p.pos.z);
    const left=Math.max(0,Math.floor(Math.min(from.x,to.x)-35));
    const top=Math.max(0,Math.floor(Math.min(from.y,to.y)-40));
    r.projectiles.enemyShot(id,p.pos.x,p.pos.y+.8,p.pos.z);
    return {x:left,y:top,width:Math.min(innerWidth-left,Math.ceil(Math.max(from.x,to.x)+35)-left),
      height:Math.min(innerHeight-top,Math.ceil(Math.max(from.y,to.y)+55)-top)};
  });
  const frames=[];
  const width=clip.width*2,height=clip.height*2;
  for(let tick=0;tick<43;tick++){
    await page.evaluate(()=>{
      const r=app.run, dt=1/30;
      r.realTime+=dt;r.simulate(dt);r.updateCamera(dt);r.renderWorld(dt);r.vfx.update(dt);
      app.r.renderer.resetState();app.r.render(0);r.ui.hud(r);inspected.env.drawUI(app.r.renderer);
    });
    const shot=await page.screenshot({clip});
    frames.push(await sharp(shot).resize(width,height).removeAlpha().raw().toBuffer());
  }
  await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,pageHeight:height,channels:3}})
    .gif({loop:0,delay:frames.map((_,i)=>i===frames.length-1?400:i%3===2?40:30)})
    .toFile(path.join(dir,'怪物子弹-实机模拟.gif'));
}
