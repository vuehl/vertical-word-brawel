import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewSpringShoes(page,dir){
  const report=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player;
    if(!t.desk2d)throw Error('Expected the actual first-zone illustrated map');
    r.state='play';r.autoRun=false;r.input.releaseAll();r.enemies.clear();
    p.moves.fill(null);for(const key of Object.keys(p.pstat))p.pstat[key]=0;
    const initialShoes=p.items.get('air-balloon');
    const kinds=[...new Set(t.colliders.filter(b=>!t.shelfBarriers.includes(b)).map(b=>b.kind))];
    const routes=[];
    for(const kind of kinds){
      const boxes=t.colliders.filter(b=>b.kind===kind);
      // Find a horizontal crossing of the real silhouette with clear endpoints.
      let route=null;
      for(const b of boxes){
        const z=b.z,strip=boxes.filter(b=>Math.abs(z-b.z)<b.halfZ);
        const left=Math.min(...strip.map(b=>b.x-b.halfX))-p.radius-1;
        const right=Math.max(...strip.map(b=>b.x+b.halfX))+p.radius+1;
        if(!t.inBounds(left,z,2)||!t.inBounds(right,z,2)||t.hitProp(left,0,z,p.radius)||t.hitProp(right,0,z,p.radius))continue;
        let clear=true;
        for(let x=left;x<=right;x+=.1){
          if(t.nearbyColliders(x,z).some(b=>b.kind!==kind&&
              Math.abs(x-b.x)<b.halfX+p.radius&&Math.abs(z-b.z)<b.halfZ+p.radius)){clear=false;break;}
        }
        if(clear&&(!route||right-left<route.right-route.left))route={kind,left,right,z};
      }
      if(route)routes.push(route);
    }
    const reset=(x,z,shoes)=>{
      if(shoes)p.items.set('air-balloon',1);else p.items.delete('air-balloon');
      p.pos.set(x,0,z);p.vel.set(0,0,0);p.grounded=true;p.stickHeldLastUpdate=false;
      p.kx=p.kz=p.crowdX=p.crowdZ=p.slideT=p.stuckT=0;
      r.input.releaseAll();r.input.endFrame();
    };
    const tick=dt=>{r.realDt=dt;p.update(dt);r.input.endFrame();};
    const runs=[];
    for(const route of routes)for(const fps of [30,60])for(const reverse of [false,true])for(const shoes of [false,true]){
      const {left,right,z,kind}=route,from=reverse?right:left,to=reverse?left:right,sign=reverse?-1:1;
      reset(from,z,shoes);r.input.stickX=sign;
      let jumped=false,peak=0,penetrated=false;
      for(let frame=0;frame<fps*12&&(to-p.pos.x)*sign>.12;frame++){
        tick(1/fps);jumped ||= p.vel.y>1;peak=Math.max(peak,p.pos.y);
        penetrated ||= t.hitProp(p.pos.x,p.pos.y+.001,p.pos.z,p.radius-.001);
      }
      r.input.releaseAll();for(let i=0;i<fps;i++)tick(1/fps);
      runs.push({kind,fps,reverse,shoes,jumped,peak,penetrated,crossed:(to-p.pos.x)*sign<.2,
        landed:p.grounded&&Math.abs(p.pos.y)<.001});
    }
    const boundaries=t.shelfBarriers.every(b=>b.standY==null);
    reset(t.spawn.x,t.spawn.z,true);
    r.renderWorld(0);r.updateCamera(1);app.r.render(0);
    return {environment:'Compiled WeChat bundle in Chrome SwiftShader; not a phone test',initialShoes,kinds,routes,runs,boundaries};
  });
  fs.writeFileSync(path.join(dir,'spring-shoes-report.json'),JSON.stringify(report,null,2));
  assert.equal(report.initialShoes,1,'The normal run starts with one pair');
  assert.ok(report.routes.length>=5,'Cover multiple real obstacle silhouettes');
  assert.ok(report.boundaries,'The shelf and tabletop boundary must remain impassable');
  for(const run of report.runs){
    assert.equal(run.jumped,run.shoes,JSON.stringify(run));
    assert.equal(run.crossed,run.shoes,JSON.stringify(run));
    assert.equal(run.penetrated,false,JSON.stringify(run));
    assert.ok(run.landed,JSON.stringify(run));
  }
  report.touch=[];
  for(const fps of [30,60])for(const drag of [18,55]){
    const result=await page.evaluate(({route,fps,drag})=>{
      const r=app.run,p=r.player;r.ui.hideModal();
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
      p.pos.set(route.left,0,route.z);p.vel.set(0,0,0);p.grounded=true;
      p.kx=p.kz=p.crowdX=p.crowdZ=p.slideT=p.stuckT=0;
      r.input.releaseAll();r.input.endFrame();
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      const x=inspected.env.innerWidth*.5-screen.x,y=inspected.env.innerHeight*.8-screen.y;
      window.tap(x,y,'down');window.tap(x+drag,y,'move');
      const held=r.ui.touch.stickId>=0,input=r.input.stickX;
      let jumped=false,peak=0;
      for(let frame=0;frame<fps*30&&p.pos.x<route.right;frame++){
        r.realDt=1/fps;p.update(1/fps);r.input.endFrame();
        jumped ||= p.vel.y>1;peak=Math.max(peak,p.pos.y);
      }
      window.tap(x+drag,y,'up');
      const stop=p.pos.clone();
      for(let frame=0;frame<fps;frame++){r.realDt=1/fps;p.update(1/fps);r.input.endFrame();}
      return {fps,drag,held,input,jumped,peak,crossed:p.pos.x>=route.right,
        landed:p.grounded&&p.pos.y===0,released:r.input.stickX===0&&r.input.stickY===0,
        stopped:Math.hypot(p.pos.x-stop.x,p.pos.z-stop.z)<.001};
    },{route:report.routes.find(r=>r.kind==='mouse'),fps,drag});
    report.touch.push(result);
    fs.writeFileSync(path.join(dir,'spring-shoes-report.json'),JSON.stringify(report,null,2));
    assert.ok(result.held&&result.input>0&&result.jumped&&result.crossed&&result.landed&&result.released&&result.stopped,JSON.stringify(result));
  }
  console.log(`Spring shoes: ${report.runs.length} crossings, ${report.routes.length} actual obstacle types, 30/60 FPS, both directions, with/without equipment verified.`);
}
