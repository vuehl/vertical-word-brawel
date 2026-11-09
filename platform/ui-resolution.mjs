// Keep menus, HUD text and controls at the former high-quality resolution.
// Scene quality and battery saver must never change this layer's density.
export function uiScale(view){
  return Math.min(view.dpr,2,Math.sqrt(2000000/(view.width*view.height)));
}
