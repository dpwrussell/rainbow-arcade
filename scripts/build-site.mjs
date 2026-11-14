// Builds the published site in dist/: each game's own build in dist/<folder>/,
// plus an index page with a card for every game listed in "workspaces".
//
// To add a game: make a folder with its own package.json (with a "build" script
// that outputs to dist/, and a "game" section with title, description and icon),
// then add the folder name to "workspaces" in the top-level package.json.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const root = JSON.parse(readFileSync('package.json', 'utf8'));
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const isImage = (icon) => /\.(svg|png|jpe?g|gif|webp)$/i.test(icon);

rmSync('dist', { recursive: true, force: true });
const cards = root.workspaces.map((dir) => {
  const pkg = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
  const game = pkg.game ?? {};
  if (!existsSync(`${dir}/dist/index.html`)) throw new Error(`${dir} has no build in ${dir}/dist`);
  cpSync(`${dir}/dist`, `dist/${dir}`, { recursive: true });
  const icon = game.icon ?? '🎮';
  const iconHtml = isImage(icon)
    ? `<img src="${escape(`${dir}/${icon}`)}" alt="">`
    : `<span aria-hidden="true">${escape(icon)}</span>`;
  return `      <a class="card" href="${escape(dir)}/">
        ${iconHtml}
        <h2>${escape(game.title ?? dir)}</h2>
        <p>${escape(game.description ?? '')}</p>
      </a>`;
});

const page = readFileSync('index.html', 'utf8').replace('<!-- GAMES -->', cards.join('\n'));
writeFileSync('dist/index.html', page);
console.log(`Built site with ${cards.length} game(s) in dist/`);
