# 字由搏击 · 横屏收集游戏

`lucy-horizontal-demo` 从本地桌面场景版本 `febd756` 派生。游戏在插画桌面上进行。拖动浮动摇杆移动，字灵自动出招，玩家选择升级、释放大招、与设施互动、捕捉伙伴。结算后可以在首页管理字灵、查看招式和计划、进入研究所或双人房间。导入项目根目录即可通过 `project.config.json` 运行构建好的 `minigame/`。

## 分支玩法与工程基准

| 范围 | 本分支规则 | 对应源码 |
| --- | --- | --- |
| 路线 | 单关击败守关敌人后进门结算。多关依次经过同事的办公桌、弹珠梦工厂、星灯书庭，圣地终战对手为龘。 | `source/src/data/lite-rules.js`、`source/src/world/paper-world.js`、`source/src/combat/run.js` |
| 字灵与成长 | 炎沿焱、燚进阶。风可沿讽、疯或飒、飙进阶。单关进阶等级为 12、24，多关为 18、36。图鉴、捕捉与存档共用原有物种编号。 | `source/src/data/starter-characters.js`、`source/src/ui/collection-rules.js`、`source/local/progression.mjs` |
| 战斗数值 | 常规战区时长 360 秒。三档难度的敌方伤害倍率依次为 1、2、3，生命倍率为 1、1.5、2。物理或特殊伤害倍率为总伤害倍率乘对应类别倍率。 | `source/src/data/lite-rules.js`、`source/src/combat/player.js`、`source/src/combat/stat-multipliers.js` |
| 波次与大招 | 波次表以 600 秒为基准。单关按 `600/360`、标准多关按 `600/300` 换算波次时间。大招充能率为特性倍率 × 道具倍率 × `(1 + 0.04 × 大招研究等级)`。 | `source/src/data/lite-rules.js`、`source/src/combat/stat-multipliers.js` |
| 血量与美术 | 三阶怪物共 27 种字形。存活敌人的可见笔数为 `ceil(当前生命 / 最大生命 × 总笔数)`，上限为原笔数。福袋沿同一顺序吸走剩余笔画。 | `source/src/data/character-rules.js`、`source/src/combat/enemy-population.js`、`resources/art/monsters/` |
| 场景与界面 | Three.js 绘制战场，桌面按原台面尺寸和正交投影取景。纸张菜单与 HUD 共用样式，经平台层布局、绘制和触摸命中。输入物理按 30 Hz 更新。 | `source/src/world/desk-framing.js`、`source/src/virtual-stick/`、`source/src/ui/`、`platform/` |

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

启动页和进场加载页沿用原海报 `resources/public/assets/ui-paper/loading-poster.webp`。横屏将插画放在左侧，右侧显示进度。冷启动沿用本分支的默认入口，准备存档、场景、字灵和战斗特效后，显示满进度条，以炎进入普通单关。原开场视频和分帧留在制作目录，横屏构建排除了这段影片。风系技能图集在后台预载，选风或双人出发时会等待图集安装。

## 横屏界面与字形模型

首页左侧显示游戏字标和当前字灵，右侧为开始旅程、双人前行、研究所和玩法说明。选字页并列展示模型、资料与图鉴，关卡页在同一画面呈现目的地、难度与出发按钮。战斗左上显示状态，右上为暂停和小地图，右下为大招和交互按钮。浮动摇杆沿用原触点起杆与松手逻辑。横屏布局在 `source/src/ui/landscape-style.js`。战斗镜头以 54° 俯角跟随角色，跟随距离、正交视野的宽和高均为原取景的 65%，由 `source/src/world/desk-framing.js` 中的 `deskCombatViewScale` 调整。

- 36 种模型来自原始分层字稿，共 452 个可单独控制的笔画。范围包括 8 个可玩形态、27 种敌字（含 48 笔的龘）和既有的隐藏字形摹。模型读取 `resources/public/config/glyph-solids.json`，按笔画生成封闭网格、倒角、侧面与反向外壳描边。颜色取自原稿。摹的制作用笔画图来自上游与本分支相同的骨架版本。
- 每个笔画绑定一根 Three.js 骨骼，角色保留原部件分组与转轴。8 个可玩形态按原动作图集重定向出 451 个待机、行走和倒地姿态，时序来自 `hero-action-catalog.js`。攻击、受击及技能专用姿态由原战斗状态时间驱动。相同字形的实例共用网格和骨骼矩阵表。界面头像与首页待机图由同一批模型渲染生成。
- 常规构建直接使用仓库内的模型数据和预览资源。改动笔画原稿或角色动作后，在根目录依次执行 `python tools/art/glyph-models.py`、`node tools/art/render-glyph-portraits.mjs`、`node tools/build.mjs`。模型生成需要 Pillow、NumPy、SciPy 和 scikit-image。
- 在微信开发者工具导入项目根目录即可运行现成的横屏包。桌面浏览器回归运行 `npm run test:landscape`，使用本机 Chrome 和 WebGL2，截图与数据写入 `验收/横屏演示/`。运行 `npm run test:cold-start` 可复查空缓存开局与切换风系。开发构建默认记录包体大小，显式传入 `node tools/build.mjs --wechat-limits` 可检查原有发布预算。

