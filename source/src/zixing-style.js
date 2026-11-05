// Shared by the browser and the native Canvas stylesheet compiler.
export const zixingStyle = `
.zx{--ink:#29263c;--muted:#65716d;--paper:#f8f5ea;--purple:#8050d6;--line:#d9ded2;color:var(--ink);font-size:14px;font-weight:500;line-height:1.5;text-shadow:none;letter-spacing:0}
.screen.zx{position:absolute;inset:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;background:var(--paper);padding:0;overflow:hidden;backdrop-filter:none;pointer-events:auto}
html.touch .screen.zx{padding:0;overflow-y:hidden}
.screen.zx-home,html.touch .screen.zx-home{overflow-y:auto}
.zx canvas{position:static;inset:auto;pointer-events:none}
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
.zx-home-top{padding:14px 24px 0;flex:none}.zx-home-top small{font-size:14px;font-weight:700;color:#615477}
.zx-gear{height:44px;width:44px;border:1px solid #e5dfed;border-radius:24px;background:#fff;font-size:22px}
.zx-button.zx-gear{min-height:44px;padding:0;box-shadow:0 3px 0 #d9d2e8}.zx-home-top .zx-gear{width:44px}
.zx-home-art{position:relative;flex:none;height:calc(100vw * .76923);width:100%;margin-top:0}.zx-forest{width:100%;height:150px;flex:none;border-radius:14px}
.zx-home-art canvas{width:100%;height:100%}.zx-home-body{flex:none;overflow:visible;overflow-y:visible;padding-top:12px;padding-bottom:24px;gap:12px}
.zx-home-copy{display:flex;flex-direction:column;gap:5px;text-align:center;align-items:center;margin-top:0}.zx-home-copy h2{font-size:24px}.zx-home-copy p{font-size:15px;font-weight:700;color:#615477}
.zx-home-types{display:flex;justify-content:center;gap:24px;margin-top:4px}.zx-home-types .zx-row{gap:6px;font-size:14px;font-weight:700;color:#615477}.zx-home-types .zx-glyph{width:28px;height:30px;font-size:26px;border-radius:8px}
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
.zx-upgrade{gap:12px;padding-top:26px;padding-bottom:24px}
.zx-button.zx-upgrade-stats{align-self:flex-end;justify-content:flex-end;width:auto;min-height:32px;padding:0;gap:6px;margin-top:-4px;background:transparent;border:0;border-radius:0;box-shadow:none;color:#65577b;font-size:14px}
.zx-upgrade .zx-offer{min-height:104px;padding:14px;border:1px solid #c6cfc3;border-radius:14px;background:#fff;box-shadow:none;text-align:left;color:var(--ink)}
.zx-upgrade .zx-offer.featured{background:#f3f0f9;border-color:#9180ad}
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
.zx-hud{position:absolute;inset:0;pointer-events:none;z-index:5;color:#30383c;font-size:13px}.zx-hud-bar{position:absolute;left:16px;right:16px;top:8px;display:flex;gap:9px;align-items:center}.zx-hud-health{flex:1;display:flex;flex-direction:column;gap:3px;padding:6px 9px;background:#ffffffe8;border-radius:12px}.zx-hud-track{height:5px;background:#ded9e5;border-radius:4px}.zx-hud-fill{height:5px;background:#50bb76;border-radius:4px}.zx-hud-xp{height:3px;background:#56a4dc}.zx-hud-meta{position:absolute;left:18px;right:18px;top:76px;display:flex;justify-content:space-between;gap:12px}.zx-hud-bar .zx-glyph{width:42px;height:44px;font-size:34px}.zx-hud-pause{width:40px;height:40px;border:0;border-radius:22px;background:#ffffffe8;font-size:20px;pointer-events:auto}
.zx-slot{display:flex;justify-content:center;gap:6px;background:#f4f0fa;border:6px solid #5c536f;border-radius:12px;padding:8px}.zx-slot b{display:flex;justify-content:center;align-items:center;flex:1;height:80px;font-size:48px;background:#fff;color:#5c536f;border-radius:6px}
.zx-intro{position:absolute;left:24px;right:24px;top:130px;padding:14px;background:#ffffffee;border:1px solid #e5dfee;border-radius:14px;display:flex;flex-direction:column;gap:4px;align-items:center;pointer-events:none;z-index:10}
.zx-dark .zx-card,.zx-dark .zx-modal,.zx-dark .zx-choice,.zx-dark .zx-difficulty,.zx-dark .zx-setting{background:#363047;color:#eee9f8;border-color:#564b68}
.zx-dark .zx-note{color:#c4bbd4}.zx-dark .zx-tabs{background:#42394f}
.zx-dark .zx-home-copy p,.zx-dark .zx-home-types .zx-row{color:#d6ccea}
.zx-dark .zx-tab{color:#eee9f8}.zx-dark .zx-tab.on{color:#643799}
.zx-dark .zx-link,.zx-dark .zx-button:not(.primary):not(.purple):not(.danger):not(.zx-buy){background:#484056;color:#eee9f8!important;border-color:#746285}
.zx-dark .zx-build-tag{background:#49405d;color:#ece5fa}.zx-dark .zx-pause-attribute-title{color:#9cc5ff}.zx-dark .zx-pause-attribute-note{color:#d4c9e7}.zx-dark .zx-offer.featured{background:#49405d!important;border-color:#9c89c0!important}.zx-dark .zx-upgrade-stats{background:transparent!important}
html.zixing #hud .hud-tl,html.zixing #hud .under,html.zixing #hud .hud-party,html.zixing #hud .hud-top,html.zixing #hud .hud-tr,html.zixing #hud .hud-bl,html.zixing #hud .hud-br,html.zixing #hud .lock-hint{display:none!important}
html.zixing .zx-hud{z-index:50}
html.zixing .zx-hud-pause{flex:none;width:40px;min-height:40px;height:40px;padding:0;border:0;box-shadow:none}
html.zixing .zx-hud-meta{top:64px;padding:7px 10px;background:#ffffffe0;border-radius:10px}
.zx-hud-meta>.zx-col:last-child{align-items:flex-end}
.zx-hud-items{position:absolute;left:18px;right:18px;top:126px;font-size:11px;color:#394632;background:#ffffffbb;border-radius:8px;padding:4px 8px}.zx-hud-items:empty{display:none}
html.zixing .tc-aim{top:auto;right:18px;bottom:210px}
html.zixing .tc-ultb.ult{right:18px;bottom:104px;width:76px;height:76px}
html.zixing .tc-act{bottom:264px}
html.zixing .tc-pause{display:none!important}
html.zixing .modal:not(.zx-modal-wrap){background:#fff;color:#29263c;border:1px solid #e0d8ec;border-radius:22px;box-shadow:none;backdrop-filter:none}
html.zixing .modal>h1{background:transparent;color:#29263c;transform:none;text-shadow:none;font-size:24px;border:0}
html.zixing .tc-ultb.ult{background:#9262df;border:3px solid #eee4ff;box-shadow:0 0 0 2px #b497de}
html.zixing .ult-core{background:transparent}.zx-ult-label{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700;line-height:1.3}
html.zixing .tc-ultb .ult-nm,html.zixing .tc-ultb kbd{display:none}
html.zixing .tc .tc-ultb.ult{background:repeating-linear-gradient(135deg,#8855df 0px,#8855df 10px,#a077ec 10px,#a077ec 20px)!important}
html.zixing .tc .tc-ultb .ult-core,html.zixing .tc .tc-ultb .ult-ring{background:transparent!important}
html.zixing .tc .tc-jump,html.zixing .tc .tc-dash,html.zixing .tc .tc-lock,html.zixing .tc .tc-aim{display:flex;align-items:center;justify-content:center;background:#ffffffe0;border:1px solid #ddd5e9;color:#67587b;box-shadow:none}
html.zixing .tc .tc-aim>span{position:static;transform:none;font-size:12px;line-height:1;color:#67587b}
html.zixing .tc.zx-touch:not(.zx-extra-controls) .tc-jump,html.zixing .tc.zx-touch:not(.zx-extra-controls) .tc-dash,html.zixing .tc.zx-touch:not(.zx-extra-controls) .tc-lock,html.zixing .tc.zx-touch:not(.zx-extra-controls) .tc-aim{display:none!important}
html.zixing .tc.zx-touch .tc-stick{left:50%;top:auto;bottom:calc(28px * var(--tcs,1));width:calc(120px * var(--tcs,1));height:calc(120px * var(--tcs,1));margin:0;transform:translateX(-50%);opacity:1;border:8px solid #8d879329;background:#756b811c;box-shadow:none;transition:none}
html.zixing .tc.zx-touch .tc-stick>i{width:calc(50px * var(--tcs,1));height:calc(50px * var(--tcs,1));margin:calc(-25px * var(--tcs,1));background:#fdfcfe;border:1px solid #fff;box-shadow:none;z-index:2}
.zx-stick-tick{position:absolute;background:#8d879360;pointer-events:none}.zx-stick-tick.vertical{left:50%;top:8px;width:1px;height:10px}.zx-stick-tick.horizontal{left:8px;top:50%;width:10px;height:1px}
html.zixing .tc.zx-touch .tc-ultb.ult{right:18px;bottom:calc(160px * var(--tcs,1));width:calc(84px * var(--tcs,1));height:calc(84px * var(--tcs,1));zoom:1}
html.zixing .tc.zx-touch .zx-ult-label{width:100%;height:100%;text-align:center;font-size:calc(18px * var(--tcs,1))}
html.zixing .tc.zx-touch .tc-jump{left:18px;right:auto;bottom:28px;width:44px;height:44px}
html.zixing .tc.zx-touch .tc-dash{right:18px;bottom:28px;width:44px;height:44px}
html.zixing .tc.zx-touch .tc-lock{left:18px;right:auto;bottom:88px}
html.zixing .tc.zx-touch .tc-aim{right:18px;bottom:calc(268px * var(--tcs,1))}
html.zixing .tc.zx-touch .tc-act{left:18px;right:auto;bottom:calc(200px * var(--tcs,1));max-width:55%}
@media(max-width:350px){html.zixing .tc.zx-touch .tc-stick{width:calc(108px * var(--tcs,1));height:calc(108px * var(--tcs,1))}html.zixing .tc.zx-touch .tc-ultb.ult{width:calc(76px * var(--tcs,1));height:calc(76px * var(--tcs,1))}}
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
.zx-build-tag{background:#e8eee1;color:#506c61}.zx-upgrade .zx-offer{background:#fffdf6;border-color:#bdc9b8}.zx-upgrade .zx-offer.featured{background:#ecf3df;border:2px solid #92ac8b}
.zx-slot{background:#d9e2d6;border-color:#748c83}.zx-slot b{color:#455e5f;background:#fffdf4}
.zx-intro{background:#fffdf6ee;border:1px solid #97b19f;border-radius:10px;top:178px;color:#334d4b}
html.zixing .zx-hud{color:#25243c}
.zx-hud-top{position:absolute;top:8px;left:8px;right:8px;display:flex;align-items:center;gap:7px;padding:5px 8px;min-height:48px;border:1px solid #b0c6b8;border-radius:13px;background:#fffffff2}
.zx-hud-top>.zx-col{gap:0;min-width:0}.zx-hud-top>.zx-col:first-child{flex:1.2}.zx-hud-top>.zx-col:nth-child(3){flex:.7;align-items:center;text-align:center}
.zx-hud-area{font-size:15px;line-height:1.3;color:#29263c}.zx-hud-stage{font-size:10px;line-height:1.5;color:#587663}
.zx-hud-clock{display:flex;align-items:center;justify-content:center;flex:1;min-width:82px;height:36px;border-radius:22px;background:#322a50;color:#fff;font-size:27px;line-height:1.1;font-weight:800}
.zx-hud-gold{font-size:16px;line-height:1.3;color:#29263c}.zx-hud-top small{font-size:9px;line-height:1.3}
html.zixing .zx-hud-top .zx-hud-pause{width:29px;min-height:32px;height:32px;border-radius:10px;background:#e8eee2;color:#475960;font-size:17px}
.zx-hud-progress{position:absolute;top:5px;left:14px;right:14px;height:4px;background:#d6e0d4;border-radius:4px;overflow:hidden}.zx-hud-progress .zx-hud-xp{height:4px;background:#7bc58b;border-radius:4px}
.zx-hud-profile{position:absolute;left:11px;top:70px;width:234px;height:85px;display:flex;align-items:center;gap:8px;padding:5px 12px 5px 4px;background:#fffffff2;border:1px solid #a9bfc0;border-right:5px solid #699cb9;border-bottom:4px solid #699cb9;border-radius:19px}
.zx .zx-hud-portrait{width:76px;height:76px;border:3px solid #fff!important;border-radius:42px!important;background:#bdeaf0!important;box-shadow:0 0 0 3px #59acd8}
.zx-hud-identity{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}.zx-hud-identity>.zx-row{justify-content:flex-start;gap:9px;font-size:15px;font-weight:800}
.zx-hud-element{padding:0 7px;border-radius:10px;background:#65b9d9;color:#fff;font-size:10px;line-height:1.5}.zx-hud-level{font-size:11px;color:#332a50;line-height:1.2}.zx-hud-hp{font-size:9px;color:#6c7777;line-height:1.1}
.zx-hud-track{height:5px;background:#dfe1dd;border-radius:4px;overflow:hidden}.zx-hud-fill{height:5px;background:#e9877e;border-radius:4px}
.zx-hud-items{left:16px;right:16px;top:162px;background:#fffdf4d9;color:#51685d}
html.zixing .tc.zx-touch .tc-stick{border:6px solid #fffef252;background:#567b7d1c}
html.zixing .tc.zx-touch .tc-stick>i{background:#fffdf3cf;border:2px solid #91b7b3}
html.zixing .tc.zx-touch .tc-ultb.ult{background:linear-gradient(135deg,#7f9dab 0%,#526c8e 100%)!important;border:3px solid #f9f5df}
@media(max-width:350px){.zx-hud-top{gap:4px;padding-left:6px;padding-right:6px}.zx-hud-area{font-size:12px}.zx-hud-clock{font-size:23px;min-width:68px}.zx-hud-gold{font-size:13px}.zx-hud-profile{width:215px;height:78px}.zx .zx-hud-portrait{width:68px;height:68px}.zx-hud-identity>.zx-row{font-size:13px}}
`;
