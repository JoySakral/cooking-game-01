// orders.js — the order board: spawning tickets, ticking their patience
// timers, matching a finished plate against them, and scoring a serve.
// An order is { id, recipe, patience, maxPatience, line, bornAt }.

import { RECIPES, CUSTOMER_LINES, MAX_ACTIVE_ORDERS } from './config.js';
import { pickFrom } from './random.js';

let nextOrderId = 1;

export function createOrderBoard() {
  return { orders: [], spawnTimer: 0 };
}

// Choose a recipe that is not already on the board, so the player always
// has distinct dishes to aim for.
export function spawnOrder(board, rng, level, nowSec) {
  if (board.orders.length >= MAX_ACTIVE_ORDERS) return null;
  const taken = new Set(board.orders.map((o) => o.recipe.id));
  const free = RECIPES.filter((r) => !taken.has(r.id));
  const recipe = pickFrom(rng, free.length > 0 ? free : RECIPES);
  const order = {
    id: nextOrderId++,
    recipe,
    patience: level.patienceSec,
    maxPatience: level.patienceSec,
    line: pickFrom(rng, CUSTOMER_LINES),
    bornAt: nowSec,
  };
  board.orders.push(order);
  return order;
}

// Advance every patience timer. Returns the orders that just ran out.
export function tickOrders(board, dt) {
  const expired = [];
  for (const order of board.orders) order.patience -= dt;
  board.orders = board.orders.filter((order) => {
    if (order.patience <= 0) {
      expired.push(order);
      return false;
    }
    return true;
  });
  return expired;
}

// Does the plate hold exactly the recipe's ingredients, in any order?
export function plateMatchesRecipe(plateIds, recipe) {
  if (plateIds.length !== recipe.needs.length) return false;
  const have = plateIds.slice().sort().join(',');
  const want = recipe.needs.slice().sort().join(',');
  return have === want;
}

// Find the first order whose recipe the plate completes, or null.
export function findMatchingOrder(board, plateIds) {
  return board.orders.find((o) => plateMatchesRecipe(plateIds, o.recipe)) || null;
}

// Score for serving an order: base points, a bonus for serving fast, and
// a combo bonus. Returns the points earned.
export function scoreForServe(order, combo) {
  const speedBonus = Math.round((order.patience / order.maxPatience) * 50);
  return order.recipe.base + speedBonus + combo * 10;
}

// How urgent an order looks: calm while half its patience is left,
// "soon" under half, "urgent" under six seconds. The board colours the
// patience bar from this, and the loop ticks a warning on "urgent".
export function orderUrgency(order) {
  if (order.patience < 6) return 'urgent';
  if (order.patience < order.maxPatience / 2) return 'soon';
  return 'calm';
}

export function removeOrder(board, orderId) {
  board.orders = board.orders.filter((o) => o.id !== orderId);
}
