const attributes=[['aPos','iPos'],['aSize','iSize'],['aUV','iUV'],['aFx','iFx'],['aTint','iTint'],['aLook','iLook']];

// Species retain their metrics. Actors write straight into the atlas buffer;
// no per-species crowd-sized arrays or second copy at the end of a frame.
export function createGlyphBatches(sprites){
  const groups=new Map();sprites.glyphGroups=groups;
  let frameTime=0;
  function allocate(group,capacity){
    const source=group.source;
    if(group.mesh){group.mesh.parent?.remove(group.mesh);group.mesh.dispose();group.geometry.dispose();}
    group.geometry=source.mesh.geometry.clone();
    for(const [field,name] of attributes){
      const original=source[field];
      const array=new Float32Array(capacity*original.itemSize);
      if(group[field])array.set(group[field].array.subarray(0,group.count*original.itemSize));
      group[field]=new original.constructor(array,original.itemSize).setUsage(original.usage);
      group.geometry.setAttribute(name,group[field]);
    }
    group.mesh=new source.mesh.constructor(group.geometry,group.material,capacity);
    group.mesh.frustumCulled=false;group.mesh.renderOrder=1;group.mesh.count=0;group.mesh.visible=false;
    group.mesh.name='glyph-batch-'+group.word;group.capacity=capacity;sprites.scene.add(group.mesh);
  }
  return {
    add(source,word,initialCapacity=1024){
      let group=groups.get(word);
      if(!group){
        const material=source.material.clone();material.uniforms={...source.material.uniforms};
        group={word,source,material,members:new Set(),count:0};
        group.reserve=()=>{if(group.count===group.capacity)allocate(group,group.capacity*2);return group.count++;};
        groups.set(word,group);allocate(group,initialCapacity);
      }
      group.members.add(source);
      source.zxGroup=group;
      // The small source mesh is only a metrics/material owner, never rendered.
      source.mesh.parent?.remove(source.mesh);
      source.mesh.visible=false;
      source.end=()=>{
        source.mesh.count=0;source.mesh.visible=false;
        if(source.count){source.drawn=true;source.lastUse=frameTime;}
      };
      const dispose=source.dispose.bind(source);
      source.dispose=()=>{
        group.members.delete(source);
        if(!group.members.size){group.mesh.parent?.remove(group.mesh);group.mesh.dispose();group.geometry.dispose();group.material.dispose();groups.delete(word);}
        else if(group.source===source)group.source=group.members.values().next().value;
        dispose();
      };
    },
    begin(){frameTime=performance.now();for(const group of groups.values())group.count=0;},
    flush(){
      for(const group of groups.values()){
        const total=group.count;group.mesh.count=total;group.mesh.visible=total>0;
        if(!total)continue;
        for(const [field] of attributes){const a=group[field];a.clearUpdateRanges();a.addUpdateRange(0,total*a.itemSize);a.needsUpdate=true;}
      }
    },
    clear(){for(const g of groups.values()){g.mesh.parent?.remove(g.mesh);g.mesh.dispose();g.geometry.dispose();g.material.dispose();}groups.clear();},
  };
}
