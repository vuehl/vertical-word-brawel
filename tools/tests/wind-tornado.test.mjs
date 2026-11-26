import test from 'node:test';
import assert from 'node:assert/strict';
import {CrowdGrid} from '../../source/src/performance/crowd-grid.js';
import {Lh} from '../../source/src/combat/ultimate-moves.js';
import {sweptWindTargets} from '../../source/src/combat/wind-tornado.js';
import {StylizedSkillFX} from '../../source/src/effects/stylized-skill-vfx.js';

function population(points){
  const enemies={x:[],z:[],radius:[],alive:[],dying:[],flags:[],gen:[],kx:[],kz:[]};
  for(const [x,z,radius=.5] of points){
    enemies.x.push(x);enemies.z.push(z);enemies.radius.push(radius);
    for(const key of ['dying','flags','kx','kz'])enemies[key].push(0);
    enemies.alive.push(1);enemies.gen.push(1);
  }
  const grid=new CrowdGrid(points.length);
  grid.build(points.length,enemies.x,enemies.z,enemies.alive,enemies.radius,enemies.dying);
  enemies.within=(x,z,radius,out=[])=>grid.within(x,z,radius,enemies,out);
  return enemies;
}

test('a fast wind sweep hits crossed targets and touching edges, excluding the sides and behind',()=>{
  const enemies=population([[1,0],[3,0],[5,0],[3,1.4],[3,1.6],[-2,0],[9,0]]),out=[99];
  assert.deepEqual(sweptWindTargets(enemies,0,0,6,0,1,out).sort((a,b)=>a-b),[0,1,2,3]);
  assert.equal(sweptWindTargets(enemies,0,0,6,0,1,out),out);
  assert.deepEqual(sweptWindTargets(enemies,3,0,3,0,.1,out),[1]);
});

test('all wind forms finish sooner and connect along the whole path at 15, 30 and 60 Hz',()=>{
  for(const species of [16,17,18,58,59,4])for(const hz of [15,30,60]){
    const enemies=population([[0,-3],[0,-8],[0,-14],[6,-8],[0,5]]),hits=[],poses=[];
    let duration,advance,now=0;
    const run={player:{speciesId:species},enemies,terrain:{arenaR:100,height:()=>0},
      animate(seconds,callback){duration=seconds;advance=callback;},
      combat:{hit(id,damage,options){hits.push({id,damage,options,time:now});}},
      vfx:{crafted:{windSkillArt:()=>({track:(key,clip,x,y,z)=>poses.push({x,z})}),tornado(){}}}};
    Lh({run,x:0,z:0,R:1,dmg:10,type:'flying',cls:'special'},0,-1,16,2.2,.4,2.1);
    assert.ok(Math.abs(duration-(species===4?2.2:1.375))<1e-9);
    for(let frame=1;frame<=Math.ceil(duration*hz);frame++){
      now=Math.min(duration,frame/hz);advance(now/duration);
    }
    assert.deepEqual([...new Set(hits.map(hit=>hit.id))].sort(),[0,1,2]);
    if(species===4)continue;
    assert.ok(hits.every(hit=>hit.options.windTornado&&hit.options.knock===1.2&&!hit.options.silent));
    assert.ok(hits.find(hit=>hit.id===1).time<.45,'Middle target is reached promptly');
    assert.ok(Math.abs(poses.at(-1).z+16.2)<1e-8,'Travel distance is retained');
    for(const id of [0,1,2]){
      const times=hits.filter(hit=>hit.id===id).map(hit=>hit.time);
      assert.ok(times.every((time,index)=>!index||time-times[index-1]>=.1875-1e-9),'No duplicate hit in a single sweep');
    }
  }
});

test('wind impact feedback respects the effect budget and limits repeated hit pauses',()=>{
  const shakes=[],stops=[];
  let visible=true;
  const fx={clock:0,lastWindImpact:-1,impacts:0,vfx:{calm:false},
    impact(){if(visible)this.impacts++;},run:{shake:value=>shakes.push(value),hitstop:value=>stops.push(value)}};
  for(let frame=0;frame<60;frame++){
    fx.clock=frame/60;
    for(let target=0;target<20;target++)StylizedSkillFX.prototype.windImpact.call(fx,0,1,0);
  }
  assert.ok(shakes.length>=5&&shakes.length<=6);
  assert.ok(stops.every(value=>value===.014));
  visible=false;fx.clock=2;const count=stops.length;
  StylizedSkillFX.prototype.windImpact.call(fx,0,1,0);assert.equal(stops.length,count);
  visible=true;fx.vfx.calm=true;
  StylizedSkillFX.prototype.windImpact.call(fx,0,1,0);assert.equal(stops.at(-1),.008);
});
