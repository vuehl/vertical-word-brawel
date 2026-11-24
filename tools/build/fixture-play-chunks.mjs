import fs from 'node:fs';
import path from 'node:path';

// Model the native package's private CommonJS module cache in browser tests.
// Each package gets its own script and can only resolve files in that directory.
export function fixtureSubpackage(game,entry){
  if(path.basename(entry)!=='game.js')return fs.readFileSync(path.join(game,entry),'utf8');
  const directory=path.dirname(path.join(game,entry));
  const definitions=fs.readdirSync(directory,{recursive:true}).filter(file=>file.endsWith('.js')).map(file=>{
    const key=JSON.stringify(file.split(path.sep).join('/'));
    return 'defs['+key+']=function(require,module,exports){\n'+fs.readFileSync(path.join(directory,file),'utf8')+'\n};';
  });
  return '(function(){const defs=Object.create(null),cache=Object.create(null);\n'+definitions.join('\n')+`
function load(file){
  if(!defs[file])throw Error('Missing subpackage module: '+file);
  if(cache[file])return cache[file].exports;
  const item=cache[file]={exports:{}};
  defs[file](specifier=>{
    if(!specifier.startsWith('.'))throw Error('Expected a relative subpackage import: '+specifier);
    const parts=file.split('/');parts.pop();
    for(const part of specifier.split('/')){
      if(part==='../..'){if(!parts.length)throw Error('Import escapes subpackage: '+specifier);parts.pop();}
      else if(part!=='.')parts.push(part);
    }
    const key=parts.join('/');return load(key.endsWith('.js')?key:key+'.js');
  },item,item.exports);
  return item.exports;
}
load(`+JSON.stringify(path.basename(entry))+');})();';
}
