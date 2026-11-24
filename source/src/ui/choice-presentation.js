// Presentation metadata only: no reward values, rolls or callbacks are changed.
export const qualityPalette=[
 {key:'common',label:'普通',fill:'#f0f2f3',border:'#a7afb7',ink:'#465362'},
 {key:'uncommon',label:'少见',fill:'#e7f3e4',border:'#7eab74',ink:'#365d32'},
 {key:'rare',label:'稀有',fill:'#e4effc',border:'#729ed1',ink:'#315f94'},
 {key:'epic',label:'史诗',fill:'#eee5fb',border:'#a186c2',ink:'#67468b'},
 {key:'legendary',label:'传说',fill:'#fff0c7',border:'#cca24b',ink:'#805b16'},
];
export const qualityPaper={
  common:['#979CAE','#EDEEF4','#E3E6ED','#BCC2D3','#747B8F'],
  uncommon:['#2F764B','#F0F6F1','#E0EBE5','#83B88E','#437846'],
  rare:['#4377CE','#E5F1F9','#EBEBF8','#67AFD1','#2F69BA'],
  epic:['#8460AD','#F1ECF8','#E8E0F6','#B89CDE','#785AA4'],
  legendary:['#D67D5B','#F7F2DF','#F1E3C7','#D1A348','#C0623E'],
  special:['#8A87A7','#F0EFF6','#E3E2EF','#B3ACCC','#776D92'],
};
export function choiceQuality(rarity,label){
 const q=Number.isInteger(rarity)&&rarity>=0&&rarity<qualityPalette.length?qualityPalette[rarity]:{key:'special',label:'特殊',fill:'#f4ebe0',border:'#bba68f',ink:'#6b5841'};
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
