import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {portalScreenAtlas as spec} from '../../source/src/effects/portal-screen-atlas.js';

const root=path.resolve(import.meta.dirname,'../..');
// Use the exact authored canvas painter, without executing any Three.js code.
const source=fs.readFileSync(path.join(root,'source/src/effects/PortalDock.mjs'),'utf8');
const painter=source.slice(source.indexOf('const fxRGB='),source.indexOf('const clamp='));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage();
  await page.addScriptTag({content:painter+'\nwindow.makePortalPainter=screenPainter;'});
  const encoded=await page.evaluate(a=>{
    const original=document.createElement('canvas'),paint=window.makePortalPainter(original);
    const atlas=document.createElement('canvas'),tw=a.width+2*a.pad,th=a.height+2*a.pad;
    atlas.width=tw*a.columns;atlas.height=th*a.rows;
    const ctx=atlas.getContext('2d');ctx.imageSmoothingQuality='high';
    for(let i=0;i<a.frames;i++){
      paint(true,i*a.seconds*1000/a.frames);
      const x=i%a.columns*tw+a.pad,y=Math.floor(i/a.columns)*th+a.pad;
      ctx.drawImage(original,x,y,a.width,a.height);
      // Extruded borders prevent bilinear sampling of adjacent animation frames.
      ctx.drawImage(atlas,x,y,a.width,1,x,y-a.pad,a.width,a.pad);
      ctx.drawImage(atlas,x,y+a.height-1,a.width,1,x,y+a.height,a.width,a.pad);
      ctx.drawImage(atlas,x,y-a.pad,1,th,x-a.pad,y-a.pad,a.pad,th);
      ctx.drawImage(atlas,x+a.width-1,y-a.pad,1,th,x+a.width,y-a.pad,a.pad,th);
    }
    return atlas.toDataURL('image/png').split(',')[1];
  },spec);
  const file=path.join(root,'resources/public/assets/vfx/portal-screen.png');
  fs.writeFileSync(file,Buffer.from(encoded,'base64'));
  console.log('Baked portal loop:',spec.frames,'frames,',fs.statSync(file).size,'bytes');
}finally{await browser.close();}
