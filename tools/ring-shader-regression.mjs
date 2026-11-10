import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ringEmptyPixels,ringStripPosition,ringSquareClip} from '../source/src/ring-shader.js';

export async function reviewRingShader(page,dir){
  const report=await page.evaluate(({snippet,strip,clip})=>{
    const run=app.run,r=app.r,renderer=r.renderer,rings=run.vfx.rings,material=rings.mesh.material;
    const optimized=material.fragmentShader;
    if(!optimized.includes(snippet))throw Error('Compiled ring optimization missing');
    const reference=optimized.replace(snippet,'').replace(clip,''),camera=r.camera.clone(),saved=[];
    const geometry=rings.mesh.geometry,vertex=material.vertexShader;
    const plane=new geometry.constructor(1,1).rotateX(-Math.PI/2);
    for(const key of ['iA','iB','iC'])plane.setAttribute(key,geometry.getAttribute(key));
    const referenceVertex=vertex.replace(strip,'float ext = (iA.w + iC.x * 4.0) * 2.0; vP = vec2(position.x, position.z) * ext;');
    if(referenceVertex===vertex)throw Error('Compiled annular ring geometry missing');
    r.scene.traverse(o=>{if(o.isMesh){saved.push([o,o.visible]);o.visible=false;}});
    renderer.setPixelRatio(1);renderer.setSize(256,256,false);renderer.setRenderTarget(null);
    renderer.setScissorTest(false);renderer.setViewport(0,0,256,256);renderer.setClearColor(0x101820,1);
    camera.aspect=1;camera.fov=70;camera.zoom=1;camera.clearViewOffset();camera.up.set(0,0,-1);camera.near=.01;camera.far=5000;
    const pixels=()=>{const gl=renderer.getContext(),data=new Uint8Array(256*256*4);gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
    const draw=()=>{renderer.clear(true,true,true);renderer.render(r.scene,camera);};
    const cases=[],coverage=[],images=[];
    try{
      for(const [radius,thickness] of [[.1,.5],[2,.4],[12,.3],[30,.05]])for(let style=0;style<7;style++){
        const p=run.player.pos;camera.position.set(p.x,Math.max(1,(radius+4*thickness)*3),p.z);camera.lookAt(p.x,0,p.z);camera.updateProjectionMatrix();
        rings.clear();rings.spawn(p.x,.1,p.z,radius,radius,0xff8844,1,style,thickness,1,true);rings.rot[0]=.37;rings.update(.1);
        rings.mesh.geometry=plane;material.vertexShader=referenceVertex;material.fragmentShader=reference;material.needsUpdate=true;draw();const before=pixels();
        if(radius===12&&style===0)images.push({name:'ring-before',data:renderer.domElement.toDataURL()});
        rings.mesh.geometry=geometry;material.vertexShader=vertex;material.fragmentShader=optimized;material.needsUpdate=true;draw();const after=pixels();
        if(radius===12&&style===0)images.push({name:'ring-after',data:renderer.domElement.toDataURL()});
        let changed=0,visiblePixels=0,maxDelta=0,strongPixels=0,missingSilhouette=0;
        for(let i=0;i<after.length;i++)if(before[i]!==after[i]){changed++;maxDelta=Math.max(maxDelta,Math.abs(before[i]-after[i]));}
        for(let i=0;i<after.length;i+=4)if(Math.max(...[0,1,2,3].map(k=>Math.abs(before[i+k]-after[i+k])))>2)strongPixels++;
        // Triangle interpolation can move a pixel-art threshold by one pixel.
        // Reject any lost bright ring section beyond that raster tolerance.
        const bright=(data,x,y)=>x>=0&&x<256&&y>=0&&y<256&&data[(y*256+x)*4]>60;
        for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(bright(before,x,y)&&!bright(after,x,y)){
          let found=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)found ||= bright(after,x+dx,y+dy);
          if(!found)missingSilhouette++;
        }
        for(let i=0;i<before.length;i+=4)if(before[i]!==before[0]||before[i+1]!==before[1]||before[i+2]!==before[2])visiblePixels++;
        cases.push({radius,thickness,style,changed,visiblePixels,maxDelta,strongPixels,missingSilhouette});
        if(style===0){
          material.fragmentShader='void main(){gl_FragColor=vec4(1.,0.,1.,1.);}';
          const covered=()=>{const data=pixels();let n=0;for(let i=0;i<data.length;i+=4)if(data[i]===255&&data[i+1]===0&&data[i+2]===255)n++;return n;};
          material.needsUpdate=true;draw();const stripPixels=covered();
          rings.mesh.geometry=plane;material.vertexShader=referenceVertex;material.needsUpdate=true;draw();
          coverage.push({radius,thickness,stripPixels,quadPixels:covered()});
        }
      }
      return {cases,coverage,images,changed:cases.reduce((n,c)=>n+c.changed,0)};
    }finally{rings.mesh.geometry=geometry;material.vertexShader=vertex;material.fragmentShader=optimized;material.needsUpdate=true;plane.dispose();rings.clear();for(const [o,v] of saved)o.visible=v;}
  },{snippet:ringEmptyPixels,strip:ringStripPosition,clip:ringSquareClip});
  for(const image of report.images)fs.writeFileSync(path.join(dir,image.name+'.png'),Buffer.from(image.data.split(',')[1],'base64'));
  delete report.images;
  fs.writeFileSync(path.join(dir,'ring-shader.json'),JSON.stringify(report,null,2));
  assert.ok(report.cases.every(c=>c.missingSilhouette<=(c.thickness<.1?Math.ceil(c.visiblePixels*.01):0)&&c.strongPixels<256*256*.005),'Preserve ring silhouettes; allow isolated subpixel samples only in the deliberately extra-thin .05 stress case');
  assert.ok(report.cases.filter(c=>c.radius>=2).every(c=>c.visiblePixels>0),'Comparison must actually render each ring style');
  assert.ok(report.coverage.filter(c=>c.radius>=12).every(c=>c.stripPixels<c.quadPixels*.8),'Large rings should rasterize at least 20% fewer fragments');
  console.log('Ring shader: '+report.cases.length+' GPU comparisons passed (one-pixel raster tolerance); coverage '+JSON.stringify(report.coverage));
}
