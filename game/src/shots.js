// Night Ledger — deterministic screenshot staging (?shot=title|play|alarm|win).
// Each scene drives the real game state, renders real frames, then flags ready.
import { TILE } from './config.js';

export function shotScene() {
  const q = new URLSearchParams(location.search);
  return q.get('shot');
}

export function stageShot(game, scene, startLevel, advance) {
  if (scene === 'title') {
    startLevel(0);
    game.mode = 'title';
    for (let i = 0; i < 40; i++) advance(1 / 30, true); // guards patrol behind the title
    game.mode = 'title';
  } else if (scene === 'play') {
    startLevel(0);
    game.mode = 'play';
    // Walk the thief mid-room, sneaking beside a crate, guard cone sweeping past.
    game.player.x = 10.5 * TILE; game.player.y = 12.5 * TILE;
    game.player.sneaking = true;
    game.guards[0].x = 14.5 * TILE; game.guards[0].y = 7.5 * TILE;
    game.guards[0].facing = Math.PI * 0.75;
    game.guards[0].detect = 0.3;
    game.guards[1].x = 24.5 * TILE; game.guards[1].y = 12.5 * TILE;
    game.guards[1].facing = Math.PI;
    game.score = 650;
    game.levelTime = 47;
  } else if (scene === 'alarm') {
    startLevel(1);
    game.mode = 'play';
    // Near miss: one guard suspicious with a pebble ripple, thief frozen in cover.
    game.player.x = 13.5 * TILE; game.player.y = 10.5 * TILE;
    game.player.sneaking = true;
    game.guards[0].x = 18.5 * TILE; game.guards[0].y = 6.5 * TILE;
    game.guards[0].facing = Math.PI * 0.55;
    game.guards[0].detect = 0.62;
    game.guards[0].state = 'investigate';
    game.guards[1].x = 16.5 * TILE; game.guards[1].y = 13.5 * TILE;
    game.guards[1].facing = -Math.PI / 2;
    game.guards[2].x = 9.5 * TILE; game.guards[2].y = 12.5 * TILE;
    game.guards[2].facing = 0;
    game.pebbles.push({ x: 20.5 * TILE, y: 8.5 * TILE, age: 0.35 });
    game.world.ledgers[0].taken = true;
    game.score = 2450;
    game.levelTime = 83;
    game.strikes = 1;
  } else if (scene === 'win') {
    startLevel(2);
    game.mode = 'play';
    game.player.x = 24.5 * TILE; game.player.y = 16.5 * TILE;
    game.world.ledgers.forEach((l) => { l.taken = true; });
    game.guards[0].x = 8.5 * TILE; game.guards[0].y = 7.5 * TILE;
    game.guards[0].facing = 0;
    game.guards[1].x = 18.5 * TILE; game.guards[1].y = 12.5 * TILE;
    game.guards[1].facing = Math.PI;
    game.score = 9250;
    game.levelTime = 121;
  }
}
