import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyBillGaze(page,dir,stage){
  const report=await page.evaluate(async()=>{
    const r=app.run,t=r.terrain,f=r.interactables,host=r.r,camera=host.camera,renderer=host.renderer;
    const site=t.facilitySites?.find(s=>s.surface==='wacom')??t.spawn;
    const bill=f.add('bill',site.x,site.z);await bill.modelReady;
    const sprite=bill.model.children[0],player=r.player.pos,previous=player.clone(),state=r.state;
    const previousNearest=f.nearest,previousTime=f.dwellTime,auto=renderer.autoClear,target=renderer.getRenderTarget();
    const gl=renderer.getContext(),W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
    function pose(x,z){
      player.set(site.x+x,bill.y,site.z+z);f.render(1);
      renderer.render(bill.model,camera);
      const uniforms=renderer.properties.get(sprite.material).uniforms;
      return {active:uniforms.billActive.value,center:uniforms.pupilCenter.value.slice()};
    }
    function pixels(){
      const data=new Uint8Array(W*H*4);
      gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;
    }
    function snapshot(){
      renderer.render(bill.model,camera);
      return gl.canvas.toDataURL('image/png').split(',')[1];
    }
    try{
      player.set(site.x,bill.y,site.z);r.camTarget.copy(player);r.updateCamera(1);
      camera.updateMatrixWorld();host.scene.updateMatrixWorld(true);
      renderer.setRenderTarget(null);renderer.autoClear=true;
      const idle=pose(200,0),idleFrame=snapshot();
      const left=pose(-4,0),a=pixels(),right=pose(4,0),b=pixels();
      const activeFrame=snapshot(),up=pose(0,-6),down=pose(0,6);
      const origin=bill.group.position.clone(),rightAxis=player.clone().setFromMatrixColumn(camera.matrixWorld,0);
      const bounds=sprite.geometry.boundingBox;
      const corner=p=>p.clone().applyMatrix4(sprite.matrixWorld).project(camera).x;
      const edgeLeft=corner(bounds.min),edgeRight=corner(bounds.max);
      const center=origin.clone().project(camera).x;
      const unit=origin.clone().add(rightAxis).project(camera).x-center;
      // Only the left quarter of the artwork remains on screen.
      bill.group.position.addScaledVector(rightAxis,(1-edgeLeft-(edgeRight-edgeLeft)*.25)/unit);
      const partial=pose(0,0);
      bill.group.position.addScaledVector(rightAxis,(edgeRight-edgeLeft)/unit);
      const outside=pose(0,0);bill.group.position.copy(origin);
      const reenter=pose(0,0);
      r.state='play';f.nearest=bill;f.dwellTime=f.dwellDuration/2;f.render(.016);
      const ringHidden=!bill.halo&&!bill.chargeRing&&!f.dwellRing.visible;
      bill.used=true;f.dim(bill);
      const used=pose(0,0);
      // Only the iris may change between these two frames. Project the
      // painted socket bounds to framebuffer pixels, including one AA pixel.
      const at=(x,y)=>player.clone().set(x/855-.5,.5-y/966,0).applyMatrix4(sprite.matrixWorld).project(camera);
      const tl=at(224,372),br=at(356,519);
      const minX=(tl.x+1)*W/2-1,maxX=(br.x+1)*W/2+1,minY=(br.y+1)*H/2-1,maxY=(tl.y+1)*H/2+1;
      let moved=0,leaked=0;
      for(let i=0;i<a.length;i+=4){
        if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))<9)continue;
        moved++;
        const x=i/4%W,y=Math.floor(i/4/W);
        if(x<minX||x>maxX||y<minY||y>maxY)leaked++;
      }
      return {idle,left,right,up,down,partial,outside,reenter,used,ringHidden,moved,leaked,error:gl.getError(),idleFrame,activeFrame};
    }finally{
      r.state=state;f.nearest=previousNearest;f.dwellTime=previousTime;
      player.copy(previous);renderer.autoClear=auto;renderer.setRenderTarget(target);f.remove(bill);
    }
  });
  const {idleFrame,activeFrame,...result}=report;
  console.log('Stapler '+stage,result);
  assert.ok(!result.idle.active&&result.partial.active&&!result.outside.active&&result.reenter.active);
  assert.equal(result.used.active,false);
  assert.ok([result.left,result.right,result.up,result.down].every(v=>v.active));
  assert.ok(result.left.center[0]+15<result.right.center[0]&&result.up.center[1]+15<result.down.center[1]);
  assert.ok(result.ringHidden&&result.moved>8&&result.leaked===0&&result.error===0);
  for(const [name,frame] of Object.entries({idle:idleFrame,active:activeFrame})){
    await fs.writeFile(path.join(dir,'stapler-'+stage+'-'+name+'.png'),Buffer.from(frame,'base64'));
  }
}
