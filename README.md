# Maze Adventure

A maze game for kids that runs entirely in the browser. Move with the arrow keys (or WASD), swipe on the maze, or tap the on-screen arrows.

- 🟥 **Light red:** places you've fully explored that turned out to be dead ends. The red spreads back to the last junction that still has an unexplored route.
- 🟩 **Light green:** once every other branch is ruled out, the only remaining way is shown in green.
- 🟧 **Orange line:** your route from the start to where you are now.

Every maze comes from a seed in the URL, for example `#level=2&seed=k3x9&me=🐱&goal=🧀`. Share the link and friends get the same maze and the same characters. Nothing is saved anywhere.

## Running it

```sh
npm install
npm run dev      # play at http://localhost:5173
npm test         # unit tests for maze generation and the red/green logic
npm run build    # static site in dist/
```

## Publishing

Push to the `main` branch of a GitHub repo. In the repo, go to **Settings → Pages → Source** and pick **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site.

## Design ideas (all in `src/config.ts`)

- **Name the game:** `title`
- **Choose the characters and things to find:** `characters`, `goals`, `defaultCharacter`, `defaultGoal`. Any emoji works.
- **Pick the colours:** walls, floor, the route line, the red and green
- **Name the levels and choose their sizes:** `levels`
- **Write what it says when you win:** `winMessage`

## How it works

| File | What it does |
|---|---|
| `src/maze.ts` | Generates a *perfect* maze with [rot.js](https://ondras.github.io/rot.js/) (Eller's algorithm, seeded) and loads it into a [graphology](https://graphology.github.io/) graph. A perfect maze is a tree, so one BFS from the start (`graphology-shortest-path`) gives every cell's parent and children. The goal is put on the cell farthest from the start. |
| `src/explore.ts` | Works out the red and green areas incrementally. A visited cell that isn't the goal turns red once all of its children are red, and the check moves up through parents. Green grows from the start while there's exactly one non-red way forward. Each cell changes at most once, so a whole game is O(N). |
| `src/render.ts` | Draws the maze on a canvas, sized to the screen. |
| `src/input.ts` | Handles the keyboard, swipes and buttons. |
| `src/main.ts` | Connects everything: the URL hash, the pickers and the win screen (with [canvas-confetti](https://github.com/catdad/canvas-confetti)). |
