import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import {verifyPickupTimers} from './pickup-timers.mjs';

export async function verifyBerryPickup(page,dir){
  const result=await page.evaluate(async preview=>{
    app.halted=true;
    const r=app.run,f=r.interactables,p=r.player,host=r.r,cam=host.camera;
    const oldPos=p.pos.clone(),oldHp=p.hp,oldTime=r.time;
    const berries=f.list.filter(item=>item.kind==='berry');
    const berry=berries[0],site={x:berry.x,z:berry.z};
    await berry.modelReady;r.state='play';
    const model=berry.model;model.updateWorldMatrix(true,true);
    const wrapper=await f.deviceArt.deskTextures.get('device-berry/device-berry_basic.png');
    if(!wrapper||model.getObjectByName('berry')?.material.map!==wrapper)throw Error('Wrong QQ candy artwork');
    p.pos.copy(berry.group.position);r.camTarget.copy(p.pos);r.updateCamera(0);cam.updateMatrixWorld();
    const w=host.canvas.clientWidth,h=host.canvas.clientHeight;
    const focus=berry.group.position.clone().project(cam);
    // A character can collect the candy while walking past its ground position.
    const radius=3.4;
    const frames=[],canvas=preview?document.createElement('canvas'):null;
    function picture(){
      if(!canvas)return;
      r.renderWorld(0);host.render(0);
      canvas.width=192;canvas.height=160;
      const screen=GameGlobal.pokebonk.canvas,ctx=canvas.getContext('2d');
      const x=(focus.x+1)*w/2-80,y=(1-focus.y)*h/2-90;
      ctx.drawImage(screen,x*screen.width/w,y*screen.height/h,192*screen.width/w,160*screen.height/h,0,0,192,160);
      frames.push(canvas.toDataURL().split(',')[1]);
    }
    function advance(seconds,walk=0){
      const steps=canvas?Math.round(seconds*60):1,dt=seconds/steps;
      for(let i=0;i<steps;i++){p.pos.x+=walk/steps;f.update(dt,dt);picture();}
    }
    try{
      const basePos=model.position.clone(),baseScale=model.scale.clone();
      p.hp=1;
      const outside=[[1,0],[0,-1],[-1,0],[0,1],[Math.SQRT1_2,Math.SQRT1_2]].every(([dx,dz])=>{
        p.pos.set(berry.x+dx*(radius+.01),berry.y,berry.z+dz*(radius+.01));
        f.update(.016,.016);
        return !berry.used&&p.hp===1;
      });
      p.pos.set(berry.x+radius-.01,berry.y,berry.z);picture();f.update(.016,.016);
      f.render();
      const hp=p.hp,started=berry.absorbing&&hp>1&&!berry.halo&&!f.dwellRing.visible;
      f.interact(berry);
      advance(.065);const kick1=model.position.distanceTo(basePos);
      advance(.065);const kick2=model.position.distanceTo(basePos);
      const kicked=model.position.clone();
      advance(.075);const early=model.position.distanceTo(kicked);
      advance(.075);const mid=model.position.distanceTo(kicked);
      advance(.075,.175);advance(.076,.175);
      const target=p.pos.clone().setFromMatrixColumn(cam.matrixWorld,1).multiplyScalar(p.radius*1.8).add(p.pos);
      const arrival=berry.group.localToWorld(model.position.clone()).distanceTo(target);
      const absorbed=berry.used&&!model.visible&&!berry.absorbing&&p.hp===hp&&!f.markers().includes(berry);
      const notice=r.ui.toastsEl.lastElementChild;
      const icon=notice?.querySelector('img');
      if(!icon)throw Error('Missing QQ candy notification image');
      if(!icon.complete)await new Promise((resolve,reject)=>{
        icon.addEventListener('load',resolve,{once:true});
        icon.addEventListener('error',()=>reject(Error('QQ candy icon failed to load')),{once:true});
      });
      const iconFile=icon.src.split('?')[0].split('/ui/devices/')[1];
      const iconVisible=icon.naturalWidth>0&&!icon.hidden&&notice.textContent.includes('QQ糖');
      const cooldown=berry.respawnAt-oldTime;
      r.renderWorld(0);
      r.time=berry.respawnAt-.01;f.update(0,0);const hidden=!model.visible;
      r.time=berry.respawnAt;
      for(let i=0;i<100 && berry.used;i++)f.update(0,0);
      const restored=!berry.used&&f.hasVisual(berry)&&model.position.equals(basePos)&&model.scale.equals(baseScale);
      const moved=Math.hypot(berry.x-site.x,berry.z-site.z)>=12&&!r.sprites.visible(berry.x,berry.y+2,berry.z,8);
      const counts=['berry','freechest','chest'].map(kind=>f.list.filter(item=>item.kind===kind).length);
      return {stage:r.stage,counts,iconFile,iconVisible,outside,started,kick1,kick2,early,mid,arrival,absorbed,cooldown,hidden,restored,moved,frames};
    }finally{p.pos.copy(oldPos);p.hp=oldHp;r.time=oldTime;}
  },process.argv.includes('--berry-preview'));
  const {frames,...s}=result;
  console.log('QQ candy pickup',s);
  assert.equal(s.iconFile,'berry.png');
  assert.ok(s.iconVisible);
  assert.deepEqual(s.counts,s.stage===1?[4,2,2]:[2,1,1]);
  assert.ok(s.outside&&s.started&&s.absorbed&&s.hidden&&s.restored&&s.moved);
  assert.ok(s.kick1>0&&s.kick2>s.kick1&&s.mid>2*s.early&&s.arrival<.0001);
  assert.equal(s.cooldown,60);
  for(const [i,frame] of frames.entries())await writeFile(path.join(dir,'berry-pickup-'+s.stage+'-'+i+'.png'),Buffer.from(frame,'base64'));
  console.log('Pickup timers',await verifyPickupTimers(page));
}
