// Bake the handoff font's fill and outline at the exact nameplate baseline.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import {formCopy} from '../../source/src/data/form-copy.js';
import {titleFont} from '../../source/src/effects/ultimate-cast-layout.js';

const root=path.resolve(import.meta.dirname,'../..');
const font=fs.readFileSync(path.join(root,'resources/public/fonts/cast-title.ttf'));
const glyphs=[...new Set(Object.values(formCopy).flatMap(form=>Array.from(form.ultimate[1])))].sort().join('');
const spec={glyphs,columns:14,tile:140,scale:1.25};
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const png=await (await browser.newPage()).evaluate(async({font,spec,titleFont})=>{
    const face=new FontFace('CastArt','url(data:font/ttf;base64,'+font+')');
    document.fonts.add(await face.load());
    const {glyphs,columns,tile,scale}=spec;
    const atlas=document.createElement('canvas');
    atlas.width=columns*tile;atlas.height=Math.ceil(glyphs.length*2/columns)*tile;
    const ctx=atlas.getContext('2d');
    ctx.font=titleFont+'px CastArt';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineJoin='round';ctx.lineWidth=10;ctx.strokeStyle=ctx.fillStyle='white';
    for(let i=0;i<glyphs.length*2;i++){
      const x=(i%columns+.5)*tile,y=(Math.floor(i/columns)+.5)*tile;
      ctx.setTransform(scale,0,0,scale,x,y);
      if(i<glyphs.length)ctx.fillText(glyphs[i],0,0);
      else ctx.strokeText(glyphs[i-glyphs.length],0,1);
    }
    return atlas.toDataURL('image/png').split(',')[1];
  },{font:font.toString('base64'),spec,titleFont});
  await sharp(Buffer.from(png,'base64')).webp({lossless:true,effort:6}).toFile(path.join(root,'platform/cast-title-glyphs.webp'));
  fs.writeFileSync(path.join(root,'platform/cast-title-glyphs.json'),JSON.stringify(spec)+'\n');
}finally{await browser.close();}
