// Night Ledger — game loop and state machine.
import { TILE, SCORE_LEVEL, SCORE_LEDGER, SCORE_COIN, SCORE_GHOST_BONUS, SCORE_TIME_BONUS_PER_SEC, PEBBLE_HEAR_RADIUS } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { makeGuard, updateGuard, distractGuard } from './guards.js';
import { makePlayer, updatePlayer, throwPebble } from './player.js';
import { makeInput, consumeFrame } from './input.js';
import { drawWorld, drawHud, drawTitle, drawBanner } from './render.js';
import { shotScene, stageShot } from './shots.js';
import {
  initAudio, toggleMute, isMuted, playFootstep, playPebble, playPickup,
  playCoin, playSuspicious, playAlarm, playCaught, playWin, playLevelClear,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput(canvas);

const game = {
  mode: 'title', // title | play | paused | caught | levelclear | gameover | win
  levelIndex: 0,
  world: null,
  player: null,
  guards: [],
  pebbles: [],
  score: 0,
  strikes: 0,
  levelTime: 0,
  spottedThisLevel: false,
  bannerTimer: 0,
  mutedNote: false,
};

function startLevel(index) {
  const level = LEVELS[index];
  game.levelIndex = index;
  game.world = parseLevel(level);
  game.player = makePlayer(game.world.playerStart);
  game.guards = level.guards.map(makeGuard);
  game.pebbles = [];
  game.levelTime = 0;
  game.spottedThisLevel = false;
  game.mode = 'play';
}

function tileOf(x, y) { return { x: Math.floor(x / TILE), y: Math.floor(y / TILE) }; }

function onLevelClear() {
  const par = 90 + game.levelIndex * 30;
  const timeBonus = Math.max(0, Math.round((par - game.levelTime) * SCORE_TIME_BONUS_PER_SEC));
  const ghost = game.spottedThisLevel ? 0 : SCORE_GHOST_BONUS;
  game.score += SCORE_LEVEL + timeBonus + ghost;
  game.lastBonus = { timeBonus, ghost };
  if (game.levelIndex >= LEVELS.length - 1) {
    game.mode = 'win';
    playWin();
  } else {
    game.mode = 'levelclear';
    playLevelClear();
  }
}

function onCaught() {
  game.strikes += 1;
  playCaught();
  game.mode = game.strikes >= 3 ? 'gameover' : 'caught';
}

function advance(dt, demoOnly = false) {
  const events = [];
  if (!demoOnly) updatePlayer(game.world, game.player, input, dt);
  if (game.player.moving) playFootstep(game.player.sneaking);
  for (const g of game.guards) updateGuard(game.world, g, game.player, dt, events);
  for (const ev of events) {
    if (ev.type === 'alarm') { game.spottedThisLevel = true; playAlarm(); }
    if (ev.type === 'heard') playSuspicious();
  }
  // Pebbles age out.
  for (const p of game.pebbles) p.age += dt;
  game.pebbles = game.pebbles.filter((p) => p.age < 1.2);
  if (demoOnly) return;
  game.levelTime += dt;

  // Pickups.
  const pt = tileOf(game.player.x, game.player.y);
  for (const l of game.world.ledgers) {
    if (!l.taken && l.x === pt.x && l.y === pt.y) {
      l.taken = true;
      game.score += SCORE_LEDGER;
      playPickup();
    }
  }
  for (const c of game.world.coins) {
    if (!c.taken && c.x === pt.x && c.y === pt.y) {
      c.taken = true;
      game.score += SCORE_COIN;
      playCoin();
    }
  }
  // Caught: a chasing guard touches the thief, or any guard walks into them.
  for (const g of game.guards) {
    const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
    if (d < 22 && (g.state === 'chase' || g.detect > 0.85)) { onCaught(); return; }
    if (d < 16) { onCaught(); return; }
  }
  // Exit needs every ledger.
  const allLedgers = game.world.ledgers.every((l) => l.taken);
  if (allLedgers && pt.x === game.world.exit.x && pt.y === game.world.exit.y) onLevelClear();
}

function render() {
  if (game.mode === 'title') { drawTitle(ctx, game); return; }
  drawWorld(ctx, game);
  drawHud(ctx, game);
  const level = LEVELS[game.levelIndex];
  if (game.mode === 'paused') {
    drawBanner(ctx, 'PAUSED', ['Press P to keep sneaking.']);
  } else if (game.mode === 'caught') {
    drawBanner(ctx, 'CAUGHT!', [
      `Strike ${game.strikes} of 3 — the guards drag you back to the door.`,
      'Press R or any key to retry the level.',
    ], '#ff7a6b');
  } else if (game.mode === 'levelclear') {
    const b = game.lastBonus || { timeBonus: 0, ghost: 0 };
    drawBanner(ctx, 'LEVEL CLEAR', [
      `${level.name} — ledger secured.`,
      `Time bonus +${b.timeBonus}${b.ghost ? ` · Ghost bonus +${b.ghost} (never spotted)` : ' · spotted, no ghost bonus'}`,
      `Score ${game.score} — press any key for ${LEVELS[game.levelIndex + 1].name}.`,
    ]);
  } else if (game.mode === 'gameover') {
    drawBanner(ctx, 'THE NIGHT IS OVER', [
      `Three strikes. Final score ${game.score}.`,
      'Press any key to start again from Level 1.',
    ], '#ff7a6b');
  } else if (game.mode === 'win') {
    drawBanner(ctx, 'ALL LEDGERS STOLEN', [
      `You ghosted the Night Vault. Final score ${game.score}.`,
      'Press any key to play again.',
    ], '#35d07f');
  } else if (game.levelTime < 4 && game.mode === 'play') {
    ctx.fillStyle = 'rgba(8,11,18,0.75)';
    ctx.fillRect(180, 520, 600, 52);
    ctx.fillStyle = '#e8c547';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(level.name, 480, 542);
    ctx.fillStyle = '#d7dee9';
    ctx.font = '13px sans-serif';
    ctx.fillText(level.brief, 480, 562);
  }
  if (isMuted()) {
    ctx.fillStyle = '#8fa1b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('MUTED (M)', 948, 598);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const f = consumeFrame(input);
  if (f.mutePressed) { initAudio(); toggleMute(); }

  if (game.mode === 'title') {
    advance(dt, true);
    if (f.anyKey && !shotMode) { initAudio(); startLevel(0); }
  } else if (game.mode === 'play') {
    if (f.pausePressed) game.mode = 'paused';
    else if (f.restartPressed) startLevel(game.levelIndex);
    else {
      if (f.clicked) {
        initAudio();
        const landing = throwPebble(game.world, game.player, f.mouseX, f.mouseY);
        if (landing) {
          game.pebbles.push(landing);
          playPebble();
          for (const g of game.guards) {
            if (Math.hypot(g.x - landing.x, g.y - landing.y) < PEBBLE_HEAR_RADIUS) distractGuard(g, landing.x, landing.y);
          }
        }
      }
      advance(dt);
    }
  } else if (game.mode === 'paused') {
    if (f.pausePressed) game.mode = 'play';
  } else if (game.mode === 'caught') {
    if (f.anyKey && !shotMode) startLevel(game.levelIndex);
  } else if (game.mode === 'levelclear') {
    if (f.anyKey && !shotMode) startLevel(game.levelIndex + 1);
  } else if (game.mode === 'gameover' || game.mode === 'win') {
    if (f.anyKey && !shotMode) { game.score = 0; game.strikes = 0; startLevel(0); }
  }
  render();
  requestAnimationFrame(frame);
}

// Boot: normal play, or a staged screenshot scene.
const scene = shotScene();
const shotMode = !!scene;
startLevel(0);
game.mode = 'title';
if (scene) {
  stageShot(game, scene, startLevel, advance);
  if (scene === 'win') { game.mode = 'win'; game.lastBonus = { timeBonus: 0, ghost: SCORE_GHOST_BONUS }; }
  render();
  // A few real frames so cones and ripples settle, then flag readiness.
  let frames = 0;
  const settle = () => {
    render();
    if (++frames >= 6) { window.__shotReady = true; return; }
    requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
} else {
  requestAnimationFrame(frame);
}
