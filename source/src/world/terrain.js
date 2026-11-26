import {Random as Ol} from "../effects/battle-particles.js";
import {
  B as gr,
  H as Sr,
  ct as Kr,
  et as Yr,
  ht as ti,
  U as Fr,
  W as Lr,
  Y as zr,
  at as Ur,
  ft as Zr,
  ot as pi,
  D as vr,
  it as ri,
  q as gi,
  G as xr,
  K as Tr,
  n as ui,
  v as Ti,
  J as wr,
  X as Rr,
  w as Ei,
  g as Qr,
  t as xi,
  mt as li,
  I as Cr,
  nt as di,
  C as _r,
  rt as vi,
  L as Er,
  M as Dr,
  O as kr,
  S as Nr,
  T as Pr,
  V as Ir,
  z as ki,
  A as hr,
  E as yr,
  Q as jr,
  _ as Vr,
  ut as wi,
  x as Di
} from "../vendor/three-DmSYIDKK.js";
import {h as Zt} from "../data/config.js";
import {Cc, Dc, _c, vc, yc} from "../actors/sprite-assets.js";
import {paperProp} from "./paper-props.js";
import {mapRulesFor} from "./map-rules.js";
import {buildPaperWorld, disposePaperWorld} from "./paper-world.js";
import {hitsPaperBox, resolvePaperBox} from "./paper-collision.js";
import {clamp as Gs, qs} from "../effects/scene-renderer.js";

var tu = 0.5 * (Math.sqrt(3) - 1),
  nu = (3 - Math.sqrt(3)) / 6,
  ru = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  iu = class {
    perm = new Uint8Array(512);
    constructor(e) {
      let t = new Ol(e),
        n = Array.from({ length: 256 }, (e, t) => t);
      t.shuffle(n);
      for (let e = 0; e < 512; e++) this.perm[e] = n[e & 255];
    }
    get(e, t) {
      let n = this.perm,
        r = (e + t) * tu,
        i = Math.floor(e + r),
        a = Math.floor(t + r),
        o = (i + a) * nu,
        s = e - (i - o),
        c = t - (a - o),
        l = +(s > c),
        u = s > c ? 0 : 1,
        d = s - l + nu,
        f = c - u + nu,
        p = s - 1 + 2 * nu,
        m = c - 1 + 2 * nu,
        h = i & 255,
        g = a & 255,
        _ = 0,
        v = 0.5 - s * s - c * c;
      if (v > 0) {
        let e = ru[n[h + n[g]] & 7];
        ((v *= v), (_ += v * v * (e[0] * s + e[1] * c)));
      }
      let y = 0.5 - d * d - f * f;
      if (y > 0) {
        let e = ru[n[h + l + n[g + u]] & 7];
        ((y *= y), (_ += y * y * (e[0] * d + e[1] * f)));
      }
      let b = 0.5 - p * p - m * m;
      if (b > 0) {
        let e = ru[n[h + 1 + n[g + 1]] & 7];
        ((b *= b), (_ += b * b * (e[0] * p + e[1] * m)));
      }
      return 70 * _;
    }
    fbm(e, t, n = 4, r = 2, i = 0.5) {
      let a = 1,
        o = 1,
        s = 0,
        c = 0;
      for (let l = 0; l < n; l++) ((s += a * this.get(e * o, t * o)), (c += a), (a *= i), (o *= r));
      return s / c;
    }
  },
  au = {
    forest: {
      trees: [
        { name: `tree0`, scale: 0.085, sway: 0.08, collider: 0.8, shadow: 3.6 },
        { name: `tree1`, scale: 0.085, sway: 0.06, collider: 0.6, shadow: 2.6 },
        { name: `tree2`, scale: 0.08, sway: 0.08, collider: 0.5, shadow: 2.2 },
        { name: `tree3`, scale: 0.085, sway: 0.08, collider: 0.7, shadow: 3.2 },
        { name: `tree4`, scale: 0.085, sway: 0.06, collider: 1, shadow: 4.2 },
        { name: `tree5`, scale: 0.085, sway: 0.1, collider: 0.4, shadow: 2 },
      ],
      big: [
        { name: `boulder`, scale: 0.05, sway: 0, collider: 1.2, shadow: 2.8 },
        { name: `stump`, scale: 0.05, sway: 0, collider: 0.7, shadow: 1.8 },
        { name: `log`, scale: 0.05, sway: 0, collider: 0.9, shadow: 2.2 },
        { name: `bush`, scale: 0.05, sway: 0.05, collider: 0, shadow: 1.8 },
        { name: `berrybush`, scale: 0.05, sway: 0.05, collider: 0, shadow: 1.8 },
      ],
      small: [
        { name: `tallgrass`, scale: 0.05, sway: 0.18, collider: 0, shadow: 0 },
        { name: `fern`, scale: 0.05, sway: 0.15, collider: 0, shadow: 0 },
        { name: `flowersA`, scale: 0.05, sway: 0.12, collider: 0, shadow: 0 },
        { name: `flowersB`, scale: 0.05, sway: 0.12, collider: 0, shadow: 0 },
        { name: `sunflower`, scale: 0.05, sway: 0.15, collider: 0, shadow: 0 },
        { name: `mushrooms`, scale: 0.05, sway: 0, collider: 0, shadow: 0 },
        { name: `rocks`, scale: 0.05, sway: 0, collider: 0, shadow: 0 },
      ],
      landmarks: [
        { name: `oak`, scale: 0.13, sway: 0.03, collider: 2.2, shadow: 7 },
        { name: `arch`, scale: 0.11, sway: 0, collider: 0, shadow: 4 },
        { name: `hollowlog`, scale: 0.1, sway: 0, collider: 1.4, shadow: 4 },
        { name: `glowshrooms`, scale: 0.1, sway: 0, collider: 0.9, shadow: 2.5 },
      ],
    },
  };
function ou(e = {}) {
  let t = e.tree ?? 0.03,
    n = e.big ?? 0.018,
    r = e.small ?? 0.012,
    i = e.sway ?? 0.06,
    a = (t, n) => (e.still?.includes(t) ? 0 : n);
  return {
    trees: [0, 1, 2, 3, 4, 5].map((n) => ({
      name: `tree${n}`,
      scale: t,
      sway: a(`tree${n}`, i),
      collider: e.treeCollider ?? 0.7,
      shadow: 3,
    })),
    big: [0, 1, 2, 3, 4].map((e) => ({ name: `big${e}`, scale: n, sway: 0, collider: 0.9, shadow: 2.2 })),
    small: [0, 1, 2, 3, 4, 5, 6].map((e) => ({
      name: `small${e}`,
      scale: r,
      sway: a(`small${e}`, i * 2),
      collider: 0,
      shadow: 0,
    })),
  };
}
function su(e, t) {
  for (let n of [...e.trees, ...e.big, ...e.small]) {
    let e = t[n.name];
    e && Object.assign(n, { model: e[0], scale: 1, sway: 0, collider: e[1], shadow: e[2] });
  }
  return e;
}
((au.desert = su(
  ou({ tree: 0.085, big: 0.05, small: 0.05, sway: 0.02, still: [`tree0`, `tree1`, `small3`] }),
  {
    tree3: [`desert_hoodoo`, 1.5, 4.2],
    big0: [`desert_boulder`, 1.3, 3],
    big4: [`desert_skull`, 0.8, 2.2],
    small1: [`desert_pebbles`, 0, 0],
    small4: [`desert_rockpile`, 0, 0],
  },
)),
  (au.graveyard = ou({ sway: 0.04, still: [`tree2`, `tree3`, `tree5`, `small1`, `small6`] })),
  (au.volcano = ou({ sway: 0 })),
  (au.glacier = su(
    ou({ tree: 0.085, big: 0.05, small: 0.05, sway: 0.03, still: [`small1`, `small3`, `small6`] }),
    {
      tree3: [`glacier_spire`, 1.2, 3.6],
      tree5: [`glacier_pillar`, 1.4, 3.8],
      big0: [`glacier_boulder`, 1.3, 3],
      big1: [`glacier_crystals`, 1, 2.6],
    },
  )),
  (au.coast = su(
    ou({ tree: 0.085, big: 0.05, small: 0.05, sway: 0.1, still: [`small0`, `small2`, `small4`, `small5`] }),
    { tree4: [`coast_stack`, 1.4, 3.8], big0: [`coast_boulder`, 1.3, 3] },
  )),
  (au.sanctum = ou({ tree: 0.05, big: 0.02, small: 0.011, sway: 0.03, treeCollider: 1.7 })),
  (au.ruins = su(
    ou({ tree: 0.05, big: 0.02, small: 0.011, sway: 0.01, treeCollider: 1.7, still: [`tree3`, `small3`] }),
    {
      tree0: [`ruins_hoodoo`, 1.9, 4.5],
      tree2: [`ruins_obelisk`, 2.2, 5],
      tree4: [`ruins_arch`, 1.7, 6],
      tree5: [`ruins_statue`, 3.2, 7],
      big0: [`ruins_brazier`, 0.8, 2.2],
      big1: [`ruins_obelisk_broken`, 1, 2.6],
      big2: [`ruins_column`, 1, 2.6],
      big3: [`desert_boulder`, 1.3, 3],
      big4: [`ruins_fossil`, 1, 3.2],
      small0: [`ruins_crystals`, 0, 0],
      small1: [`ruins_pots`, 0, 0],
      small5: [`ruins_bones`, 0, 0],
    },
  )),
  (au.stormcape = su(
    ou({
      tree: 0.155,
      big: 0.06,
      small: 0.05,
      sway: 0.06,
      treeCollider: 1.7,
      still: [`tree2`, `small0`, `small2`, `small4`, `small5`],
    }),
    { big0: [`storm_coil`, 0.8, 2.2], big1: [`coast_boulder`, 1.3, 3] },
  )),
  (au.frostlake = su(
    ou({
      tree: 0.155,
      big: 0.06,
      small: 0.05,
      sway: 0.02,
      treeCollider: 1.7,
      still: [`tree4`, `small1`, `small3`, `small6`],
    }),
    { big0: [`frost_lamp`, 0.8, 2.2], big1: [`glacier_crystals`, 1, 2.6] },
  )),
  (au.tower = (() => {
    let e = ou({ tree: 0.05, big: 0.05, small: 0.05, sway: 0, treeCollider: 0.5 });
    for (let t of e.trees) t.shadow = 1.4;
    for (let t of e.big) ((t.collider = 0.7), (t.shadow = 1.6));
    return ((e.big[3].collider = 0), (e.big[4].collider = 0.5), e);
  })()));
var cu = `
  const vec2 WIND_DIR = vec2(0.86, 0.51);
  // Horizontal offset at relative height h (0 base, 1 top), as a share of the sprite height.
  float windSway(vec2 p, float t, float h, float heightOffset){
    float bend = max(0., h - heightOffset) / (1. - heightOffset); bend *= bend;
    float minS = 0.35, maxS = 1.0, interval = 3.5, detail = 1.7;
    float gust = mix(minS, maxS, 0.5 + 0.5 * sin(t / interval + dot(p, vec2(0.031, 0.017))));
    float ph = t * 1.6 - dot(p, WIND_DIR) * 0.22;
    float wave = (sin(ph) + cos(ph * detail + 0.6)) * 0.5;
    return wave * gust * bend;
  }`,
  lu = class {
    mesh;
    shadows;
    material;
    constructor(e, t, n, r, i) {
      let a = n;
      n = n.filter((e) => !e.kind.model);
      let o = n.length,
        s = new Yr(1, 1, 1, 6).translate(0, 0.5, 0),
        c = new Float32Array(o * 4),
        l = new Float32Array(o * 4),
        u = new Float32Array(o * 4);
      (n.forEach((e, n) => {
        let r = t.sprites[e.kind.name];
        c.set([e.x, e.y, e.z, e.kind.sway], n * 4);
        let i = e.kind.name.startsWith(`tree`) ? 0.22 : e.kind.collider > 0 ? 0.1 : 0;
        l.set([r.w * e.kind.scale * e.s, r.h * e.kind.scale * e.s, e.kind.scale * e.s, i], n * 4);
        let a = r.x / t.w,
          o = (r.x + r.w) / t.w;
        (e.flip && ([a, o] = [o, a]), u.set([a, 1 - (r.y + r.h) / t.h, o, 1 - r.y / t.h], n * 4));
      }),
        s.setAttribute(`iPos`, new gr(c, 4)),
        s.setAttribute(`iSize`, new gr(l, 4)),
        s.setAttribute(`iUV`, new gr(u, 4)),
        (this.material = new Kr({
          uniforms: {
            map: { value: e },
            uTime: r.uTime,
            uWind: r.uWind,
            uTint: { value: i },
            uFogColor: r.uFogColor,
            uFogNear: r.uFogNear,
            uFogFar: r.uFogFar,
            uPlayer: { value: new ti(0, -999, 0) },
          },
          vertexShader: `
        attribute vec4 iPos; attribute vec4 iSize; attribute vec4 iUV;
        uniform float uTime; uniform float uWind; uniform vec3 uPlayer;
        varying vec2 vUv; varying float vD; varying float vY; varying float vFade;
        ${cu}
        void main(){
          // Cylindrical billboard: rotate around the vertical axis to face the camera.
          vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]));
          float h = position.y;
          float sway = 0.0, dip = 0.0;
          if (iPos.w > 0.0) {
            sway = windSway(iPos.xz, uTime, h, iSize.w) * iPos.w * uWind * iSize.y * 1.2;
            sway = floor(sway / iSize.z + 0.5) * iSize.z;  // whole atlas pixels, like the sprite itself
            dip = 0.5 * sway * sway / max(iSize.y, 0.01);
          }
          vec3 w = iPos.xyz + right * (position.x * iSize.x + sway) + vec3(0., h * iSize.y - dip, 0.);
          vec4 mv = viewMatrix * vec4(w, 1.);
          vD = -mv.z; gl_Position = projectionMatrix * mv;
          vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y)); vY = h;
          // Fade props standing between the camera and the player (screen-door transparency).
          vec3 a = cameraPosition, b = uPlayer + vec3(0., 1., 0.), c = iPos.xyz + vec3(0., iSize.y * 0.45, 0.);
          vec3 ab = b - a; float t = clamp(dot(c - a, ab) / dot(ab, ab), 0., 1.);
          float dseg = length(a + ab * t - c);
          vFade = (1. - smoothstep(iSize.x * 0.35 + 0.8, iSize.x * 0.6 + 2.5, dseg)) * step(t, 0.97) * step(0.02, t);
        }`,
          fragmentShader: `
        uniform sampler2D map; uniform vec3 uTint; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
        varying vec2 vUv; varying float vD; varying float vY; varying float vFade;
        float bayer4(vec2 p){ vec2 q = mod(floor(p), 4.); float i = q.y * 4. + q.x;
          return mod(i * 7., 16.) / 16.; }
        void main(){
          vec4 t = texture2D(map, vUv);
          if (t.a < 0.5) discard;
          if (vFade > 0.01 && bayer4(gl_FragCoord.xy) < vFade * 0.75) discard;
          vec3 c = t.rgb * uTint * mix(0.78, 1.0, smoothstep(0.0, 0.22, vY));
          gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
        }`,
        })),
        (this.mesh = new Sr(s, this.material, o)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.renderOrder = 1));
      let d = a.filter((e) => e.kind.shadow > 0),
        f = new Yr(1, 1).rotateX(-Math.PI / 2),
        p = new Float32Array(d.length * 4);
      (d.forEach((e, t) => p.set([e.x, e.y + 0.05, e.z, e.kind.shadow * e.s], t * 4)),
        f.setAttribute(`iS`, new gr(p, 4)));
      let m = new Kr({
        transparent: !1,
        depthWrite: !1,
        blending: 5,
        blendSrc: 204,
        blendDst: 205,
        vertexShader: `attribute vec4 iS; varying vec2 vUv; void main(){ vUv = uv; vec3 p = vec3(position.x*iS.w, 0., position.z*iS.w*0.7) + iS.xyz; gl_Position = projectionMatrix*viewMatrix*vec4(p,1.); }`,
        fragmentShader: `varying vec2 vUv; void main(){ float d = length(vUv-0.5)*2.; float a = smoothstep(1.,0.25,d)*0.32; gl_FragColor = vec4(0.08,0.06,0.2,a); }`,
      });
      ((this.shadows = new Sr(f, m, d.length)),
        (this.shadows.frustumCulled = !1),
        (this.shadows.renderOrder = 0.5));
    }
    dispose() {
      (this.mesh.geometry.dispose(),
        this.material.dispose(),
        this.shadows.geometry.dispose(),
        this.shadows.material.dispose());
    }
  };
