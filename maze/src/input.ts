export type Dir = 'up' | 'down' | 'left' | 'right';

export const STEP: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

/** Arrow keys, swipes on the maze, and the on-screen arrow buttons all call `move`. */
export function bindInput(canvas: HTMLCanvasElement, move: (d: Dir) => void) {
  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    move(dir);
  });

  let from: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => (from = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener('pointerup', (e) => {
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    from = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  });

  document.querySelectorAll<HTMLButtonElement>('#pad [data-dir]').forEach((b) =>
    b.addEventListener('click', () => move(b.dataset.dir as Dir)),
  );
}
