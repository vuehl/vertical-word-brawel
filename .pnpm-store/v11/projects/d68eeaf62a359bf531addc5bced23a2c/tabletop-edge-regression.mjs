import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// A subpixel camera move must not swap broad strips of the tabletop between
// two different wood colours. Exercise the real compiled lower map boundary.
export async function reviewTabletopEdge(page,dir){
  const baseline=process.argv.includes('--baseline');
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  const setup=await page.evaluate(()=>{
    window.dispatchEvent(new Event('resize'));deskPrepare();const r=app.run,t=r.terrain;
    // Look between the boundary journals, so the sample covers the actual
    // tabletop rather than the printed lines and silhouette of a book.
    deskPlace(18.5,t.play-5);deskFrame();r.vfx.clear();r.enemies.clear();
    const c=app.r.camera,point=r.player.pos.clone().set(18.5,0,t.workshopBoundary.edge).project(c);
    window.edgeCamera=c.position.clone();
    let coplanarFaces=0;
    t.group.traverse(o=>{
      if(!o.isInstancedMesh||o.geometry.type!=='BoxGeometry')return;
      const matrix=o.matrix.clone();
      for(let i=0;i<o.count;i++){
        o.getMatrixAt(i,matrix);const a=matrix.elements,w=Math.hypot(a[0],a[1],a[2]),h=Math.hypot(a[4],a[5],a[6]);
        if(w>t.play&&Math.abs(a[13]+h/2)<.00001)coplanarFaces++;
      }
    });
    return {stage:r.stage,edge:t.workshopBoundary.edge,coplanarFaces,pixelY:(1-point.y)*422};
  });
  const top=Math.max(0,Math.min(844-120,Math.floor(setup.pixelY-60))),area={left:25,top,width:340,height:120};
  const frames=[],pixels=[];
  for(let i=0;i<16;i++){
    await page.evaluate(i=>{
      const c=app.r.camera;c.position.copy(edgeCamera);c.position.x+=Math.sin(i*2.13)*.003;c.position.z+=Math.cos(i*1.7)*.003;
      c.updateMatrixWorld(true);app.r.renderer.resetState();app.r.render(0);
    },i);
    const frame=await page.screenshot();frames.push(frame);
    pixels.push(await sharp(frame).extract(area).removeAlpha().raw().toBuffer());
  }
  let unstable=0,peak=0;
  for(let p=0;p<pixels[0].length;p+=3){
    let range=0;
    for(let channel=0;channel<3;channel++){
      let min=255,max=0;for(const frame of pixels){min=Math.min(min,frame[p+channel]);max=Math.max(max,frame[p+channel]);}
      range=Math.max(range,max-min);
    }
    peak=Math.max(peak,range);if(range>12)unstable++;
  }
  const report={baseline,environment:'Compiled game, desktop Chrome SwiftShader; tiny camera translations at the lower map edge.',...setup,area,frames:frames.length,unstablePixels:unstable,unstableFraction:unstable/(area.width*area.height),peakChannelRange:peak};
  fs.writeFileSync(path.join(dir,'tabletop-edge-report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(dir,'下边缘.png'),frames[0]);
  const raw=await Promise.all(frames.map(f=>sharp(f).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(raw),{raw:{width:390,height:844*raw.length,channels:4,pageHeight:844}}).gif({delay:Array(raw.length).fill(90),loop:0}).toFile(path.join(dir,'下边缘-微动检查.gif'));
  if(!baseline){assert.equal(report.coplanarFaces,0,'The edge frame must not share the tabletop plane');assert.ok(report.unstableFraction<.01,'Subpixel camera motion must not flash broad wood stripes');}
  console.log('Lower tabletop edge:',JSON.stringify(report));return report;
}
