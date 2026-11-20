// source/src/entry-layout.js
var entryControls = {
  journey: [30, 619, 322, 63],
  multiplayer: [30, 698, 155, 52],
  lab: [196, 698, 156, 52],
  back: [28, 717, 70, 54],
  enter: [105, 716, 252, 55],
  tiers: [[28, 602, 75, 52], [112, 602, 76, 52], [198, 602, 75, 52], [282, 602, 76, 52]]
};
function entryLayout(v) {
  const scale = Math.min(v.w / 382, v.height / 826, v.h / 736);
  const x = v.x + (v.w - 382 * scale) / 2;
  const y = Math.min(v.y + v.h - 801 * scale, Math.max(v.y - 66 * scale, (v.height - 826 * scale) / 2));
  return { scale, x, y };
}

// platform/viewport.mjs
function gameViewport(info, menu) {
  const width = info.windowWidth, height = info.windowHeight, screenTop = info.screenTop || 0;
  let left = 0, top = 0, right = width, bottom = height;
  const safe = info.safeArea;
  if (safe) {
    const x = Math.max(0, safe.left), y = Math.max(0, safe.top - screenTop);
    const r = Math.min(width, safe.right), b = Math.min(height, safe.bottom - screenTop);
    if (r - x > width / 2 && b - y > height / 2) {
      left = x;
      top = y;
      right = r;
      bottom = b;
    }
  }
  const pad = width <= 350 ? 10 : 12;
  let hudTop = { x: pad, y: top + 8, w: right - left - pad * 2, h: 26 };
  if (menu && menu.right > menu.left && menu.right <= width + 1 && menu.bottom > menu.top && menu.bottom - screenTop < height / 2) {
    top = Math.max(top, menu.bottom - screenTop + 4);
    const available = menu.left - left - pad - 44;
    hudTop = available >= 120 ? { x: pad, y: Math.max(0, menu.top - screenTop + (menu.bottom - menu.top - 26) / 2), w: available, h: 26 } : { x: pad, y: top + 8, w: right - left - pad * 2, h: 26 };
  }
  hudTop.y -= top;
  const stack = { x: pad, y: Math.max(8, hudTop.y + hudTop.h + 15), w: right - left - pad * 2, h: 156 };
  const hint = { x: stack.x + 4, y: stack.y + 144, w: Math.min(292, stack.w - 52), h: 100 };
  const gameScreen = { x: -left, y: -top, w: width, h: height, fill: true };
  return {
    w: right - left,
    h: bottom - top,
    x: left,
    y: top,
    width,
    height,
    dpr: info.pixelRatio || 1,
    regions: { "hud-top": hudTop, "hud-stack": stack, "hud-hint": hint, "game-screen": gameScreen }
  };
}

// source/src/desk-framing.js
var deskPitch = Math.PI * 0.3;
var deskTilt = Math.sin(deskPitch);
var normalHeight = 84 * Math.tan(37 * Math.PI / 360);
var deskPixelsPerUnit = 2347 / 1.81 / normalHeight;
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
var entryHeroScale = 2;
var entryFootOffset = 0.3;
var cameraEase = (progress) => progress * progress * (3 - 2 * progress);
function deskFrame(aspect, halfWidth, halfDepth, focusX, focusZ, progress = 1, bend = 0) {
  const normal = Math.min(normalHeight * Math.max(1, 0.46 / aspect), halfDepth * 2 * deskTilt, halfWidth * 2 / aspect) / 2;
  const near = Math.min(normal, 4.65 * entryHeroScale * Math.max(1, 0.46 / aspect));
  const t = cameraEase(progress), h = near + (normal - near) * t, w = h * aspect;
  const curve = 4 * t * (1 - t) * bend;
  const x = clamp(focusX + w * ((1 - t) * (1 - 2 * 167 / 382) + t * 0.148) + curve, -halfWidth + w, halfWidth - w);
  const z = clamp(focusZ + (h * ((1 - t) * (1 - 2 * 377 / 826) + t * 0.05) + curve * 0.24) / deskTilt, -halfDepth + h / deskTilt, halfDepth - h / deskTilt);
  return { x, z, w, h, distance: 42 * h / normal };
}

