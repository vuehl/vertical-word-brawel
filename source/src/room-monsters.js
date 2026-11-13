import {enemyWords,eliteWords,minibossWords,heroWords} from './character-rules.js';

// Main bosses have a shared pose. Objects and remote replicas cannot register as combat owners.
const specialActors=4|32768|65536;
const CHARMED=4096,ROOTED=8192,CHILL_SHIFT=14;
function wordsFor(flags){return flags&(2|4096|8192)?minibossWords:flags&1?eliteWords:enemyWords;}
export function roomMonster(flags){return !(flags&specialActors);}

function obstacles(terrain){
  const walls=[];
  for(const b of terrain.colliders){
    if(b.off)continue;
    walls.push(b.paperBox?[b.x,b.z,b.halfX,b.halfZ,b.cos,b.sin]:[b.x,b.z,b.r,0,1,0]);
  }
  for(const b of terrain.solidBoxes)walls.push([(b.x0+b.x1)/2,(b.z0+b.z1)/2,(b.x1-b.x0)/2,(b.z1-b.z0)/2,1,0]);
  return walls;
}

export class RoomMonsters{
  constructor(coop){
    this.coop=coop;
    this.reset();
  }
  reset(){
    this.stage=0;
    this.seq=0;
    this.turn=0;this.moves=[];this.completedTurn=0;this.cooldown=2.5;
    this.bossPose=null;this.bossCommand=null;this.reportedBoss=false;
    this.next=0;
    this.published=new Map();
    this.poses=new Map();
    this.worldSlots=new Map();
    this.sentMap=false;
  }
  receiveBossMove(frame){
    if(frame.party!==this.coop.party || frame.stage!==this.coop.run.stage || frame.turn<=this.turn)return;
    this.turn=frame.turn;
    if(this.coop.run.state==='play' && this.coop.run.boss?.alive)this.moves.push(frame);
  }
  bossInput(command){
    const c=this.coop,r=c.run,b=r.boss,e=r.enemies,id=b?.bossIndex;
    if(!c.bossAuthority || !b?.alive || !c.isBossMirror(id)){
      if(this.reportedBoss){this.reportedBoss=false;return {down:true};}
      return undefined;
    }
    this.reportedBoss=true;
    const kit=b.kit;
    return {x:e.x[id],z:e.z[id],speed:kit?kit.speed*(kit.phase===3?1.15:1):e.speed[id],
      radius:e.radius[id],limit:Number.isFinite(r.terrain.arenaR)?Math.min(r.terrain.arenaR-.5,r.terrain.ringR-1.5):0,
      ready:r.state==='play',telegraph:b.tk,homeX:kit?.hx,homeZ:kit?.hz,signature:b.hasSignature(id),phase:kit?.phase||1,ack:this.completedTurn,cooldown:this.cooldown,fury:b.enraged,immune:kit?.immune>0,noHit:r.player.noHitT||0,
      sanctuary:!!kit,locked:!!(kit?.lock>0||kit?.immune>0||b.hold>0||e.frozen[id]>0||e.stun[id]>0||e.sleep[id]>0),
      ...command};
  }
  bossSkill(command){
    if(!this.coop.bossAuthority)return;
    this.bossCommand=command;this.next=0;
    this.publish();
  }
  updateBoss(id,dt){
    const r=this.coop.run,b=r.boss,e=r.enemies,pose=this.bossPose;
    if(pose){
      const kit=b.kit;
      if(!this.coop.bossAuthority && kit && pose.phase>kit.phase)kit.enterPhase(pose.phase);
      const t=Math.min(1,Math.max(0,(r.realTime-pose.at)/.25));
      e.x[id]=pose.fromX+(pose.x-pose.fromX)*t;e.z[id]=pose.fromZ+(pose.z-pose.fromZ)*t;
      e.fx[id]=Math.cos(pose.face*Math.PI/16);e.fz[id]=Math.sin(pose.face*Math.PI/16);
    }
    const ground=r.terrain.surface(e.x[id],e.z[id]);
    if(e.air[id]){
      e.vy[id]-=30*dt;e.y[id]+=e.vy[id]*dt;
      if(e.y[id]<=ground){e.air[id]=0;e.vy[id]=0;e.y[id]=ground;}
    }else e.y[id]=ground+(e.flags[id]&16?1.1:0);
    e.gnd[id]=ground;e.anim[id]+=dt;e.flash[id]=Math.max(0,e.flash[id]-dt*6);
    e.atkAnim[id]=Math.max(0,e.atkAnim[id]-dt);
    e.squash[id]*=Math.exp(-dt*10);e.kx[id]=e.kz[id]=0;
    r.combat.tickStatus(id,dt);
    if(!e.isAlive(id))return;
    if(!e.canMoveAfterControl(id,dt))b.kit?.idle(dt);
    else {
      const p=r.player.pos;
      b.update(id,dt,Math.hypot(p.x-e.x[id],p.z-e.z[id]));
      for(const command of this.moves){
        b.beginRoomMove(command);
        if(b.kit){
          if(command.move==='ultimate'){b.kit.ultimate();this.cooldown=3;}
          else this.cooldown=b.kit.attack(command.move,command.variant);
        }else this.cooldown=b.roomAttack(id,command.move);
        this.completedTurn=command.turn;
      }
      this.moves.length=0;
      e.proxyContact(id,p.x,p.y,p.z);
    }
  }
  publish(){
    const c=this.coop,r=c.run,e=r.enemies;
    if(!r.terrain || !r.player || r.buildingStage || r.state==='transition' || r.realTime<this.next)return;
    if(this.stage!==r.stage){this.reset();this.stage=r.stage;}
    this.next=r.realTime+.25;
    const p=r.player.pos,focus=c.spec||p;
    const data={stage:r.stage,x:p.x,z:p.z,viewX:focus.x,viewZ:focus.z,down:r.player.dead,acceptBoss:r.state==='play' && !!r.boss?.alive,actors:[],remove:[]};
    data.boss=this.bossInput(this.bossCommand);this.bossCommand=null;

    const live=id=>e.isAlive(id)&&roomMonster(e.flags[id])&&!e.parked(id);
    for(const [id,old] of this.published){
      if(live(id)&&old.gen===e.gen[id])continue;
      data.remove.push(id);this.published.delete(id);this.poses.delete(id);
    }
    for(let id=0;id<e.n;id++){
      if(!live(id))continue;
      const mini=e.flags[id]&12288?r.minibosses.get(id):null;
      const gen=e.gen[id],hp=e.hp[id];
      const status=c.stBits(id) | (e.stun[id]>0?256:0) | (r.state==='paused'?512:0)
        | (e.confuse[id]>0?1024:0) | (mini?.phys==='charge'?2048:0)
        | (e.charm[id]>0?CHARMED:0) | (e.root[id]>0?ROOTED:0) | (Math.min(7,e.chill[id])<<CHILL_SHIFT);
      const old=this.published.get(id);
      if(old && old.maxHP===e.maxHp[id] && old.hp===hp && old.status===status && !e.kx[id] && !e.kz[id])continue;
      const row=[id,gen,hp,status,e.kx[id],e.kz[id]];
      if(!old || old.maxHP!==e.maxHp[id]){
        const words=wordsFor(e.flags[id]);
        row.push(e.maxHp[id],e.species[id],e.radius[id],e.dmg[id],e.scale[id],e.speed[id],e.flags[id],
          e.x[id],e.z[id],e.dirX[id],e.dirZ[id],words.indexOf(e.glyphWords[id]),e.atk[id]);
      }
      data.actors.push(row);
      this.published.set(id,{gen,hp,status,maxHP:e.maxHp[id]});
      e.kx[id]=e.kz[id]=0;
    }
    if(!this.sentMap){
      // Send geometry separately from the first spawn batch to stay within the WS frame limit.
      const walls=obstacles(r.terrain).map(row=>row.map(value=>Math.round(value*10000)/10000));
      this.sentMap=c.room.send({op:'monster-input',party:c.party,data:{stage:r.stage,x:p.x,z:p.z,
        viewX:focus.x,viewZ:focus.z,down:r.player.dead,limit:r.terrain.walkLim,walls}});
    }
    if(!c.room.send({op:'monster-input',party:c.party,data})){
      this.published.clear();this.sentMap=false;
    }
  }
  frame(f){
    const c=this.coop,r=c.run,e=r.enemies;
    if(f.party!==c.party || f.stage!==r.stage || this.stage!==f.stage || r.buildingStage || r.state==='transition' || f.seq<=this.seq)return;
    this.seq=f.seq;
    if(f.boss && r.boss){const [x,z,face,target,phase]=f.boss,id=r.boss.bossIndex;
      const snap=!this.bossPose || !r.boss.alive || Math.hypot(e.x[id]-x/20,e.z[id]-z/20)>12;
      this.bossPose={x:x/20,z:z/20,fromX:snap?x/20:e.x[id],fromZ:snap?z/20:e.z[id],face,target,phase,at:r.realTime};
    }
    for(const [seat,index,gen] of f.leave||[]){
      const key=seat*4096+index,entry=this.worldSlots.get(key);
      if(!entry||entry.gen!==gen)continue;
      if(seat!==c.mySlot && e.alive[entry.id] && c.pSlot[entry.id]===seat && e.gen[entry.id]===entry.localGen){
        if(!e.dying[entry.id])e.kill(entry.id);
        c.unmap(entry.id);
      }
      this.worldSlots.delete(key);
      if(this.poses.get(entry.id)?.localGen===entry.localGen)this.poses.delete(entry.id);
    }
    for(const [seat,index,gen,species,flags,maxHP,dmg,scale,word] of f.enter||[]){
      const key=seat*4096+index;
      let id=index;
      if(seat!==c.mySlot){
        const existing=this.worldSlots.get(key);
        if(existing?.gen===gen && c.pSlot[existing.id]===seat && e.isAlive(existing.id)){
          e.maxHp[existing.id]=maxHP;e.dmg[existing.id]=dmg;continue;
        }
        const prev=c.proxies.get(key);
        if(prev!==undefined && e.alive[prev]){e.kill(prev);c.unmap(prev);}
        id=e.spawnProxy(species,0,0,0,flags,scale);
        if(id<0)continue;
        c.proxies.set(key,id);c.pSlot[id]=seat;c.pKey[id]=((gen&15)<<12)|index;
        e.glyphWords[id]=wordsFor(flags)[word] ?? heroWords[species];e.maxHp[id]=maxHP;e.dmg[id]=dmg;
        c.pHit[id]=-99;c.pN[id]=0;
      }else if(!e.isAlive(id)||e.gen[id]!==gen)continue;
      const mini=seat!==c.mySlot && (flags&12288)?r.minibosses.make(flags&8192?'summoner':'totem',species,id):null;
      this.worldSlots.set(key,{id,gen,localGen:e.gen[id],mini});
    }
    for(const [seat,index,gen,qx,qz,face,health,status] of f.update||[]){
      const entry=this.worldSlots.get(seat*4096+index);
      if(!entry||entry.gen!==gen)continue;
      const id=entry.id,remote=seat!==c.mySlot,x=qx/20,z=qz/20;
      if(!e.isAlive(id)||e.gen[id]!==entry.localGen||(remote&&c.pSlot[id]!==seat))continue;
      const old=this.poses.get(id);
      if(!old || old.localGen!==e.gen[id] || Math.hypot(e.x[id]-x,e.z[id]-z)>12){
        e.x[id]=x;e.z[id]=z;e.y[id]=r.terrain.surface(x,z);
      }
      this.poses.set(id,{x,z,fromX:e.x[id],fromZ:e.z[id],at:r.realTime,gen,remote,status,mini:entry.mini,localGen:e.gen[id]});
      e.fx[id]=Math.cos(face*Math.PI/16);e.fz[id]=Math.sin(face*Math.PI/16);
      if(remote){
        e.hp[id]=Math.max(1,health/255*e.maxHp[id]);c.pSeen[id]=r.realTime;
        for(const [name,bit] of statusFields)e[name][id]=status&bit?1:0;
      }
    }
    for(const [seat,index,gen,kind,x,z] of f.actions||[]){
      if(kind===8){if(seat===c.mySlot && e.gen[index]===gen && e.isAlive(index))e.kill(index);continue;}
      const entry=this.worldSlots.get(seat*4096+index);
      if(!entry||entry.gen!==gen||!e.isAlive(entry.id)||e.gen[entry.id]!==entry.localGen)continue;
      if(kind===1)r.projectiles.enemyShot(entry.id,x,r.terrain.surface(x,z)+.8,z);
      if(kind===2&&seat===c.mySlot)r.combat.enemySupport(entry.id);
      if(kind>=3)r.minibosses.roomAction(entry.id,kind,x,z,entry.mini);
    }
  }
  place(id,dt){
    const pose=this.poses.get(id),r=this.coop.run,e=r.enemies;
    if(!pose || pose.localGen!==e.gen[id])return false;
    const t=Math.min(1,Math.max(0,(r.realTime-pose.at)/.25));
    e.x[id]=pose.fromX+(pose.x-pose.fromX)*t;e.z[id]=pose.fromZ+(pose.z-pose.fromZ)*t;
    const ground=r.terrain.surface(e.x[id],e.z[id]);
    e.gnd[id]=ground;
    if(pose.mini?.chargeT>0)r.minibosses.chargeContact(pose.mini,dt);
    if(e.air[id]){
      e.vy[id]-=30*dt;e.y[id]+=e.vy[id]*dt;
      if(e.y[id]<=ground){e.air[id]=0;e.vy[id]=0;e.y[id]=ground;}
    }else e.y[id]=ground+(e.flags[id]&16?1.1:0);
    const far=(e.x[id]-r.player.pos.x)**2+(e.z[id]-r.player.pos.z)**2>24*24;
    if(!(pose.status&(8|16|256)) && (!far||(id+e.lodFrame)%4===0))e.anim[id]+=r.realDt*1.6*(far?4:1);
    return true;
  }
  dropPeer(seat){
    for(const [key,entry] of this.worldSlots)if((key>>12)===seat){this.poses.delete(entry.id);this.worldSlots.delete(key);}
  }
  ownsProxy(id){
    const pose=this.poses.get(id);
    return pose?.remote===true && pose.localGen===this.coop.run.enemies.gen[id];
  }
}
const statusFields=[['burn',1],['poison',2],['para',4],['frozen',8],['sleep',16],['wet',32],['curse',64],['chill',128],['stun',256]];

