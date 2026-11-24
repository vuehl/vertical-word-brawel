import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

// Rebuild every wind atlas from the same directory so a partial update cannot
// reintroduce frames from the retired wind skills.
const directory=process.argv[2]||process.env.WIND_REFERENCE_DIR||path.join(os.homedir(),'Desktop','fff','fff');
for(const [script,input] of [
  ['build-wind-move-atlas.mjs',directory],
  ['build-wind-skill-atlas.mjs',directory],
  ['build-wind-ace-atlas.mjs',path.join(directory,'燕返.gif')],
  ['build-wind-ring.mjs',path.join(directory,'环形扩散.讽.gif')],
  ['build-wind-vortex-atlas.mjs',path.join(directory,'大招','一阵风刮来.gif')]
]){
  execFileSync(process.execPath,[path.join(import.meta.dirname,script),input],{stdio:'inherit',windowsHide:true});
}
