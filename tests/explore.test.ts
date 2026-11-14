import { describe, expect, it } from 'vitest';
import Graph from 'graphology';
import { rootTree } from '../src/maze';
import { Exploration } from '../src/explore';

//  S - a - J1 - b
//          |  \
//          |   J2 - c
//          |    \
//          e     d
//          |
//          G
function setup() {
  const g = new Graph({ type: 'undirected' });
  const edges = [['S', 'a'], ['a', 'J1'], ['J1', 'b'], ['J1', 'J2'], ['J2', 'c'], ['J2', 'd'], ['J1', 'e'], ['e', 'G']];
  for (const [u, v] of edges) g.mergeEdge(u, v);
  return new Exploration(rootTree(g, 'S'), 'S', 'G');
}
const walk = (x: Exploration, cells: string[]) => cells.forEach((c) => expect(x.moveTo(c)).toBe(true));
const sorted = (s: Set<string>) => [...s].sort();

describe('Exploration', () => {
  it('colours the no-choice corridor green only as far as explored', () => {
    const x = setup();
    expect(sorted(x.green)).toEqual(['S']);
    walk(x, ['a']);
    expect(sorted(x.green)).toEqual(['S', 'a']);
    walk(x, ['J1', 'b']);
    // J1 is a junction with open branches, so green stops there.
    expect(sorted(x.green)).toEqual(['J1', 'S', 'a']);
    expect(x.dead.size).toBe(1);
  });

  it('refuses to walk through walls', () => {
    const x = setup();
    expect(x.moveTo('J1')).toBe(false);
    expect(x.route).toEqual(['S']);
  });

  it('marks a visited dead end red, but not the junction', () => {
    const x = setup();
    walk(x, ['a', 'J1', 'b']);
    expect(sorted(x.dead)).toEqual(['b']);
  });

  it('spreads red back through a junction once all its branches are dead', () => {
    const x = setup();
    walk(x, ['a', 'J1', 'J2', 'c', 'J2']);
    expect(sorted(x.dead)).toEqual(['c']);
    walk(x, ['d']);
    expect(sorted(x.dead)).toEqual(['J2', 'c', 'd']);
    expect(x.dead.has('J1')).toBe(false);
  });

  it('turns the only remaining branch green as the player walks it', () => {
    const x = setup();
    walk(x, ['a', 'J1', 'b', 'J1', 'J2', 'c', 'J2', 'd']);
    // e is now the only way, but it is not green until it has been explored.
    expect(sorted(x.green)).toEqual(['J1', 'S', 'a']);
    walk(x, ['J2', 'J1', 'e']);
    expect(sorted(x.green)).toEqual(['J1', 'S', 'a', 'e']);
    walk(x, ['G']);
    expect(x.green.has('G')).toBe(true);
  });

  it('turns already-explored cells green when the last alternative is ruled out', () => {
    const x = setup();
    walk(x, ['a', 'J1', 'e', 'J1', 'J2', 'c', 'J2', 'd', 'J2', 'J1', 'b']);
    expect(sorted(x.green)).toEqual(['J1', 'S', 'a', 'e']);
  });

  it('keeps the route as the path from the start, shrinking on backtrack', () => {
    const x = setup();
    walk(x, ['a', 'J1', 'J2', 'd']);
    expect(x.route).toEqual(['S', 'a', 'J1', 'J2', 'd']);
    walk(x, ['J2', 'J1', 'e', 'G']);
    expect(x.route).toEqual(['S', 'a', 'J1', 'e', 'G']);
    expect(x.won).toBe(true);
    expect(x.moveTo('e')).toBe(false);
  });
});
