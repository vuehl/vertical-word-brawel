import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import surround from '../../resources/public/config/desk-exterior.json' with {type:'json'};

export async function verifyDeskExterior(page,dir){
  await page.evaluate(()=>{app.halted=true;});
  // Samples from the original desk_map2, the updated toy0 sprite, and the
  // registered exterior master. Project them through the actual battle camera.
  const probes={
    northwest:[[-150,150,[47,47,54]],[150,150,[47,47,54]]],
    curtain:[[-350,1370,[47,47,54]],[-350,1470,[47,47,54]]],
    leftSeam:[[-150,1414,[98,92,89]],[-150,1430,[98,92,89]],[-150,1460,[98,92,89]]],
    rightSeam:[[5144,900,[51,50,55]],[5144,980,[51,50,55]],[5144,1080,[51,50,55]],
      // The translucent inner edge blends with the wall above and wood below.
      [5139,900,[65,60,62]],[5139,980,[54,53,56]],[5139,1080,[54,53,56]]],
    cat:[[4740,-100,[248,242,235]],[4780,115,[236,136,152]],[4768,170,[213,80,102]]],
    rear:[[4450,-6,[123,113,110]],[4450,3,[123,113,110]],[4450,30,[225,215,203]]],
    toy3:[[2690,126,[192,125,185]],[2815,180,[84,66,84]],[2790,290,[255,217,213]],
      [2740,400,[97,73,101]],[2750,72,[225,215,203]]],
    north:[[2210,403,[132,122,115]],[2210,428,[132,122,115]],[2210,449,[132,122,115]]],
    // One cable disappears behind the fascia; the box and spray bottle sit in front.
    shelf:[[3260,316,[202,189,174]],[3279,341,[42,46,54]],[3670,388,[132,122,115]],
      [3670,420,[107,45,56]],[3670,500,[206,206,204]]],
    west:[[24,2200,[104,97,90]],[36,2200,[157,141,113]],[48,2200,[198,174,132]],[66,2200,[205,180,138]]],
  };
  const views=[
    ['north',2571,600],['cat',4910,650],['rear',4520,750],['east',5070,2100],['south',2571,3740],
    ['west',70,2200],['southwest',70,3740],['southeast',5070,3740],['northwest',70,70],['curtain',20,1420],
    ['leftSeam',20,1400],['rightSeam',5050,1200],
    ['cup',1000,600],['toy3',2815,690],['shelf',3500,800],['wide',5070,3740,2.2],['tall',2571,3740,.30],['centre',2571,1902],
  ];
  for(const [name,x,y,aspect] of views){
    const {leaks,changed,outsideWalkable,samples,glass,png}=await page.evaluate(({name,x,y,aspect,points})=>{
      const r=app.run,t=r.terrain,host=r.r,renderer=host.renderer,camera=host.camera;
      const {width,height}=window.deskArtSize;
      r.player.pos.set((2*x/width-1)*t.deskBounds.x,0,(2*y/height-1)*t.deskBounds.z);
      camera.aspect=aspect??390/844;r.updateCamera(0);r.renderWorld(0);
      host.scene.updateMatrixWorld(true);camera.updateMatrixWorld();
      const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
      renderer.setRenderTarget(null);renderer.autoClear=true;
      const pixels=color=>{
        renderer.setClearColor(color,1);renderer.render(t.group,camera);
        const buffer=new Uint8Array(w*h*4);
        gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buffer);return buffer;
      };
      const a=pixels(0xff00ff),b=pixels(0x00ff00);
      function rgbAt(bytes,px,py){
        const q=t.spawn.clone().set((2*px/width-1)*t.deskBounds.x,-.05,(2*py/height-1)*t.deskBounds.z).project(camera);
        if(Math.abs(q.x)>=1||Math.abs(q.y)>=1)throw Error(name+' sample outside view: '+px+','+py);
        const offset=4*(Math.floor((q.y+1)*h/2)*w+Math.floor((q.x+1)*w/2));
        return [...bytes.subarray(offset,offset+3)];
      }
      const samples=points.map(([px,py])=>rgbAt(a,px,py));
      let glass;
      if(name==='cup'){
        const [mat]=t.deskFadeMaterials.cup,old=mat.opacity;
        glass=[0,.5,1].map(opacity=>{
          mat.opacity=opacity;
          return rgbAt(pixels(0xff00ff),932,659);
        });
        mat.opacity=old;
      }
      const surround=t.group.children.filter(tile=>tile.name==='desk2d/exterior'&&tile.visible);
      for(const tile of surround)tile.visible=false;
      const bare=pixels(0xff00ff);
      for(const tile of surround)tile.visible=true;
      let leaks=0,changed=0;
      for(let i=0;i<a.length;i+=4){
        if(Math.abs(a[i]-b[i])>1||Math.abs(a[i+1]-b[i+1])>1)leaks++;
        if(Math.abs(a[i]-bare[i])>2||Math.abs(a[i+1]-bare[i+1])>2)changed++;
      }
      let png;
      if(!aspect&&name!=='centre'){
        host.render(0);
        png=gl.canvas.toDataURL('image/png').split(',')[1];
      }
      return {leaks,changed,outsideWalkable:t.inBounds(t.deskBounds.x+1,0),samples,glass,png};
    },{name,x,y,aspect,points:probes[name]??[]});
    if(png)await fs.writeFile(path.join(dir,'desk-exterior-'+name+'.png'),Buffer.from(png,'base64'));
    assert.equal(leaks,0,'Clear colour visible at '+name);
    assert.equal(outsideWalkable,false);
    if(glass){
      const [empty,half,full]=glass;
      assert.ok(empty.every((v,c)=>Math.abs(v-[47,47,54][c])<=3),'Cup left ink on the wall: '+empty);
      assert.ok(full.every((v,c)=>Math.abs(v-[80,74,74][c])<=4),'Foreground glass was tinted by the exterior: '+full);
      assert.ok(half.every((v,c)=>v>empty[c]+8&&v<full[c]-8),'Painted glass must fade with the prop: '+half);
    }
    for(const [i,actual] of samples.entries()){
      const [px,py,expected]=probes[name][i];
      // A projected phone pixel spans about three canvas pixels on the ramp.
      const tolerance=name==='west'||name==='north'?12:6;
      assert.ok(actual.length===3&&actual.every((v,c)=>Math.abs(v-expected[c])<=tolerance),
        name+' ('+px+','+py+') expected '+expected+', rendered '+actual);
    }
    assert.ok(name==='centre'?changed===0:changed>1000,'Unexpected exterior coverage at '+name+': '+changed);
    console.log('Desk exterior',name,{leaks,changed});
  }
  const overview=await page.evaluate(([left,top,right,bottom])=>{
    const r=app.run,t=r.terrain,host=r.r,renderer=host.renderer,cam=host.camera;
    const {width,height}=window.deskArtSize;
    const centre=t.spawn.clone().set(((left+right)/width-1)*t.deskBounds.x,-.05,((top+bottom)/height-1)*t.deskBounds.z);
    const w=(right-left)*t.deskBounds.x/width,h=w*(bottom-top)/(right-left);
    const direction=cam.getWorldDirection(t.spawn.clone());
    cam.position.copy(centre).addScaledVector(direction,-100);cam.lookAt(centre);
    cam.projectionMatrix.makeOrthographic(-w,w,h,-h,cam.near,cam.far,cam.coordinateSystem);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.updateMatrixWorld();renderer.setSize(1080,Math.round(1080*h/w),false);
    for(const sheet of t.deskExteriorSheets)sheet.visible=true;
    renderer.render(t.group,cam);
    return renderer.getContext().canvas.toDataURL('image/png').split(',')[1];
  },surround.bounds);
  await fs.writeFile(path.join(dir,'desk-exterior-overview.png'),Buffer.from(overview,'base64'));
}
