// shots.js — deterministic staged states for the screenshots.
// ?shot=start shows the title screen over a busy kitchen, ?shot=play a
// mid-shift moment (orders ticking, a dish mid-assembly, food cooking),
// ?shot=serve a finished plate ready to serve, and ?shot=end the
// game-over screen. The same seed always renders the same picture:
// timers are frozen and the state is built by hand, never by playing.

import { makeRng, pickFrom } from './random.js';
import { createKitchen, startShift } from './kitchen.js';
import { spawnOrder } from './orders.js';
import { LEVELS, RECIPES, CUSTOMER_LINES } from './config.js';

// Read ?shot=...&seed=... from the page URL.
export function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot') || '',
    seed: Number(params.get('seed') || '1'),
  };
}

function orderWithRecipe(kitchen, recipeId, patience, maxPatience, rng) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = {
    id: 900 + kitchen.board.orders.length,
    recipe,
    patience,
    maxPatience,
    line: pickFrom(rng, CUSTOMER_LINES),
    bornAt: 0,
  };
  kitchen.board.orders.push(order);
  return order;
}

// Build the exact kitchen state for one named shot.
export function stageShot(kitchen, shot, seed) {
  const rng = makeRng(seed);
  if (shot === 'start') {
    // Title screen over a kitchen that already looks alive.
    kitchen.screen = 'title';
    kitchen.score = 0;
    kitchen.coins = 0;
    kitchen.combo = 0;
    kitchen.shiftLeft = 150;
    kitchen.level = LEVELS[0];
    orderWithRecipe(kitchen, 'nasi-goreng', 41, 48, rng);
    orderWithRecipe(kitchen, 'mie-ayam', 30, 40, rng);
    kitchen.plate = ['nasi', 'telur'];
    kitchen.stove[0] = { id: 'ayam', cooked: 2.5, t: 2.5, burnt: false };
    return true;
  }
  if (shot === 'play' || shot === 'serve') {
    kitchen.screen = 'playing';
    kitchen.score = 340;
    kitchen.coins = 42;
    kitchen.combo = 3;
    kitchen.bestCombo = 3;
    kitchen.served = 4;
    kitchen.elapsed = 54;
    kitchen.shiftLeft = 96;
    kitchen.level = LEVELS[1];
    orderWithRecipe(kitchen, 'nasi-goreng', 38, 48, rng);
    orderWithRecipe(kitchen, 'ayam-geprek', 21, 33, rng);
    orderWithRecipe(kitchen, 'mie-goreng', 12, 40, rng);
    kitchen.stove[0] = { id: 'ayam', cooked: 2.5, t: 2.5, burnt: false };
    kitchen.stove[1] = { id: 'telur', cooked: 4, t: 5, burnt: false };
    if (shot === 'play') {
      // Mid-assembly: nasi + telur on the plate, ayam still cooking.
      kitchen.plate = ['nasi', 'telur'];
      kitchen.message = 'Nasi Goreng hampir jadi!';
      kitchen.messageUntil = 999999;
    } else {
      // Serve moment: the plate completes the first order exactly.
      kitchen.plate = ['nasi', 'telur', 'sayur', 'sambal'];
      kitchen.message = 'Siap disajikan! Tekan SPASI';
      kitchen.messageUntil = 999999;
      kitchen.serveGlow = 999;
    }
    return true;
  }
  if (shot === 'end') {
    kitchen.screen = 'over';
    kitchen.score = 1250;
    kitchen.coins = 148;
    kitchen.combo = 0;
    kitchen.bestCombo = 6;
    kitchen.served = 9;
    kitchen.expired = 2;
    kitchen.shiftLeft = 0;
    kitchen.elapsed = 150;
    kitchen.level = LEVELS[2];
    orderWithRecipe(kitchen, 'nasi-ayam', 18, 33, rng);
    return true;
  }
  return false;
}

// True when the page is rendering a staged screenshot (timers frozen).
export function isShotMode() {
  return readShotParams().shot !== '';
}
