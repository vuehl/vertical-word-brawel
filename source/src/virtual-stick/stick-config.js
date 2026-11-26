// 虚拟摇杆全套参数。时间单位统一为“秒”，距离为“世界单位”，输入向量为归一化后的 -1..1。
// 这个文件是唯一的手感调参入口，其他模块只读不写。
export const DEFAULT_STICK_CONFIG = Object.freeze({
  /* ---------- 采样 / 时序隔离 ---------- */
  historyLimit: 24,        // 事件队列最多保留多少个原始采样（防止后台恢复时堆积）
  keepSamplesMs: 400,      // 已消费采样保留多久（供联机补帧/调试回看）
  clockReanchorMs: 600,    // 事件时间戳与本地时钟偏差超过该值就重新锚定（切后台/渲染层重启）

  /* ---------- 3 帧历史低通 + 死区 ---------- */
  filterWeights: [0.5, 0.3, 0.2], // 由新到旧的权重，长度即“历史帧数”，默认 3 帧
  smoothAlpha: 0.08,       // EMA 时间常数（秒）：越小越跟手，越大越稳。建议 0.03~0.15
  deadZone: 0.15,          // 死区（归一化幅度）。低于它视为静止
  deadZoneRelease: 0.09,   // 迟滞下限，避免在死区边缘来回抖动

  /* ---------- 固定步长物理 ---------- */
  fixedStep: 1 / 60,       // 物理步长
  maxSubSteps: 6,          // 单帧最多补几步（6 步刚好覆盖 maxFrameDelta），超过就丢弃积压
  maxFrameDelta: 0.1,      // 单帧 deltaTime 上限（秒），卡顿/切后台时钳位
  maxSpeed: 6.2,           // 最大移动速度（单位/秒）
  accel: 22,               // 加速逼近速率（1/s），指数逼近
  decel: 13,               // 减速逼近速率（1/s），越小松手滑得越远
  stopEpsilon: 0.03,       // 速度低于该值直接归零，杜绝残速漂移
  turnRate: 18,            // 朝向收敛速率（1/s）
  maxStepDistance: 0.35,   // 单步最大位移（硬钳位，防单帧飞出）
  maxFrameDistance: 1.6,   // 同一显示帧的所有普通水平移动共用这个距离预算

  /* ---------- 渲染插值 ---------- */
  renderSmoothing: 0,      // 额外的视觉平滑时间常数（秒）。0 = 纯插值，不增加延迟

  /* ---------- 联机 ---------- */
  sendIntervalMs: 50,      // 输入快照发送间隔（20Hz）
  snapshotHeartbeatMs: 250,// 长时间无变化时的心跳包
  inputEpsilon: 0.02,      // 输入变化超过该值才发（配合间隔做节流）
  interpBufferMs: 90,      // 远端播放缓冲时长，抗网络抖动
  maxBufferMs: 320,        // 远端缓冲上限，超过就丢最旧包
  remoteTimeoutMs: 1000,   // 远端超过该时长没来包（约 4 个心跳）视为断流：输入归零，等重连
  correctionHalfLifeMs: 120, // 位置校正的半衰期：越小回滚越快
  correctionMaxSpeed: 9,   // 校正的最大贴回速度（单位/秒），保证“柔和拉扯”
  snapThreshold: 6,        // 误差超过该值才允许瞬移（复活/换区等真实传送）

  /* ---------- 摇杆区域（归一化屏幕坐标 0..1）---------- */
  zone: { left: 0, right: 0.46, top: 0.22, bottom: 1 },
  floating: true,          // true = 按下点即原点（浮动摇杆）
  radiusPx: 64,            // 摇杆有效半径（像素）
  fixedStick: null,        // floating=false 时使用：{ x, y } 固定原点（像素）
});

// 生成配置：只做浅合并 + 权重归一化，不引入额外依赖。
export function createStickConfig(overrides = {}) {
  const cfg = { ...DEFAULT_STICK_CONFIG, ...overrides };
  cfg.zone = { ...DEFAULT_STICK_CONFIG.zone, ...(overrides.zone || {}) };
  const weights = (overrides.filterWeights || DEFAULT_STICK_CONFIG.filterWeights).slice();
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  cfg.filterWeights = weights.map((w) => w / sum);
  cfg.filterTaps = cfg.filterWeights.length;
  // 单步位移钳位必须大于正常一步的位移，否则正常移动也会被削。
  const normalStep = cfg.maxSpeed * cfg.fixedStep;
  if (cfg.maxStepDistance < normalStep) cfg.maxStepDistance = normalStep;
  return cfg;
}

// 实战共用一套参数。怪群逻辑固定 30 Hz；画面仍按设备设置绘制。
export const gameStick = createStickConfig({
  fixedStep: 1 / 30,
  filterWeights: [1],      // 战斗直接采用本步的最新方向，速度在玩家物理中平滑
  smoothAlpha: 0,
  maxSpeed: 7.3,           // 基础跑速，角色、装备和地形再乘各自的倍率
  accel: 90,
  decel: 60,
  maxStepDistance: 1.2,
});
