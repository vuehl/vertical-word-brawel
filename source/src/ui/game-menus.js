import {chineseText as c} from "../data/chinese-text.js";
import {Ar as m, Dr as E, Nr as Ne, Tr as tt, Wt as pt, h as Zt, jr as sn} from "../data/config.js";
import {ec} from "../effects/scene-renderer.js";
import {gameAudio as N} from "../combat/game-audio.js";
import {createElement as X, Z, $, YC, ZC, bw, GC, ow} from "./game-elements.js";
import {facilityIconFile, facilityNames} from "../data/active-content.js";
import {moveAvailableForSpecies} from "../data/skill-availability.js";
import {createZixingUI} from "./zixing-ui.js";
import {installGlyphs, glyphPreview} from "../actors/zixing-glyphs.js";
import {glyphText, glyphSpeciesFromImage} from "../data/zixing-identity.js";
import {b as Wr, ot as pi, ht as ti} from "../vendor/three-DmSYIDKK.js";
import {typeColors as Ni, typeNames as Pi, gameData as k} from "../data/game-database.js";
import {gh, Xh, Zh, Qh} from "../combat/ultimate-moves.js";
import {g_, O_} from "../combat/skills.js";
import {nv} from "../combat/player.js";
import {ultimateChargeRate} from '../combat/stat-multipliers.js';
import {movePool as Vb, Wb, Zb, lS, fusionRequiredLevel} from "../combat/upgrade-offers.js";
import {zE, VE, WE, tD, nD, rD, uD, DD, kD, catalogFusionIcon, catalogMoveMeta, BD, XD, ZD, pO} from "./move-details.js";
import {SO} from "../data/player-profile.js";
import {ta} from "./controls.js";
import {Tc} from "../actors/sprite-assets.js";
import {glyphCanvas, glyphWordForSpecies} from "../actors/paper-glyph-art.js";
import {R} from "../combat/enemy-population.js";
import {BS} from "../world/facilities.js";
import {FT} from "../combat/encounters.js";
import {dE} from "../network/battle-peers.js";

var ON = [
    `normal`,
    `fire`,
    `water`,
    `grass`,
    `electric`,
    `ice`,
    `fighting`,
    `poison`,
    `ground`,
    `flying`,
    `psychic`,
    `bug`,
    `rock`,
    `ghost`,
    `dragon`,
    `dark`,
    `steel`,
    `fairy`,
  ];

var PN = (e) => X(`kbd`, {}, e);

function ZX(app) {
  const itemIcon=id=>Zt(k.items[id]?.icon||`items/${id}.png`);
  return createZixingUI(app, {
    defaults: SO,
    startingStats(id, includeResearch=true) {
      const ability=pt.get(id)?.passive??'';
      const {stats}=zE(k.get(id),ability,includeResearch?app.meta.labStats():{});
      stats.ultCharge=ultimateChargeRate(ability,null,includeResearch?app.meta.lab('ult'):0);
      return stats;
    },
    evolutionIds: id => k.evolutionsOf(id).map(actor=>actor.id),
    evolutionLevel: (from,to) => k.runEvolution(from,k.get(to)).level,
    planCatalog(id) {
      const inLeague = other => app.meta.inLeague(other);
      const pool = Vb(id,pt.get(id),k.get(id).types,inLeague);
      const moves = XD(pool,{species:id,inLeague});
      const typeIcon = type => Zt('ui/types/'+type+'.png');
      const fusions = new Map();
      for (const {r,a,b,ta,tb} of BD(moves)) {
        if (!moveAvailableForSpecies(r.id,id)) continue;
        if (!fusions.has(r.id)) fusions.set(r.id,{
          key:'m'+r.id,name:r.name,detail:[Pi[r.type],DD(r.kind)].join(' · '),icon:typeIcon(r.type),
          pairs:[],requirement:'两项招式均达到 '+fusionRequiredLevel+' 级后可融合。',
        });
        const pair = a && b ? [a.name,b.name] : [ta,tb].map(types=>(types??[]).map(type=>Pi[type]).join('/')+'属性招式');
        fusions.get(r.id).pairs.push(pair);
      }
      return {
        moves:moves.map(move=>({key:'m'+move.id,name:move.name,detail:catalogMoveMeta(move),icon:typeIcon(move.type)})),
        vitamins:m.map(v=>({key:'v'+v.key,name:v.name,detail:v.desc,icon:itemIcon(v.icon)})),
        fusions:[...fusions.values()],
        items:tt.filter(item=>app.meta.itemInPool(item.key)).map(item=>({
          key:item.key,name:Zb(item.key).name,detail:item.desc,icon:itemIcon(item.key),
        })),
      };
    },
    collectionMoveBook(id,catalog,onInspect,kitIntro) {
      const actor=pt.get(id),species=k.get(id);
      const inLeague=other=>app.meta.inLeague(other);
      return ZD(Vb(id,actor,species.types,inLeague),{species:id,inLeague,catalog,kitIntro,
        ctx:zE(species,actor?.passive??'',app.meta.labStats()),
        inspect(move,ctx,note,trigger){
          const facts=tD(move,VE(move,ctx));
          const keys=[c('Daño por golpe'),c('Recarga'),c('Cada'),c('Daño por segundo'),c('Duración')];
          let featured=keys.map(key=>facts.find(([name])=>name===key)).filter(Boolean).slice(0,3);
          if(!featured.length)featured=facts.slice(0,1);
          const others=facts.filter(fact=>!featured.includes(fact));
          const crit=others.findIndex(([name])=>name===c('Crítico'));
          if(crit>1)others.splice(1,0,others.splice(crit,1)[0]);
          const growth=['random','weather','buff'].includes(move.arch)?null:{
            values:Array.from({length:move.fusion?5:8},(_,i)=>VE(move,ctx,i+1).real),
            format:WE,ranges:g_[move.arch].stats.map(stat=>[nD[stat],rD(stat,E[0])+' → '+rD(stat,E[4])])
          };
          const level=trigger.querySelector('.zc-move-level')?.textContent??'';
          const fusion=move.fusion && lS.find(def=>def.key===move.fusion.key);
          onInspect({name:move.name,icon:fusion?catalogFusionIcon(fusion):ZC(move.type,32),meta:catalogMoveMeta(move),
            desc:move.desc,level:level==='初始'?'初始习得':level,featured,others,growth,note,
            related:()=>uD(move,ctx,true)},trigger);
        }});
    },
    moveTitle: id => k.movesByKey.get(pt.get(id).kit[0])?.name || '自动攻击',
    collectionUltimate(id){
      const actor=pt.get(id),forms=[];
      // The combat resolver selects by the current species and the number of evolutions in this run.
      function visit(speciesId,depth,parent,level){
        const form=k.get(speciesId),def=Xh(speciesId,form.types[0]);
        forms.push({id:speciesId,word:form.name,parent,level,singleLevel:actor?.singleStageEvoLevels?.[depth-1],name:glyphText(Zh(def,depth)),
          desc:glyphText(gh(def.descs,depth)),duration:Qh(def,depth),type:def.type,category:kD(def.cls)});
        const next=depth===0&&actor?.branch ? actor.branch : k.evolutionsOf(speciesId).map(next=>next.id);
        for(const child of next){
          if(!k.hasSprite(child))continue;
          const required=actor?.evoLevels?.[depth]??(depth===0?actor?.evoLevel:null)??k.runEvolution(speciesId,k.get(child)).level;
          visit(child,depth+1,form.name,Math.max(level,required));
        }
      }
      visit(id,0,null,0);
      return {forms,typeIcon:ZC,details(formId){
        const species=k.get(formId);
        const {incoming,strong}=kitMatchups(species,actor?.kit??[]);
        return {matchups:[
          {label:'弱点',entries:incoming.filter(([,v])=>v>1.01).sort((a,b)=>b[1]-a[1])},
          {label:'抵抗',entries:incoming.filter(([,v])=>v<.99).sort((a,b)=>a[1]-b[1])},
          {label:'招式克制',entries:strong.map(type=>[type,null])},
        ]};
      }};
    },
    ultTitle: id => glyphText(Zh(Xh(id,k.get(id).types[0]),0)),
    moveDescription: id => O_(k.movesByKey.get(pt.get(id).kit[0]).id).desc,
    ultDescription: id => Xh(id, k.get(id).types[0]).descs[0] || '积蓄能量，释放专属大招。',
    baseStats: (id, lab, growth=0) => nv(k.get(id), growth, lab),
    typeName: type => Pi[type] || type,
    speciesType: id => k.get(id).types[0],
    offer: (run, offer) => Wb(run, offer),
    moveName: move => move.name,
    moveIcon: move => Zt(`ui/types/${move.type}.png`),
    moveColor: move => YC(Ni[move.type]),
    vitaminName: id => Ne.get(id)?.name || id,
    vitaminIcon: id => itemIcon(Ne.get(id)?.icon||id),
    itemName: id => Zb(id)?.name || id,
    facilityIcon: kind => Zt(facilityIconFile(kind)),
    itemIcon,
    itemRarity: id => sn.get(id)?.rarity,
    glyphs: run => installGlyphs(run,{Texture:Wr,colorSpace:pi,species:id=>k.get(id)}),
  });
}

