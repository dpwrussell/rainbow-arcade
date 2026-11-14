import { describe, expect, it } from 'vitest';
import { generateMaze } from '../src/maze';

describe('generateMaze', () => {
  for (const [cols, rows] of [[5, 5], [12, 12], [25, 25], [9, 4]]) {
    it(`makes a perfect ${cols}x${rows} maze`, () => {
      const m = generateMaze(cols, rows, 'test-seed');
      expect(m.graph.order).toBe(cols * rows);
      // A perfect maze is a tree: connected, with exactly N-1 passages.
      expect(m.graph.size).toBe(m.graph.order - 1);
      expect(Object.keys(m.tree.dist)).toHaveLength(m.graph.order);
    });
  }

  it('puts the goal as far from the start as possible', () => {
    const m = generateMaze(12, 12, 'far');
    expect(m.tree.dist[m.goal]).toBe(Math.max(...Object.values(m.tree.dist)));
  });

  it('makes the same maze from the same seed', () => {
    const passages = (seed: string) =>
      generateMaze(10, 10, seed).graph.mapEdges((_e, _a, u, v) => `${u}-${v}`).sort();
    expect(passages('abc')).toEqual(passages('abc'));
    expect(passages('xyz')).not.toEqual(passages('abc'));
  });
});
