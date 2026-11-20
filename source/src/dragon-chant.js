import {dragonChantAtlas, sprites} from './dragon-chant-atlas.js';
export {prepareDragonChant} from './dragon-chant-atlas.js';

const words = '万字归一', beat = .38;
export const dragonChantSeconds = beat * 3 + .68;
const limit = t => Math.max(0, Math.min(t, 1));
function smooth(t) { t = limit(t); return t * t * (3 - 2 * t); }

// time, horizontal offset, horizontal scale, vertical scale, opacity.
const plate = [[0,-480,.90,1,1],[.17,11,1.035,1,1],[.27,-3,.991,1,1],[.35,0,1,1,1]];
const letters = [83,72,66,88].map(d => [
  [0,-d,.73,1,0],[.04,-d*.54,.86,1,.78],[.11,7,1.085,1,1],[.18,-2,.976,1,1],[.25,0,1,1,1],
]);
const pivots = [[54,508],[147,512],[238,520],[324,527]];
const chips = [-.24,.19,-.16,.20].map(k => {
  const d = k * 90;
  return [[0,d,.34,.85,0],[.055,d*.45,.79,.94,1],[.12,-d*.18,1.15,1.04,1],[.185,d*.04,.965,.99,1],[.24,0,1,1,1]];
});
const chipDelays = [.25,.34,.44,.54];
const streaks = [[254,599,197,3.2,0,0],[160,602,99,1.7,1,.045],[99,593,101,2,2,.08],[364,610,98,2.8,1,.115],[304,617,66,1.35,2,.135]];
const themes = {
  manual: {shade:'22,16,47', lines:['#235ef7','#2cdaf9','#6f63fc']},
  auto: {shade:'42,16,34', lines:['#d01f36','#ff8056','#f94874']},
};

function motion(time, keys) {
  if (time < 0) return null;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (time >= b[0]) continue;
    const t = limit((time - a[0]) / (b[0] - a[0]));
    const u = i === 1 ? 1 - (1 - t) ** 2 : smooth(t);
    return a.slice(1).map((value, j) => value + (b[j + 1] - value) * u);
  }
  return keys[keys.length - 1].slice(1);
}

function speedLines(ctx, time, colours) {
  for (const [tip,y,length,width,ink,lag] of streaks) {
    const u = limit((time - .055 - lag) / .17);
    if (!u) continue;
    const arrival = 1 - (1 - u) ** 3;
    const reach = length * arrival * (1 + .34 * (1 - smooth((time - .27 - lag) / .30)));
    const x = tip - 143 * (1 - arrival);
    ctx.fillStyle = colours[ink];
    ctx.globalAlpha = arrival * (ink === 1 ? 235 : 203) / 255;
    ctx.beginPath();
    ctx.moveTo(x - reach, y - reach * .082);
    ctx.lineTo(x - reach * .3, y - reach * .3 * .082 - width * .47);
    ctx.lineTo(x + 3, y - width * .2);
    ctx.lineTo(x - reach * .13, y - reach * .13 * .082 + width * .65);
    ctx.fill();
  }
}

export function startDragonChant(ui, onBeat, mode = 'manual') {
  const theme = themes[mode], atlas = dragonChantAtlas(mode);
  const canvas = document.createElement('canvas');
  canvas.className = 'zx-dragon-chant';
  canvas.dataset.uiRegion = 'game-screen';
  canvas.dataset.summonMode = mode;
  canvas.setAttribute('aria-label', words);
  Object.assign(canvas.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100vh',objectFit:'cover',opacity:'1',zIndex:'100',pointerEvents:'none'});
  const screen = document.getElementById('game').getBoundingClientRect();
  const width = canvas.width = Math.min(640, Math.max(320, screen.width));
  const height = canvas.height = Math.round(width * screen.height / screen.width);
  const ctx = canvas.getContext('2d');
  const scale = Math.min(width / 488, height / 645);
  ctx.save();
  ctx.translate(width * .45, height * .48);
  ctx.scale(width * .86, height * .65);
  const shade = ctx.createRadialGradient(0,0,0,0,0,1);
  shade.addColorStop(0,'rgba(' + theme.shade + ',.35)');
  shade.addColorStop(1,'rgba(' + theme.shade + ',.61)');
  // Paint this gradient in the same transformed coordinate system each frame.
  ctx.restore();
  const chrome = Array.from(ui.root.querySelectorAll('.zx-hud, .tc')).filter(node => !node.hidden);
  for (const node of chrome) node.hidden = true;
  ui.hudEl.classList.add('cinematic');
  ui.hudEl.append(canvas);
  let lastBeat = -1, lastFrame = -1;

  function sprite(index, pose, pivot) {
    if (!pose || pose[3] <= .001) return;
    const [sx,sy,x,y,w,h] = sprites[index];
    const [dx,kx,ky,opacity] = pose;
    const px = pivot ? pivot[0] : x + w / 2, py = pivot ? pivot[1] : y + h / 2;
    ctx.globalAlpha = opacity;
    ctx.drawImage(atlas,sx,sy,w,h,Math.round(px+(x-px)*kx+dx),Math.round(py+(y-py)*ky),Math.round(w*kx),Math.round(h*ky));
  }

  function draw(seconds) {
    const index = Math.min(3, Math.floor(seconds / beat));
    if (index !== lastBeat) {
      lastBeat = index; canvas.dataset.word = words[index]; onBeat(index);
    }
    const frame = Math.floor((seconds >= .8 && seconds < 1.6 ? .8 : seconds) * 50 + 1e-7);
    if (frame === lastFrame) return;
    lastFrame = frame;
    ctx.clearRect(0,0,width,height);
    const fade = (1 - (1 - limit((seconds + .01) / .15)) ** 3) * (1 - smooth((seconds - 1.62) / .14));
    if (fade > 0) {
      ctx.save();
      ctx.translate(width * .45, height * .48);
      ctx.scale(width * .86, height * .65);
      ctx.globalAlpha = fade;
      ctx.fillStyle = shade; ctx.fillRect(-1,-1,2,2);
      ctx.restore();
    }
    if (seconds < 1.76) {
      ctx.save();
      ctx.translate((width - 488 * scale) / 2, (height - 1055 * scale) / 2);
      ctx.scale(scale,scale);
      ctx.translate(Math.round(-498 * smooth((seconds - 1.60) / .16)),0);
      speedLines(ctx,seconds,theme.lines);
      for (let i = 0; i < 4; i++) sprite(9+i,motion(seconds-chipDelays[i],chips[i]));
      sprite(0,motion(seconds,plate),[129,507]);
      const poses = letters.map((keys,i) => motion((seconds - (.10 + i*.05))*2,keys));
      if (seconds < .375) for (let i = 3; i >= 0; i--) sprite(5+i,poses[i],pivots[i]);
      for (let i = 3; i >= 0; i--) sprite(1+i,poses[i],pivots[i]);
      ctx.restore();
    }
    window.invalidateUI?.();
  }
  draw(0);
  return {draw,clearWords:() => canvas.remove(),end() {
    canvas.remove();
    for (const node of chrome) node.hidden = false;
  }};
}
