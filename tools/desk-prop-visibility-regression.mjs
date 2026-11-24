import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import contours from '../source/src/desk-fade-contours.json' with {type:'json'};

export async function verifyDeskVisibility(page,dir){
  const report=await page.evaluate(async outlines=>{
    await app.meta.load(await app.backend.guest());
    await app.startRun({species:4,biome:'forest',tier:0,boosts:[],mode:'standard'});
    app.halted=true;
    const r=app.run,t=r.terrain,host=r.r,renderer=host.renderer,cam=host.camera,p=r.player.pos;
    const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    const {width,height}=window.deskArtSize;
    const ppu=width/(2*t.deskBounds.x),pxZ=height/(2*t.deskBounds.z);
    const world=(x,y)=>p.clone().set((x-width/2)/ppu,0,(y-height/2)/pxZ);
    const pose=(x,y)=>{p.copy(world(x,y));r.camTarget.copy(p);r.updateCamera(0);r.renderWorld(0);};
    const opacity=kind=>t.group.children.find(m=>m.name==='desk2d/'+kind).material.opacity;
    const test={},frames={};
    pose(1820,1320);
    const srcPerPx=2*ppu/(cam.projectionMatrix.elements[5]*host.canvas.clientHeight);
    const id=r.enemies.spawn(19,p.x,p.z,100,1);
    if(id<0)throw Error('Test enemy could not spawn');
    for(const [kind,pts] of Object.entries(outlines)){
      const [x,y]=pts.reduce((a,b)=>b[0]>a[0]?b:a);
      const result=[];
      for(const gap of [5.1,5,4.9,0]){
        pose(x+r.player.radius*ppu+gap*srcPerPx,y);result.push(opacity(kind));
      }
      host.render(0);frames[kind]=gl.canvas.toDataURL().split(',')[1];
      const atEdge=world(x,y);r.enemies.x[id]=atEdge.x;r.enemies.z[id]=atEdge.z;
      pose(1820,1320);result.push(opacity(kind));
      const ally=r.allies.make(19,atEdge.x,0,atEdge.z);r.allies.list.push(ally);
      r.enemies.x[id]=p.x;r.enemies.z[id]=p.z;
      r.renderWorld(0);result.push(opacity(kind));
      r.allies.list.pop();r.renderWorld(0);result.push(opacity(kind));test[kind]=result;
    }
    const sample=r.interactables.list.find(f=>f.kind==='chest'&&!f.data?.gift);
    await sample.modelReady;
    const oldClear=renderer.getClearColor(host.shared.uFogColor.value.clone()),alpha=renderer.getClearAlpha();
    const target=renderer.getRenderTarget(),auto=renderer.autoClear;
    function brightness(mesh,active){
      r.sprites.setShelfDepth(active?t.shelfDepth:null);
      renderer.setClearColor(0,1);renderer.render(mesh,cam);
      const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let light=0;for(let i=0;i<pixels.length;i+=4)light+=pixels[i]+pixels[i+1]+pixels[i+2];
      return light;
    }
    function ratio(mesh){
      const lit=brightness(mesh,false);
      if(lit<500)throw Error('Empty reference for '+mesh.name);
      return brightness(mesh,true)/lit;
    }
    try{
      renderer.autoClear=true;renderer.setRenderTarget(null);
      for(const [name,y] of [['shadow',650],['sun',770]]){
        pose(1940,y);
        sample.x=p.x+3;sample.z=p.z;sample.group.position.set(sample.x,0,sample.z);
        // Follow the sloping shadow edge so all five probes stay on the same side.
        const enemyPos=world(1770,y-33),allyPos=world(1630,y-60);
        r.enemies.x[id]=enemyPos.x;r.enemies.z[id]=enemyPos.z;
        const ally=r.allies.make(19,allyPos.x,0,allyPos.z);r.allies.list.push(ally);
        r.pickups.clear();r.pickups.spawnCoin(p.x-1.2,0,p.z,4);
        r.renderWorld(0);cam.updateMatrixWorld();host.scene.updateMatrixWorld(true);
        const groups=[...r.sprites.glyphGroups.values()].filter(g=>g.count);
        const hero=groups.find(g=>g.source.zxOriginalGlyph);
        const friend=groups.find(g=>g.source.zxAlly);
        const enemy=groups.find(g=>!g.source.zxOriginalGlyph&&!g.source.zxAlly);
        test[name]=[sample.model,r.pickups.pool.mesh,hero.mesh,friend.mesh,enemy.mesh].map(ratio);
        host.render(0);frames['shelf-'+name]=gl.canvas.toDataURL().split(',')[1];
        r.allies.list.pop();
      }
    }finally{
      r.sprites.setShelfDepth(t.shelfDepth);renderer.setClearColor(oldClear,alpha);
      renderer.setRenderTarget(target);renderer.autoClear=auto;
    }
    return {test,frames,gl:gl.getError()};
  },contours);
  for(const [name,png] of Object.entries(report.frames))await writeFile(path.join(dir,name+'.png'),Buffer.from(png,'base64'));
  console.log('Desk opacity and framebuffer light ratios',report.test);
  assert.equal(report.gl,0);
  for(const name of ['cup','zhi'])assert.deepEqual(report.test[name],[1,.5,.5,.5,1,1,1]);
  assert.ok(report.test.shadow.every(x=>x>.1&&x<.95)&&report.test.sun.every(x=>Math.abs(x-1)<.001));
}
