# 青翠森林轻量版

从上一级目录运行 Start-Game.cmd，地址 http://127.0.0.1:18086/。

只保留森林经典模式（3 个区域 + 圣地），可选伙伴为炎、摹、风。炎→焱→燚；摹不进化；风在 26 级选择讽或疯，44 级分别进化为飒或飙。本局只能沿选定分支继续。三个伙伴从开始全部开放；捕获、闪光捕获及临时收服均限制为三个初始伙伴。森林原有敌人和 Boss 保留。

移除多人联机服务和页面模块、其他地图配置、活动配置，以及对应在线入口。旧发布包和迁移工具归档到 D:/宝可梦备份/轻量版移除文件-20261027；完整版仍在 D:/宝可梦破解。共享战斗代码中仍有不可达的旧模式分支，当前交付优先验证精简后的完整流程，未宣称完成全量死代码消除。

## 编辑入口

- src/lite-rules.js：三角色、单地图和存档边界。
- src/config.js：森林配置、角色技能和数值表。
- src/customize.js：数值修改示例、精简界面样式。
- src/game.js：角色、捕获、地图生成、战斗；CP 是主菜单，QP 是森林出发页。
- public/data/：角色和招式 JSON。
- public/assets/：角色精灵、敌人、场景模型、音效等。
- public/overrides/：自定义素材覆盖层。
- local/progression.mjs：本地结算规则。
- server.mjs：本机服务，默认只监听 127.0.0.1。
- lite-data/store.json：本版存档，不能直接混用完整版存档。

## 验证

在 project 目录运行：

    ..\runtime\node.exe --test tools/lite.test.mjs
    ..\runtime\node.exe tools/audit-assets.mjs
    ..\runtime\node.exe tools/audit-runtime-assets.mjs

无需安装依赖，审计所需解析器及许可在 tools/vendor。src/lite-qa.js 是仅在 18187 端口且带 ?qa=1 时加载的隔离验证按钮，正常启动 18086 不会显示或生效。QA 测试中主动切换区域和强制结算，不能等同于正常难度完整通关。

保留本地星星沙子结算规则（非已验证官方公式）。本版不参与在线排名或官方活动。来源及署名见 THIRD-PARTY-NOTICES.md、LICENSE、UPSTREAM-README.md。
