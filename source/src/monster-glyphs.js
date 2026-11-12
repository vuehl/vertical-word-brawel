// Original transparent silhouettes supplied in 新怪.zip. Keep combat IDs intact.
export const monsterGlyphs=Object.freeze({
  苞:['#d8f28c','#62b556'],菌:['#d4ee91','#73af50'],藤:['#9de7a3','#3e9c69'],
  虫:['#e4ee87','#9ab547'],蛇:['#ceadf2','#8862be'],岩:['#eac48a','#b58a59'],
  烬:['#ffc277','#ed6745'],驹:['#ffd492','#df9858'],拳:['#ffa99a','#d66370'],
  锯:['#a2e5d7','#459f99'],逆:['#c9b5f4','#8e6bce'],贪:['#ffe9a0','#d8ae50'],
  恼:['#ffbcaf','#df6c81'],寐:['#cbbefa','#8a7aca'],弹:['#fbc0e0','#cf71a9'],
  瓶:['#a7dce7','#60a4bb'],罐:['#f5cb97','#c98d68'],冰:['#c3f2ff','#63b9e5'],
  鲤:['#a8e5f1','#58accb'],
});
const words=Object.keys(monsterGlyphs),bySpecies=new Map();
const groups={
  苞:[1,2,3,43,44,45,69],菌:[46,47,48,49],藤:[70,71,102,103,114],
  虫:[10,11,12,13,14,15],蛇:[23,24,147,148,149],岩:[27,28,50,51,74,75,76,95,111,112,138,139],
  烬:[4,5,6,37,38,58,59,126,136,146],驹:[77,78,84,85,128],拳:[56,57,66,67,68,106,107],
  锯:[83,123,127,140,141,142],逆:[29,30,31,32,33,34,150,151],贪:[19,20,52,53,108,113,115,133,137],
  恼:[16,17,18,21,22,25,26,41,42,81,82,125,135,145],寐:[35,36,39,40,63,64,65,79,80,96,97,122,132,143],
  弹:[100,101],瓶:[72,73,88,89,92,93,94,109,110],罐:[54,55,60,61,62,90,98,99,104,105],
  冰:[86,87,91,124,131,134,144],鲤:[7,8,9,116,117,118,119,120,121,129,130],
};
for(const [word,ids] of Object.entries(groups))for(const id of ids)bySpecies.set(id,word);
export function monsterWordForSpecies(id){
  return bySpecies.get(Number(id))||words[((Number(id)||1)-1+words.length)%words.length];
}
