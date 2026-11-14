// ⭐ This is the file to change together! Everything a game designer
// decides lives here: names, sizes, characters, colours and messages.

export const config = {
  title: 'Maze Adventure',

  // Each level is a maze size: bigger means trickier.
  levels: [
    { name: 'Tiny', cols: 5, rows: 5 },
    { name: 'Small', cols: 8, rows: 8 },
    { name: 'Medium', cols: 12, rows: 12 },
    { name: 'Big', cols: 18, rows: 18 },
    { name: 'Giant', cols: 25, rows: 25 },
  ],

  // Who walks through the maze? Players can pick one of these in the game.
  characters: ['🐱', '🐶', '🦄', '🐰', '🐸', '🐢', '🦖', '🚀'],
  // What are they looking for?
  goals: ['🧀', '💎', '⭐', '🏰', '🍓', '🎁', '🍦', '🌈', '🦴'],

  defaultCharacter: '🐱',
  defaultGoal: '🧀',

  colors: {
    floor: '#fffaf0', // unexplored maze floor
    visited: '#fff1c9', // places you have walked
    deadEnd: '#ffc9c9', // light red: no way through here
    rightWay: '#c8f2c2', // light green: this must be the way!
    wall: '#5b3fa8',
    path: '#ff7a1a', // the line showing your route
  },

  winMessage: 'You did it! 🎉',
  confetti: true,
};

export type Level = (typeof config.levels)[number];
