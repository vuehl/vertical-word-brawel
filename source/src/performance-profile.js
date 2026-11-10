// Visual budgets and update cadence. Damage, rewards and spawn tables stay independent.
export const performanceProfiles=Object.freeze({
  low:Object.freeze({name:'流畅',pixelBudget:360000,maxPixelRatio:1,dynamicResolution:true,bloom:false,outline:false,
    particleDensity:.3,particles:320,normalParticles:180,damageTexts:24,particleCell:5,groundArea:320,groundParticles:64,enemyShadowCell:3,ambient:false,
    worldShadows:false,pickupSimple:true,mergeXp:100,mergeCoins:60,mergeInterval:.8,
    enemyMidStep:3,enemyFarStep:6,enemySeparation:64,hudInterval:100,mapInterval:180}),
  medium:Object.freeze({name:'均衡',pixelBudget:900000,maxPixelRatio:1.5,dynamicResolution:true,bloom:false,outline:false,
    particleDensity:.5,particles:800,normalParticles:440,damageTexts:60,particleCell:10,groundArea:800,groundParticles:160,enemyShadowCell:2,ambient:false,
    worldShadows:true,pickupSimple:true,mergeXp:160,mergeCoins:80,mergeInterval:1,
    enemyMidStep:2,enemyFarStep:4,enemySeparation:96,hudInterval:80,mapInterval:150}),
  high:Object.freeze({name:'精致',pixelBudget:1800000,maxPixelRatio:2,dynamicResolution:false,bloom:true,outline:true,
    particleDensity:1,particles:3000,normalParticles:1800,damageTexts:160,particleCell:24,groundArea:1600,groundParticles:320,enemyShadowCell:0,ambient:true,
    worldShadows:true,pickupSimple:false,mergeXp:240,mergeCoins:100,mergeInterval:1.2,
    enemyMidStep:2,enemyFarStep:3,enemySeparation:128,hudInterval:80,mapInterval:120}),
});
export const batterySaverEnabled=value=>value===true||value==='true'||value===1;
export function performanceProfile(settings={}){
  if(batterySaverEnabled(settings.batterySaver))return performanceProfiles.low;
  return performanceProfiles[settings.quality]||performanceProfiles.low;
}
