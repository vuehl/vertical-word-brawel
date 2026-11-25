import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupRadius,inPickupRange,pickupSpeed,pickupArrived} from '../../source/src/combat/paper-pickups.js';
import fs from 'node:fs';
import {configureGlyphNames,glyphText,glyphSpeciesFromImage} from '../../source/src/data/zixing-identity.js';
import {glyphWordForSpecies} from '../../source/src/actors/paper-glyph-art.js';
import {drawBattleMinimap,specialMapMarker,layoutBuildingIcons,nearestMapFacility} from '../../source/src/ui/paper-hud-art.js';

test('facility guidance follows all eight north-up directions, including outside the map',()=>{
  const position={x:17,z:-23};
  for(const [dx,dz] of [[0,-100],[100,-100],[100,0],[100,100],[0,100],[-100,100],[-100,0],[-100,-100]]){
    const marker={kind:'bill',x:position.x+dx,z:position.z+dz};
    const target=nearestMapFacility([marker],position,'bill');
    assert.equal(target.x,marker.x);assert.equal(target.z,marker.z);
    assert.ok(Math.abs(target.distance-Math.hypot(dx,dz))<1e-9);
    assert.ok(Math.abs(Math.cos(target.angle)-dx/target.distance)<1e-9);
    assert.ok(Math.abs(Math.sin(target.angle)-dz/target.distance)<1e-9);
  }
});

test('guidance changes with movement, filter, and consumption, distinguishing free gifts',()=>{
  const markers=[{kind:'chest',x:10,z:0},{kind:'chest',x:-30,z:0},
    {kind:'chest',x:1,z:0,data:{gift:true}},{kind:'freechest',x:4,z:0},
    {kind:'berry',x:0,z:-5},{kind:'chest',x:0,z:1,used:true},
    {kind:'chest',x:0,z:-1,data:{comet:true}},{kind:'chest',x:NaN,z:0}];
  assert.equal(nearestMapFacility(markers,{x:0,z:0},'chest').x,10);
  assert.equal(nearestMapFacility(markers,{x:-25,z:0},'chest').x,-30);
  markers[0].used=true;
  assert.equal(nearestMapFacility(markers,{x:0,z:0},'chest').x,-30);
  assert.equal(nearestMapFacility(markers,{x:0,z:0},'freechest').x,1);
  assert.equal(nearestMapFacility(markers,{x:0,z:0},'berry').z,-5);
  assert.equal(nearestMapFacility(markers,{x:0,z:0},'bill'),null);
  assert.equal(nearestMapFacility(markers,{x:0,z:0},null),null);
  assert.equal(nearestMapFacility([{kind:'sanct_portal',x:4,z:0,used:true}],{x:0,z:0},'portal').x,4);
});

test('only the minimap draws guidance, including during fog',()=>{
  const rotations=[],ctx=new Proxy({rotate:angle=>rotations.push(angle),measureText:text=>({width:text.length*5})},
    {get:(target,key)=>target[key]??(()=>{})});
  const canvas={width:240,height:240,getContext:()=>ctx},marker={kind:'chest',x:100,z:-100};
  const run={player:{pos:{x:0,z:0}},ui:{mapFacilityKind:'chest'},enemies:{n:0},boss:{alive:false},terrain:{world:240},
    interactables:{markers:()=>[marker]},allies:{list:[]}};
  const draw=options=>{rotations.length=0;return drawBattleMinimap(canvas,run,options);};
  assert.equal(draw().count,0);assert.deepEqual(rotations,[-Math.PI/4]);
  assert.equal(draw({shadow:false}).guidance,null);assert.deepEqual(rotations,[]);
  run.player.pos={x:100,z:-100};assert.equal(draw().guidance.distance,0);assert.deepEqual(rotations,[]);
  run.player.pos={x:0,z:0};run.events={blind:true};assert.equal(draw().guidance.kind,'chest');assert.deepEqual(rotations,[-Math.PI/4]);
  run.events.blind=false;marker.used=true;assert.equal(draw().guidance,null);assert.deepEqual(rotations,[]);
});

test('dense same-type map icons preserve every location in counts without overlap or clipping',()=>{
  for(const size of [9,12,17]){
    const labels=Array.from({length:36},(_,i)=>({kind:'altar',
      x:60+Math.cos(i*Math.PI/18)*48,y:58+Math.sin(i*Math.PI/18)*48}));
    labels.push({kind:'altar',text:'时尚小垃圾',x:60,y:58});
    const result=layoutBuildingIcons(labels,size);
    assert.equal(result.reduce((sum,g)=>sum+g.count,0),labels.length);
    assert.ok(result.length<labels.length);
    for(const group of result){
      assert.ok(labels.some(label=>label.x===group.x&&label.y===group.y),'Group retains a real location');
      const {x,y,w,h}=group.box;
      for(const [cx,cy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]])
        assert.ok(Math.hypot(cx-60,cy-58)<=47.001,'Complete label fits inside the map');
      assert.ok(x+w<=54||x>=66||y+h<=51||y>=65,'Name does not cover the player');
    }
    for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
      const a=result[i].box,b=result[j].box;
      assert.ok(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y);
    }
    assert.deepEqual(labels.map(label=>label.count),labels.map(()=>undefined),'Source markers remain unchanged');
  }
});

