import {VFX_SCALE} from '../effects/visual-scale.js';
import {MapSpawnError} from "../world/map-rules.js";
import {ALTAR_RING_EMISSIVE} from "../effects/altar-ring-vfx.js";
import {bossSummonUnlockSeconds, springShoesKey} from "../data/active-content.js";
import {roomMonster} from "../world/room-monsters.js";
import {LITE_SPECIES, SINGLE_STAGE, FOREST_ROUTE, FOREST_COMBAT_ZONES, runRecordKey, zoneDuration, enemyDifficulty} from "../data/lite-rules.js";
import {finalBossSpecies} from "../data/character-rules.js";
import {dragonChantSeconds, prepareDragonChant, startDragonChant} from "../effects/dragon-chant.js";
import {beginDragonSummon, clearDragonSummon, warmDragonSummon} from "../effects/dragon-summon-hd/sequence.js";
import {applyReadyShake} from "../effects/ultimate-ready-timing.js";
import {gameStick} from "../virtual-stick/stick-config.js";
import {CombatIdleWarmup, warmCombatShaders} from "../performance/combat-warmup.js";
import {EVOLUTION_REVEAL, EVOLUTION_DURATION, evolutionPose} from "../effects/upgrade-effects.js";
import {crowdBudgets, updateCrowdBudget} from "../performance/crowd-budget.js";
import {ENEMY_XP_SCALE,ordinaryCeiling} from "../performance/spawn-budget.js";
import {
  buildPaperWorldAsync,
  createPaperAssets,
  disposePaperAssets,
  applyPaperLight,
  updatePaperCamera,
  updateWorkshopScene
} from "../world/paper-world.js";
import {updateLooseMarbles} from "../world/workshop-marbles.js";
import {runLoadingSteps, waitForLoadingPaint} from "../performance/loading-work.js";
import {performanceProfile} from "../performance/performance-profile.js";
import {portalGuidance} from "../world/portal-guidance.js";
import {UpgradeTiming} from "./upgrade-timing.js";
import {updatePaperVisibility} from "../world/paper-visibility.js";
import {chineseText as c} from "../data/chinese-text.js";
import {updateDeskPropFade} from "../world/desk-prop-fade.js";
import {Gt as le, Hr as fe, Rr as Je, Vr as lt, cn as Pt, jr as sn, lr as hn, pn as kn} from "../data/config.js";
import {ht as ti, w as Ei} from "../vendor/three-DmSYIDKK.js";
import {gameData as k} from "../data/game-database.js";
import {uo} from "../ui/controls.js";
import {Bs} from "./game-audio.js";
import {clamp as Gs, Js, logGameError as oc} from "../effects/scene-renderer.js";
import {rl} from "../actors/sprite-assets.js";
import {random as F, kl, I, Fl, Il, Kl, ql, Yl} from "../effects/battle-particles.js";
import {cd} from "../world/terrain.js";
import {ff, vf, R, EnemyPopulation as Pf} from "./enemy-population.js";
import {tm, gm, Pm} from "./field-effects.js";
import {J} from "./ultimate-moves.js";
import {e_, j_, G_, Q_} from "./skills.js";
import {uv, Player as Ov} from "./player.js";
import {Av, Lv, zv, wy, gy, Iy, sb, ub, Gy, ab, Eb, Ab, Ib} from "./enemies.js";
import {Ub, Wb, applyUpgrade as Gb, drawItemKeys, Zb, Qb, $b, ex, tx, rx, ox, sx, cx, ux, jS} from "./upgrade-offers.js";
import {OS, PS, Facilities as GS} from "../world/facilities.js";
import {OC, kC} from "./boss-actors.js";
import {yw} from "../ui/game-elements.js";
import {Vw, eT, OT, NT} from "./encounters.js";
import {fE, pE, mE, hE, gE, _E, vE, yE, xE} from "../network/battle-peers.js";

