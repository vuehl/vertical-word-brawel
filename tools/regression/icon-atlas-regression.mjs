import assert from 'node:assert/strict';

// Exercise original public URLs against the installed release packs, including
// consumers that request standalone image bytes rather than a DOM image.
export async function checkIcons(page){
  const checks=await page.evaluate(async()=>{
    const {env,doc}=inspected,files=GameGlobal.pokebonk.files;
    async function load(src){
      const img=new env.Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});
      return img;
    }
    const images=await Promise.all(['fire','flying','normal'].map(type=>load('assets/ui/types/'+type+'.png?v=test')));
    const checks={
      shared:images.every(img=>img._surface===images[0]._surface),
      skillSizes:images.map(img=>[img.naturalWidth,img.naturalHeight]),
      tiles:[],
    };
    for(const key of ['assets/ui/types/water.png','assets/items/old-rod.png','assets/items/poke-ball.png']){
      const img=await load(key),canvas=doc.createElement('canvas');
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      canvas.getContext('2d').drawImage(img,0,0);
      const png=await files.resolvePath(key),copy=await load(png);
      const duplicate=doc.createElement('canvas');
      duplicate.width=copy.naturalWidth;duplicate.height=copy.naturalHeight;
      duplicate.getContext('2d').drawImage(copy,0,0);
      checks.tiles.push([canvas.width,canvas.height,copy.naturalWidth,canvas.toDataURL()===duplicate.toDataURL()]);
    }
    return checks;
  });
  assert.ok(checks.shared,'The three high-resolution skill icons should share one decoded page');
  assert.deepEqual(checks.skillSizes,[[256,256],[256,256],[256,256]]);
  assert.deepEqual(checks.tiles,[[64,64,64,true],[256,256,256,true],[30,30,30,true]]);
  console.log('Packed icon URLs, dimensions, shared pages, canvas drawing and PNG reads passed');
}
