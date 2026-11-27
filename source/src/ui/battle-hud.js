import {choiceQuality as itemOfferQuality} from "./choice-presentation.js";
import {
  itemOffer,
  shopOffer,
  shopAmount,
  shopShelves,
  fullParty,
  showReviewFusion,
  showReviewCompanion,
  styleReviewDialog
} from "./battle-review-ui.js";
import {gourdIcon} from "../combat/capture-gourd.js";
import {facilityNames} from "../data/active-content.js";
import {SINGLE_STAGE, FOREST_ROUTE, FOREST_COMBAT_ZONES, remainingZoneSeconds, enemyDifficultyText} from "../data/lite-rules.js";
import {enemySpeciesWord} from "../data/character-rules.js";
import {runPlan, planIncludes} from "../combat/battle-plan.js";
import {bossDistanceText, buildingMapName, drawCompassDial, drawAltarProgress, sideGuidePosition} from "./paper-hud-art.js";
import {weatherMark, weatherStyle} from "./weather-presentation.js";
import {glyphPreview} from "../actors/zixing-glyphs.js";
import {EVOLUTION_REVEAL} from "../effects/upgrade-effects.js";
import {chineseMessage as t, chineseText as c} from "../data/chinese-text.js";
import {Br as v, Er as te, Mn as Oe, Nr as Ne, Or as Le, Rn as qe, _n as wt, h as Zt, jr as sn, mr as yn, pr as An} from "../data/config.js";
import {ht as ti} from "../vendor/three-DmSYIDKK.js";
import {typeColors as Ni, gameData as k} from "../data/game-database.js";
import {qi, Xi, ta, ia, Da, Pa, La, Ga, uo, Zo, Qo} from "./controls.js";
import {gameAudio as N} from "../combat/game-audio.js";
import {Ys, Xs, Zs, P} from "../effects/scene-renderer.js";
import {comboFaces, ComboRoller, EffectiveCallout} from "../effects/battle-particles.js";
import {nf, rf, _f, R} from "../combat/enemy-population.js";
import {km, jm, Nm} from "../combat/field-effects.js";
import {g_, O_, $_} from "../combat/skills.js";

import {Wb, Xb, Zb, fusionRequiredLevel} from "../combat/upgrade-offers.js";
import {PS, BS} from "../world/facilities.js";
import {createElement as X, YC, XC, ZC, Z, QC, Q, tw, rw, aw, $, ow, bw, GC} from "./game-elements.js";
import {zw, $w} from "../combat/encounters.js";
import {BattleRun as wE} from "../combat/run.js";
import {TouchControls as ME} from "../virtual-stick/touch-controls.js";
import {RE, xD, ED, PD, LD, RD, nO, sO, cO, lO} from "./move-details.js";
import {PN, facilityMapArt, cI, dI, fI, pI, mI, hI, _I, vI, bI, xI, SI, DI, kI, AI, jI, MI, NI, PI, FI, II, LI, RI, BI, VI, HI} from "./game-menus.js";

