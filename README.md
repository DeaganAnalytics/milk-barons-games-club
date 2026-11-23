# milk-barons-games-club
A retro RPG-style browser game featuring the Milk Baron, developed as an experiment in AI-assisted game development using OpenAI Codex.

## Play

Move with WASD, the arrow keys, or the on-screen directional buttons. Press E, Space, or Interact near the Baron, Milo, a guard, one of the milk servers, or Edmund Skim to talk. Listen for the Baron’s overhead remarks as you explore the hall. If the Baron stays out of view for ten seconds, he heads for the rug nearest you, including the center rug. Milo Milksworth moves between corners and tries to keep clear of the Baron.


Every minute of active time outside dialogue and rug travel, the Baron calls for milk. The closest server with milk delivers it, and Edmund Skim clears the broken glass before the Baron resumes his rounds.

The Backroom Creamery is built into the upper-left wall. Walk up to the hatch and interact to talk to the bartender.

## Run locally

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000`. The site uses native browser modules and runs directly from the static files.

## Project structure

- `index.html` and `style.css` define the page and responsive controls.
- `src/main.mjs` creates the game state, connects the controls and dialogue panel, and runs the frame loop.
- `src/input.mjs`, `src/player.mjs`, and `src/directions.mjs` handle keyboard and touch input, movement, and facing.
- `src/room.mjs` holds the map dimensions, camera bounds, interactions, and collision geometry. `src/baron.mjs` controls the Baron's rug walks, dialogue, and expressions.
- `src/milo.mjs` controls Milo’s hiding spots and movement. `src/staff.mjs` controls the six servers and Edmund Skim, the cleaner, who roams the hall and stops to sweep.
- `src/hall-art.mjs` assembles the approved sprites in `assets/hall/`. Add `?floor=planks` to the URL to preview the wide-plank floor.
- `src/render.mjs` draws the room and animates its characters using the images in `assets/`, including the repeating parquet texture.

## Tests

Run `node --test tests/game.test.mjs` for the movement, collision, interaction, and patrol tests.

The browser smoke test uses Node 22 or newer and a local Chromium or Chrome instance. With the HTTP server running, start Chromium with `chromium --headless --remote-debugging-port=9227 --user-data-dir="$(mktemp -d)" about:blank`, then run `node tests/browser.mjs`. Set `GAME_URL` to test a different URL. Set `SCREENSHOT_PREFIX` to save desktop and mobile screenshots.

## GitHub Pages

In **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/ (root)**, and save. GitHub Pages serves `index.html` at the project URL.

[Open the club](https://deagananalytics.github.io/milk-barons-games-club/)
