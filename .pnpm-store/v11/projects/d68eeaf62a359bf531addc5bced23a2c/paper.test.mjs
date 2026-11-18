import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupRadius,inPickupRange,pickupSpeed,pickupArrived} from '../source/src/paper-pickups.js';
import fs from 'node:fs';
import {configureGlyphNames,glyphText,glyphSpeciesFromImage} from '../source/src/zixing-identity.js';
import {glyphWordForSpecies} from '../source/src/paper-glyph-art.js';
import {specialMapMarker} from '../source/src/paper-hud-art.js';

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
  const actors=JSON.parse(fs.readFileSync(new URL('../source/public/data/pokemon.json',import.meta.url),'utf8'));
  const locale=JSON.parse(fs.readFileSync(new URL('../source/public/data/i18n/zh.json',import.meta.url),'utf8'));
  configureGlyphNames(actors,locale.pokemon);
  for(const actor of actors){
    assert.equal(glyphText(actor.name),glyphWordForSpecies(actor.id));
    if(locale.pokemon[actor.id])assert.equal(glyphText(locale.pokemon[actor.id]),glyphWordForSpecies(actor.id));
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
