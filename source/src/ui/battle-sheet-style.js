export const battleSheetStyle = `
.zx [data-paper-surface="trade-action"]{color:#FFF6E6;background:#2B262E;border:0;border-radius:0;box-shadow:none;clip-path:polygon(5% 0,100% 0,95% 100%,0 100%)}
.zx [data-paper-surface="trade-action"].primary,.zx [data-paper-surface="trade-action"].armed{color:#28232C;background:#F1C654}
.zx [data-paper-surface="trade-action"]:disabled{color:#554D55;background:#C9C2C6;opacity:1}
.zx.zx-modal-wrap.shop-modal,.zx.zx-modal-wrap.zx-fusion-list,.zx.zx-modal-wrap.zx-fusion-preview,.zx.zx-modal-wrap.zx-pause-screen,.zx.zx-modal-wrap.zx-outcome-overlay{background:rgba(33,29,41,.79)}
.zx .zx-shop-shelves>.zx-review-content{background:#EEE8DA;padding:7px;gap:6px}
.zx .zx-shop-ledger{height:46px;min-height:46px;padding:1px 3px;background:#2B262E}
html.zixing .zx .zx-shop-index>.zx-shop-index-tab{color:#FFF5E0;min-height:44px;height:44px}
html.zixing .zx .zx-shop-index>.zx-shop-index-tab[aria-pressed="true"]{background:#F1C654;color:#28232C}
.shop-modal .zx-paper-upgrade-head.single-line{align-items:flex-start}
.shop-modal .zx-paper-upgrade-head>.zx-upgrade-ribbons{align-self:flex-start}
.shop-modal .zx-paper-upgrade-head>h1{right:auto;width:202px}
.shop-modal .zx-paper-upgrade-head>.zx-shop-balance{display:flex;justify-content:center;align-items:center;left:auto;right:0;top:3px;bottom:auto;height:33px;min-width:64px;background:#2B262E;color:#F4CF6B;padding:2px 9px}
.zx .zx-shop-stock>.shop-reroll{align-self:flex-end;width:auto;min-width:125px;min-height:44px;color:#342B2F;background:transparent;border:0;box-shadow:none}
.zx .zx-shop-sell-hint,.zx .zx-shop-stock>.help,.zx .zx-shop-empty{color:#63584E}
.zx .zx-shop-offer{flex-direction:row;align-items:stretch;gap:0;padding:2px;background:#EAE3D6}
.zx .zx-shop-offer[data-quality="uncommon"]{background:#BCE4AD}.zx .zx-shop-offer[data-quality="epic"]{background:#D6B8EE}.zx .zx-shop-offer[data-quality="legendary"]{background:#FFDC84}.zx .zx-shop-offer[data-quality="rare"]{background:#AAD1FA}
.zx .zx-shop-picture{position:relative;display:flex;flex-direction:column;justify-content:center;width:23%;height:auto;min-height:68px;gap:0;background:transparent;padding:4px 3px 14px}
.zx .zx-shop-picture>img{width:54px;max-width:96%;height:52px}
.zx .zx-shop-picture>.zx-quality-badge{position:absolute;left:3px;bottom:3px;min-height:16px;font-size:11px;line-height:16px;padding:0 5px}
.zx .zx-shop-description{align-self:stretch;gap:2px;padding:0}
.zx .zx-shop-head{width:71%;min-height:27px;padding:1px 12px 3px 8px;flex-wrap:wrap;background:#2B262E;clip-path:polygon(0 0,100% 0,100% 63%,93% 100%,0 100%)}
.zx .zx-shop-name{color:#FFF6E6;font-size:17px;line-height:23px}
.zx .zx-shop-effect{color:#312A2E;font-size:13px;line-height:17px;padding:1px 7px 0}
.zx .zx-shop-deal{margin-top:0;padding:0 4px 0 7px;gap:2px;border:0}
.zx .zx-shop-owned,.zx .zx-shop-status{font-size:11px;line-height:14px;color:#574D52}
.zx .zx-shop-inventory{min-width:0;flex:1}
html.zixing .zx .zx-shop-deal>.zx-shop-action{min-width:83px;gap:3px;padding:0 5px;font-size:14px}
html.zixing .zx .zx-shop-action.armed{outline:0}
.zx .zx-shop-action:not(.primary):not(.armed) .zx-shop-amount{color:#F1CA65}
.zx .zx-shop-action:disabled .zx-shop-amount{color:#554D55}
.zx .zx-combat-shell .zx-fusion-slip.zx-review-recipe{min-height:0;gap:3px;padding:6px 9px;background:#FAE8AD;border:0}
.zx .zx-combat-shell .zx-fusion-slip.unavailable{background:#DAD6D8}
.zx .zx-recipe-top,.zx .zx-recipe-bottom,.zx .zx-recipe-damage{display:flex;align-items:center;flex-direction:row;gap:7px;justify-content:space-between}
.zx .zx-review-recipe .zx-fusion-identity{flex:1;min-width:0;padding:0}
html.zixing .zx .zx-recipe-top>button{height:44px;min-height:44px;min-width:44px;padding:0 3px;color:#483A31;background:transparent;border:0;box-shadow:none}
.zx .zx-recipe-damage{padding:0 5px 3px;border-bottom:1px solid #AB9E8F;color:#352D30}
.zx .zx-recipe-bottom .zx-fusion-pair{flex:1;min-width:0;justify-content:flex-start;gap:3px;border:0;padding:0}
.zx .zx-recipe-bottom .zx-fusion-part{flex:1;min-width:0;gap:2px}
.zx .zx-recipe-bottom .zx-fusion-plus{margin:0 2px;color:#514952}
.zx .zx-recipe-bottom .zx-fusion-part img{width:18px;height:18px}
.zx .zx-recipe-bottom .zx-fusion-material>b{font-size:12px;line-height:17px}
html.zixing .zx .zx-recipe-bottom>.zx-fuse-action{padding:0 6px;min-width:60px;width:60px;min-height:44px;height:44px;font-size:15px}
.zx .zx-pause-leaf{background:#F0EADB;border:2px solid #2B262E}
.zx .zx-pause-identity{background:#302A32;padding:0 9px;height:60px}
.zx .zx-pause-name>b{color:#FFF6E6}.zx .zx-pause-name>small,.zx .zx-pause-identity>small{color:#EBCB83}
.zx .zx-pause-paper{padding:7px 9px 9px}.zx .zx-pause-metrics{background:#E4DCCB}
.zx .zx-pause-index,.zx .zx-pause-stat-pair>b,.zx .zx-pause-build-row>span{color:#353037}
.zx .zx-pause-leader{background:#C5BAA8}
.zx .zx-outcome-body{background:#EEE8DA;border:2px solid #2B262E;padding:9px 12px 12px;gap:8px}
.zx .zx-outcome-reward{align-items:flex-start;gap:2px;background:#302A32;padding:10px 12px}
.zx .zx-outcome-reward>b{color:#F3CC67;font-size:24px}
.zx .zx-outcome-metrics{border-bottom:1px solid #BAAE9B;padding:6px 0 10px}
.zx .zx-outcome-stat>b,.zx .zx-build-name,.zx .zx-build-quantity,.zx .zx-outcome-build>b{color:#302A32}
.zx .zx-outcome-stat>small,.zx .zx-outcome-note,.zx .zx-build-index>b{color:#63574E}
.zx .zx-build-index>i{background:#BFB4A2}.zx .zx-build-stamp{background:#DCD4C3}
.zx .zx-build-entry{border-bottom:1px solid #CABFAC}
.zx .zx-recipe-top{flex:none;min-height:44px}.zx .zx-recipe-damage{flex:none;min-height:21px}
.zx .zx-recipe-bottom{flex:none;min-height:48px}
html.zixing .zx .zx-shop-shelves .zx-review-footer>.pk-btn,html.zixing .zx .zx-shop-shelves .zx-review-footer>.pk-btn>span{color:#FFF6E6}
html.zixing .zx .zx-shop-shelves .zx-review-footer>.shop-exit,html.zixing .zx .zx-pause-footer>.primary,html.zixing .zx .zx-outcome-actions>.primary,html.zixing .zx .zx-recipe-bottom>.zx-fuse-action{color:#29252C}
html.zixing .zx .zx-recipe-bottom>.zx-fuse-action:disabled{color:#59535B}
.zx .zx-trade-label{font-weight:800;color:#FFF6E6}
.zx .primary>.zx-trade-label{color:#28232C}
html.zixing .zx .zx-recipe-bottom>.zx-fuse-action:disabled{width:66px;min-width:66px;padding:0 2px}.zx .zx-fuse-action:disabled>.zx-trade-label{font-size:13px;white-space:nowrap;color:#59535B}
.zx .zx-combat-shell .zx-fusion-slip.zx-review-recipe,.zx .zx-combat-shell .zx-fusion-slip.zx-fusion-record{flex-direction:row;align-items:stretch;padding:2px;gap:0;border:0}
.zx .zx-fusion-rail{display:flex;flex-direction:column;flex:none;align-items:center;justify-content:center;width:20%;align-self:stretch;background:#EAC255}
.zx .zx-fusion-rail.unavailable{background:#B8B3BA}
.zx .zx-recipe-copy{display:flex;flex-direction:column;align-items:stretch;flex:1;min-width:0;gap:0}
.zx .zx-recipe-top{padding:0 5px 0 8px;background:#2B262E;min-height:44px}
html.zixing .zx .zx-recipe-top .zx-fusion-name>h2{font-size:17px;line-height:22px;color:#FFF6E6}
.zx .zx-recipe-top .zx-fusion-name>small,html.zixing .zx .zx-recipe-top>button{color:#F1D78C}
.zx .zx-recipe-damage{margin:0 7px;padding:1px 0;min-height:22px;border-bottom:1px dotted #AA9C8D}
.zx .zx-recipe-bottom{padding:0 4px;gap:2px;min-height:48px}
.zx .zx-recipe-bottom .zx-fusion-pair{gap:1px}
.zx .zx-fusion-pair .zx-fusion-plus{width:12px;height:12px;flex:none;margin:0 3px}
.zx .zx-fusion-material>b,.zx .zx-fusion-stat>b{color:#332E34}
.zx .zx-fusion-record .zx-fusion-effect,.zx .zx-fusion-record .zx-fusion-figures,.zx .zx-fusion-record .zx-fusion-footnote{margin:4px 8px}
.zx .zx-fusion-record .zx-fusion-stat{background:#E5DBC1}.zx .zx-fusion-record.unavailable .zx-fusion-stat{background:#C9C4C9}
.zx .zx-fusion-record .zx-fusion-stat.spacer{background:transparent}
.zx .zx-fusion-record .zx-fusion-pair{margin:2px 8px;padding:4px 0;border:0}
@media(max-width:350px){.zx .zx-fusion-rail{width:17%}.zx .zx-recipe-bottom .zx-fusion-part{flex-direction:column;align-items:flex-start}.zx .zx-recipe-bottom{min-height:66px}}

.zx .zx-scene-offers .zx-scene-caption .zx-note{color:#FFF3DD}
html.zixing .zx .zx-scene-offers .zx-deal-card{display:flex;flex-direction:row;align-items:stretch;gap:0;padding:2px;min-height:82px;border:0;border-radius:0;box-shadow:none}
.zx .zx-deal-art{display:flex;position:relative;flex-direction:column;justify-content:center;align-items:center;align-self:stretch;flex:none;width:23%;min-height:72px;padding:2px 3px 17px}
.zx .zx-deal-art>img,.zx .zx-deal-art>canvas,.zx .zx-deal-art>.zx-glyph{width:48px;height:48px;object-fit:contain;flex:none}
.zx .zx-deal-art>.zx-quality-badge{position:absolute;left:3px;bottom:2px;color:#FFF8E9;min-height:16px;line-height:16px;font-size:11px}
.zx .zx-deal-copy{flex:1;min-width:0;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding-bottom:5px}
.zx .zx-deal-title{align-self:flex-start;max-width:100%;min-width:68%;padding:4px 15px 5px 7px;background:#2B262E}
html.zixing .zx .zx-deal-title>.zx-choice-title{color:#FFF6E6;font-weight:800;font-size:17px;line-height:21px}
.zx .zx-deal-copy>.zx-choice-kind,.zx .zx-deal-copy>.zx-choice-description,.zx .zx-deal-copy>.zx-choice-note{padding:1px 7px;margin:0;background:transparent;color:#433A40;font-size:13px;line-height:17px}
.zx .zx-deal-copy>.zx-choice-kind{color:#645950;font-size:11px;line-height:15px}
.zx .zx-deal-copy>.zx-choice-effect{margin:0;padding:2px 7px;gap:4px;background:transparent;border:0;border-radius:0}
.zx .zx-deal-copy .zx-effect-value{font-size:13px;line-height:18px}.zx .zx-deal-copy .zx-effect-sign{font-size:12px}
html.zixing .zx .zx-scene-offers .zx-choice-actions>button{min-height:44px;padding:0 7px}
.zx .zx-combat-shell .zx-forget-row{background:#EEE8DA;border:0;padding:2px 7px 2px 2px;min-height:76px;gap:8px}
.zx .zx-forget-art{width:23%;height:auto;align-self:stretch;border:0;background:#D4C9B4}
.zx .zx-forget-art>img,.zx .zx-forget-art>.ic,.zx .zx-forget-art>.typeicon{width:41px;height:41px}
html.zixing .zx .zx-forget-copy>h4{color:#332C34}.zx .zx-forget-copy .muted,.zx .zx-forget-action .zx-shop-amount>b{color:#5B5050}
html.zixing .zx .zx-forget-action>button{width:65px;padding:0 4px}
html.zixing .zx .zx-forget-action>button:disabled .zx-trade-label,.zx .zx-review-footer>button:disabled .zx-trade-label{color:#5E555B}
.zx .zx-party-pick,.zx .zx-party-photo{background:transparent}
.zx .zx-party-send{color:#FFF6E6;background:#2B262E;padding:4px 9px}
.zx .zx-party-intro-copy>small,.zx .zx-party-copy>b{color:#342A30}
.zx .zx-party-copy>small,.zx .zx-party-tallies>span{color:#594E50}
.zx .zx-party-intro-copy>b,.zx .zx-party-intro-copy>span,.zx .zx-party-instruction>span{color:#FFF4DD}
html.zixing .zx .zx-companion-dialog.zx-review-dialog{padding:2px 4px;background:transparent;border:0;border-radius:0;box-shadow:none}
.zx .zx-companion-dialog .zx-review-companion{border:0;border-radius:0;padding:8px;background:#EEE8DA}
.zx .zx-companion-dialog .zx-review-companion.selected{background:#F6D57B}
.zx .zx-companion-dialog .zx-review-check{border-radius:0;color:#352F36;background:transparent;border:1px solid #80756B}
.zx .zx-companion-dialog .zx-review-check.on{background:#EFC554;border-color:#5A4C3B}
.zx .zx-companion-dialog .zx-review-tag{background:transparent;color:#453A41}
.zx .zx-companion-dialog .zx-review-reward{background:transparent;border:0;padding:2px 8px}.zx .zx-companion-dialog .zx-review-reward>p{color:#FFF4DD}
html.zixing .zx .zx-companion-detail.zx-review-dialog{background:#EEE8DA;border-radius:0}
.zx .zx-companion-detail .zx-review-section{background:transparent;border:0}.zx .zx-companion-detail .zx-review-note{color:#5B5050}

.zx .zx-combat-shell>section.zx-route-picker{width:100%;max-width:366px;align-self:center;min-height:0;padding:0 5px 4px;background:transparent;border:0;box-shadow:none}
.zx .zx-branch-list{display:flex;flex-direction:column;width:100%;gap:10px;overflow-y:auto;min-height:0}
.zx .zx-route-picker .zx-branch-choice{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;width:100%;height:auto;min-height:108px;flex:none;gap:1px;padding:3px 10px 9px 3px;text-align:left;white-space:normal;border:0;border-radius:0;background:#EEE8DA;box-shadow:none}
.zx .zx-branch-top,.zx .zx-branch-text{display:flex;flex-direction:row;justify-content:space-between;align-items:center}
.zx .zx-branch-top{min-height:40px;gap:3px}
.zx .zx-branch-label{align-self:flex-start;padding:5px 13px 6px 9px;background:#2B262E;clip-path:polygon(0 0,100% 0,100% 68%,92% 100%,0 100%);color:#F5D47B;font-size:17px;line-height:21px;font-weight:800}
.zx .zx-branch-preview{position:relative;display:block;width:135px;height:40px;flex:none}
.zx .zx-branch-text{margin-left:9px;gap:4px;padding-top:2px}
.zx .zx-branch-damage{font-size:18px;line-height:24px;color:#302B33;text-align:left}
.zx .zx-branch-ult{font-size:12px;line-height:17px;color:#625342;text-align:right}
.zx .zx-branch-detail{margin:0 0 0 9px;padding-top:2px;font-size:13px;line-height:18px;color:#554E51;white-space:normal;text-align:left}
`;
