import fs from 'node:fs';
import path from 'node:path';
import {parse} from '../source/tools/vendor/acorn.mjs';

// Check disk paths, including modules only loaded by the developer panel and QA tools.
const root = path.resolve(import.meta.dirname, '..');
const missing = [];
let checked = 0;

function checkReference(file, specifier) {
  if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;
  const target = path.resolve(path.dirname(file), specifier);
  if (!fs.existsSync(target)) missing.push(path.relative(root, file) + ' → ' + specifier);
}

function checkModule(file) {
  const tree = parse(fs.readFileSync(file, 'utf8'), {ecmaVersion: 'latest', sourceType: 'module'});
  const nodes = [tree];
  while (nodes.length) {
    const node = nodes.pop();
    if (node.source?.type === 'Literal') checkReference(file, node.source.value);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) nodes.push(child);
      } else if (value?.type) nodes.push(value);
    }
  }
  checked++;
}

function scan(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'vendor') scan(file);
    } else if (/\.(?:js|mjs)$/.test(entry.name)) checkModule(file);
  }
}

for (const folder of ['source/src', 'source/local', 'source/firebase', 'source/tools', 'platform', 'tools']) {
  scan(path.join(root, folder));
}
checkModule(path.join(root, 'source/server.mjs'));
if (missing.length) throw Error('找不到源码引用的文件\n' + missing.join('\n'));
console.log('已核对 ' + checked + ' 个模块的本地导入路径。');
