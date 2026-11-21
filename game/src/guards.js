// Night Ledger — guard AI: patrol, investigate, chase, search, return.
import {
  TILE, GUARD_PATROL_SPEED, GUARD_INVESTIGATE_SPEED, GUARD_CHASE_SPEED,
  DETECT_FILL_NEAR, DETECT_FILL_FAR, DETECT_SNEAK_FACTOR, DETECT_DECAY,
  HEAR_RUN_RADIUS, HEAR_SNEAK_RADIUS,
} from './config.js';
import { visibility, angleDiff, isSolidTile } from './vision.js';

export function makeGuard(def) {
  const first = def.patrol[0];
  return {
    x: (first[0] + 0.5) * TILE,
    y: (first[1] + 0.5) * TILE,
    patrol: def.patrol.map(([x, y]) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE })),
    wpIndex: 1 % def.patrol.length,
    facing: 0,
    state: 'patrol', // patrol | investigate | chase | search | return
    detect: 0,       // 0..1 suspicion meter
    targetX: 0, targetY: 0,
    waitTimer: 0,
    searchTimer: 0,
    lastSeenX: 0, lastSeenY: 0,
    stepPhase: Math.random() * Math.PI * 2,
  };
}

function moveToward(world, g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const want = Math.atan2(dy, dx);
  g.facing += Math.max(-3.4 * dt, Math.min(3.4 * dt, angleDiff(want, g.facing)));
  const step = Math.min(dist, speed * dt);
  const nx = g.x + Math.cos(want) * step;
  const ny = g.y + Math.sin(want) * step;
  // Slide along walls: try full move, then axis-separated.
  if (!isSolidTile(world, Math.floor(nx / TILE), Math.floor(ny / TILE))) { g.x = nx; g.y = ny; }
  else if (!isSolidTile(world, Math.floor(nx / TILE), Math.floor(g.y / TILE))) g.x = nx;
  else if (!isSolidTile(world, Math.floor(g.x / TILE), Math.floor(ny / TILE))) g.y = ny;
  g.stepPhase += dt * speed * 0.11;
  return dist - step < 6;
}

export function updateGuard(world, g, player, dt, events) {
  const vis = visibility(world, g, player);
  const distToPlayer = Math.hypot(player.x - g.x, player.y - g.y);

  // Detection meter.
  if (vis > 0) {
    let fill = DETECT_FILL_FAR + (DETECT_FILL_NEAR - DETECT_FILL_FAR) * vis;
    if (player.sneaking) fill *= DETECT_SNEAK_FACTOR;
    if (!player.moving) fill *= 0.8;
    g.detect = Math.min(1, g.detect + fill * dt);
    g.lastSeenX = player.x; g.lastSeenY = player.y;
  } else {
    g.detect = Math.max(0, g.detect - DETECT_DECAY * dt);
  }

  // Hearing: footsteps.
  const hearRadius = player.sneaking ? HEAR_SNEAK_RADIUS : HEAR_RUN_RADIUS;
  if (player.moving && distToPlayer < hearRadius && g.state === 'patrol') {
    g.state = 'investigate';
    g.targetX = player.x; g.targetY = player.y;
    g.detect = Math.max(g.detect, 0.45);
    events.push({ type: 'heard', guard: g });
  }

  if (g.detect >= 1 && g.state !== 'chase') {
    g.state = 'chase';
    events.push({ type: 'alarm', guard: g });
  } else if (g.detect > 0.45 && g.state === 'patrol') {
    g.state = 'investigate';
    g.targetX = g.lastSeenX; g.targetY = g.lastSeenY;
  }

  switch (g.state) {
    case 'patrol': {
      const wp = g.patrol[g.wpIndex];
      if (g.waitTimer > 0) {
        g.waitTimer -= dt;
        g.stepPhase += dt * 2.2; // keep the look-around sweep moving while paused
        g.facing += Math.sin(g.stepPhase * 0.4) * 0.5 * dt; // idle look-around
      } else if (moveToward(world, g, wp.x, wp.y, GUARD_PATROL_SPEED, dt)) {
        g.wpIndex = (g.wpIndex + 1) % g.patrol.length;
        g.waitTimer = 0.7;
      }
      break;
    }
    case 'investigate': {
      if (moveToward(world, g, g.targetX, g.targetY, GUARD_INVESTIGATE_SPEED, dt)) {
        g.state = 'search';
        g.searchTimer = 1.6;
      }
      if (g.detect <= 0.05 && vis === 0) g.state = 'return';
      break;
    }
    case 'chase': {
      moveToward(world, g, player.x, player.y, GUARD_CHASE_SPEED, dt);
      if (vis === 0) {
        g.searchTimer -= dt;
        if (g.searchTimer <= 0) { g.state = 'search'; g.searchTimer = 2.2; }
      } else {
        g.searchTimer = 1.1;
      }
      break;
    }
    case 'search': {
      g.facing += 1.9 * dt * (Math.sin(g.stepPhase * 0.7) > 0 ? 1 : -1);
      g.searchTimer -= dt;
      if (g.searchTimer <= 0) { g.state = 'return'; g.detect = Math.min(g.detect, 0.3); }
      break;
    }
    case 'return': {
      // Head to the nearest patrol waypoint, then resume the loop.
      let best = 0, bestD = Infinity;
      g.patrol.forEach((wp, i) => {
        const d = Math.hypot(wp.x - g.x, wp.y - g.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const wp = g.patrol[best];
      if (moveToward(world, g, wp.x, wp.y, GUARD_PATROL_SPEED, dt)) {
        g.wpIndex = (best + 1) % g.patrol.length;
        g.state = 'patrol';
      }
      break;
    }
  }
  return vis;
}

export function distractGuard(g, x, y) {
  if (g.state === 'chase') return false;
  g.state = 'investigate';
  g.targetX = x; g.targetY = y;
  g.detect = Math.max(g.detect, 0.35);
  return true;
}
