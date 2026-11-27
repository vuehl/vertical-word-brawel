import {drawUiPaper} from './ui-paper.mjs';
import {irisFragment} from './ultimate-ready-iris.mjs';
import {paintLoadingBackdrop} from '../source/src/ui/menu-scene.js';
const colorTokens=/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black|transparent|red|blue|green|yellow|orange|gray|purple)\b/gi;
import {rangeBounds} from './range.mjs';
function colors(v=''){return v.match(colorTokens)||[];}
function rounded(ctx,x,y,w,h,r) {
  r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function background(ctx,style,b) {
  const value=style['background-color']||style.background||style['background-image']||'';
  const c=colors(value);if(!c.length)return null;
  if(c.length===1||!value.includes('gradient'))return c[c.length-1];
  const {x,y,w,h}=b,radial=value.includes('radial-gradient');
  const g=radial?ctx.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,Math.max(w,h)*.7):
    ctx.createLinearGradient(x,y,x+(value.includes('90deg')?w:w*.2),y+h);
  for(let i=0;i<c.length;i++)g.addColorStop(i/(c.length-1),c[i]);return g;
}
export function paint(layout,boxes,view,scale) {
  const ctx=layout.context;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,view.width,view.height);
  // Extend full-page paper backgrounds through the safe-area gutters while
  // keeping every control inside the usable rectangle.
  let fullPage;
  for(const b of boxes)if(b.el.dataset?.fullscreen==='true'&&b.opacity>0&&b.w>0&&b.h>0)fullPage=b;
  // Scenic menus animate only their composited opacity. Cached layout boxes
  // and their hit geometry can stay valid while the camera moves at frame rate.
  const scenic=fullPage?.el,fade=!scenic?._journeyCamera&&scenic?._journeyFade;
  let angles;
  ctx.translate(view.x,view.y);
  for(const b of boxes) {
    const {x,y,w,h,s,el,tag,clip}=b;
    // Rotate the printed face and its label around one pivot. Input keeps the full layout box.
    let print;
    const degrees=el.dataset?.printAngle;
    if(degrees&&!angles)angles=new Map();
    if(angles){
      print=degrees?{cx:x+w/2,cy:y+h/2,angle:Number(degrees)*Math.PI/180}:angles.get(el.parentNode);
      if(print)angles.set(el,print);
    }
    let alpha=b.opacity;
    if(fade&&(b===fullPage||scenic.contains(el))){
      alpha*=fade.scene;
      if(b!==fullPage&&el.dataset?.journeyBackdrop!=='true')alpha*=fade.controls;
    }
    if(w<.1||h<.1||x+w<clip.x||y+h<clip.y||x>clip.r||y>clip.b||alpha===0)continue;
    if(b===fullPage&&!el.classList.contains('journey-prep')){
      const bounds={x:-view.x,y:-view.y,w:view.width,h:view.height};
      ctx.fillStyle=background(ctx,s,bounds)||'#F3F1FA';ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);
    }
    // Extend just the desk artwork into platform insets; UI controls stay in the safe rectangle.
    if(el.dataset?.journeyBackdrop==='true'&&el._surface){
      if(el.dataset.shot==='entry'){
        // Loading art covers the physical screen, including the notch/capsule
        // and home-indicator insets. The progress stays in the safe rectangle.
        const poster=el._loadingPoster;
        ctx.save();ctx.globalAlpha=alpha;ctx.translate(-view.x,-view.y);
        paintLoadingBackdrop(ctx,view.width,view.height,poster?._surface||poster);
        ctx.restore();continue;
      }
      const image=el._surface,iw=image.width,ih=image.height;
      if(iw&&ih){
        const margin=Number(el.dataset.sceneMargin)||0;
        const dx=iw/(view.w+2*margin),dy=ih/(view.h+2*margin);
        ctx.save();ctx.globalAlpha=alpha;
        ctx.drawImage(image,(margin-view.x)*dx,(margin-view.y)*dy,view.width*dx,view.height*dy,-view.x,-view.y,view.width,view.height);ctx.restore();
      }
      continue;
    }
    if(tag==='img')el._loadImage?.();
    // A decorative header print may continue into the system area. Its
    // layout box and all interactive elements keep the usual safe-area clip.
    if(el.dataset?.paperBleed==='top'&&el._surface&&(tag==='canvas'||el.complete)){
      const top=Math.min(y,-view.y);
      ctx.save();ctx.globalAlpha=alpha;
      ctx.drawImage(el._surface,x,top,w,y+h-top);ctx.restore();continue;
    }
    // Continue the capture vignette across the safe-area insets without a seam.
    if(el.dataset?.captureBleed==='shade'){
      const bounds={x:-view.x,y:-view.y,w:view.width,h:view.height};
      const fill=background(ctx,s,bounds);
      if(fill){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.restore();}
      continue;
    }
    // Paint modal backdrops at their normal stacking position, but beyond the
    // safe-area clip. Keep dialog layout and hit targets in the usable area.
    const fullBackdrop=el.classList?.contains('zx-modal-wrap');
    if(fullBackdrop){
      const bounds={x:-view.x,y:-view.y,w:view.width,h:view.height},bg=background(ctx,s,bounds);
      if(bg){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=bg;ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.restore();}
    }
    const tail=tag==='footer'&&el.classList.contains('paper-screen-footer')&&!el.classList.contains('paper-single-back')
      ?Math.min(parseFloat(s.vars['--paper-tail'])||0,Math.max(0,view.height-view.y-view.h-8)):0;
    ctx.save();ctx.beginPath();ctx.rect(clip.x,clip.y,clip.r-clip.x,clip.b+tail-clip.y);ctx.clip();
    ctx.globalAlpha=alpha;
    if(print){
      ctx.translate(print.cx,print.cy);ctx.rotate(print.angle);ctx.translate(-print.cx,-print.cy);
    }
    // Body sits behind the WebGL canvas in the desktop stacking order.
    if(tag!=='body'&&tag!=='#text'&&!drawUiPaper(ctx,tail?{...b,h:h+tail}:b)){
      const bg=fullBackdrop?null:background(ctx,s,b),border=s.border||'',line=parseFloat(border)||0;
      const radius=parseFloat(s['border-radius']||0);
      if(bg||line){
        if(s['box-shadow']&&s['box-shadow']!=='none'&&(el.classList?.contains('zx-button')||el.classList?.contains('zx-card'))){
          rounded(ctx,x,y+3,w,h,radius);ctx.fillStyle=colors(s['box-shadow'])[0]||'#ddd7e7';ctx.fill();
        }
        rounded(ctx,x,y,w,h,radius);
        if(bg){ctx.fillStyle=bg;ctx.fill();}
        const stripe=s.background||'';
        if(stripe.includes('repeating-linear-gradient')){
          const palette=colors(stripe);ctx.save();ctx.clip();ctx.fillStyle=palette[0];
          for(let offset=-h;offset<w+h;offset+=22){ctx.beginPath();ctx.moveTo(x+offset,y+h);ctx.lineTo(x+offset+11,y+h);ctx.lineTo(x+offset+h+11,y);ctx.lineTo(x+offset+h,y);ctx.closePath();ctx.fill();}ctx.restore();
          rounded(ctx,x,y,w,h,radius);
        }
        if(line){ctx.strokeStyle=colors(s['border-color']||border)[0]||'#dedbe8';ctx.lineWidth=line;ctx.stroke();}}
      // A row divider is a single edge, not a rectangle around the card.
      for(const [side,points] of [['top',[x,y,x+w,y]],['right',[x+w,y,x+w,y+h]],['bottom',[x,y+h,x+w,y+h]],['left',[x,y,x,y+h]]]){
        const edge=s['border-'+side],width=parseFloat(edge)||0;
        if(!width)continue;
        ctx.beginPath();ctx.moveTo(points[0],points[1]);ctx.lineTo(points[2],points[3]);
        ctx.strokeStyle=colors(s['border-'+side+'-color']||s['border-color']||edge)[0]||'#dedbe8';ctx.lineWidth=width;ctx.stroke();
      }
      if(el._scrollMax>1&&h>20&&s['scrollbar-width']!=='none'){
        const thumb=Math.max(12,h*h/(h+el._scrollMax));
        ctx.fillStyle='rgba(70,65,92,.45)';
        ctx.fillRect(x+w-4,y+(h-thumb)*(el._scroll||0)/el._scrollMax,3,thumb);
      }
    }
    if(tag==='#text'){
      ctx.font=layout.font(s);ctx.fillStyle=s.color||'#2a2440';ctx.textBaseline='middle';
      const text=el.textContent.replace(/\s+/g,' ').trim();
      const lines=b.singleLine?[text]:layout.wrap(text,w,s),lh=h/Math.max(1,lines.length);
      const side=s['text-align'];ctx.textAlign=side==='center'?'center':side==='right'?'right':'left';
      const tx=side==='center'?x+w/2:side==='right'?x+w:x;
      const labelStyle=el.parentNode?.dataset?.paperText;
      const outlined=labelStyle==='outlined'||labelStyle==='ticket';
      if(outlined){ctx.strokeStyle=labelStyle==='ticket'?'#E8B73E':'#F3F1FA';ctx.lineJoin='round';ctx.lineWidth=labelStyle==='ticket'?2.5:3;}
      lines.forEach((line,i)=>{
        const ty=y+(i+.5)*lh;
        if(outlined)ctx.strokeText(line,tx,ty,w);
        ctx.fillText(line,tx,ty,w);
      });
    } else if(tag==='img'||tag==='canvas'){
      const image=el._surface;
      if(image&&(tag==='canvas'||el.complete)&&image.width&&image.height){
        const icon=el._icon,{width,height}=icon||image;
        const fit=s['object-fit'],ratio=(fit==='cover'?Math.max:Math.min)(w/width,h/height);
        let dw=fit==='fill'?w:ratio*width,dh=fit==='fill'?h:ratio*height;
        if(el.dataset?.paperTilt){
          ctx.translate(x+w/2,y+h/2);ctx.rotate(Number(el.dataset.paperTilt)*Math.PI/180);ctx.translate(-x-w/2,-y-h/2);
        }
        rounded(ctx,x,y,w,h,parseFloat(s['border-radius'])||0);ctx.clip();
        ctx.imageSmoothingEnabled=s['image-rendering']!=='pixelated';
        let left=x+(w-dw)/2,top=y+(h-dh)/2;
        if(view.originalPixels&&el.hasAttribute('data-original-pixels')){
          left=Math.round((view.x+x+w/2)*scale-width/2);
          top=Math.round((view.y+y+h/2)*scale-height/2);
          ctx.setTransform(1,0,0,1,0,0);
          dw=width;dh=height;
        }
        if(icon)ctx.drawImage(image,icon.x,icon.y,width,height,left,top,dw,dh);
        else ctx.drawImage(image,left,top,dw,dh);
      }
    } else if(tag==='input'||tag==='select'){
      ctx.font=layout.font(s);ctx.fillStyle=s.color;
      if(el.type==='range'){
        const {min,max}=rangeBounds(el),f=max>min?(+el.value-min)/(max-min):0;
        const zixing=el.classList.contains('zx-range'),progress=w*Math.max(0,Math.min(1,f));
        ctx.fillStyle=zixing?'#BEB3A0':'#bcb6c9';ctx.fillRect(x,y+h/2-3,w,6);
        ctx.fillStyle=zixing?'#EEC659':'#3a8cff';ctx.fillRect(x,y+h/2-3,progress,6);
        ctx.beginPath();
        if(zixing){const tx=x+Math.max(8,Math.min(w-8,progress)),ty=y+h/2;ctx.moveTo(tx-7,ty-8);ctx.lineTo(tx+8,ty-8);ctx.lineTo(tx+8,ty+4);ctx.lineTo(tx+4,ty+8);ctx.lineTo(tx-8,ty+8);ctx.lineTo(tx-8,ty-4);ctx.closePath();}
        else ctx.arc(x+progress,y+h/2,6,0,2*Math.PI);
        ctx.fillStyle=zixing?'#FFF8E9':'#3a8cff';ctx.fill();
        if(zixing){ctx.strokeStyle='#403930';ctx.lineWidth=2;ctx.stroke();}
      }else if(el.type==='checkbox'){ctx.fillText(el.checked?'☑':'☐',x,y+h*.75);}
      else ctx.fillText(el.value||el.placeholder||'',x+3,y+h*.7);
    }
    ctx.restore();
  }
}
// Draw the UI after the original post-processing pipeline using the same screen framebuffer.
export function compositor(gl,canvas) {
  function shader(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
  }
  const prog=gl.createProgram();
  gl.attachShader(prog,shader(gl.VERTEX_SHADER,'#version 300 es\nout vec2 uv;void main(){vec2 v=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=vec2(v.x,1.-v.y);gl_Position=vec4(v*2.-1.,0.,1.);}'));
  gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;
in vec2 uv;out vec4 color;
uniform sampler2D ui;uniform float opacity;uniform bool flip;uniform vec4 sourceUV;
uniform bool castActive;uniform vec4 castUV;uniform vec3 castTone;uniform vec3 bladeNext;
${irisFragment}
vec3 castKey(vec2 pos,float halfIndex,vec2 extent){
  pos=clamp(pos,.5/extent,1.-.5/extent);
  return texture(ui,vec2((halfIndex+pos.x)*.5,pos.y*castUV.z)).rgb;
}
vec2 castMotion(vec2 pos,float plane,vec2 extent){
  vec2 size=vec2(textureSize(ui,0));
  pos=clamp(pos,vec2(2./size.x,.5/(size.y-extent.y)),vec2(1.-2./size.x,1.-.5/(size.y-extent.y)));
  vec2 at=vec2((plane+pos.x)*.25,mix(castUV.z,1.,pos.y));
  vec2 field=vec2(texture(ui,at).r,texture(ui,at+vec2(.25,0.)).r);
  return (field*255.-128.)*(castUV.w/127.)/extent;
}
void main(){
  if(irisActive){color=readyIris(uv);return;}
  if(castActive){
    if(castUV.w<0.){
      vec2 offset=uv*vec2(castUV.z,-castUV.w);
      float e=mix(texture(ui,castUV.xy+offset).r,texture(ui,bladeNext.xy+offset).r,bladeNext.z);
      e=max(0.,(e-.012)/.988);
      color=vec4(mix(castTone,vec3(1.),.87*smoothstep(.60,1.,e))*e,.24*e+.72*smoothstep(.40,.86,e));
      return;
    }
    vec2 extent=vec2(textureSize(ui,0))*vec2(.5,castUV.z);
    float t=castUV.x;
    vec3 mask;
    if(t<=.001||t>=.999) mask=castKey(uv,t<.5?castUV.y:1.-castUV.y,extent);
    else {
      vec2 a=uv-t*castMotion(uv,0.,extent),b=uv-(1.-t)*castMotion(uv,2.,extent);
      a=uv-t*castMotion(a,0.,extent);b=uv-(1.-t)*castMotion(b,2.,extent);
      mask=mix(castKey(a,castUV.y,extent),castKey(b,1.-castUV.y,extent),t);
      mask.gb=smoothstep(vec2(.24),vec2(.76),mask.gb);
    }
    float energy=max(0.,(mask.r-.012)/.988);
    float body=mask.g,fill=min(mask.b,body);
    vec3 pigment=mix(castTone*.94,vec3(1.),.78*smoothstep(.76,.97,energy));
    vec3 ink=castTone*.49*(body-fill)+pigment*fill;
    float halo=energy*(1.-body);
    color=vec4(ink+castTone*.83*halo,body+.23*halo);
  }else{
    vec2 at=sourceUV.xy+(flip?vec2(uv.x,1.-uv.y):uv)*sourceUV.zw;
    vec2 inset=.5/vec2(textureSize(ui,0));
    // Clamp to the selected cell, so linear filtering cannot bleed the
    // neighbouring movie frame along the edge of the screen.
    at=clamp(at,sourceUV.xy+inset,sourceUV.xy+sourceUV.zw-inset);
    color=texture(ui,at)*opacity;
  }
}`));
  gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  const opacity=gl.getUniformLocation(prog,'opacity');
  const flip=gl.getUniformLocation(prog,'flip');
  const sourceUV=gl.getUniformLocation(prog,'sourceUV');
  const cast=gl.getUniformLocation(prog,'castActive'),castUV=gl.getUniformLocation(prog,'castUV'),castTone=gl.getUniformLocation(prog,'castTone');
  const bladeNext=gl.getUniformLocation(prog,'bladeNext');
  const irisActive=gl.getUniformLocation(prog,'irisActive'),irisBounds=gl.getUniformLocation(prog,'irisBounds');
  const irisMotion=gl.getUniformLocation(prog,'irisMotion'),irisTone=gl.getUniformLocation(prog,'irisTone');
  const texture=gl.createTexture(),tiles=[],vao=gl.createVertexArray();
  let width=0,height=0,activeSlots=0;
  let frozen=null,frozenKey=null,frozenOwner=null,frozenWidth=0,frozenHeight=0;
  const hasFrozen=key=>!!key&&key===frozenKey&&!!frozen&&frozenWidth===gl.drawingBufferWidth&&frozenHeight===gl.drawingBufferHeight;
  const release=()=>{if(frozen)gl.deleteTexture(frozen);frozen=frozenKey=frozenOwner=null;frozenWidth=frozenHeight=0;};
  function textureParameters(){
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  function beginPass(){
    const bufferWidth=gl.drawingBufferWidth,bufferHeight=gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,bufferWidth,bufferHeight);
    gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.colorMask(true,true,true,true);gl.depthMask(false);gl.blendEquation(gl.FUNC_ADD);
    let premultiply;
    function prepareUpload(useCanvas){
      if(premultiply===undefined){
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
        // Native WeChat canvases do not implement browser color conversion.
        gl.pixelStorei(gl.UNPACK_ROW_LENGTH,0);gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,0);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,0);
      }
      if(premultiply!==useCanvas){gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,useCanvas);premultiply=useCanvas;}
    }
    return prepareUpload;
  }
  function drawLayers(layers,prepareUpload){
    const bufferWidth=gl.drawingBufferWidth,bufferHeight=gl.drawingBufferHeight;
    const sx=bufferWidth/canvas.width,sy=bufferHeight/canvas.height;
    let slots=0,lastOpacity=1;
    for(const control of layers){
      if(!control)continue;
      gl.viewport(Math.round(control.x*sx),Math.round((canvas.height-control.y-control.height)*sy),Math.round(control.width*sx),Math.round(control.height*sy));
      if(control.iris){
        const {bounds,radius,angle,tone}=control.iris;
        gl.uniform1i(irisActive,1);
        gl.uniform4fv(irisBounds,bounds);
        gl.uniform2f(irisMotion,radius,angle);
        gl.uniform3f(irisTone,(tone>>16)/255,(tone>>8&255)/255,(tone&255)/255);
        gl.drawArrays(gl.TRIANGLES,0,3);
        gl.uniform1i(irisActive,0);
        continue;
      }
      const slot=control.slot||0;
      slots|=1<<slot;
      const cache=tiles[slot]??= {texture:gl.createTexture(),width:0,height:0};
      const {canvas:tile}=control;
      const rect=control.sourceRect;
      if(rect)gl.uniform4f(sourceUV,rect.x/tile.width,rect.y/tile.height,rect.width/tile.width,rect.height/tile.height);
      else gl.uniform4f(sourceUV,0,0,1,1);
      gl.bindTexture(gl.TEXTURE_2D,cache.texture);
      if(control.changed||cache.width!==tile.width||cache.height!==tile.height){
        prepareUpload(!control.uploadPixels&&!control.pixels);
        const resized=cache.width!==tile.width||cache.height!==tile.height;
        if(resized)textureParameters();
        if(control.pixels){
          // Preserve additive light in pixels with zero coverage alpha.
          if(resized)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,tile.width,tile.height,0,gl.RGBA,gl.UNSIGNED_BYTE,control.pixels);
          else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,tile.width,tile.height,gl.RGBA,gl.UNSIGNED_BYTE,control.pixels);
        }else if(control.uploadPixels){
          // The iOS health tile bypasses the native offscreen-canvas upload.
          // getImageData returns straight alpha; the HUD blends premultiplied RGB.
          const {data}=tile.getContext('2d').getImageData(0,0,tile.width,tile.height);
          const pixels=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
          for(let i=0;i<pixels.length;i+=4){
            const alpha=pixels[i+3]/255;
            for(let channel=0;channel<3;channel++)pixels[i+channel]=Math.round(pixels[i+channel]*alpha);
          }
          if(resized)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,tile.width,tile.height,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,tile.width,tile.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        }else if(resized)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tile);
        else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,tile);
        cache.width=tile.width;cache.height=tile.height;
      }
      const alpha=control.opacity??1;
      if(alpha!==lastOpacity){gl.uniform1f(opacity,alpha);lastOpacity=alpha;}
      if(control.castUV){
        const rgb=control.castColor;
        gl.uniform1i(cast,1);gl.uniform4fv(castUV,control.castUV);
        if(control.bladeNext)gl.uniform3fv(bladeNext,control.bladeNext);
        gl.uniform3f(castTone,(rgb>>16)/255,(rgb>>8&255)/255,(rgb&255)/255);
      }
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(control.castUV)gl.uniform1i(cast,0);
    }
    return slots;
  }
  function compose(changed,opaque,layers,freezeKey,run,foregroundOpacity){
    const bufferWidth=gl.drawingBufferWidth,bufferHeight=gl.drawingBufferHeight;
    const prepareUpload=beginPass();
    // Copy the scene before UI composition, once per paused choice sequence.
    // Everything stays on the GPU; never read pixels back or create a bitmap.
    if(frozen&&(frozenOwner!==run||frozenWidth!==gl.drawingBufferWidth||frozenHeight!==gl.drawingBufferHeight))release();
    if(freezeKey&&!hasFrozen(freezeKey)){
      const allocate=!frozen;
      if(allocate)frozen=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,frozen);
      if(allocate){
        textureParameters();
        gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,0);
      }else gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
      frozenOwner=run;frozenKey=freezeKey;frozenWidth=gl.drawingBufferWidth;frozenHeight=gl.drawingBufferHeight;
    }else if(!freezeKey)frozenKey=null;
    if(opaque){
      if(foregroundOpacity!==undefined)gl.clearColor(229/255,230/255,216/255,1);
      else gl.clearColor(.957,.949,.98,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.useProgram(prog);gl.uniform1f(opacity,1);gl.uniform4f(sourceUV,0,0,1,1);gl.bindVertexArray(vao);
    if(freezeKey){
      gl.disable(gl.BLEND);gl.bindTexture(gl.TEXTURE_2D,frozen);gl.uniform1i(flip,1);gl.drawArrays(gl.TRIANGLES,0,3);
    }
    gl.uniform1i(flip,0);gl.bindTexture(gl.TEXTURE_2D,texture);
    if(changed){
      prepareUpload(true);
      if(width!==canvas.width||height!==canvas.height){
        textureParameters();
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
        width=canvas.width;height=canvas.height;
      }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    }
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    if(foregroundOpacity===undefined)gl.drawArrays(gl.TRIANGLES,0,3);
    activeSlots=drawLayers(layers,prepareUpload);
    if(foregroundOpacity>0){
      gl.viewport(0,0,bufferWidth,bufferHeight);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform4f(sourceUV,0,0,1,1);
      gl.uniform1f(opacity,foregroundOpacity);gl.drawArrays(gl.TRIANGLES,0,3);
    }
  }
  const draw=(renderer,changed,opaque=false,layers=[],freezeKey=null,run=freezeKey,foregroundOpacity)=>{
    // Raw GL owns this pass. Reset Three's cached state once on handoff,
    // including when an offscreen canvas upload fails.
    try{compose(changed,opaque,layers,freezeKey,run,foregroundOpacity);}
    finally{gl.bindVertexArray(null);renderer.resetState();}
  };
  // Run after all scene and HUD passes, including the dragon's white flash.
  draw.topLayers=(renderer,layers)=>{
    try{
      const prepareUpload=beginPass();
      gl.useProgram(prog);gl.bindVertexArray(vao);gl.uniform1f(opacity,1);gl.uniform1i(flip,0);gl.uniform4f(sourceUV,0,0,1,1);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      activeSlots|=drawLayers(layers,prepareUpload);
    }finally{gl.bindVertexArray(null);renderer.resetState();}
  };
  draw.hasFrozen=hasFrozen;draw.releaseFrozen=release;
  draw.releaseSlot=slot=>{if(tiles[slot])gl.deleteTexture(tiles[slot].texture);tiles[slot]=null;};
  draw.releaseUnused=()=>{
    if(!frozenKey)release();
    for(let slot=0;slot<tiles.length;slot++)if(tiles[slot]&&!(activeSlots&(1<<slot))){
      gl.deleteTexture(tiles[slot].texture);tiles[slot]=null;
    }
  };
  return draw;
}