// source/art/entry/pixels.json
var pixels_default = [[29, 0, 11, 9, 216], [58, 0, 10, 9, 216], [86, 0, 11, 9, 216], [115, 0, 11, 9, 216], [144, 0, 10, 9, 216], [187, 0, 10, 9, 216], [215, 0, 11, 9, 216], [244, 0, 11, 9, 216], [273, 0, 10, 9, 216], [287, 0, 11, 9, 216], [316, 0, 10, 9, 216], [330, 0, 10, 9, 216], [344, 0, 11, 9, 216], [359, 0, 9, 9, 216], [43, 13, 11, 10, 198], [58, 13, 10, 10, 198], [101, 13, 10, 10, 198], [115, 13, 11, 10, 198], [158, 13, 11, 10, 198], [201, 13, 10, 10, 198], [215, 13, 11, 10, 198], [230, 13, 10, 10, 198], [244, 13, 10, 10, 198], [273, 13, 10, 10, 198], [301, 13, 11, 10, 198], [316, 13, 10, 10, 198], [344, 13, 11, 10, 198], [359, 13, 9, 10, 198], [43, 27, 11, 11, 180], [129, 27, 11, 11, 180], [144, 27, 10, 11, 180], [172, 27, 11, 11, 180], [201, 27, 10, 11, 180], [215, 27, 11, 11, 180], [230, 27, 10, 11, 180], [301, 27, 11, 11, 180], [316, 27, 10, 11, 180], [330, 27, 10, 11, 180], [344, 27, 11, 11, 180], [58, 41, 10, 11, 160], [86, 41, 11, 11, 160], [144, 41, 10, 11, 160], [158, 41, 11, 11, 160], [172, 41, 11, 11, 160], [201, 41, 10, 11, 160], [215, 41, 11, 11, 160], [258, 41, 11, 11, 160], [58, 56, 10, 11, 144], [86, 56, 11, 11, 144], [115, 56, 11, 11, 144], [172, 56, 11, 11, 144], [244, 56, 10, 11, 144], [258, 56, 11, 11, 144], [273, 56, 10, 11, 144], [301, 56, 11, 11, 144], [158, 70, 11, 11, 128], [201, 70, 10, 11, 128], [244, 70, 10, 11, 128], [258, 70, 11, 11, 128], [273, 70, 10, 11, 128], [301, 70, 11, 11, 128], [316, 70, 10, 11, 128], [158, 85, 11, 10, 115], [172, 85, 11, 10, 116], [201, 85, 10, 10, 115], [244, 85, 10, 10, 116], [344, 85, 11, 10, 116], [215, 99, 11, 10, 106], [244, 99, 10, 10, 106], [344, 99, 11, 10, 106], [172, 114, 11, 10, 97], [201, 114, 10, 10, 97], [244, 114, 10, 10, 97], [258, 114, 11, 10, 97], [201, 128, 10, 10, 88], [215, 128, 11, 10, 89], [258, 128, 11, 10, 89], [273, 128, 10, 10, 89], [158, 142, 11, 11, 79], [273, 142, 10, 11, 79], [158, 157, 11, 10, 66], [258, 157, 11, 10, 66], [273, 157, 10, 10, 66], [244, 171, 10, 10, 53], [244, 186, 10, 10, 38], [258, 186, 11, 10, 38], [244, 200, 10, 10, 25], [130, 469, 9, 9, 9], [101, 483, 10, 9, 14], [115, 483, 10, 9, 14], [216, 483, 9, 9, 14], [101, 497, 10, 10, 19], [215, 497, 10, 10, 19], [101, 511, 10, 10, 25], [115, 511, 10, 10, 25], [158, 511, 10, 10, 25], [172, 511, 10, 10, 25], [115, 526, 10, 10, 31], [129, 526, 11, 10, 32], [172, 526, 11, 10, 31], [201, 526, 10, 10, 32], [29, 540, 10, 10, 38], [129, 540, 11, 10, 38], [158, 540, 10, 10, 39], [29, 554, 10, 11, 46], [129, 554, 11, 11, 46], [172, 554, 11, 11, 46], [201, 554, 10, 11, 46], [215, 554, 11, 11, 46], [58, 569, 10, 10, 52], [72, 569, 10, 10, 52], [101, 569, 10, 10, 52], [115, 569, 10, 10, 52], [129, 569, 11, 10, 52], [172, 569, 11, 10, 52], [215, 569, 11, 10, 52], [72, 583, 10, 10, 59], [101, 583, 10, 10, 59], [115, 583, 10, 10, 59], [129, 583, 11, 10, 59], [201, 583, 10, 10, 59], [258, 583, 11, 10, 59], [287, 583, 10, 10, 59], [316, 583, 10, 10, 59], [115, 598, 10, 10, 66], [158, 598, 10, 10, 66], [172, 598, 11, 10, 66], [201, 598, 10, 10, 66], [215, 598, 11, 10, 66], [230, 598, 10, 10, 66], [287, 598, 10, 10, 66], [316, 598, 10, 10, 66], [29, 612, 10, 10, 72], [43, 612, 11, 10, 73], [58, 612, 10, 10, 72], [72, 612, 10, 10, 72], [144, 612, 10, 10, 72], [158, 612, 10, 10, 72], [172, 612, 11, 10, 72], [201, 612, 10, 10, 72], [230, 612, 10, 10, 73], [244, 612, 10, 10, 72], [330, 612, 10, 10, 72], [15, 626, 10, 11, 79], [29, 626, 10, 11, 79], [58, 626, 10, 11, 79], [72, 626, 10, 11, 79], [101, 626, 10, 11, 79], [129, 626, 11, 11, 79], [143, 626, 11, 11, 79], [158, 626, 10, 11, 79], [172, 626, 11, 11, 79], [215, 626, 11, 11, 79], [258, 626, 11, 11, 79], [272, 626, 11, 11, 79], [316, 626, 10, 11, 79], [330, 626, 10, 11, 79], [15, 641, 10, 10, 87], [29, 641, 10, 10, 87], [43, 641, 11, 10, 87], [58, 641, 10, 10, 87], [86, 641, 11, 10, 87], [101, 641, 10, 10, 87], [129, 641, 11, 10, 87], [158, 641, 10, 10, 87], [187, 641, 10, 10, 87], [230, 641, 10, 10, 87], [258, 641, 11, 10, 87], [287, 641, 10, 10, 87], [316, 641, 10, 10, 87], [344, 641, 11, 10, 87], [29, 655, 10, 10, 98], [43, 655, 11, 10, 98], [58, 655, 10, 10, 98], [72, 655, 10, 10, 98], [86, 655, 11, 10, 98], [101, 655, 10, 10, 98], [115, 655, 10, 10, 98], [129, 655, 11, 10, 98], [143, 655, 11, 10, 98], [158, 655, 10, 10, 98], [187, 655, 10, 10, 98], [215, 655, 11, 10, 98], [272, 655, 11, 10, 98], [330, 655, 10, 10, 98], [359, 655, 9, 10, 98], [15, 670, 10, 10, 116], [29, 670, 10, 10, 116], [43, 670, 11, 10, 116], [58, 670, 10, 10, 115], [72, 670, 10, 10, 116], [86, 670, 11, 10, 116], [101, 670, 10, 10, 116], [115, 670, 11, 10, 116], [129, 670, 11, 10, 116], [143, 670, 11, 10, 116], [158, 670, 11, 10, 116], [172, 670, 11, 10, 116], [187, 670, 10, 10, 116], [201, 670, 10, 10, 116], [215, 670, 11, 10, 116], [230, 670, 10, 10, 116], [244, 670, 10, 10, 116], [258, 670, 11, 10, 116], [272, 670, 11, 10, 116], [287, 670, 11, 10, 116], [301, 670, 11, 10, 116], [316, 670, 10, 10, 116], [330, 670, 10, 10, 116], [344, 670, 11, 10, 116], [359, 670, 9, 10, 116], [15, 684, 10, 11, 138], [43, 684, 11, 11, 138], [101, 684, 10, 11, 138], [158, 684, 11, 11, 138], [187, 684, 10, 11, 138], [215, 684, 11, 11, 138], [230, 684, 10, 11, 138], [244, 684, 10, 11, 138], [258, 684, 11, 11, 138], [273, 684, 10, 11, 138], [287, 684, 11, 11, 138], [301, 684, 11, 11, 138], [316, 684, 10, 11, 138], [330, 684, 10, 11, 138], [344, 684, 11, 11, 138], [29, 699, 11, 10, 163], [58, 699, 10, 10, 163], [86, 699, 11, 10, 163], [115, 699, 11, 10, 163], [144, 699, 10, 10, 163], [187, 699, 10, 10, 163], [215, 699, 11, 10, 163], [244, 699, 10, 10, 163], [273, 699, 10, 10, 163], [287, 699, 11, 10, 163], [316, 699, 10, 10, 163], [330, 699, 10, 10, 163], [344, 699, 11, 10, 163], [359, 699, 9, 10, 163], [43, 713, 11, 11, 189], [58, 713, 10, 11, 189], [101, 713, 10, 11, 189], [115, 713, 11, 11, 189], [158, 713, 11, 11, 189], [201, 713, 10, 11, 189], [215, 713, 11, 11, 189], [230, 713, 10, 11, 189], [244, 713, 10, 11, 189], [273, 713, 10, 11, 189], [301, 713, 11, 11, 189], [316, 713, 10, 11, 189], [344, 713, 11, 11, 189], [359, 713, 9, 11, 189], [43, 727, 11, 11, 217], [129, 727, 11, 11, 216], [144, 727, 10, 11, 217], [172, 727, 11, 11, 217], [201, 727, 10, 11, 217], [215, 727, 11, 11, 217], [230, 727, 10, 11, 217], [301, 727, 11, 11, 217], [316, 727, 10, 11, 217], [330, 727, 10, 11, 217], [344, 727, 11, 11, 217], [58, 742, 10, 10, 239], [86, 742, 11, 10, 239], [144, 742, 10, 10, 239], [158, 742, 11, 10, 239], [172, 742, 11, 10, 239], [201, 742, 10, 10, 239], [215, 742, 11, 10, 239], [258, 742, 11, 10, 239], [58, 756, 10, 11, 255], [86, 756, 11, 11, 255], [115, 756, 11, 11, 255], [172, 756, 11, 11, 255], [244, 756, 11, 11, 255], [258, 756, 11, 11, 255], [273, 756, 10, 11, 255], [301, 756, 11, 11, 255], [158, 771, 11, 10, 247], [201, 771, 10, 10, 247], [244, 771, 11, 10, 247], [258, 771, 11, 10, 247], [273, 771, 10, 10, 247], [301, 771, 11, 10, 247], [316, 771, 10, 10, 247], [158, 785, 11, 11, 230], [172, 785, 11, 11, 230], [201, 785, 10, 11, 230], [244, 785, 11, 11, 230], [344, 785, 11, 11, 230], [215, 799, 11, 11, 212], [244, 799, 11, 11, 212], [344, 799, 11, 11, 212], [172, 814, 11, 10, 196], [201, 814, 10, 10, 196], [244, 814, 10, 10, 196], [258, 814, 11, 10, 195]];

