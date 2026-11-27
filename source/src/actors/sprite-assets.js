import {glyphAtlasReady, glyphCanvas, glyphWordForSpecies} from "./paper-glyph-art.js";
import {glyphSpeciesFromImage} from "../data/zixing-identity.js";
import {animatedPixelHeight, glyphBillboardSize} from "./hero-actions.js";
import {
  D as vr,
  rt as vi,
  Y as zr,
  B as gr,
  H as Sr,
  b as Wr,
  ct as Kr,
  dt as Jr,
  et as Yr,
  j as ii,
  mt as li,
  ot as pi,
  F as br,
  G as xr,
  ht as ti,
  lt as si
} from "../vendor/three-DmSYIDKK.js";
import {actorMetrics} from "./actor-metrics.js";
import {h as Zt} from "../data/config.js";
import {gameData as k} from "../data/game-database.js";
import {installGlyphs} from "./zixing-glyphs.js";
import {uo} from "../ui/controls.js";

var mc = new Map(),
  _c = (e) => Math.min(3e4, 1500 * 2 ** Math.min(e, 5));
function vc(e, t) {
  mc.set(e, t);
}
function yc(key, retry) {
  if (!retry || mc.get(key) === retry) mc.delete(key);
}
var bc = () => mc.size;
function xc() {
  for (let e of [...mc.values()]) e();
}
var Cc = (e, t) => (t ? `${e}${e.includes(`?`) ? `&` : `?`}r=${t}` : e);
function installImageRetries() {
  let e = document.createElement(`style`);
  ((e.textContent = `img[data-rt]{color:transparent;font-size:0;text-indent:-9999px;overflow:hidden}`),
    document.head.append(e),
    document.addEventListener(
      `error`,
      (e) => {
        const target = e.target;
        if (!(target instanceof HTMLImageElement) || !target.isConnected) return;
        const url = target.currentSrc || target.src;
        if (!url || url.startsWith('data:') || target.dataset.rt === url) return;
        const src = target.getAttribute('src'), key = 'img:' + url;
        target.dataset.rt = url;
        const current = () => target.isConnected && target.dataset.rt === url && target.getAttribute('src') === src;
        let attempts = 0, timer, active;
        const retry = () => {
          clearTimeout(timer);
          if (active) active.onload = active.onerror = null;
          active = null;
          if (!current() || attempts >= 5) { yc(key, retry); return; }
          const image = active = new Image(), next = Cc(url, ++attempts);
          const finish = loaded => {
            if (active !== image) return;
            clearTimeout(timer);
            image.onload = image.onerror = null;
            active = null;
            if (!loaded && current() && attempts < 5) {
              timer = window.setTimeout(retry, _c(attempts));
              return;
            }
            yc(key, retry);
            if (loaded && current()) {
              delete target.dataset.rt;
              target.src = next;
            }
          };
          image.onload = () => finish(true);
          image.onerror = () => finish(false);
          timer = window.setTimeout(() => finish(false), 12000);
          image.src = next;
        };
        vc(key, retry);
        timer = window.setTimeout(retry, _c(0));
      },
      !0,
    ));
}
function Tc(e, t, n = `img:` + e, r) {
  const species=glyphSpeciesFromImage(e);
  if(species!==null){
    glyphAtlasReady().catch(()=>null).then(()=>{
      const image=glyphCanvas(glyphWordForSpecies(species));
      image.naturalWidth=image.width;image.naturalHeight=image.height;image.complete=true;
      t(image);
    });
    return;
  }
  let i = 0,
    a = 0,
    o = !1,
    s = () => {
      if ((clearTimeout(a), o)) return;
      let c = new Image();
      ((c.onload = () => {
        ((o = !0), yc(n), t(c));
      }),
        (c.onerror = () => {
          i >= Ec ? ((o = !0), yc(n), r?.()) : (vc(n, s), (a = window.setTimeout(s, _c(i))));
        }),
        (c.src = Cc(e, i++)));
    };
  s();
}
var Ec = 8;
async function Dc(e, t, n) {
  for (let r = 0; ; r++)
    try {
      let t = await n(r);
      return (yc(e), t);
    } catch (n) {
      if (r + 1 >= t) throw (yc(e), n);
      await new Promise((t) => {
        let n = setTimeout(t, _c(r));
        vc(e, () => {
          (clearTimeout(n), t());
        });
      });
    }
}
var Oc = animatedPixelHeight,
  kc = 0.04,
  Ac = 4,
  jc = 12e3,
  Mc = 45e3,
  Nc = new Map(),
  Pc = [],
  Fc = [],
  Ic = new Map(),
  Lc = new Map();