var SE = (e) => Math.round(Number.isFinite(e) ? Math.min(0xe8d4a51000, e) : 0xe8d4a51000),
  CE = 4.5,
  wE = class e {
    r;
    input;
    audio;
    ui;
    meta;
    biome;
    stage = 1;
    mode;
    endless = null;
    tower = null;
    tier;
    seed;
    sprites;
    vfx;
    terrain;
    enemies;
    projectiles;
    pickups;
    combat;
    zones;
    director;
    boss;
    minibosses;
    events;
    capture;
    mewtwo;
    captureEncounter = null;
    get captureTarget() {
      return LITE_SPECIES.find(id => id !== this.startSpecies);
    }
    mewtwoFought = !1;
    allies;
    boosts;
    masterBall = !1;
    interactables;
    sanctuary = null;
    player;
    coop = null;
    ult;
    orbitals;
    orbitalsGlow;
    state = `play`;
    time = 0;
    stageTime = 0;
    realTime = 0;
    realDt = 0;
    gold = 0;
    keys = 0;
    goldFrac = 0;
    killFrac = 0;
    curses = 0;
    chestsBought = 0;
    shopBuys = [];
    shopRerolls = 0;
    get shopHeat() {
      if (this.endless) return 1;
      let e = 1;
      for (let t of this.shopBuys.slice(2 + Math.floor(this.chestsBought / 3))) e *= tx[t] ?? 1;
      return e;
    }
    econ = { shop: 0, sold: 0 };
    goldSpent = 0;
    peakItems = 0;
    springShoesState = 'available';
    vitTaken = !1;
    slotSpins = 0;
    slotSpent = 0;
    slotPrizes = {};
    tempMods = [];
    roars = 0;
    shrines = { fossil: [], roars: 0 };
    fusions = [];
    banished = new Set();
    rerolls = 0;
    skips = 0;
    banishes = 0;
    pendingLevels = 0;
    openingXpChecked = false;
    upgradeTiming = new UpgradeTiming();
    bossSpawned = !1;
    dragonDuel = false;
    stageCleared = !1;
    camYaw = 0;
    camPitch = 0.45;
    camDist = 9;
    modalDeadT = 0;
    camTarget = new ti();
    camLift = 0;
    trauma = 0;
    timers = [];
    anims = [];
    ghosts = [];
    lastAim = new ti(0, 0, 1);
    lockTarget = -1;
    aimMode = `auto`;
    weather = `clear`;
    baseWeather = `clear`;
    weatherT = 0;
    timeScale = 1;
    hitstopT = 0;
    cine = { want: 0, blend: 0, follow: -2, x: 0, y: 0, z: 0, dist: 3.6, pitch: 0.22, orbit: 0 };
    streak = 0;
    streakT = 0;
    streakPaid = new Set();
    egg = null;
    evoHold = 0;
    godMode = !1;
    hideOwnFx = !1;
    regionCleared = !1;
    maxEnemies = yE;
    liveCap = crowdBudgets.high.max;
    liveMax = crowdBudgets.high.max;
    fpsCap = 0;
    get enemyCap() {
      return this.coop ? this.maxEnemies : Math.min(this.maxEnemies, this.liveCap);
    }
    nextEvo = null;
    diff = { enemyHp: 1, enemyDamage: 1, enemySpeed: 1, enemyAmount: 1, xp: ENEMY_XP_SCALE, xpMult: 1, stardust: 1 };
    stats = {
      kills: 0,
      damage: 0,
      damageTaken: 0,
      hits: 0,
      dodges: 0,
      megaCrits: 0,
      slams: 0,
      powerUps: 0,
      eggs: 0,
      reactions: 0,
      captured: [],
      movesLearned: 0,
      evolutions: 0,
      bosses: 0,
      legendaries: 0,
      alphas: 0,
      totems: 0,
      summoners: 0,
      stagesCleared: 0,
      gold: 0,
      bestStreak: 0,
      killsBy: {},
      newSeen: [],
      shinies: [],
      classics: [],
      itemDamage: {},
      allies: [],
      ultimates: 0,
      ultDamage: 0,
      forgotten: {},
    };
    dpsLog = new Ib();
    research;
    startSpecies;
    shinySkin = !1;
    skinLook = null;
    skinMember = 0;
    skinGl = 0;
    music = Bs[Math.floor(Math.random() * Bs.length)];
    musicFor() {
      return (this.boss?.kit && this.boss.alive) || this.mewtwo?.active ? `boss` : this.music;
    }
    spectralSkin = !1;
    victory = !1;
    endHow = null;
    sent = !1;
    splits = [];
    nextCp = kn.heartbeat;
    onExit = null;
    fpsAcc = 0;
    fpsN = 0;
    fps = 60;
    playFps = 60;
    hints;
    constructor(e, t, n, r, i, a) {
      ((this.r = e),
        (this.input = t),
        (this.audio = n),
        (this.ui = r),
        (this.meta = i),
        (this.mode = [`endless`, `tower`, SINGLE_STAGE].includes(a.mode) ? a.mode : `standard`),
        (this.biome = lt(this.mode === `tower` ? `graveyard` : a.biome)),
        (this.tier = this.mode === `standard` ? (a.tier ?? 0) : 0),
        (this.seed = a.seed ?? kl(Date.now().toString()) ^ (Math.random() * 1e9)),
        (this.startSpecies = a.species),
        (this.shinySkin = i.shinySkin(a.species)),
        (this.spectralSkin = i.skinFor(a.species) === `spectral`),
        (this.skinLook = i.skinFor(a.species)),
        (this.skinMember = le(a.species, (e) => i.family(e))?.id ?? a.species),
        (this.skinGl = Yl(this.skinMember, this.skinLook)));
      Object.assign(this.diff, enemyDifficulty(this.tier));
      if (a.coop && this.mode === `standard`) {
        this.stage = a.coop.world?.stage ?? 1;
        this.coop = new fE(this, a.coop);
        this.diff.enemyHp *= this.coop.hpMul;
        this.diff.enemyAmount *= this.coop.spawnMul;
      }
      let s = i.profile.settings;
      this.performance=performanceProfile(s,window.nativeDevice);
      ((this.hints = new yw(i)),
        (this.aimMode = s.aimMode),
        (this.maxEnemies = this.coop ? 800 : yE),
        this.setHordeQuality(s.quality),
        (Fl.density = this.performance.particleDensity),
        (this.sprites = new rl(e.scene, e.shared)),
        (this.vfx = new Kl(e.scene, e.shared, a.effectAtlas, this)),
        this.vfx.crafted.attach(this),
        this.vfx.setPerformance(this.performance,this.sprites),
        (this.vfx.calm = !!i.profile.settings.reduceFlashes),
        (this.vfx.fade = Math.max(0.2, Math.min(1, i.profile.settings.fxOpacity ?? 1))),
        (this.vfx.glow = Math.max(0.2, Math.min(1, i.profile.settings.fxGlow ?? 1))),
        (this.vfx.enabledText = s.damageNumbers),
        (this.hideOwnFx = !!s.hideOwnFx),
        (this.camDist = Gs(s.camDist ?? 9, CE, 26)),
        (this.vfx.ownFade = Math.max(0.1, Math.min(1, s.ownFxOpacity ?? s.fxOpacity ?? 1))),
        (r.floatText = s.floatText !== !1),
        (this.orbitals = new ql(this.vfx.combatLayer, this.vfx.atlas, 512, !1, e.shared)),
        (this.orbitalsGlow = this.vfx.track(new ql(this.vfx.combatLayer, this.vfx.atlas, 512, !0, e.shared))),
        (this.research = { add: (e, t) => i.addResearch(e, t) }),
        (this.rerolls = 2 + i.lab(`reroll`)),
        (this.skips = 2 + i.lab(`skip`)),
        (this.banishes = 1 + i.lab(`banish`)));
      for (let e of i.profile.banished ?? []) this.banished.add(e);
      ((this.boosts = new Set((a.boosts ?? []).filter(id => Pt.some(item => item.id === id)))),
        this.mode === `endless` && (this.endless = new Vw(this)),
        this.mode === `tower` && ((this.tower = new OT(this)), (this.stage = this.tower.curveStage)),
        (this.paperAssets=createPaperAssets()),
        (this.onLoadProgress=a.onLoadProgress),
        (this.loadingMetrics=[]),
        (this.initialized=this.initialize()));
    }
    async initialize() {
      this.state='transition';
      await Promise.all([this.buildStageAsync(true), prepareDragonChant(), this.vfx.upgrade.prepare()]);
      this.applyBoosts();
    }
    idleWarmup=new CombatIdleWarmup();
    async openStage(onProgress) {
      let e = [...new Set([...this.stageSprites(),...Array.from(this.sprites.batches.values(),batch=>batch.id)])];
      const check=()=>{if(this.disposed)throw Error('本局已结束');};
      const sprites=this.sprites;
      await runLoadingSteps((function*(){for(const id of e){sprites.get(id);yield;}})(),{check});
      // stageSprites covers the player, evolutions, upcoming waves and the
      // selected guardian. Later waves request their cutouts when needed.
      // Do not allocate every future actor at every area entrance.
      if (
        this.sprites.readyCount(e) < e.length && this.ui.loading
      ) {
        let t = this.state;
        ((this.state = `transition`),
          await this.ui.loading(e.length, () => {check();return this.sprites.readyCount(e);},onProgress),
          this.state === `transition` && (this.state = t));
      }
      const peers=this.coop?[...this.coop.peers.values()].filter(peer=>!peer.gone).map(peer=>peer.species):[];
      await this.sprites.prepareGlyphTextures(this.r.renderer,this.player.speciesId,peers);check();
      this.onLoadProgress?.({phase:'准备战斗特效',detail:'',progress:.95});
      if(!this.changingZone)await waitForLoadingPaint(this.r.renderer);
      check();
      if(!this.fireTexturesPrepared){
        if(await this.projectiles.enemyArt.ready){
          check();
          this.r.renderer.initTexture(this.projectiles.enemyArt.texture);
        }
        // A teammate or mimic can use any fire move. For solo characters,
        // warm their starting kit and loadout, one texture per loading frame.
        const kit=this.player.roster?.kit??[];
        const keys=new Set(this.coop||kit.includes('mimic')?['ember','fire-spin','flamethrower']:kit);
        if(this.coop||kit.includes('mimic')||[4,5,6].includes(this.player.speciesId))keys.add('fire-ultimate');
        if([4,5,6].includes(this.player.speciesId))keys.add('flame-charge');
        if([16,17,18,58,59].includes(this.player.speciesId))keys.add('wind-ultimate');
        for(const move of this.player.moves)if(move)keys.add(move.def.effectKey ?? move.def.key);
        let prepared=0;
        for(const key of keys){
          const uploaded=await this.vfx.crafted.prepareMoveTexture(key);
          check();
          prepared++;
          this.onLoadProgress?.({phase:'准备战斗特效',progress:(95+2*prepared/keys.size)/100});
          if(uploaded)await waitForLoadingPaint();
          check();
        }
        this.fireTexturesPrepared=true;
      }
      await warmCombatShaders(this.r);check();
      if(!onProgress)this.ui.stageIntro(this);
    }
    stageSprites() {
      let e = new Set([this.player.speciesId]);
      if(this.coop)for(const peer of this.coop.peers.values())if(!peer.gone)e.add(peer.species);
      if (this.tower) for (let t of this.tower.sprites()) e.add(t);
      let t = (n) => {
        for (let r of k.evolutionsOf(n)) !e.has(r.id) && k.hasSprite(r.id) && (e.add(r.id), t(r.id));
      };
      t(this.player.speciesId);
      for (let t of this.player.roster?.branch ?? []) k.hasSprite(t) && e.add(t);
      let n = this.biome.sanctuary;
      if (this.tower) return [...e].filter((e) => k.get(e));
      let r =
        this.stage === 4 && n
          ? Je(n.legendaries)[Math.abs(this.seed) % Math.max(1, Je(n.legendaries).length)]
          : (() => {
              let e =
                this.stage >= 3 && !n
                  ? Je(this.biome.legendaries)
                  : Je(this.biome.guardians?.[this.stage - 1] ?? [this.biome.bosses[this.stage - 1]]);
              return e[(this.seed + this.stage) % Math.max(1, e.length)];
            })();
      return [
        ...new Set([
          ...e,
          ...(r && k.hasSprite(r) ? [r] : []),
          ...this.director.upcoming(this.endless ? 4 : 6),
        ]),
      ].filter((e) => k.get(e));
    }
    bossPools() {
      if (this.tower) return eT.filter((e) => k.hasSprite(e));
      let e = this.biome,
        t = this.stage - 1,
        n = e.guardians?.[t] ?? [];
      return Je([
        ...n,
        ...n.flatMap((e) => gy[e] ?? []),
        ...(e.totems?.[t] ?? []),
        ...(e.summoners?.[t] ?? []),
        ...(t >= 2 ? (e.legendaries ?? []) : []),
        ...(e.sanctuary?.legendaries ?? []),
      ]).filter((e) => k.hasSprite(e));
    }
    applyBoosts() {
      let e = this.boosts,
        t = this.player;
      e.size &&
        (e.has(`lucky-egg`) && this.tempMods.push({ stat: `xpGain`, mul: 1.25 }),
        e.has(`amulet-coin`) && this.tempMods.push({ stat: `gold`, mul: 1.5 }),
        e.has(`master-ball`) && (this.masterBall = !0),
        e.has(`rare-candy`) && ((t.level += 2), (t.xpNext = t.xpFor(t.level)), (this.pendingLevels += 2)),
        t.recompute(),
        this.later(1.2, () =>
          this.ui.toast(
            c(`Mochila: {items}`, {
              items: [...e].map((e) => Pt.find((t) => t.id === e)?.name ?? e).join(` · `),
            }),
            [...e][0],
          ),
        ));
    }
    useMasterBall() {
      return this.masterBall ? ((this.masterBall = !1), !0) : this.player.items.has(`master-ball`);
    }
    createStageTerrain(deferred = false) {
      const sanctuary=this.stage===4?(this.biome.sanctuary??null):null,tower=this.tower;
      const zone=this.zone=tower?tower.zoneLook():fe(this.biome,sanctuary||this.endless?1:this.stage);
      const biome={...this.biome,zxStage:this.stage,sun:zone.sun,light:zone.light},seed=(this.seed+this.stage*7919)>>>0;
      return new cd(biome,seed,this.r.shared,sanctuary?OC(sanctuary):tower?tower.layout():void 0,this.paperAssets,deferred);
    }
    async buildStageAsync(first) {
      this.buildingStage=true;
      let terrain;
      try {
        // Cancel the previous area's warmup before allocating the next terrain.
        clearDragonSummon(this);
        const metrics={stage:this.stage};this.loadingMetrics.push(metrics);
        const check=()=>{if(this.disposed)throw Error('本局已结束');};
        this.onLoadProgress?.({phase:'绘制桌面与纸张',detail:'正在生成场景',progress:.5});
        // Let the transition cover paint before copying/building the next area.
        await new Promise(resolve=>setTimeout(resolve,0));
        check();
        terrain=this.createStageTerrain(true);
        metrics.terrain=await buildPaperWorldAsync(terrain,{check,
          onProgress:stats=>this.onLoadProgress?.({phase:'绘制桌面与纸张',detail:'已完成 '+stats.steps+' 组'})});
        await new Promise(resolve=>setTimeout(resolve,0));
        check();
        this.onLoadProgress?.({phase:'准备角色与场景物件',detail:'',progress:.7});
        this.buildStage(first,terrain,true);
        this.onLoadProgress?.({phase:'摆放场景物件',detail:'',progress:.75});
        metrics.interactions=await this.interactables.populateAsync();
      } catch(error){if(terrain&&terrain!==this.terrain)terrain.dispose();throw error;}
      finally {this.buildingStage=false;}
    }
    buildStage(e, preparedTerrain, deferred = false) {
      this.dragonDuel = false;
      let t = this.r,
        r = this.stage === 4 ? (this.biome.sanctuary ?? null) : null;
      this.streakPaid.clear();
      this.terrain=preparedTerrain??this.createStageTerrain();
      let i = this.tower,a=this.zone;
      if (
        (this.terrain.setSunDir(a.sunDir),
        t.scene.add(this.terrain.group),
        t.setSun(a.sunDir, a.sunH, a.glow, a.glowK, a.stars),
        i?.buildFloor(),
        r && (this.sanctuary = kC(this, r)),
        e)
      ) {
        ((this.enemies = new Pf(this)),
          (this.projectiles = new tm(this)),
          (this.pickups = new gm(this)),
          (this.combat = new e_(this)),
          (this.zones = new G_(this)),
          (this.boss = new Iy(this)),
          (this.player = new Ov(this, this.startSpecies, this.meta.labStats())),
          (this.allies = new Pm(this)),
          (this.ult = new NT(this)),
          this.sprites.preload(this.ult.def.preload ?? []),
          this.meta.lab(`revive`) && this.player.addItem(`max-revive`));
        if (this.stage === 1 && this.biome.id === 'forest' && (this.mode === 'standard' || this.mode === SINGLE_STAGE)) {
          this.player.addItem(springShoesKey);
        }
        let e = this.player.roster ? k.movesByKey.get(this.player.roster.kit[0])?.id : void 0;
        (this.player.addMove(e ?? j_(this.startSpecies)),
          (this.nextEvo = this.planEvolution(this.startSpecies, 1)));
      } else
        (this.enemies.clear(),
          this.projectiles.clear(),
          this.pickups.clear(),
          this.zones.clear(),
          this.vfx.clear(),
          this.ult.clear());
      this.mapEvents.clear();
      this.stageTime = 0;
      this.player.moveSlots = this.stage > 1 && this.meta.lab('slot-move') ? 4 : 3;
      this.sprites.discardUnusedWarmGlyphs();
      ((this.minibosses = new sb(this)),
        (this.events = new ub(this)),
        (this.director = new Av(this)),
        (this.capture = new Eb(this)),
        (this.interactables = new GS(this,deferred)),
        (this.roars = 0),
        (this.mewtwo = new Ab(this)),
        i?.onFloor(),
        this.player.pos.copy(this.terrain.spawn),
        this.player.vel.set(0, 0, 0),
        this.allies.onStage(),
        (this.player.sashUsed = !1),
        (this.player.rainbowUsed = !1),
        this.camTarget.copy(this.player.pos),
        (this.bossSpawned = !1),
        (this.stageCleared = !1),
        (this.baseWeather = r || i ? `clear` : F.pick(this.biome.weather)));
      let o = uv(this.player.ability);
      (o.weather && (this.baseWeather = o.weather),
        (this.weather = this.baseWeather),
        this.applyWeatherLook(),
        e && this.audio.preloadTrack(`boss`),
        this.audio.playTrack(this.musicFor()));
    }
    planEvolution(e, t) {
      let n = this.player?.roster;
      if (n?.branch && e === n.id) return { to: -1, level: n.evoLevel ?? 36 };
      let r = k.runEvolution(e);
      if (!r) return null;
      let i = n?.evoLevel && e === n.id ? n.evoLevel : r.level;
      if (n?.evoLevels) {
        let t = 0;
        for (let r = e; r !== n.id && k.get(r).evoFrom != null; r = k.get(r).evoFrom) t++;
        n.evoLevels[t] != null && (i = n.evoLevels[t]);
      }
      return { to: r.to.id, level: Math.max(i, t) };
    }
    later(e, t) {
      if (Fl.own) {
        let e = t;
        t = () => {
          Fl.enter(this.hideOwnFx);
          try {
            e();
          } finally {
            Fl.leave();
          }
        };
      }
      this.timers.push({ t: e, fn: t });
    }
    animate(e, t, n) {
      if (Fl.own) {
        let e = t,
          r = n;
        ((t = (t) => {
          Fl.enter(this.hideOwnFx);
          try {
            e(t);
          } finally {
            Fl.leave();
          }
        }),
          r &&
            (n = () => {
              Fl.enter(this.hideOwnFx);
              try {
                r();
              } finally {
                Fl.leave();
              }
            }));
      }
      this.anims.push({ t: 0, dur: e, fn: t, done: n, cine: this.frozen });
    }
    get frozen() {
      return this.state === `evolving` || this.state === `cinematic` || this.state === `capturing`;
    }
    whenFree(e) {
      this.state === `play`
        ? e()
        : this.state !== `dead` &&
          this.state !== `over` &&
          !this.player.dead &&
          this.later(0.2, () => this.whenFree(e));
    }
    stepAnims(e, t = !1) {
      let n = 0;
      for (let r of this.anims)
        (!t || r.cine) && ((r.t += e), r.fn(Math.min(1, r.t / r.dur)), r.t >= r.dur && n++);
      if (!n) return;
      let r = this.anims.filter((e) => e.t >= e.dur);
      this.anims = this.anims.filter((e) => e.t < e.dur);
      for (let e of r) e.done?.();
    }
    cry(e, t = 1) {
      (this.ult?.active > 0 && this.ult.quiet) || this.audio.cry(e, t);
    }
    shake(e, t, n) {
      let r = this.meta.profile.settings;
      if (!r.shakeOn) return;
      let i = 1;
      t != null &&
        n != null &&
        (i = Gs(1 - Math.hypot(t - this.player.pos.x, n - this.player.pos.z) / 40, 0, 1));
      let a = e < 0.15 ? vE : 0.7;
      this.trauma = Math.max(this.trauma, Math.min(a, this.trauma + e * i * 0.55 * r.screenShake));
    }
    hitstop(e) {
      this.hitstopT = Math.max(this.hitstopT, e);
    }
    addGold(e) {
      let t = Math.round(e);
      ((this.gold += t), (this.stats.gold += t), t > 0 && this.meta.count(`gold`, t));
    }
    spawnChestAt(e, t, n, r = e, i = t) {
      this.interactables.spawnChest(e, t, n === `free`, !1, r, i);
    }
    queueLevelUp() {
      this.pendingLevels++;
      if (this.rerolls === 0 && Math.random() < .5) this.rerolls = 1;
    }
    pendingBlessings = [];
    queueBlessing(e, t = 0) {
      this.pendingBlessings.push({ title: e, min: t });
    }
    auraRing(e, t, n, r, i) {
      this.vfx.staticRing(e, t, n, r, i, 0.6);
    }
    altarRing(e, t, n, r, i, a = 5959935) {
      (this.vfx.ground.spawn({
        x: e,
        y: t + 0.3,
        z: n,
        life: 0.14,
        size: r * 2,
        endSize: r * 2,
        color: a,
        shape: I.Ring,
        glow: a === 5959935 ? ALTAR_RING_EMISSIVE : 0.3,
        rot: 0,
      }),
        this.vfx.ground.spawn({
          x: e,
          y: t + 0.28,
          z: n,
          life: 0.14,
          size: r * 2 * i,
          endSize: r * 2 * i,
          color: (a >> 1) & 8355711,
          shape: I.Soft,
          glow: 0,
          rot: 0,
        }));
    }
    slash(e, t, n, r, i, a, o, s) {
      let c = Math.atan2(i, r),
        l = a * 0.7,
        u = 0,
        d = 0;
      for (let a = 0; a <= 7; a++) {
        let f = c + (s ? 1 : -1) * (-1.1 + (a / 7) * 2.2),
          p = e + Math.cos(f) * l - r * l * 0.5,
          m = n + Math.sin(f) * l - i * l * 0.5,
          h = t + (a / 7 - 0.5) * 0.6 * (s ? -1 : 1);
        (a > 0 && this.vfx.beams.spawn(u, h, d, p, h, m, 0.45 * (1 - Math.abs(a / 7 - 0.5)), o, 0.16),
          (u = p),
          (d = m),
          a % 2 == 0 &&
            this.vfx.add.spawn({
              x: p,
              y: h,
              z: m,
              vx: Math.cos(f) * 3,
              vz: Math.sin(f) * 3,
              life: 0.25,
              size: 0.5,
              endSize: 0,
              color: o,
              shape: I.Spark,
              glow: 0.6,
            }));
      }
      this.vfx.flash(e, t, n, o, a * 0.6, 0.08);
    }
    ghostDash(e, t, n, r, i, a, o, fireGlyph=false) {
      if(fireGlyph&&!this.vfx.crafted.allowed())return;
      let s = this.sprites.dirRow(r, i);
      // Keep the reference effect's five samples and original fade timing.
      // The fire variant changes only the letter used by those samples.
      for (let t = 1; t <= 5; t++) {
        let o = t / 5,
          c = e + r * a * o,
          l = n + i * a * o;
        if(this.ghosts.length>=96)this.ghosts.shift();
        const life=.35+o*.15;
        this.ghosts.push({ x: c, y: this.terrain.surface(c, l), z: l, t:life,life,dir:s,
          ...(fireGlyph?{fireGlyph:true,species:fireGlyph.species,scale:fireGlyph.scale}:{}) });
      }
      for (let s of [0.45, 0.95, 1.45])
        this.vfx.beams.spawn(e, t + s, n, e + r * a, t + s, n + i * a, 0.16, o, 0.22, 0.75);
      for (let s = 0; s < 16; s++) {
        let s = Math.random();
        this.vfx.add.spawn({
          x: e + r * a * s,
          y: t + Math.random() * 1.5,
          z: n + i * a * s,
          vx: r * 6,
          vz: i * 6,
          life: 0.4,
          size: 0.6,
          endSize: 0,
          color: o,
          shape: I.Spark,
          glow: 0.5,
        });
      }
    }
    setCine(e) {
      Object.assign(this.cine, { orbit: 0 }, e, { want: 1 });
    }
    endCine() {
      this.cine.want = 0;
    }
    captureCam(e, t, n) {
      this.setCine({ follow: -1, x: e, y: t + 0.6, z: n, dist: 2.6, pitch: 0.08, orbit: 0 });
    }
    captureZoom(e) {
      this.cine.dist = e;
    }
    captureFocus(e, t) {
      this.cine.y += (e - this.cine.y) * Math.min(1, t * 5);
    }
    endCaptureCam(e) {
      this.later(e, () => {
        this.cine.follow === -1 && (this.cine.want = 0);
      });
    }
    capBall = null;
    focusIdx = -1;
    capYaw = NaN;
    yawBack = NaN;
    beginCapture(e, t, n, r, i, a, o, s = !1) {
      this.state = `capturing`;
      // Combat time pauses during the throw. Retire the player's trailing images before the close-up.
      this.ghosts.length = 0;
      this.vfx.crafted.windSkills?.stop('quickHalo');
      let c = this.player.pos,
        l = Math.sign(Math.sin(this.camYaw - Math.atan2(c.x - a, c.z - o))) || 1;
      ((this.yawBack = this.camYaw),
        (this.capYaw = Math.atan2(c.x - a, c.z - o) + l * 1.15),
        (this.capBall = e),
        (this.focusIdx = t),
        this.audio.duck(0.2, 4.4),
        this.ui.setPrompt(null),
        this.ui.captureStart(n, r, i, s, this.enemies.glyphWords[t]));
    }
    endCapture(e) {
      ((this.capBall = null),
        (this.focusIdx = -1),
        (this.capYaw = NaN),
        this.state === `capturing` && (this.state = `play`),
        (this.player.iframes = Math.max(this.player.iframes, 1.5)),
        (this.evoHold = Math.max(this.evoHold, 2.2)),
        this.endCaptureCam(e),
        this.ui.captureEnd());
      for (let e of this.capHidden) e.visible = !0;
      this.capHidden.length = 0;
    }
    capHidden = [];
    clearCaptureView() {
      let e = this.r.camera.position,
        t = this.cine,
        n = t.x - e.x,
        r = t.z - e.z,
        i = n * n + r * r || 1;
      for (let a of this.interactables.list) {
        let o = a.group;
        if (!o || !o.visible) continue;
        if ((a.x - t.x) ** 2 + (a.z - t.z) ** 2 < 20.25) {
          ((o.visible = !1), this.capHidden.push(o));
          continue;
        }
        let s = ((a.x - e.x) * n + (a.z - e.z) * r) / i;
        if (s < -0.1 || s > 0.85) continue;
        let c = e.x + n * s - a.x,
          l = e.z + r * s - a.z;
        c * c + l * l < 2.6 * 2.6 && ((o.visible = !1), this.capHidden.push(o));
      }
    }
    sacrificeToDragon(boss) {
      this.projectiles.clearHostile();
      this.director.finalSwarm = false;
      this.events.end(true);
      this.events.meowth = -1;
      if (this.capture.index >= 0) {
        this.capture.state = 'done';
        this.capture.index = -1;
        this.capture.dropBeam();
      }
      this.lockTarget = -1;

      const enemies = this.enemies, fx = this.vfx;
      const x = enemies.x[boss], y = enemies.y[boss], z = enemies.z[boss];
      const heart = y + enemies.hgt[boss] * .55;
      const strokes = [];
      for (let id = 0; id < enemies.n; id++) {
        if (!enemies.alive[id] || id === boss || (enemies.flags[id] & R.Object)) continue;
        const dx = enemies.x[id] - x, dz = enemies.z[id] - z;
        strokes.push({dx, dz, y: enemies.y[id] + enemies.hgt[id] * .5, distance: dx*dx + dz*dz});
        // Sacrifices leave through the pool, bypassing combat rewards and death triggers.
        enemies.kill(id);
      }
      // Prioritize strokes near the intro camera when a whole horde is present.
      strokes.sort((a,b) => a.distance - b.distance);
      strokes.length = Math.min(24, strokes.length);
      const victims = strokes.length;
      // Interleave three waves around the camera, even when the altar was empty.
      // The deeper ellipse compensates for the portrait camera's foreshortening.
      const outerStrokes = 36;
      for (let i = 0; i < outerStrokes; i++) {
        const angle = 2 * Math.PI * (i + .3 * Math.sin(i * 2.4)) / outerStrokes;
        const radius = 8 + (i * 5 % 7) * .7;
        const dx = radius * Math.cos(angle), dz = radius * 1.45 * Math.sin(angle);
        strokes.push({dx, dz, y: this.terrain.height(x + dx, z + dz) + .2});
      }
      const colors = [0xffc44e, 0xb14edd, 0xffe297, 0x9156e7, 0xe986ff];
      for (let i = 0; i < strokes.length; i++) {
        const stroke = strokes[i], wave = i % 3;
        stroke.delay = wave * .11 + (i * 7 % 11) * .005;
        stroke.bend = .58 + (i % 4) * .16;
        stroke.lift = 1 + wave * .8;
        stroke.width = .32 + (i % 4) * .13;
        stroke.color = colors[i % colors.length];
        if (i < victims) fx.burst(x + stroke.dx, stroke.y, z + stroke.dz, 0x60335f, 4, 2.2, I.Spark, .65, .35);
      }
      const tail = new ti(), middle = new ti(), head = new ti();
      function pointAt(out, stroke, t) {
        const reach = 1 - t * t, angle = t * stroke.bend;
        const cos = reach * Math.cos(angle), sin = reach * Math.sin(angle);
        return out.set(x + stroke.dx * cos - stroke.dz * sin,
          heart + (stroke.y - heart) * reach + stroke.lift * Math.sin(Math.PI * t),
          z + stroke.dx * sin + stroke.dz * cos);
      }
      const seconds = 1.55;
      fx.rings.spawn(x, y + .16, z, 10, .8, 0xb97ae9, seconds, 1, .35);
      let frame = -1;
      this.animate(seconds, progress => {
        const next = Math.floor(progress * seconds * 24);
        if (frame === next) return;
        frame = next;
        for (const stroke of strokes) {
          const t = (progress - stroke.delay) / .54;
          if (t <= 0 || t >= 1.35) continue;
          const back = Math.max(0, t - .35), front = Math.min(1, t);
          pointAt(tail, stroke, back);
          pointAt(middle, stroke, (back + front) * .5);
          pointAt(head, stroke, front);
          fx.beams.spawn(tail.x, tail.y, tail.z, middle.x, middle.y, middle.z, stroke.width * .65, stroke.color, .12);
          fx.beams.spawn(middle.x, middle.y, middle.z, head.x, head.y, head.z, stroke.width, stroke.color, .12);
        }
      });
      return seconds;
    }
    introBoss(e, t, summonMode) {
      this.state = `cinematic`;
      const enemies = this.enemies, species = enemies.species[e], yaw = this.camYaw;
      this.setCine({follow:e, dist:4.5 + enemies.hgt[e] * 1.4, pitch:.12, orbit:.3});
      if (species === finalBossSpecies) {
        this.dragonDuel = true;
        beginDragonSummon(this, e, fx => this.playDragonIntro(e, summonMode, yaw, fx));
        return;
      }
      const seconds = t ? 3.2 : 2.6;
      this.ui.bossIntro(species, t, seconds, enemies.glyphWords[e], c(t ? `Legendario` : `Guardián`));
      this.audio.duck(.25, seconds);
      this.revealBoss(e, seconds, .35, t, yaw);
    }
    playDragonIntro(id, summonMode, yaw, fx) {
      const revealSeconds = 2.25;
      this.audio.duck(.25, dragonChantSeconds + revealSeconds);
      const chant = this.ui.dragonChant = startDragonChant(this.ui, beat => {
        J.whoosh(this.audio, .4 + beat * .08, .11, 560 + beat * 130);
        if (beat === 3) this.audio.boom(.55);
      }, summonMode);
      const endIntro = () => {
        this.state = 'play'; this.cine.want = 0; this.yawBack = yaw; this.ui.endCinematic();
      };
      this.animate(dragonChantSeconds, progress => {
        if (fx && this.dragonHd !== fx) return;
        const elapsed = progress * dragonChantSeconds;
        chant.draw(elapsed);
        fx?.update(elapsed);
      }, () => {
        if (fx && this.dragonHd !== fx) return;
        chant.clearWords();
        if (!this.boss.live(id)) {
          clearDragonSummon(this);
          endIntro();
          return;
        }
        if (!fx) {
          const travelSeconds = this.sacrificeToDragon(id);
          this.revealBoss(id, revealSeconds, travelSeconds / revealSeconds, true, yaw);
          return;
        }
        fx.beginGather();
        fx.update(dragonChantSeconds);
        this.animate(revealSeconds, progress => {
          if (this.dragonHd === fx) fx.update(dragonChantSeconds + progress * revealSeconds);
        }, () => {
          if (this.dragonHd !== fx) return;
          fx.dispose();
          this.dragonHd = null;
          endIntro();
        });
      });
    }
    revealBoss(e, r, roarAt, golden, yaw) {
      const n = this.enemies, i = n.species[e];
      let o = golden ? 16765498 : 16730762,
        s = !1;
      this.animate(
        r,
        (t) => {
          let r = n.x[e],
            a = n.y[e],
            c = n.z[e];
          (Math.random() < 0.5 &&
            this.vfx.add.spawn({
              x: r + F.range(-3, 3),
              y: a + F.range(0, 0.5),
              z: c + F.range(-3, 3),
              vy: F.range(2, 5),
              life: 0.8,
              size: 0.4,
              endSize: 0,
              color: o,
              shape: I.Spark,
              glow: 0.8,
            }),
            !s &&
              t > roarAt &&
              ((s = !0),
              this.cry(i),
              (n.flash[e] = 0.6),
              this.vfx.ring(r, a, c, 6, o, 0.5),
              this.vfx.ring(r, a, c, 10, 16777215, 0.6),
              this.vfx.dust(r, a, c, 13154456, 20, 7),
              this.shake(0.7)));
        },
        () => {
          ((this.state = `play`), (this.cine.want = 0), (this.yawBack = yaw), this.ui.endCinematic());
        },
      );
    }
    onKill() {
      (this.streak++,
        (this.streakT = e.STREAK_WINDOW),
        this.streak > this.stats.bestStreak && (this.stats.bestStreak = this.streak),
        this.audio.streak(this.streak),
        e.STREAK_STEPS.includes(this.streak) &&
          !this.streakPaid.has(this.streak) &&
          (this.streakPaid.add(this.streak), this.streakReward(this.streak)));
    }
    static STREAK_WINDOW = 3;
    static STREAK_STEPS = [10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1e3];
    streakReward(e) {
      let t = this.player,
        n = Math.round((3 + e * 0.04) * this.stage);
      this.addGold(n);
      let r = [`+${n} ₽`];
      (e >= 25 && ((this.pickups.magnetAll = 4), r.push(c(`imán de caramelos`))),
        e >= 50 && (t.heal(t.maxHp * 0.15), r.push(c(`+15% PS`))),
        this.ui.toast(c(`¡Racha ×{n}! {extra}`, { n: e, extra: r.join(` · `) }), e >= 25 ? `magnet` : null),
        this.vfx.ring(t.pos.x, t.pos.y, t.pos.z, 4 + Math.min(6, e / 50), 16765498, 0.45),
        this.vfx.burst(t.pos.x, t.pos.y + 1.2, t.pos.z, 16765498, 16, 6, I.Star, 0.5, 0.6),
        this.audio.streakMilestone());
    }
    setBaseWeather(e) {
      ((this.baseWeather = e), this.weatherT <= 0 && ((this.weather = e), this.applyWeatherLook()));
    }
    setWeather(e, t) {
      ((this.weather = e),
        (this.weatherT = t),
        this.applyWeatherLook(),
        this.ui.toast(
          c(`¡El clima cambia: {weather}!`, {
            weather: {
              rain: c(`Lluvia`),
              sun: c(`Sol`),
              sand: c(`Tormenta de arena`),
              hail: c(`Granizo`),
              fog: c(`Niebla`),
              ash: c(`Ceniza`),
              clear: c(`Despejado`),
            }[e],
          }),
          null,
          undefined,
          e,
        ));
    }
    applyWeatherLook() {
      let e = this.sanctuary?.def ?? this.zone,
        t = this.weather,
        n =
          t === `fog`
            ? e.fogNear * 0.5
            : t === `sand`
              ? e.fogNear * 0.6
              : t === `hail`
                ? e.fogNear * 0.7
                : e.fogNear,
        r =
          t === `fog`
            ? e.fogFar * 0.6
            : t === `sand`
              ? e.fogFar * 0.7
              : t === `rain`
                ? e.fogFar * 0.85
                : t === `hail`
                  ? e.fogFar * 0.75
                  : e.fogFar,
        i =
          t === `sand`
            ? 14203008
            : t === `rain`
              ? new Ei(e.fog).multiplyScalar(0.8).getHex()
              : t === `hail`
                ? new Ei(e.fog).lerp(new Ei(15266559), 0.5).getHex()
                : e.fog,
        a = this.look;
      (a.top.set(e.sky[0]),
        a.bottom.set(t === `rain` ? 10135736 : e.sky[1]),
        a.fog.set(i),
        (a.near = n),
        (a.far = r),
        (a.light = e.light * (t === `rain` ? 0.8 : t === `sun` ? 1.15 : 1)),
        a.sun.set(e.sun),
        (a.hemi = e.hemiGround),
        (this.r.shared.uWind.value = t === `sand` || t === `rain` ? 2.2 : 1),
        this.pushLook());
    }
    ultFx = { k: 0, t: 0, r: 1, g: 1, b: 1 };
    tide = new Gy(this);
    mapEvents = new ab(this);
    shop = null;
    ultLook(e, t) {
      let n = new Ei(e),
        r = this.ultFx;
      ((r.r = n.r), (r.g = n.g), (r.b = n.b), (r.t = t));
    }
    ultAtmos(e, t, n, r) {
      let i = this.ultFx.k;
      if (i <= 0) return [e, t, n, r];
      let a = this.ultFx,
        o = 1 - 0.28 * i,
        s = 0.4 * i;
      return [
        e + (0.95 - e) * i,
        t * o * (1 - s + s * (0.55 + 0.45 * a.r)),
        n * o * (1 - s + s * (0.55 + 0.45 * a.g)),
        r * o * (1 - s + s * (0.55 + 0.45 * a.b)),
      ];
    }
    zone;
    look = {
      top: new Ei(),
      bottom: new Ei(),
      fog: new Ei(),
      near: 40,
      far: 160,
      light: 1,
      sun: new Ei(),
      hemi: 9075290,
    };
    lookTmp = { top: new Ei(), bottom: new Ei(), fog: new Ei(), sun: new Ei() };
    pushLook() {
      if(this.terrain?.zxPaper){applyPaperLight(this);return;}
      let e = this.look,
        t = this.r,
        n =
          this.mewtwo?.atmos() ??
          this.events?.atmos() ??
          this.mapEvents?.atmos() ??
          this.endless?.atmos() ??
          this.tower?.atmos();
      if (!n) {
        t.setSky(
          e.top.getHex(),
          e.bottom.getHex(),
          e.fog.getHex(),
          e.near,
          e.far,
          e.light,
          e.sun.getHex(),
          e.hemi,
        );
        let n = this.zone,
          r = n.tint,
          [i, a, o, s] = this.ultAtmos(0.4, r[0], r[1], r[2]);
        t.setAtmos(n.clouds[0], n.clouds[1], n.clouds[2], n.cover, i, a, o, s);
        return;
      }
      let r = n.k,
        i = this.lookTmp,
        a = n.flash;
      (i.top.copy(e.top).lerp(n.top, r),
        i.bottom.copy(e.bottom).lerp(n.bottom, r),
        i.fog.copy(e.fog).lerp(n.fog, r),
        i.sun.copy(e.sun).lerp(n.sun, r),
        a > 0 && (i.top.lerp(pE, a * 0.35), i.bottom.lerp(pE, a * 0.5), i.fog.lerp(pE, a * 0.25)));
      let o = e.light + (n.light - e.light) * r + a * 0.9;
      t.setSky(
        i.top.getHex(),
        i.bottom.getHex(),
        i.fog.getHex(),
        e.near + (n.near - e.near) * r,
        e.far + (n.far - e.far) * r,
        o,
        i.sun.getHex(),
        e.hemi,
      );
      let s = n.tint,
        c = 1 + a * 0.8,
        l = this.zone,
        u = l.tint,
        d = l.clouds,
        [f, p, m, h] = this.ultAtmos(
          0.4 + (n.vignette - 0.4) * r,
          (u[0] + (s[0] - u[0]) * r) * c,
          (u[1] + (s[1] - u[1]) * r) * c,
          (u[2] + (s[2] - u[2]) * r) * c,
        );
      t.setAtmos(
        d[0] + (n.clouds[0] - d[0]) * r,
        d[1] + (n.clouds[1] - d[1]) * r,
        d[2] + (n.clouds[2] - d[2]) * r,
        l.cover + (n.cover - l.cover) * r,
        f,
        p,
        m,
        h,
      );
    }
    nuke(e = !1) {
      let t = this.player.pos;
      (this.vfx.flash(t.x, t.y + 1, t.z, 16777215, 40, 0.35),
        this.vfx.ring(t.x, t.y, t.z, 28, 16769162, 0.6),
        this.vfx.ring(t.x, t.y, t.z, 18, 16777215, 0.45),
        this.shake(0.6),
        this.audio.boom(1),
        e || this.ui.toast(c(`¡Explosión de Electrode! Limpias la zona`), `bomb`));
      for (let n of this.enemies.within(t.x, t.z, 28)) {
        let t = this.enemies.flags[n];
        if (t & R.Object) continue;
        let r = t & (R.Boss | 12290) ? this.enemies.maxHp[n] * 0.08 : 1e9;
        (e && t & R.Boss && (r = Math.min(r, Math.max(0, this.enemies.hp[n] - 1))),
          !(r <= 0) &&
            this.combat.hit(n, r, {
              type: `normal`,
              cls: `special`,
              fixed: !0,
              silent: !0,
              noReact: !0,
              knock: 6,
            }));
      }
    }
    revived(e) {
      let t = (e) => {
          try {
            e();
          } catch (e) {
            oc(`revive`, e);
          }
        },
        n = this.player;
      (Number.isFinite(n.pos.x + n.pos.y + n.pos.z) || (n.pos.copy(this.terrain.spawn), n.vel.set(0, 0, 0)),
        Number.isFinite(n.kx + n.kz) || (n.kx = n.kz = 0),
        (n.kx = n.kz = 0),
        (n.crowdX = n.crowdZ = 0),
        n.vel.set(0, 0, 0));
      let r = this.terrain.walkLim;
      ((n.pos.x = Gs(n.pos.x, -r, r)),
        (n.pos.z = Gs(n.pos.z, -r, r)),
        (n.pos.y = Math.max(n.pos.y, this.terrain.height(n.pos.x, n.pos.z))),
        this.camTarget.copy(n.pos),
        t(() => this.nuke(!0)),
        this.hitstop(0.35),
        t(() => this.audio.levelUp()),
        t(() => this.ui.reviveFlash()));
      let i = this.player.items.get(e) ?? 0;
      t(() =>
        this.ui.banner(
          c(e === `max-revive` ? `¡Revivir Máximo!` : `¡Revivir!`),
          i
            ? c(`Te han derrotado y vuelves a la lucha · {n} más en la mochila`, { n: i })
            : c(`Te han derrotado y vuelves a la lucha · era el último`),
          `#ffd23a`,
          { species: this.player.speciesId },
        ),
      );
    }
    repel() {
      let e = this.player.pos;
      (this.vfx.ring(e.x, e.y, e.z, 20, 11569919, 0.6),
        this.ui.toast(c(`¡Repelente! Los Pokémon se alejan`), `repel`));
      for (let t of this.enemies.within(e.x, e.z, 20)) {
        let n = this.enemies.flags[t],
          r = this.combat.resist(t),
          i = n & (R.Boss | R.Summoner) ? 0.05 : n & 12290 ? 0.2 : 1,
          a = this.enemies.x[t] - e.x,
          o = this.enemies.z[t] - e.z,
          s = Math.hypot(a, o) || 1;
        ((this.enemies.kx[t] += (a / s) * 40 * i),
          (this.enemies.kz[t] += (o / s) * 40 * i),
          (this.enemies.stun[t] = Math.max(this.enemies.stun[t], 1.5 * r)));
      }
      this.audio.power();
    }
    aimTarget(e) {
      let t = this.enemies,
        n = this.player.pos;
      if (
        this.lockTarget >= 0 &&
        t.isAlive(this.lockTarget) &&
        Math.hypot(t.x[this.lockTarget] - n.x, t.z[this.lockTarget] - n.z) < e * 1.6
      )
        return this.lockTarget;
      if (this.aimMode === `manual`) {
        let r = -Math.sin(this.camYaw),
          i = -Math.cos(this.camYaw),
          a = -1,
          o = -1;
        for (let s of t.within(n.x + r * e * 0.5, n.z + i * e * 0.5, e * 0.6)) {
          let c = t.x[s] - n.x,
            l = t.z[s] - n.z,
            u = Math.hypot(c, l) || 1,
            d = (c * r + l * i) / u - u / (e * 4);
          d > 0.8 && d > o && ((o = d), (a = s));
        }
        return a;
      }
      let r = -1,
        i = (e * 0.85) ** 2;
      const candidates=t.within(n.x,n.z,e);
      for (let a of candidates) {
        if (!(t.flags[a] & (R.Healer | R.Shielder))) continue;
        let e = (t.x[a] - n.x) ** 2 + (t.z[a] - n.z) ** 2;
        e < i && ((i = e), (r = a));
      }
      if (r >= 0) return r;
      let a = -1,
        o = e * e,
        s = -1,
        c = e * e,
        l = n.y + 0.9;
      for (let r of candidates) {
        let e = (t.x[r] - n.x) ** 2 + (t.z[r] - n.z) ** 2;
        (e < c && ((c = e), (s = r)),
          e < o &&
            this.terrain.lineClear(n.x, l, n.z, t.x[r], t.y[r] + t.hgt[r] * 0.5, t.z[r]) &&
            ((o = e), (a = r)));
      }
      return a >= 0 ? a : s;
    }
    aimDir(e, t) {
      let n = this.player.pos,
        r = this.aimTarget(e);
      if (this.aimMode === `manual` && (r < 0 || r !== this.lockTarget)) {
        let e = -Math.sin(this.camYaw),
          t = -Math.cos(this.camYaw),
          i = { x: e, y: Gs(-(this.camPitch - 0.35) * 0.4, -0.3, 0.3), z: t, has: !0, target: r };
        if (r >= 0) {
          let e = this.enemies.x[r] - n.x,
            t = this.enemies.z[r] - n.z,
            a = Math.hypot(e, t) || 1;
          ((i.x = e / a), (i.z = t / a), (i.y = 0));
        }
        return (this.lastAim.set(i.x, 0, i.z), i);
      }
      if (r < 0) return { x: this.lastAim.x, y: 0, z: this.lastAim.z, has: !1, target: -1 };
      let i = this.enemies,
        a = i.x[r] - n.x,
        o = i.z[r] - n.z,
        s = Math.hypot(a, o) || 1,
        c = (i.y[r] + i.hgt[r] * 0.5 - (n.y + 0.9)) / s;
      return (
        this.lastAim.set(a / s, 0, o / s),
        { x: a / s, y: Gs(c, -1.2, 1.2), z: o / s, has: !0, target: r }
      );
    }
    toggleLock() {
      let e = this.r.camera,
        t = this.enemies,
        n = new ti(),
        r = [];
      for (let i of t.within(this.player.pos.x, this.player.pos.z, 40)) {
        if (
          (n.set(t.x[i], t.y[i] + t.hgt[i] * 0.5, t.z[i]).project(e),
          n.z > 1 || Math.abs(n.x) > 1.05 || Math.abs(n.y) > 1.05)
        )
          continue;
        let a = t.flags[i] & (R.Boss | 12290) ? 0 : t.flags[i] & R.Elite ? 1 : 2,
          o = Math.hypot(n.x, n.y);
        (a === 2 && o > 0.35) || r.push({ j: i, pri: a, d: o });
      }
      r.sort((e, t) => e.pri - t.pri || e.d - t.d);
      let i =
        this.lockTarget >= 0 && t.isAlive(this.lockTarget) ? r.findIndex((e) => e.j === this.lockTarget) : -1;
      if (this.lockTarget >= 0 && t.isAlive(this.lockTarget) && i === r.length - 1) {
        this.lockTarget = -1;
        return;
      }
      let a = r[i + 1];
      ((this.lockTarget = a ? a.j : -1), a && this.audio.click());
    }
    get stageBossSpecies() {
      if (this.stage === 4 && this.biome.sanctuary) return finalBossSpecies;
      const pool = Je(this.stage >= 3 && !this.biome.sanctuary ? this.biome.legendaries :
        (this.biome.guardians?.[this.stage - 1] ?? [this.biome.bosses[this.stage - 1]]));
      const species = pool[(this.seed + this.stage) % pool.length];
      return k.hasSprite(species) ? species : this.biome.bosses[0];
    }
    spawnBoss(e, t, summonMode = 'manual') {
      if (this.dragonDuel) return;
      (this.coop?.bossCalled(e, t, summonMode), (this.bossSpawned = !0));
      let n = this.biome.sanctuary;
      if (this.stage === 4 && n) {
        this.spawnLegendary(summonMode);
        return;
      }
      let r = this.stage >= 3 && !n,
        o = this.terrain.randomPoint(F, e, t, 6, 10),
        s = this.boss.spawn(this.stageBossSpecies, o.x, o.z, r, {summonMode});
      (r && s >= 0 && this.capture.rollLegendShiny() && this.capture.shinyBoss(s),
        (this.audio.intensity = 1));
    }
    spawnLegendary(summonMode) {
      const t = finalBossSpecies;
      let n =
          Av.hpCurve(3, 7.5) *
          Av.BOSS_ZONE_HP[3] *
          this.diff.enemyHp *
          this.player.stats.difficulty *
          1.6 *
          1.35 *
          2.5,
        r = this.boss.spawn(t, 0, 8.5, !0, { summonMode, hp: n, dmg: 1.975 * 2.7, kit: !0, secs: wy.legendary });
      (r >= 0 && this.capture.rollLegendShiny() && this.capture.shinyBoss(r), (this.audio.intensity = 1));
    }
    debugMewtwo() {
      !this.sanctuary && !this.mewtwo.active && ((this.mewtwoFought = !1), (this.mewtwo = new Ab(this, !0)));
    }
    async warpSanctuary() {
      this.biome.sanctuary &&
        this.stage !== 4 &&
        ((this.stage = FOREST_COMBAT_ZONES), await this.enterPortal());
    }
    onBossKilled(e) {
      if (this.endless) {
        this.onMilestoneKilled(e);
        return;
      }
      if (this.tower) {
        this.dragonDuel = false;
        (this.tower.onBossKilled(e), this.checkpoint());
        return;
      }
      let t = this.enemies,
        n = this.biome.sanctuary,
        r = this.stage === 4 || (this.stage >= 3 && !n);
      (this.boss.kit && (this.boss.kit.dead = !0),
        this.projectiles.clearHostile(),
        this.sanctuary?.onVictory(),
        this.stats.bosses++,
        this.meta.count(`bosses`, 1),
        this.meta.count(`boss_` + this.biome.id, 1),
        r &&
          (this.stats.legendaries++,
          this.meta.count(`legendaries`, 1),
          this.meta.addResearch(t.species[e], 3),
          (this.regionCleared = !0)),
        (this.stageCleared = !0),
        this.stats.stagesCleared++,
        this.splits.push(this.time));
      let i = this.meta.profile.times[runRecordKey({biome:this.biome.id, tier:this.tier, mode:this.mode})]?.splits[this.splits.length - 1];
      (this.ui.split(this, this.splits.length, this.time, i == null ? null : this.time - i),
        this.checkpoint(),
        this.hitstop(0.5),
        this.shake(0.8),
        (this.audio.intensity = 0.3));
      let a = portalGuidance(this);
      (this.ui.banner(c(r ? `¡Legendario derrotado!` : `¡Guardián derrotado!`), a, `#ffd23a`, {
        species: t.species[e], glyph: t.glyphWords[e],
      }),
        this.audio.victory(),
        this.later(4, () => {
          let e = this.interactables.markers().filter((e) => !e.used && !e.data?.comet),
            t = e.filter(
              (e) => e.kind === `chest` || e.kind === `freechest` || e.kind === `cursedchest`,
            ).length;
          t === 1
            ? this.ui.toast(
                c(`Queda 1 Poké Ball en la zona: la ves marcada en el minimapa y en el mapa grande`),
                null,
              )
            : t > 1
              ? this.ui.toast(
                  c(`Quedan {n} Poké Balls en la zona: las ves marcadas en el minimapa y en el mapa grande`, {
                    n: t,
                  }),
                  null,
                )
              : e.some(
                  (e) =>
                    e.kind !== `portal` &&
                    e.kind !== `boss` &&
                    e.kind !== `shrine` &&
                    e.kind !== `magnet` &&
                    e.kind !== `berry` &&
                    e.kind !== `shroom`,
                ) &&
                this.ui.toast(
                  c(`Todavía quedan lugares por usar en la zona: los ves marcados en el minimapa`),
                  null,
                );
        }));
      let o = t.x[e],
        s = t.z[e];
      this.coop
        ? this.coop.placePortal(o, s, !!n && this.stage >= FOREST_COMBAT_ZONES)
        : this.interactables.spawnPortal(o, s, !!n && this.stage >= FOREST_COMBAT_ZONES);
      for (let n = 0; n < 20; n++)
        this.pickups.spawn(`coin`, o, t.y[e], s, Math.ceil(5 * this.stage * this.player.stats.gold));
    }
    onMilestoneKilled(e) {
      this.dragonDuel = false;
      let t = this.enemies,
        n = !!this.boss.kit;
      (this.boss.kit && (this.boss.kit.dead = !0),
        this.projectiles.clearHostile(),
        (this.bossSpawned = !1),
        this.stats.bosses++,
        this.meta.count(`bosses`, 1),
        this.meta.count(`boss_` + this.biome.id, 1),
        n &&
          (this.stats.legendaries++,
          this.meta.count(`legendaries`, 1),
          this.meta.addResearch(t.species[e], 3)),
        this.checkpoint(),
        this.hitstop(0.5),
        this.shake(0.8),
        (this.audio.intensity = 0.3),
        this.ui.banner(
          c(n ? `¡Legendario derrotado!` : `¡Hito superado!`),
          c(`Elige un pacto... si te atreves`),
          `#ffd23a`,
          { species: t.species[e] },
        ),
        this.audio.victory());
      let r = t.x[e],
        i = t.z[e];
      for (let n = 0; n < 20; n++)
        this.pickups.spawn(`coin`, r, t.y[e], i, Math.ceil(5 * this.stage * this.player.stats.gold));
      this.endless.onMilestoneKilled();
    }
    cineDeadT = 0;
    async enterPortal(portal = null) {
      if (this.state !== `play` || this.player.dead || this.capture.throwing) return;
      if (this.mode === SINGLE_STAGE && !this.stageCleared) return;
      const lastZone = this.stage >= 4 || (this.stage >= 3 && !this.biome.sanctuary);
      if (portal && this.interactables.warnedPortal !== portal) {
        const left = this.interactables.rewardsLeft();
        const messages = [];
        if (left) messages.push('附近还有 ' + left + ' 个奖励骰子');
        if (lastZone && this.capture.canWait()) messages.push('还有字灵等待收服');
        if (messages.length) {
          this.ui.toast(messages.join('，') + `。即将离开。`, 'poke-ball');
          this.audio.deny();
          this.interactables.warnedPortal = portal;
          this.interactables.dwellTime = 0;
          return;
        }
      }
      if (this.mode === SINGLE_STAGE) return this.finish(!0);
      if (this.coop) return this.coop.enterPortal();
      if (lastZone) return this.finish(!0);
      await this.changeZone();
    }
    async coopAdvance(e) {
      let t = (e) => new Promise((t) => setTimeout(t, e));
      for (
        let e = 0;
        e < 80 &&
        (this.state === `evolving` ||
          this.state === `cinematic` ||
          this.state === `capturing` ||
          this.state === `transition`);
        e++
      )
        await t(100);
      if (this.state === `modal`) {
        this.ui.toast(c(`Tu equipo cruza el portal: termina de elegir`), null);
        for (let e = 0; e < 60 && this.state === `modal`; e++) await t(100);
      }
      let n = this.state;
      n !== `over` &&
        n !== `dead` &&
        ((n === `modal` || n === `paused`) &&
          (this.ui.hideModal(), (this.state = `play`), (this.modalDeadT = 0)),
        e ? await this.finish(!0) : await this.changeZone());
    }
    changingZone = false;
    async changeZone() {
      if (this.changingZone || this.disposed || (this.player.dead && !this.coop) || this.state === 'dead' || this.state === 'over') return;
      this.changingZone = true;
      this.state = 'transition';
      try {
        this.audio.power();
        // Finish the interaction frame before disposing the world it is drawing.
        await Promise.resolve();
        if (this.disposed || this.state !== 'transition' || (this.player.dead && !this.coop)) return;
        this.terrain.dispose();
        this.interactables.dispose();
        this.capture.dispose();
        this.sanctuary?.dispose();
        this.sanctuary = null;
        this.timers.length = 0;
        this.anims.length = 0;
        this.ghosts.length = 0;
        this.ult.castPending = false;
        this.weatherT = 0;
        this.ultFx.t = 0;
        this.cine.want = 0;
        this.player.renderScale = 1;
        this.player.flash = 0;
        this.stage = this.biome.sanctuary ? (FOREST_ROUTE[this.stage] ?? this.stage + 1) : this.stage + 1;
        this.sprites.trim(3e3, uo ? 8e7 : 3e8);
        await this.buildStageAsync(false);
        this.coop?.onStage();
        await this.openStage();
        if (this.state === 'transition') this.state = 'play';
      } catch (error) {
        if (this.disposed || this.state === 'over') return;
        console.error('[pokebonk] No se pudo construir la zona', error);
        this.ui.toast(error instanceof MapSpawnError ? error.message : c(`No se pudo cargar la zona. La partida termina aquí y se guarda lo conseguido.`), null);
        this.endHow = 'error';
        this.finish(false);
      } finally {
        this.changingZone = false;
      }
    }
    async climb() {
      let e = this.tower;
      if (!e || this.state !== `play` || this.player.dead) return;
      ((this.state = `transition`), this.audio.power(), await this.ui.fade(!0));
      let t = this.state;
      if (this.player.dead || t === `dead` || t === `over`) this.ui.fade(!1);
      else {
        try {
          (e.dispose(),
            this.terrain.dispose(),
            this.interactables.dispose(),
            this.capture.dispose(),
            (this.timers.length = 0),
            (this.anims.length = 0),
            (this.ghosts.length = 0),
            (this.ult.castPending = !1),
            (this.weatherT = 0),
            (this.ultFx.t = 0),
            (this.cine.want = 0),
            (this.player.renderScale = 1),
            (this.player.flash = 0),
            e.advance(),
            (this.stage = e.curveStage),
            this.sprites.trim(3e3, uo ? 8e7 : 3e8),
            await this.buildStageAsync(!1),
            await this.openStage(),
            this.checkpoint());
        } catch (e) {
          (console.error(`[pokebonk] No se pudo construir el piso`, e),
            await this.ui.fade(!1),
            this.ui.toast(
              e instanceof MapSpawnError ? e.message : c(`No se pudo cargar la zona. La partida termina aquí y se guarda lo conseguido.`),
              null,
            ),
            (this.endHow = `error`),
            this.finish(!1));
          return;
        }
        ((this.state = `play`), await this.ui.fade(!1));
      }
    }
    migrations = 0;
    async migrate() {
      if (this.state !== `play` || this.player.dead || !this.endless || this.boss.alive || this.mewtwo.active)
        return;
      this.state = 'transition';
      this.audio.power();
      await Promise.resolve();
      if (!this.disposed && !this.player.dead && this.state === 'transition') {
        try {
          (this.terrain.dispose(),
            this.interactables.dispose(),
            this.capture.dispose(),
            this.migrations++,
            this.sprites.trim(3e3, uo ? 8e7 : 3e8),
            this.enemies.clear(),
            this.projectiles.clear(),
            this.pickups.clear(),
            this.zones.clear(),
            this.vfx.clear(),
            (this.ghosts.length = 0),
            (this.weatherT = 0),
            (this.ultFx.t = 0),
            (this.cine.want = 0));
          let e = this.r,
            t = (this.zone = fe(this.biome, 1 + (this.migrations % 3)));
          ((this.terrain = new cd(
            { ...this.biome, mapKey:'workshop-migration', sun: t.sun, light: t.light },
            (this.seed + (10 + this.migrations) * 7919) >>> 0,
            e.shared,
          )),
            this.terrain.setSunDir(t.sunDir),
            e.scene.add(this.terrain.group),
            e.setSun(t.sunDir, t.sunH, t.glow, t.glowK, t.stars),
            (this.minibosses = new sb(this)),
            (this.events = new ub(this)),
            (this.capture = new Eb(this)),
            (this.interactables = new GS(this)),
            this.player.pos.copy(this.terrain.spawn),
            this.player.vel.set(0, 0, 0),
            (this.player.iframes = Math.max(this.player.iframes, 2)),
            this.allies.onStage(),
            this.camTarget.copy(this.player.pos),
            this.endless.onMigrate(),
            this.interactables.spawnChest(this.terrain.spawn.x + 4, this.terrain.spawn.z + 3, !0),
            this.applyWeatherLook());
        } catch (e) {
          (console.error(`[pokebonk] No se pudo construir el mapa nuevo`, e),
            this.ui.toast(
              e instanceof MapSpawnError ? e.message : c(`No se pudo cargar la zona. La partida termina aquí y se guarda lo conseguido.`),
              null,
            ),
            (this.endHow = `error`),
            this.finish(!1));
          return;
        }
        ((this.state = `play`),
          this.ui.banner(
            c(`Tierras nuevas`),
            c(`Un mapa nuevo con todo por descubrir. La horda te ha seguido`),
            `#9a6aff`,
          ));
      }
    }
    onPlayerDeath() {
      this.player.heroPlayback = undefined;
      if (this.coop) this.coop.onDowned();
      else if (this.regionCleared) {
        if (this.capture.canWait()) {
          ((this.player.dead = !1),
            (this.player.hp = this.player.maxHp * 0.3),
            (this.player.iframes = 4),
            this.ui.toast(c(`¡Aguanta! Aún puedes capturarlo`), `poke-ball`));
          return;
        }
        ((this.player.dead = !1), (this.player.hp = 1), this.finish(!0));
      } else
        ((this.state = `dead`),
          (this.timeScale = 0.25),
          this.audio.defeat(),
          (this.audio.intensity = 0),
          this.later(0.6, () => this.finish(!1)));
    }
    checkpoint() {
      (this.meta.checkpoint({
        t: this.time,
        stage: this.tower ? this.tower.floor : this.stage,
        kills: this.stats.kills,
        level: this.player.level,
        damage: SE(this.stats.damage),
        splits: this.tower ? [] : this.splits.slice(),
      }),
        this.keepLive());
    }
    endInfo(e) {
      let t = this.player,
        n = e ? `won` : (this.endHow ?? (t.dead ? `died` : `quit`)),
        r = this.stats;
      return {
        how: n,
        hp: Math.round(Math.max(0, t.hp / t.maxHp) * 100) / 100,
        swarm: this.director.finalSwarm,
        ...(n === `died` && t.lastHit ? { by: t.lastHit.kind, sp: t.lastHit.species } : {}),
        hits: r.hits,
        dodges: r.dodges,
        taken: Math.round(
          Number.isFinite(r.damageTaken) ? Math.min(0x38d7ea4c68000, r.damageTaken) : 0x38d7ea4c68000,
        ),
      };
    }
    build() {
      let e = this.player,
        t = e.stats,
        n = {};
      for (let e of xE) Number.isFinite(t[e]) && (n[e] = Math.round(t[e] * 1e3) / 1e3);
      return {
        moves: e.moves
          .filter(Boolean)
          .map((e) => ({
            k: e.def.key,
            lv: e.level,
            dmg: Math.round(Math.min(0xe8d4a51000, Number.isFinite(e.damageDone) ? e.damageDone : 0)),
          })),
        items: Object.fromEntries(e.items),
        vits: [...e.vitamins].map(([e, t]) => ({ k: e, lv: t.level })),
        stats: n,
        passive: e.ability,
        peak: { items: this.peakItems, vits: +!!this.vitTaken },
      };
    }
    result(e) {
      let t = this.stats;
      return {
        species: this.startSpecies,
        finalSpecies: this.player.speciesId,
        biome: this.biome.id,
        tier: this.tier,
        stage: this.tower ? this.tower.floor : this.stage,
        time: this.time,
        kills: t.kills,
        damage: SE(t.damage),
        level: this.player.level,
        victory: this.tower ? this.tower.won : e && !this.endless,
        bosses: t.bosses,
        legendaries: t.legendaries,
        alphas: t.alphas,
        reactions: t.reactions,
        moves: this.player.moves.filter(Boolean).map((e) => e.def.key),
        items: [...this.player.items.keys()],
        splits: this.splits.slice(),
        mode: this.mode,
        ...(this.coop ? { coop: { party: this.coop.party, size: this.coop.size, kills: this.coop.teamKills, members:
          this.coop.roster.map(m=>({...m,kills:m.id===this.coop.room.me?t.kills:this.coop.peers.get(m.id)?.kills||0})) } } : {}),
        ...(this.endless ? { pacts: this.endless.pacts.slice() } : {}),
        ...(this.tower ? { tower: this.tower.result() } : {}),
        ...(this.slotSpins
          ? { slots: { spins: this.slotSpins, spent: this.slotSpent, prizes: { ...this.slotPrizes } } }
          : {}),
        econ: {
          gold: Math.round(t.gold),
          balls: this.chestsBought,
          shop: Math.round(this.econ.shop),
          sold: this.econ.sold,
        },
        ...(this.shrines.fossil.length || this.shrines.roars
          ? {
              shrines: {
                fossil: this.shrines.fossil.slice(),
                roars: this.shrines.roars,
              },
            }
          : {}),
        ...(t.megaCrits || t.slams || t.powerUps || t.eggs
          ? { extras: { megaCrits: t.megaCrits, slams: t.slams, powerUps: t.powerUps, eggs: t.eggs } }
          : {}),
        ...(this.fusions.length ? { fusions: this.fusions.slice() } : {}),
        end: this.endInfo(e),
        ...((e) => (e ? { build: e } : {}))(
          (() => {
            try {
              return this.build();
            } catch (e) {
              oc(`build`, e);
              return;
            }
          })(),
        ),
      };
    }
    keepLive() {
      if(!this.player||!this.director)return;
      if (!(this.state === `over` || this.sent))
        try {
          this.meta.keepLive(this.result(!1), {
            league: this.stats.captured,
            shinies: this.stats.shinies,
            classics: this.stats.classics,
          });
        } catch (e) {
          console.warn(e);
        }
    }
    finish(e, t = !1) {
      if (this.state === `over`) return Promise.resolve();
      ((this.state = `over`), (this.victory = this.tower ? this.tower.won : e), (this.timeScale = 1));
      let n = this.stats,
        r = this.result(e),
        i = { ...r, id: ``, date: Date.now(), score: hn(r), seed: this.seed, ranked: !1 };
      return (
        this.coop?.onFinish(),
        t || this.ui.saving?.(!0),
        this.meta
          .endRun(r, { league: n.captured.slice(), shinies: n.shinies.slice(), classics: n.classics.slice() })
          .finally(() => this.ui.saving?.(!1))
          .then((e) => {
            this.state === `over` && !t && this.ui.showSummary(this, e.record, e);
          })
          .catch((e) => {
            this.state === `over` && !t && this.ui.showSummary(this, i, null, e.message);
          })
          .finally(() => {
            this.sent = !0;
          })
      );
    }
    evoReady() {
      let e = this.nextEvo;
      return !!e && this.player.level >= e.level && (e.to === -1 || k.hasSprite(e.to));
    }
    tryEvolve() {
      return this.evoReady()
        ? this.nextEvo.to === -1 && this.player.roster?.branch
          ? ((this.state = `modal`),
            this.ui.showBranch(
              this,
              Je(this.player.roster.branch).filter((e) => k.hasSprite(e)),
              (e) => {
                (this.ui.hideModal(),
                  (this.nextEvo = { to: e, level: this.player.level }),
                  (this.state = `play`),
                  this.startEvolution());
              },
            ),
            !0)
          : (this.startEvolution(), !0)
        : !1;
    }
    doLevelUp() {
      if (this.state !== `play` || this.pendingLevels <= 0 || this.upgradeTiming.waiting(this.ult) || this.ui.experienceReady?.() === false || this.tryEvolve()) return;
      ((this.state = `modal`), this.audio.levelUp(), this.hints.show(`level`));
      let t = this.meta.lab(`choice4`) ? 4 : 3,
        n = (e = !0) => {
          this.pendingLevels = Math.max(0, this.pendingLevels - 1);
          this.noResumeGrace = !e;
          if(this.pendingLevels>0){
            this.ui.hideModal();
            this.state='play';
            this.doLevelUp();
          }else{
            this.resume();
          }
        },
        r = () => {
          try {
            (this.player.heal(this.player.maxHp * 0.2), this.addGold(15), this.train());
          } catch (e) {
            oc(`levelup`, e);
          } finally {
            n(!1);
          }
        },
        resolveChoice = (offer, action, automatic = false) => {
          try {
            if (offer) {
              if (!Gb(this, offer)) return showOffers(Ub(this, t));
              if (automatic) {
                const description = Wb(this, offer);
                this.ui.toast(c(`Nivel: {name} ({sub})`, {name: description.title, sub: description.sub}), null);
              }
            } else {
              if (action === 'skip') {
                this.skips--;
                this.addGold(Math.max(10 * this.stage, 0.2 * OS(this)));
              }
              this.player.recompute();
            }
          } catch (e) {
            oc(`levelup`, e);
          }
          if (!automatic) globalThis.__pbCoop?.localPicked?.();
          n(!automatic);
        },
        showOffers = (e) => {
          e.length
            ? e.length === 1 && this.meta.profile.settings.skipEmptyLevelUp
              ? resolveChoice(e[0], null, true)
              : this.ui.showLevelUp(this, e, (e, r) => {
                  if (r === `reroll`) {
                    if (this.rerolls <= 0) return;
                    this.rerolls--;
                    showOffers(Ub(this, t));
                  }
                  else if (r === `banish` && e) (this.banishes--, this.banished.add(e.key), showOffers(Ub(this, t)));
                  else resolveChoice(e, r);
                })
            : r();
        };
      globalThis.__pbCoop && __pbCoop.openLevel
        ? __pbCoop.openLevel(this, () => showOffers(Ub(this, t)))
        : showOffers(Ub(this, t));
    }
    training = new Map();
    autoRun = !1;
    trainedLevels = 0;
    train() {
      let e = hE.filter(([e]) => !(e === `critChance` && this.player.stats.megaCrit >= 1)),
        [t, n, r, i] = F.pick(e),
        a = r / Math.min(_E, 1 + this.trainedLevels / gE),
        o = this.training.get(t);
      (o ||
        ((o = n === `mul` ? { stat: t, mul: 1 } : { stat: t, add: 0 }),
        this.training.set(t, o),
        this.tempMods.push(o)),
        n === `mul` ? (o.mul += a) : (o.add += a),
        this.player.recompute(),
        this.trainedLevels++ ||
          this.ui.banner(
            c(`¡Entrenamiento!`),
            c(`Ya lo has aprendido todo: cada nivel te da ahora un bono pequeño y permanente`),
            `#ffc23a`,
          ),
        this.ui.trained(i(a)));
    }
    startEvolution() {
      let e = this.player.speciesId,
        t = this.nextEvo.to,
        n = this.player,
        r = EVOLUTION_REVEAL,
        o = Math.round(n.maxHp);
      ((this.state = `evolving`),
        (this.ult.castBanner = null),
        this.sprites.get(t),
        this.audio.evolve(r),
        this.audio.duck(0.2, EVOLUTION_DURATION),
        this.cry(e),
        this.ui.showEvolution(e, t, r));
      this.sprites.prepareHeroForm(t,this.r.renderer);
      // The brush master contains only light. Flash the actual glyph on the
      // photographed beats, including when the full-screen artwork is ready.
      const glyphFlash=amount=>this.hideOwnFx?0:
        amount*this.vfx.opacity*this.vfx.ownOpacity*(this.vfx.calm?.18:1);
      n.heroPlayback=undefined;
      n.evolutionGlyph=this.hideOwnFx?undefined:evolutionPose(0).glyph;
      let s = this.camYaw;
      this.setCine({ follow: -2, dist: 3.6, pitch: 0.22, orbit: 0 });
      this.vfx.upgrade.play(n,true,r);
      n.renderScale=1;
      let advanceRelease,evolvedMaxHp;
      const reveal=()=>{
        n.speciesId=e;
        n.setSpecies(t);
        n.renderScale=1;
        n.iframes=Math.max(n.iframes,2.6);
        this.nextEvo=this.planEvolution(t,n.level+3);
        this.stats.evolutions++;
        this.meta.count('evolutions',1);
        this.meta.unlockForm(t);
        evolvedMaxHp=Math.round(n.maxHp);
        const enemies=this.enemies,targets=enemies.within(n.pos.x,n.pos.z,18);
        const generations=targets.map(id=>enemies.gen[id]);
        const type=n.types[0],damage=80*n.level;
        let nextTarget=0,resultReady=false;
        this.cry(t);
        this.audio.evolveDone();
        return progress=>{
          // Distribute the reveal's hits over the release while combat is paused.
          const end=Math.min(targets.length,Math.max(nextTarget+6,Math.ceil(targets.length*progress)));
          while(nextTarget<end){
            const index=nextTarget++,id=targets[index];
            if(enemies.gen[id]!==generations[index]||!enemies.isAlive(id)||enemies.flags[id]&R.Capture)continue;
            if(enemies.flags[id] & (R.Boss | 12290))
              this.combat.hit(id,enemies.maxHp[id]*.05,{type,cls:'special',fixed:true,silent:true,noReact:true});
            else this.combat.hit(id,damage,{type,cls:'special',silent:true,knock:8,noReact:true});
          }
          if(!resultReady&&progress>=.25){
            this.ui.prepareEvolutionResult?.(e,t,o,evolvedMaxHp);
            resultReady=true;
          }
        };
      };
      // The reveal can fall between screen refreshes. One clock carries that
      // fraction of a frame into the new pose, its light and its landing.
      this.animate(
        EVOLUTION_DURATION,
        (progress) => {
          const elapsed=progress*EVOLUTION_DURATION;
          if(elapsed+1e-8>=r){
            advanceRelease??=reveal();
            advanceRelease(Math.max(0,(elapsed-r)/(EVOLUTION_DURATION-r)));
          }
          const pose=evolutionPose(elapsed);
          if(advanceRelease)n.evolutionLift=this.hideOwnFx?0:this.vfx.upgrade.camera.lift(pose.lift);
          n.flash=glyphFlash(pose.flash);
          n.evolutionGlyph=this.hideOwnFx?undefined:pose.glyph;
        },
        () => {
          n.renderScale=1;
          n.evolutionGlyph=undefined;n.evolutionLift=0;n.flash=0;
          this.ui.evolutionReveal(e,t,o,evolvedMaxHp);
          this.state='play';this.cine.want=0;this.yawBack=s;
          this.ui.endCinematic();this.evoHold=2.4;
        },
      );
    }
    resumedAt = -1e9;
    resumedFrom = ``;
    noResumeGrace = !1;
    musicT = 0;
    resume() {
      if(this.coop?.reconnecting || this.coop?.suspended)return;
      if (this.state !== `modal` && this.state !== `paused`) return;
      let e = this.state;
      (this.state === `modal` &&
        !this.noResumeGrace &&
        (this.player.iframes = Math.max(this.player.iframes, mE)),
        (this.noResumeGrace = !1),
        (this.state = `play`),
        (this.resumedFrom = e),
        (this.resumedAt = performance.now()),
        this.ui.hideModal(),
        document.activeElement?.blur?.(),
        this.input.pressed.clear(),
        (this.modalDeadT = 0));
    }
    mapPeek = !1;
    openMap() {
      this.state === `play` &&
        this.ui.showMap &&
        ((this.state = `paused`), this.audio.click(), this.ui.showMap(this));
    }
    pause() {
      this.state === `play` && ((this.state = `paused`), this.ui.showPause(this));
    }
    rollChestItem(e, t, n = 1) {
      if (this.state !== `play`) {
        this.whenFree(() => this.rollChestItem(e, t, n));
        return;
      }
      const i = drawItemKeys(this, n, t ?? +!!e);
      const r = i[0];
      if (r) {
        if (i.length > 1) {
          this.state = `modal`;
          this.ui.showItemChoice(this, i, (key) => {
            if (key) {
              this.player.addItem(key);
              this.ui.toast(c(`Obtienes {item}`, { item: k.items[key]?.name ?? key }), key);
            } else {
              this.addGold(Math.min(...i.map(key => PS(this, sn.get(key).rarity))));
              this.econ.sold++;
            }
            this.resume();
          });
          return;
        }
        ((this.state = `modal`),
          this.ui.showItem(this, r, (e) => {
            (e
              ? (this.player.addItem(r),
                this.ui.toast(c(`Obtienes {item}`, { item: k.items[r]?.name ?? r }), r))
              : (this.addGold(PS(this, sn.get(r).rarity)), this.econ.sold++),
              this.resume());
          }));
      } else {
        let e = PS(this, 2);
        (this.addGold(e),
          this.ui.toast(`暂无可选道具，获得 ${e} 金币`, `nugget`));
      }
    }
    openShop() {
      this.state = `modal`;
      let e = this.endless ? 100 + this.endless.shopVisit : this.tower ? 200 + this.tower.floor : this.stage;
      if (!this.shop || this.shop.stage !== e) this.shop = {stage: e, stock: $b(this), rerolls: 0};
      this.ui.showShop(this, () => this.resume());
    }
    rerollCost() {
      let e = 0.5 * ex[0] * jS(this);
      return Math.round(
        e * (this.endless ? 1.6 ** (this.shop?.rerolls ?? 0) : 1.5 ** this.shopRerolls) * rx(this),
      );
    }
    rerollShop() {
      let e = this.rerollCost();
      return !this.shop || this.gold < e
        ? !1
        : ((this.gold -= e),
          (this.econ.shop += e),
          (this.goldSpent += e),
          (this.shop.stock = $b(this)),
          this.shop.rerolls++,
          this.shopRerolls++,
          !0);
    }
    buyShopItem(e) {
      return e.sold || this.gold < e.price || !this.player.canHold(e.key)
        ? !1
        : ((this.gold -= e.price),
          (this.econ.shop += e.price),
          (this.goldSpent += e.price),
          (e.sold = !0),
          this.player.addItem(e.key),
          this.shopBuys.push(sn.get(e.key)?.rarity ?? 0),
          !0);
    }
    openDitto(onCopy) {
      const keys = this.player.copyableItemKeys();
      if (!keys.length) {
        this.ui.toast(this.player.items.has(springShoesKey) ? '弹簧鞋不可复制' : c(`Ditto no tiene nada que copiar...`), null);
        return;
      }
      this.state = 'modal';
      this.ui.showDitto(this, keys, key => {
        if (this.state !== 'modal') return;
        if (keys.includes(key) && this.player.items.has(key) && this.player.addItem(key)) {
          onCopy();
          this.ui.toast(c(`¡Ditto se transforma en {item}!`, {item: Zb(key).name}), key);
        }
        this.resume();
      });
    }
    openFossil(e) {
      ((this.state = `modal`),
        this.ui.showTrade(
          this,
          {
            kind:'fossil',
            title: c(`Ruinas del Fósil`),
            help: c(
              `Revive un fósil: te dará poder, pero te costará PS máximos para el resto de la partida. Solo responde una vez.`,
            ),
            species: 142,
            offers: Lv(this),
          },
          (t) => {
            (this.resume(), t && zv(this, e, t));
          },
        ));
    }
    openSlots(e) {
      ((this.state = `modal`),
        this.ui.showSlots(
          this,
          {
            cost: () => ox(this),
            spins: () => this.slotSpins,
            cursed: () => !cx(this),
            spin: () => {
              let t = sx(this);
              return (t && this.interactables.pullLever(e), t);
            },
            pay: (t) => ux(this, e, t),
          },
          () => this.resume(),
        ));
    }
    openForget() {
      ((this.state = `modal`), this.ui.showForget(this, () => this.resume()));
    }
    offerBlessing(e, t = 0, n = 3, r = 1, i = 1) {
      if (this.state !== `play`) {
        this.whenFree(() => this.offerBlessing(e, t, n, r, i));
        return;
      }
      this.state = `modal`;
      let a = (t, n) =>
        this.ui.showBlessing(
          this,
          e,
          t,
          (e) => {
            (this.tempMods.push(...e.mods),
              this.player.recompute(),
              n > 1
                ? a(
                    t.filter((t) => t !== e),
                    n - 1,
                  )
                : this.resume());
          },
          n > 1 ? c(`Elige {n} bendiciones para esta partida`, { n }) : void 0,
        );
      a(Qb(this, t, n, i), r);
    }
    update(e, dwellSeconds = e, tickSeconds = 0, ticks = 1, lastStepMs = performance.now()) {
      this.walkBudget = gameStick.maxFrameDistance;
      if(this.coop && (this.coop.suspended || this.coop.reconnecting || !this.coop.room.open))return;
      let t = this.input;
      // Start after loading or restoring the room, so the boss intro owns its cinematic state.
      if (this.sanctuary && !this.terrain.bossSite && this.state === 'play' && !this.bossSpawned && !this.stageCleared && !this.coop?.pendingBoss) {
        if (this.coop && !this.coop.isHost) {
          // The host's summon may have arrived while this seat was loading the previous zone.
          this.coop.reassignBoss();
          this.coop.onBossCall(null, this.stage, 0, 0, this.coop.bossAuth);
        } else this.spawnBoss(0, 0);
      }
      ((this.realTime += e),
        (this.realDt = e),
        (this.fpsAcc += e),
        this.fpsN++,
        this.governHorde(e),
        this.fpsAcc > 0.5 &&
          ((this.fps = this.fpsN / this.fpsAcc),
          this.state === `play` && (this.playFps = this.fps),
          (this.fpsAcc = 0),
          (this.fpsN = 0)),
        this.coop?.tick(e),
        t.hit(`KeyM`) &&
          (this.state === `play`
            ? this.openMap()
            : this.state === `paused` && this.ui.mapOpen?.() && this.resume()));
      let n = this.state === `play` && t.down(`Tab`);
      if (
        (n !== this.mapPeek && ((this.mapPeek = n), this.ui.peekMap?.(this, n)),
        this.state === `modal`
          ? ((this.modalDeadT = this.ui.hasModal() ? 0 : this.modalDeadT + e),
            this.modalDeadT > 1.5 &&
              ((this.modalDeadT = 0),
              oc(`modal`, Error(`modal state without a window`)),
              (this.state = `play`)))
          : (this.modalDeadT = 0),
        (this.state === `evolving` || this.state === `cinematic`) && !this.dragonHdPending && !this.anims.some((e) => e.cine))
      ) {
        if (((this.cineDeadT += e), this.cineDeadT > 1.5)) {
          ((this.cineDeadT = 0),
            oc(`cinematic`, Error(`frozen state without an animation`)),
            (this.state = `play`),
            (this.cine.want = 0));
          try {
            this.ui.endCinematic();
          } catch {}
        }
      } else this.cineDeadT = 0;
      (
        (t.hit(`Escape`) || t.hit(`KeyP`)) &&
          (this.state === `play`
            ? this.pause()
            : this.state === `paused` && !this.ui.pauseEsc() && this.resume()),
        this.hitstopT > 0 && (this.hitstopT -= e));
      let r = (tickSeconds || Math.min(e, 1 / 20)) * this.timeScale * (this.hitstopT > 0 ? 0.08 : 1),
        i =
          this.state === `play` ||
          this.state === `dead` ||
          (!!this.coop && (this.state === `modal` || this.state === `paused`)),
        a = this.state === `evolving` || this.state === `cinematic` || this.state === `capturing`;
      a && (r *= 0);
      this.upgradeTiming.update(e,this.ult,this.state === `play`);
      const finishingUltimate=this.upgradeTiming.waiting(this.ult);
      // The short full-ring presentation is part of the upgrade pause. It
      // must not freeze an ultimate mid-cast. Protect the player while its
      // final damage/effects continue, then pause for the remaining ring work.
      let frozenWorld=false;
      if(this.state === `play` && this.pendingLevels > 0){
        if(finishingUltimate&&!this.coop)this.player.iframes=Math.max(this.player.iframes,r+.1);
        if(!this.coop&&this.evoHold<=0&&!finishingUltimate&&this.ui.experienceReady?.() === false){
          r=0;
          frozenWorld=!this.r.needsDraw&&window.hasFrozenUpgrade?.(this);
        }
      }
      let o = this.state === `capturing` ? this.capYaw : this.yawBack;
      if (!this.terrain.zxPaper && !Number.isNaN(o)) {
        let t = Math.atan2(Math.sin(o - this.camYaw), Math.cos(o - this.camYaw));
        ((this.camYaw += t * Math.min(1, e * 3.2)),
          this.state !== `capturing` && Math.abs(t) < 0.01 && (this.yawBack = NaN));
      }
      if (!this.terrain.zxPaper && t.looking && (this.state === `play` || (a && this.state !== `capturing`))) {
        let e = 0.0024 * this.meta.profile.settings.sensitivity;
        (t.mouseDX && (this.yawBack = NaN),
          (this.camYaw -= t.mouseDX * e),
          (this.camPitch += t.mouseDY * e * (this.meta.profile.settings.invertY ? -1 : 1)),
          (this.camPitch = Gs(this.camPitch, -0.25, 1.25)),
          t.wheel &&
            ((this.camDist = Gs(this.camDist + t.wheel * 1, CE, 26)),
            (this.meta.profile.settings.camDist = Math.round(this.camDist * 10) / 10)));
      }
      let s = this.cine;
      ((s.blend =
        s.want > s.blend ? Math.min(s.want, s.blend + e / 0.6) : Math.max(s.want, s.blend - e * 1.4)),
        (this.camYaw += this.terrain.zxPaper ? 0 : e * s.orbit * s.blend),
        this.evoHold > 0 && this.state === `play` && (this.evoHold -= e));
      let c = this.ultFx;
      c.t > 0 && (i || a) && (c.t -= e);
      let l = c.t > 0 ? Math.min(1, c.k + e / 0.15) : Math.max(0, c.k - e / 0.5);
      if(l!==c.k){c.k=l;this.pushLook();}
      if(a)this.stepAnims(e,true);
      if(this.state==='capturing'){this.orbitals.begin();this.orbitalsGlow.begin();this.capBall?.update(e);}
      if(i && r>0){
        this.realDt=tickSeconds || e;
        // 补跑旧步时按该步时刻取样，当前步可以使用本帧已送达的转向。
        const firstStepMs=lastStepMs - (ticks - 1) * tickSeconds * 1000;
        this.simulate(r,dwellSeconds/ticks,firstStepMs,ticks===1 ? performance.now() : firstStepMs);
        if(ticks===2 && this.state==='play' && !this.buildingStage && !this.pendingLevels && this.hitstopT<=0){
          this.input.endFrame();
          this.simulate(r,dwellSeconds/2,lastStepMs,performance.now());
          r*=2;
        }
        this.realDt=e;
      }
      if (
        (!frozenWorld&&(this.updateCamera(this.drawDt ?? e),applyReadyShake(this)),
        this.state === `capturing` && this.clearCaptureView(),
        !frozenWorld&&this.renderWorld(i ? r : 0),
        !frozenWorld&&this.vfx.update(i ? r : a ? e : 0),
        window.castHidesUI?.(this)&&(this.vfx.text.mesh.visible=false),
        this.ui.hud(this),
        this.state === `play` && this.pendingLevels > 0 && this.evoHold <= 0 && !this.ult.castPending)
      )
        this.doLevelUp();
      else if (
        this.state === `play` &&
        this.pendingBlessings.length &&
        this.evoHold <= 0 &&
        !this.ult.castPending
      ) {
        let e = this.pendingBlessings.shift();
        this.offerBlessing(e.title, e.min);
      }
    }
    stepPlayer(player, dt) {
      const view = player.motionView, pos = player.pos;
      // 从碰撞解算后的实坐标取样。传送、换区或复活时清除旧插值段。
      view.reset(pos.x, pos.y, pos.z);
      player.update(dt);
      if (Math.hypot(pos.x-view.cx, pos.z-view.cz) > gameStick.snapThreshold) {
        view.reset(pos.x, pos.y, pos.z);
      } else {
        view.capture(pos);
      }
    }
    visiblePlayerPosition() {
      const {pos, motionView: view} = this.player;
      if (this.state !== 'play' || this.renderAlpha == null || !view.ready ||
          pos.x !== view.cx || pos.y !== view.cy || pos.z !== view.cz) return pos;
      return view.sample(this.renderAlpha);
    }
    setHordeQuality(e) {
      const budget=crowdBudgets[e]||crowdBudgets.high,previous=this.liveMax;
      this.liveMax=ordinaryCeiling(this.mode,budget.max);this.liveMin=budget.min;
      this.liveCap=this.performance?.lockVisualQuality||this.liveCap>=previous?this.liveMax:Math.max(this.liveMin,Math.min(this.liveCap,this.liveMax));
    }
    governHorde() {
      updateCrowdBudget(this,performance.now(),document.hidden);
    }
    simulate(e, dwellSeconds = e, stepMs = performance.now(), sampleMs = stepMs) {
      if (this.stageTime >= bossSummonUnlockSeconds(this) - 60 && !this.bossSpawned &&
          !this.dragonHdAssets && this.stageBossSpecies === finalBossSpecies) warmDragonSummon(this);
      let t = this.input,
        n = this.player,
        r = !!this.coop && n.dead;
      // 触摸摇杆：每个逻辑 tick 取样一次（用真实 tick 时长，慢动作不拖慢手感）。
      this.inputTick = (this.inputTick || 0) + 1;
      this.ui.touch?.driveStick(t, this.realDt || e, stepMs, sampleMs);
      (Fl.leave(),
        (this.time += e),
        (this.stageTime += e),
        this.time >= this.nextCp && ((this.nextCp += kn.heartbeat), this.checkpoint()),
        t.mouseClicked[2] && this.toggleLock(),
        this.lockTarget >= 0 && !this.enemies.isAlive(this.lockTarget) && (this.lockTarget = -1),
        t.hit(`KeyT`) &&
          ((this.autoRun = !this.autoRun),
          this.ui.toast(
            this.autoRun ? c(`Avance automático activado`) : c(`Avance automático desactivado`),
            null,
          )));
      (t.hit(`KeyQ`) &&
        ((this.aimMode = this.aimMode === `auto` ? `manual` : `auto`),
        this.ui.toast(
          this.aimMode === `auto` ? c(`Apuntado automático`) : c(`Apuntado manual (con la cámara)`),
          null,
        )),
        this.state === `play` && this.allies.state === `down` && t.hit(`KeyG`)
          ? this.allies.dismiss()
          : this.state === `play` && this.coop && t.hit(`KeyG`) && this.coop.mark());
      let i = this.interactables.nearest,
        a = this.coop?.lifting;
      (this.state !== `play` || r
          ? this.ui.setPrompt(null)
          : a
            ? this.ui.setPrompt(null)
            : this.capture.throwing
              ? this.ui.setPrompt(null)
              : this.capture.canThrow()
                ? (this.ui.setPrompt(c(`[E] Lanzar Poké Ball`)), t.hit(`KeyE`) && this.capture.throwBall())
                : this.allies.canThrow() && !i
                  ? (this.ui.setPrompt(
                      c(`[E] Amigo Ball: luchará contigo esta partida ({s} s) · Apoyo: {label}`, {
                        s: Math.ceil(this.allies.downT),
                        label: this.allies.downSupport(),
                      }),
                    ),
                    t.hit(`KeyE`) && this.allies.throwBall())
                  : this.ui.setPrompt(null),
        this.hints.tick(this, e));
      for (let t = this.timers.length - 1; t >= 0; t--) {
        let n = this.timers[t];
        ((n.t -= e), n.t <= 0 && (this.timers.splice(t, 1), n.fn()));
      }
      if (
        (this.stepAnims(e),
        this.streakT > 0 &&
          ((this.streakT -= e), this.streakT <= 0 && ((this.streak = 0), n.refreshScaling())),
        this.weatherT > 0 &&
          ((this.weatherT -= e),
          this.weatherT <= 0 && ((this.weather = this.baseWeather), this.applyWeatherLook())),
        this.weatherFx(e),
        this.zoneMotes(e),
        this.stepPlayer(n, e),
        this.state === `dead`)
      ) {
        this.enemies.update(e);
        return;
      }
      if ((this.orbitals.begin(), this.orbitalsGlow.begin(), Fl.enter(this.hideOwnFx), r)) Fl.leave();
      else {
        try {
          n.moves.forEach((t, n) => {
            t && this.castMove(n, t, e);
          });
        } finally {
          Fl.leave();
        }
        this.ult.update(e);
      }
      this.dpsLog.tick(this);
      let s = this.mewtwo.active,
        l = this.tower;
      (!this.sanctuary &&
        !s &&
        !l &&
        !(globalThis.__pbCoop && __pbCoop.skipSpawns && __pbCoop.skipSpawns()) &&
        this.director.update(e),
        this.endless?.update(e),
        l?.update(e),
        (this.musicT -= e) <= 0 && ((this.musicT = 0.5), this.audio.playTrack(this.musicFor())),
        globalThis.__pbCoop && __pbCoop.tick && __pbCoop.tick(this, e),
        globalThis.__pbCoop && __pbCoop.tickShots && __pbCoop.tickShots(this, e),
        this.enemies.update(e),
        updateLooseMarbles(this,e),
        this.coop?.afterEnemies(),
        this.boss.tick(e),
        this.combat.meter.tick(e),
        s || this.minibosses.update(e),
        !this.sanctuary && !s && !l && this.events.update(e),
        this.projectiles.update(e),
        Fl.enter(this.hideOwnFx));
      try {
        this.zones.update(e);
      } finally {
        Fl.leave();
      }
      if (this.director.normalOpening && !this.openingXpChecked && this.stageTime >= 135 && !n.dead) {
        this.openingXpChecked = true;
        if (n.level < 6) this.pickups.attractNearbyXp(40);
      }
      (this.pickups.update(e),
        ff(this, e),
        vf(this, e),
        !this.endless && !l && this.capture.beamFx(),
        !this.dragonDuel && !this.sanctuary && !s && !this.endless && !l && this.capture.update(e),
        !l && !this.coop && this.mewtwo.update(e),
        s || this.allies.update(e),
        this.sanctuary?.update(e),
        this.tide.update(e),
        this.mapEvents.update(e),
        this.interactables.update(e, dwellSeconds),
        this.terrain.update(this.coop?.spec ? this.camTarget : n.pos));
      let u = this.enemies;
      for (let e = 0; e < u.n; e++) {
        if (!u.alive[e] || u.dying[e] > 0) continue;
        let t = u.x[e] - n.pos.x,
          r = u.z[e] - n.pos.z;
        if (
          t * t + r * r > 5625 &&
          !(
            u.flags[e] &
            (R.Boss | R.Capture | R.Alpha | R.Totem | R.Summoner | R.Treasure | R.Object | R.Remote)
          )
        ) {
          if (this.coop?.monsters && roomMonster(u.flags[e])) continue;
          if (u.flags[e] & R.Stampede) {
            u.kill(e);
            continue;
          }
          let t = Math.random() * Math.PI * 2,
            r = n.pos.x + Math.cos(t) * 32,
            i = n.pos.z + Math.sin(t) * 32;
          this.terrain.inBounds(r, i, 5) && (!this.terrain.placeSpawn || this.terrain.placeSpawn(r,i,u.radius[e])) &&
            ((u.x[e] = r), (u.z[e] = i), (u.y[e] = this.terrain.height(r, i)));
        }
      }
      // A slow start may earn a player level. Its draft uses the same random pool.
      if (this.stage === 1 && !this.endless && !l && !n.dead && this.state === 'play' &&
          ((n.level === 1 && this.stageTime >= 18) || (n.level === 2 && this.stageTime >= 45))) n.gainLevel();
      (!this.sanctuary && !this.endless && !l && !this.stageCleared && this.stageTime >= zoneDuration(this.mode) && this.director.startFinalSwarm(),
        (this.audio.intensity = Js(
          this.audio.intensity,
          this.boss.alive || this.director.finalSwarm || this.endless?.night
            ? 1
            : Math.min(0.6, u.count / 600),
          1,
          e,
        )));
    }
    castMove(e, t, n) {
      let r = this.coop;
      if (!r) {
        Q_(this, e, t, n);
        return;
      }
      let i = t.timer,
        a = t.active;
      Q_(this, e, t, n);
      if (!t.waitingForTarget && (t.timer > i || t.active > a)) {
        let e = t.def.arch,
          n = t.def.area * this.player.stats.area,
          i =
            e === `orbit` || e === `aura` || e === `trail`
              ? `aura`
              : e === `strike` || e === `spin` || e === `cone`
                ? `slash`
                : e === `nova` ||
                    e === `wave` ||
                    e === `smite` ||
                    e === `meteor` ||
                    e === `weather` ||
                    e === `buff`
                  ? `ring`
                  : `shot`;
        r.cast(i, t.def.type, n, t.def.name);
      }
    }
    weatherFx(e) {
      let t = this.weather;
      if (t === `clear` || t === `sun` || this.mewtwo.active) return;
      // Rain has no ambient particles. Keep the weather's combat effects below.
      let n = this.r.camera.position,
        r = t === `rain` ? 0 : Math.floor((t === `fog` ? 6 : 50) * e * 10);
      for (let e = 0; e < r; e++) {
        let e = n.x + F.range(-25, 25),
          r = n.z + F.range(-25, 25),
          i = n.y + F.range(4, 14);
        t === `sand`
          ? this.vfx.norm.spawn({
              x: e,
              y: i - 6,
              z: r,
              vx: 14,
              vy: -1,
              vz: 4,
              life: 1.4,
              size: 0.5,
              endSize: 0.9,
              color: 14203008,
              shape: I.Soft,
            })
          : t === `hail`
            ? this.vfx.norm.spawn({
                x: e,
                y: i,
                z: r,
                vx: 1,
                vy: -14,
                vz: 0,
                life: 1,
                size: 0.3,
                endSize: 0.3,
                color: 16777215,
                shape: I.Flake,
                spin: 4,
              })
            : t === `ash`
              ? this.vfx.add.spawn({
                  x: e,
                  y: i,
                  z: r,
                  vx: F.range(-1, 1),
                  vy: -2,
                  vz: F.range(-1, 1),
                  life: 3,
                  size: 0.18,
                  endSize: 0.1,
                  color: 16747066,
                  shape: I.Soft,
                  glow: 0.5,
                })
              : t === `fog` &&
                this.vfx.norm.spawn({
                  x: e,
                  y: i - 10,
                  z: r,
                  vx: 0.5,
                  vy: 0,
                  vz: 0.3,
                  life: 4,
                  size: 6,
                  endSize: 9,
                  color: 11575496,
                  shape: I.Soft,
                });
      }
      if (Math.random() < e * 2) {
        let e = this.enemies;
        for (let n of e.within(this.player.pos.x, this.player.pos.z, 25))
          (t === `rain` &&
            ((e.wet[n] = Math.max(e.wet[n], 2)), this.weatherT > 0 && this.combat.countOnce(n, 64, `soaked`)),
            t === `sand` &&
              !e.typesOf(n).some((e) => e === `rock` || e === `ground` || e === `steel`) &&
              this.combat.hit(n, 2 + this.stage * 2, {
                type: `rock`,
                cls: `special`,
                fixed: !0,
                silent: !0,
                noReact: !0,
              }),
            t === `hail` &&
              !e.typesOf(n).includes(`ice`) &&
              Math.random() < 0.2 &&
              this.combat.applyStatus(n, `freeze`, 1));
      }
    }
    zoneMotes(e) {
      let t = this.zone.motes,
        n = this.weather;
      if(!this.performance.ambient)return;
      if (!t || this.mewtwo.active || n === `rain` || n === `sand`) return;
      let r =
          t === `fireflies`
            ? 7
            : t === `embers`
              ? 6
              : t === `leaves` || t === `heat`
                ? 5
                : t === `snow`
                  ? 14
                  : 6,
        i = this.player.pos;
      for (let n = Math.floor(r * e) + +!!F.chance((r * e) % 1); n > 0; n--) {
        let e = F.range(0, Math.PI * 2),
          n = F.range(3, 22),
          r = i.x + Math.cos(e) * n,
          a = i.z + Math.sin(e) * n,
          o = this.terrain.height(r, a);
        t === `fireflies`
          ? this.vfx.add.spawn({
              x: r,
              y: o + F.range(0.4, 2.6),
              z: a,
              vx: F.range(-0.6, 0.6),
              vy: F.range(-0.15, 0.3),
              vz: F.range(-0.6, 0.6),
              life: F.range(2.5, 4.5),
              size: 0.16,
              endSize: 0.1,
              color: F.chance(0.7) ? 14221162 : 16773258,
              shape: I.Soft,
              glow: 1,
            })
          : t === `embers`
            ? this.vfx.add.spawn({
                x: r,
                y: o + F.range(0.2, 1.5),
                z: a,
                vx: F.range(-0.4, 0.4) + 0.5,
                vy: F.range(0.5, 1.2),
                vz: F.range(-0.4, 0.4),
                life: F.range(2, 3.5),
                size: 0.12,
                endSize: 0.05,
                color: F.chance(0.6) ? 16752704 : 16738874,
                shape: I.Soft,
                glow: 0.8,
              })
            : t === `leaves`
              ? this.vfx.norm.spawn({
                  x: r,
                  y: o + F.range(5, 9),
                  z: a,
                  vx: F.range(0.6, 1.4),
                  vy: F.range(-1.3, -0.8),
                  vz: F.range(-0.5, 0.5),
                  life: F.range(4, 6),
                  size: 0.32,
                  endSize: 0.3,
                  color: F.pick([15247418, 14185518, 15779920, 12107840]),
                  shape: I.Leaf,
                  spin: F.range(-3, 3),
                  rot: F.range(0, 6.3),
                })
              : t === `snow`
                ? this.vfx.norm.spawn({
                    x: r,
                    y: o + F.range(4, 9),
                    z: a,
                    vx: F.range(-0.5, 0.5) + 0.4,
                    vy: F.range(-1.4, -0.8),
                    vz: F.range(-0.5, 0.5),
                    life: F.range(5, 7),
                    size: F.range(0.18, 0.32),
                    endSize: 0.2,
                    color: 16777215,
                    shape: I.PixSnow,
                    spin: F.range(-2, 2),
                  })
                : t === `spray`
                  ? this.vfx.add.spawn({
                      x: r,
                      y: o + F.range(0.3, 2.5),
                      z: a,
                      vx: F.range(0.8, 1.8),
                      vy: F.range(0, 0.4),
                      vz: F.range(-0.4, 0.4),
                      life: F.range(2, 3.5),
                      size: 0.14,
                      endSize: 0.05,
                      color: F.chance(0.6) ? 16777215 : 16769200,
                      shape: I.Soft,
                      glow: 0.6,
                    })
                  : t === `heat`
                    ? this.vfx.norm.spawn({
                        x: r,
                        y: o + F.range(0.2, 1.4),
                        z: a,
                        vx: F.range(1.5, 3),
                        vy: F.range(0, 0.3),
                        vz: F.range(-0.6, 0.6),
                        life: F.range(2.5, 4),
                        size: 0.35,
                        endSize: 0.9,
                        color: 15254668,
                        shape: I.Soft,
                      })
                    : this.vfx.add.spawn({
                        x: r,
                        y: o + F.range(0.5, 3),
                        z: a,
                        vx: F.range(-0.3, 0.3),
                        vy: F.range(0.05, 0.3),
                        vz: F.range(-0.3, 0.3),
                        life: F.range(3, 5),
                        size: 0.1,
                        endSize: 0.06,
                        color: 16773280,
                        shape: I.Soft,
                        glow: 0.5,
                      });
      }
    }
    shakeOff = new ti();
    updateCamera(e) {
      this.vfx?.upgrade.camera.restore();
      if(this.terrain?.zxPaper){updatePaperCamera(this,e,this.visiblePlayerPosition());this.vfx?.upgrade.camera.apply();Il.yaw=0;return;}
      let t = this.coop?.camFocus() ?? null,
        n = this.r.camera,
        r = t ?? this.visiblePlayerPosition();
      (Number.isFinite(this.camTarget.x + this.camTarget.y + this.camTarget.z) ||
        this.camTarget.copy(Number.isFinite(r.x + r.y + r.z) ? r : this.terrain.spawn),
        Number.isFinite(this.camYaw) || (this.camYaw = 0),
        Number.isFinite(this.camPitch) || (this.camPitch = 0.45),
        Number.isFinite(this.camLift) || (this.camLift = 0),
        Number.isFinite(this.trauma) || (this.trauma = 0),
        Number.isFinite(this.camDist) || (this.camDist = 9),
        (Il.yaw = this.camYaw),
        (this.camTarget.x = Js(this.camTarget.x, r.x, t ? 7 : 18, e)),
        (this.camTarget.z = Js(this.camTarget.z, r.z, t ? 7 : 18, e)),
        (this.camTarget.y = Js(this.camTarget.y, r.y, t ? 5 : 10, e)));
      let i = this.cine,
        a = i.blend * i.blend * (3 - 2 * i.blend),
        o = this.camTarget.x,
        s = this.camTarget.y + 0.9,
        c = this.camTarget.z;
      if (i.follow >= 0 && this.enemies.alive[i.follow]) {
        let e = this.enemies;
        ((o = e.x[i.follow]),
          (s = e.y[i.follow] + e.hgt[i.follow] * 0.55),
          (c = e.z[i.follow]),
          (i.x = o),
          (i.y = s),
          (i.z = c));
      } else i.follow !== -2 && ((o = i.x), (s = i.y), (c = i.z));
      let l = this.camTarget.x + (o - this.camTarget.x) * a,
        u = this.camTarget.z + (c - this.camTarget.z) * a,
        d = this.camTarget.y + 1.5 + (s + 0.7 - this.camTarget.y - 1.5) * a,
        f = this.tower ? Math.min(this.camDist, 14) : this.camDist,
        p = this.camPitch + (i.pitch - this.camPitch) * a,
        m = f + (i.dist - f) * a + this.ultFx.k * 2.6,
        h = Math.cos(p),
        g = Math.sin(p),
        _ = m,
        v = this.terrain.arenaR + (this.tower ? -0.6 : 2);
      if (v < 1 / 0 && _ > 2.5) {
        let e = Math.sin(this.camYaw) * h,
          t = Math.cos(this.camYaw) * h,
          n = e * e + t * t,
          r = l * e + u * t,
          i = l * l + u * u - v * v,
          a = r * r - n * i;
        n > 1e-6 && (_ = a >= 0 ? Math.max(2.5, Math.min(_, (-r + Math.sqrt(a)) / n)) : 2.5);
      }
      let y = l + Math.sin(this.camYaw) * h * _,
        b = d + g * _ + 0.6,
        x = u + Math.cos(this.camYaw) * h * _,
        S = b;
      for (let e = 1; e <= 4; e++) {
        let t = e / 4,
          n = l + (y - l) * t,
          r = u + (x - u) * t,
          i = d + (b - d) * t,
          a = this.terrain.height(n, r) + 0.8;
        i < a && (b += a - i);
      }
      let C = b - S;
      ((this.camLift = Js(this.camLift, C, C > this.camLift ? 22 : 5, e)),
        Math.abs(this.camLift - C) < 0.002 && (this.camLift = C),
        (b = S + Math.max(this.camLift, 0)),
        (this.trauma = Math.max(0, this.trauma - e * 2)));
      let w = this.trauma * this.trauma * 0.3,
        T = this.realTime * 26;
      (this.shakeOff.set(Math.sin(T * 1.1) * w, Math.sin(T * 1.7 + 1) * w * 0.8, Math.sin(T * 1.3 + 2) * w),
        n.position.set(y, b, x).add(this.shakeOff),
        n.lookAt(l, d + 0.3 + (s - d - 0.3) * a, u));
      let E = Gs((this.player.speedNow - 8) * 0.8, 0, 10),
        ee = this.meta.profile.settings.fov + E - (this.capBall ? 18 * a : 0);
      Math.abs(n.fov - ee) > 0.05 && ((n.fov = Js(n.fov, ee, 6, e)), n.updateProjectionMatrix());
      this.vfx?.upgrade.camera.apply();
    }
    renderWorld(e) {
      let t = this.r.camera;
      const showCombatFx = this.state !== 'evolving';
      this.vfx.combatLayer.visible = showCombatFx;
      this.mapEvents.renderWeather();
      this.sprites.setShelfDepth(this.terrain.shelfDepth);
      if(this.terrain.desk2d)updateDeskPropFade(this);
      this.sprites.begin(t);
      updateWorkshopScene(this,e,this.sprites);
      (updatePaperVisibility(this.terrain,this.sprites.frustum,this.terrain.workshopBoundary?true:this.performance.worldShadows),
        this.enemies.render(),
        this.boss.kit && !this.boss.kit.dead && this.boss.kit.render(),
        this.boss.mech?.render(),
        this.player.render(this.visiblePlayerPosition()),
        this.coop?.render(),
        this.mewtwo.active || this.allies.render(),
        showCombatFx && this.ult.render());
      let n = this.sprites.get(this.player.speciesId);
      for (let t = this.ghosts.length - 1; showCombatFx && t >= 0; t--) {
        let r = this.ghosts[t];
        if(r.windGlyph||r.dashGlyph){
          const age=this.time-r.start;
          if(age>=r.life||!this.vfx.crafted.allowed()){this.ghosts.splice(t,1);continue;}
          const glyph=this.sprites.getHeroGhostGlyph(r.species,'wind');
          glyph?.push(r.x,r.y,r.z,'walk',.1,r.dir,r.scale*glyph.zxGhostScale*VFX_SCALE,0,
            .36*(1-age/r.life)*this.vfx.opacity*this.vfx.ownOpacity,0,0,1,1,1,0,false);
          continue;
        }
        if(r.fireGlyph){
          r.t-=e;
          if(r.t<=0||!this.vfx.crafted.allowed()){this.ghosts.splice(t,1);continue;}
          const glyph=this.sprites.getHeroGhostGlyph(r.species);
          glyph?.push(r.x,r.y,r.z,'walk',.1,r.dir,r.scale*glyph.zxGhostScale*VFX_SCALE,.25,
            Math.min(.46,r.t/.5*.46)*this.vfx.opacity*this.vfx.ownOpacity,0,0,1,.65,.35,0,false);
          continue;
        }
        ((r.t -= e),
          r.t <= 0
            ? this.ghosts.splice(t, 1)
            : n.push(r.x, r.y, r.z, `walk`, 0.1, r.dir, VFX_SCALE, 0.8, 1 - r.t / 0.5, 0, 0, 1, 1, 1, 0, !1));
      }
      (this.interactables.render(e),
        this.pickups.render(this.time),
        this.sprites.end(),
        showCombatFx && this.projectiles.render(),
        this.state !== `play` &&
          this.state !== `capturing` &&
          (this.orbitals.begin(), this.orbitalsGlow.begin()),
        this.orbitals.end(),
        this.orbitalsGlow.end());
    }
    dispose() {
      this.disposed=true;
      clearDragonSummon(this);
      this.r.setCombatLoad(0);
      (this.coop?.dispose(),
        this.hints.dispose(),
        this.mapEvents.dispose(),
        this.audio.stopMusic(),
        this.audio.endRun(),
        this.r.setAtmos(1, 1, 1, 0, 0.4),
        this.r.setSun(),
        (this.r.shared.uWind.value = 1),
        this.capture?.dispose(),
        this.allies?.dispose(),
        this.terrain?.dispose(),
        this.interactables?.dispose(),
        this.sanctuary?.dispose(),
        this.tower?.dispose(),
        this.boss?.mech?.dispose(),
        this.sprites.clear());
      this.sprites.standIn.dispose();
      this.vfx.crafted.dispose();
      this.projectiles?.enemyArt.dispose();
      this.vfx.upgrade.dispose();
      this.vfx.danger.dispose();
      this.vfx.combatLayer.removeFromParent();
      this.vfx.atlas.dispose();
      disposePaperAssets(this.paperAssets);
      for (let e of [
        this.playerFootRing,
        this.vfx.add.mesh,
        this.vfx.norm.mesh,
        this.vfx.rings.mesh,
        this.vfx.ground.mesh,
        this.vfx.groundN.mesh,
        this.vfx.beams.mesh,
        this.vfx.text.mesh,
        this.orbitals.mesh,
        this.orbitalsGlow.mesh,
        this.projectiles?.pool.mesh,
        this.projectiles?.glow.mesh,
        this.pickups?.pool.mesh,
        this.pickups?.glow.mesh,
        this.sprites.shadows.mesh,
      ])
        if(e)(e.parent?.remove(e), e.dispose?.(), e.geometry.dispose(), e.material.dispose());
    }
  };

export {
  wE as BattleRun
};
