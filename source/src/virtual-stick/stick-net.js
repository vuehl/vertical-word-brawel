// 联机输入同步。
//
// 只同步“原始滤波后的摇杆输入向量 + 序号 + 时间”，绝不同步渲染插值后的坐标：
//   本地：预测移动（本地手感优先）→ 收到远端权威数据 → 平滑回滚校正；
//   远端：只消费输入向量，在本地按同一套 MoveBody 复算，网络抖动靠插值缓冲吸收。

import { nowMs } from './stick-input.js';

/* ------------------------------------------------------------------ *
 * 1. 输入快照编码 / 解码
 * ------------------------------------------------------------------ */

// 需要极致省流量时可以用 packed：3 字节 = 11 位 x + 11 位 y + 1 位 held。
// 平时按调试方便直接发 {s, t, x, y, held} 即可。
export function encodeInput(seq, x, y, held, tMs) {
  const qx = Math.max(-1023, Math.min(1023, Math.round(x * 1023)));
  const qy = Math.max(-1023, Math.min(1023, Math.round(y * 1023)));
  // 打包成 23 位整数再拆 3 字节，避免跨字节位宽算错。
  const u = ((qx & 0x7ff) | ((qy & 0x7ff) << 11) | ((held ? 1 : 0) << 22)) >>> 0;
  return {
    s: seq & 0xffff,
    t: tMs,
    x,
    y,
    held: !!held,
    packed: [u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff],
  };
}

export function decodeInput(snapshot) {
  if (snapshot.packed) {
    const [b0, b1, b2] = snapshot.packed;
    const u = b0 | (b1 << 8) | (b2 << 16);
    const ux = u & 0x7ff;
    const uy = (u >> 11) & 0x7ff;
    const sx = ux & 0x400 ? ux - 0x800 : ux;
    const sy = uy & 0x400 ? uy - 0x800 : uy;
    return { seq: snapshot.s, t: snapshot.t, x: sx / 1023, y: sy / 1023, held: !!(u & (1 << 22)) };
  }
  return {
    seq: snapshot.s,
    t: snapshot.t,
    x: snapshot.x,
    y: snapshot.y,
    held: !!snapshot.held,
  };
}

/* ------------------------------------------------------------------ *
 * 2. 本地输入发送器：按间隔节流 + 变化阈值 + 心跳
 * ------------------------------------------------------------------ */

export class InputSender {
  constructor(cfg, now = nowMs) {
    this.cfg = cfg;
    this.now = now;
    this.seq = 0;
    this.lastSentAt = -Infinity;
    this.lastX = 0;
    this.lastY = 0;
    this.lastHeld = false;
  }

  // 每次物理步后调用，返回要发送的快照或 null。
  sample(input, simMs) {
    const cfg = this.cfg;
    const t = simMs ?? this.now();
    const changed =
      Math.abs(input.x - this.lastX) > cfg.inputEpsilon ||
      Math.abs(input.y - this.lastY) > cfg.inputEpsilon ||
      !!input.held !== this.lastHeld;

    const elapsed = t - this.lastSentAt;
    const due = elapsed >= cfg.sendIntervalMs;
    const heartbeat = elapsed >= cfg.snapshotHeartbeatMs;
    if (!((changed && due) || heartbeat)) return null;

    this.seq = (this.seq + 1) & 0xffff;
    this.lastSentAt = t;
    this.lastX = input.x;
    this.lastY = input.y;
    this.lastHeld = !!input.held;
    return encodeInput(this.seq, input.x, input.y, this.lastHeld, Math.round(t));
  }

  // 松手/暂停：立刻发一帧“零输入”，不等节流窗口。
  flush(input, simMs) {
    this.lastSentAt = -Infinity;
    return this.sample(input, simMs);
  }

  reset() {
    this.seq = 0;
    this.lastSentAt = -Infinity;
    this.lastX = this.lastY = 0;
    this.lastHeld = false;
  }
}

/* ------------------------------------------------------------------ *
 * 3. 远端输入缓冲 + 平滑校正
 * ------------------------------------------------------------------ */

export class RemoteStick {
  constructor(cfg, id = 'peer') {
    this.cfg = cfg;
    this.id = id;
    this.buf = [];            // 按本地时间升序的输入快照
    this.lastSeq = -1;
    this.lastRecvMs = null;   // 最近一次收包的本地时间，用于断流超时
    this.clockOffset = null;  // 本地时间 - 远端时间
    this.playing = { x: 0, y: 0, held: false };
    this.jitterMs = 0;
    this.starved = 0;
    // 位置校正用“衰减偏移”：权威位置与本地预测的差值，作为视觉偏移逐步收敛到 0。
    this.offX = 0;
    this.offZ = 0;
    this.corrX = 0;           // 本步应该补偿的位移
    this.corrZ = 0;
    this.snapRequested = false;
    this._out = { x: 0, y: 0, held: false, errorX: 0, errorZ: 0, snap: false };
  }

  reset() {
    this.buf.length = 0;
    this.lastSeq = -1;
    this.lastRecvMs = null;
    this.clockOffset = null;
    this.playing.x = this.playing.y = 0;
    this.playing.held = false;
    this.jitterMs = 0;
    this.starved = 0;
    this.offX = this.offZ = 0;
    this.corrX = this.corrZ = 0;
  }

