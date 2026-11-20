// Cache by the current pair of type indices, not actor ID: transformations,
// temporary types and reused enemy slots must immediately see the new pair.
export function createActorTypeLookup(types=[]){
  const stride=types.length+1,cache=new Array(stride*stride);
  return (first,second)=>{
    const key=first*stride+second;
    let pair=cache[key];
    if(!pair){pair=[];if(first)pair.push(types[first-1]);if(second)pair.push(types[second-1]);cache[key]=Object.freeze(pair);}
    return pair;
  };
}
