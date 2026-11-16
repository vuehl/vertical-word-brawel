import {I as Group} from '../assets/three-DmSYIDKK.js';
import {latheGeometry} from './handcrafted-geometry.js';

// Real silhouettes, painted faces and very shallow bevels. The drawings are
// authored in object space so they remain attached when the camera moves.
export function illustratedDeskProps(api){
  const {assets,group,prop,mesh,box,roundedBox:rb,cyl,ring,ball,plane,cable,texture,texMat,groundSurface,groundY}=api;
  const TAU=Math.PI*2,cream='#f2e8ce',paper='#f9efd6',ink='#41444c';
  function child(g,x,y,z,a=0){const c=new Group();c.position.set(x,y,z);c.rotation.y=a;g.add(c);return c;}
  function stamp(key,w,h,draw){const m=texMat('illustration-'+key,texture('illustration-'+key,w,h,draw));m.alphaTest=.04;return m;}
  function line(c,points,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function label(c,text,x,y,size,color=ink){c.fillStyle=color;c.font=`600 ${size}px sans-serif`;c.fillText(text,x,y);}
  function rr(c,x,y,w,h,r,color,stroke){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}}
  function paintedTop(g,key,y,w,d,draw,res=768){plane(g,0,y,0,w,d,stamp(key,res,res,draw));}
  function surface(kind,x,z,w,d,a,h,color,draw,key=kind){
    const g=group(x,z,a);rb(g,0,h/2,0,w,h,d,color);
    if(draw)paintedTop(g,key,h+.008,w-.12,d-.12,draw);
    groundSurface(x,z,w,d,a,h+.016,kind);return g;
  }
  function tablet(x,z,s=1,a=-.18){
    const w=17*s,d=18*s,h=.20;
    const g=surface('drawing-tablet',x,z,w,d,a,h,'#333441',(c)=>{
      c.fillStyle='#353844';c.fillRect(0,0,768,768);
      rr(c,112,35,623,700,20,'#3b3d48','#2c303b');
      // Printed active-area corners, a few pencil marks, and a tiny maker seal.
      for(const [xx,yy,sx,sy] of [[141,68,1,1],[705,68,-1,1],[141,704,1,-1],[705,704,-1,-1]])line(c,[[xx+20*sx,yy],[xx,yy],[xx,yy+20*sy]],'#797d85',2);
      line(c,[[197,637],[245,630],[258,614],[274,623],[286,603]],'#676775',1.5);
      label(c,'Z I L I N G',582,733,10,'#929097');
      rr(c,27,80,54,119,6,'#30323e','#202531');rr(c,27,217,54,119,6,'#30323e','#202531');
      rr(c,27,484,54,119,6,'#30323e','#202531');rr(c,27,621,54,60,6,'#30323e','#202531');
      c.strokeStyle='#272b38';c.lineWidth=5;c.beginPath();c.arc(54,408,31,0,TAU);c.stroke();c.lineWidth=2;c.beginPath();c.arc(54,408,11,0,TAU);c.stroke();
      for(const yy of [105,242,512,645])line(c,[[44,yy],[64,yy]],'#71727b',2);
    });
    // A short, slack power cord, drawn as a quiet line behind the keyboard.
    cable(g,[[5,.12,-9*s],[6,.12,-11*s],[5.6,.12,-12*s],[4.6,.12,-12.5*s]],'#494852',.065);
    return g;
  }
  function keyboard(x,z,s=1,a=-.16){
    const g=prop('mechanical-keyboard',x,z,21*s,8*s,1.45*s,a);g.scale.setScalar(s);
    rb(g,0,.45,0,21,.9,8,'#dfd6c1');rb(g,0,.94,0,20.3,.18,7.3,'#33483e');
    const letters=['ESC 1234567890-+','QWERTYUIOP[]','ASDFGHJKL:;','ZXCVBNM<>?'];
    for(let row=0;row<5;row++){
      const count=row===4?13:14;
      for(let col=0;col<count;col++){
        if(row===4&&col>3&&col<9)continue;
        const xx=-9.3+col*1.42,zz=-2.85+row*1.38,width=row===4&&col===3?8.38:1.29;
        const keyX=row===4&&col===3?xx+3.55:xx;
        const color=row===4&&col===3?'#ae515b':col<2||row===4||col>12?'#ece4cf':['#4c7662','#547c66','#426b5b'][(row+col)%3];
        rb(g,keyX,1.16,zz,width,.46,1.23,color);
      }
    }
    const legends=stamp('keyboard-legends',1400,500,c=>{
      c.clearRect(0,0,1400,500);c.textAlign='center';c.font='20px sans-serif';
      for(let row=0;row<4;row++)for(let col=0;col<14;col++){
        c.fillStyle=col<2||col>12?'#596052':'#d3dbc5';
        const text=row===0?(col===0?'Esc':col<10?String(col):['0','−','＋','⌫'][col-10]):(letters[row][col]||'');
        c.fillText(text,48+col*100,43+row*100);
      }
    });
    plane(g,0,1.399,-.03,19.9,6.9,legends);
    cyl(g,9.2,1.15,2.85,.26,.24,'#d4b36b');
    return g;
  }
  function planner(x,z,s=1,a=.18,color='#78618a'){
    const w=14*s,d=19*s,h=.32,g=surface('travel-journal',x,z,w,d,a,h,color,c=>{
      c.fillStyle=color;c.fillRect(0,0,768,768);
      c.strokeStyle='#d9bed1';c.lineWidth=3;c.strokeRect(65,47,656,674);c.lineWidth=1;c.strokeRect(79,60,629,646);
      line(c,[[91,90],[91,683]],'#4f4762',5);
      label(c,'FIELD NOTES',232,152,31,'#eee0ce');label(c,'A LITTLE JOURNEY',242,182,14,'#ded0c3');
      c.strokeStyle='#bba5c5';c.lineWidth=2;c.beginPath();c.arc(409,408,115,0,TAU);c.stroke();
      line(c,[[304,453],[382,341],[423,407],[466,370],[526,453],[304,453]],'#d6becd',3);
      label(c,'NO. 08  /  MEMORIES',262,641,15,'#d7bfae');
    },'travel-journal-'+color);
    for(let i=0;i<11;i++){mesh(g,assets.rings,'#4c4a65',-w*.49,h+.05,-d*.42+i*d*.084,.25,.25,.40,Math.PI/2);}
    // Page edges under the cover are painted strokes, never a stack of slabs.
    for(let i=0;i<3;i++)box(g,0,.08+i*.05,d*.5+.014,w-.4,.012,.025,'#c6b99b');
    return g;
  }
  function paperNote(x,z,s=1,a=0,kind='ticket'){
    const w=kind==='ticket'?8:5,d=kind==='ticket'?3.8:5;
    const g=group(x,z,a),h=groundY(x,z)+.026;g.position.y=h;
    const art=stamp('paper-'+kind,768,512,c=>{
      c.fillStyle=kind==='sticky'?'#ebcd76':'#f7efdb';c.fillRect(0,0,768,512);
      if(kind==='ticket'){
        c.fillStyle='#b95d5c';c.fillRect(0,0,768,75);label(c,'TRAVEL  /  BOARDING PASS',25,49,26,'#fff1dd');
        label(c,'TOKYO',36,177,59);label(c,'08:35',37,252,38);label(c,'GATE  01',299,252,35);label(c,'WINDOW SEAT',299,311,22);
        for(let j=0;j<50;j++){const x=42+j*8;c.fillStyle='#4c5452';c.fillRect(x,365,j%3?3:5,87);}
        line(c,[[570,90],[570,489]],'#b4aca3',2);label(c,'A08',605,218,40);
      }else{
        label(c,'TODAY',58,92,40,'#77684e');line(c,[[56,125],[650,125]],'#b19a60',2);
        for(let i=0;i<4;i++){line(c,[[82,201+i*65],[106,215+i*65],[131,181+i*65]],'#6c7c71',4);line(c,[[162,201+i*65],[510-i*51,201+i*65]],'#a39166',3);}
      }
    });plane(g,0,0,0,w*s,d*s,art);return g;
  }
  function phone(x,z,s=1,a=-.22){
    const g=prop('smartphone',x,z,5*s,9.6*s,.55*s,a);g.scale.setScalar(s);
    rb(g,0,.27,0,5,.54,9.6,'#c78c83');rb(g,0,.56,0,4.75,.10,9.31,'#f0d5b9');
    const screen=stamp('phone-screen',384,768,c=>{
      c.fillStyle='#203b56';c.fillRect(0,0,384,768);
      // Two painted hill silhouettes under a peach sky, no glossy reflection.
      c.fillStyle='#bd8d91';c.fillRect(0,0,384,310);
      for(const [points,color] of [[[[0,360],[80,188],[171,352],[260,224],[384,350],[384,768],[0,768]],'#5b698a'],[[[0,447],[102,341],[204,490],[288,402],[384,479],[384,768],[0,768]],'#384e70']]){c.fillStyle=color;c.beginPath();points.forEach(([x,y])=>c.lineTo(x,y));c.closePath();c.fill();}
      label(c,'09:41',67,137,68,'#f9eddd');label(c,'TUESDAY, 16',94,185,20,'#f9eddd');
      c.fillStyle='#eed0ab';c.beginPath();c.arc(300,236,27,0,TAU);c.fill();
      for(let i=0;i<4;i++)rr(c,30+i*88,657,60,60,16,['#73ada0','#c98081','#d7b46e','#809db0'][i]);
    });plane(g,0,.625,-.10,4.22,7.65,screen);box(g,0,.635,-4.35,.84,.025,.09,'#817c78');cyl(g,0,.63,4.18,.26,.026,'#d5ad96');
    return g;
  }
  function camera(x,z,s=1,a=.16){
    const g=prop('rangefinder-camera',x,z,10.3*s,7.5*s,4.7*s,a);g.scale.setScalar(s);
    rb(g,0,2.35,-.8,10.1,4.7,4.2,'#d1c4a5');rb(g,0,2.14,1.31,9.9,3.10,.22,'#2b6262');
    rb(g,-4.1,2.2,1.48,1.28,3.20,.38,'#264f51');
    cyl(g,-.5,2.3,2.1,2.24,1.8,'#464e57',Math.PI/2);cyl(g,-.5,2.3,3.03,1.93,.23,'#c6b89c',Math.PI/2);
    cyl(g,-.5,2.3,3.22,1.66,.28,'#343e51',Math.PI/2);cyl(g,-.5,2.3,3.38,1.23,.10,'#253448',Math.PI/2);
    ring(g,-.5,2.3,3.46,1.28,'#928f9b',Math.PI/2);ball(g,-.92,2.76,3.49,.36,.29,.02,'#71949a');
    rb(g,3.2,3.77,1.43,1.8,1.03,.13,'#465563');rb(g,3.2,3.77,1.51,1.27,.64,.04,'#8da4a2');
    cyl(g,-3.3,4.78,-.8,.77,.34,'#4d5c5a');cyl(g,3.3,4.82,-.8,.52,.43,'#9b615c');
    box(g,.5,4.72,-.8,1.9,.20,1.1,'#565d60');
    cable(g,[[-5,2,-.1],[-6.3,.16,2],[-6,.16,5.5],[-1,.16,7.1],[4.6,.16,6.1],[5.7,.16,2.8],[5,2,0]],'#73545b',.15);
    return g;
  }
  function mug(x,z,s=1,a=.18,color='#649a91'){
    const g=prop('coffee-cup',x,z,8.6*s,6.7*s,5.4*s,a);g.scale.setScalar(s);
    cyl(g,0,.14,0,3.5,.28,'#e9dcc0');ring(g,0,.30,0,2.9,'#c9bda6');
    mesh(g,assets.cup,color,0,2.85,0,2.52,5,2.52);ring(g,0,5.34,0,2.35,'#efdfc0');
    cyl(g,0,4.82,0,2.06,.08,'#584448');
    mesh(g,assets.rings,color,2.75,3.03,0,1.55,1.6,1.15,Math.PI/2);
    // The badge is a painted front face, matching the cup's local ink.
    mesh(g,assets.planes,stamp('cup-badge',256,256,c=>{
      c.clearRect(0,0,256,256);c.strokeStyle='#dfebd2';c.lineWidth=6;c.beginPath();c.ellipse(128,128,78,90,0,0,TAU);c.stroke();
      label(c,'SLOW',67,118,37,'#e7ead2');label(c,'DAYS',73,158,31,'#e7ead2');
    }),0,2.9,2.515,2.5,2.7,1);
    return g;
  }
  function bottle(x,z,s=1,a=.07){
    assets.milkBottle??=latheGeometry([[0,0],[2.2,0],[2.55,.30],[2.65,1.0],[2.65,5.6],[2.38,6.3],[1.8,7.3],[1.5,7.5],[1.5,8.4],[0,8.4]],32);
    const g=prop('milk-bottle',x,z,5.8*s,5.8*s,9.2*s,a);g.scale.setScalar(s);
    mesh(g,assets.milkBottle,'#f3e3bf',0,0,0,1,1,1);
    const wrap=stamp('milk-label',768,384,c=>{
      c.fillStyle='#334f98';c.fillRect(0,0,768,384);c.fillStyle='#f4e7c7';c.fillRect(0,0,768,42);c.fillRect(0,337,768,47);
      for(let i=0;i<2;i++){const x=45+i*384;label(c,'MILK',x,206,65,'#fff0cc');label(c,'每日鲜奶',x+6,263,27,'#f5e6bb');line(c,[[x,292],[x+228,292]],'#e6c16d',3);}
    });cyl(g,0,3.59,0,2.665,3.9,wrap);
    for(const y of [.85,1.2,6.9,7.5,8.05])ring(g,0,y,0,y<2?2.6:y<7.4?1.98:1.53,'#decea9');
    cyl(g,0,8.6,0,1.65,.65,'#3c5c9c');
    for(let i=0;i<12;i++){const aa=i/12*TAU;box(g,Math.cos(aa)*1.63,8.6,Math.sin(aa)*1.63,.07,.43,.07,'#a8c2c7');}
    mesh(g,assets.cylinders,'#e8e8d8',.3,9.5,0,.16,2.7,.16,0,0,-.13);return g;
  }
  function crate(x,z,s=1,a=.1,color='#8197ab'){
    const g=prop('storage-crate',x,z,10*s,7*s,5*s,a);g.scale.setScalar(s);
    rb(g,0,.35,0,10,.7,7,color);rb(g,0,2.6,-3.1,10,4.8,.7,color);
    for(const xx of [-4.6,4.6])rb(g,xx,2.6,0,.7,4.8,7,color);
    rb(g,0,1.05,3.14,10,1.6,.7,color);rb(g,0,4.62,3.14,10,.75,.7,color);
    for(const xx of [-4.4,-1.6,1.6,4.4])rb(g,xx,2.9,3.14,.55,3.1,.7,color);
    rb(g,0,3.3,3.2,2.8,.48,.9,color);
    // Dark, bounded openings read as inked slots rather than glossy holes.
    for(const xx of [-3,3])rb(g,xx,3.0,2.85,1.6,2.5,.1,'#424f62');
    for(let i=0;i<4;i++)rb(g,-3.2+i*2.1,1.1+i*.16,-.5,1.8,.45,5.2,['#cbb091','#64697c','#c88688','#a7b3a1'][i]);
    rb(g,0,5.05,0,10.4,.28,7.4,'#ede3cb');return g;
  }
  function cuttingMat(x,z,s=1,a=.12,checker=false){
    return surface(checker?'checker-mat':'cutting-mat',x,z,21*s,17*s,a,.06,checker?'#b4b0a0':'#426f65',c=>{
      c.fillStyle=checker?'#f0e7d6':'#47786e';c.fillRect(0,0,768,768);
      if(checker){for(let x=0;x<10;x++)for(let y=0;y<10;y++)if((x+y)%2===0){c.fillStyle='#454b53';c.fillRect(x*76.8,y*76.8,76.8,76.8);}}
      else{
        c.strokeStyle='#97b49b';c.lineWidth=1.3;for(let i=36;i<740;i+=48){line(c,[[i,24],[i,744]],'#90ae96',1.1);line(c,[[24,i],[744,i]],'#90ae96',1.1);}
        c.lineWidth=2;c.strokeRect(23,23,722,722);line(c,[[24,744],[744,24]],'#90ae96',1.5);
        for(let i=1;i<15;i++)label(c,String(i),27+i*48,19,10,'#c0c7a4');
        label(c,'CUTTING MAT / A3',420,735,17,'#c5ccb2');
      }
    },checker?'checker-mat':'cutting-mat');
  }
  function correctionTape(x,z,s=1,a=-.4){
    const g=prop('correction-tape',x,z,5.8*s,3.1*s,1.2*s,a);g.scale.setScalar(s);
    mesh(g,assets.cylinders,'#c5d8d5',0,.55,0,2.95,1.1,1.58);
    mesh(g,assets.cylinders,'#e1e9df',0,1.12,0,2.74,.13,1.4);
    rb(g,-2.7,.45,0,1.7,.55,1.6,'#e8dfc5');
    for(const [xx,r] of [[-1.25,.75],[1.3,1.04]]){cyl(g,xx,1.2,0,r,.13,'#87b5bc');cyl(g,xx,1.28,0,r*.75,.06,'#f1ecd8');ring(g,xx,1.32,0,r*.65,'#d3c7b0');}
    return g;
  }
  function cube(x,z,s=1,a=.1){
    const g=prop('color-cube',x,z,4.6*s,4.6*s,4.6*s,a);g.scale.setScalar(s);
    rb(g,0,2.3,0,4.6,4.6,4.6,'#3e454a');
    const colors=['#cf6564','#e7c66e','#719b6d','#e9dfc4','#618aa3','#d7915c'];
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      rb(g,-1.5+i*1.5,4.63,-1.5+j*1.5,1.33,.07,1.33,colors[(i+j*2)%6]);
      rb(g,-1.5+i*1.5,.8+j*1.5,2.33,1.33,1.33,.07,colors[(i*2+j+2)%6]);
      rb(g,2.33,.8+j*1.5,-1.5+i*1.5,.07,1.33,1.33,colors[(i+j+4)%6]);
    }return g;
  }
  function succulent(x,z,s=1,a=0){
    const g=prop('succulent',x,z,6.7*s,6.7*s,5.7*s,a);g.scale.setScalar(s);
    rb(g,0,.22,0,6.7,.44,6.7,'#c68a9a');mesh(g,assets.cup,cream,0,1.55,0,2.5,2.7,2.5);cyl(g,0,2.89,0,2.15,.08,'#605e5a');
    for(let layer=0;layer<3;layer++)for(let i=0;i<7-layer;i++){
      const aa=i/(7-layer)*TAU+layer*.46,r=1.5-layer*.44;
      mesh(g,assets.spheres,['#60937e','#81a183','#a7b78c'][layer],Math.cos(aa)*r,3.25+layer*.7,Math.sin(aa)*r,.55,.45,1.45-layer*.29,.3,Math.PI/2-aa,.18);
    }return g;
  }
  function paintTube(x,z,s=1,a=.45){
    const g=prop('paint-tube',x,z,3.2*s,8.2*s,1.65*s,a);g.scale.setScalar(s);
    rb(g,0,.8,-.4,3.1,1.6,6.6,'#f0e5d2');rb(g,0,.75,-3.8,3.2,.60,.4,'#c68e9a');
    rb(g,0,.88,-1,3.15,1.63,2.7,'#ba6f97');cyl(g,0,.8,3.45,1.04,1.2,'#ded7c9',Math.PI/2);
    const art=stamp('paint-tube-label',256,256,c=>{c.fillStyle='#bf719a';c.fillRect(0,0,256,256);rr(c,27,25,202,135,5,'#f3e4bb');label(c,'COLOUR',43,77,27,'#745275');label(c,'08',93,131,44,'#745275');label(c,'GOUACHE',42,218,26,'#f7e6d3');});
    plane(g,0,1.705,-1,2.7,2.6,art);return g;
  }
  function headphones(x,z,s=1,a=.2){
    const g=prop('headphones',x,z,10*s,9*s,2.7*s,a);g.scale.setScalar(s);
    const points=Array.from({length:30},(_,i)=>{const a=Math.PI*.98+i/29*Math.PI*1.04;return [Math.cos(a)*4.0,.7,Math.sin(a)*4.5];});
    cable(g,points,'#65617c',.42);cable(g,points.map(([x,y,z])=>[x,y+.3,z]),'#b5a4b9',.12);
    for(const x of [-4,4]){rb(g,x,1.1,1.1,2.5,2.2,4.0,'#504f64');rb(g,x,2.25,1.1,2.17,.35,3.6,'#a297b6');}
    cable(g,[[4,.4,3],[6,.12,4],[6.4,.12,7],[3,.12,8],[1,.12,6]],'#575b6a',.075);return g;
  }
  function fan(x,z,s=1,a=-.12){
    const g=prop('wire-desk-fan',x,z,7.2*s,4.3*s,9*s,a);g.scale.setScalar(s);
    rb(g,0,.3,0,5.4,.6,3.6,'#9faba8');rb(g,0,2.4,-.55,.8,4,.65,'#adb9af');
    cyl(g,0,5.7,0,.7,1.7,'#8a9b94',Math.PI/2);
    for(let i=0;i<3;i++){const aa=i/3*TAU;mesh(g,assets.spheres,'#a7b9b2',Math.cos(aa)*1.4,5.7+Math.sin(aa)*1.4,.25,1.45,.63,.10,0,0,aa+.4);}
    for(const rr of [1.2,2.2,3.1,3.4])ring(g,0,5.7,.62,rr,'#788c8b',Math.PI/2);
    for(let i=0;i<12;i++){const aa=i/12*TAU;cable(g,[[0,5.7,.92],[Math.cos(aa)*1.5,5.7+Math.sin(aa)*1.5,.85],[Math.cos(aa)*3.4,5.7+Math.sin(aa)*3.4,.62]],'#8d9f98',.037);}
    cyl(g,0,5.7,.96,.6,.22,'#d1c9b2',Math.PI/2);return g;
  }
  function laptop(x,z,s=1,a=-.18){
    const g=prop('laptop',x,z,16*s,13*s,8.7*s,a);g.scale.setScalar(s);
    rb(g,0,.25,0,16,.5,11,'#b1b2b6');rb(g,0,.54,-1.6,14,.12,6,'#525865');
    for(let row=0;row<4;row++)for(let col=0;col<12;col++)rb(g,-6.35+col*1.15,.67,-3.7+row*1.36,1.0,.20,1.05,'#3c4351');
    rb(g,0,.57,3.0,5,.04,2.8,'#a1a7ad');
    const screen=child(g,0,.46,-5.0);screen.rotation.x=-.18;
    rb(screen,0,4.1,0,16,8.2,.48,'#474a5a');
    mesh(screen,assets.planes,stamp('laptop-screen',1024,512,c=>{
      c.fillStyle='#2b394c';c.fillRect(0,0,1024,512);
      c.fillStyle='#657c91';c.fillRect(36,30,952,35);label(c,'SKETCHBOOK  /  untitled',59,55,18,'#e1dac9');
      c.fillStyle='#c6a49b';c.fillRect(270,96,600,343);
      c.fillStyle='#8a90aa';c.beginPath();c.moveTo(270,439);c.lineTo(440,190);c.lineTo(610,363);c.lineTo(713,249);c.lineTo(870,439);c.fill();
      for(let i=0;i<6;i++)rr(c,59+i%3*52,109+Math.floor(i/3)*53,39,39,4,['#e7bf8a','#ae7490','#74988c','#5c6988','#adbdac','#dbd1b2'][i]);
      for(let i=0;i<6;i++)line(c,[[60,276+i*24],[206,276+i*24]],'#a9adbc',3);
    }),0,4.15,.255,15.15,7.35,1);return g;
  }
  return {tablet,keyboard,planner,paperNote,phone,camera,mug,bottle,crate,cuttingMat,correctionTape,cube,succulent,paintTube,headphones,fan,laptop};
}