## 场景与演出资源

空气斩使用 `resources/art/air-slash-reference/空气斩.gif` 的新参考录像。第 7–27 帧按每帧 20 毫秒播放，包含出手前的空帧和最后一帧拖尾，总长 0.42 秒。运行 `node tools/art/build-air-slash-reference.mjs` 从原片去除桌面底色、用相邻清晰帧补齐被字灵与命中光遮挡的部分，生成透明图集；再运行 `npm run build:assets`。游戏中接在风系「空气斩」（403）上，沿实际瞄准方向飞行，每个目标只命中一次。`npm run test:air-slash` 核验来源、帧序、不同方向与帧率、隐藏特效和清理，并输出原片与实机对照 GIF。

进化参考 GIF 和光环轨迹保存在 `resources/art/upgrade/`。`node tools/art/build-evolution-screen.mjs` 使用 NumPy、Pillow、SciPy 和 OpenCV 重建光效图集、曝光和动作时间轴。再运行 `npm run build:assets` 更新小游戏资源。演出在 4.2 秒内按比例播放参考片的 171 帧，采用居中近景和爆发前暗场，覆盖场景与 HUD，结束后恢复正常镜头。`npm run test:upgrade-effects` 验证普通升级、六条进化路径、不同竖屏尺寸、低帧率、特效设置和清理。

福袋捕捉的图集和 111 帧位置表在 `resources/public/assets/vfx/capture-bag/`，随 `capture_bag` 微信分包加载。演出按每秒 24 帧播放，帧号从 0 起算。福袋落在字灵右后方，镜头从第 27 帧起用 0.52 秒完成平移和缩放。三格进度在第 36、52、68 帧推进。第 76 帧后，字灵的笔画依次飞入袋口。第 96 帧显示结果，成功时福袋合盖，挣脱时福袋保持打开，字灵从袋口弹出并在袋前落地。两个分支都在播完第 110 帧后结算。

修改素材后运行 `npm run build:assets`。福袋演出最多循环使用三个原生图片对象，只保留正在显示、正在读取和预读的图片页；每次演出结束都清空图集、取消未完成的读取，后续迟到的回调不会重新持有图片。iOS 在演出结束、开局、返回首页和切到后台时主动清理临时资源，原生垃圾回收最多每五秒触发一次。用 `node tools/runtime-performance.mjs --capture-bag` 检查 31 个位置的构图、三个挣脱阶段和成功收尾，用 `node tools/runtime-performance.mjs --capture-universal` 检查已打包字形的逐笔吸入和弹出。

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
| 生成正式版手机预览 | `npm run preview` 或双击 `preview-game.cmd`，二维码在 `验收/手机预览/` |
| 运行默认测试 | `npm test` |
| 检查演出内存释放和三分钟战斗模拟 | `npm run test:memory`（Chrome 中模拟 iOS 接口，真实 iPhone 峰值内存需真机验证） |
| 检查源码引用与正式包资源 | `npm run verify:source`、`npm run verify:assets` |

若微信工具预览报 `ENOENT ... packs/capture_bag/game.js`，但 `minigame/game.json` 中已经是带版本后缀的分包目录，说明工具仍保留旧分包配置。完整退出微信开发者工具后重新打开当前工程；仅清理编译缓存可能无效。日常手机预览建议使用 `preview-game.cmd`：它会重新构建、检查每个资源分包的入口与内容，再打开独立工程快照生成二维码，避免沿用旧工程索引。不要手动补空的旧分包目录，它会掩盖配置不一致。

手机扫码报「文字资源：readFile:fail file info not exit」时，表示启动资源文件没有读成功。本次修复统一将 Brotli 压缩数据打包为 `assets.bin`，由游戏显式解压；读取失败会尝试同步接口与代码包根路径，并自动重新加载一次分包。仅有文件索引不能跳过分包加载。运行 `npm run preview` 生成新码后，手机完全退出旧预览再扫码；无需清理玩家存档。可用 `node tools/smoke.mjs --phone-layout --software-render --boot-only --resource-read-recovery` 重现并检查自动恢复。

如果报错包含 `packs/art-…/assets.bin: no such file`，还需检查预览实际上传的资源：开发者工具可能看到新分包目录和入口，却漏掉目录内的二进制文件。`npm run preview` 使用独立工程快照重新建立文件索引，并在生成二维码后核对微信返回的全部分包路径和资源包体积；缺包或资源体积不足时不会替换可用二维码。每次成功预览都会另外保存带时间戳的 `正式预览-*.jpg`，扫码时使用本次输出的新文件，避免图片查看器复用旧二维码。