function Rc() {
  for (let e of [...Lc.values()]) e();
}
var zc = 0;
function Bc(e, t = !1, n = ``) {
  let r = () => {
    (n && Ic.delete(n), zc++);
    let t = !1;
    e(() => {
      t || ((t = !0), zc--, (Pc.shift() ?? Fc.shift())?.());
    });
  };
  zc < Ac && !(t && Pc.length) ? r() : t ? (Fc.push(r), Ic.set(n, r)) : Pc.push(r);
}
function Vc(e, t = !1) {
  let n = Nc.get(e);
  if (n) {
    let r = t ? void 0 : Ic.get(e);
    return (r && (Ic.delete(e), Fc.splice(Fc.indexOf(r), 1), Pc.push(r)), n);
  }
  return (
    (n = new Promise((n) => {
      let r = 0,
        i = !1,
        a = 0,
        o = (t) =>
          Bc(
            (t) => {
              if (i) {
                t();
                return;
              }
              let s = new Image(),
                c = !1,
                l = setTimeout(t, jc),
                u = setTimeout(() => {
                  !c && !i && o(!1);
                }, Mc);
              ((s.onload = () => {
                ((c = !0),
                  clearTimeout(l),
                  clearTimeout(u),
                  t(),
                  i || ((i = !0), clearTimeout(a), Lc.delete(e), yc(e), n(s)));
              }),
                (s.onerror = () => {
                  ((c = !0),
                    clearTimeout(l),
                    clearTimeout(u),
                    t(),
                    !i &&
                      (vc(e, () => {
                        (clearTimeout(a), o(!1));
                      }),
                      clearTimeout(a),
                      (a = window.setTimeout(() => o(!1), _c(r - 1)))));
                }),
                (s.src = r ? `${e}&r=${r}` : e),
                r++);
            },
            t,
            t ? e : ``,
          );
      (Lc.set(e, () => {
        i || (clearTimeout(a), o(!1));
      }),
        o(t));
    })),
    Nc.set(e, n),
    n
  );
}
var Hc = 256,
  Uc = new Uint8Array(4 * Hc * 4),
  Wc = new vr(Uc, 4, Hc, vi);
((Wc.magFilter = zr), (Wc.minFilter = zr), (Wc.generateMipmaps = !1), (Wc.needsUpdate = !0));
var Gc = { value: Wc },
  Kc = new Map();
