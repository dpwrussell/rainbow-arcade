import confetti from 'canvas-confetti';
import './style.css';
import { config } from './config';
import { cellId, cellXY, generateMaze, randomSeed, type Maze } from './maze';
import { Exploration } from './explore';
import { draw, fitCanvas, type Icons } from './render';
import { bindInput, STEP, type Dir } from './input';

// All game state lives in memory and the URL hash, e.g. #level=2&seed=k3x9&me=🐱&goal=🧀
// so a link can be shared to play exactly the same maze. Nothing is saved anywhere.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('maze');
const win = $('win');

let levelIndex = 0;
let seed = '';
let icons: Icons = { character: config.defaultCharacter, goal: config.defaultGoal };
let maze: Maze;
let explore: Exploration;
let cell = 32;

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const lvl = Number(p.get('level'));
  levelIndex = lvl >= 1 && lvl <= config.levels.length ? lvl - 1 : 0;
  seed = p.get('seed') || randomSeed();
  icons = { character: p.get('me') || icons.character, goal: p.get('goal') || icons.goal };
}

function writeHash() {
  const p = new URLSearchParams({ level: String(levelIndex + 1), seed, me: icons.character, goal: icons.goal });
  history.replaceState(null, '', `#${p}`);
}

function newGame() {
  const { cols, rows } = config.levels[levelIndex];
  maze = generateMaze(cols, rows, seed);
  explore = new Exploration(maze.tree, maze.start, maze.goal);
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

const redraw = () => draw(canvas, maze, explore, icons, cell);

function resize() {
  cell = fitCanvas(canvas, maze);
  redraw();
}

function move(dir: Dir) {
  if (explore.won) return;
  const [x, y] = cellXY(explore.current);
  const [dx, dy] = STEP[dir];
  const to = cellId(x + dx, y + dy);
  if (!explore.moveTo(to)) {
    canvas.animate([{ translate: '0' }, { translate: `${dx * 4}px ${dy * 4}px` }, { translate: '0' }], 120);
    return;
  }
  redraw();
  if (explore.won) celebrate();
}

function celebrate() {
  $('win-message').textContent = config.winMessage;
  $('next').hidden = levelIndex === config.levels.length - 1;
  win.hidden = false;
  if (config.confetti) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
}

function buttonRow(el: HTMLElement, items: string[], selected: string, pick: (item: string, i: number) => void) {
  el.replaceChildren(
    ...items.map((item, i) => {
      const b = document.createElement('button');
      b.textContent = item;
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
bindInput(canvas, move);

readHash();
newGame();
