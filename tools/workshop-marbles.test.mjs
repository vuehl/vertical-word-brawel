import test from 'node:test';
import assert from 'node:assert/strict';
import {updateLooseMarbles} from '../source/src/workshop-marbles.js';
import {buildingMapName,drawBattleMinimap} from '../source/src/paper-hud-art.js';

function setup(){
  const marble={x:0,z:0,r:.5,vx:0,vz:0,rollX:0,rollZ:0,armed:false};
  const kills=[];
  const run={state:'play',player:{pos:{x:-.9,y:0,z:0},vel:{x:8,z:0},radius:.5},
    terrain:{workshopLooseMarbles:[marble],play:108,arenaR:Infinity,surface:()=>0,hitProp:()=>false,inSolid:()=>false},
    enemies:{n:2,alive:[1,1],dying:[0,0],flags:[0,32768],x:[4,2],z:[0,0],y:[0,0],radius:[.5,.5]},
    combat:{killEnemy(i){kills.push(i);run.enemies.dying[i]=.35;}}};
  return {run,marble,kills};
}
test('player kicks loose marbles; rolling hits kill once and ignore noncombat objects at 20/30/60 FPS',()=>{
  for(const fps of [20,30,60]){
    const {run,marble,kills}=setup();
    for(let i=0;i<fps;i++)updateLooseMarbles(run,1/fps);
    assert.ok(marble.x>5);assert.ok(marble.rollZ<0);assert.deepEqual(kills,[0]);
  }
});
test('idle, airborne contact, pause and zero-time renders cannot arm or advance marbles',()=>{
  for(const mode of ['idle','jump','pause','zero']){
    const {run,marble,kills}=setup();
    if(mode==='idle')run.player.pos.x=-10;
    if(mode==='jump')run.player.pos.y=5;
    if(mode==='pause')run.state='paused';
    for(let i=0;i<60;i++)updateLooseMarbles(run,mode==='zero'?0:1/60);
    assert.equal(marble.x,0);assert.equal(marble.armed,false);assert.deepEqual(kills,[]);
  }
});
test('fast player crossings are detected while teleports do not kick distant marbles',()=>{
  for(const [start,end,expected] of [[-2,2,true],[-20,20,false]]){
    const {run,marble}=setup();run.terrain.workshopMarblePlayer={x:start,z:0};run.player.pos.x=end;
    updateLooseMarbles(run,1/30);assert.equal(marble.armed,expected);if(expected)assert.ok(marble.vx>0);
  }
});
test('marbles bounce off thin scenery and map edges, slow down and can be kicked again',()=>{
  for(const wall of [false,true]){
    const {run,marble}=setup();
    if(wall)run.terrain.hitProp=(x,y,z,r)=>x+r>2&&x-r<2.05;else run.terrain.play=2;
    updateLooseMarbles(run,.05);run.player.pos.x=-20;
    let bounced=false;
    for(let i=0;i<180;i++){updateLooseMarbles(run,1/30);assert.ok(marble.x<=1.5+.001);bounced ||= marble.vx<0;}
    assert.ok(bounced);assert.equal(marble.vx,0);assert.equal(marble.armed,false);
    run.player.pos.x=marble.x-.9;run.player.pos.z=marble.z;updateLooseMarbles(run,1/30);assert.ok(marble.armed);
  }
});
test('both map sizes name functional buildings; used markers stay absent',()=>{
  assert.equal(buildingMapName({kind:'bill'}),'订书机');
  assert.equal(buildingMapName({kind:'tower',data:{sub:'stairs'}}),'上层入口');
  const text=[],ctx=new Proxy({fillText:t=>text.push(t),measureText:t=>({width:t.length*5})},{get:(t,k)=>t[k]??(()=>{})});
  const canvas={width:240,height:240,getContext:()=>ctx};
  const run={player:{pos:{x:0,z:0}},terrain:{world:240},boss:{alive:false},enemies:{n:0},allies:{list:[]},
    interactables:{markers:()=>[{kind:'bill',x:10,z:0},{kind:'meowth',x:-25,z:-20}]}};
  for(const viewRatio of [1,2]){text.length=0;drawBattleMinimap(canvas,run,{viewRatio,shadow:viewRatio===1});assert.ok(text.includes('订书机'));assert.ok(text.includes('商店'));}
  text.length=0;run.interactables.markers=()=>[];drawBattleMinimap(canvas,run);assert.deepEqual(text,[]);
});
