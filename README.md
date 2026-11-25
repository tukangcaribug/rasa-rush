# RASA RUSH

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/tukangcaribug/rasa-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/tukangcaribug/rasa-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**RASA RUSH** is a fast top-down 2D cooking game built for make.fun's "Make the best cooking game" bounty.

You are a cook in a small Indonesian kitchen, and the orders never stop coming. Fetch ingredients, chop, cook, assemble, serve — and do it all before your customers lose patience.

This is version 2 of the game. It keeps everything that worked in v1 and adds difficulty levels, an endless mode, upgrades between shifts, VIP customers, a local high-score table, and touch controls.

## Quick facts

- **Bounty:** Make the best cooking game — best-cooking-game-20261125-0137
- **Prizes:** $250 in prizes, 1st place $60
- **Repo:** https://github.com/tukangcaribug/rasa-rush
- **License:** MIT
- **Built by:** an AI agent
- **Entry point:** `main.ts`
- **Runtime:** Node.js 22, standard library only
- **Build step:** none
- **External assets:** none — no downloads at runtime
- **Rendering:** HTML5 Canvas 2D
- **Sound:** synthesized with WebAudio — no audio files

## How to play

A standard shift lasts 180 seconds.

Orders appear on the order board. Each order belongs to a customer, and each customer has a patience timer. Serve the right dish before the timer runs out, and you earn coins and tips.

Let a customer wait too long and they leave angry. An angry customer means no coins, no tip, and a broken combo.

Your job, in order, looks like this:

1. Read the order on the order board.
2. Fetch the ingredients you need from the pantry.
3. Chop ingredients at the chopping board.
4. Cook ingredients at the stove.
5. Assemble the finished dish on a plate.
6. Carry the plate to the serving window.
7. Throw mistakes in the trash and start the next order.

That loop sounds simple. It is not simple when four orders are open, two stoves are busy, and a VIP is tapping their foot.

### The pantry

The pantry holds your ingredients. Walk up to it and take what the current orders ask for. Take only what you need — extra trips cost time.

### The chopping board

Some dishes need chopping before they can be cooked or served. Use the chopping board to prepare ingredients, then move them on.

### The stove

The stove cooks food, but it does not watch itself. Food left on the stove too long can burn. A burned dish is a wasted dish — throw it in the trash and start that order again.

### Plates and assembly

Dishes are assembled on plates. A plate with the right combination of prepared ingredients becomes a finished dish, ready for the window. A plate with the wrong combination is a mistake.

### The serving window

Carry finished dishes to the serving window to complete an order. Serving the right dish to the right customer earns coins, tips, and stars.

### The trash

Mistakes happen. Burned food, wrong combinations, and half-finished plates go in the trash. Clearing a mistake quickly is better than carrying it around while new orders pile up.

## Controls

- **Arrow keys** — move the cook around the kitchen.
- **Enter** — confirm and interact: start the game, select options, and serve at stations.
- **Mouse click** — works on buttons and stations.
- **Touch screens** — use the on-screen touch buttons.

The game is playable by keyboard and mouse, and by touch as well. On touch screens, the on-screen buttons move the cook and interact with stations, so no keyboard is needed.

## Recipes

There are 8 recipes in v2: 5 carried over from v1, plus 3 new ones.

1. **Nasi Goreng** — a v1 classic, fried rice from the heart of the menu.
2. **Mie Ayam** — chicken noodles, a fast favourite when orders stack up.
3. **Sate Bakar** — grilled skewers, straight off the stove.
4. **Gado-Gado** — a mixed vegetable dish with plenty of prep.
5. **Es Teh** — iced tea, a cool order on a hot shift.
6. **Ayam Geprek** — smashed fried chicken, new in v2.
7. **Soto Ayam** — chicken soup, new in v2.
8. **Es Jeruk** — iced orange drink, new in v2.

Each recipe has its own combination of ingredients and steps. Learning which dishes are quick and which need more prep is part of playing well.

New recipes in v2 add variety to the order board. A shift can now ask for a hot soup, a cold drink, and a grilled dish all at once.

## How scoring works

### Coins

Serving a correct dish earns coins. Faster service and correct orders are the steady way to build your total across a shift.

### Tips

Serve fast and correctly to earn tips on top of the coins. A customer served quickly, while still happy, tips better than one served at the last second.

### Combos

Serve several correct orders in a row without a mistake and you build a combo. Combos reward clean, consistent play. One angry customer or one wrong dish breaks the streak, so protect it.

### Stars

You can earn up to 3 stars per shift. Stars reflect how well the whole shift went — coins, tips, combos, and happy customers together.

### VIP customers

About 15% of orders come from VIP customers. VIPs pay double coins and double tips, so they are worth prioritising when the board is full.

### Best score

Your best score is saved locally in the browser. Beat your own record on the next shift, and the new best score replaces it.

## What is new in v2

Version 2 builds on v1 with these changes:

- 3 difficulty levels: Santai, Normal, and Rush.
- Endless mode: keep serving after the shift timer ends.
- 3 upgrades between shifts.
- VIP customers who pay double coins and double tips.
- A top-5 local high-score table.
- On-screen touch buttons for touch play.
- Customers now vary in patience.
- A bug fix from v1: arrow keys now move the cook reliably.

## Difficulty levels

Pick a difficulty before the shift starts:

- **Santai (relaxed)** — slower orders and more patient customers. A good place to learn the kitchen, the recipes, and the routes.
- **Normal (standard pace)** — the standard game. Orders arrive at a steady pace and customers expect timely service.
- **Rush (fast)** — fast orders and impatient customers. The board fills quickly, patience runs out quickly, and every second counts.

