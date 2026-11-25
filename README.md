# 字由搏击 · 微信竖屏小游戏

这是「字由搏击」的竖屏工程。修改字形和美术从 `resources/` 开始，修改玩法从 `source/src/` 开始。在微信开发者工具中导入项目根目录，工具会按 `project.config.json` 加载 `minigame/`。

## 项目目录

| 目录或文件 | 职责 |
| --- | --- |
| [resources/](resources/) | 统一维护的资源包。原画、运行素材、游戏数据和布局参考的存放位置见下表。 |
| [source/src/](source/src/) | 玩法和界面源码。`game.js` 组装各模块，由微信玩法分包调用。 |
| [source/local/](source/local/) · [source/firebase/](source/firebase/) | 进度结算、账号和存档规则。[game-routes.mjs](source/local/game-routes.mjs) 处理小游戏内的账号和对局请求，由微信适配层读写存档。 |
| [source/tools/](source/tools/) · [source/reports/](source/reports/) | 玩法测试、素材审计、目录导出脚本与报告。 |
| [platform/](platform/) | 微信运行环境适配，包括 Canvas 绘制、触摸、界面布局、文件读取、存档和联机接口。 |
| [tools/](tools/) | 工程工具。顶层是构建、预览和验收命令的入口，各类实现见下文。 |
| [minigame/](minigame/) | 构建生成的微信工程。`play/` 放编译后的玩法代码，`packs/` 放手机按需加载的资源分包。修改对应的源码或素材后重新构建。 |
| `验收/` | 本机生成的核验报告、截图和独立开发测试工程。 |
| [docs/](docs/) | 历次玩法、美术和性能调整记录。旧版本的包体数据和验收结果按当时版本保留。 |
| [game.js](game.js) · [game.json](game.json) · [project.config.json](project.config.json) | 微信启动脚本、方向与分包声明、开发者工具项目配置。 |

## 资源放在哪里

| 路径 | 放什么 |
| --- | --- |
| [resources/art/](resources/art/) | 制作原稿和参考录像。`glyphs/` 是字形，`hero-actions/` 和 `hero-strokes/` 是主角动作与笔画，`monsters/` 按阶存放怪物笔画。其余目录按设施、场景或技能命名。 |
| [resources/public/assets/](resources/public/assets/) | 运行时贴图和模型。`glyphs/` 放角色图集，`env/` 放场景，`vfx/` 放技能与演出，`items/` 放道具，`models/` 放模型，`ui/` 和 `ui-paper/` 放界面图。 |
| [resources/public/config/](resources/public/config/) | 源码直接导入的布局、角色骨架和动画描述。 |
| [resources/public/data/](resources/public/data/) · [resources/public/text/](resources/public/text/) | 游戏读取的角色、招式、道具等数据表，以及中文界面文案。 |
| [resources/public/fonts/](resources/public/fonts/) · `resources/public/overrides/` | 中文字体与许可、按同路径优先加载的替换素材。`public/` 顶层保留游戏版本和素材署名。 |

启动页的「炎」和「风」取自 `resources/art/glyphs/`，构建时合成一张无损 WebP 图集。`resources/art/fire-stampede/` 的三段 GIF 用于重建烈焰狂奔图集和校验动画来源。修改技能原稿后运行 `node tools/art/build-fire-stampede.mjs`，再运行 `npm run build:assets` 更新微信包。

进化参考 GIF 和光环轨迹保存在 `resources/art/upgrade/`。`node tools/art/build-evolution-screen.mjs` 使用 NumPy、Pillow、SciPy 和 OpenCV 重建光效图集、曝光和动作时间轴。再运行 `npm run build:assets` 更新小游戏资源。演出在 4.2 秒内按比例播放参考片的 171 帧，采用居中近景和爆发前暗场，覆盖场景与 HUD，结束后恢复正常镜头。`npm run test:upgrade-effects` 验证普通升级、六条进化路径、不同竖屏尺寸、低帧率、特效设置和清理。

福袋捕捉的图集和 96 帧位置表在 `resources/public/assets/vfx/capture-bag/`，随 `capture_bag` 微信分包加载。修改素材后运行 `npm run build:assets`，再用 `node tools/runtime-performance.mjs --capture-bag` 核对落袋、三格进度、开袋提示和第 4 秒结算。

完整的常规、粗体中文字库以无损 WOFF 存放在 `resources/public/fonts/swei/`。构建会从中提取游戏用字，生成供微信加载的两份 TTF 子集。

旧版的 152 张宝可梦角色精灵图已清理。它们曾用于测量角色的脚底、顶部和宽度，已核对的数值保存在 [actor-metrics.js](source/src/actors/actor-metrics.js)。现有玩法、研究进度和旧存档继续使用角色编号与家族关系，相关数据保存在 `resources/public/data/pokemon.json` 等表中。

