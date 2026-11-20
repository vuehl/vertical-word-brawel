import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';

export async function verifyBerryPickup(page,dir){
  const result=await page.evaluate(async preview=>{
    app.halted=true;
    const r=app.run,f=r.interactables,p=r.player,host=r.r,cam=host.camera;
    const oldPos=p.pos.clone(),oldHp=p.hp,oldTime=r.time;
    const site=r.terrain.spawn,berry=f.add('berry',site.x,site.z);
    await berry.modelReady;r.state='play';
    const model=berry.model;model.updateWorldMatrix(true,true);
    p.pos.copy(berry.group.position);r.camTarget.copy(p.pos);r.updateCamera(0);cam.updateMatrixWorld();
    const w=host.canvas.clientWidth,h=host.canvas.clientHeight;
    // Independently project the visible art, then unproject probe points on the
    // floor. Exercise the exact display-pixel threshold from all four sides.
    const vertices=[],v=p.pos.clone();let shadow;
    model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      if(r.terrain.desk2d){
        const bitmap=mesh.material.map.image,can=document.createElement('canvas');
        const size=can.width=can.height=bitmap.width,ctx=can.getContext('2d');
        ctx.drawImage(bitmap._surface??bitmap,0,0);const bytes=ctx.getImageData(0,0,size,size).data;
        const project=(x,y)=>v.set(x/size-.5,.5-y/size,0).applyMatrix4(mesh.matrixWorld).project(cam).clone();
        for(let y=0;y<size;y++)for(let x=0;x<size;x++){
          const alpha=bytes[(y*size+x)*4+3];
          if(alpha===171){
            const px=project(x+.5,y+.5);
            if(!shadow||px.x<shadow.x)shadow=px;
          }
          if(alpha<204)continue;
          if(x&&bytes[(y*size+x-1)*4+3]>=204&&bytes[(y*size+x+1)*4+3]>=204)continue;
          vertices.push(project(x,y),project(x+1,y),project(x,y+1),project(x+1,y+1));
        }
        return;
      }
      const positions=mesh.geometry.attributes.position;
      for(let i=0;i<positions.count;i++)vertices.push(v.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(cam).clone());
    });
    function place(tip,dx,dy,dist){
      const near=v.set(tip.x+dx*dist*2/w,tip.y+dy*dist*2/h,-1).unproject(cam);
      const far=near.clone().set(tip.x+dx*dist*2/w,tip.y+dy*dist*2/h,1).unproject(cam);
      p.pos.lerpVectors(near,far,(berry.y-near.y)/(far.y-near.y));
    }
    if(shadow){place(shadow,0,0,0);if(berry.berryPickup.inReach(p))throw Error('Candy shadow triggered pickup');}
    const edges=[];
    let right;
    for(const [dx,dy] of [[0,1],[0,-1],[-1,0],[1,0]]){
      const tip=vertices.reduce((a,b)=>dx*(b.x-a.x)+dy*(b.y-a.y)>0?b:a);
      place(tip,dx,dy,5.1);edges.push(berry.berryPickup.inReach(p));
      place(tip,dx,dy,5);edges.push(berry.berryPickup.inReach(p));
      place(tip,dx,dy,4.9);edges.push(berry.berryPickup.inReach(p));
      if(dx===1)right=tip;
    }
    const frames=[],canvas=preview?document.createElement('canvas'):null;
    function picture(){
      if(!canvas)return;
      r.renderWorld(0);host.render(0);
      canvas.width=192;canvas.height=160;
      const screen=GameGlobal.pokebonk.canvas,ctx=canvas.getContext('2d');
      const x=(right.x+1)*w/2-120,y=(1-right.y)*h/2-90;
      ctx.drawImage(screen,x*screen.width/w,y*screen.height/h,192*screen.width/w,160*screen.height/h,0,0,192,160);
      frames.push(canvas.toDataURL().split(',')[1]);
    }
    function advance(seconds,walk=0){
      const steps=canvas?Math.round(seconds*60):1,dt=seconds/steps;
      for(let i=0;i<steps;i++){p.pos.x+=walk/steps;f.update(dt,dt);picture();}
    }
    try{
      const basePos=model.position.clone(),baseScale=model.scale.clone();
      p.hp=1;place(right,1,0,5.1);f.update(.016,.016);
      const outside=!berry.used&&p.hp===1;
      place(right,1,0,4.9);picture();f.update(.016,.016);
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
      const cooldown=berry.data.regenAt-oldTime;
      r.time=berry.data.regenAt-.01;f.update(0,0);const hidden=!model.visible;
      r.time=berry.data.regenAt;f.update(0,0);
      const restored=!berry.used&&f.hasVisual(berry)&&model.position.equals(basePos)&&model.scale.equals(baseScale);
      return {stage:r.stage,edges,outside,started,kick1,kick2,early,mid,arrival,absorbed,cooldown,hidden,restored,frames};
    }finally{f.remove(berry);p.pos.copy(oldPos);p.hp=oldHp;r.time=oldTime;}
  },process.argv.includes('--berry-preview'));
  const {frames,...s}=result;
  console.log('QQ candy pickup',s);
  assert.deepEqual(s.edges,[false,true,true,false,true,true,false,true,true,false,true,true]);
  assert.ok(s.outside&&s.started&&s.absorbed&&s.hidden&&s.restored);
  assert.ok(s.kick1>0&&s.kick2>s.kick1&&s.mid>2*s.early&&s.arrival<.0001);
  assert.equal(s.cooldown,60);
  for(const [i,frame] of frames.entries())await writeFile(path.join(dir,'berry-pickup-'+s.stage+'-'+i+'.png'),Buffer.from(frame,'base64'));
}
