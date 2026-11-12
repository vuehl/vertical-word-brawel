import {glyphWordForSpecies} from './paper-glyph-art.js';

const aliases=new Map([['宝可梦','字灵'],['神奇宝贝','字灵'],['口袋妖怪','字灵'],['pokémon','字灵'],['pokemon','字灵']]);
const cache=new Map();
let pattern=/宝可梦|神奇宝贝|口袋妖怪|pokémon|pokemon/gi;
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Change display identities only. Numeric species IDs, saves and combat data
// continue to refer to the same actor, whose cutout uses this same glyph map.
export function configureGlyphNames(species){
  for(const actor of species){
    const word=glyphWordForSpecies(actor.id);
    for(const name of [actor.name,actor.originalName])if(name&&name!==word)aliases.set(name.toLowerCase(),word);
  }
  pattern=new RegExp([...aliases.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'gi');
  cache.clear();
}

export function glyphText(text){
  if(typeof text!=='string'||!text)return text;
  if(cache.has(text))return cache.get(text);
  const result=text.replace(pattern,name=>aliases.get(name.toLowerCase())||name);
  if(cache.size>=1024)cache.clear();
  cache.set(text,result);return result;
}

export function glyphSpeciesFromImage(src){
  const match=/(?:^|\/)\b(?:portraits(?:-shiny)?|icons|front|pmd(?:-shiny)?)\/(\d+)\.png(?:[?#]|$)/i.exec(String(src||''));
  return match?Number(match[1]):null;
}
