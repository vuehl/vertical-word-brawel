import {strFromU8} from 'fflate';

export function keyPart(el) {
  if(el.nodeType===3)return '#text';
  return el.id?'#'+el.id:(el.localName+'.'+(el.getAttribute('class')||'').trim().split(/\s+/)[0]);
}
export function keyHash(parent,label,index) {
  let h=parent;
  for(const char of label+':'+index)h=Math.imul(h^char.charCodeAt(0),16777619);
  return h>>>0;
}
export async function readUIAssets(files) {
  const fs=wx.getFileSystemManager(), filePath=files.pathFor('engine/styles.json');
  const data=fs.readFile?await new Promise((resolve,reject)=>fs.readFile({
    filePath,encoding:'utf8',success:r=>resolve(r.data),fail:reject
  })):fs.readFileSync(filePath,'utf8');
  return {rules:JSON.parse(typeof data==='string'?data:strFromU8(new Uint8Array(data)))};
}
export function readReference(view,data) {
  if(!data)return {screens:{},styles:[],sx:1,sy:1};
  const distance=v=>Math.abs(Math.log((view.w/view.h)/(v.w/v.h)))+
    .25*Math.abs(Math.log(view.w/v.w));
  const sameOrientation=data.views.filter(v=>(v.w<=v.h)===(view.w<=view.h));
  const sample=(sameOrientation.length?sameOrientation:data.views).reduce((a,b)=>distance(a)<distance(b)?a:b);
  return {screens:sample.screens,styles:data.styles,sx:view.w/sample.w,sy:view.h/sample.h};
}