function qc(e) {
  let t = e.join(`,`),
    n = Kc.get(t);
  if (n !== void 0 || ((n = Math.min(255, Kc.size)), Kc.size >= Hc)) return n;
  Kc.set(t, n);
  for (let t = 0; t < 4; t++) {
    let r = e[t] ?? `#000000`;
    Uc.set(
      [parseInt(r.slice(1, 3), 16), parseInt(r.slice(3, 5), 16), parseInt(r.slice(5, 7), 16), 255],
      (n * 4 + t) * 4,
    );
  }
  return ((Wc.needsUpdate = !0), n);
}
var Jc = `
attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iUV; attribute vec4 iFx; attribute vec4 iTint; attribute vec2 iLook;
uniform float uLean; uniform vec2 uTexel;
varying vec2 vUv; varying vec4 vFx; varying vec4 vTint; varying float vFogDepth; varying vec4 vRect; varying vec2 vLocal; varying vec2 vLook;
void main(){
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 up = normalize(mix(vec3(0.,1.,0.), camUp, uLean));
  // iFx.w = squash (-1..1): positive = squash wide/short.
  float sq = iFx.w;
  vec2 size = iSize * vec2(1. + sq*0.35, 1. - sq*0.3);
  vec3 world = iPos + right * (position.x * size.x) + up * (position.y * size.y);
  vec4 mv = viewMatrix * vec4(world, 1.);
  // Nudge toward the camera so sprites do not clip into terrain slopes.
  mv.z += 0.25 + iSize.y * 0.05; // big sprites (bosses) need more, or uneven ground cuts their feet
  gl_Position = projectionMatrix * mv;
  vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y));
  vRect = vec4(min(iUV.x,iUV.z), min(iUV.y,iUV.w), max(iUV.x,iUV.z), max(iUV.y,iUV.w));
  vLocal = uv;
  vFx = iFx; vTint = iTint; vFogDepth = -mv.z; vLook = iLook;
}`,
  Yc = `
uniform sampler2D map; uniform vec2 uTexel; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform vec3 uLight; uniform float uTime; uniform sampler2D uLookPal;
varying vec2 vUv; varying vec4 vFx; varying vec4 vTint; varying float vFogDepth; varying vec4 vRect; varying vec2 vLocal; varying vec2 vLook;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
vec3 hueShift(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c*ca + cross(k, c)*sin(a) + k*dot(k, c)*(1. - ca); }
float alphaAt(vec2 uv){ if(uv.x<vRect.x||uv.y<vRect.y||uv.x>vRect.z||uv.y>vRect.w) return 0.; return texture2D(map, uv).a; }
// Aspectos de Maestría (meta/looks.ts): the same per-pixel recipes as render/lookfx.ts (shadeLook, lookOutline), on sRGB values.
// vLook.x = style (LOOK_STYLE_INDEX, 0 = none), vLook.y = row of the palette texture (lookPalRow).
vec3 lkRamp(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float l){
  float s = clamp(l, 0., 1.) * 3.;
  if (s < 1.) return mix(p0, p1, s);
  if (s < 2.) return mix(p1, p2, s - 1.);
  return mix(p2, p3, min(s - 2., 1.));
}
vec3 lookColor(float st, vec3 c, vec2 xy, vec3 p0, vec3 p1, vec3 p2, vec3 p3){
  float l = clamp((dot(c, vec3(.299, .587, .114)) - .08) / .84, 0., 1.);
  float t = uTime;
  vec3 o;
  if (st < 1.5) { o = l < .25 ? p0 : l < .5 ? p1 : l < .75 ? p2 : p3; }
  else if (st < 2.5) {
    o = lkRamp(p0, p1, p2, p3, l * .85);
    float crack = hash(floor(xy / 2.));
    float pulse = .75 + .25 * sin(t * 3. + xy.y * .25);
    if (l > .62) o = mix(o, p3 * 1.25, (l - .62) * 2.2 * pulse);
    if (crack > .94) o = p2 * 1.5 * pulse;
  } else if (st < 3.5) {
    o = lkRamp(p0, p1, p2, p3, l * .6 + .4);
    if (fract((xy.x + xy.y) * .035 - t * .45) < .07) o = mix(o, vec3(1.), .7);
    float s = hash(xy);
    if (s > .985) o = mix(o, vec3(1.), .5 + .5 * sin(t * 5. + s * 40.));
  } else if (st < 4.5) {
    o = lkRamp(p0, p1, p2, p3, pow(l, .9));
    if (fract((xy.x - xy.y * .5) * .028 - t * .35) < .09) o = mix(o, p3, .85);
  } else if (st < 5.5) {
    float h = l * 1.4 + (xy.x + xy.y) * .012 + t * .3;
    vec3 rb = .6 + .4 * cos(6.2832 * (h + vec3(0., .33, .66)));
    o = mix(lkRamp(p0, p1, p2, p3, l), rb, .5);
    if (mod(xy.y, 3.) < .5) o *= .86;
  } else if (st < 6.5) { o = lkRamp(p0, p1, p2, p3, l * .62); }
  else if (st < 7.5) {
    o = lkRamp(p0, p1, p2, p3, l * .72);
    o = mix(o, p2, .18 * (.5 + .5 * sin(xy.x * .06 + xy.y * .04 + t * .4)));
    float s = hash(xy);
    if (s > .972) o = mix(o, vec3(1.), .55 + .45 * sin(t * 4. + s * 60.));
  } else if (st < 8.5) { o = l < .33 ? p0 : l < .68 ? p1 : p2; }
  else if (st < 9.5) { o = lkRamp(p0, p1, p2, p3, l) * (.84 + .16 * hash(xy)); }
  else if (st < 10.5) { o = l < .28 ? p0 : l < .55 ? p1 : p2; }
  else if (st < 11.5) {
    o = lkRamp(p0, p1, p2, p3, l);
    float f = .5 + .5 * sin(xy.y * .45 + t * 9. + xy.x * .21);
    o = mix(o, p3, .22 * f * l);
  } else {
    o = lkRamp(p0, p1, p2, p3, l * .8);
    float k = max(0., sin(xy.y * .12 - t * 1.5 + sin(xy.x * .08) * 2.));
    o = mix(o, p2, .55 * k * k * k);
  }
  return clamp(o, 0., 1.);
}
vec3 srgbToLin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 linToSrgb(vec3 c){ return pow(c, vec3(1. / 2.2)); }
vec3 lookPal(float i){ return texture2D(uLookPal, vec2((i + .5) / 4., (vLook.y + .5) / ${Hc}.)).rgb; }
void main(){
  vec4 c = texture2D(map, vUv);
  // 0 none, 1 gold(elite), 2 red(alpha), 3 white(player), 4 cyan(capture), 5+h shiny (h = hue/6.2832), 7 violet(Dominante),
  // 8 green(Invocador), 9+h shiny colours without an outline (Aspecto variocolor, the player), 10+h the same with the white one.
  float code = vFx.z;
  float shinyHue = (code > 4.9 && code < 6.5) || code > 8.9 ? fract(code) * 6.2832 : -1.;
  float outline = code > 9.95 ? 3. : code > 8.9 ? 0. : code;
  float a = c.a;
  vec3 col = c.rgb;
  // Looks that draw an outline (shadow 6, neon 8, ink 10, flame 11): it replaces the code's one.
  float lk = vLook.x;
  bool lookOut = lk > 5.5 && (lk < 6.5 || (lk > 7.5 && lk < 8.5) || (lk > 9.5 && lk < 11.5));
  if (a < 0.5) {
    if (lookOut) {
      float n = max(max(alphaAt(vUv+vec2(uTexel.x,0.)), alphaAt(vUv-vec2(uTexel.x,0.))), max(alphaAt(vUv+vec2(0.,uTexel.y)), alphaAt(vUv-vec2(0.,uTexel.y))));
      if (n < 0.5) discard;
      bool ink = lk > 9.5 && lk < 10.5;
      vec3 oc = srgbToLin(lookPal(lk < 6.5 ? 3. : ink ? 0. : 2.));
      if (!ink) oc *= 1.6 * (0.75 + 0.25*sin(uTime*8.));
      gl_FragColor = vec4(oc, 1.);
      return;
    }
    if (outline > 0.5) {
      float n = max(max(alphaAt(vUv+vec2(uTexel.x,0.)), alphaAt(vUv-vec2(uTexel.x,0.))), max(alphaAt(vUv+vec2(0.,uTexel.y)), alphaAt(vUv-vec2(0.,uTexel.y))));
      if (n < 0.5) discard;
      vec3 oc = outline < 1.5 ? vec3(1.,.85,.2) : outline < 2.5 ? vec3(1.,.15,.1) : outline < 3.5 ? vec3(1.) : outline < 4.5 ? vec3(.3,1.,1.)
        : outline > 7.5 ? vec3(.35,1.,.4) : outline > 6.5 ? vec3(.85,.35,1.) : 0.6 + 0.4*cos(uTime*4. + vUv.y*40. + vec3(0., 2.1, 4.2));
      float pulse = 0.75 + 0.25*sin(uTime*8.);
      gl_FragColor = vec4(oc * (outline < 3.5 && outline > 2.5 ? 1. : 1.6*pulse), 1.);
      return;
    }
    discard;
  }
  // Dissolve (death): vFx.y in [0..1].
  float diss = vFx.y;
  if (diss > 0.) {
    float n = hash(floor(vUv / uTexel));
    if (n < diss) discard;
    if (n < diss + 0.12) { gl_FragColor = vec4(vec3(1.,.95,.7)*2.2, 1.); return; }
  }
  if (lk > 0.5) {
    vec2 xy = vec2(floor((vUv.x - vRect.x) / uTexel.x), floor((vRect.w - vUv.y) / uTexel.y));
    col = srgbToLin(lookColor(lk, linToSrgb(col), xy, lookPal(0.), lookPal(1.), lookPal(2.), lookPal(3.)));
  }
  if (shinyHue >= 0.) col = hueShift(col, shinyHue);
  col *= uLight;
  // Status tint: rgb multiplier with strength in w.
  col = mix(col, col * vTint.rgb * 1.4 + vTint.rgb*0.12, vTint.w);
  // Bottom shading for grounding.
  col *= mix(0.82, 1.05, smoothstep(0.0, 0.5, vLocal.y));
  // Hit flash.
  col = mix(col, vec3(1.), vFx.x);
  float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 1.);
}`;
function Xc(e) {
  return 0.22 + ((e * 0.618034) % 1) * 0.56;
}
var Zc = (e, t = !1) => (t ? 10 : 9) + Math.min(0.99, Xc(e)),
  Qc = 2e4,
  $c = new Set([50, 51]),
  el = class {
    id;
    mesh;
    meta;
    ready = !1;
    count = 0;
    cap;
    aPos;
    aSize;
    aUV;
    aFx;
    aTint;
    aLook;
    foot = { foot: 6, top: -14, width: 20 };
    lunge = new Map();
    surfaceWalk;
    fallback = !1;
    material;
    standIn;
    cancelLoad;
    constructor(e, t, n, r = 64, i, a = !1) {
      this.id = e;
      let o = !i && e >= 2e4;
      ((this.sid = o ? e - Qc : e),
        (this.meta = i
          ? { w: i.width, h: i.height }
          : (k.sprites[this.sid] ?? { w: 96, h: 96, fallback: `front/${this.sid}.png` })),
        (this.fallback = !this.meta.anims),
        (this.cap = r));
      let s = new Yr(1, 1);
      s.translate(0, 0.5, 0);
      let c = new Jr();
      ((this.material = new Kr({
        vertexShader: Jc,
        fragmentShader: Yc,
        uniforms: {
          map: { value: c },
          uTexel: { value: new li(1 / 256, 1 / 256) },
          uLean: { value: 0.35 },
          uLookPal: Gc,
          uFogColor: n.uFogColor,
          uFogNear: n.uFogNear,
          uFogFar: n.uFogFar,
          uLight: n.uLight,
          uTime: n.uTime,
        },
      })),
        (this.mesh = new Sr(s, this.material, r)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.renderOrder = 1),
        (this.mesh.count = 0),
        this.allocate(r, s),
        t.add(this.mesh),
        i
          ? this.use(i, new Wr(i))
          : actorMetrics[this.sid]
            ? (this.foot = actorMetrics[this.sid])
            : this.load(
              (this.url = Zt(
                this.fallback
                  ? (this.meta.fallback ?? `front/${this.sid}.png`)
                  : `${o ? `pmd-shiny` : `pmd`}/${this.sid}.png`,
              )),
              a,
            ));
    }
    url = ``;
    sid;
    lastUse = nl;
    drawn = !1;
    get bytes() {
      if(this.zxGlyph)return this.ready?192*192*4:0;
      return this.ready ? this.meta.w * this.meta.h * 4 : 0;
    }
    urgent() {
      !this.ready && this.url && Vc(this.url);
    }
    load(e, t = !1) {
      let n = !1;
      ((this.cancelLoad = () => {
        n = !0;
      }),
        Vc(e, t).then((e) => {
          if (n) return;
          let t = new Jr(e);
          ((t.needsUpdate = !0), this.use(e, t));
        }));
    }
    use(e, t) {
      ((t.magFilter = zr),
        (t.minFilter = zr),
        (t.generateMipmaps = !1),
        (t.colorSpace = pi),
        (this.material.uniforms.map.value = t),
        (this.meta.w = e.width),
        (this.meta.h = e.height),
        this.material.uniforms.uTexel.value.set(1 / e.width, 1 / e.height),
        this.measure(e),
        (this.ready = !0));
    }
    allocate(e, t) {
      ((this.aPos = new gr(new Float32Array(e * 3), 3).setUsage(ii)),
        (this.aSize = new gr(new Float32Array(e * 2), 2).setUsage(ii)),
        (this.aUV = new gr(new Float32Array(e * 4), 4).setUsage(ii)),
        (this.aFx = new gr(new Float32Array(e * 4), 4).setUsage(ii)),
        (this.aTint = new gr(new Float32Array(e * 4), 4).setUsage(ii)),
        (this.aLook = new gr(new Float32Array(e * 2), 2).setUsage(ii)),
        t.setAttribute(`iPos`, this.aPos),
        t.setAttribute(`iSize`, this.aSize),
        t.setAttribute(`iUV`, this.aUV),
        t.setAttribute(`iFx`, this.aFx),
        t.setAttribute(`iTint`, this.aTint),
        t.setAttribute(`iLook`, this.aLook));
    }
    grow() {
      let e = this.cap * 2,
        t = this.mesh,
        n = t.geometry,
        r = [this.aPos, this.aSize, this.aUV, this.aFx, this.aTint, this.aLook];
      this.allocate(e, n);
      let i = [this.aPos, this.aSize, this.aUV, this.aFx, this.aTint, this.aLook];
      r.forEach((e, t) => i[t].array.set(e.array));
      let a = new Sr(n, this.material, e);
      ((a.frustumCulled = !1),
        (a.renderOrder = 1),
        t.parent?.add(a),
        t.parent?.remove(t),
        t.dispose(),
        (this.mesh = a),
        (this.cap = e));
    }
    measure(e) {
      try {
        let t = this.anim(`walk`),
          n = document.createElement(`canvas`);
        ((n.width = t.fw), (n.height = t.fh));
        let r = n.getContext(`2d`, { willReadFrequently: !0 });
        r.drawImage(e, 0, t.y, t.fw, t.fh, 0, 0, t.fw, t.fh);
        let i = r.getImageData(0, 0, t.fw, t.fh).data,
          a = 0,
          o = t.fh,
          s = t.fw,
          c = 0;
        for (let e = 0; e < t.fh; e++)
          for (let n = 0; n < t.fw; n++)
            i[(e * t.fw + n) * 4 + 3] > 128 &&
              (e > a && (a = e), e < o && (o = e), n < s && (s = n), n > c && (c = n));
        a > o && (this.foot = { foot: a + 1 - t.fh / 2, top: o - t.fh / 2, width: c - s + 1 });
        for (let i of [`attack`, `hurt`]) {
          let a = this.anim(i);
          if (!this.meta.anims || a === t) continue;
          let o = Math.max(1, a.rows),
            s = new Int16Array(o * a.n).fill(-999);
          ((n.width = a.fw * a.n),
            (n.height = a.fh * o),
            r.clearRect(0, 0, n.width, n.height),
            r.drawImage(e, 0, a.y, a.fw * a.n, a.fh * o, 0, 0, a.fw * a.n, a.fh * o));
          let c = n.width,
            l = r.getImageData(0, 0, c, n.height).data;
          for (let e = 0; e < o; e++)
            for (let t = 0; t < a.n; t++) {
              let n = -1;
              for (let r = a.fh - 1; r >= 0 && n < 0; r--)
                for (let i = 0; i < a.fw; i++)
                  if (l[((e * a.fh + r) * c + t * a.fw + i) * 4 + 3] > 128) {
                    n = r;
                    break;
                  }
              n >= 0 && (s[e * a.n + t] = n + 1 - a.fh / 2);
            }
          this.lunge.set(i, s);
        }
      } catch {}
    }
    anim(e) {
      let t = this.meta;
      return e === `walk` && $c.has(this.sid) && t.anims?.idle
        ? (this.surfaceWalk ??= { ...t.anims.idle, d: t.anims.idle.d.map(() => 8) })
        : t.anims
          ? (t.anims[e] ?? t.anims.walk)
          : { y: 0, fw: t.w, fh: t.h, n: 1, rows: 1, d: [60] };
    }
    bodyHeight(e = 1) {
      return (this.foot.foot - this.foot.top) * (this.fallback ? kc : Oc) * e;
    }
    bodyWidth(e = 1) {
      return this.foot.width * (this.fallback ? kc : Oc) * e;
    }
    begin() {
      this.count = 0;
    }
    push(e, t, n, r, i, a, o, s = 0, c = 0, l = 0, u = 0, d = 1, f = 1, p = 1, m = 0, h = !1, g = 0, glyphRect = this.zxGlyphRect, glyphWidth = 1, glyphHeight = 1) {
      if (!this.ready) {
        if (this.zxGlyph) return;
        this.standIn?.push(
          e,
          t + Math.abs(Math.sin(performance.now() / 160)) * 0.25 * o,
          n,
          `idle`,
          0,
          0,
          o,
          s,
          c,
          l,
          0,
          d,
          f,
          p,
          m,
        );
        return;
      }
      if(this.zxGlyph){
        const buffer=this.zxGroup||this;
        if(buffer===this&&this.count>=this.cap)this.grow();
        const index=buffer===this?this.count++:buffer.reserve(),size=glyphBillboardSize(this.bodyHeight(1))*o;
        if(buffer!==this)this.count++;
        const pos=buffer.aPos.array,dim=buffer.aSize.array,uv=buffer.aUV.array,fx=buffer.aFx.array,tint=buffer.aTint.array,look=buffer.aLook.array;
        pos[index*3]=e;pos[index*3+1]=t+.08;pos[index*3+2]=n;
        dim[index*2]=size*glyphWidth;dim[index*2+1]=size*glyphHeight;
        uv.set(glyphRect,index*4);
        fx[index*4]=s;fx[index*4+1]=c;fx[index*4+2]=l;fx[index*4+3]=u;
        tint[index*4]=d;tint[index*4+1]=f;tint[index*4+2]=p;tint[index*4+3]=m;
        look[index*2]=g&15;look[index*2+1]=g>>4;
        if(this.zxModel){
          const frame=this.modelFrame;
          const row=this.zxModel.rig.poseRow(r,i,h,frame,this.modelPose);
          const remaining=this.strokeCounts?.get(glyphRect)??this.modelVisible??this.zxModel.strokeCount;
          const yaw=-.22+Math.sin(a*Math.PI/4)*.18;
          buffer.aPose.setXYZW(index,row,remaining,yaw,1/(frame?.renderScale??1));
        }
        return index;
      }
      this.count >= this.cap && this.grow();
      let _ = this.anim(r),
        v = _._tot;
      v === void 0 && ((v = _.d.reduce((e, t) => e + t, 0) || 1), (_._tot = v));
      let y = h ? Math.min(v - 1, Math.floor(i * v)) : Math.floor(i * 60) % v,
        b = 0;
      for (; b < _.n - 1 && y >= _.d[b]; ) ((y -= _.d[b]), b++);
      let x = _.rows > 1 ? a : 0,
        S = this.meta.w,
        C = this.meta.h,
        w = (b * _.fw) / S,
        T = ((b + 1) * _.fw) / S,
        E = 1 - (_.y + x * _.fh) / C,
        ee = 1 - (_.y + (x + 1) * _.fh) / C;
      if (this.fallback && (a === 1 || a === 2 || a === 3)) {
        let e = w;
        ((w = T), (T = e));
      }
      let D = (this.fallback ? kc : Oc) * o,
        O = this.count++,
        te = r === `attack` || r === `hurt` ? this.lunge.get(r) : void 0,
        ne = te ? te[x * _.n + b] : -999,
        re = _.fh / 2 - Math.max(this.foot.foot, ne),
        ie = this.aPos.array;
      ((ie[O * 3] = e), (ie[O * 3 + 1] = t - re * D), (ie[O * 3 + 2] = n));
      let ae = this.aSize.array;
      ((ae[O * 2] = _.fw * D), (ae[O * 2 + 1] = _.fh * D));
      let oe = this.aUV.array;
      ((oe[O * 4] = w), (oe[O * 4 + 1] = ee), (oe[O * 4 + 2] = T), (oe[O * 4 + 3] = E));
      let se = this.aFx.array;
      ((se[O * 4] = s), (se[O * 4 + 1] = c), (se[O * 4 + 2] = l), (se[O * 4 + 3] = u));
      let ce = this.aTint.array;
      ((ce[O * 4] = d), (ce[O * 4 + 1] = f), (ce[O * 4 + 2] = p), (ce[O * 4 + 3] = m));
      let le = this.aLook.array;
      ((le[O * 2] = g & 15), (le[O * 2 + 1] = g >> 4));
    }
    end() {
      if (((this.mesh.count = this.count), (this.mesh.visible = this.count > 0), this.count)) {
        ((this.drawn = !0), (this.lastUse = nl));
        for (let e of [this.aPos, this.aSize, this.aUV, this.aFx, this.aTint, this.aLook])
          (e.clearUpdateRanges(), e.addUpdateRange(0, this.count * e.itemSize), (e.needsUpdate = !0));
      }
    }
    dispose() {
      (this.cancelLoad?.(),
        this.mesh.parent?.remove(this.mesh),
        this.mesh.dispose(),
        this.mesh.geometry.dispose(),
        this.material.dispose(),
        !this.zxGlyph && this.material.uniforms.map.value?.dispose());
    }
  },
  tl = class {
    cap;
    mesh;
    a;
    count = 0;
    constructor(e, t = 4096) {
      this.cap = t;
      let n = new Yr(1, 1).rotateX(-Math.PI / 2);
      ((this.a = new gr(new Float32Array(t * 4), 4).setUsage(ii)), n.setAttribute(`iS`, this.a));
      let r = new Kr({
        transparent: !1,
        depthWrite: !1,
        blending: 5,
        blendSrc: 204,
        blendDst: 205,
        vertexShader: `attribute vec4 iS; varying vec2 vUv; varying float vA; void main(){ vUv = uv; vA = iS.w; vec3 p = vec3(position.x*iS.w, 0., position.z*iS.w*0.6) + iS.xyz + vec3(0.,0.06,0.); gl_Position = projectionMatrix*viewMatrix*vec4(p,1.); }`,
        fragmentShader: `varying vec2 vUv; void main(){ float d = length(vUv-0.5)*2.; float a = (1.-smoothstep(.55,1.,d))*.24; gl_FragColor = vec4(0.19,0.25,0.35,a); }`,
      });
      ((this.mesh = new Sr(n, r, t)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.count = 0),
        (this.mesh.renderOrder = 0.5),
        e.add(this.mesh));
    }
    begin() {
      this.count = 0;
    }
    push(e, t, n, r) {
      if (this.count >= this.cap) return;
      if(this.surface)t=Math.max(t,this.surface(e,n));
      let i = this.count++,
        a = this.a.array;
      ((a[i * 4] = e), (a[i * 4 + 1] = t), (a[i * 4 + 2] = n), (a[i * 4 + 3] = r));
    }
    end() {
      ((this.mesh.count = this.count),
        (this.mesh.visible = this.count > 0),
        this.a.clearUpdateRanges(),
        this.a.addUpdateRange(0, this.count * 4),
        (this.a.needsUpdate = !0));
    }
  },
  nl = 0,
  rl = class {
    scene;
    shared;
    batches = new Map();
    shadows;
    camRight = new ti();
    camFwd = new ti();
    standIn;
    constructor(e, t) {
      ((this.scene = e),
        (this.shared = t),
        (this.shadows = new tl(e)),
        (this.standIn = new el(-1, e, t, 64, il())));
      // Install before buildStage can request even its first actor.
      installGlyphs({sprites:this},{Texture:Wr,colorSpace:pi,species:id=>k.get(id)});
    }
    get(e, t = !1, word = '') {
      const key = word ? `${e}:${word}` : e;
      let n = this.batches.get(key);
      return (
        n
          ? t || n.urgent()
          : ((n = new el(e, this.scene, this.shared, this.zxGlyphs ? 1 : 64, void 0, t)),
            (n.standIn = this.standIn),
            (n.zxBatchKey = key), this.batches.set(key, n)),
        t || (n.lastUse = nl),
        n
      );
    }
    lastTrim = 0;
    trim(e = 15e3, t = uo ? 2e8 : 56e7) {
      let n = 0,
        r = [];
      for (let t of this.batches.values()) ((n += t.bytes), t.ready && nl - t.lastUse >= e && r.push(t));
      if (!(n <= t)) {
        r.sort((e, t) => e.lastUse - t.lastUse);
        for (let e of r) {
          if (n <= t) break;
          ((n -= e.bytes), this.batches.delete(e.zxBatchKey ?? e.id), e.dispose(), Nc.delete(e.url));
        }
      }
    }
    preload(e, t = !1) {
      let n = 0;
      if (t && uo) for (let e of this.batches.values()) n += e.ready ? e.bytes : 8e6;
      for (let r of e) {
        if (t && uo && !this.batches.has(r)) {
          if (n + 8e6 > 16e7) continue;
          n += 8e6;
        }
        this.get(r, t);
      }
    }
    readyCount(e) {
      let t = 0;
      for (let n of e) {const batch=this.get(n);if(batch.loadError)throw batch.loadError;if(batch.ready)t++;}
      return t;
    }
    begin(e) {
      ((nl = performance.now()),
        nl - this.lastTrim > 4e3 && ((this.lastTrim = nl), this.trim()),
        e.updateMatrixWorld(),
        this.pv.multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse),
        this.frustum.setFromProjectionMatrix(this.pv),
        e.matrixWorld.extractBasis(this.camRight, new ti(), this.camFwd),
        this.camFwd.negate(),
        (this.camFwd.y = 0),
        this.camFwd.normalize(),
        (this.camRight.y = 0),
        this.camRight.normalize());
      for (let e of this.batches.values()) e.begin();
      (this.standIn.begin(), this.shadows.begin());
    }
    end() {
      for (let e of this.batches.values()) e.end();
      (this.standIn.end(), this.shadows.end());
    }
    pv = new xr();
    frustum = new br();
    sph = new si();
    visible(e, t, n, r) {
      return (this.sph.center.set(e, t, n), (this.sph.radius = r), this.frustum.intersectsSphere(this.sph));
    }
    dirRow(e, t) {
      let n = e * this.camRight.x + t * this.camRight.z,
        r = e * this.camFwd.x + t * this.camFwd.z,
        i = Math.atan2(n, -r);
      return ((Math.round(i / (Math.PI / 4)) % 8) + 8) % 8;
    }
    clear() {
      for (let e of this.batches.values()) e.dispose();
      (this.batches.clear(), this.standIn.begin(), this.standIn.end());
    }
  };
function il() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const c=canvas.getContext('2d');c.save();c.beginPath();c.arc(48,48,40,0,Math.PI*2);c.clip();
  const cream=c.createLinearGradient(0,25,0,88);cream.addColorStop(0,'#fff6dd');cream.addColorStop(1,'#d2c6ae');c.fillStyle=cream;c.fillRect(0,0,96,96);
  const red=c.createLinearGradient(0,10,0,52);red.addColorStop(0,'#ffad72');red.addColorStop(1,'#d75d57');c.fillStyle=red;c.fillRect(0,0,96,48);
  c.fillStyle='#4e4658';c.fillRect(0,44,96,8);c.restore();c.strokeStyle='#4e4658';c.lineWidth=3;c.beginPath();c.arc(48,48,40,0,Math.PI*2);c.stroke();
  c.fillStyle='#fff2d6';c.beginPath();c.arc(48,48,11,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#ffffffaa';c.beginPath();c.ellipse(30,24,9,4,-.5,0,Math.PI*2);c.fill();return canvas;
}

export {
  Tc,
  qc,
  Qc,
  Cc,
  Dc,
  _c,
  vc,
  yc,
  Xc,
  Zc,
  rl,
  bc,
  xc,
  Rc,
  installImageRetries
};
