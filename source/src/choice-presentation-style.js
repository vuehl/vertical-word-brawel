// Shared choice surfaces: rarity colours never encode positive/negative effects.
export const choicePresentationStyle = `
.zx-modal.zx-choice-dialog{max-width:420px;padding:18px;gap:10px;overflow:hidden;overflow-x:hidden;overflow-y:hidden}
.zx-choice-dialog>h2{font-size:22px;line-height:28px;margin:0}
.zx-choice-dialog>.zx-choice-help{font-size:14px;line-height:20px;margin:0;color:#62716b;text-align:center}
.zx-choice-dialog>.zx-upgrade-stats{min-height:44px;margin:0;padding:0 4px;font-size:14px;flex:none}
.zx-choice-dialog>.zx-choice-list{display:flex;flex-direction:column;gap:10px;min-height:0;flex:0 1 auto;overflow-y:auto;padding:1px 1px 3px}
.zx-choice-list>.zx-quality-card{flex:none}
.zx-choice-dialog>.zx-choice-actions{display:flex;flex-direction:column;gap:8px;flex:none;margin:0;padding:2px 0 0}
.zx-choice-actions>.zx-button{width:100%;min-height:48px;font-size:16px}
.zx-upgrade .zx-offer.zx-quality-card{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:8px;min-height:0;padding:12px;border-width:2px;border-style:solid;border-radius:14px;text-align:left;box-shadow:0 2px 0 #233a4210;white-space:normal}
.zx .zx-quality-card[data-quality="common"]{background:#f0f2f3;border-color:#a7afb7}
.zx .zx-quality-card[data-quality="uncommon"]{background:#e7f3e4;border-color:#7eab74}
.zx .zx-quality-card[data-quality="rare"]{background:#e4effc;border-color:#729ed1}
.zx .zx-quality-card[data-quality="epic"]{background:#eee5fb;border-color:#a186c2}
.zx .zx-quality-card[data-quality="legendary"]{background:#fff0c7;border-color:#cca24b}
.zx .zx-quality-card[data-quality="special"]{background:#f4ebe0;border-color:#bba68f}
.zx-choice-top{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;flex:none}
.zx-choice-top>h2{font-size:22px;line-height:28px;margin:0;flex:1;text-align:left;min-width:0}
.zx-choice-top>.zx-choice-stats{display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:5px;min-height:44px;width:auto;padding:0 2px;flex:none;background:transparent;border:0;box-shadow:none;font-size:14px;color:#65577b}
.zx-choice-heading{display:flex;flex-direction:row;align-items:center;gap:12px;width:100%;min-width:0;flex:none}
.zx-choice-heading>.zx-glyph{flex:none;width:32px;height:34px;border-radius:9px}
.zx-choice-identity{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:6px;flex:1;min-width:0;text-align:left}
.zx-offer .zx-choice-title{font-size:17px;line-height:24px;color:#293a3e;white-space:normal}
.zx-choice-tags{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:6px}
.zx-quality-badge{display:flex;flex-direction:row;align-items:center;align-self:flex-start;flex:none;min-height:24px;padding:1px 8px;border-radius:6px;border:1px solid #bba68f;background:#f7f2eb;color:#6b5841;font-size:14px;line-height:20px;font-weight:800;white-space:nowrap}
.zx-quality-badge.common{color:#465362;background:#e1e6ea;border-color:#a7afb7}
.zx-quality-badge.uncommon{color:#365d32;background:#d3e9ce;border-color:#7eab74}
.zx-quality-badge.rare{color:#315f94;background:#d1e3fa;border-color:#729ed1}
.zx-quality-badge.epic{color:#67468b;background:#e1d1f5;border-color:#a186c2}
.zx-quality-badge.legendary{color:#805b16;background:#ffe6a3;border-color:#cca24b}
.zx-choice-kind{font-size:14px;line-height:20px;color:#536568;font-weight:600}
.zx-choice-effect{display:flex;flex-direction:row;align-items:flex-start;flex-wrap:wrap;gap:6px;padding:6px 8px;border-radius:8px;background:#ffffffa8;border:1px solid #c7d0ce;flex:none;text-align:left}
.zx-choice-effect.boon{background:#eef7ed;border-color:#b3ceb0;color:#326841}
.zx-choice-effect.bane{background:#fff0ed;border-color:#e1b7ad;color:#a23e38}
.zx-choice-effect.neutral{background:#ffffffb8;border-color:#c7d0ce;color:#4d6065}
.zx-effect-sign{display:flex;flex-direction:row;align-items:center;justify-content:center;flex:none;width:20px;height:22px;border-radius:5px;background:#dcefd8;color:#326841;font-size:17px;line-height:22px;font-weight:800}
.bane>.zx-effect-sign{background:#f8d9d2;color:#a23e38}
.neutral>.zx-effect-sign{background:#e6eceb;color:#4d6065}
.zx-effect-scope{align-self:center;flex:none;font-size:14px;line-height:22px;color:inherit;font-weight:500}
.zx-effect-value{flex:1;min-width:0;font-size:15px;line-height:22px;color:inherit;font-weight:600;white-space:normal;word-break:break-word}
.zx-choice-effect.boon .zx-effect-scope,.zx-choice-effect.boon .zx-effect-value{color:#326841}
.zx-choice-effect.bane .zx-effect-scope,.zx-choice-effect.bane .zx-effect-value{color:#a23e38}
.zx-choice-effect.neutral .zx-effect-scope,.zx-choice-effect.neutral .zx-effect-value{color:#4d6065}
.zx-choice-description{font-size:16px;line-height:24px;font-weight:500;color:#41595a;margin:0;text-align:left;white-space:normal;word-break:break-word}
.zx-choice-note{font-size:14px;line-height:21px;color:#52636a;margin:0;font-weight:500}
.zx-quality-card[data-unavailable="true"]{opacity:.55}
.zx-item-dialog .zx-item-card.zx-quality-card{border-width:2px;border-style:solid;gap:12px;padding:12px;min-height:0;border-radius:14px}
.zx-item-card.zx-quality-card>.zx-item-hero{background:#ffffff90;border:0;min-height:80px;border-radius:10px}
.zx-item-option.zx-quality-card>.zx-item-hero{width:48px;height:58px;min-height:58px;flex:none;align-self:flex-start}
.zx-item-option.zx-quality-card .zx-item-image{width:40px;height:40px}
.zx-item-card.zx-quality-card>.zx-item-copy{gap:8px;min-width:0;text-align:left}
.zx-item-card.zx-quality-card .zx-item-copy>h3{font-size:18px;line-height:25px;margin:0;text-align:left}
.zx-item-card.zx-quality-card .zx-item-description{font-size:14px;line-height:21px;margin:0;color:#53646a}
.zx-item-card.zx-quality-card .zx-choice-effect{padding:7px;gap:5px}
.zx-item-dialog .zx-item-actions>.zx-button{font-size:16px;min-height:46px}
@media(max-width:350px){
.zx-modal.zx-choice-dialog{padding:14px;gap:8px}
.zx-choice-dialog>h2{font-size:20px;line-height:26px}
.zx-choice-dialog>.zx-choice-list{gap:8px}
.zx-upgrade .zx-offer.zx-quality-card{padding:10px;gap:7px}
.zx-choice-heading{gap:8px}
.zx-choice-heading>.zx-glyph{width:30px;height:32px}
.zx-offer .zx-choice-title{font-size:16px;line-height:23px}
.zx-item-dialog .zx-item-option.zx-quality-card{flex-direction:column;gap:8px}
.zx-item-option.zx-quality-card>.zx-item-hero{display:none}
}
@media(max-height:660px){
.zx-modal.zx-choice-dialog{padding-top:14px;padding-bottom:14px;gap:8px}
.zx-choice-dialog>.zx-choice-list{gap:8px}
}
/* Flat rewards: keep art/title/rarity on one row, not above the description. */
.zx-item-dialog .zx-item-card.zx-quality-card{flex-direction:column;align-items:stretch;gap:8px}
.zx-item-heading{display:flex;flex-direction:row;align-items:center;gap:10px;flex:none;min-width:0}
.zx-item-heading>.zx-item-hero{width:40px;height:44px;min-height:44px;flex:none;background:#ffffff90;border:0;border-radius:8px}
.zx-item-heading .zx-item-image{width:34px;height:34px;margin:0}
.zx-item-title-row{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:8px;flex:1;min-width:0}
.zx-item-title-row>h3{font-size:18px;line-height:25px;margin:0;text-align:left;color:#293a3e}
.zx-item-card.zx-quality-card>.zx-item-copy{gap:5px;flex:none}
.zx-item-dialog .zx-item-note{font-size:14px;line-height:21px}
`;



