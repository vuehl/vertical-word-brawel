import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupRadius,inPickupRange,pickupSpeed,pickupArrived} from '../../source/src/combat/paper-pickups.js';
import fs from 'node:fs';
import {configureGlyphNames,glyphText,glyphSpeciesFromImage} from '../../source/src/data/zixing-identity.js';
import {glyphWordForSpecies} from '../../source/src/actors/paper-glyph-art.js';
import {drawBattleMinimap,specialMapMarker,layoutBuildingIcons,nearestMapFacility,sideGuidePosition} from '../../source/src/ui/paper-hud-art.js';

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

test('dense map icons stay at every real location, including beside the player and at the rim',()=>{
  for(const size of [9,12,17]){
    const labels=Array.from({length:36},(_,i)=>({kind:'altar',
      x:60+Math.cos(i*Math.PI/18)*48,y:58+Math.sin(i*Math.PI/18)*48}));
    labels.push({kind:'altar',text:'时尚小垃圾',x:60,y:58});
    const result=layoutBuildingIcons(labels,size);
    assert.equal(result.reduce((sum,g)=>sum+g.count,0),labels.length);
    assert.equal(result.length,labels.length);
    for(const group of result){
      assert.ok(labels.some(label=>label.x===group.x&&label.y===group.y),'Group retains a real location');
      const icon=group.hitBoxes[0];
      assert.equal(icon.x+icon.w/2,group.x);
      assert.equal(icon.y+icon.h/2,group.y);
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
  assert.equal(result.count,2);assert.deepEqual(icons.sort(),['freechest','freechest']);
  assert.equal(result.groups.length,2);assert.ok(texts.every(text=>text==='免费蓝骰子'));
  icons.length=0;texts.length=0;result=drawBattleMinimap(canvas,run,{shadow:false,facilityKind:'chest'});
  assert.equal(result.count,1);assert.deepEqual(icons.sort(),['chest']);assert.deepEqual(texts,['红骰子']);
  markers=markers.filter(marker=>marker.kind!=='chest');
  assert.equal(drawBattleMinimap(canvas,run,{shadow:false,facilityKind:'chest'}).count,0);
  texts.length=0;run.events={blind:true};run.ui.mapFacilityIcon=()=>null;
  for(const shadow of [true,false]){
    result=drawBattleMinimap(canvas,run,{shadow,facilityKind:'freechest'});
    assert.equal(result.count,1);assert.deepEqual(texts.splice(0).sort(),(shadow?['免','免费蓝骰子','门','门']:['免','免费蓝骰子']).sort());
  }
});

test('overlapping different facility types are never counted as one type',()=>{
  const result=layoutBuildingIcons([{kind:'chest',x:45,y:35},
    {kind:'freechest',x:45,y:35}],10);
  assert.equal(result.length,2);assert.deepEqual(result.map(group=>group.count),[1,1]);
});

test('crowded map names stay below fixed icons and hide when there is no room',()=>{
  const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'];
  const widths=[13,24,29.5,18.5,13,13,18.5,18.5,18.5,18.5];
  const markers=kinds.map((kind,i)=>({kind,labelWidth:widths[i],x:60+Math.cos(i/kinds.length*Math.PI*2)*30,y:58+Math.sin(i/kinds.length*Math.PI*2)*30}));
  const groups=layoutBuildingIcons(markers,12,{x:60,y:58},5.5);
  assert.ok(groups.some(group=>group.showLabel)&&groups.some(group=>!group.showLabel));
  for(let i=0;i<groups.length;i++){
    assert.equal(groups[i].hitBoxes[0].x+6,markers[i].x);
    assert.equal(groups[i].hitBoxes[0].y+6,markers[i].y);
    if(!groups[i].showLabel)continue;
    const a=groups[i].label;
    assert.ok(a.y>groups[i].y+6);
    for(const [x,y] of [[a.x,a.y],[a.x+a.w,a.y],[a.x,a.y+a.h],[a.x+a.w,a.y+a.h]])assert.ok(Math.hypot(x-60,y-58)<=47.001);
    for(let j=0;j<groups.length;j++)if(i!==j)for(const b of groups[j].hitBoxes)
      assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
  }
});

test('player movement and nearby buildings cannot change the positions of map icons',()=>{
  const kinds=['chest','freechest','altar','boss','portal','magnet','berry','ditto','nest','bill'],lengths=[2,4,5,3,2,2,3,3,3,3];
  const size=3840/380,font=2400/380,ratio=190/(84*2.3);
  const markers=kinds.map((kind,i)=>({kind,labelWidth:lengths[i]*font+2,x:60+Math.cos(i/kinds.length*Math.PI*2)*32.4/ratio,y:58+Math.sin(i/kinds.length*Math.PI*2)*32.4/ratio}));
  markers.push({kind:'freechest',labelWidth:4*font+2,x:60-4.5/ratio,y:58+6.3/ratio});
  const groups=layoutBuildingIcons(markers,size,{x:60,y:58},font);
  assert.equal(groups.length,11);
  for(const player of [{x:60,y:57},{x:60,y:59},{x:40,y:58},{x:80,y:58}]){
    assert.deepEqual(layoutBuildingIcons(markers,size,player,font),groups);
  }
  const moved=layoutBuildingIcons(markers.map(m=>({...m,x:m.x-2.3,y:m.y+1.4})),size,{x:60,y:58},font);
  for(let i=0;i<groups.length;i++){
    assert.ok(Math.abs(moved[i].hitBoxes[0].x-groups[i].hitBoxes[0].x+2.3)<1e-9);
    assert.ok(Math.abs(moved[i].hitBoxes[0].y-groups[i].hitBoxes[0].y-1.4)<1e-9);
  }
  assert.deepEqual(layoutBuildingIcons([markers[0]],size,{x:60,y:58},font)[0].hitBoxes[0],groups[0].hitBoxes[0]);
});

test('both map projections keep buildings fixed as the player approaches and crosses them',()=>{
  const ctx=new Proxy({measureText:text=>({width:text.length*5})},{get:(target,key)=>target[key]??(()=>{})});
  const canvas={width:240,height:240,getContext:()=>ctx};
  const markers=[{kind:'chest',x:0,z:0},{kind:'freechest',x:2,z:1},{kind:'portal',x:30,z:-20}];
  const run={player:{pos:{x:0,z:0}},enemies:{n:0},boss:{alive:false},terrain:{world:600},interactables:{markers:()=>markers},allies:{list:[]}};
  for(const square of [false,true])for(const viewRatio of [1,2])for(let x=-5;x<=5;x+=.25){
    run.player.pos.x=x;
    const center=square?{x:0,z:0}:run.player.pos;
    const {groups}=drawBattleMinimap(canvas,run,{center,square,viewRatio});
    for(let i=0;i<groups.length;i++){
      const icon=groups[i].hitBoxes[0];
      assert.ok(Math.abs(icon.x+icon.w/2-(60+(markers[i].x-center.x)*.9/viewRatio))<1e-9);
      assert.ok(Math.abs(icon.y+icon.h/2-(58+markers[i].z*.9/viewRatio))<1e-9);
    }
  }
});

test('distance cards use two fixed screen slots and resist centre-line jitter',()=>{
  for(const [width,height] of [[320,470],[390,746],[430,834]]){
    for(const side of [-1,1]){
      const slot=sideGuidePosition(side*10,width,height);
      for(const dx of [side*1000,side*3,side*.8,.4,-.4,0])assert.deepEqual(sideGuidePosition(dx,width,height,side),slot);
      const crossed=sideGuidePosition(-side*2,width,height,side);
      assert.equal(crossed.side,-side);assert.equal(crossed.y,slot.y);
      assert.equal(crossed.x+slot.x,width);
    }
    const control={width:70,top:height*.53-35,bottom:height*.53+35};
    const left=sideGuidePosition(-20,width,height,0,control),right=sideGuidePosition(20,width,height,0,control);
    assert.equal(left.y,right.y);
    assert.deepEqual(sideGuidePosition(-20,width,height,0,{width:0,top:0,bottom:0}),left,'First-frame control layout must not move the slot');
    assert.ok(right.y+47<control.top||right.y-32>control.bottom+14+62,'Leave room for both the ultimate and the action ticket');
    assert.ok(right.y-32>=0&&right.y+47<=height,'Keep the complete card inside the viewport');
  }
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
