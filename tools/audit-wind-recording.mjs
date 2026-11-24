import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const source=process.argv[2]||process.env.WIND_REFERENCE_DIR||path.join(os.homedir(),'Desktop/fff/fff');
const out=process.argv[3]||path.resolve('验收/风系逐帧校准/逐帧对照');
const report=JSON.parse(fs.readFileSync(path.join(out,'逐帧索引.json')));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(report.clips.length,11);
assert.equal(!!report.previewOnly,false,'Selected-frame previews cannot pass a complete recording audit');
assert.ok(report.capture.scale>=2&&report.capture.worldWidth>=780,'The game must actually render in high resolution');
const buildRoot=report.buildRoot||path.resolve('minigame'),contextChanges=[];
for(const [file,digest] of Object.entries(report.build)){
  assert.equal(hash(path.join(buildRoot,file)),digest,'Recorded build was modified: '+file);
  if(hash(path.resolve('minigame',file))!==digest)contextChanges.push(file);
}
// An isolated capture can outlive an unrelated HUD/font rebuild in the shared
// workspace. Wind code and every wind asset must still match the current game.
// Keep any context differences explicit instead of calling the entire build current.
for(const file of contextChanges)assert.ok(['assets.js','play/presentation.js'].includes(file),'Wind runtime changed: '+file);
const manifest=folder=>JSON.parse(fs.readFileSync(path.join(folder,'assets.js'),'utf8').replace(/^module\.exports\s*=\s*/,'').replace(/;\s*$/,''));
const recordedAssets=manifest(buildRoot),currentAssets=manifest(path.resolve('minigame'));
const windAssets=Object.keys(recordedAssets.files).filter(file=>/^assets\/vfx\/wind-/.test(file));
assert.ok(windAssets.length>=9);
for(const file of windAssets)assert.equal(recordedAssets.files[file],currentAssets.files[file],'Wind artwork changed: '+file);
let frames=0,maxClockErrorMs=0;
for(const clip of report.clips){
  const original=path.join(source,clip.name+'.gif'),meta=await sharp(original,{animated:true}).metadata();
  assert.equal(hash(original),clip.sha256);
  assert.equal(clip.frames.length,meta.pages);
  let time=0;
  for(const [i,frame] of clip.frames.entries()){
    assert.equal(frame.index,i);assert.equal(frame.timeMs,time);assert.equal(frame.delayMs,meta.delay[i]);
    const clockError=Math.abs((frame.state.gameTime-clip.frames[0].state.gameTime)*1000-time);
    maxClockErrorMs=Math.max(clockError,maxClockErrorMs);assert.ok(clockError<.001,'Simulation clock drift in '+clip.name);
    const image=await sharp(path.join(out,frame.file)).metadata();
    assert.equal(image.width,782);assert.equal(image.height,480);
    const originalFrame=await sharp(path.join(out,frame.sourceFile)).metadata();
    const gameFrame=await sharp(path.join(out,frame.liveFile)).metadata();
    assert.equal(originalFrame.width,390);assert.equal(originalFrame.height,480);
    assert.equal(gameFrame.width,390*report.capture.scale);assert.equal(gameFrame.height,480*report.capture.scale);
    time+=meta.delay[i];frames++;
  }
  assert.equal(time,clip.durationMs);
}
assert.equal(frames,844);
const result={clips:report.clips.length,frames,missingFrames:0,maxClockErrorMs,
  originalHashesVerified:true,recordedBuildHashesVerified:true,currentBuildHashesVerified:contextChanges.length===0,
  currentWindAssetsAndRuntimeVerified:true,contextChanges,pngDimensionsVerified:true,highResolution:report.capture,
  scope:'Verifies coverage and time alignment, not visual pixel equality. Background, camera, enemies and HUD differ. Occluded artwork uses reconstructed poses.'};
fs.writeFileSync(path.join(out,'逐帧完整性检查.json'),JSON.stringify(result,null,2)+'\n');
console.log(result);
