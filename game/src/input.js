// input.js — mouse clicks and keyboard, translated into kitchen actions.
// Every clickable thing on screen has a rectangle from render.js; every
// key has one job. Input never touches the canvas directly — it calls
// kitchen.js functions and asks audio.js for a sound.

import { INGREDIENTS, INGREDIENT_BY_ID } from './config.js';
import {
  addToPlate, startCooking, takeFromStove, clearStoveSlot, clearPlate,
  servePlate, startShift,
} from './kitchen.js';
import {
  binRect, stoveRect, LAYOUT,
} from './render.js';
import {
  playPop, playSizzle, playServeDing, playBuzz, playClick,
  toggleMute, ensureAudio,
} from './audio.js';

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// Handle one mouse click at canvas coordinates (already scaled).
export function handleClick(kitchen, x, y) {
  ensureAudio();
  if (kitchen.screen === 'title') {
    startShift(kitchen);
    playClick();
    return;
  }
  if (kitchen.screen === 'over') {
    startShift(kitchen);
    playClick();
    return;
  }

  // Ingredient bins: ready food goes on the plate, raw food to the stove.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (!inside(x, y, binRect(i))) continue;
    const ing = INGREDIENTS[i];
    if (ing.cook) {
      if (startCooking(kitchen, ing.id)) playSizzle();
      else playBuzz();
    } else if (addToPlate(kitchen, ing.id)) {
      playPop();
    } else {
      playBuzz();
    }
    return;
  }

  // Stove slots: take a cooked item, or throw a burnt one away.
  for (let i = 0; i < kitchen.stove.length; i++) {
    if (!inside(x, y, stoveRect(i))) continue;
    const slot = kitchen.stove[i];
    if (!slot) return;
    if (slot.burnt) {
      clearStoveSlot(kitchen, i);
      playBuzz();
    } else if (takeFromStove(kitchen, i)) {
      playPop();
    } else {
      playBuzz();
    }
    return;
  }

  // Serve button and trash button.
  if (inside(x, y, LAYOUT.serveBtn)) {
    const result = servePlate(kitchen);
    if (result === 'served') playServeDing();
    else if (result === 'wrong') playBuzz();
    return;
  }
  if (inside(x, y, LAYOUT.trashBtn)) {
    clearPlate(kitchen);
    playBuzz();
    return;
  }

  // Clicking the plate itself also serves when it is complete.
  const p = LAYOUT.plate;
  const dx = x - p.cx, dy = y - p.cy;
  if (dx * dx + dy * dy <= p.r * p.r) {
    const result = servePlate(kitchen);
    if (result === 'served') playServeDing();
    else if (result === 'wrong') playBuzz();
  }
}

// Handle one key press. Returns true when the key did something.
export function handleKey(kitchen, key) {
  const k = key.toLowerCase();
  if (kitchen.screen === 'title') {
    if (k === 'enter' || k === ' ') {
      ensureAudio();
      startShift(kitchen);
      playClick();
      return true;
    }
    return false;
  }
  if (kitchen.screen === 'over') {
    if (k === 'r' || k === 'enter' || k === ' ') {
      ensureAudio();
      startShift(kitchen);
      playClick();
      return true;
    }
    return false;
  }
  if (k === 'm') {
    toggleMute();
    return true;
  }
  // Number keys 1-6 pick an ingredient off the counter.
  const ing = INGREDIENTS.find((g) => g.key === k);
  if (ing) {
    ensureAudio();
    if (ing.cook) {
      if (startCooking(kitchen, ing.id)) playSizzle();
      else playBuzz();
    } else if (addToPlate(kitchen, ing.id)) {
      playPop();
    } else {
      playBuzz();
    }
    return true;
  }
  // Q, W, E take the cooked item off stove slots 1, 2, 3.
  const stoveKeys = ['q', 'w', 'e'];
  const slotIndex = stoveKeys.indexOf(k);
  if (slotIndex >= 0) {
    ensureAudio();
    const slot = kitchen.stove[slotIndex];
    if (!slot) return true;
    if (slot.burnt) {
      clearStoveSlot(kitchen, slotIndex);
      playBuzz();
    } else if (takeFromStove(kitchen, slotIndex)) {
      playPop();
    } else {
      playBuzz();
    }
    return true;
  }
  if (k === ' ' || k === 'enter') {
    ensureAudio();
    const result = servePlate(kitchen);
    if (result === 'served') playServeDing();
    else if (result === 'wrong') playBuzz();
    return true;
  }
  if (k === 'backspace' || k === 'delete') {
    clearPlate(kitchen);
    playBuzz();
    return true;
  }
  return false;
}

// Wire the canvas and the keyboard to a kitchen. `canvas` is the <canvas>
// element; the callback receives already-scaled canvas coordinates.
export function bindInput(canvas, kitchen) {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    handleClick(kitchen, x, y);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
    handleKey(kitchen, event.key);
  });
}
