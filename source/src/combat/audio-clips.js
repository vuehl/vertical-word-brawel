import manifest from '../../../resources/public/config/combat-audio.json' with {type:'json'};

export const combatClipIds = Object.keys(manifest.files);
export const combatEvolutionSeconds = manifest.evolutionSeconds;

// Native Web Audio implementations can return a promise or use callbacks.
function decode(ctx, bytes) {
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(bytes, resolve, reject)?.then(resolve, reject);
  });
}

export async function loadCombatClips(ctx, clips, read, current) {
  const missing = combatClipIds.filter(key => !clips.has(key));
  let next = 0;
  async function worker() {
    while (current() && next < missing.length) {
      const key = missing[next++];
      let timer;
      try {
        const bytes = read(manifest.files[key]);
        const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(Error(key)), 5000); });
        const buffer = await Promise.race([bytes.then(data => current() && decode(ctx, data)), timeout]);
        if (current() && buffer?.duration > 0) clips.set(key, buffer);
      } catch {
        // This event can use its synth recipe. Other files can still finish.
      } finally { clearTimeout(timer); }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
}
