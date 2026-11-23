'use strict';

async function withTimeout(work, ms, message) {
  let timer;
  try {
    return await Promise.race([work, new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error(message)), ms);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

function waitForPlayEntry() {
  const box = GameGlobal.pokebonkPlayEntry || (GameGlobal.pokebonkPlayEntry = {});
  return new Promise((resolve,reject) => {
    function accept(api) {
      if (api && typeof api.setup==='function' && typeof api.run==='function') resolve(api);
      else reject(Error('玩法入口无效，请重新进入当前预览版本。'));
    }
    if (box.api) accept(box.api);
    else box.receive = accept;
  });
}

function wechatShareCard() {
  const card = {
    imageUrl: 'https://mmocgame.qpic.cn/wechatgame/Lnv5AWb3c38RlWjS8GK26kuqMRK1WBCibFAnuaX4Y9zrVUyWYSia6a8uZWDZmb7RQH/0',
    imageUrlId: '7gHnnS4/SAOz6NkjSKZjYg==',
  };
  try {
    const account = wx.getAccountInfoSync && wx.getAccountInfoSync().miniProgram;
    if (account && (account.envVersion === 'develop' || account.envVersion === 'trial')) {
      const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
      console.info('[游戏分享]', JSON.stringify({source:'微信菜单', appId:account.appId, envVersion:account.envVersion,
        wechat:info.version, sdk:info.SDKVersion, card}));
    }
  } catch (error) { console.warn('[游戏分享] 无法读取版本信息', error); }
  return card;
}

async function launchEngine(host, play, showProgress) {
  const env = await play.setup(host);
  showProgress(95);
  if (host.onApp) env.onApp = host.onApp;
  let booted = false;
  const firstFrame = new Promise((resolve, reject) => {
    const draw = env.drawUI;
    let failures = 0;
    env.onBootRenderError = error => {
      if (++failures >= 3) {
        env.onBootRenderError = undefined;
        reject(error);
      }
    };
    env.drawUI = (renderer,...args) => {
      renderer.resetState();
      draw(renderer,...args);
      if (!booted) {
        showProgress(undefined,renderer);
        return;
      }
      // Complete the bar only after the real home frame succeeds.
      showProgress(100,renderer);
      if (env.invalidateUI) env.invalidateUI();
      draw(renderer,...args);
      env.drawUI = draw;
      env.onBootRenderError = undefined;
      resolve();
    };
  });
  host.bootStage('读取玩法与字形',95);
  const engine = play.run(env).then(() => { booted = true; });
  await Promise.all([firstFrame, engine]);
}

async function start() {
  const began = Date.now();
  // A card can be opened while the play subpackage is still downloading.
  const roomInvites = {code: '', onInvite: null};
  const host = {
    roomInvites,
    bootDiagnostics:{stages:[],completed:false},
  };
  if (wx.onShareAppMessage) {
    wx.onShareAppMessage(wechatShareCard);
  }
  if (wx.showShareMenu) {
    wx.showShareMenu({menus:['shareAppMessage'], fail:e=>console.warn('[字行] 转发菜单未开启', e.errMsg)});
  }
  function receiveInvite(options) {
    const code = options && options.query && options.query.roomCode;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return;
    roomInvites.code = code;
    if (roomInvites.onInvite) roomInvites.onInvite();
  }
  if (wx.getLaunchOptionsSync) receiveInvite(wx.getLaunchOptionsSync());
  wx.onShow(receiveInvite);
  let phase = '创建画面', splash, shown = 0;
  function stage(title) {
    phase = title;
    const ms=Date.now()-began;
    host.bootDiagnostics.stages.push({stage:title,ms});
    console.info('[宝可梦启动]', title, ms, 'ms');
  }
  function showProgress(value = shown, renderer) {
    if (!splash || value < shown || (value === shown && !renderer)) return;
    shown = value;
    try {
      splash.draw(value, !!renderer);
    } catch (error) {
      console.warn('[宝可梦启动] 无法更新加载进度', error);
      splash.dispose();
      splash = null;
    } finally {
      if (renderer) renderer.resetState();
    }
  }
  host.bootStage=(title,value)=>{stage(title);showProgress(value);};
  try {
    stage('字行 · 打开纸上世界');
    const canvas = wx.createCanvas();
    const view = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const width=view.windowWidth||canvas.width||360,height=view.windowHeight||canvas.height||640;
    const density=Math.min(view.pixelRatio||1,2,Math.sqrt(2000000/(width*height)));
    canvas.width = Math.max(1, Math.round(width*density));
    canvas.height = Math.max(1, Math.round(height*density));
    let gl;
    try { gl = canvas.getContext('webgl2', {alpha:true, antialias:false, depth:true, stencil:false}); }
    catch (error) { console.warn('[宝可梦启动] 尝试默认 WebGL 2 参数', error); }
    if (!gl) gl = canvas.getContext('webgl2');
    if (!gl) throw Error('当前微信环境无法创建 WebGL 2 画面，请更新微信后重新进入。');
    splash = await require('./boot-screen')(gl);
    console.info('[宝可梦启动] 启动画面已提交', Date.now() - began, 'ms');
    const files = require('./files');
    GameGlobal.pokebonk = Object.assign(host, {canvas, files});
    stage('准备游戏资源');
    const downloaded = {play:0, text:0};
    function packageProgress(name, percent) {
      if (!Number.isFinite(percent)) return;
      downloaded[name] = Math.max(downloaded[name], Math.min(100, percent));
      // Reserve the last 15% for unpacking, entry registration and the first rendered home frame.
      showProgress(5 + Math.floor((45 * downloaded.play + 35 * downloaded.text) / 100));
    }
    showProgress(5);
    const [play] = await withTimeout(Promise.all([
      files.loadPackage('play', p=>packageProgress('play',p)).then(()=>{
        packageProgress('play',100);
        return withTimeout(waitForPlayEntry(),15000,'玩法分包已下载，但微信未执行入口。');
      }),
      files.init(p=>packageProgress('text',p)).then(()=>packageProgress('text',100))
    ]), 120000, '准备游戏数据超时，请重新进入。');
    stage('准备桌面场景与角色');
    const prepared={world:0,art:0};
    await withTimeout(files.prepareForest(state=>{
      const ratio=state.total?Math.min(1,state.completed/state.total):0;
      const value=state.phase==='ready'?1:state.phase==='write'?.7+.3*ratio:state.phase==='unpack'?.6:.55*ratio;
      prepared[state.name]=Math.max(prepared[state.name]||0,value);
      showProgress(85+Math.floor(2.5*(prepared.world+prepared.art)));
    }),120000,'桌面场景与角色资源准备超时，请重新进入。');
    stage('绘制游戏首页');
    showProgress(90);
    await withTimeout(launchEngine(host,play,showProgress), 60000, '游戏首页未能在限时内绘制，请重新进入。');
    host.bootDiagnostics.completed=true;
    host.bootDiagnostics.totalMs=Date.now()-began;
    console.info('[宝可梦启动] 游戏首页已绘制', Date.now() - began, 'ms');
  } catch (error) {
    console.error('[宝可梦] ' + phase + '失败', error);
    const restart = typeof wx.restartMiniProgram === 'function';
    wx.showModal({title:phase + '失败', content:(error && (error.errMsg || error.message)) || String(error),
      confirmText:restart ? '重新进入' : '退出游戏', showCancel:false,
      success:() => restart ? wx.restartMiniProgram({}) : wx.exitMiniProgram({})});
  } finally {
    if (splash) splash.dispose();
    splash = null;
  }
}
start();
