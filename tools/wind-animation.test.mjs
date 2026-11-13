import test from 'node:test';
import assert from 'node:assert/strict';
import deathData from '../source/src/wind-death-anim.json' with {type:'json'};
import idleData from '../source/src/wind-idle-anim.json' with {type:'json'};
import walkData from '../source/src/wind-walk-anim.json' with {type:'json'};

let instance=0;
async function harness(t,{load=true}={}){
  const images=[],canvases=[],originalImage=globalThis.Image,originalDocument=globalThis.document;
  globalThis.document={createElement(name){
    assert.equal(name,'canvas');
    const canvas={width:0,height:0},calls=[],context={canvas,calls};
    for(const method of ['clearRect','save','restore','translate','scale','rotate','transform','drawImage','fillRect','putImageData']){
      context[method]=(...args)=>calls.push({method,args});
    }
    context.getImageData=()=>({data:new Uint8ClampedArray([0,0,0,255,85,85,85,255,255,255,255,255])});
    canvas.getContext=()=>context;canvases.push(canvas);return canvas;
  }};
  globalThis.Image=class {
    set src(value){this.url=value;images.push(this);if(load)queueMicrotask(()=>this.onload?.());}
    get src(){return this.url;}
  };
  t.after(()=>{for(const image of images)image.onerror?.();globalThis.Image=originalImage;globalThis.document=originalDocument;});
  const api=await import('../source/src/hero-poses.js?wind-test='+instance++);
  return {api,images,canvases};
}
function standing(){
  return {speciesId:16,dead:false,speedNow:0,grounded:true,run:{time:100,realTime:100}};
}
function tick(api,player,ms=20){
  player.run.time+=ms/1000;player.run.realTime+=ms/1000;
  return api.windHeroFrame(player);
}
function assertSourceFrame(frame,data,index,key){
  const source=data.anims[key].frames[index];
  assert.equal(frame.layout.image,data.atlas.image);
  assert.deepEqual(frame.tile,data.tiles[source.tile]);
  assert.deepEqual(frame.m,source.m);
  assert.deepEqual(frame.t,source.t);
}

test('wind clips fall back until their images load, then begin at the first frame',async t=>{
  const {api,images}=await harness(t,{load:false}),player=standing();
  const death=api.startWindFaint(16);
  assert.equal(api.windFaintTile(16,0),undefined);
  assert.equal(api.windHeroFrame(player),undefined);
  assert.equal(death(1000),undefined);
  const ready=api.prepareHeroStrokes(16);
  assert.deepEqual(images.map(image=>image.src).sort(),[
    'assets/glyphs/wind-death-atlas.png','assets/glyphs/wind-idle-atlas.png','assets/glyphs/wind-strokes.png','assets/glyphs/wind-walk-atlas.png'
  ]);
  images.find(image=>image.src.endsWith('wind-strokes.png')).onload();
  assert.ok(api.loadedHeroRig(16),'The standing rig remains available while animation images load');
  assert.equal(api.windHeroFrame(player),undefined);
  player.speedNow=2;
  assert.equal(api.windHeroFrame(player),undefined,'Walking also falls back while its image is unavailable');
  for(const image of images)image.onload?.();
  await ready;
  assertSourceFrame(death(90000),deathData,0,'faint');
  player.run.time=90000;
  assertSourceFrame(api.windHeroFrame(player),walkData,0,'walk');
  player.speedNow=0;
  assertSourceFrame(api.windHeroFrame(player),idleData,0,'idle');
});

test('faint_02 supplies all 19 death frames once, and the final pose is held',async t=>{
  const {api}=await harness(t);await api.prepareHeroStrokes(16);
  assert.equal(deathData.meta.name,'faint_01');
  assert.equal(deathData.anims.faint.frames.length,19);
  for(let index=0;index<19;index++){
    assertSourceFrame(api.windFaintTile(16,(index+.1)*deathData.anims.faint.frameMs),deathData,index,'faint');
  }
  const final=api.windFaintTile(16,1e6);
  assertSourceFrame(final,deathData,18,'faint');
  assert.equal(api.windFaintTile(16,2e6),final);
  assertSourceFrame(api.windFaintTile(16,-1),deathData,0,'faint');
  assert.equal(api.windFaintTile(17,0),undefined);
  assert.equal(api.startWindFaint(4),undefined);
  const play=api.startWindFaint(16);
  assertSourceFrame(play(10000),deathData,0,'faint');
  assertSourceFrame(play(20000),deathData,1,'faint');
  for(let index=1;index<=60;index++)play(20000+index*50);
  assert.equal(play(1e6),final);
});

test('idle_N supplies the 28-frame idle loop and pauses with gameplay time',async t=>{
  const {api}=await harness(t);await api.prepareHeroStrokes(16);
  assert.equal(idleData.meta.name,'idle_N');
  assert.equal(idleData.anims.idle.frames.length,28);
  const player=standing(),first=api.windHeroFrame(player),seen=new Set([first]);
  assertSourceFrame(first,idleData,0,'idle');
  let frame;
  for(let index=1;index<=59;index++)seen.add(frame=tick(api,player));
  assert.equal(seen.size,28,'Every authored frame appears before the loop repeats');
  assert.equal(frame,first,'Idle returns to its first frame after one full cycle');
  for(let index=0;index<6;index++)frame=tick(api,player);
  const paused=frame;
  player.run.realTime+=60;
  assert.equal(api.windHeroFrame(player),paused,'Real time does not advance idle while paused');
  for(let index=0;index<3;index++)frame=tick(api,player);
  assert.notEqual(frame,paused);
});

