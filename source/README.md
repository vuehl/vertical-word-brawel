# 字行 · 玩法源码

从项目根目录运行 `npm run build`，再用微信开发者工具导入项目根目录。详细的构建和预览命令见 [项目 README](../README.md)。

## 编辑入口

- src/data/lite-rules.js 管理可选角色、单地图与存档边界。
- src/data/config.js：森林配置、角色技能和数值表。
- src/ui/base.css、src/ui/customize.js：Canvas 界面构建使用的基础样式与覆盖规则。
- src/game.js：角色、捕获、地图生成、战斗；CP 是主菜单，QP 是森林出发页。
- ../resources/public/data/：角色和招式 JSON。
- ../resources/public/assets/：字灵图集、场景模型、界面贴图和技能特效。
- ../resources/public/overrides/：可选的自定义素材覆盖层。
- local/progression.mjs：本地结算规则。
- server.mjs：本地进度接口，随构建嵌入微信小游戏。HTTP 测试监听 127.0.0.1，使用独立的临时存档。

## 验证

在当前目录运行：

    node --test tools/lite.test.mjs
    node tools/audit-assets.mjs
    node tools/audit-runtime-assets.mjs

审计所需的解析器及许可在 `tools/vendor/`。来源及署名见 `THIRD-PARTY-NOTICES.md`、`LICENSE` 和历史记录 `UPSTREAM-README.md`。
