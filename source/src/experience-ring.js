const fraction=player=>{
  const value=Math.max(0,Math.min(1,player.xp/Math.max(1,player.xpNext)));
  return value>=1?1:Math.min(.999,Math.floor(value*1000+1e-7)/1000);
};

// Present every earned level as a complete lap before the upgrade dialog.
// Combat XP, its multipliers and overflow remain owned by Player.addXp.
export class ExperienceRing {
  constructor(player,now=0){
    this.level=player.level;this.progress=fraction(player);this.targetLevel=player.level;
    this.phase='idle';this.elapsed=0;this.at=now;this.from=this.progress;
  }
  get ready(){return this.phase==='idle'&&this.level>=this.targetLevel;}
  update(player,now,playing=true){
    const dt=Math.max(0,now-this.at);this.at=now;this.targetLevel=player.level;
    if(player.level<this.level||(player.level===this.level&&this.phase!=='idle')){
      this.level=player.level;this.phase='idle';this.elapsed=0;
    }
    if(this.phase==='idle'){
      if(player.level===this.level){this.progress=fraction(player);return;}
      this.phase='fill';this.elapsed=0;this.from=this.progress;
      this.fillMs=player.level-this.level>1?40:40+70*(1-this.from);
      return;
    }
    if(!playing)return;
    this.elapsed+=dt;
    if(this.phase==='fill'){
      this.progress=Math.min(1,this.from+(1-this.from)*this.elapsed/this.fillMs);
      if(this.progress>=1){this.progress=1;this.phase='full';this.elapsed=0;}
      // Never consume the full-ring hold in the same update, even at low FPS.
      return;
    }
    if(this.elapsed>=40){
      this.level++;this.phase='idle';this.elapsed=0;
      this.progress=this.level===player.level?fraction(player):0;
    }
  }
}
