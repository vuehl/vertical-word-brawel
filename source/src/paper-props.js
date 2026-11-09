import {I as Group,K as Mesh,_ as BoxGeometry,E as CylinderGeometry,T as ConeGeometry,J as Material} from '../assets/three-DmSYIDKK.js';
import {paperPropNames} from './paper-prop-names.js';

// Preserve named moving parts used by chests, gates and destructible cover.
// Interactive scenery uses the same handmade stationery language as the map.
const supported=new Set(paperPropNames);
export function paperProp(name){
  if(!supported.has(name))return null;
  const group=new Group();group.name='paper-'+name;
  const materials=new Map();
  function mat(color){if(!materials.has(color)){const m=new Material({color});m.userData.owned=true;materials.set(color,m);}return materials.get(color);}
  function part(g,geo,x,y,z,color,label){const m=new Mesh(geo,mat(color));m.position.set(x,y,z);if(label)m.name=label;g.add(m);return m;}
  const box=(g,x,y,z,w,h,d,c,n)=>part(g,new BoxGeometry(w,h,d),x,y,z,c,n);
  const cyl=(g,x,y,z,r,h,c,n)=>part(g,new CylinderGeometry(r,r,h,24),x,y,z,c,n);
  if(name.includes('pillar')){
    const column=new Group();column.name='Column';group.add(column);
    cyl(column,0,2.4,0,.85,4.6,'#ddbb75');cyl(column,0,4.5,0,.91,.5,'#b9c6c1');cyl(column,0,4.9,0,.88,.4,'#e3a0aa');
    const stub=cyl(group,0,.6,0,.87,1.2,'#d1bd8b','Stub');stub.visible=false;
  }else if(name.includes('gate')||name.includes('portal')){
    for(const x of [-2.45,2.45]){box(group,x,2.5,0,1,5,1.5,'#90aca5');box(group,x,5.05,0,1.15,.3,1.6,'#c3ad77');}
    box(group,0,5.4,0,6,.6,1.5,'#e4ce8c');box(group,0,.16,0,6.2,.3,2.4,'#b2c2b8');
  }else if(name.includes('pencils')){
    cyl(group,0,2,0,1.8,4,'#8da4ac');cyl(group,0,4.08,0,1.5,.05,'#526774');
    for(let i=0;i<5;i++){const x=Math.cos(i*2.4),z=Math.sin(i*2.4);cyl(group,x,7,z,.22,9,['#e2b769','#b3ceaa','#c8a2c1'][i%3]);part(group,new ConeGeometry(.22,.8,12),x,11.9,z,'#d4c193');}
  }else if(name.includes('lamp')){cyl(group,0,.1,0,.65,.2,'#a3bfae');cyl(group,0,1.5,0,.14,2.8,'#7c8f91');cyl(group,0,2.9,0,.65,.4,'#efcf82');}
  else if(name.includes('root')||name.includes('bramble')){
    for(let i=0;i<4;i++){const m=box(group,(i-1.5)*.8,1.3,0,.6,2.5,.6,'#b6c49c','Pod'+i);m.rotation.z=(i-1.5)*.18;}
  }else if(name.includes('chest')){
    box(group,0,.55,0,2.2,1.1,1.5,'#b1cfc1');const lid=new Group();lid.name='Lid';lid.position.set(0,1.1,-.75);group.add(lid);
    box(lid,0,.16,.75,2.35,.32,1.65,name==='cursedchest'?'#b5a4c3':'#ddbd76');box(group,0,.8,.8,.42,.5,.14,'#f3e5b7');
  }else if(name==='slots'||name==='billpc'){
    box(group,0,1.5,0,2.6,3,1.5,'#a6bcb2');box(group,0,2,.8,2,.9,.12,'#f4ecd5');
    for(let i=-1;i<=1;i++)box(group,i*.6,2,.9,.32,.65,.1,['#da976f','#8bb9b2','#c4afcf'][i+1]);
    cyl(group,1.6,1.5,0,.12,1.5,'#9a9f91','Lever');cyl(group,1.6,2.3,0,.3,.3,'#d9a4ae');
  }else {
    // Memo stacks and ink stamps replace altars, nests and stones.
    const tall=name==='shrine'?1.5:1;
    box(group,0,.2,0,3.1,.4,2.8,'#899f9c');
    for(let i=0;i<5;i++)box(group,.08*(i%2),(.5+i*.24)*tall,0,2.8,.21*tall,2.6,i%2?'#efe5c8':'#e0dabb');
    cyl(group,0,2.1*tall,0,.7,1.4*tall,'#a4776b','Cap');cyl(group,0,2.8*tall,0,1,.25,'#cdb995');
  }
  return group;
}
