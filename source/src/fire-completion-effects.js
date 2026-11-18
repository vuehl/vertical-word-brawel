const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class FireCompletionEffects{
 constructor(family){this.f=family;}
 play(clip,x,y,z,size,options={}){return this.f.play(clip,x,y,z,size,{completion:true,blend:true,fadeIn:.04,fadeOut:.20,...options});}
 fireBlast(x,y,z,radius){
  const f=this.f,s=clamp(radius,2.8,5.5);
  f.play('eruption',x,y,z,s*2.7,{foreground:true,life:.64,anchorY:.22,priority:2,fadeIn:.025,fadeOut:.28,blend:true});
  // Five broad flame arms preserve the original star-shaped explosion.
  for(const a of [Math.PI/2,Math.PI*.08,Math.PI*.92,Math.PI*1.27,Math.PI*1.73])f.play('wake',x,y+1.8,z,s*1.4,{height:s*.72,angle:a+Math.PI,mode:0,life:.48,delay:.055,alpha:.86,scaleFrom:.50,scaleTo:1.3,anchorX:.88,frameStart:.08,frameEnd:.46,fadeIn:.025,fadeOut:.22,blend:true,priority:2});
  f.play('shockwave',x,y+.16,z,s*2.3,{mode:1,height:s*2.3,life:.42,alpha:.45,fadeIn:.025,fadeOut:.28,scaleFrom:.5,scaleTo:1.15,blend:true});
 }
 starFall(x,y,z,life){
  this.play('star',x,y+15,z,6.3,{life,fall:15,angle:.15,spin:-1.1,fadeIn:.06,fadeOut:.04,priority:2});
  this.play('gate',x,y+.12,z,8.5,{mode:1,height:8.5,life,alpha:.35,fadeIn:.12,fadeOut:.12});
 }
 starImpact(x,y,z,radius){
  this.play('star',x,y+.65,z,5.9,{life:.25,scaleFrom:1,scaleTo:1.45,fadeIn:0,fadeOut:.23,priority:2});
  this.play('goldBurst',x,y+.35,z,radius*2.2,{life:.55,delay:.04,fadeIn:.03,fadeOut:.25,priority:2});
  this.f.play('shockwave',x,y+.15,z,radius*2.15,{mode:1,height:radius*2.15,life:.5,alpha:.55,scaleFrom:.4,scaleTo:1.15,fadeIn:.035,fadeOut:.3,blend:true});
 }
 starShot(pool,id,size,opacity){
  this.f.touch('completion-star/'+id,'star',pool.x[id],pool.y[id],pool.z[id],Math.max(1.25,size*1.65),{completion:true,alpha:opacity,own:!(pool.flags[id]&1),spin:1.1,fadeIn:.025,priority:1});
 }
 starHit(x,y,z){this.play('goldBurst',x,y,z,2.4,{life:.24,fadeOut:.18,priority:1});}
 dragonStart(x,y,z){this.play('dragon',x,y+.1,z,8.6,{height:8.6,anchorY:.15,life:1.0,palette:1,alpha:.9,heroOpening:true,frameStart:.08,frameEnd:.85,fadeIn:.10,fadeOut:.32,priority:2});}
 dragonFall(x,y,z,life){this.f.play('meteor',x,y+13,z,5.3,{height:7.5,life,fall:13,palette:1,anchorY:.12,frameStart:.08,frameEnd:.72,fadeIn:.05,fadeOut:.07,blend:true,priority:2});}
 dragonImpact(x,y,z){
  this.f.play('burst',x,y+.3,z,5.8,{life:.48,palette:1,fadeIn:.035,fadeOut:.25,blend:true,priority:2});
  this.play('goldBurst',x,y+.2,z,5.2,{life:.38,palette:1,alpha:.75,fadeOut:.25});
 }
 dragonFloor(x,y,z,radius){
  const f=this.f,key='dragon-floor/'+Math.round(x/3)+'/'+Math.round(z/3);
  if(f.clock-(f.hitTimes.get(key)??-10)<.35)return;f.hitTimes.set(key,f.clock);
  f.play('curl',x,y+.2,z,Math.min(3,radius*1.3),{life:.55,palette:1,alpha:.48,fadeIn:.1,fadeOut:.35,blend:true,priority:0});
 }
 glitch(x,y,z,radius){
  this.play('gate',x,y+.7,z,radius*2.2,{life:.52,palette:1,spin:1.4,fadeIn:.055,fadeOut:.28,priority:2});
  this.play('gate',x+.3,y+.7,z-.2,radius*2.2,{life:.46,palette:2,alpha:.35,spin:-1.1,fadeIn:.04,fadeOut:.25,priority:1});
  this.play('goldBurst',x,y+.9,z,radius*1.2,{life:.34,palette:2,alpha:.7,delay:.09,fadeOut:.21,priority:1});
 }
}
