import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped synth itself without loading the renderer and game data.
const source=fs.readFileSync(new URL('../../source/src/game.js',import.meta.url),'utf8');
const start=source.indexOf('  N = new (class {')+'  N = '.length;
const end=source.indexOf('  Gs = (e, t, n)',start);
const synth=source.slice(start,end).trim().replace(/,$/,'');

function fixture() {
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
    createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
    resume(){this.state='running';return Promise.resolve();}
    close(){this.closeCount=(this.closeCount||0)+1;this.state='closed';this.onstatechange?.();return Promise.resolve();}
  }
  const document={hidden:false,addEventListener(){}};
  const env={AudioContext:Context,document,navigator:{},Ws:()=>false,performance:{now:()=>10000},
    matchMedia:()=>({matches:true}),addEventListener(){},clearTimeout:id=>timers.delete(id),
    setTimeout:callback=>{const id=++nextTimer;timers.set(id,callback);return id;},
    setInterval(){return 1;},clearInterval(){},backgroundMusicEnabled:false};
  env.window=env;
  const audio=vm.runInNewContext(synth,env);
  const timer=()=>{const [id,callback]=timers.entries().next().value;timers.delete(id);callback();};
  return {audio,contexts,document,timer};
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
  for(let i=0;i<100;i++)audio.click();
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
