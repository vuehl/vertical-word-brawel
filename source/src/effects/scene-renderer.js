import {
  o as fi,
  pt as hi,
  r as _i,
  s as yi,
  w as Ei,
  $ as mr,
  K as Tr,
  L as Er,
  P as Ar,
  R as Mr,
  a as Hr,
  c as Gr,
  ct as Kr,
  d as qr,
  f as Xr,
  h as ei,
  ht as ti,
  i as ni,
  k as ai,
  l as oi,
  m as ci,
  mt as li,
  ot as pi,
  p as mi,
  st as bi,
  u as Ci,
  ut as wi
} from "../vendor/three-DmSYIDKK.js";
import {createSceneAntialias} from "../performance/scene-antialias.js";
import {uo} from "../ui/controls.js";

var Gs = (e, t, n) => (e < t ? t : e > n ? n : e),
  Ks = (e, t, n) => e + (t - e) * n,
  qs = (e, t, n) => {
    let r = Gs((n - e) / (t - e), 0, 1);
    return r * r * (3 - 2 * r);
  },
  Js = (e, t, n, r) => Ks(e, t, 1 - Math.exp(-n * r));
function Ys(e) {
  return ((e = Math.max(0, Math.floor(e))), `${Math.floor(e / 60)}:${(e % 60).toString().padStart(2, `0`)}`);
}
function Xs(e) {
  e = Math.max(0, e);
  let t = Math.floor(e / 60);
  return `${t}:${(e - t * 60).toFixed(1).padStart(4, `0`)}`;
}
function Zs(e) {
  return (e < 0 ? `−` : `+`) + Xs(Math.abs(e));
}
const largeNumberUnits=[[1e12,'万亿'],[1e8,'亿'],[1e4,'万']];
function P(value){
  for(const [unit,suffix] of largeNumberUnits)if(value>=unit)return (value/unit).toFixed(1)+suffix;
  return String(Math.round(value));
}
const ec=P;
var tc = 8,
  nc = [],
  rc = /(?:chrome|moz|safari|edge)-extension:\/\//;
