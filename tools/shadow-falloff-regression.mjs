import assert from 'node:assert/strict';
import sharp from 'sharp';

// An isolated receiver/caster fixture uses the game's real paper shader,
// geometry, sun, shadow map and camera. Fixture images are not user artifacts.
export async function reviewShadowFalloff(page){
  const coordinates=await page.evaluate(()=>{
    const run=app.run,t=run.terrain,a=t.paperAssets,r=app.r;
    run.player.pos.set(0,0,5);run.camTarget.copy(run.player.pos);vfxDraw(false);
    const floor=t.group.children.find(m=>m.material===a.mats.get('maple-desktop'));
    const material=floor.material,paper=a.mats.get('notebook-paper'),map=paper.map,visible=[];
    r.scene.traverse(m=>{if(m.isMesh&&m!==floor){visible.push([m,m.visible]);m.visible=false;}});
    floor.material=paper;paper.map=null;paper.needsUpdate=true;
    // A depth-only caster leaves the receiver visible to the original camera,
    // so near samples measure floor shadow rather than the box's front face.
    const casterMaterial=a.mats.get('workshop-plastic').clone();casterMaterial.colorWrite=false;casterMaterial.depthWrite=false;
    const caster=new floor.constructor(a.boxes,casterMaterial,1),transform=t.workshopTransform;
    const V=run.player.pos.constructor,d=new V(50,0,-38).normalize(),side=new V(-d.z,0,d.x);
    const ground=-.12,centre=new V(-3,ground,-3);
    transform.position.copy(centre).y+=4;transform.rotation.set(0,Math.atan2(d.x,d.z),0);transform.scale.set(6,8,4);transform.updateMatrix();
    caster.setMatrixAt(0,transform.matrix);caster.instanceMatrix.needsUpdate=true;caster.castShadow=true;caster.computeBoundingSphere();r.scene.add(caster);
    const points=[];
    function sample(distance,cross=0){
      const world=centre.clone().addScaledVector(d,2+distance).addScaledVector(side,cross);world.y=ground+.001;
      const screen=world.project(r.camera);points.push({distance,cross,x:Math.round((screen.x+1)*390),y:Math.round((1-screen.y)*844)});
    }
    for(const distance of [.2,1.2,2.2,3.2,4.2])sample(distance);
    for(const distance of [.2,4.2])for(let i=0;i<=40;i++)sample(distance,2.2+i*.04);
    window.shadowProbeToggle=on=>{caster.visible=on;r.sun.shadow.needsUpdate=true;r.renderer.resetState();r.render(0);};
    window.shadowProbeRestore=()=>{r.scene.remove(caster);caster.dispose();casterMaterial.dispose();floor.material=material;paper.map=map;paper.needsUpdate=true;visible.forEach(([m,v])=>m.visible=v);r.sun.shadow.needsUpdate=true;};
    shadowProbeToggle(true);return points;
  });
  let shaded,lit;
  try{
    shaded=await page.screenshot();await page.evaluate(()=>shadowProbeToggle(false));lit=await page.screenshot();
  }finally{await page.evaluate(()=>{shadowProbeRestore();delete window.shadowProbeToggle;delete window.shadowProbeRestore;});}
  const read=async f=>sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const [a,b]=await Promise.all([read(shaded),read(lit)]);
  const values=coordinates.map(point=>{
    assert.ok(point.x>2&&point.y>2&&point.x<a.info.width-2&&point.y<a.info.height-2,'The shadow probe must be inside the actual camera');
    let darkening=0;
    for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){
      const p=((point.y+y)*a.info.width+point.x+x)*3;
      darkening+=(b.data[p]-a.data[p])*.2126+(b.data[p+1]-a.data[p+1])*.7152+(b.data[p+2]-a.data[p+2])*.0722;
    }
    return {...point,darkening:darkening/9};
  });
  const core=values.filter(p=>p.cross===0),edges=[];
  for(const distance of [.2,4.2]){
    const strength=core.find(p=>p.distance===distance).darkening;
    const transition=values.filter(p=>p.distance===distance&&p.cross>0&&p.darkening/strength>.15&&p.darkening/strength<.85);
    edges.push({distance,width:transition.length*.04});
  }
  const report={core:core.map(({distance,darkening})=>({distance,darkening})),edges};
  console.log('Distance shadow pixel samples',JSON.stringify(report));
  assert.ok(core[0].darkening>15&&core[0].darkening<65,'Contact shadows should stay visible without becoming dark blue blocks');
  for(let i=1;i<core.length;i++)assert.ok(core[i].darkening<core[i-1].darkening-1,'The same projected shadow must fade continuously with distance');
  assert.ok(core[0].darkening-core.at(-1).darkening>10,'Near and far shadows must have a visible value difference');
  assert.ok(edges[1].width>edges[0].width+.10,'The penumbra must widen away from the caster');
  return report;
}
