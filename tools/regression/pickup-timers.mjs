import assert from 'node:assert/strict';

export async function verifyPickupTimers(page){
  const result=await page.evaluate(()=>{
    const r=app.run,f=r.interactables,p=r.player;
    const pickups=f.list.filter(item=>['berry','chest','freechest'].includes(item.kind));
    const firstExpiry=Math.min(...pickups.map(item=>item.rotateAt));
    const due=pickups.filter(item=>item.rotateAt===firstExpiry);
    const visible=r.sprites.visible,roll=r.rollChestItem,oldTime=r.time,oldPos=p.pos.clone();
    const positions=new Map(pickups.map(item=>[item,item.group.position.clone()]));
    const moved=item=>positions.get(item).distanceTo(item.group.position)>0;
    const counts=['berry','freechest','chest'].map(kind=>pickups.filter(item=>item.kind===kind).length);
    const dice=['chest','freechest'].map(kind=>pickups.find(item=>item.kind===kind));
    const focus=(x,z)=>{
      p.pos.set(x,0,z);r.camTarget.copy(p.pos);r.updateCamera(1);r.renderWorld(0);
    };
    let awards=0;
    try{
      r.state='play';r.rollChestItem=()=>awards++;
      focus(r.terrain.spawn.x,r.terrain.spawn.z);
      // Keep both dice cooling while the untouched pickups reach two minutes.
      for(const [i,die] of dice.entries()){
        r.time=firstExpiry-30+i*5;
        r.gold=f.interactionCost(die);
        f.interact(die);f.interact(die);
        if(die.respawnAt!==r.time+60||!die.used||r.gold!==0)throw Error('Wrong die cooldown or price');
      }
      for(let i=0;i<60;i++)r.update(1/30);
      r.time=firstExpiry-.01;f.update(0);
      if(pickups.some(moved))throw Error('Pickup rotated early');
      r.time=firstExpiry;r.sprites.visible=()=>true;
      f.update(0);
      if(pickups.some(moved))throw Error('Visible pickup disappeared');
      r.sprites.visible=visible;
      // Move the camera to the opposite side of each still-due pickup.
      for(const item of due.filter(item=>!item.used)){
        if(moved(item))continue;
        const bounds=r.terrain.deskBounds;
        focus(item.x>0?2-bounds.x:bounds.x-2,item.z>0?2-bounds.z:bounds.z-2);
        for(let i=0;i<200&&!moved(item);i++)f.update(0);
        if(!moved(item)||visible.call(r.sprites,item.x,item.y+2,item.z,8)||
            item.rotateAt!==r.time+120)throw Error('Failed idle relocation for '+item.kind);
      }
      focus(r.terrain.spawn.x,r.terrain.spawn.z);
      for(const die of dice){
        r.time=die.respawnAt-.01;f.update(0);
        if(!die.used||moved(die))throw Error('Die returned before its own cooldown');
        r.time=die.respawnAt;
        r.sprites.visible=()=>true;
        for(let i=0;i<100;i++)f.update(0);
        if(!die.used||moved(die))throw Error('Die refilled on screen');
        r.sprites.visible=visible;
        for(let i=0;i<150&&die.used;i++){r.time+=1/30;f.update(0);}
        if(die.used||!moved(die)||visible.call(r.sprites,die.x,die.y+2,die.z,8)||
            die.rotateAt!==r.time+120||!f.hasVisual(die))throw Error('Die failed to refill off screen');
      }
      return {stage:r.stage,counts,awards};
    }finally{
      r.rollChestItem=roll;r.sprites.visible=visible;r.time=oldTime;
      focus(oldPos.x,oldPos.z);
    }
  });
  assert.deepEqual(result.counts,result.stage===1?[4,2,2]:[2,1,1]);
  assert.equal(result.awards,2);
  return result;
}
