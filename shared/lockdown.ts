import './lockdown.css';

/**
 * Turn off selection, zoom, and other browser gestures so games feel like apps.
 * CSS (lockdown.css) does most of it; these listeners cover what CSS can't:
 * Safari's pinch gestures, Ctrl/Cmd + scroll or trackpad pinch, Ctrl/Cmd +/-/0,
 * long-press menus, and dragging images.
 */
export function lockdown() {
  const prevent = (e: Event) => e.preventDefault();
  const active = { passive: false } as const;
  for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart']) {
    document.addEventListener(type, prevent, active);
  }
  document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), active);
  window.addEventListener('wheel', (e) => e.ctrlKey && e.preventDefault(), active);
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault();
  });
}
