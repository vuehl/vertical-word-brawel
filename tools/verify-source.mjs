import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'docs/portrait-changes.json'),'utf8'));
const original=path.resolve(process.argv[2]||provenance.source),copy=path.join(root,'source');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>
  entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normalize=relative=>relative.replaceAll('\\','/');
const changed=[],missing=[];
let identical=0;
for(const file of walk(original)){
  const relative=path.relative(original,file),target=path.join(copy,relative);
  if(!fs.existsSync(target))missing.push(normalize(relative));
  else if(digest(file)!==digest(target))changed.push(normalize(relative));
  else identical++;
}
const added=walk(copy).map(file=>path.relative(copy,file))
  .filter(relative=>!fs.existsSync(path.join(original,relative))).map(normalize);
assert.deepEqual(missing,[],'Original files must not be lost');
assert.deepEqual(changed.sort(),['src/customize.js','src/game.js']);
assert.deepEqual(added.sort(),[
  'public/fonts/swei/README.md',
  'public/fonts/swei/SIL_Open_Font_License_1.1.txt',
  'public/fonts/swei/SweiGothicCJKsc-Bold.ttf',
  'public/fonts/swei/SweiGothicCJKsc-Regular.ttf'
].sort());
assert.equal(digest(path.join(original,'src/game.js')),provenance.originalGameSHA256);
const report={source:original,identical,changed,missing,added,checkedAt:new Date().toISOString()};
fs.mkdirSync(path.join(root,'验收'),{recursive:true});
fs.writeFileSync(path.join(root,'验收/原项目一致性.json'),JSON.stringify(report,null,2));
console.log(report);
