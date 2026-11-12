// The same orthographic depth range is used by the light and the material.
// Blocker/receiver separation is measured along the light ray, never from the
// player or the camera. Broadening and fading therefore stay fixed to props.
export const WORKSHOP_SHADOW={span:48,near:1,far:300};

export function workshopShadowShader(shader){
  shader.uniforms.uWorkshopShadowWorld={value:WORKSHOP_SHADOW.span*2};
  shader.uniforms.uWorkshopShadowDepth={value:WORKSHOP_SHADOW.far-WORKSHOP_SHADOW.near};
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',`
    float workshopProjectedShadow=0.;
    #if defined(USE_SHADOWMAP) && defined(SHADOWMAP_TYPE_BASIC)
      #define getShadow workshopOriginalShadow
    #endif
    #include <shadowmap_pars_fragment>
    #if defined(USE_SHADOWMAP) && defined(SHADOWMAP_TYPE_BASIC)
      #undef getShadow
      uniform float uWorkshopShadowWorld;
      uniform float uWorkshopShadowDepth;
      vec2 workshopShadowDisk(int i){
        float angle=float(i)*2.39996323+.31;
        return vec2(cos(angle),sin(angle))*sqrt((float(i)+.5)/16.);
      }
      // Filter depth COMPARISONS, never depth values. Interpolating foreground
      // and clear-map depth first creates a hard false edge at the caster.
      // x = bilinear occlusion; y = weighted blocker/receiver separation.
      vec2 workshopShadowTap(sampler2D shadowMap,vec2 uv,vec3 receiver,vec2 slope,vec2 mapSize){
        vec2 pixel=uv*mapSize-.5,f=fract(pixel),texel=1./mapSize;
        vec2 base=(floor(pixel)+.5)*texel;
        vec2 p00=base,p10=base+vec2(texel.x,0.),p01=base+vec2(0.,texel.y),p11=base+texel;
        vec4 gap=vec4(
          receiver.z+dot(p00-receiver.xy,slope)-texture2D(shadowMap,p00).r,
          receiver.z+dot(p10-receiver.xy,slope)-texture2D(shadowMap,p10).r,
          receiver.z+dot(p01-receiver.xy,slope)-texture2D(shadowMap,p01).r,
          receiver.z+dot(p11-receiver.xy,slope)-texture2D(shadowMap,p11).r)-.00004;
        vec4 weights=vec4((1.-f.x)*(1.-f.y),f.x*(1.-f.y),(1.-f.x)*f.y,f.x*f.y)*step(vec4(0.),gap);
        return vec2(dot(weights,vec4(1.)),dot(weights,max(gap,vec4(0.))));
      }
      float getShadow(sampler2D shadowMap,vec2 mapSize,float intensity,float bias,float radius,vec4 coord){
        vec3 p=coord.xyz/coord.w;p.z+=bias;
        if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z<0.||p.z>1.)return 1.;
        // Correct the receiver plane at every tap. Otherwise a sloping paper
        // surface mistakes its own neighbouring depth for a shadow caster.
        vec3 dx=dFdx(p),dy=dFdy(p);
        float determinant=dx.x*dy.y-dx.y*dy.x;
        vec2 slope=abs(determinant)>1.e-10?vec2(dy.y*dx.z-dx.y*dy.z,dx.x*dy.z-dy.x*dx.z)/determinant:vec2(0.);
        slope=clamp(slope,vec2(-4.),vec2(4.));
        // Bilinear blocker distance prevents opacity/softness from snapping at
        // texel boundaries. Search neighbours only outside the caster's core.
        vec2 texel=1./mapSize,centre=workshopShadowTap(shadowMap,p.xy,p,slope,mapSize);
        float blocker=centre.y,count=centre.x;
        if(count<.001)for(int i=0;i<4;i++){
          vec2 offset=vec2(cos(float(i)*1.57079633),sin(float(i)*1.57079633))*.85/uWorkshopShadowWorld;
          float separation=p.z+dot(offset,slope)-texture2D(shadowMap,p.xy+offset).r-.00004;
          if(separation>0.){blocker+=separation;count+=1.;}
        }
        if(count<.001)return 1.;
        float gap=max(0.,blocker/count*uWorkshopShadowDepth);
        float spread=clamp(.035+gap*.055,.035,.85);
        float opacity=mix(.56,.10,1.-exp(-gap/5.5));
        // Shadow texels and display pixels both have finite footprints. Keep
        // a continuous one-pixel transition even at contact or low resolution.
        float pixel=max(length(dx.xy),length(dy.xy));
        vec2 filterRadius=max(vec2(spread/uWorkshopShadowWorld),max(texel*1.15,vec2(pixel*.9)));
        float coverage=0.;
        for(int i=0;i<16;i++){
          vec2 offset=workshopShadowDisk(i)*filterRadius;
          coverage+=workshopShadowTap(shadowMap,p.xy+offset,p,slope,mapSize).x;
        }
        workshopProjectedShadow=max(workshopProjectedShadow,coverage/16.*opacity*intensity);
        // Pigment shading applies the continuous shadow tint separately from
        // the toon light bands; it must not collapse this gradient into steps.
        return 1.;
      }
    #endif
  `);
}
