// A plan belongs to the deployed character, including after it evolves.
export function runPlan(run) {
  return run.meta?.profile?.collection?.plans?.[run.startSpecies];
}

export function planIncludes(plan, group, key) {
  return Array.isArray(plan?.[group]) && plan[group].includes(key);
}

export function plannedUpgrade(plan, offer) {
  if (offer.vit) return planIncludes(plan, 'vitamins', offer.key);
  return planIncludes(plan, 'moves', offer.key) || planIncludes(plan, 'fusions', offer.key);
}
