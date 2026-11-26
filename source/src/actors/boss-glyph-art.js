// The reference uses a flat coral-red face and a round, pure-black contour.
export const bossGlyphArt = Object.freeze({
  word:'龘', file:'boss-strokes.png', size:288, columns:8, rows:6,
  color:[255,70,70], outline:16, bakeSize:576,
});

// Keep the authored antialias coverage instead of the pixel-art alpha cutoff.
// Bosses have their own material so this cannot change other atlas actors.
export const bossGlyphFragment = `
uniform sampler2D zxGlyph;
varying vec2 vUv;
varying vec4 vFx;
varying vec4 vTint;
void main(){
  vec4 c=texture2D(zxGlyph,vUv);
  if(c.a<.0039)discard;
  c.rgb=mix(c.rgb,c.rgb*vTint.rgb*1.4+vTint.rgb*.12,vTint.w);
  c.rgb=mix(c.rgb,vec3(1.),clamp(vFx.x,0.,1.));
  c.a*=1.-clamp(-vFx.y,0.,1.);
  gl_FragColor=c;
}`;
