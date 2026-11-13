import {I as Group} from '../assets/three-DmSYIDKK.js';
import {latheGeometry} from './handcrafted-geometry.js';

// A quiet enamel version of the classic twin-bell silhouette. Its face points
// toward local +Z; the caller turns the whole clock toward the centre of the desk.
export const ALARM_CLOCK_BOUNDS={width:24,depth:12,height:32,lean:-.12};

export function buildAlarmClock(api,parent){
  const {mesh,ball,cyl,ring,roundedBox,cable,texture,texMat,mat,assets}=api;
  const shell=mat('alarm-clock-enamel',{color:0x4c8588,roughness:.4,metalness:.16});
  const edge=mat('alarm-clock-edge',{color:0x365e67,roughness:.46,metalness:.2});
  const silver=mat('alarm-clock-silver',{color:0xa7b5b1,roughness:.38,metalness:.48});
  const slate=mat('alarm-clock-hands',{color:0x354c55,roughness:.55,metalness:.1});
  const pad=mat('alarm-clock-foot-pads',{color:0x43545a,roughness:.95});

  // The two splayed feet carry the tilted case without a floating lower edge.
  for(const sign of [-1,1]){
    cable(parent,[[sign*5.5,5.1,.2],[sign*6.2,2.8,.8],[sign*7.1,.55,1.6]],silver,.38);
    ball(parent,sign*7.1,.28,1.6,.69,.28,.72,pad);
  }
  const body=new Group();body.position.set(0,13,0);body.rotation.x=ALARM_CLOCK_BOUNDS.lean;parent.add(body);
  cyl(body,0,0,0,10,5.2,shell,Math.PI/2);
  cyl(body,0,0,-2.63,9.35,.16,edge,Math.PI/2);
  // Nested rims give the clock its rounded enamel case and narrow silver lip.
  ring(body,0,0,2.45,9.5,shell,Math.PI/2);
  mesh(body,assets.rings,silver,0,0,2.95,9.05,.32,9.05,Math.PI/2);
  const dial=texture('alarm-clock-dial',768,768,(c,w,h)=>{
    c.fillStyle='#eee4c9';c.fillRect(0,0,w,h);c.translate(w/2,h/2);
    const radius=w*.5;
    c.strokeStyle='#c6c9b7';c.lineWidth=1.5;c.beginPath();c.arc(0,0,radius*.91,0,Math.PI*2);c.stroke();
    c.strokeStyle='#87938b';c.lineWidth=2;
    for(let i=0;i<60;i++){
      if(i%5===0)continue;
      const a=i*Math.PI/30,inner=radius*.861,outer=radius*.891;
      c.beginPath();c.moveTo(Math.sin(a)*inner,-Math.cos(a)*inner);c.lineTo(Math.sin(a)*outer,-Math.cos(a)*outer);c.stroke();
    }
    // A faint second ring keeps the large cream centre calm and legible.
    c.strokeStyle='#d8d7c4';c.lineWidth=1;c.beginPath();c.arc(0,0,radius*.64,0,Math.PI*2);c.stroke();
  });
  const dialMaterial=texMat('alarm-clock-dial',dial,.87);
  // A small warm fill preserves the cream dial inside the cool corner shadow.
  dialMaterial.emissive.set(0xd8ccb0);dialMaterial.emissiveIntensity=.16;
  cyl(body,0,0,2.98,8.98,.17,dialMaterial,Math.PI/2);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,major=i%3===0;
    mesh(body,assets.bevels,slate,Math.sin(a)*7.65,Math.cos(a)*7.65,3.16,major?.38:.28,major?1.2:.97,.16,0,0,-a);
  }
  // A long minute hand and shorter hour hand echo the reference's simple dial.
  for(const [angle,length,width,z] of [[-.04,6.25,.28,3.38],[Math.PI*7/6,4.6,.42,3.56]]){
    mesh(body,assets.bevels,slate,Math.sin(angle)*length*.43,Math.cos(angle)*length*.43,z,width,length,.16,0,0,-angle);
  }
  cyl(body,0,0,3.72,.55,.24,silver,Math.PI/2);
  cyl(body,0,0,3.87,.23,.12,slate,Math.PI/2);

  // The dome profile stays open at its lower edge, unlike a ball-shaped bell.
  assets.alarmBell??=latheGeometry([[0,-1.45],[3.72,-1.45],[4.15,-1.35],[4.18,-1.05],[3.95,-.52],[3.47,.45],[2.65,1.45],[1.52,2.15],[.42,2.46],[0,2.46]],48);
  for(const sign of [-1,1]){
    cable(body,[[sign*5.7,7.2,0],[sign*6.2,11.65,0]],silver,.29);
    const bell=new Group();bell.position.set(sign*6.8,12.2,0);bell.rotation.z=-sign*.24;body.add(bell);
    mesh(bell,assets.alarmBell,shell,0,0,0,1,1,1);
    mesh(bell,assets.rings,silver,0,-1.3,0,4.13,.4,4.13);
    cyl(bell,0,2.75,0,.31,.75,silver);
    ball(bell,0,3.2,0,.46,.3,.46,silver);
  }
  const handle=[];
  for(let i=0;i<=40;i++){
    const t=i/40,a=Math.PI*(1-t);
    handle.push([5.7*Math.cos(a),12.6+5.25*Math.sin(a),-.5]);
  }
  cable(body,handle,silver,.3);
  cable(body,[[0,10.2,.25],[0,13.2,.25]],silver,.2);
  roundedBox(body,0,13.45,.25,2.3,.58,.65,edge);
  // Small winding details remain on the rear, visible when approaching the wall.
  cyl(body,-2.8,-.8,-3.02,.85,.7,silver,Math.PI/2);
  cyl(body,2.1,1.8,-3.02,.58,.65,silver,Math.PI/2);
  roundedBox(body,-2.8,-.8,-3.48,2.3,.62,.25,silver);
  return {...ALARM_CLOCK_BOUNDS};
}
