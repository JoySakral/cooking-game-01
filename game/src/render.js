// render.js — everything the player sees, drawn on one 2D canvas:
// the warung kitchen, the order board, the ingredient counter, the stove,
// the plate being assembled, and the title / game-over screens.
// Layout numbers live here and are exported so input.js can hit-test
// exactly what is drawn.

import { CANVAS_W, CANVAS_H, INGREDIENTS, INGREDIENT_BY_ID } from './config.js';
import { plateMatchesRecipe, findMatchingOrder } from './orders.js';

export const LAYOUT = {
  headerH: 64,
  board: { x: 16, y: 80, w: 280, ticketH: 158, gap: 12 },
  bins: { x: 312, y: 108, w: 148, h: 176, gap: 8 },
  stove: { x: 312, y: 340, w: 196, h: 128, gap: 12 },
  plate: { cx: 1080, cy: 452, r: 108 },
  serveBtn: { x: 972, y: 576, w: 216, h: 54 },
  trashBtn: { x: 972, y: 640, w: 216, h: 40 },
  hintBar: { x: 312, y: 688, w: 952, h: 24 },
};

// Hit rectangles input.js uses (computed from the layout above).
export function binRect(i) {
  const b = LAYOUT.bins;
  return { x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h };
}
export function stoveRect(i) {
  const s = LAYOUT.stove;
  return { x: s.x + i * (s.w + s.gap), y: s.y, w: s.w, h: s.h };
}
export function ticketRect(i) {
  const b = LAYOUT.board;
  return { x: b.x, y: b.y + i * (b.ticketH + b.gap), w: b.w, h: b.ticketH };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- ingredient icons, each drawn from simple shapes ----------------------

export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'nasi') {
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r, r * 0.62, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f3e2b3';
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.62, r * 0.38, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.5); ctx.quadraticCurveTo(-r * 0.45, -r * 0.85, -r * 0.25, -r * 1.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.5); ctx.quadraticCurveTo(r * 0.4, -r * 0.8, r * 0.2, -r * 1.0); ctx.stroke();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.05, r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c97e2c';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f6e3c2'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.35); ctx.lineTo(r * 0.85, r * 0.85); ctx.stroke();
    ctx.fillStyle = '#f6e3c2';
    ctx.beginPath(); ctx.arc(r * 0.9, r * 0.9, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.72, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb51e';
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf5e';
    ctx.beginPath(); ctx.arc(r * 0.0, -r * 0.14, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, r * (0.1 + i * 0.28), r * (0.75 - i * 0.12), Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.strokeStyle = '#7dc383'; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.55); ctx.lineTo(-r * 0.2, -r * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 0.5); ctx.lineTo(r * 0.65, -r * 0.85); ctx.stroke();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#5da864';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, r * 0.1, r * 0.5, r * 0.75, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7dc383';
    ctx.beginPath(); ctx.ellipse(r * 0.3, -r * 0.05, r * 0.55, r * 0.8, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d46';
    ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.5, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#c93a26';
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.9, r * 0.55, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#e0523d';
    ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.78, r * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#7c1a0c';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---- the kitchen itself ----------------------------------------------------

function drawBackground(ctx) {
  // Warm teal wall with a cream tile band, wooden floor below.
  ctx.fillStyle = '#2e6b64';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#f7ead0';
  ctx.fillRect(0, 64, CANVAS_W, 118);
  ctx.strokeStyle = 'rgba(120,90,40,0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 182); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, 123); ctx.lineTo(CANVAS_W, 123); ctx.stroke();
  // Hanging lamps.
  for (const lx of [420, 700, 980]) {
    ctx.strokeStyle = '#1d4038';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();
    ctx.fillStyle = '#ffcf5e';
    ctx.beginPath(); ctx.moveTo(lx - 22, 30); ctx.lineTo(lx + 22, 30); ctx.lineTo(lx + 12, 52); ctx.lineTo(lx - 12, 52); ctx.closePath(); ctx.fill();
  }
  // Wooden counter and floor.
  ctx.fillStyle = '#a9743f';
  ctx.fillRect(0, 182, CANVAS_W, 538);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 182, CANVAS_W, 10);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  for (let y = 260; y < CANVAS_H; y += 86) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  // A window with a sunny street view, top-left of the wall.
  ctx.fillStyle = '#bfe3ea';
  rr(ctx, 24, 8, 180, 48, 8); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(60, 28, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7dc383';
  ctx.fillRect(24, 44, 180, 12);
}

function drawHeader(ctx, kitchen) {
  ctx.fillStyle = 'rgba(20,26,24,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, 64);
  text(ctx, '🍲 WARUNG SARI RASA', 20, 33, 24, '#ffd94d', 'bold', 'left');
  text(ctx, `SKOR  ${kitchen.score}`, 430, 33, 22, '#ffffff');
  text(ctx, `🪙 ${kitchen.coins}`, 590, 33, 22, '#ffd94d');
  const comboColor = kitchen.combo >= 3 ? '#ff9d4d' : '#ffffff';
  text(ctx, kitchen.combo > 1 ? `🔥 KOMBO x${kitchen.combo}` : 'KOMBO —', 720, 33, 22, comboColor);
  // Shift timer: a bar that drains as the shift runs out.
  const frac = kitchen.shiftLeft / 150;
  const bx = 880, by = 20, bw = 180, bh = 24;
  ctx.fillStyle = '#1d2b28';
  rr(ctx, bx, by, bw, bh, 12); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#ffcf5e' : '#e0523d';
  if (frac > 0.01) { rr(ctx, bx + 2, by + 2, (bw - 4) * frac, bh - 4, 10); ctx.fill(); }
  const mins = Math.floor(kitchen.shiftLeft / 60);
  const secs = Math.floor(kitchen.shiftLeft % 60);
  text(ctx, `⏱ ${mins}:${String(secs).padStart(2, '0')}`, bx + bw / 2, by + bh / 2 + 1, 16, '#ffffff');
  text(ctx, `LV ${kitchen.level.level} · ${kitchen.level.label}`, 1268, 33, 15, '#ffd94d', 'bold', 'right');
}

// ---- order board -----------------------------------------------------------

function drawOrderBoard(ctx, kitchen) {
  const b = LAYOUT.board;
  text(ctx, '📋 PAPAN PESANAN', b.x + b.w / 2, b.y - 14, 17, '#fff7e0', 'bold');
  for (let i = 0; i < 3; i++) {
    const r = ticketRect(i);
    const order = kitchen.board.orders[i];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = order ? '#fff8e6' : 'rgba(255,248,230,0.25)';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.restore();
    if (!order) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,248,230,0.7)';
      ctx.lineWidth = 2;
      rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pelanggan…', r.x + r.w / 2, r.y + r.h / 2, 15, '#fff7e0');
      continue;
    }
    // Ticket header: dish name + patience bar.
    text(ctx, `${order.recipe.emoji} ${order.recipe.name}`, r.x + 14, r.y + 24, 19, '#3a2a18', 'bold', 'left');
    text(ctx, `“${order.line}”`, r.x + 14, r.y + 48, 13, '#8a6a45', 'normal', 'left');
    const frac = Math.max(0, order.patience / order.maxPatience);
    const px = r.x + 14, py = r.y + 66, pw = r.w - 28, ph = 12;
    ctx.fillStyle = '#e8dcc2';
    rr(ctx, px, py, pw, ph, 6); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5da864' : frac > 0.25 ? '#e8a34c' : '#e0523d';
    if (frac > 0.01) { rr(ctx, px, py, pw * frac, ph, 6); ctx.fill(); }
    text(ctx, `${Math.ceil(order.patience)} dtk`, px + pw, py + ph / 2, 13, '#3a2a18', 'bold', 'right');
    // Needed ingredients as little icons, checked off as the plate fills.
    const needs = order.recipe.needs;
    const cell = 52;
    const startX = r.x + (r.w - needs.length * cell) / 2 + cell / 2;
    needs.forEach((id, j) => {
      const cx = startX + j * cell;
      const cy = r.y + 112;
      const onPlate = kitchen.plate.includes(id);
      ctx.fillStyle = onPlate ? '#dff0d8' : '#f3e9d2';
      ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = onPlate ? '#5da864' : '#d9c49a';
      ctx.stroke();
      drawIngredientIcon(ctx, id, cx, cy, 17);
      if (onPlate) {
        ctx.fillStyle = '#3f7d46';
        ctx.beginPath(); ctx.arc(cx + 15, cy - 15, 10, 0, Math.PI * 2); ctx.fill();
        text(ctx, '✓', cx + 15, cy - 14, 13, '#ffffff');
      }
      text(ctx, INGREDIENT_BY_ID[id].name, cx, cy + 34, 12, '#3a2a18');
    });
  }
}