(c(`Daño`),
  c(`Recarga`),
  c(`Cantidad`),
  c(`Área`),
  c(`Velocidad`),
  c(`Duración`),
  c(`Perforación`),
  c(`Crítico`),
  c(`Prob. de estado`),
  c(`Rebotes`));

function kitMatchups(e,t){
  const n=t
      .map((e) => {
        let t = k.movesByKey.get(e);
        return t ? O_(t.id) : null;
      })
      .filter((e) => !!e && e.dmg > 0);
  return {moves:n,incoming:ON.map(type=>[type,k.effectiveness(type,e.types)]),
    strong:ON.filter(type=>n.some(move=>k.effectiveness(move.type,[type])>1.01))};
}

const facilityMapArt = Object.fromEntries(Object.entries({
  chest:'#e8443a', freechest:'#3a7aff', altar:'#2ec8e0', portal:'#9a6aff', boss:'#e8243a',
  magnet:'#8a8aa0', berry:'#3a7aff', ditto:'#c88aff', nest:'#6ad05a', bill:'#ffb43a',
}).map(([kind, ring]) => [kind, {src: facilityIconFile(kind), ring, name: facilityNames[kind]}]));

var cI = {
    boss: `#ff2a4a`,
    alpha: `#ff8a2a`,
    capture: `#5af0ff`,
    treasure: `#ffc83a`,
    totem: `#c25aff`,
    summoner: `#3ac85a`,
  },
  lI = new Map();

function uI(e) {
  const species=glyphSpeciesFromImage(e);
  if(species!==null)return glyphCanvas(glyphWordForSpecies(species));
  if (!lI.has(e)) {
    lI.set(e, null);
    let t = /^portraits\/(\d+)\.png$/.exec(e);
    Tc(
      Zt(e),
      (t) => lI.set(e, t),
      void 0,
      t ? () => Tc(Zt(`icons/${t[1]}.png`), (t) => lI.set(e, t)) : void 0,
    );
  }
  let t = lI.get(e) ?? null;
  return t && (!t.complete || !t.naturalWidth) ? (lI.delete(e), uI(e)) : t;
}

function dI(e, t, n, r, i = !1, word) {
  ((e.fillStyle = `#1d1236`),
    e.beginPath(),
    e.arc(0, 0, r + 2, 0, 7),
    e.fill(),
    (e.fillStyle = n),
    e.beginPath(),
    e.arc(0, 0, r, 0, 7),
    e.fill(),
    (e.fillStyle = `#fff`),
    e.beginPath(),
    e.arc(0, 0, r - 3, 0, 7),
    e.fill());
  let a = word ? glyphCanvas(word) : uI(t);
  if (!a) ((e.fillStyle = n), e.beginPath(), e.arc(0, 0, Math.max(2, (r - 3) * 0.45), 0, 7), e.fill());
  else if (((e.imageSmoothingEnabled = !1), i)) {
    (e.save(), e.beginPath(), e.arc(0, 0, r - 3, 0, 7), e.clip());
    let t = (r - 3) * 2.15;
    (e.drawImage(a, -t / 2, -t / 2 + 1, t, t), e.restore());
  } else {
    let t = (r - 3) * 1.7;
    e.drawImage(a, -t / 2, -t / 2, t, t);
  }
}

