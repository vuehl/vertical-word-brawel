// Shared by the browser and the native Canvas stylesheet compiler.
export const zixingStyle = `
.zx{--ink:#29263c;--muted:#65716d;--paper:#f8f5ea;--purple:#8050d6;--line:#d9ded2;color:var(--ink);font-size:14px;font-weight:500;line-height:1.5;text-shadow:none;letter-spacing:0}
.screen.zx{position:absolute;inset:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;background:var(--paper);padding:0;overflow:hidden;backdrop-filter:none;pointer-events:auto}
html.touch .screen.zx{padding:0;overflow-y:hidden}
.screen.zx-home,html.touch .screen.zx-home{overflow:hidden;overflow-y:hidden}
.zx-home-scroll{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto}
.zx canvas{position:static;inset:auto;pointer-events:none}
html.zixing canvas.zx-glyph-icon{position:static;inset:auto;pointer-events:none;object-fit:contain;image-rendering:auto}
html.zixing .bn-pt canvas,html.zixing .cap-pt canvas,html.zixing .evo-portrait canvas,html.zixing .ally-pt canvas,html.zixing .bb-pt canvas{width:100%;height:100%}
html.zixing .mapbadge canvas{width:82%;height:82%}
html.zixing .tt-head canvas.zx-glyph-icon{width:32px;height:32px;flex:none}
.zx *{box-sizing:border-box;text-shadow:none;letter-spacing:0}
.zx button,.zx input{font-family:inherit;cursor:pointer;touch-action:manipulation}
.zx button{color:inherit;text-transform:none}
.zx button:disabled{cursor:default;opacity:.55}
.zx h1,.zx h2,.zx h3,.zx p{margin:0;transform:none}
.zx h1{font-size:24px;line-height:1.4}.zx h2{font-size:22px;line-height:1.4}.zx h3{font-size:17px;line-height:1.5}
.zx small{font-size:12px;line-height:1.5}.zx b,.zx strong{font-weight:700}
.zx-header{flex:none;padding:15px 24px 13px;background:repeating-linear-gradient(135deg,#829f94 0px,#829f94 9px,#91ac9e 9px,#91ac9e 18px);color:#fff;border-bottom:4px solid #b5ccbb}
.zx-header.blue{background:repeating-linear-gradient(135deg,#5e9cb6 0px,#5e9cb6 9px,#76afc3 9px,#76afc3 18px)}
.zx-header.purple{background:repeating-linear-gradient(135deg,#8797b1 0px,#8797b1 9px,#9dacc0 9px,#9dacc0 18px)}
.zx-header small{display:block;margin-top:2px;color:#fff}
.zx-body{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;padding:14px 24px;gap:12px}
.zx-body>*{flex-shrink:0}
.screen.zx-loading-screen{z-index:140}
.zx-loading-screen>.zx-body{justify-content:center;align-items:center;overflow:hidden;padding:24px}
.zx-loading-content{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:360px;text-align:center}
.zx-loading-content>.zx-loading-title{font-size:24px;line-height:1.4;font-weight:700;color:var(--ink)}
.zx-loading-progress{position:relative;flex:none;width:200px;height:200px;margin-top:12px}
.zx-loading-progress>.zx-loading-ring{display:block;width:200px;height:200px}
.zx-loading-progress>.zx-loading-percent{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;line-height:1;color:var(--ink)}
.zx-footer{display:flex;flex-direction:column;flex:none;padding:10px 24px 20px;gap:10px;background:var(--paper)}
.zx-button{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:48px;padding:10px 16px;background:#fff;border:1px solid #cdc6da;border-radius:25px;font-size:16px;font-weight:700;box-shadow:0 3px 0 #d6d0e2}
.zx-button.primary{background:repeating-linear-gradient(135deg,#ffda54 0px,#ffda54 9px,#ffe26d 9px,#ffe26d 18px);border:1px solid #e9bc43;box-shadow:0 3px 0 #c99e33;color:#332b20}
.zx-button.purple{background:repeating-linear-gradient(135deg,#8c5be2 0px,#8c5be2 9px,#996bea 9px,#996bea 18px);border:1px solid #7640ca;color:#fff;box-shadow:0 3px 0 #6036a8}
.zx-button.danger{background:linear-gradient(180deg,#f2757d 0%,#df5263 100%);border:1px solid #cf4a5c;color:#fff;box-shadow:0 3px 0 #b43c50}
.zx-card{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:14px;background:#fff;border:1px solid #c6cfc3;border-radius:17px;box-shadow:0 3px 0 #c6cfc3;text-align:center}
.zx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}.zx-row>*{min-width:0}
.zx-col{display:flex;flex-direction:column;justify-content:center;gap:4px;flex:1;min-width:0}
.zx-center{text-align:center;align-items:center}.zx-note{color:var(--muted);font-size:12px;line-height:1.6}.zx-line{height:1px;background:var(--line);flex:none;margin:4px 0}
.zx-link{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:42px;padding:10px 12px;border:1px solid #d7e1ee;border-radius:12px;background:#fff;color:#32638c!important;font-size:13px;text-align:left}
.zx-plain{display:flex;align-items:center;justify-content:center;min-height:36px;padding:4px 8px;border:0;background:transparent;font-size:13px}
.zx-button.zx-plain{width:auto;border:0;box-shadow:none;border-radius:0;background:transparent;font-weight:500}
.zx-button>.zx-row{width:100%}
.zx-row>.zx-button{flex:1;min-width:0;width:auto}
.zx-row>.zx-plain,.zx-row>.zx-gear{flex:none}
.zx-row>.zx-gear{width:42px}
.zx-tabs{display:flex;flex:none;gap:4px;padding:4px;border-radius:24px;background:#e7e2f0}
.zx-tab{flex:1;min-width:0;min-height:38px;padding:6px 4px;border:0;border-radius:21px;background:transparent;font-size:14px;white-space:nowrap}
.zx-tab.on{background:#fff;color:#643799;box-shadow:0 2px 0 #d5cde3;font-weight:700}
.zx-tabs.main .zx-tab.on{background:repeating-linear-gradient(135deg,#4c96e7 0px,#4c96e7 7px,#64a5ee 7px,#64a5ee 14px);color:white}
.zx-tabs.research .zx-tab.on{background:repeating-linear-gradient(135deg,#8693aa 0px,#8693aa 7px,#9aa8bd 7px,#9aa8bd 14px);color:white}
.zx-subtabs{display:flex;flex:none;gap:6px}.zx-subtab{flex:1;min-height:40px;padding:6px 3px;border:1px solid #d2d7c9;border-radius:10px;background:#fff;font-size:12px;white-space:nowrap}.zx-subtab.on{background:#f0e8fc;border:2px solid #9775bd;color:#603298}
.zx-glyph{display:flex;align-items:center;justify-content:center;flex:none;width:44px;height:48px;font-size:36px;font-weight:700;line-height:1.1;color:#7951a6;background:#f4f0fa;border-radius:12px}
.zx-glyph.fire{color:#bb303d;background:#fff0f1}.zx-glyph.water{color:#2769b6;background:#edf6ff}.zx-glyph.wood{color:#228144;background:#eaf8ed}
.zx-glyph.large{width:128px;height:128px;font-size:92px;border-radius:70px;background:#ffffff66;border:1px solid #d2d7c9}
.zx-hero{display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 0 6px;text-align:center}
.zx-choices{display:flex;gap:10px}.zx-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-width:0;gap:2px;min-height:96px;padding:7px;border:1px solid #dcd6e5;border-radius:18px;background:#fff;box-shadow:0 3px 0 #c9d1c2;font-size:14px}
.zx-choice.on{background:#fff1f2;border:2px solid #b94b5a}.zx-choice.water.on{background:#edf6ff;border-color:#4d84b9}.zx-choice.wood.on{background:#e6f6ea;border-color:#4b9e65}
.zx-choice .zx-glyph{height:38px;width:44px;font-size:34px}
.zx-home-top{position:relative;z-index:2;min-height:68px;padding:12px 24px;flex:none;background:var(--paper)}.zx-home-top>.zx-row{min-height:44px}.zx-home-top small{font-size:14px;font-weight:700;color:#615477}
.zx-gear{height:44px;width:44px;border:1px solid #e5dfed;border-radius:24px;background:#fff;font-size:22px}
.zx-button.zx-gear{min-height:44px;padding:0;box-shadow:0 3px 0 #d9d2e8}.zx-home-top .zx-gear{width:44px}
.zx-home-art{position:relative;flex:none;height:calc(100vw * .76923);width:100%;margin-top:0}.zx-forest{width:100%;height:150px;flex:none;border-radius:14px}
.zx-home-art canvas{width:100%;height:100%}.zx-home-body{flex:none;overflow:visible;overflow-y:visible;padding-top:12px;padding-bottom:24px;gap:12px}
.zx-home-copy{display:flex;flex-direction:column;gap:5px;text-align:center;align-items:center;margin-top:0}.zx-home-copy h2{font-size:24px}.zx-home-copy p{font-size:15px;font-weight:700;color:#615477}
.zx-home-types{display:flex;justify-content:center;gap:12px;margin-top:4px}.zx-home-types .zx-row{flex:1;min-width:0;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;font-size:14px;font-weight:700;color:#615477}.zx-home-types .zx-row>span{white-space:nowrap}.zx-home-types .zx-glyph{width:28px;height:30px;font-size:26px;border-radius:8px}
.zx-home-start{min-height:52px}.zx-home-start>span:last-child{font-size:20px}
.zx-home .zx-home-lab{justify-content:space-between;min-height:66px;padding:10px 14px;border:0;border-radius:19px;background:linear-gradient(90deg,#b5c8c4 0%,#7f9b9c 100%);box-shadow:0 4px 0 #5f777b}
.zx-home-lab .zx-col{text-align:left;gap:2px}.zx-home-lab b{font-size:18px}.zx-home-lab small{font-size:14px}.zx-home-lab .zx-glyph{width:24px;height:34px;font-size:26px;background:transparent;color:#fff;border-radius:0}
.zx-home-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:2px 0}.zx-home-foot .zx-button.zx-plain{padding:0;gap:8px;font-size:14px;font-weight:700;color:#615477}.zx-home-foot>small{font-size:14px;font-weight:700;color:#615477}
.zx-lock{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #e4dfec;color:#676373}.zx-lock .zx-thumb{width:76px;height:48px;border-radius:10px;background:#e4e0d4;color:#a7a189;font-size:24px}
.zx-icon{display:block;flex:none;pointer-events:none}
.zx-map .zx-body{gap:8px;padding-top:12px;padding-bottom:12px}
.zx-map-card{padding:0;gap:0;overflow:hidden}.zx-map-card .zx-forest{height:130px;border-radius:16px 16px 0 0;object-fit:cover}
.zx-map-caption{position:relative;min-height:54px;padding:6px 44px}.zx-map-caption .zx-col{gap:0}.zx-map-caption h2{font-size:20px}
.zx .zx-map-caption>.zx-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%)}
.zx-map-summary{text-align:center;line-height:1.5}.zx-lock-list{display:flex;flex-direction:column;gap:0}
.zx-lock-list .zx-lock{min-height:66px;padding:5px 0;gap:10px}.zx-lock .zx-col{text-align:center;gap:0}.zx-lock .zx-col>small{font-size:11px;line-height:1.45}
.zx-map-thumb{width:76px;height:50px;flex:none;border-radius:10px;object-fit:cover}
.zx-difficulty .zx-col{text-align:center}
.zx-lab-row .zx-col{text-align:center}.zx-lab-row .zx-row{justify-content:center;gap:8px}.zx-lab-row .zx-pips{justify-content:center}
.zx-difficulty{display:flex;gap:12px;align-items:center;text-align:left;min-height:100px;padding:14px;border:1px solid #e4deeb;border-radius:17px;background:#fff;box-shadow:0 3px 0 #c6cfc3}.zx-difficulty.on{border:2px solid #6b99c1;background:#eef7ff}.zx-difficulty:disabled{opacity:.8}.zx-difficulty .zx-glyph{background:transparent}
.zx-wallet{display:flex;flex-direction:column;gap:2px;padding:13px 16px;background:repeating-linear-gradient(135deg,#7b8f9f 0px,#7b8f9f 9px,#8da1af 9px,#8da1af 18px);border:1px solid #7850bc;border-radius:17px;color:#fff;box-shadow:0 3px 0 #68409c}.zx-wallet strong{font-size:30px;line-height:1.2}.zx-wallet button{color:white}
.zx-lab-row{display:flex;align-items:center;gap:9px;min-height:66px;padding:8px 0;border-bottom:1px solid #eeeaf3}.zx-lab-row:last-child{border-bottom:0}.zx-lab-row .zx-glyph{width:38px;height:42px;font-size:29px}
.zx-buy{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:54px;height:54px;min-height:54px;flex:none;padding:4px;border-radius:28px;border:1px solid #4fae73;background:#62c486;color:#29263c!important;font-size:16px;font-weight:700;line-height:1.2;text-align:center;box-shadow:none}.zx-buy.poor{background:#b9b1c9;border-color:#aaa0bd}.zx-buy>b,.zx-buy>small{flex:none;width:100%;text-align:center;line-height:1.2}.zx-buy small{font-size:11px;font-weight:500}
.zx-pips{display:flex;gap:3px;margin-top:3px}.zx-pips i{width:8px;height:3px;background:#e6e1ec;border-radius:2px}.zx-pips i.on{background:#a780d5}
.zx-modal-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px 20px;background:#28233980;z-index:100;pointer-events:auto}
.zx-modal{display:flex;flex-direction:column;gap:14px;width:100%;max-width:420px;max-height:100%;overflow-y:auto;padding:26px 22px;border:1px solid #eeeaf4;border-radius:22px;background:#fff;box-shadow:0 6px 0 #342a4522}
.zx-modal>*{flex-shrink:0}.zx-modal .zx-button{flex:none}.zx-modal h2{text-align:center}.zx-modal .zx-footer{padding:0;background:#fff}
.zx-modal>h2,.zx-modal>small:first-child{align-self:center;text-align:center}.zx-modal>.zx-center{display:flex;flex-direction:column;align-items:center}
.zx-modal>small,.zx-modal>p,.zx-modal>b{text-align:center}
.zx-modal.zx-item-dialog{max-width:360px;padding:20px;gap:16px;overflow:hidden}
.zx-item-dialog>h2{flex:none;font-size:21px;line-height:1.4}
.zx-item-dialog>.zx-item-body{display:flex;flex-direction:column;flex-shrink:1;min-height:0;gap:12px;overflow-y:auto}
.zx-item-body>*{flex-shrink:0}
.zx-item-card{display:flex;flex-direction:column;gap:16px;min-width:0}
.zx-item-hero{position:relative;display:flex;align-items:center;justify-content:center;flex:none;min-height:132px;background:#ecf1e2;border:1px solid #cedbc2;border-radius:13px}
.zx-item-rarity{position:absolute;left:10px;top:10px;padding:3px 9px;border:1px solid #c5d3b7;border-radius:10px;background:#fffdf4;color:#586b50;font-size:11px;line-height:1.3}
.zx-item-image{width:64px;height:64px;object-fit:contain;image-rendering:pixelated}
.zx-item-copy{display:flex;flex-direction:column;gap:7px;min-width:0;text-align:left}
.zx-item-copy h3{font-size:20px;line-height:1.4;color:#303e35}
.zx-item-effect{font-size:14px;line-height:1.5;color:#53684f;font-weight:700}
.zx-item-description,.zx-item-note{font-size:12px;line-height:1.6;color:#6d7567}
.zx-item-note{padding:9px 11px;background:#f0f1e8;border-radius:9px;text-align:left}
.zx-item-actions{display:flex;flex:none;align-items:stretch;gap:10px;padding-top:12px;border-top:1px solid #dce2d2}
.zx-item-actions>.zx-button{flex:1;min-width:0;width:auto;min-height:46px;padding:10px 6px;font-size:15px}
.zx-item-actions>.zx-item-sell{background:#edf1e6;border-color:#b9c7b0;color:#52634d;box-shadow:none}
.zx-item-option{flex-direction:row;align-items:center;gap:12px;width:100%;min-height:116px;padding:12px;border:1px solid #c2ceb7;border-radius:12px;background:#fffdf5;text-align:left}
.zx-item-option .zx-item-hero{width:66px;min-height:88px;border:0;background:#edf2e4}
.zx-item-option .zx-item-rarity{left:5px;top:5px;padding:2px 6px;font-size:10px}
.zx-item-option .zx-item-image{width:42px;height:42px;margin-top:18px}
.zx-item-option .zx-item-copy{flex:1;gap:5px}.zx-item-option h3{font-size:16px}.zx-item-option .zx-item-effect{font-size:12px}
@media(max-width:350px){.zx-modal.zx-item-dialog{padding:16px;gap:12px}.zx-item-dialog>h2{font-size:19px}.zx-item-hero{min-height:108px}.zx-item-image{width:52px;height:52px}.zx-item-actions{gap:8px}.zx-item-actions>.zx-button{font-size:13px}}
.zx-upgrade{gap:12px;padding-top:26px;padding-bottom:24px}
.zx-button.zx-upgrade-stats{align-self:flex-end;justify-content:flex-end;width:auto;min-height:32px;padding:0;gap:6px;margin-top:-4px;background:transparent;border:0;border-radius:0;box-shadow:none;color:#65577b;font-size:14px}
.zx-upgrade .zx-offer{min-height:104px;padding:14px;border:1px solid #c6cfc3;border-radius:14px;background:#fff;box-shadow:none;text-align:left;color:var(--ink)}
.zx-offer .zx-row{gap:12px}.zx-offer .zx-col{text-align:left;gap:4px;align-items:stretch}.zx-offer b{font-size:16px;line-height:1.4}.zx-offer small{font-size:13px;line-height:1.5;font-weight:500}.zx-offer .zx-glyph{width:44px;height:50px;font-size:39px;border-radius:10px}
.zx-button.zx-reroll{min-height:40px;padding:7px 10px;gap:8px;border:1px solid #e0d8ef;border-radius:9px;background:#fff;box-shadow:none;color:#65577b;font-size:14px}
.zx-pause{gap:16px;padding:24px 20px}.zx-pause>small:first-child{font-size:14px;font-weight:700}.zx-pause>h2{font-size:24px;margin-bottom:8px}
.zx-pause-profile{gap:10px;min-height:44px}.zx-pause-profile .zx-glyph{width:30px;height:34px;font-size:28px;border-radius:8px}.zx-pause-profile .zx-col{gap:3px;text-align:left}.zx-pause-profile small{font-size:14px;font-weight:700}
.zx-build-tags{display:flex;flex-wrap:wrap;align-items:flex-start;gap:0;margin-bottom:-8px;min-width:0}
.zx-build-tag{max-width:100%;margin:0 8px 8px 0;padding:5px 8px;background:#f3eff9;color:#62567e;border-radius:5px;font-size:13px;font-weight:700;line-height:1.5}
.zx-pause-stats{display:flex;align-items:stretch;gap:0;padding:20px 0 16px;border-top:1px solid #ece6f3}.zx-pause-stats .zx-col{align-items:center;text-align:center;gap:4px}.zx-pause-stats b{font-size:22px;font-weight:500;line-height:1.2}.zx-pause-stats small{font-size:14px;font-weight:700}
.zx-pause .zx-pause-attributes{min-height:46px;padding:10px 12px;border:2px solid #d9e6ff;border-radius:14px;box-shadow:none;gap:8px}
.zx-pause-attribute-title{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#2e6ddb;flex:none}.zx-pause-attribute-note{font-size:13px;color:#65577b;text-align:right}
.zx-pause-actions{gap:10px}.zx-pause .zx-pause-actions>.zx-button{flex:1;min-width:0;min-height:46px;padding:10px 6px;gap:8px;border:1px solid #e2dcef;border-radius:10px;background:#fff;box-shadow:none;color:#61577b;font-size:14px}
.zx-summary-grid{display:flex;align-items:stretch;gap:6px}.zx-summary-grid .zx-col{align-items:center;text-align:center;padding:12px 2px;border-right:1px solid #c6cfc3}.zx-summary-grid b{font-size:22px;font-weight:500}
.zx-stat-grid{display:flex;flex-direction:column;gap:8px}.zx-stat-grid .zx-row{align-items:stretch;gap:8px}.zx-stat-grid .zx-card{flex:1;min-width:0;gap:0;padding:10px}.zx-stat-grid strong{font-size:25px;color:#227647;line-height:1.25}.zx-stat-grid small{font-size:11px}
.zx-stat-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 0;min-height:44px;border-bottom:1px solid #ece7f1}.zx-stat-row:last-child{border:0}
.zx-setting{display:flex;flex-direction:column;gap:9px;padding:10px 0;border-bottom:1px solid #ebe6f0}.zx-setting:last-child{border:0}.zx-setting>small{color:#696074}.zx-range{width:100%;height:24px;accent-color:#8d5ed4}.zx-switch{display:flex;align-items:center;justify-content:flex-start;flex:none;width:44px;height:26px;padding:3px;background:#cec7dc;border:0;border-radius:16px}.zx-switch i{width:20px;height:20px;border-radius:12px;background:#fff}.zx-switch.on{justify-content:flex-end;background:#53bd7a}
.zx-setting{text-align:left}.zx-stat-row{text-align:left}
.zx-options{display:flex;gap:0;background:#e9e3f0;border-radius:18px;padding:3px}.zx-option{padding:5px 8px;min-width:30px;min-height:31px;border:0;border-radius:16px;background:transparent;font-size:12px}.zx-option.on{background:#fff;color:#66349d;font-weight:700}
.zx-banner{padding:12px;border:1px solid #e9dba9;border-radius:14px;background:#fff2b5;color:#5e4b22}.zx-success{padding:10px;border:1px solid #bbdbca;border-radius:12px;background:#e2f5e8;color:#245e3c;font-size:13px}
.zx-help-map{width:100%;height:235px;flex:none}.zx-help-row{padding:12px 0;border-bottom:1px solid #e6e0ed}.zx-help-row h3{font-size:16px;margin-bottom:5px}.zx-help-row p{font-size:13px;line-height:1.65}
.zx-hud{position:absolute;inset:0;pointer-events:none;z-index:5;color:#30383c;font-size:13px}.zx-hud-pause{pointer-events:auto}
.zx-slot{display:flex;justify-content:center;gap:6px;background:#f4f0fa;border:6px solid #5c536f;border-radius:12px;padding:8px}.zx-slot b{display:flex;justify-content:center;align-items:center;flex:1;height:80px;font-size:48px;background:#fff;color:#5c536f;border-radius:6px}
.zx-intro{position:absolute;left:24px;right:24px;top:130px;padding:14px;background:#ffffffee;border:1px solid #e5dfee;border-radius:14px;display:flex;flex-direction:column;gap:4px;align-items:center;pointer-events:none;z-index:10}
.zx-dark .zx-card,.zx-dark .zx-modal,.zx-dark .zx-choice,.zx-dark .zx-difficulty,.zx-dark .zx-setting{background:#363047;color:#eee9f8;border-color:#564b68}
.zx-dark .zx-note{color:#c4bbd4}.zx-dark .zx-tabs{background:#42394f}
.zx-dark .zx-home-copy p,.zx-dark .zx-home-types .zx-row{color:#d6ccea}
.zx-dark .zx-tab{color:#eee9f8}.zx-dark .zx-tab.on{color:#643799}
.zx-dark .zx-link,.zx-dark .zx-button:not(.primary):not(.purple):not(.danger):not(.zx-buy){background:#484056;color:#eee9f8!important;border-color:#746285}
.zx-dark .zx-build-tag{background:#49405d;color:#ece5fa}.zx-dark .zx-pause-attribute-title{color:#9cc5ff}.zx-dark .zx-pause-attribute-note{color:#d4c9e7}.zx-dark .zx-upgrade-stats{background:transparent!important}
html.zixing #hud .hud-tl,html.zixing #hud .under,html.zixing #hud .hud-party,html.zixing #hud .hud-top,html.zixing #hud .hud-tr,html.zixing #hud .hud-bl,html.zixing #hud .hud-br,html.zixing #hud .lock-hint{display:none!important}
html.zixing .zx-hud{z-index:50}
html.zixing .zx-hud-pause{flex:none;width:40px;min-height:40px;height:40px;padding:0;border:0;box-shadow:none}
html.zixing .tc-aim{top:auto;right:18px;bottom:210px}
html.zixing .tc-ultb.ult{right:18px;bottom:104px;width:76px;height:76px}
html.zixing .tc-act{bottom:264px}
html.zixing .tc-pause{display:none!important}
html.zixing .modal:not(.zx-modal-wrap){background:#fff;color:#29263c;border:1px solid #e0d8ec;border-radius:22px;box-shadow:none;backdrop-filter:none}
html.zixing .modal:not(.zx-modal-wrap){z-index:100}
html.zixing .banner{top:196px;padding:0 16px;transform:none}
html.zixing .banner .bn-row{width:100%;max-width:350px;gap:10px;padding:10px 12px;border:1px solid #c4dce2;border-radius:16px;background:#fffdf6f5;box-shadow:0 3px 0 #728aa544}
html.zixing .banner .bn-pt{width:44px;height:44px;border:2px solid #79b7c8;background:#edf8f6;box-shadow:none;animation:none}
html.zixing .banner .bn-txt{align-items:flex-start;flex:1;gap:3px}
html.zixing .banner h1{margin:0;padding:0;font-size:17px;line-height:1.3;background:transparent;color:#334d66;border-radius:0;box-shadow:none;text-shadow:none;transform:none;text-align:left}
html.zixing .banner p{margin:0;padding:0;max-width:none;font-size:11px;line-height:1.4;font-weight:500;background:transparent;color:#62727d;box-shadow:none;text-align:left}
html.zixing .modal>h1{background:transparent;color:#29263c;transform:none;text-shadow:none;font-size:24px;border:0}
html.zixing .uc-pt canvas{position:static;inset:auto;width:100%;height:100%;object-fit:contain;image-rendering:auto;pointer-events:none}
html.zixing .tc-ultb.ult{background:#9262df;border:3px solid #eee4ff;box-shadow:0 0 0 2px #b497de}
html.zixing .ult-core{background:transparent}.zx-ult-label{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700;line-height:1.3}
html.zixing .tc-ultb .ult-nm,html.zixing .tc-ultb kbd{display:none}
html.zixing .tc .tc-ultb.ult{background:repeating-linear-gradient(135deg,#8855df 0px,#8855df 10px,#a077ec 10px,#a077ec 20px)!important}
html.zixing .tc .tc-ultb .ult-core,html.zixing .tc .tc-ultb .ult-ring{background:transparent!important}
html.zixing .tc.zx-touch{--zx-stick-size:min(calc(148px * var(--tcs,1)),calc(62vw - 64px));--zx-ult-size:min(calc(84px * var(--tcs,1)),calc(38vw - 38px))}
html.zixing .tc.zx-touch .tc-stick{display:block!important;pointer-events:auto;left:auto;top:auto;right:min(calc(84px * var(--tcs,1) + 34px),calc(38vw - 4px));bottom:max(174px,22%);width:var(--zx-stick-size);height:var(--zx-stick-size);margin:0;opacity:1;border:2px solid #ffffffe6;border-radius:999px;background:#e4e2ed66;box-shadow:inset 0 0 0 6px #aaa4ba44;transform:translateY(50%)}
html.zixing .tc.zx-touch .tc-stick.on{background:#dfd9eb8c;border-color:#fff;transform:translateY(50%)}
html.zixing .tc.zx-touch .tc-stick>i{left:30%;top:30%;width:40%;height:40%;margin:0;border:2px solid #fff;border-radius:50%;background:linear-gradient(145deg,#fffdf9,#c2bace);box-shadow:0 3px 0 #8d849f66;pointer-events:none}
html.zixing .tc.zx-touch .tc-ultb.ult{right:18px;bottom:max(246px,31%);width:var(--zx-ult-size);height:var(--zx-ult-size);zoom:1;transform:translateY(50%)}
html.zixing .tc.zx-touch .tc-ultb.ult.on{transform:translateY(50%);border-color:#cbb1ff}
html.zixing .tc.zx-touch .zx-ult-label{width:100%;height:100%;text-align:center;font-size:calc(18px * var(--tcs,1))}
html.zixing .tc.zx-touch .tc-act{left:auto;right:18px;bottom:max(246px,31%);width:var(--zx-ult-size);max-width:none;min-height:60px;height:auto;margin:0 0 -62px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;zoom:1;transform:translateY(100%);background:#fffbedf5;border:2px solid #c4b591;border-radius:14px;box-shadow:none;white-space:normal;color:#5d644b}
html.zixing .tc.zx-touch .tc-act.on{transform:translateY(100%);background:#e5ecd8;border-color:#9bab85}
html.zixing .tc.zx-touch .tc-act>i{display:flex;align-items:center;justify-content:center;flex:none;width:18px;height:18px;background:transparent;border:0;box-shadow:none}
html.zixing .tc.zx-touch .tc-act>span{display:flex;flex-direction:column;align-items:stretch;gap:2px;width:100%;text-align:center;white-space:normal}
.zx-act-title{font-size:11px;line-height:1.2;color:#596348}.zx-act-detail{font-size:10px;line-height:1.2;color:#847858}
.zx-act-poor .zx-act-title{color:#a25f51}
/* Keep longer landmark and shop descriptions readable outside the item card. */
html.zixing .tc.zx-touch .tc-act:not(.zx-item-act){left:70px;right:18px;bottom:max(322px,42%);width:auto;min-height:44px;margin:0;padding:10px 12px;flex-direction:row;gap:8px;transform:none}
html.zixing .tc.zx-touch .tc-act:not(.zx-item-act)>span{flex:1;width:auto;text-align:left}
html.zixing .tc.zx-touch .tc-act:not(.zx-item-act) .zx-act-title{font-size:12px;line-height:1.4}
@media(max-width:350px){.zx-body{padding:12px 16px;gap:10px}.zx-footer{padding:8px 16px 14px;gap:8px}.zx-header{padding:12px 16px}.zx-home-top{padding:10px 16px 0}.zx-home-copy h2{font-size:21px}.zx-home-copy p{font-size:14px}.zx-home-lab small{font-size:12px}.zx-glyph.large{width:100px;height:100px;font-size:74px}.zx-choice{min-height:83px}.zx-modal{padding:20px 16px;gap:12px}.zx-home-types{gap:10px}}
@media(max-width:350px){.zx-upgrade .zx-offer{padding:12px;min-height:100px}.zx-offer .zx-row{gap:10px}.zx-offer .zx-glyph{width:36px;height:44px;font-size:34px}.zx-pause .zx-pause-attributes{padding:10px 8px;gap:6px}.zx-pause-attribute-note{font-size:11px}.zx-pause .zx-pause-actions>.zx-button{gap:5px;font-size:13px}}
@media(min-width:600px){.zx-body,.zx-footer{padding-left:calc(50vw - 210px);padding-right:calc(50vw - 210px)}.zx-home-art{height:300px}.zx-home-top{padding-left:calc(50vw - 210px);padding-right:calc(50vw - 210px)}}

/* Paper workshop: shared typography and surfaces for all screens. */
.zx{--paper:#f8f5ea;--muted:#65716d;--line:#d7ddcf;font-weight:500}
.zx h1,.zx h2,.zx h3{font-weight:800;color:#29263c}
.zx-header{background:#eef2e6;color:#475f5e;border-top:5px solid #94bda3;border-bottom:1px solid #b7c5b7;padding-top:12px}
.zx-header.blue,.zx-header.purple{background:#e9f0e7;color:#475f5e}.zx-header small{color:#63776e}
.zx-button{border:1px solid #a7b5a7;border-radius:14px;box-shadow:0 3px 0 #bdc8b9;font-weight:700}
.zx-button.primary{background:linear-gradient(180deg,#ffe7a1 0%,#efd082 100%);border:2px solid #a68a53;color:#423b2c;box-shadow:0 3px 0 #aa915d}
.zx-button.purple{background:linear-gradient(180deg,#a4bac1 0%,#7f9b9c 100%);border:1px solid #697e86;box-shadow:0 3px 0 #5f777b}
.zx-card{border:1px solid #c0cbbb;border-radius:12px;background:#fffdf6;box-shadow:0 3px 0 #d3dacb}
.zx-choice,.zx-difficulty{border-color:#c1ccbc;border-radius:14px;background:#fffdf6;box-shadow:0 3px 0 #c9d1c2}
.zx-modal{background:#fffdf6;border:2px solid #b1beae;border-radius:18px}.zx-modal .zx-footer{background:transparent}
.zx-tabs{background:#dfe6d9;border-radius:12px}.zx-tab{border-radius:9px}.zx-tab.on{color:#405f60;box-shadow:0 2px 0 #b3c2b3}
.zx-tabs.main .zx-tab.on,.zx-tabs.research .zx-tab.on{background:#829f9d;color:#fff}
.zx-subtab.on{background:#e4f0e7;border-color:#8da899;color:#3e6563}.zx-subtabs{gap:5px}
.zx-glyph{background:transparent!important;border:0!important;border-radius:0!important;overflow:visible}
.zx-glyph-image{width:100%;height:100%;object-fit:contain}
.zx-glyph.large{width:128px;height:128px}
.zx-home-art{height:calc(100vw * .76923)}.zx-home-copy h2{font-size:25px}.zx-home-copy p{color:#61756d;font-size:14px}
.zx-home-top small,.zx-home-types .zx-row,.zx-home-foot>small{color:#536f6a}.zx-home-top .zx-gear{background:#fffdf4;border-color:#b9c7b7;border-radius:12px}
.zx-home .zx-home-lab{background:linear-gradient(90deg,#a4bdba 0%,#789494 100%);border:1px solid #617f7f;border-radius:14px;color:white;box-shadow:0 3px 0 #5d777b}
.zx-home-lab .zx-glyph{width:36px;height:40px}.zx-home-types .zx-glyph{width:32px;height:36px}
.zx-build-tag{background:#e8eee1;color:#506c61}.zx-upgrade .zx-offer{background:#fffdf6;border-color:#bdc9b8}
.zx-slot{background:#d9e2d6;border-color:#748c83}.zx-slot b{color:#455e5f;background:#fffdf4}
.zx-intro{background:#fffdf6ee;border:1px solid #97b19f;border-radius:10px;top:178px;color:#334d4b}
html.zixing .zx-hud{color:#25243c}
.zx-hud-top{position:absolute;top:49px;left:12px;right:12px;height:156px;background:transparent}
.zx-hud-location{position:absolute;left:12px;top:8px;height:26px;max-width:calc(100% - 24px);padding:0 8px;display:flex;align-items:center;gap:6px;background:#fffdf6ed;border:1px solid #d5e2eb;border-radius:14px}
.zx-hud-area{font-size:11px;line-height:1.2;font-weight:700;color:#3f5574;white-space:nowrap}
.zx-hud-counters{position:absolute;left:4px;top:107px;height:28px;display:flex;align-items:center;gap:8px}
.zx-hud-counter{height:28px;min-width:86px;display:flex;align-items:center;gap:6px;padding:0 9px;background:#fffdf6f5;border:1px solid #d5e2eb;border-radius:15px}
.zx-hud-counter>.zx-icon,.zx-hud-location>.zx-icon,.zx-hud-meta>.zx-icon{flex:none}
.zx-hud-clock,.zx-hud-gold{font-size:16px;line-height:1.2;font-weight:700;color:#3c4d6b;white-space:nowrap}.zx-hud-gold{color:#92703a}
.zx-hud-profile{position:absolute;left:0;right:108px;top:5px;height:94px}
.zx-hud-card-back{position:absolute;left:35px;right:0;top:5px;height:68px;border-radius:18px;background:#527ab2}
.zx-hud-card{position:absolute;left:30px;right:4px;top:0;height:68px;border:1px solid #cedeea;border-radius:18px;background:linear-gradient(110deg,#ffffff 0%,#f0f7ff 100%)}
.zx .zx-profile-art{position:absolute;left:0;top:-5px;width:80px;height:84px}
.zx-hud-identity{position:absolute;left:85px;right:15px;top:7px;display:flex;flex-direction:column;gap:7px;min-width:0}
.zx-hud-name-row{display:flex;align-items:center;justify-content:flex-start;gap:7px;height:20px}
.zx-hud-name{font-size:16px;line-height:1.2;white-space:nowrap;color:#303b58}
.zx-hud-element{display:flex;align-items:center;justify-content:center;width:23px;height:17px;border-radius:9px;font-size:11px;line-height:1;color:#fff;background:#e69a5e}
.zx-hud-water .zx-hud-element{background:#5aa8df}.zx-hud-wood .zx-hud-element{background:#76ab81}
.zx-hud-level{position:absolute;left:15px;top:72px;width:50px;height:20px;display:flex;align-items:center;justify-content:center;gap:0;border:2px solid #fffdf7;border-radius:11px;background:#3c4767;color:#fffdf7;font-size:12px;line-height:1;font-weight:700;white-space:nowrap}
.zx .zx-player-health{position:absolute;left:0;top:0;width:88px;height:20px;pointer-events:none}
.zx .zx-minimap{position:absolute;right:0;top:5px;width:96px;height:96px;border:0;border-radius:0;background:transparent;box-shadow:none;pointer-events:auto;zoom:1}
.zx-hud-meta{position:absolute;bottom:3px;left:14px;right:14px;display:flex;align-items:center;gap:7px;height:19px;padding:0 8px;border-radius:9px;background:#fffdf5c9}
.zx-hud-score{font-size:11px;line-height:1.2;color:#405270;white-space:nowrap}.zx small.zx-hud-stage{flex:none;padding:1px 6px;border-radius:8px;background:#e3edf8;font-size:10px;line-height:1.3;color:#4f76a4;white-space:nowrap}
.zx-hud-clock,.zx-hud-gold{width:50px;min-width:50px;max-width:50px;white-space:nowrap;flex:none}
.zx small.zx-hud-stage[data-tier="1"]{background:#d54e50;color:#fff}.zx small.zx-hud-stage[data-tier="2"]{background:#8263ae;color:#fff}
html.zixing .zx-hud-pause{position:absolute;right:2px;top:109px;width:40px;min-height:40px;height:40px;border:2px solid #fffdf7;border-radius:50%;background:#eef4ff;box-shadow:0 3px 0 #8da6ca;color:#6176a3}
.zx-loadout{position:absolute;inset:0;pointer-events:none}
.zx-hud-supplies{height:29px;display:flex;align-items:flex-start}
.zx-inventory-items{display:flex;flex-wrap:nowrap;gap:4px;pointer-events:none}
.zx-hud-supplies .zx-loadout-more{min-height:26px;padding:0;font-size:9px;pointer-events:auto;box-shadow:none;color:#405270;background:#e1eaf4}
.zx-mini-slot{position:relative;display:flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;background:#d9dfe4;border:1px solid #fff;border-radius:50%}
.zx-mini-slot.filled{background:#e6edf3}.zx-mini-slot>.zx-loadout-icon{width:20px;height:20px;object-fit:contain}
.zx-slot-count{position:absolute;right:-1px;bottom:-3px;min-width:10px;padding:0 2px;border-radius:5px;background:#fffdf3e6;font-size:9px;line-height:1.1;color:#28233c;text-align:center}
.zx-skill-slots{position:absolute;left:18px;bottom:26px;display:flex;flex-direction:column;gap:14px}
.zx-skill-slot{position:relative;display:flex;align-items:center;justify-content:center;flex:none;width:42px;height:42px;background:#e0e1d8d9;border:1px solid #555e53;border-radius:50%;overflow:visible}
.zx-skill-slot.locked{background:#e0e1d8c9}.zx-skill-slot>.zx-loadout-icon{width:28px;height:28px;object-fit:contain}
.zx-slot-level{position:absolute;right:-2px;bottom:-3px;min-width:15px;height:18px;padding:0 2px;background:#fffdf0e6;border-radius:8px;font-size:14px;line-height:1.2;text-align:center;color:#343b32}
html.zixing .zx-choice.fire.on{border-color:#d84840;border-width:2px;background:#fff1ed;box-shadow:0 3px 0 #d9988f}
.zx-battle-map{align-items:center;padding:18px 16px;gap:12px;animation:none;transition:none;transform:none}
.zx-battle-map-frame{position:relative;flex:none;align-self:center}
html.zixing .zx-battle-map-art{position:absolute;inset:0;display:block;width:100%;height:100%}
.zx-battle-map>small{text-align:center;font-size:11px;line-height:1.5}
.zx-battle-map>.zx-button{width:100%}
.zx-modal-wrap.zx-pause-screen{padding:0;align-items:stretch;background:var(--paper)}
.zx-modal.zx-pause{width:100%;max-width:none;height:100%;max-height:100%;border:0;border-radius:0;box-shadow:none;padding:0;gap:0;overflow:hidden;background:var(--paper)}
.zx-pause-body{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;gap:16px;padding:26px 24px 18px}.zx-pause-body>*{flex-shrink:0}
.zx-pause-body>small:first-child{align-self:center;text-align:center;font-size:14px;font-weight:700}.zx-pause-body>h2{align-self:center;font-size:24px;margin-bottom:8px}
.zx-pause-footer{display:flex;flex-direction:column;flex:none;gap:16px;padding:16px 24px 20px;background:var(--paper)}
html.zixing .tc.zx-touch .tc-ultb.ult{background:repeating-linear-gradient(135deg,#986bf0 0px,#986bf0 10px,#ab83f5 10px,#ab83f5 20px)!important;border:4px solid #f4eaff;box-shadow:0 3px 0 #7d45d4}
html.zixing .tc.zx-touch .tc-ultb.ready{border-color:#fff;background:repeating-linear-gradient(135deg,#9561ed 0px,#9561ed 10px,#ae7ff6 10px,#ae7ff6 20px)!important}
@media(max-width:350px){.zx-hud-top{left:10px;right:10px}.zx-hud-location{left:10px;padding:0 6px;gap:4px}.zx-hud-area{font-size:9px}.zx-hud-location>.zx-icon{width:10px;height:10px}.zx-hud-location .zx-hud-stage{font-size:8px;padding:1px 5px}.zx-hud-counter{min-width:78px;padding:0 6px;gap:4px}.zx-hud-counters{gap:6px}.zx-hud-clock,.zx-hud-gold{font-size:14px}.zx-hud-profile{right:94px}.zx .zx-minimap{width:84px;height:84px}.zx .zx-profile-art{width:68px;height:72px;top:0}.zx-hud-identity{left:73px;right:13px;top:8px}.zx-hud-name{font-size:14px}.zx-hud-level{left:12px;top:72px;width:44px;height:20px;font-size:11px}.zx-hud-meta{left:12px}html.zixing .zx-hud-pause{top:97px}.zx-hud-supplies .zx-loadout-more{min-height:24px}.zx-mini-slot{width:24px;height:24px}.zx-mini-slot>.zx-loadout-icon{width:18px;height:18px}.zx-home-top{padding:12px 20px}.zx-pause-body{padding:20px 18px 12px;gap:12px}.zx-pause-footer{padding:12px 18px 16px;gap:12px}}
`;