// ---- ingredient counter ----------------------------------------------------

function drawBins(ctx, kitchen) {
  text(ctx, '🥬 MEJA BAHAN — klik bahan (atau tekan 1–6)', LAYOUT.bins.x, LAYOUT.bins.y - 14, 16, '#fff7e0', 'bold', 'left');
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const onPlate = kitchen.plate.includes(ing.id);
    const cooking = kitchen.stove.some((s) => s && s.id === ing.id);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = onPlate ? '#ffe9a8' : '#fff8e6';
    rr(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = onPlate ? '#e8a34c' : '#d9c49a';
    rr(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.stroke();
    // A wooden bowl full of the ingredient.
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 92, 52, 30, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 88, 46, 22, 0, Math.PI, 0); ctx.fill();
    drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 66, 30);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 128, 19, '#3a2a18');
    text(ctx, ing.cook ? '🔥 harus dimasak' : ing.blurb, r.x + r.w / 2, r.y + 150, 13, '#8a6a45');
    // Keyboard hint chip.
    ctx.fillStyle = '#3a2a18';
    rr(ctx, r.x + 8, r.y + 8, 26, 26, 7); ctx.fill();
    text(ctx, ing.key, r.x + 21, r.y + 22, 15, '#ffffff');
    if (onPlate) text(ctx, '✓ DI PIRING', r.x + r.w / 2, r.y + 168, 12, '#3f7d46');
    else if (cooking) text(ctx, '… DI KOMPOR', r.x + r.w / 2, r.y + 168, 12, '#b96a1e');
  });
}

