// Broad, registered ink cuts extending the game's code-drawn melee vocabulary.
export function fireScratchDrawing(frame,count=12){
 const t=frame/(count-1),reveal=Math.min(1,t/.25),fade=t<.7?1:Math.max(0,(1-t)/.3);
 const stroke=`<path d="M 66 -168 Q -24 -62 -59 147 Q -12 90 8 25 Q 28 -72 66 -168 Z" fill="#456477" stroke="#294859" stroke-width="5" stroke-linejoin="round"/><path d="M 61 -158 Q -11 -40 -49 134 Q -5 58 9 -8 Q 30 -89 61 -158 Z" fill="#d1e8e8"/><path d="M 57 -146 Q -4 -30 -41 111 Q -13 30 10 -34 Z" fill="#fff9e5"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><clipPath id="ink"><rect x="0" y="0" width="512" height="${512*reveal}"/></clipPath></defs><g clip-path="url(#ink)" opacity="${fade}"><g transform="translate(158 256) rotate(9)">${stroke}</g><g transform="translate(256 238) scale(1.1)">${stroke}</g><g transform="translate(351 269) rotate(-8) scale(.9)">${stroke}</g></g></svg>`;
}

// A single short wound, separate from the three fingers of the attack.
export function fireScratchHitDrawing(frame,count=10){
 const t=frame/(count-1),reveal=Math.min(1,(t+.12)/.25),fade=t<.45?1:Math.max(0,(1-t)/.55);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><clipPath id="cut"><rect width="512" height="${512*reveal}"/></clipPath></defs><g clip-path="url(#cut)" opacity="${fade}"><path d="M364 72 Q231 240 153 440 Q199 249 364 72Z" fill="#384858"/><path d="M355 86 Q232 245 159 421 Q221 245 355 86Z" fill="#fff2ce"/></g></svg>`;
}
