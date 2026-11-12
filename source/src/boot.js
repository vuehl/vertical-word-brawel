import {setChineseText} from './chinese-text.js';

async function start(){
  const response=await fetch(new URL('../text/ui.json',import.meta.url));
  if(!response.ok)throw Error('无法读取中文界面文字');
  setChineseText(await response.json());
  await import('./game.js');
  dispatchEvent(new Event('pokebonk:modules-ready'));
}
start().catch(error=>{
  console.error('[字行] 启动失败',error);
  dispatchEvent(new Event('pokebonk:boot-failed'));
});
