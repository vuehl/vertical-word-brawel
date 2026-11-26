import {paperPalette} from './paper-shapes.js';

// Rarity is a small printed accent, while every reward uses the journal stock.
// Presentation metadata only: no reward values, rolls or callbacks are changed.
export const qualityPalette=[
 {key:'common',label:'普通',border:'#8F8377',ink:'#62584E'},
 {key:'uncommon',label:'少见',border:'#7C9467',ink:'#49633E'},
 {key:'rare',label:'稀有',border:'#7B91A6',ink:'#4A627B'},
 {key:'epic',label:'史诗',border:'#A08AAB',ink:'#765B82'},
 {key:'legendary',label:'传说',border:'#BA913C',ink:'#815D22'},
].map(quality=>({...quality,fill:paperPalette.card}));
const specialQuality={key:'special',label:'特殊',fill:paperPalette.card,border:'#AF8C78',ink:'#805C48'};
const allQualities=[...qualityPalette,specialQuality];
export const qualityPaper=Object.fromEntries(allQualities.map(q=>[q.key,
  [paperPalette.darkStock,paperPalette.card,paperPalette.inset,q.border,q.ink]]));
export const upgradeStocks=Object.fromEntries(allQualities.map(q=>[q.key,
  [paperPalette.card,paperPalette.yellow,q.ink]]));
// The CSS fallback and native rarity ribbons use the same accent values.
export const qualityPaletteStyle=allQualities.map(q=>`
.zx .zx-quality-card[data-quality="${q.key}"]{background:${q.fill};border-color:var(--paper-darkStock)}
.zx .zx-quality-badge.${q.key}{background:${q.ink};border-color:${q.ink};color:var(--paper-warmWhite)}
.zx-level-up [data-quality="${q.key}"]>.zx-level-stamp{background:${q.ink}}
`).join('');
export function choiceQuality(rarity,label){
 const q=Number.isInteger(rarity)&&rarity>=0&&rarity<qualityPalette.length?qualityPalette[rarity]:specialQuality;
 return {...q,label:label||q.label};
}
export function choiceModel(method,args,index,tag=''){
 if(method==='showBlessing')return {quality:choiceQuality(args[2]?.[index]?.rarity),kind:'祝福',blessing:true};
 const data=method==='showTrade'?args[1]?.offers?.[index]:method==='showPact'?args[1]?.[index]:null;
 if(data)return {quality:choiceQuality(data.rarity,data.rarityLabel),kind:method==='showPact'?['契约',tag].filter(Boolean).join(' · '):data.tag||tag,off:data.off||''};
 return {quality:choiceQuality(undefined),kind:tag};
}
export function effectScope(label){
 return /永久|永远|Para siempre/i.test(label)?'本局持续':label;
}