test('map filters distinguish free gifts and keep buildings visible through fog and image loading',()=>{
  const icons=[],texts=[],ctx=new Proxy({drawImage:icon=>icons.push(icon.kind),fillText:text=>texts.push(text),measureText:text=>({width:text.length*5})},
    {get:(target,key)=>target[key]??(()=>{})});
  const canvas={width:620,height:620,getContext:()=>ctx};
  let markers=[{kind:'chest',x:10,z:10},{kind:'chest',x:12,z:12,data:{gift:true}},
    {kind:'freechest',x:13,z:13},{kind:'portal',x:-20,z:-20},{kind:'berry',x:30,z:0}];
  const run={ui:{mapFacilityIcon:kind=>({kind,naturalWidth:16,naturalHeight:20})},player:{pos:{x:0,z:0}},enemies:{n:0},boss:{alive:false},terrain:{world:240},
    interactables:{markers:()=>markers},allies:{list:[]}};
  let result=drawBattleMinimap(canvas,run,{shadow:false,facilityKind:'freechest'});
  assert.equal(result.count,2);assert.deepEqual(icons.sort(),['freechest']);assert.deepEqual(texts,['2','免费蓝骰子']);
  icons.length=0;texts.length=0;result=drawBattleMinimap(canvas,run,{shadow:false,facilityKind:'chest'});
  assert.equal(result.count,1);assert.deepEqual(icons.sort(),['chest']);assert.deepEqual(texts,['红骰子']);
  markers=markers.filter(marker=>marker.kind!=='chest');
  assert.equal(drawBattleMinimap(canvas,run,{shadow:false,facilityKind:'chest'}).count,0);
  texts.length=0;run.events={blind:true};run.ui.mapFacilityIcon=()=>null;
  for(const shadow of [true,false]){
    result=drawBattleMinimap(canvas,run,{shadow,facilityKind:'freechest'});
    assert.equal(result.count,1);assert.deepEqual(texts.splice(0).sort(),(shadow?['免','免费蓝骰子','门','门？']:['免','免费蓝骰子']).sort());
  }
});

test('overlapping different facility types are never counted as one type',()=>{
  const result=layoutBuildingIcons([{kind:'chest',x:45,y:35},
    {kind:'freechest',x:45,y:35}],10);
  assert.equal(result.length,2);assert.deepEqual(result.map(group=>group.count),[1,1]);
});

test('expanded map keeps names below icons, clear of other names and inside the dial',()=>{
  const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'];
  const widths=[13,24,29.5,18.5,13,13,18.5,18.5,18.5,18.5];
  const markers=kinds.map((kind,i)=>({kind,labelWidth:widths[i],x:60+Math.cos(i/kinds.length*Math.PI*2)*30,y:58+Math.sin(i/kinds.length*Math.PI*2)*30}));
  const groups=layoutBuildingIcons(markers,12,{x:60,y:58},5.5);
  for(let i=0;i<groups.length;i++){
    const a=groups[i].box;
    for(const [x,y] of [[a.x,a.y],[a.x+a.w,a.y],[a.x,a.y+a.h],[a.x+a.w,a.y+a.h]])assert.ok(Math.hypot(x-60,y-58)<=47.001);
    for(let j=i+1;j<groups.length;j++){
      const parts=b=>[{x:b.x+(b.w-12)/2,y:b.y,w:12,h:12},{x:b.x,y:b.y+13.5,w:b.w,h:5.5}];
      for(const p of parts(a))for(const b of parts(groups[j].box))assert.ok(p.x+p.w<=b.x||b.x+b.w<=p.x||p.y+p.h<=b.y||b.y+b.h<=p.y);
    }
  }
});

test('compact map fits all ten types alongside a free chest near the player',()=>{
  const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'],lengths=[2,4,5,3,2,2,3,3,3,3];
  const size=3840/380,font=2400/380,ratio=190/(84*2.3);
  const markers=kinds.map((kind,i)=>({kind,labelWidth:lengths[i]*font+2,x:60+Math.cos(i/kinds.length*Math.PI*2)*32.4/ratio,y:58+Math.sin(i/kinds.length*Math.PI*2)*32.4/ratio}));
  markers.push({kind:'freechest',labelWidth:4*font+2,x:60-4.5/ratio,y:58+6.3/ratio});
  const groups=layoutBuildingIcons(markers,size,{x:60,y:58},font);
  assert.equal(groups.length,10);
  for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)for(const a of groups[i].hitBoxes)for(const b of groups[j].hitBoxes)
    assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
});

