import {multiplayerConfig} from './multiplayer-config.js';
import {CoopStart} from './coop-start.js';


function socketErrorDetail(error) {
  const message = typeof error === 'string' ? error : error?.errMsg || error?.message || error?.reason || '';
  const code = error?.errCode ?? error?.errno ?? error?.code;
  const detail = String(message).replace(/[\r\n\t]+/g, ' ').slice(0, 380);
  return (detail ? ' ' + detail : '') + (code !== undefined ? '（错误码 ' + String(code).slice(0, 24) + '）' : '');
}

export class RelayRoom {
  constructor() {
    this.ev = {}; this.pending = new Map();
    this.sequence = 0; this.alive = true; this.inRun = false; this.startedSeen = false;
    this.traffic={snapSent:0,snapReceived:0,castSent:0,castReceived:0,ultSent:0,ultReceived:0};
    this.room = {members: [], state: 'lobby'}; this.me = null;
    this.mesh = {
      broadcast: data => this.control('', data),
      sendCtl: (to, data) => this.control(to, data),
      sendSnap: (to, data) => this.snapshot(to, data),
      rtt: () => this.roundTrip || 0,
    };
  }
  static async connect({code, name, species = 4, factory, resume}) {
    if (typeof factory !== 'function') throw Error('请在微信小游戏内进入多人联机');
    const session = new RelayRoom();
    session.resume = resume;
    try {
      await new Promise((resolve, reject) => {
        session.connectReject = reject;
        session.connectTimer = setTimeout(() => session.end('连接云托管超时，请稍后重试'), 30000);
        session.socket = factory({
          open() { clearTimeout(session.connectTimer); session.connectReject = null; resolve(); },
          message(data) { session.receive(data); },
          error(error) {
            const detail = socketErrorDetail(error);
            const reason = '无法连接字灵联机服务。';
            session.end(reason + detail);
          },
          close(event) { session.end('与联机服务的连接已断开，请重新组队。' + socketErrorDetail(event)); },
        });
        if (!session.alive) session.socket?.close();
      });
      await session.request(code ? 'join' : 'create', {code, name, species, seat:resume?.seat, party:resume?.party, protocol: multiplayerConfig.protocol, build: multiplayerConfig.build});
      session.pongAt = Date.now();
      session.heartbeat = setInterval(() => {
        if (Date.now() - session.pongAt > 45000) session.end('网络连接已超时，请重新组队');
        else { session.pingAt = Date.now(); session.send({op: 'ping'}); }
      }, 10000);
      return session;
    } catch (error) { session.end(error.message, false); throw error; }
  }
  get open() { return this.alive; }
  get code() { return this.room.code; }
  get mine() { return this.room.members.find(member => member.id === this.me); }
  get others() { return this.room.members.filter(member => member.id !== this.me); }
  get isHost() { return this.room.host === this.me; }
  linkState(id) { return this.alive && this.room.members.some(member => member.id === id && !member.offline) ? 'open' : 'closed'; }
  send(message) { return this.alive && this.socket?.send(JSON.stringify(message)); }
  request(op, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.alive) { reject(Error('连接已关闭，请重新组队')); return; }
      const id = ++this.sequence;
      const timer = setTimeout(() => { this.end('服务器响应超时，请重新组队'); }, 10000);
      this.pending.set(id, {resolve, reject, timer});
      if (!this.send({...data, op, id})) this.end('联机消息发送失败，请重新组队');
    });
  }
  apply(room) {
    if (!room || !Array.isArray(room.members)) return;
    const previous = this.room.members;
    this.room = room;
    this.startGate?.checkRoom(room);
    for (const member of previous) if (!room.members.some(next => next.id === member.id)) this.ev.link?.(member.id, 'closed');
    for (const member of room.members) {
      const old = previous.find(m => m.id === member.id);
      if (old && (old.offline !== member.offline || old.generation !== member.generation))
        this.ev.link?.(member.id, member.offline ? 'closed' : 'open');
    }
    this.ev.change?.();
    if (room.state === 'started' && !this.startedSeen) {
      this.startedSeen = true;
      this.returning = !!this.resume && !!room.running;
      if (!this.returning) this.startGate=new CoopStart({me:this.me,host:room.host,members:room.members,party:room.party,
        profile:'portrait',send:(to,data)=>this.control(to,data)});
      this.ev.start?.(room);
    }
  }
  receive(raw) {
    if (!this.alive) return;
    if (raw instanceof ArrayBuffer) {
      if (raw.byteLength < 2) return;
      const slot = new Uint8Array(raw,0,1)[0];
      const from = this.room.members.find(member => member.slot === slot);
      if (from && from.id !== this.me) {this.traffic.snapReceived++;this.ev.snap?.(from.id, raw, 1);}
      return;
    }
    let message; try { message = JSON.parse(raw); } catch { return; }
    if (message.op === 'pong') { this.pongAt = Date.now(); this.roundTrip = this.pongAt - (this.pingAt || this.pongAt); return; }
    if (message.op === 'closed') { this.end(message.reason); return; }
    if (message.op === 'room') { this.apply(message.room); return; }
    if (message.op === 'ctl') {
      if (message.data?.t==='resume-world' && this.worldReply && this.room.members.some(m=>m.id===message.from && !m.offline)) {
        this.worldReply(message.data);
        return;
      }
      if(this.others.some(member=>member.id===message.from)&&!this.startGate?.receive(message.from,message.data)){
        if(message.data?.t==='fx')this.traffic.castReceived++;
        if(message.data?.t==='ult')this.traffic.ultReceived++;
        this.ev.ctl?.(message.from,message.data);
      }
      return;
    }
    if (message.op !== 'reply') return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id); clearTimeout(pending.timer);
    if (message.error) { pending.reject(Error(message.error)); return; }
    this.me = message.me; this.apply(message.room); pending.resolve(message);
  }
  control(to, data) {
    const sent=this.send({op:'ctl',to,data});
    if(sent&&data?.t==='fx')this.traffic.castSent++;
    if(sent&&data?.t==='ult')this.traffic.ultSent++;
    return sent;
  }
  snapshot(to, data) {
    const target = this.room.members.find(member => member.id === to);
    if (!this.alive || !target) return false;
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const packet = new Uint8Array(bytes.length + 1); packet[0] = target.slot; packet.set(bytes, 1);
    const sent=this.socket.send(packet.buffer, true);
    if(sent)this.traffic.snapSent++;
    return sent;
  }
  setPick(species) { return this.request('pick', {species}); }
  setReady(ready) { return this.request('ready', {ready}); }
  setSettings(_biome, tier) { return this.request('settings', {tier}); }
  kick(to) { return this.request('kick', {to}); }
  start() { return this.request('start'); }
  waitForBattleStart(progress) {
    if(!this.alive)return Promise.reject(Error('连接已断开，请重试'));
    if(this.returning)return Promise.resolve();
    return this.startGate?this.startGate.ready(progress):Promise.reject(Error('开局同步尚未建立，请重新组队'));
  }
  currentWorld() {
    return new Promise((resolve,reject)=>{
      const finish=(world)=>{
        clearInterval(retry);clearTimeout(timeout);this.worldReply=null;
        if(world)resolve(world);else reject(Error('暂时无法同步队友所在区域，请重试'));
      };
      const ask=()=>this.control('',{t:'resume-query'});
      const retry=setInterval(ask,500),timeout=setTimeout(()=>finish(null),12000);
      this.worldReply=world=>{
        if(Number.isInteger(world.stage) && world.stage>=1 && world.stage<=4 &&
           [world.time,world.stageTime,world.x,world.z].every(Number.isFinite))finish(world);
      };
      ask();
    });
  }
  duringLoading(work) {
    this.checkStart();
    return this.startGate?Promise.race([work,this.startGate.promise]):work;
  }
  checkStart() {
    if(!this.alive)throw Error('连接已断开，请重新组队');
    if(this.startGate?.error)throw this.startGate.error;
  }
  cancelStart(reason) { this.startGate?.cancel(reason); }
  leave() {
    if(!this.alive)return Promise.resolve();
    if(!this.leaving)this.leaving=this.request('leave').catch(()=>{}).finally(()=>this.end('已离开房间',false));
    return this.leaving;
  }
  end(reason = '房间已关闭', notify = true) {
    if (!this.alive) return;
    this.startGate?.cancel(reason);
    this.alive = false; clearInterval(this.heartbeat); clearTimeout(this.connectTimer);
    this.connectReject?.(Error(reason)); this.connectReject = null;
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(Error(reason)); }
    this.pending.clear(); this.socket?.close();
    if (notify) this.ev.closed?.(reason);
  }
}