// ---- stove -----------------------------------------------------------------

function drawStove(ctx, kitchen, nowMs) {
  text(ctx, '🔥 KOMPOR — klik yang sudah matang untuk ke piring (Q/W/E)', LAYOUT.stove.x, LAYOUT.stove.y - 14, 16, '#fff7e0', 'bold', 'left');
  kitchen.stove.forEach((slot, i) => {
    const r = stoveRect(i);
    ctx.fillStyle = '#2b2b2e';
    rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
    ctx.strokeStyle = '#55555c';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.stroke();
    // Burner ring.
    ctx.strokeStyle = '#77777e';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 8, 44, 0, Math.PI * 2); ctx.stroke();
    if (!slot) {
      text(ctx, 'kosong', r.x + r.w / 2, r.y + r.h / 2 + 8, 15, '#88888f');
      text(ctx, ['Q', 'W', 'E'][i], r.x + r.w / 2, r.y + 22, 14, '#88888f');
      return;
    }
    // Flames while cooking.
    if (!slot.burnt && slot.cooked < 4) {
      ctx.fillStyle = '#ff9d4d';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 26, r.y + r.h - 18);
      ctx.quadraticCurveTo(r.x + r.w / 2 - 30, r.y + r.h - 52, r.x + r.w / 2, r.y + r.h - 58);
      ctx.quadraticCurveTo(r.x + r.w / 2 + 30, r.y + r.h - 52, r.x + r.w / 2 + 26, r.y + r.h - 18);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 14, r.y + r.h - 18);
      ctx.quadraticCurveTo(r.x + r.w / 2 - 16, r.y + r.h - 40, r.x + r.w / 2, r.y + r.h - 44);
      ctx.quadraticCurveTo(r.x + r.w / 2 + 16, r.y + r.h - 40, r.x + r.w / 2 + 14, r.y + r.h - 18);
      ctx.closePath(); ctx.fill();
    }
    // The pan and its contents.
    ctx.fillStyle = slot.burnt ? '#1c1c1c' : '#4a4a50';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2 + 6, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredientIcon(ctx, slot.id, r.x + r.w / 2, r.y + r.h / 2 + 2, 26);
    // Status line on a dark pill so it reads over flames and the pan.
    const status = slot.burnt ? 'GOSONG! klik buang'
      : slot.cooked >= 4 ? 'MATANG! ✓'
      : `${Math.ceil(4 - slot.cooked)} dtk`;
    const statusColor = slot.burnt ? '#ff8a70' : slot.cooked >= 4 ? '#ffd94d' : '#ffffff';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    const pillW = ctx.measureText(status).width + 18;
    rr(ctx, r.x + r.w / 2 - pillW / 2, r.y + 10, pillW, 26, 13); ctx.fill();
    text(ctx, status, r.x + r.w / 2, r.y + 24, 14, statusColor);
    if (!slot.burnt && slot.cooked >= 4) {
      // Ready: pulsing golden ring.
      const pulse = 0.6 + 0.4 * Math.sin(nowMs / 180);
      ctx.strokeStyle = `rgba(255,217,77,${pulse})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 6, 58, 0, Math.PI * 2); ctx.stroke();
    } else if (!slot.burnt) {
      // Cooking progress ring.
      const frac = slot.cooked / 4;
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 6, 58, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
  });
}

// ---- plate and serving -----------------------------------------------------

function drawPlateArea(ctx, kitchen, nowMs) {
  const p = LAYOUT.plate;
  text(ctx, '🍽 PIRING', p.cx, p.cy - p.r - 22, 17, '#fff7e0', 'bold');
  // Glow when a serve lands, or when the plate completes a recipe.
  const readyOrder = findMatchingOrder(kitchen.board, kitchen.plate);
  if (kitchen.serveGlow > 0 || readyOrder) {
    const a = readyOrder ? 0.55 + 0.3 * Math.sin(nowMs / 200) : kitchen.serveGlow;
    ctx.strokeStyle = `rgba(255,217,77,${Math.max(0, Math.min(1, a))})`;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r + 10, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c49a';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 12, 0, Math.PI * 2); ctx.stroke();
  if (kitchen.plate.length === 0) {
    text(ctx, 'Piring kosong', p.cx, p.cy, 16, '#b0a284');
    text(ctx, 'klik bahan di atas', p.cx, p.cy + 24, 13, '#b0a284', 'normal');
  } else {
    const n = kitchen.plate.length;
    kitchen.plate.forEach((id, i) => {
      const angle = -Math.PI / 2 + (i - (n - 1) / 2) * 0.85;
      const dx = Math.cos(angle) * 42;
      const dy = Math.sin(angle) * 42;
      drawIngredientIcon(ctx, id, p.cx + dx, p.cy + dy, 30);
    });
  }
  // Serve button.
  const s = LAYOUT.serveBtn;
  const canServe = readyOrder !== null;
  ctx.fillStyle = canServe ? '#e8a34c' : '#8a8578';
  ctx.save();
  if (canServe) {
    ctx.shadowColor = '#ffcf5e';
    ctx.shadowBlur = 18;
  }
  rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = canServe ? '#b96a1e' : '#6a6558';
  ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.stroke();
  text(ctx, canServe ? '✅ SAJIKAN! (Spasi)' : 'SAJIKAN (Spasi)', s.x + s.w / 2, s.y + s.h / 2 + 1, 20, '#ffffff');
  if (canServe) text(ctx, `→ ${readyOrder.recipe.name} · +${readyOrder.recipe.base} poin`, s.x + s.w / 2, s.y + s.h + 18, 14, '#ffd94d');
  // Trash button.
  const t = LAYOUT.trashBtn;
  ctx.fillStyle = '#5c3a2e';
  rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  text(ctx, '🗑 Buang isi piring (Backspace)', t.x + t.w / 2, t.y + t.h / 2 + 1, 14, '#ffffff');
}

function drawHintBar(ctx) {
  const h = LAYOUT.hintBar;
  text(ctx, '1–6 bahan   •   Q/W/E ambil dari kompor   •   Spasi sajikan   •   M bisukan suara', h.x + h.w / 2, h.y + h.h / 2, 14, 'rgba(255,247,224,0.85)', 'normal');
}

// ---- feedback, title and game over -----------------------------------------

function drawFeedback(ctx, kitchen) {
  if (kitchen.message && kitchen.elapsed < kitchen.messageUntil) {
    ctx.fillStyle = 'rgba(20,26,24,0.75)';
    const w = 560;
    rr(ctx, CANVAS_W / 2 - w / 2, 500, w, 44, 22); ctx.fill();
    text(ctx, kitchen.message, CANVAS_W / 2, 523, 20, '#ffd94d');
  }
  if (kitchen.flash > 0) {
    ctx.fillStyle = `rgba(224,82,61,${kitchen.flash * 0.5})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawTitleScreen(ctx, kitchen, nowMs) {
  ctx.fillStyle = 'rgba(18,32,28,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '🍲', CANVAS_W / 2, 130, 84, '#ffffff');
  text(ctx, 'WARUNG SARI RASA', CANVAS_W / 2, 215, 58, '#ffd94d');
  text(ctx, 'Dapur Kilat — masak cepat, sajikan tepat waktu!', CANVAS_W / 2, 262, 22, '#fff7e0', 'normal');
  const steps = [
    '1 · Baca pesanan di papan — tiap pelanggan punya waktu tunggu',
    '2 · Klik bahan di meja; ayam, telur & mie harus dimasak dulu di kompor',
    '3 · Kalau piring cocok dengan pesanan, tekan SPASI untuk menyajikan',
  ];
  steps.forEach((s, i) => text(ctx, s, CANVAS_W / 2, 330 + i * 34, 18, '#ffffff', 'normal'));
  const pulse = 0.7 + 0.3 * Math.sin(nowMs / 300);
  ctx.fillStyle = `rgba(232,163,76,${pulse})`;
  rr(ctx, CANVAS_W / 2 - 190, 470, 380, 62, 16); ctx.fill();
  text(ctx, '▶  MULAI SHIFT  (Enter / klik)', CANVAS_W / 2, 502, 22, '#ffffff');
  text(ctx, 'Shift 2½ menit · makin siang makin ramai · kombo menaikkan skor', CANVAS_W / 2, 580, 15, 'rgba(255,247,224,0.8)', 'normal');
  if (kitchen.best > 0) {
    text(ctx, 'Skor terbaik sesi ini: ' + kitchen.best, CANVAS_W / 2, 612, 15, 'rgba(255,247,224,0.8)', 'normal');
  }
}

function drawGameOver(ctx, kitchen, nowMs) {
  ctx.fillStyle = 'rgba(18,32,28,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '⏰ SHIFT SELESAI!', CANVAS_W / 2, 150, 52, '#ffd94d');
  text(ctx, 'Warung tutup — pelanggan pulang kenyang.', CANVAS_W / 2, 200, 20, '#fff7e0', 'normal');
  const rows = [
    ['Skor akhir', String(kitchen.score)],
    ['Piring disajikan', String(kitchen.served)],
    ['Kombo terbaik', `x${kitchen.bestCombo}`],
    ['Koin didapat', `🪙 ${kitchen.coins}`],
    ['Pesanan kabur', String(kitchen.expired)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 280 + i * 44;
    text(ctx, label, CANVAS_W / 2 - 180, y, 20, '#fff7e0', 'normal', 'left');
    text(ctx, value, CANVAS_W / 2 + 180, y, 20, '#ffd94d', 'bold', 'right');
  });
  const verdict = kitchen.score >= 1200 ? '🏆 Koki Bintang Lima! Warungmu legendaris.'
    : kitchen.score >= 700 ? '👨‍🍳 Koki Hebat! Pelanggan pasti kembali.'
    : '🍳 Lumayan! Latihan lagi besok pagi.';
  text(ctx, verdict, CANVAS_W / 2, 520, 22, '#ffffff');
  const pulse = 0.7 + 0.3 * Math.sin(nowMs / 300);
  ctx.fillStyle = `rgba(232,163,76,${pulse})`;
  rr(ctx, CANVAS_W / 2 - 190, 560, 380, 62, 16); ctx.fill();
  text(ctx, '↻  MAIN LAGI  (R / klik)', CANVAS_W / 2, 592, 22, '#ffffff');
}

// ---- main entry point ------------------------------------------------------

export function renderGame(ctx, kitchen, nowMs = Date.now()) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx);
  drawHeader(ctx, kitchen);
  drawOrderBoard(ctx, kitchen);
  drawBins(ctx, kitchen);
  drawStove(ctx, kitchen, nowMs);
  drawPlateArea(ctx, kitchen, nowMs);
  drawHintBar(ctx);
  drawFeedback(ctx, kitchen);
  if (kitchen.screen === 'title') drawTitleScreen(ctx, kitchen, nowMs);
  if (kitchen.screen === 'over') drawGameOver(ctx, kitchen, nowMs);
}