Santai is for learning. Normal is for a fair shift. Rush is for players who already know the menu by heart.

## Endless mode

Endless mode keeps serving as long as you can after the shift timer. When the standard shift ends, endless mode does not stop. Orders keep coming, customers keep arriving, and the kitchen keeps getting busier.

## Upgrades between shifts

Between shifts, you can choose from 3 upgrades:

- **Sepatu Cepat** — the cook moves faster around the kitchen.
- **Tungku Ekstra** — an extra stove, so you can cook more at once.
- **Pelanggan Sabar** — customers wait longer before leaving angry.

Spend upgrades wisely. Speed helps when orders are far apart. An extra stove helps when cooking is the bottleneck. Patient customers help when everything is busy at once.

## VIP customers, high scores, and touch play

VIP customers are about 15% of orders. They pay double coins and double tips, so when a VIP order and a regular order are both open, serve the VIP first.

The top-5 local high-score table keeps your best shifts in the browser. Five slots, ranked, so you can see at a glance whether the last shift made the table.

On-screen touch buttons make the game playable by touch as well as by keyboard and mouse. The buttons sit on screen, ready to move the cook and interact with stations.

Customers now vary in patience. Some are naturally hurried and need serving quickly. Some are relaxed and give you more time. Read the patience timer on each order — a hurried customer is a priority.

Bug fix from v1: arrow keys now move the cook reliably. Movement in v2 is dependable, so a missed step is your fault, not the controls.

## Tips for players

- Do not leave food on the stove. Burned food is wasted time, wasted ingredients, and a wasted order.
- Serve VIPs first. Double coins and double tips make them the most valuable orders on the board.
- Spend upgrades wisely. Pick the upgrade that fixes your weakest part of the shift, not just the one that sounds best.
- Keep your combo alive. A clean streak of correct serves is worth protecting — do not rush a wrong dish just to clear the board.
- Watch the patience timers, not just the order list. A hurried customer with a short timer matters more than an easy order from a relaxed customer.
- Plan your route. Pantry to board to stove to plate to window is a loop — walk it in order instead of criss-crossing the kitchen.
- Clear mistakes fast. Throw a burned or wrong dish in the trash right away and move on to the next order.
- Learn the quick dishes. When the board is full, a fast recipe served now beats a slow recipe served late.

## Tech notes

- **Rendering:** HTML5 Canvas 2D.
- **Sound:** WebAudio API for all sound — sound effects and music are synthesized, with no audio files.
- **Randomness:** seeded random for deterministic runs.
- **Assets:** zero external assets — no images, fonts, or audio files downloaded.
- **Node:** standard-library-only Node for the entry point and the server. No build step, no dependencies to install.

## Project structure

- `main.ts` — submission entry point, Node 22.
- `serve.ts` — tiny static server for local play.
- `game/index.html` — game page.
- `game/src/config.js` — recipes and tuning.
- `game/src/world.js` — kitchen world and stations.
- `game/src/main.js` — game loop and shift logic.
- `game/src/render.js` — canvas 2D rendering.
- `game/src/input.js` — keyboard, mouse and touch input.
- `game/src/audio.js` — WebAudio synthesized sound.
- `game/src/random.js` — seeded randomness.
- `game/src/shots.js` — screenshot autopilot.
- `shots.json` — named screenshot shots.
- `screenshots/` — dossier screenshots.
- `vendor/makefun-game.ts` — dossier builder.
- `LICENSE` — MIT.

## Deterministic screenshots and autopilot

The game accepts `?seed=` and `?shot=` URL parameters for reproducible runs. For example:

- `?shot=start&seed=1`
- `?shot=play&seed=1`
- `?shot=rush&seed=7`
- `?shot=end&seed=1`
- `?shot=upgrade&seed=3`
- `?shot=endless&seed=5`

The submission entry point `node main.ts` (with `MAKEFUN_OUTPUT_DIR` set) copies the game and screenshots into the output folder and writes a deterministic `dossier.json`. Two runs from the same repo write byte-identical `dossier.json`.

## How to play locally

You need Node.js 22.

Run the tiny static server with `node serve.ts` and open http://localhost:8080 in a desktop browser.

No build step is needed — open and play.

## License

MIT. See `LICENSE` for the full text.

## Links

- **Bounty:** https://make.fun/bounty/best-cooking-game-20261125-0137
- **Repo:** https://github.com/tukangcaribug/rasa-rush

Good luck in the kitchen — serve fast, serve right, and keep the stove from burning.

## What a good shift looks like

A good shift starts calm and ends busy. Early orders are simple, so use
them to learn the board and settle into the pantry-to-window loop.

As the shift goes on, orders stack up. That is when planning matters
most: start the slow dishes first, keep the stove busy, and serve the
quick dishes while the slow ones cook.

Watch the board, not just the station in front of you. The next order
is already forming while you serve the current one.

## A note on difficulty and endless mode

Santai teaches the game. Normal tests it. Rush punishes every wasted
step. Endless mode is where a strong Normal or Rush player finds out
how long they can really last.

Upgrades change the answer each time. A faster cook, an extra stove,
or more patient customers each open a different way to play the next
shift — pick the one that fits how you actually play, not the one that
sounds strongest on paper.

## Credits

RASA RUSH was built by an AI agent for the make.fun bounty
"Make the best cooking game" (best-cooking-game-20261125-0137).

Thanks for playing — now go serve something good.
