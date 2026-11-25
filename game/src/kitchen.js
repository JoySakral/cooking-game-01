// kitchen.js — the heart of the game: the shift clock, the plate being
// assembled, the stove slots, the score and combo, and the screen flow
// (title -> playing -> game over). Pure state + rules; rendering lives
// in render.js and input lives in input.js.

import {
  SHIFT_SECONDS, MAX_STOVE_SLOTS, COOK_SECONDS, BURN_SECONDS,
  EXPIRED_ORDER_PENALTY, WRONG_SERVE_PENALTY, SCORE_PER_COIN,
  LEVELS, INGREDIENT_BY_ID,
} from './config.js';
import {
  createOrderBoard, spawnOrder, tickOrders, findMatchingOrder,
  scoreForServe, removeOrder,
} from './orders.js';

export function createKitchen(rng) {
  return {
    rng,
    screen: 'title', // 'title' | 'playing' | 'over'
    score: 0,
    best: 0, // best score of this browser session, kept across shifts
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    mistakes: 0,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    level: LEVELS[0],
    board: createOrderBoard(),
    plate: [], // ingredient ids, in the order they were added
    stove: Array.from({ length: MAX_STOVE_SLOTS }, () => null), // {id, cooked, t}
    message: '', // floating feedback line ("Enak! +140")
    messageUntil: 0,
    flash: 0, // red flash timer for a mistake
    serveGlow: 0, // golden glow timer on the plate when a serve lands
  };
}

export function levelForElapsed(elapsed) {
  if (elapsed >= 100) return LEVELS[2];
  if (elapsed >= 50) return LEVELS[1];
  return LEVELS[0];
}

export function startShift(kitchen) {
  // The session best survives a restart; everything else starts fresh.
  const prevBest = Math.max(kitchen.best || 0, kitchen.score || 0);
  const fresh = createKitchen(kitchen.rng);
  fresh.best = prevBest;
  fresh.screen = 'playing';
  Object.assign(kitchen, fresh);
  // Open with two orders so the board is busy from the first second.
  spawnOrder(kitchen.board, kitchen.rng, kitchen.level, 0);
  spawnOrder(kitchen.board, kitchen.rng, kitchen.level, 0);
}

export function endShift(kitchen) {
  kitchen.screen = 'over';
  kitchen.shiftLeft = 0;
  kitchen.best = Math.max(kitchen.best || 0, kitchen.score);
}

function showMessage(kitchen, text, seconds) {
  kitchen.message = text;
  kitchen.messageUntil = kitchen.elapsed + seconds;
}

// Add an ingredient to the plate. Ready ingredients go straight on;
// cookable ones must visit the stove first (see startCooking).
export function addToPlate(kitchen, ingredientId) {
  if (kitchen.screen !== 'playing') return false;
  if (kitchen.plate.includes(ingredientId)) return false; // one of each
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return false;
  if (ing.cook) return false; // raw — it has to be cooked first
  kitchen.plate.push(ingredientId);
  return true;
}

// Move a raw ingredient onto a free stove slot, or return false.
export function startCooking(kitchen, ingredientId) {
  if (kitchen.screen !== 'playing') return false;
  const slot = kitchen.stove.findIndex((s) => s === null);
  if (slot < 0) return false;
  kitchen.stove[slot] = { id: ingredientId, cooked: 0, t: 0, burnt: false };
  return true;
}

// Take a cooked item off the stove and put it on the plate.
export function takeFromStove(kitchen, slotIndex) {
  if (kitchen.screen !== 'playing') return false;
  const slot = kitchen.stove[slotIndex];
  if (!slot || slot.cooked < COOK_SECONDS || slot.burnt) return false;
  if (kitchen.plate.includes(slot.id)) return false;
  kitchen.plate.push(slot.id);
  kitchen.stove[slotIndex] = null;
  return true;
}

// Throw a burnt item away (or clear the whole plate).
export function clearStoveSlot(kitchen, slotIndex) {
  kitchen.stove[slotIndex] = null;
}

export function clearPlate(kitchen) {
  kitchen.plate = [];
}

// Serve the plate to the matching order. Returns 'served', 'wrong' or 'empty'.
export function servePlate(kitchen) {
  if (kitchen.screen !== 'playing') return 'empty';
  if (kitchen.plate.length === 0) return 'empty';
  const order = findMatchingOrder(kitchen.board, kitchen.plate);
  if (!order) {
    kitchen.combo = 0;
    kitchen.mistakes += 1;
    kitchen.score = Math.max(0, kitchen.score - WRONG_SERVE_PENALTY);
    kitchen.flash = 0.5;
    showMessage(kitchen, 'Bukan itu pesanannya!', 1.2);
    return 'wrong';
  }
  const points = scoreForServe(order, kitchen.combo);
  kitchen.score += points;
  kitchen.coins += Math.round(points / SCORE_PER_COIN);
  kitchen.combo += 1;
  kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
  kitchen.served += 1;
  removeOrder(kitchen.board, order.id);
  kitchen.plate = [];
  kitchen.serveGlow = 0.8;
  showMessage(kitchen, `${order.recipe.name} disajikan! +${points}`, 1.4);
  return 'served';
}

// One tick of the simulation: clock, stove, spawner, order patience.
export function tickKitchen(kitchen, dt) {
  if (kitchen.screen !== 'playing') return;
  kitchen.elapsed += dt;
  kitchen.shiftLeft = Math.max(0, SHIFT_SECONDS - kitchen.elapsed);
  kitchen.level = levelForElapsed(kitchen.elapsed);
  if (kitchen.flash > 0) kitchen.flash -= dt;
  if (kitchen.serveGlow > 0) kitchen.serveGlow -= dt;

  // Stove: cooking progresses, then the item waits; left too long it burns.
  for (let i = 0; i < kitchen.stove.length; i++) {
    const slot = kitchen.stove[i];
    if (!slot) continue;
    slot.t += dt;
    if (!slot.burnt) {
      slot.cooked = Math.min(COOK_SECONDS, slot.t);
      if (slot.t > BURN_SECONDS) slot.burnt = true;
    }
  }

  // New customers arrive on a schedule that tightens with the level.
  kitchen.board.spawnTimer += dt;
  if (kitchen.board.spawnTimer >= kitchen.level.spawnEverySec) {
    kitchen.board.spawnTimer = 0;
    spawnOrder(kitchen.board, kitchen.rng, kitchen.level, kitchen.elapsed);
  }

  // Patience runs out: the customer leaves angry.
  const expired = tickOrders(kitchen.board, dt);
  for (const order of expired) {
    kitchen.expired += 1;
    kitchen.combo = 0;
    kitchen.score = Math.max(0, kitchen.score - EXPIRED_ORDER_PENALTY);
    showMessage(kitchen, `${order.recipe.name} keburu pergi... -${EXPIRED_ORDER_PENALTY}`, 1.4);
  }

  if (kitchen.shiftLeft <= 0) endShift(kitchen);
}
