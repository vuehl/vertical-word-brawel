// Shared by the device installer and the package verifier.
const packedInputs={world:['model-parts.bin','model-map.json'],text:[]};
function* expandedResources(group, io) {
  if(group==='world'){
    const parts=io.read('model-parts.bin'),pool=parts instanceof Uint8Array?parts:new Uint8Array(parts);
    const recipes=JSON.parse(io.read('model-map.json','utf8'));
    for(const [file,recipe] of Object.entries(recipes)){
      const output=new Uint8Array(recipe.reduce((size,part)=>size+part[1],0));
      let position=0;
      for(const [offset,length] of recipe){
        output.set(pool.subarray(offset,offset+length),position);position+=length;
      }
      yield [file,output.buffer];
    }
  }
}
function expandResources(group,io){
  for(const entry of expandedResources(group,io))io.write(...entry);
  return packedInputs[group]||[];
}
async function expandResourcesAsync(group,io,{budgetMs=6,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0)),now=Date.now}={}){
  let start=now(),count=0;
  for(const entry of expandedResources(group,io)){
    io.write(...entry);count++;
    // Bound both elapsed work and the number of large GLB copies per task.
    if(count>=4||now()-start>=budgetMs){await yieldTask();start=now();count=0;}
  }
  return packedInputs[group]||[];
}
module.exports={expandResources,expandResourcesAsync,packedInputs};
