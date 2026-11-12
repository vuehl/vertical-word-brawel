import {b as CanvasTexture,ot as SRGB} from '../assets/three-DmSYIDKK.js';

// Semantic cell numbers stay compatible with every combat script. All combat
// silhouettes are now antialiased Bezier paths, never enlarged pixel drawings.
export const EFFECT_CELL=128;
export const PAINT_SHAPES=Object.freeze({splash:141,stroke:142,drop:143});
const TAU=Math.PI*2;
export const effectColors={fire:0xff641c,water:0x169bea,grass:0x63c848,electric:0xffcc20,ice:0x57cbe8,ground:0xc99560,rock:0xa88764,steel:0x9db6cc,poison:0xb55ae0,ghost:0x9b88ce,psychic:0xe46fdb,fairy:0xf782bd,bug:0xa7c665,flying:0x5dd7d6,dragon:0x8995da,dark:0x8a739e,fighting:0xe8a276,normal:0xffcf89};
export const effectShapes={fire:5,water:15,grass:4,electric:8,ice:7,ground:9,rock:9,steel:29,poison:28,ghost:31,psychic:13,fairy:10,bug:4,flying:24,dragon:32,dark:19,fighting:18,normal:2};
const aliases={33:5,34:0,35:17,36:29,37:30,38:5,39:19,40:8,41:9,42:15,43:18,44:16,45:23,46:26,47:29,48:28,49:6,50:12,51:7,63:27,64:4,65:24,66:29,67:1,68:22,69:23,70:4,71:17,72:28,73:28,74:10,75:13,76:21,77:9,78:25,79:4,80:28,81:19,82:12,83:13,84:27,85:32,126:6,127:0,128:6,129:13,130:19,131:15,132:6,138:6};
const tinted={33:'#ff883f',34:'#e8dcc7',35:'#fff1d0',36:'#f5d5a2',37:'#fff0d8',38:'#f5a45c',39:'#fff7d9',40:'#ffd45c',41:'#b99b79',42:'#60b9eb',43:'#ffc575',44:'#ffdab2',45:'#8cdbed',46:'#c39c70',47:'#b5ddf2',48:'#b5cb6d',49:'#a2e3f0',50:'#ddd0f1',51:'#caf2f6',63:'#9ab97b',64:'#8cc575',65:'#d5f1e5',66:'#eecb75',67:'#ffe390',68:'#ffe2a9',69:'#d4e9e7',70:'#d0a0e9',71:'#ffe8c9',72:'#c38ada',73:'#b29bcf',74:'#f7bad0',75:'#c4e5df',76:'#ffdc83',77:'#dcb888',78:'#ffeab9',79:'#f4b7cf',80:'#b2bf70',81:'#d6d8e2',82:'#f7b8d7',83:'#cab7ec',84:'#b9dced',85:'#e497c6',126:'#69bdee',127:'#e3f5ed',128:'#85cde8',129:'#88cce3',130:'#c6f0f1',131:'#a2def2',132:'#6fb8dc',138:'#fff0ce'};

