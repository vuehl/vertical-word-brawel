/*! Diamond wipe adapted from patch-gg/pixelfx, src/fx/transitions/diamond-wipe.js.
 * MIT, Copyright (c) 2026 Patch and Hugo Duprez. See vendor/pixelfx-blink-in.js. */
import {clamp, clearFrame, composite, createFrame, ease, fit, painterFor, Rng, WHITE} from '../vendor/pixelfx-blink-in.js';

const size = 72, spacing = 16, fps = 24, frames = 2 * fps, columns = 8;
const diamonds = [];
const rng = new Rng(1);
for (let row = -1; row <= size / (spacing / 2) + 1; row++) {
  for (let column = -1; column <= Math.ceil(size / spacing) + 1; column++) {
    const x = column * spacing + (row & 1) * spacing / 2, y = row * spacing / 2;
    const wave = (x + 0.45 * y) / (size * 1.45);
    const jitter = rng.next();
    diamonds.push({x, y, enter: 0.04 + 0.62 * clamp(wave + (jitter - 0.5) * 0.08),
      leave: 1.05 + 0.51 * clamp(wave + (rng.next() - 0.5) * 0.08), glints: jitter < 0.3, spin: rng.next() * 3});
  }
}

function smooth(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}

function glint(p, x, y, life, angle, colors) {
  const reach = 4.4 * Math.sin(Math.PI * life) ** 0.7;
  for (let ray = 0; ray < 8; ray++) {
    const direction = angle + ray * Math.PI / 4, length = reach * (ray % 2 ? 0.42 : 1);
    for (let d = 0; d < length; d += 0.6) {
      p.dot(x + d * Math.cos(direction), y + d * Math.sin(direction), d < length * 0.3 ? WHITE : colors[6]);
    }
  }
  p.glow(x, y, 1 + reach, colors[5], 0.34);
}

function paintFrame(frame, time, colors, ink) {
  const p = painterFor(clearFrame(frame));
  const faces = [colors[3], colors[2], colors[2], colors[1]], glints = [];
  for (const diamond of diamonds) {
    const {x, y, enter, leave} = diamond;
    const opening = (time - enter) / 0.24, closing = (time - leave) / 0.24;
    if (diamond.glints && closing > 0.7 && closing < 1.5) glints.push([diamond, (closing - 0.7) / 0.8, 0]);
    if (opening <= 0 || closing >= 1) continue;
    const half = (spacing / 2 + 0.5) * (closing > 0 ? 1 - ease.inBack(closing, 2) : ease.outBack(Math.min(1, opening), 2.2));
    const heat = closing > 0 ? smooth(closing / 0.35) : 1 - smooth((opening - 0.45) / 0.8);
    for (let py = Math.max(0, Math.floor(y - half)); py < Math.min(size, y + half); py++) {
      const dy = py + 0.5 - y, width = half - Math.abs(dy);
      const left = Math.max(0, Math.ceil(x - width - 0.5)), right = Math.min(size - 1, Math.floor(x + width - 0.5));
      for (let px = left; px <= right; px++) {
        const dx = px + 0.5 - x, edge = width - Math.abs(dx);
        const face = (dy < 0 ? 0 : 2) + (dx < 0 ? 0 : 1);
        let color = ink;
        if (heat > 0.15) {
          color = faces[face];
          if (edge < 0.9) color = face === 0 && heat > 0.5 ? WHITE : colors[6 - face];
          else if (edge < 1.6 && face === 0 && heat > 0.4) color = colors[5];
          else if ((dx === -0.5 || dy === -0.5) && heat > 0.3) {
            const sheen = Math.abs(((px + py - time * 130) % 45 + 45) % 45 - 22.5) < 1.5;
            color = sheen || (dx === -0.5 && dy < -half + 2) ? WHITE : colors[dx < 0 && dy < 0 ? 6 : 4];
          }
        }
        p.px(px, py, color);
      }
    }
    if (heat > 0) p.glow(x, y, half + 3, colors[4], 0.22 * heat);
    if (diamond.glints && opening > 0.6 && opening < 1.8) glints.push([diamond, (opening - 0.6) / 1.2, half]);
  }
  for (const [diamond, life, offset] of glints) glint(p, diamond.x, diamond.y - offset, life, diamond.spin + life * 1.5, colors);
}

// Only the current element's atlas is kept. Bake each sampled frame on first use.
let cache;
export function drawReadyDiamonds(ctx, palette, frameIndex) {
  if (!cache || cache.palette !== palette) {
    const atlas = document.createElement('canvas');
    atlas.width = size * columns;
    atlas.height = size * Math.ceil(frames / columns);
    const painter = atlas.getContext('2d');
    const ink = fit(['#' + palette.base.toString(16).padStart(6, '0')], 1)[0];
    cache = {palette, ink, atlas, painter, image: painter.createImageData(size, size), frame: createFrame(size, size), baked: new Uint8Array(frames)};
  }
  const x = frameIndex % columns * size, y = Math.floor(frameIndex / columns) * size;
  if (!cache.baked[frameIndex]) {
    paintFrame(cache.frame, frameIndex / fps, palette.ramp, cache.ink);
    composite(cache.frame, cache.image.data);
    cache.painter.putImageData(cache.image, x, y);
    cache.baked[frameIndex] = 1;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(42, 42, 34.7, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.62;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cache.atlas, x, y, size, size, 7, 7, 70, 70);
  ctx.restore();
}

export function readyDiamondFrame(elapsed) {
  return Math.floor(Math.max(0, elapsed) * fps) % frames;
}
