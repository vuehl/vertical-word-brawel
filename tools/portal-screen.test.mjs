import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalScreenAnimation,portalScreenAtlas,portalScreenFrame} from '../source/src/portal-screen-atlas.js';

test('portal screen retains all 100 frames and loops without an out-of-atlas sample',()=>{
  const {frames,seconds}=portalScreenAtlas;
  for(let i=0;i<frames;i++)assert.equal(portalScreenFrame((i+.1)*seconds/frames),i);
  assert.equal(portalScreenFrame(seconds),0);
  assert.equal(portalScreenFrame(-.001),99);
});

test('open portal uploads once before battle and animates only its padded UV rectangle',async()=>{
  const OriginalImage=globalThis.Image;let image,uploads=0,changes=0,disposed=0;
  globalThis.Image=class {constructor(){image=this;}};
  const vector=()=>({x:0,y:0,set(x,y){this.x=x;this.y=y;}});
  const T={Texture:class {
    repeat=vector();offset=vector();
    set needsUpdate(value){if(value)changes++;}
    updateMatrix(){}
    dispose(){disposed++;}
  },SRGBColorSpace:'srgb',LinearFilter:1006};
  try{
    const screen=createPortalScreenAnimation(T,{initTexture(){uploads++;}});
    image.onload();await screen.ready;
    assert.equal(uploads,1);assert.equal(changes,1);
    for(let i=0;i<600;i++){
      screen.frame(i/60);
      const {offset,repeat}=screen.texture;
      assert.ok(offset.x>0&&offset.y>0&&offset.x+repeat.x<1&&offset.y+repeat.y<1);
    }
    assert.equal(changes,1,'UV animation must never upload texture pixels');
    assert.equal(uploads,1);
    assert.equal(screen.texture.generateMipmaps,false);
    screen.dispose();assert.equal(disposed,1);
    const late=createPortalScreenAnimation(T,{initTexture(){uploads++;}});
    const onload=image.onload;late.dispose();onload();await late.ready;
    assert.equal(uploads,1,'A late image must not resurrect a disposed run');
    const failed=createPortalScreenAnimation(T,{initTexture(){throw Error('GPU upload failed');}});
    image.onload();await assert.rejects(failed.ready,/GPU upload failed/);failed.dispose();
  }finally{globalThis.Image=OriginalImage;}
});
