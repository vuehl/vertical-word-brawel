
function stackedItemModifier(mod, count) {
  if (count === 1) return mod;
  return {
    stat: mod.stat,
    add: mod.add == null ? undefined : mod.add * count,
    mul: mod.mul == null ? undefined : mod.mul < 1 ? mod.mul ** count : 1 + (mod.mul - 1) * count,
  };
}
function rv(e, t) {
  let n = t.length && Array.isArray(t[0]) ? t : [t];
  for (let t of n) for (let n of t) n.add && (e[n.stat] += n.add);
  for (let t of n) {
    let n = {};
    for (let r of t) r.mul != null && (r.mul < 1 ? (e[r.stat] *= r.mul) : (n[r.stat] = (n[r.stat] ?? 0) + r.mul - 1));
    for (let [t, r] of Object.entries(n)) e[t] *= 1 + r;
  }
}

export {
  stackedItemModifier,
  rv as applyItemModifiers
};
