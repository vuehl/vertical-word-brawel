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

启动页和进场加载页共用 `resources/public/assets/ui-paper/loading-poster.webp`。构建时把海报写入微信主包，首次启动即可显示。`resources/art/fire-stampede/` 的三段 GIF 用于重建烈焰狂奔图集和校验动画来源。修改技能原稿后运行 `node tools/art/build-fire-stampede.mjs`，再运行 `npm run build:assets` 更新微信包。

每次重新启动小游戏时，新老玩家都会在进度条到 100% 后自动播放开场动画，无需点击首页按钮。原片 `resources/public/assets/opening/journey.mp4` 为 780×1688、24 帧/秒、169 帧的无声视频。构建时保留全部帧，生成 390×844 的 WebP 图片页，随玩法包保存到本地；播放只使用游戏现有的图片和 Canvas 接口，不依赖手机视频解码器。运行时仅保留当前和下一页，图片读取失败时提供重试，不会静默跳过动画。播放期间准备桌上世界的单关，末帧用 0.8 秒叠化进入场景；战斗在叠化结束后开始计时。同一次运行中，单关结束、返回首页或切回前台都不会重播，普通关卡、多关和双人入口保持原流程，原有存档保留。`npm run test:opening` 检查自动开场、后台暂停、末帧衔接、资源失败重试、老存档重新启动和后续导航。

空气斩使用 `resources/art/air-slash-reference/空气斩.gif` 的新参考录像。第 7–27 帧按每帧 20 毫秒播放，包含出手前的空帧和最后一帧拖尾，总长 0.42 秒。运行 `node tools/art/build-air-slash-reference.mjs` 从原片去除桌面底色、用相邻清晰帧补齐被字灵与命中光遮挡的部分，生成透明图集；再运行 `npm run build:assets`。游戏中接在风系「空气斩」（403）上，沿实际瞄准方向飞行，每个目标只命中一次。`npm run test:air-slash` 核验来源、帧序、不同方向与帧率、隐藏特效和清理，并输出原片与实机对照 GIF。

进化参考 GIF 和光环轨迹保存在 `resources/art/upgrade/`。`node tools/art/build-evolution-screen.mjs` 使用 NumPy、Pillow、SciPy 和 OpenCV 重建光效图集、曝光和动作时间轴。再运行 `npm run build:assets` 更新小游戏资源。演出在 4.2 秒内按比例播放参考片的 171 帧，采用居中近景和爆发前暗场，覆盖场景与 HUD，结束后恢复正常镜头。`npm run test:upgrade-effects` 验证普通升级、六条进化路径、不同竖屏尺寸、低帧率、特效设置和清理。

福袋捕捉的图集和 111 帧位置表在 `resources/public/assets/vfx/capture-bag/`，随 `capture_bag` 微信分包加载。演出按每秒 24 帧播放，帧号从 0 起算。福袋落在字灵右后方，镜头从第 27 帧起用 0.52 秒完成平移和缩放。三格进度在第 36、52、68 帧推进。第 76 帧后，字灵的笔画依次飞入袋口。第 96 帧显示结果，成功时福袋合盖，挣脱时福袋保持打开，字灵从袋口弹出并在袋前落地。两个分支都在播完第 110 帧后结算。

修改素材后运行 `npm run build:assets`。用 `node tools/runtime-performance.mjs --capture-bag` 检查 31 个位置的构图、三个挣脱阶段和成功收尾，用 `node tools/runtime-performance.mjs --capture-universal` 检查已打包字形的逐笔吸入和弹出。

完整的常规、粗体中文字库以无损 WOFF 存放在 `resources/public/fonts/swei/`。构建会从中提取游戏用字，生成供微信加载的两份 TTF 子集。

资源压缩由构建脚本自动完成：字灵、笔画和普通 PNG 比较无损 WebP 的实际大小，只采用更小的结果。福袋动画保留原尺寸、帧数和透明度，仅在逐帧颜色误差通过核验且至少缩小 5% 时采用轻度压缩；不满足条件的图保留原版。道具图合并为不超过 2048 像素的图集。字体子集收集源码字符串、模板文字、中文对象键和运行数据，不收录仅出现在注释里的文字。

新增原稿仍可使用 PNG。`npm run compress:originals` 会核验每个可见像素及全部透明度，将更小的原稿转换为 WebP 后删除对应 PNG；它只处理 `resources/art/`，不会删除重建动画所需的 GIF 和描述文件。转换后运行 `npm run build:assets`。压缩缓存位于不参与打包的 `.cache/`，逐图清单在 `验收/资源压缩/`，正式资源清单在 `验收/资源打包清单.json`。运行 `npm run test:asset-compression`、`npm run verify:assets` 与 `npm run analyze:package` 可检查画质约束、资源引用及实际包体。

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
| `filterWeights` · `smoothAlpha` | 最新一步权重 1，时间常数 0 秒 | 转向跟随当前触点，起步和刹车由速度响应控制 |
| `deadZone` · `deadZoneRelease` | 启动 0.15，回落 0.09 | 提高启动阈值可以忽略更大幅度的轻触 |
| `maxSpeed` | 7.3 世界单位/秒 | 基础满杆速度，角色、装备和地形另有倍率 |
| `accel` · `decel` | 58/s、40/s | 分别增大可加快起步和刹停 |
| `maxStepDistance` · `maxFrameDistance` | 1.2、1.6 世界单位 | 分别限制单步和一个显示帧内摇杆驱动的水平移动 |
| `sendIntervalMs` · `interpBufferMs` | 50 ms、90 ms | 分别控制输入批次的发送间隔和队友基础播放延迟。抖动较大时会增加播放缓冲 |

触摸采样在 `stick-input.js`，死区与可选滤波在 `stick-filter.js`，速度响应在 `stick-physics.js`。战斗按 30 Hz 更新。30 帧档显示当前物理位置，更高帧率下角色和镜头共用 `stick-render.js` 的插值位置。

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