test('combat, custom poses and evolution interrupt locomotion and reset its next entry',async t=>{
  const {api}=await harness(t);await api.prepareHeroStrokes(16);
  for(const speed of [0,2])for(const [field,value] of [
    ['attackT',.2],['hurtT',.2],['ultPoseT',.2],
    ['grounded',false],['gliding',true],['swimNow',true],['slideT',.2],
    ['heroPose',{word:'风'}],['firePose',{word:'炎'}],['speciesId',17],['speciesId',4]
  ]){
    const player=standing();player.speedNow=speed;
    const first=api.windHeroFrame(player);
    for(let index=0;index<6;index++)tick(api,player);
    assert.notEqual(api.windHeroFrame(player),first,field+' advanced before interruption');
    const previous=player[field];player[field]=value;
    assert.equal(api.windHeroFrame(player),undefined,field+' uses the existing character pose');
    player[field]=previous;player.run.time+=10;
    assert.equal(api.windHeroFrame(player),first,field+' restarts idle without catching up');
  }
});

test('death overrides idle, uses unscaled time, and revival restarts idle',async t=>{
  const {api}=await harness(t);await api.prepareHeroStrokes(16);
  const player=standing(),idleFirst=api.windHeroFrame(player);
  for(let index=0;index<6;index++)tick(api,player);
  player.dead=true;player.windFaint=api.startWindFaint(16);
  assertSourceFrame(api.windHeroFrame(player),deathData,0,'faint');
  player.run.realTime+=.05;
  assertSourceFrame(api.windHeroFrame(player),deathData,1,'faint');
  player.dead=false;
  assert.equal(api.windHeroFrame(player),idleFirst);
});

test('walk_02 loops all 15 frames, pauses, and restarts when switching between walking and idle',async t=>{
  const {api}=await harness(t);await api.prepareHeroStrokes(16);
  assert.equal(walkData.meta.name,'walk_02');assert.equal(walkData.anims.walk.frames.length,15);
  const player=standing(),idleFirst=api.windHeroFrame(player);
  player.speedNow=2;
  const first=api.windHeroFrame(player),seen=new Set([first]);
  assertSourceFrame(first,walkData,0,'walk');
  let frame;
  for(let index=0;index<32;index++)seen.add(frame=tick(api,player));
  assert.equal(seen.size,15);assert.equal(frame,first);
  for(let index=0;index<6;index++)frame=tick(api,player);
  const paused=frame;player.run.realTime+=60;
  assert.equal(api.windHeroFrame(player),paused);
  player.speedNow=.6;
  assert.equal(api.windHeroFrame(player),idleFirst);assert.equal(player.windWalk,undefined);
  player.speedNow=.61;
  assert.equal(api.windHeroFrame(player),first);assert.equal(player.windIdle,undefined);
  player.dead=true;player.windFaint=api.startWindFaint(16);
  assertSourceFrame(api.windHeroFrame(player),deathData,0,'faint');assert.equal(player.windWalk,undefined);
});

test('opaque grayscale walk atlas becomes a colored alpha mask once at load time',async t=>{
  const {api,canvases}=await harness(t);await api.prepareHeroStrokes(16);
  assert.equal(canvases.length,1,'Only the grayscale sheet needs conversion');
  const canvas=canvases[0],calls=canvas.getContext('2d').calls;
  assert.equal(canvas.width,walkData.atlas.w);assert.equal(canvas.height,walkData.atlas.h);
  const decoded=calls.find(call=>call.method==='putImageData').args[0].data;
  assert.deepEqual([...decoded],[135,187,255,0,135,187,255,85,135,187,255,255]);
  const player=standing();player.speedNow=2;
  for(let index=0;index<100;index++)tick(api,player);
  await api.prepareHeroStrokes(16);
  assert.equal(canvases.length,1,'Playback and repeated preload reuse the decoded sheet');
});

test('shared atlas tiles retain distinct affine poses and cached identical frames avoid redraw',async t=>{
  const {api,canvases}=await harness(t);await api.prepareHeroStrokes(16);
  const start=canvases.length;
  class Texture{constructor(image){this.image=image;}}
  const entry=api.createHeroPoseTexture(Texture,'srgb'),rig=api.loadedHeroRig(16);
  const first=api.windFaintTile(16,50),second=api.windFaintTile(16,100);
  assert.equal(first.tile,second.tile,'Consecutive poses reuse one atlas rectangle');
  assert.notDeepEqual(first.m,second.m);
  entry.draw(rig,null,first);
  const fill=canvases[start+1].getContext('2d'),count=fill.calls.length;
  entry.texture.needsUpdate=false;
  entry.draw(rig,null,first);
  assert.equal(fill.calls.length,count);
  assert.equal(entry.texture.needsUpdate,false);
  entry.draw(rig,null,second);
  assert.equal(entry.texture.needsUpdate,true);
  const transforms=fill.calls.filter(call=>call.method==='transform');
  assert.deepEqual(transforms.map(call=>call.args),[ [...first.m,...first.t],[...second.m,...second.t] ]);
  const draws=fill.calls.filter(call=>call.method==='drawImage');
  assert.equal(draws.length,2);
  assert.equal(draws[1].args[0].src,'assets/glyphs/wind-death-atlas.png');
  assert.deepEqual(draws[1].args.slice(1),[second.tile.x,second.tile.y,second.tile.w,second.tile.h,0,0,second.tile.w,second.tile.h]);
  entry.draw(rig,null,undefined);
  const standingDraws=fill.calls.filter(call=>call.method==='drawImage').slice(2);
  assert.ok(standingDraws.length>0);
  assert.ok(standingDraws.every(call=>call.args[0].src.endsWith('wind-strokes.png')));
});
