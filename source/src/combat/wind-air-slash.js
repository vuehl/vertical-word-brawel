import {waveCrosses, waveDepth, waveHalfWidth} from '../effects/air-slash-shape.js';

export function castWindAirSlash(run, radius, duration, damage, hitOptions) {
  const player = run.player, enemies = run.enemies;
  const range = radius * 2.8;
  const aim = run.aimDir(range);
  const length = Math.hypot(aim.x, aim.z);
  const dx = length ? aim.x / length : -Math.sin(run.camYaw);
  const dz = length ? aim.z / length : -Math.cos(run.camYaw);
  const scale = player.renderScale || 1;
  const startX = player.pos.x + dx * scale, startZ = player.pos.z + dz * scale;
  const wave = {
    x: startX, y: player.pos.y + .95 * scale, z: startZ, dx, dz, radius,
    look: run.skinLook, front: 0, done: false,
  };
  if (run.vfx.crafted.allowed()) run.vfx.crafted.windMoveArt().play(wave);
  const struck = new Map();
  run.animate(duration, progress => {
    const previous = wave.front * range;
    const next = progress * range;
    wave.front = progress;
    wave.x = startX + dx * next;
    wave.z = startZ + dz * next;
    wave.y = run.terrain.surface(wave.x, wave.z) + .95 * scale;

    const middle = (previous + next - radius * waveDepth) / 2;
    const reach = Math.hypot(radius * waveHalfWidth, (next - previous + radius * waveDepth) / 2);
    for (const id of enemies.within(startX + dx * middle, startZ + dz * middle, reach)) {
      if (struck.get(id) === enemies.gen[id]) continue;
      const x = enemies.x[id] - startX, z = enemies.z[id] - startZ;
      const side = (dx * z - dz * x) / radius;
      const forward = dx * x + dz * z;
      if (!waveCrosses(side, (forward - next) / radius, (forward - previous) / radius, enemies.radius[id] / radius)) continue;
      struck.set(id, enemies.gen[id]);
      run.combat.hit(id, damage, {...hitOptions, dirX: dx, dirZ: dz, knock: 1});
    }
  }, () => { wave.done = true; });
}
