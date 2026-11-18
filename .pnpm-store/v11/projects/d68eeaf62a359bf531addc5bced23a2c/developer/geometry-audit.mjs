import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

export async function auditGeometry(page,dir){
  const root=path.resolve(import.meta.dirname,'../..');
  const bundled=await build({bundle:true,platform:'node',format:'cjs',write:false,stdin:{resolveDir:root,contents:`
    import {paperProp} from './source/src/paper-props.js';
    import {paperPropNames} from './source/src/paper-prop-names.js';
    import {createPaperAssets,disposePaperAssets} from './source/src/paper-world.js';
    const triangles=g=>(g.index?.count??g.attributes.position.count)/3;
    export function inspect(){
      const props=paperPropNames.map(name=>{
        const group=paperProp(name);let stored=0,visible=0,meshes=0;
        const geometries=new Set(),materials=new Set();
        group.traverse(m=>{if(!m.geometry)return;stored+=triangles(m.geometry);geometries.add(m.geometry);materials.add(m.material);});
        group.traverseVisible(m=>{if(!m.geometry)return;visible+=triangles(m.geometry);meshes++;});
        for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
        return {name,storedTriangles:stored,visibleTriangles:visible,meshes};
      });
      const assets=createPaperAssets(),primitives=Object.fromEntries(['boxes','planes','cylinders','cones'].map(k=>[k,triangles(assets[k])]));disposePaperAssets(assets);
      return {props,primitives};
    }`},plugins:[{name:'source-three',setup(b){b.onResolve({filter:/assets\/three-[^/]+\.js$/},args=>({path:path.join(root,'source/public/assets',path.basename(args.path))}));}}]});
  const module={exports:{}};new Function('module','exports',bundled.outputFiles[0].text)(module,module.exports);
  const report={basis:'Geometry index count / 3. Scene counts include submitted instances; full-frame counts include post-processing passes, exclude native UI GL draws.',...module.exports.inspect(),scenes:[]};
  for(let stage=1;stage<=4;stage++){
    if(stage>1)await page.evaluate(async()=>{app.run.state='play';await app.run.changeZone();app.run.state='play';});
    const sample=await page.evaluate(()=>{
      const run=app.run;run.renderWorld(0);
      const terrain=run.terrain.group;
      let authored=0,submitted=0,instances=0;
      terrain.traverse(m=>{if(!m.geometry)return;const faces=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;
        const full=m.userData?.paperVisibility?.count??m.userData?.paperCount??m.count??1;
        authored+=faces*full;if(m.visible){submitted+=faces*(m.count??1);instances+=m.count??1;}});
      const info=app.r.renderer.info,auto=info.autoReset;info.autoReset=false;info.reset();app.r.render(0);
      const render={...info.render};info.autoReset=auto;
      const batches=[...run.sprites.batches.values()].filter(b=>b.mesh?.geometry).map(b=>({species:b.sid,triangles:(b.mesh.geometry.index?.count??b.mesh.geometry.attributes.position.count)/3}));
      return {stage:run.stage,worldSubmittedTriangles:submitted,visibleInstances:instances,render,glyphBatches:batches};
    });
    report.scenes.push(sample);
  }
  fs.writeFileSync(path.join(dir,'geometry-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
