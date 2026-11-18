import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';
import puppeteer from 'puppeteer-core';
import {facilityNames} from '../source/src/active-content.js';
const root=path.resolve('source/public'),out=path.join(root,'assets/env/desk2d');
const server=http.createServer((req,res)=>{
  if(req.url==='/')return res.end('<body></body>');
  const file=path.resolve(root,'.'+decodeURIComponent(req.url));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);const sizes={};
for(const [kind,name] of Object.entries(facilityNames)){
 const {image,height,size}=await page.evaluate(async(name)=>{
  const T=await import('/assets/three-DmSYIDKK.js'),gltf=await new T.t().loadAsync('/assets/models/devices/'+name+'.glb');
  const model=gltf.scene,scene=new T.st();scene.add(model,new T.R(0xffffff,0xb8c3d0,2));
  const light=new T.k(0xffefdd,2);light.position.set(-4,8,5);scene.add(light);
  const box=new T.g().setFromObject(model),extent=box.getSize(new T.ht()),size=Math.max(extent.length()*1.05,.2);
  const camera=new T.$(30,1,.01,1000),pitch=Math.PI*.3;
  camera.position.set(0,size*2*Math.sin(pitch),size*2*Math.cos(pitch));camera.lookAt(0,0,0);
  camera.projectionMatrix.makeOrthographic(-size/2,size/2,size*.80,-size*.20,.01,1000,camera.coordinateSystem);
  const renderer=new T.h({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setClearColor(0,0);renderer.setSize(256,256);renderer.render(scene,camera);
  const image=renderer.domElement.toDataURL().split(',')[1];renderer.dispose();renderer.forceContextLoss();return {image,size,height:extent.y};
 },name);
 fs.writeFileSync(path.join(out,'device-'+kind+'.png'),Buffer.from(image,'base64'));// Raster silhouette strips let the existing shine and outline passes mask a sprite.
 const pixels=await sharp(Buffer.from(image,'base64')).resize(128,128).ensureAlpha().raw().toBuffer();
 const strips=[];for(let row=0;row<128;row++){
   let start=-1;
   for(let x=0;x<=128;x++){const visible=x<128&&pixels[(row*128+x)*4+3]>10;
     if(visible&&start<0)start=x;
     if(!visible&&start>=0){strips.push([start,row,x]);start=-1;}
   }
 }
 const glb=fs.readFileSync(path.join(root,'assets/models/devices',name+'.glb'));
 const cfg=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12))).scenes[0].extras.deviceScreenFx;
 sizes[kind]={size,height,strips,fx:cfg};
}
fs.writeFileSync('source/src/desk2d-devices.json',JSON.stringify(sizes));}finally{await browser.close();server.close();}