async function uu(e) {
  if (!au[e]) return null;
  let t = (t) => Zt(`env/${e}/${t}`);
  try {
    let e = await Dc(t(`atlas.json`), 12, async (e) => {
        let n = await fetch(Cc(t(`atlas.json`), e));
        if (!n.ok) throw Error(`atlas`);
        return await n.json();
      }),
      n = new Zr(),
      r = (e, r, i) =>
        Dc(
          t(e),
          12,
          (a) =>
            new Promise((o, s) =>
              n.load(
                Cc(t(e), a),
                (e) => {
                  ((e.colorSpace = pi),
                    (e.magFilter = i ? zr : Fr),
                    (e.minFilter = Lr),
                    (e.anisotropy = 4),
                    r && (e.wrapS = e.wrapT = Ur),
                    o(e));
                },
                void 0,
                s,
              ),
            ),
        ),
      [i, a, o, s] = await Promise.all([
        r(`atlas.png`, !1, !0),
        r(`ground.png`, !0, !0),
        r(`cliff.png`, !0, !0),
        r(`path.png`, !0, !0),
      ]);
    return (
      (i.minFilter = zr),
      (i.generateMipmaps = !1),
      (i.needsUpdate = !0),
      { atlas: e, atlasTex: i, ground: a, cliff: o, path: s }
    );
  } catch {
    return null;
  }
}
var mu = new Map(),
  hu = (() => {
    let e = new vr(new Uint8Array([120, 190, 255]), 3, 1, ri);
    return ((e.minFilter = e.magFilter = zr), (e.needsUpdate = !0), e);
  })(),
  gu = (() => {
    let e = new gi({ color: 1905968, side: 1 });
    return (
      (e.onBeforeCompile = (e) => {
        e.vertexShader = e.vertexShader.replace(
          `#include <begin_vertex>`,
          `vec3 transformed = position + normal * 0.045;`,
        );
      }),
      e
    );
  })(),
  _u =
    /^(Stub|Lid|Cap|Lever|Lamp|Egg|Bell|Orb|Horn|Disc|Crystal|Column|Helix|Dome|Amber|Rune\d*|Charge\d*|Pod.*)$|Glow|Flame|Eyes|Grin/;
function vu(e) {
  e.updateMatrixWorld(!0);
  let t = new xr().copy(e.matrixWorld).invert(),
    n = (t) => {
      for (let n = t; n && n !== e; n = n.parent) if (_u.test(n.name)) return !0;
      return !1;
    },
    r = (e) => {
      let t = !1;
      return (
        e.traverse((n) => {
          n !== e && _u.test(n.name) && (t = !0);
        }),
        t
      );
    },
    i = new Map();
  e.traverse((e) => {
    let t = e;
    !t.isMesh ||
      Array.isArray(t.material) ||
      n(t) ||
      r(t) ||
      t.isSkinnedMesh ||
      (!Object.keys(t.geometry.attributes).some((e) => e !== `position` && e !== `normal` && e !== `uv`) &&
        t.geometry.attributes.normal &&
        (i.get(t.material) ?? i.set(t.material, []).get(t.material)).push(t));
  });
  for (let [n, r] of i) {
    if (r.length < 2) continue;
    let i = r.map((e) => {
        let n = e.geometry.clone().applyMatrix4(new xr().multiplyMatrices(t, e.matrixWorld));
        return (
          n.attributes.uv ||
            n.setAttribute(`uv`, new Ti(new Float32Array(n.attributes.position.count * 2), 2)),
          n.index ? n.toNonIndexed() : n
        );
      }),
      a = ui(i);
    if (!a) continue;
    let o = new Tr(a, n);
    ((o.name = `Static`), e.add(o));
    for (let e of r) e.parent?.remove(e);
  }
}
function yu(e) {
  let t = new Map(),
    n = [];
  e.traverse((e) => {
    e.isMesh && n.push(e);
  });
  for (let e of n) {
    let n = e.material,
      r = t.get(n);
    if (!r) {
      let e = n.map;
      e && ((e.magFilter = zr), (e.minFilter = Rr), (e.colorSpace = pi), (e.needsUpdate = !0));
      let i = n.emissive && n.emissive.getHex() !== 0;
      ((r = new wr({
        map: e ?? null,
        color: e ? 16777215 : n.color,
        gradientMap: hu,
        emissive: i ? n.emissive : new Ei(0),
        emissiveIntensity: i ? 1.4 : 0,
      })),
        t.set(n, r));
    }
    if (((e.material = r), !r.emissiveIntensity)) {
      let t = new Tr(e.geometry, gu);
      ((t.raycast = () => {}), e.add(t));
    }
  }
}
function bu(e) {
  const paper=paperProp(e);if(paper)return Promise.resolve(paper);
  return loadModelTemplate(e).then(model => model?.clone(true) ?? null);
}
function loadModelTemplate(e) {
  let t = mu.get(e);
  if (!t) {
    let n = Zt(`models/${e}.glb`),
      r = async (t) => {
        try {
          let e = await new xi().loadAsync(t ? `${n}&r=${t}` : n);
          if (e.scene.userData.deviceScreenFx) {
            // Retain the authored unlit textures, glass and root metadata. yu adds the legacy hull.
            const size = new Qr().setFromObject(e.scene).getSize(new ti());
            e.scene.userData.displayHeight = size.y;
            e.scene.userData.footprintRadius = Math.hypot(size.x, size.z) / 2;
          } else {
            vu(e.scene);
            yu(e.scene);
          }
          yc(n);
          return e.scene;
        } catch {
          return t >= 11
            ? (yc(n), mu.delete(e), null)
            : (await new Promise((e) => {
                let r = setTimeout(e, _c(t));
                vc(n, () => {
                  (clearTimeout(r), e());
                });
              }),
              r(t + 1));
        }
      };
    ((t = r(0)), mu.set(e, t));
  }
  return t;
}
async function xu(e) {
  try {
    let t = Zt(`models/${e}.glb`),
      n = null;
    for (let e = 0; !n; e++)
      try {
        ((n = await new xi().loadAsync(e ? `${t}&r=${e}` : t)), yc(t));
      } catch (n) {
        if (e >= 10) throw (yc(t), n);
        await new Promise((n) => {
          let r = setTimeout(n, _c(e));
          vc(t, () => {
            (clearTimeout(r), n());
          });
        });
      }
    n.scene.updateMatrixWorld(!0);
    let r = new Map();
    n.scene.traverse((e) => {
      let t = e;
      if (!t.isMesh) return;
      let n = t.geometry.clone().applyMatrix4(t.matrixWorld);
      for (let e of Object.keys(n.attributes))
        e !== `position` && e !== `normal` && e !== `uv` && n.deleteAttribute(e);
      n.attributes.uv || n.setAttribute(`uv`, new Ti(new Float32Array(n.attributes.position.count * 2), 2));
      let i = t.material;
      (r.get(i) ?? r.set(i, []).get(i)).push(n);
    });
    let i = [...r].map(([e, t]) => ({ geo: ui(t.map((e) => (e.index ? e.toNonIndexed() : e))), src: e })),
      a = new Qr();
    for (let e of i) (e.geo.computeBoundingBox(), a.union(e.geo.boundingBox));
    return { parts: i, size: new li(Math.max(a.max.x - a.min.x, a.max.z - a.min.z), a.max.y) };
  } catch {
    return null;
  }
}
function Su(e, t, n, r = 0) {
  ((e.onBeforeCompile = (e) => {
    ((e.uniforms.uPlayer = t), (e.uniforms.uSize = { value: n }));
    let i = e.vertexShader;
    (r &&
      (i = i.replace(`#include <begin_vertex>`, `vec3 transformed = position + normal * ${r.toFixed(3)};`)),
      (e.vertexShader =
        `uniform vec3 uPlayer; uniform vec2 uSize; varying float vFade;
` +
        i.replace(
          `#include <project_vertex>`,
          `#include <project_vertex>
      {
        vec3 c = (modelMatrix * instanceMatrix * vec4(0., uSize.y * 0.45, 0., 1.)).xyz;
        vec3 a = cameraPosition, ab = uPlayer + vec3(0., 1., 0.) - a;
        float t = clamp(dot(c - a, ab) / dot(ab, ab), 0., 1.);
        float w = uSize.x * length(instanceMatrix[0].xyz);
        vFade = (1. - smoothstep(w * 0.35 + 0.8, w * 0.6 + 2.5, length(a + ab * t - c))) * step(t, 0.97) * step(0.02, t);
      }`,
        )),
      (e.fragmentShader =
        `varying float vFade;
      float envBayer4(vec2 p){ vec2 q = mod(floor(p), 4.); return mod((q.y * 4. + q.x) * 7., 16.) / 16.; }
` +
        e.fragmentShader.replace(
          `void main() {`,
          `void main() {
  if (vFade > 0.01 && envBayer4(gl_FragCoord.xy) < vFade * 0.75) discard;`,
        )));
  }),
    (e.customProgramCacheKey = () => `envfade${r}`));
}
var Cu = class e {
    group = new Cr();
    uPlayer = { value: new ti(0, -999, 0) };
    mats = [];
    static async create(t) {
      let n = new e(),
        r = new Map();
      for (let e of t)
        e.kind.model && (r.get(e.kind.model) ?? r.set(e.kind.model, []).get(e.kind.model)).push(e);
      let i = await Promise.all([...r.keys()].map(xu));
      return (
        [...r.values()].forEach((e, t) => {
          let r = i[t];
          r && n.add(r, e);
        }),
        n
      );
    }
    add(e, t) {
      let n = new xr(),
        r = new di(),
        i = new ti(0, 1, 0),
        a = new ti(),
        o = new ti(),
        s = new gi({ color: 1905968, side: 1 });
      (Su(s, this.uPlayer, e.size, 0.045), this.mats.push(s));
      for (let c of e.parts) {
        let l = c.src.map;
        l && ((l.magFilter = zr), (l.minFilter = Rr), (l.colorSpace = pi), (l.needsUpdate = !0));
        let u = c.src.emissive && c.src.emissive.getHex() !== 0,
          d = new wr({
            map: l ?? null,
            color: l ? 16777215 : c.src.color,
            gradientMap: hu,
            emissive: u ? c.src.emissive : new Ei(0),
            emissiveIntensity: u ? 0.6 : 0,
          });
        (Su(d, this.uPlayer, e.size), this.mats.push(d));
        let f = new Sr(c.geo, d, t.length),
          p = u ? null : new Sr(c.geo, s, t.length);
        t.forEach((e, t) => {
          let s = ((Math.sin(e.x * 12.9898 + e.z * 78.233) * 43758.5453) % 1) * Math.PI * 2;
          (n.compose(o.set(e.x, e.y, e.z), r.setFromAxisAngle(i, s), a.setScalar(e.s)),
            f.setMatrixAt(t, n),
            p?.setMatrixAt(t, n));
        });
        for (let e of p ? [f, p] : [f])
          (e.computeBoundingSphere(), (e.raycast = () => {}), this.group.add(e));
      }
    }
    dispose() {
      this.group.traverse((e) => {
        let t = e;
        t.isMesh && t.geometry.dispose();
      });
      for (let e of this.mats) e.dispose();
    }
  },
  wu = (e) => [(e >> 16) & 255, (e >> 8) & 255, e & 255],
  Tu = (e, t) => [
    Math.max(0, Math.min(255, e[0] * t)),
    Math.max(0, Math.min(255, e[1] * t)),
    Math.max(0, Math.min(255, e[2] * t)),
  ],
  Eu = class {
    w;
    h;
    d;
    constructor(e, t) {
      ((this.w = e), (this.h = t), (this.d = new Uint8ClampedArray(e * t * 4)));
    }
    set(e, t, n, r = 255) {
      ((e = ((e % this.w) + this.w) % this.w), (t = ((t % this.h) + this.h) % this.h));
      let i = (t * this.w + e) * 4;
      ((this.d[i] = n[0]), (this.d[i + 1] = n[1]), (this.d[i + 2] = n[2]), (this.d[i + 3] = r));
    }
    get(e, t) {
      ((e = ((e % this.w) + this.w) % this.w), (t = ((t % this.h) + this.h) % this.h));
      let n = (t * this.w + e) * 4;
      return [this.d[n], this.d[n + 1], this.d[n + 2]];
    }
    fill(e) {
      for (let t = 0; t < this.h; t++) for (let n = 0; n < this.w; n++) this.set(n, t, e);
    }
    tex(e = !0) {
      let t = new Uint8Array(this.d.length);
      for (let e = 0; e < this.h; e++)
        t.set(this.d.subarray((this.h - 1 - e) * this.w * 4, (this.h - e) * this.w * 4), e * this.w * 4);
      let n = new vr(t, this.w, this.h, vi);
      return (
        (n.magFilter = zr),
        (n.minFilter = zr),
        (n.generateMipmaps = !1),
        (n.wrapS = n.wrapT = e ? Ur : _r),
        (n.colorSpace = pi),
        (n.needsUpdate = !0),
        n
      );
    }
  };
function Du(e, t, n, r) {
  let i = Math.ceil(t / r),
    a = Math.ceil(n / r),
    o = Array.from({ length: i * a }, () => e.next()),
    s = (e, t) => o[(((t % a) + a) % a) * i + (((e % i) + i) % i)];
  return (e, t) => {
    let n = e / r,
      i = t / r,
      a = Math.floor(n),
      o = Math.floor(i),
      c = n - a,
      l = i - o,
      u = c * c * (3 - 2 * c),
      d = l * l * (3 - 2 * l);
    return (
      (s(a, o) * (1 - u) + s(a + 1, o) * u) * (1 - d) + (s(a, o + 1) * (1 - u) + s(a + 1, o + 1) * u) * d
    );
  };
}
var Ou = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((e) => e / 16),
  ku = (e, t) => Ou[(t & 3) * 4 + (e & 3)];
