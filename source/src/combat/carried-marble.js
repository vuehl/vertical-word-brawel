import {I} from '../effects/battle-particles.js';

// Camera-relative placement never changes with movement or automatic aim.
// Use the hero's display position on every render, including frames with no tick.
export function placeCarriedMarble(run, position = run.player.pos) {
  const marble = run.egg;
  if (!marble) return;
  const yaw = run.camYaw || 0, scale = Math.max(1, run.player.renderScale || 1);
  const side = 3 * scale, back = 1.2;
  marble.x = position.x + Math.cos(yaw) * side - Math.sin(yaw) * back;
  marble.y = position.y + 1.3;
  marble.z = position.z - Math.sin(yaw) * side - Math.cos(yaw) * back;
}

export function renderCarriedMarble(run) {
  const batch = run.carriedMarble;
  batch.begin();
  if (run.egg && !run.player.dead && run.state !== 'capturing' && run.state !== 'evolving' && run.state !== 'cinematic') {
    placeCarriedMarble(run, run.visiblePlayerPosition());
    const marble = run.egg;
    // Fixed size/rotation avoids resampling shimmer; retain the supplied artwork.
    batch.push(marble.x, marble.y, marble.z, 1.1, 0xffffff, I.PixEgg, 0, 0);
  }
  batch.end();
}
