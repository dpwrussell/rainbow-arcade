import { describe, expect, it } from 'vitest';
import { cellXY, generateMaze } from '../src/maze';

describe('generateMaze', () => {
  for (const [cols, rows] of [[5, 5], [12, 12], [25, 25], [9, 4]]) {
    it(`makes a perfect ${cols}x${rows} maze`, () => {
      const m = generateMaze(cols, rows, 'test-seed');
      expect(m.graph.order).toBe(cols * rows);
      // A perfect maze is a tree: connected, with exactly N-1 passages.
      expect(m.graph.size).toBe(m.graph.order - 1);
      expect(Object.keys(m.fromGem.dist)).toHaveLength(m.graph.order);
    });
  }

  it('puts the gem in the middle, the entrance on the left edge and the exit on the right', () => {
    const m = generateMaze(12, 9, 'edges');
    expect(m.gem).toBe('6,4');
    expect(cellXY(m.entrance)[0]).toBe(0);
    expect(cellXY(m.exit)[0]).toBe(11);
    // Each is the edge cell farthest (by maze path) from the gem.
    const leftDists = Array.from({ length: 9 }, (_, y) => m.fromGem.dist[`0,${y}`]);
    const rightDists = Array.from({ length: 9 }, (_, y) => m.fromGem.dist[`11,${y}`]);
    expect(m.fromGem.dist[m.entrance]).toBe(Math.max(...leftDists));
    expect(m.fromGem.dist[m.exit]).toBe(Math.max(...rightDists));
  });

  it('roots each stage at its own starting cell', () => {
    const m = generateMaze(8, 8, 'roots');
    expect(m.fromEntrance.parent.get(m.entrance)).toBeNull();
    expect(m.fromGem.parent.get(m.gem)).toBeNull();
  });

  it('makes the same maze from the same seed', () => {
    const passages = (seed: string) =>
      generateMaze(10, 10, seed).graph.mapEdges((_e, _a, u, v) => `${u}-${v}`).sort();
    expect(passages('abc')).toEqual(passages('abc'));
    expect(passages('xyz')).not.toEqual(passages('abc'));
  });
});
