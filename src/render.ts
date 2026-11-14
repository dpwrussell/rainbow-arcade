import { config } from './config';
import { cellId, cellXY, type Maze } from './maze';
import type { Exploration } from './explore';

export interface Icons {
  character: string;
  goal: string;
}

/** Size the canvas to fit the window and return the size of one cell in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, maze: Maze): number {
  const top = canvas.getBoundingClientRect().top + window.scrollY;
  const footer = document.querySelector('footer')!.getBoundingClientRect().height;
  const availW = document.documentElement.clientWidth - 32;
  const availH = window.innerHeight - top - footer - 24;
  const cell = Math.max(12, Math.floor(Math.min(availW / maze.cols, availH / maze.rows, 88)));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cell * maze.cols}px`;
  canvas.style.height = `${cell * maze.rows}px`;
  canvas.width = Math.round(cell * maze.cols * dpr);
  canvas.height = Math.round(cell * maze.rows * dpr);
  canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
  return cell;
}

export function draw(canvas: HTMLCanvasElement, maze: Maze, x: Exploration, icons: Icons, cell: number) {
  const ctx = canvas.getContext('2d')!;
  const { colors } = config;
  const W = maze.cols * cell;
  const H = maze.rows * cell;
  const centre = (c: string) => cellXY(c).map((v) => (v + 0.5) * cell) as [number, number];

  // 1. Floor shading: red dead ends, green right way, pale visited cells.
  ctx.fillStyle = colors.floor;
  ctx.fillRect(0, 0, W, H);
  maze.graph.forEachNode((c) => {
    const fill = x.dead.has(c) ? colors.deadEnd : x.green.has(c) ? colors.rightWay : x.visited.has(c) ? colors.visited : null;
    if (!fill) return;
    const [cx, cy] = cellXY(c);
    ctx.fillStyle = fill;
    ctx.fillRect(cx * cell, cy * cell, cell, cell);
  });

  // 2. Walls: wherever two neighbouring cells have no passage between them.
  const wall = Math.max(2, cell / 8);
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = wall;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let cy = 0; cy < maze.rows; cy++) {
    for (let cx = 0; cx < maze.cols; cx++) {
      const here = cellId(cx, cy);
      if (cx + 1 < maze.cols && !maze.graph.hasEdge(here, cellId(cx + 1, cy))) {
        ctx.moveTo((cx + 1) * cell, cy * cell);
        ctx.lineTo((cx + 1) * cell, (cy + 1) * cell);
      }
      if (cy + 1 < maze.rows && !maze.graph.hasEdge(here, cellId(cx, cy + 1))) {
        ctx.moveTo(cx * cell, (cy + 1) * cell);
        ctx.lineTo((cx + 1) * cell, (cy + 1) * cell);
      }
    }
  }
  ctx.stroke();
  ctx.lineWidth = wall * 2; // outer border (half of it is clipped by the canvas edge)
  ctx.strokeRect(0, 0, W, H);

  // 3. The route taken, as a line from the start to the player.
  ctx.strokeStyle = colors.path;
  ctx.lineWidth = Math.max(3, cell / 6);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  x.route.forEach((c, i) => (i ? ctx.lineTo(...centre(c)) : ctx.moveTo(...centre(c))));
  ctx.stroke();

  // 4. Emoji icons.
  ctx.font = `${Math.floor(cell * 0.72)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!x.won) ctx.fillText(icons.goal, ...centre(maze.goal));
  ctx.fillText(icons.character, ...centre(x.current));
}