function fI(e, t, n, r = !1, word) {
  return X(
    `span`,
    { class: `mapbadge` + (r ? ` round` : ``), style: { "--rc": t, "--s": n + `px` } },
    word ? glyphPreview(glyphSpeciesFromImage(e),.75,'pix',word)
      : X(`img`, { class: `pix`, src: Zt(e), alt: ``, draggable: `false` }),
  );
}

function pI(e, t) {
  let n = facilityMapArt[e];
  return n ? fI(n.src, n.ring, t, n.round) : null;
}

var mI = () => 60 - (26 * xI()) / (200 / 60),
  hI = new Set([`boss`, `portal`, `shrine`]),
  gI = (e) => (e.kind === `boss` || e.kind === `shrine` ? !e.used : e.kind === `portal`);

function _I(e, t, n, r) {
  let i = facilityMapArt[t.kind],
    a = 1 + 0.07 * Math.sin(r / 170);
  (e.save(),
    e.scale(a, a),
    (e.fillStyle = `#1d1236`),
    e.beginPath(),
    e.arc(0, 0, n + 3.5, 0, 7),
    e.fill(),
    (e.fillStyle = `#ffd23a`),
    e.beginPath(),
    e.arc(0, 0, n + 1.5, 0, 7),
    e.fill(),
    i
      ? dI(e, i.src, `#ffd23a`, n - 1, i.round)
      : ((e.fillStyle = `#1d1236`),
        e.beginPath(),
        e.arc(0, 0, n - 2, 0, 7),
        e.fill(),
        (e.fillStyle = `#fff`),
        e.beginPath(),
        e.moveTo(0, -n * 0.6),
        e.lineTo(n * 0.5, 0),
        e.lineTo(0, n * 0.6),
        e.lineTo(-n * 0.5, 0),
        e.closePath(),
        e.fill()),
    e.restore());
}

function vI(e, t, n, r, i) {
  (e.save(),
    e.rotate(t + Math.PI / 2),
    e.translate(0, -n),
    (e.fillStyle = i),
    (e.strokeStyle = `#1d1236`),
    (e.lineWidth = 2),
    (e.lineJoin = `round`),
    e.beginPath(),
    e.moveTo(0, -r),
    e.lineTo(r * 0.85, r * 0.5),
    e.lineTo(-r * 0.85, r * 0.5),
    e.closePath(),
    e.fill(),
    e.stroke(),
    e.restore());
}

var yI = new Set([
  `chest`,
  `freechest`,
  `cursedchest`,
  `altar`,
  `challenge`,
  `meowth`,
  `hypno`,
  `ditto`,
  `slots`,
  `fossil`,
  `nest`,
  `bill`,
]);

function bI(e) {
  return !e.stageCleared || e.endless
    ? []
    : e.interactables
        .markers()
        .filter((e) => yI.has(e.kind) && !e.data?.comet && !(e.kind === `challenge` && e.data?.wave));
}

function xI() {
  return Math.min(2, Math.max(1, Math.min(innerWidth / 1920, innerHeight / 1080))) * 1.1;
}

function SI(e, t, n, r, i, a, o) {
  let s = [
    [c(`N`), 0, -1, `#ff6a5a`],
    [c(`E`), 1, 0, `#fff`],
    [c(`S`), 0, 1, `#fff`],
    [c(`O`), -1, 0, `#fff`],
  ];
  (e.save(),
    (e.font = `900 ${o}px Fredoka, Nunito, "Arial Rounded MT Bold", Arial, sans-serif`),
    (e.textAlign = `center`),
    (e.textBaseline = `middle`),
    (e.lineJoin = `round`));
  let l = Math.sin(a),
    u = Math.cos(a);
  for (let [a, c, d, f] of s) {
    let s = t + (c * u - d * l) * r,
      p = n + (c * l + d * u) * i;
    ((e.fillStyle = `rgba(29,18,54,.8)`),
      e.beginPath(),
      e.arc(s, p, o * 0.78, 0, 7),
      e.fill(),
      (e.lineWidth = Math.max(2, o * 0.14)),
      (e.strokeStyle = `#1d1236`),
      e.strokeText(a, s, p + o * 0.04),
      (e.fillStyle = f),
      e.fillText(a, s, p + o * 0.04));
  }
  e.restore();
}

var CI = new WeakMap(),
  wI = (e, t, n) => [
    ((e >> 16) & 255) * (1 - n) + ((t >> 16) & 255) * n,
    ((e >> 8) & 255) * (1 - n) + ((t >> 8) & 255) * n,
    (e & 255) * (1 - n) + (t & 255) * n,
  ];

function TI(e) {
  let t = e.terrain,
    n = CI.get(t);
  if (n) return n;
  let r = t.world / 2,
    i = e.biome;
  ((n = document.createElement(`canvas`)), (n.width = n.height = 144));
  let a = n.getContext(`2d`),
    o = a.createImageData(144, 144),
    s = new Float32Array(20736),
    c = 1 / 0,
    l = -1 / 0;
  for (let e = 0; e < 144; e++)
    for (let n = 0; n < 144; n++) {
      let i = t.height(-r + ((n + 0.5) / 144) * t.world, -r + ((e + 0.5) / 144) * t.world);
      ((s[e * 144 + n] = i), i < c && (c = i), i > l && (l = i));
    }
  let u = Math.max(1, l - c),
    d = i.ground,
    f = i.cliff[0];
  for (let e = 0; e < 144; e++)
    for (let n = 0; n < 144; n++) {
      let a = s[e * 144 + n],
        l = (a - c) / u,
        p = -r + ((n + 0.5) / 144) * t.world,
        m = -r + ((e + 0.5) / 144) * t.world,
        h = l < 0.5 ? wI(d[0], d[1], l * 2) : wI(d[1], d[2] ?? d[1], (l - 0.5) * 2),
        g = s[e * 144 + Math.min(143, n + 1)] - s[e * 144 + Math.max(0, n - 1)],
        _ = s[Math.min(143, e + 1) * 144 + n] - s[Math.max(0, e - 1) * 144 + n],
        v = Math.min(1, Math.hypot(g, _) / ((t.world / 144) * 1.6));
      v > 0.45 &&
        (h = wI(
          (Math.round(h[0]) << 16) | (Math.round(h[1]) << 8) | Math.round(h[2]),
          f,
          Math.min(1, (v - 0.45) * 2),
        ));
      let y = Math.max(0.55, Math.min(1.35, 1 + ((-g - _) * 0.12) / (t.world / 144)));
      t.hasWater && a < t.waterAt(p, m) - 0.05 && (h = wI(i.waterColor ?? 3846399, 1905206, 0.25));
      let b = (e * 144 + n) * 4;
      ((o.data[b] = Math.min(255, h[0] * y)),
        (o.data[b + 1] = Math.min(255, h[1] * y)),
        (o.data[b + 2] = Math.min(255, h[2] * y)),
        (o.data[b + 3] = 255));
    }
  return (a.putImageData(o, 0, 0), CI.set(t, n), n);
}

