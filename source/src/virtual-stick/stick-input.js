// 摇杆采样器：把触摸事件隔离在“事件队列”里，绝不每帧直接读取触摸坐标。
//
// 为什么这样可以治“怪物一多就乱飘”：
//   1. 触摸回调只做一件事——把归一化后的向量连同时间戳塞进队列，开销极小；
//   2. 物理线程按自己的仿真时钟消费队列，只取 t <= 当前步时刻的最新样本；
//   3. 因此渲染层排队、逻辑层卡顿、rAF 掉帧都不会让“旧手指坐标”覆盖“新方向”。
//
// 微信小游戏的逻辑层/渲染层时序差异也在这里抹平：事件自带的 timeStamp 被映射到
// 本地单调时钟上（保留事件之间的真实间隔），晚到的事件只会“迟到”，不会“回到过去”。

export const nowMs =
  typeof performance !== 'undefined' && performance.now
    ? () => performance.now()
    : () => Date.now();

const EMPTY = Object.freeze({ t: 0, x: 0, y: 0, held: false });

export class StickSampler {
  constructor(cfg, now = nowMs) {
    this.cfg = cfg;
    this.now = now;
    this.queue = [];          // 待消费的原始采样（按 t 升序）
    this.cursor = 0;          // 已消费到的下标
    this.pointerId = null;    // 当前绑定的手指 id，null 表示没按下
    this.gesture = 0;
    this.origin = { x: 0, y: 0 };
    this.radius = Math.max(8, cfg.radiusPx);
    this.lastConsumed = null;

    // 事件时钟 → 本地时钟 的锚点
    this.anchorEvent = null;
    this.anchorLocal = 0;
    this.lastStamp = -Infinity;

    this.stats = { pushed: 0, late: 0, reanchor: 0, dropped: 0 };
    this.out = { t: 0, x: 0, y: 0, held: false };
  }

  get active() {
    return this.pointerId !== null;
  }

  // 按下。originX/originY 传入时为固定摇杆原点；否则以按下的点作为原点。
  begin(id, x, y, timeStamp, originX, originY) {
    if (this.pointerId !== null && id !== this.pointerId) return false; // 多指：只认第一根
    this.pointerId = id;
    this.gesture++;
    this.lastMoveStamp = timeStamp;
    this.origin.x = Number.isFinite(originX) ? originX : x;
    this.origin.y = Number.isFinite(originY) ? originY : y;
    // 按下瞬间方向为 0：手指还没动就不该产生位移，这是“开局正常”的前提。
    this._push(0, 0, true, timeStamp);
    return true;
  }

  // 拖动。半径换算成归一化向量，超出半径就截断到单位长度（避免斜向加速）。
  move(id, x, y, timeStamp) {
    if (this.pointerId !== null && id !== this.pointerId) return false;
    if (this.pointerId === null) return false;
    const vx = (x - this.origin.x) / this.radius;
    const vy = -(y - this.origin.y) / this.radius; // 屏幕 y 向下，翻转成“向上为正”
    return this.pushVector(id, vx, vy, timeStamp);
  }

  // 直接送入已经归一化好的向量（向上为正）。调用方自己管原点/半径/摇杆形状时用，
  // 采样器只负责排队和时序。幅度超过 1 同样截断到单位长度。
  pushVector(id, vx, vy, timeStamp) {
    if (this.pointerId === null || id !== this.pointerId) return false;
    if (!Number.isFinite(vx) || !Number.isFinite(vy)) return false;
    // 同一手指的迟到旧 move 不能覆盖较新的转向。新手势重新建立次序。
    if (Number.isFinite(timeStamp)) {
      if (timeStamp < this.lastMoveStamp) return false;
      this.lastMoveStamp = timeStamp;
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    this._push(vx, vy, true, timeStamp);
    return true;
  }

  // 抬起 / 滑动中断 / 切后台。统一走“松手”路径，由物理层做平滑减速。
  end(id, timeStamp) {
    if (this.pointerId === null) return false;                       // 不是摇杆的手指（比如点技能键）
    if (id !== undefined && id !== this.pointerId) return false;
    this.pointerId = null;
    this._push(0, 0, false, timeStamp);
    return true;
  }

  abort() {
    this.pointerId = null;
    this.queue.length = 0;
    this.cursor = 0;
    this.lastConsumed = null;
    this.anchorEvent = null;
    this.lastStamp = -Infinity;
  }

  // 物理层每一步调用一次：取“当前步时刻之前”的最新样本。
  // 返回对象复用，避免高负载下产生垃圾。
  consume(simMs) {
    const q = this.queue;
    let latest = null;
    while (this.cursor < q.length && q[this.cursor].t <= simMs) {
      latest = q[this.cursor];
      this.cursor++;
    }
    if (latest) this.lastConsumed = latest;

    // 清理过旧数据，但保留最近一次消费结果作为“手指静止”的持续输入。
    const cutoff = simMs - this.cfg.keepSamplesMs;
    let drop = 0;
    while (drop < this.cursor && q[drop] && q[drop].t < cutoff) drop++;
    if (drop > 0) {
      q.splice(0, drop);
      this.cursor -= drop;
    }
    const s = this.lastConsumed || EMPTY;
    const out = this.out;
    out.t = s.t;
    out.x = s.x;
    out.y = s.y;
    out.held = s.held; // 只认队列里的状态，不读“此刻”的手指状态，保证时序一致
    out.gesture = s.gesture;
    return out;
  }

  _push(vx, vy, held, timeStamp) {
    const { t, late } = this._stamp(timeStamp);
    const sample = { t, x: vx, y: vy, held, gesture: this.gesture };
    this.queue.push(sample);
    if (this.queue.length > this.cfg.historyLimit) {
      this.queue.shift();
      if (this.cursor > 0) this.cursor--;
      else this.stats.dropped++;
    }
    this.stats.pushed++;
    if (late > this.cfg.fixedStep * 1000 + 0.5) this.stats.late++;
  }

  // 事件时间戳 → 本地单调时钟。用“锚点 + 差值”而不是直接把 timeStamp 当 ms 用，
  // 这样即使 iOS/Android 的相对时间原点不同也不会错位。
  _stamp(timeStamp) {
    const arrive = this.now();
    if (!Number.isFinite(timeStamp)) {
      this.lastStamp = arrive;
      return { t: arrive, late: 0 };
    }

    if (this.anchorEvent === null) {
      // 只用“事件之间的差值”，所以时间原点不同（相对时间 / 纪元时间）都没关系。
      this.anchorEvent = timeStamp;
      this.anchorLocal = arrive;
      this.lastStamp = arrive;
      return { t: arrive, late: 0 };
    }

    let t = this.anchorLocal + (timeStamp - this.anchorEvent);
    if (t - arrive > this.cfg.clockReanchorMs || arrive - t > this.cfg.clockReanchorMs) {
      // 时钟跳变（切后台、渲染层重建、事件时间戳重置）：重新锚定。
      this.anchorEvent = timeStamp;
      this.anchorLocal = arrive;
      t = arrive;
      this.stats.reanchor++;
    }
    // 事件不可能来自未来：说明锚点那次事件自身带了投递延迟，把锚点往回收，
    // 让映射逐步收敛到“最小延迟”。同时保证单调，防止乱序把方向拽回去。
    if (t > arrive) {
      this.anchorLocal -= t - arrive;
      t = arrive;
    }
    if (t < this.lastStamp) t = this.lastStamp;
    this.lastStamp = t;
    return { t, late: arrive - t };
  }
}