test('both maps label unscaled boss distances in centimeters, including off-map minibosses',()=>{
  const flags=[2,4096,8192,4,1],labels=[];
  const ctx=new Proxy({fillText:text=>labels.push(text),measureText:text=>({width:text.length*5})},
    {get:(target,key)=>target[key]??(()=>{})});
  const canvas={width:240,height:240,getContext:()=>ctx};
  const enemies={n:5,flags,x:[4.8,100,-200,300,15],z:[0,0,0,0,0],alive:flags.map(()=>1),dying:flags.map(()=>0)};
  const run={player:{pos:{x:0,z:0}},enemies,boss:{alive:false},terrain:{world:600},interactables:{markers:()=>[]},allies:{list:[]}};
  for(const viewRatio of [1,2]){
    drawBattleMinimap(canvas,run,{viewRatio,shadow:viewRatio===1});
    assert.deepEqual(labels.splice(0),['4.8 厘米','100 厘米','200 厘米','300 厘米']);
  }
  run.player.pos.x=1;enemies.alive[1]=0;enemies.dying[2]=1;
  drawBattleMinimap(canvas,run);
  assert.deepEqual(labels,['3.8 厘米','299 厘米']);
});

test('special enemies keep distinctive near markers and directional edge markers',()=>{
  assert.equal(specialMapMarker(0,10,0),null);
  assert.equal(specialMapMarker(128,10,-15).kind,'rare');
  assert.equal(specialMapMarker(2048,10,-15).kind,'rare');
  assert.equal(specialMapMarker(16384,10,-15).kind,'treasure');
  for(const flags of [1,2,4,128,2048,4096,8192,16384])for(const [dx,dz] of [[100,0],[-100,100],[0,-100]]){
    const m=specialMapMarker(flags,dx,dz);assert.equal(m.edge,true);
    assert.ok(Math.abs(Math.hypot(m.x-60,m.y-58)-40)<1e-10);
    assert.ok(Math.abs(Math.atan2(m.y-58,m.x-60)-Math.atan2(dz,dx))<1e-10);
  }
});

test('species names in encounter and NPC prose resolve to the same glyphs as their artwork',()=>{
  const actors=JSON.parse(fs.readFileSync(new URL('../../resources/public/data/pokemon.json',import.meta.url),'utf8'));
  configureGlyphNames(actors);
  for(const actor of actors){
    assert.equal(glyphText(actor.name),glyphWordForSpecies(actor.id));
    assert.equal(glyphText(actor.originalName),glyphWordForSpecies(actor.id));
  }
  assert.equal(glyphText('妙蛙种子出现了，快去抓它！'),glyphWordForSpecies(1)+'出现了，快去抓它！');
  assert.equal(glyphText('喵喵（商店） / Pokémon'),glyphWordForSpecies(52)+'（商店） / 字灵');
  for(const src of ['portraits/1.png','assets/icons/1.png','assets/portraits-shiny/1.png?v=2','/assets/pmd/1.png'])assert.equal(glyphSpeciesFromImage(src),1);
  for(const src of ['assets/ui/icons/coin.png','assets/items/poke-ball.png','assets/glyphs/atlas.png'])assert.equal(glyphSpeciesFromImage(src),null);
});

test('automatic pickup includes the range boundary and tolerates falling loot',()=>{
  assert.ok(inPickupRange(6,2,0,pickupRadius(6)));
  assert.ok(!inPickupRange(6.01,0,0,6));
  assert.ok(!inPickupRange(0,12,0,6));
  assert.equal(pickupRadius(NaN),6);assert.equal(pickupRadius(14),14);
});
test('attraction catches moving players without overshooting at 15/30/60 FPS',()=>{
  for(const fps of [15,30,60]){
    let distance=6,age=0,collected=false;
    for(let frame=0;frame<fps*2;frame++){
      const dt=1/fps;age+=dt;distance+=8*dt;
      const speed=pickupSpeed(age,8);
      if(pickupArrived(distance,speed,dt)){collected=true;break;}
      distance-=speed*dt;assert.ok(distance>0);
    }
    assert.ok(collected,'loot must catch the moving player at '+fps+' FPS');
  }
  assert.ok(pickupArrived(0,pickupSpeed(0,8),1/60));
  assert.ok(pickupSpeed(1200,8)<40,'old loot must not acquire unbounded velocity');
});
