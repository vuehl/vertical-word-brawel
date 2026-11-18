import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url);
const dir=process.env.POKEBONK_QA||path.join(os.tmpdir(),'pokebonk-boot-loading');
fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync(path.join(root,'platform/boot-screen.js'),'utf8');
const artFile=path.join(root,'minigame/boot-hero-art.js'),art=require(artFile);
const report={art:[],scriptBytes:fs.statSync(artFile).size,samples:[]};
for(const [id,word] of [[4,'炎'],[16,'风'],[132,'摹']]){
  const file=path.join(root,'source/art/glyphs',`hero_${id}_${word}.png`),original=fs.readFileSync(file);
  const output=Buffer.from(art[word].split(',')[1],'base64'),m=await sharp(output).metadata();
  assert.equal(m.width,256);assert.equal(m.height,256);assert.equal(m.hasAlpha,true);
  const expected=await sharp(original).resize(256,256,{fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer();
  assert.deepEqual(await sharp(output).ensureAlpha().raw().toBuffer(),expected,'Only size changes; retain RGBA without palette loss');
  report.art.push({word,sourceBytes:original.length,outputBytes:output.length,width:m.width,height:m.height,
    originalSHA256:createHash('sha256').update(original).digest('hex')});
}
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
try{
  const page=await browser.newPage();
  await page.setContent('<style>body{margin:0;background:#eee}canvas{display:block;width:100vw;height:100vh}</style><canvas id="screen"></canvas>');
  await page.evaluate(()=>{
    window.bootGL=document.querySelector('canvas').getContext('webgl2',{preserveDrawingBuffer:true,antialias:false});
    window.bootUploads=[];
    for(const name of ['texImage2D','texSubImage2D']){
      const original=bootGL[name];
      bootGL[name]=function(...args){const image=args.at(-1);bootUploads.push({width:image.width,height:image.height});return original.apply(this,args);};
    }
  });
  for(const [width,height] of [[320,690],[390,844],[430,932],[390,550]]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    const sample=await page.evaluate(async({source,art,width,height})=>{
      const gl=bootGL,screen=document.querySelector('canvas');screen.width=width*2;screen.height=height*2;
      const w=screen.width,h=screen.height;
      const pixels=()=>{const bytes=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bytes);return bytes;};
      const difference=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]?1:0),0);
      async function make(holdLast=false){
        const canvases=[],images=[],pending=[],loads=[];
        const wx={createCanvas(){const c=document.createElement('canvas');canvases.push(c);return c;},createImage(){
          const image=new Image();images.push(image);
          loads.push(new Promise((resolve,reject)=>{image.addEventListener('load',()=>setTimeout(resolve,0),{once:true});image.addEventListener('error',reject,{once:true});}));
          if(holdLast&&images.length===3){const set=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src').set;
            Object.defineProperty(image,'src',{set(value){pending.push(()=>set.call(image,value));}});}
          return image;
        }};
        const factory=new Function('wx','require','const module={exports:{}};'+source+';return module.exports;')(wx,()=>art);
        const splash=await factory(gl);
        async function loaded(){await Promise.all(loads);}
        if(!holdLast)await loaded();
        return {splash,canvases,release:async()=>{pending.forEach(fn=>fn());await loaded();}};
      }
      const current=await make(),snapshots=new Map(),values=new Set([0,1,49,67,85,94,95,100]);
      current.splash.draw(0);bootUploads.length=0;
      for(let value=1;value<=100;value++){current.splash.draw(value);if(values.has(value))snapshots.set(value,pixels());}
      const uploads=[...bootUploads],count=uploads.length;
      current.splash.draw(100);const unchangedUploads=bootUploads.length-count;
      // Returning from 100 to zero catches old text/progress left behind too.
      current.splash.draw(0);snapshots.set(0,pixels());current.splash.dispose();current.splash.dispose();
      let changedChannels=0;const differences=[];
      for(const [value,incremental] of snapshots){
        const reference=await make();reference.splash.draw(value);
        const full=pixels(),changed=difference(incremental,full);changedChannels+=changed;
        if(changed){const i=incremental.findIndex((v,i)=>v!==full[i]);differences.push({value,changed,x:Math.floor(i/4)%w,y:h-1-Math.floor(i/4/w),actual:[...incremental.slice(i-i%4,i-i%4+4)],expected:[...full.slice(i-i%4,i-i%4+4)]});}
        reference.splash.dispose();
      }
      // An image arriving after the first paint must invalidate the background.
      const late=await make(true);late.splash.draw(67);await late.release();bootUploads.length=0;late.splash.draw(67);
      const lateFull=bootUploads.some(u=>u.width===w&&u.height===h),latePixels=pixels();late.splash.dispose();
      const reference=await make();reference.splash.draw(67);const refPixels=pixels(),lateChangedChannels=difference(latePixels,refPixels);
      const lateIndex=latePixels.findIndex((v,i)=>v!==refPixels[i]);
      const lateDifference=lateIndex<0?null:{x:Math.floor(lateIndex/4)%w,y:h-1-Math.floor(lateIndex/4/w),lateFull};
      // A viewport change must reallocate and rebuild the background once.
      screen.width+=2;bootUploads.length=0;reference.splash.draw(67);
      const resizedFull=bootUploads.some(u=>u.width===w+2&&u.height===h);
      screen.width=w;reference.splash.draw(67);
      window.lastBoot=reference.splash;
      const releasedCanvases=current.canvases.every(c=>c.width===1&&c.height===1);
      return {width,height,changedChannels,differences,lateChangedChannels,lateDifference,lateFull,resizedFull,releasedCanvases,unchangedUploads,
        progressUpdates:count,uploadedBytes:uploads.reduce((n,u)=>n+u.width*u.height*4,0),fullUploadBytes:100*w*h*4,
        maxUploadHeight:Math.max(...uploads.map(u=>u.height))};
    },{source,art,width,height});
    assert.equal(sample.changedChannels,0,'Incremental output must match a fresh full paint: '+JSON.stringify(sample.differences));
    assert.equal(sample.lateChangedChannels,0,'Late hero images must appear without stale background: '+JSON.stringify(sample.lateDifference));
    assert.equal(sample.unchangedUploads,0);assert.equal(sample.progressUpdates,100);
    assert.ok(sample.lateFull&&sample.resizedFull&&sample.releasedCanvases);
    if(height/(width/390)>=600)assert.ok(sample.uploadedBytes<sample.fullUploadBytes*.2,'Phone progress should upload under 20% of a full frame');
    await page.screenshot({path:path.join(dir,`boot-${width}x${height}.png`)});
    await page.evaluate(()=>lastBoot.dispose());
    report.samples.push(sample);
  }
}finally{await browser.close();}
fs.writeFileSync(path.join(dir,'boot-loading.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
