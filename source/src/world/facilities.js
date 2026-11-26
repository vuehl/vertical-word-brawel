import {ex, jS, ox, hS, fusionRequiredLevel, yS, xS} from "../combat/upgrade-offers.js";
import {deskDevice, deskTexture, disposeDeskDevice} from "./desk2d.js";
import {createBerryPickup, createPickupContact} from "../combat/berry-pickup.js";
import {deskPitch, deskTilt, deskPlayFrame} from "./desk-framing.js";
import {altarPalette} from "./desk-altar-art.js";
import {
  altarChargeSeconds,
  bossSummonSeconds,
  bossSummonUnlockSeconds,
  facilityDwellSeconds,
  staplerDwellSeconds,
  staplerInteractionRadius,
  facilityIconFile,
  isContactFacility,
  facilityNames,
  isActiveFacility
} from "../data/active-content.js";
import {createIllustratedClock} from "../effects/facility-clock.js";
import {createFacilityOutlineMask} from "../effects/facility-outline-mask.js";
import {remainingZoneSeconds} from "../data/lite-rules.js";
import {enemySpeciesWord} from "../data/character-rules.js";
import {createFacilityDwellRing, createDeskAltarRing} from "../effects/player-foot-ring.js";
import {shadeDeskDevice} from "./desk-shelf.js";
import {runLoadingSteps} from "../performance/loading-work.js";
import {paperBox, hitsPaperBox} from "./paper-collision.js";
import {chineseText as c} from "../data/chinese-text.js";
import {I as Cr, K as Tr, ct as Kr, et as Yr, w as Ei} from "../vendor/three-DmSYIDKK.js";
import {gameData as k} from "../data/game-database.js";
import {Ys} from "../effects/scene-renderer.js";
import {Random as Ol, random as F, I} from "../effects/battle-particles.js";
import {mf, gf, R} from "../combat/enemy-population.js";
import {Bv, Hv, fb} from "../combat/enemies.js";
import {rollAltarTier} from "./altar-reward.js";

var TS = [92, 92, 93, 93, 94];
function DS(e) {
  let t = 35 * e;
  return (
    e > 10 && (t += 300 * (e - 10)),
    e > 20 && (t += 550 * (e - 20)),
    e > 30 && (t += 1200 * (e - 30)),
    e > 40 && (t += 2400 * (e - 30)),
    e > 50 && (t += 4500 * (e - 30)),
    (1.22 ** e + t / 30) * 1.12 ** Math.max(0, e - 12)
  );
}
function OS(e) {
  return GS.CHEST_BASE * DS(e.chestsBought) * (e.endless?.curse.chest ?? 1);
}
var MS = [0.3, 0.45, 0.65, 1, 1.5],
  NS = 0.5;
function PS(e, t) {
  let n = NS * ex[t] * jS(e);
  return Math.round(Math.max([10, 18, 30, 50, 90][t] * e.stage, Math.min(n, MS[t] * OS(e))));
}
var RS = [
  {r: 6, drain: 6, min: 0, offers: 3, picks: 1},
  {r: 5.5, drain: 5, min: 1, offers: 3, picks: 1},
  {r: 5, drain: 4, min: 2, offers: 3, picks: 1},
  {r: 4.5, drain: 3, min: 3, offers: 4, picks: 2},
];
var BS = (e) => e.kind === `chest` && e.data?.gift ? `freechest` : e.kind,
  VS = { altar: 200, challenge: 240, ditto: 60, magnet: 150, berry: 60 };
const pickupIdleSeconds = 120;
const pickupCooldownSeconds = 60;
const isDie = kind => kind === 'chest' || kind === 'freechest';

