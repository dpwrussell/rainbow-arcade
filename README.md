# The Rainbow Arcade

Games we're making together. Each folder is one game:

| Folder | Game |
|---|---|
| [`maze/`](maze/) | **Amazing Maze**: collect the rainbow gem, then find the way out |

## Running

```sh
npm install          # once, installs everything for every game
cd maze && npm run dev   # play one game while working on it
npm test             # test every game
npm run preview      # build the whole site (index page + all games) and view it
```

## Publishing

Pushing to `main` publishes the site to GitHub Pages automatically (`.github/workflows/deploy.yml`): it tests, builds every game, builds the index page and deploys. To set it up once, open the repo on GitHub, go to **Settings → Pages → Source** and pick **GitHub Actions**.

## Adding a new game

1. Make a new folder with its own `package.json`. It needs a `build` script that outputs to `dist/` with relative paths (for Vite, `base: './'`), and a `game` section:
   ```json
   "game": { "title": "My Game", "description": "What you do", "icon": "🚀" }
   ```
   The `icon` can be an emoji or a picture file from the game's build.
2. Add the folder name to `workspaces` in the top-level `package.json`.

`scripts/build-site.mjs` puts each game at `/<folder>/` and adds a card for it to the index page (`index.html`).
