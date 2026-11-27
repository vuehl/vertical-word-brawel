import {I} from '../effects/battle-particles.js';

function initializeFollow(run, marble) {
  if (marble.followAngle != null) return;
  const player = run.player;
  let x = player.vel?.x ?? 0, z = player.vel?.z ?? 0;
  if (x * x + z * z <= .01) {
    x = player.facing?.x ?? 0;
    z = player.facing?.y ?? 1;
  }
  marble.followAngle = marble.followPrevious = marble.followTarget = marble.followShown = Math.atan2(-z, -x);
  marble.followTurn = 1;
}

// Keep the hover clock on the marble, so pauses and slow motion follow gameplay.
export function updateCarriedMarble(run, dt) {
  const marble = run.egg;
  if (!marble) return;
  initializeFollow(run, marble);
  if (run.state === 'play') {
    marble.floatPrevious = marble.floatTime ?? 0;
    marble.floatTime = marble.floatPrevious + dt;
    const x = run.player.vel?.x ?? 0, z = run.player.vel?.z ?? 0;
    // Follow actual walking, never auto-aim. On stopping, finish the current
    // turn and retain that trailing direction instead of orbiting at idle.
    if (x * x + z * z > .01) marble.followTarget = Math.atan2(-z, -x);
    marble.followPrevious = marble.followAngle;
    const difference = marble.followTarget - marble.followAngle;
    let delta = Math.atan2(Math.sin(difference), Math.cos(difference));
    if (Math.abs(Math.abs(delta) - Math.PI) < .0001) delta = Math.PI * marble.followTurn;
    if (Math.abs(delta) > .0001) marble.followTurn = Math.sign(delta);
    // Turn along a circle, with a capped angular speed so even a 180-degree
    // reversal visibly swings around the hero rather than cutting through it.
    marble.followAngle += Math.max(-8 * dt, Math.min(8 * dt, delta * (1 - Math.exp(-10 * dt))));
  }
  placeCarriedMarble(run);
}

// Translate with the hero immediately; only the trailing angle eases on turns.
export function placeCarriedMarble(run, position = run.player.pos, time = run.egg?.floatTime ?? 0, angle) {
  const marble = run.egg;
  if (!marble) return;
  initializeFollow(run, marble);
  angle ??= marble.followAngle;
  const radius = 3 * Math.max(1, run.player.renderScale || 1);
  marble.x = position.x + Math.cos(angle) * radius;
  // A full rise/fall spans more than the marble's diameter. Keep even the
  // lowest point airborne, with a relaxed ~1.75 second hover cycle.
  marble.y = position.y + 1.9 + Math.sin(time * 3.6) * 0.7;
  marble.z = position.z + Math.sin(angle) * radius;
}

export function renderCarriedMarble(run) {
  const batch = run.carriedMarble;
  batch.begin();
  if (run.egg && !run.player.dead && run.state !== 'capturing' && run.state !== 'evolving' && run.state !== 'cinematic') {
    const marble = run.egg;
    initializeFollow(run, marble);
    if (run.state === 'play') {
      const current = marble.floatTime ?? 0, previous = marble.floatPrevious ?? current;
      const alpha = Math.max(0, Math.min(1, run.renderAlpha ?? 1));
      // The same interpolation as the hero keeps hovering smooth even on
      // 60/120 Hz display frames that do not advance the 30 Hz simulation.
      // An upgrade hold can freeze simulation while renderAlpha still cycles.
      marble.floatShown = Math.max(marble.floatShown ?? 0, previous + (current - previous) * alpha);
      const progress = current > previous ? Math.max(0, Math.min(1, (marble.floatShown - previous) / (current - previous))) : 1;
      // Interpolate the unwrapped angle, keeping full clearance through turns.
      marble.followShown = marble.followPrevious + (marble.followAngle - marble.followPrevious) * progress;
    }
    placeCarriedMarble(run, run.visiblePlayerPosition(), marble.floatShown ?? marble.floatTime ?? 0, marble.followShown);
    // Fixed size/rotation avoids resampling shimmer; retain the supplied artwork.
    batch.push(marble.x, marble.y, marble.z, 1.1, 0xffffff, I.PixEgg, 0, 0);
    // Ground contact makes the air gap readable. Reuse the existing shadow
    // batch: one small instance, no new material, texture or draw call.
    const terrain = run.terrain;
    const ground = Math.max(terrain.surface(marble.x, marble.z),
      terrain.propTop(marble.x, marble.z, .35, marble.y - .55),
      terrain.workshopGroundY?.(marble.x, marble.z) ?? -Infinity);
    const height = Math.max(0, marble.y - ground);
    run.sprites.shadows.push(marble.x, ground, marble.z, Math.max(.35, .95 / (1 + height * .15)));
  }
  batch.end();
}
