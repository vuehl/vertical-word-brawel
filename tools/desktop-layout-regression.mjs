import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function reviewDesktopLayout(page,dir){
  fs.mkdirSync(dir,{recursive:true});
  const report={environment:'Compiled WeChat bundle in Chrome SwiftShader; controlled real movement, not a phone performance test.',screens:[],stages:[]};
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(async()=>{
    window.dispatchEvent(new Event('resize'));app.halted=true;
    Object.assign(app.meta.profile.settings,{quality:'high',batterySaver:false,autoUlt:false});app.applySettings();
    window.desktopPrepare=async()=>{
      const r=app.run;r.state='play';r.godMode=true;r.pendingLevels=0;r.autoRun=false;r.ui.hideModal();
      r.player.moves=Array(4).fill(null);r.ult.clear();r.enemies.clear();
      r.director.update=()=>{};r.events.update=()=>{};r.minibosses.update=()=>{};
      r.timers.length=0;r.anims.length=0;r.input.releaseAll();r.input.endFrame();
      inspected.doc.querySelectorAll('.zx-intro,.run-hint,.banner').forEach(n=>n.remove());
      await Promise.all(r.terrain.paperAssets.photoJobs);
    };
    window.desktopFrame=()=>{
      const r=app.run;app.r.renderer.resetState();r.updateCamera(1);r.renderWorld(0);r.vfx.update(0);r.ui.hud(r);
      app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    };
    window.desktopPlace=(x,z)=>{
      const r=app.run,p=r.player;p.pos.set(x,r.terrain.height(x,z),z);p.vel.set(0,0,0);
      p.grounded=true;p.kx=p.kz=p.crowdX=p.crowdZ=0;p.slideT=0;p.stuckT=0;r.camTarget.copy(p.pos);
    };
    window.desktopForegroundState=()=>{
      const t=app.run.terrain,f=t.workshopForegroundLights;
      if(!f)return null;
      const signature=array=>{const bits=new Uint32Array(array.buffer,array.byteOffset,array.byteLength/4);let hash=2166136261;for(const value of bits)hash=Math.imul(hash^value,16777619)>>>0;return hash;};
      return {visible:f.meshes.some(m=>m.visible),activeIds:f.activeIds,opacity:f.opacity,hiddenReason:f.hiddenReason,
        metrics:f.metrics,disposed:f.disposed,owner:f.meshes.every(m=>t.group.children.includes(m)),count:f.meshes.length,
        triangles:f.geometries.reduce((n,g)=>n+(g.index?g.index.count:g.attributes.position.count)/3,0),
        shader:f.materials.every(m=>m.isShaderMaterial),singlePass:f.materials.every(m=>m.forceSinglePass),lights:f.materials.some(m=>m.lights),
        depthWrite:f.materials.some(m=>m.depthWrite),depthTest:f.materials.every(m=>m.depthTest),
        screenOffset:f.materials.some(m=>'uOffset' in m.uniforms||/gl_Position\s*=\s*vec4\(uOffset/.test(m.vertexShader)),
        castShadow:f.meshes.some(m=>m.castShadow),receiveShadow:f.meshes.some(m=>m.receiveShadow),
        immutable:f.meshes.map(m=>{m.updateMatrixWorld(true);return {matrix:m.matrixWorld.toArray(),buffers:Object.fromEntries(Object.entries(m.geometry.attributes).map(([key,a])=>[key,signature(a.array)]))};}),
        strands:f.strands.map(s=>({id:s.id,start:s.points[0],middle:s.points[Math.floor(s.points.length/2)],end:s.points.at(-1),
          bulbCount:s.bulbs.length,bulbRadius:s.bulbs[0]?.radius,wireRadius:s.wireRadius,opacity:s.opacity,nearestDistance:s.nearestDistance})),
        colliderProps:t.zxProps.filter(p=>/foreground/.test(p.kind)).length};
    };
    window.desktopState=()=>{
      const r=app.run,t=r.terrain,surfaces=t.workshopGroundSurfaces;
      let sampled=0,wood=0,maxHeightError=0;
      const sample=(x,z)=>{const h=t.height(x,z);maxHeightError=Math.max(maxHeightError,Math.abs(h-t.surface(x,z)),Math.abs(h-t.workshopGroundY(x,z)));return h;};
      for(let x=-t.play*.9;x<=t.play*.9;x+=t.play*.09)for(let z=-t.play*.9;z<=t.play*.9;z+=t.play*.09){sampled++;if(sample(x,z)<.001)wood++;}
      for(const s of surfaces)sample(s.x,s.z);
      r.renderWorld(0);
      const marbles=t.workshopLooseMarbles.map((m,i)=>({x:m.x,z:m.z,ground:t.height(m.x,m.z),radius:m.r,renderY:t.workshopLooseMesh.instanceMatrix.array[i*16+13]}));
      return {stage:r.stage,surfaces:surfaces.map(({x,z,w,d,a,y,kind})=>({x,z,w,d,a,y,kind})),woodFraction:wood/sampled,maxHeightError,
        play:t.play,boundaryEdge:t.workshopBoundary.edge,lightStrands:t.workshopLightStrands,foreground:desktopForegroundState(),
        sphere:{type:t.paperAssets.spheres.type,triangles:t.paperAssets.spheres.index.count/3},
        lightPosts:t.zxProps.filter(p=>p.kind==='fairy-light-post'),cornerCluster:t.workshopLayout.cornerCluster,lowerLeftCluster:t.workshopLayout.lowerLeftCluster,
        alarmClocks:t.zxProps.filter(p=>p.kind==='boundary-alarm-clock').map(p=>({...p,solid:t.hitProp(p.x,t.height(p.x,p.z)+.3,p.z,.4)})),
        oldNorthWestProps:t.zxProps.filter(p=>['boundary-book','boundary-crayon-box'].includes(p.kind)&&p.x<-t.play*.6&&p.z<-t.play*.7),
        spawn:{y:r.player.pos.y,ground:t.height(r.player.pos.x,r.player.pos.z),clear:!t.hitProp(r.player.pos.x,r.player.pos.y+.3,r.player.pos.z,r.player.radius)},
        buildings:r.interactables.list.map(b=>({kind:b.kind,y:b.y,modelY:b.group?.position.y,ground:t.height(b.x,b.z)})),marbles,
        photoFailures:t.paperAssets.photoFailures};
    };
    // Search an actual exposed edge, leaving enough clearance for both actors.
    window.desktopFindLane=kind=>{
      const r=app.run,t=r.terrain,clearance=Math.max(1.5,r.player.radius+.3);
      for(const s of t.workshopGroundSurfaces.filter(s=>s.kind===kind)){
        const c=Math.cos(s.a),sn=Math.sin(s.a);
        for(const axis of ['x','z'])for(const sign of [-1,1])for(const fraction of [0,-.45,.45,-.7,.7]){
          const lx=axis==='x'?sign*s.w/2:fraction*s.w/2,lz=axis==='z'?sign*s.d/2:fraction*s.d/2;
          const edge={x:s.x+c*lx+sn*lz,z:s.z-sn*lx+c*lz};
          const out=axis==='x'?{x:c*sign,z:-sn*sign}:{x:sn*sign,z:c*sign};
          const at=d=>({x:edge.x+out.x*d,z:edge.z+out.z*d}),outer=at(3),inner=at(-5);
          const low=t.height(outer.x,outer.z),high=t.height(inner.x,inner.z);
          if(high-low<.04||Math.abs(high-s.y)>.001)continue;
          let clear=true;
          for(let d=-8;d<=6;d+=.25){const p=at(d),h=t.height(p.x,p.z);if(!t.inBounds(p.x,p.z,clearance)||t.hitProp(p.x,h+.3,p.z,clearance)||t.inSolid(p.x,p.z)){clear=false;break;}}
          if(clear)return {kind,edge,out,outer,inner,low,high};
        }
      }
      throw Error('No clear, exposed edge for '+kind);
    };
    await desktopPrepare();desktopFrame();
  });
  async function shot(name,description){
    await page.evaluate(()=>desktopFrame());const buffer=await page.screenshot({path:path.join(dir,name+'.png')});report.screens.push({name,description});return buffer;
  }
  function checkStage(s){
    assert.ok(s.surfaces.length>0,'The area must load walkable desktop surfaces');
    assert.ok(s.surfaces.every(p=>p.y>0&&p.y<=.44),'Paper and notebook steps must remain below the enemy step threshold');
    assert.ok(s.maxHeightError<1e-6,'Player, enemy and visual ground queries must agree');
    assert.ok(s.spawn.clear&&Math.abs(s.spawn.y-s.spawn.ground)<.002,'The area spawn must be clear and on its visible surface');
    assert.deepEqual(s.photoFailures,[]);
    assert.ok(s.buildings.every(b=>Math.abs(b.y-b.ground)<.002&&(b.modelY===undefined||Math.abs(b.modelY-b.ground)<.002)),'Functional buildings must sit on their terrain height');
    assert.ok(s.marbles.length>0&&s.marbles.every(m=>Math.abs(m.renderY-m.ground-m.radius)<.002),'Loose marble meshes must rest on the visible desktop');
    assert.equal(s.sphere.type,'SphereGeometry','Small bulbs and marbles must use the intended sphere primitive');
    assert.ok(s.sphere.triangles<=1300,'Small round props must not accidentally use a costly subdivided polyhedron');
    assert.deepEqual(s.lightPosts,[],'Freestanding light posts must be removed in every area');
    assert.ok(s.lightStrands.every(strand=>strand.attachment!=='posts'),'No short freestanding light strand should remain');
    assert.equal(s.lightStrands.filter(strand=>strand.attachment==='wall').length,0,'Long wall-to-wall cables must be removed');
    const f=s.foreground;
    assert.ok(f&&f.owner&&!f.disposed,'The impostor belongs to this area');
    assert.equal(f.count,s.play>80?2:0,'Regular areas contain exactly two anchored strands; the final area has none');
    assert.ok(f.triangles<=500&&f.metrics.drawcalls<=2,'Fixed-world light artwork stays lightweight');
    assert.ok(f.singlePass,'Transparent ribbons must not render a redundant second side pass');
    assert.ok(f.shader&&!f.lights&&!f.screenOffset,'Light artwork uses real camera projection rather than a screen overlay');
    assert.ok(!f.castShadow&&!f.receiveShadow&&!f.depthWrite&&f.depthTest,'Scene objects can occlude the artwork without extra lights or shadows');
    assert.equal(f.colliderProps,0);assert.equal(f.strands.length,s.play>80?2:0);
    for(const strand of f.strands){
      assert.ok(Math.abs(strand.start[0]+s.boundaryEdge-2.1)<.01&&Math.abs(strand.end[0]-s.boundaryEdge+2.1)<.01,'The fixed green-line routes still attach to both side walls');
      assert.ok(strand.middle[1]>=8&&strand.middle[1]<16,'The original hanging height is preserved');
      assert.ok(Math.abs(strand.bulbRadius-.25)<.001&&Math.abs(strand.wireRadius-.065)<.001,'Bulbs and cable preserve their physical world scale');
      assert.ok(strand.bulbCount>=25&&strand.bulbCount<=40,'Bulbs keep the original spacing along each route');
    }
    if(s.play>80){
      const corner=s.cornerCluster;
      assert.ok(corner&&corner.x<-s.play*.5&&corner.z<-s.play*.5,'The alarm-clock grouping must occupy the north-west corner');
      assert.equal(s.alarmClocks.length,1,'Each regular area needs exactly one north-west alarm clock');
      const clock=s.alarmClocks[0];
      assert.ok(clock.x<-s.play*.6&&clock.z<-s.play*.7&&clock.h>=24&&clock.h<=38,'The alarm clock is a moderate-sized corner landmark');
      assert.equal(clock.solid,true,'The alarm clock needs a matching solid footprint');
      assert.ok(corner.props.some(p=>p.kind==='boundary-alarm-clock'),'The authored corner must contain its alarm clock');
      for(const kind of ['thread-spool','binder-clips','brick-game'])assert.ok(corner.props.some(p=>p.kind===kind),'Missing small clock-side object: '+kind);
      assert.ok(corner.props.every(p=>!/book|crayon/.test(p.kind)),'The old corner books and crayons must be replaced');
      assert.ok(corner.props.every(p=>p.x<0&&p.z<0&&Number.isFinite(p.h)),'Corner objects must remain in the intended quadrant');
      assert.deepEqual(s.oldNorthWestProps,[],'Boundary books and crayon trays must leave the reserved clock corner');
      const lower=s.lowerLeftCluster;
      assert.ok(lower&&lower.x<-s.play*.4&&lower.z>0,'The lower-left red frame receives a separate desktop grouping');
      const lowerKinds=new Set(lower.props.map(p=>p.kind));
      for(const kind of ['pencil-tin','wooden-ruler','yo-yo','eraser'])assert.ok(lowerKinds.has(kind),'Missing lower-left object: '+kind);
      assert.ok(lower.props.every(p=>p.x<0&&p.z>0&&Number.isFinite(p.h)),'The added lower grouping stays in the intended quadrant');
    }
  }
  const first=await page.evaluate(()=>desktopState());checkStage(first);report.stages.push(first);
  assert.equal(first.stage,1,'Start the desktop review in the first area');
  const kinds=new Set(first.surfaces.map(s=>s.kind));
  for(const kind of ['cloth','notebook','loose-paper','sketchbook'])assert.ok(kinds.has(kind),'Missing desktop material: '+kind);
  assert.ok(!kinds.has('spread'),'The repeated spread ground tiles must be removed');
  assert.ok(first.woodFraction>.35,'The desktop needs substantial exposed wood between its objects');
  await shot('desktop-phone-start','390 x 844, unchanged gameplay camera at the actual starting point.');

  report.decorViews=await page.evaluate(()=>{
    const r=app.run,t=r.terrain;
    window.desktopClearNear=(x,z)=>{
      for(let radius=0;radius<=16;radius+=1)for(let i=0;i<24;i++){
        const a=i/24*Math.PI*2,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;
        if(t.inBounds(xx,zz,1.5)&&t.isFlatOpen(xx,zz)&&!t.hitProp(xx,t.height(xx,zz)+.3,zz,1.2))return {x:xx,z:zz};
      }
      throw Error('No clear gameplay viewpoint near desktop decoration');
    };
    const strand=t.workshopForegroundLights.strands[0],bulb=strand.bulbs[Math.floor(strand.bulbs.length/2)],corner=t.workshopLayout.cornerCluster;
    const foreground=desktopClearNear(bulb.center[0],bulb.center[2]-1.5);
    const northWest=desktopClearNear(corner.x,corner.z+12),lower=t.workshopLayout.lowerLeftCluster;
    const lowerLeft=desktopClearNear(lower.x,lower.z+14);
    return {foreground,northWest,lowerLeft,trackedBulb:bulb};
  });
  report.foreground=await page.evaluate(()=>{
    const r=app.run,f=r.terrain.workshopForegroundLights;
    window.desktopForegroundAt=(x,z)=>{desktopPlace(x,z);desktopFrame();return {...desktopForegroundState(),position:{x,z}};};
    window.desktopBulbProjection=()=>{
      const c=app.r.camera,b=app.run.terrain.workshopForegroundLights.strands[0].bulbs[Math.floor(app.run.terrain.workshopForegroundLights.strands[0].bulbs.length/2)];
      c.updateMatrixWorld(true);
      const center=app.run.player.pos.clone().set(...b.center),point=center.clone().project(c);
      const edge=center.clone().add(app.run.player.pos.clone().set(b.radius,0,0).applyQuaternion(c.quaternion)).project(c);
      return {center:b.center,radius:b.radius,ndc:point.toArray(),diameterNdc:Math.abs(edge.x-point.x)*2};
    };
    const immutable=desktopForegroundState().immutable,routes=[];
    for(const strand of f.strands){
      const samples=[];
      for(const fraction of [.15,.5,.85]){
        const point=strand.points[Math.round(fraction*(strand.points.length-1))];
        const state=desktopForegroundAt(point[0],point[2]);
        samples.push({fraction,point,strand:state.strands.find(s=>s.id===strand.id)});
      }
      routes.push({id:strand.id,samples});
    }
    const upper=f.strands[0],middle=upper.points[Math.floor(upper.points.length/2)],fade=[];
    for(const distance of [0,24,32,45])fade.push({distance,...desktopForegroundAt(middle[0],middle[2]-distance)});
    const far=desktopForegroundAt(0,r.terrain.play*.88);
    const near=desktopForegroundAt(middle[0],middle[2]-1.5),stationaryA=desktopForegroundState();
    for(let i=0;i<90;i++)r.renderWorld(1/60);
    const stationaryB=desktopForegroundState();
    return {immutable,routes,fade,far,near,stationaryA,stationaryB,cost:near.metrics};
  });
  const fg=report.foreground;
  assert.ok(fg.routes.every(route=>route.samples.every(s=>s.strand.opacity>.9)),'Both full-width green routes activate along their length');
  assert.ok(fg.fade[0].opacity>.9&&fg.fade[1].opacity<fg.fade[0].opacity&&fg.fade[1].opacity>fg.fade[2].opacity&&fg.fade[2].opacity>0,'Leaving the route fades the fixed cable spatially');
  assert.ok(!fg.fade.at(-1).visible&&!fg.far.visible,'Away from both corridors no cable is drawn');
  assert.deepEqual(fg.immutable,fg.stationaryB.immutable,'Player travel must never translate the anchored geometry');
  assert.deepEqual(fg.stationaryA.immutable,fg.stationaryB.immutable,'A stopped player cannot make the cable sway');
  assert.equal(fg.stationaryA.opacity,fg.stationaryB.opacity,'A stopped player cannot make the cable blink');
  await page.evaluate(()=>desktopForegroundAt(0,app.run.terrain.play*.88));
  await shot('desktop-anchored-away-hidden','390 x 844 gameplay camera, away from both fixed routes.');
  await page.evaluate(p=>desktopForegroundAt(p.x,p.z),report.decorViews.foreground);

  async function paintedEvidence(name,description){
    await page.evaluate(()=>desktopFrame());
    const projection=await page.evaluate(()=>desktopBulbProjection()),state=await page.evaluate(()=>desktopForegroundState());
    const on=await page.screenshot({path:path.join(dir,name+'.png')});
    report.screens.push({name,description});
    await page.evaluate(()=>{
      for(const m of app.run.terrain.workshopForegroundLights.meshes)m.visible=false;
      app.r.renderer.resetState();app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);
    });
    const off=await page.screenshot();
    const [a,b]=await Promise.all([on,off].map(buffer=>sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true})));
    const width=a.info.width,height=a.info.height,px=(projection.ndc[0]+1)*width/2,py=(1-projection.ndc[1])*height/2;
    const radius=Math.max(7,projection.diameterNdc*width*.7);
    let changed=0,nearBulb=0,minX=width,minY=height,maxX=-1,maxY=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*3,delta=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);
      if(delta>12){changed++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(Math.abs(x-px)<radius&&Math.abs(y-py)<radius)nearBulb++;}
    }
    await page.evaluate(()=>desktopFrame());
    assert.ok(changed>50&&changed<width*height*.15,'Only the thin wire and bulbs should change the rendered picture');
    assert.ok(px>0&&px<width&&py>0&&py<height&&nearBulb>8,'The same fixed bulb must render at its true projected world position');
    return {projection,state,pixels:{width,height,changed,nearBulb,px,py,diameter:projection.diameterNdc*width/2,minX,minY,maxX,maxY}};
  }
  fg.trackingA=await paintedEvidence('desktop-anchored-camera-a','390 x 844, original gameplay camera looking at the middle bulb of the upper world route.');
  await page.evaluate(p=>desktopForegroundAt(p.x+4,p.z),report.decorViews.foreground);
  fg.trackingB=await paintedEvidence('desktop-anchored-camera-b','390 x 844, player moved four world units: the same bulb remains anchored in the room.');
  assert.deepEqual(fg.trackingA.state.immutable,fg.trackingB.state.immutable,'Player/camera motion cannot rewrite fixed world vertices or transforms');
  assert.deepEqual(fg.trackingA.projection.center,fg.trackingB.projection.center,'The tracked bulb must keep the same world centre');
  assert.ok(Math.abs(fg.trackingA.pixels.px-fg.trackingB.pixels.px)>20,'A fixed bulb must show real parallax when the player moves');

  fg.cameraOnly=await page.evaluate(()=>{
    const r=app.run,c=app.r.camera,before=desktopForegroundState(),projectionA=desktopBulbProjection();
    c.position.x+=3;c.updateMatrixWorld(true);r.renderWorld(0);
    const translated=desktopForegroundState(),projectionB=desktopBulbProjection();
    const bulb=r.player.pos.clone().set(...projectionA.center),oldDistance=c.position.distanceTo(bulb);
    c.position.lerp(bulb,.25);c.updateMatrixWorld(true);r.renderWorld(0);
    const closer=desktopForegroundState(),projectionC=desktopBulbProjection();
    desktopFrame();return {before,translated,closer,projectionA,projectionB,projectionC,oldDistance};
  });
  assert.deepEqual(fg.cameraOnly.before.immutable,fg.cameraOnly.translated.immutable);
  assert.deepEqual(fg.cameraOnly.before.immutable,fg.cameraOnly.closer.immutable);
  assert.ok(Math.abs(fg.cameraOnly.projectionA.ndc[0]-fg.cameraOnly.projectionB.ndc[0])>.03,'Camera-only translation must change world projection');
  assert.ok(fg.cameraOnly.projectionC.diameterNdc>fg.cameraOnly.projectionB.diameterNdc*1.2,'The original world-sized bulb grows naturally when the camera approaches');

  fg.viewports=[];
  for(const [width,height] of [[320,568],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(p=>{window.dispatchEvent(new Event('resize'));desktopForegroundAt(p.x,p.z);},report.decorViews.foreground);
    const evidence=await paintedEvidence('desktop-anchored-'+width,'Original gameplay lens at '+width+' px width; physical-size bulbs follow perspective.');
    assert.ok(evidence.state.visible&&evidence.pixels.diameter>6&&evidence.pixels.diameter<40,'Bulbs retain scene-scale dimensions instead of shrinking into HUD dots');
    fg.viewports.push({width,height,...evidence});
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  fg.guards=await page.evaluate(p=>{
    window.dispatchEvent(new Event('resize'));desktopForegroundAt(p.x,p.z);
    const r=app.run,state=r.state;
    r.state='over';r.renderWorld(0);const menu=desktopForegroundState();r.state=state;
    desktopFrame();const recovered=desktopForegroundState();
    const groupVisible=r.terrain.group.visible;r.terrain.group.visible=false;r.renderWorld(0);const hiddenOwner=desktopForegroundState();r.terrain.group.visible=groupVisible;
    desktopFrame();return {menu,recovered,hiddenOwner};
  },report.decorViews.foreground);
  for(const key of ['menu','hiddenOwner'])assert.ok(!fg.guards[key].visible&&fg.guards[key].opacity===0,'Anchored artwork must hide for '+key);
  assert.ok(fg.guards.recovered.visible,'Anchored artwork returns when gameplay resumes');
  await page.evaluate(p=>desktopPlace(p.x,p.z),report.decorViews.northWest);
  await shot('desktop-northwest-gameplay','390 x 844, unchanged gameplay camera beside the north-west alarm clock.');
  await page.evaluate(p=>desktopPlace(p.x,p.z),report.decorViews.lowerLeft);
  await shot('desktop-lower-left-gameplay','390 x 844, unchanged gameplay camera beside the added lower-left stationery grouping.');

  report.walks=[];
  for(const kind of ['notebook','sketchbook']){
    const result=await page.evaluate(kind=>{
      const r=app.run,t=r.terrain,p=r.player,lane=desktopFindLane(kind),dt=1/60;
      window.desktopLastLane=lane;desktopPlace(lane.outer.x,lane.outer.z);
      const runPlayerLeg=target=>{
        const start={x:p.pos.x,z:p.pos.z},length=Math.hypot(target.x-start.x,target.z-start.z);
        const dx=(target.x-start.x)/length,dz=(target.z-start.z)/length;
        // These are the game's real touch-stick axes. Invert the same yaw
        // transform used by Player.update; do not replace movement/collision.
        r.input.stickX=Math.cos(r.camYaw)*dx-Math.sin(r.camYaw)*dz;
        r.input.stickY=-Math.sin(r.camYaw)*dx-Math.cos(r.camYaw)*dz;
        let frames=0,maxGroundError=0,minY=Infinity,maxY=-Infinity;
        while(frames<720&&((p.pos.x-start.x)*dx+(p.pos.z-start.z)*dz)<length-.12){
          r.realDt=dt;p.update(dt);r.input.endFrame();frames++;
          maxGroundError=Math.max(maxGroundError,Math.abs(p.pos.y-t.height(p.pos.x,p.pos.z)));
          minY=Math.min(minY,p.pos.y);maxY=Math.max(maxY,p.pos.y);
        }
        r.input.stickX=r.input.stickY=0;
        return {frames,maxGroundError,minY,maxY,end:{x:p.pos.x,y:p.pos.y,z:p.pos.z},distance:Math.hypot(p.pos.x-target.x,p.pos.z-target.z)};
      };
      const playerUp=runPlayerLeg(lane.inner),playerDown=runPlayerLeg(lane.outer);
      r.enemies.clear();
      const e=r.enemies,index=e.spawn(r.director.cards[0].id,lane.outer.x,lane.outer.z,1,1,0);
      if(index<0)throw Error('Could not spawn the traversal enemy');
      // Exercise the ordinary grounded pursuit branch, without species-specific
      // flight, ranged retreat or charges obscuring the ground transition.
      e.flags[index]=0;e.atk[index]=999;e.dmg[index]=0;
      const runEnemyLeg=(target,direction)=>{
        const start={x:e.x[index],z:e.z[index]},length=Math.hypot(target.x-start.x,target.z-start.z);
        const dx=(target.x-start.x)/length,dz=(target.z-start.z)/length;
        desktopPlace(target.x+lane.out.x*direction*3,target.z+lane.out.z*direction*3);
        let frames=0,maxGroundError=0,minY=Infinity,maxY=-Infinity,airborne=false;
        while(frames<720&&((e.x[index]-start.x)*dx+(e.z[index]-start.z)*dz)<length-.12){
          r.realDt=dt;e.update(dt);frames++;
          maxGroundError=Math.max(maxGroundError,Math.abs(e.y[index]-t.height(e.x[index],e.z[index])));
          minY=Math.min(minY,e.y[index]);maxY=Math.max(maxY,e.y[index]);airborne ||= !!e.air[index];
        }
        return {frames,maxGroundError,minY,maxY,airborne,end:{x:e.x[index],y:e.y[index],z:e.z[index]},distance:Math.hypot(e.x[index]-target.x,e.z[index]-target.z)};
      };
      const enemyUp=runEnemyLeg(lane.inner,-1),enemyDown=runEnemyLeg(lane.outer,1);
      r.enemies.clear();desktopPlace(lane.inner.x,lane.inner.z);
      return {kind,lane,playerUp,playerDown,enemyUp,enemyDown};
    },kind);
    for(const leg of ['playerUp','playerDown','enemyUp','enemyDown']){
      const s=result[leg];assert.ok(s.distance<.35,`${kind} ${leg}: actor must cross the edge and reach its destination`);
      assert.ok(s.maxGroundError<.002,`${kind} ${leg}: actor must remain on the visible surface`);
      assert.ok(s.maxY-s.minY>.035,`${kind} ${leg}: exercise an actual height change`);
      if(leg.startsWith('enemy'))assert.equal(s.airborne,false,'Thin stationery should not force enemies to jump');
    }
    report.walks.push(result);
    await shot('desktop-'+kind+'-crossing','390 x 844, gameplay camera after real movement onto '+kind+'.');
  }

  // Exercise a raised marble position even if the authored loose marbles happen
  // to start on bare wood. Its real renderWorld path supplies the matrix height.
  report.raisedMarble=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,m=t.workshopLooseMarbles[0],saved={...m},lane=desktopLastLane;
    m.x=lane.inner.x;m.z=lane.inner.z;m.vx=m.vz=0;r.renderWorld(0);
    const result={ground:t.height(m.x,m.z),radius:m.r,renderY:t.workshopLooseMesh.instanceMatrix.array[13]};
    Object.assign(m,saved);r.renderWorld(0);return result;
  });
  assert.ok(report.raisedMarble.ground>.1&&Math.abs(report.raisedMarble.renderY-report.raisedMarble.ground-report.raisedMarble.radius)<.002);

  await page.setViewport({width:720,height:760,deviceScaleFactor:1});
  report.alarmClockView=await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));const r=app.run,t=r.terrain,c=app.r.camera;
    const clock=t.zxProps.find(p=>p.kind==='boundary-alarm-clock'),distance=65,pitch=.32,angle=clock.angle||0;
    const focus={x:clock.x,y:14,z:clock.z};window.desktopDetailNear=c.near;c.near=.75;c.updateProjectionMatrix();
    c.position.set(focus.x+Math.sin(angle)*Math.cos(pitch)*distance,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(angle)*Math.cos(pitch)*distance);
    c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
    app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);for(let i=0;i<3;i++)app.r.render(0);
    return {width:720,height:760,distance,pitch,angle,focus,staged:true};
  });
  await page.screenshot({path:path.join(dir,'desktop-alarm-clock-staged.png')});
  report.screens.push({name:'desktop-alarm-clock-staged',description:'720 x 760 staged close-up of the clock, facing its authored diagonal front; distance 65. This is not the gameplay camera.'});
  report.clockCornerView=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,c=app.r.camera,distance=90,pitch=.85,angle=.3;
    const focus={x:-t.play*.77,y:8,z:-t.play*.79};
    c.position.set(focus.x+Math.sin(angle)*Math.cos(pitch)*distance,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(angle)*Math.cos(pitch)*distance);
    c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
    app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);for(let i=0;i<3;i++)app.r.render(0);
    return {width:720,height:760,distance,pitch,angle,focus,staged:true};
  });
  await page.screenshot({path:path.join(dir,'desktop-clock-corner-staged.png')});
  report.screens.push({name:'desktop-clock-corner-staged',description:'720 x 760 staged corner view: clock plus small spool, binder clips, handheld and loose stationery; distance 90. This is not the gameplay camera.'});
  report.lowerLeftView=await page.evaluate(()=>{
    const r=app.run,t=r.terrain,c=app.r.camera,cluster=t.workshopLayout.lowerLeftCluster,distance=52,pitch=.85;
    const focus={x:cluster.x,y:1.5,z:cluster.z};
    c.position.set(focus.x,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(pitch)*distance);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
    app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);for(let i=0;i<3;i++)app.r.render(0);
    return {width:720,height:760,distance,pitch,focus,staged:true};
  });
  await page.screenshot({path:path.join(dir,'desktop-lower-left-staged.png')});
  report.screens.push({name:'desktop-lower-left-staged',description:'720 x 760 staged medium-distance view of the lower-left pencil tin, ruler and loose stationery; distance 52.'});
  await page.evaluate(()=>{app.r.camera.near=desktopDetailNear;app.r.camera.updateProjectionMatrix();});

  await page.setViewport({width:640,height:760,deviceScaleFactor:1});
  await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));const r=app.run,t=r.terrain;
    const s=t.workshopGroundSurfaces.find(s=>s.kind==='loose-paper'),c=app.r.camera,distance=62,pitch=.8;
    desktopPlace(s.x,s.z);const focus={x:s.x,y:s.y,z:s.z};
    c.position.set(focus.x,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(pitch)*distance);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
    app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);for(let i=0;i<3;i++)app.r.render(0);
  });
  await page.screenshot({path:path.join(dir,'desktop-paper-closeup.png')});
  report.screens.push({name:'desktop-paper-closeup',description:'640 x 760 staged scene camera, distance 62; inspect loose-paper layering and surrounding exposed wood.'});
  await page.setViewport({width:1200,height:760,deviceScaleFactor:1});
  report.overview=await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));const r=app.run,c=app.r.camera,distance=235,pitch=.95,focus={x:0,y:8,z:-12};
    window.desktopSavedNear=c.near;c.near=2;c.updateProjectionMatrix();
    c.position.set(focus.x,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(pitch)*distance);c.lookAt(focus.x,focus.y,focus.z);c.updateMatrixWorld(true);
    r.terrain.workshopForegroundLights.debugShowAll=true;
    app.r.renderer.resetState();r.renderWorld(0);r.vfx.update(0);for(let i=0;i<3;i++)app.r.render(0);
    return {width:1200,height:760,distance,pitch,near:c.near,focus,staged:true,foreground:desktopForegroundState()};
  });
  assert.equal(report.overview.foreground.activeIds.length,2,'The explicit QA overview reveals both fixed green-line routes');
  await page.screenshot({path:path.join(dir,'desktop-overview-staged-near2.png')});
  report.screens.push({name:'desktop-overview-staged-near2',description:'1200 x 760 staged overview with both fixed light routes explicitly revealed for inspection; normal play still uses proximity visibility.'});
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>{app.run.terrain.workshopForegroundLights.debugShowAll=false;app.r.camera.near=desktopSavedNear;app.r.camera.updateProjectionMatrix();window.dispatchEvent(new Event('resize'));});
  report.foregroundDisposal=[];
  for(let stage=2;stage<=4;stage++){
    await page.evaluate(()=>{
      const f=app.run.terrain.workshopForegroundLights;window.desktopOutgoingForeground=f;
      window.desktopDisposeEvents=[];
      for(const kind of ['geometries','materials','textures'])for(const resource of f[kind]){
        const event={kind,disposed:false};desktopDisposeEvents.push(event);resource.addEventListener('dispose',()=>{event.disposed=true;});
      }
    });
    await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.halted=true;});
    await page.waitForFunction(stage=>app.run.stage===stage&&app.run.state==='play',{timeout:90000},stage);
    await page.evaluate(async()=>{await desktopPrepare();desktopFrame();});
    const cleanup=await page.evaluate(()=>({disposed:desktopOutgoingForeground.disposed,detached:desktopOutgoingForeground.meshes.every(m=>m.parent===null),events:desktopDisposeEvents}));
    assert.ok(cleanup.disposed&&cleanup.detached&&cleanup.events.every(e=>e.disposed),'Area changes must dispose all outgoing impostor GPU resources');
    report.foregroundDisposal.push({stage,...cleanup});
    const s=await page.evaluate(()=>desktopState());checkStage(s);report.stages.push(s);
  }
  fs.writeFileSync(path.join(dir,'desktop-layout-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Desktop verified: two lightweight fixed-world light routes, original scale, real projection/parallax pixel evidence, proximity fading and cleanup, ground traversal and four areas.');
}
