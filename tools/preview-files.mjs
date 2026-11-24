import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Track the actual build output, including every gameplay chunk and asset pack.
export function buildHashes(project){
  const root=path.join(project,'minigame');
  function visit(directory){
    return fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>{
      const name=path.posix.join(directory,entry.name);
      return entry.isDirectory()?visit(name):[name];
    });
  }
  return Object.fromEntries(visit('').sort().map(name=>
    [name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
}
