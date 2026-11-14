import EllerMaze from 'rot-js/lib/map/ellermaze.js';
import RNG from 'rot-js/lib/rng.js';
import Graph from 'graphology';
import { singleSourceLength } from 'graphology-shortest-path/unweighted';

/** A cell id, "x,y" in maze-cell coordinates. */
export type Cell = string;

export const cellId = (x: number, y: number): Cell => `${x},${y}`;
export const cellXY = (c: Cell): [number, number] => c.split(',').map(Number) as [number, number];

/** The maze graph rooted at the start: a tree, because the maze is perfect. */
export interface Tree {
  parent: Map<Cell, Cell | null>;
  children: Map<Cell, Cell[]>;
  dist: Record<Cell, number>;
}

export interface Maze {
  cols: number;
  rows: number;
  graph: Graph;
  start: Cell;
  goal: Cell;
  tree: Tree;
}

/** Turn a text seed (from the URL) into the number rot.js wants. FNV-1a hash. */
function seedNumber(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Root an undirected tree graph at `root` using one BFS (graphology-shortest-path). */
export function rootTree(graph: Graph, root: Cell): Tree {
  const dist = singleSourceLength(graph, root);
  const parent = new Map<Cell, Cell | null>();
  const children = new Map<Cell, Cell[]>();
  graph.forEachNode((n) => {
    const nbrs = graph.neighbors(n);
    parent.set(n, nbrs.find((m) => dist[m] === dist[n] - 1) ?? null);
    children.set(n, nbrs.filter((m) => dist[m] === dist[n] + 1));
  });
  return { parent, children, dist };
}

export function generateMaze(cols: number, rows: number, seed: string): Maze {
  // rot.js works on a tile grid where walls are tiles too: cell (x,y) is tile (2x+1, 2y+1).
  RNG.setSeed(seedNumber(seed));
  const open = new Set<string>();
  new EllerMaze(2 * cols + 1, 2 * rows + 1).create((x, y, wall) => {
    if (!wall) open.add(`${x},${y}`);
  });

  const graph = new Graph({ type: 'undirected' });
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) graph.addNode(cellId(x, y));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x + 1 < cols && open.has(`${2 * x + 2},${2 * y + 1}`)) graph.addEdge(cellId(x, y), cellId(x + 1, y));
      if (y + 1 < rows && open.has(`${2 * x + 1},${2 * y + 2}`)) graph.addEdge(cellId(x, y), cellId(x, y + 1));
    }
  }

  const start = cellId(0, 0);
  const tree = rootTree(graph, start);
  // The goal goes as far from the start as possible.
  const goal = Object.keys(tree.dist).reduce((a, b) => (tree.dist[b] > tree.dist[a] ? b : a));
  return { cols, rows, graph, start, goal, tree };
}
