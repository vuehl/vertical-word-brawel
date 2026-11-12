import assert from 'node:assert/strict';
import test from 'node:test';
import {acceptPeerSample,advancePeerMotion} from '../source/src/peer-motion.js';

test('15 Hz snapshots under jitter, delay burst and a skipped packet',()=>{
  const peer={buf:[],x:0,y:0,z:0,stage:1},packets=[];
  for(let i=0;i<75;i++){
    if(i===22)continue;
    const ts=i/15,arrival=ts+.04+([0,.02,0,.01][i%4])+(i===48?.12:0);
    packets.push({ts,arrival,x:ts*8,y:0,z:0,face:0});
  }
  packets.sort((a,b)=>a.arrival-b.arrival);
  let previous=0,cursor=-Infinity;
  for(let frame=0;frame<290;frame++){
    const now=frame/60;
    while(packets.length&&packets[0].arrival<=now){
      const sample=packets.shift();acceptPeerSample(peer,sample,1,sample.arrival);
    }
    advancePeerMotion(peer,now,1/60);
    if(!peer.buf.length)continue;
    assert.ok(peer.cursor>=cursor);cursor=peer.cursor;
    assert.ok(peer.x>=previous-.01 && peer.x-previous<.6,'continuous movement');
    if(now>.5)assert.ok(now*8-peer.x<2.8,'bounded display lag');
    previous=peer.x;
  }
  // A new stage or teleport resets the path, with no slide across the map.
  const ts=6;
  acceptPeerSample(peer,{ts,x:-70,y:2,z:-30,face:1},2,ts+.04);peer.stage=2;
  advancePeerMotion(peer,ts+.04,1/60);assert.equal(peer.x,-70);
});

