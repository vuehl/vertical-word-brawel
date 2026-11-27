import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {build} from 'esbuild';
import puppeteer from 'puppeteer-core';

const root=path.resolve(import.meta.dirname,'../..');
const dir=process.env.POKEBONK_QA||path.join(os.tmpdir(),'pokebonk-opening-frames');
fs.mkdirSync(dir,{recursive:true});
const script=(await build({stdin:{contents:
  'import {compositor} from "./platform/paint.mjs";'+
  'import {createJourneyOpening} from "./platform/journey-opening.mjs";'+
  'window.openingCheck={compositor,createJourneyOpening};',resolveDir:root},
  bundle:true,write:false,format:'iife'})).outputFiles[0].text;
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html');return res.end('<canvas id="screen" width="390" height="844"></canvas><script src="/test.js"></script>');}
  if(req.url==='/test.js'){res.setHeader('content-type','text/javascript');return res.end(script);}
  if(/^\/p\d{2}\.webp$/.test(req.url)){
    res.setHeader('content-type','image/webp');
    return fs.createReadStream(path.join(root,'resources/public/assets/opening',req.url.slice(1))).pipe(res);
  }
  res.statusCode=404;res.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas','--no-sandbox']});
try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const result=await page.evaluate(async()=>{
    const screen=document.querySelector('canvas'),gl=screen.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false});
    const reference=document.createElement('canvas');reference.width=390;reference.height=844;
    const ctx=reference.getContext('2d',{willReadFrequently:true}),pixels=new Uint8Array(390*844*4);
    const draw=openingCheck.compositor(gl,reference),renderer={resetState(){}};
    let now=0,uploads=0,cleared=0,canvasUploads=0,nativeImages=0,heldFrames=0;
    for(const method of ['texImage2D','texSubImage2D']){
      const original=gl[method];gl[method]=function(...args){
        uploads++;if(args.at(-1) instanceof HTMLCanvasElement)canvasUploads++;
        return original.apply(this,args);
      };
    }
    const imageSrc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
    const images=[],wx={createImage(){
      nativeImages++;const img=new Image();images.push(img);
      Object.defineProperty(img,'src',{set(value){
        // Force a page miss while the last cell of the previous image is on
        // screen, as on a slow Android decoder.
        if(value==='/p01.webp')setTimeout(()=>imageSrc.set.call(img,value),500);
        else imageSrc.set.call(img,value);
      }});
      return img;
    },
      createCanvas(){throw Error('Playback must not allocate an intermediate canvas');}};
    const film=openingCheck.createJourneyOpening(wx,{now:()=>now,pathFor:key=>'/'+key.split('/').at(-1)});
    const mismatch=[];
    function compare(index){
      const expected=ctx.getImageData(0,0,390,844).data;
      gl.readPixels(0,0,390,844,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let bad=0,max=0;
      for(let y=0;y<844;y++)for(let x=0;x<390*4;x++){
        const error=Math.abs(pixels[((843-y)*390*4)+x]-expected[y*390*4+x]);
        if(error>2)bad++;max=Math.max(max,error);
      }
      if(bad)mismatch.push({index,bad,max});
    }
    for(let index=0;index<169;index++){
      now+=1000/24+.001;
      let layer=film.layer(390,844);
      const deadline=performance.now()+10000;
      while(film.frameCount<index+1){
        if(performance.now()>deadline)throw Error('Image load timeout at '+index);
        if(layer){
          gl.clear(gl.COLOR_BUFFER_BIT);draw.topLayers(renderer,[layer]);
          compare('waiting-'+index);heldFrames++;
        }
        await new Promise(resolve=>setTimeout(resolve,0));layer=film.layer(390,844);
      }
      const {x,y,width,height}=layer.sourceRect;
      ctx.drawImage(layer.canvas,x,y,width,height,0,0,390,844);
      // Clear to a conspicuous colour each time: no frame may depend on the
      // previous back buffer surviving Android's next presentation.
      gl.clearColor(1,0,1,1);gl.clear(gl.COLOR_BUFFER_BIT);cleared++;
      draw.topLayers(renderer,[layer]);compare(index);
      if(index%6===5||index===168){
        const held=film.layer(390,844);
        gl.clear(gl.COLOR_BUFFER_BIT);draw.topLayers(renderer,[held]);compare(index+.5);
      }
    }
    await film.finished;
    const pageUploads=uploads;
    const revealing=film.reveal();film.layer(390,844);
    now+=100;const layer=film.layer(390,844);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);draw.topLayers(renderer,[layer]);
    gl.readPixels(195,422,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const expected=ctx.getImageData(195,421,1,1).data;
    const fadeError=Math.max(...[0,1,2].map(i=>Math.abs(pixels[i]-Math.round(expected[i]*layer.opacity))));
    for(let i=0;i<9;i++){now+=100;film.layer(390,844);}
    await revealing;
    const retained=images.filter(img=>img.getAttribute('src')).length;
    // Drawing ordinary layers after a cropped movie must reset the UVs.
    ctx.fillStyle='#34a2cb';ctx.fillRect(0,0,390,844);
    draw.topLayers(renderer,[{canvas:reference,x:0,y:0,width:390,height:844,slot:1,changed:true}]);
    compare('ordinary-layer');
    const glError=gl.getError();draw.releaseSlot(30);draw.releaseSlot(1);
    return {frames:film.frameCount,pageUploads,playbackCanvasUploads:canvasUploads-1,nativeImages,retained,cleared,heldFrames,mismatch,fadeError,glError};
  });
  assert.deepEqual(result.mismatch,[],'Every presented frame must match the source cell, including page boundaries and held frames');
  assert.equal(result.frames,169);assert.equal(result.pageUploads,29);assert.equal(result.playbackCanvasUploads,0);
  assert.ok(result.heldFrames>0,'The slow decoder must exercise held page-boundary frames');
  assert.equal(result.nativeImages,2);assert.equal(result.retained,0);assert.equal(result.glError,0);assert.ok(result.fadeError<=2);
  fs.writeFileSync(path.join(dir,'opening-frames.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}finally{await browser.close();server.close();}
