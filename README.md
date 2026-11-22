# BRANKAS — Deck Heist

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/rektPanda/best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/rektPanda/best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A complete, original deck-builder roguelike card game that plays offline in a
desktop browser. Build a thief's deck, chain same-suit cards for the RANTAI
combo, and break into three heists — a gold shop, a casino, and a diamond
museum — beating 9 guards and 3 bosses before the crew gets caught.

- **44 unique cards** in 4 original suits (Berlian ◆, Api ▲, Koin ●, Brankas ■),
  each told apart by shape and colour
- **3 crews (factions)** with their own starter deck and passive: Kilat (fast),
  Besi (tank), Hantu (trickster)
- **RANTAI + SILANG combos**: chain same-suit cards for growing power, or mix
  suits for +1 energy once a turn
- **Readable opponents**: every enemy's next move is telegraphed, so you can
  block, weaken, stun, or race it down — each of the 3 bosses has a unique power
- **Deck-building + relics + shop**: draft 1 of 3 new cards after every fight,
  pick 1 of 2 relics after every boss, and spend gold between heists (heal,
  buy a card, remove the weakest card)
- **Score**: gold + fights won + surviving HP, with a saved best score
- Seeded runs, a built-in autopilot (`?auto=1`) that can win a full run, and
  deterministic screenshot scenes (`?shot=start|play|win|lose&seed=1`)

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Click a card to play it (or keys 1–9), Space ends the turn, Esc pauses,
M mutes. No network request: every file the game loads lives under `game/`.

## Hand-in

`main.ts` copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826).
Try make.fun yourself: https://make.fun/r/1e8h8xtg
