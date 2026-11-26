"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// source/src/ui/menu-scene.js
var menu_scene_exports = {};
__export(menu_scene_exports, {
  gameTitle: () => gameTitle,
  gradient: () => gradient,
  loadingBackdropColor: () => loadingBackdropColor,
  paintLoadingBackdrop: () => paintLoadingBackdrop,
  paintLoadingSlip: () => paintLoadingSlip,
  paintMenuScene: () => paintMenuScene,
  paintWordmark: () => paintWordmark,
  polygon: () => polygon
});
function polygon(c, p, fill) {
  c.beginPath();
  c.moveTo(...p[0]);
  for (const a of p.slice(1)) c.lineTo(...a);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function gradient(c, x, y, xx, yy, a, b) {
  const g = c.createLinearGradient(x, y, xx, yy);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function paintWordmark(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.035);
  c.font = 'bold 144px "Ziling Swei",sans-serif';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.strokeStyle = "#5B98D6";
  c.lineWidth = 20;
  c.strokeText(gameTitle, 0, 0);
  c.strokeStyle = ink;
  c.lineWidth = 9;
  c.strokeText(gameTitle, 0, 0);
  c.fillStyle = paper;
  c.fillText(gameTitle, 0, 0);
  c.restore();
}
function paintMenuScene(c, width, height, hero, drawWord, selectedWord) {
  const w = 780, h = hero ? 1040 : 340;
  c.save();
  c.scale(width / w, height / h);
  c.fillStyle = hero ? gradient(c, 0, 0, 0, h, "#292943", "#21253F") : "#D7E8ED";
  c.fillRect(0, 0, w, h);
  if (hero) {
    c.save();
    c.translate(0, 192);
    polygon(c, [[0, 350], [90, 328], [200, 449], [357, 473], [0, 526]], "#528BD4");
    polygon(c, [[0, 377], [161, 463], [0, 451]], "#3B6CB6");
    polygon(c, [[780, 215], [708, 268], [656, 350], [602, 454], [780, 443]], gradient(c, 610, 400, 780, 250, "#3D6BBD", "#78B1DD"));
    c.fillStyle = "#5089D3";
    c.beginPath();
    c.moveTo(278, 470);
    c.bezierCurveTo(434, 325, 558, 423, 780, 354);
    c.lineTo(780, 555);
    c.lineTo(200, 555);
    c.fill();
    c.fillStyle = gradient(c, 440, 346, 610, 445, "#C3E3F0", "#72A8DC");
    c.beginPath();
    c.moveTo(347, 471);
    c.bezierCurveTo(467, 365, 535, 369, 617, 418);
    c.bezierCurveTo(520, 395, 480, 451, 446, 483);
    c.fill();
    c.fillStyle = "#C3E3F0";
    c.beginPath();
    c.moveTo(597, 439);
    c.bezierCurveTo(621, 344, 714, 312, 750, 329);
    c.bezierCurveTo(789, 350, 760, 383, 740, 371);
    c.bezierCurveTo(766, 337, 671, 358, 597, 439);
    c.fill();
    c.restore();
    paintWordmark(c, 390, 305);
  }
  const y = hero ? 650 : 0;
  c.save();
  c.translate(0, y);
  if (hero) {
    c.translate(-78, 0);
    c.scale(1.2, 1.2);
  }
  polygon(c, [[0, 42], [780, -12], [780, 310], [0, 310]], "#C3E0E7");
  polygon(c, [[0, 42], [440, 11], [620, 108], [230, 310], [0, 211]], "#D9EBEF");
  polygon(c, [[205, 275], [484, 86], [810, 193], [684, 340], [372, 340]], paper);
  c.save();
  c.beginPath();
  c.moveTo(205, 275);
  c.lineTo(484, 86);
  c.lineTo(810, 193);
  c.lineTo(684, 340);
  c.lineTo(372, 340);
  c.closePath();
  c.clip();
  c.strokeStyle = "#D3DEEB";
  c.lineWidth = 1.2;
  for (let yy = 113; yy < 370; yy += 25) {
    c.beginPath();
    c.moveTo(150, yy);
    c.lineTo(810, yy + 70);
    c.stroke();
  }
  c.restore();
  c.save();
  c.translate(666, 8);
  c.transform(1, 0.15, -0.3, 0.85, 0, 0);
  polygon(c, [[0, 0], [145, 0], [156, 157], [0, 157]], "#98B3C5");
  c.fillStyle = paper;
  c.fillRect(0, 0, 145, 148);
  c.fillStyle = "#ADBDCC";
  c.fillRect(12, 12, 120, 22);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
    c.fillStyle = r === 0 && k === 0 ? "#DF9180" : "#93A7B7";
    c.fillRect(12 + k * 31, 44 + r * 24, 24, 17);
  }
  c.restore();
  c.save();
  c.translate(-22, 0);
  c.rotate(0.23);
  c.fillStyle = "#96A1C9";
  c.fillRect(0, 4, 175, 106);
  c.fillStyle = paper;
  c.fillRect(0, 0, 175, 100);
  c.fillStyle = "#C5E1E9";
  c.fillRect(13, 12, 144, 8);
  c.fillStyle = "#D3D1EB";
  c.fillRect(0, 42, 175, 58);
  c.save();
  c.translate(85, 70);
  c.scale(1, 0.53);
  c.fillStyle = "#F4F3F8";
  c.beginPath();
  c.arc(0, 0, 30, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#93ABD6";
  c.beginPath();
  c.arc(0, 0, 19, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.restore();
  if (hero) {
    const cast = selectedWord ? [[selectedWord, 390, 138, 190]] : [["\u98CE", 286, 143, 143], ["\u708E", 494, 138, 185]];
    for (const [word, x, yy, size] of cast) {
      drawWord(c, word, x - size / 2, yy - size / 2, size);
    }
  }
  if (!hero) {
    c.save();
    c.translate(18, 166);
    c.rotate(0.19);
    c.fillStyle = "#578298";
    c.fillRect(0, 4, 345, 32);
    c.fillStyle = "#97C1CF";
    c.fillRect(0, 0, 345, 30);
    c.fillStyle = "#496981";
    for (let i = 0; i < 33; i++) c.fillRect(i * 10 + 8, 0, 2, i % 5 === 0 ? 12 : 6);
    c.restore();
    c.save();
    c.translate(494, 104);
    c.rotate(-0.45);
    c.fillStyle = "#688BB3";
    c.fillRect(0, 0, 122, 9);
    c.fillStyle = "#CFDDE7";
    c.fillRect(105, 0, 17, 9);
    polygon(c, [[0, 0], [0, 9], [-15, 5]], "#7487A0");
    c.restore();
  }
  polygon(c, [[0, 235], [144, 295], [780, 266], [780, 340], [0, 340]], "#3D6FBD");
  polygon(c, [[0, 235], [137, 295], [70, 284], [0, 256]], "#7AB7DE");
  c.restore();
  c.restore();
}
function paintLoadingBackdrop(ctx, W, H, poster) {
  ctx.fillStyle = loadingBackdropColor;
  ctx.fillRect(0, 0, W, H);
  if (poster) {
    const scale = Math.max(W / poster.width, H / poster.height);
    const width = poster.width * scale, height = poster.height * scale;
    ctx.drawImage(poster, (W - width) / 2, (H - height) / 2, width, height);
    const footerTop = Math.min(H * 0.85, H - 110 * Math.min(W / 390, H / 550));
    polygon(ctx, [[0, footerTop], [W, footerTop - H * 0.08], [W, H], [0, H]], loadingBackdropColor);
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + Math.min(W * 0.16, H * 0.12) + "px sans-serif";
    ctx.fillStyle = "#FFD04A";
    ctx.fillText("\u5B57\u7531\u640F\u51FB", W / 2, H * 0.46);
  }
}
function paintLoadingSlip(ctx, value, label) {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#F9ECCE";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(label, 32, -12, 246);
  ctx.textAlign = "right";
  ctx.font = "italic bold 29px sans-serif";
  ctx.fillStyle = "#FFD04A";
  ctx.fillText(value + "%", 358, -12);
  ctx.save();
  ctx.transform(1, 0, -0.25, 1, 0, 0);
  ctx.fillStyle = "#514953";
  ctx.fillRect(32, 0, 326, 8);
  if (value) {
    ctx.fillStyle = "#FFC52D";
    ctx.fillRect(32, 0, 326 * value / 100, 8);
  }
  ctx.restore();
}
var paper, ink, gameTitle, loadingBackdropColor;
var init_menu_scene = __esm({
  "source/src/ui/menu-scene.js"() {
    paper = "#F4F3F8";
    ink = "#2B2A49";
    gameTitle = "\u5B57\u7531\u640F\u51FB";
    loadingBackdropColor = "#26222A";
  }
});

// platform/boot-screen.js
var { paintLoadingBackdrop: paintLoadingBackdrop2, paintLoadingSlip: paintLoadingSlip2, loadingBackdropColor: loadingBackdropColor2 } = (init_menu_scene(), __toCommonJS(menu_scene_exports));
module.exports = async function presentBootFrame(gl) {
  let program = gl.createProgram(), texture = gl.createTexture(), vao = gl.createVertexArray();
  let canvas = wx.createCanvas(), patch = wx.createCanvas(), last = "", textureWidth = 0, textureHeight = 0;
  const { src } = require("./boot-poster"), image = wx.createImage();
  let ready = false;
  image.onload = () => {
    if (canvas) {
      ready = true;
      last = "";
    }
  };
  function loadLocal() {
    image.onerror = null;
    if (!canvas) return;
    try {
      const file = wx.env.USER_DATA_PATH + "/zixing-boot-poster.webp";
      wx.getFileSystemManager().writeFileSync(file, src.slice(src.indexOf(",") + 1), "base64");
      image.src = file;
    } catch (error) {
      console.warn("[\u5B57\u7531\u640F\u51FB] \u52A0\u8F7D\u9875\u5E95\u56FE\u8BFB\u53D6\u5931\u8D25", error);
    }
  }
  image.onerror = loadLocal;
  try {
    image.src = src;
  } catch (e) {
    loadLocal();
  }
  function attach(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  function dispose() {
    if (program) gl.deleteProgram(program);
    if (texture) gl.deleteTexture(texture);
    if (vao) gl.deleteVertexArray(vao);
    program = texture = vao = null;
    if (canvas) {
      canvas.width = canvas.height = 1;
      canvas = null;
    }
    if (patch) {
      patch.width = patch.height = 1;
      patch = null;
    }
  }
  function paint(value, w, h, full) {
    if (full) {
      canvas.width = w;
      canvas.height = h;
    }
    const s = Math.min(w / 390, h / 550), W = w / s, H = h / s, left = (W - 390) / 2, track = H * 0.93 - 8;
    const strip = h / (w / 390) >= 600;
    if (full) {
      const ctx2 = canvas.getContext("2d");
      ctx2.setTransform(s, 0, 0, s, 0, 0);
      paintLoadingBackdrop2(ctx2, W, H, ready ? image : null);
    }
    let y = 0, ctx = canvas.getContext("2d");
    if (strip) {
      y = Math.floor((track - 53) * s);
      const height = Math.ceil((track + 32) * s) - y;
      if (patch.width !== w || patch.height !== height) {
        patch.width = w;
        patch.height = height;
      }
      ctx = patch.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = loadingBackdropColor2;
      ctx.fillRect(0, 0, w, height);
    }
    ctx.setTransform(s, 0, 0, s, left * s, -y);
    ctx.save();
    ctx.translate(0, track);
    paintLoadingSlip2(ctx, value, value === 100 ? "\u51C6\u5907\u5C31\u7EEA" : value >= 95 ? "\u6B63\u5728\u6253\u5F00\u9996\u9875" : value >= 85 ? "\u6B63\u5728\u6574\u7406\u8D44\u6E90" : "\u6B63\u5728\u51C6\u5907\u6E38\u620F\u8D44\u6E90");
    ctx.restore();
    return strip ? y : null;
  }
  try {
    let draw = function(value, overlay = false) {
      if (!program) return;
      value = Math.max(0, Math.min(100, Math.floor(value)));
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, key = w + "x" + h + "@" + value;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.colorMask(true, true, true, true);
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (key !== last) {
        const full = !last || textureWidth !== w || textureHeight !== h || h / (w / 390) < 600;
        const stripY = paint(value, w, h, full);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (textureWidth !== w || textureHeight !== h) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
          textureWidth = w;
          textureHeight = h;
        } else if (full) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        if (stripY !== null) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, stripY, gl.RGBA, gl.UNSIGNED_BYTE, patch);
        last = key;
      }
      gl.uniform1i(percent, value);
      gl.uniform1i(overScene, overlay ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.useProgram(null);
      gl.flush();
    };
    attach(gl.VERTEX_SHADER, `#version 300 es
      out vec2 uv;
      void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=vec2(p.x,1.-p.y);gl_Position=vec4(p*2.-1.,0.,1.);}`);
    attach(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      uniform sampler2D artwork;uniform int percent;uniform bool overScene;
      in vec2 uv;out vec4 color;
      void main(){if(percent<0&&overScene)discard;color=texture(artwork,uv);}`);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || "\u542F\u52A8\u753B\u9762\u7740\u8272\u5668\u672A\u5C31\u7EEA");
    const percent = gl.getUniformLocation(program, "percent"), overScene = gl.getUniformLocation(program, "overScene");
    draw(0);
    await new Promise((resolve) => {
      if (typeof requestAnimationFrame !== "function") {
        setTimeout(resolve, 0);
        return;
      }
      const timer = setTimeout(resolve, 80);
      requestAnimationFrame(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    draw(0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { draw, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
};
