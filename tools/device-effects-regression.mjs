import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {reviewFacilityGreyRings} from './facility-grey-rings-regression.mjs';
import {reviewCountdownDock} from './countdown-dock-regression.mjs';

async function enter(page){
  await page.evaluate(async()=>{
    await app.meta.load(await app.backend.guest());
    if(!await app.startRun({species:4,biome:'forest',tier:0,mode:'standard',boosts:[]}))throw Error('startRun');
    app.halted=true;
  });
}

export async function reviewDeviceEffects(page,dir){
  await enter(page);
  await reviewCountdownDock(page,dir);
  await reviewFacilityGreyRings(page,dir);
}

export async function verifyDice(page,dir){
  await enter(page);
  for(const stage of [1,2]){
    const report=await page.evaluate(async stage=>{
      const r=app.run;
      if(stage===2){r.state='play';await r.changeZone();}
      const m=r.interactables,p=r.player,host=r.r,cam=host.camera;
      const red=m.list.find(f=>f.kind==='chest'&&!f.data?.gift),blue=m.list.find(f=>f.kind==='freechest');
      function resume(){r.ui.hideModal();r.state='play';}
      // Independently read the bitmap and project the rightmost opaque edge.
      async function placeAtEdge(f,gap){
        await f.modelReady;
        const sprite=f.model.children[0],img=sprite.material.map.image;
        const w=img.width,h=img.height;
        p.pos.copy(f.group.position);r.camTarget.copy(p.pos);r.updateCamera(1);cam.updateMatrixWorld();
        sprite.updateWorldMatrix(true,false);
        const cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;
        const ctx=cvs.getContext('2d');ctx.drawImage(img._surface??img,0,0);
        const bytes=ctx.getImageData(0,0,w,h).data;
        const point=p.pos.clone(),tip=p.pos.clone();tip.x=-Infinity;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          if(bytes[(y*w+x)*4+3]<=203||bytes[(y*w+x+1)*4+3]>203)continue;
          for(const row of [y,y+1]){
            point.set((x+1)/w-.5,.5-row/h,0).applyMatrix4(sprite.matrixWorld).project(cam);
            if(point.x>tip.x)tip.copy(point);
          }
        }
        tip.x+=2*gap/host.canvas.clientWidth;
        const a=tip.clone().setZ(-1).unproject(cam),b=tip.clone().setZ(1).unproject(cam);
        p.pos.lerpVectors(a,b,(f.y-a.y)/(b.y-a.y));
      }
      resume();r.gold=0;
      await placeAtEdge(red,5.15);m.update(0,0);
      if(red.used||m.nearest===red)throw Error('Die activated outside its silhouette');
      await placeAtEdge(red,4.95);m.update(0,0);
      if(red.used||m.nearest!==red||!m.waitingForGold)throw Error('Unfunded red die');
      const price=m.interactionCost(red);r.gold=price+7;m.update(0,0);
      if(!red.used||r.gold!==7||r.state!=='modal'||m.dwellTime!==0)throw Error('Paid die requires a delay');
      m.update(0,0);if(r.gold!==7)throw Error('Double charge');
      resume();r.gold=0;await placeAtEdge(blue,4.95);m.update(0,0);
      if(!blue.used||r.gold!==0||r.state!=='modal')throw Error('Free die at contact');
      resume();m.remove(blue);
      const gift=m.add('chest',blue.x,blue.z,{data:{gift:true}});
      await placeAtEdge(gift,4.95);m.update(0,0);
      if(!gift.used||r.gold!==0||r.state!=='modal')throw Error('Gift die at contact');
      resume();
      const magnet=m.list.find(a=>a.kind==='magnet'),keycap=m.list.find(a=>a.kind==='ditto')??m.add('ditto',blue.x,blue.z);
      await magnet.modelReady;await keycap.modelReady;
      r.time=1.2;
      const model=magnet.model,body=model.children[0],shadow=model.getObjectByName('magnet-shadow');
      model.userData.updateMagnet(.4);const peak=body.position.clone(),ground=shadow.matrix.clone();
      model.userData.updateMagnet(r.time);
      if(peak.distanceTo(body.position)<.1||!shadow.matrix.equals(ground))throw Error('Magnet hover');
      await placeAtEdge(magnet,5.15);m.update(0,0);
      if(magnet.used)throw Error('Premature magnet');
      await placeAtEdge(magnet,4.95);m.update(0,0);
      if(!magnet.used||r.pickups.magnetAll!==5||m.dwellTime!==0)throw Error('Magnet contact');
      r.time+=.4;m.update(0,0);const landed=body.position.clone();
      r.time+=1;m.update(0,0);
      if(landed.y>=peak.y||!body.position.equals(landed)||shadow.matrix.equals(ground))throw Error('Magnet landing');
      let magnetFrame;
      if(stage===1){
        const renderer=host.renderer,gl=renderer.getContext(),target=renderer.getRenderTarget();
        const color=renderer.getClearColor(body.material.color.clone()),alpha=renderer.getClearAlpha(),auto=renderer.autoClear;
        const view=cam.clone(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
        const half=body.scale.x*.83;
        body.updateWorldMatrix(true,false);body.getWorldPosition(view.position);body.getWorldQuaternion(view.quaternion);
        view.translateZ(24);view.updateMatrixWorld();
        view.projectionMatrix.makeOrthographic(-half,half,half*h/w,-half*h/w,.1,100,view.coordinateSystem);
        view.projectionMatrixInverse.copy(view.projectionMatrix).invert();
        try{
          r.sprites.setShelfDepth(null);renderer.setClearColor(0xcfb893,1);renderer.setRenderTarget(null);renderer.autoClear=true;
          renderer.render(model,view);
          for(const [x,y,expected] of [[158,65,97],[112,29,99],[104,116,155]]){
            const loc=p.pos.clone().set((x+.5)/184-.5,.5-(y+.5)/188,0).applyMatrix4(body.matrixWorld).project(view);
            const rgb=new Uint8Array(4);
            gl.readPixels(Math.floor((loc.x+1)*w/2),Math.floor((loc.y+1)*h/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgb);
            if(rgb.slice(0,3).some(channel=>Math.abs(channel-expected)>3))
              throw Error('Spent magnet reference swatch '+expected+' vs '+rgb);
          }
          const crop=document.createElement('canvas');crop.width=crop.height=w;
          const ctx=crop.getContext('2d'),frame=ctx.createImageData(w,w),pixels=new Uint8Array(w*w*4);
          gl.readPixels(0,Math.floor((h-w)/2),w,w,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          for(let row=0;row<w;row++){
            frame.data.set(pixels.subarray(row*w*4,(row+1)*w*4),(w-1-row)*w*4);
          }
          ctx.putImageData(frame,0,0);
          magnetFrame=crop.toDataURL('image/png').split(',')[1];
        }finally{r.sprites.setShelfDepth(r.terrain.shelfDepth);renderer.setRenderTarget(target);renderer.setClearColor(color,alpha);renderer.autoClear=auto;}
      }
      // With no inventory the keycap prompts only once per contact. Re-enter with an item.
      const oldItems=p.items;p.items=new Map();
      const oldToast=r.ui.toast;let notices=0;r.ui.toast=()=>{notices++;};
      try{
        await placeAtEdge(keycap,5.15);m.update(0,0);
        if(m.nearest===keycap)throw Error('Premature keycap');
        await placeAtEdge(keycap,4.95);m.update(0,0);m.update(0,0);
        if(m.nearest!==keycap||notices!==1)throw Error('Keycap repeated empty-inventory prompt');
      }finally{r.ui.toast=oldToast;p.items=oldItems;}
      p.items.set('stick',1);
      await placeAtEdge(keycap,5.15);m.update(0,0);
      await placeAtEdge(keycap,4.95);m.update(0,0);
      if(r.state!=='modal'||m.dwellTime!==0)throw Error('Keycap contact did not open copy panel');
      resume();return {stage,price,paid:true,free:true,gift:true,magnet:true,keycap:true,magnetFrame};
    },stage);
    if(report.magnetFrame){
      await writeFile(path.join(dir,'magnet-landed.png'),Buffer.from(report.magnetFrame,'base64'));
      delete report.magnetFrame;
    }
    assert.equal(report.stage,stage);
    console.log('Dice silhouette, immediate modal and price passed',report);
  }
}
