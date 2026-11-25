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
    return {desk:r.terrain.desk2d,model:door.model.name,state:door.dock.state};
  });
  assert.deepEqual(initial,{desk:true,model:'desk2d/device-boss',state:'idle'});
  await page.screenshot({path:path.join(dir,'countdown-dock-idle.png')});
  const clock = await page.evaluate(() => {
    const r=app.run, door=r.interactables.list.find(item=>item.kind==='boss');
    const before=door.dock.seconds;
    r.r.shared.uTime.value+=1;drawCountdownDock();
    const held=door.dock.seconds;
    r.stageTime+=1;drawCountdownDock();
    return {held:held===before,changed:door.dock.seconds===before-1};

  });
  assert.deepEqual(clock,{held:true,changed:true},'Screen follows the zone clock, including pauses');
  const faces=await page.evaluate(()=>{
    const r=app.run, f=r.interactables.list.find(x=>x.kind==='boss'),host=r.r;
    const mesh=f.model.children[0],renderer=host.renderer,gl=renderer.getContext(),cam=host.camera.clone();
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,half=mesh.scale.x*.53;
    mesh.updateWorldMatrix(true,false);
    const point=r.player.pos.clone(),center=mesh.getWorldPosition(point.clone());
    mesh.getWorldQuaternion(cam.quaternion);
    cam.position.copy(center);cam.translateZ(24);cam.updateMatrixWorld();
    cam.projectionMatrix.makeOrthographic(-half,half,half*h/w,-half*h/w,.1,100,cam.coordinateSystem);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    const target=renderer.getRenderTarget(),auto=renderer.autoClear,save=r.stageTime;
    const total=save+f.dock.seconds;
    const read=(x,y)=>{
      point.set(x/510-.5,.5-y/510,0).applyMatrix4(mesh.matrixWorld).project(cam);
      const rgb=new Uint8Array(4);
      gl.readPixels(Math.floor((point.x+1)*w/2),Math.floor((point.y+1)*h/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgb);
      return rgb[0]>188&&rgb[1]>188;
    };
    const masks=[63,6,91,79,102,109,125,7,127,111],checks=[];
    try{
      for(const remaining of [total,60,59,7,1,0]){
        r.stageTime=total-remaining;drawCountdownDock();
        renderer.setRenderTarget(null);renderer.autoClear=true;renderer.render(f.model,cam);
        const chars=[];
        for(const cx of [-1.72,-.72,.72,1.72]){
          let mask=0;
          [[0,0],[.34,.25],[.34,.75],[0,1],[-.34,.75],[-.34,.25],[0,.5]].forEach(([x,y],i)=>{
            if(read(171+(cx+x)*40-y*25,204+(cx+x)*28.3+y*71))mask|=1<<i;
          });
          chars.push(masks.indexOf(mask));
        }
        const colon=[.32,.70].every(y=>read(171-25*y,204+71*y));
        const face=chars.slice(0,2).join('')+(colon?':':'?')+chars.slice(2).join('');
        const hud=inspected.doc.querySelector('.zx-hud-clock').textContent;
        if(face!==hud)throw Error('Clock face '+face+' vs HUD '+hud);
        checks.push(face);
      }
    }finally{r.stageTime=save;renderer.setRenderTarget(target);renderer.autoClear=auto;}
    return checks;
  });
  assert.deepEqual(faces.slice(1),['01:00','00:59','00:07','00:01','00:00']);
  const opened = await page.evaluate(() => {
    const r=app.run, door=r.interactables.list.find(item=>item.kind==='boss');
    door.dock.open(); drawCountdownDock();
    r.r.shared.uTime.value += 6; drawCountdownDock();
    return door.dock.state;
  });
  assert.equal(opened,'open');
  await page.screenshot({path:path.join(dir,'countdown-dock-open.png')});
  console.log('Countdown dock passed',initial,faces,clock,opened);
}
