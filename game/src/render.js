// Night Ledger — canvas rendering: floor, walls, cones, actors, HUD, screens.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS } from './config.js';
import { conePolygon } from './vision.js';

function drawFloor(ctx, world) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  // Exit pad.
  const ex = world.exit.x * TILE, ey = world.exit.y * TILE;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(ex + 3, ey + 3, TILE - 6, TILE - 6);
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55 + 0.45 * pulse;
  ctx.strokeRect(ex + 5, ey + 5, TILE - 10, TILE - 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#dff7e8';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex + TILE / 2, ey + TILE / 2 + 3);
  // Ledgers and coins.
  for (const l of world.ledgers) {
    if (l.taken) continue;
    const cx = (l.x + 0.5) * TILE, cy = (l.y + 0.5) * TILE;
    ctx.fillStyle = COLORS.ledger;
    ctx.fillRect(cx - 9, cy - 7, 18, 14);
    ctx.fillStyle = '#8a6d1a';
    ctx.fillRect(cx - 9, cy - 7, 4, 14);
    ctx.fillStyle = '#3a2f05';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('LEDGER', cx + 1, cy + 3);
  }
  for (const c of world.coins) {
    if (c.taken) continue;
    const cx = (c.x + 0.5) * TILE, cy = (c.y + 0.5) * TILE;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6d1a';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('$', cx, cy + 3);
  }
}

function drawWalls(ctx, world) {
  for (const key of world.walls) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x * TILE, y * TILE, TILE, 6);
  }
  for (const key of world.crates) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * TILE + 5, y * TILE + 5, TILE - 10, TILE - 10);
  }
}

function drawCone(ctx, world, g) {
  const pts = conePolygon(world, g);
  ctx.fillStyle = g.state === 'chase' ? COLORS.coneAlarmed
    : (g.detect > 0.15 || g.state === 'investigate') ? COLORS.coneSuspicious : COLORS.coneCalm;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawActor(ctx, x, y, facing, bodyColor, trimColor, stepPhase, isPlayer, sneaking) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(1, 3, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Feet shuffle while moving.
  const shuffle = Math.sin(stepPhase) * 3;
  ctx.fillStyle = '#222a38';
  ctx.beginPath(); ctx.arc(-4, -6 + shuffle * 0.4, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4, 6 - shuffle * 0.4, 3.4, 0, Math.PI * 2); ctx.fill();
  // Body.
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.arc(0, 0, isPlayer ? 11 : 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Direction nose / cap brim.
  ctx.fillStyle = trimColor;
  ctx.beginPath(); ctx.arc(7, 0, 4.5, 0, Math.PI * 2); ctx.fill();
  if (isPlayer && sneaking) {
    ctx.strokeStyle = 'rgba(127,212,255,0.7)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawGuardMark(ctx, g) {
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20);
  } else if (g.detect > 0.12 || g.state === 'investigate' || g.state === 'search') {
    ctx.fillStyle = '#ffb35c';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 20);
  }
}

export function drawWorld(ctx, game) {
  const { world, player, guards, pebbles } = game;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, world);
  for (const g of guards) drawCone(ctx, world, g);
  // Pebble landing ripples.
  for (const p of pebbles) {
    const r = 4 + p.age * 26;
    ctx.strokeStyle = `rgba(230,235,245,${Math.max(0, 0.8 - p.age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#cfd6e2';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  drawWalls(ctx, world);
  for (const g of guards) {
    const color = g.state === 'chase' ? COLORS.guardAlarmed
      : (g.detect > 0.15 ? COLORS.guardSuspicious : COLORS.guard);
    drawActor(ctx, g.x, g.y, g.facing, color, '#5c1710', g.stepPhase, false, false);
    drawGuardMark(ctx, g);
  }
  drawActor(ctx, player.x, player.y, player.facing,
    player.sneaking ? COLORS.playerSneak : COLORS.player, '#17394f',
    player.stepPhase, true, player.sneaking);
  // Night vignette: darkens edges so cones read as light.
  const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  grad.addColorStop(0, 'rgba(4,6,12,0)');
  grad.addColorStop(1, 'rgba(4,6,12,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawHud(ctx, game) {
  const { levelIndex, score, strikes, world, player, guards, levelTime } = game;
  ctx.fillStyle = 'rgba(8,11,18,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = '#d7dee9';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  const ledgersGot = world.ledgers.filter((l) => l.taken).length;
  ctx.fillText(`LEVEL ${levelIndex + 1}/3`, 12, 22);
  ctx.fillText(`SCORE ${score}`, 140, 22);
  ctx.fillText(`LEDGERS ${ledgersGot}/${world.ledgers.length}`, 300, 22);
  ctx.fillText(`PEBBLES ${player.pebbles}`, 470, 22);
  ctx.fillText(`STRIKES ${'✖'.repeat(strikes)}${'·'.repeat(Math.max(0, 3 - strikes))}`, 600, 22);
  ctx.fillText(`TIME ${Math.floor(levelTime)}s`, 760, 22);
  // Detection eye: worst guard meter.
  const worst = Math.max(0, ...guards.map((g) => g.detect));
  ctx.fillText('EYE', 880, 22);
  ctx.fillStyle = '#2b3548';
  ctx.fillRect(910, 12, 40, 10);
  ctx.fillStyle = worst > 0.66 ? '#ff3b30' : worst > 0.3 ? '#ffb35c' : '#35d07f';
  ctx.fillRect(910, 12, 40 * worst, 10);
}

function centerText(ctx, text, y, size, color, bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitle(ctx, game) {
  drawWorld(ctx, game);
  ctx.fillStyle = 'rgba(5,8,14,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'NIGHT LEDGER', 190, 56, '#e8c547');
  centerText(ctx, 'a stealth game — steal the ledger, leave unseen', 228, 19, '#d7dee9', false);
  centerText(ctx, 'WASD / arrows move · Shift sneak behind crates · click throws a pebble', 300, 16, '#aebdd2', false);
  centerText(ctx, 'Yellow cones are guard vision. Fill the eye and they chase. Three strikes and the night is over.', 326, 16, '#aebdd2', false);
  centerText(ctx, 'PRESS ANY KEY TO START', 410, 22, '#35d07f');
}

export function drawBanner(ctx, title, lines, accent = '#e8c547') {
  ctx.fillStyle = 'rgba(5,8,14,0.68)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, title, 230, 40, accent);
  lines.forEach((line, i) => centerText(ctx, line, 280 + i * 28, 17, '#d7dee9', false));
}
