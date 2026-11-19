import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const text=fs.readFileSync(new URL('../source/src/game.js',import.meta.url),'utf8');
const start=text.indexOf('  N = new (class {')+'  N = '.length;
const synth=text.slice(start,text.indexOf('  Gs = (e, t, n)',start)).trim().replace(/,$/,'');
const browser=await puppeteer.launch({
  executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],
});
try {
  const page=await browser.newPage();
  const result=await page.evaluate(async synth=>{
    // Use Chrome's real Web Audio DSP, with a virtual running state so the
    // normal voice guard permits scheduling before offline rendering starts.
    const OriginalContext=window.AudioContext;
    let raw;
    window.AudioContext=class {
      constructor(){
        raw=new OfflineAudioContext(1,48000,48000);
        return new Proxy(raw,{get(target,key){
          if(key==='state')return 'running';
          const value=Reflect.get(target,key,target);
          return typeof value==='function'?value.bind(target):value;
        },set(target,key,value){return Reflect.set(target,key,value,target);}});
      }
    };
    window.Ws=()=>false;window.backgroundMusicEnabled=false;
    async function render(restarts,sfx=.7,battle=false){
      const audio=(0,eval)(synth);audio.init();audio.setVolumes({sfx});
      for(let i=0;i<restarts;i++){
        audio.bossStart();audio.kt(330,10,{w:'sawtooth',vib:[8,.1]});audio.beginRun();
      }
      audio.click();
      if(battle){audio.hit(1,1);audio.boom(.9);audio.kt(330,.25,{w:'sawtooth'});audio.kn(.2);}
      const buffer=await raw.startRendering(),samples=buffer.getChannelData(0);
      let energy=0,peak=0;for(const value of samples){energy+=value*value;peak=Math.max(peak,Math.abs(value));}
      clearTimeout(audio.aliveTimer);
      return {rms:Math.sqrt(energy/samples.length),peak,remainingVoices:audio.voices.size};
    }
    const first=await render(0),second=await render(1),twelfth=await render(11);
    const oldGain=await render(0,.7/1.8),muted=await render(1,0,true);
    const battle=await render(0,.7,true),loudBattle=await render(0,1,true);
    window.AudioContext=OriginalContext;
    return {first,second,twelfth,oldGain,muted,battle,loudBattle,gainRatio:first.rms/oldGain.rms};
  },synth);
  for(const key of ['first','second','twelfth','battle','loudBattle']){
    assert.ok(result[key].rms>1e-4,`${key}: audible waveform`);
    assert.ok(result[key].peak<1,`${key}: no clipped samples`);
    assert.equal(result[key].remainingVoices,0,`${key}: nodes released`);
  }
  assert.ok(Math.abs(result.second.rms-result.first.rms)<1e-7);
  assert.ok(Math.abs(result.twelfth.rms-result.first.rms)<1e-7);
  assert.ok(result.gainRatio>1.7&&result.gainRatio<1.9);
  assert.equal(result.muted.rms,0);
  console.log(JSON.stringify({passed:true,...result},null,2));
} finally {await browser.close();}
