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
  if(fullPage){ctx.fillStyle=background(ctx,fullPage.s,{x:0,y:0,w:view.width,h:view.height})||'#fffdf6';ctx.fillRect(0,0,view.width,view.height);}
  ctx.translate(view.x,view.y);
  for(const b of boxes) {
    const {x,y,w,h,s,el,tag,clip}=b;
    if(w<.1||h<.1||x+w<clip.x||y+h<clip.y||x>clip.r||y>clip.b||b.opacity===0)continue;
    if(tag==='img')el._loadImage?.();
    // Paint modal backdrops at their normal stacking position, but beyond the
    // safe-area clip. Keep dialog layout and hit targets in the usable area.
    const fullBackdrop=el.classList?.contains('zx-modal-wrap');
    if(fullBackdrop){
      const bounds={x:-view.x,y:-view.y,w:view.width,h:view.height},bg=background(ctx,s,bounds);
      if(bg){ctx.save();ctx.globalAlpha=b.opacity;ctx.fillStyle=bg;ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.restore();}
    }
    ctx.save();ctx.beginPath();ctx.rect(clip.x,clip.y,clip.r-clip.x,clip.b-clip.y);ctx.clip();
    ctx.globalAlpha=b.opacity;
    // Body sits behind the WebGL canvas in the desktop stacking order.
    if(tag!=='body'&&tag!=='#text'){
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
      if(el._scrollMax>1&&h>20){
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
      lines.forEach((l,i)=>ctx.fillText(l,tx,y+(i+.5)*lh,w));
    } else if(tag==='img'||tag==='canvas'){
      const image=el._surface;
      if(image&&(tag==='canvas'||el.complete)&&image.width&&image.height){
        const fit=s['object-fit'],ratio=(fit==='cover'?Math.max:Math.min)(w/image.width,h/image.height);
        const dw=fit==='fill'?w:ratio*image.width,dh=fit==='fill'?h:ratio*image.height;
        rounded(ctx,x,y,w,h,parseFloat(s['border-radius'])||0);ctx.clip();
        ctx.imageSmoothingEnabled=s['image-rendering']!=='pixelated';
        ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
      }
    } else if(tag==='input'||tag==='select'){
      ctx.font=layout.font(s);ctx.fillStyle=s.color;
      if(el.type==='range'){
        const {min,max}=rangeBounds(el),f=max>min?(+el.value-min)/(max-min):0;
        const zixing=el.classList.contains('zx-range'),progress=w*Math.max(0,Math.min(1,f));
        ctx.fillStyle=zixing?'#ded6eb':'#bcb6c9';ctx.fillRect(x,y+h/2-3,w,6);
        ctx.fillStyle=zixing?'#9b75d8':'#3a8cff';ctx.fillRect(x,y+h/2-3,progress,6);
        ctx.beginPath();ctx.arc(x+progress,y+h/2,zixing?9:6,0,2*Math.PI);
        ctx.fillStyle=zixing?'#fff':'#3a8cff';ctx.fill();
        if(zixing){ctx.strokeStyle='#ad8cdb';ctx.lineWidth=2;ctx.stroke();}
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
  gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;in vec2 uv;out vec4 color;uniform sampler2D ui;uniform float opacity;void main(){color=texture(ui,uv)*opacity;}'));
  gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  const opacity=gl.getUniformLocation(prog,'opacity');
  const texture=gl.createTexture(),tiles=Array.from({length:5},()=>({texture:gl.createTexture(),width:0,height:0})),vao=gl.createVertexArray();
  let width=0,height=0;
  return (renderer,changed,opaque=false,layers=[])=>{
    renderer.resetState();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
    if(opaque){gl.disable(gl.SCISSOR_TEST);gl.clearColor(.957,.949,.98,1);gl.clear(gl.COLOR_BUFFER_BIT);}
    gl.useProgram(prog);gl.uniform1f(opacity,1);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    if(changed){
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      if(width!==canvas.width||height!==canvas.height){
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
        width=canvas.width;height=canvas.height;
      }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    }
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.depthMask(false);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,3);
    for(const control of layers){
      if(!control)continue;
      const cache=tiles[control.slot||0];
      const {canvas:tile}=control;
      gl.bindTexture(gl.TEXTURE_2D,cache.texture);
      if(control.changed||cache.width!==tile.width||cache.height!==tile.height){
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
        if(cache.width!==tile.width||cache.height!==tile.height){
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tile);
          cache.width=tile.width;cache.height=tile.height;
        }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,tile);
      }
      const sx=gl.drawingBufferWidth/canvas.width,sy=gl.drawingBufferHeight/canvas.height;
      gl.viewport(Math.round(control.x*sx),Math.round((canvas.height-control.y-control.height)*sy),Math.round(control.width*sx),Math.round(control.height*sy));
      gl.uniform1f(opacity,control.opacity??1);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    gl.bindVertexArray(null);renderer.resetState();
  };
}
