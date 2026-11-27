// The room and its lobby share the journal palette, including native Canvas surfaces.
export const coopStyle=`
.screen.zx.zx-coop>.zx-header{height:84px;min-height:84px;padding-bottom:8px}
.screen.zx.zx-coop>.zx-header small{color:#DDD3C6}
.screen.zx.zx-coop>.zx-body{display:flex;flex-direction:column;gap:0;padding:6px 6px 0;background:transparent;overflow:hidden;scrollbar-width:none}
.coop-ticket{display:flex;flex-direction:row;align-items:center;justify-content:space-between;flex:none;gap:10px;height:76px;padding:10px 12px 10px 15px;background:#F1EBDF}
.coop-ticket>.zx-col{flex:1;min-width:0;gap:0}
.coop-ticket small,.coop-count{font-size:12px;line-height:17px;color:#776B5F}
.coop-number{font-size:27px;line-height:34px;color:#302A32;white-space:nowrap}
.zx-coop[data-room-state="lobby"] .coop-number{font-size:21px;line-height:30px}
.coop-ticket>.coop-room-tag{flex:none;align-self:center;padding:4px 7px;background:#E4DCCB;font-size:12px;line-height:18px;color:#6B5940;text-align:center}
.zx-coop[data-room-state="ready"] .coop-room-tag{background:#D9E1CE;color:#3E6046}
.coop-section{flex:none;display:flex;flex-direction:row;align-items:center;gap:10px;height:37px}
.coop-section>b{color:#FFF8E9;font-size:16px;line-height:21px}
.coop-section>i{height:1px;flex:1;min-width:4px;background:#625963}
.coop-section>.coop-count{color:#DDD3C6}
.coop-seats{display:flex;flex:none;flex-direction:row;align-items:stretch;gap:8px;background:transparent;padding:0}
.coop-seats>.coop-seat{position:relative;display:flex;flex-direction:column;flex:1;min-width:0;height:126px;gap:0;align-items:center;justify-content:center;border:0;border-top:3px solid #A99D8D;padding:7px 8px 9px;background:#F1EBDF}
.coop-seats>.coop-seat.local{border-top-color:#EEC659}
.coop-seats>.coop-seat.is-ready{border-top-color:#668465}
.coop-seats>.coop-seat.offline{border-top-color:#AD7660}
.coop-role{align-self:flex-start;min-height:16px;padding:0 2px;font-size:11px;font-weight:700;line-height:16px;color:#796744}
.coop-seat-art{display:flex;flex-direction:column;align-items:center;justify-content:center;height:51px}
.coop-word{flex:none;width:47px;height:47px;object-fit:contain}
.coop-vacancy{width:33px;height:33px;display:flex;align-items:center;justify-content:center;border:1px solid #978C92;border-radius:18px;text-align:center;font-size:23px;line-height:30px;color:#E6DCC9}
.coop-name{max-width:100%;font-size:15px;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:#302A32}
.coop-state{min-height:18px;font-size:12px;line-height:18px;color:#786F68}
.coop-seats>.coop-seat.empty{background:#49434D}
.coop-seat.empty>.coop-name{font-size:13px;color:#E6DCC9}
.coop-state.ready{font-weight:700;color:#47684B}
.coop-seat.offline>.coop-state{color:#986048}
.zx .coop-seat>.coop-kick{position:absolute;right:3px;top:3px;padding:0 5px;min-height:32px;font-size:12px;color:#934E45}
.coop-roster{display:flex;flex-direction:column;flex:1;min-height:0;padding:8px 8px 4px;background:#F1EBDF}
.screen.zx.zx-coop .coop-roster .zc-library-paper{width:100%;min-height:0;padding:0;background:transparent}
.screen.zx.zx-coop .coop-roster .zc-filters{height:40px;min-height:40px;gap:3px;margin:0 0 5px}
.screen.zx.zx-coop .coop-roster .zc-filter{height:40px;min-height:40px;background:#E3DBCE}
.screen.zx.zx-coop .coop-roster .zc-filter.active{background:#EEC659}
.screen.zx.zx-coop .coop-roster .zc-control-label{height:40px;min-height:40px;color:#302A32;font-size:14px}
.screen.zx.zx-coop .coop-roster .zc-list-sheet{padding:3px 0 2px;background:transparent;border:0;border-bottom:0}
.screen.zx.zx-coop .coop-roster .zc-card-check{background:transparent;border:0;width:17px;height:17px;left:3px;top:2px}
.screen.zx.zx-coop .coop-roster .zc-character.locked .zc-cutout{opacity:1}
.coop-roster .zc-library-scroll{overflow-y:auto}
.coop-status{display:flex;flex-direction:row;align-items:center;flex:none;min-height:38px;gap:8px}
.coop-note{flex:1;min-width:0;margin:0;padding:7px 0 3px;font-size:12px;line-height:18px;color:#DDD3C6}
.coop-note.error{color:#F0B493}
.zx .coop-status>.coop-aux{flex:none;min-height:44px;padding:0 5px;font-size:13px;color:#F0CA64}
.screen.zx.zx-coop>.zx-footer.coop-actions{display:flex;flex:none;flex-direction:row;align-items:center;gap:8px}
.coop-actions>.zx-button{height:var(--paper-nav-height);min-height:var(--paper-nav-height);min-width:0;flex:1;padding:0 2px;white-space:nowrap}
.coop-actions>.zx-button.paper-back{width:var(--paper-nav-width);flex:none;padding:0}
.zx-coop .coop-actions>.zx-button{font-size:18px!important;background:#2B262E;color:#FFF8E9!important}
.zx-coop .coop-actions>.zx-button.primary{background:#EEC659;color:#302A32!important}
.zx-coop .coop-actions>.zx-button:disabled{opacity:1;background:#C9C2C6;color:#625962!important}
@media(max-height:680px){.screen.zx.zx-coop>.zx-header{height:72px;min-height:72px}.zx-coop .coop-ticket{height:62px;padding-top:6px;padding-bottom:6px}.zx-coop .coop-section{height:29px}.zx-coop .coop-seats>.coop-seat{height:99px;padding:4px 7px 6px}.zx-coop .coop-seat-art{height:35px}.zx-coop .coop-word{width:35px;height:35px}.zx-coop .coop-status{min-height:32px}}
@media(max-height:560px){
 .screen.zx.zx-coop{--paper-panel-action-gap:6px;--paper-footer-bottom:6px}
 .screen.zx.zx-coop>.zx-header{height:54px;min-height:54px;padding-bottom:0}
 .screen.zx.zx-coop>.zx-header small{display:none}
 .zx-coop .coop-ticket{height:50px;padding:3px 10px}
 .zx-coop .coop-ticket small{font-size:11px;line-height:14px}
 .zx-coop .coop-number{font-size:24px;line-height:28px}
 .zx-coop[data-room-state="lobby"] .coop-number{font-size:20px;line-height:28px}
 .zx-coop .coop-section{height:24px}
 .zx-coop .coop-seats>.coop-seat{height:90px;padding:3px 7px}
 .zx-coop .coop-role{min-height:14px;line-height:14px}
 .zx-coop .coop-seat-art{height:30px}
 .zx-coop .coop-word{width:30px;height:30px}
 .zx-coop .coop-name{line-height:20px}
 .zx-coop .coop-state{min-height:16px;line-height:16px}
 .screen.zx.zx-coop .coop-roster .zc-filters,.screen.zx.zx-coop .coop-roster .zc-filter,.screen.zx.zx-coop .coop-roster .zc-control-label{height:36px;min-height:36px}
}
.coop-code-display,.coop-code-group,.coop-pad-row{display:flex;flex-direction:row;align-items:stretch}
.coop-code-display{flex:none;gap:10px}
.coop-code-group{flex:1;min-width:0;gap:4px}
.coop-code-digit{flex:1;min-width:0;height:44px;display:flex;align-items:center;justify-content:center;background:#E2D9C9;border-bottom:2px solid #A89B84;color:#302A32;font-size:24px;line-height:31px;text-align:center}
.coop-code-digit.current{background:#F6E5AC;border-bottom:3px solid #B18A30}
.coop-code-pad{flex:none;display:flex;flex-direction:column;gap:4px;margin:13px 0}
.coop-pad-row{gap:5px}
.coop-pad-key{display:flex;flex:1;min-width:0;align-items:center;justify-content:center;height:44px;padding:0;border:0;border-radius:0;background:#E2D9C9;color:#302A32;font-size:19px;font-weight:700;line-height:24px;text-align:center}
.coop-pad-key[data-key="粘贴"],.coop-pad-key[data-key="删除"]{background:#D5CBB8;color:#64543E}
`;
