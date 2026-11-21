// Night Ledger — line of sight and vision-cone geometry.
import { TILE, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';

export function tileKey(x, y) { return x + ',' + y; }

export function isSolidTile(world, tx, ty) {
  return world.walls.has(tileKey(tx, ty)) || world.crates.has(tileKey(tx, ty));
}

// Can a guard at (gx,gy) see a point (px,py)? Walls always block. Crates block
// only a sneaking player (crouching behind cover); a standing player shows over them.
export function hasLineOfSight(world, gx, gy, px, py, playerSneaking) {
  const dx = px - gx, dy = py - gy;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((gx + dx * t) / TILE);
    const ty = Math.floor((gy + dy * t) / TILE);
    if (world.walls.has(tileKey(tx, ty))) return false;
    if (playerSneaking && world.crates.has(tileKey(tx, ty))) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// 0 = unseen, otherwise a 0..1 "how visible" strength (closer = stronger).
export function visibility(world, guard, player) {
  const dx = player.x - guard.x, dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return 0;
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.facing)) > VISION_HALF_ANGLE && dist > 26) return 0;
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y, player.sneaking)) return 0;
  return 1 - dist / VISION_RANGE;
}

// Raycast fan used to draw the cone clipped by walls.
export function conePolygon(world, guard) {
  const rays = 26;
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i++) {
    const a = guard.facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / rays;
    let d = VISION_RANGE;
    for (let s = 8; s <= VISION_RANGE; s += 8) {
      const tx = Math.floor((guard.x + Math.cos(a) * s) / TILE);
      const ty = Math.floor((guard.y + Math.sin(a) * s) / TILE);
      if (world.walls.has(tileKey(tx, ty))) { d = s; break; }
    }
    pts.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return pts;
}
