export function deskLayers(stage, layers) {
  if (stage === 4) return layers.filter(layer => layer.name === 'desk' || layer.name === 'shelf');
  return layers;
}

export const deskAtlasFile = stage => stage === 4 ? 'desk-map-atlas-4.webp' : 'desk-map-atlas.webp';
