// The native Canvas layout and the DOM use the same safe-area coordinates.
export const landscapeStyle=`
@media (orientation:landscape){
  .screen.zx{--paper-footer-bottom:6px;--paper-panel-action-gap:6px}
  .screen.zx>.zx-body{min-height:0}
  .screen.zx>.zx-footer.paper-screen-footer{padding-top:5px;padding-bottom:6px}
  .screen.zx.zx-home-fixed.journey-prep>.zx-home-visual{position:absolute;left:2%;top:0;width:54%;height:100%;min-height:0;margin:0}
  .screen.zx.zx-home-fixed.journey-prep .zx-home-visual>.zx-home-wordmark{left:11%;top:13%;width:78%;height:28%;min-height:0;max-height:140px}
  .screen.zx.zx-home-fixed>.zx-home-top{position:absolute;left:10px;top:5px;width:48px;height:46px;min-height:0;padding:0}
  .screen.zx.zx-home-fixed .zx-home-top .zx-gear,.screen.zx.zx-home-fixed .zx-gear>.zx-paper-icon{width:44px;height:44px}
  .screen.zx.zx-home-fixed.journey-prep>.zx-home-dock{position:absolute;left:57%;right:4%;top:0;bottom:0;height:auto;justify-content:center;padding:6px;gap:12px}
  .screen.zx.zx-home-fixed .zx-home-secondary{flex-direction:row;align-self:stretch;width:100%;gap:8px}
  .screen.zx.zx-home-fixed .zx-home-start,.screen.zx.zx-home-fixed .zx-home-secondary>.zx-home-entry{width:auto;min-height:48px;height:48px}
  .screen.zx.zx-home-fixed .zx-home-start{align-self:stretch;height:57px}
  .screen.zx.zx-home-fixed .zx-home-secondary>.zx-home-entry{flex:1;min-width:0}
  .screen.zx.zx-home-fixed .zx-home-foot{margin:0;align-self:flex-end}
  .screen.zx.zx-home-fixed .zx-home-foot>.zx-button{width:138px;min-width:110px;height:44px}

  .screen.zx.zc-library.journey-prep>.zx-header,.screen.zx.zx-route-page.journey-prep>.zx-header{height:47px;min-height:47px}
  .screen.zx.zc-library.journey-prep>.zx-body,.screen.zx.zx-route-page.journey-prep>.zx-body{position:relative;flex-direction:row;align-items:stretch;gap:0;padding:0}
  .screen.zx.zc-library.journey-prep .journey-air,.screen.zx.zx-route-page.journey-prep .journey-air{width:34%;height:100%;min-height:0;max-height:none;flex:none}
  .screen.zx.journey-prep .selection-binding,.screen.zx.journey-prep .route-binding{width:auto;min-width:0;align-self:stretch;margin:0;padding:6px 10px;gap:7px;flex:1}
  .screen.zx.zc-library.journey-prep .selection-binding{flex-direction:row}
  .screen.zx.zc-library.journey-prep .journey-info{flex:none;width:35%;max-height:100%}
  .screen.zx.zc-library.journey-prep .zc-library-paper{min-width:0;flex:1}
  .screen.zx.journey-prep .route-binding .zx-station-list{flex-direction:row;align-items:stretch;gap:8px}
  .screen.zx.journey-prep .route-binding .zx-destination-feature{width:54%;height:auto;min-height:0}
  .screen.zx.journey-prep .route-binding .zx-destination-hero{height:100%;min-height:0}
  .screen.zx.journey-prep .route-binding .zx-destination-hero>.zx-station-print{height:60%;max-height:none;min-height:0;flex:1}
  .screen.zx.journey-prep .route-binding .zx-destination-caption{flex:none}
  .screen.zx.journey-prep .route-binding .journey-station-index{margin:0;min-width:0}
  .screen.zx.journey-prep .route-binding .journey-station-key{min-height:18px;height:18px}
  .screen.zx.journey-prep .route-binding .zx-route-paper{margin:0}
  .screen.zx.zc-library.journey-prep>.zx-footer,.screen.zx.zx-route-page.journey-prep>.zx-footer{align-self:flex-end;width:66%;padding:4px 8px}

  .screen.zx.collection-journal.zx-settings>.zx-header,.screen.zx.collection-journal.zx-lab>.zx-header,.screen.zx.zx-coop>.zx-header{height:55px;min-height:55px}
  .screen.zx.zx-coop>.zx-body{flex-direction:row;gap:14px;padding:0 8px}
  .zx-coop .coop-team-column{width:37%;overflow-y:auto}
  .zx-coop .coop-pick-column{flex:1}
  .zx-coop .coop-pick-column>.coop-section{height:25px}
  .screen.zx.zx-lab>.zx-body{position:relative;overflow:hidden}
  .screen.zx.zx-lab .lab-balance{position:absolute;left:0;top:0;width:34%;height:62px;min-height:62px}
  .screen.zx.zx-lab .zx-lab-tabs{position:absolute;left:0;top:66px;width:34%;height:46px;margin:0}
  .screen.zx.zx-lab .lab-register{position:absolute;left:35.5%;right:0;top:0;bottom:0;min-height:0;padding:3px 12px}
  .zx-lab .lab-columns{height:32px}
  .zx-lab .lab-record{height:55px}
  .screen.zx.zx-settings .zx-settings-scroll{flex-direction:row;align-items:flex-start;gap:16px}
  .screen.zx.zx-settings .zx-settings-scroll>.zx-card{flex:1;min-width:0;border:0;margin:0;padding:4px 8px}

  .zx.zx-square-hud .zx-profile-art,.zx.zx-square-hud .zx-hud-profile{top:0;width:162px;height:44px}
  .zx.zx-square-hud .zx-minimap{top:0;right:0;width:clamp(78px,22vh,118px);height:clamp(78px,22vh,118px)}
  html.zixing .zx.zx-square-hud .zx-hud-pause{right:clamp(82px,24vh,124px);top:0;align-items:center;justify-content:center}
  .zx.zx-square-hud .zx-loadout{top:47px}
  .zx.zx-square-hud .zx-status-row{top:75px}
  .zx.zx-square-hud .zx-battle-lane,.zx.zx-square-hud .zx-battle-lane.with-event{left:0;right:auto;top:109px;width:min(28vw,280px)}
  html.zixing .tc.zx-paper-touch{--zx-ult-size:clamp(56px,16vh,78px);--zx-paper-right:18px}
  html.zixing .tc.zx-paper-touch .zx-field-controls{bottom:16px;transform:none}
  html.zixing .tc.zx-paper-touch .zx-field-prompts{top:auto;bottom:0;right:100%;left:auto;width:118px;margin:0 9px 0 0;gap:4px}
  html.zixing .tc.zx-paper-touch .zx-field-prompts>.tc-act,html.zixing .tc.zx-paper-touch .zx-field-prompts>.release-ally,
  html.zixing .tc.zx-paper-touch .zx-field-prompts>.tc-act>i,html.zixing .tc.zx-paper-touch .zx-interact-print{width:118px;height:50px;min-height:50px}
  html.zixing .tc.zx-paper-touch .tc-stick:not(.on){left:20px;bottom:16px}

  .zx.zx-modal-wrap{padding:6px 12px}
  html.zixing .zx .zx-modal.zx-choice-dialog,.zx .zx-modal.zx-level-up{width:96%;max-width:940px;max-height:100%}
  .zx .zx-level-up>.zx-choice-list{flex-direction:row;align-items:stretch;gap:7px;min-height:0;overflow-y:auto}
  .zx .zx-level-up .zx-choice-list>.zx-offer.zx-quality-card{flex:1;min-width:0;width:auto}
  .zx .zx-choice-dialog>.zx-choice-actions{flex-direction:row;gap:8px}
  .zx .zx-choice-dialog>.zx-choice-actions>.zx-button{flex:1;min-width:0;width:auto;min-height:44px}
  .zx .zx-pause-leaf,.zx .zx-combat-shell{width:96%;max-width:820px;min-height:0;max-height:100%}
  .zx.zx-pause-screen .zx-modal.zx-pause{padding:4px 10px}
  .zx .zx-modal.zx-battle-map{width:96%;max-width:800px;max-height:100%}
  .screen.zx.journey-entry canvas.zx-entry-ticket{position:absolute;left:55%;bottom:23%;width:39%;height:70px}
}
`;
