import fs from 'node:fs';
import sharp from 'sharp';
import {packMeshBytes} from '../../source/src/effects/dragon-summon-hd/mesh-bytes.js';

export const dragonDirectory='assets/vfx/dragon-summon-hd/';

// The shader already addresses frames by page and tile. Build mobile pages
// here so the desktop source, frame numbers and cinematic clock stay intact.
export async function packDragonSummon(sourceFor,add) {
  const input=name=>sourceFor(dragonDirectory+name);
  const emit=(name,data,extension)=>add('dragon_summon',dragonDirectory+name,data,extension);
  const meta=JSON.parse(fs.readFileSync(input('manifest.json'),'utf8'));
  async function colorPages(name,width,height,columns,rows,quality) {
    const section=meta[name], sources=section.pages;
    if(section.columns!==1||section.rows!==1)throw Error('Expected single-frame source pages for '+name);
    const capacity=columns*rows,pages=[];
    for(let start=0;start<sources.length;start+=capacity){
      const layers=await Promise.all(sources.slice(start,start+capacity).map(async (file,tile)=>({
        input:await sharp(input(file)).resize(width,height).png().toBuffer(),
        left:(tile%columns)*width,top:Math.floor(tile/columns)*height
      })));
      const page=name+'-page-'+pages.length+'.webp';
      const atlas=sharp({create:{width:columns*width,height:rows*height,channels:3,background:'black'}});
      emit(page,await atlas.composite(layers).removeAlpha().webp({quality,effort:6}).toBuffer());
      pages.push(page);
    }
    for(const frame of section.frames){
      if(!frame)continue;
      const index=frame.page;
      frame.page=Math.floor(index/capacity);
      frame.tile=index%capacity;
    }
    Object.assign(section,{width,height,columns,rows,pages});
  }
  await colorPages('orb',384,384,3,3,87);
  await colorPages('burst',640,360,2,2,82);
  const bg=meta.orb.background;
  const bgPage='orb-background.webp';
  emit(bgPage,await sharp(input(bg.file)).resize(meta.orb.width*bg.columns,meta.orb.height*bg.rows)
    .webp({quality:90,effort:6}).toBuffer());
  bg.file=bgPage;

  // Only the soft white fringe samples these RGB distance masks. The two
  // solid colored edges use the original full-precision triangular meshes.
  const arc=meta.arc;
  arc.maskWidth=arc.width/2;arc.maskHeight=arc.height/2;
  for(const file of arc.pages){
    const {data,info}=await sharp(input(file)).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const width=arc.maskWidth*arc.columns,height=arc.maskHeight*arc.rows;
    if(info.width!==2*width||info.height!==2*height||info.channels!==3)throw Error('Unexpected distance atlas '+file);
    const mask=Buffer.alloc(width*height*3);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const src=(y*2*info.width+x*2)*3,next=src+info.width*3;
      for(let c=0;c<3;c++)mask[(y*width+x)*3+c]=Math.round((data[src+c]+data[src+3+c]+data[next+c]+data[next+3+c])/4);
    }
    emit(file,await sharp(mask,{raw:{width,height,channels:3}}).webp({lossless:true,effort:6}).toBuffer(),'.webp');
  }
  emit(arc.mesh,packMeshBytes(fs.readFileSync(input(arc.mesh))));
  emit(meta.boss.file,await sharp(input(meta.boss.file)).webp({lossless:true,effort:6}).toBuffer(),'.webp');
  emit('manifest.json',Buffer.from(JSON.stringify(meta)));
}