function ic(e) {
  if (rc.test(e)) return;
  let t = `${new Date().toISOString().slice(11, 19)} ${e}`.slice(0, 400);
  nc[nc.length - 1] !== t && (nc.push(t), nc.length > tc && nc.shift());
}
function ac() {
  (addEventListener(`error`, (e) =>
    ic(
      e.error?.stack
        ?.split(
          `
`,
        )
        .slice(0, 3)
        .join(` | `) ?? `${e.message} @ ${e.filename}:${e.lineno}`,
    ),
  ),
    addEventListener(`unhandledrejection`, (e) => {
      let t = e.reason;
      ic(
        `promise: ` +
          (t?.stack
            ?.split(
              `
`,
            )
            .slice(0, 3)
            .join(` | `) ?? String(t)),
      );
    }));
}
var oc = (e, t) =>
    ic(
      `${e}: ${
        t?.stack
          ?.split(
            `
`,
          )
          .slice(0, 3)
          .join(` | `) ?? String(t)
      }`,
    ),
  sc = () => [...nc],
  cc = class extends fi {
    constructor() {
      super(
        `PixelOutline`,
        `
      uniform vec3 uColor; uniform float uStrength;
      uniform bool uHasFireMask; uniform sampler2D uFireMask;
      uniform bool uHasDeviceMask; uniform sampler2D uDeviceMask;
      float vz(vec2 uv){ return -getViewZ(readDepth(uv)); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor){
        float c = -getViewZ(depth);
        vec2 t = texelSize * 1.35;
        float m = max(max(vz(uv + vec2(t.x, 0.)), vz(uv - vec2(t.x, 0.))), max(vz(uv + vec2(0., t.y)), vz(uv - vec2(0., t.y))));
        float edge = smoothstep(.22 + c * .003, .40 + c * .004, m - c) * step(c, 300.);
        if (uHasDeviceMask && texture2D(uDeviceMask, uv).r > .5) edge = 0.;
        if (uHasFireMask) edge *= 1. - smoothstep(.08,.85,texture2D(uFireMask,uv).r);
        vec3 col = mix(inputColor.rgb, uColor, edge * uStrength);
        // First stop of the HDR chain: the scene lives in half floats (max 65504), so many additive glows piled up (a boss
        // fight) overflow to Inf and an Inf/NaN pixel spreads through the bloom's blur as black or white blocks, or the
        // whole screen (reports 6003, 6024, 6030, 6053, 6054). Clean it here, before the bloom sees it.
        col = any(isnan(col)) || any(isinf(col)) ? vec3(0.) : clamp(col, 0., 48.);
        outputColor = vec4(col, inputColor.a);
      }`,
        {
          attributes: yi.DEPTH,
          blendFunction: _i.NORMAL,
          uniforms: new Map([
            ['uHasDeviceMask', new hi(false)], ['uDeviceMask', new hi(null)],
            [`uColor`, new hi(new Ei(1708072))],
            [`uStrength`, new hi(0.85)],
            [`uHasFireMask`, new hi(false)],
            [`uFireMask`, new hi(null)],
          ]),
        },
      );
    }
  },
  lc = class extends fi {
    constructor() {
      super(
        `AtmosTint`,
        `
      uniform vec3 uTint;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){ outputColor = vec4(inputColor.rgb * uTint, inputColor.a); }`,
        { uniforms: new Map([[`uTint`, new hi(new Ei(1, 1, 1))]]) },
      );
    }
  },
  uc = class extends fi {
    constructor() {
      super(
        `ToonGrade`,
        `
      uniform float uAmount;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
        vec3 c = clamp(inputColor.rgb, 0., 1.);
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        vec3 g = c * mix(vec3(0.93, 0.97, 1.06), vec3(1.04, 1.01, 0.95), smoothstep(0.15, 0.75, l));
        g = mix(g, g * g * (3. - 2. * g), 0.22);
        outputColor = vec4(mix(inputColor.rgb, g, uAmount), inputColor.a);
      }`,
        { uniforms: new Map([[`uAmount`, new hi(1)]]) },
      );
    }
  },
  dc = class e {
    canvas;
    renderer;
    scene = new bi();
    camera;
    composer;
    sun;
    hemi;
    sky;
    chroma;
    vignette;
    bloom;
    hueSat;
    shared = {
      uTime: { value: 0 },
      uFogColor: { value: new Ei(12575743) },
      uFogNear: { value: 40 },
      uFogFar: { value: 160 },
      uLight: { value: new Ei(1, 1, 1) },
      uWind: { value: 1 },
    };
    chromaAmt = 0;
    quality = { pixelRatio: 1, bloom: !0, aa: !1, shadows: !1, pixelScale: 0 };
    outline;
    grade;
    tint = new lc();
    outlinePass;
    finalPass;
    finalLite;
    lost = !1;
    onLost = null;
    gpu = ``;
    softwareGpu = !1;
    constructor(e) {
      ((this.canvas = e),
        (this.renderer = new ei({
          canvas: e,
          antialias: !1,
          powerPreference: uo ? `default` : `high-performance`,
          stencil: !1,
          depth: !0,
        })),
        (this.renderer.outputColorSpace = pi),
        (this.gpu = pc(this.renderer.getContext())),
        (this.softwareGpu = fc.test(this.gpu)),
        e.addEventListener(`webglcontextlost`, (e) => {
          (e.preventDefault(), oc(`webgl`, Error(`context lost`)), (this.lost = !0), this.onLost?.(!0));
        }),
        e.addEventListener(`webglcontextrestored`, () => {
          (oc(`webgl`, Error(`context restored`)), (this.lost = !1), this.onLost?.(!1));
        }),
        (this.renderer.toneMapping = 0),
        (this.camera = new mr(70, 1, 0.1, 600)),
        (this.scene.fog = new Ar(12575743, 40, 160)),
        (this.hemi = new Mr(14676735, 9075290, 1.6)),
        this.scene.add(this.hemi),
        (this.sun = new ai(16773590, 2.2)),
        this.sun.position.set(60, 120, 40),
        this.scene.add(this.sun));
      let t = new Kr({
        side: 1,
        depthWrite: !1,
        fog: !1,
        uniforms: {
          top: { value: new Ei(5941503) },
          bottom: { value: new Ei(14217471) },
          sunDir: { value: new ti(0.4, 0.6, 0.3).normalize() },
          uTime: this.shared.uTime,
          cloudTint: { value: new Ei(1, 1, 1) },
          cover: { value: 0 },
          uPx: { value: 4 },
          glowCol: { value: new Ei(16760960) },
          glowK: { value: 0 },
          stars: { value: 0 },
          moon: { value: 0 },
          moonDir: { value: new ti(0.8, 0.28, -0.55).normalize() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
        fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform float uTime; uniform vec3 cloudTint; uniform float cover; uniform float uPx; uniform vec3 glowCol; uniform float glowK; uniform float stars; uniform float moon; uniform vec3 moonDir; varying vec3 vDir;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ return n(p)*0.5 + n(p*2.03+1.7)*0.28 + n(p*4.1+4.3)*0.14 + n(p*8.3+2.1)*0.08; }
        float bayer(vec2 p){ vec2 q = mod(floor(p), 4.); int i = int(q.y*4.+q.x);
          float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
          for (int k=0;k<16;k++) if (k==i) return m[k]/16.; return 0.; }
        float clouds(vec2 uv){ return fbm(uv) + cover * 0.28; }
        void main(){
          // Pixel-art sky: every uPx x uPx block of the screen takes the colour of its centre direction.
          vec2 fc = gl_FragCoord.xy, cell = floor(fc / uPx), sc = (cell + 0.5) * uPx;
          vec3 dir = normalize(vDir + dFdx(vDir) * (sc.x - fc.x) + dFdy(vDir) * (sc.y - fc.y));
          float dth = bayer(cell);
          // Gradient in flat bands with dithered seams (SNES style).
          float y = clamp(dir.y * 1.4 + 0.15, 0., 1.);
          float B = 7., t = pow(y, 0.8) * B;
          float tb = (floor(t) + step(1. - fract(t), 0.35) * step(dth, (fract(t) - 0.65) / 0.35)) / B;
          vec3 c = mix(bottom, top, clamp(tb, 0., 1.));
          // Late zones: a warm glow on the horizon toward the sun, in stepped dithered bands.
          if (glowK > 0.) {
            float gw = pow(max(dot(normalize(dir.xz + 1e-4), normalize(sunDir.xz + 1e-4)), 0.), 3.) * pow(1. - clamp(dir.y * 1.5, 0., 1.), 2.);
            c = mix(c, glowCol, floor(gw * 4. + dth) / 4. * glowK);
          }
          // Sun: a pixel disc with a pale ring and two stepped glow bands.
          float s = max(dot(dir, sunDir), 0.);
          float sunA = 1. - moon;
          c = mix(c, mix(c, vec3(1., 0.97, 0.86), 0.5), step(0.9955, s) * sunA);
          c = mix(c, vec3(1., 0.98, 0.9), step(0.9985, s) * sunA);
          c += vec3(1., 0.85, 0.6) * (step(0.97, s) * 0.06 + step(0.92, s + (dth - 0.5) * 0.01) * 0.04) * sunA;
          // Dusk: the first stars, high up and twinkling.
          if (stars > 0.01) { vec2 sg = floor(dir.xz/(dir.y+0.35)*90.); c += step(0.9978, h(sg)) * smoothstep(0.3, 0.7, dir.y) * stars * (0.6 + 0.4 * sin(uTime * 2.5 + h(sg + 3.1) * 40.)); }
          // Cumulus on a cloud plane (perspective toward the horizon), in four flat tones: sunlit rim, white body,
          // lilac-blue shade on the side away from the sun and a darker base.
          vec2 uv = dir.xz / (dir.y + 0.18) * 1.1 + vec2(uTime * 0.012, uTime * 0.004);
          float fade = smoothstep(0.02, 0.2, dir.y);
          float cl = clouds(uv) * fade;
          float edge = 0.56 + (dth - 0.5) * 0.02;
          if (cl > edge) {
            vec2 toSun = normalize(sunDir.xz + 1e-4) * 0.16;
            float lit = clouds(uv + toSun) * fade, shade = clouds(uv - toSun) * fade;
            vec3 body = vec3(0.97, 0.98, 1.0), sh = vec3(0.78, 0.82, 0.96), base = vec3(0.64, 0.68, 0.88), rim = vec3(1.0, 0.99, 0.93);
            float away = step(shade, cl - 0.01), toward = step(lit, cl - 0.01);
            // Shade on the side away from the sun, a darker base along its rim, a bright rim facing the sun
            // and the dense core a touch brighter.
            vec3 cc = mix(body, sh, away);
            cc = mix(cc, base, away * step(cl, edge + 0.05));
            cc = mix(cc, rim, toward * step(cl, edge + 0.06));
            cc = mix(cc, vec3(1.), step(edge + 0.16, cl) * (1. - away));
            c = mix(c, cc * cloudTint, 0.97);
          }
          // Halloween's full moon (the menu while the event is live): a big pale disc with stepped craters and a dithered halo.
          if (moon > 0.01) {
            float d = acos(clamp(dot(dir, moonDir), -1., 1.)), R = 0.075, disc = step(d, R);
            vec3 mx = normalize(cross(vec3(0., 1., 0.), moonDir)), my = cross(moonDir, mx);
            vec2 p = vec2(dot(dir - moonDir, mx), dot(dir - moonDir, my)) / R;
            float cr = n(p * 2.6 + 7.) * 0.62 + n(p * 6.5 + 2.) * 0.38;
            vec3 mc = mix(vec3(1., 0.96, 0.8), vec3(0.88, 0.82, 0.68), step(0.56, cr + (dth - 0.5) * 0.06));
            mc = mix(mc, vec3(0.76, 0.7, 0.6), step(0.7, cr));
            mc *= 1. - 0.16 * step(0.82, length(p));
            c = mix(c, mc, disc * moon);
            float hal = (1. - disc) * (step(d, R * 1.45) * 0.16 + step(d, R * 2.3 + (dth - 0.5) * 0.006) * 0.07 + exp(-max(d - R, 0.) * 9.) * 0.1);
            c += vec3(1., 0.86, 0.62) * hal * moon;
          }
          gl_FragColor = vec4(c,1.); }`,
      });
      ((this.sky = new Tr(new wi(500, 32, 16), t)),
        (this.sky.frustumCulled = !1),
        this.scene.add(this.sky),
        (this.composer = new Gr(this.renderer, { frameBufferType: Er })),
        this.composer.addPass(new qr(this.scene, this.camera)),
        (this.bloom = new ni({
          intensity: 0,
          luminanceThreshold: 0.92,
          luminanceSmoothing: 0.2,
          mipmapBlur: !0,
          radius: 0.7,
        })),
        (this.vignette = new ci({ offset: 0.32, darkness: 0.55 })),
        (this.chroma = new Hr({ offset: new li(0, 0), radialModulation: !0, modulationOffset: 0.2 })),
        (this.hueSat = new Ci({ saturation: 0 })),
        new Xr({ mode: mi.ACES_FILMIC }),
        (this.outline = new cc()),
        (this.vignette.offset = 0.4),
        (this.vignette.darkness = 0.4),
        (this.outlinePass = new oi(this.camera, this.outline)),
        this.composer.addPass(this.outlinePass),
        (this.grade = new uc()),
        (this.finalPass = new oi(this.camera, this.tint, this.grade, this.bloom, this.vignette)),
        (this.finalLite = new oi(this.camera, this.tint, this.grade, this.vignette)),
        (this.finalLite.enabled = !1),
        (this.composer.autoRenderToScreen = !1),
        (this.outlinePass.renderToScreen = !1),
        this.composer.addPass(this.finalPass),
        this.composer.addPass(this.finalLite),
        (this.antiAliasPass = new oi(this.camera, createSceneAntialias(fi))),
        (this.antiAliasPass.renderToScreen = !0),
        this.composer.addPass(this.antiAliasPass),
        this.pickFinal(),
        this.chroma,
        window.addEventListener(`resize`, () => this.resize()),
        document.addEventListener(`fullscreenchange`, () => {
          this.resize();
          for (let e of [120, 500, 1500]) setTimeout(() => this.resize(), e);
        }),
        window.visualViewport?.addEventListener(`resize`, () => this.resize()),
        this.resize());
    }
    dynRes = 1;
    static DYN_MIN = 0.6;
    setDynRes(t) {
      // An explicitly selected sharp preset must not inherit a previous
      // adaptive scale or be reduced by a delayed performance sample.
      if(this.quality.dyn===false)t=1;
      ((t = Math.round(Math.max(e.DYN_MIN, Math.min(1, t)) * 100) / 100),
        t !== this.dynRes && ((this.dynRes = t), (this.dynDirty = !0)));
    }
    dynDirty = !1;
    setQuality(e) {
      (Object.assign(this.quality, e),
        (this.outlinePass.enabled=this.quality.outline!==false),
        this.quality.dyn || (this.dynRes = 1),
        (this.bloom.intensity = this.quality.bloom && !this.combatBusy ? 0.8 * this.bloomK : 0),
        this.pickFinal(),
        this.resize());
    }
    calmFx = !1;
    combatBusy = false;
    setCombatLoad() {
      // Combat load must not switch off the player's selected bloom quality.
    }
    bloomK = 1;
    setLook(e, t) {
      ((this.calmFx = e),
        (this.bloomK = Math.max(0.2, Math.min(1, t)) * (e ? 0.45 : 1)),
        (this.bloom.intensity = this.quality.bloom && !this.combatBusy ? 0.8 * this.bloomK : 0),
        this.pickFinal());
    }
    pickFinal() {
      let e = this.bloom.intensity > 0.001;
      ((this.finalPass.enabled = e),
        (this.finalLite.enabled = !e),
        (this.finalPass.renderToScreen = !1),
        (this.finalLite.renderToScreen = !1));
    }
    get pixelScale() {
      return this.quality.pixelScale > 1 ? this.quality.pixelScale : 1;
    }
    setSky(e, t, n, r, i, a, o = 16773590, s = 9075290) {
      let c = this.sky.material;
      (c.uniforms.top.value.set(e),
        c.uniforms.bottom.value.set(t),
        this.scene.fog.color.set(n),
        (r *= 1.5),
        (i *= 1.35),
        (this.scene.fog.near = r),
        (this.scene.fog.far = i),
        this.shared.uFogColor.value.set(n),
        (this.shared.uFogNear.value = r),
        (this.shared.uFogFar.value = i),
        this.sun.color.set(o),
        (this.sun.intensity = 1.6 * a),
        this.hemi.groundColor.set(s),
        (this.hemi.intensity = 1 * a),
        this.shared.uLight.value.setScalar(0.85 + 0.15 * a));
    }
    setSun(e = [60, 120, 40], t = 0.77, n = 16760960, r = 0, i = 0) {
      let a = this.sky.material.uniforms;
      this.sun.position.set(e[0], e[1], e[2]).normalize().multiplyScalar(150);
      let o = Math.hypot(e[0], e[2]) || 1,
        s = Math.sqrt(1 - t * t) / o;
      (a.sunDir.value.set(e[0] * s, t, e[2] * s),
        a.glowCol.value.set(n),
        (a.glowK.value = r),
        (a.stars.value = i));
    }
    setMoon(e, t) {
      let n = this.sky.material.uniforms;
      ((n.moon.value = e), t && n.moonDir.value.set(t[0], t[1], t[2]).normalize());
    }
    setAtmos(red, green, blue, cover, vignette, tintR = 1, tintG = 1, tintB = 1) {
      if (!Number.isFinite(red + green + blue + cover + vignette + tintR + tintG + tintB)) return;
      if (this.calmFx) {
        tintR = Math.min(tintR, 1.04);
        tintG = Math.min(tintG, 1.04);
        tintB = Math.min(tintB, 1.04);
      }
      this.tint.uniforms.get(`uTint`).value.setRGB(tintR, tintG, tintB);
      const sky = this.sky.material.uniforms;
      sky.cloudTint.value.setRGB(red, green, blue);
      sky.cover.value = cover;
      this.vignette.darkness = vignette;
    }
    kick(e) {
      this.chromaAmt = Math.min(0.012, this.chromaAmt + e);
    }
    needsDraw = !1;
    sizeKey = ``;
    resize() {
      let e = this.canvas.clientWidth || window.innerWidth,
        t = this.canvas.clientHeight || window.innerHeight;
      if (e < 2 || t < 2) return;
      const n = this.pixelScale > 1;
      const portrait = uo && t >= e && this.hires;
      const density = portrait ? 2 : this.hires ? (uo ? 1.25 : 1.5) : 1;
      const budget = this.hires ? (uo ? 1600000 : 3700000) : 2200000;
      const nativeBudget = window.nativeGraphics?.pixelBudget ?? budget;
      const target = Math.min(window.devicePixelRatio, density, window.nativeGraphics?.maxPixelRatio ?? Infinity,
        Math.sqrt(nativeBudget / (e * t)));
      const ratio = n ? 1 / this.pixelScale : Math.max(.5, target * this.dynRes);
      const r = Math.round(ratio * 100) / 100;
      // Keep the world render targets at the chosen game quality. A phone can
      // present the final pass and the UI at a higher resolution for legible text.
      const displayRatio = Math.max(r, window.uiPixelRatio || r);
      const key = `${e}x${t}@${r}/${displayRatio}`;
      if (key === this.sizeKey) return;
      this.sizeKey = key;
      this.needsDraw = true;
      this.canvas.style.imageRendering = n ? `pixelated` : `auto`;

      // Loading the first profile can change world quality during the home zoom.
      // Writing canvas.width or height clears the presented frame, even at the same size.
      const display = this.renderer.getSize(new li());
      if (display.width !== e || display.height !== t || this.renderer.getPixelRatio() !== displayRatio) {
        this.renderer.setDrawingBufferSize(e, t, displayRatio);
        window.invalidateUI?.();
      }
      const worldWidth = Math.floor(e * r), worldHeight = Math.floor(t * r);
      const composer = this.composer;
      composer.inputBuffer.setSize(worldWidth, worldHeight);
      composer.outputBuffer.setSize(worldWidth, worldHeight);
      composer.depthRenderTarget?.setSize(worldWidth, worldHeight);
      for (const pass of composer.passes) pass.setSize(worldWidth, worldHeight);
      this.camera.aspect = e / t;
      this.camera.updateProjectionMatrix();
    }
    get hires() {
      return this.quality.hires ?? this.quality.bloom;
    }
    render(e) {
      (this.dynDirty && ((this.dynDirty = !1), this.resize()),
        (this.needsDraw = !1),
        (this.shared.uTime.value += e),
        (this.chromaAmt *= Math.exp(-e * 8)),
        this.sky.position.copy(this.camera.position));
      this.composer.render(e);
    }
  },
  fc = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;
function pc(e) {
  let t = e.getExtension(`WEBGL_debug_renderer_info`);
  try {
    return String(e.getParameter(t ? t.UNMASKED_RENDERER_WEBGL : e.RENDERER) ?? ``).slice(0, 120);
  } catch {
    return ``;
  }
}

export {
  Gs as clamp,
  qs,
  Ys,
  Js,
  oc as logGameError,
  P,
  sc,
  Xs,
  ec,
  Zs,
  dc as SceneRenderer,
  ac as installErrorLog
};
