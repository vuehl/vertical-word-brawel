// 实战输入帧。ms 相对于本局联机时钟，tick 是发送方的固定逻辑帧号。
// 发送端先本地执行，再按批导出。网络只传滤波向量、按住状态和时序。
export class StickFrameStream {
  constructor(config) {
    this.config = config;
    this.pending = [];
    this.history = [];
    this.nextSend = -Infinity;
    this.held = false;
  }

  record(tick, ms, x, y, held, force = false) {
    const released = this.held && !held;
    this.held = held;
    this.pending.push({tick, ms, x, y, held});
    if (force || released || (!held && x === 0 && y === 0) ||
        ms >= this.nextSend || this.pending.length >= this.config.historyLimit) {
      const interval = this.config.sendIntervalMs;
      // 30 Hz 逻辑下 50 ms 轮流对应 1 步和 2 步，长期平均仍为 20 Hz。
      this.nextSend = ms >= this.nextSend && ms - this.nextSend < interval
        ? this.nextSend + interval : ms + interval;
      return this.exportSnapshot();
    }
    return null;
  }

  exportSnapshot() {
    return this.pending.splice(0);
  }

  receive(frames) {
    if (!Array.isArray(frames) || frames.length > this.config.historyLimit) return;
    const history = this.history;
    for (const frame of frames) {
      const last = history[history.length - 1];
      if (!frame || !Number.isSafeInteger(frame.tick) || frame.tick < 0 ||
          !Number.isFinite(frame.ms) || !Number.isFinite(frame.x) || !Number.isFinite(frame.y) ||
          Math.hypot(frame.x, frame.y) > 1.00001 || typeof frame.held !== 'boolean' ||
          (last && (frame.tick <= last.tick || frame.ms < last.ms))) continue;
      history.push(frame);
    }
    while (history.length > this.config.historyLimit) history.shift();
  }

  // 在两份战斗物理快照之间重放输入，用下一份实坐标逐渐消除预测误差。
  // 墙体完全挡住步伐时，预测速度也为零。超时或旧版队友沿用战斗快照。
  displacement(start, end, speed, out) {
    out.x = out.z = 0;
    const frames = this.history, step = this.config.fixedStep;
    if (!frames.length || start < frames[0].ms / 1000 - step) return false;
    const newest = frames[frames.length - 1];
    if (end - newest.ms / 1000 > this.config.remoteTimeoutMs / 1000) return false;

    // ms 对齐两个设备的播放时钟；每条输入只覆盖它自己的固定逻辑步。
    // 两个连续 tick 之间若有 250ms 卡顿，中间丢弃的时间不会补成位移。
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i], until = frame.ms / 1000;
      const previous = frames[i - 1];
      if (until <= start) continue;
      const from = Math.max(until - step, previous ? previous.ms / 1000 : -Infinity);
      if (previous && frame.tick !== previous.tick + 1 && from > start &&
          previous.ms / 1000 < end) return false;
      if (from >= end) break;
      const dt = Math.max(0, Math.min(end, until) - Math.max(start, from));
      out.x += frame.x * speed * dt;
      out.z -= frame.y * speed * dt;
    }
    // 最新输入之后的短预测由队友播放层限制在 65ms 内。
    const tail = Math.min(.065, Math.max(0, end - newest.ms / 1000))
      - Math.min(.065, Math.max(0, start - newest.ms / 1000));
    out.x += newest.x * speed * tail;
    out.z -= newest.y * speed * tail;
    return true;
  }
}
