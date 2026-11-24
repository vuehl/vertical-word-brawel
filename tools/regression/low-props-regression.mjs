import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function reviewLowProps(page,dir){
  const report=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player;
    p.items.delete('air-balloon');r.input.releaseAll();
    const candidates=[...t.zxProps.filter(o=>o.walkable),
      ...t.workshopGroundSurfaces.filter(o=>['notebook','travel-journal'].includes(o.kind)).map(o=>({...o,angle:o.a,baseY:0,h:o.y}))];
    const kinds=['laptop','mechanical-keyboard','smartphone','ballpoint-pen','gel-pen','eraser','correction-tape','paint-tube','notebook','travel-journal'];
    const routes=[];
    for(const kind of kinds){
      const objects=candidates.filter(o=>o.kind===kind);if(!objects.length)continue;
      for(const axis of [[1,0],[0,1],[Math.SQRT1_2,Math.SQRT1_2]]){
        let found=null;
        for(const o of objects){
          const a=o.angle||0,c=Math.cos(a),s=Math.sin(a),dx=c*axis[0]+s*axis[1],dz=-s*axis[0]+c*axis[1];
          const half=Math.min(axis[0]?o.w/2/axis[0]:Infinity,axis[1]?o.d/2/axis[1]:Infinity)+2;
          const start=[o.x-dx*half,o.z-dz*half],end=[o.x+dx*half,o.z+dz*half];
          if(!t.inBounds(...start,2)||!t.inBounds(...end,2))continue;
          let clear=true;
          for(let q=-half;q<=half;q+=.25){const x=o.x+dx*q,z=o.z+dz*q;if(t.hitProp(x,t.height(x,z)+.03,z,.6)){clear=false;break;}}
          if(!clear||!t.walkClear(...start,dx,dz,half*2,.6)||!t.walkClear(...end,-dx,-dz,half*2,.6))continue;
          found={kind,start,end,dx,dz,half,x:o.x,z:o.z,top:o.baseY+o.h};break;
        }
        if(found)routes.push(found);
      }
    }
    window.lowPropRoutes=routes;
    return {stage:r.stage,lowCount:t.zxProps.filter(o=>o.walkable).length,highCount:t.zxProps.filter(o=>!o.walkable).length,
      laptops:t.zxProps.filter(o=>o.kind==='laptop').map(o=>({height:o.h,walkable:o.walkable})),routes:[]};
  });
  assert.ok(report.laptops.length>0&&report.laptops.every(o=>o.walkable&&o.height<1.1),'Every laptop must be closed and walkable');
  const routes=await page.evaluate(()=>lowPropRoutes);
  for(const kind of ['laptop','smartphone','notebook','travel-journal'])assert.ok(routes.some(r=>r.kind===kind),'Need an actual walk-through route for '+kind);
  for(let index=0;index<routes.length;index++){
    const result=await page.evaluate(index=>{
      const r=app.run,p=r.player,t=r.terrain,route=lowPropRoutes[index],runs=[];
      for(const [fps,reverse,shoes] of [[60,false,false],[30,true,false],[60,false,true]]){
        if(shoes)p.items.set('air-balloon',1);else p.items.delete('air-balloon');
        const from=reverse?route.end:route.start,to=reverse?route.start:route.end;
        p.pos.set(from[0],t.height(...from),from[1]);p.vel.set(0,0,0);p.grounded=true;p.slip=0;p.slideT=0;p.stuckT=0;p.kx=p.kz=p.crowdX=p.crowdZ=0;
        let maxGroundError=0,maxRise=0,jumped=false,frames=0,atTop=false;
        const maxFrames=Math.ceil((route.half*2/5+2)*fps);
        for(;frames<maxFrames;frames++){
          const dx=to[0]-p.pos.x,dz=to[1]-p.pos.z,d=Math.hypot(dx,dz);if(d<.25)break;
          r.input.stickX=dx/d;r.input.stickY=-dz/d;r.realDt=1/fps;p.update(1/fps);r.input.endFrame();
          const ground=t.height(p.pos.x,p.pos.z);
          if(p.grounded)maxGroundError=Math.max(maxGroundError,Math.abs(p.pos.y-ground));
          maxRise=Math.max(maxRise,p.pos.y);jumped ||= p.vel.y>1;
          if(Math.hypot(p.pos.x-route.x,p.pos.z-route.z)<.6&&p.pos.y>=route.top-.05)atTop=true;
        }
        runs.push({fps,reverse,shoes,error:Math.hypot(to[0]-p.pos.x,to[1]-p.pos.z),maxGroundError,maxRise,jumped,atTop,frames});
      }
      p.items.delete('air-balloon');r.input.stickX=r.input.stickY=0;
      return {kind:route.kind,start:route.start,end:route.end,top:route.top,runs};
    },index);
    report.routes.push(result);
    fs.writeFileSync(path.join(dir,'low-props-stage-'+report.stage+'.json'),JSON.stringify(report,null,2));
    for(const run of result.runs){
      assert.ok(run.error<.3,`${result.kind} must cross at ${run.fps} FPS: ${run.error}`);
      assert.ok(run.atTop&&run.maxGroundError<.03,`${result.kind}: feet must stand on the top`);
      assert.equal(run.jumped,false,`${result.kind}: no jump or jump equipment should be required`);
    }
  }
  report.tall=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,p=r.player,result=[];
    for(const kind of ['coffee-cup','milk-bottle','storage-crate','color-cube']){
      let probe=null;
      search:for(const o of t.zxProps.filter(o=>o.kind===kind))for(const sign of [-1,1]){
        const a=o.angle||0,dx=Math.cos(a)*sign,dz=-Math.sin(a)*sign,half=o.w/2+2;
        const x=o.x+dx*half,z=o.z+dz*half;
        if(!t.inBounds(x,z,1)||Math.hypot(x,z)>t.arenaR-2||Math.hypot(o.x,o.z)>t.arenaR-2||t.hitProp(x,t.height(x,z)+.03,z,p.radius))continue;
        probe={o,dx,dz,x,z};break search;
      }
      // The sanctuary has fewer objects and a circular walking limit.
      if(!probe){if(r.stage===4)continue;throw Error('Missing accessible high prop '+kind);}
      const {o,dx,dz,x,z}=probe;deskPlace(x,z);
      for(let i=0;i<180;i++){r.input.stickX=-dx;r.input.stickY=dz;r.realDt=1/60;p.update(1/60);r.input.endFrame();}
      const progress=(p.pos.x-o.x)*dx+(p.pos.z-o.z)*dz;
      result.push({kind,object:[o.x,o.z],start:[x,z],end:p.pos.toArray(),halfWidth:o.w/2,progress,walkLim:r.walkLim,arenaR:t.arenaR,stopped:progress>=o.w/2+p.radius-.1,inside:!!t.hitProp(p.pos.x,p.pos.y+.03,p.pos.z,p.radius-.04)});
    }
    r.input.stickX=r.input.stickY=0;return result;
  });
  fs.writeFileSync(path.join(dir,'low-props-stage-'+report.stage+'.json'),JSON.stringify(report,null,2));
  assert.ok(report.tall.length>=2&&report.tall.every(o=>o.stopped&&!o.inside),'Tall objects must still stop ordinary walking');
  // Keep the same finger down from one end of a real laptop to the other.
  await page.evaluate(()=>{
    const q=lowPropRoutes.find(o=>o.kind==='laptop'),r=app.run;
    const screen=inspected.doc.getElementById('game').getBoundingClientRect();
    const x=inspected.env.innerWidth*.5-screen.x,y=inspected.env.innerHeight*.8-screen.y;
    deskPlace(...q.start);deskFrame();
    window.tap(x,y,'down');window.tap(x+q.dx*55,y+q.dz*55,'move');
    window.laptopDrag={q,x:x+q.dx*55,y:y+q.dz*55};
    if(Math.hypot(r.input.stickX,r.input.stickY)<.9)throw Error('The drag did not reach the movement control');
  });
  async function advanceTo(fraction){
    return page.evaluate(fraction=>{
      const {q}=laptopDrag,r=app.run,p=r.player;
      const x=q.start[0]+q.dx*q.half*2*fraction,z=q.start[1]+q.dz*q.half*2*fraction;
      let frames=0;
      while((x-p.pos.x)*q.dx+(z-p.pos.z)*q.dz>.08&&frames++<360){
        r.realDt=1/60;p.update(1/60);r.input.endFrame();
      }
      deskFrame();
      return {position:p.pos.toArray(),error:Math.hypot(x-p.pos.x,z-p.pos.z),ground:r.terrain.height(p.pos.x,p.pos.z),top:q.top};
    },fraction);
  }
  report.touch={middle:await advanceTo(.5)};
  assert.ok(report.touch.middle.error<.2&&Math.abs(report.touch.middle.position[1]-report.touch.middle.top)<.03,'Touch drag must put the feet on the laptop lid');
  await page.screenshot({path:path.join(dir,'合盖电脑-站立-区域'+report.stage+'.png')});
  report.touch.end=await advanceTo(1);
  report.touch.released=await page.evaluate(()=>{
    window.tap(laptopDrag.x,laptopDrag.y,'up');return app.run.input.stickX===0&&app.run.input.stickY===0;
  });
  assert.ok(report.touch.end.error<.2&&Math.abs(report.touch.end.position[1]-report.touch.end.ground)<.03&&report.touch.released,'The same drag must walk off the far side and release');
  fs.writeFileSync(path.join(dir,'low-props-stage-'+report.stage+'.json'),JSON.stringify(report,null,2));
  return report;
}