var GS = class e {
    run;
    list = [];
    group = new Cr();
    nearest = null;
    dwellTime = 0;
    waitingForGold = false;
    warnedPortal = null;
    get dwellDuration() {
      if (this.nearest?.kind === 'bill') return staplerDwellSeconds;
      return this.nearest?.kind === 'boss' ? bossSummonSeconds : facilityDwellSeconds;
    }
    get dwellProgress() {
      const duration = this.dwellDuration;
      return this.nearest && this.dwellTime > 0 && this.dwellTime < duration
        ? this.dwellTime / duration : -1;
    }
    updateDwell(target, seconds, gameSeconds) {
      const run = this.run;
      if (target !== this.nearest) {
        this.nearest = target;
        this.contactHandled=false;
        this.dwellTime = 0;
        this.waitingForGold = false;
        this.warnedPortal = null;
        if (target?.kind === 'ditto') run.ui.prepareDittoPictures(run.player.copyableItemKeys());
      }
      if (!target || run.state !== 'play' || run.player.dead) return;
      if (target.kind === 'boss') {
        const unlockedFor = run.stageTime - bossSummonUnlockSeconds(run);
        if (unlockedFor < 0) {
          this.dwellTime = 0;
          return;
        }
        // Only the unlocked part of a crossing frame contributes to the three-second hold.
        if (gameSeconds > 0 && unlockedFor < gameSeconds) seconds *= unlockedFor / gameSeconds;
      }
      if (run.gold < this.interactionCost(target)) {
        if (!this.waitingForGold && target.kind === 'chest') run.ui.toast('金币不够');
        this.waitingForGold = true;
        this.dwellTime = 0;
        return;
      }
      this.waitingForGold = false;
      const duration = this.dwellDuration;
      if (this.dwellTime > 0 && this.dwellTime >= duration) return;
      if (target.kind === 'bill' && (!run.player.grounded || run.player.speedNow >= 0.6)) {
        this.dwellTime = 0;
        return;
      }
      if (run.coop?.lifting || run.capture.throwing || run.capture.canThrow()) {
        this.dwellTime = 0;
        return;
      }
      if(target.contactTest){
        if(this.contactHandled)return;
        this.contactHandled=true;
        this.interact(target);
        return;
      }
      this.dwellTime += seconds;
      // Frame deltas can add up a fraction below the exact duration.
      if (this.dwellTime + 1e-9 >= duration) {
        // Latch instant interactions until the player leaves the range.
        this.dwellTime = Math.max(duration, Number.EPSILON);
        this.interact(target);
      }
    }
    constructor(run, deferred = false) {
      this.run = run;
      run.r.scene.add(this.group);
      this.deviceArt = {deskTextures:new Map(),deskOwned:[],shared:run.r.shared};
      const three = {PlaneGeometry: Yr, ShaderMaterial: Kr, Mesh: Tr};
      this.dwellRing = createFacilityDwellRing(this.group, three);
      // Pens, keyboards and other low props are walkable but still have visible models.
      this.lowProps = (run.terrain.zxProps ?? []).filter(p => p.walkable)
        .map(p => paperBox(p.x, p.z, p.w, p.d, p.h, p.angle));
      if (!deferred) this.populate();
    }
    disposed = !1;
    static CHEST_BASE = 18;
    recentPickupSites = [];
    get rotatingPickups() {
      const run = this.run;
      return run.terrain.desk2d && !run.endless && !run.tower && (run.stage === 1 || run.stage === 2);
    }
    get dicePerKind() {
      return this.run.stage === 1 && this.rotatingPickups ? 2 : 1;
    }
    chestCost() {
      let t = 1 - Math.min(0.4, 0.08 * (this.run.player.items.get(`big-nugget`) ?? 0)),
        n = this.run.endless?.curse.chest ?? 1;
      return Math.round(
        e.CHEST_BASE *
          DS(this.run.chestsBought) *
          (1 - Math.min(0.25, Math.max(0, this.run.player.stats.luck) / 400)) *
          t *
          n,
      );
    }
    interactionCost(facility) {
      if (facility.kind === 'chest' && !facility.data?.gift) return this.chestCost();
      return facility.kind === 'slots' ? ox(this.run) : 0;
    }
    hasVisual(facility) {
      return !this.disposed && this.group.visible && !!this.group.parent &&
        facility.group?.parent === this.group && facility.group.visible &&
        !!facility.model?.visible && facility.model.parent === facility.group;
    }
    async loadDevice(facility) {
      const group = facility.group;
      if (this.disposed || group.parent !== this.group) return;
      const kind=BS(facility);
      const flat=this.run.terrain.desk2d;
      const model=await deskDevice(this.deviceArt,kind,facility.data?.tier);
      if (this.disposed || group.parent !== this.group) {
        disposeDeskDevice(model);
        return;
      }
      if (!model) {
        facility.retry = setTimeout(() => this.loadDevice(facility), 10000);
        return;
      }
      const scale = facility.kind === 'boss' ? (this.run.terrain.bossSite?.scale ?? 1) : facility.kind === 'berry' ? 0.5 : 1;
      model.scale.multiplyScalar(scale);
      group.add(model);
      group.userData.h = model.userData.displayHeight * scale;
      facility.ringRadius = Math.max(facility.r, model.userData.footprintRadius * scale + 0.7);
      let ring;
      if (facility.kind === 'altar') {
        const tier = facility.data.tier, three = {PlaneGeometry: Yr, ShaderMaterial: Kr, Mesh: Tr};
        const palette = altarPalette[tier];
        ring = facility.chargeRing = createDeskAltarRing(group,three,new Ei(palette.ring),new Ei(palette.dark),model.userData.breathOpacity);
      } else if(isContactFacility(kind)){
        facility.contactTest=createPickupContact(model.children[0],this.run.r);
      } else if(facility.kind==='berry'){
        facility.berryPickup=createBerryPickup(model,this.run.r);
      }
      if(ring){
        ring.position.set(0, .12, 0);
        ring.scale.setScalar(facility.ringRadius);
      }
      facility.model = model;
      this.outlineMask??=createFacilityOutlineMask(this.run.r);
      this.outlineMask.add(model);
      group.rotation.y=0;
      if(kind==='boss'){
        facility.dock=createIllustratedClock(model.children[0],this.run.r.renderer);
        if(facility.used||this.run.bossSpawned)facility.dock.open();
        await facility.dock.ready;
        if (this.disposed || group.parent !== this.group) return;
      }
      if(flat){
        const foot=facility.berryPickup?(facility.berryShadowFoot=group.position.clone()):group.position;
        shadeDeskDevice(model,foot,this.run.sprites.shelfUniforms);
      }
      if(facility.kind==='magnet')model.userData.updateMagnet(this.run.time);
      if (facility.used){
        if(facility.berryPickup)model.visible=false;
        else if(facility.kind==='magnet')model.userData.setMagnetUsed(true,this.run.time,true);
        else this.dim(facility);
      }
    }
    releaseDevice(facility) {
      clearTimeout(facility.retry);
      facility.berryPickup=null;
      facility.contactTest=null;
      if (facility.chargeRing) {
        const ring = facility.chargeRing;
        ring.removeFromParent();
        ring.material.dispose();
        facility.chargeRing = null;
      }
      if (!facility.model) return;
      this.outlineMask?.remove(facility.model);
      facility.dock?.dispose();
      facility.dock = null;
      this.restoreDeviceColour(facility);
      disposeDeskDevice(facility.model);
      facility.model.removeFromParent();
      facility.model = null;
    }
    add(kind, x, z, options = {}) {
      if (!isActiveFacility(kind) || options.data?.comet) return null;
      if (this.run.terrain.bossSite && kind !== 'boss' && kind !== 'portal') return null;
      // Forced portals and event placements also need a clear physical footprint.
      const terrain=this.run.terrain;
      if(terrain.desk2d){
        const radius=terrain.deviceFootprint(kind);
        if(terrain.hitProp(x,.1,z,radius)){
          const spot={};
          if(!terrain.placeSpawn(x,z,radius,spot))throw Error('桌面缺少可用的设施位置');
          x=spot.x;z=spot.z;
        }
      }
      if (isDie(kind)) {
        const category = BS({kind, data: options.data});
        const slots = this.list.filter(f => BS(f) === category);
        if (slots.length >= this.dicePerKind) {
          // An event drop relocates a live machine. A cooling slot stays on its timer.
          const live = slots.filter(f => !f.used);
          if (!live.length) return null;
          const farthest = live.reduce((a,b) =>
            Math.hypot(a.x-x,a.z-z) >= Math.hypot(b.x-x,b.z-z) ? a : b);
          this.remove(farthest);
        }
      }
      const y = this.run.terrain.height(x, z);
      const facility = {kind, x, y, z, r: 2.6, used: false, cost: 0, ...options};
      if (this.rotatingPickups && (isDie(kind) || kind === 'berry')) facility.rotateAt = this.run.time + pickupIdleSeconds;
      const group = facility.group = new Cr();
      group.position.set(x, y, z);
      if (kind === 'altar') {
        const tier = facility.data?.tier;
        facility.data = {tier: Number.isInteger(tier) && RS[tier] ? tier : 0};
        facility.altarColor = altarPalette[facility.data.tier].dark;
        facility.altarCss = '#' + facility.altarColor.toString(16).padStart(6,'0');
        facility.charge = 0;
        facility.charging = false;
        facility.r = RS[facility.data.tier].r;
        if (facility.data.tier >= 2) this.altarBeacon(facility);
      } else if (kind === 'boss') {
        facility.r = this.run.sanctuary ? 5 * (terrain.bossSite?.scale ?? 1) : 4;
      } else if (kind === 'portal') {
        facility.r = 3.4;
        const beacon = facility.beacon = fb(this.portalColor(facility), 1.7, 6.6);
        beacon.position.set(x, y, z);
        this.group.add(beacon);
      } else if (kind === 'bill') {
        facility.r = 3.4;
      } else if (kind === 'nest') {
        facility.r = 2.8;
      }
      this.group.add(group);
      facility.reservation = this.run.terrain.reserve(x, z, facility.r + 0.6);
      this.list.push(facility);
      facility.modelReady = this.loadDevice(facility);
      return facility;
    }
    altarBeacon(e) {
      let t = e.data?.tier ?? 0,
        r = fb(e.altarColor, 0.9 + 0.3 * (t - 2), 4.2, t >= 3 ? 30 : 16);
      (r.position.set(e.x, e.y, e.z), this.group.add(r), (e.beacon = r));
    }
    place(e, t, n, r = {}) {
      return this.add(e, t, n, r);
    }
    populate() {for(const _ of this.populationSteps()){} }
    async populateAsync() {
      // The first summoned portal must open immediately when the boss falls.
      const portal = deskTexture(this.deviceArt,'device-portal.png');
      const check = () => { if (this.disposed || this.run.disposed) throw Error('本局已结束'); };
      const stats = await runLoadingSteps(this.populationSteps(),{
        check,
        onProgress:()=>this.run.onLoadProgress?.({phase:'摆放场景物件',detail:'已摆放 '+this.list.length+' 个'})
      });
      await Promise.all([portal, ...this.list.map(facility => facility.modelReady)]);
      check();
      return stats;
    }
    *populationSteps() {
      const {terrain, player, endless, sanctuary} = this.run;
      if (sanctuary) {
        if (terrain.bossSite) this.add('boss',terrain.bossSite.x,terrain.bossSite.z);
        return;
      }
      const rng = new Ol(terrain.seed ^ 30634);
      const count = base => Math.round(base * (0.5 + 0.5 * terrain.areaMul));
      const bonus = player.items.get('dowsing-machine') ?? 0;
      const altarTier = rollAltarTier(rng, count(endless ? 3 : 5) + bonus, player.stats.luckMult);
      const kinds = [];
      for (const [kind, amount] of [
        ['altar', 1], ['bill', 1], ['nest', 1], ['ditto', endless ? 2 : 1],
        ['magnet', 1], ['freechest', this.dicePerKind],
        ['berry', 2 * this.dicePerKind], ['chest', this.dicePerKind],
      ]) {
        for (let i = 0; i < amount; i++) kinds.push(kind);
      }
      rng.shuffle(kinds);
      // Reserve the limited sites outside the entry view for the four dice.
      if (this.dicePerKind > 1) {
        kinds.sort((a,b) => Number(isDie(b)) - Number(isDie(a)));
      }
      if (!endless) kinds.unshift('boss');

      // Sample the desk's actual depth with the same six-unit edge clearance
      // as the fine placement pass. Other maps use their square play bounds.
      const limit = terrain.play - 9, sites = [];
      const depthLimit = terrain.desk2d ? terrain.deskBounds.z - 6 : limit;
      const cells = Math.ceil(2 * limit / 5), cell = 2 * limit / cells;
      const rows = Math.ceil(2 * depthLimit / 5), rowHeight = 2 * depthLimit / rows;
      for (let col = 0; col < cells; col++) {
        for (let row = 0; row < rows; row++) {
          const x = -limit + (col + rng.next()) * cell;
          const z = -depthLimit + (row + rng.next()) * rowHeight;
          const fromSpawn = Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z);
          if (fromSpawn < 14 || !terrain.inBounds(x, z, 6) || Math.hypot(x, z) > terrain.arenaR - 6 ||
              !terrain.isFlatOpen(x, z) || !this.fitsOnDesk(x, z, 4.5)) continue;
          sites.push({x, z, fromSpawn, fitsAltar: this.fitsOnDesk(x, z, 6.5), clearance: Infinity});
        }
        yield;
      }
      rng.shuffle(sites);
      // Reuse the shuffled, walkable sites for later refills. Initial placement
      // splices out occupied sites; live facilities are checked again on refill.
      this.pickupSites = sites.slice();
      for (const kind of kinds) {
        const accepts = (x,z) => !terrain.desk2d || !isDie(kind) || this.chestOutsideEntryView(x,z);
        const minDistance = kind === 'boss' ? limit * .55 : 14;
        const needsLargeSite = kind === 'boss' || kind === 'altar';
        const radius = needsLargeSite ? 6.5 : 4.5;
        const designated = kind !== 'boss' && this.availableMapSite(radius,accepts);
        let best = -1;
        for (let i = 0; !designated && i < sites.length; i++) {
          if (!accepts(sites[i].x,sites[i].z) || sites[i].fromSpawn < minDistance || (needsLargeSite && !sites[i].fitsAltar) || !this.hasBuildingSpace(sites[i].x,sites[i].z,radius)) continue;
          if (best < 0 || sites[i].clearance > sites[best].clearance) best = i;
        }
        let site = designated || (best >= 0 ? sites.splice(best, 1)[0] : null);
        if (!site && terrain.desk2d) {
          // The coarse random grid may miss the final usable patches of desk.
          // Keep the spawn, desk edge and prop checks on this path too.
          let clearance = -Infinity;
          for (let z = -depthLimit; z <= depthLimit; z += 1.5) {
            for (let x = -limit; x <= limit; x += 1.5) {
              if (!accepts(x,z) || Math.hypot(x-terrain.spawn.x,z-terrain.spawn.z) < minDistance ||
                  !terrain.inBounds(x,z,6) || !terrain.isFlatOpen(x,z) || !this.fitsOnDesk(x,z,radius) || !this.hasBuildingSpace(x,z,radius)) continue;
              const gap = this.list.reduce((d,f)=>Math.min(d,Math.hypot(x-f.x,z-f.z)-f.r),Infinity);
              if (gap > clearance) { site = {x,z}; clearance = gap; }
            }
          }
          if (!site) throw Error('桌面没有符合避让规则的设施位置：' + kind);
        }
        site ??= terrain.randomPoint(rng, 0, 0, minDistance, limit);
        const facility = this.add(kind, site.x, site.z, kind === 'altar' ? {data: {tier: altarTier}} : {});
        for (const other of sites) {
          other.clearance = Math.min(other.clearance, Math.hypot(other.x - site.x, other.z - site.z) - facility.r);
        }
        yield;
      }
    }
    chestOutsideEntryView(x,z) {
      const t=this.run.terrain;
      const frame=deskPlayFrame(this.run.r?.camera?.aspect??390/844,t.deskBounds.x,t.deskBounds.z);
      return Math.abs(x-t.spawn.x)>frame.w+8 || Math.abs(z-t.spawn.z)*deskTilt>frame.h+8;
    }
    availableMapSite(radius, accepts = () => true, crowded = false) {
      const terrain = this.run.terrain;
      return terrain.facilitySites?.find(({x,z,surface}) =>
        accepts(x,z) && Math.hypot(x-terrain.spawn.x,z-terrain.spawn.z) >= 14 &&
        terrain.inBounds(x,z,6) && Math.hypot(x,z) <= terrain.arenaR-6 && terrain.isFlatOpen(x,z) &&
        this.hasBuildingSpace(x,z,radius,crowded) && this.fitsOnDesk(x,z,radius,surface));
    }
    fitsOnDesk(x, z, radius, surface) {
      const terrain = this.run.terrain;
      if (terrain.canReachDeskPoint && !terrain.canReachDeskPoint(x,z)) return false;
      if (terrain.fitsFacilitySurface && !terrain.fitsFacilitySurface(x,z,radius,surface)) return false;
      const floor = terrain.height(x, z);
      if (terrain.hitProp(x, floor + .1, z, radius) ||
          this.lowProps.some(prop => hitsPaperBox(prop, x, z, radius))) return false;
      // A track straddling a raised notebook edge disappears into the paper.
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const edge = terrain.height(x + radius * Math.cos(angle), z + radius * Math.sin(angle));
        if (Math.abs(edge - floor) > .1) return false;
      }
      return true;
    }
    hasBuildingSpace(x, z, radius, crowded = false) {
      return this.list.every(f => (f.used && !f.group.visible) ||
        Math.hypot(x - f.x, z - f.z) >= Math.max(crowded ? 10 : 16, f.r + radius + (crowded ? 4 : 7)));
    }
    spawnChest(e, t, n, r = !1, i = e, a = t) {
      let o = e,
        s = t,
        c = this.run.terrain,
        l = c.height(i, a),
        u = (e, t) => Math.abs(c.height(e, t) - l) > 1.8,
        d = (e, t) => this.list.some((n) => n.kind === `portal` && Math.hypot(n.x - e, n.z - t) < 13),
        f = (e, t) =>
          this.run.sprites.visible(e,c.height(e,t)+2,t,8) ||
          d(e, t) ||
          u(e, t) ||
          !c.inBounds(e, t, 4) ||
          Math.hypot(e, t) > c.arenaR - 3 ||
          !c.isFlatOpen(e, t) ||
          !this.fitsOnDesk(e, t, 2.6) ||
          !this.hasBuildingSpace(e, t, 2.6);
      const site = this.availableMapSite(4.5, (x,z)=>!d(x,z) && !u(x,z) && !this.run.sprites.visible(x,c.height(x,z)+2,z,8));
      if (site) return this.add(n ? 'freechest' : 'chest', site.x, site.z, r ? {data:{gift:true}} : {});
      for (let n = 0; n < 40 && f(o, s); n++) {
        let r = this.run.terrain.randomPoint(F, e, t, 2, 4 + n);
        ((o = r.x), (s = r.z));
      }
      if (f(o, s)) {
        let e = this.run.player.pos;
        for (let t = 0; t < 20 && f(o, s); t++) {
          let n = c.randomPoint(F, e.x, e.z, 3, 6 + t);
          ((o = n.x), (s = n.z));
        }
      }
      if (f(o, s)) {
        for (let e = 0; e < 60 && f(o, s); e++) {
          let e = c.randomPoint(F, 0, 0, 0, Math.max(8, c.arenaR - 6));
          ((o = e.x), (s = e.z));
        }
        if (c.inSolid(o, s) || !c.inBounds(o, s, 4)) {
          let e = this.run.player.pos;
          ((o = e.x), (s = e.z));
        }
      }
      if (f(o,s)) {
        const free = this.pickupSites?.find(p=>!f(p.x,p.z));
        if (!free) return null;
        o=free.x; s=free.z;
      }
      return this.add(n ? `freechest` : `chest`, o, s, r ? { data: { gift: !0 } } : {});
    }
    rewardsLeft() {
      let e = this.run.player.pos;
      return this.list.filter(
        (t) =>
          !t.used &&
          (t.kind === `freechest` || t.kind === `cursedchest` || (t.kind === `chest` && t.data?.gift)) &&
          Math.hypot(t.x - e.x, t.z - e.z) < 60,
      ).length;
    }
    spawnNpc(e, t, n) {
      return this.add(e, t, n);
    }
    remove(e) {
      this.run.ui.removeWorldLabel(e);
      this.releaseDevice(e);
      const zones = this.run.terrain.clearZones;
      const index = zones.indexOf(e.reservation);
      if (index >= 0) zones.splice(index, 1);
      ((this.list = this.list.filter((t) => t !== e)),
        e.group && this.group.remove(e.group),
        e.beacon && this.group.remove(e.beacon),
        this.nearest === e && (this.nearest = null));
    }
    spawnPortal(e, t, n = !1, r = !1) {
      let i = this.run.terrain,
        a = this.run.player.pos,
        o = this.run.boss.bossIndex,
        s = o >= 0 && (this.run.enemies.flags[o] & R.Shiny) !== 0,
        c = (n) =>
          i.isFlatOpen(n.x, n.z) &&
          i.inBounds(n.x, n.z, 6) &&
          (!s || Math.hypot(n.x - e, n.z - t) >= 15) &&
          this.hasBuildingSpace(n.x, n.z, 3.4) &&
          this.fitsOnDesk(n.x, n.z, 3.4) &&
          !i.landmarks.some((e) => Math.hypot(e.x - n.x, e.z - n.z) < e.r + 3),
        l = { x: e, z: t, y: i.height(e, t) },
        u = r;
      for (let n of [6, 12, 20, 35, 55]) {
        if (u) break;
        for (let r = 0; r < 40 && !u; r++) {
          let r = i.randomPoint(F, e, t, n > 6 ? n * 0.3 : 0, n);
          c(r) && ((l = r), (u = !0));
        }
        if (u) break;
      }
      if (!u) {
        l = i.randomPoint(F, e, t, 0, 6);
        for (let n of [12, 20, 35]) {
          if (i.isFlatOpen(l.x, l.z) && i.inBounds(l.x, l.z, 6)) break;
          l = i.randomPoint(F, e, t, 4, n);
        }
      }
      (!r && (!i.isFlatOpen(l.x, l.z) || !i.inBounds(l.x, l.z, 6)) && (l = i.randomPoint(F, a.x, a.z, 3, 12)),
        this.run.sanctuary && !r && this.run.sanctuary.confine(l.x, l.z, 6, l));
      let d = this.add(`portal`, l.x, l.z, { data: { sanct: n } }),
        f = this.run,
        p = this.portalColor(d),
        m = d.group;
      return (
        (d.data.openT = 0),
        m.scale.setScalar(0.01),
        f.animate(0.75, (e) => {
          let t = 1 + 2.7 * (e - 1) ** 3 + 1.7 * (e - 1) ** 2;
          m.scale.setScalar(Math.max(0.01, t));
        }),
        f.vfx.flash(l.x, l.y + 3, l.z, p, 9, 0.35),
        f.vfx.ring(l.x, l.y, l.z, 8, p, 0.8),
        f.later(0.25, () => f.vfx.ring(l.x, l.y, l.z, 12, 16777215, 0.7)),
        f.vfx.burst(l.x, l.y + 3, l.z, p, 40, 12, I.Twinkle, 0.7, 0.9),
        f.vfx.dust(l.x, l.y, l.z, 13154456, 16, 7),
        f.shake(0.4, l.x, l.z),
        f.audio.boom(0.6),
        d
      );
    }
    portalColor(e) {
      return e.data?.sanct ? (this.run.biome.sanctuary?.color ?? 9109354) : 10119935;
    }
    label(e) {
      const cost = this.interactionCost(e);
      if (this.run.gold < cost) return '';
      switch (e.kind) {
        case `chest`:
          return e.data?.gift
            ? c(`Abrir Poké Ball (gratis)`)
            : c(`Abrir Poké Ball · {cost} ₽`, { cost });
        case `freechest`:
          return c(`Abrir Super Ball (gratis)`);
        case `altar`:
          return e.used
            ? c(`Altar agotado`)
            : c(`{name} · quédate dentro para cargarlo`, { name: facilityNames.altar });
        case `challenge`:
          return e.used
            ? e.data?.left
              ? c(`Desafío: quedan {n}`, { n: e.data.left })
              : c(`Desafío superado`)
            : c(`Altar de desafío · invoca una oleada; si la derrotas, Super Ball`);
        case `cursedchest`:
          return c(`Abrir Poké Ball maldita (gratis... ¿seguro?)`);
        case `meowth`:
          return c(`Hablar con Meowth (tienda)`);
        case `ditto`:
          return e.used ? c(`Ditto descansa`) : c(`Ditto: clona uno de tus objetos`);
        case `hypno`:
          return c(`Hypno: olvida un movimiento o vitamina`);
        case `magnet`:
          return e.used ? c(`Magnemite sin energía`) : c(`Magnemite: atrae toda la experiencia`);
        case `berry`:
          return e.used ? c(`Sin bayas`) : c(`Recoger Bayas Aranja`);
        case `boss`:
          return this.run.bossSpawned
            ? c(`El guardián ya despertó`)
            : this.run.stageTime < bossSummonUnlockSeconds(this.run)
              ? '距可提前召唤 ' + Ys(Math.ceil(bossSummonUnlockSeconds(this.run) - this.run.stageTime)).padStart(5, '0')
              : `靠近即可唤醒镇守`;
        case `shrine`:
          return this.run.bossSpawned ? c(`El santuario late con fuerza`) : c(`Tocar el santuario`);
        case `portal`:
          return this.run.endless
            ? c(`Migrar a tierras nuevas`)
            : e.data?.sanct
              ? this.run.stage >= 4
                ? c(`Salir del santuario`)
                : c(`Entrar al {name}`, { name: this.run.biome.sanctuary?.name ?? c(`santuario`) })
              : c(`Entrar al portal`);
        case `shroom`:
          return c(`Seta rebote`);
        case `slots`:
          return c(`Tragaperras · {cost} ₽ por tirada`, { cost });
        case `fossil`:
          return e.used
            ? c(`Las ruinas callan`)
            : c(`Ruinas del Fósil · revive un fósil a cambio de PS máximos`);
        case `rhydon`: {
          let t = this.run.roars;
          return e.used || this.run.bossSpawned
            ? t
              ? c(`Rhydon descansa · {n} gritos`, { n: t })
              : c(`Rhydon descansa`)
            : t
              ? c(`Grito de Rhydon ({n}/{max}) · otro grito: guardián +{hp} % PS y +1 Super Ball`, {
                  n: t,
                  max: 3,
                  hp: Math.round(Bv * 100),
                })
              : c(`Grito de Rhydon · guardián más fuerte y con escolta, +1 Super Ball por grito`);
        }
        case `nest`:
          return e.used
            ? c(`Nido vacío`)
            : this.run.egg
              ? c(`Nido con un Huevo · ya llevas uno`)
              : c(`Coger el Huevo Pokémon · eclosiona tras {n} bajas`, { n: mf(this.run) });
        case `tower`:
          return this.run.tower?.label(e) ?? ``;
        case `bill`: {
          if (e.used) return c(`La Máquina de Bill se está enfriando`);
          let t = yS(this.run).filter((e) => e.ready).length;
          return t > 1
            ? c(`Máquina de Bill · una fusión, a elegir entre {n} parejas`, { n: t })
            : c(
                t
                  ? `Máquina de Bill · una fusión lista`
                  : `Máquina de Bill · fusiona dos movimientos de nivel {level} o superior`,
                { level: fusionRequiredLevel },
              );
        }
        default:
          return ``;
      }
    }
    billIdle(e, t) {
      let n = this.run,
        r = (e.data ??= {});
      ((r.chk = (r.chk ?? 0) - t), r.chk <= 0 && ((r.chk = 0.5), (r.ready = yS(n).some((e) => e.ready))));
      let i = Math.atan2(-e.x, -e.z),
        a = Math.cos(i),
        o = -Math.sin(i);
      if (Math.random() < t * 3) {
        let t = Math.random() < 0.5 ? -1 : 1;
        n.vfx.add.spawn({
          x: e.x + a * hS * t + F.range(-0.4, 0.4),
          y: e.y + F.range(0.8, 2.8),
          z: e.z + o * hS * t + F.range(-0.4, 0.4),
          vy: 0.7,
          life: 0.8,
          size: 0.24,
          endSize: 0,
          color: t < 0 ? 5951743 : 16757818,
          shape: I.Spark,
          glow: 0.8,
        });
      }
      if (r.ready && Math.random() < t * 14) {
        let t = n.time * 5,
          r = (n.time * 1.6) % 4;
        for (let [i, a] of [
          [0, 5951743],
          [Math.PI, 16757818],
        ])
          n.vfx.add.spawn({
            x: e.x + Math.cos(t + i) * 0.8,
            y: e.y + 0.4 + r,
            z: e.z + Math.sin(t + i) * 0.8,
            vy: 1.4,
            life: 0.6,
            size: 0.3,
            endSize: 0,
            color: a,
            shape: I.Twinkle,
            glow: 0.6,
          });
      }
    }
    interact(e) {
      let t = this.run;
      const cost = this.interactionCost(e);
      if (t.gold < cost) return;
      if (!(e.used && e.kind !== `meowth` && e.kind !== `hypno` && e.kind !== `portal` && e.kind !== `tower`))
        switch (e.kind) {
          case `tower`:
            t.tower?.interact(e);
            break;
          case `chest`: {
            if (e.data?.gift) {
              this.openChest(e, !1, !0);
              break;
            }
            ((t.gold -= cost), (t.goldSpent += cost), this.openChest(e, !1));
            break;
          }
          case `freechest`:
            this.openChest(e, !0);
            break;
          case `cursedchest`:
            (this.openChest(e, !0, !1, F.chance(Math.min(0.8, 0.4 * t.player.stats.luckMult)) ? 2 : 1),
              t.tempMods.push({ stat: `difficulty`, mul: 1.05 }),
              t.player.recompute(),
              t.later(0.2, () => this.ambush(e)));
            break;
          case `challenge`:
            this.startChallenge(e);
            break;
          case `meowth`:
            t.openShop();
            break;
          case `ditto`:
            t.openDitto(() => {
              e.used = true;
              (e.data ??= {}).regenAt = t.time + VS.ditto;
              this.dim(e);
            });
            break;
          case `hypno`:
            t.openForget();
            break;
          case `fossil`:
            t.openFossil(e);
            break;
          case `rhydon`:
            Hv(t, e);
            break;
          case `nest`:
            gf(t, e);
            break;
          case `bill`:
            xS(t, e);
            break;
          case `slots`:
            t.openSlots(e);
            break;
          case `magnet`:
            ((e.used = !0),
              this.dim(e),
              (t.pickups.magnetAll = 5),
              t.ui.toast(c(`¡Magnemite atrae toda la experiencia!`),null,facilityIconFile('magnet')),
              t.cry(81),
              t.audio.power());
            break;
          case `berry`:
            if(Math.hypot(e.x-t.player.pos.x,e.z-t.player.pos.z)>e.r+0.8 ||
                t.state!=='play'||t.player.dead||t.coop?.lifting||t.capture.throwing||t.capture.canThrow()||
                !e.berryPickup||!this.hasVisual(e))break;
            e.used=true;e.absorbing=true;
            if (e.rotateAt !== undefined) e.respawnAt = t.time + pickupCooldownSeconds;
            else (e.data ??= {}).regenAt = t.time + VS.berry;
            e.berryPickup.begin(t.player);
            e.model.userData.setVisualState?.('used');
            t.player.heal(t.player.maxHp*.5);
            t.meta.count(`berries`,1);
            break;
          case `boss`:
            if (t.stageTime < bossSummonUnlockSeconds(t) || this.nearest !== e || this.dwellTime < bossSummonSeconds) break;
            if (t.mewtwo.active) {
              t.ui.toast(c(`Una barrera psíquica te lo impide`), null);
              break;
            }
            this.summonGuardian(e, e, 'manual');
            break;
          case `shrine`:
            t.bossSpawned || ((e.used = !0), t.spawnBoss(e.x, e.z));
            break;
          case `portal`:
            t.endless ? t.migrate() : t.enterPortal(e);
            break;
        }
    }
    summonGuardian(vortex, origin, mode) {
      const run = this.run;
      if (run.bossSpawned || run.stageCleared) return;
      run.spawnBoss(origin.x, origin.z, mode);
      if (vortex) {
        vortex.used = true;
        this.dim(vortex);
      }
    }
    startChallenge(e) {
      let t = this.run,
        n = t.enemies,
        r = t.director,
        i = r.pool.filter((e) => k.hasAnimated(e.id));
      if (!i.length) return;
      e.used = !0;
      let a = F.pick(i).id,
        o = 8 + 3 * t.stage,
        s = 1 + Math.floor(t.stage / 2),
        l = [];
      const word = enemySpeciesWord(a);
      ((e.data = { ...e.data, wave: l, left: o, pending: o, species: a }),
        t.ui.banner(
          c(`¡Desafío aceptado!`),
          c(`Derrota a los {n} {name} que te rodean`, { n: o, name: word }),
          `#ff6a4a`,
          { species: a, glyph: word },
        ),
        t.audio.bossStart(),
        t.vfx.ring(e.x, e.y, e.z, 11, 16738890, 0.8),
        t.shake(0.3, e.x, e.z));
      for (let i = 0; i < o; i++)
        t.later(0.15 + i * 0.08, () => {
          let c = (i / o) * Math.PI * 2 + F.range(-0.2, 0.2),
            u = F.range(8, 11),
            d = e.x + Math.cos(c) * u,
            f = e.z + Math.sin(c) * u;
          t.terrain.inBounds(d, f, 4) || ((d = e.x + Math.cos(c) * 4), (f = e.z + Math.sin(c) * 4));
          let p = n.spawn(a, d, f, r.hpMult(), r.dmgMult(), i < s ? R.Elite : 0);
          if ((e.data.pending--, p < 0)) return;
          l.push([p, n.gen[p]]);
          let m = t.terrain.height(d, f);
          (t.vfx.dust(d, m, f, 13154456, 6, 4),
            t.vfx.burst(d, m + 0.8, f, 16738890, 8, 4, I.Spark, 0.4, 0.4));
        });
    }
    challengeLeft(e) {
      let t = this.run.enemies,
        n = 0;
      for (let [r, i] of e.data.wave) t.isAlive(r) && t.gen[r] === i && n++;
      return n;
    }
    ambush(e) {
      let t = this.run,
        n = t.enemies,
        r = t.director,
        i = t.player.pos,
        a = 4 + 2 * t.stage;
      (t.ui.toast(c(`¡Era una trampa! Los fantasmas salen de la Poké Ball`), null),
        t.cry(92),
        t.vfx.ring(e.x, e.y, e.z, 7, 10115839, 0.6));
      for (let e = 0; e < a; e++) {
        let o = (e / a) * Math.PI * 2,
          s = F.range(6, 8),
          c = i.x + Math.cos(o) * s,
          l = i.z + Math.sin(o) * s;
        if (!t.terrain.inBounds(c, l, 4)) continue;
        let u = TS[Math.min(TS.length - 1, t.stage - 1 + (e === 0 ? 2 : 0))],
          d = n.spawn(u, c, l, r.hpMult(), r.dmgMult(), e === 0 ? R.Elite : 0);
        d < 0 ||
          t.vfx.add.spawn({
            x: c,
            y: n.y[d] + 1,
            z: l,
            life: 0.7,
            size: 2.6,
            endSize: 0,
            color: 10124031,
            shape: I.Wisp,
            glow: 0.6,
          });
      }
    }
    pullLever(e) {
      let t = e.group?.userData.lever;
      t &&
        this.run.animate(0.5, (e) => {
          t.rotation.x = 1.1 * Math.sin(Math.min(1, e * 1.4) * Math.PI);
        });
    }
    dim(facility) {
      if (facility.dock) {
        facility.dock.open();
        return;
      }
      if(facility.kind==='magnet'){
        facility.model?.userData.setMagnetUsed(true,this.run.time);return;
      }
      if (!facility.model || facility.originalMaterials) return;
      facility.model.userData.setVisualState?.('used');
      const originals = facility.originalMaterials = new Map();
      facility.model.traverse(mesh => {
        if (!mesh.isMesh) return;
        const original = mesh.material;
        originals.set(mesh, original);
        mesh.material = original.clone();
        // Three.js does not clone the shader hook used to composite layered desk art.
        mesh.material.onBeforeCompile = original.onBeforeCompile;
        mesh.material.customProgramCacheKey = original.customProgramCacheKey;
        mesh.material.color.multiplyScalar(0.55);
      });
    }
    restoreDeviceColour(facility) {
      if(facility.kind==='magnet')facility.model?.userData.setMagnetUsed(false,this.run.time);
      if (!facility.originalMaterials) return;
      for (const [mesh, original] of facility.originalMaterials) {
        mesh.material.dispose();
        mesh.material = original;
      }
      facility.originalMaterials = null;
      facility.model.userData.setVisualState?.('idle');
    }
    openChest(e, t, n = !1, r) {
      let i = this.run;
      if (e.used) return;
      if (!i.sanctuary && isDie(e.kind)) {
        e.respawnAt = i.time + (e.rotateAt !== undefined ? pickupCooldownSeconds : 30);
      }
      if (
        ((e.used = !0),
        (this.run.chestsBought += t || n ? 0 : 1),
        i.meta.count(`chests`, 1),
        e.group)
      ) {
        let t = e.group,
          n = t.userData.lid,
          r = t.scale.x;
        i.animate(
          0.35,
          (e) => {
            let i = Math.sin(e * Math.PI);
            (t.scale.set(r * (1 + i * 0.2), r * (1 - i * 0.15), r * (1 + i * 0.2)),
              n && (n.rotation.x = -1.9 * Math.min(1, e * 1.6)));
          },
          () =>
            i.later(0.9, () =>
              i.animate(
                0.3,
                (e) => t.scale.setScalar(r * (1 - e)),
                () => {
                  t.visible = !1;
                  // Keep this bounded slot's prepared model for its next site.
                  // Hidden devices do not participate in the screen effects.
                  if(e.respawnAt===undefined)this.releaseDevice(e);
                },
              ),
            ),
        );
      }
      i.vfx.burst(e.x, e.y + 1, e.z, 16777215, 24, 7, I.Star, 0.6, 0.6);
      i.audio.chest();
      let a = !t && !n && !i.endless ? 3 : 1;
      if(e.contactTest)i.rollChestItem(t,r,a);
      else i.later(0.35, () => i.rollChestItem(t, r, a));
    }
    relocatePickup(pickup) {
      const {terrain, sprites, player, time} = this.run;
      const sites = this.pickupSites ?? [];
      // Prefer a distant site. On a crowded desk a second pass uses the
      // physical footprints plus clearance, still entirely outside the view.
      const crowded = pickup.rotateAt !== undefined && pickup.refillChecked >= sites.length;
      const fits = (x,z) => Math.hypot(x-pickup.x,z-pickup.z) >= (crowded ? 12 : 32) &&
        (crowded || Math.hypot(x-player.pos.x,z-player.pos.z) >= 32) &&
        (crowded || !this.recentPickupSites.some(site=>Math.hypot(x-site.x,z-site.z)<24)) &&
        !sprites.visible(x,terrain.height(x,z)+2,z,8) && !terrain.isReserved(x,z,3);
      let site = this.availableMapSite(4.5,fits,crowded);
      if (!site && sites.length) {
        pickup.refillCursor ??= F.int(0,sites.length-1);
        pickup.refillChecked ??= 0;
        // Bound collision queries when several pickups expire together.
        const limit = sites.length * (crowded ? 2 : 1);
        for (let i=0; i<24 && pickup.refillChecked<limit; i++) {
          const candidate = sites[pickup.refillCursor++ % sites.length];
          pickup.refillChecked++;
          const {x,z} = candidate;
          if (fits(x,z) && this.hasBuildingSpace(x,z,pickup.r,crowded) && this.fitsOnDesk(x,z,4.5)) {
            site = candidate;
            break;
          }
        }
      }
      if (!site) {
        const passes = pickup.rotateAt === undefined ? 1 : 2;
        if (!sites.length || pickup.refillChecked >= passes * sites.length) {
          delete pickup.refillChecked;
          delete pickup.refillCursor;
          pickup.retrySiteAt = time + 1;
        }
        return;
      }
      this.run.ui.removeWorldLabel(pickup);
      this.recentPickupSites.push({x:pickup.x,z:pickup.z});
      if (this.recentPickupSites.length > 24) this.recentPickupSites.shift();
      if (this.nearest === pickup) this.updateDwell(null,0,0);
      if (pickup.used) {
        pickup.kind = BS(pickup);
        pickup.data = undefined;
        pickup.berryPickup?.reset();
        pickup.model?.userData.setVisualState?.('idle');
        pickup.group.scale.setScalar(1);
        pickup.group.visible = true;
        if (pickup.group.userData.lid) pickup.group.userData.lid.rotation.x = 0;
        this.restoreDeviceColour(pickup);
      }
      pickup.x = site.x;
      pickup.z = site.z;
      pickup.y = terrain.height(site.x,site.z);
      pickup.group.position.set(pickup.x,pickup.y,pickup.z);
      Object.assign(pickup.reservation,{x:pickup.x,z:pickup.z});
      pickup.used = false;
      delete pickup.respawnAt;
      delete pickup.refillCursor;
      delete pickup.refillChecked;
      delete pickup.retrySiteAt;
      if (pickup.rotateAt !== undefined) pickup.rotateAt = time + pickupIdleSeconds;
    }
    update(e, dwellSeconds = e) {
      let t = this.run,
        n = t.player.pos,
        r = null,
        i = 1e9;
      let refillChecked = false;
      for (let a of this.list) {
        const dueAt = a.used ? a.respawnAt : a.rotateAt;
        if (dueAt !== undefined && t.time >= dueAt && !refillChecked && !a.absorbing &&
            t.state === 'play' && t.time >= (a.retrySiteAt ?? 0) &&
            (a.used || !t.sprites.visible(a.x,a.y+2,a.z,8))) {
          this.relocatePickup(a);
          refillChecked = true;
        }
        const ready = this.hasVisual(a);
        if(a.kind==='berry'){
          if(a.absorbing){
            if(a.berryPickup.advance(e,t.player)){
              a.absorbing=false;
              t.vfx.burst(n.x,n.y+1,n.z,5933823,16,4,I.Heart,.5);
              t.ui.toast(c(`Recuperas PS con unas Bayas Aranja`),null,facilityIconFile('berry'));
              t.audio.heal();
            }
          }else if(!a.used && ready)this.interact(a);
          else if(a.used && a.respawnAt === undefined)this.regen(a);
          continue;
        }
        if (a.beacon) a.beacon.visible = ready;
        if (!a.used && !ready) continue;
        let o = a.group;
        const near=(a.x-n.x)**2+(a.z-n.z)**2<2500;
        if (near&&o?.userData.gem) {
          let n = o.userData.gem;
          ((n.rotation.y += e * 1.5), (n.position.y = (o.userData.gemY ?? 0) + Math.sin(t.time * 2) * 0.12));
          let r = 1 + Math.sin(t.time * 4) * 0.06;
          n.scale.setScalar(r);
        }
        if (
          (near&&a.beacon && (a.beacon.material.uniforms.uTime.value = t.time),
          near&&a.kind === `portal` && o && this.portalFx(a, e),
          a.kind === `shroom` && this.shroomUpdate(a, e),
          a.kind === `boss` && !t.bossSpawned)
        ) {
          let t = Math.hypot(a.x - n.x, a.z - n.z);
          (this.monumentFx(a, e, t), this.presenceFx(t, e));
        }
        if (
          (a.kind === `challenge` &&
            a.used &&
            a.data?.wave &&
            (a.data.pending || (a.data.left = this.challengeLeft(a)),
            a.data.left === 0
              ? ((a.data.wave = null),
                t.meta.count(`challenges`, 1),
                t.ui.banner(c(`¡Desafío superado!`), c(`Te espera una Super Ball en el altar`), `#ffd23a`, {
                  species: a.data.species,
                }),
                t.audio.victory(),
                t.vfx.ring(a.x, a.y, a.z, 8, 16765498, 0.7),
                t.vfx.burst(a.x, a.y + 2.5, a.z, 16765498, 30, 8, I.Star, 0.6, 0.8),
                this.dim(a),
                this.spawnChest(a.x + 2.5, a.z + 2.5, !0))
              : Math.random() < e * 3 && t.vfx.ring(a.x, a.y, a.z, 3.5, 16738890, 0.5)),
          near&&a.kind === `fossil` &&
            !a.used &&
            Math.random() < e * 2 &&
            t.vfx.add.spawn({
              x: a.x + F.range(-1.4, 1.4),
              y: a.y + F.range(0.6, 1.8),
              z: a.z + F.range(-1.4, 1.4),
              vy: 0.4,
              life: 1.3,
              size: 0.28,
              endSize: 0,
              color: 16756810,
              shape: I.Twinkle,
              glow: 0.7,
            }),
          near&&a.kind === `rhydon` &&
            this.run.roars &&
            !t.bossSpawned &&
            Math.random() < e * (1 + 2 * this.run.roars) &&
            t.vfx.add.spawn({
              x: a.x + F.range(-1.2, 1.2),
              y: a.y + F.range(0.4, 1.4),
              z: a.z + F.range(-1.2, 1.2),
              vy: 1.1,
              life: 1.2,
              size: 0.35,
              endSize: 0,
              color: 16742970,
              shape: I.Spark,
              glow: 0.8,
            }),
          near&&a.kind === `nest` && !a.used)
        ) {
          Math.random() < e * 2.5 &&
            t.vfx.add.spawn({
              x: a.x + F.range(-0.7, 0.7),
              y: a.y + F.range(1.4, 2.4),
              z: a.z + F.range(-0.7, 0.7),
              vy: 0.4,
              life: 0.9,
              size: 0.28,
              endSize: 0,
              color: Math.random() < 0.6 ? 16774358 : 7000154,
              shape: I.Twinkle,
              glow: 0.8,
            });
          let n = a.group?.getObjectByName(`Egg`);
          n && (n.rotation.x = Math.sin(t.time * 3 + a.x) > 0.93 ? Math.sin(t.time * 28) * 0.12 : 0);
        }
        if (
          (near&&a.kind === `bill` && !a.used && this.billIdle(a, e),
          near&&a.kind === `slots` &&
            o?.userData.lamp &&
            (o.userData.lamp.scale.setScalar(Math.sin(t.time * 6 + a.x) > 0 ? 1.15 : 0.95),
            Math.random() < e * 1.5 &&
              t.vfx.add.spawn({
                x: a.x + F.range(-0.7, 0.7),
                y: a.y + F.range(1.2, 2.6),
                z: a.z + F.range(-0.7, 0.7),
                vy: 0.5,
                life: 1,
                size: 0.3,
                endSize: 0,
                color: 16765498,
                shape: I.Twinkle,
                glow: 0.8,
              })),
          near&&a.kind === `cursedchest` &&
            !a.used &&
            Math.random() < e * 2 &&
            t.vfx.add.spawn({
              x: a.x + F.range(-0.8, 0.8),
              y: a.y + F.range(0.4, 1.4),
              z: a.z + F.range(-0.8, 0.8),
              vy: 0.6,
              life: 1.1,
              size: 0.35,
              endSize: 0,
              color: 10115839,
              shape: I.Wisp,
              glow: 0.6,
            }),
          near&&a.kind === `shrine` &&
            !a.used &&
            Math.random() < 0.4 &&
            t.vfx.trail(
              a.x + F.range(-1.5, 1.5),
              a.y + F.range(1, 3.5),
              a.z + 1.4 + F.range(-0.5, 0.5),
              t.biome.sanctuary?.color ?? 10157962,
              0.4,
              I.Twinkle,
              0.9,
            ),
          (a.kind === 'ditto' || t.endless) && a.used && VS[a.kind] && this.regen(a),
          a.data?.comet && !a.used && (a.charge ?? 0) <= 0 && (a.data.life -= e) <= 0)
        ) {
          this.burnOut(a);
          continue;
        }
        let s = a.x - n.x,
          l = a.z - n.z,
          u = Math.hypot(s, l);
        if (a.kind === 'altar') {
          if (!a.used) this.altarUpdate(a, u, e, dwellSeconds);
          continue;
        }
        if(a.contactTest){
          if(a.kind==='magnet')a.model.userData.updateMagnet(t.time);
          if(ready&&!a.used&&near&&a.contactTest(t.player)){
            r=a;
            i=-1; // Contact takes priority over a nearby dwell facility.
          }
          continue;
        }
        const reach = a.kind === 'bill' ? staplerInteractionRadius : a.r + 0.8;
        if (ready && u < reach && u < i && a.kind !== 'shroom' &&
            (!a.used || a.kind === 'meowth' || a.kind === 'hypno' || a.kind === 'portal' ||
              (a.kind === 'tower' && a.data?.sub !== 'trick'))) {
          i = u;
          r = a;
        }
      }
      this.landmarkFx(e);
      this.stepLaunch(e);
      this.updateDwell(r, dwellSeconds, e);
    }
    launch = null;
    static LAUNCH_T = 0.85;
    static SHROOM_CD = 25;
    shroomUpdate(t, n) {
      let r = this.run,
        i = r.player,
        a = t.group?.userData.cap,
        o = (t.data.cd = Math.max(0, t.data.cd - n));
      if (a) {
        let e = o > 2 ? 0 : 1 - o / 2,
          i = (t.data.squash = Math.max(0, (t.data.squash ?? 0) - n * 4)),
          s = (0.45 + 0.55 * e) * (1 + Math.sin(r.time * 3 + t.x) * 0.03 * e) * (1 - i * 0.45);
        a.scale.set(1 + i * 0.25, s, 1 + i * 0.25);
      }
      o > 0 ||
        this.launch ||
        !i.items.has('air-balloon') ||
        !i.grounded ||
        i.dead ||
        Math.hypot(i.pos.x - t.x, i.pos.z - t.z) > t.r ||
        i.pos.y > t.y + 1 ||
        ((t.data.cd = e.SHROOM_CD),
        (t.data.squash = 1),
        (this.launch = {
          t: 0,
          x0: i.pos.x,
          y0: i.pos.y,
          z0: i.pos.z,
          x1: t.data.tx,
          y1: t.data.ty,
          z1: t.data.tz,
        }),
        r.vfx.burst(t.x, t.y + 2.2, t.z, 16756810, 16, 6, I.Spore, 0.5, 0.7),
        r.vfx.ring(t.x, t.y, t.z, 2.5, 16742970, 0.35),
        r.audio.jump(1));
    }
    stepLaunch(t) {
      let n = this.launch;
      if (!n) return;
      let r = this.run.player;
      n.t = Math.min(1, n.t + t / e.LAUNCH_T);
      let i = n.t,
        a = 2 * (Math.max(n.y0, n.y1) + 3.2) - (n.y0 + n.y1) / 2,
        o = 1 - i;
      (r.pos.set(
        n.x0 + (n.x1 - n.x0) * i,
        o * o * n.y0 + 2 * o * i * a + i * i * n.y1,
        n.z0 + (n.z1 - n.z0) * i,
      ),
        r.vel.set(0, 0, 0),
        (r.grounded = !1),
        Math.random() < 0.6 &&
          this.run.vfx.trail(r.pos.x, r.pos.y + 0.5, r.pos.z, 16765066, 0.4, I.Spore, 0.5),
        i >= 1 && ((this.launch = null), (r.vel.y = -2)));
    }
    landmarkFx(e) {
      let t = this.run,
        n = t.player.pos;
      if(!t.performance.ambient)return;
      for (let r of t.terrain.landmarks) {
        if (Math.hypot(r.x - n.x, r.z - n.z) > 55) continue;
        let i = t.terrain.height(r.x, r.z),
          a = (e = 1) => F.range(-r.r * e, r.r * e);
        (r.kind === `fairy` &&
          Math.random() < e * 9 &&
          t.vfx.add.spawn({
            x: r.x + a(0.7),
            y: i + F.range(0.2, 2.5),
            z: r.z + a(0.7),
            vy: F.range(0.3, 0.8),
            life: F.range(2, 3.2),
            size: F.range(0.18, 0.32),
            endSize: 0,
            color: F.chance(0.3) ? 16777215 : 7008511,
            shape: I.Twinkle,
            glow: 0.8,
          }),
          r.kind === `grove` &&
            (Math.random() < e * 4 &&
              t.vfx.norm.spawn({
                x: r.x + a(0.9),
                y: i + F.range(6, 11),
                z: r.z + a(0.9),
                vx: F.range(-0.6, 0.6),
                vy: -1.1,
                vz: F.range(-0.6, 0.6),
                life: 6,
                size: 0.35,
                endSize: 0.3,
                color: 8046666,
                shape: I.PixLeaf,
                spin: F.range(-2, 2),
              }),
            Math.random() < e * 3 &&
              t.vfx.add.spawn({
                x: r.x + a(),
                y: i + F.range(0.5, 4),
                z: r.z + a(),
                vx: F.range(-0.3, 0.3),
                vy: F.range(-0.2, 0.3),
                vz: F.range(-0.3, 0.3),
                life: 2.5,
                size: 0.2,
                endSize: 0,
                color: 16773242,
                shape: I.Twinkle,
                glow: 0.9,
              })),
          r.kind === `meadow` &&
            Math.random() < e * 1.5 &&
            t.vfx.norm.spawn({
              x: r.x + a(0.8),
              y: i + F.range(0.6, 2),
              z: r.z + a(0.8),
              vx: F.range(-1, 1),
              vy: F.range(-0.2, 0.4),
              vz: F.range(-1, 1),
              life: 4,
              size: 0.45,
              endSize: 0.4,
              color: F.pick([16777215, 16767050, 16754904, 9097471]),
              shape: I.PixButterfly,
            }),
          r.kind === `arch` &&
            Math.random() < e * 1.2 &&
            t.vfx.norm.spawn({
              x: r.x + a(0.4),
              y: i + F.range(3, 5.5),
              z: r.z + a(0.4),
              vy: -0.8,
              vx: F.range(-0.4, 0.4),
              life: 4,
              size: 0.3,
              endSize: 0.25,
              color: 6993994,
              shape: I.PixLeaf,
              spin: F.range(-2, 2),
            }));
      }
    }
    render(dt) {
      const progress = this.dwellProgress, target = this.nearest;
      const ring = this.dwellRing;
      ring.visible = progress > 0 && target.kind!=='bill' && target.kind!=='berry' && !target.used && this.run.state === 'play' &&
        !this.run.player.dead && this.hasVisual(target);
      ring.material.uniforms.dwell.value = ring.visible ? progress : -1;
      for (const facility of this.list) {
        const model=facility.model;
        if(model && !facility.absorbing){
          model.quaternion.copy(this.run.r.camera.quaternion);
          model.rotateX(deskPitch);
        }
        const anchor=model?.userData.ringAnchor, charge=facility.chargeRing;
        if(facility.berryShadowFoot&&model?.visible)model.getWorldPosition(facility.berryShadowFoot);
        if(anchor && charge && facility.charging){
          // Project the artwork centre onto the ring's ground plane along the
          // current view, so both orthographic desk and perspective views align.
          const camera=this.run.r.camera,p=charge.position;
          model.updateWorldMatrix(true,false);
          model.localToWorld(p.copy(anchor));
          const m=camera.matrixWorld.elements, ortho=camera.projectionMatrix.elements[15]===1;
          const dx=ortho?-m[8]:p.x-m[12],dy=ortho?-m[9]:p.y-m[13],dz=ortho?-m[10]:p.z-m[14];
          if(Math.abs(dy)>1e-6){
            const distance=(facility.y+.12-p.y)/dy;
            p.x+=dx*distance;p.y=facility.y+.12;p.z+=dz*distance;
          }
          facility.group.worldToLocal(p);
        }
        if (facility.dock) {
          if (facility.used || this.run.bossSpawned) facility.dock.open();
          const host = this.run.r;
          const elapsed = !!this.run.terrain.bossSite;
          const seconds = elapsed ? Math.floor(this.run.stageTime) : remainingZoneSeconds(this.run);
          if (!elapsed && seconds <= 0) facility.dock.open();
          facility.dock.update(host.shared.uTime.value,seconds);
        }
        if(facility.kind==='bill')facility.model?.userData.updateGaze?.(
          this.run.r.camera,this.run.player,!facility.used && this.hasVisual(facility),dt??0);
        if (charge) {
          charge.visible = facility.charging && facility.charge < 1 && !facility.used && this.hasVisual(facility);
          charge.material.uniforms.dwell.value = facility.charge;
        }
      }
      if (ring.visible) {
        ring.position.set(target.x,target.y+.12,target.z);
        ring.scale.setScalar(target.ringRadius);
      }
    }
    portalFx(e, t) {
      const n = this.run, r = e.group, i = this.portalColor(e);
      e.data.openT = Math.min(1.2, (e.data.openT ?? 1.2) + t);
      const o = e.data.openT / 1.2;
      let s = r.rotation.y,
        c = Math.cos(s),
        l = -Math.sin(s),
        u = e.y + (e.data.sanct ? 3.2 : 3) * r.scale.y,
        d = Math.sin(s) * 0.6,
        f = Math.cos(s) * 0.6;
      for (let a = 0; a < 2; a++) {
        if (Math.random() > t * 30 * o) continue;
        let s = F.range(0, Math.PI * 2),
          p = 3.4 * r.scale.x,
          m = Math.cos(s),
          h = Math.sin(s),
          g = 3.4,
          _ = 2.2,
          v = a ? -1 : 1;
        n.vfx.add.spawn({
          x: e.x + c * m * p + d * v,
          y: u + h * p,
          z: e.z + l * m * p + f * v,
          vx: c * (-m * g - h * _),
          vy: -h * g + m * _,
          vz: l * (-m * g - h * _),
          life: 0.85,
          size: F.range(0.4, 0.7),
          endSize: 0.1,
          color: F.chance(0.35) ? 16777215 : i,
          shape: I.Twinkle,
          glow: 0.9,
        });
      }
      (Math.random() < t * 6 &&
        n.vfx.add.spawn({
          x: e.x + F.range(-2.6, 2.6),
          y: e.y + 0.4,
          z: e.z + F.range(-2.6, 2.6),
          vy: F.range(1.5, 3),
          life: 1.4,
          size: 0.35,
          endSize: 0,
          color: i,
          shape: I.Spark,
          glow: 0.7,
        }),
        (e.data.pulseT = (e.data.pulseT ?? 0) - t) <= 0 &&
          ((e.data.pulseT = 1.6), n.vfx.ring(e.x, e.y, e.z, 5.5, i, 0.9, 0.5)));
    }
    monumentFx(e, t, n) {
      let r = this.run;
      if (!(n > 60)) {
        if (Math.random() < t * 16) {
          let t = F.range(0, Math.PI * 2),
            n = F.range(2.5, 5.5);
          r.vfx.add.spawn({
            x: e.x + Math.cos(t) * n,
            y: e.y + F.range(0.2, 1.5),
            z: e.z + Math.sin(t) * n,
            vx: -Math.sin(t) * 0.8,
            vy: F.range(2, 4),
            vz: Math.cos(t) * 0.8,
            life: F.range(1.4, 2.4),
            size: F.range(0.25, 0.5),
            endSize: 0,
            color: F.chance(0.25) ? 16756794 : 16726618,
            shape: I.Spark,
            glow: 0.8,
          });
        }
        (Math.random() < t * 2 &&
          r.vfx.add.spawn({
            x: e.x,
            y: e.y + 3.2,
            z: e.z,
            life: 0.9,
            size: 1.4,
            endSize: 3.2,
            color: 16726618,
            shape: I.Soft,
            glow: 0.6,
          }),
          (e.data ??= {}),
          (e.data.pulseT = (e.data.pulseT ?? 0) - t) <= 0 &&
            ((e.data.pulseT = 2.2), r.vfx.ring(e.x, e.y, e.z, 7, 16726618, 1.1, 0.4)));
      }
    }
    presenceFx(e, t) {
      let n = Math.min(1, Math.max(0, (75 - e) / 60));
      if (n <= 0) return;
      let r = this.run,
        i = r.player.pos,
        a = n * n;
      if (Math.random() > t * (4 + 55 * a)) return;
      let o = F.range(0, Math.PI * 2),
        s = F.range(3, 14),
        c = i.x + Math.cos(o) * s,
        l = i.z + Math.sin(o) * s,
        u = Math.cos(r.time * 0.13) * 0.9,
        d = Math.sin(r.time * 0.11) * 0.9,
        f = new Ei(14207231).lerp(new Ei(15212602), a).getHex();
      r.vfx.norm.spawn({
        x: c,
        y: r.terrain.height(c, l) + F.range(0.4, 3.5),
        z: l,
        vx: u,
        vy: F.range(0.1, 0.5),
        vz: d,
        life: F.range(1.8, 3),
        size: F.range(0.22, 0.36) + 0.22 * a,
        endSize: 0,
        color: f,
        shape: F.chance(0.5) ? I.Spark : I.Twinkle,
        glow: 0.3 + 0.4 * a,
      });
    }
    altarUpdate(altar, distance, dt, dwellSeconds) {
      const run = this.run, tier = altar.data.tier, blessing = RS[tier];
      if (distance < 70) this.altarIdleFx(altar, tier, altar.charge, dt);
      const inside = distance < altar.r && !run.player.dead;
      const crew = (run.coop?.altarCrew(altar.x, altar.z, altar.r) ?? 0) + Number(inside);
      altar.charging = crew > 0;
      altar.model?.userData.setVisualState?.(altar.charging ? 'charging' : 'idle',dt);
      const keys = run.player.items.get('secret-key') ?? 0;
      if (crew > 0) {
        const chargeRate = (1 + .3 * keys) * (1 + .6 * (crew - 1)) / altarChargeSeconds;
        altar.data.outT = 0;
        altar.charge = Math.min(1, altar.charge + dwellSeconds * chargeRate);
        if (inside) {
          run.player.anchorT = .2;
          run.audio.charge(altar.charge);
        }
        if (Math.random() < .5 + tier * .15)
          run.vfx.trail(altar.x + F.range(-altar.r, altar.r), altar.y + .5,
            altar.z + F.range(-altar.r, altar.r), altar.altarColor, .5, I.Spark, .6);
        if (altar.charge + 1e-9 >= 1) this.altarDone(altar, tier);
      } else if (altar.charge > 0) {
        altar.data.outT = (altar.data.outT ?? 0) + dt;
        if (altar.data.outT > 1.2) altar.charge = Math.max(0, altar.charge - dt / (blessing.drain * (keys ? 2 : 1)));
      }
    }
    altarIdleFx(e, t, n, r) {
      let i = this.run,
        a = e.altarColor,
        o = e.y + 2.6;
      if (Math.random() < r * (1 + t * 3 + n * 10)) {
        let n = F.range(0, Math.PI * 2),
          r = F.range(0.4, e.r * 0.8);
        i.vfx.add.spawn({
          x: e.x + Math.cos(n) * r,
          y: e.y + F.range(0.2, 1),
          z: e.z + Math.sin(n) * r,
          vy: F.range(0.8, 1.6) + t * 0.4,
          life: F.range(1.2, 2),
          size: F.range(0.2, 0.32),
          endSize: 0,
          color: a,
          shape: t === 3 && F.chance(0.5) ? I.Star : I.Twinkle,
          glow: 0.8,
        });
      }
      if (t >= 2 && Math.random() < r * (6 + n * 20)) {
        let t = i.time * 3 + (F.chance(0.5) ? Math.PI : 0),
          n = 1.1;
        i.vfx.add.spawn({
          x: e.x + Math.cos(t) * n,
          y: e.y + 0.6,
          z: e.z + Math.sin(t) * n,
          vx: -Math.sin(t) * 1.2,
          vy: 2.4,
          vz: Math.cos(t) * 1.2,
          life: 1.3,
          size: 0.3,
          endSize: 0,
          color: F.chance(0.25) ? 16777215 : a,
          shape: I.Spark,
          glow: 0.9,
        });
      }
      if (t === 3 && Math.random() < r * 2) {
        i.vfx.add.spawn({
          x: e.x,
          y: o,
          z: e.z,
          life: 1.2,
          size: 1.6,
          endSize: 3.4,
          color: a,
          shape: I.Soft,
          glow: 0.5,
        });
      }
    }
    altarDone(e, t, n = !1) {
      let r = this.run,
        i = RS[t],
        a = e.altarColor;
      e.charge = 1;
      e.charging = false;
      if (e.chargeRing) e.chargeRing.visible = false;
      r.ui.removeWorldLabel(e);
      ((e.used = !0),
        this.dim(e),
        n || r.coop?.altarDone(e.x, e.z),
        (e.beacon &&= (this.group.remove(e.beacon), void 0)),
        r.offerBlessing(facilityNames.altar, i.min, i.offers, i.picks),
        r.audio.power());
      if (
        (t >= 2 &&
          (r.vfx.burst(e.x, e.y + 3, e.z, a, 20 + 15 * (t - 2), 8, I.Star, 0.6, 0.8),
          r.vfx.flash(e.x, e.y + 2, e.z, a, 6 + t * 2, 0.25),
          r.shake(0.15 + 0.1 * (t - 2), e.x, e.z)),
        t === 3)
      ) {
        for (let t = 0; t < 24; t++) {
          let n = (t / 24) * Math.PI * 2;
          r.vfx.add.spawn({
            x: e.x,
            y: e.y + 1,
            z: e.z,
            vx: Math.cos(n) * 9,
            vy: F.range(4, 8),
            vz: Math.sin(n) * 9,
            life: 1.2,
            size: 0.45,
            endSize: 0,
            color: t % 3 ? a : 16777215,
            shape: I.Star,
            glow: 0.9,
          });
        }
        r.hitstop(0.12);
      }
    }
    coopAltarDone(e, t) {
      let n = this.list.find((n) => n.kind === `altar` && !n.used && Math.hypot(n.x - e, n.z - t) < 1.5);
      n && this.altarDone(n, n.data?.tier ?? 0, !0);
    }
    regen(e) {
      let t = this.run;
      if (
        e.data?.comet ||
        (e.kind === `challenge` && e.data?.wave) ||
        ((e.data ??= {}), (e.data.regenAt ??= t.time + VS[e.kind]), t.time < e.data.regenAt)
      )
        return;
      ((e.used = !1), delete e.data.regenAt);
      if (e.group) e.group.visible = true;
      if(e.berryPickup){e.absorbing=false;e.berryPickup.reset();e.model.userData.setVisualState?.('idle');}
      this.restoreDeviceColour(e);
      if (e.kind === `altar`) {
        let n = e.data.tier ?? 0,
          r = e.altarColor;
        ((e.charge = 0),
          (e.data = { tier: n }),
          n >= 2 && !e.beacon && this.altarBeacon(e),
          t.vfx.burst(e.x, e.y + 3, e.z, r, 24, 6, I.Twinkle, 0.6, 0.7),
          t.ui.toast(c(`¡Un {name} ha vuelto a cargarse!`, { name: facilityNames.altar }), null));
      } else e.kind === `challenge` && (e.data = {});
    }
    burnOut(e) {
      let t = this.run;
      (t.vfx.burst(e.x, e.y + 2, e.z, 9099519, 20, 4, I.Twinkle, 0.5, 0.6),
        t.ui.toast(c(`El fragmento de cometa se ha apagado`), null),
        this.remove(e));
    }
    markers() {
      return this.list.filter(
        (e) =>
          !e.used ||
          e.kind === `meowth` ||
          e.kind === `portal` ||
          (e.kind === `tower` && e.data?.sub !== `trick`) ||
          (e.kind === `challenge` && e.data?.wave),
      );
    }
    dispose() {
      this.disposed = true;
      for (const facility of this.list) this.releaseDevice(facility);
      this.deviceArt.disposed=true;
      for(const value of this.deviceArt.deskOwned)value.dispose();
      this.deviceArt.deskOwned.length=0;
      this.deviceArt.deskTextures.clear();
      this.deviceArt.deskDeviceGeometries?.clear();
      this.outlineMask?.dispose();
      (this.run.ui.clearWorldNotices(),
        this.group.traverse((e) => {
          let t = e;
          t.geometry?.dispose();
          for (let e of Array.isArray(t.material) ? t.material : t.material ? [t.material] : [])
            (e instanceof Kr || e.userData?.owned) && e.dispose();
        }),
        this.group.parent?.remove(this.group));
    }
  };

export {
  BS,
  OS,
  PS,
  GS as Facilities
};