// platform/entry-scene.js
function decodeImage(src, name) {
  return new Promise((resolve, reject) => {
    const image = wx.createImage();
    const finish = (error) => {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      if (error) reject(Error(name + " " + (error.errMsg || error.message || "\u56FE\u7247\u89E3\u7801\u5931\u8D25")));
      else resolve(image);
    };
    const timer = setTimeout(() => finish(Error("\u56FE\u7247\u89E3\u7801\u8D85\u65F6")), 8e3);
    image.onload = () => finish();
    image.onerror = (error) => finish(error || Error("\u56FE\u7247\u89E3\u7801\u5931\u8D25"));
    try {
      image.src = src;
    } catch (error) {
      finish(error);
    }
  });
}
var topStops = [
  [0, "rgba(201,217,245,.98)"],
  [15, "rgba(189,212,251,.83)"],
  [30, "rgba(182,208,253,.64)"],
  [60, "rgba(169,199,250,.34)"],
  [85, "rgba(169,199,250,.19)"],
  [110, "rgba(169,199,250,.07)"],
  [165, "rgba(169,199,250,0)"]
];
var bottomStops = [[580, 0], [610, 0.045], [630, 0.12], [650, 0.22], [680, 0.42], [700, 0.56], [720, 0.71], [740, 0.86], [760, 0.95], [790, 1], [826, 1]];
function paintOverlay(c, w, h, v, mode, tier, value, art) {
  const { scale, x, y } = entryLayout(v), rx = w / v.width, ry = h / v.height;
  c.setTransform(rx, 0, 0, ry, 0, 0);
  c.clearRect(0, 0, v.width, v.height);
  if (mode === "departure") return;
  const gradient = c.createLinearGradient(0, 0, 0, v.height);
  for (const [at, color] of topStops) gradient.addColorStop(at / 826, color);
  for (const [at, alpha] of bottomStops) gradient.addColorStop(at / 826, "rgba(248,244,233," + alpha + ")");
  c.fillStyle = gradient;
  c.fillRect(0, 0, v.width, v.height);
  const pxScale = v.width / 382;
  c.fillStyle = "#fff";
  for (const [a, b, width, height, alpha] of pixels_default) {
    const py = b < 413 ? b * pxScale : v.height - (826 - b) * pxScale;
    c.globalAlpha = alpha / 255;
    c.fillRect(a * pxScale, py, width * pxScale, height * pxScale);
  }
  c.globalAlpha = 1;
  c.setTransform(scale * rx, 0, 0, scale * ry, x * rx, y * ry);
  if (mode === "home") c.drawImage(art.home, 28, 619);
  else if (mode === "map") {
    c.drawImage(art.stages, 6, 404);
    c.drawImage(art.ribbon, 0, 66);
    const [left, , width] = entryControls.tiers[tier];
    c.fillStyle = "#344c9b";
    c.beginPath();
    c.moveTo(left, 646);
    c.lineTo(left + 5, 651);
    c.lineTo(left + width - 5, 651);
    c.lineTo(left + width, 646);
    c.lineTo(left + width, 650);
    c.lineTo(left + width - 5, 654);
    c.lineTo(left + 5, 654);
    c.lineTo(left, 650);
    c.fill();
  } else {
    c.fillStyle = "#205780";
    c.fillRect(34, 722, 314, 23);
    c.fillStyle = "white";
    c.fillRect(36, 724, 310, 19);
    c.fillStyle = "#3586b9";
    c.fillRect(36, 724, 310 * value / 100, 19);
    c.fillStyle = "#205780";
    c.font = "bold 24px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(value + "%", 191, 761);
  }
}
module.exports = async function createEntryScene(gl) {
  var _a, _b;
  const data = require("./entry-data"), { spawn, idle } = data;
  const files = [...data.layers.map(([name]) => name), "idle.png", "home.png", "stages.png", "ribbon.png"];
  let useLocalFiles = false;
  const materialized = /* @__PURE__ */ new Set();
  async function loadImage(name) {
    const encoded = data.images[name];
    if (!encoded) throw Error("\u542F\u52A8\u56FE\u672A\u7F16\u5165\u4E3B\u5305 " + name);
    if (!useLocalFiles) {
      const mime = name.endsWith(".jpg") ? "image/jpeg" : "image/png";
      try {
        return await decodeImage("data:" + mime + ";base64," + encoded, name);
      } catch (e) {
        useLocalFiles = true;
      }
    }
    const file = wx.env.USER_DATA_PATH + "/zixing-entry-" + name;
    try {
      if (!materialized.has(name)) {
        wx.getFileSystemManager().writeFileSync(file, encoded, "base64");
        materialized.add(name);
      }
      return await decodeImage(file, name);
    } catch (error) {
      materialized.delete(name);
      throw Error("\u65E0\u6CD5\u8BFB\u53D6\u542F\u52A8\u56FE " + name + "\uFF08" + (error.errMsg || error.message || "\u672C\u5730\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25") + "\uFF09");
    }
  }
  let images = null, art = null, reading = null, loadError = false;
  function prepare() {
    if (reading) return reading;
    let next = 0, failure = null;
    const loaded = [];
    async function worker() {
      while (!failure && next < files.length) {
        const i = next++;
        try {
          loaded[i] = await loadImage(files[i]);
        } catch (error) {
          failure = error;
        }
      }
    }
    reading = Promise.all([worker(), worker()]).then(() => {
      reading = null;
      if (failure) throw failure;
      images = loaded;
      const [actor, home, stages, ribbon] = loaded.slice(data.layers.length);
      art = { actor, home, stages, ribbon };
    });
    return reading;
  }
  await prepare();
  const scene = wx.createCanvas(), ui = wx.createCanvas();
  const program = gl.createProgram(), vao = gl.createVertexArray();
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    gl.attachShader(program, s);
    gl.deleteShader(s);
  }
  shader(gl.VERTEX_SHADER, `#version 300 es
    out vec2 uv;
    void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=vec2(p.x,1.-p.y);gl_Position=vec4(2.*p-1.,0.,1.);}`);
  shader(gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float;
    uniform sampler2D desk,actorArt,overlay; uniform vec4 actorRect,frameRect;
    uniform int percent; uniform bool overScene;
    in vec2 uv;out vec4 color;
    void main(){
      if(percent<0)discard;
      if(overScene){color=texture(overlay,uv);return;}
      vec3 rgb=texture(desk,uv).rgb;
      vec2 p=(uv-actorRect.xy)/actorRect.zw;
      if(all(greaterThanEqual(p,vec2(0)))&&all(lessThanEqual(p,vec2(1)))){
        vec4 a=texture(actorArt,frameRect.xy+p*frameRect.zw);rgb=mix(rgb,a.rgb,a.a);
      }
      vec4 f=texture(overlay,uv);color=vec4(mix(rgb,f.rgb,f.a),1.);
    }`);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  const uniforms = {};
  for (const name of ["desk", "actorArt", "overlay", "actorRect", "frameRect", "percent", "overScene"]) uniforms[name] = gl.getUniformLocation(program, name);
  let textures = [], surfaceKey = "", overlayKey = "", actorRect = [], bootValue = 0, lastBootFrame = -1, auto = true, visible = true, disposed = false;
  const epoch = Date.now(), viewInfo = () => {
    var _a2;
    return gameViewport(wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync(), (_a2 = wx.getMenuButtonBoundingClientRect) == null ? void 0 : _a2.call(wx));
  };
  function upload(slot, image) {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, textures[slot]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }
  function page(mode, v, tier = 0, value = 0, over = false) {
    if (disposed) return;
    if (!images) {
      if (!reading && !loadError) prepare().catch((error) => {
        loadError = true;
        wx.showModal({
          title: "\u542F\u52A8\u573A\u666F\u8BFB\u53D6\u5931\u8D25",
          content: error.message,
          showCancel: false,
          confirmText: "\u91CD\u8BD5",
          success: () => {
            loadError = false;
          }
        });
      });
      return;
    }
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, key = [w, h, v.width, v.height, v.x, v.y, v.w, v.h].join("/");
    if (!w || !h) return;
    if (!textures.length) {
      textures = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
      upload(1, art.actor);
    }
    if (key !== surfaceKey) {
      scene.width = ui.width = w;
      scene.height = ui.height = h;
      const c = scene.getContext("2d");
      const [mw, mh] = data.mapSize;
      const frame2 = deskFrame(w / h, mw / (2 * deskPixelsPerUnit), mh / (2 * deskPixelsPerUnit * deskTilt), (spawn.x - mw / 2) / deskPixelsPerUnit, (spawn.z - mh / 2) / (deskPixelsPerUnit * deskTilt), 0);
      const scale = h / (2 * frame2.h), zoom = scale / deskPixelsPerUnit;
      const ox = w / 2 - (mw / 2 + frame2.x * deskPixelsPerUnit) * zoom, oy = h / 2 - (mh / 2 + frame2.z * deskPixelsPerUnit * deskTilt) * zoom;
      c.setTransform(zoom, 0, 0, zoom, ox, oy);
      data.layers.forEach(([, x, y, width, height], i) => c.drawImage(images[i], x, y, width, height));
      const footX = ox + spawn.x * zoom, footY = oy + spawn.z * zoom;
      c.setTransform(scale, 0, 0, scale, footX, footY);
      c.save();
      c.scale(0.525 * entryHeroScale, 0.275 * deskTilt * entryHeroScale);
      c.fillStyle = "rgba(72,62,100,.72)";
      c.beginPath();
      c.arc(0, 0, 1, 0, 2 * Math.PI);
      c.fill();
      c.restore();
      const size = idle.worldSize * entryHeroScale * scale;
      actorRect = [(footX - size * 0.5) / w, (footY + scale * (entryFootOffset - 0.08 * Math.sqrt(1 - deskTilt * deskTilt)) - size) / h, size / w, size / h];
      upload(0, scene);
      surfaceKey = key;
      overlayKey = "";
    }
    const overlayState = mode + "/" + tier + "/" + value;
    if (overlayKey !== overlayState) {
      paintOverlay(ui.getContext("2d"), w, h, v, mode, tier, value, art);
      upload(2, ui);
      overlayKey = overlayState;
    }
    const frame = idle.first + Math.floor((Date.now() - epoch) * idle.fps / 1e3) % idle.count;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.BLEND);
    gl.colorMask(true, true, true, true);
    if (over) {
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    ["desk", "actorArt", "overlay"].forEach((name, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.uniform1i(uniforms[name], i);
    });
    gl.uniform4fv(uniforms.actorRect, actorRect);
    gl.uniform4f(uniforms.frameRect, frame % idle.columns / idle.columns, Math.floor(frame / idle.columns) / idle.rows, 1 / idle.columns, 1 / idle.rows);
    if (mode === "boot") gl.uniform1i(uniforms.percent, value);
    gl.uniform1i(uniforms.overScene, over ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.useProgram(null);
    return true;
  }
  function suspend() {
    for (const tex of textures) gl.deleteTexture(tex);
    textures = [];
    surfaceKey = overlayKey = "";
    scene.width = scene.height = ui.width = ui.height = 1;
  }
  function releaseArt() {
    images = art = null;
  }
  const bootView = viewInfo();
  function draw(value, over) {
    bootValue = value;
    page("boot", bootView, 0, value, over);
  }
  function tick() {
    if (!auto || disposed) return;
    const frame = Math.floor((Date.now() - epoch) * idle.fps / 1e3);
    if (visible && frame !== lastBootFrame) {
      draw(bootValue);
      lastBootFrame = frame;
    }
    requestAnimationFrame(tick);
  }
  const hide = () => {
    visible = false;
  }, show = () => {
    visible = true;
  };
  (_a = wx.onHide) == null ? void 0 : _a.call(wx, hide);
  (_b = wx.onShow) == null ? void 0 : _b.call(wx, show);
  function handoff() {
    var _a2, _b2;
    if (!auto) return;
    auto = false;
    (_a2 = wx.offHide) == null ? void 0 : _a2.call(wx, hide);
    (_b2 = wx.offShow) == null ? void 0 : _b2.call(wx, show);
  }
  draw(0);
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(tick);
  async function heroArt() {
    if (!art) await prepare();
    return { image: art.actor, idle };
  }
  return { draw, page, handoff, suspend, releaseArt, heroArt, dispose() {
    handoff();
    suspend();
    releaseArt();
    disposed = true;
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  } };
};
