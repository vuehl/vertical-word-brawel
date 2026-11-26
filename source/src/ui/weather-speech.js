import {glyphBillboardSize} from '../actors/hero-actions.js';
import {glyphWordForSpecies} from '../actors/paper-glyph-art.js';

// Each weather event owns one line. Only glyphs submitted by the renderer
// participate, so a culled, loading or dying monster cannot speak.
export class WeatherSpeech {
  speaker = -1;
  generation = -1;
  nextSearch;
  expires = Infinity;
  bubble = null;
  tip = -1;

  constructor(run, kind) {
    this.run = run;
    this.kind = kind;
    this.nextSearch = run.time + .6;
  }

  beginFrame() {
    const {time, state} = this.run;
    this.candidate = -1;
    this.count = 0;
    if (state !== 'play' || time < this.nextSearch) return false;
    if (this.speaker < 0) this.nextSearch = time + .35;
    return time < this.expires;
  }

  observe(id, x, y, z, batch) {
    const {enemies, ui, r} = this.run;
    if (this.speaker >= 0 && (id !== this.speaker || enemies.gen[id] !== this.generation)) return;
    if (this.speaker < 0 && this.kind === 'blizzard' && this.run.coop?.monsters) {
      // In a shared room movement is authoritative. Pick a monster already
      // approaching this player according to its latest network positions.
      const pose = this.run.coop.monsters.poses.get(id), p = this.run.player.pos;
      if (pose?.localGen !== enemies.gen[id] ||
          (pose.x-pose.fromX)*(p.x-x)+(pose.z-pose.fromZ)*(p.z-z) <= 0) return;
    }
    const feet = ui.project(this.run, x, y, z);
    if (!feet.vis || feet.x < 8 || feet.x > innerWidth - 8 || feet.y > innerHeight - 4) return;
    // The glyph leans towards the camera. Follow its billboard top even as a
    // waterspout lifts it, using the same size and squash as the sprite.
    const up = r.camera.matrixWorld.elements, lean = batch.material.uniforms.uLean.value;
    const dx = up[4]*lean, dy = 1-lean+up[5]*lean, dz = up[6]*lean;
    const size = glyphBillboardSize(batch.bodyHeight()) * enemies.scale[id] * (1-.3*enemies.squash[id]);
    const height = size / Math.hypot(dx, dy, dz);
    const head = ui.project(this.run, x+dx*height, y+dy*height, z+dz*height);
    if (!head.vis || head.y < 60 || head.x < 15 || head.x > innerWidth - 15) return;
    if (this.speaker < 0 && Math.random() * ++this.count >= 1) return;
    this.candidate = id;
    this.x = Math.round(head.x);
    this.y = Math.round(head.y)-2;
  }

  endFrame() {
    const {enemies, time, ui, player} = this.run;
    if (this.candidate < 0) {
      if (this.bubble) this.bubble.style.display = 'none';
      return;
    }
    if (this.speaker < 0) {
      this.speaker = this.candidate;
      this.generation = enemies.gen[this.speaker];
      this.expires = time + 4;
      this.nextSearch = time;
    }
    if (!this.bubble || (this.kind === 'blizzard' && this.form !== player.speciesId)) {
      this.form = player.speciesId;
      this.lines = this.kind === 'blizzard'
        ? ['好冷啊，', '你们都去找'+glyphWordForSpecies(this.form)+'取暖嘛？']
        : ['这风是从海里拧上来的？'];
      this.width = 20 + 14 * Math.max(...this.lines.map(line => line.length));
      this.height = 19 + 18 * this.lines.length;
      const canvas = this.bubble ??= document.createElement('canvas');
      canvas.className = 'weather-speech';
      canvas.setAttribute('aria-label', this.lines.join(''));
      canvas.width = this.width*2;
      canvas.height = this.height*2;
      canvas.style.cssText = 'position:absolute;pointer-events:none;width:'+this.width+'px;height:'+this.height+'px';
      if (!canvas.parentNode) (ui.popupRoot || ui.hudEl).append(canvas);
      this.tip = -1;
    }
    const left = Math.max(4, Math.min(innerWidth-this.width-4, Math.round(this.x-this.width/2)));
    const tip = this.x-left;
    if (tip !== this.tip) this.paint(tip);
    this.bubble.style.left = left+'px';
    this.bubble.style.top = this.y-this.height+'px';
    this.bubble.style.display = '';
  }

  paint(tip) {
    const ctx = this.bubble.getContext('2d'), w = this.width, h = this.height-7;
    ctx.setTransform(2,0,0,2,0,0);
    ctx.clearRect(0,0,w,this.height);
    ctx.beginPath();
    ctx.moveTo(8,1); ctx.lineTo(w-8,1); ctx.quadraticCurveTo(w-1,1,w-1,8);
    ctx.lineTo(w-1,h-7); ctx.quadraticCurveTo(w-1,h,w-8,h);
    ctx.lineTo(tip+5,h); ctx.lineTo(tip,h+6); ctx.lineTo(tip-4,h);
    ctx.lineTo(8,h); ctx.quadraticCurveTo(1,h,1,h-7);
    ctx.lineTo(1,8); ctx.quadraticCurveTo(1,1,8,1); ctx.closePath();
    ctx.fillStyle = 'rgba(249,252,254,.80)'; ctx.fill();
    ctx.strokeStyle = 'rgba(49,69,83,.78)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.font = 'bold 14px "Ziling Swei", sans-serif';
    ctx.fillStyle = '#233746'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.lines.forEach((line,i) => ctx.fillText(line,w/2,16+i*18));
    this.tip = tip;
    this.bubble.dataset.frame = String(tip);
  }

  dispose() { this.bubble?.remove(); }
}
