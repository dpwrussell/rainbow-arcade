import confetti from 'canvas-confetti';
import './style.css';
import { lockdown } from '../../shared/lockdown';
import { config } from './config';
import { cellId, cellXY, generateMaze, randomSeed, type Maze } from './maze';
import { Exploration } from './explore';
import { draw, fitCanvas, isImage, setImageLoadHandler, type Icons } from './render';
import { bindInput, STEP, type Dir } from './input';

// All game state lives in memory and the URL hash, e.g. #level=2&seed=k3x9&me=🐱&goal=🧀
// so a link can be shared to play exactly the same maze. Nothing is saved anywhere.
//
// A game has two stages: from the entrance to the treasure in the middle, then from
// the treasure to the exit. The route line and red/green shading start afresh for
// each stage, because getting out may mean going back the way you came.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('maze');
const win = $('win');
const status = $('status');

let levelIndex = 0;
let seed = '';
let icons: Icons = { character: config.defaultCharacter, goal: config.defaultGoal };
let maze: Maze;
let explore: Exploration;
let gemCollected = false;
let cell = 32;

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const lvl = Number(p.get('level'));
  levelIndex = lvl >= 1 && lvl <= config.levels.length ? lvl - 1 : 0;
  seed = p.get('seed') || randomSeed();
  // Only accept icons from our own lists, so a shared link can't load anything else.
  const me = p.get('me');
  const goal = p.get('goal');
  icons = {
    character: me && config.characters.includes(me) ? me : icons.character,
    goal: goal && config.goals.includes(goal) ? goal : icons.goal,
  };
}

function writeHash() {
  const p = new URLSearchParams({ level: String(levelIndex + 1), seed, me: icons.character, goal: icons.goal });
  history.replaceState(null, '', `#${p}`);
}

function newGame() {
  const { cols, rows } = config.levels[levelIndex];
  maze = generateMaze(cols, rows, seed);
  explore = new Exploration(maze.fromEntrance, maze.entrance, maze.gem);
  gemCollected = false;
  status.textContent = config.messages.find;
  win.hidden = true;
  writeHash();
  renderButtons();
  resize();
}

function startLevel(index: number) {
  levelIndex = Math.min(index, config.levels.length - 1);
  seed = randomSeed();
  newGame();
}

const redraw = () => draw(canvas, maze, explore, icons, cell, gemCollected);

function resize() {
  cell = fitCanvas(canvas, maze);
  redraw();
}

function move(dir: Dir) {
  if (gemCollected && explore.won) return;
  const [x, y] = cellXY(explore.current);
  const [dx, dy] = STEP[dir];
  if (!explore.moveTo(cellId(x + dx, y + dy))) {
    canvas.animate([{ translate: '0' }, { translate: `${dx * 4}px ${dy * 4}px` }, { translate: '0' }], 120);
    return;
  }
  if (explore.won && !gemCollected) collectGem();
  else if (explore.won) celebrate();
  redraw();
}

function collectGem() {
  gemCollected = true;
  // Start stage 2 afresh from the treasure: new route line, no red or green yet.
  explore = new Exploration(maze.fromGem, maze.gem, maze.exit);
  status.textContent = config.messages.escape;
  if (config.confetti) {
    const r = canvas.getBoundingClientRect();
    const [gx, gy] = cellXY(maze.gem);
    const origin = { x: (r.left + (gx + 0.5) * cell) / innerWidth, y: (r.top + (gy + 0.5) * cell) / innerHeight };
    confetti({ particleCount: 40, spread: 360, startVelocity: 15, ticks: 60, origin });
  }
}

function celebrate() {
  status.textContent = '';
  $('win-message').textContent = config.messages.win;
  $('next').hidden = levelIndex === config.levels.length - 1;
  win.hidden = false;
  if (config.confetti) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
}

function buttonRow(el: HTMLElement, items: string[], selected: string, pick: (item: string, i: number) => void) {
  el.replaceChildren(
    ...items.map((item, i) => {
      const b = document.createElement('button');
      if (isImage(item)) {
        const img = document.createElement('img');
        img.src = item;
        img.alt = item.replace(/\.\w+$/, '').replace(/-/g, ' ');
        b.append(img);
      } else {
        b.textContent = item;
      }
      b.classList.toggle('selected', item === selected);
      b.addEventListener('click', () => pick(item, i));
      return b;
    }),
  );
}

function renderButtons() {
  buttonRow($('levels'), config.levels.map((l) => l.name), config.levels[levelIndex].name, (_n, i) => startLevel(i));
  buttonRow($('characters'), config.characters, icons.character, (character) => {
    icons = { ...icons, character };
    writeHash();
    renderButtons();
    redraw();
  });
  buttonRow($('goals'), config.goals, icons.goal, (goal) => {
    icons = { ...icons, goal };
    writeHash();
    renderButtons();
    redraw();
  });
}

document.title = config.title;
$('title').textContent = config.title;
$('new').addEventListener('click', () => startLevel(levelIndex));
$('again').addEventListener('click', () => startLevel(levelIndex));
$('next').addEventListener('click', () => startLevel(levelIndex + 1));
window.addEventListener('resize', resize);
window.addEventListener('hashchange', () => {
  readHash();
  newGame();
});
setImageLoadHandler(() => redraw());
bindInput(canvas, move);

lockdown();
readHash();
newGame();
