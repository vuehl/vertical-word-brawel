// Approved UI review, scoped to battle HUD and scene interaction dialogs.
export const summonerBarColors={fill:'#5394CE',accent:'#9CD9FC'};
export const battleReviewStyle=`
.zx-review-overlay{padding:12px;align-items:center;justify-content:center}

.zx-hud-counters{left:2px;right:50px;top:111px;height:32px;gap:4px}
.zx-hud-counter{flex:1;min-width:0;height:32px;padding:0 5px;gap:3px;border-color:#c8d1c1;border-radius:16px;background:#fffdf4}
.zx-hud-counter:first-child{flex:none;padding:0 5px}
.zx-hud-clock,.zx-hud-gold,.zx-hud-score{width:auto;min-width:0;max-width:none;font-size:15px;line-height:1.2;white-space:nowrap;flex:none}
.zx-hud-gold,.zx-hud-score{color:#786339}
.zx-hud-counter>.zx-icon{width:14px!important;height:14px!important}
html.zixing .zx-review-boss{position:absolute;top:157px;left:2px;right:148px;width:auto;min-width:0;min-height:42px;max-width:340px;margin:0;padding:6px 7px;gap:5px;border:1px solid #c8d1c1;border-radius:8px;background:#fffdf4;box-shadow:0 2px 0 #8e9a7955;transform:none!important;pointer-events:none}
html.zixing .zx-review-boss .bb-pt{width:22px;height:24px;flex:none;margin:0;border:0;box-shadow:none;background:transparent}
html.zixing .zx-review-boss .bb-body{flex:1;min-width:0;padding:0;border:0;border-bottom:0;box-shadow:none;background:transparent;gap:0}
html.zixing .zx-review-boss .bb-head{height:18px;min-width:0;gap:4px;padding:0 56px 0 0;display:flex;align-items:center}
html.zixing .zx-review-boss .bb-name{font-size:14px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#504d44}
html.zixing .zx-review-boss .bb-tag{display:block;flex:none;background:transparent;color:#6a675b;font-size:13px;line-height:18px;padding:0}
html.zixing .zx-review-boss .bb-rage{font-size:12px;padding:0;color:#be4935;background:transparent}
html.zixing .zx-review-boss .bb-bar{position:relative;height:6px;min-height:6px;margin:4px 0 0;border:0;border-radius:3px;background:#e6decc;overflow:visible}
html.zixing .zx-review-boss .bb-bar>i{background:#cc5945;border-radius:3px}
html.zixing .zx-review-boss .bb-bar>u{background:#e8b55a;border-radius:3px}
html.zixing .zx-review-boss .bb-bar>b{position:absolute;top:-22px;right:0;left:auto;bottom:auto;font-size:13px;line-height:18px;transform:none;color:#be4935;text-shadow:none;padding:0;white-space:nowrap}
html.zixing .zx-review-boss .bb-foot{margin-top:5px;gap:3px;font-size:12px;line-height:16px}
html.zixing .zx-review-boss .bb-sub{font-size:12px;line-height:16px;padding:0;color:#73583c;white-space:normal}
html.zixing .zx-review-boss.immune .bb-bar>i{background:repeating-linear-gradient(135deg,#c8c8d8 0px,#c8c8d8 8px,#a8a8b8 8px,#a8a8b8 16px)}
html.zixing .zx-review-boss.shield .bb-bar>i{background:#6ac0ff}
.zx canvas.zx-review-capture-flag{position:absolute;top:157px;right:2px;width:140px;height:36px;pointer-events:none;z-index:3}
html.zixing .zx-review-arrival{position:absolute;left:0;right:0;top:182px;height:186px;z-index:70;pointer-events:none}
html.zixing canvas.zx-review-boss-art{position:absolute;left:0;top:0;width:100%;height:186px;pointer-events:none}
html.zixing .zx-modal.zx-review-dialog{font-family:inherit;color:#302d3d;background:#f8f5e9;border:1px solid #b8c6ac;border-radius:18px;box-shadow:0 4px 0 #899579;padding:18px 14px;gap:14px;width:100%;max-width:440px;min-height:0;max-height:100%;overflow:hidden;text-align:left;align-items:stretch;font-size:14px;line-height:1.5}
html.zixing .zx-review-dialog *{box-sizing:border-box;text-shadow:none;letter-spacing:0}
.zx-review-heading{display:flex;flex-direction:column;gap:4px;flex:none}
html.zixing .zx-review-dialog h1{font-size:22px;line-height:1.3;margin:0;padding:0;color:#373445;text-align:left;background:transparent;box-shadow:none;transform:none}
html.zixing .zx-review-dialog h2{font-size:17px;line-height:1.4;margin:0;color:#343b43}
.zx-review-note{font-size:14px;line-height:1.5;color:#69786b;margin:0;white-space:normal}
.zx-review-content{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;overflow-y:auto;gap:12px}
.zx-review-content>*{flex-shrink:0}
html.zixing .zx-review-dialog>.zx-review-content{flex-shrink:1}
html.zixing .zx-review-companion-select>*{flex-shrink:0}
.zx-review-footer{display:flex;align-items:stretch;justify-content:center;gap:10px;flex:none;padding-top:4px}
.zx-review-footer>.zx-review-button{flex:1}
html.zixing .zx-review-button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:8px 12px;font-size:16px;line-height:1.4;font-family:inherit;font-weight:700;color:#52634e;background:#eaf0df;border:1px solid #b8c6ac;border-radius:11px;box-shadow:0 2px 0 #b8c6ac;cursor:pointer}
html.zixing .zx-review-button.primary{color:#fffdf5;background:#759277;border-color:#5e7c61;box-shadow:0 3px 0 #536e56}
html.zixing .zx-review-button:disabled{background:#e4e6dc;border-color:#c9cdc0;color:#7a8475;opacity:1;box-shadow:none;cursor:default}
.zx-review-section{display:flex;flex-direction:column;gap:10px;padding:12px;background:#fffdf6;border:1px solid #d0d8c3;border-radius:12px}
.zx-review-recipe{background:#fffef8;border:1px solid #c9d4bd;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px}
.zx-review-recipe.selected,.zx-review-companion.selected{background:#fff3cf;border:2px solid #c4a254}
.zx-review-recipe-select{cursor:pointer;display:flex;flex-direction:column;gap:10px;min-height:44px}
.zx-review-choice-head{display:flex;align-items:center;gap:8px;min-height:25px}
.zx-review-choice-head>h2{flex:1;min-width:0;font-size:16px}
.zx-review-check{width:21px;height:21px;border:1px solid #aabb9d;border-radius:50%;background:#fff;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;line-height:19px}
.zx-review-check.on{background:#b6984b;border-color:#b6984b}
.zx-review-tag{margin-left:auto;flex:none;font-size:13px;line-height:1.5;padding:2px 6px;border-radius:7px;background:#e9eddf;color:#71816c;white-space:nowrap}
.zx-review-tag.ready{background:#fae7ae;color:#88702d}
.zx-review-formula{display:flex;align-items:center;justify-content:space-between;gap:4px;width:100%}
.zx-review-ingredient{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;flex:1;min-width:0}
.zx-review-ingredient>b{font-size:14px;line-height:1.4;font-weight:500}
.zx-review-ingredient>small{font-size:13px;line-height:1.4;color:#9b6750}
.zx-review-ingredient>small.ready,.zx-review-slot-change .ready{color:#4a8063}
.zx-review-skill-art{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid #c9d5bb;border-radius:12px;background:#edf2de}
.zx-review-skill-art.result{width:54px;gap:0;background:#e9edcf}
.zx-review-operator{font-size:22px;color:#8fa087;flex:none}
.zx-review-recipe-foot{display:flex;align-items:center;gap:8px;border-top:1px solid #dce1ce;padding-top:8px}
.zx-review-recipe-foot>.zx-review-note{flex:1;min-width:0;font-size:13px}
.zx-review-recipe-foot>.zx-review-button{flex:none}
html.zixing canvas.zx-review-search{position:static;width:20px;height:20px;flex:none;pointer-events:none}
.zx-review-description{font-size:15px;line-height:1.7;color:#484f4c;margin:0}
.zx-review-slot-change{display:flex;align-items:center;gap:14px;justify-content:center;font-size:16px}
html.zixing .zx-review-dialog .mp-nums{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;justify-content:flex-start}
html.zixing .zx-review-dialog .mp-nums>span{flex:1;min-width:86px;display:flex;flex-direction:column;gap:3px;background:#eef1e3;padding:8px;border-radius:8px;font-size:18px;color:#416c52}
html.zixing .zx-review-dialog .mp-nums i{font-size:13px;color:#72806d;font-style:normal}
html.zixing .zx-review-dialog .fi-tags{display:flex;flex-wrap:wrap;gap:5px}
html.zixing .zx-review-dialog .fi-tags>span{font-size:13px}
html.zixing .zx-review-dialog .fi-warn{font-size:14px;color:#986446}
.zx-review-companions{display:flex;gap:10px;align-items:stretch}
.zx-review-companion{flex:1;min-width:0;background:#fffef7;border:1px solid #c9d4bd;border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:10px}
html.zixing .zx-review-button.zx-review-companion-select{border:0;box-shadow:none;background:transparent;padding:0;display:flex;flex-direction:column;gap:8px;align-items:stretch;flex:1 1 auto}
.zx-review-companion-art{display:flex;align-items:center;justify-content:center;height:86px;width:100%}
html.zixing .zx-review-companion-art canvas{position:static;width:84px;height:84px;flex:none}
.zx-review-companion h2{text-align:center}
.zx-review-companion .zx-review-note{font-size:14px;text-align:left;font-weight:500}
.zx-review-type-row{display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap}
.zx-review-reward{background:#edf1dc;border:1px solid #c6d1b4;border-radius:10px;padding:10px}
.zx-review-stats{display:flex;flex-wrap:wrap;gap:10px;font-size:15px}
.zx-review-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 14px;min-height:92px;background:#eef0e3;border:1px dashed #c5cfb7;border-radius:12px;color:#6b7c63;font-size:14px;text-align:center;white-space:normal}
html.zixing .zx-review-dialog .cards{display:flex;flex-direction:column;flex-wrap:nowrap;width:100%;gap:10px;padding:0;align-items:stretch;overflow:visible}
html.zixing .zx-review-dialog .cards>.card{width:100%;max-width:none;min-height:0;flex:none;display:flex;flex-direction:row;text-align:left}
html.zixing .zx-review-dialog .card .top{width:76px;min-width:76px;min-height:94px;height:auto;flex:none;align-self:stretch}
html.zixing .zx-review-dialog .card .bd{flex:1;min-width:0}
html.zixing .zx-review-legacy-footer{flex-direction:column;gap:8px}
html.zixing .zx-review-legacy-footer>*{flex:none;width:100%}
html.zixing .zx-review-legacy-footer .btn{width:100%;position:relative;bottom:auto;margin:0}
html.zixing .zx-review-forget .panel{width:100%;padding:0!important;max-height:none!important;overflow:visible}
html.zixing .zx-review-forget .item-row{flex-wrap:wrap}
html.zixing .zx-review-forget .item-row>.grow{min-width:130px;flex:1}
html.zixing .zx-review-forget .item-row>.btn{width:100%}
html.zixing .zx-review-forget .item-row .ic{width:32px;height:32px}
html.zixing .zx-review-dialog .card{border:1px solid #c8d4bb;background:#fffdf5;color:#343d36;border-radius:12px;box-shadow:none;opacity:1}
html.zixing .zx-review-dialog .card:disabled{opacity:1;background:#f0f0e6;filter:none;color:#76816f}
html.zixing .zx-review-dialog .card .bd{padding:10px;gap:7px}
html.zixing .zx-review-dialog .card h3{font-size:17px;line-height:1.3;color:#343d36}
html.zixing .zx-review-dialog .card p,html.zixing .zx-review-dialog .card .cap{font-size:14px;line-height:1.5;color:#6c7967}
html.zixing .zx-review-dialog .btn{min-height:44px;font-size:16px;border-radius:10px;background:#e7eddb;color:#52694e;border:1px solid #b9c6aa;box-shadow:0 2px 0 #b9c6aa}
html.zixing .zx-review-dialog .btn:disabled{opacity:1;background:#e8e9df;color:#828a7b;box-shadow:none}
html.zixing .zx-review-dialog .help{font-size:14px;color:#6d7c66;text-align:left}
html.zixing .zx-review-dialog .kind.price{font-size:14px;line-height:1.4;white-space:normal}
html.zixing .zx-review-dialog .item-row{background:#fffdf6;border:1px solid #c9d4bd;border-radius:10px;padding:10px;gap:8px}
html.zixing .zx-review-dialog .item-row h4{font-size:16px;line-height:1.4}
html.zixing .zx-review-dialog .item-row .muted{font-size:14px;line-height:1.4}
/* Boss, team and short-lived events share one vertical flow below the counters. */
.zx-hud-paper .zx-combat-feed{position:absolute;top:149px;left:2px;right:2px;display:flex;flex-direction:column;pointer-events:none}
html.zixing .zx-combat-feed .zx-review-boss{position:relative;top:0;left:0;right:auto;width:100%;max-width:none;min-height:0;margin:0 0 4px;padding:5px 9px;gap:7px;border:1px solid #A5B2CA;border-left:4px solid #B96777;border-radius:3px;background:#EFEDF6;color:#303955;box-shadow:none}
html.zixing .zx-combat-feed .bb-name{color:#303955}
html.zixing .zx-combat-feed .bb-head{padding-right:86px}
html.zixing .zx-combat-feed .bb-tag,html.zixing .zx-combat-feed .bb-sub{color:#536481}
html.zixing .zx-combat-feed .bb-rage,html.zixing .zx-combat-feed .bb-bar>b{color:#943C56}
html.zixing .zx-combat-feed .bb-bar{background:#D8DDEB}
html.zixing .zx-combat-feed .zx-review-boss:not(.shield):not(.immune) .bb-bar>i{background:#C36879}
html.zixing .zx-combat-feed .zx-review-boss{gap:8px;padding:5px 9px 7px 8px;border:0;border-radius:3px;background:#3E4D69;align-items:center}
html.zixing .zx-combat-feed .zx-review-boss .bb-pt{width:34px;height:36px;display:flex;align-items:center;justify-content:center;background:#E7CCD7;border:0;padding:3px}
html.zixing .zx-combat-feed .zx-review-boss .bb-pt>img,html.zixing .zx-combat-feed .zx-review-boss .bb-pt>canvas{width:26px;height:26px;object-fit:contain}
html.zixing .zx-combat-feed .zx-review-boss .bb-body{min-height:0;gap:0;align-self:flex-start}
html.zixing .zx-combat-feed .zx-review-boss .bb-name{font-size:15px;line-height:19px;color:#F3F1FA}
html.zixing .zx-combat-feed .zx-review-boss .bb-tag{color:#D2DDEC;font-size:11px;line-height:16px}
html.zixing .zx-combat-feed .zx-review-boss .bb-rage{color:#FFE4E8;background:#9E576B;padding:0 4px;line-height:16px;margin:0}
html.zixing .zx-combat-feed .zx-review-boss .bb-bar{height:9px;min-height:9px;margin:4px 0 0;border-radius:2px;background:#29364E}
html.zixing .zx-combat-feed .zx-review-boss .bb-bar>b{color:#F4E6EE;font-size:14px;line-height:18px}
html.zixing .zx-combat-feed .zx-review-boss:not(.shield):not(.immune) .bb-bar>i{background:linear-gradient(90deg,var(--boss-fill,#B96882),var(--boss-accent,#E797A3))}
html.zixing .zx-combat-feed .zx-review-boss .bb-bar>u{background:#D9B2AE}
html.zixing .zx-combat-feed .zx-review-boss .bb-foot{min-height:0;margin-top:3px}
html.zixing .zx-combat-feed .zx-review-boss .bb-sub{color:#E3DDEA}
.zx-combat-feed .totem{--boss-fill:#DEA33D;--boss-accent:#F8D373;--boss-seal-edge:#9D763D;--boss-seal-face:#FFF1CF}
.zx-combat-feed .summoner{--boss-fill:${summonerBarColors.fill};--boss-accent:${summonerBarColors.accent};--boss-seal-edge:#527494;--boss-seal-face:#E2F2FC}
html.zixing .zx-combat-feed .zx-review-boss.mini{margin:0;padding:6px 10px 8px 11px;opacity:1}
html.zixing .zx-combat-feed .mini .bb-pt{border-radius:5px;background:var(--boss-seal-face)}
html.zixing .zx-combat-feed .mini .bb-tag{background:#2C3951;color:var(--boss-accent);border-radius:2px;padding:0 4px;letter-spacing:0}
html.zixing .zx-combat-feed .mini .bb-bar>u{background:var(--boss-seal-face)}
html.zixing .zx-combat-feed .mini .bb-bar>b{color:#FAF7F0}
html.zixing .zx-combat-feed .mini .bb-sub,html.zixing .zx-combat-feed .mini .bb-sti>b{color:#DFE7F3;letter-spacing:0}
html.zixing .zx-combat-feed .mini .bb-sub.move{color:var(--boss-accent)}
.zx-guide-pin>.cp-tip{position:absolute;left:0;top:0;width:0;height:0;border:0!important;background:transparent;transform:none!important;overflow:visible;filter:none}
.zx-guide-pin>.cp-tip>.zx-guide-needle{position:absolute;left:-32px;top:-32px;width:64px;height:64px;pointer-events:none}
.zx-guide-pin>.cp-ic{left:-17px;top:-17px;width:34px;height:34px;transform:none!important;animation:none;filter:none}
.zx-guide-pin .mapbadge{display:flex;align-items:center;justify-content:center;width:34px;height:34px;overflow:visible;border:0;border-radius:7px;background:#E9EEF7;box-shadow:none}
.zx-guide-pin .mapbadge>canvas,.zx-guide-pin .mapbadge>img{height:23px;width:23px;object-fit:contain}
.zx-guide-pin>.cp-d{top:19px;min-width:38px;padding:1px 5px 3px;font-size:11px;line-height:15px;color:#374C6C;background:#E8EDF6;border:0;border-radius:2px;box-shadow:none;white-space:nowrap}
.zx-combat-feed .coop-team{position:relative;left:0!important;top:0!important;width:100%;flex-direction:row;align-items:flex-start;gap:6px;scale:1}
.zx-combat-feed .coop-mate{flex:1;min-width:0;max-width:50%;height:auto;min-height:43px;padding:2px 4px 4px;gap:4px;background:#E8ECF5;border-bottom:2px solid #90A5C5;border-radius:3px}
.zx-combat-feed .coop-med{width:32px;height:32px;box-shadow:none}
.zx-combat-feed .coop-med>img{inset:2px;width:28px;height:28px;border-width:1px}
.zx-combat-feed .coop-lvl{left:50%;bottom:-3px;padding:0 3px;font-size:10px;background:#455A80;color:#F3F1FA;box-shadow:none;transform:translateX(-50%)}
.zx-combat-feed .coop-plate{flex:1;min-width:0;margin:0;padding:0;gap:1px}
.zx-combat-feed .coop-plate:before,.zx-combat-feed .coop-plate:after{display:none}
.zx-combat-feed .coop-plate>b,.zx-combat-feed .coop-plate>small{color:#394766;text-align:left}
.zx-combat-feed .coop-plate>small{white-space:normal;font-size:11px;line-height:13px}
.zx-combat-feed .coop-bar{height:12px;margin:0}
.zx-combat-feed .coop-mate.down small{color:#963D57}
.zx-combat-feed .zx-combat-feedback{display:flex;align-items:flex-start;justify-content:flex-end;gap:4px}
.zx-combat-feedback .evpill{flex:1;width:auto;margin:3px 0 0;padding:3px 7px;border-radius:3px;box-shadow:none;background:#384569;animation:none}
.zx-combat-feedback .evpill>b{color:#F3F1FA}
.zx .zx-combat-feed canvas.zx-review-capture-flag{position:relative;top:0;right:0;margin-top:3px;width:126px;height:32px;flex:none}
@media(max-width:350px){.zx-hud-paper .zx-combat-feed{top:180px}}
@media(max-width:350px){
.zx-hud-counters{top:137px;left:0;right:50px;gap:4px}
.zx-hud-counter{min-width:0;padding:0 5px;gap:3px}
.zx-hud-counter:first-child{position:absolute;left:0;top:-38px;height:32px;min-width:66px}
.zx-hud-clock,.zx-hud-gold,.zx-hud-score{font-size:14px}
html.zixing .zx-review-boss{top:177px;left:0;right:0;width:auto;max-width:none}
.zx canvas.zx-review-capture-flag{top:233px;right:2px}
html.zixing .zx-review-arrival{top:228px}
html.zixing .zx-modal.zx-review-dialog{padding:14px 12px;gap:12px;width:100%}
.zx-review-recipe{padding:10px}.zx-review-choice-head{gap:6px}.zx-review-choice-head>h2{font-size:15px}.zx-review-tag{font-size:12px;padding:2px 5px}
.zx-review-companion{padding:8px}.zx-review-companion .zx-review-choice-head{gap:3px}.zx-review-companions{gap:8px}
}
`;

