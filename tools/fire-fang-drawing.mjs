// Extend the game's existing code-drawn Fang silhouette with a complete bite.
// The two jaws are registered to one canvas, so their tips meet at one point.
// Library flame bursts are layered at runtime, not baked over the teeth.
export function fireFangDrawing(frame,count=14){
 const t=frame/(count-1),close=Math.min(1,t/.34),gap=62*(1-close)**2;
 const press=close*close*(3-2*close);
 const recoil=t>.38?Math.sin(Math.min(1,(t-.38)/.62)*Math.PI)*7:0;
 const opacity=t<.65?1:Math.max(0,1-(t-.65)/.35);
 const fang=`<path d="M -130 -46 Q -103 -60 -77 -39 Q -80 20 -60 93 Q -109 45 -130 -46 Z" fill="#ffcb50"/>
 <path d="M -117 -42 Q -99 -50 -87 -37 Q -90 23 -60 93 Q -104 37 -117 -42 Z" fill="#fff3c6"/>`;
 // A shallow curved gum line and broad canines read as a bite at phone size.
 // Keep both sides of the mouth open: no rectangular frame or reticle.
 const tooth=`<path d="M -158 -46 Q -150 -92 -118 -111 L -124 -136 L -91 -120 Q -45 -146 0 -135 Q 50 -144 94 -117 L 125 -139 L 121 -108 Q 149 -88 158 -46 L 132 -29 Q 119 41 60 93 Q 76 25 68 -36 Q 46 -51 28 -52 L 16 -18 L 4 -48 L -7 -21 L -22 -52 Q -45 -50 -68 -36 Q -76 25 -60 93 Q -119 41 -132 -29 Z" fill="#ef4e1d" stroke="#a83826" stroke-width="4" stroke-linejoin="round"/>
 <path d="M -140 -58 Q -100 -127 0 -117 Q 100 -127 140 -58 L 123 -42 Q 86 -92 0 -83 Q -86 -92 -123 -42 Z" fill="#ffb637"/>
 <path d="M -32 -65 Q 0 -74 32 -65 L 16 -18 L 4 -48 L -7 -21 L -22 -52 Z" fill="#ffe79a"/>
 ${fang}<g transform="scale(-1 1)">${fang}</g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><g opacity="${opacity}" transform="translate(256 256)">
 <g transform="translate(0 ${-45-gap-recoil+44*press})">${tooth}</g>
 <g transform="translate(0 ${53+gap+recoil*.3-54*press}) rotate(180) scale(.68 .55)">${tooth}</g>
 </g></svg>`;
}
