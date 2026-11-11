import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function reviewMapEffects(page,dir){
  const report={environment:'Compiled WeChat package / Chrome SwiftShader; not phone FPS.',maps:[]};
  const draw=()=>page.evaluate(()=>{app.run?.update(0);app.r.render(0);inspected.env.invalidateUI();inspected.env.drawUI(app.r.renderer);});
  const tap=async selector=>{
    await draw();
    const b=await page.evaluate(selector=>{
      const element=inspected.doc.querySelector(selector),b=element.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
      return {x:b.x+b.width/2-screen.x,y:b.y+b.height/2-screen.y};
    },selector);
    await page.touchscreen.tap(b.x,b.y);await draw();
  };
  await page.evaluate(()=>{
    const r=app.run,api=inspected.env.__zixingDeveloper;api.close();api.apply({time:0,count:0,mode:'none',boss:'none'});
    const e=r.enemies,p=r.player.pos,species=r.director.cards[0].id;
    // Separated ordinary, elite, alpha, boss and noncombat object markers.
    for(const [x,z,flags] of [[-25,0,0],[0,-25,1],[0,25,2],[25,0,4],[-25,25,32768]]) {
      const id=e.spawn(species,p.x+x,p.z+z,1,1,flags);
      e.x[id]=p.x+x;e.z[id]=p.z+z;
    }
    r.terrain.zxProps=[20,80].map(dx=>({kind:'ruler',x:p.x+dx,z:p.z-15,w:12,d:5}));
    r.updateCamera(1);r.renderWorld(0);r.ui.hud(r);
    window.readMap=canvas=>{
      const c=canvas.getContext('2d'),side=canvas.getBoundingClientRect().width;
      const hudSide=r.ui.minimap.getBoundingClientRect().width;
      const screenScale=hudSide/120*(canvas===r.ui.minimap?1:1.5),scale=canvas.width/side*screenScale;
      const pixel=(x,y)=>Array.from(c.getImageData(Math.floor(canvas.width/2+(x-60)*scale),Math.floor(canvas.height*58/120+(y-58)*scale),1,1).data).slice(0,3);
      let propWidth=0;
      for(let dx=-10;dx<=10;dx+=.25){
        if(pixel(78+dx,44.5).join(',')==='202,183,129')propWidth+=.25*screenScale;
      }
      return {normal:pixel(37.5,58),elite:pixel(60,35.5),eliteEdge:pixel(62.2,35.5),alpha:pixel(60,80.5),boss:pixel(82.5,58),propWidth,
        far:pixel(132,44.5)};
    };
  });
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewport({width,height,deviceScaleFactor:3});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await new Promise(r=>setTimeout(r,200));
    await draw();
    const mini=await page.evaluate(()=>{app.run.ui.drawMinimap(app.run);return readMap(app.run.ui.minimap);});
    assert.deepEqual(mini.normal,[215,102,119]);assert.deepEqual(mini.elite,[242,189,41]);assert.deepEqual(mini.alpha,mini.elite);assert.deepEqual(mini.eliteEdge,mini.elite);
    await tap('.zx-minimap');
    const opened=await page.evaluate(()=>{
      const map=inspected.doc.querySelector('.zx-battle-map'),canvas=map?.querySelector('canvas');
      if(!canvas)throw Error('Native minimap tap did not open the larger map');
      const b=canvas.getBoundingClientRect(),modal=map.getBoundingClientRect(),s=inspected.layout.box(map).s;
      return {state:app.run.state,open:app.run.ui.mapOpen(),oldMap:!!inspected.doc.querySelector('.bigmap'),
        animation:s.animation,transform:s.transform,map:readMap(canvas),side:b.width,mapHeight:b.height,x:b.x,y:b.y,bottom:modal.bottom};
    });
    console.log('Map layout '+JSON.stringify({width,height,...opened}));
    await page.screenshot({path:path.join(dir,`map-${width}.png`)});
    assert.equal(opened.state,'paused');assert.ok(opened.open&&!opened.oldMap);assert.equal(opened.animation,'none');assert.equal(opened.transform,'none');
    assert.ok(opened.side>200&&Math.abs(opened.side-opened.mapHeight)<1);assert.ok(opened.x>=0&&opened.x+opened.side<=width&&opened.bottom<=height);
    assert.deepEqual(opened.map.normal,mini.normal);assert.deepEqual(opened.map.elite,mini.elite);assert.deepEqual(opened.map.alpha,mini.alpha);
    assert.ok(mini.propWidth>5 && Math.abs(mini.propWidth*1.5-opened.map.propWidth)<1);
    assert.deepEqual(opened.map.far,[202,183,129]);assert.notDeepEqual(mini.far,opened.map.far);
    await page.screenshot({path:path.join(dir,`map-${width}.png`)});
    await tap('[data-action="close-battle-map"]');assert.equal(await page.evaluate(()=>app.run.state),'play');
    report.maps.push({width,height,mini,...opened});
  }
  report.emissions=await page.evaluate(()=>{
    const r=app.run,v=r.vfx,p=r.player.pos,results=[];
    const spawn=v.add.spawn,available=v.add.available;let attempts=0;
    v.add.spawn=function(...args){attempts++;return spawn.apply(this,args);};
    try{for(const optimized of [false,true]){
      v.clear();v.add.available=optimized?available:()=>Infinity;v.add.limit=600;v.particleBudget.limit=6;v.particleBudget.next();attempts=0;
      for(let i=0;i<500;i++)v.burst(p.x,p.y+1,p.z,0xff8844,24);
      results.push({optimized,attempts,accepted:v.add.n});
    }}finally{v.add.spawn=spawn;v.add.available=available;v.clear();app.applySettings();}
    // A saturated decoration budget must still allow enemy ground warning fills.
    v.ground.ownAreaLimit=0;v.ground.ownCountLimit=0;
    v.telegraph(p.x,p.y,p.z,10,0xff0000,1);v.update(.1);
    const warning={rings:v.rings.n,ground:v.ground.n,alpha:v.rings.aB.array[3]};v.clear();app.applySettings();
    return {results,warning};
  });
  const [before,after]=report.emissions.results;assert.equal(before.attempts,12000);assert.ok(after.attempts<=6&&after.accepted>0);assert.equal(before.accepted,after.accepted);
  assert.ok(report.emissions.warning.rings>0&&report.emissions.warning.ground>0&&report.emissions.warning.alpha>0);
  report.groundBudget=await page.evaluate(()=>{
    const r=app.run,v=r.vfx,api=inspected.env.__zixingDeveloper,p=r.player.pos;
    api.apply({time:300,count:600,mode:'timed',boss:'none'});r.hideOwnFx=false;
    const cast=r.castMove;let result;
    r.castMove=()=>{
      if(result)return;
      v.ground.clear();
      const particle={x:p.x,y:p.y,z:p.z,life:1,size:10,endSize:10,color:0xff8844};
      for(let i=0;i<100;i++)v.ground.spawn(particle);
      result={accepted:v.ground.n,area:v.ground.ownArea,limit:v.ground.ownAreaLimit};
      v.ground.kill(0);result.afterKill={count:v.ground.ownCount,area:v.ground.ownArea};
      v.ground.spawn(particle);result.refill=v.ground.ownCount;
      const before=v.ground.n;v.telegraph(p.x,p.y,p.z,20,0xff0000,1);result.protectedFill=v.ground.n-before;
      v.ground.clear();result.clear={count:v.ground.ownCount,area:v.ground.ownArea};
    };
    try{r.update(1/60);}finally{r.castMove=cast;}
    return result;
  });
  assert.equal(report.groundBudget.accepted,4);assert.equal(report.groundBudget.area,400);
  assert.deepEqual(report.groundBudget.afterKill,{count:3,area:300});assert.equal(report.groundBudget.refill,4);
  assert.equal(report.groundBudget.protectedFill,1);assert.deepEqual(report.groundBudget.clear,{count:0,area:0});
  await page.evaluate(()=>{app.toMenu();app.zixing.choose();});await draw();
  report.fire=await page.evaluate(()=>{
    const el=inspected.doc.querySelector('.zx-choice.fire.on'),b=inspected.layout.box(el);
    return {border:b.s['border-color'],width:b.s['border-width'],selected:el.getAttribute('aria-pressed')};
  });
  assert.equal(report.fire.border,'#d84840');assert.equal(report.fire.selected,'true');
  await page.screenshot({path:path.join(dir,'fire-selected.png')});
  fs.writeFileSync(path.join(dir,'map-effects.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
