// Runs after scene outlines and colour grading. Native HUD/text is composited
// afterwards, so edge filtering never softens the game's interface.
export function createSceneAntialias(Effect){
  return new Effect('SceneEdgeAntialias',`
    float edgeLuma(vec3 c){return dot(sqrt(max(c,vec3(0.))),vec3(.299,.587,.114));}
    vec3 edgeSample(vec2 uv){return texture2D(inputBuffer,uv).rgb;}
    void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
      float nw=edgeLuma(edgeSample(uv+vec2(-1.,-1.)*texelSize));
      float ne=edgeLuma(edgeSample(uv+vec2(1.,-1.)*texelSize));
      float sw=edgeLuma(edgeSample(uv+vec2(-1.,1.)*texelSize));
      float se=edgeLuma(edgeSample(uv+vec2(1.,1.)*texelSize));
      float centre=edgeLuma(inputColor.rgb);
      float darkest=min(centre,min(min(nw,ne),min(sw,se)));
      float brightest=max(centre,max(max(nw,ne),max(sw,se)));
      if(brightest-darkest<max(.0312,brightest*.125)){outputColor=inputColor;return;}
      vec2 direction=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
      float reduce=max((nw+ne+sw+se)*.03125,.0078125);
      direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-8.),vec2(8.))*texelSize;
      vec3 a=.5*(edgeSample(uv-direction/6.)+edgeSample(uv+direction/6.));
      vec3 b=a*.5+.25*(edgeSample(uv-direction*.5)+edgeSample(uv+direction*.5));
      float lb=edgeLuma(b);
      outputColor=vec4(lb<darkest||lb>brightest?a:b,inputColor.a);
    }
  `);
}
