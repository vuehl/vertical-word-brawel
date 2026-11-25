import {R, xf} from "../combat/enemy-population.js";
import {saveProgress, forgetSeat, worldProgress} from "./coop-resume.js";
import {RoomMonsters} from "../world/room-monsters.js";
import {acceptPeerSample, advancePeerMotion} from "./peer-motion.js";
import {enemySpeciesWord} from "../data/character-rules.js";
import {gameStick} from "../virtual-stick/stick-config.js";
import {StickFrameStream} from "../virtual-stick/stick-frames.js";
import {chineseText as c, formatChineseNumber as n} from "../data/chinese-text.js";
import {ht as ti, w as Ei} from "../vendor/three-DmSYIDKK.js";
import {typeColors as Ni, gameData as k} from "../data/game-database.js";
import {Zc} from "../actors/sprite-assets.js";
import {I, L, Hl, Yl, Xl, eu} from "../effects/battle-particles.js";
import {am} from "../combat/field-effects.js";
import {yb, bb, xb, Sb, Cb, wb} from "../combat/enemies.js";
import {PT, FT, IT, LT, RT, zT, VT, enemyFacingX, enemyFacingZ, UT, WT, KT} from "../combat/encounters.js";

var GT = 15;
var qT = 52,
  JT = 0.1,
  QT = 8,
  $T = 0.2,
  eE = 1.6,
  tE = 1,
  nE = 0.5,
  rE = 0.1,
  aE = 4,
  oE = 1.5,
  cE =
    R.Capture |
    R.Elite |
    R.Alpha |
    R.Ranged |
    R.Flying |
    R.Healer |
    R.Shielder |
    R.Charger |
    R.Swarm |
    R.Stampede |
    R.Shiny |
    R.Totem |
    R.Summoner,
  lE = R.Boss | R.Treasure | R.Object | R.Remote,
  uE = [
    `burn`,
    `poison`,
    `paralysis`,
    `freeze`,
    `sleep`,
    `confusion`,
    `wet`,
    `curse`,
    `healblock`,
    `charm`,
    `root`,
    `knock`,
    `stun`,
  ],
  dE = () => performance.now() / 1e3,
  fE = class e {
    run;
    room;
    party;
    size;
    mySlot;
    peers = new Map();
    bySlot = new Map();
    writer = new UT();
    nextCheckpoint = 0;
    nextCleanup = 0;
    snapshotIds = [];
    snapshotDistances = new Float64Array(xf);
    sendT = 0;
    known = new Map();
    pSlot = new Int8Array(xf).fill(-1);
    pKey = new Uint16Array(xf);
    pT = new Float64Array(xf * QT);
    pX = new Float32Array(xf * QT);
    pY = new Float32Array(xf * QT);
    pZ = new Float32Array(xf * QT);
    pHead = new Uint8Array(xf);
    pN = new Uint8Array(xf);
    pSeen = new Float64Array(xf);
    pHit = new Float64Array(xf);
    pAnim = new Uint8Array(xf);
    proxies = new Map();
    wants = new Map();
    wantAt = new Map();
    hits = new Map();
    deaths = [];
    xpAcc = 0;
    shareT = 0;
    bossAuth = -1;
    bossShared = !1;
    bossStage = 0;
    pendingBoss = null;
    loadingBossCall = null;
    remoteCall = !1;
    portalAt = null;
    portalWant = null;
    bossDownOk = !1;
    bdSeq = 0;
    bdAcc = 0;
    bdT = 0;
    bdPending = [];
    bdAcks = new Map();
    bleed = 0;
    reviveK = 0;
    out = !1;
    liftedBy = null;
    liftPeer = null;
    killsSent = -1;
    killsT = 0;
    portalReady = !1;
    portalInfo = { inside: 0, need: 0, wait: [] };
    advancing = !1;
    wipeT = 0;
    ended = !1;
    modalT = 0;
    marks = [];
    targets = [];
    clock0 = dE();
    stickFrames = new StickFrameStream(gameStick);
    recordStick(x,y,held,ms,force=false) {
      if (!this.room.open || this.ended) return;
      const run=this.run;
      if (this.inputStage !== run.stage) {
        this.inputStage=run.stage;
        this.stickFrames=new StickFrameStream(gameStick);
      }
      if (force) run.inputTick=(run.inputTick || 0)+1;
      const frames=this.stickFrames.record(run.inputTick,ms-this.clock0*1000,x,y,held,force);
      if (frames) this.broadcast({t:'stick-input',stage:run.stage,frames});
    }
    tmpV = new ti();
    spec = null;
    constructor(e, t) {
      ((this.run = e), (this.room = t.room), (this.party = t.party));
      let n = this.room.room.members;
      this.roster = n.slice();
      if(this.room.serverMonsterMotion)this.monsters=new RoomMonsters(this);
      ((this.size = n.length), (this.mySlot = this.room.mine?.slot ?? 0));
      this.budgetRank=n.filter(m=>m.slot<this.mySlot).length;
      for (let e of n) {
        if (e.id === this.room.me) continue;
        let t = {
          id: e.id,
          slot: e.slot,
          name: e.name,
          species: e.species,
          member: e.species,
          skin: e.skin ?? null,
          tag: e.tag ?? null,
          link: this.room.linkState(e.id),
          gone: !!e.offline,
          last: null,
          lastAt: -99,
          stage: 0,
          off: 0,
          jit: 0,
          delay: JT,
          buf: [],
          x: 0,
          y: -999,
          z: 0,
          fx: 0,
          fz: 1,
          boss: [],
          bossHp: 0,
          bossMax: 0,
          ack: 0,
          animT: 0,
          kills: 0,
        };
        (this.peers.set(e.id, t), this.bySlot.set(e.slot, t), this.known.set(e.id, new Map()));
      }
      this.onHide=()=>{
        if(this.ended || this.run.state==='over' || !this.room.inRun)return;
        saveProgress(this.run);
        this.suspended=true;
        this.room.send({op:'background',party:this.party});
      };
      this.onShow=()=>{
        if(this.suspended && !this.ended && this.room.open)
          this.room.end('正在同步离开期间的房间进度');
      };
      window.addEventListener('pagehide',this.onHide);
      window.addEventListener('pageshow',this.onShow);
      ((this.room.inRun = !0),
        (this.room.ev = {
          monsters: frame => this.monsters?.frame(frame),
          bossMove: frame=>this.monsters?.receiveBossMove(frame),
          ctl: (e, t) => this.onCtl(e, t),
          snap: (id, bytes, offset) => this.onSnap(id, bytes, offset),
          link: (e, t) => this.onLink(e, t),
          closed: reason => {
            if(!this.suspended)saveProgress(this.run);
            if ((this.room.returning || (this.room.startGate?.done && !this.room.startGate.error)) && !this.ended && this.run.state !== 'over') {
              if(this.room.onInterrupted){this.room.onInterrupted(reason);return;}
              this.run.ui.toast(reason, null);
              this.run.endHow = 'disconnect';
              void this.run.finish(false);
            }
          },
        }));
    }
    get spawnMul() {
      return yb[this.size] ?? 1;
    }
    get hpMul() {
      return bb[this.size] ?? 1;
    }
    get bossHpMul() {
      return xb(this.size) / this.hpMul;
    }
    get live() {
      let e = 1;
      for (let t of this.peers.values()) !t.gone && t.link === `open` && e++;
      return e;
    }
    get inputBlocked() {
      let e = this.run.state;
      return e === `modal` || e === `paused`;
    }
    get isHost() {
      for (let e of this.peers.values()) if (!e.gone && e.link === `open` && e.slot < this.mySlot) return !1;
      return !0;
    }
    get bossAuthority() {
      return this.bossAuth === this.mySlot;
    }
    isBossMirror(e) {
      return this.bossShared && e >= 0 && this.bossStage === this.run.stage && this.run.boss.live(e);
    }
    isProxy(e) {
      return (this.run.enemies.flags[e] & R.Remote) !== 0;
    }
    *active() {
      for (let e of this.peers.values())
        !e.gone && e.last && e.stage === this.run.stage && this.run.realTime - e.lastAt < 12 && (yield e);
    }
    *visiblePeers() {
      for (const peer of this.active())
        if (peer.link === 'open' && !(peer.last.flags & FT.out) && this.run.realTime - peer.lastAt < 4) yield peer;
    }
    tick(e) {
      let t = this.run;
      if (this.ended) return;
      this.monsters?.publish();
      for (let e of this.peers.values()) e.link = this.room.linkState(e.id);
      let n = this.portalWant;
      if (
        (n &&
          t.realTime - n.t > aE &&
          ((this.portalWant = null), t.interactables.spawnPortal(n.x, n.z, n.sanct)),
        this.interpPeers(),
        this.inputBlocked
          ? ((this.modalT += e),
            this.modalT < 8 && !t.player.dead && (t.player.iframes = Math.max(t.player.iframes, 0.12)))
          : (this.modalT = 0),
        this.pendingBoss && t.state === `play` && !t.bossSpawned)
      ) {
        let e = this.pendingBoss;
        ((this.pendingBoss = null), (this.remoteCall = !0));
        try {
          (this.wakeAltars(), t.spawnBoss(e.x, e.z, e.summonMode));
          if(this.resumeBoss && t.boss.alive){
            const saved=this.resumeBoss,index=t.boss.bossIndex;
            if(Number.isFinite(saved.hp) && saved.hp>0 && Number.isFinite(saved.maxHp) && saved.maxHp>0){
              t.enemies.maxHp[index]=saved.maxHp;
              t.enemies.hp[index]=Math.min(saved.hp,saved.maxHp);
            }
            this.resumeBoss=null;
          }
        } finally {
          this.remoteCall = !1;
        }
      } else this.pendingBoss && t.bossSpawned && (this.pendingBoss = null);
      if (
        ((this.sendT += e),
        this.sendT >= 1 / GT && ((this.sendT = Math.min(this.sendT - 1 / GT, 1 / GT)), this.sendSnapshots()),
        this.flushHits(),
        this.flushWants(),
        this.deaths.length && (this.broadcast({ t: `dead`, l: this.deaths }), (this.deaths = [])),
        (this.shareT -= e) <= 0 && ((this.shareT = nE), this.xpAcc > 0))
      ) {
        let e = t.player.pos;
        (this.broadcast({
          t: `xp`,
          x: Math.round(e.x),
          z: Math.round(e.z),
          v: Math.round(this.xpAcc * 100) / 100,
        }),
          (this.xpAcc = 0));
      }
      ((this.killsT -= e) <= 0 &&
        ((this.killsT = 1),
        t.stats.kills !== this.killsSent &&
          ((this.killsSent = t.stats.kills), this.broadcast({ t: `k`, n: t.stats.kills }))),
        this.bossTick(e),
        this.downedTick(e),
        this.portalTick(e));
      for (let e = this.marks.length - 1; e >= 0; e--)
        this.marks[e].t < t.realTime && this.marks.splice(e, 1);
      if(t.realTime>=this.nextCleanup){this.dropStale();this.nextCleanup=t.realTime+.25;}
      if(this.room.open && t.state!=='transition' && t.realTime>=this.nextCheckpoint){
        this.nextCheckpoint=t.realTime+5;saveProgress(t);
      }
      let r = t.player.pos,
        i = this.targets;
      ((i.length = 0), t.player.dead || i.push(r.x, r.z));
      for (let e of this.active())
        !(e.last.flags & (FT.downed | FT.out)) && e.link === `open` && i.push(e.x, e.z);
    }
    myFlags() {
      let e = this.run,
        t = e.player,
        n = 0;
      return (
        t.dead && !this.out && (n |= FT.downed),
        this.out && (n |= FT.out),
        this.inputBlocked && this.modalT < 8 && (n |= FT.bubble),
        t.iframes > 0 && !t.dead && (n |= FT.blink),
        e.shinySkin && (n |= FT.shiny),
        e.spectralSkin && (n |= FT.spectral),
        this.portalReady && (n |= FT.portal),
        (t.attackT > 0 || t.ultPoseT > 0) && (n |= FT.attack),
        n
      );
    }
    sendSnapshots() {
      let e = this.run,
        t = e.player,
        n = e.enemies,
        r = [...this.peers.values()].filter((e) => !e.gone && e.link === `open`);
      if (!r.length || e.state === `transition`) return;
      let i = e.lastAim,
        a = t.dead || t.hurtT > 0 ? 3 : +(t.speedNow > 0.6),
        o = {
          x: t.pos.x,
          y: t.pos.y,
          z: t.pos.z,
          aimX: i.x,
          aimZ: i.z,
          face: VT(t.facing.x, t.facing.y),
          anim: a,
          species: t.speciesId,
          hp: t.hp / Math.max(1, t.maxHp),
          level: t.level,
          flags: this.myFlags(),
          revive: this.reviveK / 3,
          bleed: this.bleed,
          hpNow: Math.max(0, t.hp),
          bonus: t.shield+t.overheal,
          maxHp: t.maxHp,
          focus: this.out && this.spec ? { x: this.spec.x, z: this.spec.z } : null,
        },
        s = null,
        c = e.boss.bossIndex;
      if (this.bossAuthority && this.isBossMirror(c) && n.alive[c] && (!this.monsters || e.realTime >= (this.nextBossVitals || 0))) {
        this.nextBossVitals=e.realTime+.25;
        const acks=Array.from(this.bdAcks);
        s = {
          x: n.x[c],
          y: n.y[c],
          z: n.z[c],
          face: VT(n.fx[c], n.fz[c]),
          anim: +(n.atkAnim[c] > 0),
          hp: Math.max(0, n.hp[c]),
          maxHp: n.maxHp[c],
          acks,
        };
      }
      this.writer.begin(dE() - this.clock0, o, s, e.stage);
      let l = e.realTime;
      if(this.monsters){
        this.snapshotIds.length=0;
        const packet=this.writer.finish(this.snapshotIds,this);
        for(const peer of r)this.room.mesh.sendSnap(peer.id,packet);
        return;
      }
      for (let t of r) {
        const ids = this.snapshotIds;
        ids.length = 0;
        const known = this.known.get(t.id);
        if (t.last && t.stage === e.stage) {
          let i = t.last.focus,
            a = i ? i.x : t.x,
            o = i ? i.z : t.z;
          n.within(a, o, qT, ids);
          let count = 0;
          for (const id of ids) {
            const flags = n.flags[id];
            if (flags & lE || n.parked(id) ||
                (flags & R.Capture && id === e.capture.index && e.capture.state !== 'roaming')) continue;
            ids[count++] = id;
          }
          ids.length = count;
          if (count > KT) {
            const distance = this.snapshotDistances;
            for (const id of ids) distance[id] = (n.x[id] - a) ** 2 + (n.z[id] - o) ** 2;
            ids.sort((lhs, rhs) => distance[lhs] - distance[rhs]);
            ids.length = KT;
          }
        }
        let a = [];
        for (const t of ids) {
          const key = IT(t, n.gen[t]);
          if (!known.has(key)) {
            a.push(
              key,
              n.species[t],
              n.flags[t] & cE,
              Math.round(n.maxHp[t]),
              Math.round(n.dmg[t] * 100) / 100,
              Math.round(n.scale[t] * 100) / 100,
              Math.round(n.x[t] * 10) / 10,
              Math.round(n.y[t] * 10) / 10,
              Math.round(n.z[t] * 10) / 10,
            );
          }
          known.set(key, l);
        }
        for (let e = 0; e < a.length; e += 1080)
          this.room.mesh.sendCtl(t.id, { t: `en`, l: a.slice(e, e + 1080) });
        known.forEach((seen, key) => { if (l - seen > tE) known.delete(key); });
        this.room.mesh.sendSnap(t.id, this.writer.finish(ids, this, r.length > 1 && t === r[0]));
      }
    }
    stBits(e) {
      let t = this.run.enemies;
      return (
        (t.burn[e] > 0 ? PT.burn : 0) |
        (t.poison[e] > 0 ? PT.poison : 0) |
        (t.para[e] > 0 ? PT.para : 0) |
        (t.frozen[e] > 0 ? PT.frozen : 0) |
        (t.sleep[e] > 0 ? PT.sleep : 0) |
        (t.wet[e] > 0 ? PT.wet : 0) |
        (t.curse[e] > 0 ? PT.curse : 0) |
        (t.chill[e] > 0 || t.root[e] > 0 ? PT.slow : 0)
      );
    }
    onSnap(e, t, offset) {
      let n = this.peers.get(e);
      if (!n || n.gone) return;
      let r = WT(t, offset);
      if (!r) return;
      if (!acceptPeerSample(n,{ts:r.ts,x:r.player.x,y:r.player.y,z:r.player.z,face:r.player.face},r.stage,dE())) return;
      n.last = r.player;
      n.lastAt = this.run.realTime;
      n.receivedAt=dE();
      n.stage = r.stage;
      if (r.player.species) n.species = r.player.species;
      if (r.stage === this.run.stage && this.run.state !== `transition`) {
        if (r.boss) this.onBossSnap(n,r);
        this.applyEnemies(n,r);
      }
    }
    renderTs(e) {
      return dE() - e.off - e.delay;
    }
    static lerpK(e, t, n) {
      return n > t ? Math.max(0, Math.min(1 + $T / (n - t), (e - t) / (n - t))) : 1;
    }
    interpPeers() {
      const now=dE();
      for(const peer of this.peers.values()){
        advancePeerMotion(peer,now,this.run.drawDt ?? this.run.realDt);
        peer.proxyRenderTime = now - peer.off - peer.delay;
      }
    }
    applyEnemies(e, t) {
      let n = this.run,
        r = n.enemies,
        i = n.realTime;
      const view = t.view;
      for (let pos = t.enemyStart; pos < t.enemyEnd; pos += zT) {
        const key = view.getUint16(pos, true);
        let a = (e.slot << 12) | LT(key),
          o = this.proxies.get(a);
        if (o === void 0 || this.pKey[o] !== key || !r.alive[o]) {
          let t = this.wantAt.get(a);
          if (t === void 0) this.wantAt.set(a, i);
          else if (i - t > 0.4) {
            this.wantAt.set(a, i + 0.6);
            let t = this.wants.get(e.slot);
            (t || this.wants.set(e.slot, (t = [])), t.push(key));
          }
          continue;
        }
        this.pushPos(o, t.ts, view.getInt16(pos+2,true)/20, view.getInt16(pos+6,true)/20, view.getInt16(pos+4,true)/20);
        this.pSeen[o] = i;
        const facingAnim = view.getUint8(pos+10), facing = facingAnim >> 3;
        this.pAnim[o] = facingAnim & 7;
        r.fx[o] = enemyFacingX[facing];
        r.fz[o] = enemyFacingZ[facing];
        if (this.pAnim[o] === 1 && r.atkAnim[o] <= 0) r.atkAnim[o] = 0.35;
        let c = Math.max(1, view.getUint8(pos+8) / 255 * r.maxHp[o]);
        r.hp[o] = i - this.pHit[o] < 0.35 ? Math.min(r.hp[o], c) : c;
        let l = view.getUint8(pos+9),
          u = 0.3;
        ((r.burn[o] = l & PT.burn ? u : 0),
          (r.poison[o] = l & PT.poison ? u : 0),
          (r.para[o] = l & PT.para ? u : 0),
          (r.frozen[o] = l & PT.frozen ? u : 0),
          (r.sleep[o] = l & PT.sleep ? u : 0),
          (r.wet[o] = l & PT.wet ? u : 0),
          (r.curse[o] = l & PT.curse ? u : 0),
          (r.chill[o] = l & PT.slow ? 1 : 0));
      }
    }
    onDescriptors(e, t) {
      let n = this.run,
        r = n.enemies,
        i = n.realTime;
      if (e.stage === n.stage && n.state !== `transition`)
        for (let n = 0; n + 8 < t.length; n += 9) {
          let a = t[n] | 0,
            o = t[n + 1] | 0,
            s = t[n + 2] | 0,
            c = +t[n + 3],
            l = +t[n + 4],
            u = +t[n + 5],
            d = +t[n + 6],
            f = +t[n + 7],
            p = +t[n + 8];
          if (!k.byId.has(o) || ![c, l, u, d, f, p].every(Number.isFinite)) continue;
          let m = (e.slot << 12) | LT(a),
            h = this.proxies.get(m);
          if (
            (h !== void 0 &&
              (this.pKey[h] !== a || !r.alive[h]) &&
              (r.alive[h] && r.flags[h] & R.Remote && r.kill(h), this.unmap(h), (h = void 0)),
            h === void 0)
          ) {
            if (((h = r.spawnProxy(o, d, f, p, (s & cE) | R.Remote, u)), h < 0)) return;
            (this.proxies.set(m, h),
              this.wantAt.delete(m),
              (this.pSlot[h] = e.slot),
              (this.pKey[h] = a),
              (this.pHit[h] = -99),
              (this.pN[h] = 0),
              this.pushPos(h, 0, d, f, p));
          }
          ((r.maxHp[h] = Math.max(1, c)),
            (r.hp[h] > r.maxHp[h] || r.hp[h] <= 0) && (r.hp[h] = r.maxHp[h]),
            (r.dmg[h] = l),
            (this.pSeen[h] = i));
        }
    }
    unmap(e) {
      let t = this.pSlot[e];
      if (t >= 0) {
        let n = (t << 12) | LT(this.pKey[e]);
        this.proxies.get(n) === e && this.proxies.delete(n);
      }
      this.pSlot[e] = -1;
    }
    dropStale() {
      let e = this.run.enemies,
        t = this.run.realTime;
      for (let n of this.proxies.values())
        !e.alive[n] || !(e.flags[n] & R.Remote)
          ? this.unmap(n)
          : e.dying[n] > 0 ||
            (((!this.monsters?.ownsProxy(n) && t - this.pSeen[n] > eE) || this.bySlot.get(this.pSlot[n])?.gone) && (e.kill(n), this.unmap(n)));
    }
    pushPos(e, t, n, r, i) {
      let a = e * QT,
        o = this.pHead[e];
      (this.pN[e] && this.pT[a + o] > 0
        ? ((o = (o + 1) % QT), (this.pN[e] = Math.min(QT, this.pN[e] + 1)))
        : (this.pN[e] = 1),
        (this.pT[a + o] = t),
        (this.pX[a + o] = n),
        (this.pY[a + o] = r),
        (this.pZ[a + o] = i),
        (this.pHead[e] = o));
    }
    placeProxy(t) {
      let n = this.run.enemies,
        r = this.bySlot.get(this.pSlot[t]);
      if (!r || !this.pN[t]) return;
      let i = t * QT,
        a = this.pN[t],
        o = this.pHead[t],
        s = r.proxyRenderTime,
        c = o,
        l = o;
      for (let e = 1; e < a && ((l = (o + QT - e) % QT), (c = (l + 1) % QT), !(this.pT[i + l] <= s)); e++);
      let u = i + l,
        d = i + c,
        f = e.lerpK(s, this.pT[u], this.pT[d]);
      ((n.x[t] = this.pX[u] + (this.pX[d] - this.pX[u]) * f),
        (n.y[t] = this.pY[u] + (this.pY[d] - this.pY[u]) * f),
        (n.z[t] = this.pZ[u] + (this.pZ[d] - this.pZ[u]) * f),
        (n.vx[t] = n.vz[t] = n.kx[t] = n.kz[t] = 0),
        this.pAnim[t] !== 2 && (n.anim[t] += this.run.realDt * 1.6));
    }
    hitProxy(e, t) {
      let n = this.pSlot[e];
      if (n < 0 || !(t > 0)) return;
      this.pHit[e] = this.run.realTime;
      let r = this.hits.get(n);
      r || this.hits.set(n, (r = new Map()));
      let i = r.get(this.pKey[e]);
      i ? ((i[0] += t), (i[2] = Math.max(i[2], t))) : r.set(this.pKey[e], [t, 0, t]);
    }
    statusProxy(e, t, n) {
      let r = this.pSlot[e],
        i = uE.indexOf(t);
      if (r < 0 || i < 0) return;
      let a = this.hits.get(r);
      a || this.hits.set(r, (a = new Map()));
      let o = a.get(this.pKey[e]);
      o ? ((o[1] |= 1 << i), (o[2] = Math.max(o[2], n))) : a.set(this.pKey[e], [0, 1 << i, n]);
    }
    flushWants() {
      for (let [e, t] of this.wants) {
        let n = this.bySlot.get(e);
        n && !n.gone && t.length && this.room.mesh.sendCtl(n.id, { t: `want`, l: t.slice(0, 400) });
      }
      (this.wants.clear(), this.wantAt.size > 4e3 && this.wantAt.clear());
    }
    flushHits() {
      for (let [e, t] of this.hits) {
        if (!t.size) continue;
        let n = this.bySlot.get(e);
        if (n && !n.gone) {
          let e = [];
          for (let [n, [r, i, a]] of t) e.push(n, Math.round(r * 10) / 10, i, Math.round(a * 10) / 10);
          this.room.mesh.sendCtl(n.id, { t: `hit`, l: e });
        }
        t.clear();
      }
    }
    onHits(e, t) {
      let n = this.run,
        r = n.enemies;
      for (let i = 0; i + 3 < t.length; i += 4) {
        let a = t[i] | 0,
          o = LT(a),
          s = +t[i + 1],
          c = t[i + 2] | 0,
          l = +t[i + 3];
        if (
          o >= r.n ||
          !r.alive[o] ||
          r.dying[o] > 0 ||
          (r.gen[o] & 15) !== RT(a) ||
          r.flags[o] & lE ||
          !(s >= 0) ||
          !(l >= 0)
        )
          continue;
        let u = [];
        for (let e = 0; e < uE.length; e++) c & (1 << e) && u.push(uE[e]);
        n.combat.remoteHit(o, Math.min(s, 1e30), u, l, e.x, e.z, e.slot);
      }
    }
    onDeath(e, t) {
      let n = this.run.enemies;
      n.flags[e] & lE ||
        this.deaths.push(
          IT(e, n.gen[e]),
          t,
          n.species[e],
          n.flags[e] & cE,
          Math.round(n.x[e] * 10) / 10,
          Math.round(n.y[e] * 10) / 10,
          Math.round(n.z[e] * 10) / 10,
          Math.round(n.xp[e] * 100) / 100,
        );
    }
    onDeaths(e, t) {
      let n = this.run,
        r = n.enemies;
      for (let i = 0; i + 7 < t.length; i += 8) {
        let a = t[i] | 0,
          o = t[i + 1] | 0,
          s = t[i + 2] | 0,
          c = t[i + 3] | 0,
          l = +t[i + 4],
          u = +t[i + 5],
          d = +t[i + 6],
          f = +t[i + 7],
          p = this.proxies.get((e.slot << 12) | LT(a)),
          m = p !== void 0 && this.pKey[p] === a && r.alive[p] && r.flags[p] & R.Remote ? p : -1;
        (o === this.mySlot &&
          e.stage === n.stage &&
          k.byId.has(s) &&
          [l, u, d, f].every(Number.isFinite) &&
          n.combat.creditRemote(m, s, c, l, u, d, f),
          m >= 0 && ((r.dying[m] = 0.35), (r.hp[m] = 0), this.unmap(m)));
      }
    }
    shareXp(e) {
      e > 0 && Number.isFinite(e) && (this.xpAcc += e);
    }
    onShare(e, t, n, r) {
      let i = this.run.player;
      i && !i.dead &&
        e.stage === this.run.stage &&
        r > 0 &&
        Number.isFinite(r) &&
        ((i.pos.x - t) ** 2 + (i.pos.z - n) ** 2 > 900 || i.addXp(Math.min(r, 1e9) * Sb));
    }
    bossCalled(e, t, summonMode) {
      let n = this.run;
      (this.remoteCall ||
        ((this.bossAuth =
          this.bossAuth >= 0 && this.bossStage === n.stage
            ? Math.min(this.bossAuth, this.mySlot)
            : this.mySlot),
        this.broadcast({
          t: `boss`,
          summonMode,
          st: n.stage,
          x: Math.round(e * 10) / 10,
          z: Math.round(t * 10) / 10,
          a: this.mySlot,
        })),
        (this.bossShared = !0),
        (this.bossStage = n.stage),
        (this.bossDownOk = !1),
        (this.bdPending = []),
        (this.bdAcc = 0),
        this.bdAcks.clear());
    }
    onBossCall(e, t, n, r, i, summonMode) {
      let a = this.run;
      t === a.stage &&
        Number.isFinite(n + r) &&
        ((this.bossAuth = this.bossAuth >= 0 && this.bossStage === t ? Math.min(this.bossAuth, i) : i),
        (this.bossStage = t),
        a.bossSpawned || ((this.pendingBoss = { x: n, z: r, summonMode: summonMode === 'auto' ? 'auto' : 'manual' }), this.wakeAltars()));
    }
    placePortal(e, t, n) {
      let r = this.run;
      if (
        !this.bossShared ||
        this.bossAuthority ||
        this.bossAuth < 0 ||
        this.bySlot.get(this.bossAuth)?.gone
      ) {
        let i = r.interactables.spawnPortal(e, t, n);
        this.bossShared &&
          this.broadcast({
            t: `pat`,
            st: r.stage,
            x: Math.round(i.x * 100) / 100,
            z: Math.round(i.z * 100) / 100,
          });
        return;
      }
      let i = this.portalAt;
      i && i.st === r.stage
        ? ((this.portalAt = null), r.interactables.spawnPortal(i.x, i.z, n, !0))
        : (this.portalWant = { sanct: n, x: e, z: t, t: r.realTime });
    }
    onPortalAt(e, t, n) {
      let r = this.run;
      if (e !== r.stage || !Number.isFinite(t + n)) return;
      let i = this.portalWant;
      i
        ? ((this.portalWant = null), r.interactables.spawnPortal(t, n, i.sanct, !0))
        : (this.portalAt = { st: e, x: t, z: n });
    }
    wakeAltars() {
      for (let e of this.run.interactables.list) (e.kind === `boss` || e.kind === `shrine`) && (e.used = !0);
    }
    hitBoss(e) {
      e > 0 && Number.isFinite(e) && (this.bdAcc += e);
    }
    onBossSnap(e, t) {
      let n = t.boss;
      if (e.slot === this.bossAuth) {
        (e.boss.push({ ts: t.ts, x: n.x, y: n.y, z: n.z, face: n.face }),
          e.boss.length > 12 && e.boss.shift(),
          (e.bossHp = n.hp),
          (e.bossMax = n.maxHp));
        for (let [t, r] of n.acks) t === this.mySlot && (e.ack = r);
        this.bdPending = this.bdPending.filter((t) => t.seq > e.ack);
      }
    }
    bossTick(e) {
      let t = this.run,
        n = t.enemies,
        r = t.boss.bossIndex;
      if (
        this.isBossMirror(r) &&
        n.alive[r] &&
        !this.bossAuthority &&
        (this.bdT -= e) <= 0 &&
        this.bdAcc > 0
      ) {
        this.bdT = rE;
        let e = this.bySlot.get(this.bossAuth);
        if (e && !e.gone) {
          let t = ++this.bdSeq;
          (this.bdPending.push({ seq: t, d: this.bdAcc }),
            this.room.mesh.sendCtl(e.id, { t: `bd`, s: t, d: this.bdAcc }));
        }
        this.bdAcc = 0;
      }
    }
    bossNearest(e, t) {
      if(this.monsters?.bossPose){
        const slot=this.monsters.bossPose.target,mine=slot===this.mySlot;
        const p=mine?this.run.player.pos:this.bySlot.get(slot);
        if(p)return {x:p.x,z:p.z,mine,d2:(p.x-e)**2+(p.z-t)**2};
        return {x:e,z:t,mine:false,d2:Infinity};
      }
      let n = this.run.player.pos,
        r = this.run.player.dead ? 1 / 0 : (n.x - e) ** 2 + (n.z - t) ** 2,
        i = n.x,
        a = n.z,
        o = !this.run.player.dead;
      for (let n of this.active()) {
        if (n.link !== `open` || n.last.flags & (FT.downed | FT.out)) continue;
        let s = (n.x - e) ** 2 + (n.z - t) ** 2;
        s < r && ((r = s), (i = n.x), (a = n.z), (o = !1));
      }
      return { x: i, z: a, d2: r, mine: o };
    }
    focus(e, t) {
      let n = this.bossNearest(e, t);
      return { x: n.x, z: n.z };
    }
    bossTargetsMe(e) {
      if (!this.bossShared) return !0;
      let t = this.run.enemies;
      return this.bossNearest(t.x[e], t.z[e]).mine;
    }
    bossEngages(e) {
      let t = this.run.player;
      if (!this.bossShared) return !0;
      if (t.dead) return !1;
      let n = this.run.enemies;
      return (
        this.bossNearest(n.x[e], n.z[e]).mine || (t.pos.x - n.x[e]) ** 2 + (t.pos.z - n.z[e]) ** 2 <= 1296
      );
    }
    afterEnemies() {
      let t = this.run,
        n = t.enemies,
        r = t.boss.bossIndex;
      if (!this.isBossMirror(r) || !n.alive[r] || this.bossAuthority || this.bossDownOk) return;
      let i = this.bySlot.get(this.bossAuth);
      if (!i || !i.boss.length) return;
      let a = this.renderTs(i),
        o = i.boss,
        s = o[0],
        c = o[Math.min(1, o.length - 1)];
      for (let e = o.length - 1; e > 0; e--)
        if (o[e - 1].ts <= a) {
          ((s = o[e - 1]), (c = o[e]));
          break;
        }
      let l = e.lerpK(a, s.ts, c.ts);
      if (
        ((this.monsters || ((n.x[r] = s.x + (c.x - s.x) * l),
        (n.y[r] = s.y + (c.y - s.y) * l),
        (n.z[r] = s.z + (c.z - s.z) * l))),
        i.bossMax > 0)
      ) {
        n.maxHp[r] = i.bossMax;
        let e = this.bdAcc;
        for (let t of this.bdPending) e += t.d;
        ((n.hp[r] = Math.max(1, Math.min(n.maxHp[r], i.bossHp - e))), t.boss.kit?.clampHp());
      }
    }
    onBossDamage(e, t, n) {
      let r = this.run,
        i = r.enemies,
        a = r.boss.bossIndex;
      t > (this.bdAcks.get(e.slot) ?? 0) &&
        (this.bdAcks.set(e.slot, t),
        this.bossAuthority &&
          this.isBossMirror(a) &&
          i.isAlive(a) &&
          n > 0 &&
          Number.isFinite(n) &&
          (r.boss.immune ||
            ((i.hp[a] -= Math.min(n, 1e30)),
            (i.flash[a] = Math.max(i.flash[a], 0.6)),
            r.boss.kit?.clampHp(),
            i.hp[a] <= 0 && r.combat.killEnemy(a, {}))));
    }
    bossDefeated() {
      let e = this.run.enemies,
        t = this.run.boss.bossIndex;
      (this.bossAuthority &&
        this.broadcast({
          t: `bdown`,
          st: this.run.stage,
          x: t >= 0 ? Math.round(e.x[t] * 10) / 10 : NaN,
          z: t >= 0 ? Math.round(e.z[t] * 10) / 10 : NaN,
        }),
        (this.bossDownOk = !0));
    }
    onBossDown(e, t, n) {
      let r = this.run,
        i = r.enemies,
        a = r.boss.bossIndex;
      e === r.stage &&
        this.isBossMirror(a) &&
        i.alive[a] &&
        !this.bossDownOk &&
        ((this.bossDownOk = !0),
        Number.isFinite(t) &&
          Number.isFinite(n) &&
          ((i.x[a] = t), (i.z[a] = n), (i.y[a] = r.terrain.height(t, n))),
        (i.hp[a] = 0),
        r.combat.killEnemy(a, {}));
    }
    reassignBoss() {
      let e = this.mySlot;
      for (let t of this.peers.values()) !t.gone && t.link === `open` && t.slot < e && (e = t.slot);
      e !== this.bossAuth && ((this.bossAuth = e), (this.bdPending = []), (this.bdAcc = 0));
    }
    onDowned() {
      let e = this.run;
      ((this.bleed = 30),
        (this.reviveK = 0),
        (this.out = !1),
        e.audio.defeat(),
        e.ui.banner(
          c(`¡Te han debilitado!`),
          '等待队友在身边停留 3 秒',
          `#ff5a6a`,
          { species: e.player.speciesId },
        ),
        this.broadcast({ t: `down` }));
    }
    get teamKills() {
      let e = this.run.stats.kills;
      for (let t of this.peers.values()) e += t.kills;
      return e;
    }
    downedNear() {
      let e = this.run.player.pos,
        t = null,
        n = Cb * Cb;
      for (let r of this.visiblePeers()) {
        if (!(r.last.flags & FT.downed)) continue;
        let i = (r.x - e.x) ** 2 + (r.z - e.z) ** 2;
        i < n && ((n = i), (t = r));
      }
      return t;
    }
    get lifting() {
      let e = this.liftPeer;
      return e && e.last && e.last.flags & FT.downed ? e : null;
    }
    downedTick(e) {
      let t = this.run,
        n = t.player;
      const now=dE(),previous=this.liftedBy;
      this.liftPeer=!n.dead?this.downedNear():null;
      if (((this.liftedBy = null), n.dead && !this.out)) {
        let r = Cb;
        for (let e of this.active())
          if (
            (e===previous || !this.liftedBy) &&
            !(e.last.flags & (FT.downed | FT.out)) && e.link==='open' &&
            now-e.receivedAt<4 &&
            (e.last.x - n.pos.x) ** 2 + (e.last.z - n.pos.z) ** 2 < r * r
          ) {
            this.liftedBy = e;
            if(e===previous)break;
          }
        let i = this.liftedBy;
        if(previous!==i)this.rescueStarted=now;
        this.reviveK=i ? Math.max(0,i.receivedAt-this.rescueStarted) : 0;
        if (i && this.reviveK >= 3) {
          ((this.liftedBy = null), this.revive(c(`¡{name} te ha reanimado!`, { name: i.name }), i.slot));
          return;
        }
        (i || (this.bleed -= e),
          this.bleed <= 0 &&
            ((this.out = !0),
            (this.bleed = 0),
            (this.reviveK = 0),
            t.ui.banner(
              c(`Fuera de combate`),
              c(`Vuelves en la siguiente zona si tu equipo llega`),
              `#9aa0b4`,
            )));
      }
      let r = !n.dead;
      for (let e of this.active()) e.last.flags & (FT.downed | FT.out) || (r = !0);
      // An offline/away teammate has not been defeated. Keep the seat available
      // for recovery instead of broadcasting a team loss on their behalf.
      if(this.room.others.some(member=>{
        const peer=this.peers.get(member.id);
        return member.offline || member.away || !peer?.last || peer.gone || t.realTime-peer.lastAt>=12;
      }))r=true;
      ((this.wipeT = r ? 0 : this.wipeT + e), this.wipeT > oE && this.isHost && this.end(!1));
    }
    revive(e, t = -1) {
      let n = this.run,
        r = n.player;
      if(t>=0)this.rescueCompleteUntil=dE()+0.45;
      ((r.dead = !1),
        (r.hp = Math.max(r.hp, r.maxHp * wb)),
        (r.iframes = Math.max(r.iframes, 2.5)),
        (this.bleed = 0),
        (this.reviveK = 0),
        (this.out = !1),
        (this.liftedBy = null),
        e &&
          (n.audio.levelUp(),
          n.vfx.ring(r.pos.x, r.pos.y, r.pos.z, 4, 8060826, 0.5),
          n.vfx.burst(r.pos.x, r.pos.y + 1, r.pos.z, 8060826, 20, 5, I.Heart, 0.5, 0.7),
          n.ui.banner(e, c(`Vuelves con la mitad de tus PS`), `#7aff9a`, { species: r.speciesId })),
        this.broadcast({ t: `up`, by: t }));
    }
    enterPortal() {
      if (this.advancing) return !0;
      let e = this.run;
      return (
        this.portalReady
          ? this.portalInfo.wait.length &&
            e.ui.toast(c(`Seguimos esperando a {names}`, { names: this.portalInfo.wait.join(`, `) }), null)
          : ((this.portalReady = !0),
            e.audio.power(),
            e.ui.toast(c(`Estás en el portal: esperando a tu equipo`), null),
            this.broadcast({ t: `portal`, st: e.stage, on: 1 })),
        !1
      );
    }
    portalTick(e) {
      let t = this.run,
        n = t.player,
        r = this.portalInfo;
      if (this.advancing) return;
      if (this.portalReady) {
        let e = !1;
        for (let r of t.interactables.list)
          if (r.kind === `portal` && Math.hypot(r.x - n.pos.x, r.z - n.pos.z) < 9) {
            e = !0;
            break;
          }
        (n.dead || !e) &&
          ((this.portalReady = !1),
          n.dead || t.ui.toast(c(`Has salido del portal: tu equipo ya no cuenta contigo dentro`), null),
          this.broadcast({ t: `portal`, st: t.stage, on: 0 }));
      }
      let i = 0,
        a = 0,
        o = [];
      n.dead || (a++, this.portalReady ? i++ : o.push(c(`tú`)));
      for (let e of this.active())
        e.link !== `open` ||
          e.last.flags & (FT.downed | FT.out) ||
          (a++, e.last.flags & FT.portal ? i++ : o.push(e.name));
      ((r.inside = i),
        (r.need = a),
        (r.wait = o),
        this.isHost &&
          t.stageCleared &&
          i &&
          !o.length &&
          (this.broadcast({ t: `go`, st: t.stage }), this.go(t.stage)));
    }
    get inPortal() {
      return this.portalReady;
    }
    go(e) {
      let t = this.run;
      if (this.advancing || e !== t.stage) return;
      this.advancing = !0;
      let n = t.stage >= 4 || (t.stage >= 3 && !t.biome.sanctuary);
      t.coopAdvance(n).finally(() => {
        this.advancing = !1;
      });
    }
    onStage() {
      this.monsters?.reset();
      (this.proxies.clear(), this.pSlot.fill(-1));
      for (let e of this.known.values()) e.clear();
      for (let e of this.peers.values()) ((e.boss = []), (e.bossHp = e.bossMax = 0));
      (this.hits.clear(),
        (this.deaths = []),
        this.wants.clear(),
        this.wantAt.clear(),
        (this.wipeT = 0),
        (this.portalReady = !1),
        (this.portalInfo = { inside: 0, need: 0, wait: [] }),
        (this.bossShared = !1),
        (this.bossAuth = -1),
        (this.nextBossVitals = 0),
        (this.bossDownOk = !1),
        (this.pendingBoss = null),
        (this.bdPending = []),
        (this.bdAcc = 0),
        this.bdAcks.clear(),
        (this.portalAt = null),
        (this.portalWant = null),
        this.run.player.dead && this.revive(null));
      const call=this.loadingBossCall;
      this.loadingBossCall=null;
      if(call)this.onBossCall(null,call.st,call.x,call.z,call.a,call.summonMode);
    }
    end(e) {
      this.ended || (this.broadcast({ t: `end`, v: +!!e }), this.finishRun(e));
    }
    finishRun(e) {
      let t = this.run;
      this.ended ||
        ((this.ended = !0),
        e
          ? t.finish(!0)
          : ((t.state = `dead`), (t.timeScale = 0.25), t.audio.defeat(), t.later(0.6, () => t.finish(!1))));
    }
    onFinish() {
      forgetSeat(this.room.me);
      (this.ended || ((this.ended = !0), this.broadcast({ t: `bye` })),
        void this.room.leave());
    }
    captureFound(e) {
      this.broadcast({ t: `cap`, st: this.run.stage, sp: e });
    }
    captureWeak(e, t, n, r, i, a) {
      this.broadcast({
        t: `capw`,
        st: this.run.stage,
        sp: e,
        fam: t,
        md: n === `shiny` ? `shiny` : `league`,
        sh: +!!r,
        x: Math.round(i * 10) / 10,
        z: Math.round(a * 10) / 10,
      });
    }
    onCaptureWeak(e, t) {
      let n = this.run,
        r = n.enemies;
      if (e.stage === n.stage && (t.st | 0) === n.stage && n.state !== `transition` && +t.sp > 0) {
        for (let t of [...this.proxies.values()])
          this.pSlot[t] === e.slot &&
            r.alive[t] &&
            r.flags[t] & R.Remote &&
            r.flags[t] & R.Capture &&
            (r.kill(t), this.unmap(t));
        n.capture.coopWeak(t.sp | 0, t.fam | 0, String(t.md), !!t.sh, +t.x, +t.z) &&
          n.ui.toast(
            c(`¡{name} ha debilitado a un Pokémon salvaje! Captúralo tú también`, { name: e.name }),
            null,
          );
      }
    }
    altarCrew(e, t, n) {
      let r = 0,
        i = (n + 0.6) * (n + 0.6);
      for (let n of this.active())
        n.link === `open` &&
          !(n.last.flags & (FT.downed | FT.out)) &&
          (n.x - e) ** 2 + (n.z - t) ** 2 < i &&
          r++;
      return r;
    }
    altarDone(e, t) {
      this.broadcast({
        t: `alt`,
        st: this.run.stage,
        x: Math.round(e * 10) / 10,
        z: Math.round(t * 10) / 10,
      });
    }
    onAltarDone(e, t) {
      let n = this.run;
      if (e.stage !== n.stage || (t.st | 0) !== n.stage || !Number.isFinite(+t.x + +t.z)) return;
      let r = n.interactables.list.filter((e) => e.kind === `altar` && e.used).length;
      (n.interactables.coopAltarDone(+t.x, +t.z),
        n.interactables.list.filter((e) => e.kind === `altar` && e.used).length > r &&
          n.ui.toast(
            c(`¡{name} ha completado un altar! Su bendición es para todos`, { name: e.name }),
            null,
          ));
    }
    onCtl(e, t) {
      let n = this.peers.get(e);
      if (!n || !t || typeof t.t != `string`) return;
      let r = this.run;
      switch (t.t) {
        case 'stick-input': {
          if (n.gone || t.stage !== r.stage) break;
          if (n.inputStage !== t.stage || !n.stickFrames) {
            n.inputStage=t.stage;
            n.stickFrames=new StickFrameStream(gameStick);
          }
          n.stickFrames.receive(t.frames);
          break;
        }
        case 'resume-query': {
          if(!r.player || r.buildingStage || r.state==='transition' || this.ended)return;
          this.room.mesh.sendCtl(e,{t:'resume-world',...worldProgress(r)});
          break;
        }
        case `en`:
          Array.isArray(t.l) && this.onDescriptors(n, t.l);
          break;
        case `want`:
          if (Array.isArray(t.l)) {
            let n = this.known.get(e);
            for (let e of t.l.slice(0, 400)) n?.delete(e | 0);
          }
          break;
        case `hit`:
          Array.isArray(t.l) && this.onHits(n, t.l);
          break;
        case `dead`:
          Array.isArray(t.l) && this.onDeaths(n, t.l);
          break;
        case `xp`:
          this.onShare(n, +t.x, +t.z, +t.v);
          break;
        case `boss`:
          // A faster seat can reach the clock while this seat is loading the desk.
          if(t.st===4 && ((this.advancing && r.stage===2) || (r.stage===4 && r.buildingStage))){
            if(!this.loadingBossCall || t.a<this.loadingBossCall.a)this.loadingBossCall=t;
            break;
          }
          this.onBossCall(n, t.st | 0, +t.x, +t.z, t.a | 0, t.summonMode);
          break;
        case `bd`:
          this.onBossDamage(n, t.s | 0, +t.d);
          break;
        case `pat`:
          this.onPortalAt(t.st | 0, +t.x, +t.z);
          break;
        case `bdown`:
          this.onBossDown(t.st | 0, t.x == null ? NaN : +t.x, t.z == null ? NaN : +t.z);
          break;
        case `go`:
          this.go(t.st | 0);
          break;
        case `end`:
          this.ended || this.finishRun(!!t.v);
          break;
        case `bye`:
          (this.peerGone(n), r.ui.toast(c(`{name} ha dejado la partida`, { name: n.name }), null));
          break;
        case `down`:
          r.ui.toast(
            n.name+' 已倒地，靠近并停留 3 秒可救起',
            null,
          );
          break;

        case `k`:
          n.kills = Math.max(n.kills, Math.max(0, t.n | 0));
          break;
        case `up`:
          if(t.by===this.mySlot)this.rescueCompleteUntil=dE()+0.45;
          t.by === this.mySlot
            ? (r.audio.levelUp(),
              r.vfx.burst(n.x, n.y + 1, n.z, 8060826, 16, 5, I.Heart, 0.5, 0.7),
              r.ui.toast(c(`¡Has reanimado a {name}!`, { name: n.name }), null))
            : typeof t.by == `number` &&
              t.by >= 0 &&
              r.ui.toast(c(`{name} vuelve a estar en pie`, { name: n.name }), null);
          break;
        case `cap`:
          n.stage === r.stage &&
            k.byId.has(t.sp | 0) &&
            r.ui.toast(
              c(`{name} ha encontrado a {pokemon}: ayúdale a debilitarlo y podréis capturarlo todos`, {
                name: n.name,
                pokemon: enemySpeciesWord(t.sp | 0),
              }),
              null,
            );
          break;
        case `capw`:
          this.onCaptureWeak(n, t);
          break;
        case `alt`:
          this.onAltarDone(n, t);
          break;
        case `portal`:
          t.on !== 0 &&
            !this.portalReady &&
            n.stage === r.stage &&
            r.ui.toast(
              c(`{name} ha entrado en el portal: ve con él para pasar de zona`, { name: n.name }),
              null,
            );
          break;
        case `fx`:
          this.castFx(n, t);
          break;
        case `ult`:
          this.ultFx(n, t);
          break;
        case `mark`:
          Number.isFinite(+t.x + +t.z) && this.addMark(n.slot, +t.x, +t.z, n.name);
          break;
        default:
          globalThis.__pbCoop && __pbCoop.receive && __pbCoop.receive(t, e);
      }
    }
    onLink(e, t) {
      let n = this.peers.get(e);
      if(n && t==='open'){
        this.peerGone(n);
        n.stickFrames=null;
        Object.assign(n,{gone:false,link:t,last:null,lastAt:-99,stage:0,buf:[],boss:[],ack:0});
        this.known.get(n.id).clear();
        this.bdAcks.delete(n.slot);
        return;
      }
      n &&
        ((n.link = t),
        (t === `closed` || t === `failed`) &&
          (n.gone || this.run.ui.toast(n.name+'暂离，当前对局继续，等待队友返回', null),
          this.peerGone(n)));
    }
    peerGone(e) {
      if (e.gone) return;
      e.gone = !0;
      this.monsters?.dropPeer(e.slot);
      let t = this.run.enemies;
      for (let n of [...this.proxies.values()])
        this.pSlot[n] === e.slot && (t.alive[n] && t.flags[n] & R.Remote && t.kill(n), this.unmap(n));
      (this.hits.delete(e.slot), this.bossAuth === e.slot && this.reassignBoss());
    }
    castPosition() {
      const {x,y,z}=this.run.player.pos;
      return [x,y,z].map(value=>Math.round(value*20)/20);
    }
    effectOrigin(peer,event) {
      if(Array.isArray(event.pos) && event.pos.length===3 && event.pos.every(Number.isFinite))
        return {x:event.pos[0],y:event.pos[1],z:event.pos[2]};
      return peer.last && peer.stage===this.run.stage ? peer : null;
    }
    cast(e, t, n, move) {
      let r = this.run.lastAim;
      this.broadcast({
        t: `fx`,
        k: e,
        ty: t,
        move,
        pos: this.castPosition(),
        st: this.run.stage,
        r: Math.round(n * 10) / 10,
        ax: Math.round(r.x * 100) / 100,
        az: Math.round(r.z * 100) / 100,
      });
    }
    ult(name, duration) {
      this.broadcast({ t: `ult`, n: name, duration, st: this.run.stage, pos:this.castPosition() });
    }
    castFx(e, t) {
      let n = this.run;
      if ((t.st ?? e.stage) !== n.stage || e.gone) return;
      if (typeof t.move === 'string') {
        e.castName = t.move.slice(0, 40);
        e.castUntil = n.realTime + 1.2;
        e.castStage = n.stage;
      }
      const origin=this.effectOrigin(e,t);
      if (!origin || !n.sprites.visible(origin.x, origin.y + 1, origin.z, 8)) return;
      let r = typeof t.ty == `string` && t.ty in Ni ? t.ty : `normal`,
        i = Ni[r],
        a = Math.max(0.5, Math.min(12, +t.r || 2)),
        o = Number.isFinite(+t.ax) ? +t.ax : e.last?.aimX ?? e.fx,
        s = Number.isFinite(+t.az) ? +t.az : e.last?.aimZ ?? e.fz,
        c = Math.hypot(o, s);
      c < 0.05 ? ((o = e.fx), (s = e.fz)) : ((o /= c), (s /= c));
      let l = origin.x,
        u = origin.y + 0.9,
        d = origin.z,
        f = n.vfx;
      switch (t.k) {
        case `shot`:
          (f.beams.spawn(l + o * 0.9, u, d + s * 0.9, l + o * 4.2, u, d + s * 4.2, 0.12, i, 0.2, 0.4),
            f.add.spawn({
              x: l + o,
              y: u,
              z: d + s,
              vx: o * 16,
              vy: 0,
              vz: s * 16,
              life: 0.35,
              size: 0.34,
              endSize: 0.12,
              color: i,
              shape: am(r),
              glow: 0.15,
            }));
          break;
        case `slash`: {
          let e = Math.min(a, 5) * 0.7,
            t = Math.atan2(s, o),
            n = Math.random() < 0.5 ? 1 : -1,
            r = 0,
            c = 0;
          for (let a = 0; a <= 5; a++) {
            let o = t + n * (-1 + (a / 5) * 2),
              s = l + Math.cos(o) * e,
              p = d + Math.sin(o) * e;
            (a > 0 && f.beams.spawn(r, u, c, s, u, p, 0.16, i, 0.18, 0.4), (r = s), (c = p));
          }
          break;
        }
        case `ring`:
          f.rings.spawn(l, origin.y + 0.15, d, a * 0.2, Math.min(a, 10), i, 0.4, Hl(i), 0.2, 0.4);
          break;
        default:
          f.rings.spawn(l, origin.y + 0.15, d, Math.min(a, 6) * 0.5, Math.min(a, 6), i, 0.3, L.Plain, 0.16, 0.28);
      }
    }
    ultFx(e, t) {
      let n = this.run;
      if ((t.st ?? e.stage) !== n.stage || e.gone) return;
      e.ultName = typeof t.n === 'string' ? t.n.slice(0, 40) : '';
      e.ultUntil = n.realTime + Math.min(30, Math.max(1.2, Number(t.duration) || 0));
      e.ultStage = n.stage;
      let r = Ni[k.get(e.species)?.types[0] ?? `normal`] ?? 16777215;
      const origin=this.effectOrigin(e,t);
      if(origin){
        n.vfx.ring(origin.x,origin.y,origin.z,12,r,0.6);
        n.vfx.ring(origin.x,origin.y,origin.z,7,16777215,0.45);
        n.vfx.flash(origin.x,origin.y+1,origin.z,r,10,0.25);
      }
      n.ui.toast(
          c(`¡{name} lanza su Ultimate: {move}!`, {
            name: e.name,
            move: typeof t.n == `string` ? t.n.slice(0, 40) : ``,
          }),
          null,
        );
    }
    mark() {
      let e = this.run,
        t = e.player.pos,
        n = e.lastAim,
        r = Math.round((t.x + n.x * 8) * 10) / 10,
        i = Math.round((t.z + n.z * 8) * 10) / 10;
      (this.addMark(this.mySlot, r, i, null), this.broadcast({ t: `mark`, x: r, z: i }));
    }
    addMark(e, t, n, r) {
      let i = this.run;
      (this.marks.push({ x: t, z: n, t: i.realTime + 8, slot: e }),
        this.marks.length > 8 && this.marks.shift());
      let a = i.terrain.height(t, n);
      (i.vfx.ring(t, a + 0.1, n, 2.5, 16765498, 0.8),
        i.vfx.ring(t, a + 0.1, n, 1.2, 16777215, 0.6),
        i.vfx.beams.spawn(t, a, n, t, a + 9, n, 0.35, 16765498, 1.2, 0.6),
        r && (i.ui.toast(c(`{name} marca un sitio`, { name: r }), null), i.audio.click()));
    }
    render() {
      let e = this.run;
      for (let t of this.visiblePeers()) {
        let n = t.last;
        if (n.flags & FT.out) continue;
        let r = t.skin === `classic` || t.skin === `m1` || t.skin === `m2` ? t.skin : null,
          a = !!(n.flags & FT.downed),
          o = n.anim === 1,
          s = a || n.anim === 3 ? `hurt` : n.flags & FT.attack ? `attack` : o ? `walk` : `idle`;
        const frame=e.sprites.heroFrame(t,t.species,a?'faint':n.anim===3?undefined:o?'walk':'idle',e.realTime*1000);
        const id=Xl(t.species,r),i=frame?e.sprites.getAnimatedHeroGlyph(id,frame):e.sprites.get(id);
        t.animT += e.realDt * (o ? 1.4 : 0.8);
        let c = e.sprites.dirRow(t.fx, t.fz),
          l = n.flags & FT.blink && Math.floor(e.realTime * 20) % 2 == 0,
          u = n.flags & FT.shiny ? Zc(t.species, !0) : 3,
          d = n.flags & FT.spectral;
        (i.push(
          t.x,
          t.y,
          t.z,
          s,
          a ? 1 : s === `attack` ? 0.5 : t.animT,
          c,
          frame?.renderScale ?? 1,
          l ? 0.5 : 0,
          0,
          u,
          0,
          d ? 0.82 : 1,
          d ? 0.66 : 1,
          d ? 1.35 : 1,
          d ? 0.68 : 0,
          a || s === `attack`,
          r ? Yl(t.member, r) : 0,
          frame?.rect,
        ),
          r && !a && eu(e.vfx.add, t.member, r, t.x, t.y, t.z, e.realDt, i.bodyHeight()));
        let f = e.terrain.surface(t.x, t.z);
        if (
          (e.sprites.shadows.push(t.x, f, t.z, 1.4),
          e.vfx.ground.spawn({
            x: t.x,
            y: f + 0.08,
            z: t.z,
            life: 0.03,
            size: 2.1,
            endSize: 2.1,
            color: a ? 16734826 : 8060826,
            shape: 3,
            glow: 0,
            rot: 0,
          }),
          n.flags & FT.bubble &&
            e.vfx.ground.spawn({
              x: t.x,
              y: f + 0.1,
              z: t.z,
              life: 0.03,
              size: 3.2,
              endSize: 3.2,
              color: 10148095,
              shape: 3,
              glow: 0.4,
              rot: 0,
            }),
          a)
        ) {
          let n = Cb * 2 * (0.94 + 0.06 * Math.sin(e.realTime * 5));
          e.vfx.ground.spawn({
            x: t.x,
            y: f + 0.1,
            z: t.z,
            life: 0.03,
            size: n,
            endSize: n,
            color: 16734826,
            shape: 3,
            glow: 0.5,
            rot: 0,
          });
        }
        a &&
          n.revive > 0 &&
          e.vfx.ground.spawn({
            x: t.x,
            y: f + 0.12,
            z: t.z,
            life: 0.03,
            size: Cb * 2 * n.revive + 0.4,
            endSize: Cb * 2 * n.revive + 0.4,
            color: 8060826,
            shape: I.Soft,
            glow: 0.5,
            rot: 0,
          });
      }
    }
    camFocus() {
      if (!this.out) return ((this.spec = null), null);
      let e = [];
      for (let t of this.active()) !(t.last.flags & (FT.downed | FT.out)) && t.link === `open` && e.push(t);
      if (!e.length) return ((this.spec = null), null);
      let t = this.spec ? e.indexOf(this.spec) : -1;
      return (
        this.run.input.hit(`Space`) && e.length > 1 && (t = (t + 1) % e.length),
        (this.spec = e[Math.max(0, t)]),
        this.tmpV.set(this.spec.x, this.spec.y, this.spec.z)
      );
    }
    broadcast(e) {
      this.room.mesh.broadcast(e);
    }
    dispose() {
      window.removeEventListener('pagehide',this.onHide);
      window.removeEventListener('pageshow',this.onShow);
      ((this.ended = !0), this.room.open && (forgetSeat(this.room.me),this.broadcast({ t: `bye` }), this.room.leave()));
    }
  },
  pE = new Ei(16777215),
  mE = 0.7,
  hE = [
    [`damage`, `mul`, 0.02, (e) => c(`+{v} % de daño`, { v: n(e * 100, 1) })],
    [`maxHp`, `mul`, 0.03, (e) => c(`+{v} % de PS máx.`, { v: n(e * 100, 1) })],
    [`attackSpeed`, `mul`, 0.015, (e) => c(`+{v} % de velocidad de ataque`, { v: n(e * 100, 1) })],
    [`area`, `mul`, 0.015, (e) => c(`+{v} % de área`, { v: n(e * 100, 1) })],
    [`critChance`, `add`, 0.005, (e) => c(`+{v} % de probabilidad de crítico`, { v: n(e * 100, 2) })],
    [`luck`, `add`, 2, (e) => c(`+{v} de suerte`, { v: n(e, 1) })],
    [`armor`, `add`, 1, (e) => c(`+{v} de armadura`, { v: n(e, 1) })],
  ],
  gE = 25,
  _E = 3,
  vE = 0.22,
  yE = 1400,
  xE =
    `maxHp.regen.armor.evasion.shieldMax.lifesteal.healing.thorns.damage.physical.special.attackSpeed.projectiles.area.duration.projSpeed.critChance.critDamage.statusChance.statusDamage.eliteDamage.superEffective.moveSpeed.pickupRange.xpGain.gold.luck.extraJumps.jumpHeight.megaCrit.overheal.powerup.eliteSpawn.slam`.split(
      `.`,
    );

export {
  fE,
  pE,
  mE,
  hE,
  gE,
  _E,
  vE,
  yE,
  xE,
  dE
};
