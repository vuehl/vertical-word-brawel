// Ordinary steering can run less often while rendering interpolates lodDt.
// Contact range and every special actor retain the original per-frame update.
export function crowdStep(distanceSquared,radius,count,profile){
  const contact=Math.max(6,radius+3);
  if(distanceSquared<contact*contact)return 1;
  if(distanceSquared<196)return count>=360?3:count>=180?2:1;
  return distanceSquared<576?Math.max(profile.enemyMidStep,count>=360?3:1):Math.max(profile.enemyFarStep,count>=360?4:1);
}

// Only decorative crowd steering is sampled. Hit queries remain exhaustive.
export function separationBudget(count,base){
  return count>=360?Math.min(base,24):count>=180?Math.min(base,40):base;
}
