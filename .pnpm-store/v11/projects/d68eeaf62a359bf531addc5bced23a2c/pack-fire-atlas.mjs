import fs from 'node:fs';
import sharp from 'sharp';
// Preserve silhouette/alpha at full resolution; a shared colour palette keeps
// the higher-resolution frames inside the WeChat download package budget.
export async function writeFireAtlas(image,file){
 const buffer=await image.png({palette:true,colours:256,dither:.15,effort:8,compressionLevel:9}).toBuffer();
 fs.writeFileSync(file,buffer);
}
if(process.argv[1]?.endsWith('pack-fire-atlas.mjs')){
 for(const file of process.argv.slice(2)){
  await writeFireAtlas(sharp(fs.readFileSync(file)),file);
  console.log(file,fs.statSync(file).size);
 }
}
