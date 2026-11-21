// Night Ledger — shared constants: tiles, speeds, vision, scoring.
export const TILE = 32;
export const COLS = 30;
export const ROWS = 19;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

export const PLAYER_SPEED = 150;        // px/s walking
export const PLAYER_SNEAK_SPEED = 82;   // px/s sneaking
export const PLAYER_RADIUS = 11;

export const GUARD_PATROL_SPEED = 62;
export const GUARD_INVESTIGATE_SPEED = 96;
export const GUARD_CHASE_SPEED = 138;
export const GUARD_RADIUS = 12;
export const VISION_RANGE = 205;        // px
export const VISION_HALF_ANGLE = 0.62;  // radians, ~35.5 deg each side
export const HEAR_RUN_RADIUS = 118;     // guards hear a running player this close
export const HEAR_SNEAK_RADIUS = 34;

export const DETECT_FILL_NEAR = 1.9;    // per second at point blank, standing
export const DETECT_FILL_FAR = 0.55;    // per second at max range, standing
export const DETECT_SNEAK_FACTOR = 0.45;
export const DETECT_DECAY = 0.35;       // per second while unseen
export const PEBBLE_RANGE = 260;
export const PEBBLE_HEAR_RADIUS = 190;

export const SCORE_LEVEL = 1000;
export const SCORE_LEDGER = 500;
export const SCORE_COIN = 150;
export const SCORE_GHOST_BONUS = 800;   // never fully spotted on the level
export const SCORE_TIME_BONUS_PER_SEC = 6;

export const COLORS = {
  floorA: '#161c28',
  floorB: '#131926',
  wall: '#3a465e',
  wallTop: '#4c5b78',
  crate: '#6b5433',
  crateTop: '#8a6d42',
  exit: '#1f7a4d',
  exitGlow: '#35d07f',
  ledger: '#e8c547',
  coin: '#f2d06b',
  player: '#7fd4ff',
  playerSneak: '#4d9ec9',
  guard: '#ff7a6b',
  guardSuspicious: '#ffb35c',
  guardAlarmed: '#ff3b30',
  coneCalm: 'rgba(255, 214, 90, 0.16)',
  coneSuspicious: 'rgba(255, 160, 60, 0.24)',
  coneAlarmed: 'rgba(255, 70, 60, 0.30)',
};
