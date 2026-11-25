import {createAudioSource as synth} from '../build/audio-fixture.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {zipSync, strToU8} from 'fflate';
import {combatSoundEvents} from './combat-sound-events.mjs';
import {EVOLUTION_REVEAL} from '../../source/src/effects/evolution-timing.js';

// Render the shipped recipes before the player's volume controls and compressor.
// The original kit EQ is baked into the move sounds. Playback uses the SFX bus.
const root = new URL('../../', import.meta.url);
const rate = 24000;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const clips = await page.evaluate(async ({synth, rate, events}) => {
    let raw, seed = 17391;
    let duration;
    Math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    window.AudioContext = class {
      constructor() {
        raw = new OfflineAudioContext(1, Math.ceil(rate * duration), rate);
        return new Proxy(raw, {
          get(target, key) {
            if (key === 'state') return 'running';
            const value = Reflect.get(target, key, target);
            return typeof value === 'function' ? value.bind(target) : value;
          },
          set: (target, key, value) => Reflect.set(target, key, value, target),
        });
      }
    };
    const make = () => (0,eval)(synth), clips = {};
    async function record({key:name, method, args}) {
      duration = method === 'evolve' ? args[0] + 1 : 3;
      const audio = make();
      audio.build();
      audio.maxVoices = Infinity;
      audio.sfxBus.disconnect();
      audio.sfxBus.gain.setValueAtTime(1, 0);
      audio.sfxBus.connect(raw.destination);
      if (name === 'mega') audio.lastPlay.set('hit', 0);
      if (method === 'move') {
        // Render the neutral pitch. The live move applies its own pitch variation.
        const random = Math.random;
        Math.random = () => { Math.random = random; return .5; };
      }
      audio[method](...args);
      const data = (await raw.startRendering()).getChannelData(0);
      let last = data.length - 1;
      while (last >= 0 && Math.abs(data[last]) < 1 / 65536) last--;
      if (last < 0 || last + 120 >= data.length) throw Error('Empty or truncated sound: ' + name);
      clips[name] = Array.from(data.subarray(0, last + 121), value => {
        if (Math.abs(value) >= 1) throw Error('Clipping: ' + name);
        return Math.round(value * 32767);
      });
    }
    for (const event of events) await record(event);
    return clips;
  }, {synth, rate, events:combatSoundEvents});
  const directory = new URL('resources/public/assets/sfx/', root);
  fs.mkdirSync(directory, {recursive:true});
  const manifestPath = new URL('resources/public/config/combat-audio.json', root);
  const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const inventory = ['局内常用音效', '', '按原始采样时长选格式。1 秒及以内使用 WAV，超过 1 秒使用 AAC（M4A）。', '',
    '文件名    原始时长    游戏事件'];
  const files = {}, archive = {};
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-sfx-'));
  try {
    for (const {key, use} of combatSoundEvents) {
      const samples = clips[key];
      const short = samples.length <= rate;
      const file = key.replace(':','-') + (short ? '.wav' : '.m4a');
      const target = path.join(temp, file);
      const codec = short ? ['-c:a','pcm_s16le'] : ['-c:a','aac','-profile:a','aac_low','-b:a','48k','-movflags','+faststart'];
      execFileSync(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-hide_banner','-loglevel','error','-f','s16le','-ar',String(rate),'-ac','1','-i','pipe:0',
        ...codec,'-bitexact',target,
      ], {input:Buffer.from(Int16Array.from(samples).buffer), windowsHide:true});
      files[key] = file;
      archive['sfx/' + file] = fs.readFileSync(target);
      inventory.push(file + '    ' + (samples.length / rate).toFixed(4) + ' 秒    ' + use);
    }
    const manifest = {evolutionSeconds:EVOLUTION_REVEAL, files};
    const listing = inventory.join('\n') + '\n';
    archive['局内音效清单.txt'] = strToU8(listing);
    const zip = zipSync(archive);
    for (const file of Object.values(files)) fs.writeFileSync(new URL(file, directory), archive['sfx/' + file]);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2) + '\n');
    fs.writeFileSync(new URL('resources/局内音效清单.txt',root), listing);
    fs.mkdirSync(new URL('验收/',root), {recursive:true});
    fs.writeFileSync(new URL('验收/局内常用音效.zip',root), zip);
    const oldFiles = previous.files ? Object.values(previous.files) : (previous.keys ?? []).map(k => k.replace(':','-') + '.mp3');
    const current = new Set(Object.values(files));
    for (const file of oldFiles) {
      if (!current.has(file) && /^[\w.-]+\.(mp3|m4a|wav)$/.test(file)) fs.rmSync(new URL(file,directory), {force:true});
    }
    console.log(current.size + ' combat clips, ' + [...current].filter(file => file.endsWith('.m4a')).length + ' AAC');
  } finally {
    for (const file of fs.readdirSync(temp)) fs.unlinkSync(path.join(temp,file));
    fs.rmdirSync(temp);
  }
} finally { await browser.close(); }
