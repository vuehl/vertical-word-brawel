import {$t as d} from "./data/config.js";
import {zs, gameAudio} from "./combat/game-audio.js";
import {saveProgress, restoreProgress} from "./network/coop-resume.js";
import {isLiteSpecies} from "./data/lite-rules.js";
import {buttonSoundFor} from "./ui/button-audio.js";
import {applyReadyShake} from "./effects/ultimate-ready-timing.js";
import {glyphAtlasReady} from "./actors/paper-glyph-art.js";
import {FramePacer, CombatClock} from "./performance/frame-pacing.js";
import {gameStick} from "./virtual-stick/stick-config.js";
import {warmCombatDraw} from "./performance/combat-warmup.js";
import {applyPaperLight} from "./world/paper-world.js";
import {waitForLoadingPaint} from "./performance/loading-work.js";
import {performanceProfile, targetFrameRate} from "./performance/performance-profile.js";
import {applyFrameRatePolicy} from "./performance/frame-policy.js";
import {chineseMessage, chineseText} from "./data/chinese-text.js";
import {gameData} from "./data/game-database.js";
import {
  Ji,
  uo,
  initializeControls,
  GameInput
} from "./ui/controls.js";
import {logGameError, SceneRenderer, installErrorLog} from "./effects/scene-renderer.js";
import {xc, Rc, installImageRetries} from "./actors/sprite-assets.js";
import {Nl, Fl} from "./effects/battle-particles.js";
import {createElement} from "./ui/game-elements.js";
import {BattleRun} from "./combat/run.js";
import {PlayerProfile} from "./data/player-profile.js";
import {gameInterface} from "./ui/game-menus.js";
import {BattleHud} from "./ui/battle-hud.js";
import {createGameClient} from "./network/game-client.js";

typeof globalThis.structuredClone != `function` &&
  (globalThis.structuredClone = (e) => JSON.parse(JSON.stringify(e)));
