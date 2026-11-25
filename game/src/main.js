// main.js — boots the game: builds the kitchen, wires input, runs the
// frame loop, and freezes time when a staged screenshot is requested.
// Nothing here knows how a dish is drawn or scored; it only connects
// the modules that do.

import { CANVAS_W, CANVAS_H } from './config.js';
import { makeRng } from './random.js';
import { createKitchen, tickKitchen } from './kitchen.js';
import { orderUrgency } from './orders.js';
import { renderGame } from './render.js';
import { bindInput } from './input.js';
import { readShotParams, stageShot } from './shots.js';
import { playTick, playLevelUp } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const rng = makeRng((Math.random() * 0xffffffff) >>> 0);
const kitchen = createKitchen(rng);

// Debug and play-test hook: the live kitchen state, read-only from the
// console. Harmless in play; the game never reads it back.
window.__warung = { kitchen };

bindInput(canvas, kitchen);

// Screenshot mode: stage one fixed scene and never advance the clock,
// so the same URL always renders the same pixels.
const { shot, seed } = readShotParams();
const staged = shot ? stageShot(kitchen, shot, seed) : false;

let lastTime = performance.now();
let lastLevel = kitchen.level.level;
let lastTickSecond = -1;

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (!staged && kitchen.screen === 'playing') {
    tickKitchen(kitchen, dt);
    // A warning tick when any order drops under 6 seconds of patience.
    const urgent = kitchen.board.orders.some((o) => orderUrgency(o) === 'urgent');
    const first = kitchen.board.orders[0];
    const whole = first ? Math.ceil(first.patience) : -1;
    if (urgent && whole !== lastTickSecond) {
      lastTickSecond = whole;
      playTick();
    }
    if (kitchen.level.level !== lastLevel) {
      lastLevel = kitchen.level.level;
      playLevelUp();
    }
  }

  // In a staged shot the clock is frozen at 1000ms, so the pulsing
  // glows render identically every time; in play it runs live.
  renderGame(ctx, kitchen, staged ? 1000 : now);
  requestAnimationFrame(frame);
}

// Keep the canvas crisp on high-DPI screens without changing its layout.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H, 1.4);
  canvas.style.width = `${Math.floor(CANVAS_W * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

requestAnimationFrame(frame);
