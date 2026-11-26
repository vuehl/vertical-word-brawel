import fs from 'node:fs';
import path from 'node:path';
import {parse} from '../../source/tools/vendor/acorn.mjs';

// Comments are not UI labels. Read string values and Unicode object keys so
// escaped Unicode and interpolated template fragments retain their glyphs.
export function literalText(code) {
  const pending = [parse(code, {ecmaVersion:'latest', sourceType:'module'})], text = [];
  while (pending.length) {
    const node = pending.pop();
    if (node.type === 'Literal' && typeof node.value === 'string') text.push(node.value);
    if (node.type === 'TemplateElement') text.push(node.value.cooked ?? node.value.raw);
    // Unquoted Chinese object keys can become labels through Object.keys().
    if (node.type === 'Identifier' && /[^\x00-\x7f]/.test(node.name)) text.push(node.name);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) pending.push(child);
      } else if (value?.type) pending.push(value);
    }
  }
  return text.join('\n');
}

export function sourceFontText(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    if (entry.name === 'vendor' || entry.name === 'node_modules') return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return [sourceFontText(file)];
    if (/\.(?:js|mjs)$/.test(entry.name)) return [literalText(fs.readFileSync(file, 'utf8'))];
    // CSS content labels can also contain visible Chinese characters.
    if (entry.name.endsWith('.css')) return [fs.readFileSync(file, 'utf8')];
    return [];
  }).join('\n');
}