## 代码按什么分

以下路径均位于 [source/src/](source/src/) 下。

| 文件夹 | 职责 |
| --- | --- |
| `actors/` | 字灵绘制、角色动作、姿态和碰撞尺寸。 |
| `combat/` | 战斗流程、技能执行、首领机制、拾取、经验和升级时机。 |
| `data/` | 角色与道具目录、进阶与技能可用性、玩法配置及文案规则。 |
| `world/` | 桌面关卡、地图生成、场景物件、导航、碰撞与交互设施。 |
| `effects/` | 火风技能、设施和进阶特效。`dragon-summon-hd/` 负责「龘」的高清出场演出。 |
| `ui/` | 首页、选字、图鉴、战斗信息、弹窗和纸张界面样式。构建时把 `base.css` 等样式转成 Canvas 界面使用的布局规则。 |
| `network/` | 联机配置、组队、队友同步与断线恢复。 |
| `performance/` | 帧率策略、怪群更新、生成预算和战斗预热。 |
| `virtual-stick/` | 虚拟摇杆的输入、过滤、移动和绘制。 |
| `vendor/` | 随工程提供的 Three.js 和 Earcut 库。 |

### 摇杆手感与联机调试

单机和双人战斗共用 [stick-config.js](source/src/virtual-stick/stick-config.js) 导出的 `gameStick`。修改后执行 `npm run build` 更新微信工程。

| 参数 | 实战默认值 | 调节效果 |
| --- | --- | --- |
| `filterWeights` · `smoothAlpha` | 最近三步权重 0.5、0.3、0.2；时间常数 0.022 秒 | 增大最新一步的权重或缩短时间常数，转向更快 |
| `deadZone` · `deadZoneRelease` | 启动 0.15，回落 0.09 | 提高启动阈值可以忽略更大幅度的轻触 |
| `maxSpeed` | 6.3 世界单位/秒 | 基础满杆速度，角色、装备和地形另有倍率 |
| `accel` · `decel` | 48/s、28/s | 分别增大可加快起步和刹停 |
| `maxStepDistance` · `maxFrameDistance` | 1.2、1.6 世界单位 | 分别限制单步和一个显示帧内摇杆驱动的水平移动 |
| `sendIntervalMs` · `interpBufferMs` | 50 ms、90 ms | 分别控制输入批次的发送间隔和队友基础播放延迟。抖动较大时会增加播放缓冲 |

触摸采样在 `stick-input.js`，三步滤波在 `stick-filter.js`，速度响应在 `stick-physics.js`，渲染插值在 `stick-render.js`。战斗按 30 Hz 更新，碰撞使用玩家物理坐标，角色和镜头共用插值位置。

联机通过 `stick-frames.js` 的 `record()` 记录固定步输入，到发送时返回一批快照。`exportSnapshot()` 可主动取出并清空待发帧。每帧包含 `tick`、本局相对时间 `ms`、滤波后的 `x/y` 和按住标记 `held`。原有战斗物理快照用于校正碰撞、击退和换区位置。运行 `npm test` 检查输入与同步模块，`npm run test:joystick` 检查构建后的触摸和移动。

## 工具与常用命令

| 工具目录 | 职责 |
| --- | --- |
| `tools/build/` | 资源筛选、打包与解包、代码分块、微信模拟环境。 |
| `tools/art/` | 从原稿生成图集、场景贴图、设施缩略图和字体子集。 |
| `tools/tests/` · `tools/regression/` | 单元测试，以及启动、战斗、画面和性能回归。 |
| `tools/developer/` | 开发测试面板、独立存档和预览支持。 |
| `tools/guides/` | 技能图鉴、融合说明和演示 GIF 的导出工具与模板。 |

在根目录执行以下命令。构建需要 Node.js 22 或更高版本。完整资源构建还需要安装了 FontTools 的 Python，Windows 默认使用 Python 3.13，也可通过 `POKEBONK_PYTHON` 指定解释器。

| 操作 | 命令 |
| --- | --- |
| 首次安装工具依赖 | `npm ci --prefix tools` |
| 安装字体处理依赖 | `py -3.13 -m pip install fonttools` |
| 修改代码后构建正式包 | `npm run build` 或双击 `build-game.cmd` |
| 修改素材后重建资源和正式包 | `npm run build:assets` |
| 构建独立开发测试包 | `npm run build:dev`，输出在 `验收/开发者工程/` |
| 运行默认测试 | `npm test` |
| 检查源码引用与正式包资源 | `npm run verify:source`、`npm run verify:assets` |
