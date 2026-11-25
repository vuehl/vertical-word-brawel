import {combatClipIds, combatEvolutionSeconds, loadAudioClips, loadCombatClips} from "./audio-clips.js";
import {buttonSoundFiles} from "../ui/button-audio.js";
import {h as Zt} from "../data/config.js";
import {moveSounds as Ls} from "./move-sounds.js";

var Rs = {
    menu: { loop: 70.17733333333334 },
    "halloween-menu": { loop: 56.342666666666666 },
    ingame1: { loop: 79.93333333333334 },
    ingame2: { loop: 48.384 },
    ingame3: { loop: 47.844 },
    ingame4: { loop: 65.428 },
    boss: { loop: 8.959333333333333 },
  },
  zs = (e) => e in Rs,
  Bs = [`ingame1`, `ingame2`, `ingame3`, `ingame4`],
  Vs = 0.75,
  Hs = 0.18;
function Us(e) {
  let t = e.getChannelData(0),
    n = Math.max(1, Math.round(e.sampleRate * 0.05)),
    r = 0;
  for (let e = 0; e + n <= t.length; e += n) {
    let i = 0;
    for (let r = e; r < e + n; r++) i += t[r] * t[r];
    r = Math.max(r, i / n);
  }
  let i = Math.sqrt(r);
  return i > 1e-4 ? Math.max(0.3, Math.min(1.6, Hs / i)) : 1;
}
var Ws = () =>
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === `MacIntel` && navigator.maxTouchPoints > 1);

