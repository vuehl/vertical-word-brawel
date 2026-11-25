import {VFX_SCALE} from '../effects/visual-scale.js';
import {I as Group,K as Mesh,ut as SphereGeometry,E as CylinderGeometry,q as Material} from '../vendor/three-DmSYIDKK.js';

export function createCaptureGourd(color){
  const root=new Group();root.name='capture-gourd';root.scale.setScalar(VFX_SCALE);
  const part=(geometry,tint,x,y,z,sx=1,sy=1,sz=1)=>{
    const mesh=new Mesh(geometry,new Material({color:tint}));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;
  };
  part(new SphereGeometry(.48,20,14),color,0,.44,0,1,1.12,1);
  part(new SphereGeometry(.31,20,14),color,0,1.06,0,1,1.1,1);
  part(new CylinderGeometry(.13,.16,.23,16),'#b77328',0,1.4,0);
  part(new CylinderGeometry(.1,.1,.014,16),'#392819',0,1.523,0);
  part(new CylinderGeometry(.24,.24,.075,16),'#b63e35',0,.8,0);
  part(new SphereGeometry(.13,12,8),'#ffe2a0',-.17,.49,.42,1,1.7,.2);
  return root;
}

export function gourdIcon(){
  const icon=document.createElement('span');
  icon.title='葫芦聚灵';
  Object.assign(icon.style,{display:'inline-block',position:'relative',width:'16px',height:'22px'});
  for(const [left,top,width,height,color] of [[6,0,4,4,'#905d28'],[4,3,8,9,'#d99a38'],[1,10,14,12,'#d99a38'],[4,10,8,2,'#b63e35']]){
    const part=document.createElement('span');
    Object.assign(part.style,{position:'absolute',left:left+'px',top:top+'px',width:width+'px',height:height+'px',borderRadius:'45%',background:color});icon.append(part);
  }
  return icon;
}
