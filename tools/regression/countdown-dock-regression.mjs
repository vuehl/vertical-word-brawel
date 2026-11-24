import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewCountdownDock(page, dir) {
  const initial = await page.evaluate(async () => {
    const r = app.run, f = r.interactables;
    const door = f.list.find(item => item.kind === 'boss');
    await door.modelReady;
    if (!door.dock) throw Error('Summon building has no countdown dock');
    app.halted = true; r.state = 'play'; r.ui.hideModal();
    r.enemies.clear(); r.player.moves.fill(null);
    r.stageTime = 60;
    r.player.pos.set(door.x, door.y, door.z + 9);
    r.camTarget.copy(door.group.position);
    window.drawCountdownDock = () => {
      r.updateCamera(0); r.renderWorld(0); r.ui.hud(r);
      app.r.render(0); inspected.env.invalidateUI(); inspected.env.drawUI(app.r.renderer);
    };
    drawCountdownDock();
    return {desk: !!r.terrain.desk2d, dock: door.model.userData.portalDock.version,
      state: door.dock.state, pose: door.model.userData.portalDockPose,
      idle: !!door.model.getObjectByName('PortalIdle'), open: !!door.model.getObjectByName('PortalOpen')};
  });
  assert.deepEqual(initial, {desk:true,dock:1,state:'idle',pose:'idle',idle:true,open:true});
  await page.screenshot({path:path.join(dir,'countdown-dock-idle.png')});
  const clock = await page.evaluate(() => {
    const r=app.run, door=r.interactables.list.find(item=>item.kind==='boss');
    let screen;
    door.model.traverse(mesh=>{
      if(mesh.userData.portalPart==='screen' && mesh.userData.portalPhase===0)screen=mesh;
    });
    const pixels=()=>Array.from(screen.material.map.image.data);
    const before=pixels();
    r.r.shared.uTime.value+=2; drawCountdownDock();
    const held=pixels();
    r.stageTime+=1; drawCountdownDock();
    const after=pixels();
    return {held:before.every((v,i)=>v===held[i]),changed:before.some((v,i)=>v!==after[i])};
  });
  assert.deepEqual(clock,{held:true,changed:true},'Screen follows the zone clock, including pauses');
  const opened = await page.evaluate(() => {
    const r=app.run, door=r.interactables.list.find(item=>item.kind==='boss');
    door.dock.open(); drawCountdownDock();
    r.r.shared.uTime.value += 6; drawCountdownDock();
    return {state:door.dock.state,pose:door.model.userData.portalDockPose};
  });
  assert.deepEqual(opened,{state:'open',pose:'open'});
  await page.screenshot({path:path.join(dir,'countdown-dock-open.png')});
  console.log('Countdown dock passed',initial,clock,opened);
}
