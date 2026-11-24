export const buttonSoundFiles = {
  tap: 'ui/tap.wav',
  confirm: 'ui/confirm.wav',
  back: 'ui/back.wav',
};

export function buttonSoundFor(root, target) {
  const button = target?.closest?.('button, input[type="button"], input[type="submit"], [role="button"], [role="tab"], [role="switch"]');
  if (!button || !root.contains(button) || button._busy ||
      button.closest(':disabled, [disabled], [aria-disabled="true"], [inert]')) return null;

  const action = button.getAttribute('data-action') ?? '';
  if (button.matches('.paper-back, .paper-dismiss-button') || /(^close-|-back$|-close$|-cancel$|-home$|-return$)/.test(action)) return 'back';
  if (button.matches('.primary, .zc-primary') || /(^confirm-|-confirm$)/.test(action)) return 'confirm';
  return 'tap';
}
