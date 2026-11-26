// The opaque scene target's alpha records how much of the world is visible
// to PixelOutline. A foreground sprite covers the ink with its own alpha.
export function maskSceneInk(material){
  const normalBlending=1,customBlending=5,zero=200,one=201,srcAlpha=204,oneMinusSrcAlpha=205;
  if(!material?.transparent || material.blending!==normalBlending)return;
  material.blending=customBlending;
  material.blendSrc=material.premultipliedAlpha?one:srcAlpha;
  material.blendDst=oneMinusSrcAlpha;
  material.blendSrcAlpha=zero;
  material.blendDstAlpha=oneMinusSrcAlpha;
}
