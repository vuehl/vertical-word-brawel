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
  let phase = '创建画面', splash, shown = 0, animationTimer, activeRenderer;
  let lastPaint = 0, lastAdvance = began, displayed = 0, animationFrom = 0, waitingForRetry = false;
  function stage(title) {
    phase = title;
    const ms=Date.now()-began;
    host.bootDiagnostics.stages.push({stage:title,ms});
    console.info('[宝可梦启动]', title, ms, 'ms');
  }
  function paintProgress(renderer) {
    if (!splash || waitingForRetry) return;
    lastPaint = Date.now();
    const seconds = Math.max(0, Math.floor((lastPaint - lastAdvance) / 1000));
    // Estimate within the current stage between native callbacks. The next
    // stage and the completed home frame can only be reached by real work.
    const ceiling = shown < 50 ? 50 : shown < 90 ? 90 : 100;
    const estimate = animationFrom + (ceiling - animationFrom) * seconds / (60 + seconds);
    displayed = shown === 100 ? 100 : Math.max(displayed, Math.min(ceiling - .01, Math.floor(estimate * 100) / 100));
    try {
      splash.draw(displayed, !!renderer, ((lastPaint - began) % 1800) / 1800, seconds);
    } catch (error) {
      console.warn('[宝可梦启动] 无法更新加载进度', error);
      splash.dispose();
      splash = null;
    } finally {
      if (renderer) renderer.resetState();
    }
  }
  function showProgress(value = shown, renderer) {
    if (!splash) return;
    if (value > shown) {
      shown = value;
      animationFrom = Math.max(displayed, shown);
      lastAdvance = Date.now();
    }
    // The renderer can cover the splash on any frame. Restore its GL state
    // after both overlays and timer-driven paints between game frames.
    if (renderer) {
      activeRenderer = renderer;
      paintProgress(renderer);
    }
  }
  host.bootStage=(title,value,renderer)=>{stage(title);showProgress(value,renderer);};
  async function prepareResources(jobs) {
    let pending = jobs;
    while (pending.length) {
      const failed = [], messages = [];
      await Promise.all(pending.map(async ([name, run]) => {
        try { await run(); }
        catch (error) {
          failed.push([name, run]);
          messages.push(name + '：' + (error.errMsg || error.message || String(error)));
        }
      }));
      if (!failed.length) return true;
      const content = messages.join('\n');
      console.warn('[字行启动]', content);
      waitingForRetry = true;
      const restart = typeof wx.restartMiniProgram === 'function';
      const choice = await new Promise((resolve, reject) => wx.showModal({
        title:'资源准备失败', content, confirmText:'重试', cancelText:restart ? '重新进入' : '退出游戏',
        success:resolve, fail:() => reject(Error(content))
      }));
      if (!choice.confirm) {
        if (restart) wx.restartMiniProgram({});
        else wx.exitMiniProgram({});
        return false;
      }
      animationFrom = Math.max(shown, displayed);
      lastAdvance = Date.now();
      waitingForRetry = false;
      pending = failed;
    }
  }
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
    animationTimer = setInterval(() => {
      if (shown < 100 && Date.now() - lastPaint >= 75) paintProgress(activeRenderer);
    }, 100);
    console.info('[宝可梦启动] 启动画面已提交', Date.now() - began, 'ms');
    const files = require('./files');
    GameGlobal.pokebonk = Object.assign(host, {canvas, files});
    stage('准备游戏资源');
    const prepared = {play:0, text:0, world:0, art:0};
    function installProgress(state) {
      const ratio = state.total ? Math.min(1, state.completed / state.total) : 0;
      const value = state.phase === 'ready' ? 1 : state.phase === 'write' ? .7 + .3*ratio :
        state.phase === 'unpack' ? .6 : .55*ratio;
      prepared[state.name] = Math.max(prepared[state.name], value);
      if (state.name === 'text') updateDownloads();
      else showProgress(Math.min(89, 50 + Math.floor(12*prepared.world + 28*prepared.art)));
    }
    function updateDownloads() {
      showProgress(Math.min(49, 5 + Math.floor(30*prepared.play + 15*prepared.text)));
    }
    showProgress(5);
    let play;
    // Downloads have their own inactivity watchdog, and file operations have
    // per-call timeouts. Slow installs that keep advancing can finish.
    const resourcesReady = await prepareResources([
      ['玩法包', async () => {
        await files.loadPackage('play', p => {
          prepared.play = Math.max(prepared.play, Math.min(1, p / 100));
          updateDownloads();
        });
        prepared.play = 1;
        updateDownloads();
        play = await withTimeout(waitForPlayEntry(),15000,'玩法分包已下载，但微信未执行入口。');
      }],
      ['文字资源', () => files.init(undefined, installProgress)]
    ]);
    if (!resourcesReady) return;
    stage('准备桌面场景与角色');
    showProgress(50);
    if (!await prepareResources([['场景与角色', () => files.prepareForest(installProgress)]])) return;
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
    clearInterval(animationTimer);
    activeRenderer = null;
    if (splash) splash.dispose();
    splash = null;
  }
}
start();
