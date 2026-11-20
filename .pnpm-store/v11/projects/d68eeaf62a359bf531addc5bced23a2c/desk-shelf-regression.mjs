import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyDeskShelf(page,dir){
  const report=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player.pos,host=r.r,cam=host.camera,renderer=host.renderer;
    const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    const saved=p.clone(),savedFocus=r.camTarget.clone(),auto=renderer.autoClear,target=renderer.getRenderTarget();
    const clear=renderer.getClearColor(host.shared.uFogColor.value.clone()),alpha=renderer.getClearAlpha();
    const world=(x,y)=>p.clone().set((2*x/5142-1)*t.deskBounds.x,0,(2*y/2892-1)*t.deskBounds.z);
    const open=(x,y,radius)=>{const v=world(x,y);return !t.hitProp(v.x,0,v.z,radius);};
    const feet=t.colliders.filter(c=>c.kind==='shelf-foot');
    const playerRadius=r.player.radius;
    function traverse(ax,ay,bx,by){
      const a=world(ax,ay),b=world(bx,by),out={x:a.x,z:a.z};
      const enemy=Object.assign(Object.create(Object.getPrototypeOf(r.enemies)),{
        run:r,x:[a.x],z:[a.z],y:[0],air:[0],radius:[.6],propSide:[0],propPosition:{}});
      for(let i=0;i<80;i++){
        const dx=(b.x-a.x)/80,dz=(b.z-a.z)/80;
        t.resolve(out.x+dx,out.z+dz,playerRadius,0,out);
        enemy.moveAcrossProps(0,enemy.x[0],enemy.z[0],enemy.x[0]+dx,enemy.z[0]+dz,1/60,true);
      }
      return [Math.hypot(out.x-b.x,out.z-b.z),Math.hypot(enemy.x[0]-b.x,enemy.z[0]-b.z)];
    }
    const routes=[traverse(1258,548,1430,548),traverse(2490,680,2670,680),traverse(2670,720,2860,720),
      traverse(4050,949,4650,1050)];
    const blocked=traverse(1310,696,1310,595);
    function pose(x,y){
      p.copy(world(x,y));r.camTarget.copy(p);r.updateCamera(1);cam.updateMatrixWorld();
      r.renderWorld(0);host.scene.updateMatrixWorld(true);
    }
    function shot(){
      renderer.setClearColor(clear,alpha);host.render(0);
      return gl.canvas.toDataURL('image/png').split(',')[1];
    }
    // Render the same cel at identical coordinates with/without the shelf.
    // Count separately the pixels lost to occlusion and the retained ink.
    function pixels(mesh,texture,background){
      r.sprites.setShelfDepth(texture);renderer.setClearColor(background,1);
      renderer.render(mesh,cam);
      const bytes=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
      return bytes;
    }
    function compare(mesh){
      const lit=pixels(mesh,null,0xff00ff),actual=pixels(mesh,t.shelfDepth,0xff00ff);
      const background=(a,i)=>a[i]>248&&a[i+1]<7&&a[i+2]>248;
      let total=0,hidden=0;
      for(let i=0;i<lit.length;i+=4){
        if(background(lit,i))continue;
        total++;
        if(background(actual,i))hidden++;
      }
      return {total,hidden};
    }
    function brightness(mesh){
      const lit=pixels(mesh,null,0),actual=pixels(mesh,t.shelfDepth,0);
      let ink=0,shaded=0;
      for(let i=0;i<lit.length;i+=4){
        ink+=lit[i]+lit[i+1]+lit[i+2];shaded+=actual[i]+actual[i+1]+actual[i+2];
      }
      return shaded/ink;
    }
    function hero(){
      return [...r.sprites.glyphGroups.values()].find(g=>g.source.zxOriginalGlyph&&g.count).mesh;
    }
    const result={routes,blocked,feet:feet.length,wallBlocked:!open(4100,740,.5),frames:{}};
    try{
      renderer.setRenderTarget(null);renderer.autoClear=true;
      result.posts=[];
      for(const [x,y,frontX,frontY] of [[1251,551,1293,666],[2598,784,2604,940],[2781,816,2777,974]]){
        pose(x,y);const behind=compare(hero());
        if(!result.posts.length)result.frames.behind=shot();
        pose(frontX,frontY);const front=compare(hero());
        if(!result.posts.length)result.frames.front=shot();
        result.posts.push({behind,front});
      }
      const x=1940,edge=552+(x-1190)*758/3952;
      result.sunlight=[];
      for(const gap of [-48,0,48]){
        pose(x,edge+gap);result.sunlight.push(brightness(hero()));
        if(gap<0)result.frames.shadow=shot();
      }
      pose(2598,774);
      const sprites=r.sprites,batch=sprites.get(19,false,'虫');
      sprites.begin(cam);batch.push(p.x,0,p.z,'idle',0,0,1);sprites.end();
      result.enemy=compare(batch.zxGroup.mesh);
      const ally=r.allies.make(19,p.x,0,p.z),team=Object.create(r.allies);
      team.list=[ally];sprites.begin(cam);team.render();sprites.end();
      result.ally=compare(sprites.get(19).zxGroup.mesh);
      pose(x,edge-48);ally.x=p.x;ally.z=p.z;
      sprites.begin(cam);batch.push(p.x,0,p.z,'idle',0,0,1);sprites.end();
      result.enemy.brightness=brightness(batch.zxGroup.mesh);
      sprites.begin(cam);team.render();sprites.end();
      result.ally.brightness=brightness(sprites.get(19).zxGroup.mesh);
      const goal=world(2860,720),start=world(2470,720),facing=r.player.facing.clone();
      try{
        r.player.facing.set(0,1);p.copy(goal);p.z+=2.6;
        ally.x=start.x;ally.z=start.z;ally.timer=100;
        for(let i=0;i<300;i++)team.updateAlly(ally,2,1/60);
        result.allyTravelError=Math.hypot(ally.x-goal.x,ally.z-goal.z);
        const approach=world(1310,695),behind=world(1310,538);
        ally.x=approach.x;ally.z=approach.z;p.copy(behind);p.z+=2.6;
        result.allyCrossedFoot=false;
        for(let i=0;i<300;i++){
          team.updateAlly(ally,2,1/60);
          if(t.hitProp(ally.x,0,ally.z,.44))result.allyCrossedFoot=true;
        }
        result.allyDetourError=Math.hypot(ally.x-behind.x,ally.z-behind.z);
      }finally{r.player.facing.copy(facing);}
      result.gl=gl.getError();return result;
    }finally{
      renderer.setClearColor(clear,alpha);renderer.autoClear=auto;renderer.setRenderTarget(target);
      r.sprites.setShelfDepth(t.shelfDepth);p.copy(saved);r.camTarget.copy(savedFocus);
      r.updateCamera(0);r.renderWorld(0);host.render(0);
    }
  });
  const {frames,...measurements}=report;
  for(const [name,frame] of Object.entries(frames))await fs.writeFile(path.join(dir,'shelf-'+name+'.png'),Buffer.from(frame,'base64'));
  console.log('Shelf collision and framebuffer measurements',JSON.stringify(measurements));
  assert.equal(report.feet,3);assert.ok(report.wallBlocked);
  assert.ok(report.routes.flat().every(error=>error<.001));
  assert.ok(report.blocked.every(error=>error>.3));
  assert.ok(report.posts.every(({behind,front})=>behind.hidden>12&&front.total>50&&front.hidden===0));
  assert.ok(report.sunlight[0]<report.sunlight[1]-.04&&report.sunlight[1]<report.sunlight[2]-.04);
  assert.ok(Math.abs(report.sunlight[2]-1)<.001);
  assert.ok(report.enemy.hidden>10&&report.enemy.brightness<.93);
  assert.ok(report.ally.hidden>10&&report.ally.brightness<.93&&report.allyTravelError<.41);
  assert.ok(!report.allyCrossedFoot&&report.allyDetourError<.41);
  assert.equal(report.gl,0);
}