var EI = 5;

function DI(e, t, n, r = [], i = !1) {
  let a = facilityMapArt,
    o = innerWidth > innerHeight * 1.1,
    s = Math.floor(
      i
        ? Math.min(innerHeight * 0.82, innerWidth * 0.9)
        : o
          ? Math.min(innerHeight * 0.72, innerWidth * 0.58)
          : Math.min(innerWidth * 0.9, innerHeight * 0.5),
    ),
    l = Math.min(2, window.devicePixelRatio || 1),
    u = X(`canvas`, {
      class: `bm-cv`,
      width: String(Math.round(s * l)),
      height: String(Math.round(s * l)),
      style: { width: s + `px`, height: s + `px` },
    }),
    d = u.getContext(`2d`),
    f = e.terrain.world,
    p = e.terrain.arenaR,
    m = 1,
    h = s / 2,
    g = s / 2,
    _ = () => {
      let e = s / (2 * m);
      ((h = Math.max(e, Math.min(s - e, h))), (g = Math.max(e, Math.min(s - e, g))));
    },
    v = (e, t) => [((e / f + 0.5) * s - h) * m + s / 2, ((t / f + 0.5) * s - g) * m + s / 2],
    y = (e) => (e / f) * s * m,
    b = Math.max(13, Math.min(28, s / 34)),
    x = !!e.events?.blind,
    S = null,
    C = X(`div`, { class: `bm-side`, style: { maxHeight: o ? s + `px` : `none` } }),
    w = ``,
    T = (e) => {
      let t = [...e].map(([e, t]) => e + t.join(`:`)).join(`,`);
      if (t === w) return;
      ((w = t), $(C), C.append(X(`div`, { class: `tag` }, c(`Descubierto en esta zona`))));
      let n = [...e]
        .filter(([e]) => a[e])
        .map(([e, [t]]) =>
          X(
            `div`,
            { class: `ml-row` },
            pI(e, 30),
            X(`div`, { class: `grow` }, X(`b`, {}, a[e].name)),
            X(`span`, { class: `ml-n` }, `×${t}`),
          ),
        );
      (C.append(
        X(
          `div`,
          { class: `ml-grid bm-grid` },
          ...(n.length ? n : [X(`p`, { class: `pz-empty` }, c(`Aún no has descubierto nada: explora`))]),
        ),
      ),
        C.append(
          X(
            `p`,
            { class: `bm-note` },
            c(`Solo ves lo que ya has tenido cerca, salvo el altar del guardián, el santuario y el portal`),
          ),
        ),
        C.append(
          X(
            `p`,
            { class: `bm-note` },
            c(
              `Toca el mapa para poner una marca (hasta {n}) o toca un icono para seguirlo. Toca la marca para quitarla. Rueda, pellizco o los botones + y − acercan el mapa; arrástralo para moverte`,
              { n: 3 },
            ),
          ),
        ));
    },
    E = (n) => {
      if (
        ((x = !!e.events?.blind),
        d.setTransform(l, 0, 0, l, 0, 0),
        d.clearRect(0, 0, s, s),
        d.save(),
        d.beginPath(),
        p < 1 / 0 ? d.arc(s / 2, s / 2, (p / f) * s + 6, 0, 7) : d.roundRect(0, 0, s, s, 18),
        d.clip(),
        (d.fillStyle = `#2a2246`),
        d.fillRect(0, 0, s, s),
        x
          ? ((d.fillStyle = `rgba(70,60,100,0.85)`), d.fillRect(0, 0, s, s))
          : ((d.imageSmoothingEnabled = m < 1.5),
            (d.globalAlpha = 0.92),
            d.drawImage(TI(e), s / 2 - h * m, s / 2 - g * m, s * m, s * m),
            (d.globalAlpha = 1),
            (d.fillStyle = `rgba(40,30,70,0.28)`),
            d.fillRect(0, 0, s, s)),
        (d.strokeStyle = `rgba(255,255,255,0.55)`),
        (d.lineWidth = 3),
        d.setLineDash([10, 7]),
        p < 1 / 0)
      ) {
        let [e, t] = v(0, 0);
        (d.beginPath(), d.arc(e, t, y(p), 0, 7), d.stroke());
      } else {
        let t = e.terrain.walkLim,
          [n, r] = v(-t, -t);
        d.strokeRect(n, r, y(t * 2), y(t * 2));
      }
      d.setLineDash([]);
      let i = e.sanctuary;
      if (i && i.ringR < 999) {
        ((d.strokeStyle = `rgba(176,90,255,0.9)`), (d.lineWidth = 4));
        let [e, t] = v(0, 0);
        (d.beginPath(), d.arc(e, t, y(i.ringR), 0, 7), d.stroke());
      }
      let o = [],
        c = new Map(),
        u = (e, t) => {
          let n = c.get(e) ?? [0, 0];
          (n[0]++, t && n[1]++, c.set(e, n));
        };
      if (!x) {
        for (let t of e.endless?.hazards.list ?? []) {
          let [e, n] = v(t.x, t.z),
            r = YC(bw[t.kind].color);
          ((d.fillStyle = r + `66`),
            (d.strokeStyle = r),
            (d.lineWidth = 2),
            d.beginPath(),
            d.arc(e, n, y(t.r), 0, 7),
            d.fill(),
            d.stroke());
        }
        for (let n of e.interactables.markers()) {
          let e = BS(n),
            r = a[e];
          if (!r || (!t.has(n) && !gI(n))) continue;
          let [i, s] = v(n.x, n.z),
            c = hI.has(n.kind) || n.data?.comet ? b * 1.2 : b;
          (d.save(),
            d.translate(i, s),
            dI(d, r.src, n.kind === `altar` ? n.altarCss : r.ring, c, r.round),
            d.restore(),
            o.push({ x: i, y: s, r: c, name: r.name, wx: n.x, wz: n.z, kind: e }),
            u(e, !1));
        }
        let n = e.enemies,
          r = e.player.pos,
          i = mI();
        for (let t = 0; t < n.n; t++) {
          if (!n.alive[t]) continue;
          let a = n.flags[t];
          if (
            (!(a & R.Boss) && Math.hypot(n.x[t] - r.x, n.z[t] - r.z) > i) ||
            !(a & (R.Boss | 12290 | R.Capture | R.Treasure))
          )
            continue;
          let o =
              a & R.Capture || e.allies.isDown(t)
                ? cI.capture
                : a & R.Treasure
                  ? cI.treasure
                  : a & R.Totem
                    ? cI.totem
                    : a & R.Summoner
                      ? cI.summoner
                      : a & R.Boss
                        ? cI.boss
                        : cI.alpha,
            [s, c] = v(n.x[t], n.z[t]),
            l = a & R.Boss ? b * 1.25 : b * 1.05;
          (d.save(), d.translate(s, c), dI(d, `portraits/${n.species[t]}.png`, o, l, !0, n.glyphWords[t]), d.restore());
        }
      }
      if (!x)
        for (let e of r) {
          let [t, r] = v(e.x, e.z);
          (d.save(), d.translate(t, r), _I(d, e, b * 0.85, n), d.restore());
        }
      if (!x && e.coop) {
        for (let t of e.coop.marks) {
          let [e, r] = v(t.x, t.z);
          (d.save(), d.translate(e, r), _I(d, { x: t.x, z: t.z }, b * 0.85, n), d.restore());
        }
        let t = Math.round(Math.max(11, s / 46));
        ((d.font = `800 ${t}px Nunito, Arial, sans-serif`),
          (d.textBaseline = `middle`),
          (d.textAlign = `center`));
        for (let n of e.coop.active()) {
          let e = n.last.flags;
          if (e & 2) continue;
          let [r, i] = v(n.x, n.z),
            a = b * 1.1;
          (d.save(),
            d.translate(r, i),
            dI(d, `portraits/${n.species}.png`, e & 1 ? `#ff5a6a` : `#7aff9a`, a, !0),
            d.restore());
          let o = d.measureText(n.name).width + 12,
            s = t + 7,
            c = i + a + 4 + s / 2;
          ((d.fillStyle = `rgba(29,18,54,0.78)`),
            d.beginPath(),
            d.roundRect(r - o / 2, c - s / 2, o, s, s / 2),
            d.fill(),
            (d.fillStyle = `#fff`),
            d.fillText(n.name, r, c + 1));
        }
      }
      {
        let [t, r] = v(e.player.pos.x, e.player.pos.z),
          i = b / 15,
          a = (n % 1200) / 1200;
        (d.save(),
          d.translate(t, r),
          (d.strokeStyle = `rgba(255,210,58,${0.85 * (1 - a)})`),
          (d.lineWidth = 3.5),
          d.beginPath(),
          d.arc(0, 0, b * (0.7 + 1.9 * a), 0, 7),
          d.stroke(),
          (d.fillStyle = `rgba(255,210,58,0.3)`),
          d.beginPath(),
          d.arc(0, 0, b * 0.95, 0, 7),
          d.fill(),
          d.rotate(-e.camYaw),
          d.scale(i, i),
          (d.fillStyle = `#ffe14a`),
          (d.strokeStyle = `#1d1236`),
          (d.lineWidth = (3 / i) * 1.3),
          (d.lineJoin = `round`),
          d.beginPath(),
          d.moveTo(0, -15),
          d.lineTo(11, 11),
          d.lineTo(0, 5),
          d.lineTo(-11, 11),
          d.closePath(),
          d.stroke(),
          d.fill(),
          d.restore());
      }
      (d.restore(),
        (d.strokeStyle = `#fff`),
        (d.lineWidth = 4),
        d.beginPath(),
        p < 1 / 0 ? d.arc(s / 2, s / 2, (p / f) * s + 6, 0, 7) : d.roundRect(0, 0, s, s, 18),
        d.stroke());
      let _ = Math.max(13, Math.min(22, s / 32));
      if (
        (p < 1 / 0
          ? SI(d, s / 2, s / 2, (p / f) * s + 6, (p / f) * s + 6, 0, _)
          : SI(d, s / 2, s / 2, s / 2 - _ * 0.6, s / 2 - _ * 0.6, 0, _),
        S)
      ) {
        let e = null,
          t = 1e9;
        for (let n of o) {
          let r = Math.hypot(n.x - S.x, n.y - S.y);
          r < n.r + 6 && r < t && ((t = r), (e = n));
        }
        if (e) {
          ((d.font = `800 ${Math.round(Math.max(13, s / 38))}px Nunito, Arial, sans-serif`),
            (d.textBaseline = `middle`),
            (d.textAlign = `left`));
          let t = d.measureText(e.name).width + 18,
            n = Math.max(13, s / 38) + 14,
            r = Math.max(4, Math.min(s - t - 4, e.x - t / 2)),
            i = e.y - e.r - n - 6 < 4 ? e.y + e.r + 6 : e.y - e.r - n - 6;
          ((d.fillStyle = `#1d1236`),
            d.beginPath(),
            d.roundRect(r, i, t, n, n / 2),
            d.fill(),
            (d.fillStyle = `#fff`),
            d.fillText(e.name, r + 9, i + n / 2 + 1));
        }
      }
      ((ie = o), T(c));
    },
    ee = (e) => {
      let t = u.getBoundingClientRect();
      return { x: ((e.clientX - t.left) / t.width) * s, y: ((e.clientY - t.top) / t.height) * s };
    },
    D = (e, t = s / 2, n = s / 2) => {
      let r = Math.max(1, Math.min(EI, e)),
        i = (t - s / 2) / m + h,
        a = (n - s / 2) / m + g;
      ((m = r), (h = i - (t - s / 2) / m), (g = a - (n - s / 2) / m), _());
    },
    O = new Map(),
    te = 0,
    ne = 0;
  (u.addEventListener(`pointermove`, (e) => {
    let t = ee(e);
    S = t;
    let n = O.get(e.pointerId);
    if (n) {
      if ((O.set(e.pointerId, t), O.size === 2)) {
        let [e, t] = [...O.values()],
          n = Math.hypot(e.x - t.x, e.y - t.y);
        (ne > 0 && D((n / ne) * m, (e.x + t.x) / 2, (e.y + t.y) / 2), (ne = n), (te = 99));
      } else
        O.size === 1 &&
          ((te += Math.abs(t.x - n.x) + Math.abs(t.y - n.y)),
          te > 8 && m > 1 && ((h -= (t.x - n.x) / m), (g -= (t.y - n.y) / m), _()));
    }
  }),
    u.addEventListener(`pointerdown`, (e) => {
      ((S = ee(e)), O.set(e.pointerId, S), O.size === 1 ? (te = 0) : ((ne = 0), (te = 99)));
      try {
        u.setPointerCapture(e.pointerId);
      } catch {}
    }));
  let re = (e) => {
    (O.delete(e.pointerId), (ne = 0));
  };
  (u.addEventListener(`pointerup`, re),
    u.addEventListener(`pointercancel`, re),
    u.addEventListener(`pointerleave`, () => {
      S = null;
    }),
    u.addEventListener(
      `wheel`,
      (e) => {
        e.preventDefault();
        let t = ee(e);
        D(m * Math.exp(-e.deltaY * 0.0015), t.x, t.y);
      },
      { passive: !1 },
    ));
  let ie = [];
  if (
    (u.addEventListener(`click`, (t) => {
      if (i || x || te > 8) return;
      let { x: n, y: a } = ee(t);
      for (let e = 0; e < r.length; e++) {
        let [t, i] = v(r[e].x, r[e].z);
        if (Math.hypot(t - n, i - a) < b * 0.85 + 7) {
          (r.splice(e, 1), N.click());
          return;
        }
      }
      let o = null,
        c = 1e9;
      for (let e of ie) {
        let t = Math.hypot(e.x - n, e.y - a);
        t < e.r + 6 && t < c && ((c = t), (o = e));
      }
      let l = e.terrain.walkLim,
        u = (n - s / 2) / m + h,
        d = (a - s / 2) / m + g;
      for (
        r.push(
          o
            ? { x: o.wx, z: o.wz, kind: o.kind }
            : {
                x: Math.max(-l, Math.min(l, (u / s - 0.5) * f)),
                z: Math.max(-l, Math.min(l, (d / s - 0.5) * f)),
              },
        );
        r.length > 3;

      )
        r.shift();
      N.click();
    }),
    i)
  ) {
    let e = X(`div`, { class: `bm-peek` }, u),
      t = (n) => {
        e.isConnected && (E(n), requestAnimationFrame(t));
      };
    return (E(performance.now()), requestAnimationFrame(t), { el: e });
  }
  let ae = (e, t, n) =>
      X(
        `button`,
        {
          class: `bm-zb`,
          type: `button`,
          title: t,
          "aria-label": t,
          onclick: () => {
            (N.click(), n());
          },
        },
        e,
      ),
    oe = X(
      `div`,
      { class: `bm-zoom` },
      ae(`+`, c(`Acercar el mapa`), () => D(m * 1.5)),
      ae(`−`, c(`Alejar el mapa`), () => D(m / 1.5)),
      ae(`1:1`, c(`Ver el mapa entero`), () => {
        ((m = 1), (h = g = s / 2));
      }),
    ),
    se = X(
      `div`,
      { class: `panel pz-st bigmap` },
      X(
        `div`,
        { class: `scr-head` },
        X(
          `button`,
          {
            class: `back-btn`,
            onclick: () => {
              (N.click(), n());
            },
          },
          X(`kbd`, {}, `Esc`),
          c(`Volver`),
        ),
        X(
          `div`,
          { class: `scr-title` },
          X(`h1`, {}, c(`Mapa de la zona`)),
          X(`span`, {}, c(`Arriba es el norte`)),
        ),
      ),
      X(`div`, { class: `bm-body` }, X(`div`, { class: `bm-wrap` }, u, oe), C),
    ),
    ce = (e) => {
      se.isConnected && (E(e), requestAnimationFrame(ce));
    };
  return (E(performance.now()), requestAnimationFrame(ce), { el: se });
}

