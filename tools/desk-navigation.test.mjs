import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDeskNavigation,createSpawnPlacement} from '../source/src/desk-navigation.js';
import {paperBox,hitsPaperBox,resolvePaperBox,moveEnemyPastProps} from '../source/src/paper-collision.js';
import {deskPixelsPerUnit as scale,deskTilt} from '../source/src/desk-framing.js';
const layout=JSON.parse(fs.readFileSync(new URL('../source/src/desk2d-layout.json',import.meta.url)));

function terrainFor(kind){
  const rects=layout.rects.filter(r=>r[0]===kind);
  const left=Math.min(...rects.map(r=>r[1])),right=Math.max(...rects.map(r=>r[3]));
  const top=Math.min(...rects.map(r=>r[2])),bottom=Math.max(...rects.map(r=>r[4]));
  const boxes=rects.map(([,l,t,r,b])=>paperBox((l+r-left-right)/2/scale,(t+b-top-bottom)/2/scale/deskTilt,(r-l)/scale,(b-t)/scale/deskTilt,1000,0));
  const hw=(right-left)/2/scale,hd=(bottom-top)/2/scale/deskTilt;
  return {hw,hd,deskBounds:{x:hw+10,z:hd+10},inBounds(x,z,r=0){return Math.abs(x)<hw+10-r&&Math.abs(z)<hd+10-r;},
    hitProp(x,y,z,r){return boxes.some(b=>hitsPaperBox(b,x,z,r));},
    resolve(x,z,r,y,out){out.x=x;out.z=z;for(const b of boxes)resolvePaperBox(b,out,r);return out;},propTop(){return -Infinity;}};
}

test('monsters traverse actual stepped prop silhouettes from both sides at 30/60 FPS',()=>{
  for(const kind of ['bottle','medicine','hushoushuang','keyboard','mouse']){
    const t=terrainFor(kind),steer=createDeskNavigation(t);
    for(const radius of [.45,1,2])for(const fps of [30,60])for(const reverse of [-1,1]){
      let x=reverse*(t.hw+radius+2),z=0,side=0;
      const goalX=-x,goalZ=0,out={},dir={},speed=6;
      for(let frame=0;frame<fps*30&&Math.hypot(goalX-x,goalZ-z)>.25;frame++){
        const d=Math.hypot(goalX-x,goalZ-z);
        dir.x=(goalX-x)/d;dir.z=(goalZ-z)/d;
        steer.advance();
        steer(x,z,goalX,goalZ,radius,dir);
        moveEnemyPastProps(t,x,z,x+dir.x*speed/fps,z+dir.z*speed/fps,radius,0,speed/fps,side,out);
        x=out.x;z=out.z;side=out.side;
        assert.ok(!t.hitProp(x,0,z,radius-.001),kind+' must not penetrate props');
      }
      assert.ok(Math.hypot(goalX-x,goalZ-z)<.3,`${kind} radius=${radius} fps=${fps} reverse=${reverse} stuck at ${x},${z}`);
    }
  }
});

test('spawn placement rejects sealed pockets and gaps too narrow for a monster',()=>{
  const boxes=[paperBox(0,-6,2,8,100,0),paperBox(0,6,2,8,100,0)];
  const terrain={play:10,desk2d:true,arenaR:Infinity,spawn:{x:-6,z:0},height:()=>0,
    inBounds:(x,z,r)=>Math.abs(x)<10-r&&Math.abs(z)<10-r,
    hitProp:(x,y,z,r)=>boxes.some(box=>hitsPaperBox(box,x,z,r))};
  const place=createSpawnPlacement(terrain),out={};
  assert.ok(place(6,0,.5));
  assert.ok(!place(6,0,2));
  assert.ok(place(6,0,2,out)&&out.x<0&&!terrain.hitProp(out.x,0,out.z,2));
  boxes.push(paperBox(0,0,2,4,100,0));
  const sealed=createSpawnPlacement(terrain);
  assert.equal(sealed(6,0,.5),false);
  assert.ok(sealed(6,0,.5,out)&&out.x<0);
});
