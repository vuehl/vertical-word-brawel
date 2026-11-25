import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

// Run the production synth in an isolated Web Audio context for tests and asset generation.
const audioModule = fileURLToPath(new URL('../../source/src/combat/game-audio.js', import.meta.url));
const bundle = await build({entryPoints:[audioModule], bundle:true, write:false, format:'iife', globalName:'audioExports'});
export const createAudioSource = bundle.outputFiles[0].text + '\nnew audioExports.GameAudio()';