var OI = [
    { id: `burn`, name: () => c(`Quemado`), on: (e, t) => +(e.burn[t] > 0) },
    {
      id: `poison`,
      name: () => c(`Envenenado`),
      on: (e, t) => (e.poison[t] > 0 ? Math.max(1, e.poisonStacks[t]) : 0),
    },
    { id: `para`, name: () => c(`Paralizado`), on: (e, t) => +(e.para[t] > 0) },
    { id: `sleep`, name: () => c(`Dormido`), on: (e, t) => +(e.sleep[t] > 0) },
    { id: `frozen`, name: () => c(`Congelado`), on: (e, t) => +(e.frozen[t] > 0) },
    { id: `chill`, name: () => c(`Frío`), on: (e, t) => (e.frozen[t] > 0 ? 0 : e.chill[t]) },
    { id: `stun`, name: () => c(`Aturdido`), on: (e, t) => +(e.stun[t] > 0) },
    { id: `confuse`, name: () => c(`Confuso`), on: (e, t) => +(e.confuse[t] > 0) },
    { id: `charm`, name: () => c(`Enamorado`), on: (e, t) => +(e.charm[t] > 0) },
    { id: `root`, name: () => c(`Atrapado`), on: (e, t) => +(e.root[t] > 0) },
    { id: `pull`, name: () => c(`Atraído`), on: (e, t) => +(e.pull[t] > 0) },
    { id: `wet`, name: () => c(`Mojado`), on: (e, t) => +(e.wet[t] > 0) },
    { id: `curse`, name: () => c(`Maldito`), on: (e, t) => +(e.curse[t] > 0) },
    { id: `healblock`, name: () => c(`Anticura`), on: (e, t) => +(e.healBlock[t] > 0 && e.poison[t] <= 0) },
    { id: `shield`, name: () => c(`Escudo`), on: (e, t) => +(e.shield[t] > 0) },
  ],
  bossStatusTypes = {para:pO.paralysis, frozen:pO.freeze, chill:pO.freeze, confuse:pO.confusion, shield:'steel'},
  kI = class {
    el = X(`div`, { class: `bb-st` });
    key = ``;
    update(e, t) {
      let n = ``;
      for (let r of OI) {
        let i = r.on(e, t);
        i > 0 && (n += r.id + i + ` `);
      }
      if (n !== this.key) {
        ((this.key = n), $(this.el));
        for (let n of OI) {
          let r = n.on(e, t);
          if (r <= 0) continue;
          const type = pO[n.id] ?? bossStatusTypes[n.id];
          this.el.append(
            X(
              `span`,
              { class: `bb-sti`, title: n.name() },
              type ? ZC(type, 22) : X('b', {}, n.name()),
              r > 1 ? X(`b`, {}, `×` + r) : null,
            ),
          );
        }
      }
      return n !== ``;
    }
    reset() {
      this.key && ((this.key = ``), $(this.el));
    }
  },
  AI = class {
    hud;
    team = X(`div`, { class: `coop-team` });
    down = X(`div`, { class: `coop-down`, hidden: !0 });
    portal = X(`div`, { class: `coop-portal`, hidden: !0 });
    lift = X(`div`, { class: `coop-lift`, hidden: !0 });
    watch = X(`div`, { class: `coop-watch`, hidden: !0 });
    mates = new Map();
    v = new ti();
    at = 0;
    constructor(e) {
      this.hud = e;
      // The card group can grow when a skill name changes. Give its cached
      // subtree a fixed origin while its contents keep their natural size.
      this.teamLayer = X('div', {'data-ui-layer':'coop-team',
        style:{position:'absolute',left:'0',top:'0',width:'0',height:'0',overflow:'visible','pointer-events':'none'}}, this.team);
      this.downLabel=X('span');
      this.down.append(this.downLabel);
      this.rescueRing=document.createElement('canvas');
      this.rescueRing.width=this.rescueRing.height=80;
      this.rescueRing.style.width=this.rescueRing.style.height='40px';
      this.rescueRing.dataset.static='true';
      this.rescueLabel=X('b');
      this.lift.append(this.rescueRing,this.rescueLabel);
      e.append(this.teamLayer, this.down, this.portal, this.lift, this.watch);
    }
    els(e) {
      let t = this.mates.get(e.id);
      if (!t) {
        let n = X(`span`, { class: `coop-lvl` }),
          r = X(`small`, {}),
          i = X(`i`, {}),
          a = X(`small`, { class: `coop-help` }),
          o = X(`span`, {}),
          s = X(`div`, { class: `coop-bar` }, X(`i`, {}), o),
          c = X(`span`, {}),
          l = X(`div`, { class: `coop-med` }, n),
          u = X(
            `div`,
            { class: `coop-mate` },
            l,
            X(`div`, { class: `coop-plate` }, X(`b`, {}, e.name), s, r),
          ),
          d = X(
            `div`,
            { class: `coop-tag`, hidden: !0 },
            X(`b`, {}, e.name),
            X(`div`, { class: `coop-hp` }, i, c),
            a,
          );
        (this.team.append(u),
          this.hud.append(d),
          (t = {
            card: u,
            med: l,
            img: null,
            species: 0,
            skin: ``,
            lvl: n,
            sub: r,
            bar: s,
            barTx: o,
            tag: d,
            tagHp: i,
            tagTx: c,
            help: a,
          }),
          this.mates.set(e.id, t));
      }
      if ((t.species !== e.species || t.skin !== (e.skin ?? ``)) && e.species) {
        ((t.species = e.species),
          (t.skin = e.skin ?? ``),
          t.img?.remove(),
          (t.img = GC(e.species, e.skin || null, e.species)),
          t.med.prepend(t.img));
        let n = YC(Ni[k.get(e.species)?.types[0] ?? `normal`] ?? 16777215);
        (t.card.style.setProperty(`--c`, n), t.tag.style.setProperty(`--c`, n));
      }
      return t;
    }
    place() {
      let e = this.hud.getBoundingClientRect().top,
        t = 0;
      for (let n of [`.hud-tl`, `.hud-party`]) {
        let r = this.hud.querySelector(n);
        r &&
          (n !== `.hud-party` || r.childElementCount) &&
          (t = Math.max(t, r.getBoundingClientRect().bottom - e));
      }
      const top = Math.round(t + 22) + 'px';
      if (t > 0 && this.team.style.top !== top) this.team.style.top = top;
    }
    update(e) {
      let t = e.coop;
      if (!t) return;
      let n = e.realTime,
        r = e.r.camera,
        i = window.innerWidth,
        a = window.innerHeight,
        o = n - this.at > 0.25;
      o && ((this.at = n), this.place());
      for (let s of t.peers.values()) {
        let t = this.els(s),
          l = s.last,
          u = !l || n - s.lastAt > 4 || s.link !== `open`,
          d = !!l && !!(l.flags & FT.downed),
          f = !!l && !!(l.flags & FT.out),
          p = !!l && !!(l.flags & FT.portal);
        if (o) {
          const cardClass = 'coop-mate' + (s.gone ? ' lost' : d ? ' down' : f ? ' out' : p ? ' portal' : '');
          const hp = Math.max(0, Math.min(1, l?.hp ?? 0));
          const width = Math.round(hp * 100) + '%';
          const level = l ? c(`Nv. {lvl}`, { lvl: l.level }) : '';
          if (t.card.className !== cardClass) t.card.className = cardClass;
          if (t.card.style.getPropertyValue('--hp') !== String(hp)) t.card.style.setProperty('--hp', String(hp));
          if (t.bar.firstChild.style.width !== width) t.bar.firstChild.style.width = width;
          if (t.lvl.textContent !== level) t.lvl.textContent = level;
          let n = l && !s.gone ? `${ec(Math.ceil(l.hpNow))}/${ec(Math.ceil(l.maxHp))}` : ``;
          if (t.barTx.textContent !== n) t.barTx.textContent = n;
          const status = s.gone
              ? c(`Ha dejado la partida`)
              : u
                ? c(`Sin conexión`)
                : f
                  ? c(`Fuera de combate`)
                  : d
                    ? c(`¡Debilitado! {s} s`, { s: l.bleed })
                    : p
                      ? c(`En el portal`)
                      : s.ultStage === e.stage && s.ultUntil > e.realTime
                        ? '大招 · ' + s.ultName
                        : s.castStage === e.stage && s.castUntil > e.realTime
                          ? '技能 · ' + s.castName
                          : this.distance(e, s);
          if (t.sub.textContent !== status) t.sub.textContent = status;
        }
        let m = !1;
        if (!s.gone && !u && l && !f && s.stage === e.stage && (!e.ui.portraitPeerHud || d)) {
          let n = this.v.set(s.x, s.y + 2.4, s.z).applyMatrix4(r.matrixWorldInverse).z < -0.5;
          this.v.set(s.x, s.y + 2.4, s.z).project(r);
          let o = n && Math.abs(this.v.x) < 1.05 && Math.abs(this.v.y) < 1.05,
            u = d && !e.player.dead;
          if (((m = o || u), m)) {
            let r = this.v.x,
              f = this.v.y;
            if (!o) {
              n || ((r = -r), (f = -f));
              let e = Math.max(Math.abs(r) / 0.86, Math.abs(f) / 0.8, 1e-6);
              ((r /= e), (f /= e));
            }
            ((t.tag.style.left = `${(r * 0.5 + 0.5) * i}px`),
              (t.tag.style.top = `${(-f * 0.5 + 0.5) * a}px`),
              (t.tagHp.style.width = `${Math.round((d ? l.revive : l.hp) * 100)}%`));
            let p = d ? `` : `${ec(Math.ceil(l.hpNow))}/${ec(Math.ceil(l.maxHp))}`;
            (t.tagTx.textContent !== p && (t.tagTx.textContent = p),
              t.tag.classList.toggle(`down`, d),
              t.tag.classList.toggle(`edge`, !o));
            let m = u
              ? o
                ? l.revive > 0
                  ? c(`Reanimando…`)
                  : '在身边停留 3 秒'
                : c(`¡Reanímalo! · {m} m`, {
                    m: Math.round(Math.hypot(s.x - e.player.pos.x, s.z - e.player.pos.z)),
                  })
              : ``;
            t.help.textContent !== m && (t.help.textContent = m);
          }
        }
        t.tag.hidden = !m;
      }
      const down=e.player.dead && e.state!=='over';
      const rescuer=t.lifting;
      this.down.hidden=!down || !!t.liftedBy;
      if(down && o){
        const seconds=Math.ceil(t.bleed);
        const label=t.out?c(`Vuelves en la siguiente zona si tu equipo llega`):
          t.liftedBy?t.liftedBy.name+' 正在救援':'等待队友在身边停留 3 秒 · '+seconds+' 秒';
        if(this.downLabel.textContent!==label)this.downLabel.textContent=label;
      }
      const complete=dE()<t.rescueCompleteUntil;
      const progress=complete?1:down && !t.out && t.liftedBy?t.reviveK/3:rescuer?rescuer.last.revive:null;
      this.lift.hidden=progress===null;
      if(progress!==null){
        const step=Math.round(Math.min(1,progress)*100),label=complete?'救援完成':rescuer?'正在救援 '+rescuer.name:'正在获救';
        if(this.rescueLabel.textContent!==label)this.rescueLabel.textContent=label;
        if(this.rescueRing.dataset.frame!==String(step)){
          const ctx=this.rescueRing.getContext('2d');
          ctx.clearRect(0,0,80,80);ctx.lineWidth=8;ctx.lineCap='round';
          for(const [color,angle] of [['#514963',Math.PI*2],['#65dc97',Math.PI*2*step/100]]){
            ctx.strokeStyle=color;ctx.beginPath();ctx.arc(40,40,32,-Math.PI/2,angle-Math.PI/2);ctx.stroke();
          }
          this.rescueRing.dataset.frame=String(step);
        }
      }
      let l = t.out ? t.spec : null;
      if (((this.watch.hidden = !l), l && o)) {
        let e = [...t.peers.values()].filter(
            (e) => !e.gone && e.last && !(e.last.flags & (FT.downed | FT.out)) && e.link === `open`,
          ).length,
          n = c(`Viendo a {name}`, { name: l.name }),
          r = e > 1 ? c(`{key}: cambiar de compañero`, { key: ta(`jump`) }) : ``,
          i = `${n}|${r}|${l.species}`;
        this.watch.dataset.k !== i &&
          ((this.watch.dataset.k = i),
          ow(
            $(this.watch),
            GC(l.species, l.skin || null, l.species),
            X(`b`, {}, n),
            r ? X(`small`, {}, r) : null,
          ));
      }
      if (o) {
        let n = t.portalInfo;
        ((this.portal.hidden = !n.inside || !e.stageCleared),
          this.portal.hidden ||
            ow(
              $(this.portal),
              Z(`map-portal`, 26),
              n.wait.length
                ? c(`Portal: {n}/{m} dentro · falta: {names}`, {
                    n: n.inside,
                    m: n.need,
                    names: n.wait.join(`, `),
                  })
                : c(`Portal: {n}/{m} dentro`, { n: n.inside, m: n.need }),
            ));
      }
    }
    distance(e, t) {
      let n = Math.hypot(t.x - e.player.pos.x, t.z - e.player.pos.z);
      return n < 12 ? c(`A tu lado`) : c(`A {m} m`, { m: Math.round(n) });
    }
    destroy() {
      ((this.teamLayer).remove(), this.down.remove(), this.portal.remove(), this.lift.remove(), this.watch.remove());
      for (let e of this.mates.values()) e.tag.remove();
    }
  },
  jI = 400,
  MI = 150,
  NI = 600,
  PI = 600,
  FI = [0, 1, 2, 3, 4, 5.5, 7],
  II = [`#36c96a`, `#9bd23a`, `#ffc21a`, `#ff8a2a`, `#ff4a4a`, `#d0206a`, `#6a1aa8`],
  LI = (e) =>
    [
      c(`Tranquilo`),
      c(`Moderado`),
      c(`Peligroso`),
      c(`Muy peligroso`),
      c(`Brutal`),
      c(`Letal`),
      c(`Imposible`),
    ][e],
  RI = new Set([`meowth`, `ditto`, `hypno`]);

var BI = 8,
  VI = (e) => {
    if (UI(e)) return 0;
    let t = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    return t && !e.repeat ? Number(t[1]) : 0;
  },
  HI = { opened: 0, lockMs: NI, held: new Set() },
  UI = (e) => performance.now() - HI.opened < HI.lockMs || HI.held.has(e.code);

export {
  PN,
  facilityMapArt,
  cI,
  dI,
  fI,
  pI,
  mI,
  hI,
  _I,
  vI,
  bI,
  xI,
  SI,
  DI,
  kI,
  AI,
  jI,
  MI,
  NI,
  PI,
  FI,
  II,
  LI,
  RI,
  BI,
  VI,
  HI,
  ZX as gameInterface
};
