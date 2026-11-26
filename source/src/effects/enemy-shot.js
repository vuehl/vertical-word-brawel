import {WindAtlasBatch} from './wind-vortex.js';
import {VFX_SCALE} from './visual-scale.js';

const tile = 112;
const pivot = 1 - 30 / tile;
// The reference desk framing shows about 31 source pixels per world unit.
const cellSize = tile / (31 * VFX_SCALE);
const maxHits = 128;
const hitDuration = 5 / 25;

export class EnemyShotArt extends WindAtlasBatch {
  constructor(scene, capacity) {
    super(scene, capacity + maxHits, 'assets/vfx/enemy-shot.png', 6, 5, tile, 'enemy-shot');
    this.hits = [];
    this.ready = this.texture.userData.load();
  }

  draw(shots, id) {
    const age = shots.maxLife[id] - shots.life[id];
    const tick = Math.max(0, Math.floor(age * 25 + .0001));
    // The recording ends on contact. Longer flights repeat the developed tail.
    const frame = tick < 24 ? tick : 11 + (tick - 24) % 10;
    this.push(shots.x[id], shots.y[id], shots.z[id], cellSize * shots.size[id] / .9,
      frame, 1, pivot, shots.vx[id], shots.vz[id], shots.vy[id]);
  }

  hit(shots, id) {
    if (this.hits.length >= maxHits) return;
    this.hits.push({x: shots.x[id], y: shots.y[id], z: shots.z[id],
      size: cellSize * shots.size[id] / .9, age: 0});
  }

  update(dt) {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      if ((this.hits[i].age += dt) >= hitDuration) this.hits.splice(i, 1);
    }
  }

  begin() {
    this.clear();
    for (const hit of this.hits) {
      const tick = Math.min(4, Math.floor(hit.age * 25 + .0001));
      this.push(hit.x, hit.y, hit.z, hit.size, 24 + tick, 1);
    }
  }

  reset() {
    this.hits.length = 0;
    this.clear();
  }
}
