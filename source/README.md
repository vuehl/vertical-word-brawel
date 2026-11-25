# 字行 · 玩法源码

从项目根目录运行 `npm run build`，再用微信开发者工具导入项目根目录。详细的构建和预览命令见 [项目 README](../README.md)。

## 编辑入口

- src/data/lite-rules.js 管理可选角色、单地图与存档边界。
- src/data/config.js：森林配置、角色技能和数值表。
- src/ui/base.css、src/ui/portrait.css：Canvas 界面构建使用的基础样式与覆盖规则。
- `src/game.js` 管理微信启动、对局切换和每帧调度。
- `src/combat/run.js` 负责对局，`player.js` 负责玩家，`skills.js`、`upgrade-offers.js`、`ultimate-moves.js` 分别管理技能、升级候选和大招。
- `src/world/terrain.js`、`facilities.js` 管理地形和互动设施。`src/ui/zixing-ui.js` 负责微信首页和选角，`battle-hud.js` 负责战斗界面。
- ../resources/public/data/：角色和招式 JSON。
- ../resources/public/assets/：字灵图集、场景模型、界面贴图和技能特效。
- ../resources/public/overrides/：可选的自定义素材覆盖层。
- local/progression.mjs：本地结算规则。
- `local/game-routes.mjs` 提供小游戏内的账号、对局及存档接口，[微信平台接口](../platform/game-api.mjs) 负责接入微信存储与云进度。

## 验证

在当前目录运行：

    node --test tools/lite.test.mjs
    node tools/audit-assets.mjs
    node tools/audit-runtime-assets.mjs

审计所需的解析器及许可在 `tools/vendor/`。来源及署名见 `THIRD-PARTY-NOTICES.md`、`LICENSE` 和历史记录 `UPSTREAM-README.md`。
