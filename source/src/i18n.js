import {glyphText} from './zixing-identity.js';
var e = [
    { id: `zh`, name: `简体中文`, locale: `zh-CN`, short: `ZH` },
  ],
  t = (t) => typeof t == `string` && e.some((e) => e.id === t),
  n = `pokebonk.lang`,
  r = `zh`,
  i = {},
  a = () => r,
  o = () => e.find((e) => e.id === r).locale;
function s() {
  return `zh`;
}
function c() {
  try {
    let e = localStorage.getItem(n);
    return t(e) ? e : null;
  } catch {
    return null;
  }
}
function l(e, t) {
  ((r = `zh`), (i = t), (d = null));
}
function u(e, t) {
  let n = i[e] || e;
  return glyphText(t ? n.replace(/\{(\w+)\}/g, (e, n) => (n in t ? String(t[n]) : e)) : n);
}
var d = null,
  f = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
function p(e) {
  if (!e || i[e]) return u(e);
  d ??= Object.entries(i)
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
  for (let t of d) {
    let n = t.re.exec(e);
    if (n)
      return glyphText(t.to.replace(/\{(\w+)\}/g, (e, r) => {
        let i = t.vars.indexOf(r);
        return i < 0 ? e : n[i + 1];
      }));
  }
  return glyphText(e);
}
var m = (e, t = 0) => e.toLocaleString(o(), { maximumFractionDigits: t, minimumFractionDigits: t });
export { t as a, c, p as d, m as i, l, n, a as o, s as r, o as s, e as t, u };
