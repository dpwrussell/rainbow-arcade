import type { Cell, Tree } from './maze';

/**
 * Tracks what the player has worked out about the maze.
 *
 * The maze is a tree rooted at the start, so:
 * - a cell is a dead end (red) once it has been visited, is not the goal,
 *   and every branch beyond it is a dead end. When the player visits a cell
 *   we check it, then walk up through its parents for as long as they become
 *   dead too. Each cell turns red at most once, so this is O(N) per game.
 * - the right way (green) grows from the start: while the furthest green
 *   cell has exactly one branch that isn't a dead end, and the player has
 *   been there, that branch must be the way to go. This frontier only ever
 *   moves forward: O(N) per game.
 * - the route is a stack: stepping back to the previous cell pops it,
 *   any other step pushes. In a tree that is always the exact route home.
 */
export class Exploration {
  readonly visited = new Set<Cell>();
  readonly dead = new Set<Cell>();
  readonly green = new Set<Cell>();
  readonly route: Cell[];
  private frontier: Cell;

  constructor(
    private tree: Tree,
    start: Cell,
    readonly goal: Cell,
  ) {
    this.route = [start];
    this.frontier = start;
    this.green.add(start);
    this.visit(start);
  }

  get current(): Cell {
    return this.route[this.route.length - 1];
  }

  get won(): boolean {
    return this.current === this.goal;
  }

  /** Is there an open passage from the current cell to `to`? */
  canMove(to: Cell): boolean {
    const here = this.current;
    return this.tree.parent.get(here) === to || (this.tree.children.get(here) ?? []).includes(to);
  }

  /** Step to a neighbouring cell. Returns false if a wall is in the way. */
  moveTo(to: Cell): boolean {
    if (this.won || !this.canMove(to)) return false;
    if (this.route.length >= 2 && this.route[this.route.length - 2] === to) this.route.pop();
    else this.route.push(to);
    this.visit(to);
    return true;
  }

  private visit(cell: Cell) {
    this.visited.add(cell);
    let c: Cell | null | undefined = cell;
    while (c && this.becomesDead(c)) {
      this.dead.add(c);
      c = this.tree.parent.get(c);
    }
    this.advanceGreen();
  }

  private becomesDead(c: Cell): boolean {
    return (
      !this.dead.has(c) &&
      this.visited.has(c) &&
      c !== this.goal &&
      (this.tree.children.get(c) ?? []).every((k) => this.dead.has(k))
    );
  }

  private advanceGreen() {
    while (this.frontier !== this.goal) {
      const open = (this.tree.children.get(this.frontier) ?? []).filter((k) => !this.dead.has(k));
      // Only colour what the player has actually explored; the frontier waits
      // here and moves on when they step into the next cell.
      if (open.length !== 1 || !this.visited.has(open[0])) return;
      this.frontier = open[0];
      this.green.add(this.frontier);
    }
  }
}