export class GameAudio {
    ctx = null;
    master;
    sfxBus;
    kitBus;
    musicBus;
    cryBus;
    noiseBuf;
    combatClips = null;
    clipLoad = null;
    uiClips = new Map();
    uiClipLoad = null;
    inRun = false;
    interrupted = false;
    cries = new Map();
    cryGain = new Map();
    lastPlay = new Map();
    voices = new Set();
    lastWake = 0;
    lastEffectTime = -1;
    failedClipStarts = 0;
    effectTime() {
      const now = this.ctx.currentTime;
      // A restored native device can restart its clock on the same JS context.
      if (now + .05 < this.lastEffectTime) this.resetEffects();
      this.lastEffectTime = now;
      return now;
    }
    voiceFree() {
      let e = this.ctx;
      if (!e || this.interrupted || this.hiddenMute || this.vol.master <= 0) return !1;
      if (e.state !== `running`) {
        let e = performance.now();
        return (e - this.lastWake > 1e3 && !document.hidden && ((this.lastWake = e), this.wake()), !1);
      }
      // Native Web Audio can delay onended. Also reclaim by audio time so
      // finished filter/gain chains cannot accumulate across long battles.
      const now = this.effectTime();
      for (const voice of this.voices) if (voice.end <= now) voice.stop();
      return this.voices.size < this.maxVoices;
    }
    addVoice(end, source, nodes, extraSources = []) {
      const voice = { end, release: () => {
        if (!this.voices.delete(voice)) return;
        source.onended = null;
        for (const node of nodes) {
          try { node.disconnect(); } catch {}
        }
      }, stop: () => {
        for (const node of [source, ...extraSources]) {
          try { node.stop(); } catch {}
        }
        voice.release();
      }};
      this.voices.add(voice);
      source.onended = voice.release;
    }
    resetEffects() {
      for (const voice of this.voices) voice.stop();
      this.lastPlay.clear();
      this.dens.clear();
      this.kv = this.kp = 1;
      this.lastEffectTime = -1;
    }
    beginRun() {
      this.inRun = true;
      this.resetEffects();
      this.init();
      this.preloadCombat();
      // A new run shares the audio engine, but not the previous run's voices,
      // gain automation or stale native playback state.
      this.setHiddenMute(document.hidden && this.hiddenMute);
      this.applyVolumes();
      this.checkAlive();
    }
    endRun() {
      this.inRun = false;
      clearTimeout(this.aliveTimer);
      this.resetEffects();
    }
    async readSoundClip(file) {
      const response = await fetch(Zt('sfx/' + file));
      if (!response.ok) throw Error(file);
      return response.arrayBuffer();
    }
    preloadUi() {
      const ctx = this.ctx;
      if (!ctx || this.uiClipLoad || this.uiClips.size === Object.keys(buttonSoundFiles).length) return this.uiClipLoad;
      this.uiClipLoad = loadAudioClips(ctx, this.uiClips, buttonSoundFiles,
        file => this.readSoundClip(file), () => this.ctx === ctx).finally(() => {
        if (this.ctx === ctx) this.uiClipLoad = null;
      });
      return this.uiClipLoad;
    }
    preloadCombat() {
      const ctx = this.ctx;
      if (!ctx || !this.inRun || this.clipLoad || this.combatClips?.size === combatClipIds.length) return this.clipLoad;
      const clips = this.combatClips ??= new Map();
      this.clipLoad = loadCombatClips(ctx, clips, file => this.readSoundClip(file),
        () => this.ctx === ctx && this.inRun).finally(() => {
        if (this.ctx === ctx) this.clipLoad = null;
      });
      return this.clipLoad;
    }
    playClip(key, volume = 1, rate = 1) {
      if (!this.inRun) return false;
      return this.playSoundBuffer(this.combatClips?.get(key), volume, rate);
    }
    playSoundBuffer(buffer, volume, rate) {
      if (!buffer) return false;
      if (!this.voiceFree() || volume <= 0 || this.vol.sfx <= 0) return true;
      const ctx = this.ctx;
      let source, gain;
      try {
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        if (volume === 1) source.connect(this.sfxBus);
        else {
          gain = ctx.createGain();
          gain.gain.value = volume;
          source.connect(gain);
          gain.connect(this.sfxBus);
        }
        const now = ctx.currentTime;
        source.start(now);
        this.addVoice(now + buffer.duration / rate + .05, source, gain ? [source, gain] : [source]);
        this.failedClipStarts = 0;
        return true;
      } catch {
        try { source?.stop(); } catch {}
        try { source?.disconnect(); gain?.disconnect(); } catch {}
        // The buffer was already decoded. A native source failure can affect
        // every file until the audio device is reopened.
        this.failedClipStarts++;
        return false;
      }
    }
    maxVoices = typeof matchMedia == `function` && matchMedia(`(pointer: coarse)`).matches ? 26 : 56;
    dens = new Map();
    kv = 1;
    kp = 1;
    vol = { master: 1, music: 0.5, sfx: 1, cries: 0.6 };
    seqTimer = 0;
    nextNote = 0;
    step = 0;
    song = null;
    intensity = 0;
    musicOn = !1;
    trackBytes = new Map();
    track = null;
    trackWant = null;
    trackLoading = !1;
    get running() {
      return !!this.ctx && this.ctx.state === `running`;
    }
    hooked = !1;
    init() {
      this.hook();
      if (this.ctx) this.wake();
      else this.rebuild();
    }
    silentPlay = !1;
    setSilentPlay(e) {
      this.silentPlay = e;
      try {
        let t = navigator.audioSession;
        t && Ws() && (t.type = e ? `playback` : `ambient`);
      } catch {}
    }
    hook() {
      if (this.hooked) return;
      ((this.hooked = !0), this.setSilentPlay(this.silentPlay));
      const foreground = () => {
        if (document.hidden) return;
        this.interrupted = false;
        this.setHiddenMute(false);
        this.wake();
        this.checkAlive();
      };
      let e = () => this.wake();
      addEventListener('audiointerruptionbegin', () => {
        this.interrupted = true;
        this.checkAlive(1000);
      });
      addEventListener('audiointerruptionend', () => {
        this.interrupted = false;
        if (!document.hidden) { this.wake(); this.checkAlive(); }
      });
      (addEventListener(`pointerdown`, e, !0),
        addEventListener(`keydown`, e, !0),
        addEventListener(`touchend`, e, !0),
        addEventListener(`click`, e, !0),
        document.addEventListener(`visibilitychange`, () => {
          if (!document.hidden) foreground();
        }),
        addEventListener(`focus`, foreground),
        addEventListener(`pageshow`, foreground),
        addEventListener(`pointerup`, e, !0));
    }
    aliveTimer = 0;
    checkAlive(delay = 600) {
      clearTimeout(this.aliveTimer);
      if (document.hidden) return;
      this.aliveTimer = window.setTimeout(() => {
        if (document.hidden) return;
        if (this.vol.master <= 0 || (this.vol.sfx <= 0 && !this.track && !this.musicOn)) {
          if (this.inRun) this.checkAlive(5000);
          return;
        }
        const ctx = this.ctx;
        if (!ctx || ctx.state === 'closed') { this.rebuild(); return; }
        if (this.interrupted && ctx.state !== 'running') {
          this.wake();
          if (this.inRun) this.checkAlive(1500);
          return;
        }
        if (this.failedClipStarts >= 3) { this.rebuild(); return; }
        if (ctx.state !== 'running') this.wake();
        const before = ctx.currentTime;
        this.aliveTimer = window.setTimeout(() => {
          if (this.ctx !== ctx || document.hidden) return;
          const advancing = ctx.state === 'running' && ctx.currentTime - before >= .1;
          if (this.interrupted) {
            if (advancing) this.interrupted = false;
            else if (ctx.state === 'running') { this.rebuild(); return; }
            if (this.inRun) this.checkAlive(advancing ? 5000 : 1500);
          } else if (!advancing) this.rebuild();
          else if (this.inRun) this.checkAlive(5000);
        }, 500);
      }, delay);
    }
    rebuild() {
      this.failedClipStarts = 0;
      this.interruptionResume = null;
      let e = this.ctx;
      let t = this.trackWant,
        n = this.song;
      ((this.track = null),
        (this.trackWant = null),
        (this.trackLoading = !1),
        this.resetEffects());
      clearTimeout(this.aliveTimer);
      if (e) e.onstatechange = null;
      this.ctx = null;
      this.combatClips = this.clipLoad = null;
      this.uiClips.clear();
      this.uiClipLoad = null;
      try {
        Promise.resolve(e?.close()).catch(() => {});
      } catch {}
      try {
        this.build();
      } catch {
        const failed = this.ctx;
        this.ctx = null;
        try { if (failed) { failed.onstatechange = null; Promise.resolve(failed.close()).catch(() => {}); } } catch {}
        if (this.inRun) this.checkAlive(5000);
        return;
      }
      if (this.inRun) { this.preloadCombat(); this.checkAlive(5000); }
      (n && (this.nextNote = this.ctx.currentTime + 0.1), t && this.playTrack(t));
    }
    build() {
      let e = new AudioContext();
      ((this.ctx = e),
        (e.onstatechange = () => {
          this.ctx === e && e.state !== `running` && !document.hidden && this.wake();
        }));
      let t = e.createDynamicsCompressor();
      ((t.threshold.value = -14),
        (t.ratio.value = 4),
        (t.attack.value = 0.003),
        (t.release.value = 0.2),
        (this.master = e.createGain()),
        this.master.connect(t),
        t.connect(e.destination),
        (this.sfxBus = e.createGain()),
        this.sfxBus.connect(this.master),
        (this.musicBus = e.createGain()),
        this.musicBus.connect(this.master));
      let n = e.createBiquadFilter();
      ((n.type = `highshelf`), (n.frequency.value = 2800), (n.gain.value = -7));
      let r = e.createBiquadFilter();
      ((r.type = `lowpass`),
        (r.frequency.value = 6e3),
        (r.Q.value = 0.5),
        (this.cryBus = e.createGain()),
        this.cryBus.connect(n),
        n.connect(r),
        r.connect(this.master));
      let i = e.createBiquadFilter();
      ((i.type = `highshelf`), (i.frequency.value = 2600), (i.gain.value = -6));
      let a = e.createBiquadFilter();
      ((a.type = `lowpass`),
        (a.frequency.value = 5200),
        (a.Q.value = 0.5),
        (this.kitBus = e.createGain()),
        this.kitBus.connect(i),
        i.connect(a),
        a.connect(this.sfxBus));
      let o = e.sampleRate;
      this.noiseBuf = e.createBuffer(1, o, e.sampleRate);
      let s = this.noiseBuf.getChannelData(0);
      for (let e = 0; e < o; e++) s[e] = Math.random() * 2 - 1;
      (this.applyVolumes(), e.state !== `running` && this.wake());
    }
    wake() {
      let e = this.ctx;
      if (!e || document.hidden) return;
      if (this.interrupted) {
        // The OS decides when a suspended device may resume. Never start
        // sources until its clock advances again or focus is returned.
        const now=performance.now();
        if(e.state==='suspended' && this.inRun && !this.hiddenMute && this.vol.master>0 &&
            this.interruptionResume!==e && now-this.lastWake>=1500){
          this.interruptionResume=e;this.lastWake=now;
          try {
            Promise.resolve(e.resume()).catch(()=>{}).finally(()=>{
              if(this.interruptionResume===e)this.interruptionResume=null;
            });
          } catch { this.interruptionResume=null; }
        }
        return;
      }
      if (e.state === `closed`) {
        this.rebuild();
        return;
      }
      let t = () => {
        if (this.ctx !== e || this.hiddenMute) return;
        let t = this.master.gain;
        (t.cancelScheduledValues(e.currentTime), t.setValueAtTime(this.vol.master, e.currentTime));
      };
      if (e.state === `running`) !this.hiddenMute && this.master.gain.value < this.vol.master * 0.5 && t();
      else {
        try {
          let t = e.createBufferSource();
          ((t.buffer = e.createBuffer(1, 1, 22050)),
            (t.onended = () => t.disconnect()), t.connect(e.destination), t.start(0));
        } catch {}
        try { return Promise.resolve(e.resume()).then(t).catch(() => {}); } catch {}
      }
    }
    setVolumes(e) {
      (Object.assign(this.vol, e), this.applyVolumes());
    }
    hiddenMute = !1;
    setHiddenMute(e) {
      if (e === this.hiddenMute || ((this.hiddenMute = e), !this.ctx)) return;
      let t = this.master.gain,
        n = this.ctx.currentTime;
      (t.cancelScheduledValues(n),
        t.setValueAtTime(t.value, n),
        t.linearRampToValueAtTime(e ? 0 : this.vol.master, n + 0.15));
    }
    applyVolumes() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (const [bus, value] of [
        [this.master, this.hiddenMute ? 0 : this.vol.master],
        [this.sfxBus, this.vol.sfx * 1.8],
        [this.musicBus, this.vol.music * 0.32],
        [this.cryBus, this.vol.cries * 0.45],
      ]) {
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(value, now);
      }
    }
    ok(e, t) {
      if (!this.ctx) return !1;
      let n = this.effectTime();
      return n - (this.lastPlay.get(e) ?? -1) < t ? !1 : (this.lastPlay.set(e, n), !0);
    }
    tone(e, t, n, r, i = 0, a = 0, o, s = 0.004) {
      if (this.voiceFree())
        try {
          this.toneNow(e, t, n, r, i, a, o, s);
        } catch {}
    }
    toneNow(e, t, n, r, i, a, o, s) {
      let c = this.ctx,
        l = c.currentTime + Math.max(0, a);
      r = Number.isFinite(r) ? Math.max(2e-4, r) : 2e-4;
      let u = c.createOscillator(),
        d = c.createGain();
      ((u.type = n),
        u.frequency.setValueAtTime(e, l),
        i && u.frequency.exponentialRampToValueAtTime(Math.max(20, e * i), l + t),
        d.gain.setValueAtTime(1e-4, l),
        d.gain.exponentialRampToValueAtTime(r, l + s),
        d.gain.exponentialRampToValueAtTime(1e-4, l + t),
        u.connect(d),
        d.connect(o ?? this.sfxBus),
        u.start(l),
        u.stop(l + t + 0.02),
        this.addVoice(l + t + 0.05, u, [u, d]));
    }
    noise(e, t, n, r = `lowpass`, i = 0, a = 0, o) {
      if (this.voiceFree())
        try {
          this.noiseNow(e, t, n, r, i, a, o);
        } catch {}
    }
    noiseNow(e, t, n, r, i, a, o) {
      let s = this.ctx,
        c = s.currentTime + i,
        l = s.createBufferSource();
      l.buffer = this.noiseBuf;
      let u = s.createBiquadFilter();
      ((u.type = r),
        u.frequency.setValueAtTime(n, c),
        a && u.frequency.exponentialRampToValueAtTime(Math.max(40, n * a), c + e));
      let d = s.createGain();
      (d.gain.setValueAtTime(t, c),
        d.gain.exponentialRampToValueAtTime(1e-4, c + e),
        l.connect(u),
        u.connect(d),
        d.connect(o ?? this.sfxBus),
        l.start(c, Math.random() * 0.5),
        l.stop(c + e + 0.02),
        this.addVoice(c + e + 0.05, l, [l, u, d]));
    }
    move(e, t, n = {}) {
      let r = Ls[e],
        i = r?.[t];
      if (!i) return !1;
      if (!this.ctx) return !0;
      let a = e + ':' + t,
        o = this.effectTime(),
        s = this.dens.get(a);
      if (s && o - s.t < (t === `cast` ? (r.gap ?? 0.045) : 0.045)) return !0;
      let c = s ? Math.min(6, Math.max(0, s.n - (o - s.t) * 3) + 1) : 1;
      return (
        this.dens.set(a, { t: o, n: c }),
        (this.kv = (n.v ?? 1) / Math.sqrt(c)),
        (this.kp = 0.95 + Math.random() * 0.1),
        this.playClip(a, this.kv, e === 'flamethrower' && t === 'cast' ? 1 / (n.dur || 1) : this.kp) || i(this, n),
        (this.kv = 1),
        (this.kp = 1),
        !0
      );
    }
    kt(e, t, n = {}) {
      let r = this.ctx;
      if (r && this.voiceFree())
        try {
          this.ktNow(r, e, t, n);
        } catch {}
    }
    ktNow(e, t, n, r) {
      let i = e.currentTime + (r.d ?? 0),
        a = Math.max(2e-4, (r.v ?? 0.1) * this.kv),
        o = Math.min(r.a ?? 0.005, n * 0.8);
      t *= this.kp;
      let s = e.createOscillator(),
        c = e.createGain();
      ((s.type = r.w ?? `sine`),
        s.frequency.setValueAtTime(t, i),
        r.to && s.frequency.exponentialRampToValueAtTime(Math.max(20, t * r.to), i + (r.sl ?? n)));
      let l = s;
      const nodes = [s, c], extraSources = [];
      if (r.lp || (s.type !== `sine` && s.type !== `triangle`)) {
        let t = e.createBiquadFilter();
        ((t.type = `lowpass`),
          (t.frequency.value = r.lp ?? 2e3),
          (t.Q.value = r.q ?? 0.7),
          s.connect(t),
          (l = t));
        nodes.push(t);
      }
      if (r.vib) {
        let a = e.createOscillator(),
          o = e.createGain();
        ((a.frequency.value = r.vib[0]),
          (o.gain.value = t * r.vib[1]),
          a.connect(o),
          o.connect(s.frequency),
          a.start(i),
          a.stop(i + n + 0.05));
        nodes.push(a, o);
        extraSources.push(a);
      }
      (c.gain.setValueAtTime(1e-4, i),
        c.gain.exponentialRampToValueAtTime(a, i + o),
        c.gain.exponentialRampToValueAtTime(1e-4, i + n),
        l.connect(c),
        c.connect(this.kitBus),
        s.start(i),
        s.stop(i + n + 0.03),
        this.addVoice(i + n + 0.05, s, nodes, extraSources));
    }
    kn(e, t = {}) {
      let n = this.ctx;
      if (n && this.voiceFree())
        try {
          this.knNow(n, e, t);
        } catch {}
    }
    knNow(e, t, n) {
      let r = e.currentTime + (n.d ?? 0),
        i = Math.max(2e-4, (n.v ?? 0.1) * this.kv),
        a = Math.min(n.a ?? 0.003, t * 0.8),
        o = (n.f ?? 1e3) * this.kp,
        s = e.createBufferSource();
      ((s.buffer = this.noiseBuf), (s.loop = !0));
      let c = e.createBiquadFilter();
      ((c.type = n.ft ?? `bandpass`),
        c.frequency.setValueAtTime(o, r),
        (c.Q.value = n.q ?? 1),
        n.to && c.frequency.exponentialRampToValueAtTime(Math.max(40, Math.min(9e3, o * n.to)), r + t));
      let l = e.createGain();
      (l.gain.setValueAtTime(1e-4, r),
        l.gain.exponentialRampToValueAtTime(i, r + a),
        l.gain.exponentialRampToValueAtTime(1e-4, r + t),
        s.connect(c),
        c.connect(l),
        l.connect(this.kitBus),
        s.start(r, Math.random() * 0.4),
        s.stop(r + t + 0.03),
        this.addVoice(r + t + 0.05, s, [s, c, l]));
    }
    hit(e, t, n = !1) {
      if (n && this.ok('mega', .09) && !this.playClip('mega')) {
        this.tone(1568, .1, 'triangle', .13, 1.2);
        this.tone(2093, .14, 'sine', .1, 1, .05);
        this.tone(110, .16, 'sine', .2, .5);
      }
      if (!this.ok('hit', .035)) return;
      const impact = e > 1.01 ? 'strong' : e < .99 ? 'weak' : 'normal';
      if (this.combatClips && this.playClip((t ? 'crit:' : 'hit:') + impact, 1, .95 + Math.random() * .1)) return;
      let r = e > 1.01 ? 520 : e < 0.99 ? 220 : 360;
      (this.tone(r * (0.9 + Math.random() * 0.2), 0.07, `square`, 0.12, 0.5),
        this.noise(0.05, 0.15, 3e3, `highpass`),
        t && this.tone(1200, 0.12, `triangle`, 0.12, 1.5, 0.01));
    }
    pop() {
      if (!this.ok('pop', .03) || this.playClip('pop', 1, .85 + Math.random() * .3)) return;
      this.tone(700 + Math.random() * 300, 0.08, `sine`, 0.12, 2);
    }
    xp(e = 1) {
      if (!this.ok(`xp`, 0.035)) return;
      if (this.playClip('xp:' + Math.min(e, 15))) return;
      let t = [0, 2, 4, 7, 9],
        n = Math.min(e - 1, 14),
        r = 784 * 2 ** ((t[n % 5] + 12 * Math.floor(n / 5)) / 12);
      (this.tone(r, 0.08, `triangle`, 0.09, 1.02), this.tone(r * 2, 0.05, `sine`, 0.035, 1, 0.015));
    }
    coin() {
      if (!this.ok('coin', .05) || this.playClip('coin')) return;
      this.tone(1319, 0.06, `square`, 0.06); this.tone(1976, 0.18, `square`, 0.06, 1, 0.06);
    }
    heal() {
      if (this.playClip('heal')) return;
      this.ctx && [523, 659, 784, 1047].forEach((e, t) => this.tone(e, 0.25, `triangle`, 0.1, 1, t * 0.06));
    }
    charge(e) {
      if (!this.ok('charge', .22) || this.playClip('charge', 1, 2 ** ((e - .5) * 1.5))) return;
      let t = 330 * 2 ** (e * 1.5);
      (this.tone(t, 0.2, `sine`, 0.05, 1.04), this.tone(t * 1.5, 0.14, `triangle`, 0.02, 1, 0.03));
    }
    overtake() {
      this.ok(`overtake`, 0.4) &&
        (this.tone(880, 0.09, `square`, 0.045), this.tone(1319, 0.16, `square`, 0.045, 1, 0.08));
    }
    power() {
      if (this.playClip('power')) return;
      this.ctx &&
        [392, 523, 659, 784, 1047].forEach((e, t) => this.tone(e, 0.2, `square`, 0.06, 1, t * 0.05));
    }
    boom(e = 1) {
      if (!this.ok('boom', .06)) return;
      if (this.combatClips && e >= .2 && e <= 1.2) {
        const base = e < .5 ? .35 : e < .85 ? .65 : 1;
        if (this.playClip('boom:' + base, (1 + e) / (1 + base), (.35 + base * .3) / (.35 + e * .3))) return;
      }
      this.noise(.35 + e * .3, .4 * (.5 + e * .5), 1200, 'lowpass', 0, .1);
      this.tone(110, .3 + e * .2, 'sine', .35 * e, .3);
    }
    shot(e, t = 0.5) {
      this.ok(`shot` + e, 0.05) &&
        (
          {
            fire: () => this.noise(0.18, 0.18 * t, 2500, `bandpass`, 0, 0.3),
            water: () => {
              (this.tone(600, 0.12, `sine`, 0.12 * t, 0.4), this.noise(0.1, 0.08 * t, 1800, `bandpass`));
            },
            electric: () => {
              (this.tone(1400, 0.08, `sawtooth`, 0.07 * t, 0.3), this.noise(0.06, 0.1 * t, 5e3, `highpass`));
            },
            grass: () => this.noise(0.1, 0.12 * t, 4e3, `bandpass`, 0, 0.5),
            ice: () => this.tone(1800, 0.15, `triangle`, 0.08 * t, 0.6),
            psychic: () => this.tone(900, 0.2, `sine`, 0.1 * t, 1.8),
            ghost: () => this.tone(300, 0.25, `triangle`, 0.1 * t, 0.6),
          }[e] ?? (() => this.tone(700, 0.08, `square`, 0.07 * t, 0.6))
        )();
    }
    beam(e) {
      this.ctx &&
        (this.tone(e === `ice` ? 1200 : 300, 0.5, `sawtooth`, 0.1, 1.5),
        this.noise(0.5, 0.1, 2e3, `bandpass`));
    }
    cone(e, t) {
      this.ok(`cone`, 0.2) && this.noise(t, 0.16, e === `fire` ? 1500 : 3e3, `bandpass`, 0, 0.6);
    }
    nova(e) {
      this.ok(`nova`, 0.1) &&
        (this.tone(e === `ground` ? 80 : 200, 0.4, `sine`, 0.3, 0.4),
        this.noise(0.35, 0.2, 900, `lowpass`, 0, 0.2));
    }
    slash(e) {
      this.ok(`slash`, 0.05) && this.noise(0.12, 0.2, 5e3, `highpass`, 0, 0.3);
    }
    melody(e, t = 0.1) {
      this.ok(`melody`, 0.3) && e.forEach((e, n) => this.tone(e, t * 1.6, `triangle`, 0.08, 1, n * t));
    }
    whoosh() {
      if (!this.ok('whoosh', .08) || this.playClip('whoosh')) return;
      this.noise(0.25, 0.14, 800, `bandpass`, 0, 4);
    }
    zap() {
      this.ok(`zap`, 0.05) &&
        (this.tone(2e3, 0.12, `sawtooth`, 0.06, 0.2), this.noise(0.1, 0.12, 6e3, `highpass`));
    }
    hurt() {
      if (!this.ok('hurt', .1) || this.playClip('hurt')) return;
      this.tone(220, 0.2, `square`, 0.18, 0.4); this.noise(0.12, 0.2, 1500);
    }
    dodge() {
      if (!this.ok('dodge', .1) || this.playClip('dodge')) return;
      this.tone(1500, 0.1, `sine`, 0.08, 1.5);
    }
    jump(e = 1) {
      if (!this.ok('jump', .05) || this.playClip(e === 1.3 ? 'jump-high' : 'jump', 1, e === 1.3 ? 1 : e)) return;
      this.tone(330 * e, 0.14, `square`, 0.06, 2);
    }
    land() {
      if (!this.ok('land', .1) || this.playClip('land')) return;
      this.noise(0.1, 0.12, 600);
    }
    dive() {
      this.ok(`dive`, 0.2) &&
        (this.tone(1100, 0.32, `sine`, 0.07, 0.35), this.noise(0.3, 0.1, 1800, `bandpass`, 0, 2));
    }
    slam(e) {
      this.ok(`slam`, 0.15) &&
        (this.tone(70 + 30 * (1 - e), 0.35 + 0.35 * e, `sine`, 0.42, 0.45),
        this.tone(150, 0.12, `square`, 0.12, 0.5),
        this.noise(0.3 + 0.45 * e, 0.32 + 0.15 * e, 900, `lowpass`, 0, 0.2),
        this.noise(0.12, 0.18, 3500, `highpass`, 0.03));
    }
    alarm() {
      if (this.ctx)
        for (let e = 0; e < 3; e++)
          (this.tone(660, 0.14, `square`, 0.1, 1, e * 0.22),
            this.tone(440, 0.14, `square`, 0.1, 1, e * 0.22 + 0.11));
    }
    bossStart() {
      this.ctx &&
        (this.tone(55, 1.4, `sawtooth`, 0.25, 0.8),
        this.noise(1.2, 0.2, 400, `lowpass`, 0, 0.3),
        [220, 207, 196].forEach((e, t) => this.tone(e, 0.4, `square`, 0.1, 1, t * 0.35)));
    }
    encounter() {
      this.ctx && [659, 784, 988, 1319].forEach((e, t) => this.tone(e, 0.15, `square`, 0.08, 1, t * 0.08));
    }
    throwBall() {
      this.ctx && this.noise(0.3, 0.12, 1200, `bandpass`, 0, 3);
    }
    ballOpen() {
      this.ctx &&
        (this.tone(520, 0.22, `square`, 0.07, 2.4),
        this.tone(1040, 0.18, `sine`, 0.05, 2, 0.04),
        this.noise(0.25, 0.08, 2500, `bandpass`, 0, 2));
    }
    ballClick() {
      this.ctx &&
        (this.noise(0.05, 0.3, 4e3, `highpass`),
        this.tone(180, 0.08, `square`, 0.14, 0.6),
        [1568, 2093, 2637].forEach((e, t) => this.tone(e, 0.14, `sine`, 0.05, 1, 0.12 + t * 0.07)));
    }
    ballShake() {
      this.ctx && (this.tone(300, 0.08, `square`, 0.12), this.tone(250, 0.1, `square`, 0.1, 1, 0.09));
    }
    caught() {
      this.ctx &&
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((e, t) =>
          this.tone(e, 0.22, `square`, 0.09, 1, t * 0.11),
        );
    }
    chest() {
      if (this.playClip('chest')) return;
      this.ctx &&
        ([784, 988, 1175, 1568].forEach((e, t) => this.tone(e, 0.18, `triangle`, 0.1, 1, t * 0.07)),
        this.noise(0.4, 0.08, 6e3, `highpass`, 0.2));
    }
    slotTick() {
      this.ok(`slotTick`, 0.05) && this.tone(1400 + Math.random() * 200, 0.025, `square`, 0.025);
    }
    slotStop() {
      this.ctx && (this.tone(260, 0.08, `square`, 0.12, 0.7), this.noise(0.06, 0.14, 3e3, `highpass`));
    }
    slotLever() {
      if (this.ctx) {
        (this.tone(140, 0.12, `square`, 0.14, 0.6), this.noise(0.08, 0.16, 900, `bandpass`));
        for (let e = 0; e < 4; e++) this.tone(900 - e * 90, 0.02, `square`, 0.04, 1, 0.1 + e * 0.035);
      }
    }
    slotTease(e) {
      if (!this.ctx) return;
      let t = Math.round(e / 0.09);
      for (let e = 0; e < t; e++) this.tone(520 + (700 / t) * e, 0.06, `square`, 0.035, 1, e * 0.09);
    }
    slotCoins(e) {
      if (this.ctx)
        for (let t = 0; t < e; t++)
          this.tone(
            1500 + Math.random() * 900,
            0.05,
            `square`,
            0.03,
            1.3,
            0.05 + t * 0.06 + Math.random() * 0.03,
          );
    }
    slotCurse() {
      this.ctx &&
        ([392, 330, 262].forEach((e, t) => this.tone(e, 0.22, `sawtooth`, 0.07, 0.85, t * 0.2)),
        this.noise(0.9, 0.06, 500, `lowpass`, 0, 0.4));
    }
    jackpot() {
      if (this.ctx) {
        [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((e, t) =>
          this.tone(e, 0.2, `square`, 0.08, 1, t * 0.09),
        );
        for (let e = 0; e < 10; e++)
          (this.tone(1976, 0.05, `square`, 0.04, 1, 0.75 + e * 0.07),
            this.tone(2637, 0.08, `square`, 0.035, 1, 0.78 + e * 0.07));
      }
    }
    deny() {
      this.ctx && (this.tone(200, 0.15, `square`, 0.1), this.tone(150, 0.2, `square`, 0.1, 1, 0.12));
    }
    levelUp() {
      if (this.playClip('levelUp')) return;
      this.ctx &&
        ([523, 659, 784, 1047, 1319].forEach((e, t) => this.tone(e, 0.3, `square`, 0.08, 1, t * 0.07)),
        [262, 330, 392].forEach((e) => this.tone(e, 0.6, `triangle`, 0.1, 1, 0.3)));
    }
    evolve(e = 3.5) {
      if (!this.ctx) return;
      if (this.inRun && Math.abs(e - combatEvolutionSeconds) < .001 && this.playClip('evolve')) return;
      let t = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31],
        n = 0,
        r = 0;
      for (; n < e - 0.15; ) {
        let i = n / e,
          a = 392 * 2 ** (t[r % t.length] / 12 + Math.floor(r / t.length) * 0.25);
        (this.tone(a, 0.14, `triangle`, 0.05 + i * 0.05, 1, n),
          r % 2 == 0 && this.tone(a * 2, 0.08, `sine`, 0.03, 1, n + 0.02),
          (n += 0.2 - i * 0.15),
          r++);
      }
      (this.noise(e, 0.05, 400, `bandpass`, 0, 12), this.tone(110, e, `sawtooth`, 0.04, 2, 0));
    }
    evolveDone() {
      if (this.playClip('evolveDone')) return;
      if (this.ctx) {
        (this.noise(0.5, 0.18, 3e3, `highpass`, 0, 0.3),
          [523, 659, 784, 1047].forEach((e, t) => this.tone(e, 0.16, `square`, 0.08, 1, t * 0.07)),
          [523, 659, 784, 1047, 1319].forEach((e) =>
            this.tone(e, 1.6, `triangle`, 0.07, 1, 0.32, void 0, 0.02),
          ),
          [262, 392].forEach((e) => this.tone(e, 1.6, `square`, 0.04, 1, 0.32)));
        for (let e = 0; e < 8; e++)
          this.tone(1568 + Math.random() * 1500, 0.08, `sine`, 0.035, 1, 0.4 + e * 0.08);
      }
    }
    shiny(e = !1) {
      this.ctx &&
        ([
          [1568, 0],
          [2093, 0.09],
          [2637, 0.18],
          [3136, 0.3],
          [2637, 0.42],
          [3136, 0.5],
        ].forEach(([e, t]) => this.tone(e, 0.22, `sine`, 0.06, 1, t)),
        this.noise(0.5, 0.05, 7e3, `highpass`, 0.1),
        e &&
          ([523, 659, 784, 1047, 1319, 1568, 2093].forEach((e, t) =>
            this.tone(e, 0.3, `triangle`, 0.05, 1, 0.62 + t * 0.05),
          ),
          [1047, 1319, 1568].forEach((e) => this.tone(e, 1.1, `sine`, 0.035, 1, 1)),
          this.noise(0.9, 0.04, 9e3, `highpass`, 0.95)));
    }
    classic() {
      this.ctx &&
        ([
          [880, 0],
          [1319, 0.12],
          [1760, 0.24],
        ].forEach(([e, t]) => {
          (this.tone(e, 0.9, `sine`, 0.07, 1, t), this.tone(e * 2.01, 0.5, `sine`, 0.025, 1, t));
        }),
        [392, 523, 659, 784, 1047, 1319].forEach((e, t) =>
          this.tone(e, 0.45, `triangle`, 0.05, 1, 0.55 + t * 0.1),
        ),
        [523, 784, 1047].forEach((e) => this.tone(e, 1.6, `sine`, 0.04, 1, 1.25)),
        this.noise(0.7, 0.04, 6e3, `highpass`, 0.5));
    }
    streak(e) {
      if (!this.ok('streak', .06)) return;
      const step = e % 25, base = step < 8 ? 4 : step < 16 ? 12 : 20;
      if (this.playClip('streak:' + base, 1, 2 ** ((step - base) / 12))) return;
      this.tone(440 * 2 ** (step / 12), 0.06, `square`, 0.025, 1.2);
    }
    streakMilestone() {
      if (this.playClip('streakMilestone')) return;
      this.ctx &&
        ([784, 988, 1175, 1568].forEach((e, t) => this.tone(e, 0.18, `square`, 0.06, 1, t * 0.06)),
        this.tone(392, 0.4, `triangle`, 0.08, 1, 0.1));
    }
    duck(e, t) {
      if (!this.ctx) return;
      let n = this.musicBus.gain,
        r = this.ctx.currentTime,
        i = this.vol.music * 0.32;
      (n.cancelScheduledValues(r),
        n.setValueAtTime(n.value, r),
        n.linearRampToValueAtTime(i * e, r + 0.3),
        n.setValueAtTime(i * e, r + t),
        n.linearRampToValueAtTime(i, r + t + 0.8));
    }
    click(kind = 'tap') {
      if (this.vol.sfx <= 0 || !this.voiceFree() || !this.ok('ui-click', .035)) return;
      if (this.playSoundBuffer(this.uiClips.get(kind), 1, 1)) return;
      if (kind === 'confirm') {
        this.tone(660, .055, 'triangle', .09);
        this.tone(990, .07, 'sine', .08, 0, .037);
      } else if (kind === 'back') {
        this.tone(610, .065, 'triangle', .09, .67);
      } else {
        this.tone(830, .053, 'triangle', .11, .78);
      }
    }
    hover() {
      this.ok(`hover`, 0.04) && this.tone(1300, 0.025, `sine`, 0.03);
    }
    victory() {
      this.ctx &&
        [523, 523, 523, 659, 784, 659, 784, 1047].forEach((e, t) =>
          this.tone(e, 0.25, `square`, 0.09, 1, t * 0.14),
        );
    }
    bell() {
      this.ok(`bell`, 0.4) &&
        ([
          [196, 1],
          [233, 0.5],
          [392, 0.45],
          [523, 0.3],
          [740, 0.18],
        ].forEach(([e, t]) => this.tone(e, 2.6, `sine`, 0.16 * t, 0.995)),
        this.noise(0.08, 0.2, 3e3, `bandpass`));
    }
    scope() {
      this.ok(`scope`, 0.3) &&
        [880, 1175, 1568].forEach((e, t) => this.tone(e, 0.25, `sine`, 0.04, 1.02, t * 0.05));
    }
    defeat() {
      this.ctx &&
        [392, 370, 349, 330, 311].forEach((e, t) => this.tone(e, 0.4, `triangle`, 0.1, 1, t * 0.25));
    }
    // Creature recordings are not part of the glyph edition. Keep the event
    // hook for combat scripts; synthesized combat and UI effects still play.
    cry() {}
    playBuf(e, t, n) {
      let r = this.ctx,
        i = r.createBufferSource();
      ((i.buffer = e), (i.playbackRate.value = n));
      let a = r.createGain();
      ((a.gain.value = t), i.connect(a), a.connect(this.cryBus), i.start());
    }
    playSong(e, t, n, r) {
      if (!this.ctx || window.backgroundMusicEnabled === false) return;
      this.stopTrack();
      let i = { bright: [0, 5, 3, 4], mystic: [0, 5, 6, 4], tense: [0, 6, 5, 4], calm: [0, 3, 5, 4] };
      ((this.song = { root: e, scale: t, bpm: n, mood: r, prog: i[r] }),
        (this.step = 0),
        (this.nextNote = this.ctx.currentTime + 0.1),
        this.musicOn ||
          ((this.musicOn = !0), (this.seqTimer = window.setInterval(() => this.schedule(), 50))));
    }
    stopMusic() {
      (this.stopSeq(), this.stopTrack());
    }
    stopSeq() {
      ((this.musicOn = !1), clearInterval(this.seqTimer), (this.song = null));
    }
    playTrack(e) {
      if (window.backgroundMusicEnabled === false) return;
      !this.ctx ||
        (this.trackWant === e && (this.track || this.trackLoading)) ||
        (this.stopSeq(),
        this.stopTrack(),
        (this.trackWant = e),
        (this.trackLoading = !0),
        this.preloadTrack(e).then(async (t) => {
          let n = this.ctx,
            r =
              t && n && this.ctx === n && this.trackWant === e
                ? await n.decodeAudioData(t.slice(0)).catch(() => null)
                : null;
          if (((this.trackLoading = !1), !r)) {
            (this.trackBytes.delete(e),
              this.trackWant === e &&
                setTimeout(() => {
                  this.trackWant === e && !this.track && ((this.trackWant = null), this.playTrack(e));
                }, 8e3));
            return;
          }
          if (!n || this.ctx !== n || this.trackWant !== e || this.track) return;
          let i = n.createBufferSource();
          ((i.buffer = r), (i.loop = !0), (i.loopStart = Rs[e].loop), (i.loopEnd = r.duration));
          let a = n.createGain(),
            o = n.currentTime;
          (a.gain.setValueAtTime(0, o),
            a.gain.linearRampToValueAtTime(Vs, o + 0.8),
            i.connect(a),
            a.connect(this.musicBus),
            i.start(o),
            (this.track = { name: e, src: i, gain: a }));
        }));
    }
    preloadTrack(e) {
      if (window.backgroundMusicEnabled === false) return Promise.resolve(null);
      let t = this.trackBytes.get(e);
      return (
        t ||
          ((t = fetch(Zt(`music/${e}.ogg`))
            .then((e) => (e.ok ? e.arrayBuffer() : null))
            .catch(() => null)),
          this.trackBytes.set(e, t)),
        t
      );
    }
    stopTrack() {
      this.trackWant = null;
      let e = this.track;
      if (((this.track = null), !e || !this.ctx)) return;
      let t = this.ctx.currentTime,
        n = e.gain.gain;
      (n.cancelScheduledValues(t),
        n.setValueAtTime(n.value, t),
        n.linearRampToValueAtTime(0, t + 0.6),
        e.src.stop(t + 0.65),
        (e.src.onended = () => e.gain.disconnect()));
    }
    note(e) {
      return 440 * 2 ** ((e - 69) / 12);
    }
    deg(e) {
      let t = this.song.scale,
        n = Math.floor(e / t.length);
      return t[((e % t.length) + t.length) % t.length] + n * 12;
    }
    schedule() {
      if (!this.ctx || !this.song) return;
      let e = this.song,
        t = 60 / e.bpm / 4;
      for (
        this.nextNote < this.ctx.currentTime - 0.1 && (this.nextNote = this.ctx.currentTime + 0.02);
        this.nextNote < this.ctx.currentTime + 0.15;

      ) {
        let n = this.step,
          r = this.nextNote - this.ctx.currentTime,
          i = Math.floor(n / 16) % 4,
          a = e.root + this.deg(e.prog[i]),
          o = n % 16,
          s = this.intensity;
        (o % 4 == 0 && this.kick(r),
          (o === 4 || o === 12) && this.snare(r),
          (o % 2 == 0 || s > 0.5) && this.hat(r, o % 4 == 2 ? 0.05 : 0.025),
          (o % 4 == 0 || (o % 4 == 3 && s > 0.3)) &&
            this.tone(this.note(a - 24), t * 3.5, `triangle`, 0.22, 1, r, this.musicBus, 0.01));
        let c = [0, 2, 4, 7, 4, 2, 0, 4][o % 8];
        if (
          ((o % 2 == 0 || s > 0.6) &&
            this.tone(
              this.note(e.root + 12 + this.deg(e.prog[i] + c)),
              t * 1.6,
              `square`,
              0.045,
              1,
              r,
              this.musicBus,
            ),
          o === 0)
        )
          for (let n of [0, 2, 4])
            this.tone(
              this.note(e.root + this.deg(e.prog[i] + n)),
              t * 15,
              `sawtooth`,
              0.025,
              1,
              r,
              this.musicBus,
              0.3,
            );
        if (o % 4 == 0 || (o % 2 == 0 && (n * 7) % 5 == 0)) {
          let a = (n * 13 + i * 5) % 7;
          this.tone(
            this.note(e.root + 24 + this.deg(e.prog[i] + a)),
            t * 2.5,
            `triangle`,
            0.06 + s * 0.03,
            1,
            r,
            this.musicBus,
          );
        }
        ((this.nextNote += t), this.step++);
      }
    }
    kick(e) {
      this.tone(150, 0.18, `sine`, 0.5, 0.25, e, this.musicBus, 0.002);
    }
    snare(e) {
      (this.noise(0.12, 0.22, 2500, `bandpass`, e, 1, this.musicBus),
        this.tone(220, 0.08, `triangle`, 0.1, 0.6, e, this.musicBus));
    }
    hat(e, t) {
      this.noise(0.03, t, 8e3, `highpass`, e, 1, this.musicBus);
    }
}

export const gameAudio = new GameAudio();

export {
  Bs,
  Ws,
  zs
};
