import assert from 'node:assert/strict';
import path from 'node:path';
import {mapWorldScale,atlasView} from '../../source/src/ui/paper-hud-art.js';

export async function reviewRegionAtlas(page,dir){
  const results=await page.evaluate(({scale,view})=>{
    const run=app.run,ui=run.ui,{art,x,z}=run.terrain.deskAtlas;
    const source=document.createElement('canvas');
    source.width=art.naturalWidth;source.height=art.naturalHeight;
    const ctx=source.getContext('2d');
    ctx.drawImage(art._surface,0,0);
    const expected=ctx.getImageData(0,0,source.width,source.height).data;
    function match(canvas,center,expanded=false){
      const ratio=expanded?Math.max(1,2*scale*Math.max(x/96,z/92)):1;
      const actual=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      let matches=0,samples=0;
      for(let sy=8;sy<source.height;sy+=6)for(let sx=8;sx<source.width;sx+=6){
        const i=4*(sy*source.width+sx);
        // Count opaque, dark landmark pixels so a blank paper/grid cannot pass.
        if(expected[i+3]<250||expected[i]>185)continue;
        const dx=((2*(sx+.5)/source.width-1)*x-center.x)*scale/ratio;
        const dy=((2*(sy+.5)/source.height-1)*z-center.z)*scale/ratio;
        if(!expanded&&Math.hypot(dx,dy)>46)continue;
        const unit=canvas.width/(expanded?view.size:120);
        const u=Math.floor((60+dx-(expanded?view.left:0))*unit);
        const v=Math.floor((58+dy-(expanded?view.top:0))*unit);
        if(u<0||v<0||u>=canvas.width||v>=canvas.height)continue;
        const j=4*(v*canvas.width+u);
        samples++;
        if(actual[j+3]>240&&[0,1,2].every(c=>Math.abs(actual[j+c]-expected[i+c])<10))matches++;
      }
      return {matches,samples};
    }
    run.ui.hideModal();run.state='play';
    const results=[];
    for(const [cx,cz] of [[-x*.35,-z*.35],[x*.2,-z*.14]]){
      run.player.pos.set(cx,0,cz);
      ui.drawMinimap(run,true);
      results.push(match(ui.minimap,run.player.pos));
    }
    run.openMap();
    results.push(match(ui.root.querySelector('.zx-battle-map-art'),{x:0,z:0},true));
    run.resume();
    run.updateCamera(1);
    run.renderWorld(0);ui.hud(run);app.r.render(0);inspected.env.drawUI(app.r.renderer,true);
    return results;
  },{scale:mapWorldScale,view:atlasView});
  for(const result of results)assert.ok(result.samples>100&&result.matches/result.samples>.6,JSON.stringify(result));
  async function capture(selector,filename){
    const clip=await page.evaluate(sel=>{
      const box=inspected.doc.querySelector(sel).getBoundingClientRect();
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      return {x:box.x-screen.x,y:box.y-screen.y,width:box.width,height:box.height};
    },selector);
    await page.screenshot({clip,path:path.join(dir,filename)});
  }
  await capture('.zx-minimap','minimap.png');
  await page.evaluate(()=>{app.run.openMap();inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer,true);});
  await page.waitForFunction(()=>app.run.ui.mapFacilityIcon('portal').naturalWidth>0);
  await page.evaluate(()=>inspected.env.drawUI(app.r.renderer,true));
  await capture('.zx-battle-map','region-map.png');
}
