import {buildAlarmClock,ALARM_CLOCK_BOUNDS} from './workshop-alarm-clock.js';

// These objects sit outside the playable square, face inward, and share the
// desk's instanced geometry/materials. Boundary colliders have no walkable top.
export function* buildDeskBoundary(api){
  const {terrain,prop,mesh,box,roundedBox:rb,ball,ring,cable,assets}=api;
  const books=['#728c91','#c18d72','#8f91ab','#bcad7a','#829c8b','#ab8791'];
  function bookcase(g){
    box(g,0,17,-5.3,30,34,1.4,'#9a846a');
    for(const x of [-14.2,14.2])rb(g,x,17,0,1.6,34,12,'#c6aa81');
    for(const y of [1,11.5,22,33])rb(g,0,y,0,30,1.8,12,'#c6aa81');
    for(let row=0;row<3;row++)for(let i=0;i<7;i++){
      const x=-11.1+i*3.65,h=6.8+(i+row)%3*.7,y=2+row*10.5+h/2,c=books[(i+row*2)%books.length];
      rb(g,x,y,.2,3.15,h,8.9,c);
      box(g,x,y-h*.28,4.7,2.5,.22,.12,'#dfd6bd');
      box(g,x,y+h*.28,4.7,2.5,.22,.12,'#dfd6bd');
      rb(g,x,y+.2,4.74,1.45,2.1,.15,'#e4dbc4');
    }
    rb(g,0,34,0,31.5,1.1,12.8,'#d4bc96');
  }
  function pencilCase(g){
    rb(g,0,14.6,0,25,28.8,11,'#7c9b9c');
    rb(g,0,14.5,5.35,21.6,25,.7,'#a6b9ad');
    rb(g,0,10.2,5.85,18,13,.6,'#e0c9a1');
    cable(g,[[-9.6,3,5.9],[-11,4,5.9],[-11,25,5.9],[-9.6,27,5.9],[9.6,27,5.9],[11,25,5.9],[11,4,5.9],[9.6,3,5.9]],'#657d80',.14);
    for(let i=0;i<14;i++)box(g,-9.1+i*1.4,27,6.05,.65,.5,.2,'#d7c9aa');
    rb(g,8.7,26.6,6.4,1.2,2,.45,'#d7c9aa');ring(g,8.7,24.8,6.4,.85,'#d7c9aa',Math.PI/2);
    cable(g,[[-4,29,0],[-4,31.6,0],[-2.5,33,0],[2.5,33,0],[4,31.6,0],[4,29,0]],'#506b73',.65);
    // One large pencil emblem keeps the upright case legible at gameplay scale.
    rb(g,0,12,6.25,2,9,.3,'#ae8066');
    box(g,0,17,6.25,2,1.2,.3,'#e6d8b8');
    mesh(g,assets.cones,'#675b53',0,6.7,6.25,1.0,2.6,.19,0,0,Math.PI);
  }
  function dinosaur(g){
    const green='#8ca78a',dark='#607f70',cream='#d6cf9f',spine='#ba9973';
    ball(g,-1,12,0,6.8,8.3,4.7,green);
    ball(g,2.2,18,0,3.8,7.2,3.7,green);
    rb(g,4.8,25,0,8.9,7.2,8.4,green);
    rb(g,8.8,23.8,.1,8.2,4.4,8.7,green);
    ball(g,0,11.7,4.15,4.3,6.0,.65,cream);
    mesh(g,assets.cones,green,-9,8,0,2.8,14,2.8,0,0,Math.PI/2-.18);
    for(const x of [-4,2.6]){
      ball(g,x,5.5,0,2.5,5.2,3.2,green);
      rb(g,x+1.5,1.5,1,6.7,2.5,6.4,green);
      for(const z of [-.8,1.1,3])ball(g,x+4.6,1.6,z,.65,.5,.65,cream);
    }
    for(const z of [-3.8,3.8]){
      ball(g,4.1,15.5,z,3.2,1.35,1.35,green);
      ball(g,6.4,14.7,z,1.4,1.7,1.3,green);
      ball(g,5.5,26.1,z*1.13,1.15,1.25,.3,'#f0e7cf');
      ball(g,5.85,26.05,z*1.2,.48,.65,.18,'#3f5651');
      ball(g,11.3,24.9,z*1.15,.31,.35,.15,dark);
      cable(g,[[8,22.5,z*1.17],[10,22.4,z*1.17],[12,22.8,z*1.17]],dark,.12);
    }
    for(const [x,y,size] of [[-12,10,1.4],[-8,13,1.8],[-6,17,1.9],[-4,21,1.8],[0,24,1.6]])
      mesh(g,assets.cones,spine,x,y,0,size,size*2.5,1.2,0,0,.65);
  }
  const types={
    bookcase:{width:32,height:35,build:bookcase},
    'alarm-clock':{width:ALARM_CLOCK_BOUNDS.width,height:ALARM_CLOCK_BOUNDS.height,build:g=>buildAlarmClock(api,g)},
    'pencil-case':{width:26,height:34,build:pencilCase},
    dinosaur:{width:32,height:30,build:dinosaur}
  };
  const inner=terrain.play-2,edge=inner+6,span=edge*2,slots=Math.max(4,Math.round(span/29)),pitch=span/slots;
  terrain.workshopBoundary={edge,inner,height:0,sides:4,groups:[],style:'giant-desk-objects'};
  for(let side=0;side<4;side++){
    const a=side*Math.PI/2,cos=Math.cos(a),sin=Math.sin(a);
    for(let i=0;i<slots;i++){
      // Bookcases anchor both corners and alternate with the larger toys.
      const kind=i===0||i===slots-1||i%2===0?'bookcase':['alarm-clock','pencil-case','dinosaur'][(Math.floor(i/2)+side)%3];
      const spec=types[kind],s=(pitch+.8)/spec.width,along=-edge+(i+.5)*pitch,depth=13*s,radial=inner+depth/2;
      const x=cos*along-sin*radial,z=-sin*along-cos*radial;
      // Width fills the complete side. Depth includes toy feet and handles;
      // all inner faces remain outside the playable square, including corners.
      const g=prop('boundary-'+kind,x,z,pitch+.8,depth,spec.height*s,a);
      g.scale.setScalar(s);spec.build(g);
      terrain.workshopBoundary.height=Math.max(terrain.workshopBoundary.height,spec.height*s);
      terrain.workshopBoundary.groups.push({side,kind,x,z,width:pitch+.8,depth,height:spec.height*s,angle:a});
    }
    yield;
  }
}
