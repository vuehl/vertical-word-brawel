import assert from 'node:assert/strict';
import path from 'node:path';
export async function reviewGourdOffscreen(page,dir){
  const result=await page.evaluate(async()=>{
    const r=app.run,t=r.terrain,f=r.interactables;
    r.enemies.clear();r.state='play';r.updateCamera(1);r.renderWorld(0);
    // Every path must reject a visible candidate, including designated sites.
    const originalVisible=r.sprites.visible,originalAvailable=f.availableMapSite;
    const chests=f.list.filter(c=>['chest','freechest'].includes(c.kind));
    // Isolate the respawn paths from unrelated facilities occupying candidate sites.
    for(const other of [...f.list])if(!chests.includes(other))f.remove(other);
    const report=[];
    for(const chest of chests){
      const before=[chest.x,chest.z];chest.used=true;chest.group.visible=false;chest.respawnAt=r.time;
      r.sprites.visible=()=>true;
      f.respawnChest(chest);
      if(chest.x!==before[0]||chest.z!==before[1]||!chest.used)throw Error('Visible refill');
      r.sprites.visible=originalVisible;
      for(let i=0;i<500&&chest.used&&f.list.includes(chest);i++)f.respawnChest(chest);
      const live=f.list.includes(chest)?chest:f.list.find(c=>c.kind===chest.kind&&!c.used);
      if(!live||live.used)throw Error('No offscreen refill '+JSON.stringify({sites:f.chestSites.length,counts:[s=>Math.hypot(s.x-chest.x,s.z-chest.z)>=32,s=>Math.hypot(s.x-r.player.pos.x,s.z-r.player.pos.z)>=32,s=>!t.isReserved(s.x,s.z,3),s=>f.fitsOnDesk(s.x,s.z,4.5),s=>f.hasBuildingSpace(s.x,s.z,2.6)].map(test=>f.chestSites.filter(test).length),visible:f.chestSites.filter(s=>r.sprites.visible(s.x,2,s.z,8)).length}));
      if(r.sprites.visible(live.x,t.height(live.x,live.z)+2,live.z,8))throw Error('Refill in view');
      report.push({kind:live.kind,distance:Math.hypot(live.x-before[0],live.z-before[1])});
    }
    f.availableMapSite=originalAvailable;
    const eventChest=f.spawnChest(r.player.pos.x,r.player.pos.z,false);
    if(eventChest&&r.sprites.visible(eventChest.x,t.height(eventChest.x,eventChest.z)+2,eventChest.z,8))throw Error('Event chest spawned in view');
    const {width,height}=window.deskArtSize;
    const bounds=t.deskBounds,pixel=(x,y)=>({x:(x/width*2-1)*bounds.x,z:(y/height*2-1)*bounds.z});
    const start=pixel(3850,2460),end=pixel(4280,2460),out={...start};
    for(let i=0;i<120;i++)t.resolve(out.x+(end.x-start.x)/120,out.z,r.player.radius,0,out);
    const passageError=Math.hypot(out.x-end.x,out.z-end.z);
    if(passageError>.01)throw Error('Mouse passage blocked '+passageError);
    r.player.pos.copy(t.spawn);r.camTarget.copy(t.spawn);
    const id=r.enemies.spawn(4,t.spawn.x+3,t.spawn.z,1,1,0);
    const ball=r.capture.ball;let caught=false,escaped=false;
    ball.start(id,true,()=>{caught=true;},()=>{});
    ball.update(.3);const anchor=ball.ball.position.clone();ball.update(.15);
    if(anchor.distanceTo(ball.ball.position)>.01)throw Error('Gourd is being thrown');
    ball.update(.4);const absorbing=r.enemies.scale[id];
    for(let i=0;i<400&&ball.active;i++)ball.update(1/60);
    if(!caught||r.state!=='play')throw Error('Capture did not finish');
    r.stepAnims(1);
    ball.start(id,false,()=>{},()=>{escaped=true;});
    for(let i=0;i<400&&ball.active;i++)ball.update(1/60);
    if(!escaped||r.enemies.scale[id]!==ball.scale0)throw Error('Escape did not restore glyph');
    ball.start(id,true,()=>{},()=>{});ball.update(.85);
    r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    return {report,passageError,caught,escaped,absorbing,model:ball.ball.name,caption:r.ui.capEl.textContent};
  });
  assert.equal(result.model,'capture-gourd');assert.match(result.caption,/葫芦/);
  await page.screenshot({path:path.join(dir,'gourd-capture.png')});
  console.log('Gourd / offscreen / passage:',JSON.stringify(result));
}