function Au(e, t, n, r, i, a = 32) {
  let o = new Ol(e),
    s = new Eu(a, a),
    c = Du(o, a, a, a / 4),
    l = Du(o, a, a, a / 8),
    u = wu(t),
    d = wu(n),
    f = wu(r);
  for (let e = 0; e < a; e++)
    for (let t = 0; t < a; t++) {
      let n = c(t, e) * 0.7 + l(t, e) * 0.3 + (ku(t, e) - 0.5) * 0.18;
      s.set(t, e, n > 0.66 ? d : n < 0.32 ? f : u);
    }
  if (i === `grass` || i === `moss`) {
    for (let e = 0; e < a * 1.4; e++) {
      let e = o.int(0, a - 1),
        t = o.int(1, a - 1);
      (s.set(e, t, Tu(d, 1.12)), s.set(e, t + 1, Tu(f, 0.9)));
    }
    if (i === `grass`)
      for (let e = 0; e < a / 10; e++) {
        let e = o.int(0, a - 1),
          t = o.int(0, a - 1);
        s.set(
          e,
          t,
          o.pick([
            [255, 255, 255],
            [255, 220, 90],
            [255, 140, 170],
          ]),
        );
      }
  } else if (i === `sand`) {
    for (let e = 0; e < a; e += 4)
      for (let t = 0; t < a; t++)
        Math.sin((t + e * 0.5) * 0.5 + e) > 0.6 && s.set(t, e + ((t >> 3) % 2), Tu(d, 1.05));
    for (let e = 0; e < a / 3; e++) s.set(o.int(0, a - 1), o.int(0, a - 1), Tu(f, 0.85));
  } else if (i === `snow`) {
    for (let e = 0; e < a / 2; e++) s.set(o.int(0, a - 1), o.int(0, a - 1), [255, 255, 255]);
    for (let e = 0; e < a / 4; e++) s.set(o.int(0, a - 1), o.int(0, a - 1), Tu(f, 0.95));
  } else if (i === `ash`)
    for (let e = 0; e < a / 4; e++) {
      let e = o.int(0, a - 1),
        t = o.int(0, a - 1);
      s.set(e, t, [255, 120, 40]);
    }
  return s.tex();
}
function ju(e, t, n, r, i, a = 32) {
  let o = new Ol(e),
    s = new Eu(a, a),
    c = Du(o, a, a, 6),
    l = wu(t),
    u = wu(n),
    d = wu(r),
    f = 0;
  for (; f < a; ) {
    let e = o.int(4, 7),
      t = o.int(0, 7);
    for (; t < a + 8; ) {
      let n = o.int(5, 11),
        r = o.range(0.85, 1.1);
      for (let i = f; i < Math.min(a, f + e); i++)
        for (let a = t; a < t + n; a++) {
          let o = Tu(l, r * (0.92 + c(a, i) * 0.16));
          (i === f && (o = Tu(u, r)),
            (i === f + e - 1 || a === t + n - 1) && (o = Tu(d, 0.9)),
            s.set(a, i, o));
        }
      t += n;
    }
    f += e;
  }
  for (let e = 0; e < 3; e++) {
    let e = o.int(0, a - 1),
      t = o.int(0, a - 1);
    for (let n = 0; n < 6; n++) (s.set(e, t, Tu(d, 0.7)), (e += o.int(-1, 1)), t++);
  }
  if (i != null) {
    let e = wu(i);
    for (let t = 0; t < a; t++) {
      let n = 2 + ((t * 7) % 5 == 0 ? 2 : +((t * 3) % 4 == 0));
      for (let r = 0; r < n; r++) s.set(t, r, r === n - 1 ? Tu(e, 0.75) : e);
    }
  }
  return s.tex();
}
function Mu(e, t) {
  let n = new Ol(e),
    r = new Eu(16, 32),
    i = wu(t);
  for (let e = 0; e < 16; e++) {
    let t = (e % 4 == 0 ? 0.75 : 1) * n.range(0.92, 1.05);
    for (let a = 0; a < 32; a++) r.set(e, a, Tu(i, t * (n.chance(0.08) ? 0.8 : 1)));
  }
  return r.tex();
}
function Nu(e, t, n = 32) {
  let r = new Ol(e),
    i = new Eu(n, n),
    a = wu(t),
    o = Tu(a, 1.3),
    s = Tu(a, 0.65);
  i.fill(Tu(a, 0.85));
  for (let e = 0; e < n * 3; e++) {
    let e = r.int(0, n - 1),
      t = r.int(0, n - 1);
    (i.set(e, t, o), i.set(e + 1, t, a), i.set(e, t + 1, a), i.set(e + 1, t + 1, s));
  }
  return i.tex();
}
function Pu(e, t) {
  let n = new Ol(e),
    r = new Eu(32, 32),
    i = wu(t),
    a = Du(n, 32, 32, 6);
  for (let e = 0; e < 32; e++)
    for (let t = 0; t < 32; t++) {
      let n = a(t, e) + (ku(t, e) - 0.5) * 0.2;
      r.set(t, e, Tu(i, n > 0.6 ? 1.18 : n < 0.35 ? 0.78 : 1));
    }
  return r.tex();
}
function Fu(e, t, n) {
  let r = new Ol(e),
    i = new Eu(128, 32);
  for (let e = 0; e < i.d.length; e += 4) i.d[e + 3] = 0;
  let a = wu(t),
    o = Tu(a, 1.3),
    s = Tu(a, 0.65),
    c = wu(n),
    l = (e, t) => {
      let n = (e % 8) * 16,
        r = Math.floor(e / 8) * 16;
      t(n, r, (e, t, a) => {
        e >= 0 && t >= 0 && e < 16 && t < 16 && i.set(n + e, r + t, a);
      });
    };
  for (let e = 0; e < 4; e++)
    l(e, (t, n, i) => {
      let c = 4 + e;
      for (let e = 0; e < c; e++) {
        let e = 3 + r.int(0, 9),
          t = r.int(5, 11),
          n = r.pick([-1, 0, 1]);
        for (let r = 0; r < t; r++) (i(e, 15 - r, r > t - 3 ? o : r < 2 ? s : a), r % 4 == 3 && (e += n));
      }
    });
  for (let e = 4; e < 6; e++)
    l(e, (t, n, r) => {
      for (let e = 0; e < 7; e++) r(7, 15 - e, s);
      (r(6, 12, a), r(8, 11, a));
      let i = e === 4 ? [255, 255, 255] : c;
      (r(7, 7, [255, 220, 80]),
        r(6, 7, i),
        r(8, 7, i),
        r(7, 6, i),
        r(7, 8, i),
        r(3, 15, s),
        r(3, 14, a),
        r(11, 15, s),
        r(12, 14, a));
    });
  (l(6, (e, t, n) => {
    for (let e = 11; e < 16; e++) (n(7, e, [240, 230, 210]), n(8, e, [220, 205, 185]));
    for (let e = 3; e < 13; e++)
      for (let t = 7; t < 11; t++)
        Math.abs(e - 7.5) + (10 - t) * 1.2 < 6 && n(e, t, (e + t) % 5 == 0 ? [255, 255, 255] : [228, 60, 60]);
  }),
    l(7, (e, t, n) => {
      for (let [e, t, r] of [
        [5, 13, 2],
        [10, 14, 1.6],
        [12, 12, 1.2],
      ])
        for (let i = -3; i <= 3; i++)
          for (let a = -3; a <= 3; a++)
            i * i + a * a <= r * r && n(e + i, t + a, a < 0 ? [190, 185, 175] : [140, 135, 128]);
    }),
    l(8, (e, t, n) => {
      for (let e = 4; e < 16; e++) {
        let t = Math.min(3, (e - 3) >> 1);
        for (let r = -t; r <= t; r++) n(7 + r, e, r < 0 ? Tu(c, 1.3) : c);
      }
    }),
    l(9, (e, t, n) => {
      for (let e = 4; e < 12; e++)
        for (let t = 9; t < 15; t++) (e - 8) ** 2 + (t - 12) ** 2 < 10 && n(e, t, [235, 230, 215]);
      (n(6, 11, [40, 30, 50]), n(9, 11, [40, 30, 50]));
    }));
  for (let e = 10; e < 12; e++)
    l(e, (e, t, n) => {
      for (let e = 0; e < 9; e++) {
        let e = 1 + r.int(0, 13),
          t = r.int(8, 15);
        for (let i = 0; i < t; i++)
          (n(e, 15 - i, i > t - 3 ? o : i < 3 ? s : a), i % 5 == 4 && (e += r.pick([-1, 1])));
      }
    });
  return (
    l(12, (e, t, n) => {
      for (let e = 2; e < 14; e++)
        for (let t = 6; t < 16; t++)
          (e - 8) ** 2 / 36 + (t - 11) ** 2 / 25 < 1 && n(e, t, (e + t) % 3 == 0 ? o : a);
      (n(5, 9, [80, 120, 255]), n(10, 11, [80, 120, 255]), n(8, 8, [80, 120, 255]));
    }),
    l(13, (e, t, n) => {
      for (let e = 4; e < 16; e++) n(7 + (e < 9 ? (9 - e) >> 1 : 0), e, [110, 85, 60]);
      (n(5, 8, [110, 85, 60]), n(4, 7, [110, 85, 60]));
    }),
    l(14, (e, t, n) => {
      for (let e = 4; e < 12; e++)
        for (let t = 11; t < 16; t++)
          (e - 8) ** 2 + (t - 15) ** 2 < 14 && n(e, t, t < 13 ? [255, 160, 40] : [200, 60, 20]);
    }),
    l(15, (e, t, n) => {
      for (let e = 2; e < 14; e++)
        for (let t = 10; t < 16; t++)
          (e - 8) ** 2 / 36 + (t - 16) ** 2 / 25 < 1 && n(e, t, t < 12 ? [255, 255, 255] : [210, 225, 240]);
    }),
    i.tex(!1)
  );
}
var Iu = 13.5,
  Lu = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float eq(float a, float b){ return step(abs(a - b), 0.5); }`,
  Ru = `
  float bayer4(vec2 p){ vec2 q = mod(p, 4.); float v = mod(q.x + q.y * 2., 4.) / 4.; return fract(v + q.y * 0.3125); }`,
  zu = {
    a: [0.6, 0.45, 0.36],
    b: [0.71, 0.55, 0.41],
    light: [0.88, 0.74, 0.54],
    dark: [0.43, 0.31, 0.29],
    ink: [0.24, 0.16, 0.22],
    mossA: [0.42, 0.68, 0.28],
    mossB: [0.3, 0.52, 0.24],
  },
  Bu = {
    ...zu,
    a: [0.58, 0.41, 0.3],
    b: [0.68, 0.5, 0.35],
    light: [0.86, 0.69, 0.47],
    dark: [0.4, 0.27, 0.24],
    block: [2.2, 3.2],
    mossA: [0.38, 0.6, 0.24],
    mossB: [0.26, 0.45, 0.2],
    moss: 0.74,
  },
  Vu = {
    a: [0.72, 0.34, 0.2],
    b: [0.8, 0.42, 0.25],
    light: [0.93, 0.6, 0.38],
    dark: [0.5, 0.22, 0.18],
    ink: [0.3, 0.11, 0.14],
    mossA: [0, 0, 0],
    mossB: [0, 0, 0],
    moss: 2,
    band: [0.92, 0.7, 0.48],
    block: [2.6, 3.6],
    ground: `sand`,
  },
  Hu = {
    a: [0.44, 0.48, 0.52],
    b: [0.53, 0.57, 0.6],
    light: [0.74, 0.78, 0.8],
    dark: [0.3, 0.33, 0.39],
    ink: [0.17, 0.18, 0.25],
    mossA: [0.36, 0.62, 0.3],
    mossB: [0.22, 0.44, 0.26],
    moss: 0.7,
    band: [0.66, 0.62, 0.56],
    block: [2.4, 3.4],
    shore: [0.96, 0.88, 0.66],
  },
  Uu = {
    a: [0.5, 0.56, 0.68],
    b: [0.58, 0.64, 0.76],
    light: [0.8, 0.86, 0.94],
    dark: [0.34, 0.38, 0.54],
    ink: [0.18, 0.2, 0.34],
    mossA: [0.97, 0.98, 1],
    mossB: [0.8, 0.84, 0.96],
    moss: 0.5,
    band: [0.62, 0.78, 0.92],
    block: [2.2, 3.2],
    ground: `snow`,
  },
  Wu = {
    forest: Bu,
    desert: Vu,
    coast: Hu,
    glacier: Uu,
    stormcape: {
      a: [0.32, 0.35, 0.42],
      b: [0.4, 0.43, 0.5],
      light: [0.62, 0.66, 0.72],
      dark: [0.2, 0.22, 0.29],
      ink: [0.1, 0.1, 0.16],
      mossA: [0.42, 0.56, 0.24],
      mossB: [0.28, 0.4, 0.2],
      moss: 0.78,
      band: [0.52, 0.5, 0.48],
      block: [1.6, 2.2],
      ground: `beach`,
    },
    frostlake: Uu,
  },
  Gu = (e) => `vec3(${e.map((e) => e.toFixed(3)).join(`, `)})`;
function Ku(e) {
  return `
  const vec3 RA = ${Gu(e.a)}, RB = ${Gu(e.b)}, RL = ${Gu(e.light)}, RD = ${Gu(e.dark)}, RK = ${Gu(e.ink)};
  const vec3 MA = ${Gu(e.mossA)}, MB = ${Gu(e.mossB)};
  vec3 rock(float u, float y, float wet){
    float px = 1. / uPx;
    vec2 ws = floor(vW.xz * uPx) / uPx;
    float w = (vnoise(ws * 0.2 + 1.7) - 0.5) * 1.3 + (vnoise(ws * 0.75 + 5.3) - 0.5) * 0.3; // continuous round every wall
    float yy = y + w;
    yy += 0.22 * sin(yy * 2.3); // layers of uneven thickness
    float BH = 0.95, bi = floor(yy / BH), f = fract(yy / BH);
    float bh = hash(vec2(bi, 3.1));
    float bw = ${(e.block?.[0] ?? 0.9).toFixed(2)} + bh * ${(e.block?.[1] ?? 1.5).toFixed(2)};
    float uu = u + (vnoise(vec2(u * 1.1, y * 1.8)) - 0.5) * 0.45; // cracks that wander
    float bx = (uu + hash(vec2(bi, 9.2)) * 7.) / bw;
    float bt = hash(vec2(floor(bx), bi));
    float tf = (1. - f) * BH, bf = f * BH, cx = fract(bx) * bw, cr = (1. - fract(bx)) * bw;
    vec3 base = mix(RA, RB, clamp(bh * 0.45 + bt * 0.7 - 0.1, 0., 1.));${
      e.band
        ? `
    base = mix(base, ${Gu(e.band)} * (0.94 + bt * 0.1), step(0.8, bh)); // pale strata`
        : ``
    }
    // Cel shading inside each block: lit top, base, shaded underside, dithered between tones.
    float dth = bayer4(floor(vec2(u, y) * uPx)) * 0.12;
    float tone = f + (bt - 0.5) * 0.15;
    vec3 c = tone + dth > 0.78 ? mix(base, RL, 0.45) : tone + dth < 0.3 ? mix(base, RD, 0.5) : base;
    float g = hash(floor(vec2(u, y) * uPx));
    c *= 0.97 + 0.06 * step(0.86, g) - 0.08 * step(g, 0.06);
    // Bevels: bright left/top rim, dark right side and undercut, ink lines and chipped corners.
    c = mix(c, RL, max(step(tf, 2. * px), step(cx, 2. * px) * step(0.35, f) * 0.6));
    c = mix(c, RD, max(step(cr, 2. * px), step(bf, 2.5 * px)));
    float dx = min(cx, cr), dy = min(tf, bf), chip = 2.5 * px + bt * 2. * px;
    float ink = max(step(bf, 1. * px), step(cx, 1. * px)) + step(dx + dy, chip) * step(dx, chip) * step(dy, chip);
    c = mix(c, RK, clamp(ink, 0., 1.));
    // Moss pads on the ledges, dripping down a little; more of it where the wall is wet.
    float mz = vnoise(vec2(u * ${e.moss ? `1.6` : `0.7`}, bi * 3.1)) + wet * 0.35;
    float drip = (0.1 + 0.4 * hash(vec2(floor(u * uPx / 2.), bi))) * step(0.58, mz);
    float moss = step(${(e.moss ?? 0.64).toFixed(2)}, mz) * step(tf, 2.5 * px + drip);
    c = mix(c, mix(MB, MA, step(tf, 1.5 * px)), moss);
    return c;
  }`;
}
var qu = `
  vec3 toonGrass(vec2 pp, vec3 base){
    vec2 ws = pp / 13.5;
    base *= vec3(1.06, 1.1, 0.92); // a touch brighter and sunnier than the tile's average
    float pv = vnoise(ws * 0.08 + 3.1) * 0.7 + vnoise(ws * 0.23) * 0.3 + (bayer4(pp + 1.) - 0.5) * 0.1;
    float zone = pv > 0.6 ? 1. : pv < 0.38 ? -1. : 0.;
    vec3 lawn = base * (zone > 0.5 ? vec3(1.12, 1.1, 0.86) : zone < -0.5 ? vec3(0.86, 0.92, 1.0) : vec3(1.));
    vec3 dark = base * vec3(0.58, 0.72, 0.82), lit = base * vec3(1.26, 1.2, 0.8);
    // Grass marks: one 5x3 "v v" tuft per 7x6 cell, jittered; denser in the darker patches.
    vec2 cell = floor(pp / vec2(7., 6.)), h = vec2(hash(cell), hash(cell + 17.3));
    vec2 l = pp - cell * vec2(7., 6.) - floor(h * vec2(2.99, 3.99));
    float has = step(hash(cell + 5.1), 0.55 - zone * 0.15);
    float lx = l.x, ly = l.y;
    float inBox = step(0., lx) * step(lx, 4.) * step(0., ly) * step(ly, 2.);
    float mark = eq(ly, 2.) * (eq(lx, 0.) + eq(lx, 4.)) + eq(ly, 1.) * (eq(lx, 0.) + eq(lx, 2.) + eq(lx, 4.)) + eq(ly, 0.) * (eq(lx, 1.) + eq(lx, 3.));
    vec3 c = mix(lawn, zone > 0.5 && h.x > 0.5 ? lit : dark, clamp(mark * inBox * has, 0., 1.));
    // Flowers: a plus of four petals round a yellow eye, in a few colours.
    vec2 fc = floor(pp / 11.), fh = vec2(hash(fc + 41.), hash(fc + 63.));
    vec2 fl = pp - fc * 11. - 2. - floor(fh * 6.99);
    float isF = step(hash(fc + 9.7), 0.09 + 0.06 * step(0.5, zone));
    float eye = eq(fl.x, 0.) * eq(fl.y, 0.);
    float pet = (eq(abs(fl.x), 1.) * eq(fl.y, 0.) + eq(abs(fl.y), 1.) * eq(fl.x, 0.));
    float k = hash(fc + 2.2);
    vec3 pc = k < 0.4 ? vec3(1., 0.98, 0.92) : k < 0.65 ? vec3(1., 0.62, 0.72) : k < 0.85 ? vec3(0.55, 0.7, 1.) : vec3(1., 0.86, 0.3);
    c = mix(c, pc, pet * isF);
    c = mix(c, vec3(1., 0.8, 0.2), eye * isF);
    return c;
  }`,
  Ju = (e, t = `toonSand`) => `
  vec3 ${t}(vec2 pp, vec3 base){
    vec2 ws = pp / 13.5;
    base = mix(base, vec3(0.97, 0.83, 0.58), ${e.toFixed(2)}); // paler, peachier than the pack tile (Pokémon desert sand)
    float pv = vnoise(ws * 0.07 + 5.3) * 0.7 + vnoise(ws * 0.2) * 0.3 + (bayer4(pp + 1.) - 0.5) * 0.1;
    float zone = pv > 0.62 ? 1. : pv < 0.36 ? -1. : 0.;
    vec3 c = base * (zone > 0.5 ? vec3(1.06, 1.05, 1.0) : zone < -0.5 ? vec3(0.92, 0.88, 0.9) : vec3(1.));
    // Ripples: rows 8 px apart that wave sideways, in dashes of varying length.
    float yy = pp.y + floor(2.5 * sin(pp.x * 0.1 + vnoise(ws * 0.25) * 6.));
    float row = mod(yy, 8.), ri = floor(yy / 8.);
    float seg = step(0.42, vnoise(vec2(pp.x * 0.07 + ri * 13.1, ri * 3.7)));
    c = mix(c, base * vec3(0.8, 0.7, 0.74), eq(row, 0.) * seg);
    c = mix(c, base * vec3(1.1, 1.08, 1.02), eq(row, 7.) * seg);
    // Pebbles: single dark pixels with a lit one above, and the odd reddish stone.
    float pb = step(0.993, hash(pp));
    c = mix(c, base * vec3(0.72, 0.58, 0.55), pb);
    c = mix(c, base * vec3(1.12, 1.08, 1.02), step(0.993, hash(pp - vec2(0., 1.))) * (1. - pb));
    return c;
  }`,
  Yu = Ju(0.45),
  Xu = `
  vec3 toonSnow(vec2 pp, vec3 base){
    vec2 ws = pp / 13.5;
    // Snow is never paper white under the toon light: a cool mid tone, white only in the sunny patches.
    base = mix(base, vec3(0.84, 0.88, 0.97), 0.7);
    float pv = vnoise(ws * 0.07 + 2.3) * 0.7 + vnoise(ws * 0.21) * 0.3 + (bayer4(pp + 1.) - 0.5) * 0.1;
    float zone = pv > 0.6 ? 1. : pv < 0.36 ? -1. : 0.;
    vec3 c = base * (zone > 0.5 ? vec3(1.09, 1.08, 1.03) : zone < -0.5 ? vec3(0.88, 0.89, 0.99) : vec3(1.));
    float yy = pp.y + floor(3. * sin(pp.x * 0.07 + vnoise(ws * 0.2) * 5.));
    float row = mod(yy, 11.), ri = floor(yy / 11.);
    float seg = step(0.5, vnoise(vec2(pp.x * 0.06 + ri * 7.3, ri * 2.9)));
    c = mix(c, base * vec3(0.8, 0.82, 0.97), eq(row, 0.) * seg);
    c = mix(c, base * 1.12, eq(row, 10.) * seg);
    // Lumps: a 3x2 white bump with a lavender shadow under it.
    vec2 lc = floor(pp / 9.), lh = vec2(hash(lc + 3.3), hash(lc + 8.1));
    vec2 ll = pp - lc * 9. - floor(lh * 5.99);
    float has = step(hash(lc + 1.7), 0.18);
    float lump = step(0., ll.x) * step(ll.x, 2.) * step(0., ll.y) * step(ll.y, 1.);
    float under = step(0., ll.x) * step(ll.x, 2.) * eq(ll.y, -1.);
    c = mix(c, base * 1.12, lump * has);
    c = mix(c, base * vec3(0.76, 0.78, 0.95), under * has);
    // Glints: single pixels that twinkle.
    float g = hash(pp + 0.37);
    float tw = step(0.75, fract(g * 13.7 + uTimeG * (0.2 + g * 0.4)));
    c = mix(c, mix(vec3(0.75, 0.95, 1.), vec3(1.), step(0.5, g)), step(0.9965, g) * tw);
    return c;
  }`,
  Zu = `
  vec3 toonLight(vec3 n, vec2 pp){
    float ndl = dot(n, uSunDir);
    float d = (bayer4(pp) - 0.5) * 0.06;
    float band = step(0.02, ndl + d) * 0.72 + step(0.58, ndl + d) * 0.28;
    float sky = floor(n.y * 3. + bayer4(pp + 2.) * 0.9) / 3.;
    // The shade side keeps a third of the sunlight: hard bands, but never black.
    return mix(mix(uShadow, uSun, 0.3), uSun, band) + vec3(0.06, 0.08, 0.12) * sky;
  }`,
  Qu = 1.12,
  $u = 4.6,
  ed = { grove: 9, fairy: 6.5, arch: 6, hollow: 6, meadow: 9, boulders: 7.5, pond: 10 },
  td = 0.3,
  nd = 0.22,
  rd = -0.45,
  id = 1.2,
  ad = 0.35,
  od = 0.2,
  sd = (e, t) => {
    let n = Math.atan2(t, e),
      r = (Math.PI * 2) / 16;
    return Math.hypot(e, t) * Math.cos(((((n + r / 2) % r) + r) % r) - r / 2);
  },
  cd = class {
    biome;
    seed;
    shared;
    arena;
    world;
    res;
    cell;
    play;
    get areaMul() {
      return (this.world / 280) ** 2;
    }
    heights;
    pathMask;
    waterLevel = -99;
    hasWater;
    isLava;
    frozen;
    baseWater = -99;
    waterMeshes = [];
    colliders = [];
    solidBoxes = [];
    inSolid(e, t) {
      for (let n of this.solidBoxes) if (e > n.x0 && e < n.x1 && t > n.z0 && t < n.z1) return !0;
      return !1;
    }
    clearZones = [];
    reserve(e, t, n) {
      const zone = { x: e, z: t, r: n };
      this.clearZones.push(zone);
      return zone;
    }
    isReserved(e, t, n = 0) {
      for (let r of this.clearZones) if ((e - r.x) ** 2 + (t - r.z) ** 2 < (r.r + n) ** 2) return !0;
      return !1;
    }
    group = new Cr();
    colGrid = new Map();
    colliderNeighborhoods = new Map();
    deskColliderCells = new Map();
    spawn = new ti();
    noise;
    noise2;
    textures = [];
    mats = [];
    decoMat;
    grassMat;
    minH = 0;
    maxH = 1;
    arenaR;
    ringR = 1 / 0;
    constructor(e, t, n, r, paperAssets, deferred = false) {
      this.mapRules = mapRulesFor(e, r);
      this.facilitySites = this.mapRules.facilitySites;
      this.paperAssets=paperAssets;
      ((this.biome = e),
        (this.seed = t),
        (this.shared = n),
        (this.arena = r),
        (this.world = r?.world ?? e.size ?? 280),
        (this.arenaR = r ? r.radius - 1 : 1 / 0),
        (this.res = Math.round(this.world / Qu)),
        (this.cell = this.world / this.res),
        (this.play = this.world / 2 - 12),
        (this.heights = new Float32Array((this.res + 1) * (this.res + 1))),
        (this.pathMask = new Float32Array((this.res + 1) * (this.res + 1))),
        (this.noise = new iu(t)),
        (this.noise2 = new iu(t ^ 1540483477)),
        (this.hasWater = !r && e.water !== null),
        (this.isLava = !r && e.water === -1),
        (this.frozen = !r && e.id === `glacier`),
        !deferred && buildPaperWorld(this));
    }
    terrainMat;
    setSunDir(e) {
      this.terrainMat?.uniforms.uSunDir.value.set(e[0], e[1], e[2]).normalize();
    }
    env;
    envModels;
    async initEnv() {
      let e = this.arena?.pack ?? this.biome.id,
        t = au[e];
      await Promise.resolve();
      let n = t ? await uu(e) : null;
      if (this.disposed) return;
      if (!n || !t) {
        (this.scatterProps(), this.buildDecorations());
        return;
      }
      let r = this.terrainMat.uniforms;
      ((r.tGrass.value = n.ground),
        (r.tGrass2.value = n.ground),
        (r.tRock.value = n.cliff),
        (r.tPath.value = n.path),
        (r.uTexScale.value = 4),
        (r.uGrassScale.value = n.ground.image.width / Iu),
        this.textures.push(n.atlasTex, n.ground, n.cliff, n.path));
      let i = this.arena?.tower
          ? this.placeTowerEnv(t)
          : this.arena
            ? this.placeArenaEnv(t)
            : this.placeEnv(t),
        a = new Ei(1, 1, 1).lerp(new Ei(this.biome.sun), 0.25).multiplyScalar(0.95 + 0.1 * this.biome.light);
      ((this.env = new lu(n.atlasTex, n.atlas, i, this.shared, a)), this.group.add(this.env.mesh));
      let o = r.tShade.value;
      if (((r.tShade.value = this.shadeTex(i)), o.dispose(), i.some((e) => e.kind.model))) {
        let e = await Cu.create(i);
        if (this.disposed) {
          e.dispose();
          return;
        }
        ((this.envModels = e), this.group.add(e.group));
      }
    }
    placeEnv(e) {
      let t = new Ol(this.seed ^ 11259375),
        n = [],
        r = (e, r, i, a, o) => {
          for (let s = 0; s < r * 4 && r > 0; s++) {
            let s = t.range(-this.play + 2, this.play - 2),
              c = t.range(-this.play + 2, this.play - 2);
            if (Math.hypot(s, c) < i || !this.isFlatOpen(s, c) || !a(s, c) || this.isReserved(s, c, o))
              continue;
            let l = Math.round((s + this.world / 2) / this.cell),
              u = Math.round((c + this.world / 2) / this.cell);
            if (
              this.pathMask[this.idx(l, u)] > 0.3 ||
              (o > 1 &&
                (this.normal(s + 1.5, c).y < 0.9 ||
                  this.normal(s - 1.5, c).y < 0.9 ||
                  this.normal(s, c + 1.5).y < 0.9 ||
                  this.normal(s, c - 1.5).y < 0.9))
            )
              continue;
            let d = t.pick(e),
              f = t.range(0.85, 1.2),
              p = this.height(s, c) - 0.08;
            (n.push({ kind: d, x: s, y: p, z: c, flip: t.chance(0.5), s: f }),
              d.collider > 0 && this.addCollider({ x: s, z: c, r: d.collider * f, h: p + 6 }),
              r--);
          }
        };
      e.landmarks && this.placeLandmarks(e, n);
      let i = (e, t) => this.noise.get(e * 0.025, t * 0.025) > -0.1,
        a = this.areaMul;
      return (
        r(e.trees, Math.round(380 * this.biome.propDensity * a), 18, i, 2),
        r(e.big, Math.round(260 * a), 14, () => !0, 2),
        r(e.small, Math.round(2200 * a), 6, (e, t) => this.noise2.get(e * 0.05, t * 0.05) > -0.15, 0),
        n
      );
    }
    placeArenaEnv(e) {
      let t = this.arena,
        n = t.radius,
        r = new Ol(this.seed ^ 11259375),
        i = [],
        a = (e, t, n, a, o) => {
          let s = this.height(t, n) - 0.08;
          (i.push({ kind: e, x: t, y: s, z: n, flip: r.chance(0.5), s: a }),
            o && e.collider > 0 && this.addCollider({ x: t, z: n, r: e.collider * a, h: s + 8 }));
        };
      for (let [t, i] of [
        [n + 7, 34],
        [n + 15, 42],
        [n + 24, 50],
      ])
        for (let n = 0; n < i; n++) {
          let o = (n / i) * Math.PI * 2 + r.range(-0.04, 0.04) + t,
            s = t + r.range(-2, 2);
          a(r.pick(e.trees), Math.cos(o) * s, Math.sin(o) * s, r.range(0.95, 1.3), !1);
        }
      for (let n of t.bigTrees) a(e.trees[0], n.x, n.z, 1.15, !0);
      for (let n of t.lanterns) a(e.big[0], n.x, n.z, 1, !0);
      let o = (e, t, i) => {
        for (let o = 0, s = 0; o < t && s < t * 20; s++) {
          let t = r.range(0, Math.PI * 2),
            s = r.range(n - 8, n - 2.5),
            c = Math.cos(t) * s,
            l = Math.sin(t) * s;
          this.isFlatOpen(c, l) && !this.isReserved(c, l, 2.5) && (a(e, c, l, r.range(0.85, 1.15), i), o++);
        }
      };
      (o(e.big[1], 10, !0), o(e.big[2], 6, !0), o(e.big[3], 8, !0), o(e.big[4], 5, !0));
      for (let i = 0, o = t.undergrowth ?? 1300, s = 0; i < o && s < o * 4.6; s++) {
        let o = r.range(0, Math.PI * 2),
          s = Math.sqrt(r.next()) * (n - 1.5),
          c = Math.cos(o) * s,
          l = Math.sin(o) * s;
        s < t.dais + 1 ||
          (t.lake && s < t.lake + 0.6) ||
          !this.isFlatOpen(c, l) ||
          this.isReserved(c, l, 0.4) ||
          this.pathMask[
            this.idx(
              Math.round((c + this.world / 2) / this.cell),
              Math.round((l + this.world / 2) / this.cell),
            )
          ] > 0.3 ||
          (this.noise2.get(c * 0.06, l * 0.06) < -0.25 && r.chance(0.7)) ||
          (a(r.pick(e.small), c, l, r.range(0.8, 1.15), !1), i++);
      }
      return i;
    }
    placeTowerEnv(e) {
      let t = this.arena,
        n = t.radius,
        r = new Ol(this.seed ^ 11259375),
        i = [],
        a = (e, t, n, a, o) => {
          if (!e) return;
          let s = this.height(t, n) - 0.04;
          (i.push({ kind: e, x: t, y: s, z: n, flip: r.chance(0.5), s: a }),
            o && e.collider > 0 && this.addCollider({ x: t, z: n, r: e.collider * a, h: s + 3 }));
        };
      if (!t.tower.roof && e.big.length)
        for (let t = 0, i = 0; t < 14 && i < 300; i++) {
          let i = r.range(0, Math.PI * 2),
            o = r.range(n - 6, n - 3),
            s = Math.cos(i) * o,
            c = Math.sin(i) * o;
          this.isFlatOpen(s, c) &&
            !this.isReserved(s, c, 2) &&
            (a(r.pick(e.big), s, c, r.range(0.85, 1.1), !0), t++);
        }
      if (e.small.length)
        for (let i = 0, o = t.undergrowth ?? 260, s = 0; i < o && s < o * 5; s++) {
          let o = r.range(0, Math.PI * 2),
            s = Math.sqrt(r.next()) * (n - 2),
            c = Math.cos(o) * s,
            l = Math.sin(o) * s;
          s < t.dais + 0.8 ||
            !this.isFlatOpen(c, l) ||
            this.isReserved(c, l, 0.4) ||
            (s < n - 8 && r.chance(0.55)) ||
            (this.noise2.get(c * 0.07, l * 0.07) < -0.2 && r.chance(0.7)) ||
            (a(r.pick(e.small), c, l, r.range(0.8, 1.1), !1), i++);
        }
      return i;
    }
    idx(e, t) {
      return t * (this.res + 1) + e;
    }
    generateTower() {
      let e = this.arena,
        t = e.tower,
        n = e.radius - 0.4,
        r = this.noise2,
        i = this.world / 2;
      for (let a = 0; a <= this.res; a++)
        for (let o = 0; o <= this.res; o++) {
          let s = o * this.cell - i,
            c = a * this.cell - i,
            l = Math.hypot(s, c),
            u = sd(s, c),
            d = r.get(s * 0.2, c * 0.2) * 0.04;
          for (let t of e.plateaus) {
            let e = s - t.x,
              n = c - t.z,
              r = Math.hypot(e, n),
              i = t.h ?? $u,
              a = i * qs(t.r + 0.25, t.r - 0.25, r);
            if (!Number.isNaN(t.ramp)) {
              let r = Math.cos(t.ramp),
                o = Math.sin(t.ramp),
                s = e * r + n * o,
                c = Math.abs(-e * o + n * r);
              s > 0 && (a = Math.max(a, i * Gs(1 - (s - (t.r - 1)) / (i * 2.4), 0, 1) * qs(2.3, 1.9, c)));
            }
            d = Math.max(d, a);
          }
          d += qs(e.dais + 0.3, e.dais - 0.3, l) * 0.22;
          let f = t.stairs;
          f &&
            Math.abs(s - f.x) <= f.w / 2 + 0.3 &&
            c <= f.z &&
            (d = Math.max(d, f.rise * Math.min(1, (f.z - c) / f.len)));
          let p = qs(e.dais + 0.5, e.dais - 0.2, l);
          for (let t of e.flags) p = Math.max(p, qs(t.r + 0.3, t.r - 0.3, Math.hypot(s - t.x, c - t.z)));
          ((this.pathMask[this.idx(o, a)] = p),
            t.roof
              ? (d = u < n + 0.6 ? d + qs(n - 0.2, n + 0.4, u) * t.wall : -38)
              : (d += qs(n - 0.15, n + 0.45, u) * t.wall),
            (this.heights[this.idx(o, a)] = d));
        }
      let a = 1e9,
        o = -1e9;
      for (let e of this.heights) (e < a && (a = e), e > o && (o = e));
      ((this.minH = a),
        (this.maxH = o),
        this.spawn.set(e.entry.x, this.height(e.entry.x, e.entry.z), e.entry.z));
    }
    generateArena() {
      if (this.arena.tower) {
        this.generateTower();
        return;
      }
      let e = this.arena,
        t = e.radius,
        n = this.noise,
        r = this.noise2,
        i = this.world / 2;
      for (let a = 0; a <= this.res; a++)
        for (let o = 0; o <= this.res; o++) {
          let s = o * this.cell - i,
            c = a * this.cell - i,
            l = Math.hypot(s, c),
            u = n.fbm(s * 0.035, c * 0.035, 2) * 0.3 + r.get(s * 0.09, c * 0.09) * 0.1;
          for (let t of e.plateaus) {
            let e = s - t.x,
              n = c - t.z,
              i = Math.hypot(e, n),
              a = t.r + r.get(s * 0.12 + t.x, c * 0.12) * 0.9,
              o = t.h ?? $u,
              l = o * qs(a + 0.5, a - 0.5, i);
            if (!Number.isNaN(t.ramp)) {
              let r = Math.cos(t.ramp),
                i = Math.sin(t.ramp),
                a = e * r + n * i,
                s = Math.abs(-e * i + n * r);
              a > 0 && (l = Math.max(l, o * Gs(1 - (a - (t.r - 1.5)) / 11, 0, 1) * qs(3.4, 2.4, s)));
            }
            u = Math.max(u, l);
          }
          u += qs(e.dais + 0.6, e.dais - 0.4, l) * 0.32;
          let d = qs(e.dais + 0.9, e.dais - 0.1, l);
          for (let t of e.flags)
            d = Math.max(
              d,
              qs(t.r + 0.6, t.r - 0.6, Math.hypot(s - t.x, c - t.z) + r.get(s * 0.3, c * 0.3) * 0.8),
            );
          this.pathMask[this.idx(o, a)] = d;
          let f = n.get(s * 0.06, c * 0.06) * 1.5;
          ((u += qs(t - 1 + f, t + 4.5 + f, l) * (16 + n.get(s * 0.04, c * 0.04) * 5)),
            (u += qs(t + 10, t + 30, l) * 6),
            (this.heights[this.idx(o, a)] = u));
        }
      {
        let e = this.heights.slice();
        for (let t = 1; t < this.res; t++)
          for (let n = 1; n < this.res; n++) {
            let r = 0;
            for (let i = -1; i <= 1; i++)
              for (let a = -1; a <= 1; a++)
                r += e[this.idx(n + a, t + i)] * (a === 0 && i === 0 ? 4 : a === 0 || i === 0 ? 2 : 1);
            this.heights[this.idx(n, t)] = r / 16;
          }
      }
      let a = 1e9,
        o = -1e9;
      for (let e of this.heights) (e < a && (a = e), e > o && (o = e));
      ((this.minH = a),
        (this.maxH = o),
        this.spawn.set(e.entry.x, this.height(e.entry.x, e.entry.z), e.entry.z));
    }
    generate() {
      if (this.arena) {
        this.generateArena();
        return;
      }
      let e = new Ol(this.seed),
        t = this.noise,
        n = this.noise2,
        r = [],
        i = 4 + e.int(0, 2);
      for (let t = 0; t < i; t++) {
        let n = [[0, 0]],
          a = (t / i) * Math.PI * 2 + e.range(-0.4, 0.4),
          o = 0,
          s = 0;
        for (let t = 0, r = Math.round(this.play / 13); t < r; t++)
          ((a += e.range(-0.55, 0.55)), (o += Math.cos(a) * 15), (s += Math.sin(a) * 15), n.push([o, s]));
        r.push(n);
      }
      let a = (e, t) => {
          let n = 1e9;
          for (let i of r)
            for (let r = 0; r < i.length - 1; r++) {
              let [a, o] = i[r],
                [s, c] = i[r + 1],
                l = s - a,
                u = c - o,
                d = Gs(((e - a) * l + (t - o) * u) / (l * l + u * u), 0, 1),
                f = a + l * d - e,
                p = o + u * d - t,
                m = f * f + p * p;
              m < n && (n = m);
            }
          return Math.sqrt(n);
        },
        o = this.biome.relief?.levels ?? 4,
        s = [];
      for (let t = 0, n = 0; t < (this.biome.relief?.massifs ?? 0) && n < 60; n++) {
        let n = e.range(0, Math.PI * 2),
          i = e.range(0.4, 0.68) * this.play,
          a = e.range(44, 50),
          o = Math.cos(n) * i,
          c = Math.sin(n) * i;
        if (Math.hypot(o, c) < a + 22 || s.some((e) => Math.hypot(e.x - o, e.z - c) < e.r + a + 30)) continue;
        s.push({ x: o, z: c, r: a });
        let l = [],
          u = e.range(0, Math.PI * 2),
          d = e.chance(0.5) ? 1 : -1;
        for (let e = 0; e <= 22; e++) {
          let t = e / 22,
            n = u + d * t * Math.PI * 2.3,
            r = a * (1.12 - t * 0.95);
          l.push([o + Math.cos(n) * r, c + Math.sin(n) * r]);
        }
        (r.push(l), t++);
      }
      this.massifs = s;
      let c = this.world / 2,
        l = this.biome.id === `coast` && !this.arena,
        u = this.biome.id === `glacier` && !this.arena,
        d = this.hasWater && !this.biome.relief ? (l ? 0.15 : 0.17) : -1,
        f = (e, r) => {
          let i = t.fbm(e * 0.011, r * 0.011, 4) * 0.5 + 0.5;
          ((i += n.fbm(e * 0.03, r * 0.03, 2) * 0.04), l && (i -= ad), u && (i -= od), (i = Gs(i, 0, 1)));
          for (let t of s) {
            let a = Math.hypot(e - t.x, r - t.z) + n.get(e * 0.05, r * 0.05) * 6,
              s = Gs((t.r - a) / (t.r * 0.85), 0, 1);
            i += s * ((o + 1.35) / o - i);
          }
          let c = qs(0.25, 0.55, n.get(e * 0.014 + 40, r * 0.014 - 17)),
            f = i * o,
            p = Math.floor(f),
            m = f - p,
            h = 0.035 + c * 0.4,
            g = (p + qs(0.5 - h, 0.5 + h, m)) * $u;
          (l && i >= d && i < nd && (g = Math.min(g, 0)), i < d && (g -= (d - i) * 18));
          let _ = qs(8, 3, a(e, r)) * (0.55 + 0.45 * qs(-0.2, 0.3, n.get(e * 0.02, r * 0.02))),
            v = i * o * $u;
          return g * (1 - _ * 0.92) + v * _ * 0.92;
        },
        p = this.hasWater && this.biome.relief ? this.planPonds(e, f) : [];
      for (let e = 0; e <= this.res; e++)
        for (let r = 0; r <= this.res; r++) {
          let i = r * this.cell - c,
            a = e * this.cell - c;
          this.pathMask[this.idx(r, e)] = 0;
          let o = f(i, a);
          for (let e of p) {
            let t = i - e.x,
              r = a - e.z,
              s = Math.hypot(t, r);
            if (s > e.r + 7) continue;
            let c =
                e.r *
                (0.82 +
                  0.3 *
                    n.get(
                      Math.cos(Math.atan2(r, t)) * 1.2 + e.seed,
                      Math.sin(Math.atan2(r, t)) * 1.2 - e.seed,
                    )),
              l = qs(e.r + 7, e.r + 3, s);
            ((o = o * (1 - l) + e.h * l),
              s < c && (o = Math.min(o, e.level - 0.06 - 0.39 * qs(c, c - 3.2, s))));
          }
          let s = qs(18, 9, Math.hypot(i, a));
          ((o = o * (1 - s) + $u * 1 * s), (o += n.get(i * 0.07, a * 0.07) * 0.12));
          let l = Math.max(Math.abs(i), Math.abs(a));
          ((o += qs(this.play - 4, this.play + 10, l) * (18 + t.get(i * 0.05, a * 0.05) * 8)),
            (this.heights[this.idx(r, e)] = o));
        }
      {
        let e = this.heights.slice();
        for (let t = 1; t < this.res; t++)
          for (let n = 1; n < this.res; n++) {
            let r = 0;
            for (let i = -1; i <= 1; i++)
              for (let a = -1; a <= 1; a++)
                r += e[this.idx(n + a, t + i)] * (a === 0 && i === 0 ? 4 : a === 0 || i === 0 ? 2 : 1);
            this.heights[this.idx(n, t)] = r / 16;
          }
      }
      (this.biome.relief && this.connectPlateaus(),
        this.hasWater && !this.biome.relief && (this.waterLevel = l ? rd : d * o * $u - 0.9),
        (this.baseWater = this.waterLevel));
      let m = 1e9,
        h = -1e9;
      for (let e of this.heights) (e < m && (m = e), e > h && (h = e));
      const {x, z} = this.mapRules.spawn;
      ((this.minH = m), (this.maxH = h), this.spawn.set(x, this.height(x, z), z));
    }
    massifs = [];
    landmarks = [];
    planLandmarks() {
      if (this.arena || !au[this.biome.id]?.landmarks) return;
      let e = new Ol(this.seed ^ 1715004),
        t = (e, t, n) => {
          let r = ed[e];
          (this.landmarks.push({ kind: e, x: t, z: n, r }), this.reserve(t, n, r));
        },
        n = (e, t, n) => {
          let r = this.height(e, t);
          for (let i = 0; i < 10; i++) {
            let a = (i / 10) * Math.PI * 2,
              o = e + Math.cos(a) * n * 0.7,
              s = t + Math.sin(a) * n * 0.7;
            if (!this.isFlatOpen(o, s) || Math.abs(this.height(o, s) - r) > 0.7) return !1;
          }
          return this.isFlatOpen(e, t);
        };
      for (let e of this.landmarks) this.reserve(e.x, e.z, e.r);
      let r = [`grove`, `fairy`];
      this.massifs.slice(0, 2).forEach((e, n) => t(r[n], e.x, e.z));
      let i = [`arch`, `hollow`, `meadow`, `boulders`, `fairy`].filter(
        (e) => !this.landmarks.some((t) => t.kind === e),
      );
      for (let t = i.length - 1; t > 0; t--) {
        let n = e.int(0, t);
        [i[t], i[n]] = [i[n], i[t]];
      }
      for (let r of i.slice(0, 4)) {
        let i = ed[r],
          a = null,
          o = -1;
        for (let t = 0; t < 40; t++) {
          let t = this.randomPoint(e, 0, 0, 35, this.play - 14);
          if (!n(t.x, t.z, i) || this.isReserved(t.x, t.z, i)) continue;
          let r = 1e9;
          for (let e of this.landmarks) r = Math.min(r, Math.hypot(e.x - t.x, e.z - t.z) - e.r);
          for (let e of this.massifs) r = Math.min(r, Math.hypot(e.x - t.x, e.z - t.z) - e.r);
          r > o && ((o = r), (a = t));
        }
        a && t(r, a.x, a.z);
      }
    }
    placeLandmarks(e, t) {
      let n = new Ol(this.seed ^ 30673),
        r = [...e.trees, ...e.big, ...e.small, ...(e.landmarks ?? [])],
        i = (e) => r.find((t) => t.name === e),
        a = (e, r, i, a, o = !0) => {
          if (!this.isFlatOpen(r, i)) return;
          let s = this.height(r, i) - 0.08;
          (t.push({ kind: e, x: r, y: s, z: i, flip: n.chance(0.5), s: a }),
            o && e.collider > 0 && this.addCollider({ x: r, z: i, r: e.collider * a, h: s + 8 }));
        },
        o = (e, t, r, o, s, c, l = 0.85, u = 1.15) => {
          for (let d = 0; d < t; d++) {
            let t = n.range(0, Math.PI * 2),
              d = r + Math.sqrt(n.next()) * (o - r);
            a(i(n.pick(e)), s + Math.cos(t) * d, c + Math.sin(t) * d, n.range(l, u));
          }
        },
        s = [`flowersA`, `flowersB`, `sunflower`, `tallgrass`, `fern`];
      for (let t of this.landmarks) {
        let { x: r, z: c } = t;
        switch (t.kind) {
          case `grove`: {
            a(i(`oak`), r, c, 1);
            let t = n.range(0, 6.28);
            for (let i = 0; i < 7; i++) {
              let o = t + (i / 7) * Math.PI * 2 + n.range(-0.2, 0.2),
                s = n.range(6.5, 8.5);
              a(
                n.pick(e.trees.filter((e) => e.name !== `tree2`)),
                r + Math.cos(o) * s,
                c + Math.sin(o) * s,
                n.range(0.95, 1.15),
              );
            }
            o([`fern`, `flowersA`, `flowersB`, `mushrooms`], 26, 2.8, 8, r, c);
            break;
          }
          case `fairy`:
            a(i(`glowshrooms`), r, c, 1);
            for (let e = 0; e < 12; e++) {
              let t = (e / 12) * Math.PI * 2;
              a(i(`mushrooms`), r + Math.cos(t) * 4.3, c + Math.sin(t) * 4.3, n.range(0.85, 1.05));
            }
            (o([`flowersA`, `flowersB`, `fern`], 10, 1.8, 3.4, r, c),
              o([`fern`, `tallgrass`], 10, 5, 6.5, r, c));
            break;
          case `arch`:
            (a(i(`arch`), r, c, 1),
              o([`boulder`], 2, 3.5, 5, r, c, 0.9, 1.3),
              o([`fern`, `tallgrass`, `rocks`, `flowersA`], 18, 2, 6, r, c));
            break;
          case `hollow`:
            (a(i(`hollowlog`), r, c, 1),
              o([`stump`], 2, 3.5, 5, r, c),
              o([`mushrooms`, `fern`, `tallgrass`], 18, 2.5, 6, r, c));
            break;
          case `meadow`:
            o(s, 75, 0, 9, r, c, 0.9, 1.2);
            break;
          case `boulders`:
            (o([`boulder`], 7, 1, 6, r, c, 1.3, 2.2), o([`rocks`, `fern`, `tallgrass`], 16, 1, 7, r, c));
            break;
          case `pond`:
            (o(
              [`tallgrass`, `tallgrass`, `fern`, `flowersA`, `flowersB`],
              34,
              t.r * 0.85,
              t.r + 3,
              r,
              c,
              0.85,
              1.15,
            ),
              o([`boulder`], n.int(1, 2), t.r * 0.9, t.r + 2, r, c, 0.8, 1.2));
        }
      }
      this.buildPads();
    }
    buildPads() {
      let e = new Ol(this.seed ^ 39578),
        t = [];
      for (let n of this.landmarks)
        if (n.kind === `pond`)
          for (let r = 0, i = 0; r < 40 && i < 6; r++) {
            let r = e.range(0, Math.PI * 2),
              a = Math.sqrt(e.next()) * n.r * 0.75,
              o = n.x + Math.cos(r) * a,
              s = n.z + Math.sin(r) * a,
              c = this.waterAt(o, s);
            this.height(o, s) > c - 0.2 ||
              t.some((e) => Math.hypot(e.x - o, e.z - s) < 1.5) ||
              (t.push({ x: o, z: s, r: e.range(0, 6.28), s: e.range(0.5, 0.85), y: c }), i++);
          }
      if (!t.length) return;
      let n = new vr(new Uint8Array([90, 160, 255, 255]), 4, 1, ri);
      ((n.minFilter = n.magFilter = zr), (n.needsUpdate = !0), this.textures.push(n));
      let r = new Nr(1, 14, 0.35, Math.PI * 2 - 0.7).rotateX(-Math.PI / 2),
        i = new wr({ color: 4173388, gradientMap: n }),
        a = new Pr(0.18, 0.22, 6).translate(0, 0.11, 0),
        o = new wr({ color: 16747200, gradientMap: n, emissive: 4198432 });
      this.mats.push(i, o);
      let s = new Sr(r, i, t.length),
        c = t.filter((e, t) => t % 3 == 0),
        l = new Sr(a, o, Math.max(1, c.length)),
        u = new xr(),
        d = new di(),
        f = new ti(0, 1, 0),
        p = new ti(),
        m = new ti();
      (t.forEach((e, t) =>
        s.setMatrixAt(
          t,
          u.compose(p.set(e.x, e.y + 0.02, e.z), d.setFromAxisAngle(f, e.r), m.setScalar(e.s)),
        ),
      ),
        c.forEach((e, t) =>
          l.setMatrixAt(t, u.makeTranslation(e.x + 0.15 * e.s, e.y + 0.08, e.z - 0.1 * e.s)),
        ),
        (l.count = c.length),
        (s.renderOrder = l.renderOrder = 4),
        this.group.add(s, l));
    }
    connectPlateaus() {
      let e = this.res + 1,
        t = this.heights,
        n = this.cell,
        r = this.world / 2,
        i = Math.floor((this.play - 3 + r) / n),
        a = e - 1 - i,
        o = (e, t) => e >= a && e <= i && t >= a && t <= i,
        s = (e, n) => Math.abs(t[e] - t[n]) <= 0.9,
        c = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ],
        l = new Uint8Array(e * e);
      for (let u = 0; u < 40; u++) {
        let u = new Uint8Array(e * e),
          d = this.idx(Math.round(r / n), Math.round(r / n)),
          f = [d];
        u[d] = 1;
        for (let t = 0; t < f.length; t++) {
          let n = f[t],
            r = n % e,
            i = (n - r) / e;
          for (let [t, a] of c) {
            let c = r + t,
              l = i + a;
            if (!o(c, l)) continue;
            let d = l * e + c;
            !u[d] && s(n, d) && ((u[d] = 1), f.push(d));
          }
        }
        let p = new Uint8Array(e * e),
          m = null;
        for (let t = a; t <= i; t++)
          for (let n = a; n <= i; n++) {
            let r = t * e + n;
            if (u[r] || p[r] || l[r]) continue;
            let i = [r];
            p[r] = 1;
            for (let t = 0; t < i.length; t++) {
              let n = i[t],
                r = n % e,
                a = (n - r) / e;
              for (let [t, l] of c) {
                let c = r + t,
                  d = a + l;
                if (!o(c, d)) continue;
                let f = d * e + c;
                p[f] || u[f] || !s(n, f) || ((p[f] = 1), i.push(f));
              }
            }
            i.length >= 70 && (!m || i.length > m.length) && (m = i);
          }
        if (!m) break;
        let h = -1,
          g = -1,
          _ = 1e9,
          v = Math.ceil(34 / n);
        for (let r = 0; r < m.length; r += 3) {
          let i = m[r],
            a = i % e,
            s = (i - a) / e;
          for (let r = -v; r <= v; r += 2)
            for (let c = -v; c <= v; c += 2) {
              let l = a + c,
                d = s + r;
              if (!o(l, d)) continue;
              let f = d * e + l;
              if (!u[f]) continue;
              let p = Math.hypot(c, r) * n,
                m = Math.abs(t[i] - t[f]) / 0.42;
              if (p < m || p < 6) continue;
              let v = p + (p - m) * 0.5;
              v < _ && ((_ = v), (h = i), (g = f));
            }
        }
        if (h < 0) for (let e of m) l[e] = 1;
        else this.carveRamp(h % e, (h - (h % e)) / e, g % e, (g - (g % e)) / e);
      }
    }
    ponds = [];
    waterAt(e, t) {
      if (!this.hasWater) return -99;
      if (!this.biome.relief) return this.waterLevel;
      for (let n of this.ponds) if ((e - n.x) ** 2 + (t - n.z) ** 2 < (n.r * 1.3) ** 2) return n.level;
      return -99;
    }
    planPonds(e, t) {
      let n = Math.round(6 * Math.sqrt(this.areaMul)) + e.int(0, 1);
      for (let r = 0; r < 600 && this.ponds.length < n; r++) {
        let n = e.range(6, 11),
          r = e.range(-this.play + n + 12, this.play - n - 12),
          i = e.range(-this.play + n + 12, this.play - n - 12);
        if (
          Math.hypot(r, i) < 26 + n ||
          this.massifs.some((e) => Math.hypot(e.x - r, e.z - i) < e.r + n + 8) ||
          this.ponds.some((e) => Math.hypot(e.x - r, e.z - i) < e.r + n + 30)
        )
          continue;
        let a = t(r, i),
          o = Math.round(a / $u) * $u;
        if (o < $u * 0.5 || Math.abs(a - o) > 0.4) continue;
        let s = 0;
        for (let e = 0; e < 12; e++) {
          let a = (e / 12) * Math.PI * 2;
          Math.abs(t(r + Math.cos(a) * (n + 3), i + Math.sin(a) * (n + 3)) - o) > 1 && s++;
        }
        s > 2 || this.ponds.push({ x: r, z: i, r: n, h: o, level: o - td, seed: e.range(0, 100) });
      }
      for (let e of this.ponds) this.landmarks.push({ kind: `pond`, x: e.x, z: e.z, r: e.r * 1.15 });
      return this.ponds;
    }
    carveRamp(e, t, n, r) {
      let i = this.res + 1,
        a = this.heights,
        o = a[t * i + e],
        s = a[r * i + n],
        c = n - e,
        l = r - t,
        u = c * c + l * l,
        d = 2.25 / this.cell,
        f = 1.6 / this.cell,
        p = Math.max(0, Math.min(e, n) - 6),
        m = Math.min(i - 1, Math.max(e, n) + 6),
        h = Math.max(0, Math.min(t, r) - 6),
        g = Math.min(i - 1, Math.max(t, r) + 6);
      for (let n = h; n <= g; n++)
        for (let r = p; r <= m; r++) {
          let p = Gs(((r - e) * c + (n - t) * l) / u, -0.06, 1.06),
            m = e + c * p - r,
            h = t + l * p - n,
            g = Math.hypot(m, h);
          if (g > d + f) continue;
          let _ = g <= d ? 1 : 1 - (g - d) / f,
            v = Gs(p, 0, 1),
            y = o + (s - o) * v,
            b = n * i + r;
          a[b] = a[b] * (1 - _) + y * _;
        }
    }
    height(e, t) {
      if(this.zxPaper)return this.workshopGroundY?.(e,t)??0;
      let n = this.world / 2,
        r = Gs((e + n) / this.cell, 0, this.res - 0.001),
        i = Gs((t + n) / this.cell, 0, this.res - 0.001),
        a = Math.floor(r),
        o = Math.floor(i),
        s = r - a,
        c = i - o,
        l = this.heights,
        u = l[this.idx(a, o)],
        d = l[this.idx(a + 1, o)],
        f = l[this.idx(a, o + 1)],
        p = l[this.idx(a + 1, o + 1)];
      return (u * (1 - s) + d * s) * (1 - c) + (f * (1 - s) + p * s) * c;
    }
    setWaterLevel(e) {
      if (this.hasWater && !this.biome.relief) {
        this.waterLevel = e;
        for (let t of this.waterMeshes) ((t.position.y = e), (t.material.uniforms.uLevel.value = e));
        this.terrainMat && (this.terrainMat.uniforms.uWater.value = e);
      }
    }
    surface(e, t) {
      if(this.zxPaper&&!this.hasWater)return this.height(e,t);
      let n = this.height(e, t),
        r = this.waterAt(e, t);
      return n < r ? r : n;
    }
    inWater(e, t) {
      return this.height(e, t) < this.waterAt(e, t) - 0.3;
    }
    normal(e, t, n = new ti()) {
      let r = 0.5;
      return n
        .set(
          this.height(e - r, t) - this.height(e + r, t),
          2 * r,
          this.height(e, t - r) - this.height(e, t + r),
        )
        .normalize();
    }
    get walkLim() {
      return this.play - 2;
    }
    inBounds(e, t, n = 0) {
      if (this.arena?.tower) return Math.hypot(e, t) < this.arenaR - n * 0.5 && !this.inSolid(e, t);
      let r = this.play - n;
      return e > -r && e < r && t > -r && t < r;
    }
    isFlatOpen(e, t) {
      return this.normal(e, t).y > 0.94 && !(this.height(e, t) < this.waterAt(e, t) + 0.25);
    }
    shadeTex(e) {
      let t = Math.round(this.world * 2),
        n = new Uint8Array(t * t);
      for (let r of e ?? []) {
        let e = r.kind.shadow * r.s * 0.5;
        if (e <= 0) continue;
        let i = (r.x + this.world / 2 - 0.25 * e) * 2,
          a = (r.z + this.world / 2 - 0.2 * e) * 2,
          o = e * 2,
          s = e * 1.5;
        for (let e = Math.max(0, Math.floor(a - s)); e <= Math.min(t - 1, Math.ceil(a + s)); e++)
          for (let r = Math.max(0, Math.floor(i - o)); r <= Math.min(t - 1, Math.ceil(i + o)); r++) {
            let c = Math.hypot((r - i) / o, (e - a) / s),
              l = Math.round(Gs((1.15 - c) / 0.4, 0, 1) * 255);
            l > n[e * t + r] && (n[e * t + r] = l);
          }
      }
      let r = new vr(n, t, t, ri);
      return ((r.magFilter = r.minFilter = Fr), (r.needsUpdate = !0), this.textures.push(r), r);
    }
    cliffAttribs(e) {
      let t = this.res + 1,
        n = Math.max(1, Math.round(2.5 / this.cell)),
        r = this.heights,
        i = (e, r) => {
          let i = new Float32Array(e.length),
            a = new Float32Array(e.length);
          for (let a = 0; a < t; a++)
            for (let o = 0; o < t; o++) {
              let s = e[a * t + o];
              for (let i = Math.max(0, o - n); i <= Math.min(t - 1, o + n); i++) s = r(s, e[a * t + i]);
              i[a * t + o] = s;
            }
          for (let e = 0; e < t; e++)
            for (let o = 0; o < t; o++) {
              let s = i[e * t + o];
              for (let a = Math.max(0, e - n); a <= Math.min(t - 1, e + n); a++) s = r(s, i[a * t + o]);
              a[e * t + o] = s;
            }
          return a;
        },
        a = i(r, Math.max),
        o = i(r, Math.min),
        s = new Float32Array(e.count * 2);
      for (let t = 0; t < e.count; t++) {
        let n = Math.round((e.getX(t) + this.world / 2) / this.cell),
          r = Math.round((e.getZ(t) + this.world / 2) / this.cell);
        ((s[t * 2] = a[this.idx(n, r)]), (s[t * 2 + 1] = o[this.idx(n, r)]));
      }
      return s;
    }
    buildMesh() {
      let e = this.biome.tex,
        t = Au(this.seed, e.top[0], e.top[1], e.top[2], e.detail, 64),
        n = Au(
          this.seed + 11,
          new Ei(e.top[0]).offsetHSL(0.02, 0.05, 0.03).getHex(),
          e.top[1],
          e.top[2],
          e.detail,
          64,
        ),
        r = Au(
          this.seed + 1,
          e.path[0],
          new Ei(e.path[0]).offsetHSL(0, 0, 0.06).getHex(),
          new Ei(e.path[0]).offsetHSL(0, 0, -0.08).getHex(),
          `sand`,
          64,
        ),
        i = ju(this.seed + 2, e.side[0], e.side[1], e.side[2], null, 64),
        a = Au(
          this.seed + 3,
          this.isLava ? 3811880 : 15258784,
          this.isLava ? 5913136 : 16180920,
          this.isLava ? 2759192 : 13284480,
          this.isLava ? `ash` : `sand`,
          64,
        );
      this.textures.push(t, n, r, i, a);
      let o = new Yr(this.world, this.world, this.res, this.res).rotateX(-Math.PI / 2),
        s = o.attributes.position,
        c = new Float32Array(s.count),
        l = new Float32Array(s.count);
      for (let e = 0; e < s.count; e++) {
        let t = s.getX(e),
          n = s.getZ(e),
          r = Math.round((t + this.world / 2) / this.cell),
          i = Math.round((n + this.world / 2) / this.cell);
        (s.setY(e, this.heights[this.idx(r, i)]),
          (c[e] = this.pathMask[this.idx(r, i)]),
          (l[e] = this.noise.get(t * 0.04, n * 0.04) * 0.5 + 0.5));
      }
      (o.setAttribute(`aPath`, new Ti(c, 1)),
        o.setAttribute(`aVar`, new Ti(l, 1)),
        o.setAttribute(`aCliff`, new Ti(this.cliffAttribs(s), 2)),
        o.computeVertexNormals());
      let u = this.biome,
        d = Wu[this.arena?.pack ?? u.id],
        f = _d(d),
        p = d ? { TOON_GROUND: 1 } : {};
      (this.frozen && (p.NO_SHORE = 1), d?.shore && (p.TOON_SHORE = 1));
      let m = new Kr({
        defines: p,
        uniforms: {
          tGrass: { value: t },
          tGrass2: { value: n },
          tPath: { value: r },
          tRock: { value: i },
          tSand: { value: a },
          tShade: { value: this.shadeTex(null) },
          uWorld: { value: this.world },
          uSunDir: { value: new ti(0.45, 0.8, 0.35).normalize() },
          uSun: { value: new Ei(u.sun).multiplyScalar(1.05 * u.light) },
          uShadow: {
            value: new Ei(
              u.id === `volcano` ? 8011872 : u.id === `graveyard` ? 5917322 : 8030408,
            ).multiplyScalar(0.72 * u.light + 0.08),
          },
          uWater: { value: this.hasWater ? this.waterLevel : -999 },
          uLava: { value: +!!this.isLava },
          uTexScale: { value: 3 },
          uGrassScale: { value: 64 / Iu },
          uPx: { value: Iu },
          uFogColor: this.shared.uFogColor,
          uFogNear: this.shared.uFogNear,
          uFogFar: this.shared.uFogFar,
          uTimeG: this.shared.uTime,
          uShoreH: { value: this.biome.id === `coast` && !this.arena ? id : 0.6 },
          uShoreCol: { value: new Ei().setRGB(...(d?.shore ?? [0.9, 0.85, 0.7])) },
        },
        vertexShader: `
        attribute float aPath; attribute float aVar; attribute vec2 aCliff;
        varying vec3 vW; varying vec3 vN; varying float vPath; varying float vVar; varying float vD; varying vec2 vCliff;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
          vPath = aPath; vVar = aVar; vCliff = aCliff; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `
        uniform sampler2D tGrass, tGrass2, tPath, tRock, tSand, tShade; uniform vec3 uSunDir, uSun, uShadow, uFogColor;
        uniform float uFogNear, uFogFar, uWater, uLava, uTexScale, uGrassScale, uPx, uWorld, uTimeG, uShoreH; uniform vec3 uShoreCol;
        varying vec3 vW; varying vec3 vN; varying float vPath; varying float vVar; varying float vD; varying vec2 vCliff;
        ${Lu}
        ${Ru}
        ${Zu}
        ${d ? Ku(d) + f.glsl : ``}
        ${d?.shore ? Ju(0.1, `toonShore`) : ``}
        void main(){
          vec3 n = normalize(vN);
          float slope = 1. - n.y;
          vec2 pp = floor(vW.xz * uPx), ws = pp / uPx;
          vec2 uv = vW.xz / uTexScale;
#ifdef TOON_GROUND
          // Ground: a flat Pokémon lawn (or sand with ripples) in the pack's average colour.
          vec3 g = ${f.name}(pp, texture2D(tGrass, vec2(0.5), 12.).rgb);
#else
          // Grass: the tile at sprite density, with no cross-fades (they ghost the blades): a dithered pick
          // between two offsets and big lawn patches in three flat tones.
          vec2 guv = vW.xz / uGrassScale;
          float pick = step(0.5, vnoise(ws * 0.05 + 7.) + (bayer4(pp) - 0.5) * 0.25);
          vec3 g = pick > 0.5 ? texture2D(tGrass2, guv * 0.97 + 0.31).rgb : texture2D(tGrass, guv).rgb;
          float pv = vnoise(ws * 0.08 + 3.1) * 0.7 + vnoise(ws * 0.23) * 0.3 + (bayer4(pp + 1.) - 0.5) * 0.1;
          g *= pv > 0.62 ? vec3(1.07, 1.08, 0.95) : pv < 0.36 ? vec3(0.9, 0.93, 1.0) : vec3(1.);
#endif
          vec3 p = texture2D(tPath, uv).rgb;
          vec3 s = texture2D(tSand, uv).rgb;
          vec3 col = g;
          col = mix(col, p, step(0.56 + (bayer4(pp) - 0.5) * 0.1, vPath));
#ifdef TOON_SHORE
          s = toonShore(pp, uShoreCol);
#endif
#ifndef NO_SHORE
          col = mix(col, s, step(vW.y, uWater + uShoreH + (hash(pp) - 0.5) * 0.25));
#endif
          // Crisp, dithered grass/rock border.
          float isRock = step(0.32 + (hash(pp) - 0.5) * 0.08, slope);
          vec3 an = abs(n);
#ifdef TOON_GROUND
          // Coordinate along the wall: the horizontal axis the wall faces away from (dithered where they swap).
          float useZ = step(an.z + (bayer4(floor(vec2(vW.x + vW.z, vW.y) * uPx)) - 0.5) * 0.2, an.x);
          float along = mix(vW.x, vW.z, useZ);
          float u = floor(along * uPx) / uPx, y = floor(vW.y * uPx) / uPx;
          vec3 r = rock(u, y, 0.);
          // Ambient occlusion at the foot of every wall.
          r *= mix(0.68, 1., smoothstep(0., 1.8, vW.y - vCliff.y));
          col *= 1. - 0.1 * smoothstep(1.5, 4., vCliff.x - vW.y) * step(slope, 0.3); // soft contact shadow below cliffs
          // Grass hanging over the top edge of the walls (no long vines: seen from the side they were stray lines).
          float d = vCliff.x - vW.y, colN = floor(along * uPx / 2.);
          float L = 0.22 + 0.3 * hash(vec2(colN, 1.3)) + 0.25 * vnoise(vec2(along * 0.9, 2.));
          float hang = step(d, L) * isRock * step(1.2, vCliff.x - vCliff.y);
          vec3 hg = mix(g, g * vec3(0.5, 0.6, 0.62), step(L - 1.5 / uPx, d)); // dark tip
          col = mix(col, r, isRock);
          col = mix(col, hg, hang);
#else
          // Rock: triplanar on the vertical axes so cliffs never stretch.
          vec3 r = texture2D(tRock, vec2(vW.z, -vW.y) / uTexScale).rgb * an.x + texture2D(tRock, vec2(vW.x, -vW.y) / uTexScale).rgb * an.z;
          r = r / max(an.x + an.z, 0.001);
          col = mix(col, r, isRock);
          // Darker seam where grass meets rock (a toon "lip").
          col *= 1. - 0.22 * step(0.26, slope) * (1. - step(0.4, slope));
#endif
          col *= toonLight(n, pp);
          // Ground shadows of trees and props: a baked mask cut on the pixel grid with a dithered rim, one flat
          // tone (overlapping shadows never stack darker, and they follow slopes).
          float sh = texture2D(tShade, (ws + 0.5 / uPx) / uWorld + 0.5).r;
          col *= mix(vec3(1.), vec3(0.66, 0.72, 0.9), step(0.5 + (bayer4(pp + 3.) - 0.5) * 0.5, sh) * (1. - isRock));
          if (uLava > 0.5) col += vec3(1.0, 0.35, 0.05) * smoothstep(uWater + 0.6, uWater, vW.y) * 0.7;
          gl_FragColor = vec4(mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
          #include <colorspace_fragment>
        }`,
      });
      (this.mats.push(m), (this.terrainMat = m));
      let h = new Tr(o, m);
      ((h.matrixAutoUpdate = !1), this.group.add(h));
    }
    buildWater() {
      if (!this.hasWater) return;
      let e = this.isLava,
        t = new Uint16Array((this.res + 1) * (this.res + 1));
      for (let e = 0; e < t.length; e++) t[e] = kr.toHalfFloat(this.heights[e]);
      let n = this.biome.relief ? 0.2 : 1,
        r = new vr(t, this.res + 1, this.res + 1, ri, Er);
      ((r.magFilter = r.minFilter = Fr), (r.needsUpdate = !0), this.textures.push(r));
      let i = new Ei(e ? 12068874 : this.biome.waterColor).multiplyScalar(e ? 1 : 0.55),
        a = new Ei(e ? 16752672 : 7008480),
        o = new Kr({
          transparent: !e && !this.frozen,
          depthWrite: !0,
          uniforms: {
            uTime: this.shared.uTime,
            tH: { value: r },
            uScale: { value: n },
            uWorld: { value: this.world },
            uLevel: { value: this.waterLevel },
            uDeep: { value: i },
            uShallow: { value: a },
            uLava: { value: +!!e },
            uIce: { value: +!!this.frozen },
            uFogColor: this.shared.uFogColor,
            uFogNear: this.shared.uFogNear,
            uFogFar: this.shared.uFogFar,
          },
          vertexShader: `uniform float uTime; varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
          fragmentShader: `
        uniform float uTime, uScale, uWorld, uLevel, uLava, uIce; uniform sampler2D tH; uniform vec3 uDeep, uShallow, uFogColor; uniform float uFogNear, uFogFar;
        varying vec3 vW; varying float vD;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main(){
          vec2 huv = (vW.xz + uWorld*0.5) / uWorld;
          float depth = max(0., uLevel - texture2D(tH, huv).r) / uScale; // scaled: shallow ponds read like the deep lakes
          vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 3.0, depth));
          // Pixel-snapped ripples (8 px per unit) → crisp sparkles that read as pixel art.
          vec2 px = floor(vW.xz * 8.) / 8.;
          float r1 = vnoise(px * 0.9 + vec2(uTime * 0.6, uTime * 0.25));
          float r2 = vnoise(px * 1.3 - vec2(uTime * 0.35, -uTime * 0.5));
          float spark = step(0.9, r1 * r2 * 1.9);
          float band = step(0.62, (r1 + r2) * 0.5);
          float foamW = 0.3 + 0.12 * sin(uTime * 1.6 + vnoise(px * 0.5) * 6.);
          float foam = step(depth, foamW) + step(depth, foamW + 0.25) * step(0.55, r1) * 0.7;
          if (uIce > 0.5) {
            // Frozen lake (Glaciar Celeste): opaque pale ice, bluer where deep, frost toward the shore, a few long
            // pixel cracks with a lit edge and glints that come and go.
            vec2 ip = floor(vW.xz * 13.5);
            vec3 ice = mix(vec3(0.78, 0.92, 1.0), vec3(0.42, 0.7, 0.95), smoothstep(0.2, 3.5, depth));
            float pv = vnoise(ip * 0.02 + 4.) * 0.7 + vnoise(ip * 0.07) * 0.3;
            ice *= pv > 0.62 ? 1.05 : pv < 0.38 ? 0.93 : 1.;
            float frost = step(depth, 0.35 + 0.25 * vnoise(ip * 0.05));
            ice = mix(ice, vec3(0.93, 0.97, 1.0), frost);
            // Long cracks: one wobbly line through some 60 px cells, fading out toward the cell's rim.
            vec2 cq = ip / 60.; vec2 cf = fract(cq) - 0.5, ci = floor(cq);
            float ang = hash(ci) * 6.283, ca = cos(ang), sa = sin(ang);
            float along = cf.x * ca + cf.y * sa;
            float crack = abs(cf.x * sa - cf.y * ca + (vnoise(vec2(along * 9., hash(ci) * 50.)) - 0.5) * 0.09) * 60.;
            float hasC = step(0.62, hash(ci + 7.)) * step(abs(along), 0.36 + 0.1 * hash(ci + 3.));
            ice = mix(ice, vec3(0.3, 0.52, 0.8), step(crack, 0.6) * hasC * (1. - frost));
            ice = mix(ice, vec3(1.), step(0.6, crack) * step(crack, 1.6) * hasC * (1. - frost) * 0.6);
            float g = hash(ip + 0.31), tw = step(0.8, fract(g * 9.1 + uTime * (0.25 + g * 0.5)));
            ice = mix(ice, vec3(1.), step(0.996, g) * tw);
            gl_FragColor = vec4(mix(ice, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
            #include <colorspace_fragment>
            return;
          }
          if (uLava > 0.5) {
            float crust = step(0.55, vnoise(px * 0.6 + uTime * 0.1));
            col = mix(vec3(1.2, 0.45, 0.06), vec3(0.25, 0.08, 0.05), crust * 0.85) + vec3(1.0, 0.8, 0.3) * spark;
            gl_FragColor = vec4(mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
            #include <colorspace_fragment>
            return;
          }
          col = mix(col, col * 1.15, band);
          col = mix(col, vec3(1.), clamp(foam, 0., 1.) * 0.9);
          col += vec3(0.9, 1.0, 1.0) * spark * 0.8;
          float alpha = mix(0.75, 0.95, smoothstep(0., 2.5, depth));
          gl_FragColor = vec4(mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vD)), max(alpha, clamp(foam, 0., 1.) * 0.95));
          #include <colorspace_fragment>
        }`,
        });
      if ((this.mats.push(o), !this.ponds.length)) {
        let e = new Tr(new Yr(this.world, this.world, 1, 1).rotateX(-Math.PI / 2), o);
        ((e.position.y = this.waterLevel), (e.renderOrder = 2), this.group.add(e), this.waterMeshes.push(e));
      } else
        for (let e of this.ponds) {
          let t = o.clone();
          ((t.uniforms = { ...o.uniforms, uLevel: { value: e.level } }), this.mats.push(t));
          let n = new Tr(new Nr(e.r * 1.3, 32).rotateX(-Math.PI / 2), t);
          (n.position.set(e.x, e.level, e.z), (n.renderOrder = 2), this.group.add(n));
        }
    }
    scatterProps() {
      let e = new Ol(this.seed ^ 11259375),
        t = this.biome.tex,
        n = this.biome.props,
        r = Math.floor(560 * this.biome.propDensity * this.areaMul),
        i = {},
        a = new xr(),
        o = new di(),
        s = new ti(),
        c = new ti();
      for (let t = 0; t < r; t++) {
        let t = e.range(-this.play + 3, this.play - 3),
          r = e.range(-this.play + 3, this.play - 3);
        if (Math.hypot(t, r) < 20 || !this.isFlatOpen(t, r) || this.isReserved(t, r, 2)) continue;
        let l = Math.round((t + this.world / 2) / this.cell),
          u = Math.round((r + this.world / 2) / this.cell);
        if (
          this.pathMask[this.idx(l, u)] > 0.25 ||
          (this.noise.get(t * 0.03, r * 0.03) < -0.2 && e.chance(0.8))
        )
          continue;
        let d = e.pick(n),
          f = e.range(0.85, 1.3);
        (o.setFromAxisAngle(new ti(0, 1, 0), e.range(0, Math.PI * 2)),
          c.set(t, this.height(t, r) - 0.1, r),
          s.setScalar(f),
          (i[d] ??= []).push(a.clone().compose(c, o, s)));
        let p = ld[d] * f;
        p > 0 && this.addCollider({ x: t, z: r, r: p, h: ud[d] * f + c.y });
      }
      let l = {
        leaf: fd(Nu(this.seed + 4, t.leaf, 64)),
        bark: fd(Mu(this.seed + 5, t.bark)),
        rock: fd(Pu(this.seed + 6, t.rock)),
        leafAlt: fd(Nu(this.seed + 7, new Ei(t.leaf).offsetHSL(0.03, 0, 0.07).getHex(), 64)),
      };
      for (let e of Object.values(l)) (this.mats.push(e), this.textures.push(e.map));
      let u = new gi({ color: 1905968, side: 1 });
      ((u.onBeforeCompile = (e) => {
        e.vertexShader = e.vertexShader.replace(
          `#include <begin_vertex>`,
          `vec3 transformed = position + normal * 0.07;`,
        );
      }),
        this.mats.push(u));
      for (let e of Object.keys(i))
        for (let t of gd(e, this.biome, l))
          for (let n of [t.mat, u]) {
            let r = new Sr(t.geo, n, i[e].length);
            (i[e].forEach((e, t) => r.setMatrixAt(t, e)),
              (r.instanceMatrix.needsUpdate = !0),
              this.group.add(r));
          }
    }
    buildDecorations() {
      let e = this.biome.tex,
        t = Fu(this.seed + 8, e.top[1], e.accent);
      this.textures.push(t);
      let n = new Ol(this.seed ^ 4660),
        r = Math.round(7e3 * this.areaMul),
        i = [];
      for (let t = 0; t < r * 3 && i.length < r * 4; t++) {
        let t = n.range(-this.play, this.play),
          r = n.range(-this.play, this.play);
        if (!this.isFlatOpen(t, r)) continue;
        let a = Math.round((t + this.world / 2) / this.cell),
          o = Math.round((r + this.world / 2) / this.cell);
        this.pathMask[this.idx(a, o)] > 0.4 ||
          this.noise2.get(t * 0.05, r * 0.05) < -0.05 ||
          i.push(t, this.height(t, r) - 0.05, r, n.pick(e.deco) + n.range(0, 0.99));
      }
      let a = i.length / 4,
        o = new Ir();
      (o.setAttribute(
        `position`,
        new Dr(
          [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0, 0, 0, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0, 1, -0.5],
          3,
        ),
      ),
        o.setAttribute(`uv`, new Dr([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2)),
        o.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]),
        (o.instanceCount = a),
        o.setAttribute(`iOff`, new gr(new Float32Array(i), 4)),
        (this.decoMat = new Kr({
          side: 2,
          uniforms: {
            map: { value: t },
            uTime: this.shared.uTime,
            uWind: this.shared.uWind,
            uFogColor: this.shared.uFogColor,
            uFogNear: this.shared.uFogNear,
            uFogFar: this.shared.uFogFar,
            uPlayer: { value: new ti(0, -99, 0) },
          },
          vertexShader: `attribute vec4 iOff; uniform float uTime; uniform float uWind; uniform vec3 uPlayer; varying vec2 vUv; varying float vD; varying float vH;
        ${cu}
        void main(){
          float idx = floor(iOff.w); float sc = 1.0 + fract(iOff.w)*0.7;
          vec3 p = position * sc; float h = position.y;
          float sway = windSway(iOff.xz, uTime, h, 0.) * 0.16 * uWind;
          vec2 away = iOff.xz - uPlayer.xz; float d = length(away);
          vec2 push = normalize(away + 0.0001) * smoothstep(1.4, 0., d) * 0.5 * h;
          vec3 w = iOff.xyz + p + vec3(sway + push.x, 0., push.y);
          vec4 mv = viewMatrix * vec4(w, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
          vec2 cell = vec2(mod(idx, 8.), 1. - floor(idx / 8.)); vUv = (cell + uv) / vec2(8., 2.); vH = h; }`,
          fragmentShader: `uniform sampler2D map; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; varying vec2 vUv; varying float vD; varying float vH;
        void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5 || vD > 75.) discard; vec3 c = t.rgb * mix(0.8, 1.08, vH);
          gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vD)), 1.);
          #include <colorspace_fragment>
        }`,
        })),
        (this.grassMat = this.decoMat),
        this.mats.push(this.decoMat));
      let s = new Tr(o, this.decoMat);
      ((s.frustumCulled = !1), this.group.add(s));
    }
    addCollider(e) {
      this.colliders.push(e);
      this.colliderNeighborhoods.clear();
      this.deskColliderCells.clear();
      if(e.paperBox){
        const rx=Math.abs(e.cos)*e.halfX+Math.abs(e.sin)*e.halfZ,rz=Math.abs(e.sin)*e.halfX+Math.abs(e.cos)*e.halfZ;
        for(let x=Math.floor((e.x-rx)/8);x<=Math.floor((e.x+rx)/8);x++)for(let z=Math.floor((e.z-rz)/8);z<=Math.floor((e.z+rz)/8);z++){
          const key=(x+1000)*4096+z+1000;
          if(!this.colGrid.has(key))this.colGrid.set(key,[]);this.colGrid.get(key).push(e);
        }
        return;
      }
      let t = this.cellKey(e.x, e.z),
        n = this.colGrid.get(t);
      (n || this.colGrid.set(t, (n = [])), n.push(e));
    }
    cellKey(e, t) {
      return (Math.floor(e / 8) + 1e3) * 4096 + (Math.floor(t / 8) + 1e3);
    }
    nearbyColliders(x,z) {
      const key=this.cellKey(x,z),cached=this.colliderNeighborhoods.get(key);
      if(cached)return cached;
      // Keep the original resolution order, including for a box in several buckets.
      const neighbors=new Set();
      for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
        const bucket=this.colGrid.get(key+4096*dx+dz);
        if(bucket)for(const prop of bucket)neighbors.add(prop);
      }
      const list=Array.from(neighbors);
      this.colliderNeighborhoods.set(key,list);
      return list;
    }
    // Desk props are built from many narrow silhouette strips. Cache the strips
    // that a body of radius <= 2 could touch anywhere within this 2-unit cell.
    // The circumscribed circle covers the corners and rotated shelf barriers.
    collisionCandidates(x,z,radius) {
      if(!this.desk2d || radius>2)return this.nearbyColliders(x,z);
      const col=Math.floor(x/2),row=Math.floor(z/2),key=(col+1000)*4096+row+1000;
      let candidates=this.deskColliderCells.get(key);
      if(!candidates){
        const cx=col*2+1,cz=row*2+1;
        candidates=this.nearbyColliders(x,z).filter(prop=>
          !prop.paperBox || hitsPaperBox(prop,cx,cz,2+Math.SQRT2+.0001));
        this.deskColliderCells.set(key,candidates);
      }
      return candidates;
    }
    lineClear(e, t, n, r, i, a) {
      let o = Math.ceil(Math.hypot(r - e, a - n));
      for (let s = 1; s < o; s++) {
        let c = s / o;
        if (this.height(e + (r - e) * c, n + (a - n) * c) > t + (i - t) * c - 0.15) return !1;
      }
      return !0;
    }
    propTop(x,z,radius,ceiling=Infinity) {
      let top=-Infinity;
      for(const prop of this.collisionCandidates(x,z,radius)){
        if(prop.off || prop.standY==null || prop.standY<=top || prop.standY>ceiling)continue;
        const overlaps=prop.paperBox ? hitsPaperBox(prop,x,z,radius)
          : (x-prop.x)**2+(z-prop.z)**2<(prop.r+radius)**2;
        if(overlaps)top=prop.standY;
      }
      return top;
    }
    hitProp(e, t, n, r, playerPassage=false) {
      for(const prop of this.collisionCandidates(e,n,r)){
        if(prop.off || (playerPassage && prop.playerPassable) || (prop.standY!=null ? t>=prop.standY-.0001 : t>prop.h))continue;
        if(prop.paperBox){if(hitsPaperBox(prop,e,n,r))return true;continue;}
        const dx=e-prop.x,dz=n-prop.z,reach=prop.r+r;
        if(dx*dx+dz*dz<reach*reach)return true;
      }
      return !1;
    }
    walkClear(e, t, n, r, i, a) {
      let o = this.height(e, t);
      for (let s = 0.5; s <= i; s += 0.5) {
        let i = e + n * s,
          c = t + r * s,
          l = this.height(i, c);
        if (l > o + (this.workshopStepHeight ?? 0.6) || this.hitProp(i, l + 0.3, c, a * 0.8)) return !1;
        o = l;
      }
      return !0;
    }
    freeSpot(e, t, n, r, i) {
      for (let a = 3; a <= 18; a += 1.5)
        for (let o = 0; o < 16; o++) {
          let s = (o / 16) * Math.PI * 2 + a * 0.7,
            c = Math.cos(s),
            l = Math.sin(s),
            u = e + c * a,
            d = t + l * a;
          if (!this.inBounds(u, d, 2) || !this.isFlatOpen(u, d)) continue;
          let f = this.height(u, d);
          if (!(f > n + 8 || this.hitProp(u, f + 0.3, d, r + 0.4) || this.walkClear(e, t, c, l, a, r)))
            return ((i.x = u), (i.z = d), i);
        }
      return null;
    }
    resolve(e, t, n, r, i, playerPassage=false) {
      ((i.x = e), (i.z = t));
      // A push out of one prop can enter another cell. Keep the original
      // ordered solver for overlaps; open-floor movement needs no solver.
      if(this.desk2d && n<=2 && !this.hitProp(e,r,t,n,playerPassage))return i;
      for(const prop of this.nearbyColliders(e,t)){
        if(prop.off || (playerPassage && prop.playerPassable) || (prop.standY!=null ? r>=prop.standY-.0001 : r>prop.h))continue;
        if(prop.paperBox){resolvePaperBox(prop,i,n);continue;}
        const dx=i.x-prop.x,dz=i.z-prop.z,reach=prop.r+n,d2=dx*dx+dz*dz;
        if(d2<reach*reach){
          const distance=Math.sqrt(d2);
          i.x=prop.x+(distance?dx/distance:1)*(reach+.0001);
          i.z=prop.z+(distance?dz/distance:0)*(reach+.0001);
        }
      }
      return i;
    }
    randomPoint(e, t = 0, n = 0, r = 0, i = this.world) {
      for (let a = 0; a < 300; a++) {
        let a = e.range(0, Math.PI * 2),
          o = e.range(r, i),
          s = t + Math.cos(a) * o,
          c = n + Math.sin(a) * o;
        if (
          this.inBounds(s, c, 6) &&
          this.isFlatOpen(s, c) &&
          !(
            this.normal(s + 2, c).y < 0.9 ||
            this.normal(s - 2, c).y < 0.9 ||
            this.normal(s, c + 2).y < 0.9 ||
            this.normal(s, c - 2).y < 0.9
          )
        )
          return new ti(s, this.height(s, c), c);
      }
      return new ti(t, this.height(t, n), n);
    }
    update(e) {
      (this.decoMat?.uniforms.uPlayer.value.copy(e),
        this.env?.material.uniforms.uPlayer.value.copy(e),
        this.envModels?.uPlayer.value.copy(e));
    }
    disposed = !1;
    dispose() {
      if(this.zxPaper){this.disposed=true;disposePaperWorld(this);return;}
      ((this.disposed = !0),
        this.env?.dispose(),
        this.envModels?.dispose(),
        this.group.traverse((e) => {
          let t = e;
          if(t.isInstancedMesh)t.dispose();
          t.geometry && t.geometry.dispose();
        }));
      for (let e of this.mats) e.dispose();
      for (let e of this.textures) e.dispose();
      this.group.parent?.remove(this.group);
    }
  },
  ld = {
    tree: 0.8,
    pine: 0.7,
    palm: 0.5,
    cactus: 0.55,
    deadtree: 0.5,
    rock: 1.3,
    crystal: 0.8,
    grave: 0.6,
    mushroom: 0.6,
    snowpine: 0.7,
    lavarock: 1.3,
    bush: 0,
    coral: 0.6,
    pillar: 1,
  },
  ud = {
    tree: 7,
    pine: 8,
    palm: 7,
    cactus: 3,
    deadtree: 5,
    rock: 1.8,
    crystal: 2.5,
    grave: 1.4,
    mushroom: 1.8,
    snowpine: 8,
    lavarock: 1.8,
    bush: 1,
    coral: 2,
    pillar: 5,
  },
  dd = (() => {
    let e = new vr(new Uint8Array([110, 175, 255]), 3, 1, ri);
    return ((e.minFilter = e.magFilter = zr), (e.needsUpdate = !0), e);
  })(),
  fd = (e) => new wr({ map: e, gradientMap: dd }),
  pd = (e, t = 0) => new wr({ color: e, gradientMap: dd, emissive: t, emissiveIntensity: t ? 1.2 : 0 }),
  md = (e, t) => {
    let n = e.attributes.uv;
    for (let e = 0; e < n.count; e++) n.setXY(e, n.getX(e) * t, n.getY(e) * t);
    return e;
  },
  hd = (e, t = 1) => {
    let n = new ki(e, t);
    return (n.computeVertexNormals(), n);
  };
