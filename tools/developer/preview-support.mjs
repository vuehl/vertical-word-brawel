import fs from 'node:fs';
import path from 'node:path';

export function verifyDeveloperPreview(project){
  const main=fs.readFileSync(path.join(project,'minigame/game.js'),'utf8');
  const play=fs.readFileSync(path.join(project,'minigame/play.js'),'utf8');
  return verifyDeveloperBundle(main,play);
}
export function verifyDeveloperBundle(main,play){
  const id=/api\.developerBuild\s*===\s*"([^"]+)"/.exec(main)?.[1];
  if(!id||!play.includes('developerBuild:'+JSON.stringify(id)))throw Error('开发测试入口与玩法包标识不匹配，已停止生成二维码。');
  for(const marker of ['__zixingDeveloper','zx-dev-button','zx-dev-panel','开发测试版 DEV 8','pokebonk-dev-save.json']){
    if(!play.includes(marker))throw Error('开发包缺少测试模块：'+marker+'，已停止生成二维码。');
  }
  return id;
}

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function writeDeveloperPreviewPage({file,qr,project,buildId,createdAt}){
  const data=fs.readFileSync(qr).toString('base64');
  fs.writeFileSync(file,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>开发测试 DEV 8 · 本次扫码入口</title>
<style>*{box-sizing:border-box}body{margin:0;background:#edf2eb;color:#263d32;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:660px;margin:24px auto;padding:28px;background:#fffdf5;border:2px solid #e3a25c;border-radius:20px}h1{margin:0;font-size:28px}.tag{display:inline-block;padding:3px 12px;border-radius:20px;background:#ffe0ad;font-weight:700}.qr{display:block;width:380px;max-width:100%;height:auto;margin:20px auto}ol{padding-left:24px}small{display:block;color:#68786c;overflow-wrap:anywhere}code{font-size:13px}p{margin:12px 0}@media(max-width:700px){main{margin:12px;padding:20px}}</style>
<main><span class="tag">开发测试 · DEV 8</span><h1>请扫本页的新二维码</h1><p>本次构建包含分钟选择、怪数、按时间首领、区域 Boss 和完整战斗预设。</p>
<img class="qr" src="data:image/jpeg;base64,${data}" alt="本次开发测试二维码">
<ol><li>手机完全退出当前小游戏，再扫描上方二维码。</li><li>首页顶部应显示 <strong>开发测试版 DEV 8</strong>。</li><li>进入战斗自动打开测试面板；之后点暂停左侧的橙色 <strong>测试</strong>，也可在暂停菜单选择 <strong>开发者测试</strong>。</li></ol>
<p>如果首页没有 DEV 8，说明这次启动没有进入本页对应的开发包。</p><small>生成时间：${escape(createdAt)}<br>构建标识：<code>${escape(buildId)}</code><br>开发工程：${escape(project)}</small>
<p>以后运行 <code>npm run preview:dev</code>，会自动打开新生成的页面。</p></main></html>`,'utf8');
}
