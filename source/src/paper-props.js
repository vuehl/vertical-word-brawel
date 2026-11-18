import {I as Group,K as Mesh,_ as BoxGeometry,E as CylinderGeometry,WorkshopStandardMaterial as Material} from '../assets/three-DmSYIDKK.js';
import {stabiliseWorkshopBump} from './workshop-materials.js';
import {paperPropNames} from './paper-prop-names.js';

// Preserve named moving parts used by chests, gates and destructible cover.
// Interactive scenery uses the same handmade stationery language as the map.
const supported=new Set(paperPropNames);
export function paperProp(name){
  if(!supported.has(name))return null;
  const group=new Group();group.name='paper-'+name;
  const materials=new Map();
  const vivid={'#b1cfc1':'#238c9d','#ddbd76':'#e6b147','#a6bcb2':'#267c91','#f4ecd5':'#f6d68c','#90aca5':'#258b9b','#e4ce8c':'#e4b349','#b2c2b8':'#1f647b','#d1bd8b':'#c99754','#b6c49c':'#6fbd92','#a3bfae':'#289aa8','#efcf82':'#ffcd6a'};
  function mat(color){if(!materials.has(color)){const m=stabiliseWorkshopBump(new Material({color:vivid[color]||color}));m.userData.owned=true;materials.set(color,m);}return materials.get(color);}
  function part(g,geo,x,y,z,color,label){const m=new Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=false;if(label)m.name=label;g.add(m);return m;}
  const box=(g,x,y,z,w,h,d,c,n)=>part(g,new BoxGeometry(w,h,d),x,y,z,c,n);
  const cyl=(g,x,y,z,r,h,c,n)=>part(g,new CylinderGeometry(r,r,h,12),x,y,z,c,n);
  if(name.includes('pillar')){
    const column=new Group();column.name='Column';group.add(column);
    cyl(column,0,2.4,0,.85,4.6,'#527c8c');cyl(column,0,4.5,0,.91,.5,'#b9c6c1');cyl(column,0,4.9,0,.65,.4,'#d4dfda');
    box(column,.79,3.6,.35,.22,1.7,.32,'#d4dfda');
    const stub=cyl(group,0,.6,0,.87,1.2,'#d1bd8b','Stub');stub.visible=false;
  }else if(name.includes('gate')){
    for(const x of [-2.45,2.45]){box(group,x,2.5,0,1,5,1.5,'#90aca5');box(group,x,5.05,0,1.15,.3,1.6,'#c3ad77');}
    box(group,0,5.4,0,6,.6,1.5,'#e4ce8c');box(group,0,.16,0,6.2,.3,2.4,'#b2c2b8');
  }else if(name.includes('pencils')){
    cyl(group,0,2,0,1.8,4,'#8da4ac');cyl(group,0,4.08,0,1.5,.05,'#526774');
    group.userData.stationery='gel-pens';
    for(let i=0;i<5;i++){
      const x=Math.cos(i*2.4),z=Math.sin(i*2.4);
      cyl(group,x,7,z,.24,9,['#508c98','#d1dedb','#7b789a'][i%3]);
      cyl(group,x,11.35,z,.26,.3,'#b8ccc9');cyl(group,x,11.7,z,.17,.4,'#d4dfda');
      box(group,x+.23,10.6,z,.12,1.5,.15,'#d4dfda');
    }
  }else if(name.includes('lamp')){cyl(group,0,.1,0,.65,.2,'#a3bfae');cyl(group,0,1.5,0,.14,2.8,'#7c8f91');cyl(group,0,2.9,0,.65,.4,'#efcf82');}
  else if(name.includes('root')||name.includes('bramble')){
    for(let i=0;i<4;i++){const m=box(group,(i-1.5)*.8,1.3,0,.6,2.5,.6,'#b6c49c','Pod'+i);m.rotation.z=(i-1.5)*.18;}
  }else if(name.includes('chest')){
    box(group,0,.55,0,2.2,1.1,1.5,'#b1cfc1');const lid=new Group();lid.name='Lid';lid.position.set(0,1.1,-.75);group.add(lid);
    box(lid,0,.16,.75,2.35,.32,1.65,'#b5a4c3');box(group,0,.8,.8,.42,.5,.14,'#f3e5b7');
  }else if(name==='slots'){
    box(group,0,1.5,0,2.6,3,1.5,'#a6bcb2');box(group,0,2,.8,2,.9,.12,'#f4ecd5');
    for(let i=-1;i<=1;i++)box(group,i*.6,2,.9,.32,.65,.1,['#da976f','#8bb9b2','#c4afcf'][i+1]);
    cyl(group,1.6,1.5,0,.12,1.5,'#9a9f91','Lever');cyl(group,1.6,2.3,0,.3,.3,'#d9a4ae');
  }else {
    // Memo stacks and ink stamps for the remaining paper props.
    const tall=name==='shrine'?1.5:1;
    box(group,0,.2,0,3.1,.4,2.8,'#899f9c');
    for(let i=0;i<5;i++)box(group,.08*(i%2),(.5+i*.24)*tall,0,2.8,.21*tall,2.6,i%2?'#e2f3ff':'#c7e0f2');
    cyl(group,0,2.1*tall,0,.7,1.4*tall,'#a4776b','Cap');cyl(group,0,2.8*tall,0,1,.25,'#cdb995');
  }
  return group;
}
