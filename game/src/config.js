// config.js — every tunable number, ingredient and recipe of Warung Sari Rasa.
// One place holds the game's data so the rules can be rebalanced without
// touching the loop, the drawing or the input handling.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// A full shift lasts two and a half minutes of real play.
export const SHIFT_SECONDS = 150;
export const MAX_ACTIVE_ORDERS = 3;
export const MAX_STOVE_SLOTS = 3;

// How long a raw item takes on the stove, and how long it may sit there
// before it burns and has to be thrown away.
export const COOK_SECONDS = 4;
export const BURN_SECONDS = 9;

// An order that is never served costs the cook this many points and the combo.
export const EXPIRED_ORDER_PENALTY = 25;
export const WRONG_SERVE_PENALTY = 10;

// Every ten points earned also drops one coin into the tip jar.
export const SCORE_PER_COIN = 10;

// Each level makes the rush tighter: orders arrive faster and customers
// wait less patiently. Level rises as the shift clock runs down.
export const LEVELS = [
  { level: 1, spawnEverySec: 9, patienceSec: 48, label: 'Pagi tenang' },
  { level: 2, spawnEverySec: 7, patienceSec: 40, label: 'Mulai ramai' },
  { level: 3, spawnEverySec: 5.5, patienceSec: 33, label: 'Jam makan siang!' },
];

// The six things on the counter. `cook` means the item must spend time on
// the stove before it can go on the plate; the rest are ready to serve.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#fff7e0', accent: '#e8c97a', cook: false, blurb: 'hangat' },
  { id: 'ayam', name: 'Ayam', key: '2', color: '#e8a34c', accent: '#b96a1e', cook: true, blurb: 'goreng' },
  { id: 'telur', name: 'Telur', key: '3', color: '#ffd94d', accent: '#d9a400', cook: true, blurb: 'dadar' },
  { id: 'mie', name: 'Mie', key: '4', color: '#f2c14e', accent: '#c98f1b', cook: true, blurb: 'rebus' },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#7dc383', accent: '#3f7d46', cook: false, blurb: 'segar' },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#e0523d', accent: '#8f1f12', cook: false, blurb: 'pedas!' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// The warung's menu. A plate is served when its ingredients match one of
// these recipes exactly, in any order.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'sayur', 'sambal'], base: 100, emoji: '🍳' },
  { id: 'mie-goreng', name: 'Mie Goreng', needs: ['mie', 'telur', 'sayur'], base: 90, emoji: '🍜' },
  { id: 'ayam-geprek', name: 'Ayam Geprek', needs: ['nasi', 'ayam', 'sambal'], base: 110, emoji: '🍗' },
  { id: 'nasi-ayam', name: 'Nasi Ayam', needs: ['nasi', 'ayam', 'sayur'], base: 100, emoji: '🍛' },
  { id: 'mie-ayam', name: 'Mie Ayam', needs: ['mie', 'ayam', 'sayur'], base: 110, emoji: '🍜' },
  { id: 'telur-dadar', name: 'Telur Dadar', needs: ['telur', 'sayur'], base: 60, emoji: '🍳' },
];

// Friendly one-liners the customers say when an order appears.
export const CUSTOMER_LINES = [
  'Lapar banget, Mas!',
  'Yang pedas ya!',
  'Cepat ya, buru-buru!',
  'Satu porsi, dibungkus!',
  'Tambah sambal dong!',
  'Enak banget kemarin!',
];
