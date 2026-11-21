// Night Ledger — player movement, collision, pebble throws.
import {
  TILE, PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RADIUS, PEBBLE_RANGE,
} from './config.js';
import { isSolidTile } from './vision.js';

export function makePlayer(start) {
  return {
    x: (start.x + 0.5) * TILE,
    y: (start.y + 0.5) * TILE,
    facing: Math.PI / 2,
    sneaking: false,
    moving: false,
    stepPhase: 0,
    pebbles: 6,
    caught: false,
  };
}

function collides(world, x, y) {
  const r = PLAYER_RADIUS;
  const corners = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
  return corners.some(([cx, cy]) => isSolidTile(world, Math.floor(cx / TILE), Math.floor(cy / TILE)));
}

export function updatePlayer(world, p, input, dt) {
  let dx = 0, dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  p.sneaking = !!input.sneak;
  p.moving = dx !== 0 || dy !== 0;
  if (!p.moving) return;
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  p.facing = Math.atan2(dy, dx);
  const speed = p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
  const nx = p.x + dx * speed * dt;
  const ny = p.y + dy * speed * dt;
  if (!collides(world, nx, p.y)) p.x = nx;
  if (!collides(world, p.x, ny)) p.y = ny;
  p.stepPhase += dt * speed * 0.09;
}

// Throw a pebble toward (mx,my); returns the landing point or null.
export function throwPebble(world, p, mx, my) {
  if (p.pebbles <= 0) return null;
  const dx = mx - p.x, dy = my - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 12) return null;
  const t = Math.min(1, PEBBLE_RANGE / dist);
  let lx = p.x + dx * t, ly = p.y + dy * t;
  // Walk the arc back until the landing tile is open floor.
  for (let s = 1; s > 0.2; s -= 0.1) {
    const cx = p.x + (lx - p.x) * s, cy = p.y + (ly - p.y) * s;
    if (!isSolidTile(world, Math.floor(cx / TILE), Math.floor(cy / TILE))) { lx = cx; ly = cy; break; }
  }
  p.pebbles -= 1;
  p.facing = Math.atan2(dy, dx);
  return { x: lx, y: ly, age: 0 };
}
