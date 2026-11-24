import manifest from '../../../resources/public/config/combat-audio.json' with {type:'json'};

export const combatClipIds = Object.keys(manifest.files);
export const combatEvolutionSeconds = manifest.evolutionSeconds;

// Native Web Audio implementations can return a promise or use callbacks.
function decode(ctx, bytes) {
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(bytes, resolve, reject)?.then(resolve, reject);
  });
}

export function loadCombatClips(ctx, clips, read, current) {
  return loadAudioClips(ctx, clips, manifest.files, read, current);
}

export async function loadAudioClips(ctx, clips, files, read, current) {
  const missing = Object.keys(files).filter(key => !clips.has(key));
  let next = 0;
  async function worker() {
    while (current() && next < missing.length) {
      const key = missing[next++];
      let timer;
      try {
        const bytes = read(files[key]);
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