function path(c,d,fill=true){c.beginPath();d(c);fill?c.fill():c.stroke();}
function star(c,points=4,outer=27,inner=7){path(c,c=>{for(let j=0;j<points*2;j++){const a=j*Math.PI/points-Math.PI/2,r=j%2?inner:outer;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();});}
function ellipse(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function paint(c,shape,color){
  c.lineCap=c.lineJoin='round';c.lineWidth=3;c.fillStyle=color;c.strokeStyle=color;
  const gradient=c.createLinearGradient(-18,-27,17,28);gradient.addColorStop(0,'#fff6dc');gradient.addColorStop(.22,'#fff6dc');gradient.addColorStop(.23,color);gradient.addColorStop(1,color);
  switch(shape){
    case 141:{
      c.fillStyle='#c4c9d0';
      for(let j=0;j<7;j++){
        const a=j*2.399+.2,r=20+(j%3)*3,x=Math.cos(a)*r,y=Math.sin(a)*r;
        c.lineWidth=2.2+(j%3);c.strokeStyle='#dce0e4';path(c,c=>{c.moveTo(Math.cos(a)*6,Math.sin(a)*6);c.quadraticCurveTo(x*.66-y*.12,y*.66+x*.12,x,y);},false);
        ellipse(c,x,y,1.8+(j%3)*.8,1.5+(j%2));
      }
      const points=Array.from({length:24},(_,j)=>{const a=j/24*TAU,r=14+Math.sin(j*2.3)*2.8+Math.cos(j*1.4)*1.8;return [Math.cos(a)*r,Math.sin(a)*r];});
      c.fillStyle='#ffffff';path(c,c=>{const last=points[23],first=points[0];c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);for(let j=0;j<points.length;j++){const p=points[j],q=points[(j+1)%points.length];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}c.closePath();});
      c.save();c.globalCompositeOperation='destination-out';for(let j=0;j<11;j++){const a=j*2.4,r=4+(j%4)*3;ellipse(c,Math.cos(a)*r,Math.sin(a)*r,.55+(j%3)*.3,.4+(j%2)*.25);}c.restore();break;
    }
    case 142:{
      c.fillStyle='#e3e6eb';path(c,c=>{c.moveTo(-29,5);c.bezierCurveTo(-13,-13,7,-18,29,-8);c.lineTo(24,-2);c.quadraticCurveTo(0,-7,-22,12);c.lineTo(-16,4);c.closePath();});
      c.strokeStyle='#ffffff';c.lineWidth=2.1;path(c,c=>{c.moveTo(-25,6);c.quadraticCurveTo(1,-12,25,-7);},false);
      for(let j=0;j<4;j++)ellipse(c,-18+j*11,10-j*3,1.1,.7);break;
    }
    case 143:c.fillStyle='#ffffff';path(c,c=>{c.moveTo(-3,-25);c.bezierCurveTo(-4,-9,-14,-2,-10,9);c.bezierCurveTo(-6,22,11,19,12,7);c.quadraticCurveTo(13,-1,-3,-25);});c.fillStyle='#bbc5d0';ellipse(c,2,10,5,3);break;
    case 140:c.strokeStyle=color+'b0';c.lineWidth=1.3;for(let j=0;j<5;j++){c.save();c.rotate(j*TAU/5);path(c,c=>{c.moveTo(-13,-24);c.bezierCurveTo(22,-18,-25,2,4,12);c.quadraticCurveTo(20,22,25,9);},false);c.restore();}break;
    case 139:{const g=c.createLinearGradient(-14,-28,7,29);g.addColorStop(0,color+'00');g.addColorStop(.45,color+'8a');g.addColorStop(.8,color);g.addColorStop(1,color+'bb');c.fillStyle=g;path(c,c=>{c.moveTo(-6,29);c.bezierCurveTo(-29,20,-22,-3,8,-29);c.bezierCurveTo(-1,-8,23,0,13,16);c.quadraticCurveTo(8,28,-6,29);});break;}
    case 0:{c.fillStyle=color;path(c,c=>{for(let j=0;j<28;j++){const a=j/28*TAU,r=23+Math.sin(j*2.4)*3;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();});break;}
    case 1:star(c,9,28,11);break;
    case 2:case 25:star(c,4,29,5);c.fillStyle='#fff9e6';star(c,4,16,3);break;
    case 3:c.lineWidth=3;path(c,c=>c.arc(0,0,24,0,TAU),false);break;
    case 4:case 24:c.fillStyle=gradient;path(c,c=>{c.moveTo(-24,24);c.bezierCurveTo(-29,-3,-5,-24,26,-26);c.bezierCurveTo(29,3,10,28,-24,24);});c.strokeStyle='#fff4d4a0';c.lineWidth=1.4;path(c,c=>{c.moveTo(-20,20);c.quadraticCurveTo(0,0,23,-22);},false);break;
    case 5:c.fillStyle=gradient;path(c,c=>{c.moveTo(0,29);c.bezierCurveTo(-31,29,-30,2,-16,-12);c.quadraticCurveTo(-18,4,-8,6);c.bezierCurveTo(1,-5,-6,-18,8,-29);c.bezierCurveTo(3,-8,28,-2,23,15);c.quadraticCurveTo(20,29,0,29);});c.fillStyle='#ffe8a2';path(c,c=>{c.moveTo(0,25);c.bezierCurveTo(-14,18,-8,8,1,-3);c.quadraticCurveTo(0,10,10,14);c.quadraticCurveTo(15,26,0,25);});break;
    case 6:c.fillStyle=gradient;ellipse(c,0,0,25,25);c.fillStyle='#ffffff66';ellipse(c,-10,-10,5,8);break;
    case 7:c.lineWidth=3.2;for(let j=0;j<6;j++){c.save();c.rotate(j*Math.PI/3);path(c,c=>{c.moveTo(0,0);c.lineTo(0,-27);c.moveTo(-6,-14);c.lineTo(0,-20);c.lineTo(6,-14);},false);c.restore();}break;
    case 8:path(c,c=>{c.moveTo(7,-29);c.quadraticCurveTo(-8,-15,-18,4);c.lineTo(-2,2);c.lineTo(-8,29);c.quadraticCurveTo(7,14,20,-6);c.lineTo(4,-4);c.closePath();});break;
    case 9:case 29:case 32:c.fillStyle=gradient;path(c,c=>{c.moveTo(-24,0);c.lineTo(-11,-23);c.quadraticCurveTo(1,-28,13,-18);c.lineTo(27,4);c.lineTo(9,24);c.lineTo(-15,22);c.closePath();});c.fillStyle='#ffffff35';path(c,c=>{c.moveTo(-11,-23);c.lineTo(2,0);c.lineTo(-15,22);c.lineTo(-24,0);});break;
    case 10:path(c,c=>{c.moveTo(0,26);c.bezierCurveTo(-45,0,-23,-38,0,-15);c.bezierCurveTo(23,-38,45,0,0,26);});break;
    case 11:case 21:case 31:ellipse(c,0,-3,24,22);path(c,c=>{c.moveTo(-19,6);c.lineTo(-22,27);c.quadraticCurveTo(-11,16,-4,27);c.quadraticCurveTo(6,16,20,26);c.lineTo(19,6);});c.fillStyle='#eae1ffb0';ellipse(c,-8,-7,4,6);ellipse(c,8,-7,4,6);break;
    case 12:c.lineWidth=5;path(c,c=>{c.moveTo(2,16);c.lineTo(2,-24);c.quadraticCurveTo(14,-15,23,-18);},false);ellipse(c,-8,17,12,8);break;
    case 13:c.lineWidth=4;path(c,c=>{for(let j=0;j<=100;j++){const a=j/100*TAU*2,r=2+j/100*25;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}},false);break;
    case 14:c.fillStyle=gradient;c.beginPath();c.roundRect(-21,-21,42,42,10);c.fill();break;
    case 15:c.fillStyle=gradient;path(c,c=>{c.moveTo(0,-29);c.bezierCurveTo(-7,-12,-26,2,-22,15);c.bezierCurveTo(-17,35,17,35,22,15);c.bezierCurveTo(26,2,7,-12,0,-29);});c.fillStyle='#ffffff70';ellipse(c,-8,13,4,8);break;
    case 16:for(let j=0;j<3;j++){c.save();c.translate((j-1)*15,0);c.rotate(-.2);path(c,c=>{c.moveTo(-2,27);c.quadraticCurveTo(-8,0,7,-28);c.quadraticCurveTo(0,2,4,22);});c.restore();}break;
    case 17:for(const x of [-13,13])path(c,c=>{c.moveTo(x-8,-22);c.quadraticCurveTo(x-13,2,x,28);c.quadraticCurveTo(x+11,0,x+8,-22);});break;
    case 18:case 30:c.fillStyle=gradient;c.beginPath();c.roundRect(-23,-19,46,43,13);c.fill();for(let j=0;j<4;j++){c.strokeStyle='#fff5db88';path(c,c=>{c.moveTo(-15+j*10,-13);c.lineTo(-15+j*10,0);},false);}break;
    case 19:case 22:path(c,c=>{c.moveTo(22,-27);c.bezierCurveTo(-41,-11,-32,27,24,23);c.bezierCurveTo(-4,20,-6,-5,22,-27);});break;
    case 20:c.lineWidth=8;path(c,c=>{c.moveTo(-21,-21);c.lineTo(21,21);c.moveTo(21,-21);c.lineTo(-21,21);},false);break;
    case 23:c.lineWidth=3;for(const r of [12,21,29])path(c,c=>c.arc(0,0,r,-1.1,1.1),false);break;
    case 26:c.lineWidth=2.5;for(let j=0;j<6;j++){c.save();c.rotate(j*TAU/6);path(c,c=>{c.moveTo(0,0);c.quadraticCurveTo(4,-9,-3,-16);c.lineTo(0,-28);},false);c.restore();}break;
    case 27:c.lineWidth=7;path(c,c=>{c.moveTo(-20,27);c.bezierCurveTo(24,8,-15,-5,16,-28);},false);break;
    case 28:ellipse(c,0,0,19,17);for(let j=0;j<5;j++){const a=j*TAU/5;ellipse(c,Math.cos(a)*22,Math.sin(a)*22,5,5);}break;
    default:star(c,4,25,10);
  }
}
export function createStylizedEffectAtlas(){
  const canvas=document.createElement('canvas');canvas.width=EFFECT_CELL*8;canvas.height=EFFECT_CELL*18;
  const out=canvas.getContext('2d');out.imageSmoothingEnabled=true;
  const cell=document.createElement('canvas');cell.width=cell.height=EFFECT_CELL;const c=cell.getContext('2d');
  const ink=document.createElement('canvas');ink.width=ink.height=EFFECT_CELL;const ic=ink.getContext('2d');
  for(let i=0;i<144;i++){
    c.clearRect(0,0,EFFECT_CELL,EFFECT_CELL);c.save();c.translate(EFFECT_CELL*.5,EFFECT_CELL*.5);c.scale(EFFECT_CELL/64,EFFECT_CELL/64);
    if(i>=52&&i<=55){c.fillStyle='#edc569';ellipse(c,0,0,i===54?7:24,26);c.strokeStyle='#fff0b4';c.lineWidth=3;path(c,c=>c.ellipse(0,0,i===54?3:18,20,0,0,TAU),false);}
    else paint(c,i>=140?i:i===33||i===38?139:aliases[i]??(i<33?i:29),tinted[i]||'#ffffff');c.restore();
    if(i<52||i>55){
      ic.clearRect(0,0,EFFECT_CELL,EFFECT_CELL);ic.globalCompositeOperation='source-over';
      for(const [x,y] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1]])ic.drawImage(cell,x,y);
      ic.globalCompositeOperation='source-in';ic.fillStyle='#27334b';ic.fillRect(0,0,EFFECT_CELL,EFFECT_CELL);
      ic.globalCompositeOperation='source-over';ic.drawImage(cell,0,0);
      ic.globalCompositeOperation='source-atop';ic.fillStyle='#27334b26';
      for(let y=70;y<122;y+=9)for(let x=7+(y%2)*4;x<122;x+=9){ic.beginPath();ic.arc(x,y,1.1,0,TAU);ic.fill();}
      ic.strokeStyle='#ffffff66';ic.lineWidth=.9;for(let j=0;j<9;j++){const x=13+j*11;ic.beginPath();ic.moveTo(x,19+j%3*9);ic.lineTo(x-4,30+j%3*9);ic.stroke();}
      out.drawImage(ink,i%8*EFFECT_CELL,Math.floor(i/8)*EFFECT_CELL);
    }else out.drawImage(cell,i%8*EFFECT_CELL,Math.floor(i/8)*EFFECT_CELL);
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;texture.magFilter=1006;texture.minFilter=1008;texture.generateMipmaps=true;
  texture.name='smooth-handcrafted-combat-atlas';texture.userData={cell:EFFECT_CELL,style:'ink-cel-combat-v3'};return texture;
}
