import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Exercise the production loading entry points, including paths that previously
// used the circular loader. Hold readiness so every viewport can be inspected.
export async function reviewLoadingArtwork({page,resize,dir}){
  const report=[];
  async function inspect(name,expected){
    await page.waitForFunction(()=>app.screen?.querySelector('.journey-scene')?._loadingPoster);
    const sample=await page.evaluate(()=>{
      inspected.env.drawUI(app.r.renderer,true);
      const screen=app.screen,bar=screen.querySelector('[role="progressbar"]');
      const box=inspected.layout.box(bar),canvas=inspected.uiCanvas;
      const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
      const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
      return {page:screen.dataset.page,percent:Number(bar.getAttribute('aria-valuenow')),label:bar.getAttribute('aria-valuetext'),
        legacy:screen.querySelectorAll('.zx-loading-ring,.zx-loading-title').length,
        safe:[inspected.env.innerWidth,inspected.env.innerHeight],box:{x:box.x,y:box.y,w:box.w,h:box.h},
        corners:[pixel(2,2),pixel(w-3,2),pixel(2,h-3),pixel(w-3,h-3)],
        sides:[pixel(2,Math.floor(h*.4)),pixel(w-3,Math.floor(h*.4))]};
    });
    assert.equal(sample.percent,expected);assert.equal(sample.legacy,0);
    assert.ok(sample.corners.every(p=>p[3]===255),'Artwork covers the safe-area gutters');
    for(const pixel of [...sample.corners.slice(0,2),...sample.sides]){
      assert.ok(pixel.slice(0,3).some((v,i)=>Math.abs(v-[38,34,42][i])>20),'Poster fills the top and sides without dark letterboxing');
    }
    const {x,y,w,h}=sample.box,[width,height]=sample.safe;
    assert.ok(x>=-1&&x+w<=width+1&&y>height*.5&&y+h<=height+1,'Progress stays inside the bottom safe area');
    await page.screenshot({path:path.join(dir,name+'.png')});
    report.push({name,...sample});
  }
  await page.evaluate(()=>{
    window.loadingArtworkValue=45;
    window.loadingArtworkWork=app.zixing.loading(100,()=>loadingArtworkValue);
  });
  for(const [width,height] of [[320,568],[390,844],[430,932],[390,550]]){
    await resize(width,height);
    await inspect(`stage-loading-${width}x${height}`,45);
  }
  await page.evaluate(async()=>{loadingArtworkValue=100;await loadingArtworkWork;});
  await resize(390,844);
  for(const coop of [false,true]){
    await page.evaluate(coop=>{
      app.zixing.home();
      window.realArtworkStart=app.startRun;
      app.startRun=(config,update)=>new Promise(resolve=>{
        window.updateLoadingArtwork=update;
        window.releaseLoadingArtwork=()=>{app.setScreen(null);resolve(true);};
      });
      window.loadingArtworkWork=app.zixing.start({species:16,biome:'forest',tier:0,boosts:[],mode:'standard',coop});
    },coop);
    await page.waitForFunction(()=>typeof updateLoadingArtwork==='function');
    await page.evaluate(()=>updateLoadingArtwork({progress:.62,phase:'准备对局'}));
    await inspect(coop?'coop-loading':'entry-from-home',62);
    await page.evaluate(()=>updateLoadingArtwork({progress:.41,phase:'准备对局'}));
    assert.equal(await page.evaluate(()=>app.screen.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')),'62','Progress must not move backwards');
    if(coop){
      await page.evaluate(()=>updateLoadingArtwork({progress:1,teamStatus:'等待小伙伴加载完成'}));
      await inspect('coop-waiting',90);
      await page.evaluate(()=>updateLoadingArtwork({progress:1,teamReady:true,teamStatus:'准备就绪'}));
      await inspect('coop-ready',100);
    }
    await page.evaluate(async()=>{
      releaseLoadingArtwork();await loadingArtworkWork;app.startRun=realArtworkStart;
      delete window.updateLoadingArtwork;
    });
  }
  fs.writeFileSync(path.join(dir,'loading-art.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Loading artwork passed: stage, direct entry, co-op readiness, and four full-screen layouts');
}
