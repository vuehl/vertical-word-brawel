export const firstBatchStyle=`
.zx.screen.zc-library{background:var(--paper-navy);color:var(--paper-ink)}
.zc-library>.zx-header{position:relative;flex:none;padding:8px 4px 20px;border:0;border-top:0;color:var(--paper-paper)}
.screen.zc-library .zc-header-cutout{position:absolute;right:-8px;top:0;width:78%;height:105px;object-fit:fill;pointer-events:none}
.zc-library .zc-title-ribbon{position:absolute;left:-9px;top:4px;width:193px;height:43px;object-fit:fill;pointer-events:none}

.zc-library>.zx-header small{position:relative;font-size:14px;line-height:18px;margin:5px 0 0 11px;color:var(--paper-paper);font-weight:700}
.zc-library>.zx-body{gap:0;overflow:visible;overflow-y:visible;overflow-x:visible}
.zc-library-paper{flex:1;min-height:0;display:flex;flex-direction:column;gap:0;padding:0 12px 10px;background:var(--paper-paper)}
.zc-collection-progress{position:relative;margin:-24px 19px 2px 23px;display:flex;align-items:center;gap:4px;padding:4px 17px 8px 59px;min-height:58px;flex:none;background:#F1F3F9}
.zc-progress-photo{position:absolute;left:-6px;top:-9px;width:65px;height:73px;pointer-events:none}
.zc-progress-photo>.zc-cutout{position:absolute;top:12px;left:5px;width:52px;height:42px;object-fit:contain}
.zc-progress-copy{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}
.zc-progress-label{display:flex;justify-content:space-between;gap:5px;font-size:15px;line-height:20px;color:var(--paper-ink)}
.zc-library .zc-progress{height:6px;border:0;border-radius:2px;background:#DCDEEF}
.zc-library .zc-progress>span{background:#4277CC}
.zx.zc-library .zc-filters{flex:none;background:transparent;border:0;border-radius:0;padding:0;align-items:stretch;gap:1px;margin-bottom:1px}
.zx-collection.zc-library .zc-filter{min-height:44px;border:0;border-radius:0;background:#E2E9F6;color:var(--paper-ink);font-size:14px;padding:0 2px}
.zx-collection.zc-library .zc-filter.active{background:#CB5D6B;color:var(--paper-paper)}
.zx-collection.zc-library .zc-search-button{background:transparent;width:47px;min-height:44px;padding:0}
.zc-library .zx-paper-icon{width:38px;height:34px;flex:none}
.zc-library-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:1px 0 4px}
.zc-library-scroll::-webkit-scrollbar{display:none}
.zc-library-scroll>.zc-grid-row{height:clamp(76px,20.5vw,82px);flex:none;gap:4px}
.zx-collection.zc-library .zc-character{position:relative;height:100%;min-height:44px;border:0;border-radius:0;background:transparent;padding:0;overflow:hidden;color:var(--paper-ink)}
.zc-photo-paper{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zc-library .zc-tag{right:5px;top:5px;width:auto;height:14px;display:flex;align-items:center;gap:1px;font-size:11px;line-height:14px;padding:0 3px;border:0;border-radius:2px;background:var(--paper-paper);color:var(--paper-ink);font-weight:700}
.zc-library .zc-tag>.zx-icon{flex:none;max-width:9px;max-height:9px}
.zc-library .zc-character .zc-cutout{position:absolute;left:0;top:8px;height:47px;width:100%;flex:none;min-height:0}
.zc-library .zc-character.locked .zc-cutout{opacity:.35}
.zc-library .zc-card-name{position:absolute;bottom:4px;left:0;width:100%;font-size:13px;line-height:17px;text-align:center}
.zc-library .zc-mystery{position:absolute;top:13px;left:0;width:100%;height:38px;flex:none;color:#6E7990;font-size:31px;line-height:36px}
.zc-library .zc-card-check{left:0;top:0;width:22px;height:22px;z-index:1;border-radius:50%;background:#DA7278;border:1px solid var(--paper-paper)}
.zc-library .zc-new{left:4px;right:auto;top:2px;bottom:auto;background:#C15A68;color:var(--paper-paper);font-size:12px;line-height:16px}
.zc-library .zc-query{height:32px;padding:0 4px;gap:4px}
.zc-library .zc-query .zc-note{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zc-library .zc-note{color:#4D576C}
.zc-library .zc-empty{min-height:120px;padding:6px}
.zx-collection.zc-library>.zx-footer{position:relative;z-index:1;background:var(--paper-paper);border:0;padding:8px 14px 12px;margin:4px 0 5px;gap:3px}
.zc-library .zc-summary{min-height:60px;background:transparent;border:0;padding:0;gap:6px}
.zc-library .zc-summary-name>b{color:var(--paper-ink);align-self:flex-start;background:#DCE5F2;padding:0 11px}
.zc-library .zc-summary-name>small{color:#3F435E}
.zc-library .zc-summary>.zc-cutout{width:48px;height:49px;border-right:1px solid #D1D4E2}
.zc-library .zc-summary .zc-text{flex-direction:column;gap:1px;width:58px;padding:0;color:var(--paper-ink);font-size:14px;line-height:17px}
.zc-library .zc-actions{gap:8px}
.zx-collection .zc-grid.intro>.zc-character{background:transparent;border:0;padding:0}
.zc-grid.intro .zc-character>.zc-cutout{position:absolute;left:10%;top:19%;width:80%;height:50%;flex:none}
.zc-grid.intro .zc-card-name{position:absolute;left:0;bottom:8%;width:100%;text-align:center;color:var(--paper-ink)}
.zc-grid.intro .zc-tag{top:9%;right:10%;width:auto;height:18px;padding:0 4px;color:var(--paper-ink);background:var(--paper-paper);font-size:12px}
.zc-grid.intro .zc-card-check{top:7%;left:4%;background:#D26E78;border-radius:10px}
.zx-collection.zc-library .zc-actions>.zc-back,.zx-collection.zc-library .zc-actions>.zc-primary{position:relative;min-height:49px;border-radius:1px;box-shadow:none;border:1px solid #C3CADE;border-bottom:3px solid #A8B1D0}
.zx-collection.zc-library .zc-actions>.zc-back{width:68px;color:var(--paper-ink);background:#E9EBF4}
.zx-collection.zc-library .zc-actions>.zc-primary{color:var(--paper-paper);border-color:#356FBC;border-bottom:3px solid #37589E;background:linear-gradient(90deg,#518ECD,#3468BC);font-size:17px}
@media(max-height:660px){
.zc-library-scroll>.zc-grid-row{height:62px}
.zc-library .zc-character .zc-cutout{height:40px;top:7px}
.zc-library .zc-mystery{top:7px;height:35px}
.zc-library>.zx-header{padding-bottom:13px}
.zx-collection.zc-library .zc-actions>.zc-back,.zx-collection.zc-library .zc-actions>.zc-primary{min-height:48px}
}
@media(max-width:350px){
.zc-library .zc-title-ribbon{left:-6px}
.screen.zc-library .zc-header-cutout{right:-6px}
.zc-library-paper{padding-left:7px;padding-right:7px}
.zx-collection.zc-library>.zx-footer{padding-left:11px;padding-right:11px}
}

.zx-modal-wrap.zx-upgrade-scrim{background:#1F293E9E}
.zx-modal.zx-first-batch-upgrade{padding:4px 0 6px;gap:19px;background:transparent;border:0;border-radius:0;box-shadow:none}
.zx.zx-modal-wrap.zx-saved-wrap{background:rgba(25,32,53,.85)}
.zx.zx-modal.zx-saved-run{display:flex;width:100%;max-width:350px;max-height:100%;padding:0;gap:6px;background:transparent;border:0;border-radius:0;box-shadow:none}
.zx .zx-saved-run>.zx-saved-body{padding:0;gap:9px}
.zx .zx-receipt{position:relative;width:100%;min-height:142px;display:flex;flex-direction:column;justify-content:center;padding:0}
.zx .zx-receipt-paper,.zx .zx-arrival-face{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx .zx-receipt-content{position:relative;padding:14px 14px 17px 25%;display:flex;flex-direction:column;align-items:stretch;gap:9px}
.zx .zx-receipt-status{font-size:19px;line-height:24px;color:#344766}
.zx .zx-receipt-metrics{display:flex;align-items:stretch;gap:6px;padding:4px 0 6px;border-bottom:1px solid #B8C5D6}
.zx .zx-receipt-stat{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start}
.zx .zx-receipt-stat:last-child{flex:.8}
.zx .zx-receipt-stat>span{color:#556782;font-size:12px;line-height:17px}
.zx .zx-receipt-stat>b{font-size:19px;line-height:25px;color:#263650;white-space:nowrap}
.zx .zx-receipt-note{color:#52647E;font-size:13px;line-height:19px;margin:0}
.zx-saved-run .zx-saved-rewards{justify-content:center;flex-wrap:wrap}
.zx .zx-combat-feed>.zx-arrival{position:relative;left:auto;right:auto;top:auto;display:flex;flex:none;align-self:center;align-items:flex-start;justify-content:center;width:248px;max-width:94%;height:54px;padding:0;margin:8px 0 0;gap:0;background:transparent;border:0;border-radius:0;pointer-events:none}
.zx .zx-arrival-copy{position:relative;display:flex;flex-direction:column;align-items:flex-start;padding:1px 15px 4px 60px;gap:0}.zx .zx-arrival-copy>small,.zx .zx-arrival-copy>b{text-align:left}
.zx .zx-arrival-copy>small{color:#D3E1F0;font-size:11px;line-height:15px}
.zx .zx-arrival-copy>b{color:#F3F1FA;font-size:19px;line-height:24px}
.zx .zx-reward-print{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx .zx-blessing-dialog .zx-choice-list>button.zx-blessing-option{position:relative;display:flex;flex-direction:column;align-items:stretch;min-height:0;height:auto;padding:0;margin:0;gap:0;border:0;background:transparent;box-shadow:none}
.zx .zx-blessing-row{position:relative;display:flex;flex-direction:row;align-items:center;width:100%;min-height:84px;padding:6px 1px 10px;gap:0}
.zx .zx-blessing-seal{display:flex;align-items:center;justify-content:center;width:17%;flex:none}
.zx .zx-blessing-seal>img{width:37px;height:37px;object-fit:contain;image-rendering:pixelated}
.zx .zx-blessing-label{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;justify-content:center;padding:0 8px;gap:3px}
.zx .zx-blessing-label>b,.zx .zx-blessing-amount{font-size:18px;line-height:23px;font-weight:800;color:#293953}
.zx .zx-blessing-amount{width:26%;flex:none;text-align:center;white-space:nowrap}
.zx .zx-blessing-dialog .zx-choice-actions>.zx-choice-stats{width:164px;min-width:164px}
.zx.zx-modal-wrap.zx-loot-scrim{background:rgba(23,30,48,.82)}
.zx .zx-combat-shell>.zx-loot-dialog{display:flex;align-items:stretch;padding:0 9px 8px;gap:13px;background:transparent;border:0;border-radius:0;box-shadow:none}
.zx .zx-loot-dialog .zx-item-body{gap:0;padding:0;scrollbar-width:none}
.zx .zx-loot-display{position:relative;display:flex;flex-direction:column;align-items:stretch;width:100%;padding:0}
.zx .zx-loot-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:135px;flex:none}
.zx .zx-loot-stage>.zx-item-image{height:126px;width:126px;object-fit:contain;image-rendering:pixelated}
.zx .zx-loot-leaf{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:7px;padding:8px 18px 17px}
.zx .zx-loot-name{display:flex;align-items:center;gap:9px}
.zx .zx-loot-name>h3{color:#293953;font-size:22px;line-height:28px;margin:0}
.zx .zx-loot-name>.zx-quality-badge,.zx .zx-blessing-label>.zx-quality-badge{align-self:flex-start;font-size:12px;line-height:18px;min-height:20px;padding:1px 7px;color:#F3F1FA;border:0;border-radius:0}
.zx .zx-loot-name>.zx-quality-badge{align-self:center}
.zx .zx-loot-copy{display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.zx .zx-loot-copy>p,.zx .zx-loot-dialog .zx-item-note{padding:0;margin:0;background:transparent;border:0;color:#485A70;font-size:14px;line-height:20px;text-align:left}
.zx .zx-loot-copy>p:first-child{color:#2F4561;font-size:16px;line-height:22px;font-weight:800}
.zx .zx-loot-stage>.zx-loot-fit{position:absolute;left:10px;top:9px;padding:3px 8px;background:#555974;color:#F3F1FA;font-size:12px;line-height:16px;font-weight:800}
.zx .zx-loot-copy>.zx-loot-beneficiaries{color:#526A87;font-size:13px;line-height:18px}
.zx .zx-loot-copy>.zx-loot-story{font-size:14px;line-height:21px;color:#536171}
.zx .zx-loot-limit{align-self:stretch;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #BFCBD2;padding:5px 0 0;margin-top:3px}
.zx .zx-loot-limit>span,.zx .zx-loot-limit>b{font-size:12px;line-height:17px;color:#56697D}.zx .zx-loot-limit>b{font-size:14px;color:#384D66}
.zx .zx-loot-dialog .zx-item-actions{border:0;border-top:0;padding:0}
.zx .zx-item-dialog .zx-item-actions>.zx-button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;height:48px;min-height:48px;max-height:48px;padding:0 6px}
.zx .zx-action-line{display:block;flex:none;text-align:center;white-space:nowrap}
.zx.zx-modal-wrap.zx-fusion-list,.zx.zx-modal-wrap.zx-fusion-preview{background:rgba(23,30,48,.82)}
.zx .zx-combat-shell>.zx-review-dialog.zx-fusion-list,.zx .zx-combat-shell>.zx-review-dialog.zx-fusion-preview{width:100%;max-width:362px;align-self:center;padding:0 4px;gap:10px;border:0;border-radius:0;box-shadow:none;background:transparent}
.zx .zx-fusion-list .zx-review-fusion-list,.zx .zx-fusion-preview .zx-review-content{flex:0 1 auto;gap:10px;padding:0 2px 3px;scrollbar-width:none}
.zx .zx-fusion-slip{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:12px 12px 14px 23px;background:#EAEFF6;border:0;border-left:5px solid #91A8C4;border-radius:3px;flex:none;min-width:0}
.zx .zx-fusion-slip.selected{border-left-color:#537CB6}
.zx .zx-fusion-list .zx-fusion-slip.zx-review-recipe{min-height:0;padding:8px 12px 10px 23px}
.zx .zx-fusion-slip.unavailable{background:#D8DADF;border-left-color:#9CA1AA}
.zx .zx-review-recipe .zx-fusion-identity{min-height:36px;padding-right:72px}
.zx .zx-review-recipe .zx-fusion-mark{width:36px;height:32px}
.zx .zx-review-recipe .zx-fusion-pair{padding:5px 0 0;border-bottom:0}
.zx .zx-fusion-slip .zx-review-recipe-select{display:flex;flex-direction:column;gap:4px;align-items:stretch}
.zx .zx-fusion-identity,.zx .zx-fusion-pair,.zx .zx-fusion-part,.zx .zx-fusion-mark{display:flex;flex-direction:row;align-items:center}
.zx .zx-fusion-identity{gap:9px}
.zx .zx-fusion-mark{width:47px;height:41px;align-items:center;justify-content:center;gap:0;flex:none;background:#D0DFEE}
.zx .zx-fusion-mark>img{max-width:48%;object-fit:contain}.zx .zx-fusion-mark>img:only-child{max-width:85%}
.zx .zx-fusion-name,.zx .zx-fusion-material{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start}
.zx .zx-fusion-name>small,.zx .zx-fusion-material>small{font-size:12px;line-height:17px;color:#526780}
html.zixing .zx .zx-fusion-name>h2{font-size:18px;line-height:23px;color:#253853;margin:0}
.zx .zx-fusion-pair{gap:5px;padding:7px 3px;border-top:1px solid #BECCDC;border-bottom:1px solid #BECCDC}
.zx .zx-fusion-part{flex:1;min-width:0;gap:5px}
.zx .zx-fusion-part>img{width:22px;height:22px;object-fit:contain;flex:none}
.zx .zx-fusion-material>b{font-size:14px;line-height:19px;color:#334660}
.zx .zx-fusion-slip .zx-fusion-short{color:#A13346;font-weight:700}
.zx .zx-fusion-material>small.ready{color:#3F6C57}
.zx .zx-fusion-plus{color:#6581A5;font-size:16px;line-height:20px;margin:0 4px}
html.zixing .zx .zx-review-recipe>.zx-review-button{position:absolute;right:12px;top:8px;width:64px;height:36px;min-height:36px!important;padding:0 6px;font-size:15px!important;line-height:20px!important}
.zx .zx-fusion-effect,.zx .zx-fusion-figures{display:flex;flex-direction:column;align-items:stretch;gap:6px}
.zx .zx-fusion-record .zx-review-description,.zx .zx-fusion-footnote,.zx .zx-fusion-empty .zx-review-note{font-size:14px;line-height:21px;margin:0;color:#455971}
.zx .zx-fusion-figures>h3,.zx .zx-fusion-empty>b{font-size:16px;line-height:22px;margin:0;color:#2F415B}
.zx .zx-fusion-stats{display:flex;flex-direction:column;gap:5px}
.zx .zx-fusion-stat-row{display:flex;flex-direction:row;align-items:stretch;gap:6px}
.zx .zx-fusion-stat{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:1px;background:#DCE5F0;padding:5px 9px}
.zx .zx-fusion-stat>i{font-style:normal;font-size:12px;line-height:17px;color:#576B83}.zx .zx-fusion-stat>b{font-size:16px;line-height:20px;color:#334967}
.zx .zx-fusion-stat.spacer{background:transparent}
.zx .zx-fusion-footnote{padding-top:6px;border-top:1px solid #BFCCDB;font-size:13px}
.zx .zx-fusion-limit{margin:0;text-align:center;color:#D9E3F2;font-size:13px;line-height:19px}
.zx .zx-fusion-empty{gap:6px;padding:20px 20px 24px 30px}
.zx .zx-combat-shell>section.zx-item-pick{width:100%;max-width:366px;align-self:center;gap:14px;padding:0 5px 4px;border:0;box-shadow:none;background:transparent}
.zx .zx-item-pick>.zx-item-body{display:flex;flex-direction:column;gap:9px;min-height:0;flex:0 1 auto;padding:0;scrollbar-width:none}
.zx .zx-item-pick .zx-item-body>.zx-item-option.zx-quality-card{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;min-width:0;min-height:94px;gap:13px;flex:none;text-align:left;padding:11px 13px 14px 9px;border:0;background:#FBF5E8}
.zx .zx-pick-art{width:48px;flex:none;display:flex;justify-content:center;align-items:center}.zx .zx-pick-art>.zx-item-image{width:45px;height:45px;margin:0;object-fit:contain}
.zx .zx-pick-copy{min-width:0;flex:1;display:flex;flex-direction:column;align-items:stretch;gap:3px;padding-left:5px}
.zx .zx-pick-name{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:6px}
.zx .zx-pick-name>b{font-size:17px;line-height:22px;color:#27232F}.zx .zx-pick-name>.zx-quality-badge{flex:none;font-size:13px;line-height:18px;padding:1px 12px 1px 7px;border:0;border-radius:0;background:#27232F;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.zx .zx-pick-effect{font-size:14px;line-height:20px;color:#383239;white-space:normal;margin:0}.zx .zx-pick-held{font-size:12px;line-height:16px;color:#655A4D}
.zx .zx-item-pick>.zx-item-actions{padding:0;border-top:0}
html.zixing .zx.zx-modal-wrap.zx-review-forget{background:rgba(31,34,55,.84)}
html.zixing .zx .zx-combat-shell>section.zx-review-forget{width:100%;max-width:362px;align-self:center;background:transparent;border:0;box-shadow:none;padding:0 8px;gap:12px}
html.zixing .zx .zx-review-forget>.zx-review-content{display:flex;flex:0 1 auto;min-height:0;max-height:57vh;flex-direction:column;gap:8px;overflow-y:auto;padding:0 2px 3px;scrollbar-width:none}
.zx .zx-forget-row{display:flex;flex-direction:row;align-items:center;gap:11px;width:100%;min-height:83px;flex:none;padding:8px 10px 10px;background:#F3F1FA;border:0;border-bottom:2px solid #819CBB}
.zx .zx-forget-art{width:43px;height:47px;flex:none;display:flex;align-items:center;justify-content:center;background:#DFE8F3;border-left:3px solid #A1B8D3}
.zx .zx-forget-art>img,.zx .zx-forget-art>.ic{width:32px;height:32px;object-fit:contain;image-rendering:pixelated}
.zx .zx-forget-copy{flex:1;min-width:0;display:flex;flex-direction:column;align-items:stretch;gap:4px}
html.zixing .zx .zx-forget-copy>h4{margin:0;color:#293B57;font-size:16px;line-height:21px}
html.zixing .zx .zx-forget-copy>.muted{margin:0;color:#516782;font-size:13px;line-height:18px;white-space:normal}
.zx .zx-forget-action{flex:none;width:70px;display:flex;flex-direction:column;align-items:center;gap:2px}
html.zixing .zx .zx-forget-action>.zx-review-button{width:70px;min-height:44px;height:44px;flex:none;padding:0 5px;font-size:15px}
.zx .zx-forget-action>.zx-shop-amount{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:2px;height:17px;color:#4D6380;font-size:12px;line-height:16px}
.zx .zx-forget-action .zx-shop-amount>b{font-size:12px;color:#4D6380}
.zx .zx-review-forget .zx-review-content>.zx-review-note{color:#D1DAEA}
@font-face{font-family:ZilingCast;src:url('/fonts/cast-title.ttf') format('truetype')}
.zx.zx-cast-nameplate{overflow:hidden;position:absolute;height:64px;display:flex;align-items:center;justify-content:center;pointer-events:none}
.zx.zx-capture-focus>.zx-catch-track{position:relative;display:flex;flex-direction:row;align-items:center;align-self:center;gap:8px;max-width:96%;min-height:48px;margin:7px 0 0;padding:4px 12px 7px 4px;pointer-events:none;flex:none}
.zx.zx-cast-nameplate>.zx-ultimate-call{width:100%;background:transparent;text-align:center;white-space:nowrap;font:inherit;font-family:ZilingCast,sans-serif;-webkit-text-fill-color:white;-webkit-text-stroke:.13em currentColor;paint-order:stroke fill}.zx-ultimate-call>span{display:block;transform:rotate(4.44deg)}
.zx .zx-combat-feed>.zx-scene-bulletin{display:flex;flex-direction:row;align-items:center;align-self:flex-start;text-align:left;flex:none;gap:7px;width:274px;max-width:96%;min-height:43px;margin:6px 0 0;padding:6px 11px 8px 14px;background:#E9EEF7;pointer-events:none}
.zx .zx-scene-bulletin>canvas{width:34px;height:34px;flex:none}
.zx .zx-bulletin-copy{display:flex;flex:1;min-width:0;flex-direction:column;align-items:stretch;gap:2px}
.zx .zx-bulletin-title{display:flex;align-items:center;gap:6px}.zx .zx-bulletin-title>b{font-size:16px;line-height:20px;color:#314861}
.zx .zx-bulletin-title>small{font-size:12px;line-height:16px;padding:0 4px;color:#81475C;background:#EDDAE2}
.zx .zx-bulletin-copy>span{font-size:13px;line-height:18px;color:#50637D}
.zx .zx-catch-track{width:248px;background:#2B262E}
html.zixing .zx-capture-focus>.zx-catch-track{width:248px;max-width:90%;height:80px;min-height:80px;padding:4px 14px 5px 4px;gap:14px;background:#2B262E}
.zx .zx-catch-track>.zx-call-portrait{width:62px;height:66px}
.zx .zx-catch-track>.zx-call-portrait>canvas,.zx .zx-catch-track>.zx-call-portrait>img{width:54px;height:54px}
.zx .zx-catch-track>.zx-call-copy{gap:8px}
.zx .zx-catch-title{display:flex;flex-direction:row;align-items:center;gap:7px}
.zx .zx-catch-title>b{font-size:21px;line-height:26px;font-weight:800;color:#FFF6E6}
.zx .zx-catch-title>small{font-size:11px;line-height:14px;color:#F2CC69}
.zx .caught .zx-catch-title>b{color:#F2CC69}.zx .escaped .zx-catch-title>b{color:#FFA389}
.zx .zx-call-portrait{width:42px;height:37px;display:flex;flex:none;align-items:center;justify-content:center}
.zx .zx-call-portrait>img,.zx .zx-call-portrait>canvas{width:36px;height:36px;object-fit:contain}
.zx .zx-call-copy{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;gap:0}
.zx .zx-call-copy>small{font-size:12px;line-height:15px;font-weight:700;color:#546982}
.zx .zx-call-copy>b{font-size:18px;line-height:22px;color:#293955;font-weight:800}
.zx .zx-catch-pips{display:flex;flex-direction:row;align-items:center;gap:4px;flex:none}
.zx .zx-catch-pips>i{display:flex;align-items:center;justify-content:center;width:36px;height:22px;background:#454049}
.zx .zx-catch-pips>i>img,.zx .zx-catch-pips>i>canvas{width:17px;height:17px;object-fit:contain;opacity:.35}.zx .zx-catch-pips>i>span{opacity:.35}.zx .zx-catch-pips>i.on{background:#EFC554}.zx .zx-catch-pips>i.on>*{opacity:1}
.zx .zx-combat-shell>section.zx-review-copy{gap:12px;padding:0 6px 3px;max-height:100%;border:0;box-shadow:none;background:transparent}
.zx .zx-review-copy>.zx-item-body{flex:0 1 auto;overflow-y:auto;scrollbar-width:thin;min-height:0;max-height:55vh;gap:9px;padding:0 7px 0 0}
.zx .zx-review-copy .zx-item-option:disabled{opacity:1}
.zx .zx-review-copy .zx-item-option:disabled .zx-pick-held{color:#723E50;font-weight:700}
html.zixing .zx.zx-modal-wrap.zx-under-team{display:none}
html.zixing .zx.zx-team-overlay{position:fixed;inset:0;z-index:950;background:rgba(32,36,56,.78)}
.zx .zx-combat-shell>.zx-team-reading{width:100%;max-width:360px;align-self:center;height:53vh;min-height:0;padding:11px 12px 13px;gap:9px;border:0;display:flex;flex-direction:column;background:#EEF0F8}
.zx .zx-team-identity,.zx .zx-team-types,.zx .zx-team-tabs{display:flex;flex-direction:row;align-items:center}
.zx .zx-team-identity{flex:none;gap:9px;padding:0 2px 6px;border-bottom:1px solid #BDCCDF}
.zx .zx-team-identity>canvas{width:39px;height:39px;background:#D8E5F3}
.zx .zx-team-idcopy{display:flex;flex:1;min-width:0;flex-direction:row;align-items:center;justify-content:space-between;gap:10px}.zx .zx-team-idcopy>b{font-size:18px;line-height:24px;color:#2D3B57}
.zx .zx-team-types{gap:3px;color:#4D6683;font-size:13px}
.zx .zx-team-tabs.zx-lab-tabs{margin:0;gap:2px;height:36px;flex:none;align-items:stretch}
.zx .zx-team-tabs.zx-lab-tabs>.zc-filter{height:36px;min-height:36px;padding:0;border:0;box-shadow:none}
.zx .zx-team-tabs.zx-lab-tabs .zc-filter>.zc-control-label,.zx .zx-team-tabs.zx-lab-tabs .zc-filter>.zc-control-face{left:0;bottom:0;width:100%;height:32px;margin:0}
.zx .zx-team-tabs.zx-lab-tabs .zc-filter>.zc-control-label{white-space:nowrap;font-size:15px;line-height:20px;text-align:center}
.zx .zx-shop-shelves .zx-review-footer>.pk-btn{align-self:center;margin-left:auto;margin-right:auto}
.zx .zx-team-scroll{display:flex;flex:1;min-height:0;flex-direction:column;overflow-y:auto;scrollbar-width:none}
.zx .zx-team-scroll>section{display:flex;flex-direction:column;align-items:stretch;gap:7px;padding:0 2px 5px}
.zx .zx-team-scroll .pk-h{display:flex;align-items:center;justify-content:space-between;min-height:24px;gap:8px}
.zx .zx-team-scroll .tag{margin:0;padding:0;background:transparent;color:#344A6A;font-size:15px;line-height:20px;font-weight:800}
.zx .zx-team-scroll .pk-h>small,.zx .zx-team-scroll .mp-hint,.zx .zx-team-scroll .mp-none{margin:0;color:#566882;font-size:13px;line-height:18px;text-align:left}
.zx .zx-team-scroll .pk-moves,.zx .zx-team-scroll .pk-stats,.zx .zx-team-scroll .pk-vits{display:flex;flex-direction:column;gap:4px}
.zx .zx-team-scroll .pk-move,.zx .zx-team-scroll .pk-vit{align-items:flex-start;gap:9px;padding:8px 6px;background:#E0E8F3;border-radius:0;border:0;box-shadow:none}
.zx .zx-team-scroll .pk-move>.grow{min-width:0;display:flex;flex:1;flex-direction:column;align-items:stretch;gap:3px}
.zx .zx-team-scroll .pk-move .mp-top{display:flex;flex-direction:row;align-items:center;gap:5px}
.zx .zx-team-scroll .pk-move .mp-top>b,.zx .zx-team-scroll .pk-vit b{font-size:15px;line-height:20px;color:#2F405B}
.zx .zx-team-scroll .pk-move .mp-tag,.zx .zx-team-scroll .pk-move .muted,.zx .zx-team-scroll .pk-move small{font-size:12px;line-height:16px;color:#4B607D}
.zx .zx-team-scroll .mp-nums{display:flex;flex-direction:row;flex-wrap:wrap;gap:5px}
.zx .zx-team-scroll .mp-nums>span{min-width:0;flex:0 1 auto;padding:2px 5px;background:#EFF2F8;color:#344963;border-radius:0;font-size:13px}
.zx .zx-team-scroll .mp-nums i{font-size:12px;color:#526780}
.zx .zx-team-scroll .pk-items{display:flex;flex-direction:row;flex-wrap:wrap;align-items:stretch;gap:5px;padding:0;max-height:none;overflow:visible}
.zx .zx-team-scroll .pk-item{display:flex;width:23%;aspect-ratio:auto;min-height:62px;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;border-radius:0;padding:4px 1px;background:#DEE8F4;box-shadow:none}
.zx .zx-team-scroll .pk-item>img{height:28px;width:28px;object-fit:contain}.zx .zx-team-scroll .pk-item>b{position:absolute;top:1px;right:2px;bottom:auto;height:15px;padding:0 2px;background:#536887;color:#F3F1FA}
.zx .zx-team-item-name{font-size:12px;line-height:16px;text-align:center;color:#344A68}
.zx .zx-team-scroll .pk-stats>div{border-bottom:1px solid #CDD7E7;padding:4px 2px;color:#3D506D;font-size:14px}
.zx .zx-team-scroll .pk-stats>div.pk-gtitle{margin:4px 0 0;padding:3px 4px;font-size:13px;background:#DBE5F2;font-weight:800}
.zx .zx-team-scroll .pk-stats>div.up b{color:#43765F}.zx .zx-team-scroll .pk-stats>div.down b{color:#97556A}
.zx .zx-combat-shell>section.zx-shop-shelves,.zx .zx-combat-shell>section.zx-party-roster,.zx .zx-combat-shell>section.zx-scene-offers{width:100%;max-width:360px;align-self:center;min-height:0;padding:0 4px 3px;gap:10px;background:transparent;box-shadow:none;border:0}
.zx .zx-combat-shell>section.zx-shop-shelves{display:flex;flex-direction:column;height:78vh;max-height:100%;padding:0 4px 4px}
.zx .zx-shop-shelves>.zx-review-content{flex:1;min-height:0;overflow-y:auto;padding:0 1px 3px;scrollbar-width:none}
.zx .zx-shop-stock,.zx .zx-shop-stock>.cards,.zx .zx-shop-resale,.zx .zx-shop-resale>.zx-sale-list{display:flex;flex-direction:column;align-items:stretch;flex-wrap:nowrap;gap:8px;min-height:0;width:100%;margin:0;padding:0;overflow:visible}
.zx.zx-modal-wrap.zx-review-shop,.zx.zx-modal-wrap.zx-review-copy,.zx.zx-modal-wrap.zx-review-forget{background:rgba(23,30,48,.82)}
.zx .zx-shop-stock>.shop-reroll{width:100%;min-height:42px;flex:none;margin:0}
.zx .zx-shop-offer{display:flex;flex-direction:column;align-items:stretch;gap:8px;width:100%;flex:none;padding:12px 12px 8px 14px;text-align:left;background:#EDF0F6;border:0}
.zx .zx-shop-product{display:flex;flex-direction:row;align-items:flex-start;gap:12px}
.zx .zx-shop-picture{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;background:#DCE5EF}
.zx .zx-shop-picture>img{display:block;width:34px;height:34px;object-fit:contain;margin:0}
.zx .zx-shop-description{display:flex;flex-direction:column;flex:1;min-width:0;align-self:center;gap:5px}
.zx .zx-shop-head,.zx .zx-shop-labels{display:flex;flex-direction:row;align-items:center;gap:6px}
.zx .zx-shop-head{justify-content:space-between;align-items:flex-start}
.zx .zx-shop-labels{flex:1;min-width:0;flex-wrap:wrap}
.zx .zx-shop-name{min-width:0;font-size:17px;line-height:23px;color:#263751}
.zx .zx-shop-labels>.zc-plan-badge{align-self:center;flex:none;padding:1px 5px;background:#F2DDE3;color:#943B55;font-size:11px;line-height:16px}
.zx .zx-shop-head>.zx-quality-badge{flex:none;font-size:12px;line-height:17px;padding:1px 7px;color:#F3F1FA}
.zx .zx-shop-effect{margin:0;font-size:14px;line-height:20px;color:#405470}
.zx .zx-shop-owned{font-size:13px;line-height:17px;color:#4F637F}
.zx .zx-shop-deal{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid #BDCAD9}
.zx .zx-shop-amount{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:4px;flex:none}
.zx .zx-shop-value,.zx .zx-shop-plus,.zx .zx-shop-caption{color:inherit;font-size:inherit;line-height:inherit;font-weight:700}
.zx .zx-shop-amount>canvas{flex:none;object-fit:contain}
.zx .zx-shop-ledger{display:flex;align-items:center;flex-direction:row;gap:12px;width:100%;height:54px;min-height:54px;flex:none;padding:4px 11px 6px 17px}
.zx .zx-shop-index{display:flex;align-items:center;flex-direction:row;gap:3px;flex:1;min-width:0}
html.zixing .zx .zx-shop-index>.zx-shop-index-tab{display:flex;align-items:center;justify-content:center;flex:1;min-width:0;width:0;height:42px;min-height:42px;padding:0 5px;margin:0;border:0;background:transparent;box-shadow:none;font-size:16px;font-weight:700;color:#566A83}
html.zixing .zx .zx-shop-index>.zx-shop-index-tab[aria-pressed="true"]{color:#70374D}
.zx .zx-shop-ledger>.zx-shop-balance{display:flex;align-items:center;justify-content:center;min-width:64px;flex:none;font-size:15px;font-weight:700;color:#EEF2F8}
.zx .zx-shop-sell-hint{padding:2px 3px;margin:0;color:#E7EBF6;font-size:14px;line-height:20px}
.zx .zx-shop-status{flex:none;min-width:0;font-size:13px;line-height:18px;color:#795462}
.zx .zx-shop-action.armed{outline:2px solid #6689B7}

html.zixing .zx .zx-shop-deal>.zx-shop-action{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;width:auto;min-width:102px;height:44px;min-height:44px;flex:none;padding:0 10px;font-size:15px}
.zx .zx-shop-stock>.help,.zx .zx-shop-empty{padding:5px 4px;color:#DEEAFA;font-size:13px;line-height:18px}
.zx .zx-shop-shelves>.zx-review-footer{display:flex;flex-direction:row;gap:8px;padding:0;margin:0;flex:none}
html.zixing .zx .zx-shop-shelves .zx-review-footer>button{width:0;min-width:0;height:48px;min-height:48px;flex:1;margin:0;padding:0 6px;font-size:17px}
.zx .zx-scene-offers .zx-choice-list{display:flex;flex-direction:column;gap:8px;min-height:0;overflow-y:auto;padding:1px 1px 3px}
.zx .zx-scene-offers .zx-choice-actions{display:flex;flex-direction:row;gap:8px;padding:0}
.zx .zx-scene-offers .zx-choice-actions>button{flex:1;min-width:0;width:auto;min-height:44px}
.zx .zx-scene-caption .zx-note{padding:0 4px;margin:0;color:#E3EBF5;font-size:13px;line-height:18px;text-align:center;background:transparent}
.zx .zx-party-roster .zx-review-content{min-height:0;overflow-y:auto;gap:10px}
.zx .zx-party-pick{display:flex;position:relative;flex-direction:row;align-items:center;gap:14px;width:100%;flex:none;min-height:108px;padding:12px 13px 15px 11px;color:#293C59;background:#E8EEF6;border:0;text-align:left}
.zx .zx-party-incoming{display:flex;flex:none;flex-direction:row;align-items:center;gap:21px;min-height:127px;margin:0;padding:4px 16px;background:transparent}
.zx .zx-party-intro-art{display:flex;align-items:center;justify-content:center;flex:none;width:101px;height:113px;padding:0 8px 20px 12px}
.zx .zx-party-intro-art>canvas{width:54px;height:54px}
.zx .zx-party-intro-copy{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.zx .zx-party-intro-flag{font-size:12px;font-weight:700;line-height:20px;color:#3C465E;padding:0 11px 0 7px}
.zx .zx-party-intro-name{font-size:30px;line-height:36px;font-weight:800;color:#F3F1FA}
.zx .zx-party-intro-copy>span{font-size:15px;line-height:21px;color:#E3ECF7}
.zx .zx-party-instruction{display:flex;flex-direction:row;align-items:center;gap:10px;padding:0 3px;flex:none}
.zx .zx-party-instruction>span{color:#E1E8F4;font-size:14px;font-weight:700}
.zx .zx-party-instruction>i{flex:1;height:1px;background:#8998AF}
.zx .zx-party-photo{display:flex;flex:none;align-items:center;justify-content:center;width:62px;height:72px;background:#EAF2FA}
.zx .zx-party-photo canvas{width:54px;height:54px}
.zx .zx-party-copy{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.zx .zx-party-copy>b{font-size:22px;line-height:27px;color:#273B5A}.zx .zx-party-copy>small{font-size:14px;line-height:19px;color:#425B78}
.zx .zx-party-tallies{display:flex;flex-direction:row;flex-wrap:wrap;gap:7px;margin-top:2px}
.zx .zx-party-tallies>span{font-size:13px;line-height:17px;color:#586C83}
.zx .zx-party-send{color:#4D6686;background:#D7E2EF;padding:4px 7px;font-size:14px;font-weight:700}
.zx .zx-combat-shell>section.zx-team-dossier{display:flex;flex-direction:column;max-width:360px;height:50vh;align-self:center;padding:12px;min-height:0}
.zx .zx-team-dossier .mv-scroll{display:flex;flex:1;min-height:0;flex-direction:column;align-items:stretch;overflow-y:auto;padding:0;scrollbar-width:none}
.zx .zx-combat-shell>section.zx-team-item-paper{height:auto;max-height:50vh}
.zx .zx-team-item-paper .mv-scroll{flex:0 1 auto}
.zx .zx-team-dossier .tt-card{flex:none;display:flex;flex-direction:column;gap:8px;background:transparent;color:#334361;border:0;box-shadow:none;border-radius:0;max-width:100%;width:100%;padding:3px}
.zx .zx-team-dossier .tt-head{display:flex;align-items:center;gap:9px;padding:0 0 7px;background:transparent;border-bottom:1px solid #BAC9DD}
.zx .zx-team-dossier .tt-head>img{width:34px;height:34px;object-fit:contain}.zx .zx-team-dossier .tt-head b{font-size:18px;line-height:23px;color:#293B56}
.zx .zx-team-dossier .tt-head small,.zx .zx-team-dossier .mv-note{font-size:12px;line-height:18px;color:#536681}
.zx .zx-team-dossier .tt-card>p{font-size:14px;line-height:20px}
.zx .zx-team-dossier .tt-facts,.zx .zx-team-dossier .mv-facts{display:flex;flex-direction:column;gap:2px;background:#DEE7F2;padding:6px 9px}
.zx .zx-team-dossier .tt-facts>div,.zx .zx-team-dossier .mv-facts>div{display:flex;justify-content:space-between;align-items:center;gap:9px;font-size:14px;line-height:19px}
.zx-paper-upgrade-head{position:relative;display:flex;flex-direction:column;align-items:center;height:67px;min-height:67px;flex:none;padding:0}
.zx .zx-paper-upgrade-head>h2,.zx .zx-paper-upgrade-head>h1{text-align:center;position:absolute;top:0;left:0;right:0;height:35px;margin:0;padding:0;font-size:28px;line-height:35px;color:#2D2749;-webkit-text-stroke:1.5px var(--paper-paper)}
.zx-paper-upgrade-head>small{position:absolute;bottom:0;left:0;right:0;height:17px;text-align:center;font-weight:700;font-size:13px;line-height:17px;color:var(--paper-paper)}
.zx-upgrade-ribbons{position:relative;flex:none;align-self:center;margin:9px 0 0;width:203px;height:31px;object-fit:fill;pointer-events:none}
.zx{--combat-card-height:136px;--combat-card-gap:12px;--combat-action-gap:12px}
.zx .zx-combat-shell{width:100%;max-width:390px;max-height:100%;min-height:0;display:flex;flex-direction:column;align-items:stretch;gap:var(--combat-action-gap)}
.zx .zx-combat-shell>.zx-modal{flex:0 1 auto;min-height:0;max-height:100%;gap:var(--combat-action-gap);width:100%;padding:12px}
.zx .zx-combat-shell .zx-choice-list,.zx .zx-combat-shell .zx-item-body,.zx .zx-combat-shell .zx-review-content{gap:var(--combat-card-gap)}
.zx .zx-combat-shell .zx-choice-top{justify-content:flex-end}
.zx .zx-combat-shell .zx-quality-card,.zx .zx-combat-shell .zx-review-recipe,.zx .zx-combat-shell .zx-review-companion{min-height:var(--combat-card-height)}
.zx .zx-combat-shell .zx-review-footer,.zx .zx-combat-shell .zx-item-actions,.zx .zx-combat-shell .zx-choice-actions{flex:none;gap:var(--combat-action-gap)}
.zx .zx-combat-shell .zx-review-shop{background:transparent}
.zx .zx-combat-shell .zx-review-shop>.help{color:#F3F1FA}
.zx .zx-paper-upgrade-head.long-title>h1,.zx .zx-paper-upgrade-head.long-title>h2{font-size:20px;line-height:29px}
.zx.zx-modal-wrap.zx-arcade-overlay{background:rgba(22,31,52,.72);padding:16px 12px}
.zx-arcade{position:relative;width:100%;max-width:334px;display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:0 18px 16px;background:#AFC4DC;border-radius:9px}
.zx-arcade-header{display:flex;flex-direction:row;align-items:center;justify-content:space-between;height:48px;padding:0 7px}
.zx-arcade-header>h2{margin:0;font-size:21px;line-height:28px;font-weight:800;color:#F3F1FA}
.zx-arcade-header>span{display:flex;align-items:center;gap:4px;color:#F3F1FA;font-size:15px}
.zx-arcade-window{display:flex;flex-direction:row;align-items:stretch;gap:4px;background:#3D506D;border-bottom:4px solid #7591B0;padding:5px}
.zx-arcade-reel{flex:1;min-width:0;height:94px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:#ECEDF5;border-top:4px solid #BCCCE0;border-bottom:4px solid #A9BDD5}
.zx-arcade-reel>b{font-size:34px;line-height:43px;color:#32476A}
.zx-arcade-notch{width:21px;height:3px;background:#D0DAE9}
.zx-arcade-tray{display:flex;flex-direction:column;align-items:center;gap:4px;padding:2px 4px 8px}
.zx-arcade-tray>b{color:#283C5E;font-size:18px}.zx-arcade-caption{margin:0;color:#354966;font-size:14px;line-height:20px;text-align:center}
.zx-arcade-controls{display:flex;gap:8px;align-items:center;flex-direction:row;padding:2px 0 0}
.zx-arcade-controls>.primary{flex:1;min-width:0}
.zx.zx-modal-wrap.zx-atlas-overlay{padding:12px 6px 76px;background:rgba(36,30,41,.78)}
.zx.zx-atlas{max-width:486px;min-height:0;padding:16px 7px 20px;gap:0;display:flex;flex-direction:column;align-items:stretch;background:#E9E2D1;border:0;color:#302A31;clip-path:polygon(0 1%,30% 0,66% 1%,99% .2%,100% 98%,70% 99%,35% 98.2%,1% 100%)}
.zx-atlas-key{min-height:52px;flex:none;display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;padding:0 9px 8px;border-bottom:1px dashed #A89D88}
.zx-atlas-titles{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.zx-atlas-titles>small{font-size:11px;line-height:14px;font-weight:700;color:#716653}
html.zixing .zx .zx-atlas-titles>h2{margin:0;padding:0;font-size:25px;line-height:30px;font-weight:800;color:#302A31;text-align:left}
.zx-atlas-key>.zx-atlas-zone{flex:none;padding:4px 9px;background:#302A31;color:#F2C650;font-size:14px;line-height:18px;font-weight:800}
.zx-atlas .zx-atlas-north{font-size:11px;font-weight:700;line-height:17px;color:#574D40;margin:4px 7px 2px}
.zx-atlas .zx-battle-map-frame{background:transparent}
html.zixing .zx-atlas .zx-battle-map-art{pointer-events:none}
.zx-showing-atlas>#hud,.zx-showing-atlas>.tc,.zx-showing-atlas>.zx-hud{display:none}
.zx .zx-paper-upgrade-head.single-line{height:47px;min-height:47px}
.zx-showing-outcome>#hud,.zx-showing-outcome>.tc,.zx-showing-outcome>.zx-hud{display:none}
.zx.zx-modal-wrap.zx-outcome-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px 19px;background:rgba(23,29,49,.78)}
.zx .zx-outcome{width:100%;max-width:352px;max-height:100%;min-height:0;display:flex;flex-direction:column;align-items:stretch;gap:16px;padding:0;background:transparent;border:0;color:#F3F1FA}
.zx .zx-outcome-body{flex:0 1 auto;min-height:0;display:flex;flex-direction:column;gap:15px;overflow-y:auto;padding:0 2px}
.zx .zx-outcome-metrics,.zx .zx-outcome-actions{display:flex;flex-direction:row;align-items:center;gap:6px}
.zx .zx-outcome-metrics{padding:9px 0;border-bottom:1px solid #8593B0}
.zx .zx-outcome-stat{display:flex;flex:1;min-width:0;flex-direction:column;align-items:center;gap:3px}
.zx .zx-outcome-stat>b,.zx .zx-outcome-reward>b,.zx .zx-outcome-confirm>b{font-size:22px;line-height:29px;color:#F3F1FA}
.zx .zx-outcome-stat>b{font-size:19px;line-height:25px;white-space:nowrap}
.zx .zx-outcome-stat>small,.zx .zx-outcome-reward>small,.zx .zx-outcome-note{font-size:13px;line-height:20px;color:#D8E3F4;text-align:center;margin:0}
.zx .zx-outcome-reward,.zx .zx-outcome-confirm{display:flex;flex-direction:column;align-items:center;gap:4px}
.zx .zx-outcome-confirm{padding:8px 14px 14px;gap:12px}
.zx .zx-outcome-build{display:flex;flex-direction:column;gap:7px}
.zx .zx-outcome-build>b{font-size:14px;line-height:20px;color:#DAE4F5}
.zx .zx-outcome-reward>.zx-plain{flex:1;min-width:0;min-height:40px;padding:0 3px;color:#E0EAF9;background:transparent;border:0;box-shadow:none;font-size:14px}
.zx .zx-outcome-stash,.zx .zx-build-group{display:flex;flex-direction:column;gap:4px}
.zx .zx-outcome-stash{gap:10px}
.zx .zx-build-index,.zx .zx-build-pair,.zx .zx-build-entry{display:flex;flex-direction:row;align-items:center}
.zx .zx-build-index{gap:6px;padding-bottom:2px}.zx .zx-build-index>b{color:#C3D6F1;font-size:12px;line-height:17px}
.zx .zx-build-index>i{height:1px;background:#8494AC;flex:1}
.zx .zx-build-pair{gap:10px;align-items:stretch}
.zx .zx-build-entry{width:48%;flex-shrink:0;min-height:30px;gap:5px;padding:2px 0;border-bottom:1px solid #687992}
.zx .zx-build-stamp{width:22px;height:22px;display:flex;justify-content:center;align-items:center;background:#DAE4F1;flex:none}
.zx .zx-build-stamp>img{width:19px;height:19px;object-fit:contain}
.zx .zx-build-name{min-width:0;flex:1;font-size:13px;line-height:17px;color:#F3F1FA;font-weight:700}
.zx .zx-build-quantity{flex:none;color:#CCE0FC;font-size:12px;line-height:17px}
.zx .zx-outcome-actions{flex:none;gap:10px}
.zx .zx-outcome-actions>.zx-button{flex:1;min-width:0;width:auto;font-size:17px}
.zx-first-batch-upgrade .zx-paper-icon{width:29px;height:25px;flex:none}
.zx-modal.zx-first-batch-upgrade>.zx-choice-list{gap:var(--combat-card-gap);padding:1px 1px 4px;scrollbar-width:none}
.zx-modal.zx-first-batch-upgrade>.zx-choice-list::-webkit-scrollbar{display:none}
.zx-first-batch-upgrade .zx-choice-list>.zx-offer.zx-quality-card{position:relative;flex-direction:row;align-items:stretch;gap:9px;height:auto;min-height:var(--combat-card-height);padding:12px 12px 13px;border:0;border-radius:0;box-shadow:none;font-size:14px}
.zx-first-batch-upgrade .zx-upgrade-art{position:relative;display:flex;justify-content:center;align-items:center;align-self:stretch;width:77px;min-height:0;flex:none}
.zx-first-batch-upgrade .zx-upgrade-print{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.zx-first-batch-upgrade .zx-upgrade-art>.zx-loadout-icon{position:relative;width:43px;height:43px;object-fit:contain}
.zx-first-batch-upgrade .zx-upgrade-art>.zx-glyph{position:relative;width:50px;height:50px;border:0;background:transparent}
.zx-first-batch-upgrade .zx-upgrade-copy{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:0;flex:1;min-width:0;min-height:0;padding:1px 0}
.zx-first-batch-upgrade .zx-upgrade-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:5px;flex:none}
.zx-first-batch-upgrade .zx-offer .zx-choice-title{color:var(--paper-ink);font-size:15px;line-height:19px;min-width:0;flex:1}
.zx-first-batch-upgrade .zx-upgrade-effects{display:flex;flex-direction:column;align-items:stretch;gap:1px;width:100%;min-width:0;flex:none;overflow:visible}
.zx-first-batch-upgrade .zx-choice-description{color:#2E2D40;font-size:14px;line-height:17px;padding:0 5px 0 0;font-weight:600;max-width:100%;flex:none}
.zx-first-batch-upgrade .zx-choice-kind{color:#494B5D;font-size:13px;line-height:17px;flex:none}
.zx .zx-fossil-offers .zx-choice-identity{justify-content:space-between;flex-wrap:nowrap}
.zx .zx-fossil-offers .zx-choice-tags{flex:none}
.zx .zx-scene-offers .zx-quality-badge,.zx-first-batch-upgrade .zx-quality-badge{min-height:22px;line-height:20px;padding:1px 7px 0 8px;border:0;border-radius:0;font-size:12px;color:var(--paper-paper);font-weight:800;align-self:flex-start}
.zx-first-batch-upgrade .zx-upgrade-copy{gap:4px;justify-content:flex-start;text-align:left}
.zx-first-batch-upgrade .zx-offer .zx-choice-title{font-size:18px;line-height:23px}
.zx-first-batch-upgrade .zx-upgrade-art{width:67px}
.zx-first-batch-upgrade .zx-upgrade-title-row{align-items:flex-start}
.zx-first-batch-upgrade .zx-offer-rank,.zx-first-batch-upgrade .zx-offer-stats,.zx-first-batch-upgrade .zx-offer-stat{display:flex;flex-direction:row;align-items:center}
.zx-first-batch-upgrade .zx-offer-rank{gap:4px;align-self:flex-start;height:21px}
.zx-first-batch-upgrade .zx-offer-rank>small,.zx-first-batch-upgrade .zx-offer-rank>span,.zx-first-batch-upgrade .zx-offer-rank>i{color:#55657B;font-size:12px;line-height:17px}
.zx-first-batch-upgrade .zx-offer-rank>b{background:#D5DFEB;color:#364E72;font-size:12px;line-height:17px;padding:0 4px}
.zx-first-batch-upgrade .zx-offer-rank>.zx-offer-cap{margin-left:4px;padding-left:5px;border-left:1px solid #A9B6C7}
.zx-first-batch-upgrade .zx-upgrade-effects{gap:3px;margin-top:2px;border-top:1px solid #B1BECD;padding-top:5px}
.zx-first-batch-upgrade .zx-offer-stats{flex-wrap:wrap;gap:8px}
.zx-first-batch-upgrade .zx-offer-stat{display:block;flex:0 1 auto;min-width:0;max-width:100%;white-space:normal;color:#334D73;font-size:15px;line-height:20px;font-weight:700}
.zx-first-batch-upgrade .zx-upgrade-effects>.zx-offer-explanation{align-self:stretch;width:100%;white-space:normal;overflow-wrap:anywhere;font-size:15px;line-height:20px;color:#334D73;font-weight:700}
.zx-first-batch-upgrade .zx-quality-card[data-quality="common"]{background:#E9E8ED}
.zx-first-batch-upgrade .zx-quality-card[data-quality="uncommon"]{background:#DAEADD}
.zx-first-batch-upgrade .zx-quality-card[data-quality="rare"]{background:#E0EAF7}
.zx-first-batch-upgrade .zx-quality-card[data-quality="epic"]{background:#EAE1F4}
.zx-first-batch-upgrade .zx-quality-card[data-quality="legendary"]{background:linear-gradient(140deg,#F7F3E0,#F1E3C7)}
.zx-first-batch-upgrade>.zx-choice-actions{align-items:center}
.zx-first-batch-upgrade .zx-choice-actions>.zx-reroll{display:flex;gap:10px;justify-content:center;align-items:center;width:auto;min-width:196px;min-height:48px;padding:0 12px;border:1px solid #D4D8E6;border-bottom:4px solid #B1B2E0;border-radius:1px;background:#EFEFF6;box-shadow:none;color:var(--paper-ink);font-size:14px}
@media(max-height:660px){
.zx{--combat-card-height:118px;--combat-card-gap:8px;--combat-action-gap:8px}
.zx-modal.zx-first-batch-upgrade{gap:5px}
.zx-modal.zx-first-batch-upgrade>.zx-choice-list{gap:6px}
.zx-modal-wrap.zx-upgrade-scrim{padding:12px 16px}
.zx-paper-upgrade-head{height:46px;min-height:46px}
.zx-upgrade-ribbons{margin-top:6px;height:29px}
.zx-first-batch-upgrade .zx-choice-list>.zx-offer.zx-quality-card{height:auto;min-height:var(--combat-card-height);padding-top:10px;padding-bottom:10px}
}
@media(max-width:350px){
.zx-first-batch-upgrade .zx-upgrade-art{width:54px}
.zx-first-batch-upgrade .zx-upgrade-art>.zx-loadout-icon{width:39px;height:39px}
}

.zx-hud-paper .zx-hud-location{width:226px;gap:4px;padding:0 5px 3px 8px;background:#384469;border:0}
.zx-hud-paper .zx-hud-area{color:var(--paper-paper);min-width:0;flex:1;margin-right:8px;overflow:hidden;text-overflow:ellipsis}
.zx-hud-paper small.zx-hud-stage[data-tier]{width:61px;text-align:center;padding:0;color:var(--paper-ink);background:transparent;border:0;font-weight:800}
.zx-hud-paper .zx-hud-profile{left:-2px;right:111px;top:13px}
.zx-hud-paper .zx-hud-card{left:38px;right:3px;top:0;height:69px;border:0;background:var(--paper-paper)}
.zx-hud-paper .zx-minimap{right:4px;top:0;width:100px;height:100px}
.zx-hud-paper .zx-hud-portrait-strap{position:absolute;left:46px;top:0;width:9px;height:56px;background:#7B95C7}
.zx-hud-paper .zx-hud-profile-tie{position:absolute;right:2px;top:-6px;width:20px;height:18px;pointer-events:none}
.zx-hud-paper .zx-hud-identity{gap:4px;top:7px;left:89px}
.zx-hud-paper .zx-hud-name-row{height:22px;border-bottom:1px solid #C9D6E5}
.zx-hud-paper .zx-hud-name{font-size:18px;color:#303955}
.zx-hud-paper .zx-hud-element{width:auto;min-width:23px;padding:0 4px;color:#543C4D;background:#EBCFD1}
.zx-hud-paper .zx-hud-element[data-element="flying"],.zx-hud-paper .zx-hud-element[data-element="water"]{background:#C7DBEF}
.zx-hud-paper .zx-hud-element[data-element="grass"]{background:#C5DDC9}
.zx-hud-paper .zx-hud-counters{top:105px;height:41px;gap:7px}
.zx-hud-paper .zx-hud-counter{height:41px;background:var(--paper-paper);border:0;padding:0 4px 0 0;gap:3px;justify-content:flex-start}
.zx-hud-paper .zx-hud-counter:first-child{justify-content:flex-start;padding-left:0;padding-right:8px}
.zx-hud-paper .zx-hud-paper-icon{flex:none;object-fit:contain}
.zx-hud-paper .zx-hud-clock,.zx-hud-paper .zx-hud-gold,.zx-hud-paper .zx-hud-score{color:var(--paper-ink);font-variant-numeric:tabular-nums;line-height:17px;font-size:14px}
.zx-hud-paper .zx-hud-gold,.zx-hud-paper .zx-hud-score{flex:1;min-width:0;text-align:center}
.zx-hud-paper .zx-hud-level{left:15px;top:71px;width:49px;height:18px;background:#425779;border:0;border-radius:0;color:var(--paper-paper);padding-bottom:2px}
html.zixing .zx-hud-paper .zx-hud-pause{right:0;top:102px;width:44px;height:44px;min-height:44px;border:0;border-radius:4px;background:var(--paper-paper);box-shadow:none;padding:0 0 4px}
.zx-hud-paper .zx-mini-slot.filled{background:#EEEDF6;border:0;border-radius:2px;justify-content:flex-start}
.zx-hud-paper .zx-mini-slot.empty{background:transparent;border:0}
.zx-hud-paper .zx-empty-mark{width:8px;height:2px;background:#C4CFDF}
.zx-hud-paper .zx-mini-slot>.zx-loadout-icon{width:23px;height:23px;margin-left:-2px}
.zx-hud-paper .zx-mini-slot>.zx-slot-count{position:absolute;right:0;bottom:0;padding:0 1px;min-width:9px;background:#E4EAF5;font-size:10px;color:#29354E}
.zx-hud-paper .zx-loadout-more{border:1px solid #B3BDD8;border-radius:3px;background:#EBEDF6;color:var(--paper-ink)}
.zx-hud-paper .zx-skill-slots{bottom:61px}
.zx-hud-paper .zx-skill-slot.filled{border:0;background:var(--paper-paper)}
.zx-hud-paper .zx-skill-slot .zx-slot-level{border:1px solid #99A6C4;background:var(--paper-paper);color:var(--paper-ink);border-radius:2px}
html.zixing .tc.zx-paper-touch{--zx-ult-size:min(calc(90px * var(--tcs,1)),calc(38vw - 38px));--zx-paper-bottom:max(318px,calc(40% + 10px));--zx-paper-right:21px}
html.zixing .tc.zx-paper-touch .zx-field-controls{position:absolute;right:var(--zx-paper-right);bottom:var(--zx-paper-bottom);width:var(--zx-ult-size);height:var(--zx-ult-size);transform:translateY(50%);overflow:visible;pointer-events:none}
html.zixing .tc.zx-paper-touch .zx-field-controls>.tc-ultb.ult{left:0;top:0;right:auto;bottom:auto;width:100%;height:100%;margin:0;transform:none;pointer-events:auto}
html.zixing .tc.zx-paper-touch .zx-field-prompts{position:absolute;left:0;right:0;top:100%;margin-top:10px;display:flex;flex-direction:column;align-items:stretch;gap:5px;overflow:visible;pointer-events:none}
html.zixing .tc.zx-paper-touch .zx-field-prompts>.tc-act,html.zixing .tc.zx-paper-touch .zx-field-prompts>.release-ally{display:flex;position:relative;left:auto;right:auto;top:auto;bottom:auto;transform:none;width:100%;max-width:none;height:59px;min-height:59px;margin:0;padding:2px 2px 4px;flex-direction:column;align-items:center;justify-content:center;gap:0;zoom:1;pointer-events:auto;background:#E8ECF5;border:1px solid #879DBC;border-radius:3px;box-shadow:none}

html.zixing .tc.zx-paper-touch .tc-ultb.ult,html.zixing .tc.zx-paper-touch .tc-ultb.ult.ready,html.zixing .tc.zx-paper-touch .tc-ultb.ult:not(.ready){background:transparent!important;box-shadow:none}
html.zixing .tc.zx-paper-touch .tc-ultb.ult>.ult-core{background:transparent;border:0;box-shadow:none;pointer-events:none}
/* Keep the map, portrait and pause targets on their existing anchors. */
.zx-hud-paper .zx-hud-profile.two-supply-rows .zx-hud-card{height:92px}
.zx-hud-paper .zx-hud-profile.two-supply-rows .zx-hud-supplies{height:55px}
.zx-hud-paper .zx-inventory-items{flex-direction:column;gap:2px}
.zx-hud-paper .zx-supply-row{display:flex;align-items:center;gap:4px}
.zx-hud-paper .zx-hud-name-row{gap:5px}
.zx-hud-paper small.zx-hud-xp{margin-left:auto;color:#536787;font-size:11px;line-height:16px;white-space:nowrap}
.zx-hud-paper .zx-hud-counter>b{flex:1;min-width:0;text-align:center;line-height:18px}
.zx-hud-paper .zx-hud-counter:first-child{flex:none;width:83px;min-width:83px;padding-right:5px}
.zx-hud-paper .zx-hud-counter.long-clock:first-child{width:96px;min-width:96px}
.zx-hud-paper .zx-hud-counter>.zx-hud-clock{width:auto;min-width:0;max-width:none;flex:1}
.zx-hud-paper .zx-hud-counter{align-items:center}
.zx-hud-paper .zx-skill-word{position:absolute;left:45px;top:10px;min-width:36px;max-width:80px;padding:2px 5px;color:#293450;background:#ECEDF6;border-left:2px solid #8BA4C7;font-size:12px;line-height:15px;font-weight:800;pointer-events:none}
@media(max-width:350px){
.zx-hud-paper .zx-hud-location{gap:2px}
.zx-hud-paper .zx-hud-area{margin-right:6px}
.zx-hud-paper .zx-hud-counters{top:136px;gap:5px}
.zx-hud-paper .zx-hud-counter:first-child{height:36px;top:-34px}
.zx-hud-paper .zx-hud-profile{right:93px;top:10px}
.zx-hud-paper .zx-hud-card{left:32px;height:65px}
.zx-hud-paper .zx-hud-identity{left:75px}
.zx-hud-paper .zx-hud-level{left:12px;top:68px;width:44px}
.zx-hud-paper .zx-minimap{right:2px;top:2px;width:86px;height:86px}
html.zixing .zx-hud-paper .zx-hud-pause{top:96px}
}
@media(max-height:625px){
.zx-hud-paper .zx-skill-slots{bottom:26px}
html.zixing .tc.zx-paper-touch{--zx-ult-size:min(calc(84px * var(--tcs,1)),calc(38vw - 38px));--zx-paper-bottom:max(258px,calc(40% + 10px));--zx-paper-right:18px}
}

/* One continuous status plate. The map owns the clock and the larger silhouette. */
.zx.zx-square-hud .zx-stage-caption{position:absolute;left:12px;top:8px;width:184px;height:26px;pointer-events:none}
.zx.zx-square-hud .zx-hud-profile{position:absolute;left:0;top:3px;right:auto;width:210px;height:84px;overflow:visible;pointer-events:none}
.zx.zx-square-hud .zx-profile-art{position:absolute;left:0;top:0;width:210px;height:52px;background:transparent}
.zx.zx-square-hud .zx-status-values{display:none}
html.zixing .zx-capture-focus{position:absolute;inset:0;z-index:160;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
html.zixing .zx-capture-focus>.cap-vig{position:absolute;inset:0;background:rgba(0,0,0,.48)}
html.zixing .zx-capture-focus>.zx-catch-track{position:relative;align-self:center;margin:0}
html.zixing #hud>.streak.zx-combo{position:absolute;left:auto;right:2px;top:30%;bottom:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:176px;margin:0;padding:0;transform:none;text-align:right;pointer-events:none}
html.zixing #hud>.zx-combo[hidden]{display:none}
html.zixing #hud>.zx-combo>small{display:none}
html.zixing #hud>.zx-combo>b{display:block;color:var(--sc);font-size:27px;line-height:32px;font-weight:900;text-align:right;-webkit-text-stroke:2px #F3F1FA;paint-order:stroke fill;text-shadow:0 1px 2px #293349;animation:none}
html.zixing #hud>.zx-combo>b{width:176px;height:108px;margin:0;line-height:0}
html.zixing #hud>.zx-combo>*{opacity:var(--streak-alpha,1)}
html.zixing #hud>.zx-combo>i{position:absolute;width:0;height:0;margin:0;background:transparent}
html.zixing #hud>.zx-combo>i>u{display:none}

.zx.zx-square-hud .zx-hud-supplies{position:absolute;left:0;top:57px;width:180px;height:23px;padding:0;align-items:flex-start}
.zx.zx-square-hud .zx-inventory-items{width:auto;height:23px;align-items:flex-start}
.zx.zx-square-hud .vitamin-rail{height:23px;gap:2px;padding:1px 4px 1px 2px;border-radius:4px;background:rgba(21,25,32,.64)}
.zx.zx-square-hud .zx-mini-slot.filled{width:23px;height:21px;padding:0;border:0;background:transparent;justify-content:center}
.zx.zx-square-hud .zx-mini-slot>.zx-loadout-icon{width:20px;height:20px;margin:0}
.zx.zx-square-hud .zx-mini-slot>.zx-slot-count{right:0;bottom:-1px;padding:0 1px;min-width:7px;font-size:9px;line-height:10px;color:#F3F1FA;background:#344153}
.zx.zx-square-hud .zx-loadout-more{width:23px;height:21px;min-height:21px;color:#EDF0F5;background:transparent;border:0}
.zx.zx-square-hud .zx-minimap{right:0;top:0;width:100px;height:100px}
.zx.zx-square-hud .zx-map-clock{position:absolute;right:20px;top:87px;width:60px;height:18px;background:rgba(19,24,33,.80);border-radius:2px;display:flex;align-items:center;justify-content:center;pointer-events:none}
.zx.zx-square-hud .zx-map-clock .zx-hud-clock{flex:none;width:auto;min-width:0;max-width:none;color:#F3F1FA;font-size:13px;line-height:16px;white-space:nowrap;text-align:center}
html.zixing .zx.zx-square-hud .zx-hud-pause{right:0;top:110px;width:44px;height:44px;min-height:44px;display:flex;align-items:center;justify-content:center;margin:0;padding:0;background:transparent;border:0;box-shadow:none}
.zx.zx-square-hud .zx-pause-bars{width:31px;height:29px;display:flex;align-items:center;justify-content:center;gap:4px;background:rgba(19,24,33,.74);border-radius:3px}
.zx.zx-square-hud .zx-pause-bars>i{width:4px;height:14px;background:#F3F1FA;border-radius:1px}
.zx.zx-square-hud .zx-battle-lane{position:absolute;left:0;right:52px;top:110px;display:flex;flex-direction:column;align-items:stretch;pointer-events:none}
.zx.zx-square-hud .zx-battle-lane.with-event{top:92px}
.zx.zx-square-hud .zx-battle-lane>.zx-combat-feed{position:relative;top:auto;left:auto;right:auto;width:100%}
.zx.zx-square-hud .zx-world-status{position:relative;display:flex;flex-direction:row;align-items:center;align-self:flex-start;flex:none;height:23px;margin:0 0 6px;padding:0 6px 0 24px;background:rgba(25,30,39,.72);border-radius:2px;pointer-events:none}
.zx.zx-square-hud .zx-world-status>.zx-event-mark{position:absolute;left:5px;top:4px;width:15px;height:15px}
.zx.zx-square-hud .zx-world-status>b{flex:1;min-width:0;color:#F3F1FA;font-size:13px;line-height:18px;white-space:nowrap}
.zx.zx-square-hud .zx-world-status>span{flex:none;padding-left:5px;border-left:1px solid #75818E;color:#DDE5EF;font-size:12px;line-height:15px;white-space:nowrap}
.zx.zx-square-hud .zx-combat-feed>.minibars{position:relative;left:auto;top:auto;width:100%;transform:none;gap:3px}
.zx-battle-lane>.zx-toast-layer{position:relative;width:100%;pointer-events:none}
html.zixing .zx-battle-lane .toasts{position:relative;top:auto;left:auto;right:auto;width:100%;transform:none;margin:0}
html.zixing .zx-battle-lane .toasts>.toast{margin:4px 0 0}
@media(max-width:350px){
.zx.zx-square-hud .zx-hud-profile,.zx.zx-square-hud .zx-profile-art{width:194px}
.zx.zx-square-hud .zx-profile-art{height:48px}
.zx.zx-square-hud .zx-hud-supplies{top:53px}
.zx.zx-square-hud .zx-minimap{width:86px;height:86px}
.zx.zx-square-hud .zx-map-clock{top:75px;right:13px}
html.zixing .zx.zx-square-hud .zx-hud-pause,.zx.zx-square-hud .zx-battle-lane{top:98px}
.zx.zx-square-hud .zx-battle-lane.with-event{top:88px}
}

/* Vitamins stay beside skills; items use one row with a final overflow count. */
.zx.zx-square-hud .zx-loadout{position:absolute;left:0;top:59px;right:auto;bottom:auto;width:218px;height:28px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:4px;pointer-events:none;overflow:visible}
.zx.zx-square-hud .zx-loadout-top{display:flex;flex:none;flex-direction:row;align-items:center;gap:6px;width:100%;height:28px}
.zx.zx-square-hud .zx-hud-supplies,.zx.zx-square-hud .zx-hud-vitamins,.zx.zx-square-hud .zx-skill-slots{position:relative;display:flex;left:auto;right:auto;top:auto;bottom:auto;flex:none;height:28px;margin:0;padding:0;align-items:center;justify-content:flex-start;flex-direction:row;gap:2px;background:transparent}
.zx.zx-square-hud .zx-hud-supplies{width:100%;flex-wrap:nowrap;align-items:flex-start}
.zx.zx-square-hud .zx-loadout [data-paper-surface="hud-cell"]{position:relative;display:flex;flex:none;width:25px;min-width:25px;height:25px;min-height:25px;align-items:center;justify-content:center;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;background:rgba(23,29,36,.56)}
.zx.zx-square-hud .zx-loadout .zx-loadout-icon{width:20px;height:20px;object-fit:contain;margin:0}
.zx.zx-square-hud .zx-loadout .zx-loadout-more{color:#F3F1FA;font-size:10px;line-height:12px;white-space:nowrap}
.zx.zx-square-hud .zx-mini-slot>.zx-slot-count{right:0;bottom:0;min-width:9px;height:11px;padding:0 1px;background:#384655;color:#F3F1FA;font-size:9px;line-height:10px}
.zx.zx-square-hud .zx-skill-slot>.zx-skill-cooldown{width:25px;height:25px;top:0;left:0;transform:none}
.zx.zx-square-hud .zx-skill-slot>.zx-slot-level{right:0;bottom:0;min-width:10px;height:11px;padding:0 1px;border:0;border-radius:1px;background:#D8E4EF;color:#263B55;font-size:9px;line-height:11px}
@media(max-width:350px){
.zx.zx-square-hud .zx-loadout{top:55px;width:194px}
.zx.zx-square-hud .zx-loadout [data-paper-surface="hud-cell"]{width:22px;min-width:22px;height:22px;min-height:22px}
.zx.zx-square-hud .zx-skill-slot>.zx-skill-cooldown{width:22px;height:22px}
}



.lab-research-error{margin:3px 0;padding:6px 9px;border-left:3px solid #BF7181;background:#F3E6EC;color:#7D394C;font-size:14px;line-height:20px}.lab-research-error[hidden]{display:none}
.zx-end-state{margin:4px 0 9px;padding:8px 10px;background:#E5DCCB;border-left:3px solid #BA913C;color:#40382F;font-size:15px}
html.zixing .run-hint{width:230px;max-width:70vw;left:10px;right:auto;top:174px;bottom:auto;height:auto;min-height:0;transform:none;margin:0;align-items:center;gap:7px;padding:7px 10px;border:0;border-left:3px solid #AAC5DF;border-radius:2px;box-shadow:none;background:rgba(36,46,66,.92);color:#EEF1F7}
html.zixing .run-hint b{font-size:14px;line-height:19px;color:#EEF1F7}
html.zixing .run-hint div>span{font-size:12px;line-height:17px;color:#D9E5F1}
html.zixing .run-hint .rh-ic{flex:none;width:25px;height:25px;padding:0;background:transparent;border:0;box-shadow:none}
html.zixing .run-hint .rh-ic img{width:22px;height:22px;object-fit:contain}
.zx .zx-combat-shell>section.zx-shop-shelves{gap:6px}
.zx .zx-shop-inventory{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start}
.zx .zx-shop-status:empty{display:none}
.zx .zx-evo-choice-head,.zx .zx-evo-benefit,.zx .zx-evo-line{display:flex;flex-direction:row;align-items:center;gap:8px}
.zx .zx-evo-choice-head,.zx .zx-evo-benefit{width:100%;justify-content:space-between}
.zx .zx-evo-choice-head>b{font-size:17px;color:#293B56}
.zx .zx-evo-benefit{padding-top:4px;border-top:1px solid #CAD6E4}
.zx .zx-evo-benefit>b{color:#3D6389;font-size:18px}
.zx .zx-evo-benefit>small,.zx .zx-evo-note{color:#485973;font-size:13px;line-height:18px;white-space:normal}
.zx .zx-evo-line{justify-content:center;gap:5px}.zx .zx-evo-form{display:flex;width:36px;height:36px;align-items:center;justify-content:center;background:#DAE5F1}
.zx .zx-evo-form>canvas,.zx .zx-evo-form>.zx-glyph{width:31px;height:31px}
.zx .zx-evo-arrow{color:#7087A4;font-size:14px}.zx .zx-evo-confirm-name{text-align:center;font-size:18px;color:#293B56}
.zx .zx-evo-dialog>.zx-branch-choice{height:auto;min-height:104px;gap:4px;padding:9px 15px;white-space:normal;align-items:stretch}
.zx .zx-build-entry{min-height:37px;padding:4px 1px;gap:6px}
.zx .zx-build-name{font-size:15px;line-height:20px}.zx .zx-build-quantity,.zx .zx-build-index>b{font-size:14px;line-height:19px}
.zx .zx-build-stamp{width:25px;height:25px}.zx .zx-build-stamp>img{width:22px;height:22px}
.zx .zx-outcome-build>b{font-size:16px;line-height:22px}


html.zixing .zx-loading-content[hidden]{display:none}
html.zixing .run-hint .rh-ic+div{flex:1;min-width:0}
html.zixing .toasts{left:12px;right:12px;width:auto;transform:none;align-items:flex-start;gap:4px;pointer-events:none}
html.zixing .toasts[hidden]{display:none}
html.zixing .toasts .toast{display:flex;flex-direction:row;align-items:center;width:auto;max-width:100%;min-height:25px;padding:4px 9px;gap:5px;background:rgba(38,52,72,.9);color:#F0F2F8;border:0;border-left:2px solid #A8C4DF;border-radius:2px;box-shadow:none;font-size:13px;line-height:18px}
html.zixing .toasts .toast[data-priority="urgent"]{border-left-color:#DF969E}
html.zixing .toasts .toast>.zx-weather-mark{width:18px;height:18px;flex:none}
html.zixing .toasts .toast img{width:19px;height:19px;flex:none}
html.zixing .toasts .toast-copy{min-width:0;flex:0 1 auto;white-space:normal;line-height:18px}
html.zixing .zx-battle-lane>.zx-evolution-result{position:relative;inset:auto;width:100%;max-width:320px;height:65px;flex:none;margin:2px 0 3px;pointer-events:none}
html.zixing .zx-square-hud>.zx-evolution-stamp{position:absolute;left:0;top:0;right:auto;bottom:auto;pointer-events:none}
@media(max-width:350px){html.zixing .zx-battle-lane>.zx-evolution-result{height:54px}}

/* The zone clock and weather keep independent faces under the skill row. */
.zx.zx-square-hud .zx-status-row{position:absolute;left:0;top:88px;display:flex;align-items:center;gap:7px;height:29px;pointer-events:none}
.zx.zx-square-hud .zx-status-row .zx-map-clock{position:relative;left:auto;right:auto;top:auto;flex:none;width:92px;height:29px;background:transparent}
.zx.zx-square-hud .zx-status-row .zx-map-clock .zx-hud-clock{display:none}
.zx.zx-square-hud .zx-timer-print{width:92px;height:29px}
.zx.zx-square-hud .zx-world-status{position:relative;display:flex;flex:none;height:29px;align-self:center;margin:0;padding:0;border:0;border-radius:0;background:#29242D;overflow:hidden}
.zx.zx-square-hud .zx-world-status>.zx-event-mark{left:3px;top:4px;width:21px;height:21px;z-index:1}
.zx.zx-square-hud .zx-world-status>b{position:absolute;left:25px;right:42px;top:5px;font-size:14px;line-height:19px;z-index:1}
.zx.zx-square-hud .zx-world-status>span{position:absolute;right:4px;top:3px;color:#FFF8E9;font-size:20px;line-height:23px;padding:0;border:0;z-index:1}
.zx.zx-square-hud .zx-weather-fill{position:absolute;top:0;bottom:0;left:0;height:100%;pointer-events:none}
.zx.zx-square-hud .zx-profile-art,.zx.zx-square-hud .zx-hud-profile{width:186px;height:50px}
.zx.zx-square-hud .zx-loadout{top:57px}
.zx.zx-square-hud .zx-loadout-top{gap:5px}
.zx.zx-square-hud .zx-loadout [data-paper-surface="hud-cell"]{width:24px;height:24px;min-width:24px;min-height:24px;background:rgba(39,35,46,.8)}
.zx.zx-square-hud .zx-minimap{width:132px;height:132px;right:0;top:0}
html.zixing .zx.zx-square-hud .zx-hud-pause,.zx.zx-square-hud .zx-battle-lane,.zx.zx-square-hud .zx-battle-lane.with-event{top:141px}
.zx.zx-square-hud .zx-pause-bars{background:#302934}
html.zixing .tc.zx-paper-touch{--zx-ult-size:70px;--zx-paper-right:16px;--zx-paper-bottom:47%}
html.zixing .tc.zx-paper-touch .zx-field-prompts{left:auto;right:0;width:126px;margin-top:14px}
html.zixing .tc.zx-paper-touch .zx-field-prompts>.tc-act,html.zixing .tc.zx-paper-touch .zx-field-prompts>.release-ally{width:126px;height:62px;min-height:62px;padding:0;border:0;background:#332D34;clip-path:polygon(3% 8%,96% 5%,100% 11%,98% 95%,4% 98%,1% 89%)}
html.zixing .tc.zx-paper-touch .zx-field-prompts>.tc-act>i{position:absolute;left:0;top:0;width:126px;height:62px;pointer-events:none}
html.zixing .tc.zx-paper-touch .zx-interact-print{position:absolute;left:0;top:0;transform:rotate(-3deg);width:126px;height:62px;object-fit:fill;pointer-events:none}
html.zixing .tc.zx-paper-touch .tc-act>span{position:relative;flex:none;width:100%;height:auto;text-align:center}
html.zixing .tc.zx-paper-touch .zx-act-title,html.zixing .tc.zx-paper-touch .zx-act-detail{position:relative;width:100%;text-align:center;color:#27232F;font-weight:900}
html.zixing .tc.zx-paper-touch .zx-act-title{font-size:19px;line-height:23px}
html.zixing .tc.zx-paper-touch .zx-act-detail{font-size:13px;line-height:17px}
.zx .zx-paper-upgrade-head>h2,.zx .zx-paper-upgrade-head>h1{color:#F6D978;-webkit-text-stroke:0}
@media(max-width:365px){
 .zx.zx-square-hud .zx-profile-art,.zx.zx-square-hud .zx-hud-profile{width:171px}
 .zx.zx-square-hud .zx-minimap{width:108px;height:108px}
 .zx.zx-square-hud .zx-status-row{top:86px}
 .zx.zx-square-hud .zx-loadout [data-paper-surface="hud-cell"]{width:22px;min-width:22px;height:22px;min-height:22px}
 html.zixing .zx.zx-square-hud .zx-hud-pause,.zx.zx-square-hud .zx-battle-lane,.zx.zx-square-hud .zx-battle-lane.with-event{top:124px}
}



.screen.zx.zx-home-fixed .zx-home-foot>.zx-button.zx-plain{background:var(--paper-darkStock);color:var(--paper-warmWhite)}
.screen.zx.zx-home-fixed.journey-prep .zx-home-foot>.zx-button.zx-plain{color:var(--paper-warmWhite)}
.screen.zx .zx-home-entry .paper-entry-label,.screen.zx .zx-home-foot>.zx-button>span,.screen.zx .paper-title-label>h1{color:var(--paper-warmWhite)}
.screen.zx .zx-home-entry .paper-button-divider{background:#756D70}
.screen.zx .paper-title-label>.zc-catalog-total{position:absolute;left:auto;right:18px;top:11px;height:22px;padding:0 0 0 7px;gap:4px;border-left:1px solid #756D70;background:transparent;color:var(--paper-warmWhite)}
.screen.zx .zc-catalog-total>span,.screen.zx .zc-catalog-total>b{color:var(--paper-warmWhite)}
.screen.zx [data-action="journey"],.screen.zx [data-action="collection-next"],.screen.zx [data-action="enter"]{color:var(--paper-darkStock);background:var(--paper-yellow)}
.zx-modal.zx-level-up>.zx-choice-list{padding:1px 8px 4px}
.zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{padding:12px 16px;gap:10px}
.zx-level-up .zx-upgrade-art{width:70px}
.zx-level-up .zx-upgrade-art>.zx-loadout-icon,.zx-level-up .zx-upgrade-art>.zx-glyph{width:57px;height:57px;max-width:100%;object-fit:contain}
@media(max-width:350px){.zx-level-up .zx-upgrade-art{width:56px}.zx-level-up .zx-upgrade-art>.zx-loadout-icon,.zx-level-up .zx-upgrade-art>.zx-glyph{width:49px;height:49px}.zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{padding:10px;gap:8px}}

.screen.zx.zx-home-fixed>.zx-home-dock{align-items:flex-end;gap:4px;padding-bottom:6px}
.screen.zx.zx-home-fixed .zx-home-start{width:61%;align-self:flex-end;color:#27232F}
.screen.zx.zx-home-fixed .zx-home-secondary{flex-direction:column;align-items:flex-end;gap:2px}
.screen.zx.zx-home-fixed .zx-home-secondary>.zx-home-entry,.screen.zx.zx-home-fixed .zx-home-foot{width:47%;height:44px;min-height:44px;flex:none}
.screen.zx.zx-home-fixed .zx-home-foot>.zx-button.zx-home-entry{position:relative;width:100%;padding:0}
.screen.zx.zx-home-fixed .zx-home-entry .paper-entry-label,.screen.zx.zx-home-fixed .zx-home-foot>.zx-button .paper-entry-label{color:#FFF8E9}
.screen.zx.zx-home-fixed .paper-entry-content>.paper-menu-symbol{width:24px!important;height:24px!important}
.screen.zx.zx-home-fixed .paper-entry-content>.paper-button-divider{display:none}
.screen.zx.zx-home-fixed.journey-prep .zx-home-start,.screen.zx.zc-library .zx-footer .zc-primary,.screen.zx.zx-route-page .zx-footer .primary,.screen.zx .zx-footer .primary>.zx-action-line,.screen.zx .zx-footer .zc-primary>.zx-action-line{color:#27232F}
.screen.zx.zc-library.journey-prep .zc-list-sheet,.screen.zx.zc-library.journey-prep .journey-commands,.screen.zx.zc-library .zc-library-paper,.screen.zx.journey-prep .zx-route-paper{background:#F1EBDF;border-color:#C1B9A8}
.screen.zx.zc-library .zc-character .zc-tag{background:transparent;color:#504853}
.screen.zx.zc-library .zc-character.locked .zc-tag,.screen.zx.zc-library .zc-character.locked .zc-mystery{color:#F1EBDF}
.screen.zx.zc-library .zc-card-check{background:#27232F}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]{background:#ED9954}
.screen.zx.journey-prep .zx-album-mode[aria-pressed="true"]>h3{color:#27232F}

html.zixing .tc.zx-paper-touch .zx-ticket-label{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;transform:rotate(-3deg);pointer-events:none}
html.zixing .tc.zx-paper-touch .zx-ticket-label>[data-paper-text="ticket"]{-webkit-text-stroke:2.5px #E8B73E;paint-order:stroke fill}
`;
