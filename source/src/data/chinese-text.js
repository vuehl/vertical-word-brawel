import {glyphText} from './zixing-identity.js';

let words={};
export function setChineseText(entries){
  words=entries;
  patterns=null;
}
export function chineseText(key,values){
  const text=words[key]||key;
  return glyphText(values?text.replace(/\{(\w+)\}/g,(match,name)=>name in values?String(values[name]):match):text);
}
export function formatChineseNumber(value,digits=0){
  return value.toLocaleString('zh-CN',{maximumFractionDigits:digits,minimumFractionDigits:digits});
}

let patterns = null;
const
  f = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
export function chineseMessage(e) {
  if (!e || words[e]) return chineseText(e);
  patterns ??= Object.entries(words)
    .filter(([e]) => /\{\w+\}/.test(e))
    .map(([e, t]) => {
      let n = [];
      return {
        re: RegExp(
          `^` +
            e
              .split(/\{(\w+)\}/)
              .map((e, t) => (t % 2 ? (n.push(e), `(.+?)`) : f(e)))
              .join(``) +
            `$`,
          `s`,
        ),
        vars: n,
        to: t,
      };
    });
  for (let t of patterns) {
    let n = t.re.exec(e);
    if (n)
      return glyphText(t.to.replace(/\{(\w+)\}/g, (e, r) => {
        let i = t.vars.indexOf(r);
        return i < 0 ? e : n[i + 1];
      }));
  }
  return glyphText(e);
}
