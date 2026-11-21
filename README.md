# Night Ledger

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/0xDimzy/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/0xDimzy/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

Night Ledger is an original top-down stealth game built for make.fun's "Make the best stealth game" bounty. You are a thief in a counting house at night: steal every ledger on the floor and reach the green exit without being caught. Three levels, rising from two sleepy guards to the four-guard Night Vault.

- **Vision cones:** guards patrol fixed routes with yellow vision cones clipped by walls. Standing in a cone fills that guard's suspicion; break line of sight and it drains, so a near miss is recoverable.
- **Cover:** walls block sight outright. Crates block sight only while you sneak (Shift) behind them — standing up shows over the top.
- **Detection states:** calm patrol → suspicious (investigates your last seen spot) → alarm (chases you). Lose them and they search, then walk back to their route.
- **Ears:** running footsteps are heard up close; sneaking is nearly silent. Click to throw one of your 6 pebbles — nearby guards go investigate the ripple.
- **Score:** ledgers, coins, level clears, a time bonus, and a Ghost bonus for finishing a level never fully spotted. Caught three times and the night is over.
- **Sound:** generated WebAudio footsteps, pebble clicks, suspicion chirps and alarm stings. M mutes.

## Controls

WASD / arrow keys move · Shift sneaks · mouse click throws a pebble · P pauses · R restarts the level · M mutes.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies the game and screenshots into the output directory and writes `dossier.json`. Or serve the game directly:

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## Screenshots

The four screenshots in `screenshots/` are real renders of the game itself, staged deterministically with `?shot=title|play|alarm|win` (see `game/src/shots.js`): the title over a live patrol, sneaking past a cone on Level 1, a Level 2 near miss with a pebble distraction, and the Night Vault win screen.

## Layout

`game/src/` splits one job per file: `config.js` (constants), `levels.js` (maps and patrols), `vision.js` (line of sight and cones), `guards.js` (guard AI), `player.js` (movement and pebbles), `input.js`, `audio.js`, `render.js`, `shots.js`, and `main.js` (the loop).
