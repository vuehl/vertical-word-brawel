import {multiplayerConfig as config} from '../source/src/multiplayer-config.js';
import {initGameCloud} from './cloud-progress.mjs';

function describe(error) {
  const detail = error?.errMsg || error?.message || error?.reason || (typeof error === 'string' ? error : '');
  const code = error?.errCode ?? error?.errno ?? error?.code;
  return [detail, code == null ? '' : '错误码 ' + code].filter(Boolean).join(' ').slice(0, 160) || '连接已关闭';
}

export function cloudSocket(wx, events) {
  let task, closed = false, authenticated = false, pendingBytes = 0;
  // Keep at most one native send in flight per destination. Busy phones send
  // the latest pose when the WeChat callback runs, not a backlog of old poses.
  const busySeats=new Set(), latest=new Map();
  let phase = '微信登录', attempt = 0, timer, connectionId = '';
  function closeTask(socket) {
    try { socket?.close({code: 1000}); } catch { /* Socket already closed. */ }
  }
  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    closeTask(task);
  }
  function fail(error) {
    if (closed) return;
    close();
    const trace = connectionId ? '〔连接号 ' + connectionId.slice(0, 8) + '〕' : '';
    events.error(Error(phase + trace + '：' + describe(error)));
  }
  async function connect() {
    const cloud = wx.cloud;
    if (!wx.login || !cloud?.connectContainer || !cloud.callContainer)
      throw Error('当前微信环境缺少云托管联机接口，请更新微信后重试');
    await initGameCloud(cloud);
    if (closed) return;
    const login = await new Promise((success, fail) => wx.login({timeout:8000,success,fail}));
    if (closed) return;
    if (!login?.code) throw Error('未取得微信登录凭证');
    const response = await cloud.callContainer({config:{env:config.env},path:'/v1/coop/login',
      header:{'X-WX-SERVICE':config.service,'content-type':'application/json'},method:'POST',data:{code:login.code}});
    if (closed) return;
    if (response.statusCode === 404) throw Error('请先部署支持微信登录的联机服务');
    if (response.statusCode !== 200 || !response.data?.openid || !response.data?.ticket)
      throw Error(response.data?.error || '联机登录服务响应异常（HTTP ' + response.statusCode + '）');

    connectionId = response.data.connectionId || '';
    if (!/^[0-9a-f]{32}$/.test(connectionId)) throw Error('请先部署支持手机握手的新版联机服务');
    await openSocket(response.data);
  }
  async function openSocket({openid, ticket}) {
    phase = '云托管连接';
    const current = ++attempt;
    const active = () => !closed && current === attempt;
    let sent = false;
    function interrupted(error) {
      if (!active()) return;
      clearTimeout(timer);
      if (!sent && current === 1) {
        const previous = task;
        task = undefined;
        void openSocket({openid, ticket}).catch(fail);
        closeTask(previous);
      } else {
        fail(error);
      }
    }
    timer = setTimeout(() => interrupted(Error('等待云托管握手超时')), 8000);
    try {
      const {socketTask} = await wx.cloud.connectContainer({config:{env:config.env},service:config.service,
        path:'/ws/' + connectionId, timeout:8000});
      if (!active()) { closeTask(socketTask); return; }
      task = socketTask;
    } catch (error) { interrupted(error); return; }
    const authenticate = () => {
      if (!active() || sent) return;
      sent = true;
      phase = '联机身份校验';
      clearTimeout(timer);
      timer = setTimeout(() => interrupted(Error('等待服务端确认身份超时')), 8000);
      try { task.send({data:JSON.stringify({op:'auth',openid,ticket}),fail}); }
      catch (error) { fail(error); }
    };
    task.onMessage(({data}) => {
      if (!active()) return;
      if (authenticated) { events.message(data); return; }
      let reply;
      try { reply = JSON.parse(data); } catch { fail(Error('联机身份校验响应无效')); return; }
      if (reply?.op === 'auth_required') { authenticate(); return; }
      if (!sent || reply?.op !== 'authenticated') { fail(Error(reply?.error || '联机服务版本不匹配')); return; }
      clearTimeout(timer);
      authenticated = true;
      phase = '联机通信';
      events.open();
    });
    task.onError(interrupted);
    task.onClose(event => {
      if (!active()) return;
      if (!authenticated) { interrupted(event); return; }
      closed = true;
      events.close(event);
    });
    task.onOpen(authenticate);
    if (task.readyState === 1) authenticate();
  }
  void connect().catch(fail);
  function transmit(data,seat){
    if(closed || !authenticated)return false;
    const size=typeof data==='string'?data.length*3:data.byteLength;
    pendingBytes+=size;
    if(seat!==null)busySeats.add(seat);
    try{
      task.send({data,fail,complete:()=>{
        pendingBytes-=size;
        if(seat===null)return;
        busySeats.delete(seat);
        const next=latest.get(seat);latest.delete(seat);
        if(next && !closed && pendingBytes<=256*1024)transmit(next,seat);
      }});
    }catch(error){fail(error);return false;}
    return true;
  }
  return {
    send(data, disposable) {
      if (closed || !authenticated || (disposable && pendingBytes > 256 * 1024)) return false;
      if (pendingBytes > 1024 * 1024) { fail(Error('网络拥堵，请重新组队')); return false; }
      const seat=disposable?new Uint8Array(data,0,1)[0]:null;
      if(seat!==null && busySeats.has(seat)){latest.set(seat,data);return true;}
      return transmit(data,seat);
    },
    close,
  };
}