var JI = class {
    root;
    hudEl;
    modalEl = null;
    els = {};
    minimap;
    mm;
    toastsEl;
    promptEl;
    fadeEl;
    releaseEl;
    reticle;
    arrow;
    markTag;
    marks = [];
    pins = [];
    markTerrain = null;
    peekEl = null;
    crosshair;
    lastSlots = ``;
    touch;
    promptText = null;
    offPad = () => {};
    hpLag = 1;
    lagHold = 0;
    lagT = 0;
    fitT = 0;
    bossLag = 1;
    bossLagHold = 0;
    minis = [];
    bossSt = new kI();
    minisEl;
    lastItems = ``;
    v = new ti();
    coopHud = null;
    pauseBack = null;
    constructor(e) {
      ((this.root = X(`div`, { class: `passthru`, style: { position: `absolute`, inset: `0` } })),
        (this.hudEl = X(`div`, { id: `hud` })));
      let t = this.els;
      ((t.portrait = X(`div`, { class: `tl-portrait` })),
        (t.xp = X(`div`, { class: `tl-ring` }, X(`em`))),
        (t.lvl = X(`div`, { class: `tl-lvl` }, X(`small`, {}, c(`Nv`)), X(`b`, {}, `1`))),
        (t.name = X(`b`, { class: `tl-name` })),
        (t.types = X(`div`, { class: `tl-types` })),
        (t.lives = X(`span`, { class: `tl-lives`, style: { display: `none` } })),
        (t.evo = X(`div`, { class: `tl-evo` })));
      let n = X(
        `div`,
        { class: `hud-tl` },
        X(`div`, { class: `tl-medal` }, t.xp, t.portrait, t.lvl),
        X(`div`, { class: `tl-plate` }, X(`div`, { class: `tl-head` }, t.name, t.types, t.lives), t.evo),
      );
      ((t.party = X(`div`, { class: `hud-party` })),
        (t.hp = X(`div`, { class: `bar hpbar` }, X(`i`), X(`s`), X(`b`), X(`u`), X(`em`))),
        (t.pw = X(`div`, { class: `pw-row` })),
        (t.under = X(`div`, { class: `under` }, t.hp, t.pw)),
        (t.timer = X(`div`, { class: `timer` }, `0:00`)),
        (t.biome = X(`b`, { class: `ht-biome` })),
        (t.pips = X(`div`, { class: `ht-pips` })),
        (t.zone = X(`span`, { class: `ht-zone` })),
        (t.tier = X(`span`, { class: `ht-tier` })),
        (t.weather = X(`span`, { class: `ht-weather` })),
        (t.pacts = X(`span`, { class: `ht-pacts`, style: { display: `none` } })),
        (t.clock = X(`div`, { class: `runclock` }, X(`b`, {}, `0:00.0`), X(`small`))),
        (t.danger = X(
          `div`,
          { class: `danger` },
          X(`b`),
          X(`div`, { class: `dg-seg` }, ...FI.map(() => X(`i`, {}, X(`em`)))),
        )),
        (t.gold = X(
          `div`,
          { class: `wallet`, title: c(`Tus Pokédólares y el precio de la siguiente Poké Ball`) },
          Q(`nugget`),
          X(`b`),
          X(`span`, { class: `wl-ball` }, Q(`poke-ball`), X(`em`)),
        )));
      let r = X(
        `div`,
        { class: `hud-top` },
        X(
          `div`,
          { class: `ht-l` },
          t.biome,
          X(`div`, { class: `ht-row` }, t.pips, t.zone, t.tier, t.weather, t.pacts),
        ),
        X(`div`, { class: `ht-c` }, t.timer, t.danger, t.gold),
        X(`div`, { class: `ht-r` }, t.clock),
      );
      ((t.left = X(`div`, { class: `leftpill`, style: { display: `none` } })),
        (this.minimap = X(`canvas`, { class: `minimap`, width: `400`, height: `400` })),
        (this.mm = this.minimap.getContext(`2d`)),
        this.minimap.addEventListener(`click`, () => {
          uo && this.runRef?.openMap();
        }),
        (t.kills = X(`div`, { class: `counter` }, Q(`poke-ball`), X(`span`))),
        (t.goal = X(
          `div`,
          { class: `kgoal` },
          X(`div`, { class: `kg-head` }, X(`b`), X(`span`)),
          X(
            `div`,
            { class: `kg-main` },
            X(`div`, { class: `kg-pt` }),
            X(`div`, { class: `kg-body` }, X(`small`), X(`b`, { class: `kg-name` })),
            X(`div`, { class: `kg-left` }, X(`span`, {}, c(`Te faltan`)), X(`strong`), X(`span`)),
          ),
          X(`div`, { class: `kgoal-bar` }, X(`i`)),
          X(`div`, { class: `kg-next` }),
        )),
        (t.event = X(`div`, { class: `evpill`, style: { display: `none` } }, X(`b`), X(`span`))),
        (t.mile = X(
          `div`,
          { class: `milepill`, style: { display: `none` } },
          X(`span`, { class: `mp-pt` }),
          X(`div`, { class: `mp-tx` }, X(`small`), X(`b`)),
        )),
        (t.shop = X(
          `div`,
          { class: `evpill shop`, style: { display: `none`, "--c": `#ffd23a` } },
          X(`b`, {}, c(`Meowth de visita`)),
          X(`span`),
        )),
        (t.comet = X(
          `div`,
          { class: `evpill`, style: { display: `none`, "--c": `#4aa8ff` } },
          X(`b`, {}, c(`Fragmento de cometa`)),
          X(`span`),
        )),
        (t.migr = X(
          `div`,
          { class: `evpill`, style: { display: `none`, "--c": `#9a6aff` } },
          X(`b`, {}, c(`Portal de migración`)),
          X(`span`),
        )),
        (t.siege = X(
          `div`,
          { class: `evpill siege`, style: { display: `none`, "--c": `#ff4a3a` } },
          X(`b`, {}, c(`¡Asedio! Muévete`)),
          X(`span`),
        )));
      let i = X(
        `div`,
        { class: `hud-tr` },
        this.minimap,
        t.left,
        X(`div`, { class: `counters` }, t.kills),
        t.goal,
        t.mile,
        t.event,
        t.shop,
        t.comet,
        t.migr,
        t.siege,
      );
      ((t.slots = X(`div`, { class: `slots` })), (t.vits = X(`div`, { class: `slots` })));
      let a = X(`kbd`, { "data-nokbd": `1` }, Da ? Pa(`R`) : ta(`ult`)),
        o = () => {
          a.textContent = Da ? Pa(`R`) : ta(`ult`);
        },
        s = La(o);
      (qi(o),
        (this.offPad = s),
        (t.ult = X(
          `div`,
          { class: `ult` },
          X(`div`, { class: `ult-ring` }),
          X(`div`, { class: `ult-core` }),
          a,
          X(`div`, { class: `ult-nm` }),
        )));
      let l = X(`div`, { class: `hud-bl` }, t.vits, X(`div`, { class: `bl-row` }, t.slots, t.ult));
      ((t.items = X(`div`, { class: `hud-br` })),
        (t.bossPt = X(`div`, { class: `bb-pt` })),
        (t.bossName = X(`b`, { class: `bb-name` })),
        (t.bossTag = X(`span`, { class: `bb-tag` })),
        (t.bossRage = X(`span`, { class: `bb-rage` }, c(`¡Furia!`))),
        (t.bossBar = X(
          `div`,
          { class: `bb-bar` },
          X(`u`),
          X(`i`),
          X(`s`, { style: { left: `66.6%` } }),
          X(`s`, { style: { left: `33.3%` } }),
          X(`b`),
        )),
        (t.bossSub = X(`div`, { class: `bb-sub` })),
        (t.bossFoot = X(`div`, { class: `bb-foot` }, t.bossSub, this.bossSt.el)),
        (t.boss = X(
          `div`,
          { class: `bossbar`, style: { display: `none` } },
          t.bossPt,
          X(
            `div`,
            { class: `bb-body` },
            X(`div`, { class: `bb-head` }, t.bossName, t.bossTag, t.bossRage),
            t.bossBar,
            t.bossFoot,
          ),
        )),
        (this.minisEl = X(`div`, { class: `minibars` })));
      for (let e = 0; e < 2; e++) {
        let e = {
          pt: X(`div`, { class: `bb-pt` }),
          name: X(`b`, { class: `bb-name` }),
          tag: X(`span`, { class: `bb-tag` }),
          rage: X(`span`, { class: `bb-rage` }, c(`¡Furia!`)),
          bar: X(`div`, { class: `bb-bar` }, X(`u`), X(`i`), X(`b`)),
          sub: X(`div`, { class: `bb-sub` }),
          st: new kI(),
          key: ``,
          lag: 1,
          hold: 0,
        };
        ((e.foot = X(`div`, { class: `bb-foot` }, e.sub, e.st.el)),
          (e.el = X(
            `div`,
            { class: `bossbar mini`, style: { display: `none` } },
            e.pt,
            X(
              `div`,
              { class: `bb-body` },
              X(`div`, { class: `bb-head` }, e.name, e.tag, e.rage),
              e.bar,
              e.foot,
            ),
          )),
          this.minisEl.append(e.el),
          this.minis.push(e));
      }
      ((t.fps = X(`div`, { class: `fps` })),
        (t.streak = X(
          `div`,
          { class: `streak`, hidden: true },
          X(`small`, {}, c(`RACHA`)),
          X(`b`, {}, `×0`),
          X(`i`, { role: 'progressbar', 'aria-label': '连击剩余时间', 'aria-valuemin': 0, 'aria-valuemax': wE.STREAK_WINDOW }, X(`u`)),
        )),
        (t.lowhp = X(`div`, { class: `lowhp`, style: { display: `none` } })),
        (t.lockHint = X(
          `div`,
          { class: `lock-hint`, style: { display: `none` } },
          c(`Haz clic para mover la cámara`),
        )),
        (t.autoRun = X(`div`, { class: `autorun-pill`, style: { display: `none` } })),
        (this.toastsEl = X(`div`, { class: `toasts` })),
        (this.promptEl = X(`div`, { class: `prompt`, style: { display: `none` } })),
        (this.releaseEl = X(
          `button`,
          { class: `pill release-ally`, style: { display: `none` } },
          X(`kbd`, { "data-nokbd": `1` }, `G`),
          c(`Soltar`),
        )),
        (this.reticle = X(`div`, { class: `reticle`, style: { display: `none` } })),
        (this.arrow = X(
          `div`,
          { class: `compass zx-compass`, style: { display: `none` } },
          Object.assign(X(`canvas`, { class: `zx-compass-dial`, 'data-static': 'true', 'aria-hidden': 'true' }), {width:128,height:128}),
          X(`span`, { class: `cp-ic` }),
          X(`b`, { class: `cp-d` }),
        )),
        (this.markTag = X(
          `div`,
          { class: `compass mktag`, style: { display: `none` } },
          X(`b`, { class: `cp-d` }),
        )),
        (this.crosshair = X(`div`, { class: `crosshair`, style: { display: `none` } })),
        (this.fadeEl = X(`div`, { class: `fade` })),
        this.root.append(this.hudEl),
        this.hudEl.append(
          t.lowhp,
          t.under,
          n,
          t.party,
          r,
          i,
          l,
          t.items,
          t.boss,
          this.minisEl,
          this.toastsEl,
          this.promptEl,
          this.releaseEl,
          this.reticle,
          this.arrow,
          this.markTag,
          this.crosshair,
          t.fps,
          t.streak,
          t.lockHint,
          t.autoRun,
        ));
      for (let e = 0; e < 3; e++) {
        let e = X(
          `div`,
          { class: `compass mkpin`, style: { display: `none`, "--rc": `#ffd23a` } },
          X(`i`, { class: `cp-tip` }),
          X(`span`, { class: `cp-ic` }),
          X(`b`, { class: `cp-d` }),
        );
        (this.pins.push(e), this.hudEl.append(e));
      }
      ((this.touch = new ME(this.root)), this.root.append(this.fadeEl));
      i.append(t.items);
      this.hudEl.append(t.streak);
      e.append(this.root);
    }
    destroy() {
      this.clearWorldNotices();
      (this.offPad(), this.touch.destroy(), this.coopHud?.destroy(), this.root.remove());
    }
    hs = 1;
    mi = 1;
    northUp = !1;
    look(e) {
      let t = this.hudEl.style,
        n = this.hudEl.classList;
      ((this.hs = Math.max(0.6, Math.min(1.3, e.hudScale ?? 1))),
        t.setProperty(`--hs`, String(this.hs)),
        t.setProperty(`--ho`, String(Math.max(0.3, Math.min(1, e.hudOpacity ?? 1)))),
        t.setProperty(`--bo`, String(Math.max(0.2, Math.min(1, e.bossBarOpacity ?? 1)))),
        (this.bigBanners = e.showBanners !== !1),
        (this.touch.fixed = !!e.fixedStick),
        this.touch.setScale(e.touchScale ?? 1),
        t.setProperty(`--mm`, String(Math.max(0.6, Math.min(2, e.mapScale ?? 1)))),
        (this.mi = Math.max(0.7, Math.min(2, e.mapIcons ?? 1))),
        (this.northUp = !!e.mapNorthUp),
        n.toggle(`no-minimap`, e.showMinimap === !1),
        n.toggle(`no-ladder`, e.showLadder === !1),
        n.toggle(`no-toasts`, e.showToasts === !1),
        n.toggle(`no-streak`, e.showStreak === !1),
        n.toggle(`no-items`, e.showItems === !1),
        (this.fitT = 0));
    }
    project(e, t, n, r) {
      const canvas = e.r.canvas.getBoundingClientRect();
      return (
        this.v.set(t, n, r).project(e.r.camera),
        {
          x: canvas.left + (this.v.x * 0.5 + 0.5) * canvas.width,
          y: canvas.top + (-this.v.y * 0.5 + 0.5) * canvas.height,
          vis: this.v.z >= -1 && this.v.z < 1,
        }
      );
    }
    runRef = null;
    floatText = !0;
    popups = new Set();
    effectivePopups = [];
    effectivePopup(x,y,z) {
      const run=this.runRef;
      if(!run||!this.floatText||this.popups.size>=BI||this.effectivePopups.length>=3)return;
      const point=this.project(run,x,y,z);
      if(!point.vis||point.x<0||point.x>innerWidth||point.y<0||point.y>innerHeight)return;
      // Repeated hits in one cluster share a readable notice instead of piling up.
      if(this.effectivePopups.some(item=>{
        const other=this.project(run,item.x,item.y,item.z);
        return Math.abs(other.x-point.x)<112&&Math.abs(other.y-point.y)<56;
      }))return;
      const callout=new EffectiveCallout(!!run.meta.profile.settings.reduceFlashes);
      Object.assign(callout,{x,y,z,start:run.realTime});
      this.effectivePopups.push(callout);this.popups.add(callout.canvas);
      (this.popupRoot||this.hudEl).append(callout.canvas);
      this.updateEffectivePopups(run);
    }
    updateEffectivePopups(run) {
      for(let i=this.effectivePopups.length-1;i>=0;i--){
        const callout=this.effectivePopups[i],age=run.realTime-callout.start,node=callout.canvas;
        if(age>=EffectiveCallout.duration||!this.floatText||run.player.dead||run.state!=='play'){
          node.remove();this.popups.delete(node);this.effectivePopups.splice(i,1);continue;
        }
        const point=this.project(run,callout.x,callout.y,callout.z);
        const visible=point.vis&&point.x>=0&&point.x<=innerWidth&&point.y>=0&&point.y<=innerHeight;
        node.style.display=visible?'block':'none';
        if(!visible)continue;
        // Lift the small caption above the enemy and leave the combo's painted area clear.
        let left=Math.max(6,Math.min(innerWidth-callout.width-6,point.x-callout.width/2));
        let top=Math.max(6,Math.min(innerHeight-callout.height-6,point.y-callout.height/2-36));
        const roller=this.comboRoller,ink=callout.inkBounds;
        if(this.stkOn&&roller?.inkBounds&&!this.hudEl.classList.contains('no-streak')){
          const box=roller.canvas.getBoundingClientRect(),bounds=roller.inkBounds;
          const sx=box.width/roller.canvas.width,sy=box.height/roller.canvas.height;
          const combo={left:box.left+bounds.left*sx,right:box.left+bounds.right*sx,
            top:box.top+bounds.top*sy,bottom:box.top+bounds.bottom*sy};
          if(left+ink.right>combo.left-8&&left+ink.left<combo.right+8&&
            top+ink.bottom>combo.top-8&&top+ink.top<combo.bottom+8){
            const beside=combo.left-8-ink.right;
            if(beside>=6)left=beside;
            else top=Math.max(6,combo.top-8-ink.bottom);
          }
        }
        left=Math.round(left);top=Math.round(top);
        const position=left+'/'+top;
        if(node.dataset.worldPosition!==position){
          node.style.left=left+'px';node.style.top=top+'px';node.dataset.worldPosition=position;
        }
        callout.paint(age);
      }
    }
    popup(e, t, n, r, i, a = 1) {
      if (!this.runRef || !this.floatText || !r || this.popups.size >= BI) return;
      const o = this.project(this.runRef, e, t, n), size = 22 * a;
      const halfWidth = String(r).length * size / 2 + 3, halfHeight = size * .7 + 3;
      if (!(o.vis && o.x >= halfWidth && o.x <= innerWidth - halfWidth &&
            o.y >= halfHeight && o.y <= innerHeight - halfHeight)) return;
      let s = X(
        `div`,
        { class: `popup`, style: { left: o.x + `px`, top: o.y + `px`, "--c": i, fontSize: size + `px` } },
        r,
      );
      (s.style.setProperty(`--c`, i),
        (this.popupRoot||this.hudEl).append(s),
        this.popups.add(s),
        setTimeout(() => {
          s.remove();
          this.popups.delete(s);
        }, 900));
    }
    streakHud(count, remaining, time=this.runRef?.realTime??performance.now()/1000) {
      const streak = this.els.streak;
      const visible = count >= 20 && remaining > 0;
      if (visible !== this.stkOn) {
        this.stkOn = visible;
        streak.hidden = !visible;
        this.stkN = this.stkBar = -1;
        this.comboRoller?.reset();
      }
      if (!visible) return;

      const number = streak.children[1];
      if(!this.comboRoller && streak.classList.contains('zx-combo'))this.comboRoller=new ComboRoller(number);
      if (count !== this.stkN) {
        // The first visible combo (20) starts at the original count-1 color.
        const colorCount = count - 19;
        const tier = colorCount >= 100 ? 4 : colorCount >= 50 ? 3 : colorCount >= 25 ? 2 : Number(colorCount >= 10);
        if (streak.dataset.tier !== String(tier)) {
          streak.dataset.tier = String(tier);
          streak.style.setProperty('--sc',comboFaces[tier][1]);
        }
        if(this.comboRoller)this.comboRoller.setCount(count,time);
        else{
          number.textContent = `×${count}`;
          const now = performance.now();
          if (this.stkN >= 0 && now - this.stkAt >= 120) {
            number.animate?.([{transform:'scale(1.45) rotate(-4deg)'}, {transform:'none'}], {duration:220, easing:'ease-out'});
            this.stkAt = now;
          }
        }
        this.stkN = count;
      }
      const progress = Math.min(1, Math.ceil(remaining / wE.STREAK_WINDOW * 48) / 48);
      this.comboRoller?.paint(Number(streak.dataset.tier),time,progress);
      if (progress !== this.stkBar) {
        this.stkBar = progress;
        streak.children[2].firstChild.style.transform = `scaleX(${progress})`;
        streak.children[2].setAttribute('aria-valuenow', String(progress * wE.STREAK_WINDOW));
        streak.style.setProperty('--streak-alpha', String(Math.min(1, progress * 2)));
      }
    }
    stkOn = !1;
    stkN = -1;
    stkAt = 0;
    stkBar = -1;
    trained(e) {
      if (this.hudEl.classList.contains(`no-toasts`)) return;
      let t = performance.now(),
        n = this.trainEl;
      (n?.isConnected
        ? (this.trainN++, n.classList.remove(`again`), n.offsetWidth, n.classList.add(`again`))
        : ((this.trainN = 1),
          (n = this.trainEl = X(`div`, { class: `train-chip` })),
          this.els.under.append(n)),
        n.replaceChildren(
          Z(`blessing`, 16),
          X(`b`, {}, c(`Entrenamiento`)),
          X(`span`, {}, e),
          ...(this.trainN > 1 ? [X(`em`, {}, `×${this.trainN}`)] : []),
        ),
        t - this.trainSoundAt > 2600 && ((this.trainSoundAt = t), N.power()),
        clearTimeout(this.trainTimer),
        (this.trainTimer = window.setTimeout(() => {
          (n.remove(), (this.trainEl = null));
        }, 2600)));
    }
    trainEl = null;
    trainN = 0;
    trainSoundAt = -1e9;
    trainTimer = 0;
    toastAt = 0;
    placeToasts() {
      let e = this.toastsEl;
      if (!e.firstChild) {
        e.style.top && (e.style.top = ``);
        return;
      }
      let t = performance.now();
      if (t - this.toastAt < 200) return;
      this.toastAt = t;
      let n = this.hudEl.getBoundingClientRect().top,
        r = 0;
      for (let e of [this.els.boss, this.minisEl]) {
        if (!e || e.style.display === `none`) continue;
        let t = e.getBoundingClientRect();
        t.height > 0 && (r = Math.max(r, t.bottom - n));
      }
      e.style.top = r > 0 ? `${Math.round(r + 8)}px` : ``;
    }
    toast(message, item, iconFile, weatherKind) {
      if (!message) return;
      const theme = weatherStyle(weatherKind);
      const tab = theme ? weatherMark(weatherKind) : X('i', {class: 'zx-note-tab', 'aria-hidden': 'true'});
      const notice = X('div', {class: 'toast'}, tab, X('span', {class: 'zx-note-text'}, message));
      if (theme) {
        notice.dataset.weather = weatherKind;
        notice.style.backgroundColor = theme[1];
        notice.style.borderLeftColor = theme[0];
      }
      this.toastsEl.append(notice);
      while (this.toastsEl.children.length > 4) this.toastsEl.firstChild.remove();
      if (item || iconFile) {
        const icon = Q(item, 'pix', iconFile);
        icon.hidden = true;
        icon.onerror = () => icon.remove();
        const reveal = () => {
          if (notice.isConnected && icon.naturalWidth > 0) {
            icon.hidden = false;
            tab.remove();
          }
        };
        icon.onload = reveal;
        notice.prepend(icon);
        if (icon.complete) reveal();
        else icon._loadImage?.();
      }
      setTimeout(() => {
        if (!notice.isConnected) return;
        notice.style.transition = 'opacity .4s';
        notice.style.opacity = '0';
        setTimeout(() => notice.remove(), 400);
      }, 2800);
    }
    bigBanners = !0;
    banner(e, t, n, r) {
      if (!this.bigBanners && !r?.shiny && !r?.classic) {
        this.toast(t ? `${e} · ${t}` : e, null);
        return;
      }
      this.hudEl.querySelectorAll(`.banner`).forEach((e) => e.remove());
      let i = r
          ? X(
              `div`,
              { class: `bn-pt` + (r.shiny ? ` shiny` : ``) + (r.classic ? ` classic` : ``) },
              r.glyph ? glyphPreview(r.species,.75,'pix',r.glyph) : ZI(r.species, r.shiny),
            )
          : null,
        a = X(
          `div`,
          { class: `banner` + (i ? ` has-pt` : ``) },
          X(
            `div`,
            { class: `bn-row` },
            i,
            X(`div`, { class: `bn-txt` }, X(`h1`, {}, e), t ? X(`p`, {}, t) : null),
          ),
        );
      (a.style.setProperty(`--c`, n),
        this.hudEl.append(a),
        (r?.shiny || r?.classic) && a.classList.add(`long`),
        r?.classic && a.classList.add(`classic`),
        setTimeout(() => a.remove(), r?.shiny || r?.classic ? 5200 : 3200));
    }
    shinyFlash(e = !1) {
      this.hudEl.querySelectorAll(`.shiny-flash`).forEach((e) => e.remove());
      let t = X(`div`, { class: `shiny-flash` + (e ? ` classic` : ``) });
      (this.hudEl.append(t), setTimeout(() => t.remove(), 1800));
    }
    reviveFlash() {
      this.hudEl.querySelectorAll(`.revive-flash`).forEach((e) => e.remove());
      let e = X(`div`, { class: `revive-flash` });
      (this.hudEl.append(e), setTimeout(() => e.remove(), 1600));
    }
    ultHud(e) {
      let t = e.ult,
        n = t.charge,
        r = t.ready,
        i = `${e.player.speciesId}|${t.form}|${t.def.type}`;
      for (let e of [this.els.ult, this.touch.ult])
        (e.dataset.k !== i &&
          ((e.dataset.k = i),
          e.style.setProperty(`--c`, YC(Ni[t.def.type])),
          $(e.children[1]).append(ZC(t.def.type, 34)),
          (e.children[3].textContent = t.name),
          (e.title = c(`{name} (Ultimate, tecla R)`, { name: t.name }))),
          e.firstChild.style.setProperty(`--p`, String(Math.round(n * 1e3) / 10)),
          e.classList.toggle(`ready`, r),
          e.classList.toggle(`active`, t.active > 0),
          e.classList.toggle(`deny`, t.denyT > 0));
    }
    ultCutIn(e, t, n) {
      this.hudEl.querySelectorAll(`.ultcut`).forEach((e) => e.remove());
      let r = X(
        `div`,
        { class: `ultcut` },
        X(`div`, { class: `uc-band` }),
        X(
          `div`,
          { class: `uc-row` },
          X(`div`, { class: `uc-pt` }, glyphPreview(e)),
          X(`div`, { class: `uc-txt` }, X(`small`, {}, c(`¡Ultimate!`)), X(`b`, {}, t)),
        ),
      );
      (r.style.setProperty(`--c`, YC(n)), (this.ultCutInRoot??this.hudEl).append(r), setTimeout(() => r.remove(), 1300));
    }
    capEl = null;
    captureStart(e, t, n, r = !1, word = enemySpeciesWord(e)) {
      this.capEl?.remove();
      let i = k.get(e),
        a = t ? `#ff9ae0` : YC(Ni[i.types[0]]);
      r && (n = !1);
      let o = n ? `master-ball` : `poke-ball`,
        s = X(
          `div`,
          { class: `capcine` + (r ? ` friend` : ``) },
          X(`div`, { class: `cap-vig` }),
          X(`div`, { class: `lb top` }),
          X(`div`, { class: `lb bottom` }),
          X(
            `div`,
            { class: `cap-plate` },
            X(`div`, { class: `cap-pt` + (t ? ` shiny` : ``) }, glyphPreview(e,.75,'pix',word)),
            X(
              `div`,
              { class: `cap-info` },
              X(
                `p`,
                {},
                n ? `宝葫芦，收！` : r ? `葫芦引灵！` : `葫芦，收！`,
              ),
              X(
                `h2`,
                {},
                word,
                t ? X(`i`, { class: `shiny-mark` }) : null,
                r ? X(`small`, { class: `cap-tag` }, c(`Alfa de apoyo · solo esta partida`)) : null,
              ),
              X(`div`, { class: `cap-pips` }, ...[0, 1, 2].map(() => X(`i`, {}, gourdIcon()))),
            ),
          ),
        );
      (s.style.setProperty(`--c`, a),
        (this.capEl = s),
        this.hudEl.classList.add(`capturing`),
        this.hudEl.append(s));
    }
    captureShake(e) {
      this.capEl?.querySelectorAll(`.cap-pips i`)[e - 1]?.classList.add(`on`);
    }
    captureResult(e) {
      let t = this.capEl?.querySelector(`.cap-plate`);
      t &&
        (t.classList.add(e ? `ok` : `fail`),
        (t.querySelector(`.cap-info p`).textContent = e ? `收服成功！` : `字灵挣脱了！`));
    }
    captureEnd() {
      let e = this.capEl;
      ((this.capEl = null),
        this.hudEl.classList.remove(`capturing`),
        e && (e.classList.add(`out`), setTimeout(() => e.remove(), 450)));
    }
    caught(e, t, n, r, i = !1, a, o = !1, s = !1) {
      let l = k.get(e),
        u = X(
          `div`,
          { class: `cap-reveal` + (o ? ` friend` : ``) + (s ? ` classic` : ``), style: { "--c": r } },
          X(`div`, { class: `evo-burst` }),
          X(
            `div`,
            { class: `evo-portrait` + (i ? ` shiny` : ``) },
            ZI(e, i),
            X(`span`, { class: `cap-stamp` }, Q(`poke-ball`)),
          ),
          X(
            `div`,
            { class: `evo-card` },
            X(
              `p`,
              {},
              c(
                s
                  ? `¡Variocolor clásico atrapado!`
                  : i
                    ? `¡Variocolor atrapado!`
                    : o
                      ? `¡Alfa de apoyo!`
                      : `¡Atrapado!`,
              ),
            ),
            X(`h1`, {}, t),
            X(`div`, { class: `row evo-types` }, ...l.types.map((e) => XC(e))),
            X(`div`, { class: `cap-sub` }, n),
            a
              ? X(
                  `div`,
                  { class: `cap-note` },
                  s ? Z(`shiny-classic`, 20) : i ? X(`i`, { class: `shiny-mark` }) : null,
                  a,
                )
              : null,
          ),
        );
      (u.style.setProperty(`--c`, r),
        this.hudEl.querySelectorAll(`.cap-reveal, .banner`).forEach((e) => e.remove()),
        this.hudEl.append(u),
        setTimeout(() => u.remove(), a ? 6e3 : 3600));
    }
    split(e, t, n, r) {
      this.hudEl.querySelectorAll(`.split-pop`).forEach((e) => e.remove());
      let i = X(
        `div`,
        { class: `split-pop` + (r == null ? `` : r < 0 ? ` ahead` : ` behind`) },
        X(`small`, {}, e.sanctuary ? `圣地终战` : c(`Zona {n}`, { n: t })),
        X(`b`, {}, Xs(n)),
        r == null ? X(`em`, {}, c(`Primer tiempo`)) : X(`em`, {}, Zs(r)),
      );
      (this.hudEl.append(i),
        r != null && r < 0 && N.power(),
        setTimeout(() => i.classList.add(`out`), 5200),
        setTimeout(() => i.remove(), 5800));
    }
    loading(total, readyCount, onProgress) {
      return window.__zixingApp.zixing.loading(total, readyCount, onProgress);
    }
    stageIntro(e) {
      if (e.tower) {
        let t = e.tower,
          n = X(
            `div`,
            { class: `stageintro tower` },
            X(
              `p`,
              {},
              t.roof
                ? c(`Torre Lavanda · Azotea`)
                : t.beyond
                  ? c(`Torre Lavanda · Más Allá`)
                  : c(`Torre Lavanda · {n}F de 7`, { n: t.floor }),
            ),
            X(
              `h1`,
              {},
              t.roof ? c(`¡La Torre es tuya!`) : t.beyond ? c(`Piso {n}`, { n: t.floor }) : t.def.name,
            ),
          );
        (this.hudEl.append(n), setTimeout(() => n.remove(), 3e3));
        return;
      }
      if (e.endless) {
        let t = X(
          `div`,
          { class: `stageintro endless` },
          X(`p`, {}, c(`{biome} · Supervivencia`, { biome: e.biome.name })),
          X(`h1`, {}, c(`¡Aguanta todo lo que puedas!`)),
        );
        (this.hudEl.append(t), setTimeout(() => t.remove(), 3300));
        return;
      }
      let t = e.sanctuary,
        n = X(
          `div`,
          { class: `stageintro` + (t ? ` sanct` : ``) },
          X(
            `p`,
            {},
            t
              ? c(`{biome} · Combate final`, { biome: e.biome.name })
              : `${e.biome.name} · 区域 ${e.stage}/${e.mode === SINGLE_STAGE ? 1 : FOREST_COMBAT_ZONES}`,
          ),
          X(
            `h1`,
            {},
            t
              ? t.def.name
              : e.stage === 3
                ? (e.biome.sanctuary?.heart ?? c(`Guarida legendaria`))
                : e.stage === 2
                  ? c(`Zona profunda`)
                  : c(`¡A sobrevivir!`),
          ),
          e.tier > 0
            ? X(
                `div`,
                { class: `si-tier`, "data-t": String(e.tier) },
                `${e.tier === 1 ? "困难" : "噩梦"} · ${enemyDifficultyText(e.tier)}`,
              )
            : null,
        );
      (this.hudEl.append(n), setTimeout(() => n.remove(), 3300));
    }
    setPrompt(e) {
      if (((this.promptText = e), !e)) {
        this.promptEl.style.display = `none`;
        return;
      }
      let t = Da ? Pa(`E`) : ta(`interact`);
      (this.promptEl.dataset.t !== t + e &&
        ((this.promptEl.dataset.t = t + e),
        $(this.promptEl).append(X(`kbd`, { "data-nokbd": `1` }, t), e.replace(/^\[E\] /, ``))),
        (this.promptEl.style.display = ``));
    }
    fade(e) {
      return (this.fadeEl.classList.toggle(`on`, e), new Promise((e) => setTimeout(e, 480)));
    }
    dangerMeter(e) {
      let t = this.els,
        n = e.director.danger(),
        r = 0;
      for (; r + 1 < FI.length && n >= FI[r + 1]; ) r++;
      let i = FI[r + 1] ?? FI[r] + 1.5,
        a = Math.min(1, (n - FI[r]) / (i - FI[r])),
        o = `${r}|${Math.round(a * 50)}`;
      if (t.danger.dataset.k === o) return;
      let s = t.danger.dataset.b;
      ((t.danger.dataset.k = o),
        (t.danger.dataset.b = String(r)),
        t.danger.style.setProperty(`--dc`, II[r]),
        (t.danger.firstChild.textContent = LI(r)));
      let c = t.danger.lastChild;
      for (let e = 0; e < FI.length; e++) {
        let t = c.children[e];
        (t.style.setProperty(`--c`, II[e]),
          (t.firstChild.style.transform = `scaleX(${e < r ? 1 : e === r ? a.toFixed(2) : 0})`));
      }
      s != null &&
        Number(s) < r &&
        (t.danger.classList.remove(`up`), t.danger.offsetWidth, t.danger.classList.add(`up`));
    }
    location(e) {
      let t = this.els,
        n = e.biome.sanctuary,
        r = `${e.biome.id}|${e.stage}|${e.tier}|${e.stageCleared}|${e.endless?.pacts.length ?? -1}`,
        i = e.tower,
        a = i ? `${i.floor}|${i.roof}|${i.state}` : ``;
      if (
        (i &&
          t.biome.dataset.k !== a &&
          ((t.biome.dataset.k = a),
          (t.biome.textContent = c(`Torre Lavanda`)),
          XI(t).style.setProperty(`--bc`, i.beyond ? `#3ac8b0` : `#9a6aff`),
          $(t.pips).append(
            ...Array.from({ length: 7 }, (e, t) => {
              let n = t + 1;
              return X(`i`, {
                class:
                  i.roof || i.beyond || n < i.floor || (n === i.floor && i.state === `clear`)
                    ? `done`
                    : n === i.floor
                      ? `now`
                      : ``,
                title: $w[t].name,
              });
            }),
          ),
          (t.zone.textContent = i.where()),
          (t.tier.textContent = i.floorCurse ? c(`Maldición`) : c(`Evento`)),
          (t.tier.dataset.t = `endless`),
          (t.pacts.style.display = i.curses.length ? `` : `none`),
          (t.pacts.title = i.curses.join(`, `)),
          i.curses.length && $(t.pacts).append(X(`em`, {}, c(`Maldiciones ×{n}`, { n: i.curses.length })))),
        i)
      )
        return;
      if (t.biome.dataset.k !== r && e.endless) {
        ((t.biome.dataset.k = r),
          (t.biome.textContent = e.biome.name),
          XI(t).style.setProperty(`--bc`, YC(e.biome.tex.leaf)),
          $(t.pips).append(
            ...[1, 2, 3].map((t) =>
              X(`i`, {
                class: t < e.stage ? `done` : t === e.stage ? `now` : ``,
                title: c(`Fase {n}`, { n: t }),
              }),
            ),
          ),
          (t.zone.textContent = c(`Fase {n}/3`, { n: e.stage })),
          (t.tier.textContent = c(`Supervivencia`)),
          (t.tier.dataset.t = `endless`));
        let n = e.endless.pacts.map((e) => zw.get(e)).filter((e) => !!e);
        ((t.pacts.style.display = n.length ? `` : `none`),
          (t.pacts.title = n.map((e) => `${e.name}: ${e.boon} · ${e.bane}`).join(`
`)),
          $(t.pacts).append(
            X(`em`, {}, c(`Pactos`)),
            ...n.map((e) => X(`i`, { style: { "--c": e.color } }, Q(e.icon))),
          ));
      }
      if (t.biome.dataset.k !== r) {
        ((t.biome.dataset.k = r),
          (t.biome.textContent = e.biome.name),
          XI(t).style.setProperty(`--bc`, YC(e.biome.tex.leaf)));
        const stages = e.mode === SINGLE_STAGE ? [1] : n ? FOREST_ROUTE : [1, 2, 3];
        ($(t.pips).append(
          ...stages.map(i => {
            return X(`i`, {
              class: `${i < e.stage || (i === e.stage && e.stageCleared) ? `done` : i === e.stage ? `now` : ``}${i === 4 ? ` sanct` : ``}`,
              title: i === 4 ? n.name : c(`Zona {n}`, { n: i }),
            });
          }),
        ),
          (t.zone.textContent = e.sanctuary ? e.sanctuary.def.name : `区域 ${e.stage}/${e.mode === SINGLE_STAGE ? 1 : FOREST_COMBAT_ZONES}`),
          (t.tier.textContent = [c(`Normal`), c(`Difícil`), c(`Pesadilla`)][e.tier]),
          (t.tier.dataset.t = String(e.tier)));
      }
      let o = e.weather + `/` + e.curses;
      if (t.weather.dataset.k !== o) {
        t.weather.dataset.k = o;
        let n = { rain: `water`, sun: `fire`, sand: `rock`, hail: `ice`, fog: `ghost`, ash: `fire` };
        ($(t.weather).append(
          ...(n[e.weather] ? [ZC(n[e.weather], 16)] : []),
          v[e.weather].name,
          e.curses ? X(`em`, {}, ` · ` + c(`Maldición ×{n}`, { n: e.curses })) : ``,
        ),
          (t.weather.style.display = e.weather === `clear` && !e.curses ? `none` : ``));
      }
    }
    xpFlashT = 0;
    xpGain(e) {
      let t = performance.now();
      if (!e && t - this.xpFlashT < 90) return;
      this.xpFlashT = t;
      let n = this.els.xp;
      (n.classList.remove(`gain`, `big`),
        n.offsetWidth,
        n.classList.add(`gain`),
        e && n.classList.add(`big`));
    }
    updateBossHealth(bar, hp, maxHp) {
      const fraction = maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0;
      const label = bar.lastElementChild, value = (fraction * 100).toFixed(1) + '%';
      if (label.textContent !== value) label.textContent = value;
      bar.children[1].style.transform = `scaleX(${fraction})`;
      return fraction;
    }
    miniBars(e, t, n) {
      let r = e.minibosses?.list ?? [],
        i = e.enemies;
      (this.minisEl.classList.toggle(`below`, n),
        this.minis.forEach((e, n) => {
          let a = r[n];
          if (!a) {
            ((e.el.style.display = `none`), (e.key = ``));
            return;
          }
          e.el.style.display = ``;
          let o = `${a.i}:${a.gen}`;
          (e.key !== o &&
            ((e.key = o),
            (e.lag = 1),
            $(e.pt).append(glyphPreview(a.species,.75,'pix',a.name)),
            e.el.style.setProperty(`--c`, YC(Ni[k.get(a.species).types[0]])),
            (e.name.textContent = a.name),
            (e.tag.textContent = a.kind === `totem` ? c(`Dominante`) : c(`Invocador`)),
            e.el.classList.toggle(`totem`, a.kind === `totem`),
            e.el.classList.toggle(`summoner`, a.kind === `summoner`)),
            (e.rage.style.display = a.enraged ? `` : `none`),
            e.el.classList.toggle(`rage`, a.enraged));
          let s = a.moveT > 0,
            l = s
              ? c(`¡{name}!`, { name: a.moveName })
              : a.kind === `summoner`
                ? c(`Se marcha en {s} s · {n} esbirros`, {
                    s: Math.max(0, Math.ceil(a.life)),
                    n: a.minions.length,
                  })
                : ``;
          ((e.sub.style.display = l ? `` : `none`),
            e.sub.classList.toggle(`move`, s),
            e.sub.textContent !== l &&
              ((e.sub.textContent = l),
              s && (e.sub.classList.remove(`pop`), e.sub.offsetWidth, e.sub.classList.add(`pop`))));
          let u = this.updateBossHealth(e.bar, i.hp[a.i], i.maxHp[a.i]);
          (u >= e.lag
            ? ((e.lag = u), (e.hold = 0.45))
            : (e.hold -= t) <= 0 && (e.lag = Math.max(u, e.lag - t * 0.6)),
            (e.bar.children[0].style.transform = `scaleX(${e.lag})`),
            (e.foot.style.display = e.st.update(i, a.i) || l ? `` : `none`));
        }));
    }
    fitTop() {
      let e = this.els,
        t = XI(e),
        n = this.hudEl.getBoundingClientRect();
      // The portrait HUD has a separate row below the player badge.
      if (uo && innerHeight >= innerWidth) {
        t.classList.remove('compact', 'slim');
        t.style.left = t.style.transform = '';
        const style = this.hudEl.style;
        style.setProperty('--hc', '50%');
        style.setProperty('--hw', '94%');
        style.setProperty('--hb', Math.round(t.getBoundingClientRect().bottom - n.top + 6) + 'px');
        return;
      }
      let r = YI(e).getBoundingClientRect(),
        i = (this.minimap.offsetWidth ? this.minimap : e.kills.parentElement).getBoundingClientRect();
      if (!r.width || !i.width || !n.width) return;
      let a = r.right + 12 - n.left,
        o = i.left - 12 - n.left,
        s = Math.max(0, o - a);
      t.classList.remove(`compact`, `slim`);
      let c = t.offsetWidth;
      (c * this.hs > s && (t.classList.add(`compact`), (c = t.offsetWidth)),
        c * 0.6 * this.hs > s && (t.classList.add(`slim`), (c = t.offsetWidth)));
      let l = Math.max(0.6 * this.hs, Math.min(this.hs, s / c)),
        u = (c * l) / 2,
        d = Math.max(a + u, Math.min(o - u, n.width / 2));
      ((t.style.left = `${Math.round(d)}px`),
        (t.style.transform = `translateX(-50%) scale(${l.toFixed(3)})`));
      let f = this.hudEl.style;
      (f.setProperty(`--hc`, `${Math.round(d)}px`),
        f.setProperty(`--hw`, `${Math.round(s)}px`),
        f.setProperty(`--hb`, `${Math.round(e.gold.getBoundingClientRect().bottom - n.top)}px`));
    }
    pwKey = ``;
    powerChips(e) {
      let t = e.player,
        n = nf.filter((e) => t.buffs.has(e)),
        r = n.join(`,`) + (e.egg ? `,egg` : ``);
      r !== this.pwKey &&
        ((this.pwKey = r),
        this.els.pw.replaceChildren(
          ...n.map((e) =>
            X(
              `div`,
              { class: `pw-chip`, "data-k": e, style: { "--c": YC(rf[e].col) }, title: rf[e].name },
              Q(rf[e].icon),
            ),
          ),
          ...(e.egg
            ? [
                X(
                  `div`,
                  {
                    class: `pw-chip egg`,
                    "data-k": `egg`,
                    style: { "--c": `#6ad05a` },
                    title: c(`Huevo Pokémon`),
                  },
                  Z(`egg`, 20),
                ),
              ]
            : []),
        ));
      for (let n of this.els.pw.children) {
        if (n.dataset.k === `egg`) {
          let t = _f(e);
          (n.style.setProperty(`--p`, String(t)), n.classList.toggle(`end`, t >= 0.8));
          continue;
        }
        let r = t.buffs.get(n.dataset.k);
        r &&
          (n.style.setProperty(`--p`, String(Math.max(0, Math.min(1, r.t / r.max)))),
          n.classList.toggle(`end`, r.t < 2));
      }
    }
    hud(e) {
      ((this.runRef = e), e.coop && (this.coopHud ??= new AI(this.hudEl)).update(e));
      let t = e.player,
        n = this.els,
        r = Math.max(0, t.hp / t.maxHp);
      let i = performance.now(),
        a = Math.min(0.1, (i - this.lagT) / 1e3);
      this.streakHud(e.streak, e.streakT);
      this.updateEffectivePopups(e);
      if(this.compact){
        this.lagT=i;this.touch.update(e,this.promptText);this.ultHud(e);
        n.lowhp.style.display=r<.25&&!t.dead?``:`none`;
        const release=e.state===`play`&&e.allies.state===`down`;
        this.releaseEl.style.display=release?``:`none`;
        if(release)this.releaseEl.onclick=()=>{N.click();e.allies.dismiss();};
      }else{
      n.hp.children[0].style.transform = `scaleX(${r})`;
      ((this.lagT = i),
        r >= this.hpLag
          ? ((this.hpLag = r), (this.lagHold = 0.4))
          : (this.lagHold -= a) <= 0 && (this.hpLag = Math.max(r, this.hpLag - a * 0.9)),
        (n.hp.children[3].style.transform = `scaleX(${this.hpLag})`),
        (n.hp.children[1].style.transform = `scaleX(${t.stats.shieldMax > 0 ? Math.min(1, t.shield / t.maxHp) : 0})`));
      let o = t.shield + t.overheal;
      ((n.hp.children[2].textContent = `${Math.ceil(t.hp)}${o > 1 ? ` +${Math.round(o)}` : ``}`),
        (n.hp.children[4].style.transform = `scaleX(${Math.min(1, t.overheal / t.maxHp)})`),
        n.hp.classList.toggle(`oh`, t.overheal > 1),
        this.powerChips(e),
        n.hp.classList.toggle(`wound`, t.woundT > 0),
        n.hp.classList.toggle(`low`, r < 0.3),
        n.hp.classList.toggle(`mid`, r >= 0.3 && r < 0.55),
        (n.lowhp.style.display = r < 0.25 && !t.dead ? `` : `none`),
        (n.lockHint.style.display = e.state === `play` && !e.input.looking ? `` : `none`),
        e.autoRun !== (n.autoRun.style.display === ``) &&
          ((n.autoRun.style.display = e.autoRun ? `` : `none`),
          e.autoRun &&
            n.autoRun.replaceChildren(
              c(`Avance automático`),
              X(`kbd`, {}, ta(`autorun`)),
              X(`small`, {}, c(`{k} lo para`, { k: ta(`down`) })),
            )),
        this.touch.update(e, this.promptText));
      let s = e.state === `play` && e.allies.state === `down`;
      (s !== (this.releaseEl.style.display === ``) && (this.releaseEl.style.display = s ? `` : `none`),
        s &&
          (this.releaseEl.onclick = () => {
            (N.click(), e.allies.dismiss());
          }),
        i - this.fitT > 250 && ((this.fitT = i), this.fitTop()),
        n.xp.style.setProperty(`--p`, String(Math.round(Math.min(1, t.xp / t.xpNext) * 1e3) / 10)));
      let l = e.nextEvo ? `${e.nextEvo.to}:${e.nextEvo.level}` : `final`;
      if (n.evo.dataset.k !== l) {
        n.evo.dataset.k = l;
        let t = e.nextEvo;
        t
          ? ((n.evo.title = c(`Evoluciona en el Nv. {lvl}`, { lvl: t.level })),
            ow(
              $(n.evo),
              X(`span`, { class: `tl-arrow` }),
              t.to > 0 ? X(`span`, { class: `tl-next` }, tw(t.to)) : X(`span`, { class: `tl-next q` }, `?`),
              X(`b`, { class: `tl-evlv` }, c(`Nv. {lvl}`, { lvl: t.level })),
            ))
          : ((n.evo.title = ``), $(n.evo).append(X(`span`, { class: `tl-final` }, c(`Forma final`))));
      }
      let u = this.project(e, t.pos.x, t.pos.y - 0.15, t.pos.z);
      ((n.under.style.display = u.vis && !t.dead ? `` : `none`),
        (n.under.style.left = u.x + `px`),
        (n.under.style.top = u.y + 18 + `px`));
      let d = t.revives;
      n.lives.dataset.n !== String(d) &&
        ((n.lives.dataset.n = String(d)),
        $(n.lives).append(...(d > 0 ? [Q(`max-revive`), X(`b`, {}, `×` + d)] : [])),
        (n.lives.title = c(`Revivir Máximo: vidas extra que te quedan`)),
        (n.lives.style.display = d > 0 ? `` : `none`));
      let f = n.lvl.lastChild;
      f.textContent !== String(t.level) &&
        ((f.textContent = String(t.level)),
        n.lvl.classList.remove(`pop`),
        n.lvl.offsetWidth,
        n.lvl.classList.add(`pop`));
      let p = t.data.id + ``;
      n.portrait.dataset.k !== p &&
        ((n.portrait.dataset.k = p),
        $(n.portrait).append(ZI(t.data.id, QI(e), e.skinMember)),
        (n.name.textContent = t.data.name),
        $(n.types).append(...t.types.map((e) => XC(e))),
        YI(n).style.setProperty(`--tc`, YC(Ni[t.types[0]])));
      let m = remainingZoneSeconds(e);
      if (((n.clock.firstChild.textContent = Xs(e.time)), e.endless)) this.endlessClock(e);
      else if (e.tower) this.towerClock(e);
      else if (n.siege.dataset.k) ((n.siege.dataset.k = ``), (n.siege.style.display = `none`));
      else {
        ((n.timer.textContent = e.sanctuary ? Ys(e.stageTime) : m >= 0 ? Ys(m) : `+` + Ys(-m)),
          n.timer.classList.toggle(`final`, !e.sanctuary && m <= 0 && !e.stageCleared));
        let t = e.coop ? void 0 : e.meta.profile.times[`${e.biome.id}-${e.tier}`];
        if (n.clock.dataset.k !== String(e.splits.length)) {
          n.clock.dataset.k = String(e.splits.length);
          let r = e.splits.length,
            i = t && r && Number.isFinite(t.splits?.[r - 1]) ? e.splits[r - 1] - t.splits[r - 1] : null;
          (n.clock.classList.toggle(`ahead`, i != null && i < 0),
            n.clock.classList.toggle(`behind`, i != null && i >= 0),
            (n.clock.lastChild.textContent = e.coop
              ? c(`Partida cooperativa`)
              : t
                ? c(`Récord {time}`, { time: Xs(t.time) }) + (i == null ? `` : ` · ` + Zs(i))
                : c(`Sin récord en este mapa`)));
        }
      }
      (this.location(e),
        this.dangerMeter(e),
        this.wallet(e),
        (n.kills.lastChild.textContent = P(e.stats.kills)),
        e.tower || this.killGoals(e),
        (n.fps.textContent = e.meta.profile.settings.showFps
          ? c(`{fps} fps · {n} enemigos`, { fps: Math.round(e.fps), n: Math.round(e.enemies.mass) })
          : ``));
      let h = t.speciesId + ':' +
        t.moves.map((e) => (e ? `${e.def.id}:${e.level}` : `-`)).join(`,`) +
        t.moveSlots +
        `:` +
        t.moveCap +
        `:` +
        +!!t.items.has(`tm-case`) +
        [...t.vitamins].map(([e, t]) => e + t.level).join(`,`);
      (h !== this.lastSlots && ((this.lastSlots = h), this.buildSlots(e)),
        t.moves.forEach((e, r) => {
          let i = n.slots.children[r]?.querySelector(`.cd`);
          if (e && i) {
            let n = e.def.arch === `random` && e.sub ? e.sub : e,
              r = g_[n.def.arch],
              a = Math.max(0.12, (n.def.cd * n.mods.cd) / t.stats.attackSpeed);
            i.style.transform = `scaleY(${r && n.timer > 0 ? Math.min(1, n.timer / a) : 0})`;
          }
        }),
        this.ultHud(e));
      let g = [...t.items].map(([e, t]) => e + t).join(`,`);
      if (g !== this.lastItems) {
        ((this.lastItems = g), $(n.items));
        for (let [e, r] of t.items) {
          let t = sn.get(e),
            i = X(
              `div`,
              {
                class: `itm`,
                title: `${k.items[e]?.name ?? e}: ${t?.desc ?? ``}`,
                style: { borderColor: te[t?.rarity ?? 0] },
              },
              Q(e),
              r > 1 ? X(`b`, {}, String(r)) : null,
            );
          n.items.append(i);
        }
      }
      this.party(e);
      }
      let _ = e.boss;
      if (_.alive) {
        n.boss.style.display = ``;
        let t = _.bossIndex,
          r = _.kit,
          i = e.enemies.species[t];
        const bossKey=i+'-'+_.name, bossTag=this.compact&&!r?'':c(r ? `Legendario` : `Guardián`);
        (n.boss.dataset.k !== bossKey &&
          ((n.boss.dataset.k = bossKey),
          $(n.bossPt).append(glyphPreview(i,.75,'pix',_.name)),
          n.boss.style.setProperty(`--c`, YC(Ni[k.get(i).types[0]])),
          (n.bossName.textContent = this.compact&&!r?'首领镇守':_.name),
          (this.bossLag = 1)),
          (n.bossTag.textContent !== bossTag && (n.bossTag.textContent = bossTag)),
          (n.bossRage.style.display = _.enraged ? `` : `none`),
          n.boss.classList.toggle(`legend`, !!r),
          n.boss.classList.toggle(`immune`, _.immune),
          n.boss.classList.toggle(`shield`, !!r && r.barrierT > 0 && !_.immune),
          n.boss.classList.toggle(`rage`, _.enraged));
        let o = n.bossBar;
        o.children[2].style.display = o.children[3].style.display = r ? `` : `none`;
        let s = n.bossSub,
          l = !r && _.moveT > 0;
        if (((s.style.display = r || l ? `` : `none`), s.classList.toggle(`move`, l), r)) {
          let e =
            c(`Fase {n}/3 · {name}`, { n: r.phase, name: r.phaseNames[r.phase - 1] }) +
            (_.immune ? ` · ` + c(`Inmune`) : r.barrierT > 0 ? ` · ` + c(`Barrera`) : ``);
          s.textContent !== e && (s.textContent = e);
        } else if (l) {
          let e = c(`¡{name}!`, { name: _.moveName });
          s.textContent !== e &&
            ((s.textContent = e), s.classList.remove(`pop`), s.offsetWidth, s.classList.add(`pop`));
        }
        let u = this.updateBossHealth(o, e.enemies.hp[t], e.enemies.maxHp[t]);
        (u >= this.bossLag
          ? ((this.bossLag = u), (this.bossLagHold = 0.45))
          : (this.bossLagHold -= a) <= 0 && (this.bossLag = Math.max(u, this.bossLag - a * 0.6)),
          (o.children[0].style.transform = `scaleX(${this.bossLag})`),
          (n.bossFoot.style.display = this.bossSt.update(e.enemies, t) || r || l ? `` : `none`));
      } else ((n.boss.style.display = `none`), this.bossSt.reset());
      (this.miniBars(e, a, _.alive), this.placeToasts());
      const world = e.events, zone = e.mapEvents, event = n.event;
      let kind, name, left;
      if (world?.def && world.left > 0) {
        kind = world.kind === 'fog' ? 'spectral-fog' : world.kind;
        name = world.def.name;
        left = world.left;
      } else if (zone?.bliz?.t > 0) {
        kind = 'blizzard';
        name = c('Ventisca');
        left = zone.bliz.t;
      } else if (zone?.spout?.t > 0) {
        kind = 'spout';
        name = c('¡Tromba marina!').replace(/[!！]/g, '');
        left = zone.spout.t;
      } else if (e.weatherT > 0 && v[e.weather]) {
        kind = e.weather;
        name = v[kind].name;
        left = e.weatherT;
      }
      if (kind) {
        if (event.dataset.kind !== kind) event.dataset.kind = kind;
        if (event.children[0].textContent !== name) event.children[0].textContent = name;
        if (event.style.display === 'none') event.style.display = '';
        const countdown = c(`{n} s`, {n: Math.ceil(left)});
        if (event.children[1].textContent !== countdown) event.children[1].textContent = countdown;
      } else if (event.style.display !== 'none') event.style.display = 'none';
      if (e.lockTarget >= 0 && e.enemies.isAlive(e.lockTarget)) {
        let t = e.lockTarget,
          n = e.enemies,
          r = this.project(e, n.x[t], n.y[t] + n.hgt[t] * 0.55, n.z[t]);
        ((this.reticle.style.display = r.vis ? `` : `none`),
          (this.reticle.style.left = r.x + `px`),
          (this.reticle.style.top = r.y + `px`));
      } else this.reticle.style.display = `none`;
      this.crosshair.style.display = e.aimMode === `manual` && e.state === `play` ? `` : `none`;
      let y = e.stageCleared ? (e.interactables.list.find((e) => e.kind === `portal`) ?? null) : null,
        bossIndex = e.boss.bossIndex,
        bossTarget = e.boss.alive ? {i:bossIndex,x:e.enemies.x[bossIndex],z:e.enemies.z[bossIndex]} : null,
        b =
          bossTarget ??
          e.capture.marker ??
          e.allies.marker ??
          e.events?.marker ??
          this.trackedMiniboss(e) ??
          (y ? { x: y.x, z: y.z } : null);
      if (b) {
        const distance = Math.hypot(b.x - e.player.pos.x, b.z - e.player.pos.z),
          bossFlags = R.Boss | R.Elite | R.Alpha | R.Totem | R.Summoner,
          encounter = b.i!=null && e.enemies.isAlive(b.i) && !!(e.enemies.flags[b.i]&bossFlags),
          markerText = b===bossTarget || encounter ? bossDistanceText(distance)
            : c(`{n} m`, { n: Math.round(distance) });
        // The camera's right/up axes give the bearing even behind the view.
        // Keep the same card when a target enters/leaves the visible scene.
        const dx=b.x-e.player.pos.x,dz=b.z-e.player.pos.z,m=e.r.camera.matrixWorld.elements;
        const horizontal=dx*m[0]+dz*m[2],vertical=-(dx*m[4]+dz*m[6]);
        const targetKey=(b.i??'portal')+'/'+(e.enemies.gen[b.i]??0);
        const slot=sideGuidePosition(horizontal,innerWidth,innerHeight,this.guideKey===targetKey?this.guideSide:0,this.touch.ult.getBoundingClientRect());
        this.guideKey=targetKey;this.guideSide=slot.side;
        {
          let t = Math.atan2(vertical,horizontal),
            s = e.enemies,
            l = b.i,
            u =
              b===bossTarget ? facilityMapArt.boss.ring : e.capture.marker || e.allies.marker
                ? cI.capture
                : e.events?.marker
                  ? cI.treasure
                  : l != null
                    ? cI.summoner
                    : facilityMapArt.portal.ring,
            d = l == null ? `portal` : `m${s.glyphWords[l]}${u}`,
            f = this.arrow;
          (f.dataset.k !== d &&
            ((f.dataset.k = d),
            f.style.setProperty(`--rc`, u),
            $(f.children[1]).append(
              l == null ? pI(`portal`, 32) : fI(`portraits/${s.species[l]}.png`, u, 32, !0, s.glyphWords[l]),
            )),
            (f.style.display = ``),
            (f.dataset.fixedSlot = 'true'),
            (f.dataset.side = slot.side<0?'left':'right'),
            (f.style.left = slot.x + `px`),
            (f.style.top = slot.y + `px`),
            drawCompassDial(f.children[0], t));
          let m = markerText;
          (f.children[2].textContent !== m && (f.children[2].textContent = m),
            (this.markTag.style.display = `none`));
        }
      } else {
        this.arrow.style.display = this.markTag.style.display = 'none';
        this.arrow.dataset.fixedSlot='false';
        this.guideKey=null;this.guideSide=0;
      }
      (this.trackSeen(e), this.tickMarks(e), this.leftoverHud(e), this.drawMinimap(e), this.worldLabels(e));
    }
    trackedMiniboss(run) {
      const saved=this.guideEncounter,enemies=run.enemies;
      if(saved?.terrain===run.terrain&&enemies.gen[saved.i]===saved.gen&&enemies.isAlive(saved.i)&&
          (enemies.flags[saved.i]&(R.Alpha|R.Totem|R.Summoner)))
        return {i:saved.i,x:enemies.x[saved.i],z:enemies.z[saved.i]};
      const marker=run.minibosses?.marker;
      this.guideEncounter=marker?{terrain:run.terrain,i:marker.i,gen:enemies.gen[marker.i]}:null;
      return marker;
    }
    worldLabelNodes = new Map();
    worldLabelPoint(run,facility) {
      const anchor=facility.kind==='altar'&&facility.model?.userData.labelAnchor;
      if(anchor){
        facility.model.updateWorldMatrix(true,false);
        const position=facility.model.localToWorld(this.v.copy(anchor));
        const point=this.project(run,position.x,position.y,position.z);
        point.y-=6;
        return point;
      }
      return this.project(run,facility.x,facility.y+(facility.group?.userData.h??2.5)+.5,facility.z);
    }
    placeWorldLabel(node,point) {
      const {halfWidth,minY}=node.worldLabelLayout;
      const visible=point.vis&&point.x>=halfWidth&&point.x<=innerWidth-halfWidth&&point.y>=minY&&point.y<=innerHeight-4;
      const display=visible?'':'none';
      if(node.style.display!==display)node.style.display=display;
      const left=Math.round(point.x)+'px',top=Math.round(point.y)+'px';
      if(visible){
        if(node.style.left!==left)node.style.left=left;
        if(node.style.top!==top)node.style.top=top;
      }
      // LinkeDOM style setters do not emit attribute mutations. Invalidate
      // the notices tile explicitly, including frames without a new percent.
      const position=visible?left+'/'+top:'hidden';
      if(node.dataset.worldPosition!==position)node.dataset.worldPosition=position;
    }
    updateWorldLabelPositions(run) {
      if(run.state!=='play'||run.player.dead||run.interactables.disposed){this.clearWorldLabels();return;}
      // The text can use the HUD cadence, but world anchors must follow every
      // rendered camera frame or a walking player sees the labels snap sideways.
      for(const [facility,node] of this.worldLabelNodes){
        if(!run.interactables.hasVisual(facility)){this.removeWorldLabel(facility);continue;}
        this.placeWorldLabel(node,this.worldLabelPoint(run,facility));
      }
    }
    removeWorldLabel(facility) {
      this.worldLabelNodes.get(facility)?.remove();
      this.worldLabelNodes.delete(facility);
    }
    clearWorldLabels() {
      for (const node of this.worldLabelNodes.values()) node.remove();
      this.worldLabelNodes.clear();
    }
    clearWorldNotices() {
      this.clearWorldLabels();
      for (const popup of this.popups) popup.remove();
      this.popups.clear();
      this.effectivePopups.length=0;
      this.toastsEl.replaceChildren();
    }
    worldLabels(run) {
      const facilities = run.interactables;
      if (run.state !== 'play' || run.player.dead || facilities.disposed) {
        this.clearWorldLabels();
        return;
      }
      const player = run.player.pos, visible = new Set();
      const towerLabels = {
          stairs: c(`Escalera`),
          altar: c(`Ofrenda`),
          trick: c(`¿Truco o trato?`),
          portal: c(`Más Allá`),
          leave: c(`Bajar`),
        },
        landmarkLabels = {
          freechest: c(`Poké Ball gratis`),
          meowth: c(`Tienda`),
          bill: c(`Máquina de Bill`),
          nest: c(`Huevo Pokémon`),
          hypno: c(`Hypno`),
          magnet: buildingMapName({kind:'magnet'}),
          berry: c(`Bayas`),
          ditto: facilityNames.ditto,
          boss: facilityNames.boss,
          portal: facilityNames.portal,
          shrine: c(`Santuario`),
          challenge: c(`Desafío`),
          cursedchest: c(`Maldita`),
          shroom: c(`Seta rebote`),
        };
      for (const facility of facilities.list) {
        const {kind, data} = facility;
        const wave = kind === 'challenge' && data?.wave;
        const landmark = RI.has(kind) || wave;
        const range = landmark ? 18 : kind === 'altar' ? facility.r + 3 : 6;
        const distance = Math.hypot(facility.x - player.x, facility.z - player.z);
        if (distance >= range || !facilities.hasVisual(facility)) continue;
        if (facility.used && !wave && kind !== 'meowth' && kind !== 'hypno' && kind !== 'slots' && kind !== 'portal') continue;

        let label, progress = null, className = 'wlabel';
        if (kind === 'chest' || kind === 'slots') {
          const cost = facilities.interactionCost(facility);
          if (run.gold < cost) continue;
          className += ' cost';
          label = cost ? cost + ' 金币' : buildingMapName(facility);
        } else if (kind === 'altar') {
          if (facility.charge >= 1) continue;
          if (facility.charging) {
            className += ' altar-progress';
            progress = Math.floor(Math.max(0,Math.min(1,facility.charge))*100);
            label = progress + '%';
          } else {
            if (facility.charge > 0 || distance < facility.r) continue;
            label = facilityNames.altar;
          }
        } else if (wave) {
          className += ' nocost';
          label = c(`Quedan {n}`, {n: data.left});
        } else {
          if (kind === 'meowth') className += ' shop';
          label = facility === facilities.nearest ? facilities.label(facility)
            : kind === 'tower' ? towerLabels[data?.sub] : landmarkLabels[kind];
        }
        if (!label) continue;
        if (kind === 'boss' && run.hints?.site === facility && run.hints.el?.parentNode) continue;
        const point=this.worldLabelPoint(run,facility);
        // Reserve a full Chinese glyph per character plus padding and the shadow.
        const halfWidth = progress !== null ? 26 : 17 + label.length * (kind === 'meowth' ? 7 : 6);
        if (!(point.vis && point.x >= halfWidth && point.x <= innerWidth - halfWidth &&
              point.y >= (progress !== null ? 50 : 30) && point.y <= innerHeight - 4)) continue;

        let node = this.worldLabelNodes.get(facility);
        if (!node) {
          node = X('div');
          (this.popupRoot || this.hudEl).append(node);
          this.worldLabelNodes.set(facility, node);
        }
        visible.add(facility);
        if (node.className !== className) node.className = className;
        if (progress !== null) {
          let canvas=node.firstElementChild;
          if (!canvas) {
            canvas=X('canvas',{'data-static':'true','aria-hidden':'true'});
            canvas.width=canvas.height=144;
            node.replaceChildren(canvas);
            node.setAttribute('role','progressbar');
            node.setAttribute('aria-label','祭坛激活进度');
            node.setAttribute('aria-valuemin','0');node.setAttribute('aria-valuemax','100');
          }
          const key=String(progress);
          if (canvas.dataset.frame !== key) {
            drawAltarProgress(canvas,progress);
            canvas.dataset.frame=key;
            node.setAttribute('aria-valuenow',String(progress));node.setAttribute('aria-valuetext',label);
          }
        } else {
          if (node.hasAttribute('role')) {
            for (const attr of ['role','aria-label','aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext'])node.removeAttribute(attr);
          }
          if (node.textContent !== label) node.textContent = label;
        }
        node.worldLabelLayout={halfWidth,minY:progress!==null?50:30};
        this.placeWorldLabel(node,point);
        node.style.opacity = String(Math.min(1, (range - distance) / (landmark ? 5 : 2)));
      }
      for (const facility of this.worldLabelNodes.keys()) {
        if (!visible.has(facility)) this.removeWorldLabel(facility);
      }
    }
    buildSlots(e) {
      let t = e.player,
        n = this.els;
      $(n.slots);
      for (let e = 0; e < 4; e++) {
        let r = t.moves[e];
        if (e >= t.moveSlots) {
          n.slots.append(
            X(`div`, { class: `slot locked`, title: c(`Desbloquéalo en el Laboratorio`) }, Z(`lock`, 28)),
          );
          continue;
        }
        if (!r) {
          n.slots.append(X(`div`, { class: `slot empty` }));
          continue;
        }
        let i = YC(Ni[r.def.type]),
          a = YC(Ni[r.def.type2 ?? r.def.type]),
          o = !!r.def.fusion,
          s = o
            ? r.level >= t.capOf(r)
              ? c(`MAX`)
              : `★` + r.level
            : r.level >= t.moveCap
              ? c(`MAX`)
              : String(r.level);
        n.slots.append(
          X(
            `div`,
            {
              class: `slot` + (o ? ` fused` : ``),
              style: {
                background: o
                  ? `linear-gradient(135deg, ${i}, color-mix(in srgb, ${i} 50%, ${a}) 50%, ${a})`
                  : `linear-gradient(180deg, color-mix(in srgb, ${i} 55%, white), ${i})`,
                "--t1": i,
                "--t2": a,
              },
              title: `${r.def.name} — ${r.def.desc}`,
            },
            ZC(r.def.type, 30),
            X(`div`, { class: `cd` }),
            X(`div`, { class: `nm` }, r.def.name),
            X(`div`, { class: `lvl` }, s),
          ),
        );
      }
      $(n.vits);
      for (const [id, vitamin] of t.vitamins) {
        let i = Ne.get(id);
        n.vits.append(
          X(
            `div`,
            { class: `slot mini`, title: `${i.name}: ${i.desc}` },
            Q(i.icon),
            X(`div`, { class: `lvl` }, String(vitamin.level)),
          ),
        );
      }
    }
    mmAt = 0;
    mmElites = [];
    drawMinimap(e) {
      if (this.hudEl.classList.contains(`no-minimap`)) return;
      let t = performance.now();
      if (t - this.mmAt < 30) return;
      this.mmAt = t;
      let n = this.mm,
        r = e.player.pos,
        i = 200 / 60;
      if (
        (n.clearRect(0, 0, 400, 400),
        n.save(),
        n.beginPath(),
        n.arc(200, 200, 198, 0, Math.PI * 2),
        n.clip(),
        (n.fillStyle = `rgba(40,30,70,0.55)`),
        n.fillRect(0, 0, 400, 400),
        e.events?.blind)
      ) {
        ((n.fillStyle = `rgba(70,60,100,0.85)`),
          n.fillRect(0, 0, 400, 400),
          (n.fillStyle = `#fff`),
          n.beginPath(),
          n.arc(200, 200, 7, 0, 7),
          n.fill(),
          n.restore());
        return;
      }
      n.translate(200, 200);
      let a = this.northUp ? 0 : e.camYaw;
      n.rotate(a);
      let o = (e, t) => [(e - r.x) * i, (t - r.z) * i];
      ((n.strokeStyle = `rgba(255,255,255,0.4)`), (n.lineWidth = 3));
      let s = e.sanctuary;
      if (s) {
        let [t, r] = o(0, 0);
        (n.beginPath(),
          n.arc(t, r, e.terrain.arenaR * i, 0, 7),
          n.stroke(),
          s.ringR < 999 &&
            ((n.strokeStyle = `rgba(176,90,255,0.85)`),
            (n.lineWidth = 5),
            n.beginPath(),
            n.arc(t, r, s.ringR * i, 0, 7),
            n.stroke()));
        for (let e of s.covers) {
          if (!e.alive) continue;
          let [t, r] = o(e.x, e.z);
          ((n.fillStyle = e.kind === `root` ? `#8a6a4a` : e.kind === `tree` ? `#3a8a4a` : `#b8c0a8`),
            n.beginPath(),
            n.arc(t, r, Math.max(3, e.r * i), 0, 7),
            n.fill());
        }
      } else {
        let t = e.terrain.world,
          [r, a] = o(-t / 2, -t / 2);
        n.strokeRect(r, a, t * i, t * i);
      }
      let c = xI() * this.mi,
        l = facilityMapArt,
        u = -a,
        d = 200 - 26 * c,
        f = Math.max(70, 200 - 44 * c),
        p = (e, t, n) => {
          let r = Math.hypot(e, t);
          return r <= d ? [e, t] : n ? [(e * d) / r, (t * d) / r] : null;
        };
      for (let t of e.endless?.hazards.list ?? []) {
        let [e, r] = o(t.x, t.z),
          a = bw[t.kind].color;
        ((n.fillStyle = `#${a.toString(16).padStart(6, `0`)}66`),
          (n.strokeStyle = `#${a.toString(16).padStart(6, `0`)}`),
          (n.lineWidth = 2),
          n.setLineDash(t.age < 2 ? [5, 4] : []),
          n.beginPath(),
          n.arc(e, r, t.r * i, 0, 7),
          n.fill(),
          n.stroke(),
          n.setLineDash([]));
      }
      let m = performance.now();
      for (let t of e.interactables.markers()) {
        let e = l[BS(t)];
        if (!e) continue;
        let r = hI.has(t.kind),
          i = p(...o(t.x, t.z), !1);
        i &&
          (n.save(),
          n.translate(i[0], i[1]),
          n.rotate(u),
          dI(
            n,
            e.src,
            t.kind === `altar` ? t.altarCss : e.ring,
            (r || t.data?.comet ? 25 : 19) * c,
            e.round,
          ),
          n.restore());
      }
      for (let e of this.marks) {
        let t = o(e.x, e.z),
          r = Math.hypot(t[0], t[1]),
          i = r > f,
          a = i ? [(t[0] * f) / r, (t[1] * f) / r] : t;
        (i && vI(n, Math.atan2(a[1], a[0]), f + 30 * c, 8 * c, `#ffd23a`),
          n.save(),
          n.translate(a[0], a[1]),
          n.rotate(u),
          _I(n, e, 17 * c, m),
          n.restore());
      }
      let h = e.enemies,
        g = Math.sqrt(c),
        _ = !1,
        v = this.mmElites;
      for (let e = 0; e < h.n; e++) {
        if (!h.alive[e] || h.dying[e] > 0) continue;
        let t = h.flags[e];
        if (t & (R.Boss | 12290 | R.Capture | R.Treasure)) continue;
        let [r, i] = o(h.x[e], h.z[e]);
        r * r + i * i > 4e4 ||
          (t & R.Elite
            ? v.push(r, i)
            : ((_ ||= (n.beginPath(), !0)), n.rect(r - 2.5 * g, i - 2.5 * g, 5 * g, 5 * g)));
      }
      _ && ((n.fillStyle = `#ff5a6a`), n.fill());
      for (let e = 0; e < v.length; e += 2)
        ((n.fillStyle = `#ffd23a`), n.beginPath(), n.arc(v[e], v[e + 1], 5 * g, 0, 7), n.fill());
      v.length = 0;
      for (let t = 0; t < h.n; t++) {
        if (!h.alive[t]) continue;
        let r = h.flags[t];
        if (!(r & (R.Boss | 12290 | R.Capture | R.Treasure))) continue;
        let i = p(...o(h.x[t], h.z[t]), !0);
        if (!i) continue;
        let a =
          r & R.Capture || e.allies.isDown(t)
            ? cI.capture
            : r & R.Treasure
              ? cI.treasure
              : r & R.Totem
                ? cI.totem
                : r & R.Summoner
                  ? cI.summoner
                  : r & R.Boss
                    ? cI.boss
                    : cI.alpha;
        (n.save(),
          n.translate(i[0], i[1]),
          n.rotate(u),
          dI(n, `portraits/${h.species[t]}.png`, a, (r & R.Boss ? 27 : 22) * c, !0, h.glyphWords[t]),
          n.restore());
      }
      ((n.fillStyle = `#7aff9a`), (n.strokeStyle = `#1d1236`), (n.lineWidth = 2));
      for (let t of e.allies.list) {
        let [e, r] = o(t.x, t.z);
        (n.beginPath(), n.arc(e, r, 6 * g, 0, 7), n.fill(), n.stroke());
      }
      if (e.coop) {
        for (let t of e.coop.marks) {
          let e = p(...o(t.x, t.z), !0);
          e &&
            (n.save(),
            n.translate(e[0], e[1]),
            n.rotate(u),
            _I(n, { x: t.x, z: t.z }, 17 * c, m),
            n.restore());
        }
        for (let t of e.coop.active()) {
          if (t.last.flags & 2) continue;
          let e = p(...o(t.x, t.z), !0);
          e &&
            (n.save(),
            n.translate(e[0], e[1]),
            n.rotate(u),
            dI(
              n,
              `portraits/${t.species}.png`,
              t.last && t.last.flags & 3 ? `#ff5a6a` : `#7aff9a`,
              24 * c,
              !0,
            ),
            n.restore());
        }
      }
      (n.restore(),
        n.save(),
        n.translate(200, 200),
        this.northUp && n.rotate(-e.camYaw),
        (n.fillStyle = `#fff`),
        (n.strokeStyle = `#1d1236`),
        (n.lineWidth = 3),
        n.scale(g, g),
        n.beginPath(),
        n.moveTo(0, -15),
        n.lineTo(11, 11),
        n.lineTo(0, 5),
        n.lineTo(-11, 11),
        n.closePath(),
        n.fill(),
        n.stroke(),
        n.restore());
      let y = 16 * c,
        b = 200 - y * 0.85 - 3;
      SI(n, 200, 200, b, b, a, y);
    }
    mapSeen = new WeakSet();
    seenAt = 0;
    trackSeen(e) {
      let t = performance.now();
      if (t - this.seenAt < 500) return;
      this.seenAt = t;
      let n = e.player.pos,
        r = mI();
      for (let t of e.interactables.list)
        !t.used && Math.hypot(t.x - n.x, t.z - n.z) <= r && this.mapSeen.add(t);
    }
    tickMarks(e) {
      this.markTerrain !== e.terrain && ((this.marks.length = 0), (this.markTerrain = e.terrain));
      let t = e.player.pos;
      for (let e = this.marks.length - 1; e >= 0; e--)
        Math.hypot(this.marks[e].x - t.x, this.marks[e].z - t.z) < 4 && this.marks.splice(e, 1);
      for (let n = 0; n < this.pins.length; n++) {
        let r = this.pins[n],
          i = this.marks[n];
        if (!i || e.state !== `play` || e.events?.blind) {
          r.style.display = `none`;
          continue;
        }
        let a = this.project(e, i.x, e.terrain.height(i.x, i.z) + 2, i.z),
          o = innerWidth / 2,
          s = innerHeight / 2,
          l = a.x - o,
          u = a.y - s;
        a.vis || ((l = -l), (u = -u));
        let d = a.vis && a.x > 40 && a.x < innerWidth - 40 && a.y > 150 && a.y < innerHeight - 130,
          f = i.kind ?? ``;
        (r.dataset.k !== f &&
          ((r.dataset.k = f),
          $(r.children[1]).append((i.kind && pI(i.kind, 34)) || X(`span`, { class: `mk-dot` }))),
          (r.style.display = ``));
        let p = r.children[0];
        if (d) ((r.style.left = a.x + `px`), (r.style.top = a.y + `px`), (p.style.display = `none`));
        else {
          let e = Math.atan2(u, l),
            t = Math.min(innerWidth, innerHeight) * 0.34;
          ((r.style.left = o + Math.cos(e) * t + `px`),
            (r.style.top = s + Math.sin(e) * t + `px`),
            (p.style.display = ``),
            (p.style.transform = `rotate(${e + Math.PI / 2}rad)`));
        }
        const distance=Math.hypot(i.x-t.x,i.z-t.z);
        let m = f==='boss'||f==='shrine' ? bossDistanceText(distance) : c(`{n} m`, { n:Math.round(distance) });
        r.children[2].textContent !== m && (r.children[2].textContent = m);
      }
    }
    leftAt = 0;
    leftKey = ``;
    leftoverHud(e) {
      let t = performance.now();
      if (t - this.leftAt < 500) return;
      this.leftAt = t;
      let n = new Map();
      for (let t of bI(e)) n.set(BS(t), (n.get(BS(t)) ?? 0) + 1);
      let r = [...n].join(`,`);
      if (r === this.leftKey) return;
      this.leftKey = r;
      let i = this.els,
        a = facilityMapArt;
      ((i.left.style.display = n.size ? `` : `none`),
        $(i.left).append(
          X(`small`, {}, c(`Por usar`)),
          ...[...n].map(([e, t]) =>
            X(`span`, { class: `lp-i`, title: a[e]?.name ?? `` }, pI(e, 22), X(`b`, {}, `×${t}`)),
          ),
        ));
    }
    showMap(e, t = !1) {
      let n = () => {
          (N.click(), t ? this.showPause(e) : e.resume());
        },
        r = DI(e, this.mapSeen, n, this.marks);
      (this.modal(r.el).classList.add(`bm-modal`), (this.pauseBack = n));
    }
    mapOpen() {
      return !!this.modalEl?.querySelector(`.bigmap`);
    }
    peekMap(e, t) {
      (this.peekEl?.remove(),
        (this.peekEl = null),
        t &&
          ((this.peekEl = DI(e, this.mapSeen, () => {}, this.marks, !0).el), this.hudEl.append(this.peekEl)));
    }
    lastParty = ``;
    party(e) {
      let t = this.els,
        n = e.allies.list,
        r = 1 + 0.5 * (e.player.items.get(`poke-doll`) ?? 0),
        i = n.map((e) => `${e.slot}:${e.bond}`).join(`,`) + `:` + r;
      if (i !== this.lastParty) {
        ((this.lastParty = i), $(t.party));
        for (let e of n) t.party.append(this.allyChip(e, r));
      }
    }
    allyChip(e, t) {
      let n = Nm(e.types[0], e.shiny, t),
        r = X(
          `div`,
          {
            class: `ally` + (e.shiny ? ` shiny` : ``),
            title: e.shiny
              ? c(`{name} · Compañero variocolor · {role}`, { name: e.name, role: n })
              : c(`{name} · Alfa de apoyo · {role}`, { name: e.name, role: n }),
          },
          X(`div`, { class: `ally-pt` }, ZI(e.species, e.shiny)),
          X(
            `div`,
            { class: `ally-tx` },
            X(`b`, {}, e.name, e.shiny ? X(`em`, {}, c(`Variocolor`)) : X(`em`, {}, c(`Alfa`))),
            X(`small`, {}, n),
            X(`div`, { class: `ally-bond` }, ...km.map((t, n) => X(`i`, { class: n < e.bond ? `on` : `` }))),
          ),
        );
      return (r.style.setProperty(`--tc`, YC(Ni[e.types[0]])), r);
    }
    showParty(e, t, n) {
      fullParty({hud:this,party:e.allies.list,incoming:t,choose:n,role:type=>jm[type].label});
      e.cry(t.species);
    }
    showShinySwap(e, t, n, r, i) {
      e.cry(n.species);
      return showReviewCompanion({hud:this,current:t,incoming:n,dust:r,done:i,
        portrait:species=>ZI(species,!0),typeBadge:XC,role:type=>Nm(type,!0)});
    }
    modal(...e) {
      this.touch.letGo();
      this.clearWorldLabels();
      let t = !!this.modalEl?.isConnected;
      if (
        (this.hideModal(),
        (this.toastsEl.hidden=true),
        (this.modalEl = X(`div`, { class: `modal` }, ...e)),
        (HI.opened = performance.now()),
        (HI.lockMs = t ? 150 : NI),
        !t)
      )
        HI.held = new Set(Qo());
      else for (let e of [...HI.held]) Qo().includes(e) || HI.held.delete(e);
      let n = performance.now(),
        r = HI.lockMs,
        i = !1,
        a = !1,
        o = (e) => {
          let o = performance.now() - n;
          if (!e.isTrusted) return;
          if (e.type === `click` && e.detail === 0) {
            o < r && (e.stopPropagation(), e.preventDefault());
            return;
          }
          let s = uo && !t,
            c = s ? PI : jI,
            l = s ? PI : MI;
          if (e.type === `pointerdown` || e.type === `mousedown` || e.type === `touchstart`)
            o >= l ? ((i = !0), (a = !1)) : (a = !0);
          else if (
            s &&
            a &&
            (e.type === `click` || e.type === `pointerup` || e.type === `mouseup` || e.type === `touchend`)
          ) {
            (e.stopPropagation(), e.preventDefault(), e.type === `click` && (a = !1));
            return;
          }
          o < c && !i && (e.stopPropagation(), e.preventDefault());
        };
      for (let e of [`pointerdown`, `pointerup`, `mousedown`, `mouseup`, `touchstart`, `touchend`, `click`])
        this.modalEl.addEventListener(e, o, !0);
      (this.root.append(this.modalEl), Zo());
      let s = this.modalEl,
        c = { ArrowUp: `up`, ArrowDown: `down`, ArrowLeft: `left`, ArrowRight: `right` },
        l = new Set(),
        u = (e) => {
          if (!s.isConnected) {
            removeEventListener(`keydown`, u);
            return;
          }
          if (e.code === `Space` && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? ``)) {
            e.preventDefault();
            return;
          }
          let t = c[e.code];
          if (t) {
            if (!e.repeat) l.add(e.code);
            else if (!l.has(e.code)) {
              e.preventDefault();
              return;
            }
          }
          let n = e.target?.tagName;
          t &&
            n !== `INPUT` &&
            n !== `SELECT` &&
            n !== `TEXTAREA` &&
            !e.defaultPrevented &&
            (e.preventDefault(), Ga(t));
        };
      addEventListener(`keydown`, u);
      let d = (e) => {
        s.isConnected
          ? e.code === `Space` &&
            !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? ``) &&
            e.preventDefault()
          : removeEventListener(`keyup`, d, !0);
      };
      addEventListener(`keyup`, d, !0);
      let f = (e) => {
        s.isConnected ? HI.held.delete(e.code) : removeEventListener(`keyup`, f, !0);
      };
      return (addEventListener(`keyup`, f, !0), this.modalEl);
    }
    hideModal() {
      (nO(), this.modalEl?.remove(), (this.modalEl = null), (this.pauseBack = null));
      this.toastsEl.hidden=false;
    }
    hasModal() {
      return !!this.modalEl?.isConnected;
    }
    itemTip(e, t) {
      let n = Zb(t),
        r = e.player.items.get(t) ?? 0;
      return X(
        `div`,
        { class: `tt-card`, style: { "--tc": aw[n.rarity] } },
        X(
          `div`,
          { class: `tt-head` },
          Q(t),
          X(
            `div`,
            {},
            X(`b`, {}, n.name),
            X(`small`, {}, `${Le[n.rarity]} · ×${r}`),
          ),
        ),
        X(`p`, {}, n.desc),
        this.affects(
          e,
          (sn.get(t)?.mods ?? []).map((e) => e.stat),
        ),
      );
    }
    affects(e, t) {
      let n = Xb(e, t);
      return n
        ? X(
            `div`,
            { class: `affects` + (n.length ? `` : ` none`) },
            n.length ? c(`Afecta a: {list}`, { list: n.join(` · `) }) : c(`Ninguno de tus ataques lo usa`),
          )
        : null;
    }
    offerCard(e, t, n, r) {
      let i = Wb(e, t),
        a = aw[t.rarity],
        o = X(
          `div`,
          { class: `top` },
          X(`span`, { class: `rar` }, t.kind === `newMove` ? c(`Movimiento`) : Le[t.rarity]),
          X(
            `span`,
            { class: `kind` },
            t.kind === `newMove` ? c(`NUEVO`) : t.kind === `newVit` ? c(`NUEVA`) : c(`MEJORA`),
          ),
          i.icon.startsWith(`type:`) ? ZC(i.icon.slice(5)) : Q(i.icon.slice(5)),
        );
      t.rarity >= 2 && o.style.setProperty(`--shine`, `1`);
      let s = [];
      if (t.kind === `newMove`) {
        let e = O_(t.id);
        s.push(
          X(
            `div`,
            { class: `row` },
            XC(e.type),
            X(
              `span`,
              { class: `sub` },
              `${e.cls === `physical` ? c(`Físico`) : c(`Especial`)} · ${g_[e.arch].label}`,
            ),
          ),
        );
      }
      let l = t.kind === `newVit` || t.kind === `upVit` ? this.affects(e, [Ne.get(t.vit).stat]) : null,
        u = t.kind === `upMove` ? e.player.moves[t.slot] : null;
      u &&
        s.push(
          X(
            `div`,
            { class: `ban-warn` },
            c(`{name} no volverá a mejorar en esta partida: se queda en Nv. {lvl}.`, {
              name: u.def.name,
              lvl: u.level,
            }),
          ),
        );
      let d = X(
        `button`,
        { class: `card offer`, style: { "--i": n }, onclick: r },
        o,
        X(
          `div`,
          { class: `bd` },
          X(`h3`, {}, i.title),
          X(`div`, { class: `sub` }, i.sub),
          ...s,
          t.kind === `newMove` ? X(`p`, {}, i.lines[0]) : X(`ul`, {}, ...i.lines.map((e) => X(`li`, {}, e))),
          l,
          xD(e, t),
          X(`div`, { class: `key` }, `[${n + 1}]`),
        ),
      );
      return (d.style.setProperty(`--rc`, t.kind === `newMove` ? YC(Ni[i.type ?? `normal`]) : a), d);
    }
    buildMini(e) {
      let t = e.player,
        n = X(`div`, {
          class: `row`,
          style: { flexWrap: `wrap`, justifyContent: `center`, maxWidth: `900px` },
        });
      t.moves.forEach((t) => {
        t &&
          n.append(
            X(
              `div`,
              { class: `chip`, style: { background: YC(Ni[t.def.type]) } },
              t.def.fusion
                ? `${t.def.name} ★${t.level}`
                : c(`{name} Nv.{lvl}`, { name: t.def.name, lvl: t.level }),
              ED(e, t.def.id),
            ),
          );
      });
      for (let [e, r] of t.vitamins)
        n.append(
          X(`div`, { class: `chip`, style: { background: `#6a5aa8` } }, `${Ne.get(e)?.name} ${r.level}`),
        );
      return n;
    }
    showItem(e, t, n) {
      let r = Zb(t),
        i = aw[r.rarity],
        a = X(
          `div`,
          { class: `card`, style: { cursor: `default`, width: `300px` } },
          X(
            `div`,
            { class: `top`, style: { height: `140px` } },
            X(`span`, { class: `rar` }, Le[r.rarity]),
            Q(t),
          ),
          X(
            `div`,
            { class: `bd` },
            X(`h3`, {}, r.name),
            X(`p`, { style: { fontSize: `16px` } }, r.desc),
            this.affects(
              e,
              (sn.get(t)?.mods ?? []).map((e) => e.stat),
            ),
          ),
        );
      (a.style.setProperty(`--rc`, i), r.rarity >= 2 && a.firstChild.style.setProperty(`--shine`, `1`));
      let o = PS(e, r.rarity),
        u = !1,
        d = (e) => {
          u || ((u = !0), removeEventListener(`keydown`, m), n(e));
        },
        f = (e) => (uo ? null : X(`kbd`, {}, e)),
        p = this.modal(
          X(`h1`, { class: `small` }, c(`¡Has encontrado un objeto!`)),
          a,
          X(
            `div`,
            { class: `actions` },
            X(
              `button`,
              { class: `btn green big`, onclick: () => d(!0) },
              c(`Coger`),
              Da ? X(`kbd`, { "data-nokbd": `1` }, ia(`confirm`)) : f(ta(`interact`)),
            ),
            X(`button`, { class: `btn ghost`, onclick: () => d(!1) }, c(`Vender (+{n} ₽)`, { n: o }), f(`V`)),
          ),
        ),
        m = (t) => {
          if (!p.isConnected || u) {
            removeEventListener(`keydown`, m);
            return;
          }
          if (t.repeat || (t.code === `Enter` && document.activeElement instanceof HTMLButtonElement)) return;
          let n = t.code === Xi(`interact`) || t.code === `Enter` || (t.code !== `KeyV` && null);
          n != null && (e.input.pressed.delete(`KeyE`), d(n));
        };
      (p.append(sO(e)),
        lO(e, () => p.isConnected && !u),
        setTimeout(() => {
          u || addEventListener(`keydown`, m);
        }, 350),
        N.cry(52, 0));
    }
    showItemChoice(e, t, n) {
      let r = X(`div`, { class: `cards` }),
        i = !1,
        a = (e) => {
          i || ((i = !0), removeEventListener(`keydown`, l), n(e));
        };
      t.forEach((t, n) => {
        let i = Zb(t),
          o = e.player.items.get(t) ?? 0,
          l = X(
            `button`,
            { class: `card`, onclick: () => a(t) },
            X(`div`, { class: `top` }, X(`span`, { class: `rar` }, Le[i.rarity]), Q(t)),
            X(
              `div`,
              { class: `bd` },
              X(`h3`, {}, i.name),
              X(`p`, {}, i.desc),
              this.affects(
                e,
                (sn.get(t)?.mods ?? []).map((e) => e.stat),
              ),
              X(`small`, { class: `cap` }, `持有 ×${o}`),
              X(`div`, { class: `key` }, `[${n + 1}]`),
            ),
          );
        (l.style.setProperty(`--rc`, aw[i.rarity]), r.append(l));
      });
      let o = Math.min(...t.map((t) => PS(e, sn.get(t)?.rarity ?? 0))),
        s = this.modal(
          X(`h1`, { class: `small` }, c(`¡Has encontrado objetos!`)),
          X(`div`, { class: `help` }, c(`Elige uno`)),
          r,
          X(
            `div`,
            { class: `actions` },
            X(`button`, { class: `btn ghost`, onclick: () => a(null) }, c(`Ninguno (+{n} ₽)`, { n: o })),
          ),
          sO(e),
        );
      lO(e, () => s.isConnected);
      let l = (e) => {
        if (!s.isConnected || i) {
          removeEventListener(`keydown`, l);
          return;
        }
        let n = VI(e);
        n >= 1 && n <= t.length && a(t[n - 1]);
      };
      (setTimeout(() => {
        i || addEventListener(`keydown`, l);
      }, 350),
        N.cry(52, 0));
    }
    showShop(e, t) {
      let n = () => {
        let r = e.shop?.stock ?? [],
          i = X(`div`, { class: `cards` });
        const addOffer=(list,key,count,action,status,selling=false)=>{
          const item=Zb(key),def=sn.get(key),applies=selling?null:this.affects(e,(def?.mods??[]).map(m=>m.stat));
          list.append(shopOffer({key,name:item.name,picture:Q(key),quality:itemOfferQuality(item.rarity),
            planned:!selling&&planIncludes(runPlan(e),'items',key),effects:selling?[]:[item.desc,...(applies?[applies.textContent]:[])],
            owned:'持有 ×'+count,status,action}));
        };
        for(const lot of r){
          const short=e.gold<lot.price;
          const state=lot.sold?'已售罄':short?'余额不足':'';
          const status=X('small',{class:'zx-shop-status'},state);
          const buy=X('button',{type:'button',class:'zx-review-button primary zx-shop-action',disabled:lot.sold||short?'true':null,
            'data-shop-buy':lot.key,'aria-label':'购买'+Zb(lot.key).name+'，花费'+P(lot.price)+(state?'，'+state:''),
            onclick:()=>{if(!buy.isConnected||lot.sold)return;e.buyShopItem(lot)?(N.coin(),n()):N.deny();}},X('span',{},'购买'),shopAmount(P(lot.price)));
          addOffer(i,lot.key,e.player.items.get(lot.key)??0,buy,status);
        }
        const a=X('div',{class:'zx-sale-list'});
        for(const [key,count] of e.player.items){
          if(count<1)continue;
          const price=PS(e,sn.get(key)?.rarity??0);
          let timer;
          const status=X('small',{class:'zx-shop-status','aria-live':'polite'},'');
          const saleLabel='出售一件'+Zb(key).name+'，获得'+P(price);
          const disarm=()=>{clearTimeout(timer);sell.classList.remove('armed');status.textContent='';sell.setAttribute('aria-label',saleLabel);};
          const sell=X('button',{type:'button',class:'zx-review-button zx-shop-action','data-shop-sell':key,
            'aria-label':saleLabel,onclick:()=>{
              if(!sell.isConnected||!(e.player.items.get(key)>0))return;
              if(sell.classList.contains('armed')){
                disarm();e.player.removeItem(key);e.addGold(price);e.econ.sold++;N.coin();n();return;
              }
              a.querySelectorAll('.armed').forEach(other=>other.dispatchEvent(new Event('disarm')));
              N.click();sell.classList.add('armed');status.textContent='再次点击确认';sell.setAttribute('aria-label','确认'+saleLabel);
              timer=window.setTimeout(disarm,3000);
            }},X('span',{},'出售'),shopAmount(P(price),{credit:true}));
          sell.addEventListener('disarm',disarm);
          addOffer(a,key,count,sell,status,true);
        }
        let o = this.modalEl?.classList.contains('shop-modal') ? this.modalEl : null,
          s = o?.querySelector('.zx-review-content')?.scrollTop ?? 0,
          u = e.rerollCost(),
          d = X(
            `button`,
            {
              class: `btn ghost small shop-reroll`,
              disabled: e.gold < u ? `true` : null,
              onclick: () => {
                e.rerollShop() ? (N.coin(), n()) : N.deny();
              },
            },
            shopAmount(P(u),{caption:'刷新货品'}),
          );
        r.length ||
          i.append(X(`p`, { class: `help` }, c(`«Ya lo tienes todo, miau. Aquí no me queda nada para ti.»`)));
        let f = this.modal(
          X(`h1`, { class: `small` }, `道具商店 · ${P(e.gold)}`),
          d,
          i,
          e.endless
            ? null
            : X(
                `div`,
                { class: `help` },
                c(`Si le compras mucho sin abrir Poké Balls, su próxima tienda saldrá más cara.`),
              ),
          e.player.items.size
            ? X(
                `div`,
                { class: `col`, style: { alignItems: `center` } },
                X(`div`, { class: `help` }, c(`Vender tus objetos:`)),
                a,
              )
            : null,
          cO(e),X(`button`, { class:'btn shop-exit primary', 'data-action':'leave-shop', onclick:t }, '离开商店'),
        );
        (shopShelves(styleReviewDialog(f,`shop-modal`,`zx-review-shop`),o?.dataset.shopView),
          (f.querySelector('.zx-review-content').scrollTop = s));
      };
      (n(), lO(e, () => !!this.modalEl?.isConnected && this.modalEl.classList.contains(`shop-modal`), !1));
      let r = (e) => {
        !this.modalEl?.isConnected || !this.modalEl.classList.contains(`shop-modal`)
          ? removeEventListener(`keydown`, r)
          : e.code !== `Escape` ||
            e.repeat ||
            (e.preventDefault(), N.click(), removeEventListener(`keydown`, r), t());
      };
      (setTimeout(() => addEventListener(`keydown`, r), 250), e.cry(52));
    }
    prepareDittoPictures(keys) {
      const pictures = this.dittoPictures ??= new Map();
      for (const key of keys) {
        if (pictures.has(key)) continue;
        const picture = new Image();
        pictures.set(key,picture);
        picture.alt = Zb(key).name;
        picture.draggable = false;
        picture.onerror = () => pictures.delete(key);
        picture.src = Zt(k.items[key]?.icon || `items/${key}.png`);
      }
      return pictures;
    }
    showDitto(e, keys, t) {
      const pictures = this.prepareDittoPictures(keys);
      this.dittoPictures = null;
      const list = X('div', { class: 'zx-review-content zx-item-body' });
      for (const key of keys) {
        const count=e.player.items.get(key);
        const item=Zb(key);
        const card=X('button',{type:'button',onclick:()=>{if(card.isConnected)t(key);}});
        list.append(itemOffer(card,{key,name:item.name,picture:pictures.get(key),quality:itemOfferQuality(item.rarity),
          effects:[item.desc],held:'持有 ×'+count}));
      }
      const pane = this.modal(
        X('h1', { class: 'small' }, '道具复制'),
        list,
        X('button', { class: 'btn ghost', onclick: () => t(null) }, '返回'),
      );
      styleReviewDialog(pane,'zx-review-copy','zx-item-pick');
      e.cry(132);
    }
    showForget(e, t) {
      let n = () => {
        let r = e.player,
          i = X(`div`, { class: `list`, style: { width: `min(620px, 100%)` } });
        r.moves.forEach((t, a) => {
          if (!t) return;
          let o = r.moves.filter(Boolean).length;
          i.append(
            X(
              `div`,
              { class: `item-row` },
              ZC(t.def.type),
              X(
                `div`,
                { class: `grow` },
                X(
                  `h4`,
                  {},
                  t.def.fusion
                    ? `${t.def.name} · ★${t.level}`
                    : c(`{name} · Nv. {lvl}`, { name: t.def.name, lvl: t.level }),
                ),
                X(`div`, { class: `muted` }, $_(t.def)),
              ),
              X(
                `button`,
                {
                  class: `btn red small`,
                  disabled: o <= 1 ? `true` : null,
                  onclick: () => {
                    if(r.moves.filter(Boolean).length<=1)return;
                    (r.forgetMove(a), e.addGold(t.level * 8 * e.stage), n());
                  },
                },
                c(`Olvidar (+{n} ₽)`, { n: t.level * 8 * e.stage }),
              ),
            ),
          );
        });
        for (let [t, a] of r.vitamins) {
          let o = Ne.get(t);
          i.append(
            X(
              `div`,
              { class: `item-row` },
              Q(o.icon, `ic pix`),
              X(
                `div`,
                { class: `grow` },
                X(`h4`, {}, c(`{name} · Nv. {lvl}`, { name: o.name, lvl: a.level })),
                X(`div`, { class: `muted` }, o.desc),
              ),
              X(
                `button`,
                {
                  class: `btn red small`,
                  onclick: () => {
                    (r.vitamins.delete(t), r.recompute(), e.addGold(a.level * 6 * e.stage), n());
                  },
                },
                c(`Olvidar (+{n} ₽)`, { n: a.level * 6 * e.stage }),
              ),
            ),
          );
        }
        if(r.moves.filter(Boolean).length<=1)i.append(X(`p`,{class:`zx-review-empty`},`最后一个招式不可遗忘。`));
        let a = this.modal(
          X(`h1`, { class: `small` }, `遗忘招式`),
          X(
            `div`,
            {
              class: `panel scroll`,
              style: { padding: `14px`, maxHeight: `min(60vh, calc(100dvh - 190px))` },
            },
            i,
          ),
          X(`button`, { class: `btn shop-exit`, onclick: t }, `返回`),
        );
        (styleReviewDialog(a,`shop-modal`,`zx-review-forget`),
          a.addEventListener(`click`, (e) => {
            e.target === a && t();
          }));
      };
      (n(), e.cry(97));
    }
    showBlessing(e, t, n, r, i) {
      let a = X(`div`, { class: `cards` });
      const recipient = e.player.speciesId;
      n.forEach((e, t) => {
        let n = X(
          `button`,
          { class: `card`, style: { minHeight: `200px` }, onclick: () => r(e) },
          X(`div`, { class: `top` }, X(`span`, { class: `rar` }, Le[e.rarity]), rw(recipient)),
          X(`div`, { class: `bd` }, X(`h3`, {}, e.label), X(`div`, { class: `key` }, `[${t + 1}]`)),
        );
        (n.style.setProperty(`--rc`, aw[e.rarity]), a.append(n));
      });
      let o = this.modal(
        X(`h1`, { class: `small` }, t),
        X(`div`, { class: `help` }, i ?? c(`Elige una bendición para esta partida`)),
        a,
        sO(e),
      );
      lO(e, () => o.isConnected);
      let s = !1,
        l = (e) => {
          if (!o.isConnected || s) {
            removeEventListener(`keydown`, l);
            return;
          }
          let t = VI(e);
          t >= 1 && t <= n.length && ((s = !0), removeEventListener(`keydown`, l), r(n[t - 1]));
        };
      setTimeout(() => addEventListener(`keydown`, l), 350);
    }
    showBranch(e, t, n) {
      let r = X(`div`, { class: `cards` });
      for (let e of t) {
        let t = k.get(e),
          i = X(
            `button`,
            { class: `card`, style: { width: `180px`, minHeight: `230px` }, onclick: () => n(e) },
            X(`div`, { class: `top`, style: { height: `120px` } }, rw(e)),
            X(
              `div`,
              { class: `bd` },
              X(`h3`, {}, t.name),
              X(
                `div`,
                { class: `row`, style: { flexWrap: `wrap`, gap: `4px` } },
                ...t.types.map((e) => XC(e)),
              ),
            ),
          );
        (i.style.setProperty(`--rc`, YC(Ni[t.types[0]])), r.append(i));
      }
      (this.modal(
        X(`h1`, {}, '风 · 选择进阶路线'),
        X(
          `div`,
          { class: `help`, style: { fontSize: `15px` } },
          '攻速路线：风 → 讽 → 疯。移速路线：风 → 飒 → 飙。',
        ),
        r,
      ),
        e.cry(e.player.speciesId));
    }
    showEvolution(e, t, n = EVOLUTION_REVEAL) {
      let r = X(
        `div`,
        { class: `evo`, style: { "--evo-d": `${n}s` } },
        X(`div`, { class: `evo-rays` }),
        X(`h2`, {}, c(`¿Eh? ¡{name} está evolucionando!`, { name: k.get(e).name })),
        X(`div`, { class: `evo-white` }),
      );
      (r.style.setProperty(`--evo-d`, `${n}s`),
        this.hudEl.classList.add(`cinematic`),
        this.hudEl.append(r),
        setTimeout(
          () => {
            (r.remove(), this.uncinematic());
          },
          n * 1e3 + 4e3,
        ));
    }
    bossIntro(e, t, n, word, role) {
      let r = k.get(e),
        i = t ? `#e8a81a` : `#ff4a8a`,
        a = X(
          `div`,
          { class: `bossintro` + (t ? ` legend` : ``), style: { "--c": i, "--d": `${n}s` } },
          X(`div`, { class: `lb top` }),
          X(`div`, { class: `lb bottom` }),
          X(
            `div`,
            { class: `plate` },
            X(`div`, { class: `evo-portrait` }, glyphPreview(e,.75,'pix',word)),
            X(
              `div`,
              {},
              X(`p`, {}, role),
              X(`h1`, {}, word),
              X(`div`, { class: `row evo-types` }, ...r.types.map((e) => XC(e))),
            ),
          ),
        );
      (a.style.setProperty(`--c`, i),
        a.style.setProperty(`--d`, `${n}s`),
        this.hudEl.classList.add(`cinematic`),
        this.hudEl.append(a),
        setTimeout(
          () => {
            (a.remove(), this.uncinematic());
          },
          n * 1e3 + 4e3,
        ));
    }
    endCinematic() {
      this.dragonChant?.end();
      this.dragonChant = null;
      (this.hudEl.querySelectorAll(`.evo, .bossintro`).forEach((e) => e.remove()), this.uncinematic());
    }
    uncinematic() {
      this.hudEl.querySelector(`.evo, .bossintro, .zx-dragon-chant`) || this.hudEl.classList.remove(`cinematic`);
    }
    evolutionReveal(e, t, n, r) {
      let i = k.get(t),
        a = YC(Ni[i.types[0]]),
        o = X(
          `div`,
          { class: `evo-reveal`, style: { "--c": a } },
          X(`div`, { class: `evo-burst` }),
          X(`div`, { class: `evo-portrait` }, rw(t)),
          X(
            `div`,
            { class: `evo-card` },
            X(`p`, {}, c(`¡Enhorabuena! {name} ha evolucionado a`, { name: k.get(e).name })),
            X(`h1`, {}, i.name),
            X(`div`, { class: `row evo-types` }, ...i.types.map((e) => XC(e))),
            X(
              `div`,
              { class: `evo-stat` },
              c(`PS máx.`) + ` `,
              X(`b`, {}, `${n}`),
              X(`span`, { class: `evo-arrow` }),
              X(`b`, { class: `up` }, `${r}`),
            ),
          ),
        );
      (o.style.setProperty(`--c`, a),
        this.hudEl.querySelectorAll(`.evo-reveal`).forEach((e) => e.remove()),
        this.hudEl.append(o),
        setTimeout(() => o.remove(), 2600));
    }
    pauseEsc() {
      let e = this.pauseBack;
      return e ? (e(), !0) : !1;
    }
    savingEl = null;
    wallet(e) {
      let t = this.els,
        n = e.interactables.chestCost(),
        r = e.gold >= n,
        i = `${e.gold}|${n}`;
      if (t.gold.dataset.k === i) return;
      ((t.gold.dataset.k = i), (t.gold.children[1].textContent = P(e.gold)));
      let a = t.gold.lastChild;
      ((a.lastChild.textContent = P(n)),
        a.classList.toggle(`ok`, r),
        (a.style.display = e.sanctuary ? `none` : ``));
    }
    towerClock(e) {
      let t = this.els,
        n = e.tower;
      ((t.timer.textContent = Ys(e.time)),
        t.timer.classList.remove(`final`),
        t.clock.dataset.k !== `tower` &&
          ((t.clock.dataset.k = `tower`), t.clock.classList.remove(`ahead`, `behind`)));
      let r = n.where();
      (t.clock.lastChild.textContent !== r && (t.clock.lastChild.textContent = r),
        (t.mile.style.display = n.roof ? `none` : ``));
      let i = n.state === `guard` || n.state === `clear` ? n.def.guardian.id : n.beyond ? 94 : n.def.pool[0],
        a = `${n.floor}|${n.state}|${n.wave}`;
      t.mile.dataset.k !== a &&
        ((t.mile.dataset.k = a),
        $(t.mile.firstChild).append(rw(i)),
        t.mile.style.setProperty(
          `--c`,
          n.state === `clear` ? `#ffd23a` : n.state === `guard` ? `#ff4a8a` : `#b08aff`,
        ),
        (t.mile.lastChild.firstChild.textContent =
          n.state === `clear`
            ? c(`¡Piso superado!`)
            : n.state === `guard`
              ? c(`Oleada 3/3 · Guardián`)
              : n.state === `intro`
                ? c(`Se acerca la oleada 1/3`)
                : n.state === `break`
                  ? c(`Respira · oleada {n}/3`, { n: n.wave + 1 })
                  : c(`Oleada {n}/3`, { n: n.wave + 1 })));
      let o =
        n.state === `clear`
          ? c(`Ofrenda en el altar · escalera al norte`)
          : n.state === `wave` || n.state === `guard`
            ? c(`Quedan {n}`, { n: n.left })
            : c(`Prepárate`);
      t.mile.lastChild.lastChild.textContent !== o && (t.mile.lastChild.lastChild.textContent = o);
      for (let e of [t.siege, t.shop, t.comet, t.migr, t.goal]) e.style.display = `none`;
    }
    endlessClock(e) {
      let t = this.els,
        n = e.endless,
        r = e.time;
      ((t.timer.textContent = Ys(r)), t.timer.classList.toggle(`final`, n.night));
      let i = e.meta.profile.endless[e.biome.id],
        a = i ? String(r >= i.time) : `none`;
      (t.clock.dataset.k !== a &&
        ((t.clock.dataset.k = a),
        t.clock.classList.toggle(`ahead`, !!i && r >= i.time),
        t.clock.classList.remove(`behind`),
        i &&
          r >= i.time &&
          t.clock.dataset.was === `false` &&
          (this.banner(
            c(`¡Nuevo récord!`),
            c(`Has superado tus {time} en {biome}`, { time: Ys(i.time), biome: e.biome.name }),
            `#7dffa8`,
          ),
          N.power()),
        (t.clock.dataset.was = a)),
        (t.clock.lastChild.textContent = i
          ? r >= i.time
            ? c(`¡Récord superado! ({time})`, { time: Ys(i.time) })
            : c(`Récord {time} · faltan {left}`, { time: Ys(i.time), left: Ys(i.time - r) })
          : c(`Sin récord en este mapa`)));
      let o = n.next,
        s = e.boss.alive || e.mewtwo.active;
      const word = enemySpeciesWord(o.species, R.Boss);
      t.mile.style.display = ``;
      let l = `${o.n}|${s}`;
      t.mile.dataset.k !== l &&
        ((t.mile.dataset.k = l),
        $(t.mile.firstChild).append(glyphPreview(o.species,.75,'pix',word)),
        t.mile.style.setProperty(
          `--c`,
          o.kind === `guardian` ? `#ff4a8a` : o.kind === `mewtwo` ? `#c08aff` : `#ffd23a`,
        ),
        (t.mile.lastChild.firstChild.textContent = s
          ? c(`¡Hito en curso!`)
          : o.kind === `guardian`
            ? c(`Hito {n} · Guardián`, { n: o.n })
            : c(`Hito {n} · Legendario`, { n: o.n })));
      let u = s
        ? c(`Derrótalo`)
        : o.at > r
          ? c(`{name} en {time}`, { name: word, time: Ys(o.at - r) })
          : c(`{name}: ¡ya llega!`, { name: word });
      t.mile.lastChild.lastChild.textContent !== u && (t.mile.lastChild.lastChild.textContent = u);
      let d = Math.round((1 - n.siegeMult) * 100),
        f = String(d);
      t.siege.dataset.k !== f &&
        ((t.siege.dataset.k = f),
        (t.siege.style.display = d > 0 ? `` : `none`),
        (t.siege.children[1].textContent = c(`−{n} % daño`, { n: d })));
      for (let [e, r] of [
        [t.shop, n.meowthHere],
        [t.comet, n.cometHere],
        [t.migr, n.portalHere],
      ])
        ((e.style.display = r == null ? `none` : ``),
          r != null && (e.children[1].textContent = c(`{n} s`, { n: Math.ceil(r) })));
    }
    goalRun = null;
    goalAt = -1;
    goalNear = new Set();
    killGoals(e) {
      let t = e.endless,
        n = !!e.coop,
        r = t ? Math.floor(e.time) : e.coop ? e.coop.teamKills : e.stats.kills;
      if (
        (this.goalRun !== e && ((this.goalRun = e), (this.goalAt = -1), this.goalNear.clear()),
        r === this.goalAt)
      )
        return;
      let i = e.meta.ticket?.targets,
        a = this.els,
        o = yn(Oe(t ? `endless` : `kills`, e.biome.id, e.tier)),
        s = (e) => (e == null ? null : t ? qe(e).time : e),
        l = (e) => (t ? Ys(e) : P(e)),
        u = (i?.rivals ?? []).map((e) => ({ ...e, v: s(e.value) })),
        d = (e) => u.find((t) => t.rank === e),
        f = (e) => (n ? void 0 : wt.findIndex((t) => t.max === e) + 1 || void 0),
        p = [];
      if (i) {
        let e = s(i.weekBest),
          t = s(i.cutoff),
          r = s(i.top1),
          a = d(o),
          l = d(1);
        (e &&
          p.push(
            n
              ? { v: e, what: c(`Récord de este equipo`), done: c(`¡Nuevo récord del equipo!`), big: !0 }
              : {
                  v: e,
                  what: c(`Tu récord de la temporada`),
                  done: c(`¡Nuevo récord de la temporada!`),
                  big: !0,
                },
          ),
          t &&
            p.push({
              v: t,
              what: c(`Entrar en el top {top}`, { top: o }),
              done: c(`¡Entras en el top {top} de la temporada!`, { top: o }),
              sub: a?.name,
              big: !0,
              species: a?.species,
              name: a?.name,
              rank: o,
              lvl: f(o),
            }),
          r &&
            p.push({
              v: r,
              what: c(`Ser el n.º 1`),
              done: c(`¡Eres el n.º 1 de la temporada!`),
              sub: l?.name,
              big: !0,
              species: l?.species,
              name: l?.name,
              rank: 1,
              lvl: f(1),
            }));
        for (let t of u) {
          if (t.rank === 1 || t.rank === o || (e != null && t.v <= e)) continue;
          let r = !n && wt.some((e) => e.max === t.rank && e.max < o);
          p.push(
            r
              ? {
                  v: t.v,
                  what: c(`Entrar en el top {top}`, { top: t.rank }),
                  done: c(`¡Entras en el top {top} de la temporada!`, { top: t.rank }),
                  sub: t.name,
                  big: !0,
                  species: t.species,
                  name: t.name,
                  rank: t.rank,
                  lvl: f(t.rank),
                }
              : {
                  v: t.v,
                  what: c(`Adelantar a`),
                  done: c(`Adelantas a {name} · ahora eres #{rank}`, { name: t.name, rank: t.rank }),
                  big: !1,
                  species: t.species,
                  name: t.name,
                  rank: t.rank,
                },
          );
        }
      }
      p.sort((e, t) => e.v - t.v);
      let m = this.goalAt;
      if (m >= 0) {
        let n = p.filter((e) => e.v > 0 && m <= e.v && r > e.v),
          i = n.filter((e) => e.big).pop();
        if (i) {
          let n = t
            ? `${e.biome.name} · ${Ys(r)}`
            : c(`{biome} · {n} bajas`, { biome: e.biome.name, n: P(r) });
          (this.banner(
            i.done,
            i.sub ? c(`Adelantas a {name} · {where}`, { name: i.sub, where: n }) : n,
            `#7dffa8`,
            i.species ? { species: i.species } : void 0,
          ),
            N.power());
        } else if (n.length) {
          let e = n[n.length - 1];
          (this.rivalToast(e.done, e.species), N.overtake());
        }
      }
      this.goalAt = r;
      let h = p.find((e) => r <= e.v),
        g = h ? (t ? 30 : Math.max(10, Math.ceil(h.v * 0.05))) : 0,
        _ = h ? h.v - r + 1 : 0;
      if (
        (h?.name &&
          m >= 0 &&
          !this.goalNear.has(h.v) &&
          _ <= g &&
          h.v - m + 1 > g &&
          (this.goalNear.add(h.v),
          this.rivalToast(
            c(t ? `¡A {n} de {name}!` : `¡A {n} bajas de {name}!`, { n: l(_), name: h.name }),
            h.species,
          )),
        (a.goal.style.display = i?.rivals ? `` : `none`),
        !i?.rivals)
      )
        return;
      let [v, y, b, x] = a.goal.children,
        [S, C, w] = y.children,
        [T, E] = C.children,
        ee = p.filter((e) => e.rank && r > e.v).reduce((e, t) => Math.min(e, t.rank), 1 / 0),
        D = s(i?.cutoff),
        O =
          ee < 1 / 0
            ? c(`Vas #{rank}`, { rank: ee })
            : n
              ? ``
              : D == null
                ? r > 0
                  ? c(`Dentro del top {top}`, { top: o })
                  : ``
                : r <= D
                  ? c(`Fuera del top {top}`, { top: o })
                  : ``,
        te = h ? p.filter((e) => e.v > h.v).slice(0, 1) : [],
        ne = h ? `${h.v}|${h.what}|${h.name ?? ``}|${O}` : `done|${O}`;
      if (a.goal.dataset.k !== ne) {
        let r = a.goal.dataset.k?.split(`|`).slice(0, 3).join(`|`) !== ne.split(`|`).slice(0, 3).join(`|`);
        ((a.goal.dataset.k = ne),
          a.goal.classList.toggle(`done`, !h),
          a.goal.classList.toggle(`tier`, !!h?.lvl),
          r && (a.goal.classList.remove(`kg-in`), a.goal.offsetWidth, a.goal.classList.add(`kg-in`)),
          (v.firstChild.textContent = An(i?.season ?? 0, n ? c(`Cooperativo`) : ``)),
          (v.lastChild.textContent = O),
          (v.lastChild.style.display = O ? `` : `none`),
          $(S).append(
            h?.lvl && !h.species ? QC(h.lvl, 34) : ZI(h?.species ?? e.player.speciesId),
            ...(h?.lvl && h.species
              ? [X(`span`, { class: `kg-badge` }, QC(h.lvl, 20))]
              : h?.rank
                ? [X(`span`, { class: `kg-rank` }, `#${h.rank}`)]
                : []),
          ),
          (T.textContent = h ? h.what : p.length ? c(`Lo has superado todo`) : c(`Aún no hay rivales`)),
          (E.textContent = h
            ? (h.name ??
              (h.rank ? c(`Top {top}`, { top: h.rank }) : t ? l(h.v + 1) : c(`{n} bajas`, { n: P(h.v + 1) })))
            : p.length
              ? c(`¡Vas el primero!`)
              : c(`¡Cualquier marca puntúa!`)),
          (E.title = E.textContent),
          (w.lastChild.textContent = h && !t ? c(`bajas`) : ``),
          (w.lastChild.style.display = h && !t ? `` : `none`),
          $(x).append(
            ...te.map((e) =>
              X(
                `div`,
                { class: `kg-row` },
                X(`small`, {}, c(`Después`)),
                X(`em`, {}, e.rank ? `#${e.rank}` : `·`),
                X(`span`, {}, e.name ?? (e.rank ? c(`Top {top}`, { top: e.rank }) : e.what)),
                X(`b`, {}, l(e.v + 1)),
              ),
            ),
          ),
          (x.style.display = te.length ? `` : `none`));
      }
      (a.goal.classList.toggle(`near`, !!h && _ <= g),
        (w.children[1].textContent = h ? l(_) : ``),
        (w.style.display = h ? `` : `none`),
        (b.firstChild.style.transform = `scaleX(${h ? Math.min(1, r / (h.v + 1)) : 1})`));
    }
    rivalToast(e, t) {
      let n = X(`div`, { class: `toast rival-toast` }, t ? ZI(t) : null, e);
      for (this.toastsEl.append(n); this.toastsEl.children.length > 4; ) this.toastsEl.firstChild.remove();
      setTimeout(() => {
        ((n.style.transition = `opacity .4s`), (n.style.opacity = `0`), setTimeout(() => n.remove(), 400));
      }, 3400);
    }
    saveFailed(e, n) {
      let r = X(`span`, {}, n ? t(n) : c(`Error desconocido.`)),
        i = X(`b`, {}, c(`No se ha podido guardar la partida`)),
        a = X(`div`, { class: `sm-note warn` }, Z(`lock`, 22), X(`div`, {}, i, r));
      if (!e.meta.hasPending()) return a;
      let o = X(
          `span`,
          {},
          c(
            `Tu partida está guardada en este dispositivo: se enviará sola en cuanto haya conexión, aunque cierres el juego.`,
          ),
        ),
        s = X(`button`, { class: `btn small blue` }, c(`Reintentar`));
      a.lastChild.append(o, s);
      let l = 8,
        u = 0,
        d = !1,
        f = () => {
          (clearTimeout(u),
            document.removeEventListener(`pb-saved`, f),
            (a.className = `sm-note`),
            $(a).append(
              Z(`check`, 22),
              X(
                `div`,
                {},
                X(`b`, {}, c(`Partida guardada`)),
                X(`span`, {}, c(`Tu progreso, tus capturas y tus variocolores ya están en tu cuenta.`)),
              ),
            ));
        };
      document.addEventListener(`pb-saved`, f);
      let p = async () => {
        if ((clearTimeout(u), !d && a.isConnected)) {
          ((d = !0), (s.disabled = !0));
          try {
            let n = await e.meta.retryPending();
            if (n.saved) {
              f();
              return;
            }
            if (!n.left) {
              (o.remove(),
                s.remove(),
                n.error && (r.textContent = t(n.error)),
                document.removeEventListener(`pb-saved`, f));
              return;
            }
          } catch {
          } finally {
            ((d = !1), (s.disabled = !1));
          }
          ((l = Math.min(120, l * 2)), (u = window.setTimeout(p, l * 1e3)));
        }
      };
      return (
        (s.onclick = () => {
          (N.click(), (l = 8), p());
        }),
        (u = window.setTimeout(p, l * 1e3)),
        a
      );
    }
    showPact(e, t, n) {
      const recipient = e.player.speciesId;
      let r = e.endless,
        i = e.tower,
        a = !1,
        o = (e) => {
          a || ((a = !0), n(e));
        },
        s = X(`div`, { class: `cards` });
      t.forEach((e, t) => {
        let n = r ? r.pacts.filter((t) => t === e.id).length : 0,
          a = X(
            `button`,
            { class: `card pact`, style: { "--rc": e.color }, onclick: () => o(e) },
            X(
              `div`,
              { class: `top` },
              X(
                `span`,
                { class: `rar` },
                i
                  ? c(`Maldición`)
                  : n
                    ? c(`Tienes {n}/{max}`, { n, max: e.max })
                    : e.max > 1
                      ? c(`Hasta {max}`, { max: e.max })
                      : c(`Único`),
              ),
              r ? rw(recipient) : Q(e.icon),
            ),
            X(
              `div`,
              { class: `bd` },
              X(`h3`, {}, e.name),
              X(`div`, { class: `pact-line boon` }, X(`small`, {}, c(`Ganas ahora`)), X(`b`, {}, e.boon)),
              X(
                `div`,
                { class: `pact-line bane` },
                X(`small`, {}, c(i ? `En el próximo piso` : `Para siempre`)),
                X(`b`, {}, e.bane),
              ),
              X(`div`, { class: `key` }, `[${t + 1}]`),
            ),
          );
        s.append(a);
      });
      let l = this.modal(
          X(`h1`, { class: `small` }, c(i ? `Una maldición te tienta...` : `Un pacto te tienta...`)),
          X(
            `div`,
            { class: `help` },
            i
              ? c(
                  `Piso {n} del Más Allá · Una maldición hace más duro el próximo piso y te da más Velas. Puedes rechazarlas`,
                  { n: i.floor + 1 },
                )
              : c(
                  `Hito {n} superado · {time} · Cada pacto te da poder ya a cambio de una maldición para el resto de la partida`,
                  { n: r?.beaten ?? 0, time: Ys(e.time) },
                ),
          ),
          s,
          X(
            `div`,
            { class: `actions` },
            X(`button`, { class: `btn ghost`, onclick: () => o(null) }, c(`Rechazar`), PN(`Esc`)),
          ),
        ),
        u = (e) => {
          if (!l.isConnected || a) {
            removeEventListener(`keydown`, u);
            return;
          }
          let n = VI(e);
          n >= 1 && n <= t.length
            ? (removeEventListener(`keydown`, u), o(t[n - 1]))
            : e.key === `Escape` && (e.stopPropagation(), removeEventListener(`keydown`, u), o(null));
        };
      setTimeout(() => addEventListener(`keydown`, u), 350);
    }
    showTrade(e, t, n) {
      let r = !1,
        i = (e) => {
          r || ((r = !0), n(e));
        },
        a = X(`div`, { class: `cards` });
      t.offers.forEach((e, t) => {
        let n = X(
          `button`,
          {
            class: `card pact trade`,
            style: { "--rc": e.color },
            onclick: () => {
              e.off ? N.deny() : i(e.key);
            },
          },
          X(
            `div`,
            { class: `top` },
            X(`span`, { class: `rar` }, e.tag),
            e.species ? rw(e.species) : Q(e.item ?? `poke-ball`),
          ),
          X(
            `div`,
            { class: `bd` },
            X(`h3`, {}, e.name),
            X(`div`, { class: `pact-line boon` }, X(`small`, {}, c(`Ganas`)), X(`b`, {}, e.boon)),
            X(`div`, { class: `pact-line bane` }, X(`small`, {}, c(`Para siempre`)), X(`b`, {}, e.bane)),
            e.off ? X(`div`, { class: `muted` }, e.off) : null,
            X(`div`, { class: `key` }, `[${t + 1}]`),
          ),
        );
        (e.off && (n.style.opacity = `0.45`), a.append(n));
      });
      let o = this.modal(
        X(`h1`, { class: `small` }, X(`span`, { class: `trade-mon` }, rw(t.species)), t.title),
        X(`div`, { class: `help` }, t.help),
        a,
        X(
          `div`,
          { class: `actions` },
          X(`button`, { class: `btn ghost`, onclick: () => i(null) }, c(`Ahora no`), PN(`Esc`)),
        ),
      );
      e.cry(t.species);
      let s = (e) => {
        if (!o.isConnected || r) {
          removeEventListener(`keydown`, s);
          return;
        }
        let n = VI(e);
        n >= 1 && n <= t.offers.length && !t.offers[n - 1].off
          ? (removeEventListener(`keydown`, s), i(t.offers[n - 1].key))
          : e.key === `Escape` && (e.stopPropagation(), removeEventListener(`keydown`, s), i(null));
      };
      setTimeout(() => addEventListener(`keydown`, s), 350);
    }
    showFusion(e, t, n) {
      return showReviewFusion({hud:this,run:e,offers:t,done:n,requiredLevel:fusionRequiredLevel,
        typeIcon:ZC,details:recipe=>LD(recipe,RE(e)),warning:RD,tags:PD});
    }
  },
  YI = (e) => e.portrait.closest(`.hud-tl`),
  XI = (e) => e.biome.closest(`.hud-top`);
function ZI(e, t = !1, n = e) {
  return GC(e, t === !0 ? `shiny` : t || null, n);
}
var QI = (e) => e.skinLook;

export {
  JI as BattleHud
};