  // 收到一份远端数据：
  //   {s|seq, t, x, y, held}            只收输入向量（常态）
  //   {..., ax, az, localX, localZ}     附带权威位置时的校正面
  receive(snap, localMs, localX, localZ) {
    const s = decodeInput(snap);
    if (this.lastSeq >= 0) {
      // 序号只有 16 位，会回绕（20Hz 约 55 分钟一圈）：按“环形距离”判断新旧，
      // 落在后半圈的才是旧包/重复包，直接丢，绝不回放。
      const ahead = (s.seq - this.lastSeq) & 0xffff;
      if (ahead === 0 || ahead >= 0x8000) return false;
    }
    this.lastSeq = s.seq;
    this.lastRecvMs = localMs;

    // 时钟对齐：远端 t 与本地时钟可能不同源，用慢速跟随估计偏移。
    if (this.clockOffset === null) this.clockOffset = localMs - s.t;
    else {
      const want = localMs - s.t;
      const diff = want - this.clockOffset;
      this.clockOffset += diff * (Math.abs(diff) > 80 ? 0.35 : 0.02);
    }
    const localT = s.t + this.clockOffset;
    const prev = this.buf[this.buf.length - 1];
    if (prev && localT < prev.t) return false;          // 时间倒流：丢
    if (prev) {
      const delta = localT - prev.t;
      if (delta > 250) this.starved++;                  // 明显丢包/停顿
      else if (delta > 0) this.jitterMs += (delta - this.jitterMs) * 0.15;
    }

    this.buf.push({ t: localT, x: s.x, y: s.y, held: s.held, seq: s.seq });
    // 只保留 1 秒窗口，够插值即可；缓冲上限防止内存被慢包撑爆。
    while (this.buf.length > 2 && localT - this.buf[0].t > 1000) this.buf.shift();
    while (this.buf.length > this.cfg.historyLimit) this.buf.shift();

    if (Number.isFinite(snap.ax) && Number.isFinite(snap.az)) {
      this.setAuthority(snap.ax, snap.az, localX, localZ);
    }
    return true;
  }

  // 权威位置（服务端/主机裁决）。误差超过 snapThreshold 视为真实传送，允许瞬移；
  // 否则记成“衰减偏移”，在后续若干步里柔和平滑地抹平。
  setAuthority(ax, az, localX = 0, localZ = 0) {
    const err = Math.hypot(ax - localX, az - localZ);
    if (err > this.cfg.snapThreshold) {
      this.offX = this.offZ = 0;
      this.snapRequested = true;
      return;
    }
    this.offX = ax - localX;
    this.offZ = az - localZ;
  }

  // 固定步长里调用：返回本步应使用的输入向量 + 校正位移。
  // localMs 是本地仿真时钟（毫秒）。
  advance(localMs, out = this._out) {
    const cfg = this.cfg;
    // 自适应缓冲：丢包多时稍微加长，但有上限，延迟不会无限膨胀。
    const delayMs = Math.min(cfg.maxBufferMs, cfg.interpBufferMs + Math.min(80, this.jitterMs * 0.5));
    const targetTime = localMs - delayMs;

    // 断流超时：对端掉线/切后台时不能让他按最后一个方向一直跑下去。
    // 输入归零（物理层会平滑减速），并重置流状态，对端重连后序号/时钟从头来也能接上。
    if (this.lastRecvMs !== null && localMs - this.lastRecvMs > cfg.remoteTimeoutMs) {
      this.buf.length = 0;
      this.lastSeq = -1;
      this.clockOffset = null;
      this.lastRecvMs = null;
      this.playing.x = this.playing.y = 0;
      this.playing.held = false;
    }

    while (this.buf.length >= 2 && this.buf[1].t <= targetTime) this.buf.shift();
    const a = this.buf[0];
    const b = this.buf[1] || a;

    if (!a) {
      // 还没收到包 / 已超时归零：维持 playing 当前值。
      this.starved++;
    } else if (a === b) {
      this.playing.x = a.x;
      this.playing.y = a.y;
      this.playing.held = a.held;
    } else {
      const span = Math.max(1e-3, b.t - a.t);
      const t = Math.max(0, Math.min(1.2, (targetTime - a.t) / span));
      const k = 1 - Math.exp(-cfg.fixedStep / 0.05);
      this.playing.x += (a.x + (b.x - a.x) * t - this.playing.x) * k;
      this.playing.y += (a.y + (b.y - a.y) * t - this.playing.y) * k;
      this.playing.held = t < 0.5 ? a.held : b.held;
    }

    // 位置校正：指数衰减 + 速度上限，既不会硬拽，也不会永远差一截。
    this.corrX = this.corrZ = 0;
    if (this.snapRequested) {
      this.snapRequested = false;
      out.snap = true;
    } else {
      out.snap = false;
    }
    if (this.offX || this.offZ) {
      const halfLife = Math.max(16, cfg.correctionHalfLifeMs) / 1000;
      const e = 1 - Math.exp(-Math.log(2) * cfg.fixedStep / halfLife);
      let sx = this.offX * e;
      let sz = this.offZ * e;
      const maxD = cfg.correctionMaxSpeed * cfg.fixedStep;
      const d = Math.hypot(sx, sz);
      if (d > maxD && d > 0) {
        sx *= maxD / d;
        sz *= maxD / d;
      }
      this.offX -= sx;
      this.offZ -= sz;
      this.corrX = sx;
      this.corrZ = sz;
      if (Math.abs(this.offX) < 0.004 && Math.abs(this.offZ) < 0.004) this.offX = this.offZ = 0;
    }

    out.x = this.playing.x;
    out.y = this.playing.y;
    out.held = this.playing.held;
    out.errorX = this.corrX;
    out.errorZ = this.corrZ;
    return out;
  }
}