function gd(e, t, n) {
  switch (e) {
    case `tree`:
      return [
        { geo: md(new yr(0.28, 0.45, 3.2, 7).translate(0, 1.6, 0), 2), mat: n.bark },
        { geo: md(hd(2.1).translate(0, 4.3, 0), 3), mat: n.leaf },
        { geo: md(hd(1.5).translate(1.1, 5.4, 0.4), 2), mat: n.leafAlt },
        { geo: md(hd(1.3).translate(-1, 5.2, -0.5), 2), mat: n.leafAlt },
      ];
    case `pine`:
    case `snowpine`: {
      let t = [
        { geo: md(new yr(0.22, 0.32, 2.2, 6).translate(0, 1.1, 0), 2), mat: n.bark },
        { geo: md(new Pr(2, 3.2, 9).translate(0, 3.2, 0), 3), mat: n.leaf },
        { geo: md(new Pr(1.45, 2.6, 9).translate(0, 5.1, 0), 2), mat: n.leafAlt },
      ];
      return (
        e === `snowpine` && t.push({ geo: new Pr(0.95, 1.3, 9).translate(0, 6.5, 0), mat: pd(16777215) }),
        t
      );
    }
    case `palm`:
      return [
        { geo: md(new yr(0.22, 0.34, 5.8, 7).translate(0, 2.9, 0), 3), mat: n.bark },
        { geo: md(new Pr(2.8, 1.2, 8, 1, !0).translate(0, 5.9, 0), 3), mat: n.leaf },
      ];
    case `cactus`:
      return [
        { geo: md(new Di(0.5, 2.2, 4, 10).translate(0, 1.6, 0), 2), mat: n.leaf },
        { geo: md(new Di(0.32, 0.9, 4, 8).rotateZ(Math.PI / 2).translate(0.75, 1.7, 0), 1), mat: n.leaf },
      ];
    case `deadtree`:
      return [
        { geo: md(new yr(0.16, 0.38, 4.2, 6).translate(0, 2.1, 0), 2), mat: n.bark },
        { geo: new yr(0.08, 0.16, 2, 5).rotateZ(0.9).translate(0.75, 3.3, 0), mat: n.bark },
      ];
    case `rock`:
    case `lavarock`: {
      let t = [{ geo: md(hd(1.35, 0).scale(1, 0.75, 1).translate(0, 0.5, 0), 2), mat: n.rock }];
      return (
        e === `lavarock` && t.push({ geo: new hr(0.5, 0).translate(0, 1.2, 0), mat: pd(16734736, 16726528) }),
        t
      );
    }
    case `crystal`: {
      let e = t.id === `volcano` ? 16742970 : 9103615;
      return [
        { geo: new jr(0.8, 0).scale(0.6, 1.8, 0.6).translate(0, 1.3, 0), mat: pd(e, e) },
        { geo: new jr(0.5, 0).scale(0.6, 1.6, 0.6).rotateZ(0.5).translate(0.6, 0.8, 0), mat: pd(e, e) },
      ];
    }
    case `grave`:
      return [{ geo: md(new Vr(1, 1.4, 0.3).translate(0, 0.7, 0), 1), mat: n.rock }];
    case `mushroom`: {
      let e = t.id === `graveyard` ? 10115800 : 15223370;
      return [
        { geo: new yr(0.22, 0.3, 1.1, 8).translate(0, 0.55, 0), mat: pd(15788248) },
        {
          geo: new wi(0.8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.05, 0),
          mat: pd(e, t.id === `graveyard` ? 5909130 : 0),
        },
      ];
    }
    case `bush`:
      return [{ geo: md(hd(1).scale(1.3, 0.8, 1.3).translate(0, 0.55, 0), 2), mat: n.leafAlt }];
    case `coral`:
      return [
        { geo: new Pr(0.4, 2, 6).translate(0, 1, 0), mat: pd(16743050) },
        { geo: new Pr(0.3, 1.4, 6).rotateZ(0.5).translate(0.4, 0.8, 0), mat: pd(16752762) },
      ];
    case `pillar`:
      return [
        { geo: md(new yr(0.85, 0.95, 5, 10).translate(0, 2.5, 0), 3), mat: n.rock },
        { geo: md(new Vr(2.1, 0.5, 2.1).translate(0, 5.1, 0), 1), mat: n.rock },
      ];
  }
}
function _d(e) {
  switch (e?.ground) {
    case `sand`:
      return { glsl: Yu, name: `toonSand` };
    case `beach`:
      return { glsl: Ju(0.6, `toonBeach`), name: `toonBeach` };
    case `snow`:
      return { glsl: Xu, name: `toonSnow` };
    default:
      return { glsl: qu, name: `toonGrass` };
  }
}
var vd = 120,
  yd = 240,
  bd = vd / yd,
  xd = -0.6,
  Cd = { x: 10, z: -19.5, r: 10.5, h: 10 },
  wd = { x: 11, z: -9, r: 5.6, h: 4.6 },
  Td = { x: 0.8, z: -13.8, r: 3.8, h: 7.2 },
  Ed = { x: -15, z: -23, r: 9, h: 6.4 },
  Dd = { x: -14, z: -21.5, r: 11.6, h: 2.6 },
  Od = { x: 32, z: -7, r: 8, h: 3.4 },
  kd = [Cd, wd, Td, Ed, Dd, Od],
  Ad = { a: { x: 15, z: -29 }, lip: { x: 10.5, z: -9.4 }, w: 1.8 },
  jd = { x: 10.5, z: -7.2, r: 2.2 },
  Md = { x: 10.6, z: -3.4 },
  Nd = Cd.h - 0.35,
  Pd = wd.h - 0.45,
  Fd = { growlithe: { x: 14.2, z: -10.5 } },
  Ld = { x: -6, y: 5.6, z: 19.5 },
  Rd = { x: 5.5, y: 2.9, z: -4.5 };

var Hd = 120,
  Ud = 200,
  Wd = Hd / Ud,
  Gd = { x: 14, z: -21, r: 12.5, h: 6 },
  Kd = { x: -17, z: -26, r: 11, h: 3.6 },
  qd = [Gd, Kd, { x: 33, z: -8, r: 7, h: 2.2 }],
  Jd = { x: 14.5, z: -22.5 },
  Xd = { x: 4.5, z: 3 },
  Zd = { x: -7, y: 5.6, z: 21 },
  Qd = { x: 1.5, y: 8.8, z: -6 },
  $d = [
    { x: Xd.x + 0.6, z: Xd.z + 1 },
    { x: Xd.x + 3.6, z: Xd.z + 2 },
    { x: Xd.x - 4.4, z: Xd.z + 2.4 },
    { x: Xd.x + 6, z: Xd.z - 1.2 },
  ];

export {
  bu,
  cd
};
