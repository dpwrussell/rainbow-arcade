import { config } from './config';
import { cellId, cellXY, type Maze } from './maze';
import type { Exploration } from './explore';

export interface Icons {
  character: string;
  goal: string;
}

/** An icon is an emoji, or the file name of a picture in public/. */
export const isImage = (icon: string) => /\.(svg|png|jpe?g|gif|webp)$/i.test(icon);

const images = new Map<string, HTMLImageElement>();
let onImageLoad = () => {};
/** Called when a picture icon finishes loading, so the maze can be redrawn. */
export const setImageLoadHandler = (fn: () => void) => (onImageLoad = fn);

function image(src: string): HTMLImageElement {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.onload = () => onImageLoad();
    img.src = src;
    images.set(src, img);
  }
  return img;
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: string, [x, y]: [number, number], cell: number) {
  if (isImage(icon)) {
    const img = image(icon);
    const s = cell * 0.8;
    if (img.complete && img.naturalWidth) ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
  } else {
    ctx.fillText(icon, x, y);
  }
}

/** Size the canvas to fit the window and return the size of one cell in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, maze: Maze): number {
  const top = canvas.getBoundingClientRect().top + window.scrollY;
  const footer = document.querySelector('footer')!.getBoundingClientRect().height;
  const availW = document.documentElement.clientWidth - 32;
  const availH = window.innerHeight - top - footer - 24;
  const cell = Math.max(6, Math.floor(Math.min(availW / maze.cols, availH / maze.rows, 88)));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cell * maze.cols}px`;
  canvas.style.height = `${cell * maze.rows}px`;
  canvas.width = Math.round(cell * maze.cols * dpr);
  canvas.height = Math.round(cell * maze.rows * dpr);
  canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
  return cell;
}

export function draw(
  canvas: HTMLCanvasElement,
  maze: Maze,
  x: Exploration,
  icons: Icons,
  cell: number,
  gemCollected: boolean,
) {
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

  // Outer border, with a gap at the entrance (left) and the exit (right).
  // It's twice as thick because half of it is clipped by the canvas edge.
  const inY = cellXY(maze.entrance)[1] * cell;
  const outY = cellXY(maze.exit)[1] * cell;
  ctx.lineWidth = wall * 2;
  ctx.beginPath();
  ctx.moveTo(0, inY);
  ctx.lineTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, outY);
  ctx.moveTo(W, outY + cell);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.lineTo(0, inY + cell);
  ctx.stroke();

  // 3. The route taken, as a line from where this stage started to the player.
  ctx.strokeStyle = colors.path;
  ctx.lineWidth = Math.max(3, cell / 6);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  x.route.forEach((c, i) => (i ? ctx.lineTo(...centre(c)) : ctx.moveTo(...centre(c))));
  ctx.stroke();

  // 4. Icons. The door is faint until the treasure has been collected.
  ctx.font = `${Math.floor(cell * 0.72)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = gemCollected ? 1 : 0.35;
  drawIcon(ctx, config.exitIcon, centre(maze.exit), cell);
  ctx.globalAlpha = 1;
  if (!gemCollected) drawIcon(ctx, icons.goal, centre(maze.gem), cell);
  drawIcon(ctx, icons.character, centre(x.current), cell);
}
