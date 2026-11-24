import assert from 'node:assert/strict';
import {combatSoundEvents} from '../art/combat-sound-events.mjs';
import manifest from '../../resources/public/config/combat-audio.json' with {type:'json'};

export async function reviewCombatAudio(page) {
  const result = await page.evaluate(async (events, files) => {
    const audio = app.run.audio;
    await audio.preloadCombat();
    if (audio.combatClips?.size !== events.length) throw Error('Packaged combat audio failed to preload');
    const clips = audio.combatClips;
    for (const {key,method,args} of events) {
      audio.resetEffects();
      if (key === 'mega') audio.lastPlay.set('hit', audio.ctx.currentTime);
      const expected = clips.get(key);
      if (!expected?.getChannelData(0).some(v => Math.abs(v) > .001)) throw Error('Empty file: ' + key);
      const format = expected.duration <= 1 ? '.wav' : '.m4a';
      if (!files[key].endsWith(format)) throw Error('Incorrect format for decoded duration: ' + key);
      const track = audio.addVoice;
      const played = [];
      audio.addVoice = function(end,source,...rest) {
        played.push(source.buffer);
        return track.call(this,end,source,...rest);
      };
      try { audio[method](...args); } finally { audio.addVoice = track; }
      if (played.length !== 1 || played[0] !== expected) throw Error('Incorrect event sound: ' + key);
    }
    function emberCount(cached) {
      audio.resetEffects();
      audio.combatClips = cached ? clips : null;
      let nodes = 0;
      const track = audio.addVoice;
      audio.addVoice = function(end,source,chain,...args) {
        nodes += chain.length;
        return track.call(this,end,source,chain,...args);
      };
      try {
        audio.move('ember','cast');
        return nodes;
      } finally {
        audio.combatClips = clips;
        audio.addVoice = track;
        audio.resetEffects();
      }
    }
    const before = emberCount(false), after = emberCount(true);
    const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
    // Time the JS work of scheduling one crowded combat frame. Resetting the
    // voices and advancing to the next simulated event are outside the timing.
    function sampleDispatch(cached) {
      audio.combatClips = cached ? clips : null;
      let elapsed = 0;
      for (let n = 0; n < 8; n++) {
        audio.resetEffects();
        const start = performance.now();
        audio.move('ember','cast'); audio.hit(1,true); audio.xp(5); audio.pop(); audio.streak(8);
        elapsed += performance.now() - start;
      }
      return elapsed / 8;
    }
    const costs = [[],[]];
    try {
      for (let n = 0; n < 25; n++) {
        // Alternate order and discard the first pair to account for warmup.
        for (const cached of n % 2 ? [true,false] : [false,true]) {
          const ms = sampleDispatch(cached);
          if (n) costs[Number(cached)].push(ms);
        }
        await wait(12);
      }
    } finally { audio.combatClips = clips; audio.resetEffects(); }
    const medianDispatchMs = costs.map(list => {
      list.sort((a,b) => a-b);
      return (list[11]+list[12])/2;
    });
    async function listen(ms) {
      const analyser = audio.ctx.createAnalyser(), data = new Float32Array(2048);
      audio.master.connect(analyser);
      const since = performance.now(); let peak = 0;
      try {
        do {
          audio.move('ember','cast'); audio.hit(1,true); audio.boom(.65); audio.xp(7); audio.pop();
          await wait(48);
          analyser.getFloatTimeDomainData(data);
          for (const v of data) peak = Math.max(peak,Math.abs(v));
        } while (performance.now()-since < ms);
        return peak;
      } finally { audio.master.disconnect(analyser); analyser.disconnect(); }
    }
    const peaks = [await listen(1000), await listen(8000), await listen(1000)];
    fixtureHide();
    fixtureAudioInterruptionBegin();
    await audio.ctx.suspend();
    fixtureAudioInterruptionEnd();
    fixtureShow();
    peaks.push(await listen(1000));
    const old = audio.ctx;
    await old.close(); // Simulate the native device discarding the whole context.
    for (let i=0;i<80 && audio.ctx===old;i++) await wait(100);
    if (audio.ctx===old) throw Error('Audio context failed to recover during combat');
    await audio.preloadCombat();
    if (audio.combatClips?.size!==events.length) throw Error('New context did not reload the clips');
    peaks.push(await listen(1000));
    for (let n=0; n<12; n++) {
      audio.endRun(); audio.beginRun();
      audio.move('fire-blast','cast'); audio.move('fire-blast','impact');
    }
    peaks.push(await listen(1000));
    await wait(900);
    return {files:clips.size, before, after, medianDispatchMs, peaks, remainingVoices:audio.voices.size};
  },combatSoundEvents,manifest.files);
  assert.equal(result.before,17);
  assert.equal(result.after,1);
  assert.equal(result.remainingVoices,0);
  for(const peak of result.peaks) assert.ok(peak>.001,'Audible combat waveform after each transition');
  console.log('Packaged audio verified',result);
}
