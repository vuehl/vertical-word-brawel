import {createAudioSource as synth} from '../build/audio-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {combatClipIds, combatEvolutionSeconds, loadAudioClips, loadCombatClips} from '../../source/src/combat/audio-clips.js';
import {buttonSoundFiles} from '../../source/src/ui/button-audio.js';
import {combatSoundEvents} from '../art/combat-sound-events.mjs';
import manifest from '../../resources/public/config/combat-audio.json' with {type:'json'};

const clipResponse = {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};
function fixture(fetchClip = async()=>clipResponse) {
  const contexts=[],timers=new Map();let nextTimer=0;
  const param=()=>({value:1,cancelled:0,cancelScheduledValues(){this.cancelled++;},
    setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
  class Context {
    constructor(){this.state='running';this.currentTime=20;this.sampleRate=8000;this.destination={};this.nodes=[];contexts.push(this);}
    node(type){const node={type,stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},
      start(){},stop(){this.stops++;},gain:param(),frequency:param(),Q:param(),playbackRate:param()};this.nodes.push(node);return node;}
    createGain(){return this.node('gain');}
    createOscillator(){return this.node('oscillator');}
    createBufferSource(){return this.node('buffer');}
    createBiquadFilter(){return this.node('filter');}
    createDynamicsCompressor(){return Object.assign(this.node('compressor'),{threshold:param(),ratio:param(),attack:param(),release:param()});}
    createBuffer(channels,length,rate){const pcm=new Float32Array(length);return {duration:length/rate,getChannelData:()=>pcm};}
    decodeAudioData(bytes,success){success(this.createBuffer(1,800,8000));}
    resume(){this.state='running';return Promise.resolve();}
    close(){this.closeCount=(this.closeCount||0)+1;this.state='closed';this.onstatechange?.();return Promise.resolve();}
  }
  const document={hidden:false,addEventListener(){}};
  const listeners=new Map();
  const env={AudioContext:Context,document,navigator:{},Ws:()=>false,performance:{now:()=>10000},
    combatClipIds,combatEvolutionSeconds,loadAudioClips,loadCombatClips,buttonSoundFiles,fetch:url=>fetchClip(url.split('assets/').pop().split('?')[0]),
    matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>listeners.set(name,fn),clearTimeout:id=>timers.delete(id),
    setTimeout:callback=>{const id=++nextTimer;timers.set(id,callback);return id;},
    setInterval(){return 1;},clearInterval(){},backgroundMusicEnabled:false};
  env.window=env;
  const audio=vm.runInNewContext(synth,env);
  const timer=()=>{const id=audio.aliveTimer, callback=timers.get(id);timers.delete(id);callback();};
  return {audio,contexts,document,timer,timers,emit:name=>listeners.get(name)()};
}

test('synth raises effect output while retaining stored volume and explicit mute',()=>{
  const {audio}=fixture();audio.init();
  assert.equal(audio.master.gain.value,1);assert.equal(audio.sfxBus.gain.value,1.8);
  audio.setVolumes({master:.65,sfx:.4});audio.beginRun();
  assert.equal(audio.master.gain.value,.65);assert.equal(audio.sfxBus.gain.value,.4*1.8);
  audio.setVolumes({master:0});audio.click();assert.equal(audio.voices.size,0);
  audio.beginRun();assert.equal(audio.master.gain.value,0);
});

test('every synth path releases sources, gains, filters and vibrato when finished',()=>{
  const {audio}=fixture();audio.init();
  for(const play of [()=>audio.click(),()=>audio.noise(.2,.1,1000),
    ()=>audio.kt(330,.2,{w:'sawtooth',vib:[8,.1]}),()=>audio.kn(.2)]){
    const index=audio.ctx.nodes.length;play();assert.equal(audio.voices.size,1);
    const nodes=audio.ctx.nodes.slice(index),source=nodes.find(node=>node.onended);
    assert.ok(source);source.onended();
    assert.equal(audio.voices.size,0);assert.ok(nodes.every(node=>node.disconnected));
  }
});

test('native missing onended cannot leak effect chains or exceed the voice budget',()=>{
  const {audio}=fixture();audio.init();const index=audio.ctx.nodes.length;
  for(let i=0;i<100;i++)audio.tone(830,.053,'triangle',.11);
  assert.equal(audio.voices.size,audio.maxVoices);
  assert.equal(audio.ctx.nodes.length-index,audio.maxVoices*2);
  const ended=audio.ctx.nodes.slice(index);audio.ctx.currentTime+=2;audio.click();
  assert.equal(audio.voices.size,1);assert.ok(ended.every(node=>node.disconnected));
});

test('consecutive runs stop old voices and reset throttles without creating another healthy context',()=>{
  const {audio,contexts}=fixture();audio.init();
  for(let run=0;run<12;run++){
    audio.hit(1,1);audio.kt(330,10,{vib:[8,.1]});
    audio.dens.set('test',{t:audio.ctx.currentTime,n:100});
    assert.ok(audio.voices.size>0);const active=audio.ctx.nodes.filter(node=>node.onended);
    audio.beginRun();
    assert.equal(audio.voices.size,0);assert.equal(audio.lastPlay.size,0);assert.equal(audio.dens.size,0);
    assert.ok(active.every(node=>node.disconnected&&node.stops>0));
    assert.equal(contexts.length,1);
    audio.hit(1,1);assert.ok(audio.voices.size>0);
  }
});

test('restart detects a running native context with a stalled clock and rebuilds once',()=>{
  const {audio,contexts,timer}=fixture();audio.init();const previous=audio.ctx;
  audio.beginRun();timer();timer();
  assert.equal(contexts.length,2);assert.notEqual(audio.ctx,previous);assert.equal(previous.closeCount,1);
  audio.click();assert.equal(audio.voices.size,1);
});

test('restart retains an advancing clock and clears a stale hidden gain schedule',()=>{
  const {audio,contexts,timer,document}=fixture();audio.init();
  document.hidden=true;audio.setHiddenMute(true);audio.click();assert.equal(audio.voices.size,0);
  document.hidden=false;const cancellations=audio.master.gain.cancelled;
  audio.beginRun();timer();audio.ctx.currentTime+=.5;timer();
  assert.equal(contexts.length,1);assert.equal(audio.hiddenMute,false);
  assert.equal(audio.master.gain.value,audio.vol.master);assert.ok(audio.master.gain.cancelled>cancellations);
  audio.click();assert.equal(audio.voices.size,1);
});

test('late resume from an old context cannot reset the rebuilt master gain',async()=>{
  const {audio}=fixture();audio.init();const previous=audio.ctx;let finish;
  previous.state='suspended';previous.resume=()=>new Promise(resolve=>finish=resolve);
  audio.wake();audio.rebuild();audio.master.gain.value=.123;finish();await Promise.resolve();
  assert.equal(audio.master.gain.value,.123);assert.notEqual(audio.ctx,previous);
});

test('only a run preloads files, individual failures keep synth audio and only missing files retry',async()=>{
  const reads=[];
  const {audio}=fixture(async file=>{
    const first=!reads.includes(file);
    reads.push(file);
    if(first && file==='sfx/hit-normal.wav')throw Error('missing file');
    return clipResponse;
  });
  audio.init();await audio.preloadCombat();assert.equal(reads.length,0);
  audio.beginRun();const pending=audio.preloadCombat();
  assert.equal(pending,audio.preloadCombat());await pending;
  assert.equal(audio.voices.size,0);
  assert.equal(audio.combatClips.size,combatClipIds.length-1);
  assert.equal(audio.combatClips.has('hit:normal'),false);
  audio.hit(1,false);
  assert.equal(audio.voices.size,2);
  const cached=audio.combatClips.get('coin');
  audio.beginRun();
  await audio.preloadCombat();
  assert.equal(reads.length,combatClipIds.length+1);
  assert.equal(reads.at(-1),'sfx/hit-normal.wav');
  assert.equal(audio.combatClips.size,combatClipIds.length);
  assert.equal(audio.combatClips.get('coin'),cached);
  audio.hit(1,false);audio.hit(1,false);
  assert.equal(audio.voices.size,1);
  const buffer=audio.combatClips.get('hit:normal');
  audio.beginRun();audio.hit(1,true,true);
  assert.equal(audio.voices.size,2);
  assert.equal(audio.combatClips.get('hit:normal'),buffer);
  assert.equal(reads.length,combatClipIds.length+1);
});

test('every shipped file plays exactly once for its event, and menu actions do not use the run cache',async()=>{
  const {audio}=fixture();
  audio.beginRun();await audio.preloadCombat();
  assert.deepEqual(combatSoundEvents.map(e=>e.key).sort(),[...combatClipIds].sort());
  const files=fs.readdirSync(new URL('../../resources/public/assets/sfx/',import.meta.url),{withFileTypes:true})
    .filter(entry=>entry.isFile()).map(entry=>entry.name).sort();
  assert.deepEqual(files,Object.values(manifest.files).sort());
  for(const {key,method,args} of combatSoundEvents){
    audio.resetEffects();audio.ctx.nodes.length=0;
    if(key==='mega')audio.lastPlay.set('hit',audio.ctx.currentTime);
    audio[method](...args);
    assert.equal(audio.voices.size,1,key);
    assert.equal(audio.ctx.nodes.filter(n=>n.buffer).length,1,key);
    assert.equal(audio.ctx.nodes.find(n=>n.buffer).buffer,audio.combatClips.get(key),key);
    assert.ok(audio.ctx.nodes.every(n=>n.type==='buffer'||n.type==='gain'),key);
  }
  audio.endRun();audio.ctx.nodes.length=0;audio.coin();
  assert.ok(audio.ctx.nodes.some(n=>n.type==='square'));
  assert.ok(audio.ctx.nodes.every(n=>n.buffer!==audio.combatClips.get('coin')));
});

test('menu buttons use their own local sounds before, during and after a run',async()=>{
  const reads=[];
  const {audio}=fixture(async file=>{
    reads.push(file);
    if(file.startsWith('sfx/ui/')){
      const wav=fs.readFileSync(new URL('../../resources/public/assets/'+file,import.meta.url));
      assert.equal(wav.toString('ascii',8,12),'WAVE');
    }
    return clipResponse;
  });
  audio.init();audio.click('tap');
  assert.equal(audio.voices.size,1,'the first tap has a sound while files are loading');
  const load=audio.preloadUi();
  assert.equal(audio.preloadUi(),load);
  await load;
  assert.deepEqual(reads,Object.values(buttonSoundFiles).map(file=>'sfx/'+file));
  for(const [kind,transition] of [['confirm',()=>{}],['tap',()=>audio.beginRun()],['back',()=>audio.endRun()]]){
    transition();audio.ctx.currentTime+=.2;
    audio.click(kind);audio.click();
    assert.equal(audio.voices.size,1,'a legacy click handler shares the same feedback');
    const source=audio.ctx.nodes.findLast(node=>node.buffer);
    assert.equal(source.buffer,audio.uiClips.get(kind));
  }
  await audio.preloadCombat();
  for(const settings of [{sfx:0},{sfx:1,master:0}]){
    audio.ctx.currentTime+=.2;audio.setVolumes(settings);
    const count=audio.ctx.nodes.length;
    audio.click('confirm');assert.equal(audio.ctx.nodes.length,count);
  }
});

test('mid-battle stalled clock rebuilds after startup and interruption recovery respects mute',async()=>{
  const {audio,contexts,timer,timers,emit}=fixture();
  audio.beginRun();
  timer();audio.ctx.currentTime+=.5;timer(); // Healthy startup, then a later stall.
  timer();timer();
  await audio.preloadCombat();
  assert.equal(contexts.length,2);
  audio.boom(1);
  assert.equal(audio.voices.size,1);
  emit('audiointerruptionbegin');
  assert.equal(timers.size,1);
  audio.ctx.state='suspended';audio.click();assert.equal(audio.voices.size,1);
  audio.setVolumes({master:0});
  emit('audiointerruptionend');audio.click();
  assert.equal(audio.ctx.state,'running');assert.equal(audio.master.gain.value,0);
  assert.equal(audio.voices.size,1);
  audio.setVolumes({master:1});audio.hit(.5,true);
  assert.equal(audio.voices.size,2);
  audio.endRun();assert.equal(timers.size,0);assert.equal(audio.voices.size,0);
});

test('native session can resume without delivering its interruption-end event',async()=>{
  const {audio,contexts,timer,emit}=fixture();
  audio.beginRun();await audio.preloadCombat();
  emit('audiointerruptionbegin');
  audio.ctx.state='suspended';timer();audio.coin();
  assert.equal(audio.voices.size,0);assert.equal(contexts.length,1);
  audio.ctx.state='running';timer();audio.ctx.currentTime+=.5;timer();
  audio.ctx.currentTime+=.5;audio.coin();assert.equal(audio.voices.size,1);
  assert.equal(audio.interrupted,false);assert.equal(contexts.length,1);
});

test('a native clock reset clears stale voice deadlines and combat throttles',async()=>{
  const {audio}=fixture();audio.beginRun();await audio.preloadCombat();
  audio.ctx.currentTime=270;audio.hit(1,false);audio.move('ember','cast');
  const old=Array.from(audio.voices);
  audio.ctx.currentTime=.02;audio.move('ember','cast');audio.hit(1,false);
  assert.ok(old.every(voice=>!audio.voices.has(voice)));
  assert.equal(audio.voices.size,2);
});

test('repeated native source failures on an advancing clock recover without dropping the files',async()=>{
  const {audio,contexts,timer}=fixture();audio.beginRun();await audio.preloadCombat();
  const previous=audio.ctx,clip=audio.combatClips.get('coin');
  previous.createBufferSource=()=>{throw Error('device out of sources');};
  for(let i=0;i<3;i++){previous.currentTime+=.1;audio.coin();}
  assert.equal(audio.combatClips.get('coin'),clip);
  timer();await audio.preloadCombat();
  assert.equal(contexts.length,2);audio.coin();assert.equal(audio.voices.size,1);
});

test('sustained rapid casts remain audible and regain full volume between waves',async()=>{
  const {audio}=fixture();audio.beginRun();await audio.preloadCombat();
  for(let i=0;i<2700;i++){
    audio.ctx.currentTime+=.1;audio.ctx.nodes.length=0;audio.move('ember','cast');
  }
  const gain=audio.ctx.nodes.find(n=>n.type==='gain');assert.ok(gain.gain.value>=.40);
  audio.ctx.currentTime+=3;audio.ctx.nodes.length=0;audio.move('ember','cast');
  assert.equal(audio.ctx.nodes.length,1);
});

test('a delayed read from a replaced context cannot overwrite the new clips',async()=>{
  let finish;
  const {audio}=fixture(()=>finish?clipResponse:new Promise(resolve=>{finish=resolve;}));
  audio.beginRun();const oldLoad=audio.clipLoad;await Promise.resolve();
  audio.rebuild();await audio.preloadCombat();
  const clips=audio.combatClips;
  finish(clipResponse);await oldLoad;
  assert.ok(clips?.size);assert.equal(audio.combatClips,clips);
});

test('fifteen minutes of hits without native ended callbacks stay bounded and audible after restart',async()=>{
  const {audio}=fixture();audio.beginRun();await audio.preloadCombat();
  const ctx=audio.ctx;
  for(let frame=0;frame<15*60*20;frame++){
    ctx.currentTime+=.05;ctx.nodes.length=0;
    audio.hit(frame%3,frame%4===0,frame%20===0);audio.boom(.7);
    assert.ok(ctx.nodes.some(n=>n.type==='buffer'&&n.buffer),'hit still starts a source');
    assert.ok(audio.voices.size<=audio.maxVoices);
  }
  audio.endRun();audio.beginRun();audio.boom(1);assert.equal(audio.voices.size,1);
});

test('a temporary native startup failure leaves gameplay running and recovers without another tap',async()=>{
  const {audio,timer}=fixture();
  const build=audio.build.bind(audio);
  let attempts=0;
  audio.build=()=>{if(++attempts===1)throw Error('device unavailable');build();};
  audio.beginRun();assert.equal(audio.ctx,null);
  timer();await audio.preloadCombat();
  audio.hit(1,false);
  assert.equal(attempts,2);assert.equal(audio.voices.size,1);
});
