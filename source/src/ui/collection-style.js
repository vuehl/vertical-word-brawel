export const collectionStyle=`
.screen.zx-collection{background:#faf7ed;color:#333940;font-size:16px;padding:0 18px!important;overflow:hidden}
.zx-collection small{font-size:14px;line-height:20px;color:#788479}
.zx-collection>.zx-header{padding:16px 0 10px;background:transparent;color:#333940;border:0;border-bottom:0;flex:none}
.zx-collection>.zx-header h1{font-size:24px;line-height:32px}
.zx-collection>.zx-header small{font-size:14px}
.zx-collection>.zx-body{padding:0;gap:10px;min-height:0;flex:1;overflow:hidden;overflow-y:hidden;overflow-x:hidden;display:flex;flex-direction:column}
.zx-collection>.zx-footer{padding:10px 0 12px;gap:10px;flex:none;border-top:1px solid #e1e2d5;background:transparent;box-shadow:none;display:flex;flex-direction:column}
.zx-collection .zc-btn{border:1px solid #bccbb7;border-radius:12px;background:#fffef9;box-shadow:0 2px 0 #c9d0bd;color:#48544d;font-size:16px;line-height:22px;min-height:48px;padding:8px 12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;min-width:0;width:auto}
.zx-collection .zc-btn:disabled{opacity:.48}
.zx-collection .zc-actions{display:flex;gap:10px;width:100%;flex:none}
.zx-collection .zc-actions>.zc-back{width:72px;flex:none;background:#fff}
.zx-collection .zc-actions>.zc-primary{flex:1;min-height:52px;background:#f1d994;border:1px solid #c6a455;box-shadow:0 3px 0 #bca266;color:#594e34}
.zc-filters{display:flex;align-items:stretch;gap:4px;flex:none;background:#e4e9da;border:1px solid #d4ddca;padding:4px;border-radius:12px}
.zx-collection .zc-filter{flex:1;border:0;box-shadow:none;background:transparent;padding:5px 3px;min-height:44px;font-size:14px;white-space:nowrap}
.zx-collection .zc-filter.active{background:#fffefa;color:#588371}
.zx-collection .zc-search-button{width:44px;min-height:44px;border:0;box-shadow:none;padding:4px}
.zc-grid{display:flex;flex-direction:column;flex:1;min-height:0;gap:8px}
.zc-grid-row{display:flex;flex:1;gap:8px;min-height:0}
.zc-card-spacer{flex:1;min-width:0}
.zx-collection .zc-character{width:auto;height:auto;min-height:0;flex:1;position:relative;display:flex;flex-direction:column;gap:0;justify-content:flex-end;align-items:center;padding:24px 4px 6px;background:#f4f3e8;border:1px solid #c3cfb6;border-bottom-width:3px;border-radius:13px;overflow:hidden;box-shadow:none}
.zx-collection .zc-character.selected,.zx-collection .zc-look.selected{background:#eaf0dc;border:2px solid #779b81;border-bottom-width:3px}
.zc-character .zc-cutout{width:100%;height:calc(100% - 24px);flex:1;min-height:0;object-fit:contain}
.zc-character.locked .zc-cutout{opacity:.38}
.zc-card-check{position:absolute;left:7px;top:7px;display:flex;align-items:center;justify-content:center;width:20px;height:20px}
.zc-tag{position:absolute;right:6px;top:6px;width:56px;height:20px;text-align:right;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;color:#7f9280}
.zc-card-name{font-size:16px;line-height:22px;flex:none}
.zc-new{position:absolute;bottom:26px;right:4px;border-radius:5px;background:#f0d58f;color:#64563b;padding:0 3px;font-size:14px;line-height:20px}
.zc-mystery{display:flex;align-items:center;justify-content:center;font-size:64px;line-height:1;color:#aebaa8;flex:1}
.zc-pager{display:flex;align-items:center;justify-content:space-between;flex:none;min-height:44px}
.zx-collection .zc-pager .zc-btn{min-height:44px;width:44px;border:0;box-shadow:none;background:transparent;font-size:26px;padding:0}
.zc-summary{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #d7ddcb;background:#eef0e2;border-radius:12px;min-height:60px;flex:none}
.zc-summary .zc-text{width:60px;gap:4px}
.zc-summary.empty{border:0;background:transparent}
.zc-summary>.zc-cutout{width:38px;height:44px;flex:none}
.zc-summary-name{display:flex;flex-direction:column;min-width:0;flex:1}
.zc-summary-name>b{font-size:16px;line-height:22px}
.zc-summary-name>small{white-space:nowrap}
.zx-collection .zc-text{min-height:44px;padding:4px;box-shadow:none;border:0;background:transparent;font-size:14px;color:#6a8c76;flex:none}
.zc-query{display:flex;align-items:center;justify-content:space-between;height:44px;flex:none}
.zc-empty{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;text-align:center}
.zc-intro-space{flex:1;display:flex;align-items:flex-end;justify-content:center;padding:8px;min-height:20px}
.zc-grid.intro{flex-direction:row;flex:none;height:154px;min-height:100px;flex-wrap:nowrap}
.zx-collection .zc-character.intro{height:100%}
.zc-intro-hint{height:142px;flex:none;display:flex;flex-direction:column;gap:8px;justify-content:center;align-items:center;border:1px dashed #bdcbb3;background:#f2f2e5;border-radius:14px;text-align:center}
.zc-flex-space{flex:1;min-height:0}
.zc-panel{display:flex;flex-direction:column;padding:12px;gap:12px;border:1px solid #dce0ce;border-radius:13px;background:#fffdf6;flex:none;min-width:0}
.zc-row{display:flex;align-items:center;gap:10px;min-width:0}
.zc-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
.zc-copy>b{font-size:16px;line-height:22px}
.zc-row>.zx-icon{flex:none}
.zc-detail-hero,.zc-appearance-hero,.zc-unlock-hero{display:flex;align-items:center;justify-content:center;gap:20px;flex:1;min-height:80px;max-height:180px}
.zc-detail-hero>.zc-cutout,.zc-appearance-hero>.zc-cutout,.zc-unlock-hero>.zc-cutout{width:44%;height:100%;object-fit:contain;min-height:0}
.zc-appearance-hero{max-height:none;min-height:80px}
.zc-appearance-options{display:flex;gap:8px;height:140px;min-height:100px;flex:none}
.zx-collection .zc-look{position:relative;display:flex;flex-direction:column;flex:1;gap:2px;padding:22px 4px 6px;min-height:0;overflow:hidden;background:#f4f3e8}
.zc-look>.zc-cutout{width:100%;height:calc(100% - 24px);flex:1;min-height:0;object-fit:contain}
.zc-look>b{font-size:14px;line-height:20px;white-space:nowrap}
.zc-evolutions{display:flex;gap:8px;min-width:0;flex-direction:column}
.zc-evolutions>.zc-row{justify-content:center}
.zc-evolution{display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;font-size:16px}
.zc-evolution>.zc-cutout{width:54px;height:50px;object-fit:contain}
.zc-stat{display:flex;justify-content:space-between;gap:10px}
.zc-stat b{font-size:16px}
.zc-unlock-steps{display:flex;align-items:center;justify-content:space-between;gap:3px;font-size:14px;line-height:20px;flex:none;color:#8f9888}
.zc-unlock-steps .done{color:#689079;font-weight:700}
.zc-condition-title{display:flex;align-items:flex-start;gap:8px;font-size:16px;line-height:22px}
.zc-condition-title>.zx-icon{flex:none}
.zc-progress{height:8px;border-radius:6px;background:#e5e9db;overflow:hidden;flex:none}
.zc-progress>span{height:8px;display:block;background:#7f9e80;border-radius:6px}
.zc-search-panel{padding:16px 0;display:flex;flex-direction:column;gap:14px}
.zc-search-input{height:52px;background:#fffef8;border:1px solid #afbfa8;border-radius:12px;padding:10px 14px;font-size:16px;color:#333;flex:none;width:100%}
.zx-collection.zc-short{padding:0 12px!important}
.zx-collection.zc-short>.zx-header{padding:8px 0 6px}
.zx-collection.zc-short>.zx-header h1{font-size:22px;line-height:28px}
.zx-collection.zc-short>.zx-body{gap:6px}
.zx-collection.zc-short>.zx-footer{padding:6px 0 6px;gap:6px}
.zx-collection.zc-short .zc-intro-hint{height:96px;gap:4px}
.zx-collection.zc-short .zc-character.intro{height:100%}
.zx-collection.zc-short .zc-actions>.zc-primary{min-height:48px}
.zx-collection.zc-short .zc-summary{min-height:54px;padding:3px 6px;gap:4px}
.zx-collection.zc-short .zc-grid.intro{height:116px;min-height:90px}
.zx-collection.zc-short .zc-intro-space{min-height:0;padding:0;flex:none;display:none}
.zx-collection.zc-short .zc-panel{padding:8px;gap:6px}
.zx-collection.zc-short .zc-evolution>.zc-cutout{width:36px;height:28px}
.zx-collection.zc-short .zc-evolutions{gap:2px}
.zx-collection.zc-short .zc-detail-hero{max-height:80px;min-height:40px}
.zx-collection.zc-short .zc-appearance-hero{min-height:56px}
.zx-collection.zc-short .zc-appearance-options{height:112px}
.zx-collection.zc-short .zc-unlock-hero{max-height:90px;min-height:42px}
.zx-collection.zc-short .zc-flex-space{flex:0}
.zc-reward{display:flex;align-items:center;gap:12px;min-height:88px;padding:10px;border:1px solid #dce0ce;border-radius:14px;background:#fffdf6;flex:none}
.zc-reward>.zc-cutout{width:64px;height:64px;flex:none;object-fit:contain}
@media(min-width:600px){.screen.zx-collection{padding-left:calc(50vw - 230px);padding-right:calc(50vw - 230px)}}
`;

