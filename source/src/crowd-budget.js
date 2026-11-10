export const crowdBudgets=Object.freeze({low:{max:180,min:60},medium:{max:280,min:90},high:{max:420,min:120}});

// Use actual frame timestamps; clamped simulation dt hides severe stalls.
export function updateCrowdBudget(run,now,hidden=false){
  if(run.performance?.lockVisualQuality||run.coop||run.state!=='play'||run.timeScale!==1||hidden){run.crowdSample=null;return;}
  const sample=run.crowdSample??= {start:now,last:now,frames:0,good:0};
  if(now-sample.last>1500){sample.start=now;sample.frames=0;sample.good=0;}
  sample.last=now;sample.frames++;
  const elapsed=now-sample.start;if(elapsed<2000)return;
  const fps=(sample.frames-1)*1000/elapsed,target=run.fpsCap||60;
  run.crowdFps=fps;sample.start=now;sample.frames=1;
  if(fps<target*.72&&run.enemies.count>=40){
    run.liveCap=Math.max(run.liveMin,Math.floor(Math.min(run.liveCap*.8,run.enemies.count*.85)/10)*10);sample.good=0;
  }else if(fps>=target*.92&&run.liveCap<run.liveMax){
    if(++sample.good>=5){run.liveCap=Math.min(run.liveMax,run.liveCap+20);sample.good=0;}
  }else sample.good=0;
  if(run.enemies.count>run.liveCap)compactDistantEnemies(run,run.liveCap);
}

const SPECIAL=1|2|4|128|2048|4096|8192|16384|32768|65536|131072;
const statuses=['dying','burn','poison','para','stun','frozen','wet','sleep','confuse','curse','healBlock','charm','root','pull','chill','ccImmune','air'];
export function compactDistantEnemies(run,cap,maxMerges=16){
  const e=run.enemies,p=run.player.pos,receivers=new Map();let merged=0;
  for(let i=0;i<e.n&&e.count>cap&&merged<maxMerges;i++){
    if(!e.isAlive(i)||e.flags[i]&SPECIAL||i===run.lockTarget||i===run.focusIdx)continue;
    if((e.x[i]-p.x)**2+(e.z[i]-p.z)**2<24*24||statuses.some(key=>e[key]?.[i]>0))continue;
    if(Math.abs(e.kx?.[i]||0)+Math.abs(e.kz?.[i]||0)>1e-6)continue;
    if(run.sprites.visible(e.x[i],e.y[i]+e.hgt[i]*.5,e.z[i],3+Math.max(e.hgt[i],e.radius[i]*2.4)))continue;
    const key=e.species[i]+'/'+e.flags[i],receiver=receivers.get(key);
    if(receiver===undefined){receivers.set(key,i);continue;}
    // Same species, role and no active status effects: preserve all remaining
    // HP, XP and represented population. No kill/reward callbacks are fired.
    const weight=e.wt[i];
    e.hp[receiver]+=e.hp[i];e.maxHp[receiver]+=e.maxHp[i];e.xp[receiver]+=e.xp[i];
    e.shield[receiver]+=e.shield[i];e.wt[receiver]+=weight;
    e.kill(i);e.mass+=weight;merged++;
  }
  return merged;
}
