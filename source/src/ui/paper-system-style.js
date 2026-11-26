// One source of truth for system controls. Gameplay sprites and canvases are untouched.
export const paperSystemStyle=`
.zx{--ink:var(--paper-ink);--muted:#71788E;--paper:var(--paper-paper);--purple:#567AC0;--line:#CBD4E6;color:var(--paper-ink)}
.screen.zx,.screen.zx-collection{background:var(--paper-navy);color:var(--paper-ink);padding:0 10px!important;z-index:80}
.screen.zx>.zx-header{background:transparent;border:0;padding:14px 12px 12px;color:var(--paper-paper);min-height:78px}

.screen.zx>.zx-header small{font-size:12px;line-height:18px;color:#DBE4F6;padding:0 8px}
.screen.zx>.zx-body{background:var(--paper-paper);padding:14px;gap:12px;border:0;border-radius:0;scrollbar-width:none}
.screen.zx>.zx-footer{background:transparent;padding:12px 8px 16px;gap:10px;border:0}
.screen.zx>.zx-footer.paper-single-back{background:transparent;align-items:flex-start;padding-left:8px}
.paper-footer-row{display:flex;flex-direction:row;align-items:center;gap:10px;width:100%}
.paper-footer-row>.zx-button{flex:1;min-width:0}
.paper-footer-row>.zx-button.primary,.zx-collection .zc-actions>.zc-primary{height:53px;align-self:center}
.zx .zx-button,.zx-collection .zc-btn,html.zixing .zx-review-button{border:0;border-radius:0;box-shadow:none;background:linear-gradient(180deg,var(--paper-paper),#DFE6F5);color:var(--paper-ink);font-size:17px;font-weight:700;line-height:24px;min-height:48px;padding:10px 12px}
.zx .zx-button.primary,.zx .zx-button.purple,.zx-collection .zc-primary,html.zixing .zx-review-button.primary{background:linear-gradient(180deg,#6193D8,#496EB4);color:var(--paper-paper);font-size:17px;line-height:24px}
.zx .zx-button.danger,html.zixing .zx-review-button.danger{background:linear-gradient(180deg,var(--paper-tabStart),#BD535C);color:var(--paper-paper)}
.coop-actions,.paper-back,.paper-back-art,.paper-dismiss-dock,.paper-dismiss-button,.paper-dismiss-art{--paper-nav-width:72px;--paper-nav-height:53px}
.zx .paper-action.paper-back,.zx-collection .zc-actions>.zc-back.paper-back,html.zixing .zx-review-dialog .paper-back{display:flex;align-items:center;justify-content:center;width:var(--paper-nav-width);min-width:var(--paper-nav-width);max-width:var(--paper-nav-width);flex:none;height:var(--paper-nav-height);padding:0!important;border:0!important;background:transparent!important;box-shadow:none}
.paper-back>.paper-back-art,.zx-collection.zc-library .zc-back>.paper-back-art,html.zixing .zx-review-dialog .paper-back>.paper-back-art{display:block;flex:none;width:var(--paper-nav-width);height:var(--paper-nav-height);object-fit:contain}
.zx button:disabled,html.zixing .zx-review-button:disabled{opacity:.52}
.zx .zx-tabs,.zx .zx-subtabs,.zx .zc-filters{background:transparent;border:0;border-radius:0;padding:0;gap:1px;min-height:40px}
.zx .zx-tab,.zx .zx-subtab,.zx .zc-filter{background:#D6DFEF;border:0;border-radius:0;box-shadow:none;min-height:40px;padding:7px 3px;color:var(--paper-ink);font-size:15px;line-height:22px;font-weight:700}
.zx .zx-tab.on,.zx .zx-subtab.on,.zx .zc-filter.active{background:var(--paper-tabStart);color:var(--paper-paper);font-size:15px;font-weight:700;border:0;box-shadow:none}
.zx .zx-card,.zx .zc-panel,.zx .zx-difficulty,.zx .zx-choice,.zx .zc-look,.zx .zx-review-companion,.zx .zx-review-empty,.zx .zx-review-reward{background:#EAEDF7;color:var(--paper-ink);border:0;border-radius:0;box-shadow:none}
.zx .zx-difficulty.on,.zx .zx-choice.on,.zx .zc-look.selected{background:#E2EAF8;border:2px solid #5B85CC}
.zx .zx-modal,html.zixing .zx-modal.zx-review-dialog{background:var(--paper-paper);color:var(--paper-ink);border:0;border-radius:0;box-shadow:none}
.zx-modal h2,html.zixing .zx-review-dialog h1{font-size:22px;line-height:30px;color:var(--paper-ink)}
.zx .zx-note,.zx .zc-note,.zx .zx-review-note,.zx .zx-review-copy,.zx-collection small{color:#71788E}
.zx .zx-wallet{background:#567AC0;border:0;border-radius:0;box-shadow:none;color:var(--paper-paper)}
.zx .zx-buy{width:72px;min-width:72px;min-height:48px;height:48px;padding:4px;font-size:17px;line-height:22px;background:#E0E9F7;color:var(--paper-ink)!important;border:0;border-radius:0;box-shadow:none}
.zx .zx-buy small{font-size:11px;line-height:15px}.zx .zx-buy.poor{background:#DEE0E9}
.zx .zx-pips i.on{background:#6193D8}
.zx .zx-home-top{background:transparent;padding:8px 12px}.zx .zx-home-top>.zx-row{justify-content:flex-start}
.zx .zx-home-dock{background:var(--paper-paper);border:0;border-radius:0;padding:14px}
.zx .zx-home-start{font-size:20px;line-height:28px;background:linear-gradient(180deg,var(--paper-tabStart),#BD535C);color:var(--paper-paper)}
.zx .zx-home-lab{background:#E1E9F7;color:var(--paper-ink);border:0;border-radius:0;box-shadow:none}
.zx .zx-home-lab b{font-size:17px}.zx .zx-home-lab small{font-size:11px}.zx .zx-home-lab .zx-glyph{display:none}
.zx .zx-home-foot .zx-button.zx-plain{color:var(--paper-ink)}
.zx .zx-button.zx-plain,.zx .zx-button.zc-text{background:transparent;box-shadow:none;border:0;font-size:14px}
.zx .zx-home-copy p,.zx .zx-home-types .zx-row{color:#71788E}
.zx .zc-summary{background:transparent;border:0;box-shadow:none;border-radius:0;align-items:center;min-height:60px;padding:6px 8px}
.zx .zc-summary-name{justify-content:center;gap:2px}.zx .zc-summary-name>b{line-height:22px}.zx .zc-summary-name>small{line-height:18px}
.zx .zc-detail-tabs{gap:1px}
.zx .zc-stat{padding:7px 3px;border-bottom:1px solid #D3DAE9}
.zx .zc-unlock-steps{color:#71788E}.zx .zc-unlock-condition{background:#E7ECF8;border:0;border-radius:0}
.zx .zx-first-batch-upgrade{background:transparent;border:0}
.zx .zx-first-batch-upgrade .zx-upgrade-card{border-radius:0}
.zx .zx-first-batch-upgrade .zx-upgrade-name{font-size:15px;line-height:19px}
.zx .zx-first-batch-upgrade .zx-upgrade-reroll{font-size:17px;line-height:24px;min-height:48px}
.screen.zx.zc-library>.zx-body{background:transparent;padding:0;gap:0}
.screen.zx.zc-library>.zx-header{padding:0 10px 36px;background:transparent;min-height:0}

.screen.zx.zc-library>.zx-header small{font-size:14px;line-height:18px;padding:0;margin:5px 0 0 11px}
.screen.zx.zc-library>.zx-footer{padding:10px 12px 12px}
@media(max-height:660px){
.screen.zx.zc-library>.zx-header{padding-bottom:29px}
.screen.zx.zc-library>.zx-footer{padding:6px 8px 9px}
}
.zx.zc-library .zc-filter{font-size:15px;line-height:22px;padding:7px 2px}
.zx.zc-library .zc-primary{min-height:48px;font-size:17px;line-height:24px}
.zx .zx-loading-content{color:var(--paper-ink)}
.zx .zx-switch{background:#CAD2E1;border-radius:3px}.zx .zx-switch.on{background:#6193D8}.zx .zx-switch i{background:var(--paper-paper);border-radius:2px}
.zx .zx-slot,.zx .zx-saved-metrics,.zx .zx-saved-seal,.zx .zx-pause-attributes{background:#E6EBF6;border-color:#B7C6E2;border-radius:3px;color:var(--paper-ink)}
.zx .zx-slot b,.zx .zx-saved-metric>b,.zx .zx-saved-message{background:transparent;color:var(--paper-ink)}
.zx .zx-saved-note,.zx .zx-saved-metric>span{color:#71788E}
.zx .zx-saved-reward{background:#E1EAF7;border-color:#ABBEDF;color:#465E86;border-radius:2px}
.zx .zx-build-tag{background:#E0E8F7;color:#465E86}
html.zixing .zx-review-dialog .btn{background:#E5EBF6;color:var(--paper-ink);border:0;border-radius:0;box-shadow:none;font-size:17px;line-height:24px;min-height:48px}
html.zixing .zx-review-dialog .btn:disabled{background:#E1E4EC;color:#71788E;opacity:.52}
html.zixing .zx-review-dialog .item-row,html.zixing .zx-review-dialog .mp-nums>span{background:#EAEEF7;border:0;border-radius:0;color:var(--paper-ink)}
html.zixing .zx-review-dialog .help,html.zixing .zx-review-dialog .mp-nums i{color:#71788E}
html.zixing .zx-review-dialog .card{border-radius:0;box-shadow:none}
.zx .zx-review-recipe{background:#EAEEF7;border-color:#B7C6E2;border-radius:0}
.zx .zx-review-tag{background:#E0E8F7;color:#465E86;border-radius:2px}
.zx .zx-review-check{border-color:#849ECB;border-radius:2px}.zx .zx-review-check.on{background:#567AC0;color:var(--paper-paper)}
.zx .paper-action,html.zixing .zx-review-dialog .paper-action{font-size:20px!important;font-weight:700!important;line-height:26px!important;min-height:48px!important;border-radius:0;box-shadow:none}
.zx .paper-action.primary,.zx .paper-action.zc-primary,.zx .paper-action.purple,html.zixing .zx-review-dialog .paper-action.primary{background:linear-gradient(180deg,var(--paper-blueStart),var(--paper-blueEnd))}
.zx .paper-action.primary,.zx .paper-action.purple,.zx .paper-action.danger,.zx .paper-action.zc-primary{color:var(--paper-paper)!important}
.zx .paper-action.paper-back{color:var(--paper-ink)!important}
.zx .zx-options{background:#E3E9F4;border-radius:2px;gap:3px}.zx .zx-option{border-radius:1px;color:var(--paper-ink);min-height:36px;font-size:12px}.zx .zx-option.on{background:#567AC0;color:var(--paper-paper)}
.zx .zx-banner,.zx .zx-item-note{background:#E5EBF8;border:0;border-radius:0;color:#465E86}
.zx .zx-stat-grid strong{color:#567AC0}.zx .zx-item-copy h3{color:var(--paper-ink)}.zx .zx-item-description,.zx .zx-item-note{color:#71788E}
.zx .zx-loading-title{color:var(--paper-ink)}
.screen.zx.zx-collection>.zx-body{overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.screen.zx.zx-collection.zc-library>.zx-body{overflow:visible;overflow-y:visible;overflow-x:visible}
.zx .zc-stat{padding:3px;border-bottom:1px solid #D3DAE9}
html.zixing .zx-review-dialog .card,html.zixing .zx-review-dialog .card:disabled{background:#F0F1F7;color:var(--paper-ink);border-color:#B3C1D9;border-radius:0}
html.zixing .zx-review-dialog .card .top{background:var(--rc)!important;border-radius:0}
html.zixing .zx-review-dialog .card .bd{background:#F0F1F7;color:var(--paper-ink)}
html.zixing .zx-review-dialog .card h3{color:var(--paper-ink);font-size:16px;line-height:22px}
html.zixing .zx-review-dialog .card p,html.zixing .zx-review-dialog .card .cap{color:#71788E;font-size:14px;line-height:20px}
.zx-footer>.zx-row{width:100%;min-width:0;align-items:stretch}
.zx .zx-summary-grid b,.zx .zx-pause-stats b{font-size:17px;line-height:24px;white-space:nowrap}
.zx-footer.paper-single-back>.zx-note{color:#CFD9EC}
@media(max-width:350px){.screen.zx>.zx-body{padding:10px;gap:8px}.screen.zx>.zx-header{padding:8px 8px;min-height:64px}.zx .zx-tab,.zx .zx-subtab,.zx .zc-filter{font-size:15px}.zx .zx-home-dock{padding:10px}.zx .zx-home-copy p{font-size:13px}}

/* Explicit component geometry; no page-specific copies of button typography. */
.screen.zx>.zx-header{position:relative;min-height:86px;padding:0 10px 12px;gap:0}
.screen.zx.paper-menu-page .zc-header-cutout{position:absolute;left:-10px;right:auto;top:0;width:100vw;height:87px;object-fit:fill;pointer-events:none}
.screen.zx.paper-menu-page>.zx-header{border-top:0;padding-left:10px;padding-top:0}
.paper-menu-page .paper-title-label{position:relative;display:flex;flex-direction:row;align-self:flex-start;max-width:100vw;height:46px;flex:none;margin:5px 0 0 -20px}
.screen.zx .paper-title-label>.zc-title-ribbon{position:absolute;inset:auto;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.screen.zx .paper-title-label>h1{position:relative;display:flex;align-items:center;justify-content:flex-start;height:44px;margin:0;padding:0 39px 0 26px;white-space:nowrap;font-size:32px;font-weight:700;line-height:38px;color:var(--paper-paper)}

.screen.zx>.zx-header small{font-size:12px;line-height:18px;padding:0;margin-top:5px;color:var(--paper-paper)}
.screen.zx>.zx-body{padding:14px 15px;gap:12px}
.screen.zx>.zx-footer{margin-top:6px;padding:12px 14px 14px}
.screen.zx>.zx-footer.paper-single-back{margin-top:8px;padding:2px 6px 10px}
.zx .paper-menu-symbol{flex:none;object-fit:contain}
.screen.zx.zx-home-fixed{padding:0 10px!important}
.zx-home-fixed>.zx-home-top{position:absolute;left:4.8vw;top:0;width:50px;height:44px;min-height:44px;padding:0;background:transparent;z-index:4}
.zx-home-fixed .zx-home-top>.zx-row{justify-content:flex-start}
.zx-home-fixed .zx-home-top .zx-gear{width:max(44px,11.1vw);height:max(44px,11.1vw);min-height:44px;padding:0;border:0;background:transparent}
.zx-home-fixed .zx-home-top .zx-gear>.zx-paper-icon{width:11.1vw;height:11.1vw;flex:none}
.zx-home-fixed>.zx-home-visual{margin:0 -10px;overflow:hidden;flex:1;min-height:160px}
.zx-home-fixed .zx-home-visual>canvas{object-fit:cover;width:100%;height:100%}
.zx-home-fixed>.zx-home-dock{position:relative;flex:none;background:transparent;height:auto;padding:19px 11px 12px;gap:10px;justify-content:flex-start;margin:0;overflow:visible}
.zx-home-fixed .zx-home-copy{gap:3px}
.zx-home-fixed .zx-home-copy h2{font-size:24px;line-height:32px;color:var(--paper-ink)}
.zx-home-fixed .zx-home-copy p{font-size:14px;line-height:21px;color:var(--paper-ink)}
.zx-home-fixed .zx-home-types{min-height:50px;gap:10px;margin:0;display:flex}
.zx-home-fixed .zx-home-types .zx-row{font-size:13px;line-height:20px;gap:1px;color:var(--paper-ink)}
.zx-home-fixed .zx-home-types .zx-home-role{display:flex;align-items:center;justify-content:center;text-align:center;width:100%;height:22px;line-height:20px;flex:none;white-space:nowrap}
.zx-home-fixed .zx-home-types .zx-glyph{width:28px;height:29px;background:transparent;border:0}
.zx-home-fixed .zx-home-start{height:58px;min-height:58px;background:linear-gradient(180deg,var(--paper-blueStart),var(--paper-blueEnd))}
.zx-home-fixed .zx-home-secondary{display:flex;flex-direction:row;gap:10px;width:100%}
.zx-home-fixed .zx-home-secondary>.zx-home-entry{display:flex;position:relative;align-items:center;justify-content:center;flex-direction:row;width:auto;min-width:0;flex:1;height:54px;min-height:54px;padding:0;gap:8px;background:transparent;border:0;box-shadow:none;color:#21203B}
.zx-home-entry>.paper-entry-face{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx-home-entry>.paper-entry-content{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;padding-bottom:3px;pointer-events:none}
.paper-entry-content>.paper-menu-symbol{width:38px!important;height:38px!important;flex:none}
.paper-entry-content>.paper-button-divider{width:1px;height:26px;flex:none;background:#ADB0CE}
.paper-entry-content>.paper-entry-label{flex:none;font-weight:700;font-size:17px;line-height:24px;white-space:nowrap}
.zx-home-fixed .zx-home-foot{height:44px;min-height:44px;justify-content:center;margin:0;padding:0}
.zx-home-fixed .zx-home-foot>.zx-button.zx-plain{height:44px;min-height:44px;min-width:120px;padding:0;color:#D9E4F4;font-size:14px;line-height:20px}
.zx .zx-hud-supplies .zx-loadout-more{width:26px;height:26px;min-height:26px;padding:0;font-size:9px;line-height:12px;border:0}
.zx .paper-info-hero{position:relative;display:flex;flex:none;min-height:104px;height:104px;max-height:104px;align-items:center;justify-content:flex-start;gap:13px;padding:0 15px 0 5px;margin:0 0 3px}
.zx .paper-info-hero .zc-copy{flex:1;gap:4px}
.zx .paper-info-hero h2{font-size:20px;line-height:26px}
.zx .paper-info-hero .zx-col{flex:1;gap:4px;text-align:left;align-items:flex-start}.zx .paper-info-hero .zx-col>b{font-size:18px;line-height:25px}.zx .paper-info-hero .zc-copy{text-align:left;align-items:flex-start}
.zx .paper-info-hero>.paper-portrait{width:92px;height:104px;flex:none;padding:6px;min-height:0}
.zx .zc-detail-hero,.zx .zc-appearance-hero,.zx .zc-unlock-hero{min-height:116px;height:116px;max-height:116px}
.zx .zc-detail-hero>.paper-portrait,.zx .zc-appearance-hero>.paper-portrait,.zx .zc-unlock-hero>.paper-portrait{width:103px;height:116px}
.zx .paper-portrait>.zc-cutout{width:100%;height:100%;object-fit:contain}
.zx .paper-portrait>.zx-glyph-image{width:100%;height:100%;object-fit:contain}
.zx .zx-wallet{position:relative;flex-direction:row;align-items:center;padding:8px 10px;gap:12px;min-height:86px;flex:none;overflow:visible}
.zx .zx-wallet .paper-wallet-photo{width:62px;height:76px;padding:8px;flex:none;display:flex;align-items:center;justify-content:center}
.zx .zx-wallet-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px;color:var(--paper-paper)}
.zx .zx-wallet strong{font-size:29px;line-height:34px;color:var(--paper-paper);white-space:nowrap}
.zx .zx-wallet small{font-size:12px;line-height:17px;color:var(--paper-paper)}
.zx .zx-wallet>.zx-plain{color:var(--paper-paper);font-size:12px;line-height:18px;min-height:44px;padding:3px}
.zx .zx-lab-row{gap:12px;min-height:60px;padding:6px 0;border-bottom:1px solid #CFD7EA}
.zx .zx-lab-row>.zx-glyph{width:43px;height:49px;flex:none;padding:4px;background:transparent}
.zx .zx-lab-row>.zx-col{text-align:left;gap:2px;flex:1;min-width:0}
.zx .zx-lab-row .zx-row{justify-content:flex-start;gap:6px}
.zx .zx-lab-row .zx-row>b{font-size:17px;line-height:22px}
.zx .zx-lab-row .zx-note{font-size:12px;line-height:17px}
.zx .zx-lab-row .zx-pips{justify-content:flex-start;gap:4px}
.zx .zx-lab-row .zx-buy{width:64px;min-width:64px;height:48px;min-height:48px;color:var(--paper-paper)!important}
.zx-lab>.zx-body>.zx-card{padding:0 4px;background:transparent;gap:0}
.screen.zx.zx-lab>.zx-body{gap:9px}
.zx .zx-map-card{position:relative;padding:7px 7px 9px;gap:0;min-height:0;flex:none;overflow:visible}
.zx .zx-map-badge{position:absolute;top:-7px;left:8px;display:flex;align-items:center;gap:5px;height:28px;padding:2px 9px 2px 3px;background:#DCE5F6;color:var(--paper-ink);z-index:2;font-size:14px;line-height:20px}
.zx .zx-map-card .zx-forest{width:100%;height:162px;border-radius:0;object-fit:cover}
.zx .zx-map-caption{min-height:48px;padding:3px 30px;justify-content:center}
.zx .zx-map-caption .zx-col{text-align:center;align-items:center;flex:1}
.zx .zx-map-caption h2{font-size:28px;line-height:35px}
.zx .zx-map-caption small{font-size:12px;line-height:16px}
.zx .zx-map-summary{font-size:14px;line-height:20px}
.zx .zx-map-summary>p{margin:0}
.zx .zx-map-summary>p:last-child{font-size:17px;line-height:24px;font-weight:700;color:var(--paper-ink)}
.paper-section-heading{display:flex;flex-direction:row;align-items:center;gap:9px;margin:4px 0 0}
.paper-section-heading>b{padding:2px 13px;font-size:17px;line-height:24px}
.paper-section-heading>i{flex:1;height:1px;background:#BDC4DB}
.zx .zx-lock-list{gap:7px}
.zx .zx-lock{background:#EDF0F8;border:0;padding:6px;min-height:58px;gap:10px}
.zx .zx-lock .zx-col{flex:1;text-align:left;gap:0}
.zx .zx-map-thumb{width:92px;height:49px;border-radius:0;object-fit:cover}.zx .zx-lock b{font-size:17px;line-height:23px}.zx .zx-lock small{font-size:13px;line-height:18px}
.screen.zx-difficulty-page>.zx-header{height:67px;min-height:67px;padding-top:0;padding-bottom:0}
.screen.zx.paper-masthead-page .zc-header-cutout{height:114px}
.screen.zx.zx-difficulty-page .zc-header-cutout{height:106px}
.screen.zx>.zx-body.paper-mounted-body{--mount-inset:28px;padding-top:0;background:linear-gradient(180deg,transparent 28px,var(--paper-paper) 28px)}
.screen.zx-difficulty-page>.zx-body.paper-mounted-body{--mount-inset:39px;padding:0 12px 16px;gap:12px}
.paper-stage-slip{position:relative;display:flex;flex-direction:row;align-items:center;align-self:center;flex:none;width:94%;height:99px;margin-bottom:5px;padding:0 16px 0 0;gap:8px}
.paper-stage-slip>.paper-stage-photo{width:89px;height:99px;flex:none;object-fit:contain}
.zx .paper-stage-photo{position:relative;display:block;flex:none;padding:0}
.zx .paper-stage-photo>img,.zx .paper-stage-photo>.paper-photo-glyph{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.zc-progress-photo>.paper-stage-photo{width:100%;height:100%}
.paper-stage-slip>.zx-col{min-width:0;flex:1;align-items:flex-start;text-align:left;gap:0}
.paper-stage-slip b{font-size:23px;line-height:30px;white-space:nowrap}
.paper-stage-slip small{font-size:16px;line-height:23px;font-weight:700;color:#717B95}
.zx .zx-difficulty{display:flex;flex-direction:row;align-items:center;flex:none;height:96px;min-height:96px;padding:8px 9px 10px 13px;gap:10px;border:0}
.zx .zx-difficulty>.paper-option-photo{width:66px;height:71px;flex:none;object-fit:contain}
.paper-option-rule{display:block;align-self:center;width:1px;height:47px;flex:none;background:#A9B2CA}
.zx .zx-difficulty>.zx-col{align-items:flex-start;text-align:left;gap:2px;flex:1;min-width:0}
.zx .zx-difficulty h3{font-size:21px;line-height:27px;color:var(--paper-ink)}
.zx .zx-difficulty small{font-size:12.5px;line-height:18px;color:#59617E}
.zx .zx-difficulty:disabled{opacity:1}.zx .zx-difficulty:disabled h3{color:#515D7D}
.paper-choice-mark{width:34px;height:34px;flex:none;object-fit:contain}
.zx .zx-map-badge{height:33px;left:0;top:-8px;padding:0 12px 0 0;gap:4px;font-size:17px}
.zx-map-badge>.paper-choice-mark{width:31px;height:31px}
.zx-lock>.paper-option-rule{height:37px}
.zx-lock>.paper-choice-mark{width:30px;height:30px}
.screen.zx.paper-menu-page{gap:0}
.screen.zx.paper-menu-page>.paper-joint{position:relative;display:block;flex:none;height:7px;min-height:7px;overflow:visible;z-index:3;pointer-events:none}
.paper-joint>i{display:block;position:absolute;top:-14px;left:10%;width:14px;height:32px;background:linear-gradient(180deg,#D8898F,#C36C77);border-radius:2px;pointer-events:none}
.paper-joint>i:last-child{left:auto;right:10%}
.screen.zx{--paper-footer-side:16px;--paper-footer-bottom:14px;--paper-panel-action-gap:18px;--paper-tail:8px}
.screen.zx>.zx-footer.paper-screen-footer{margin:0;padding:24px var(--paper-footer-side) var(--paper-footer-bottom);overflow:visible}
.screen.zx>.zx-footer.paper-screen-footer.paper-single-back{margin-top:8px;padding-top:2px}
.screen.zx.zc-library>.zx-footer.paper-screen-footer{padding-top:6px;gap:4px}
.screen.zx.zc-library .zc-summary .zx-paper-icon{width:44px;height:39px}
.screen.zx.zc-library .zc-summary .zc-text{min-height:55px}
.zx .zx-help-intro{height:64px;min-height:64px;max-height:64px;gap:12px}
.zx .zx-help-intro>.paper-portrait{height:72px;width:57px;display:flex;align-items:center;justify-content:center}
.zx .zx-help-intro>b{font-size:15px;line-height:22px}
.zx .zx-help-map{height:186px;max-height:186px;flex:none}
.zx .zx-help-row{display:flex;flex-direction:row;gap:12px;padding:7px 0;border-bottom:1px solid #CFD7EA}
.zx .zx-help-row>.paper-portrait{width:48px;height:56px;padding:8px;flex:none}
.zx .zx-help-row>.zx-col{gap:3px;flex:1;min-width:0}
.zx .zx-help-row h3{font-size:16px;line-height:22px}
.zx .zx-help-row p{font-size:14px;line-height:20px}
.zx .zc-progress{background:#D5DBEE;border-radius:0}.zx .zc-progress>span{background:#397ACE;border-radius:0}
.zx .zc-unlock-steps{font-size:12px;line-height:18px;color:#637595}
.zx .zc-unlock-steps .done{color:#3975CE}
.zx .zc-evolution{padding:4px;background:#E3ECF8;border:0}
/* The lobby uses the same ticket, seat positions and action row before and after joining. */
.screen.zx.zx-coop>.zx-body{display:flex;flex-direction:column;gap:0;padding:8px 6px 0;background:transparent;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.coop-ticket{display:flex;flex-direction:row;align-items:center;justify-content:space-between;flex:none;height:66px;padding:7px 13px 9px 16px;background:#F1EBDF}
.coop-ticket>.zx-col{flex:1;min-width:0;gap:0}
.coop-ticket small,.coop-count{font-size:12px;line-height:17px;color:#62584E}
.coop-number{font-size:22px;line-height:29px;color:#27232F}
.coop-ticket>.coop-room-tag{align-self:center;padding:0 6px 0 12px;border-left:1px solid #C9BDAB;font-size:13px;line-height:20px;color:#62584E;text-align:center}
.zx .coop-ticket>.coop-copy{display:flex;align-items:center;justify-content:center;flex:none;width:44px;height:44px;padding:0;border:0}
.coop-copy>.zx-paper-icon{width:28px;height:25px;object-fit:contain}
.coop-section{flex:none;display:flex;flex-direction:row;align-items:center;gap:10px;height:38px}
.coop-section>b{color:#FFF8E9;font-size:16px;line-height:21px}
.coop-section>i{height:1px;flex:1;min-width:4px;background:#514B52}
.coop-section>.coop-count{color:#E1D7C4}
.coop-seats,.coop-actions{display:flex;flex:none;flex-direction:row;align-items:stretch;gap:6px}
.coop-seats{background:#514B52;border-radius:7px;padding:7px}
.coop-seats>.coop-seat{position:relative;display:flex;flex-direction:column;flex:1;min-width:0;height:124px;gap:0;align-items:center;justify-content:center;border:0;padding:8px 4px 7px;background:#F1EBDF}
.coop-role{align-self:flex-start;min-height:16px;padding:0 6px;font-size:11px;font-weight:700;line-height:16px;color:#76571C}
.coop-seat-art{display:flex;flex-direction:column;align-items:center;justify-content:center;height:53px}
.coop-word{flex:none;width:46px;height:46px;object-fit:contain}
.coop-vacancy{width:31px;height:31px;display:flex;align-items:center;justify-content:center;border:1px solid #C9BDAB;border-radius:16px;text-align:center;font-size:20px;line-height:28px;color:#A39986}
.coop-name{max-width:100%;font-size:15px;line-height:21px;white-space:nowrap;overflow:hidden;text-align:center;color:#27232F}
.coop-state{min-height:16px;font-size:12px;line-height:16px;color:#62584E}
.coop-seat.empty>.coop-name{font-size:13px;color:#62584E}
.coop-state.ready{font-weight:700;color:#76571C}
.zx .coop-seat>.coop-kick{position:absolute;right:1px;top:0;padding:0 4px;min-height:32px;font-size:12px;color:#8F4455}
.screen.zx.zx-coop>.zx-body{overflow:hidden;overflow-y:hidden}
.coop-roster{display:flex;flex-direction:column;flex:1;min-height:0}
.coop-roster .zc-library-paper{width:100%;min-height:0}
.coop-roster .zc-library-scroll{overflow-y:auto}
.coop-status{display:flex;flex-direction:row;align-items:center;flex:none;min-height:28px;gap:8px}
.coop-note{flex:1;min-width:0;margin:0;padding:6px 0;font-size:13px;line-height:19px;color:#FFF8E9}
.zx .coop-status>.coop-aux{flex:none;min-height:44px;padding:0 5px;font-size:13px;color:#EDCB7D}
.screen.zx.zx-coop>.zx-footer.coop-actions{display:flex;flex-direction:row;align-items:center;gap:8px}
.coop-actions>.zx-button{height:var(--paper-nav-height);min-height:var(--paper-nav-height);min-width:0;flex:1;padding:0 2px;white-space:nowrap}
.coop-actions>.zx-button.paper-back{width:var(--paper-nav-width);flex:none;padding:0}
@media(max-height:660px){.zx-coop .coop-ticket{height:48px}.zx-coop .coop-section{height:27px}.zx-coop .coop-seats>.coop-seat{height:89px;padding:3px}.zx-coop .coop-seat-art{height:32px}.zx-coop .coop-word{width:32px;height:32px}}

.coop-actions>.zx-button:disabled{opacity:1;color:#556783}
.paper-prompt-overlay.zx-modal-wrap{position:absolute;inset:0;z-index:1500;display:flex;align-items:center;justify-content:center;padding:12px 14px;background:rgba(37,32,40,.67)}
.paper-prompt{display:flex;flex-direction:column;flex:none;width:100%;max-width:324px;max-height:100%;overflow-y:auto;scrollbar-width:none;padding:17px 18px 18px;gap:7px;background:#F1EBDF;color:#27232F}
.paper-prompt>h2{flex:none;margin:0;padding-left:10px;border-left:3px solid #EEC659;font-size:22px;line-height:28px;text-align:left;color:#27232F}
.paper-prompt-hint{flex:none;margin:5px 0 10px;color:#62584E;font-size:14px;line-height:20px}
.paper-prompt-hint.error{color:#963F52}
.coop-code-display,.coop-code-group,.coop-pad-row{display:flex;flex-direction:row;align-items:stretch}
.coop-code-display{flex:none;gap:10px}
.coop-code-group{flex:1;min-width:0;gap:4px}
.coop-code-digit{flex:1;min-width:0;height:44px;display:flex;align-items:center;justify-content:center;background:#D7CCB8;border-bottom:2px solid #C9BDAB;color:#27232F;font-size:24px;line-height:31px;text-align:center}
.coop-code-digit.current{background:#E1D7C4;border-bottom:3px solid #EEC659}
.coop-code-pad{flex:none;display:flex;flex-direction:column;gap:4px;margin:13px 0}
.coop-pad-row{gap:5px}
.coop-pad-key{display:flex;flex:1;min-width:0;align-items:center;justify-content:center;height:44px;padding:0;border:0;border-radius:3px;background:#F1EBDF;color:#27232F;font-size:19px;font-weight:700;line-height:24px;text-align:center}
.coop-pad-key[data-key="粘贴"],.coop-pad-key[data-key="删除"]{background:#D7CCB8;color:#62584E;font-size:15px}
.paper-decision-actions{display:flex;flex:none;flex-direction:row;align-items:stretch;gap:8px;width:100%}
.zx .paper-decision-actions>button{display:flex;flex:1;min-width:0;align-items:center;justify-content:center;height:51px;padding:0 4px;text-align:center}
.paper-prompt .paper-decision-actions{margin-top:3px}
.paper-prompt .paper-decision-actions>button:disabled{color:#62584E!important;opacity:1}


.zx-summary>.zx-footer>.zx-row>.zx-button{width:auto;flex:1;min-width:0}
.zx-summary>.zx-footer>.zx-row{flex:none;gap:8px}
.zx .zx-summary-grid .zx-col{min-width:0;flex:1}
.zx .zx-setting>.zx-row{align-items:center}
.zx .zx-choice-heading>img,.zx .zx-choice-heading>canvas{width:43px;height:43px;flex:none;object-fit:contain}
.zx .paper-dialog-title,html.zixing .zx-review-dialog h1.paper-dialog-title{position:relative;text-align:center;align-self:stretch;color:var(--paper-ink)}
.zx .zx-review-heading>.zx-review-note{text-align:center}
.zx .zx-entry-status{display:flex;flex:1;gap:16px;align-items:center;justify-content:center;flex-direction:column;padding:16px}
.zx .zx-entry-status>.paper-portrait{width:90px;height:98px;display:flex;align-items:center;justify-content:center}
.zx .zx-entry-status>.zx-note{text-align:center;line-height:22px;color:#3E445A}
.zx .zx-slot{background:#C5D2E4;border:2px solid #98ACC9;border-radius:2px;gap:4px;padding:6px}
.zx .zx-slot b{background:var(--paper-paper);border-radius:0;color:var(--paper-ink)}
.zx .zx-review-choice-head .zx-review-check.on{background:#D26E7B;border-color:#AC5564}
.zx .zc-appearance-hero,.zx .zc-unlock-hero{height:145px;min-height:145px;max-height:145px}.zx .zc-appearance-hero>.paper-portrait,.zx .zc-unlock-hero>.paper-portrait{width:132px;height:142px}.zx .zx-setting{border-bottom:1px solid #CFD7E4}
@media(max-height:660px){
 .screen.zx.paper-masthead-page .zc-header-cutout{height:104px}
 .screen.zx.zx-difficulty-page .zc-header-cutout{height:84px}
 .screen.zx{--paper-footer-side:12px;--paper-footer-bottom:12px}
 .screen.zx>.zx-footer.paper-screen-footer{padding-top:13px}
 .screen.zx.zc-library>.zx-footer.paper-screen-footer{padding-top:4px;gap:2px}
 .screen.zx-difficulty-page>.zx-body.paper-mounted-body{--mount-inset:29px;gap:8px;padding:0 9px 12px}
 .screen.zx-difficulty-page>.zx-header{height:55px;min-height:55px}
 .screen.zx-difficulty-page .paper-stage-slip{height:74px;margin-bottom:0;padding-right:12px}
 .screen.zx-difficulty-page .paper-stage-photo{width:67px;height:74px}
 .paper-stage-slip b{font-size:20px;line-height:26px}
 .zx .zx-difficulty{height:80px;min-height:80px;gap:7px;padding:6px 7px}
 .zx .zx-difficulty>.paper-option-photo{width:50px;height:56px}
 .zx .zx-difficulty h3{font-size:18px;line-height:24px}
 .zx-home-fixed>.zx-home-visual{min-height:130px}
 .zx-home-fixed .zx-home-visual>canvas{object-fit:contain}
 .zx-home-fixed>.zx-home-dock{height:auto;padding:16px 16px 12px;gap:8px;justify-content:flex-start}
 .zx-home-fixed .zx-home-copy h2{font-size:21px;line-height:28px}
 .zx-home-fixed .zx-home-copy p{font-size:12px;line-height:17px}
 .zx-home-fixed .zx-home-motto,.zx-home-fixed .zx-home-types{display:none}
 .zx-home-fixed .zx-home-start{height:48px;min-height:48px}
 .zx-home-fixed .zx-home-secondary>.zx-home-entry{height:48px;min-height:48px;gap:5px}
 .zx-home-entry>.paper-entry-content{gap:5px}
 .paper-entry-content>.paper-menu-symbol{width:29px!important;height:29px!important}
 .screen.zx>.zx-header{min-height:76px;padding-bottom:8px}
 .zx .zx-map-card .zx-forest{height:120px}
 .zx .paper-info-hero{min-height:76px;height:76px;max-height:76px}
 .zx .paper-info-hero>.paper-portrait{width:62px;height:78px}
 .zx .zc-detail-hero,.zx .zc-appearance-hero,.zx .zc-unlock-hero{min-height:84px;height:84px;max-height:84px}
 .zx .zc-detail-hero>.paper-portrait,.zx .zc-appearance-hero>.paper-portrait,.zx .zc-unlock-hero>.paper-portrait{width:72px;height:84px}
 .zx .zx-help-map{height:140px;max-height:140px}
 .zx .zx-hud-supplies .zx-loadout-more{width:24px;height:24px;min-height:24px}
}
/* Selection album: the paper profile sits above the scrollable stamp file. */
.screen.zx.zc-library>.zx-header,.screen.zx.zc-move-page>.zx-header{height:62px;min-height:62px;padding-bottom:5px}
.zc-catalog-total{position:absolute;right:6px;top:15px;height:27px;padding:0 7px;display:flex;align-items:center;gap:5px;background:#3E465E;color:#EAF0F7;font-size:13px;line-height:20px}
.zc-catalog-total>b{font-size:15px;line-height:20px;color:var(--paper-paper)}
.screen.zx.zx-collection.zc-library>.zx-body{gap:9px;overflow:hidden;overflow-y:hidden;overflow-x:hidden}
.zc-dossier{position:relative;flex:none;display:flex;flex-direction:column;padding:0;margin:0}
.zc-profile-print{display:block;position:relative;width:100%;height:166px;flex:none}
.zc-profile-ground,.zc-control-face,.zc-pocket-art{position:absolute;display:block;pointer-events:none}
.zc-profile-ground,.zc-pocket-art{left:0;top:0;width:100%;height:100%;object-fit:fill}
.zc-dossier-pocket{position:relative;flex:none;padding:0;margin-top:-4px;background:transparent;border:0}
.zc-dossier-controls{position:relative;display:flex;align-items:center;gap:7px;padding:2px 8px 5px}
.zx-collection.zc-library .zc-dossier-action{position:relative;min-width:0;flex:1;height:44px;min-height:44px;padding:0;border:0;background:transparent;display:flex;align-items:center;justify-content:center;gap:0;color:#28334D;font-size:15px}
.zc-dossier-action>.zc-control-face{left:0;top:2px;width:100%;height:40px;object-fit:fill}
.zc-dossier-action>.zc-control-label{position:absolute;left:43%;top:0;width:51%;height:44px;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;white-space:nowrap;text-align:left;margin:0;line-height:21px}
.zc-library .zc-dossier-action:disabled{opacity:.62}
.zc-library .zc-library-paper{padding:0;background:transparent;border:0}
.zc-library .zc-list-sheet{display:flex;flex-direction:column;min-height:0;flex:1;padding:10px 8px;background:#E4EAF3;border-bottom:3px solid #A9BCD4}
.zc-library .zc-library-scroll{display:flex;flex-direction:column;gap:6px;padding:0}
.zx-collection .zc-album-tabs{display:flex;flex-direction:row;flex:none;padding:0 5px;gap:4px;margin:0;background:transparent;align-items:stretch}
.zx-collection .zc-album-tabs .zc-filter{position:relative;flex:1;min-width:0;padding:0;min-height:44px;border:0;background:transparent;font-size:15px;line-height:21px}
.zc-album-tabs .zc-filter>.zc-control-face{left:0;bottom:0;width:100%;height:35px;object-fit:fill}
.zc-album-tabs .zc-filter>.zc-control-label{position:relative;margin-top:8px}
.zc-library .zc-library-scroll>.zc-grid-row{height:60px;gap:3px}
.zx-collection.zc-library .zc-character .zc-cutout{height:35px;top:11px;width:100%}
.zc-library .zc-character .zc-mystery{top:12px;height:35px;font-size:29px;line-height:35px}
.zc-library .zc-character .zc-tag{top:4px;right:4px;font-size:10px;line-height:13px}
.screen.zx.paper-menu-page>.zx-footer.paper-screen-footer.paper-free-actions{background:transparent;border:0;border-top:0;margin:0;padding:var(--paper-panel-action-gap) var(--paper-footer-side) var(--paper-footer-bottom)}
.screen.zx.paper-menu-page>.zx-footer.paper-free-actions,.screen.zx.paper-menu-page>.zx-footer.paper-single-back{--paper-footer-side:0px;padding-left:0;padding-right:0}
.screen.zx.paper-menu-page>.zx-footer .paper-back{position:relative;border:0;padding:0}
.screen.zx.paper-menu-page>.zx-footer .paper-back>.paper-back-art{position:absolute;left:0;top:0;margin:0}
/* Move catalog and the paper slip opened from its rows. */
.screen.zx.zx-route-page>.zx-header{height:67px;min-height:67px;padding-bottom:0}
.screen.zx.zx-route-page .zc-header-cutout{height:159px}
.screen.zx.zx-route-page>.zx-body{display:flex;flex-direction:column;align-items:stretch;flex:1;min-height:0;padding:0;gap:0;background:transparent;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.screen.zx.zx-route-page>.zx-footer.paper-free-actions{gap:8px}
.zx-route-page .zx-station-list{display:flex;flex-direction:column;gap:10px;flex:none;padding:3px 2px 0}
.zx-destination-feature,.zx-destination-others{display:flex;align-items:stretch;gap:6px;min-width:0}
.zx-route-page .zx-album-station{position:relative;display:flex;flex-direction:column;flex:1;min-width:0;height:87px;padding:4px 4px 5px;align-items:stretch;justify-content:flex-start;background:#E7EDF5;border:0;color:#394E6B}
.zx-route-page .zx-album-station:disabled,.zx-route-page .zx-album-mode:disabled{opacity:1}
.zx-route-page .zx-station-print{display:block;width:100%;height:39px;object-fit:cover}
.zx-destination-caption{display:flex;flex-direction:column;align-items:center;gap:1px;padding:3px 0 0}
.zx-destination-caption>b{font-size:15px;line-height:20px;color:#394E6B}.zx-destination-caption>small{font-size:12px;line-height:15px;color:#546981}
.zx .zx-album-station>.paper-choice-mark{position:absolute;top:6px;right:6px;width:16px;height:16px}
.zx-route-page .zx-destination-hero{width:100%;height:auto;flex:none;gap:0;padding:6px 8px 10px 5px;background:#E4EBF3}
.zx-route-page .zx-destination-hero>.zx-station-print{width:100%;height:24vh;max-height:207px;min-height:120px}
.zx-destination-hero>.zx-destination-caption{position:relative;flex:none;align-items:flex-start;padding:7px 8px 0;gap:2px}
.zx-destination-hero .zx-destination-title{font-size:24px;line-height:30px;color:#283C59}
.zx-destination-hero .zx-destination-caption>small{position:absolute;top:auto;bottom:100%;left:1px;padding:3px 18px 5px 11px;color:#F3F1FA;background:#8B5668;font-size:14px;line-height:18px;font-weight:700}
.zx .zx-destination-hero>.paper-choice-mark{width:22px;height:22px;top:11px;right:13px}
.zx .zx-destination-caption>.zx-route-distance{font-weight:500;font-size:14px;line-height:19px;color:#476483}
.zx-route-actor{position:absolute;right:6px;top:12px;display:flex;flex-direction:row;align-items:center;gap:5px;padding-left:8px;border-left:1px solid #A8BBD0;color:#425B79}
.zx .zx-route-actor>.paper-stage-photo{width:26px;height:29px}
.zx-route-actor>span:not(.paper-stage-photo),.zx-route-actor>b{font-size:14px;line-height:19px}
.zx-route-paper{display:flex;flex:none;flex-direction:column;gap:7px;padding:0 2px;margin:16px 0 0;background:transparent}
.zx-difficulty-heading{display:flex;align-items:center;justify-content:space-between;gap:5px;min-height:24px}
.zx-difficulty-heading>h2{flex:none;margin:0;color:#F3F1FA;font-size:16px;line-height:22px}
.zx-difficulty-hint{color:#D4E1F2;font-size:12px;line-height:16px}
.zx-mode-list{display:flex;flex-direction:column;gap:5px}.zx-route-paper .zx-album-row{display:flex;flex-direction:row;gap:6px}
.zx-route-page .zx-album-mode{position:relative;flex:1;min-width:0;height:47px;min-height:47px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:3px 21px 4px 33px;gap:0;border:0;background:#DFE6EF}
.zx-route-page .zx-album-mode>.zx-mode-print{position:absolute;left:5px;top:9px;width:25px;height:26px}
.zx .zx-album-mode>.paper-choice-mark{position:absolute;top:14px;right:5px;width:15px;height:15px}
.zx-route-page .zx-album-mode>h3{margin:0;font-size:15px;line-height:20px;color:#324866}
.zx-route-page .zx-mode-note{color:#526780;font-size:11px;line-height:14px}
.zx-route-page .zx-body>.zx-note{color:#D9E5F5}
.screen.zx.zx-collection-looks>.zx-header{height:101px;min-height:101px;padding-bottom:0}
.screen.zx.zx-collection-plan>.zx-header{height:82px;min-height:82px}
.screen.zx.zx-collection-plan .zc-header-cutout{height:154px}
.screen.zx.zx-collection-plan>.zx-body{padding:0;gap:0;overflow:hidden;overflow-y:hidden;background:transparent}
.zc-plan-summary,.zc-plan-sheet{display:flex;flex-direction:column;background:#F3F1FA;color:#293550}
.zc-plan-summary{flex:none;margin:0 3px 8px;padding:6px 12px;background:#E7EDF5;border-bottom:4px solid #9EB3CB}
.zc-plan-identity,.zc-plan-tally,.zc-plan-heading{display:flex;flex-direction:row;align-items:center;gap:8px}
.zc-plan-identity>.paper-stage-photo{width:54px;height:57px;flex:none}
.zc-plan-copy{display:flex;flex-direction:column;flex:1;min-width:0;gap:2px}
.zc-plan-identity .zc-plan-copy>b{font-size:20px;line-height:26px}
.zc-plan-tally{padding-top:5px;border-top:1px solid #BDCCD9}
.zc-plan-tally>b{flex:1;text-align:center;font-size:13px;line-height:23px}
.zc-plan-sheet{flex:1;min-height:0;padding:12px 14px 9px 20px;border-bottom:4px solid #9EB3CB}
.zc-plan-heading{justify-content:space-between;flex:none}
.zc-plan-heading>b{font-size:18px;line-height:27px}
.zx-collection .zc-plan-marked,.zx .zc-plan-badge,.zx-review-dialog .zc-plan-badge{align-self:center;font-size:12px;line-height:17px;color:#AA435C;font-weight:700}
.zx .zc-plan-badge{align-self:flex-start}
.zc-plan-list{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:8px;border-top:1px solid #C2CEDD;margin-top:7px}
.zx .zc-plan-row{display:flex;flex-direction:row;align-items:center;flex:none;gap:10px;width:100%;min-height:55px;text-align:left;padding:7px 6px;background:transparent;color:#28344E;border:0;border-left:2px solid transparent;border-bottom:1px solid #CFD8E5}
.zx .zc-plan-row.marked{background:#E5EAF2;border-left-color:#C16679}
.zc-plan-row .zc-plan-copy>b{font-size:15px;line-height:21px}
.zx-collection .zc-plan-copy>small,.zx-collection .zc-plan-sheet>small,.zc-plan-tip,.zc-plan-empty{font-size:12px;line-height:17px;color:#526681;font-weight:400}
.zx .zc-plan-icon{width:30px;height:30px;object-fit:contain;background:#DBE5EF;flex:none;padding:3px}
.zc-plan-star{width:27px;text-align:center;font-size:23px;line-height:30px;color:#76849C}
.marked>.zc-plan-star{color:#C05770}
.zc-plan-pair{padding:6px;font-size:13px;line-height:19px;margin:5px 0}
.zc-plan-tip{flex:none;padding:8px 0 2px;border-top:1px solid #BFCDDD}
@media(max-height:650px){.screen.zx.zx-collection-plan>.zx-header{height:55px;min-height:55px}.zc-plan-identity>.paper-stage-photo{height:42px;width:44px}.zc-plan-summary{margin-bottom:2px}}
.screen.zx.zx-collection-looks .zc-header-cutout{height:159px}
.screen.zx.zx-collection-looks>.zx-body{flex:1;min-height:0;padding:0;gap:0;background:transparent;overflow:hidden}
.zc-look-sheet{display:flex;flex:1;flex-direction:column;min-height:0;margin:0 0 3px;padding:0 0 3px;color:#26334E;background:#F3F1FA;border-radius:7px}
.zc-look-scroll{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:17px 18px 16px}
.zc-look-hero{display:flex;flex-direction:row;align-items:center;flex:none;gap:18px;height:235px;margin:0 -4px}
.zc-photo-mount{position:relative;display:flex;align-items:center;justify-content:center;flex:none;width:59%;max-width:200px;height:100%}
.zx .zc-photo-mount>.zc-photo-mount-art,.zx .zc-look-tile>.zc-preview-corners{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx .zc-photo-mount>.paper-stage-photo{width:90%;height:86%;min-width:0;max-width:177px}
.zc-look-caption{display:flex;flex-direction:column;align-items:flex-start;flex:1;min-width:0;gap:0;margin-bottom:20px}
.zc-look-caption>span{font-size:15px;line-height:22px;color:#4B607B;font-weight:400}
.zc-look-caption>b{align-self:stretch;margin:18px 7px 22px 0;padding:0 0 11px;font-size:25px;line-height:33px;color:#26334E;border-bottom:1px solid #B9C9DC}
.zx .zc-look-caption>.zc-look-status{display:flex;align-items:center;justify-content:center;min-height:19px;padding:0 9px;background:#DDE7F2;color:#26334E;font-size:12px;line-height:18px;font-weight:700}
.zc-look-index{display:flex;align-items:center;justify-content:space-between;flex:none;height:61px;padding-top:11px;border-bottom:1px solid #B9C9DC}
.zc-look-index>b{font-size:18px;line-height:25px;color:#26334E}
.zc-look-index>span{font-size:13px;line-height:19px;color:#4B607B;font-weight:400}
.zc-look-tiles{display:flex;flex-direction:row;flex:none;gap:12px;margin-top:16px}
.zx .zc-look-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;flex:1;min-width:0;height:112px;margin:0;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;color:#26334E}
.zx .zc-look-tile>.paper-stage-photo{width:73px;height:82px;max-width:85%;margin-top:3px}
.zc-look-name{width:100%;margin-bottom:3px;text-align:center;font-size:14px;line-height:22px;color:#26334E}
.zc-look-used,.zc-look-lock{position:absolute;display:flex;align-items:center;justify-content:center;right:3px;top:4px}
.zc-look-used{height:17px;padding:0 5px;background:#AD586A;color:#F3F1FA;font-weight:700;font-size:11px;line-height:17px;border-radius:2px}
.zc-look-lock{width:18px;height:18px;border-radius:9px;background:#E1E9F3}
.zc-look-note{display:flex;flex-direction:column;flex:none;gap:9px;margin-top:27px;padding-top:12px;border-top:1px solid #B9C9DC}
.zc-look-note-title{display:flex;align-items:center;gap:7px;min-height:23px;font-size:14px;color:#26334E}
.zc-look-note>p{margin:0;font-size:13px;line-height:20px;font-weight:400;color:#4B607B}
.screen.zx.zx-collection-looks .zc-primary:disabled{opacity:1;background:#C5D3E6;color:#415773!important}
@media(max-height:730px){.screen.zx.zx-collection-looks>.zx-header{height:79px;min-height:79px}.zc-look-hero{height:185px}.zc-look-index{height:47px}.zc-look-note{margin-top:16px}}
.screen.zx.zc-move-page>.zx-body{flex:1;min-height:0;padding:0;background:transparent;overflow:hidden}
.screen.zx.zc-move-page .zc-header-cutout{height:159px}
.zc-move-page .mp-body{display:flex;flex-direction:column;flex:1;min-height:0;padding:0;gap:0;overflow:hidden;background:transparent}
.zc-move-head{display:flex;flex-direction:row;align-items:center;flex:none;height:71px;gap:15px;padding:0 9px;color:#F3F1FA;background:transparent}
.zc-move-head>.paper-stage-photo{width:64px;height:73px;flex:none}
.zc-move-heading,.zc-dialog-name{display:flex;flex-direction:column;flex:1;min-width:0;gap:3px}
.zc-move-heading>b{font-size:24px;line-height:30px;color:#F3F1FA}
.zc-move-heading>.mp-count{margin:0;font-size:13px;line-height:19px;color:#CAD7E9}
.zc-move-paper{display:flex;flex-direction:column;flex:1;min-height:0;padding:9px 0 11px;background:#F3F1FA;border-radius:7px}
.zc-move-page .mp-content{display:flex;flex-direction:column;flex:1;min-height:0;gap:12px;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:6px 15px 12px;background:transparent;color:#29334C}
.zc-move-page .mp-sec,.zc-move-page .mp-grid{display:flex;flex-direction:column;flex:none;min-width:0;gap:0;border:0;border-radius:0;padding:0;background:transparent;box-shadow:none}
.zc-move-section-title,.zc-move-page .mp-top,.zc-dialog-description,.zc-growth-caption,.zc-disclosure,.zc-move-meta,.zc-pair{display:flex;flex-direction:row;align-items:center}
.zc-move-section-title,.zc-move-page .mp-top,.zc-growth-caption,.zc-pair{justify-content:space-between}
.zc-move-section-title{height:29px;padding:0 2px}
.zc-move-section-title>b,.zc-move-page .mp-sec>.tag,.zc-move-page .mp-evo-h .tag{background:transparent;color:#29334C;font-size:19px;line-height:25px;padding:0}
.zc-move-section-title>small,.zc-move-meta>small{font-size:12px;line-height:17px;color:#53657F}
.zc-move-page .mp-hint,.zc-move-page .mp-none,.zc-move-page .mp-closed{margin:0;padding:2px 2px 7px;color:#53657F;font-weight:400;font-size:12.5px;line-height:18px}
.zc-move-page .mp-sec>.mp-hint{border-bottom:1px solid #B6C6D8;margin-bottom:12px}
.zc-move-page .mp-move.zc-move-row{display:flex;flex-direction:row;align-items:stretch;flex:none;min-height:94px;gap:14px;padding:0;margin:0;color:#29334C;background:transparent;border:0;border-radius:0;box-shadow:none}
.zc-move-stamp{flex:none;display:flex;align-items:center;justify-content:center;width:48px;background:#D5E3EF}
.zc-move-stamp>.typeicon{display:flex;align-items:center;justify-content:center;padding:0;margin:0;background:transparent;border:0;box-shadow:none}
.zc-move-stamp>.typeicon>img{width:32px;height:32px;object-fit:contain}
.zc-move-row>.mp-tx{display:flex;flex-direction:column;justify-content:flex-start;flex:1;min-width:0;gap:5px;padding:10px 2px 6px 0;border-top:1px solid #D1DAE6}
.zc-move-row:first-child>.mp-tx{border:0}
.zc-move-page .mp-top{gap:6px}
.zc-move-page .mp-top>b{flex:1;min-width:0;color:#29334C;font-size:18px;line-height:23px}
.zc-move-level{color:#41638B;font-size:14px;font-weight:700;line-height:21px}
.zc-move-level.first{color:#995465}
.zc-move-meta{gap:9px}
.zc-move-meta>.zc-move-badge{border-left:1px solid #BD91A0;padding-left:7px;color:#935266;font-weight:700}
.zc-move-page .mp-desc{font-size:13px;line-height:18px;color:#34415B;margin:0}
.zc-kit-ultimate{display:flex;flex:none;flex-direction:column;gap:4px;padding:6px 9px 9px 12px;border-left:3px solid #B56979;background:#E8EAF4}
.zc-ult-heading,.zc-form-heading{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px}
.zc-ult-titles{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;gap:1px}
.zc-ult-titles>b{font-size:19px;line-height:25px;color:#29334C}
.zc-move-page .zc-kit-ultimate .zc-ult-view{display:flex;align-items:center;justify-content:center;width:64px;height:44px;min-height:44px;padding:0;flex:none;border:0;background:transparent}
.zc-ult-view-face{display:flex;align-items:center;justify-content:center;width:58px;height:31px;padding-bottom:2px;font-size:14px;font-weight:700;line-height:18px;color:#344F76;background:#E4EAF4}
.zc-kit-ultimate>p{margin:0;color:#38465D;font-size:14px;line-height:20px;font-weight:400}
.zc-move-stamp>.zc-fusion-types{display:flex;flex-direction:column;justify-content:center;align-items:center;flex:none;gap:2px;padding:0;margin:0}
.zc-fusion-types>.typeicon{display:flex;align-items:center;justify-content:center;flex:none;margin:0;padding:0}
.zc-fusion-types>.typeicon>img{width:100%;height:100%;object-fit:contain}
.zc-move-page .fi-sec{color:#29334C}
.zc-move-page .fi-card{background:#E3EAF3;color:#29334C}
.zc-move-overlay.zx-modal-wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:0 0 26px;z-index:1500;background:rgba(23,28,48,.55)}
.zc-move-dialog{display:flex;flex-direction:column;width:86%;max-width:332px;max-height:85%;padding:12px 17px 3px;background:#F3F1FA;border-radius:7px;color:#29334C;text-align:left}
.zc-dialog-header{display:flex;flex-direction:row;align-items:center;flex:none;gap:13px}
.dialog-stamp{width:46px;height:51px}
.zc-dialog-name>b{font-size:22px;color:#29334C;line-height:28px}
.zc-dialog-name>small,.zc-ult-titles>small,.zc-dialog-description>small{font-size:13px;line-height:18px;color:#53657F}
.zc-dialog-scroll{display:flex;flex-direction:column;flex:0 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.zc-dialog-scroll>*{flex:none}
.zc-dialog-description{gap:6px;min-height:46px;padding:8px 1px;justify-content:space-between;border-bottom:1px dashed #BDCADB}
.zc-dialog-description>b{flex:1;min-width:0;font-size:15px;line-height:21px;color:#29334C}
.zc-dialog-description>small{flex:none;font-weight:700;color:#965365}
.zc-featured{display:flex;flex-direction:row;align-items:center;min-height:67px;padding:6px 0;gap:0}
.zc-feature{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-width:0;gap:3px;border-left:1px solid #CED8E5}
.zc-feature:first-child{border:0}
.zc-feature>small,.zc-growth-caption>span{font-size:12px;line-height:17px;color:#53657F}
.zc-feature>b{font-size:21px;line-height:26px;color:#3A587E;text-align:center}
.zc-detail-values{padding:1px 1px 10px}
.zc-pair-row{display:flex;flex-direction:row;gap:20px;align-items:stretch}
.zc-pair{flex:1;min-width:0;gap:4px;min-height:24px}
.zc-pair>span,.zc-pair>b{font-size:13px;line-height:18px;color:#53657F}
.zc-pair>b{color:#29334C;text-align:right;flex-shrink:1}
.zc-move-dialog.zc-ultimate-dialog{width:90%;max-width:350px;padding:14px 16px 12px}
.zc-ultimate-dialog .zc-dialog-header{padding-bottom:9px;border-bottom:1px solid #B7C9DD}
.zc-ultimate-scroll{padding:1px 0 4px}
.zc-ultimate-scroll p{margin:0;text-align:left}
.zc-ult-effect{padding:8px 0 4px;font-size:15px;line-height:22px;font-weight:700;color:#29364F}
.zc-form-heading>small,.zc-none{font-size:12px;line-height:18px;color:#506580}
.zc-form-heading>small{flex:none}
.zc-ult-section{display:flex;flex-direction:column;gap:5px;padding:9px 0 6px;border-top:1px solid #CAD5E4}
.zc-ult-section-title{font-size:16px;line-height:21px;color:#344763}
.zc-move-dialog.with-forms{height:570px;max-height:85%}
.with-forms>.zc-ultimate-scroll{flex:1;min-height:0}
.zx-modal-wrap.zx-pause-screen{padding:0;background:rgba(28,34,57,.64)}
.zx-pause-screen .zx-modal.zx-pause{display:flex;align-items:center;justify-content:center;padding:10px;overflow:hidden;border:0;background:transparent;box-shadow:none}
.zx-pause-sheet{display:flex;flex-direction:column;align-items:stretch;width:100%;max-width:362px;height:550px;max-height:100%;min-height:0}
.zx-pause-leaf>.zx-pause-page-print{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.paper-floating-title{position:relative;flex:none;align-self:center;display:flex;align-items:center;justify-content:center;height:46px;max-width:94%;margin:0 0 2px}
.paper-floating-title>.paper-floating-title-print{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx .paper-floating-title>h2{position:relative;margin:0;padding:0 0 4px;color:#293954;font-size:22px;line-height:26px;text-align:center}
.zx-pause-identity{display:flex;align-items:center;flex-direction:row;flex:none;gap:10px;height:58px}
.zx-pause-identity>.paper-stage-photo{flex:none;width:42px;height:46px}
.zx-pause-name{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;flex:1;min-width:0}
.zx-pause-name>b{color:#283A59;font-size:19px;line-height:25px}
.zx-pause-name>small,.zx-pause-identity>small{color:#526783;font-size:12px;line-height:18px}
.zx-pause-metrics{display:flex;flex-direction:row;align-items:center;flex:none;height:31px;background:#E3EAF4}
.zx-pause-metric{display:flex;align-items:center;justify-content:center;flex:1;min-width:0;gap:4px;border-left:1px solid #BACBDF}
.zx-pause-metric:first-child{border-left:0}
.zx-pause-metric>.zx-hud-paper-icon{width:14px;height:14px;flex:none}
.zx-pause-metric>small{color:#526783;font-size:11px;line-height:16px}
.zx-pause-metric>b{color:#283A59;font-size:14px;line-height:18px;white-space:nowrap}
.zx-pause-leaf{position:relative;display:flex;flex-direction:column;flex:1;min-height:0;width:100%}
.zx-pause-paper{position:relative;display:flex;flex-direction:column;align-items:stretch;flex:1;min-height:0;width:100%;padding:5px 17px 13px 19px;color:#2F3A54}
.zx-pause-paper>.zx-pause-body{position:relative;flex:1;min-height:0;padding:0 0 5px;overflow-x:hidden;overflow-y:auto;scrollbar-width:none}
.zx-pause-pane,.zx-pause-attrs{display:flex;flex-direction:column;align-items:stretch;flex:none;gap:0}
.zx-pause-paper .zx-pause-tabs{display:flex;flex:none;flex-direction:row;align-items:stretch;gap:2px;height:42px;margin:2px 0;padding:0}
.zx-pause-paper .zx-pause-tabs>.zc-filter{position:relative;display:flex;align-items:center;justify-content:center;flex:1;min-width:0;height:42px;min-height:42px;margin:0;padding:0;background:transparent;color:#3C4D68;border:0;box-shadow:none}
.zx-pause-tabs .zc-filter>.zc-control-face,.zx-pause-tabs .zc-filter>.zc-control-label{position:absolute;left:0;bottom:4px;width:100%;height:30px}
.zx-pause-tabs .zc-control-label{display:flex;align-items:center;justify-content:center;text-align:center;font-size:14px;line-height:20px}
.zx-pause-paper .zx-pause-tabs>.zc-filter.active{color:#F3F1FA}
.zx-pause-stat-row{display:flex;flex-direction:row;align-items:center;gap:16px;min-height:24px}
.zx-pause-stat-pair{display:flex;flex-direction:row;align-items:center;gap:4px;min-width:0;flex:1}
.zx-pause-stat-pair>small{flex:none;color:#475972;font-size:13px;line-height:18px}
.zx-pause-leader{flex:1;min-width:0;height:1px;background:#D7DFE9}
.zx-pause-stat-pair>b{color:#283A59;font-size:14px;line-height:20px}
.zx-pause-sources{display:flex;flex-direction:column;padding-top:7px;margin-top:6px;border-top:1px solid #C3CFDF}
.zx-pause-sources>small,.zx-pause-inventory>small{color:#526783;font-size:12px;line-height:17px}
.zx-pause-index{color:#344C6C;font-size:14px;line-height:18px}
.zx-pause-inventory{display:flex;flex-direction:column;gap:2px;padding:4px 0 8px}
.zx-pause-inventory+.zx-pause-inventory{border-top:1px solid #C3CFDF;padding-top:8px}
.zx-pause-build-row{display:flex;flex-direction:row;align-items:center;gap:8px;min-height:30px}
.zx-pause-build-row>.zx-loadout-icon{width:24px;height:24px;flex:none;object-fit:contain}
.zx-pause-build-row>span{flex:1;min-width:0;font-size:14px;color:#354965}
.zx-pause-build-row>b{color:#4B6383;font-size:13px}
.zx-pause-paper .zx-pause-actions{position:relative;display:flex;align-items:center;flex:none;gap:6px;margin:0;padding:0;border-top:1px solid #BDCDDF}
.zx-pause .zx-pause-actions>.zx-pause-action{padding:0 3px;min-height:44px;gap:6px;background:transparent;color:#435A7A;border:0;border-radius:0;box-shadow:none;font-size:14px}
.zx-pause-paper>.zx-pause-footer{position:relative;display:flex;flex-direction:row;align-items:center;flex:none;gap:9px;padding:0;background:transparent}
.zx-pause-footer>.primary{flex:1;min-width:0}
.zx-pause-footer>.zx-pause-end{width:40%;flex:none;min-height:48px}
@media(max-width:350px){.zx-pause-identity{gap:4px}.zx-pause-name>small{font-size:11px}.zx-pause-metric>b[data-long="true"]{font-size:13px}}
.zc-ult-rules p{font-size:14px;line-height:21px;color:#39495F;font-weight:400}
.zc-ult-rules>small{font-size:13px;line-height:19px;color:#576B86}
.zc-ult-forms{display:flex;flex-direction:row;align-items:center;justify-content:center;flex:none;gap:5px;padding:10px 0 2px;border-top:1px solid #B7C9DD}
.zc-form-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;flex:0 1 57px;min-width:0;height:80px;padding:5px 0;background:#E4EAF3;border:1px solid #CCD7E5;border-bottom:2px solid #B4C3D7;border-radius:3px;color:#4F6380}
.zc-form-tab.on{background:#DBE8F6;border:1px solid #6588B9;border-bottom:3px solid #5078A9;color:#304F79}
.zc-form-tab>.zc-cutout{width:45px;max-width:100%;height:45px;position:static}
.zc-form-tab>small{font-size:12px;line-height:17px;color:inherit}
.zc-match-row,.zc-match-chips,.zc-match-chip{display:flex;flex-direction:row;align-items:center}
.zc-match-row{gap:5px;align-items:flex-start}
.zc-match-row>b{width:50px;flex:none;font-size:12px;line-height:23px;color:#526682}
.zc-match-chips{flex:1;min-width:0;flex-wrap:wrap;gap:4px}
.zc-match-chip{gap:3px;flex:none;padding:2px 4px;min-height:22px;background:#E1E8F2}
.zc-match-chip>span,.zc-match-chip>small{font-size:12px;line-height:16px;color:#34455E}
.zc-match-chip .typeicon{flex:none}
.zc-disclosure-group{border-top:1px solid #C3D0DF}
.zc-disclosure{width:100%;min-height:44px;padding:0 1px;gap:9px;color:#29334C;background:transparent;border:0;border-radius:0;box-shadow:none}
.zc-disclosure>b{flex:1;text-align:left;font-size:15px;line-height:21px}
.zc-disclosure>small{font-size:13px;color:#53657F}
.zc-disclosure-mark{display:flex;width:16px;height:20px;align-items:center;justify-content:center}
.zc-disclosure-arrow{width:16px;height:12px}
.zc-move-page .mp-desc,.zc-move-page .zc-move-meta>small,.zc-move-page .mp-hint,.zc-dialog-name>small,.zc-feature>small,.zc-pair>span{font-weight:400}
.zc-move-page .zc-move-meta>.zc-move-badge{font-weight:700}
.zc-move-page .zc-move-row.fi-card{background:transparent}
.fu-pair{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:5px}
.fu-pair .fu-chip,.fu-pair .fu-chip.any,.fu-pair .fu-chip.have{display:flex;flex-direction:row;align-items:center;gap:4px;max-width:100%;min-height:25px;padding:2px 6px;background:#DEE8F3;color:#283550;border:0;border-radius:3px;box-shadow:none;font-size:14px;font-weight:700;line-height:20px}
.fu-pair .fu-chip>small{margin:0;padding:0 0 0 5px;border-left:1px solid #9DADC2;border-radius:0;background:transparent;color:#40546F;font-size:12px;font-weight:400;line-height:17px}
.fu-pair .fu-chip>.typeicon{width:16px;height:16px;flex:none}
.zc-move-row .fu-pair>b{color:#405675;background:transparent;font-size:15px;line-height:21px}
.zc-move-row .zc-move-stamp>img{width:32px;height:32px;object-fit:contain}
.zc-growth{padding:0 0 8px}
.zc-growth-caption{height:22px}
.zc-growth-caption>b{font-size:14px;color:#3A587E}
.zc-growth-bars{height:62px;display:flex;flex-direction:row;align-items:flex-end;gap:7px;padding:0 2px}
.zc-growth-level{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;min-width:0}
.zc-growth-level>i{width:100%;background:#B4C8DF}
.zc-growth-level:last-child>i{background:#789AC4}
.zc-growth-level>small{font-size:10px;line-height:14px;color:#53657F}
.zc-range-title{display:block;font-size:12px;line-height:18px;color:#29334C;margin:5px 0 2px}
.zc-growth-ranges .zc-pair{min-height:17px}
.zc-growth-ranges .zc-pair>*{font-size:11.5px;line-height:16px}
.screen.zx.zx-lab>.zx-header{height:92px;min-height:92px;padding-bottom:0}
.screen.zx.zx-lab>.zx-header small{margin:5px 0 0 -2px;padding:0;color:#FFF8E9;font-size:13px;font-weight:400;line-height:20px}
.screen.zx.zx-lab .zc-header-cutout{height:159px}
.screen.zx.zx-lab>.zx-body{flex:1;min-height:0;padding:0;gap:0;background:transparent;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.zx-lab .zx-wallet.lab-balance{position:relative;flex:none;height:67px;min-height:67px;margin:0;padding:0;background:#514B52;color:#FFF8E9}
.lab-balance>.paper-menu-symbol{position:absolute;left:10px;top:9px;width:45px;height:45px;margin:0}
.lab-funds{position:absolute;left:75px;right:106px;top:9px;min-width:0;display:flex;flex-direction:column;gap:0}
.lab-funds>small{color:#FFF8E9;font-size:12px;line-height:17px;font-weight:700}
.zx .lab-funds>strong{color:#FFF8E9;font-size:26px;line-height:30px;text-align:left}
.lab-balance>.lab-help-rule{position:absolute;right:100px;top:14px;width:1px;height:37px;background:#A39986}
.zx-lab .lab-balance>.zx-plain{position:absolute;top:10px;right:4px;display:flex;align-items:center;justify-content:center;width:96px;height:44px;min-height:44px;padding:0;margin:0;border:0;background:transparent;color:#FFF8E9;font-size:13px}
.zx-lab-tabs{display:flex;flex-direction:row;flex:none;height:44px;margin:5px 5px -5px;padding:0;gap:0}
.zx .zx-lab-tabs>.zc-filter{position:relative;flex:1;min-width:0;height:44px;min-height:44px;display:flex;align-items:center;justify-content:center;padding:0;margin:0;background:transparent;color:#26334E;font-size:16px}
.zx-lab-tabs .zc-control-face{position:absolute;left:0;bottom:0;width:100%;height:35px;pointer-events:none}
.zx-lab-tabs .zc-filter>.zc-control-label{position:absolute;left:0;bottom:0;display:flex;align-items:center;justify-content:center;width:100%;height:35px;margin:0;padding:0;font-size:16px;line-height:22px;text-align:center;pointer-events:none}
.zx .zx-lab-tabs>.zc-filter.active{color:#F3F1FA}
.lab-register{display:flex;flex-direction:column;flex:1;min-height:320px;padding:9px 15px 5px;background:#F1EBDF;color:#27232F;border-radius:6px}
.lab-columns,.lab-item-head,.lab-values,.lab-record,.lab-preview,.lab-total,.lab-dialog-head,.lab-dialog-actions{display:flex;flex-direction:row;align-items:center}
.lab-columns{justify-content:space-between;flex:none;height:52px;border-bottom:1px solid #C9BDAB}
.lab-columns>b{font-size:20px;line-height:27px;border-left:3px solid #EEC659;padding-left:8px}
.lab-columns>small{width:67px;text-align:center;font-size:12px;color:#62584E;font-weight:700}
.lab-rows{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.lab-record{flex:none;height:69px;border-bottom:1px solid #C9BDAB;gap:0}
.lab-record:last-child{border-bottom:0}
.lab-record>.paper-stage-photo{width:42px;height:48px;margin-right:14px}
.lab-item-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px;padding-right:18px}
.lab-item-head{justify-content:space-between;gap:5px}
.lab-item-head>b{font-size:16px;line-height:22px;color:#27232F}
.lab-item-head>small{font-size:12px;line-height:17px;color:#62584E}
.lab-values{height:22px;gap:0}
.lab-values>.lab-current{min-width:60px}
.lab-values>span{font-size:14px;color:#62584E}
.lab-values>.lab-arrow{width:30px;text-align:center}
.lab-values>b{font-size:15px;color:#76571C}
.lab-pips{display:flex;flex-direction:row;width:103px;max-width:90%;height:4px;gap:3px;margin-top:3px}
.lab-pips>i{flex:1;height:4px;background:#C9BDAB}
.lab-pips>i.on{background:#EEC659}
.lab-price-slot{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;width:67px;gap:0}
.zx .lab-price{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:3px;width:67px;min-width:67px;height:44px;min-height:44px;margin:0;padding:0;background:transparent;color:#FFF8E9;font-size:15px}
.zx .lab-price[data-poor="true"]{color:#27232F}
.zx .lab-price:disabled{background:transparent;color:#62584E;font-size:12px;opacity:1}
.lab-price-slot>small{color:#985463;font-size:11px;line-height:13px;font-weight:700}
.lab-footnote{flex:none;min-height:29px;padding-top:7px;margin:0;border-top:1px solid #C9BDAB;font-size:12px;line-height:17px;color:#62584E}
.lab-overlay.zx-modal-wrap{display:flex;align-items:center;justify-content:center;padding:0 0 54px;background:rgba(37,32,40,.66)}
.lab-dialog{display:flex;flex-direction:column;width:85%;max-width:328px;max-height:95%;padding:20px 20px 18px;overflow-y:auto;overflow-x:hidden;background:#F1EBDF;color:#27232F;border:0;border-radius:7px}
.lab-dialog>*{flex:none}
.lab-dialog-head{height:83px;justify-content:space-between;align-items:center}
.lab-dialog-heading{display:flex;flex-direction:column;align-items:flex-start;gap:9px}
.lab-dialog-heading>small{font-size:12px;line-height:19px;font-weight:700;color:#62584E;background:#F1EBDF;padding:0 8px}
.lab-dialog-heading>h2{margin:0;font-size:24px;line-height:30px;text-align:left;color:#27232F}
.lab-dialog-head>.paper-stage-photo{width:48px;height:55px;margin-right:9px}
.lab-preview{min-height:43px;justify-content:space-between;gap:6px;border-bottom:1px solid #C9BDAB;margin-bottom:9px}
.lab-preview>b{font-size:15px;line-height:21px;color:#27232F}
.lab-preview>b:last-child{font-size:14px;text-align:right;color:#76571C}
.lab-total{min-height:37px;justify-content:space-between;gap:10px}
.lab-total>span{font-size:15px;line-height:20px;color:#62584E}
.lab-total>b{font-size:17px;color:#27232F}
.lab-total.shortfall>b{color:#985463}
.lab-dialog-note{font-size:12px;line-height:18px;color:#62584E;margin:8px 0 18px}
.lab-dialog-actions{align-items:center;gap:9px}
.lab-dialog-actions>.primary{flex:1;min-width:0;height:44px;min-height:44px;padding:0}
.zx-modal-wrap.paper-dismiss-overlay{padding-bottom:76px}
.paper-dismiss-overlay>.paper-dismiss-dock{position:absolute;left:0;right:0;bottom:14px;height:var(--paper-nav-height);display:flex;flex-direction:row;align-items:center;justify-content:center;padding:0;pointer-events:none}
.paper-dismiss-overlay .paper-dismiss-dock>.paper-dismiss-button{position:relative;display:flex;flex:none;align-items:center;justify-content:center;width:var(--paper-nav-width);min-width:var(--paper-nav-width);max-width:var(--paper-nav-width);height:var(--paper-nav-height);min-height:var(--paper-nav-height);margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;pointer-events:auto}
.paper-dismiss-dock .paper-dismiss-art{width:var(--paper-nav-width);height:var(--paper-nav-height);flex:none;pointer-events:none}
.zx-guide-overlay.zx-modal-wrap{position:absolute;inset:0;z-index:1500;align-items:center;justify-content:center;padding:12px 12px 76px;background:rgba(37,32,40,.68)}
.zx-guide-paper{display:flex;flex-direction:column;width:100%;max-width:330px;max-height:95%;padding:17px 18px 8px;background:#F1EBDF;color:#27232F;border-radius:6px}
.zx-guide-paper>h2{flex:none;margin:0 0 5px;padding-left:10px;border-left:3px solid #EEC659;color:#27232F;font-size:23px;line-height:30px;text-align:left}
.zx-guide-scroll{display:flex;flex-direction:column;flex:0 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.zx-guide-row{display:flex;flex-direction:row;align-items:flex-start;flex:none;padding:12px 0;gap:12px;border-bottom:1px solid #C9BDAB}
.zx-guide-mark{display:flex;align-items:center;justify-content:center;flex:none;width:34px;height:34px;background:#E1D7C4;border-radius:4px}
.zx-guide-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
.zx-guide-copy>b{font-size:16px;line-height:21px;color:#27232F}
.zx-guide-copy>p{margin:0;font-size:14px;line-height:21px;color:#62584E}
.zx-guide-row:last-child{border-bottom:0}
.zx .zx-journal-dialog{background:#F1EBDF;border:0;border-radius:0}
.zx .zx-journal-dialog>h2{align-self:flex-start;flex:none;margin:0 0 5px;padding:3px 20px 4px 10px;border:0;background:#27232F;color:#FFF8E9;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%);font-size:22px;line-height:28px}
.zx-journal-dialog .zx-guide-mark{background:#2B262E;border-radius:0;clip-path:polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)}
.zx.paper-prompt-overlay .zx-journal-dialog .paper-decision-actions>[data-paper-surface="trade-action"]{color:#FFF8E9!important}
.zx.paper-prompt-overlay .zx-journal-dialog .paper-decision-actions>[data-paper-surface="journal-button"]{background:#EEC659;color:#27232F!important;border:0;border-radius:0;box-shadow:none;clip-path:polygon(3% 0,100% 0,97% 100%,0 100%)}
.screen.zx>.paper-screen-footer.paper-covered-actions,.zx-home-fixed .zx-home-foot.paper-covered-actions,.zx-pause-footer>.paper-back.paper-covered-actions{opacity:0;pointer-events:none}
.zc-detail-note{color:#53657F;font-size:12px}
@media(max-height:660px){
 .screen.zx.zc-library>.zx-header,.screen.zx.zc-move-page>.zx-header{height:54px;min-height:54px}
 .zc-profile-print{height:139px}
 .zc-library .zc-library-scroll>.zc-grid-row{height:54px}
}

/* Small collection dossiers share the album paper and leave navigation on the screen edge. */
.screen.zx.zx-choose[data-collection-first="true"]>.zx-body,.screen.zx.zx-collection-unlock>.zx-body,.screen.zx.zx-collection-rewards>.zx-body,.screen.zx.zx-summary>.zx-body,.screen.zx.zx-entry-error>.zx-body{padding:0;background:transparent;overflow-y:auto;overflow-x:hidden}
.zc-starter-sheet,.zc-register,.zx-report,.zx-entry-slip{display:flex;flex-direction:column;flex:none;padding:18px 16px 20px;gap:14px;background:#F3F1FA;color:#28334D}
.zc-starter-sheet .zc-grid.intro{height:144px;gap:6px}
.zc-starter-details{display:flex;flex-direction:column;gap:0}
.zc-starter-details>h2,.zx-report-head h2{margin:0;color:#28334D;font-size:23px;line-height:30px}
.zc-starter-skill{display:flex;flex-direction:row;align-items:flex-start;gap:10px;padding:13px 0;border-bottom:1px solid #C8D3E2}
.zc-starter-skill .zc-note,.zc-register .zc-note,.zx-report .zx-note{color:#4C607E;font-size:14px;line-height:21px}
.zc-starter-sheet>.zc-note{color:#526782}
.screen.zx.zx-collection-unlock>.zx-body{gap:10px}
.zc-unlock-identity{display:flex;align-items:center;flex-direction:row;flex:none;gap:16px;padding:2px 16px 3px}
.zc-unlock-identity>.paper-stage-photo{width:84px;height:96px;flex:none}
.zc-unlock-name{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.zc-unlock-name>h2{margin:0;color:#FFF8E9;font-size:32px;line-height:39px}
.zc-unlock-name>span{color:#FFF8E9;font-size:15px;line-height:21px}
.zc-tracking-mark{color:#EDCB7D;font-size:13px;line-height:18px}
.zc-unknown-print{position:relative;flex:none}
.zc-unknown-print>b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#52698B;font-size:39px;line-height:46px}
.zc-unlock-record{display:flex;flex-direction:column;flex:none;gap:0;background:#F1EBDF;color:#27232F;padding:16px 17px 18px;min-height:0}
.zc-challenge-heading,.zc-challenge-numbers{display:flex;flex-direction:row;align-items:center;justify-content:space-between;flex:none;gap:8px}
.zc-challenge-heading{height:28px;margin-bottom:15px}
.zc-challenge-heading>b{font-size:15px;line-height:21px;color:#27232F}
.zx .zc-challenge-heading>small{padding-right:39px;color:#62584E;font-size:13px;line-height:18px}
.zc-challenge-row{display:flex;flex-direction:column;flex:none;gap:7px;padding:3px 0 18px}
.zc-challenge-task{margin:0;color:#27232F;font-size:23px;line-height:31px;text-align:left;font-weight:700}
.zc-challenge-numbers{color:#62584E;font-size:13px;line-height:20px}
.zc-challenge-numbers>b{font-size:16px;color:#27232F}
.zc-challenge-meter{height:7px;width:100%;background:#C9BDAB;border-radius:2px}
.zc-challenge-meter>i{display:block;height:7px;background:#EEC659;border-radius:2px}
.zc-challenge-row[data-complete="true"] .zc-challenge-task{color:#62584E;font-size:18px;line-height:26px}
.zc-capture-next{display:flex;flex-direction:column;gap:5px;padding:15px 0;border-top:1px solid #C9BDAB}
.zc-capture-next>b,.zc-capture-alt b{color:#27232F;font-size:16px;line-height:22px}
.zc-capture-next>p,.zc-capture-alt p,.zc-discovery-copy,.zc-unlock-unavailable{margin:0;font-size:14px;line-height:21px;color:#62584E}
.zc-capture-alt{display:flex;flex:none;flex-direction:row;align-items:center;gap:11px;margin-top:10px;padding:12px;background:#F1EBDF;border-left:3px solid #AC8698}
.zc-capture-alt>.zx-icon{flex:none}.zc-capture-alt .zc-copy{gap:2px}
.zc-unlock-unavailable{color:#83596B;margin-bottom:10px}
.zc-discovery-copy{margin-top:6px}
.zc-unlock-record[data-many="true"] .zc-challenge-task{font-size:18px;line-height:24px}
.zc-unlock-record[data-many="true"] .zc-challenge-row{gap:4px;padding:0 0 12px}
.zx-collection .zx-footer>.zc-track-hint{align-self:center;color:#E1D7C4;font-size:13px;line-height:18px;margin:0}

.screen.zx[data-unlock-state="ready"] .zc-capture-next{border:0;padding:3px 0 18px}
.screen.zx[data-unlock-state="ready"] .zc-capture-next>b{font-size:23px;line-height:31px}
.screen.zx[data-unlock-state="unknown"] .zc-unlock-record,.screen.zx[data-unlock-state="owned"] .zc-unlock-record{flex:0 0 auto}
.zc-register-title{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:2px solid #C9BDAB}
.zc-register-title>b,.zx-report-build>b{font-size:19px;line-height:25px;margin:0}
.zc-register{gap:0}.zc-register .zc-reward{background:transparent;border:0;border-bottom:1px solid #C9BDAB;border-radius:0;padding:10px 0;gap:14px;min-height:78px}
.zc-register .zc-reward>.paper-stage-photo{width:53px;height:61px;flex:none}
.screen.zx.zx-settings>.zx-body{display:flex;flex-direction:column;overflow:hidden;gap:5px;padding:10px 14px 14px}
.zx-settings .zx-settings-scroll{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;gap:8px;scrollbar-width:none}
.zx-settings .zx-settings-scroll>*{flex:none;min-width:0}
.zx-settings .zx-settings-scroll>.zx-card{padding:10px 12px}
.zx-settings .zx-settings-scroll .zx-setting{padding:7px 0;gap:6px}
.zx-settings .zx-settings-scroll .zx-setting>.zx-row{min-width:0;gap:6px}
.zx-settings .zx-settings-scroll .zx-options{flex-shrink:0;max-width:100%}
.screen.zx.zx-settings>.zx-body{background:#F1EBDF;border-color:#A69B90}
.zx-settings .zx-settings-scroll>.zx-card{background:#EEE8DC;border-color:#B4A89B;color:#27232F}
.zx-settings .zx-setting{border-color:#C9BEAC}
.zx-settings .zx-setting .zx-note,.zx-settings .zx-setting small{color:#63594E}
.zx-settings .zx-setting .zx-options,.zx-settings .zx-setting .zx-switch{background:#D3C9B8}
.zx-settings .zx-setting .zx-option{color:#403930}
.zx-settings .zx-setting .zx-option.on,.zx-settings .zx-setting .zx-switch.on{background:#EEC659;color:#27232F}
.zx-settings .zx-setting .zx-switch i{background:#38343D}
.zx-settings .zx-range{accent-color:#EEC659}
.screen.zx.zx-settings>.zx-header>small,.screen.zx.zx-settings>.zx-footer.paper-single-back>.zx-note{color:#FFF8E9}
.zx-loading-screen>.zx-body{background:transparent}
.zx-loading-content>.zx-loading-title,.zx-loading-progress>.zx-loading-percent,.zx-loading-content>.zx-note{color:#EDF0F7}
.screen.zx.zx-entry-error>.zx-body{justify-content:center}
.zx-entry-slip{flex-direction:row;flex-wrap:wrap;align-items:center;gap:12px}
.zx-entry-slip>.zc-copy>b{font-size:21px;line-height:29px}
.zx-entry-message{width:100%;margin:2px 0 0;padding-top:12px;border-top:1px solid #C3CFDF;font-size:15px;line-height:23px;color:#384E6B}
.zx-report{gap:15px;padding:17px 16px 18px}
.zx-report-head{display:flex;flex-direction:row;align-items:center;gap:14px}
.zx-report-head>.paper-stage-photo{width:69px;height:80px;flex:none}
.zx-report .zx-summary-grid{background:#DEE7F2;gap:0}
.zx-report .zx-summary-grid>.zx-col{border:0;padding:9px 0;gap:2px}
.zx-report .zx-summary-grid b{font-size:19px;color:#2C496D}
.zx-report-note{color:#485D78;font-size:14px;line-height:21px;margin:0}
.zx-report-reward{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-top:1px solid #C4D0DF;border-bottom:1px solid #C4D0DF}
.zx-report-reward .zc-copy>b{font-size:19px;line-height:26px;color:#2E507F}
.zx-report .zx-report-link,.zx-report-reward>.zx-plain{padding:0 12px;flex:none;min-height:44px;height:44px;color:#2E507F}
.zx-report-reward>.zx-report-link,.zx-report-reward>.zx-plain{width:auto}
.zx-report-build{display:flex;flex-direction:column;gap:4px}
.zx-report-build>b{font-size:16px}.zx-saved-wrap.zx-modal-wrap{align-items:center;justify-content:center;padding:12px 14px 76px}
.zx .zx-saved-run .zx-saved-seal{background:#DDE7F3;border-color:#AEBFD7}
.zx.zx-settling{position:absolute;left:12%;right:12%;top:43%;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;padding:17px 12px;z-index:1500;color:#2C405F;background:#F3F1FA;font-size:17px}
/* One desk behind selection, route and entry. Only the lower sheet scrolls. */
.screen.zx.journey-prep,html.touch .screen.zx.journey-prep{background:transparent}
.screen.zx.journey-prep>canvas.journey-scene{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
.screen.zx.journey-prep>.zx-header{background:transparent}
.screen.zx.journey-prep>.zx-header>.zc-header-cutout{display:none}
.screen.zx.journey-prep>.zx-header,.screen.zx.journey-prep>.zx-body,.screen.zx.journey-prep>.zx-footer{position:relative}
.screen.zx.zc-library.journey-prep>.zx-body{gap:0;padding:0;background:transparent}
.journey-air{flex:none;height:24vh;min-height:95px;max-height:215px}
.journey-prep .zc-dossier{margin:0 0 9px;padding:0;background:#F1F2F7}
.journey-index{width:100%;position:relative;flex:none}
.journey-prep .zc-dossier-pocket{margin:0}
.journey-prep .zc-pocket-art{display:none}
.journey-prep .zc-dossier-controls{padding:0 7px 3px;gap:6px}
.screen.zx.zc-library.journey-prep .zc-dossier-action{height:44px;min-height:44px}
.journey-prep .zc-dossier-action>.zc-control-face{height:34px;top:5px}
.screen.zx.zx-route-page.journey-prep>.zx-body{justify-content:flex-start;padding:0;gap:0}
/* Reuse the desk for the home scene, with the original lettering above the actor. */
.screen.zx.zx-home-fixed.journey-prep>.zx-home-visual{position:relative;background:transparent}
.screen.zx.zx-home-fixed.journey-prep .zx-home-visual>.zx-home-wordmark{position:absolute;left:0;top:13%;width:100%;height:23%;min-height:70px;max-height:124px;object-fit:contain;pointer-events:none}
.screen.zx.zx-home-fixed.journey-prep .zx-home-foot>.zx-button.zx-plain{color:#304764}

.screen.zx.journey-prep .zx-destination-hero>.journey-itinerary-stamp{position:absolute;left:6%;top:10px;width:87%;height:103px;object-fit:contain;pointer-events:none}
@media(max-height:680px){.screen.zx.journey-prep .zx-destination-hero>.journey-itinerary-stamp{top:5px;height:68px}}
/* One illustrated departure card, followed by a compact index of later stops. */
.journey-prep .zx-station-list{margin:19vh 0 0;gap:0;padding:0}
.journey-prep .zx-destination-feature{flex:none;height:180px}
.screen.zx.journey-prep .zx-destination-hero{position:relative;flex:none;width:100%;height:180px;min-height:180px;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:0;padding:5px 7px 7px 6px;background:#EBEFF5}
.screen.zx.journey-prep .zx-destination-hero>.zx-station-print{display:block;flex:none;width:100%;height:116px;min-height:0;max-height:116px;object-fit:cover}
.screen.zx.journey-prep .zx-destination-hero>.journey-station-label{position:absolute;top:12px;left:6px;height:24px;padding:2px 18px 3px 10px;line-height:19px;font-size:13px;font-weight:700;color:#F3F1FA}
.screen.zx.journey-prep .zx-destination-hero>.paper-choice-mark{width:21px;height:21px;top:13px;right:14px}
.screen.zx.journey-prep .zx-destination-hero>.zx-destination-caption{display:flex;flex:1;min-height:44px;flex-direction:row;align-items:center;justify-content:space-between;padding:0 9px;gap:6px}
.screen.zx.journey-prep .zx-destination-hero .zx-destination-title{flex:none;color:#243A58;font-size:24px;line-height:30px}
.screen.zx.journey-prep .zx-destination-caption>.zx-route-distance{font-size:13px;line-height:18px;color:#506983}
.journey-station-index{display:flex;flex-direction:column;min-height:0;margin:6px 0 0;gap:3px}
.journey-station-key{height:16px;display:flex;align-items:center;padding-left:7px}
.journey-station-key>b{font-size:12px;line-height:15px;color:#41566C}
.journey-prep .zx-destination-others{flex-direction:column;align-items:stretch;gap:2px}
.screen.zx.journey-prep .zx-destination-others>.zx-album-station{position:relative;display:flex;flex:none;width:100%;height:44px;min-height:44px;padding:4px 32px 4px 5px;gap:10px;flex-direction:row;align-items:center;justify-content:flex-start;background:#E9EDF3;border:0;border-bottom:1px solid #B7C6D6}
.screen.zx.journey-prep .zx-destination-others .zx-station-print{display:block;flex:none;width:63px;height:34px;min-height:0;object-fit:cover;opacity:.74}
.screen.zx.journey-prep .zx-destination-others .zx-destination-caption{flex:1;min-width:0;align-items:flex-start;padding:0;gap:0}
.screen.zx.journey-prep .zx-destination-others .zx-destination-title{font-size:15px;line-height:20px;color:#405874}
.screen.zx.journey-prep .zx-destination-others .journey-station-label{position:absolute;right:32px;top:13px;color:#65768B;font-size:12px;line-height:16px}
.screen.zx.journey-prep .zx-destination-others .paper-choice-mark{width:14px;height:16px;right:11px;top:13px}
.journey-prep .zx-route-paper{background:#EEF0F4;margin:11px 0 0;padding:8px 9px 9px;gap:6px}
.journey-prep .zx-difficulty-heading{flex-direction:row;align-items:center;justify-content:space-between;min-height:19px}
.journey-prep .zx-difficulty-heading>h2{font-size:14px;line-height:19px;color:#354A63}
.journey-prep .zx-difficulty-hint{font-size:11px;line-height:16px;color:#546A80}
.journey-prep .zx-route-paper .zx-album-row{gap:2px}
.screen.zx.journey-prep .zx-album-mode{display:flex;flex:1;min-width:0;height:44px;min-height:44px;flex-direction:row;align-items:center;justify-content:center;padding:0;gap:3px;border:0;background:#DDE5EF}
.screen.zx.journey-prep .zx-album-mode>h3{margin:0;color:#3F536E;font-size:13px;line-height:18px;white-space:nowrap}
.screen.zx.journey-prep .zx-album-mode>.paper-choice-mark{display:none}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]{background:#47698F}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]>h3{color:#F3F1FA}
.screen.zx.journey-prep .zx-album-mode:disabled{background:#E6EAF0}
.screen.zx.journey-prep .zx-album-mode:disabled>h3{color:#6A7888}
.screen.zx.journey-prep .zx-album-mode:disabled>.paper-choice-mark{position:relative;display:block;left:auto;right:auto;top:auto;width:11px;height:12px}
@media(max-height:680px){
 .journey-prep .zx-station-list{margin-top:12vh}
 .journey-prep .zx-destination-feature,.screen.zx.journey-prep .zx-destination-hero{height:127px;min-height:127px}
 .screen.zx.journey-prep .zx-destination-hero>.zx-station-print{height:71px;max-height:71px}
}


.screen.zx.journey-entry>.zx-body{justify-content:flex-end;align-items:center;padding:0 0 3vh;background:transparent}
.screen.zx.journey-entry canvas.zx-entry-ticket{display:block;flex:none;width:100%;max-width:430px;height:84px;object-fit:contain}
@media(max-height:680px){.journey-air{height:13vh;min-height:50px}}



.screen.zx.journey-prep>canvas.journey-scene{width:100vw;height:100vh;object-fit:fill}

/* The profile changes face in place. The three tools belong to the list's foot. */
.screen.zx.zc-library.journey-prep .journey-air{height:21vh;min-height:92px;max-height:178px}
.screen.zx.zc-library.journey-prep .journey-info{position:relative;flex:none;width:100%;height:82px;margin:0 0 4px;background:transparent}
.journey-info>.journey-profile-print{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.screen.zx.zc-library.journey-prep .journey-face-toggle{position:absolute;right:0;top:0;width:32%;height:44px;min-height:44px;padding:0;border:0;background:transparent;box-shadow:none;cursor:pointer}
.journey-face-toggle:focus-visible{outline:2px solid #6083AE;outline-offset:-3px}
.screen.zx.zc-library.journey-prep .zc-list-sheet{padding:7px 8px 3px;border:0;background:#E5EBF3}
.screen.zx.zc-library.journey-prep .journey-commands{display:flex;flex:none;flex-direction:row;align-items:center;height:48px;padding:1px 5px 3px;gap:3px;background:#E5EBF3;border-top:1px solid #C6D3E0;border-bottom:2px solid #A4B8CF}
.screen.zx.zc-library.journey-prep .journey-commands>.zc-dossier-action{position:relative;flex:1;min-width:0;height:44px;min-height:44px;margin:0;padding:0}
.screen.zx.zc-library.journey-prep .journey-commands .zc-control-face{top:4px;height:34px}
.screen.zx.zc-library.journey-prep .journey-commands .zc-control-label{left:41%;top:0;width:54%;height:41px;font-size:14px}
@media(max-height:680px){.screen.zx.zc-library.journey-prep .journey-air{height:15vh;min-height:66px}}


.screen.zx.journey-prep .journey-station-index{display:flex;flex-direction:column;flex:none;min-width:0;margin-top:2px;padding:0 4px 3px;background:#EEF1F6;border-bottom:2px solid #A4B6CA}
.journey-station-index .journey-station-key{height:21px;min-height:21px;padding-left:13px}
.journey-prep .journey-station-index .zx-destination-others{gap:0}
.screen.zx.journey-prep .zx-destination-others>.zx-album-station{background:transparent;border:0;border-bottom:1px solid #CFD9E5}
.journey-prep .zx-route-paper{margin-top:7px}


.screen.zx.journey-prep .paper-action.primary,.screen.zx.journey-prep .paper-action.zc-primary{color:#27232F!important}
.screen.zx.journey-prep .paper-action.primary:disabled,.screen.zx.journey-prep .paper-action.zc-primary:disabled{color:#665F66!important}
.screen.zx.zc-library.journey-prep .zc-character.locked .zc-cutout{opacity:1}
.screen.zx.zc-library.journey-prep .journey-face-tabs{position:absolute;left:0;right:0;top:0;display:flex;flex-direction:row;gap:3px;height:33px}
.screen.zx.zc-library.journey-prep .journey-stats-details{position:absolute;left:0;right:0;top:34px;bottom:0;width:100%;min-height:0;margin:0;padding:0;border:0;background:transparent}
.screen.zx.zc-library.journey-prep .journey-face-option{flex:1;height:33px;min-height:33px;color:#FFF8E9;padding:0;text-align:center;font-weight:700}
.screen.zx.zc-library.journey-prep .journey-face-option[aria-pressed="true"]{color:#27232F}
.screen.zx.zc-library.journey-prep .zc-filters .zc-control-face,.screen.zx.zc-library.journey-prep .journey-commands .zc-control-face{display:none}
.screen.zx.zc-library.journey-prep .zc-filters,.screen.zx.zc-library.journey-prep .zc-filter,.screen.zx.zc-library.journey-prep .journey-commands,.screen.zx.zc-library.journey-prep .journey-commands .zc-dossier-action{background:#F1EBDF}
.screen.zx.zc-library.journey-prep .zc-filter.active{background:#EEC659}
.screen.zx.zc-library.journey-prep .zc-filter .zc-control-label,.screen.zx.zc-library.journey-prep .journey-commands .zc-control-label{color:#27232F}
.screen.zx.zc-library.journey-prep .journey-commands .zc-control-label{left:0;width:100%;text-align:center}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]{background:#EF9955}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]>h3{color:#27232F}
.zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{margin:0}
.zx .zx-level-up .zx-choice-actions>.zx-reroll,.zx .zx-level-up .zx-choice-actions>.zx-reroll>span{color:#FFF8E9;background:transparent}
.zx-level-up .zx-offer-rank>b{background:#E7DDC7;color:#40383A}
.zx-level-up .zx-offer-stat,.zx-level-up .zx-upgrade-effects>.zx-offer-explanation{color:#40383A}

.screen.zx.journey-prep .selection-binding{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;padding:9px 13px 3px 7px;background:#F1EBDF}
.screen.zx.zc-library.journey-prep .zc-filter[aria-pressed="true"]{background:#EEC659}
.screen.zx.zc-library.journey-prep .zc-list-sheet,.screen.zx.zc-library.journey-prep .journey-commands{background:transparent;border:0}
.screen.zx.zc-library.journey-prep .journey-commands>.zc-dossier-action{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:6px;background:transparent}
.screen.zx.zc-library.journey-prep .journey-commands .command-name{color:#302A30;font-size:15px;font-weight:700;line-height:20px}
.screen.zx.zc-library.journey-prep .zc-card-check{background:transparent;border:0;width:17px;height:17px;left:3px;top:2px}
.screen.zx.journey-prep .route-binding{display:flex;flex-direction:column;flex:none;gap:0;margin-top:19vh;padding:9px 13px 6px 7px;background:#D4CEC2}
.screen.zx.journey-prep .route-binding .zx-station-list{margin:0}
.screen.zx.journey-prep .route-binding .zx-destination-hero>.zx-destination-caption{background:#29252E}
.screen.zx.journey-prep .route-binding .zx-destination-hero .zx-destination-title,.screen.zx.journey-prep .route-binding .zx-destination-caption>.zx-route-distance{color:#FFF8E9}
.screen.zx.journey-prep .route-binding .journey-station-index,.screen.zx.journey-prep .route-binding .zx-route-paper{background:transparent;border:0}
.screen.zx.journey-prep .route-binding .zx-destination-others>.zx-album-station{background:#E7E1D7;border:0}
.screen.zx.journey-prep .route-binding .zx-destination-others .zx-destination-title,.screen.zx.journey-prep .route-binding .zx-difficulty-heading>h2{color:#332D36}
.screen.zx.journey-prep .route-binding .journey-station-label,.screen.zx.journey-prep .route-binding .zx-difficulty-hint{color:#58505A}
.screen.zx.journey-prep .route-binding .zx-destination-hero>.journey-station-label{color:#FFF8E9}
.screen.zx.zx-home-fixed.journey-prep .zx-home-start,.screen.zx.zx-home-fixed.journey-prep .zx-home-start .zx-action-line{font-size:26px!important;font-weight:900;line-height:32px}
@media(max-height:680px){.screen.zx.journey-prep .route-binding{margin-top:12vh}}


.screen.zx.collection-journal{background:#38343D}

.screen.zx.collection-journal>.zx-header small{color:#FFF8E9}
.collection-journal .zx-body>.zx-note,.collection-journal .zc-panel .zc-note{color:#62584E}
.collection-journal .zx-footer .paper-action,.collection-journal .zx-footer .zx-action-line,.zx.lab-overlay .paper-decision-actions>.paper-action,.zx.paper-prompt-overlay .paper-decision-actions>.paper-action{color:#27232F!important}
.collection-journal .zx-footer .paper-action:disabled,.paper-prompt-overlay .paper-decision-actions>button:disabled{color:#554E49!important}
.screen.zx.collection-journal .zx-lab-tabs>.zc-filter,.screen.zx.collection-journal .zx-lab-tabs .zc-control-label{color:#FFF8E9}
.screen.zx.collection-journal .zx-lab-tabs>.zc-filter.active,.screen.zx.collection-journal .zx-lab-tabs>.zc-filter.active .zc-control-label{color:#27232F}
.zx-lab .lab-price,.zx-lab .lab-price>b{color:#302A31}
.zx-lab .lab-price:disabled{color:#62584E}
.zx-lab .lab-columns>b{border-color:#B78A31}
.zx-coop .coop-roster{padding:4px 12px 5px 6px;background:#F1EBDF}
.screen.zx.zx-coop .coop-roster .zc-list-sheet,.screen.zx.zx-coop .coop-roster .zc-filters,.screen.zx.zx-coop .coop-roster .zc-filter{background:transparent;border:0}
.screen.zx.zx-coop .coop-roster .zc-filter .zc-control-label{color:#27232F}
.screen.zx.zx-coop .coop-roster .zc-filter.active{background:#EEC659}
.screen.zx.zx-coop .coop-roster .zc-list-sheet{border-bottom:0}
.screen.zx.zx-coop .coop-roster .zc-card-check{background:transparent;border:0}
.screen.zx.zx-coop .coop-roster .zc-character.locked .zc-cutout{opacity:1}
.zx .paper-stage-photo[data-paper-surface="move-stamp"]{background:#DED5C6}
.zc-move-overlay.zx-modal-wrap{background:rgba(37,32,40,.58)}
.zc-move-dialog .zc-ult-forms,.zc-move-dialog .zc-ult-section,.zc-move-dialog .zc-dialog-header,.zc-move-dialog .zc-dialog-description{border-color:#C9BDAB}
.zc-move-dialog .zc-form-tab{background:#E4DDCF;border-color:#C9BDAB;color:#514842}
.zc-move-dialog .zc-form-tab.on{background:#EEC659;border-color:#AD8D49;color:#27232F}
.collection-journal .zc-stat{border-color:#C9BDAB}
.collection-journal .zc-stat>b{color:#302A31}
.screen.zx.zx-collection-detail .zc-filters .zc-filter{color:#FFF8E9}
.screen.zx.zx-collection-detail .zc-filters .zc-filter.active{color:#27232F}

.screen.zx.collection-journal .zc-filter .zc-control-face{display:none}
.screen.zx.collection-journal .zc-filter{background:#57535E}
.screen.zx.collection-journal .zc-filter.active{background:#EEC659}
.screen.zx.collection-journal .zc-filter .zc-control-label{color:#FFF8E9}
.screen.zx.collection-journal .zc-filter.active .zc-control-label{color:#27232F}
.screen.zx.collection-journal .zc-look-sheet,.screen.zx.collection-journal .zc-plan-sheet,.screen.zx.collection-journal .zc-move-paper{background:#F1EBDF;border-color:#A69B90}
.screen.zx.collection-journal .zc-plan-list,.screen.zx.collection-journal .zc-plan-row{background:transparent;border-color:#CCC1AE}
.screen.zx.collection-journal .zc-kit-ultimate{background:#E8DFC9;border-color:#B48B35}
.screen.zx.collection-journal .zc-ult-view-face,.screen.zx.collection-journal .zc-look-used,.screen.zx.collection-journal .zc-look-status{background:#EEC659;color:#29252E}
.screen.zx.collection-journal .zc-primary,.screen.zx.collection-journal .zc-primary>.zx-action-line{color:#27232F!important}
.screen.zx.collection-journal .zc-primary:disabled{background:#B6B0AB;color:#524C51!important}
.screen.zx.collection-journal .zc-plan-marked,.screen.zx.collection-journal .zc-move-level.first{color:#806020}
.screen.zx.collection-journal .zc-plan-star,.screen.zx.collection-journal .zc-look-lock{color:#534B50;background:transparent}
.screen.zx.collection-journal .zc-plan-row.marked{background:#F2DFAB}

.screen.zx [data-print-angle="-3"]{transform:rotate(-3deg)}
.screen.zx [data-print-angle="-2"]{transform:rotate(-2deg)}
.screen.zx.zc-library.journey-prep>.zx-header,.screen.zx.zx-route-page.journey-prep>.zx-header{height:62px;min-height:62px;padding-bottom:5px}
.screen.zx.zc-library.journey-prep .journey-air,.screen.zx.zx-route-page.journey-prep .journey-air{height:45vw;min-height:0;max-height:27.4vh}
.screen.zx.journey-prep .route-binding,.screen.zx.journey-prep .selection-binding{flex:1;min-height:0;margin:0;background:#FBF5E8;padding:9px 13px 5px 7px}
.screen.zx.zc-library.journey-prep .selection-binding .zc-library-paper,.screen.zx.zc-library.journey-prep .selection-binding .zc-filter,.screen.zx.zc-library.journey-prep .selection-binding .zc-filters{background:transparent}
.screen.zx.journey-prep .route-binding .zx-station-list{flex:1;min-height:0}
.screen.zx.journey-prep .route-binding .zx-destination-feature,.screen.zx.journey-prep .route-binding .zx-destination-hero{height:161px;min-height:161px}
.screen.zx.journey-prep .route-binding .zx-destination-hero{padding:3px;background:#29252E}
.screen.zx.journey-prep .route-binding .zx-destination-hero>.zx-station-print{height:116px}
.screen.zx.journey-prep .route-binding .zx-destination-hero>.zx-destination-caption{min-height:36px;padding:0 8px}
.screen.zx.journey-prep .route-binding .journey-station-index{flex:1;min-height:0;padding:0;margin:4px 0 0}
.screen.zx.journey-prep .route-binding .journey-station-key{height:24px;min-height:24px;padding-left:2px}
.screen.zx.journey-prep .route-binding .journey-station-key>b{font-size:14px;color:#39333E}
.screen.zx.journey-prep .route-binding .zx-destination-others{flex:1;min-height:0;overflow-y:auto;gap:3px}
.screen.zx.journey-prep .route-binding .zx-destination-others>.zx-album-station{flex:1;min-height:34px}
.screen.zx.journey-prep .route-binding .zx-route-paper{flex:none;margin-top:7px;padding:5px 1px 2px;gap:4px;border-top:1px solid #A69B90}
.screen.zx.journey-prep .route-binding .zx-mode-list{background:#E7DFD2;padding:1px 3px}
.screen.zx.journey-prep .route-binding .zx-album-row{gap:0}
.screen.zx.journey-prep .route-binding .zx-album-mode{height:37px;min-height:37px;background:transparent}
.screen.zx.journey-prep .route-binding .zx-album-mode:first-child{flex:1.35}
.screen.zx.journey-prep .route-binding .zx-album-mode[aria-pressed="true"]{background:#EFC554}
.screen.zx.journey-prep .route-binding .zx-album-mode h3{color:#433C42}
.screen.zx.journey-prep .route-binding .zx-album-mode:disabled h3{color:#726A6B}
@media(max-height:680px){
 .screen.zx.zc-library.journey-prep>.zx-header,.screen.zx.zx-route-page.journey-prep>.zx-header{height:54px;min-height:54px}
 .screen.zx.zc-library.journey-prep .journey-air,.screen.zx.zx-route-page.journey-prep .journey-air{height:19vh;min-height:66px;max-height:none}
 .screen.zx.journey-prep .route-binding .zx-destination-feature,.screen.zx.journey-prep .route-binding .zx-destination-hero{height:115px;min-height:115px}
 .screen.zx.journey-prep .route-binding .zx-destination-hero>.zx-station-print{height:71px}
}
.zx.zx-square-hud .zx-world-status.weather-clock{width:94px;height:29px;background:#302B34}
.zx.zx-square-hud .zx-world-status.weather-clock>b,.zx.zx-square-hud .zx-world-status.weather-clock>span,.zx.zx-square-hud .zx-world-status>.zx-weather-time{display:none}
.zx.zx-square-hud .zx-world-status.weather-clock>.zx-event-mark{left:8px;top:5px;width:19px;height:19px}
.zx.zx-square-hud .zx-world-status.weather-clock>.zx-weather-time{position:absolute;display:block;left:32px;top:0;width:57px;height:29px;z-index:1}
.zx .zx-combat-feed>.zx-arrival,.zx .zx-combat-feed>.zx-scene-bulletin{align-self:flex-start}
.zx .zx-arrival-copy>small,.zx .zx-bulletin-title>small{color:#F2C859}
.zx .zx-arrival-copy>b,.zx .zx-bulletin-title>b{color:#FFF8E9}
.zx .zx-bulletin-title>small{background:#4D414B}
.zx .zx-bulletin-copy>span{color:#E6DDD2}
html.zixing .zx-toast-layer .toasts>.toast,html.zixing .run-hint.zx-hint,.zx .zx-portal-guide{background:#342E36;color:#FFF8E9;border:0;border-left:3px solid #ECC358;border-radius:0}
.zx-toast-layer .toast .zx-note-tab{display:none}
.zx .zx-portal-guide>b,html.zixing .run-hint.zx-hint .zx-hint-title{color:#F8D26E}
.zx .zx-portal-guide>.zx-note,html.zixing .run-hint.zx-hint .zx-hint-text{color:#F2EADC}
.zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{min-height:82px;gap:0;padding:2px;border:0;border-radius:0}
.zx-level-up .zx-upgrade-art{position:relative;align-self:stretch;width:23%;min-width:54px;justify-content:center;padding:0 0 11px}
.zx-level-up .zx-upgrade-art>.zx-loadout-icon,.zx-level-up .zx-upgrade-art>.zx-glyph{width:55px;height:55px;max-width:94%;object-fit:contain}
.zx-level-up .zx-level-stamp{position:absolute;left:4px;bottom:4px;align-self:flex-start;padding:0 5px;background:#3C343C;color:#FFF6E7;font-size:11px;line-height:15px;font-weight:700}
.zx-level-up .zx-upgrade-copy{padding:0;gap:0}
.zx-level-up .zx-level-head{display:flex;flex-direction:column;align-items:flex-start;align-self:stretch;gap:0;flex:none;padding:3px 14px 4px 8px;background:#2B262E;clip-path:polygon(0 0,100% 0,100% 48%,97% 69%,99% 69%,94% 100%,0 100%)}
.zx-level-up .zx-level-head.buff{align-self:flex-start;min-width:73%;max-width:100%;clip-path:polygon(0 0,100% 0,100% 73%,94% 100%,0 100%)}
.zx-level-up .zx-level-kind{font-size:11px;line-height:14px;font-weight:700;color:#E2D4BA}
.zx-level-up .zx-offer .zx-level-head>.zx-choice-title{flex:none;color:#FFF6E6;font-size:19px;line-height:23px}
.zx-level-up .zx-upgrade-effects{width:auto;align-self:stretch;margin:0;padding:4px 8px 5px;gap:2px;border:0}
.zx-level-up .zx-upgrade-metric{display:flex;align-items:center;gap:5px;min-width:0;flex:none;color:#302831;font-size:14px;line-height:18px;font-weight:700}
.zx-level-up .zx-metric-leader{height:1px;border-bottom:1px dotted #A89AA0;flex:1}
.zx-level-up .zx-upgrade-metric>strong{color:#3A303A;font-size:15px;line-height:18px}
.zx-level-up .zx-upgrade-effects>.zx-choice-description{padding:0;color:#322B32;font-size:14px;line-height:18px}
.zx-level-up .zx-upgrade-effects>.zx-offer-note{font-weight:400;font-size:12px;line-height:16px}
@media(max-height:660px){
 .zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{min-height:70px}
 .zx-level-up .zx-offer .zx-level-head>.zx-choice-title{font-size:17px;line-height:20px}
 .zx-level-up .zx-upgrade-metric,.zx-level-up .zx-upgrade-metric>strong,.zx-level-up .zx-upgrade-effects>.zx-choice-description{font-size:13px;line-height:16px}
 .zx-level-up .zx-upgrade-effects{padding:3px 7px;gap:1px}
 .zx-level-up .zx-upgrade-art>.zx-loadout-icon,.zx-level-up .zx-upgrade-art>.zx-glyph{width:47px;height:47px}
}

`;
