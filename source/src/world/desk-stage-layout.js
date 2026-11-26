export function deskLayers(stage, layers) {
  if (stage === 4) return layers.filter(layer => layer.name === 'desk' || layer.name === 'shelf');
  return layers;
}

export const deskAtlasFile = stage => stage === 4 ? 'desk-map-atlas-4.webp' : 'desk-map-atlas.webp';

// Keep fading props live. A later illustration overlapping one of these
// must stay above it, even when the artist moves it in a future layout.
export function deskOverlayLayers(layers){
  const overlays=[];
  function overlap([,x,y,w,h],[,l,t,width,height]){
    return x<l+width&&x+w>l&&y<t+height&&y+h>t;
  }
  for(const layer of layers){
    if(layer.name==='cup'||layer.name==='zhi'||overlays.some(above=>
      above.parts.some(a=>layer.parts.some(b=>overlap(a,b)))))overlays.push(layer);
  }
  return overlays;
}

export function deskBattleLayers(stage,layout){
  if(stage===4)return deskLayers(stage,layout.layers);
  const floor=layout.layers.find(layer=>layer.name==='desk');
  const parts=floor.parts.map(([file,x,y,w,h])=>{
    // Identical painted gutters straddle each cut under bilinear/mip filtering.
    const left=Math.max(0,x-4),top=Math.max(0,y-4);
    return ['furnished/'+file,left,top,Math.min(layout.width,x+w+4)-left,Math.min(layout.height,y+h+4)-top];
  });
  return [{name:'desk',parts},...deskOverlayLayers(layout.layers).map(({name,parts})=>({
    name,parts:parts.map(([file,...rect])=>['furnished/'+file,...rect]),
  }))];
}
