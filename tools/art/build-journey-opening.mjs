import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import sharp from 'sharp';

// Native WebP images work on the same devices as the game artwork. Preserve
// all 169 film frames; group six per page and keep each texture below 2048px.
export async function buildOpeningAtlas(root){
  const dir=path.join(root,'resources/public/assets/opening');
  const input=path.join(dir,'journey.mp4'),hash=createHash('sha256').update(fs.readFileSync(input)).digest('hex');
  const metaPath=path.join(dir,'frames.json'),width=390,height=844,frames=169,columns=3,perPage=6;
  const files=Array.from({length:Math.ceil(frames/perPage)},(_,i)=>'p'+String(i).padStart(2,'0')+'.webp');
  const old=fs.existsSync(metaPath)?JSON.parse(fs.readFileSync(metaPath,'utf8')):null;
  if(old?.sourceHash===hash&&old.version===1&&files.every(f=>fs.existsSync(path.join(dir,f))))return {dir,files};
  const temp=path.join(root,'.cache','opening-frames');fs.mkdirSync(temp,{recursive:true});
  execFileSync(ffmpeg.path,['-hide_banner','-loglevel','error','-i',input,'-vf',`scale=${width}:${height}:flags=lanczos`,
    '-vsync','0','-y',path.join(temp,'f%03d.png')],{windowsHide:true});
  let bytes=0;
  for(let page=0;page<files.length;page++){
    const count=Math.min(perPage,frames-page*perPage),rows=Math.ceil(count/columns);
    const composite=Array.from({length:count},(_,i)=>({
      input:path.join(temp,'f'+String(page*perPage+i+1).padStart(3,'0')+'.png'),
      left:i%columns*width,top:Math.floor(i/columns)*height,
    }));
    const buffer=await sharp({create:{width:width*columns,height:height*rows,channels:3,background:'#cbb89b'}})
      .composite(composite).webp({quality:82,smartSubsample:true,effort:6}).toBuffer();
    fs.writeFileSync(path.join(dir,files[page]),buffer);bytes+=buffer.length;
  }
  fs.writeFileSync(metaPath,JSON.stringify({version:1,sourceHash:hash,width,height,frames,fps:24,columns,perPage,files,bytes},null,2)+'\n');
  console.log('Opening film:',frames,'frames,',(bytes/1048576).toFixed(2),'MiB');
  return {dir,files};
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename))
  await buildOpeningAtlas(path.resolve(import.meta.dirname,'../..'));