function menuMusic() {
  const track = d(Date.now()).find(event => event.music)?.music;
  return track && zs(track) ? track : `menu`;
}
export class App {
  r;
  input;
  backend = createGameClient();
  meta = new PlayerProfile(this.backend);
  ui;
  screenEl = null;
  run = null;
  hud = null;
  last = null;
  lastCfg = null;
  coopRoom = null;
  pendingRoom = null;
  constructor() {
    this.ui = document.getElementById(`ui`);
    const playButton = target => {
      const kind = buttonSoundFor(this.ui, target);
      if (!kind) return;
      if (!gameAudio.ctx || gameAudio.ctx.state === 'closed') gameAudio.init();
      gameAudio.preloadUi();
      if (gameAudio.running) gameAudio.click(kind);
      else {
        const ctx = gameAudio.ctx;
        gameAudio.wake()?.then(() => { if (gameAudio.ctx === ctx) gameAudio.click(kind); });
      }
    };
    // The native DOM only bubbles. Its touch bridge runs this before handlers
    // so navigation cannot remove or change the button before classification.
    window.onUiControlClick = playButton;
  }
  get screen() {
    return this.screenEl;
  }
  setScreen(screen) {
    const previous = this.screenEl;
    this.screenEl = screen;
    if (screen) this.ui.append(screen);
    previous?.remove();
  }
  async boot() {
    const canvas = document.getElementById("game");
    this.setScreen(null);
    try {
      await Promise.all([glyphAtlasReady(), document.fonts?.ready, gameData.load()]);
    } catch (error) {
      throw Error("游戏数据读取失败：" + (error.message || error));
    }
    window.bootStage?.('游戏数据已就绪',90);
    for (let t = 0; !this.r; t++)
      try {
        this.r = new SceneRenderer(canvas);
      } catch (error) {
        logGameError("webgl", error);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (t >= 2) throw Error("WebGL 2 初始化失败：" + (error.message || error));
      }
    window.bootStage?.('画面引擎已就绪',95,this.r.renderer);
    ((this.r.onLost = (e) => this.contextLost(e)),
      initializeControls(),
      (this.input = new GameInput(canvas)),
      applyPaperLight({r:this.r}),
      gameAudio.preloadTrack(menuMusic()));
    let i = !1,
      a = () => {
        // Waking audio uses the stored volumes. A gesture must not reconfigure the renderer.
        (gameAudio.init(), gameAudio.preloadUi(),
          !this.run && !i && ((i = !0), gameAudio.playTrack(menuMusic())),
          setTimeout(() => {
            gameAudio.running &&
              (removeEventListener(`pointerdown`, a),
              removeEventListener(`pointerup`, a),
              removeEventListener(`keydown`, a),
              removeEventListener(`touchend`, a),
              removeEventListener(`click`, a));
          }, 50));
      };
    (addEventListener(`pointerdown`, a),
      addEventListener(`pointerup`, a),
      addEventListener(`keydown`, a),
      addEventListener(`touchend`, a),
      addEventListener(`click`, a),
      addEventListener(`pagehide`, () => this.run?.keepLive()));
    let o = performance.now();
    (window.setInterval(() => {
      let e = performance.now(),
        t = Math.min(0.1, (e - o) / 1e3);
      if (((o = e), document.hidden && this.run?.coop && !this.halted))
        try {
          this.run.update(t);
        } catch (e) {
          logGameError(`frame`, e);
        } finally {
          this.input.endFrame();
        }
    }, 50),
      document.addEventListener(`freeze`, () => this.run?.keepLive()),
      document.addEventListener(`visibilitychange`, () => {
        document.hidden && (this.run?.keepLive(), this.run?.sprites.trim(1500, uo ? 6e7 : 2e8));
      }),
      (this.backend.onSaved = ({ticketId,receipt}) => {
        this.zixing?.settlementSaved(ticketId,receipt);
        document.dispatchEvent(new CustomEvent('pb-saved'));
        if ((!this.run || this.run.state === 'over') && this.meta.account) this.meta.resync();
      }),
      document.addEventListener(`visibilitychange`, () =>
        gameAudio.setHiddenMute(document.hidden && (this.meta.profile?.settings.muteHidden ?? !0)),
      ),
      document.addEventListener(`visibilitychange`, () => {
        this.last=null;this.dynAt=performance.now();this.dyn.t=this.dyn.frames=this.dyn.js=0;
        this.combatClock.run=null;
        this.perf.active=false;
        this.pacer.reset();
        if(this.run)this.run.crowdSample=null;
        document.hidden && uo && this.run?.state === `play` && this.run.pause();
      }),
      requestAnimationFrame(this.loop),
      (this.meta.onError = (error) => this.notice(error)));
    await this.backend.status();
    window.bootStage?.('读取本机登录状态',98);
    const account = await this.backend.restore();
    const ui=gameInterface(this);
    // The home screen does not need a cloud profile. Share this request
    // with menu actions, without a late response navigating the player.
    if(account)ui.prepareProfile(account).catch(error=>console.warn('[字由搏击] 后台读取存档失败',error));
    ui.home();
    window.bootStage?.('首页内容已就绪',99);
  }
  applySettings() {
    if(!this.devicePolicyListener){
      this.devicePolicyListener=()=>this.applySettings();
      window.addEventListener('deviceperformancechange',this.devicePolicyListener);
    }
    let e = this.meta.profile?.settings;
    if(e)e.aimMode='auto';
    if (e) {
      const repaired = Object.hasOwn(e,'batterySaver');
      if (repaired) delete e.batterySaver;
      const frameChanged=applyFrameRatePolicy(e,window.nativeDevice);
      if(frameChanged){
        const toggle=this.screen?.querySelector('[aria-label="锁定 30 帧"]');
        toggle?.classList.toggle('on',!!e.lock30Fps);toggle?.setAttribute('aria-checked',!!e.lock30Fps);
      }
      if (window.repairVolumeSettings?.(e) || repaired || frameChanged) this.meta.save();
    }
    const profile=performanceProfile(e,window.nativeDevice);
    if(window.nativeGraphics)Object.assign(window.nativeGraphics,{pixelBudget:profile.pixelBudget,maxPixelRatio:profile.maxPixelRatio});
    window.setUIPerformance?.(profile);
    e &&
      (gameAudio.setVolumes({ master: e.master, music: e.music, sfx: e.sfx, cries: e.cries }),
      gameAudio.setHiddenMute(document.hidden && e.muteHidden),
      gameAudio.setSilentPlay(!!e.silentPlay),
      this.r &&
        (this.r.setQuality({
          pixelScale: 0,
          bloom: profile.bloom,
          outline: profile.outline,
          hires: e.quality !== `low`,
          dyn: profile.dynamicResolution,
        }),
        this.r.setLook(!!e.reduceFlashes, e.fxGlow ?? 1)),
      document.documentElement.classList.toggle(`calm-fx`, !!e.reduceFlashes),
      this.input && ((this.input.sensitivity = e.sensitivity), (this.input.invertY = e.invertY)),
      Ji(e.keyBinds, e.padBinds),
      this.hud?.look(e),
      this.run &&
        ((this.run.aimMode = e.aimMode),
        (this.run.vfx.enabledText = e.damageNumbers),
        (this.run.vfx.calm = e.reduceFlashes),
        (this.run.vfx.fade = Math.max(0.2, Math.min(1, e.fxOpacity ?? 1))),
        (this.run.vfx.glow = Math.max(0.2, Math.min(1, e.fxGlow ?? 1))),
        (this.run.ui.floatText = e.floatText !== !1),
        (this.run.hideOwnFx = !!e.hideOwnFx),
        (this.run.camDist = Math.max(4.5, Math.min(26, e.camDist ?? 9))),
        (this.run.vfx.ownFade = Math.max(0.1, Math.min(1, e.ownFxOpacity ?? e.fxOpacity ?? 1))),
        (this.run.performance=profile),
        (Fl.density = profile.particleDensity),
        this.run.vfx.setPerformance(profile,this.run.sprites),
        (this.run.fpsCap = this.fpsCap()),
        this.run.setHordeQuality(e.quality)));
  }
  starting = !1;
  async startRun(e, onLoadProgress) {
    if (this.starting) return !1;
    if(e&&!isLiteSpecies(e.species)){
      this.lastStartError=Error('当前可使用炎或风开启对局');
      return false;
    }
    if(!onLoadProgress&&this.zixing)return this.zixing.start(e);
    this.lastStartError=null;
    this.starting = true;
    try {
      return await this.openRun(e,onLoadProgress);
    } catch (error) {
      this.lastStartError=error;
      // Loading can fail after audio has started but before a run owns it.
      if (!this.run && gameAudio.inRun) gameAudio.endRun();
      console.error('[宝可梦] 森林初始化失败', error);
      if(e.coop?.reconnecting){
        e.coop.room.end(error.message,false);
        this.run?.dispose();this.run=null;this.hud?.destroy();this.hud=null;
      }else this.toMenu();
      if(!onLoadProgress)this.notice('森林未能打开：' + (error.message || error));
      return false;
    } finally {
      this.starting = !1;
    }
  }
  async openRun(e, onLoadProgress) {
    this.lastCfg = e;
    let t;
    try {
      for (;;) {
        if (
          ((t = await this.meta.beginRun({
            species: e.species,
            biome: e.biome,
            tier: e.tier,
            boosts: e.boosts,
            mode: e.mode,
            party: e.coop?.party,
            coopSeed: e.coop?.seed,
          })),
          e.coop && (t.offline || t.party !== e.coop.party))
        )
          return (this.notice(chineseText(`No hay conexión con el servidor.`)), !1);
        if (!t.offline || this.backend.kind !== `http`) break;
        let n = await this.askOffline();
        if (n === `play`) break;
        if (n === `cancel`) return !1;
      }
    } catch (e) {
      this.lastStartError=e;
      return (this.notice(e.message), gameAudio.deny(), !1);
    }
    return (
      (e = { ...e, seed: t.seed, boosts: t.boosts ?? [] }),
      (this.lastCfg = e.coop ? null : { ...e, boosts: [] }),
      this.hud?.destroy(),
      this.run?.dispose(),
      (this.hud = new BattleHud(this.ui)),
      this.hud.look(this.meta.profile.settings),
      gameAudio.beginRun(),
      onLoadProgress?.({phase:'准备对局',detail:'',progress:.45}),
      await waitForLoadingPaint(this.r.renderer),
      (this.run = new BattleRun(this.r, this.input, gameAudio, this.hud, this.meta, {...e,onLoadProgress,effectAtlas:await Nl()})),
      await this.run.initialized,
      e.coop?.world && restoreProgress(this.run,e.coop.progress,e.coop.world),
      onLoadProgress?.({phase:'准备字灵',detail:'',progress:.8}),
      gameInterface(this).attachRun(this.run),
      await this.run.openStage(onLoadProgress),
      onLoadProgress?.({phase:'准备进入场景',detail:'',progress:.99}),
      await waitForLoadingPaint(this.r.renderer),
      // Upload textures, compile shaders and populate the HUD while the
      // opaque loading page still covers the first frame. No play time elapses.
      this.run.update(0),
      await this.run.ui.prepareEntryIcons?.(),
      warmCombatDraw(this.run),
      onLoadProgress?.({phase:'准备完成',detail:'即将进入桌上世界',progress:1}),
      await waitForLoadingPaint(this.r.renderer),
      await e.coop?.room.waitForBattleStart((title,teamReady)=>onLoadProgress?.({phase:title,teamStatus:title,teamReady,progress:1})),
      // Remove the opaque page and submit the first playable frame in the same turn.
      this.setScreen(null),
      (this.run.onLoadProgress=null),
      (this.run.state='play'),
      e.coop && (saveProgress(this.run),e.coop.room.request('playing',{party:e.coop.party}).catch(()=>{})),
      this.run.ui.stageIntro(this.run),
      document.hidden && this.run.pause(),
      (globalThis.__pb = globalThis.__pb || {}),
      (globalThis.__pb.run = this.run),
      // Present the playable HUD and its foot health texture together, even
      // when the next animation callback is delayed. Keep game time at zero.
      this.run.ui.hud(this.run),
      this.r.render(0),
      window.drawUI?.(this.r.renderer),
      (this.run.fpsCap = this.fpsCap()),
      t.offline && this.hud.toast(chineseText(`Sin conexión: esta partida no contará para tu progreso`), null),
      !0
    );
  }
  askOffline() {
    return (
      gameAudio.deny(),
      new Promise((e) => {
        let t = (t) => () => {
            (gameAudio.click(), n.remove(), e(t));
          },
          n = createElement(
            `div`,
            { class: `season-modal` },
            createElement(
              `div`,
              { class: `panel season-card cl-modal` },
              createElement(`h2`, { class: `cl-mh` }, chineseText(`No hay conexión con el servidor`)),
              createElement(
                `p`,
                { class: `muted` },
                chineseText(
                  `No se ha podido empezar la partida en el servidor. Si juegas sin conexión, no contará para tu progreso, tus misiones ni la clasificación.`,
                ),
              ),
              createElement(
                `div`,
                { class: `row cl-mbtns` },
                createElement(`button`, { class: `btn ghost`, onclick: t(`cancel`) }, chineseText(`Cancelar`)),
                createElement(`button`, { class: `btn ghost`, onclick: t(`play`) }, chineseText(`Jugar sin que cuente`)),
                createElement(`button`, { class: `btn red`, onclick: t(`retry`) }, chineseText(`Reintentar`)),
              ),
            ),
          );
        document.body.append(n);
      })
    );
  }
  lostEl = null;
  contextLost(e) {
    if ((clearTimeout(this.lostTimer), !e)) {
      (this.lostEl?.remove(), (this.lostEl = null), Rc(), xc());
      return;
    }
    let t = !!this.run && this.run.state !== `over`;
    (this.run?.state === `play` && this.run.pause(), this.run?.keepLive(), this.run?.sprites.trim(3e3, 0));
    let n = createElement(
        `button`,
        {
          class: `btn big red`,
          hidden: !0,
          onclick: () => {
            (this.run?.keepLive(), location.reload());
          },
        },
        chineseText(`Recargar`),
      ),
      r = createElement(
        `button`,
        {
          class: `btn big`,
          hidden: !0,
          onclick: () => {
            (gameAudio.click(), this.lostEl?.remove(), (this.lostEl = null), this.run?.resume());
          },
        },
        chineseText(`Seguir sin imagen`),
      ),
      i = createElement(`p`, { class: `muted` }, chineseText(`La tarjeta gráfica se ha reiniciado. Esperando a que vuelva…`));
    (this.lostEl?.remove(),
      (this.lostEl = createElement(
        `div`,
        { class: `gl-lost` },
        createElement(
          `div`,
          { class: `panel` },
          createElement(`h3`, {}, chineseText(`Se ha perdido la imagen`)),
          i,
          createElement(
            `div`,
            { class: `row`, style: { justifyContent: `center`, gap: `10px`, flexWrap: `wrap` } },
            t ? r : null,
            n,
          ),
        ),
      )),
      document.body.append(this.lostEl),
      (this.lostTimer = window.setTimeout(() => {
        ((i.textContent = chineseText(
          t
            ? `No ha vuelto. Puedes seguir jugando sin imagen (con el minimapa) o recargar: al recargar la partida termina y se guarda con todo lo conseguido.`
            : `No ha vuelto. Recarga la página para seguir.`,
        )),
          (n.hidden = !1),
          (r.hidden = !1));
      }, 5e3)));
  }
  lostTimer = 0;
  notice(e) {
    let n = createElement(`div`, { class: `app-notice` }, chineseMessage(e));
    (document.body.append(n),
      setTimeout(() => n.classList.add(`out`), 3600),
      setTimeout(() => n.remove(), 4200));
  }
  toMenu() {
    (this.run?.dispose(),
      (this.run = null),
      this.hud?.destroy(),
      (this.hud = null),
      applyPaperLight({r:this.r}),
      gameAudio.playTrack(menuMusic()),
      gameInterface(this).home());
  }
  perf = { sim: 0, draw: 0, fps: 0, frames: 0, started: 0, last: 0, run: null };
  failing = 0;
  frameGap() {
    // Keep one native cadence through home/loading/combat and modal changes.
    // Static menus skip unchanged UI. The 30 FPS cap is a player choice.
    return 1000 / this.fpsCap();
  }
  fpsCap() {
    return targetFrameRate(this.meta.profile?.settings);
  }
  dyn = { t: 0, frames: 0, js: 0, good: 0, wait: 8, lastUp: -1e9 };
  dynAt = 0;
  adaptRes(e, t, n) {
    let r = this.dyn,
      i = this.r;
    if (
      ((this.dynAt = n),
      !i.quality.dyn || this.run?.state !== `play` || document.hidden || !(t > 0 && Number.isFinite(t)))
    ) {
      r.t = r.frames = r.js = 0;
      return;
    }
    if (((r.t += t), r.frames++, (r.js += e), r.t < 2)) return;
    let a = r.frames / r.t,
      o = r.js / r.frames / ((r.t / r.frames) * 1e3);
    r.t = r.frames = r.js = 0;
    let s = window.__dynFps,
      c = s ?? a;
    const target=Math.min(this.fpsCap()||60,60);
    // Native canvas uploads and graphics submission also count as JS time.
    // Busy native submission must not block resolution reduction.
    c < target*.75 && i.dynRes > SceneRenderer.DYN_MIN
      ? (n - r.lastUp < 25e3 && (r.wait = Math.min(60, r.wait * 2)),
        (r.good = 0),
        i.setDynRes(i.dynRes - 0.1))
      : c >= target*(55/60) && i.dynRes < 1
        ? ++r.good * 2 >= r.wait && ((r.good = 0), (r.lastUp = n), i.setDynRes(i.dynRes + 0.1))
        : (r.good = 0);
  }
  halted = !1;
  pacer = new FramePacer(window.setNativeFrameRate);
  combatClock = new CombatClock();
  loop = (e) => {
    if ((requestAnimationFrame(this.loop), this.halted || document.hidden)) {this.perf.active=false;this.pacer.reset();this.combatClock.run=null;this.last=null;return;}
    const gap = this.frameGap();
    if (!this.pacer.ready(e,gap,this.r.needsDraw)) return;
    const frameWindow=Math.min(gap,this.pacer.next-e);
    const combat=this.run?.state==='play'&&!this.run.buildingStage&&!this.screen?.classList.contains('zx-loading-screen');
    const physicsMs = gameStick.fixedStep * 1000;
    const ticks=combat?this.combatClock.ticks(this.run,e,physicsMs):1;
    const alpha = combat ? this.combatClock.alpha : null;
    const lastStepMs = performance.now() - (alpha || 0) * physicsMs;
    if (this.run) this.run.renderAlpha = alpha;
    if(!combat)this.combatClock.run=null;
    const elapsed = this.last === null ? 0 : Math.max(0, (e - this.last) / 1e3);
    const logicDt = Math.min(0.1, elapsed);
    const n = this.last == null ? 0 : Math.min(.1, Math.max(0, (e-(this.drawAt ?? e))/1000));
    this.drawAt = e;
    if (this.run) this.run.drawDt = n;
    if (ticks) this.last = e;
    try {
      // Opaque menus only upload changed UI; hidden scenery stays idle.
      // Leave the last portal frame on screen until the new world and its sprites are ready.
      if(this.run?.changingZone && this.run.state==='transition' && !this.screen){this.perf.active=false;return;}
      if(this.run?.buildingStage){this.perf.active=false;window.drawUI?.(this.r.renderer);return;}
      if (this.screen?.classList.contains('zx-loading-screen') || this.screen?.classList.contains('zx')) {
        if(!this.run){this.perf.run=null;this.perf.fps=0;}
        this.perf.active=false;
        window.drawUI?.(this.r.renderer, true);
        this.r.needsDraw = false;
        this.input.endFrame();
        return;
      }
      let t = performance.now();
      if(!this.r.needsDraw&&window.drawFrozenModal?.(this.r.renderer)){
        this.perf.active=false;this.run.crowdSample=null;this.adaptRes(0,0,e);this.failing=0;return;
      }
      if (!ticks) {
        this.run.fpsN++;
        this.run.governHorde();
        this.run.coop?.interpPeers();
        this.run.updateCamera(n);
        applyReadyShake(this.run);
        this.run.renderWorld(0);
      } else if (this.run) {
        this.run.update(logicDt, Math.min(elapsed, 0.5), combat ? gameStick.fixedStep : 0, ticks, lastStepMs);
      }
      // The XP ring still needs HUD updates while combat is paused. Reuse
      // that same scene when the choice first appears.
      if(this.run?.pendingLevels>0&&!this.r.needsDraw&&window.drawFrozenUpgrade?.(this.r.renderer)){
        this.perf.active=false;this.run.crowdSample=null;this.adaptRes(0,0,e);this.failing=0;return;
      }
      let r = performance.now();
      this.r.render(n);
      window.drawUI(this.r.renderer);
      if (this.run?.state === `play`) {
        let e = this.perf;
        ((e.sim += (r - t - e.sim) * 0.05), (e.draw += (performance.now() - r - e.draw) * 0.05));
        const now=performance.now();
        if(e.run!==this.run||!e.active){e.started=now;e.frames=0;if(e.run!==this.run)e.fps=0;e.run=this.run;}
        else e.frames++;
        e.last=now;e.active=true;
        if(now-e.started>=1000){e.fps=e.frames*1000/(now-e.started);e.frames=0;e.started=now;}
        if(combat&&gap===1000/30&&!document.hidden&&!this.screen&&!this.run.buildingStage&&!this.run.dragonDuel){
          this.run.idleWarmup.afterFrame(this.run,gap,elapsed*1000,frameWindow-(now-t),now);
        }
      }else this.perf.active=false;
      ((this.failing = 0), this.adaptRes(performance.now() - t, (e - this.dynAt) / 1e3, e));
    } catch (e) {
      if (
        (window.onBootRenderError?.(e), this.failing++ % 60 == 0 && (console.error(`[pokebonk] Error en el fotograma`, e), logGameError(`frame`, e)),
        this.failing === 60 && this.run && this.run.state !== `over`)
      ) {
        this.notice(chineseText(`Se ha producido un error y la partida ha terminado. Se guarda lo conseguido.`));
        try {
          ((this.run.endHow = `error`), this.run.finish(!1));
        } catch {
          this.toMenu();
        }
      } else this.failing === 180 && ((this.failing = 0), this.toMenu());
    } finally {
      if (ticks) this.input.endFrame();
    }
  };
}

export async function launch() {
  installErrorLog();
  installImageRetries();
  const app = new App();
  window.onApp?.(app);
  await app.boot();
  return app;
}
