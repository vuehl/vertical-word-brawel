// 3 帧历史低通滤波 + 死区。
//
// 滤波目的：触摸面板在高负载时会成批上报事件（一次 touchmove 挤着好几个采样点），
// 直接取最后一个会让方向“跳”。这里对最近 N 个历史样本做加权平均（新样本权重高），
// 让方向连续可导，再叠一层时间常数化的 EMA 抵抗偶发极端值。
//
// 死区目的：手指静止时的微小抖动不该变成位移。用“进高退低”的迟滞（hysteresis），
// 避免在 0.15 边界上反复横跳，造成人物原地打摆。

const EPS = 1e-4;

export class StickFilter {
  constructor(cfg) {
    this.cfg = cfg;
    this.history = [];   // 原始采样，旧 → 新，最多 filterTaps 条
    this.smoothX = 0;
    this.smoothY = 0;
    this.dead = true;    // 当前是否处于死区内
    this._out = { x: 0, y: 0, mag: 0 };
  }

  reset() {
    this.history.length = 0;
    this.smoothX = this.smoothY = 0;
    this.dead = true;
  }

  // 每个物理步调用一次。sample = {t,x,y,held}，dt = 本步时长（秒）
  update(sample, dt) {
    const cfg = this.cfg;
    const held = !!sample.held;
    if (held && sample.gesture !== this.gesture) {
      this.reset();
      this.gesture = sample.gesture;
    }
    const x = held ? sample.x : 0;
    const y = held ? sample.y : 0;

    if (!held) {
      // 松手：清空历史，避免残留的旧方向被“平均”回一个非零向量。
      this.history.length = 0;
    } else {
      // 每个物理步都入队（哪怕样本没变）。历史窗口代表“最近 N 个物理步”，
      // 手指甩过去后停住不动、不再有 touchmove 时，旧方向会在 N 步内被挤出窗口；
      // 如果只在样本变化时入队，旧方向会永久残留在平均值里 = 方向与摇杆不同步。
      const taps = cfg.filterTaps || cfg.filterWeights.length;
      const slot = this.history.length >= taps ? this.history.shift() : {};  // 复用对象，不产生垃圾
      slot.t = sample.t;
      slot.x = x;
      slot.y = y;
      this.history.push(slot);
    }

    let ax = 0;
    let ay = 0;
    if (held) {
      const w = cfg.filterWeights;
      const n = this.history.length;
      const h = this.history;
      // history 是旧 → 新，权重表是新 → 旧：最新样本（i = n-1）取 w[0]。
      // 样本不足时只用权重表的前 n 项，最后归一化。
      let wsum = 0;
      for (let i = 0; i < n; i++) {
        const wi = w[n - 1 - i];
        ax += h[i].x * wi;
        ay += h[i].y * wi;
        wsum += wi;
      }
      if (wsum > 0) {
        ax /= wsum;
        ay /= wsum;
      }
    }

    // 时间常数化 EMA：k = 1 - e^(-dt/τ)，30fps 与 60fps 的手感一致。
    const tau = Math.max(1e-3, cfg.smoothAlpha);
    const k = 1 - Math.exp(-dt / tau);
    this.smoothX += (ax - this.smoothX) * k;
    this.smoothY += (ay - this.smoothY) * k;

    const out = this._out;
    const mag = Math.hypot(this.smoothX, this.smoothY);
    const enter = cfg.deadZone;
    const exit = Math.min(enter, cfg.deadZoneRelease);

    if (this.dead) {
      if (mag <= enter) {
        out.x = out.y = out.mag = 0;
        return out;
      }
      this.dead = false;
    } else if (mag < exit) {
      this.dead = true;
      out.x = out.y = out.mag = 0;
      return out;
    }

    if (mag < EPS) {
      out.x = out.y = out.mag = 0;
      return out;
    }
    // 离开死区后把幅度重映射到 0..1，保持线性手感，避免“刚出死区就窜”。
    const scaled = Math.min(1, (mag - exit) / Math.max(EPS, 1 - exit));
    const inv = scaled / mag;
    out.x = this.smoothX * inv;
    out.y = this.smoothY * inv;
    out.mag = scaled;
    return out;
  }
}
